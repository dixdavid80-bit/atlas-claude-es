---
title: "Hooks: automatización que no falla"
description: Los 4 tipos de hooks de Claude Code, ejemplos prácticos y cuándo usarlos.
---

:::note[En desarrollo]
Este capítulo está en construcción activa. El contenido completo llegará próximamente — ya tenemos 10 notas verificadas listas para publicar.
:::

## Qué son los hooks

Los hooks son comandos shell que Claude Code ejecuta automáticamente en puntos específicos de su ciclo de vida. Son el **único mecanismo que garantiza ejecución** — Claude no puede saltárselos.

| Mecanismo | ¿Siempre se ejecuta? | Quién controla |
|---|---|---|
| **Hooks** | Sí — determinístico | Tú (configuración en settings.json) |
| **MCP Servers** | Claude decide cuándo usar | Desarrollador |
| **Skills** | Claude decide cuándo cargar | Creador de la skill |
| **CLAUDE.md** | Claude puede ignorar | Tú (texto orientativo) |

**Regla de decisión:** si algo **debe** cumplirse siempre → hook. Si algo **debería** cumplirse → CLAUDE.md o skill.

## Los 4 tipos de hooks

| Hook | Cuándo se dispara | Uso principal |
|---|---|---|
| **PreToolUse** | Antes de ejecutar una herramienta | Validar, bloquear o modificar la acción |
| **PostToolUse** | Después de ejecutar una herramienta | Formatear, auditar, ejecutar side-effects |
| **Notification** | Cuando Claude genera una notificación | Alertas de escritorio, integración con Slack |
| **Stop** | Cuando Claude decide que terminó | Verificar que el trabajo está completo |

*Contenido completo con 7 ejemplos prácticos, debugging y 9 pitfalls comunes — próximamente.*
