---
title: "API y Agent SDK: más allá del CLI"
description: "Construir agentes programáticos con Python, el Advisor tool multi-modelo, y Advanced Tool Use."
sidebar:
  order: 1
---

Claude Code (CLI) es para tu trabajo directo — tú en la terminal, interactuando. El **Agent SDK** es para cuando quieres que Claude trabaje **dentro de tu aplicación**, sin que el usuario toque la terminal.

## Cuándo necesitas ir más allá del CLI

| Herramienta | Para quién | Cuándo |
|---|---|---|
| **Claude Code CLI** | Tú trabajando en tu proyecto | Día a día, desarrollo, debugging |
| **Agent SDK (Python)** | Developers que construyen productos | Tu app necesita un agente integrado |
| **Messages API directa** | Control total | El SDK no cubre tu caso específico |

## Agent SDK básico — tu primer agente Python

SDK oficial (`claude-agent-sdk`, publicado por Anthropic). Requiere Python 3.10+.

```bash
pip install claude-agent-sdk
```

### Patrón 1: Query simple (streaming async)

```python
import asyncio
from claude_agent_sdk import AssistantMessage, TextBlock, query

async def main():
    async for message in query(prompt="¿Qué es 2 + 2?"):
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, TextBlock):
                    print(f"Claude: {block.text}")

asyncio.run(main())
```

**Tipos de mensaje:** `AssistantMessage` (respuesta), `UserMessage` (input), `SystemMessage` (interno), `ResultMessage` (stats: `session_id`, `duration_ms`, `total_cost_usd`, `usage`).

### Patrón 2: Custom tools con decorador @tool

```python
from claude_agent_sdk import tool

@tool("get_weather", "Get weather for a city", {"city": str})
async def get_weather(args):
    data = await fetch_weather(args["city"])
    return {"content": [{"type": "text", "text": json.dumps(data)}]}
```

Formato de retorno siempre: `{"content": [{"type": "text", "text": "..."}]}` (compatible MCP).

### Patrón 3: Agente completo con MCP servers

```python
from claude_agent_sdk import ClaudeAgentOptions, create_sdk_mcp_server
from claude_agent_sdk.client import ClaudeSDKClient

# Registrar tools custom como MCP server
custom_tools = create_sdk_mcp_server(
    name="tools", version="1.0.0",
    tools=[get_weather, get_time],
)

options = ClaudeAgentOptions(
    mcp_servers={
        "tools": custom_tools,
        "Playwright": {
            "command": "npx",
            "args": ["-y", "@playwright/mcp@latest"],
        },
    },
    permission_mode="bypassPermissions",
    allowed_tools=["Read", "Write", "Bash",
                    "mcp__tools__get_weather",
                    "mcp__tools__get_time"],
)

async with ClaudeSDKClient(options=options) as client:
    await client.query("¿Qué tiempo hace en Madrid?")
    async for msg in client.receive_response():
        display_message(msg)
```

**Naming de tools MCP:** `mcp__<servidor>__<herramienta>` (ej: `mcp__tools__get_weather`).

## Agent SDK avanzado

### Tool Registry — registro centralizado

En vez de tools dispersas, un registry que expone `get_tools()` y `get_tool_names()`:

```python
# tools/registry.py
ALL_TOOLS = [greet, get_weather, get_time]
TOOL_NAMES = ["mcp__tools__greet", "mcp__tools__get_weather", ...]

def get_tools(): return ALL_TOOLS
def get_tool_names(): return TOOL_NAMES
```

Añadir una tool nueva = crearla + registrarla. No hay que tocar el agente.

### Hooks programáticos (PostToolUse)

```python
from claude_agent_sdk import HookContext, HookInput, HookJSONOutput, HookMatcher

async def post_tool_hook(hook_input, _tool_use_id, _context):
    if hook_input.get("tool_name") == "TodoWrite":
        todos = hook_input.get("tool_input", {}).get("todos", [])
        # Procesar todos...
    return {"continue_": True}

hooks = {
    "PostToolUse": [
        HookMatcher(matcher=None, hooks=[post_tool_hook])  # None = todas
    ]
}
```

### Multi-agente: Claude + otros modelos

Interfaz común para diferentes providers:

```python
# Ambos agentes comparten: initialize(), close(), stream(query), run(query)
from agents.claude_agent import create_agent
from agents.gemini_agent import create_gemini_agent
```

## Advisor tool — estrategia multi-modelo server-side

Feature de la Messages API que parea un **executor económico** (Sonnet/Haiku) con un **advisor de alta capacidad** (Opus) en una sola llamada. El executor corre la tarea end-to-end; cuando tropieza con una decisión difícil, invoca al advisor. Todo server-side, sin round-trips extra.

**Invierte el orchestrator pattern clásico:**

| Patrón clásico | Advisor strategy |
|---|---|
| Modelo grande decompone y delega a workers | Modelo pequeño corre y escala al grande solo cuando necesita |
| Tokens del grande en cada turno | Tokens del grande solo en sub-inferencias puntuales |
| Gestionas el hand-off tú | Server-side, un único request |

