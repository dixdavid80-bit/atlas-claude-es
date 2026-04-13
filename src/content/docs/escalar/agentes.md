---
title: "Agentes: delegar trabajo a especialistas"
description: "Sub-agentes personalizados, patrones multi-agente, code review paralelo, harness engineering y trabajo en equipo con Claude Code."
sidebar:
  order: 1
---

Un agente en Claude Code es una definición de comportamiento especializado que se invoca como sub-tarea aislada. En vez de pedirle todo a un Claude generalista, delegas tareas a agentes con su propio prompt, sus propias herramientas y su propio contexto.

**La diferencia práctica:** en vez de *"revisa el código buscando bugs de seguridad y chequea rendimiento y mira la calidad"*, lanzas 3 agentes en paralelo — cada uno enfocado en un aspecto — y recibes resultados consolidados. Más rápido, más preciso, y cada agente tiene su contexto limpio.

## Tu primer agente personalizado

Los agentes se definen como archivos `.md` con frontmatter YAML en `.claude/agents/`:

```
.claude/
└── agents/
    └── security-reviewer.md
```

### Ejemplo mínimo funcional

```markdown
---
name: security-reviewer
description: Use this agent when reviewing code for security vulnerabilities,
  auth issues, or data exposure risks.
model: opus
---

Analiza el código buscando vulnerabilidades de seguridad.

## Foco
- Inyección SQL y XSS
- Exposición de secrets o tokens
- Autenticación y autorización mal implementadas
- Validación de input insuficiente

## Output
Lista cada vulnerabilidad encontrada con:
- Archivo y línea
- Severidad (CRITICAL/HIGH/MEDIUM/LOW)
- Descripción del problema
- Fix sugerido
```

Claude Code lee el campo `description` para decidir cuándo delegar a este agente. **Escríbelo para el modelo, no para humanos** — incluye frases de activación como *"Use this agent when..."*.

### Ubicaciones (por prioridad)

| # | Ubicación | Alcance |
|---|---|---|
| 1 | `--agents` flag CLI | Solo esta sesión (máxima prioridad) |
| 2 | `.claude/agents/` | Proyecto (compartido vía git) |
| 3 | `~/.claude/agents/` | Todos tus proyectos |
| 4 | Directorio `agents/` de plugins | Plugin scope (mínima prioridad) |

### Los 13 campos del frontmatter

| Campo | Tipo | Qué hace |
|---|---|---|
| `name` | string | Identificador del agente (obligatorio) |
| `description` | string | Cuándo activar — Claude lo lee para decidir delegación (obligatorio) |
| `model` | sonnet/opus/haiku/inherit | Modelo que usa el agente (default: hereda del padre) |
| `tools` | lista | Whitelist de herramientas permitidas |
| `disallowedTools` | lista | Blacklist de herramientas |
| `permissionMode` | string | Modo de permisos del sub-agente |
| `maxTurns` | int | Límite de turnos |
| `skills` | lista | Skills disponibles para el agente |
| `mcpServers` | objeto | MCP servers del agente |
| `hooks` | objeto | Hooks del agente |
| `memory` | string | Instrucciones de memoria |
| `background` | bool | Ejecución en background |
| `isolation` | string | Nivel de aislamiento |

:::caution[Restricción arquitectónica]
Los sub-agentes NO pueden crear otros sub-agentes. El sistema lo impide — el Task tool no está disponible para sub-agentes.
:::

### Agentes vs Skills

| Aspecto | Agente (.claude/agents/) | Skill (.claude/skills/) |
|---|---|---|
| Propósito | Comportamiento autónomo | Capacidad invocable |
| Activación | Delegación automática por parent | `/nombre` o auto-invocación |
| Modelo | Puede elegir modelo propio | Usa el modelo activo |
| Alcance | Sesión completa | Tarea específica |
| Contexto | Aislado del padre | Comparte contexto |

## 5 patrones de arquitectura multi-agente

### Patrón 1 — Description como trigger de activación

