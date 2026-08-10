#!/usr/bin/env python3
"""
fix_rockwell_fonts.py
======================
Scans all .html files in a folder (recursively) and rewrites every
`font-family` declaration that references "Rockwell" so it uses the
Roboto Slab web font first, with Rockwell kept only as a local fallback.

This matches the fix already applied to mobile.css:
    font-family: Rockwell, sans-serif;
        -> font-family: "Roboto Slab", Rockwell, sans-serif;

It checks THREE places inside each HTML file:
  1. Inline style="..." attributes on any tag
  2. <style>...</style> blocks embedded in the page
  3. Adds the Google Fonts <link> for Roboto Slab into <head> if it's
     not already present (so the font actually loads on real devices)

USAGE
-----
    python3 fix_rockwell_fonts.py /path/to/site
    python3 fix_rockwell_fonts.py /path/to/site --dry-run
    python3 fix_rockwell_fonts.py /path/to/site --no-backup

By default the script:
  - Recursively finds every *.html / *.htm file under the given folder
  - Creates a ".bak" backup of each file it changes (skip with --no-backup)
  - Prints a summary of what it changed

Requires: beautifulsoup4
    pip install beautifulsoup4
"""

import argparse
import re
import sys
from pathlib import Path

try:
    from bs4 import BeautifulSoup
except ImportError:
    sys.exit(
        "This script needs BeautifulSoup4. Install it with:\n"
        "    pip install beautifulsoup4"
    )

# ----------------------------------------------------------------------
# Config
# ----------------------------------------------------------------------

GOOGLE_FONT_LINK_HREF = (
    "https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;600;700&display=swap"
)

ROBOTO_SLAB_STACK = '"Roboto Slab", Rockwell, sans-serif'

# Matches a font-family declaration whose value mentions Rockwell,
# in any quoting style: Rockwell | 'Rockwell' | "Rockwell"
# followed by whatever the rest of the stack was (sans-serif, etc.)
FONT_FAMILY_RE = re.compile(
    r"""font-family\s*:\s*                # the property
        (?P<value>[^;"']*                 # unquoted lead-in (rare)
            (['"]?Rockwell['"]?)           # the word Rockwell, optionally quoted
            [^;]*                         # rest of the stack, e.g. , sans-serif
        )
        (?=;|$)                            # up to the semicolon or end
    """,
    re.IGNORECASE | re.VERBOSE,
)


def already_fixed(value: str) -> bool:
    """True if Roboto Slab already appears before Rockwell in this value."""
    return "roboto slab" in value.lower()


def rebuild_font_family_value(value: str) -> str:
    """
    Given the raw value of a font-family declaration that contains
    Rockwell (e.g. `Rockwell, sans-serif` or `'Rockwell', sans-serif`),
    return a corrected value that leads with Roboto Slab.
    """
    if already_fixed(value):
        return value  # nothing to do

    # Pull out whatever generic fallback (sans-serif, serif, etc.) was
    # already present after Rockwell, if any, so we don't lose it.
    fallback_match = re.search(r",\s*([a-zA-Z\- ]+)\s*$", value)
    generic_fallback = fallback_match.group(1).strip() if fallback_match else "sans-serif"

    return f'"Roboto Slab", Rockwell, {generic_fallback}'


def fix_font_family_in_css_text(css_text: str) -> tuple[str, int]:
    """Run the regex substitution over a chunk of raw CSS text."""
    count = 0

    def _sub(match: re.Match) -> str:
        nonlocal count
        full = match.group(0)
        value = match.group("value")
        if already_fixed(value):
            return full
        new_value = rebuild_font_family_value(value)
        count += 1
        return f"font-family: {new_value}"

    new_css = FONT_FAMILY_RE.sub(_sub, css_text)
    return new_css, count


