/* ============================================================
   AUTH.JS — Leveny
   Drives the color-cycling background + liquid glass button on
   login.html / signup.html.

   Unlike mobile.js's initMobileHome(), this runs on BOTH desktop
   and mobile — the reference design calls for the color-cycle
   everywhere on these two pages, not just on small screens.

   Stays in sync with the homepage: it reads the same
   'leveny-slide-state' sessionStorage key that mobile.js writes,
   so if a person arrives here from the homepage in the same tab,
   the accent picks up mid-cycle instead of resetting to slide 0.
============================================================ */

(function () {

    /* Same accent set as mobile.js's SLIDES array (colors only —
       this page doesn't need titles/hrefs/images). Keep this in
       sync with mobile.js by hand if you ever add/reorder slides
       there. */
    const ACCENTS = [
        { accent: '#00A8FF', softBg: '#c8e8ff', glow: 'rgba(0,168,255,0.45)',  dim: 'rgba(0,168,255,0.12)'  },
        { accent: '#FFD600', softBg: '#fff4b0', glow: 'rgba(255,214,0,0.45)',  dim: 'rgba(255,214,0,0.12)'  },
        { accent: '#00FF7F', softBg: '#b6ffd8', glow: 'rgba(0,255,127,0.45)', dim: 'rgba(0,255,127,0.12)'  },
        { accent: '#FF2D2D', softBg: '#ffc4c4', glow: 'rgba(255,45,45,0.45)', dim: 'rgba(255,45,45,0.12)'  },
        { accent: '#A0AEC0', softBg: '#dce2ea', glow: 'rgba(160,174,192,0.40)', dim: 'rgba(160,174,192,0.10)' },
        { accent: '#FF6B00', softBg: '#ffd9b0', glow: 'rgba(255,107,0,0.45)', dim: 'rgba(255,107,0,0.12)'  },
        { accent: '#BF5FFF', softBg: '#e8c8ff', glow: 'rgba(191,95,255,0.45)', dim: 'rgba(191,95,255,0.12)' },
    ];

    const INTERVAL = 15000;
    const SLIDE_STATE_KEY = 'leveny-slide-state';

    let currentIdx = 0;
    let timerStart = Date.now();
    let isDark = false;

    /* ---- Pick up homepage's in-progress cycle, if any ---- */
    const saved = JSON.parse(sessionStorage.getItem(SLIDE_STATE_KEY) || 'null');
    if (saved && saved.idx >= 0 && saved.idx < ACCENTS.length && typeof saved.start === 'number') {
        currentIdx = saved.idx;
        timerStart = saved.start;
    }

    /* ---- Dark mode (same flag the rest of the site uses) ---- */
    function initDarkMode() {
        const stored = localStorage.getItem('leveny-dark');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        isDark = stored !== null ? stored === 'true' : prefersDark;
        applyDarkClass();
    }

    function applyDarkClass() {
        document.body.classList.toggle('dark-mode', isDark);
        document.documentElement.classList.toggle('dark', isDark);
        const btn = document.getElementById('mobileThemeToggle');
        if (btn) btn.textContent = isDark ? '☀️' : '🌙';
    }

    /* ---- Apply the current slide's accent to CSS variables ---- */
    function applyAccent(idx) {
        const s = ACCENTS[idx];
        const root = document.documentElement;
        root.style.setProperty('--accent', s.accent);
        root.style.setProperty('--accent-glow', s.glow);
        root.style.setProperty('--accent-dim', s.dim);
        root.style.setProperty('--accent-soft', s.softBg);

        sessionStorage.setItem(SLIDE_STATE_KEY, JSON.stringify({ idx, start: timerStart }));
    }

    /* ---- Advance in lockstep with the homepage's 15s interval ---- */
    function tick() {
        const elapsed = Date.now() - timerStart;
        if (elapsed >= INTERVAL) {
            currentIdx = (currentIdx + 1) % ACCENTS.length;
            timerStart = Date.now();
            applyAccent(currentIdx);
        }
        requestAnimationFrame(tick);
    }

    /* ---- Theme toggle button (mirrors mobile.js's behavior) ---- */
    function buildThemeToggle() {
        const header = document.getElementById('mobileHeader');
        if (!header || document.getElementById('mobileThemeToggle')) return;

        const btn = document.createElement('button');
        btn.id = 'mobileThemeToggle';
        btn.textContent = isDark ? '☀️' : '🌙';
        btn.setAttribute('aria-label', 'Toggle dark mode');
        btn.addEventListener('click', () => {
            isDark = !isDark;
            localStorage.setItem('leveny-dark', isDark);
            applyDarkClass();
        });

        const profileBtn = header.querySelector('.mobile-profile-btn');
        if (profileBtn) header.insertBefore(btn, profileBtn);
        else header.appendChild(btn);
    }

    /* ---- Genres panel open/close (same behavior as mobile.js) ---- */
    function initGenresPanel() {
        const genresBtn = document.getElementById('mobGenresBtn');
        const genresPanel = document.getElementById('mobileGenresPanel');
        const genresBackdrop = document.getElementById('genresPanelBackdrop');
        if (!genresBtn || !genresPanel || !genresBackdrop) return;

        const open = () => { genresPanel.classList.add('open'); genresBackdrop.classList.add('open'); document.body.style.overflow = 'hidden'; genresBtn.classList.add('active'); };
        const close = () => { genresPanel.classList.remove('open'); genresBackdrop.classList.remove('open'); document.body.style.overflow = ''; genresBtn.classList.remove('active'); };

        genresBtn.addEventListener('click', () => genresPanel.classList.contains('open') ? close() : open());
        genresBackdrop.addEventListener('click', close);
    }

    /* ---- Bottom nav active state ---- */
    function initBottomNavActiveState() {
        const currentFile = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.mob-nav-item').forEach(item => {
            if (item.getAttribute('href')?.includes(currentFile)) {
                document.querySelectorAll('.mob-nav-item').forEach(n => n.classList.remove('active'));
                item.classList.add('active');
            }
        });
    }

    /* ---- Init ---- */
    document.addEventListener('DOMContentLoaded', () => {
        document.body.classList.add('auth-page');
        initDarkMode();
        buildThemeToggle();
        initGenresPanel();
        initBottomNavActiveState();
        applyAccent(currentIdx);
        tick();
    });

})();
