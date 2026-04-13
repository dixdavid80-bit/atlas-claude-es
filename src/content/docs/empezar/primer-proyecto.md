---
title: Tu primer proyecto con Claude Code
description: "Instalar, configurar, primeros comandos, modos de trabajo, Remote Control y todo lo que necesitas para tu primera semana."
sidebar:
  order: 2
---

## Instalación

```bash
npm install -g @anthropic-ai/claude-code
```

Requisitos: Node.js 18+ y una cuenta de Anthropic (Pro, Max o Team — el plan Free no incluye Claude Code).

:::tip[Verificar instalación]
Después de instalar, ejecuta `claude --version` para confirmar. Si algo falla, `/doctor` dentro de una sesión diagnostica instalación, config, API, hooks y MCP servers.
:::

## Primera sesión

```bash
# Navega a tu proyecto
cd mi-proyecto

# Arranca Claude Code
claude

# Primera vez: se abre el navegador para autenticarte
# Después: arranca directamente
```

Cuando Claude Code arranca, lee automáticamente:
- El `CLAUDE.md` de tu proyecto (si existe) — instrucciones compartidas del equipo
- Tu memoria personal (`~/.claude/CLAUDE.md`) — preferencias globales
- Las reglas del proyecto (`.claude/rules/`) — reglas modulares por tema
- Tu auto-memoria de sesiones anteriores — lo que Claude aprendió trabajando contigo

Si no tienes nada de esto configurado, Claude funciona igual — solo que sin contexto previo de tu proyecto. Lo configurarás en el [siguiente capítulo](/empezar/configuracion/).

## El flujo básico

Claude Code funciona como un chat en tu terminal, pero con acceso directo a tu proyecto:

```
tú: arregla el bug del login que falla con emails con +
claude: [lee el código] [encuentra el bug] [edita el archivo] [ejecuta tests]
        Arreglado. El regex no escapaba el +. He actualizado auth.ts línea 47.
```

No necesitas copiar código ni pegarlo. Claude edita directamente, ejecuta tests, y te confirma. Tú revisas el diff y decides si commitear.

## Comandos esenciales

Estos son los que usarás el 80% del tiempo:

| Comando | Qué hace |
|---|---|
| `/help` | Lista todos los comandos disponibles |
| `/model sonnet` | Cambia a Sonnet (rápido, barato, cubre el 80%+) |
| `/model opus` | Cambia a Opus (razonamiento profundo, más caro) |
| `/model opusplan` | Opus planifica, Sonnet ejecuta (lo mejor de ambos) |
| `/compact` | Limpia el contexto sin perder el hilo (usar a menudo) |
| `/clear` | Borra todo y empieza de cero |
| `/cost` | Cuánto llevas gastado en la sesión |
| `/diff` | Cambios que Claude ha hecho |
| `/btw <pregunta>` | Pregunta lateral sin contaminar el historial |
| `/context` | Visualiza el uso de la ventana de contexto |
| `/export` | Exporta la conversación a markdown, JSON o portapapeles |
| `/doctor` | Diagnóstico de instalación, config, API, hooks y MCP |

### Los 10 power-ups — descubre las mecánicas

Ejecuta `/powerup` para un onboarding gamificado con 10 mecánicas desbloqueables:

| # | Power-up | Qué aprendes |
|---|---|---|
| 1 | Talk to your codebase | `@` files, referencias a líneas |
| 2 | Steer with modes | Shift+Tab, plan mode, auto mode |
| 3 | Undo anything | `/rewind`, Esc-Esc |
| 4 | Run in the background | Tareas en background, `/tasks` |
| 5 | Teach Claude your rules | CLAUDE.md, `/memory` |
| 6 | Extend with tools | MCP, `/mcp` |
| 7 | Automate your workflow | Skills, hooks |
| 8 | Multiply yourself | Sub-agentes, `/agents` |
| 9 | Code from anywhere | Remote Control, `/teleport` |
| 10 | Dial the model | `/model`, `/effort` |

Es la mejor forma de descubrir qué puede hacer Claude Code sin leer documentación.

