---
title: "MCP: conectar Claude con el mundo exterior"
description: "Model Context Protocol — el estándar abierto que permite a Claude hablar con GitHub, bases de datos, Slack, Google Drive y cientos de servicios más."
sidebar:
  order: 1
---

MCP (Model Context Protocol) es un protocolo abierto creado por Anthropic que estandariza cómo Claude se conecta con herramientas y datos externos. La analogía más directa: **es el "USB-C para IA"** — una interfaz universal que reemplaza integraciones ad-hoc.

Sin MCP, Claude solo trabaja con lo que tiene en tu máquina local (archivos, terminal, git). Con MCP, Claude puede hablar con GitHub, Slack, bases de datos, Google Drive y cientos de servicios más — directamente desde tu sesión.

## La diferencia con y sin MCP

| Sin MCP | Con MCP |
|---|---|
| Claude lee tu código local | Claude lee tu código + abre PRs en GitHub directamente |
| Tú copias datos de la BD y los pegas | Claude consulta la BD por sí mismo |
| Tú buscas en Google Drive y compartes el link | Claude lee tus docs de Drive como contexto |
| Tú copias mensajes de Slack | Claude lee y responde en canales de Slack |

## Arquitectura — cómo funciona por dentro

MCP tiene tres capas. No necesitas entenderlas para usarlo, pero sí para crear tus propios servidores:

| Componente | Rol | Ejemplo |
|---|---|---|
| **Host** | La app que ejecutas | Claude Code, Claude Desktop, VS Code |
| **Client** | Instancia dentro del host que mantiene conexión 1:1 con un server | Cada servidor MCP tiene su propio client |
| **Server** | Proceso ligero que expone capacidades | MCP de GitHub, MCP de Postgres |

**Flujo:** Host → Client → Server → Servicio externo (GitHub, BD, Slack...)

El protocolo se inspira en LSP (Language Server Protocol) — la misma idea que conecta editores de código con servidores de lenguaje, pero aplicada a modelos de IA.

### Las 5 primitivas del protocolo

Lo que un servidor MCP puede exponer:

| Primitiva | Quién controla | Qué hace |
|---|---|---|
| **Tools** | El modelo decide cuándo usar | Funciones invocables — ejecutar query SQL, crear issue en GitHub, enviar mensaje en Slack. **Es la primitiva más usada.** |
| **Resources** | La app/usuario controla | Datos que el server expone — schema de BD, contenido de un archivo, configuración |
| **Prompts** | El usuario invoca | Templates de prompts para tareas específicas |
| **Sampling** | El server solicita | El server pide al client que haga una llamada al LLM (permite agentes recursivos) |
| **Elicitation** | El server solicita | El server pide información al usuario (formularios, confirmaciones) |

En la práctica, el 90% del uso es **Tools**. Cuando instalas un MCP de GitHub, lo que obtienes son tools como `create_issue`, `create_pull_request`, `search_repos` que Claude puede invocar.

### Transportes — cómo se comunican

| Transporte | Cuándo | Cómo funciona |
|---|---|---|
| **stdio** | Servers locales (el más común en Claude Code) | El host lanza el server como proceso hijo. Comunicación por stdin/stdout |
| **Streamable HTTP** | Servers remotos (recomendado) | Endpoint HTTP con streaming bidireccional |
| **SSE** | Servers remotos (legacy) | HTTP unidireccional. **Deprecado** — migrar a Streamable HTTP |
| **WebSocket** | Servers que necesitan conexión persistente | Protocolo `["mcp"]`, soporta Bun y Node.js |

Para la mayoría de usos con Claude Code, stdio es suficiente (servers que corren en tu máquina).

## Tu primer MCP en 5 minutos

Vamos a instalar el MCP de GitHub — el más útil para empezar:

**Paso 1 — Prepara un token de GitHub:**

