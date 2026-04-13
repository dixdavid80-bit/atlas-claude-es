---
title: "Workflows reales: todo junto en acción"
description: "3 casos funcionales donde hooks, skills, MCP, agentes y CLAUDE.md trabajan juntos — de la configuración al resultado."
sidebar:
  order: 3
---

Los capítulos anteriores enseñan piezas. Este capítulo las conecta. Vas a ver 3 workflows reales donde todo el ecosistema Claude trabaja junto — no como demo técnica, sino resolviendo problemas funcionales que existen en equipos B2B reales.

Cada workflow tiene: **el problema de negocio**, **la arquitectura** (qué piezas del ecosistema usas y por qué), **la configuración concreta**, y **lo que aprendes**.

## Workflow 1: Pipeline de contenido con QA automático

### El problema

Generas contenido técnico para formación (guías, casos de uso, materiales de curso). El proceso es manual: escribes, revisas tú mismo, formateas, publicas. El cuello de botella no es escribir — es la revisión de calidad y la consistencia entre documentos.

### La arquitectura

| Pieza | Papel |
|---|---|
| **CLAUDE.md** | Define guía de estilo, tono, estructura obligatoria de cada documento |
| **Skill `/nueva-guia`** | Encapsula el flujo completo: genera borrador → valida estructura → crea archivo |
| **Hook pre-commit** | Verifica que todo documento cumpla la guía de estilo antes de hacer commit |
| **Agente subagent** | Revisión paralela: un agente revisa contenido, otro revisa formato |

### Configuración paso a paso

**1. CLAUDE.md con guía de estilo:**

```markdown
# Proyecto: Guías de formación

## Estilo de escritura
- Tono profesional pero accesible. Nada de "cabe destacar" ni "en este sentido"
- Cada guía empieza con "El problema" (2-3 frases), nunca con definición teórica
- Estructura obligatoria: Problema → Solución → Paso a paso → Errores comunes → Siguiente paso
- Máximo 3 niveles de heading (h1, h2, h3). Si necesitas h4, reorganiza
- Párrafos de máximo 4 líneas. Si es más largo, divídelo

## Convenciones
- Archivos en kebab-case: automatizar-reportes.md
- Imágenes en /assets/ con nombre descriptivo
- Commits en español con conventional commits
```

**2. Skill con template y validación:**

```
.claude/skills/nueva-guia/
├── SKILL.md
├── template.md           → Estructura base que Claude rellena
└── checklist.md          → 12 puntos de calidad que Claude verifica antes de entregar
```

El SKILL.md:

```markdown
---
name: nueva-guia
description: Genera guía de formación completa con QA integrado
---

## Instructions
1. Pregunta: tema, audiencia (técnica/negocio/mixta), nivel (intro/intermedio/avanzado)
2. Lee template.md como estructura base
3. Genera el borrador siguiendo la guía de estilo de CLAUDE.md
4. Ejecuta la checklist de checklist.md punto por punto
5. Si algún punto falla, corrige antes de entregar
6. Guarda en docs/guias/[nombre-kebab].md

## Gotchas
- NO inventes datos, estadísticas o benchmarks. Si no tienes dato real, di "pendiente de verificar"
- La sección "Errores comunes" es obligatoria. Mínimo 3 errores reales, no genéricos
- El "Siguiente paso" debe linkar a otra guía existente del proyecto
```

**3. Hook pre-commit que enforce estructura:**

```json
{
  "hooks": {
    "PreCommit": [{
      "matcher": { "diff_paths": ["docs/guias/**/*.md"] },
      "hooks": [{
        "type": "command",
        "command": "node scripts/validate-guia.js $FILE"
      }]
    }]
  }
}
```

El script `validate-guia.js` verifica: tiene sección "El problema", tiene "Errores comunes", no supera 500 líneas, tiene "Siguiente paso" con link válido. Si falla, el commit se bloquea.

**4. Revisión con agentes paralelos:**

Cuando quieres revisión profunda de una guía existente:

```
Revisa docs/guias/automatizar-reportes.md.
Lanza un agente que revise el contenido (precisión, completitud, tono).
Lanza otro agente que revise el formato (estructura, links, imágenes).
Dame un informe consolidado con acciones concretas.
```

Claude lanza dos subagents con el Agent tool, cada uno con un enfoque distinto. Los resultados no se contaminan entre sí.

### Lo que aprendes

- **CLAUDE.md como guardrail pasivo** — Claude sigue la guía de estilo sin que se lo recuerdes en cada prompt
- **Skills como workflows encapsulados** — el flujo de "nueva guía" es reproducible por cualquier persona del equipo
- **Hooks como enforcement determinístico** — no depende de que Claude "recuerde" validar. El hook bloquea el commit si no cumple
- **Agentes como revisores paralelos** — dos perspectivas independientes en el tiempo que te costaría una sola revisión manual

