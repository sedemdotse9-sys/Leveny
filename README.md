# Leveny Movie Page Generator

A tiny local Flask app that generates a new movie's HTML page + page CSS,
and appends the matching entry to `js/movies.js`.

## Setup

1. Copy this whole `leveny_generator` folder into the **root** of your
   site repo — the same folder as `index.html`, `movies/`, `css/`, `js/`.
   (If you'd rather keep it elsewhere, open `app.py` and change `SITE_ROOT`
   at the top to point at your repo root.)

2. Install Flask (one-time):
   ```
   pip install flask
   ```

3. Run it:
   ```
   python app.py
   ```

4. Open http://127.0.0.1:5000 in your browser.

## What it does

Fill in the form and hit **Generate Movie Page**. It will:

1. Write `movies/<html_filename>` — Pattern B structure (shared
   `css/style.css` + your page-specific CSS, no inline `<style>` block),
   matching Atlas King / Camp Rock 3 / The Devil's Mouth exactly.
2. Write `css/<css_filename>` — accent color and label are pulled
   automatically from the genre you pick (using the same 9 colors as
   your shared genre dropdown menu).
3. Append one line to `js/movies.js`, right before the closing `];`,
   in the same format as your existing entries.

## Notes

- **Poster / background filenames** don't need to exist yet — the
  generator just writes whatever filename you type into the CSS
  `background:` rule and the `movies.js` entry. Drop the real image in
  later with the same filename and it picks it up automatically.
- **CSS filename** is yours to pick (the tool doesn't auto-number it).
- **Discover page number** is a manual field — type whichever page you
  want the movie to show up in.
- The generator refuses to overwrite an existing `movies/*.html` or
  `css/*.css` file — you'll get an error instead of a silent clobber.
- This app is meant for local use only (no auth, no production server).

## Files

- `app.py` — Flask routes + form handling
- `generator.py` — HTML/CSS templating + movies.js insertion logic
- `templates/form.html` — the form UI (styled after your mobile homepage:
  dark/light toggle, header, bottom bar)
