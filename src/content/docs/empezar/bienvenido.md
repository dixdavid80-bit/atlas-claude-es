---
title: Bienvenido al Atlas
description: Qué es Claude, cómo encajan sus productos, qué puede hacer Claude Code, y cómo navegar esta guía.
sidebar:
  order: 1
---

## Qué es Claude

Claude es la familia de modelos de inteligencia artificial de Anthropic. Hay varias formas de interactuar con él, cada una pensada para un contexto distinto:

| Producto | Para quién | Qué hace |
|---|---|---|
| **Claude.ai (Cowork)** | Cualquiera | Chat web con artefactos, plugins, scheduled tasks, Computer Use. El producto consumer/prosumer |
| **Claude Code** | Desarrolladores y profesionales técnicos | CLI que trabaja directamente en tu proyecto — lee archivos, ejecuta comandos, escribe código, gestiona git. Es un **agente**, no un chatbot |
| **Claude API** | Developers que construyen productos | API REST para integrar Claude en tus aplicaciones. Messages API + server tools |
| **Agent SDK** | Developers de agentes programáticos | SDK Python para construir agentes que usan las mismas capacidades de Claude Code |
| **Managed Agents** | Equipos que despliegan agentes en producción | Infraestructura gestionada por Anthropic — sandbox, credenciales, checkpointing, tracing |

**Este Atlas cubre todo el ecosistema técnico**, con foco principal en Claude Code y las capas que lo rodean (hooks, skills, MCP, agentes, API, producción).

## Cómo encaja todo — el mapa del ecosistema

```
                         ┌─────────────────────┐
                         │     MODELOS          │
                         │  Opus · Sonnet · Haiku│
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
             ┌──────▼──────┐ ┌─────▼──────┐ ┌──────▼──────┐
             │  Claude.ai  │ │ Claude Code│ │  Claude API │
             │  (Cowork)   │ │   (CLI)    │ │ (Messages)  │
             └─────────────┘ └─────┬──────┘ └──────┬──────┘
                                   │               │
                          ┌────────┼────────┐      │
                          │        │        │      │
                     ┌────▼──┐ ┌──▼───┐ ┌──▼──┐  │
                     │ Hooks │ │Skills│ │ MCP │  │
                     └───────┘ └──────┘ └─────┘  │
                                                  │
                                    ┌─────────────┼──────────────┐
                                    │             │              │
                              ┌─────▼─────┐ ┌────▼─────┐ ┌─────▼──────┐
                              │ Agent SDK │ │ Advisor  │ │  Advanced  │
                              │ (Python)  │ │  tool    │ │  Tool Use  │
                              └─────┬─────┘ └──────────┘ └────────────┘
                                    │
                              ┌─────▼──────────┐
                              │ Managed Agents │
                              │ (producción)   │
                              └────────────────┘
```

**Lectura del mapa:**
- **Los modelos** (Opus, Sonnet, Haiku) son la base — todo lo demás son interfaces para interactuar con ellos
- **Claude Code** es la interfaz para developers — hooks, skills y MCP son sus mecanismos de extensión
- **La API** es la interfaz para apps — Agent SDK, Advisor tool y Advanced Tool Use son sus herramientas de optimización
- **Managed Agents** es la capa de producción — infraestructura gestionada para desplegar agentes a escala

## Qué es Claude Code

Claude Code es una herramienta de línea de comandos (CLI) que convierte a Claude en tu compañero de desarrollo. No es un chatbot — es un **agente que trabaja dentro de tu proyecto**:

- **Lee y entiende tu código** — navega el codebase, busca con Grep y Glob, lee archivos con contexto
- **Ejecuta comandos** en tu terminal — tests, builds, scripts, git
- **Edita archivos con precisión** — no genera bloques para copiar, edita directamente
- **Gestiona git** — commits, branches, PRs, diffs
- **Se conecta con servicios externos** via MCP — GitHub, bases de datos, Slack, Google Drive
- **Se automatiza** con hooks (enforcement determinístico), skills (workflows encapsulados) y agentes (sub-tareas paralelas)
- **Trabaja de forma autónoma** — Auto Mode, /loop, Monitor tool, harness engineering para sesiones largas

Lo instalas, lo apuntas a tu proyecto, y trabaja contigo. No necesitas copiar y pegar código de un chat — Claude Code edita directamente tus archivos.

### Lo que Claude Code tiene dentro

| Categoría | Cantidad | Ejemplos |
|---|---|---|
| **Herramientas built-in** | 45 en 9 categorías | Read, Write, Edit, Bash, Grep, Glob, WebSearch, Agent, CronCreate... |
| **Agentes built-in** | 6 tipos | General-purpose, Explore (Haiku), Plan, Verification, Claude Code Guide, Status Line Setup |
| **Comandos de barra** | ~100 | `/model`, `/compact`, `/loop`, `/btw`, `/ultraplan`, `/powerup`, `/review`... |
| **Skills built-in** | 17 | `/simplify`, `/batch`, `/loop`, `/schedule`, `/claude-api`, `/insights`... |

### Estructura de proyecto de Claude Code

Cuando configuras Claude Code en un proyecto, esta es la estructura que emerge:

