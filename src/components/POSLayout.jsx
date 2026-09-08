import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { LayoutGrid, UtensilsCrossed, Receipt, Settings, LogOut, User, ChefHat, Menu, X, PieChart } from 'lucide-react';

// Dark slate + amber — mirrors Synora PMS theme exactly.
export default function POSLayout() {
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { name: 'Table Layout', path: '/',          icon: LayoutGrid,     roles: ['admin', 'waiter'],            permission: 'tables.view' },
    { name: 'Order Screen', path: '/orders',     icon: UtensilsCrossed,roles: ['admin', 'waiter', 'cashier'], permission: 'orders.view' },
    { name: 'Billing',      path: '/billing',    icon: Receipt,        roles: ['admin'],                     permission: 'billing.view' },
    { name: 'Reports',      path: '/reports',    icon: PieChart,       roles: ['admin', 'cashier'],           permission: 'reports.view' },
    { name: 'Backoffice',   path: '/backoffice/menu', icon: Settings,  roles: ['admin'],                     permission: 'backoffice.view' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':   return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'waiter':  return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
      case 'cashier': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      default:        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':   return 'Administrator';
      case 'waiter':  return 'Waiter';
      case 'cashier': return 'Cashier';
      default:        return role;
    }
  };

  const navLink = (item) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
    return (
      <Link
        key={item.name}
        to={item.path}
        onClick={() => setMobileMenuOpen(false)}
        className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
          isActive
            ? 'bg-amber-500 text-slate-950 font-semibold shadow-lg shadow-amber-500/15'
            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
        }`}
      >
        <Icon size={18} className={isActive ? 'text-slate-950' : 'text-slate-400'} />
        {item.name}
      </Link>
    );
  };

  const filteredItems = menuItems.filter(
    item => user && (!item.roles || item.roles.includes(user.role)) &&
      (typeof hasPermission === 'function' ? hasPermission(item.permission) : true)
  );

  const userPanel = (compact = false) => user && (
    <div className="flex items-center gap-3 px-2 py-1">
      <div className={`${compact ? 'h-9 w-9' : 'h-10 w-10'} rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300`}>
        <User size={compact ? 18 : 20} />
      </div>
      <div className="overflow-hidden">
        <p className="text-xs font-semibold text-slate-200 truncate">{user.fullName}</p>
        <span className={`inline-block mt-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${getRoleBadgeColor(user.role)}`}>
          {getRoleLabel(user.role)}
        </span>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">

      {/* ── Desktop Sidebar ── */}
      <aside className="no-print print:hidden w-64 glass border-r border-slate-800 hidden lg:flex flex-col justify-between z-10">
        <div>
          {/* Logo */}
          <div className="p-6 flex items-center gap-3 border-b border-slate-800/60">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20">
              <ChefHat size={24} />
            </div>
            <div>
              <div className="font-bold text-lg leading-tight tracking-wider bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                SYNORA POS
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Restaurant Ops</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="p-4 space-y-1.5">
            {filteredItems.map(navLink)}
          </nav>
        </div>

        {/* User + logout */}
        <div className="p-4 border-t border-slate-800/60 space-y-4">
          {userPanel()}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/10 transition-all duration-300"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile Sidebar ── */}
      {mobileMenuOpen && (
        <div className="no-print print:hidden lg:hidden fixed inset-0 z-50 flex">
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300"
          />
          <aside className="relative w-64 bg-slate-950 border-r border-slate-800 h-full flex flex-col justify-between p-4 z-10">
            <div>
              <div className="pb-6 mb-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20">
                    <ChefHat size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-base leading-tight bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                      SYNORA POS
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">Restaurant Ops</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 hover:bg-slate-900 border border-transparent hover:border-slate-800 rounded-xl text-slate-400 hover:text-slate-100 transition"
                >
                  <X size={18} />
                </button>
              </div>
              <nav className="space-y-1.5">
                {filteredItems.map(navLink)}
              </nav>
            </div>
            <div className="border-t border-slate-800 pt-4 space-y-4">
              {userPanel(true)}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/10 transition-all duration-300"
              >
                <LogOut size={18} /> Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-950 relative">
        {/* Mobile header */}
        <header className="no-print print:hidden lg:hidden flex items-center justify-between bg-slate-950/80 border-b border-slate-800/60 p-4 sticky top-0 z-30 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-500 border border-amber-500/20">
              <ChefHat size={16} />
            </div>
            <div className="font-bold text-sm tracking-wider bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              SYNORA POS
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-slate-100 hover:border-slate-700 transition"
          >
            <Menu size={18} />
          </button>
        </header>

        {/* Ambient glow */}
        <div className="no-print print:hidden absolute top-0 left-1/4 right-1/4 h-64 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="flex-1 p-5 sm:p-8 md:p-10 relative z-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
