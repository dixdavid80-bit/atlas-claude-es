---
title: "Skills: workflows reutilizables"
description: "Crear, validar y compartir skills — 9 categorías oficiales, 17 skills built-in, fuentes de carga, best practices y patrón Autoresearch."
sidebar:
  order: 2
---

Llevas tres días escribiendo el mismo tipo de informe, con la misma estructura, los mismos gotchas, y las mismas instrucciones que le repites a Claude cada vez. Eso es exactamente lo que una skill resuelve: encapsulas el workflow una vez, y Claude lo ejecuta siempre igual, sin que le vuelvas a explicar nada.

Una skill es un conjunto de instrucciones + scripts + templates que Claude Code carga bajo demanda. A diferencia de CLAUDE.md (que se lee siempre), las skills se activan cuando las invocas con `/nombre` o cuando Claude detecta que aplican a la tarea actual.

## Cuándo crear una skill (y cuándo no)

**Crea una skill cuando:**
- Haces algo más de 3 veces con el mismo patrón — la repetición es la señal
- Quieres que cualquier persona del equipo ejecute un workflow sin explicarlo de cero
- Necesitas combinar instrucciones + scripts + templates + gotchas en un solo paquete
- El output tiene un formato específico que debe ser consistente

**No crees una skill cuando:**
- Una instrucción directa en el chat resuelve el problema (no toda automatización merece skill)
- El workflow cambia cada vez y no tiene patrón estable
- El CLAUDE.md ya cubre la necesidad — no dupliques
- Solo necesitas una regla de enforcement → eso es un [hook](/automatizar/hooks/), no una skill

:::tip[Mi recomendación]
**Empieza sin skills.** Trabaja con Claude una semana, identifica qué le repites más de 3 veces, y entonces encapsula eso como skill. Las mejores skills nacen de la experiencia real, no de planificación anticipada.
:::

## Las 9 categorías oficiales de Anthropic

Anthropic catalogó cientos de skills en uso interno y descubrió que las mejores encajan limpiamente en una sola categoría. Las que mezclan varias resultan confusas. Si tu skill no encaja en ninguna, probablemente es demasiado amplia — divídela.

| # | Categoría | Qué hace | Ejemplo real |
|---|---|---|---|
| 1 | **Library & API Reference** | Documentación de librerías con gotchas y snippets de referencia | billing-lib, frontend-design (sistema de diseño propio de Anthropic) |
| 2 | **Product Verification** | Testing y verificación de output. Se combina con Playwright, tmux | Assertions programáticas en cada paso. Tip de Anthropic: graba vídeo de lo que Claude testea |
| 3 | **Data Fetching & Analysis** | Conexión a datos y monitoreo. Incluye credenciales, queries frecuentes | funnel-query, cohort-compare, grafana |
| 4 | **Business Process** | Automatizan workflows repetitivos en un solo comando | standup-post, create-ticket, weekly-recap |
| 5 | **Code Scaffolding** | Generan boilerplate específico del codebase (no genérico) | new-workflow, new-migration, create-app |
| 6 | **Code Quality & Review** | Refuerzan calidad. Pueden ejecutarse vía hooks o GitHub Actions | adversarial-review (subagente fresh-eyes), code-style |
| 7 | **CI/CD & Deployment** | Gestión de PRs, deploys, rollbacks | babysit-pr (monitorea PR → retry CI flaky → auto-merge), deploy-service |
| 8 | **Runbooks** | De síntoma a reporte estructurado. Multi-tool | service-debugging, oncall-runner, log-correlator |
| 9 | **Infrastructure Ops** | Mantenimiento con guardrails para acciones destructivas | resource-orphans (encuentra → Slack → espera → confirma → cleanup) |

:::caution[Inversión recomendada por Anthropic]
"Invierte una semana de ingeniero en hacer excelentes las skills de verificación (categoría 2)." Las skills de testing son las que más ROI dan porque atrapan errores que un humano tarda horas en encontrar.
:::

## Los 17 skills built-in — qué tienes disponible sin instalar nada

Claude Code viene con 17 skills compiladas. 10 públicas, 5 exclusivas de Anthropic, 2 con feature flag.

### Skills públicas (ya disponibles)