```
tu-proyecto/
├── CLAUDE.md              → Instrucciones compartidas del proyecto (committed)
├── CLAUDE.local.md        → Instrucciones personales (.gitignored)
└── .claude/
    ├── settings.json      → Permisos + config (committed)
    ├── settings.local.json → Permisos personales (.gitignored)
    ├── commands/           → Slash commands custom (/project:review)
    ├── rules/              → Reglas modulares por tema (code-style.md, testing.md)
    ├── skills/             → Workflows auto-invocados (security-review/, deploy/)
    └── agents/             → Sub-agentes aislados (code-reviewer.md, security-auditor.md)
```

Cada carpeta tiene su propio capítulo en este Atlas. No necesitas montar todo desde el día 1 — empieza con `CLAUDE.md` y ve añadiendo conforme necesites.

## Computer Use — Claude controla tu escritorio

Desde marzo 2026 (research preview), Claude puede **controlar el escritorio del Mac**: ver la pantalla, mover el ratón, hacer clic, escribir texto, navegar aplicaciones. No es un producto separado — es una capacidad integrada en Claude Desktop y Claude Code.

**Jerarquía de ejecución (3 niveles, siempre prioriza la vía más fiable):**
1. **Conectores directos** (Gmail, Slack, Drive) → API directa, más rápido
2. **Navegador** → cuando no hay conector, navega la interfaz web
3. **Control de pantalla** → último recurso, interpreta UI pixel a pixel

**Dispatch desde móvil:** puedes asignar tareas desde iPhone que se ejecutan en tu Mac (escanear QR desde la app).

**Diferenciador clave:** Claude es el único agente que controla el desktop completo + tiene Dispatch desde móvil. OpenAI Operator y Google Mariner solo operan dentro del navegador.

:::caution[Limitaciones actuales]
Solo macOS, rate limits agresivos en plan Max, research preview. Windows confirmado como siguiente plataforma.
:::

## Planes disponibles

| Plan | Precio aprox. | Lo relevante para Claude Code |
|---|---|---|
| **Free** | $0 | Acceso básico a Claude.ai. Sin Claude Code |
| **Pro** | $20/mes | Claude Code con límites. Sonnet + Opus con restricciones de uso |
| **Max** | $100-200/mes | Claude Code prácticamente ilimitado. 2 tiers. Opus 1M sin config extra |
| **Team** | $30/mes/usuario | Workspace compartido, admin console, datos NO para entrenamiento |
| **Enterprise** | Custom | SSO SAML, SCIM, 500K context, audit logs, soporte dedicado |

Para seguir este Atlas necesitas al menos **plan Pro** (para Claude Code). Max es la opción óptima si vas a trabajar intensivamente.

## Modelos disponibles (abril 2026)

| Modelo | Uso principal | Contexto | Coste relativo |
|---|---|---|---|
| **Claude Opus 4.6** | Razonamiento complejo, arquitectura, decisiones difíciles | 1M tokens | Alto |
| **Claude Sonnet 4.6** | Trabajo diario, edición, tareas estándar. **El caballo de batalla** | 1M tokens | Medio |
| **Claude Haiku 4.5** | Tareas rápidas y simples, subagentes de exploración | 200K tokens | Bajo |

En Claude Code puedes cambiar de modelo en cualquier momento con `/model`. **Regla del 80/20:** Sonnet para el día a día, Opus cuando la tarea lo justifique. Más detalle en [Modelos y coste](/escalar/modelos-y-coste/).

:::tip[Modo híbrido: opusplan]
`/model opusplan` usa Opus para planificar y Sonnet para ejecutar — razonamiento superior donde importa, eficiencia donde no.
:::

## Para quién es este Atlas

| Perfil | Dónde empezar |
|---|---|
| **Empiezo desde cero con Claude Code** | Sigue el camino guiado desde el [siguiente capítulo](/empezar/primer-proyecto/) |
| **Ya uso Claude Code, quiero profundizar** | Navega directamente al tema en la barra lateral |
| **Evalúo Claude Code para mi equipo** | [Agentes](/escalar/agentes/) y [Managed Agents](/produccion/managed-agents/) |
| **Quiero construir agentes programáticos** | [API y Agent SDK](/produccion/api-agent-sdk/) |
| **Quiero optimizar coste/rendimiento** | [Modelos y coste](/escalar/modelos-y-coste/) |

## Qué NO es este Atlas

- **No es una traducción de docs oficiales** — es una obra de referencia independiente con criterio propio, destilada de 100+ notas verificadas
- **No es un tutorial de programación** — asumimos que sabes lo básico de terminal y git
- **No cubre Claude.ai (web) en profundidad** — el foco es el ecosistema técnico
- **No es estático** — se actualiza continuamente con las novedades del ecosistema

## Documentación oficial — cómo acceder rápido

Si necesitas consultar los docs oficiales de Claude Code directamente:

- **Mapa de docs:** `https://code.claude.com/docs/en/claude_code_docs_map`
- **Versión Markdown** (para cargar como contexto): `https://code.claude.com/docs/en/claude_code_docs_map.md`
- **Índice llms.txt:** `https://code.claude.com/docs/llms.txt`

:::tip[Truco]
Copia el contenido de la URL `.md` y pégalo en Claude Code como contexto. Claude tiene el mapa completo de docs y navega directamente a la página que necesites.
:::

## Siguiente paso

[Tu primer proyecto con Claude Code →](/empezar/primer-proyecto/)
