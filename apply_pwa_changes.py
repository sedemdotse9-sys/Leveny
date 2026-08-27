#!/usr/bin/env python3
"""
apply_pwa_changes.py — Leveny PWA converter

Scans this project and applies everything needed to turn the site into an
installable PWA:

  1. Creates /manifest.json                (if it doesn't already exist)
  2. Creates /sw.js                         (if it doesn't already exist)
  3. Injects PWA <head> tags into every .html file
       - <link rel="manifest" ...>
       - <meta name="theme-color" ...>
       - iOS apple-mobile-web-app-* meta tags
  4. Injects an "Install App" sidebar button into every page that has an
     .app-sidebar (i.e. the after-login app shell pages), right above
     .sidebar-bottom.
  5. Patches js/app.js to:
       - register the service worker
       - add the initInstallPrompt() function
       - call initInstallPrompt() inside the DOMContentLoaded init block

SAFE TO RE-RUN: every change checks for a marker/anchor before inserting,
so running this multiple times won't duplicate anything. Every file this
script modifies gets a one-time ".bak" backup next to it before the first
edit (skipped if a .bak already exists, so you always keep the ORIGINAL
pre-PWA version, not a rolling backup).

USAGE
-----
  1. Drop this file in your project ROOT (same folder as index.html).
  2. In VS Code's terminal:  python apply_pwa_changes.py
  3. Optional dry run (show what would change, write nothing):
       python apply_pwa_changes.py --dry-run
  4. Optional custom root:
       python apply_pwa_changes.py --root "C:\\path\\to\\leveny"

WHAT THIS SCRIPT DOES NOT DO
-----------------------------
  - It does NOT generate icon PNGs (icon-192.png, icon-512.png,
    icon-maskable-512.png). Export those yourself and drop them in
    /favicon/ — manifest.json references those exact filenames.
  - It does NOT touch video/download caching — this is app-shell only.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

# ----------------------------------------------------------------------
# Config
# ----------------------------------------------------------------------

SKIP_DIRS = {".git", "node_modules", "__pycache__", ".vscode", ".idea"}

MANIFEST_JSON = """{
  "name": "Leveny",
  "short_name": "Leveny",
  "description": "Stream and discover movies & shows on Leveny.",
  "start_url": "/index.html",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#0D0D0D",
  "theme_color": "#0D0D0D",
  "icons": [
    {
      "src": "/favicon/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/favicon/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/favicon/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
"""

SW_JS = """/* ============================================================
   SW.JS — Leveny service worker
   Strategy:
   - HTML pages: network-first, falling back to cache when
     offline, so content never goes stale while online.
   - CSS/JS/fonts/icons (the "app shell"): cache-first, since
     these rarely change and should load instantly.
   Bump CACHE_VERSION whenever shell assets change so old
   caches get cleared out on the next visit.
============================================================ */

const CACHE_VERSION = 'leveny-shell-v1';

const SHELL_ASSETS = [
    '/css/design.css',
    '/css/mobile.css',
    '/css/app.css',
    '/js/script.js',
    '/js/app.js',
    '/favicon/favicon-96x96.png',
    '/favicon/icon-192.png',
    '/favicon/icon-512.png',
    '/manifest.json',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION).then((cache) => cache.addAll(SHELL_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const isHTML = request.mode === 'navigate' || request.destination === 'document';

    if (isHTML) {
        // Network-first for pages: never serve stale movie data
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
                    return response;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    // Cache-first for shell assets (css/js/icons/fonts)
    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;
            return fetch(request).then((response) => {
                const clone = response.clone();
                caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
                return response;
            });
        })
    );
});
"""

HEAD_SNIPPET = """    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#0D0D0D">

    <!-- iOS: Safari ignores the manifest for install behavior, needs these explicitly -->
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Leveny">
"""

INSTALL_BUTTON_HTML = """        <button type="button" class="sidebar-nav-item" id="sidebarInstallBtn" hidden>
            <i class="fa-solid fa-arrow-down-to-line"></i><span>Install App</span>
        </button>

"""

SW_REGISTER_SNIPPET = """    /* ---- PWA: register service worker ---- */
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch((err) => {
                console.error('Service worker registration failed:', err);
            });
        });
    }

