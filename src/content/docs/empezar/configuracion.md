---
title: Configura tu proyecto con CLAUDE.md
description: "CLAUDE.md, jerarquía de memoria, reglas modulares, auto memory, AutoDream, imports — todo lo que necesitas para que Claude entienda tu proyecto."
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

### Secciones y su peso

| Sección | Importancia | Qué incluir |
|---|---|---|
| **Commands** | ALTA | Build, test, lint, deploy — comandos bash exactos |
| **What This Is** | ALTA | 1-2 líneas describiendo el proyecto |
| **Architecture** | ALTA | Tree de directorios + archivos clave anotados |
| **Things That Will Bite You** | MEDIA | Gotchas específicos y no obvios |
| **Code Style** | MEDIA | SOLO lo que difiere del default del lenguaje |
| **Workflow** | MEDIA | Branch naming, PR conventions, commit format |
| **Verification** | ALTA | Checklist post-cambio: typecheck → test → lint |

## Regla de oro: 60-100 líneas

Anthropic lo dice claro: *"important rules get lost in the noise"*. Si tu CLAUDE.md tiene 200 líneas, Claude ignora la mitad. El system prompt de Claude Code ya tiene ~50 instrucciones internas — tu presupuesto real es 60-100 líneas adicionales.

**Test para cada línea:** *"¿Si quito esto, Claude comete errores?"*. Si la respuesta es no, borra esa línea.

## Qué NO poner

| No pongas esto | Por qué |
|---|---|
| Lo que Claude descubre leyendo el código | Ruido — ya lo sabe |
| Convenciones estándar del lenguaje | Claude las conoce |
| Documentación completa de APIs | Linkear, no copiar. Que Claude la lea cuando necesite |
| Info que cambia frecuentemente | Se desactualiza y confunde |
| Instrucciones de personalidad ("sé un senior engineer") | No funcionan como crees |
| Descripción archivo por archivo | Claude tiene Grep y Glob para eso |
| Lo que un linter o hook maneja mejor | Usa [hooks](/automatizar/hooks/) para enforcement real |
| Secciones vacías o con placeholders | Si no tiene contenido, bórrala |

### Anti-patrones oficiales de Anthropic

- **"The over-specified CLAUDE.md"** — demasiado largo, Claude ignora la mitad. Fix: podar sin piedad
- **Duplicar el README.md** — si ya tienes un README, no copies su contenido; referéncialo
- **Meter archivos enteros vía @imports** — mejor referenciar cuándo leerlos, no cargarlos siempre
- **Usar CLAUDE.md para reglas que un linter/hook maneja mejor** — hooks son enforcement real, CLAUDE.md es orientativo

## La jerarquía completa de memoria — 6 niveles

Claude Code lee memorias de 6 sitios, en este orden de prioridad (las más específicas ganan):

| Nivel | Archivo | Compartido | Para qué |
|---|---|---|---|
| 1. Política org | `/Library/Application Support/ClaudeCode/CLAUDE.md` (macOS) | IT gestiona | Reglas de empresa obligatorias |
| 2. Proyecto | `./CLAUDE.md` o `./.claude/CLAUDE.md` | Sí (git) | Instrucciones compartidas del equipo |
| 3. Reglas modulares | `./.claude/rules/*.md` | Sí (git) | Reglas por tema con scope por path |
| 4. Usuario global | `~/.claude/CLAUDE.md` | No | Tus preferencias en todos los proyectos |
| 5. Local por proyecto | `./CLAUDE.local.md` | No (gitignored) | Preferencias personales solo en este proyecto |
| 6. Auto memoria | `~/.claude/projects/<proyecto>/memory/` | No | Lo que Claude aprende solo trabajando contigo |

En la práctica, el 90% de tu trabajo es con el nivel 2 (CLAUDE.md de proyecto). Los demás niveles aparecen cuando tienes equipos (nivel 1, 3), preferencias globales (nivel 4), o llevas tiempo usando Claude en un proyecto (nivel 6).

