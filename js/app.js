(function (global) {
  'use strict';

  const { Utils } = global;

  class AppClass {
    constructor() {
      Utils.injectIcons(document);
      Utils.autoPersianify(document);
      this.store = new global.Store();
      this.ui = new global.UI(this.store);
      this.sync = new global.CloudSync(this.store);
      this.calendar = new global.CalendarView(this);
      this._bindHeader();
      this._bindFilters();
      this._bindModal();
      this._bindTiming();
      this._bindGuide();
      this._bindShortcutsModal();
      this._bindWelcomeModal();
      this._bindBulk();
      this._bindSync();
      this._bindKeyboardShortcuts();
      this._autoSyncLoop();
      this._reflectSyncConfig();
      this._maybeShowWelcome();
    }

    /* ================= Header & filters ================= */

    _bindHeader() {
      document.getElementById('addBtn').onclick = () => this.openEditor(null);
      document.getElementById('exportBtn').onclick = () => this.export();
      document.getElementById('importBtn').onclick = () => document.getElementById('fileInput').click();
      document.getElementById('settingsBtn').onclick = () => this.openSettings();
      document.getElementById('syncBtn').onclick = () => this.doSync();
      document.getElementById('calendarBtn').onclick = () => this.calendar.open();
      document.getElementById('shortcutsBtn').onclick = () => this.openShortcuts();
      document.getElementById('fileInput').onchange = (e) => this.import(e);
      document.getElementById('list').addEventListener('click', (e) => this.ui.handleListClick(e));
    }

    _bindFilters() {
      const search = document.getElementById('searchInput');
      search.oninput = Utils.debounce(() => this.ui.setFilter({ q: search.value.trim() }), 150);

      document.getElementById('categoryFilter').onchange = (e) => this.ui.setFilter({ category: e.target.value });

      document.querySelectorAll('input[name="status"]').forEach(r => {
        r.onchange = () => { if (r.checked) this.ui.setFilter({ status: r.value }); };
      });

      document.querySelectorAll('input[name="timeTypeFilter"]').forEach(r => {
        r.onchange = () => { if (r.checked) this.ui.setFilter({ timeType: r.value }); };
      });

      const sortSel = document.getElementById('sortSelect');
      sortSel.value = this.ui.sort;
      sortSel.onchange = (e) => this.ui.setSort(e.target.value);
    }

    /* ================= Item editor modal ================= */

    _bindModal() {
      const modal = document.getElementById('modal');
      const close = () => { modal.hidden = true; };
      document.getElementById('modalClose').onclick = close;
      document.getElementById('modalCancel').onclick = close;
      document.getElementById('modalSave').onclick = () => this.saveEditor();
      modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

      const sm = document.getElementById('settingsModal');
      const sclose = () => { sm.hidden = true; };
      document.getElementById('settingsClose').onclick = sclose;
      sm.addEventListener('click', (e) => { if (e.target === sm) sclose(); });

      document.getElementById('syncNowBtn').onclick = () => this.doSync();
      document.getElementById('testConnBtn').onclick = () => this.testConnection();
      document.getElementById('openGuideBtn').onclick = () => this.openGuide();
      document.getElementById('openGuideBtn2').onclick = () => this.openGuide();
      document.getElementById('openShortcutsBtn').onclick = () => { sm.hidden = true; setTimeout(() => this.openShortcuts(), 50); };
      document.getElementById('openWelcomeBtn').onclick = () => { sm.hidden = true; setTimeout(() => this.openWelcome(), 50); };

      document.getElementById('clearAllBtn').onclick = () => {
        if (confirm('همه کارها حذف شوند؟ این عمل قابل بازگشت نیست.')) {
          this.store.clearAll();
          Utils.toast('همه داده‌ها پاک شد');
        }
      };

      const urlInput = document.getElementById('syncUrl');
      const keyInput = document.getElementById('syncKey');
      urlInput.oninput = (e) => { this.store.saveSettings({ syncUrl: e.target.value.trim() }); this._reflectSyncConfig(); };
      keyInput.oninput = (e) => { this.store.saveSettings({ syncKey: e.target.value.trim() }); this._reflectSyncConfig(); };
    }

    _bindTiming() {
      document.querySelectorAll('input[name="timeType"]').forEach(r => {
        r.addEventListener('change', () => { if (r.checked) this._applyTimeType(r.value); });
      });

      document.getElementById('itemDateBtn').onclick = () => {
        const current = document.getElementById('itemDate').value || '';
        const isRange = this._getTimeType() === 'range';
        this.calendar.openPicker(current, (iso) => this._setStartDate(iso), {
          title: isRange ? 'انتخاب تاریخ شروع' : 'انتخاب تاریخ'
        });
      };
      document.getElementById('itemDateClear').onclick = () => this._setStartDate('');

      document.getElementById('itemEndDateBtn').onclick = () => {
        const startIso = document.getElementById('itemDate').value || '';
        const currentEnd = document.getElementById('itemEndDate').value || '';
        this.calendar.openPicker(currentEnd || startIso, (iso) => this._setEndDate(iso), {
          title: 'انتخاب تاریخ پایان'
        });
      };
      document.getElementById('itemEndDateClear').onclick = () => this._setEndDate('');
    }

    /* ================= Guide modal ================= */

    _bindGuide() {
      const gm = document.getElementById('guideModal');
      const close = () => { gm.hidden = true; };
      document.getElementById('guideClose').onclick = close;
      gm.addEventListener('click', (e) => { if (e.target === gm) close(); });
    }

    /* ================= Shortcuts modal ================= */

    _bindShortcutsModal() {
      const sm = document.getElementById('shortcutsModal');
      const close = () => { sm.hidden = true; };
      document.getElementById('shortcutsClose').onclick = close;
      document.getElementById('shortcutsOk').onclick = close;
      sm.addEventListener('click', (e) => { if (e.target === sm) close(); });
    }

    openShortcuts() {
      document.getElementById('shortcutsModal').hidden = false;
    }

    toggleShortcuts() {
      const sm = document.getElementById('shortcutsModal');
      sm.hidden = !sm.hidden;
    }

    /* ================= Welcome / FTUX ================= */

    _bindWelcomeModal() {
      const wm = document.getElementById('welcomeModal');
      const dismiss = () => {
        wm.hidden = true;
        this.store.markFtuxSeen();
      };

      document.getElementById('welcomeStart').onclick = () => {
        dismiss();
        this.openEditor(null);
      };
      document.getElementById('welcomeSample').onclick = () => {
        const samples = Utils.sampleItems();
        this.store.mergeAll(samples);
        dismiss();
        Utils.toast(Utils.toPersianDigits(samples.length) + ' کار نمونه اضافه شد');
      };
      document.getElementById('welcomeShortcuts').onclick = () => {
        dismiss();
        setTimeout(() => this.openShortcuts(), 50);
      };
      document.getElementById('welcomeSkip').onclick = dismiss;

      wm.addEventListener('click', (e) => { if (e.target === wm) dismiss(); });
    }

    openWelcome() {
      document.getElementById('welcomeModal').hidden = false;
    }

    _maybeShowWelcome() {
      const s = this.store.getSettings();
      if (!s.ftuxSeen) {
        // Small delay so icons & layout settle first
        setTimeout(() => this.openWelcome(), 250);
      }
    }

    /* ================= Bulk actions ================= */

    _bindBulk() {
      document.getElementById('bulkClear').onclick = () => { this.ui.selected.clear(); this.ui._render(); };
      document.getElementById('bulkDelete').onclick = () => this.bulkDelete();
      document.getElementById('bulkDone').onclick = () => this.bulkMark(true);
      document.getElementById('bulkUndone').onclick = () => this.bulkMark(false);
    }

    bulkDelete() {
      if (this.ui.selected.size === 0) return;
      const n = Utils.toPersianDigits(this.ui.selected.size);
      if (confirm(n + ' کار حذف شوند؟')) {
        this.store.removeMany(Array.from(this.ui.selected));
        this.ui.selected.clear();
      }
    }

    bulkMark(done) {
      if (this.ui.selected.size === 0) return;
      this.store.updateMany(Array.from(this.ui.selected), { done });
      this.ui.selected.clear();
    }

    /* ================= Sync ================= */

    _bindSync() {
      this.sync.onStatus((s, msg) => {
        const dot = document.getElementById('syncDot');
        const text = document.getElementById('syncText');
        dot.classList.remove('syncing', 'error');
        if (s === 'syncing') { dot.classList.add('syncing'); text.textContent = msg || 'در حال همگام‌سازی…'; }
        else if (s === 'error') { dot.classList.add('error'); text.textContent = 'خطای همگام‌سازی'; }
        else { text.textContent = msg || 'آماده'; }
        const st = document.getElementById('syncStatusText');
        if (st) st.textContent = msg || '';
      });
    }

    _autoSyncLoop() {
      setInterval(() => { if (this.sync.hasConfig()) this.doSync().catch(() => {}); }, 60000);
    }

    _reflectSyncConfig() {
      if (!this.sync.hasConfig()) {
        const dot = document.getElementById('syncDot');
        const text = document.getElementById('syncText');
        dot.classList.remove('syncing', 'error');
        text.textContent = 'فقط محلی';
      }
    }

    /* ================= Keyboard shortcuts ================= */

    _bindKeyboardShortcuts() {
      document.addEventListener('keydown', (e) => {
        const mod = e.ctrlKey || e.metaKey;
        const key = (e.key || '').toLowerCase();

        // ---- Modifier combos ----
        if (mod) {
          // Ctrl+K — search
          if (key === 'k') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
            document.getElementById('searchInput').select();
            return;
          }
          // Ctrl+N — new
          if (key === 'n') {
            e.preventDefault();
            this.openEditor(null);
            return;
          }
          // Ctrl+/ — shortcuts
          if (key === '/' || key === '?') {
            e.preventDefault();
            this.toggleShortcuts();
            return;
          }
          // Ctrl+, — settings
          if (key === ',' || key === '،') {
            e.preventDefault();
            this.openSettings();
            return;
          }
          // Ctrl+S — sync
          if (key === 's' && !e.shiftKey) {
            e.preventDefault();
            this.doSync();
            return;
          }
          // Ctrl+I — import
          if (key === 'i') {
            e.preventDefault();
            document.getElementById('fileInput').click();
            return;
          }
          // Ctrl+E — export
          if (key === 'e') {
            e.preventDefault();
            this.export();
            return;
          }
          // Ctrl+L — calendar
          if (key === 'l') {
            e.preventDefault();
            this.calendar.open();
            return;
          }
          // Ctrl+A — select all visible
          if (key === 'a') {
            const list = document.getElementById('list');
            const visibleIds = Array.from(list.querySelectorAll('.item')).map(el => el.dataset.id);
            if (visibleIds.length) {
              e.preventDefault();
              visibleIds.forEach(id => this.ui.selected.add(id));
              this.ui._render();
            }
            return;
          }
          // Ctrl+D — mark selected done
          if (key === 'd') {
            if (this.ui.selected.size) {
              e.preventDefault();
              this.bulkMark(!e.shiftKey);
            }
            return;
          }
        }

        // ---- Plain keys ----
        if (e.key === 'Escape') {
          ['modal', 'settingsModal', 'guideModal', 'calendarModal', 'shortcutsModal', 'welcomeModal']
            .forEach(id => { const el = document.getElementById(id); if (el) el.hidden = true; });
          return;
        }
        if (e.key === '?' && !mod) {
          // Only when not typing in an input
          const tag = (document.activeElement && document.activeElement.tagName) || '';
          if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
            e.preventDefault();
            this.toggleShortcuts();
          }
        }
      });
    }

    /* ================= Timing UI helpers ================= */

    _getTimeType() {
      const el = document.querySelector('input[name="timeType"]:checked');
      return el ? el.value : 'single';
    }

    _setTimeType(tt) {
      const el = document.querySelector('input[name="timeType"][value="' + tt + '"]');
      if (el) el.checked = true;
      this._applyTimeType(tt);
    }

    _applyTimeType(tt) {
      const startLabel = document.getElementById('dateStartLabel');
      const startLabelText = document.getElementById('dateStartLabelText');
      const endLabel = document.getElementById('dateEndLabel');
      const timeWrap = document.getElementById('itemTime');

      if (tt !== 'range') {
        const currentEnd = document.getElementById('itemEndDate').value;
        if (currentEnd) this._setEndDate('');
      }

      if (tt === 'tba') {
        startLabel.hidden = true;
        endLabel.hidden = true;
        this._setStartDate('');
        timeWrap.disabled = true;
        timeWrap.parentNode.style.opacity = '0.5';
      } else {
        startLabel.hidden = false;
        endLabel.hidden = (tt !== 'range');
        timeWrap.disabled = false;
        timeWrap.parentNode.style.opacity = '1';
        if (tt === 'range') startLabelText.textContent = 'تاریخ شروع';
        else if (tt === 'ongoing') startLabelText.textContent = 'تاریخ شروع';
        else startLabelText.textContent = 'تاریخ';
      }
    }

    _setStartDate(iso) {
      const hidden = document.getElementById('itemDate');
      const btnText = document.getElementById('itemDateText');
      const btn = document.getElementById('itemDateBtn');
      const clearBtn = document.getElementById('itemDateClear');

      hidden.value = iso || '';
      if (iso) {
        const jalali = Utils.formatJalaliDate(iso);
        const short = Utils.formatJalaliShort(iso);
        const past = Utils.isPastDate(iso) ? ' • گذشته' : '';
        btnText.textContent = jalali + ' (' + short + ')' + past;
        btn.classList.remove('empty');
        clearBtn.hidden = false;
      } else {
        btnText.textContent = 'انتخاب تاریخ…';
        btn.classList.add('empty');
        clearBtn.hidden = true;
      }
    }

    _setEndDate(iso) {
      const hidden = document.getElementById('itemEndDate');
      const btnText = document.getElementById('itemEndDateText');
      const btn = document.getElementById('itemEndDateBtn');
      const clearBtn = document.getElementById('itemEndDateClear');

      hidden.value = iso || '';
      if (iso) {
        const jalali = Utils.formatJalaliDate(iso);
        const short = Utils.formatJalaliShort(iso);
        btnText.textContent = jalali + ' (' + short + ')';
        btn.classList.remove('empty');
        clearBtn.hidden = false;
      } else {
        btnText.textContent = 'انتخاب تاریخ…';
        btn.classList.add('empty');
        clearBtn.hidden = true;
      }
    }

    /* ================= Editor ================= */

    openEditor(id) {
      const modal = document.getElementById('modal');
      const editing = !!id;
      document.getElementById('modalTitle').textContent = editing ? 'ویرایش کار' : 'کار جدید';
      const item = editing ? this.store.get(id) : null;
      const tt = item ? (item.timeType || 'single') : 'single';

      document.getElementById('itemId').value = id || '';
      document.getElementById('itemTitle').value = item ? item.title : '';
      document.getElementById('itemDesc').value = item ? (item.description || '') : '';
      document.getElementById('itemCategory').value = item ? (item.category || '') : '';
      document.getElementById('itemTags').value = item ? (item.tags || []).join('، ') : '';
      document.getElementById('itemLinks').value = item
        ? (item.links || []).map(l => l.label && l.label !== l.url ? (l.label + ' | ' + l.url) : l.url).join('\n')
        : '';
      document.getElementById('itemDone').checked = item ? !!item.done : false;
      document.getElementById('itemTime').value = item ? (item.time || '') : '';
      document.getElementById('itemIsDeadline').checked = item ? !!item.isDeadline : false;

      this._setTimeType(tt);
      this._setStartDate(item ? (item.date || '') : '');
      this._setEndDate(item ? (item.endDate || '') : '');

      modal.hidden = false;
      setTimeout(() => document.getElementById('itemTitle').focus(), 30);
    }

    saveEditor() {
      const id = document.getElementById('itemId').value;
      const title = document.getElementById('itemTitle').value.trim();
      if (!title) { Utils.toast('عنوان الزامی است'); return; }

      const timeType = this._getTimeType();
      let startDate = document.getElementById('itemDate').value || '';
      let endDate = document.getElementById('itemEndDate').value || '';

      if (timeType === 'range') {
        if (!startDate) { Utils.toast('تاریخ شروع را انتخاب کنید'); return; }
        if (endDate && endDate < startDate) { Utils.toast('تاریخ پایان باید بعد از شروع باشد'); return; }
        if (!endDate) endDate = startDate;
      }
      if (timeType === 'tba') { startDate = ''; endDate = ''; }
      else if (timeType === 'single' || timeType === 'ongoing') endDate = '';

      const tags = Utils.toLatinDigits(document.getElementById('itemTags').value)
        .split(/[,،]/).map(t => t.trim()).filter(Boolean);
      const links = Utils.parseLinks(document.getElementById('itemLinks').value);
      const time = document.getElementById('itemTime').value || '';

      const data = {
        title,
        description: document.getElementById('itemDesc').value.trim(),
        category: document.getElementById('itemCategory').value.trim(),
        tags,
        links,
        done: document.getElementById('itemDone').checked,
        timeType,
        date: startDate,
        endDate,
        time,
        isDeadline: document.getElementById('itemIsDeadline').checked
      };

      if (id) this.store.update(id, data);
      else this.store.add(data);
      document.getElementById('modal').hidden = true;
      Utils.toast(id ? 'ویرایش شد' : 'اضافه شد');
    }

    /* ================= Settings ================= */

    openSettings() {
      const s = this.store.getSettings();
      document.getElementById('syncUrl').value = s.syncUrl || '';
      document.getElementById('syncKey').value = s.syncKey || '';
      document.getElementById('syncStatusText').textContent = this.sync.hasConfig()
        ? 'آماده همگام‌سازی.'
        : 'برای فعال‌سازی، شناسه Gist و توکن را وارد کنید.';
      document.getElementById('settingsModal').hidden = false;
    }

    openGuide() { document.getElementById('guideModal').hidden = false; }

    /* ================= Import / Export ================= */

    export() {
      const data = {
        version: 2,
        schemaVersion: 2,
        exportedAt: new Date().toISOString(),
        items: this.store.list()
      };
      Utils.download('works-' + Date.now() + '.json', JSON.stringify(data, null, 2));
      Utils.toast('خروجی گرفته شد');
    }

    async import(e) {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const items = Array.isArray(parsed) ? parsed : (parsed.items || []);
        if (!Array.isArray(items)) throw new Error('فرمت فایل نامعتبر است');
        const n = Utils.toPersianDigits(items.length);
        const merge = confirm(
          'وارد کردن ' + n + ' کار.\n\nتأیید = ادغام\nلغو = جایگزینی کامل'
        );
        if (merge) this.store.mergeAll(items);
        else this.store.replaceAll(items);
        Utils.toast(n + ' کار وارد شد');
      } catch (err) { Utils.toast('خطا: ' + err.message); }
      e.target.value = '';
    }

    /* ================= Sync ================= */

    async testConnection() {
      try {
        const info = await this.sync.testConnection();
        const files = info.files.length ? info.files.join(', ') : 'خالی';
        document.getElementById('syncStatusText').textContent =
          '✓ متصل | فایل‌ها: ' + files + (info.hasWorksFile ? '' : ' (works.json ساخته می‌شود)');
        Utils.toast('اتصال برقرار است');
      } catch (err) {
        Utils.toast('✗ ' + err.message);
        document.getElementById('syncStatusText').textContent = 'خطا: ' + err.message;
      }
    }

    async doSync() {
      if (!this.sync.hasConfig()) {
        Utils.toast('ابتدا همگام‌سازی را تنظیم کنید');
        this.openSettings();
        return;
      }
      try { await this.sync.sync(); Utils.toast('همگام‌سازی شد'); }
      catch (err) { Utils.toast('خطا: ' + err.message); }
    }
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  global.addEventListener('DOMContentLoaded', () => { global.App = new AppClass(); });
})(window);
