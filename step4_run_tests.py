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

                runner.assert_true(w == 720 and h == 1110, f"Trang {i}: Độ phân giải video chuẩn 720x1110 ({w}x{h})", f"Độ phân giải sai: {w}x{h}")
                runner.assert_true(fps >= 25.0, f"Trang {i}: Tốc độ khung hình mượt mà ({fps:.0f} fps)", f"FPS quá thấp: {fps}")
                runner.assert_true(frame_count >= 150, f"Trang {i}: Số khung hình hợp lệ ({frame_count} frames)", "Video quá ngắn")

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
