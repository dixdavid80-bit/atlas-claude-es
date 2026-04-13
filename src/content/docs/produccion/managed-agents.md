---
title: "Managed Agents: deploy a producción"
description: Desplegar agentes cloud-hosted con infraestructura gestionada por Anthropic.
---

:::note[En desarrollo]
Este capítulo está en construcción activa.
:::

## Qué son los Managed Agents

Managed Agents es la suite de APIs de Anthropic para desplegar agentes en producción sin montar tu propia infraestructura. Resuelve lo que normalmente lleva meses: sandboxing seguro, checkpointing, gestión de credenciales, permisos con scope, y recuperación de errores.

| Concepto | Qué es |
|---|---|
| **Agent** | Definición reutilizable: modelo + system prompt + tools. Versionado inmutable. |
| **Environment** | Sandbox con dependencias preinstaladas. Stateless, reutilizable entre sesiones. |
| **Session** | Instancia ephemeral donde el agente trabaja. Monta archivos, ejecuta, produce output. |
| **Vault** | Colección de credenciales por usuario final. Inyecta tokens OAuth sin que el agente los vea. |

**Pricing:** tarifas estándar de tokens + $0.08/session-hour de runtime activo.

*Contenido completo con arquitectura de vaults, 5 primitivos (Environments, Files API, Toolset, Versioning, Persistencia), 6 patrones canónicos de cookbooks oficiales, gaps conocidos del beta, y tabla de decisión "¿Managed Agents o Agent SDK local?" — próximamente.*
