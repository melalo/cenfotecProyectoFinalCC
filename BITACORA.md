# Bitácora del proyecto — Reservas en línea para negocios de bienestar y salud

Registro fechado de las decisiones tomadas y su justificación, los encargos que resultaron
determinantes, y los momentos en que se corrigió el rumbo del agente. Incluye, marcadas como
**entradas de gobernanza**, las afirmaciones falsas del agente que se detectaron durante el
proyecto: qué afirmó, cómo se detectó, y qué control quedó establecido.

## Declaración de supervisión

- **Se revisa siempre:** cada decisión de arquitectura y de stack, antes de que quede tomada
  (autenticación, lenguaje, base de datos, mecanismo del recordatorio). Ninguna se toma sin
  aprobación explícita, una por mensaje.
- **Se delega sin revisión previa** (pero se lee después): la redacción de los documentos
  (`PROYECTO.md`, `DISENO.md`, etc.) y, más adelante, el código que implemente lo ya decidido —
  se revisa una vez escrito, no se dicta línea por línea.
- **Cómo se detecta una afirmación falsa del agente:** contrastando lo que el agente dice haber
  hecho contra el resultado real (por ejemplo, releer un archivo que dice haber escrito, o
  correr una prueba que dice haber pasado) antes de darlo por bueno.

## Entradas

### 2026-08-10

**Decisiones tomadas y su justificación:**
- **Enfoque de arquitectura — aprobado el Enfoque A:** backend (API) y frontend separados por
  contrato, en vez de todo junto o microservicios. Razón: separa responsabilidades (lo que pide
  el criterio 2 de la rúbrica) sin la complejidad operativa de microservicios, viable con 4
  horas por semana.
- **Autenticación — contraseña.** *Corrección de rumbo:* el agente recomendó enlace mágico
  (menos infraestructura que mantener); la estudiante decidió contraseña.
- **Stack — HTML/CSS con SASS (frontend), JavaScript/Node.js con Express (backend).**
  *Corrección de rumbo:* el agente había recomendado Python para el backend, priorizando qué
  tan fácil es de leer para alguien sin experiencia previa programando; la estudiante decidió
  JavaScript porque ya conoce el lenguaje y prioriza poder seguir el código que se construya.
- **Base de datos — SQLite**, tras revisar explícitamente en qué escenarios dejaría de alcanzar
  (alta concurrencia, varias sucursales con servidores independientes, volumen masivo) y
  confirmar que ninguno aplica a este proyecto.
- **Recordatorio de 48 horas — disparado por una tarea programada en GitHub Actions** para el
  prototipo del curso, con la decisión explícita de migrarlo al sistema de tareas programadas
  del hosting (Render o Vercel) si el proyecto pasara a producción real.
- **Correo — Resend**, elegido sobre SendGrid por ser más simple de configurar para un proyecto
  de este tamaño.

**Encargos determinantes:** el enunciado del proyecto (`PROYECTO.md`), producido con la skill
oficial `mi-proyecto`, fijó el alcance, las reglas de negocio y los supuestos antes de esta
sesión de diseño — la entrevista de diseño no repreguntó nada de lo que ese documento ya
contestaba.

**Entradas de gobernanza:** ninguna todavía. No se detectó ninguna afirmación falsa del agente
en este proyecto hasta la fecha. Se agrega la primera entrada real de este tipo apenas ocurra un
caso concreto — no se inventa una para completar esta sección.

### 2026-08-11

**Decisiones tomadas y su justificación:**
- **Componentes — aprobados los seis:** Autenticación, Catálogo, Calendario y disponibilidad,
  Reservas, Notificaciones, Interfaz del cliente. Cada uno con su propósito y su límite con el
  resto definidos antes de tocar el modelo de datos.
