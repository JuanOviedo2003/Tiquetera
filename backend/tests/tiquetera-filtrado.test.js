import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import TiqueteraEntity from "../src/modules/tiquetera/entity/tiquetera.entity.js";
import ClienteEntity from "../src/modules/cliente/entity/cliente.entity.js";
import { TiqueteraService } from "../src/modules/tiquetera/services/tiquetera.service.js";
import { ClienteService } from "../src/modules/cliente/services/cliente.service.js";

describe("HU-R4: Consulta y filtrado de tiqueteras", () => {
  let tiqueteraService;
  let clienteService;
  let clienteAna;
  let clienteLuis;

  beforeEach(() => {
    TiqueteraEntity.clearAll();
    ClienteEntity.clearAll();
    tiqueteraService = new TiqueteraService();
    clienteService = new ClienteService();

    clienteAna = clienteService.createCliente({
      nombre: "Ana Pérez",
      identificacion: "1001",
      restaurante_id: "REST-1",
    });

    clienteLuis = clienteService.createCliente({
      nombre: "Luis Gómez",
      identificacion: "1002",
      restaurante_id: "REST-1",
    });

    tiqueteraService.createTiquetera({
      cliente_id: clienteAna.id,
      total_almuerzos: 10,
    });

    const tiqueteraLuis = tiqueteraService.createTiquetera({
      cliente_id: clienteLuis.id,
      total_almuerzos: 5,
    });

    tiqueteraService.activarTiquetera({
      codigo_activacion: tiqueteraLuis.codigo_activacion,
      pin: "123456",
    });
  });

  it("debe listar todas las tiqueteras enriquecidas con el nombre del cliente (RF-17)", () => {
    const resultado = tiqueteraService.getAllTiqueteras();

    assert.equal(resultado.length, 2);
    assert.ok(resultado.some((t) => t.cliente_nombre === "Ana Pérez"));
    assert.ok(resultado.some((t) => t.cliente_nombre === "Luis Gómez"));
  });

  it("debe filtrar por nombre de cliente de forma parcial e insensible a mayúsculas", () => {
    const resultado = tiqueteraService.getAllTiqueteras({ cliente_nombre: "ana" });

    assert.equal(resultado.length, 1);
    assert.equal(resultado[0].cliente_nombre, "Ana Pérez");
  });

  it("debe filtrar por estado", () => {
    const resultado = tiqueteraService.getAllTiqueteras({ estado: "ACTIVA" });

    assert.equal(resultado.length, 1);
    assert.equal(resultado[0].cliente_nombre, "Luis Gómez");
    assert.equal(resultado[0].estado, "ACTIVA");
  });

  it("debe filtrar por fecha de creación (YYYY-MM-DD)", () => {
    const hoy = new Date().toISOString().slice(0, 10);

    const resultado = tiqueteraService.getAllTiqueteras({ fecha_creacion: hoy });
    assert.equal(resultado.length, 2);

    const sinResultados = tiqueteraService.getAllTiqueteras({
      fecha_creacion: "2000-01-01",
    });
    assert.equal(sinResultados.length, 0);
  });

  it("debe rechazar un formato de fecha inválido", () => {
    assert.throws(
      () => tiqueteraService.getAllTiqueteras({ fecha_creacion: "01-01-2026" }),
      /formato YYYY-MM-DD/
    );
  });

  it("debe combinar filtros de nombre y estado sin arrojar resultados si no coinciden", () => {
    const resultado = tiqueteraService.getAllTiqueteras({
      cliente_nombre: "Ana",
      estado: "ACTIVA",
    });

    assert.equal(resultado.length, 0);
  });
});