| Skill | Qué hace | Por qué importa |
|---|---|---|
| `/simplify` | Revisión en 3 fases: 3 agentes en paralelo buscan reutilización, calidad y eficiencia | **Una de las más potentes.** Usa la misma infra de agentes que el modelo principal |
| `/batch` | Orquestador a gran escala: descompone en 5-30 unidades, un agente por unidad con worktree aislado | Para cambios masivos — cada unidad en branch propia |
| `/loop` | Programa tarea recurrente (cron). Convierte lenguaje natural a cron expression | Automatiza polling, babysitting de PRs, resúmenes periódicos |
| `/schedule` | Programa agentes remotos vía RemoteTrigger. Asistente interactivo | Para tareas que corren en la nube, no en tu terminal |
| `/claude-api` | 247KB de docs de la API integradas. Detecta lenguaje del proyecto | No necesitas salir a buscar docs — pregúntale directamente |
| `/debug` | Lee log de depuración, investigación en 5 pasos | Punto de partida para cualquier debugging serio |
| `/update-config` | Escribe cambios en settings.json con verificación completa | Para configurar hooks, permisos, MCP sin editar JSON a mano |
| `/claude-in-chrome` | Automatización de Chrome (solo con extensión detectada) | Browser automation integrada |
| `/insights` | Informe analítico de sesiones. Carga lazy | Para entender cómo usas Claude Code y optimizar |
| `/keybindings-help` | Referencia para personalizar atajos de teclado | Auto-invoca cuando preguntas sobre atajos |

### Skills con feature flag (señales de roadmap)

| Skill | Flag | Qué hace |
|---|---|---|
| `/dream` | KAIROS | Consolida logs diarios en MEMORY.md estructurado. Se ejecuta de noche en modo autónomo |
| `/hunter` | REVIEW_ARTIFACT | Caza de bugs y artefactos de revisión |

:::tip[Las dos más importantes para tu día a día]
**`/simplify`** después de implementar algo (3 agentes que revisan tu código en paralelo) y **`/batch`** para cambios que tocan muchos archivos (cada cambio en worktree aislado). Si solo usas dos skills built-in, que sean estas.
:::

## Cómo descubre Claude las skills — 9 fuentes de carga

Claude Code busca skills en 9 sitios, por orden de prioridad (mayor sobreescribe menor):

| # | Fuente | Ruta | Alcance |
|---|---|---|---|
| 1 | Gestionado (política) | `<managed_path>/.claude/skills/` | Corporativo / org |
| 2 | Usuario | `~/.claude/skills/` | Personal, todos los repos |
| 3 | Proyecto | `.claude/skills/` (y directorios padre hasta home) | Proyecto, compartido vía git |
| 4 | Directorios adicionales | `--add-dir <path>/.claude/skills/` | Sesión |
| 5 | Commands legacy | `~/.claude/commands/` y `.claude/commands/` | Legacy (deprecado) |
| 6 | Integrados | Compilados en el binario | Built-in (los 17 de arriba) |
| 7 | Plugin | Vía marketplace | Plugin scope |
| 8 | MCP | Desde servidores MCP conectados | Server scope |
| 9 | Dinámico | Descubiertos al tocar archivos | Condicional a ruta |

### Sistema de descubrimiento

- **Listado automático:** las skills se listan en system-reminder cada turno. Presupuesto: **1% de la ventana de contexto**. Los built-in nunca se truncan
- **Activación por rutas:** skills con `paths:` en frontmatter solo se activan al tocar archivos que coincidan con los globs
- **Descubrimiento dinámico:** al leer/escribir archivos, Claude recorre directorios padre buscando `.claude/skills/`. Permite jerarquías anidadas
- **File watcher:** chokidar monitorea directorios de skills y recarga en vivo cuando cambian — puedes editar skills durante una sesión
- **Tracking de uso:** decaimiento exponencial con vida media de 7 días. Skills más usadas recientemente aparecen arriba en sugerencias

:::caution[Impacto en contexto]
Cada skill listada consume tokens del 1% de presupuesto. Con demasiadas skills cargadas, el sistema tiene que truncar. Desactiva o elimina skills que no uses — `disable-model-invocation: true` en frontmatter evita que Claude las auto-invoque.
:::

## Estructura de una skill

