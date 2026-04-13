---
title: "Prompting: hablar con Claude para que funcione"
description: "System prompts, CLAUDE.md, XML tags, adaptive thinking, effort — las técnicas que de verdad mueven la aguja."
sidebar:
  order: 4
---

No es lo mismo pedir algo a Claude que pedirlo *bien*. La diferencia entre un resultado mediocre y uno brillante no es el modelo — es cómo le das contexto, estructura y dirección. Este capítulo es la guía de cómo hablar con Claude para sacarle el máximo.

## La regla de oro

> Muéstrale tu prompt a un compañero que no conoce el proyecto. Si se confunde, Claude también se va a confundir.

Claude responde bien a instrucciones claras y explícitas. No insinúes — di exactamente qué quieres. Si necesitas que sea ambicioso, dilo. Si necesitas que sea conciso, dilo. Claude no lee entre líneas tan bien como crees.

| Prompt débil | Prompt fuerte | Por qué |
|---|---|---|
| "Mejora esta función" | "Refactoriza esta función para reducir complejidad ciclomática. Mantén la API pública." | Específico, con restricciones |
| "Haz un dashboard" | "Crea un dashboard analytics con chart de barras, filtro por fecha y tabla de datos. Usa Plotly." | Define entregables concretos |
| "Revisa el código" | "Busca vulnerabilidades de SQL injection y XSS en los endpoints de auth. Ignora estilos." | Alcance acotado, criterio claro |

## Las 7 técnicas que funcionan con Claude

### 1. Sé directo y específico

Claude es como un empleado brillante que acaba de llegar. Tiene capacidad de sobra pero no conoce tus normas ni tu contexto. Cuanto más preciso seas, mejor el resultado.

```
❌ "Haz algo con los tests"
✅ "Ejecuta los tests de auth, corrige los que fallen por el cambio de schema de ayer, y genera un informe de cobertura"
```

Usa listas numeradas cuando el orden importa. Usa bullet points cuando no.

### 2. Usa XML tags para estructurar

Las XML tags eliminan ambigüedad. Cuando mezclas instrucciones, contexto, ejemplos y datos, las tags le dicen a Claude qué es qué.

```xml
<contexto>
Estamos construyendo una API REST para gestión de inventario.
El stack es Node.js + Express + PostgreSQL.
</contexto>

<instrucciones>
1. Crea el endpoint POST /productos con validación de schema
2. Usa transacciones para insertar en productos + historial
3. Devuelve 201 con el producto creado
</instrucciones>

<restricciones>
- No uses ORM — queries SQL directas con pg
- Sigue el patrón de error handling del archivo routes/auth.js
</restricciones>
```

**Tags comunes y cuándo usarlas:**

| Tag | Cuándo |
|---|---|
| `<instrucciones>` | Lo que Claude debe hacer |
| `<contexto>` | Background que necesita para entender |
| `<ejemplo>` / `<ejemplos>` | Multishot prompting (ver técnica 4) |
| `<restricciones>` | Lo que NO debe hacer o límites |
| `<formato>` | Cómo quieres el output |
| `<documentos>` | Documentos largos como input |

:::tip[Los documentos largos van arriba]
Si pasas un documento grande (specs, log, CSV), ponlo al principio del prompt, antes de las instrucciones. Poner la query al final puede mejorar la calidad hasta un 30% según las pruebas internas de Anthropic.
:::

### 3. Dale un rol

Un rol enfoca el tono, el nivel de detalle y el tipo de respuesta. Una sola frase marca la diferencia.

```
Eres un arquitecto de software senior con 15 años de experiencia en sistemas
distribuidos. Evalúas trade-offs con rigor y siempre justificas tus decisiones
con datos o experiencia concreta.
```

En Claude Code, el rol lo defines en el **system prompt** (CLAUDE.md o la primera instrucción de tu skill). No necesitas repetirlo en cada mensaje.

### 4. Multishot prompting — enséñale con ejemplos

Los ejemplos son la forma más fiable de controlar formato, tono y estructura. 3-5 ejemplos bien elegidos cambian completamente el output.

```xml
<ejemplos>
<ejemplo>
<input>Error: conexión rechazada al servidor de BD</input>
<output>
**Diagnóstico:** El servidor PostgreSQL no responde en el puerto 5432.
**Causa probable:** Servicio detenido o firewall bloqueando.
**Acción:** Verificar `systemctl status postgresql` y revisar reglas de firewall.
</output>
</ejemplo>

<ejemplo>
<input>Error: token JWT expirado</input>
<output>
**Diagnóstico:** El access token ha superado su TTL configurado.
**Causa probable:** Sesión larga sin refresh automático.
**Acción:** Verificar lógica de refresh token en el middleware de auth.
</output>
</ejemplo>
</ejemplos>

Ahora diagnostica este error: {{ERROR_DEL_USUARIO}}
```

