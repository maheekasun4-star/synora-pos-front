import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Settings, LogOut, User } from 'lucide-react';

const navItems = [
  { label: 'Menu',      to: '/backoffice/menu' },
  { label: 'Outlets',   to: '/backoffice/outlets' },
  { label: 'Tables',    to: '/backoffice/tables' },
  { label: 'Tax',       to: '/backoffice/taxes' },
  { label: 'Discounts', to: '/backoffice/discounts' },
  { label: 'Printers',  to: '/backoffice/printers' },
  { label: 'Users',     to: '/backoffice/users' },
];

export default function BackofficeLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* Top header */}
      <header className="glass border-b border-slate-800/60 sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-500 border border-amber-500/20">
              <Settings size={16} />
            </div>
            <div>
              <div className="text-sm font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                Backoffice
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Admin configuration</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <div className="h-7 w-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                <User size={14} />
              </div>
              <span className="text-slate-300 font-medium truncate max-w-[160px]">{user?.fullName || user?.username}</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all duration-200"
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row">

        {/* Sidebar nav */}
        <aside className="w-full shrink-0 lg:w-56">
          <div className="glass-card rounded-xl p-3">
            <nav className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-semibold shadow-lg shadow-amber-500/15'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        {/* Page content */}
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