Cada skill vive en su propia carpeta:

```
.claude/skills/
└── mi-skill/
    ├── SKILL.md              ← Archivo principal (obligatorio)
    ├── config.json           ← Setup del usuario (opcional — si no existe, Claude pregunta)
    ├── scripts/
    │   └── generate.py       ← Scripts helper que Claude compone, no reconstruye
    ├── assets/
    │   └── template.md       ← Templates de output
    └── references/
        ├── api.md            ← Documentación de referencia (progressive disclosure)
        └── gotchas.md        ← Errores conocidos (crece con el tiempo)
```

Claude descubre y lee estos archivos bajo demanda — no los carga todos al inicio.

## El archivo SKILL.md

Es el corazón de la skill. Dos partes: **frontmatter YAML** (metadata) y **body** (instrucciones).

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
| `allowed-tools` | lista | Whitelist de tools permitidas (`Bash(npm:*)`, `Read`) |
| `when_to_use` | string | Cuándo debe auto-invocar este skill el modelo |
| `argument-hint` | string | Texto de sugerencia para argumentos en typeahead |
| `model` | sonnet/opus/haiku/inherit | Sobreescribe el modelo |
| `effort` | low/medium/high/max | Sobreescribe nivel de razonamiento |
| `context` | inline/fork | `inline`: expande en conversación actual; `fork`: sub-agente aislado con token budget propio |
| `user-invocable` | boolean | Si el usuario puede invocarla con `/nombre` |
| `disable-model-invocation` | boolean | Impide que el modelo la auto-invoque |
| `paths` | lista de globs | Solo se activa al tocar archivos que coincidan |
| `hooks` | objeto | Hooks de ciclo de vida con scope de sesión |
| `skills` | string | Skills a precargar cuando esta se ejecute |

### Variables de contenido

Dentro del body del SKILL.md puedes usar variables dinámicas:

| Variable | Qué contiene |
|---|---|
| `$ARGUMENTS` o `$1, $2` | Argumentos que el usuario pasa al invocar |
| `${CLAUDE_SKILL_DIR}` | Directorio de la skill |
| `${CLAUDE_SESSION_ID}` | ID de la sesión actual |
| `${CLAUDE_PLUGIN_DATA}` | Carpeta estable para datos persistentes (los datos en el directorio de la skill pueden perderse al actualizar) |
| `` !`comando` `` | Ejecución shell inline — la salida se inyecta en el prompt al cargarse |

### Secciones del body

```markdown
## Overview
Qué produce y a qué estándar de calidad. 2-3 frases máx.

## Filesystem
Mapa de lo que hay en la carpeta. Claude lee bajo demanda.

## Setup
Solo si necesita config del usuario. Patrón: si config.json no existe, Claude pregunta.

## Instructions
Pasos flexibles. Dar información (qué consultar y cuándo), no railroadear.

## Gotchas
Errores conocidos. Empezar con los que sabes. Actualizar con el tiempo.

## Examples
Escenarios: prompt del usuario, acciones de Claude, output esperado.

## Troubleshooting
Error → causa → solución.
```

## Crear tu primera skill — de simple a completa

### Nivel 1: Solo SKILL.md (lo mínimo)

No necesitas ningún script. Solo un archivo:

```bash
mkdir -p .claude/skills/email-profesional
```

```markdown
---
name: email-profesional
description: >
  Redacta emails profesionales en español B2B.
  Use when user asks to write an email or draft a message.
---

## Instructions
1. Identifica destinatario y objetivo
2. Estructura: asunto → contexto 1 frase → petición → cierre con acción
3. Tono formal pero cercano. Máximo 3 líneas por párrafo

## Gotchas
- "Un saludo" > "Atentamente" para emails cortos en español B2B
- Si es primer contacto, incluir quién eres y por qué escribes
```

Esto funciona. Claude lo recarga en vivo (file watcher). Pero es una skill plana — Claude reconstruye todo desde cero cada vez.

### Nivel 2: Skill con assets (progressive disclosure real)

La skill de verdad es una **carpeta**, no solo un markdown. Añade templates, scripts y datos para que Claude **componga** en vez de improvisar:

```
.claude/skills/informe-semanal/
├── SKILL.md              → Instrucciones + routing
├── template.md           → Plantilla base del informe
├── sections/
│   ├── resumen-ejecutivo.md    → Estructura del resumen
│   ├── metricas.md             → Qué métricas incluir y formato
│   └── siguiente-semana.md     → Formato de próximos pasos
├── scripts/
│   └── fetch-metrics.sh        → Script que Claude ejecuta para obtener datos
└── examples/
    └── informe-ejemplo.md      → Un informe real como referencia
```

El SKILL.md de esta versión:

```markdown
---
name: informe-semanal
description: >
  Genera informe semanal del proyecto con métricas, resumen ejecutivo y plan.
  Use when user asks for weekly report, status update, or progress summary.
---

## Instructions
1. Ejecuta `scripts/fetch-metrics.sh` para obtener datos actualizados
2. Lee `template.md` como estructura base
3. Rellena cada sección siguiendo la guía en `sections/`
4. Consulta `examples/informe-ejemplo.md` como referencia de tono y extensión
5. Genera el informe en `docs/informes/YYYY-MM-DD-semanal.md`

## Gotchas
- NO inventes métricas — si el script falla, indica que los datos no están disponibles
- El resumen ejecutivo va PRIMERO y no supera 5 líneas
- Las métricas llevan siempre comparación con semana anterior (↑/↓/→)
- "Siguiente semana" son compromisos, no deseos. Máximo 5 items concretos
```

**La diferencia es enorme.** Con la skill plana, Claude improvisa el formato cada vez. Con la carpeta, Claude lee el template, ejecuta el script, rellena con datos reales y mantiene consistencia entre semanas. Eso es progressive disclosure aplicada a skills: Claude solo accede a lo que necesita en cada paso.

### Úsala:
```
/informe-semanal genera el informe de esta semana
```

Si algo no te convence, edita los archivos de la carpeta. Claude recarga en vivo sin reiniciar sesión.

## Best practices oficiales de Anthropic

### Las 5 reglas que más impacto tienen

**1. La skill es una carpeta, no solo un markdown.** Claude descubre, explora y usa todo: scripts, assets, templates, datos. Incluye scripts helper para que Claude componga, no reconstruya boilerplate desde cero.

**2. No digas lo obvio.** Claude ya sabe mucho. Enfócate en lo que lo saque de su forma habitual de pensar. El frontend-design skill de Anthropic se construyó iterando con clientes para mejorar el "gusto" de diseño y evitar patrones genéricos (Inter font, gradientes morados).

**3. La sección Gotchas es la de mayor señal.** Se alimenta de los errores reales de Claude al usar la skill. Empezar con 2-3, actualizar con el tiempo. Anthropic la considera el contenido más valioso de cualquier skill.

**4. Usa progressive disclosure vía filesystem.** No metas toda la info en SKILL.md. Dile qué archivos tiene y los lee cuando necesita:
```markdown
## Filesystem
- `references/api.md` — firmas de funciones y detalles
- `assets/template.md` — plantilla del output esperado
- `scripts/validate.sh` — validación post-generación
```

**5. No railroadees a Claude.** Instrucciones demasiado rígidas hacen skills frágiles. Dale información (*"consulta la API en references/api.md"*), no secuencias inflexibles (*"haz siempre A, luego B, luego C"*).

### El campo description: escríbelo para el modelo

No es un resumen humano — es el **trigger**. Claude escanea las descripciones al inicio de sesión (dentro del 1% de presupuesto) para decidir qué skill activar. Escribe frases de activación (*"Use when user asks to..."*), no marketing (*"una skill genial para..."*).

### Memory dentro de skills

Las skills pueden almacenar estado persistente en archivos (text logs, JSON, SQLite). Usa `${CLAUDE_PLUGIN_DATA}` como carpeta estable — los datos en el directorio de la skill pueden perderse al actualizar vía marketplace.

Ejemplo: un standup-post skill que guarda `standups.log` para que la próxima ejecución sepa qué cambió.

### On-demand hooks dentro de skills

Las skills pueden registrar hooks que **solo se activan cuando la skill se invoca** y duran toda la sesión:

- `/careful` — bloquea `rm -rf`, `DROP TABLE`, force-push vía PreToolUse
- `/freeze` — bloquea Edit/Write fuera de un directorio específico (útil para debugging)

