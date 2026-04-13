---
title: "Hooks: automatización que no falla"
description: Los 4 tipos de hooks de Claude Code, 7 ejemplos prácticos, debugging y 9 errores que evitar.
sidebar:
  order: 1
---

Los hooks son comandos shell que Claude Code ejecuta automáticamente en puntos específicos de su trabajo. Son el **único mecanismo que garantiza ejecución** — Claude no puede saltárselos, ignorarlos ni olvidarlos.

## Por qué existen los hooks

Sin hooks, ciertas validaciones dependen de que Claude "recuerde" hacerlas. Y Claude puede olvidar. Los hooks convierten reglas orientativas en **enforcement real**: en vez de escribir en CLAUDE.md *"no hagas commits a main"*, un hook lo bloquea físicamente.

### Hooks vs otros mecanismos

| Mecanismo | ¿Siempre se ejecuta? | Quién controla |
|---|---|---|
| **Hooks** | **Sí** — determinístico, imposible de saltarse | Tú (settings.json) |
| **MCP Servers** | No — Claude decide cuándo usar | Desarrollador |
| **Skills** | No — Claude decide cuándo cargar | Creador de la skill |
| **CLAUDE.md** | No — Claude puede ignorar | Tú (texto orientativo) |

**Regla de decisión rápida:**
- Algo **debe** cumplirse siempre → **hook**
- Algo **debería** cumplirse → CLAUDE.md o skill
- Una capacidad nueva que Claude elige cuándo usar → MCP server

## Los 4 tipos de hooks

| Hook | Cuándo se dispara | Ejemplo típico |
|---|---|---|
| **PreToolUse** | Antes de ejecutar una herramienta | Bloquear commits a main |
| **PostToolUse** | Después de ejecutar una herramienta | Auto-formatear con Prettier |
| **Notification** | Cuando Claude genera una notificación | Alerta de escritorio |
| **Stop** | Cuando Claude decide que terminó | Verificar que los tests pasan |

### Cómo funciona el flujo

```
Claude quiere ejecutar una herramienta (ej: Bash con "git commit")
    │
    ▼
[PreToolUse hooks] → ¿Permitir, bloquear o modificar?
    │
    ├─ "block" → la herramienta NO se ejecuta, Claude ajusta su plan
    ├─ "modify" → se cambia el input antes de ejecutar
    └─ "allow" → se ejecuta normalmente
                    │
                    ▼
              [La herramienta se ejecuta]
                    │
                    ▼
              [PostToolUse hooks] → formatear, auditar, side-effects
```

## Configuración

Los hooks se configuran en archivos de settings de Claude Code:

| Archivo | Scope | Compartido vía git |
|---|---|---|
| `~/.claude/settings.json` | Todos tus proyectos | No |
| `.claude/settings.json` | Este proyecto (todo el equipo) | Sí |
| `.claude/settings.local.json` | Solo tu máquina en este proyecto | No |

:::tip[Si no sabes cuál elegir]
Empieza con `~/.claude/settings.json` (global) para hooks personales. Usa `.claude/settings.json` (proyecto) cuando todo el equipo debe tenerlos.
:::

### Estructura básica

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/mi-script.sh"
          }
        ]
      }
    ]
  }
}
```

### El campo `matcher`

Define qué herramientas activan el hook:

| Matcher | Qué captura |
|---|---|
| `"Bash"` | Solo ejecuciones de comandos shell |
| `"Write\|Edit"` | Escritura o edición de archivos |
| `"mcp__github__*"` | Tools del MCP de GitHub |
| `".*"` | Todas las herramientas (cuidado) |
| `""` | Siempre (para Notification y Stop) |

:::caution[El matcher es case-sensitive]
`"bash"` no matchea `"Bash"`. Usa el nombre exacto de la herramienta.
:::

### Lo que tu hook puede responder

Tu script comunica su decisión vía stdout (JSON) + exit code:

```json
{"decision": "allow"}
```
```json
{"decision": "block", "reason": "Commits directos a main no permitidos."}
```
```json
{"decision": "modify", "tool_input": {"command": "comando-modificado"}}
```

Si tu script no imprime nada, se asume `allow`. Exit code 0 = éxito, cualquier otro = error.

## 7 ejemplos prácticos

### 1. Bloquear commits a main

El hook más útil para empezar. Impide que Claude (o tú) haga commits directos a main o master:

**En `.claude/settings.json`:**
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/prevent-main-commit.sh"
          }
        ]
      }
    ]
  }
}
```

