import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { UserPlus, Search, Phone, CreditCard, User, Loader2, Plus, Ticket, X } from 'lucide-react';

export default function ClientesView({ onEmitirTiquetera, onShowToast }) {
  const { restauranteId } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    identificacion: '',
    telefono: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchClientes = useCallback(async () => {
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
  }, [restauranteId, onShowToast]);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

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
          <h1 className="text-xl sm:text-2xl font-semibold text-[#333333] tracking-tight font-display">
            Directorio de Clientes
          </h1>
          <p className="text-xs sm:text-sm text-[#64829E] mt-1">
            Administra los comensales asociados a compras de paquetes de almuerzo
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
          <span>Registrar Cliente</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#64829E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre, documento de identidad o teléfono..."
          className="w-full bg-white border border-[#E5DED4] rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#333333] placeholder-[#64829E]/70 focus:outline-none focus:border-[#FF6B47] focus:ring-1 focus:ring-[#FF6B47] transition-all"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64829E] hover:text-[#333333] p-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="p-12 text-center text-[#64829E] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-[#FF6B47]" />
          <p className="text-sm font-medium">Consultando directorio...</p>
        </div>
      ) : filteredClientes.length === 0 ? (
        <div className="bistro-card p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#F9F5F1] text-[#64829E] flex items-center justify-center mx-auto mb-3">
            <User className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-[#333333] font-display">
            No hay clientes encontrados
          </h3>
          <p className="text-xs sm:text-sm text-[#64829E] mt-1 max-w-sm mx-auto">
            {searchTerm
              ? 'No hay registros que coincidan con el término buscado.'
              : 'Empieza registrando tu primer cliente para poder emitirle tiqueteras de almuerzos.'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#64829E] hover:bg-[#526E88] text-white font-semibold text-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nuevo comensal
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClientes.map((cliente) => (
            <div
              key={cliente.id}
              className="bistro-card p-5 hover:border-[#64829E]/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FF6B47]/15 text-[#FF6B47] flex items-center justify-center font-bold text-base shrink-0 font-display">
                    {cliente.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-semibold text-[#333333] truncate font-display">
                      {cliente.nombre}
                    </h3>
                    <div className="text-xs text-[#64829E] flex items-center gap-1.5 mt-0.5 font-mono">
                      <CreditCard className="w-3.5 h-3.5 text-[#64829E] shrink-0" />
                      <span>{cliente.identificacion}</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-[#64829E] pt-2.5 border-t border-[#E5DED4] flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#64829E] shrink-0" />
                  {cliente.telefono ? (
                    <a
                      href={`tel:${cliente.telefono}`}
                      className="text-[#333333] hover:text-[#FF6B47] transition-colors underline-offset-2 hover:underline font-medium"
                    >
                      {cliente.telefono}
                    </a>
                  ) : (
                    <span className="text-[#64829E] italic">Sin teléfono registrado</span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E5DED4] flex items-center justify-between gap-2">
                <span className="text-[11px] text-[#64829E] font-mono truncate">
                  {cliente.id}
                </span>

                <button
                  onClick={() => onEmitirTiquetera(cliente)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-[#FF6B47] hover:bg-[#E85A37] text-white shadow-xs transition-all cursor-pointer touch-press shrink-0"
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
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej. Sofía Restrepo"
              required
              className="w-full bg-[#F9F5F1] border border-[#E5DED4] rounded-xl px-3.5 py-2.5 text-sm text-[#333333] placeholder-[#64829E]/70 focus:outline-none focus:border-[#FF6B47] focus:ring-1 focus:ring-[#FF6B47]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#333333] mb-1">
              Documento de identidad / Cédula *
            </label>
            <input
              type="text"
              value={formData.identificacion}
              onChange={(e) => setFormData({ ...formData, identificacion: e.target.value })}
              placeholder="Ej. 1020304050"
              required
              className="w-full bg-[#F9F5F1] border border-[#E5DED4] rounded-xl px-3.5 py-2.5 text-sm text-[#333333] placeholder-[#64829E]/70 focus:outline-none focus:border-[#FF6B47] focus:ring-1 focus:ring-[#FF6B47]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#333333] mb-1">
              Teléfono / WhatsApp (opcional)
            </label>
            <input
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              placeholder="Ej. 3105557890"
              className="w-full bg-[#F9F5F1] border border-[#E5DED4] rounded-xl px-3.5 py-2.5 text-sm text-[#333333] placeholder-[#64829E]/70 focus:outline-none focus:border-[#FF6B47] focus:ring-1 focus:ring-[#FF6B47]"
            />
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
              <span>Guardar Cliente</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
