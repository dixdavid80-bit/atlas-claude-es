---
title: "Skills: workflows reutilizables"
description: Crear, validar y compartir skills — el mecanismo de Claude Code para encapsular workflows.
---

:::note[En desarrollo]
Este capítulo está en construcción activa.
:::

## Qué es una skill

Una skill es un conjunto de instrucciones + assets que Claude Code carga cuando las necesita. A diferencia de CLAUDE.md (que se carga siempre), las skills se activan bajo demanda — cuando el usuario las invoca con `/nombre` o cuando Claude detecta que aplican.

Piensa en una skill como una **receta encapsulada**: incluye las instrucciones, los scripts helper, los templates de output, y los gotchas conocidos.

## Las 9 categorías oficiales de Anthropic

| Categoría | Qué hace | Ejemplo |
|---|---|---|
| Library & API Reference | Documentación con gotchas y snippets | billing-lib, frontend-design |
| Product Verification | Testing y verificación de output | playwright assertions, visual tests |
| Data Fetching & Analysis | Conexión a datos y monitoreo | funnel-query, grafana |
| Business Process | Automatizar workflows repetitivos | standup-post, weekly-recap |
| Code Scaffolding | Generar boilerplate específico | new-workflow, new-migration |
| Code Quality & Review | Reforzar calidad de código | adversarial-review, code-style |
| CI/CD & Deployment | Gestión de PRs, deploys, rollbacks | babysit-pr, deploy-service |
| Runbooks | De síntoma a reporte estructurado | service-debugging, oncall-runner |
| Infrastructure Ops | Mantenimiento con guardrails | resource-orphans, cost-investigation |

*Contenido completo con tutorial "tu primera skill", gold standard template, distribución en equipos y patrón Autoresearch — próximamente.*
