/* ============================================================
   LEVENY MEDIA TRACKING
   Shared helpers for movie pages to report watch progress and
   downloads back to the dashboard. Include this script on any
   movie page, then call the two functions below.

   Usage from a movie page:

     <script src="/assets/media-tracking.js"></script>
     <script>
       // Call periodically while playing (e.g. every 15s) and/or
       // on pause/unload, with the current position:
       LevenyMedia.logWatchProgress({
         movieId: 'avatar_way_of_water',      // stable unique id for this movie
         title: 'Avatar: The Way of Water',
         background: '/images/backgrounds/way.jpg',
         runtimeMinutes: 192,
         positionMinutes: 47
       });

       // Call when the user clicks your Download button, passing
       // the real video file URL:
       document.getElementById('downloadBtn').addEventListener('click', () => {
         LevenyMedia.logDownload({
           movieId: 'avatar_way_of_water',
           title: 'Avatar: The Way of Water',
           poster: '/images/posters/avatar_water.jpg',
           videoUrl: 'https://your-video-host/avatar_way_of_water.mp4'
         });
       });
     </script>

   Both functions silently do nothing if the visitor isn't logged
   in (no point tracking history for a signed-out visitor), and
   never throw — a failed network call won't break movie playback.
============================================================ */
(function () {
  function getUsername() {
    try {
      return sessionStorage.getItem('leveny-user');
    } catch (err) {
      return null;
    }
  }

  async function logWatchProgress(movie) {
    const username = getUsername();
    if (!username) return;
    try {
      await fetch('/api/watch-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, ...movie })
      });
    } catch (err) {
      /* non-fatal: playback should continue regardless */
    }
  }

  function triggerFileDownload(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || '';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function logDownload(movie) {
    triggerFileDownload(movie.videoUrl, movie.title);

    const username = getUsername();
    if (!username) return;
    try {
      await fetch('/api/downloads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, ...movie })
      });
    } catch (err) {
      /* the download itself still happened even if logging failed */
    }
  }

  window.LevenyMedia = { logWatchProgress, logDownload };
})();
