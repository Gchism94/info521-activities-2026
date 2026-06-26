/* ============================================================================
   Peer-Loops shared viz helpers. Okabe-Ito data palette + theme-aware chrome
   colors read from CSS variables so D3 axes track light/dark mode. Classic
   script; depends on nothing but the DOM.
   ========================================================================== */
(function (global) {
  'use strict';
  var PL = global.PL = global.PL || {};

  PL.viz = {
    okabe: {
      blue: '#0072B2', vermillion: '#D55E00', green: '#009E73', orange: '#E69F00',
      sky: '#56B4E9', yellow: '#F0E442', purple: '#CC79A7', black: '#000000'
    },

    cssVar: function (name, fallback) {
      try {
        var v = getComputedStyle(document.documentElement).getPropertyValue(name);
        return v && v.trim() ? v.trim() : fallback;
      } catch (e) { return fallback; }
    },

    gridColor: function () { return this.cssVar('--pl-grid', 'rgba(0,0,0,0.10)'); },
    textColor: function () { return this.cssVar('--pl-muted', '#5f5e5a'); },

    /* Run cb whenever the OS light/dark preference flips. */
    onThemeChange: function (cb) {
      if (!global.matchMedia) return;
      var mq = global.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) mq.addEventListener('change', cb);
      else if (mq.addListener) mq.addListener(cb);
    }
  };
})(window);