**Script `.claude/hooks/prevent-main-commit.sh`:**
```bash
#!/bin/bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if echo "$COMMAND" | grep -q "git commit"; then
  BRANCH=$(git branch --show-current 2>/dev/null)
  if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
    echo '{"decision": "block", "reason": "No se permite hacer commits directos a main/master. Crea una feature branch primero."}'
    exit 0
  fi
fi

echo '{"decision": "allow"}'
exit 0
```

### 2. Auto-formatear archivos al escribir

Cada vez que Claude crea o edita un archivo, Prettier lo formatea automáticamente:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write \"$CLAUDE_FILE_PATH\" 2>/dev/null; echo '{\"decision\": \"allow\"}'"
          }
        ]
      }
    ]
  }
}
```

Requiere [Prettier](https://prettier.io/) instalado en el proyecto (`npm install -D prettier`).

### 3. Alerta de escritorio al terminar

Cuando Claude termina una tarea y te notifica, recibes una alerta nativa del sistema operativo:

**macOS:**
```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"'\"$CLAUDE_NOTIFICATION\"'\" with title \"Claude Code\"'"
          }
        ]
      }
    ]
  }
}
```

**Linux:**
```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "notify-send 'Claude Code' \"$CLAUDE_NOTIFICATION\""
          }
        ]
      }
    ]
  }
}
```

### 4. Registrar toda actividad de tools

Log de cada herramienta que Claude usa, con timestamp. Útil para auditoría y debugging:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'echo \"$(date -u +%Y-%m-%dT%H:%M:%SZ) PRE  $CLAUDE_TOOL_NAME\" >> /tmp/claude-hooks.log'"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'echo \"$(date -u +%Y-%m-%dT%H:%M:%SZ) POST $CLAUDE_TOOL_NAME\" >> /tmp/claude-hooks.log'"
          }
        ]
      }
    ]
  }
}
```

Revisa el log con: `tail -f /tmp/claude-hooks.log`

### 5. Bloquear comandos peligrosos

Previene que Claude ejecute comandos destructivos como `rm -rf /`, `DROP TABLE`, etc.:

```bash
#!/bin/bash
# .claude/hooks/block-dangerous.sh
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

DANGEROUS_PATTERNS=(
  "rm -rf /"
  "rm -rf ~"
  "sudo rm"
  "mkfs"
  "dd if="
  ":(){:|:&};:"
  "DROP TABLE"
  "DROP DATABASE"
  "> /dev/sda"
  "chmod -R 777 /"
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qi "$pattern"; then
    echo "{\"decision\": \"block\", \"reason\": \"Comando bloqueado por politica de seguridad: contiene patron peligroso '$pattern'\"}"
    exit 0
  fi
done

echo '{"decision": "allow"}'
exit 0
```

:::note[Cuándo es relevante]
Este hook tiene más sentido en proyectos de equipo o en producción. Si trabajas solo en tu máquina local en un proyecto personal, puede ser excesivo.
:::

### 6. Validar que los tests pasan antes de terminar

Claude no puede declarar que terminó si los tests fallan:

```bash
#!/bin/bash
# .claude/hooks/check-tests.sh
if npm test 2>/dev/null; then
  echo '{"decision": "allow"}'
else
  echo '{"decision": "block", "reason": "Los tests estan fallando. Arregla los errores antes de parar."}'
fi
exit 0
```

:::caution[Los Stop hooks deben ser rápidos]
Si tus tests tardan minutos, usa un check ligero (typecheck o lint) en vez de la suite completa. Hooks lentos degradan la experiencia.
:::

### 7. Añadir --dry-run a git push automáticamente

Modifica el comando antes de ejecutarlo — en vez de hacer push real, siempre hace dry-run primero:

```bash
#!/bin/bash
# .claude/hooks/dry-run-push.sh
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if echo "$COMMAND" | grep -q "git push" && ! echo "$COMMAND" | grep -q "\-\-dry-run"; then
  MODIFIED="${COMMAND} --dry-run"
  echo "{\"decision\": \"modify\", \"tool_input\": {\"command\": \"$MODIFIED\"}}"
  exit 0
fi

echo '{"decision": "allow"}'
exit 0
```

