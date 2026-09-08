import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { posAPI } from '../api/pos.js';

/* ── Qty Picker Modal ─────────────────────────────────────── */
function QtyPickerModal({ item, onConfirm, onCancel }) {
  const [qty, setQty] = useState('1');

  const press = (key) => {
    if (key === '⌫') {
      setQty(q => (q.length > 1 ? q.slice(0, -1) : '0'));
    } else if (key === 'C') {
      setQty('0');
    } else {
      setQty(q => {
        const next = q === '0' ? key : q + key;
        return next.length > 3 ? q : next; // max 3 digits
      });
    }
  };

  const confirm = () => {
    const n = parseInt(qty, 10);
    if (n > 0) onConfirm(n);
  };

  const KEYS = ['7','8','9','4','5','6','1','2','3','C','0','⌫'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div className="glass rounded-2xl p-6 w-72 shadow-glass">

        {/* Item name + price */}
        <div className="mb-4 text-center">
          <div className="text-base font-bold text-slate-100">{item.name}</div>
          <div className="text-amber-400 font-semibold text-sm">{Number(item.defaultRate).toFixed(2)} each</div>
        </div>

        {/* Qty display */}
        <div className="mb-4 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-center">
          <span className="text-3xl font-bold text-amber-400 tracking-widest">{qty}</span>
          <span className="text-slate-500 text-sm ml-2">qty</span>
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {KEYS.map(k => (
            <button
              key={k}
              onClick={() => press(k)}
              className={`py-3 rounded-xl text-sm font-bold transition-all duration-150 ${
                k === 'C'
                  ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                  : k === '⌫'
                  ? 'bg-slate-800/60 border border-slate-700 text-slate-300 hover:bg-slate-700'
                  : 'bg-slate-800/50 border border-slate-700 text-slate-200 hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-300'
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        {/* Total preview */}
        <div className="mb-4 flex justify-between text-sm text-slate-500 border-t border-slate-800 pt-3">
          <span>Total</span>
          <span className="text-slate-200 font-semibold">
            {(parseInt(qty, 10) * Number(item.defaultRate) || 0).toFixed(2)}
          </span>
        </div>

        {/* Confirm / Cancel */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onCancel}
            className="py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800/50 text-sm font-medium transition-all duration-200">
            Cancel
          </button>
          <button onClick={confirm} disabled={!qty || parseInt(qty, 10) < 1}
            className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm transition-all duration-200 shadow-lg shadow-amber-500/10 disabled:opacity-40">
            Add ×{qty}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main OrderScreen ─────────────────────────────────────── */
export default function OrderScreen() {
  const { orderId } = useParams();
  const navigate    = useNavigate();

  const [order, setOrder]             = useState(null);
  const [categories, setCategories]   = useState([]);
  const [items, setItems]             = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [voidReasons, setVoidReasons] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [sending, setSending]         = useState(false);

  // Qty picker state
  const [pendingItem, setPendingItem] = useState(null);

  const fetchOrder = useCallback(() =>
    posAPI.getOrder(orderId).then(r => setOrder(r.data)), [orderId]);

  useEffect(() => {
    Promise.all([
      fetchOrder(),
      posAPI.getCategories().then(r => setCategories(r.data)),
      posAPI.getVoidReasons().then(r => setVoidReasons(r.data)),
    ]).catch(console.error).finally(() => setLoading(false));
  }, [orderId]);

  const loadItems = (cat) => {
    setSelectedCat(cat);
    if (cat.level === 3 || !categories.find(c => c.parentId === cat.id)) {
      posAPI.getMenuItems({ category_id: cat.id })
        .then(r => setItems(r.data))
        .catch(console.error);
    } else {
      setItems([]);
    }
  };

  // Tap item → open qty picker
  const handleItemTap = (menuItem) => {
    setPendingItem(menuItem);
  };

  // Qty picker confirms → add with selected qty
  const confirmAdd = async (qty) => {
    const item = pendingItem;   // capture before clearing
    setPendingItem(null);
    setSending(true);
    try {
      await posAPI.addItem(orderId, { menuItemId: item.id, qty });
      await fetchOrder();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not add item');
    } finally {
      setSending(false);
    }
  };

  const voidItem = async (item) => {
    const reason = voidReasons[0];
    if (!window.confirm(`Void 1x ${item.menuItem.name}?`)) return;
    try {
      await posAPI.voidItem(orderId, item.id, { qty: 1, voidReasonId: reason?.id });
      await fetchOrder();
    } catch (err) {
      alert(err.response?.data?.error || 'Void failed');
    }
  };

  const generateBill = async () => {
    try {
      const { data } = await posAPI.generateBill(orderId);
      navigate(`/bills/${data.id}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Could not generate bill');
    }
  };

  const activeItems = order?.items?.filter(i => {
    const voided = i.voids?.reduce((s, v) => s + v.qty, 0) || 0;
    return Number(i.qty) > voided;
  }) || [];

  const topLevelCategories = categories.filter(cat => cat.level === 1);
  const subtotal = activeItems.reduce((s, i) => s + Number(i.unitPrice) * Number(i.qty), 0);
  const taxTotal = activeItems.reduce((s, i) => s + (i.taxes?.reduce((sum, tax) => sum + Number(tax.taxAmount || 0), 0) || 0), 0);
  const grandTotal = activeItems.reduce((s, i) => s + Number(i.unitPriceWithTax ?? i.unitPrice) * Number(i.qty), 0);
  const subCategories = selectedCat ? categories.filter(c => c.parentId === selectedCat.id) : [];

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-500">Loading order…</div>;
  if (!order)  return <div className="p-8 text-red-400">Order not found.</div>;

  return (
    <>
      {/* Qty picker overlay */}
      {pendingItem && (
        <QtyPickerModal
          item={pendingItem}
          onConfirm={confirmAdd}
          onCancel={() => setPendingItem(null)}
        />
      )}

      <div className="flex flex-col lg:flex-row h-[calc(100vh-52px)] min-h-0 gap-0 lg:gap-0">

        {/* ── Left: Menu panel ── */}
        <div className="flex-1 flex flex-col border-b border-slate-800 lg:border-b-0 lg:border-r overflow-hidden min-w-0">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800 bg-slate-900/40 text-sm">
            <button
              onClick={() => { setSelectedCat(null); setItems([]); }}
              className="text-amber-400 hover:text-amber-300 transition-colors"
            >
              Menu
            </button>
            {selectedCat && (
              <>
                <span className="text-slate-600">/</span>
                <span className="text-slate-300">{selectedCat.name}</span>
              </>
            )}
          </div>

          {/* L1 Category grid */}
          {!selectedCat && (
            <div className="p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-auto">
              {topLevelCategories.map(cat => (
                <button key={cat.id} onClick={() => loadItems(cat)}
                  className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 rounded-xl p-3 sm:p-4 text-sm font-medium text-amber-300 transition-all duration-200 text-left min-h-[68px]">
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* L2 Sub-category grid */}
          {selectedCat && subCategories.length > 0 && items.length === 0 && (
            <div className="p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-auto">
              {subCategories.map(cat => (
                <button key={cat.id} onClick={() => loadItems(cat)}
                  className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 hover:border-amber-500/50 rounded-xl p-3 sm:p-4 text-sm font-medium text-amber-200 transition-all duration-200 text-left min-h-[68px]">
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Items grid */}
          {items.length > 0 && (
            <div className="p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-auto">
              {items.map(item => (
                <button key={item.id} onClick={() => handleItemTap(item)} disabled={sending}
                  className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-left hover:bg-amber-500/10 hover:border-amber-500/30 transition-all duration-200 disabled:opacity-50 min-h-[88px]">
                  <div className="text-sm font-medium text-slate-200">{item.name}</div>
                  <div className="text-amber-400 font-bold text-sm mt-1">
                    {Number(item.defaultRate).toFixed(2)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Order ticket ── */}
        <div className="w-full lg:w-80 flex flex-col bg-slate-900/50 border-t border-slate-800 lg:border-t-0">
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/60">
            <div className="font-bold text-slate-100">Order #{order.id}</div>
            <div className="text-xs text-slate-500">{order.table?.name} · {order.status}</div>
          </div>

          {/* Item list */}
          <div className="flex-1 overflow-auto divide-y divide-slate-800">
            {activeItems.length === 0 && (
              <div className="p-6 text-center text-slate-600 text-sm">
                No items yet.<br />Tap a menu item to add.
              </div>
            )}
            {activeItems.map(item => (
              <div key={item.id} className="flex items-center px-4 py-2 gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-200 truncate">{item.menuItem?.name}</div>
                  {item.comment && <div className="text-xs text-slate-500 italic">{item.comment}</div>}
                </div>
                <div className="text-xs text-slate-500">×{Number(item.qty)}</div>
                <div className="text-sm font-semibold text-slate-300 w-16 text-right">
                  {(Number(item.unitPriceWithTax ?? item.unitPrice) * Number(item.qty)).toFixed(2)}
                </div>
                <button onClick={() => voidItem(item)}
                  className="text-red-500 hover:text-red-400 text-xs ml-1 transition-colors">✕</button>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-slate-800 px-4 py-3 space-y-1 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span><span>{subtotal.toFixed(2)}</span>
            </div>
            {taxTotal > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Tax</span><span>{taxTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-slate-100 text-base border-t border-slate-800 pt-2">
              <span>Total</span><span>{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 pb-4 space-y-2">
            <button onClick={generateBill} disabled={activeItems.length === 0}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-xl transition-all duration-200 disabled:opacity-40 shadow-lg shadow-amber-500/10">
              Generate Bill
            </button>
            <button onClick={() => navigate(-1)}
              className="w-full border border-slate-700 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 font-medium py-2 rounded-xl transition-all duration-200 text-sm">
              ← Back to Tables
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
