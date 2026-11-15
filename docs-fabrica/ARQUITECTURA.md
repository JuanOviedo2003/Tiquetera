# ARQUITECTURA — Tiquetera Web

> Generado analizando el código real del repositorio (rama `develop-juan`). No se modificó código fuente.

## 1. Resumen ejecutivo

Tiquetera es una aplicación web monorepo (npm workspaces: `frontend` React 19 + Vite, `backend` Node.js 22/24 + Express 5) para restaurantes que venden almuerzos prepagados ("tiqueteras").
El restaurante crea tiqueteras con un código de activación; el cliente las activa sin cuenta, recibe un QR (UUID) y un PIN de 6 dígitos, y el restaurante descuenta almuerzos validando el PIN sobre una rejilla de cuadros.
Un rol `SUPER_ADMIN` administra restaurantes, estados y PINes; la persistencia efectiva es SQLite (`node:sqlite`) y Prisma/MongoDB solo se conecta y siembra usuarios.

---

## 2. Materia prima (Entradas)

### 2.1 Peticiones HTTP JSON al backend (`backend/app.js`, prefijo `/api`)
El servidor Express usa `cors()` y `express.json()` (`backend/app.js:17-18`). Todas las rutas están **sin middleware de autenticación**.

| Ruta | Método | Entra |
|---|---|---|
| `/api/login` | POST | `{email, password}` |
| `/api/users` | GET `?restaurante_id`, POST | `{name, email, password, restaurante_id}` |
| `/api/users/restaurantes` | GET, POST | `{name, email, password, precio_tiquetera}` |
| `/api/users/restaurantes/:id` | PUT, DELETE | `{name, email, password, active, precio_tiquetera}` |
| `/api/clientes` | GET `?restaurante_id`, POST | `{nombre, identificacion, telefono, restaurante_id}` |
| `/api/clientes/:id`, `/api/clientes/search/:id` | GET | id en ruta |
| `/api/tiqueteras` | POST, GET | `{cliente_id, total_almuerzos, restaurante_id}`; filtros `cliente_id, cliente_nombre, estado, fecha_creacion (YYYY-MM-DD), restaurante_id` |
| `/api/tiqueteras/activar` | POST | `{codigo_activacion, pin}` (público) |
| `/api/tiqueteras/validar-pin` y `/:id/validar-pin` | POST | `{qr_token \| id, pin}` |
| `/api/tiqueteras/regenerar-pin` | POST | `{qr_token, pin_anterior, nuevo_pin}` (público) |
| `/api/tiqueteras/:id/reemitir-codigo` | POST | id |
| `/api/tiqueteras/:id/codigo-activacion` | GET | id |
| `/api/tiqueteras/qr/:qrToken`, `/public/qr/:qrToken` | GET | token QR |
| `/api/tiqueteras/admin/pines` | GET | `?restaurante_id&tiquetera_id` |
| `/api/tiqueteras/:id/admin-pin` | PUT | `{nuevo_pin}` |
| `/api/tiqueteras/:id/estado` | PUT | `{estado}` (PENDIENTE/ACTIVA/FINALIZADA) |
| `/api/tiqueteras/:id` | GET, DELETE (`?admin=true` o `?force=true` fuerza) | id |
| `/api/consumos` | POST | `{tiquetera_id, pin, cantidad, usuario_id, cuadros_seleccionados[]}` |
| `/api/consumos/reversa` | POST | `{consumo_id, usuario_id, cuadro_deseleccionado, motivo}` |
| `/api/consumos/tiquetera/:tiqueteraId` | GET | `?fecha=YYYY-MM-DD` |
| `/api/rejilla/:qrToken` | GET | token QR |
| `/health` | GET | — |

### 2.2 Entradas del navegador (frontend)
- **URL pública** interpretada por `parseRouteFromUrl()` en `frontend/src/App.jsx`: `/tiquetera/<token>`, `/qr/<token>`, `?qr=` → vista cliente; `/activar`, `?codigo=` → activación; cualquier otra → consola restaurante.
- **Formularios** de las vistas en `frontend/src/views/` (todos terminan en llamadas de `frontend/src/services/api.js`, `fetch` a `VITE_API_URL || '/api'`).
- **Cámara / imagen QR**: `frontend/src/components/QrScanner.jsx` y `frontend/src/utils/qr.js` (`jsQR`, `BarcodeDetector` como respaldo, `decodeQrFromImageFile`).
- **localStorage** clave `tiquetera_auth_user` (sesión rehidratada en `frontend/src/context/AuthContext.jsx`).

