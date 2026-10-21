#!/usr/bin/env python3
"""
Leveny big-monitor fix. Place this file in the repo root (the folder with
index.html, css/ and js/), then run:  py apply_big_screen_gap.py

Tightens the spacing between the homepage movie posters on screens
1441px wide and wider. Screens 1440px and smaller are not affected.

Changes only css/design.css, by appending one block at the end of the
file. The file is backed up first as design.css.bak. Safe to run more
than once.
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TARGET = ROOT / "css" / "design.css"

MARK = "AUTO-INJECTED: big-screen poster gap"
BLOCK = """
/* === AUTO-INJECTED: big-screen poster gap ===
   Screens 1441px and wider only: tighter gap between the homepage
   posters. Smaller screens are unchanged. */
@media screen and (min-width: 1441px) {
  .movie-list,
  .movie-list-2,
  .movie-list-3,
  .movie-list-4,
  .movie-list-5,
  .movie-list-6,
  .movie-list-7 {
    gap: clamp(14px, 1.1vw, 26px);
  }
}
"""


def read_text(path):
    # newline="" keeps the file's own line endings
    with open(path, encoding="utf-8", newline="") as f:
        return f.read()


def write_text(path, text):
    with open(path, "w", encoding="utf-8", newline="") as f:
        f.write(text)


def main():
    if not TARGET.exists():
        print("Could not find css/design.css. Place this file in your repo root.")
        sys.exit(1)

    text = read_text(TARGET)
    if MARK in text:
        print("Already applied, nothing changed.")
        return

    bak = TARGET.parent / (TARGET.name + ".bak")
    if not bak.exists():
        bak.write_bytes(TARGET.read_bytes())

    write_text(TARGET, text.rstrip() + "\n" + BLOCK)
    print("Updated css/design.css: big-screen poster gap tightened (1441px and wider).")
    print("Hard-refresh the homepage (Ctrl+F5) to see the change.")


if __name__ == "__main__":
    main()
