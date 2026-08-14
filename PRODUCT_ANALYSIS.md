# rensei + kata — Análisis de producto

> De framework local a paquete `npx` configurable, evaluable y automejorable.
> Fecha: 2026-08-12 · Estado: propuesta para revisión

---

## 1. Estado actual (qué es rensei y kata hoy)

**rensei (錬成)** es la metodología: un loop de ingeniería de 9 fases (+ fase D de diseño) donde cada fase tiene agente, modelo y nivel de esfuerzo asignados:

```
gate → [design] → analyze → plan → implement → self-critique → spec-review → quality-review → correct → integrate
```

**kata (型)** es el dispatcher: lee la petición del usuario (español o inglés), la compara contra patrones de triggers y rutea al agente correcto sin que el usuario necesite conocer la metodología.

Los activos actuales:

| Activo | Rol |
|---|---|
| `agents/*.md` (6 agentes con frontmatter) | Definiciones de agentes para Claude Code |
| `commands/rensei.md`, `commands/kata.md` | Slash commands: cargar metodología / rutear |
| `METHODOLOGY.md`, `DECISION_FRAMEWORK.md`, `MODEL_ROUTING.md` | Documentos normativos del loop |
| `rules/loop-engineering.md` | Reglas always-on |
| `prompts/*.md` | Plantillas reutilizables (tool-agnostic) |
| `claude/CLAUDE.md` | "El cerebro" importable |
| `install.sh`, `setup-*.sh` | Instalación por copia/symlink |
| `opencode/`, `opencode-kimi/` | Capa de compatibilidad manual con otros runtimes |

### Deuda técnica detectada (conviene resolver antes de empaquetar)

1. **`install.sh` está roto respecto al contenido real.** Instala y anuncia comandos `/loop-*` (loop-full, loop-analyze…) que no existen en `commands/` — solo existen `rensei.md` y `kata.md`.
2. **Nombres divergentes en 3 dialectos:** el README habla de `@spec-gate`, `@implementer`, `@code-reviewer`, `@security-auditor`, `@designer-uiux`; los archivos reales son `gate`, `builder`, `reviewer`, `sentinel`, `designer`; SETUP.md copia archivos `spec-gate.md`, `implementer.md`… que no existen. Cualquier instalación siguiendo SETUP.md falla.
3. **CONFIG duplicada en 3 lugares** (CLAUDE.md, METHODOLOGY.md, SETUP.md) → deriva garantizada.
4. **`prompts/` huérfano:** ningún agente referencia las plantillas.
5. **Bash-only:** en Windows (este entorno) los scripts no corren nativamente.
6. **Sin versionado, sin tests, sin telemetría, sin mecanismo de update.** Instalar hoy = copiar archivos y quedar congelado en el tiempo.

Esta deuda es, en realidad, el mejor argumento para el producto: casi todo lo que hoy está roto o duplicado se resuelve con una **fuente única de verdad + un compilador**.

---

## 2. Visión de producto

```
npx rensei-kata init        → instala el workflow en el proyecto (o --global)
npx rensei-kata build       → compila el grafo a agentes/comandos/configs
npx rensei-kata add-agent   → admite un agente nuevo tras evaluar su valor
npx rensei-kata eval        → evalúa desempeño de agentes con telemetría
npx rensei-kata evolve      → propone mejoras a config/grafo de ESTE entorno
npx rensei-kata bench       → A/B testing de configuraciones con tareas doradas
npx rensei-kata doctor      → salud: deriva de config, grafo inválido, drift
npx rensei-kata diff        → qué cambió entre tu versión y la última
```

**Principio rector: el grafo es la única fuente de verdad.**

Los archivos `.md` de agentes, los slash commands, el snippet de CLAUDE.md y las configs de cada runtime dejan de ser artefactos editados a mano y pasan a ser **artefactos compilados** desde cuatro fuentes:

```
rensei.graph.yaml      ← nodos (fases), edges (transiciones), gates (condiciones)
rensei.config.yaml     ← modelos, esfuerzo, iteraciones, herramientas (SDD, diseño)
agents/<n>/agent.yaml  ← identidad: modelo, tools, skills, triggers ES/EN, modos
agents/<n>/prompt.md   ← el prompt base del agente
fragments/*.md         ← protocolos compartidos (self-critique, quality gates, comunicación)
targets/<runtime>/     ← adaptadores: claude-code, opencode, (futuro: cursor, ci)
```

