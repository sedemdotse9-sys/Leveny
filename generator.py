# -*- coding: utf-8 -*-
"""
generator.py — Leveny movie page generator

Builds a new movie's HTML page + page-specific CSS file (Pattern B:
shared css/style.css + one page CSS file, no inline <style> block),
and appends a matching entry to js/movies.js.

Structure is genre-agnostic — the only things that vary by genre are
the accent color and the display label, both pulled from GENRE_META
below (sourced from the site's own shared genre dropdown menu).
"""

import re
import os

# ----------------------------------------------------------------------
# Genre -> (display label, accent hex) — taken directly from the
# shared genre dropdown markup used across every page on the site.
# ----------------------------------------------------------------------
GENRE_META = {
    "action":    {"label": "Action",    "accent": "#3498db"},
    "superhero": {"label": "Superhero", "accent": "#e74c3c"},
    "animation": {"label": "Animation", "accent": "#f39c12"},
    "fantasy":   {"label": "Fantasy",   "accent": "#9b59b6"},
    "scifi":     {"label": "Sci-Fi",    "accent": "#1abc9c"},
    "family":    {"label": "Family",    "accent": "#2ecc71"},
    "thriller":  {"label": "Thriller",  "accent": "#95a5a6"},
    "horror":    {"label": "Horror",    "accent": "#e74c3c"},
    "musical":   {"label": "Musical",   "accent": "#e84393"},
    "romance":   {"label": "Romance",   "accent": "#ff4d6d"},
}

GENRE_ORDER = ["action", "superhero", "animation", "fantasy", "scifi",
               "family", "thriller", "horror", "musical", "romance"]


# ----------------------------------------------------------------------
# CSS filename auto-increment
# ----------------------------------------------------------------------
def next_css_filename(css_dir):
    """
    Scans css_dir for files named style<N>.css (ignoring .bak files and
    non-numbered files like style.css) and returns 'style<N+1>.css'.
    """
    highest = 0
    if os.path.isdir(css_dir):
        for name in os.listdir(css_dir):
            match = re.fullmatch(r"style(\d+)\.css", name)
            if match:
                highest = max(highest, int(match.group(1)))
    return f"style{highest + 1}.css"


def slugify_filename(title):
    """
    'Around The World In 80 Days' -> 'around_the_world_in_80_days'
    Mirrors the site's existing filename convention: lowercase, runs of
    non [a-z0-9'] characters collapse to a single underscore, apostrophes
    are preserved (matching e.g. the_devil's_mouth_movie.html).
    """
    slug = title.lower()
    slug = re.sub(r"[^a-z0-9']+", "_", slug)
    slug = slug.strip("_")
    return slug


# ----------------------------------------------------------------------
# Color helpers
# ----------------------------------------------------------------------
def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i:i + 2], 16) for i in (0, 2, 4))


def rgba(hex_color, alpha):
    r, g, b = hex_to_rgb(hex_color)
    return f"rgba({r},{g},{b},{alpha})"


def soft_tint(hex_color, mix_with_white=0.85):
    """Light background tint used for the mobile light-mode body color."""
    r, g, b = hex_to_rgb(hex_color)
    r = round(r + (255 - r) * mix_with_white)
    g = round(g + (255 - g) * mix_with_white)
    b = round(b + (255 - b) * mix_with_white)
    return f"#{r:02x}{g:02x}{b:02x}"