Los ejemplos deben ser **diversos** (cubrir edge cases) y **relevantes** (similares al caso real). Si solo pones ejemplos simples, Claude responderá de forma simple.

### 5. Di qué hacer, no qué NO hacer

Claude responde mejor a instrucciones positivas que a prohibiciones.

```
❌ "No uses markdown en la respuesta"
✅ "Escribe en prosa fluida con párrafos. Sin listas, sin negritas, sin headers."

❌ "No seas verboso"
✅ "Responde en máximo 3 frases."
```

Si necesitas evitar algo muy específico, combina la prohibición con la alternativa:

```
No uses ellipsis (...) porque la respuesta se va a leer con text-to-speech
y no sabe pronunciarlos. Usa puntos completos.
```

### 6. Pide que cite antes de razonar

Para documentos largos, pedir que extraiga citas relevantes antes de responder mejora mucho la calidad. Claude se ancla en el texto real en vez de alucinar.

```
Primero, extrae las citas del documento que son relevantes para la pregunta.
Ponlas en <citas></citas>.
Después, responde basándote solo en esas citas.
```

### 7. Pide que se auto-verifique

```
Antes de terminar, verifica tu respuesta contra estos criterios:
1. ¿El código compila sin errores?
2. ¿Cubre el edge case de usuario no autenticado?
3. ¿Sigue el patrón de error handling del proyecto?
```

Esto funciona especialmente bien en código y matemáticas. Claude detecta sus propios errores si le das los criterios de verificación.

## CLAUDE.md — tu system prompt persistente

En Claude Code, no necesitas repetir instrucciones en cada sesión. **CLAUDE.md es tu system prompt que Claude lee automáticamente** al abrir el proyecto.

### Anatomía de un buen CLAUDE.md

```markdown
# Proyecto: API de Inventario

## Contexto
API REST para gestión de inventario de almacenes. Node.js + Express + PostgreSQL.
Desplegado en AWS ECS. CI/CD con GitHub Actions.

## Convenciones
- Código en inglés, commits y docs en español
- Error handling centralizado en middleware/errors.js
- Validación con Zod en cada endpoint
- Tests con Vitest — cobertura mínima 80%

## Arquitectura
- routes/ → definición de endpoints
- services/ → lógica de negocio (nunca acceso directo a BD aquí)
- repositories/ → queries SQL con pg
- middleware/ → auth, validation, error handling

## Lo que NO hacer
- No usar ORM — queries SQL directas
- No commitear .env — usar variables de entorno
- No añadir dependencias sin justificar en el PR

## Cómo trabajo
- Branch por feature, PR con descripción
- Tests antes de commit
- Prefiero refactoring pequeño y frecuente a reescrituras grandes
```

**Extensión ideal:** 60-100 líneas. Lo suficiente para dar contexto sin diluir la señal. Si necesitas más detalle, usa `.claude/rules/` con archivos temáticos.

Para detalle completo de la jerarquía de configuración (6 niveles, auto-memoria, prioridad de instrucciones), ver [Configura tu proyecto →](/empezar/configuracion/).

## Thinking — cómo Claude razona

### Adaptive thinking (modelos 4.6)

Los modelos Claude 4.6 usan **adaptive thinking**: Claude decide dinámicamente cuándo y cuánto razonar según la complejidad de la petición. No necesitas configurar nada — es el comportamiento por defecto.

| Nivel de effort | Comportamiento | Cuándo usarlo |
|---|---|---|
| **max** | Razonamiento máximo sin restricciones. Más tokens, más profundidad | Problemas que requieren el análisis más profundo posible |
| **high** (default) | Claude casi siempre piensa profundamente | Razonamiento complejo, coding difícil, tareas agénticas |
| **medium** | Pensamiento moderado. Puede saltarse thinking en queries simples | Balance velocidad/calidad. **Recomendado para Sonnet 4.6 en producción** |
| **low** | Mínimo thinking. Prioriza velocidad | Tareas simples, alto volumen, subagentes |

En Claude Code, controlas esto con `/model` (elige modelo) y el parámetro de esfuerzo. En la API:

```python
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=16000,
    thinking={"type": "adaptive"},
    output_config={"effort": "medium"},
    messages=[{"role": "user", "content": "..."}],
)
```

:::tip[La evolución del thinking]
Los modelos anteriores (Sonnet 4.5, Opus 4.5) usaban `budget_tokens` para controlar cuánto pensaba Claude — tú fijabas un presupuesto fijo de tokens de razonamiento. Los modelos 4.6 reemplazaron esto por adaptive thinking + effort, que es más inteligente: Claude calibra su razonamiento según la dificultad real de cada query. `budget_tokens` sigue funcionando pero está deprecado.
:::

### Interleaved thinking

Con adaptive thinking activado, Claude puede **pensar entre tool calls** — no solo al principio. Esto es clave para workflows agénticos donde Claude ejecuta una herramienta, reflexiona sobre el resultado, y decide el siguiente paso.

