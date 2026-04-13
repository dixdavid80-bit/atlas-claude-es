---
title: "Skills: workflows reutilizables"
description: Crear, validar y compartir skills — workflows encapsulados que Claude invoca cuando los necesita.
sidebar:
  order: 2
---

Una skill es un conjunto de instrucciones + scripts + templates que Claude Code carga bajo demanda. A diferencia de CLAUDE.md (que se lee siempre), las skills se activan cuando el usuario las invoca con `/nombre` o cuando Claude detecta que aplican a la tarea actual.

Piensa en una skill como una **receta encapsulada**: incluye las instrucciones, los scripts helper, los templates de output, y los errores conocidos documentados.

## Cuándo crear una skill

**Crea una skill cuando:**
- Haces algo más de 3 veces con el mismo patrón
- Quieres que cualquier persona del equipo pueda ejecutar un workflow sin explicarlo de cero
- Necesitas combinar instrucciones + scripts + templates en un solo paquete

**No crees una skill cuando:**
- Una instrucción directa en el chat resuelve el problema
- El workflow cambia cada vez y no tiene patrón estable
- El CLAUDE.md ya cubre la necesidad

## Las 9 categorías oficiales de Anthropic

Anthropic catalogó las skills en uso interno (cientos en producción) y descubrió que las mejores encajan limpiamente en una sola categoría. Las que mezclan varias resultan confusas.

| Categoría | Qué hace | Ejemplo |
|---|---|---|
| **Library & API Reference** | Documentación de librerías con gotchas y snippets | billing-lib, frontend-design |
| **Product Verification** | Testing y verificación de output | Assertions con Playwright, tests visuales |
| **Data Fetching & Analysis** | Conexión a datos y monitoreo | funnel-query, grafana |
| **Business Process** | Automatizar workflows repetitivos | standup-post, weekly-recap |
| **Code Scaffolding** | Generar boilerplate específico del codebase | new-workflow, new-migration |
| **Code Quality & Review** | Reforzar calidad de código | adversarial-review, code-style |
| **CI/CD & Deployment** | Gestión de PRs, deploys, rollbacks | babysit-pr, deploy-service |
| **Runbooks** | De síntoma a reporte estructurado | service-debugging, oncall-runner |
| **Infrastructure Ops** | Mantenimiento con guardrails para acciones destructivas | resource-orphans, cost-investigation |

## Estructura de una skill

Cada skill vive en su propia carpeta dentro de `.claude/skills/`:

```
.claude/skills/
└── mi-skill/
    ├── SKILL.md              ← Archivo principal (obligatorio)
    ├── scripts/
    │   └── generate.py       ← Scripts helper
    ├── assets/
    │   └── template.md       ← Templates de output
    └── references/
        ├── api.md            ← Documentación de referencia
        └── gotchas.md        ← Errores conocidos
```

Claude descubre y lee estos archivos bajo demanda — no los carga todos al inicio.

## El archivo SKILL.md

Es el corazón de la skill. Tiene dos partes: **frontmatter YAML** (metadata) y **body** (instrucciones).

### Frontmatter mínimo

```yaml
---
name: mi-skill
description: >
  Genera informes mensuales en PDF. Use when user asks to
  create monthly report or generate PDF report.
metadata:
  author: Tu Nombre
  version: 1.0.0
  category: business-process
---
```

**Reglas del frontmatter:**
- `name` en kebab-case (`mi-skill`, no `Mi Skill`)
- No usar "claude" ni "anthropic" en el nombre (reservados)
- `description` máximo 1024 caracteres — **incluye frases de activación** (*"Use when user asks to..."*). Claude lee esto para decidir si carga la skill, así que escríbelo para el modelo, no para humanos

### Campos avanzados del frontmatter

| Campo | Tipo | Qué hace |
|---|---|---|
| `allowed-tools` | lista | Whitelist de tools que puede usar (`Bash(npm:*)`, `Read`) |
| `model` | sonnet/opus/haiku | Sobreescribe el modelo para esta skill |
| `effort` | low/medium/high/max | Sobreescribe nivel de razonamiento |
| `context` | inline/fork | `inline` expande en la conversación actual; `fork` ejecuta en sub-agente aislado |
| `user-invocable` | boolean | Si el usuario puede invocarla con `/nombre` |
| `paths` | lista de globs | Solo se activa al tocar archivos que coincidan |
| `hooks` | objeto | Hooks de ciclo de vida con scope de sesión |
| `skills` | string | Skills a precargar cuando esta se ejecute |

### Secciones del body

```markdown
## Overview
Qué produce esta skill y a qué estándar de calidad.

## Filesystem
Mapa de lo que hay en la carpeta. Claude lee bajo demanda.

## Instructions
Pasos flexibles. Dar información, no instrucciones rígidas.

## Gotchas
Errores conocidos. Empezar con los que conoces, crecer con el tiempo.

## Examples
Escenarios: prompt del usuario, acciones de Claude, output esperado.

## Troubleshooting
Error → causa → solución.
```

## Crear tu primera skill (sin herramientas)

