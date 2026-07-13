// js/discover4.js - Red themed movies

const redThemedMovies = LEVENY_MOVIES.filter(m => m.discover === 4).map(m => ({
    title: m.title,
    img: m.poster,
    link: m.href.replace('../', '')
}));

const moviesPerPage = 40;
let currentPage = 1;
let moviesGrid, prevBtn, nextBtn, pageNumbers;

document.addEventListener('DOMContentLoaded', () => {
    moviesGrid = document.getElementById('moviesGrid');
    prevBtn = document.getElementById('prevBtn');
    nextBtn = document.getElementById('nextBtn');
    pageNumbers = document.getElementById('pageNumbers');
    updatePageTitle();
    initializePagination();
    setupEventListeners();
});

function updatePageTitle() {
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) pageTitle.textContent = 'RED THEMED MOVIES';
}

function initializePagination() {
    if (redThemedMovies.length === 0) { showEmptyState(); return; }
    displayMovies();
    generatePageNumbers();
    updatePagination();
}

function showEmptyState() {
    moviesGrid.innerHTML = '<div class="empty-state"><i class="fas fa-film"></i><h3>No Red Themed Movies Found</h3><p>No Red themed movies are currently available.<br>Check back later or browse other movie themes.</p></div>';
    const pc = document.querySelector('.pagination-container');
    if (pc) pc.style.display = 'none';
}

function setupEventListeners() {
    if (prevBtn) prevBtn.addEventListener('click', () => goToPage(currentPage - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goToPage(currentPage + 1));
}

function displayMovies() {
    if (!moviesGrid) return;
    moviesGrid.innerHTML = '';
    const pageMovies = redThemedMovies.slice((currentPage - 1) * moviesPerPage, currentPage * moviesPerPage);
    if (pageMovies.length === 0) { showEmptyState(); return; }
    pageMovies.forEach(movie => {
        const a = document.createElement('a');
        a.href = movie.link;
        a.className = 'grid-movie-item';
        a.innerHTML = '<div class="movie-image-container"><img src="' + movie.img + '" alt="' + movie.title + '" loading="lazy"><div class="image-overlay"></div></div><div class="movie-title"><h4>' + movie.title + '</h4><p>Red Theme</p></div>';
        moviesGrid.appendChild(a);
    });
}

function getTotalPages() { return Math.max(1, Math.ceil(redThemedMovies.length / moviesPerPage)); }

function generatePageNumbers() {
    if (!pageNumbers) return;
    pageNumbers.innerHTML = '';
    const totalPages = getTotalPages();
    const pc = document.querySelector('.pagination-container');
    if (totalPages <= 1) { if (pc) pc.style.display = 'none'; return; }
    if (pc) pc.style.display = 'flex';
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
    if (startPage > 1) {
        pageNumbers.appendChild(createPageButton(1));
        if (startPage > 2) { const e = document.createElement('span'); e.textContent = '...'; e.style.cssText = 'color:currentColor;padding:0 5px;opacity:0.6;'; pageNumbers.appendChild(e); }
    }
    for (let i = startPage; i <= endPage; i++) pageNumbers.appendChild(createPageButton(i));
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) { const e = document.createElement('span'); e.textContent = '...'; e.style.cssText = 'color:currentColor;padding:0 5px;opacity:0.6;'; pageNumbers.appendChild(e); }
        pageNumbers.appendChild(createPageButton(totalPages));
    }
}

function createPageButton(pageNum) {
    const btn = document.createElement('div');
    btn.className = 'page-number' + (pageNum === currentPage ? ' active' : '');
    btn.textContent = pageNum;
    btn.addEventListener('click', () => goToPage(pageNum));
    return btn;
}

function updatePagination() {
    if (!prevBtn || !nextBtn) return;
    const totalPages = getTotalPages();
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
    prevBtn.classList.toggle('disabled', currentPage === 1);
    nextBtn.classList.toggle('disabled', currentPage === totalPages);
}

function goToPage(page) {
    const totalPages = getTotalPages();
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    displayMovies();
    generatePageNumbers();
    updatePagination();
    if (moviesGrid) moviesGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