- **Manejo de errores en el login — mensaje genérico.** *Corrección de rumbo, en sentido
  inverso al de ayer:* la estudiante pidió primero que el sistema aclarara cuál de los dos
  campos (correo o contraseña) estaba mal; el agente señaló el riesgo de seguridad (permite
  descubrir qué correos están registrados, probando al azar) antes de implementarlo; la
  estudiante reconsideró y mantuvo el mensaje genérico.
- **Se agrega recuperación de contraseña por correo** (enlace de un solo uso, vence en 1 hora) —
  no tenía conflicto con la decisión anterior, así que se sumó sin objeción. Esto amplió las
  responsabilidades de Autenticación y Notificaciones, y agregó la entidad *Token de
  recuperación* al modelo de datos.
- **Modelo de datos y manejo de errores — aprobados** con las siete entidades y los ocho casos
  de error, incluyendo la corrección de una inconsistencia real que el agente encontró en su
  propia revisión de cuatro pasadas: el "Correo enviado" solo estaba ligado a una Cita, pero el
  correo de recuperación de contraseña no tiene ninguna cita de por medio.
- **DISENO.md se divide en dos archivos.** *Corrección de rumbo:* el agente señaló, en la misma
  revisión de cuatro pasadas, que el documento completo excedía el límite de dos páginas que
  pide `curso.md` para el diseño arquitectónico. La estudiante decidió conservar ambas
  versiones: `DISENO1.md` (completo, de referencia, ignorado por Git) y `DISENO.md` (compacto,
  el que se sube). Se ajustó el nivel de recorte una vez, a pedido de la estudiante, para que la
  versión compacta perdiera el mínimo de detalle posible dentro de las dos páginas.
- **NEGOCIO.md — escrito y aprobado**, con la oportunidad (reutilizada de `PROYECTO.md`), un
  escenario de riesgo, y la hoja de ruta con dos estimaciones de ROI (~7.3 hs/semana de personal
  liberadas, ~10 citas/semana recuperadas fuera de horario), ambas declaradas como estimación,
  no medición.
- **Se agrega una cuenta de tipo Personal.** Al redactar el escenario de riesgo del documento de
  negocio, la estudiante identificó que la asistente debía coordinar también las citas
  telefónicas desde la misma aplicación (no con un método aparte), para no crear una segunda
  fuente de verdad. Esto amplía el alcance de `PROYECTO.md` (que solo describe el recorrido del
  cliente) sin contradecirlo, y **elimina en el diseño** el riesgo que se había identificado
  minutos antes en `NEGOCIO.md` — se actualizaron `DISENO.md`, `DISENO1.md` (dos tipos de
  cuenta, campo "canal" en la Cita) y la sección de riesgo de `NEGOCIO.md` en consecuencia.
- **Se agrega a la hoja de ruta (sin construir): expediente por cliente**, editable por
  Personal, más amplio de lo que pareció al principio — no es solo consumo de paquetes de
  sesiones, sino cualquier información relevante del cliente para el negocio: padecimientos,
  medicamentos, contraindicaciones, tratamientos en curso (por ejemplo, radioterapia), además de
  los paquetes. Es un adendum declarado a propósito, sin definir su estructura todavía — eso
  queda para una próxima sesión de diseño. Ya se señaló que el consumo de paquetes en particular
  depende de una decisión previa sin resolver: el sistema no registra compras ni pagos.

**Encargos determinantes:** ninguno nuevo — se siguió trabajando sobre el enunciado
(`PROYECTO.md`) y las decisiones ya tomadas el 2026-08-10.

**Entradas de gobernanza:** ninguna todavía. La inconsistencia del modelo de datos (mencionada
arriba) fue un hallazgo de la propia revisión del agente, no una afirmación falsa que se le
haya escapado y alguien más haya tenido que detectar — no cuenta como caso de gobernanza. Sigue
sin haber un caso real de ese tipo en este proyecto.

### 2026-08-17

