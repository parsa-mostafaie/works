(function (global) {
  'use strict';

  class CloudSync {
    constructor(store) {
      this.store = store;
      this.status = 'idle';
      this._listeners = new Set();
    }

    onStatus(cb) { this._listeners.add(cb); return () => this._listeners.delete(cb); }
    _setStatus(s, msg) {
      this.status = s;
      this._listeners.forEach(cb => { try { cb(s, msg || ''); } catch (e) {} });
    }

    _headers() {
      const { syncKey } = this.store.getSettings();
      return {
        'Content-Type': 'application/json',
        'X-Master-Key': syncKey || '',
        'X-Bin-Meta': 'false'
      };
    }

    async pull() {
      const { syncUrl } = this.store.getSettings();
      if (!syncUrl) throw new Error('No sync URL configured');
      this._setStatus('syncing', 'Pulling...');
      const res = await fetch(syncUrl, { headers: this._headers() });
      if (!res.ok) throw new Error('Pull failed: ' + res.status);
      const data = await res.json();
      let items = [];
      if (Array.isArray(data)) items = data;
      else if (Array.isArray(data.record)) items = data.record;
      else if (Array.isArray(data.items)) items = data.items;
      else if (data.record && Array.isArray(data.record.items)) items = data.record.items;
      return items;
    }

    async push() {
      const { syncUrl } = this.store.getSettings();
      if (!syncUrl) throw new Error('No sync URL configured');
      this._setStatus('syncing', 'Pushing...');
      const res = await fetch(syncUrl, {
        method: 'PUT',
        headers: this._headers(),
        body: JSON.stringify(this.store.list())
      });
      if (!res.ok) throw new Error('Push failed: ' + res.status);
      return true;
    }

    async sync() {
      try {
        const remote = await this.pull();
        this.store.mergeAll(remote);
        await this.push();
        this._setStatus('idle', 'Synced ' + new Date().toLocaleTimeString());
        return true;
      } catch (e) {
        this._setStatus('error', e.message);
        throw e;
      }
    }
  }

  global.CloudSync = CloudSync;
})(window);
