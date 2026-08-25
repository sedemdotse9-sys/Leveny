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
============================================================ */

(function () {

    function requestFs(el) {
        const fn = el.requestFullscreen || el.webkitRequestFullscreen ||
                   el.mozRequestFullScreen || el.msRequestFullscreen;
        if (fn) fn.call(el);
    }

    function exitFs() {
        const fn = document.exitFullscreen || document.webkitExitFullscreen ||
                   document.mozCancelFullScreen || document.msExitFullscreen;
        if (fn) fn.call(document);
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
                right: 12px;
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
        injectStyles();
        document.querySelectorAll('.frost-wrap, #mobVideoWrap').forEach(addButton);

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
