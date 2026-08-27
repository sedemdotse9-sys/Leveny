/* ============================================================
   APP.JS — Leveny
   Drives the sidebar, avatar menu, and shared chrome (theme
   toggle, accent cycle, genres panel, bottom nav) on every
   "after login" page — downloads.html, watch-history.html,
   watch-later.html, donation.html.

   Storage keys used (all intentionally shared with the rest of
   the site so state stays consistent across pages):
     leveny-dark               'true' | 'false'   — dark mode
     leveny-slide-state        sessionStorage      — accent timer
     leveny-sidebar-collapsed  'true' | 'false'   — this page only
     leveny-avatar             data URL of the profile picture
     leveny-username           display name (falls back to Guest)
     leveny-downloads          JSON array of {title, poster, href}

   CHANGELOG (this pass):
   - initBottomNavActiveState: Profile (downloads.html) is now
     explicitly skipped, so the bottom-nav icon never gets the
     accent-colored "active" treatment while browsing profile
     sub-pages. The desktop top-nav link simply never carries
     class="active" in markup anymore, so no JS change was
     needed there.
   ============================================================ */

(function () {

    /* Same accent set as mobile.js / auth.js — keep in sync by
       hand if slides are ever added/reordered. */
    const ACCENTS = [
        { accent: '#00A8FF', glow: 'rgba(0,168,255,0.45)',  dim: 'rgba(0,168,255,0.12)'  },
        { accent: '#FFD600', glow: 'rgba(255,214,0,0.45)',  dim: 'rgba(255,214,0,0.12)'  },
        { accent: '#00FF7F', glow: 'rgba(0,255,127,0.45)',  dim: 'rgba(0,255,127,0.12)'  },
        { accent: '#FF2D2D', glow: 'rgba(255,45,45,0.45)',  dim: 'rgba(255,45,45,0.12)'  },
        { accent: '#A0AEC0', glow: 'rgba(160,174,192,0.40)', dim: 'rgba(160,174,192,0.10)' },
        { accent: '#FF6B00', glow: 'rgba(255,107,0,0.45)',  dim: 'rgba(255,107,0,0.12)'  },
        { accent: '#BF5FFF', glow: 'rgba(191,95,255,0.45)', dim: 'rgba(191,95,255,0.12)' },
    ];

    const INTERVAL = 15000;
    const SLIDE_STATE_KEY = 'leveny-slide-state';

    let currentIdx = 0;
    let timerStart = Date.now();
    let isDark = false;

    const saved = JSON.parse(sessionStorage.getItem(SLIDE_STATE_KEY) || 'null');
    if (saved && saved.idx >= 0 && saved.idx < ACCENTS.length && typeof saved.start === 'number') {
        currentIdx = saved.idx;
        timerStart = saved.start;
    }

    /* ---- Dark mode ---- */
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

    /* ---- Accent cycle (color only — this page has no photos) ---- */
    function applyAccent(idx) {
        const s = ACCENTS[idx];
        const root = document.documentElement;
        root.style.setProperty('--accent', s.accent);
        root.style.setProperty('--accent-glow', s.glow);
        root.style.setProperty('--accent-dim', s.dim);
        sessionStorage.setItem(SLIDE_STATE_KEY, JSON.stringify({ idx, start: timerStart }));
    }

    function tick() {
        const elapsed = Date.now() - timerStart;
        if (elapsed >= INTERVAL) {
            currentIdx = (currentIdx + 1) % ACCENTS.length;
            timerStart = Date.now();
            applyAccent(currentIdx);
        }
        requestAnimationFrame(tick);
    }

    /* ---- Sidebar collapse/expand (mobile only — desktop CSS
       forces it open regardless of this class) ---- */
    function initSidebar() {
        const toggleBtn = document.getElementById('sidebarToggleBtn');
        const toggleIcon = document.getElementById('sidebarToggleIcon');
        if (!toggleBtn) return;

        const stored = localStorage.getItem('leveny-sidebar-collapsed');
        let collapsed = stored === 'true'; // defaults to false (open) when unset

        function apply() {
            document.body.classList.toggle('sidebar-collapsed', collapsed);
            toggleBtn.setAttribute('aria-expanded', String(!collapsed));
            if (toggleIcon) {
                toggleIcon.className = collapsed ? 'fa-solid fa-angles-right' : 'fa-solid fa-bars';
            }
        }

        apply();

        toggleBtn.addEventListener('click', () => {
            collapsed = !collapsed;
            localStorage.setItem('leveny-sidebar-collapsed', collapsed);
            apply();
        });
    }

    /* ---- Username ---- */
    function initUsername() {
        const el = document.getElementById('sidebarUsername');
        if (!el) return;
        const name = localStorage.getItem('leveny-username');
        el.textContent = name && name.trim() ? name.trim() : 'Guest';
    }

    /* ---- Avatar: add / delete profile picture ---- */
    function initAvatar() {
        const avatarBtn = document.getElementById('sidebarAvatarBtn');
        const avatarEl = document.getElementById('sidebarAvatar');
        const menu = document.getElementById('avatarMenu');
        const addBtn = document.getElementById('avatarAddBtn');
        const deleteBtn = document.getElementById('avatarDeleteBtn');
        const fileInput = document.getElementById('avatarFileInput');
        if (!avatarBtn || !avatarEl || !menu) return;

        function render() {
            const saved = localStorage.getItem('leveny-avatar');
            avatarEl.innerHTML = saved
                ? `<img src="${saved}" alt="Profile picture">`
                : `<i class="fa-regular fa-user"></i>`;

            // Only the option that's actually usable is shown.
            addBtn.hidden = !!saved;
            deleteBtn.hidden = !saved;
        }

        function closeMenu() {
            menu.hidden = true;
            avatarBtn.setAttribute('aria-expanded', 'false');
        }

        avatarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const willOpen = menu.hidden;
            menu.hidden = !willOpen;
            avatarBtn.setAttribute('aria-expanded', String(willOpen));
        });

        document.addEventListener('click', (e) => {
            if (!menu.hidden && !e.target.closest('.avatar-wrap')) closeMenu();
        });

        addBtn.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', () => {
            const file = fileInput.files && fileInput.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                localStorage.setItem('leveny-avatar', reader.result);
                render();
                closeMenu();
            };
            reader.readAsDataURL(file);
            fileInput.value = '';
        });

        deleteBtn.addEventListener('click', () => {
            localStorage.removeItem('leveny-avatar');
            render();
            closeMenu();
        });

        render();
    }

    /* ---- Downloads grid (empty state today; renders real data
       the moment leveny-downloads has entries). No-op on pages
       that don't have #downloadsEmpty/#downloadsGrid, e.g.
       watch-history.html, watch-later.html, donation.html. ---- */
    function initDownloads() {
        const empty = document.getElementById('downloadsEmpty');
        const grid = document.getElementById('downloadsGrid');
        if (!empty || !grid) return;

        let items = [];
        try {
            items = JSON.parse(localStorage.getItem('leveny-downloads') || '[]');
        } catch (e) {
            items = [];
        }

        if (!items.length) {
            empty.hidden = false;
            grid.hidden = true;
            return;
        }

        empty.hidden = true;
        grid.hidden = false;
        grid.innerHTML = items.map(item => `
            <a class="dl-card" href="${item.href || '#'}">
                <img class="dl-card-img" src="${item.poster}" alt="${item.title}" loading="lazy">
                <div class="dl-card-title">${item.title}</div>
            </a>
        `).join('');
    }

    /* ---- Genres panel (same behavior as every other page) ---- */
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
            const href = item.getAttribute('href');
            // Profile is never auto-highlighted — it's an account
            // entry point, not a "current section" indicator.
            if (!href || href.includes('downloads.html')) return;
            if (href.includes(currentFile)) {
                document.querySelectorAll('.mob-nav-item').forEach(n => n.classList.remove('active'));
                item.classList.add('active');
            }
        });
    }

    /* ---- Init ---- */
    document.addEventListener('DOMContentLoaded', () => {
        initDarkMode();
        buildThemeToggle();
        applyAccent(currentIdx);
        tick();
        initSidebar();
        initUsername();
        initAvatar();
        initDownloads();
        initGenresPanel();
        initBottomNavActiveState();
    });

})();
