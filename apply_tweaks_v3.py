#!/usr/bin/env python3
"""
Leveny tweaks (v3). Place this file in the repo root (the folder with
index.html, css/ and js/), then run:  py apply_tweaks_v3.py

  1. Series pages: the info line (year | runtime | genre | episode title)
     stays on one line, so a long episode title is not pushed down.
     -> css/series.css
  2. Desktop related movies: 2 posters under the movie description and
     2 more directly under "Broken download link?". The two under the
     link are centered under the Download button, with a wider gap
     between them.
     -> js/related.js and css/style.css
  3. Movie pages: mobile disclaimer text is 12px (matches the homepage).
     -> every css/style<N>.css file
  4. generator.py: new movie pages get the same 12px disclaimer.

Safe to run on a repo where an earlier version was already run: the
earlier blocks are replaced, not duplicated.
Each file that changes is backed up first as <name>.bak.
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def read_text(path):
    # newline="" keeps the file's own line endings (Windows CRLF stays CRLF)
    with open(path, encoding="utf-8", newline="") as f:
        return f.read()


def write_text(path, text):
    with open(path, "w", encoding="utf-8", newline="") as f:
        f.write(text)


def backup(path):
    bak = path.parent / (path.name + ".bak")
    if not bak.exists():
        bak.write_bytes(path.read_bytes())


def cut_block(text, old_markers):
    """
    Removes an earlier tweak block. Every block this script adds sits at
    the end of its file, so cutting from the first marker found is safe.
    """
    cuts = [text.find(m) for m in old_markers]
    cuts = [i for i in cuts if i != -1]
    if not cuts:
        return text
    return text[:min(cuts)].rstrip() + "\n"


# ---------- 1. Series info line stays on one line (css/series.css) ----------
SERIES_NEW_MARK = "AUTO-INJECTED v3: info line on one line"
SERIES_OLD_MARKS = ["/* === AUTO-INJECTED: episode title on one line"]
SERIES_BLOCK = """
/* === AUTO-INJECTED v3: info line on one line === */
.details-section .info {
  white-space: nowrap;
}
"""

# ---------- 2a. Under-link posters layout (css/style.css) ----------
STYLE_NEW_MARK = "AUTO-INJECTED v3.3: under-link posters"
STYLE_OLD_MARKS = [
    "/* === AUTO-INJECTED: desktop related posters",
    "/* === AUTO-INJECTED v3: related posters under link",
    "/* === AUTO-INJECTED v3.1: under-link posters",
    "/* === AUTO-INJECTED v3.2: under-link posters",
]
STYLE_BLOCK = """
/* === AUTO-INJECTED v3.3: under-link posters === */
/* Two posters under "Broken download link?". The row is the same
   width as the Download button and the pair is centered in it, with
   a wider gap between the two posters. */
.related-movies-under-link {
  display: flex;
  justify-content: center;
  gap: clamp(40px, 4vw, 60px);
  width: 700px;
  margin-top: 18px;
}

.related-movies-under-link .related-card {
  width: 230px;
}

.related-movies-under-link .poster {
  width: 100%;
}

/* Keep the row matched to the Download button at each screen size. */
@media screen and (min-width: 1025px) and (max-width: 1440px) {
  .related-movies-under-link {
    width: clamp(460px, 48vw, 700px);
  }

  .related-movies-under-link .related-card {
    width: clamp(170px, 16vw, 230px);
  }
}

@media screen and (min-width: 1441px) {
  .related-movies-under-link {
    width: clamp(700px, 40vw, 900px);
    gap: clamp(60px, 3.5vw, 80px);
  }

  .related-movies-under-link .related-card {
    width: clamp(230px, 13vw, 290px);
  }
}
"""

# ---------- 2b. Related movies script (js/related.js) ----------
RELATED_NEW_MARK = "related-movies-under-link"
RELATED_JS = r"""/* ============================================================
   related.js — Leveny
   Auto-generates "Related Movies" (desktop + mobile) from
   LEVENY_MOVIES.

   Desktop: 2 posters under the movie description, and 2 more
            directly under "Broken download link?".
   Mobile:  4 posters in the grid below the info card.

   MATCHING PRIORITY (highest to lowest):
     1. TITLE / FRANCHISE matches (e.g. "Zombies 4" -> "Zombies")
     2. GENRE matches
     3. RANDOM padding, only if the above don't fill the slots

   HOW TO USE ON A MOVIE PAGE:

   1. Tell the page which movie it IS:
        <body data-current-movie="../movies/a_quiet_place_movie.html">

   2. Leave these containers empty:
        <div class="related-movies"></div>
        <div id="mobRelatedGrid"></div>

   3. Load this AFTER movies.js:
        <script src="../js/movies.js"></script>
        <script src="../js/related.js"></script>

   NOTE: related cards use each movie's BACKGROUND image
   (m.background) on desktop and its POSTER (m.poster) on mobile.
============================================================ */

