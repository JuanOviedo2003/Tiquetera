import { useAuth } from '../context/AuthContext';
import { Ticket, Users, UserCheck, LogOut, UtensilsCrossed } from 'lucide-react';

export default function Navbar({ activeTab, onSelectTab }) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'tiqueteras', label: 'Tiqueteras', icon: Ticket },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'usuarios', label: 'Equipo y Usuarios', icon: UserCheck },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-amber-500 to-yellow-400 p-0.5 shadow-lg shadow-orange-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-orange-400" />
              </div>
            </div>
            <div>
              <span className="text-xl font-extrabold text-white tracking-tight flex items-center gap-1.5">
                Tiquetera<span className="text-orange-500 text-2xl leading-none">.</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-orange-400/90 block -mt-1">
                Panel Restaurante
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-md shadow-orange-500/25 font-bold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-white">
                {user?.nombre || user?.name || 'Administrador'}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {user?.rol || user?.role || 'RESTAURANTE'}
              </span>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 transition-all duration-200"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-semibold ${
                  isActive ? 'text-orange-400 font-bold' : 'text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
