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
    unitId: 'week01-least-squares',
    unitNumber: 1,
    token: 'LINMOD-7F3A',          // per-week secret revealed at >= mastery
    masteryThreshold: 0.8,         // 80%
    quizPerAttempt: null,          // null = use full bank
    xLabel: 'Patient age (years)',
    yLabel: 'Resting systolic BP (mmHg)',
    data: [
      [26, 112], [31, 118], [34, 120], [38, 121], [41, 126], [45, 124],
      [48, 131], [52, 129], [55, 134], [58, 138], [61, 140], [64, 143],
      [68, 147], [71, 149], [74, 154]
    ],
    outlier: [30, 168],            // young patient, very high BP
    quiz: [
      { stem: 'Least-squares fitting chooses the line that minimizes\u2026', options: [
        { text: 'the sum of the residuals', correct: false, feedback: 'Positive and negative residuals cancel, so this can be near zero for a bad line.' },
        { text: 'the sum of squared residuals \u2014 equivalently the mean squared error (the loss $\\mathcal{L}$)', correct: true, feedback: 'Correct. Squaring removes sign cancellation and gives a smooth objective.' },
        { text: 'the largest single residual', correct: false, feedback: 'That is minimax (Chebyshev) fitting, a different objective.' },
        { text: 'the number of points off the line', correct: false, feedback: 'Least squares uses distances, not counts.' }
      ]},
      { stem: 'Why squared residuals rather than absolute residuals?', options: [
        { text: 'Squaring forces the line through every point', correct: false, feedback: 'The line rarely passes through any single point.' },
        { text: 'Squared error is differentiable everywhere and has a closed-form solution; it also penalizes large errors more', correct: true, feedback: 'Correct \u2014 smoothness plus the normal-equations solution.' },
        { text: 'Absolute error cannot be computed numerically', correct: false, feedback: 'It can; it is just non-smooth at zero.' },
        { text: 'Squaring is the only way to make residuals non-negative', correct: false, feedback: 'Absolute value also does that; it is not the distinguishing reason.' }
      ]},
      { stem: 'You dragged the line and the loss (MSE) fell. This means\u2026', options: [
        { text: 'every residual got smaller', correct: false, feedback: 'Total squared error fell; some individual residuals may have grown.' },
        { text: 'the line now fits the data better in the least-squares sense', correct: true, feedback: 'Correct \u2014 lower MSE is exactly the least-squares notion of better.' },
        { text: 'the line must now pass through every point', correct: false, feedback: 'Lower MSE does not imply a perfect fit.' },
        { text: 'the slope must have increased', correct: false, feedback: 'MSE can fall from changing slope or intercept, either direction.' }
      ]},
      { stem: 'After "Add outlier," the least-squares line shifts noticeably toward the new point. Why?', options: [
        { text: 'Least squares ignores points far from the line', correct: false, feedback: 'The opposite \u2014 far points dominate.' },
        { text: 'Squared error grows with the square of the residual, so a far point contributes a large penalty and pulls the fit', correct: true, feedback: 'Correct \u2014 sensitivity to outliers is a property of squared loss.' },
        { text: 'Adding a point changes N, and that is what tilts the line', correct: false, feedback: 'N changes, but that is not why the line tilts toward the outlier.' },
        { text: 'Outliers are explicitly up-weighted in the normal equations', correct: false, feedback: 'There is no explicit weighting; the squaring does it.' }
      ]},
      { stem: 'The normal equations give the least-squares solution as\u2026', options: [
        { text: '$\\hat{w} = (X^\\top X)^{-1} X^\\top y$', correct: true, feedback: 'Correct.' },
        { text: '$\\hat{w} = X^\\top y$', correct: false, feedback: 'Missing the $(X^\\top X)^{-1}$ term.' },
        { text: '$\\hat{w} = (X X^\\top)^{-1} y^\\top X$', correct: false, feedback: 'Wrong shapes and order.' },
        { text: '$\\hat{w} = X^{-1} y$', correct: false, feedback: '$X$ is generally not square or invertible.' }
      ]},
      { stem: 'Extending the model with polynomial or basis features keeps it a <em>linear</em> model because\u2026', options: [
        { text: 'the fitted curve is still a straight line', correct: false, feedback: 'The curve can bend.' },
        { text: 'it is linear in the parameters, even if nonlinear in the inputs', correct: true, feedback: 'Correct \u2014 linearity refers to the parameters.' },
        { text: 'only degree-1 features are allowed', correct: false, feedback: 'Higher-degree features are exactly the point.' },
        { text: 'the data must be linearly separable', correct: false, feedback: 'That is a classification notion, not relevant here.' }
      ]},
      { stem: 'Your fitted slope is about 0.8 mmHg per year. The best interpretation is\u2026', options: [
        { text: 'a one-year-older patient is <em>caused</em> to have 0.8 mmHg higher BP', correct: false, feedback: 'A regression slope is association, not causation.' },
        { text: 'on average, patients one year older have ~0.8 mmHg higher BP in this sample', correct: true, feedback: 'Correct \u2014 an average association within the sample.' },
        { text: 'every patient\u2019s BP rises 0.8 mmHg each year', correct: false, feedback: 'It is an average trend, not an individual law.' },
        { text: 'age explains 70% of the variation in BP', correct: false, feedback: 'That would be $R^2$, a different quantity.' }
      ]},
      { stem: 'On a dataset whose true relationship curves sharply, the best straight-line fit will\u2026', options: [
        { text: 'capture the pattern perfectly once MSE is minimized', correct: false, feedback: 'A line cannot bend.' },
        { text: 'underfit \u2014 systematically miss the curvature, leaving structured residuals', correct: true, feedback: 'Correct \u2014 too rigid for the pattern.' },
        { text: 'overfit the curvature', correct: false, feedback: 'Overfitting is excess flexibility; a line is too rigid.' },
        { text: 'be undefined because the relationship is nonlinear', correct: false, feedback: 'The line is still defined, just a poor fit.' }
      ]},
      { stem: 'Moving from regression to <em>linear classification</em>, the fitted line is used to\u2026', options: [
        { text: 'predict a continuous output directly', correct: false, feedback: 'That is regression.' },
        { text: 'define a decision boundary separating classes', correct: true, feedback: 'Correct.' },
        { text: 'minimize squared error against labels with no other change', correct: false, feedback: 'Plain least squares on labels is a weak classifier; the boundary is the point.' },
        { text: 'cluster the points into groups', correct: false, feedback: 'Clustering is unsupervised; classification uses labels.' }
      ]},
      { stem: 'Two features in your design matrix are almost perfectly correlated. The likely effect is\u2026', options: [
        { text: '$X^\\top X$ becomes nearly singular, so coefficients become unstable / high-variance', correct: true, feedback: 'Correct \u2014 collinearity is a known failure mode.' },
        { text: 'no effect; least squares handles any features', correct: false, feedback: 'Collinearity genuinely destabilizes the fit.' },
        { text: 'MSE necessarily increases', correct: false, feedback: 'The fit can look fine while coefficients are unreliable.' },
        { text: 'the model becomes nonlinear', correct: false, feedback: 'Collinearity does not change linearity.' }
      ]},
      { stem: 'Which of these is NOT a linear model (not linear in the parameters $w_0, w_1, w_2$)?', options: [
        { text: '$f = w_0 + w_1 x + w_2 x^3$', correct: false, feedback: 'Linear in the parameters; $x^3$ is just a fixed feature.' },
        { text: '$f = w_0 + \\cos(w_1 x) + w_2 x^2$', correct: true, feedback: 'Correct \u2014 $w_1$ sits inside $\\cos$, so it is nonlinear in a parameter.' },
        { text: '$f = w_0 - w_1 x - w_2 x^2$', correct: false, feedback: 'Linear in the parameters.' },
        { text: '$f = (\\sqrt{w_0}+x)(\\sqrt{w_0}-x) + w_1 - w_2$', correct: false, feedback: 'Expands to $w_0 - x^2 + w_1 - w_2$: linear in the parameters.' }
      ]},
      { stem: 'Least-squares estimates equal maximum-likelihood estimates when you assume\u2026', options: [
        { text: 'the targets are uniformly distributed', correct: false, feedback: 'No.' },
        { text: 'the noise around the line is i.i.d. Gaussian with constant variance', correct: true, feedback: 'Correct \u2014 minimizing squared error equals maximizing the Gaussian likelihood.' },
        { text: 'the features are mutually independent', correct: false, feedback: 'That concerns collinearity, not the LS\u2013MLE link.' },
        { text: 'the parameters have a Gaussian prior', correct: false, feedback: 'That gives MAP / ridge regression, not plain MLE.' }
      ]},
      { stem: 'The closed-form least-squares fit is obtained by\u2026', options: [
        { text: 'running gradient descent to convergence', correct: false, feedback: 'A valid numerical route, but a closed form exists here.' },
        { text: 'taking partial derivatives of the loss w.r.t. each parameter, setting them to zero, and solving', correct: true, feedback: 'Correct.' },
        { text: 'inverting the data matrix $X$ directly', correct: false, feedback: '$X$ is generally not square or invertible.' },
        { text: 'maximizing the loss', correct: false, feedback: 'We minimize the loss, not maximize it.' }
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
