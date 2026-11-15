# ESTADO — Tiquetera Web

_Actualizado: 2026-11-15 · rama de trabajo: `develop-juan` (árbol limpio) · 51 commits_

## Planificación vs. avance
| Sprint | Fechas | Alcance | Estado |
|---|---|---|---|
| 1 Fundamentos restaurante | 21/09–11/10 | HU-R1, R2, R3, R11, R12 | Implementado |
| 2 Flujo de consumo | 12/10–01/11 | HU-R4 a R10 | Implementado (merge PR #1, 26/10) |
| 3 Lado cliente + cierre | 02/11–22/11 | HU-C1 a C5 | Implementado (commit 25db8a7, 06/11); QA/integración pendiente |
| Buffer entrega | 23/11–28/11 | — | Pendiente |

## Extras ya hechos (fuera del plan base)
- Rol SUPER_ADMIN y gestión completa de restaurantes (crear/editar/eliminar).
- Validación del PIN anterior al cambiar PIN + trazabilidad de PINes (`/admin/pines`).
- Escaneo de QR con cámara (jsQR), compatible con HTTP sin HTTPS; copiar al portapapeles sobre HTTP.
- Despliegue automático a servidor vía GitHub Actions + Docker Compose.

## Últimos commits
- 08/11: simplificar init de video en QrScanner · captura nativa de cámara en HTTP · QR por cámara en consulta de saldo
- 06/11: PIN anterior + superadmin restaurantes · fixes de portapapeles · puertos docker

## Riesgos / deuda técnica detectada (a validar con el equipo)
1. **Doble capa de persistencia**: las entities usan SQLite (`node:sqlite`, `db.prepare`), pero `schema.prisma`, `docker-compose` (Mongo) y `.env.example` apuntan a Prisma+MongoDB. Prisma parece solo conectarse y sembrar defaults. Falta decidir la fuente de verdad.
2. **Sin autenticación real en la API**: no se encontró JWT/sesión/middleware (búsqueda de jwt/authorization/bearer sin resultados); RF-03 exige rechazar peticiones no autenticadas.
3. Soporte legado de `password` en texto plano junto a `passwordHash` (login.service.js).
4. Endpoints admin (`/admin-pin`, `/estado`, `/admin/pines`, DELETE) sin control de rol visible en backend.
5. Tests: 4 archivos de backend; sin tests de frontend.
6. `Documentación/sprints.md` deja fuera multi-restaurante (HU-S1–S4), pero SUPER_ADMIN ya está implementado: documentación desactualizada.

## Próximos pasos sugeridos
- QA e integración de sprints 1–3.
- Resolver riesgos 1 y 2 antes de la entrega (28/11).
- Actualizar `Documentación/` con SUPER_ADMIN y cambio de PIN.
- Generar documentación técnica con una skill confiable (ver CLAUDE.md).
