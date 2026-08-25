document.addEventListener("DOMContentLoaded", () => {

  // -------------------- SLIDER CONTROL --------------------
  // ONLY RUN IF ON HOMEPAGE (elements exist)
  const slider = document.querySelector(".slider-container");
  const slides = document.querySelectorAll(".slide");
  const leftArrow = document.querySelector(".arrow_left");
  const rightArrow = document.querySelector(".arrow_right");
  
  // Check if slider elements exist (homepage only)
  if (slider && slides.length > 0 && leftArrow && rightArrow) {
    const totalSlides = slides.length;
    let currentSlide = 0;

    const updateSlide = (index, pushHistory = true) => {
      currentSlide = Math.max(0, Math.min(index, totalSlides - 1));
      slider.style.transform = `translateX(-${currentSlide * 100}vw)`;

      // Push state into history for back/forward buttons
      if (pushHistory) {
        history.pushState({ slide: currentSlide }, `Slide ${currentSlide + 1}`, `#slide${currentSlide + 1}`);
      }
    };

    // Arrow button events
    rightArrow.addEventListener("click", () => updateSlide(currentSlide + 1));
    leftArrow.addEventListener("click", () => updateSlide(currentSlide - 1));

    // Keyboard arrow events
    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") updateSlide(currentSlide + 1);
      if (e.key === "ArrowLeft") updateSlide(currentSlide - 1);
    });

    // Handle window resize
    window.addEventListener("resize", () => {
      slider.style.transition = "none";
      slider.style.transform = `translateX(-${currentSlide * 100}vw)`;
      void slider.offsetWidth; // force reflow
      slider.style.transition = "";
    });

    // Handle browser back/forward buttons
    window.addEventListener("popstate", (e) => {
      if (e.state && typeof e.state.slide !== "undefined") {
        updateSlide(e.state.slide, false); // false = don't push state again
      }
    });

    // On page load, read hash to restore slide
    const hash = window.location.hash;
    if (hash.startsWith("#slide")) {
      const slideIndex = parseInt(hash.replace("#slide", "")) - 1;
      if (!isNaN(slideIndex)) {
        updateSlide(slideIndex, false); // false = don't push history again
      }
    }
  }
  
  // Rest of the code continues...
  // -------------------- GENRES DROPDOWN (Click-based) --------------------
  const genreDropdownArrow = document.getElementById('genreDropdownArrow');
  const genreDropdown = document.getElementById('genreDropdown');

  if (genreDropdownArrow && genreDropdown) {
    // Toggle dropdown when arrow is clicked
    genreDropdownArrow.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent event from bubbling up
      genreDropdown.classList.toggle('show');
      genreDropdownArrow.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!genreDropdown.contains(e.target) && !genreDropdownArrow.contains(e.target)) {
        genreDropdown.classList.remove('show');
        genreDropdownArrow.classList.remove('active');
      }
    });

    // Close dropdown when clicking on a dropdown item
    genreDropdown.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        genreDropdown.classList.remove('show');
        genreDropdownArrow.classList.remove('active');
      }
    });
  }

  // Also add this to close dropdown when pressing Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && genreDropdown && genreDropdown.classList.contains('show')) {
      genreDropdown.classList.remove('show');
      if (genreDropdownArrow) genreDropdownArrow.classList.remove('active');
    }
  });

  // -------------------- SEARCH DROPDOWN --------------------
  const searchInput = document.getElementById("searchInput");
  const searchDropdown = document.getElementById("searchDropdown");

  const movies = [
    { title: "Avatar: The Way of Water", link: "avatar_way_of_water_movie.html" },
    { title: "Jurassic World: Dominion", link: "jurassic_park_dominion_movie.html" },
    { title: "Ben 10", link: "ben_10_movie.html" },
    { title: "The Meg", link: "the_meg_movie.html" },
    { title: "The Little Mermaid", link: "the_littlemermaid_movie.html" },
    { title: "Finding Dory", link: "finding_dory_movie.html" },
    { title: "Percy Jackson", link: "percy_jackson_movie.html" },
    { title: "Sonic", link: "sonic_movie.html" },
    { title: "Lilo & Stitch", link: "lilo_stitch_movie.html" },
    { title: "Tron", link: "tron_movie.html" },
    { title: "The Beekeeper", link: "the_beekeeper_movie.html" },
    { title: "Bumblebee", link: "bumblebee_movie.html" },
    { title: "Jumanji", link: "jumanji_movie.html" },
    { title: "Knives Out", link: "knives_out_movie.html" },
    { title: "Minions: Rise of Gru", link: "minions_rise_of_gru_movie.html" },
    { title: "Uncharted", link: "uncharted_movie.html" },
    { title: "Wolverine", link: "wolverine_movie.html" },
    { title: "Green Lantern", link: "green_lantern_movie.html" },
    { title: "Jungle Book", link: "jungle_book_movie.html" },
    { title: "The Matrix", link: "the_matrix_movie.html" },
    { title: "The Wizard Of Oz", link: "the_wizard_of_oz_movie.html" },
    { title: "Shrek 2", link: "shrek_2_movie.html" },
    { title: "Raya And The Last Dragon", link: "raya_and_the_last_dragon_movie.html" },
    { title: "Wicked", link: "wicked_movie.html" }
  ];

  const clearDropdown = () => {
    searchDropdown.innerHTML = "";
    searchDropdown.style.display = "none";
  };

  const showDropdown = (items) => {
    searchDropdown.innerHTML = "";
    items.forEach(movie => {
      const div = document.createElement("div");
      div.className = "dropdown-item";
      div.textContent = movie.title;
      div.addEventListener("click", () => {
        window.location.href = movie.link;
      });
      searchDropdown.appendChild(div);
    });
    searchDropdown.style.display = "block";
  };

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) return clearDropdown();

    const filtered = movies.filter(movie => movie.title.toLowerCase().includes(query));
    filtered.length ? showDropdown(filtered) : clearDropdown();
  });

  // Hide dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
      clearDropdown();
    }
  });

});

