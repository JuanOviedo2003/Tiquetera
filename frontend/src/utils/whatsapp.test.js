import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeWhatsappPhone,
  buildWhatsAppUrl,
  buildActivacionMessage,
  buildQrShareMessage,
} from './whatsapp.js';

describe('normalizeWhatsappPhone', () => {
  it('antepone 57 a un celular colombiano de 10 dígitos', () => {
    assert.equal(normalizeWhatsappPhone('3001234567'), '573001234567');
  });

  it('limpia espacios, guiones y paréntesis', () => {
    assert.equal(normalizeWhatsappPhone('(300) 123-4567'), '573001234567');
  });

  it('respeta un número que ya trae código de país', () => {
    assert.equal(normalizeWhatsappPhone('573001234567'), '573001234567');
    assert.equal(normalizeWhatsappPhone('+1 415 555 2671'), '14155552671');
  });

  it('elimina el prefijo internacional 00', () => {
    assert.equal(normalizeWhatsappPhone('0057 300 123 4567'), '573001234567');
  });

  it('devuelve vacío para números dudosos o ausentes', () => {
    assert.equal(normalizeWhatsappPhone(''), '');
    assert.equal(normalizeWhatsappPhone(null), '');
    assert.equal(normalizeWhatsappPhone('1234567'), '');
    assert.equal(normalizeWhatsappPhone('2001234567'), ''); // 10 dígitos que no empiezan por 3
  });
});

describe('buildWhatsAppUrl', () => {
  it('incluye el destinatario normalizado y el texto codificado', () => {
    const url = buildWhatsAppUrl('3001234567', 'Hola mundo');
    assert.equal(url, 'https://wa.me/573001234567?text=Hola%20mundo');
  });

  it('sin teléfono válido abre WhatsApp sin destinatario', () => {
    assert.equal(buildWhatsAppUrl('', 'Hola'), 'https://wa.me/?text=Hola');
  });
});

describe('mensajes', () => {
  it('el mensaje de activación incluye restaurante, código, enlace y advertencias', () => {
    const msg = buildActivacionMessage({
      clienteNombre: 'Ana',
      restauranteNombre: 'La Cocina',
      totalAlmuerzos: 20,
      codigo: '123456',
      urlActivar: 'https://ejemplo.test/activar?codigo=123456',
    });
    assert.match(msg, /Ana/);
    assert.match(msg, /\*La Cocina\*/);
    assert.match(msg, /\*123456\*/);
    assert.match(msg, /activar\?codigo=123456/);
    assert.match(msg, /48 horas/);
    assert.match(msg, /No lo compartas con nadie/);
  });

  it('sin nombre de restaurante usa una redacción genérica', () => {
    const msg = buildActivacionMessage({
      clienteNombre: 'Ana',
      totalAlmuerzos: 5,
      codigo: '654321',
      urlActivar: 'x',
    });
    assert.match(msg, /nuestro restaurante/);
  });

  it('ningún mensaje pide ni contiene un PIN', () => {
    const a = buildActivacionMessage({ clienteNombre: 'Ana', totalAlmuerzos: 5, codigo: '111111', urlActivar: 'u' });
    const b = buildQrShareMessage({ clienteNombre: 'Ana', urlConsulta: 'https://ejemplo.test/tiquetera/abc' });
    assert.doesNotMatch(a, /tu PIN es/i);
    assert.match(b, /Nunca envíes tu PIN/);
  });
});
