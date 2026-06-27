/* ============================================================================
   Week 1 — The Linear Model (least-squares explorer + mastery quiz).
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

  // ---- math helpers -------------------------------------------------------
  function lsq(pts) {
    var n = pts.length, sx = 0, sy = 0, sxx = 0, sxy = 0, i, x, y;
    for (i = 0; i < n; i++) { x = pts[i][0]; y = pts[i][1]; sx += x; sy += y; sxx += x * x; sxy += x * y; }
    var xbar = sx / n, ybar = sy / n, denom = sxx - n * xbar * xbar;
    var w1 = denom !== 0 ? (sxy - n * xbar * ybar) / denom : 0;
    return { w0: ybar - w1 * xbar, w1: w1 };
  }
  function mse(pts, w0, w1) {
    var s = 0, i, r;
    for (i = 0; i < pts.length; i++) { r = pts[i][1] - (w0 + w1 * pts[i][0]); s += r * r; }
    return s / pts.length;
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // ---- state --------------------------------------------------------------
  var DEFAULTS = { w0: 95, w1: 0.4 };
  var SLIDER = { w0: { min: 60, max: 140, step: 0.5 }, w1: { min: -0.5, max: 2.5, step: 0.01 } };
  var state = { w0: DEFAULTS.w0, w1: DEFAULTS.w1, showLS: false, outlierOn: false };
  function pts() { return state.outlierOn ? CONFIG.data.concat([CONFIG.outlier]) : CONFIG.data; }

  // ---- chart scaffold -----------------------------------------------------
  var W = 660, H = 410, margin = { top: 14, right: 16, bottom: 46, left: 54 };
  var iw = W - margin.left - margin.right, ih = H - margin.top - margin.bottom;
  var svg = d3.select('#chart').append('svg')
    .attr('viewBox', '0 0 ' + W + ' ' + H)
    .attr('width', '100%')
    .attr('role', 'img')
    .attr('aria-label', 'Scatter of ' + CONFIG.yLabel + ' versus ' + CONFIG.xLabel +
      ', with a fit line you can drag or adjust with sliders.');
  var g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  var x = d3.scaleLinear().domain([22, 78]).range([0, iw]);
  var y = d3.scaleLinear().domain([100, 175]).range([ih, 0]);
  var diamond = d3.symbol().type(d3.symbolDiamond).size(120);

  var gx = g.append('g').attr('transform', 'translate(0,' + ih + ')');
  var gy = g.append('g');
  g.append('text').attr('class', 'pl-axis-label').attr('x', iw / 2).attr('y', ih + 38)
    .attr('text-anchor', 'middle').text(CONFIG.xLabel);
  g.append('text').attr('class', 'pl-axis-label').attr('transform', 'rotate(-90)')
    .attr('x', -ih / 2).attr('y', -40).attr('text-anchor', 'middle').text(CONFIG.yLabel);

  var gResid = g.append('g');
  var gDots = g.append('g');
  var lsLine = g.append('line').attr('class', 'pl-ls-line').style('display', 'none');
  var fitLine = g.append('line').attr('class', 'pl-fit-line');
  var gHandles = g.append('g');

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
    var P = pts(), xd = x.domain();

    var rs = gResid.selectAll('line').data(P);
    rs.enter().append('line').attr('class', 'pl-resid').merge(rs)
      .attr('x1', function (d) { return x(d[0]); })
      .attr('x2', function (d) { return x(d[0]); })
      .attr('y1', function (d) { return y(d[1]); })
      .attr('y2', function (d) { return y(state.w0 + state.w1 * d[0]); });
    rs.exit().remove();

    var ds = gDots.selectAll('circle').data(CONFIG.data);
    ds.enter().append('circle').attr('class', 'pl-dot').attr('r', 5).merge(ds)
      .attr('cx', function (d) { return x(d[0]); })
      .attr('cy', function (d) { return y(d[1]); });
    ds.exit().remove();

    var ol = gDots.selectAll('path.pl-outlier').data(state.outlierOn ? [CONFIG.outlier] : []);
    ol.enter().append('path').attr('class', 'pl-outlier').attr('d', diamond).merge(ol)
      .attr('transform', function (d) { return 'translate(' + x(d[0]) + ',' + y(d[1]) + ')'; });
    ol.exit().remove();

    fitLine
      .attr('x1', x(xd[0])).attr('y1', y(state.w0 + state.w1 * xd[0]))
      .attr('x2', x(xd[1])).attr('y2', y(state.w0 + state.w1 * xd[1]));

    var hs = [
      { x: xd[0], y: state.w0 + state.w1 * xd[0], i: 0 },
      { x: xd[1], y: state.w0 + state.w1 * xd[1], i: 1 }
    ];
    var hh = gHandles.selectAll('circle').data(hs);
    hh.enter().append('circle').attr('class', 'pl-handle').attr('r', 8)
      .attr('tabindex', 0).attr('role', 'slider').attr('aria-label', 'Drag to tilt the fit line')
      .call(d3.drag().on('drag', onDrag))
      .merge(hh)
      .attr('cx', function (d) { return x(d.x); })
      .attr('cy', function (d) { return y(d.y); })
      .each(function (d) { this.__i = d.i; });

    var ls = lsq(P);
    if (state.showLS) {
      lsLine.style('display', null)
        .attr('x1', x(xd[0])).attr('y1', y(ls.w0 + ls.w1 * xd[0]))
        .attr('x2', x(xd[1])).attr('y2', y(ls.w0 + ls.w1 * xd[1]));
    } else {
      lsLine.style('display', 'none');
    }

    setText('val-w0', state.w0.toFixed(2));
    setText('val-w1', state.w1.toFixed(3));
    setText('val-mse', mse(P, state.w0, state.w1).toFixed(2));
    setText('val-lsmse', mse(P, ls.w0, ls.w1).toFixed(2));
  }

  function onDrag(event) {
    var i = this.__i, xd = x.domain();
    var newY = y.invert(event.y);
    var yL = (i === 0) ? newY : (state.w0 + state.w1 * xd[0]);
    var yR = (i === 1) ? newY : (state.w0 + state.w1 * xd[1]);
    var w1 = (yR - yL) / (xd[1] - xd[0]);
    var w0 = yL - w1 * xd[0];
    state.w1 = clamp(w1, SLIDER.w1.min, SLIDER.w1.max);
    state.w0 = clamp(w0, SLIDER.w0.min, SLIDER.w0.max);
    syncControls();
    redraw();
  }

  // ---- controls -----------------------------------------------------------
  function bindSlider(name) {
    var range = document.getElementById('rng-' + name);
    var num = document.getElementById('num-' + name);
    var s = SLIDER[name];
    [range, num].forEach(function (inp) { inp.min = s.min; inp.max = s.max; inp.step = s.step; inp.value = state[name]; });
    range.addEventListener('input', function () { state[name] = parseFloat(range.value); num.value = range.value; redraw(); });
    num.addEventListener('input', function () {
      var v = parseFloat(num.value); if (isNaN(v)) return;
      v = clamp(v, s.min, s.max); state[name] = v; range.value = v; redraw();
    });
  }
  function syncControls() {
    ['w0', 'w1'].forEach(function (n) {
      var r = document.getElementById('rng-' + n), m = document.getElementById('num-' + n);
      if (r) r.value = state[n];
      if (m) m.value = (n === 'w1' ? state[n].toFixed(3) : state[n].toFixed(2));
    });
  }

  document.getElementById('btn-ls').addEventListener('click', function () {
    state.showLS = !state.showLS;
    this.setAttribute('aria-pressed', String(state.showLS));
    this.textContent = state.showLS ? 'Hide least-squares solution' : 'Show least-squares solution';
    redraw();
  });
  document.getElementById('btn-outlier').addEventListener('click', function () {
    state.outlierOn = !state.outlierOn;
    this.setAttribute('aria-pressed', String(state.outlierOn));
    this.textContent = state.outlierOn ? 'Remove outlier' : 'Add outlier';
    redraw();
  });
  document.getElementById('btn-reset').addEventListener('click', function () {
    state.w0 = DEFAULTS.w0; state.w1 = DEFAULTS.w1; state.showLS = false; state.outlierOn = false;
    document.getElementById('btn-ls').textContent = 'Show least-squares solution';
    document.getElementById('btn-ls').setAttribute('aria-pressed', 'false');
    document.getElementById('btn-outlier').textContent = 'Add outlier';
    document.getElementById('btn-outlier').setAttribute('aria-pressed', 'false');
    syncControls(); redraw();
  });

  // ---- init ---------------------------------------------------------------
  bindSlider('w0'); bindSlider('w1');
  drawAxes(); redraw();
  PL.viz.onThemeChange(drawAxes);
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
