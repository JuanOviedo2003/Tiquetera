import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import {
  decodeQrFromImageFile,
  isQrScanSupported,
  scanVideoFrameWithJsQr,
} from '../utils/qr';

/**
 * Escáner de QR por cámara o archivo de imagen (HU-R5).
 * Usa `jsQR` por canvas en tiempo real y apaga el hardware de la cámara de inmediato al cerrar.
 */
export default function QrScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const scratchCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [error, setError] = useState(null);

  const stopCamera = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const video = videoRef.current;
    if (video) {
      const mediaStream = video.srcObject;
      if (mediaStream && typeof mediaStream.getTracks === 'function') {
        mediaStream.getTracks().forEach((track) => {
          track.enabled = false;
          track.stop();
        });
      }
      video.pause();
      video.srcObject = null;
      video.removeAttribute('src');
      video.load();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.enabled = false;
        track.stop();
      });
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    scratchCanvasRef.current = document.createElement('canvas');

    async function start() {
      try {
        const getMedia =
          navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices) ||
          navigator.getUserMedia?.bind(navigator) ||
          navigator.webkitGetUserMedia?.bind(navigator) ||
          navigator.mozGetUserMedia?.bind(navigator) ||
          navigator.msGetUserMedia?.bind(navigator);

        let mediaStream = null;

        if (getMedia) {
          try {
            mediaStream = await getMedia({
              video: {
                facingMode: { ideal: 'environment' },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
              audio: false,
            });
          } catch {
            // Reintento con configuración básica de video
            mediaStream = await getMedia({ video: true, audio: false });
          }
        }

        if (!mediaStream) {
          throw new Error('No se pudo inicializar la cámara web.');
        }

        if (cancelled) {
          mediaStream.getTracks().forEach((track) => {
            track.enabled = false;
            track.stop();
          });
          return;
        }

        streamRef.current = mediaStream;
        const video = videoRef.current;
        if (!video) {
          stopCamera();
          return;
        }

        video.srcObject = mediaStream;
        await video.play();

        const nativeDetector = isQrScanSupported()
          ? new window.BarcodeDetector({ formats: ['qr_code'] })
          : null;

        timerRef.current = setInterval(async () => {
          if (cancelled || !videoRef.current) return;

          try {
            const rawValue = scanVideoFrameWithJsQr(
              videoRef.current,
              scratchCanvasRef.current
            );
            if (rawValue) {
              stopCamera();
              onDetected(rawValue);
              return;
            }
          } catch {
            // Reintentar en el siguiente frame
          }

          if (nativeDetector) {
            try {
              const codes = await nativeDetector.detect(videoRef.current);
              if (codes.length > 0 && codes[0].rawValue) {
                stopCamera();
                onDetected(codes[0].rawValue);
              }
            } catch {
              // Reintentar en el siguiente frame
            }
          }
        }, 150);
      } catch {
        if (!cancelled) {
          setError(
            'No se pudo abrir el visor de video. Puedes usar la cámara para capturar la foto o subir la imagen del QR.'
          );
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [onDetected, stopCamera]);

  const handleCloseClick = () => {
    stopCamera();
    onClose();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const token = await decodeQrFromImageFile(file);
    if (token) {
      stopCamera();
      onDetected(token);
    } else {
      setError('No se pudo detectar un QR válido en la imagen seleccionada.');
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-[#F9F5F1] border border-[#E5DED4] space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[#333333] flex items-center gap-1.5">
          <Camera className="w-4 h-4 text-[#FF6B47]" />
          Apunta la cámara al código QR del cliente
        </span>
        <button
          type="button"
          onClick={handleCloseClick}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[#64829E] hover:text-[#333333] hover:bg-white cursor-pointer"
          aria-label="Cerrar escáner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {error ? (
        <div className="space-y-3">
          <div className="text-xs text-[#333333] bg-[#FF6B47]/10 border border-[#FF6B47]/30 rounded-xl p-3 space-y-2">
            <p className="font-semibold text-[#FF6B47]">
              Escanea el QR usando la cámara de tu dispositivo:
            </p>
            <p className="text-[11px] text-[#64829E]">
              Al pulsar el botón a continuación, tu dispositivo abrirá el visor de la cámara para capturar la foto del código QR al instante.
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#FF6B47] hover:bg-[#E85A37] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer touch-press"
            >
              <Camera className="w-4 h-4" />
              <span>Abrir Cámara para Capturar QR</span>
            </button>
          </div>
        </div>
      ) : (
        <video
          ref={videoRef}
          muted
          playsInline
          className="w-full rounded-xl bg-[#333333] aspect-video object-cover border border-[#E5DED4]"
        />
      )}

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E5DED4]/60">
        <span className="text-[11px] text-[#64829E] font-medium">
          ¿Tienes una foto o imagen del QR?
        </span>
        <button
          type="button"
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.removeAttribute('capture');
              fileInputRef.current.click();
              fileInputRef.current.setAttribute('capture', 'environment');
            }
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E5DED4] text-xs font-semibold text-[#333333] hover:border-[#64829E] cursor-pointer transition-all shadow-xs"
        >
          <Upload className="w-3.5 h-3.5 text-[#64829E]" />
          <span>Subir imagen</span>
        </button>
      </div>
    </div>
  );
}