Este es el tipo más avanzado: `modify`. En vez de bloquear, reescribe el input antes de que se ejecute.

## Variables de entorno disponibles

Cuando un hook se ejecuta, Claude Code inyecta variables con contexto:

| Variable | Disponible en | Qué contiene |
|---|---|---|
| `CLAUDE_TOOL_NAME` | PreToolUse, PostToolUse | Nombre de la herramienta |
| `CLAUDE_TOOL_INPUT` | PreToolUse, PostToolUse | JSON con los parámetros |
| `CLAUDE_FILE_PATH` | PreToolUse, PostToolUse (Write/Edit) | Ruta del archivo |
| `CLAUDE_NOTIFICATION` | Notification | Texto de la notificación |
| `CLAUDE_TOOL_OUTPUT` | PostToolUse | Output de la herramienta |

Además, el hook recibe por **stdin** un JSON completo con toda la información del evento. Usa `jq` para parsearlo:

```bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
```

## Rendimiento y timeouts

Los hooks se ejecutan **sincrónicamente** — Claude espera a que terminen. Hooks lentos degradan toda la experiencia.

| Tipo de hook | Timeout recomendado |
|---|---|
| PreToolUse | 5-30 segundos |
| PostToolUse | 10-60 segundos |
| Notification | 5 segundos máximo |
| Stop | 30-120 segundos |

Configura el timeout en la definición:
```json
{
  "type": "command",
  "command": "bash mi-script.sh",
  "timeout": 10
}
```

## Seguridad

:::danger[Revisa los hooks de repos de terceros]
Los hooks se ejecutan **con tus permisos de usuario**. Un hook malicioso en `.claude/settings.json` de un repo puede ejecutar código arbitrario en tu máquina. Claude Code muestra un aviso cuando un proyecto tiene hooks y te pide aprobación — léelo.
:::

**Buenas prácticas de seguridad:**
1. Mantener scripts en `.claude/hooks/` dentro del repo (versionados y revisables por el equipo)
2. No hardcodear secrets — usar variables de entorno del sistema
3. Validar input JSON con `jq`, nunca con `eval`
4. Hacer `exit 0` siempre al final del script
5. Los hooks de `~/.claude/settings.json` (personales) se consideran de confianza; los de proyecto requieren revisión

## Debugging

**Cómo probar un hook antes de conectarlo:**

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"git commit -m test"}}' | bash .claude/hooks/prevent-main-commit.sh
```

Si el output es JSON válido con `decision`, funciona. Si da error, revisa permisos (`chmod +x`) y dependencias (`jq` instalado).

**Estructura recomendada de proyecto:**
```
.claude/
├── settings.json        ← Configuración con hooks
├── hooks/
│   ├── prevent-main-commit.sh
│   ├── auto-format.sh
│   ├── block-dangerous.sh
│   └── check-tests.sh
└── settings.local.json  ← Hooks personales (no va a git)
```

## 9 errores comunes que debes evitar

1. **No consumir stdin.** Tu hook debe leer stdin (`cat`) aunque no lo use, o puede colgarse
2. **Olvidar `exit 0`.** Un exit code distinto de 0 se reporta como error a Claude
3. **Matcher demasiado amplio.** `".*"` captura TODAS las herramientas — incluidas Read y Glob. Sé específico
4. **JSON mal escapado.** Usa `jq` para construir JSON, no `echo` manual con comillas anidadas
5. **Scripts sin permisos.** Siempre `chmod +x` tu script antes de conectarlo
6. **Dependencias no instaladas.** Si tu hook necesita `jq` o `prettier`, asegúrate de que están en PATH
7. **Bucles infinitos.** Un PostToolUse que dispara una acción que dispara otro PostToolUse. Sé cuidadoso con matchers amplios
8. **Hooks pesados en PreToolUse.** Ralentizan CADA uso de la herramienta matcheada. Mantén la lógica ligera
9. **No manejar el caso default.** Siempre imprime `{"decision": "allow"}` como fallback al final del script

## Siguiente paso

Los hooks garantizan que algo se ejecute siempre. Las **skills** encapsulan workflows completos que Claude puede invocar bajo demanda.

[Skills: workflows reutilizables →](/automatizar/skills/)
