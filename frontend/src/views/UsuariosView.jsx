import { useState, useEffect } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import { UserCheck, UserPlus, Mail, Lock, Shield, Loader2, Sparkles } from 'lucide-react';

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
        message: err.message || 'Error al cargar usuarios',
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
      setFormError('Por favor complete todos los campos obligatorios');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await api.createUser(formData);
      onShowToast({
        type: 'success',
        message: `Usuario ${formData.name} registrado con éxito`,
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
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Gestión de Usuarios del Restaurante
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold">
              HU-R11
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Crea cuentas de acceso con contraseñas encriptadas para los miembros del equipo
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-bold text-sm shadow-lg shadow-orange-500/20 transition-all cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>

      {/* Users list */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <p className="text-sm">Cargando cuentas del restaurante...</p>
        </div>
      ) : usuarios.length === 0 ? (
        <div className="p-12 text-center glass-panel rounded-2xl border border-slate-800/80">
          <UserCheck className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No hay usuarios registrados</h3>
          <p className="text-sm text-slate-400 mt-1">
            Registra una nueva cuenta de usuario para tu equipo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {usuarios.map((usr) => (
            <div
              key={usr.id}
              className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-base">
                      {usr.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">
                        {usr.name}
                      </h4>
                      <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3.5 h-3.5" />
                        {usr.email}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-800/60">
                  <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-slate-800 text-slate-300 border border-slate-700/60 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-orange-400" />
                    {usr.role || 'RESTAURANTE'}
                  </span>

                  <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Activo
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-slate-400 font-mono">
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
        title="Crear Cuenta de Usuario (HU-R11)"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Nombre Completo *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej. Sofía Martínez"
              required
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Correo Electrónico *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="sofia@restaurante.com"
              required
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Contraseña *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              🔒 La contraseña se encriptará de forma segura en el backend mediante bcrypt.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 shadow-md shadow-orange-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Crear Cuenta
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
