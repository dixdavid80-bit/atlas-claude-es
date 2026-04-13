---
title: "MCP: conectar con el mundo exterior"
description: Model Context Protocol — el estándar que permite a Claude conectar con servicios externos.
---

:::note[En desarrollo]
Este capítulo está en construcción activa.
:::

## Qué es MCP

MCP (Model Context Protocol) es un protocolo abierto que estandariza cómo Claude se conecta con herramientas y datos externos. La analogía más directa: es el **"USB-C para IA"** — una interfaz universal que reemplaza integraciones ad-hoc.

Sin MCP, Claude solo puede trabajar con lo que tiene en tu máquina local (archivos, terminal, git). Con MCP, Claude puede hablar con GitHub, Slack, bases de datos, Google Drive, y cientos de servicios más — directamente desde tu sesión.

## Los 4 patrones de uso más comunes

| Patrón | Qué hace | Ejemplo |
|---|---|---|
| **Database-as-context** | Claude explora tu BD, entiende schemas, escribe queries | MCP de Postgres para debugging |
| **API wrapper** | Claude opera servicios externos como herramientas | MCP de GitHub para crear PRs |
| **Filesystem extendido** | Claude accede a documentos en plataformas cloud | MCP de Google Drive para leer specs |
| **DevOps automation** | Claude inspecciona y opera infraestructura | MCP de Docker para gestionar containers |

*Contenido completo con tutorial "tu primer MCP en 5 minutos", catálogo de 13 servidores oficiales, configuración, permisos y troubleshooting — próximamente.*
