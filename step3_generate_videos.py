import os
import sys
import cv2
import numpy as np
import subprocess
import math
import wave

sys.stdout.reconfigure(encoding='utf-8')

TARGET_W, TARGET_H = 720, 1110
FPS = 30
DURATION = 8  # 8 giây video vòng lặp mượt mà
TOTAL_FRAMES = FPS * DURATION

os.makedirs('assets/videos', exist_ok=True)

def create_video_writer(out_path):
    cmd = [
        'ffmpeg', '-y',
        '-f', 'rawvideo',
        '-vcodec', 'rawvideo',
        '-s', f'{TARGET_W}x{TARGET_H}',
        '-pix_fmt', 'bgr24',
        '-r', str(FPS),
        '-i', '-',
        '-c:v', 'h264_nvenc',
        '-pix_fmt', 'yuv420p',
        '-preset', 'p4',
        '-b:v', '2800k',
        '-movflags', '+faststart',
        out_path
    ]
    try:
        p = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return p
    except Exception:
        # Fallback to libx264 if nvenc not available
        cmd[cmd.index('h264_nvenc')] = 'libx264'
        cmd.insert(cmd.index('libx264') + 1, '-crf')
        cmd.insert(cmd.index('libx264') + 2, '20')
        return subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def get_audio_envelope(wav_path, duration=DURATION, fps=FPS):
    """Tính toán phong bì âm lượng (RMS envelope) từ file wav gốc để điều khiển mấp máy môi khớp giọng nói"""
    total_f = fps * duration
    if not os.path.exists(wav_path):
        return np.ones(total_f, dtype=np.float32) * 0.5
    try:
        wf = wave.open(wav_path, 'rb')
        sr = wf.getframerate()
        n_channels = wf.getnchannels()
        n_frames = wf.getnframes()
        data = wf.readframes(n_frames)
        wf.close()
        
        samples = np.frombuffer(data, dtype=np.int16).astype(np.float32)
        if n_channels > 1:
            samples = samples[::n_channels]
            
        # Chuẩn hóa
        max_val = np.max(np.abs(samples)) + 1e-6
        samples = np.abs(samples) / max_val
        
        envelope = np.zeros(total_f, dtype=np.float32)
        samples_per_f = int(sr / fps)
        
        for f in range(total_f):
            start = f * samples_per_f
            end = min(start + samples_per_f, len(samples))
            if start < len(samples) and end > start:
                rms = np.sqrt(np.mean(samples[start:end]**2))
                envelope[f] = min(1.0, rms * 3.5)
            else:
                envelope[f] = 0.0
                
        # Làm mịn nhẹ phong bì âm thanh
        kernel = np.ones(5) / 5
        envelope = np.convolve(envelope, kernel, mode='same')
        return envelope
    except Exception:
        return np.ones(total_f, dtype=np.float32) * 0.5

