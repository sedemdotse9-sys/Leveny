function __isMobileViewport() {
  // True for phones/tablets in portrait (width <=1024) AND for tablets
  // rotated to landscape (their short side, now the height, is <=1024
  // and they're a touch device -- this is what keeps a rotated tablet
  // from being mistaken for a small laptop).
  return window.innerWidth <= 1024 ||
    (window.matchMedia('(orientation: landscape)').matches &&
     window.innerHeight <= 1024 &&
     window.matchMedia('(pointer: coarse)').matches);
}

/* ============================================================
   GENRES-MOBILE.JS — Leveny
   When a genre icon is tapped in the slide-up panel:
   1. Panel closes
   2. Homepage grid sections hide
   3. Genre results view appears (2 cols × 9 rows = 18 per page)
   4. Back button restores homepage view

   ★ FIXED — new movies were sinking to the bottom of each genre's
   list. movies.js always appends new entries at the END of
   LEVENY_MOVIES (oldest → newest), and this file's own
   getMovieData() was preserving that order, so a brand-new movie
   landed on the last page instead of the first. The homepage
   avoids this by reversing before display (see js/search.js).
   getMovieData() now reverses each genre's array the same way, so
   the newest-added movie in a genre shows up first — consistent
   with the homepage.
============================================================ */

if (__isMobileViewport()) {

    const MOVIES_PER_PAGE = 18; // 2 columns × 9 rows

    /* moviesByGenre is defined in genres.js.
       On index.html it won't exist, so we build our own
       from the data-genre attributes already on every .movie-item. */
    function getMovieData() {
        /* If genres.js has already populated moviesByGenre, use it —
           but return newest-first copies so we don't rely on (or
           mutate) whatever order genres.js built it in. */
        if (typeof moviesByGenre !== 'undefined') {
            const newestFirst = {};
            Object.keys(moviesByGenre).forEach(genre => {
                newestFirst[genre] = moviesByGenre[genre].slice().reverse();
            });
            return newestFirst;
        }

        /* Otherwise build it from the DOM (index.html path) */
        const map = {};
        document.querySelectorAll('.slide .movie-item').forEach(item => {
            const img   = item.querySelector('img');
            const link  = item.closest('a');
            if (!img || !link) return;
            const genre = (item.dataset.genre || 'all').toLowerCase().replace('-', '');
            if (!map[genre]) map[genre] = [];
            map[genre].push({
                title: item.dataset.title || img.alt || 'Movie',
                year:  '',
                img:   img.src,
                link:  link.href,
            });
        });

        // ★ FIXED — reverse so newest-added (last one found in the DOM)
        // shows first, same convention as the homepage and the
        // moviesByGenre branch above.
        Object.keys(map).forEach(genre => map[genre].reverse());

        return map;
    }

    const GENRE_LABELS = {
        action:    'Action',
        superhero: 'Superhero',
        animation: 'Animation',
        fantasy:   'Fantasy',
        scifi:     'Sci-Fi',
        family:    'Family',
        thriller:  'Thriller',
        horror:    'Horror',
        musical:   'Musical',
        romance:   'Romance',
    };

    let activeGenre = null;
    let activePage  = 1;

    /* DOM refs */
    const genreView      = document.getElementById('mobileGenreView');
    const genreGrid      = document.getElementById('mobileGenreGrid');
    const genrePagination= document.getElementById('mobileGenrePagination');
    const genreBackBtn   = document.getElementById('mobileGenreBackBtn');
    const genreTitle     = document.getElementById('mobileGenreViewTitle');

    /* Panel close helpers (re-use mobile.js closeGenres if available) */
    const genresPanel    = document.getElementById('mobileGenresPanel');
    const genresBackdrop = document.getElementById('genresPanelBackdrop');
    const genresBtn      = document.getElementById('mobGenresBtn');

    function closePanel() {
        genresPanel?.classList.remove('open');
        genresBackdrop?.classList.remove('open');
        document.body.style.overflow = '';
        document.getElementById('mobGenresBtn')?.classList.remove('active-nav');
    }

    /* ============================================================
       OPEN GENRE — called when a genre item in the panel is tapped
    ============================================================ */
    function openGenre(genreKey) {
        closePanel();
        // ★ CHANGED — navigate to standalone genre page instead of inline view
        window.location.href = 'genre-results.html?genre=' + genreKey;
    }

    // Auto-open genre if arriving from a movie page
    const urlParams = new URLSearchParams(window.location.search);
    const incomingGenre = urlParams.get('genre');
    if (incomingGenre && GENRE_LABELS[incomingGenre]) {
        window.addEventListener('load', () => {
            setTimeout(() => openGenre(incomingGenre), 300);
        });
    }

    /* ============================================================
       BACK — restore homepage view
    ============================================================ */
    function goBack() {
        document.body.classList.remove('genre-active');
        genreView?.classList.remove('visible');
        activeGenre = null;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    genreBackBtn?.addEventListener('click', goBack);

    /* ============================================================
       RENDER CURRENT PAGE
    ============================================================ */
    function renderPage() {
        if (!activeGenre || !genreGrid) return;

        const data   = getMovieData();
        const movies = data[activeGenre] || [];
        const start  = (activePage - 1) * MOVIES_PER_PAGE;
        const slice  = movies.slice(start, start + MOVIES_PER_PAGE);

        genreGrid.innerHTML = '';

        if (slice.length === 0) {
            genreGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px 0;color:#888;font-family:Rockwell,sans-serif;">No movies found.</div>`;
        } else {
            slice.forEach(movie => {
                const a = document.createElement('a');
                a.className = 'mob-card';
                a.href      = movie.link;
                a.innerHTML = `
                    <img class="mob-card-img" src="${movie.img}" alt="${movie.title}" loading="lazy">
                    <div class="mob-card-info">
                        <div class="mob-card-title">${movie.title}</div>
                        <div class="mob-card-genre">${GENRE_LABELS[activeGenre] || activeGenre}</div>
                    </div>`;
                genreGrid.appendChild(a);
            });
        }

        buildPagination(movies.length);
    }

    /* ============================================================
       PAGINATION
    ============================================================ */
    function buildPagination(total) {
        if (!genrePagination) return;
        genrePagination.innerHTML = '';

        const totalPages = Math.ceil(total / MOVIES_PER_PAGE);
        if (totalPages <= 1) return;

        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.className   = 'mob-page-btn' + (i === activePage ? ' active' : '');
            btn.textContent = i;
            btn.addEventListener('click', () => {
                if (i === activePage) return;
                activePage = i;
                renderPage();
                genreView?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            genrePagination.appendChild(btn);
        }
    }

    /* ============================================================
       HOOK INTO GENRE PANEL ITEMS
       We intercept clicks on .mob-genre-item links inside the panel
       instead of letting them navigate to genres.html
    ============================================================ */
    function hookGenreItems() {
        document.querySelectorAll('#mobileGenresPanel .mob-genre-item').forEach(item => {
            item.addEventListener('click', e => {
                e.preventDefault();
                const href  = item.getAttribute('href') || '';
                // ★ CHANGED — read ?genre=action instead of #action
                const match = href.match(/[?&]genre=([a-z]+)/);
                const key   = match ? match[1] : null;
                if (key && GENRE_LABELS[key]) {
                    openGenre(key);
                }
            });
        });
    }

    /* Run after DOM is ready */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', hookGenreItems);
    } else {
        hookGenreItems();
    }
}