### 2.3 Entradas de infraestructura
- Variables de entorno: `PORT`, `NODE_ENV`, `DATABASE_URL` (Mongo/Prisma), `DB_PATH` (ruta del archivo SQLite), `VITE_API_URL` (frontend).
- Evento `push` a `main` → `.github/workflows/deployment-main.yml` (deploy por SSH, ver §3.9).

---

## 3. Estaciones de ensamblaje (Módulos)

Patrón de cada módulo en `backend/src/modules/<modulo>/`: **route → controller → service → entity** (la entity ejecuta SQL directo con `db.prepare(...)`). Los módulos `login` y `rejilla` tienen los archivos en la raíz del módulo; el resto usa subcarpetas `routes/ controllers/ services/ entity/`.

### 1. Bootstrap / servidor HTTP
- **Controla:** `backend/app.js`.
- **Recibe:** todas las peticiones HTTP; variable `PORT` (default 3000).
- **Transforma:** monta los routers en `/api/users|clientes|tiqueteras|consumos|login|rejilla`, `/health`; sirve el build estático `frontend/dist` buscándolo en 4 rutas candidatas y hace fallback SPA (`index.html`) para GET no-`/api`; responde 404 JSON `{error:"Ruta no encontrada"}`; no abre el puerto si detecta entorno de test.
- **Entrega:** respuestas JSON, archivos estáticos del SPA y `connectPrisma()` al arrancar.

### 2. Configuración de datos
- **Controla:** `backend/src/config/database.js` (SQLite) y `backend/src/config/prisma.js` (Prisma).
- **Recibe:** `DB_PATH`, `NODE_ENV`/argumentos de test, `DATABASE_URL`.
- **Transforma:** `database.js` abre `DatabaseSync` de `node:sqlite` (`backend/data/tiquetera.db`, o `:memory:` en test), activa WAL y foreign keys, ejecuta `initSchema()` al importarse (CREATE TABLE IF NOT EXISTS + `ALTER TABLE ADD COLUMN` tolerantes) y `seedDefaultUsers()`. `prisma.js` crea el `PrismaClient` y, si hay `DATABASE_URL`, conecta y siembra 2 usuarios demo en Mongo.
- **Entrega:** el objeto `db` usado por todas las entities; `prisma` no lo usa ningún módulo de negocio.

### 3. Login
- **Controla:** `backend/src/modules/login/` (`login.route.js`, `login.controller.js`, `login.service.js`, `login.entity.js`).
- **Recibe:** `{email, password}`.
- **Transforma:** normaliza el email, busca primero en `UserEntity.findByEmail` y si no existe en una lista `seedUsers` en memoria; compara con `bcrypt.compareSync` contra `passwordHash`, o por igualdad directa contra `password` (texto plano legado); verifica cuenta activa.
- **Entrega:** `200 {mensaje, usuario}` con el registro de usuario completo (no hay token/JWT) o `401/400 {error}`.

### 4. Usuarios y restaurantes
- **Controla:** `backend/src/modules/user/` (`user.route.js`, `user.controller.js`, `user.service.js`, `user.entity.js`).
- **Recibe:** datos de usuario/restaurante (ver §2.1).
- **Transforma:** valida campos; hashea contraseña con `bcrypt.hashSync(…, 10)`; un "restaurante" es un usuario `RESTAURANTE` con `es_titular=true` y `restaurante_id = REST-<timestamp>-<rand>`; los empleados comparten `restaurante_id`; `buildResumenRestaurante` agrega conteos de tiqueteras y valor estimado (`precio_tiquetera`); `updateRestaurante` propaga `active` a todo el equipo; `deleteRestaurante` hace borrado en cascada (`UserEntity.deleteRestauranteCascade`: movimientos, pin_historial, tiqueteras, clientes y usuarios del restaurante).
- **Entrega:** usuarios sin `password`/`passwordHash`; restaurantes con `total_equipo` y `resumen_tiqueteras`.