def animate_mouth(img, mx, my, open_amount, rx=20, ry=14):
    """Mấp máy môi tự nhiên theo nhịp điệu giọng đọc (không biến dạng khung hình ngoài)"""
    if open_amount < 0.05:
        return img
    h, w = img.shape[:2]
    
    y1 = max(0, int(my - ry * 1.6))
    y2 = min(h, int(my + ry * 2.0))
    x1 = max(0, int(mx - rx * 1.5))
    x2 = min(w, int(mx + rx * 1.5))
    
    roi = img[y1:y2, x1:x2].copy()
    rh, rw = roi.shape[:2]
    local_mx = mx - x1
    local_my = my - y1
    
    y_idx, x_idx = np.indices((rh, rw), dtype=np.float32)
    dx = (x_idx - local_mx) / rx
    dy = (y_idx - local_my) / ry
    dist_sq = dx*dx + dy*dy
    
    weight = np.exp(-dist_sq * 2.8)
    weight[dist_sq > 1.0] = 0
    
    vert_disp = np.zeros_like(y_idx)
    # Môi dưới hạ xuống theo độ mở, môi trên nhếch nhẹ tự nhiên
    vert_disp[y_idx >= local_my] = 4.2 * open_amount * weight[y_idx >= local_my]
    vert_disp[y_idx < local_my] = -1.0 * open_amount * weight[y_idx < local_my]
    
    map_x = x_idx.astype(np.float32)
    map_y = (y_idx - vert_disp).astype(np.float32)
    
    morphed = cv2.remap(roi, map_x, map_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    img[y1:y2, x1:x2] = morphed
    return img

def blink_eyes(img, eyes, t, blink_interval=3.6):
    """Chớp mắt tự nhiên định kỳ cho nhân vật"""
    phase = (t % blink_interval)
    # Chớp mắt trong khoảng 0.12s
    if phase > 0.12:
        return img
    blink_amt = np.sin(phase / 0.12 * np.pi)
    if blink_amt < 0.05:
        return img
        
    h, w = img.shape[:2]
    for (ex, ey) in eyes:
        erx, ery = 16, 13
        y1 = max(0, int(ey - ery * 1.4))
        y2 = min(h, int(ey + ery * 1.4))
        x1 = max(0, int(ex - erx * 1.4))
        x2 = min(w, int(ex + erx * 1.4))
        
        roi = img[y1:y2, x1:x2].copy()
        rh, rw = roi.shape[:2]
        lex = ex - x1
        ley = ey - y1
        
        y_idx, x_idx = np.indices((rh, rw), dtype=np.float32)
        dx = (x_idx - lex) / erx
        dy = (y_idx - ley) / ery
        dist_sq = dx*dx + dy*dy
        
        weight = np.exp(-dist_sq * 3.0)
        weight[dist_sq > 1.0] = 0
        
        vert_disp = np.zeros_like(y_idx)
        vert_disp[y_idx <= ley + 2] = 4.5 * blink_amt * weight[y_idx <= ley + 2]
        
        map_x = x_idx.astype(np.float32)
        map_y = (y_idx - vert_disp).astype(np.float32)
        morphed = cv2.remap(roi, map_x, map_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        img[y1:y2, x1:x2] = morphed
    return img

def draw_star(img, center, size, color, alpha=1.0):
    overlay = img.copy()
    cx, cy = center
    pts = []
    for i in range(8):
        r = size if i % 2 == 0 else size * 0.35
        angle = i * np.pi / 4 - np.pi / 2
        pts.append([int(cx + r * np.cos(angle)), int(cy + r * np.sin(angle))])
    cv2.fillPoly(overlay, [np.array(pts, dtype=np.int32)], color)
    cv2.addWeighted(overlay, alpha, img, 1 - alpha, 0, img)

def generate_story_1(base_img, writer):
    # Trang 1: Mai đội mũ bảo hiểm đỏ, xe đạp vàng
    env = get_audio_envelope('assets/audio/story_1.wav')
    mai_mouth = (255, 450)
    mai_eyes = [(222, 400), (285, 400)]
    hung_eyes = [(445, 205), (505, 205)]
    particles = [[np.random.randint(50, TARGET_W-50), np.random.randint(50, TARGET_H-50), np.random.uniform(0.5, 1.8)] for _ in range(25)]

    for f in range(TOTAL_FRAMES):
        t = f / FPS
        # Khung hình gốc KHÔNG BAO GIỜ zoom, luôn neo tĩnh 100%
        frame = base_img.copy()

        # 1. Mấp máy môi theo nhịp đọc
        mouth_open = env[f] * (0.35 + 0.65 * (np.sin(2 * np.pi * 3.5 * t)**2))
        frame = animate_mouth(frame, mai_mouth[0], mai_mouth[1], mouth_open, rx=18, ry=14)

        # 2. Chớp mắt tự nhiên
        frame = blink_eyes(frame, mai_eyes, t, blink_interval=3.8)
        frame = blink_eyes(frame, hung_eyes, t + 1.2, blink_interval=4.2)

        # 3. Tia nắng dịu mát
        sun_alpha = 0.08 + 0.04 * np.sin(2 * np.pi * t * 0.6)
        sun_overlay = frame.copy()
        cv2.circle(sun_overlay, (int(TARGET_W * 0.85), int(TARGET_H * 0.08)), 160, (210, 245, 255), -1)
        cv2.addWeighted(sun_overlay, sun_alpha, frame, 1 - sun_alpha, 0, frame)

        # 4. Quai mũ & khóa mũ bảo hiểm ánh vàng
        bx, by = int(TARGET_W * 0.35), int(TARGET_H * 0.49)
        if int(t * 2.5) % 2 == 0:
            draw_star(frame, (bx, by), 7, (255, 255, 255), 0.7)

        # 5. Nan hoa bánh xe đạp vàng lấp lánh nhẹ
        wx, wy = int(TARGET_W * 0.47), int(TARGET_H * 0.86)
        angle = t * 2 * np.pi * 1.0
        sx = int(wx + 45 * np.cos(angle))
        sy = int(wy + 45 * np.sin(angle))
        draw_star(frame, (sx, sy), 6, (120, 240, 255), 0.65)

        # 6. Hạt bụi nắng trôi nhẹ
        for p in particles:
            p[1] = (p[1] - p[2]) % TARGET_H
            cv2.circle(frame, (int(p[0]), int(p[1])), 2, (180, 240, 255), -1)

        writer.stdin.write(frame.tobytes())

def generate_story_2(base_img, writer):
    # Trang 2: Bác Hùng chỉ vào biển tam giác vàng Trẻ Em
    env = get_audio_envelope('assets/audio/story_2.wav')
    hung_mouth = (248, 472)
    hung_eyes = [(235, 390), (285, 390)]
    mai_eyes = [(545, 600), (595, 600)]
    sign_cx, sign_cy = int(TARGET_W * 0.77), int(TARGET_H * 0.21)

    for f in range(TOTAL_FRAMES):
        t = f / FPS
        frame = base_img.copy()

        # Bác Hùng nói chuyện: môi mấp máy rõ ràng
        mouth_open = env[f] * (0.4 + 0.6 * (np.sin(2 * np.pi * 3.8 * t)**2))
        frame = animate_mouth(frame, hung_mouth[0], hung_mouth[1], mouth_open, rx=20, ry=14)

        # Chớp mắt
        frame = blink_eyes(frame, hung_eyes, t, blink_interval=3.5)
        frame = blink_eyes(frame, mai_eyes, t + 1.5, blink_interval=4.0)

        # Sóng radar cảnh báo hổ phách tỏa ra từ biển báo trẻ em
        overlay = frame.copy()
        for ring in range(3):
            phase = (t * 1.2 + ring * 0.33) % 1.0
            radius = int(25 + phase * 130)
            alpha = max(0.0, 0.45 * (1.0 - phase))
            cv2.circle(overlay, (sign_cx, sign_cy), radius, (0, 215, 255), 3)
            cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)

        # Đốm sáng trên ngón tay chỉ đường
        hx, hy = int(TARGET_W * 0.58), int(TARGET_H * 0.47)
        pulse = 0.15 + 0.1 * np.sin(2 * np.pi * t * 2)
        cv2.circle(frame, (hx, hy), 8, (100, 240, 255), -1)

        writer.stdin.write(frame.tobytes())

def generate_story_3(base_img, writer):
    # Trang 3: Biển Cấm quẹo trái viền đỏ
    env = get_audio_envelope('assets/audio/story_3.wav')
    hung_mouth = (554, 295)
    hung_eyes = [(530, 248), (580, 248)]
    mai_eyes = [(225, 475), (255, 475)]
    sign_cx, sign_cy = int(TARGET_W * 0.33), int(TARGET_H * 0.12)

    for f in range(TOTAL_FRAMES):
        t = f / FPS
        frame = base_img.copy()

        # Bác Hùng nhắc nhở: mấp máy môi
        mouth_open = env[f] * (0.4 + 0.6 * (np.sin(2 * np.pi * 3.6 * t)**2))
        frame = animate_mouth(frame, hung_mouth[0], hung_mouth[1], mouth_open, rx=19, ry=13)

        # Chớp mắt
        frame = blink_eyes(frame, hung_eyes, t, blink_interval=3.7)
        frame = blink_eyes(frame, mai_eyes, t + 1.8, blink_interval=4.1)

        # Đèn viền cảnh báo đỏ dịu xung quanh biển cấm
        pulse = 0.2 + 0.15 * np.sin(2 * np.pi * t * 2.0)
        overlay = frame.copy()
        cv2.circle(overlay, (sign_cx, sign_cy), 80, (40, 40, 240), 6)
        cv2.addWeighted(overlay, pulse, frame, 1 - pulse, 0, frame)

        # Ánh sao cảnh báo nháy trên vạch đỏ gạch chéo
        if int(t * 3) % 2 == 0:
            draw_star(frame, (sign_cx - 15, sign_cy - 10), 8, (255, 255, 255), 0.75)

        writer.stdin.write(frame.tobytes())

def generate_story_4(base_img, writer):
    # Trang 4: Hai bác cháu tiếp tục đạp xe đi thẳng
    env = get_audio_envelope('assets/audio/story_4.wav')
    mai_mouth = (218, 508)
    mai_eyes = [(195, 455), (245, 455)]
    hung_mouth = (510, 315)
    hung_eyes = [(485, 265), (545, 265)]

    for f in range(TOTAL_FRAMES):
        t = f / FPS
        frame = base_img.copy()

        # Mai reo lên & Bác Hùng cười
        m_open = env[f] * (0.35 + 0.65 * (np.sin(2 * np.pi * 3.5 * t)**2))
        frame = animate_mouth(frame, mai_mouth[0], mai_mouth[1], m_open, rx=18, ry=13)

        frame = blink_eyes(frame, mai_eyes, t, blink_interval=3.6)
        frame = blink_eyes(frame, hung_eyes, t + 1.4, blink_interval=4.0)

        # Vệt sáng trôi trên vạch kẻ đường (tạo cảm giác xe đang lướt tới)
        dy = int((t * 180) % 120)
        cv2.line(frame, (int(TARGET_W*0.48), int(TARGET_H*0.75 + dy)), (int(TARGET_W*0.44), int(TARGET_H*0.82 + dy)), (255, 255, 255), 3)

        # Bánh xe lăn bánh: nan hoa lấp lánh
        for bx, by, r in [(int(TARGET_W*0.28), int(TARGET_H*0.82), 40), (int(TARGET_W*0.80), int(TARGET_H*0.82), 45)]:
            ang = t * 2 * np.pi * 1.5
            sx = int(bx + r * np.cos(ang))
            sy = int(by + r * np.sin(ang))
            draw_star(frame, (sx, sy), 5, (100, 240, 255), 0.65)

        writer.stdin.write(frame.tobytes())

def generate_story_5(base_img, writer):
    # Trang 5: Làn đường ưu tiên xe ô tô - xe ô tô trắng di chuyển
    env = get_audio_envelope('assets/audio/story_5.wav')
    hung_mouth = (605, 415)
    hung_eyes = [(580, 375), (630, 375)]
    mai_eyes = [(330, 590), (375, 590)]
    sign_cx, sign_cy = int(TARGET_W * 0.21), int(TARGET_H * 0.17)

    # Vùng xe ô tô màu trắng trên đường: x ~ [310..490], y ~ [365..460]
    car_roi = base_img[365:460, 310:490].copy()

    for f in range(TOTAL_FRAMES):
        t = f / FPS
        frame = base_img.copy()

        # Bác Hùng giải thích: môi mấp máy
        mouth_open = env[f] * (0.4 + 0.6 * (np.sin(2 * np.pi * 3.7 * t)**2))
        frame = animate_mouth(frame, hung_mouth[0], hung_mouth[1], mouth_open, rx=19, ry=13)

        frame = blink_eyes(frame, hung_eyes, t, blink_interval=3.7)
        frame = blink_eyes(frame, mai_eyes, t + 1.2, blink_interval=4.0)

        # Biển tròn xanh lục ưu tiên xe ô tô phát ánh sáng xanh ngọc
        pulse = 0.18 + 0.12 * np.sin(2 * np.pi * t * 1.2)
        overlay = frame.copy()
        cv2.circle(overlay, (sign_cx, sign_cy), 85, (70, 220, 100), 5)
        cv2.addWeighted(overlay, pulse, frame, 1 - pulse, 0, frame)

        # Chuyển động xe ô tô trắng lăn bánh nhẹ nhàng trên đường theo luật
        car_shift_x = int(6.0 * np.sin(2 * np.pi * t * 0.8))
        car_shift_y = int(2.0 * np.sin(2 * np.pi * t * 0.8))
        
        # Đặt lại xe vào vị trí có độ nhấp nhô di chuyển chân thực
        cx1, cx2 = 310 + car_shift_x, 490 + car_shift_x
        cy1, cy2 = 365 + car_shift_y, 460 + car_shift_y
        if 0 <= cy1 and cy2 <= TARGET_H and 0 <= cx1 and cx2 <= TARGET_W:
            frame[cy1:cy2, cx1:cx2] = car_roi

        writer.stdin.write(frame.tobytes())

def generate_story_6(base_img, writer):
    # Trang 6: Biển báo tốc độ 40 km/h
    env = get_audio_envelope('assets/audio/story_6.wav')
    hung_mouth = (540, 375)
    hung_eyes = [(505, 325), (570, 325)]
    mai_mouth = (310, 575)
    mai_eyes = [(270, 545), (320, 545)]
    sign_cx, sign_cy = int(TARGET_W * 0.16), int(TARGET_H * 0.14)

    for f in range(TOTAL_FRAMES):
        t = f / FPS
        frame = base_img.copy()

        # Bác Hùng giải thích tốc độ tối đa
        m_open = env[f] * (0.4 + 0.6 * (np.sin(2 * np.pi * 3.8 * t)**2))
        frame = animate_mouth(frame, hung_mouth[0], hung_mouth[1], m_open, rx=20, ry=14)

        # Mai hỏi
        frame = blink_eyes(frame, hung_eyes, t, blink_interval=3.8)
        frame = blink_eyes(frame, mai_eyes, t + 1.6, blink_interval=3.5)

        # Vòng sóng radar an toàn tỏa ra từ biển 40
        overlay = frame.copy()
        for ring in range(3):
            phase = (t * 1.1 + ring * 0.33) % 1.0
            radius = int(30 + phase * 120)
            alpha = max(0.0, 0.45 * (1.0 - phase))
            cv2.circle(overlay, (sign_cx, sign_cy), radius, (50, 80, 255), 3)
            cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)

        # Ánh sao nhấp nháy trên số 40
        if int(t * 2) % 2 == 0:
            draw_star(frame, (sign_cx, sign_cy), 8, (255, 255, 255), 0.75)

        writer.stdin.write(frame.tobytes())

