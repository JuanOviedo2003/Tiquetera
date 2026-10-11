import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import {
  Ticket,
  Plus,
  Copy,
  Check,
  Share2,
  Clock,
  RefreshCw,
  Loader2,
  User,
  Search,
  MessageCircle,
  X,
  Utensils,
  ChevronRight,
} from 'lucide-react';

export default function TiqueterasView({ preselectedClient, onClearPreselectedClient, onShowToast }) {
  const { restauranteId } = useAuth();
  const [tiqueteras, setTiqueteras] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filterEstado, setFilterEstado] = useState('');
  const [filterNombre, setFilterNombre] = useState('');

  // Modal: Crear Tiquetera
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [totalAlmuerzos, setTotalAlmuerzos] = useState(15);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Modal: Entrega de Código de Activación
  const [codeModalData, setCodeModalData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [reissuing, setReissuing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tiqs, clis] = await Promise.all([
        api.getTiqueteras({
          estado: filterEstado || undefined,
          cliente_nombre: filterNombre || undefined,
        }),
        api.getClientes(restauranteId),
      ]);
      setTiqueteras(tiqs || []);
      setClientes(clis || []);
    } catch (err) {
      onShowToast({
        type: 'error',
        title: 'Error de Lectura',
        message: err.message || 'No fue posible cargar las tiqueteras del restaurante',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterEstado, filterNombre, restauranteId]);

  // Si llega cliente preseleccionado desde ClientesView
  useEffect(() => {
    if (preselectedClient) {
      setSelectedClienteId(preselectedClient.id);
      setIsCreateModalOpen(true);
      if (onClearPreselectedClient) onClearPreselectedClient();
    }
  }, [preselectedClient]);

  // Manejo de creación
  const handleCreateTiquetera = async (e) => {
    e.preventDefault();
    if (!selectedClienteId) {
      setCreateError('Debes seleccionar un cliente del directorio');
      return;
    }
    if (!totalAlmuerzos || Number(totalAlmuerzos) <= 0) {
      setCreateError('La cantidad de almuerzos debe ser mayor a 0');
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      const res = await api.createTiquetera({
        cliente_id: selectedClienteId,
        total_almuerzos: Number(totalAlmuerzos),
        restaurante_id: restauranteId,
      });

      const tiq = res.tiquetera;
      const clienteObj = clientes.find((c) => String(c.id) === String(selectedClienteId));

      onShowToast({
        type: 'success',
        title: 'Tiquetera Emitida',
        message: `Pase de ${tiq.total_almuerzos} almuerzos generado con código de activación.`,
      });

      setIsCreateModalOpen(false);
      setSelectedClienteId('');
      setTotalAlmuerzos(15);
      fetchData();

      // Abrir inmediatamente modal de entrega del código
      setCodeModalData({
        id: tiq.id,
        codigo: tiq.codigo_activacion,
        clienteNombre: clienteObj?.nombre || 'Cliente',
        clienteTelefono: clienteObj?.telefono || '',
        totalAlmuerzos: tiq.total_almuerzos,
        fechaExpiracion: tiq.fecha_expiracion_codigo,
      });
    } catch (err) {
      setCreateError(err.message || 'Error al emitir la tiquetera');
    } finally {
      setCreating(false);
    }
  };

  // Consultar código de activación de una tiquetera existente
  const handleOpenCodeModal = async (tiquetera) => {
    try {
      const codeInfo = await api.getCodigoActivacion(tiquetera.id);
      const clienteObj = clientes.find((c) => String(c.id) === String(tiquetera.cliente_id));

      setCodeModalData({
        id: tiquetera.id,
        codigo: codeInfo.codigo_activacion,
        clienteNombre: tiquetera.cliente_nombre || clienteObj?.nombre || 'Cliente',
        clienteTelefono: clienteObj?.telefono || '',
        totalAlmuerzos: tiquetera.total_almuerzos,
        fechaExpiracion: codeInfo.fecha_expiracion_codigo,
      });
    } catch (err) {
      onShowToast({
        type: 'error',
        title: 'Error de Consulta',
        message: err.message || 'No se pudo obtener el código de activación',
      });
    }
  };

  // Copiar código al portapapeles
  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      onShowToast({
        type: 'success',
        title: '¡Código Copiado!',
        message: `Código ${code} copiado en el portapapeles para compartir.`,
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      onShowToast({
        type: 'error',
        title: 'Aviso',
        message: 'No fue posible copiar al portapapeles en este dispositivo',
      });
    }
  };

  // Compartir por WhatsApp
  const handleShareWhatsApp = () => {
    if (!codeModalData) return;
    const text = `¡Hola ${codeModalData.clienteNombre}! 🍽️\nTu tiquetera de ${codeModalData.totalAlmuerzos} almuerzos ha sido generada en nuestro restaurante.\n\n🔑 Tu código de activación es: *${codeModalData.codigo}*\n\nIngresa al portal para activarla y obtener tu QR de consumo:\n${window.location.origin}\n\n⚠️ Este código vence en 48 horas. ¡Buen provecho!`;
    const cleanPhone = (codeModalData.clienteTelefono || '').replace(/\D/g, '');
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  // Reemitir código
  const handleReemitirCodigo = async () => {
    if (!codeModalData) return;
    setReissuing(true);
    try {
      const res = await api.reemitirCodigoActivacion(codeModalData.id);
      setCodeModalData((prev) => ({
        ...prev,
        codigo: res.tiquetera.codigo_activacion,
        fechaExpiracion: res.tiquetera.fecha_expiracion_codigo,
      }));
      onShowToast({
        type: 'success',
        title: 'Nuevo Código Generado',
        message: 'Nueva vigencia de 48 horas establecida para la activación.',
      });
      fetchData();
    } catch (err) {
      onShowToast({
        type: 'error',
        title: 'Error al Reemitir',
        message: err.message || 'No se pudo generar un nuevo código',
      });
    } finally {
      setReissuing(false);
    }
  };

  const pendientesCount = tiqueteras.filter((t) => t.estado === 'PENDIENTE').length;
  const activasCount = tiqueteras.filter((t) => t.estado === 'ACTIVA').length;
  const finalizadasCount = tiqueteras.filter((t) => t.estado === 'FINALIZADA').length;

  return (
    <div className="space-y-6">
      {/* Header and Call to Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-display">
            Control de Tiqueteras
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Emisión de pases de almuerzos prepagados y entrega de códigos a comensales
          </p>
        </div>

        <button
          onClick={() => {
            setCreateError(null);
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#e0533c] hover:bg-[#c94530] text-white font-bold text-sm shadow-md shadow-[#e0533c]/20 transition-all cursor-pointer shrink-0 touch-press"
        >
          <Plus className="w-4 h-4" />
          <span>Emitir Tiquetera</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-[#151821] p-3.5 sm:p-4 rounded-xl border border-[#252a36]">
          <span className="text-[11px] font-semibold text-slate-400 block">
            Total Emitidas
          </span>
          <span className="text-xl sm:text-2xl font-bold text-white mt-0.5 block font-mono">
            {tiqueteras.length}
          </span>
        </div>
        <div className="bg-[#151821] p-3.5 sm:p-4 rounded-xl border border-[#e5a93c]/30">
          <span className="text-[11px] font-semibold text-[#e5a93c] block flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e5a93c]" />
            Por Activar
          </span>
          <span className="text-xl sm:text-2xl font-bold text-[#e5a93c] mt-0.5 block font-mono">
            {pendientesCount}
          </span>
        </div>
        <div className="bg-[#151821] p-3.5 sm:p-4 rounded-xl border border-emerald-500/30">
          <span className="text-[11px] font-semibold text-emerald-400 block flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            En Consumo
          </span>
          <span className="text-xl sm:text-2xl font-bold text-emerald-400 mt-0.5 block font-mono">
            {activasCount}
          </span>
        </div>
        <div className="bg-[#151821] p-3.5 sm:p-4 rounded-xl border border-[#252a36]">
          <span className="text-[11px] font-semibold text-slate-400 block">
            Finalizadas
          </span>
          <span className="text-xl sm:text-2xl font-bold text-slate-400 mt-0.5 block font-mono">
            {finalizadasCount}
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filterNombre}
            onChange={(e) => setFilterNombre(e.target.value)}
            placeholder="Buscar por comensal o cliente..."
            className="w-full bg-[#151821] border border-[#262c38] rounded-xl pl-10 pr-9 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#e0533c] focus:ring-1 focus:ring-[#e0533c] transition-all"
          />
          {filterNombre && (
            <button
              onClick={() => setFilterNombre('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div>
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="w-full bg-[#151821] border border-[#262c38] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#e0533c] focus:ring-1 focus:ring-[#e0533c] transition-all"
          >
            <option value="">Todos los estados</option>
            <option value="PENDIENTE">PENDIENTE (con código)</option>
            <option value="ACTIVA">ACTIVA (en uso)</option>
            <option value="FINALIZADA">FINALIZADA (agotada)</option>
          </select>
        </div>
      </div>

      {/* Tiqueteras Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-[#e0533c]" />
          <p className="text-sm">Cargando tiqueteras del sistema...</p>
        </div>
      ) : tiqueteras.length === 0 ? (
        <div className="p-10 text-center bg-[#151821] rounded-2xl border border-[#252a37]">
          <Ticket className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white font-display">No hay tiqueteras registradas</h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            {filterEstado || filterNombre
              ? 'No hay registros que coincidan con los filtros aplicados.'
              : 'Emite la primera tiquetera para entregar el pase de almuerzo al cliente.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiqueteras.map((tiq) => {
            const isPendiente = tiq.estado === 'PENDIENTE';
            const isActiva = tiq.estado === 'ACTIVA';
            const isFinalizada = tiq.estado === 'FINALIZADA';

            // Porcentaje de almuerzos disponibles
            const percentAvailable = Math.round(
              (tiq.almuerzos_disponibles / tiq.total_almuerzos) * 100
            );

            return (
              <div
                key={tiq.id}
                className={`ticket-silhouette transition-all flex flex-col justify-between ${
                  isPendiente
                    ? 'border-[#e5a93c]/30 hover:border-[#e5a93c]/50'
                    : isActiva
                    ? 'border-emerald-500/30 hover:border-emerald-500/50'
                    : 'border-[#262c37] opacity-80'
                }`}
              >
                {/* Upper ticket stub */}
                <div className="p-4 sm:p-5 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-400">
                          {tiq.id}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1 truncate font-display">
                        {tiq.cliente_nombre || 'Cliente sin nombre'}
                      </h3>
                    </div>

                    {/* Stamp badge */}
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border shrink-0 ${
                        isPendiente
                          ? 'bg-[#e5a93c]/15 text-[#e5a93c] border-[#e5a93c]/30'
                          : isActiva
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {isPendiente ? 'Por Activar' : isActiva ? 'En Uso' : 'Agotada'}
                    </span>
                  </div>
                </div>

                {/* Perforation divider tear line */}
                <div className="ticket-divider">
                  <div className="ticket-dashed-line" />
                </div>

                {/* Lower ticket stub (Lunch balance & details) */}
                <div className="p-4 sm:p-5 pt-3">
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Utensils className="w-3 h-3 text-slate-400" />
                        Saldo de almuerzos:
                      </span>
                      <span className="font-mono font-bold text-white">
                        <span className="text-[#e5a93c]">{tiq.almuerzos_disponibles}</span>
                        <span className="text-slate-500"> / </span>
                        <span>{tiq.total_almuerzos}</span>
                      </span>
                    </div>

                    {/* Progress visualizer */}
                    <div className="w-full h-2 bg-[#0e1015] rounded-full overflow-hidden border border-[#252b36]">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isFinalizada
                            ? 'bg-slate-600'
                            : isPendiente
                            ? 'bg-[#e5a93c]'
                            : 'bg-emerald-400'
                        }`}
                        style={{ width: `${percentAvailable}%` }}
                      />
                    </div>

                    {/* Mini lunch punch-tokens (up to 15) */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {Array.from({ length: Math.min(tiq.total_almuerzos, 15) }).map((_, idx) => {
                        const isAvailable = idx < tiq.almuerzos_disponibles;
                        return (
                          <span
                            key={idx}
                            title={`Almuerzo ${idx + 1}`}
                            className={`w-2.5 h-2.5 rounded-full transition-colors ${
                              isAvailable
                                ? isPendiente
                                  ? 'bg-[#e5a93c]/80'
                                  : 'bg-emerald-400'
                                : 'bg-[#252b36] border border-slate-700/50'
                            }`}
                          />
                        );
                      })}
                      {tiq.total_almuerzos > 15 && (
                        <span className="text-[10px] text-slate-400 font-mono self-center">
                          +{tiq.total_almuerzos - 15}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card bottom action */}
                  <div className="pt-3 border-t border-[#232835]">
                    {isPendiente ? (
                      <button
                        onClick={() => handleOpenCodeModal(tiq)}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold bg-[#e5a93c]/15 text-[#e5a93c] hover:bg-[#e5a93c] hover:text-[#0e1015] border border-[#e5a93c]/40 transition-all cursor-pointer touch-press"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Entregar Código de Activación</span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3 text-slate-400" />
                          Emitida: {tiq.createdAt?.slice(0, 10)}
                        </span>
                        {isActiva && (
                          <span className="text-emerald-400 font-medium text-[11px]">
                            Consumiendo
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Crear Nueva Tiquetera */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Emitir Nueva Tiquetera"
      >
        <form onSubmit={handleCreateTiquetera} className="space-y-4">
          {createError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {createError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Cliente titular *
            </label>
            <select
              value={selectedClienteId}
              onChange={(e) => setSelectedClienteId(e.target.value)}
              required
              className="w-full bg-[#0e1015] border border-[#272d3b] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#e0533c] focus:ring-1 focus:ring-[#e0533c]"
            >
              <option value="">Selecciona un cliente del directorio...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} (ID: {c.identificacion})
                </option>
              ))}
            </select>
            {clientes.length === 0 && (
              <p className="text-[11px] text-[#e5a93c] mt-1.5">
                Debes registrar comensales en la pestaña Clientes para poder emitirles una tiquetera.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Total de almuerzos adquiridos *
            </label>

            {/* Quick Presets */}
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[10, 15, 20, 30].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setTotalAlmuerzos(num)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    Number(totalAlmuerzos) === num
                      ? 'bg-[#e0533c]/20 border-[#e0533c] text-white'
                      : 'bg-[#0e1015] border-[#252a36] text-slate-400 hover:text-white'
                  }`}
                >
                  {num} comidas
                </button>
              ))}
            </div>

            <input
              type="number"
              min="1"
              value={totalAlmuerzos}
              onChange={(e) => setTotalAlmuerzos(e.target.value)}
              placeholder="O ingresa un número personalizado..."
              required
              className="w-full bg-[#0e1015] border border-[#272d3b] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#e0533c] focus:ring-1 focus:ring-[#e0533c]"
            />
          </div>

          <div className="p-3 rounded-xl bg-[#0e1015] border border-[#242936] text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#e5a93c]" />
              Activación y Entrega:
            </p>
            <p>• La tiquetera se genera con un código único de 6 dígitos.</p>
            <p>• El comensal tiene 48 horas para activarla y definir su PIN.</p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#232835]">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creating || clientes.length === 0}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#e0533c] hover:bg-[#c94530] text-white shadow-md shadow-[#e0533c]/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 touch-press"
            >
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ticket className="w-3.5 h-3.5" />}
              Generar Tiquetera
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Entrega de Código de Activación */}
      <Modal
        isOpen={Boolean(codeModalData)}
        onClose={() => setCodeModalData(null)}
        title="Código de Activación del Pase"
      >
        {codeModalData && (
          <div className="space-y-5">
            <div className="text-center">
              <span className="text-xs text-slate-400 font-semibold block">
                Comensal: <strong className="text-white">{codeModalData.clienteNombre}</strong>
              </span>

              {/* Big 6-Digit Code Voucher Card */}
              <div className="my-3.5 py-5 px-4 sm:px-6 rounded-2xl bg-[#0e1015] border border-[#e5a93c]/40 shadow-inner flex flex-col items-center justify-center gap-1">
                <span className="text-[10px] font-bold text-[#e5a93c] tracking-widest uppercase">
                  Código de Activación
                </span>
                <span className="text-4xl sm:text-5xl font-mono font-bold text-white tracking-widest py-1">
                  {codeModalData.codigo}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#e5a93c]" />
                  Válido por 48 horas (Vence: {codeModalData.fechaExpiracion?.slice(0, 16).replace('T', ' ')})
                </span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => handleCopyCode(codeModalData.codigo)}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer border touch-press ${
                  copied
                    ? 'bg-emerald-500 text-[#0e1015] border-emerald-400'
                    : 'bg-[#202533] hover:bg-[#2b3244] text-white border-[#2d3547]'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? '¡Copiado!' : 'Copiar Código'}
              </button>

              <button
                onClick={handleShareWhatsApp}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-[#128c7e] hover:bg-[#075e54] text-white shadow-md shadow-[#128c7e]/20 transition-all cursor-pointer touch-press"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar por WhatsApp</span>
              </button>
            </div>

            {/* Reissue Expired Code Option */}
            <div className="pt-3.5 border-t border-[#232835] flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">
                ¿Código expirado o no recibido?
              </span>

              <button
                onClick={handleReemitirCodigo}
                disabled={reissuing}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#e5a93c] hover:text-[#f3be5d] transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${reissuing ? 'animate-spin' : ''}`} />
                Reemitir nuevo código
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