---

## Workflow 2: Reporting automatizado con datos reales

### El problema

Cada semana generas un informe para stakeholders: métricas del proyecto, avance, bloqueos, plan siguiente semana. Te lleva 2-3 horas recopilar datos de distintas fuentes, redactar y formatear. Es trabajo repetitivo que no debería ser tuyo.

### La arquitectura

| Pieza | Papel |
|---|---|
| **MCP de GitHub** | Lee issues, PRs, commits de la semana |
| **MCP de Postgres** (o Google Sheets) | Lee métricas del proyecto (usuarios, errores, KPIs) |
| **Skill `/informe-semanal`** | Orquesta el flujo: recopila datos → genera informe → lo guarda |
| **Scheduled Task** | Se ejecuta cada viernes a las 9:00 automáticamente |
| **Hook post-tool** | Después de generar, valida que las métricas sean coherentes |

### Configuración paso a paso

**1. MCPs instalados:**

```bash
# GitHub para actividad del repo
claude mcp add --scope user github -- npx -y @modelcontextprotocol/server-github

# Postgres para métricas (o usa Google Sheets MCP si no tienes BD)
claude mcp add --scope project postgres -- npx -y @modelcontextprotocol/server-postgres
```

**2. Skill `/informe-semanal`:**

```markdown
---
name: informe-semanal
description: Genera informe semanal del proyecto con datos reales
---

## Instructions
1. Usa el MCP de GitHub para obtener: PRs mergeados, issues cerrados, issues abiertos, commits de la semana
2. Usa el MCP de Postgres para obtener: usuarios activos, tasa de error, tiempo medio de respuesta
3. Lee el informe de la semana anterior en docs/informes/ para comparar tendencias
4. Genera el informe en docs/informes/YYYY-MM-DD-semanal.md siguiendo template.md
5. Incluye SIEMPRE: resumen ejecutivo (5 líneas max), métricas con comparación semanal (↑/↓/→), bloqueos activos, plan semana siguiente

## Gotchas
- Si un MCP no responde, indica "dato no disponible" — NO inventes métricas
- Las métricas llevan siempre comparación con semana anterior
- "Plan semana siguiente" son compromisos concretos, no intenciones vagas
- El resumen ejecutivo va PRIMERO — es lo único que leen los stakeholders
```

**3. Scheduled Task para automatizar:**

En Claude.ai (Cowork) o desde Claude Code:

```
Crea una tarea programada que todos los viernes a las 9:00 ejecute /informe-semanal
y me notifique cuando termine.
```

O desde la API:

```python
# Scheduled task que corre cada viernes
task = client.scheduled_tasks.create(
    task_id="informe-semanal",
    cron_expression="0 9 * * 5",  # Viernes 9:00
    prompt="Ejecuta /informe-semanal para esta semana",
)
```

**4. Hook de validación de métricas:**

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": { "tool_name": "Write" },
      "hooks": [{
        "type": "command",
        "command": "node scripts/validate-metrics.js $FILE",
        "timeout": 5000
      }]
    }]
  }
}
```

El script verifica que las métricas numéricas sean coherentes: no hay porcentajes >100%, no hay valores negativos en usuarios activos, las tendencias cuadran con los datos.

### Lo que aprendes

- **MCPs como fuentes de datos** — Claude no copia y pega de una BD a un doc. Lee los datos directamente y los interpreta
- **Skills + MCPs = flujos con datos reales** — la skill orquesta, los MCPs proveen datos, el template da estructura
- **Scheduled Tasks para recurrencia** — el informe se genera solo. Tú solo revisas y publicas
- **Hooks como sanity check** — no confías ciegamente en los datos generados. El hook valida antes de guardar

---

## Workflow 3: Onboarding técnico de un proyecto nuevo

### El problema

Te incorporas a un proyecto existente (o incorporas a alguien de tu equipo). El repo tiene 200 archivos, documentación dispersa, y convenciones no escritas. El onboarding típico: 2-3 días leyendo código, preguntando cosas, rompiendo cosas. Con Claude Code bien configurado, ese onboarding se comprime a horas.

### La arquitectura

| Pieza | Papel |
|---|---|
| **CLAUDE.md completo** | La configuración que el equipo ya tiene (si no existe, lo primero es crearlo) |
| **Agent Explore** | Claude explora el codebase en paralelo: estructura, patrones, dependencias |
| **MCP de GitHub** | Lee PRs recientes para entender qué se está trabajando |
| **Skill `/onboarding`** | Genera un resumen ejecutivo del proyecto personalizado para ti |

### Configuración paso a paso

**1. Si el proyecto no tiene CLAUDE.md (lo primero):**

```
Lee todo el codebase y genera un CLAUDE.md que cubra:
1. Qué hace este proyecto y para quién
2. Stack tecnológico completo
3. Estructura de carpetas con rol de cada una
4. Convenciones de código que detectes (naming, patterns, error handling)
5. Cómo arrancar en local (dev server, tests, build)
6. Decisiones arquitectónicas que detectes (por qué X y no Y)