def generate_story_7(base_img, writer):
    # Trang 7: Xe cộ thong thả tuân thủ tốc độ 40 km/h
    env = get_audio_envelope('assets/audio/story_7.wav')
    mai_eyes = [(200, 615), (250, 615)]
    hung_eyes = [(430, 315), (510, 315)]

    for f in range(TOTAL_FRAMES):
        t = f / FPS
        frame = base_img.copy()

        frame = blink_eyes(frame, mai_eyes, t, blink_interval=3.8)
        frame = blink_eyes(frame, hung_eyes, t + 1.3, blink_interval=4.1)

        # Các xe phía sau chuyển động thong thả, an toàn
        # Xe đỏ giữa đường (x ~ 360..470, y ~ 360..470)
        drift = int(4.0 * np.sin(2 * np.pi * t * 0.7))
        # Ánh sáng phản chiếu trên kính xe hơi
        draw_star(frame, (int(TARGET_W*0.52 + drift), int(TARGET_H*0.41)), 6, (255, 255, 255), 0.6)
        draw_star(frame, (int(TARGET_W*0.15), int(TARGET_H*0.43)), 6, (255, 255, 255), 0.6)

        # Không gian nắng vàng êm đềm
        sun_alpha = 0.06 + 0.03 * np.sin(2 * np.pi * t * 0.8)
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (TARGET_W, int(TARGET_H*0.4)), (200, 240, 255), -1)
        cv2.addWeighted(overlay, sun_alpha, frame, 1 - sun_alpha, 0, frame)

        writer.stdin.write(frame.tobytes())