Esto convierte una skill en un "modo de operación": al invocarla, cambia las reglas de seguridad de la sesión.

## Compartir skills en equipo

### Dos formas

| Método | Cómo | Cuándo |
|---|---|---|
| **Repo-checked** | Commitear en `.claude/skills/` del repo | Equipos pequeños, pocos repos. Cada skill añade algo de contexto al modelo |
| **Plugin marketplace** | Subir como plugin. Cada miembro decide qué instalar | Equipos grandes. Escala mejor |

### Gestión del marketplace (patrón Anthropic)

No hay equipo centralizado que decide. Flujo orgánico:
1. Publicar en carpeta sandbox en GitHub
2. Compartir en Slack
3. Si gana tracción → PR al marketplace
4. Curación antes de release es importante — es fácil crear skills malas o redundantes

### Composición entre skills

No hay dependency management nativo todavía. Referencia skills por nombre en las instrucciones y Claude las invoca si están instaladas. También puedes usar el campo `skills` del frontmatter para precargar dependencias.

### Medir uso con hooks

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "SkillTool",
      "hooks": [{
        "type": "command",
        "command": "bash -c 'echo \"$(date) SKILL $CLAUDE_TOOL_INPUT\" >> /tmp/skill-usage.log'"
      }]
    }]
  }
}
```

Detecta skills populares o que triggean menos de lo esperado (undertriggering = description mal escrita).

## Patrón Autoresearch — mejora iterativa automática de skills

Método de auto-mejora inspirado en el "autoresearch" de Andrej Karpathy. El agente prueba un cambio pequeño en el prompt de la skill, evalúa contra un checklist binario, y mantiene o revierte. Repite hasta alcanzar un umbral de calidad.

### El loop

1. Ejecutar la skill con un input de prueba
2. Evaluar el output contra un checklist de preguntas sí/no (el "scorer")
3. Registrar puntuación base (% de checks que pasan)
4. Hacer **UN** cambio pequeño al prompt de la skill
5. Ejecutar de nuevo, evaluar de nuevo
6. Si la puntuación sube → mantener el cambio. Si baja → revertir
7. Repetir desde paso 4

### El checklist (la parte crítica)

Es lo único que el usuario debe crear. Preguntas binarias que definen "bueno":

- Cada pregunta verifica **UNA** cosa específica y observable
- Evitar criterios vagos ("es bueno") — usar verificables ("contiene un número en el título")
- **3-6 preguntas** es el rango óptimo. Más de 6 y la skill empieza a "gamear" el checklist
- Ejemplo para copy de emails: *"¿Tiene el asunto un verbo de acción?"* / *"¿Está libre de buzzwords?"* / *"¿El CTA es específico?"*

### Aplicabilidad más allá de skills

El patrón funciona con cualquier cosa medible con checklist binario: prompts repetitivos, templates de output, cold outreach, newsletters, documentación.

:::caution[Riesgo: overfitting al checklist]
La skill puede aprender a pasar los checks sin mejorar realmente. Mitigación: revisa manualmente cada N rondas y ten checks que cubran calidad general además de criterios específicos. Autoresearch complementa evals formales, no los reemplaza.
:::

## Checklist de calidad antes de publicar

- [ ] Encaja limpiamente en **1** de las 9 categorías
- [ ] Description tiene frases de activación (*"Use when..."*), no marketing
- [ ] Gotchas documentados (mínimo 2-3 iniciales)
- [ ] Info detallada en `references/`, no toda en SKILL.md (progressive disclosure)
- [ ] Scripts incluidos si Claude necesita componer (no reconstruir)
- [ ] Setup con `config.json` si necesita datos del usuario
- [ ] No dice lo obvio — se enfoca en lo que Claude no sabría solo
- [ ] Instrucciones flexibles — información, no railroading
- [ ] Template de output en `assets/` si el resultado tiene formato específico
- [ ] Probada al menos 3 veces con inputs distintos antes de compartir

## Siguiente paso

Los hooks garantizan ejecución determinística. Las skills encapsulan workflows. El siguiente nivel es **conectar Claude con servicios externos** vía MCP.

[MCP: conectar con el mundo exterior →](/conectar/mcp/)