const noTapHighlight = document.createElement('style');
noTapHighlight.textContent = `* { -webkit-tap-highlight-color: transparent; tap-highlight-color: transparent; }`;
document.head.appendChild(noTapHighlight);

/* ============================================================
   CUSTOM FULLSCREEN FIX — append this to the END of js/script.js
   ============================================================

   WHY THIS EXISTS:
   The embedded player (vidsrc.me, etc.) loads its actual video
   player several iframe layers deep. The browser's Permissions
   Policy for the "fullscreen" feature does not automatically
   propagate through nested cross-origin iframes — every layer's
   own HTML has to explicitly re-grant it. We correctly grant
   fullscreen on OUR <iframe> tag, but if the embed provider's own
   nested iframe doesn't do the same, their player's fullscreen
   button gets rejected with "Disallowed by permissions policy" —
   and that's on their end, not something we can patch from here.

   THE FIX:
   Add our own fullscreen button that fullscreens the WRAPPING DIV
   (.frost-wrap on desktop, #mobVideoWrap on mobile) instead of
   anything inside the third-party iframe. Since that wrapper is
   part of our own document, no cross-frame permission is needed
   at all — this sidesteps the broken policy entirely. The video
   keeps playing inside the iframe exactly as before; it just
   visually scales to fill the fullscreened container.

   This runs on every movie page automatically once appended to
   script.js (already loaded everywhere) — no HTML or per-page CSS
   file edits needed.

   MOBILE FIX (added):
   On mobile, the fullscreened element (#mobVideoWrap) is not the
   iframe's direct parent — there's an extra wrapper in between
   (#mobFrostWrap, used for the blur-to-reveal effect). That inner
   wrapper never got an explicit size, so the iframe's
   height:100% !important had nothing valid to resolve against and
   fell back to its default 240px height — making the video look
   tiny even while fullscreen. The new rule below gives
   #mobFrostWrap an explicit position:absolute; inset:0 so it fills
   #mobVideoWrap exactly, which lets the iframe's 100%/100% resolve
   correctly against it.
============================================================ */

