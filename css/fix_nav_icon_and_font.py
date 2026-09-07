#!/usr/bin/env python3
"""
fix_nav_icon_and_font.py — Leveny

Two site-wide fixes, applied the same way rename_profile_to_comments.py
was:

  1. ICON: the Comments link's icon (a plain person outline,
     fa-regular fa-user) is swapped for a speech-bubbles icon
     (fa-solid fa-comments) — desktop top nav, mobile bottom nav,
     and the mobile header's floating icon-only button. This does
     NOT touch fa-regular fa-user anywhere else (e.g. the sidebar
     avatar placeholder, or the username field icon on
     login/signup) — those are left exactly as they are.

  2. FONT: the desktop top-nav links (<ul class="nav_links">) get
     the same inline Rockwell font-family your Movie_Request.html
     already uses, on every page that doesn't have it yet.

USAGE:
    1. Copy into the ROOT of your Leveny repo.
    2. python3 fix_nav_icon_and_font.py
    3. git diff to review, then commit + push.

Safe to run more than once — already-fixed pages are skipped.
"""

import glob
import os

ICON_REPLACEMENTS = [
    # Desktop top-nav link text, plain (Genres.html / discover.html etc.)
    ('<i class="fa-regular fa-user"></i>Comments</a>',
     '<i class="fa-solid fa-comments"></i>Comments</a>'),

    # Desktop top-nav link text, marked active (comments.html itself)
    ('<a href="comments.html" class="active"><i class="fa-regular fa-user"></i>Comments</a>',
     '<a href="comments.html" class="active"><i class="fa-solid fa-comments"></i>Comments</a>'),

    # Mobile bottom-nav link, plain
    ('<i class="fa-regular fa-user"></i><span>Comments</span>',
     '<i class="fa-solid fa-comments"></i><span>Comments</span>'),

    # Mobile floating header icon-only button
    ('<a class="mobile-profile-btn" href="comments.html">\n        <i class="fa-regular fa-user"></i>\n    </a>',
     '<a class="mobile-profile-btn" href="comments.html">\n        <i class="fa-solid fa-comments"></i>\n    </a>'),
    # Same button, no-indent / single-line variant (some pages differ slightly)
    ('<a class="mobile-profile-btn" href="comments.html">\n<i class="fa-regular fa-user"></i>\n</a>',
     '<a class="mobile-profile-btn" href="comments.html">\n<i class="fa-solid fa-comments"></i>\n</a>'),
]

# Only touch <ul class="nav_links"> that has NO style attribute yet.
NAV_FONT_OLD = '<ul class="nav_links">'
NAV_FONT_NEW = '<ul class="nav_links" style=\'font-family: "Roboto Slab", Rockwell, sans-serif;\'>'


def main():
    root = os.path.dirname(os.path.abspath(__file__))
    html_files = [
        f for f in glob.glob(os.path.join(root, "**", "*.html"), recursive=True)
        if "node_modules" not in f
    ]

    changed_files = []

    for path in html_files:
        with open(path, "r", encoding="utf-8") as fh:
            content = fh.read()

        original = content

        for old, new in ICON_REPLACEMENTS:
            content = content.replace(old, new)

        content = content.replace(NAV_FONT_OLD, NAV_FONT_NEW)

        if content != original:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(content)
            changed_files.append(os.path.relpath(path, root))

    print(f"Scanned {len(html_files)} HTML files.")
    print(f"Updated {len(changed_files)} file(s):")
    for f in sorted(changed_files):
        print(f"  - {f}")

    if not changed_files:
        print("Nothing to change — looks like this has already been run.")


if __name__ == "__main__":
    main()
