---
title: Tu primer proyecto con Claude Code
description: Instalar Claude Code, arrancar tu primera sesión y entender el flujo de trabajo básico.
sidebar:
  order: 2
---

## Instalación

```bash
npm install -g @anthropic-ai/claude-code
```

Requisitos: Node.js 18+ y una cuenta de Anthropic (Free, Pro, Max o Team).

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
- El `CLAUDE.md` de tu proyecto (si existe)
- Tu memoria personal (`~/.claude/CLAUDE.md`)
- Las reglas del proyecto (`.claude/rules/`)
- Tu auto-memoria de sesiones anteriores

## El flujo básico

Claude Code funciona como un chat en tu terminal, pero con acceso directo a tu proyecto:

```
tú: arregla el bug del login que falla con emails con +
claude: [lee el código] [encuentra el bug] [edita el archivo] [ejecuta tests]
        Arreglado. El regex no escapaba el +. He actualizado auth.ts línea 47.
```

No necesitas copiar código ni pegarlo. Claude edita directamente, ejecuta tests, y te confirma.

## Comandos esenciales

Estos son los que usarás el 80% del tiempo:

| Comando | Qué hace |
|---|---|
| `/help` | Lista todos los comandos disponibles |
| `/model sonnet` | Cambia a Sonnet (más rápido, más barato) |
| `/model opus` | Cambia a Opus (razonamiento profundo) |
| `/compact` | Limpia el contexto sin perder el hilo |
| `/clear` | Borra todo y empieza de cero |
| `/cost` | Muestra cuánto llevas gastado en la sesión |
| `/diff` | Muestra los cambios que Claude ha hecho |

:::tip[Descubre más comandos]
Ejecuta `/powerup` para desbloquear 10 mecánicas de Claude Code de forma interactiva. Es la mejor forma de aprender qué puede hacer.
:::

## Mapa de situaciones — qué hacer y cuándo

| Situación | Acción |
|---|---|
| Tarea simple y directa | Pídela directamente, sin ceremonia |
| Tarea compleja con múltiples archivos | Deja que Claude proponga un plan primero (Shift+Tab para plan mode) |
| Quieres preguntar algo sin interrumpir | `/btw` — conversación lateral que no contamina el historial |
| Claude se repite o va lento | `/compact` — señal de que el contexto está degradado |
| Terminaste un bloque de trabajo | `/compact` antes de empezar el siguiente |
| Cambias de tarea completamente | `/clear` y empieza de cero |

## Modos de permisos

Claude Code te pide confirmación antes de ejecutar acciones potencialmente destructivas. Hay tres modos:

| Modo | Cómo funciona | Cuándo usarlo |
|---|---|---|
| **Default** | Te pide permiso para cada acción sensible | Cuando estás aprendiendo o en proyecto importante |
| **Auto Mode** (Shift+Tab) | Un clasificador AI decide qué es seguro; solo te pregunta lo dudoso | Cuando quieres que Claude trabaje más autónomo |
| **Plan Mode** (Shift+Tab) | Claude analiza y planifica pero no ejecuta hasta que apruebes | Cuando quieres revisar la estrategia antes de actuar |

:::caution[No uses `--dangerously-skip-permissions`]
Existe un flag que aprueba todo automáticamente. No lo uses salvo en entornos desechables (containers, CI). En tu máquina local puede borrar archivos sin preguntar.
:::

## Recuperar el trabajo

Si cierras la terminal por accidente o quieres retomar donde lo dejaste:

```bash
# Retomar la sesión más reciente
claude -c

# Ver todas tus sesiones y elegir una
claude -r
```

## Tips para tu primera semana

1. **Empieza con tareas pequeñas.** No le pidas que refactorice el proyecto entero el primer día. Pídele arreglar un bug, escribir un test, o explicar una función.
2. **Lee lo que hace.** Claude te muestra cada archivo que lee, edita o comando que ejecuta. Revisa las primeras veces.
3. **Usa Sonnet para el día a día.** `/model sonnet` es más rápido y más barato. Cambia a Opus cuando la tarea lo requiera.
4. **Haz `/compact` a menudo.** No esperes a que Claude se degrade. Después de cada hito (commit, feature, fix), compacta.
5. **Configura un CLAUDE.md.** Es lo que más mejora la experiencia — [siguiente capítulo](/empezar/configuracion/).

## Siguiente paso

[Configura tu proyecto con CLAUDE.md →](/empezar/configuracion/)
