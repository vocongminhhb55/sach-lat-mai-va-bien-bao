/**
 * Bộ điều khiển Sách Lật Tương Tác (Interactive Flipbook Application)
 * Mai và Chuyến Phiêu Lưu Của Những Biển Báo
 */
document.addEventListener('DOMContentLoaded', () => {
  const narrator = new SpeechNarrator();
  const bookContainer = document.getElementById('flipbook');
  
  // Các phần tử UI
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
  let currentPageIndex = 0; // Trang hiện tại của PageFlip (0 = Cover, 1-2 = Story 1, ...)
  let autoTurnPages = true;
  let isAutoPlaying = false;
  let pageTokens = {}; // Lưu trữ tokens chữ cho từng trang
  let activeHotspotTimeout = null;

  // 1. Tách văn bản thành các từ và lưu vị trí ký tự
  function tokenizeStoryText(text, pageNum) {
    const tokens = [];
    const regex = /\S+/g;
    let match;
    let idx = 0;
    while ((match = regex.exec(text)) !== null) {
      tokens.push({
        index: idx++,
        text: match[0],
        start: match.index,
        end: match.index + match[0].length
      });
    }
    pageTokens[pageNum] = tokens;
    return tokens;
  }

  // 2. Render toàn bộ cấu trúc các trang sách vào DOM
  function renderBook() {
    let html = '';

    // TRANG BÌA TRƯỚC (Trang 0)
    html += `
      <div class="page page-cover page-cover-top" data-density="hard">
        <img src="assets/pages/cover_front.jpg" alt="Bìa sách">
        <div class="cover-click-prompt" id="btn-open-book">
          <span>📖 Bấm vào đây để mở sách</span>
        </div>
      </div>
    `;

    // 9 TRANG TRUYỆN MỞ ĐÔI (Mỗi trang gồm Trang Trái Minh Họa + Trang Phải Lời Kể)
    BOOK_DATA.pages.forEach((story) => {
      const tokens = tokenizeStoryText(story.text, story.pageNumber);
      
      // Tạo HTML cho các từ
      let wordsHtml = tokens.map(t => {
        return `<span class="word" id="word-${story.pageNumber}-${t.index}" data-page="${story.pageNumber}" data-start="${t.start}" data-end="${t.end}">${t.text} </span>`;
      }).join('');

      // Tạo HTML cho các Hotspots trên tranh
      let hotspotsHtml = story.hotspots.map(h => {
        return `
          <div class="hotspot ${h.type}" 
               id="hotspot-${story.pageNumber}-${h.id}" 
               style="top:${h.top}; left:${h.left}; width:${h.width}; height:${h.height};" 
               data-page="${story.pageNumber}"
               data-label="${h.label}" 
               data-sound="${h.soundType}"
               title="${h.label} (Bấm để nghe)">
            <span class="hotspot-badge">${h.label}</span>
          </div>
        `;
      }).join('');

      // Trang trái: Minh họa tương tác
      html += `
        <div class="page page-left">
          <div class="illustration-wrap">
            <img class="bg-art" src="${story.leftImage}" alt="Tranh minh họa trang ${story.pageNumber}">
            <div class="hotspot-layer" id="hotspot-layer-${story.pageNumber}">
              ${hotspotsHtml}
            </div>
          </div>
        </div>
      `;

      // Trang phải: Lời kể chữ đẹp mắt chạy Karaoke
      html += `
        <div class="page page-right">
          <div class="page-header">${story.header}</div>
          <div class="story-body">
            <p class="story-paragraph" id="story-p-${story.pageNumber}">
              ${wordsHtml}
            </p>
          </div>
          <div class="page-footer">
            <span class="hint-pill">💡 Chạm vào biển báo trong tranh để khám phá</span>
            <span class="page-num">${story.pageNumber}</span>
          </div>
        </div>
      `;
    });

    // TRANG BÌA SAU (Trang 19)
    html += `
      <div class="page page-cover page-cover-bottom page-back-cover" data-density="hard">
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

  // 3. Khởi tạo thư viện PageFlip 3D
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

    // Bắt sự kiện khi lật trang
    pageFlip.on('flip', (e) => {
      currentPageIndex = e.data;
      narrator.playFlipSound();
      onPageChanged(currentPageIndex);
    });

    // Lắng nghe click mở sách ở trang bìa
    document.getElementById('btn-open-book')?.addEventListener('click', () => {
      pageFlip.flipNext();
    });

    // Nút đọc lại từ đầu ở bìa sau
    document.getElementById('btn-replay-all')?.addEventListener('click', () => {
      pageFlip.turnToPage(0);
    });

    // Gắn sự kiện click tương tác cho các hotspot
    attachHotspotInteractions();

    // Render danh sách thumbnail vào Modal
    renderThumbnails();
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

        // Đọc tên biển báo khi bé chạm vào
        if (label) {
          narrator.stop();
          narrator.speak(label);
        }
      });
    });
  }

  // Kích hoạt hoạt ảnh cho Hotspot
  function triggerHotspotAnim(hotspotEl, duration = 2000) {
    if (!hotspotEl) return;
    hotspotEl.classList.add('active');
    if (activeHotspotTimeout) clearTimeout(activeHotspotTimeout);
    activeHotspotTimeout = setTimeout(() => {
      hotspotEl.classList.remove('active');
    }, duration);
  }

  // 5. Xử lý khi trang sách thay đổi
  function onPageChanged(pageIdx) {
    updatePageInfo(pageIdx);
    resetAllHighlights();

    // Dừng giọng đọc cũ nếu đang đọc
    narrator.stop();
    speakingIndicator.classList.remove('active');

    // Nếu đang ở chế độ tự động đọc (isAutoPlaying) và là trang truyện (1-18)
    if (isAutoPlaying && pageIdx >= 1 && pageIdx <= 18) {
      setTimeout(() => {
        readCurrentStoryPage();
      }, 500);
    } else if (pageIdx === 19) {
      // Đã tới bìa sau -> ăn mừng
      narrator.playFanfareSound();
      setPlayingState(false);
    }
  }

  // Cập nhật thông tin số trang trên thanh Dock
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

  // Lấy dữ liệu truyện của trang hiện tại
  function getCurrentStory() {
    if (currentPageIndex >= 1 && currentPageIndex <= 18) {
      const storyNum = Math.ceil(currentPageIndex / 2);
      return BOOK_DATA.pages.find(p => p.pageNumber === storyNum);
    }
    return null;
  }

  // 6. ĐỌC LỜI KỂ CỦA TRANG HIỆN TẠI & ĐỒNG BỘ KARAOKE + HOẠT ẢNH
  function readCurrentStoryPage() {
    const story = getCurrentStory();
    if (!story) return;

    resetAllHighlights();
    speakingIndicator.classList.add('active');
    setPlayingState(true);

    const tokens = pageTokens[story.pageNumber] || [];

    // Bắt đầu đọc qua Web Speech API
    narrator.speak(
      story.text,
      tokens,
      // Callback mỗi khi phát âm đến một từ (Word Boundary)
      (charIndex) => {
        handleWordBoundary(story, tokens, charIndex);
      },
      // Callback khi đọc hết câu chuyện trên trang này
      () => {
        speakingIndicator.classList.remove('active');
        markAllWordsRead(story.pageNumber, tokens);

        // Tự động lật sang trang tiếp theo nếu bật autoTurnPages
        if (autoTurnPages && isAutoPlaying) {
          setTimeout(() => {
            if (pageFlip.getCurrentPageIndex() < 19) {
              pageFlip.flipNext();
            }
          }, 1400); // Khoảng dừng tự nhiên 1.4s để bé ngắm tranh
        } else {
          setPlayingState(false);
        }
      }
    );
  }

  // Xử lý đồng bộ từng từ và kích hoạt chuyển động ảnh
  function handleWordBoundary(story, tokens, charIndex) {
    // 1. Tìm từ đang được đọc
    let activeToken = tokens.find(t => charIndex >= t.start && charIndex <= t.end);
    if (!activeToken) {
      // Tìm từ gần nhất
      activeToken = tokens.find(t => t.start >= charIndex);
    }
    if (!activeToken) return;

    // 2. Cập nhật Karaoke Highlight trên trang chữ
    tokens.forEach(t => {
      const el = document.getElementById(`word-${story.pageNumber}-${t.index}`);
      if (!el) return;
      if (t.index === activeToken.index) {
        el.classList.add('karaoke-current');
        el.classList.remove('karaoke-past');
      } else if (t.index < activeToken.index) {
        el.classList.remove('karaoke-current');
        el.classList.add('karaoke-past');
      } else {
        el.classList.remove('karaoke-current', 'karaoke-past');
      }
    });

    // 3. KIỂM TRA TỪ KHÓA ĐỂ KÍCH HOẠT HOẠT ẢNH TRÊN TRANH MINH HỌA
    const snippetStart = Math.max(0, charIndex - 15);
    const snippetEnd = Math.min(story.text.length, charIndex + 30);
    const contextSnippet = story.text.substring(snippetStart, snippetEnd).toLowerCase();

    story.hotspots.forEach(h => {
      const isMatched = h.keywords.some(kw => contextSnippet.includes(kw.toLowerCase()));
      if (isMatched) {
        const hotspotEl = document.getElementById(`hotspot-${story.pageNumber}-${h.id}`);
        triggerHotspotAnim(hotspotEl, 2200);

        // Bôi sáng từ khóa đặc biệt trên text
        const wordEl = document.getElementById(`word-${story.pageNumber}-${activeToken.index}`);
        if (wordEl) wordEl.classList.add('keyword-matched');
      }
    });
  }

  // Đánh dấu tất cả từ đã đọc xong
  function markAllWordsRead(pageNum, tokens) {
    tokens.forEach(t => {
      const el = document.getElementById(`word-${pageNum}-${t.index}`);
      if (el) {
        el.classList.remove('karaoke-current');
        el.classList.add('karaoke-past');
      }
    });
  }

  // Đặt lại toàn bộ highlight chữ
  function resetAllHighlights() {
    document.querySelectorAll('.word').forEach(w => {
      w.classList.remove('karaoke-current', 'karaoke-past', 'keyword-matched');
    });
    document.querySelectorAll('.hotspot').forEach(h => {
      h.classList.remove('active');
    });
  }

  // Cập nhật trạng thái nút Play / Pause
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

  // 7. Render danh sách Thumbnail vào Drawer
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

    // Gắn sự kiện chọn trang từ Thumbnail
    document.querySelectorAll('.thumb-card').forEach(card => {
      card.addEventListener('click', () => {
        const targetPage = parseInt(card.getAttribute('data-page'));
        pageFlip.turnToPage(targetPage);
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

  // 8. GẮN SỰ KIỆN THANH ĐIỀU KHIỂN (CONTROL DOCK)
  btnPlayPause.addEventListener('click', () => {
    if (currentPageIndex === 0) {
      pageFlip.flipNext();
      setPlayingState(true);
      return;
    }

    if (isAutoPlaying) {
      narrator.stop();
      speakingIndicator.classList.remove('active');
      setPlayingState(false);
    } else {
      setPlayingState(true);
      readCurrentStoryPage();
    }
  });

  btnPrev.addEventListener('click', () => {
    pageFlip.flipPrev();
  });

  btnNext.addEventListener('click', () => {
    pageFlip.flipNext();
  });

  btnReplayPage.addEventListener('click', () => {
    if (currentPageIndex >= 1 && currentPageIndex <= 18) {
      narrator.stop();
      readCurrentStoryPage();
    }
  });

  // Bật/Tắt tự động qua trang
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

  // Bật/Tắt âm thanh
  btnMute.addEventListener('click', () => {
    const isMuted = narrator.toggleMute();
    if (isMuted) {
      iconUnmuted.style.display = 'none';
      iconMuted.style.display = 'block';
      btnMute.title = 'Bật âm thanh';
      setPlayingState(false);
    } else {
      iconUnmuted.style.display = 'block';
      iconMuted.style.display = 'none';
      btnMute.title = 'Tắt âm thanh';
    }
  });

  // Xem mục lục
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
      pageFlip.flipPrev();
    } else if (e.code === 'ArrowRight') {
      pageFlip.flipNext();
    } else if (e.code === 'Space') {
      e.preventDefault();
      btnPlayPause.click();
    } else if (e.code === 'Escape') {
      closeDrawer();
    }
  });

  // Khởi động
  initPageFlip();
});
