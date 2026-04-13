---
title: "Modelos y coste: optimizar sin perder calidad"
description: Aliases de modelo, effort levels, compaction estratégica y el Monitor tool.
---

:::note[En desarrollo]
Este capítulo está en construcción activa.
:::

## La decisión más frecuente

El 80% de las veces que usas Claude Code, la pregunta real es: *"¿uso Opus (potente y caro) o Sonnet (rápido y barato)?"*. La respuesta corta: **Sonnet para el día a día, Opus cuando la tarea lo requiera**.

| Modelo | Cuándo usarlo | Comando |
|---|---|---|
| **Sonnet** | Edición, tareas directas, trabajo general | `/model sonnet` |
| **Opus** | Arquitectura, debugging profundo, decisiones complejas | `/model opus` |
| **Haiku** | Tareas simples, bajo presupuesto | `/model haiku` |
| **opusplan** | Opus piensa, Sonnet ejecuta (lo mejor de ambos) | `/model opusplan` |

*Contenido completo con effort levels, strategic compaction, Monitor tool (event-driven vs polling), Auto Mode, pricing por modelo y aritmética real de costes — próximamente.*
