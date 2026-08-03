/* ============================================================
   related.js — Leveny
   Auto-generates "Related Movies" (desktop + mobile) from
   LEVENY_MOVIES — no more hand-editing related movies per page.

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

   That's it. Related movies (same genre first, random selection,
   never itself) are generated automatically, on both layouts, and
   stay in sync automatically whenever you add/edit movies.js.

   NOTE: related cards use each movie's BACKGROUND image
   (m.background), not its poster — matches the movie page's own
   backdrop style rather than the discover/genre poster look.
============================================================ */

(function () {
    if (typeof LEVENY_MOVIES === 'undefined') return;

    const DESKTOP_RELATED_COUNT = 2;
    const MOBILE_RELATED_COUNT = 4;

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

    const currentHref = document.body.dataset.currentMovie || window.location.pathname;
    const currentFile = fileName(currentHref);

    const current = LEVENY_MOVIES.find(m => fileName(m.href) === currentFile);
    if (!current) return; // page isn't recognized as a movie page, do nothing

    let candidates = LEVENY_MOVIES.filter(
        m => m.genre === current.genre && fileName(m.href) !== currentFile
    );

    // Not enough same-genre matches? Pad with other movies rather than show fewer.
    if (candidates.length < MOBILE_RELATED_COUNT) {
        const already = new Set(candidates.map(m => fileName(m.href)));
        const others = LEVENY_MOVIES.filter(
            m => fileName(m.href) !== currentFile && !already.has(fileName(m.href))
        );
        candidates = candidates.concat(shuffle(others));
    }

    // Pick MOBILE_RELATED_COUNT once — desktop just shows the first
    // DESKTOP_RELATED_COUNT of this same list, so the 2 shown on desktop
    // are always a subset of the 4 shown on mobile.
    const related = shuffle(candidates).slice(0, MOBILE_RELATED_COUNT);
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
                <img src="../${m.background}" alt="${m.title}" loading="lazy">
                <div class="mob-related-card-info">
                    <div class="mob-related-card-title">${m.title}</div>
                    <div class="mob-related-card-genre">${cap(m.genre)}</div>
                </div>
            </a>
        `).join('');
    }
})();