### 5. Clientes
- **Controla:** `backend/src/modules/cliente/` (`cliente.route.js`, `cliente.controller.js`, `cliente.service.js`, `cliente.entity.js`).
- **Recibe:** `{nombre, identificacion, telefono?, restaurante_id}`.
- **Transforma:** exige nombre e identificación; teléfono `^\d{7,15}$`; rechaza identificación duplicada dentro del mismo restaurante.
- **Entrega:** registro de cliente / listado filtrado por `restaurante_id`.

### 6. Tiqueteras (núcleo del negocio)
- **Controla:** `backend/src/modules/tiquetera/` (`tiquetera.route.js`, `tiquetera.controller.js`, `tiquetera.service.js` — 687 líneas, `tiquetera.entity.js`).
- **Recibe:** creación, activación, validación/regeneración de PIN, consultas por QR y operaciones admin.
- **Transforma:**
  - Creación: estado `PENDIENTE`, código `crypto.randomInt(100000,1000000)`, expira en 48 h; reemisión solo en `PENDIENTE`.
  - Activación: valida código vigente/no usado, PIN `^\d{6}$`; guarda `pin_hash` (SHA-256), genera `qr_token = crypto.randomUUID()`, estado `ACTIVA`, registra en `pin_historial` (origen `ACTIVACION`).
  - Validación de PIN: 3 intentos fallidos → bloqueo 15 min (`bloqueado_hasta`, HTTP 403); acierto resetea contadores.
  - Regeneración de PIN: exige PIN anterior; registra origen `CLIENTE`.
  - Vista pública por QR: saldo y movimientos agrupados por día, sin PIN.
  - Admin: cambiar estado (con reglas de reactivación/reseteo), cambiar PIN (origen `SUPER_ADMIN`), listar PINes con historial, eliminar (una `ACTIVA` solo con `admin=true`/`force=true`).
- **Entrega:** objetos tiquetera (con `cliente_nombre`), saldo `{total, consumidos, disponibles}`, `qr_token`, listados y errores `{error}` con 400/401/403/404.

### 7. Consumos (movimientos)
- **Controla:** `backend/src/modules/consumo/` (`consumo.route.js`, `consumo.controller.js`, `consumo.service.js`, `consumo.entity.js`).
- **Recibe:** `{tiquetera_id, pin, cantidad, usuario_id, cuadros_seleccionados}`; reversas `{consumo_id, usuario_id, cuadro_deseleccionado, motivo}`.
- **Transforma:** `registrarConsumo` verifica estado `ACTIVA`, bloqueo, PIN (SHA-256, misma política de 3 intentos/15 min), saldo suficiente; actualiza `almuerzos_consumidos/disponibles`; pasa a `FINALIZADA` al llegar a 0; inserta un movimiento `CONSUMO`. `revertirConsumo` solo permite el mismo día calendario UTC, un cuadro una sola vez, inserta movimiento `REVERSA` (no borra el original), recalcula saldo y reactiva la tiquetera.
- **Entrega:** `201/200 {mensaje, movimiento, tiquetera}`; historial de movimientos con filtro por fecha.

### 8. Rejilla
- **Controla:** `backend/src/modules/rejilla/` (`rejilla.route.js`, `rejilla.controller.js`, `rejilla.service.js`, `rejilla.entity.js`).
- **Recibe:** `qrToken`.
- **Transforma:** reconstruye la ocupación de cuadros 1..`total_almuerzos` reproduciendo en orden los movimientos `CONSUMO`/`REVERSA` (mapa cuadro→fecha). Si el token no existe en BD cae a datos mock en memoria de `rejilla.entity.js` (`ABC123`, `XYZ789`, `PEN001`).
- **Entrega:** `{qr_token, estado, cliente, saldo, rejilla:[{numero, estado:"consumido"|"disponible", fechaConsumo}]}`.

