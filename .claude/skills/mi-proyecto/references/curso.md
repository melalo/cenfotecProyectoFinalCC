# Lo que el curso ya fijó

Todo lo de este archivo sale del programa oficial de SINT-732 y de la consigna del
proyecto. **No se negocia y no se completa por deducción.** Si el estudiante
pregunta algo que este archivo no contesta, la respuesta es «eso lo define el
docente».

## Datos fijos

| Campo | Valor |
|---|---|
| Curso | SINT-732 · Laboratorio Ejecutivo en Claude Code |
| Escuela | Sistemas Inteligentes, Universidad Cenfotec |
| Docente | Andrés Castro Núñez |
| Peso del proyecto | 30 % de la nota final |
| Modalidad | Individual |
| Entrega | Sesión 8, martes 8 de septiembre de 2026 |
| Qué se entrega | Enlace al repositorio y presentación ejecutiva en vivo, de 10 a 12 minutos |

## Calendario

| Sesión | Fecha |
|---|---|
| 3 | martes 4 de agosto de 2026 |
| 4 | martes 11 de agosto |
| 5 | martes 18 de agosto |
| 6 | martes 25 de agosto |
| 7 | martes 1.º de septiembre |
| 8 | martes 8 de septiembre — entrega y presentación |

**La ficha de aprobación se sube a Moodle cuanto antes, y a más tardar el lunes 3
de agosto a medianoche.** Es la única fecha intermedia firme del proyecto. La
aprobación es expedita: una ficha completa y sin banderas queda aprobada; solo se
devuelven las fichas cuyas banderas comprometen la viabilidad del caso.

Entre la Sesión 3 y la Sesión 8 hay **cinco semanas de trabajo extraclase**. Ese
es el presupuesto real contra el cual se mide si un recorte cabe.

## El núcleo que no se negocia

Igual para todo el mundo, sea cual sea el caso:

1. Prototipo funcional que recorre el proceso completo, de extremo a extremo.
2. Persistencia en un motor de base de datos real. SQLite cuenta como motor; no
   valen sustitutos como un archivo JSON.
3. Pruebas automatizadas sobre las reglas del negocio, que corren en cada push
   mediante integración continua.
4. Un skill o comando propio en `.claude/` que automatiza una tarea real del
   proyecto; el caso de referencia es el arranque para demostración.
5. `CLAUDE.md` escrito por el estudiante y bitácora del proceso, con sus
   entradas de gobernanza: qué afirmó el agente, cómo se detectó y qué control
   quedó establecido.
6. Dos documentos: negocio —oportunidad, escenarios con sus riesgos, hoja de
   ruta con ROI; hasta cuatro páginas— y diseño arquitectónico, hasta dos
   páginas más los diagramas.

Si una pieza no encaja con la idea: buscar la equivalencia, no forzarla, y
declararla como excepción abierta para que el docente la resuelva.

## Qué debe ser cierto al entregar

Los ocho enunciados de la consigna. El enunciado del estudiante los redacta contra
su caso concreto, sin quitar ninguno.

1. **La oportunidad está comparada, no solo descrita.** Qué cuesta hoy y qué
   costaría con el prototipo, con el origen de cada número a la vista. Quien no
   tenga datos reales estima y lo declara. Si el caso no tiene un «hoy», la
   comparación se hace sobre el eje alterno declarado.
2. **La arquitectura se decidió antes que el código, y el código se le parece.**
   Módulos con responsabilidades separadas, contratos entre ellos y diagramas
   versionados dentro del repositorio.
3. **El prototipo funciona de extremo a extremo y persiste datos de verdad.** Se
   levanta desde un clon limpio del repositorio, siguiendo el README, sin
   conocimiento previo del proyecto.
4. **Las reglas del negocio están cubiertas por pruebas.** No la interfaz ni el
   sistema entero: las reglas que hacen que el prototipo valga algo. Corren en
   cada push, mediante integración continua.
5. **El proceso de construcción quedó registrado.** `CLAUDE.md`, bitácora e
   historial de commits que muestre iteración y no un volcado único al final.
