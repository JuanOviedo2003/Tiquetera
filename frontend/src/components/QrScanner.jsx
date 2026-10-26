import { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';

/**
 * Escáner de QR por cámara usando la API nativa BarcodeDetector.
 * Si el navegador no la soporta, el padre debe ofrecer el ingreso manual del token.
 */
export default function QrScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let stream = null;
    let timer = null;
    let cancelled = false;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (cancelled) return;
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();

        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        timer = setInterval(async () => {
          try {
            const codes = await detector.detect(video);
            if (codes.length > 0 && codes[0].rawValue) {
              onDetected(codes[0].rawValue);
            }
          } catch {
            // frame no listo: se reintenta en el siguiente ciclo
          }
        }, 350);
      } catch {
        setError('No se pudo acceder a la cámara. Revisa el permiso o ingresa el token a mano.');
      }
    }

    start();
    return () => {
      cancelled = true;
      clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onDetected]);

  return (
    <div className="bistro-card p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-[#e5a93c]" />
          Apunta la cámara al código QR
        </span>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
          aria-label="Cerrar cámara"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {error ? (
        <p className="text-xs text-rose-300">{error}</p>
      ) : (
        <video
          ref={videoRef}
          muted
          playsInline
          className="w-full rounded-xl bg-black aspect-video object-cover"
        />
      )}
    </div>
  );
}
