# -*- coding: utf-8 -*-
"""
app.py — Leveny movie page generator (local tool)

Run this from the ROOT of your site repo (same folder as index.html,
movies/, css/, js/) with:

    pip install flask
    python app.py

Then open http://127.0.0.1:5000 in your browser.

On submit it will:
  1. Write movies/<html_filename>
  2. Write css/<css_filename>
  3. Append a matching entry to js/movies.js

If SITE_ROOT below isn't correct for your setup (e.g. you keep this
tool in a subfolder instead of the repo root), just change it.
"""

import os
from flask import Flask, render_template, request, redirect, url_for, flash

from generator import (
    GENRE_META, GENRE_ORDER, build_html, build_css,
    build_movies_js_entry, append_to_movies_js, next_css_filename,
)

# ----------------------------------------------------------------------
# Change this if app.py does not live at your repo root.
# ----------------------------------------------------------------------
SITE_ROOT = os.path.dirname(os.path.abspath(__file__))
MOVIES_DIR = os.path.join(SITE_ROOT, "movies")
CSS_DIR = os.path.join(SITE_ROOT, "css")
MOVIES_JS_PATH = os.path.join(SITE_ROOT, "js", "movies.js")

app = Flask(__name__)
app.secret_key = "leveny-local-tool"  # local use only


@app.route("/", methods=["GET"])
def index():
    return render_template(
        "form.html",
        genres=GENRE_ORDER,
        genre_meta=GENRE_META,
        next_css=next_css_filename(CSS_DIR),
    )


@app.route("/generate", methods=["POST"])
def generate():
    f = request.form

    title = f.get("title", "").strip()
    genre = f.get("genre", "").strip()
    html_filename = f.get("html_filename", "").strip()
    css_filename = f.get("css_filename", "").strip()
    imdb_id = f.get("imdb_id", "").strip()
    download_link = f.get("download_link", "").strip()
    summary = f.get("summary", "").strip()
    year = f.get("year", "").strip()
    runtime = f.get("runtime", "").strip()
    poster_file = f.get("poster_file", "").strip()
    background_file = f.get("background_file", "").strip()
    discover = f.get("discover", "").strip()

    errors = []
    if not title:
        errors.append("Title is required.")
    if genre not in GENRE_META:
        errors.append("Please choose a valid genre.")
    if not html_filename.endswith(".html"):
        errors.append("HTML filename must end in .html")
    if not css_filename.endswith(".css"):
        errors.append("CSS filename must end in .css")
    if not imdb_id:
        errors.append("IMDb ID is required.")
    if not download_link:
        errors.append("Download link is required.")
    if not summary:
        errors.append("Summary is required.")
    if not year.isdigit():
        errors.append("Year must be a number.")
    if not runtime.isdigit():
        errors.append("Runtime must be a number (minutes).")
    if not poster_file:
        errors.append("Poster filename is required (even if the image isn't ready yet).")
    if not background_file:
        errors.append("Background filename is required (even if the image isn't ready yet).")
    if not discover.isdigit():
        errors.append("Discover page number must be a number.")

    html_path = os.path.join(MOVIES_DIR, html_filename)
    css_path = os.path.join(CSS_DIR, css_filename)

    if not errors and os.path.exists(html_path):
        errors.append(f"movies/{html_filename} already exists — choose a different filename.")
    if not errors and os.path.exists(css_path):
        errors.append(f"css/{css_filename} already exists — choose a different filename.")

    if errors:
        for e in errors:
            flash(e, "error")
        return redirect(url_for("index"))

    data = {
        "title": title,
        "genre": genre,
        "html_filename": html_filename,
        "css_filename": css_filename,
        "imdb_id": imdb_id,
        "download_link": download_link,
        "summary": summary,
        "year": year,
        "runtime": runtime,
        "poster_file": poster_file,
        "background_file": background_file,
        "background_path": f"images/backgrounds/{background_file}",
        "discover": discover,
    }

    html_content = build_html(data)
    css_content = build_css(data)
    entry_line = build_movies_js_entry(data)

    os.makedirs(MOVIES_DIR, exist_ok=True)
    os.makedirs(CSS_DIR, exist_ok=True)

    with open(html_path, "w", encoding="utf-8") as fh:
        fh.write(html_content)

    with open(css_path, "w", encoding="utf-8") as fh:
        fh.write(css_content)

    try:
        append_to_movies_js(MOVIES_JS_PATH, entry_line)
        js_ok = True
    except Exception as e:
        js_ok = False
        flash(f"Movie page + CSS were created, but movies.js could not be updated automatically: {e}", "error")
        flash(f"Add this line yourself to js/movies.js:  {entry_line}", "error")

    if js_ok:
        flash(f'"{title}" was created successfully!', "success")
        flash(f"movies/{html_filename}", "file")
        flash(f"css/{css_filename}", "file")
        flash("Entry appended to js/movies.js", "file")

    return redirect(url_for("index"))


if __name__ == "__main__":
    app.run(debug=True)
