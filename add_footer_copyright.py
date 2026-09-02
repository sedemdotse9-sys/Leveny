#!/usr/bin/env python3
"""
add_footer_copyright.py
=========================
Scans a folder (recursively) for .html/.htm files and standardizes the
footer content on every page to match the new Leveny footer:

    <a href="...">Disclaimer</a>
    <span> | Copyright © 2026 Leveny. All rights reserved.</span>

This targets BOTH the desktop and mobile footer, wherever they appear:
  - <footer class="copyright"> ... </footer>            (desktop, all pages)
  - <div id="mobileFooter"> ... </div>                  (homepage, genres.html)
  - <div id="mobFooter"> ... </div>                     (movie pages)
  - <div id="grFooter"> ... </div>                      (genre-results.html)

For each one found, this script:
  1. Keeps the existing <a href="..."> link path EXACTLY as it already is
     (so "disclaimer.html" on root pages and "../disclaimer.html" on
     movie pages both stay correct — nothing is rewritten or guessed).
  2. Sets the link's visible text to "Disclaimer" (drops a trailing "!"
     if the page still had the old "Disclaimer!" wording).
  3. Adds (or updates) a copyright line right after the link, matching
     the exact wording/format from the homepage.

Elements it can't confidently identify (e.g. a footer with no <a> tag
inside at all) are skipped and reported, not guessed at.

USAGE
-----
    python add_footer_copyright.py "C:\\path\\to\\your\\site"
    python add_footer_copyright.py "C:\\path\\to\\your\\site" --dry-run
    python add_footer_copyright.py "C:\\path\\to\\your\\site" --no-backup

Requires: beautifulsoup4
    pip install beautifulsoup4
    (Windows, if plain pip isn't recognized: py -m pip install beautifulsoup4)
"""

import argparse
import sys
from pathlib import Path

try:
    from bs4 import BeautifulSoup, NavigableString
except ImportError:
    sys.exit(
        "This script needs BeautifulSoup4. Install it with:\n"
        "    pip install beautifulsoup4"
    )

# ----------------------------------------------------------------------
# Config — the standardized footer text, taken from index.html
# ----------------------------------------------------------------------

LINK_TEXT = "Disclaimer"
COPYRIGHT_TEXT = " | Copyright \u00A9 2026 Leveny. All rights reserved."

# Every place a footer can live on this site.
FOOTER_SELECTORS = [
    ("footer.copyright", "css"),
    ("#mobileFooter", "css"),
    ("#mobFooter", "css"),
    ("#grFooter", "css"),
]


def find_footers(soup: BeautifulSoup):
    """Find every matching footer element in the document."""
    found = []
    for selector, _ in FOOTER_SELECTORS:
        found.extend(soup.select(selector))
    return found


def fix_footer(soup: BeautifulSoup, footer) -> str:
    """
    Standardize one footer element in place.
    Returns a short status string for reporting: 'updated', 'skipped'.
    """
    link = footer.find("a")
    if link is None:
        return "skipped (no <a> link found inside)"

    # 1. Normalize the link text (keep href untouched).
    link.string = LINK_TEXT

    # 2. Find an existing copyright <span> right after the link, if any.
    copyright_span = None
    for sibling in link.next_siblings:
        if getattr(sibling, "name", None) == "span":
            copyright_span = sibling
            break

    if copyright_span is not None:
        copyright_span.string = COPYRIGHT_TEXT
        return "updated (link + existing copyright span)"

    # No span yet — create one and insert it right after the link.
    new_span = soup.new_tag("span")
    new_span.string = COPYRIGHT_TEXT
    link.insert_after(new_span)
    return "updated (link + added new copyright span)"


def process_file(path: Path, dry_run: bool, make_backup: bool) -> list:
    original_html = path.read_text(encoding="utf-8", errors="ignore")
    soup = BeautifulSoup(original_html, "html.parser")

    footers = find_footers(soup)
    if not footers:
        return []

    results = []
    for footer in footers:
        label = footer.get("id") or f"<{footer.name}.{'.'.join(footer.get('class', []))}>"
        status = fix_footer(soup, footer)
        results.append(f"{label}: {status}")

    new_html = str(soup)
    if new_html != original_html and not dry_run:
        if make_backup:
            path.with_suffix(path.suffix + ".bak").write_text(original_html, encoding="utf-8")
        path.write_text(new_html, encoding="utf-8")

    return results


def main():
    parser = argparse.ArgumentParser(
        description="Standardize the Disclaimer link + copyright line across all footers on the site."
    )
    parser.add_argument("folder", type=str, help="Folder to scan recursively")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without writing files")
    parser.add_argument("--no-backup", action="store_true", help="Skip creating .bak backups")
    args = parser.parse_args()

    root = Path(args.folder)
    if not root.exists():
        sys.exit(f"Folder not found: {root}")

    html_files = sorted(set(root.rglob("*.html")) | set(root.rglob("*.htm")))
    if not html_files:
        print(f"No .html/.htm files found under {root}")
        return

    print(f"Scanning {len(html_files)} HTML file(s) under {root} ...\n")

    total_files_changed = 0

    for path in html_files:
        results = process_file(path, dry_run=args.dry_run, make_backup=not args.no_backup)
        if results:
            total_files_changed += 1
            tag = "[DRY RUN] " if args.dry_run else ""
            print(f"{tag}{path}:")
            for r in results:
                print(f"    - {r}")

    print(f"\nDone. {total_files_changed} file(s) had a footer updated.")
    if args.dry_run:
        print("(dry run — no files were actually written)")
    elif total_files_changed:
        print("Original versions saved alongside each file as *.html.bak")


if __name__ == "__main__":
    main()