No necesitas ningún script especial para crear una skill. Solo un archivo SKILL.md en la carpeta correcta:

**Paso 1** — Crea la carpeta:
```bash
mkdir -p .claude/skills/email-profesional
```

**Paso 2** — Crea el SKILL.md:
```markdown
---
name: email-profesional
description: >
  Redacta emails profesionales en español con tono formal pero cercano.
  Use when user asks to write an email, draft a message, or compose a reply.
metadata:
  author: Tu Nombre
  version: 1.0.0
  category: business-process
---

## Overview
Genera emails profesionales en español B2B. Tono formal pero accesible.
Siempre incluye asunto, saludo, cuerpo estructurado y cierre.

## Instructions
1. Identifica el destinatario y el objetivo del email
2. Usa el tono adecuado al contexto (cliente nuevo vs. colega vs. proveedor)
3. Estructura: asunto claro → contexto en 1 frase → petición/info → cierre con acción

## Gotchas
- No uses "Estimado/a" si el contexto es informal entre colegas
- En español B2B, "un saludo" es más natural que "atentamente" para emails cortos
- Si el email tiene adjuntos, menciona siempre qué son y por qué se adjuntan

## Examples
**Prompt:** "escribe un email al cliente pidiendo feedback del taller"
**Output:** asunto + cuerpo de 4-5 líneas + cierre con llamada a la acción
```

**Paso 3** — Úsala:
```
/email-profesional redacta un email al equipo de marketing confirmando la fecha del taller
```

Claude lee el SKILL.md, sigue las instrucciones, y genera el email con el tono y formato que definiste.

## Best practices oficiales de Anthropic

### Lo más importante

**La skill es una carpeta, no solo un markdown.** Claude descubre, explora y usa todo lo que hay dentro: scripts, assets, templates, datos.

**No digas lo obvio.** Claude ya sabe mucho de código y del codebase. Enfócate en lo que lo saque de su forma habitual de pensar. El frontend-design skill de Anthropic se construyó iterando para mejorar el "gusto" de diseño y evitar patrones genéricos.

**Construye una sección de Gotchas.** Es el contenido con más señal de cualquier skill. Se alimenta de los errores reales de Claude al usarla. Actualízala con el tiempo.

### Progressive disclosure via filesystem

No metas toda la info en SKILL.md. Dile a Claude qué archivos tiene disponibles y los leerá cuando los necesite:

```markdown
## Filesystem
- `references/api.md` — firmas de funciones y detalles de la API
- `assets/template.md` — plantilla del output esperado
- `scripts/validate.sh` — script de validación post-generación
```

Claude lee cada archivo solo cuando lo necesita, sin cargar todo al inicio.

### No railroadees a Claude

Dale información, no instrucciones paso a paso demasiado rígidas. Skills reutilizables necesitan flexibilidad para adaptarse a cada situación. En vez de *"haz siempre A, luego B, luego C"*, escribe *"consulta la API en references/api.md para decidir qué endpoints usar"*.

### On-demand hooks dentro de skills

Las skills pueden registrar hooks que se activan solo cuando la skill se invoca y duran toda la sesión:

- `/careful` — bloquea `rm -rf`, `DROP TABLE`, force-push via PreToolUse
- `/freeze` — bloquea Edit/Write fuera de un directorio específico (útil para debugging)

### Medir uso con hooks

Para saber qué skills se usan y cuáles no:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "SkillTool",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'echo \"$(date) SKILL $CLAUDE_TOOL_INPUT\" >> /tmp/skill-usage.log'"
          }
        ]
      }
    ]
  }
}
```

## Compartir skills en equipo

**Dos formas de compartir:**

| Método | Cómo | Cuándo usarlo |
|---|---|---|
| **Repo-checked** | Commitear en `.claude/skills/` del repo | Equipos pequeños, pocos repos |
| **Plugin marketplace** | Subir como plugin | Equipos grandes, skills compartidas entre repos |

Para compartir en repo, simplemente commitea la carpeta de la skill. Todo el equipo la tiene al hacer pull.

Para composición entre skills (una skill que invoca otra), referencia por nombre en las instrucciones — Claude las invoca si están instaladas.

## Checklist de calidad antes de publicar

- [ ] Encaja limpiamente en 1 de las 9 categorías
- [ ] Description tiene frases de activación (*"Use when..."*), no marketing
- [ ] Gotchas documentados (mínimo 2-3 iniciales)
- [ ] Info detallada en `references/`, no toda en SKILL.md (progressive disclosure)
- [ ] Scripts incluidos si Claude necesita componer (no reconstruir)
- [ ] Setup con `config.json` si necesita datos del usuario
- [ ] No dice lo obvio — se enfoca en lo que Claude no sabría solo
- [ ] Instrucciones flexibles — información, no railroading
- [ ] Template de output en `assets/` si el resultado tiene formato específico

## Siguiente paso

Los hooks garantizan ejecución determinística. Las skills encapsulan workflows. El siguiente nivel es **conectar Claude con servicios externos** via MCP.

[MCP: conectar con el mundo exterior →](/conectar/mcp/)
