/* ============================================================
   AUTH.JS — Leveny
   Drives the color-cycling background + liquid glass button on
   login.html / signup.html.

   Unlike mobile.js's initMobileHome(), this runs on BOTH desktop
   and mobile — the reference design calls for the color-cycle
   everywhere on these two pages, not just on small screens. The
   blurred slideshow backdrop (#authBgBlur) also now renders at
   every screen size — it's just a plain fixed layer, so no
   extra gating is needed here beyond what already exists.

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

        // Function declared later in this same scope (hoisted) —
        // no-ops safely if the desktop split markup isn't on this page.
        applySplitImage(idx);
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
    // document.addEventListener('DOMContentLoaded', () => {
    //     document.body.classList.add('auth-page');
    //     initDarkMode();
    //     buildThemeToggle();
    //     initGenresPanel();
    //     initBottomNavActiveState();
    //     applyAccent(currentIdx);
    //     tick();
    //     initDesktopSplit();
    // });

    /* ---- Fake auth: no backend yet, so submitting either form just
   sends the person straight to the dashboard. ---- */
    function initAuthRedirect() {
        document.querySelectorAll('.auth-split-form form').forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                window.location.href = 'downloads.html';
            });
        });
    }

    /* ============================================================
       DESKTOP SPLIT LOGIN/SIGNUP LAYOUT (≥1025px)
       Drives the portrait slideshow + blurred background using
       the SAME index/timer as the accent cycle above, so the
       image, the accent color, and the homepage stay in lockstep.
       Cancels the "neon" treatment entirely for this panel — no
       color bar, no dots, just crossfading photos. The blurred
       backdrop images (SLIDE_IMAGES -> splitBgEls) are built here
       too and are what mobile sees behind the .auth-card, since
       #authBgBlur's CSS is no longer scoped to desktop-only.
    ============================================================ */
    const SLIDE_IMAGES = [
        { file: '../images/backgrounds/way.jpg',    pos: '78% 35%' }, // Avatar
        { file: '../images/backgrounds/jw.jpg',      pos: '46% 45%' }, // Jurassic World Dominion
        { file: '../images/backgrounds/tg.jpg',      pos: '50% 25%' }, // The Grinch
        { file: '../images/backgrounds/dp.jpg',      pos: '78% 28%' }, // Deadpool
        { file: '../images/backgrounds/batman.jpg',  pos: '50% 42%' }, // Batman: Dark Knight
        { file: '../images/backgrounds/liki.jpg',    pos: '52% 62%' }, // The Lion King
        { file: '../images/backgrounds/bal.jpg',     pos: '28% 45%' }, // Ballerina
    ];

    let splitImgEls = [];
    let splitBgEls = [];

    function buildDesktopSplitImages() {
        const slideshow = document.getElementById('authSlideshow');
        const bgBlur = document.getElementById('authBgBlur');
        if (!bgBlur) return; // no backdrop element on this page at all

        SLIDE_IMAGES.forEach((s, i) => {
            // Portrait slideshow image — only exists on pages that have
            // the desktop split markup (#authSlideshow).
            if (slideshow) {
                const img = document.createElement('img');
                img.className = 'auth-slide-img' + (i === currentIdx ? ' active' : '');
                img.src = s.file;
                img.style.objectPosition = s.pos;
                img.alt = '';
                slideshow.insertBefore(img, slideshow.firstChild);
                splitImgEls.push(img);
            }

            // Full-bleed blurred backdrop — shared by mobile & desktop.
            const bg = document.createElement('img');
            bg.className = 'auth-bg-blur-img' + (i === currentIdx ? ' active' : '');
            bg.src = s.file;
            bg.alt = '';
            bgBlur.appendChild(bg);
            splitBgEls.push(bg);
        });
    }

    function applySplitImage(idx) {
        splitImgEls.forEach((el, i) => el.classList.toggle('active', i === idx));
        splitBgEls.forEach((el, i) => el.classList.toggle('active', i === idx));
    }

    function initDesktopSplit() {
        buildDesktopSplitImages();

        const split = document.getElementById('authSplit');
        if (!split) return; // page doesn't have the split markup — nothing left to wire up

        /* Mode toggle: Login <-> Sign Up, no page reload */
        document.querySelectorAll('.auth-split-switch-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.dataset.target; // 'login' or 'signup'
                split.dataset.mode = target;

                document.querySelectorAll('.auth-split-form').forEach(form => {
                    form.hidden = form.dataset.form !== target;
                });

                document.querySelectorAll('.auth-slide-toptext').forEach(el => {
                    el.classList.toggle('active', el.dataset.form === target);
                });

                document.title = (target === 'signup' ? 'Sign Up' : 'Login') + ' | Leveny';
            });
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('auth-page');
    initDarkMode();
    buildThemeToggle();
    initGenresPanel();
    initBottomNavActiveState();
    applyAccent(currentIdx);
    tick();
    initDesktopSplit();
    initAuthRedirect(); // NEW
    });

})();
