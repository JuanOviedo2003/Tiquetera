import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UtensilsCrossed, Lock, Mail, ArrowRight, Loader2, Sparkles, ShieldCheck } from 'lucide-react';

export default function LoginView() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Por favor complete todos los campos');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Credenciales inválidas');
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
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-radial from-slate-900 via-slate-950 to-slate-950 relative overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Card Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 p-0.5 shadow-xl shadow-orange-500/20 mb-4">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <UtensilsCrossed className="w-8 h-8 text-orange-400" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Tiquetera Restaurante
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Inicia sesión para gestionar clientes, tiqueteras y códigos de activación
          </p>
        </div>

        {/* Login Form Card */}
        <div className="glass-panel-elevated p-8 rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-sm flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@restaurante.com"
                  required
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Panel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Helper */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Accesos rápidos de demostración (Sprint 1):</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('prueba@gmail.com', '1234')}
                className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-orange-500/50 hover:bg-slate-800/50 text-left transition-colors"
              >
                <div className="text-xs font-bold text-slate-200">Restaurante Demo</div>
                <div className="text-[11px] text-slate-400 truncate">prueba@gmail.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('cocina@tiquetera.com', 'cocina123')}
                className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-orange-500/50 hover:bg-slate-800/50 text-left transition-colors"
              >
                <div className="text-xs font-bold text-slate-200">Cocina Central</div>
                <div className="text-[11px] text-slate-400 truncate">cocina@tiquetera.com</div>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Acceso seguro protegido — Rol RESTAURANTE</span>
        </div>
      </div>
    </div>
  );
}
