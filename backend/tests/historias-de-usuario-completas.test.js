import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { app } from "../app.js";

describe("Verificación Completa de Historias de Usuario (HU-R1 a HU-R12 y HU-C1 a HU-C5)", () => {
  let server;
  let baseUrl;

  before(async () => {
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

  // ==========================================
  // SPRINT 1 & MÓDULO RESTAURANTE BASE
  // ==========================================

  describe("HU-R11: Gestión de usuarios del restaurante & HU-R1: Inicio de sesión", () => {
    it("HU-R11: debe crear una cuenta de usuario con contraseña encriptada", async () => {
      const res = await fetch(`${baseUrl}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Carlos Gerente",
          email: "gerente@restaurante.com",
          password: "passwordSeguro123",
        }),
      });

      assert.equal(res.status, 201);
      const user = await res.json();
      assert.equal(user.name, "Carlos Gerente");
      assert.equal(user.email, "gerente@restaurante.com");
      assert.equal(user.role, "RESTAURANTE");
      assert.equal(user.active, true);
      assert.equal(user.passwordHash, undefined, "No debe exponer el hash de contraseña");
    });

    it("HU-R1: debe permitir inicio de sesión exitoso con el usuario creado", async () => {
      const res = await fetch(`${baseUrl}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "gerente@restaurante.com",
          password: "passwordSeguro123",
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.mensaje, "Inicio de sesión exitoso");
      assert.equal(data.usuario.email, "gerente@restaurante.com");
    });

    it("HU-R1: debe rechazar inicio de sesión con contraseña incorrecta", async () => {
      const res = await fetch(`${baseUrl}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "gerente@restaurante.com",
          password: "claveIncorrecta",
        }),
      });

      assert.equal(res.status, 401);
    });

    it("HU-R1: debe permitir inicio de sesión con credenciales demo iniciales", async () => {
      const res = await fetch(`${baseUrl}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "prueba@gmail.com",
          password: "1234",
        }),
      });

      assert.equal(res.status, 200);
    });
  });

  describe("HU-R2: Registro de clientes", () => {
    let clienteCreadoId;

    it("debe registrar un cliente con nombre, identificación y teléfono", async () => {
      const res = await fetch(`${baseUrl}/api/clientes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: "Pedro Gómez",
          identificacion: "1098765432",
          telefono: "3009988776",
          restaurante_id: "REST-HU-TEST",
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.ok(data.cliente.id);
      assert.equal(data.cliente.nombre, "Pedro Gómez");
      assert.equal(data.cliente.identificacion, "1098765432");
      clienteCreadoId = data.cliente.id;
    });

    it("debe consultar clientes por restaurante_id y por ID", async () => {
      const resList = await fetch(`${baseUrl}/api/clientes?restaurante_id=REST-HU-TEST`);
      assert.equal(resList.status, 200);
      const list = await resList.json();
      assert.ok(list.some((c) => c.identificacion === "1098765432"));

      const resById = await fetch(`${baseUrl}/api/clientes/${clienteCreadoId}`);
      assert.equal(resById.status, 200);
      const cliente = await resById.json();
      assert.equal(cliente.id, clienteCreadoId);
    });
  });

  describe("HU-R3: Creación de tiquetera & HU-R12: Entrega de código de activación", () => {
    let tiqueteraId;
    let codigoGenerado;

    it("HU-R3: debe crear tiquetera en estado PENDIENTE con código de activación de 6 dígitos", async () => {
      const res = await fetch(`${baseUrl}/api/tiqueteras`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id: "CLI-HU-TEST-1",
          total_almuerzos: 10,
          restaurante_id: "REST-HU-TEST",
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.tiquetera.estado, "PENDIENTE");
      assert.equal(data.tiquetera.total_almuerzos, 10);
      assert.equal(data.tiquetera.almuerzos_disponibles, 10);
      assert.match(data.tiquetera.codigo_activacion, /^\d{6}$/);

      tiqueteraId = data.tiquetera.id;
      codigoGenerado = data.tiquetera.codigo_activacion;
    });

    it("HU-R12: debe permitir consultar y copiar el código de activación de la tiquetera pendiente", async () => {
      const res = await fetch(`${baseUrl}/api/tiqueteras/${tiqueteraId}/codigo-activacion`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.tiquetera_id, tiqueteraId);
      assert.equal(data.estado, "PENDIENTE");
      assert.equal(data.codigo_activacion, codigoGenerado);
      assert.ok(data.fecha_expiracion_codigo);
    });
  });

  describe("HU-R4: Consulta y filtrado de tiqueteras", () => {
    it("debe filtrar tiqueteras por estado", async () => {
      const res = await fetch(`${baseUrl}/api/tiqueteras?estado=PENDIENTE`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data));
      assert.ok(data.every((t) => t.estado === "PENDIENTE"));
    });
  });

  // ==========================================
  // FLUJO CLIENTE: ACTIVACIÓN, QR Y PIN
  // ==========================================

  describe("HU-C1: Activación, HU-C2: Creación PIN, HU-C3: Regenerar PIN, HU-C4: Descarga QR", () => {
    let tiqueteraId;
    let codigoActivacion;
    let qrTokenGenerado;
    const pinInicial = "123456";

    before(async () => {
      // Registrar cliente y tiquetera previa
      const resCli = await fetch(`${baseUrl}/api/clientes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: "Laura Méndez",
          identificacion: "9876543210",
          telefono: "3112223344",
          restaurante_id: "REST-HU-TEST",
        }),
      });
      const dataCli = await resCli.json();

      const resTiq = await fetch(`${baseUrl}/api/tiqueteras`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id: dataCli.cliente.id,
          total_almuerzos: 8,
          restaurante_id: "REST-HU-TEST",
        }),
      });
      const dataTiq = await resTiq.json();
      tiqueteraId = dataTiq.tiquetera.id;
      codigoActivacion = dataTiq.tiquetera.codigo_activacion;
    });

    it("HU-C1 & HU-C2 & HU-C4: activar tiquetera con código y crear PIN de 6 dígitos retornando QR", async () => {
      const res = await fetch(`${baseUrl}/api/tiqueteras/activar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo_activacion: codigoActivacion,
          pin: pinInicial,
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.tiquetera.estado, "ACTIVA");
      assert.ok(data.qr_token, "Debe retornar el QR token generado");
      assert.ok(data.url_consulta, "Debe proveer la URL de consulta pública para conservar");
      qrTokenGenerado = data.qr_token;
    });

    it("HU-C3: debe permitir al cliente regenerar su PIN usando su QR token", async () => {
      const nuevoPin = "654321";
      const res = await fetch(`${baseUrl}/api/tiqueteras/regenerar-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qr_token: qrTokenGenerado,
          nuevo_pin: nuevoPin,
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.mensaje, "PIN regenerado exitosamente");

      // Validar que el PIN anterior falle y el nuevo funcione
      const resAntiguo = await fetch(`${baseUrl}/api/tiqueteras/validar-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qr_token: qrTokenGenerado,
          pin: pinInicial,
        }),
      });
      assert.equal(resAntiguo.status, 401);

      const resNuevo = await fetch(`${baseUrl}/api/tiqueteras/validar-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qr_token: qrTokenGenerado,
          pin: nuevoPin,
        }),
      });
      assert.equal(resNuevo.status, 200);
    });

    it("HU-C5: consulta pública de saldo e historial sin necesidad de cuenta", async () => {
      const res = await fetch(`${baseUrl}/api/tiqueteras/public/qr/${qrTokenGenerado}`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.cliente_nombre, "Laura Méndez");
      assert.equal(data.estado, "ACTIVA");
      assert.equal(data.saldo.total, 8);
      assert.equal(data.saldo.disponibles, 8);
      assert.equal(data.saldo.consumidos, 0);
      assert.ok(Array.isArray(data.movimientos));
    });
  });

  // ==========================================
  // SPRINT 2: FLUJO DE CONSUMO Y REVERSA
  // ==========================================

  describe("HU-R5: Apertura por QR, HU-R6: Validar PIN, HU-R7: Rejilla, HU-R8: Consumo, HU-R9: Reversa, HU-R10: Historial", () => {
    let tiqueteraId;
    let qrToken;
    const pin = "778899";
    let primerConsumoId;

    before(async () => {
      // Crear y activar tiquetera
      const resCli = await fetch(`${baseUrl}/api/clientes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: "Andrés Silva",
          identificacion: "1122334455",
          telefono: "3156677889",
          restaurante_id: "REST-HU-TEST",
        }),
      });
      const dataCli = await resCli.json();

      const resTiq = await fetch(`${baseUrl}/api/tiqueteras`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id: dataCli.cliente.id,
          total_almuerzos: 5,
          restaurante_id: "REST-HU-TEST",
        }),
      });
      const dataTiq = await resTiq.json();
      tiqueteraId = dataTiq.tiquetera.id;

      const resActivar = await fetch(`${baseUrl}/api/tiqueteras/activar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo_activacion: dataTiq.tiquetera.codigo_activacion,
          pin,
        }),
      });
      const dataActivar = await resActivar.json();
      qrToken = dataActivar.qr_token;
    });

    it("HU-R5: debe abrir la tiquetera mediante escaneo o ingreso del QR token", async () => {
      const res = await fetch(`${baseUrl}/api/tiqueteras/qr/${qrToken}`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.id, tiqueteraId);
      assert.equal(data.cliente_nombre, "Andrés Silva");
      assert.equal(data.estado, "ACTIVA");
    });

    it("HU-R6: debe validar el PIN del cliente antes de mostrar la tiquetera/rejilla", async () => {
      const res = await fetch(`${baseUrl}/api/tiqueteras/validar-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qr_token: qrToken,
          pin,
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.autorizado, true);
      assert.equal(data.cliente.nombre, "Andrés Silva");
    });

    it("HU-R7: debe visualizar la rejilla de almuerzos con cuadros disponibles", async () => {
      const res = await fetch(`${baseUrl}/api/rejilla/${qrToken}`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.saldo.total, 5);
      assert.equal(data.saldo.disponibles, 5);
      assert.equal(data.rejilla.length, 5);
      assert.ok(data.rejilla.every((cuadro) => cuadro.estado === "disponible"));
    });

    it("HU-R8: debe registrar consumo de almuerzos seleccionando cuadros en la rejilla", async () => {
      const res = await fetch(`${baseUrl}/api/consumos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tiquetera_id: tiqueteraId,
          pin,
          cantidad: 2,
          usuario_id: "MESERO-CARLOS",
          cuadros_seleccionados: [1, 2],
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.tiquetera.almuerzos_disponibles, 3);
      assert.equal(data.tiquetera.almuerzos_consumidos, 2);
      assert.equal(data.movimiento.tipo, "CONSUMO");
      primerConsumoId = data.movimiento.id;

      // Verificar actualización en la rejilla dinámica (HU-R7)
      const resRejilla = await fetch(`${baseUrl}/api/rejilla/${qrToken}`);
      const dataRejilla = await resRejilla.json();
      assert.equal(dataRejilla.saldo.disponibles, 3);
      assert.equal(dataRejilla.saldo.consumidos, 2);
      assert.equal(dataRejilla.rejilla[0].estado, "consumido");
      assert.equal(dataRejilla.rejilla[1].estado, "consumido");
      assert.equal(dataRejilla.rejilla[2].estado, "disponible");
    });

    it("HU-R9: debe permitir corregir (revertir) un consumo del mismo día restaurando el saldo", async () => {
      const res = await fetch(`${baseUrl}/api/consumos/reversa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consumo_id: primerConsumoId,
          usuario_id: "ADMIN-CARLOS",
          cuadro_deseleccionado: 1,
          motivo: "Cuadro seleccionado por error",
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.movimiento.tipo, "REVERSA");
      assert.equal(data.tiquetera.almuerzos_disponibles, 4, "Debe restaurar 1 almuerzo a disponibles");
      assert.equal(data.tiquetera.almuerzos_consumidos, 1);

      // Verificar reflejo en rejilla (HU-R7)
      const resRejilla = await fetch(`${baseUrl}/api/rejilla/${qrToken}`);
      const dataRejilla = await resRejilla.json();
      assert.equal(dataRejilla.saldo.disponibles, 4);
      assert.equal(dataRejilla.saldo.consumidos, 1);
    });

    it("HU-R10: debe consultar el historial de movimientos de la tiquetera", async () => {
      const res = await fetch(`${baseUrl}/api/consumos/tiquetera/${tiqueteraId}`);
      assert.equal(res.status, 200);
      const historial = await res.json();
      assert.ok(historial.length >= 2);
      assert.equal(historial[0].tipo, "CONSUMO");
      assert.equal(historial[1].tipo, "REVERSA");

      // Filtrar por fecha de hoy
      const hoy = new Date().toISOString().slice(0, 10);
      const resFecha = await fetch(`${baseUrl}/api/consumos/tiquetera/${tiqueteraId}?fecha=${hoy}`);
      assert.equal(resFecha.status, 200);
      const historialFiltrado = await resFecha.json();
      assert.equal(historialFiltrado.length, 2);
    });
  });
});
