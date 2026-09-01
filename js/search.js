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
   search.js — Leveny
   Handles BOTH desktop and mobile search, PLUS the dynamic
   homepage poster rows (color-coded, pulled from movies.js).
   All movie data lives in movies.js (LEVENY_MOVIES).
   Never hardcode movies here — edit movies.js only.

   ★ CHANGED — search is now fuzzy / typo-tolerant. Instead of a
   strict `.includes()` check, every title gets a relevance score:
     - exact substring matches score highest
     - otherwise each query word is compared against each title
       word using edit-distance, so typos / missing letters /
       partial words still surface a match
   Results are sorted by score, so the closest matches float to
   the top even when nothing is spelled exactly right.
============================================================ */

/* ============================================================
   ★ CHANGED — shared fuzzy search utility
   Used by both the desktop dropdown and the mobile dropdown so
   they always behave the same way.
============================================================ */
function __levenshteinDistance(a, b) {
    const m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;

    const dp = new Array(n + 1);
    for (let j = 0; j <= n; j++) dp[j] = j;

    for (let i = 1; i <= m; i++) {
        let prev = dp[0];
        dp[0] = i;
        for (let j = 1; j <= n; j++) {
            const temp = dp[j];
            dp[j] = a[i - 1] === b[j - 1]
                ? prev
                : 1 + Math.min(prev, dp[j], dp[j - 1]);
            prev = temp;
        }
    }
    return dp[n];
}

function __normalizeSearchText(str) {
    return str
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
        .replace(/[^a-z0-9\s]/g, ' ')                       // punctuation -> space
        .replace(/\s+/g, ' ')
        .trim();
}

// Returns a relevance score for how well `query` matches `title`.
// 0 (or less) means "not a match" and should be filtered out.
function __fuzzyScore(query, title) {
    const q = __normalizeSearchText(query);
    const t = __normalizeSearchText(title);
    if (!q) return 0;

    // Strong signal: query appears verbatim somewhere in the title.
    // Shorter gap between query length and title length scores higher
    // (so "avatar" ranks the Avatar movie above a longer title that
    // merely contains the word "avatar" deep in a subtitle).
    if (t.includes(q)) {
        return 1000 - (t.length - q.length);
    }

    const queryWords = q.split(' ').filter(Boolean);
    const titleWords = t.split(' ').filter(Boolean);

    let totalScore = 0;
    let matchedWords = 0;

    queryWords.forEach(qw => {
        let bestWordScore = 0;

        titleWords.forEach(tw => {
            if (tw.includes(qw) || qw.includes(tw)) {
                // partial word match, e.g. "aveng" -> "avengers"
                bestWordScore = Math.max(bestWordScore, 50);
                return;
            }

            const dist = __levenshteinDistance(qw, tw);
            const maxLen = Math.max(qw.length, tw.length);
            const similarity = 1 - dist / maxLen;

            // Typo tolerance threshold. Short words (<=3 chars) need
            // to be near-exact so we don't match on noise.
            const threshold = qw.length <= 3 ? 0.8 : 0.55;

            if (similarity >= threshold) {
                bestWordScore = Math.max(bestWordScore, similarity * 40);
            }
        });

        if (bestWordScore > 0) matchedWords++;
        totalScore += bestWordScore;
    });

    // Require most of the query's words to have found some match,
    // otherwise a two-word query like "the room" could weakly match
    // almost anything.
    const requiredMatches = Math.ceil(queryWords.length / 2);
    if (matchedWords < requiredMatches) return 0;

    return totalScore;
}

// Filters + ranks a movie list against a query. Movies is expected to
// be an array of objects with at least a `title`; any extra fields
// pass through untouched.
function __fuzzySearchMovies(movies, query, limit) {
    const scored = movies
        .map(m => ({ movie: m, score: __fuzzyScore(query, m.title) }))
        .filter(entry => entry.score > 0)
        .sort((a, b) => b.score - a.score);

    return (limit ? scored.slice(0, limit) : scored).map(entry => entry.movie);
}

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
            const query = searchInput.value.trim();
            if (!query) { searchDropdown.style.display = "none"; return; }
            // ★ CHANGED — fuzzy match instead of strict includes()
            renderDesktopDropdown(__fuzzySearchMovies(desktopMovies, query));
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
    if (__isMobileViewport() && !mobileMovieSearchInitialized) {
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
                const q = mobInput.value.trim();
                if (!q) { mobDrop.style.display = 'none'; return; }

                // ★ CHANGED — fuzzy match instead of strict includes()
                const matches = __fuzzySearchMovies(LEVENY_MOVIES, q);

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
