import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import HistorialMovimientos from '../components/HistorialMovimientos';
import QrPassCard from '../components/QrPassCard';
import {
  Utensils,
  KeyRound,
  RefreshCw,
  History,
  Loader2,
  ShieldCheck,
  Ticket,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

/**
 * HU-C5: Consulta pública de saldo (total, consumidos y disponibles) e historial por día sin cuenta.
 * HU-C4: Descarga de imagen QR y copia de URL de consulta.
 * HU-C3: Regeneración de PIN de 6 dígitos en cualquier momento invalidando el anterior.
 * Diseñado según "Tarjeta de Información de Saldo" y "PANTALLA DE SALDO DE USUARIO" del Sistema de Diseño Integral.
 */
export default function ClienteTiqueteraView({
  qrToken,
  onGoToActivar,
  onShowToast,
}) {
  const [vista, setVista] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fechaFiltro, setFechaFiltro] = useState('');

  // Modal HU-C3: Regenerar PIN (requiere PIN anterior)
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinAnterior, setPinAnterior] = useState('');
  const [nuevoPin, setNuevoPin] = useState('');
  const [confirmarPin, setConfirmarPin] = useState('');
  const [pinError, setPinError] = useState(null);
  const [regenerating, setRegenerating] = useState(false);

  const cargarVistaPublica = useCallback(async () => {
    if (!qrToken) {
      setError('No se proporcionó un token QR válido.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.getVistaPublica(qrToken);
      setVista(data);
    } catch (err) {
      setError(err.message || 'No se encontró una tiquetera asociada a este código QR.');
    } finally {
      setLoading(false);
    }
  }, [qrToken]);

  useEffect(() => {
    queueMicrotask(() => cargarVistaPublica());
  }, [cargarVistaPublica]);

  const handleRegenerarPin = async (e) => {
    e.preventDefault();
    const cleanPinAnterior = pinAnterior.trim();
    const cleanPin = nuevoPin.trim();

    if (!/^\d{6}$/.test(cleanPinAnterior)) {
      setPinError('Debes ingresar tu PIN actual (anterior) de 6 dígitos.');
      return;
    }

    if (!/^\d{6}$/.test(cleanPin)) {
      setPinError('El nuevo PIN debe tener exactamente 6 dígitos numéricos.');
      return;
    }

    if (cleanPin !== confirmarPin.trim()) {
      setPinError('El nuevo PIN y su confirmación no coinciden. Verifica ambos campos.');
      return;
    }

    setRegenerating(true);
    setPinError(null);
    try {
      await api.regenerarPin({
        qr_token: qrToken,
        pin_anterior: cleanPinAnterior,
        nuevo_pin: cleanPin,
      });

      setIsPinModalOpen(false);
      setPinAnterior('');
      setNuevoPin('');
      setConfirmarPin('');

      onShowToast?.({
        type: 'success',
        title: 'PIN Renovado',
        message: 'Tu nuevo PIN de 6 dígitos está activo y el anterior quedó invalidado.',
      });
    } catch (err) {
      setPinError(err.message || 'No se pudo regenerar el PIN.');
    } finally {
      setRegenerating(false);
    }
  };

  const openPinModal = () => {
    setPinAnterior('');
    setNuevoPin('');
    setConfirmarPin('');
    setPinError(null);
    setIsPinModalOpen(true);
  };

  const inputClass =
    'w-full bg-[#F9F5F1] border border-[#E5DED4] rounded-xl px-3.5 py-2.5 text-sm text-[#333333] placeholder-[#64829E]/65 focus:outline-none focus:border-[#FF6B47] focus:ring-1 focus:ring-[#FF6B47] transition-all';

  const isActiva = vista?.estado === 'ACTIVA';
  const isFinalizada = vista?.estado === 'FINALIZADA';
  const percentAvailable = vista?.saldo?.total
    ? Math.round((vista.saldo.disponibles / vista.saldo.total) * 100)
    : 0;

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#F9F5F1] text-[#333333] flex flex-col justify-between selection:bg-[#FF6B47] selection:text-white">
      {/* Header superior del cliente */}
      <header className="sticky top-0 z-40 w-full bg-white/95 border-b border-[#E5DED4] backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/favicon.svg?v=3"
              alt="Logo Tiquetera"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shadow-sm shadow-[#FF6B47]/25 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-xl font-semibold tracking-tight text-[#333333] font-display truncate">
                  Mi Tiquetera
                </span>
              </div>
              <p className="text-[11px] text-[#64829E] font-medium truncate">
                Consulta pública sin cuenta
              </p>
            </div>
          </div>

          {/* En desktop aparece en el header con altura h-11 uniforme; en móvil pasa a la barra inferior */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {onGoToActivar && (
              <button
                type="button"
                onClick={onGoToActivar}
                className="h-11 inline-flex items-center gap-2 px-4 rounded-xl text-xs font-semibold text-[#333333] hover:text-[#FF6B47] bg-[#F9F5F1] hover:bg-[#FF6B47]/10 border border-[#E5DED4] hover:border-[#FF6B47]/40 transition-all cursor-pointer"
              >
                <Ticket className="w-4 h-4 text-[#FF6B47]" />
                <span>Activar otra tiquetera</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Cuerpo principal */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28 md:pb-10 space-y-6">
        {loading ? (
          <div className="p-16 text-center text-[#64829E] flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#FF6B47]" />
            <p className="text-sm font-medium">Consultando saldo y movimientos de tu tiquetera...</p>
          </div>
        ) : error ? (
          <div className="bistro-card p-8 max-w-lg mx-auto text-center space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#FF6B47]/15 text-[#FF6B47] border border-[#FF6B47]/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-[#333333] font-display">
              No se pudo abrir la tiquetera
            </h2>
            <p className="text-xs sm:text-sm text-[#64829E]">{error}</p>
            {onGoToActivar && (
              <button
                type="button"
                onClick={onGoToActivar}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FF6B47] hover:bg-[#E85A37] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer touch-press"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al portal de activación y consulta</span>
              </button>
            )}
          </div>
        ) : (
          vista && (
            <>
              {/* Encabezado y botones en Desktop (en móvil pasan a la barra fija inferior) */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-[#64829E] block">
                    Titular de la tiquetera
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-semibold text-[#333333] tracking-tight font-display">
                    {vista.cliente_nombre}
                  </h1>
                </div>

                <div className="hidden md:flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={cargarVistaPublica}
                    className="h-11 inline-flex items-center justify-center gap-2 px-4 rounded-xl text-xs font-semibold bg-[#64829E] hover:bg-[#526E88] text-white shadow-sm transition-all cursor-pointer touch-press"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Actualizar Saldo</span>
                  </button>

                  {isActiva && (
                    <button
                      type="button"
                      onClick={openPinModal}
                      className="h-11 inline-flex items-center justify-center gap-2 px-4 rounded-xl text-xs font-semibold bg-[#FF6B47] hover:bg-[#E85A37] text-white shadow-sm shadow-[#FF6B47]/20 transition-all cursor-pointer touch-press"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Regenerar PIN Personal</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Grid superior: Tarjeta de Información de Saldo (HU-C5) + Tarjeta de Código QR (HU-C4) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Columna izquierda: Tarjeta de Saldo e Historial (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Tarjeta de Información de Saldo fiel al Sistema de Diseño Integral */}
                  <div className="ticket-silhouette">
                    <div className="p-6 pb-5 text-center relative">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider border mb-2 ${
                          isActiva
                            ? 'bg-[#64829E]/15 text-[#64829E] border-[#64829E]/30'
                            : 'bg-[#F9F5F1] text-[#64829E] border-[#E5DED4]'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{vista.estado}</span>
                      </span>

                      <p className="text-sm text-[#333333]/80">
                        Cliente: <strong className="font-semibold text-[#333333]">{vista.cliente_nombre}</strong>
                      </p>

                      {/* Saldo prominente: 27 / 30 Almuerzos */}
                      <div className="mt-2 flex items-baseline justify-center gap-1.5 font-display">
                        <span className="text-4xl sm:text-5xl font-bold text-[#333333]">
                          {vista.saldo.disponibles}
                        </span>
                        <span className="text-2xl sm:text-3xl font-semibold text-[#64829E]">
                          / {vista.saldo.total}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-[#64829E] block mt-0.5">
                        Almuerzos disponibles
                      </span>

                      {/* Tres KPIs de Saldo requeridos por HU-C5 */}
                      <div className="grid grid-cols-3 gap-3 mt-5">
                        <div className="bg-[#F9F5F1] p-3 rounded-xl border border-[#E5DED4] text-center">
                          <span className="text-[11px] font-medium text-[#64829E] block">
                            Total
                          </span>
                          <span className="text-xl font-bold text-[#333333] font-mono mt-0.5 block">
                            {vista.saldo.total}
                          </span>
                        </div>

                        <div className="bg-[#F9F5F1] p-3 rounded-xl border border-[#FF6B47]/30 text-center">
                          <span className="text-[11px] font-medium text-[#FF6B47] block">
                            Consumidos
                          </span>
                          <span className="text-xl font-bold text-[#FF6B47] font-mono mt-0.5 block">
                            {vista.saldo.consumidos}
                          </span>
                        </div>

                        <div className="bg-[#F9F5F1] p-3 rounded-xl border border-[#64829E]/35 text-center">
                          <span className="text-[11px] font-medium text-[#64829E] block">
                            Disponibles
                          </span>
                          <span className="text-xl font-bold text-[#64829E] font-mono mt-0.5 block">
                            {vista.saldo.disponibles}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="ticket-divider">
                      <div className="ticket-dashed-line" />
                    </div>

                    {/* Parte inferior del boleto: barra y puntos en Azul Pizarra (#64829E) */}
                    <div className="p-6 pt-4 space-y-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#64829E] font-medium flex items-center gap-1.5">
                          <Utensils className="w-3.5 h-3.5 text-[#FF6B47]" />
                          Progreso de tu tiquetera
                        </span>
                        <span className="font-mono font-bold text-[#333333]">
                          {percentAvailable}% disponible
                        </span>
                      </div>

                      <div className="w-full h-2.5 bg-[#F9F5F1] rounded-full overflow-hidden border border-[#E5DED4]">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isFinalizada ? 'bg-[#CFC7BC]' : 'bg-[#64829E]'
                          }`}
                          style={{ width: `${percentAvailable}%` }}
                        />
                      </div>

                      {/* Puntos de almuerzos en Azul Pizarra (#64829E) como en la Tarjeta de Saldo */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {Array.from({ length: Math.min(vista.saldo.total, 15) }).map(
                          (_, idx) => {
                            const available = idx < vista.saldo.disponibles;
                            return (
                              <span
                                key={idx}
                                title={
                                  available
                                    ? 'Almuerzo disponible'
                                    : 'Almuerzo consumido'
                                }
                                className={`w-3 h-3 rounded-full transition-colors ${
                                  available
                                    ? 'bg-[#64829E]'
                                    : 'bg-[#F9F5F1] border border-[#D6CEC2]'
                                }`}
                              />
                            );
                          }
                        )}
                        {vista.saldo.total > 15 && (
                          <span className="text-xs font-mono font-semibold text-[#64829E] ml-1">
                            +{vista.saldo.total - 15}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* HU-C5: Historial de movimientos por día */}
                  <section className="bistro-card p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-semibold text-[#333333] font-display flex items-center gap-2">
                        <History className="w-4 h-4 text-[#FF6B47]" />
                        Historial de Movimientos
                      </h3>
                      <span className="text-xs font-mono text-[#64829E]">
                        {vista.movimientos?.length || 0} registro(s)
                      </span>
                    </div>

                    <HistorialMovimientos
                      movimientos={vista.movimientos || []}
                      fecha={fechaFiltro}
                      onFechaChange={setFechaFiltro}
                    />
                  </section>
                </div>

                {/* Columna derecha: Descarga y conservación del QR (HU-C4) (5 cols) */}
                <div className="lg:col-span-5">
                  <QrPassCard
                    qrToken={vista.qr_token}
                    clienteNombre={vista.cliente_nombre}
                    onShowToast={onShowToast}
                  />
                </div>
              </div>
            </>
          )
        )}
      </main>

      {/* Modal HU-C3: Regeneración de PIN Personal */}
      <Modal
        isOpen={isPinModalOpen}
        onClose={() => !regenerating && setIsPinModalOpen(false)}
        title="Regenerar PIN Personal"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRegenerarPin} className="space-y-4">
          <p className="text-xs sm:text-sm text-[#333333]/80">
            Por seguridad, ingresa primero tu{' '}
            <strong className="text-[#333333]">PIN actual</strong> y luego define tu nuevo PIN de
            6 dígitos.{' '}
            <strong className="text-[#FF6B47]">
              Tu PIN anterior dejará de funcionar de inmediato.
            </strong>
          </p>

          {pinError && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-[#FF6B47]/10 border border-[#FF6B47]/30 text-[#FF6B47] text-xs font-medium"
            >
              {pinError}
            </div>
          )}

          <div>
            <label
              htmlFor="regenerar-pin-anterior"
              className="block text-xs font-semibold text-[#333333] mb-1.5"
            >
              PIN actual (anterior) de 6 dígitos *
            </label>
            <input
              id="regenerar-pin-anterior"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              maxLength={6}
              value={pinAnterior}
              onChange={(e) => setPinAnterior(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              required
              autoFocus
              className={`${inputClass} text-center text-2xl tracking-[0.4em] font-mono`}
            />
          </div>

          <div>
            <label
              htmlFor="regenerar-nuevo-pin"
              className="block text-xs font-semibold text-[#333333] mb-1.5"
            >
              Nuevo PIN (6 dígitos numéricos) *
            </label>
            <input
              id="regenerar-nuevo-pin"
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={6}
              value={nuevoPin}
              onChange={(e) => setNuevoPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              required
              className={`${inputClass} text-center text-2xl tracking-[0.4em] font-mono`}
            />
          </div>

          <div>
            <label
              htmlFor="regenerar-confirmar-pin"
              className="block text-xs font-semibold text-[#333333] mb-1.5"
            >
              Confirmar nuevo PIN *
            </label>
            <input
              id="regenerar-confirmar-pin"
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={6}
              value={confirmarPin}
              onChange={(e) => setConfirmarPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              required
              className={`${inputClass} text-center text-2xl tracking-[0.4em] font-mono`}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5DED4]">
            <button
              type="button"
              onClick={() => setIsPinModalOpen(false)}
              disabled={regenerating}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#64829E] hover:text-[#333333] hover:bg-[#F9F5F1] transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                regenerating ||
                pinAnterior.length !== 6 ||
                nuevoPin.length !== 6 ||
                confirmarPin.length !== 6
              }
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#FF6B47] hover:bg-[#E85A37] text-white shadow-md shadow-[#FF6B47]/25 transition-all cursor-pointer disabled:opacity-50 touch-press"
            >
              {regenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              <span>Guardar Nuevo PIN</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Barra de Opciones Inferior en Móvil */}
      <nav
        aria-label="Opciones de la tiquetera en móvil"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 border-t border-[#E5DED4] backdrop-blur-xl pb-safe shadow-[0_-4px_20px_rgba(51,51,51,0.05)]"
      >
        <div
          className={`grid ${
            vista && isActiva ? 'grid-cols-3' : vista ? 'grid-cols-2' : 'grid-cols-1'
          } max-w-md mx-auto py-1`}
        >
          {vista && (
            <button
              type="button"
              onClick={cargarVistaPublica}
              className="flex flex-col items-center justify-center py-2 px-1 text-[#64829E] hover:text-[#333333] transition-colors touch-press cursor-pointer"
            >
              <div className="p-1.5 rounded-xl bg-[#64829E]/15 text-[#64829E]">
                <RefreshCw className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold mt-0.5 truncate">
                Actualizar Saldo
              </span>
            </button>
          )}

          {vista && isActiva && (
            <button
              type="button"
              onClick={openPinModal}
              className="flex flex-col items-center justify-center py-2 px-1 text-[#333333] hover:text-[#FF6B47] transition-colors touch-press cursor-pointer"
            >
              <div className="p-1.5 rounded-xl bg-[#F9F5F1] border border-[#E5DED4] text-[#333333]">
                <KeyRound className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold mt-0.5 truncate">
                Regenerar PIN
              </span>
            </button>
          )}

          {onGoToActivar && (
            <button
              type="button"
              onClick={onGoToActivar}
              className="flex flex-col items-center justify-center py-2 px-1 text-[#FF6B47] hover:text-[#E85A37] transition-colors touch-press cursor-pointer"
            >
              <div className="p-1.5 rounded-xl bg-[#FF6B47]/15 text-[#FF6B47]">
                <Ticket className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold mt-0.5 truncate">
                Activar otra tiquetera
              </span>
            </button>
          )}
        </div>
      </nav>

      <footer className="hidden md:block border-t border-[#E5DED4] bg-white/60 py-5 text-center text-xs text-[#64829E]">
        <p>Tiquetera — Control de almuerzos para restaurantes</p>
      </footer>
    </div>
  );
}