## /btw — preguntar sin interrumpir

Uno de los comandos más útiles y menos conocidos. Permite tener una conversación lateral con Claude **mientras trabaja en otra cosa**:

```
/btw ¿qué patrón de arquitectura estás usando aquí?
/btw hazme un resumen de los cambios para el PR
/btw explícame esta función para pasársela al equipo
```

| Aspecto | Comportamiento |
|---|---|
| Ejecución | En paralelo, no interrumpe la tarea principal |
| Historial | No contamina — las respuestas desaparecen al cerrar |
| Tools | Read-only, sin acceso a herramientas |
| Contexto | Ve toda la conversación actual |
| Coste | Mínimo — reutiliza el prompt cache del padre |

**El problema que resuelve:** antes, preguntar algo rápido mid-tarea inyectaba la pregunta y respuesta en el historial principal, consumiendo tokens y contaminando el contexto.

## Modos de permisos

Claude Code te pide confirmación antes de ejecutar acciones potencialmente destructivas. Hay tres modos, y puedes ciclar entre ellos con **Shift+Tab**:

| Modo | Cómo funciona | Cuándo usarlo |
|---|---|---|
| **Default** | Te pide permiso para cada acción sensible | Cuando estás aprendiendo o en proyecto importante |
| **Auto Mode** | Un clasificador AI decide qué es seguro; solo te pregunta lo dudoso | Cuando quieres que Claude trabaje más autónomo |
| **Plan Mode** | Claude analiza y planifica pero no ejecuta hasta que apruebes | Cuando quieres revisar la estrategia antes de actuar |

### Auto Mode en detalle

El clasificador usa un pipeline de 2 etapas:
1. **Etapa 1 (64 tokens):** decisión inmediata sí/no sin razonamiento — deja pasar lo claramente seguro
2. **Etapa 2 (4.096 tokens):** solo se activa si la etapa 1 bloquea — razonamiento completo antes del veredicto

Patrones bloqueados automáticamente: intérpretes (python, node), shells (bash, ssh), herramientas de red (curl, wget), operaciones git destructivas, eval/exec/sudo.

Activar: `claude --enable-auto-mode` o Shift+Tab → seleccionar auto.

:::caution[No uses `--dangerously-skip-permissions`]
Existe un flag que aprueba todo automáticamente. No lo uses salvo en entornos desechables (containers, CI). En tu máquina local puede borrar archivos sin preguntar.
:::

## Mapa de situaciones — qué hacer y cuándo

### Al arrancar

| Situación | Acción |
|---|---|
| Proyecto nuevo, primera vez | Lee el CLAUDE.md. Si no existe, `/init` para crear uno |
| Proyecto conocido, sesión nueva | Claude ya lee auto-memory. Si el contexto parece desfasado, `/dream` |
| Retomar trabajo de ayer | `/memory` para ver qué recuerda. Si falta algo, díselo directamente |
| Múltiples proyectos en el día | `/clear` entre proyectos. No arrastrar contexto de uno a otro |

### Durante el trabajo

| Situación | Acción |
|---|---|
| Tarea simple y directa | Pídela directamente, sin ceremonia |
| Tarea compleja, múltiples archivos | Deja que Claude proponga plan primero (Shift+Tab → plan mode) |
| Necesitas explorar código | Deja que use subagentes Explore — no guíes manualmente |
| Preguntar algo sin interrumpir | `/btw` — conversación lateral read-only |
| Claude lento o se repite | `/compact` — señal de degradación de contexto |
| Terminaste un hito (commit, feature) | `/compact` para limpiar antes del siguiente |
| Cambias de tarea en la misma sesión | `/clear` si son no relacionadas, `/compact` si son del mismo proyecto |
| Debugging largo sin resolver | `/compact` después de approach fallido, ANTES de intentar otro |

### Memoria

| Situación | Acción |
|---|---|
| Claude olvida algo entre sesiones | `/memory` → verificar qué tiene guardado. Si falta, *"recuerda que X"* |
| Memorias desordenadas o infladas | `/dream` — AutoDream limpia, compacta y reorganiza |
| Quieres que recuerde una preferencia | Díselo: *"recuerda que siempre usamos pnpm"* |
| Quieres ver qué recuerda de ti | `/memory` → muestra todos los archivos de memoria |

