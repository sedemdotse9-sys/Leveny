#!/usr/bin/env python3
"""
Leveny genre poster size. Place this file in the repo root (the folder with
index.html, css/ and js/), then run:  py apply_genre_poster_size.py

Makes the desktop genre posters match the discover page:
  - same poster size (max 240px wide, 2:2.5 image ratio, like discover)
  - same layout (5 posters per row, 30px gap, like discover)

Changes:
  1. css/genres.css: adds a desktop-only block (min-width 1025px) at the end.
     Mobile and tablet layouts are not touched.
  2. js/genres.js: MOVIES_PER_ROW goes from 6 to 5, so each row holds 5
     posters and each page holds 4 rows of 5 (20 posters).

Each changed file is backed up first as <name>.bak.
Safe to run more than once.
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent

CSS_MARK = "AUTO-INJECTED: desktop poster size (matches discover)"
CSS_BLOCK = """
/* === AUTO-INJECTED: desktop poster size (matches discover) ===
   Desktop only (1025px and wider). Same poster size and row layout as
   the discover page: max 240px wide, 2:2.5 image ratio, 5 per row with
   a 30px gap. Tablet and phone layouts above are unchanged. */
@media screen and (min-width: 1025px) {
  .movie-slider-container {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 240px));
    justify-content: center;
    gap: 30px;
  }

  .movie-card-slider {
    width: 100%;
    max-width: 240px;
    justify-self: center;
  }

  .movie-card-slider img {
    height: auto;
    aspect-ratio: 2 / 2.5;
    object-fit: cover;
  }
}
"""

JS_OLD = re.compile(r"const MOVIES_PER_ROW(\s*)=(\s*)6;")
JS_NEW = r"const MOVIES_PER_ROW\g<1>=\g<2>5;"


def read_text(path):
    # newline="" keeps the file's own line endings (Windows CRLF stays CRLF)
    with open(path, encoding="utf-8", newline="") as f:
        raw = f.read()
    return raw.replace("\r\n", "\n"), "\r\n" in raw


def write_text(path, text, crlf):
    if crlf:
        text = text.replace("\n", "\r\n")
    with open(path, "w", encoding="utf-8", newline="") as f:
        f.write(text)


def backup(path):
    bak = path.parent / (path.name + ".bak")
    if not bak.exists():
        bak.write_bytes(path.read_bytes())


def apply_css(path):
    text, crlf = read_text(path)
    if CSS_MARK in text:
        print(f"  skipped  {path.relative_to(ROOT)}: already applied")
        return True
    backup(path)
    write_text(path, text.rstrip() + "\n" + CSS_BLOCK, crlf)
    print(f"  updated  {path.relative_to(ROOT)}: desktop genre posters now match discover")
    return True


def apply_js(path):
    text, crlf = read_text(path)
    if JS_OLD.search(text) is None:
        if re.search(r"const MOVIES_PER_ROW\s*=\s*5;", text):
            print(f"  skipped  {path.relative_to(ROOT)}: already 5 per row")
            return True
        print(f"  FAILED   {path.relative_to(ROOT)}: could not find 'const MOVIES_PER_ROW = 6;'")
        return False
    new_text, count = JS_OLD.subn(JS_NEW, text, count=1)
    backup(path)
    write_text(path, new_text, crlf)
    print(f"  updated  {path.relative_to(ROOT)}: 5 posters per row")
    return True


def main():
    css_path = ROOT / "css" / "genres.css"
    js_path = ROOT / "js" / "genres.js"

    if not (ROOT / "index.html").exists() or not (ROOT / "js").exists():
        print("Place this file in your repo root (the folder with index.html, css/ and js/).")
        sys.exit(1)

    print("Applying genre poster size...")
    ok = True
    if css_path.exists():
        ok = apply_css(css_path) and ok
    else:
        print("  MISSING  css/genres.css")
        ok = False
    if js_path.exists():
        ok = apply_js(js_path) and ok
    else:
        print("  MISSING  js/genres.js")
        ok = False

    print()
    if ok:
        print("Done. Hard-refresh the genre page (Ctrl+F5) to see the change.")
    else:
        print("Some files were not changed. See the messages above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
