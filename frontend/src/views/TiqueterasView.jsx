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
  ShieldAlert,
  Search,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';

export default function TiqueterasView({ preselectedClient, onClearPreselectedClient, onShowToast }) {
  const { restauranteId } = useAuth();
  const [tiqueteras, setTiqueteras] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filterEstado, setFilterEstado] = useState('');
  const [filterNombre, setFilterNombre] = useState('');

  // Modal: Crear Tiquetera (HU-R3)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [totalAlmuerzos, setTotalAlmuerzos] = useState(15);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Modal: Entrega de Código de Activación (HU-R12)
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
        message: err.message || 'Error al cargar información',
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

  // Manejo de creación (HU-R3)
  const handleCreateTiquetera = async (e) => {
    e.preventDefault();
    if (!selectedClienteId) {
      setCreateError('Debes seleccionar un cliente');
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
        message: 'Tiquetera creada en estado PENDIENTE con código de activación',
      });

      setIsCreateModalOpen(false);
      setSelectedClienteId('');
      setTotalAlmuerzos(15);
      fetchData();

      // Abrir inmediatamente modal de entrega del código (HU-R12)
      setCodeModalData({
        id: tiq.id,
        codigo: tiq.codigo_activacion,
        clienteNombre: clienteObj?.nombre || 'Cliente',
        clienteTelefono: clienteObj?.telefono || '',
        totalAlmuerzos: tiq.total_almuerzos,
        fechaExpiracion: tiq.fecha_expiracion_codigo,
      });
    } catch (err) {
      setCreateError(err.message || 'Error al crear la tiquetera');
    } finally {
      setCreating(false);
    }
  };

  // Consultar código de activación de una tiquetera existente (HU-R12)
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
        message: err.message || 'Error al consultar código de activación',
      });
    }
  };

  // Copiar código al portapapeles (HU-R12)
  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      onShowToast({
        type: 'success',
        message: '¡Código de activación copiado al portapapeles!',
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      onShowToast({ type: 'error', message: 'No se pudo copiar automáticamente' });
    }
  };

  // Compartir por WhatsApp (HU-R12)
  const handleShareWhatsApp = () => {
    if (!codeModalData) return;
    const text = `¡Hola ${codeModalData.clienteNombre}! 🍽️\nTu tiquetera de ${codeModalData.totalAlmuerzos} almuerzos ha sido generada en nuestro restaurante.\n\n🔑 Tu código de activación es: *${codeModalData.codigo}*\n\nIngresa al portal para activarla y obtener tu QR:\n${window.location.origin}\n\n⚠️ Este código vence en 48 horas. ¡Buen provecho!`;
    const cleanPhone = (codeModalData.clienteTelefono || '').replace(/\D/g, '');
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  // Reemitir código (RF-04)
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
        message: 'Código de activación reemitido con nueva vigencia de 48h',
      });
      fetchData();
    } catch (err) {
      onShowToast({
        type: 'error',
        message: err.message || 'Error al reemitir código',
      });
    } finally {
      setReissuing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Gestión y Emisión de Tiqueteras
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold">
              HU-R3 · HU-R12
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Emite tiqueteras a clientes y entrega sus códigos de activación de 6 dígitos
          </p>
        </div>

        <button
          onClick={() => {
            setCreateError(null);
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-bold text-sm shadow-lg shadow-orange-500/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nueva Tiquetera
        </button>
      </div>

      {/* KPI Stats overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800/80">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Total Emitidas
          </span>
          <span className="text-2xl font-black text-white mt-1 block">
            {tiqueteras.length}
          </span>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">
            Pendientes (Por Activar)
          </span>
          <span className="text-2xl font-black text-amber-300 mt-1 block">
            {tiqueteras.filter((t) => t.estado === 'PENDIENTE').length}
          </span>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
            Activas en Uso
          </span>
          <span className="text-2xl font-black text-emerald-300 mt-1 block">
            {tiqueteras.filter((t) => t.estado === 'ACTIVA').length}
          </span>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800/80">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Finalizadas
          </span>
          <span className="text-2xl font-black text-slate-400 mt-1 block">
            {tiqueteras.filter((t) => t.estado === 'FINALIZADA').length}
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterNombre}
            onChange={(e) => setFilterNombre(e.target.value)}
            placeholder="Filtrar por nombre de cliente..."
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-12 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div>
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          >
            <option value="">Todos los estados</option>
            <option value="PENDIENTE">PENDIENTE (con código)</option>
            <option value="ACTIVA">ACTIVA (consumiendo)</option>
            <option value="FINALIZADA">FINALIZADA (agotada)</option>
          </select>
        </div>
      </div>

      {/* Tiqueteras List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <p className="text-sm">Cargando tiqueteras...</p>
        </div>
      ) : tiqueteras.length === 0 ? (
        <div className="p-12 text-center glass-panel rounded-2xl border border-slate-800/80">
          <Ticket className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No hay tiqueteras</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            {filterEstado || filterNombre
              ? 'No hay tiqueteras que coincidan con los filtros aplicados.'
              : 'Emite la primera tiquetera para entregar el código de activación al cliente.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiqueteras.map((tiq) => {
            const isPendiente = tiq.estado === 'PENDIENTE';
            const isActiva = tiq.estado === 'ACTIVA';
            const isFinalizada = tiq.estado === 'FINALIZADA';

            return (
              <div
                key={tiq.id}
                className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[11px] font-mono font-semibold text-slate-400 block">
                        {tiq.id}
                      </span>
                      <h4 className="text-base font-bold text-white mt-0.5">
                        {tiq.cliente_nombre || 'Cliente sin nombre'}
                      </h4>
                    </div>

                    <span
                      className={`text-[11px] px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wider border ${
                        isPendiente
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : isActiva
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-700/20 text-slate-400 border-slate-700/40'
                      }`}
                    >
                      {tiq.estado}
                    </span>
                  </div>

                  {/* Lunch balance progress */}
                  <div className="space-y-1.5 py-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-400">Almuerzos Disponibles:</span>
                      <span className="text-white font-bold">
                        {tiq.almuerzos_disponibles} / {tiq.total_almuerzos}
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isFinalizada
                            ? 'bg-slate-600'
                            : 'bg-gradient-to-r from-orange-500 to-amber-400'
                        }`}
                        style={{
                          width: `${(tiq.almuerzos_disponibles / tiq.total_almuerzos) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer action */}
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                  {isPendiente ? (
                    <button
                      onClick={() => handleOpenCodeModal(tiq)}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Entregar Código de Activación
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      Creada: {tiq.createdAt?.slice(0, 10)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Crear Tiquetera (HU-R3) */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Nueva Tiquetera (HU-R3)"
      >
        <form onSubmit={handleCreateTiquetera} className="space-y-5">
          {createError && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs">
              {createError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Cliente Asociado *
            </label>
            <select
              value={selectedClienteId}
              onChange={(e) => setSelectedClienteId(e.target.value)}
              required
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            >
              <option value="">Selecciona un cliente...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} (ID: {c.identificacion})
                </option>
              ))}
            </select>
            {clientes.length === 0 && (
              <p className="text-[11px] text-amber-400 mt-1">
                ⚠️ Primero debes registrar al menos un cliente en la pestaña Clientes.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Total de Almuerzos Adquiridos *
            </label>

            {/* Quick buttons */}
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[10, 15, 20, 30].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setTotalAlmuerzos(num)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    totalAlmuerzos === num
                      ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {num} almuerzos
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
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Ciclo de Vida de la Tiquetera:
            </p>
            <p>• Nace en estado <strong>PENDIENTE</strong> con código aleatorio de 6 dígitos.</p>
            <p>• El código de activación tiene una validez de <strong>48 horas</strong>.</p>
            <p>• El cliente la activará desde cualquier navegador creando su PIN personal.</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creating || clientes.length === 0}
              className="px-5 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 shadow-md shadow-orange-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />}
              Generar Tiquetera
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Entrega de Código de Activación (HU-R12) */}
      <Modal
        isOpen={Boolean(codeModalData)}
        onClose={() => setCodeModalData(null)}
        title="Código de Activación para el Cliente (HU-R12)"
      >
        {codeModalData && (
          <div className="space-y-6">
            <div className="text-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Cliente: {codeModalData.clienteNombre}
              </span>

              {/* 6-Digit Big Code Badge */}
              <div className="my-4 py-5 px-6 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border-2 border-dashed border-amber-500/50 shadow-inner flex flex-col items-center justify-center gap-1">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                  Código de Activación (6 dígitos)
                </span>
                <span className="text-4xl sm:text-5xl font-mono font-black text-white tracking-widest text-shadow">
                  {codeModalData.codigo}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  Válido por 48 horas (Vence: {codeModalData.fechaExpiracion?.slice(0, 16).replace('T', ' ')})
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleCopyCode(codeModalData.codigo)}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer border ${
                  copied
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? '¡Copiado!' : 'Copiar Código'}
              </button>

              <button
                onClick={handleShareWhatsApp}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                Compartir por WhatsApp
              </button>
            </div>

            {/* Re-issue expired code option */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                ¿Código vencido o no entregado?
              </span>

              <button
                onClick={handleReemitirCodigo}
                disabled={reissuing}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${reissuing ? 'animate-spin' : ''}`} />
                Reemitir nuevo código
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