Ve a [github.com/settings/tokens](https://github.com/settings/tokens) → Generate new token (classic) → Selecciona scopes `repo` y `read:org` → Copia el token.

**Paso 2 — Añade la variable de entorno:**

```bash
# Añade a tu ~/.zshrc o ~/.bashrc
export GITHUB_TOKEN="ghp_tu_token_aqui"
source ~/.zshrc
```

**Paso 3 — Instala el MCP en Claude Code:**

```bash
claude mcp add --scope user github -- npx -y @modelcontextprotocol/server-github
```

**Paso 4 — Verifica:**

```bash
# Dentro de Claude Code:
/mcp
# Deberías ver "github" en la lista con status "connected"
```

**Paso 5 — Úsalo:**

```
tú: abre un issue en mi repo atlas-claude-es con título "Completar capítulo MCP"
claude: [usa mcp__github__create_issue] Issue #1 creado: "Completar capítulo MCP"
```

Ya está. Claude tiene acceso directo a tu GitHub sin salir de la terminal.

## Los 13 servidores oficiales

Mantenidos por Anthropic en `github.com/modelcontextprotocol/servers`:

| Server | Qué hace | Instalación |
|---|---|---|
| **Filesystem** | Lee/escribe archivos, busca, crea directorios | `@modelcontextprotocol/server-filesystem` |
| **GitHub** | Repos, issues, PRs, branches, búsqueda | `@modelcontextprotocol/server-github` |
| **Git** | Log, diff, status, commits | `@modelcontextprotocol/server-git` |
| **Postgres** | Queries SQL solo lectura, inspección de schema | `@modelcontextprotocol/server-postgres` |
| **Slack** | Canales, mensajes, usuarios, hilos | `@modelcontextprotocol/server-slack` |
| **Google Drive** | Buscar y leer archivos de Drive | `@modelcontextprotocol/server-gdrive` |
| **Puppeteer** | Automatización de navegador, screenshots | `@modelcontextprotocol/server-puppeteer` |
| **Brave Search** | Búsqueda web via API de Brave | `@modelcontextprotocol/server-brave-search` |
| **Google Maps** | Geocoding, direcciones, lugares | `@modelcontextprotocol/server-google-maps` |
| **Memory** | Knowledge graph persistente | `@modelcontextprotocol/server-memory` |
| **Fetch** | Contenido web convertido a markdown | `@modelcontextprotocol/server-fetch` |
| **Sequential Thinking** | Razonamiento paso a paso con revisión | `@modelcontextprotocol/server-sequential-thinking` |
| **Everything** | Server de prueba con todas las primitivas | `@modelcontextprotocol/server-everything` |

:::tip[Los 4 más útiles para empezar]
**GitHub** (gestión de repos), **Postgres** (explorar BD), **Google Drive** (leer documentos) y **Puppeteer** (automatizar navegador). Empieza por el que más te sirva y añade los demás conforme los necesites.
:::

### Dónde encontrar más servidores

Más allá de los oficiales, hay cientos de servidores comunitarios:

- **MCP Registry oficial** — [modelcontextprotocol.io](https://modelcontextprotocol.io) (respaldado por Anthropic, GitHub, Microsoft)
- **Awesome MCP Servers** — lista curada en GitHub con categorías: BDs, APIs, DevOps, productividad, observabilidad
- **Marketplaces** — Smithery, Glama, PulseMCP
- **npm** — buscar `@modelcontextprotocol/` o `mcp-server-`
- **Instalación rápida** — `npx @michaellatman/mcp-get@latest install <nombre>`

## Configuración en Claude Code

### Los 3 scopes de configuración

| Scope | Archivo | Compartido vía git | Cuándo usarlo |
|---|---|---|---|
| **User** (global) | `~/.claude/settings.json` | No | MCPs que usas en todos tus proyectos (GitHub, Slack) |
| **Project** (equipo) | `.claude/settings.json` | Sí | MCPs que todo el equipo necesita (BD del proyecto) |
| **Local** (personal por proyecto) | `.claude/settings.local.json` | No | MCPs que solo tú necesitas en este proyecto |

:::tip[Empieza siempre con scope user]
Para probar un MCP nuevo, usa `--scope user`. Cuando confirmes que es útil para todo el equipo, muévelo a project.
:::

### Ejemplo de configuración en settings.json

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://user:pass@localhost/db"
      }
    }
  }
}
```

### Referencia completa de comandos CLI

```bash
# Añadir server local (stdio)
claude mcp add <nombre> -- <command> [args...]
claude mcp add github -- npx -y @modelcontextprotocol/server-github

# Añadir server remoto (HTTP — recomendado)
claude mcp add --transport http notion https://mcp.notion.com/mcp

# Añadir server remoto (SSE — legacy, preferir HTTP)
claude mcp add --transport sse asana https://mcp.asana.com/sse

# Añadir con scope específico
claude mcp add --scope user github -- npx -y @modelcontextprotocol/server-github
claude mcp add --scope project postgres -- npx -y @modelcontextprotocol/server-postgres

# Añadir desde JSON directo
claude mcp add-json <nombre> '<json>'

# Importar servers de Claude Desktop
claude mcp add-from-claude-desktop

# Gestionar servers
claude mcp list                    # Ver todos los servers activos
claude mcp get <nombre>            # Detalle de un server
claude mcp remove <nombre>         # Eliminar un server
claude mcp reset-project-choices   # Reiniciar aprobaciones