El campo `description` actúa como condicional semántico — el agente padre lo lee para decidir cuándo delegar:

```yaml
# security-reviewer.md
description: Use this agent when reviewing code for security vulnerabilities

# performance-analyzer.md
description: Use this agent when analyzing code for performance bottlenecks
```

Claude lee todas las descriptions al inicio y decide a quién delegar según la tarea.

### Patrón 2 — Reglas de frontera (qué NO hacer)

Los sub-agentes definen explícitamente sus límites para evitar conflictos:

```markdown
## Rules
- NEVER run build or dev (the parent agent handles those)
- We are using pnpm NOT bun
- Do NOT delegate to other sub-agents
- You ARE the security-reviewer (evita delegación circular)
```

### Patrón 3 — Context sharing via archivos de tarea

Los sub-agentes leen y escriben archivos compartidos para mantener contexto entre sesiones:

```markdown
- Before you do any work, MUST view files in .claude/tasks/context_session_x.md
- After you finish, MUST update .claude/tasks/context_session_x.md
```

```
.claude/
├── agents/
│   ├── frontend-builder.md
│   └── api-designer.md
└── tasks/
    ├── context_session_1.md    ← Estado compartido
    └── context_session_2.md
```

### Patrón 4 — Output estandarizado para handoff

Cada sub-agente termina con un resumen estructurado:

```markdown
## Output format
Your final message HAS TO include detailed information of what you did,
so that we can hand over to the next engineer to pick up the work.
```

### Patrón 5 — System prompts extensos con workflows multi-fase

Sub-agentes con workflows completos:
1. Analysis & Planning Phase
2. Research Phase (consultar docs, APIs)
3. Implementation Phase
4. Integration Phase (theming, testing)

## Code Review con subagentes — el patrón más útil

Patrón de revisión donde un agente principal orquesta 3+ subagentes que analizan el código **en paralelo**, cada uno enfocado en un aspecto:

```
AGENTE PRINCIPAL (orquestador)
├── SUBAGENTE 1 → bugs y edge cases
├── SUBAGENTE 2 → calidad y patrones
└── SUBAGENTE 3 → performance
        │
        ▼
AGENTE PRINCIPAL
  · sintetiza hallazgos
  · prioriza issues
  · genera review consolidado
```

**Por qué funciona mejor que un solo agente:**
1. **Context window** — un solo agente mezcla análisis en la misma ventana, llenándola rápido
2. **Especialización** — cada subagente tiene prompt enfocado
3. **Paralelismo** — los 3 corren simultáneamente vía Agent tool

### El patrón Validity — separar señal de ruido

El problema clásico: 3 agentes de review devuelven 15 findings mezclados y acabas arreglando cosas que no eran tu cambio. Solución: **columna Validity** en el output consolidado:

| Validity | Qué significa | Acción |
|---|---|---|
| **Real** | El finding fue introducido por el PR actual | Se arregla |
| **Noise (pre-existing)** | El problema ya existía antes | Se ignora |
| **Noise (out-of-scope)** | Mejora válida pero no relacionada con el PR | Ticket aparte |

**Auto-mode:** el orquestador filtra por `Validity == Real` y lanza fixes solo de esos. Los Noise se reportan pero no se tocan.

**Coste real observado:** ~60K tokens para 3 agentes combinados (19K + 18K + 21K) en un review de un sign-in form. Escala lineal con tamaño del archivo.

## Git worktrees — cómo Claude trabaja en paralelo

Git worktrees permiten tener múltiples checkouts del mismo repo simultáneamente, cada uno en su directorio:

```bash
# Crear worktree
git worktree add ../mi-feature feature-branch

# Claude Code los crea automáticamente en:
.claude/worktrees/<nombre>/   # Naming Docker-style: "recursing-williams"

# Branch pattern: claude/<nombre-worktree>
```

