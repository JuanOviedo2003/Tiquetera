
import { test, expect } from '@playwright/test';

// ======================================================
// PRUEBA 1: Verificar que la pantalla de login se muestre
// correctamente
// ======================================================
test('muestra correctamente la pantalla de inicio de sesión', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByText('Tiquetera Restaurante')
  ).toBeVisible();

  await expect(
    page.getByPlaceholder('ejemplo@restaurante.com')
  ).toBeVisible();

  await expect(
    page.getByPlaceholder('••••••••')
  ).toBeVisible();

  await expect(
    page.getByRole('button', { name: /Ingresar a Terminal/i })
  ).toBeVisible();

  await page.screenshot({
    path: 'test-results/login.png',
    fullPage: true
  });
});


// ======================================================
// PRUEBA 2: Iniciar sesión con usuario válido
// ======================================================
test('permite iniciar sesión con un usuario válido', async ({ page }) => {
  await page.goto('/');

  await page.getByPlaceholder('ejemplo@restaurante.com')
    .fill('prueba@gmail.com');

  await page.getByPlaceholder('••••••••')
    .fill('1234');

  await page.getByRole('button', { name: /Ingresar a Terminal/i })
    .click();

  // Verificar que el login desaparezca
  await expect(
    page.getByText('Tiquetera Restaurante')
  ).not.toBeVisible({ timeout: 10000 });

  await page.screenshot({
    path: 'test-results/dashboard.png',
    fullPage: true
  });
});


// ======================================================
// PRUEBA 3: Rechazar credenciales inválidas
// ======================================================
test('muestra error con credenciales inválidas', async ({ page }) => {
  await page.goto('/');

  await page.getByPlaceholder('ejemplo@restaurante.com')
    .fill('noexiste@example.com');

  await page.getByPlaceholder('••••••••')
    .fill('incorrecta123');

  await page.getByRole('button', { name: /Ingresar a Terminal/i })
    .click();

  await expect(
    page.getByText('Credenciales inválidas')
  ).toBeVisible({ timeout: 10000 });

  await page.screenshot({
    path: 'test-results/login-error.png',
    fullPage: true
  });
});


// ======================================================
// PRUEBA 4: Cerrar sesión
// ======================================================
test('permite cerrar sesión y regresar al login', async ({ page }) => {
  await page.goto('/');

  // Iniciar sesión
  await page.getByPlaceholder('ejemplo@restaurante.com')
    .fill('prueba@gmail.com');

  await page.getByPlaceholder('••••••••')
    .fill('1234');

  await page.getByRole('button', { name: /Ingresar a Terminal/i })
    .click();

  // Esperar a que desaparezca el login
  await expect(
    page.getByText('Tiquetera Restaurante')
  ).not.toBeVisible({ timeout: 10000 });

  // Buscar y pulsar cerrar sesión
  await page.getByRole('button', {
    name: /cerrar sesión|logout/i
  }).click();

  // Verificar que regrese al login
  await expect(
    page.getByText('Tiquetera Restaurante')
  ).toBeVisible({ timeout: 10000 });

  await page.screenshot({
    path: 'test-results/logout.png',
    fullPage: true
  });
});


// ======================================================
// PRUEBA 5: No permitir correo vacío
// ======================================================
test('no permite enviar el formulario con el correo vacío', async ({ page }) => {
  await page.goto('/');

  const email = page.getByPlaceholder('ejemplo@restaurante.com');
  const password = page.getByPlaceholder('••••••••');

  await password.fill('1234');

  await page.getByRole('button', { name: /Ingresar a Terminal/i })
    .click();

  // Comprobar que el correo es obligatorio
  expect(
    await email.evaluate(el => el.validity.valueMissing)
  ).toBe(true);

  await expect(
    page.getByText('Tiquetera Restaurante')
  ).toBeVisible();

  await page.screenshot({
    path: 'test-results/login-email-vacio.png',
    fullPage: true
  });
});