# Claude Code como MCP server (para otros clientes)
claude mcp serve
```

:::caution[Orden de las opciones]
Todas las opciones (`--transport`, `--env`, `--scope`, `--header`) van **antes** del nombre del server. El `--` separa nombre de command/args.
:::

**Dentro de Claude Code:** `/mcp` para verificar estado, autenticar, reconectar y gestionar servers.

## Los 4 patrones de uso más comunes

### Patrón 1: Database-as-context

MCP de Postgres/MySQL expone el schema y permite queries de solo lectura. Claude puede explorar la BD, entender la estructura y escribir queries optimizadas.

**Caso de uso:** estás debuggeando un bug que depende de datos. En vez de escribir queries a mano, le dices a Claude *"busca los usuarios que se registraron ayer y no completaron el onboarding"* y Claude consulta la BD directamente.

### Patrón 2: API wrapper

Un MCP server wrappea una API REST (GitHub, Jira, Slack). Expone operaciones como tools con parámetros tipados. Claude decide cuándo invocar cada operación.

**Caso de uso:** le dices a Claude *"crea un PR con estos cambios y asígnalo a María"* y Claude usa las tools de GitHub para crear el PR, añadir reviewers y etiquetar.

### Patrón 3: Filesystem extendido

MCPs que dan acceso a Google Drive, S3, Notion. Claude puede leer documentos y usarlos como contexto.

**Caso de uso:** tienes las specs del proyecto en Google Drive. En vez de copiarlas al chat, Claude las lee directamente con el MCP de Drive y trabaja con ellas como contexto.

### Patrón 4: DevOps automation

MCPs para Docker, Kubernetes, AWS. Claude inspecciona estado de infraestructura y ejecuta operaciones.

**Caso de uso:** *"revisa los logs del container de producción de las últimas 2 horas y busca errores 500"*. Claude consulta los logs directamente sin que copies y pegues.

## Seguridad y permisos

### Lo que debes saber

- Los servers MCP se ejecutan **con tus permisos de usuario**
- Claude Code pide aprobación antes de usar tools de un MCP por primera vez en la sesión
- Los servers de proyecto (`.claude/settings.json`) requieren revisión al abrir el proyecto

:::danger[Revisa servers de terceros antes de instalar]
Un MCP server tiene acceso completo a lo que su código haga — no está sandboxeado. Instalar un server malicioso es equivalente a ejecutar un script desconocido con tus permisos.
:::

### Buenas prácticas

1. **No hardcodear secrets** — usa `${VARIABLE}` en la config de env
2. **Revisa el código** de servers de terceros antes de instalar
3. **Scope mínimo** — `--scope project` solo para lo que todo el equipo necesita
4. **MCP servers remotos** — autenticación vía OAuth 2.1

### Los 6 scopes reales internos

Internamente Claude Code tiene más scopes de los que la documentación oficial muestra:

| # | Scope | Fuente | Prioridad |
|---|---|---|---|
| 1 | claudeai | API fetch (conectores claude.ai) | Menor |
| 2 | plugin | Plugins instalados | |
| 3 | user | `~/.claude/settings.json` | |
| 4 | project | `.mcp.json` (recorre hasta home) | |
| 5 | local | `.claude/settings.local.json` | |
| 6 | enterprise | `managed-mcp.json` | **Mayor — si existe, el resto se ignora** |

### Constantes y límites técnicos

| Parámetro | Valor | Impacto |
|---|---|---|
| Timeout de conexión | 30s por servidor | Marcado como failed si no conecta |
| Timeout de herramienta | ~27,8 horas | Efectivamente infinito — si parece colgado, `/mcp reconnect` |
| Max output de herramienta | 100.000 chars | Si supera → archivo temporal, modelo usa Read |
| Max descripción de tool | 2.048 chars | Límite para la description de cada herramienta |
| Concurrencia local (stdio) | 3 | Conexiones simultáneas |
| Concurrencia remota | 20 | Conexiones simultáneas |
| Auth cache | 15 min | Duración de caché tras fallo auth |

### Tool annotations (para creadores de MCPs)

Si creas tu propio server, puedes anotar tools para que Claude Code las trate correctamente:

| Anotación | Efecto |
|---|---|
| `readOnlyHint` | Puede ejecutarse en paralelo, solo lectura |
| `destructiveHint` | Mayor riesgo en prompts de permiso |
| `openWorldHint` | Accede a sistemas externos |
| `_meta.anthropic/searchHint` | Herramienta diferida (no se carga hasta que se busca) |
| `_meta.anthropic/alwaysLoad` | Omite carga diferida, siempre en contexto |

### Tips prácticos de permisos

- `enableAllProjectMcpServers: true` en settings aprueba todos los servers del proyecto sin prompt individual
- Formato de nombres: `mcp__<servidor>__<herramienta>` (caracteres fuera de `[a-zA-Z0-9_-]` → `_`, máx 64 chars)
- Comodín: `mcp__slack__*` permite todo un servidor sin aprobar tool por tool
- Instrucciones de servidor (2.048 chars) se inyectan en system prompt **cada turno** — minimízalas

### Autenticación

**McpAuthTool:** cuando un servidor falla por auth, Claude Code crea automáticamente `mcp__<servidor>__authenticate`. Al invocarlo inicia OAuth. Tras éxito, las tools reales reemplazan a la pseudo.

**XAA (Cross-App Access):** auth enterprise SSO vía RFC 8693 + RFC 7523. Un solo popup del navegador autentica N servidores MCP (reutiliza id_token). Activar con `CLAUDE_CODE_ENABLE_XAA=1`.

## Clientes MCP — quién más soporta el protocolo

MCP no es solo de Claude. Más de 80 clientes lo soportan:

| Cliente | Features soportadas |
|---|---|
| **Claude Code** | Resources, Prompts, Tools, Roots, Instructions, Discovery |
| **Claude Desktop** | Resources, Prompts, Tools, Apps |
| **Claude.ai** | Resources, Prompts, Tools |
| **VS Code Copilot** | Resources, Prompts, Tools, Discovery, Sampling, Elicitation |
| **Cursor** | Prompts, Tools, Elicitation |
| **ChatGPT** | Tools |
| **Gemini CLI** | Prompts, Tools, Instructions |
| **JetBrains AI** | Tools |

Esto significa que un MCP server que crees funciona en todos estos clientes — no solo en Claude.

## Claude Code como MCP server

Claude Code puede funcionar también como **servidor** para otros clientes:

```bash
claude mcp serve
```

```json
{
  "mcpServers": {
    "claude-code": {
      "type": "stdio",
      "command": "claude",
      "args": ["mcp", "serve"],
      "env": {}
    }
  }
}
```

Esto expone las herramientas nativas de Claude Code (Read, Edit, Bash, etc.) a otros IDEs o aplicaciones.

## Crear tu propio MCP server

### Los 10 SDKs oficiales

| SDK | Lenguaje | Nivel |
|---|---|---|
| **TypeScript** (Tier 1, referencia oficial) | Node.js / TypeScript | El más documentado |
| **Python** | Python 3.10+ | El más usado en data/ML |
| **Java** / **Kotlin** | JVM | Enterprise |
| **C#** | .NET | Enterprise |
| **Go** / **Rust** | Compilados | Performance |
| **Swift** | Apple | iOS/macOS |
| **Ruby** / **PHP** | Web | Backend web |

### Ejemplo completo en TypeScript

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "mi-mcp-server",
  version: "1.0.0"
});

// Definir un tool
server.tool(
  "obtener_clima",
  "Obtiene el clima actual para una ciudad",
  { ciudad: { type: "string", description: "Nombre de la ciudad" } },
  async ({ ciudad }) => {
    const data = await fetchClima(ciudad);
    return {
      content: [{ type: "text", text: JSON.stringify(data) }]
    };
  }
);

// Definir un resource
server.resource(
  "config://app",
  "Configuración actual de la aplicación",
  async () => ({
    contents: [{ uri: "config://app", text: JSON.stringify(config) }]
  })
);

// Conectar via stdio
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Ejemplo completo en Python

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("mi-mcp-server")

@mcp.tool()
def obtener_clima(ciudad: str) -> str:
    """Obtiene el clima actual para una ciudad."""
    data = fetch_clima(ciudad)
    return json.dumps(data)

@mcp.resource("config://app")
def get_config() -> str:
    """Configuración actual de la aplicación."""
    return json.dumps(config)

if __name__ == "__main__":
    mcp.run()  # Por defecto usa stdio
```