# ----------------------------------------------------------------------
# HTML TEMPLATE (Pattern B — mirrors Atlas King / Camp Rock 3 /
# The Devil's Mouth structure exactly)
# ----------------------------------------------------------------------
HTML_TEMPLATE = """<!DOCTYPE html>

<html lang="en">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0, viewport-fit=cover" name="viewport"/>
<title>__TITLE__ | Leveny</title>
<link href="../css/style.css" rel="stylesheet"/>
<link href="../css/__CSS_FILENAME__" rel="stylesheet"/>
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&amp;display=swap" rel="stylesheet"/>
<link href="/favicon/favicon-96x96.png" rel="icon" sizes="96x96" type="image/png"/>
<link href="/favicon/favicon.svg" rel="icon" type="image/svg+xml"/>
<link href="/favicon/favicon.ico" rel="shortcut icon"/>
<link href="/favicon/apple-touch-icon.png" rel="apple-touch-icon" sizes="180x180"/>
<link href="/favicon/site.webmanifest" rel="manifest"/>
<link href="https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;600;700&amp;display=swap" rel="stylesheet"/></head>
<body data-current-movie="__HTML_FILENAME__">
<!-- ============================================================
      DESKTOP LAYOUT
  ============================================================ -->
<header>
<nav class="nav_bar">
<h2 class="logo">Leveny</h2>
<ul class="nav_links">
<a href="../index.html"><i class="fas fa-home"></i>Home</a>
<li class="shared-dropdown">
<a class="genre-link" href="../genres.html">
<i class="fa-solid fa-compact-disc"></i>Genres
                </a>
<span class="dropdown-arrow" id="genreDropdownArrow">
<i class="fas fa-chevron-down"></i>
</span>
<div class="dropdown-content" id="genreDropdown">
<a href="../genres.html#action"><i class="fas fa-explosion" style="color:#3498db;"></i> Action &amp; Adventure</a>
<a href="../genres.html#superhero"><i class="fas fa-mask" style="color:#e74c3c;"></i> Superhero</a>
<a href="../genres.html#animation"><i class="fas fa-dragon" style="color:#f39c12;"></i> Animation</a>
<a href="../genres.html#fantasy"><i class="fas fa-hat-wizard" style="color:#9b59b6;"></i> Fantasy</a>
<a href="../genres.html#scifi"><i class="fas fa-robot" style="color:#1abc9c;"></i> Sci-Fi</a>
<a href="../genres.html#family"><i class="fas fa-child" style="color:#2ecc71;"></i> Family</a>
<a href="../genres.html#thriller"><i class="fas fa-search" style="color:#95a5a6;"></i> Thriller</a>
<a href="../genres.html#horror"><i class="fas fa-ghost" style="color:#e74c3c;"></i> Horror</a>
<a href="../genres.html#musical"><i class="fas fa-music" style="color:#e84393;"></i> Musical</a>
<a href="../genres.html#romance"><i class="fas fa-heart" style="color:#ff4d6d;"></i> Romance</a>
</div>
</li>
<a href="../Profile.html"><i class="fa-regular fa-user"></i>Profile</a>
<a href="../Movie_Request.html"><i class="fas fa-envelope"></i>Request</a>
</ul>
</nav>
<hr/>
</header>
<main class="movie-page">
<section class="video-section">
<div class="frost-wrap" id="frostWrap">
<!-- IMDb ID: __IMDB_ID__ -->
<iframe allow="autoplay; fullscreen" allowfullscreen="" frameborder="0" height="450" src="https://vidsrc.me/embed/movie/__IMDB_ID__" width="100%">
</iframe>
<div class="frost-click" id="frostClick"></div>
</div>
<button class="download-btn">
<a download="" href="__DOWNLOAD_LINK__">
<i class="fa fa-download"></i> Download
        </a>
</button>
<a class="broken-link" data-movie="__TITLE_UPPER__" href="#">
<i class="fas fa-triangle-exclamation"></i> Broken download link?
    </a>
</section>
<section class="details-section">
<h3 class="movie-title">__TITLE_UPPER__</h3>
<div class="search-box">
<input id="searchInput" placeholder="Search movies..." type="text"/>
<button><i class="fas fa-search"></i></button>
<div class="search-dropdown" id="searchDropdown"></div>
</div>
<p class="info">
        __YEAR__  |  <span>__RUNTIME__mins 00secs</span>  |  __GENRE_LABEL__
      </p>
<p class="summary">
        __SUMMARY__
      </p>
<div class="related-movies"></div>

</section>
</main>
<!-- ============================================================
      MOBILE LAYOUT
  ============================================================ -->
<div id="mobHeader">
<span class="mob-logo">Leveny</span>
<button aria-label="Toggle dark mode" id="mobThemeToggle">🌙</button>
<a aria-label="Profile" href="../Profile.html" id="mobProfileBtn">
<i class="fa-regular fa-user"></i>
</a>
</div>
<div id="mobMovieSearchBar">
<i class="fas fa-search"></i>
<input id="mobMovieSearchInput" placeholder="Search movies..." type="text"/>
<div id="mobMovieSearchDrop"></div>
</div>
<div id="mobPage">
<div id="mobVideoWrap">
<div id="mobFrostWrap">
<!-- IMDb ID: __IMDB_ID__ -->
<iframe allow="autoplay; fullscreen; picture-in-picture" allowfullscreen="" frameborder="0" height="240" src="https://vidsrc.me/embed/movie/__IMDB_ID__" width="100%">
</iframe>
<div id="mobFrostClick"></div>
</div>
</div>
<a download="" href="__DOWNLOAD_LINK__" id="mobDownloadBtn">
<i class="fas fa-download"></i> Download Movie
    </a>
<a class="mob-broken-link" data-movie="__TITLE_UPPER__" href="#">
<i class="fas fa-triangle-exclamation"></i> Broken download link?
    </a>
<div id="mobMovieInfo">
<div id="mobMovieTitle">__TITLE_UPPER__</div>
<div id="mobMovieMeta">
<span>__YEAR__</span>
<span class="mob-meta-badge">__GENRE_LABEL__</span>
<span>__RUNTIME__ mins</span>
</div>
<p id="mobMovieSummary">
        __SUMMARY__
      </p>
</div>
<div id="mobRelatedLabel">You Might Also Like</div>
<div id="mobRelatedGrid"></div>
<div id="mobFooter">
<a href="../disclaimer.html">Disclaimer!</a>
</div>
</div>
<nav id="mobBottomNav">
<a class="mob-movie-nav-item" href="../index.html">
<i class="fas fa-home"></i><span>Home</span>
</a>
<button class="mob-movie-nav-item" id="mobGenresBtn">
<i class="fa-solid fa-compact-disc"></i><span>Genres</span>
</button>
<a class="mob-movie-nav-item" href="../Movie_Request.html">
<i class="fas fa-envelope"></i><span>Request</span>
</a>
<a class="mob-movie-nav-item" href="../Profile.html">
<i class="fa-regular fa-user"></i><span>Profile</span>
</a>
</nav>
<!-- GENRES PANEL BACKDROP -->
<div id="mobGenreBackdrop" style="
    display:none; position:fixed; inset:0; z-index:998;
    background:rgba(0,0,0,0.5); backdrop-filter:blur(4px);
  "></div>
<!-- GENRES SLIDE-UP PANEL -->
<div id="mobGenrePanel" style="
    position:fixed; bottom:0; left:0; right:0; z-index:999;
    background:rgba(18,18,18,0.97); border-radius:20px 20px 0 0;
    padding:24px 16px 48px; transform:translateY(100%); bottom:35px;
    transition:transform 0.35s cubic-bezier(0.4,0,0.2,1);
    border-top:1px solid var(--mob-accent-dim);
    ">
<h3 style='font-family: "Roboto Slab", Rockwell, sans-serif;color:#fff;margin:0 0 18px;font-size:17px;'>Browse Genres</h3>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
<a class="mob-genre-pill" href="../genre-results.html?genre=action"><i class="fas fa-explosion" style="color:#3498db;"></i><span>Action</span></a>
<a class="mob-genre-pill" href="../genre-results.html?genre=superhero"><i class="fas fa-mask" style="color:#e74c3c;"></i><span>Superhero</span></a>
<a class="mob-genre-pill" href="../genre-results.html?genre=animation"><i class="fas fa-dragon" style="color:#f39c12;"></i><span>Animation</span></a>
<a class="mob-genre-pill" href="../genre-results.html?genre=fantasy"><i class="fas fa-hat-wizard" style="color:#9b59b6;"></i><span>Fantasy</span></a>
<a class="mob-genre-pill" href="../genre-results.html?genre=scifi"><i class="fas fa-robot" style="color:#1abc9c;"></i><span>Sci-Fi</span></a>
<a class="mob-genre-pill" href="../genre-results.html?genre=family"><i class="fas fa-child" style="color:#2ecc71;"></i><span>Family</span></a>
<a class="mob-genre-pill" href="../genre-results.html?genre=thriller"><i class="fas fa-search" style="color:#95a5a6;"></i><span>Thriller</span></a>
<a class="mob-genre-pill" href="../genre-results.html?genre=horror"><i class="fas fa-ghost" style="color:#e74c3c;"></i><span>Horror</span></a>
<a class="mob-genre-pill" href="../genre-results.html?genre=musical"><i class="fas fa-music" style="color:#e84393;"></i><span>Musical</span></a>
<a class="mob-genre-pill" href="../genre-results.html?genre=romance"><i class="fas fa-heart" style="color:#ff4d6d;"></i><span>Romance</span></a>
</div>
</div>
<!-- ============================================================
      SCRIPTS
  ============================================================ -->
<script src="../js/movies.js"></script>
<script src="../js/related.js"></script>
<script src="../js/script.js"></script>
<script src="../js/search.js"></script>
<script>
function __isMobileViewport() {
  return window.innerWidth <= 1024 ||
    (window.matchMedia('(orientation: landscape)').matches &&
     window.innerHeight <= 1024 &&
     window.matchMedia('(pointer: coarse)').matches);
}

    (function () {
      if (!__isMobileViewport()) return;

      const btn      = document.getElementById('mobGenresBtn');
      const panel    = document.getElementById('mobGenrePanel');
      const backdrop = document.getElementById('mobGenreBackdrop');

      function openPanel() {
        panel.style.transform        = 'translateY(0)';
        backdrop.style.display       = 'block';
        document.body.style.overflow = 'hidden';
      }

      function closePanel() {
        panel.style.transform        = 'translateY(100%)';
        backdrop.style.display       = 'none';
        document.body.style.overflow = '';
      }

      btn?.addEventListener('click', openPanel);
      backdrop?.addEventListener('click', closePanel);
    })();
  </script>
<script>
    const iframe = document.querySelector('.video-section iframe');
    iframe?.addEventListener('click', function () {
      this.classList.add('unblurred');
    });
  </script>
<footer class="copyright">
<a href="../disclaimer.html">Disclaimer!</a>
</footer>
<script>
    document.getElementById('frostClick')?.addEventListener('click', function () {
      document.getElementById('frostWrap').classList.add('unblurred');
    });
  </script>
<script>
    document.getElementById('mobFrostClick')?.addEventListener('click', function () {
      document.getElementById('mobFrostWrap').classList.add('unblurred');
    });
  </script>
<!-- broken-link-report-script (Formspree version) -->
<script>
  (function () {
    const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xgoyjjgj';

    document.querySelectorAll('.broken-link, .mob-broken-link').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        if (link.classList.contains('reported') || link.classList.contains('sending')) return;

        const movie = link.dataset.movie || document.title;
        link.classList.add('sending');
        link.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Reporting...';

        const data = new FormData();

        data.append('_subject', '🚨 Broken Download Link Report');
        data.append('requestType', 'broken-link');
        data.append('movieTitle', movie);
        data.append(
          'message',
          `A user reported a broken download link.

        Movie: ${movie}
        Page: ${window.location.href}
        Time: ${new Date().toLocaleString()}`
        );
        data.append('reportType', 'broken-download-link');
        data.append('movieTitle', movie);

        fetch(FORMSPREE_ENDPOINT, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: data
        })
        .then(function (response) {
          link.classList.remove('sending');
          if (response.ok) {
            link.classList.add('reported');
            link.innerHTML = '<i class="fas fa-circle-check"></i> Thanks, reported!';
          } else {
            link.innerHTML = '<i class="fas fa-triangle-exclamation"></i> Failed, try again?';
          }
        })
        .catch(function () {
          link.classList.remove('sending');
          link.innerHTML = '<i class="fas fa-triangle-exclamation"></i> Failed, try again?';
        });
      });
    });
  })();
</script>
</body>
</html>
"""


