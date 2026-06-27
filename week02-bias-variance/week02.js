/* ============================================================================
   Week 2 — Bias, Variance, Regularization (polynomial ridge explorer + quiz).
   A "thin" week module: dataset + drawViz + quiz bank. Everything reusable
   lives in ../shared/. Only this file changes between weeks.
   ========================================================================== */
(function () {
  'use strict';
  var ok = PL.viz.okabe;

  // ---- CONFIG (the only block that changes per week) ----------------------
  var CONFIG = {
    unitId: 'week02-bias-variance',
    unitNumber: 2,
    token: 'BIASVAR-2C9E',          // rotate per term; add to your week->token map
    masteryThreshold: 0.8,
    quizPerAttempt: null,
    xLabel: 'Treatment dose (mg)',
    yLabel: 'Response score',
    trueFn: function (x) { return -0.032 * (x - 50) * (x - 50) + 100; }, // inverted-U, peak ~100 at dose 50
    xDomain: [0, 100],
    yDomain: [0, 120],
    noiseSd: 8,                     // irreducible noise sigma
    nTrain: 15,
    nTest: 40,
    degree: { min: 1, max: 9, step: 1, default: 1 },
    lambda: { min: 0, max: 1000, step: 1, default: 0, scale: 'log' },
    resamples: 20,                  // overlay count for the bias-variance view
    quiz: [
      { stem: 'The expected test error of a model decomposes into\u2026', options: [
        { text: 'bias$^2$ + variance + irreducible noise', correct: true, feedback: 'Correct \u2014 squared bias, variance, and the irreducible $\\sigma^2$.' },
        { text: 'bias + variance only', correct: false, feedback: 'Missing the irreducible noise term $\\sigma^2$.' },
        { text: 'training error + test error', correct: false, feedback: 'That is not a decomposition of expected test error.' },
        { text: 'variance \u2212 bias', correct: false, feedback: 'The terms add (with bias squared); they do not subtract.' }
      ]},
      { stem: 'A straight line fit to a clearly curved dose\u2013response relationship has\u2026', options: [
        { text: 'high bias, low variance (underfits)', correct: true, feedback: 'Correct \u2014 too rigid to capture the curve, but stable across samples.' },
        { text: 'low bias, high variance', correct: false, feedback: 'That describes an over-flexible model, not a line.' },
        { text: 'high bias, high variance', correct: false, feedback: 'A line is low-variance; it does not fan out across samples.' },
        { text: 'low bias, low variance', correct: false, feedback: 'That would be an ideal fit, not an underfitting line.' }
      ]},
      { stem: 'A degree-9 polynomial fit to 15 noisy points typically has\u2026', options: [
        { text: 'low bias, high variance (overfits)', correct: true, feedback: 'Correct \u2014 flexible enough to chase noise; wildly different fits per sample.' },
        { text: 'high bias, low variance', correct: false, feedback: 'That is underfitting \u2014 the opposite problem.' },
        { text: 'zero test error', correct: false, feedback: 'Train error is near zero, but test error is large.' },
        { text: 'equal train and test error', correct: false, feedback: 'The whole point is the gap between them.' }
      ]},
      { stem: 'Overlaying fits from 20 resampled training sets, the lines fan out widely at high degree. That spread pictures\u2026', options: [
        { text: 'variance', correct: true, feedback: 'Correct \u2014 variance is how much the fitted function changes across samples.' },
        { text: 'bias', correct: false, feedback: 'Bias is the gap between the average fit and the truth, not the spread.' },
        { text: 'irreducible noise', correct: false, feedback: 'That is the scatter of the data points themselves.' },
        { text: 'training error', correct: false, feedback: 'Training error is a number per fit, not the spread across fits.' }
      ]},
      { stem: 'The gap between the average of those 20 fits and the true curve pictures\u2026', options: [
        { text: 'bias', correct: true, feedback: 'Correct \u2014 bias is the systematic error of the average model.' },
        { text: 'variance', correct: false, feedback: 'Variance is their spread, not their average\u2019s offset.' },
        { text: '$\\lambda$', correct: false, feedback: '$\\lambda$ is the regularization strength, not an error component.' },
        { text: 'test error', correct: false, feedback: 'Test error combines bias, variance, and noise.' }
      ]},
      { stem: 'Increasing the ridge penalty $\\lambda$\u2026', options: [
        { text: 'shrinks the coefficients, lowering variance but raising bias', correct: true, feedback: 'Correct \u2014 regularization trades variance for bias.' },
        { text: 'increases variance and lowers bias', correct: false, feedback: 'That is reducing regularization, not increasing it.' },
        { text: 'has no effect on the fit', correct: false, feedback: '$\\lambda$ directly penalizes large weights.' },
        { text: 'removes the irreducible error', correct: false, feedback: 'Nothing removes $\\sigma^2$.' }
      ]},
      { stem: 'As $\\lambda \\to \\infty$, the ridge solution approaches\u2026', options: [
        { text: 'a flat fit at the data\u2019s mean (slope coefficients $\\to 0$)', correct: true, feedback: 'Correct \u2014 the penalty shrinks the slope weights toward zero, leaving the unpenalized intercept at the mean.' },
        { text: 'the ordinary least-squares fit', correct: false, feedback: 'That is the $\\lambda \\to 0$ limit.' },
        { text: 'a perfect interpolation of the data', correct: false, feedback: 'The opposite \u2014 maximal shrinkage, not maximal flexibility.' },
        { text: 'an undefined model', correct: false, feedback: 'It is well defined: the constant/mean fit.' }
      ]},
      { stem: 'Setting $\\lambda = 0$ gives\u2026', options: [
        { text: 'ordinary least squares (no penalty)', correct: true, feedback: 'Correct \u2014 with no penalty term it is plain least squares.' },
        { text: 'a constant model', correct: false, feedback: 'That is the $\\lambda \\to \\infty$ limit.' },
        { text: 'ridge with maximal shrinkage', correct: false, feedback: 'Zero penalty means no shrinkage.' },
        { text: 'an undefined fit', correct: false, feedback: 'It is just the unregularized fit.' }
      ]},
      { stem: 'As polynomial degree increases, training and test error typically\u2026', options: [
        { text: 'training error keeps falling; test error falls then rises (U-shaped)', correct: true, feedback: 'Correct \u2014 the classic generalization gap opening up.' },
        { text: 'both fall monotonically', correct: false, feedback: 'Test error eventually rises as the model overfits.' },
        { text: 'both rise', correct: false, feedback: 'Training error falls with added flexibility.' },
        { text: 'training error rises; test error falls', correct: false, feedback: 'Backwards \u2014 more flexibility lowers training error.' }
      ]},
      { stem: 'Collecting more training data primarily\u2026', options: [
        { text: 'reduces variance (fits cluster tighter); it will not fix an underfitting model', correct: true, feedback: 'Correct \u2014 more data tightens variance but cannot rescue a too-rigid model.' },
        { text: 'reduces the bias of an underfitting model', correct: false, feedback: 'A model too simple stays biased no matter how much data you add.' },
        { text: 'removes the irreducible noise', correct: false, feedback: '$\\sigma^2$ is fixed by the data-generating process.' },
        { text: 'always lowers training error', correct: false, feedback: 'Training error often rises slightly with more points.' }
      ]},
      { stem: 'The irreducible error in $y = f(\\mathbf{x}) + \\epsilon$ comes from\u2026', options: [
        { text: 'the noise variance $\\sigma^2$ \u2014 no model can beat it', correct: true, feedback: 'Correct \u2014 a floor set by the data, not the model.' },
        { text: 'choosing too low a degree', correct: false, feedback: 'That is bias, which is reducible.' },
        { text: 'choosing too high a degree', correct: false, feedback: 'That is variance, which is reducible.' },
        { text: 'not using regularization', correct: false, feedback: 'Regularization cannot remove $\\sigma^2$.' }
      ]},
      { stem: 'Fitting linear regression by maximum likelihood under $\\mathcal{N}(y \\mid \\mathbf{w}^\\top\\mathbf{x}, \\sigma^2)$ is equivalent to\u2026', options: [
        { text: 'minimizing the mean squared error', correct: true, feedback: 'Correct \u2014 Gaussian-noise MLE is exactly least squares (the Week 1 link).' },
        { text: 'minimizing the absolute error', correct: false, feedback: 'That corresponds to Laplace noise, not Gaussian.' },
        { text: 'maximizing the margin', correct: false, feedback: 'That is the SVM objective.' },
        { text: 'minimizing $\\lambda$', correct: false, feedback: '$\\lambda$ is a hyperparameter, not the likelihood objective.' }
      ]},
      { stem: 'Ridge changes the normal equations to $\\hat{\\mathbf{w}} = (\\mathbf{X}^\\top\\mathbf{X} + \\lambda\\mathbf{I})^{-1}\\mathbf{X}^\\top\\mathbf{y}$. The $\\lambda\\mathbf{I}$ term\u2026', options: [
        { text: 'makes $\\mathbf{X}^\\top\\mathbf{X}$ better-conditioned / invertible, stabilizing the solution', correct: true, feedback: 'Correct \u2014 it fixes the near-singular $\\mathbf{X}^\\top\\mathbf{X}$ from collinearity (Week 1\u2019s last item).' },
        { text: 'has no effect when features are correlated', correct: false, feedback: 'Correlated features are exactly when it helps most.' },
        { text: 'makes the model nonlinear', correct: false, feedback: 'The model stays linear in the parameters.' },
        { text: 'removes the need for data', correct: false, feedback: 'You still fit to data; it only regularizes.' }
      ]}
    ]
  };

  // ---- numerics -----------------------------------------------------------
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // Scale x to roughly [-1, 1] BEFORE building the Vandermonde matrix. Without
  // this, degree-9 terms (x^9 with x up to 100) wreck the condition number and
  // the fit garbles. This is the one easy-to-miss numerical-stability bug.
  var xMid = (CONFIG.xDomain[0] + CONFIG.xDomain[1]) / 2;
  var xHalf = (CONFIG.xDomain[1] - CONFIG.xDomain[0]) / 2 || 1;
  function scaleX(xv) { return (xv - xMid) / xHalf; }

  // Standard-normal noise via Box-Muller.
  function gaussian() {
    var u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  // Vandermonde row [1, s, s^2, ..., s^deg] for a scaled input s.
  function vrow(s, deg) {
    var r = [1], p = 1, k;
    for (k = 1; k <= deg; k++) { p *= s; r.push(p); }
    return r;
  }

  // Solve A w = b by Gaussian elimination with partial pivoting (small system).
  function solveLinear(A, b) {
    var n = A.length, i, j, k;
    var M = A.map(function (row, idx) { return row.slice().concat([b[idx]]); });
    for (i = 0; i < n; i++) {
      var piv = i;
      for (k = i + 1; k < n; k++) { if (Math.abs(M[k][i]) > Math.abs(M[piv][i])) piv = k; }
      if (piv !== i) { var tmp = M[i]; M[i] = M[piv]; M[piv] = tmp; }
      var d = M[i][i];
      if (Math.abs(d) < 1e-12) continue;
      for (k = i + 1; k < n; k++) {
        var f = M[k][i] / d;
        for (j = i; j <= n; j++) M[k][j] -= f * M[i][j];
      }
    }
    var w = new Array(n).fill(0);
    for (i = n - 1; i >= 0; i--) {
      var s = M[i][n];
      for (j = i + 1; j < n; j++) s -= M[i][j] * w[j];
      w[i] = Math.abs(M[i][i]) < 1e-12 ? 0 : s / M[i][i];
    }
    return w;
  }

  // Ridge least squares on the polynomial design matrix:
  //   w_hat = (X^T X + lambda*R)^-1 X^T y,  R = diag(0, 1, 1, ...)
  // The intercept (index 0) is NOT penalized, so lambda -> infinity gives the
  // flat mean fit rather than collapsing to zero far below the data.
  function ridgeFit(scaledXs, ys, deg, lambda) {
    var m = deg + 1, n = scaledXs.length, i, j, k;
    var rows = scaledXs.map(function (s) { return vrow(s, deg); });
    var A = [], b = [];
    for (i = 0; i < m; i++) {
      A[i] = [];
      for (j = 0; j < m; j++) {
        var sum = 0;
        for (k = 0; k < n; k++) sum += rows[k][i] * rows[k][j];
        A[i][j] = sum;
      }
      var sb = 0;
      for (k = 0; k < n; k++) sb += rows[k][i] * ys[k];
      b[i] = sb;
    }
    for (i = 1; i < m; i++) A[i][i] += lambda; // i = 0 is the unpenalized intercept
    return solveLinear(A, b);
  }

  function predict(w, xv) {
    var s = scaleX(xv), y = 0, p = 1, k;
    for (k = 0; k < w.length; k++) { y += w[k] * p; p *= s; }
    return y;
  }
  function mseOf(xs, ys, w) {
    var sum = 0, i, r;
    for (i = 0; i < xs.length; i++) { r = ys[i] - predict(w, xs[i]); sum += r * r; }
    return xs.length ? sum / xs.length : 0;
  }

  // ---- lambda <-> slider position (log scale, exact 0 at the far left) -----
  var LAM_LO_EXP = -2, LAM_HI_EXP = 3, LAM_POS = 1000; // pos 1..1000 -> 10^-2..10^3
  function posToLambda(pos) {
    if (pos <= 0) return 0;
    return Math.pow(10, LAM_LO_EXP + (LAM_HI_EXP - LAM_LO_EXP) * (pos / LAM_POS));
  }
  function lambdaToPos(lam) {
    if (lam <= 0) return 0;
    var frac = (Math.log(lam) / Math.LN10 - LAM_LO_EXP) / (LAM_HI_EXP - LAM_LO_EXP);
    return Math.round(clamp(frac, 0, 1) * LAM_POS);
  }
  function fmtLambda(lam) {
    if (lam <= 0) return '0';
    if (lam < 1) return lam.toFixed(3);
    if (lam < 10) return lam.toFixed(2);
    if (lam < 100) return lam.toFixed(1);
    return lam.toFixed(0);
  }

  // ---- data: fixed design points, resampled noise -------------------------
  function linspace(a, bv, n) {
    var out = [], i;
    for (i = 0; i < n; i++) out.push(a + (bv - a) * (n === 1 ? 0.5 : i / (n - 1)));
    return out;
  }
  // Training x positions are FIXED; only the noise is resampled, so the spread
  // of refits is variance from noise (not from moving the design points).
  var trainX = linspace(CONFIG.xDomain[0] + 3, CONFIG.xDomain[1] - 3, CONFIG.nTrain);
  var trainXs = trainX.map(scaleX);
  var testX = linspace(CONFIG.xDomain[0] + 1, CONFIG.xDomain[1] - 1, CONFIG.nTest);
  function noisyY(xs) {
    return xs.map(function (xv) { return CONFIG.trueFn(xv) + CONFIG.noiseSd * gaussian(); });
  }
  function makeResamples() {
    var out = [], i;
    for (i = 0; i < CONFIG.resamples; i++) out.push(noisyY(trainX));
    return out;
  }

  var trainY = noisyY(trainX);
  var testY = noisyY(testX);          // held-out set, fixed across resamples
  var resampleYs = makeResamples();   // 20 datasets for the overlay

  var state = {
    degree: CONFIG.degree.default,
    lambda: CONFIG.lambda.default,
    showOverlay: false,
    showTest: false
  };

  // ---- chart scaffold -----------------------------------------------------
  var W = 660, H = 410, margin = { top: 14, right: 16, bottom: 46, left: 54 };
  var iw = W - margin.left - margin.right, ih = H - margin.top - margin.bottom;
  var svg = d3.select('#chart').append('svg')
    .attr('viewBox', '0 0 ' + W + ' ' + H)
    .attr('width', '100%')
    .attr('role', 'img')
    .attr('aria-label', 'Scatter of ' + CONFIG.yLabel + ' versus ' + CONFIG.xLabel +
      ', with the true curve and an adjustable polynomial ridge fit.');
  var g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  var x = d3.scaleLinear().domain(CONFIG.xDomain).range([0, iw]);
  var y = d3.scaleLinear().domain(CONFIG.yDomain).range([ih, 0]);
  var diamond = d3.symbol().type(d3.symbolDiamond).size(42);

  // clip curves so wild high-degree fits stay inside the plot area
  var clipId = 'clip-' + CONFIG.unitId;
  svg.append('defs').append('clipPath').attr('id', clipId)
    .append('rect').attr('width', iw).attr('height', ih);

  var gx = g.append('g').attr('transform', 'translate(0,' + ih + ')');
  var gy = g.append('g');
  g.append('text').attr('class', 'pl-axis-label').attr('x', iw / 2).attr('y', ih + 38)
    .attr('text-anchor', 'middle').text(CONFIG.xLabel);
  g.append('text').attr('class', 'pl-axis-label').attr('transform', 'rotate(-90)')
    .attr('x', -ih / 2).attr('y', -40).attr('text-anchor', 'middle').text(CONFIG.yLabel);

  var gCurves = g.append('g').attr('clip-path', 'url(#' + clipId + ')');
  var gOverlay = gCurves.append('g');                            // 20-fit overlay
  var trueCurve = gCurves.append('path').attr('class', 'pl-true-curve');
  var fitCurve = gCurves.append('path').attr('class', 'pl-fit-curve');
  var gTest = g.append('g');                                     // test points
  var gTrain = g.append('g');                                    // training points

  var line = d3.line()
    .x(function (d) { return x(d[0]); })
    .y(function (d) { return y(d[1]); });
  var dense = linspace(CONFIG.xDomain[0], CONFIG.xDomain[1], 160);
  function curvePoints(fn) { return dense.map(function (xv) { return [xv, fn(xv)]; }); }

  function drawAxes() {
    gx.call(d3.axisBottom(x).ticks(7));
    gy.call(d3.axisLeft(y).ticks(6));
    [gx, gy].forEach(function (ax) {
      ax.selectAll('path, line').attr('stroke', PL.viz.gridColor());
      ax.selectAll('text').attr('fill', PL.viz.textColor());
    });
  }
  function setText(id, t) { var e = document.getElementById(id); if (e) e.textContent = t; }

  // ---- draw ---------------------------------------------------------------
  function redraw() {
    var w = ridgeFit(trainXs, trainY, state.degree, state.lambda);

    // true curve: sky blue, dashed \u2014 the fixed reference
    trueCurve.attr('d', line(curvePoints(CONFIG.trueFn)))
      .attr('fill', 'none').attr('stroke', ok.sky)
      .attr('stroke-width', 2).attr('stroke-dasharray', '6 4');

    // 20-fit overlay: refit each resampled dataset at the CURRENT degree/lambda
    // so the fan reacts live (widens with degree, tightens with lambda).
    var overlayData = state.showOverlay ? resampleYs.map(function (ys) {
      var wr = ridgeFit(trainXs, ys, state.degree, state.lambda);
      return curvePoints(function (xv) { return predict(wr, xv); });
    }) : [];
    var ov = gOverlay.selectAll('path').data(overlayData);
    ov.enter().append('path')
      .attr('fill', 'none').attr('stroke', ok.purple)
      .attr('stroke-width', 1).attr('stroke-opacity', 0.22)
      .merge(ov)
      .attr('d', function (d) { return line(d); });
    ov.exit().remove();

    // current fit: reddish purple, solid, bold
    fitCurve.attr('d', line(curvePoints(function (xv) { return predict(w, xv); })))
      .attr('fill', 'none').attr('stroke', ok.purple).attr('stroke-width', 2.5);

    // test points: orange diamonds (shape cue), faint, only when toggled on
    var testData = state.showTest ? testX.map(function (xv, i) { return [xv, testY[i]]; }) : [];
    var ts = gTest.selectAll('path').data(testData);
    ts.enter().append('path').attr('d', diamond)
      .attr('fill', ok.orange).attr('fill-opacity', 0.55)
      .merge(ts)
      .attr('transform', function (d) { return 'translate(' + x(d[0]) + ',' + y(d[1]) + ')'; });
    ts.exit().remove();

    // training points: blue circles
    var trainData = trainX.map(function (xv, i) { return [xv, trainY[i]]; });
    var ds = gTrain.selectAll('circle').data(trainData);
    ds.enter().append('circle').attr('class', 'pl-dot').attr('r', 5)
      .merge(ds)
      .attr('cx', function (d) { return x(d[0]); })
      .attr('cy', function (d) { return y(d[1]); });
    ds.exit().remove();

    setText('val-degree', String(state.degree));
    setText('val-lambda', fmtLambda(state.lambda));
    setText('val-trainmse', mseOf(trainX, trainY, w).toFixed(2));
    setText('val-testmse', mseOf(testX, testY, w).toFixed(2));
  }

  // ---- controls -----------------------------------------------------------
  function bindDegree() {
    var range = document.getElementById('rng-degree');
    var num = document.getElementById('num-degree');
    var d = CONFIG.degree;
    [range, num].forEach(function (inp) { inp.min = d.min; inp.max = d.max; inp.step = d.step; inp.value = state.degree; });
    range.addEventListener('input', function () { state.degree = parseInt(range.value, 10); num.value = range.value; redraw(); });
    num.addEventListener('input', function () {
      var v = parseInt(num.value, 10); if (isNaN(v)) return;
      v = clamp(v, d.min, d.max); state.degree = v; range.value = v; redraw();
    });
  }
  function bindLambda() {
    var range = document.getElementById('rng-lambda');
    var num = document.getElementById('num-lambda');
    range.min = 0; range.max = LAM_POS; range.step = 1; range.value = lambdaToPos(state.lambda);
    num.min = CONFIG.lambda.min; num.max = CONFIG.lambda.max; num.step = 'any'; num.value = fmtLambda(state.lambda);
    range.addEventListener('input', function () {
      state.lambda = posToLambda(parseInt(range.value, 10));
      num.value = fmtLambda(state.lambda); redraw();
    });
    num.addEventListener('input', function () {
      var v = parseFloat(num.value); if (isNaN(v)) return;
      v = clamp(v, CONFIG.lambda.min, CONFIG.lambda.max); state.lambda = v;
      range.value = lambdaToPos(v); redraw();
    });
  }
  function syncControls() {
    var rd = document.getElementById('rng-degree'), nd = document.getElementById('num-degree');
    if (rd) rd.value = state.degree; if (nd) nd.value = String(state.degree);
    var rl = document.getElementById('rng-lambda'), nl = document.getElementById('num-lambda');
    if (rl) rl.value = lambdaToPos(state.lambda); if (nl) nl.value = fmtLambda(state.lambda);
  }

  document.getElementById('btn-newsample').addEventListener('click', function () {
    trainY = noisyY(trainX);
    redraw();
  });
  var btnOverlay = document.getElementById('btn-overlay');
  btnOverlay.addEventListener('click', function () {
    state.showOverlay = !state.showOverlay;
    this.setAttribute('aria-pressed', String(state.showOverlay));
    this.textContent = state.showOverlay ? 'Hide 20 fits' : 'Show 20 fits';
    redraw();
  });
  var btnTest = document.getElementById('btn-test');
  btnTest.addEventListener('click', function () {
    state.showTest = !state.showTest;
    this.setAttribute('aria-pressed', String(state.showTest));
    this.textContent = state.showTest ? 'Hide test points' : 'Show test points';
    redraw();
  });
  document.getElementById('btn-reset').addEventListener('click', function () {
    state.degree = CONFIG.degree.default;
    state.lambda = CONFIG.lambda.default;
    state.showOverlay = false;
    state.showTest = false;
    trainY = noisyY(trainX);
    resampleYs = makeResamples();
    btnOverlay.textContent = 'Show 20 fits'; btnOverlay.setAttribute('aria-pressed', 'false');
    btnTest.textContent = 'Show test points'; btnTest.setAttribute('aria-pressed', 'false');
    syncControls(); redraw();
  });

  // ---- init ---------------------------------------------------------------
  bindDegree(); bindLambda();
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
