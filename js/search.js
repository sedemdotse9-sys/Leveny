/* ============================================================
   search.js — Leveny
   Handles BOTH desktop and mobile search, PLUS the dynamic
   homepage poster rows (color-coded, pulled from movies.js).
   All movie data lives in movies.js (LEVENY_MOVIES).
   Never hardcode movies here — edit movies.js only.
============================================================ */

/* ============================================================
   DESKTOP SEARCH
   Targets: #searchInput + #searchDropdown
   Used on: index.html, genres.html, movie_request.html
            and the desktop layout of every movie page
============================================================ */
if (localStorage.getItem('leveny-dark') === 'true') document.documentElement.classList.add('dark-mode');
document.addEventListener("DOMContentLoaded", () => {
    const searchInput    = document.getElementById("searchInput");
    const searchDropdown = document.getElementById("searchDropdown");

    if (searchInput && searchDropdown) {

        // ★ CHANGED — adjust path based on whether we're on homepage or a movie page
        const isDesktopMoviePage = window.location.pathname.includes('/movies/');
        const desktopMovies = LEVENY_MOVIES.map(m => ({
            title: m.title,
            link:  isDesktopMoviePage ? m.href : m.href.replace('../movies/', 'movies/')
        }));

        function renderDesktopDropdown(results) {
            searchDropdown.innerHTML = "";
            if (!results.length) { searchDropdown.style.display = "none"; return; }

            results.slice(0, 8).forEach(movie => {
                const item = document.createElement("div");
                item.className   = "dropdown-item";
                item.textContent = movie.title;
                item.onclick = () => { searchInput.value = ""; searchDropdown.style.display = "none"; window.location.href = movie.link; };
                searchDropdown.appendChild(item);
            });

            searchDropdown.style.display = "block";
        }

        searchInput.addEventListener("input", () => {
            const query = searchInput.value.toLowerCase().trim();
            if (!query) { searchDropdown.style.display = "none"; return; }
            renderDesktopDropdown(
                desktopMovies.filter(m => m.title.toLowerCase().includes(query))
            );
        });

        document.addEventListener("click", e => {
            if (!searchDropdown.contains(e.target) && e.target !== searchInput) {
                searchDropdown.style.display = "none";
            }
        });

        searchInput.value = "";
    }
});


/* ============================================================
   MOBILE SEARCH + DARK MODE
   Targets: #mobMovieSearchInput + #mobMovieSearchDrop
   Used on: every movie HTML page (mobile layout only)
============================================================ */
// ★ CHANGED — wait for full page before looking for mobile elements
let mobileMovieSearchInitialized = false;
function initMobileMovieSearch() {
    if (window.innerWidth <= 768 && !mobileMovieSearchInitialized) {
        mobileMovieSearchInitialized = true;

        /* ---------- Dark Mode ---------- */
        const stored      = localStorage.getItem('leveny-dark');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        let isDark = stored !== null ? stored === 'true' : prefersDark;

        function applyDark() {
            document.body.classList.toggle('dark-mode', isDark);
            document.documentElement.classList.toggle('dark-mode', isDark);
            const btn = document.getElementById('mobThemeToggle');
            if (btn) btn.textContent = isDark ? '☀️' : '🌙';
        }

        // Run on page load
        applyDark();

        document.getElementById('mobThemeToggle')?.addEventListener('click', () => {
            isDark = !isDark;
            localStorage.setItem('leveny-dark', isDark);
            applyDark();
        });

        /* ---------- Mobile Search ---------- */
        // ★ CHANGED — support both homepage IDs and movie-page IDs
        const mobInput = document.getElementById('mobMovieSearchInput') || document.getElementById('mobileSearchInput');
        const mobDrop  = document.getElementById('mobMovieSearchDrop')  || document.getElementById('mobileSearchResults');

        if (mobInput && mobDrop) {

            mobInput.addEventListener('input', () => {
                const q = mobInput.value.trim().toLowerCase();
                if (!q) { mobDrop.style.display = 'none'; return; }

                const matches = LEVENY_MOVIES.filter(m =>
                    m.title.toLowerCase().includes(q)
                );

                mobDrop.style.display = 'block';
                // ★ CHANGED — detect if we're on homepage or a movie page
                const isMoviePage = window.location.pathname.includes('/movies/');

                mobDrop.innerHTML = matches.length
                    ? matches.map(m => {
                        // ★ CHANGED — homepage needs "movies/..." but movie pages need "../movies/..."
                        const href = isMoviePage ? m.href : m.href.replace('../movies/', 'movies/');
                        return `<div class="mob-search-drop-item" data-href="${href}">
                            <i class="fas fa-film"></i>${m.title}
                        </div>`;
                }).join('')
                    : `<div class="mob-search-drop-item">
                           <i class="fas fa-search"></i>No results for "${q}"
                       </div>`;

                mobDrop.querySelectorAll('.mob-search-drop-item[data-href]').forEach(el => {
                el.addEventListener('click', () => {
                    mobInput.value = "";
                    mobDrop.style.display = 'none';
                    window.location.href = el.dataset.href;
                });
                });
            });

            document.addEventListener('click', e => {
                // ★ CHANGED — support both wrapper IDs
                if (!e.target.closest('#mobMovieSearchBar') && !e.target.closest('#mobileSearchWrapper')) {
                    mobDrop.style.display = 'none';
                }
            });
        }
    }
}
document.addEventListener('DOMContentLoaded', initMobileMovieSearch);
window.addEventListener('resize', initMobileMovieSearch);