# ----------------------------------------------------------------------
# CSS TEMPLATE (Pattern B page-specific stylesheet — mirrors
# style95.css / style82.css / style63.css structure exactly)
# ----------------------------------------------------------------------
CSS_TEMPLATE = """@import url('https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;600;700&display=swap');
/* ============================================================
   __CSS_FILENAME__ — __TITLE__ | Leveny
   Page-specific stylesheet, same structure used across the
   Leveny movie pages. Genre: __GENRE_LABEL__ | Accent: __ACCENT__
============================================================ */

    :root {
      --mob-accent: __ACCENT__;
      --mob-accent-glow: __ACCENT_GLOW__;
      --mob-accent-glow-light: __ACCENT_GLOW_LIGHT__;
      --mob-accent-dim: __ACCENT_DIM__;
      --mob-accent-dim-light: __ACCENT_DIM_LIGHT__;
      --mob-accent-soft: __SOFT_BG__;
    }

    /* ---- DESKTOP background image ---- */
    body {
      font-family: Verdana, Geneva, Tahoma, sans-serif;
      background: url(../__BACKGROUND_PATH__) center/cover fixed no-repeat;
      color: #f5f5f5;
      position: relative;
    }

    /* ---- Hide ALL mobile elements on desktop ---- */
    @media screen and (min-width: 1025px) and (not ((orientation: landscape) and (max-height: 1024px) and (pointer: coarse))) {
      #mobHeader,
      #mobMovieSearchBar,
      #mobPage,
      #mobBottomNav { display: none !important;
        padding: 0 4px env(safe-area-inset-bottom, 8px);
    }
    }

    @media screen and (max-width: 1024px),
     screen and (orientation: landscape) and (max-height: 1024px) and (pointer: coarse) {

      header,
      .movie-page,
      footer { display: none !important; }

      body {
        background-color: __SOFT_BG__ !important;
        color: #111;
        overflow-y: auto;
        padding: 0;
        margin: 0;
        transition: background-color 1s ease, color 0.4s ease;
        background: none !important;
      }

      body::after {
      content: '';
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      background:
        radial-gradient(ellipse 110% 60% at 50% -8%,
          __ACCENT_GLOW_55__ 0%, transparent 65%),
        radial-gradient(ellipse 70% 40% at 80% 90%,
          __ACCENT_GLOW_35__ 0%, transparent 60%),
        radial-gradient(ellipse 70% 40% at 20% 90%,
          __ACCENT_GLOW_35__ 0%, transparent 60%),
        linear-gradient(175deg,
          __ACCENT_GLOW_28__ 0%,
          __ACCENT_GLOW_18__ 40%,
          transparent 75%);
    }

      body.dark-mode {
        background-color: #0D0D0D !important;
        color: #f0f0f0;
      }

      body.dark-mode::after {
        background:
          radial-gradient(ellipse 110% 60% at 50% -8%,
            var(--mob-accent-glow) 0%, transparent 65%),
          radial-gradient(ellipse 70% 40% at 80% 90%,
            var(--mob-accent-glow-light) 0%, transparent 60%),
          linear-gradient(175deg,
            var(--mob-accent-dim-light) 0%,
            var(--mob-accent-dim) 40%,
            transparent 75%);
        transition: background 1s ease;
      }

      #mobHeader,
      #mobMovieSearchBar,
      #mobPage,
      #mobBottomNav {
        position: relative;
        z-index: 1;
        padding: 0 4px env(safe-area-inset-bottom, 8px);
    }

      #mobHeader {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px 10px;
        position: sticky;
        top: 0;
        z-index: 999;
        gap: 10px;
        background: rgba(255,255,255,0.30);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-bottom: 1px solid var(--mob-accent-dim-light);
        box-shadow: 0 2px 20px var(--mob-accent-dim-light);
        transition: background 0.4s, border-color 1s, box-shadow 1s;
      }

      #mobHeader::before {
        content: '';
        position: absolute;
        inset: -20px 0;
        z-index: -1;
        background: radial-gradient(ellipse 100% 120% at 50% 0%, __ACCENT_GLOW_35__ 0%, transparent 70%);
        pointer-events: none;
      }

      body.dark-mode #mobHeader {
        background: rgba(13,13,13,0.70);
        border-bottom: 1px solid var(--mob-accent-dim);
        box-shadow: 0 1px 0 0 var(--mob-accent-dim),
                    0 4px 24px rgba(0,0,0,0.6);
      }

      #mobHeader .mob-logo {
        font-family:  'Bebas Neue', sans-serif;
        font-size: 26px;
        font-weight: 700;
        letter-spacing: 4px;
        color: #111;
        flex: 1;
        text-decoration: none;
        text-shadow: 0 0 14px var(--mob-accent-glow-light);
        transition: color 0.4s, text-shadow 1s;
      }

      body.dark-mode #mobHeader .mob-logo {
        color: #fff;
        text-shadow: 0 0 18px var(--mob-accent-glow);
      }

      #mobThemeToggle {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        border: 1px solid var(--mob-accent);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 17px;
        flex-shrink: 0;
        transition: background 1s ease, box-shadow 1s ease, transform 0.25s ease;
        background: rgba(255,255,255,0.35);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        box-shadow: 0 0 10px var(--mob-accent-glow-light),
                    inset 0 0 6px var(--mob-accent-dim);
        color: #333;
      }

      body.dark-mode #mobThemeToggle {
        background: var(--mob-accent-dim);
        box-shadow: 0 0 14px var(--mob-accent-glow);
        color: var(--mob-accent);
      }

      #mobThemeToggle:active { transform: scale(0.88) rotate(20deg); }

      #mobProfileBtn {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        text-decoration: none;
        font-size: 15px;
        flex-shrink: 0;
        background: transparent;
        color: var(--mob-accent);
        border: 1px solid var(--mob-accent);
        box-shadow: 0 0 10px var(--mob-accent-glow-light);
        transition: background 1s ease, box-shadow 1s ease, color 0.4s, border-color 1s;
      }

      body.dark-mode #mobProfileBtn {
        background: var(--mob-accent-dim);
        box-shadow: 0 0 10px var(--mob-accent-glow);
      }

      #mobMovieSearchBar {
        display: flex;
        align-items: center;
        border-radius: 24px;
        padding: 10px 16px;
        margin: 10px 12px 12px;
        gap: 10px;
        position: relative;
        z-index: 950;
        background: rgba(255,255,255,0.30);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid var(--mob-accent-dim-light);
        box-shadow: 0 0 12px var(--mob-accent-dim-light),
                    inset 0 0 8px var(--mob-accent-dim);
        transition: background 0.4s, border-color 1s, box-shadow 1s;
      }

      body.dark-mode #mobMovieSearchBar {
        background: rgba(255,255,255,0.05);
        border: 1px solid var(--mob-accent-dim);
        box-shadow: 0 0 0 1px var(--mob-accent-dim) inset,
                    0 0 12px var(--mob-accent-dim);
      }

      #mobMovieSearchBar i { color: var(--mob-accent); font-size: 14px; flex-shrink: 0; transition: color 1s; }

      #mobMovieSearchInput {
        border: none;
        background: transparent;
        outline: none;
        font-size: 16px;
        color: #111;
        width: 100%;
        font-family: "Roboto Slab", Rockwell, sans-serif;
      }

      body.dark-mode #mobMovieSearchInput { color: #f0f0f0; }
      #mobMovieSearchInput::placeholder { color: #666; }
      body.dark-mode #mobMovieSearchInput::placeholder { color: #555; }

      #mobMovieSearchDrop {
        display: none;
        position: absolute;
        top: calc(100% + 6px);
        left: 0;
        right: 0;
        border-radius: 16px;
        z-index: 960;
        overflow: hidden;
        max-height: 280px;
        overflow-y: auto;
        background: rgba(255,255,255,0.98);
        backdrop-filter: blur(20px);
        border: 1px solid var(--mob-accent-dim-light);
        box-shadow: 0 8px 30px var(--mob-accent-dim-light);
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: var(--mob-accent, __ACCENT__) transparent;
}
#mobMovieSearchDrop::-webkit-scrollbar {
  width: 8px;
}
#mobMovieSearchDrop::-webkit-scrollbar-track {
  background: transparent;
  margin: 8px 0;
}
#mobMovieSearchDrop::-webkit-scrollbar-thumb {
  background: var(--mob-accent, __ACCENT__);
  border-radius: 8px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

      body.dark-mode #mobMovieSearchDrop {
        background: rgba(18,18,18,0.97);
        border: 1px solid var(--mob-accent-dim);
        box-shadow: 0 8px 30px rgba(0,0,0,0.7);
      }

      .mob-search-drop-item {
        padding: 12px 16px;
        color: #111;
        font-size: 14px;
        font-family: "Roboto Slab", Rockwell, sans-serif;
        border-bottom: 1px solid var(--mob-accent-dim);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      body.dark-mode .mob-search-drop-item { color: #ddd; border-bottom-color: rgba(255,255,255,0.06); }
      .mob-search-drop-item:last-child { border-bottom: none; }
      .mob-search-drop-item:active { background: var(--mob-accent-dim); }
      .mob-search-drop-item i { color: var(--mob-accent); font-size: 12px; }

      #mobPage {
        padding: 14px 12px 76px;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      #mobVideoWrap{
        border-radius: 20px;
        overflow: hidden;
        background: #000;
        box-shadow: 0 0 0 1.5px var(--mob-accent),
                    0 0 20px var(--mob-accent-glow-light),
                    0 8px 32px rgba(0,0,0,0.18);
        transition: box-shadow 1s ease;
      }

      #mobVideoWrap iframe {
        width: 100%;
        display: block;
        height: 240px;
        border: none;
      }

      body.dark-mode #mobVideoWrap {
        box-shadow: 0 0 0 1.5px var(--mob-accent),
                    0 0 24px var(--mob-accent-glow),
                    0 8px 40px rgba(0,0,0,0.55);
      }

      #mobVideoWrap video {
        width: 100%;
        display: block;
        height: 240px;
        object-fit: contain;
        background: #000;
      }

      #mobDownloadBtn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 13px;
        border-radius: 20px;
        text-decoration: none;
        font-family: "Roboto Slab", Rockwell, sans-serif;
        font-size: 15px;
        font-weight: 700;
        transition: transform 0.15s, box-shadow 1s ease, border-color 1s, color 1s;
        background: rgba(255,255,255,0.30);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border: 1px solid var(--mob-accent);
        color: var(--mob-accent);
        box-shadow: 0 0 14px var(--mob-accent-glow-light),
                    inset 0 0 8px var(--mob-accent-dim);
      }

      body.dark-mode #mobDownloadBtn {
        background: var(--mob-accent-dim);
        box-shadow: 0 0 14px var(--mob-accent-glow);
      }

      #mobDownloadBtn:active { transform: scale(0.97); }
      #mobDownloadBtn i { font-size: 16px; }
      .mob-broken-link {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        margin-top: -2px;
        font-family: "Roboto Slab", Rockwell, sans-serif;
        font-size: 12px;
        color: rgba(60,60,60,0.60);
        text-decoration: none;
        transition: color 0.4s ease;
      }

      .mob-broken-link i {
        font-size: 11px;
        color: var(--mob-accent);
      }

      body.dark-mode .mob-broken-link {
        color: rgba(220,220,220,0.55);
      }

      .mob-broken-link:active {
        opacity: 0.65;
      }
      .mob-broken-link.reported {
        color: #2ecc71 !important;
        pointer-events: none;
        cursor: default;
      }

      .mob-broken-link.reported i {
        color: #2ecc71 !important;
      }

      #mobMovieInfo {
        background: rgba(255,255,255,0.28);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border: 1px solid var(--mob-accent-dim-light);
        border-radius: 20px;
        padding: 16px;
        box-shadow: 0 0 10px var(--mob-accent-dim);
        transition: background 0.4s, border-color 1s, box-shadow 1s;
        position: relative;
      }

      #mobMovieInfo::before {
        content: '';
        position: absolute;
        inset: -20px 0;
        z-index: -1;
        background: radial-gradient(ellipse 80% 60% at 50% 50%, __ACCENT_GLOW_35__ 0%, transparent 70%);
        pointer-events: none;}

      body.dark-mode #mobMovieInfo {
        background: rgba(255,255,255,0.04);
        border-color: rgba(255,255,255,0.07);
        box-shadow: none;
      }

      #mobMovieTitle {
        font-family: 'Bebas Neue', sans-serif;
        font-size: 34px;
        letter-spacing: 2px;
        color: #111;
        margin-bottom: 8px;
        line-height: 1;
        text-shadow: 0 0 16px var(--mob-accent-glow-light);
        transition: color 0.4s, text-shadow 1s;
      }

      body.dark-mode #mobMovieTitle {
        color: #fff;
        text-shadow: 0 0 20px var(--mob-accent-glow);
      }

      #mobMovieMeta {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 12px;
        font-family: "Roboto Slab", Rockwell, sans-serif;
        font-size: 12px;
        color: #555;
      }

      body.dark-mode #mobMovieMeta { color: #888; }

      .mob-meta-badge {
        background: var(--mob-accent);
        color: #fff;
        padding: 2px 10px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 700;
        box-shadow: 0 0 8px var(--mob-accent-glow-light);
        transition: background 1s ease, box-shadow 1s ease;
      }

      body.dark-mode .mob-meta-badge {
        background: var(--mob-accent-dim);
        color: var(--mob-accent);
        border: 1px solid var(--mob-accent);
        box-shadow: 0 0 8px var(--mob-accent-glow);
      }

      #mobMovieSummary {
        font-family: "Roboto Slab", Rockwell, sans-serif;
        font-size: 13px;
        line-height: 1.6;
        color: #333;
        transition: color 0.4s;
      }

      body.dark-mode #mobMovieSummary { color: #bbb; }

      #mobRelatedLabel {
        font-family: "Roboto Slab", Rockwell, sans-serif;
        font-size: 17px;
        font-weight: 700;
        color: #111;
        padding: 2px 0 10px;
        transition: color 0.4s;
      }

      body.dark-mode #mobRelatedLabel { color: #fff; }

      #mobRelatedGrid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }

      .mob-related-card {
        border-radius: 16px;
        overflow: hidden;
        text-decoration: none;
        display: block;
        transition: transform 0.15s ease, box-shadow 1s ease, border-color 1s ease;
        background: rgba(255,255,255,0.30);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border: 1px solid var(--mob-accent-dim-light);
        box-shadow: 0 0 10px var(--mob-accent-dim),
                    0 2px 12px rgba(0,0,0,0.08);
      }

      body.dark-mode .mob-related-card {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.07);
        box-shadow: none;
      }

      .mob-related-card:active {
        transform: scale(0.97);
        border-color: var(--mob-accent);
        box-shadow: 0 0 16px var(--mob-accent-glow-light);
      }

      body.dark-mode .mob-related-card:active {
        border-color: var(--mob-accent);
        box-shadow: 0 0 16px var(--mob-accent-glow);
      }

      .mob-related-card img {
        width: 100%;
        aspect-ratio: 2 / 3;
        object-fit: cover;
        display: block;
        background: rgba(0,0,0,0.06);
      }

      .mob-related-card-info { padding: 8px 10px 10px; }

      .mob-related-card-title {
        font-size: 12px;
        font-family: "Roboto Slab", Rockwell, sans-serif;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 2px;
        color: #111;
        transition: color 0.4s;
      }

      body.dark-mode .mob-related-card-title { color: #f0f0f0; }

      .mob-related-card-genre {
        font-size: 11px;
        font-family: "Roboto Slab", Rockwell, sans-serif;
        color: var(--mob-accent);
        text-shadow: 0 0 8px var(--mob-accent-glow-light);
        transition: color 1s ease, text-shadow 1s ease;
      }

      body.dark-mode .mob-related-card-genre {
        text-shadow: 0 0 8px var(--mob-accent-glow);
      }

      #mobBottomNav {
        display: flex;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        min-height: 62px;
        z-index: 1000;
        align-items: center;
        justify-content: space-around;
        padding: 8px 4px env(safe-area-inset-bottom, 8px);
        background: rgba(255,255,255,0.80);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-top: 1px solid rgba(255,255,255,0.6);
        box-shadow: 0 -4px 20px var(--mob-accent-dim-light),
                    0 -1px 0 var(--mob-accent-dim-light);
        transition: background 0.4s, border-color 1s, box-shadow 1s;
      }

      body.dark-mode #mobBottomNav {
        background: rgba(13,13,13,0.85);
        border-top: 1px solid var(--mob-accent-dim);
        box-shadow: 0 -4px 24px rgba(0,0,0,0.5),
                    0 -1px 0 var(--mob-accent-dim);
        padding: 0 4px env(safe-area-inset-bottom, 8px);
    }

      .mob-movie-nav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        text-decoration: none;
        color: #888;
        flex: 1;
        padding: 8px 0;
        transition: color 0.3s;
        border: none;
        background: transparent;
        cursor: pointer;
      }

      .mob-movie-nav-item i { font-size: 20px; transition: transform 0.2s, filter 0.3s; }

      .mob-movie-nav-item span {
        font-size: 10px;
        font-family: "Roboto Slab", Rockwell, sans-serif;
        font-weight: 600;
      }

      .mob-genre-pill {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 14px 8px;
        border-radius: 14px;
        text-decoration: none;
        font-family: "Roboto Slab", Rockwell, sans-serif;
        font-size: 12px;
        color: #ccc;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.08);
        transition: background 0.2s;
      }
      .mob-genre-pill:active { background: var(--mob-accent-dim); }
      .mob-genre-pill i { font-size: 20px; }

      #mobGenrePanel h3 {
      text-align: center;
      }

      #mobFrostWrap {
        position: relative;
        width: 100%;
      }

      #mobFrostWrap iframe {
        width: 100%;
        height: 240px;
        border: none;
        display: block;
        filter: blur(10px);
        transition: filter 0.4s ease;
      }

      #mobFrostWrap.unblurred iframe {
        filter: none;
      }

      #mobFrostClick {
        position: absolute;
        inset: 0;
        z-index: 10;
        cursor: pointer;
        border-radius: 20px;
      }

      #mobFrostWrap.unblurred #mobFrostClick {
        display: none;
      }
    } /* end @media 1024px */

    #mobFooter {
      grid-column: 1 / -1;
      text-align: center;
      padding: 8px 12px 4px;
      font-family: "Roboto Slab", Rockwell, sans-serif;
      font-size: 15px;
}

    #mobFooter a {
      color: var(--mob-accent, __ACCENT__);
      text-decoration: none;
}
"""


