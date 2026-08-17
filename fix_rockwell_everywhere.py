#!/usr/bin/env python3
"""
fix_rockwell_everywhere.py
===========================
Scans a folder (recursively) for BOTH .css and .html/.htm files and
applies the same Rockwell fix everywhere it finds it:

    font-family: Rockwell, sans-serif;
        -> font-family: "Roboto Slab", Rockwell, sans-serif;

Why: Rockwell isn't installed on iOS/Android by default, so on real
phones it silently falls back to plain sans-serif. Roboto Slab is a
free Google Font that looks similar and actually loads on every
device. Rockwell is kept as a fallback for anyone who happens to have
it installed locally (e.g. some desktops).

WHAT IT TOUCHES
---------------
  .css files:
      - Every `font-family` declaration anywhere in the file that
        mentions Rockwell
      - Adds an `@import` for the Roboto Slab Google Font at the very
        top of the file, if not already present

  .html / .htm files:
      - Inline style="..." attributes on any tag
      - <style>...</style> blocks embedded in the page
      - Adds the Roboto Slab Google Fonts <link> to <head>, if the
        page mentions Rockwell but isn't already loading Roboto Slab

USAGE
-----
    python fix_rockwell_everywhere.py "C:\\path\\to\\your\\site"
    python fix_rockwell_everywhere.py "C:\\path\\to\\your\\site" --dry-run
    python fix_rockwell_everywhere.py "C:\\path\\to\\your\\site" --no-backup

By default the script backs up every file it changes as
"filename.ext.bak" before overwriting it. Use --no-backup to skip that.

Requires: beautifulsoup4 (only needed for the HTML handling)
    pip install beautifulsoup4
    (or, if plain pip isn't recognized on Windows:  py -m pip install beautifulsoup4)
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

GOOGLE_FONT_LINK_HREF = (
    "https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;600;700&display=swap"
)
GOOGLE_FONT_IMPORT_LINE = (
    f"@import url('{GOOGLE_FONT_LINK_HREF}');\n"
)

# Matches a font-family declaration whose value mentions Rockwell,
# quoted or unquoted, any casing, keeping whatever else was in the stack.
FONT_FAMILY_RE = re.compile(
    r"""font-family\s*:\s*
        (?P<value>[^;"']*
            (['"]?Rockwell['"]?)
            [^;]*
        )
        (?=;|$)
    """,
    re.IGNORECASE | re.VERBOSE,
)


def already_fixed(value: str) -> bool:
    return "roboto slab" in value.lower()


def rebuild_font_family_value(value: str) -> str:
    if already_fixed(value):
        return value
    fallback_match = re.search(r",\s*([a-zA-Z\- ]+)\s*$", value)
    generic_fallback = fallback_match.group(1).strip() if fallback_match else "sans-serif"
    return f'"Roboto Slab", Rockwell, {generic_fallback}'


def fix_font_family_in_css_text(css_text: str) -> tuple[str, int]:
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


# ----------------------------------------------------------------------
# CSS file handling
# ----------------------------------------------------------------------

def has_roboto_slab_import(css_text: str) -> bool:
    """True only if the font is actually being loaded (an @import or
    url() pointing at Google Fonts' Roboto Slab), not just referenced
    inside a font-family stack."""
    return bool(
        re.search(r"@import\s+url\([^)]*Roboto\+Slab", css_text, re.IGNORECASE)
        or re.search(r"fonts\.googleapis\.com[^)'\"]*Roboto\+Slab", css_text, re.IGNORECASE)
    )


def process_css_file(path: Path, dry_run: bool, make_backup: bool) -> dict:
    original = path.read_text(encoding="utf-8", errors="ignore")
    changes = {"font_family_fixes": 0, "import_added": False}

    if "rockwell" not in original.lower():
        return changes

    new_css, n = fix_font_family_in_css_text(original)
    changes["font_family_fixes"] = n

    if not has_roboto_slab_import(original):
        new_css = GOOGLE_FONT_IMPORT_LINE + new_css
        changes["import_added"] = True

    total = changes["font_family_fixes"] + (1 if changes["import_added"] else 0)
    if total == 0:
        return changes

    if not dry_run:
        if make_backup:
            path.with_suffix(path.suffix + ".bak").write_text(original, encoding="utf-8")
        path.write_text(new_css, encoding="utf-8")

    return changes


# ----------------------------------------------------------------------
# HTML file handling
# ----------------------------------------------------------------------

def ensure_google_font_link(soup) -> bool:
    head = soup.head
    if head is None:
        return False
    for link in head.find_all("link"):
        href = link.get("href", "")
        if "fonts.googleapis.com" in href and "Roboto+Slab" in href:
            return False
    new_link = soup.new_tag("link", rel="stylesheet", href=GOOGLE_FONT_LINK_HREF)
    head.append(new_link)
    return True


def process_html_file(path: Path, dry_run: bool, make_backup: bool) -> dict:
    original_html = path.read_text(encoding="utf-8", errors="ignore")
    changes = {"inline_style_fixes": 0, "style_block_fixes": 0, "font_link_added": False}

    if "rockwell" not in original_html.lower():
        return changes

    soup = BeautifulSoup(original_html, "html.parser")

    for tag in soup.find_all(style=True):
        original_style = tag["style"]
        if "rockwell" in original_style.lower():
            new_style, n = fix_font_family_in_css_text(original_style)
            if n:
                tag["style"] = new_style
                changes["inline_style_fixes"] += n

    for style_tag in soup.find_all("style"):
        if style_tag.string and "rockwell" in style_tag.string.lower():
            new_css, n = fix_font_family_in_css_text(style_tag.string)
            if n:
                style_tag.string.replace_with(new_css)
                changes["style_block_fixes"] += n

    if ensure_google_font_link(soup):
        changes["font_link_added"] = True

    total = (
        changes["inline_style_fixes"]
        + changes["style_block_fixes"]
        + (1 if changes["font_link_added"] else 0)
    )
    if total == 0:
        return changes

    new_html = str(soup)
    if not dry_run:
        if make_backup:
            path.with_suffix(path.suffix + ".bak").write_text(original_html, encoding="utf-8")
        path.write_text(new_html, encoding="utf-8")

    return changes


# ----------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Apply the Rockwell -> Roboto Slab fix to every .css and .html file in a folder."
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
            "(or on Windows if plain pip fails:  py -m pip install beautifulsoup4)\n"
        )
        html_files = []

    if not css_files and not html_files:
        print(f"No .css or .html/.htm files found under {root}")
        return

    print(f"Scanning {len(css_files)} CSS file(s) and {len(html_files)} HTML file(s) under {root} ...\n")

    total_files_changed = 0
    total_fixes = 0

    for path in css_files:
        result = process_css_file(path, dry_run=args.dry_run, make_backup=not args.no_backup)
        file_fixes = result["font_family_fixes"] + (1 if result["import_added"] else 0)
        if file_fixes:
            total_files_changed += 1
            total_fixes += file_fixes
            tag = "[DRY RUN] " if args.dry_run else ""
            details = []
            if result["font_family_fixes"]:
                details.append(f"{result['font_family_fixes']} font-family fix(es)")
            if result["import_added"]:
                details.append("added Roboto Slab @import")
            print(f"{tag}{path}: " + ", ".join(details))

    for path in html_files:
        result = process_html_file(path, dry_run=args.dry_run, make_backup=not args.no_backup)
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
        print("Original versions saved alongside each file as *.bak")


if __name__ == "__main__":
    main()