(function () {

    function requestFs(el) {
        console.log('[Leveny FS] requestFs called on', el);
        const fn = el.requestFullscreen || el.webkitRequestFullscreen ||
                   el.mozRequestFullScreen || el.msRequestFullscreen;
        if (!fn) {
            console.warn('[Leveny FS] No requestFullscreen method available on this element/browser.');
            return;
        }
        const result = fn.call(el);
        if (result && typeof result.then === 'function') {
            result.then(function () {
                // Android Chrome/Firefox: actually rotate the device.
                // Silently does nothing on iOS Safari (unsupported) or
                // desktop (irrelevant there anyway).
                if (screen.orientation && screen.orientation.lock) {
                    screen.orientation.lock('landscape').catch(function (err) {
                        console.warn('[Leveny FS] Orientation lock not available/denied:', err);
                    });
                }
            }).catch(function (err) {
                console.error('[Leveny FS] requestFullscreen was rejected:', err);
            });
        }
    }

    function exitFs() {
        const fn = document.exitFullscreen || document.webkitExitFullscreen ||
                   document.mozCancelFullScreen || document.msExitFullscreen;
        if (fn) fn.call(document);
        if (screen.orientation && screen.orientation.unlock) {
            try { screen.orientation.unlock(); } catch (e) { /* no-op */ }
        }
    }

    function isFs() {
        return !!(document.fullscreenElement || document.webkitFullscreenElement ||
                  document.mozFullScreenElement || document.msFullscreenElement);
    }

    function injectStyles() {
        if (document.getElementById('leveny-fs-styles')) return;
        const style = document.createElement('style');
        style.id = 'leveny-fs-styles';
        style.textContent = `
            .leveny-fs-btn {
                position: absolute;
                bottom: 10px;
                right: 10px;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                border: none;
                background: rgba(0,0,0,0.6);
                color: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 20;
                font-size: 14px;
                transition: transform 0.15s ease, background 0.2s ease;
            }
            .leveny-fs-btn:hover { background: rgba(0,0,0,0.8); }
            .leveny-fs-btn:active { transform: scale(0.9); }

            .frost-wrap:fullscreen,
            #mobVideoWrap:fullscreen {
                width: 100vw !important;
                height: 100vh !important;
                border-radius: 0 !important;
                background: #000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .frost-wrap:-webkit-full-screen,
            #mobVideoWrap:-webkit-full-screen {
                width: 100vw !important;
                height: 100vh !important;
                border-radius: 0 !important;
                background: #000;
            }

            .frost-wrap:fullscreen iframe,
            #mobVideoWrap:fullscreen iframe,
            .frost-wrap:-webkit-full-screen iframe,
            #mobVideoWrap:-webkit-full-screen iframe {
                width: 100% !important;
                height: 100% !important;
            }

            /* MOBILE FIX: give the intermediate #mobFrostWrap an explicit
               size while #mobVideoWrap is fullscreen, so the iframe's
               height:100% has something real to resolve against instead
               of falling back to the default 240px. */
            #mobVideoWrap:fullscreen #mobFrostWrap,
            #mobVideoWrap:-webkit-full-screen #mobFrostWrap {
                position: absolute;
                inset: 0;
                width: 100%;
                height: 100%;
            }

            /* ---- iOS fallback: no Screen Orientation Lock support there,
               so if we're still in portrait once fullscreen is active,
               visually rotate the whole container 90° and swap its
               width/height. This makes the video fill the screen in an
               apparent landscape shape even though the OS orientation
               itself never actually changes. On Android, the real
               orientation.lock() call above already switches the
               device to landscape, so this media query simply won't
               match there — no conflict between the two approaches. ---- */
            @media screen and (orientation: portrait) {
                .frost-wrap:fullscreen,
                #mobVideoWrap:fullscreen,
                .frost-wrap:-webkit-full-screen,
                #mobVideoWrap:-webkit-full-screen {
                    position: fixed !important;
                    top: 0 !important;
                    left: 100% !important;
                    width: 100vh !important;
                    height: 100vw !important;
                    transform: rotate(90deg);
                    transform-origin: top left;
                }

                .frost-wrap:fullscreen .leveny-fs-btn,
                #mobVideoWrap:fullscreen .leveny-fs-btn,
                .frost-wrap:-webkit-full-screen .leveny-fs-btn,
                #mobVideoWrap:-webkit-full-screen .leveny-fs-btn {
                    transform: rotate(-90deg);
                    bottom: 12px;
                    right: auto;
                    left: 10px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function addButton(container) {
        if (!container || container.querySelector('.leveny-fs-btn')) return;

        const btn = document.createElement('button');
        btn.className = 'leveny-fs-btn';
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Toggle fullscreen');
        btn.innerHTML = '<i class="fas fa-expand"></i>';

        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (isFs()) {
                exitFs();
            } else {
                requestFs(container);
            }
        });

        const computedPos = window.getComputedStyle(container).position;
        if (computedPos === 'static') container.style.position = 'relative';

        container.appendChild(btn);
    }

    function syncButtonIcons() {
        const fs = isFs();
        document.querySelectorAll('.leveny-fs-btn').forEach(function (btn) {
            btn.innerHTML = fs ? '<i class="fas fa-compress"></i>' : '<i class="fas fa-expand"></i>';
        });
    }

    function init() {
        console.log('[Leveny FS] fullscreen fix script initializing...');
        injectStyles();
        const containers = document.querySelectorAll('.frost-wrap, #mobVideoWrap');
        console.log('[Leveny FS] found', containers.length, 'video container(s):', containers);
        containers.forEach(addButton);

        document.addEventListener('fullscreenchange', syncButtonIcons);
        document.addEventListener('webkitfullscreenchange', syncButtonIcons);
        document.addEventListener('mozfullscreenchange', syncButtonIcons);
        document.addEventListener('MSFullscreenChange', syncButtonIcons);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