**Qué se hizo:** se escribió `ESPECIFICACION.md` con la skill `escribir-diseno`, a partir de los
documentos que ya existían en la carpeta. El proyecto tenía diseño pero no tenía especificación:
los requisitos estaban repartidos entre `PROYECTO.md`, `DISENO.md`, `DISENO1.md` y `NEGOCIO.md`,
y la skill `escribir-plan` no puede correr sin ese archivo. Se recorrieron las preguntas
obligatorias de la skill descartando primero todas las que los documentos ya contestaban, y
preguntando solo las cuatro que no contestaba ninguno.

**Decisiones tomadas y su justificación:**
- **Disponibilidad — no se garantiza (RNF-1).** Si el sistema se cae un rato, el negocio lo
  absorbe: quien quería reservar vuelve más tarde o llama, y el canal telefónico sigue existiendo.
  No se construye alta disponibilidad, ni respaldo en caliente, ni alertas de caída. La sección de
  requisitos no funcionales quedó corta a propósito, con esa razón escrita.
- **Personal sí puede cancelar y reagendar dentro de las 4 horas (RN-6).** Ningún documento decía
  qué pasaba cuando el cliente llamaba al negocio, que es lo que la regla de las 4 horas le indica
  hacer. Si la asistente tampoco pudiera, esa llamada no resolvería nada y la cancelación de
  último momento quedaría fuera del sistema — la segunda fuente de verdad que `NEGOCIO.md` dice
  haber eliminado. La regla protege la agenda contra cancelaciones del cliente por su cuenta, no
  contra el criterio del propio negocio.
- **Cuenta obligatoria; no hay modo invitado (RN-9).** *Corrección de rumbo:* la estudiante
  propuso ofrecerle al cliente elegir entre reservar como invitado o crear cuenta. El agente
  señaló la consecuencia —un invitado no puede volver a entrar a cancelar ni reagendar, que es
  justamente lo que el sistema busca darle— y la estudiante decidió exigir cuenta siempre.
- **Personal puede crear la cuenta de un cliente que llama, con contraseña temporal (RN-11).**
  *Corrección de rumbo:* el agente recomendó mandarle al cliente un correo con enlace para que
  definiera él su contraseña, reusando el mecanismo de recuperación que ya existe; la estudiante
  decidió contraseña temporal más cambio obligatorio en el primer ingreso. La contrapartida quedó
  escrita: con esta opción la asistente sí conoce la contraseña, pero solo hasta ese primer
  ingreso. Se dejan los dos caminos abiertos y elige el cliente por teléfono: registrarse él
  mismo, o que se la creen.
- **Nada se borra (RN-15).** Se evaluó un límite de tres años y se descartó: al volumen del
  negocio (44 horarios por semana por proveedor, unas 2.300 citas al año) conservar todo no
  cuesta nada, y el expediente del cliente que está en la hoja de ruta necesita historial largo.
- **En el glosario gana "horario" y se descarta "slot".** La skill obliga a quedarse con un solo
  término por concepto. Se eligió el español aunque `PROYECTO.md` use "slot"; decisión de la
  estudiante.

**Hallazgos de la revisión del agente (no son gobernanza, igual que el 2026-08-11):**
- La especificación prometía en REG-5 poder saber con cuánta anticipación se cancelaron las
  citas, pero REG-1 no guardaba la fecha de cancelación. Se corrigió agregando **cuándo se
  canceló y quién la canceló**.
- Al presentar la decisión de las 4 horas, el agente la describió como una *contradicción* entre
  `PROYECTO.md` y los documentos de diseño. Fue impreciso: los diseños decían "mismas reglas, sin
  excepción" refiriéndose solo a **crear** citas, y sobre cancelar no decían nada. Era un hueco,
  no una contradicción. La decisión tomada no cambia; el motivo por el que se tomó, sí.

