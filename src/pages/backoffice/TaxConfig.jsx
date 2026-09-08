import { useEffect, useState } from 'react';
import { getTaxClasses, createTaxClass, createTaxRate, deleteTaxRate } from '../../api/backoffice.api';

const inputCls   = 'w-full bg-slate-900/60 border border-slate-800 focus:border-amber-500 rounded-lg text-slate-200 placeholder-slate-500 outline-none px-3 py-2 text-sm transition-all duration-300';
const labelCls   = 'mb-1 block text-xs font-semibold text-slate-400 uppercase tracking-wider';
const errorCls   = 'mt-1 text-xs text-red-400';
const sectionCls = 'bg-slate-900/40 border border-slate-800 rounded-xl p-5';

export default function TaxConfig() {
  const [classes, setClasses]       = useState([]);
  const [className, setClassName]   = useState('');
  const [classDesc, setClassDesc]   = useState('');
  const [classError, setClassError] = useState('');

  const [selClass, setSelClass]     = useState('');
  const [rateName, setRateName]     = useState('');
  const [ratePct, setRatePct]       = useState('');
  const [rateError, setRateError]   = useState('');
  const [msg, setMsg]               = useState('');

  const load = () => getTaxClasses().then(setClasses).catch(err => console.error('Tax load error', err));
  useEffect(() => { load(); }, []);

  const onAddClass = async () => {
    if (!className.trim()) { setClassError('Class name is required'); return; }
    setClassError('');
    try {
      await createTaxClass({ name: className.trim(), description: classDesc.trim() });
      setClassName(''); setClassDesc(''); setMsg('Tax class added'); load();
    } catch (err) { setClassError(err.response?.data?.error || 'Failed to create class'); }
  };

  const onAddRate = async () => {
    if (!selClass) { setRateError('Select a tax class first'); return; }
    if (!rateName.trim()) { setRateError('Rate name is required'); return; }
    if (!ratePct || Number(ratePct) < 0) { setRateError('Enter a valid percentage'); return; }
    setRateError('');
    try {
      await createTaxRate({ taxClassId: Number(selClass), name: rateName.trim(), percentage: Number(ratePct) });
      setRateName(''); setRatePct(''); setMsg('Tax rate added'); load();
    } catch (err) { setRateError(err.response?.data?.error || 'Failed to add rate'); }
  };

  const onDeleteRate = async (id) => {
    await deleteTaxRate(id);
    load();
  };

  return (
    <div className="space-y-6 p-2">
      {msg && (
        <div className="flex items-center justify-between rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-400">
          {msg}
          <button onClick={() => setMsg('')} className="text-green-500 hover:text-green-400 ml-4">✕</button>
        </div>
      )}

      {/* Create tax class */}
      <section className={sectionCls}>
        <h2 className="mb-4 text-xl font-bold text-slate-100">Tax configuration</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className={labelCls}>Class name</label>
            <input value={className} onChange={e => setClassName(e.target.value)} placeholder="e.g. Standard VAT" className={inputCls} />
            {classError && <p className={errorCls}>{classError}</p>}
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <input value={classDesc} onChange={e => setClassDesc(e.target.value)} placeholder="Optional" className={inputCls} />
          </div>
          <div className="flex items-end">
            <button onClick={onAddClass}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition-all duration-200 shadow-lg shadow-amber-500/10">
              Add class
            </button>
          </div>
        </div>
      </section>

      {/* Add rate */}
      <section className={sectionCls}>
        <h3 className="mb-4 text-lg font-semibold text-slate-200">Add tax rate</h3>
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <label className={labelCls}>Tax class</label>
            <select value={selClass} onChange={e => setSelClass(e.target.value)} className={inputCls}>
              <option value="">Select class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Rate name</label>
            <input value={rateName} onChange={e => setRateName(e.target.value)} placeholder="e.g. CESS" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Percentage</label>
            <input type="number" step="0.01" min="0" value={ratePct} onChange={e => setRatePct(e.target.value)} placeholder="10" className={inputCls} />
          </div>
          <div className="flex items-end">
            <button onClick={onAddRate}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition-all duration-200 shadow-lg shadow-amber-500/10">
              Add rate
            </button>
          </div>
        </div>
        {rateError && <p className={`${errorCls} mt-2`}>{rateError}</p>}
      </section>

      {/* Classes + rates display */}
      <div className="space-y-4">
        {classes.map(cls => (
          <div key={cls.id} className={sectionCls}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-slate-100">{cls.name}</h4>
                {cls.description && <p className="text-xs text-slate-500">{cls.description}</p>}
              </div>
              <span className="text-xs text-slate-500 bg-slate-800/60 border border-slate-700 rounded-full px-2 py-0.5">
                {cls.rates?.length || 0} rates
              </span>
            </div>
            <div className="space-y-1">
              {(cls.rates || []).map(r => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/30 px-3 py-2 text-sm">
                  <span className="text-slate-300">{r.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-amber-400">{r.percentage}%</span>
                    <button onClick={() => onDeleteRate(r.id)} className="text-red-500 hover:text-red-400 text-xs transition-colors">✕</button>
                  </div>
                </div>
              ))}
              {(!cls.rates || cls.rates.length === 0) && (
                <p className="text-xs text-slate-600 px-1">No rates yet — add one above.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
