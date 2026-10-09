(function (global) {
  'use strict';

  const { Utils } = global;

  class UI {
    constructor(store) {
      this.store = store;
      this.filters = { q: '', category: '', status: '' };
      this.sort = (this.store.getSettings().sort) || 'date-asc';
      this.selected = new Set();
      this._bind();
      this._render();
    }

    _bind() {
      this.store.addEventListener('change', () => this._render());
    }

    _filtered() {
      const { q, category, status } = this.filters;
      const ql = q.toLowerCase().trim();
      return this.store.list().filter(it => {
        if (category && it.category !== category) return false;
        if (status === 'active' && it.done) return false;
        if (status === 'done' && !it.done) return false;
        if (ql) {
          const links = (it.links || []).map(l => l.label + ' ' + l.url).join(' ');
          const jalali = Utils.formatJalaliDate(it.date) + ' ' + Utils.formatJalaliShort(it.date);
          const hay = (
            (it.title || '') + ' ' +
            (it.description || '') + ' ' +
            (it.tags || []).join(' ') + ' ' +
            (it.category || '') + ' ' +
            (it.date || '') + ' ' +
            jalali + ' ' +
            links
          ).toLowerCase();
          if (!hay.includes(ql)) return false;
        }
        return true;
      });
    }

    _sorted(items) {
      const sort = this.sort;
      const arr = items.slice();

      const byDone = (a, b) => (a.done === b.done) ? 0 : (a.done ? 1 : -1);

      const byDateAsc = (a, b) => {
        const ad = a.date || '';
        const bd = b.date || '';
        if (ad && bd) return ad < bd ? -1 : (ad > bd ? 1 : 0);
        if (ad && !bd) return -1;
        if (!ad && bd) return 1;
        return 0;
      };

      const byDateDesc = (a, b) => -byDateAsc(a, b);
      const byUpdatedDesc = (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0);
      const byUpdatedAsc = (a, b) => (a.updatedAt || 0) - (b.updatedAt || 0);
      const byTitleAsc = (a, b) =>
        String(a.title || '').localeCompare(String(b.title || ''), 'fa');

      const comparatorMap = {
        'date-asc': (a, b) => {
          const d = byDone(a, b); if (d) return d;
          const c = byDateAsc(a, b); if (c) return c;
          return byUpdatedDesc(a, b);
        },
        'date-desc': (a, b) => {
          const d = byDone(a, b); if (d) return d;
          const c = byDateDesc(a, b); if (c) return c;
          return byUpdatedDesc(a, b);
        },
        'updated-desc': (a, b) => {
          const d = byDone(a, b); if (d) return d;
          return byUpdatedDesc(a, b);
        },
        'updated-asc': (a, b) => {
          const d = byDone(a, b); if (d) return d;
          return byUpdatedAsc(a, b);
        },
        'title-asc': (a, b) => {
          const d = byDone(a, b); if (d) return d;
          return byTitleAsc(a, b);
        }
      };

      return arr.sort(comparatorMap[sort] || comparatorMap['date-asc']);
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
      const items = this._sorted(this._filtered());
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
        '<span class="chip tag"># ' + Utils.escapeHtml(t) + '</span>'
      ).join('');

      const jalali = Utils.formatJalaliDate(it.date);
      const dateChip = jalali
        ? '<span class="chip date" title="' + Utils.escapeHtml(it.date) + '">📅 ' + Utils.escapeHtml(jalali) + '</span>'
        : '';

      const links = (it.links || []).map(l => {
        const safeUrl = Utils.escapeHtml(l.url);
        const safeLabel = Utils.escapeHtml(l.label || l.url);
        return '<a class="chip link" href="' + safeUrl + '" target="_blank" rel="noopener noreferrer" title="' + safeUrl + '">🔗 ' + safeLabel + '</a>';
      }).join('');

      return (
        '<article class="item' + done + sel + '" data-id="' + Utils.escapeHtml(it.id) + '">' +
          '<div class="item-checkbox">' +
            '<input type="checkbox" data-action="select" ' + (this.selected.has(it.id) ? 'checked' : '') + ' title="انتخاب">' +
          '</div>' +
          '<div class="item-main">' +
            '<div class="item-title">' + Utils.escapeHtml(it.title) + '</div>' +
            (it.description ? '<div class="item-desc">' + Utils.escapeHtml(it.description) + '</div>' : '') +
            '<div class="item-meta">' +
              (it.category ? '<span class="chip category">🏷️ ' + Utils.escapeHtml(it.category) + '</span>' : '') +
              dateChip +
              tags +
              links +
            '</div>' +
          '</div>' +
          '<div class="item-actions">' +
            '<button class="icon-btn" data-action="toggle" title="' + (it.done ? 'بازگرداندن به فعال' : 'علامت‌گذاری به‌عنوان انجام‌شده') + '">' + (it.done ? '↺' : '✓') + '</button>' +
            '<button class="icon-btn" data-action="edit" title="ویرایش">✎</button>' +
            '<button class="icon-btn" data-action="delete" title="حذف">🗑</button>' +
          '</div>' +
        '</article>'
      );
    }

    _renderCategories() {
      const sel = document.getElementById('categoryFilter');
      const current = this.filters.category;
      const cats = Array.from(new Set(
        this.store.list().map(i => i.category).filter(Boolean)
      )).sort((a, b) => a.localeCompare(b, 'fa'));
      sel.innerHTML = '<option value="">همه دسته‌ها</option>' +
        cats.map(c => '<option value="' + Utils.escapeHtml(c) + '"' + (c === current ? ' selected' : '') + '>' + Utils.escapeHtml(c) + '</option>').join('');
    }

    _renderStats() {
      const all = this.store.list();
      const done = all.filter(i => i.done).length;
      const active = all.length - done;
      document.getElementById('stats').innerHTML =
        '<div class="stat"><span>کل</span><strong>' + Utils.toPersianDigits(all.length) + '</strong></div>' +
        '<div class="stat"><span>فعال</span><strong>' + Utils.toPersianDigits(active) + '</strong></div>' +
        '<div class="stat"><span>انجام‌شده</span><strong>' + Utils.toPersianDigits(done) + '</strong></div>';
    }

    _renderBulkBar() {
      const bar = document.getElementById('bulkBar');
      if (this.selected.size === 0) { bar.hidden = true; return; }
      bar.hidden = false;
      document.getElementById('selectedCount').textContent =
        Utils.toPersianDigits(this.selected.size) + ' انتخاب‌شده';
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
        if (confirm('این کار حذف شود؟')) this.store.remove(id);
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

    setSort(sort) {
      this.sort = sort;
      this.store.saveSettings({ sort: sort });
      this._render();
    }
  }

  global.UI = UI;
})(window);