`rensei build` (corre en postinstall y bajo demanda) materializa todo. Esto responde directamente a tu requisito: **"agentes configurables mediante grafos y que las modificaciones se reflejen en el agente"** — editas el grafo o el `agent.yaml`, corres `build`, y el agente generado refleja el cambio. Además, los diagramas HTML que ya tienes (`rensei-kata-graph.html`) pasarían a *generarse* desde el grafo en vez de dibujarse a mano.

### Ejemplo de grafo

```yaml
nodes:
  gate:          { agent: gate,      model: balanced,       effort: fast }
  design:        { agent: designer,  model: deep_reasoning, effort: deep, when: "visual == yes" }
  analyze:       { agent: architect, model: deep_reasoning, effort: deep }
  plan:          { agent: architect, model: balanced,       effort: standard }
  implement:     { agent: builder,   model: routine,        effort: fast }
  self-critique: { agent: builder,   model: deep_reasoning, effort: deep }
  spec-review:   { agent: reviewer,  model: balanced,       effort: standard }
  quality:       { agent: reviewer,  model: balanced,       effort: standard }
  correct:       { agent: builder,   model: routine,        effort: fast }
  integrate:     { agent: architect, model: balanced,       effort: standard }

edges:
  - { from: gate,     to: design,        when: "visual" }
  - { from: gate,     to: analyze,       when: "!visual" }
  - { from: quality,  to: correct,       when: "issues",  max: "$ITERATIONS.correction_loop" }
  - { from: quality,  to: integrate,     when: "approved" }
  - { from: correct,  to: self-critique }

gates:
  implement→self-critique: "tests pass AND commits clean"
  self-critique→spec-review: ">= 2 issues found and fixed"
```

Tener el loop como dato (no como prosa) habilita cuatro cosas que hoy son imposibles: **validarlo** (detectar ciclos infinitos sin `max`, nodos huérfanos, gates sin condición), **visualizarlo**, **ejecutarlo** (un runner headless que camine el grafo) y **traducirlo** a cualquier runtime.

---

## 3. Agregar un agente nuevo: evaluación de valor (`add-agent`)

Tu requisito: *"si quisiera agregar un agente nuevo, se evalúe si el agente aporta algo"*. Propuesta: protocolo de admisión de 4 filtros, ejecutado por el CLI con ayuda del propio LLM:

### Filtro 1 — Singularidad (¿es realmente un agente nuevo?)
El grafo mantiene una **matriz de responsabilidades** (qué decide/produce cada agente). Si el candidato solapa >60% con uno existente, la recomendación es registrarlo como **modo** de ese agente (como architect ya tiene analyze/plan/integrate), no como nodo nuevo. Regla: un nodo nuevo debe diferir en al menos una de — responsabilidad, tier de modelo/esfuerzo, toolkit, o gate de calidad que habilita.

### Filtro 2 — Routing (¿kata puede distinguirlo?)
kata indexa los triggers ES/EN de todos los agentes. El CLI detecta **colisiones de triggers** entre el candidato y los existentes y exige vocabulario distintivo. Si dos agentes comparten triggers, kata gana una regla de desempate explícita.

### Filtro 3 — Economía (¿justifica su costo?)
Cada nodo tiene costo de tokens por invocación según su tier. El CLI estima el costo incremental del loop con el nuevo nodo y lo contrasta con el gate de calidad que añade. Un agente que no protege ningún gate es sospechoso de ser ruido.

### Filtro 4 — Periodo de prueba (shadow mode)
El agente admitido entra como **nodo opcional/probatorio**. La telemetría registra: cuántas veces kata lo elige, tasa de éxito de sus salidas en review, y cuánto rework evita. Tras N usos, `rensei eval` emite veredicto: **promover** (nodo permanente), **fusionar** (convertir en modo de otro agente) o **eliminar**. Ningún agente es permanente por decreto — ni los 6 actuales.

Esto último es importante: el mismo mecanismo que admite agentes nuevos sirve para **podar** agentes que no aportan, evitando la inflación de agentes que aqueja a estos frameworks.

---

## 4. Automejora: rensei que se evalúa y se mejora en su entorno

Tres mecanismos, en orden creciente de riesgo (y de valor):

### 4.1 Telemetría local (base de todo)
`.rensei/metrics.jsonl` — un evento por transición de fase: timestamp, fase, agente, modelo, esfuerzo, duración, tokens estimados, resultado del gate (pass/fail), # de hallazgos en review, ciclos de corrección consumidos. **Nunca sale de la máquina** salvo opt-in explícito. Sin este dato, cualquier "mejora" es adivinanza.