### 9. Frontend SPA
- **Controla:** `frontend/src/main.jsx` → `App.jsx` (`AuthProvider` + `DashboardContent`, sin librería de router: usa `window.history.pushState` y `popstate`).
- **Recibe:** URL, acciones del usuario, `localStorage`.
- **Transforma:** elige vista según ruta y rol:
  - Públicas: `ActivacionView.jsx`, `ClienteTiqueteraView.jsx` (usa `QrPassCard.jsx`, `HistorialMovimientos.jsx`, `QrScanner.jsx`).
  - Restaurante (pestañas vía `Navbar.jsx`): `TiqueterasView.jsx`, `ConsumoView.jsx` (usa `RejillaGrid.jsx`), `ClientesView.jsx`, `UsuariosView.jsx`.
  - `SUPER_ADMIN`: `SuperAdminView.jsx` (1775 líneas).
  - Soporte: `LoginView.jsx`, `Modal.jsx`, `Toast.jsx`, `context/AuthContext.jsx`, `services/api.js`, `utils/qr.js` (genera el QR con `qrcode`, URL `${origin}/tiquetera/<token>`, copia al portapapeles con respaldo `execCommand` para HTTP).
- **Entrega:** UI en Tailwind 4 + lucide-react; compilada con Vite 8 y React Compiler (`frontend/vite.config.js`; proxy `/api → http://localhost:3000` en dev, puerto 5173).

### 10. Pruebas
- **Controla:** `backend/tests/` (`api-http.test.js`, `historias-de-usuario-completas.test.js`, `tiquetera-consumo.test.js`, `tiquetera-filtrado.test.js`), ejecutadas con `node --test` (`npm test`).
- **Recibe:** la app Express en puerto efímero y las entities/services directos.
- **Transforma:** corre sobre SQLite `:memory:` (detección de test en `database.js`).
- **Entrega:** resultado de pruebas. No hay pruebas del frontend (solo `eslint`).

### 11. Despliegue / infraestructura
- **Controla:** `Dockerfile` (raíz, multi-stage Node 22-slim: dependencias + `prisma generate`, build del frontend, runner `node backend/app.js` con HEALTHCHECK a `/health`), `backend/Dockerfile` (Node 24-slim), `frontend/Dockerfile` (build Node 24-alpine → `nginx:alpine`), `frontend/nginx/nginx.conf` (sirve el SPA con `try_files` y hace proxy `/api/` a `http://backend:3000`), `docker-compose.yml`, `.github/workflows/deployment-main.yml`.
- **Recibe:** push a `main` o `workflow_dispatch`.
- **Transforma:** el workflow (`appleboy/ssh-action@v1.0.0`) entra por SSH, hace `git pull origin main`, `docker compose down` y `docker compose up --build -d`. Compose levanta `mongo:7.0` (replica set `rs0`, puerto host 29474), `backend` (29473→3000) y `frontend` (9081→80).
- **Entrega:** aplicación desplegada. Nota: compose declara el volumen `backend_data_dev:/app/data` para el backend; el archivo SQLite se crea en `backend/data/` (`/app/data` dentro del contenedor del `backend/Dockerfile`).

---

## 4. Almacenes (Bases de datos / Estado)

### 4.1 SQLite — almacén principal real
- Archivo: `backend/data/tiquetera.db` (o `DB_PATH`; `:memory:` en tests). Motor: módulo nativo `node:sqlite` (`DatabaseSync`), WAL activo. Esquema definido en `backend/src/config/database.js` (`initSchema`).
- Tablas:
  | Tabla | Contenido clave |
  |---|---|
  | `users` | `id, name, email (UNIQUE), passwordHash, password, role, restaurante_id, es_titular, precio_tiquetera, active, createdAt` |
  | `clientes` | `id, nombre, identificacion, telefono, restaurante_id, createdAt` |
  | `tiqueteras` | totales/consumidos/disponibles, `estado`, `codigo_activacion`, `fecha_expiracion_codigo`, `codigo_usado`, `qr_token`, `pin_hash`, `pin_actual`, `intentos_fallidos_pin`, `bloqueado_hasta`, fechas de activación/finalización/regeneración |
  | `movimientos` | `tipo (CONSUMO/REVERSA)`, `consumo_referencia_id`, `cantidad`, `usuario_id`, `motivo`, `saldo_anterior/posterior`, `cuadros_seleccionados` (JSON en TEXT) |
  | `pin_historial` | `tiquetera_id, restaurante_id, cliente_id, pin_anterior, pin_nuevo, origen (ACTIVACION/CLIENTE/SUPER_ADMIN), fecha_hora` |
