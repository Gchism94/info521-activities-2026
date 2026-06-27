/* ============================================================================
   Week 5 — K-Means Clustering (assign/update explorer + mastery quiz).
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

  // ---- setup --------------------------------------------------------------
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  var COLORS = [ok.blue, ok.vermillion, ok.green, ok.orange, ok.purple];
  var SHAPES = [d3.symbolCircle, d3.symbolTriangle, d3.symbolSquare, d3.symbolCross, d3.symbolStar];
  var NEUTRAL = '#9a988f';
  var DATA = CONFIG.data, N = DATA.length;

  var state = {
    k: CONFIG.k.default,
    centroids: [],     // [bmi, glucose] in data coords
    labels: null,      // array length N, or null before first assignment
    iteration: 0,
    converged: false,
    phase: 'assign',   // next phase the Step button will run
    assigned: false
  };

  // ---- chart scaffold -----------------------------------------------------
  var W = 660, H = 410, margin = { top: 14, right: 16, bottom: 46, left: 56 };
  var iw = W - margin.left - margin.right, ih = H - margin.top - margin.bottom;
  var svg = d3.select('#chart').append('svg')
    .attr('viewBox', '0 0 ' + W + ' ' + H)
    .attr('width', '100%')
    .attr('role', 'img')
    .attr('aria-label', 'k-means clustering of patients by ' + CONFIG.xLabel + ' and ' + CONFIG.yLabel +
      ', with draggable centroids.');
  var g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  var x = d3.scaleLinear().domain([18, 42]).range([0, iw]);
  var y = d3.scaleLinear().domain([75, 185]).range([ih, 0]);

  var clipId = 'clip-' + CONFIG.unitId;
  svg.append('defs').append('clipPath').attr('id', clipId)
    .append('rect').attr('width', iw).attr('height', ih);

  var gx = g.append('g').attr('transform', 'translate(0,' + ih + ')');
  var gy = g.append('g');
  g.append('text').attr('class', 'pl-axis-label').attr('x', iw / 2).attr('y', ih + 38)
    .attr('text-anchor', 'middle').text(CONFIG.xLabel);
  g.append('text').attr('class', 'pl-axis-label').attr('transform', 'rotate(-90)')
    .attr('x', -ih / 2).attr('y', -46).attr('text-anchor', 'middle').text(CONFIG.yLabel);

  var gRegions = g.append('g').attr('clip-path', 'url(#' + clipId + ')');
  var gPoints = g.append('g');
  var gCentroids = g.append('g');

  function drawAxes() {
    gx.call(d3.axisBottom(x).ticks(7));
    gy.call(d3.axisLeft(y).ticks(6));
    [gx, gy].forEach(function (ax) {
      ax.selectAll('path, line').attr('stroke', PL.viz.gridColor());
      ax.selectAll('text').attr('fill', PL.viz.textColor());
    });
  }
  function setText(id, t) { var e = document.getElementById(id); if (e) e.textContent = t; }

  // ---- k-means core -------------------------------------------------------
  // Distances are computed in on-screen units (pixels / 100) so glucose's large
  // numeric range cannot dominate BMI -- the honest "standardize by plotting".
  function ux(d) { return x(d[0]) / 100; }
  function uy(d) { return y(d[1]) / 100; }
  function dist2(d, c) { var dx = ux(d) - ux(c), dy = uy(d) - uy(c); return dx * dx + dy * dy; }
  function randomPoints(m) {
    return d3.shuffle(d3.range(N)).slice(0, m).map(function (i) { return [DATA[i][0], DATA[i][1]]; });
  }
  function assign() {
    return DATA.map(function (d) {
      var best = 0, bd = Infinity, kk;
      for (kk = 0; kk < state.centroids.length; kk++) {
        var dd = dist2(d, state.centroids[kk]);
        if (dd < bd) { bd = dd; best = kk; }
      }
      return best;
    });
  }
  function recompute(labels) {
    var k = state.centroids.length, sums = [], cnts = [], i, kk;
    for (kk = 0; kk < k; kk++) { sums[kk] = [0, 0]; cnts[kk] = 0; }
    for (i = 0; i < N; i++) { var c = labels[i]; sums[c][0] += DATA[i][0]; sums[c][1] += DATA[i][1]; cnts[c]++; }
    var out = [];
    for (kk = 0; kk < k; kk++) {
      if (cnts[kk] === 0) { out[kk] = randomPoints(1)[0]; }        // empty cluster -> re-seed
      else { out[kk] = [sums[kk][0] / cnts[kk], sums[kk][1] / cnts[kk]]; }
    }
    return out;
  }
  function distortion() {
    if (!state.labels) return 0;
    var s = 0, i;
    for (i = 0; i < N; i++) s += dist2(DATA[i], state.centroids[state.labels[i]]);
    return s;
  }
  function sameLabels(a, b) {
    if (!a || !b) return false;
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  function initCentroids() {
    state.centroids = randomPoints(state.k);
    state.labels = null; state.iteration = 0; state.converged = false;
    state.phase = 'assign'; state.assigned = false;
  }
  function doAssign() {
    var nl = assign();
    if (state.iteration >= 1 && sameLabels(nl, state.labels)) state.converged = true;
    state.labels = nl; state.assigned = true; state.phase = 'update';
  }
  function doUpdate() {
    state.centroids = recompute(state.labels);
    state.iteration++; state.phase = 'assign';
  }
  function runToConvergence() {
    if (!state.assigned) doAssign();
    var guard = 0;
    while (!state.converged && guard < 50) { doUpdate(); doAssign(); guard++; }
  }

  // ---- draw ---------------------------------------------------------------
  function redraw() {
    var k = state.centroids.length;

    // nearest-centroid regions (shown once points are assigned)
    gRegions.selectAll('*').remove();
    if (state.assigned && k >= 1) {
      var cpx = state.centroids.map(function (c) { return [x(c[0]), y(c[1])]; });
      var vor = d3.Delaunay.from(cpx).voronoi([0, 0, iw, ih]);
      cpx.forEach(function (_, i) {
        gRegions.append('path').attr('d', vor.renderCell(i))
          .attr('fill', COLORS[i % COLORS.length]).attr('fill-opacity', 0.07).attr('stroke', 'none');
      });
    }

    // points: shape + color encode cluster (both, not color alone); gray before assignment
    var sel = gPoints.selectAll('path').data(DATA);
    sel.enter().append('path').merge(sel)
      .attr('transform', function (d) { return 'translate(' + x(d[0]) + ',' + y(d[1]) + ')'; })
      .attr('d', function (d, i) {
        var t = state.labels ? SHAPES[state.labels[i] % SHAPES.length] : d3.symbolCircle;
        return d3.symbol().type(t).size(90)();
      })
      .attr('fill', function (d, i) { return state.labels ? COLORS[state.labels[i] % COLORS.length] : NEUTRAL; })
      .attr('fill-opacity', 0.92)
      .attr('stroke', PL.viz.cssVar('--pl-card', '#fff')).attr('stroke-width', 1);
    sel.exit().remove();

    // centroids: large outlined diamonds (shape cue), draggable
    var diamond = d3.symbol().type(d3.symbolDiamond).size(380)();
    var cs = gCentroids.selectAll('path').data(state.centroids);
    cs.enter().append('path')
      .attr('cursor', 'grab').attr('tabindex', 0).attr('role', 'button')
      .call(d3.drag().on('start', function () { state.converged = false; })
        .on('drag', function (event) {
          var c = d3.select(this).datum();
          c[0] = clamp(x.invert(event.x), x.domain()[0], x.domain()[1]);
          c[1] = clamp(y.invert(event.y), y.domain()[0], y.domain()[1]);
          state.converged = false; redraw();
        }))
      .merge(cs)
      .attr('d', diamond)
      .attr('transform', function (c) { return 'translate(' + x(c[0]) + ',' + y(c[1]) + ')'; })
      .attr('fill', function (c, i) { return COLORS[i % COLORS.length]; })
      .attr('fill-opacity', 0.85)
      .attr('stroke', PL.viz.textColor()).attr('stroke-width', 2)
      .attr('aria-label', function (c, i) { return 'Centroid ' + (i + 1) + ', draggable'; });
    cs.exit().remove();

    setText('val-k', String(k));
    setText('val-iter', String(state.iteration));
    setText('val-distortion', state.labels ? distortion().toFixed(2) : '—');
    setText('val-converged', state.converged ? 'yes' : 'no');
    var sb = document.getElementById('btn-step');
    if (sb) sb.textContent = 'Step: ' + state.phase;   // label shows the NEXT phase
  }

  // ---- controls -----------------------------------------------------------
  function bindK() {
    var range = document.getElementById('rng-k'), num = document.getElementById('num-k'), s = CONFIG.k;
    [range, num].forEach(function (inp) { inp.min = s.min; inp.max = s.max; inp.step = s.step; inp.value = state.k; });
    function setK(v) {
      v = clamp(Math.round(v), s.min, s.max); state.k = v;
      range.value = v; num.value = v; initCentroids(); redraw();
    }
    range.addEventListener('input', function () { setK(parseInt(range.value, 10)); });
    num.addEventListener('input', function () { var v = parseInt(num.value, 10); if (!isNaN(v)) setK(v); });
  }
  function syncK() {
    var r = document.getElementById('rng-k'), n = document.getElementById('num-k');
    if (r) r.value = state.k; if (n) n.value = state.k;
  }

  document.getElementById('btn-step').addEventListener('click', function () {
    if (state.phase === 'assign') doAssign(); else doUpdate();
    redraw();
  });
  document.getElementById('btn-run').addEventListener('click', function () { runToConvergence(); redraw(); });
  document.getElementById('btn-reinit').addEventListener('click', function () { initCentroids(); redraw(); });
  document.getElementById('btn-reset').addEventListener('click', function () {
    state.k = CONFIG.k.default; syncK(); initCentroids(); redraw();
  });

  // ---- init ---------------------------------------------------------------
  bindK();
  initCentroids();
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
