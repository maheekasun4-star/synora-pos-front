import { useEffect, useState } from 'react';
import { posAPI } from '../api/pos.js';

export default function POSReports() {
  const [date, setDate]       = useState(new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState(null);
  const [voids, setVoids]     = useState([]);
  const [periods, setPeriods] = useState({});
  const [payments, setPayments] = useState({});
  const [loading, setLoading] = useState(false);
  const [tab, setTab]         = useState('sales');

  const load = async () => {
    setLoading(true);
    try {
      const [s, v, mp, pb] = await Promise.all([
        posAPI.getSalesSummary({ date }),
        posAPI.getVoidLog({ date }),
        posAPI.getMealPeriodSummary({ date }),
        posAPI.getPaymentBreakdown({ date }),
      ]);
      setSummary(s.data);
      setVoids(v.data);
      setPeriods(mp.data);
      setPayments(pb.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [date]);

  const tabs = [
    { key: 'sales',   label: 'Sales Summary' },
    { key: 'voids',   label: 'Void Log' },
    { key: 'periods', label: 'Meal Periods' },
    { key: 'payment', label: 'Payments' },
  ];

  const cardCls  = 'glass-card rounded-xl p-5';
  const thCls    = 'text-left text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800 pb-2';
  const tdCls    = 'py-2 text-slate-300';
  const emptyMsg = (msg) => <p className="text-slate-600 text-sm">{msg}</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Reports</h1>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="bg-slate-900/60 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 outline-none px-3 py-2 text-sm transition-all duration-300"
          />
          <button
            onClick={load}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-4 py-2 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-amber-500/10"
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-slate-800">
        {tabs.map(t => (
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

      {/* Sales Summary */}
      {tab === 'sales' && summary && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Orders',      value: summary.totalOrders, fmt: v => v },
              { label: 'Subtotal',    value: summary.subtotal,    fmt: v => v.toFixed(2) },
              { label: 'Tax',         value: summary.taxTotal,    fmt: v => v.toFixed(2) },
              { label: 'Grand Total', value: summary.grandTotal,  fmt: v => v.toFixed(2) },
            ].map(card => (
              <div key={card.label} className={cardCls}>
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">{card.label}</div>
                <div className="text-2xl font-bold text-amber-400">{card.fmt(card.value)}</div>
              </div>
            ))}
          </div>

          {Object.keys(summary.byOutlet).length > 0 && (
            <div className={cardCls}>
              <h3 className="font-semibold mb-3 text-slate-300">By Outlet</h3>
              <table className="w-full text-sm">
                <thead><tr><th className={thCls}>Outlet</th><th className={thCls}>Orders</th><th className={`${thCls} text-right`}>Total</th></tr></thead>
                <tbody>
                  {Object.entries(summary.byOutlet).map(([name, d]) => (
                    <tr key={name} className="border-b border-slate-800/50 last:border-0">
                      <td className={tdCls}>{name}</td>
                      <td className={tdCls}>{d.orders}</td>
                      <td className="py-2 text-right font-medium text-slate-200">{d.grandTotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Void Log */}
      {tab === 'voids' && (
        <div className={cardCls}>
          {voids.length === 0 ? emptyMsg('No voids for this date.') : (
            <table className="w-full text-sm">
              <thead><tr>
                <th className={thCls}>Time</th><th className={thCls}>Item</th>
                <th className={thCls}>Qty</th><th className={thCls}>Table</th><th className={thCls}>Reason</th>
              </tr></thead>
              <tbody>
                {voids.map(v => (
                  <tr key={v.id} className="border-b border-slate-800/50 last:border-0">
                    <td className={tdCls}>{new Date(v.voidedAt).toLocaleTimeString()}</td>
                    <td className={tdCls}>{v.orderItem?.menuItem?.name}</td>
                    <td className={tdCls}>{v.qty}</td>
                    <td className={tdCls}>{v.orderItem?.order?.table?.name}</td>
                    <td className="py-2 text-slate-500">{v.voidReason?.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Meal Periods */}
      {tab === 'periods' && (
        <div className={cardCls}>
          {Object.keys(periods).length === 0 ? emptyMsg('No data for this date.') : (
            <table className="w-full text-sm">
              <thead><tr>
                <th className={thCls}>Period</th><th className={thCls}>Orders</th><th className={`${thCls} text-right`}>Total</th>
              </tr></thead>
              <tbody>
                {Object.entries(periods).map(([name, d]) => (
                  <tr key={name} className="border-b border-slate-800/50 last:border-0">
                    <td className="py-2 font-medium text-slate-200">{name}</td>
                    <td className={tdCls}>{d.orders}</td>
                    <td className="py-2 text-right text-slate-300">{d.grandTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Payment Breakdown */}
      {tab === 'payment' && payments.breakdown && (
        <div className={cardCls}>
          <table className="w-full text-sm mb-4">
            <thead><tr>
              <th className={thCls}>Method</th><th className={`${thCls} text-right`}>Amount</th>
            </tr></thead>
            <tbody>
              {Object.entries(payments.breakdown).map(([method, amt]) => (
                <tr key={method} className="border-b border-slate-800/50 last:border-0">
                  <td className="py-2 capitalize text-slate-300">{method.replace('_', ' ')}</td>
                  <td className="py-2 text-right font-medium text-slate-200">{Number(amt).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
