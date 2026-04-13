---
title: "Managed Agents: deploy a producción"
description: "Desplegar agentes cloud-hosted con infraestructura gestionada — sandbox, credenciales, checkpointing y patrones canónicos."
sidebar:
  order: 2
---

Managed Agents es la suite de APIs de Anthropic para desplegar agentes en producción sin montar tu propia infraestructura. Resuelve lo que normalmente lleva meses: sandboxing seguro, checkpointing, gestión de credenciales, permisos con scope, y recuperación de errores. Public beta desde abril 2026.

**Relación con Agent SDK:** el Agent SDK es código y lógica del agente (Python). Managed Agents es la **infra de deploy y runtime** en producción. Son complementarios — construyes con el SDK, despliegas con Managed Agents.

## Cuándo usarlo y cuándo no

| Caso | ¿Managed Agents? | Alternativa |
|---|---|---|
| Producto SaaS con usuarios finales propios | **Sí** — cada end-user tiene su vault de credenciales | — |
| Sesiones de agente de horas, desatendidas | **Sí** — checkpoint + recuperación de errores | — |
| Necesitas observabilidad built-in sin montar Grafana | **Sí** — tracing en Console | — |
| Tu trabajo diario como developer | No | Claude Code CLI |
| Automatización recurrente propia | No | `/loop` o Scheduled Tasks |
| Prototipos y demos rápidos | No | Agent SDK self-hosted |
| Ráfagas cortas <1 hora | No | API directa |

**Pricing:** tarifas estándar de tokens + **$0.08/session-hour** de runtime activo.

## Los 5 primitivos de la arquitectura

Todo en Managed Agents gira alrededor de 5 conceptos:

### 1. Environment — sandbox reutilizable

```python
env = client.beta.environments.create(
    config={"packages": {"type": "packages", "pip": ["pandas", "plotly"]}}
)
```

Contenedor stateless con dependencias preinstaladas. Se crea una vez y se reutiliza entre sesiones. **Ahorra 30-60s de `pip install` por sesión**. No persiste nada entre sesiones — solo define el runtime.

### 2. Agent — definición inmutable versionada

```python
agent = client.beta.agents.create(
    name="data-analyst",
    model="claude-sonnet-4-6",
    system=ANALYST_PROMPT,
    tools=[{
        "type": "agent_toolset_20260401",
        "default_config": {"permission_policy": {"type": "always_allow"}},
        "configs": [
            {"name": "web_search", "enabled": False},
        ],
    }],
)
```

Cambiar prompt/tools → versión nueva (`agent.version` se incrementa). Sesiones pinned a versión concreta — facilita A/B testing y rollout gradual sin colisiones.

**`agent_toolset_20260401`:** toolset built-in con 8 tools (bash, read, write, edit, web_search, web_fetch, etc). Se habilitan/deshabilitan por nombre. El versionado congela la semántica.

:::tip[Desactivar lo que no necesitas]
Si tu agente analiza datos offline, desactiva `web_search` y `web_fetch`. Previene que intente acciones innecesarias → menos latencia, más control.
:::

### 3. Session — instancia ephemeral de trabajo

```python
session = client.beta.sessions.create(
    agent={"type": "agent", "id": agent.id, "version": agent.version},
    environment_id=env.id,
    vault_ids=[vault.id],
    resources=[{"type": "file", "file_id": dataset.id,
                "mount_path": "/mnt/session/uploads/data.csv"}],
)
```

Creada por request, monta archivos por referencia, ejecuta hasta idle, se archiva al terminar. Los archivos de `/mnt/session/outputs/` persisten; todo lo demás (temp, home) se pierde.

**Statuses:** `idle` (esperando input) → `running` (ejecutando) → `rescheduling` (error transitorio, retry automático) → `terminated` (error irrecuperable).

### 4. File — archivos montados fuera del contexto

```python
dataset = client.beta.files.upload(file=(path.name, f, "text/csv"))
```

El archivo **no se transmite como prompt context** — se monta en el filesystem del sandbox. Permite analizar CSVs grandes sin consumir tokens. Upload una vez, `file_id` reutilizable entre sesiones.

**Persistencia selectiva:**
```python
outputs = client.beta.files.list(scope_id=session.id)
for f in outputs.data:
    if f.downloadable:  # True = output generado, False = input montado
        content = client.beta.files.download(f.id)
```

Solo `/mnt/session/outputs/` persiste tras archivar.

### 5. Vault — credenciales por usuario final

```python
vault = client.beta.vaults.create(
    display_name="Alice",
    metadata={"external_user_id": "usr_abc123"},
)
```

Un vault agrupa credenciales de un end-user. Se pasa `vault_ids=[vault.id]` al crear sesión. El agente nunca toca tokens — el runtime inyecta credenciales al conectar con el MCP server.