def slugify_var(value):
    return re.sub(r"\s+", " ", value).strip()


def build_html(data):
    genre_meta = GENRE_META[data["genre"]]
    html = HTML_TEMPLATE
    html = html.replace("__TITLE__", data["title"])
    html = html.replace("__TITLE_UPPER__", data["title"].upper())
    html = html.replace("__HTML_FILENAME__", data["html_filename"])
    html = html.replace("__CSS_FILENAME__", data["css_filename"])
    html = html.replace("__IMDB_ID__", data["imdb_id"])
    html = html.replace("__DOWNLOAD_LINK__", data["download_link"])
    html = html.replace("__SUMMARY__", data["summary"])
    html = html.replace("__YEAR__", str(data["year"]))
    html = html.replace("__RUNTIME__", str(data["runtime"]))
    html = html.replace("__GENRE_LABEL__", genre_meta["label"])
    return html


def build_css(data):
    genre_meta = GENRE_META[data["genre"]]
    accent = genre_meta["accent"]
    css = CSS_TEMPLATE
    css = css.replace("__CSS_FILENAME__", data["css_filename"])
    css = css.replace("__TITLE__", data["title"])
    css = css.replace("__GENRE_LABEL__", genre_meta["label"])
    css = css.replace("__ACCENT_GLOW_55__", rgba(accent, 0.55))
    css = css.replace("__ACCENT_GLOW_35__", rgba(accent, 0.35))
    css = css.replace("__ACCENT_GLOW_28__", rgba(accent, 0.28))
    css = css.replace("__ACCENT_GLOW_18__", rgba(accent, 0.18))
    css = css.replace("__ACCENT_GLOW__", rgba(accent, 0.38))
    css = css.replace("__ACCENT_GLOW_LIGHT__", rgba(accent, 0.22))
    css = css.replace("__ACCENT_DIM_LIGHT__", rgba(accent, 0.20))
    css = css.replace("__ACCENT_DIM__", rgba(accent, 0.13))
    css = css.replace("__SOFT_BG__", soft_tint(accent))
    css = css.replace("__BACKGROUND_PATH__", data["background_path"])
    css = css.replace("__ACCENT__", accent)
    return css


