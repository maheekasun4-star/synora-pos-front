import { useEffect, useMemo, useState } from 'react';
import { posAPI } from '../api/pos.js';

const STAGES = ['new', 'preparing', 'ready', 'cancelled'];
const STAGE_TITLES = {
  new: 'New',
  preparing: 'Preparing',
  ready: 'Ready',
  cancelled: 'Cancelled',
};

const getDefaultBoard = () => ({ new: [], preparing: [], ready: [], cancelled: [] });

const getBadgeClasses = (aging) => {
  switch (aging) {
    case 'warning':
      return 'bg-amber-500/15 text-amber-300 border border-amber-500/30';
    case 'danger':
      return 'bg-rose-500/15 text-rose-300 border border-rose-500/30';
    default:
      return 'bg-slate-700/60 text-slate-300 border border-slate-600';
  }
};

const normalizeOrder = (order) => {
  const stage = order?.kitchenStatus || order?.kitchen_status || 'new';
  const tableName = order?.tableName || order?.table_name || `Table ${order?.tableId || order?.table_id || ''}`.trim() || 'Table';
  return {
    ...order,
    id: Number(order.id),
    tableName,
    kitchenStatus: stage,
    itemSummary: order?.itemSummary || order?.item_summary || 'No items',
    elapsedMinutes: Number(order?.elapsedMinutes ?? 0),
    aging: order?.aging || 'neutral',
  };
};

const groupOrders = (orders = []) => {
  const grouped = getDefaultBoard();
  for (const order of orders) {
    const stage = normalizeOrder(order).kitchenStatus;
    if (grouped[stage]) grouped[stage].push(normalizeOrder(order));
  }
  return grouped;
};

const upsertOrder = (board, incomingOrder) => {
  const order = normalizeOrder(incomingOrder);
  const stage = order.kitchenStatus;
  const nextBoard = { ...board, [stage]: (board[stage] || []).filter((entry) => Number(entry.id) !== Number(order.id)) };
  nextBoard[stage].push(order);
  return nextBoard;
};

