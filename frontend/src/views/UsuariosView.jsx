import { useState, useEffect } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import { UserCheck, UserPlus, Mail, Lock, Shield, Loader2 } from 'lucide-react';

export default function UsuariosView({ onShowToast }) {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal registrar usuario
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
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
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setFormError('Por favor completa todos los campos requeridos');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await api.createUser(formData);
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
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-display">
            Equipo y Acceso de Personal
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Gestiona los perfiles autorizados para operar la terminal de caja y validar tiqueteras
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#e0533c] hover:bg-[#c94530] text-white font-bold text-sm shadow-md shadow-[#e0533c]/20 transition-all cursor-pointer shrink-0 touch-press"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nuevo Acceso</span>
        </button>
      </div>

      {/* Users list */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-[#e0533c]" />
          <p className="text-sm">Cargando personal...</p>
        </div>
      ) : usuarios.length === 0 ? (
        <div className="p-10 text-center bg-[#151821] rounded-2xl border border-[#252b37]">
          <UserCheck className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white font-display">No hay miembros registrados</h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            Crea cuentas individuales para los cajeros y meseros de tu restaurante.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {usuarios.map((usr) => (
            <div
              key={usr.id}
              className="bg-[#151821] p-4 sm:p-5 rounded-2xl border border-[#262c38] hover:border-[#384152] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#202532] border border-[#2b3342] text-[#e0533c] flex items-center justify-center font-bold text-base shrink-0 font-display">
                    {usr.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-bold text-white truncate font-display">
                      {usr.name}
                    </h3>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{usr.email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2.5 border-t border-[#222733]">
                  <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold bg-[#1d222e] text-slate-300 border border-[#2c3344] flex items-center gap-1">
                    <Shield className="w-3 h-3 text-[#e5a93c]" />
                    <span>{usr.role || 'RESTAURANTE'}</span>
                  </span>

                  <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Activo
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t border-[#222733] text-[11px] text-slate-400 font-mono">
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
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nombre y apellido *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej. Andrés Morales"
              required
              className="w-full bg-[#0e1015] border border-[#272d3b] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#e0533c] focus:ring-1 focus:ring-[#e0533c]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Correo de inicio de sesión *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="andres@restaurante.com"
              required
              className="w-full bg-[#0e1015] border border-[#272d3b] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#e0533c] focus:ring-1 focus:ring-[#e0533c]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Contraseña de acceso *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required
              className="w-full bg-[#0e1015] border border-[#272d3b] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#e0533c] focus:ring-1 focus:ring-[#e0533c]"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Se almacenará protegida y encriptada en la base de datos.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#232835]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#e0533c] hover:bg-[#c94530] text-white shadow-md shadow-[#e0533c]/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 touch-press"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
              Habilitar Acceso
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
