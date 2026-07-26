/* ============================================================
   discover.js — Leveny
   ONE script for all 7 discover color themes.
   Replaces discover1.js through discover7.js.
   Data source: LEVENY_MOVIES from movies.js (m.discover field).
============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ── 1. THEME DEFINITIONS ────────────────────────────────────
    const THEMES = [
        { id: 1, name: 'Blue',   label: 'BLUE THEMED MOVIES' },
        { id: 2, name: 'Yellow', label: 'YELLOW THEMED MOVIES' },
        { id: 3, name: 'Green',  label: 'GREEN THEMED MOVIES' },
        { id: 4, name: 'Red',    label: 'RED THEMED MOVIES' },
        { id: 5, name: 'Dark',   label: 'DARK THEMED MOVIES' },
        { id: 6, name: 'Orange', label: 'ORANGE THEMED MOVIES' },
        { id: 7, name: 'Purple', label: 'PURPLE THEMED MOVIES' },
    ];

    const MOVIES_PER_PAGE = 40;

    let currentThemeIndex = 0; // index into THEMES
    let currentPage = 1;

    // ── 2. DOM REFS ──────────────────────────────────────────────
    const body        = document.body;
    const moviesGrid  = document.getElementById('moviesGrid');
    const prevBtn     = document.getElementById('prevBtn');
    const nextBtn     = document.getElementById('nextBtn');
    const pageNumbers = document.getElementById('pageNumbers');
    const pageTitleEl = document.querySelector('.page-title');
    const themeLeftArrow  = document.getElementById('discoverPrevTheme');
    const themeRightArrow = document.getElementById('discoverNextTheme');

    // ── 3. INIT ──────────────────────────────────────────────────
    init();

    function init() {
        // Restore theme from URL hash (#blue, #yellow, etc.) or ?theme=3
        const params = new URLSearchParams(window.location.search);
        const hash = window.location.hash.replace('#', '').toLowerCase();
        const themeParam = params.get('theme');

        let startIndex = 0;
        if (themeParam) {
            const byId = THEMES.findIndex(t => String(t.id) === themeParam);
            if (byId !== -1) startIndex = byId;
        } else if (hash) {
            const byName = THEMES.findIndex(t => t.name.toLowerCase() === hash);
            if (byName !== -1) startIndex = byName;
        }
        currentThemeIndex = startIndex;

        setupThemeArrows();
        setupPaginationButtons();
        setupKeyboardNav();
        loadTheme(currentThemeIndex, false);
    }

    function setupThemeArrows() {
        if (themeLeftArrow)  themeLeftArrow.addEventListener('click', () => switchTheme(-1));
        if (themeRightArrow) themeRightArrow.addEventListener('click', () => switchTheme(1));
    }

    function setupPaginationButtons() {
        if (prevBtn) prevBtn.addEventListener('click', () => goToPage(currentPage - 1));
        if (nextBtn) nextBtn.addEventListener('click', () => goToPage(currentPage + 1));
    }

    function setupKeyboardNav() {
        document.addEventListener('keydown', (e) => {
            // Avoid hijacking arrows while typing in the search box
            if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
            if (e.key === 'ArrowLeft')  switchTheme(-1);
            if (e.key === 'ArrowRight') switchTheme(1);
        });
    }

    // ── 4. THEME SWITCHING ──────────────────────────────────────
    function switchTheme(direction) {
        const total = THEMES.length;
        currentThemeIndex = (currentThemeIndex + direction + total) % total;
        currentPage = 1;
        loadTheme(currentThemeIndex, true);
    }

    function loadTheme(index, scrollToTop) {
        const theme = THEMES[index];
        body.setAttribute('data-theme', theme.id);
        if (pageTitleEl) pageTitleEl.textContent = theme.label;
        document.title = `${theme.name} Discover | Leveny`;

        window.history.replaceState(null, '', `#${theme.name.toLowerCase()}`);

        renderCurrentThemeMovies();
        if (scrollToTop) window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ── 5. GET MOVIES FOR CURRENT THEME ─────────────────────────
    function getThemeMovies() {
        const theme = THEMES[currentThemeIndex];
        return (LEVENY_MOVIES || [])
            .filter(m => m.discover === theme.id)
            .map(m => ({
                title: m.title,
                img: m.poster.replace('images/', 'images/'), // poster path as-is
                link: m.href.replace('../', ''),
            }));
    }

    // ── 6. RENDER ────────────────────────────────────────────────
    function renderCurrentThemeMovies() {
        const movies = getThemeMovies();
        if (movies.length === 0) {
            showEmptyState();
            return;
        }
        displayMovies(movies);
        generatePageNumbers(movies);
        updatePaginationButtons(movies);
    }

    function showEmptyState() {
        const theme = THEMES[currentThemeIndex];
        if (moviesGrid) {
            moviesGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-film"></i>
                    <h3>No ${theme.name} Themed Movies Found</h3>
                    <p>No ${theme.name.toLowerCase()} themed movies are currently available.<br>Check back later or browse other movie themes.</p>
                </div>`;
        }
        const pc = document.querySelector('.pagination-container');
        if (pc) pc.style.display = 'none';
    }

    function displayMovies(movies) {
        if (!moviesGrid) return;
        moviesGrid.innerHTML = '';
        const theme = THEMES[currentThemeIndex];
        const start = (currentPage - 1) * MOVIES_PER_PAGE;
        const pageMovies = movies.slice(start, start + MOVIES_PER_PAGE);

        if (pageMovies.length === 0) { showEmptyState(); return; }

        const pc = document.querySelector('.pagination-container');
        if (pc) pc.style.display = 'flex';

        pageMovies.forEach(movie => {
            const a = document.createElement('a');
            a.href = movie.link;
            a.className = 'grid-movie-item';
            a.innerHTML = `
                <div class="movie-image-container">
                    <img src="${movie.img}" alt="${movie.title}" loading="lazy">
                    <div class="image-overlay"></div>
                </div>
                <div class="movie-title">
                    <h4>${movie.title}</h4>
                    <p>${theme.name} Theme</p>
                </div>`;
            moviesGrid.appendChild(a);
        });
    }

    function getTotalPages(movies) {
        return Math.max(1, Math.ceil(movies.length / MOVIES_PER_PAGE));
    }

    function generatePageNumbers(movies) {
        if (!pageNumbers) return;
        pageNumbers.innerHTML = '';
        const totalPages = getTotalPages(movies);
        const pc = document.querySelector('.pagination-container');

        if (totalPages <= 1) { if (pc) pc.style.display = 'none'; return; }
        if (pc) pc.style.display = 'flex';

        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);

        if (startPage > 1) {
            pageNumbers.appendChild(createPageButton(1, movies));
            if (startPage > 2) pageNumbers.appendChild(createEllipsis());
        }
        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.appendChild(createPageButton(i, movies));
        }
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) pageNumbers.appendChild(createEllipsis());
            pageNumbers.appendChild(createPageButton(totalPages, movies));
        }
    }

    function createEllipsis() {
        const e = document.createElement('span');
        e.textContent = '...';
        e.style.cssText = 'color:currentColor;padding:0 5px;opacity:0.6;';
        return e;
    }

    function createPageButton(pageNum, movies) {
        const btn = document.createElement('div');
        btn.className = `page-number ${pageNum === currentPage ? 'active' : ''}`;
        btn.textContent = pageNum;
        btn.addEventListener('click', () => goToPage(pageNum));
        return btn;
    }

    function updatePaginationButtons(movies) {
        if (!prevBtn || !nextBtn) return;
        const totalPages = getTotalPages(movies);
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === totalPages;
        prevBtn.classList.toggle('disabled', currentPage === 1);
        nextBtn.classList.toggle('disabled', currentPage === totalPages);
    }

    function goToPage(page) {
        const movies = getThemeMovies();
        const totalPages = getTotalPages(movies);
        if (page < 1 || page > totalPages) return;
        currentPage = page;
        displayMovies(movies);
        generatePageNumbers(movies);
        updatePaginationButtons(movies);
        if (moviesGrid) moviesGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
});
