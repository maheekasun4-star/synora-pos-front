import { useEffect, useState } from 'react';
import api from '../../api/pos.js';
import { deleteMenuCategory, deleteMenuItem } from '../../api/backoffice.api';
import MenuItemForm from './MenuItemForm.jsx';

const emptyForm = { name: '', parentId: '', level: 1, sortOrder: 0 };

const inputCls  = 'bg-slate-900/60 border border-slate-800 focus:border-amber-500 rounded-lg text-slate-200 placeholder-slate-500 outline-none px-3 py-2 text-sm transition-all duration-300';
const btnCls    = 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition-all duration-200 shadow-lg shadow-amber-500/10';
const sectionCls = 'bg-slate-900/40 border border-slate-800 rounded-xl p-5';

const levelLabel = (level) => {
  if (level === 1) return 'Major group';
  if (level === 2) return 'Master group';
  return 'Family group';
};

export default function MenuConfig() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const parentOptions = categories.filter(cat => Number(cat.level) === Number(form.level) - 1);
  const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
  const getCategoryPath = (cat) => {
    if (!cat) return '';
    if (!cat.parentId) return cat.name;
    const parent = categoryMap.get(cat.parentId);
    return parent ? `${getCategoryPath(parent)} / ${cat.name}` : cat.name;
  };

  const load = async () => {
    const [catRes, itemRes] = await Promise.all([
      api.get('/pos/backoffice/categories'),
      api.get('/pos/backoffice/menu-items'),
    ]);
    setCategories(catRes.data);
    setItems(itemRes.data);
  };

  useEffect(() => { load().catch(console.error); }, []);

  const onCreateCategory = async () => {
    if (!form.name.trim()) return;
    if (Number(form.level) > 1 && !form.parentId) {
      alert(`Select a ${levelLabel(Number(form.level) - 1)} before adding this ${levelLabel(Number(form.level)).toLowerCase()}.`);
      return;
    }

    await api.post('/pos/backoffice/categories', {
      ...form,
      name: form.name.trim(),
      parentId: Number(form.level) > 1 ? form.parentId : null,
      level: Number(form.level),
      sortOrder: Number(form.sortOrder),
    });
    setForm(emptyForm);
    load();
  };

  const onDeleteCategory = async (id) => {
    if (!window.confirm('Remove this category from the menu?')) return;
    try {
      await deleteMenuCategory(id);
      await load();
    } catch (err) {
      console.error('Failed to delete category', err);
      alert(err.response?.data?.error || 'Unable to remove category');
    }
  };

  const onDeleteItem = async (id) => {
    if (!window.confirm('Remove this menu item?')) return;
    try {
      await deleteMenuItem(id);
      await load();
    } catch (err) {
      console.error('Failed to delete menu item', err);
      alert(err.response?.data?.error || 'Unable to remove item');
    }
  };

  const handleLevelChange = (nextLevel) => {
    const level = Number(nextLevel);
    setForm(f => ({
      ...f,
      level,
      parentId: level <= 1 || Number(f.level) !== level ? '' : f.parentId,
    }));
  };

  return (
    <div className="space-y-6 p-2">
      <section className={sectionCls}>
        <h2 className="mb-4 text-xl font-bold text-slate-100">Menu configuration</h2>
        <div className="grid gap-3 md:grid-cols-5">
          <input className={inputCls} placeholder="Category name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
          <select className={inputCls} value={form.level} onChange={(e) => handleLevelChange(e.target.value)}>
            <option value={1}>Level 1 — Major</option>
            <option value={2}>Level 2 — Master</option>
            <option value={3}>Level 3 — Family</option>
          </select>
          {Number(form.level) > 1 && (
            <select className={inputCls} value={form.parentId} onChange={(e) => setForm(f => ({ ...f, parentId: e.target.value }))}>
              <option value="">Select {levelLabel(Number(form.level) - 1)}</option>
              {parentOptions.map(cat => (
                <option key={cat.id} value={cat.id}>{getCategoryPath(cat)}</option>
              ))}
            </select>
          )}
          <input className={inputCls} type="number" placeholder="Sort order" value={form.sortOrder} onChange={(e) => setForm(f => ({ ...f, sortOrder: e.target.value }))} />
          <button type="button" onClick={onCreateCategory} className={btnCls}>Add category</button>
        </div>
      </section>

      <MenuItemForm onSaved={load} />

      <section className="grid gap-6 lg:grid-cols-2">
        <div className={sectionCls}>
          <h3 className="mb-3 text-lg font-semibold text-slate-200">Categories</h3>
          <div className="space-y-2">
            {categories.length === 0 && <p className="text-sm text-slate-600">No categories yet.</p>}
            {categories.filter(cat => cat.isActive !== false).map(cat => (
              <div key={cat.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-800/30 px-3 py-2 text-sm">
                <div>
                  <span className="text-slate-200">{cat.name}</span>
                  <div className="text-slate-500">Level {cat.level}</div>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteCategory(cat.id)}
                  className="rounded border border-red-500/60 px-2 py-1 text-xs font-medium text-red-300 hover:bg-red-500/10"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className={sectionCls}>
          <h3 className="mb-3 text-lg font-semibold text-slate-200">Menu items</h3>
          <div className="space-y-2">
            {items.length === 0 && <p className="text-sm text-slate-600">No menu items yet.</p>}
            {items.filter(item => item.isActive !== false).map(item => (
              <div key={item.id} className="rounded-lg border border-slate-800 bg-slate-800/30 px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-200">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-semibold">{item.defaultRate}</span>
                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      className="rounded border border-red-500/60 px-2 py-1 text-[10px] font-medium text-red-300 hover:bg-red-500/10"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{item.category?.name || 'Uncategorized'}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
