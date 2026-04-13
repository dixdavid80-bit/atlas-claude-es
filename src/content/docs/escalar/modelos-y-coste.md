---
title: "Modelos y coste: optimizar sin perder calidad"
description: "Aliases de modelo, effort levels, opusplan, compaction estratégica, Monitor tool y cómo mantener el gasto bajo control."
sidebar:
  order: 2
---

El 80% de las veces que usas Claude Code, la pregunta real es: *"¿uso Opus (potente y caro) o Sonnet (rápido y barato)?"*. Este capítulo te da las herramientas para tomar esa decisión con criterio — y las técnicas para exprimir el máximo de cada token.

## Los 7 aliases de modelo

En vez de escribir nombres largos, Claude Code ofrece aliases que siempre apuntan a la última versión:

| Alias | Comportamiento |
|---|---|
| `default` | Depende del plan: Max/Team Premium → Opus 4.6, Pro/Team Standard → Sonnet 4.6. Fallback automático a Sonnet si alcanzas umbral de uso con Opus |
| `sonnet` | Último Sonnet (actualmente 4.6). Para trabajo diario |
| `opus` | Último Opus (actualmente 4.6). Para razonamiento complejo |
| `haiku` | Haiku rápido para tareas simples |
| `sonnet[1m]` | Sonnet con ventana de contexto de 1M tokens |
| `opus[1m]` | Opus con ventana de contexto de 1M tokens |
| `opusplan` | **Modo híbrido: Opus para planificar, Sonnet para ejecutar** |

Para fijar una versión específica: usar nombre completo (`claude-opus-4-6`) o env var `ANTHROPIC_DEFAULT_OPUS_MODEL`.

### 4 formas de configurar (por prioridad)

1. `/model <alias>` durante sesión (máxima prioridad)
2. `claude --model <alias>` al arrancar
3. `ANTHROPIC_MODEL=<alias>` como variable de entorno
4. `"model": "<alias>"` en settings.json (mínima prioridad)

## La regla de decisión rápida

| Situación | Modelo | Por qué |
|---|---|---|
| Edición, tareas claras, trabajo general | `/model sonnet` | Más rápido, más barato, cubre el 80%+ |
| Arquitectura, debugging profundo, decisiones complejas | `/model opus` | Razonamiento superior, justifica el coste |
| Tareas triviales, bajo presupuesto | `/model haiku` | Mínimo coste |
| Plan complejo + ejecución posterior | `/model opusplan` | Lo mejor de ambos mundos |

## opusplan — lo mejor de ambos mundos

Cuando activas plan mode (vía `/plan` o Shift+Tab), Claude Code usa **Opus para razonamiento y decisiones de arquitectura**. Al salir de plan mode y ejecutar, cambia automáticamente a **Sonnet para generación de código**. Combina el razonamiento superior de Opus con la eficiencia de Sonnet.

:::tip[Advisor tool — la generalización de opusplan]
Anthropic llevó este concepto a la Messages API como **Advisor tool**: cualquier app puede parear un executor (Sonnet/Haiku) con un advisor (Opus) en una sola llamada. Benchmarks: **+2.7pp en SWE-bench Multilingual vs Sonnet solo, –11.9% coste por tarea**. Ver [capítulo API y Agent SDK](/produccion/api-agent-sdk/) para detalles.
:::

## Effort levels — razonamiento adaptativo

4 niveles que controlan cuánto "piensa" Claude antes de responder:

| Nivel | Comportamiento | Persistencia |
|---|---|---|
| `low` | Rápido y barato, tareas directas | Persiste entre sesiones |
| `medium` | Balance (default en Opus con plan Max/Team) | Persiste entre sesiones |
| `high` | Razonamiento profundo | Persiste entre sesiones |
| `max` | Sin límite de tokens de thinking. **Solo Opus 4.6** | Solo sesión actual |

**Configurar:** `/effort <nivel>`, `--effort <nivel>`, env var `CLAUDE_CODE_EFFORT_LEVEL`, o `"effortLevel"` en settings. El slider aparece también dentro de `/model` con flechas izquierda/derecha.

