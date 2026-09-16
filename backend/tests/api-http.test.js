import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { app } from "../app.js";

describe("API Endpoints HTTP Integration Tests", () => {
  let server;
  let baseUrl;

  before(async () => {
    // Iniciar servidor en puerto efímero asignado por el SO (port 0)
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it("POST /api/tiqueteras - debe crear una tiquetera con código y estado PENDIENTE", async () => {
    const res = await fetch(`${baseUrl}/api/tiqueteras`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cliente_id: "CLI-HTTP-1",
        total_almuerzos: 12,
        restaurante_id: "REST-1",
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.ok(body.tiquetera);
    assert.equal(body.tiquetera.cliente_id, "CLI-HTTP-1");
    assert.equal(body.tiquetera.total_almuerzos, 12);
    assert.equal(body.tiquetera.almuerzos_disponibles, 12);
    assert.equal(body.tiquetera.almuerzos_consumidos, 0);
    assert.equal(body.tiquetera.estado, "PENDIENTE");
    assert.match(body.tiquetera.codigo_activacion, /^\d{6}$/);
  });

  it("Flujo Completo: Crear -> Activar -> Consumir -> Consultar Historial", async () => {
    // 1. Crear tiquetera
    const resCrear = await fetch(`${baseUrl}/api/tiqueteras`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cliente_id: "CLI-HTTP-2",
        total_almuerzos: 5,
        restaurante_id: "REST-1",
      }),
    });
    assert.equal(resCrear.status, 201);
    const { tiquetera: tiqCreada } = await resCrear.json();

    // 2. Activar tiquetera con PIN de 6 dígitos
    const pinCliente = "889900";
    const resActivar = await fetch(`${baseUrl}/api/tiqueteras/activar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codigo_activacion: tiqCreada.codigo_activacion,
        pin: pinCliente,
      }),
    });
    assert.equal(resActivar.status, 200);
    const bodyActivar = await resActivar.json();
    assert.equal(bodyActivar.tiquetera.estado, "ACTIVA");
    assert.ok(bodyActivar.qr_token);

    // 3. Registrar consumo exitoso
    const resConsumo = await fetch(`${baseUrl}/api/consumos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tiquetera_id: tiqCreada.id,
        pin: pinCliente,
        cantidad: 2,
        usuario_id: "USER-ADMIN",
        cuadros_seleccionados: [0, 1],
      }),
    });
    assert.equal(resConsumo.status, 201);
    const bodyConsumo = await resConsumo.json();
    assert.equal(bodyConsumo.tiquetera.almuerzos_consumidos, 2);
    assert.equal(bodyConsumo.tiquetera.almuerzos_disponibles, 3);
    assert.equal(bodyConsumo.movimiento.tipo, "CONSUMO");

    // 4. Intentar consumo con PIN erróneo (debe responder 401)
    const resPinInvalido = await fetch(`${baseUrl}/api/consumos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tiquetera_id: tiqCreada.id,
        pin: "000000",
        cantidad: 1,
        usuario_id: "USER-ADMIN",
      }),
    });
    assert.equal(resPinInvalido.status, 401);

    // 5. Consumir el saldo restante (3 almuerzos) para finalizar la tiquetera
    const resFinalizar = await fetch(`${baseUrl}/api/consumos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tiquetera_id: tiqCreada.id,
        pin: pinCliente,
        cantidad: 3,
        usuario_id: "USER-ADMIN",
        cuadros_seleccionados: [2, 3, 4],
      }),
    });
    assert.equal(resFinalizar.status, 201);
    const bodyFinalizar = await resFinalizar.json();
    assert.equal(bodyFinalizar.tiquetera.almuerzos_disponibles, 0);
    assert.equal(bodyFinalizar.tiquetera.estado, "FINALIZADA");

    // 6. Consultar historial de movimientos
    const resHistorial = await fetch(
      `${baseUrl}/api/consumos/tiquetera/${tiqCreada.id}`
    );
    assert.equal(resHistorial.status, 200);
    const historial = await resHistorial.json();
    assert.equal(historial.length, 2);
    assert.equal(historial[0].cantidad, 2);
    assert.equal(historial[1].cantidad, 3);
  });
});