def generate_story_8(base_img, writer):
    # Trang 8: Cổng công viên The Green Park & bình nước mát
    env = get_audio_envelope('assets/audio/story_8.wav')
    mai_mouth = (252, 488)
    mai_eyes = [(225, 465), (275, 465)]
    hung_eyes = [(505, 340), (560, 340)]
    leaves = [[np.random.randint(50, TARGET_W-50), np.random.randint(50, 400), np.random.uniform(0.6, 2.0), np.random.uniform(-1.0, 1.0)] for _ in range(20)]

    for f in range(TOTAL_FRAMES):
        t = f / FPS
        frame = base_img.copy()

        m_open = env[f] * (0.3 + 0.6 * (np.sin(2 * np.pi * 3.5 * t)**2))
        frame = animate_mouth(frame, mai_mouth[0], mai_mouth[1], m_open, rx=17, ry=13)

        frame = blink_eyes(frame, mai_eyes, t, blink_interval=3.6)
        frame = blink_eyes(frame, hung_eyes, t + 1.5, blink_interval=4.0)

        # Bình nước mát lấp lánh giọt sương và ánh mặt trời
        bot_x, bot_y = int(TARGET_W * 0.41), int(TARGET_H * 0.65)
        if int(t * 3) % 2 == 0:
            draw_star(frame, (bot_x, bot_y), 7, (255, 255, 255), 0.85)

        # Lá cây công viên nhẹ rơi trong gió
        for leaf in leaves:
            leaf[1] = (leaf[1] + leaf[2]) % 650
            leaf[0] = (leaf[0] + leaf[3] * np.sin(t * 3)) % TARGET_W
            cv2.ellipse(frame, (int(leaf[0]), int(leaf[1])), (4, 2), int(t*45), 0, 360, (60, 160, 80), -1)

        writer.stdin.write(frame.tobytes())