def ensure_google_font_link(soup: BeautifulSoup) -> bool:
    """
    Make sure the Roboto Slab Google Fonts <link> exists in <head>.
    Returns True if it had to be added.
    """
    head = soup.head
    if head is None:
        return False  # malformed document; don't try to guess

    for link in head.find_all("link"):
        href = link.get("href", "")
        if "fonts.googleapis.com" in href and "Roboto+Slab" in href:
            return False  # already present

    new_link = soup.new_tag(
        "link",
        rel="stylesheet",
        href=GOOGLE_FONT_LINK_HREF,
    )
    head.append(new_link)
    return True


def process_file(path: Path, dry_run: bool, make_backup: bool) -> dict:
    original_html = path.read_text(encoding="utf-8", errors="ignore")
    soup = BeautifulSoup(original_html, "html.parser")

    changes = {"inline_style_fixes": 0, "style_block_fixes": 0, "font_link_added": False}

    # 1. Inline style="..." attributes
    for tag in soup.find_all(style=True):
        original_style = tag["style"]
        if "rockwell" in original_style.lower():
            new_style, n = fix_font_family_in_css_text(original_style)
            if n:
                tag["style"] = new_style
                changes["inline_style_fixes"] += n

    # 2. <style>...</style> blocks
    for style_tag in soup.find_all("style"):
        if style_tag.string and "rockwell" in style_tag.string.lower():
            new_css, n = fix_font_family_in_css_text(style_tag.string)
            if n:
                style_tag.string.replace_with(new_css)
                changes["style_block_fixes"] += n

    # 3. Make sure the Roboto Slab font is actually loaded, but only
    #    bother if we changed something or the page already references
    #    Rockwell somewhere (inline styles, <style> blocks, or a linked
    #    stylesheet like mobile.css that we can't edit from here).
    mentions_rockwell = "rockwell" in original_html.lower()
    if mentions_rockwell:
        if ensure_google_font_link(soup):
            changes["font_link_added"] = True

    total_fixes = (
        changes["inline_style_fixes"]
        + changes["style_block_fixes"]
        + (1 if changes["font_link_added"] else 0)
    )

    if total_fixes == 0:
        return changes  # nothing to write

    new_html = str(soup)

    if not dry_run:
        if make_backup:
            backup_path = path.with_suffix(path.suffix + ".bak")
            backup_path.write_text(original_html, encoding="utf-8")
        path.write_text(new_html, encoding="utf-8")

    return changes


def main():
    parser = argparse.ArgumentParser(
        description="Fix Rockwell font-family references in HTML files "
        "by adding a Roboto Slab web-font fallback."
    )
    parser.add_argument(
        "folder",
        type=str,
        help="Path to the folder to scan recursively for .html/.htm files",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would change without writing any files",
    )
    parser.add_argument(
        "--no-backup",
        action="store_true",
        help="Skip creating .bak backup files before overwriting",
    )
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
    total_fixes = 0

    for path in html_files:
        result = process_file(path, dry_run=args.dry_run, make_backup=not args.no_backup)
        file_fixes = (
            result["inline_style_fixes"]
            + result["style_block_fixes"]
            + (1 if result["font_link_added"] else 0)
        )
        if file_fixes:
            total_files_changed += 1
            total_fixes += file_fixes
            tag = "[DRY RUN] " if args.dry_run else ""
            details = []
            if result["inline_style_fixes"]:
                details.append(f"{result['inline_style_fixes']} inline style fix(es)")
            if result["style_block_fixes"]:
                details.append(f"{result['style_block_fixes']} <style> block fix(es)")
            if result["font_link_added"]:
                details.append("added Roboto Slab <link>")
            print(f"{tag}{path}: " + ", ".join(details))

    print(f"\nDone. {total_files_changed} file(s) changed, {total_fixes} total fix(es).")
    if args.dry_run:
        print("(dry run — no files were actually written)")
    elif not args.no_backup and total_files_changed:
        print("Original versions saved alongside each file as *.html.bak")


if __name__ == "__main__":
    main()
