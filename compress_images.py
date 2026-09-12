#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
compress_images.py — Leveny image compressor

Your posters/backgrounds are currently full-resolution originals (some
4000-6000px wide, 5-14MB each) being served as-is and pushed to git on
every change. This resizes + re-compresses them in place to sane,
web-appropriate dimensions, which is the single biggest lever for
speeding up your git pushes and page load times.

Run once from your repo root:

    python compress_images.py

Requires Pillow:  pip install Pillow

What it does:
  - images/backgrounds/*  -> resized to max width 1920px (full-bleed
    desktop background doesn't need more than that)
  - images/posters/*      -> resized to max width 600px (poster cards
    are small; 600px is plenty even on retina screens)
  - Re-saves as JPEG, quality 82, optimized, EXIF/metadata stripped
  - Skips any image already smaller than its target width
  - Prints a before/after size report

This overwrites the files in place. Your git history will still have
the old huge originals until you rewrite history (a separate, optional
step) — so this is safe to run and commit now.
"""

import os
from PIL import Image

SITE_ROOT = os.path.dirname(os.path.abspath(__file__))

TARGETS = {
    os.path.join(SITE_ROOT, "images", "backgrounds"): 1920,
    os.path.join(SITE_ROOT, "images", "posters"): 600,
}

JPEG_QUALITY = 82
VALID_EXT = (".jpg", ".jpeg", ".png", ".webp")


def human(n):
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.1f}{unit}"
        n /= 1024
    return f"{n:.1f}TB"


def compress_image(path, max_width):
    original_size = os.path.getsize(path)

    with Image.open(path) as im:
        im = im.convert("RGB") if im.mode in ("RGBA", "P", "LA") else im.convert("RGB")

        if im.width > max_width:
            new_height = round(im.height * (max_width / im.width))
            im = im.resize((max_width, new_height), Image.LANCZOS)

        im.save(path, "JPEG", quality=JPEG_QUALITY, optimize=True)

    new_size = os.path.getsize(path)
    return original_size, new_size


def main():
    total_before = 0
    total_after = 0
    processed = 0

    for folder, max_width in TARGETS.items():
        if not os.path.isdir(folder):
            print(f"[skip] folder not found: {folder}")
            continue

        for name in sorted(os.listdir(folder)):
            if not name.lower().endswith(VALID_EXT):
                continue
            path = os.path.join(folder, name)
            before, after = compress_image(path, max_width)
            total_before += before
            total_after += after
            processed += 1
            if before != after:
                saved_pct = (1 - after / before) * 100
                print(f"[{os.path.basename(folder)}] {name}: "
                      f"{human(before)} -> {human(after)}  (-{saved_pct:.0f}%)")

    print(f"\nDone. {processed} images processed.")
    print(f"Total: {human(total_before)} -> {human(total_after)} "
          f"(saved {human(total_before - total_after)})")


if __name__ == "__main__":
    main()