// ======================================================
// PRUEBA 6: No permitir contraseña vacía
// ======================================================
test('no permite enviar el formulario con la contraseña vacía', async ({ page }) => {
  await page.goto('/');

  const email = page.getByPlaceholder('ejemplo@restaurante.com');
  const password = page.getByPlaceholder('••••••••');

  await email.fill('prueba@gmail.com');

  await page.getByRole('button', { name: /Ingresar a Terminal/i })
    .click();

  // Comprobar que la contraseña es obligatoria
  expect(
    await password.evaluate(el => el.validity.valueMissing)
  ).toBe(true);

  await expect(
    page.getByText('Tiquetera Restaurante')
  ).toBeVisible();

  await page.screenshot({
    path: 'test-results/login-password-vacio.png',
    fullPage: true
  });
});


// ======================================================
// PRUEBA 7: No permitir ambos campos vacíos
// ======================================================
test('no permite enviar el formulario con ambos campos vacíos', async ({ page }) => {
  await page.goto('/');

  const email = page.getByPlaceholder('ejemplo@restaurante.com');
  const password = page.getByPlaceholder('••••••••');

  await page.getByRole('button', { name: /Ingresar a Terminal/i })
    .click();

  // Comprobar que ambos campos son obligatorios
  expect(
    await email.evaluate(el => el.validity.valueMissing)
  ).toBe(true);

  expect(
    await password.evaluate(el => el.validity.valueMissing)
  ).toBe(true);

  await expect(
    page.getByText('Tiquetera Restaurante')
  ).toBeVisible();

  await page.screenshot({
    path: 'test-results/login-campos-vacios.png',
    fullPage: true
  });
});


// ======================================================
// PRUEBA 8: Rechazar contraseña incorrecta
// ======================================================
test('rechaza el inicio de sesión con contraseña incorrecta', async ({ page }) => {
  await page.goto('/');

  await page.getByPlaceholder('ejemplo@restaurante.com')
    .fill('prueba@gmail.com');

  await page.getByPlaceholder('••••••••')
    .fill('contraseñaIncorrecta');

  await page.getByRole('button', { name: /Ingresar a Terminal/i })
    .click();

  await expect(
    page.getByText('Credenciales inválidas')
  ).toBeVisible({ timeout: 10000 });

  await expect(
    page.getByText('Tiquetera Restaurante')
  ).toBeVisible();

  await page.screenshot({
    path: 'test-results/login-password-incorrecta.png',
    fullPage: true
  });
});


// ======================================================
// PRUEBA 9: Rechazar correo inexistente
// ======================================================
test('rechaza el inicio de sesión con correo no registrado', async ({ page }) => {
  await page.goto('/');

  await page.getByPlaceholder('ejemplo@restaurante.com')
    .fill('usuarioinexistente@gmail.com');

  await page.getByPlaceholder('••••••••')
    .fill('123456');

  await page.getByRole('button', { name: /Ingresar a Terminal/i })
    .click();

  await expect(
    page.getByText('Credenciales inválidas')
  ).toBeVisible({ timeout: 10000 });

  await expect(
    page.getByText('Tiquetera Restaurante')
  ).toBeVisible();

  await page.screenshot({
    path: 'test-results/login-correo-inexistente.png',
    fullPage: true
  });
});


// ======================================================
// PRUEBA 10: Verificar mensaje de error
// ======================================================
test('muestra un mensaje cuando las credenciales son incorrectas', async ({ page }) => {
  await page.goto('/');

  await page.getByPlaceholder('ejemplo@restaurante.com')
    .fill('prueba@gmail.com');

  await page.getByPlaceholder('••••••••')
    .fill('incorrecta123');

  await page.getByRole('button', { name: /Ingresar a Terminal/i })
    .click();

  await expect(
    page.getByText(/Credenciales inválidas/i)
  ).toBeVisible({ timeout: 10000 });

  await page.screenshot({
    path: 'test-results/login-mensaje-error.png',
    fullPage: true
  });
});


// ======================================================
// PRUEBA 11: Verificar formato del correo electrónico
// ======================================================
test('no permite enviar un correo con formato inválido', async ({ page }) => {
  await page.goto('/');

  const email = page.getByPlaceholder('ejemplo@restaurante.com');

  await email.fill('correoIncorrecto');

  await page.getByPlaceholder('••••••••')
    .fill('1234');

  await page.getByRole('button', { name: /Ingresar a Terminal/i })
    .click();

  // Comprobar que el formato del correo es incorrecto
  expect(
    await email.evaluate(el => el.validity.typeMismatch)
  ).toBe(true);

  await expect(
    page.getByText('Tiquetera Restaurante')
  ).toBeVisible();

  await page.screenshot({
    path: 'test-results/login-correo-formato-invalido.png',
    fullPage: true
  });
});


