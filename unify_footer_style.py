#!/usr/bin/env python3
"""
unify_footer_style.py — Leveny

Does three things in one run:

  1. COPYRIGHT TEXT — standardizes every footer on the site (desktop
     AND mobile variants) to:
         <a href="...">Disclaimer</a>
         <span> | Copyright © 2026 Leveny. All rights reserved.</span>
     Covers every footer selector used anywhere on the site:
         footer.copyright   #mobileFooter   #mobFooter
         #grFooter          .app-footer
     (.app-footer pages — comments.html, downloads.html, etc. — should
     already be correct; included anyway so the script is safe to
     re-run without assuming that.)

  2. FONT SIZE — sets font-size: 12px on those same footer blocks,
     but ONLY when the block is nested inside a mobile @media query
     (max-width <= 1024px by default — matching this site's own
     __isMobileViewport() breakpoint, see genre-results.html). A
     footer selector styled at the top level, or inside a desktop/
     min-width query, is left completely alone, so desktop footers
     never get resized. Only edits a block that already exists;
     never invents new footer CSS in a file that doesn't style one.
     Use --mobile-breakpoint to change the cutoff if your site uses
     a different one.

  3. GENERATOR PATCH — additionally patches generator.py itself (if
     found in the folder you point this at) so every movie page you
     generate from now on already has the standardized copyright text
     and the same font-size, with no manual follow-up needed.

Both HTML and CSS passes are safe to run more than once — an
already-correct block is left alone (reported as unchanged).

USAGE
-----
    python unify_footer_style.py "C:\\path\\to\\your\\site"
    python unify_footer_style.py "C:\\path\\to\\your\\site" --dry-run
    python unify_footer_style.py "C:\\path\\to\\your\\site" --no-backup

Requires: beautifulsoup4 (for the HTML passes — both the site-wide
scan and generator.py's embedded templates use it)
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

LINK_TEXT = "Disclaimer"
COPYRIGHT_TEXT = " | Copyright \u00A9 2026 Leveny. All rights reserved."
NEW_FONT_SIZE = "12px"  # only applied inside mobile @media blocks — see Part 2
MOBILE_MAX_WIDTH = 1024  # px; an @media max-width at or below this counts as "mobile"

FOOTER_SELECTORS = [
    "footer.copyright",
    "#mobileFooter",
    "#mobFooter",
    "#grFooter",
    ".app-footer",
]


# ----------------------------------------------------------------------
# Part 1 — copyright text (HTML footers, site-wide)
# ----------------------------------------------------------------------

def find_footers(soup):
    found = []
    for selector in FOOTER_SELECTORS:
        found.extend(soup.select(selector))
    return found


def fix_footer_text(soup, footer):
    link = footer.find("a")
    if link is None:
        return "skipped (no <a> link found inside)"

    link.string = LINK_TEXT

    copyright_span = None
    for sibling in link.next_siblings:
        if getattr(sibling, "name", None) == "span":
            copyright_span = sibling
            break

    if copyright_span is not None:
        if copyright_span.string == COPYRIGHT_TEXT:
            return None  # already correct
        copyright_span.string = COPYRIGHT_TEXT
        return "updated (existing copyright span)"

    new_span = soup.new_tag("span")
    new_span.string = COPYRIGHT_TEXT
    link.insert_after(new_span)
    return "updated (added copyright span)"


def process_html_text(path: Path, dry_run: bool, make_backup: bool):
    original_html = path.read_text(encoding="utf-8", errors="ignore")
    soup = BeautifulSoup(original_html, "html.parser")

    footers = find_footers(soup)
    if not footers:
        return []

    results = []
    for footer in footers:
        label = footer.get("id") or f"<{footer.name}.{'.'.join(footer.get('class', []))}>"
        status = fix_footer_text(soup, footer)
        if status:
            results.append(f"{label}: {status}")

    new_html = str(soup)
    if new_html != original_html and not dry_run:
        if make_backup:
            path.with_suffix(path.suffix + ".bak").write_text(original_html, encoding="utf-8")
        path.write_text(new_html, encoding="utf-8")

    return results


# ----------------------------------------------------------------------
# Part 2 — font-size (CSS files + embedded <style> blocks)
#   Mobile-only: a footer selector block only gets resized when it's
#   physically nested inside an @media rule whose max-width is <=
#   MOBILE_MAX_WIDTH. Anything at the top level, or inside a desktop /
#   min-width query, is left untouched.
# ----------------------------------------------------------------------

def _find_mobile_media_ranges(css_text: str, max_width: int):
    """
    Returns (content_start, content_end) index pairs for every top-level
    @media block in css_text whose condition contains a max-width value
    <= max_width. Only the block's CONTENTS (between its opening and
    matching closing brace) are returned — not the "@media (...) {"
    header itself — so replacements stay inside the rule body.

    Nested @media blocks aren't specially unwrapped (this codebase
    doesn't use them), but everything inside a matched range — nested
    rules included — is still scanned normally.
    """
    ranges = []
    for m in re.finditer(r"@media\s*([^{]*)\{", css_text):
        condition = m.group(1)
        is_mobile = any(
            int(w) <= max_width
            for w in re.findall(r"max-width\s*:\s*(\d+)", condition)
        )
        if not is_mobile:
            continue

        depth = 1
        i = m.end()
        while i < len(css_text) and depth > 0:
            if css_text[i] == "{":
                depth += 1
            elif css_text[i] == "}":
                depth -= 1
            i += 1
        ranges.append((m.end(), i - 1))  # i-1 = index of the matching "}"

    return ranges


def _resize_footers_in_segment(segment: str):
    count = 0

    for sel in FOOTER_SELECTORS:
        pattern = re.compile(re.escape(sel) + r"(\s*\{)([^}]*)(\})")

        def _fix_block(match, sel=sel):
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

        segment = pattern.sub(_fix_block, segment)

    return segment, count


def set_font_size_in_css_text(css_text: str, max_width: int = MOBILE_MAX_WIDTH):
    mobile_ranges = _find_mobile_media_ranges(css_text, max_width)
    if not mobile_ranges:
        return css_text, 0  # no mobile-scoped @media block here — nothing to touch

    new_text = css_text
    offset = 0
    total_count = 0

    for start, end in mobile_ranges:
        s, e = start + offset, end + offset
        segment = new_text[s:e]
        new_segment, seg_count = _resize_footers_in_segment(segment)
        if seg_count:
            new_text = new_text[:s] + new_segment + new_text[e:]
            offset += len(new_segment) - len(segment)
            total_count += seg_count

    return new_text, total_count


def process_css_file(path: Path, dry_run: bool, make_backup: bool, max_width: int = MOBILE_MAX_WIDTH) -> int:
    original = path.read_text(encoding="utf-8", errors="ignore")
    if not any(sel.lstrip("#.") in original for sel in FOOTER_SELECTORS):
        return 0

    new_css, count = set_font_size_in_css_text(original, max_width)
    if count == 0:
        return 0

    if not dry_run:
        if make_backup:
            path.with_suffix(path.suffix + ".bak").write_text(original, encoding="utf-8")
        path.write_text(new_css, encoding="utf-8")

    return count


def process_html_fontsize(path: Path, dry_run: bool, make_backup: bool, max_width: int = MOBILE_MAX_WIDTH) -> int:
    original_html = path.read_text(encoding="utf-8", errors="ignore")
    if not any(sel.lstrip("#.") in original_html for sel in FOOTER_SELECTORS):
        return 0

    soup = BeautifulSoup(original_html, "html.parser")
    total_count = 0

    for style_tag in soup.find_all("style"):
        block_text = style_tag.string
        if not block_text:
            continue
        new_css, count = set_font_size_in_css_text(block_text, max_width)
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


# ----------------------------------------------------------------------
# Part 3 — generator.py's templates (so future movie pages inherit both)
# ----------------------------------------------------------------------

def patch_generator(path: Path, dry_run: bool, make_backup: bool, max_width: int = MOBILE_MAX_WIDTH):
    original = path.read_text(encoding="utf-8", errors="ignore")
    content = original
    report = []

    # --- 3a. HTML_TEMPLATE footer(s): drop "!" and add the copyright span ---
    # Matches both the desktop <footer class="copyright"> and the
    # mobile #mobFooter div, however they're currently written.
    footer_re = re.compile(
        r'(<(?:footer[^>]*class="copyright"[^>]*|div[^>]*id="mobFooter"[^>]*)>)'
        r'(\s*<a\s+href="([^"]*disclaimer\.html)"[^>]*>)\s*Disclaimer!?\s*(</a>)'
        r'(\s*)(</(?:footer|div)>)',
        re.IGNORECASE
    )

    def _fix_template_footer(m):
        open_tag, a_open, href, a_close, ws, close_tag = m.groups()
        return (f'{open_tag}{a_open}Disclaimer{a_close}'
                f'<span>{COPYRIGHT_TEXT}</span>{ws}{close_tag}')

    new_content, n = footer_re.subn(_fix_template_footer, content)
    if n:
        content = new_content
        report.append(f"FIXED: {n} footer block(s) in HTML_TEMPLATE now include the copyright span.")
    else:
        report.append("OK (or not found): HTML_TEMPLATE footer(s) already correct, or pattern didn't match — verify manually.")

    # --- 3b. CSS_TEMPLATE footer font-size (mobile-scoped, same rule as Part 2) ---
    new_css_template, n = set_font_size_in_css_text(content, max_width)
    if n:
        content = new_css_template
        report.append(
            f"FIXED: {n} footer block(s) inside a mobile @media query in CSS_TEMPLATE "
            f"set to {NEW_FONT_SIZE}."
        )
    elif any(sel in content for sel in FOOTER_SELECTORS):
        report.append(
            "NOT FOUND (mobile-scoped): a footer selector exists in CSS_TEMPLATE but not "
            "inside a mobile @media block — left untouched so desktop styling isn't "
            "affected. If it's mobile-only despite that, wrap it in a media query or "
            "adjust generator.py manually."
        )
    else:
        report.append(
            "NOT FOUND: no footer selector block in CSS_TEMPLATE — if movie pages get "
            "their footer sizing from css/style.css instead, that file is covered "
            "separately by this script's normal recursive CSS scan."
        )

    if content != original and not dry_run:
        if make_backup:
            path.with_suffix(path.suffix + ".bak").write_text(original, encoding="utf-8")
        path.write_text(content, encoding="utf-8")

    return report


# ----------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Standardize footer copyright text + font-size site-wide, and patch generator.py so new movie pages inherit both."
    )
    parser.add_argument("folder", type=str, help="Folder to scan recursively (your repo root)")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without writing files")
    parser.add_argument("--no-backup", action="store_true", help="Skip creating .bak backups")
    parser.add_argument(
        "--mobile-breakpoint", type=int, default=MOBILE_MAX_WIDTH,
        help=f"Max-width (px) an @media query must be at or under to count as 'mobile' "
             f"for the font-size pass (default: {MOBILE_MAX_WIDTH})"
    )
    args = parser.parse_args()

    root = Path(args.folder)
    if not root.exists():
        sys.exit(f"Folder not found: {root}")

    dry_run = args.dry_run
    make_backup = not args.no_backup
    max_width = args.mobile_breakpoint

    html_files = sorted(set(root.rglob("*.html")) | set(root.rglob("*.htm")))
    css_files = sorted(root.rglob("*.css"))

    print(f"Scanning {len(html_files)} HTML file(s) and {len(css_files)} CSS file(s) under {root} ...\n")

    # --- Part 1: copyright text ---
    print("=== Copyright text ===")
    text_changed = 0
    for path in html_files:
        results = process_html_text(path, dry_run, make_backup)
        if results:
            text_changed += 1
            tag = "[DRY RUN] " if dry_run else ""
            print(f"{tag}{path}:")
            for r in results:
                print(f"    - {r}")
    print(f"{text_changed} file(s) had footer text updated.\n")

    # --- Part 2: font-size (mobile @media blocks only, max-width <= {max_width}px) ---
    print(f"=== Font size (mobile-scoped: @media max-width <= {max_width}px) ===")
    size_changed = 0
    size_fixes = 0
    for path in css_files:
        count = process_css_file(path, dry_run, make_backup, max_width)
        if count:
            size_changed += 1
            size_fixes += count
            tag = "[DRY RUN] " if dry_run else ""
            print(f"{tag}{path}: {count} footer block(s) set to {NEW_FONT_SIZE}")
    for path in html_files:
        count = process_html_fontsize(path, dry_run, make_backup, max_width)
        if count:
            size_changed += 1
            size_fixes += count
            tag = "[DRY RUN] " if dry_run else ""
            print(f"{tag}{path}: {count} footer block(s) set to {NEW_FONT_SIZE}")
    print(f"{size_changed} file(s) changed, {size_fixes} footer block(s) resized.\n")

    # --- Part 3: generator.py ---
    print("=== generator.py ===")
    generator_path = root / "generator.py"
    if generator_path.is_file():
        report = patch_generator(generator_path, dry_run, make_backup, max_width)
        for line in report:
            print(f"  - {line}")
    else:
        print("  generator.py not found in this folder — skipped.")

    print()
    if dry_run:
        print("(dry run — no files were actually written)")
    elif text_changed or size_changed or generator_path.is_file():
        print("Original versions of any changed file saved alongside it as *.bak (unless --no-backup was used).")


if __name__ == "__main__":
    main()
