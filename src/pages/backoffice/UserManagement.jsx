import { useEffect, useState } from 'react';
import api from '../../api/pos.js';

const sectionCls = 'bg-slate-900/40 border border-slate-800 rounded-xl p-5';
const inputCls   = 'w-full bg-slate-900/60 border border-slate-800 focus:border-amber-500 rounded-lg text-slate-200 placeholder-slate-500 outline-none px-3 py-2 text-sm transition-all duration-300';
const labelCls   = 'mb-1 block text-xs font-semibold text-slate-400 uppercase tracking-wider';

const ROLES = ['admin', 'cashier', 'waiter'];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [form, setForm]   = useState({ username: '', password: '', role: 'cashier', fullName: '' });

  const load = () => api.get('/pos/backoffice/users').then(r => setUsers(r.data)).catch(console.error);
  useEffect(() => { load(); }, []);

  const onCreate = async () => {
    if (!form.username || !form.password) return;
    await api.post('/pos/backoffice/users', form);
    setForm({ username: '', password: '', role: 'cashier', fullName: '' });
    load();
  };

  const roleBadge = (role) => {
    const m = {
      admin:   'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      cashier: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      waiter:  'bg-sky-500/10 text-sky-400 border border-sky-500/20',
    };
    return m[role] || 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
  };

  return (
    <div className="space-y-6 p-2">
      <section className={sectionCls}>
        <h2 className="mb-4 text-xl font-bold text-slate-100">User management</h2>
        <div className="grid gap-3 md:grid-cols-5">
          <div>
            <label className={labelCls}>Full name</label>
            <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="John Smith" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Username</label>
            <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="jsmith" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Password</label>
            <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Role</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className={inputCls}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button type="button" onClick={onCreate}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition-all duration-200 shadow-lg shadow-amber-500/10">
              Create
            </button>
          </div>
        </div>
      </section>

      <section className={sectionCls}>
        <h3 className="mb-3 text-lg font-semibold text-slate-200">System users</h3>
        {users.length === 0 && <p className="text-sm text-slate-600">No users yet.</p>}
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/30 px-3 py-2.5 text-sm">
              <div>
                <div className="font-medium text-slate-200">{u.fullName || u.username}</div>
                <div className="text-xs text-slate-500">@{u.username}</div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${roleBadge(u.role)}`}>{u.role}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
