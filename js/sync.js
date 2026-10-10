(function (global) {
  'use strict';

  const GIST_FILENAME = 'works.json';
  const GIST_API = 'https://api.github.com/gists';

  class CloudSync {
    constructor(store) {
      this.store = store;
      this.status = 'idle';
      this._listeners = new Set();
      this._lastGistId = '';
    }
    onStatus(cb) { this._listeners.add(cb); return () => this._listeners.delete(cb); }
    _setStatus(s, msg) { this.status = s; this._listeners.forEach(cb => { try { cb(s, msg || ''); } catch (e) {} }); }
    _token() { return (this.store.getSettings().syncKey || '').trim(); }
    _gistId() {
      const raw = (this.store.getSettings().syncUrl || '').trim();
      if (!raw) return '';
      const m = raw.match(/gist\.github\.com\/(?:[^/]+\/)?([a-f0-9]+)/i);
      if (m) return m[1];
      const cleaned = raw.split(/[?#]/)[0].trim();
      if (/^[a-f0-9]{16,}$/i.test(cleaned)) return cleaned;
      return cleaned;
    }
    _headers(extra) {
      const token = this._token();
      const h = Object.assign({
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }, extra || {});
      if (token) h['Authorization'] = 'Bearer ' + token;
      return h;
    }
    hasConfig() { return !!(this._gistId() && this._token()); }

    async testConnection() {
      const gistId = this._gistId();
      const token = this._token();
      if (!gistId) throw new Error('شناسه Gist الزامی است');
      if (!token) throw new Error('توکن GitHub الزامی است');
      this._setStatus('syncing', 'در حال آزمایش اتصال…');
      const res = await fetch(GIST_API + '/' + gistId, { headers: this._headers() });
      if (res.status === 401) throw new Error('توکن نامعتبر است (۴۰۱)');
      if (res.status === 403) throw new Error('توکن دسترسی gist ندارد (۴۰۳)');
      if (res.status === 404) throw new Error('Gist پیدا نشد (۴۰۴)');
      if (!res.ok) throw new Error('خطای HTTP ' + res.status);
      const data = await res.json();
      this._lastGistId = data.id || gistId;
      this._setStatus('idle', 'اتصال برقرار است');
      return {
        id: data.id || gistId,
        files: Object.keys(data.files || {}),
        hasWorksFile: !!(data.files && data.files[GIST_FILENAME]),
        updatedAt: data.updated_at || null
      };
    }

    async pull() {
      const gistId = this._gistId();
      if (!gistId) throw new Error('شناسه Gist تنظیم نشده');
      this._setStatus('syncing', 'در حال دریافت…');
      const res = await fetch(GIST_API + '/' + gistId, { headers: this._headers() });
      if (!res.ok) throw new Error('دریافت ناموفق: ' + res.status);
      const data = await res.json();
      const file = data.files && data.files[GIST_FILENAME];
      if (!file) return [];
      const content = file.content || '';
      if (!content.trim()) return [];
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && Array.isArray(parsed.items)) return parsed.items;
        return [];
      } catch (e) { throw new Error('محتوای Gist JSON معتبر نیست'); }
    }

    async push() {
      const gistId = this._gistId();
      if (!gistId) throw new Error('شناسه Gist تنظیم نشده');
      this._setStatus('syncing', 'در حال ارسال…');
      const body = { files: {} };
      body.files[GIST_FILENAME] = { content: JSON.stringify(this.store.list(), null, 2) };
      const res = await fetch(GIST_API + '/' + gistId, {
        method: 'PATCH',
        headers: this._headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('ارسال ناموفق: ' + res.status);
      return true;
    }

    async sync() {
      try {
        const remote = await this.pull();
        this.store.mergeAll(remote);
        await this.push();
        const t = new Date().toLocaleTimeString('fa-IR');
        this._setStatus('idle', 'همگام‌سازی‌شده در ' + t);
        return true;
      } catch (e) { this._setStatus('error', e.message); throw e; }
    }
  }

  global.CloudSync = CloudSync;
})(window);
