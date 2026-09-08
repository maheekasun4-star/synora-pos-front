import { useEffect, useState } from 'react';
import api from '../../api/pos.js';

const inputCls   = 'bg-slate-900/60 border border-slate-800 focus:border-amber-500 rounded-lg text-slate-200 placeholder-slate-500 outline-none px-3 py-2 text-sm transition-all duration-300';
const labelCls   = 'mb-1 block text-xs font-semibold text-slate-400 uppercase tracking-wider';
const sectionCls = 'bg-slate-900/40 border border-slate-800 rounded-xl p-5';

export default function TableConfig() {
  const [outlets, setOutlets] = useState([]);
  const [tables, setTables]   = useState([]);
  const [form, setForm]       = useState({ outletId: '', name: '', seats: 4, status: 'free' });

  const load = async () => {
    const [outRes, tableRes] = await Promise.all([
      api.get('/pos/backoffice/outlets'),
      api.get('/pos/backoffice/tables'),
    ]);
    setOutlets(outRes.data);
    setTables(tableRes.data);
    if (!form.outletId && outRes.data[0]) {
      setForm(f => ({ ...f, outletId: String(outRes.data[0].id) }));
    }
  };

  useEffect(() => { load().catch(console.error); }, []);

  const onCreate = async () => {
    if (!form.outletId || !form.name) return;
    await api.post('/pos/backoffice/tables', {
      ...form, outletId: Number(form.outletId), seats: Number(form.seats),
    });
    setForm(f => ({ ...f, name: '', seats: 4 }));
    load();
  };

  return (
    <div className="space-y-6 p-2">
      <section className={sectionCls}>
        <h2 className="mb-4 text-xl font-bold text-slate-100">Table / outlet setup</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <select className={inputCls} value={form.outletId} onChange={e => setForm(f => ({ ...f, outletId: e.target.value }))}>
            <option value="">Choose outlet</option>
            {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <input className={inputCls} placeholder="Table name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <input type="number" className={inputCls} placeholder="Seats" value={form.seats} onChange={e => setForm(f => ({ ...f, seats: e.target.value }))} />
          <button type="button" onClick={onCreate}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition-all duration-200 shadow-lg shadow-amber-500/10">
            Add table
          </button>
        </div>
      </section>

      <div className={sectionCls}>
        <h3 className="mb-3 text-lg font-semibold text-slate-200">Configured tables</h3>
        <div className="space-y-2">
          {tables.length === 0 && <p className="text-sm text-slate-600">No tables yet.</p>}
          {tables.map(table => (
            <div key={table.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/30 px-3 py-2 text-sm">
              <span className="text-slate-200">{table.name}</span>
              <span className="text-slate-500">{table.outlet?.name || 'Outlet'} • {table.seats} seats</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
