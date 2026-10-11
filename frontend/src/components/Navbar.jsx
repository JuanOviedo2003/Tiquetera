import { useAuth } from '../context/AuthContext';
import { Ticket, Users, UserCheck, LogOut, UtensilsCrossed, Store } from 'lucide-react';

export default function Navbar({ activeTab, onSelectTab }) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'tiqueteras', label: 'Tiqueteras', icon: Ticket, countLabel: 'Pases' },
    { id: 'clientes', label: 'Clientes', icon: Users, countLabel: 'Directorio' },
    { id: 'usuarios', label: 'Equipo', icon: UserCheck, countLabel: 'Turnos' },
  ];

  const userName = user?.nombre || user?.name || 'Administrador';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 w-full bg-[#12151d]/90 border-b border-[#232834] backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand identity */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#e0533c] text-white flex items-center justify-center shadow-md shadow-[#e0533c]/20">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg sm:text-xl font-bold tracking-tight text-[#f4f1ea] font-display">
                    Tiquetera
                  </span>
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#202532] text-[#e5a93c] border border-[#2d3444]">
                    Almuerzos
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <Store className="w-3 h-3 text-slate-400" />
                  <span>Control de Restaurante</span>
                </div>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1.5 bg-[#171b24] p-1.5 rounded-xl border border-[#272e3d]">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-[#e0533c] text-white shadow-sm font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-[#202634]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2.5 bg-[#171b24] py-1.5 px-3 rounded-xl border border-[#262c3b]">
                <div className="w-7 h-7 rounded-lg bg-[#252b3a] text-slate-200 flex items-center justify-center font-bold text-xs">
                  {userInitial}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-white leading-tight">{userName}</div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Turno Activo</span>
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-[#272e3d] hover:border-rose-500/30 transition-all cursor-pointer"
                title="Cerrar sesión de cajero"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Dock (Ergonomic thumb control) */}
      <nav
        aria-label="Navegación móvil"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#12151d]/95 border-t border-[#252a36] backdrop-blur-xl pb-safe"
      >
        <div className="grid grid-cols-3 max-w-md mx-auto py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex flex-col items-center justify-center py-2 px-1 relative transition-colors touch-press cursor-pointer ${
                  isActive ? 'text-[#e0533c]' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-all ${
                    isActive ? 'bg-[#e0533c]/15 text-[#e0533c]' : 'text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[11px] font-semibold mt-0.5 ${isActive ? 'font-bold' : ''}`}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#e0533c]" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
