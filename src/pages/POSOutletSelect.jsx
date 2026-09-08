import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { posAPI } from '../api/pos.js';

export default function POSOutletSelect() {
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    posAPI.getOutlets()
      .then(r => {
        if (r.data.length === 1) { navigate(`/outlets/${r.data[0].id}`); return; }
        setOutlets(r.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-500">Loading outlets…</div>
  );

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <h1 className="text-2xl font-bold text-slate-100 mb-2">Select Outlet</h1>
      <p className="text-slate-500 text-sm mb-8">Choose an outlet to start service</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {outlets.map(outlet => (
          <button
            key={outlet.id}
            onClick={() => navigate(`/outlets/${outlet.id}`)}
            className="glass-card rounded-2xl p-5 sm:p-6 text-left hover:border-amber-500/30 transition-all duration-200 group"
          >
            <div className="text-3xl mb-3">🍴</div>
            <div className="font-semibold text-slate-200 group-hover:text-amber-400 transition-colors">{outlet.name}</div>
            <div className="text-sm text-slate-500 mt-1">{outlet.location || ''}</div>
            <div className="text-xs text-slate-600 mt-2">{outlet._count?.tables ?? 0} tables</div>
          </button>
        ))}
      </div>
    </div>
  );
}
