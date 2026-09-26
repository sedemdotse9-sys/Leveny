/* ============================================================
   series-select.js — Leveny
   Only loaded on series pages (movies/*.html pages never include
   this file). Reads the embedded #levenySeriesData JSON block and
   wires up the Season / Episode selector pills (desktop + mobile),
   keeping them in sync and updating BOTH the video stream and the
   download link whenever the selection changes.

   Expected embedded data shape:
   {
     "imdb_id": "tt1234567",
     "seasons": {
       "1": [ { "episode": 1, "download": "https://..." }, ... ],
       "2": [ ... ]
     }
   }
============================================================ */
(function () {
    const dataEl = document.getElementById('levenySeriesData');
    if (!dataEl) return; // not a series page

    let seriesData;
    try {
        seriesData = JSON.parse(dataEl.textContent);
    } catch (e) {
        console.error('Leveny: could not parse series data', e);
        return;
    }

    const imdbId = seriesData.imdb_id;
    const seasons = seriesData.seasons || {};
    const seasonKeys = Object.keys(seasons)
        .map(Number)
        .filter(n => !isNaN(n))
        .sort((a, b) => a - b);

    if (!seasonKeys.length) return;

    let currentSeason = seasonKeys[0];
    let currentEpisode = episodesFor(currentSeason)[0]
        ? episodesFor(currentSeason)[0].episode
        : 1;

    function episodesFor(season) {
        const list = seasons[String(season)] || [];
        return list.slice().sort((a, b) => a.episode - b.episode);
    }

    function currentEpisodeRecord() {
        const list = episodesFor(currentSeason);
        return list.find(e => e.episode === currentEpisode) || list[0];
    }

    // ---- DOM refs (desktop + mobile pairs) ----
    const seasonPillD  = document.getElementById('seasonPillDesktop');
    const episodePillD = document.getElementById('episodePillDesktop');
    const seasonLabelD  = document.getElementById('seasonLabelDesktop');
    const episodeLabelD = document.getElementById('episodeLabelDesktop');
    const seasonPanelD  = document.getElementById('seasonPanelDesktop');
    const episodePanelD = document.getElementById('episodePanelDesktop');

    const seasonPillM  = document.getElementById('seasonPillMobile');
    const episodePillM = document.getElementById('episodePillMobile');
    const seasonLabelM  = document.getElementById('seasonLabelMobile');
    const episodeLabelM = document.getElementById('episodeLabelMobile');
    const seasonPanelM  = document.getElementById('seasonPanelMobile');
    const episodePanelM = document.getElementById('episodePanelMobile');

    const allPills = [seasonPillD, episodePillD, seasonPillM, episodePillM].filter(Boolean);

    function closeAllPanels(except) {
        allPills.forEach(p => { if (p !== except) p.classList.remove('open'); });
    }

    function togglePanel(pill) {
        const isOpen = pill.classList.contains('open');
        closeAllPanels(null);
        if (!isOpen) pill.classList.add('open');
    }

    document.addEventListener('click', e => {
        allPills.forEach(pill => {
            if (pill && !pill.contains(e.target)) pill.classList.remove('open');
        });
    });

    function buildPanelItems(panelEl, itemClass, items, activeValue, onPick) {
        if (!panelEl) return;
        panelEl.innerHTML = '';
        items.forEach(item => {
            const row = document.createElement('div');
            row.className = itemClass + (item.value === activeValue ? ' active' : '');
            row.textContent = item.label;
            row.addEventListener('click', ev => {
                ev.stopPropagation();
                onPick(item.value);
            });
            panelEl.appendChild(row);
        });
    }

    function renderSeasonPanels() {
        const items = seasonKeys.map(s => ({ value: s, label: `Season ${s}` }));
        buildPanelItems(seasonPanelD, 'select-panel-item', items, currentSeason, pickSeason);
        buildPanelItems(seasonPanelM, 'mob-select-panel-item', items, currentSeason, pickSeason);
    }

    function renderEpisodePanels() {
        const items = episodesFor(currentSeason).map(e => ({ value: e.episode, label: `Episode ${e.episode}` }));
        buildPanelItems(episodePanelD, 'select-panel-item', items, currentEpisode, pickEpisode);
        buildPanelItems(episodePanelM, 'mob-select-panel-item', items, currentEpisode, pickEpisode);
    }

    function renderLabels() {
        const seasonText = `Season ${currentSeason}`;
        const episodeText = `Episode ${currentEpisode}`;
        if (seasonLabelD) seasonLabelD.textContent = seasonText;
        if (seasonLabelM) seasonLabelM.textContent = seasonText;
        if (episodeLabelD) episodeLabelD.textContent = episodeText;
        if (episodeLabelM) episodeLabelM.textContent = episodeText;
    }

    function updateStream() {
        const record = currentEpisodeRecord();
        if (!record) return;

        const streamUrl = `https://vidsrc.me/embed/tv/${imdbId}/${currentSeason}/${currentEpisode}`;

        const desktopIframe = document.querySelector('.video-section iframe');
        const mobileIframe  = document.querySelector('#mobVideoWrap iframe');
        if (desktopIframe) desktopIframe.src = streamUrl;
        if (mobileIframe)  mobileIframe.src = streamUrl;

        // A new episode is new content — make the viewer click to
        // unblur again, same as loading the page fresh.
        const frostWrap = document.getElementById('frostWrap');
        const mobFrostWrap = document.getElementById('mobFrostWrap');
        if (frostWrap) frostWrap.classList.remove('unblurred');
        if (mobFrostWrap) mobFrostWrap.classList.remove('unblurred');

        const desktopDownload = document.querySelector('.download-btn a');
        const mobileDownload  = document.getElementById('mobDownloadBtn');
        if (desktopDownload) desktopDownload.href = record.download;
        if (mobileDownload)  mobileDownload.href = record.download;
    }

    function pickSeason(season) {
        currentSeason = season;
        const eps = episodesFor(currentSeason);
        currentEpisode = eps[0] ? eps[0].episode : 1;
        renderSeasonPanels();
        renderEpisodePanels();
        renderLabels();
        updateStream();
        closeAllPanels(null);
    }

    function pickEpisode(episode) {
        currentEpisode = episode;
        renderEpisodePanels();
        renderLabels();
        updateStream();
        closeAllPanels(null);
    }

    if (seasonPillD)  seasonPillD.addEventListener('click', () => togglePanel(seasonPillD));
    if (episodePillD) episodePillD.addEventListener('click', () => togglePanel(episodePillD));
    if (seasonPillM)  seasonPillM.addEventListener('click', () => togglePanel(seasonPillM));
    if (episodePillM) episodePillM.addEventListener('click', () => togglePanel(episodePillM));

    renderSeasonPanels();
    renderEpisodePanels();
    renderLabels();
    // NOTE: the page ships with season 1 / episode 1's stream + download
    // already baked into the markup, so we don't call updateStream() on
    // load — only once the viewer actually changes the selection.
})();
