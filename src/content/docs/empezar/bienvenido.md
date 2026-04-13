---
title: Bienvenido al Atlas
description: Qué es Claude, qué es Claude Code, y para quién es esta guía.
sidebar:
  order: 1
---

## Qué es Claude

Claude es la familia de modelos de inteligencia artificial de Anthropic. Hay tres formas principales de usarlo:

| Producto | Para quién | Qué hace |
|---|---|---|
| **Claude.ai** | Cualquiera | Chat web — conversaciones, documentos, análisis. Como ChatGPT pero de Anthropic |
| **Claude Code** | Desarrolladores y profesionales técnicos | CLI que trabaja directamente en tu proyecto — lee archivos, ejecuta comandos, escribe código, gestiona git |
| **Claude API** | Developers que construyen productos | API para integrar Claude en tus propias aplicaciones |

**Este Atlas se centra en Claude Code y el ecosistema técnico que lo rodea.** Si buscas usar Claude.ai como chat, los docs oficiales de Anthropic son mejor punto de partida.

## Qué es Claude Code

Claude Code es una herramienta de línea de comandos (CLI) que convierte a Claude en tu compañero de desarrollo. No es un chatbot — es un **agente que trabaja dentro de tu proyecto**:

- Lee y entiende tu código
- Ejecuta comandos en tu terminal
- Edita archivos con precisión
- Gestiona git (commits, branches, PRs)
- Se conecta con servicios externos via MCP
- Se puede automatizar con hooks, skills y agentes

Lo instalas, lo apuntas a tu proyecto, y trabaja contigo. No necesitas copiar y pegar código de un chat — Claude Code edita directamente tus archivos.

## Para quién es este Atlas

- **Si estás empezando con Claude Code** → sigue el camino guiado desde el [siguiente capítulo](/empezar/primer-proyecto/)
- **Si ya usas Claude Code y quieres profundizar** → navega directamente al tema que te interese en la barra lateral
- **Si evalúas Claude Code para tu equipo o empresa** → los capítulos de [Escalar](/escalar/agentes/) y [Producción](/produccion/managed-agents/) te interesan

## Qué NO es este Atlas

- No es una traducción de la documentación oficial (aunque la referencia cuando es relevante)
- No es un tutorial paso a paso de programación (asumimos que sabes lo básico de terminal y git)
- No cubre Claude.ai (web) ni Cowork en profundidad — eso vendrá más adelante

## Modelos disponibles (abril 2026)

| Modelo | Uso principal | Contexto |
|---|---|---|
| **Claude Opus 4.6** | Razonamiento complejo, arquitectura, tareas difíciles | 1M tokens |
| **Claude Sonnet 4.6** | Trabajo diario, edición, tareas estándar | 1M tokens |
| **Claude Haiku 4.5** | Tareas rápidas y simples, bajo coste | 200K tokens |

En Claude Code puedes cambiar de modelo en cualquier momento con `/model`. Por defecto usa el mejor disponible según tu plan.

## Siguiente paso

[Tu primer proyecto con Claude Code →](/empezar/primer-proyecto/)