**Propagación hacia atrás:** las decisiones de hoy dejaron desactualizados tres archivos de la
carpeta, y los tres se corrigieron en esta misma sesión, con aprobación una por una:
- `DISENO.md` y `DISENO1.md` — se agregó que Personal cancela y reagenda dentro de la ventana
  (componente Reservas y manejo de errores), y tres campos nuevos al modelo de datos: cuándo se
  canceló una cita, quién la canceló, y la marca de contraseña temporal pendiente en el Cliente.
- `SEGUIMIENTO.md` — se registró la especificación, las cuatro decisiones, los cambios a los
  diseños y las preguntas abiertas; se dio por resuelto el pendiente del plugin `superpowers`.
- `PROYECTO.md` **no se tocó**: es el enunciado original y el curso prohíbe modificarlo. Su regla
  5 queda refinada por RN-6 de la especificación, no reemplazada.

**Preguntas abiertas declaradas:** seis, cada una con una decisión provisional anotada. Dos ya se
conocían (el expediente del cliente y cómo se registra un paquete de sesiones). Las otras cuatro
aparecieron al escribir la especificación y nadie las había notado: si un cliente puede tener
varias citas activas a la vez, quién marca una cita como completada, qué se puede cambiar al
reagendar, y qué recordatorio recibe una cita reservada con menos de 48 horas de anticipación.

### 2026-08-17 (sesión de planificación, mismo día)

Al arrancar la skill `escribir-plan` se recorrieron las preguntas abiertas que tocaban alguna
pieza del plan. **Las cuatro se resolvieron**, y cada una dejó de ser pregunta abierta para
convertirse en regla del negocio, como exige la habilidad. Quedan solo PA-1 y PA-2 (el expediente
del cliente), que no tocan ninguna pieza.

**Decisiones tomadas y su justificación:**
- **PA-3 → RN-16.** Un cliente puede tener varias citas activas al mismo tiempo, sin límite.
- **PA-4 → RN-17.** *Corrección de rumbo:* el agente había puesto como provisional que la cita se
  marcaba **sola** como completada al pasar la hora. La estudiante decidió lo contrario: la marca
  **Personal**, a mano, después de que el cliente asistió. Ningún estado se alcanza por el paso
  del tiempo.
- **Consecuencia de RN-17, detectada al aplicarla → RN-19 y un cuarto estado.** Si el cliente no
  cancela y no se presenta, la cita no es completada ni cancelada, y se quedaría "activa" para
  siempre. La estudiante decidió que en ese caso **pierde la cita**, sin reposición ni devolución,
  y que Personal la marca como **no asistió**. El estado tiene que existir para que quede
  constancia de por qué se perdió. Se señaló que, si esa cita era parte de un paquete de sesiones,
  hoy el descuento lo lleva el negocio a mano: el sistema no registra paquetes (PA-2), y ese
  estado queda listo para cuando se construya el expediente (PA-1).
- **PA-5 → RN-18.** Reagendar cambia únicamente la fecha y la hora; el servicio y el proveedor se
  mantienen. La estudiante pidió una recomendación de experiencia de uso antes de decidir, y el
  agente argumentó a favor de esta opción: "reagendar" significa para el cliente "lo mismo, otro
  día", y meter el cambio de servicio y proveedor en el mismo botón lo convierte en la pantalla de
  reservar otra vez, con riesgo de que alguien cambie de proveedor sin darse cuenta. Se dejó
  escrito el caso donde molesta —el proveedor sin espacio— y su paliativo: el aviso de RN-14.
- **PA-6 → RN-20, y el recordatorio baja de 48 a 24 horas.** Primero se decidió que una cita
  reservada demasiado cerca no recibe recordatorio. Al ver la consecuencia, la estudiante cambió
  el plazo del recordatorio completo: **de 48 a 24 horas**. La razón es RN-4 — como solo se puede
  reservar a partir del día siguiente, buena parte de las citas se reservan con menos de 48 horas
  de anticipación y se habrían quedado **todas** sin recordatorio. Con 24 horas la mayoría sí lo
  recibe.

