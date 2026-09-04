#!/usr/bin/env python3
"""
set_mobile_footer_fontsize.py
================================
Scans a folder (recursively) for .css and .html/.htm files and sets
font-size: 8px on every mobile footer block found — covering all the
mobile footer IDs used across the site:

    #mobileFooter   (homepage, genres.html)
    #mobFooter      (movie pages)
    #grFooter       (genre-results.html)

For CSS files: finds each selector's block and sets/replaces its
font-size declaration.

For HTML files: does the same inside any embedded <style> blocks
(for pages where the mobile CSS lives directly in the HTML instead of
a separate .css file).

Only touches blocks that ALREADY exist for these selectors — it won't
create new footer styling in files that don't have one.

USAGE
-----
    python set_mobile_footer_fontsize.py "C:\\path\\to\\your\\site"
    python set_mobile_footer_fontsize.py "C:\\path\\to\\your\\site" --dry-run
    python set_mobile_footer_fontsize.py "C:\\path\\to\\your\\site" --no-backup

Requires: beautifulsoup4 (only needed for the HTML handling)
    pip install beautifulsoup4
    (Windows, if plain pip isn't recognized: py -m pip install beautifulsoup4)
"""

import argparse
import re
import sys
from pathlib import Path

try:
    from bs4 import BeautifulSoup
    HAVE_BS4 = True
except ImportError:
    HAVE_BS4 = False

# ----------------------------------------------------------------------
# Config
# ----------------------------------------------------------------------

FOOTER_SELECTORS = ["#mobileFooter", "#mobFooter", "#grFooter"]
NEW_FONT_SIZE = "8px"


def set_font_size_in_css_text(css_text: str) -> tuple[str, int]:
    """
    For each footer selector's block found in css_text, set/replace its
    font-size declaration. Returns (new_text, number_of_blocks_changed).
    """
    count = 0

    for sel in FOOTER_SELECTORS:
        pattern = re.compile(re.escape(sel) + r"(\s*\{)([^}]*)(\})")

        def _fix_block(match: re.Match) -> str:
            nonlocal count
            opener, body, closer = match.group(1), match.group(2), match.group(3)

            if re.search(r"font-size\s*:\s*[^;]+;", body, re.IGNORECASE):
                new_body = re.sub(
                    r"font-size\s*:\s*[^;]+;",
                    f"font-size: {NEW_FONT_SIZE};",
                    body,
                    flags=re.IGNORECASE,
                )
            else:
                new_body = body.rstrip() + f"\n    font-size: {NEW_FONT_SIZE};"

            if new_body != body:
                count += 1

            return f"{sel}{opener}{new_body}\n{closer}"

        css_text = pattern.sub(_fix_block, css_text)

    return css_text, count


def process_css_file(path: Path, dry_run: bool, make_backup: bool) -> int:
    original = path.read_text(encoding="utf-8", errors="ignore")

    if not any(sel in original for sel in FOOTER_SELECTORS):
        return 0

    new_css, count = set_font_size_in_css_text(original)
    if count == 0:
        return 0

    if not dry_run:
        if make_backup:
            path.with_suffix(path.suffix + ".bak").write_text(original, encoding="utf-8")
        path.write_text(new_css, encoding="utf-8")

    return count


def process_html_file(path: Path, dry_run: bool, make_backup: bool) -> int:
    original_html = path.read_text(encoding="utf-8", errors="ignore")

    if not any(sel in original_html for sel in FOOTER_SELECTORS):
        return 0

    soup = BeautifulSoup(original_html, "html.parser")
    total_count = 0

    for style_tag in soup.find_all("style"):
        block_text = style_tag.string
        if not block_text:
            continue
        if not any(sel in block_text for sel in FOOTER_SELECTORS):
            continue

        new_css, count = set_font_size_in_css_text(block_text)
        if count:
            style_tag.string.replace_with(new_css)
            total_count += count

    if total_count == 0:
        return 0

    new_html = str(soup)
    if not dry_run:
        if make_backup:
            path.with_suffix(path.suffix + ".bak").write_text(original_html, encoding="utf-8")
        path.write_text(new_html, encoding="utf-8")

    return total_count


def main():
    parser = argparse.ArgumentParser(
        description="Set font-size: 8px on all mobile footer blocks (#mobileFooter, #mobFooter, #grFooter)."
    )
    parser.add_argument("folder", type=str, help="Folder to scan recursively")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without writing files")
    parser.add_argument("--no-backup", action="store_true", help="Skip creating .bak backups")
    args = parser.parse_args()

    root = Path(args.folder)
    if not root.exists():
        sys.exit(f"Folder not found: {root}")

    css_files = sorted(root.rglob("*.css"))
    html_files = sorted(set(root.rglob("*.html")) | set(root.rglob("*.htm")))

    if html_files and not HAVE_BS4:
        print(
            "Note: beautifulsoup4 isn't installed, so .html/.htm files will be skipped.\n"
            "Install it with:  pip install beautifulsoup4\n"
        )
        html_files = []

    print(f"Scanning {len(css_files)} CSS file(s) and {len(html_files)} HTML file(s) under {root} ...\n")

    total_files_changed = 0
    total_fixes = 0

    for path in css_files:
        count = process_css_file(path, dry_run=args.dry_run, make_backup=not args.no_backup)
        if count:
            total_files_changed += 1
            total_fixes += count
            tag = "[DRY RUN] " if args.dry_run else ""
            print(f"{tag}{path}: {count} footer block(s) set to {NEW_FONT_SIZE}")

    for path in html_files:
        count = process_html_file(path, dry_run=args.dry_run, make_backup=not args.no_backup)
        if count:
            total_files_changed += 1
            total_fixes += count
            tag = "[DRY RUN] " if args.dry_run else ""
            print(f"{tag}{path}: {count} footer block(s) set to {NEW_FONT_SIZE}")

    print(f"\nDone. {total_files_changed} file(s) changed, {total_fixes} footer block(s) updated.")
    if args.dry_run:
        print("(dry run — no files were actually written)")
    elif total_files_changed:
        print("Original versions saved alongside each file as *.bak")


if __name__ == "__main__":
    main()