**Por qué Claude Code los usa:**
1. **Aislamiento** — cada sesión trabaja en branch separada sin conflictos
2. **Trabajo paralelo** — múltiples instancias simultáneas en features distintos
3. **Historia compartida** — todos comparten el mismo object database de Git
4. **Contexto limpio** — cada worktree tiene su propio estado de archivos

### Patrón Orchestrator: worktrees + SDK

Combina worktrees con el Claude Code SDK para ejecutar múltiples agentes en paralelo:

```typescript
import { ClaudeCode } from '@anthropic-ai/claude-code';
import { execSync } from 'child_process';

const tasks = [
  { name: 'auth-refactor', prompt: 'Refactoriza auth para usar JWT' },
  { name: 'add-tests', prompt: 'Añade unit tests para el user service' },
  { name: 'fix-bug-123', prompt: 'Arregla la race condition del issue #123' },
];

const results = await Promise.all(
  tasks.map(async (task) => {
    execSync(`git worktree add .claude/worktrees/${task.name} -b claude/${task.name}`);
    const claude = new ClaudeCode({
      workingDirectory: `.claude/worktrees/${task.name}`,
    });
    return claude.sendMessage(task.prompt);
  })
);
```

## Modo headless para automatización

Claude Code soporta ejecución no interactiva para CI/CD y orquestación:

```bash
# Ejecutar con prompt único
claude -p "Refactoriza el módulo de auth para usar JWT"

# Output JSON para consumo programático
claude -p "Describe la arquitectura" --output-format json

# Restringir herramientas
claude -p "Arregla el bug #123" --allowedTools Bash,Read,Write,Edit

# Especificar modelo
claude -p "Genera tests" --model claude-sonnet-4-6
```

## CI/CD con GitHub Actions

Anthropic publica `claude-code-action` como GitHub Action oficial:

```yaml
name: Claude Code Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            Revisa este PR buscando bugs, problemas de seguridad
            y calidad de código. Sugiere mejoras.
```

**Casos de uso en CI/CD:**
- Code review automatizado en cada PR
- Generación automática de tests
- Bug fixing en respuesta a issues
- Generación de release notes
- Issue-to-PR automation

## Harness Engineering — agentes autónomos de larga duración

### El problema

Los agentes fallan de dos formas en tareas largas:
1. **One-shotting** — intenta resolver todo de golpe → agota contexto a mitad → deja el entorno roto
2. **Declaración prematura** — marca tareas como terminadas sin verificación real

### La solución: arquitectura de 2 agentes (v1)

```
INITIALIZER AGENT (1 vez)         CODING AGENT (N sesiones)
  · Descompone en 200+ features    · Lee progress.txt + git log
  · Crea feature_list.json          · Ejecuta init.sh
  · Crea init.sh + progress.txt     · Implementa 1 feature
  · Commit inicial                   · Testa E2E → commit → actualiza progress
```

**Artefactos del entorno legible (la pieza clave):**

| Artefacto | Propósito |
|---|---|
| `feature_list.json` | Lista exhaustiva con estado pass/fail. El agente solo puede cambiar `passes`, NUNCA eliminar tests |
| `claude-progress.txt` | Log cronológico en lenguaje natural |
| `init.sh` | Script que levanta dev server + tests |
| Git history | Contexto técnico vía commits descriptivos |

**Los 3 pilares del harness engineering:**

1. **Entorno legible** — si el agente no puede acceder a algo, para él no existe. Documentation-as-code
2. **Verificación con feedback loop** — tests E2E con browser automation son los que funcionan. Unit tests aislados fallan en detectar bugs end-to-end
3. **Herramientas genéricas sobre especializadas** — Vercel rediseñó su agente: eliminó tools especializadas, dejó un solo Bash tool → **3.5x más rápido, 37% menos tokens, success rate 80% → 100%**

### Evolución: arquitectura de 3 agentes GAN-inspired (v2)

```
PLANNER → spec completa
GENERATOR → construye por sprints
EVALUATOR → navega la app real con Playwright, califica contra criterios
```

