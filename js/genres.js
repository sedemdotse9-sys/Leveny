// genres.js — Leveny
// Data source: LEVENY_MOVIES from movies.js (single source of truth)
// genres.js owns only page logic: navigation, rendering, pagination.

document.addEventListener('DOMContentLoaded', function () {

    // ── 1. BUILD moviesByGenre FROM LEVENY_MOVIES ──────────────────
    const moviesByGenre = {};
    (LEVENY_MOVIES || []).forEach(m => {
        const genre = (m.genre || '').toLowerCase();
        if (!genre) return;
        if (!moviesByGenre[genre]) moviesByGenre[genre] = [];
        moviesByGenre[genre].push({
            title: m.title,
            year:  m.year  || '',   // add year to movies.js entries if needed
            img:   m.poster,
            link:  m.href,
        });
    });

    // ── 2. CONSTANTS ────────────────────────────────────────────────
    const MOVIES_PER_ROW  = 6;
    const ROWS_PER_PAGE   = 4;
    const MOVIES_PER_PAGE = MOVIES_PER_ROW * ROWS_PER_PAGE; // 24

    // ★ FIXED — genre order now comes from the actual .genre-slide
    // sections in the DOM, not from moviesByGenre. This means a genre
    // with zero movies so far (like a brand-new "romance" section)
    // still shows up, still gets a working #hash, and still gets
    // included in prev/next arrow navigation — it just renders an
    // empty grid until movies are tagged with that genre.
    const GENRE_ORDER = Array.from(document.querySelectorAll('.genre-slide'))
        .map(el => el.dataset.genre)
        .filter(Boolean);

    let currentGenre = 'action';
    let currentPage  = 1;

    initGenresPage();

    // ── 3. INIT ─────────────────────────────────────────────────────
    function initGenresPage() {
        loadMoviesForGenre('action');
        setupGenreNavigation();

        const hash = window.location.hash.substring(1);
        // ★ FIXED — was `moviesByGenre[hash]`, which failed for any
        // genre with no movies yet. Now checks that the section
        // actually exists on the page instead.
        if (hash && document.getElementById(hash)) {
            switchGenre(hash);
        }
    }

    // ── 4. GENRE NAVIGATION ─────────────────────────────────────────
    function setupGenreNavigation() {
        const prevBtn = document.getElementById('genrePrev');
        const nextBtn = document.getElementById('genreNext');

        if (prevBtn) prevBtn.addEventListener('click', prevGenre);
        if (nextBtn) nextBtn.addEventListener('click', nextGenre);

        document.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowLeft')  prevGenre();
            if (e.key === 'ArrowRight') nextGenre();
        });
    }

    function switchGenre(genre) {
        // ★ FIXED — was `if (!moviesByGenre[genre] || ...)`, which
        // blocked switching to any genre with zero movies so far.
        const section = document.getElementById(genre);
        if (!section || currentGenre === genre) return;

        currentGenre = genre;
        currentPage  = 1;

        document.querySelectorAll('.genre-slide').forEach(s => s.classList.remove('active'));
        section.classList.add('active');

        loadMoviesForGenre(genre);
        window.location.hash = genre;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function prevGenre() {
        // ★ FIXED — was `Object.keys(moviesByGenre)`, which skipped
        // any genre with zero movies. Now uses GENRE_ORDER (built
        // from the DOM sections) so every genre is reachable.
        const i = GENRE_ORDER.indexOf(currentGenre);
        switchGenre(GENRE_ORDER[i > 0 ? i - 1 : GENRE_ORDER.length - 1]);
    }

    function nextGenre() {
        const i = GENRE_ORDER.indexOf(currentGenre);
        switchGenre(GENRE_ORDER[i < GENRE_ORDER.length - 1 ? i + 1 : 0]);
    }

    // ── 5. LOAD MOVIES INTO ROWS ────────────────────────────────────
    function loadMoviesForGenre(genre) {
        // ★ FIXED — was `const movies = moviesByGenre[genre]; if (!movies) return;`
        // which meant a genre with no movies yet never even cleared
        // its rows or rendered an empty pagination state. Now it
        // defaults to an empty array and renders normally (empty).
        const movies = moviesByGenre[genre] || [];

        const section = document.getElementById(genre);
        if (!section) return;

        const rowContainers = Array.from(
            section.querySelectorAll('.movie-slider .movie-slider-container')
        );

        rowContainers.forEach(rc => rc.innerHTML = '');

        const startIndex = (currentPage - 1) * MOVIES_PER_PAGE;
        const pageMovies = movies.slice(startIndex, startIndex + MOVIES_PER_PAGE);

        pageMovies.forEach((movie, idx) => {
            const rowIndex = Math.floor(idx / MOVIES_PER_ROW);
            if (rowIndex < rowContainers.length) {
                rowContainers[rowIndex].appendChild(createMovieCard(movie));
            }
        });

        // Hide empty rows
        rowContainers.forEach(rc => {
            rc.closest('.movie-slider').style.display =
                rc.children.length > 0 ? '' : 'none';
        });

        const totalPages = Math.ceil(movies.length / MOVIES_PER_PAGE);
        updatePagination(genre, totalPages);
    }

    // ── 6. CARD FACTORY ─────────────────────────────────────────────
    function createMovieCard(movie) {
        const card = document.createElement('a');
        card.className = 'movie-card-slider';
        card.href = movie.link;
        card.innerHTML = `
            <img src="${movie.img}" alt="${movie.title}" loading="lazy">
            <div class="movie-info-slider">
                <h4>${movie.title}</h4>
                <p>${movie.year}</p>
            </div>
        `;
        return card;
    }

    // ── 7. PAGINATION ────────────────────────────────────────────────
    function updatePagination(genre, totalPages) {
        const section    = document.getElementById(genre);
        if (!section) return;
        const pagination = section.querySelector('.genre-pagination');
        if (!pagination) return;

        pagination.innerHTML = '';

        // ★ FIXED — a genre with 0 movies now has totalPages === 0,
        // so this just renders no page numbers instead of leaving
        // stale ones in place.
        for (let i = 1; i <= totalPages; i++) {
            const span = document.createElement('span');
            span.className = 'page-numbers' + (i === currentPage ? ' active' : '');
            span.setAttribute('data-page', i);
            span.textContent = i;

            span.addEventListener('click', function () {
                const page = parseInt(this.getAttribute('data-page'));
                if (page === currentPage) return;
                currentPage = page;
                loadMoviesForGenre(genre);
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });

            pagination.appendChild(span);
        }
    }
});
