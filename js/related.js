/* ============================================================
   related.js — Leveny
   Auto-generates "Related Movies" (desktop + mobile) from
   LEVENY_MOVIES — no more hand-editing related movies per page.

   MATCHING PRIORITY (highest to lowest):
     1. TITLE / FRANCHISE matches — e.g. "Zombies 4: Dawn of the
        Vampires" relates to "Zombies", "Zombies 2", "Zombies 3"
        even though they may not share the same genre tag. This
        is checked first and always wins a slot over genre-only
        matches.
     2. GENRE matches — same genre, excluding anything already
        picked by title.
     3. RANDOM padding — only used if the above two tiers don't
        fill all the slots.

   Each tier is internally shuffled so repeat visits show some
   variety, but a lower tier can never bump a higher tier out of
   the shown slots — title matches always show first.

   HOW TO USE ON A MOVIE PAGE:

   1. Tell the page which movie it IS, by adding a data attribute
      to <body> using the SAME href you already use for it in movies.js:

        <body data-current-movie="../movies/a_quiet_place_movie.html">

   2. Empty out the related movies containers (delete the hardcoded
      <div class="related-card">...</div> / mob-related-card entries,
      just leave the empty wrapper divs):

        <div class="related-movies"></div>
        <div id="mobRelatedGrid"></div>

   3. Load this AFTER movies.js:

        <script src="../js/movies.js"></script>
        <script src="../js/related.js"></script>

   That's it. Related movies are generated automatically, on both
   layouts, and stay in sync automatically whenever you add/edit
   movies.js.

   NOTE: related cards use each movie's BACKGROUND image
   (m.background), not its poster — matches the movie page's own
   backdrop style rather than the discover/genre poster look.
============================================================ */

(function () {
    if (typeof LEVENY_MOVIES === 'undefined') return;

    const DESKTOP_RELATED_COUNT = 2;
    const MOBILE_RELATED_COUNT = 4;
    const MIN_TITLE_KEY_LENGTH = 3; // guards against over-matching on very short/stripped keys

    function fileName(href) {
        return href.split('/').pop();
    }

    function cap(s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    /* Normalizes a title down to its "franchise" key, so sequels/
       prequels match each other regardless of subtitle or number:
         "Zombies 4: Dawn of the Vampires" -> "zombies"
         "Toy Story 3"                     -> "toy story"
         "Spider-Man: Into the Spider-Verse" -> "spiderman"
         "Spider-Man: Across the Spider-Verse" -> "spiderman"
       Strips: everything after a colon, standalone numbers, the
       word "part", roman numerals I-X, and punctuation. */
    function titleKey(title) {
        return title
            .toLowerCase()
            .split(':')[0]
            .replace(/\bpart\b/g, '')
            .replace(/\b\d+\b/g, '')
            .replace(/\b(i{1,3}|iv|v|vi{0,3}|ix|x)\b/g, '')
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    const currentHref = document.body.dataset.currentMovie || window.location.pathname;
    const currentFile = fileName(currentHref);

    const current = LEVENY_MOVIES.find(m => fileName(m.href) === currentFile);
    if (!current) return; // page isn't recognized as a movie page, do nothing

    const currentTitleKey = titleKey(current.title);

    // ---- TIER 1: title/franchise matches ----
    const titleMatches = (currentTitleKey.length >= MIN_TITLE_KEY_LENGTH)
        ? shuffle(LEVENY_MOVIES.filter(m =>
            fileName(m.href) !== currentFile && titleKey(m.title) === currentTitleKey
          ))
        : [];
    const titleMatchFiles = new Set(titleMatches.map(m => fileName(m.href)));

    // ---- TIER 2: genre matches, excluding anything title already claimed ----
    const genreMatches = shuffle(LEVENY_MOVIES.filter(m =>
        m.genre === current.genre &&
        fileName(m.href) !== currentFile &&
        !titleMatchFiles.has(fileName(m.href))
    ));

    let candidates = titleMatches.concat(genreMatches);

    // ---- TIER 3: random padding if the above didn't fill enough slots ----
    if (candidates.length < MOBILE_RELATED_COUNT) {
        const already = new Set(candidates.map(m => fileName(m.href)));
        const others = shuffle(LEVENY_MOVIES.filter(
            m => fileName(m.href) !== currentFile && !already.has(fileName(m.href))
        ));
        candidates = candidates.concat(others);
    }

    // Pick MOBILE_RELATED_COUNT once — desktop just shows the first
    // DESKTOP_RELATED_COUNT of this same list, so the 2 shown on desktop
    // are always a subset of the 4 shown on mobile.
    const related = candidates.slice(0, MOBILE_RELATED_COUNT);
    const desktopRelated = related.slice(0, DESKTOP_RELATED_COUNT);

    // ---- DESKTOP ----
    const desktopWrap = document.querySelector('.related-movies');
    if (desktopWrap) {
        desktopWrap.innerHTML = desktopRelated.map(m => `
            <div class="related-card">
                <a href="${fileName(m.href)}" class="poster" style="background-image: url('../${m.background}');"></a>
                <p class="related-title">${m.title}</p>
            </div>
        `).join('');
    }

    // ---- MOBILE ----
    const mobileWrap = document.getElementById('mobRelatedGrid');
    if (mobileWrap) {
        mobileWrap.innerHTML = related.map(m => `
            <a href="${fileName(m.href)}" class="mob-related-card">
                <img src="../${m.poster}" alt="${m.title}" loading="lazy">
                <div class="mob-related-card-info">
                    <div class="mob-related-card-title">${m.title}</div>
                    <div class="mob-related-card-genre">${cap(m.genre)}</div>
                </div>
            </a>
        `).join('');
    }
})();