---
title: "Modelos y coste: optimizar sin perder calidad"
description: "Aliases, effort levels, opusplan, /ultraplan, Monitor tool, compaction estratégica, pricing real y cómo no desperdiciar tokens."
sidebar:
  order: 2
---

Estás en una sesión con Opus y el coste sube rápido. Claude se repite. Haces `/compact` demasiado tarde. Tienes 5 MCPs activos y solo usas 2. Este capítulo resuelve todo eso — con números reales, no con reglas genéricas.

## Los 7 aliases de modelo

Claude Code ofrece aliases que siempre apuntan a la última versión del modelo. No necesitas memorizar nombres largos:

| Alias | Comportamiento |
|---|---|
| `default` | Depende del plan: Max/Team Premium → Opus 4.6, Pro/Team Standard → Sonnet 4.6. Fallback automático a Sonnet si alcanzas umbral de uso con Opus |
| `sonnet` | Último Sonnet (actualmente 4.6). Para trabajo diario |
| `opus` | Último Opus (actualmente 4.6). Para razonamiento complejo |
| `haiku` | Haiku rápido para tareas simples |
| `sonnet[1m]` | Sonnet con ventana de 1M tokens |
| `opus[1m]` | Opus con ventana de 1M tokens |
| `opusplan` | **Modo híbrido: Opus para planificar, Sonnet para ejecutar** |

Para fijar versión: nombre completo (`claude-opus-4-6`) o env var `ANTHROPIC_DEFAULT_OPUS_MODEL`.

### 4 formas de configurar (por prioridad)

1. `/model <alias>` durante sesión (máxima prioridad)
2. `claude --model <alias>` al arrancar
3. `ANTHROPIC_MODEL=<alias>` como env var
4. `"model": "<alias>"` en settings.json (mínima prioridad)

## Regla de decisión rápida

| Situación | Modelo | Por qué |
|---|---|---|
| Edición, tareas claras, trabajo general | `/model sonnet` | Más rápido, más barato, cubre el **80%+** de tareas |
| Arquitectura, debugging profundo, decisiones complejas | `/model opus` | Razonamiento superior, merece el coste extra |
| Tareas triviales, bajo presupuesto | `/model haiku` | Mínimo coste |
| Plan complejo + ejecución posterior | `/model opusplan` | Lo mejor de ambos mundos |

:::tip[Mi configuración recomendada para el día a día]
```json
{
  "model": "sonnet",
  "effortLevel": "medium",
  "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE": 50
}
```
**Sonnet como default** (no Opus). Cambia a Opus solo cuando la tarea lo requiera. **Effort medium** como base. **Compact al 50%** en vez del 95% por defecto — la diferencia en calidad de sesiones largas es enorme.
:::

## Pricing real — lo que de verdad cuesta