### Testing con MCP Inspector

Herramienta oficial para probar servers durante desarrollo:

```bash
npx @modelcontextprotocol/inspector node build/index.js
```

Abre una UI web interactiva donde puedes ver tools/resources expuestos, invocar tools manualmente y debuggear comunicación.

**Flujo de desarrollo recomendado:**
1. Desarrollar con el SDK
2. Probar con MCP Inspector (iteración rápida)
3. Conectar a Claude Code para pruebas de integración
4. Publicar en npm/PyPI
5. (Opcional) Registrar en MCP Registry

:::caution[Logging en servers stdio]
**NUNCA** escribas a stdout en un server stdio — corrompe el JSON-RPC. Usa stderr:
- Python: `print("msg", file=sys.stderr)` o `logging.info("msg")`
- TypeScript: `console.error("msg")` (NO `console.log`)
:::

### Publicar y distribuir

- **npm:** `npm publish` → usuarios instalan con `npx @tu-org/mcp-server`
- **PyPI:** `pip install` o `uvx tu-mcp-server`
- **Docker:** imagen en Docker Hub o registry privado
- **MCP Registry:** crear `server.json`, verificar namespace vía GitHub/DNS, enviar PR

## MCP para enterprise

Para control organizacional, se despliega `managed-mcp.json` a nivel de sistema:

| Plataforma | Ruta |
|---|---|
| macOS | `/Library/Application Support/ClaudeCode/managed-mcp.json` |
| Linux/WSL | `/etc/claude-code/managed-mcp.json` |
| Windows | `C:\Program Files\ClaudeCode\managed-mcp.json` |

Si este archivo existe, **sobrescribe todos los demás scopes** — los usuarios solo pueden usar servers definidos ahí.

```json
{
  "allowedMcpServers": [
    { "serverName": "github" },
    { "serverUrl": "https://mcp.company.com/*" }
  ],
  "deniedMcpServers": [
    { "serverName": "dangerous-server" }
  ]
}
```

La denylist siempre tiene precedencia sobre la allowlist.

## Evolución del protocolo

### Timeline

| Fecha | Cambio |
|---|---|
| Nov 2024 | Primera release con HTTP+SSE |
| Mar 2025 | Introduce Streamable HTTP transport |
| Jun 2025 | Revisión mayor del protocolo |
| Nov 2025 | OAuth 2.1, Tasks experimentales, Elicitation |
| Ene 2026 | **MCP Apps** — UI interactiva dentro de conversaciones (primera extensión oficial) |
| Mar 2026 | **MCP Extensions** — framework para extender sin tocar core |

### MCP Apps — UI interactiva

Primera extensión oficial. Permite que tools devuelvan **componentes UI interactivos** (dashboards, formularios, visualizaciones) que se renderizan directamente en la conversación, no solo texto.

Arquitectura: tools con metadata `_meta.ui.resourceUri` que apunta a UI Resources servidos vía `ui://` (HTML/JS bundleado en iframe sandboxeado).

SDK: `@modelcontextprotocol/ext-apps`. Soportado en Claude (web + desktop), ChatGPT, VS Code Insiders.

### MCP Extensions — extender sin romper

Patrones opcionales sobre el protocolo base. Los clients que no conocen una extensión la ignoran — no rompe nada.

3 tipos actuales:
1. **UI capabilities** — MCP Apps (dashboards, charts interactivos)
2. **Authorization patterns** — auth machine-to-machine, controles enterprise
3. **Domain-specific conventions** — estándares para finanzas, salud, etc.

Las features enterprise se implementan como Extensions, no como cambios al core spec.

### Roadmap 2026

4 áreas de foco:

| Área | Qué incluye |
|---|---|
| **Transport Evolution** | Scaling horizontal HTTP, metadata discovery vía `.well-known` |
| **Agent Communication** | Refinamiento de Tasks (retry, result expiry) |
| **Governance** | Contributor ladder, Working Groups |
| **Enterprise** | Audit trails, SSO auth, gateway behavior |

## Impacto en tu ventana de contexto

:::danger[Cuidado con demasiados MCPs activos]
Cada MCP habilitado consume tokens de tu ventana de contexto **solo con las definiciones de tools**. Con 5 servidores MCP típicos (GitHub 35 tools, Slack 11, Sentry 5, Grafana 5, Splunk 2), las definiciones consumen **~55.000 tokens antes de que Claude empiece a trabajar**. Internamente en Anthropic han observado hasta 134.000 tokens de overhead.

Con demasiados MCPs, tu ventana efectiva de 200K puede caer a ~70K.

**Regla práctica:** máximo ~10 MCPs habilitados y ~80 tools activas por proyecto. Deshabilita los que no uses con `disabledMcpServers` en `.claude/settings.local.json`.
:::

## Siguiente paso

Con hooks automatizas tu workflow local, con skills encapsulas procesos, y con MCP conectas con el mundo exterior. El siguiente nivel es **delegar trabajo a agentes especializados** que operan en paralelo.

[Agentes: delegar trabajo a especialistas →](/escalar/agentes/)
