import { useEffect, useState } from 'react';
import api from '../../api/pos.js';

const sectionCls = 'bg-slate-900/40 border border-slate-800 rounded-xl p-5';
const inputCls   = 'w-full bg-slate-900/60 border border-slate-800 focus:border-amber-500 rounded-lg text-slate-200 placeholder-slate-500 outline-none px-3 py-2 text-sm transition-all duration-300';
const labelCls   = 'mb-1 block text-xs font-semibold text-slate-400 uppercase tracking-wider';

export default function DiscountConfig() {
  const [discounts, setDiscounts] = useState([]);
  const [form, setForm]           = useState({ name: '', type: 'percent', value: '' });

  const load = () => api.get('/pos/backoffice/discounts').then(r => setDiscounts(r.data)).catch(console.error);
  useEffect(() => { load(); }, []);

  const onAdd = async () => {
    if (!form.name || !form.value) return;
    await api.post('/pos/backoffice/discounts', { ...form, value: Number(form.value) });
    setForm({ name: '', type: 'percent', value: '' });
    load();
  };

  return (
    <div className="space-y-6 p-2">
      <section className={sectionCls}>
        <h2 className="mb-4 text-xl font-bold text-slate-100">Discount configuration</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <label className={labelCls}>Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Staff discount" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inputCls}>
              <option value="percent">Percentage</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Value</label>
            <input type="number" step="0.01" min="0" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder={form.type === 'percent' ? '10' : '500'} className={inputCls} />
          </div>
          <div className="flex items-end">
            <button type="button" onClick={onAdd}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition-all duration-200 shadow-lg shadow-amber-500/10">
              Add discount
            </button>
          </div>
        </div>
      </section>

      <section className={sectionCls}>
        <h3 className="mb-3 text-lg font-semibold text-slate-200">Configured discounts</h3>
        {discounts.length === 0 && <p className="text-sm text-slate-600">No discounts configured yet.</p>}
        <div className="space-y-2">
          {discounts.map(d => (
            <div key={d.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/30 px-3 py-2 text-sm">
              <span className="text-slate-200">{d.name}</span>
              <span className="font-mono text-amber-400">
                {d.value}{d.type === 'percent' ? '%' : ' fixed'}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
