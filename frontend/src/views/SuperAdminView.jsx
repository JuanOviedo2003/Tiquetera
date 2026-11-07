import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import {
  Store,
  Plus,
  Mail,
  Shield,
  Users,
  Loader2,
  LogOut,
  CheckCircle2,
} from 'lucide-react';

export default function SuperAdminView({ onShowToast }) {
  const { user, logout } = useAuth();
  const [restaurantes, setRestaurantes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const userName = user?.nombre || user?.name || 'Superusuario';
  const userInitial = userName.charAt(0).toUpperCase();

  const fetchRestaurantes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getRestaurantes();
      setRestaurantes(data || []);
    } catch (err) {
      onShowToast?.({
        type: 'error',
        title: 'Error de Lectura',
        message: err.message || 'No se pudieron consultar los perfiles de restaurantes',
      });
    } finally {
      setLoading(false);
    }
  }, [onShowToast]);

  useEffect(() => {
    fetchRestaurantes();
  }, [fetchRestaurantes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setFormError('Por favor completa el nombre del restaurante, correo y contraseña');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await api.createRestaurante(formData);
      onShowToast?.({
        type: 'success',
        title: 'Restaurante Creado',
        message: `El perfil y las credenciales para "${formData.name}" fueron habilitados correctamente.`,
      });
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '' });
      fetchRestaurantes();
    } catch (err) {
      setFormError(err.message || 'No fue posible registrar el restaurante');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#F9F5F1] text-[#333333] flex flex-col selection:bg-[#FF6B47] selection:text-white">
      {/* Header del Superusuario */}
      <header className="sticky top-0 z-40 w-full bg-white/95 border-b border-[#E5DED4] backdrop-blur-md">
        <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 h-16">
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
                  <Shield className="w-3 h-3 text-[#FF6B47] shrink-0" />
                  <span className="truncate">Administración de Restaurantes</span>
                </div>
              </div>
            </div>

            {/* Perfil y Cerrar Sesión con altura uniforme h-10 sm:h-11 */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <div
                className="h-10 sm:h-11 flex items-center gap-2 bg-[#F9F5F1] px-2.5 sm:px-3.5 rounded-xl border border-[#E5DED4]"
                title={`Sesión iniciada: ${userName}`}
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#FF6B47]/15 text-[#FF6B47] flex items-center justify-center font-bold text-xs shrink-0">
                  {userInitial}
                </div>
                <div className="text-left max-w-[95px] sm:max-w-[140px]">
                  <div className="text-[11px] sm:text-xs font-semibold text-[#333333] leading-tight truncate">
                    {userName}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-[#64829E] flex items-center gap-1 leading-tight font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#64829E] shrink-0" />
                    <span className="truncate">Superusuario</span>
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                className="h-10 sm:h-11 flex items-center justify-center gap-1.5 px-3 sm:px-3.5 rounded-xl text-xs font-semibold text-[#333333]/80 hover:text-[#FF6B47] bg-[#F9F5F1] hover:bg-[#FF6B47]/10 border border-[#E5DED4] hover:border-[#FF6B47]/40 transition-all cursor-pointer shrink-0"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Cuerpo principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#333333] tracking-tight font-display">
              Perfiles de Restaurantes
            </h1>
            <p className="text-xs sm:text-sm text-[#64829E] mt-1">
              Crea las credenciales principales de cada restaurante (correo y contraseña) para que administren su propio equipo, clientes y tiqueteras
            </p>
          </div>

          <button
            onClick={() => {
              setFormError(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#FF6B47] hover:bg-[#E85A37] text-white font-semibold text-sm shadow-md shadow-[#FF6B47]/25 transition-all cursor-pointer shrink-0 touch-press"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Restaurante</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[#64829E] flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-[#FF6B47]" />
            <p className="text-sm">Cargando perfiles de restaurantes...</p>
          </div>
        ) : restaurantes.length === 0 ? (
          <div className="bistro-card p-10 text-center">
            <Store className="w-12 h-12 text-[#64829E] mx-auto mb-3" />
            <h3 className="text-base font-semibold text-[#333333] font-display">
              No hay restaurantes registrados
            </h3>
            <p className="text-xs sm:text-sm text-[#64829E] mt-1 max-w-sm mx-auto">
              Crea el primer perfil de restaurante asignándole un correo electrónico y contraseña de acceso.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {restaurantes.map((rest) => (
              <div
                key={rest.id}
                className="bistro-card p-5 hover:border-[#64829E]/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3 mb-3.5">
                    <div className="w-11 h-11 rounded-xl bg-[#FF6B47]/15 text-[#FF6B47] flex items-center justify-center font-bold text-base shrink-0 font-display">
                      <Store className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-[#333333] truncate font-display">
                        {rest.name}
                      </h3>
                      <div className="text-xs text-[#64829E] flex items-center gap-1.5 mt-0.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-[#64829E] shrink-0" />
                        <span className="truncate">{rest.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#E5DED4]">
                    <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold bg-[#64829E]/15 text-[#64829E] border border-[#64829E]/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Cuenta Principal</span>
                    </span>

                    <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold bg-[#F9F5F1] text-[#333333] border border-[#E5DED4] flex items-center gap-1">
                      <Users className="w-3 h-3 text-[#FF6B47]" />
                      <span>{rest.total_equipo || 1} en equipo</span>
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-2.5 border-t border-[#E5DED4] flex items-center justify-between text-[11px] text-[#64829E] font-mono">
                  <span>ID: {rest.restaurante_id || 'REST-1'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal: Crear Perfil de Restaurante */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !saving && setIsModalOpen(false)}
        title="Crear Perfil de Restaurante"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-[#FF6B47]/10 border border-[#FF6B47]/30 text-[#FF6B47] text-xs font-medium">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#333333] mb-1">
              Nombre del restaurante *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej. Restaurante La Casona"
              required
              className="w-full bg-[#F9F5F1] border border-[#E5DED4] rounded-xl px-3.5 py-2.5 text-sm text-[#333333] placeholder-[#64829E]/70 focus:outline-none focus:border-[#FF6B47] focus:ring-1 focus:ring-[#FF6B47]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#333333] mb-1">
              Correo electrónico de acceso *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="admin@lacasona.com"
              required
              className="w-full bg-[#F9F5F1] border border-[#E5DED4] rounded-xl px-3.5 py-2.5 text-sm text-[#333333] placeholder-[#64829E]/70 focus:outline-none focus:border-[#FF6B47] focus:ring-1 focus:ring-[#FF6B47]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#333333] mb-1">
              Contraseña *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required
              className="w-full bg-[#F9F5F1] border border-[#E5DED4] rounded-xl px-3.5 py-2.5 text-sm text-[#333333] placeholder-[#64829E]/70 focus:outline-none focus:border-[#FF6B47] focus:ring-1 focus:ring-[#FF6B47]"
            />
            <p className="text-[11px] text-[#64829E] mt-1">
              Con estas credenciales el restaurante iniciará sesión y podrá crear a su propio equipo.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E5DED4]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64829E] hover:text-[#333333] hover:bg-[#F9F5F1] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#FF6B47] hover:bg-[#E85A37] text-white shadow-md shadow-[#FF6B47]/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 touch-press"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>Crear Restaurante</span>
            </button>
          </div>
        </form>
      </Modal>

      <footer className="border-t border-[#E5DED4] bg-white/60 py-5 text-center text-xs text-[#64829E]">
        <p>Tiquetera — Control de almuerzos para restaurantes</p>
      </footer>
    </div>
  );
}
