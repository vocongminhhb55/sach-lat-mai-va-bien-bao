# 📖 Sách Lật Tương Tác 3D: Mai và Chuyến Phiêu Lưu Của Những Biển Báo

Dự án sách thiếu nhi điện tử tương tác 3D đa phương tiện, chuyển thể từ tác phẩm **"Mai và Chuyến Phiêu Lưu Của Những Biển Báo"** của tác giả **Lê Huỳnh Kim Thanh**.

🌐 **Link Đọc Trực Tuyến (GitHub Pages):**  
👉 **[https://vocongminhhb55.github.io/sach-lat-mai-va-bien-bao/](https://vocongminhhb55.github.io/sach-lat-mai-va-bien-bao/)**

📄 **Tài Liệu Chi Tiết Cho AI & Lập Trình Viên:** Xem file **[PROJECT_SPEC.md](file:///PROJECT_SPEC.md)**.

---

## ✨ Các Tính Năng Nổi Bật

1. **Hiệu Ứng Lật Sách 3D Chân Thực & Tiếng Sột Soạt Của Giấy (Pure CSS3D Engine):**
   - Mô phỏng chuyển động lật mở trang sách giấy 3D mượt mà với bóng đổ động và độ cong tự nhiên.
   - **Âm thanh sột soạt của giấy (`page_flip.mp3`):** Tiếng lật lá sách kết hợp tiếng trượt miết giấy tự nhiên, mang lại cảm giác mở trang sách giấy chân thực $100\%$.
   - **Hiển thị trang mới tức thì dưới lá lật ($t = 0$):** Khi lật sang trang mới, nội dung trang bên dưới lập tức là trang đích, không còn hiện tượng hiển thị trang cũ hay giật trễ hình ảnh.
   - Bìa trước mở thẳng vào Trang 1; ruột sách 2 trang mở đôi cân đối; màn hình kết thúc chúc mừng bé hoàn thành chuyến đi.

2. **Đọc Bìa Sách Tiếng Việt Truyền Cảm (Cover Audio):**
   - Bìa trước giữ sự thoáng đãng $100\%$, không bị bất kỳ nút bấm nào che khuất tranh minh họa và tên tác giả **Lê Huỳnh Kim Thanh**.
   - Khi ở bìa trước (Page 0), người đọc chỉ cần bấm nút **Play** ở thanh dock bên dưới để nghe giọng đọc tên sách và tên tác giả. Bấm trực tiếp vào bìa sách sẽ lật mở ngay vào Trang 1.

3. **Hoạt Hình AI MP4 Theo Toàn Bộ Lời Kể (Wan 2.1 I2V):**
   - Cả 9 tranh truyện bên trái và bìa trước đã được chuyển thành video AI, phát ngoại tuyến cùng giọng kể tương ứng.
   - Các đoạn Wan 2.1 I2V được nối tiếp để video tiếp tục có chuyển động trong suốt lời kể, thay vì lặp lại một đoạn ngắn.
   - Toàn bộ bìa chuyển động xuyên suốt lời đọc; không phủ ảnh tĩnh lên phần dưới nên tên sách, tác giả và tranh không bị chia thành vùng đứng yên.
   - Video dùng độ phân giải $480 \times 832$ ở 16 fps để phù hợp mô hình lượng tử hóa trên GPU 12 GB.
   - Đây là hoạt hình AI nên một số chi tiết có thể thay đổi nhẹ giữa các đoạn; không phải đồng bộ khẩu hình chính xác với từng âm tiết.

4. **Giọng Kể Tiếng Việt Tự Nhiên (VieNeu-TTS Pipeline):**
   - Sử dụng mô hình tổng hợp giọng đọc AI chất lượng cao (voice nữ miền Nam `Kim Thanh`), truyền cảm, phát âm rõ ràng, phù hợp lứa tuổi thiếu nhi.
   - Chuẩn hóa $100\%$ chính tả tiếng Việt cho toàn bộ 9 trang truyện.

5. **Hiệu Ứng Chữ Chạy Karaoke & Triệt Tiêu Nhảy Dòng (Zero Cumulative Layout Shift):**
   - Mốc thời gian từng từ được trích xuất bằng mô hình AI **Faster-Whisper** trên GPU CUDA.
   - Khi audio phát tới đâu, từ đó sẽ phát sáng hào quang vàng rực rỡ (`.karaoke-current`).
   - Ngay khi đọc xong, từ tự động đổi sang màu xám êm dịu (`.karaoke-past`), **tuyệt đối không bị đè highlight** hay sót chữ.
   - **Triệt tiêu hiện tượng dãn chữ, nhảy dòng:** Giữ cố định `font-weight: 600`, bỏ scale biến đổi hình học, loại trừ hoàn toàn việc các từ bị đẩy rớt dòng khi highlight.
   - **Bấm vào chữ để đọc (Word-Click Seek):** Bé hoặc phụ huynh có thể bấm vào bất kỳ từ nào trên trang để nghe giọng đọc nhảy ngay tới từ đó!
   - **Tua thanh tiến trình:** Bấm trực tiếp vào thanh tiến độ để tua nhanh/chậm tùy thích.
   - **Đọc tiếp mượt mà (Resume Playback):** Bấm Tạm dừng (Pause) rồi bấm Tiếp tục (Play) sẽ đọc tiếp đúng vị trí đang dừng, không bao giờ bị nhảy đọc lại từ đầu trang.

6. **Nếp Gấp Góc Trang Rỗng Xuyên Thấu Chân Thực (Corner Fold Clip-Path):**
   - Mép nếp gấp góc dưới bên trái được cắt chéo chính xác bằng thuật toán `clip-path` đa giác trên cả khung hình và video player.
   - Bên dưới nếp gấp hoàn toàn rỗng xuyên thấu mặt bàn, không còn bất kỳ vệt màu hay mảnh hình thừa nào.

7. **Tự Động Lật Trang & Điều Khiển Toàn Diện:**
   - Đọc xong mỗi trang sẽ có khoảng nghỉ tự nhiên $1.2\text{s}$ để bé ngắm tranh rồi tự động lật tiếp sang trang sau.
   - Đầy đủ nút Play/Pause, Đọc lại trang này, Bật/tắt tự lật, Bật/tắt âm thanh, Toàn màn hình (F11), và Mục lục thu nhỏ (Drawer Thumbnails).
   - Hỗ trợ phím tắt tiện lợi: Phím Cách (Space) để Play/Pause, Mũi tên Trái/Phải để lật trang.

8. **Màn Hình Kết Thúc Thông Minh (Trang 10):**
   - Phát âm thanh kèn fanfare chúc mừng bé đã khám phá hết sách.
   - Tích hợp cụm nút thao tác tức thì:
     - **⬅ Quay Về Trang 9:** Lật lùi lá sách 3D mượt mà về trang trước.
     - **🔄 Đọc Lại Từ Đầu:** Tự động mở sách vào Trang 1, phát giọng đọc và chạy chữ karaoke từ đầu.

9. **Chạy Mượt Cả Khi Không Có Mạng (100% Offline):**
   - Toàn bộ tài nguyên, âm thanh, video và font chữ đều được lưu trữ cục bộ.
   - Chỉ cần tải thư mục về và nhấp đúp file `index.html` là đọc được ngay.

---

## 🧪 Hệ Thống Kiểm Thử Tự Động (172 Unit Tests)

Dự án tích hợp bộ kiểm thử toàn diện `step4_run_tests.py` kiểm tra mọi thành phần của hệ thống:
```powershell
python step4_run_tests.py
```
**Kết quả xác nhận: 172 TEST PASS | 0 TEST FAIL.**

---

## 🛠️ Các Lệnh Thao Tác Kỹ Thuật

```powershell
# Chạy toàn bộ 172 unit tests
python step4_run_tests.py

# Sinh lại âm thanh giọng đọc tiếng Việt (VieNeu-TTS)
python step1_generate_audio.py

# Trích xuất lại timestamps từng từ (Faster-Whisper CUDA)
python step2_extract_timestamps.py

# Sinh lại video hoạt hình OpenCV đời cũ (sẽ ghi đè video Wan hiện tại)
python step3_generate_videos.py
```

---

## 👨‍💻 Tác Quyền & Bản Quyền

- **Tác phẩm:** *Mai và Chuyến Phiêu Lưu Của Những Biển Báo*
- **Tác giả:** **Lê Huỳnh Kim Thanh**
- Mã nguồn Web và các kịch bản AI pipeline được xây dựng phục vụ mục đích giáo dục an toàn giao thông cho trẻ em.
