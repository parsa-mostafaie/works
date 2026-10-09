(function (global) {
  'use strict';

  const { Utils } = global;

  class AppClass {
    constructor() {
      this.store = new global.Store();
      this.ui = new global.UI(this.store);
      this.sync = new global.CloudSync(this.store);
      this._bindHeader();
      this._bindFilters();
      this._bindModal();
      this._bindGuide();
      this._bindBulk();
      this._bindSync();
      this._bindShortcuts();
      this._autoSyncLoop();
      this._reflectSyncConfig();
      this._updateDatePreview();
    }

    _bindHeader() {
      document.getElementById('addBtn').onclick = () => this.openEditor(null);
      document.getElementById('exportBtn').onclick = () => this.export();
      document.getElementById('importBtn').onclick = () => document.getElementById('fileInput').click();
      document.getElementById('settingsBtn').onclick = () => this.openSettings();
      document.getElementById('syncBtn').onclick = () => this.doSync();
      document.getElementById('fileInput').onchange = (e) => this.import(e);
      document.getElementById('list').addEventListener('click', (e) => this.ui.handleListClick(e));
    }

    _bindFilters() {
      const search = document.getElementById('searchInput');
      search.oninput = Utils.debounce(() => this.ui.setFilter({ q: search.value.trim() }), 150);

      document.getElementById('categoryFilter').onchange = (e) => {
        this.ui.setFilter({ category: e.target.value });
      };

      document.querySelectorAll('input[name="status"]').forEach(r => {
        r.onchange = () => { if (r.checked) this.ui.setFilter({ status: r.value }); };
      });

      const sortSel = document.getElementById('sortSelect');
      sortSel.value = this.ui.sort;
      sortSel.onchange = (e) => this.ui.setSort(e.target.value);
    }

    _bindModal() {
      const modal = document.getElementById('modal');
      const close = () => { modal.hidden = true; };
      document.getElementById('modalClose').onclick = close;
      document.getElementById('modalCancel').onclick = close;
      document.getElementById('modalSave').onclick = () => this.saveEditor();
      modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

      const dateInput = document.getElementById('itemDate');
      dateInput.addEventListener('input', () => this._updateDatePreview());

      const sm = document.getElementById('settingsModal');
      const sclose = () => { sm.hidden = true; };
      document.getElementById('settingsClose').onclick = sclose;
      sm.addEventListener('click', (e) => { if (e.target === sm) sclose(); });

      document.getElementById('syncNowBtn').onclick = () => this.doSync();
      document.getElementById('testConnBtn').onclick = () => this.testConnection();
      document.getElementById('openGuideBtn').onclick = () => this.openGuide();
      document.getElementById('openGuideBtn2').onclick = () => this.openGuide();

      document.getElementById('clearAllBtn').onclick = () => {
        if (confirm('همه کارها حذف شوند؟ این عمل قابل بازگشت نیست.')) {
          this.store.clearAll();
          Utils.toast('همه داده‌ها پاک شد');
        }
      };

      const urlInput = document.getElementById('syncUrl');
      const keyInput = document.getElementById('syncKey');

      urlInput.oninput = (e) => {
        const v = e.target.value.trim();
        this.store.saveSettings({ syncUrl: v });
        this._reflectSyncConfig();
      };
      keyInput.oninput = (e) => {
        this.store.saveSettings({ syncKey: e.target.value.trim() });
        this._reflectSyncConfig();
      };
    }

    _bindGuide() {
      const gm = document.getElementById('guideModal');
      const close = () => { gm.hidden = true; };
      document.getElementById('guideClose').onclick = close;
      gm.addEventListener('click', (e) => { if (e.target === gm) close(); });
    }

    _bindBulk() {
      document.getElementById('bulkClear').onclick = () => {
        this.ui.selected.clear();
        this.ui._render();
      };
      document.getElementById('bulkDelete').onclick = () => {
        const n = Utils.toPersianDigits(this.ui.selected.size);
        if (confirm(n + ' کار حذف شوند؟')) {
          this.store.removeMany(Array.from(this.ui.selected));
          this.ui.selected.clear();
        }
      };
      document.getElementById('bulkDone').onclick = () => {
        this.store.updateMany(Array.from(this.ui.selected), { done: true });
        this.ui.selected.clear();
      };
      document.getElementById('bulkUndone').onclick = () => {
        this.store.updateMany(Array.from(this.ui.selected), { done: false });
        this.ui.selected.clear();
      };
    }

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

    _bindShortcuts() {
      document.addEventListener('keydown', (e) => {
        const mod = e.ctrlKey || e.metaKey;
        if (mod && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          document.getElementById('searchInput').focus();
        } else if (mod && e.key.toLowerCase() === 'n') {
          e.preventDefault();
          this.openEditor(null);
        } else if (e.key === 'Escape') {
          document.getElementById('modal').hidden = true;
          document.getElementById('settingsModal').hidden = true;
          document.getElementById('guideModal').hidden = true;
        }
      });
    }

    _autoSyncLoop() {
      setInterval(() => {
        if (this.sync.hasConfig()) this.doSync().catch(() => {});
      }, 60000);
    }

    _reflectSyncConfig() {
      const ok = this.sync.hasConfig();
      const dot = document.getElementById('syncDot');
      const text = document.getElementById('syncText');
      if (!ok) {
        dot.classList.remove('syncing', 'error');
        text.textContent = 'فقط محلی';
      }
    }

    _updateDatePreview() {
      const iso = document.getElementById('itemDate').value;
      const preview = document.getElementById('itemDatePreview');
      if (!preview) return;
      if (!iso) {
        preview.textContent = '— بدون تاریخ شمسی —';
        preview.classList.add('empty');
        return;
      }
      const jalali = Utils.formatJalaliDate(iso);
      const short = Utils.formatJalaliShort(iso);
      preview.textContent = '📅 ' + jalali + '  (' + short + ')';
      preview.classList.remove('empty');
    }

    openEditor(id) {
      const modal = document.getElementById('modal');
      const editing = !!id;
      document.getElementById('modalTitle').textContent = editing ? 'ویرایش کار' : 'کار جدید';
      const item = editing ? this.store.get(id) : null;
      document.getElementById('itemId').value = id || '';
      document.getElementById('itemTitle').value = item ? item.title : '';
      document.getElementById('itemDesc').value = item ? (item.description || '') : '';
      document.getElementById('itemCategory').value = item ? (item.category || '') : '';
      document.getElementById('itemDate').value = item ? (item.date || '') : '';
      document.getElementById('itemTags').value = item ? (item.tags || []).join('، ') : '';
      document.getElementById('itemLinks').value = item
        ? (item.links || []).map(l => l.label && l.label !== l.url ? (l.label + ' | ' + l.url) : l.url).join('\n')
        : '';
      document.getElementById('itemDone').checked = item ? !!item.done : false;
      this._updateDatePreview();
      modal.hidden = false;
      setTimeout(() => document.getElementById('itemTitle').focus(), 30);
    }

    saveEditor() {
      const id = document.getElementById('itemId').value;
      const title = document.getElementById('itemTitle').value.trim();
      if (!title) { Utils.toast('عنوان الزامی است'); return; }

      const tagsRaw = document.getElementById('itemTags').value;
      const tags = tagsRaw
        .split(/[,،]/)
        .map(t => t.trim())
        .filter(Boolean);

      const linksRaw = document.getElementById('itemLinks').value;
      const links = Utils.parseLinks(linksRaw);

      const data = {
        title: title,
        description: document.getElementById('itemDesc').value.trim(),
        category: document.getElementById('itemCategory').value.trim(),
        date: document.getElementById('itemDate').value,
        tags: tags,
        links: links,
        done: document.getElementById('itemDone').checked
      };
      if (id) this.store.update(id, data);
      else this.store.add(data);
      document.getElementById('modal').hidden = true;
      Utils.toast(id ? 'ویرایش شد' : 'اضافه شد');
    }

    openSettings() {
      const s = this.store.getSettings();
      document.getElementById('syncUrl').value = s.syncUrl || '';
      document.getElementById('syncKey').value = s.syncKey || '';
      document.getElementById('syncStatusText').textContent = this.sync.hasConfig()
        ? 'آماده همگام‌سازی.'
        : 'برای فعال‌سازی همگام‌سازی، شناسه Gist و توکن را وارد کنید.';
      document.getElementById('settingsModal').hidden = false;
    }

    openGuide() {
      document.getElementById('guideModal').hidden = false;
    }

    export() {
      const data = {
        version: 1,
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
          'وارد کردن ' + n + ' کار.\n\n' +
          'تأیید = ادغام با داده‌های موجود (پیشنهادی)\n' +
          'لغو = جایگزینی کامل داده‌های موجود'
        );
        if (merge) this.store.mergeAll(items);
        else this.store.replaceAll(items);
        Utils.toast(n + ' کار وارد شد');
      } catch (err) {
        Utils.toast('خطا در ورود داده: ' + err.message);
      }
      e.target.value = '';
    }

    async testConnection() {
      try {
        const info = await this.sync.testConnection();
        const files = info.files.length ? info.files.join(', ') : 'خالی';
        document.getElementById('syncStatusText').textContent =
          '✓ متصل به Gist ' + String(info.id).slice(0, 8) + '… | فایل‌ها: ' + files +
          (info.hasWorksFile ? '' : ' (works.json در اولین ارسال ساخته می‌شود)');
        Utils.toast('اتصال برقرار است');
      } catch (err) {
        Utils.toast('✗ ' + err.message);
        document.getElementById('syncStatusText').textContent = 'خطا: ' + err.message;
      }
    }

    async doSync() {
      if (!this.sync.hasConfig()) {
        Utils.toast('ابتدا همگام‌سازی را تنظیم کنید (تنظیمات → راهنما)');
        this.openSettings();
        return;
      }
      try {
        await this.sync.sync();
        Utils.toast('همگام‌سازی شد');
      } catch (err) {
        Utils.toast('خطای همگام‌سازی: ' + err.message);
      }
    }
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  global.addEventListener('DOMContentLoaded', () => {
    global.App = new AppClass();
  });
})(window);
