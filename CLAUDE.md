# CLAUDE.md — Tiquetera

Contexto del proyecto: `Contexto/CONTEXT.md`. Estado actual: `Contexto/ESTADO.md`. Léelos al iniciar. Requisitos en `Documentación/`.

## Reglas de trabajo
- Idioma: español (código, commits y docs del proyecto; commits estilo `feat:`/`fix:`/`chore:`).
- Ramas: trabajar en `develop-juan`; PRs hacia `develop`/`main`. `main` despliega a producción por SSH: no pushear ahí sin confirmar.
- **Antes de proponer cambios de diseño, arquitectura o correcciones grandes, usar `/grill-me`** y consultar al usuario. El usuario está abierto a opiniones y correcciones, siempre pasando por grill-me.
- Actualizar `Contexto/ESTADO.md` cuando cambie el estado del proyecto.

## Skills instaladas (`~/.claude/skills`)
| Skill | Uso |
|---|---|
| **grill-me** (→ `grilling`) | **Obligatoria.** Entrevista implacable para afinar planes y decisiones. |
| find-skills | Buscar/instalar skills de fuentes confiables. |
| handoff | Resumir la conversación para otro agente (guarda en el directorio temporal). |
| caveman / cavecrew | Respuestas terse; delegar búsquedas, ediciones pequeñas y revisión de diffs. |
| ccc | Búsqueda semántica en el código e indexado. |
| code-simplifier | Simplificación idiomática (orientada a Rust/RTK). |
| frontend-design | Diseño visual distintivo para UI. |

Otras skills disponibles en Claude Code: `init`, `simplify`, `code-review`, `security-review`, `feature-dev`, `run`, `loop`, `schedule`, `update-config`, `claude-api`, `dataviz` y las `anthropic-skills:*` (docx, pdf, pptx, xlsx, docs, deep-research, skill-creator…).

## Pendiente
- Usar `find-skills` para encontrar una skill confiable de generación de documentación y evaluarla con grill-me antes de instalarla.
