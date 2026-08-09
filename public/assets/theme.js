/* ============================================================
   LEVENY THEME TOGGLE
   Dark mode is the default. Uses the browser's native View
   Transitions API for a smooth crossfade between themes when
   supported, and falls back to plain CSS transitions otherwise.
   The choice is remembered for this tab (sessionStorage) so it
   stays consistent as you move between login and the dashboard.
============================================================ */
(function () {
  const root = document.documentElement;
  const STORAGE_KEY = 'leveny-theme';

  function getStoredTheme() {
    try {
      return sessionStorage.getItem(STORAGE_KEY);
    } catch (err) {
      return null;
    }
  }

  function storeTheme(theme) {
    try {
      sessionStorage.setItem(STORAGE_KEY, theme);
    } catch (err) {
      /* ignore */
    }
  }

  let theme = getStoredTheme() || 'dark';

  function paintTheme() {
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme');
    }
    document.querySelectorAll('[data-theme-icon]').forEach((el) => {
      el.textContent = theme === 'light' ? '\u2600\ufe0f' : '\ud83c\udf19'; // sun / moon
    });
    document.querySelectorAll('.theme-toggle').forEach((btn) => {
      btn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
    });
  }

  function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
    storeTheme(theme);

    if (document.startViewTransition) {
      document.startViewTransition(() => paintTheme());
    } else {
      paintTheme();
    }
  }

  // paint immediately (no transition) on first load
  paintTheme();

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.theme-toggle').forEach((btn) => {
      btn.addEventListener('click', toggleTheme);
    });
  });

  window.LevenyTheme = { toggleTheme, paintTheme };
})();