"""

INSTALL_PROMPT_FN = """    /* ---- PWA: install prompt ---- */
    function initInstallPrompt() {
        const installBtn = document.getElementById('sidebarInstallBtn');
        if (!installBtn) return;

        let deferredPrompt = null;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            installBtn.hidden = false;
        });

        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            deferredPrompt = null;
            installBtn.hidden = true;
        });

        window.addEventListener('appinstalled', () => {
            installBtn.hidden = true;
        });
    }

"""

# ----------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------


def backup_once(path: Path, dry_run: bool) -> None:
    """Save a ONE-TIME .bak copy of the original file, before any edits."""
    bak = path.with_suffix(path.suffix + ".bak")
    if bak.exists():
        return
    if dry_run:
        print(f"  [dry-run] would back up -> {bak.name}")
        return
    bak.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
    print(f"  backed up -> {bak.name}")


def find_files(root: Path, pattern: str) -> list[Path]:
    results = []
    for path in root.rglob(pattern):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        results.append(path)
    return sorted(results)


# ----------------------------------------------------------------------
# Step 1 + 2: manifest.json / sw.js
# ----------------------------------------------------------------------


def ensure_manifest(root: Path, dry_run: bool) -> None:
    target = root / "manifest.json"
    if target.exists():
        print(f"[skip] {target.relative_to(root)} already exists")
        return
    print(f"[create] {target.relative_to(root)}")
    if not dry_run:
        target.write_text(MANIFEST_JSON, encoding="utf-8")


def ensure_service_worker(root: Path, dry_run: bool) -> None:
    target = root / "sw.js"
    if target.exists():
        print(f"[skip] {target.relative_to(root)} already exists")
        return
    print(f"[create] {target.relative_to(root)}")
    if not dry_run:
        target.write_text(SW_JS, encoding="utf-8")


# ----------------------------------------------------------------------
# Step 3: inject <head> tags into every HTML file
# ----------------------------------------------------------------------


def patch_html_head(path: Path, root: Path, dry_run: bool) -> bool:
    text = path.read_text(encoding="utf-8")

    if 'rel="manifest"' in text:
        return False  # already patched

    match = re.search(r"</head>", text, flags=re.IGNORECASE)
    if not match:
        print(f"  [warn] {path.relative_to(root)}: no </head> found, skipping")
        return False

    backup_once(path, dry_run)

    new_text = text[: match.start()] + HEAD_SNIPPET + text[match.start() :]

    print(f"[patch] {path.relative_to(root)}: added PWA head tags")
    if not dry_run:
        path.write_text(new_text, encoding="utf-8")
    return True


# ----------------------------------------------------------------------
# Step 4: inject the Install App sidebar button
# ----------------------------------------------------------------------


def patch_sidebar_button(path: Path, root: Path, dry_run: bool) -> bool:
    text = path.read_text(encoding="utf-8")

    if 'id="appSidebar"' not in text:
        return False  # not an app-shell page, nothing to do

    if 'id="sidebarInstallBtn"' in text:
        return False  # already patched

    match = re.search(r'(\s*)<div class="sidebar-bottom">', text)
    if not match:
        print(f"  [warn] {path.relative_to(root)}: has .app-sidebar but no "
              f".sidebar-bottom anchor found, skipping button injection")
        return False

    backup_once(path, dry_run)

    insert_at = match.start(1)  # right before the leading whitespace + <div>
    new_text = text[:insert_at] + "\n" + INSTALL_BUTTON_HTML + text[insert_at:]

    print(f"[patch] {path.relative_to(root)}: added Install App sidebar button")
    if not dry_run:
        path.write_text(new_text, encoding="utf-8")
    return True


# ----------------------------------------------------------------------
# Step 5: patch js/app.js
# ----------------------------------------------------------------------


def patch_app_js(root: Path, dry_run: bool) -> None:
    target = root / "js" / "app.js"
    if not target.exists():
        print(f"[warn] {target.relative_to(root)} not found — skipping app.js patch")
        return

    text = target.read_text(encoding="utf-8")
    original_text = text
    changed = False

    # --- 5a: service worker registration, right after the IIFE opens ---
    if "serviceWorker" not in text:
        iife_match = re.search(r"\(function\s*\(\)\s*\{\s*\n", text)
        if iife_match:
            insert_at = iife_match.end()
            text = text[:insert_at] + "\n" + SW_REGISTER_SNIPPET + text[insert_at:]
            changed = True
            print("  + added service worker registration")
        else:
            print("  [warn] could not find IIFE opening in app.js — "
                  "add the sw registration snippet manually")

    # --- 5b: initInstallPrompt() function definition ---
    if "function initInstallPrompt" not in text:
        init_marker = re.search(r"\n(\s*)/\* ---- Init ---- \*/", text)
        if init_marker:
            insert_at = init_marker.start()
            text = text[:insert_at] + "\n" + INSTALL_PROMPT_FN + text[insert_at:]
            changed = True
            print("  + added initInstallPrompt() function")
        else:
            print("  [warn] could not find '/* ---- Init ---- */' marker — "
                  "add initInstallPrompt() manually")

    # --- 5c: call initInstallPrompt() inside the DOMContentLoaded block ---
    if "initInstallPrompt();" not in text:
        call_marker = re.search(r"(\binitBottomNavActiveState\(\);\s*\n)", text)
        if call_marker:
            insert_at = call_marker.end()
            text = text[:insert_at] + "        initInstallPrompt();\n" + text[insert_at:]
            changed = True
            print("  + added initInstallPrompt() call to init block")
        else:
            print("  [warn] could not find initBottomNavActiveState(); call — "
                  "add initInstallPrompt(); to the init block manually")

    if not changed:
        print(f"[skip] {target.relative_to(root)} already patched")
        return

    backup_once(target, dry_run)
    print(f"[patch] {target.relative_to(root)}")
    if not dry_run and text != original_text:
        target.write_text(text, encoding="utf-8")


# ----------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(description="Apply PWA conversion to the Leveny project.")
    parser.add_argument(
        "--root",
        default=".",
        help="Project root folder (defaults to the current directory).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would change without writing any files.",
    )
    args = parser.parse_args()

    root = Path(args.root).resolve()
    if not root.exists():
        print(f"Error: root path does not exist: {root}", file=sys.stderr)
        sys.exit(1)

    print(f"Project root: {root}")
    if args.dry_run:
        print("*** DRY RUN — no files will be modified ***")
    print()

    print("== Step 1/5: manifest.json ==")
    ensure_manifest(root, args.dry_run)
    print()

    print("== Step 2/5: sw.js ==")
    ensure_service_worker(root, args.dry_run)
    print()

    html_files = find_files(root, "*.html")
    print(f"== Step 3/5: patching <head> in {len(html_files)} HTML file(s) ==")
    head_patched = 0
    for f in html_files:
        if patch_html_head(f, root, args.dry_run):
            head_patched += 1
    print(f"  {head_patched} file(s) patched, {len(html_files) - head_patched} already up to date")
    print()

    print("== Step 4/5: injecting Install App button into app-shell pages ==")
    btn_patched = 0
    for f in html_files:
        if patch_sidebar_button(f, root, args.dry_run):
            btn_patched += 1
    print(f"  {btn_patched} file(s) patched")
    print()

    print("== Step 5/5: patching js/app.js ==")
    patch_app_js(root, args.dry_run)
    print()

    print("Done." if not args.dry_run else "Dry run complete — re-run without --dry-run to apply.")
    print()
    print("Reminder: this script does NOT generate icon images.")
    print("Add these to /favicon/ before testing installability:")
    print("  - icon-192.png (192x192)")
    print("  - icon-512.png (512x512)")
    print("  - icon-maskable-512.png (512x512, logo padded to ~80% center)")


if __name__ == "__main__":
    main()
