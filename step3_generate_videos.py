import os
import sys
import cv2
import numpy as np
import subprocess
import math

sys.stdout.reconfigure(encoding='utf-8')

TARGET_W, TARGET_H = 720, 1110
FPS = 30
DURATION = 8  # 8 giây vòng lặp chuyển động mượt mà
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
        '-b:v', '2500k',
        '-movflags', '+faststart',
        out_path
    ]
    return subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def draw_star(img, center, size, color, alpha=1.0):
    overlay = img.copy()
    cx, cy = center
    pts = []
    for i in range(10):
        r = size if i % 2 == 0 else size * 0.4
        angle = i * np.pi / 5 - np.pi / 2
        pts.append([int(cx + r * np.cos(angle)), int(cy + r * np.sin(angle))])
    cv2.fillPoly(overlay, [np.array(pts, dtype=np.int32)], color)
    cv2.addWeighted(overlay, alpha, img, 1 - alpha, 0, img)

def generate_story_1(base_img, writer):
    # Trang 1: Xe đạp vàng, mũ bảo hiểm đỏ, nắng đẹp
    particles = [[np.random.randint(50, TARGET_W-50), np.random.randint(50, TARGET_H-50), np.random.uniform(0.5, 2.0)] for _ in range(30)]
    for f in range(TOTAL_FRAMES):
        t = f / FPS
        scale = 1.0 + 0.03 * np.sin(2 * np.pi * t / DURATION)
        M = cv2.getRotationMatrix2D((TARGET_W*0.6, TARGET_H*0.5), 0, scale)
        frame = cv2.warpAffine(base_img, M, (TARGET_W, TARGET_H))

        # Ánh sáng mặt trời lung linh
        sun_alpha = 0.12 + 0.06 * np.sin(2 * np.pi * t * 0.8)
        sun_overlay = frame.copy()
        cv2.circle(sun_overlay, (int(TARGET_W*0.8), int(TARGET_H*0.1)), 180, (200, 240, 255), -1)
        cv2.addWeighted(sun_overlay, sun_alpha, frame, 1 - sun_alpha, 0, frame)

        # Mũ bảo hiểm phát sáng (x ~ 62%, y ~ 45%)
        hx, hy = int(TARGET_W * 0.62), int(TARGET_H * 0.45)
        h_pulse = int(32 + 8 * np.sin(2 * np.pi * t * 1.5))
        h_overlay = frame.copy()
        cv2.circle(h_overlay, (hx, hy), h_pulse, (120, 200, 255), -1)
        cv2.addWeighted(h_overlay, 0.35, frame, 0.65, 0, frame)
        if int(t * 3) % 2 == 0:
            draw_star(frame, (hx - 15, hy - 15), 10, (255, 255, 255), 0.7)

        # Vành bánh xe lấp lánh (x ~ 63%, y ~ 85%)
        bx, by = int(TARGET_W * 0.63), int(TARGET_H * 0.85)
        wheel_angle = (t * 2 * np.pi * 1.2)
        wx = int(bx + 35 * np.cos(wheel_angle))
        wy = int(by + 35 * np.sin(wheel_angle))
        draw_star(frame, (wx, wy), 8, (100, 255, 255), 0.75)

        # Bụi nắng vàng trôi nhẹ
        for p in particles:
            p[1] = (p[1] - p[2]) % TARGET_H
            cv2.circle(frame, (int(p[0]), int(p[1])), 2, (180, 240, 255), -1)

        writer.stdin.write(frame.tobytes())

def generate_story_2(base_img, writer):
    # Trang 2: Biển báo Nguy hiểm có trẻ em (tam giác vàng)
    sign_cx, sign_cy = int(TARGET_W * 0.52), int(TARGET_H * 0.20)
    for f in range(TOTAL_FRAMES):
        t = f / FPS
        scale = 1.0 + 0.04 * np.sin(2 * np.pi * t / DURATION)
        M = cv2.getRotationMatrix2D((sign_cx, sign_cy), 0, scale)
        frame = cv2.warpAffine(base_img, M, (TARGET_W, TARGET_H))

        # Sóng radar cảnh báo vàng hổ phách tỏa ra từ biển báo
        overlay = frame.copy()
        for ring in range(3):
            phase = (t * 1.4 + ring * 0.33) % 1.0
            radius = int(30 + phase * 140)
            alpha = max(0, 0.6 * (1.0 - phase))
            cv2.circle(overlay, (sign_cx, sign_cy), radius, (0, 215, 255), 3)
            cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)

        # Ngôi sao lấp lánh 3 góc tam giác
        star_phase = int(t * 4) % 3
        corners = [(sign_cx, sign_cy - 45), (sign_cx - 45, sign_cy + 35), (sign_cx + 45, sign_cy + 35)]
        draw_star(frame, corners[star_phase], 12, (255, 255, 255), 0.85)

        writer.stdin.write(frame.tobytes())

