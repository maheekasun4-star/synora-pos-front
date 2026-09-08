import { useEffect, useState } from 'react';
import { posAPI } from '../api/pos.js';

export default function POSSetup() {
  const [tab, setTab] = useState('outlets');
  const [outlets, setOutlets]     = useState([]);
  const [newOutlet, setNewOutlet] = useState({ name: '', location: '' });
  const [tables, setTables]       = useState([]);
  const [selOutlet, setSelOutlet] = useState('');
  const [newTable, setNewTable]   = useState({ name: '', seats: 4, outletId: '' });
  const [waiters, setWaiters]     = useState([]);
  const [newWaiter, setNewWaiter] = useState({ name: '', code: '' });
  const [periods, setPeriods]     = useState([]);
  const [newPeriod, setNewPeriod] = useState({ name: '', fromTime: '', toTime: '' });

  useEffect(() => {
    posAPI.getOutlets().then(r => setOutlets(r.data)).catch(console.error);
    posAPI.getWaiters().then(r => setWaiters(r.data)).catch(console.error);
    posAPI.getMealPeriods().then(r => setPeriods(r.data)).catch(console.error);
  }, []);

  const loadTables = (outletId) => {
    setSelOutlet(outletId);
    setNewTable(t => ({ ...t, outletId }));
    posAPI.getTables(outletId).then(r => setTables(r.data)).catch(console.error);
  };

  const addOutlet = async () => {
    if (!newOutlet.name) return;
    await posAPI.createOutlet(newOutlet);
    const r = await posAPI.getOutlets();
    setOutlets(r.data);
    setNewOutlet({ name: '', location: '' });
  };

  const addTable = async () => {
    if (!newTable.name || !newTable.outletId) return;
    await posAPI.createTable(newTable);
    loadTables(newTable.outletId);
    setNewTable(t => ({ ...t, name: '', seats: 4 }));
  };

  const addWaiter = async () => {
    if (!newWaiter.name || !newWaiter.code) return;
    const { data } = await posAPI.createWaiter(newWaiter);
    setWaiters(w => [...w, data]);
    setNewWaiter({ name: '', code: '' });
  };

  const addPeriod = async () => {
    if (!newPeriod.name || !newPeriod.fromTime || !newPeriod.toTime) return;
    const { data } = await posAPI.createMealPeriod(newPeriod);
    setPeriods(p => [...p, data]);
    setNewPeriod({ name: '', fromTime: '', toTime: '' });
  };

  const TABS = [
    { key: 'outlets', label: 'Outlets' },
    { key: 'tables',  label: 'Tables' },
    { key: 'waiters', label: 'Waiters' },
    { key: 'periods', label: 'Meal Periods' },
  ];

  const inputCls = 'bg-slate-900/60 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 placeholder-slate-500 outline-none px-3 py-2 text-sm transition-all duration-300';
  const btnCls   = 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-4 py-2 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-amber-500/10';
  const cardCls  = 'bg-slate-900/40 border border-slate-800 rounded-xl divide-y divide-slate-800';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-100 mb-6">Setup</h1>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-slate-800">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Outlets */}
      {tab === 'outlets' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input placeholder="Outlet name"  value={newOutlet.name}     onChange={e => setNewOutlet(o => ({ ...o, name: e.target.value }))}     className={`${inputCls} flex-1`} />
            <input placeholder="Location"     value={newOutlet.location} onChange={e => setNewOutlet(o => ({ ...o, location: e.target.value }))} className={`${inputCls} flex-1`} />
            <button onClick={addOutlet} className={btnCls}>Add</button>
          </div>
          <div className={cardCls}>
            {outlets.map(o => (
              <div key={o.id} className="flex justify-between items-center px-4 py-3 text-sm">
                <div>
                  <div className="font-medium text-slate-200">{o.name}</div>
                  <div className="text-slate-500 text-xs">{o.location}</div>
                </div>
                <span className="text-slate-500">{o._count?.tables || 0} tables</span>
              </div>
            ))}
            {outlets.length === 0 && <div className="p-4 text-slate-600 text-sm">No outlets yet.</div>}
          </div>
        </div>
      )}

      {/* Tables */}
      {tab === 'tables' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <select value={selOutlet} onChange={e => loadTables(e.target.value)} className={inputCls}>
              <option value="">Select outlet…</option>
              {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <input placeholder="Table name" value={newTable.name}  onChange={e => setNewTable(t => ({ ...t, name: e.target.value }))}            className={`${inputCls} flex-1`} />
            <input type="number" placeholder="Seats" value={newTable.seats} onChange={e => setNewTable(t => ({ ...t, seats: Number(e.target.value) }))} className={`${inputCls} w-20`} min={1} />
            <button onClick={addTable} className={btnCls}>Add</button>
          </div>
          <div className={cardCls}>
            {tables.map(t => (
              <div key={t.id} className="flex justify-between items-center px-4 py-3 text-sm">
                <div className="font-medium text-slate-200">{t.name}</div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-500">{t.seats} seats</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    t.status === 'free'
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>{t.status}</span>
                </div>
              </div>
            ))}
            {tables.length === 0 && <div className="p-4 text-slate-600 text-sm">{selOutlet ? 'No tables for this outlet.' : 'Select an outlet.'}</div>}
          </div>
        </div>
      )}

      {/* Waiters */}
      {tab === 'waiters' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input placeholder="Waiter code" value={newWaiter.code} onChange={e => setNewWaiter(w => ({ ...w, code: e.target.value }))} className={`${inputCls} w-32`} />
            <input placeholder="Waiter name" value={newWaiter.name} onChange={e => setNewWaiter(w => ({ ...w, name: e.target.value }))} className={`${inputCls} flex-1`} />
            <button onClick={addWaiter} className={btnCls}>Add</button>
          </div>
          <div className={cardCls}>
            {waiters.map(w => (
              <div key={w.id} className="flex gap-4 px-4 py-3 text-sm">
                <span className="font-mono text-slate-500">{w.code}</span>
                <span className="text-slate-200">{w.name}</span>
              </div>
            ))}
            {waiters.length === 0 && <div className="p-4 text-slate-600 text-sm">No waiters yet.</div>}
          </div>
        </div>
      )}

      {/* Meal Periods */}
      {tab === 'periods' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input placeholder="Period name" value={newPeriod.name}     onChange={e => setNewPeriod(p => ({ ...p, name: e.target.value }))}     className={`${inputCls} flex-1`} />
            <input type="time" value={newPeriod.fromTime}               onChange={e => setNewPeriod(p => ({ ...p, fromTime: e.target.value }))} className={inputCls} />
            <input type="time" value={newPeriod.toTime}                 onChange={e => setNewPeriod(p => ({ ...p, toTime: e.target.value }))}   className={inputCls} />
            <button onClick={addPeriod} className={btnCls}>Add</button>
          </div>
          <div className={cardCls}>
            {periods.map(p => (
              <div key={p.id} className="flex justify-between px-4 py-3 text-sm">
                <span className="font-medium text-slate-200">{p.name}</span>
                <span className="text-slate-500">{p.fromTime} – {p.toTime}</span>
              </div>
            ))}
            {periods.length === 0 && <div className="p-4 text-slate-600 text-sm">No meal periods yet.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
