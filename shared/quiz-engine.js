/* ============================================================================
   Peer-Loops shared quiz/token engine.

   GRADED-CRITICAL: this file gates the completion token students paste into
   D2L. Change it deliberately and re-test all six weeks. Classic script (no
   ES modules) so tools work both via file:// (double-click preview) and on
   GitHub Pages.

   Usage:  PL.mountQuiz(document.getElementById('quiz'), CONFIG);
   CONFIG: { unitId, unitNumber, token, masteryThreshold, quizPerAttempt,
             items: [{ stem, options: [{ text, correct, feedback }] }] }
   ========================================================================== */
(function (global) {
  'use strict';
  var PL = global.PL = global.PL || {};

  function shuffle(a) {
    var arr = a.slice(), i, j, t;
    for (i = arr.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }
  function key(id) { return 'peer-loops:' + id; }
  function loadState(id) {
    try { return JSON.parse(global.localStorage.getItem(key(id))) || null; }
    catch (e) { return null; }
  }
  function saveState(id, s) {
    try { global.localStorage.setItem(key(id), JSON.stringify(s)); }
    catch (e) { /* storage disabled — quiz still works, just no persistence */ }
  }
  function el(tag, cls) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }
  function renderMath(node) {
    if (global.renderMathInElement) {
      try {
        global.renderMathInElement(node, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
          ],
          throwOnError: false
        });
      } catch (e) { /* katex not ready yet; re-rendered on next pass */ }
    }
  }

  PL.mountQuiz = function (mount, cfg) {
    var items = cfg.items || [];
    var perAttempt = (cfg.quizPerAttempt && cfg.quizPerAttempt < items.length)
      ? cfg.quizPerAttempt : items.length;
    var threshold = cfg.masteryThreshold || 0.8;
    var state = loadState(cfg.unitId) || { best: 0, attempts: 0, mastered: false };
    var attempt = [];
    var graded = false;

    mount.classList.add('pl-quiz');
    var header = el('div', 'pl-quiz-header');
    var form = el('div', 'pl-quiz-form');
    var actions = el('div', 'pl-quiz-actions');
    var result = el('div', 'pl-quiz-result');
    result.setAttribute('aria-live', 'polite');
    mount.appendChild(header);
    mount.appendChild(form);
    mount.appendChild(actions);
    mount.appendChild(result);

    function updateHeader() {
      header.innerHTML = '';
      var h = el('h2'); h.textContent = 'Check your understanding';
      var s = el('p', 'pl-quiz-status');
      var pct = Math.round(threshold * 100);
      s.textContent = 'Unlimited retakes. Reach ' + pct +
        '% to unlock your completion token. Best so far: ' +
        state.best + '/' + perAttempt + ' over ' + state.attempts +
        ' attempt' + (state.attempts === 1 ? '' : 's') + '.';
      header.appendChild(h); header.appendChild(s);
    }

    function startAttempt() {
      graded = false;
      result.innerHTML = '';
      result.className = 'pl-quiz-result';
      result.setAttribute('aria-live', 'polite');
      attempt = shuffle(items).slice(0, perAttempt).map(function (it) {
        return {
          stem: it.stem,
          options: shuffle(it.options).map(function (o) {
            return { text: o.text, correct: !!o.correct, feedback: o.feedback || '' };
          }),
          picked: null
        };
      });
      renderForm();
      renderActions();
      updateHeader();
      renderMath(form);
    }

    function renderForm() {
      form.innerHTML = '';
      attempt.forEach(function (item, qi) {
        var fs = el('fieldset', 'pl-q');
        var lg = el('legend', 'pl-q-stem');
        lg.innerHTML = (qi + 1) + '. ' + item.stem;
        fs.appendChild(lg);
        item.options.forEach(function (opt, oi) {
          var id = cfg.unitId + '-q' + qi + 'o' + oi;
          var lab = el('label', 'pl-opt');
          lab.setAttribute('for', id);
          var inp = el('input');
          inp.type = 'radio'; inp.name = cfg.unitId + '-q' + qi; inp.id = id; inp.value = String(oi);
          inp.addEventListener('change', function () { item.picked = oi; });
          var span = el('span', 'pl-opt-text');
          span.innerHTML = opt.text;
          var fb = el('div', 'pl-opt-feedback');
          fb.innerHTML = opt.feedback;
          lab.appendChild(inp); lab.appendChild(span); lab.appendChild(fb);
          fs.appendChild(lab);
        });
        form.appendChild(fs);
      });
    }

    function renderActions() {
      actions.innerHTML = '';
      var submit = el('button', 'pl-btn pl-btn-primary');
      submit.type = 'button';
      submit.textContent = 'Submit answers';
      submit.addEventListener('click', gradeAttempt);
      actions.appendChild(submit);
    }

    function gradeAttempt() {
      if (graded) return;
      var score = 0, unanswered = false;
      attempt.forEach(function (item, qi) {
        var fs = form.children[qi];
        if (item.picked == null) unanswered = true;
        item.options.forEach(function (opt, oi) {
          var lab = fs.children[oi + 1]; // +1 skips the <legend>
          var show = false;
          if (opt.correct) { lab.classList.add('is-correct'); show = true; }
          if (item.picked === oi) {
            lab.classList.add('is-picked');
            if (!opt.correct) lab.classList.add('is-wrong');
            show = true;
          }
          var fb = lab.querySelector('.pl-opt-feedback');
          if (fb) fb.style.display = show ? 'block' : 'none';
          var inp = lab.querySelector('input');
          if (inp) inp.disabled = true;
        });
        if (item.picked != null && item.options[item.picked].correct) score++;
      });
      graded = true;

      state.attempts += 1;
      if (score > state.best) state.best = score;
      var passed = (score / perAttempt) >= threshold;
      if (passed) state.mastered = true;
      saveState(cfg.unitId, state);

      updateHeader();
      showResult(score, passed, unanswered);

      actions.innerHTML = '';
      var retake = el('button', 'pl-btn');
      retake.type = 'button';
      retake.textContent = 'Retake';
      retake.addEventListener('click', startAttempt);
      actions.appendChild(retake);
    }

    function showResult(score, passed, unanswered) {
      result.innerHTML = '';
      var pct = Math.round(score / perAttempt * 100);
      var line = el('p', 'pl-score');
      line.textContent = 'You scored ' + score + '/' + perAttempt + ' (' + pct + '%).' +
        (unanswered ? ' Some items were left blank.' : '');
      result.appendChild(line);

      if (passed) {
        result.classList.add('is-mastered');
        var box = el('div', 'pl-receipt');
        var label = el('div', 'pl-receipt-label');
        label.textContent = '\u2713 Mastery reached \u2014 paste this into your D2L reflection:';
        var receipt = 'Unit ' + cfg.unitNumber + ' \u2713 \u2014 best ' + state.best +
          '/' + perAttempt + ' over ' + state.attempts + ' attempts \u2014 token: ' + cfg.token;
        var code = el('code', 'pl-receipt-code');
        code.textContent = receipt;
        var copy = el('button', 'pl-btn pl-btn-small');
        copy.type = 'button';
        copy.textContent = 'Copy';
        copy.addEventListener('click', function () { copyText(receipt, copy); });
        box.appendChild(label); box.appendChild(code); box.appendChild(copy);
        result.appendChild(box);
      } else {
        var need = Math.ceil(threshold * perAttempt);
        var hint = el('p', 'pl-quiz-hint');
        hint.textContent = 'You need ' + need + '/' + perAttempt +
          ' to unlock the token. Read the feedback above, then retake.';
        result.appendChild(hint);
      }
      renderMath(result);
    }

    function copyText(text, btn) {
      function done() {
        var old = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(function () { btn.textContent = old; }, 1500);
      }
      if (global.navigator && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
      } else { fallbackCopy(text); done(); }
    }
    function fallbackCopy(text) {
      try {
        var ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', '');
        ta.style.position = 'absolute'; ta.style.left = '-9999px';
        document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); document.body.removeChild(ta);
      } catch (e) { /* clipboard unavailable; user can select manually */ }
    }

    startAttempt();
  };
})(window);
