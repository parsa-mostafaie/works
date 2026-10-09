(function (global) {
  'use strict';

  const { Utils } = global;

  class UI {
    constructor(store) {
      this.store = store;
      this.filters = { q: '', category: '', status: '' };
      this.selected = new Set();
      this._bind();
      this._render();
    }

    _bind() {
      this.store.addEventListener('change', () => this._render());
    }

    _filtered() {
      const { q, category, status } = this.filters;
      const ql = q.toLowerCase();
      return this.store.list().filter(it => {
        if (category && it.category !== category) return false;
        if (status === 'active' && it.done) return false;
        if (status === 'done' && !it.done) return false;
        if (ql) {
          const hay = (it.title + ' ' + (it.description || '') + ' ' + (it.tags || []).join(' ')).toLowerCase();
          if (!hay.includes(ql)) return false;
        }
        return true;
      }).sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      });
    }

    _render() {
      this._renderList();
      this._renderCategories();
      this._renderStats();
      this._renderBulkBar();
    }

    _renderList() {
      const list = document.getElementById('list');
      const empty = document.getElementById('empty');
      const items = this._filtered();
      if (!items.length) {
        list.innerHTML = '';
        empty.hidden = false;
        return;
      }
      empty.hidden = true;
      list.innerHTML = items.map(it => this._itemHtml(it)).join('');
    }

    _itemHtml(it) {
      const sel = this.selected.has(it.id) ? ' selected' : '';
      const done = it.done ? ' done' : '';
      const tags = (it.tags || []).map(t =>
        '<span class="chip tag">#' + Utils.escapeHtml(t) + '</span>'
      ).join('');
      return (
        '<article class="item' + done + sel + '" data-id="' + Utils.escapeHtml(it.id) + '">' +
          '<div class="item-checkbox">' +
            '<input type="checkbox" data-action="select" ' + (this.selected.has(it.id) ? 'checked' : '') + '>' +
          '</div>' +
          '<div class="item-main">' +
            '<div class="item-title">' + Utils.escapeHtml(it.title) + '</div>' +
            (it.description ? '<div class="item-desc">' + Utils.escapeHtml(it.description) + '</div>' : '') +
            '<div class="item-meta">' +
              (it.category ? '<span class="chip category">' + Utils.escapeHtml(it.category) + '</span>' : '') +
              (it.date ? '<span class="chip date">📅 ' + Utils.formatDate(it.date) + '</span>' : '') +
              tags +
            '</div>' +
          '</div>' +
          '<div class="item-actions">' +
            '<button class="icon-btn" data-action="toggle" title="Toggle done">' + (it.done ? '↺' : '✓') + '</button>' +
            '<button class="icon-btn" data-action="edit" title="Edit">✎</button>' +
            '<button class="icon-btn" data-action="delete" title="Delete">🗑</button>' +
          '</div>' +
        '</article>'
      );
    }

    _renderCategories() {
      const sel = document.getElementById('categoryFilter');
      const current = this.filters.category;
      const cats = Array.from(new Set(this.store.list().map(i => i.category).filter(Boolean))).sort();
      sel.innerHTML = '<option value="">All Categories</option>' +
        cats.map(c => '<option value="' + Utils.escapeHtml(c) + '"' + (c === current ? ' selected' : '') + '>' + Utils.escapeHtml(c) + '</option>').join('');
    }

    _renderStats() {
      const all = this.store.list();
      const done = all.filter(i => i.done).length;
      const active = all.length - done;
      document.getElementById('stats').innerHTML =
        '<div class="stat"><span>Total</span><strong>' + all.length + '</strong></div>' +
        '<div class="stat"><span>Active</span><strong>' + active + '</strong></div>' +
        '<div class="stat"><span>Done</span><strong>' + done + '</strong></div>';
    }

    _renderBulkBar() {
      const bar = document.getElementById('bulkBar');
      if (this.selected.size === 0) { bar.hidden = true; return; }
      bar.hidden = false;
      document.getElementById('selectedCount').textContent = this.selected.size + ' selected';
    }

    handleListClick(e) {
      const el = e.target.closest('[data-action]');
      if (!el) return;
      const item = e.target.closest('.item');
      if (!item) return;
      const id = item.dataset.id;
      const action = el.dataset.action;
      if (action === 'toggle') this.store.update(id, { done: !this.store.get(id).done });
      else if (action === 'edit') global.App.openEditor(id);
      else if (action === 'delete') {
        if (confirm('Delete this work?')) this.store.remove(id);
      } else if (action === 'select') {
        if (el.checked) this.selected.add(id);
        else this.selected.delete(id);
        this._render();
      }
    }

    setFilter(patch) {
      Object.assign(this.filters, patch);
      this._render();
    }
  }

  global.UI = UI;
})(window);
