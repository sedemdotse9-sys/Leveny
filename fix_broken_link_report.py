#!/usr/bin/env python3
"""
fix_broken_link_report.py

Your Meg/Beekeeper-style pages use a WORKING broken-link reporter: real
Formspree endpoint, proper e.preventDefault(), actual fetch() with success/
failure handling. Other pages (e.g. Little Mermaid) still use an OLD FAKE
version: a mailto: link plus a bare setTimeout that shows "Thanks,
reported!" after 350ms regardless of whether anything was actually sent.

This script finds every page still using the old fake version and upgrades
it to match the working one:

  1. HTML: <a class="broken-link"  href="mailto:...">  ->
           <a class="broken-link"  href="#" data-movie="MOVIE TITLE">
     (same for class="mob-broken-link"). The movie title is read from the
     page's own <title>MOVIE | Leveny</title> tag, so no hardcoding needed.

  2. JS: the old setTimeout-only <script> block is replaced wholesale with
     the real Formspree version (same code your Meg/Beekeeper pages use).

  3. If a page ALREADY has the Formspree version but with a different
     FORMSPREE_ENDPOINT value, that value is corrected to your real one.

Pages already using the correct version are left untouched (safe to re-run).
No CSS files are touched — this is purely an HTML/JS behavior fix.

USAGE:
    python fix_broken_link_report.py --root /path/to/project --dry-run
    python fix_broken_link_report.py --root /path/to/project

Always run --dry-run first and review the report. Back up your files
(or use git) before running for real.
"""

import argparse
import re
import sys
from pathlib import Path

FORMSPREE_ENDPOINT = "https://formspree.io/f/xgoyjjgj"

QUERYSELECTOR_MARKER = "querySelectorAll('.broken-link, .mob-broken-link')"
SCRIPT_OPEN = "<script>"
SCRIPT_CLOSE = "</script>"

CANONICAL_SCRIPT = f"""<script>
    (function () {{
      const FORMSPREE_ENDPOINT = '{FORMSPREE_ENDPOINT}'; // <-- replace with your real endpoint

      document.querySelectorAll('.broken-link, .mob-broken-link').forEach(function (link) {{
        link.addEventListener('click', function (e) {{
          e.preventDefault();
          if (link.classList.contains('reported') || link.classList.contains('sending')) return;

          const movie = link.dataset.movie || document.title;
          link.classList.add('sending');
          link.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Reporting...';

          const data = new FormData();
          data.append('subject', 'Broken Download Link');
          data.append('message', `The download link for "${{movie}}" appears to be broken and needs fixing.`);
          data.append('page', window.location.href);

          fetch(FORMSPREE_ENDPOINT, {{
            method: 'POST',
            headers: {{ 'Accept': 'application/json' }},
            body: data
          }})
          .then(function (response) {{
            link.classList.remove('sending');
            if (response.ok) {{
              link.classList.add('reported');
              link.innerHTML = '<i class="fas fa-circle-check"></i> Thanks, reported!';
            }} else {{
              link.innerHTML = '<i class="fas fa-triangle-exclamation"></i> Failed, try again?';
            }}
          }})
          .catch(function () {{
            link.classList.remove('sending');
            link.innerHTML = '<i class="fas fa-triangle-exclamation"></i> Failed, try again?';
          }});
        }});
      }});
    }})();
  </script>"""

CANONICAL_COMMENT = "<!-- broken-link-report-script (Formspree version) -->"


def get_movie_title(html: str) -> str:
    m = re.search(r"<title>\s*([^|<]+?)\s*\|", html)
    if m:
        return m.group(1).strip()
    return "this movie"  # last-resort fallback


BROKEN_ANCHOR_RE = re.compile(
    r'<a class="(broken-link|mob-broken-link)" href="mailto:[^"]*"[^>]*>'
)


def fix_broken_link_anchors(html: str, movie_title: str):
    def repl(m):
        cls = m.group(1)
        return f'<a class="{cls}" href="#" data-movie="{movie_title}">'

    new_html, n = BROKEN_ANCHOR_RE.subn(repl, html)
    return new_html, n


