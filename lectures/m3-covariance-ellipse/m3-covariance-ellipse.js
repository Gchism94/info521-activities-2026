/* ============================================================================
   M3 · Covariance Ellipse & Fisher Information explorer.

   FIRST tool in the lectures/ track — the template every future lecture tool
   inherits. Buildless classic script (no ES modules), reusing the shared layer:
     - shell.css        CSS-variable theming + Okabe-Ito --ok-* tokens + components
     - viz-helpers.js   PL.viz.okabe palette + theme-aware grid/text colors
     - D3 v7.9.0, KaTeX 0.16.9 (CDN, pinned)
   The dark/light toggle is tool-local (default dark, no localStorage); it drives
   the same --pl-* variables redefined in index.html's <style>.

   STEP 2 = scaffold: CONFIG + theme toggle + KaTeX + a STUB drawViz that proves
   the shared layer and toggle work. The ellipse math + interactivity land in
   STEP 3.
   ========================================================================== */
(function () {
  'use strict';

  /* ---- CONFIG (single source of truth at the top of the tool) ------------ */
  var CONFIG = {
    dataPath: 'data/nhanes-age-sbp.json',
    defaultN: 40,          // initial design subsample size
    minN: 20,              // smallest subsample the N slider allows
    sigma2: null,          // set to the full-fit sigma_hat^2 once data loads
    // Data colors come ONLY from the shared Okabe-Ito tokens (PL.viz.okabe).
    // Each role pairs a hue with a redundant non-color cue (set in STEP 3):
    colors: {
      data:    PL.viz.okabe.blue,        // scatter — circle marker
      fit:     PL.viz.okabe.vermillion,  // least-squares line — solid
      ellipse: PL.viz.okabe.green,       // theoretical cov ellipse — dashed
      cloud:   PL.viz.okabe.orange,      // resampled w-hat — diamond marker
      truth:   PL.viz.okabe.purple       // true w (= full-data fit) — plus marker
    }
  };

  /* ---- Theme toggle: flips data-theme on <html>. Default dark (set in CSS);
         in-session only, NO localStorage. Re-renders so D3 chrome tracks the
         theme. -------------------------------------------------------------- */
  function initThemeToggle(onChange) {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    var root = document.documentElement;
    function apply(theme) {
      var light = theme === 'light';
      root.setAttribute('data-theme', light ? 'light' : 'dark');
      btn.setAttribute('aria-pressed', light ? 'true' : 'false');
      btn.innerHTML = light ? '☾' : '☀';   // ☾ in light, ☀ in dark
      if (typeof onChange === 'function') onChange();
    }
    apply('dark'); // default
    btn.addEventListener('click', function () {
      apply(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
    });
    // Track OS preference flips too (only matters before the user toggles).
    PL.viz.onThemeChange(function () { if (typeof onChange === 'function') onChange(); });
  }

  /* ---- KaTeX: auto-render the static $…$ / $$…$$ in the page once loaded. -- */
  function renderMath() {
    if (window.renderMathInElement) {
      window.renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false
      });
    }
  }

  /* ---- STUB drawViz: placeholder in each panel to confirm the shared layer +
         theme toggle render cleanly before the math is wired in STEP 3. ------ */
  function drawViz() {
    [['#svg-left', 'scatter + least-squares fit'],
     ['#svg-right', 'parameter plane + covariance ellipse']
    ].forEach(function (pair) {
      var svg = d3.select(pair[0]);
      svg.selectAll('*').remove();
      var vb = svg.attr('viewBox').split(' ').map(Number);
      var w = vb[2], h = vb[3];
      svg.append('rect')
        .attr('x', 6).attr('y', 6).attr('width', w - 12).attr('height', h - 12)
        .attr('rx', 8).attr('fill', 'none')
        .attr('stroke', PL.viz.cssVar('--pl-border', '#5f5e5a'))
        .attr('stroke-width', 1.5).attr('stroke-dasharray', '6 5');
      svg.append('text')
        .attr('x', w / 2).attr('y', h / 2 - 8).attr('text-anchor', 'middle')
        .attr('fill', PL.viz.textColor()).attr('font-size', 14).attr('font-weight', 600)
        .text('placeholder');
      svg.append('text')
        .attr('x', w / 2).attr('y', h / 2 + 14).attr('text-anchor', 'middle')
        .attr('fill', PL.viz.textColor()).attr('font-size', 11)
        .text(pair[1] + ' — Step 3');
    });
  }

  /* ---- Boot ------------------------------------------------------------- */
  function init() {
    initThemeToggle(drawViz);   // re-draw so SVG chrome follows theme changes
    renderMath();
    drawViz();
    // STEP 3 will fetch(CONFIG.dataPath), set CONFIG.sigma2, wire the controls,
    // and replace drawViz with the real two-panel ellipse visualization.
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
