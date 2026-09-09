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

  2. FONT SIZE — sets font-size: 15px on every one of those same
     footer blocks, wherever they're styled (a .css file, or an
     embedded <style> block in an .html file) — matching the size
     comments.html's footer already uses (app.css's .app-footer).
     Only edits a block that already exists; never invents new footer
     CSS in a file that doesn't style one.

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
NEW_FONT_SIZE = "15px"  # matches comments.html's footer (app.css .app-footer)

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
# ----------------------------------------------------------------------

def set_font_size_in_css_text(css_text: str):
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

        css_text = pattern.sub(_fix_block, css_text)

    return css_text, count


def process_css_file(path: Path, dry_run: bool, make_backup: bool) -> int:
    original = path.read_text(encoding="utf-8", errors="ignore")
    if not any(sel.lstrip("#.") in original for sel in FOOTER_SELECTORS):
        return 0

    new_css, count = set_font_size_in_css_text(original)
    if count == 0:
        return 0

    if not dry_run:
        if make_backup:
            path.with_suffix(path.suffix + ".bak").write_text(original, encoding="utf-8")
        path.write_text(new_css, encoding="utf-8")

    return count


def process_html_fontsize(path: Path, dry_run: bool, make_backup: bool) -> int:
    original_html = path.read_text(encoding="utf-8", errors="ignore")
    if not any(sel.lstrip("#.") in original_html for sel in FOOTER_SELECTORS):
        return 0

    soup = BeautifulSoup(original_html, "html.parser")
    total_count = 0

    for style_tag in soup.find_all("style"):
        block_text = style_tag.string
        if not block_text:
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


# ----------------------------------------------------------------------
# Part 3 — generator.py's templates (so future movie pages inherit both)
# ----------------------------------------------------------------------

def patch_generator(path: Path, dry_run: bool, make_backup: bool):
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

    # --- 3b. CSS_TEMPLATE #mobFooter font-size ---
    mobfooter_css_re = re.compile(r'(#mobFooter\s*\{)([^}]*)(\})')
    match = mobfooter_css_re.search(content)
    if match:
        opener, body, closer = match.groups()
        if re.search(r"font-size\s*:\s*[^;]+;", body, re.IGNORECASE):
            new_body = re.sub(r"font-size\s*:\s*[^;]+;", f"font-size: {NEW_FONT_SIZE};", body, flags=re.IGNORECASE)
        else:
            new_body = body.rstrip() + f"\n    font-size: {NEW_FONT_SIZE};"
        if new_body != body:
            content = content[:match.start()] + opener + new_body + "\n" + closer + content[match.end():]
            report.append(f"FIXED: #mobFooter font-size in CSS_TEMPLATE set to {NEW_FONT_SIZE}.")
        else:
            report.append("OK: #mobFooter font-size in CSS_TEMPLATE already correct.")
    else:
        report.append(
            "NOT FOUND: no #mobFooter block in CSS_TEMPLATE — if movie pages get their "
            "footer sizing from css/style.css instead, that file is covered separately "
            "by this script's normal recursive CSS scan, not this generator.py-specific step."
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
    args = parser.parse_args()

    root = Path(args.folder)
    if not root.exists():
        sys.exit(f"Folder not found: {root}")

    dry_run = args.dry_run
    make_backup = not args.no_backup

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

    # --- Part 2: font-size ---
    print("=== Font size ===")
    size_changed = 0
    size_fixes = 0
    for path in css_files:
        count = process_css_file(path, dry_run, make_backup)
        if count:
            size_changed += 1
            size_fixes += count
            tag = "[DRY RUN] " if dry_run else ""
            print(f"{tag}{path}: {count} footer block(s) set to {NEW_FONT_SIZE}")
    for path in html_files:
        count = process_html_fontsize(path, dry_run, make_backup)
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
        report = patch_generator(generator_path, dry_run, make_backup)
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
