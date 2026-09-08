import { useEffect, useState } from 'react';
import { createPrinterStation, getOutlets } from '../../api/backoffice.api';

const inputCls = 'w-full bg-slate-900/60 border border-slate-800 focus:border-amber-500 rounded-lg text-slate-200 placeholder-slate-500 outline-none px-3 py-2 text-sm transition-all duration-300';
const labelCls = 'mb-1 block text-xs font-semibold text-slate-400 uppercase tracking-wider';
const errorCls = 'mt-1 text-xs text-red-400';

const emptyForm = { outletId: '', name: '', ipAddress: '', port: 9100, type: 'kitchen' };

export default function PrinterStationForm({ onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [outlets, setOutlets] = useState([]);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getOutlets()
      .then((data) => {
        setOutlets(data);
        if (data.length > 0 && !form.outletId) {
          setForm((f) => ({ ...f, outletId: String(data[0].id) }));
        }
      })
      .catch(console.error);
  }, []);

  const handleChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(f => ({ ...f, [field]: null }));
    setSaved(false);
  };

  const validate = () => {
    const next = {};
    if (!form.outletId) next.outletId = 'Select an outlet';
    if (!form.name.trim()) next.name = 'Enter a station name';
    if (!form.ipAddress.trim()) next.ipAddress = 'Enter an IP address';
    if (!form.port || Number(form.port) < 1) next.port = 'Enter a valid port number';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      const payload = {
        outletId: Number(form.outletId),
        name: form.name.trim(),
        printerType: form.type === 'bar' ? 1 : 0,
        isActive: true,
      };
      const station = await createPrinterStation(payload);
      setSaved(true);
      onSaved?.(station);
      setForm({ ...emptyForm, outletId: form.outletId });
    } catch (err) {
      setErrors(f => ({ ...f, submit: err.response?.data?.error || 'Failed to save printer station' }));
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
      <h3 className="mb-4 text-lg font-semibold text-slate-200">Add printer station</h3>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={labelCls}>Outlet</label>
          <select value={form.outletId} onChange={handleChange('outletId')} className={inputCls}>
            <option value="">Select outlet</option>
            {outlets.map(outlet => (
              <option key={outlet.id} value={outlet.id}>{outlet.name}</option>
            ))}
          </select>
          {errors.outletId && <p className={errorCls}>{errors.outletId}</p>}
        </div>

        <div>
          <label className={labelCls}>Station name</label>
          <input value={form.name} onChange={handleChange('name')} placeholder="Kitchen KOT Printer" className={inputCls} />
          {errors.name && <p className={errorCls}>{errors.name}</p>}
        </div>

        <div>
          <label className={labelCls}>Station type</label>
          <select value={form.type} onChange={handleChange('type')} className={inputCls}>
            <option value="kitchen">Kitchen</option>
            <option value="bar">Bar</option>
            <option value="billing">Billing</option>
          </select>
        </div>

        <div>
          <label className={labelCls}>IP address</label>
          <input value={form.ipAddress} onChange={handleChange('ipAddress')} placeholder="192.168.1.100" className={inputCls} />
          {errors.ipAddress && <p className={errorCls}>{errors.ipAddress}</p>}
        </div>

        <div className="md:col-span-2">
          <label className={labelCls}>Port</label>
          <input type="number" min="1" max="65535" value={form.port} onChange={handleChange('port')} placeholder="9100" className={inputCls} />
          {errors.port && <p className={errorCls}>{errors.port}</p>}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-3">
        <button type="button" onClick={() => setForm({ ...emptyForm, outletId: form.outletId })}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-all duration-200">
          Reset
        </button>
        <button type="button" onClick={handleSubmit}
          className="rounded-lg bg-amber-500 hover:bg-amber-600 px-4 py-2 text-sm font-semibold text-slate-950 transition-all duration-200 shadow-lg shadow-amber-500/10">
          Save station
        </button>
      </div>

      {errors.submit && <p className="mt-3 text-sm text-red-400">{errors.submit}</p>}
      {saved && <p className="mt-3 text-sm font-medium text-green-400">Printer station saved ✓</p>}
    </div>
  );
}
