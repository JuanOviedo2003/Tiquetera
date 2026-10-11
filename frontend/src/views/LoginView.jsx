import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UtensilsCrossed, Lock, Mail, ArrowRight, Loader2, Store, KeyRound } from 'lucide-react';

export default function LoginView() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Credenciales no válidas para este restaurante');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#0e1015] relative">
      <div className="w-full max-w-md relative z-10 py-6">
        {/* Brand Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#e0533c] text-white shadow-xl shadow-[#e0533c]/20 mb-3.5">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            Tiquetera Restaurante
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xs mx-auto">
            Terminal de control de tiqueteras, saldo de almuerzos y clientes
          </p>
        </div>

        {/* Login Form Box */}
        <div className="bg-[#151821] p-6 sm:p-8 rounded-2xl border border-[#262c38] shadow-2xl">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@restaurante.com"
                  required
                  className="w-full bg-[#0e1015] border border-[#272d3b] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#e0533c] focus:ring-1 focus:ring-[#e0533c] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Contraseña de acceso
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#0e1015] border border-[#272d3b] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#e0533c] focus:ring-1 focus:ring-[#e0533c] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm bg-[#e0533c] hover:bg-[#c94530] text-white shadow-lg shadow-[#e0533c]/20 flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer disabled:opacity-50 touch-press"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando terminal...</span>
                </>
              ) : (
                <>
                  <span>Ingresar a Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Helper */}
          <div className="mt-6 pt-5 border-t border-[#232835]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2.5">
              <KeyRound className="w-3.5 h-3.5 text-[#e5a93c]" />
              <span>Cuentas de demostración disponibles:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('prueba@gmail.com', '1234')}
                className="p-2.5 rounded-xl bg-[#0e1015] border border-[#252a37] hover:border-[#e0533c]/50 hover:bg-[#1a1f2b] text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-slate-200">Cajero Principal</div>
                <div className="text-[11px] text-slate-400 font-mono truncate">prueba@gmail.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('cocina@tiquetera.com', 'cocina123')}
                className="p-2.5 rounded-xl bg-[#0e1015] border border-[#252a37] hover:border-[#e0533c]/50 hover:bg-[#1a1f2b] text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-slate-200">Cocina & Servicio</div>
                <div className="text-[11px] text-slate-400 font-mono truncate">cocina@tiquetera.com</div>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <Store className="w-3.5 h-3.5 text-slate-400" />
          <span>Gestión local de restaurante y tiqueteras prepagadas</span>
        </div>
      </div>
    </div>
  );
}
