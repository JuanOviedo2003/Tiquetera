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
