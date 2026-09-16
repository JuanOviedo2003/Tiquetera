const tiqueteras = [
  {
    qr_token: "ABC123",
    estado: "ACTIVA",
    cliente: { nombre: "Juan Pérez", telefono: "3001234567" },
    total: 20,
    consumos: [
      { cuadro: 1, fechaConsumo: "2026-10-13T12:10:00.000Z" },
      { cuadro: 2, fechaConsumo: "2026-10-14T12:15:00.000Z" },
      { cuadro: 3, fechaConsumo: "2026-10-15T12:20:00.000Z" },
      { cuadro: 4, fechaConsumo: "2026-10-16T12:25:00.000Z" },
      { cuadro: 5, fechaConsumo: "2026-10-17T12:30:00.000Z" },
    ],
  },
  {
    qr_token: "XYZ789",
    estado: "FINALIZADA",
    cliente: { nombre: "María Gómez", telefono: "3109876543" },
    total: 10,
    consumos: [
      { cuadro: 1, fechaConsumo: "2026-10-10T12:00:00.000Z" },
      { cuadro: 2, fechaConsumo: "2026-10-11T12:00:00.000Z" },
      { cuadro: 3, fechaConsumo: "2026-10-12T12:00:00.000Z" },
      { cuadro: 4, fechaConsumo: "2026-10-13T12:00:00.000Z" },
      { cuadro: 5, fechaConsumo: "2026-10-14T12:00:00.000Z" },
      { cuadro: 6, fechaConsumo: "2026-10-15T12:00:00.000Z" },
      { cuadro: 7, fechaConsumo: "2026-10-16T12:00:00.000Z" },
      { cuadro: 8, fechaConsumo: "2026-10-17T12:00:00.000Z" },
      { cuadro: 9, fechaConsumo: "2026-10-18T12:00:00.000Z" },
      { cuadro: 10, fechaConsumo: "2026-10-19T12:00:00.000Z" },
    ],
  },
  {
    qr_token: "PEN001",
    estado: "PENDIENTE",
    cliente: { nombre: "Carlos Ruiz", telefono: "3205556677" },
    total: 15,
    consumos: [],
  },
];

export default class RejillaEntity {
  static findByQrToken(qrToken) {
    return tiqueteras.find((t) => t.qr_token === qrToken);
  }
}
