/* ============================================================
   related.js — Leveny
   Auto-generates "Related Movies" (desktop + mobile) from
   LEVENY_MOVIES.

   Desktop: 2 posters under the movie description, and 2 more
            directly under "Broken download link?".
   Mobile:  4 posters in the grid below the info card.

   MATCHING PRIORITY (highest to lowest):
     1. TITLE / FRANCHISE matches (e.g. "Zombies 4" -> "Zombies")
     2. GENRE matches
     3. RANDOM padding, only if the above don't fill the slots

   HOW TO USE ON A MOVIE PAGE:

   1. Tell the page which movie it IS:
        <body data-current-movie="../movies/a_quiet_place_movie.html">

   2. Leave these containers empty:
        <div class="related-movies"></div>
        <div id="mobRelatedGrid"></div>

   3. Load this AFTER movies.js:
        <script src="../js/movies.js"></script>
        <script src="../js/related.js"></script>

   NOTE: related cards use each movie's BACKGROUND image
   (m.background) on desktop and its POSTER (m.poster) on mobile.
============================================================ */

(function () {
    if (typeof LEVENY_MOVIES === 'undefined') return;

    const DESKTOP_TOP_COUNT = 2;         // under the movie description
    const DESKTOP_UNDER_LINK_COUNT = 2;  // under "Broken download link?"
    const MOBILE_RELATED_COUNT = 4;      // total on mobile
    const MIN_TITLE_KEY_LENGTH = 3;      // guards against over-matching on very short/stripped keys

    function fileName(href) {
        return href.split('/').pop();
    }

    // Extracts the folder a movies.js href points into, e.g.
    // "../movies/x.html" -> "movies", "../series/y.html" -> "series".
    function folderOf(href) {
        const match = href.match(/\.\.\/([^\/]+)\//);
        return match ? match[1] : '';
    }

    function typeLabel(m) {
        return m.type === 'series' ? 'Series' : 'Movie';
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
    const currentFolder = folderOf(currentHref) || folderOf(current.href);

    // A related card may point into a different folder than the page
    // it's shown on (e.g. a movie related to a series). Same-folder
    // targets keep the plain filename link; cross-folder targets need
    // the "../<folder>/" prefix.
    function relatedLink(m) {
        const file = fileName(m.href);
        const folder = folderOf(m.href);
        return folder === currentFolder ? file : `../${folder}/${file}`;
    }

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

    // Pick MOBILE_RELATED_COUNT once. Desktop shows the first 2 under the
    // description and the next 2 under the broken link, so all 4 are
    // different movies.
    const related = candidates.slice(0, MOBILE_RELATED_COUNT);

    function desktopCard(m) {
        return `
            <div class="related-card">
                <a href="${relatedLink(m)}" class="poster" style="background-image: url('../${m.background}');"></a>
                <p class="related-title">${m.title} <span class="type-tag">| ${typeLabel(m)}</span></p>
            </div>
        `;
    }

    // ---- DESKTOP: 2 under the movie description ----
    const topWrap = document.querySelector('.related-movies');
    if (topWrap) {
        topWrap.innerHTML = related.slice(0, DESKTOP_TOP_COUNT).map(desktopCard).join('');
    }

    // ---- DESKTOP: 2 directly under "Broken download link?" ----
    const brokenLink = document.querySelector('.video-section .broken-link');
    const underLink = related.slice(DESKTOP_TOP_COUNT, DESKTOP_TOP_COUNT + DESKTOP_UNDER_LINK_COUNT);
    if (brokenLink && underLink.length) {
        const bottomWrap = document.createElement('div');
        bottomWrap.className = 'related-movies-under-link';
        bottomWrap.innerHTML = underLink.map(desktopCard).join('');
        brokenLink.insertAdjacentElement('afterend', bottomWrap);
    }

    // ---- MOBILE ----
    const mobileWrap = document.getElementById('mobRelatedGrid');
    if (mobileWrap) {
        mobileWrap.innerHTML = related.map(m => `
            <a href="${relatedLink(m)}" class="mob-related-card">
                <img src="../${m.poster}" alt="${m.title}" loading="lazy">
                <div class="mob-related-card-info">
                    <div class="mob-related-card-title">${m.title} <span class="type-tag">| ${typeLabel(m)}</span></div>
                    <div class="mob-related-card-genre">${cap(m.genre)}</div>
                </div>
            </a>
        `).join('');
    }
})();
