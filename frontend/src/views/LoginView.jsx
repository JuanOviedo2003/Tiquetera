import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, Loader2, Store, KeyRound } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#F9F5F1] text-[#333333] relative">
      <div className="w-full max-w-md relative z-10 py-6">
        {/* Brand Header */}
        <div className="text-center mb-7">
          <img
            src="/favicon.svg?v=3"
            alt="Logo Tiquetera"
            className="w-16 h-16 rounded-2xl shadow-lg shadow-[#FF6B47]/25 mx-auto mb-3.5"
          />
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#333333] tracking-tight font-display">
            Tiquetera
          </h1>
          <p className="text-xs sm:text-sm text-[#64829E] mt-1 max-w-xs mx-auto font-medium">
            Control de almuerzos para restaurantes
          </p>
        </div>

        {/* Login Form Box */}
        <div className="bistro-card-elevated p-6 sm:p-8">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#FF6B47]/10 border border-[#FF6B47]/30 text-[#FF6B47] text-xs sm:text-sm flex items-start gap-2.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B47] mt-2 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#333333] mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#64829E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@restaurante.com"
                  required
                  className="w-full bg-[#F9F5F1] border border-[#E5DED4] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#333333] placeholder-[#64829E]/70 focus:outline-none focus:border-[#FF6B47] focus:ring-1 focus:ring-[#FF6B47] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#333333] mb-1.5">
                Contraseña de acceso
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#64829E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#F9F5F1] border border-[#E5DED4] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#333333] placeholder-[#64829E]/70 focus:outline-none focus:border-[#FF6B47] focus:ring-1 focus:ring-[#FF6B47] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-2xl font-semibold text-sm bg-[#FF6B47] hover:bg-[#E85A37] text-white shadow-md shadow-[#FF6B47]/25 flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer disabled:opacity-50 touch-press"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando acceso...</span>
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
          <div className="mt-6 pt-5 border-t border-[#E5DED4]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#64829E] mb-2.5">
              <KeyRound className="w-3.5 h-3.5 text-[#FF6B47]" />
              <span>Cuentas de demostración disponibles:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('admin@tiquetera.com', 'admin123')}
                className="p-2.5 rounded-xl bg-[#F9F5F1] border border-[#FF6B47]/35 hover:border-[#FF6B47] hover:bg-[#FF6B47]/5 text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-[#FF6B47]">Superusuario</div>
                <div className="text-[11px] text-[#64829E] font-mono truncate">admin@tiquetera.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('prueba@gmail.com', '1234')}
                className="p-2.5 rounded-xl bg-[#F9F5F1] border border-[#E5DED4] hover:border-[#64829E] hover:bg-[#64829E]/5 text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-[#333333]">Restaurante Demo</div>
                <div className="text-[11px] text-[#64829E] font-mono truncate">prueba@gmail.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('cocina@tiquetera.com', 'cocina123')}
                className="p-2.5 rounded-xl bg-[#F9F5F1] border border-[#E5DED4] hover:border-[#64829E] hover:bg-[#64829E]/5 text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-[#333333]">Cocina & Servicio</div>
                <div className="text-[11px] text-[#64829E] font-mono truncate">cocina@tiquetera.com</div>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 text-center text-xs text-[#64829E] flex items-center justify-center gap-1.5 font-medium">
          <Store className="w-3.5 h-3.5 text-[#64829E]" />
          <span>Tiquetera — Control de almuerzos para restaurantes</span>
        </div>
      </div>
    </div>
  );
}
