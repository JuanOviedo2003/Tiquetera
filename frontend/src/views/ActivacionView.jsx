import { useState } from 'react';
import { api } from '../services/api';
import { extractQrToken } from '../utils/qr';
import QrScanner from '../components/QrScanner';
import {
  Ticket,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  Loader2,
  QrCode,
  Search,
  Camera,
} from 'lucide-react';

/**
 * HU-C1: Activación de tiquetera con código de 6 dígitos (sin cuenta).
 * HU-C2: Creación de PIN personal de 6 dígitos al momento de activar.
 * Adaptado al Sistema de Diseño Integral (#F9F5F1, #FFFFFF, #333333, #FF6B47, #64829E).
 */
export default function ActivacionView({
  initialCodigo = '',
  onOpenTiquetera,
  onShowToast,
}) {
  const [codigoActivacion, setCodigoActivacion] = useState(
    String(initialCodigo || '').replace(/\D/g, '').slice(0, 6)
  );
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [qrConsultaInput, setQrConsultaInput] = useState('');
  const [consultaError, setConsultaError] = useState(null);
  const [scanningConsulta, setScanningConsulta] = useState(false);

  const handleActivar = async (e) => {
    e.preventDefault();
    const cleanCode = codigoActivacion.trim();
    const cleanPin = pin.trim();

    if (!/^\d{6}$/.test(cleanCode)) {
      setError('El código de activación debe tener exactamente 6 dígitos numéricos.');
      return;
    }

    if (!/^\d{6}$/.test(cleanPin)) {
      setError('Tu PIN personal debe tener exactamente 6 dígitos numéricos.');
      return;
    }

    if (cleanPin !== confirmPin.trim()) {
      setError('Los PIN ingresados no coinciden. Verifica ambos campos.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await api.activarTiquetera({
        codigo_activacion: cleanCode,
        pin: cleanPin,
      });

      onShowToast?.({
        type: 'success',
        title: '¡Tiquetera Activada!',
        message: 'Tu código QR y tu PIN personal han quedado habilitados.',
      });

      onOpenTiquetera?.(data.qr_token);
    } catch (err) {
      setError(err.message || 'No fue posible activar la tiquetera con ese código.');
    } finally {
      setLoading(false);
    }
  };

  const handleIrAConsulta = (e) => {
    e?.preventDefault?.();
    const token = extractQrToken(qrConsultaInput);
    if (!token) {
      setConsultaError('Ingresa el token de tu QR o pega el enlace de tu tiquetera.');
      return;
    }
    setConsultaError(null);
    setScanningConsulta(false);
    onOpenTiquetera?.(token);
  };

  const handleQrDetected = (detectedVal) => {
    const token = extractQrToken(detectedVal);
    if (token) {
      setScanningConsulta(false);
      setConsultaError(null);
      onOpenTiquetera?.(token);
    } else {
      setConsultaError('No se pudo extraer un token QR válido.');
    }
  };

  const inputClass =
    'w-full bg-[#F9F5F1] border border-[#E5DED4] rounded-xl px-3.5 py-2.5 text-sm text-[#333333] placeholder-[#64829E]/65 focus:outline-none focus:border-[#FF6B47] focus:ring-1 focus:ring-[#FF6B47] transition-all';

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#F9F5F1] text-[#333333] flex flex-col justify-between selection:bg-[#FF6B47] selection:text-white">
      {/* Barra superior pública del cliente con el mismo icono de la ventana */}
      <header className="sticky top-0 z-40 w-full bg-white/95 border-b border-[#E5DED4] backdrop-blur-md">
        <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/favicon.svg?v=3"
              alt="Logo Tiquetera"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shadow-sm shadow-[#FF6B47]/25 shrink-0"
            />
            <div>
              <span className="text-base sm:text-xl font-semibold text-[#333333] font-display tracking-tight block leading-tight">
                Tiquetera
              </span>
              <span className="text-[11px] text-[#64829E] font-medium block leading-tight">
                Activación y consulta de pase
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido central */}
      <main className="w-full max-w-xl mx-auto px-4 sm:px-6 my-6 space-y-6">
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#FF6B47]/15 text-[#FF6B47] border border-[#FF6B47]/30 mb-1">
            <Ticket className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#333333] tracking-tight font-display">
            Activa tu Tiquetera
          </h1>
          <p className="text-xs sm:text-sm text-[#64829E] max-w-md mx-auto">
            Ingresa el código de 6 dígitos entregado por el restaurante y crea tu PIN personal
            para habilitar tu código QR sin necesidad de crear una cuenta.
          </p>
        </div>

        {/* Formulario HU-C1 & HU-C2 */}
        <div className="bistro-card-elevated p-6 sm:p-7 space-y-5">
          {error && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-[#FF6B47]/10 border border-[#FF6B47]/30 text-[#FF6B47] text-xs sm:text-sm font-medium flex items-start gap-2.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B47] mt-2 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleActivar} className="space-y-4">
            {/* HU-C1: Código de activación */}
            <div>
              <label
                htmlFor="codigo-activacion"
                className="block text-xs font-semibold text-[#333333] mb-1.5"
              >
                1. Código de activación del restaurante (6 dígitos) *
              </label>
              <input
                id="codigo-activacion"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                value={codigoActivacion}
                onChange={(e) => setCodigoActivacion(e.target.value.replace(/\D/g, ''))}
                placeholder="Ej. 482910"
                required
                className={`${inputClass} text-center text-2xl tracking-[0.4em] font-mono text-[#FF6B47] font-bold`}
              />
              <p className="text-[11px] text-[#64829E] mt-1">
                Código único de un solo uso con vigencia de 48 horas.
              </p>
            </div>

            {/* HU-C2: Creación de PIN personal */}
            <div className="pt-3 border-t border-[#E5DED4] space-y-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#64829E]" />
                <span className="text-xs font-semibold text-[#333333]">
                  2. Crea tu PIN secreto de autorización (6 dígitos)
                </span>
              </div>
              <p className="text-[11px] text-[#64829E]">
                Este PIN protegerá tus almuerzos al momento de consumir. El restaurante nunca
                conoce tu PIN.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="pin-nuevo"
                    className="block text-xs font-semibold text-[#333333] mb-1"
                  >
                    PIN personal (6 dígitos) *
                  </label>
                  <input
                    id="pin-nuevo"
                    type="password"
                    inputMode="numeric"
                    autoComplete="new-password"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    required
                    className={`${inputClass} text-center text-xl tracking-[0.4em] font-mono`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="pin-confirmar"
                    className="block text-xs font-semibold text-[#333333] mb-1"
                  >
                    Confirmar PIN *
                  </label>
                  <input
                    id="pin-confirmar"
                    type="password"
                    inputMode="numeric"
                    autoComplete="new-password"
                    maxLength={6}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    required
                    className={`${inputClass} text-center text-xl tracking-[0.4em] font-mono`}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={
                loading ||
                codigoActivacion.length !== 6 ||
                pin.length !== 6 ||
                confirmPin.length !== 6
              }
              className="w-full mt-2 py-3.5 px-5 rounded-full font-semibold text-sm bg-[#FF6B47] hover:bg-[#E85A37] text-white shadow-md shadow-[#FF6B47]/25 flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed touch-press"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Activando tiquetera...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Activar Tiquetera y Obtener mi QR</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Acceso directo a consulta por QR para clientes que ya tienen su tiquetera */}
        <div className="bistro-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#333333]">
            <QrCode className="w-4 h-4 text-[#64829E]" />
            <span>¿Ya tienes una tiquetera activa? Consulta tu saldo e historial</span>
          </div>
          <form onSubmit={handleIrAConsulta} className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-[#64829E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={qrConsultaInput}
                onChange={(e) => setQrConsultaInput(e.target.value)}
                placeholder="Pega tu token QR o URL de consulta..."
                className={`${inputClass} pl-10 font-mono text-xs`}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#64829E] hover:bg-[#526E88] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex-1 touch-press"
              >
                <span>Consultar Saldo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setScanningConsulta((s) => !s)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#FF6B47] hover:bg-[#E85A37] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer touch-press"
              >
                <Camera className="w-4 h-4" />
                <span>{scanningConsulta ? 'Cerrar cámara' : 'Escanear QR'}</span>
              </button>
            </div>
          </form>
          {consultaError && <p className="text-xs text-[#FF6B47] font-medium">{consultaError}</p>}

          {scanningConsulta && (
            <QrScanner onDetected={handleQrDetected} onClose={() => setScanningConsulta(false)} />
          )}
        </div>
      </main>

      <footer className="border-t border-[#E5DED4] bg-white/60 text-center text-xs text-[#64829E] py-5">
        <span>Tiquetera — Control de almuerzos para restaurantes</span>
      </footer>
    </div>
  );
}