**Sprint contracts:** antes de cada bloque, generator y evaluator negocian qué significa "terminado". Criterios de evaluación para frontend: design quality, originality, craft, functionality.

**Datos reales:** solo-agent 20 min / $9 (juego no funcionaba) vs harness completo 6h / $200 (juego jugable con físicas funcionales). 20x más caro pero la diferencia de calidad es inmediata.

**Lección meta:** cada componente del harness codifica una suposición sobre lo que el modelo no puede hacer solo. Con cada modelo nuevo, re-examinar qué scaffold sigue siendo necesario.

## Flujo E2E autocurativo

Skill que delega validación completa al agente — investiga la app, navega como usuario real, consulta la BD, y genera informe:

```
/e2e test
    │
    ▼
[1] Investigación ── 3 subagentes paralelos:
    │                 ├── Estructura app + viajes usuario
    │                 ├── Esquema base de datos
    │                 └── Revisión de código (errores lógicos)
    ▼
[2] Planificación ── Lista de tareas/viajes
    ▼
[3] Pruebas E2E ──── Browser automation + queries BD
    ▼
[4] Autocuración ─── Solo errores bloqueantes → fix + re-test
    ▼
[5] Reporte ──────── Markdown con capturas + qué se arregló + qué queda
```

**Validación dual (la pieza clave):** frontend (browser + capturas) + backend (queries directas a BD). Muchos bugs viven en la discrepancia entre lo que la UI muestra y lo que la BD contiene.

**Jerarquía de autocuración:** bloqueante → corrige en loop. Moderado/menor → documenta, no toca. Evita que el agente "arregle" cosas que requieren decisión humana.

## Auto Mode — permisos sin intervención

Nuevo modo que permite ejecución prolongada sin interrupciones constantes de aprobación:

| Modo | Cómo funciona |
|---|---|
| **Default** | Te pide permiso para cada acción sensible |
| **Auto Mode** | Clasificador AI decide qué es seguro; solo pregunta lo dudoso |
| **Plan Mode** | Claude planifica sin ejecutar hasta que apruebes |

El clasificador usa pipeline de 2 etapas: etapa 1 (64 tokens, decisión rápida) → etapa 2 (4.096 tokens, razonamiento si la 1 bloquea).

Activar: `claude --enable-auto-mode` o Shift+Tab en sesión.

## Mejores prácticas para equipos

1. **Estandarizar CLAUDE.md** — acordar estructura, mantenerlo conciso (60-100 líneas)
2. **Usar `.claude/rules/`** — reglas modulares por tema
3. **MCP configs compartidos** — commitear `.claude/settings.json`
4. **Hooks compartidos** — seguridad y formatting en `.claude/hooks/`
5. **Convención de branches** — naming consistente (`claude/<task-name>`)
6. **PR templates** — incluir test plans y contexto
7. **CI/CD automatizado** — GitHub Actions para review automático
8. **Limpieza de worktrees** — convenciones para limpiar tras trabajo paralelo
9. **Secrets en env vars** — nunca commitear credenciales

## Cross-model: Codex Plugin

Plugin oficial de OpenAI que integra Codex dentro de Claude Code. Un competidor creando un plugin para la herramienta del otro — señal de que Claude Code se convierte en plataforma.

```bash
/plugin marketplace add openai/codex-plugin-cc
/plugin install codex@openai-codex
/codex:setup
```

Comandos: `/codex:review` (code review), `/codex:adversarial-review` (review que cuestiona diseño), `/codex:rescue` (delegar tarea a Codex).

**Review Gate (experimental):** Codex revisa cada respuesta de Claude antes de completar. Si encuentra problemas, bloquea para que Claude los arregle.

## Siguiente paso

Los agentes escalan tu capacidad de trabajo. El siguiente paso es **optimizar qué modelo usar y cuándo**, para que ese trabajo escalado no se coma tu presupuesto.

[Modelos y coste: optimizar sin perder calidad →](/escalar/modelos-y-coste/)
