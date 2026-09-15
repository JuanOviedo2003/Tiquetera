import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import TiqueteraEntity from "../src/modules/tiquetera/entity/tiquetera.entity.js";
import ConsumoEntity from "../src/modules/consumo/entity/consumo.entity.js";
import { TiqueteraService } from "../src/modules/tiquetera/services/tiquetera.service.js";
import { ConsumoService } from "../src/modules/consumo/services/consumo.service.js";

describe("HU-R3: Creación de Tiquetera & Ciclo de Activación", () => {
  let tiqueteraService;

  beforeEach(() => {
    TiqueteraEntity.clearAll();
    ConsumoEntity.clearAll();
    tiqueteraService = new TiqueteraService();
  });

  it("debe crear una tiquetera exitosamente en estado PENDIENTE con código de activación de 6 dígitos y expiración a 48h", () => {
    const totalAlmuerzos = 15;
    const tiquetera = tiqueteraService.createTiquetera({
      cliente_id: "CLI-001",
      total_almuerzos: totalAlmuerzos,
      restaurante_id: "REST-1",
    });

    assert.ok(tiquetera.id, "Debe tener un identificador asignado");
    assert.equal(tiquetera.cliente_id, "CLI-001");
    assert.equal(tiquetera.total_almuerzos, 15);
    assert.equal(tiquetera.almuerzos_consumidos, 0);
    assert.equal(tiquetera.almuerzos_disponibles, 15);
    assert.equal(tiquetera.estado, "PENDIENTE");
    assert.equal(tiquetera.codigo_usado, false);

    // Validación de código de activación de 6 dígitos numéricos
    assert.match(
      tiquetera.codigo_activacion,
      /^\d{6}$/,
      "El código de activación debe ser de 6 dígitos"
    );

    // Validación de expiración a 48 horas (+/- 5 segundos de margen)
    const fechaExpiracion = new Date(tiquetera.fecha_expiracion_codigo).getTime();
    const tiempoEsperado = Date.now() + 48 * 60 * 60 * 1000;
    assert.ok(
      Math.abs(fechaExpiracion - tiempoEsperado) < 5000,
      "La expiración debe ser en 48 horas"
    );
  });

  it("debe rechazar la creación si el total de almuerzos es menor o igual a cero o no es entero", () => {
    assert.throws(
      () =>
        tiqueteraService.createTiquetera({
          cliente_id: "CLI-001",
          total_almuerzos: 0,
        }),
      /mayor a 0/
    );

    assert.throws(
      () =>
        tiqueteraService.createTiquetera({
          cliente_id: "CLI-001",
          total_almuerzos: -5,
        }),
      /mayor a 0/
    );

    assert.throws(
      () =>
        tiqueteraService.createTiquetera({
          cliente_id: "CLI-001",
          total_almuerzos: "abc",
        }),
      /mayor a 0/
    );
  });

  it("debe rechazar la creación si no se proporciona el ID del cliente", () => {
    assert.throws(
      () =>
        tiqueteraService.createTiquetera({
          cliente_id: "",
          total_almuerzos: 10,
        }),
      /id del cliente es obligatorio/
    );
  });

  it("debe permitir la reemisión del código de activación si está en estado PENDIENTE", () => {
    const tiquetera = tiqueteraService.createTiquetera({
      cliente_id: "CLI-002",
      total_almuerzos: 20,
    });

    const codigoAnterior = tiquetera.codigo_activacion;
    const tiqueteraReemitida = tiqueteraService.reemitirCodigoActivacion(tiquetera.id);

    assert.match(tiqueteraReemitida.codigo_activacion, /^\d{6}$/);
    assert.equal(tiqueteraReemitida.estado, "PENDIENTE");
    assert.equal(tiqueteraReemitida.codigo_usado, false);
  });

  it("debe activar la tiquetera, pasar a estado ACTIVA, hashear el PIN y generar QR token único", () => {
    const tiquetera = tiqueteraService.createTiquetera({
      cliente_id: "CLI-003",
      total_almuerzos: 10,
    });

    const pinCliente = "654321";
    const activada = tiqueteraService.activarTiquetera({
      codigo_activacion: tiquetera.codigo_activacion,
      pin: pinCliente,
    });

    assert.equal(activada.estado, "ACTIVA");
    assert.equal(activada.codigo_usado, true);
    assert.ok(activada.qr_token, "Debe tener un QR token inmutable generado");

    // Verificar hash SHA-256 del PIN
    const hashEsperado = crypto.createHash("sha256").update(pinCliente).digest("hex");
    assert.equal(activada.pin_hash, hashEsperado);

    // No debe permitir reutilizar el mismo código de activación
    assert.throws(
      () =>
        tiqueteraService.activarTiquetera({
          codigo_activacion: tiquetera.codigo_activacion,
          pin: "111222",
        }),
      /ya ha sido utilizado/
    );
  });
});

