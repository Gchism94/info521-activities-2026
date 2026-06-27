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
    unitId: 'week05-kmeans',
    unitNumber: 5,
    token: 'KMEANS-3R7P',           // rotate per term; add to your week->token map
    masteryThreshold: 0.8,
    quizPerAttempt: null,
    xLabel: 'BMI',
    yLabel: 'Fasting glucose (mg/dL)',
    k: { min: 2, max: 5, step: 1, default: 3 },
    // 30 patients, no labels — three natural subtypes (healthy / pre-diabetic / diabetic)
    data: [
      [21,85],[22,88],[20,90],[23,84],[24,92],[22,95],[21,82],[23,90],[25,87],[22,86],
      [29,112],[31,115],[28,108],[30,120],[32,118],[29,110],[31,122],[28,116],[30,113],[33,119],
      [35,158],[37,165],[34,152],[36,160],[38,170],[35,155],[37,168],[39,162],[34,150],[36,172]
    ],
    quiz: [
      { stem: 'K-means alternates two steps. The <em>update</em> step\u2026', options: [
        { text: 'moves each centroid $\\boldsymbol{\\mu}_k$ to the mean of the points currently assigned to it', correct: true, feedback: 'Correct \u2014 update recomputes $\\boldsymbol{\\mu}_k$ as the mean of its assigned points.' },
        { text: 'assigns each point to its nearest centroid', correct: false, feedback: 'That is the assignment step.' },
        { text: 'removes the farthest point from each cluster', correct: false, feedback: 'K-means never discards points.' },
        { text: 'increases the number of clusters', correct: false, feedback: 'k is fixed during a run.' }
      ]},
      { stem: 'K-means seeks to minimize\u2026', options: [
        { text: 'the within-cluster sum of squared distances $\\sum_k \\sum_{n:z_n=k} \\lVert \\mathbf{x}_n - \\boldsymbol{\\mu}_k \\rVert^2$ (distortion)', correct: true, feedback: 'Correct \u2014 total within-cluster squared distance, a.k.a. distortion/inertia.' },
        { text: 'the distance between cluster centroids', correct: false, feedback: 'It minimizes within-cluster spread, not between-cluster distance.' },
        { text: 'the number of iterations', correct: false, feedback: 'That is not the objective.' },
        { text: 'the silhouette width directly', correct: false, feedback: 'Silhouette is a separate evaluation metric.' }
      ]},
      { stem: 'Why is k-means guaranteed to converge?', options: [
        { text: 'each step never increases the distortion, and there are finitely many possible assignments', correct: true, feedback: 'Correct \u2014 monotonically non-increasing distortion + finite assignments \u21d2 convergence (to a local optimum).' },
        { text: 'the centroids always reach the global optimum', correct: false, feedback: 'It reaches only a local optimum.' },
        { text: 'it runs a fixed number of steps regardless of the data', correct: false, feedback: 'It stops when assignments stabilize.' },
        { text: 'the data is always linearly separable', correct: false, feedback: 'Separability is unrelated.' }
      ]},
      { stem: 'You click \u201cNew centroids\u201d and get a different final clustering. This is because k-means\u2026', options: [
        { text: 'converges to a local optimum that depends on initialization \u2014 so multiple restarts are used', correct: true, feedback: 'Correct \u2014 different starts can land in different local optima; restart and keep the lowest-distortion result.' },
        { text: 'is random in its update step', correct: false, feedback: 'The update is deterministic given the assignments.' },
        { text: 'never converges', correct: false, feedback: 'It does converge \u2014 just possibly to different optima.' },
        { text: 'ignores the data entirely', correct: false, feedback: 'It very much uses the data.' }
      ]},
      { stem: 'The number of clusters $k$\u2026', options: [
        { text: 'must be chosen by the user; the elbow of the distortion-vs-$k$ curve is a common heuristic', correct: true, feedback: 'Correct \u2014 $k$ is an input; pick it via the elbow, silhouette, or domain knowledge.' },
        { text: 'is determined automatically by k-means', correct: false, feedback: 'k-means needs $k$ given up front.' },
        { text: 'always equals the number of data points', correct: false, feedback: 'That would put one point per cluster.' },
        { text: 'must always be 2', correct: false, feedback: 'Any $k \\ge 1$ is allowed.' }
      ]},
      { stem: 'As you increase $k$ toward $N$ (the number of points), the distortion (WCSS)\u2026', options: [
        { text: 'decreases monotonically, reaching zero at $k = N$ \u2014 so distortion alone cannot choose $k$', correct: true, feedback: 'Correct \u2014 more centroids always fit tighter; that is why you cannot pick $k$ by minimizing distortion.' },
        { text: 'increases with $k$', correct: false, feedback: 'More clusters reduce within-cluster spread.' },
        { text: 'stays constant', correct: false, feedback: 'It falls as $k$ grows.' },
        { text: 'first rises then falls', correct: false, feedback: 'It decreases monotonically.' }
      ]},
      { stem: 'K-means uses Euclidean distance, which effectively assumes clusters that are\u2026', options: [
        { text: 'roughly spherical and similar in size; it struggles with elongated or very unequal clusters', correct: true, feedback: 'Correct \u2014 Euclidean distance favors round, comparable clusters; GMMs with full covariance are more flexible.' },
        { text: 'arbitrarily shaped and sized', correct: false, feedback: 'That flexibility belongs to richer models.' },
        { text: 'always exactly two in number', correct: false, feedback: 'Cluster count is unrelated to shape assumptions.' },
        { text: 'linearly separable', correct: false, feedback: 'Separability is a classification notion.' }
      ]},
      { stem: 'Compared with k-means\u2019 hard assignments, a Gaussian mixture model fit by EM makes\u2026', options: [
        { text: 'soft assignments \u2014 each point gets a probability (responsibility) of belonging to each cluster', correct: true, feedback: 'Correct \u2014 GMM/EM gives soft responsibilities; k-means is the hard-assignment special case.' },
        { text: 'no assignments at all', correct: false, feedback: 'EM assigns responsibilities to every point.' },
        { text: 'even harder assignments than k-means', correct: false, feedback: 'EM softens, not hardens, the assignments.' },
        { text: 'assignments only for the first cluster', correct: false, feedback: 'Every cluster gets responsibilities.' }
      ]},
      { stem: 'K-means can be viewed as a limiting case of EM for a Gaussian mixture with\u2026', options: [
        { text: 'spherical, equal covariance and hard assignments (\u201chard EM\u201d)', correct: true, feedback: 'Correct \u2014 shrink the GMM covariances toward equal spheres and harden the responsibilities and you recover k-means.' },
        { text: 'arbitrary full covariances', correct: false, feedback: 'That is the general GMM, not k-means.' },
        { text: 'a single cluster', correct: false, feedback: 'k-means uses $k$ clusters.' },
        { text: 'no probabilistic model at all', correct: false, feedback: 'The connection is precisely through the GMM probability model.' }
      ]},
      { stem: 'Mapping k-means onto EM: the assignment step plays the role of the \u2026 and the update step the role of the \u2026', options: [
        { text: 'E-step (assign / compute responsibilities) and M-step (re-estimate parameters), respectively', correct: true, feedback: 'Correct \u2014 assignment \u2248 E-step, centroid update \u2248 M-step.' },
        { text: 'M-step and E-step, respectively', correct: false, feedback: 'Reversed \u2014 assignment is the E-step analogue.' },
        { text: 'both an E-step', correct: false, feedback: 'They are the two different half-steps.' },
        { text: 'neither; k-means is unrelated to EM', correct: false, feedback: 'They are closely analogous.' }
      ]},
      { stem: 'During iteration a centroid ends up with no points assigned. The standard fix is to\u2026', options: [
        { text: 're-initialize that empty centroid (e.g., to a random point) \u2014 its mean is otherwise undefined', correct: true, feedback: 'Correct \u2014 an empty cluster has an undefined mean, so the centroid is re-seeded.' },
        { text: 'delete a data point', correct: false, feedback: 'You never discard data.' },
        { text: 'set the centroid to the origin', correct: false, feedback: 'An arbitrary fixed point is not the fix.' },
        { text: 'stop the algorithm with an error', correct: false, feedback: 'It is handled by re-seeding, not failing.' }
      ]},
      { stem: 'The two features here (BMI ~20\u201340, glucose ~80\u2013180) are on very different scales. Without care, k-means would\u2026', options: [
        { text: 'let the larger-scale feature (glucose) dominate the Euclidean distance \u2014 so features should be standardized first', correct: true, feedback: 'Correct \u2014 Euclidean distance is scale-sensitive; standardize features (this tool clusters in the scaled plot space).' },
        { text: 'ignore both features', correct: false, feedback: 'It uses both, just unequally weighted by scale.' },
        { text: 'automatically standardize them', correct: false, feedback: 'You must standardize; it does not happen for free.' },
        { text: 'give the same answer regardless of scale', correct: false, feedback: 'Scaling changes the distances and thus the clusters.' }
      ]},
      { stem: 'After convergence on this data, the centroids represent\u2026', options: [
        { text: 'the prototype (mean) of each discovered cluster \u2014 here, candidate patient subtypes found without using any diagnosis labels', correct: true, feedback: 'Correct \u2014 k-means is unsupervised: it discovers subtype prototypes from the features alone.' },
        { text: 'the single most typical patient (an actual data point)', correct: false, feedback: 'A centroid is a mean, usually not a real data point.' },
        { text: 'the decision boundary between known classes', correct: false, feedback: 'That is supervised classification, not clustering.' },
        { text: 'the noise in the data', correct: false, feedback: 'Centroids summarize structure, not noise.' }
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
