/**
 * Utilidades para compartir por WhatsApp mediante enlaces `wa.me`.
 *
 * No usa la API de WhatsApp Business: el mensaje sale del WhatsApp de quien
 * pulsa el botón. Este módulo es puro (sin DOM) para poder probarlo con `node --test`.
 */

const CODIGO_PAIS_DEFECTO = '57'; // Colombia

/**
 * Normaliza un teléfono al formato que exige `wa.me`: solo dígitos y con código de país.
 *  - 10 dígitos que empiezan por 3 (celular colombiano local) → antepone 57.
 *  - Prefijo internacional "00" → se elimina.
 *  - Entre 11 y 15 dígitos → se asume que ya trae código de país.
 *  - Cualquier otro caso (vacío, corto o dudoso) → '' (sin destinatario).
 */
export function normalizeWhatsappPhone(raw) {
  let digits = String(raw ?? '').replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('00')) digits = digits.slice(2);

  if (digits.length === 10 && digits.startsWith('3')) {
    return `${CODIGO_PAIS_DEFECTO}${digits}`;
  }
  if (digits.length >= 11 && digits.length <= 15) {
    return digits;
  }
  return '';
}

/** Construye el enlace `wa.me`; sin teléfono válido abre WhatsApp para elegir el chat. */
export function buildWhatsAppUrl(phone, text) {
  const encoded = encodeURIComponent(String(text ?? ''));
  const normalized = normalizeWhatsappPhone(phone);
  return normalized
    ? `https://wa.me/${normalized}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
}

/** Mensaje que el restaurante envía al cliente con su código de activación. */
export function buildActivacionMessage({
  clienteNombre = 'Cliente',
  restauranteNombre = '',
  totalAlmuerzos,
  codigo,
  urlActivar,
}) {
  const lugar = restauranteNombre ? `*${restauranteNombre}*` : 'nuestro restaurante';
  return [
    `¡Hola ${clienteNombre}! 🍽️`,
    `Tu tiquetera de ${totalAlmuerzos} almuerzos ha sido generada en ${lugar}.`,
    '',
    `🔑 Tu código de activación es: *${codigo}*`,
    '',
    'Ingresa al portal para activarla y obtener tu QR de consumo:',
    urlActivar,
    '',
    '⚠️ Este código vence en 48 horas y es de un solo uso. No lo compartas con nadie.',
    '🔒 Al activar crearás tu propio PIN de 6 dígitos: nadie del restaurante lo conoce ni te lo pedirá.',
  ].join('\n');
}

/** Mensaje que el cliente se envía a sí mismo con el enlace de su tiquetera. */
export function buildQrShareMessage({ clienteNombre = 'Cliente', urlConsulta }) {
  return [
    `🍽️ Tiquetera de ${clienteNombre}`,
    'Aquí consulto mi saldo e historial y muestro mi QR en el restaurante:',
    urlConsulta,
    '',
    '🔒 Este enlace no incluye tu PIN. Nunca envíes tu PIN por mensaje.',
  ].join('\n');
}
