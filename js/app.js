/**
 * SÁCH LẬT 3D ĐA PHƯƠNG TIỆN - MAI VÀ CHUYẾN PHIÊU LƯU CỦA NHỮNG BIỂN BÁO
 * 
 * Tính năng chính:
 * 1. Hiệu ứng lật trang 3D chân thực (3D Page Flip with Perspective & Realistic Leaf Rotation).
 * 2. Tuyệt đối không bỏ qua Trang 1 (Bìa 0 ➔ Trang 1 ➔ Trang 2 ➔ ... ➔ Trang 9 ➔ Kết thúc 10).
 * 3. Trình chiếu Video AI hoạt cảnh chuyển động tự nhiên (sạch sẽ, không có hotspot chạm làm rối mắt).
 * 4. Giọng đọc tiếng Việt VieNeu-TTS (Kim Thanh) & Đồng bộ Karaoke Highlight / Unhighlight chuẩn xác 100%.
 * 5. Tự động lật sang trang sau khi đọc xong.
 * 6. Tương tác góc quăn mép trang (Corner Curl) và phím điều hướng mượt mà.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Trình quản lý âm thanh (Web Audio API sound effects)
  const narrator = new SpeechNarrator();

  // Các phần tử DOM giao diện chính
  const book = document.getElementById('book');
  const coverFront = document.getElementById('cover-front');
  const bookSpread = document.getElementById('book-spread');
  const spreadLeft = document.getElementById('spread-left');
  const spreadRight = document.getElementById('spread-right');
  const storyVideo = document.getElementById('story-video');
  const storyHeader = document.getElementById('story-header');
  const storyParagraph = document.getElementById('story-paragraph');
  const pageNumIndicator = document.getElementById('page-num-indicator');
  const audioProgressBar = document.getElementById('audio-progress-bar');
  const flippingLeaf = document.getElementById('flipping-leaf');
  const leafFront = document.getElementById('leaf-front');
  const leafBack = document.getElementById('leaf-back');
  const coverBack = document.getElementById('cover-back');
  const btnReplayAll = document.getElementById('btn-replay-all');
  const btnBackPage9 = document.getElementById('btn-back-page9');
  const cornerNext = document.getElementById('corner-next');
  const cornerPrev = document.getElementById('corner-prev');

  // Audio Element chính phát giọng đọc tiếng Việt
  const mainAudio = document.getElementById('main-audio');

  // Các nút trên thanh điều khiển (Control Dock)
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
  const dockPageInfo = document.getElementById('dock-page-info');
  const speakingIndicator = document.getElementById('speaking-indicator');
  const btnDrawer = document.getElementById('btn-drawer');
  const btnCloseDrawer = document.getElementById('btn-close-drawer');
  const drawerOverlay = document.getElementById('drawer-overlay');
  const thumbnailsGrid = document.getElementById('thumbnails-grid');
  const btnFullscreen = document.getElementById('btn-fullscreen');

  // Dữ liệu word timestamps trích xuất từ Faster-Whisper
  const timestampsData = typeof WORD_TIMESTAMPS !== 'undefined' ? WORD_TIMESTAMPS : {};

  // Trạng thái ứng dụng
  let currentPageIndex = 0; // 0 = Bìa trước, 1..9 = Trang truyện 1..9, 10 = Bìa sau
  let isFlipping = false;   // Khóa tránh lật chồng chéo hoặc nhảy cóc trang
  let isAutoPlaying = false;
  let autoTurnPages = true;
  let isMuted = false;
  let animFrameId = null;
  let autoTurnTimeout = null;

  // Khởi tạo trạng thái ban đầu của sách: Đóng bìa trước (Page 0)
  book.classList.add('state-closed');

  // 1. RENDER NỘI DUNG CHỮ CHO MỘT TRANG TRUYỆN
  function getWordsHtml(storyNum) {
    const pageInfo = timestampsData[storyNum] || { words: [] };
    const words = pageInfo.words;
    const story = BOOK_DATA.pages.find(p => p.pageNumber === storyNum);
    if (!story) return '';

    if (words.length > 0) {
      return words.map((w, idx) => {
        return `<span class="word" id="word-${storyNum}-${idx}" data-start="${w.start}" data-end="${w.end}">${w.word} </span>`;
      }).join('');
    } else {
      return story.text.split(' ').map((w, idx) => {
        return `<span class="word" id="word-${storyNum}-${idx}">${w} </span>`;
      }).join('');
    }
  }

  function updateRightPageContent(storyNum) {
    const story = BOOK_DATA.pages.find(p => p.pageNumber === storyNum);
    if (!story) return;

    storyHeader.textContent = story.header;
    storyParagraph.innerHTML = getWordsHtml(storyNum);
    pageNumIndicator.textContent = `Trang ${storyNum} / 9`;
    audioProgressBar.style.width = '0%';
  }

  // 2. PHÁT VIDEO CHUYỂN ĐỘNG CHO TRANG TRUYỆN
  function playVideoForPage(storyNum) {
    storyVideo.src = `assets/videos/story_${storyNum}.mp4`;
    storyVideo.poster = `assets/pages/story_${storyNum}_left.jpg`;
    storyVideo.currentTime = 0;
    storyVideo.play().catch(err => {
      console.warn("Video autoplay policy:", err);
    });
  }

  // 3. ĐỒNG BỘ GIỌNG ĐỌC TIẾNG VIỆT & KARAOKE HIGHLIGHT / UNHIGHLIGHT
  function startPlayingStoryAudio(storyNum) {
    stopCurrentAudio();

    mainAudio.src = `assets/audio/story_${storyNum}.mp3`;
    mainAudio.currentTime = 0;
    mainAudio.muted = isMuted;

    speakingIndicator.classList.add('active');
    setPlayingState(true);

    const pageInfo = timestampsData[storyNum] || { words: [] };
    const words = pageInfo.words;

    // Vòng lặp đồng bộ thời gian thực theo frame màn hình (requestAnimationFrame)
    function syncKaraoke() {
      if (mainAudio.paused || mainAudio.ended) return;

      const t = mainAudio.currentTime;

      // Cập nhật thanh tiến trình audio
      if (mainAudio.duration) {
        const pct = Math.min(100, (t / mainAudio.duration) * 100);
        audioProgressBar.style.width = `${pct}%`;
      }

      // Duyệt qua từng từ để Highlight từ đang đọc và Unhighlight từ cũ
      words.forEach((w, idx) => {
        const el = document.getElementById(`word-${storyNum}-${idx}`);
        if (!el) return;

        if (t >= w.start && t < w.end) {
          // Từ đang được đọc -> BẬT sáng nổi bật
          el.classList.add('karaoke-current');
          el.classList.remove('karaoke-past');
        } else if (t >= w.end) {
          // Đã đọc xong từ này -> TẮT sáng (Unhighlight ngay lập tức) & chuyển sang màu đã đọc
          el.classList.remove('karaoke-current');
          el.classList.add('karaoke-past');
        } else {
          // Từ tương lai chưa đọc tới -> Xóa highlight
          el.classList.remove('karaoke-current', 'karaoke-past');
        }
      });

      animFrameId = requestAnimationFrame(syncKaraoke);
    }

    mainAudio.onplay = () => {
      animFrameId = requestAnimationFrame(syncKaraoke);
    };

    // Khi đọc xong trang này
    mainAudio.onended = () => {
      cancelAnimationFrame(animFrameId);
      speakingIndicator.classList.remove('active');
      audioProgressBar.style.width = '100%';

      // Đánh dấu tất cả từ đã đọc xong
      document.querySelectorAll(`#story-paragraph .word`).forEach(el => {
        el.classList.remove('karaoke-current');
        el.classList.add('karaoke-past');
      });

      // Tự động lật sang trang sau nếu bật autoTurnPages
      if (autoTurnPages && isAutoPlaying) {
        autoTurnTimeout = setTimeout(() => {
          if (currentPageIndex < 9) {
            flipToPage(currentPageIndex + 1, 'forward');
          } else {
            flipToPage(10, 'forward');
          }
        }, 1200); // Khoảng nghỉ tự nhiên 1.2s để bé ngắm tranh
      } else {
        setPlayingState(false);
      }
    };

    mainAudio.play().catch(err => {
      console.warn("Audio autoplay blocked by browser policy:", err);
    });
  }

  function stopCurrentAudio() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    if (autoTurnTimeout) {
      clearTimeout(autoTurnTimeout);
      autoTurnTimeout = null;
    }
    mainAudio.pause();
    speakingIndicator.classList.remove('active');
    audioProgressBar.style.width = '0%';
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

  function updateDockInfo(pageIdx) {
    if (pageIdx === 0) {
      dockPageInfo.textContent = 'Bìa sách';
    } else if (pageIdx >= 1 && pageIdx <= 9) {
      dockPageInfo.textContent = `Trang ${pageIdx} / 9`;
    } else {
      dockPageInfo.textContent = 'Bìa sau';
    }
  }

  // 4. HỆ THỐNG LẬT SÁCH 3D CHUYÊN NGHIỆP (3D PAGE FLIP ENGINE)
  function flipToPage(targetPage, direction) {
    if (isFlipping) return;
    if (targetPage < 0 || targetPage > 10) return;
    if (targetPage === currentPageIndex) return;

    // Tự động xác định hướng nếu chưa truyền
    if (!direction) {
      direction = targetPage > currentPageIndex ? 'forward' : 'backward';
    }

    isFlipping = true;
    stopCurrentAudio();
    narrator.playFlipSound(); // Phát âm thanh tiếng lật giấy chân thực

    // TRƯỜNG HỢP 1: MỞ BÌA TRƯỚC (Từ Page 0 ➔ Trang 1)
    if (currentPageIndex === 0 && targetPage === 1) {
      updateRightPageContent(1);
      playVideoForPage(1);

      // Kích hoạt animation mở bìa 3D
      coverFront.classList.add('flipping-open');

      setTimeout(() => {
        book.classList.remove('state-closed');
        book.classList.add('state-open');
        bookSpread.style.display = 'flex';
      }, 350);

      setTimeout(() => {
        coverFront.style.display = 'none';
        coverFront.classList.remove('flipping-open');
        currentPageIndex = 1;
        updateDockInfo(1);
        isFlipping = false;

        if (isAutoPlaying) {
          startPlayingStoryAudio(1);
        }
      }, 850);
      return;
    }

    // TRƯỜNG HỢP 2: ĐÓNG BÌA VỀ LẠI TRANG BÌA (Từ Trang 1 ➔ Page 0)
    if (currentPageIndex === 1 && targetPage === 0) {
      coverFront.style.display = 'block';
      coverFront.classList.add('flipping-close');

      setTimeout(() => {
        bookSpread.style.display = 'none';
        book.classList.remove('state-open');
        book.classList.add('state-closed');
      }, 400);

      setTimeout(() => {
        coverFront.classList.remove('flipping-close');
        currentPageIndex = 0;
        updateDockInfo(0);
        isFlipping = false;
        setPlayingState(false);
      }, 850);
      return;
    }

    // TRƯỜNG HỢP VỀ BÌA TRƯỚC TỪ BẤT KỲ TRANG NÀO KHÁC (Page N ➔ Page 0)
    if (targetPage === 0) {
      coverBack.style.display = 'none';
      bookSpread.style.display = 'none';
      book.classList.remove('state-open', 'state-end');
      book.classList.add('state-closed');
      coverFront.style.display = 'block';
      coverFront.classList.remove('flipping-close', 'flipping-open');
      flippingLeaf.className = 'flipping-leaf';
      currentPageIndex = 0;
      updateDockInfo(0);
      isFlipping = false;
      setPlayingState(false);
      return;
    }

    // TRƯỜNG HỢP ĐẶC BIỆT KHI ĐANG Ở BÌA SAU (Page 10)
    if (currentPageIndex === 10) {
      // 10A. ĐỌC LẠI TỪ ĐẦU (Page 10 ➔ Trang 1)
      if (targetPage === 1) {
        coverBack.style.display = 'none';
        coverFront.style.display = 'none';
        book.classList.remove('state-closed', 'state-end');
        book.classList.add('state-open');
        bookSpread.style.display = 'flex';
        flippingLeaf.className = 'flipping-leaf';

        updateRightPageContent(1);
        playVideoForPage(1);
        currentPageIndex = 1;
        updateDockInfo(1);
        isFlipping = false;

        setPlayingState(true);
        startPlayingStoryAudio(1);
        return;
      }

      // 10B. LẬT LÙI VỀ TRANG 9 (Page 10 ➔ Trang 9) VỚI HIỆU ỨNG LÁ LẬT 3D
      if (targetPage === 9) {
        coverBack.style.display = 'none';
        book.classList.remove('state-end');
        book.classList.add('state-open');
        bookSpread.style.display = 'flex';

        leafBack.innerHTML = `
          <div class="page-inner" style="padding: 44px 50px 32px 50px;">
            <div class="story-header">${BOOK_DATA.pages[8].header}</div>
            <div class="story-text-container">
              <p class="story-paragraph">${BOOK_DATA.pages[8].text}</p>
            </div>
            <div class="page-footer">
              <div class="page-num-indicator">Trang 9 / 9</div>
            </div>
          </div>
        `;
        leafFront.innerHTML = `<div style="width:100%;height:100%;background:#1e293b;border-radius:0 16px 16px 0;"></div>`;

        flippingLeaf.className = 'flipping-leaf flip-backward';
        playVideoForPage(9);

        setTimeout(() => {
          updateRightPageContent(9);
        }, 400);

        setTimeout(() => {
          flippingLeaf.className = 'flipping-leaf';
          currentPageIndex = 9;
          updateDockInfo(9);
          isFlipping = false;

          if (isAutoPlaying) {
            startPlayingStoryAudio(9);
          }
        }, 850);
        return;
      }

      // 10C. NHẢY TỚI CÁC TRANG TRUYỆN KHÁC (Page 10 ➔ Trang 2..8 qua Drawer)
      if (targetPage >= 2 && targetPage <= 8) {
        coverBack.style.display = 'none';
        coverFront.style.display = 'none';
        book.classList.remove('state-closed', 'state-end');
        book.classList.add('state-open');
        bookSpread.style.display = 'flex';
        flippingLeaf.className = 'flipping-leaf';

        updateRightPageContent(targetPage);
        playVideoForPage(targetPage);
        currentPageIndex = targetPage;
        updateDockInfo(targetPage);
        isFlipping = false;

        if (isAutoPlaying) {
          startPlayingStoryAudio(targetPage);
        }
        return;
      }
    }

    // TRƯỜNG HỢP LẬT SANG MÀN HÌNH KẾT THÚC / BÌA SAU (Trang N ➔ Page 10)
    if (targetPage === 10) {
      const fromPage = (currentPageIndex >= 1 && currentPageIndex <= 9) ? currentPageIndex : 9;
      leafFront.innerHTML = `
        <div class="page-inner" style="padding: 44px 50px 32px 50px;">
          <div class="story-header">${BOOK_DATA.pages[fromPage - 1].header}</div>
          <div class="story-text-container">
            <p class="story-paragraph">${BOOK_DATA.pages[fromPage - 1].text}</p>
          </div>
          <div class="page-footer">
            <div class="page-num-indicator">Trang ${fromPage} / 9</div>
          </div>
        </div>
      `;
      leafBack.innerHTML = `<div style="width:100%;height:100%;background:#1e293b;"></div>`;

      flippingLeaf.className = 'flipping-leaf flip-forward';

      setTimeout(() => {
        bookSpread.style.display = 'none';
        book.classList.remove('state-open');
        book.classList.add('state-end');
        coverBack.style.display = 'flex';
      }, 400);

      setTimeout(() => {
        flippingLeaf.className = 'flipping-leaf';
        currentPageIndex = 10;
        updateDockInfo(10);
        isFlipping = false;
        narrator.playFanfareSound();
        setPlayingState(false);
      }, 850);
      return;
    }

    // TRƯỜNG HỢP 3: LẬT TIẾN GIỮA CÁC TRANG TRUYỆN (Trang N ➔ Trang N+1)
    if (direction === 'forward' && currentPageIndex >= 1 && currentPageIndex <= 8 && targetPage >= 2 && targetPage <= 9) {
      const fromPage = currentPageIndex;
      const toPage = targetPage;

      // Chuẩn bị nội dung cho Lá Lật 3D
      // Mặt trước lá lật = Snapshot nội dung chữ trang phải hiện tại
      leafFront.innerHTML = `
        <div class="page-inner" style="padding: 44px 50px 32px 50px;">
          <div class="story-header">${BOOK_DATA.pages[fromPage - 1].header}</div>
          <div class="story-text-container">
            <p class="story-paragraph">${BOOK_DATA.pages[fromPage - 1].text}</p>
          </div>
          <div class="page-footer">
            <div class="page-num-indicator">Trang ${fromPage} / 9</div>
          </div>
        </div>
      `;

      // Mặt sau lá lật = Minh họa tranh trái của trang mới
      leafBack.innerHTML = `
        <div class="page-inner">
          <div class="video-frame">
            <img src="assets/pages/story_${toPage}_left.jpg" style="width:100%;height:100%;object-fit:cover;">
          </div>
        </div>
      `;

      // Kích hoạt lá lật 3D xoay từ phải sang trái
      flippingLeaf.className = 'flipping-leaf flip-forward';

      // Tại thời điểm lá lật dựng đứng 90 độ (400ms): Cập nhật chữ trang phải bên dưới
      setTimeout(() => {
        updateRightPageContent(toPage);
      }, 400);

      // Khi lật xong hoàn toàn (850ms): Cập nhật video bên trái và bắt đầu phát
      setTimeout(() => {
        playVideoForPage(toPage);
        flippingLeaf.className = 'flipping-leaf';
        currentPageIndex = toPage;
        updateDockInfo(toPage);
        isFlipping = false;

        if (isAutoPlaying) {
          startPlayingStoryAudio(toPage);
        }
      }, 850);
      return;
    }

    // TRƯỜNG HỢP 4: LẬT LÙI GIỮA CÁC TRANG TRUYỆN (Trang N ➔ Trang N-1)
    if (direction === 'backward' && currentPageIndex >= 2 && currentPageIndex <= 9 && targetPage >= 1 && targetPage < currentPageIndex) {
      const fromPage = currentPageIndex;
      const toPage = targetPage;

      // Chuẩn bị nội dung cho Lá Lật 3D lật ngược
      leafBack.innerHTML = `
        <div class="page-inner" style="padding: 44px 50px 32px 50px;">
          <div class="story-header">${BOOK_DATA.pages[toPage - 1].header}</div>
          <div class="story-text-container">
            <p class="story-paragraph">${BOOK_DATA.pages[toPage - 1].text}</p>
          </div>
          <div class="page-footer">
            <div class="page-num-indicator">Trang ${toPage} / 9</div>
          </div>
        </div>
      `;

      leafFront.innerHTML = `
        <div class="page-inner">
          <div class="video-frame">
            <img src="assets/pages/story_${fromPage}_left.jpg" style="width:100%;height:100%;object-fit:cover;">
          </div>
        </div>
      `;

      // Kích hoạt lá lật 3D xoay từ trái sang phải
      flippingLeaf.className = 'flipping-leaf flip-backward';

      setTimeout(() => {
        playVideoForPage(toPage);
      }, 400);

      setTimeout(() => {
        updateRightPageContent(toPage);
        flippingLeaf.className = 'flipping-leaf';
        currentPageIndex = toPage;
        updateDockInfo(toPage);
        isFlipping = false;

        if (isAutoPlaying) {
          startPlayingStoryAudio(toPage);
        }
      }, 850);
      return;
    }

    // TRƯỜNG HỢP CHUYỂN TRANG KHÁC (Drawer Thumbnail hoặc Direct Jump)
    if (targetPage >= 1 && targetPage <= 9) {
      coverFront.style.display = 'none';
      coverBack.style.display = 'none';
      book.classList.remove('state-closed', 'state-end');
      book.classList.add('state-open');
      bookSpread.style.display = 'flex';
      flippingLeaf.className = 'flipping-leaf';
      updateRightPageContent(targetPage);
      playVideoForPage(targetPage);
      currentPageIndex = targetPage;
      updateDockInfo(targetPage);
      isFlipping = false;
      if (isAutoPlaying) {
        startPlayingStoryAudio(targetPage);
      }
    }
  }

  // 5. THUMBNAIL DRAWER (MỤC LỤC TRANG)
  function renderThumbnails() {
    let html = `
      <div class="thumb-card ${currentPageIndex === 0 ? 'active' : ''}" data-page="0">
        <img src="assets/pages/cover_front.jpg" alt="Bìa trước">
        <span>Bìa trước</span>
      </div>
    `;

    BOOK_DATA.pages.forEach(p => {
      html += `
        <div class="thumb-card ${currentPageIndex === p.pageNumber ? 'active' : ''}" data-page="${p.pageNumber}">
          <img src="assets/pages/story_${p.pageNumber}_left.jpg" alt="Trang ${p.pageNumber}">
          <span>Trang ${p.pageNumber}</span>
        </div>
      `;
    });

    html += `
      <div class="thumb-card ${currentPageIndex === 10 ? 'active' : ''}" data-page="10">
        <img src="assets/pages/cover_back.jpg" alt="Bìa sau">
        <span>Bìa sau</span>
      </div>
    `;

    thumbnailsGrid.innerHTML = html;

    document.querySelectorAll('.thumb-card').forEach(card => {
      card.addEventListener('click', () => {
        const p = parseInt(card.getAttribute('data-page'));
        closeDrawer();
        flipToPage(p);
      });
    });
  }

  function openDrawer() {
    renderThumbnails();
    drawerOverlay.classList.add('open');
  }

  function closeDrawer() {
    drawerOverlay.classList.remove('open');
  }

  // 6. GẮN SỰ KIỆN TƯƠNG TÁC
  // Click vào Bìa trước ➔ Mở sách vào thẳng Trang 1
  coverFront.addEventListener('click', () => {
    if (currentPageIndex === 0) {
      setPlayingState(true);
      flipToPage(1, 'forward');
    }
  });

  // Hiệu ứng hover mép gấp góc trang
  cornerPrev.addEventListener('mouseenter', () => spreadLeft.classList.add('corner-hovered'));
  cornerPrev.addEventListener('mouseleave', () => spreadLeft.classList.remove('corner-hovered'));
  cornerNext.addEventListener('mouseenter', () => spreadRight.classList.add('corner-hovered'));
  cornerNext.addEventListener('mouseleave', () => spreadRight.classList.remove('corner-hovered'));

  // Click vào góc quăn hoặc mép trang
  cornerNext.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentPageIndex < 9) {
      flipToPage(currentPageIndex + 1, 'forward');
    } else if (currentPageIndex === 9) {
      flipToPage(10, 'forward');
    }
  });

  cornerPrev.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentPageIndex > 1) {
      flipToPage(currentPageIndex - 1, 'backward');
    } else if (currentPageIndex === 1) {
      flipToPage(0, 'backward');
    }
  });

  // Click vào trang phải cũng có thể lật trang kế tiếp
  spreadRight.addEventListener('click', (e) => {
    if (e.target.closest('.word') || e.target.closest('.btn-replay-all')) return;
    if (currentPageIndex < 9) {
      flipToPage(currentPageIndex + 1, 'forward');
    } else if (currentPageIndex === 9) {
      flipToPage(10, 'forward');
    }
  });

  // Nút Play / Pause
  btnPlayPause.addEventListener('click', () => {
    if (currentPageIndex === 0) {
      setPlayingState(true);
      flipToPage(1, 'forward');
      return;
    }

    if (currentPageIndex === 10) {
      setPlayingState(true);
      flipToPage(1, 'backward');
      return;
    }

    if (isAutoPlaying) {
      stopCurrentAudio();
      storyVideo.pause();
      setPlayingState(false);
    } else {
      setPlayingState(true);
      storyVideo.play().catch(() => {});
      startPlayingStoryAudio(currentPageIndex);
    }
  });

  // Nút Lật sang trang sau
  btnNext.addEventListener('click', () => {
    if (currentPageIndex === 0) {
      flipToPage(1, 'forward');
    } else if (currentPageIndex < 9) {
      flipToPage(currentPageIndex + 1, 'forward');
    } else if (currentPageIndex === 9) {
      flipToPage(10, 'forward');
    }
  });

  // Nút Lật về trang trước
  btnPrev.addEventListener('click', () => {
    if (currentPageIndex === 10) {
      flipToPage(9, 'backward');
    } else if (currentPageIndex > 1) {
      flipToPage(currentPageIndex - 1, 'backward');
    } else if (currentPageIndex === 1) {
      flipToPage(0, 'backward');
    }
  });

  // Nút Đọc lại trang này
  btnReplayPage.addEventListener('click', () => {
    if (currentPageIndex >= 1 && currentPageIndex <= 9) {
      storyVideo.currentTime = 0;
      storyVideo.play().catch(() => {});
      startPlayingStoryAudio(currentPageIndex);
    }
  });

  // Nút Đọc lại từ đầu ở bìa sau
  btnReplayAll.addEventListener('click', () => {
    flipToPage(1, 'backward');
  });

  // Nút Quay về trang trước ở bìa sau
  if (btnBackPage9) {
    btnBackPage9.addEventListener('click', () => {
      flipToPage(9, 'backward');
    });
  }

  // Bật/tắt tự động lật trang
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

  // Bật/tắt âm thanh
  btnMute.addEventListener('click', () => {
    isMuted = !isMuted;
    mainAudio.muted = isMuted;
    narrator.isMuted = isMuted;

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

  // Drawer
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
    if (e.code === 'ArrowRight') {
      btnNext.click();
    } else if (e.code === 'ArrowLeft') {
      btnPrev.click();
    } else if (e.code === 'Space') {
      e.preventDefault();
      btnPlayPause.click();
    } else if (e.code === 'Escape') {
      closeDrawer();
    }
  });

  // Khởi động
  updateDockInfo(0);
});
