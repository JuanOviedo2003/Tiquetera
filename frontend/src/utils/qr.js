import QRCode from 'qrcode';
import jsQR from 'jsqr';

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/** Acepta el token suelto o la URL completa que contiene el QR. */
export function extractQrToken(raw) {
  const text = String(raw || '').trim();
  const uuid = text.match(UUID_RE);
  if (uuid) return uuid[0];
  return text.split('/').filter(Boolean).pop() || '';
}

export function isQrScanSupported() {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window;
}

/** Construye la URL pública de consulta para el cliente (HU-C4 & HU-C5). */
export function buildClienteUrl(qrToken) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/tiquetera/${encodeURIComponent(qrToken)}`;
}

/** Construye la URL pública hacia el formulario de activación (HU-C1). */
export function buildActivacionUrl(codigo = '') {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return codigo
    ? `${origin}/activar?codigo=${encodeURIComponent(codigo)}`
    : `${origin}/activar`;
}

/**
 * Copia texto al portapapeles de forma compatible tanto en HTTPS/localhost
 * como en orígenes HTTP (por ejemplo, IP de VPS sin certificado TLS).
 */
export async function copyToClipboard(text) {
  const value = String(text ?? '');
  if (!value) throw new Error('Texto vacío');

  if (
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    typeof navigator !== 'undefined' &&
    navigator.clipboard?.writeText
  ) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Continuar con respaldo clásico si falla Clipboard API
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '-9999px';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);

  try {
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, value.length);
    const copied = document.execCommand('copy');
    if (!copied) {
      throw new Error('No se pudo copiar al portapapeles');
    }
    return true;
  } finally {
    document.body.removeChild(textarea);
  }
}

/**
 * Renderiza un código QR estándar en el <canvas> usando la librería oficial `qrcode`,
 * con la paleta del Sistema de Diseño (#333333 Gris Grafito y #64829E Azul Pizarra).
 */
export async function renderQrToCanvas(
  canvas,
  qrContent,
  { clienteNombre = 'Cliente', qrToken = '' } = {}
) {
  if (!canvas || !qrContent) return;

  const qrSize = 260;
  const footerHeight = 48;

  const tempCanvas = document.createElement('canvas');
  await QRCode.toCanvas(tempCanvas, String(qrContent), {
    width: qrSize,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#333333',
      light: '#FFFFFF',
    },
  });

  canvas.width = qrSize;
  canvas.height = qrSize + footerHeight;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(tempCanvas, 0, 0, qrSize, qrSize);

  const displayToken = qrToken || extractQrToken(qrContent);
  ctx.fillStyle = '#333333';
  ctx.font = '600 13px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    `${String(clienteNombre).slice(0, 22)} - ${displayToken.slice(0, 8)}`,
    qrSize / 2,
    qrSize + 18
  );

  ctx.fillStyle = '#64829E';
  ctx.font = '10px monospace';
  ctx.fillText(displayToken, qrSize / 2, qrSize + 36);
}

/**
 * Escanea un fotograma de un elemento <video> usando `jsQR` (funciona en PC y móvil).
 */
export function scanVideoFrameWithJsQr(video, scratchCanvas) {
  if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
    return null;
  }

  const canvas = scratchCanvas || document.createElement('canvas');
  const width = video.videoWidth;
  const height = video.videoHeight;

  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(video, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const result = jsQR(imageData.data, width, height, {
    inversionAttempts: 'attemptBoth',
  });

  return result?.data || null;
}

/**
 * Decodifica un archivo de imagen QR usando `jsQR` (y `BarcodeDetector` como respaldo).
 */
export async function decodeQrFromImageFile(file) {
  if (!file) return '';

  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const decoded = jsQR(imageData.data, canvas.width, canvas.height, {
      inversionAttempts: 'attemptBoth',
    });
    if (decoded?.data) {
      const token = extractQrToken(decoded.data);
      if (token) return token;
    }
  } catch {
    // Continuar con método alternativo si falla createImageBitmap
  }

  if (isQrScanSupported()) {
    try {
      const bitmap = await createImageBitmap(file);
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      const results = await detector.detect(bitmap);
      if (results.length > 0 && results[0].rawValue) {
        const token = extractQrToken(results[0].rawValue);
        if (token) return token;
      }
    } catch {
      // Fallback al nombre del archivo
    }
  }

  const tokenFromName = extractQrToken(file.name);
  if (tokenFromName && UUID_RE.test(tokenFromName)) {
    return tokenFromName;
  }

  return '';
}