// ======================================================
// PRUEBA 12: Acceso rápido con cuenta de demostración
// ======================================================
test('completa los campos al seleccionar una cuenta de demostración', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', {
    name: /Cajero Principal/i
  }).click();

  // Comprobar que el correo se complete automáticamente
  await expect(
    page.getByPlaceholder('ejemplo@restaurante.com')
  ).toHaveValue('prueba@gmail.com');

  // Comprobar que la contraseña se complete automáticamente
  await expect(
    page.getByPlaceholder('••••••••')
  ).toHaveValue('1234');

  await page.screenshot({
    path: 'test-results/login-demo.png',
    fullPage: true
  });
});

test('mantiene la sesión iniciada después de recargar la página', async ({ page }) => {
  await page.goto('/');

  await page.getByPlaceholder('ejemplo@restaurante.com').fill('prueba@gmail.com');
  await page.getByPlaceholder('••••••••').fill('1234');
  await page.getByRole('button', { name: /Ingresar a Terminal/i }).click();

  // Esperar a que el login termine
  await expect(page.getByText(/Tiqueteras/i).first()).toBeVisible();

  // Revisar almacenamiento antes de recargar
  const sesionAntes = await page.evaluate(() =>
    localStorage.getItem('tiquetera_auth_user')
  );

  console.log('Sesión antes de recargar:', sesionAntes);

  // Recargar
  await page.reload();

  // Revisar almacenamiento después de recargar
  const sesionDespues = await page.evaluate(() =>
    localStorage.getItem('tiquetera_auth_user')
  );

  console.log('Sesión después de recargar:', sesionDespues);

  // Comprobar resultado
  await expect(page.getByText(/Tiqueteras/i).first()).toBeVisible();
});


test('cierra sesión y elimina los datos del usuario', async ({ page }) => {
  // Iniciar sesión
  await page.goto('/');

  await page.getByPlaceholder('ejemplo@restaurante.com').fill('prueba@gmail.com');
  await page.getByPlaceholder('••••••••').fill('1234');
  await page.getByRole('button', { name: /Ingresar a Terminal/i }).click();

  // Verificar que ingresó
  await expect(
    page.getByRole('button', { name: /Cerrar Sesión/i })
  ).toBeVisible();

  // Cerrar sesión
  await page.getByRole('button', { name: /Cerrar Sesión/i }).click();

  // Verificar que volvió al login
  await expect(
    page.getByRole('button', { name: /Ingresar a Terminal/i })
  ).toBeVisible();

  // Verificar que se eliminaron los datos de sesión
  const sesion = await page.evaluate(() =>
    localStorage.getItem('tiquetera_auth_user')
  );

  expect(sesion).toBeNull();
});

test('muestra el login cuando no existe una sesión guardada', async ({ page }) => {
  // Eliminar cualquier sesión guardada
  await page.goto('/');

  await page.evaluate(() => {
    localStorage.removeItem('tiquetera_auth_user');
  });

  // Recargar la aplicación sin sesión
  await page.reload();

  // Debe mostrar el login
  await expect(
    page.getByRole('button', { name: /Ingresar a Terminal/i })
  ).toBeVisible();

  // No debe mostrar el botón de cerrar sesión
  await expect(
    page.getByRole('button', { name: /Cerrar Sesión/i })
  ).not.toBeVisible();
});


