# Plantilla · PROYECTO.md

Estructura del enunciado del estudiante. Es su documento de trabajo durante ocho
semanas, así que se escribe **para que él lo use**, no para que se vea bien.

Reglas al llenarla:

- Con las palabras del estudiante, no con las del agente. Si dijo «las cuentas que
  se me pasan», eso va, no «cartera vencida».
- Todo lo que no dijo va con la etiqueta **(supuesto)**. Sin excepción.
- Nada de arquitectura, módulos, modelo de datos ni stack. Si aparece la
  tentación, va a la sección 11.
- Las secciones vacías no se rellenan con prosa: se dejan con lo que hay.

---

```markdown
# <título del proyecto>

**<Nombre del estudiante>** · SINT-732 Laboratorio Ejecutivo en Claude Code
Entrega y presentación: martes 8 de septiembre de 2026, Sesión 8

> Este es mi enunciado del proyecto del curso. Reemplaza a los casos semilla de la
> consigna oficial; todo lo demás de esa consigna —el núcleo, la rúbrica de nueve
> criterios y las restricciones— aplica igual.

## 1. Qué es y para quién

<Una frase que entienda alguien de afuera.>

- **Quién lo usa:** <rol concreto y cuántas personas>
- **Qué dispara el uso:** <en qué momento alguien abre esto y para qué>

## 2. El eje de valor

**Eje declarado:** <antes/después medido · antes/después estimado · eje alterno>

<Si hay un «hoy»: cómo se resuelve hoy, qué cuesta, y de dónde sale cada número.
Si el eje es alterno: qué capacidad nueva, qué riesgo evitado o qué valor para el
usuario, y contra qué vara se va a medir.>

| | Hoy | Con el prototipo | Origen del número |
|---|---|---|---|
| <qué se mide> | | | <medido / estimado / cálculo> |

Sobre este eje se van a argumentar el criterio 1 —oportunidad— y el criterio 6 —hoja
de ruta y retorno—. Los números finales se construyen durante el proyecto; lo que
queda fijo acá es contra qué se comparan.

## 3. El recorrido principal

De punta a punta, el camino que el prototipo tiene que recorrer completo:

1. <parte de este evento>
2. …
6. <termina en este resultado>

**Queda afuera a propósito:** <lo que no se construye, y por qué>

## 4. Las reglas que valen

Las que hacen que el sistema sirva. Si alguna se rompe, el sistema miente. Son las
que después van a estar cubiertas por pruebas automatizadas.

1. <regla, escrita como una afirmación que es verdadera o falsa>
2. …

**La decisión difícil.** <La regla donde hay más de una respuesta razonable, las
opciones que se consideraron, cuál se eligió y por qué.> Esto es lo que se defiende
en la Sesión 8.

## 5. Los datos

- **Qué persiste:** <entidades y volumen realista>
- **De dónde salen para la demostración:** <reales anonimizados · sintéticos ·
  hay que fabricarlos, y eso cuesta N horas>
- **Confidencialidad:** <qué no puede mostrarse en clase>

## 6. Frontera técnica

- **Depende de:** <sistema externo, API o servicio, si lo hay>
- **Acceso real:** <sí · no, se simula esa frontera>
- **Restricciones impuestas:** <lo que la organización exige o prohíbe>

## 7. Qué debe ser cierto cuando entregue

Los ocho enunciados de la consigna, dichos contra este caso.

1. **La oportunidad está comparada.** <qué comparación concreta>
2. **La arquitectura se decidió antes que el código.** <qué tendrá que estar
   documentado, sin decidirlo todavía>
3. **El prototipo funciona de extremo a extremo y persiste datos de verdad.**
   <cuál recorrido, cuáles datos>
4. **Las reglas del negocio están cubiertas por pruebas que corren en cada push.** <cuáles, de la sección 4>
5. **El proceso de construcción quedó registrado.** CLAUDE.md, bitácora e historial.
6. **La gobernanza quedó registrada en la bitácora.** <qué se revisa siempre en
   este caso concreto, dado lo que está en juego>
7. **La decisión de adoptar está fundamentada.** <ante quién se defendería en la vida
   real, si aplica>
8. **La presentación defiende decisiones.** De 10 a 12 minutos, Sesión 8.

## 8. El núcleo en este proyecto

| Pieza | Cómo se cumple acá |
|---|---|
| Prototipo de extremo a extremo | |
| Persistencia en base de datos real | |
| Pruebas sobre las reglas del negocio | |
| CLAUDE.md propio y bitácora con entradas de gobernanza | Aplica igual que a todos |
| Integración continua y skill de arranque | Aplica igual que a todos |
| Los dos documentos | Aplica igual que a todos |

**Excepciones abiertas.** <Solo si alguna pieza no encaja: qué pieza, por qué, y qué
equivalencias se consideraron. Pendiente de resolución del docente. Si no hay
excepciones, escribir «ninguna».>

## 9. Calendario

Horas disponibles por semana: **<N>**. Semanas hasta la entrega: **5**.

| Para la sesión | Qué tengo que tener listo |
|---|---|
| 4 · 11 de agosto | |
| 5 · 18 de agosto | |
| 6 · 25 de agosto | |
| 7 · 1.º de septiembre | |
| 8 · 8 de septiembre | Repositorio completo y presentación |

## 10. Supuestos declarados

Todo lo que no verifiqué y estoy dando por cierto. Cada uno se confirma o se corrige
durante el proyecto.

- <supuesto>

## 11. Lo que este documento no decide

A propósito. Estas decisiones son mías y llegan después:

- La arquitectura: módulos, responsabilidades y contratos entre ellos.
- El modelo de datos.
- El stack: lenguaje, framework y motor de base de datos.

El criterio 2 de la rúbrica evalúa exactamente estas decisiones, así que tomarlas
temprano y sin fundamento no adelanta nada.
```
