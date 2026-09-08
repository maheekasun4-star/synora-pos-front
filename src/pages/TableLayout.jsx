import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { posAPI } from '../api/pos.js';

const STATUS_STYLES = {
  free:     'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20',
  occupied: 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20',
  reserved: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20',
  cleaning: 'bg-slate-800/60 border-slate-700 text-slate-500',
};

const STATUS_LABEL = {
  free:     '● Free',
  occupied: '● Occupied',
  reserved: '● Reserved',
  cleaning: '● Cleaning',
};

export default function TableLayout() {
  const { outletId } = useParams();
  const navigate = useNavigate();
  const [outlet, setOutlet]   = useState(null);
  const [tables, setTables]   = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    Promise.all([
      posAPI.getOutlets(),
      posAPI.getTables(outletId),
    ]).then(([oRes, tRes]) => {
      setOutlet(oRes.data.find(o => o.id === Number(outletId)));
      setTables(tRes.data);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [outletId]);
  useEffect(() => { const t = setInterval(refresh, 30_000); return () => clearInterval(t); }, [outletId]);

  const handleTableClick = async (table) => {
    if (table.status === 'cleaning') return;
    const activeOrder = table.orders?.[0];
    if (activeOrder) {
      navigate(`/orders/${activeOrder.id}`);
    } else {
      try {
        const { data } = await posAPI.openOrder({ tableId: table.id, outletId: Number(outletId) });
        navigate(`/orders/${data.id}`);
      } catch (err) {
        alert(err.response?.data?.error || 'Could not open order');
      }
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-500">Loading tables…</div>
  );

  const free     = tables.filter(t => t.status === 'free').length;
  const occupied = tables.filter(t => t.status === 'occupied').length;

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{outlet?.name}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {free} free · {occupied} occupied · {tables.length} total
          </p>
        </div>
        <button onClick={refresh} className="text-sm text-amber-400 hover:text-amber-300 transition-colors self-start sm:self-auto">
          ↻ Refresh
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-3 mb-5 text-xs flex-wrap">
        {Object.entries(STATUS_LABEL).map(([s, l]) => (
          <span key={s} className={`px-2.5 py-1 rounded-full border font-medium ${STATUS_STYLES[s]}`}>{l}</span>
        ))}
      </div>

      {/* Table grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {tables.map(table => (
          <button
            key={table.id}
            onClick={() => handleTableClick(table)}
            disabled={table.status === 'cleaning'}
            className={`border-2 rounded-xl p-3 sm:p-4 text-left transition-all ${STATUS_STYLES[table.status]} disabled:cursor-not-allowed min-h-[92px]`}
          >
            <div className="font-semibold text-sm">{table.name}</div>
            <div className="text-xs mt-1 opacity-75">{table.seats} seats</div>
            {table.orders?.[0] && (
              <div className="text-xs mt-1 font-medium">Order #{table.orders[0].id}</div>
            )}
          </button>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="text-center py-16 text-slate-600">
          No tables configured for this outlet.
          <br />
          <a href="/setup" className="text-amber-400 hover:text-amber-300 text-sm mt-2 inline-block">
            Go to Setup →
          </a>
        </div>
      )}
    </div>
  );
}
