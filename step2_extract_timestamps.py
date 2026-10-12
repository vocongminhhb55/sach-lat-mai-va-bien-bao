import os
import sys
import json
import re
from faster_whisper import WhisperModel

sys.stdout.reconfigure(encoding='utf-8')

# Dữ liệu chuẩn chính tả tiếng Việt từng trang truyện
GROUND_TRUTH = {
    1: "Hôm nay là một ngày nắng đẹp, cô bé Mai hào hứng dắt chiếc xe đạp màu vàng của mình ra sân. Hôm nay, bác Hùng hàng xóm sẽ dẫn Mai đi dạo phố và dạy cho Mai những bí mật của các biển báo giao thông để Mai có thể tự tin đi lại an toàn. Mai thắt chặt quai mũ bảo hiểm và sẵn sàng lên đường.",
    2: "Vừa đi được một đoạn, bác Hùng ra hiệu cho Mai dừng lại trước một biển báo hình tam giác màu vàng có hình hai bạn nhỏ đang chạy. Bác Hùng ôn tồn nói: Đây là biển báo Nguy hiểm có trẻ em đấy Mai ạ. Khi thấy biển này, các chú lái xe phải đi chậm lại vì gần đây có trường học hoặc sân chơi.",
    3: "Đi tới một ngã tư lớn, Mai định rẽ trái để ghé vào tiệm kem nhưng bác Hùng ngăn lại. Bác chỉ vào một biển báo hình tròn có viền đỏ, bên trong có hình mũi tên quẹo trái nhưng bị một vạch đỏ gạch chéo. Mai nhìn xem, đây là biển Cấm quẹo trái. Chúng ta không được đi đường này đâu.",
    4: "Mai gật đầu hiểu ý. Cô bé cùng bác Hùng tiếp tục đạp xe đi thẳng. Mai nhận ra rằng nếu mình chú ý quan sát biển báo, mình sẽ biết cách đi đúng đường và không làm ảnh hưởng đến các phương tiện khác. Ồ, hóa ra biển báo giống như những người chỉ đường thầm lặng bác nhỉ! Mai reo lên.",
    5: "Sau đó, hai bác cháu đi ngang qua một làn đường rộng hơn. Ở đó có một biển báo hình tròn màu xanh lục, bên trong có hình một chiếc xe ô tô màu trắng. Bác Hùng giải thích: Đây là biển Ưu tiên xe ô tô. Ở làn đường này, xe ô tô được ưu tiên đi, nên xe đạp của Mai, mình nên đi sát vào lề đường bên phải cho an toàn nhé.",
    6: "Đang đi, Mai thấy một biển báo hình tròn viền đỏ, ở giữa có số 40 rất lớn. Mai thắc mắc: Số 40 này có nghĩa là gì vậy bác Hùng? Bác Hùng cười: Đó là biển báo Tốc độ cho phép tối đa là 40 ki-lô-mét trên giờ. Các xe không được đi nhanh hơn con số này để đảm bảo mọi người trên đường đều an toàn.",
    7: "Mai quan sát các chú tài xế trên đường. Đúng thật, các xe đều đi rất thong thả, không ai phóng nhanh vượt ẩu cả. Mai cảm thấy yên tâm hơn hẳn khi hiểu được ý nghĩa của con số 40 kỳ diệu đó. Cô bé tự nhủ khi lớn lên lái xe, mình cũng sẽ tuân thủ tốc độ như thế.",
    8: "Cuối cùng, hai bác cháu cũng đến được công viên xanh mát. Mai cảm thấy rất tự hào vì hôm nay mình đã học được bao nhiêu điều bổ ích. Những biển báo không còn là những hình vẽ lạ lẫm nữa, mà chúng đã trở thành những người bạn giúp Mai đi đường an toàn.",
    9: "Ngồi nghỉ trên ghế đá, Mai say sưa kể lại cho bác Hùng nghe về những biển báo mình vừa học. Bác Hùng gật đầu tán thưởng và nhắc Mai rằng việc hiểu biển báo chính là cách tốt nhất để bảo vệ bản thân và mọi người xung quanh. Mai mỉm cười, cảm thấy mình đã trưởng thành hơn một chút."
}

