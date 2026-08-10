# Plantilla · FICHA-APROBACION.md

Esto lo lee el docente, y lee una por estudiante. **Una página, y que la decisión de
aprobar se pueda tomar en minuto y medio.**

Reglas al llenarla:

- Nada que no ayude a decidir. Si un dato no cambia la aprobación, va en el
  `PROYECTO.md`, no acá.
- Las banderas son lo que más le sirve al docente. **No suavizarlas.** Una ficha que
  esconde un problema para verse mejor le hace perder a él la única oportunidad de
  corregir el rumbo a tiempo.
- Si no hay banderas, decir «ninguna». No inventar preocupaciones para llenar.

---

```markdown
# Ficha de aprobación · <título del proyecto>

**<Nombre del estudiante>** · SINT-732 · <fecha>

**Qué es.** <Una frase. Qué hace el sistema y para quién.>

**Cómo se hace hoy.** <Una frase.>

---

## Lo esencial

| | |
|---|---|
| **Eje de valor** | <antes/después medido · antes/después estimado · eje alterno> |
| **La comparación** | <en una línea: de esto, a esto> |
| **Recorrido principal** | <de qué evento parte, en qué resultado termina> |
| **Queda afuera** | <lo que no se construye> |
| **La decisión difícil** | <la regla que hay que elegir y defender> |
| **Datos para la demo** | <reales anonimizados · sintéticos · hay que fabricarlos> |
| **Horas por semana** | <N>, por 5 semanas |
| **Punto de partida** | <desde cero · ya tiene esto construido: …> |

## El núcleo

| Pieza | | Cómo se cumple acá |
|---|---|---|
| Prototipo de extremo a extremo | ✔ / ⚠ | |
| Persistencia en base de datos real | ✔ / ⚠ | |
| Pruebas sobre las reglas del negocio | ✔ / ⚠ | |
| CLAUDE.md y bitácora con entradas de gobernanza | ✔ | Aplica igual que a todos |
| Integración continua y skill de arranque | ✔ | Aplica igual que a todos |
| Los dos documentos | ✔ | Aplica igual que a todos |

<Por cada ⚠, dos frases: qué pieza no encaja, qué equivalencias se consideraron y
por qué ninguna convence. Pendiente de resolución del docente.>

## Banderas

<Lista corta. Solo lo que el docente tendría que mirar antes de aprobar. Si no hay,
escribir «Ninguna».>

- **<tipo de bandera>** — <qué pasa y qué habría que decidir>

Banderas que valen la pena levantar: alcance que no cabe en las horas declaradas,
código preexistente sobre el mismo dominio, dependencia de un acceso externo que no
tiene, datos confidenciales que no se pueden sintetizar, pieza del núcleo sin
equivalencia, o un eje de valor que no logró concretarse.

## Supuestos que quedaron declarados

- <supuesto, en una línea>

## Preguntas para el docente

<Lo que el estudiante quiere que se le confirme antes de arrancar. Si no hay,
escribir «Ninguna».>

---

*Enunciado completo en `PROYECTO.md`.*
```