**Dos tipos de credencial:**

| Tipo | Cuándo | Gestión |
|---|---|---|
| `mcp_oauth` | MCP server usa OAuth 2.0 | Anthropic gestiona refresh automáticamente |
| `static_bearer` | API key o token fijo | Sin refresh, más simple |

Máx 20 credenciales por vault (= máx MCP servers por agente).

:::danger[Warning oficial: workspace-scoped]
*"Vaults and credentials are workspace-scoped, meaning anyone with API key access can use them."*

La frontera de seguridad es **el workspace**, no la sesión ni el usuario. Cualquier persona con API key del workspace puede referenciar un `vault_id` en sus propias sesiones. Implicaciones B2B:

- **Un workspace = un perímetro de confianza.** No compartir workspaces entre clientes con credenciales distintas.
- **Rotación de API keys** del workspace = revocación efectiva para todos los vaults.
- Para revocar un vault concreto: `archive` (cascada a credenciales, retiene audit trail) o `delete` (hard, sin audit).
:::

### Lifecycle completo

| Paso | Componente | Lifecycle |
|---|---|---|
| 1 | Environment | Creado 1 vez, reutilizado siempre |
| 2 | Agent | Creado 1 vez, versión inmutable |
| 3 | File (upload) | `file_id` reutilizable |
| 4 | Session | Ephemeral — creada por request |
| 5 | Event loop | `sessions.events.send(user.message)` → agente corre hasta idle |
| 6 | Output retrieval | `files.list(scope_id=session.id)` filtrado por `downloadable=True` |
| 7 | Cleanup | `archive(session.id)` — env + agent + file quedan |

## Patrones canónicos de integración

Extraídos de los cookbooks oficiales de Anthropic (data analyst agent + Slack data bot):

### A — System prompt como blueprint ejecutable

El prompt no es narrativo — es **especificación técnica precisa**:
- *Nivel ejecución:* "Escribe `.py` scripts y córrelos con `python3 script.py`. Samplea tablas grandes."
- *Nivel output:* "Cada chart como `go.Figure()`, embed con `fig.to_html(include_plotlyjs=False)`. Plotly desde CDN."

El agente no *decide* cómo generar charts — el prompt lo codifica.

### B — Session pinned a hilo conversacional

Contraintuitivo: **no crear una sesión por usuario, sino una sesión por hilo.**

```python
thread_sessions = {}  # slack_thread_ts -> session_id

session = client.beta.sessions.create(
    environment_id=ENV_ID,
    agent={"type": "agent", **AGENT},
    metadata={"slack_channel": channel, "slack_thread_ts": thread_ts},
)
thread_sessions[thread_ts] = session.id
```

Una sesión = un thread. Reutiliza filesystem + historia entre follow-ups. El `metadata` guarda coordenadas externas para trazabilidad inversa.

### C — Two-phase ack para integraciones con timeout

Slack exige ack en <3s. Managed Agents sessions tardan minutos. Solución:

```python
def on_mention(event, say, ack):
    ack()  # Responde a Slack en <3s
    say(text="On it. Analyzing now.", thread_ts=thread_ts)
    threading.Thread(target=start_analysis, ...).start()
```

Aplicable a cualquier integración con webhook timeouts (Teams, Discord, GitHub).

### D — Streaming de progreso

```python
for ev in client.beta.sessions.events.stream(session_id):
    if ev.type == "agent.tool_use" and not posted_progress:
        post_message("Running analysis...")
    elif ev.type == "agent.message":
        summary = ev.text
    elif ev.type == "session.status_idle":
        break
```

Eventos relevantes: `agent.tool_use` (primera señal de actividad), `agent.message` (progreso), `session.status_idle` (terminó).

### E — File bridge entre sistemas externos

Los archivos en Slack, Drive o S3 no son accesibles directamente al agente. Bridge explícito:

```python
resp = requests.get(slack_file["url_private"],
                    headers={"Authorization": f"Bearer {token}"})
uploaded = client.beta.files.upload(file=(slack_file["name"], BytesIO(resp.content)))
resources.append({"type": "file", "file_id": uploaded.id,
                  "mount_path": f"/mnt/session/uploads/{slack_file['name']}"})
```

### F — Decisiones por omisión (lo que los cookbooks NO usan)

Los cookbooks oficiales **no usan** varias capacidades que podrían parecer obvias:

- **Sin vaults** en el data analyst — cada análisis es cold start
- **Sin MCP servers** — toda la lógica vive en Python scripts dentro del sandbox
- **Sin custom tools en el bot Slack** — el bot es solo orquestador de I/O
- **Sin persistencia fuera de memoria** — `thread_sessions` es dict in-memory