### API shape

```python
response = client.beta.messages.create(
    model="claude-sonnet-4-6",         # executor
    max_tokens=4096,
    betas=["advisor-tool-2026-03-01"],
    tools=[{
        "type": "advisor_20260301",
        "name": "advisor",
        "model": "claude-opus-4-6",    # advisor
    }],
    messages=[{"role": "user", "content": "Build a worker pool in Go..."}],
)
```

### Matriz de compatibilidad

| Executor | Advisor |
|---|---|
| Haiku 4.5 | Opus 4.6 |
| Sonnet 4.6 | Opus 4.6 |
| Opus 4.6 | Opus 4.6 |

Pair inválido → `400 invalid_request_error`.

### Benchmarks

| Configuración | Resultado |
|---|---|
| Sonnet + Opus advisor | **+2.7pp SWE-bench Multilingual, –11.9% coste** |
| Haiku + Opus advisor | **41.2% BrowseComp** vs 19.7% Haiku solo |
| Haiku + Opus advisor | **–85% coste** vs Sonnet solo, intelligence comparable |

Output del advisor: 400-700 text tokens (1.400-1.800 incluyendo thinking).

### Billing

```json
"usage": {
  "iterations": [
    {"type": "message", "input_tokens": 412, "output_tokens": 89},
    {"type": "advisor_message", "model": "claude-opus-4-6",
     "input_tokens": 823, "output_tokens": 1612},
    {"type": "message", "input_tokens": 1348, "output_tokens": 442}
  ]
}
```

`message` → tarifa executor. `advisor_message` → tarifa advisor. **`max_tokens` NO limita al advisor** — solo al executor.

### System prompt recomendado (oficial, coding tasks)

```
Call advisor BEFORE substantive work — before writing, before committing
to an interpretation. Orientation (finding files, fetching) is NOT
substantive work.

Also call advisor:
- When you believe the task is complete (BEFORE this, make deliverable durable)
- When stuck — errors recurring, approach not converging
- When considering a change of approach
```

**Trimming del output (–35 a –45% tokens):**
```
The advisor should respond in under 100 words and use enumerated steps,
not explanations.
```

### Limitaciones

- No streaming del advisor (pausa en el stream del executor)
- No cap conversation-level built-in (contar client-side)
- Rate limits independientes por modelo
- Priority Tier per-model (advisor necesita su propio Tier)

## Advanced Tool Use — 4 patrones de optimización

Con 5 MCPs típicos, las definiciones consumen ~55K tokens antes de empezar. Estas 4 features atacan ese problema:

| Feature | Problema que resuelve | Reducción tokens | Mejora precisión |
|---|---|---|---|
| **PTC** | Ida y vuelta JSON por cada call | 37% típico, hasta 98% | +3pp retrieval |
| **Dynamic Filtering** | HTML basura en contexto (web search) | 24% input | +11% general |
| **Tool Search** | Cargar TODOS los schemas | 85% definición | 49% → 74% (Opus) |
| **Input Examples** | Parámetros complejos mal formateados | ~20-200 tokens/ejemplo | 72% → 90% |

### PTC — Programmatic Tool Calling

Claude escribe Python en sandbox en vez de generar JSON. Usa `asyncio.gather` para paralelizar, bucles para iterar. Resultados intermedios NO entran en contexto.

```python
tools=[
    {"type": "code_execution_20260120", "name": "code_execution"},
    {
        "name": "query_database",
        "allowed_callers": ["code_execution_20260120"],  # Solo callable desde código
        ...
    },
]
```

### Tool Search — carga diferida

Con `defer_loading`, las tools no se cargan hasta que se buscan. Soporta hasta 10.000 herramientas.

### Guía de selección

| Necesitas... | Usa |
|---|---|
| Reducir tokens en calls multi-paso | PTC |
| Limpiar HTML de web search | Dynamic Filtering (se activa solo) |
| Muchas herramientas (>50) | Tool Search |
| Mejorar precisión en params complejos | Input Examples |

:::caution[Incompatibilidad]
Tool Search e Input Examples son **mutuamente excluyentes**. El resto son compatibles entre sí.
:::

## Vercel AI SDK v5 — para TypeScript

Framework TypeScript para apps AI con soporte Claude vía `@ai-sdk/anthropic`:

```typescript
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

const result = await streamText({
  model: anthropic('claude-sonnet-4-6'),
  messages: convertToModelMessages(uiMessages),
  stopWhen: stepCountIs(5),
});
```

Cambios v4 → v5: `Message` → `UIMessage`, `parameters` → `inputSchema`, `maxSteps` → `stopWhen`, Data Stream → SSE. Migración automática: `npx @ai-sdk/codemod upgrade`.

## Siguiente paso

Ya sabes cómo construir agentes programáticos y optimizar con Advisor tool. El último paso es **llevarlos a producción** con infraestructura gestionada.

[Managed Agents: deploy a producción →](/produccion/managed-agents/)