### 4.2 `@evaluator` + `rensei evolve` (el agente meta — propuesta de agente nuevo n.º 7)
Un agente cuyo único sujeto de estudio es **el propio workflow**. Periódicamente (o bajo demanda) lee métricas + historial git + hallazgos de review del repo actual y propone cambios concretos *para este entorno*:

- *"builder/haiku falla quality-review el 45% de las veces en este repo → subir `implement` a `balanced` solo aquí."*
- *"self-critique reporta 0 issues en el 60% de las corridas → el fragmento se está ignorando; reforzar o cambiar modelo."*
- *"el 80% de las peticiones son bugfixes chicos → gate recomienda `skip` casi siempre; considerar umbral más agresivo de `light`."*

Formato de salida: **propuesta con diff**, nunca aplicación silenciosa. La mejora es *por entorno*: cada proyecto termina con una config calibrada a su realidad, que es exactamente lo que pediste ("se mejora a sí misma en el entorno en el que se trabaja").

### 4.3 `rensei bench` (convierte la mejora en medición)
Suite de **tareas doradas** por tipo de proyecto (un bug con causa conocida, un CRUD, una feature multi-capa, un refactor arquitectónico…). Permite A/B real de configuraciones: *¿la propuesta del evaluator mejora la tasa de first-pass review sin disparar el costo?* Sin bench, la automejora degenera en deriva de prompts por intuición.

### Guardarraíles (críticos en un sistema automejorable)
- Todo cambio es un **diff versionado**: `rensei diff`, `rensei rollback`.
- Auto-apply solo opt-in y solo para knobs de bajo riesgo (niveles de esfuerzo, umbrales). **Nunca** para prompts ni para la estructura del grafo.
- Los cambios al core se proponen como PR contra el repo del framework, no se autoescriben.
- Riesgo Goodhart: si se optimiza una métrica ("menos hallazgos en review"), el sistema puede aprender a reportar menos. El evaluator debe mirar métricas **en par** (hallazgos en review *y* bugs que llegan a integrate).

---

## 5. Ventajas y desventajas

### Ventajas
1. **Reproducibilidad y versionado:** la metodología deja de ser una copia congelada; `npm update` actualiza el framework como cualquier dependencia, con semver y changelog.
2. **Fuente única de verdad:** se acaba la deriva entre README/SETUP/CLAUDE.md — todo se compila del grafo.
3. **Multi-runtime real:** los adaptadores traducen el mismo grafo a Claude Code, OpenCode y (futuro) otros. Hoy la capa OpenCode es manual y ya está desactualizada.
4. **Cross-platform:** el CLI en Node elimina la dependencia de bash (hoy no funciona nativamente en Windows).
5. **Adaptación por entorno medible:** telemetría + evaluator + bench = mejora continua con evidencia, no con vibes.
6. **Gobernanza de agentes:** admisión y poda formales evitan la inflación de agentes.
7. **Distribución trivial:** `npx rensei-kata init` es la fricción mínima posible; `rensei-kata` está disponible en npm (verificado: `rensei` a secas ya está ocupado).

### Desventajas y riesgos
1. **Complejidad añadida:** hoy son ~15 archivos markdown que cualquiera entiende; el compilador es software que hay que mantener. Mitigación: el compilador es deliberadamente tonto (plantillas + YAML), y los artefactos generados siguen siendo markdown legible.
2. **Overhead del loop en tareas triviales:** 9 fases para cambiar un color es absurdo. Ya mitigado por diseño (gate decide `skip`), pero hay que protegerlo: kata debe poder ir directo a un agente sin cargar el loop completo.
3. **Ruteo no determinista:** kata depende del LLM interpretando triggers; dos corridas pueden rutear distinto. Mitigación: kata siempre declara su elección y razón (ya lo hace), y la telemetría mide la tasa de correcciones de ruteo del usuario.
4. **Deriva por automodificación:** un sistema que se reescribe puede degradarse silenciosamente. Mitigación: bench + aprobación humana + rollback. Este es el riesgo n.º 1 del diseño.
5. **Costo de tokens:** más fases y un evaluator periódico cuestan dinero. El presupuesto por fase que ya existe en MODEL_ROUTING.md debe convertirse de consejo a enforcement medido por la telemetría.
6. **Acoplamiento al formato de Claude Code:** frontmatter, slash commands y rules son de Claude Code; cada runtime nuevo exige un adaptador. El grafo lo acota, pero no lo elimina.
7. **Seguridad:** los agentes generados declaran tools; el grafo debe imponer **mínimo privilegio** por agente (gate solo lee, sentinel no escribe, etc. — los frontmatter actuales ya apuntan bien).

