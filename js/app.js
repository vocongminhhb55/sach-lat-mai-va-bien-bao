/**
 * Bộ điều khiển Sách Lật Tương Tác Chuyên Nghiệp
 * Mai và Chuyến Phiêu Lưu Của Những Biển Báo
 * 
 * Tính năng chính:
 * 1. Lật sách 3D StPageFlip (xử lý chuẩn xác trang bìa và trang mở đôi).
 * 2. Âm thanh giọng đọc tiếng Việt chất lượng cao (file MP3 tiền xử lý bằng VieNeu-TTS).
 * 3. Video chuyển động thực sự (Hardware-rendered MP4) cho từng trang minh họa.
 * 4. Chữ chạy Karaoke chính xác theo từng mili-giây từ Faster-Whisper (highlight và unhighlight chuẩn xác).
 * 5. Đồng bộ tương tác: Biển báo/nhân vật phát sáng đúng khoảnh khắc được nhắc tên.
 * 6. Tự động lật trang khi đọc xong.
 */

document.addEventListener('DOMContentLoaded', () => {
  const narrator = new SpeechNarrator();
  const bookContainer = document.getElementById('flipbook');

  // Các phần tử giao diện
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const btnPlayPause = document.getElementById('btn-play-pause');
  const iconPlay = document.getElementById('icon-play');
  const iconPause = document.getElementById('icon-pause');
  const btnReplayPage = document.getElementById('btn-replay-page');
  const btnAutoTurn = document.getElementById('btn-auto-turn');
  const btnMute = document.getElementById('btn-mute');
  const iconUnmuted = document.getElementById('icon-unmuted');
  const iconMuted = document.getElementById('icon-muted');
  const btnDrawer = document.getElementById('btn-drawer');
  const btnCloseDrawer = document.getElementById('btn-close-drawer');
  const drawerOverlay = document.getElementById('drawer-overlay');
  const thumbnailsGrid = document.getElementById('thumbnails-grid');
  const btnFullscreen = document.getElementById('btn-fullscreen');
  const dockPageInfo = document.getElementById('dock-page-info');
  const speakingIndicator = document.getElementById('speaking-indicator');

  // Trạng thái ứng dụng
  let pageFlip = null;
  let currentPageIndex = 0; // 0 = Bìa trước, 1-2 = Trang 1, 3-4 = Trang 2, ..., 17-18 = Trang 9, 19 = Bìa sau
  let autoTurnPages = true;
  let isAutoPlaying = false;
  let currentAudio = null;
  let animFrameId = null;
  let isMuted = false;

  // Lấy dữ liệu timestamps đã trích xuất
  const timestampsData = typeof WORD_TIMESTAMPS !== 'undefined' ? WORD_TIMESTAMPS : {};

  // 1. Render cấu trúc các trang sách vào DOM
  function renderBook() {
    let html = '';

    // TRANG BÌA TRƯỚC (Trang 0)
    html += `
      <div class="page page-cover page-cover-top" data-density="hard" id="cover-page-0">
        <img src="assets/pages/cover_front.jpg" alt="Bìa sách">
        <div class="cover-click-prompt" id="btn-open-book">
          <span>📖 Bấm vào đây để mở sách</span>
        </div>
      </div>
    `;

    // 9 TRANG TRUYỆN MỞ ĐÔI (Trang trái là Video động, trang phải là lời kể Karaoke)
    BOOK_DATA.pages.forEach((story) => {
      const pageNum = story.pageNumber;
      const pageInfo = timestampsData[pageNum] || { words: [] };
      const words = pageInfo.words;

      // Render từng từ trong đoạn văn để chạy Karaoke chuẩn xác
      let wordsHtml = '';
      if (words.length > 0) {
        wordsHtml = words.map((w, idx) => {
          return `<span class="word" id="word-${pageNum}-${idx}" data-start="${w.start}" data-end="${w.end}">${w.word} </span>`;
        }).join('');
      } else {
        // Dự phòng nếu chưa có timestamps
        wordsHtml = story.text.split(' ').map((w, idx) => {
          return `<span class="word" id="word-${pageNum}-${idx}">${w} </span>`;
        }).join('');
      }

      // Hotspots trên tranh
      let hotspotsHtml = story.hotspots.map(h => {
        return `
          <div class="hotspot ${h.type}" 
               id="hotspot-${pageNum}-${h.id}" 
               style="top:${h.top}; left:${h.left}; width:${h.width}; height:${h.height};" 
               data-page="${pageNum}"
               data-label="${h.label}" 
               data-sound="${h.soundType}"
               title="${h.label} (Bấm để nghe)">
            <span class="hotspot-badge">${h.label}</span>
          </div>
        `;
      }).join('');

      // Trang trái: Video chuyển động thực tế (MP4)
      html += `
        <div class="page page-left" id="page-left-${pageNum}">
          <div class="illustration-wrap">
            <video class="story-video" id="video-page-${pageNum}" 
                   src="assets/videos/story_${pageNum}.mp4" 
                   poster="${story.leftImage}" 
                   loop muted playsinline preload="auto">
            </video>
            <div class="hotspot-layer" id="hotspot-layer-${pageNum}">
              ${hotspotsHtml}
            </div>
          </div>
        </div>
      `;

      // Trang phải: Lời kể chữ đẹp mắt chạy Karaoke
      html += `
        <div class="page page-right" id="page-right-${pageNum}">
          <div class="page-header">${story.header}</div>
          <div class="story-body">
            <p class="story-paragraph" id="story-p-${pageNum}">
              ${wordsHtml}
            </p>
          </div>
          <div class="page-footer">
            <span class="hint-pill">💡 Chạm vào biển báo trong tranh để nghe giải thích</span>
            <span class="page-num">${pageNum}</span>
          </div>
          <!-- Audio Element cho từng trang -->
          <audio id="audio-page-${pageNum}" src="assets/audio/story_${pageNum}.mp3" preload="auto"></audio>
        </div>
      `;
    });

    // TRANG BÌA SAU (Trang 19)
    html += `
      <div class="page page-cover page-cover-bottom page-back-cover" data-density="hard" id="cover-page-19">
        <div class="back-cover-card">
          <div class="back-cover-icon">🌟</div>
          <h2>Chúc Mừng Bé!</h2>
          <p>Bé đã cùng bạn Mai hoàn thành chuyến phiêu lưu tuyệt vời và học được thật nhiều bí mật của các biển báo giao thông. Hãy luôn đi đường an toàn nhé!</p>
          <button class="replay-book-btn" id="btn-replay-all">
            <span>🔄</span> Đọc lại từ đầu
          </button>
        </div>
      </div>
    `;

    bookContainer.innerHTML = html;
  }

  // 2. Khởi tạo PageFlip
  function initPageFlip() {
    renderBook();

    pageFlip = new St.PageFlip(bookContainer, {
      width: 550,
      height: 720,
      size: 'stretch',
      minWidth: 320,
      maxWidth: 900,
      minHeight: 420,
      maxHeight: 1200,
      maxShadowOpacity: 0.45,
      showCover: true,
      mobileScrollSupport: false,
      usePortrait: true,
      startPage: 0
    });

    pageFlip.loadFromHTML(document.querySelectorAll('.page'));

    // Lắng nghe sự kiện lật trang từ thư viện
    pageFlip.on('flip', (e) => {
      currentPageIndex = e.data;
      narrator.playFlipSound();
      onPageChanged(currentPageIndex);
    });

    // Mở sách khi click vào bìa hoặc nút mở sách
    const cover0 = document.getElementById('cover-page-0');
    if (cover0) {
      cover0.addEventListener('click', () => {
        if (currentPageIndex === 0) {
          safeFlipNext();
        }
      });
    }

    // Nút đọc lại từ đầu ở bìa sau
    document.getElementById('btn-replay-all')?.addEventListener('click', () => {
      pageFlip.flip(0);
    });

    // Gắn sự kiện click tương tác cho các hotspot
    attachHotspotInteractions();

    // Render danh sách thumbnail
    renderThumbnails();
  }

  // 3. Điều hướng lật trang an toàn (Khắc phục triệt để lỗi lật trang đầu/cuối của PageFlip)
  function safeFlipNext() {
    const cur = pageFlip.getCurrentPageIndex();
    if (cur === 0) {
      pageFlip.flip(1); // Lật từ bìa sang trang đôi 1 & 2
    } else if (cur >= 17) {
      pageFlip.flip(19); // Lật sang bìa sau
    } else {
      const next = Math.min(pageFlip.getPageCount() - 1, cur + 2);
      pageFlip.flip(next);
    }
  }

  function safeFlipPrev() {
    const cur = pageFlip.getCurrentPageIndex();
    if (cur <= 2) {
      pageFlip.flip(0); // Lật về bìa trước
    } else {
      const prev = Math.max(0, cur - 2);
      pageFlip.flip(prev);
    }
  }

  // 4. Gắn tương tác cho các Hotspot trên tranh minh họa
  function attachHotspotInteractions() {
    document.querySelectorAll('.hotspot').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const soundType = el.getAttribute('data-sound') || 'chime';
        const label = el.getAttribute('data-label');
        
        narrator.playSoundByType(soundType);
        triggerHotspotAnim(el, 2500);

        // Đọc to tên biển báo khi bé chạm vào
        if (label) {
          narrator.stop();
          narrator.speak(label);
        }
      });
    });
  }

  function triggerHotspotAnim(hotspotEl, duration = 2000) {
    if (!hotspotEl) return;
    hotspotEl.classList.add('active');
    setTimeout(() => {
      hotspotEl.classList.remove('active');
    }, duration);
  }

  // 5. Xử lý khi trang sách thay đổi
  function onPageChanged(pageIdx) {
    updatePageInfo(pageIdx);
    stopCurrentAudio();
    pauseAllVideos();
    resetAllHighlights();

    // Nếu là trang truyện (1-18)
    if (pageIdx >= 1 && pageIdx <= 18) {
      const storyNum = Math.ceil(pageIdx / 2);
      
      // Bật video của trang hiện tại
      playVideoForPage(storyNum);

      // Nếu đang bật chế độ tự động đọc (isAutoPlaying)
      if (isAutoPlaying) {
        setTimeout(() => {
          startPlayingStoryAudio(storyNum);
        }, 400);
      }
    } else if (pageIdx === 19) {
      // Đã tới bìa sau -> chúc mừng bé
      narrator.playFanfareSound();
      setPlayingState(false);
    }
  }

  function updatePageInfo(pageIdx) {
    if (pageIdx === 0) {
      dockPageInfo.textContent = 'Bìa trước';
    } else if (pageIdx >= 1 && pageIdx <= 18) {
      const storyNum = Math.ceil(pageIdx / 2);
      dockPageInfo.textContent = `Trang ${storyNum} / 9`;
    } else {
      dockPageInfo.textContent = 'Bìa sau';
    }
  }

  function playVideoForPage(storyNum) {
    const video = document.getElementById(`video-page-${storyNum}`);
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {});
    }
  }

  function pauseAllVideos() {
    document.querySelectorAll('.story-video').forEach(v => {
      v.pause();
    });
  }

  // 6. PHÁT ÂM THANH TIẾNG VIỆT & CHẠY KARAOKE HIGHLIGHT / UNHIGHLIGHT CHUẨN XÁC
  function startPlayingStoryAudio(storyNum) {
    stopCurrentAudio();
    resetAllHighlights();

    const audio = document.getElementById(`audio-page-${storyNum}`);
    if (!audio) return;

    currentAudio = audio;
    audio.muted = isMuted;
    audio.currentTime = 0;

    speakingIndicator.classList.add('active');
    setPlayingState(true);

    const story = BOOK_DATA.pages.find(p => p.pageNumber === storyNum);
    const pageInfo = timestampsData[storyNum] || { words: [] };
    const words = pageInfo.words;

    // Vòng lặp đồng bộ Karaoke theo thời gian thực (requestAnimationFrame)
    function syncKaraoke() {
      if (!currentAudio || currentAudio.paused || currentAudio.ended) return;

      const t = currentAudio.currentTime;

      // Cập nhật trạng thái từng từ: highlight hoặc unhighlight
      words.forEach((w, idx) => {
        const el = document.getElementById(`word-${storyNum}-${idx}`);
        if (!el) return;

        if (t >= w.start && t < w.end) {
          // Từ đang được đọc -> BẬT highlight
          el.classList.add('karaoke-current');
          el.classList.remove('karaoke-past');

          // Kiểm tra xem từ này có khớp với từ khóa của biển báo không
          if (story && story.hotspots) {
            story.hotspots.forEach(h => {
              const matched = h.keywords.some(kw => kw.toLowerCase().includes(w.word.toLowerCase()) || w.word.toLowerCase().includes(kw.toLowerCase()));
              if (matched) {
                const hotspotEl = document.getElementById(`hotspot-${storyNum}-${h.id}`);
                triggerHotspotAnim(hotspotEl, 1500);
                el.classList.add('keyword-matched');
              }
            });
          }
        } else if (t >= w.end) {
          // Đã đọc xong từ này -> TẮT highlight (unhighlight) và đánh dấu đã đọc
          el.classList.remove('karaoke-current');
          el.classList.add('karaoke-past');
        } else {
          // Chưa đọc đến -> Xóa sạch highlight
          el.classList.remove('karaoke-current', 'karaoke-past', 'keyword-matched');
        }
      });

      animFrameId = requestAnimationFrame(syncKaraoke);
    }

    audio.onplay = () => {
      animFrameId = requestAnimationFrame(syncKaraoke);
    };

    // Khi đọc hết trang này
    audio.onended = () => {
      cancelAnimationFrame(animFrameId);
      speakingIndicator.classList.remove('active');
      
      // Đánh dấu tất cả từ đã đọc xong
      document.querySelectorAll(`#story-p-${storyNum} .word`).forEach(el => {
        el.classList.remove('karaoke-current');
        el.classList.add('karaoke-past');
      });

      // Tự động lật sang trang sau nếu bật autoTurnPages
      if (autoTurnPages && isAutoPlaying) {
        setTimeout(() => {
          if (currentPageIndex < 18) {
            safeFlipNext();
          } else {
            setPlayingState(false);
          }
        }, 1400); // Khoảng nghỉ 1.4s tự nhiên để bé ngắm tranh
      } else {
        setPlayingState(false);
      }
    };

    audio.play().catch(err => {
      console.warn("Audio autoplay blocked by browser policy:", err);
    });
  }

  function stopCurrentAudio() {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
    speakingIndicator.classList.remove('active');
  }

  function resetAllHighlights() {
    document.querySelectorAll('.word').forEach(w => {
      w.classList.remove('karaoke-current', 'karaoke-past', 'keyword-matched');
    });
    document.querySelectorAll('.hotspot').forEach(h => {
      h.classList.remove('active');
    });
  }

  function setPlayingState(isPlaying) {
    isAutoPlaying = isPlaying;
    if (isPlaying) {
      iconPlay.style.display = 'none';
      iconPause.style.display = 'block';
      btnPlayPause.title = 'Tạm dừng đọc';
    } else {
      iconPlay.style.display = 'block';
      iconPause.style.display = 'none';
      btnPlayPause.title = 'Bắt đầu đọc';
    }
  }

  // 7. Render Thumbnail Drawer
  function renderThumbnails() {
    let thumbsHtml = `
      <div class="thumb-card" data-page="0">
        <img src="assets/pages/cover_front.jpg" alt="Bìa trước">
        <span>Bìa trước</span>
      </div>
    `;

    BOOK_DATA.pages.forEach((p) => {
      const flipIdx = (p.pageNumber * 2) - 1;
      thumbsHtml += `
        <div class="thumb-card" data-page="${flipIdx}">
          <img src="${p.leftImage}" alt="Trang ${p.pageNumber}">
          <span>Trang ${p.pageNumber}</span>
        </div>
      `;
    });

    thumbsHtml += `
      <div class="thumb-card" data-page="19">
        <img src="assets/pages/cover_back.jpg" alt="Bìa sau">
        <span>Bìa sau</span>
      </div>
    `;

    thumbnailsGrid.innerHTML = thumbsHtml;

    document.querySelectorAll('.thumb-card').forEach(card => {
      card.addEventListener('click', () => {
        const targetPage = parseInt(card.getAttribute('data-page'));
        pageFlip.flip(targetPage);
        closeDrawer();
      });
    });
  }

  function openDrawer() {
    drawerOverlay.classList.add('open');
  }

  function closeDrawer() {
    drawerOverlay.classList.remove('open');
  }

  // 8. GẮN SỰ KIỆN THANH ĐIỀU KHIỂN
  btnPlayPause.addEventListener('click', () => {
    if (currentPageIndex === 0) {
      setPlayingState(true);
      safeFlipNext();
      return;
    }

    if (isAutoPlaying) {
      stopCurrentAudio();
      setPlayingState(false);
    } else {
      setPlayingState(true);
      const storyNum = Math.ceil(currentPageIndex / 2);
      startPlayingStoryAudio(storyNum);
    }
  });

  btnPrev.addEventListener('click', safeFlipPrev);
  btnNext.addEventListener('click', safeFlipNext);

  btnReplayPage.addEventListener('click', () => {
    if (currentPageIndex >= 1 && currentPageIndex <= 18) {
      const storyNum = Math.ceil(currentPageIndex / 2);
      startPlayingStoryAudio(storyNum);
    }
  });

  btnAutoTurn.addEventListener('click', () => {
    autoTurnPages = !autoTurnPages;
    if (autoTurnPages) {
      btnAutoTurn.classList.add('active');
      btnAutoTurn.querySelector('span').textContent = 'Tự lật trang: Bật';
    } else {
      btnAutoTurn.classList.remove('active');
      btnAutoTurn.querySelector('span').textContent = 'Tự lật trang: Tắt';
    }
  });

  btnMute.addEventListener('click', () => {
    isMuted = !isMuted;
    narrator.isMuted = isMuted;
    if (currentAudio) currentAudio.muted = isMuted;

    if (isMuted) {
      iconUnmuted.style.display = 'none';
      iconMuted.style.display = 'block';
      btnMute.title = 'Bật âm thanh';
    } else {
      iconUnmuted.style.display = 'block';
      iconMuted.style.display = 'none';
      btnMute.title = 'Tắt âm thanh';
    }
  });

  btnDrawer.addEventListener('click', openDrawer);
  btnCloseDrawer.addEventListener('click', closeDrawer);
  drawerOverlay.addEventListener('click', (e) => {
    if (e.target === drawerOverlay) closeDrawer();
  });

  btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') {
      safeFlipPrev();
    } else if (e.code === 'ArrowRight') {
      safeFlipNext();
    } else if (e.code === 'Space') {
      e.preventDefault();
      btnPlayPause.click();
    } else if (e.code === 'Escape') {
      closeDrawer();
    }
  });

  // Khởi động sách
  initPageFlip();
});