test('abre el formulario de registro de clientes', async ({ page }) => {
  // Iniciar sesión
  await page.goto('/');

  await page.getByPlaceholder('ejemplo@restaurante.com').fill('prueba@gmail.com');
  await page.getByPlaceholder('••••••••').fill('1234');
  await page.getByRole('button', { name: /Ingresar a Terminal/i }).click();

  // Entrar al módulo Clientes
  await page.getByRole('button', { name: 'Clientes' }).click();

  // Abrir el formulario
  await page.getByRole('button', { name: 'Registrar Cliente' }).click();

  // Verificar que el formulario se abrió
  await expect(
    page.getByText('Registrar Nuevo Cliente')
  ).toBeVisible();

  // Verificar los campos
  await expect(page.getByPlaceholder('Ej. Sofía Restrepo')).toBeVisible();
  await expect(page.getByPlaceholder('Ej. 1020304050')).toBeVisible();
  await expect(page.getByPlaceholder('Ej. 3105557890')).toBeVisible();

  // Verificar el botón para guardar
  await expect(
    page.getByRole('button', { name: 'Guardar Cliente' })
  ).toBeVisible();
});


test('registra un cliente con datos válidos', async ({ page }) => {
  // Iniciar sesión
  await page.goto('/');

  await page.getByPlaceholder('ejemplo@restaurante.com').fill('prueba@gmail.com');
  await page.getByPlaceholder('••••••••').fill('1234');
  await page.getByRole('button', { name: /Ingresar a Terminal/i }).click();

  // Entrar a Clientes
  await page.getByRole('button', { name: 'Clientes' }).click();

  // Abrir formulario
  await page.getByRole('button', { name: 'Registrar Cliente' }).click();

  // Completar información
  await page.getByPlaceholder('Ej. Sofía Restrepo').fill('Carlos Prueba');
  await page.getByPlaceholder('Ej. 1020304050').fill('987654321');
  await page.getByPlaceholder('Ej. 3105557890').fill('3101234567');

  // Guardar
  await page.getByRole('button', { name: 'Guardar Cliente' }).click();

  // Comprobar que aparece el cliente
  await expect(
    page.getByRole('heading', { name: 'Carlos Prueba' })
  ).toBeVisible();

  // Comprobar que aparece su identificación
  await expect(page.getByText('987654321')).toBeVisible();
});

test('impide registrar un cliente sin nombre', async ({ page }) => {
  // Iniciar sesión
  await page.goto('/');

  await page.getByPlaceholder('ejemplo@restaurante.com').fill('prueba@gmail.com');
  await page.getByPlaceholder('••••••••').fill('1234');
  await page.getByRole('button', { name: /Ingresar a Terminal/i }).click();

  // Entrar al módulo Clientes
  await page.getByRole('button', { name: 'Clientes' }).click();

  // Abrir el formulario
  await page.getByRole('button', { name: 'Registrar Cliente' }).click();

  // Completar únicamente la identificación
  await page.getByPlaceholder('Ej. 1020304050').fill('123456789');

  // Intentar guardar
  await page.getByRole('button', { name: 'Guardar Cliente' }).click();

  // Comprobar que el formulario sigue abierto
  await expect(
    page.getByText('Registrar Nuevo Cliente')
  ).toBeVisible();

  // Comprobar que el cliente no fue registrado
  await expect(
    page.getByRole('heading', { name: 'No hay clientes encontrados' })
  ).not.toBeVisible();
});
test('impide registrar un cliente sin identificación', async ({ page }) => {
  await page.goto('/');

  await page.getByPlaceholder('ejemplo@restaurante.com').fill('prueba@gmail.com');
  await page.getByPlaceholder('••••••••').fill('1234');
  await page.getByRole('button', { name: /Ingresar a Terminal/i }).click();

  await page.getByRole('button', { name: 'Clientes' }).click();
  await page.getByRole('button', { name: 'Registrar Cliente' }).click();

  await page.getByPlaceholder('Ej. Sofía Restrepo').fill('Cliente Sin Documento');
  await page.getByPlaceholder('Ej. 1020304050').fill('   ');

  await page.getByRole('button', { name: 'Guardar Cliente' }).click();

  await expect(
    page.getByText('El número de identificación o cédula es obligatorio')
  ).toBeVisible();

  await expect(page.getByText('Registrar Nuevo Cliente')).toBeVisible();
});

