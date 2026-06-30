/* ============================================================================
   M3 · Covariance Ellipse & Fisher Information explorer.

   FIRST tool in the lectures/ track — the template future lecture tools inherit.
   Buildless classic script (no ES modules), reusing the shared layer:
     - shell.css        CSS-variable theming + Okabe-Ito --ok-* tokens + components
     - viz-helpers.js   PL.viz.okabe palette + theme-aware grid/text colors
     - D3 v7.9.0, KaTeX 0.16.9 (CDN, pinned)
   Dark/light toggle is tool-local (default dark, no localStorage), driving the
   same --pl-* variables redefined in index.html's <style>.

   PEDAGOGY: the full-data fit w_true is treated as the FIXED true w. The ellipse
   is the sampling distribution of w-hat under y = X·w_true + ε, ε~N(0,σ²I), for
   the CURRENT design X. Resampling regenerates y and refits — the empirical
   cloud provably fills the theoretical ellipse (Clay's "10,000 datasets", live).
   ========================================================================== */
(function () {
  'use strict';

  /* ---- CONFIG (single source of truth at the top of the tool) ------------ */
  var CONFIG = {
    dataPath: 'data/nhanes-age-sbp.json',
    defaultN: 40,          // initial design subsample size
    minN: 20,              // smallest subsample the N slider allows
    sigma2: null,          // set to the full-fit sigma_hat^2 once data loads
    seed: 521,             // fixes the nested subsample order (reproducible)
    chi2_95_2df: 5.991,    // 95% contour scale for a 2-D Gaussian
    colors: {              // data colors come ONLY from shared Okabe-Ito tokens
      data:    PL.viz.okabe.blue,        // scatter — circle marker
      fit:     PL.viz.okabe.vermillion,  // least-squares line — solid
      ellipse: PL.viz.okabe.green,       // theoretical cov ellipse — dashed
      cloud:   PL.viz.okabe.orange,      // resampled w-hat — diamond marker
      truth:   PL.viz.okabe.purple       // true w (= full-data fit) — plus marker
    }
  };

  /* ---- Tiny 2×2 linear algebra (no numpy in the browser) ----------------- */
  function inv2(M) {                       // M = [[a,b],[b,d]] symmetric
    var a = M[0][0], b = M[0][1], d = M[1][1];
    var det = a * d - b * b;
    return [[d / det, -b / det], [-b / det, a / det]];
  }
  function mul2v(M, v) { return [M[0][0] * v[0] + M[0][1] * v[1], M[1][0] * v[0] + M[1][1] * v[1]]; }
  function scale2(M, s) { return [[M[0][0] * s, M[0][1] * s], [M[1][0] * s, M[1][1] * s]]; }

  function eig2sym(C) {                     // eigen-decomp of symmetric 2×2
    var a = C[0][0], b = C[0][1], d = C[1][1];
    var tr = a + d, disc = Math.sqrt(((a - d) / 2) * ((a - d) / 2) + b * b);
    var l1 = tr / 2 + disc, l2 = tr / 2 - disc;
    var v1;
    if (Math.abs(b) > 1e-12) v1 = [l1 - d, b];
    else v1 = (a >= d) ? [1, 0] : [0, 1];
    var n1 = Math.hypot(v1[0], v1[1]); v1 = [v1[0] / n1, v1[1] / n1];
    var v2 = [-v1[1], v1[0]];               // orthogonal
    return { l1: Math.max(l1, 0), l2: Math.max(l2, 0), v1: v1, v2: v2 };
  }

  // 95% covariance-ellipse polyline centered at mu (cov C).
  function ellipsePoints(mu, C, n) {
    var e = eig2sym(C), k = Math.sqrt(CONFIG.chi2_95_2df), pts = [];
    var r1 = k * Math.sqrt(e.l1), r2 = k * Math.sqrt(e.l2);
    for (var i = 0; i <= n; i++) {
      var t = (i / n) * 2 * Math.PI, c = Math.cos(t), s = Math.sin(t);
      pts.push([
        mu[0] + r1 * c * e.v1[0] + r2 * s * e.v2[0],
        mu[1] + r1 * c * e.v1[1] + r2 * s * e.v2[1]
      ]);
    }
    return pts;
  }

  /* ---- Seeded RNG (mulberry32) + Gaussian (Box-Muller) ------------------- */
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(sd) {                       // N(0, sd²) via Box-Muller, Math.random
    var u = 1 - Math.random(), v = Math.random();
    return sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /* ---- Module state, populated on data load ------------------------------ */
  var S = {
    Z: [], Y: [],            // rows reordered by the seeded nested-subsample order
    cumSz: [], cumSzz: [], cumSy: [], cumSzy: [],  // prefix sums for O(1) designs
    N_full: 0,
    wTrue: null,             // full-data fit = the fixed true w
    state: { N: 0, sigma2: 0, cloud: [] },
    domW0: null, domW1: null // fixed right-panel domain (so the ellipse shrinks in place)
  };

  // XᵀX, Xᵀy for the first-N subsample, from prefix sums.
  function designMoments(N) {
    return {
      XtX: [[N, S.cumSz[N]], [S.cumSz[N], S.cumSzz[N]]],
      Xty: [S.cumSy[N], S.cumSzy[N]]
    };
  }
  function fitFromMoments(m) { return mul2v(inv2(m.XtX), m.Xty); }       // ŵ
  function covOf(N, sigma2) { return scale2(inv2(designMoments(N).XtX), sigma2); }
  function fisherOf(N, sigma2) { return scale2(designMoments(N).XtX, 1 / sigma2); }

  /* ---- Theme toggle: flips data-theme on <html>. Default dark; in-session
         only, NO localStorage. Re-renders so D3 chrome tracks the theme. ----- */
  function initThemeToggle(onChange) {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    var root = document.documentElement;
    function apply(theme) {
      var light = theme === 'light';
      root.setAttribute('data-theme', light ? 'light' : 'dark');
      btn.setAttribute('aria-pressed', light ? 'true' : 'false');
      btn.innerHTML = light ? '☾' : '☀';
      if (typeof onChange === 'function') onChange();
    }
    apply('dark');
    btn.addEventListener('click', function () {
      apply(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
    });
    PL.viz.onThemeChange(function () { if (typeof onChange === 'function') onChange(); });
  }

  function renderMath() {
    if (window.renderMathInElement) {
      window.renderMathInElement(document.body, {
        delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }],
        throwOnError: false
      });
    }
  }

  /* ---- Drawing ----------------------------------------------------------- */
  var M = { top: 18, right: 16, bottom: 40, left: 50 };

  function panelDims(sel) {
    var vb = d3.select(sel).attr('viewBox').split(' ').map(Number);
    return { w: vb[2], h: vb[3], iw: vb[2] - M.left - M.right, ih: vb[3] - M.top - M.bottom };
  }

  function styleAxis(g) {
    g.selectAll('path,line').attr('stroke', PL.viz.gridColor());
    g.selectAll('text').attr('fill', PL.viz.textColor()).attr('font-size', 10);
  }

  // LEFT: scatter of current design + its least-squares fit line.
  function drawLeft() {
    var svg = d3.select('#svg-left'); svg.selectAll('*').remove();
    var D = panelDims('#svg-left'), N = S.state.N;
    var x = d3.scaleLinear().domain(S.zExtent).range([M.left, M.left + D.iw]);
    var y = d3.scaleLinear().domain(S.yExtent).range([M.top + D.ih, M.top]);

    var gx = svg.append('g').attr('transform', 'translate(0,' + (M.top + D.ih) + ')').call(d3.axisBottom(x).ticks(5));
    var gy = svg.append('g').attr('transform', 'translate(' + M.left + ',0)').call(d3.axisLeft(y).ticks(5));
    styleAxis(gx); styleAxis(gy);
    svg.append('text').attr('x', M.left + D.iw / 2).attr('y', D.h - 6).attr('text-anchor', 'middle')
      .attr('fill', PL.viz.textColor()).attr('font-size', 11).text('standardized age (z)');
    svg.append('text').attr('transform', 'rotate(-90)').attr('x', -(M.top + D.ih / 2)).attr('y', 13)
      .attr('text-anchor', 'middle').attr('fill', PL.viz.textColor()).attr('font-size', 11).text('systolic BP (mmHg)');

    svg.append('g').selectAll('circle').data(d3.range(N)).enter().append('circle')
      .attr('cx', function (i) { return x(S.Z[i]); }).attr('cy', function (i) { return y(S.Y[i]); })
      .attr('r', 2).attr('fill', CONFIG.colors.data).attr('fill-opacity', 0.35);

    var w = fitFromMoments(designMoments(N));        // observed LS fit for this subsample
    svg.append('line').attr('x1', x(S.zExtent[0])).attr('y1', y(w[0] + w[1] * S.zExtent[0]))
      .attr('x2', x(S.zExtent[1])).attr('y2', y(w[0] + w[1] * S.zExtent[1]))
      .attr('stroke', CONFIG.colors.fit).attr('stroke-width', 2.5);
  }

  // RIGHT: (w0,w1) plane — covariance ellipse at w_true + accumulated cloud.
  function drawRight() {
    var svg = d3.select('#svg-right'); svg.selectAll('*').remove();
    var D = panelDims('#svg-right'), N = S.state.N, sig = S.state.sigma2;
    var x = d3.scaleLinear().domain(S.domW0).range([M.left, M.left + D.iw]);
    var y = d3.scaleLinear().domain(S.domW1).range([M.top + D.ih, M.top]);

    var gx = svg.append('g').attr('transform', 'translate(0,' + (M.top + D.ih) + ')').call(d3.axisBottom(x).ticks(5));
    var gy = svg.append('g').attr('transform', 'translate(' + M.left + ',0)').call(d3.axisLeft(y).ticks(5));
    styleAxis(gx); styleAxis(gy);
    svg.append('text').attr('x', M.left + D.iw / 2).attr('y', D.h - 6).attr('text-anchor', 'middle')
      .attr('fill', PL.viz.textColor()).attr('font-size', 11).text('intercept  w₀');
    svg.append('text').attr('transform', 'rotate(-90)').attr('x', -(M.top + D.ih / 2)).attr('y', 13)
      .attr('text-anchor', 'middle').attr('fill', PL.viz.textColor()).attr('font-size', 11).text('slope  w₁');

    // accumulated resample cloud (orange diamonds) — drawn under the ellipse
    svg.append('g').selectAll('path').data(S.state.cloud).enter().append('path')
      .attr('d', d3.symbol().type(d3.symbolDiamond).size(22))
      .attr('transform', function (d) { return 'translate(' + x(d[0]) + ',' + y(d[1]) + ')'; })
      .attr('fill', CONFIG.colors.cloud).attr('fill-opacity', 0.5);

    // theoretical 95% covariance ellipse (green dashed)
    var pts = ellipsePoints(S.wTrue, covOf(N, sig), 120).map(function (p) { return [x(p[0]), y(p[1])]; });
    svg.append('path').attr('d', d3.line()(pts) + 'Z').attr('fill', 'none')
      .attr('stroke', CONFIG.colors.ellipse).attr('stroke-width', 2.5).attr('stroke-dasharray', '7 4');

    // true w marker (purple plus)
    var cx = x(S.wTrue[0]), cy = y(S.wTrue[1]);
    svg.append('path').attr('d', d3.symbol().type(d3.symbolCross).size(70))
      .attr('transform', 'translate(' + cx + ',' + cy + ')').attr('fill', CONFIG.colors.truth);
  }

  function fmt(v) {
    var a = Math.abs(v);
    if (a === 0) return '0';
    if (a >= 1000 || a < 0.01) return v.toExponential(2);
    if (a >= 100) return v.toFixed(1);
    if (a >= 1) return v.toFixed(2);
    return v.toFixed(3);
  }
  function mat2tex(Mx) {
    return '\\begin{bmatrix}' + fmt(Mx[0][0]) + ' & ' + fmt(Mx[0][1]) + ' \\\\ ' +
      fmt(Mx[1][0]) + ' & ' + fmt(Mx[1][1]) + '\\end{bmatrix}';
  }
  function updateReadout() {
    var N = S.state.N, sig = S.state.sigma2;
    if (!window.katex) return;
    katex.render('\\mathcal{I} = \\tfrac{1}{\\sigma^2}\\mathbf{X}^{\\!\\top}\\mathbf{X} = ' + mat2tex(fisherOf(N, sig)),
      document.getElementById('readout-fisher'), { throwOnError: false, displayMode: true });
    katex.render('\\mathrm{cov}\\{\\hat{\\mathbf{w}}\\} = \\sigma^2(\\mathbf{X}^{\\!\\top}\\mathbf{X})^{-1} = \\mathcal{I}^{-1} = ' + mat2tex(covOf(N, sig)),
      document.getElementById('readout-cov'), { throwOnError: false, displayMode: true });
    document.getElementById('readout-note').textContent =
      'N = ' + N + ' rows · σ² = ' + fmt(sig) + ' · ' + S.state.cloud.length + ' resampled fits';
  }

  function redraw() { drawLeft(); drawRight(); updateReadout(); }

  /* ---- Controls ---------------------------------------------------------- */
  function resampleOnce() {
    var N = S.state.N, sd = Math.sqrt(S.state.sigma2);
    // Hold the current design X fixed; regenerate y = X·w_true + ε and refit.
    var Sy = 0, Szy = 0;
    for (var i = 0; i < N; i++) {
      var yi = S.wTrue[0] + S.wTrue[1] * S.Z[i] + gauss(sd);
      Sy += yi; Szy += S.Z[i] * yi;
    }
    S.state.cloud.push(mul2v(inv2(designMoments(N).XtX), [Sy, Szy]));
  }

  function wireControls() {
    var rngN = document.getElementById('rng-n'), numN = document.getElementById('num-n');
    var rngS = document.getElementById('rng-sigma2'), numS = document.getElementById('num-sigma2');

    rngN.min = numN.min = CONFIG.minN; rngN.max = numN.max = S.N_full;
    rngN.step = numN.step = 1; rngN.value = numN.value = S.state.N;

    var sMin = +(0.25 * CONFIG.sigma2).toFixed(2), sMax = +(3 * CONFIG.sigma2).toFixed(2);
    rngS.min = numS.min = sMin; rngS.max = numS.max = sMax;
    rngS.step = numS.step = +((sMax - sMin) / 100).toFixed(3);
    rngS.value = numS.value = +CONFIG.sigma2.toFixed(2);

    function setN(v) {
      v = Math.max(CONFIG.minN, Math.min(S.N_full, Math.round(+v) || CONFIG.minN));
      S.state.N = v; rngN.value = numN.value = v;
      S.state.cloud = [];                 // design changed → old cloud invalid
      redraw();
    }
    function setSigma(v) {
      v = Math.max(sMin, Math.min(sMax, +v || CONFIG.sigma2));
      S.state.sigma2 = v; rngS.value = numS.value = +v.toFixed(2);
      S.state.cloud = [];                 // noise changed → old cloud invalid
      redraw();
    }
    rngN.addEventListener('input', function () { setN(this.value); });
    numN.addEventListener('change', function () { setN(this.value); });
    rngS.addEventListener('input', function () { setSigma(this.value); });
    numS.addEventListener('change', function () { setSigma(this.value); });

    document.getElementById('btn-resample').addEventListener('click', function () { resampleOnce(); redraw(); });
    document.getElementById('btn-clear').addEventListener('click', function () { S.state.cloud = []; redraw(); });
  }

  /* ---- Boot -------------------------------------------------------------- */
  function setup(data) {
    var rows = data.rows, n = rows.length;
    // Seeded nested subsample order: subsample(N) = first N (so N is a smooth slider).
    var order = d3.range(n), rnd = mulberry32(CONFIG.seed);
    for (var i = n - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = order[i]; order[i] = order[j]; order[j] = t; }
    S.Z = order.map(function (k) { return rows[k].age_z; });
    S.Y = order.map(function (k) { return rows[k].sbp; });
    S.N_full = n;

    // Prefix sums over the shuffled order.
    S.cumSz = [0]; S.cumSzz = [0]; S.cumSy = [0]; S.cumSzy = [0];
    for (var p = 0; p < n; p++) {
      S.cumSz.push(S.cumSz[p] + S.Z[p]);
      S.cumSzz.push(S.cumSzz[p] + S.Z[p] * S.Z[p]);
      S.cumSy.push(S.cumSy[p] + S.Y[p]);
      S.cumSzy.push(S.cumSzy[p] + S.Z[p] * S.Y[p]);
    }

    // Full-data fit = true w; full-data σ̂² = default noise.
    var full = designMoments(n);
    S.wTrue = fitFromMoments(full);
    var yty = 0; for (var q = 0; q < n; q++) yty += S.Y[q] * S.Y[q];
    var sigma2_full = (yty - (S.wTrue[0] * full.Xty[0] + S.wTrue[1] * full.Xty[1])) / n;
    CONFIG.sigma2 = sigma2_full;

    S.zExtent = d3.extent(S.Z); S.yExtent = d3.extent(S.Y);
    S.state.N = CONFIG.defaultN; S.state.sigma2 = sigma2_full; S.state.cloud = [];

    // Fixed right-panel domain: sized to the LARGEST ellipse (N=minN, default σ²)
    // padded ~2×, so the ellipse visibly shrinks in place as N grows / σ² drops.
    var refCov = covOf(CONFIG.minN, sigma2_full);
    var hw0 = 2 * Math.sqrt(CONFIG.chi2_95_2df * refCov[0][0]);
    var hw1 = 2 * Math.sqrt(CONFIG.chi2_95_2df * refCov[1][1]);
    S.domW0 = [S.wTrue[0] - hw0, S.wTrue[0] + hw0];
    S.domW1 = [S.wTrue[1] - hw1, S.wTrue[1] + hw1];

    wireControls();
    redraw();
  }

  function init() {
    initThemeToggle(function () { if (S.wTrue) redraw(); });   // re-draw on theme flip
    renderMath();
    // Data arrives as a <script> global (file://-safe; see CONFIG.dataPath for
    // the canonical JSON the global is generated from).
    if (window.M3_AGE_SBP && window.M3_AGE_SBP.rows) {
      setup(window.M3_AGE_SBP);
    } else {
      var note = document.getElementById('readout-note');
      if (note) note.textContent = 'Data global M3_AGE_SBP not found — is data/nhanes-age-sbp.js loaded before this script?';
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
