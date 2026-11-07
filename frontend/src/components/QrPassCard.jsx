import { useEffect, useRef, useState } from 'react';
import { QrCode, Download, Copy, Check, ExternalLink, Share2 } from 'lucide-react';
import { buildClienteUrl, renderQrToCanvas } from '../utils/qr';

/**
 * HU-C4: Tarjeta de Código QR fiel al Sistema de Diseño Integral.
 */
export default function QrPassCard({
  qrToken,
  clienteNombre = 'Cliente',
  onShowToast,
  onOpenConsulta,
}) {
  const canvasRef = useRef(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const urlConsulta = buildClienteUrl(qrToken);

  useEffect(() => {
    renderQrToCanvas(canvasRef.current, urlConsulta, {
      clienteNombre,
      qrToken,
    });
  }, [urlConsulta, qrToken, clienteNombre]);

  const handleDownloadQr = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `tiquetera-qr-${qrToken}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      onShowToast?.({
        type: 'success',
        title: 'QR Descargado',
        message: 'La imagen de tu código QR se guardó en tu dispositivo.',
      });
    } catch {
      onShowToast?.({
        type: 'error',
        title: 'Error al descargar',
        message: 'No se pudo generar la imagen del QR en este navegador.',
      });
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(urlConsulta);
      setCopiedUrl(true);
      onShowToast?.({
        type: 'success',
        title: '¡Enlace Copiado!',
        message: 'Guarda este enlace para consultar tu saldo e historial cuando quieras.',
      });
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      onShowToast?.({
        type: 'error',
        title: 'Aviso',
        message: 'No fue posible copiar el enlace automáticamente.',
      });
    }
  };

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(qrToken);
      setCopiedToken(true);
      onShowToast?.({
        type: 'success',
        title: 'Token QR Copiado',
        message: 'Identificador del QR copiado al portapapeles.',
      });
      setTimeout(() => setCopiedToken(false), 2500);
    } catch {
      onShowToast?.({
        type: 'error',
        title: 'Aviso',
        message: 'No fue posible copiar el token.',
      });
    }
  };

  const handleShareQr = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Tiquetera de ${clienteNombre}`,
          text: `Consulta y presenta tu código QR de almuerzos:`,
          url: urlConsulta,
        });
        return;
      } catch {
        // Si el usuario cancela el share nativo, copiamos la URL
      }
    }
    handleCopyUrl();
  };

  return (
    <div className="bistro-card p-5 sm:p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#FF6B47]/15 text-[#FF6B47] flex items-center justify-center shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#333333] font-display">
              Tarjeta de Código QR
            </h3>
            <p className="text-xs text-[#64829E]">
              Preséntalo en el restaurante al momento de consumir tus almuerzos
            </p>
          </div>
        </div>
      </div>

      {/* Contenedor visual del QR según Sistema de Diseño */}
      <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-[#F9F5F1] border border-[#E5DED4]">
        <div className="p-3 rounded-2xl bg-white border border-[#E5DED4] shadow-sm">
          <canvas
            ref={canvasRef}
            aria-label={`Código QR de la tiquetera ${qrToken}`}
            className="w-52 sm:w-56 h-auto block rounded-lg"
          />
        </div>

        {/* Nombre y código corto (Ej: Juan - 237aaf48) */}
        <div className="mt-3 text-center">
          <p className="text-sm font-semibold text-[#333333]">
            {clienteNombre} - <span className="font-mono text-[#64829E]">{qrToken.slice(0, 8)}</span>
          </p>
        </div>
      </div>

      {/* URL de consulta pública */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-[#333333]">
          URL personal de consulta (sin cuenta)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={urlConsulta}
            className="w-full bg-[#F9F5F1] border border-[#E5DED4] rounded-xl px-3 py-2 text-xs font-mono text-[#333333] focus:outline-none"
          />
          {onOpenConsulta && (
            <button
              type="button"
              onClick={onOpenConsulta}
              className="p-2 rounded-xl bg-[#F9F5F1] border border-[#E5DED4] text-[#64829E] hover:text-[#333333] hover:border-[#64829E] transition-colors cursor-pointer shrink-0"
              title="Abrir vista de consulta"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Grilla 2x2 de botones en Azul Pizarra (#64829E) como en el Sistema de Diseño */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={handleDownloadQr}
          className="inline-flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-semibold bg-[#64829E] hover:bg-[#526E88] text-white shadow-sm transition-all cursor-pointer touch-press"
        >
          <Download className="w-4 h-4 shrink-0" />
          <span className="truncate">Descargar QR</span>
        </button>

        <button
          type="button"
          onClick={handleCopyUrl}
          className={`inline-flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer touch-press ${
            copiedUrl
              ? 'bg-[#FF6B47] text-white shadow-sm'
              : 'bg-[#64829E] hover:bg-[#526E88] text-white shadow-sm'
          }`}
        >
          {copiedUrl ? <Check className="w-4 h-4 shrink-0" /> : <Copy className="w-4 h-4 shrink-0" />}
          <span className="truncate">{copiedUrl ? '¡URL Copiada!' : 'Copiar URL'}</span>
        </button>

        <button
          type="button"
          onClick={handleShareQr}
          className="inline-flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-semibold bg-[#64829E]/15 hover:bg-[#64829E]/25 text-[#64829E] border border-[#64829E]/30 transition-all cursor-pointer touch-press"
        >
          <Share2 className="w-4 h-4 shrink-0" />
          <span className="truncate">Compartir</span>
        </button>

        <button
          type="button"
          onClick={handleCopyToken}
          className="inline-flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-semibold bg-[#64829E]/15 hover:bg-[#64829E]/25 text-[#64829E] border border-[#64829E]/30 transition-all cursor-pointer touch-press"
        >
          {copiedToken ? <Check className="w-4 h-4 shrink-0" /> : <Copy className="w-4 h-4 shrink-0" />}
          <span className="truncate">{copiedToken ? 'Token Copiado' : 'Copiar Token'}</span>
        </button>
      </div>
    </div>
  );
}
