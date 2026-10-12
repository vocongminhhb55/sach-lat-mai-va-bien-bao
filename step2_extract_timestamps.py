import os
import sys
import json
from faster_whisper import WhisperModel

sys.stdout.reconfigure(encoding='utf-8')

def main():
    print("=== BƯỚC 2: TRÍCH XUẤT TIMESTAMPS TỪNG TỪ BẰNG FASTER-WHISPER ===")
    whisper_path = r'C:\Users\Minh\.cache\huggingface\hub\models--mobiuslabsgmbh--faster-whisper-large-v3-turbo\snapshots\0a363e9161cbc7ed1431c9597a8ceaf0c4f78fcf'
    model = WhisperModel(whisper_path, device='cpu', compute_type='int8')

    results = {}

    for page_num in range(1, 10):
        mp3_path = f"assets/audio/story_{page_num}.mp3"
        print(f"-> Đang phân tích timestamp cho Trang {page_num} ({mp3_path})...")

        segments, info = model.transcribe(mp3_path, word_timestamps=True, language='vi')
        words_list = []

        for seg in segments:
            for w in seg.words:
                cleaned = w.word.strip()
                if cleaned:
                    words_list.append({
                        "word": cleaned,
                        "start": round(w.start, 2),
                        "end": round(w.end, 2)
                    })

        duration = words_list[-1]["end"] if words_list else 0
        results[page_num] = {
            "page": page_num,
            "duration": duration,
            "words": words_list
        }
        print(f"   ✓ Đã trích xuất {len(words_list)} từ, tổng thời lượng: {duration:.2f}s")

    os.makedirs('assets/data', exist_ok=True)
    with open('assets/data/word_timestamps.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print("\n✅ HOÀN TẤT TRÍCH XUẤT TIMESTAMPS VÀO assets/data/word_timestamps.json!")

if __name__ == '__main__':
    main()

