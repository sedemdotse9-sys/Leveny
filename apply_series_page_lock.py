#!/usr/bin/env python3
"""
Leveny series page lock (desktop). Place this file in the repo root (the
folder with index.html, css/ and js/), then run:  py apply_series_page_lock.py

A series set to  accessible: false  in js/movies.js can no longer be used
on desktop:
  - its video is removed, so nothing plays
  - the page is covered with a "not available yet" message

Typing the address of a locked series now shows the message instead of the
video. Mobile is not changed. Movies are not affected.

Appends one block to js/script.js (which every page already loads). The
file is backed up first as script.js.bak. Safe to run more than once.
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TARGET = ROOT / "js" / "script.js"

MARK = "AUTO-INJECTED: series page lock (desktop)"
BLOCK = """
/* === AUTO-INJECTED: series page lock (desktop) ===
   A series with accessible: false in movies.js can't be used on desktop:
   the video is removed and a "not available yet" message covers the page.
   Mobile and movies are not affected. */
(function () {
    function levenyLockSeriesPage() {
        if (window.innerWidth < 1025) return;
        if (typeof LEVENY_MOVIES === 'undefined') return;

        const file = (document.body.dataset.currentMovie || '').split('/').pop();
        if (!file) return;

        const m = LEVENY_MOVIES.find(x => x.href.split('/').pop() === file);
        if (!m || m.type !== 'series' || m.accessible !== false) return;

        if (!document.getElementById('leveny-series-lock-styles')) {
            const st = document.createElement('style');
            st.id = 'leveny-series-lock-styles';
            st.textContent = `
                .leveny-series-lock-overlay {
                    position: absolute;
                    inset: 0;
                    z-index: 1500;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 14px;
                    text-align: center;
                    color: #fff;
                    background: rgba(0, 0, 0, 0.65);
                    backdrop-filter: grayscale(100%) blur(3px);
                    -webkit-backdrop-filter: grayscale(100%) blur(3px);
                    font-family: "Roboto Slab", Rockwell, sans-serif;
                }
                .leveny-series-lock-overlay i { font-size: 46px; opacity: 0.8; }
                .leveny-series-lock-overlay p { font-size: 20px; font-weight: 600; margin: 0; }
            `;
            document.head.appendChild(st);
        }

        // Remove the video so nothing plays behind the message.
        document.querySelectorAll('.video-section iframe').forEach(f => f.removeAttribute('src'));

        const main = document.querySelector('main.movie-page');
        if (!main) return;
        main.style.position = 'relative';

        const overlay = document.createElement('div');
        overlay.className = 'leveny-series-lock-overlay';

        const icon = document.createElement('i');
        icon.className = 'fas fa-lock';

        const text = document.createElement('p');
        text.textContent = m.title + ' is not available yet';

        overlay.appendChild(icon);
        overlay.appendChild(text);
        main.appendChild(overlay);
    }

    document.addEventListener('DOMContentLoaded', levenyLockSeriesPage);
})();
"""


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


def main():
    if not (ROOT / "index.html").exists():
        print("Place this file in your repo root (the folder with index.html and js/).")
        sys.exit(1)
    if not TARGET.exists():
        print("Could not find js/script.js.")
        sys.exit(1)

    text, crlf = read_text(TARGET)
    if MARK in text:
        print("Already applied, nothing changed.")
        return

    bak = TARGET.parent / (TARGET.name + ".bak")
    if not bak.exists():
        bak.write_bytes(TARGET.read_bytes())

    write_text(TARGET, text.rstrip() + "\n" + BLOCK, crlf)
    print("Updated js/script.js: locked series pages are blocked on desktop.")
    print("Hard-refresh the series page (Ctrl+F5) to see the change.")


if __name__ == "__main__":
    main()