def replace_script_block(html: str):
    """Finds the <script> block containing the broken-link querySelectorAll
    call, and replaces it wholesale with the canonical Formspree version —
    unless it already IS the Formspree version, in which case only the
    endpoint value is corrected if needed."""
    idx = html.find(QUERYSELECTOR_MARKER)
    if idx == -1:
        return html, "not-found"

    script_open_idx = html.rfind(SCRIPT_OPEN, 0, idx)
    if script_open_idx == -1:
        return html, "no-script-open"

    close_idx = html.find(SCRIPT_CLOSE, idx)
    if close_idx == -1:
        return html, "no-script-close"
    close_idx_end = close_idx + len(SCRIPT_CLOSE)

    old_block = html[script_open_idx:close_idx_end]

    if "FORMSPREE_ENDPOINT" in old_block:
        endpoint_re = re.compile(r"(const FORMSPREE_ENDPOINT = ')[^']*(')")
        m = endpoint_re.search(old_block)
        if m and old_block[m.start(1) + len(m.group(1)): m.start(2)] != FORMSPREE_ENDPOINT:
            new_block = endpoint_re.sub(
                lambda mm: mm.group(1) + FORMSPREE_ENDPOINT + mm.group(2),
                old_block,
                count=1,
            )
            new_html = html[:script_open_idx] + new_block + html[close_idx_end:]
            return new_html, "endpoint-corrected"
        return html, "already-correct"

    new_html = html[:script_open_idx] + CANONICAL_SCRIPT + html[close_idx_end:]

    # Also normalize the preceding comment line, if it's the old plain one
    old_comment = "<!-- broken-link-report-script -->"
    comment_idx = new_html.rfind(old_comment, 0, script_open_idx)
    # Only replace if that comment is the nearest thing before the script
    # (i.e. nothing but whitespace between the comment and the script tag)
    if comment_idx != -1:
        between = new_html[comment_idx + len(old_comment):new_html.find(SCRIPT_OPEN, comment_idx)]
        if between.strip() == "":
            new_html = (
                new_html[:comment_idx]
                + CANONICAL_COMMENT
                + new_html[comment_idx + len(old_comment):]
            )

    return new_html, "replaced"


def process_html_file(path: Path, dry_run: bool):
    html = path.read_text(encoding="utf-8")
    original = html
    notes = []

    if QUERYSELECTOR_MARKER not in html:
        return "skipped (no broken-link report script found)"

    movie_title = get_movie_title(html)

    html, anchor_count = fix_broken_link_anchors(html, movie_title)
    if anchor_count:
        notes.append(
            f'fixed {anchor_count} mailto broken-link anchor(s) -> data-movie="{movie_title}"'
        )

    html, script_result = replace_script_block(html)
    if script_result == "not-found":
        pass  # already handled by the guard above; unreachable in practice
    elif script_result == "no-script-open":
        notes.append("WARNING: found broken-link marker but no preceding <script> tag")
    elif script_result == "no-script-close":
        notes.append("WARNING: found broken-link marker but no following </script> tag")
    elif script_result == "replaced":
        notes.append("replaced fake setTimeout reporter with real Formspree version")
    elif script_result == "endpoint-corrected":
        notes.append(f"corrected FORMSPREE_ENDPOINT to {FORMSPREE_ENDPOINT}")
    elif script_result == "already-correct":
        pass

    if html != original:
        if not dry_run:
            path.write_text(html, encoding="utf-8")
        return "; ".join(notes) if notes else "changed"
    return "no changes needed" if not notes else "; ".join(notes)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", required=True, help="Project root directory to scan")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes only")
    args = parser.parse_args()

    root = Path(args.root)
    if not root.is_dir():
        print(f"ERROR: {root} is not a directory")
        sys.exit(1)

    html_files = sorted(root.rglob("*.html"))

    print(f"{'DRY RUN — ' if args.dry_run else ''}Processing {len(html_files)} HTML file(s)...\n")
    for f in html_files:
        result = process_html_file(f, args.dry_run)
        print(f"[HTML] {f.relative_to(root)}: {result}")

    print("\nDone." + (" (dry run — no files were modified)" if args.dry_run else ""))


if __name__ == "__main__":
    main()