*(Precios verificados abril 2026 — consulta [anthropic.com/pricing](https://anthropic.com/pricing) para datos actualizados)*

### Precio por millón de tokens (API)

| Modelo | Input | Output | Cache reads | Cache writes |
|---|---|---|---|---|
| **Opus 4.6** | $15 | $75 | $1.50 (90% ahorro) | $18.75 |
| **Sonnet 4.6** | $3 | $15 | $0.30 (90% ahorro) | $3.75 |
| **Haiku 4.5** | $0.80 | $4 | $0.08 | $1 |

### Fast mode (solo API)

6x el precio del mismo modelo. Solo útil cuando la latencia es crítica y el coste es secundario.

### Aritmética real — cuánto cuesta una sesión típica

| Escenario | Modelo | Duración | Tokens aprox. | Coste aprox. |
|---|---|---|---|---|
| Fix de un bug simple | Sonnet | 5 min | ~20K in + 5K out | ~$0.14 |
| Feature mediana (1-2 archivos) | Sonnet | 20 min | ~80K in + 20K out | ~$0.54 |
| Refactor complejo | Opus | 45 min | ~150K in + 40K out | ~$5.25 |
| Sesión larga con compact | Sonnet | 2 horas | ~300K in + 80K out | ~$2.10 |
| Harness engineering (autónomo) | Opus | 6 horas | ~500K in + 150K out | ~$18.75 |

:::caution[Los tokens de thinking no aparecen en estos cálculos]
Con effort `high` o `max`, los tokens de thinking (razonamiento interno) pueden multiplicar x2-x5 el coste visible. Monitoriza con `/cost` durante sesiones con effort alto.
:::

### En planes de suscripción (Max)

Con plan Max ($100-200/mes) Claude Code es prácticamente ilimitado para uso normal. El coste de API per-token no aplica — pagas la suscripción. **Pero el límite existe:** Opus tiene un umbral de uso tras el cual Claude Code hace fallback automático a Sonnet. El tier alto de Max ($200/mes) tiene umbral más generoso.

## opusplan — lo mejor de ambos mundos

Cuando activas plan mode (vía `/plan` o Shift+Tab), Claude Code usa **Opus para razonamiento y arquitectura**. Al salir y ejecutar, cambia automáticamente a **Sonnet para código**. Combina razonamiento superior con eficiencia de generación.

**Cuándo usarlo:** tareas donde la planificación importa más que la ejecución — refactors, decisiones de arquitectura, cambios que afectan a muchos archivos. Para tareas directas (fix de bug, escribir un test), Sonnet solo es suficiente.

## /ultraplan — plan mode en la nube

Evolución de opusplan. Delega la fase de planificación a una sesión de **Claude Code on the web** mientras tu terminal queda libre:

```
/ultraplan migrate the auth service from sessions to JWTs
```

**Flujo:**
1. Claude Code abre una sesión cloud con Opus
2. Tu terminal muestra status: `◇ ultraplan` → `◇ needs your input` → `◆ ready`
3. Abres el plan en el navegador con review inline (comments, emoji, outline sidebar)
4. Eliges: **ejecutar en la web** (genera PR) o **teleport al terminal** (ejecutar local)

**Tres formas de invocar:**
- `/ultraplan <prompt>` — directo
- Incluir "ultraplan" en un prompt normal — keyword trigger
- Desde el dialog de aprobación de un plan local → **"No, refine with Ultraplan"**

:::caution[Requisitos y limitaciones]
Requiere v2.1.91+, cuenta Claude Code on the web, repositorio GitHub. **No compatible con Bedrock, Vertex ni Foundry** — solo infra Anthropic. Conflicto con Remote Control (ambos ocupan claude.ai/code).
:::

**Cuándo usarlo vs plan mode local:**

| Aspecto | Plan mode local | `/ultraplan` |
|---|---|---|
| Dónde corre | Tu máquina | Cloud Anthropic (hasta ~30 min) |
| Terminal | Bloqueado | **Libre** — puedes seguir trabajando |
| Review | Lineal en terminal | Inline comments + emoji en navegador |
| Ejecución | Solo local | Web (→ PR) o teleport a terminal |
| Caso ideal | Cambios simples, flujo terminal puro | Planes complejos donde quieres review colaborativo |

## Effort levels — cuánto "piensa" Claude

4 niveles de razonamiento adaptativo:

| Nivel | Comportamiento | Persiste | Coste relativo |
|---|---|---|---|
| `low` | Rápido, tareas directas | Sí (entre sesiones) | Mínimo |
| `medium` | Balance (default en Max/Team) | Sí | Moderado |
| `high` | Razonamiento profundo | Sí | Alto (x2-3 en thinking tokens) |
| `max` | Sin límite de thinking. **Solo Opus 4.6** | No (solo sesión actual) | **Muy alto** |

Configurar: `/effort <nivel>`, `--effort <nivel>`, env var `CLAUDE_CODE_EFFORT_LEVEL`, o `"effortLevel"` en settings.

:::tip[Pairing con Advisor tool]
Sonnet @ medium effort + Opus advisor ≈ Sonnet @ default effort en intelligence, a menor coste. Para máxima calidad: executor @ default effort. Ver [Advisor tool](/produccion/api-agent-sdk/) para detalles.
:::

## Contexto extendido — 1M tokens

| Plan | Opus 1M | Sonnet 1M |
|---|---|---|
| Max, Team, Enterprise | **Incluido** | Requiere extra usage |
| Pro | Requiere extra usage | Requiere extra usage |
| API pay-as-you-go | Acceso completo | Acceso completo |

En Max/Team/Enterprise, Opus se actualiza automáticamente a 1M sin config extra. Pricing estándar. Para desactivar: `CLAUDE_CODE_DISABLE_1M_CONTEXT=1`.

## Token optimization — el arte de no desperdiciar

### El problema real

El auto-compact por defecto se activa al **95%** de contexto. Para entonces Claude ya se repite, olvida decisiones y genera código contradictorio. Llegas tarde.

### Mi configuración recomendada

```json
{
  "model": "sonnet",
  "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE": 50
}
```

| Setting | Default | Recomendado | Por qué |
|---|---|---|---|
| `model` | opus | **sonnet** | ~60% reducción de coste. Opus cuando lo necesites, no como default |
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` | 95 | **50** | Compacta antes → resúmenes de mejor calidad → sesiones más largas sin degradación |

### Cuándo hacer `/compact` (y cuándo no)

**Hazlo:**
- Después de investigar/explorar, **ANTES** de implementar
- Después de completar un hito (commit, feature), **ANTES** del siguiente
- Después de debuggear, **ANTES** de continuar con feature work
- Después de un approach fallido, **ANTES** de intentar otro

**No lo hagas:**
- Mid-implementación — pierdes estado parcial (variables, paths, decisiones en curso)
- Con cambios sin commitear — haz commit primero
- En medio de debugging con contexto acumulado relevante

### Señales de degradación — cuando ya llegas tarde

Si notas cualquiera de estas, deberías haber compactado hace 5 minutos:
- Claude repite cosas que ya dijo
- Olvida decisiones tomadas antes en la sesión
- Genera código que contradice lo que ya escribió
- Pierde el hilo de la tarea actual
- Empieza a preguntar cosas que ya le dijiste

### Datos internos de compactación

| Parámetro | Valor |
|---|---|
| Ventana por defecto | 200.000 tokens |
| Ventana extendida | 1.000.000 tokens (con 1M activado) |
| Trigger de auto-compactación | ~13.000 tokens restantes |
| Budget post-compactación | 50K tokens (restaura hasta 5 archivos, 5.000 tokens/archivo máx) |
| Circuit breaker | 3 fallos consecutivos → para el loop |
| Configurable vía | `CLAUDE_CODE_MAX_CONTEXT_TOKENS` |

### Microcompactación — limpieza inline

Proceso distinto de la compactación completa. Opera **durante la sesión** sin que lo notes, targeting outputs antiguos de Read, Bash, Grep, Glob, WebSearch, WebFetch, Edit, Write. Los resultados viejos se reemplazan por `[Old tool result content cleared]`. Las imágenes se estiman en 2.000 tokens fijos.

**Implicación práctica:** Claude tiene instrucciones de anotar información importante de tool results en su respuesta, porque sabe que los resultados se purgan. Si ves a Claude repitiendo datos que acaba de leer, es porque está "guardando" la info antes de que la microcompactación la elimine.

### Límites de output por escenario

| Escenario | Límite |
|---|---|
| Respuestas estándar | 32.000 tokens |
| Con slots reservados | 8.000 tokens |
| Modo recovery | 64.000 tokens |
| Output de compactación | 20.000 tokens |

## Monitor tool — event-driven en vez de polling

Dos formas de vigilar algo. Una gasta tokens continuamente, la otra solo cuando pasa algo:

### La economía

| Escenario: vigilar tests 10 min | `/loop 2m` | Monitor tool |
|---|---|---|
| API calls | 5 completas (una por tick) | 0 si nada matchea, 1 al primer fallo |
| Token spend | Continuo | Solo al evento |
| Latencia de detección | Hasta 2 min | **Instantánea** |
| Proceso underlying | Se re-lanza en cada tick | Corre una sola vez |

### Cómo funciona

Claude lanza un comando shell cuyo `stdout` se convierte en un stream de eventos. Cada línea de output despierta la sesión. Si el comando está en silencio, no gasta tokens.

**4 parámetros:**

| Parámetro | Función | Default |
|---|---|---|
| `description` | Label corto para notificaciones | — |
| `command` | Comando shell cuyo stdout es el event stream | — |
| `timeout_ms` | Auto-kill timer | 300.000ms (5 min), máx 3.600.000ms (1h) |
| `persistent` | Si `true`, corre toda la sesión. Detener con `TaskStop` | false |

**Batching:** líneas que llegan dentro de 200ms se agrupan en una notificación. `stderr` va a output files pero **no** dispara eventos.

### Dos formas de usar

**Stream filter — vigilar output continuo:**
```bash
tail -f /var/log/app.log | grep --line-buffered "ERROR"
```
Claude reacciona en el momento exacto del error. Nada de polling.

**Poll-and-if — chequear con condición:**
```bash
gh api "repos/owner/repo/issues/123/comments?since=$last" \
  --jq '.[] | "\(.user.login): \(.body)"'
```
Solo emite cuando aparecen comentarios nuevos.

:::danger[Regla crítica: `--line-buffered`]
Usa **siempre** `grep --line-buffered` en pipes. Sin ello, el buffering retrasa eventos varios minutos. Es la trampa más común del Monitor tool.
:::

### Patrón autoheal — closed loop con PR correctivo

El caso de uso más potente: Monitor detecta crash en logs → Claude diagnostica → abre PR con el fix. Loop cerrado sin intervención humana.

Ejemplo oficial (Noah Zweben, PM Claude Code):
```
"Use the monitor tool and kubectl logs -f | grep .. to listen for errors,
make a PR to fix any crashes"
```

Es el patrón que Sentry+Seer materializó como producto, ahora reproducible con 3 primitives de Claude Code: Monitor + git + skill de review.

### Cuándo Monitor, cuándo /loop

| Lo que vigilas | Herramienta | Por qué |
|---|---|---|
| Output stream continuo (logs, tests, CI) | **Monitor** | Event-driven, 0 tokens si no pasa nada |
| Algo que no emite (endpoint, archivo, estado) | **`/loop`** | Necesitas polling periódico |
| Dynamic looping post-abril 2026 | **Automático** | `/loop check CI on my PR` sin intervalo → Claude elige Monitor o tick según la tarea |

## Auto Mode — permisos sin fricción

Sin Auto Mode, Claude pide permiso para cada acción sensible — rompe workflows largos y harness engineering. **Coste extra:** 64-4.096 tokens por decisión — marginal comparado con la autonomía que desbloquea.

Para el detalle completo del clasificador (pipeline de 2 etapas, patrones bloqueados, cómo activarlo), ver [Tu primer proyecto → Auto Mode en detalle](/empezar/primer-proyecto/#auto-mode-en-detalle).

:::tip[Cuándo activar Auto Mode]
Para harness engineering, sesiones `/loop`, CI/CD pipelines, y cualquier trabajo donde vas a dejar a Claude trabajar solo más de 15 minutos. No tiene sentido para sesiones interactivas cortas donde tú supervisas cada paso.
:::

## Impacto de MCPs en tu ventana de contexto

:::danger[El coste oculto más grande: overhead de definiciones]
Con 5 servidores MCP típicos (GitHub 35 tools, Slack 11, Sentry 5, Grafana 5, Splunk 2), las definiciones consumen **~55.000 tokens antes de que Claude empiece**. Internamente en Anthropic han observado hasta **134.000 tokens** de overhead.

Con demasiados MCPs, tu ventana efectiva de 200K puede caer a **~70K**.

**Regla:** máximo ~10 MCPs y ~80 tools por proyecto. `disabledMcpServers` en `.claude/settings.local.json` para desactivar los que no uses.
:::

**Aritmética concreta:** si tienes 80 tools activas con descripción máxima (2.048 chars cada una), eso son ~164.000 chars ≈ **~40.000 tokens** solo en descripciones de herramientas. Antes de que Claude lea tu primer archivo, ya gastaste el 20% de la ventana estándar.

## Lógica de reintentos — qué pasa cuando falla

Claude Code implementa backoff exponencial automático:

| Parámetro | Valor |
|---|---|
| Backoff inicial | 500ms |
| Backoff máximo | 5 min |
| Reintentos máximos | 10 |
| Código 529 (overload) | Solo 3 reintentos, solo en foreground |
| Modo desatendido | Hasta 6 horas de reintentos |
| Budget por llamada | Limitado para evitar loops infinitos |

No necesitas configurar nada — funciona automáticamente. Pero si ves que Claude Code se "atasca" mucho, probablemente estás golpeando rate limits. Solución: bajar de modelo (Sonnet → Haiku para tareas simples) o espaciar las sesiones.

## Tip de UX: NO_FLICKER mode

Si el parpadeo de la terminal te molesta, Claude Code tiene un renderer experimental sin flicker:

```bash
CLAUDE_CODE_NO_FLICKER=1 claude
```

Renderizado diferencial (solo emite cambios), ~85% menos flicker. Experimental pero la mayoría de usuarios internos de Anthropic lo prefieren.

## Mapa de situaciones completo

### Elección de modelo

| Situación | Acción |
|---|---|
| Trabajo general | `/model sonnet` — no uses Opus como default |
| Arquitectura o debugging profundo | `/model opus` — justifica el coste |
| Plan complejo | `/model opusplan` — Opus piensa, Sonnet ejecuta |
| Plan complejo que quieres revisar en navegador | `/ultraplan` — cloud + review web |
| Ver gasto | `/cost` |
| Muchos MCPs activos | Revisar `disabledMcpServers` — cada uno consume tokens |

### Gestión de sesión

| Situación | Acción |
|---|---|
| Claude lento o se repite | `/compact` **ahora**, no esperar |
| Completaste un hito | `/compact` antes del siguiente |
| Cambias de tarea | `/clear` y empieza de cero |
| Debugging sin resolver | `/compact` después de approach fallido |

### Automatización y vigilancia

| Situación | Acción |
|---|---|
| Repetir algo periódicamente | `/loop` — máx 3 días, necesita tmux |
| Vigilar logs/tests/CI en vivo | **Monitor tool** — event-driven, 0 tokens si no pasa nada |
| Trabajo largo sin supervisión | **Auto Mode** + tmux |
| CI que falla y quieres autofix | **Monitor + autoheal pattern** — watch → diagnose → PR |

### Reglas de oro

| Duda | Respuesta |
|---|---|
| ¿`/compact` o `/clear`? | `/compact` = "sigo con lo mismo pero limpio". `/clear` = "empiezo otra cosa" |
| ¿Sonnet o Opus? | Sonnet por defecto. Opus cuando `/model sonnet` no da un resultado aceptable |
| ¿Auto Mode o Default? | Auto Mode si vas a dejar a Claude solo >15 min. Default si supervisas |
| ¿Monitor o `/loop`? | Monitor si hay stream de output. `/loop` si no emite |

### Variables de entorno de control

| Variable | Función |
|---|---|
| `ANTHROPIC_DEFAULT_OPUS_MODEL` | Modelo para `opus` y `opusplan` en plan mode |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | Modelo para `sonnet` y `opusplan` en ejecución |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL` | Modelo para `haiku` y funcionalidad background |
| `CLAUDE_CODE_SUBAGENT_MODEL` | Modelo para subagentes |
| `CLAUDE_CODE_EFFORT_LEVEL` | Effort level por defecto |
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` | Porcentaje de contexto para trigger de auto-compact |
| `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING` | Desactiva razonamiento adaptativo (vuelve a budget fijo) |
| `CLAUDE_CODE_NO_FLICKER` | Activa renderer sin parpadeo |

## Siguiente paso

Ya sabes cómo elegir modelos, optimizar tokens, vigilar con Monitor, y mantener sesiones largas productivas. El siguiente nivel es **construir agentes programáticos** que viven dentro de tus aplicaciones.

[API y Agent SDK: más allá del CLI →](/produccion/api-agent-sdk/)
