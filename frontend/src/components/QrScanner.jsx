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
      // Intentar obtener getUserMedia moderno o fallback de versiones previas
      const getMedia =
        navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices) ||
        navigator.getUserMedia?.bind(navigator) ||
        navigator.webkitGetUserMedia?.bind(navigator) ||
        navigator.mozGetUserMedia?.bind(navigator) ||
        navigator.msGetUserMedia?.bind(navigator);

      if (!getMedia) {
        setError(
          'El navegador no soporta captura de video directa. Puedes subir la imagen del QR o pegar el token.'
        );
        return;
      }

      try {
        let mediaStream;
        const videoConstraints = {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        };

        if (navigator.mediaDevices?.getUserMedia) {
          try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: videoConstraints,
              audio: false,
            });
          } catch {
            // Intentar con restricción simple en caso de que facingMode o resoluciones específicas fallen
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
          }
        } else {
          // Fallback clásico con Promesa
          mediaStream = await new Promise((resolve, reject) => {
            getMedia({ video: true, audio: false }, resolve, reject);
          });
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
            // Reintentar en el siguiente ciclo
          }

          if (nativeDetector) {
            try {
              const codes = await nativeDetector.detect(videoRef.current);
              if (codes.length > 0 && codes[0].rawValue) {
                stopCamera();
                onDetected(codes[0].rawValue);
              }
            } catch {
              // Reintentar en el siguiente ciclo
            }
          }
        }, 150);
      } catch (err) {
        if (!cancelled) {
          // Si el navegador bloqueó la cámara por contexto o permiso denegado
          setError(
            'No se pudo acceder a la cámara. Puedes subir la imagen del QR o ingresar el identificador manualmente.'
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

      {error ? (
        <p className="text-xs text-[#FF6B47] bg-[#FF6B47]/10 border border-[#FF6B47]/30 rounded-xl px-3 py-2 font-medium">
          {error}
        </p>
      ) : (
        <video
          ref={videoRef}
          muted
          playsInline
          className="w-full rounded-xl bg-[#333333] aspect-video object-cover border border-[#E5DED4]"
        />
      )}

      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-[11px] text-[#64829E] font-medium">
          ¿Tienes la imagen descargada del QR?
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E5DED4] text-xs font-semibold text-[#333333] hover:border-[#64829E] cursor-pointer transition-all shadow-xs"
        >
          <Upload className="w-3.5 h-3.5 text-[#64829E]" />
          <span>Leer desde imagen</span>
        </button>
      </div>
    </div>
  );
}
