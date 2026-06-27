/* ============================================================================
   Week 6 — Principal Component Analysis (projection explorer + mastery quiz).
   A "thin" week module: dataset + drawViz + quiz bank. Everything reusable
   lives in ../shared/. Only CONFIG changes between weeks.
   ========================================================================== */
(function () {
  'use strict';
  var ok = PL.viz.okabe;

  // ---- CONFIG (the only block that changes per week) ----------------------
  var CONFIG = {
    unitId: 'week06-pca',
    unitNumber: 6,
    token: 'PCA-9W4T',              // rotate per term; add to your week->token map
    masteryThreshold: 0.8,
    quizPerAttempt: null,
    xLabel: 'Systolic BP (mmHg)',
    yLabel: 'Diastolic BP (mmHg)',
    theta: { min: 0, max: 180, step: 1, default: 0 },  // candidate axis angle, degrees
    // 24 patients, two correlated measurements
    data: [
      [112,72],[116,74],[120,78],[118,75],[124,80],[128,82],[122,79],[132,85],
      [130,83],[136,88],[140,90],[134,86],[144,92],[148,95],[142,91],[152,97],
      [150,96],[156,99],[160,102],[154,98],[164,104],[158,100],[168,107],[146,93]
    ],
    quiz: [
      { stem: 'PCA\u2019s first step is to subtract each feature\u2019s mean (center the data). This matters because\u2026', options: [
        { text: 'the components then describe variance about the mean and pass through the centroid, not the origin', correct: true, feedback: 'Correct \u2014 centering ensures the components capture spread about the data\u2019s center.' },
        { text: 'it puts all features on the same scale', correct: false, feedback: 'That is standardization \u2014 a separate, optional step.' },
        { text: 'it removes outliers', correct: false, feedback: 'Centering does not remove points.' },
        { text: 'it sorts the data', correct: false, feedback: 'Order is irrelevant to PCA.' }
      ]},
      { stem: 'The first principal component (PC1) is the direction that\u2026', options: [
        { text: 'maximizes the variance of the data projected onto it', correct: true, feedback: 'Correct \u2014 PC1 is the maximal-variance direction; rotate the axis in the tool to find it.' },
        { text: 'minimizes the variance of the projections', correct: false, feedback: 'That would be the least-variance direction (PC2 in 2-D).' },
        { text: 'is always parallel to the x-axis', correct: false, feedback: 'Only by coincidence.' },
        { text: 'passes through the most data points', correct: false, feedback: 'PCA is about variance, not point counts.' }
      ]},
      { stem: 'PC1 also minimizes the total squared reconstruction (perpendicular) error. These two views are\u2026', options: [
        { text: 'equivalent \u2014 total variance is fixed, so maximizing projected variance minimizes residual variance', correct: true, feedback: 'Correct \u2014 two faces of the same optimum (the tool shows both at once).' },
        { text: 'contradictory', correct: false, feedback: 'They coincide exactly.' },
        { text: 'equivalent only for uncorrelated features', correct: false, feedback: 'It holds always, by the fixed-total-variance argument.' },
        { text: 'unrelated to PCA', correct: false, feedback: 'They are two derivations of PCA.' }
      ]},
      { stem: 'The principal components are the \u2026 of the covariance matrix $\\boldsymbol{\\Sigma}$, and the variance along each is the corresponding \u2026', options: [
        { text: 'eigenvectors; eigenvalue', correct: true, feedback: 'Correct \u2014 PCs are eigenvectors of $\\boldsymbol{\\Sigma}$; eigenvalues give the variance along each.' },
        { text: 'rows; determinant', correct: false, feedback: 'No \u2014 PCs come from the eigen-decomposition.' },
        { text: 'columns; trace', correct: false, feedback: 'The trace is the total variance, not a per-axis value.' },
        { text: 'inverses; rank', correct: false, feedback: 'Unrelated to PCA.' }
      ]},
      { stem: 'PC2 is\u2026', options: [
        { text: 'orthogonal to PC1, capturing the most remaining variance', correct: true, feedback: 'Correct \u2014 components are mutually orthogonal; PC2 is the next-most-variance direction.' },
        { text: 'parallel to PC1', correct: false, feedback: 'Components are orthogonal, not parallel.' },
        { text: 'the mean of the data', correct: false, feedback: 'PC2 is a direction, not a point.' },
        { text: 'always discarded noise', correct: false, feedback: 'In 2-D it is simply the second axis; whether to drop it is a separate choice.' }
      ]},
      { stem: 'The fraction of variance explained by PC1 is\u2026', options: [
        { text: '$\\lambda_1 / (\\lambda_1 + \\lambda_2)$ \u2014 its eigenvalue over the total', correct: true, feedback: 'Correct \u2014 variance explained is the eigenvalue divided by the trace.' },
        { text: '$\\lambda_1 \\cdot \\lambda_2$', correct: false, feedback: 'Variance explained is a ratio, not a product.' },
        { text: '$1/2$ always', correct: false, feedback: 'It depends on the data\u2019s structure.' },
        { text: '$\\lambda_2 / \\lambda_1$', correct: false, feedback: 'That inverts the ratio.' }
      ]},
      { stem: 'The two BP features here are strongly correlated. Projecting onto PC1 alone therefore\u2026', options: [
        { text: 'retains most of the variance \u2014 an effective 2-D \u2192 1-D reduction with little loss', correct: true, feedback: 'Correct \u2014 correlated features concentrate variance in one direction, so one PC suffices.' },
        { text: 'loses most of the information', correct: false, feedback: 'Correlation means one direction carries most of the variance.' },
        { text: 'is impossible', correct: false, feedback: 'Projection onto a single component is exactly the point.' },
        { text: 'is identical to keeping both components', correct: false, feedback: 'You still drop PC2\u2019s (small) variance.' }
      ]},
      { stem: 'PCA is\u2026', options: [
        { text: 'a linear, orthogonal, unsupervised transformation (uses only $\\mathbf{x}$, no labels)', correct: true, feedback: 'Correct \u2014 PCA rotates to axes of maximal variance, with no labels.' },
        { text: 'a supervised classifier', correct: false, feedback: 'It uses no labels.' },
        { text: 'a nonlinear embedding', correct: false, feedback: 'That describes methods like autoencoders / t-SNE.' },
        { text: 'a clustering algorithm', correct: false, feedback: 'It reduces dimensions; it does not assign clusters.' }
      ]},
      { stem: 'You can compute the principal components from\u2026', options: [
        { text: 'the SVD of the centered data matrix, without explicitly forming $\\boldsymbol{\\Sigma}$ \u2014 often numerically preferable', correct: true, feedback: 'Correct \u2014 SVD of the centered data yields the PCs directly and is more numerically stable.' },
        { text: 'sorting the rows of the data', correct: false, feedback: 'Sorting does nothing for PCA.' },
        { text: 'inverting the data matrix', correct: false, feedback: 'The data matrix is generally not invertible.' },
        { text: 'gradient descent on the labels', correct: false, feedback: 'PCA is unsupervised \u2014 there are no labels.' }
      ]},
      { stem: 'PCA is sensitive to feature scaling because\u2026', options: [
        { text: 'features with larger numeric variance dominate the components \u2014 standardize when features use different scales/units', correct: true, feedback: 'Correct \u2014 variance is scale-dependent; standardize across units (here both are mmHg, so it is already comparable).' },
        { text: 'it ignores variance entirely', correct: false, feedback: 'Variance is exactly what PCA maximizes.' },
        { text: 'scaling has no effect on the eigenvectors', correct: false, feedback: 'Rescaling features changes $\\boldsymbol{\\Sigma}$ and thus the components.' },
        { text: 'it always standardizes internally', correct: false, feedback: 'You must standardize yourself when appropriate.' }
      ]},
      { stem: 'To decide how many components to keep, a common approach is\u2026', options: [
        { text: 'the cumulative variance-explained / scree-plot elbow \u2014 keep enough PCs to reach a target %', correct: true, feedback: 'Correct \u2014 choose $k$ from the variance-explained curve (e.g., 95%).' },
        { text: 'keep exactly one, always', correct: false, feedback: 'Sometimes one is too few.' },
        { text: 'keep all of them, always', correct: false, feedback: 'That achieves no reduction.' },
        { text: 'pick the number at random', correct: false, feedback: 'Selection is variance-driven, not random.' }
      ]},
      { stem: 'Rotating the projection axis, the projected variance is maximized exactly when the axis aligns with\u2026', options: [
        { text: 'PC1 (the top eigenvector); the maximum value equals $\\lambda_1$', correct: true, feedback: 'Correct \u2014 the peak of projected variance is PC1, and its value is the largest eigenvalue.' },
        { text: 'PC2', correct: false, feedback: 'PC2 is the minimum-variance direction in 2-D.' },
        { text: 'the x-axis', correct: false, feedback: 'Only if PC1 happens to lie there.' },
        { text: 'the mean', correct: false, feedback: 'The mean is a point, not a direction.' }
      ]},
      { stem: 'A limitation of PCA:', options: [
        { text: 'it captures only linear directions of maximal variance \u2014 it can miss nonlinear structure, and max-variance is not always the most useful direction for a task', correct: true, feedback: 'Correct \u2014 PCA is linear and variance-driven; nonlinear methods (skipped this unit) address the first gap.' },
        { text: 'it requires labeled data', correct: false, feedback: 'PCA is unsupervised.' },
        { text: 'it only works on 2-D data', correct: false, feedback: 'It applies in any dimension.' },
        { text: 'it always improves classification accuracy', correct: false, feedback: 'Dropping a low-variance but discriminative direction can hurt.' }
      ]}
    ]
  };

  // ---- numerics & PCA -----------------------------------------------------
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  var DATA = CONFIG.data, N = DATA.length, DEG = Math.PI / 180;

  // center the data; PCA operates on variance about the mean
  var meanX = 0, meanY = 0;
  DATA.forEach(function (p) { meanX += p[0]; meanY += p[1]; }); meanX /= N; meanY /= N;
  var Sxx = 0, Syy = 0, Sxy = 0;
  DATA.forEach(function (p) { var a = p[0] - meanX, b = p[1] - meanY; Sxx += a * a; Syy += b * b; Sxy += a * b; });
  Sxx /= (N - 1); Syy /= (N - 1); Sxy /= (N - 1);                 // 2x2 covariance Sigma

  // closed-form 2x2 symmetric eigen-decomposition
  var TRACE = Sxx + Syy, DETV = Sxx * Syy - Sxy * Sxy;
  var DISC = Math.sqrt(Math.max(0, (TRACE / 2) * (TRACE / 2) - DETV));
  var L1 = TRACE / 2 + DISC, L2 = TRACE / 2 - DISC;              // eigenvalues (variances)
  var V1 = (Math.abs(Sxy) > 1e-9) ? [Sxy, L1 - Sxx] : (Sxx >= Syy ? [1, 0] : [0, 1]);
  var vn = Math.hypot(V1[0], V1[1]) || 1; V1 = [V1[0] / vn, V1[1] / vn];   // PC1 (top eigenvector)
  var V2 = [-V1[1], V1[0]];                                      // PC2, orthogonal
  var PC1_DEG = (function () { var a = Math.atan2(V1[1], V1[0]) / DEG; return a < 0 ? a + 180 : a; })();
  // variance of the projection onto u = (cos t, sin t): u' Sigma u
  function projVar(deg) { var t = deg * DEG, c = Math.cos(t), s = Math.sin(t); return Sxx * c * c + 2 * Sxy * c * s + Syy * s * s; }

  var state = { theta: CONFIG.theta.default, showComponents: false };

  // ---- chart scaffold (equal aspect so projections look perpendicular) -----
  var W = 660, H = 410, margin = { top: 14, right: 16, bottom: 46, left: 56 };
  var iw = W - margin.left - margin.right, ih = H - margin.top - margin.bottom;
  var svg = d3.select('#chart').append('svg')
    .attr('viewBox', '0 0 ' + W + ' ' + H).attr('width', '100%')
    .attr('role', 'img')
    .attr('aria-label', 'PCA of patients by ' + CONFIG.xLabel + ' and ' + CONFIG.yLabel +
      ', with a rotatable projection axis through the mean.');
  var g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  var xr = d3.extent(DATA, function (d) { return d[0]; });
  var yr = d3.extent(DATA, function (d) { return d[1]; });
  var sc = Math.min(iw / ((xr[1] - xr[0]) * 1.35), ih / ((yr[1] - yr[0]) * 1.35));   // px per mmHg, equal
  var x = d3.scaleLinear().domain([meanX - iw / (2 * sc), meanX + iw / (2 * sc)]).range([0, iw]);
  var y = d3.scaleLinear().domain([meanY - ih / (2 * sc), meanY + ih / (2 * sc)]).range([ih, 0]);

  var clipId = 'clip-' + CONFIG.unitId;
  svg.append('defs').append('clipPath').attr('id', clipId).append('rect').attr('width', iw).attr('height', ih);

  var gx = g.append('g').attr('transform', 'translate(0,' + ih + ')');
  var gy = g.append('g');
  g.append('text').attr('class', 'pl-axis-label').attr('x', iw / 2).attr('y', ih + 38)
    .attr('text-anchor', 'middle').text(CONFIG.xLabel);
  g.append('text').attr('class', 'pl-axis-label').attr('transform', 'rotate(-90)')
    .attr('x', -ih / 2).attr('y', -46).attr('text-anchor', 'middle').text(CONFIG.yLabel);

  var gClip = g.append('g').attr('clip-path', 'url(#' + clipId + ')');
  var ellipse = gClip.append('path');
  var gResid = gClip.append('g');
  var axisLine = gClip.append('line');
  var pc1Line = gClip.append('line'), pc2Line = gClip.append('line');
  var gFeet = gClip.append('g');
  var gPoints = g.append('g');
  var meanMark = g.append('path');

  function drawAxes() {
    gx.call(d3.axisBottom(x).ticks(7));
    gy.call(d3.axisLeft(y).ticks(6));
    [gx, gy].forEach(function (ax) {
      ax.selectAll('path, line').attr('stroke', PL.viz.gridColor());
      ax.selectAll('text').attr('fill', PL.viz.textColor());
    });
  }
  function setText(id, t) { var e = document.getElementById(id); if (e) e.textContent = t; }

  function redraw() {
    var th = state.theta, t = th * DEG, ux = Math.cos(t), uy = Math.sin(t);

    // candidate projection axis through the mean
    var HL = x.domain()[1] - x.domain()[0];
    axisLine.attr('x1', x(meanX - HL * ux)).attr('y1', y(meanY - HL * uy))
      .attr('x2', x(meanX + HL * ux)).attr('y2', y(meanY + HL * uy))
      .attr('stroke', ok.purple).attr('stroke-width', 2.5);

    // perpendicular feet + residual segments (maximize variance <=> minimize residuals)
    var feet = DATA.map(function (p) { var dx = p[0] - meanX, dy = p[1] - meanY, tt = dx * ux + dy * uy; return [meanX + tt * ux, meanY + tt * uy]; });
    var rs = gResid.selectAll('line').data(DATA);
    rs.enter().append('line').merge(rs)
      .attr('x1', function (d) { return x(d[0]); }).attr('y1', function (d) { return y(d[1]); })
      .attr('x2', function (d, i) { return x(feet[i][0]); }).attr('y2', function (d, i) { return y(feet[i][1]); })
      .attr('stroke', PL.viz.textColor()).attr('stroke-opacity', 0.28).attr('stroke-width', 1);
    rs.exit().remove();
    var ft = gFeet.selectAll('circle').data(feet);
    ft.enter().append('circle').attr('r', 2.5).merge(ft)
      .attr('cx', function (d) { return x(d[0]); }).attr('cy', function (d) { return y(d[1]); })
      .attr('fill', ok.purple);
    ft.exit().remove();

    // principal components + 1-sigma covariance ellipse
    if (state.showComponents) {
      var r1 = Math.sqrt(L1), r2 = Math.sqrt(L2);
      pc1Line.style('display', null)
        .attr('x1', x(meanX - r1 * V1[0])).attr('y1', y(meanY - r1 * V1[1]))
        .attr('x2', x(meanX + r1 * V1[0])).attr('y2', y(meanY + r1 * V1[1]))
        .attr('stroke', ok.green).attr('stroke-width', 3).attr('stroke-dasharray', '9 4');
      pc2Line.style('display', null)
        .attr('x1', x(meanX - r2 * V2[0])).attr('y1', y(meanY - r2 * V2[1]))
        .attr('x2', x(meanX + r2 * V2[0])).attr('y2', y(meanY + r2 * V2[1]))
        .attr('stroke', ok.orange).attr('stroke-width', 3).attr('stroke-dasharray', '2 3');
      var pts = [], k;
      for (k = 0; k <= 64; k++) {
        var aa = k / 64 * 2 * Math.PI, cc = Math.cos(aa), ss = Math.sin(aa);
        pts.push([meanX + r1 * cc * V1[0] + r2 * ss * V2[0], meanY + r1 * cc * V1[1] + r2 * ss * V2[1]]);
      }
      ellipse.style('display', null)
        .attr('d', d3.line().x(function (p) { return x(p[0]); }).y(function (p) { return y(p[1]); })(pts))
        .attr('fill', 'none').attr('stroke', PL.viz.textColor()).attr('stroke-opacity', 0.4)
        .attr('stroke-width', 1).attr('stroke-dasharray', '3 3');
    } else {
      pc1Line.style('display', 'none'); pc2Line.style('display', 'none'); ellipse.style('display', 'none');
    }

    // patients
    var ds = gPoints.selectAll('circle').data(DATA);
    ds.enter().append('circle').attr('r', 5).merge(ds)
      .attr('cx', function (d) { return x(d[0]); }).attr('cy', function (d) { return y(d[1]); })
      .attr('fill', ok.blue).attr('fill-opacity', 0.9)
      .attr('stroke', PL.viz.cssVar('--pl-card', '#fff')).attr('stroke-width', 1);
    ds.exit().remove();

    // mean marker (distinct cross; all axes pass through it)
    meanMark.attr('d', d3.symbol().type(d3.symbolCross).size(170)())
      .attr('transform', 'translate(' + x(meanX) + ',' + y(meanY) + ')')
      .attr('fill', PL.viz.textColor()).attr('stroke', PL.viz.cssVar('--pl-card', '#fff')).attr('stroke-width', 1);

    // readouts
    var pv = projVar(th);
    setText('val-theta', th + '°');
    setText('val-varcap', (100 * pv / TRACE).toFixed(1) + '%');
    setText('val-projvar', pv.toFixed(1));
    setText('val-recon', Math.max(0, TRACE - pv).toFixed(1));
  }

  // ---- controls -----------------------------------------------------------
  function bindTheta() {
    var range = document.getElementById('rng-theta'), num = document.getElementById('num-theta'), s = CONFIG.theta;
    [range, num].forEach(function (inp) { inp.min = s.min; inp.max = s.max; inp.step = s.step; inp.value = state.theta; });
    range.addEventListener('input', function () { state.theta = parseInt(range.value, 10); num.value = range.value; redraw(); });
    num.addEventListener('input', function () { var v = parseInt(num.value, 10); if (isNaN(v)) return; v = clamp(v, s.min, s.max); state.theta = v; range.value = v; redraw(); });
  }
  function syncTheta() { var r = document.getElementById('rng-theta'), n = document.getElementById('num-theta'); if (r) r.value = state.theta; if (n) n.value = state.theta; }

  document.getElementById('btn-snap').addEventListener('click', function () {
    state.theta = clamp(Math.round(PC1_DEG), CONFIG.theta.min, CONFIG.theta.max);
    syncTheta(); redraw();
  });
  var btnComp = document.getElementById('btn-components');
  btnComp.addEventListener('click', function () {
    state.showComponents = !state.showComponents;
    this.setAttribute('aria-pressed', String(state.showComponents));
    this.textContent = state.showComponents ? 'Hide both components' : 'Show both components';
    redraw();
  });
  document.getElementById('btn-reset').addEventListener('click', function () {
    state.theta = CONFIG.theta.default; state.showComponents = false;
    btnComp.textContent = 'Show both components'; btnComp.setAttribute('aria-pressed', 'false');
    syncTheta(); redraw();
  });

  // ---- init ---------------------------------------------------------------
  bindTheta();
  drawAxes(); redraw();
  PL.viz.onThemeChange(function () { drawAxes(); redraw(); });
  PL.mountQuiz(document.getElementById('quiz'), CONFIG);

  window.addEventListener('load', function () {
    if (window.renderMathInElement) {
      renderMathInElement(document.querySelector('.pl-container'), {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false
      });
    }
  });
})();
