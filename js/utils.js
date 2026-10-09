(function (global) {
  'use strict';

  const PERSIAN_MONTHS = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];

  function gregorianToJalali(gy, gm, gd) {
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    const gy2 = (gm > 2) ? (gy + 1) : gy;
    let days = 355666 + (365 * gy) + Math.floor((gy2 + 3) / 4)
      - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400)
      + gd + g_d_m[gm - 1];
    let jy = -1595 + (33 * Math.floor(days / 12053));
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) {
      jy += Math.floor((days - 1) / 365);
      days = (days - 1) % 365;
    }
    let jm, jd;
    if (days < 186) {
      jm = 1 + Math.floor(days / 31);
      jd = 1 + (days % 31);
    } else {
      jm = 7 + Math.floor((days - 186) / 30);
      jd = 1 + ((days - 186) % 30);
    }
    return [jy, jm, jd];
  }

  function jalaliToGregorian(jy, jm, jd) {
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    const jy2 = jy - 979, jm2 = jm - 1, jd2 = jd - 1;
    let j_day_no = 365 * jy2 + Math.floor(jy2 / 33) * 8 + Math.floor(((jy2 % 33) + 3) / 4);
    for (let i = 0; i < jm2; i++) j_day_no += (i < 6) ? 31 : 30;
    j_day_no += jd2;
    let g_day_no = j_day_no + 79;
    let gy = 1600 + 400 * Math.floor(g_day_no / 146097);
    g_day_no %= 146097;
    let leap = true;
    if (g_day_no >= 36525) {
      g_day_no--;
      gy += 100 * Math.floor(g_day_no / 36524);
      g_day_no %= 36524;
      if (g_day_no >= 365) g_day_no++; else leap = false;
    }
    gy += 4 * Math.floor(g_day_no / 1461);
    g_day_no %= 1461;
    if (g_day_no >= 366) {
      leap = false;
      g_day_no--;
      gy += Math.floor(g_day_no / 365);
      g_day_no %= 365;
    }
    let gm = 0;
    const gdim = [31, 28 + (leap ? 1 : 0), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    while (gm < 12 && g_day_no >= gdim[gm]) {
      g_day_no -= gdim[gm];
      gm++;
    }
    return [gy, gm + 1, g_day_no + 1];
  }

  function toPersianDigits(input) {
    return String(input).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  }

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  /**
   * Parse a raw links string (one link per line).
   * Supported formats:
   *   https://example.com
   *   Label | https://example.com
   * Returns an array of { label, url }.
   */
  function parseLinks(raw) {
    if (!raw) return [];
    return String(raw)
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        let label = '';
        let url = '';
        if (line.includes('|')) {
          const parts = line.split('|');
          label = parts[0].trim();
          url = parts.slice(1).join('|').trim();
        } else {
          url = line;
        }
        // Ensure url has a scheme
        if (url && !/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) {
          url = 'https://' + url;
        }
        if (!label) {
          try { label = new URL(url).hostname.replace(/^www\./, ''); }
          catch (e) { label = url; }
        }
        return { label: label, url: url };
      })
      .filter(l => l.url);
  }

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
      const [jy, jm, jd] = j;
      return toPersianDigits(jd) + ' ' + PERSIAN_MONTHS[jm - 1] + ' ' + toPersianDigits(jy);
    },

    formatJalaliShort(iso) {
      const j = this.isoToJalali(iso);
      if (!j) return '';
      return toPersianDigits(j[0] + '/' + pad2(j[1]) + '/' + pad2(j[2]));
    },

    todayJalali() {
      const now = new Date();
      const [jy, jm, jd] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
      return toPersianDigits(jd) + ' ' + PERSIAN_MONTHS[jm - 1] + ' ' + toPersianDigits(jy);
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