**Propagación hacia atrás del cambio de 48 a 24 horas.** Se recorrió la carpeta buscando el dato
y se actualizó en todos los documentos vivos: `ESPECIFICACION.md` (glosario, objetivos, RN-20,
RF-12, tabla de salidas, recorrido de reserva en línea y dependencias), `DISENO.md` y `DISENO1.md`
(componente Notificaciones y la decisión mayor del disparador), `CLAUDE.md` (stack: correo y
disparador) y `NEGOCIO.md` (hoja de ruta).

**Tres documentos se dejaron con el dato viejo, a propósito:**
- `PROYECTO.md` — es el enunciado original y el curso prohíbe modificarlo. Sus secciones 3 y 9
  siguen diciendo 48 horas.
- `FICHA-APROBACION.md` — se subió a Moodle el 3 de agosto y es el documento que el docente
  aprobó. Cambiarlo ahora falsearía lo que se aprobó ese día.
- Las entradas anteriores de esta bitácora — son registro fechado de lo que se decidió entonces;
  se corrigen con una entrada nueva, no reescribiéndolas.

La diferencia entre esos tres y los documentos vivos es deliberada y queda declarada acá: si
alguien encuentra "48 horas" en el enunciado o en la ficha, esta entrada es la que explica por qué.

**`PLAN.md` — escrito y aprobado.** Nueve vertical slices, cada una con lo que tiene que ser cierto
y su comprobación **escrita antes de construir**, como exige el curso.

- La lista se aprobó antes de detallarla, y cambió tres veces durante esa revisión, siempre a
  pedido de la estudiante:
  1. Apareció una pieza nueva —**Personal cierra las citas pasadas**— que no existía en la primera
     propuesta: es consecuencia directa de RN-17 y RN-19, decididas ese mismo día.
  2. La estudiante detectó que el resumen de la pieza del recordatorio decía que el correo llevaba
     enlace solo **para cancelar**, cuando RF-12 siempre dijo «cancelar o reagendar». El error
     estaba en el resumen del agente, no en la especificación. **Arrastró una corrección real del
     plan:** esa pieza pasó a depender también de la de cancelar y reagendar, porque si no los
     enlaces del correo no tendrían adónde llevar.
  3. Se fusionaron las piezas de catálogo y calendario, a propuesta de la estudiante. El argumento
     que cerró la fusión es que son **un mismo recorrido**: el calendario no se puede mostrar sin
     haber elegido antes servicio y proveedor (RF-6). De diez piezas se pasó a nueve.
- Se confirmó dejar **«reagendar»** como término, en vez de cambiarlo por «reprogramar».
- Las pruebas automáticas no son una pieza aparte: cada criterio de aceptación vive en la pieza que
  crea la regla que protege. CA-1 y CA-2 en la pieza 3, que es donde además se monta la integración
  continua; CA-3 partido entre la 5 (el cliente no puede) y la 7 (Personal sí puede).
- La skill propia de arranque que pide la rúbrica quedó en **«Fuera del plan»**, con su razón: no
  es un requisito del sistema, no aparece en `ESPECIFICACION.md`, y por lo tanto no es una vertical
  slice. Sigue anotada como pendiente del curso en `SEGUIMIENTO.md`.

**Encargos determinantes:** ninguno nuevo.

**Entradas de gobernanza:** ninguna todavía.

**Encargos determinantes:** ninguno nuevo. Se trabajó sobre `PROYECTO.md` y las decisiones ya
tomadas el 2026-08-10 y el 2026-08-11.

**Entradas de gobernanza:** ninguna todavía. Los dos hallazgos de arriba salieron de la revisión
del propio agente, no de una afirmación falsa que alguien más tuviera que detectar — mismo
criterio que se aplicó el 2026-08-11. Sigue sin haber un caso real de ese tipo en este proyecto.