Sé conciso — máximo 80 líneas. Lo que no quepa va a .claude/rules/
```

Claude usará el Agent tool con tipo Explore para escanear el codebase en paralelo. En proyectos grandes, esto tarda 2-3 minutos y produce un CLAUDE.md sorprendentemente bueno como punto de partida.

**2. Skill de onboarding para nuevos miembros:**

```markdown
---
name: onboarding
description: Genera briefing de onboarding para un nuevo miembro del equipo
---

## Instructions
1. Lee CLAUDE.md y todos los archivos en .claude/rules/
2. Usa el MCP de GitHub para leer los últimos 20 PRs mergeados
3. Identifica: las 5 áreas de código más activas, los patrones recurrentes, las deudas técnicas visibles
4. Genera docs/onboarding.md con:
   - Mapa del proyecto (qué hace cada carpeta clave)
   - "Los 10 archivos que debes leer primero" (ordenados por importancia)
   - "Lo que nadie te dice" — convenciones no documentadas que detectas en el código
   - "Cuidado con..." — trampas comunes del proyecto
   - "Primeras tareas sugeridas" — issues buenos para empezar

## Gotchas
- NO asumas el nivel técnico del nuevo miembro. Escribe para alguien competente pero que no conoce ESTE proyecto
- Los "10 archivos" deben tener una frase de por qué leer cada uno, no solo el path
- "Lo que nadie te dice" es la sección más valiosa — búscalo en patrones del código, no en docs
```

**3. Exploración inicial con agentes:**

Al llegar al proyecto:

```
Quiero entender este proyecto. Lanza agentes en paralelo:
1. Uno que analice la estructura y arquitectura general
2. Uno que lea los últimos 20 PRs y me diga qué se está trabajando
3. Uno que identifique deuda técnica y zonas problemáticas

Dame un briefing consolidado de máximo 2 páginas.
```

### Lo que aprendes

- **CLAUDE.md como artefacto de equipo** — no es solo para ti. Es el onboarding automático de cualquier persona (o Claude) que toque el proyecto
- **Agentes Explore para escaneo rápido** — en vez de leer 200 archivos tú, Claude los escanea en paralelo y te da los highlights
- **MCP de GitHub como contexto de actividad** — no solo estructura estática del código, sino qué está pasando ahora (PRs, issues, quién trabaja en qué)
- **Skills como conocimiento de equipo** — el `/onboarding` encapsula lo que un senior haría mentalmente al revisar un proyecto. Ahora es reproducible

---

## El patrón que conecta los 3 workflows

Si observas los tres casos, la estructura es la misma:

```
CLAUDE.md (contexto persistente)
    ↓
Skill (workflow encapsulado)
    ↓
MCP (datos externos) + Agent (paralelismo)
    ↓
Hook (validación determinística)
    ↓
Resultado verificado
```

**CLAUDE.md** define las reglas. **Skills** definen los flujos. **MCPs** conectan con datos reales. **Agentes** paralelizan trabajo. **Hooks** garantizan calidad. Cada pieza tiene un rol claro y no se solapan.

La clave no es usar todas las piezas siempre — es saber cuál resuelve qué problema:

| Necesitas... | Usa |
|---|---|
| Contexto que persista entre sesiones | CLAUDE.md + `.claude/rules/` |
| Un flujo reproducible por cualquiera | Skill |
| Datos de fuera de tu máquina | MCP |
| Trabajo en paralelo | Agent (subagents) |
| Que algo se cumpla sí o sí | Hook |
| Que algo pase sin que tú lo pidas | Scheduled Task |
| Reducir coste/latencia | Effort medium + Sonnet |
| Máxima calidad en decisiones | Effort high + Opus (o Advisor tool) |

## Siguiente paso

Has visto las piezas por separado y juntas. Si quieres llevar esto más allá del CLI — construir agentes programáticos que vivan dentro de tus propias aplicaciones — el siguiente nivel es la API y el Agent SDK.

[API y Agent SDK: más allá del CLI →](/produccion/api-agent-sdk/)