**Lección general:** Managed Agents empuja a mantener el orquestador fino y meter la lógica en scripts que el agente ejecuta dentro del sandbox. Invierte el patrón clásico donde el orquestador hace todo.

## Deployment — 3 vías

| Vía | Cuándo |
|---|---|
| **Claude Console** | Interfaz web con tracing y analytics. Para explorar y debuggear |
| **Claude Code** | Skill `/claude-api`, onboarding guiado |
| **CLI nueva** | `platform.claude.com/workspaces/default/agent-quickstart` |

## Observabilidad y tracing

La Console proporciona:
- **Session list** — todas las sesiones con status, tiempo, modelo
- **Tracing view** — cronología de eventos con timestamps y token usage (solo Developers y Admins)
- **Tool execution** — detalle de cada tool call y su resultado

Para programmatic debugging: `client.beta.sessions.events.list(session.id)` devuelve todos los eventos raw.

**Tipos de evento:** `user.message`, `agent.message`, `agent.tool_use`, `agent.custom_tool_use`, `agent.mcp_tool_use`, `span.model_request_end`, `session.error`.

## Errores comunes y trampas

| Error | Por qué pasa | Solución |
|---|---|---|
| **Una sesión por usuario en vez de por hilo** | Parece lógico: un usuario = una sesión. Pero pierdes contexto entre conversaciones y acumulas estado basura | Patrón B: una sesión por hilo/request. Reutiliza solo dentro del mismo hilo |
| **No archivar sesiones idle** | Las sesiones idle siguen consumiendo $0.08/hora. Con 100 usuarios, eso son $8/hora de nada | `archive` agresivo. Si lleva >10 min idle, archiva. Crea nueva si el usuario vuelve |
| **Environment con `pip install` en cada sesión** | No creas Environment reutilizable. Cada sesión instala pandas, plotly, etc. → 30-60s de latencia por sesión | Crea el Environment una vez con tus dependencias. Reutilízalo siempre |
| **Vault compartido entre clientes** | Un workspace con vaults de distintos clientes. Cualquier API key del workspace puede acceder a cualquier vault | Un workspace = un perímetro de confianza. Nunca mezcles clientes en el mismo workspace |
| **Confiar en `thread_sessions` in-memory** | El dict se pierde si el proceso se reinicia. Pierdes el mapeo hilo→sesión y creas sesiones huérfanas | Persiste el mapeo en Redis/BD. Es lo primero que deberías externalizar del cookbook |
| **Montar archivos grandes como prompt** | Pasas un CSV de 10MB como mensaje en vez de montarlo con Files API. Quema tokens y puede truncarse | Siempre Files API + `mount_path`. El archivo no consume tokens de contexto |

:::tip[Managed Agents es infraestructura, no magia]
El error más común es esperar que Managed Agents resuelva problemas de diseño del agente. Si tu agente funciona mal en local, funcionará mal en producción — pero más caro. Valida siempre con Agent SDK self-hosted antes de desplegar.
:::

## Gaps conocidos del beta (abril 2026)

| Gap | Impacto | Workaround |
|---|---|---|
| **Sin scope granular de vaults por agente** | El único perímetro es workspace-scoped | Un workspace por cliente |
| **Sin scheduled sessions nativos** | No existe cron ni recurring nativo | Scheduled Tasks de Cowork, cron propio, GitHub Actions |
| **Audit de credenciales no granular** | Se ve qué MCP tool se llamó pero no qué vault/credencial se resolvió | Trazabilidad parcial vía session metadata |

## Adopción temprana

| Empresa | Cómo lo usan |
|---|---|
| **Notion** | Custom Agents (alpha). Decenas de tareas en paralelo |
| **Rakuten** | Agentes por departamento vía Slack/Teams. Deploy en ~1 semana |
| **Asana** | AI Teammates dentro de proyectos Asana |
| **Sentry** | Seer (debugging) + agente que escribe patch y abre PR |
| **Vibecode** | Managed Agents como integración default de prompt a app |

## Has completado el Atlas

Enhorabuena. Has recorrido el camino completo del ecosistema Claude:

1. **Empezar** — instalar, configurar, primer proyecto
2. **Automatizar** — hooks determinísticos, skills reutilizables
3. **Conectar** — MCP para hablar con servicios externos
4. **Escalar** — agentes paralelos, modelos optimizados
5. **Producción** — Agent SDK para apps, Managed Agents para deploy

Este Atlas se actualiza continuamente. Si encuentras algo desactualizado, incorrecto, o que falta, [abre un issue en GitHub](https://github.com/dixdavid80-bit/atlas-claude-es/issues).

Escrito por [David Dix](https://github.com/dixdavid80-bit) — consultor y formador en IA aplicada B2B.