Para desactivar razonamiento adaptativo: `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING=1`.

## Contexto extendido — 1M tokens

| Plan | Opus 1M | Sonnet 1M |
|---|---|---|
| Max, Team, Enterprise | Incluido | Requiere extra usage |
| Pro | Requiere extra usage | Requiere extra usage |
| API pay-as-you-go | Acceso completo | Acceso completo |

En Max/Team/Enterprise, Opus se actualiza automáticamente a 1M sin configuración adicional. Pricing estándar (sin premium por tokens >200K). Para desactivar: `CLAUDE_CODE_DISABLE_1M_CONTEXT=1`.

## Token optimization — el arte de mantener el contexto sano

### El problema real

El auto-compact por defecto se activa al 95% de contexto — **cuando la degradación ya ha empezado**. Para entonces Claude ya se repite, olvida decisiones, y genera código contradictorio.

### Settings recomendados

```json
// ~/.claude/settings.json
{
  "model": "sonnet",
  "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE": 50
}
```

| Setting | Default | Recomendado | Impacto |
|---|---|---|---|
| `model` | opus | sonnet | ~60% reducción de coste |
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` | 95 | **50** | Compacta antes → mejor calidad en sesiones largas |

### Cuándo hacer compact

- **Después de investigar/explorar**, ANTES de implementar
- **Después de completar un hito** (commit, feature), ANTES del siguiente
- **Después de debuggear**, ANTES de continuar con feature work
- **Después de un approach fallido**, ANTES de intentar otro

### Cuándo NO hacer compact

- **Mid-implementación** — pierdes nombres de variables, paths, estado parcial
- **Con cambios sin commitear** — haz commit primero
- **En medio de debugging** con contexto acumulado relevante

### Señales de degradación del contexto

Cuando notes cualquiera de estas, es momento de `/compact`:
- Claude repite cosas que ya dijo
- Olvida decisiones tomadas antes en la sesión
- Genera código que contradice lo que ya escribió
- Pierde el hilo de la tarea actual

### Datos internos de compactación

| Parámetro | Valor |
|---|---|
| Ventana por defecto | 200.000 tokens |
| Ventana extendida | 1.000.000 tokens |
| Trigger de compactación | ~13.000 tokens restantes |
| Budget post-compactación | 50K tokens (restaura hasta 5 archivos, 5.000 tokens/archivo máx) |
| Circuit breaker | 3 fallos consecutivos → para el loop |
| Configurable vía | `CLAUDE_CODE_MAX_CONTEXT_TOKENS` |

**Microcompactación:** proceso distinto de la compactación completa. Opera inline durante la sesión, targeting outputs antiguos de Read, Bash, Grep, Glob, WebSearch, WebFetch, Edit, Write. Los resultados viejos se reemplazan por `[Old tool result content cleared]`. Las imágenes se estiman en 2.000 tokens fijos.

**Límites de output por escenario:**

| Escenario | Límite |
|---|---|
| Respuestas estándar | 32.000 tokens |
| Con slots reservados | 8.000 tokens |
| Modo recovery | 64.000 tokens |
| Output de compactación | 20.000 tokens |

:::tip[El compact manual es mejor que el automático]
`/compact` manual antes de llegar al trigger automático (~13K) produce resúmenes de mejor calidad porque tiene más tokens disponibles para el proceso. Confirma la recomendación de `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=50`.
:::

## Monitor tool vs /loop — economía comparada

Dos formas de vigilar algo, con costes muy diferentes:

| Escenario: vigilar tests 10 min | `/loop 2m` | Monitor tool |
|---|---|---|
| API calls | 5 completas (una por tick) | 0 si nada matchea, 1 al primer fallo |
| Token spend | Continuo | Solo al evento |
| Latencia de detección | Hasta 2 min | Instantánea |
| Proceso underlying | Se re-lanza en cada tick | Corre una sola vez |

**Regla:** si lo que vigilas genera output stream (logs, tests, CI), usa Monitor. Si necesitas chequear algo que no emite (un endpoint, un archivo), usa `/loop`.

## Auto Mode — permisos para workflows autónomos

Sin Auto Mode, Claude te pide permiso para cada acción sensible — lo que rompe workflows largos (harness engineering, /loop, CI/CD). Auto Mode usa un clasificador AI de 2 etapas:

1. **Etapa 1 (64 tokens):** decisión rápida sí/no sin razonamiento
2. **Etapa 2 (4.096 tokens):** solo si la etapa 1 bloquea, razonamiento completo

**Patrones bloqueados automáticamente:** intérpretes (python, node), ejecutores de paquetes (npx, npm run), shells (bash, ssh), eval/exec/sudo, herramientas de red (curl, wget), CLIs cloud, operaciones git.

**Coste:** entre 64 y 4.096 tokens extra por decisión — marginal comparado con la autonomía que desbloquea.

Activar: `claude --enable-auto-mode` o Shift+Tab → seleccionar auto.

## Impacto de MCPs en tu ventana de contexto

:::danger[Cada MCP consume tokens antes de que Claude empiece a trabajar]
Con 5 servidores MCP típicos (GitHub 35 tools, Slack 11, Sentry 5, Grafana 5, Splunk 2), las definiciones consumen **~55.000 tokens** antes de empezar. Internamente en Anthropic han observado hasta **134.000 tokens** de overhead.

Con demasiados MCPs, tu ventana efectiva de 200K puede caer a **~70K**.

**Regla:** máximo ~10 MCPs habilitados y ~80 tools activas por proyecto. Deshabilita los que no uses con `disabledMcpServers` en `.claude/settings.local.json`.
:::

## Mapa de situaciones — qué usar y cuándo

### Modelos

| Situación | Acción |
|---|---|
| Trabajo general, edición, tareas claras | `/model sonnet` |
| Arquitectura, decisiones complejas, debugging profundo | `/model opus` |
| Ver cuánto llevas gastado | `/cost` |
| Sesión larga con muchos MCPs | Revisar si hay MCPs activos que no necesitas |

### Gestión de sesión

| Situación | Acción |
|---|---|
| Claude lento o se repite | `/compact` — degradación de contexto |
| Completaste un hito | `/compact` antes del siguiente |
| Cambias de tarea completamente | `/clear` y empieza de cero |
| Debugging largo sin resolver | `/compact` después de approach fallido |

### Tareas autónomas

| Situación | Acción |
|---|---|
| Repetir algo cada X tiempo | `/loop` — máx 3 días, necesita tmux |
| Vigilar output continuo (logs, tests) | Monitor tool — event-driven, 0 tokens si nada pasa |
| Trabajo largo sin supervisión | Auto Mode + tmux |

### Regla de oro

| Duda | Respuesta |
|---|---|
| ¿`/compact` o `/clear`? | `/compact` = "sigo con lo mismo pero limpio". `/clear` = "empiezo otra cosa" |
| ¿Info para esta sesión o para siempre? | Esta sesión → dilo en el chat. Siempre → "recuerda que..." (auto-memory) o `~/.claude/CLAUDE.md` |

### Variables de entorno de control

| Variable | Función |
|---|---|
| `ANTHROPIC_DEFAULT_OPUS_MODEL` | Modelo para `opus` y `opusplan` en plan mode |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | Modelo para `sonnet` y `opusplan` en ejecución |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL` | Modelo para `haiku` y funcionalidad background |
| `CLAUDE_CODE_SUBAGENT_MODEL` | Modelo para subagentes |

## Siguiente paso

Ya sabes cómo elegir modelos, optimizar tokens y mantener sesiones largas productivas. El siguiente nivel es **construir agentes programáticos** que viven dentro de tus aplicaciones, no en la terminal.

[API y Agent SDK: más allá del CLI →](/produccion/api-agent-sdk/)
