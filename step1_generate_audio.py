import os
import sys
import subprocess
import soundfile as sf
from vieneu import Vieneu

sys.stdout.reconfigure(encoding='utf-8')

STORIES = [
    {
        "page": 1,
        "text": "Hôm nay là một ngày nắng đẹp, cô bé Mai hào hứng dắt chiếc xe đạp màu vàng của mình ra sân. Hôm nay, bác Hùng hàng xóm sẽ dẫn Mai đi dạo phố và dạy cho Mai những bí mật của các biển báo giao thông để Mai có thể tự tin đi lại an toàn. Mai thắt chặt quai mũ bảo hiểm và sẵn sàng lên đường."
    },
    {
        "page": 2,
        "text": "Vừa đi được một đoạn, bác Hùng ra hiệu cho Mai dừng lại trước một biển báo hình tam giác màu vàng có hình hai bạn nhỏ đang chạy. Bác Hùng ôn tồn nói: Đây là biển báo Nguy hiểm có trẻ em đấy Mai ạ. Khi thấy biển này, các chú lái xe phải đi chậm lại vì gần đây có trường học hoặc sân chơi."
    },
    {
        "page": 3,
        "text": "Đi tới một ngã tư lớn, Mai định rẽ trái để ghé vào tiệm kem nhưng bác Hùng ngăn lại. Bác chỉ vào một biển báo hình tròn có viền đỏ, bên trong có hình mũi tên quẹo trái nhưng bị một vạch đỏ gạch chéo. Mai nhìn xem, đây là biển Cấm quẹo trái. Chúng ta không được đi đường này đâu."
    },
    {
        "page": 4,
        "text": "Mai gật đầu hiểu ý. Cô bé cùng bác Hùng tiếp tục đạp xe đi thẳng. Mai nhận ra rằng nếu mình chú ý quan sát biển báo, mình sẽ biết cách đi đúng đường và không làm ảnh hưởng đến các phương tiện khác. Ồ, hóa ra biển báo giống như những người chỉ đường thầm lặng bác nhỉ! Mai reo lên."
    },
    {
        "page": 5,
        "text": "Sau đó, hai bác cháu đi ngang qua một làn đường rộng hơn. Ở đó có một biển báo hình tròn màu xanh lục, bên trong có hình một chiếc xe ô tô màu trắng. Bác Hùng giải thích: Đây là biển Ưu tiên xe ô tô. Ở làn đường này, xe ô tô được ưu tiên đi, nên xe đạp của Mai mình nên đi sát vào lề đường bên phải cho an toàn nhé."
    },
    {
        "page": 6,
        "text": "Đang đi, Mai thấy một biển báo hình tròn viền đỏ, ở giữa có số 40 rất lớn. Mai thắc mắc: Số 40 này có nghĩa là gì vậy bác Hùng? Bác Hùng cười: Đó là biển báo Tốc độ cho phép tối đa là 40 km/h. Các xe không được đi nhanh hơn con số này để đảm bảo mọi người trên đường đều an toàn."
    },
    {
        "page": 7,
        "text": "Mai quan sát các chú tài xế trên đường. Đúng thật, các xe đều đi rất thong thả, không ai phóng nhanh vượt ẩu cả. Mai cảm thấy yên tâm hơn hẳn khi hiểu được ý nghĩa của con số 40 kỳ diệu đó. Cô bé tự nhủ khi lớn lên lái xe, mình cũng sẽ tuân thủ tốc độ như thế."
    },
    {
        "page": 8,
        "text": "Cuối cùng, hai bác cháu cũng đến được công viên xanh mát. Mai cảm thấy rất tự hào vì hôm nay mình đã học được bao nhiêu điều bổ ích. Những biển báo không còn là những hình vẽ lạ lẫm nữa, mà chúng đã trở thành những người bạn giúp Mai đi đường an toàn."
    },
    {
        "page": 9,
        "text": "Ngồi nghỉ trên ghế đá, Mai say sưa kể lại cho bác Hùng nghe về những biển báo mình vừa học. Bác Hùng gật đầu tán thưởng và nhắc Mai rằng việc hiểu biển báo chính là cách tốt nhất để bảo vệ bản thân và mọi người xung quanh. Mai mỉm cười, cảm thấy mình đã trưởng thành hơn một chút."
    }
]

def main():
    print("=== BƯỚC 1: TẠO ÂM THANH TIẾNG VIỆT BẰNG VIENEU TTS (GPU) ===")
    tts = Vieneu()
    voice = 'Kim Thanh' if 'Kim Thanh' in tts._preset_voices else list(tts._preset_voices.keys())[0]
    print(f"Giọng đọc kể chuyện được chọn: {voice}")

    os.makedirs('assets/audio', exist_ok=True)

    for item in STORIES:
        page_num = item["page"]
        text = item["text"]
        out_wav = f"assets/audio/story_{page_num}.wav"
        out_mp3 = f"assets/audio/story_{page_num}.mp3"

        print(f"-> Đang tổng hợp giọng đọc Trang {page_num}...")
        wav = tts.infer(text, voice=voice)
        sf.write(out_wav, wav, tts.sample_rate)

        # Chuyển đổi sang MP3 chuẩn web
        subprocess.run([
            "ffmpeg", "-y", "-i", out_wav,
            "-b:a", "192k", "-ar", "44100",
            out_mp3
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

        duration = len(wav) / tts.sample_rate
        print(f"   ✓ Đã tạo story_{page_num}.mp3 (thời lượng: {duration:.2f}s)")

    print("\n✅ HOÀN TẤT TẠO TOÀN BỘ 9 FILE ÂM THANH TIẾNG VIỆT!")

if __name__ == '__main__':
    main()
