/* ============================================================
   LEVENY — First-Time Onboarding Tour
   File: js/tour.js

   Drop this script at the BOTTOM of both:
     - index.html   (before </body>)
     - Movie_Request.html (before </body>)

   Uses localStorage key: leveny_tour_seen
   Passes ?tour=1 to request page so the tour continues there.
============================================================ */

(function () {
  'use strict';

  /* ── Guard: already seen ── */
  if (localStorage.getItem('leveny_tour_seen')) return;

  const IS_MOBILE = window.innerWidth <= 768;
  const IS_REQUEST_PAGE = window.location.pathname.includes('Movie_Request');
  const IS_TOUR_CONTINUE = new URLSearchParams(window.location.search).get('tour') === '1';

  /* Only run on homepage (fresh visit) OR request page (continued tour) */
  if (IS_REQUEST_PAGE && !IS_TOUR_CONTINUE) return;

  /* ============================================================
     STEP DEFINITIONS
  ============================================================ */
  const HOMEPAGE_STEPS = [
    {
      targetFn: () => IS_MOBILE
        ? document.querySelector('#mobileBottomNav a[href="Movie_Request.html"]')
        : document.querySelector('.nav_links a[href="Movie_Request.html"]'),
      title: 'Welcome to Leveny 👋',
      text: "We're still growing our library! If a movie you want isn't here yet, you can request it and we'll add it.",
      position: IS_MOBILE ? 'top' : 'bottom',
    },
    {
      targetFn: () => IS_MOBILE
        ? document.querySelector('#mobileBottomNav a[href="Movie_Request.html"]')
        : document.querySelector('.nav_links a[href="Movie_Request.html"]'),
      title: 'How the library grows',
      text: 'Every request helps us prioritise what to add next. The more requests a movie gets, the faster it lands on Leveny.',
      position: IS_MOBILE ? 'top' : 'bottom',
      finalStep: true, /* triggers redirect to request page on Next */
    },
  ];

  const REQUEST_STEPS = [
    {
      targetFn: () => IS_MOBILE
        ? document.getElementById('mobReqHero')
        : document.querySelector('.request-hero'),
      title: 'The Request Centre',
      text: "This is where you ask for movies. There are two types of request — a brand-new movie, or a streaming link for one already listed.",
      position: 'bottom',
    },
    {
      targetFn: () => IS_MOBILE
        ? document.querySelector('#mob-new-movie')
        : document.querySelector('#new-movie .request-form-section'),
      title: 'Fill in the form',
      text: "Give us the movie title, release year, and genre. These are the key details we need to track down and add your movie.",
      position: 'bottom',
      scrollBlock: 'center',
    },
    {
      targetFn: () => IS_MOBILE
        ? document.querySelector('#mobHowItWorks .mob-how-card:nth-child(6)')
        : document.querySelector('.info-cards:last-of-type .info-card:last-child'),
      title: 'How long does it take?',
      text: "Once you submit, your request is typically reviewed and processed within 3–5 business days. Sit tight — we'll get it sorted.",
      position: 'top',
    },
    {
      targetFn: () => IS_MOBILE
        ? document.querySelector('.mob-tab-btn[data-mob-tab="mob-stream-request"]')
        : document.querySelector('.tab-btn[data-tab="stream-request"]'),
      title: 'Already listed? No stream?',
      text: "If a movie is already on Leveny but has no video player yet, use the Stream Link tab to request the streaming link specifically. It's faster than a full new-movie request.",
      position: 'bottom',
    },
    {
      targetFn: () => IS_MOBILE
        ? document.querySelector('.mob-suggest-bar')
        : document.querySelector('.suggest-bar'),
      title: 'Got ideas for the site?',
      text: "Use the suggestion link to send feedback directly — whether it's a feature idea, a bug you spotted, or anything you'd like to see improved on Leveny.",
      position: 'top',
      scrollBlock: 'end',
      lastStep: true,
    },
  ];

  const STEPS = IS_REQUEST_PAGE ? REQUEST_STEPS : HOMEPAGE_STEPS;

  /* ============================================================
     STATE
  ============================================================ */
  let currentStep = 0;

  /* ============================================================
     INJECT STYLES
  ============================================================ */
  const style = document.createElement('style');
  style.textContent = `
    /* ── Overlay backdrop ── */
    #levenyTourOverlay {
      position: fixed;
      inset: 0;
      z-index: 9000;
      pointer-events: none;
    }

    /* ── Spotlight cutout via box-shadow ── */
    #levenyTourSpotlight {
      position: fixed;
      z-index: 9001;
      border-radius: 8px;
      pointer-events: none;
      transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
      box-shadow:
        0 0 0 3px rgba(0,168,255,1),
        0 0 0 9999px rgba(0,0,0,0.72);
    }

    /* ── Tooltip box ── */
    #levenyTourTooltip {
      position: fixed;
      z-index: 9002;
      width: min(320px, 88vw);
      border-radius: 18px;
      padding: 20px 20px 16px;
      background: rgba(10,10,20,0.96);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(0,168,255,0.30);
      box-shadow:
        0 0 0 1px rgba(0,168,255,0.10),
        0 16px 48px rgba(0,0,0,0.70),
        0 0 28px rgba(0,168,255,0.14);
      transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
      font-family: 'Rajdhani', sans-serif;
    }

    /* Arrow pointer */
    #levenyTourTooltip::before {
      content: '';
      position: absolute;
      width: 12px;
      height: 12px;
      background: rgba(10,10,20,0.96);
      border-left: 1px solid rgba(0,168,255,0.30);
      border-top: 1px solid rgba(0,168,255,0.30);
      border-radius: 2px 0 0 0;
    }

    #levenyTourTooltip.arrow-bottom::before {
      bottom: -7px;
      left: 24px;
      transform: rotate(225deg);
    }

    #levenyTourTooltip.arrow-top::before {
      top: -7px;
      left: 24px;
      transform: rotate(45deg);
    }

    #levenyTourTooltip.arrow-right::before {
      left: -7px;
      top: 20px;
      transform: rotate(-45deg);
    }

    /* Step counter pill */
    #levenyTourStep {
      display: inline-block;
      font-family: 'Rajdhani', sans-serif;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: rgba(0,168,255,0.80);
      background: rgba(0,168,255,0.10);
      border: 1px solid rgba(0,168,255,0.22);
      border-radius: 20px;
      padding: 3px 10px;
      margin-bottom: 10px;
    }

    #levenyTourTitle {
      font-family: 'Rajdhani', sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 8px;
      letter-spacing: 0.3px;
    }

    #levenyTourText {
      font-family: 'Rajdhani', sans-serif;
      font-size: 13px;
      color: rgba(200,210,230,0.75);
      line-height: 1.6;
      margin: 0 0 16px;
    }

    /* Buttons row */
    #levenyTourBtns {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    #levenyTourNext {
      flex: 1;
      padding: 10px 14px;
      border-radius: 12px;
      border: 1px solid rgba(0,168,255,0.38);
      background: rgba(0,168,255,0.22);
      color: #00A8FF;
      font-family: 'Rajdhani', sans-serif;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      transition: background 0.2s, box-shadow 0.2s;
      box-shadow: 0 0 14px rgba(0,168,255,0.18);
    }

    #levenyTourNext:hover {
      background: rgba(0,168,255,0.32);
      box-shadow: 0 0 20px rgba(0,168,255,0.28);
    }

    #levenyTourPrev {
      padding: 10px 14px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.12);
      background: transparent;
      color: rgba(200,210,230,0.55);
      font-family: 'Rajdhani', sans-serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
    }

    #levenyTourPrev:hover {
      background: rgba(255,255,255,0.06);
      color: rgba(200,210,230,0.80);
    }

    #levenyTourSkip {
      padding: 10px 12px;
      border-radius: 12px;
      border: none;
      background: transparent;
      color: rgba(200,210,230,0.35);
      font-family: 'Rajdhani', sans-serif;
      font-size: 12px;
      cursor: pointer;
      transition: color 0.2s;
      white-space: nowrap;
    }

    #levenyTourSkip:hover { color: rgba(200,210,230,0.65); }

    /* Dot indicators */
    #levenyTourDots {
      display: flex;
      gap: 5px;
      align-items: center;
      justify-content: center;
      margin-bottom: 14px;
    }

    .ltour-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: rgba(255,255,255,0.18);
      transition: background 0.3s, transform 0.3s;
    }

    .ltour-dot.active {
      background: #00A8FF;
      transform: scale(1.35);
    }

    /* Entrance animation */
    @keyframes ltourIn {
      from { opacity: 0; transform: translateY(10px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    #levenyTourTooltip.entering { animation: ltourIn 0.3s ease both; }
  `;
  document.head.appendChild(style);

  /* ============================================================
     BUILD DOM
  ============================================================ */
  const overlay = document.createElement('div');
  overlay.id = 'levenyTourOverlay';
  document.body.appendChild(overlay);

  const spotlight = document.createElement('div');
  spotlight.id = 'levenyTourSpotlight';
  document.body.appendChild(spotlight);

  const tooltip = document.createElement('div');
  tooltip.id = 'levenyTourTooltip';
  tooltip.innerHTML = `
    <div id="levenyTourStep"></div>
    <div id="levenyTourDots"></div>
    <div id="levenyTourTitle"></div>
    <div id="levenyTourText"></div>
    <div id="levenyTourBtns">
      <button id="levenyTourPrev">← Back</button>
      <button id="levenyTourNext"></button>
      <button id="levenyTourSkip">Skip</button>
    </div>
  `;
  document.body.appendChild(tooltip);

  const elStep  = document.getElementById('levenyTourStep');
  const elDots  = document.getElementById('levenyTourDots');
  const elTitle = document.getElementById('levenyTourTitle');
  const elText  = document.getElementById('levenyTourText');
  const elNext  = document.getElementById('levenyTourNext');
  const elPrev  = document.getElementById('levenyTourPrev');
  const elSkip  = document.getElementById('levenyTourSkip');

  /* ============================================================
     HELPERS
  ============================================================ */
  function getRect(el, step) {
    const r = el.getBoundingClientRect();
    const PAD = 4;
    const computedRadius = window.getComputedStyle(el).borderRadius;
    const parsedRadius = parseFloat(computedRadius);
    spotlight.style.borderRadius = step && step.borderRadius
      ? step.borderRadius
      : (parsedRadius > 2) ? computedRadius : '12px';
    return {
      top:    r.top    - PAD,
      left:   r.left   - PAD,
      width:  r.width  + PAD * 2,
      height: r.height + PAD * 2,
      bottom: r.bottom + PAD,
      right:  r.right  + PAD,
      centerX: r.left + r.width / 2,
      centerY: r.top  + r.height / 2,
    };
  }

  function positionTooltip(rect, position) {
    const TW = tooltip.offsetWidth  || 320;
    const TH = tooltip.offsetHeight || 180;
    const VW = window.innerWidth;
    const VH = window.innerHeight;
    const MARGIN = 12;

    let top, left;

    if (position === 'bottom') {
      top  = rect.bottom + MARGIN;
      left = rect.left;
    } else if (position === 'top') {
      top  = rect.top - TH - MARGIN;
      left = rect.left;
    } else if (position === 'right') {
      top  = rect.top;
      left = rect.right + MARGIN;
    } else {
      top  = rect.bottom + MARGIN;
      left = rect.left;
    }

    /* Clamp within viewport */
    left = Math.max(MARGIN, Math.min(left, VW - TW - MARGIN));
    top  = Math.max(MARGIN, Math.min(top,  VH - TH - MARGIN));

    tooltip.style.top  = top  + 'px';
    tooltip.style.left = left + 'px';

    /* Arrow direction */
    tooltip.classList.remove('arrow-bottom', 'arrow-top', 'arrow-right');
    if (position === 'bottom') tooltip.classList.add('arrow-top');
    else if (position === 'top') tooltip.classList.add('arrow-bottom');
    else if (position === 'right') tooltip.classList.add('arrow-right');
  }

  function buildDots() {
    elDots.innerHTML = '';
    STEPS.forEach((_, i) => {
      const d = document.createElement('div');
      d.className = 'ltour-dot' + (i === currentStep ? ' active' : '');
      elDots.appendChild(d);
    });
  }

  /* ============================================================
     RENDER STEP
     - If the target is already fully in the viewport: measure
       immediately (no scroll, no delay).
     - If it needs scrolling: unlock scroll, scroll smoothly,
       wait for it to finish, then lock and measure.
  ============================================================ */
  function renderStep(idx) {
    const step = STEPS[idx];
    const target = step.targetFn();

    if (!target) { advance(); return; }

    /* Is the target already fully visible? */
    const rawRect = target.getBoundingClientRect();
    const alreadyVisible =
      rawRect.top    >= 0 &&
      rawRect.left   >= 0 &&
      rawRect.bottom <= window.innerHeight &&
      rawRect.right  <= window.innerWidth;

    function applyStep() {
      /* Lock scroll while the tooltip is shown */
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      const rect = getRect(target, step);

      /* Spotlight */
      spotlight.style.top    = rect.top    + 'px';
      spotlight.style.left   = rect.left   + 'px';
      spotlight.style.width  = rect.width  + 'px';
      spotlight.style.height = rect.height + 'px';

      /* Tooltip content */
      const globalTotal = HOMEPAGE_STEPS.length + REQUEST_STEPS.length;
      const globalCurrent = IS_REQUEST_PAGE
        ? HOMEPAGE_STEPS.length + idx + 1
        : idx + 1;

      elStep.textContent  = `Step ${globalCurrent} of ${globalTotal}`;
      elTitle.textContent = step.title;
      elText.textContent  = step.text;

      const isFinal = step.lastStep;
      elNext.innerHTML = isFinal
        ? '<i class="fas fa-check"></i> Done'
        : step.finalStep
          ? 'See Request Page <i class="fas fa-arrow-right"></i>'
          : 'Next <i class="fas fa-arrow-right"></i>';

      /* Hide Back on the very first step of the whole tour (homepage step 0)
         and on the very first step of the request page (request step 0) */
      const isVeryFirstStep = (idx === 0);
      elPrev.style.display = isVeryFirstStep ? 'none' : '';

      buildDots();

      /* Animate tooltip in */
      tooltip.classList.remove('entering');
      void tooltip.offsetWidth; /* reflow */
      tooltip.classList.add('entering');
      positionTooltip(rect, step.position);
    }

    if (alreadyVisible) {
      /* Target is on-screen — no scroll needed, no delay */
      applyStep();
    } else {
      /* Need to scroll to bring target into view */
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      target.scrollIntoView({ behavior: 'smooth', block: step.scrollBlock || 'center' });
      setTimeout(() => {
        if (IS_MOBILE) window.scrollBy({ top: 80, behavior: 'smooth' });
        setTimeout(applyStep, 350);
      }, 400);
    }
  }

  /* ============================================================
     NAVIGATION
  ============================================================ */
  function teardown() {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    spotlight.remove();
    tooltip.remove();
    overlay.remove();
  }

  function endTour() {
    localStorage.setItem('leveny_tour_seen', '1');
    teardown();
  }

  function advance() {
    const step = STEPS[currentStep];

    /* Last step of request page — mark seen and end */
    if (step.lastStep) { endTour(); return; }

    /* Final step of homepage — tear down UI but do NOT mark seen yet,
       then redirect so the tour continues on the request page */
    if (step.finalStep) {
      teardown();
      window.location.href = 'Movie_Request.html?tour=1';
      return;
    }

    if (currentStep < STEPS.length - 1) {
      currentStep++;
      renderStep(currentStep);
    }
  }

  function goBack() {
    if (currentStep > 0) {
      currentStep--;
      renderStep(currentStep);
    }
  }

  elNext.addEventListener('click', advance);
  elPrev.addEventListener('click', goBack);
  elSkip.addEventListener('click', endTour);

  /* ============================================================
     INIT
  ============================================================ */
  /* Small delay so the page finishes rendering */
  setTimeout(() => renderStep(0), 500);

  /* Reposition on resize */
  window.addEventListener('resize', () => renderStep(currentStep));

})();
