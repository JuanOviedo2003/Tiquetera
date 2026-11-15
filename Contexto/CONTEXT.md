# CONTEXT — Tiquetera Web

## Qué es
Sistema web para restaurantes que venden almuerzos por **tiquetera** (paquete prepago de N almuerzos). Sin app móvil: todo desde el navegador.

## Flujo de negocio
1. **Restaurante** registra un cliente y crea una tiquetera (N almuerzos) → estado `PENDIENTE` + código de activación de 6 dígitos (un solo uso, expira en 48 h, reemitible).
2. **Cliente** (página pública, sin cuenta) ingresa el código → tiquetera `ACTIVA`, se genera **QR único** y crea un **PIN de 6 dígitos**. Puede regenerar el PIN (exige el PIN anterior).
3. Para consumir: el restaurante abre la tiquetera por QR (o cámara), valida el PIN del cliente y descuenta almuerzos marcando cuadros en una **rejilla visual**. Hay bloqueo por intentos fallidos de PIN.
4. Correcciones de consumo del mismo día (reversa por cuadro) e **historial de movimientos** con saldo anterior/posterior.
5. El cliente consulta saldo e historial desde la URL de su QR.

## Roles
- `RESTAURANTE`: panel de gestión (clientes, tiqueteras, consumo, usuarios).
- `SUPER_ADMIN`: gestiona restaurantes y administra PINes/estados de tiqueteras (añadido en sprint 3).
- Cliente: sin cuenta, acceso público por QR + PIN.

## Stack
| Capa | Tecnología |
|---|---|
| Monorepo | npm workspaces (`frontend`, `backend`), `concurrently` |
| Backend | Node.js (ESM), Express 5, bcrypt, cors |
| Datos | **SQLite** nativo (`node:sqlite`) en `backend/src/config/database.js`; **Prisma + MongoDB** también presente (`prisma/schema.prisma`, `config/prisma.js`) — ver ESTADO.md |
| Frontend | React 19, Vite 8, Tailwind 4, lucide-react, `qrcode`, `jsqr`, React Compiler |
| Tests | `node --test` (backend/tests) |
| Infra | Docker Compose (mongo 7 replica set, backend, frontend/nginx), GitHub Actions → deploy por SSH al hacer push a `main` |

## Estructura
```
backend/
  app.js                       # Express, rutas /api/*, sirve frontend/dist
  prisma/schema.prisma         # User, Cliente, Tiquetera, Movimiento
  src/config/                  # database.js (SQLite), prisma.js
  src/modules/<mod>/           # controller / service / entity / route
     cliente, consumo, login, rejilla, tiquetera, user
  tests/                       # 4 archivos de tests
frontend/src/
  App.jsx                      # navegación por estado/vistas
  views/                       # Login, Tiqueteras, Clientes, Consumo, Usuarios, SuperAdmin, Activacion, ClienteTiquetera
  components/                  # Modal, Navbar, QrPassCard, QrScanner, RejillaGrid, HistorialMovimientos, Toast
  context/AuthContext.jsx, services/api.js, utils/qr.js
Documentación/                 # requisitos.md, historias-de-usuario.md, sprints.md
Contexto/                      # este directorio
```

## API (prefijo `/api`)
- `login` POST `/`
- `users` GET/POST `/`, CRUD `/restaurantes`
- `clientes` GET/POST `/`, GET `/:id`, `/search/:id`
- `tiqueteras` POST/GET `/`, POST `/activar`, `/validar-pin`, `/regenerar-pin`, `/:id/reemitir-codigo`, GET `/public/qr/:qrToken`, `/qr/:qrToken`, `/:id/codigo-activacion`, `/admin/pines`, PUT `/:id/admin-pin`, `/:id/estado`, DELETE `/:id`
- `consumos` POST `/`, POST `/reversa`, GET `/tiquetera/:id`
- `rejilla` GET `/:qrToken`
- `GET /health`

## Modelo de datos (resumen)
`User(role, active)`, `Cliente(restaurante_id)`, `Tiquetera(total/consumidos/disponibles, estado, codigo_activacion, qr_token, pin_hash, intentos_fallidos_pin, bloqueado_hasta, fechas)`, `Movimiento(tipo CONSUMO/REVERSA, cantidad, saldo_anterior/posterior, cuadros_seleccionados)`.

## Comandos
```
npm run dev            # backend + frontend
npm run build          # build frontend
npm test               # tests backend
npm run prisma:generate / prisma:push
docker compose up --build -d
```
Puertos Docker: backend 29473, mongo 29474, frontend 9081.

## Equipo
Juan José Oviedo Díaz, Carlos Felipe Rivera Gueche, Kenny Andrés Martínez Narváez, Leidy Catalina Bonilla Orozco (todos fullstack). Ramas: `main`, `develop`, `develop-<nombre>`.

## Documentación fuente
`Documentación/requisitos.md` (RF/modelo), `historias-de-usuario.md` (17 HU: R1–R12 restaurante, C1–C5 cliente), `sprints.md` (3 sprints + buffer; 63 pts).
