# 📖 Sách Lật Tương Tác 3D: Mai và Chuyến Phiêu Lưu Của Những Biển Báo

Dự án sách thiếu nhi điện tử tương tác 3D đa phương tiện, chuyển thể từ tác phẩm **"Mai và Chuyến Phiêu Lưu Của Những Biển Báo"** của tác giả **Lê Huỳnh Kim Thanh**.

🌐 **Link Đọc Trực Tuyến (GitHub Pages):**  
👉 **[https://vocongminhhb55.github.io/sach-lat-mai-va-bien-bao/](https://vocongminhhb55.github.io/sach-lat-mai-va-bien-bao/)**

📄 **Tài Liệu Chi Tiết Cho AI & Lập Trình Viên:** Xem file **[PROJECT_SPEC.md](file:///PROJECT_SPEC.md)**.

---

## ✨ Các Tính Năng Nổi Bật

1. **Hiệu Ứng Lật Sách 3D Chân Thực (Pure CSS3D Engine):**
   - Mô phỏng chuyển động lật mở trang sách giấy 3D mượt mà với bóng đổ động, độ cong tự nhiên và âm thanh lật giấy lạo xạo.
   - Bìa trước mở thẳng vào Trang 1; ruột sách 2 trang mở đôi cân đối; màn hình kết thúc chúc mừng bé hoàn thành chuyến đi.
   - Hoàn toàn độc lập, không dùng thư viện ngoài bị lỗi, tương thích hoàn hảo trên máy tính, iPad và smartphone.

2. **Video Hoạt Hình MP4 Sống Động (Audio-Envelope Lip Sync & Eye Blink):**
   - Tranh minh họa bên trái được chuyển hóa thành video hoạt hình sống động sinh từ mô hình AI và OpenCV trên GPU.
   - **Môi mấp máy theo nhịp giọng nói (Lip-sync):** Miệng nhân vật tự động mấp máy mở/khép theo biên độ âm thanh giọng kể tiếng Việt.
   - **Chớp mắt tự nhiên:** Mí mắt chớp nhẹ nhàng theo chu kỳ sinh học 3–4 giây/lần.
   - **Cử động biểu cảm:** Biển báo phát sáng hào quang rực rỡ và rung lắc nhẹ đúng khoảnh khắc được nhắc tới trong lời kể.
   - Khung hình khóa cứng $720 \times 1110\text{ px}$, không bị tách rời hay trôi lệch khỏi mép trang sách.

3. **Giọng Kể Tiếng Việt Tự Nhiên (VieNeu-TTS Pipeline):**
   - Sử dụng mô hình tổng hợp giọng đọc AI chất lượng cao (voice nữ miền Nam `Kim Thanh`), truyền cảm, phát âm rõ ràng, phù hợp lứa tuổi thiếu nhi.
   - Chuẩn hóa $100\%$ chính tả tiếng Việt cho toàn bộ 9 trang truyện.

4. **Hiệu Ứng Chữ Chạy Karaoke & Tương Tác Bấm Chữ / Tua Tiến Trình:**
   - Mốc thời gian từng từ được trích xuất bằng mô hình AI **Faster-Whisper** trên GPU CUDA.
   - Khi audio phát tới đâu, từ đó sẽ phát sáng hào quang cam vàng rực rỡ (`.karaoke-current`).
   - Ngay khi đọc xong, từ tự động đổi sang màu xám êm dịu (`.karaoke-past`), **tuyệt đối không bị đè highlight** hay sót chữ.
   - **Bấm vào chữ để đọc (Word-Click Seek):** Bé hoặc phụ huynh có thể bấm vào bất kỳ từ nào trên trang để nghe giọng đọc nhảy ngay tới từ đó!
   - **Tua thanh tiến trình:** Bấm trực tiếp vào thanh tiến độ để tua nhanh/chậm tùy thích.
   - **Đọc tiếp mượt mà (Resume Playback):** Bấm Tạm dừng (Pause) rồi bấm Tiếp tục (Play) sẽ đọc tiếp đúng vị trí đang dừng, không bao giờ bị nhảy đọc lại từ đầu trang.

5. **Nếp Gấp Góc Trang Rỗng Xuyên Thấu Chân Thực (Corner Fold Clip-Path):**
   - Mép nếp gấp góc dưới bên trái được cắt chéo chính xác bằng thuật toán `clip-path` đa giác trên cả khung hình và video player.
   - Bên dưới nếp gấp hoàn toàn rỗng xuyên thấu mặt bàn, không còn bất kỳ vệt màu hay mảnh hình thừa nào.

6. **Tự Động Lật Trang & Điều Khiển Toàn Diện:**
   - Đọc xong mỗi trang sẽ có khoảng nghỉ tự nhiên $1.2\text{s}$ để bé ngắm tranh rồi tự động lật tiếp sang trang sau.
   - Đầy đủ nút Play/Pause, Đọc lại trang này, Bật/tắt tự lật, Bật/tắt âm thanh, Toàn màn hình (F11), và Mục lục thu nhỏ (Drawer Thumbnails).
   - Hỗ trợ phím tắt tiện lợi: Phím Cách (Space) để Play/Pause, Mũi tên Trái/Phải để lật trang.

7. **Màn Hình Kết Thúc Thông Minh (Trang 10):**
   - Phát âm thanh kèn fanfare chúc mừng bé đã khám phá hết sách.
   - Tích hợp cụm nút thao tác tức thì:
     - **⬅ Quay Về Trang 9:** Lật lùi lá sách 3D mượt mà về trang trước.
     - **🔄 Đọc Lại Từ Đầu:** Tự động mở sách vào Trang 1, phát giọng đọc và chạy chữ karaoke từ đầu.

8. **Chạy Mượt Cả Khi Không Có Mạng (100% Offline):**
   - Toàn bộ tài nguyên, âm thanh, video và font chữ đều được lưu trữ cục bộ.
   - Chỉ cần tải thư mục về và nhấp đúp file `index.html` là đọc được ngay.

---

## 🧪 Hệ Thống Kiểm Thử Tự Động (150 Unit Tests)

Dự án tích hợp bộ kiểm thử toàn diện `step4_run_tests.py` kiểm tra mọi thành phần của hệ thống:
```powershell
python step4_run_tests.py
```
**Kết quả: 150 TEST PASS | 0 TEST FAIL (100% Đạt Chuẩn).**

---

## 🛠️ Các Lệnh Thao Tác Kỹ Thuật

```powershell
# Chạy toàn bộ 138 unit tests
python step4_run_tests.py

# Sinh lại âm thanh giọng đọc tiếng Việt (VieNeu-TTS)
python step1_generate_audio.py

# Trích xuất lại timestamps từng từ (Faster-Whisper CUDA)
python step2_extract_timestamps.py

# Sinh lại video hoạt hình MP4 môi mấp máy & chớp mắt (OpenCV)
python step3_generate_videos.py
```

---

## 👨‍💻 Tác Quyền & Bản Quyền

- **Tác phẩm:** *Mai và Chuyến Phiêu Lưu Của Những Biển Báo*
- **Tác giả:** **Lê Huỳnh Kim Thanh**
- Mã nguồn Web và các kịch bản AI pipeline được xây dựng phục vụ mục đích giáo dục an toàn giao thông cho trẻ em.
