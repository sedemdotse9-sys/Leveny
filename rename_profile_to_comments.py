#!/usr/bin/env python3
"""
rename_profile_to_comments.py — Leveny

Renames the visible "Profile" nav label to "Comments" across every
HTML page in the site (nav bar, mobile icon aria-label, bottom nav).
It does NOT touch anything unrelated to that nav link — e.g. the
"Profile picture options" label on the avatar upload button in the
sidebar is left alone, since that's about the profile *picture*
feature, not the page you're renaming.

USAGE:
    1. Copy this file into the ROOT of your Leveny repo (the same
       folder as index.html, movies/, css/, js/).
    2. Run it:
           python3 rename_profile_to_comments.py
    3. Review the changes (git diff / git status), then commit +
       push as usual.

It's safe to run more than once — if a page has already been
renamed, it's simply skipped.
"""

import glob
import os

# (old substring, new substring) — order doesn't matter, each is
# applied independently and only touches an exact match.
REPLACEMENTS = [
    # Mobile floating "Profile" icon button — this is the ONLY label
    # a screen reader announces for that icon-only button, so it
    # needs to change too. This exact string does NOT match the
    # unrelated "Profile picture options" label on the avatar
    # upload button (that one has extra words after "Profile").
    ('aria-label="Profile"', 'aria-label="Comments"'),

    # Desktop top-nav link text, e.g.:
    #   <a href="comments.html"><i class="fa-regular fa-user"></i>Profile</a>
    ('<i class="fa-regular fa-user"></i>Profile</a>',
     '<i class="fa-regular fa-user"></i>Comments</a>'),

    # Mobile bottom-nav link text, e.g.:
    #   <a class="mob-nav-item" href="comments.html">
    #       <i class="fa-regular fa-user"></i><span>Profile</span></a>
    ('<i class="fa-regular fa-user"></i><span>Profile</span>',
     '<i class="fa-regular fa-user"></i><span>Comments</span>'),
]


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
        for old, new in REPLACEMENTS:
            content = content.replace(old, new)

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
