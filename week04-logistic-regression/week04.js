/* ============================================================================
   Week 4 — Logistic Regression (1-D classifier explorer + mastery quiz).
   A "thin" week module: dataset + drawViz + quiz bank. Everything reusable
   lives in ../shared/. Only CONFIG changes between weeks.
   ========================================================================== */
(function () {
  'use strict';
  var ok = PL.viz.okabe;

  // ---- CONFIG (the only block that changes per week) ----------------------
  var CONFIG = {
    unitId: 'week04-logistic-regression',
    unitNumber: 4,
    token: 'LOGIT-8H2M',            // rotate per term; add to your week->token map
    masteryThreshold: 0.8,
    quizPerAttempt: null,
    xLabel: 'Tumor size (mm)',
    yLabel: 'P(malignant)',
    classLabels: { 0: 'Benign', 1: 'Malignant' },
    // [size_mm, class] — intentionally overlapping so the MLE is finite
    data: [
      [8,0],[10,0],[11,0],[13,0],[14,0],[15,0],[16,0],[18,0],[21,0],[23,0],
      [17,1],[19,1],[20,1],[22,1],[24,1],[25,1],[27,1],[29,1],[31,1],[33,1]
    ],
    w0: { min: -25, max: 5,  step: 0.1,  default: -3 },   // bias
    w1: { min: 0.05, max: 1.0, step: 0.01, default: 0.2 }, // steepness
    quiz: [
      { stem: 'Logistic regression turns a linear score $z = w_0 + w_1 x$ into a class probability by applying\u2026', options: [
        { text: 'the sigmoid $\\sigma(z) = 1/(1+e^{-z})$, which maps $z$ to $(0,1)$', correct: true, feedback: 'Correct \u2014 the sigmoid squashes the unbounded score into a $(0,1)$ probability.' },
        { text: 'a step function returning 0 or 1', correct: false, feedback: 'That is a hard threshold, not a probability.' },
        { text: 'the identity ($z$ itself)', correct: false, feedback: '$z$ is unbounded, so it is not a probability.' },
        { text: 'a softmax over the features', correct: false, feedback: 'Softmax is over classes in the multiclass case, not single-feature here.' }
      ]},
      { stem: 'The decision boundary, where $p(y{=}1 \\mid x) = 0.5$, corresponds to the linear score\u2026', options: [
        { text: '$z = w_0 + w_1 x = 0$', correct: true, feedback: 'Correct \u2014 $\\sigma(0) = 0.5$, so the boundary is where the score is zero.' },
        { text: '$z = 0.5$', correct: false, feedback: '$p = 0.5$ corresponds to $z = 0$, not $z = 0.5$.' },
        { text: '$z = 1$', correct: false, feedback: 'That gives $p \\approx 0.73$, not the boundary.' },
        { text: '$z \\to \\infty$', correct: false, feedback: 'That pushes $p \\to 1$, far from the boundary.' }
      ]},
      { stem: 'Logistic regression is a <em>discriminative</em> model because it\u2026', options: [
        { text: 'models $p(y \\mid x)$ directly', correct: true, feedback: 'Correct \u2014 discriminative models target the conditional $p(y\\mid x)$.' },
        { text: 'models $p(x \\mid y)$ and $p(y)$, then applies Bayes\u2019 rule', correct: false, feedback: 'That describes a generative classifier.' },
        { text: 'does not use the class labels', correct: false, feedback: 'It is supervised \u2014 it very much uses the labels.' },
        { text: 'requires a Gaussian assumption on $x$', correct: false, feedback: 'That assumption belongs to a generative model, not logistic regression.' }
      ]},
      { stem: 'A <em>generative</em> classifier (e.g., Gaussian discriminant analysis, naive Bayes) instead\u2026', options: [
        { text: 'models $p(x \\mid y)$ and $p(y)$, then uses Bayes\u2019 rule to get $p(y \\mid x)$', correct: true, feedback: 'Correct \u2014 it models the data within each class, then inverts with Bayes.' },
        { text: 'models $p(y \\mid x)$ directly', correct: false, feedback: 'That is the discriminative approach.' },
        { text: 'has no probabilistic interpretation', correct: false, feedback: 'It is fully probabilistic.' },
        { text: 'can only handle two classes', correct: false, feedback: 'Generative classifiers handle many classes.' }
      ]},
      { stem: 'Unlike linear regression, the logistic objective (cross-entropy / negative log-likelihood) is minimized by\u2026', options: [
        { text: 'iterative optimization (gradient descent or Newton/IRLS); there is no closed form', correct: true, feedback: 'Correct \u2014 no closed form, so we optimize iteratively (what "Show MLE fit" runs).' },
        { text: 'the normal equations $\\hat{\\mathbf{w}} = (\\mathbf{X}^\\top\\mathbf{X})^{-1}\\mathbf{X}^\\top\\mathbf{y}$', correct: false, feedback: 'That is the linear-regression closed form (Week 1).' },
        { text: 'sorting the data by $x$', correct: false, feedback: 'Sorting does not fit a model.' },
        { text: 'a single matrix inverse of the labels', correct: false, feedback: 'There is no such closed form for logistic regression.' }
      ]},
      { stem: 'Why not just fit the 0/1 labels with ordinary least squares?', options: [
        { text: 'squared error is the wrong likelihood for a binary outcome; cross-entropy is the proper objective and keeps predictions in $(0,1)$', correct: true, feedback: 'Correct \u2014 cross-entropy matches the Bernoulli likelihood; least squares on labels is poorly behaved.' },
        { text: 'least squares cannot be computed on binary data', correct: false, feedback: 'It can be computed \u2014 it is just inappropriate.' },
        { text: 'least squares always overfits', correct: false, feedback: 'Not the issue here.' },
        { text: 'there is no difference; they give the same fit', correct: false, feedback: 'They give different, and for classification worse, fits.' }
      ]},
      { stem: 'The \u201clink function\u201d in logistic regression\u2026', options: [
        { text: 'connects the linear predictor to the probability \u2014 the logit (log-odds) is the link, the sigmoid its inverse', correct: true, feedback: 'Correct \u2014 $\\mathrm{logit}(p)=\\log\\frac{p}{1-p}$ is linear in $x$; the sigmoid maps back.' },
        { text: 'is the loss function', correct: false, feedback: 'The link relates predictor to probability; the loss is separate.' },
        { text: 'is the learning rate', correct: false, feedback: 'That is an optimizer setting.' },
        { text: 'is the prior over the weights', correct: false, feedback: 'No \u2014 that would be regularization.' }
      ]},
      { stem: 'Increasing the magnitude of the steepness $w_1$ makes the sigmoid\u2026', options: [
        { text: 'steeper \u2014 predictions become more confident (closer to 0 or 1) near the boundary', correct: true, feedback: 'Correct \u2014 larger $|w_1|$ sharpens the transition; the model is more decisive.' },
        { text: 'flatter', correct: false, feedback: 'That is decreasing $|w_1|$.' },
        { text: 'shift left or right without changing shape', correct: false, feedback: 'That is the role of $w_0$.' },
        { text: 'vertical everywhere', correct: false, feedback: 'It steepens but stays a smooth S-curve.' }
      ]},
      { stem: 'In 1-D the decision threshold is $x^\\* = -w_0/w_1$. Changing the bias $w_0$ primarily\u2026', options: [
        { text: 'shifts the boundary left/right along $x$', correct: true, feedback: 'Correct \u2014 $w_0$ translates the boundary; $w_1$ sets its steepness.' },
        { text: 'changes the steepness of the curve', correct: false, feedback: 'That is $w_1$.' },
        { text: 'flips which class is which', correct: false, feedback: 'The sign of $w_1$ does that, not $w_0$.' },
        { text: 'has no effect', correct: false, feedback: 'It directly moves the threshold.' }
      ]},
      { stem: 'If the two classes were perfectly separable, the logistic-regression MLE weights\u2026', options: [
        { text: 'diverge toward infinity (probabilities pushed to exactly 0/1) \u2014 regularization is needed', correct: true, feedback: 'Correct \u2014 separability has no finite MLE; this is why the tool\u2019s data overlaps and why a prior/ridge helps.' },
        { text: 'settle at a unique finite optimum', correct: false, feedback: 'Separability removes the finite optimum.' },
        { text: 'become exactly zero', correct: false, feedback: 'The opposite \u2014 they grow without bound.' },
        { text: 'are undefined and the model cannot be built', correct: false, feedback: 'Regularization makes it well-posed.' }
      ]},
      { stem: 'A generative model with two Gaussian class-conditionals sharing a common variance produces a posterior $p(y{=}1 \\mid x)$ that is exactly\u2026', options: [
        { text: 'logistic (linear in $x$) \u2014 the generative and discriminative views meet', correct: true, feedback: 'Correct \u2014 shared-variance Gaussians imply a logistic posterior; the bridge between approaches.' },
        { text: 'quadratic in $x$', correct: false, feedback: 'Only if the variances differ (then the boundary is quadratic).' },
        { text: 'a step function', correct: false, feedback: 'The posterior is smooth.' },
        { text: 'uniform', correct: false, feedback: 'No \u2014 it is a logistic curve.' }
      ]},
      { stem: 'A genuine tradeoff between the two approaches:', options: [
        { text: 'generative models can use $p(x)$, handle missing features, and sometimes need less data, but depend on modeling $p(x\\mid y)$ correctly; discriminative often predicts better when those assumptions are wrong', correct: true, feedback: 'Correct \u2014 generative buys a model of the data (and its assumptions); discriminative targets the boundary directly.' },
        { text: 'discriminative models can generate new data; generative cannot', correct: false, feedback: 'Backwards \u2014 generative models can sample new data.' },
        { text: 'generative models never use Bayes\u2019 rule', correct: false, feedback: 'Bayes\u2019 rule is exactly how they classify.' },
        { text: 'they always give identical predictions', correct: false, feedback: 'They can differ, especially under model misspecification.' }
      ]},
      { stem: 'The model outputs $p(y{=}1 \\mid x) = 0.7$ for a patient. This means\u2026', options: [
        { text: 'the estimated probability the patient is malignant is 0.7 \u2014 a graded probability, not a hard label', correct: true, feedback: 'Correct \u2014 turning it into a 0/1 call requires choosing a threshold.' },
        { text: 'the patient is definitely malignant', correct: false, feedback: 'That is thresholding to a hard label, discarding the uncertainty.' },
        { text: '70% of patients this size are malignant in the data', correct: false, feedback: 'It is the model\u2019s estimate, not a raw data frequency.' },
        { text: 'the model is 70% accurate', correct: false, feedback: 'That conflates a single prediction with overall accuracy.' }
      ]}
    ]
  };

  // ---- numerics ----------------------------------------------------------
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function sigmoid(z) {                         // numerically stable
    if (z >= 0) { var e = Math.exp(-z); return 1 / (1 + e); }
    var ez = Math.exp(z); return ez / (1 + ez);
  }
  var EPS = 1e-7;
  function clampP(p) { return Math.min(1 - EPS, Math.max(EPS, p)); }

  // ---- data ---------------------------------------------------------------
  var X = CONFIG.data.map(function (d) { return d[0]; });
  var Y = CONFIG.data.map(function (d) { return d[1]; });
  var N = CONFIG.data.length;
  // deterministic vertical jitter per point (stable across redraws)
  function hash01(i) { var s = Math.sin((i + 1) * 12.9898) * 43758.5453; return s - Math.floor(s); }
  var JIT = CONFIG.data.map(function (d, i) { return (hash01(i) - 0.5) * 0.06; });

  // ---- model --------------------------------------------------------------
  function pAt(w0, w1, xv) { return sigmoid(w0 + w1 * xv); }
  function logLoss(w0, w1) {
    var s = 0, i, p;
    for (i = 0; i < N; i++) { p = clampP(pAt(w0, w1, X[i])); s += -(Y[i] * Math.log(p) + (1 - Y[i]) * Math.log(1 - p)); }
    return s / N;
  }
  function accuracy(w0, w1) {
    var c = 0, i;
    for (i = 0; i < N; i++) { if ((pAt(w0, w1, X[i]) >= 0.5 ? 1 : 0) === Y[i]) c++; }
    return c / N;
  }
  function predicted(w0, w1, xv) { return pAt(w0, w1, xv) >= 0.5 ? 1 : 0; }

  // Logistic-regression MLE via Newton-Raphson / IRLS (2 params). x is
  // standardized inside the solver so the Hessian stays well-conditioned, then
  // the coefficients are converted back to raw-x at the end.
  function fitMLE() {
    var mu = 0, i; for (i = 0; i < N; i++) mu += X[i]; mu /= N;
    var sd = 0; for (i = 0; i < N; i++) sd += (X[i] - mu) * (X[i] - mu); sd = Math.sqrt(sd / N) || 1;
    var xs = X.map(function (xv) { return (xv - mu) / sd; });
    var b0 = 0, b1 = 0, iter, ridge = 1e-6;
    for (iter = 0; iter < 25; iter++) {
      var g0 = 0, g1 = 0, h00 = 0, h01 = 0, h11 = 0;
      for (i = 0; i < N; i++) {
        var z = b0 + b1 * xs[i], p = sigmoid(z), w = p * (1 - p), r = p - Y[i];
        g0 += r; g1 += r * xs[i];
        h00 += w; h01 += w * xs[i]; h11 += w * xs[i] * xs[i];
      }
      h00 += ridge; h11 += ridge;                 // tiny ridge for stability
      var det = h00 * h11 - h01 * h01;
      if (Math.abs(det) < 1e-12) break;
      var d0 = (h11 * g0 - h01 * g1) / det;
      var d1 = (-h01 * g0 + h00 * g1) / det;
      b0 -= d0; b1 -= d1;
      if (Math.abs(d0) + Math.abs(d1) < 1e-9) break;
    }
    return { w0: b0 - b1 * mu / sd, w1: b1 / sd };
  }

  // Generative: per-class Gaussian with a shared pooled variance + class priors.
  // Shared variance => the posterior is logistic and the boundary is linear.
  function fitGenerative() {
    var n0 = 0, n1 = 0, s0 = 0, s1 = 0, i;
    for (i = 0; i < N; i++) { if (Y[i] === 0) { n0++; s0 += X[i]; } else { n1++; s1 += X[i]; } }
    var mu0 = s0 / n0, mu1 = s1 / n1, ss = 0;
    for (i = 0; i < N; i++) { var m = Y[i] === 0 ? mu0 : mu1; ss += (X[i] - m) * (X[i] - m); }
    var varp = ss / (N - 2), pi0 = n0 / N, pi1 = n1 / N;
    var boundary = (mu0 + mu1) / 2 + varp / (mu1 - mu0) * Math.log(pi0 / pi1);
    return { mu0: mu0, mu1: mu1, varp: varp, boundary: boundary };
  }
  function gaussPDF(xv, mu, varp) { return Math.exp(-(xv - mu) * (xv - mu) / (2 * varp)) / Math.sqrt(2 * Math.PI * varp); }

  // ---- state --------------------------------------------------------------
  var DEFAULTS = { w0: CONFIG.w0.default, w1: CONFIG.w1.default };
  var SLIDER = { w0: CONFIG.w0, w1: CONFIG.w1 };
  var state = { w0: DEFAULTS.w0, w1: DEFAULTS.w1, showGen: false };

  // ---- chart scaffold -----------------------------------------------------
  var W = 660, H = 410, margin = { top: 14, right: 16, bottom: 46, left: 54 };
  var iw = W - margin.left - margin.right, ih = H - margin.top - margin.bottom;
  var svg = d3.select('#chart').append('svg')
    .attr('viewBox', '0 0 ' + W + ' ' + H)
    .attr('width', '100%')
    .attr('role', 'img')
    .attr('aria-label', 'Logistic regression of ' + CONFIG.yLabel + ' versus ' + CONFIG.xLabel +
      ', with an adjustable sigmoid curve and decision boundary.');
  var g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  var xExt = d3.extent(X);
  var x = d3.scaleLinear().domain([xExt[0] - 4, xExt[1] + 4]).range([0, iw]);
  var y = d3.scaleLinear().domain([-0.08, 1.08]).range([ih, 0]);

  var clipId = 'clip-' + CONFIG.unitId;
  svg.append('defs').append('clipPath').attr('id', clipId)
    .append('rect').attr('width', iw).attr('height', ih);

  var gx = g.append('g').attr('transform', 'translate(0,' + ih + ')');
  var gy = g.append('g');
  g.append('text').attr('class', 'pl-axis-label').attr('x', iw / 2).attr('y', ih + 38)
    .attr('text-anchor', 'middle').text(CONFIG.xLabel);
  g.append('text').attr('class', 'pl-axis-label').attr('transform', 'rotate(-90)')
    .attr('x', -ih / 2).attr('y', -40).attr('text-anchor', 'middle').text(CONFIG.yLabel);

  var shadeRect = g.append('rect').attr('y', 0).attr('height', ih)
    .attr('fill', ok.vermillion).attr('fill-opacity', 0.06);
  var gDensity = g.append('g').attr('clip-path', 'url(#' + clipId + ')');
  var dens0 = gDensity.append('path'), dens1 = gDensity.append('path');
  var genLine = g.append('line').style('display', 'none');
  var curve = g.append('path').attr('clip-path', 'url(#' + clipId + ')');
  var boundary = g.append('line');
  var gPoints = g.append('g');

  var line = d3.line().x(function (d) { return x(d[0]); }).y(function (d) { return y(d[1]); });
  var dom = x.domain(), dense = d3.range(dom[0], dom[1] + 0.001, (dom[1] - dom[0]) / 200);

  function drawAxes() {
    gx.call(d3.axisBottom(x).ticks(8));
    gy.call(d3.axisLeft(y).tickValues([0, 0.25, 0.5, 0.75, 1]));
    [gx, gy].forEach(function (ax) {
      ax.selectAll('path, line').attr('stroke', PL.viz.gridColor());
      ax.selectAll('text').attr('fill', PL.viz.textColor());
    });
  }
  function setText(id, t) { var e = document.getElementById(id); if (e) e.textContent = t; }

  // ---- draw ---------------------------------------------------------------
  function redraw() {
    var w0 = state.w0, w1 = state.w1, xstar = w1 !== 0 ? -w0 / w1 : NaN;

    // sigmoid curve
    curve.attr('d', line(dense.map(function (xv) { return [xv, pAt(w0, w1, xv)]; })))
      .attr('fill', 'none').attr('stroke', ok.purple).attr('stroke-width', 2.5);

    // decision boundary + shaded "predict malignant" region (x > x*)
    if (isFinite(xstar)) {
      var bx = clamp(xstar, dom[0], dom[1]);
      boundary.style('display', null)
        .attr('x1', x(bx)).attr('x2', x(bx)).attr('y1', 0).attr('y2', ih)
        .attr('stroke', PL.viz.textColor()).attr('stroke-width', 1.5).attr('stroke-dasharray', '2 3');
      shadeRect.style('display', null).attr('x', x(bx)).attr('width', Math.max(0, iw - x(bx)));
    } else { boundary.style('display', 'none'); shadeRect.style('display', 'none'); }

    // generative overlay: two scaled class-conditional densities + its boundary
    if (state.showGen) {
      var gen = fitGenerative();
      var k = 0.42 / gaussPDF(gen.mu0, gen.mu0, gen.varp);   // shared variance => equal peaks
      dens0.style('display', null)
        .attr('d', line(dense.map(function (xv) { return [xv, k * gaussPDF(xv, gen.mu0, gen.varp)]; })))
        .attr('fill', 'none').attr('stroke', ok.sky).attr('stroke-width', 1.8).attr('stroke-dasharray', '5 4');
      dens1.style('display', null)
        .attr('d', line(dense.map(function (xv) { return [xv, k * gaussPDF(xv, gen.mu1, gen.varp)]; })))
        .attr('fill', 'none').attr('stroke', ok.orange).attr('stroke-width', 1.8).attr('stroke-dasharray', '5 4');
      var gbx = clamp(gen.boundary, dom[0], dom[1]);
      genLine.style('display', null)
        .attr('x1', x(gbx)).attr('x2', x(gbx)).attr('y1', 0).attr('y2', ih)
        .attr('stroke', ok.green).attr('stroke-width', 2).attr('stroke-dasharray', '6 4');
    } else {
      dens0.style('display', 'none'); dens1.style('display', 'none'); genLine.style('display', 'none');
    }

    // patient points: color + y-position both encode class; ring = misclassified
    var pts = CONFIG.data.map(function (d, i) {
      return { x: d[0], cls: d[1], yj: d[1] + JIT[i], mis: predicted(w0, w1, d[0]) !== d[1] };
    });
    var sel = gPoints.selectAll('circle').data(pts);
    sel.enter().append('circle').attr('r', 6).merge(sel)
      .attr('cx', function (d) { return x(d.x); })
      .attr('cy', function (d) { return y(d.yj); })
      .attr('fill', function (d) { return d.cls === 1 ? ok.vermillion : ok.blue; })
      .attr('fill-opacity', 0.9)
      .attr('stroke', function (d) { return d.mis ? PL.viz.textColor() : 'none'; })
      .attr('stroke-width', function (d) { return d.mis ? 2.5 : 0; });
    sel.exit().remove();

    // readouts
    setText('val-w0', w0.toFixed(1));
    setText('val-w1', w1.toFixed(2));
    setText('val-xstar', isFinite(xstar) ? xstar.toFixed(1) : '—');
    setText('val-loss', logLoss(w0, w1).toFixed(3));
    setText('val-acc', Math.round(accuracy(w0, w1) * 100) + '%');
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
    var r0 = document.getElementById('rng-w0'), m0 = document.getElementById('num-w0');
    if (r0) r0.value = state.w0; if (m0) m0.value = state.w0.toFixed(1);
    var r1 = document.getElementById('rng-w1'), m1 = document.getElementById('num-w1');
    if (r1) r1.value = state.w1; if (m1) m1.value = state.w1.toFixed(2);
  }

  document.getElementById('btn-mle').addEventListener('click', function () {
    var fit = fitMLE();
    state.w0 = clamp(fit.w0, SLIDER.w0.min, SLIDER.w0.max);
    state.w1 = clamp(fit.w1, SLIDER.w1.min, SLIDER.w1.max);
    syncControls(); redraw();
  });
  document.getElementById('btn-generative').addEventListener('click', function () {
    state.showGen = !state.showGen;
    this.setAttribute('aria-pressed', String(state.showGen));
    this.textContent = state.showGen ? 'Hide generative comparison' : 'Generative comparison';
    redraw();
  });
  document.getElementById('btn-reset').addEventListener('click', function () {
    state.w0 = DEFAULTS.w0; state.w1 = DEFAULTS.w1; state.showGen = false;
    document.getElementById('btn-generative').textContent = 'Generative comparison';
    document.getElementById('btn-generative').setAttribute('aria-pressed', 'false');
    syncControls(); redraw();
  });

  // ---- init ---------------------------------------------------------------
  bindSlider('w0'); bindSlider('w1');
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