/* ============================================================
   HOMEPAGE DYNAMIC POSTER ROWS
   Fills each slide's poster row (.movie-list, .movie-list-2, etc.)
   from LEVENY_MOVIES, based on that slide's color (m.discover).
   Newest-added movie of that color appears first; the banner
   movie itself is left completely alone (excluded from its row,
   never edited). Capped at 7 posters per row.
   Runs only where these row containers exist (i.e. index.html).
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    if (typeof LEVENY_MOVIES === 'undefined') return;

    // Which movie is the hand-written banner for each color — excluded from its row, never touched
    const BANNER_HREF = {
        1: 'movies/avatar_way_of_water_movie.html',
        2: 'movies/jurassic_park_dominion_movie.html',
        3: 'movies/the_grinch_movie.html',
        4: 'movies/deadpool_movie.html',
        5: 'movies/batman_the_dark_knigt_movie.html',
        6: 'movies/lion_king_movie.html',
        7: 'movies/ballerina_movie.html',
    };

    // Which row container belongs to which color
    const ROW_SELECTOR = {
        1: '.slide1 .movie-list',
        2: '.slide2 .movie-list-2',
        3: '.slide3 .movie-list-3',
        4: '.slide4 .movie-list-4',
        5: '.slide5 .movie-list-5',
        6: '.slide6 .movie-list-6',
        7: '.slide7 .movie-list-7',
    };

    const MAX_PER_ROW = 7;
    let anyRowFound = false;

    Object.keys(ROW_SELECTOR).forEach(key => {
        const colorId = Number(key);
        const container = document.querySelector(ROW_SELECTOR[colorId]);
        if (!container) return;
        anyRowFound = true;

        const bannerHref = BANNER_HREF[colorId];

        const moviesForColor = LEVENY_MOVIES
            .filter(m => m.discover === colorId && m.href.replace('../', '') !== bannerHref)
            .slice()      // don't mutate the original array
            .reverse()    // newest-added (last in array) shows first
            .slice(0, MAX_PER_ROW);

        container.innerHTML = '';

        moviesForColor.forEach(m => {
            const a = document.createElement('a');
            a.href = m.href.replace('../', '');

            const item = document.createElement('div');
            item.className = 'movie-item';
            item.dataset.title = m.title;
            item.dataset.genre = capitalizeFirst(m.genre);

            const img = document.createElement('img');
            img.src = m.poster;
            img.alt = m.title;

            item.appendChild(img);
            a.appendChild(item);
            container.appendChild(a);
        });
    });

    // No-op on pages without these rows (movie pages, genres.html, etc.)
    if (!anyRowFound) return;

    function capitalizeFirst(str) {
        if (!str) return str;
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
});