test('filtra correctamente el directorio de clientes', async ({ page }) => {
  await page.goto('/');

  await page.getByPlaceholder('ejemplo@restaurante.com').fill('prueba@gmail.com');
  await page.getByPlaceholder('••••••••').fill('1234');
  await page.getByRole('button', { name: /Ingresar a Terminal/i }).click();

  await page.getByRole('button', { name: 'Clientes' }).click();
  await page.getByRole('button', { name: 'Registrar Cliente' }).click();

  const identificacion = String(Date.now()).slice(-10);

  await page.getByPlaceholder('Ej. Sofía Restrepo').fill('Cliente Prueba Busqueda');
  await page.getByPlaceholder('Ej. 1020304050').fill(identificacion);
  await page.getByPlaceholder('Ej. 3105557890').fill('3105550000');

  await page.getByRole('button', { name: 'Guardar Cliente' }).click();

  await expect(
    page.getByRole('heading', { name: 'Cliente Prueba Busqueda' })
  ).toBeVisible();

  const buscador = page.getByPlaceholder(
    'Buscar por nombre, documento de identidad o teléfono...'
  );

  // Buscar por identificación
  await buscador.fill(identificacion);

  await expect(
    page.getByRole('heading', { name: 'Cliente Prueba Busqueda' })
  ).toBeVisible();

  // Buscar un cliente inexistente
  await buscador.fill('CLIENTE-QUE-NO-EXISTE');

  await expect(
    page.getByRole('heading', { name: 'No hay clientes encontrados' })
  ).toBeVisible();

  // Limpiar la búsqueda
  await buscador.clear();

  await expect(
    page.getByRole('heading', { name: 'Cliente Prueba Busqueda' })
  ).toBeVisible();
});


test('maneja el intento de registrar dos clientes con la misma identificación', async ({ page }) => {
  await page.goto('/');

  await page.getByPlaceholder('ejemplo@restaurante.com').fill('prueba@gmail.com');
  await page.getByPlaceholder('••••••••').fill('1234');
  await page.getByRole('button', { name: /Ingresar a Terminal/i }).click();

  await page.getByRole('button', { name: 'Clientes' }).click();

  const identificacion = String(Date.now()).slice(-10);

  // Registrar el primer cliente
  await page.getByRole('button', { name: 'Registrar Cliente' }).click();
  await page.getByPlaceholder('Ej. Sofía Restrepo').fill('Primer Cliente');
  await page.getByPlaceholder('Ej. 1020304050').fill(identificacion);
  await page.getByRole('button', { name: 'Guardar Cliente' }).click();

  await expect(
    page.getByRole('heading', { name: 'Primer Cliente' })
  ).toBeVisible();

  // Intentar registrar otro cliente con la misma identificación
  await page.getByRole('button', { name: 'Registrar Cliente' }).click();
  await page.getByPlaceholder('Ej. Sofía Restrepo').fill('Segundo Cliente');
  await page.getByPlaceholder('Ej. 1020304050').fill(identificacion);
  await page.getByRole('button', { name: 'Guardar Cliente' }).click();

  // El segundo registro no debería aparecer como un cliente nuevo
  await expect(
    page.getByRole('heading', { name: 'Segundo Cliente' })
  ).not.toBeVisible();
});

test('busca clientes por nombre, identificación y teléfono', async ({ page }) => {
  await page.goto('/');

  await page.getByPlaceholder('ejemplo@restaurante.com').fill('prueba@gmail.com');
  await page.getByPlaceholder('••••••••').fill('1234');
  await page.getByRole('button', { name: /Ingresar a Terminal/i }).click();

  await page.getByRole('button', { name: 'Clientes' }).click();
  await page.getByRole('button', { name: 'Registrar Cliente' }).click();

  const identificacion = String(Date.now()).slice(-10);
  const telefono = '310' + String(Date.now()).slice(-7);

  await page.getByPlaceholder('Ej. Sofía Restrepo').fill('Mariana Busqueda E2E');
  await page.getByPlaceholder('Ej. 1020304050').fill(identificacion);
  await page.getByPlaceholder('Ej. 3105557890').fill(telefono);

  await page.getByRole('button', { name: 'Guardar Cliente' }).click();

  const cliente = page.getByRole('heading', { name: 'Mariana Busqueda E2E' });
  await expect(cliente).toBeVisible();

  const buscador = page.getByPlaceholder(
    'Buscar por nombre, documento de identidad o teléfono...'
  );

  // Buscar por nombre
  await buscador.fill('Mariana Busqueda E2E');
  await expect(cliente).toBeVisible();

  // Buscar por identificación
  await buscador.fill(identificacion);
  await expect(cliente).toBeVisible();

  // Buscar por teléfono
  await buscador.fill(telefono);
  await expect(cliente).toBeVisible();

  // Una búsqueda que no coincide debe ocultar el cliente
  await buscador.fill('Dato inexistente 999999');
  await expect(cliente).not.toBeVisible();
});


