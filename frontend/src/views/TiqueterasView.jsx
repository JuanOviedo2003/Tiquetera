import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { buildActivacionUrl, copyToClipboard } from '../utils/qr';
import {
  Ticket,
  Copy,
  Check,
  Share2,
  Clock,
  RefreshCw,
  Loader2,
  Search,
  MessageCircle,
  X,
  Utensils,
  Trash2,
  Link2,
  CheckCircle2,
} from 'lucide-react';

export default function TiqueterasView({
  preselectedClient,
  onClearPreselectedClient,
  onShowToast,
  onAbrirConsumo,
}) {
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
  const [copiedLink, setCopiedLink] = useState(false);
  const [reissuing, setReissuing] = useState(false);

  // Modal: Eliminar Tiquetera PENDIENTE o FINALIZADA
  const [tiqueteraAEliminar, setTiqueteraAEliminar] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tiqs, clis] = await Promise.all([
        api.getTiqueteras({
          estado: filterEstado || undefined,
          cliente_nombre: filterNombre || undefined,
          restaurante_id: restauranteId,
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
  }, [filterEstado, filterNombre, restauranteId, onShowToast]);

  useEffect(() => {
    queueMicrotask(() => fetchData());
  }, [fetchData]);

  useEffect(() => {
    if (preselectedClient) {
      queueMicrotask(() => {
        setSelectedClienteId(preselectedClient.id);
        setIsCreateModalOpen(true);
        onClearPreselectedClient?.();
      });
    }
  }, [preselectedClient, onClearPreselectedClient]);

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

  const handleCopyCode = async (code) => {
    try {
      await copyToClipboard(code);
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

  const handleCopyActivationLink = async (code) => {
    const url = buildActivacionUrl(code);
    try {
      await copyToClipboard(url);
      setCopiedLink(true);
      onShowToast({
        type: 'success',
        title: 'Enlace de Activación Copiado',
        message: 'Comparte este enlace con el cliente para que active su tiquetera.',
      });
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      onShowToast({
        type: 'error',
        title: 'Aviso',
        message: 'No fue posible copiar el enlace en este dispositivo',
      });
    }
  };

  const handleShareWhatsApp = () => {
    if (!codeModalData) return;
    const urlActivar = buildActivacionUrl(codeModalData.codigo);
    const text = `¡Hola ${codeModalData.clienteNombre}! 🍽️\nTu tiquetera de ${codeModalData.totalAlmuerzos} almuerzos ha sido generada en nuestro restaurante.\n\n🔑 Tu código de activación es: *${codeModalData.codigo}*\n\nIngresa al portal para activarla y obtener tu QR de consumo:\n${urlActivar}\n\n⚠️ Este código vence en 48 horas. ¡Buen provecho!`;
    const cleanPhone = (codeModalData.clienteTelefono || '').replace(/\D/g, '');
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

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

  const handleConfirmarEliminar = async () => {
    if (!tiqueteraAEliminar) return;
    setDeleting(true);
    try {
      await api.deleteTiquetera(tiqueteraAEliminar.id);
      onShowToast({
        type: 'success',
        title: 'Tiquetera Eliminada',
        message: `La tiquetera de ${tiqueteraAEliminar.cliente_nombre || 'cliente'} fue eliminada exitosamente.`,
      });
      setTiqueteraAEliminar(null);
      fetchData();
    } catch (err) {
      onShowToast({
        type: 'error',
        title: 'No se pudo eliminar',
        message: err.message || 'Error al eliminar la tiquetera',
      });
    } finally {
      setDeleting(false);
    }
  };

  const pendientesCount = tiqueteras.filter((t) => t.estado === 'PENDIENTE').length;
  const activasCount = tiqueteras.filter((t) => t.estado === 'ACTIVA').length;
  const finalizadasCount = tiqueteras.filter((t) => t.estado === 'FINALIZADA').length;

  return (
    <div className="space-y-6">
      {/* Header and Call to Action — Botón Táctil Grande en Naranja Cálido (#FF6B47) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#333333] tracking-tight font-display">
            Control de Tiqueteras
          </h1>
          <p className="text-xs sm:text-sm text-[#64829E] mt-1">
            Emisión de pases de almuerzos prepagados y entrega de códigos a comensales
          </p>
        </div>

        <button
          onClick={() => {
            setCreateError(null);
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-full bg-[#FF6B47] hover:bg-[#E85A37] text-white font-semibold text-sm shadow-md shadow-[#FF6B47]/25 transition-all cursor-pointer shrink-0 touch-press tracking-wide"
        >
          <Utensils className="w-4 h-4" />
          <span>EMITIR TIQUETERA</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bistro-card p-3.5 sm:p-4">
          <span className="text-[11px] font-semibold text-[#64829E] block">
            Total Emitidas
          </span>
          <span className="text-xl sm:text-2xl font-bold text-[#333333] mt-0.5 block font-mono">
            {tiqueteras.length}
          </span>
        </div>
        <div className="bistro-card p-3.5 sm:p-4 border-[#FF6B47]/35">
          <span className="text-[11px] font-semibold text-[#FF6B47] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FF6B47]" />
            Por Activar
          </span>
          <span className="text-xl sm:text-2xl font-bold text-[#FF6B47] mt-0.5 block font-mono">
            {pendientesCount}
          </span>
        </div>
        <div className="bistro-card p-3.5 sm:p-4 border-[#64829E]/45">
          <span className="text-[11px] font-semibold text-[#64829E] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#64829E]" />
            En Consumo
          </span>
          <span className="text-xl sm:text-2xl font-bold text-[#64829E] mt-0.5 block font-mono">
            {activasCount}
          </span>
        </div>
        <div className="bistro-card p-3.5 sm:p-4">
          <span className="text-[11px] font-semibold text-[#64829E] block">
            Finalizadas
          </span>
          <span className="text-xl sm:text-2xl font-bold text-[#333333]/65 mt-0.5 block font-mono">
            {finalizadasCount}
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-[#64829E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filterNombre}
            onChange={(e) => setFilterNombre(e.target.value)}
            placeholder="Buscar por comensal o cliente..."
            className="w-full bg-white border border-[#E5DED4] rounded-xl pl-10 pr-9 py-2.5 text-sm text-[#333333] placeholder-[#64829E]/70 focus:outline-none focus:border-[#FF6B47] focus:ring-1 focus:ring-[#FF6B47] transition-all"
          />
          {filterNombre && (
            <button
              onClick={() => setFilterNombre('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64829E] hover:text-[#333333] p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div>
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="w-full bg-white border border-[#E5DED4] rounded-xl px-3.5 py-2.5 text-sm text-[#333333] focus:outline-none focus:border-[#FF6B47] focus:ring-1 focus:ring-[#FF6B47] transition-all"
          >
            <option value="">Todos los estados</option>
            <option value="PENDIENTE">PENDIENTE (por activar)</option>
            <option value="ACTIVA">ACTIVA (en uso)</option>
            <option value="FINALIZADA">FINALIZADA (agotada)</option>
          </select>
        </div>
      </div>

      {/* Tiqueteras Cards Grid — Tarjeta de Información de Saldo del Sistema de Diseño */}
      {loading ? (
        <div className="p-12 text-center text-[#64829E] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-[#FF6B47]" />
          <p className="text-sm font-medium">Cargando tiqueteras del sistema...</p>
        </div>
      ) : tiqueteras.length === 0 ? (
        <div className="bistro-card p-10 text-center">
          <Ticket className="w-12 h-12 text-[#64829E] mx-auto mb-3" />
          <h3 className="text-base font-semibold text-[#333333] font-display">
            No hay tiqueteras registradas
          </h3>
          <p className="text-xs sm:text-sm text-[#64829E] mt-1 max-w-sm mx-auto">
            {filterEstado || filterNombre
              ? 'No hay registros que coincidan con los filtros aplicados.'
              : 'Emite la primera tiquetera para entregar el pase de almuerzo al cliente.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tiqueteras.map((tiq) => {
            const isPendiente = tiq.estado === 'PENDIENTE';
            const isActiva = tiq.estado === 'ACTIVA';
            const isFinalizada = tiq.estado === 'FINALIZADA';

            const percentAvailable = Math.round(
              (tiq.almuerzos_disponibles / tiq.total_almuerzos) * 100
            );

            return (
              <div
                key={tiq.id}
                className={`ticket-silhouette transition-all flex flex-col justify-between ${
                  isPendiente
                    ? 'hover:border-[#FF6B47]/50'
                    : isActiva
                    ? 'hover:border-[#64829E]/60'
                    : 'opacity-85'
                }`}
              >
                {/* Parte superior del boleto: Cliente: Nombre + Saldo grande 27 / 30 Almuerzos */}
                <div className="p-5 pb-3.5 text-center relative">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono text-[#64829E] truncate">
                      {tiq.id}
                    </span>

                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider border shrink-0 ${
                        isPendiente
                          ? 'bg-[#FF6B47]/15 text-[#FF6B47] border-[#FF6B47]/30'
                          : isActiva
                          ? 'bg-[#64829E]/15 text-[#64829E] border-[#64829E]/35'
                          : 'bg-[#F9F5F1] text-[#64829E] border-[#E5DED4]'
                      }`}
                    >
                      {isPendiente ? 'Por Activar' : isActiva ? 'En Uso' : 'Agotada'}
                    </span>
                  </div>

                  <p className="text-sm text-[#333333]/80 truncate">
                    Cliente:{' '}
                    <strong className="font-semibold text-[#333333]">
                      {tiq.cliente_nombre || 'Cliente'}
                    </strong>
                  </p>

                  <div className="mt-1.5 flex items-baseline justify-center gap-1 font-display">
                    <span className="text-3xl font-bold text-[#333333]">
                      {tiq.almuerzos_disponibles}
                    </span>
                    <span className="text-xl font-semibold text-[#64829E]">
                      / {tiq.total_almuerzos}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-[#64829E] block">
                    Almuerzos
                  </span>
                </div>

                {/* Línea perforada con muescas laterales sobre fondo #F9F5F1 */}
                <div className="ticket-divider">
                  <div className="ticket-dashed-line" />
                </div>

                {/* Parte inferior del boleto: Barra de progreso, círculos y botones */}
                <div className="p-5 pt-3.5">
                  <div className="space-y-2.5 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#64829E] font-medium flex items-center gap-1">
                        <Utensils className="w-3.5 h-3.5 text-[#FF6B47]" />
                        Disponibles
                      </span>
                      <span className="font-mono font-semibold text-[#333333]">
                        {percentAvailable}%
                      </span>
                    </div>

                    {/* Barra de progreso en Azul Pizarra (#64829E) o Naranja Cálido (#FF6B47) */}
                    <div className="w-full h-2 bg-[#F9F5F1] rounded-full overflow-hidden border border-[#E5DED4]">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isFinalizada
                            ? 'bg-[#CFC7BC]'
                            : isPendiente
                            ? 'bg-[#FF6B47]'
                            : 'bg-[#64829E]'
                        }`}
                        style={{ width: `${percentAvailable}%` }}
                      />
                    </div>

                    {/* Puntos circulares de almuerzos (+15) */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {Array.from({ length: Math.min(tiq.total_almuerzos, 15) }).map((_, idx) => {
                        const isAvailable = idx < tiq.almuerzos_disponibles;
                        return (
                          <span
                            key={idx}
                            title={`Almuerzo ${idx + 1}`}
                            className={`w-2.5 h-2.5 rounded-full transition-colors ${
                              isAvailable
                                ? isPendiente
                                  ? 'bg-[#FF6B47]'
                                  : 'bg-[#64829E]'
                                : 'bg-[#F9F5F1] border border-[#D6CEC2]'
                            }`}
                          />
                        );
                      })}
                      {tiq.total_almuerzos > 15 && (
                        <span className="text-[11px] text-[#64829E] font-mono font-semibold self-center ml-0.5">
                          +{tiq.total_almuerzos - 15}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acciones inferiores de la tarjeta */}
                  <div className="pt-3 border-t border-[#E5DED4]">
                    {isPendiente ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenCodeModal(tiq)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-semibold bg-[#FF6B47] hover:bg-[#E85A37] text-white shadow-sm shadow-[#FF6B47]/20 transition-all cursor-pointer touch-press"
                        >
                          <Share2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Entregar Código</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTiqueteraAEliminar(tiq)}
                          className="p-2.5 rounded-xl text-xs font-semibold text-[#64829E] hover:text-[#FF6B47] bg-[#F9F5F1] hover:bg-[#FF6B47]/10 border border-[#E5DED4] hover:border-[#FF6B47]/40 transition-all cursor-pointer shrink-0 touch-press"
                          title="Eliminar tiquetera pendiente"
                          aria-label="Eliminar tiquetera pendiente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs text-[#64829E]">
                          <span className="flex items-center gap-1 text-[11px] font-medium">
                            <Clock className="w-3 h-3 text-[#64829E]" />
                            Emitida: {tiq.createdAt?.slice(0, 10)}
                          </span>
                          {isActiva && (
                            <span className="text-[#64829E] font-semibold text-[11px]">
                              Activa
                            </span>
                          )}
                        </div>
                        {isActiva && tiq.qr_token && onAbrirConsumo && (
                          <button
                            onClick={() => onAbrirConsumo(tiq.qr_token)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-semibold bg-[#64829E] hover:bg-[#526E88] text-white shadow-sm transition-all cursor-pointer touch-press"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Registrar consumo</span>
                          </button>
                        )}
                        {isFinalizada && (
                          <button
                            type="button"
                            onClick={() => setTiqueteraAEliminar(tiq)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-semibold text-[#FF6B47] hover:text-white bg-[#FF6B47]/10 hover:bg-[#FF6B47] border border-[#FF6B47]/30 transition-all cursor-pointer touch-press"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Eliminar tiquetera finalizada</span>
                          </button>
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
            <div className="p-3 rounded-xl bg-[#FF6B47]/10 border border-[#FF6B47]/30 text-[#FF6B47] text-xs font-medium">
              {createError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#333333] mb-1">
              Cliente titular *
            </label>
            <select
              value={selectedClienteId}
              onChange={(e) => setSelectedClienteId(e.target.value)}
              required
              className="w-full bg-[#F9F5F1] border border-[#E5DED4] rounded-xl px-3.5 py-2.5 text-sm text-[#333333] focus:outline-none focus:border-[#FF6B47] focus:ring-1 focus:ring-[#FF6B47]"
            >
              <option value="">Selecciona un cliente del directorio...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} (ID: {c.identificacion})
                </option>
              ))}
            </select>
            {clientes.length === 0 && (
              <p className="text-[11px] text-[#FF6B47] font-medium mt-1.5">
                Debes registrar comensales en la pestaña Clientes para poder emitirles una tiquetera.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#333333] mb-1">
              Total de almuerzos adquiridos *
            </label>

            <div className="grid grid-cols-4 gap-2 mb-2">
              {[10, 15, 20, 30].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setTotalAlmuerzos(num)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    Number(totalAlmuerzos) === num
                      ? 'bg-[#FF6B47] border-[#FF6B47] text-white shadow-xs'
                      : 'bg-[#F9F5F1] border-[#E5DED4] text-[#333333] hover:border-[#64829E]'
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
              className="w-full bg-[#F9F5F1] border border-[#E5DED4] rounded-xl px-3.5 py-2.5 text-sm text-[#333333] placeholder-[#64829E]/70 focus:outline-none focus:border-[#FF6B47] focus:ring-1 focus:ring-[#FF6B47]"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-[#F9F5F1] border border-[#E5DED4] text-xs text-[#64829E] space-y-1">
            <p className="font-semibold text-[#333333] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#FF6B47]" />
              Activación y Entrega:
            </p>
            <p>• La tiquetera se genera con un código único de 6 dígitos.</p>
            <p>• El comensal tiene 48 horas para activarla y definir su PIN.</p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E5DED4]">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64829E] hover:text-[#333333] hover:bg-[#F9F5F1] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creating || clientes.length === 0}
              className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[#FF6B47] hover:bg-[#E85A37] text-white shadow-md shadow-[#FF6B47]/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 touch-press"
            >
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ticket className="w-3.5 h-3.5" />}
              <span>Generar Tiquetera</span>
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
              <span className="text-xs text-[#64829E] font-medium block">
                Comensal: <strong className="text-[#333333] font-semibold">{codeModalData.clienteNombre}</strong>
              </span>

              <div className="my-3.5 py-5 px-4 sm:px-6 rounded-2xl bg-[#F9F5F1] border border-[#FF6B47]/40 flex flex-col items-center justify-center gap-1">
                <span className="text-[10px] font-bold text-[#FF6B47] tracking-widest uppercase">
                  Código de Activación
                </span>
                <span className="text-4xl sm:text-5xl font-mono font-bold text-[#333333] tracking-widest py-1">
                  {codeModalData.codigo}
                </span>
                <span className="text-[11px] text-[#64829E] mt-1 flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-[#FF6B47]" />
                  Válido por 48 horas (Vence: {codeModalData.fechaExpiracion?.slice(0, 16).replace('T', ' ')})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => handleCopyCode(codeModalData.codigo)}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer touch-press ${
                  copied
                    ? 'bg-[#64829E] text-white'
                    : 'bg-[#FF6B47] hover:bg-[#E85A37] text-white shadow-sm'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? '¡Copiado!' : 'Copiar Código'}
              </button>

              <button
                onClick={handleShareWhatsApp}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#64829E] hover:bg-[#526E88] text-white shadow-sm transition-all cursor-pointer touch-press"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar por WhatsApp</span>
              </button>
            </div>

            <div className="space-y-2">
              <div className="px-3.5 py-2 rounded-xl bg-[#F9F5F1] border border-[#E5DED4] flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-[#64829E] truncate select-all">
                  {buildActivacionUrl(codeModalData.codigo)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleCopyActivationLink(codeModalData.codigo)}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold border transition-all cursor-pointer touch-press ${
                  copiedLink
                    ? 'bg-[#64829E] text-white border-[#64829E]'
                    : 'bg-[#F9F5F1] hover:bg-[#64829E]/10 text-[#333333] border-[#E5DED4]'
                }`}
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5 text-[#64829E]" />}
                <span>{copiedLink ? '¡Enlace Copiado!' : 'Copiar Enlace de Activación para el Cliente'}</span>
              </button>
            </div>

            <div className="pt-3.5 border-t border-[#E5DED4] flex items-center justify-between text-xs">
              <span className="text-[#64829E] text-[11px]">
                ¿Código expirado o no recibido?
              </span>

              <button
                onClick={handleReemitirCodigo}
                disabled={reissuing}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF6B47] hover:text-[#E85A37] transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${reissuing ? 'animate-spin' : ''}`} />
                Reemitir nuevo código
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Confirmar eliminación de tiquetera PENDIENTE o FINALIZADA */}
      <Modal
        isOpen={Boolean(tiqueteraAEliminar)}
        onClose={() => !deleting && setTiqueteraAEliminar(null)}
        title={
          tiqueteraAEliminar?.estado === 'FINALIZADA'
            ? 'Eliminar Tiquetera Finalizada'
            : 'Eliminar Tiquetera por Activar'
        }
        maxWidth="max-w-md"
      >
        {tiqueteraAEliminar && (
          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-[#333333]/85">
              ¿Estás seguro de eliminar la tiquetera{' '}
              {tiqueteraAEliminar.estado === 'FINALIZADA' ? 'finalizada' : 'pendiente'} de{' '}
              <strong className="text-[#333333] font-semibold">
                {tiqueteraAEliminar.cliente_nombre || 'este cliente'}
              </strong>{' '}
              por <strong className="text-[#FF6B47] font-mono">{tiqueteraAEliminar.total_almuerzos}</strong>{' '}
              almuerzos?
            </p>
            <p className="text-xs text-[#64829E]">
              {tiqueteraAEliminar.estado === 'FINALIZADA'
                ? 'Esta tiquetera ya agotó todos sus almuerzos disponibles y será retirada del listado.'
                : 'Esta acción invalidará su código de activación y eliminará el registro ya que aún no ha sido activada.'}
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5DED4]">
              <button
                type="button"
                onClick={() => setTiqueteraAEliminar(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64829E] hover:text-[#333333] hover:bg-[#F9F5F1] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminar}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#FF6B47] hover:bg-[#E85A37] text-white shadow-sm transition-all cursor-pointer disabled:opacity-50 touch-press"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Eliminar Tiquetera</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
