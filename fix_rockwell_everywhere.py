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


# ----------------------------------------------------------------------
# Footer style normalization (color / font-size / centering)
# ----------------------------------------------------------------------
# Pulled from #mobFooter in your movie-page stylesheets:
#     text-align: center;               (the "position" — centers the text)
#     font-size: 15px;
#     color: var(--mob-accent, ...);    (footer link color)
#
# The color is applied as a CSS *variable reference*, not a literal color,
# since every page defines its own --mob-accent (a different accent color
# per genre). Using var(--mob-accent, <fallback>) means each file keeps
# its own theme color automatically — only the fallback kicks in if a
# file has no accent variable at all (e.g. your homepage mobile.css,
# which uses --accent instead of --mob-accent).
FOOTER_SELECTORS = ["#mobFooter", "#mobileFooter"]
FOOTER_LINK_SELECTORS = ["#mobFooter a", "#mobileFooter a"]
FOOTER_FONT_SIZE = "15px"
FOOTER_ACCENT_FALLBACK = "#f39c12"


def _footer_color_value(css_text: str) -> str:
    """Prefer var(--mob-accent, ...) if that variable is defined in this
    file; fall back to var(--accent, ...) if that's what the file uses
    instead (e.g. the homepage's mobile.css); otherwise use a plain
    fallback color."""
    if re.search(r"--mob-accent\s*:", css_text, re.IGNORECASE):
        return f"var(--mob-accent, {FOOTER_ACCENT_FALLBACK})"
    if re.search(r"--accent\s*:", css_text, re.IGNORECASE):
        return f"var(--accent, {FOOTER_ACCENT_FALLBACK})"
    return FOOTER_ACCENT_FALLBACK


def normalize_footer_style(css_text: str) -> tuple[str, int]:
    """Only touches footer blocks that ALREADY exist in the file
    (#mobFooter / #mobileFooter). Never invents new footer styling in
    files that don't have one."""
    count = 0
    color_value = _footer_color_value(css_text)

    for sel in FOOTER_SELECTORS:
        pattern = re.compile(re.escape(sel) + r"(\s*\{)([^}]*)(\})")

        def _fix_block(match: re.Match) -> str:
            nonlocal count
            opener, body, closer = match.group(1), match.group(2), match.group(3)
            new_body = body

            if re.search(r"font-size\s*:\s*[^;]+;", new_body, re.IGNORECASE):
                replaced = re.sub(
                    r"font-size\s*:\s*[^;]+;",
                    f"font-size: {FOOTER_FONT_SIZE};",
                    new_body,
                    flags=re.IGNORECASE,
                )
                if replaced != new_body:
                    count += 1
                new_body = replaced
            else:
                new_body = new_body.rstrip() + f"\n    font-size: {FOOTER_FONT_SIZE};"
                count += 1

            if not re.search(r"text-align\s*:\s*center\s*;", new_body, re.IGNORECASE):
                new_body = new_body.rstrip() + "\n    text-align: center;"
                count += 1

            return f"{sel}{opener}{new_body}\n{closer}"

        css_text = pattern.sub(_fix_block, css_text)

    for sel in FOOTER_LINK_SELECTORS:
        pattern = re.compile(re.escape(sel) + r"(\s*\{)([^}]*)(\})")

        def _fix_link_block(match: re.Match) -> str:
            nonlocal count
            opener, body, closer = match.group(1), match.group(2), match.group(3)
            if re.search(r"color\s*:\s*[^;]+;", body, re.IGNORECASE):
                new_body = re.sub(
                    r"color\s*:\s*[^;]+;",
                    f"color: {color_value};",
                    body,
                    flags=re.IGNORECASE,
                )
            else:
                new_body = body.rstrip() + f"\n    color: {color_value};"
            if new_body != body:
                count += 1
            return f"{sel}{opener}{new_body}\n{closer}"

        css_text = pattern.sub(_fix_link_block, css_text)

    return css_text, count


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
    changes = {"font_family_fixes": 0, "import_added": False, "footer_fixes": 0}
    new_css = original

    if "rockwell" in original.lower():
        new_css, n = fix_font_family_in_css_text(new_css)
        changes["font_family_fixes"] = n

        if not has_roboto_slab_import(original):
            new_css = GOOGLE_FONT_IMPORT_LINE + new_css
            changes["import_added"] = True

    # Footer normalization runs independently of the Rockwell check —
    # it only fires if the file already has a #mobFooter/#mobileFooter
    # block to normalize.
    if any(sel in original for sel in FOOTER_SELECTORS):
        new_css, footer_n = normalize_footer_style(new_css)
        changes["footer_fixes"] = footer_n

    total = (
        changes["font_family_fixes"]
        + (1 if changes["import_added"] else 0)
        + changes["footer_fixes"]
    )
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
    changes = {
        "inline_style_fixes": 0,
        "style_block_fixes": 0,
        "font_link_added": False,
        "footer_fixes": 0,
    }

    has_rockwell = "rockwell" in original_html.lower()
    has_footer = any(sel in original_html for sel in FOOTER_SELECTORS)

    if not has_rockwell and not has_footer:
        return changes

    soup = BeautifulSoup(original_html, "html.parser")

    if has_rockwell:
        for tag in soup.find_all(style=True):
            original_style = tag["style"]
            if "rockwell" in original_style.lower():
                new_style, n = fix_font_family_in_css_text(original_style)
                if n:
                    tag["style"] = new_style
                    changes["inline_style_fixes"] += n

    # <style> blocks get BOTH the Rockwell fix and footer normalization,
    # since a page's mobile styles sometimes live directly in the HTML
    # instead of a separate .css file.
    for style_tag in soup.find_all("style"):
        block_text = style_tag.string
        if not block_text:
            continue

        new_css = block_text
        block_changed = False

        if "rockwell" in block_text.lower():
            new_css, n = fix_font_family_in_css_text(new_css)
            if n:
                changes["style_block_fixes"] += n
                block_changed = True

        if any(sel in block_text for sel in FOOTER_SELECTORS):
            new_css, footer_n = normalize_footer_style(new_css)
            if footer_n:
                changes["footer_fixes"] += footer_n
                block_changed = True

        if block_changed:
            style_tag.string.replace_with(new_css)

    if has_rockwell and ensure_google_font_link(soup):
        changes["font_link_added"] = True

    total = (
        changes["inline_style_fixes"]
        + changes["style_block_fixes"]
        + changes["footer_fixes"]
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
        file_fixes = (
            result["font_family_fixes"]
            + (1 if result["import_added"] else 0)
            + result["footer_fixes"]
        )
        if file_fixes:
            total_files_changed += 1
            total_fixes += file_fixes
            tag = "[DRY RUN] " if args.dry_run else ""
            details = []
            if result["font_family_fixes"]:
                details.append(f"{result['font_family_fixes']} font-family fix(es)")
            if result["import_added"]:
                details.append("added Roboto Slab @import")
            if result["footer_fixes"]:
                details.append(f"{result['footer_fixes']} footer style fix(es)")
            print(f"{tag}{path}: " + ", ".join(details))

    for path in html_files:
        result = process_html_file(path, dry_run=args.dry_run, make_backup=not args.no_backup)
        file_fixes = (
            result["inline_style_fixes"]
            + result["style_block_fixes"]
            + result["footer_fixes"]
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
            if result["footer_fixes"]:
                details.append(f"{result['footer_fixes']} footer style fix(es)")
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
