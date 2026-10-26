import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import RejillaGrid from '../components/RejillaGrid';
import HistorialMovimientos from '../components/HistorialMovimientos';
import QrScanner from '../components/QrScanner';
import { extractQrToken, isQrScanSupported } from '../utils/qr';
import {
  QrCode,
  Camera,
  Loader2,
  KeyRound,
  ShieldCheck,
  User,
  Utensils,
  X,
  Undo2,
  ArrowRight,
  History,
  LayoutGrid,
} from 'lucide-react';

/** Reconstruye qué consumo (id) sostiene cada cuadro hoy, aplicando las reversas en orden. */
function cuadroAConsumo(movimientos) {
  const mapa = new Map();
  const ordenados = [...movimientos].sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora));
  for (const m of ordenados) {
    const cuadros = m.cuadros_seleccionados || [];
    if (m.tipo === 'CONSUMO') cuadros.forEach((c) => mapa.set(Number(c), m.id));
    if (m.tipo === 'REVERSA') cuadros.forEach((c) => mapa.delete(Number(c)));
  }
  return mapa;
}

export default function ConsumoView({ initialQrToken, onClearInitialQr, onShowToast }) {
  const { user } = useAuth();

  const [step, setStep] = useState('qr'); // qr | pin | panel
  const [qrInput, setQrInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrError, setQrError] = useState(null);

  const [tiquetera, setTiquetera] = useState(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(null);

  const [rejilla, setRejilla] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [seleccionados, setSeleccionados] = useState([]);
  const [saving, setSaving] = useState(false);

  const [cuadroRevertir, setCuadroRevertir] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [reverting, setReverting] = useState(false);

  const mapaCuadros = useMemo(() => cuadroAConsumo(movimientos), [movimientos]);

  // HU-R5: abrir la tiquetera a partir del token del QR
  const abrirPorQr = useCallback(
    async (rawToken) => {
      const token = extractQrToken(rawToken);
      if (!token) {
        setQrError('Ingresa o escanea el token del QR de la tiquetera.');
        return;
      }
      setLoading(true);
      setQrError(null);
      try {
        const data = await api.getTiqueteraByQr(token);
        if (data.estado !== 'ACTIVA') {
          setQrError(
            data.estado === 'FINALIZADA'
              ? 'Esta tiquetera está FINALIZADA: no tiene almuerzos disponibles.'
              : `La tiquetera no está ACTIVA (estado: ${data.estado}).`
          );
          return;
        }
        setTiquetera(data);
        setPin('');
        setPinError(null);
        setStep('pin');
        setScanning(false);
      } catch (err) {
        setQrError(err.message || 'No se pudo abrir la tiquetera');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Llegada desde el listado de tiqueteras con el QR ya conocido
  useEffect(() => {
    if (initialQrToken) {
      queueMicrotask(() => abrirPorQr(initialQrToken));
      onClearInitialQr?.();
    }
  }, [initialQrToken, abrirPorQr, onClearInitialQr]);

  const cargarPanel = useCallback(
    async (qrToken, tiqueteraId, fecha = '') => {
      const [rej, movs] = await Promise.all([
        api.getRejilla(qrToken),
        api.getHistorial(tiqueteraId, fecha),
      ]);
      setRejilla(rej);
      setMovimientos(movs);
    },
    []
  );

  // HU-R6: validar el PIN antes de mostrar la tiquetera
  const handleValidarPin = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pin)) {
      setPinError('El PIN debe tener exactamente 6 dígitos.');
      return;
    }
    setLoading(true);
    setPinError(null);
    try {
      await api.validarPin({ qr_token: tiquetera.qr_token, pin });
      await cargarPanel(tiquetera.qr_token, tiquetera.id);
      setSeleccionados([]);
      setFechaFiltro('');
      setStep('panel');
      onShowToast({
        type: 'success',
        title: 'PIN Validado',
        message: 'Operación de descuento autorizada.',
      });
    } catch (err) {
      setPinError(err.message || 'No se pudo validar el PIN');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const cerrarTiquetera = () => {
    setStep('qr');
    setTiquetera(null);
    setPin('');
    setRejilla(null);
    setMovimientos([]);
    setSeleccionados([]);
    setQrInput('');
    setQrError(null);
  };

  const toggleCuadro = (numero) =>
    setSeleccionados((prev) =>
      prev.includes(numero) ? prev.filter((n) => n !== numero) : [...prev, numero].sort((a, b) => a - b)
    );

  // HU-R8: confirmar consumo de los cuadros seleccionados
  const handleConfirmarConsumo = async () => {
    if (seleccionados.length === 0) return;
    setSaving(true);
    try {
      await api.registrarConsumo({
        tiquetera_id: tiquetera.id,
        pin,
        usuario_id: user?.id || user?.email || 'USR-DESCONOCIDO',
        cuadros_seleccionados: seleccionados,
      });
      onShowToast({
        type: 'success',
        title: 'Consumo Registrado',
        message: `Se descontaron ${seleccionados.length} almuerzo(s) de la tiquetera.`,
      });
      setSeleccionados([]);
      await cargarPanel(tiquetera.qr_token, tiquetera.id, fechaFiltro);
    } catch (err) {
      onShowToast({
        type: 'error',
        title: 'No se pudo registrar',
        message: err.message || 'Error al registrar el consumo',
      });
    } finally {
      setSaving(false);
    }
  };

  // HU-R9: deseleccionar un cuadro consumido hoy
  const handleConfirmarReversa = async () => {
    const consumoId = mapaCuadros.get(cuadroRevertir.numero);
    if (!consumoId) {
      onShowToast({
        type: 'error',
        title: 'Consumo no identificado',
        message: 'No se encontró el consumo original de ese cuadro.',
      });
      return;
    }
    setReverting(true);
    try {
      await api.revertirConsumo({
        consumo_id: consumoId,
        usuario_id: user?.id || user?.email || 'USR-DESCONOCIDO',
        cuadro_deseleccionado: cuadroRevertir.numero,
        motivo: motivo.trim() || 'Corrección del mismo día',
      });
      onShowToast({
        type: 'success',
        title: 'Consumo Corregido',
        message: `El almuerzo ${cuadroRevertir.numero} volvió a estar disponible.`,
      });
      setCuadroRevertir(null);
      setMotivo('');
      await cargarPanel(tiquetera.qr_token, tiquetera.id, fechaFiltro);
    } catch (err) {
      onShowToast({
        type: 'error',
        title: 'No se pudo corregir',
        message: err.message || 'Error al revertir el consumo',
      });
    } finally {
      setReverting(false);
    }
  };

  const handleFechaChange = async (fecha) => {
    setFechaFiltro(fecha);
    try {
      setMovimientos(await api.getHistorial(tiquetera.id, fecha));
    } catch (err) {
      onShowToast({ type: 'error', title: 'Error de historial', message: err.message });
    }
  };

  const inputClass =
    'w-full bg-[#151821] border border-[#262c38] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#e0533c] focus:ring-1 focus:ring-[#e0533c] transition-all';
  const primaryBtn =
    'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#e0533c] hover:bg-[#c94530] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md shadow-[#e0533c]/20 transition-all cursor-pointer touch-press';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-display">
          Registro de Consumo
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Abre la tiquetera con el QR, valida el PIN del cliente y descuenta almuerzos
        </p>
      </div>

      {/* HU-R5: apertura por QR */}
      {step === 'qr' && (
        <div className="bistro-card p-5 sm:p-6 max-w-xl space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#e0533c]/15 text-[#e0533c] flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">Abrir tiquetera</h2>
              <p className="text-xs text-slate-400">Escanea el QR del cliente o pega su token</p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              abrirPorQr(qrInput);
            }}
            className="space-y-3"
          >
            <input
              type="text"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="Token del QR (ej. 2a585e53-196c-459b-...)"
              className={`${inputClass} font-mono`}
              aria-label="Token del QR"
              autoFocus
            />
            {qrError && (
              <p role="alert" className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
                {qrError}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <button type="submit" disabled={loading} className={`${primaryBtn} flex-1`}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>Abrir tiquetera</span>
              </button>
              {isQrScanSupported() && (
                <button
                  type="button"
                  onClick={() => setScanning((s) => !s)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#171b24] border border-[#272e3d] text-slate-200 hover:text-white hover:border-[#e5a93c]/50 text-sm font-semibold cursor-pointer transition-all"
                >
                  <Camera className="w-4 h-4" />
                  <span>{scanning ? 'Cerrar cámara' : 'Escanear con cámara'}</span>
                </button>
              )}
            </div>
          </form>

          {scanning && (
            <QrScanner onDetected={abrirPorQr} onClose={() => setScanning(false)} />
          )}
        </div>
      )}

      {/* HU-R6: validación de PIN */}
      {step === 'pin' && tiquetera && (
        <div className="bistro-card p-5 sm:p-6 max-w-xl space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#e5a93c]/15 text-[#e5a93c] flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-white font-display truncate">
                  {tiquetera.cliente_nombre || 'Cliente'}
                </h2>
                <p className="text-xs text-slate-400 font-mono truncate">{tiquetera.id}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={cerrarTiquetera}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              aria-label="Cancelar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleValidarPin} className="space-y-3">
            <label htmlFor="pin-cliente" className="text-xs font-semibold text-slate-300 block">
              Pide al cliente su PIN de 6 dígitos
            </label>
            <input
              id="pin-cliente"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              className={`${inputClass} text-center text-2xl tracking-[0.5em] font-mono`}
              autoFocus
            />
            {pinError && (
              <p role="alert" className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
                {pinError}
              </p>
            )}
            <button type="submit" disabled={loading || pin.length !== 6} className={`${primaryBtn} w-full`}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Validar PIN</span>
            </button>
          </form>
        </div>
      )}

      {/* Panel: R7 / R8 / R9 / R10 */}
      {step === 'panel' && tiquetera && rejilla && (
        <>
          <div className="bistro-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#252b3a] text-slate-200 flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-white font-display truncate">
                  {rejilla.cliente?.nombre || tiquetera.cliente_nombre}
                </h2>
                <p className="text-xs text-slate-400 font-mono truncate">{tiquetera.id}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block">Total</span>
                  <span className="font-mono font-bold text-white">{rejilla.saldo.total}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Consumidos</span>
                  <span className="font-mono font-bold text-[#e0533c]">{rejilla.saldo.consumidos}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Disponibles</span>
                  <span className="font-mono font-bold text-emerald-400">{rejilla.saldo.disponibles}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={cerrarTiquetera}
                className="py-2 px-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-white border border-[#272e3d] hover:border-[#3a4357] cursor-pointer transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>

          <section className="bistro-card p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-[#e5a93c]" />
                Rejilla de almuerzos
              </h3>
              <span
                className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border ${
                  rejilla.estado === 'ACTIVA'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {rejilla.estado === 'ACTIVA' ? 'En uso' : 'Agotada'}
              </span>
            </div>

            <RejillaGrid
              rejilla={rejilla.rejilla}
              seleccionados={seleccionados}
              onToggle={toggleCuadro}
              onRevertir={(cuadro) => {
                setMotivo('');
                setCuadroRevertir(cuadro);
              }}
              disabled={saving}
            />

            <div className="pt-3 border-t border-[#232835] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5" />
                {seleccionados.length === 0
                  ? 'Selecciona los cuadros disponibles a descontar'
                  : `${seleccionados.length} seleccionado(s): ${seleccionados.join(', ')}`}
              </span>
              <button
                type="button"
                onClick={handleConfirmarConsumo}
                disabled={seleccionados.length === 0 || saving}
                className={primaryBtn}
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Confirmar consumo ({seleccionados.length})</span>
              </button>
            </div>
          </section>

          <section className="bistro-card p-4 sm:p-5 space-y-4">
            <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
              <History className="w-4 h-4 text-[#e5a93c]" />
              Historial de movimientos
            </h3>
            <HistorialMovimientos
              movimientos={movimientos}
              fecha={fechaFiltro}
              onFechaChange={handleFechaChange}
            />
          </section>
        </>
      )}

      <Modal
        isOpen={Boolean(cuadroRevertir)}
        onClose={() => !reverting && setCuadroRevertir(null)}
        title="Corregir consumo"
        maxWidth="max-w-md"
      >
        {cuadroRevertir && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              El almuerzo <span className="font-mono font-bold text-[#e5a93c]">#{cuadroRevertir.numero}</span>{' '}
              se registró hoy. Al deseleccionarlo vuelve a estar disponible y queda una reversa visible en el
              historial.
            </p>
            <div>
              <label htmlFor="motivo-reversa" className="text-xs font-semibold text-slate-300 block mb-1.5">
                Motivo (opcional)
              </label>
              <input
                id="motivo-reversa"
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Corrección del mismo día"
                className={inputClass}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setCuadroRevertir(null)}
                disabled={reverting}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 border border-[#272e3d] hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button type="button" onClick={handleConfirmarReversa} disabled={reverting} className={primaryBtn}>
                {reverting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Undo2 className="w-4 h-4" />}
                <span>Deseleccionar</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
