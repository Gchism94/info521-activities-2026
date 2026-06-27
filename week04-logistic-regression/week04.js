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