export default function KitchenDisplay() {
  const [outlets, setOutlets] = useState([]);
  const [selectedOutletId, setSelectedOutletId] = useState(() => {
    const stored = localStorage.getItem('kds_outlet_id');
    return stored ? Number(stored) : '';
  });
  const [ordersByStage, setOrdersByStage] = useState(getDefaultBoard());
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const loadOutlets = async () => {
    try {
      const res = await posAPI.getOutlets();
      const nextOutlets = res.data || [];
      setOutlets(nextOutlets);
      if (!selectedOutletId && nextOutlets.length === 1) {
        const outletId = nextOutlets[0].id;
        setSelectedOutletId(outletId);
        localStorage.setItem('kds_outlet_id', String(outletId));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchOrders = async (outletId = selectedOutletId) => {
    if (!outletId) return;
    try {
      const res = await posAPI.getKitchenOrders({
        outlet_id: outletId,
        stage: STAGES.join(','),
      });
      setOrdersByStage(groupOrders(res.data || []));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOutlets();
  }, []);

  useEffect(() => {
    if (!selectedOutletId) return;
    localStorage.setItem('kds_outlet_id', String(selectedOutletId));
    fetchOrders(selectedOutletId);
  }, [selectedOutletId]);

  useEffect(() => {
    if (!selectedOutletId || typeof window === 'undefined' || !('EventSource' in window)) return;
    const token = localStorage.getItem('pos_token');
    if (!token) return;

    const stream = new window.EventSource(`/api/pos/kitchen/stream?token=${encodeURIComponent(token)}`);
    const handleStream = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const order = payload?.order || payload;
        if (!order) return;
        setOrdersByStage((current) => upsertOrder(current, order));
      } catch (error) {
        console.error('Kitchen stream update failed', error);
      }
    };

    stream.addEventListener('kitchen-update', handleStream);
    stream.onmessage = handleStream;
    stream.onopen = () => fetchOrders(selectedOutletId);

    return () => {
      stream.close();
    };
  }, [selectedOutletId]);

  const persistReadyNotification = (order, nextStatus) => {
    if (nextStatus !== 'ready') return;
    const tableName = order.tableName || `Table ${order.tableId}`;
    const summary = order.itemSummary || 'order items';
    const notification = {
      id: `${order.id}-${Date.now()}`,
      orderId: order.id,
      tableName,
      itemSummary: summary,
      createdAt: new Date().toISOString(),
      message: `${tableName}: ${summary} is ready`,
    };

    const key = 'pos_kitchen_ready_notifications';
    try {
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const next = [notification, ...existing].slice(0, 20);
      localStorage.setItem(key, JSON.stringify(next));
    } catch (error) {
      console.error('Could not persist ready notification', error);
    }
  };

  const handleStatusChange = async (order, nextStatus) => {
    let reason = '';
    if (nextStatus === 'cancelled') {
      reason = window.prompt('Cancellation reason', '') || '';
      if (!reason.trim()) {
        window.alert('A cancellation reason is required.');
        return;
      }
    }

    setUpdatingId(order.id);
    try {
      const response = await posAPI.updateKitchenOrderStatus(order.id, { status: nextStatus, reason: reason || undefined });
      const updatedOrder = response?.data || order;
      persistReadyNotification(order, nextStatus);
      setOrdersByStage((current) => upsertOrder(current, updatedOrder));
    } catch (error) {
      const apiMessage = error?.response?.data?.error || 'Could not update order status';
      window.alert(apiMessage);
    } finally {
      setUpdatingId(null);
    }
  };

  const getActionLabel = (stage) => {
    switch (stage) {
      case 'new':
        return 'Start preparing';
      case 'preparing':
        return 'Mark ready';
      default:
        return 'Update';
    }
  };

  const getPrimaryAction = (order) => {
    if (order.kitchenStatus === 'new') return () => handleStatusChange(order, 'preparing');
    if (order.kitchenStatus === 'preparing') return () => handleStatusChange(order, 'ready');
    return null;
  };

  const outletName = useMemo(
    () => outlets.find((outlet) => Number(outlet.id) === Number(selectedOutletId))?.name || 'Kitchen display',
    [outlets, selectedOutletId]
  );

  const renderStageColumn = (stage) => {
    const cards = ordersByStage[stage] || [];
    return (
      <div key={stage} className="flex min-h-[420px] min-w-[240px] flex-col rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg shadow-slate-950/20">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{STAGE_TITLES[stage]}</span>
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-800 px-2 text-xs font-bold text-slate-200">
              {cards.length}
            </span>
          </div>
        </div>

        <div className="flex max-h-[calc(100vh-220px)] flex-1 flex-col gap-3 overflow-y-auto p-3">
          {cards.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-700 text-sm text-slate-500">
              No orders
            </div>
          ) : (
            cards.map((order) => {
              const itemLines = (order.itemSummary || '').split(',').map((s) => s.trim()).filter(Boolean);
              const displayItems = itemLines.length > 0 ? itemLines : ['Item ready'];
              const primaryAction = getPrimaryAction(order);
              const ageText = `${order.elapsedMinutes} min`;

              return (
                <div key={order.id} className="rounded-xl border border-slate-700 bg-slate-950/80 p-3 shadow-sm shadow-slate-950/20">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Table</div>
                      <div className="text-lg font-bold text-slate-100">{order.tableName || `#${order.tableId}`}</div>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase ${getBadgeClasses(order.aging)}`}>
                      {ageText}
                    </span>
                  </div>

                  <div className="mb-3 space-y-1">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Items</div>
                    <div className="space-y-1">
                      {displayItems.map((line, index) => (
                        <p key={`${order.id}-${index}`} className="text-sm text-slate-200 break-words">{line}</p>
                      ))}
                    </div>
                  </div>

                  {order.kitchenStatus === 'cancelled' && order.cancelledReason && (
                    <div className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-xs text-rose-200">
                      Reason: {order.cancelledReason}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {primaryAction && (
                      <button
                        type="button"
                        onClick={primaryAction}
                        disabled={updatingId === order.id}
                        className="flex-1 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {updatingId === order.id ? 'Updating…' : getActionLabel(order.kitchenStatus)}
                      </button>
                    )}

                    {order.kitchenStatus !== 'cancelled' && order.kitchenStatus !== 'ready' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(order, 'cancelled')}
                        disabled={updatingId === order.id}
                        className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  if (!selectedOutletId) {
    return (
      <div className="p-6">
        <h1 className="mb-4 text-2xl font-bold text-slate-100">Kitchen display</h1>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <label className="mb-2 block text-sm font-medium text-slate-300">Select outlet</label>
          <select
            value={selectedOutletId}
            onChange={(e) => setSelectedOutletId(Number(e.target.value) || '')}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-0"
          >
            <option value="">Choose an outlet</option>
            {outlets.map((outlet) => (
              <option key={outlet.id} value={outlet.id}>{outlet.name}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Kitchen board</p>
          <h1 className="text-2xl font-bold text-slate-100">{outletName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedOutletId}
            onChange={(e) => setSelectedOutletId(Number(e.target.value) || '')}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
          >
            {outlets.map((outlet) => (
              <option key={outlet.id} value={outlet.id}>{outlet.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => fetchOrders(selectedOutletId)}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:text-slate-100"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400">Loading kitchen board…</div>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-[980px] grid-cols-4 gap-4">
            {STAGES.map(renderStageColumn)}
          </div>
        </div>
      )}
    </div>
  );
}