6. **La gobernanza es específica de este proyecto y quedó registrada en la
   bitácora.** Qué revisó siempre, qué delegó, cómo detecta que el agente afirmó
   algo falso, y al menos un caso real ocurrido durante el proyecto, como
   entrada de gobernanza fechada.
7. **La decisión de adoptar está fundamentada.** Escenarios de adopción con sus
   riesgos y hoja de ruta con estimación de retorno, con los supuestos
   explícitos.
8. **La presentación defiende decisiones, no resultados.** La pregunta no va a ser
   qué construyó, sino por qué así y no de otra manera.

## Los nueve criterios de la rúbrica

Cada uno de 1 a 10. Puntaje = (suma ÷ 90) × 100.

1. Identificación de la oportunidad y propuesta de optimización
2. Diseño del prototipo arquitectónico, modularidad y APIs
3. Configuración técnica y generación de código con comandos de Claude Code
4. Aplicación de iteración asistida y refactorización continua de código
5. Formulación de políticas de supervisión de código y mitigación de alucinaciones
6. Elaboración de la hoja de ruta estratégica y estimación de ROI
7. Documentación técnica
8. Entrega
9. Acatamiento de la retroalimentación

El criterio 2 evalúa decisiones de arquitectura que **toma el estudiante**. Por eso
el enunciado se detiene antes de la arquitectura, del modelo de datos y del stack.

## Ritmo de trabajo

| Entre | Fase del laboratorio | Qué debería estar listo |
|---|---|---|
| Sesión 3 → 4 | Diseño conceptual | Repositorio con `CLAUDE.md` propio, arquitectura con módulos y contratos, diagramas versionados, bitácora abierta |
| Sesión 4 → 5 | Prototipado estratégico | El recorrido principal —el camino completo del proceso, del evento que lo inicia al resultado que lo termina— funcionando de extremo a extremo, con persistencia real |
| Sesión 5 → 6 | Prototipado estratégico | Pruebas de las reglas del negocio corriendo en cada push, y refactorización de lo acumulado |
| Sesión 6 → 7 | Simulación de impacto | Skill de arranque en el repositorio. Escenarios de adopción y riesgos, en el documento de negocio |
| Sesión 7 → 8 | Toma de decisiones | Entradas de gobernanza al día en la bitácora, y cierre del documento de negocio: hoja de ruta y estimación de retorno |
| Sesión 8 | Toma de decisiones | Entrega del repositorio y presentación ejecutiva |

La comparación de oportunidad —sección del documento de negocio— se trabaja
como borrador desde la aprobación del caso.

## Restricciones

- El prototipo se construye con Claude Code de forma exclusiva y exhaustiva. Si
  algo se resolvió por fuera, se documenta qué y por qué.
- No se trabaja con datos reales confidenciales: datos sintéticos o anonimizados.
  El prototipo tiene que poder mostrarse en clase.
- El proyecto se construye durante el curso. No se acepta un sistema ya existente
  presentado como nuevo, y el historial del repositorio es la evidencia.
- Se le va a preguntar por qué tomó cada decisión, no solo qué construyó.
- La retroalimentación recibida durante el curso debe incorporarse.
- Los límites de uso de la suscripción Claude Pro no permiten concentrar el
  trabajo al final: se avanza en sesiones cortas, distribuidas a lo largo de las
  semanas.

## Los cinco casos semilla

Completos, con su escenario base, en `semillas.md`. Los títulos, para poder ofrecerlos:

1. El radar de la plata que se está por perder — priorización de cobros
2. El expediente que perdió la licitación — control de documentos para concursos
3. El torneo que se organiza solo — liga deportiva con desempates auditables
4. El costeo de la cocina — costeo de recetas con recetas anidadas y merma
5. El refugio de animales — fichas médicas y aptitud para adopción

Tomar una semilla no penaliza ni afecta la nota, y quien tome una **también corre este
skill**: el enunciado y la ficha salen del mismo molde para todo el mundo.
