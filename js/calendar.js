(function (global) {
  'use strict';

  const { Utils } = global;

  const CATEGORY_COLORS = {
    'بیوانفورماتیک': '#10b981',
    'کارسوق سمپاد': '#8b5cf6',
    'المپیاد': '#f59e0b',
    'جشنواره': '#ec4899',
    'فناوری و برنامه‌نویسی': '#3b82f6',
    'علوم شناختی': '#14b8a6',
    'مطالعه': '#6366f1',
    'کنگره': '#06b6d4',
    'پژوهش و فناوری': '#d946ef',
    'هوش مصنوعی': '#0ea5e9',
    'سایر': '#94a3b8'
  };

  class CalendarView {
    constructor(app) {
      this.app = app;
      this.store = app.store;
      this.mode = 'view';
      this.onPick = null;
      this.currentYear = 0;
      this.currentMonth = 0;
      this.selectedDate = null;
      this._bind();
      this._goToToday();
    }

    _bind() {
      document.getElementById('calendarClose').onclick = () => this.close();
      document.getElementById('calendarModal').addEventListener('click', (e) => {
        if (e.target.id === 'calendarModal') this.close();
      });
      document.getElementById('calPrevMonth').onclick = () => this._navigate(-1);
      document.getElementById('calNextMonth').onclick = () => this._navigate(1);
      document.getElementById('calToday').onclick = () => {
        this._goToToday();
        this.selectedDate = Utils.todayIso();
        this.render();
      };

      document.getElementById('calDays').addEventListener('click', (e) => {
        const cell = e.target.closest('.cal-cell');
        if (!cell || cell.classList.contains('empty')) return;
        const iso = cell.dataset.iso;
        if (!iso) return;
        this._onDayClick(iso);
      });

      document.getElementById('calEvents').addEventListener('click', (e) => {
        const editBtn = e.target.closest('[data-action="cal-edit"]');
        if (editBtn) {
          e.stopPropagation();
          const card = editBtn.closest('.cal-event');
          const id = card && card.dataset.id;
          if (id) {
            this.close();
            setTimeout(() => this.app.openEditor(id), 50);
          }
          return;
        }
        const card = e.target.closest('.cal-event');
        if (card && !e.target.closest('a')) card.classList.toggle('expanded');
      });
    }

    open() {
      this.mode = 'view';
      this.onPick = null;
      document.getElementById('calModalTitle').textContent = 'تقویم رویدادها';
      document.getElementById('calendarModal').hidden = false;
      this._goToToday();
      this.selectedDate = Utils.todayIso();
      this.render();
    }

    /**
     * Open the calendar in "pick a date" mode.
     * @param {string} initialIso  currently selected ISO date (or '')
     * @param {function} callback  called with the picked ISO date (or '' if cleared)
     * @param {object} options     { title, allowClear }
     */
    openPicker(initialIso, callback, options) {
      options = options || {};
      this.mode = 'pick';
      this.onPick = callback;
      document.getElementById('calModalTitle').textContent = options.title || 'انتخاب تاریخ';
      document.getElementById('calendarModal').hidden = false;

      if (initialIso) {
        const j = Utils.isoToJalali(initialIso);
        if (j) {
          this.currentYear = j[0];
          this.currentMonth = j[1];
          this.selectedDate = initialIso;
        }
      } else {
        this._goToToday();
        this.selectedDate = null;
      }
      this.render();
    }

    close() {
      document.getElementById('calendarModal').hidden = true;
      this.onPick = null;
      this.mode = 'view';
    }

    _goToToday() {
      const t = Utils.todayJalaliParts();
      this.currentYear = t[0];
      this.currentMonth = t[1];
    }

    _navigate(delta) {
      let m = this.currentMonth + delta;
      let y = this.currentYear;
      while (m < 1) { m += 12; y--; }
      while (m > 12) { m -= 12; y++; }
      this.currentYear = y;
      this.currentMonth = m;
      this.render();
    }

    _colorForCategory(cat) {
      if (!cat) return '#94a3b8';
      if (CATEGORY_COLORS[cat]) return CATEGORY_COLORS[cat];
      let h = 0;
      for (let i = 0; i < cat.length; i++) h = (h * 31 + cat.charCodeAt(i)) & 0xffff;
      return 'hsl(' + (h % 360) + ' 65% 55%)';
    }

    /**
     * Build a map ISO date → array of items that should be visible on that day.
     * - single: only on its date
     * - range: on every day between start and end
     * - ongoing: only on its start date (with an "ongoing" marker)
     * - tba: not shown on the calendar at all
     */
    _groupByDate() {
      const byDate = {};
      const add = (iso, it) => {
        if (!iso) return;
        if (!byDate[iso]) byDate[iso] = [];
        byDate[iso].push(it);
      };

      this.store.list().forEach(it => {
        const tt = it.timeType || 'single';
        if (tt === 'tba') return;
        if (!it.date) return;

        if (tt === 'range' && it.endDate && it.endDate >= it.date) {
          const days = Utils.enumerateDates(it.date, it.endDate);
          days.forEach(d => add(d, it));
        } else {
          // single or ongoing (also covers range with no endDate)
          add(it.date, it);
        }
      });
      return byDate;
    }

    render() {
      const y = this.currentYear, m = this.currentMonth;
      document.getElementById('calMonthLabel').textContent =
        Utils.PERSIAN_MONTHS[m - 1] + ' ' + Utils.toPersianDigits(y);

      const daysInMonth = Utils.jalaliMonthDays(y, m);
      const firstIso = Utils.jalaliToIso(y, m, 1);
      const firstDate = new Date(firstIso + 'T00:00:00');
      const firstCol = (firstDate.getDay() + 1) % 7; // 0=Sat ... 6=Fri

      const byDate = this._groupByDate();

      let html = '';
      for (let i = 0; i < firstCol; i++) html += '<div class="cal-cell empty"></div>';

      const today = Utils.todayIso();
      for (let d = 1; d <= daysInMonth; d++) {
        const iso = Utils.jalaliToIso(y, m, d);
        const events = byDate[iso] || [];
        const isToday = iso === today;
        const isSelected = iso === this.selectedDate;

        // Detect if this day is part of a multi-day range
        const hasRange = events.some(e => e.timeType === 'range');

        const cls = ['cal-cell'];
        if (events.length) cls.push('has-events');
        if (hasRange) cls.push('in-range');
        if (isToday) cls.push('is-today');
        if (isSelected) cls.push('is-selected');

        const dots = events.slice(0, 4).map(e =>
          '<span class="cal-dot" style="background:' + this._colorForCategory(e.category) + '"></span>'
        ).join('');
        const moreCount = events.length > 4
          ? '<span class="cal-more">+' + Utils.toPersianDigits(events.length - 4) + '</span>'
          : '';

        html += '<div class="' + cls.join(' ') + '" data-iso="' + iso + '">' +
          '<span class="cal-day-num">' + Utils.toPersianDigits(d) + '</span>' +
          (events.length ? '<div class="cal-dots">' + dots + moreCount + '</div>' : '') +
          '</div>';
      }

      document.getElementById('calDays').innerHTML = html;
      this._renderSelectedDay(byDate);
    }

    _renderSelectedDay(byDate) {
      const el = document.getElementById('calEvents');
      if (!this.selectedDate) {
        el.innerHTML = '<p class="cal-hint">روی یک روز کلیک کنید تا رویدادهای آن را ببینید.</p>';
        return;
      }
      const events = byDate[this.selectedDate] || [];
      const jalali = Utils.formatJalaliDate(this.selectedDate);
      const count = Utils.toPersianDigits(events.length);

      let html = '<div class="cal-day-header"><span>' + jalali + '</span>' +
        '<span class="cal-day-count">' + count + ' رویداد</span></div>';

      if (!events.length) {
        html += '<p class="cal-hint">رویدادی در این روز نیست.</p>';
      } else {
        html += events.map(e => {
          const color = this._colorForCategory(e.category);
          const linksHtml = (e.links || []).map(l =>
            '<a href="' + Utils.escapeHtml(l.url) + '" target="_blank" rel="noopener noreferrer">' + Utils.iconSvg('link', 10) + ' ' + Utils.escapeHtml(l.label) + '</a>'
          ).join('');

          let badges = '';
          if (e.time) {
            badges += '<span class="event-time-badge">' + Utils.toPersianDigits(e.time) + '</span>';
          }
          if (e.timeType === 'range' && e.endDate && e.date !== e.endDate) {
            badges += '<span class="event-range-badge">بازه</span>';
          } else if (e.timeType === 'ongoing') {
            badges += '<span class="event-range-badge">مستمر</span>';
          }

          return '<div class="cal-event" data-id="' + Utils.escapeHtml(e.id) + '">' +
            '<span class="cal-event-color" style="background:' + color + '"></span>' +
            '<div class="cal-event-main">' +
              '<div class="cal-event-title">' + Utils.escapeHtml(e.title) + ' ' + badges + '</div>' +
              (e.description ? '<div class="cal-event-desc">' + Utils.escapeHtml(e.description) + '</div>' : '') +
              (linksHtml ? '<div class="cal-event-links">' + linksHtml + '</div>' : '') +
            '</div>' +
            '<div class="cal-event-actions">' +
              '<button class="icon-btn" data-action="cal-edit" title="ویرایش">' + Utils.iconSvg('edit', 14) + '</button>' +
            '</div>' +
          '</div>';
        }).join('');
      }
      el.innerHTML = html;
    }

    _onDayClick(iso) {
      if (this.mode === 'pick') {
        const cb = this.onPick;
        this.close();
        if (cb) cb(iso);
      } else {
        this.selectedDate = iso;
        this.render();
      }
    }
  }

  global.CalendarView = CalendarView;
})(window);
