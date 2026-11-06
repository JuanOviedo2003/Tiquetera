
import { test, expect } from '@playwright/test';

// PRUEBA 1: Verificar que la pantalla de login se muestre correctamente
test('muestra correctamente la pantalla de inicio de sesión', async ({ page }) => {
  await page.goto('/');

  // Captura de pantalla del login
  await page.screenshot({
    path: 'test-results/login.png',
    fullPage: true
  });

  // Verificar título
  await expect(
    page.getByText('Tiquetera Restaurante')
  ).toBeVisible();

  // Verificar campo de correo
  await expect(
    page.getByPlaceholder('ejemplo@restaurante.com')
  ).toBeVisible();

  // Verificar campo de contraseña
  await expect(
    page.getByPlaceholder('••••••••')
  ).toBeVisible();

  // Verificar botón de ingreso
  await expect(
    page.getByRole('button', { name: /Ingresar a Terminal/i })
  ).toBeVisible();
});


// PRUEBA 2: Iniciar sesión con usuario válido
test('permite iniciar sesión con un usuario válido', async ({ page }) => {
  await page.goto('/');

  // Escribir el correo
  await page.getByPlaceholder('ejemplo@restaurante.com')
    .fill('prueba@gmail.com');

  // Escribir la contraseña
  await page.getByPlaceholder('••••••••')
    .fill('1234');

  // Hacer clic en el botón de ingreso
  await page.getByRole('button', { name: /Ingresar a Terminal/i })
    .click();

  // Verificar que el login desaparezca
  await expect(
    page.getByText('Tiquetera Restaurante')
  ).not.toBeVisible({ timeout: 10000 });

  // Captura de pantalla del dashboard
  await page.screenshot({
    path: 'test-results/dashboard.png',
    fullPage: true
  });
});