def generate_story_9(base_img, writer):
    # Trang 9: Bé Mai say sưa kể chuyện trên ghế đá & 2 biển báo mini
    env = get_audio_envelope('assets/audio/story_9.wav')
    mai_mouth = (214, 505)
    mai_eyes = [(175, 470), (235, 470)]
    hung_mouth = (485, 365)
    hung_eyes = [(430, 305), (510, 305)]
    colors = [(255, 215, 0), (255, 105, 180), (100, 240, 255)]
    confetti = [[np.random.randint(50, TARGET_W-50), np.random.randint(50, TARGET_H-50), np.random.uniform(0.5, 1.8), colors[np.random.randint(0, len(colors))]] for _ in range(25)]

    for f in range(TOTAL_FRAMES):
        t = f / FPS
        frame = base_img.copy()

        # Mai hào hứng say sưa kể lại: môi mấp máy rất sinh động
        m_open = env[f] * (0.45 + 0.55 * (np.sin(2 * np.pi * 3.8 * t)**2))
        frame = animate_mouth(frame, mai_mouth[0], mai_mouth[1], m_open, rx=19, ry=14)

        # Bác Hùng mỉm cười gật đầu
        frame = blink_eyes(frame, mai_eyes, t, blink_interval=3.5)
        frame = blink_eyes(frame, hung_eyes, t + 1.3, blink_interval=4.0)

        # Hai biển báo mini trên tay Mai tỏa ánh sao lấp lánh tri thức
        draw_star(frame, (int(TARGET_W * 0.24), int(TARGET_H * 0.57)), 7, (255, 255, 255), 0.8)
        draw_star(frame, (int(TARGET_W * 0.32), int(TARGET_H * 0.55)), 7, (255, 255, 255), 0.8)

        # Bụi phấn hoa / hoa cỏ công viên bay nhẹ
        for c in confetti:
            c[1] = (c[1] - c[2]) % TARGET_H
            cv2.circle(frame, (int(c[0]), int(c[1])), 2, c[3], -1)

        writer.stdin.write(frame.tobytes())

