import { useEffect, useState } from 'react';
import api from '../../api/pos.js';

const inputCls = 'bg-slate-900/60 border border-slate-800 focus:border-amber-500 rounded-lg text-slate-200 placeholder-slate-500 outline-none px-3 py-2 text-sm transition-all duration-300';
const labelCls = 'mb-1 block text-xs font-semibold text-slate-400 uppercase tracking-wider';
const sectionCls = 'bg-slate-900/40 border border-slate-800 rounded-xl p-5';

export default function OutletConfig() {
  const [outlets, setOutlets] = useState([]);
  const [form, setForm] = useState({ name: '', location: '', description: '', isActive: true });
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    const { data } = await api.get('/pos/backoffice/outlets');
    setOutlets(data);
  };

  useEffect(() => { load().catch(console.error); }, []);

  const resetForm = () => {
    setForm({ name: '', location: '', description: '', isActive: true });
    setEditingId(null);
  };

  const handleSubmit = async () => {
    const name = form.name.trim();
    if (!name) return;

    const payload = {
      name,
      location: form.location.trim(),
      description: form.description.trim(),
      isActive: form.isActive,
    };

    if (editingId) {
      await api.put(`/pos/backoffice/outlets/${editingId}`, payload);
    } else {
      await api.post('/pos/backoffice/outlets', payload);
    }

    resetForm();
    await load();
  };

  const handleEdit = (outlet) => {
    setEditingId(outlet.id);
    setForm({
      name: outlet.name,
      location: outlet.location || '',
      description: outlet.description || '',
      isActive: outlet.isActive !== false,
    });
  };

  const handleDelete = async (id) => {
    await api.delete(`/pos/backoffice/outlets/${id}`);
    if (editingId === id) resetForm();
    await load();
  };

  return (
    <div className="space-y-6 p-2">
      <section className={sectionCls}>
        <h2 className="mb-4 text-xl font-bold text-slate-100">Outlet setup</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className={labelCls}>Outlet name</label>
            <input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Main outlet" />
          </div>
          <div>
            <label className={labelCls}>Location</label>
            <input className={inputCls} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Downtown" />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Description</label>
            <textarea className={`${inputCls} w-full min-h-[90px]`} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description for the outlet" />
          </div>
          <div className="md:col-span-2 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500" />
              Active
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={resetForm} className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-300 hover:border-slate-600">Cancel</button>
              <button type="button" onClick={handleSubmit} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-600">
                {editingId ? 'Update outlet' : 'Add outlet'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className={sectionCls}>
        <h3 className="mb-3 text-lg font-semibold text-slate-200">Configured outlets</h3>
        <div className="space-y-2">
          {outlets.length === 0 && <p className="text-sm text-slate-600">No outlets yet.</p>}
          {outlets.map(outlet => (
            <div key={outlet.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/30 px-3 py-3 text-sm">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-100">{outlet.name}</span>
                  {!outlet.isActive && <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">Inactive</span>}
                </div>
                <div className="mt-1 text-slate-500">{outlet.location || 'No location'} • {outlet.tables?.length || 0} tables</div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => handleEdit(outlet)} className="rounded-lg border border-slate-700 bg-slate-900/70 px-2.5 py-1.5 text-xs text-slate-200 hover:border-slate-600">Edit</button>
                <button type="button" onClick={() => handleDelete(outlet.id)} className="rounded-lg border border-rose-700/50 bg-rose-500/10 px-2.5 py-1.5 text-xs text-rose-300 hover:border-rose-600">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
