#!/usr/bin/env python3
"""
fix_fullscreen_blur.py — Leveny

Bulk-fixes the "fullscreen button does nothing" bug caused by CSS filter
containing blocks.

THE BUG:
    #mobFrostWrap.unblurred iframe { filter: blur(0); }
    .frost-wrap.unblurred iframe   { filter: blur(0); }

Any non-"none" value of the CSS `filter` property — including blur(0),
which is visually identical to no blur at all — creates a new CSS
containing block. Browsers refuse to let a descendant iframe's
requestFullscreen() call escape that containing block, so the fullscreen
button silently does nothing. There's no console error because the
failure happens inside the (usually cross-origin) iframe's own content.

THE FIX:
    filter: blur(0);   ->   filter: none;
    -webkit-filter: blur(0);   ->   -webkit-filter: none;

This script scans a directory tree for .css and .html files and applies
that fix wherever it finds `filter: blur(0)` (or blur(0px), with any
spacing) — for BOTH the mobile (#mobFrostWrap) and desktop (.frost-wrap)
patterns, since they're the same underlying bug.

It does NOT touch any other blur value (blur(10px), blur(20px), etc.) —
those are the intentional "still blurred" state and are left alone.

USAGE:
    # Preview what would change, without touching any files:
    python3 fix_fullscreen_blur.py /path/to/your/site --dry-run

    # Actually apply the fix:
    python3 fix_fullscreen_blur.py /path/to/your/site

    # Default target directory is the current directory if omitted:
    python3 fix_fullscreen_blur.py
"""

import argparse
import re
import sys
from pathlib import Path

# Matches: filter: blur(0);  |  -webkit-filter: blur( 0px ) ;  | filter:blur(0)
# Captures the optional "-webkit-" prefix so it's preserved in the replacement.
PATTERN = re.compile(
    r'(-webkit-)?filter\s*:\s*blur\(\s*0(?:px)?\s*\)\s*;?',
    re.IGNORECASE,
)

TARGET_EXTENSIONS = {'.css', '.html', '.htm'}


def fix_content(text: str):
    """Returns (new_text, number_of_replacements)."""
    def replacer(match):
        prefix = match.group(1) or ''
        return f'{prefix}filter: none;'

    new_text, count = PATTERN.subn(replacer, text)
    return new_text, count


def main():
    parser = argparse.ArgumentParser(
        description="Bulk-fix the filter:blur(0) fullscreen bug in CSS/HTML files."
    )
    parser.add_argument(
        'directory',
        nargs='?',
        default='.',
        help="Directory to scan recursively (default: current directory)",
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help="Show what would change without writing any files",
    )
    args = parser.parse_args()

    root = Path(args.directory)
    if not root.exists():
        print(f"Error: directory not found: {root}")
        sys.exit(1)

    files_changed = 0
    total_replacements = 0
    skipped_errors = []

    all_files = sorted(
        p for p in root.rglob('*')
        if p.is_file() and p.suffix.lower() in TARGET_EXTENSIONS
    )

    if not all_files:
        print(f"No .css/.html files found under {root.resolve()}")
        return

    print(f"Scanning {len(all_files)} file(s) under {root.resolve()} ...\n")

    for path in all_files:
        try:
            original = path.read_text(encoding='utf-8')
        except Exception as e:
            skipped_errors.append((path, str(e)))
            continue

        fixed, count = fix_content(original)

        if count > 0:
            files_changed += 1
            total_replacements += count
            rel = path.relative_to(root) if root != Path('.') else path
            action = "Would fix" if args.dry_run else "Fixed"
            print(f"  {action}: {rel}  ({count} occurrence{'s' if count != 1 else ''})")

            if not args.dry_run:
                path.write_text(fixed, encoding='utf-8')

    print()
    if files_changed == 0:
        print("No occurrences of filter: blur(0) found. Nothing to fix.")
    else:
        verb = "Would update" if args.dry_run else "Updated"
        print(f"{verb} {files_changed} file(s), {total_replacements} total replacement(s).")
        if args.dry_run:
            print("Run again without --dry-run to actually apply these changes.")

    if skipped_errors:
        print(f"\n{len(skipped_errors)} file(s) could not be read and were skipped:")
        for path, err in skipped_errors:
            print(f"  {path}: {err}")


if __name__ == '__main__':
    main()
