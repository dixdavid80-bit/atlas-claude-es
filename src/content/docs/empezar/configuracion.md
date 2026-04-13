---
title: Configura tu proyecto con CLAUDE.md
description: Qué es CLAUDE.md, cómo crearlo, qué poner dentro y qué no.
sidebar:
  order: 3
---

## El problema que resuelve

Sin CLAUDE.md, cada sesión de Claude Code empieza desde cero. Claude tiene que descubrir tu proyecto leyendo código, adivinando convenciones, y preguntándote cosas que ya le dijiste ayer. Con CLAUDE.md, Claude arranca cada sesión sabiendo:

- Qué comandos usar para build, test y deploy
- Cómo está organizado tu proyecto
- Qué convenciones sigues que no son las del lenguaje por defecto
- Qué errores no debe cometer (gotchas)

Es la diferencia entre un colaborador nuevo que no sabe nada y uno que ya leyó la documentación del proyecto.

## Crear tu primer CLAUDE.md

La forma más rápida:

```bash
claude
# Dentro de la sesión:
/init
```

Claude analiza tu proyecto y genera un CLAUDE.md starter. Revísalo, edítalo, y commitéalo al repo.

Si prefieres hacerlo a mano, crea un archivo `CLAUDE.md` en la raíz del proyecto.

## Qué poner dentro — estructura recomendada por Anthropic

```markdown
# Commands
- `npm run build` — compilar el proyecto
- `npm test` — ejecutar tests
- `npm run lint` — lintear código

# What This Is
API REST para gestión de inventario. Node.js + Express + PostgreSQL.

# Architecture
src/
├── routes/       → endpoints de la API
├── services/     → lógica de negocio
├── models/       → schemas de Prisma
└── middleware/    → auth, validation, error handling

# Things That Will Bite You
- Los tests requieren PostgreSQL local corriendo en puerto 5433 (no el default)
- El campo `deletedAt` es soft delete — nunca usar DELETE real
- Las migraciones de Prisma requieren `npx prisma migrate dev`, no `push`

# Code Conventions
- Nombres de variables en camelCase (no snake_case)
- Cada endpoint devuelve `{ data, error, meta }` — nunca texto plano
```

## Regla de oro: 60-100 líneas

Anthropic lo dice claro: *"important rules get lost in the noise"*. Si tu CLAUDE.md tiene 200 líneas, Claude ignora la mitad.

**Test para cada línea:** *"¿Si quito esto, Claude comete errores?"*. Si la respuesta es no, borra esa línea.

## Qué NO poner

| No pongas esto | Por qué |
|---|---|
| Lo que Claude descubre solo leyendo el código | Ruido — ya lo sabe |
| Convenciones estándar del lenguaje | Claude las conoce |
| Documentación completa de APIs | Mejor linkear y que Claude la lea cuando necesite |
| Info que cambia frecuentemente | Se desactualiza y confunde |
| Instrucciones de personalidad ("sé un senior engineer") | No funcionan como crees |
| Descripción archivo por archivo | Claude tiene Grep y Glob para eso |

## La jerarquía completa de memoria

Claude Code lee memorias de 6 sitios, en este orden de prioridad:

| Nivel | Archivo | Para qué |
|---|---|---|
| 1. Política org | `/Library/Application Support/ClaudeCode/CLAUDE.md` | Reglas de empresa (IT lo gestiona) |
| 2. Proyecto | `./CLAUDE.md` | Instrucciones compartidas del equipo (va a git) |
| 3. Reglas modulares | `.claude/rules/*.md` | Reglas por tema con scope por path |
| 4. Usuario global | `~/.claude/CLAUDE.md` | Tus preferencias en todos los proyectos |
| 5. Local por proyecto | `./CLAUDE.local.md` | Tus preferencias solo en este proyecto (no va a git) |
| 6. Auto memoria | `~/.claude/projects/<proyecto>/memory/` | Lo que Claude aprende solo trabajando contigo |

Las más específicas ganan sobre las generales. En la práctica, el 90% de tu trabajo es con el nivel 2 (CLAUDE.md de proyecto).

## Reglas modulares con .claude/rules/

Cuando tu CLAUDE.md crece demasiado, mueve reglas a archivos separados:

```
.claude/
└── rules/
    ├── code-style.md      → convenciones de código
    ├── testing.md          → cómo escribir y ejecutar tests
    └── api-conventions.md  → formato de endpoints
```

Se cargan automáticamente con la misma prioridad que CLAUDE.md. Puedes acotar reglas a ciertos archivos con frontmatter:

```markdown
---
paths:
  - "src/api/**/*.ts"
---
# Reglas de API
- Todos los endpoints incluyen validación de input
- Usar el formato de respuesta estándar { data, error, meta }
```

Esta regla solo aplica cuando Claude trabaja con archivos TypeScript dentro de `src/api/`.

## Auto memoria — lo que Claude aprende solo

Claude graba automáticamente patrones, preferencias y decisiones mientras trabajas. Lo guarda en `~/.claude/projects/<proyecto>/memory/MEMORY.md`.

- Las primeras 200 líneas se inyectan al inicio de cada sesión
- Puedes pedirle que guarde algo: *"recuerda que siempre usamos pnpm"*
- `/memory` te muestra qué tiene guardado
- `/dream` consolida y limpia la memoria acumulada

No necesitas gestionar esto manualmente salvo que quieras forzar algo. Claude aprende conforme trabajas.

## Ejemplo de CLAUDE.md para proyecto de contenido (no código)

CLAUDE.md no es solo para repos de código. Si tu proyecto genera documentos, formación o contenido:

```markdown
# Commands
- `/workshop-case-generator` — generar caso de taller
- `/validate` — validar formato del caso generado

# What This Is
Generador de casos de taller para formación B2B en automatización.

# Things That Will Bite You
- Los importes siempre en EUR formato español (1.234,56 EUR)
- Fechas en DD/MM/YYYY
- El Case 1 es referencia gold — NO MODIFICAR

# Conventions
- Estándares internacionales ISA/NIIF española
- Nombres de empresa ficticios pero realistas
```

## Siguiente paso

Ya tienes Claude Code instalado y tu proyecto configurado. El siguiente nivel es **automatizar**: hooks que se ejecutan siempre, sin que Claude pueda saltárselos.

[Hooks: automatización que no falla →](/automatizar/hooks/)