test('permite iniciar la emisión de una tiquetera desde un cliente', async ({ page }) => {
  const erroresPagina = [];

  page.on('pageerror', error => {
    erroresPagina.push(error.message);
  });

  // 1. Iniciar sesión
  await page.goto('/');

  await page.getByPlaceholder('ejemplo@restaurante.com').fill('prueba@gmail.com');
  await page.getByPlaceholder('••••••••').fill('1234');

  await page.getByRole('button', {
    name: /Ingresar a Terminal/i
  }).click();

  // 2. Entrar al directorio de clientes
  await page.getByRole('button', { name: 'Clientes' }).click();

  // 3. Abrir formulario de registro
  await page.getByRole('button', {
    name: 'Registrar Cliente'
  }).click();

  // 4. Generar identificación única
  const identificacion = String(Date.now()).slice(-10);

  // 5. Registrar cliente
  await page.getByPlaceholder('Ej. Sofía Restrepo')
    .fill('Cliente Emision E2E');

  await page.getByPlaceholder('Ej. 1020304050')
    .fill(identificacion);

  await page.getByRole('button', {
    name: 'Guardar Cliente'
  }).click();

  // 6. Localizar la tarjeta mediante su identificación
  const tarjetaCliente = page.locator('div').filter({
    has: page.getByText(identificacion, { exact: true })
  }).filter({
    has: page.getByRole('button', {
      name: 'Emitir Tiquetera'
    })
  }).last();

  await expect(tarjetaCliente).toBeVisible();

  // 7. Pulsar el botón de emisión correspondiente
  const botonEmitir = tarjetaCliente.getByRole('button', {
    name: 'Emitir Tiquetera'
  });

  await expect(botonEmitir).toBeVisible();
  await botonEmitir.click();

  // 8. Comprobar que no hubo errores JavaScript
  await expect.poll(() => erroresPagina).toHaveLength(0);
});


test('HU-R4: muestra el listado y los controles de filtrado de tiqueteras', async ({ page }) => {
  await page.goto('/');

  // Iniciar sesión
  await page.getByPlaceholder('ejemplo@restaurante.com').fill('prueba@gmail.com');
  await page.getByPlaceholder('••••••••').fill('1234');

  await page.getByRole('button', {
    name: /Ingresar a Terminal/i
  }).click();

  // Entrar a Tiqueteras
  await page.getByRole('button', {
    name: 'Tiqueteras'
  }).click();

  // Comprobar encabezado
  await expect(
    page.getByRole('heading', { name: 'Control de Tiqueteras' })
  ).toBeVisible();

  // Comprobar buscador
  await expect(
    page.getByPlaceholder('Buscar por comensal o cliente...')
  ).toBeVisible();

  // Comprobar filtro de estados
  const filtroEstado = page.locator('select');

  await expect(filtroEstado).toBeVisible();

  await expect(filtroEstado.locator('option')).toHaveCount(4);

  await expect(filtroEstado.locator('option').nth(0))
    .toHaveText('Todos los estados');

  await expect(filtroEstado.locator('option').nth(1))
    .toContainText('PENDIENTE');

  await expect(filtroEstado.locator('option').nth(2))
    .toContainText('ACTIVA');

  await expect(filtroEstado.locator('option').nth(3))
    .toContainText('FINALIZADA');
});


