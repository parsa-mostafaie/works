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
      this._bindBulk();
      this._bindSync();
      this._bindShortcuts();
      this._autoSyncLoop();
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
    }

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
      document.getElementById('clearAllBtn').onclick = () => {
        if (confirm('Delete ALL works? This cannot be undone.')) {
          this.store.clearAll();
          Utils.toast('All data cleared');
        }
      };
      document.getElementById('syncUrl').oninput = (e) => {
        this.store.saveSettings({ syncUrl: e.target.value.trim() });
      };
      document.getElementById('syncKey').oninput = (e) => {
        this.store.saveSettings({ syncKey: e.target.value.trim() });
      };
    }

    _bindBulk() {
      document.getElementById('bulkClear').onclick = () => {
        this.ui.selected.clear();
        this.ui._render();
      };
      document.getElementById('bulkDelete').onclick = () => {
        if (confirm('Delete ' + this.ui.selected.size + ' work(s)?')) {
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
        if (s === 'syncing') { dot.classList.add('syncing'); text.textContent = msg || 'Syncing...'; }
        else if (s === 'error') { dot.classList.add('error'); text.textContent = 'Sync error'; }
        else { text.textContent = msg || 'Ready'; }
        document.getElementById('syncStatusText').textContent = msg || '';
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
        }
      });
    }

    _autoSyncLoop() {
      setInterval(() => {
        const s = this.store.getSettings();
        if (s.syncUrl) this.doSync().catch(() => {});
      }, 60000);
    }

    openEditor(id) {
      const modal = document.getElementById('modal');
      const editing = !!id;
      document.getElementById('modalTitle').textContent = editing ? 'Edit Work' : 'New Work';
      const item = editing ? this.store.get(id) : null;
      document.getElementById('itemId').value = id || '';
      document.getElementById('itemTitle').value = item ? item.title : '';
      document.getElementById('itemDesc').value = item ? (item.description || '') : '';
      document.getElementById('itemCategory').value = item ? (item.category || '') : '';
      document.getElementById('itemDate').value = item ? (item.date || '') : '';
      document.getElementById('itemTags').value = item ? (item.tags || []).join(', ') : '';
      document.getElementById('itemDone').checked = item ? !!item.done : false;
      modal.hidden = false;
      setTimeout(() => document.getElementById('itemTitle').focus(), 30);
    }

    saveEditor() {
      const id = document.getElementById('itemId').value;
      const title = document.getElementById('itemTitle').value.trim();
      if (!title) { Utils.toast('Title is required'); return; }
      const data = {
        title: title,
        description: document.getElementById('itemDesc').value.trim(),
        category: document.getElementById('itemCategory').value.trim(),
        date: document.getElementById('itemDate').value,
        tags: document.getElementById('itemTags').value
          .split(',').map(t => t.trim()).filter(Boolean),
        done: document.getElementById('itemDone').checked
      };
      if (id) this.store.update(id, data);
      else this.store.add(data);
      document.getElementById('modal').hidden = true;
      Utils.toast(id ? 'Updated' : 'Added');
    }

    openSettings() {
      const s = this.store.getSettings();
      document.getElementById('syncUrl').value = s.syncUrl || '';
      document.getElementById('syncKey').value = s.syncKey || '';
      document.getElementById('settingsModal').hidden = false;
    }

    export() {
      const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        items: this.store.list()
      };
      Utils.download('works-' + Date.now() + '.json', JSON.stringify(data, null, 2));
      Utils.toast('Exported');
    }

    async import(e) {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const items = Array.isArray(parsed) ? parsed : (parsed.items || []);
        if (!Array.isArray(items)) throw new Error('Invalid format');
        const mode = confirm(
          'Import ' + items.length + ' work(s).\n\n' +
          'OK = Merge with existing (recommended)\n' +
          'Cancel = Replace ALL existing data'
        ) ? 'merge' : 'replace';
        if (mode === 'merge') this.store.mergeAll(items);
        else this.store.replaceAll(items);
        Utils.toast('Imported ' + items.length + ' work(s)');
      } catch (err) {
        Utils.toast('Import failed: ' + err.message);
      }
      e.target.value = '';
    }

    async doSync() {
      try {
        await this.sync.sync();
        Utils.toast('Synced');
      } catch (err) {
        Utils.toast('Sync failed: ' + err.message);
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
