import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { UserPlus, Search, Phone, CreditCard, User, Loader2, Plus, Sparkles, Ticket } from 'lucide-react';

export default function ClientesView({ onEmitirTiquetera, onShowToast }) {
  const { restauranteId } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal registrar cliente
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    identificacion: '',
    telefono: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const data = await api.getClientes(restauranteId);
      setClientes(data || []);
    } catch (err) {
      onShowToast({
        type: 'error',
        message: err.message || 'Error al cargar clientes',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, [restauranteId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      setFormError('El nombre completo es obligatorio');
      return;
    }
    if (!formData.identificacion.trim()) {
      setFormError('El número de identificación es obligatorio');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const res = await api.createCliente({
        ...formData,
        restaurante_id: restauranteId,
      });
      onShowToast({
        type: 'success',
        message: `Cliente ${formData.nombre} registrado con éxito`,
      });
      setIsModalOpen(false);
      setFormData({ nombre: '', identificacion: '', telefono: '' });
      fetchClientes();
    } catch (err) {
      setFormError(err.message || 'Error al registrar cliente');
    } finally {
      setSaving(false);
    }
  };

  const filteredClientes = clientes.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.nombre?.toLowerCase().includes(term) ||
      c.identificacion?.toLowerCase().includes(term) ||
      c.telefono?.includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Registro y Gestión de Clientes
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold">
              HU-R2
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Registra los clientes que adquieren almuerzos para vincularlos a sus tiqueteras
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
          Registrar Cliente
        </button>
      </div>

      {/* Filter bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar cliente por nombre, cédula/identificación o teléfono..."
          className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
        />
      </div>

      {/* Table or Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <p className="text-sm">Cargando directorio de clientes...</p>
        </div>
      ) : filteredClientes.length === 0 ? (
        <div className="p-12 text-center glass-panel rounded-2xl border border-slate-800/80">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/60 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <User className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No se encontraron clientes</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? 'No hay clientes que coincidan con la búsqueda ingresada.'
              : 'Aún no has registrado clientes. Comienza registrando el primero para emitirle una tiquetera.'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Registrar primer cliente
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClientes.map((cliente) => (
            <div
              key={cliente.id}
              className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700/80 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-base">
                      {cliente.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors">
                        {cliente.nombre}
                      </h4>
                      <span className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <CreditCard className="w-3.5 h-3.5" />
                        ID: {cliente.identificacion}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-2 pt-2 border-t border-slate-800/60">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{cliente.telefono || 'Sin teléfono registrado'}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  {cliente.id}
                </span>

                <button
                  onClick={() => onEmitirTiquetera(cliente)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/30 transition-all cursor-pointer"
                  title="Crear nueva tiquetera para este cliente"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  Crear Tiquetera
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Registrar Cliente */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Nuevo Cliente (HU-R2)"
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
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej. Juan Pérez"
              required
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Cédula / Identificación *
            </label>
            <input
              type="text"
              value={formData.identificacion}
              onChange={(e) => setFormData({ ...formData, identificacion: e.target.value })}
              placeholder="Ej. 1098765432"
              required
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Teléfono (opcional, 7 a 15 dígitos)
            </label>
            <input
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              placeholder="Ej. 3001234567"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
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
              Guardar Cliente
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
