
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests-e2e',

  reporter: [
    ['html', { open: 'always' }]
  ],

  use: {
    baseURL: 'http://localhost:5173',

    // Abrir el navegador visible
    headless: false,

    // Capturas de pantalla de todas las pruebas
    screenshot: 'on',

    // Grabar video de todas las pruebas
    video: 'on',

    // Guardar trazas para analizar las pruebas
    trace: 'on'
  }
});