---

## 6. Escalamiento futuro

| Horizonte | Qué habilita |
|---|---|
| **Config por capas** | core → usuario (`~/.rensei`) → equipo (`.rensei/` en el repo, commiteada) → sesión. El equipo comparte su calibración como código. |
| **Registry de plugins** | `npx rensei-kata add rensei-agent-db` — agentes de terceros que pasan por el mismo protocolo de admisión. |
| **Subgrafos componibles** | el loop completo es un subgrafo; equipos publican los suyos (ej. "loop de data engineering"). |
| **Más runtimes** | Cursor, Windsurf, Aider, y **CI**: reviewer + sentinel corriendo en GitHub Actions sobre cada PR — el grafo ya describe cómo. |
| **Ejecutor headless** | `rensei run "feature X"` camina el grafo invocando `claude -p` / `opencode run` por fase. Tu `opencode-kimi/loop.sh` ya es el prototipo de esto. |
| **Telemetría agregada opt-in** | defaults calibrados por la comunidad: qué tier de modelo rinde mejor por fase *en promedio*, alimentando el config inicial. |
| **Versionado del grafo** | `rensei migrate` actualiza configs de equipos entre versiones del framework, como las migraciones de una DB. |

---

## 7. Adiciones útiles que propongo (más allá de lo pedido)

1. **`@evaluator` (agente n.º 7)** — ya descrito; es el que cierra el ciclo de automejora. Debe pasar por el mismo protocolo de admisión que cualquier agente.
2. **`kata doctor`** — health check: detecta deriva entre CLAUDE.md/CONFIG/agentes, grafo inválido, agentes sin usar en 30 días. (Hoy detectaría de inmediato que `install.sh` y `SETUP.md` referencian archivos inexistentes.)
3. **Hooks de ciclo de vida** — un `Stop`/`PostToolUse` hook que recuerde self-critique antes de dar por terminada una tarea de builder; la disciplina deja de depender de la memoria del modelo.
4. **Memoria por proyecto** — `.rensei/memory/` donde el loop registra decisiones y correcciones recurrentes del usuario; el evaluator la usa para calibrar kata (aprendizaje de triggers: cuando el usuario corrige un ruteo, ese trigger se registra).
5. **Presupuesto de tokens por fase** enforzado y reportado — la tabla de costos de MODEL_ROUTING.md convertida en límite real.
6. **Modo kata-lite** — para peticiones triviales, kata rutea sin cargar la metodología completa en contexto (ahorro de tokens en cada sesión).
7. **`rensei diff`** — antes de un update, muestra qué prompts/configs cambian, para que actualizar nunca sea un salto de fe.

---

## 8. Roadmap sugerido

| Fase | Contenido | Criterio de salida |
|---|---|---|
| **0 — Saneamiento** | Unificar nombres (un solo dialecto), arreglar `install.sh`/SETUP.md, consolidar CONFIG en un archivo, conectar `prompts/` con los agentes | Instalación manual funciona al 100% siguiendo el README |
| **1 — Paquete mínimo** | `package.json` con bin, CLI Node con `init` + `build` (target claude-code), cross-platform, publicado como `rensei-kata` | `npx rensei-kata init` deja un proyecto listo en Windows y Unix |
| **2 — Grafo como fuente de verdad** | `rensei.graph.yaml` + compilador + validador + diagrama HTML generado | Editar el grafo + `build` cambia los agentes generados |
| **3 — Automejora** | Telemetría + `@evaluator` + `evolve` + guardarraíles | El evaluator emite su primera propuesta calibrada con datos reales |
| **4 — Escala** | `bench`, plugins, adaptador OpenCode real, modo CI | Un cambio de config se valida con bench antes de adoptarse |

La fase 0 es prerequisito honesto de todo lo demás: empaquetar la deuda actual solo la distribuiría más rápido.

---

## 9. Decisión resumida

**Sí vale la pena productizarlo**, y el diseño correcto no es "empaquetar los markdown" sino **subir un nivel de abstracción: el grafo y los agentes como datos, los markdown como build artifacts**. Eso es lo que hace que el sistema sea configurable (edita datos), dinámico (recompila), evaluable (el grafo es validable y la telemetría tiene forma) y automejorable (el evaluator propone diffs sobre datos, no sobre prosa dispersa). El riesgo principal no es técnico sino de disciplina: sin bench y sin aprobación humana, la automejora se convierte en autoderiva.
