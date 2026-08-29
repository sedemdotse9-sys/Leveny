#!/usr/bin/env python3
"""
add_romance_genre.py — Leveny

Scans every .html file in your project (movie pages, index.html, etc.)
and, wherever it finds an existing "Musical" genre link (in the desktop
nav dropdown OR the mobile slide-up genre panel), inserts a matching
"Romance" link right after it — using the same relative path style
(e.g. "genres.html#musical" vs "../genres.html#musical",
"genre-results.html?genre=musical" vs "../genre-results.html?genre=musical")
that the file already uses.

This does NOT touch genres.html, genre-results.html, genres.css,
genres-mobile.css, or genres-mobile.js — those already have Romance
added by hand. Re-running this script is safe: any file that already
mentions "romance" is skipped automatically, so you can run it again
any time you add a new movie page.

USAGE:
    python add_romance_genre.py [path-to-site-folder]

    If no path is given, it scans the current directory.

WHAT IT LOOKS FOR:
    Any <a ...>...</a> tag whose href contains "#musical" or
    "genre=musical" (case-insensitive) — this matches both:
      <a href="genres.html#musical"><i class="fas fa-music" ...></i> Musical</a>
      <a class="mob-genre-pill" href="genre-results.html?genre=musical">
          <i class="fas fa-music" ...></i><span>Musical</span></a>

    For each match it clones the tag and swaps in the Romance values:
      musical -> romance   (href)
      fa-music -> fa-heart (icon)
      #e84393 -> #ff4d6d   (color)
      Musical -> Romance   (label text)

    then inserts the new line directly below the original.
"""

import re
import sys
from pathlib import Path

MUSICAL_LINK = re.compile(
    r'<a[^>]*href="[^"]*(?:#musical|genre=musical)"[^>]*>.*?</a>',
    re.IGNORECASE,
)


def build_romance_tag(tag: str) -> str:
    """Clone a 'Musical' anchor tag into a 'Romance' one."""
    new_tag = re.sub(r'(href="[^"]*?)musical(["\'])', r'\1romance\2', tag, flags=re.IGNORECASE)
    new_tag = new_tag.replace('fa-music', 'fa-heart')
    new_tag = re.sub(r'#e84393', '#ff4d6d', new_tag, flags=re.IGNORECASE)
    new_tag = re.sub(r'Musical', 'Romance', new_tag)
    return new_tag


def process_file(path: Path) -> bool:
    try:
        text = path.read_text(encoding='utf-8')
    except Exception as exc:
        print(f"  ! could not read {path}: {exc}")
        return False

    if not MUSICAL_LINK.search(text):
        return False  # nothing to anchor a Romance entry to

    if re.search(r'romance', text, re.IGNORECASE):
        return False  # already has a Romance entry — skip (idempotent)

    lines = text.splitlines(keepends=True)
    new_lines = []
    changed = False

    for line in lines:
        new_lines.append(line)
        match = MUSICAL_LINK.search(line)
        if match:
            indent = line[:len(line) - len(line.lstrip())]
            ending = ''
            if line.endswith('\r\n'):
                ending = '\r\n'
            elif line.endswith('\n'):
                ending = '\n'

            romance_tag = build_romance_tag(match.group(0))
            new_lines.append(indent + romance_tag + ending)
            changed = True

    if changed:
        path.write_text(''.join(new_lines), encoding='utf-8')

    return changed


def main():
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('.')
    if not root.exists():
        print(f"Path not found: {root}")
        sys.exit(1)

    html_files = sorted(root.rglob('*.html'))
    modified = []
    already_had_romance = []
    no_musical_link = 0

    print(f"Scanning {len(html_files)} .html file(s) under {root.resolve()} ...\n")

    for f in html_files:
        try:
            text = f.read_text(encoding='utf-8')
        except Exception as exc:
            print(f"  ! could not read {f}: {exc}")
            continue

        if not MUSICAL_LINK.search(text):
            no_musical_link += 1
            continue

        if re.search(r'romance', text, re.IGNORECASE):
            already_had_romance.append(f)
            continue

        if process_file(f):
            modified.append(f)

    print(f"Added Romance genre link(s) to {len(modified)} file(s):")
    for f in modified:
        print(f"  + {f}")

    if already_had_romance:
        print(f"\nSkipped {len(already_had_romance)} file(s) that already mention 'romance':")
        for f in already_had_romance:
            print(f"  = {f}")

    print(f"\n{no_musical_link} file(s) had no genre-menu markup to anchor to (untouched).")
    print("\nDone. Spot-check a couple of the modified pages in a browser before committing.")


if __name__ == '__main__':
    main()
