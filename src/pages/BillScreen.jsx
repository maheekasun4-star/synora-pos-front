import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { posAPI } from '../api/pos.js';

const METHODS = [
  { key: 'cash',         label: '💵 Cash' },
  { key: 'card',         label: '💳 Card' },
  { key: 'city_ledger',  label: '🏢 City Ledger' },
  { key: 'room_posting', label: '🏨 Post to Room' },
];

export default function BillScreen() {
  const { billId } = useParams();
  const navigate   = useNavigate();

  const [bill, setBill]             = useState(null);
  const [method, setMethod]         = useState('cash');
  const [loading, setLoading]       = useState(true);
  const [paying, setPaying]         = useState(false);
  const [roomNo, setRoomNo]         = useState('');
  const [roomGuest, setRoomGuest]   = useState(null);
  const [roomLookupErr, setRoomLookupErr] = useState('');
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [cardNo, setCardNo]         = useState('');
  const [authNo, setAuthNo]         = useState('');
  const [bankName, setBankName]     = useState('');
  const [clAccount, setClAccount]   = useState('');

  useEffect(() => {
    posAPI.getBill(billId)
      .then(r => setBill(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [billId]);

  const lookupRoom = async (overrideRoomNo) => {
    setRoomGuest(null); setRoomLookupErr('');
    const rn = overrideRoomNo ?? roomNo;
    try {
      const { data } = await posAPI.roomLookup(rn);
      setRoomGuest(data);
      return data;
    } catch (err) {
      setRoomLookupErr(err.response?.data?.error || 'Room not found');
      return null;
    }
  };

  const handlePay = async () => {
    if (method === 'room_posting' && !roomGuest) {
      alert('Please look up the room guest first'); return;
    }
    setPaying(true);
    try {
      const payload = {
        method,
        amount: Number(bill.grandTotal),
        ...(method === 'card'         && { cardNo, authNo, bankName }),
        ...(method === 'city_ledger'  && { cityLedgerAccount: clAccount }),
        ...(method === 'room_posting' && { reservationId: roomGuest.reservationId, roomNumber: roomGuest.roomNumber, guestName: roomGuest.guestName }),
      };
      await posAPI.pay(billId, payload);
      navigate(`/outlets/${bill.order?.outletId}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const inputCls = 'w-full bg-slate-900/60 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-200 placeholder-slate-500 outline-none px-3 py-2.5 text-sm transition-all duration-300';

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-500">Loading bill…</div>;
  if (!bill)   return <div className="p-8 text-red-400">Bill not found.</div>;

  const alreadyPaid = bill.payments?.reduce((s, p) => s + Number(p.amount), 0) || 0;
  const balance     = Number(bill.grandTotal) - alreadyPaid;
  const isPaid      = bill.status === 'paid';
  const taxBreakdown = bill.taxes || [];

  return (
    <div className="max-w-2xl mx-auto p-3 sm:p-6">

      {/* Bill header */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Bill #{bill.billNo}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{bill.order?.table?.name} · Order #{bill.orderId}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            isPaid
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
          }`}>
            {isPaid ? 'Paid' : 'Open'}
          </span>
        </div>

        {/* Items */}
        <div className="divide-y divide-slate-800 mb-4">
          {bill.items?.map(bi => (
            <div key={bi.id} className="flex justify-between py-2 text-sm">
              <span className="text-slate-300">{bi.orderItem?.menuItem?.name} ×{Number(bi.qty)}</span>
              <span className="font-medium text-slate-200">
                {(Number(bi.orderItem?.unitPriceWithTax ?? bi.orderItem?.unitPrice) * Number(bi.qty)).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-slate-800 pt-3 space-y-1 text-sm">
          <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{Number(bill.subtotal).toFixed(2)}</span></div>
          {taxBreakdown.length > 0 && (
            <div className="space-y-1 border-t border-slate-800 pt-2">
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Taxes</div>
              {taxBreakdown.map(t => (
                <div key={t.id} className="flex justify-between text-slate-500">
                  <span>{t.tax?.name || 'Tax'}</span>
                  <span>{Number(t.taxAmount).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          {Number(bill.taxTotal) > 0 && (
            <div className="flex justify-between text-slate-500"><span>Total Tax</span><span>{Number(bill.taxTotal).toFixed(2)}</span></div>
          )}
          {Number(bill.discountTotal) > 0 && (
            <div className="flex justify-between text-green-400"><span>Discount</span><span>-{Number(bill.discountTotal).toFixed(2)}</span></div>
          )}
          <div className="flex justify-between font-bold text-lg border-t border-slate-800 pt-2 text-slate-100">
            <span>Total</span><span>{Number(bill.grandTotal).toFixed(2)}</span>
          </div>
          {alreadyPaid > 0 && (
            <div className="flex justify-between text-slate-500"><span>Paid</span><span>{alreadyPaid.toFixed(2)}</span></div>
          )}
          {!isPaid && balance > 0 && (
            <div className="flex justify-between font-semibold text-amber-400 border-t border-slate-800 pt-2">
              <span>Balance Due</span><span>{balance.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Payment section */}
      {!isPaid && (
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Payment Method</h2>

          {/* Method selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
            {METHODS.map(m => {
              const isRoomPosting = m.key === 'room_posting';
              return (
                <button
                  key={m.key}
                  onClick={async () => {
                    if (isRoomPosting && !roomGuest) {
                      // show modal to lookup/select an in-house guest
                      setShowRoomModal(true);
                      return;
                    }
                    setMethod(m.key);
                  }}
                  title={isRoomPosting && !roomGuest ? 'Lookup an‑in‑house room guest first' : ''}
                  className={`py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                    method === m.key
                      ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                      : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                  }`}>
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Card fields */}
          {method === 'card' && (
            <div className="space-y-3 mb-4">
              <input placeholder="Card number"  value={cardNo}   onChange={e => setCardNo(e.target.value)}   className={inputCls} />
              <input placeholder="Auth number"  value={authNo}   onChange={e => setAuthNo(e.target.value)}   className={inputCls} />
              <input placeholder="Bank name"    value={bankName} onChange={e => setBankName(e.target.value)} className={inputCls} />
            </div>
          )}

          {/* City ledger */}
          {method === 'city_ledger' && (
            <div className="mb-4">
              <input placeholder="City ledger account" value={clAccount} onChange={e => setClAccount(e.target.value)} className={inputCls} />
            </div>
          )}

          {/* Room posting */}
          {method === 'room_posting' && (
            <div className="mb-4 space-y-3">
              <div className="flex gap-2">
                <input placeholder="Room number" value={roomNo} onChange={e => setRoomNo(e.target.value)} className={`flex-1 ${inputCls}`} />
                <button onClick={lookupRoom} className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 px-4 rounded-xl text-sm font-medium transition-all duration-200">
                  Look up
                </button>
              </div>
              {roomLookupErr && <p className="text-red-400 text-sm">{roomLookupErr}</p>}
              {roomGuest && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-sm">
                  <div className="font-semibold text-green-400">{roomGuest.guestName}</div>
                  <div className="text-green-500 text-xs mt-0.5">Room {roomGuest.roomNumber} · Conf #{roomGuest.confoNo}</div>
                  <div className="text-green-500 text-xs">Check-out: {new Date(roomGuest.checkOut).toLocaleDateString()}</div>
                </div>
              )}
            </div>
          )}

          {/* Room lookup modal (when user selects Post to Room but no guest is selected) */}
          {showRoomModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowRoomModal(false)} />
              <div className="relative bg-slate-900 p-4 sm:p-6 rounded-xl w-[calc(100%-1.5rem)] max-w-md">
                <h3 className="mb-3 text-lg font-semibold">Lookup in‑house guest</h3>
                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                  <input placeholder="Room number" value={roomNo} onChange={e => setRoomNo(e.target.value)} className={`flex-1 ${inputCls}`} />
                  <button onClick={async () => {
                    setRoomLookupErr('');
                    const data = await lookupRoom();
                    if (data) {
                      setMethod('room_posting');
                      setShowRoomModal(false);
                    }
                  }} className="bg-amber-500 px-3 rounded-xl text-slate-950 font-semibold">Lookup</button>
                </div>
                {roomLookupErr && <p className="text-red-400 text-sm mb-3">{roomLookupErr}</p>}
                <div className="text-right">
                  <button onClick={() => setShowRoomModal(false)} className="px-3 py-2 text-sm rounded-xl border border-slate-700">Cancel</button>
                </div>
              </div>
            </div>
          )}

          <button onClick={handlePay} disabled={paying}
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl transition-all duration-300 disabled:opacity-50 text-base shadow-lg shadow-amber-500/10">
            {paying ? 'Processing…' : `Confirm Payment · ${Number(bill.grandTotal).toFixed(2)}`}
          </button>
        </div>
      )}

      {isPaid && (
        <div className="text-center py-6">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-green-400 font-semibold">Bill settled</p>
          <button onClick={() => navigate(-2)} className="mt-4 text-amber-400 hover:text-amber-300 text-sm transition-colors">
            ← Back to Tables
          </button>
        </div>
      )}
    </div>
  );
}
