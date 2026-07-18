/* =========================================================================
   LEVENY — HOMEPAGE TUTORIAL (single file)
   Lives ONLY on index.html. Shows once per first-time visitor.
   Slides 1-2 point at real homepage elements (Genres, Request tab).
   Slides 3-4 are a PREVIEW of the Request page (the form, the suggestion
   link) so visitors know how it works before they ever click over there.
   Swap any `art` value for a real screenshot any time — just replace the
   SVG with e.g. `<img src="images/tutorial/step1.png" style="width:100%;height:100%;object-fit:cover;">`
   ========================================================================= */
   
document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(document.getElementById('tut-help-btn'));
});

const tutSlides = [
    {
        label: 'Step 1 of 4',
        title: 'BROWSE BY GENRE',
        text: 'Click "Genres" in the top menu to open a dropdown — Action, Superhero, Animation, Fantasy, and more, all one click away.',
        art: `
        <svg viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="220" fill="#0D0D0D"/>
          <rect x="0" y="0" width="400" height="44" fill="#000"/>
          <text x="24" y="28" font-family="Bebas Neue, sans-serif" font-size="20" fill="#fff" letter-spacing="2">Leveny</text>
          <text x="140" y="28" font-size="14" fill="#00A8FF" font-weight="700">Genres ▾</text>
          <rect x="120" y="50" width="180" height="140" rx="8" fill="#111" stroke="#00A8FF" stroke-width="1.5"/>
          <rect x="132" y="64" width="156" height="20" rx="4" fill="rgba(0,168,255,0.12)"/>
          <text x="140" y="78" font-size="11" fill="#fff">Action &amp; Adventure</text>
          <rect x="132" y="90" width="156" height="20" rx="4" fill="transparent"/>
          <text x="140" y="104" font-size="11" fill="#ccc">Superhero</text>
          <rect x="132" y="116" width="156" height="20" rx="4" fill="transparent"/>
          <text x="140" y="130" font-size="11" fill="#ccc">Animation</text>
          <rect x="132" y="142" width="156" height="20" rx="4" fill="transparent"/>
          <text x="140" y="156" font-size="11" fill="#ccc">Fantasy</text>
          <rect x="132" y="168" width="156" height="20" rx="4" fill="transparent"/>
          <text x="140" y="182" font-size="11" fill="#ccc">Sci-Fi</text>
        </svg>`
    },
    {
        label: 'Step 2 of 4',
        title: 'FIND THE REQUEST TAB',
        text: 'See "Request" in the top menu? That takes you to a page where you can ask us to add a movie that\'s missing.',
        art: `
        <svg viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="220" fill="#0D0D0D"/>
          <rect x="0" y="0" width="400" height="44" fill="#000"/>
          <text x="24" y="28" font-family="Bebas Neue, sans-serif" font-size="20" fill="#fff" letter-spacing="2">Leveny</text>
          <text x="140" y="28" font-size="13" fill="#aaa">Genres</text>
          <text x="210" y="28" font-size="14" fill="#00A8FF" font-weight="700">✉ Request</text>
          <rect x="196" y="16" width="86" height="24" rx="6" fill="none" stroke="#00A8FF" stroke-width="1.5" stroke-dasharray="4 4"/>
          <text x="290" y="28" font-size="13" fill="#aaa">Profile</text>
          <circle cx="200" cy="140" r="46" fill="none" stroke="#00A8FF" stroke-width="1.5" stroke-dasharray="4 5" opacity="0.5"/>
          <path d="M200 100 L200 128" stroke="#00A8FF" stroke-width="2"/>
          <path d="M192 118 L200 130 L208 118" fill="none" stroke="#00A8FF" stroke-width="2"/>
        </svg>`
    },
    {
        label: 'Step 3 of 4',
        title: 'SNEAK PEEK: THE REQUEST FORM',
        text: 'Once you\'re on the Request page, just type the movie title (and year or genre if you know them) and hit Submit — that\'s it.',
        art: `
        <svg viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="220" fill="#0D0D0D"/>
          <rect x="50" y="18" width="300" height="184" rx="16" fill="#141420" stroke="rgba(140,140,220,0.30)" stroke-width="1.5"/>
          <text x="70" y="44" font-family="Bebas Neue, sans-serif" font-size="16" fill="#d8d8ff" letter-spacing="1">New Movie Request</text>
          <text x="70" y="64" font-size="10" fill="rgba(160,160,255,0.75)" font-weight="700" letter-spacing="1">MOVIE TITLE</text>
          <rect x="70" y="70" width="260" height="30" rx="8" fill="rgba(8,8,16,0.7)" stroke="rgba(140,140,220,0.25)"/>
          <text x="82" y="90" font-size="11" fill="rgba(180,180,220,0.4)" font-style="italic">e.g., Interstellar</text>
          <text x="70" y="118" font-size="10" fill="rgba(160,160,255,0.75)" font-weight="700" letter-spacing="1">RELEASE YEAR</text>
          <rect x="70" y="124" width="120" height="30" rx="8" fill="rgba(8,8,16,0.7)" stroke="rgba(140,140,220,0.25)"/>
          <rect x="200" y="124" width="130" height="30" rx="8" fill="rgba(8,8,16,0.7)" stroke="rgba(140,140,220,0.25)"/>
          <rect x="70" y="168" width="150" height="34" rx="10" fill="rgba(120,120,220,0.85)"/>
          <text x="145" y="189" font-size="12" fill="#fff" text-anchor="middle" font-weight="700">Submit ➤</text>
        </svg>`
    },
    {
        label: 'Step 4 of 4',
        title: 'SNEAK PEEK: SUGGESTIONS',
        text: 'Scroll to the bottom of the Request page and you\'ll find a Suggestion Link — it opens an email straight to our team for any feedback. That\'s the whole tour!',
        art: `
        <svg viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="220" fill="#0D0D0D"/>
          <rect x="0" y="0" width="400" height="130" fill="rgba(255,255,255,0.02)"/>
          <rect x="40" y="150" width="320" height="46" rx="12" fill="#141420" stroke="rgba(140,140,220,0.30)" stroke-width="1.5"/>
          <text x="66" y="178" font-size="14" fill="rgba(220,220,140,0.85)">💡</text>
          <text x="88" y="178" font-size="12" fill="rgba(180,180,255,0.9)" font-weight="700" letter-spacing="0.5">SUGGESTION LINK!</text>
          <path d="M200 90 L200 140" stroke="#00A8FF" stroke-width="2" stroke-dasharray="4 5"/>
          <path d="M192 130 L200 142 L208 130" fill="none" stroke="#00A8FF" stroke-width="2"/>
        </svg>`
    }
];


