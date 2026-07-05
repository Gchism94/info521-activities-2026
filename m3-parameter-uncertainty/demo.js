/* INFO 521 · M3 in-lecture demo — parameter uncertainty.
 * Fixed generating process y = w0 + w1·z + ε; X held FIXED per sample size so the
 * theoretical Cov[ŵ] = σ²(XᵀX)⁻¹ ellipse is exact. Classic script, no modules,
 * no fetch (file://-safe); D3 from CDN; theme via shell.css custom properties.
 * True parameters mirror the course NHANES fit: w0 = 121.5, w1 = 6.5 (per SD age).
 */
(function () {
  "use strict";

  var TRUE_W0 = 121.5, TRUE_W1 = 6.5;
  var COL = { blue: "#0072B2", vermillion: "#D55E00", green: "#009E73",
              orange: "#E69F00", purple: "#CC79A7" };

  // Deterministic RNG (mulberry32) so the first paint is stable; draws evolve it.
  var seed = 521;
  function rand() {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function randn() { // Box–Muller
    var u = 0, v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  var state = { N: 40, sigma: 16, z: [], zbar: 0, Szz: 0,
                sample: null, what: null, cloud: [] };

  function regenX() { // fixed design for the current N (standardized-age-like)
    state.z = [];
    var i, s = 0;
    for (i = 0; i < state.N; i++) { state.z.push(randn()); }
    for (i = 0; i < state.N; i++) s += state.z[i];
    state.zbar = s / state.N;
    state.Szz = 0;
    for (i = 0; i < state.N; i++) {
      state.Szz += (state.z[i] - state.zbar) * (state.z[i] - state.zbar);
    }
  }

  function drawOnce() { // redraw ε only (X fixed) → one ŵ
    var y = [], i;
    for (i = 0; i < state.N; i++) {
      y.push(TRUE_W0 + TRUE_W1 * state.z[i] + state.sigma * randn());
    }
    var ybar = 0;
    for (i = 0; i < state.N; i++) ybar += y[i];
    ybar /= state.N;
    var Szy = 0;
    for (i = 0; i < state.N; i++) Szy += (state.z[i] - state.zbar) * (y[i] - ybar);
    var w1 = Szy / state.Szz;
    var w0 = ybar - w1 * state.zbar;
    state.sample = y;
    state.what = [w0, w1];
    state.cloud.push([w0, w1]);
    if (state.cloud.length > 3000) state.cloud.shift();
  }

  // Theoretical covariance of ŵ for the fixed design: σ²(XᵀX)⁻¹, X = [1, z].
  function theoryCov() {
    var n = state.N, sz = 0, szz = 0, i;
    for (i = 0; i < n; i++) { sz += state.z[i]; szz += state.z[i] * state.z[i]; }
    var det = n * szz - sz * sz, s2 = state.sigma * state.sigma;
    return [[s2 * szz / det, -s2 * sz / det], [-s2 * sz / det, s2 * n / det]];
  }
  function ellipsePath(cov, cx, cy, xS, yS, nsig) { // 2×2 eigen, closed form
    var a = cov[0][0], b = cov[0][1], c = cov[1][1];
    var tr = a + c, dt = Math.sqrt(Math.max(0, (a - c) * (a - c) / 4 + b * b));
    var l1 = tr / 2 + dt, l2 = tr / 2 - dt;
    var th = Math.abs(b) < 1e-12 ? (a >= c ? 0 : Math.PI / 2) : Math.atan2(l1 - a, b);
    var pts = [], k;
    for (k = 0; k <= 120; k++) {
      var t = (k / 120) * 2 * Math.PI;
      var ex = nsig * Math.sqrt(l1) * Math.cos(t), ey = nsig * Math.sqrt(l2) * Math.sin(t);
      var px = cx + ex * Math.cos(th) - ey * Math.sin(th);
      var py = cy + ex * Math.sin(th) + ey * Math.cos(th);
      pts.push([xS(px), yS(py)]);
    }
    return "M" + pts.map(function (p) { return p[0] + "," + p[1]; }).join("L") + "Z";
  }

  // ---- panels -------------------------------------------------------------
  var W = 380, H = 300, M = { t: 8, r: 10, b: 36, l: 46 };

  function makeSvg(sel) {
    return d3.select(sel).append("svg")
      .attr("viewBox", "0 0 " + W + " " + H)
      .attr("width", "100%").style("max-width", W + "px");
  }
  function axis(g, xS, yS, xlab, ylab) {
    var ax = g.append("g").attr("transform", "translate(0," + (H - M.b) + ")")
      .call(d3.axisBottom(xS).ticks(6));
    var ay = g.append("g").attr("transform", "translate(" + M.l + ",0)")
      .call(d3.axisLeft(yS).ticks(6));
    [ax, ay].forEach(function (a) {
      a.selectAll("path,line").attr("stroke", "var(--border)");
      a.selectAll("text").attr("fill", "var(--muted)").style("font-size", "10px");
    });
    g.append("text").attr("x", (M.l + W - M.r) / 2).attr("y", H - 6)
      .attr("text-anchor", "middle").attr("fill", "var(--muted)")
      .style("font-size", "11px").text(xlab);
    g.append("text").attr("transform", "rotate(-90)")
      .attr("x", -(H - M.b) / 2).attr("y", 12).attr("text-anchor", "middle")
      .attr("fill", "var(--muted)").style("font-size", "11px").text(ylab);
  }

  var svgD = makeSvg("#chart-data"), svgP = makeSvg("#chart-param");
  var xD = d3.scaleLinear().domain([-3.2, 3.2]).range([M.l, W - M.r]);
  var yD = d3.scaleLinear().domain([55, 195]).range([H - M.b, M.t]);
  axis(svgD, xD, yD, "standardized age (z)", "systolic BP (mmHg)");
  var gPts = svgD.append("g"), gLine = svgD.append("g");

  var xP = d3.scaleLinear().range([M.l, W - M.r]);
  var yP = d3.scaleLinear().range([H - M.b, M.t]);
  var gAxP = svgP.append("g"), gEll = svgP.append("g"),
      gCloud = svgP.append("g"), gTrue = svgP.append("g");

  function rescaleParam() {
    var cov = theoryCov();
    var s0 = Math.sqrt(cov[0][0]), s1 = Math.sqrt(cov[1][1]);
    xP.domain([TRUE_W0 - 4.2 * s0, TRUE_W0 + 4.2 * s0]);
    yP.domain([TRUE_W1 - 4.2 * s1, TRUE_W1 + 4.2 * s1]);
    gAxP.selectAll("*").remove();
    axis(gAxP, xP, yP, "intercept ŵ₀", "slope ŵ₁");
    gEll.selectAll("*").remove();
    gEll.append("path")
      .attr("d", ellipsePath(cov, TRUE_W0, TRUE_W1, xP, yP, 2))
      .attr("fill", "none").attr("stroke", COL.green)
      .attr("stroke-width", 2).attr("stroke-dasharray", "6 4");
    gTrue.selectAll("*").remove();
    gTrue.append("path")
      .attr("d", d3.symbol(d3.symbolDiamond).size(70)())
      .attr("transform", "translate(" + xP(TRUE_W0) + "," + yP(TRUE_W1) + ")")
      .attr("fill", COL.purple);
  }

  function render() {
    // data panel — current sample + its fit
    var pts = [];
    if (state.sample) {
      for (var i = 0; i < state.N; i++) pts.push([state.z[i], state.sample[i]]);
    }
    var sel = gPts.selectAll("circle").data(pts);
    sel.enter().append("circle").merge(sel)
      .attr("cx", function (d) { return xD(d[0]); })
      .attr("cy", function (d) { return yD(d[1]); })
      .attr("r", 2.6).attr("fill", COL.blue).attr("fill-opacity", 0.55);
    sel.exit().remove();
    gLine.selectAll("*").remove();
    if (state.what) {
      gLine.append("line")
        .attr("x1", xD(-3.2)).attr("y1", yD(state.what[0] - 3.2 * state.what[1]))
        .attr("x2", xD(3.2)).attr("y2", yD(state.what[0] + 3.2 * state.what[1]))
        .attr("stroke", COL.vermillion).attr("stroke-width", 2.4);
    }
    // parameter panel — cloud
    var cl = gCloud.selectAll("circle").data(state.cloud);
    cl.enter().append("circle").merge(cl)
      .attr("cx", function (d) { return xP(d[0]); })
      .attr("cy", function (d) { return yP(d[1]); })
      .attr("r", 2.2).attr("fill", COL.orange).attr("fill-opacity", 0.5);
    cl.exit().remove();
    // readouts
    document.getElementById("val-draws").textContent = String(state.cloud.length);
    document.getElementById("val-w1").textContent =
      state.what ? state.what[1].toFixed(2) : "—";
    var m = 0, v = 0, n = state.cloud.length, j;
    if (n > 1) {
      for (j = 0; j < n; j++) m += state.cloud[j][1];
      m /= n;
      for (j = 0; j < n; j++) v += (state.cloud[j][1] - m) * (state.cloud[j][1] - m);
      v = Math.sqrt(v / (n - 1));
      document.getElementById("val-emp").textContent = v.toFixed(3);
    } else {
      document.getElementById("val-emp").textContent = "—";
    }
    document.getElementById("val-theory").textContent =
      (state.sigma / Math.sqrt(state.Szz)).toFixed(3);
  }

  function resetAll() {
    regenX(); rescaleParam();
    state.cloud = []; state.sample = null; state.what = null;
    drawOnce(); render();
  }

  // ---- controls -----------------------------------------------------------
  function bindPair(rid, nid, key) {
    var r = document.getElementById(rid), nEl = document.getElementById(nid);
    function set(v) {
      v = Math.max(+r.min, Math.min(+r.max, v | 0));
      r.value = v; nEl.value = v; state[key] = v; resetAll();
    }
    r.addEventListener("input", function () { set(+r.value); });
    nEl.addEventListener("change", function () { set(+nEl.value); });
  }
  bindPair("rng-n", "num-n", "N");
  bindPair("rng-s", "num-s", "sigma");
  document.getElementById("btn-one").addEventListener("click", function () {
    drawOnce(); render();
  });
  document.getElementById("btn-hundred").addEventListener("click", function () {
    for (var k = 0; k < 100; k++) drawOnce();
    render();
  });
  document.getElementById("btn-reset").addEventListener("click", function () {
    state.cloud = []; render();
  });

  resetAll();

  // KaTeX (deferred CDN scripts)
  window.addEventListener("load", function () {
    if (window.renderMathInElement) {
      window.renderMathInElement(document.body, {
        delimiters: [{ left: "$$", right: "$$", display: true },
                     { left: "$", right: "$", display: false }]
      });
    }
  });
})();
