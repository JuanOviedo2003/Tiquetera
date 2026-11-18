/**
 * Extrae el qr_token limpio tanto si viene como URL completa (/tiquetera/TOKEN, ?qr=TOKEN)
 * como si viene como token directo.
 */
export function extractQrToken(rawValue) {
  if (!rawValue || typeof rawValue !== 'string') return '';
  const trimmed = rawValue.trim();
  if (!trimmed) return '';

  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const url = new URL(trimmed);
      const qrParam = url.searchParams.get('qr');
      if (qrParam) return qrParam.trim();
      const parts = url.pathname.split('/').filter(Boolean);
      return parts[parts.length - 1] || '';
    }
  } catch {
    // Continuar con extracción manual
  }

  if (trimmed.includes('/')) {
    const parts = trimmed.split('?')[0].split('/').filter(Boolean);
    return parts[parts.length - 1] || '';
  }

  return trimmed;
}
