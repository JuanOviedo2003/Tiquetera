import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { UserCheck, UserPlus, Mail, Shield, Loader2 } from 'lucide-react';

export default function UsuariosView({ onShowToast }) {
  const { restauranteId } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getUsers(restauranteId);
      setUsuarios(data || []);
    } catch (err) {
      onShowToast({
        type: 'error',
        title: 'Error de Red',
        message: err.message || 'No se pudieron consultar las cuentas del equipo',
      });
    } finally {
      setLoading(false);
    }
  }, [restauranteId, onShowToast]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setFormError('Por favor completa todos los campos requeridos');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await api.createUser({
        ...formData,
        restaurante_id: restauranteId,
      });
      onShowToast({
        type: 'success',
        title: 'Acceso Creado',
        message: `La cuenta para ${formData.name} fue configurada correctamente.`,
      });
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '' });
      fetchUsuarios();
    } catch (err) {
      setFormError(err.message || 'Error al registrar usuario');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#333333] tracking-tight font-display">
            Equipo y Acceso de Personal
          </h1>
          <p className="text-xs sm:text-sm text-[#64829E] mt-1">
            Gestiona los perfiles autorizados para operar la terminal de caja y validar tiqueteras
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#FF6B47] hover:bg-[#E85A37] text-white font-semibold text-sm shadow-md shadow-[#FF6B47]/25 transition-all cursor-pointer shrink-0 touch-press"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nuevo Acceso</span>
        </button>
      </div>

      {/* Users list */}
      {loading ? (
        <div className="p-12 text-center text-[#64829E] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-[#FF6B47]" />
          <p className="text-sm font-medium">Cargando personal...</p>
        </div>
      ) : usuarios.length === 0 ? (
        <div className="bistro-card p-10 text-center">
          <UserCheck className="w-12 h-12 text-[#64829E] mx-auto mb-3" />
          <h3 className="text-base font-semibold text-[#333333] font-display">
            No hay miembros registrados
          </h3>
          <p className="text-xs sm:text-sm text-[#64829E] mt-1 max-w-sm mx-auto">
            Crea cuentas individuales para los cajeros y meseros de tu restaurante.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {usuarios.map((usr) => (
            <div
              key={usr.id}
              className="bistro-card p-5 hover:border-[#64829E]/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FF6B47]/15 text-[#FF6B47] flex items-center justify-center font-bold text-base shrink-0 font-display">
                    {usr.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-semibold text-[#333333] truncate font-display">
                      {usr.name}
                    </h3>
                    <div className="text-xs text-[#64829E] flex items-center gap-1.5 mt-0.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-[#64829E] shrink-0" />
                      <span className="truncate">{usr.email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2.5 border-t border-[#E5DED4]">
                  <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold bg-[#F9F5F1] text-[#333333] border border-[#E5DED4] flex items-center gap-1">
                    <Shield className="w-3 h-3 text-[#FF6B47]" />
                    <span>{usr.role || 'RESTAURANTE'}</span>
                  </span>

                  <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold bg-[#64829E]/15 text-[#64829E] border border-[#64829E]/30">
                    Activo
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t border-[#E5DED4] text-[11px] text-[#64829E] font-mono">
                ID: {usr.id}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Registrar Usuario */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Crear Acceso para Personal"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-[#FF6B47]/10 border border-[#FF6B47]/30 text-[#FF6B47] text-xs font-medium">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#333333] mb-1">
              Nombre y apellido *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej. Andrés Morales"
              required
              className="w-full bg-[#F9F5F1] border border-[#E5DED4] rounded-xl px-3.5 py-2.5 text-sm text-[#333333] placeholder-[#64829E]/70 focus:outline-none focus:border-[#FF6B47] focus:ring-1 focus:ring-[#FF6B47]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#333333] mb-1">
              Correo de inicio de sesión *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="andres@restaurante.com"
              required
              className="w-full bg-[#F9F5F1] border border-[#E5DED4] rounded-xl px-3.5 py-2.5 text-sm text-[#333333] placeholder-[#64829E]/70 focus:outline-none focus:border-[#FF6B47] focus:ring-1 focus:ring-[#FF6B47]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#333333] mb-1">
              Contraseña de acceso *
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
              Se almacenará protegida y encriptada en la base de datos.
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
              className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[#FF6B47] hover:bg-[#E85A37] text-white shadow-md shadow-[#FF6B47]/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 touch-press"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
              <span>Habilitar Acceso</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
