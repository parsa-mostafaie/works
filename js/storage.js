(function (global) {
  'use strict';

  const STORAGE_KEY = 'works.items.v2';
  const SETTINGS_KEY = 'works.settings.v1';
  const LEGACY_KEY = 'works.items.v1';

  class Store extends EventTarget {
    constructor() {
      super();
      this.items = [];
      this.settings = {
        syncUrl: '',
        syncKey: '',
        sort: 'date-asc',
        timeTypeFilter: '',
        ftuxSeen: false
      };
      this._load();
      this._setupCrossTab();
    }

    _normalize(it) {
      if (!it || typeof it !== 'object') return it;
      if (!Array.isArray(it.tags)) it.tags = [];
      if (!Array.isArray(it.links)) it.links = [];
      const t = (global.Utils && Utils.normalizeTiming) ? Utils.normalizeTiming(it) : it;
      t.id = it.id;
      t.createdAt = it.createdAt || Date.now();
      t.updatedAt = it.updatedAt || t.createdAt;
      return t;
    }

    _load() {
      try {
        let raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          raw = localStorage.getItem(LEGACY_KEY);
          if (raw) {
            try {
              const arr = JSON.parse(raw);
              this.items = Array.isArray(arr) ? arr.map(x => this._normalize(x)) : [];
              this._save();
            } catch (e) { this.items = []; }
            return;
          }
        }
        this.items = raw ? JSON.parse(raw) : [];
        this.items = this.items.map(x => this._normalize(x));
        const s = localStorage.getItem(SETTINGS_KEY);
        if (s) this.settings = Object.assign(this.settings, JSON.parse(s));
      } catch (e) {
        console.warn('Load failed', e);
        this.items = [];
      }
    }

    _save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
      } catch (e) { console.error('Save failed', e); }
    }

    _setupCrossTab() {
      if ('BroadcastChannel' in global) {
        this.bc = new BroadcastChannel('works-sync');
        this.bc.onmessage = (e) => {
          if (e.data && e.data.type === 'update') {
            this._load();
            this.dispatchEvent(new CustomEvent('change', { detail: { source: 'remote' } }));
          }
        };
      }
      global.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY || e.key === SETTINGS_KEY || e.key === LEGACY_KEY) {
          this._load();
          this.dispatchEvent(new CustomEvent('change', { detail: { source: 'remote' } }));
        }
      });
    }

    _emit(source='local') {
      this._save();
      this.dispatchEvent(new CustomEvent('change', { detail: { source } }));
      if (this.bc && source === 'local') {
        try { this.bc.postMessage({ type: 'update' }); } catch (e) {}
      }
    }

    list() { return this.items.slice(); }
    get(id) { return this.items.find(i => i.id === id); }

    add(data) {
      const now = Date.now();
      const base = {
        id: (global.Utils && Utils.uid()) || ('id_' + now + '_' + Math.random().toString(36).slice(2,7)),
        title: 'بدون عنوان',
        description: '',
        category: '',
        tags: [],
        links: [],
        done: false,
        timeType: 'single',
        date: '',
        endDate: '',
        time: '',
        isDeadline: false,
        createdAt: now,
        updatedAt: now
      };
      const item = this._normalize(Object.assign(base, data));
      this.items.push(item);
      this._emit();
      return item;
    }

    update(id, patch) {
      const i = this.items.findIndex(x => x.id === id);
      if (i === -1) return null;
      const merged = this._normalize(Object.assign({}, this.items[i], patch, { updatedAt: Date.now() }));
      this.items[i] = merged;
      this._emit();
      return merged;
    }

    remove(id) {
      const before = this.items.length;
      this.items = this.items.filter(x => x.id !== id);
      if (this.items.length !== before) this._emit();
    }
    removeMany(ids) {
      const set = new Set(ids);
      const before = this.items.length;
      this.items = this.items.filter(x => !set.has(x.id));
      if (this.items.length !== before) this._emit();
    }
    updateMany(ids, patch) {
      const set = new Set(ids);
      const now = Date.now();
      let changed = false;
      this.items.forEach(it => {
        if (set.has(it.id)) {
          const merged = this._normalize(Object.assign({}, it, patch, { updatedAt: now }));
          Object.keys(merged).forEach(k => { it[k] = merged[k]; });
          changed = true;
        }
      });
      if (changed) this._emit();
    }
    replaceAll(items) {
      this.items = Array.isArray(items) ? items.map(x => this._normalize(x)) : [];
      this._emit();
    }
    mergeAll(items) {
      const map = new Map(this.items.map(i => [i.id, i]));
      (items || []).forEach(incoming => {
        if (!incoming || !incoming.id) return;
        const normalized = this._normalize(incoming);
        const existing = map.get(normalized.id);
        if (!existing || (normalized.updatedAt || 0) > (existing.updatedAt || 0)) {
          map.set(normalized.id, normalized);
        }
      });
      this.items = Array.from(map.values());
      this._emit();
    }
    clearAll() { this.items = []; this._emit(); }
    getSettings() { return Object.assign({}, this.settings); }
    saveSettings(patch) { this.settings = Object.assign({}, this.settings, patch); this._save(); }
    markFtuxSeen() {
      if (!this.settings.ftuxSeen) {
        this.settings.ftuxSeen = true;
        this._save();
      }
    }
  }

  global.Store = Store;
})(window);