def generate_story_3(base_img, writer):
    # Trang 3: Biển báo Cấm quẹo trái (tròn viền đỏ)
    sign_cx, sign_cy = int(TARGET_W * 0.31), int(TARGET_H * 0.17)
    for f in range(TOTAL_FRAMES):
        t = f / FPS
        frame = base_img.copy()

        # Hiệu ứng cảnh báo đỏ chớp nháy nhịp điệu
        red_flash = 0.5 + 0.5 * np.sin(2 * np.pi * t * 2.0)
        overlay = frame.copy()
        cv2.circle(overlay, (sign_cx, sign_cy), int(60 + 15 * red_flash), (50, 50, 255), -1)
        cv2.addWeighted(overlay, 0.35 * red_flash, frame, 1 - 0.35 * red_flash, 0, frame)

        # Vệt sáng lướt qua vạch gạch chéo
        slash_t = (t * 1.5) % 1.0
        sx = int((sign_cx - 35) + 70 * slash_t)
        sy = int((sign_cy - 35) + 70 * slash_t)
        draw_star(frame, (sx, sy), 9, (255, 255, 255), 0.9)

        # Vòng sóng cảnh báo
        ring_phase = (t * 1.5) % 1.0
        cv2.circle(frame, (sign_cx, sign_cy), int(40 + ring_phase * 100), (30, 30, 240), 2)

        writer.stdin.write(frame.tobytes())

def generate_story_4(base_img, writer):
    # Trang 4: Mai và Bác Hùng cùng đạp xe đi thẳng
    for f in range(TOTAL_FRAMES):
        t = f / FPS
        # Nhấp nhô đạp xe
        bounce_y = int(6 * np.sin(2 * np.pi * t * 2.0))
        M = np.float32([[1, 0, 0], [0, 1, bounce_y]])
        frame = cv2.warpAffine(base_img, M, (TARGET_W, TARGET_H))

        # Luồng gió và chuyển động trên đường
        for i in range(8):
            line_y = int(TARGET_H * 0.65 + i * 40)
            line_x = int((t * 600 + i * 140) % TARGET_W)
            cv2.line(frame, (line_x, line_y), (min(TARGET_W, line_x + 50), line_y), (255, 255, 255), 2)

        writer.stdin.write(frame.tobytes())

def generate_story_5(base_img, writer):
    # Trang 5: Biển Ưu tiên ô tô (xanh lục) & Ô tô trắng
    sign_cx, sign_cy = int(TARGET_W * 0.24), int(TARGET_H * 0.18)
    for f in range(TOTAL_FRAMES):
        t = f / FPS
        frame = base_img.copy()

        # Hào quang xanh lục phát sáng
        green_pulse = 0.5 + 0.5 * np.sin(2 * np.pi * t * 1.6)
        overlay = frame.copy()
        cv2.circle(overlay, (sign_cx, sign_cy), int(65 + 18 * green_pulse), (80, 220, 80), -1)
        cv2.addWeighted(overlay, 0.4 * green_pulse, frame, 1 - 0.4 * green_pulse, 0, frame)

        # Vệt sáng ô tô trắng phía sau (x ~ 55%, y ~ 41%)
        car_x = int(TARGET_W * 0.55 + 15 * np.sin(2 * np.pi * t * 0.8))
        car_y = int(TARGET_H * 0.41)
        draw_star(frame, (car_x, car_y), 10, (255, 255, 255), 0.8)

        writer.stdin.write(frame.tobytes())

def generate_story_6(base_img, writer):
    # Trang 6: Biển báo tốc độ 40 km/h (viền đỏ)
    sign_cx, sign_cy = int(TARGET_W * 0.19), int(TARGET_H * 0.18)
    for f in range(TOTAL_FRAMES):
        t = f / FPS
        frame = base_img.copy()

        # Nhịp đập số 40 (heartbeat)
        beat = math.exp(-((t * 2.5) % 1.0 - 0.2)**2 / 0.03)
        radius = int(55 + 25 * beat)
        overlay = frame.copy()
        cv2.circle(overlay, (sign_cx, sign_cy), radius, (50, 80, 255), -1)
        cv2.addWeighted(overlay, 0.45 * beat, frame, 1 - 0.45 * beat, 0, frame)

        # Sóng tốc độ tỏa ra
        wave_r = int((t * 120) % 150 + 40)
        cv2.circle(frame, (sign_cx, sign_cy), wave_r, (40, 60, 240), 2)

        writer.stdin.write(frame.tobytes())

def generate_story_7(base_img, writer):
    # Trang 7: Dòng xe đi thong thả
    for f in range(TOTAL_FRAMES):
        t = f / FPS
        scale = 1.0 + 0.03 * np.sin(2 * np.pi * t / DURATION)
        M = cv2.getRotationMatrix2D((TARGET_W*0.3, TARGET_H*0.4), 0, scale)
        frame = cv2.warpAffine(base_img, M, (TARGET_W, TARGET_H))

        # Luồng sóng xe lướt nhẹ nhàng
        for k in range(5):
            wx = int((t * 120 + k * 160) % TARGET_W)
            wy = int(TARGET_H * 0.32 + k * 18)
            cv2.circle(frame, (wx, wy), 5, (255, 220, 150), -1)

        writer.stdin.write(frame.tobytes())

