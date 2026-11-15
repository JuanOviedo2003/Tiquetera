import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { app } from "../app.js";

describe("Login: nombre del restaurante para personalizar mensajes", () => {
  let server;
  let baseUrl;

  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  async function login(email, password) {
    const res = await fetch(`${baseUrl}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return { status: res.status, body: await res.json() };
  }

  it("un usuario del restaurante recibe restaurante_nombre del titular", async () => {
    const { status, body } = await login("cocina@tiquetera.com", "cocina123");
    assert.equal(status, 200);
    assert.equal(body.usuario.restaurante_id, "REST-1");
    // El titular de REST-1 es "Restaurante Demo", no el empleado "Cocina Central"
    assert.equal(body.usuario.restaurante_nombre, "Restaurante Demo");
    assert.equal(body.usuario.password, undefined);
    assert.equal(body.usuario.passwordHash, undefined);
  });

  it("el superusuario no tiene restaurante ni restaurante_nombre", async () => {
    const { status, body } = await login("admin@tiquetera.com", "admin123");
    assert.equal(status, 200);
    assert.equal(body.usuario.restaurante_nombre, undefined);
  });
});
