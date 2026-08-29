#!/usr/bin/env python3
"""
fix_data_movie.py

Scans a directory tree for .html files, figures out each page's movie title,
and makes sure every `data-movie="..."` attribute on the broken-link buttons
(class="broken-link" or class="mob-broken-link") matches that title.

Usage:
    python fix_data_movie.py [root_dir] [--dry-run]

    root_dir    Directory to scan recursively (default: current directory)
    --dry-run   Show what would change without writing any files

Requires: beautifulsoup4  (pip install beautifulsoup4)
"""

import argparse
import re
import sys
from pathlib import Path

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("This script needs BeautifulSoup. Install it with:\n"
          "    pip install beautifulsoup4", file=sys.stderr)
    sys.exit(1)


# Regex that matches a whole <a ...> opening tag whose class list contains
# "broken-link" or "mob-broken-link", capturing the tag so we can rewrite
# just its data-movie value without disturbing anything else in the file.
BROKEN_LINK_TAG_RE = re.compile(
    r'<a\b[^>]*class="[^"]*\b(?:broken-link|mob-broken-link)\b[^"]*"[^>]*>',
    re.IGNORECASE,
)

# Regex that matches a data-movie="..." attribute within a tag.
DATA_MOVIE_ATTR_RE = re.compile(r'data-movie="[^"]*"')


def extract_title(soup: BeautifulSoup) -> str | None:
    """
    Try several likely spots (in priority order) to find the real movie
    title for this page, matching the structure used in the Leveny template.
    """
    # 1. Desktop title: <h3 class="movie-title">TITLE</h3>
    tag = soup.select_one("h3.movie-title")
    if tag and tag.get_text(strip=True):
        return tag.get_text(strip=True)

    # 2. Mobile title: <div id="mobMovieTitle">TITLE</div>
    tag = soup.select_one("#mobMovieTitle")
    if tag and tag.get_text(strip=True):
        return tag.get_text(strip=True)

    # 3. Fallback: <title>MOVIE NAME | Leveny</title>
    if soup.title and soup.title.get_text(strip=True):
        raw = soup.title.get_text(strip=True)
        return raw.split("|")[0].strip()

    return None


def fix_file(path: Path, dry_run: bool = False) -> str:
    """
    Process a single HTML file. Returns a short status string for logging.
    """
    original_text = path.read_text(encoding="utf-8")
    soup = BeautifulSoup(original_text, "html.parser")

    title = extract_title(soup)
    if not title:
        return "SKIP (no title found)"

    # Normalize whitespace, keep title-case as authored on the page.
    title = re.sub(r"\s+", " ", title).strip()

    def replace_tag(match: re.Match) -> str:
        tag_text = match.group(0)
        new_attr = f'data-movie="{title}"'
        if "data-movie=" in tag_text:
            return DATA_MOVIE_ATTR_RE.sub(new_attr, tag_text, count=1)
        else:
            # No data-movie attribute yet — add one just before the closing '>'
            return tag_text[:-1].rstrip() + f' {new_attr}>'

    new_text, num_replacements = BROKEN_LINK_TAG_RE.subn(replace_tag, original_text)

    if num_replacements == 0:
        return f"SKIP (no broken-link buttons found) [title: {title}]"

    if new_text == original_text:
        return f"OK, already correct [title: {title}]"

    if not dry_run:
        path.write_text(new_text, encoding="utf-8")

    return f"UPDATED {num_replacements} link(s) -> data-movie=\"{title}\""


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root_dir", nargs="?", default=".", help="Directory to scan")
    parser.add_argument("--dry-run", action="store_true",
                         help="Report changes without writing files")
    args = parser.parse_args()

    root = Path(args.root_dir).resolve()
    if not root.is_dir():
        print(f"Not a directory: {root}", file=sys.stderr)
        sys.exit(1)

    html_files = sorted(root.rglob("*.html"))
    if not html_files:
        print(f"No .html files found under {root}")
        return

    print(f"Scanning {len(html_files)} HTML file(s) under {root}"
          f"{' (dry run)' if args.dry_run else ''}...\n")

    for path in html_files:
        rel = path.relative_to(root)
        try:
            status = fix_file(path, dry_run=args.dry_run)
        except Exception as exc:  # keep going even if one file misbehaves
            status = f"ERROR: {exc}"
        print(f"{rel}: {status}")


if __name__ == "__main__":
    main()
