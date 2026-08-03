#!/usr/bin/env python3
"""
update_favicons.py — Leveny

Scans every .html file in the project (recursively) and makes sure
its <head> has the NEW favicon <link> tags — the same ones now in
index.html. Old/legacy favicon <link> tags are removed first so you
don't end up with duplicates.

USAGE:
    1. Put this file in your project's ROOT folder (same level as index.html)
    2. Open a terminal in VS Code, in that same folder
    3. Run:  python update_favicons.py
       (or:  python3 update_favicons.py   on Mac)
    4. It will print every file it changed. Nothing is deleted —
       only <link> tags inside <head> are modified.

SAFE TO RUN MULTIPLE TIMES — files that already have the new
favicon block are skipped automatically.
"""

import os
import re

# ------------------------------------------------------------------
# 1. THE NEW FAVICON BLOCK (copied exactly from your index.html)
# ------------------------------------------------------------------
NEW_FAVICON_BLOCK = '''    <link rel="icon" type="image/png" href="/favicon/favicon-96x96.png" sizes="96x96" />
    <link rel="icon" type="image/svg+xml" href="/favicon/favicon.svg" />
    <link rel="shortcut icon" href="/favicon/favicon.ico" />
    <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
    <link rel="manifest" href="/favicon/site.webmanifest" />
'''

# A short "signature" string used to detect whether a file already
# has the new block, so we don't add it twice.
NEW_BLOCK_SIGNATURE = '/favicon/favicon-96x96.png'

# ------------------------------------------------------------------
# 2. PATTERNS THAT MATCH OLD/LEGACY FAVICON LINES TO REMOVE
#    (covers the older style seen in your previous index.html,
#    plus common variants — case-insensitive, single or double quotes)
# ------------------------------------------------------------------
OLD_FAVICON_PATTERNS = [
    r'<link[^>]*rel=["\']apple-touch-icon["\'][^>]*>\s*',
    r'<link[^>]*rel=["\']icon["\'][^>]*sizes=["\']32x32["\'][^>]*>\s*',
    r'<link[^>]*rel=["\']icon["\'][^>]*sizes=["\']16x16["\'][^>]*>\s*',
    r'<link[^>]*rel=["\']manifest["\'][^>]*href=["\']\/site\.webmanifest["\'][^>]*>\s*',
    r'<link[^>]*rel=["\']shortcut icon["\'][^>]*>\s*',
]

# Root folder to scan — "." means the folder this script is run from
PROJECT_ROOT = "."


def find_html_files(root):
    """Recursively find every .html file, skipping common non-project folders."""
    skip_dirs = {'.git', 'node_modules', '.vscode'}
    html_files = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in skip_dirs]
        for name in filenames:
            if name.lower().endswith('.html'):
                html_files.append(os.path.join(dirpath, name))
    return html_files


def remove_old_favicon_links(html):
    """Strip out any legacy favicon <link> tags."""
    for pattern in OLD_FAVICON_PATTERNS:
        html = re.sub(pattern, '', html, flags=re.IGNORECASE)
    return html


def insert_new_favicon_block(html):
    """Insert the new favicon block right before </head>."""
    if '</head>' not in html:
        return html, False  # no <head> tag found — skip safely
    html = html.replace('</head>', NEW_FAVICON_BLOCK + '</head>', 1)
    return html, True


def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        original = f.read()

    if NEW_BLOCK_SIGNATURE in original:
        return 'skipped'  # already has the new favicon block

    updated = remove_old_favicon_links(original)
    updated, inserted = insert_new_favicon_block(updated)

    if not inserted:
        return 'no-head-tag'

    if updated != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(updated)
        return 'updated'

    return 'unchanged'


def main():
    html_files = find_html_files(PROJECT_ROOT)
    if not html_files:
        print("No .html files found. Make sure you're running this from your project root.")
        return

    updated, skipped, no_head, unchanged = [], [], [], []

    for filepath in html_files:
        result = process_file(filepath)
        if result == 'updated':
            updated.append(filepath)
        elif result == 'skipped':
            skipped.append(filepath)
        elif result == 'no-head-tag':
            no_head.append(filepath)
        else:
            unchanged.append(filepath)

    print(f"\nScanned {len(html_files)} HTML file(s).\n")

    if updated:
        print(f"✅ Updated ({len(updated)}):")
        for f in updated:
            print(f"   {f}")
    if skipped:
        print(f"\n⏭️  Already up to date ({len(skipped)}):")
        for f in skipped:
            print(f"   {f}")
    if no_head:
        print(f"\n⚠️  Skipped — no <head> tag found ({len(no_head)}):")
        for f in no_head:
            print(f"   {f}")

    print("\nDone. Review the changes with 'git status' / 'git diff' before committing.")


if __name__ == '__main__':
    main()
