(function (global) {
  'use strict';

  const PERSIAN_MONTHS = [
    'فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور',
    'مهر','آبان','آذر','دی','بهمن','اسفند'
  ];

  /* ---------------- SVG Icons (Feather-style, minimal) ---------------- */
  const ICONS = {
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    undo: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
    import: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    export: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    cloud: '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
    refresh: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/><path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    tag: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
    hash: '<line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
    sort: '<path d="M3 6h18M6 12h12M10 18h4"/>',
    chart: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
    plug: '<path d="M9 2v6"/><path d="M15 2v6"/><path d="M6 8h12v3a6 6 0 0 1-12 0V8z"/><path d="M12 17v5"/>',
    alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'
  };

  function iconSvg(name, size) {
    const body = ICONS[name] || ICONS.info;
    const s = size || 18;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  }

  /* ---------------- Jalali conversion ---------------- */
  function gregorianToJalali(gy, gm, gd) {
    const g_d_m = [0,31,59,90,120,151,181,212,243,273,304,334];
    const gy2 = (gm > 2) ? (gy + 1) : gy;
    let days = 355666 + (365*gy) + Math.floor((gy2+3)/4) - Math.floor((gy2+99)/100) + Math.floor((gy2+399)/400) + gd + g_d_m[gm-1];
    let jy = -1595 + (33 * Math.floor(days / 12053));
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) { jy += Math.floor((days-1)/365); days = (days-1) % 365; }
    let jm, jd;
    if (days < 186) { jm = 1 + Math.floor(days/31); jd = 1 + (days%31); }
    else { jm = 7 + Math.floor((days-186)/30); jd = 1 + ((days-186)%30); }
    return [jy, jm, jd];
  }
  function jalaliToGregorian(jy, jm, jd) {
    const g_d_m = [0,31,59,90,120,151,181,212,243,273,304,334];
    const jy2 = jy-979, jm2 = jm-1, jd2 = jd-1;
    let j_day_no = 365*jy2 + Math.floor(jy2/33)*8 + Math.floor(((jy2%33)+3)/4);
    for (let i=0;i<jm2;i++) j_day_no += (i<6)?31:30;
    j_day_no += jd2;
    let g_day_no = j_day_no + 79;
    let gy = 1600 + 400*Math.floor(g_day_no/146097);
    g_day_no %= 146097;
    let leap = true;
    if (g_day_no >= 36525) { g_day_no--; gy += 100*Math.floor(g_day_no/36524); g_day_no %= 36524; if (g_day_no >= 365) g_day_no++; else leap = false; }
    gy += 4*Math.floor(g_day_no/1461); g_day_no %= 1461;
    if (g_day_no >= 366) { leap=false; g_day_no--; gy += Math.floor(g_day_no/365); g_day_no %= 365; }
    let gm = 0;
    const gdim = [31,28+(leap?1:0),31,30,31,30,31,31,30,31,30,31];
    while (gm<12 && g_day_no >= gdim[gm]) { g_day_no -= gdim[gm]; gm++; }
    return [gy, gm+1, g_day_no+1];
  }

  function toPersianDigits(input) { return String(input).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]); }
  function pad2(n) { return n < 10 ? '0'+n : ''+n; }

  function parseLinks(raw) {
    if (!raw) return [];
    return String(raw).split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(line => {
      let label = '', url = '';
      if (line.includes('|')) {
        const p = line.split('|');
        label = p[0].trim();
        url = p.slice(1).join('|').trim();
      } else url = line;
      if (url && !/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) url = 'https://' + url;
      if (!label) {
        try { label = new URL(url).hostname.replace(/^www\./, ''); }
        catch (e) { label = url; }
      }
      return { label, url };
    }).filter(l => l.url);
  }

  const Utils = {
    iconSvg,
    ICONS,
    uid() { return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,9); },
    debounce(fn, wait=200) {
      let t;
      return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), wait); };
    },
    escapeHtml(str) {
      if (str == null) return '';
      return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    },
    toPersianDigits,
    gregorianToJalali,
    jalaliToGregorian,
    parseLinks,
    isoToJalali(iso) {
      if (!iso) return null;
      const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (!m) return null;
      return gregorianToJalali(+m[1], +m[2], +m[3]);
    },
    jalaliToIso(jy, jm, jd) {
      const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);
      return gy + '-' + pad2(gm) + '-' + pad2(gd);
    },
    formatJalaliDate(iso) {
      const j = this.isoToJalali(iso);
      if (!j) return '';
      return toPersianDigits(j[2]) + ' ' + PERSIAN_MONTHS[j[1]-1] + ' ' + toPersianDigits(j[0]);
    },
    formatJalaliShort(iso) {
      const j = this.isoToJalali(iso);
      if (!j) return '';
      return toPersianDigits(j[0] + '/' + pad2(j[1]) + '/' + pad2(j[2]));
    },
    todayJalali() {
      const now = new Date();
      const [jy, jm, jd] = gregorianToJalali(now.getFullYear(), now.getMonth()+1, now.getDate());
      return toPersianDigits(jd) + ' ' + PERSIAN_MONTHS[jm-1] + ' ' + toPersianDigits(jy);
    },
    todayIso() {
      const n = new Date();
      return n.getFullYear() + '-' + pad2(n.getMonth()+1) + '-' + pad2(n.getDate());
    },
    isPastDate(iso) {
      if (!iso) return false;
      return iso < this.todayIso();
    },
    download(filename, content) {
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    toast(msg, duration=2200) {
      const el = document.getElementById('toast');
      if (!el) return;
      el.textContent = msg;
      el.hidden = false;
      clearTimeout(el._t);
      el._t = setTimeout(() => { el.hidden = true; }, duration);
    },
    injectIcons(root) {
      (root || document).querySelectorAll('[data-icon]').forEach(el => {
        const name = el.getAttribute('data-icon');
        if (!name) return;
        if (el.querySelector('svg')) return;
        el.innerHTML = iconSvg(name);
      });
    }
  };

  global.Utils = Utils;
})(window);
