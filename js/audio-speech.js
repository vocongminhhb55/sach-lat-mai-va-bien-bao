/**
 * Trình quản lý Âm thanh và Giọng đọc Tiếng Việt (Web Speech API + Web Audio API)
 */
class SpeechNarrator {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voices = [];
    this.vietnameseVoice = null;
    this.currentUtterance = null;
    this.isSpeaking = false;
    this.isPaused = false;
    this.speechRate = 0.95; // Tốc độ ấm áp, rõ ràng cho thiếu nhi
    this.pitch = 1.05;      // Cao độ vui tươi
    this.onWordBoundary = null;
    this.onSpeechEnd = null;
    this.audioCtx = null;
    this.isMuted = false;

    this.initVoices();
  }

  // Khởi tạo AudioContext cho các hiệu ứng âm thanh
  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  initVoices() {
    if (!this.synth) return;
    const loadVoices = () => {
      this.voices = this.synth.getVoices();
      // Ưu tiên giọng tiếng Việt chất lượng cao
      const viVoices = this.voices.filter(v => v.lang.includes('vi') || v.lang.includes('VI'));
      if (viVoices.length > 0) {
        // Ưu tiên Hoài My hoặc Nam Minh (Microsoft Neural)
        this.vietnameseVoice = viVoices.find(v => v.name.includes('HoaiMy') || v.name.includes('Natural')) 
          || viVoices.find(v => v.name.includes('NamMinh')) 
          || viVoices[0];
      }
    };

    loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
  }

  // Phát âm thanh tiếng lật trang sách giấy chân thực
  playFlipSound() {
    if (this.isMuted) return;
    try {
      if (!this.flipAudio) {
        this.flipAudio = new Audio('assets/audio/page_flip.mp3');
        this.flipAudio.preload = 'auto';
      }
      this.flipAudio.currentTime = 0;
      this.flipAudio.volume = 0.75;
      this.flipAudio.play().catch(e => {
        // Fallback nhẹ nếu browser chặn
      });
    } catch (e) {
      console.warn("Không thể phát âm thanh lật trang:", e);
    }
  }

  // Âm thanh chuông lấp lánh (khi biển báo sáng hoặc tương tác)
  playChimeSound() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.07 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.07);
        osc.stop(ctx.currentTime + idx * 0.07 + 0.35);
      });
    } catch (e) {}
  }

  // Âm thanh chuông xe đạp kính coong
  playRingSound() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      [1760, 2093].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        const start = ctx.currentTime + idx * 0.12;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.25);
      });
    } catch (e) {}
  }

  // Âm thanh cảnh báo nhẹ (biển cấm/nguy hiểm)
  playAlertSound() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  }

  // Âm thanh ô tô chạy lướt qua
  playCarSound() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.25);
      osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {}
  }

  // Âm thanh pháo hoa kết bài
  playFanfareSound() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const melody = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      melody.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const start = ctx.currentTime + idx * 0.1;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.5);
      });
    } catch (e) {}
  }

  playSoundByType(type) {
    switch (type) {
      case 'ring': this.playRingSound(); break;
      case 'alert': this.playAlertSound(); break;
      case 'car': this.playCarSound(); break;
      case 'fanfare': this.playFanfareSound(); break;
      case 'chime':
      default: this.playChimeSound(); break;
    }
  }

  // Bắt đầu đọc đoạn văn bản tiếng Việt
  speak(text, wordRanges, onWordBoundary, onEnd) {
    if (!this.synth) return;
    this.stop(); // Dừng câu cũ nếu có

    // Tự động tìm lại giọng nếu chưa tải xong lúc trước
    if (!this.vietnameseVoice) {
      this.initVoices();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    if (this.vietnameseVoice) {
      utterance.voice = this.vietnameseVoice;
    }
    utterance.rate = this.speechRate;
    utterance.pitch = this.pitch;

    utterance.onboundary = (event) => {
      if (event.name === 'word' || event.charIndex !== undefined) {
        if (onWordBoundary) {
          onWordBoundary(event.charIndex, event.charLength || 0);
        }
      }
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.isPaused = false;
      if (onEnd) onEnd();
    };

    utterance.onerror = (err) => {
      console.warn("Speech error:", err);
      this.isSpeaking = false;
      this.isPaused = false;
      // Vẫn gọi onEnd để tự chuyển trang nếu lỗi giọng
      if (onEnd) setTimeout(onEnd, 1500);
    };

    this.currentUtterance = utterance;
    this.isSpeaking = true;
    this.isPaused = false;
    this.synth.speak(utterance);
  }

  pause() {
    if (this.synth && this.isSpeaking && !this.isPaused) {
      this.synth.pause();
      this.isPaused = true;
    }
  }

  resume() {
    if (this.synth && this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
    }
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.isPaused = false;
    }
  }

  setRate(rate) {
    this.speechRate = rate;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stop();
    }
    return this.isMuted;
  }
}

window.SpeechNarrator = SpeechNarrator;