:::tip[Para monorepos]
Los CLAUDE.md de directorios padre se cargan completos al inicio. Los de subdirectorios se cargan on-demand cuando Claude trabaja en ellos. Esto permite configuración por paquete en monorepos sin inflar cada sesión.
:::

## Imports — referenciar archivos desde CLAUDE.md

CLAUDE.md soporta importar archivos adicionales con `@path/to/import`:

```markdown
See @README for project overview and @package.json for available commands.
# Additional Instructions
- git workflow @docs/git-instructions.md
```

**Reglas:**
- Paths relativos se resuelven relativo al archivo que contiene el import
- Los imports dentro de code blocks se ignoran (evita colisiones con `@anthropic-ai/claude-code`)
- Recursivo hasta **5 niveles de profundidad**
- Primera vez que Claude Code encuentra imports externos, muestra diálogo de aprobación

**Para compartir instrucciones entre worktrees:**
```markdown
# En CLAUDE.local.md de cualquier worktree
- @~/.claude/my-project-instructions.md
```

## Lookup recursivo

Claude Code busca memorias **recursivamente desde el directorio actual hacia arriba** hasta la raíz. Lee cualquier CLAUDE.md o CLAUDE.local.md que encuentre en el camino. Útil para monorepos: si trabajas en `packages/api/`, carga tanto `CLAUDE.md` de la raíz como `packages/api/CLAUDE.md`.

**Flag `--add-dir` para directorios adicionales:**
```bash
# Acceso a directorios fuera del working directory
CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1 claude --add-dir ../shared-config
```

## Reglas modulares con .claude/rules/

Cuando tu CLAUDE.md crece demasiado, mueve reglas a archivos separados:

```
.claude/
└── rules/
    ├── code-style.md
    ├── testing.md
    ├── api-conventions.md
    └── frontend/
        ├── react.md
        └── styles.md
```

Se cargan automáticamente. Los `.md` se descubren recursivamente en subdirectorios.

### Scope por path con frontmatter

```markdown
---
paths:
  - "src/api/**/*.ts"
---
# Reglas de API
- Todos los endpoints incluyen validación de input
- Usar el formato de respuesta estándar { data, error, meta }
```

Esta regla **solo aplica** cuando Claude trabaja con archivos TypeScript dentro de `src/api/`. El resto del tiempo no se carga.

**Patrones glob soportados:** `**/*.ts`, `src/**/*`, `*.md`, `src/components/*.tsx`. Soporta brace expansion: `src/**/*.{ts,tsx}`.

### Symlinks para compartir reglas entre proyectos

```bash
ln -s ~/shared-claude-rules .claude/rules/shared       # directorio completo
ln -s ~/company-standards/security.md .claude/rules/security.md  # archivo individual
```

### User-level rules

Reglas personales en `~/.claude/rules/` que aplican en todos tus proyectos (se cargan antes que las de proyecto, con menor prioridad):

```
~/.claude/rules/
├── preferences.md    # Preferencias de código
└── workflows.md      # Workflows preferidos
```

## Auto memoria — lo que Claude aprende solo

Claude graba automáticamente patrones, preferencias y decisiones mientras trabajas. Lo guarda en `~/.claude/projects/<proyecto>/memory/`:

```
~/.claude/projects/<proyecto>/memory/
├── MEMORY.md          # Índice conciso — se carga al inicio (primeras 200 líneas)
├── debugging.md       # Notas de debugging (on-demand)
├── api-conventions.md # Decisiones de API (on-demand)
└── ...                # Otros archivos temáticos
```

**Cómo funciona:**
- Las primeras **200 líneas / 25KB** de MEMORY.md se inyectan al inicio de cada sesión
- Los archivos temáticos NO se cargan al inicio — Claude los lee cuando necesita la info
- Un **agente background** se activa automáticamente cuando Claude completa un turno sin tool calls — extrae y guarda los aprendizajes relevantes
- Puedes pedir que guarde algo: *"recuerda que usamos pnpm"*

### Taxonomía interna de lo que guarda

Claude clasifica las memorias en 4 tipos:

| Tipo | Qué guarda | Cuándo |
|---|---|---|
| **user** | Rol, preferencias, nivel técnico | Al detectar info sobre ti |
| **feedback** | Correcciones y approaches validados | Al recibir corrección o confirmar approach |
| **project** | Trabajo en curso, deadlines, decisiones | Al conocer estados del proyecto |
| **reference** | Punteros a sistemas externos | Al aprender de herramientas externas |

**Lo que NO guarda:** patrones de código (derivables del código), historial git (usar `git log`), soluciones de debugging (el fix está en el código), convenciones ya en CLAUDE.md, estado efímero de la conversación.

### Control

```bash
# Ver qué tiene guardado + toggle on/off
/memory

# Ejecutar consolidación manual (AutoDream)
/dream
```

```json
// Desactivar en settings.json:
{ "autoMemoryEnabled": false }

// Override vía env var (útil para CI):
CLAUDE_CODE_DISABLE_AUTO_MEMORY=1
```

## AutoDream — consolidación automática de memoria

Sub-agente que se ejecuta periódicamente en background para **consolidar, podar y reorganizar** los archivos de memoria. Sin él, las memorias se inflan con el tiempo y la calidad del contexto se degrada.

**Qué hace:**
1. Revisa sesiones recientes del proyecto
2. Lee archivos de memoria actuales
3. Fusiona duplicados, elimina obsoleto, reorganiza por relevancia
4. Escribe archivos actualizados y limpios

**Cuándo aporta valor real:**

| Tipo de proyecto | Valor AutoDream |
|---|---|
| Muchas sesiones cortas | **Alto** — acumula fragmentos que necesitan consolidarse |
| Pipeline iterativo (generar clase tras clase) | **Alto** — feedbacks crecen con cada iteración |
| Sesiones esporádicas | **Bajo** — poca acumulación |
| Proyecto recién creado | **No urgente** — poco que consolidar |

Activar: `/memory` → AutoDream → Enter para toggle on/off. Ejecutar manualmente: `/dream` (tarda 8-10 min típico).

Solo toca archivos de memoria — **nunca modifica código**, scripts ni archivos del proyecto.

## Ejemplo: CLAUDE.md para proyecto de contenido

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

**Diferencia clave:** en proyectos de contenido, las secciones críticas cambian — convenciones de formato, filosofía de documentos y protección de assets de referencia importan más que test runners o linters. Adapta la estructura, no copies ciegamente el patrón de código.

## Herramientas de mantenimiento

| Herramienta | Qué hace |
|---|---|
| `/init` | Genera CLAUDE.md starter analizando tu proyecto |
| `#` durante sesión | Añade memorias rápidas al CLAUDE.md |
| `/memory` | Muestra archivos de memoria cargados + toggle |
| `/dream` | Consolida y limpia la memoria acumulada |
| `/revise-claude-md` | Captura learnings de la sesión actual |

## Evaluación rápida de tu CLAUDE.md

Checklist de calidad basado en los criterios oficiales de Anthropic:

| Criterio | Peso | Pregunta |
|---|---|---|
| Commands documentados | ALTO | ¿Están los comandos de build/test/deploy? |
| Claridad arquitectónica | ALTO | ¿Claude entiende la estructura del codebase? |
| Patrones no obvios | MEDIO | ¿Están documentados los gotchas y quirks? |
| Concisión | MEDIO | ¿Menos de 100 líneas? ¿Sin explicaciones verbosas? |
| Estado actual | ALTO | ¿Refleja el estado real del proyecto, no una versión antigua? |
| Accionabilidad | ALTO | ¿Instrucciones ejecutables, no vagas? |

Si tu CLAUDE.md pasa los 6 criterios, está bien. Si falla en alguno de peso ALTO, arréglalo primero.

## Siguiente paso

Ya tienes Claude Code instalado y tu proyecto configurado con CLAUDE.md, memoria y reglas modulares. El siguiente nivel es **automatizar**: hooks que se ejecutan siempre, sin que Claude pueda saltárselos.

[Hooks: automatización que no falla →](/automatizar/hooks/)
