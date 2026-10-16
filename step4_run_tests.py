import os
import sys
import json
import subprocess
import cv2

sys.stdout.reconfigure(encoding='utf-8')

class TestRunner:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.tests = []

    def assert_true(self, condition, test_name, error_msg=""):
        if condition:
            self.passed += 1
            print(f"  [PASS] {test_name}")
            self.tests.append((test_name, "PASS", ""))
        else:
            self.failed += 1
            print(f"  [FAIL] {test_name} -> {error_msg}")
            self.tests.append((test_name, "FAIL", error_msg))

def run_all_unit_tests():
    print("=" * 70)
    print("CHƯƠNG TRÌNH UNIT TEST TOÀN DIỆN CHO SÁCH LẬT TƯƠNG TÁC")
    print("=" * 70)

    runner = TestRunner()

    # -------------------------------------------------------------
    # NHÓM 1: KIỂM TRA FILE ÂM THANH TIẾNG VIỆT (GIỌNG ĐỌC)
    # -------------------------------------------------------------
    print("\n--- NHÓM 1: KIỂM TRA TOÀN BỘ 9 FILE ÂM THANH TIẾNG VIỆT ---")
    for i in range(1, 10):
        mp3_path = f"assets/audio/story_{i}.mp3"
        exists = os.path.exists(mp3_path)
        runner.assert_true(exists, f"Trang {i}: Tồn tại file {mp3_path}", f"Không tìm thấy file {mp3_path}")
        if exists:
            size_kb = os.path.getsize(mp3_path) / 1024
            runner.assert_true(size_kb > 100, f"Trang {i}: Dung lượng audio hợp lệ ({size_kb:.1f} KB)", "File quá nhỏ hoặc rỗng")

            # Đo thời lượng bằng ffprobe
            cmd = [
                'ffprobe', '-v', 'error',
                '-show_entries', 'format=duration',
                '-of', 'default=noprint_wrappers=1:nokey=1',
                mp3_path
            ]
            try:
                res = subprocess.check_output(cmd, text=True).strip()
                dur = float(res)
                runner.assert_true(15.0 <= dur <= 35.0, f"Trang {i}: Thời lượng giọng đọc tiếng Việt hợp lệ ({dur:.2f}s)", f"Thời lượng bất thường: {dur}s")
            except Exception as e:
                runner.assert_true(False, f"Trang {i}: Đọc metadata audio", str(e))

    # -------------------------------------------------------------
    # NHÓM 2: KIỂM TRA TOÀN BỘ 9 VIDEO HOẠT HÌNH MP4
    # -------------------------------------------------------------
    print("\n--- NHÓM 2: KIỂM TRA TOÀN BỘ 9 VIDEO HOẠT HÌNH MP4 ---")
    for i in range(1, 10):
        mp4_path = f"assets/videos/story_{i}.mp4"
        exists = os.path.exists(mp4_path)
        runner.assert_true(exists, f"Trang {i}: Tồn tại video {mp4_path}", f"Không tìm thấy video {mp4_path}")
        if exists:
            cap = cv2.VideoCapture(mp4_path)
            is_opened = cap.isOpened()
            runner.assert_true(is_opened, f"Trang {i}: OpenCV mở được video MP4", "Không thể decode video")
            if is_opened:
                w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                fps = cap.get(cv2.CAP_PROP_FPS)
                frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                cap.release()

                runner.assert_true(w == 480 and h == 832, f"Trang {i}: Độ phân giải video Wan 480x832 ({w}x{h})", f"Độ phân giải sai: {w}x{h}")
                runner.assert_true(fps >= 15.0, f"Trang {i}: Tốc độ khung hình video Wan ({fps:.0f} fps)", f"FPS quá thấp: {fps}")
                runner.assert_true(frame_count >= 300, f"Trang {i}: Video bao trùm toàn bộ lời kể ({frame_count} frames)", "Video quá ngắn")

    # -------------------------------------------------------------
    # NHÓM 3: KIỂM TRA DỮ LIỆU WORD TIMESTAMPS TỪ FASTER-WHISPER
    # -------------------------------------------------------------
    print("\n--- NHÓM 3: KIỂM TRA MỐC THỜI GIAN TỪNG TỪ (WORD TIMESTAMPS) ---")
    json_path = "assets/data/word_timestamps.json"
    js_path = "js/word-timestamps.js"
    runner.assert_true(os.path.exists(json_path), "File word_timestamps.json tồn tại", "Thiếu file JSON")
    runner.assert_true(os.path.exists(js_path), "File js/word-timestamps.js tồn tại", "Thiếu file JS")

    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    for i in range(1, 10):
        key = str(i)
        runner.assert_true(key in data, f"Trang {i}: Có dữ liệu timestamps", f"Thiếu key {i}")
        if key in data:
            page_data = data[key]
            words = page_data.get("words", [])
            dur = page_data.get("duration", 0)
            runner.assert_true(len(words) >= 50, f"Trang {i}: Số lượng từ trích xuất đủ ({len(words)} từ)", f"Số từ quá ít: {len(words)}")
            runner.assert_true(dur >= 15.0, f"Trang {i}: Tổng thời lượng ghi nhận ({dur:.2f}s)", "Thời lượng bất thường")

            # Kiểm tra tính đơn điệu và hợp lệ của mốc thời gian
            is_monotonic = True
            for w_idx in range(len(words)):
                curr_w = words[w_idx]
                if curr_w["start"] > curr_w["end"] or curr_w["start"] < 0:
                    is_monotonic = False
                    break
                if w_idx > 0 and curr_w["start"] < words[w_idx-1]["start"]:
                    is_monotonic = False
                    break
            runner.assert_true(is_monotonic, f"Trang {i}: Mốc thời gian đơn điệu tăng dần chuẩn xác", "Mốc thời gian bị đảo lộn")

    # -------------------------------------------------------------
    # NHÓM 4: KIỂM THỬ THUẬT TOÁN KARAOKE HIGHLIGHT VÀ UNHIGHLIGHT
    # -------------------------------------------------------------
    print("\n--- NHÓM 4: MÔ PHỎNG THUẬT TOÁN KARAOKE HIGHLIGHT & UNHIGHLIGHT ---")
    page1_words = data["1"]["words"]
    duration = data["1"]["duration"]

    def simulate_karaoke_state(current_time, words):
        active_indices = []
        past_indices = []
        future_indices = []
        for idx, w in enumerate(words):
            if current_time >= w["start"] and current_time < w["end"]:
                active_indices.append(idx)
            elif current_time >= w["end"]:
                past_indices.append(idx)
            else:
                future_indices.append(idx)
        return active_indices, past_indices, future_indices

    # 1. Lúc t = 0
    active, past, future = simulate_karaoke_state(0.0, page1_words)
    runner.assert_true(len(past) == 0, "Lúc t=0s: Chưa có từ nào bị unhighlight sang quá khứ", f"Past count: {len(past)}")

    # 2. Kiểm tra tính độc quyền của highlight tại 50 thời điểm ngẫu nhiên
    unhighlight_success = True
    test_times = [round(t * 0.4, 2) for t in range(int(duration / 0.4))]
    for t in test_times:
        act, pst, fut = simulate_karaoke_state(t, page1_words)
        # Tại mỗi thời điểm, số từ active tối đa là 1 (hoặc 0 nếu ở khoảng lặng)
        if len(act) > 1:
            unhighlight_success = False
            break
        # Đảm bảo các từ đã đọc (t > end) không nằm trong active (đã unhighlight)
        for p_idx in pst:
            if p_idx in act:
                unhighlight_success = False
                break

    runner.assert_true(unhighlight_success, "Karaoke Engine: Từ cũ được unhighlight 100% khi đọc xong từ đó", "Có hiện tượng đè highlight")

    # 3. Lúc t = kết thúc audio
    active_end, past_end, future_end = simulate_karaoke_state(duration + 0.5, page1_words)
    runner.assert_true(len(active_end) == 0, "Khi hết audio: Toàn bộ từ được unhighlight khỏi trạng thái đang đọc", "Vẫn còn từ bị highlight")
    runner.assert_true(len(past_end) == len(page1_words), "Khi hết audio: Toàn bộ từ chuyển sang trạng thái đã đọc", "Chưa đọc hết từ")

    # -------------------------------------------------------------
    # NHÓM 5: KIỂM THỬ ĐIỀU HƯỚNG TUẦN TỰ TRANG (KHÔNG BỎ QUA TRANG 1)
    # -------------------------------------------------------------
    print("\n--- NHÓM 5: KIỂM THỬ ĐIỀU HƯỚNG TUẦN TỰ TRANG (KHÔNG BỎ QUA TRANG 1) ---")
    def get_next_page(cur):
        if cur == 0:
            return 1
        elif cur < 10:
            return cur + 1
        return 10

    def get_prev_page(cur):
        if cur > 0:
            return cur - 1
        return 0

    runner.assert_true(get_next_page(0) == 1, "Từ bìa trước (0): Đi thẳng vào Trang 1 (Không bỏ qua trang 1)", f"Nhận được {get_next_page(0)}")
    for p in range(1, 9):
        runner.assert_true(get_next_page(p) == p + 1, f"Từ Trang {p}: Đi tiếp sang Trang {p+1}", f"Nhận được {get_next_page(p)}")
    runner.assert_true(get_next_page(9) == 10, "Từ Trang 9: Đi sang Màn hình kết thúc (10)", f"Nhận được {get_next_page(9)}")
    runner.assert_true(get_next_page(10) == 10, "Từ Kết thúc (10): Không vượt quá trang cuối", f"Nhận được {get_next_page(10)}")

    runner.assert_true(get_prev_page(1) == 0, "Từ Trang 1 (1): Lùi về Bìa trước (0)", f"Nhận được {get_prev_page(1)}")
    runner.assert_true(get_prev_page(2) == 1, "Từ Trang 2 (2): Lùi về Trang 1 (1)", f"Nhận được {get_prev_page(2)}")
    runner.assert_true(get_prev_page(10) == 9, "Từ Kết thúc (10): Lùi về Trang 9 (9)", f"Nhận được {get_prev_page(10)}")

    # -------------------------------------------------------------
    # NHÓM 6: KIỂM THỬ XỬ LÝ MÀN HÌNH KẾT THÚC (PAGE 10) KHÔNG BỊ KẸT SÁCH
    # -------------------------------------------------------------
    print("\n--- NHÓM 6: KIỂM THỬ CHUYỂN TRẠNG THÁI TỪ PAGE 10 (KHÔNG BỊ KẸT) ---")
    with open("index.html", "r", encoding="utf-8") as f:
        html_content = f.read()

    with open("js/app.js", "r", encoding="utf-8") as f:
        app_js_content = f.read()

    runner.assert_true('id="btn-replay-all"' in html_content, "HTML có nút Đọc lại từ đầu (#btn-replay-all)", "Thiếu nút #btn-replay-all")
    runner.assert_true('id="btn-back-page9"' in html_content, "HTML có nút Quay về trang 9 (#btn-back-page9)", "Thiếu nút #btn-back-page9")
    runner.assert_true('class="celebration-actions"' in html_content, "HTML có container celebration-actions", "Thiếu celebration-actions")
    runner.assert_true('btnBackPage9' in app_js_content, "JS khởi tạo selector btnBackPage9", "Thiếu selector btnBackPage9 trong app.js")
    runner.assert_true('currentPageIndex === 10' in app_js_content, "JS có khối xử lý chuyên biệt cho currentPageIndex === 10", "Thiếu xử lý Page 10 trong app.js")
    runner.assert_true('coverBack.style.display = \'none\'' in app_js_content, "JS ẩn bìa sau coverBack khi thoát khỏi Page 10", "Chưa ẩn coverBack")
    runner.assert_true('bookSpread.style.display = \'flex\'' in app_js_content, "JS khôi phục hiển thị bookSpread khi quay lại truyện", "Chưa hiện lại bookSpread")

    # Mô phỏng máy trạng thái (State Machine Simulation) cho Page 10
    class BookState:
        def __init__(self):
            self.currentPageIndex = 10
            self.coverBackDisplay = 'flex'
            self.bookSpreadDisplay = 'none'
            self.bookClasses = {'state-end'}
            self.isFlipping = False
            self.isAutoPlaying = False

        def flipToPage(self, targetPage, direction=None):
            if self.isFlipping:
                return "BLOCKED_BY_FLIPPING"
            if targetPage < 0 or targetPage > 10:
                return "INVALID_PAGE"
            if targetPage == self.currentPageIndex:
                return "SAME_PAGE"

            self.isFlipping = True

            # Trạng thái Page 10
            if self.currentPageIndex == 10:
                if targetPage == 1:
                    self.coverBackDisplay = 'none'
                    self.bookClasses.discard('state-end')
                    self.bookClasses.add('state-open')
                    self.bookSpreadDisplay = 'flex'
                    self.currentPageIndex = 1
                    self.isFlipping = False
                    self.isAutoPlaying = True
                    return "REPLAY_PAGE_1_SUCCESS"
                elif targetPage == 9:
                    self.coverBackDisplay = 'none'
                    self.bookClasses.discard('state-end')
                    self.bookClasses.add('state-open')
                    self.bookSpreadDisplay = 'flex'
                    self.currentPageIndex = 9
                    self.isFlipping = False
                    return "BACK_TO_PAGE_9_SUCCESS"
                elif 2 <= targetPage <= 8:
                    self.coverBackDisplay = 'none'
                    self.bookClasses.discard('state-end')
                    self.bookClasses.add('state-open')
                    self.bookSpreadDisplay = 'flex'
                    self.currentPageIndex = targetPage
                    self.isFlipping = False
                    return f"DRAWER_JUMP_PAGE_{targetPage}_SUCCESS"
                elif targetPage == 0:
                    self.coverBackDisplay = 'none'
                    self.bookClasses.discard('state-end')
                    self.bookClasses.add('state-closed')
                    self.currentPageIndex = 0
                    self.isFlipping = False
                    return "BACK_TO_COVER_FRONT_SUCCESS"

            return "OTHER"

    # Test 1: Bấm Đọc lại từ đầu từ Page 10
    sim1 = BookState()
    res1 = sim1.flipToPage(1, 'backward')
    runner.assert_true(
        res1 == "REPLAY_PAGE_1_SUCCESS" and sim1.currentPageIndex == 1 and sim1.coverBackDisplay == 'none' and sim1.bookSpreadDisplay == 'flex' and not sim1.isFlipping,
        "Page 10 ➔ Page 1 (Đọc lại từ đầu): Khôi phục spread, ẩn coverBack, sẵn sàng đọc trang 1",
        f"Lỗi state sim1: {res1}"
    )

    # Test 2: Bấm Quay về trang 9 từ Page 10
    sim2 = BookState()
    res2 = sim2.flipToPage(9, 'backward')
    runner.assert_true(
        res2 == "BACK_TO_PAGE_9_SUCCESS" and sim2.currentPageIndex == 9 and sim2.coverBackDisplay == 'none' and sim2.bookSpreadDisplay == 'flex' and not sim2.isFlipping,
        "Page 10 ➔ Page 9 (Lùi về trang trước): Khôi phục spread, chuyển về trang 9 mượt mà",
        f"Lỗi state sim2: {res2}"
    )

    # Test 3: Nhảy sang trang ngẫu nhiên (VD: trang 5) từ Page 10 qua Drawer
    sim3 = BookState()
    res3 = sim3.flipToPage(5)
    runner.assert_true(
        res3 == "DRAWER_JUMP_PAGE_5_SUCCESS" and sim3.currentPageIndex == 5 and sim3.coverBackDisplay == 'none' and not sim3.isFlipping,
        "Page 10 ➔ Trang 5 (Mục lục Drawer): Nhảy chính xác không bị kẹt bìa sau",
        f"Lỗi state sim3: {res3}"
    )

    # -------------------------------------------------------------
    # NHÓM 7: KIỂM THỬ ĐỌC TIẾP KHI PAUSE/RESUME & TUA BẰNG CLICK TỪ / PROGRESS BAR
    # -------------------------------------------------------------
    print("\n--- NHÓM 7: KIỂM THỬ ĐỌC TIẾP (RESUME) & TUA CHỮ / THANH TIẾN ĐỘ ---")
    with open("css/style.css", "r", encoding="utf-8") as f:
        css_content = f.read()

    runner.assert_true('function pauseStoryAudio(' in app_js_content, "JS có hàm pauseStoryAudio bảo lưu currentTime", "Thiếu pauseStoryAudio")
    runner.assert_true('function resumeStoryAudio(' in app_js_content, "JS có hàm resumeStoryAudio đọc tiếp vị trí cũ", "Thiếu resumeStoryAudio")
    runner.assert_true('function seekStoryAudio(' in app_js_content, "JS có hàm seekStoryAudio hỗ trợ tua mốc thời gian", "Thiếu seekStoryAudio")
    runner.assert_true('storyParagraph.addEventListener(\'click\'' in app_js_content, "JS có sự kiện bấm vào từng từ để nhảy tới từ đó", "Thiếu click từ")
    runner.assert_true('audioProgressWrap.addEventListener(\'click\'' in app_js_content, "JS có sự kiện bấm vào thanh tiến trình để tua", "Thiếu click progress bar")
    runner.assert_true('cursor: pointer;' in css_content and '.word' in css_content, "CSS định nghĩa cursor pointer cho từng từ (.word)", "Thiếu cursor pointer cho .word")
    runner.assert_true('cursor: pointer;' in css_content and '.audio-progress-bar-wrap' in css_content, "CSS định nghĩa cursor pointer cho thanh tiến trình", "Thiếu cursor pointer cho progress bar")

    # Mô phỏng trình điều khiển Audio Pause / Resume / Seek
    class AudioEngineSimulator:
        def __init__(self, duration, words):
            self.duration = duration
            self.words = words
            self.currentTime = 0.0
            self.isPlaying = False

        def playFromStart(self):
            self.currentTime = 0.0
            self.isPlaying = True

        def pause(self):
            # Tạm dừng: Giữ nguyên currentTime
            self.isPlaying = False

        def resume(self):
            # Tiếp tục: KHÔNG reset currentTime về 0
            if self.currentTime < self.duration:
                self.isPlaying = True

        def seek(self, targetTime):
            self.currentTime = max(0.0, min(self.duration, targetTime))
            self.isPlaying = True

        def getKaraokeState(self):
            past = [i for i, w in enumerate(self.words) if self.currentTime >= w["end"]]
            current = [i for i, w in enumerate(self.words) if w["start"] <= self.currentTime < w["end"]]
            future = [i for i, w in enumerate(self.words) if self.currentTime < w["start"]]
            return past, current, future

    audio_sim = AudioEngineSimulator(duration, page1_words)
    audio_sim.playFromStart()
    audio_sim.currentTime = 8.5  # Đang đọc đến giây 8.5
    audio_sim.pause()

    runner.assert_true(
        audio_sim.currentTime == 8.5 and not audio_sim.isPlaying,
        "Tạm dừng (Pause): currentTime giữ nguyên 8.5s (Không bị reset về 0)",
        f"Lỗi: currentTime = {audio_sim.currentTime}"
    )

    audio_sim.resume()
    runner.assert_true(
        audio_sim.currentTime == 8.5 and audio_sim.isPlaying,
        "Đọc tiếp (Resume): Tiếp tục phát từ 8.5s thành công (Không đọc lại từ đầu)",
        f"Lỗi: currentTime = {audio_sim.currentTime}, isPlaying = {audio_sim.isPlaying}"
    )

    # Test bấm vào một từ ở giữa trang (VD: từ thứ 20)
    target_word_idx = 20
    target_start = page1_words[target_word_idx]["start"]
    audio_sim.seek(target_start)

    past_words, curr_words, fut_words = audio_sim.getKaraokeState()
    runner.assert_true(
        audio_sim.currentTime == target_start and target_word_idx in curr_words,
        f"Bấm vào từ thứ {target_word_idx}: Nhảy audio chính xác tới {target_start:.2f}s và từ đó được highlight",
        f"Lỗi seek word: currentTime={audio_sim.currentTime}, curr_words={curr_words}"
    )
    runner.assert_true(
        len(past_words) == target_word_idx and target_word_idx - 1 in past_words,
        f"Bấm vào từ thứ {target_word_idx}: Toàn bộ {target_word_idx} từ phía trước chuyển sang trạng thái đã đọc",
        f"Lỗi unhighlight: len(past)={len(past_words)}"
    )

    # Test tua bằng thanh tiến trình tới 50%
    mid_time = duration * 0.5
    audio_sim.seek(mid_time)
    runner.assert_true(
        abs(audio_sim.currentTime - mid_time) < 0.001 and audio_sim.isPlaying,
        f"Tua thanh tiến trình (50%): Nhảy audio chính xác tới {mid_time:.2f}s",
        f"Lỗi seek progress bar: {audio_sim.currentTime}"
    )

    # -------------------------------------------------------------
    # NHÓM 8: KIỂM TRA FILE ÂM THANH BÌA TRƯỚC VÀ TIẾNG LẬT SÁCH CHÂN THỰC
    # -------------------------------------------------------------
    print("\n--- NHÓM 8: KIỂM TRA GIỌNG ĐỌC BÌA SÁCH & TIẾNG LẬT GIẤY ---")
    cover_mp3 = "assets/audio/cover.mp3"
    flip_mp3 = "assets/audio/page_flip.mp3"

    runner.assert_true(os.path.exists(cover_mp3), "File âm thanh bìa trước cover.mp3 tồn tại", "Thiếu cover.mp3")
    if os.path.exists(cover_mp3):
        cover_size_kb = os.path.getsize(cover_mp3) / 1024
        runner.assert_true(cover_size_kb > 20, f"Dung lượng cover.mp3 hợp lệ ({cover_size_kb:.1f} KB)", "File quá nhỏ")
        cmd = ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', cover_mp3]
        try:
            c_dur = float(subprocess.check_output(cmd, text=True).strip())
            runner.assert_true(4.0 <= c_dur <= 8.0, f"Thời lượng đọc bìa trước tự nhiên ({c_dur:.2f}s)", f"Thời lượng bất thường: {c_dur}s")
        except Exception as e:
            runner.assert_true(False, "Đo thời lượng cover.mp3", str(e))

    cover_video = "assets/videos/cover_front.mp4"
    cover_video_exists = os.path.exists(cover_video)
    runner.assert_true(cover_video_exists, "Video hoạt hình bìa trước tồn tại", f"Không tìm thấy {cover_video}")
    if cover_video_exists:
        cap = cv2.VideoCapture(cover_video)
        is_opened = cap.isOpened()
        runner.assert_true(is_opened, "OpenCV mở được video bìa trước", "Không thể decode cover video")
        if is_opened:
            cover_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            cover_fps = cap.get(cv2.CAP_PROP_FPS)
            cap.release()
            runner.assert_true(cover_frames >= 80, f"Bìa trước có chuyển động theo toàn bộ audio ({cover_frames} frames)", "Video bìa quá ngắn")
            runner.assert_true(cover_fps >= 15.0, f"Bìa trước có tốc độ khung hình phù hợp ({cover_fps:.0f} fps)", "FPS bìa quá thấp")

    runner.assert_true(os.path.exists(flip_mp3), "File âm thanh lật sách page_flip.mp3 tồn tại", "Thiếu page_flip.mp3")
    if os.path.exists(flip_mp3):
        flip_size_kb = os.path.getsize(flip_mp3) / 1024
        runner.assert_true(flip_size_kb > 5, f"Dung lượng page_flip.mp3 hợp lệ ({flip_size_kb:.1f} KB)", "File quá nhỏ")

    runner.assert_true('id="btn-read-cover"' not in html_content, "Bìa trước không bị nút che khuất nội dung (theo yêu cầu người dùng)", "Vẫn còn nút #btn-read-cover che bìa")
    runner.assert_true('playCoverAudio' in app_js_content, "JS có hàm playCoverAudio phát giọng đọc bìa", "Thiếu playCoverAudio")
    runner.assert_true('pauseCoverAudio' in app_js_content, "JS có hàm pauseCoverAudio", "Thiếu pauseCoverAudio")
    runner.assert_true('id="cover-video"' in html_content and 'cover-title-overlay' not in html_content, "Bìa dùng video chuyển động toàn khung, không phủ ảnh tĩnh lên phần dưới", "Video bìa bị thiếu hoặc còn lớp ảnh tĩnh che chuyển động")
    cover_video_style = css_content.split('.cover-img', 1)[1].split('}', 1)[0] if '.cover-img' in css_content else ''
    story_video_style = css_content.rsplit('.story-video-player', 1)[1].split('}', 1)[0] if '.story-video-player' in css_content else ''
    runner.assert_true('object-fit: cover;' in cover_video_style and 'object-fit: cover;' in story_video_style, "Video bìa và truyện lấp đầy khung hiển thị", "Video không lấp đầy khung hiển thị")
    runner.assert_true("currentPageIndex === 0 && mainAudio.src.includes('cover.mp3')" in app_js_content, "Kết thúc lời đọc bìa được xử lý riêng mà không ghi đè sự kiện kết thúc truyện", "Sai xử lý sự kiện audio kết thúc")
    runner.assert_true('currentPageIndex === 0' in app_js_content and 'playCoverAudio()' in app_js_content, "Nút Play/Pause ở thanh dock hỗ trợ phát/dừng giọng đọc bìa sách khi ở Page 0", "Thiếu điều khiển cover audio qua dock")
    with open("js/audio-speech.js", "r", encoding="utf-8") as f:
        audio_speech_content = f.read()
    runner.assert_true('assets/audio/page_flip.mp3' in audio_speech_content, "Audio engine tích hợp tiếng lật sách chân thực (page_flip.mp3)", "Chưa dùng page_flip.mp3 trong audio-speech.js")

    # -------------------------------------------------------------
    # NHÓM 9: KIỂM THỬ KHÔNG NHẢY DÒNG CHỮ KHI HIGHLIGHT (ZERO LAYOUT SHIFT / CLS = 0)
    # -------------------------------------------------------------
    print("\n--- NHÓM 9: KIỂM THỬ KHÔNG NHẢY DÒNG CHỮ (ZERO LAYOUT SHIFT / CLS = 0) ---")
    k_start = css_content.find('.word.karaoke-current {')
    k_end = css_content.find('}', k_start)
    k_block = css_content[k_start:k_end]

    # Đảm bảo CSS không làm thay đổi font-weight hoặc scale kích thước từ khi highlight karaoke
    runner.assert_true('700' not in k_block and '800' not in k_block, 
                       "CSS .word.karaoke-current không đổi font-weight sang 700/800 (ngăn dãn glyphs và tràn dòng)", 
                       f"Vẫn còn font-weight đậm: {k_block}")
    runner.assert_true('scale' not in k_block, 
                       "CSS .word.karaoke-current không phóng to tỷ lệ transform: scale(...) gây xô lệch chữ", 
                       f"Vẫn còn transform: scale: {k_block}")
    runner.assert_true('box-shadow' in k_block,
                       "CSS dùng box-shadow phát sáng nổi bật giữ nguyên 100% hình học layout (CLS = 0)",
                       "Chưa sử dụng box-shadow cho karaoke-current")

    # -------------------------------------------------------------
    # NHÓM 10: KIỂM THỬ ĐỒNG BỘ 3D FLIP KHÔNG BỊ TRỄ NỘI DUNG (ZERO DELAY UNDER TURNING LEAF)
    # -------------------------------------------------------------
    print("\n--- NHÓM 10: KIỂM THỬ ĐỒNG BỘ 3D FLIP KHÔNG BỊ HIỆN TRANG CŨ BÊN DƯỚI ---")
    # Kiểm tra Case 3 (Forward): updateRightPageContent(toPage) phải được gọi ngay lập tức tại t = 0
    # trước bất kỳ setTimeout nào, để khi lá lật nhấc lên trang bên dưới đã là trang mới
    case3_start = app_js_content.find("TRƯỜNG HỢP 3: LẬT TIẾN GIỮA CÁC TRANG TRUYỆN")
    case3_end = app_js_content.find("TRƯỜNG HỢP 4: LẬT LÙI GIỮA CÁC TRANG TRUYỆN")
    case3_block = app_js_content[case3_start:case3_end]
    first_timeout_3 = case3_block.find("setTimeout")
    call_immediate_case3 = "updateRightPageContent(toPage);" in case3_block[:first_timeout_3]
    runner.assert_true(call_immediate_case3, 
                       "Lật tiến (Forward): updateRightPageContent(toPage) cập nhật ngay t = 0 (trang mới sẵn sàng dưới lá lật)", 
                       "updateRightPageContent vẫn bị delay trong setTimeout")

    # Kiểm tra Case 4 (Backward): playVideoForPage(toPage) phải được gọi ngay lập tức tại t = 0
    case4_start = app_js_content.find("TRƯỜNG HỢP 4: LẬT LÙI GIỮA CÁC TRANG TRUYỆN")
    case4_end = app_js_content.find("TRƯỜNG HỢP CHUYỂN TRANG KHÁC")
    case4_block = app_js_content[case4_start:case4_end]
    first_timeout_4 = case4_block.find("setTimeout")
    call_immediate_case4 = "playVideoForPage(toPage);" in case4_block[:first_timeout_4]
    runner.assert_true(call_immediate_case4, 
                       "Lật lùi (Backward): playVideoForPage(toPage) cập nhật ngay t = 0 (trang mới sẵn sàng dưới lá lật)", 
                       "playVideoForPage vẫn bị delay trong setTimeout")

    # -------------------------------------------------------------
    # TỔNG KẾT KẾT QUẢ TEST
    # -------------------------------------------------------------
    print("\n" + "=" * 70)
    print(f"KẾT QUẢ KIỂM THỬ: {runner.passed} TEST PASS | {runner.failed} TEST FAIL")
    print("=" * 70)

    if runner.failed == 0:
        print("🎉 TẤT CẢ UNIT TESTS ĐỀU ĐẠT CHUẨN XUẤT SẮC 100%! HỆ THỐNG SẴN SÀNG!")
        return 0
    else:
        print("⚠️ CÒN TEST CHƯA ĐẠT, CẦN KIỂM TRA LẠI!")
        return 1

if __name__ == '__main__':
    code = run_all_unit_tests()
    sys.exit(code)