En Claude Code esto sucede automáticamente. No necesitas configurar nada.

### Cuándo NO necesitas thinking

Para tareas simples (clasificación, lookup rápido, formateo), el thinking añade latencia sin valor. Si estás construyendo una app con la API:

```python
# Sin thinking — máxima velocidad
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=4096,
    thinking={"type": "disabled"},
    output_config={"effort": "low"},
    messages=[{"role": "user", "content": "Clasifica este email: spam o no spam"}],
)
```

## Prefill — arrancar la respuesta de Claude

*(Solo modelos anteriores a 4.6 — en 4.6 está deprecado)*

La técnica de prefill consiste en poner texto en el último mensaje `assistant` para forzar un formato de salida. En modelos 4.6, ya no se necesita:

| Lo que hacías con prefill | Cómo hacerlo ahora |
|---|---|
| Forzar JSON output | [Structured Outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) o pedir el formato explícitamente |
| Eliminar preámbulos ("Aquí tienes...") | System prompt: "Responde directamente sin preámbulo" |
| Continuar respuesta cortada | "Tu respuesta anterior terminó en `[texto]`. Continúa desde ahí." |
| Evitar negativas innecesarias | Claude 4.6 gestiona esto mucho mejor. Prompting claro basta |

## Errores comunes que todos cometemos

| Error | Por qué falla | Solución |
|---|---|---|
| **Prompt de 2.000 palabras** | Demasiada señal compite entre sí. Claude no sabe qué priorizar | Menos es más. Instrucciones concisas + ejemplos > párrafos explicativos |
| **"Sé creativo"** | Demasiado vago. Claude no sabe qué tipo de creatividad quieres | "Genera 3 enfoques alternativos para el naming del componente. Uno convencional, uno disruptivo, uno minimalista" |
| **Prohibiciones sin alternativa** | "No hagas X" deja un vacío. Claude no sabe qué hacer en su lugar | "En vez de X, haz Y porque Z" |
| **Copiar prompts de internet** | Los prompts virales están optimizados para casos genéricos, no para tu contexto | Escribe tu propio prompt. Itera. Los mejores prompts nacen de 3-4 versiones |
| **Ignorar el effort** | Usar effort high para todo quema tokens y tiempo | Medium para el 80% del trabajo. High/max solo para razonamiento complejo |
| **System prompt que dice "eres útil y respetuoso"** | Claude ya lo es. Estás gastando tokens diciendo lo obvio | Usa el system prompt para contexto específico: stack, convenciones, restricciones |
| **Over-prompting en modelos 4.6** | Lo que servía para modelos anteriores ahora causa overtriggering. "SIEMPRE usa esta tool" → Claude la usa para todo | Lenguaje normal: "Usa esta tool cuando necesites X". Sin mayúsculas, sin urgencia |

:::danger[El error más caro]
Tratar a Claude como un buscador sofisticado. Claude es un **agente** — no le preguntes cosas, pídele que haga cosas. "¿Cómo haría un endpoint de auth?" consume tokens sin valor. "Crea el endpoint de auth siguiendo el patrón de routes/users.js" produce resultado directo.
:::

## Prompt engineering para CLAUDE.md — patrones probados

### El patrón de contexto motivado

No solo digas qué hacer — explica por qué. Claude generaliza mejor con motivación.

```markdown
## Formato de commits
Usa conventional commits (feat:, fix:, chore:) porque el changelog se genera
automáticamente con semantic-release y necesita parsear el tipo de commit.
```

Es más efectivo que solo `"Usa conventional commits"` porque Claude entiende el *por qué* y puede tomar mejores decisiones en edge cases.

### El patrón de anti-pattern

Documenta errores que Claude comete repetidamente en tu proyecto.

```markdown
## Errores conocidos de Claude en este proyecto
- TIENDE a añadir `try/catch` redundantes. El middleware de errores ya captura todo.
- TIENDE a crear archivos helpers/ innecesarios. Preferimos funciones inline si se usan una sola vez.
- TIENDE a generar tests demasiado acoplados al implementation detail. Los tests deben probar comportamiento, no estructura interna.
```

### El patrón de decisiones ya tomadas

Evita que Claude reabra debates cerrados.

```markdown
## Decisiones arquitectónicas (no reabrir)
- **SQL directo, no ORM:** Decidido en sprint 3. Razón: queries complejas con CTEs que ningún ORM maneja bien.
- **Monorepo:** Decidido al inicio. No migrar a multirepo.
- **Vitest sobre Jest:** Más rápido, mejor ESM support.
```

## Siguiente paso

Ya sabes instalar, configurar y hablar con Claude. El siguiente nivel es **automatizar**: que las cosas pasen sin que tú las pidas.

[Hooks: automatización que no falla →](/automatizar/hooks/)