test('HU-R4: permite filtrar tiqueteras por estado', async ({ page }) => {
  await page.goto('/');

  // Iniciar sesión
  await page.getByPlaceholder('ejemplo@restaurante.com').fill('prueba@gmail.com');
  await page.getByPlaceholder('••••••••').fill('1234');
  await page.getByRole('button', { name: /Ingresar a Terminal/i }).click();

  // Entrar a Tiqueteras
  await page.getByRole('button', { name: 'Tiqueteras' }).click();

  await expect(
    page.getByRole('heading', { name: 'Control de Tiqueteras' })
  ).toBeVisible();

  // Localizar el filtro
  const filtroEstado = page.locator('select');
  await expect(filtroEstado).toBeVisible();

  // Seleccionar PENDIENTE
  await filtroEstado.selectOption('PENDIENTE');
  await expect(filtroEstado).toHaveValue('PENDIENTE');

  // Seleccionar ACTIVA
  await filtroEstado.selectOption('ACTIVA');
  await expect(filtroEstado).toHaveValue('ACTIVA');

  // Seleccionar FINALIZADA
  await filtroEstado.selectOption('FINALIZADA');
  await expect(filtroEstado).toHaveValue('FINALIZADA');

  // Volver a mostrar todos los estados
  await filtroEstado.selectOption('');
  await expect(filtroEstado).toHaveValue('');
});


test('HU-R4: permite buscar tiqueteras por nombre de cliente', async ({ page }) => {
  await page.goto('/');

  // Iniciar sesión
  await page.getByPlaceholder('ejemplo@restaurante.com').fill('prueba@gmail.com');
  await page.getByPlaceholder('••••••••').fill('1234');
  await page.getByRole('button', { name: /Ingresar a Terminal/i }).click();

  // Entrar a Tiqueteras
  await page.getByRole('button', { name: 'Tiqueteras' }).click();

  const buscador = page.getByPlaceholder('Buscar por comensal o cliente...');

  await expect(buscador).toBeVisible();

  // Escribir un nombre que probablemente no exista
  await buscador.fill('ClienteInexistenteE2E');

  await expect(
    page.getByText('No hay tiqueteras registradas')
  ).toBeVisible();

  await expect(
    page.getByText('No hay registros que coincidan con los filtros aplicados.')
  ).toBeVisible();

  // Limpiar búsqueda
  await buscador.fill('');

  await expect(buscador).toHaveValue('');
});


test('HU-R5: muestra el formulario para abrir una tiquetera por QR', async ({ page }) => {
  await page.goto('/');

  // Iniciar sesión
  await page.getByPlaceholder('ejemplo@restaurante.com').fill('prueba@gmail.com');
  await page.getByPlaceholder('••••••••').fill('1234');
  await page.getByRole('button', { name: /Ingresar a Terminal/i }).click();

  // Entrar al módulo de consumo
  await page.getByRole('button', { name: 'Consumo' }).click();

  // Comprobar la pantalla de apertura
  await expect(
    page.getByRole('heading', { name: 'Registro de Consumo' })
  ).toBeVisible();

  await expect(
    page.getByRole('heading', { name: 'Abrir tiquetera' })
  ).toBeVisible();

  await expect(
    page.getByLabel('Token del QR')
  ).toBeVisible();

  await expect(
    page.getByRole('button', { name: 'Abrir tiquetera' })
  ).toBeVisible();

  await expect(
    page.getByRole('button', { name: 'Escanear con cámara' })
  ).toBeVisible();
});


test('HU-R5: abre una tiquetera activa con su token QR', async ({ page }) => {
  const tokenQR = 'ae264d4a-d90b-438c-aa79-8366c0fdc046';

  await page.goto('/');

  await page.getByPlaceholder('ejemplo@restaurante.com').fill('prueba@gmail.com');
  await page.getByPlaceholder('••••••••').fill('1234');

  await page.getByRole('button', {
    name: /Ingresar a Terminal/i
  }).click();

  await page.getByRole('button', {
    name: 'Consumo'
  }).click();

  await page.getByLabel('Token del QR').fill(tokenQR);

  await page.getByRole('button', {
    name: 'Abrir tiquetera'
  }).click();

  // Esperar la respuesta de la API
  await page.waitForTimeout(1500);

  // Mostrar información de diagnóstico
  console.log('URL actual:', page.url());

  console.log(
    'Texto visible:',
    (await page.locator('body').innerText()).slice(0, 1500)
  );

  console.log(
    'Campos visibles:',
    await page.locator('input:visible').evaluateAll(
      inputs => inputs.map(input => ({
        placeholder: input.placeholder,
        ariaLabel: input.getAttribute('aria-label'),
        type: input.type
      }))
    )
  );

  // Comprobar que apareció la pantalla del PIN
  await expect(
    page.locator('#pin-cliente')
  ).toBeVisible();
});