describe("HU-R8: Registro de Consumo", () => {
  let tiqueteraService;
  let consumoService;
  let tiqueteraActiva;
  const pinCliente = "123456";

  beforeEach(() => {
    TiqueteraEntity.clearAll();
    ConsumoEntity.clearAll();
    tiqueteraService = new TiqueteraService();
    consumoService = new ConsumoService();

    // Crear y activar tiquetera con 10 almuerzos
    const creada = tiqueteraService.createTiquetera({
      cliente_id: "CLI-010",
      total_almuerzos: 10,
      restaurante_id: "REST-1",
    });

    tiqueteraActiva = tiqueteraService.activarTiquetera({
      codigo_activacion: creada.codigo_activacion,
      pin: pinCliente,
    });
  });

  it("debe registrar un consumo exitoso, descontar almuerzos y registrar movimiento inmutable", () => {
    const resultado = consumoService.registrarConsumo({
      tiquetera_id: tiqueteraActiva.id,
      pin: pinCliente,
      cantidad: 2,
      usuario_id: "USER-MESERO-1",
      cuadros_seleccionados: [0, 1],
    });

    // Validar saldos actualizados automáticamente (RF-11)
    assert.equal(resultado.tiquetera.almuerzos_consumidos, 2);
    assert.equal(resultado.tiquetera.almuerzos_disponibles, 8);
    assert.equal(resultado.tiquetera.estado, "ACTIVA");

    // Validar movimiento inmutable (RF-10, RNF-04)
    assert.equal(resultado.movimiento.tipo, "CONSUMO");
    assert.equal(resultado.movimiento.cantidad, 2);
    assert.equal(resultado.movimiento.saldo_anterior, 10);
    assert.equal(resultado.movimiento.saldo_posterior, 8);
    assert.equal(resultado.movimiento.usuario_id, "USER-MESERO-1");
    assert.deepEqual(resultado.movimiento.cuadros_seleccionados, [0, 1]);
    assert.ok(resultado.movimiento.fecha_hora);

    // Validar consulta en historial (RF-15)
    const historial = consumoService.obtenerHistorialPorTiquetera(tiqueteraActiva.id);
    assert.equal(historial.length, 1);
    assert.equal(historial[0].id, resultado.movimiento.id);
  });

  it("debe rechazar consumo si la tiquetera está en estado PENDIENTE", () => {
    const tiqueteraPendiente = tiqueteraService.createTiquetera({
      cliente_id: "CLI-020",
      total_almuerzos: 5,
    });

    assert.throws(
      () =>
        consumoService.registrarConsumo({
          tiquetera_id: tiqueteraPendiente.id,
          pin: "123456",
          cantidad: 1,
          usuario_id: "USER-1",
        }),
      (err) => {
        assert.equal(err.status, 400);
        assert.match(err.message, /la tiquetera no está ACTIVA/);
        return true;
      }
    );
  });

  it("debe rechazar consumo si la cantidad solicitada supera los almuerzos disponibles", () => {
    assert.throws(
      () =>
        consumoService.registrarConsumo({
          tiquetera_id: tiqueteraActiva.id,
          pin: pinCliente,
          cantidad: 15, // tiene 10 disponibles
          usuario_id: "USER-1",
        }),
      (err) => {
        assert.equal(err.status, 400);
        assert.match(err.message, /Saldo insuficiente/);
        return true;
      }
    );
  });

  it("debe validar el PIN del cliente y bloquear la tiquetera al tercer intento fallido consecutivo", () => {
    const pinErroneo = "999999";

    // Intento fallido 1
    assert.throws(
      () =>
        consumoService.registrarConsumo({
          tiquetera_id: tiqueteraActiva.id,
          pin: pinErroneo,
          cantidad: 1,
          usuario_id: "USER-1",
        }),
      (err) => {
        assert.equal(err.status, 401);
        assert.match(err.message, /Intento 1 de 3/);
        return true;
      }
    );

    // Intento fallido 2
    assert.throws(
      () =>
        consumoService.registrarConsumo({
          tiquetera_id: tiqueteraActiva.id,
          pin: pinErroneo,
          cantidad: 1,
          usuario_id: "USER-1",
        }),
      (err) => {
        assert.equal(err.status, 401);
        assert.match(err.message, /Intento 2 de 3/);
        return true;
      }
    );

    // Intento fallido 3 -> Bloqueo temporal
    assert.throws(
      () =>
        consumoService.registrarConsumo({
          tiquetera_id: tiqueteraActiva.id,
          pin: pinErroneo,
          cantidad: 1,
          usuario_id: "USER-1",
        }),
      (err) => {
        assert.equal(err.status, 401);
        assert.match(err.message, /bloqueada temporalmente por 15 minutos/);
        return true;
      }
    );

    // Intento posterior mientras está bloqueada -> Rechazo 403 Forbidden
    assert.throws(
      () =>
        consumoService.registrarConsumo({
          tiquetera_id: tiqueteraActiva.id,
          pin: pinCliente, // Incluso con el PIN correcto debe estar bloqueada
          cantidad: 1,
          usuario_id: "USER-1",
        }),
      (err) => {
        assert.equal(err.status, 403);
        assert.match(err.message, /Tiquetera bloqueada temporalmente/);
        return true;
      }
    );
  });

  it("debe cambiar automáticamente a estado FINALIZADA cuando el saldo disponible llega a 0 (RF-13)", () => {
    // Consumir los 10 almuerzos
    const resultado = consumoService.registrarConsumo({
      tiquetera_id: tiqueteraActiva.id,
      pin: pinCliente,
      cantidad: 10,
      usuario_id: "USER-1",
    });

    assert.equal(resultado.tiquetera.almuerzos_disponibles, 0);
    assert.equal(resultado.tiquetera.almuerzos_consumidos, 10);
    assert.equal(resultado.tiquetera.estado, "FINALIZADA");
    assert.ok(
      resultado.tiquetera.fecha_finalizacion,
      "Debe registrar fecha y hora de finalización"
    );

    // Intentar consumir en tiquetera FINALIZADA debe ser rechazado (RF-12, RF-13)
    assert.throws(
      () =>
        consumoService.registrarConsumo({
          tiquetera_id: tiqueteraActiva.id,
          pin: pinCliente,
          cantidad: 1,
          usuario_id: "USER-1",
        }),
      (err) => {
        assert.equal(err.status, 400);
        assert.match(err.message, /la tiquetera no está ACTIVA/);
        return true;
      }
    );
  });
});