def build_movies_js_entry(data):
    genre_meta = GENRE_META[data["genre"]]
    title_escaped = data["title"].replace('"', '\\"')
    return (
        f'    {{ title: "{title_escaped}", '
        f'href: "../movies/{data["html_filename"]}", '
        f'genre: "{data["genre"]}", '
        f'poster: "images/posters/{data["poster_file"]}", '
        f'discover: {data["discover"]} , '
        f'background: "images/backgrounds/{data["background_file"]}"}},'
    )


def append_to_movies_js(movies_js_path, entry_line):
    """
    Inserts the new entry as the last item in the LEVENY_MOVIES array,
    immediately before the closing '];' — matching how every existing
    entry in the file is formatted.
    """
    with open(movies_js_path, "r", encoding="utf-8") as f:
        content = f.read()

    match = re.search(r"\n(\s*)\];\s*$", content)
    if not match:
        # Fallback: just look for the last "];" anywhere
        idx = content.rstrip().rfind("];")
        if idx == -1:
            raise ValueError("Could not locate closing '];' in movies.js")
        new_content = content[:idx] + entry_line + "\n" + content[idx:]
    else:
        insert_at = match.start()
        new_content = content[:insert_at] + "\n" + entry_line + content[insert_at:]

    with open(movies_js_path, "w", encoding="utf-8") as f:
        f.write(new_content)
