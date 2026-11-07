import { useAuth } from '../context/AuthContext';
import { Ticket, Users, UserCheck, LogOut, Store, ScanLine } from 'lucide-react';

export default function Navbar({ activeTab, onSelectTab }) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'tiqueteras', label: 'Tiqueteras', icon: Ticket, countLabel: 'Pases' },
    { id: 'consumo', label: 'Consumo', icon: ScanLine, countLabel: 'Caja' },
    { id: 'clientes', label: 'Clientes', icon: Users, countLabel: 'Directorio' },
    { id: 'usuarios', label: 'Equipo', icon: UserCheck, countLabel: 'Turnos' },
  ];

  const userName = user?.nombre || user?.name || 'Restaurante';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <>
      {/* Top Header Bar — Calma y Legibilidad */}
      <header className="sticky top-0 z-40 w-full bg-white/95 border-b border-[#E5DED4] backdrop-blur-md">
        <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 h-16">
            {/* Identidad de Marca con el mismo icono de la ventana */}
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src="/favicon.svg?v=3"
                alt="Logo Tiquetera"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shadow-sm shadow-[#FF6B47]/25 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-base sm:text-xl font-semibold tracking-tight text-[#333333] font-display truncate">
                    Tiquetera
                  </span>
                </div>
                <div className="text-[11px] text-[#64829E] flex items-center gap-1 truncate font-medium">
                  <Store className="w-3 h-3 text-[#64829E] shrink-0" />
                  <span className="truncate">Control de Restaurante</span>
                </div>
              </div>
            </div>

            {/* Desktop Navigation Tabs — Altura uniforme h-11 */}
            <nav className="hidden md:flex items-center gap-1 h-11 bg-[#F9F5F1] p-1 rounded-xl border border-[#E5DED4] shrink-0">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`h-full flex items-center gap-2 px-4 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-[#FF6B47] text-white shadow-sm'
                        : 'text-[#333333]/75 hover:text-[#333333] hover:bg-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* User Profile & Logout — Altura uniforme h-10 sm:h-11 */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <div
                className="h-10 sm:h-11 flex items-center gap-2 bg-[#F9F5F1] px-2.5 sm:px-3.5 rounded-xl border border-[#E5DED4]"
                title={`Sesión iniciada: ${userName}`}
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#64829E]/15 text-[#64829E] flex items-center justify-center font-bold text-xs shrink-0">
                  {userInitial}
                </div>
                <div className="text-left max-w-[90px] sm:max-w-[140px]">
                  <div className="text-[11px] sm:text-xs font-semibold text-[#333333] leading-tight truncate">
                    {userName}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-[#64829E] flex items-center gap-1 leading-tight font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#64829E] shrink-0" />
                    <span className="truncate">Activo</span>
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                className="h-10 sm:h-11 flex items-center justify-center gap-1.5 px-3 sm:px-3.5 rounded-xl text-xs font-semibold text-[#333333]/80 hover:text-[#FF6B47] bg-[#F9F5F1] hover:bg-[#FF6B47]/10 border border-[#E5DED4] hover:border-[#FF6B47]/40 transition-all cursor-pointer shrink-0"
                title="Cerrar sesión de restaurante"
                aria-label="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Dock */}
      <nav
        aria-label="Navegación móvil"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 border-t border-[#E5DED4] backdrop-blur-xl pb-safe shadow-[0_-4px_20px_rgba(51,51,51,0.05)]"
      >
        <div className="grid grid-cols-4 max-w-md mx-auto py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex flex-col items-center justify-center py-2 px-1 relative transition-colors touch-press cursor-pointer ${
                  isActive ? 'text-[#FF6B47]' : 'text-[#64829E] hover:text-[#333333]'
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-all ${
                    isActive ? 'bg-[#FF6B47]/15 text-[#FF6B47]' : 'text-[#64829E]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[11px] font-semibold mt-0.5 ${isActive ? 'font-bold' : ''}`}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#FF6B47]" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