def generate_story_8(base_img, writer):
    # Trang 8: Cổng The Green Park & Lá xanh rơi
    leaves = [[np.random.randint(20, TARGET_W-20), np.random.randint(-100, TARGET_H), np.random.uniform(1.2, 3.2), np.random.uniform(0, np.pi*2)] for _ in range(25)]
    for f in range(TOTAL_FRAMES):
        t = f / FPS
        frame = base_img.copy()

        # Bảng The Green Park lấp lánh (top center)
        gx, gy = int(TARGET_W * 0.40), int(TARGET_H * 0.10)
        draw_star(frame, (int(gx + 80 * np.sin(t*2)), gy), 10, (180, 255, 180), 0.75)

        # Lá cây bay lượn và xoay tròn
        for lf in leaves:
            lf[1] += lf[2]
            lf[0] += int(1.5 * np.sin(lf[1] * 0.03))
            lf[3] += 0.05
            if lf[1] > TARGET_H + 20:
                lf[1] = -20
                lf[0] = np.random.randint(20, TARGET_W-20)
            lx, ly = int(lf[0]), int(lf[1])
            # Vẽ hình lá oval nghiêng
            cv2.ellipse(frame, (lx, ly), (10, 5), int(np.degrees(lf[3])), 0, 360, (50, 180, 60), -1)

        # Chai nước lấp lánh giọt sương (x ~ 45%, y ~ 65%)
        wx, wy = int(TARGET_W * 0.45), int(TARGET_H * 0.65)
        if int(t * 3) % 2 == 0:
            draw_star(frame, (wx, wy), 8, (255, 255, 200), 0.8)

        writer.stdin.write(frame.tobytes())

def generate_story_9(base_img, writer):
    # Trang 9: Mai ngồi ghế đá & Pháo hoa giấy Confetti chúc mừng
    colors = [(50, 220, 255), (80, 240, 120), (255, 100, 180), (255, 220, 50)]
    confetti = [
        [np.random.randint(10, TARGET_W-10), np.random.randint(-150, TARGET_H),
         np.random.uniform(1.5, 4.0), colors[np.random.randint(0, len(colors))],
         np.random.uniform(0, 360)]
        for _ in range(45)
    ]
    sign1_pos = (int(TARGET_W * 0.28), int(TARGET_H * 0.58))  # Biển xanh người đi bộ
    sign2_pos = (int(TARGET_W * 0.38), int(TARGET_H * 0.56))  # Biển đỏ cấm đi ngược chiều

    for f in range(TOTAL_FRAMES):
        t = f / FPS
        frame = base_img.copy()

        # Hai biển báo mini trên tay Mai luân phiên phát sáng
        turn = int(t * 2) % 2
        active_pos = sign1_pos if turn == 0 else sign2_pos
        active_color = (240, 150, 50) if turn == 0 else (50, 50, 240)
        overlay = frame.copy()
        cv2.circle(overlay, active_pos, 35, active_color, -1)
        cv2.addWeighted(overlay, 0.45, frame, 0.55, 0, frame)
        draw_star(frame, active_pos, 10, (255, 255, 255), 0.85)

        # Hoa giấy Confetti rơi và xoay
        for c in confetti:
            c[1] += c[2]
            c[0] += int(1.2 * np.cos(c[1] * 0.04))
            c[4] += 5
            if c[1] > TARGET_H + 20:
                c[1] = -20
                c[0] = np.random.randint(10, TARGET_W-10)
            cx, cy = int(c[0]), int(c[1])
            cv2.ellipse(frame, (cx, cy), (8, 4), int(c[4]), 0, 360, c[3], -1)

        writer.stdin.write(frame.tobytes())

def main():
    print("=== BƯỚC 3: TẠO VIDEO HOẠT HÌNH MP4 CHO 9 TRANH MINH HỌA (GPU NVENC) ===")

    generators = [
        generate_story_1,
        generate_story_2,
        generate_story_3,
        generate_story_4,
        generate_story_5,
        generate_story_6,
        generate_story_7,
        generate_story_8,
        generate_story_9
    ]

    for i, gen_func in enumerate(generators, 1):
        in_img_path = f"assets/pages/story_{i}_left.jpg"
        out_mp4_path = f"assets/videos/story_{i}.mp4"

        print(f"-> Đang dựng video chuyển động Trang {i} ({out_mp4_path})...")
        img = cv2.imread(in_img_path)
        img_resized = cv2.resize(img, (TARGET_W, TARGET_H))

        writer = create_video_writer(out_mp4_path)
        gen_func(img_resized, writer)
        writer.stdin.close()
        writer.wait()

        size_kb = os.path.getsize(out_mp4_path) / 1024
        print(f"   ✓ Đã xuất video story_{i}.mp4 ({size_kb:.1f} KB, 30fps H.264)")

    print("\n✅ HOÀN TẤT TẠO TOÀN BỘ 9 VIDEO HOẠT HÌNH MP4!")

if __name__ == '__main__':
    main()