(function () {
    const scrim = document.getElementById('tut-scrim');
    if (!scrim) return;

    const artEl = document.getElementById('tut-art');
    const labelEl = document.getElementById('tut-label');
    const titleEl = document.getElementById('tut-title');
    const textEl = document.getElementById('tut-text');
    const dotsEl = document.getElementById('tut-dots');
    const backBtn = scrim.querySelector('[data-action="back"]');
    const nextBtn = scrim.querySelector('[data-action="next"]');
    const closeBtn = scrim.querySelector('.tut-close');
    const helpBtn = document.getElementById('tut-help-btn');

    let current = 0;

    function buildDots() {
        dotsEl.innerHTML = '';
        tutSlides.forEach((_, i) => {
            const d = document.createElement('div');
            d.className = 'tut-dot';
            d.onclick = () => { current = i; render(); };
            dotsEl.appendChild(d);
        });
    }

    function render() {
        const s = tutSlides[current];
        artEl.innerHTML = s.art;
        labelEl.textContent = s.label;
        titleEl.textContent = s.title;
        textEl.textContent = s.text;
        dotsEl.querySelectorAll('.tut-dot').forEach((d, i) => d.classList.toggle('active', i === current));
        backBtn.disabled = current === 0;
        nextBtn.textContent = current === tutSlides.length - 1 ? 'Got it' : 'Next';
    }

    function next() {
        if (current < tutSlides.length - 1) { current++; render(); }
        else close();
    }
    function back() {
        if (current > 0) { current--; render(); }
    }
    function close() {
        scrim.classList.remove('open');
    }
    function start() {
        current = 0;
        buildDots();
        render();
        scrim.classList.add('open');
    }

    nextBtn.onclick = next;
    backBtn.onclick = back;
    closeBtn.onclick = close;
    scrim.addEventListener('click', (e) => { if (e.target === scrim) close(); });
    document.addEventListener('keydown', (e) => {
        if (!scrim.classList.contains('open')) return;
        if (e.key === 'ArrowRight') next();
        if (e.key === 'ArrowLeft') back();
        if (e.key === 'Escape') close();
    });

    // Auto-show only on a visitor's first-ever visit to the site
    if (!localStorage.getItem('leveny_seen_tutorial')) {
        start();
        localStorage.setItem('leveny_seen_tutorial', 'true');
    }

    // Floating "?" button lets anyone replay it any time
    if (helpBtn) helpBtn.onclick = start;
})();