(function () {
    if (typeof LEVENY_MOVIES === 'undefined') return;

    const DESKTOP_TOP_COUNT = 2;         // under the movie description
    const DESKTOP_UNDER_LINK_COUNT = 2;  // under "Broken download link?"
    const MOBILE_RELATED_COUNT = 4;      // total on mobile
    const MIN_TITLE_KEY_LENGTH = 3;      // guards against over-matching on very short/stripped keys

    function fileName(href) {
        return href.split('/').pop();
    }

    // Extracts the folder a movies.js href points into, e.g.
    // "../movies/x.html" -> "movies", "../series/y.html" -> "series".
    function folderOf(href) {
        const match = href.match(/\.\.\/([^\/]+)\//);
        return match ? match[1] : '';
    }

    function typeLabel(m) {
        return m.type === 'series' ? 'Series' : 'Movie';
    }

    function cap(s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    /* Normalizes a title down to its "franchise" key, so sequels/
       prequels match each other regardless of subtitle or number:
         "Zombies 4: Dawn of the Vampires" -> "zombies"
         "Toy Story 3"                     -> "toy story"
         "Spider-Man: Into the Spider-Verse" -> "spiderman"
       Strips: everything after a colon, standalone numbers, the
       word "part", roman numerals I-X, and punctuation. */
    function titleKey(title) {
        return title
            .toLowerCase()
            .split(':')[0]
            .replace(/\bpart\b/g, '')
            .replace(/\b\d+\b/g, '')
            .replace(/\b(i{1,3}|iv|v|vi{0,3}|ix|x)\b/g, '')
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    const currentHref = document.body.dataset.currentMovie || window.location.pathname;
    const currentFile = fileName(currentHref);

    const current = LEVENY_MOVIES.find(m => fileName(m.href) === currentFile);
    if (!current) return; // page isn't recognized as a movie page, do nothing

    const currentTitleKey = titleKey(current.title);
    const currentFolder = folderOf(currentHref) || folderOf(current.href);

    // A related card may point into a different folder than the page
    // it's shown on (e.g. a movie related to a series). Same-folder
    // targets keep the plain filename link; cross-folder targets need
    // the "../<folder>/" prefix.
    function relatedLink(m) {
        const file = fileName(m.href);
        const folder = folderOf(m.href);
        return folder === currentFolder ? file : `../${folder}/${file}`;
    }

    // ---- TIER 1: title/franchise matches ----
    const titleMatches = (currentTitleKey.length >= MIN_TITLE_KEY_LENGTH)
        ? shuffle(LEVENY_MOVIES.filter(m =>
            fileName(m.href) !== currentFile && titleKey(m.title) === currentTitleKey
          ))
        : [];
    const titleMatchFiles = new Set(titleMatches.map(m => fileName(m.href)));

    // ---- TIER 2: genre matches, excluding anything title already claimed ----
    const genreMatches = shuffle(LEVENY_MOVIES.filter(m =>
        m.genre === current.genre &&
        fileName(m.href) !== currentFile &&
        !titleMatchFiles.has(fileName(m.href))
    ));

    let candidates = titleMatches.concat(genreMatches);

    // ---- TIER 3: random padding if the above didn't fill enough slots ----
    if (candidates.length < MOBILE_RELATED_COUNT) {
        const already = new Set(candidates.map(m => fileName(m.href)));
        const others = shuffle(LEVENY_MOVIES.filter(
            m => fileName(m.href) !== currentFile && !already.has(fileName(m.href))
        ));
        candidates = candidates.concat(others);
    }

    // Pick MOBILE_RELATED_COUNT once. Desktop shows the first 2 under the
    // description and the next 2 under the broken link, so all 4 are
    // different movies.
    const related = candidates.slice(0, MOBILE_RELATED_COUNT);

    function desktopCard(m) {
        return `
            <div class="related-card">
                <a href="${relatedLink(m)}" class="poster" style="background-image: url('../${m.background}');"></a>
                <p class="related-title">${m.title} <span class="type-tag">| ${typeLabel(m)}</span></p>
            </div>
        `;
    }

    // ---- DESKTOP: 2 under the movie description ----
    const topWrap = document.querySelector('.related-movies');
    if (topWrap) {
        topWrap.innerHTML = related.slice(0, DESKTOP_TOP_COUNT).map(desktopCard).join('');
    }

    // ---- DESKTOP: 2 directly under "Broken download link?" ----
    const brokenLink = document.querySelector('.video-section .broken-link');
    const underLink = related.slice(DESKTOP_TOP_COUNT, DESKTOP_TOP_COUNT + DESKTOP_UNDER_LINK_COUNT);
    if (brokenLink && underLink.length) {
        const bottomWrap = document.createElement('div');
        bottomWrap.className = 'related-movies-under-link';
        bottomWrap.innerHTML = underLink.map(desktopCard).join('');
        brokenLink.insertAdjacentElement('afterend', bottomWrap);
    }

    // ---- MOBILE ----
    const mobileWrap = document.getElementById('mobRelatedGrid');
    if (mobileWrap) {
        mobileWrap.innerHTML = related.map(m => `
            <a href="${relatedLink(m)}" class="mob-related-card">
                <img src="../${m.poster}" alt="${m.title}" loading="lazy">
                <div class="mob-related-card-info">
                    <div class="mob-related-card-title">${m.title} <span class="type-tag">| ${typeLabel(m)}</span></div>
                    <div class="mob-related-card-genre">${cap(m.genre)}</div>
                </div>
            </a>
        `).join('');
    }
})();
"""


def series_fn(text):
    if SERIES_NEW_MARK in text:
        return text, "already applied"
    text = cut_block(text, SERIES_OLD_MARKS)
    return text.rstrip() + "\n" + SERIES_BLOCK, "info line set to stay on one line"


def style_fn(text):
    if STYLE_NEW_MARK in text:
        return text, "already applied"
    text = cut_block(text, STYLE_OLD_MARKS)
    return text.rstrip() + "\n" + STYLE_BLOCK, "under-link posters spaced wider and centered"


def related_fn(text):
    if RELATED_NEW_MARK in text:
        return text, "already applied"
    return RELATED_JS, "2 under description + 2 under broken link"


# ---------- 3 & 4. Mobile disclaimer size (movie CSS + generator.py) ----------
MOBFOOTER_15 = re.compile(r"(#mobFooter\s*\{[^}]*?font-size:\s*)15px")
MOBFOOTER_12 = re.compile(r"#mobFooter\s*\{[^}]*?font-size:\s*12px")


def make_disclaimer_fn(strict):
    def disclaimer_fn(text):
        if MOBFOOTER_12.search(text):
            return text, "already applied"
        new, count = MOBFOOTER_15.subn(r"\g<1>12px", text, count=1)
        if count:
            return new, "disclaimer set to 12px"
        if strict:
            return None, "could not find the #mobFooter font-size, send generator.py"
        return text, "no #mobFooter font-size here, skipped"
    return disclaimer_fn


def apply(rel, fn, problems):
    path = ROOT / rel
    if not path.exists():
        print(f"  MISSING  {rel}")
        problems.append(rel)
        return
    text = read_text(path)
    new, msg = fn(text)
    if new is None:
        print(f"  FAILED   {rel}: {msg}")
        problems.append(rel)
    elif new == text:
        print(f"  skipped  {rel}: {msg}")
    else:
        backup(path)
        write_text(path, new)
        print(f"  updated  {rel}: {msg}")


def movie_css_files():
    css_dir = ROOT / "css"
    if not css_dir.is_dir():
        return []
    return sorted(
        p for p in css_dir.glob("style*.css")
        if re.fullmatch(r"style\d+\.css", p.name)
    )


def main():
    if not ((ROOT / "index.html").exists() and (ROOT / "js").exists()):
        print("Place this file in your repo root (the folder with index.html, css/ and js/).")
        sys.exit(1)

    problems = []
    print("Applying tweaks...")
    apply("css/series.css", series_fn, problems)
    apply("css/style.css", style_fn, problems)
    apply("js/related.js", related_fn, problems)

    css_files = movie_css_files()
    if not css_files:
        print("  NOTE     no css/style<N>.css files found, no movie disclaimers changed")
    for path in css_files:
        apply(f"css/{path.name}", make_disclaimer_fn(strict=False), problems)

    apply("generator.py", make_disclaimer_fn(strict=True), problems)

    print()
    if problems:
        print("Some files were not changed:", ", ".join(problems))
        sys.exit(1)
    print("Done. Hard-refresh your pages (Ctrl+F5) to see the changes.")


if __name__ == "__main__":
    main()
