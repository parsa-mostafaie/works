(function (global) {
  'use strict';

  const Utils = {
    uid() {
      return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
    },
    debounce(fn, wait = 200) {
      let t;
      return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
      };
    },
    escapeHtml(str) {
      if (str == null) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },
    formatDate(iso) {
      if (!iso) return '';
      try {
        const d = new Date(iso);
        if (isNaN(d)) return '';
        return d.toLocaleDateString(undefined, {
          year: 'numeric', month: 'short', day: 'numeric'
        });
      } catch (e) { return ''; }
    },
    download(filename, content) {
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    toast(msg, duration = 2200) {
      const el = document.getElementById('toast');
      if (!el) return;
      el.textContent = msg;
      el.hidden = false;
      clearTimeout(el._t);
      el._t = setTimeout(() => { el.hidden = true; }, duration);
    },
    deepClone(obj) {
      return JSON.parse(JSON.stringify(obj));
    }
  };

  global.Utils = Utils;
})(window);
