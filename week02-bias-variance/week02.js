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
        { text: 'a flat fit (coefficients $\\to 0$)', correct: true, feedback: 'Correct \u2014 the penalty dominates and all weights shrink toward zero.' },
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
