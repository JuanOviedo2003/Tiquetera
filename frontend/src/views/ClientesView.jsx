import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { UserPlus, Search, Phone, CreditCard, User, Loader2, Plus, Ticket, X } from 'lucide-react';

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
        title: 'Error de Conexión',
        message: err.message || 'No fue posible cargar el directorio de clientes',
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
      setFormError('El número de identificación o cédula es obligatorio');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await api.createCliente({
        ...formData,
        restaurante_id: restauranteId,
      });
      onShowToast({
        type: 'success',
        title: 'Cliente Registrado',
        message: `${formData.nombre} ha sido incorporado al directorio del restaurante.`,
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
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-display">
            Directorio de Clientes
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Administra los comensales asociados a compras de paquetes de almuerzo
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
          <span>Registrar Cliente</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre, documento de identidad o teléfono..."
          className="w-full bg-[#151821] border border-[#262c38] rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#e0533c] focus:ring-1 focus:ring-[#e0533c] transition-all"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-[#e0533c]" />
          <p className="text-sm">Consultando directorio...</p>
        </div>
      ) : filteredClientes.length === 0 ? (
        <div className="p-10 text-center bg-[#151821] rounded-2xl border border-[#252b37]">
          <div className="w-12 h-12 rounded-2xl bg-[#1c222e] text-slate-400 flex items-center justify-center mx-auto mb-3">
            <User className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white font-display">No hay clientes encontrados</h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? 'No hay registros que coincidan con el término buscado.'
              : 'Empieza registrando tu primer cliente para poder emitirle tiqueteras de almuerzos.'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#202633] hover:bg-[#2b3345] text-white font-semibold text-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nuevo comensal
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredClientes.map((cliente) => (
            <div
              key={cliente.id}
              className="bg-[#151821] p-4 sm:p-5 rounded-2xl border border-[#262c38] hover:border-[#384152] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#202532] border border-[#2b3342] text-[#e0533c] flex items-center justify-center font-bold text-base shrink-0 font-display">
                    {cliente.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-bold text-white truncate font-display">
                      {cliente.nombre}
                    </h3>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{cliente.identificacion}</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-400 pt-2.5 border-t border-[#222733] flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {cliente.telefono ? (
                    <a
                      href={`tel:${cliente.telefono}`}
                      className="hover:text-white transition-colors underline-offset-2 hover:underline"
                    >
                      {cliente.telefono}
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">Sin teléfono registrado</span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#222733] flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 font-mono">
                  {cliente.id}
                </span>

                <button
                  onClick={() => onEmitirTiquetera(cliente)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#e0533c]/15 text-[#e0533c] hover:bg-[#e0533c] hover:text-white border border-[#e0533c]/30 transition-all cursor-pointer touch-press"
                  title="Emitir nueva tiquetera de almuerzos para este cliente"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Emitir Tiquetera</span>
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
        title="Registrar Nuevo Cliente"
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
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej. Sofía Restrepo"
              required
              className="w-full bg-[#0e1015] border border-[#272d3b] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#e0533c] focus:ring-1 focus:ring-[#e0533c]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Documento de identidad / Cédula *
            </label>
            <input
              type="text"
              value={formData.identificacion}
              onChange={(e) => setFormData({ ...formData, identificacion: e.target.value })}
              placeholder="Ej. 1020304050"
              required
              className="w-full bg-[#0e1015] border border-[#272d3b] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#e0533c] focus:ring-1 focus:ring-[#e0533c]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Teléfono / WhatsApp (opcional)
            </label>
            <input
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              placeholder="Ej. 3105557890"
              className="w-full bg-[#0e1015] border border-[#272d3b] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#e0533c] focus:ring-1 focus:ring-[#e0533c]"
            />
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
              Guardar Cliente
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
