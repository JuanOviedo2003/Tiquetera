# Tiquetera Mobile (React Native + Expo)

App móvil en React Native (Expo) aislada del `frontend/` web actual y conectada al mismo `backend/`.

## Instalación y ejecución

```bash
cd mobile
npm install
cp .env.example .env
# Edita .env con la URL real de tu backend dev (o cámbiala dentro de la app en "Servidor API")
npx expo start
```

Escanea el código QR de Expo con **Expo Go** en tu teléfono Android/iOS (en la misma red o con `--tunnel`).

## Nota sobre Docker y el backend
- Esta carpeta **no** necesita agregarse al `workspaces` raíz ni al `Dockerfile` del servidor.
- Se comunica por HTTP/HTTPS con el backend ya desplegado en `dev` (`app.use(cors())` ya está habilitado en `backend/app.js`).