GENERATORS = {
    1: generate_story_1,
    2: generate_story_2,
    3: generate_story_3,
    4: generate_story_4,
    5: generate_story_5,
    6: generate_story_6,
    7: generate_story_7,
    8: generate_story_8,
    9: generate_story_9
}

def main():
    print("=== BƯỚC 3: TẠO VIDEO HOẠT CẢNH KHÔNG BỊ TÁCH KHUNG & MÔI MẤP MÁY CHUẨN XÁC ===")
    for page_num in range(1, 10):
        img_path = f"assets/pages/story_{page_num}_left.jpg"
        out_mp4 = f"assets/videos/story_{page_num}.mp4"
        
        if not os.path.exists(img_path):
            print(f"Bỏ qua trang {page_num}: không tìm thấy {img_path}")
            continue

        print(f"-> Đang kết xuất video Page {page_num}...")
        img = cv2.imread(img_path)
        img = cv2.resize(img, (TARGET_W, TARGET_H), interpolation=cv2.INTER_LANCZOS4)

        writer = create_video_writer(out_mp4)
        gen_func = GENERATORS.get(page_num, generate_story_1)
        gen_func(img, writer)

        writer.stdin.close()
        writer.wait()
        
        size_kb = os.path.getsize(out_mp4) / 1024
        print(f"   ✓ Đã hoàn thành {out_mp4} ({size_kb:.1f} KB)")

    print("\n✅ HOÀN TẤT TẠO TOÀN BỘ 9 VIDEO HOẠT HÌNH KHÔNG ZOOM VÀ MÔI MẤP MÁY!")

if __name__ == '__main__':
    main()