### Reglas de oro

| Duda | Respuesta |
|---|---|
| ¿`/compact` o `/clear`? | `/compact` = "sigo con lo mismo pero limpio". `/clear` = "empiezo otra cosa" |
| ¿Info para esta sesión o para siempre? | Esta sesión → dilo en el chat. Siempre → *"recuerda que..."* o `~/.claude/CLAUDE.md` |

## Recuperar sesiones

Si cierras la terminal por accidente o quieres retomar donde lo dejaste:

```bash
# Retomar la sesión más reciente
claude -c

# Ver todas tus sesiones y elegir una
claude -r
```

La sesión recupera el historial y el contexto de donde lo dejaste.

## Remote Control — continuar desde el móvil

Remote Control conecta tu sesión local de Claude Code con claude.ai/code o la app móvil. La sesión sigue ejecutándose en tu máquina — el navegador/móvil es solo una ventana.

```bash
# Iniciar Remote Control
claude remote-control

# O dentro de una sesión existente:
/remote-control   # o /rc (alias)
```

| Aspecto | Remote Control | Claude Code on the Web |
|---|---|---|
| Dónde ejecuta | Tu máquina local | Cloud de Anthropic |
| MCP servers locales | Sí, disponibles | No |
| Filesystem local | Sí, acceso completo | No (cloud) |
| Caso de uso | Continuar trabajo local desde otro dispositivo | Lanzar tareas sin setup local |

**Requisitos:** plan Max, autenticado via `/login`. Tip: usa `/rename` antes de `/rc` para dar nombre descriptivo a la sesión.

:::tip[Remote Control para todas las sesiones]
`/config` → "Enable Remote Control for all sessions" → `true`. Ya no necesitas activarlo manualmente cada vez.
:::

## Flags CLI importantes

```bash
# Ejecutar con prompt único (modo headless, sin interacción)
claude -p "Refactoriza el módulo de auth para usar JWT"

# Output JSON para consumo programático
claude -p "Describe la arquitectura" --output-format json

# Restringir herramientas disponibles
claude -p "Arregla el bug #123" --allowedTools Bash,Read,Write,Edit

# Especificar modelo
claude -p "Genera tests" --model claude-sonnet-4-6

# Continuar última sesión
claude -c

# Elegir sesión a retomar
claude -r
```

## Tips para tu primera semana

1. **Empieza con tareas pequeñas.** No le pidas que refactorice el proyecto entero el primer día. Pídele arreglar un bug, escribir un test, o explicar una función.

2. **Lee lo que hace.** Claude te muestra cada archivo que lee, edita o comando que ejecuta. Revisa las primeras veces para generar confianza.

3. **Usa Sonnet para el día a día.** `/model sonnet` es más rápido y más barato. Cambia a Opus solo cuando la tarea lo requiera (arquitectura, debugging profundo).

4. **Haz `/compact` a menudo.** No esperes a que Claude se degrade. Después de cada hito (commit, feature, fix), compacta. La regla: si Claude empieza a repetirse o a olvidar cosas, ya llegaste tarde.

5. **Prueba `/btw` cuando tengas dudas.** No interrumpas el flujo principal para preguntar algo rápido. `/btw` es gratis y no contamina.

6. **Configura CLAUDE.md.** Es lo que más mejora la experiencia — Claude deja de adivinar y empieza a saber cómo trabajar en tu proyecto.

7. **Usa `/powerup` para descubrir.** Los 10 power-ups cubren el 90% de lo que necesitas saber en tu primera semana.

8. **Prueba Auto Mode cuando confíes.** Shift+Tab → auto. Claude trabaja más rápido si no tiene que pedirte permiso para cada `ls`.

## Siguiente paso

La diferencia entre un Claude Code que adivina y uno que sabe es el **CLAUDE.md**. Configúralo y toda la experiencia mejora.

[Configura tu proyecto con CLAUDE.md →](/empezar/configuracion/)
