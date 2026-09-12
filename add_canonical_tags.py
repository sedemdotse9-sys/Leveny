#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
add_canonical_tags.py — Leveny canonical tag backfill

Scans every LIVE html page on the site and inserts (or corrects) a
self-referencing <link rel="canonical"> tag in its <head>, pointing at
the page's real https://leveny.online/... URL.

Run this once from the root of your repo (same folder as index.html):

    python add_canonical_tags.py

Safe to re-run any time: pages that already have the right canonical
tag are left alone, pages with a wrong one get corrected, and pages
with none get one added. It only touches *.html files, and skips:
  - *.html.bak backup files
  - __pycache__ / .git / .vscode
  - templates/  (the local generator form, not part of the live site)
"""

import os
import re

# ----------------------------------------------------------------------
# Config — change SITE_ROOT if you're running this from somewhere else
# ----------------------------------------------------------------------
SITE_ROOT = os.path.dirname(os.path.abspath(__file__))
BASE_URL = "https://leveny.online"

EXCLUDE_DIRS = {".git", "__pycache__", ".vscode", "templates", "node_modules"}

CANONICAL_RE = re.compile(
    r'<link\s+[^>]*rel=["\']canonical["\'][^>]*/?>\s*',
    re.IGNORECASE,
)


def canonical_url_for(rel_path):
    """
    rel_path is the file's path relative to SITE_ROOT, forward-slashed,
    e.g. 'movies/365_days_movie.html' or 'Genres.html'.

    The homepage canonicalizes to the bare root URL. Every other page
    keeps its exact on-disk filename/case, since that's what's actually
    served (GitHub Pages is case-sensitive).
    """
    rel_path = rel_path.replace(os.sep, "/")
    if rel_path == "index.html":
        return BASE_URL + "/"
    return f"{BASE_URL}/{rel_path}"


def find_html_files(root):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        for name in filenames:
            if name.lower().endswith(".html") and not name.lower().endswith(".html.bak"):
                full = os.path.join(dirpath, name)
                rel = os.path.relpath(full, root)
                yield full, rel.replace(os.sep, "/")


def upsert_canonical(html, canonical_url):
    """
    Returns (new_html, changed). Replaces an existing canonical tag if
    it points to the wrong URL, or inserts a new one right after
    </title> (falling back to right after <head> if there's no title).
    """
    tag = f'<link href="{canonical_url}" rel="canonical"/>'

    existing = CANONICAL_RE.search(html)
    if existing:
        current_tag = existing.group(0)
        if f'"{canonical_url}"' in current_tag or f"'{canonical_url}'" in current_tag:
            return html, False  # already correct, leave it alone
        new_html = CANONICAL_RE.sub(tag + "\n", html, count=1)
        return new_html, True

    if re.search(r"</title>", html, re.IGNORECASE):
        new_html = re.sub(
            r"(</title>)",
            r"\1\n" + tag,
            html,
            count=1,
            flags=re.IGNORECASE,
        )
    else:
        new_html = re.sub(
            r"(<head[^>]*>)",
            r"\1\n" + tag,
            html,
            count=1,
            flags=re.IGNORECASE,
        )
    return new_html, True


def main():
    checked = updated = unchanged = 0

    for full_path, rel_path in find_html_files(SITE_ROOT):
        checked += 1
        canonical_url = canonical_url_for(rel_path)

        with open(full_path, "r", encoding="utf-8") as f:
            html = f.read()

        new_html, changed = upsert_canonical(html, canonical_url)

        if changed:
            with open(full_path, "w", encoding="utf-8") as f:
                f.write(new_html)
            print(f"[updated]   {rel_path}  ->  {canonical_url}")
            updated += 1
        else:
            print(f"[unchanged] {rel_path}")
            unchanged += 1

    print(f"\nDone. {checked} pages scanned, {updated} updated, {unchanged} already correct.")


if __name__ == "__main__":
    main()
