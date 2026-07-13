/* ============================================================
   MOBILE.JS — Leveny
   Neon accent system + dark/light toggle button.
============================================================ */

if (window.innerWidth <= 768) {

    /* ============================================================
       SLIDE CONFIG
    ============================================================ */
    const SLIDES = [
        {
            title:  'AVATAR: THE WAY OF WATER',
            href:   'movies/avatar_way_of_water_movie.html',
            img:    'images/backgrounds/way.jpg',
            accent: '#00A8FF',
            softBg: '#c8e8ff',
            glow:   'rgba(0,168,255,0.45)',
            dim:    'rgba(0,168,255,0.12)',
        },
        {
            title:  'JURASSIC WORLD: DOMINION',
            href:   'movies/jurassic_park_dominion_movie.html',
            img:    'images/backgrounds/jw.jpg',
            accent: '#FFD600',
            softBg: '#fff4b0',
            glow:   'rgba(255,214,0,0.45)',
            dim:    'rgba(255,214,0,0.12)',
        },
        {
            title:  'BEN 10',
            href:   'movies/ben_10_movie.html',
            img:    'images/backgrounds/bt.jpg',
            accent: '#00FF7F',
            softBg: '#b6ffd8',
            glow:   'rgba(0,255,127,0.45)',
            dim:    'rgba(0,255,127,0.12)',
        },
        {
            title:  'DEADPOOL',
            href:   'movies/deadpool_movie.html',
            img:    'images/backgrounds/dp.jpg',
            accent: '#FF2D2D',
            softBg: '#ffc4c4',
            glow:   'rgba(255,45,45,0.45)',
            dim:    'rgba(255,45,45,0.12)',
        },
        {
            title:  'BATMAN: DARK KNIGHT',
            href:   'movies/batman_the_dark_knigt_movie.html',
            img:    'images/backgrounds/batman.jpg',
            accent: '#A0AEC0',
            softBg: '#dce2ea',
            glow:   'rgba(160,174,192,0.40)',
            dim:    'rgba(160,174,192,0.10)',
        },
        {
            title:  'THE LION KING',
            href:   'movies/lion_king_movie.html',
            img:    'images/backgrounds/liki.jpg',
            accent: '#FF6B00',
            softBg: '#ffd9b0',
            glow:   'rgba(255,107,0,0.45)',
            dim:    'rgba(255,107,0,0.12)',
        },
        {
            title:  'BALLERINA',
            href:   'movies/ballerina_movie.html',
            img:    'images/backgrounds/bal.jpg',
            accent: '#BF5FFF',
            softBg: '#e8c8ff',
            glow:   'rgba(191,95,255,0.45)',
            dim:    'rgba(191,95,255,0.12)',
        }
    ];

    const INTERVAL = 15000;
    const SLIDE_STATE_KEY = 'leveny-slide-state';   // ★ CHANGED — new storage key
    let currentIdx = 0;
    let timerStart = Date.now();
    let isDark     = false;

    /* ============================================================
       DARK MODE INIT + TOGGLE
    ============================================================ */
    function initDarkMode() {
        const stored      = localStorage.getItem('leveny-dark');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        isDark = stored !== null ? stored === 'true' : prefersDark;
        applyDarkClass();
    }

    function applyDarkClass() {
        document.body.classList.toggle('dark-mode', isDark);
        document.documentElement.classList.toggle('dark', isDark);

        const btn = document.getElementById('mobileThemeToggle');
        if (btn) btn.textContent = isDark ? '☀️' : '🌙';

        /* Update body bg for current slide */
        const s = SLIDES[currentIdx];
        document.body.style.backgroundColor = isDark ? '#0D0D0D' : s.softBg;
    }

    function toggleDark() {
        isDark = !isDark;
        localStorage.setItem('leveny-dark', isDark);
        applyDarkClass();
    }

    /* ============================================================
       INJECT THEME TOGGLE BUTTON INTO HEADER
    ============================================================ */
    function buildThemeToggle() {
        const header = document.getElementById('mobileHeader');
        if (!header) return;

        const btn = document.createElement('button');
        btn.id          = 'mobileThemeToggle';
        btn.textContent = isDark ? '☀️' : '🌙';
        btn.setAttribute('aria-label', 'Toggle dark mode');
        btn.addEventListener('click', toggleDark);

        /* Insert before the profile button */
        const profileBtn = header.querySelector('.mobile-profile-btn');
        if (profileBtn) {
            header.insertBefore(btn, profileBtn);
        } else {
            header.appendChild(btn);
        }
    }

    // ★ CHANGED — restore slide position + timer progress from before refresh
    const savedSlideState = JSON.parse(sessionStorage.getItem(SLIDE_STATE_KEY) || 'null');
    if (
        savedSlideState &&
        savedSlideState.idx >= 0 &&
        savedSlideState.idx < SLIDES.length &&
        typeof savedSlideState.start === 'number'
    ) {
        currentIdx = savedSlideState.idx;
        timerStart = savedSlideState.start;
    }   

    /* ============================================================
       APPLY SLIDE ACCENT
    ============================================================ */
    function applySlide(idx) {
        const s    = SLIDES[idx];
        const root = document.documentElement;

        root.style.setProperty('--accent',      s.accent);
        root.style.setProperty('--accent-glow', s.glow);
        root.style.setProperty('--accent-dim',  s.dim);
        root.style.setProperty('--accent-soft', s.softBg);

        document.body.style.backgroundColor = isDark ? '#0D0D0D' : s.softBg;

        /* Featured slides */
        document.querySelectorAll('.featured-slide').forEach((el, i) => {
            el.classList.toggle('active', i === idx);
        });

        /* Dots */
        document.querySelectorAll('.featured-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === idx);
        });

        /* Progress bar colour */
        const bar = document.getElementById('featuredColorBar');
        if (bar) bar.style.background = s.accent;

        sessionStorage.setItem(SLIDE_STATE_KEY, JSON.stringify({ idx, start: timerStart }));   // ★ CHANGED
    }

    /* ============================================================
       BUILD FEATURED BANNER
    ============================================================ */
    function buildFeaturedBanner() {
        const featured = document.getElementById('mobileFeatured');
        if (!featured) return;
        featured.innerHTML = '';

        const container = document.createElement('div');
        container.id    = 'featuredSlidesContainer';

        SLIDES.forEach((s, i) => {
            const div = document.createElement('div');
            div.className = 'featured-slide' + (i === 0 ? ' active' : '');
            div.innerHTML = `
                <img src="${s.img}" alt="${s.title}">
                <a href="${s.href}" class="featured-slide-info">
                    <div class="featured-slide-title">${s.title}</div>
                    <span class="featured-slide-btn">Watch Now</span>
                </a>`;
            container.appendChild(div);
        });

        featured.appendChild(container);

        const bar      = document.createElement('div');
        bar.id         = 'featuredColorBar';
        bar.style.cssText = 'position:absolute;bottom:0;left:0;height:3px;width:0%;z-index:5;';
        featured.appendChild(bar);

        const dotsWrap = document.createElement('div');
        dotsWrap.id    = 'featuredDots';
        SLIDES.forEach((_, i) => {
            const d = document.createElement('div');
            d.className = 'featured-dot' + (i === 0 ? ' active' : '');
            dotsWrap.appendChild(d);
        });
        featured.appendChild(dotsWrap);
    }

    /* ============================================================
       RAF TIMER
    ============================================================ */
    function tickTimer() {
        const elapsed  = Date.now() - timerStart;
        const progress = Math.min(elapsed / INTERVAL, 1);
        const bar      = document.getElementById('featuredColorBar');

        if (bar) {
            bar.style.width      = (progress * 100) + '%';
            bar.style.transition = 'width linear 0.1s, background 1s ease';
        }

        if (elapsed >= INTERVAL) {
            currentIdx = (currentIdx + 1) % SLIDES.length;
            timerStart = Date.now();
            applySlide(currentIdx);
            if (bar) { bar.style.transition = 'none'; bar.style.width = '0%'; }
        }

        requestAnimationFrame(tickTimer);
    }

    /* ============================================================
       MOVIE DATA
    ============================================================ */
    const allMovies = [];

    document.querySelectorAll('.slide .movie-item').forEach(item => {
        const img   = item.querySelector('img');
        const link  = item.closest('a');
        const title = item.dataset.title || img?.alt || 'Movie';
        const genre = getGenreFromSlide(item);
        if (!img || !link) return;
        allMovies.push({ title, genre, href: link.href, src: img.src, alt: img.alt });
    });

   function getGenreFromSlide(item) {
    return (item.dataset.genre || 'all').toLowerCase().replace(/[^a-z]/g, '');
    }

    /* ============================================================
       RENDER GRID
    ============================================================ */
    const grid    = document.getElementById('mobileMoviesSection');
    const pagWrap = document.getElementById('mobileMoviesPagination');

    /* ============================================================
   HELPERS
============================================================ */
function cap(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ============================================================
   RENDER GRID
============================================================ */
// const grid = document.getElementById('mobileMoviesSection');
// const pagWrap = document.getElementById('mobileMoviesPagination');

const PAGE_SIZE = 24;
const HOME_PAGE_KEY = 'leveny-home-page';   // ★ CHANGED — new constant for storage key
let currentMovieList = allMovies;
let currentPage = 1;

function renderGrid(movies, page = 1) {
    if (!grid) return;

    currentMovieList = movies;

    const totalPages = Math.max(
        1,
        Math.ceil(movies.length / PAGE_SIZE)
    );

    currentPage = Math.min(
        Math.max(page, 1),
        totalPages
    );

    sessionStorage.setItem(HOME_PAGE_KEY, currentPage);   // ★ CHANGED — remember current page

    const start = (currentPage - 1) * PAGE_SIZE;

    const pageItems = movies.slice(
        start,
        start + PAGE_SIZE
    );

    grid.innerHTML = '';

    pageItems.forEach(movie => {
        const a = document.createElement('a');

        a.className = 'mob-card';
        a.href = movie.href;

        a.innerHTML = `
            <img
                class="mob-card-img"
                src="${movie.src}"
                alt="${movie.alt}"
                loading="lazy"
            >

            <div class="mob-card-info">
                <div class="mob-card-title">
                    ${movie.title}
                </div>

                <div class="mob-card-genre">
                    ${cap(movie.genre)}
                </div>
            </div>
        `;

        grid.appendChild(a);
    });

    renderPagination(totalPages);
}

function renderPagination(totalPages) {

    if (!pagWrap) return;

    pagWrap.innerHTML = '';

    if (totalPages <= 1) return;

    const makeBtn = (
        label,
        page,
        extraClass = ''
    ) => {

        const btn = document.createElement('button');

        btn.className =
            'mob-page-btn' + extraClass;

        btn.innerHTML = label;

        btn.addEventListener('click', () => {

            renderGrid(
                currentMovieList,
                page
            );

            window.scrollTo({          // ★ CHANGED — was grid.scrollIntoView(...)
                top: 0,
                behavior: 'instant'
            });
        });

        return btn;
    };

    /* Previous */
    const prev = makeBtn(
        '<i class="fas fa-chevron-left"></i>',
        currentPage - 1,
        ' mob-page-arrow'
    );

    if (currentPage === 1) {
        prev.disabled = true;
    }

    pagWrap.appendChild(prev);

    /* Page Numbers */
    for (let i = 1; i <= totalPages; i++) {

        const btn = makeBtn(
            i,
            i,
            i === currentPage
                ? ' active'
                : ''
        );

        pagWrap.appendChild(btn);
    }

    /* Next */
    const next = makeBtn(
        '<i class="fas fa-chevron-right"></i>',
        currentPage + 1,
        ' mob-page-arrow'
    );

    if (currentPage === totalPages) {
        next.disabled = true;
    }

    pagWrap.appendChild(next);
}

const savedPage = parseInt(sessionStorage.getItem(HOME_PAGE_KEY), 10) || 1;   // ★ CHANGED

renderGrid(allMovies, savedPage);                                              // ★ CHANGED — was renderGrid(allMovies, 1);

    // /* ============================================================
    //    CATEGORY PILLS
    // ============================================================ */
    // document.querySelectorAll('.mob-pill').forEach(pill => {
    //     pill.addEventListener('click', () => {
    //         document.querySelectorAll('.mob-pill').forEach(p => p.classList.remove('active'));
    //         pill.classList.add('active');
    //         const filter = pill.dataset.filter;
    //         const label  = document.querySelector('.mob-section-label');
    //         if (filter === 'all') {
    //             renderGrid(allMovies);
    //             if (label) label.textContent = 'All Movies';
    //         } else {
    //             const filtered = allMovies.filter(m => m.genre === filter);
    //             renderGrid(filtered.length ? filtered : allMovies, 1);
    //             if (label) label.textContent = cap(filter);
    //         }
    //     });
    // });

    /* ============================================================
       SEARCH
    ============================================================ */
    const searchInput   = document.getElementById('mobileSearchInput');
    const searchResults = document.getElementById('mobileSearchResults');

    if (searchInput && searchResults) {
        searchInput.addEventListener('input', () => {
            const q = searchInput.value.trim().toLowerCase();
            if (!q) { searchResults.style.display = 'none'; renderGrid(allMovies); return; }
            const matches = allMovies.filter(m => m.title.toLowerCase().includes(q));
            searchResults.style.display = 'block';
            searchResults.innerHTML = matches.length
                ? matches.map(m => `<div class="mob-drop-item" data-href="${m.href}"><i class="fas fa-film"></i>${m.title}</div>`).join('')
                : `<div class="mob-drop-item"><i class="fas fa-search"></i>No results for "${q}"</div>`;
            searchResults.querySelectorAll('.mob-drop-item[data-href]').forEach(item => {
                item.addEventListener('click', () => { window.location.href = item.dataset.href; });
            });
        });
        document.addEventListener('click', e => {
            if (!e.target.closest('#mobileSearchWrapper') && !e.target.closest('#mobileSearchResults'))
            searchResults.style.display = 'none';
        });
    }

    /* ============================================================
       GENRES PANEL
    ============================================================ */
    if (!window.__levenyGenresHooked) {
        const genresBtn      = document.getElementById('mobGenresBtn');
        const genresPanel    = document.getElementById('mobileGenresPanel');
        const genresBackdrop = document.getElementById('genresPanelBackdrop');

        const openGenres  = () => { genresPanel?.classList.add('open'); genresBackdrop?.classList.add('open'); document.body.style.overflow = 'hidden'; genresBtn?.classList.add('active'); };
        const closeGenres = () => { genresPanel?.classList.remove('open'); genresBackdrop?.classList.remove('open'); document.body.style.overflow = ''; genresBtn?.classList.remove('active'); };

        genresBtn?.addEventListener('click', () => genresPanel?.classList.contains('open') ? closeGenres() : openGenres());
        genresBackdrop?.addEventListener('click', closeGenres);
    }
    /* ============================================================
       BOTTOM NAV ACTIVE STATE
    ============================================================ */
    const currentFile =
    window.location.pathname.split('/').pop() ||'index.html';
    document.querySelectorAll('.mob-nav-item').forEach(item => {
        if (item.getAttribute('href')?.includes(currentFile)) {
            document.querySelectorAll('.mob-nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');
        }
    });

    /* ============================================================
       INIT
    ============================================================ */
    initDarkMode();
    buildThemeToggle();
    if (document.getElementById('mobileFeatured')) {
      buildFeaturedBanner();
      applySlide(currentIdx);
      tickTimer();
    }
}