test('HU-R6: rechaza un PIN incorrecto', async ({ page }) => {
  const tokenQR = 'ae264d4a-d90b-438c-aa79-8366c0fdc046';
  const pinIncorrecto = '000000'; // Asegúrate de que no sea el PIN real.

  await page.goto('/');

  await page.getByPlaceholder('ejemplo@restaurante.com').fill('prueba@gmail.com');
  await page.getByPlaceholder('••••••••').fill('1234');
  await page.getByRole('button', { name: /Ingresar a Terminal/i }).click();

  await page.getByRole('button', { name: 'Consumo' }).click();
  await page.getByLabel('Token del QR').fill(tokenQR);
  await page.getByRole('button', { name: 'Abrir tiquetera' }).click();

  await expect(page.locator('#pin-cliente')).toBeVisible();

  await page.locator('#pin-cliente').fill(pinIncorrecto);
  await page.getByRole('button', { name: 'Validar PIN' }).click();

  await expect(page.locator('#pin-cliente')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Rejilla de almuerzos' })).not.toBeVisible();
});

test('HU-R6: permite acceder con un PIN correcto', async ({ page }) => {
  const tokenQR = 'ae264d4a-d90b-438c-aa79-8366c0fdc046';
  const pinCorrecto = process.env.PIN_TIQUETERA;

  expect(pinCorrecto, 'Configura PIN_TIQUETERA antes de ejecutar la prueba').toMatch(/^\d{6}$/);

  await page.goto('/');

  await page.getByPlaceholder('ejemplo@restaurante.com').fill('prueba@gmail.com');
  await page.getByPlaceholder('••••••••').fill('1234');
  await page.getByRole('button', { name: /Ingresar a Terminal/i }).click();

  await page.getByRole('button', { name: 'Consumo' }).click();
  await page.getByLabel('Token del QR').fill(tokenQR);
  await page.getByRole('button', { name: 'Abrir tiquetera' }).click();

  await expect(page.locator('#pin-cliente')).toBeVisible();

  await page.locator('#pin-cliente').fill(pinCorrecto);
  await page.getByRole('button', { name: 'Validar PIN' }).click();

  await expect(page.locator('#pin-cliente')).not.toBeVisible();
});

test('HU-R6: deshabilita la validación si el PIN tiene menos de 6 dígitos', async ({ page }) => {
  const tokenQR = 'ae264d4a-d90b-438c-aa79-8366c0fdc046';

  await page.goto('/');

  await page.getByPlaceholder('ejemplo@restaurante.com').fill('prueba@gmail.com');
  await page.getByPlaceholder('••••••••').fill('1234');
  await page.getByRole('button', { name: /Ingresar a Terminal/i }).click();

  await page.getByRole('button', { name: 'Consumo', exact: true }).click();
  await page.getByLabel('Token del QR').fill(tokenQR);
  await page.getByRole('button', { name: 'Abrir tiquetera' }).click();

  await expect(page.locator('#pin-cliente')).toBeVisible();

  await page.locator('#pin-cliente').fill('12345');

  await expect(
    page.getByRole('button', { name: 'Validar PIN' })
  ).toBeDisabled();
});

test('HU-C1: exige un código de activación de 6 dígitos', async ({ page }) => {
  await page.goto('http://localhost:5174/activar');

  const codigo = page.locator('#codigo-activacion');
  const pin = page.locator('#pin-nuevo');
  const confirmarPin = page.locator('#pin-confirmar');

  await expect(codigo).toBeVisible();
  await expect(pin).toBeVisible();
  await expect(confirmarPin).toBeVisible();

  await codigo.fill('12345');
  await pin.fill('123456');
  await confirmarPin.fill('123456');

  await expect(
    page.getByRole('button', {
      name: /Activar Tiquetera y Obtener mi QR/i
    })
  ).toBeDisabled();
});