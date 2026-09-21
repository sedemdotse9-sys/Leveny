#!/usr/bin/env python3
"""
fix_movie_css.py — Leveny

Scans every HTML file in movies/ and makes sure it links the shared
../css/style.css stylesheet (the one with .movie-page, .video-section,
.details-section, .related-movies, .poster, etc. — and now the
1025-1440px / 1441px+ responsive fixes).

Some movie pages were generated without that link and only pull in
their own page-specific stylesheet (e.g. style95.css), so they never
get the shared layout/structure rules at all.

USAGE
-----
1. Drop this file in the ROOT of your repo (same folder as index.html,
   movies/, css/, js/ — same place leveny_generator lives).
2. Run:
       python fix_movie_css.py
   This does a DRY RUN by default: it prints what it WOULD change,
   but does not touch any files.
3. Once the output looks right, run it for real:
       python fix_movie_css.py --apply

Each modified file gets a ".bak" backup written alongside it before
being changed (matching the *.html.bak pattern already used in this
repo), so you can always revert with e.g.:
       cp movies/atlas_king_movie.html.bak movies/atlas_king_movie.html

Safe to re-run any time — files that already have the shared
stylesheet linked are left untouched.
"""

import argparse
import re
from pathlib import Path

# ---- Config -----------------------------------------------------------
SITE_ROOT = Path(__file__).resolve().parent
MOVIES_DIR = SITE_ROOT / "movies"

SHARED_CSS_HREF = "../css/style.css"
SHARED_CSS_TAG = f'<link href="{SHARED_CSS_HREF}" rel="stylesheet"/>'

# Matches any <link ... href="../css/style.css" ... /> or ... > regardless
# of attribute order/quoting, so we can detect it even if it was written
# slightly differently by hand.
SHARED_CSS_RE = re.compile(
    r'<link\b[^>]*href=["\']\.\./css/style\.css["\'][^>]*/?>',
    re.IGNORECASE,
)

# Matches the page-specific stylesheet link, e.g.
#   <link href="../css/style95.css" rel="stylesheet"/>
PAGE_CSS_RE = re.compile(
    r'<link\b[^>]*href=["\']\.\./css/(?!style\.css)[^"\']+\.css["\'][^>]*/?>',
    re.IGNORECASE,
)

TITLE_CLOSE_RE = re.compile(r"</title>", re.IGNORECASE)


def find_insert_point(html: str):
    """
    Return (index, how) where the shared stylesheet link should be
    inserted, or (None, None) if we can't find a safe spot.

    Preference order:
      1. Right before the page-specific ../css/<name>.css link, so the
         shared rules load first and page-specific rules can still
         override them (matches the original template ordering).
      2. Right after </title>, as a fallback.
    """
    m = PAGE_CSS_RE.search(html)
    if m:
        return m.start(), "before page-specific css"

    m = TITLE_CLOSE_RE.search(html)
    if m:
        return m.end(), "after </title>"

    return None, None


def process_file(path: Path, apply: bool):
    html = path.read_text(encoding="utf-8")

    if SHARED_CSS_RE.search(html):
        print(f"  OK      {path.relative_to(SITE_ROOT)} — already links css/style.css")
        return False

    index, how = find_insert_point(html)
    if index is None:
        print(f"  SKIP    {path.relative_to(SITE_ROOT)} — could not find a safe place to insert the link, please add manually")
        return False

    new_html = html[:index] + SHARED_CSS_TAG + "\n" + html[index:]

    print(f"  FIX     {path.relative_to(SITE_ROOT)} — inserting shared stylesheet link ({how})")

    if apply:
        backup_path = path.with_suffix(path.suffix + ".bak")
        if not backup_path.exists():
            backup_path.write_text(html, encoding="utf-8")
        path.write_text(new_html, encoding="utf-8")

    return True


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Actually write changes (and .bak backups). Without this flag, only a dry-run report is printed.",
    )
    args = parser.parse_args()

    if not MOVIES_DIR.is_dir():
        print(f"Could not find a movies/ folder at {MOVIES_DIR}. "
              f"Place this script in your repo root (next to index.html, css/, js/, movies/).")
        return

    html_files = sorted(MOVIES_DIR.glob("*.html"))
    if not html_files:
        print(f"No .html files found in {MOVIES_DIR}")
        return

    print(f"{'APPLYING CHANGES' if args.apply else 'DRY RUN (no files will be modified)'} — scanning {len(html_files)} file(s) in movies/\n")

    changed = 0
    for path in html_files:
        if process_file(path, apply=args.apply):
            changed += 1

    print(f"\n{changed} file(s) {'fixed' if args.apply else 'need fixing'}.")
    if not args.apply and changed:
        print("Re-run with --apply to write these changes (backups will be saved as *.html.bak).")


if __name__ == "__main__":
    main()
