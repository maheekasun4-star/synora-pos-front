import { useEffect, useState } from 'react';
import { getPrinterStations } from '../../api/backoffice.api';
import PrinterStationForm from './PrinterStationForm.jsx';

const sectionCls = 'bg-slate-900/40 border border-slate-800 rounded-xl p-5';

export default function PrinterConfig() {
  const [stations, setStations] = useState([]);
  const load = () => getPrinterStations().then(setStations).catch(console.error);
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6 p-2">
      <PrinterStationForm onSaved={load} />
      <section className={sectionCls}>
        <h3 className="mb-3 text-lg font-semibold text-slate-200">Printer stations</h3>
        <div className="space-y-2">
          {stations.length === 0 && <p className="text-sm text-slate-600">No printer stations yet.</p>}
          {stations.map(s => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/30 px-3 py-2 text-sm">
              <div>
                <span className="font-medium text-slate-200">{s.name}</span>
                <div className="text-xs text-slate-500">{s.outlet?.name || 'Unknown outlet'}</div>
              </div>
              <span className="text-slate-500 font-mono">{s.printerType === 1 ? 'Bar' : 'Kitchen'}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
