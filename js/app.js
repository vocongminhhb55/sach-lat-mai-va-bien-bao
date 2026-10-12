/**
 * Bộ điều khiển Sách Video Tương Tác Hiện Đại (Modern Storybook Video Player)
 * Mai và Chuyến Phiêu Lưu Của Những Biển Báo
 * Tác giả: Kim Thanh Lê Huỳnh
 */

document.addEventListener('DOMContentLoaded', () => {
  // Các phần tử giao diện
  const coverImage = document.getElementById('cover-image');
  const storyVideo = document.getElementById('story-video');
  const coverIntro = document.getElementById('cover-intro');
  const storyTextContainer = document.getElementById('story-text-container');
  const storyParagraph = document.getElementById('story-paragraph');
  const endView = document.getElementById('end-view');
  const mainAudio = document.getElementById('main-audio');
  const audioProgressWrap = document.getElementById('audio-progress-wrap');
  const audioProgressBar = document.getElementById('audio-progress-bar');
  const pageNumberDisplay = document.getElementById('page-number-display');
  const speakingIndicator = document.getElementById('speaking-indicator');
  const btnStartReading = document.getElementById('btn-start-reading');
  const btnReplayAll = document.getElementById('btn-replay-all');

  // Nút điều khiển (Control Dock)
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

  // Trạng thái ứng dụng
  // 0: Bìa sách, 1..9: Trang truyện 1 đến 9, 10: Màn hình kết thúc
  let currentPage = 0;
  let isPlaying = false;
  let autoTurnPages = true;
  let isMuted = false;
  let animFrameId = null;

  const timestamps = typeof WORD_TIMESTAMPS !== 'undefined' ? WORD_TIMESTAMPS : {};

  // 1. Chuyển đến trang cụ thể
  function goToPage(pageNum, autoPlay = true) {
    if (pageNum < 0 || pageNum > 10) return;

    // Dừng tiến trình cũ
    stopCurrentAudio();
    currentPage = pageNum;

    // Cập nhật giao diện theo trang
    if (currentPage === 0) {
      // TRANG BÌA SÁCH
      coverImage.style.display = 'block';
      storyVideo.style.display = 'none';
      storyVideo.pause();

      coverIntro.style.display = 'block';
      storyTextContainer.style.display = 'none';
      endView.style.display = 'none';

      audioProgressWrap.style.display = 'none';
      pageNumberDisplay.textContent = 'Bìa sách';
      dockPageInfo.textContent = 'Bìa sách';
      setPlayingState(false);
    } 
    else if (currentPage >= 1 && currentPage <= 9) {
      // CÁC TRANG TRUYỆN 1 ĐẾN 9
      coverImage.style.display = 'none';
      storyVideo.style.display = 'block';

      // Nạp và phát video hoạt hình của trang hiện tại
      const videoSrc = `assets/videos/story_${currentPage}.mp4`;
      if (storyVideo.getAttribute('src') !== videoSrc) {
        storyVideo.setAttribute('src', videoSrc);
        storyVideo.load();
      }
      storyVideo.play().catch(() => {});

      coverIntro.style.display = 'none';
      storyTextContainer.style.display = 'block';
      endView.style.display = 'none';

      audioProgressWrap.style.display = 'block';
      audioProgressBar.style.width = '0%';
      pageNumberDisplay.textContent = `Trang ${currentPage}`;
      dockPageInfo.textContent = `Trang ${currentPage} / 9`;

      // Render danh sách từ Karaoke
      renderStoryWords(currentPage);

      // Nạp audio
      mainAudio.src = `assets/audio/story_${currentPage}.mp3`;
      mainAudio.muted = isMuted;
      mainAudio.currentTime = 0;

      if (autoPlay) {
        startPlayingAudio();
      } else {
        setPlayingState(false);
      }
    } 
    else if (currentPage === 10) {
      // MÀN HÌNH KẾT THÚC
      coverImage.style.display = 'block';
      coverImage.src = 'assets/pages/cover_back.jpg';
      storyVideo.style.display = 'none';
      storyVideo.pause();

      coverIntro.style.display = 'none';
      storyTextContainer.style.display = 'none';
      endView.style.display = 'block';

      audioProgressWrap.style.display = 'none';
      pageNumberDisplay.textContent = 'Lời kết';
      dockPageInfo.textContent = 'Kết thúc';
      setPlayingState(false);
    }

    updateThumbnailActive();
  }

  // 2. Render từng từ của trang để chạy Karaoke
  function renderStoryWords(pageNum) {
    const pageInfo = timestamps[pageNum] || { words: [] };
    const words = pageInfo.words;

    if (words.length > 0) {
      storyParagraph.innerHTML = words.map((w, idx) => {
        return `<span class="word" id="word-${pageNum}-${idx}" data-start="${w.start}" data-end="${w.end}">${w.word} </span>`;
      }).join('');
    } else {
      // Dự phòng từ BOOK_DATA
      const story = BOOK_DATA.pages.find(p => p.pageNumber === pageNum);
      if (story) {
        storyParagraph.innerHTML = story.text.split(' ').map((w, idx) => {
          return `<span class="word" id="word-${pageNum}-${idx}">${w} </span>`;
        }).join('');
      }
    }
  }

  // 3. Phát âm thanh tiếng Việt & đồng bộ Karaoke (Highlight & Unhighlight chuẩn xác)
  function startPlayingAudio() {
    if (currentPage < 1 || currentPage > 9) return;

    mainAudio.play().then(() => {
      setPlayingState(true);
      speakingIndicator.classList.add('active');
      storyVideo.play().catch(() => {});
      syncKaraokeLoop();
    }).catch(err => {
      console.warn("Audio autoplay blocked by browser policy:", err);
      setPlayingState(false);
    });
  }

  function syncKaraokeLoop() {
    if (mainAudio.paused || mainAudio.ended) return;

    const t = mainAudio.currentTime;
    const dur = mainAudio.duration || 1;
    audioProgressBar.style.width = `${Math.min(100, (t / dur) * 100)}%`;

    const pageInfo = timestamps[currentPage] || { words: [] };
    const words = pageInfo.words;

    // Cập nhật trạng thái từng từ: highlight hoặc unhighlight
    words.forEach((w, idx) => {
      const el = document.getElementById(`word-${currentPage}-${idx}`);
      if (!el) return;

      if (t >= w.start && t < w.end) {
        // ĐANG ĐỌC ĐẾN TỪ NÀY -> BẬT highlight vàng cam
        el.classList.add('karaoke-current');
        el.classList.remove('karaoke-past');
      } else if (t >= w.end) {
        // ĐÃ ĐỌC XONG TỪ NÀY -> TẮT highlight (unhighlight) ngay lập tức
        el.classList.remove('karaoke-current');
        el.classList.add('karaoke-past');
      } else {
        // CHƯA ĐỌC ĐẾN
        el.classList.remove('karaoke-current', 'karaoke-past');
      }
    });

    animFrameId = requestAnimationFrame(syncKaraokeLoop);
  }

  // Khi đọc hết audio của trang hiện tại
  mainAudio.onended = () => {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    speakingIndicator.classList.remove('active');
    audioProgressBar.style.width = '100%';

    // Đánh dấu tất cả từ đã đọc xong
    document.querySelectorAll('.word').forEach(el => {
      el.classList.remove('karaoke-current');
      el.classList.add('karaoke-past');
    });

    // Tự động qua trang nếu bật autoTurnPages
    if (autoTurnPages) {
      setTimeout(() => {
        if (currentPage < 9) {
          goToPage(currentPage + 1, true); // Qua trang tiếp theo và đọc ngay
        } else if (currentPage === 9) {
          goToPage(10, false); // Tới màn hình kết thúc
        }
      }, 1400); // Khoảng nghỉ 1.4s tự nhiên cho bé quan sát
    } else {
      setPlayingState(false);
    }
  };

  function stopCurrentAudio() {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    mainAudio.pause();
    mainAudio.currentTime = 0;
    speakingIndicator.classList.remove('active');
  }

  function setPlayingState(playing) {
    isPlaying = playing;
    if (playing) {
      iconPlay.style.display = 'none';
      iconPause.style.display = 'block';
      btnPlayPause.title = 'Tạm dừng đọc';
    } else {
      iconPlay.style.display = 'block';
      iconPause.style.display = 'none';
      btnPlayPause.title = 'Bắt đầu đọc';
    }
  }

  // 4. Điều hướng trang
  function nextPage() {
    if (currentPage === 0) {
      goToPage(1, isPlaying || true); // Từ bìa vào thẳng Trang 1 (không bỏ qua trang 1!)
    } else if (currentPage < 10) {
      goToPage(currentPage + 1, isPlaying);
    }
  }

  function prevPage() {
    if (currentPage > 0) {
      goToPage(currentPage - 1, isPlaying);
    }
  }

  // 5. Gắn sự kiện các nút bấm
  btnStartReading.addEventListener('click', () => {
    goToPage(1, true); // Bắt đầu vào thẳng Trang 1 và đọc ngay
  });

  btnReplayAll.addEventListener('click', () => {
    goToPage(0, false);
  });

  btnPlayPause.addEventListener('click', () => {
    if (currentPage === 0) {
      goToPage(1, true);
      return;
    }

    if (isPlaying) {
      mainAudio.pause();
      storyVideo.pause();
      setPlayingState(false);
      speakingIndicator.classList.remove('active');
      if (animFrameId) cancelAnimationFrame(animFrameId);
    } else {
      startPlayingAudio();
    }
  });

  btnPrev.addEventListener('click', prevPage);
  btnNext.addEventListener('click', nextPage);

  btnReplayPage.addEventListener('click', () => {
    if (currentPage >= 1 && currentPage <= 9) {
      goToPage(currentPage, true);
    }
  });

  btnAutoTurn.addEventListener('click', () => {
    autoTurnPages = !autoTurnPages;
    if (autoTurnPages) {
      btnAutoTurn.classList.add('active');
      btnAutoTurn.querySelector('span').textContent = 'Tự qua trang: Bật';
    } else {
      btnAutoTurn.classList.remove('active');
      btnAutoTurn.querySelector('span').textContent = 'Tự qua trang: Tắt';
    }
  });

  btnMute.addEventListener('click', () => {
    isMuted = !isMuted;
    mainAudio.muted = isMuted;
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

  // Modal mục lục Thumbnails
  function renderThumbnails() {
    let html = `
      <div class="thumb-card active" data-page="0">
        <img src="assets/pages/cover_front.jpg" alt="Bìa sách">
        <span>Bìa sách</span>
      </div>
    `;

    for (let i = 1; i <= 9; i++) {
      html += `
        <div class="thumb-card" data-page="${i}">
          <img src="assets/pages/story_${i}_left.jpg" alt="Trang ${i}">
          <span>Trang ${i}</span>
        </div>
      `;
    }

    html += `
      <div class="thumb-card" data-page="10">
        <img src="assets/pages/cover_back.jpg" alt="Kết thúc">
        <span>Kết thúc</span>
      </div>
    `;

    thumbnailsGrid.innerHTML = html;

    document.querySelectorAll('.thumb-card').forEach(card => {
      card.addEventListener('click', () => {
        const targetPage = parseInt(card.getAttribute('data-page'));
        goToPage(targetPage, true);
        closeDrawer();
      });
    });
  }

  function updateThumbnailActive() {
    document.querySelectorAll('.thumb-card').forEach(card => {
      const p = parseInt(card.getAttribute('data-page'));
      if (p === currentPage) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  }

  function openDrawer() {
    drawerOverlay.classList.add('open');
  }

  function closeDrawer() {
    drawerOverlay.classList.remove('open');
  }

  btnDrawer.addEventListener('click', openDrawer);
  btnCloseDrawer.addEventListener('click', closeDrawer);
  drawerOverlay.addEventListener('click', (e) => {
    if (e.target === drawerOverlay) closeDrawer();
  });

  // Toàn màn hình
  btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // Phím tắt bàn phím
  window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') {
      prevPage();
    } else if (e.code === 'ArrowRight') {
      nextPage();
    } else if (e.code === 'Space') {
      e.preventDefault();
      btnPlayPause.click();
    } else if (e.code === 'Escape') {
      closeDrawer();
    }
  });

  // Khởi động tại Trang Bìa (0)
  renderThumbnails();
  goToPage(0, false);
});