- Datos semilla (`seedDefaultUsers`): `admin@tiquetera.com` (rol `SUPER_ADMIN`, `password` plano), `prueba@gmail.com` y `cocina@tiquetera.com` (restaurante `REST-1`).
- Los IDs son texto generado en código (`TIQ-<ts>-<rand>`, `MOV-…`, `REST-…`).

### 4.2 Prisma + MongoDB — presente pero sin uso en el flujo de negocio
- `backend/prisma/schema.prisma` define `User, Cliente, Tiquetera, Movimiento` (colecciones `users, clientes, tiqueteras, movimientos`) y **no** incluye `pin_historial`, `restaurante_id`, `es_titular`, `precio_tiquetera` ni `pin_actual`: está desalineado con el esquema SQLite.
- Solo `connectPrisma()`/`seedPrismaDefaults()` lo tocan (conexión y siembra de 2 usuarios demo); ningún service/entity lee o escribe vía Prisma.

### 4.3 Estado en memoria y en el cliente
- `seedUsers` en `login.entity.js` y `tiqueteras` mock en `rejilla.entity.js`: datos fijos en memoria usados como respaldo.
- Navegador: `localStorage['tiquetera_auth_user']` (objeto de usuario completo) y estado React (`useState`) en `App.jsx` y vistas.
- Docker: volúmenes `mongo_data_dev` y `backend_data_dev`.

---

## 5. Producto terminado (Salidas)

- **Respuestas JSON de la API:** objetos de tiquetera/cliente/usuario/movimiento, mensajes de éxito (`{mensaje, …}`) y errores `{error}` con códigos 200/201/400/401/403/404. `login` devuelve el usuario sin token.
- **Datos de negocio derivados:** saldo `{total, consumidos, disponibles}`, rejilla de cuadros, historial de movimientos (también agrupado por día en la vista pública), resumen de restaurante (`resumen_tiqueteras`, `valor_estimado_*`), historial de PINes para el superadmin.
- **QR y enlaces:** PNG/canvas del QR (`qrcode`) con URL `/tiquetera/<qr_token>`; enlaces de activación `/activar?codigo=<código>` (`frontend/src/utils/qr.js`).
- **Aplicación web servida:** el SPA compilado (`frontend/dist`), servido por Express (`backend/app.js`) o por Nginx (`frontend/nginx/nginx.conf`) con proxy `/api/` al backend.
- **Salida de infraestructura:** `GET /health` → `{status:"ok"}` (usado por el HEALTHCHECK del `Dockerfile` raíz); logs de consola; despliegue automatizado en el servidor tras push a `main`.
- **Salidas hacia otros servicios:** no hay integraciones externas (sin correo, SMS, pasarelas de pago ni APIs de terceros); solo Google Fonts desde `frontend/index.html`.

---

## Anexo: hallazgos observados al documentar
1. Persistencia dual: SQLite es la real; Prisma/Mongo está desalineado y sin uso funcional (aun así `docker-compose` levanta Mongo y los Dockerfile generan el cliente Prisma).
2. No hay autenticación en la API: ningún middleware valida usuario ni rol; `?admin=true` en `DELETE /api/tiqueteras/:id` y las rutas `admin-pin`, `estado`, `admin/pines` son accesibles sin credenciales; el control de rol vive solo en `frontend/src/App.jsx`.
3. Credenciales: contraseñas semilla en texto plano en `password`, y `tiqueteras.pin_actual` / `pin_historial.pin_anterior|pin_nuevo` guardan PINes en claro además de `pin_hash` (SHA-256 sin sal).
4. Las rutas de `/api/users/restaurantes` (listar, crear, editar y borrar en cascada) también están abiertas. El rol de superusuario se escribe `SUPER_ADMIN` (con guion bajo) en el código.
5. La reversa compara días en UTC (`toISOString().slice(0,10)`), por lo que "mismo día" puede no coincidir con el día local.