def clean_word(w):
    return re.sub(r'[^\w\s]', '', w.lower())

def align_words_with_timestamps(gt_text, whisper_words):
    gt_tokens = gt_text.split()
    N = len(gt_tokens)
    M = len(whisper_words)
    
    if M == 0:
        return []
    
    # Nếu số lượng tương đương nhau, căn chỉnh 1-to-1 dựa theo thứ tự tuyến tính
    # Ánh xạ chỉ số từ canonical N sang M từ Whisper
    aligned = []
    for i, tok in enumerate(gt_tokens):
        # Tỷ lệ tiến độ thời gian tương ứng
        w_idx = min(int(round(i * (M - 1) / max(1, N - 1))), M - 1)
        w_obj = whisper_words[w_idx]
        
        # Đảm bảo start và end tăng dần hợp lý
        start_t = round(w_obj['start'], 2)
        end_t = round(w_obj['end'], 2)
        
        if aligned:
            prev_end = aligned[-1]['end']
            if start_t < prev_end:
                start_t = prev_end
            if end_t <= start_t:
                end_t = round(start_t + 0.25, 2)
                
        aligned.append({
            "word": tok,
            "start": start_t,
            "end": end_t
        })
    return aligned

def main():
    print("=== BƯỚC 2: TRÍCH XUẤT TIMESTAMPS CHUẨN XÁC VỚI FASTER-WHISPER ===")
    whisper_path = r'C:\Users\Minh\.cache\huggingface\hub\models--mobiuslabsgmbh--faster-whisper-large-v3-turbo\snapshots\0a363e9161cbc7ed1431c9597a8ceaf0c4f78fcf'
    
    # Sử dụng CUDA nếu khả dụng để tốc độ nhanh nhất
    try:
        model = WhisperModel(whisper_path, device='cuda', compute_type='float16')
        print("✓ Đã khởi tạo Faster-Whisper trên NVIDIA GPU (CUDA).")
    except Exception as e:
        print(f"Cảnh báo CUDA: {e}. Chuyển sang CPU int8.")
        model = WhisperModel(whisper_path, device='cpu', compute_type='int8')

    results = {}

    for page_num in range(1, 10):
        mp3_path = f"assets/audio/story_{page_num}.mp3"
        gt_text = GROUND_TRUTH[page_num]
        print(f"-> Đang phân tích timestamp cho Trang {page_num} ({mp3_path})...")

        # Cung cấp initial_prompt để Whisper hiểu ngữ cảnh từ vựng chính xác
        segments, info = model.transcribe(
            mp3_path, 
            word_timestamps=True, 
            language='vi',
            initial_prompt=gt_text
        )
        whisper_words = []

        for seg in segments:
            for w in seg.words:
                cleaned = w.word.strip()
                if cleaned:
                    whisper_words.append({
                        "word": cleaned,
                        "start": round(w.start, 2),
                        "end": round(w.end, 2)
                    })

        # Căn chỉnh với từ gốc chuẩn chính tả
        aligned_words = align_words_with_timestamps(gt_text, whisper_words)
        duration = aligned_words[-1]["end"] if aligned_words else (whisper_words[-1]["end"] if whisper_words else 0)

        results[str(page_num)] = {
            "page": page_num,
            "duration": duration,
            "words": aligned_words
        }
        print(f"   ✓ Đã căn chỉnh {len(aligned_words)} từ chuẩn chính tả, duration: {duration:.2f}s")

    os.makedirs('assets/data', exist_ok=True)
    with open('assets/data/word_timestamps.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    # Đồng bộ trực tiếp vào js/word-timestamps.js
    with open('js/word-timestamps.js', 'w', encoding='utf-8') as f:
        f.write("/** Word-level timestamps generated by Faster-Whisper & Aligned to Ground Truth */\n")
        f.write("const WORD_TIMESTAMPS = ")
        json.dump(results, f, ensure_ascii=False, indent=2)
        f.write(";\n")

    print("\n✅ HOÀN TẤT ĐỒNG BỘ TIMESTAMPS VÀO assets/data/word_timestamps.json & js/word-timestamps.js!")

if __name__ == '__main__':
    main()
