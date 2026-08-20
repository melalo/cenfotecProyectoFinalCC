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

### 2026-08-17 — construcción de la pieza 1

Primera sesión de construcción: **la pieza 1 de `PLAN.md`, «Entrar a la aplicación»**, que trae
adentro el arranque del proyecto. Antes de escribir código se leyeron `ESPECIFICACION.md`,
`DISENO.md`, `PLAN.md` y `README.md`, y se buscó en la carpeta cada dato que hacía falta.

**Un dato faltaba y se preguntó en vez de inventarlo:** la comprobación 8 de la pieza pedía entrar
con la cuenta de Personal precargada, pero **ningún documento decía con qué correo ni con qué
contraseña**. Se buscó en los cinco documentos y no estaba. La estudiante eligió
`personal@ejemplo.com` / `Personal123`, siguiendo el estilo inventado que el plan ya usaba para la
clienta de prueba. Quedó escrito en la comprobación 8 de `PLAN.md` —con la nota de que faltaba— y
en la sección «Datos de prueba» del `README.md`.

**Decisiones tomadas y su justificación** *(las cinco primeras quedaron también en `DISENO.md`,
sección «Decisiones tomadas al construir la pieza 1», porque afectan a todas las piezas que
siguen)*:

- **Cifrado de contraseñas — `scrypt`, que Node ya trae, en vez de `bcrypt`.** Razón: `bcrypt`
  hay que compilarlo en la máquina donde se instala, y el `README.md` promete que el proyecto se
  levanta clonándolo en una máquina cualquiera. Cada contraseña se guarda como `sal:huella`, con
  una sal distinta por cuenta.
- **La sesión se sostiene con una cookie firmada**, no con la memoria del servidor. Razón: la
  comprobación 6 apaga y vuelve a levantar la aplicación; la memoria del servidor se pierde en ese
  reinicio y la cookie firmada no.
- **Corredor de pruebas — `node --test`**, que viene incluido, en vez de Jest o Vitest. Misma razón
  que el cifrado: nada extra que instalar ni configurar.
- **Los estilos SASS se compilan dentro de `npm start`**, no con un comando aparte que haya que
  recordar. Razón: mantener el contrato de arranque del `README.md` en cuatro comandos.
- **El archivo `.env` se lee con `dotenv`**, no con la bandera `--env-file` de Node. Razón: esa
  bandera pide Node 22.9 o superior y el `README.md` promete que corre desde Node 20. Se prefirió
  agregar una dependencia mínima antes que cambiar una promesa ya publicada.
- **Si falta `SESION_SECRETO`, la aplicación arranca igual**, con una firma inventada al momento y
  un aviso en la consola. Razón: la comprobación de referencia del curso es clonar y correr tres
  comandos; negarse a arrancar por una clave que en un prototipo local no protege nada haría
  fallar esa comprobación. El costo —las sesiones se cierran en cada reinicio— lo dice el aviso.
- **`npm test` nace con pruebas propias de la pieza 1**, en vez de quedar como un comando vacío
  hasta la pieza 3. Decisión de la estudiante entre las dos opciones. Son 14 pruebas, escritas
  antes del código y vistas fallar primero.
- **Los correos se guardan y se buscan en minúscula y sin espacios de sobra.** Razón: sin esto,
  `Ana@Ejemplo.com` y `ana@ejemplo.com` serían dos cuentas distintas, y la pieza exige que dos
  cuentas no puedan tener el mismo correo. Hay una prueba que lo cubre.
- **Al registrarse, la sesión queda abierta.** No estaba dicho en el bloque *Produce* del plan,
  pero la comprobación 1 pide que la persona se registre «y vea que entra y la pantalla la saluda
  por su nombre»: para saludarla, la aplicación ya tiene que reconocerla. Se agregó una prueba
  para eso antes de implementarlo.
- **El registro ignora a propósito un `tipo` que venga en el pedido**, y siempre crea un cliente.
  Razón: RN-10 dice que la cuenta de Personal viene precargada y no se autorregistra. Hay una
  prueba que intenta registrarse como `personal` y comprueba que queda como cliente.
- **`POST /api/registro` devuelve `422 {error: "datos_incompletos"}`** cuando falta alguno de los
  tres campos. El plan no lo había previsto; se agregó porque el frontend necesita saber qué
  contestar, y quedó anotado en el bloque *Produce* de la pieza 1 junto con el nombre del error del
  `409` y el hecho de que el registro deje la sesión abierta.
- **No se inventó ningún largo mínimo de contraseña.** Ningún documento lo pide, y una regla de
  negocio no se agrega en silencio desde el código. Queda señalado como algo que la estudiante
  puede decidir.

**El sistema visual entró al proyecto a mitad de la sesión.** La estudiante agregó dos archivos de
referencia visual, `VISUALDESKTOP.md` y `VISUALSMOBILE.md`, con el sistema «Clinical Excellence»
—una estética clínica y profesional, azul marino de autoridad médica en vez de la estética de espá—
y pidió además que los estilos fueran **mobile-first**. Los estilos ya escritos se rehicieron
completos contra esa referencia.

- **Los dos archivos tenían contenido idéntico** (los mismos 7.600 bytes), así que no existía una
  guía aparte para teléfono: la parte móvil vive dentro del mismo sistema. La estudiante los
  consolidó en un solo **`VISUALS.md`**, que es el que manda.
- **`VISUALS.md` pasa a ser autoridad**, al mismo nivel que `ESPECIFICACION.md` para el
  comportamiento: si un color o una medida no está ahí, no se inventa en el `.scss`. Quedó escrito
  en `DISENO.md` («El sistema visual») y en las convenciones de `CLAUDE.md`.
- **Mobile-first, decidido por la estudiante.** En el código se traduce en una regla verificable:
  todos los `@media` son `min-width` y ninguno es `max-width`. Los cortes son 48rem y 64rem.
- **La tipografía Manrope se copió dentro del proyecto** (`publico/fuentes/`, 40 KB en dos
  archivos) en vez de pedírsela a Google Fonts en cada visita. Razón: un servicio de terceros más
  contradice las restricciones que se acababan de escribir en `CLAUDE.md`, y la página se vería
  distinta en una máquina sin internet.
- **`VISUALS.md` se contradecía consigo mismo en dos puntos** y hubo que elegir: su lista de valores
  decía que el fondo era `#fcf9f8` y el color principal `#00112d`, mientras su prosa decía que el
  lienzo es el «Cool Slate Tint» `#F4F6F8` y el principal el «Deep Navy» `#002554`. Se siguió la
  prosa, porque explica para qué sirve cada capa. **Y la estudiante zanjó la contradicción ese mismo
  día, corrigiendo el propio `VISUALS.md`:** `surface`, `surface-bright` y `background` pasaron a
  `#F4F6F8`, y `primary` a `#002554`. `#00112d` no se eliminó —pasó a ser `primary-container`, el
  tono más oscuro del mismo azul— porque hace falta un tono más oscuro que el principal para que un
  botón muestre que responde al pasarle el mouse. Se recorrió la carpeta buscando las dos
  instrucciones en cualquier forma y se corrigieron las 9 apariciones, incluida una escrita como
  `rgb(0 17 45 / 5%)` en la sombra de las tarjetas, que ninguna búsqueda por código hexadecimal
  encuentra.

**Un fondo con imagen, pedido por la estudiante.** Trajo una imagen (`bg-img.jpg`) para poner de
fondo. **Se revisó antes de aplicarla**, como ella pidió: es un patrón botánico en gris azulado
clarísimo, del mismo tono frío que el `#F4F6F8` del sistema y de contraste muy bajo, así que no
compite con el texto ni rompe la estética clínica —si hubiera tenido zonas oscuras habría hecho
falta un velo encima, y no lo necesita. **Se movió de `proyectoFinal/img/` a `publico/img/`**, porque
`publico/` es lo único que el servidor entrega al navegador: desde la carpeta original no habría
cargado nunca. El color del sistema quedó escrito **antes** que la imagen, como respaldo, para que la
página nunca se vea en blanco si la imagen falta o tarda. Queda quieta al desplazarse solo de tableta
para arriba, porque varios navegadores de celular hacen eso a los saltos. Todo anotado en `DISENO.md`
y como convención en `CLAUDE.md`.

**El «ojito» de las contraseñas — pedido de la estudiante, con su razón:** un campo de contraseña
muestra puntitos y no hay forma de saber si se escribió bien. Se agregó un botón que la destapa y la
vuelve a tapar. **Decisión de cómo hacerlo:** no se puso campo por campo, sino con una función que
recorre la página y se lo agrega a todos los campos de contraseña que encuentre. Razón: la
estudiante pidió que estuviera «donde haya passwords siempre», y las piezas 7 y 9 traen más
pantallas con contraseña — con esta forma lo heredan solas, sin que nadie tenga que acordarse. Quedó
escrito como convención en `CLAUDE.md`.

**Lo que la construcción obligó a corregir hacia atrás** (dentro de la carpeta, como manda el
`CLAUDE.md` de la carpeta madre):

- `CLAUDE.md` de `proyectoFinal/` — las secciones **Convenciones** y **Restricciones** estaban en
  blanco, esperando que el proyecto existiera. Se llenaron con la estructura de carpetas, cómo se
  nombran archivos, variables, tablas y campos del API, el estilo de código, cómo se organizan las
  pruebas, y las restricciones que salen del compromiso de «clonar y levantar en otra máquina». La
  tabla de **Comandos** decía «todavía no existen»: ahora existen, y se agregó `npm run estilos`.
- `README.md` — se quitó el aviso de «TODAVÍA NO HAY CÓDIGO» y la advertencia de que los comandos
  no funcionaban, tal como la propia pieza 1 pedía hacer al construirla. Se corrigieron además
  tres afirmaciones que quedaron falsas: que `npm run datos` carga servicios y proveedores (hoy
  carga solo la cuenta de Personal, las demás tablas las crea la pieza 2), que `npm test` cubre
  los tres criterios de aceptación (hoy cubre la pieza 1), y que las pruebas corren solas en cada
  push (eso se monta en la pieza 3). Se agregó la estructura del código.
- `PLAN.md` — la comprobación 8 recibió las credenciales que le faltaban, y el bloque `Evidencia`
  de la pieza 1 quedó lleno con el resultado de cada comprobación.

**Estado en que quedó la pieza: CERRADA.** Las 14 pruebas pasan y las 8 comprobaciones del plan se
corrieron contra la aplicación escuchando en `http://localhost:3000`, con sus resultados copiados en
el bloque `Evidencia`. La estudiante hizo después la revisión visual en el navegador —los pasos 1,
2, 3, 4, 5 y 8, más el ojito y el acomodo en pantalla angosta— y confirmó que todos pasan. Recién
con eso la pieza pasó de «construida» a «cerrada»: la parte que solo se ve en pantalla no la puede
dar por buena el agente.

**El tiempo dedicado al proyecto sube de 4 a 6 horas por semana.** Decisión de la estudiante el
2026-08-17, al terminar la primera sesión de construcción.

- **Lo que cambia el número:** el presupuesto de tiempo del proyecto pasa de **20 horas** (4 × 5
  semanas) a **30 horas** (6 × 5 semanas). Son **10 horas más, un 50 % de holgura adicional**.
- **Lo que eso significa para el plan:** *nada se reordena ni se recorta.* Las nueve vertical slices
  siguen iguales, en el mismo orden y con las mismas comprobaciones. Lo que cambia es el margen: con
  la pieza 1 cerrada quedan ocho piezas y unas 24 horas por delante, aproximadamente **3 horas por
  pieza**, contra las 2 que salían con el presupuesto viejo.
- **Lo que eso significa para el riesgo declarado:** `FICHA-APROBACION.md` marcó la pieza del
  recordatorio como «la de mayor riesgo técnico **con 4 horas por semana**… si el tiempo aprieta,
  sería la primera en recortar». Ese riesgo **baja**, porque la razón que lo sostenía era justamente
  el presupuesto de tiempo. **No se declara resuelto:** sigue siendo la pieza más frágil por su
  naturaleza —depende de un disparador externo que puede no correr— y ese riesgo no es de tiempo.
- **Dos documentos conservan el «4» a propósito**, con el mismo criterio que ya se aplicó al cambio
  de 48 a 24 horas del recordatorio: `FICHA-APROBACION.md`, porque es lo que el docente aprobó el 3
  de agosto y cambiarlo falsearía ese acuerdo, y la entrada del 2026-08-10 de esta bitácora, porque
  es registro fechado de lo que se decidió entonces. **Si alguien encuentra «4 horas por semana» en
  la ficha, esta entrada es la que explica por qué.**

**Encargos determinantes:** ninguno nuevo. Se construyó contra lo ya escrito.

**Entradas de gobernanza — primera del proyecto.**

- **Qué afirmó el agente:** que el entorno de trabajo estaba matando el proceso del servidor. Lo
  dijo como un hecho —«el entorno sandbox corta los procesos que escuchan en un puerto»— después
  de ver que el servidor arrancaba, imprimía que estaba levantado, y no respondía a los pedidos.
- **Por qué era falso:** el proceso no se estaba muriendo. Seguía vivo y ocupando el puerto 3000.
  Lo que fallaba era otra cosa: los pedidos hechos **desde otro proceso** no llegaban a
  `localhost`.
- **Cómo se detectó:** por la salida del paso siguiente, no por el razonamiento del agente. Al
  intentar levantar la aplicación otra vez, Node cortó con el error `EADDRINUSE: address already in
  use :::3000` — es decir, «ese puerto ya está ocupado». Ese mensaje contradijo directamente lo
  afirmado. Al buscar quién ocupaba el puerto apareció un proceso `node` vivo, de un arranque
  anterior.
- **Consecuencia real:** ninguna sobre el entregable. El diagnóstico equivocado no cambió nada del
  código; costó tres intentos y obligó a verificar de otra manera (corriendo las comprobaciones
  dentro del mismo proceso que levanta la aplicación).
- **Control que queda establecido:** la causa de una falla del entorno no se declara sin una
  comprobación que la respalde — si no se comprobó, se dice «no sé por qué falla» y se busca. Y,
  sobre todo: **el bloque `Evidencia` de una pieza no se apoya nunca en lo que el agente afirme,
  sino en la salida literal de los comandos**, copiada ahí para que se pueda contrastar. Es
  exactamente el control que la «Declaración de supervisión» de esta bitácora describe, aplicado
  por primera vez a un caso real.

### 2026-08-18 — construcción de la pieza 2

Segunda sesión de construcción: **la pieza 2 de `PLAN.md`, «Elegir servicio y proveedor, y ver el
calendario»**, que es donde vive el cálculo de disponibilidad. Antes de escribir código se leyeron
`ESPECIFICACION.md`, `DISENO.md`, la pieza 2 de `PLAN.md`, `VISUALS.md`, el `CLAUDE.md` de la
carpeta, `PROXIMA-SESION.md` y el código de la pieza 1.

**Cuatro datos faltaban y se preguntaron en vez de inventarlos.** Se buscaron en los siete
documentos de la carpeta y ninguno los tenía. La estudiante decidió los cuatro:

1. **Qué feriados de Costa Rica se cargan, y si se trasladan al lunes.** → Las fechas de ley **en
   su día original, sin trasladarse**, para 2026 y 2027. Razón: la comprobación 9 del plan dice
   literalmente «mirar el 15 de setiembre», y si el feriado se corriera al lunes ese día quedaría
   libre y la comprobación dejaría de comprobar lo que dice. Se cargan dos años porque Jueves y
   Viernes Santo cambian de fecha cada uno.
2. **Si la configuración del negocio guarda nombre y teléfono.** → **Sí, los dos.** El plan solo
   nombraba horario, feriados, ubicación, logo y colores, pero el pie de página decía «© 2026
   Belleza y Bienestar» como texto de relleno inventado —justo lo que esa configuración existe para
   evitar—, y el sistema le dice al cliente «llame al negocio» (RN-4, RN-5) sin tener dónde guardar
   a qué número. **Esto obligó a corregir REG-4 de `ESPECIFICACION.md` y `DISENO.md` antes de
   escribir una línea de código**, que es el orden que manda el `README.md`.
3. **Si se construían ya el menú del pie y el botón «hamburguesa»**, pendientes de la pieza 1 «hasta
   que existan secciones que enlazar». → **No: se posponen a la pieza 3.** Razón: la pieza 2 no
   trae secciones distintas, trae un solo recorrido en pasos —elegir servicio, elegir proveedor,
   ver el calendario— dentro de la misma pantalla. La primera sección de verdad, «Mis citas», llega
   con la pieza 3. Anotado ahí en `DISENO.md`.
4. **Cómo se ve el calendario.** → **Cuadrícula del mes, y los horarios se abren al tocar un día**,
   en vez de una lista con todos los horarios de todos los días a la vista. Razón: un mes entero
   son unas 200 fichas de horario.

**Decisiones tomadas y su justificación** *(las nueve quedaron en `DISENO.md`, sección «Decisiones
tomadas al construir la pieza 2», con sus alternativas)*:

- **La hora que vale es la de Costa Rica (UTC−6), escrita en el código**, no la de la máquina donde
  corra el servidor. Razón: si se usara la hora de la máquina, el mismo calendario mostraría días
  distintos según dónde se levante la aplicación y la regla «no hay citas para hoy» (RN-4) se
  rompería para quien lo corra desde otra zona horaria. Costa Rica no cambia de hora en verano, así
  que alcanza con restar seis y **no hace falta ninguna librería nueva** — que es la restricción de
  «cero dependencias que instalar» del `README.md`.
- **La configuración del negocio se partió en tres tablas** (`configuracion_negocio`,
  `horario_negocio` y `feriado`) en vez de la única que nombraba el plan. Razón: el horario semanal
  son varias filas y los feriados muchas más; meterlos adentro de una sola fila los volvería un
  texto apelmazado que nadie puede mirar ni corregir con un visor de SQLite — y la comprobación 12
  pide justamente tocarlos a mano. El bloque *Produce* del plan se corrigió con esta razón.
- **El horario del negocio se guarda como tramos de atención, y el almuerzo es el hueco entre
  dos.** Entre semana hay dos tramos (9–12 y 13–18); el sábado uno (9–13); el domingo ninguno, y
  por eso está cerrado sin ninguna regla especial. Razón: un almuerzo tratado como dato aparte
  sería un lugar más donde equivocarse — exactamente el riesgo que `PROYECTO.md` §7.6 manda vigilar.
- **La tabla `cita` se creó en esta pieza, vacía.** No estaba previsto —la crea la pieza 3—, pero la
  comprobación 11 exige insertar a mano una cita activa y ver que su horario deja de aparecer libre,
  y sin la tabla esa comprobación no se puede correr. **Las columnas no se inventaron:** se copiaron
  del bloque *Produce* de la pieza 3, que es donde el plan las fija.
- **Un momento se escribe siempre igual**, con el desfase adentro: `2026-09-02T10:00:00-06:00`. Es
  el mismo texto que viaja al navegador, que el navegador devuelve y que queda guardado en la base:
  un solo formato en todo el proyecto y ninguna conversión donde equivocarse.
- **La aplicación recibe el reloj como dato**, en vez de averiguar la hora por su cuenta. Razón: sin
  eso, una prueba del calendario diría cosas distintas según el día en que se corra —«mañana hay
  horarios» falla los sábados— y una prueba así no comprueba nada. En `npm start` es el reloj de
  verdad; en las pruebas está parado en el martes 1 de setiembre de 2026.
- **El servidor dice *por qué* un día no ofrece horarios**, con un campo `estado` que vale
  `cerrado`, `feriado`, `hoy_o_pasado`, `lleno` o `con_horarios`. Razón: el frontend no decide
  reglas de negocio (`DISENO.md`), y dejarlo deducir el motivo de una lista vacía sería hacerlo
  decidir.
- **El logo y los colores del negocio se guardan pero no se aplican.** Razón: ya estaba resuelto en
  `CLAUDE.md` — `VISUALS.md` es la apariencia de la aplicación, y el logo y los colores del negocio
  son la marca de quien la usa. Aplicarlos pisaría el sistema visual aprobado.
- **El catálogo y el calendario piden sesión abierta; los datos del negocio no.** Razón: no existe
  la reserva como invitado (RN-9), así que un calendario que se pudiera mirar sin cuenta no llevaría
  a ninguna parte. La excepción es el nombre y el teléfono del negocio, que el pie de página muestra
  también en la pantalla de entrar.
- **Ningún color del calendario se inventó.** `VISUALS.md` nombra «un verde de éxito y un ámbar de
  alerta» para los estados pero **no dice cuáles son**, así que no se usaron: los cinco tonos con
  los que se distinguen los días salen de la lista de colores del propio archivo, y en el `.scss`
  cada uno tiene al lado con qué nombre aparece ahí.

**Lo que la construcción obligó a corregir hacia atrás** (dentro de la carpeta, como manda el
`CLAUDE.md` de la carpeta madre):

- `ESPECIFICACION.md` — **REG-4** ahora incluye el nombre y el teléfono del negocio, con la razón
  de cada uno.
- `DISENO.md` — la entidad «Configuración del negocio» y el componente «Catálogo» incluyen nombre y
  teléfono; se agregó la sección «Decisiones tomadas al construir la pieza 2» con las nueve
  decisiones; y en «Pendientes del sistema visual» el menú y la hamburguesa pasaron a la pieza 3
  mientras que el pendiente del nombre real del pie quedó **resuelto**.
- `PLAN.md` — el bloque *Produce* de la pieza 2 se corrigió entero: las tres tablas de
  configuración, la tabla `cita` creada acá, el endpoint `GET /api/negocio` que no existía, el
  campo `estado` de cada día, los códigos de error de cada endpoint, el formato del `inicio` y la
  decisión de la zona horaria. Cada corrección lleva escrita su razón.
- `CLAUDE.md` de `proyectoFinal/` — la tabla de comandos (qué carga hoy `npm run datos`, y que
  `npm test` son 40 pruebas), la estructura de carpetas con los dos archivos nuevos del servidor,
  una sección nueva de **Fechas y horas** con las cuatro reglas estrictas, y la aclaración de que
  el logo y los colores del negocio ya existen y **no se aplican**.
- `README.md` — el estado actual, los datos que carga `npm run datos`, las 40 pruebas y la
  estructura del código.

**Estado en que quedó la pieza al terminar el 2026-08-18: CONSTRUIDA, no cerrada.** Las 40 pruebas
pasaban —26 nuevas, escritas antes del código y vistas fallar primero: la corrida previa dio «pass
14, fail 26»— y las 12 comprobaciones del plan se corrieron contra la aplicación escuchando en
`http://localhost:3000`, con sus resultados copiados en el bloque `Evidencia`. Faltaba la revisión
visual en el navegador, que es la parte que el agente no puede dar por buena: todo lo anterior se
comprobó por HTTP y leyendo la base. Mismo criterio que se aplicó en la pieza 1.

**La pieza quedó CERRADA el 2026-08-19**, después de la revisión visual de la estudiante y de los
cuatro ajustes que salieron de ella (los dos pedidos y los dos hallazgos que están más abajo). Las
pruebas quedaron en 41.

**Encargos determinantes:** ninguno nuevo. Se construyó contra lo ya escrito, más las cuatro
decisiones de arriba.

**Entradas de gobernanza:** ninguna en esta sesión. No se detectó ninguna afirmación falsa del
agente.

**Ajuste del 2026-08-19, pedido por la estudiante con la pieza ya construida:** **un día entero
bloqueado no dibuja sus fichas de horario, solo el mensaje que explica el motivo.** Aplica a **hoy**
(RN-4) y a los **feriados** (RN-2). Razón: en los dos casos el día completo está fuera de juego, y
ocho fichas tachadas que nadie puede tomar solo estorban — el mensaje ya dice por qué, y en el caso
de hoy además dice a qué número llamar. **El API no se tocó:** sigue devolviendo los horarios con
`disponible: false`, porque las piezas siguientes los van a necesitar; lo único que cambió es lo que
la pantalla dibuja, con una condición en la vista. Los días donde solo *algunos* horarios están
tomados **sí siguen mostrando cuáles**, que es lo que RF-6 pide distinguir. Se corrigieron las
comprobaciones 7 y 9 del bloque `Evidencia` de `PLAN.md`, que describían el comportamiento anterior.

**Segundo ajuste del 2026-08-19: se agregó una tercera proveedora, «Luisa», a la limpieza facial.**
Pedido de la estudiante, con esta razón: la limpieza facial tenía una sola proveedora, así que el
cliente no elegía nada — y elegir con quién lo atienden es justamente lo que RN-8 le da. Quedó:
masaje relajante con Ana y Carlos, limpieza facial con Ana y Luisa.

- **El agente avisó del choque antes de tocar nada.** La comprobación 2 de `PLAN.md` decía
  literalmente «Elegir "Limpieza facial": aparece solo Ana», y había una prueba automática que lo
  verificaba. Ese caso no era casualidad: existía para probar la segunda mitad de RN-8, que cuando
  un servicio tiene **un solo** proveedor igual quede claro quién atiende. Se le presentó a la
  estudiante con sus tres opciones y ella eligió agregar a Luisa en la limpieza facial.
- **La cobertura de ese caso no se perdió: se mudó.** En vez de depender de que los datos de
  demostración tengan un servicio de un proveedor único, hay ahora una **prueba automática que se
  crea el suyo** —un servicio «Reflexología» con una sola proveedora— y comprueba que el sistema
  igual dice quién es. La regla queda protegida aunque los datos de demostración vuelvan a cambiar.
  Las pruebas pasaron de 40 a **41**.
- **Se corrigieron hacia atrás** la comprobación 2 de `PLAN.md` —con la nota de qué cambió, cuándo y
  por qué, en vez de reescribirla en silencio—, su fila en el bloque `Evidencia`, el conteo de
  pruebas, y la sección «Datos de prueba» del `README.md`.

**Hallazgo del 2026-08-19 — la cuadrícula del calendario se salía de su tarjeta.** Lo encontró la
estudiante en la revisión visual, con una captura de pantalla: en pantalla angosta, la columna del
domingo quedaba cortada por el borde derecho de la tarjeta. Vale la pena anotarlo porque **ninguna
de las 41 pruebas automáticas lo habría detectado**: todas hablan con el API por HTTP y ninguna
mira la página dibujada. Es exactamente la razón por la que una pieza no se cierra sin que alguien
mire la pantalla.

- **Qué pasaba, y por qué no era el padding.** Las 7 columnas del mes estaban escritas como `1fr`
  («repartan el ancho en partes iguales»). `1fr` tiene una letra chica que casi nadie recuerda:
  **promete además que una columna nunca se encoge más allá de lo que su contenido necesita**. Como
  cada casilla era cuadrada (`aspect-ratio: 1`) y tenía `min-height: 44px` —el tamaño mínimo para
  poder tocarla con el pulgar—, ese «lo que necesita» incluía 44px de **ancho**. Siete columnas de
  44px más seis espacios de 4px son **332px que la cuadrícula exigía sí o sí**, más de lo que la
  tarjeta tenía por dentro en una pantalla angosta. El padding de la tarjeta estaba funcionando
  perfectamente: era la cuadrícula la que se pasaba por encima de él.
- **El arreglo:** `minmax(0, 1fr)` en vez de `1fr`, que quita esa promesa y deja que el mínimo de
  cada columna sea 0, más `min-width: 0` en la casilla. Con eso las 7 columnas entran siempre, por
  angosta que sea la pantalla, encogiéndose todas por igual. Se quitó el `min-height: 44px` fijo,
  que era lo que forzaba el ancho.
- **Se corrigió además el problema opuesto, que todavía no se había visto:** en pantalla ancha las
  casillas se estiraban hasta unos 150px de lado —al ser cuadradas, crecer a lo ancho las hacía
  crecer a lo alto— y el mes quedaba enorme. El calendario ahora deja de crecer a las 40rem.
- **Lo que queda anotado como aprendizaje:** una regla `1fr` en una cuadrícula cuyas casillas
  tengan alto mínimo o proporción fija es un desborde esperando ocurrir. En este proyecto, **toda
  cuadrícula de ancho repartido se escribe `minmax(0, 1fr)`**. Quedó como convención en `CLAUDE.md`.

**Segundo hallazgo visual del 2026-08-19 — las fichas de horario no quedaban alineadas entre filas.**
También lo encontró la estudiante mirando la pantalla, con otra captura. Las ocho fichas de un día
—09:00, 10:00, 11:00, 13:00 arriba y 14:00 a 17:00 abajo— no formaban columnas parejas.

- **La causa era el ancho de los dígitos.** Las fichas estaban acomodadas una al lado de la otra
  (`flex`), así que cada una medía según su propio texto. Y en Manrope, como en casi toda
  tipografía, **el `1` es más angosto que el `0`**: «11:00» ocupa menos que «09:00». Con anchos
  distintos, la ficha de abajo nunca caía justo debajo de la de arriba. No era un problema de
  espaciado ni de relleno: era que ninguna ficha medía lo mismo que otra.
- **El arreglo, en dos partes.** Las fichas pasaron a **cuadrícula** —4 columnas en teléfono y 8
  desde tableta, que es la cantidad de horarios de un día entre semana—, así que todas miden
  exactamente lo mismo y las filas quedan alineadas siempre. Y se agregó
  `font-variant-numeric: tabular-nums`, que hace que el 1 ocupe lo mismo que el 0, para que las
  horas queden alineadas también **dentro** de cada ficha, no solo las cajas.
- **De paso se emparejó el ancho de las dos tarjetas** del paso 3. El tope de 40rem que se le había
  puesto al calendario esa misma mañana dejaba la tarjeta del calendario más angosta que la de los
  horarios en pantalla grande; el tope se movió al paso completo, así las dos quedan iguales.
- **Los dos hallazgos del día tienen la misma moraleja:** las 41 pruebas automáticas hablan con el
  API y ninguna mira la página dibujada, así que ninguna de las dos cosas se podía detectar sin que
  una persona abriera el navegador. La revisión visual no es un trámite al final: es la única
  comprobación que cubre esta clase de errores.

### 2026-08-19 — construcción de la pieza 3: reservar un horario

*El encargo fue una sola frase: «La carpeta del día es `proyectoFinal`. Vamos a construir la pieza 3
del plan». Sin explicaciones del proyecto, a propósito: si el agente no lo entendía leyendo los
documentos, es que faltaba algo escrito.*

**Cuatro preguntas que el agente hizo antes de escribir una línea**, porque los documentos no las
resolvían:

1. **Dónde va la configuración de integración continua.** GitHub solo ejecuta los archivos que están
   en `.github/workflows/` **en la raíz del repositorio**, y la regla del `CLAUDE.md` de la carpeta
   madre dice que todo el trabajo del día queda adentro de la carpeta del día. → **Autorizado crearlo
   en la raíz**, como única excepción, con la razón escrita en el propio archivo y en `DISENO.md`.
   Sin eso, la comprobación 7 de la pieza no se podía cumplir de ninguna manera.
2. **Cómo se ve el momento de confirmar la reserva.** → **Una tarjeta abajo, en la misma página**, no
   una ventana emergente. `VISUALS.md` permitía las dos, y se eligió la tarjeta porque el calendario
   sigue a la vista mientras se confirma.
3. **Cómo conviven «Reservar» y «Mis citas».** → **Dos vistas que se alternan**, no dos secciones
   apiladas. Es lo que convierte el menú en un menú de verdad, y evita una página larguísima en
   teléfono.
4. **Dónde va el botón «hamburguesa».** `DISENO.md` decía que el menú va en el pie, pero no decía
   dónde va la hamburguesa. → **En la barra azul del encabezado**, porque las tres rayitas en el pie
   de la página son un lugar donde nadie las busca. Los mismos dos enlaces quedan en los dos lados.

**Cómo se resolvió CA-1, que era el trabajo técnico de la pieza.** «Comprobar que el horario está
libre» y «guardar la cita» son **dos movimientos**, y entre uno y otro cabe la reserva de otra
persona: esa es la carrera. La solución tiene dos candados, uno adentro del otro:

- **Un índice único parcial en la base de datos:** `(proveedor_id, inicio)` pero solo
  `WHERE estado = 'activa'`. Es el candado de verdad — no hace la segunda inserción improbable, la
  hace **imposible**. Es **parcial** a propósito: un índice único normal dejaría el horario de una
  cita cancelada bloqueado para siempre, y RN-7 («cancelar libera el horario de inmediato») no se
  podría cumplir nunca.
- **Una transacción `immediate`**, que junta la comprobación y la inserción en un solo movimiento.

La comprobación previa se conservó igual, y no por seguridad: es la única que sabe **por qué** se
rechaza —feriado, domingo, hoy— y puede dar el mensaje correcto. El índice solo sabe decir «no». Se
comprobó aparte, con un guion suelto, que el candado es de la base y no del código: insertando dos
veces a mano la misma cita activa, la segunda se estrella contra `SQLITE_CONSTRAINT_UNIQUE`.

**Tres huecos del plan que la construcción destapó**, corregidos en el bloque *Produce* de la pieza 3
de `PLAN.md` **antes** de escribir el código, con la nota de qué cambió y por qué:

1. **El plan no decía cómo se cumple CA-1**, solo que se tenía que cumplir. Se agregó el índice único
   parcial al bloque.
2. **El plan no decía qué pasa si reserva la cuenta de Personal.** Las dos cuentas de la pieza 1
   tienen sesión, así que había que decidir algo. → **`403 solo_clientes`**. Sin ese rechazo, la cita
   quedaría guardada con el id de Personal en la columna `cliente_id`, que es el id de **otra
   persona** de la tabla `cliente`: una cita de alguien que nunca la pidió. Reservar en nombre de
   quien llama por teléfono es la pieza 7, con su propio recorrido.
3. **El plan definía dos rechazos y no decía qué contestar en los demás casos** —un horario de un
   feriado, de un domingo, de la hora del almuerzo, de las 3 de la mañana—. → **El mismo
   `409 horario_no_disponible`**, porque el nombre del error ya los describe con exactitud y no hacía
   falta inventar un tercer código.

**Hallazgo del 2026-08-19 — el atributo `hidden` no estaba escondiendo nada.** Este no lo encontró
una captura de pantalla: lo encontró el agente leyendo el CSS antes de escribir las dos vistas
nuevas, que dependen justamente de `hidden`.

- **Qué pasaba.** El HTML tiene un atributo `hidden` que quiere decir «esto no se muestra», y el
  navegador lo cumple con una regla propia: `[hidden] { display: none }`. Pero **cualquier regla que
  escribamos nosotros le gana a la del navegador**, sin importar cuál sea más específica. `.paso` y
  `.tarjeta` dicen `display: flex`, así que el paso 2 («Elegí quién te atiende») y la tarjeta del
  detalle del día **se estaban viendo desde el arranque, vacíos**, aunque el HTML dijera `hidden`.
- **El arreglo:** una sola regla, `[hidden] { display: none !important }`. Es el único `!important`
  del archivo y tiene esa razón escrita al lado.
- **Por qué importa como aprendizaje:** es el **tercer** defecto visual del proyecto y, como los dos
  de la pieza 2, **ninguna de las 64 pruebas automáticas lo podía detectar** — todas hablan con el
  API y ninguna mira la página dibujada. Quedó anotado en la sección «Pruebas» del `CLAUDE.md` de la
  carpeta: una pieza no se cierra sin que una persona abra el navegador.

**Hallazgo del 2026-08-19 — la promesa de «Node 20 o superior» era falsa.** Lo destapó montar la
integración continua, que fue lo primero del proyecto en correr fuera de la máquina de la estudiante.

- **Qué pasaba.** `better-sqlite3` estaba en la versión 13, que en su propio `package.json` exige
  **Node 22 o superior**. El `README.md` y el `CLAUDE.md` prometen que el proyecto corre con Node 20,
  y el `CLAUDE.md` lo tiene además como restricción dura. Nadie lo había notado porque en la máquina
  de la estudiante corre Node 24, donde todo funciona.
- **Por qué no era un detalle.** La restricción del proyecto no es solo la versión: es que **ninguna
  dependencia necesite compilarse** en la máquina de quien clone el repositorio. En Node 20,
  `better-sqlite3` 13 no encuentra un binario listo y trata de compilarse, lo que pide herramientas
  que nadie prometió instalar.
- **El arreglo, y de dónde salió el criterio.** Se bajó la dependencia a `^12.11.1`, que soporta Node
  20 a 26. La alternativa era cambiar la promesa del README a «Node 22 o superior», y se descartó por
  un precedente ya escrito en `DISENO.md`: al elegir `dotenv` en la pieza 1 se dijo que «cambiar el
  README sería cambiar una promesa del curso para acomodar una comodidad del código». Las 64 pruebas
  siguen pasando con la versión 12.
- **El control que queda:** la integración continua corre las pruebas en **Node 20 y Node 24**. La
  promesa del README pasó de ser una frase a ser algo comprobado en cada push.

**Lo que quedó construido:** `POST /api/citas` y `GET /api/citas`; la regla de crear una cita en
`servidor/reservas.js` (el componente Reservas, que las piezas 5, 7 y 8 van a seguir llenando); la
pregunta «¿este horario se puede tomar?» agregada a `servidor/disponibilidad.js`, que es donde ya
vivía esa regla, en vez de escribirla de nuevo; `servidor/catalogo.js`, nuevo, con las dos preguntas
al catálogo que antes estaban adentro del archivo de rutas de la pieza 2; el índice único parcial; el
menú de navegación con su hamburguesa; las dos vistas; la tarjeta de confirmar; la sección «Mis
citas»; y la integración continua en la raíz del repositorio.

**Dos cambios pedidos en la revisión visual, el mismo 2026-08-19**, los dos con la razón de la
estudiante:

1. **El botón «Cerrar sesión» se mudó adentro del menú y se llama «Salir».** Estaba al lado del
   saludo desde la pieza 1, cuando no existía ningún menú y era el único lugar posible. Ahora que hay
   menú, salir es una opción de navegación como las otras dos. Queda escrito en los dos menús pero
   **se ve en uno solo a la vez**: en teléfono adentro de la hamburguesa, y desde tableta abajo en el
   pie, tal como lo pidió. El saludo volvió a ser solo el saludo.
2. **Un horario ya tomado pasó de gris apagado a azul marino con letra blanca**, el mismo par del
   botón «Confirmar la reserva». Razón de la estudiante: en gris sobre gris **la hora no se alcanzaba
   a leer**, y un dato que no se puede leer no informa nada. No se inventó ningún color: son el
   `primary` y el `on-primary` de `VISUALS.md`, y ese archivo describe las fichas libres y las
   elegidas pero **nunca dijo cómo se ve una tomada**, así que se llenó un hueco en vez de
   contradecir algo. **El tachado se conservó**, porque es lo que dice «este no se puede tomar» sin
   depender del color — lo necesita RF-6 y quien no distingue bien los tonos.

**Estado al cerrar la sesión:** la pieza quedó **construida pero no cerrada**. Faltan dos cosas, y
ninguna la puede hacer el agente solo: la **comprobación 7**, que necesita un push al repositorio, y
la **revisión visual** en el navegador, que es la única que ve la mitad de pantalla de las
comprobaciones 1, 2 y 4.

### 2026-08-19 — construcción de la pieza 10: la información del cliente (sección «Usuario»)

*Pedida por la estudiante el mismo día, después de la revisión visual de la pieza 3, y construida
fuera de orden. **No estaba en el plan**: es un requisito nuevo, y por eso lo primero que se hizo fue
escribirlo en `ESPECIFICACION.md` y `PLAN.md`, antes de tocar una línea de código.*

**El encargo, tal como llegó:** una sección con nombre, edad, cuándo empezó los servicios y qué
tratamientos tiene activos —los comprados, si hay paquetes—, y la pregunta: *«esto de los paquetes ya
lo hablamos pero lo tenemos en algún slice? si no lo tenemos dime dónde lo agregamos»*.

**La respuesta, buscada en los documentos en vez de contestada de memoria.** Los paquetes y los
tratamientos **no están en ningún slice, ni ahora ni más adelante**, y no por olvido:

- **PA-1** de `ESPECIFICACION.md` es el expediente del cliente —padecimientos, medicamentos,
  contraindicaciones, tratamientos en curso, consumo de paquetes— y dice literalmente: *«Queda fuera
  de alcance. El sistema solo guarda de cada cliente lo de REG-2 y su historial de citas.»*
- **PA-2** es *«cómo se registra que un cliente "tiene" un paquete de sesiones, dado que el sistema no
  maneja dinero»*, y **bloquea a PA-1**.
- `PLAN.md`, «Fuera del plan», las lista a las dos con la misma razón.

**Decisión de la estudiante:** dejarlos afuera por ahora, y construir solo la información básica.
Razón anotada: lo que falta decidir **no es técnico** — es quién dice que alguien compró un paquete y
cómo se descuenta una sesión. Eso quedó escrito en PA-1, para que la próxima vez que alguien pregunte
lo mismo la respuesta esté en el documento.

**Un hallazgo del encargo mismo:** de los cuatro datos que pidió, **dos no existían en el sistema**.
REG-2 guardaba de cada cliente solo nombre, correo y contraseña: **no había edad ni teléfono**. Y uno
de los cuatro salía gratis: «cuándo empezó los servicios» es la fecha de su primera cita, y las citas
ya estaban guardadas desde la pieza 3.

**Tres decisiones de la estudiante, todas del 2026-08-19:**

1. **El teléfono y la fecha de nacimiento se completan y se corrigen en «Usuario»**, no se piden al
   crear la cuenta. Razón: pedirlos en el registro obligaría a cambiar RF-1 y el contrato de la pieza
   1 —que ya está cerrada con sus 14 pruebas— y alargaría el registro justo cuando la persona quiere
   reservar. Y de todos modos hay que poder **corregir** un teléfono mal escrito, así que la pantalla
   de edición tenía que existir igual. Los dos campos quedaron **opcionales**.
2. **Se guarda la fecha de nacimiento, no la edad.** Razón: una edad guardada como número **queda
   vieja en el próximo cumpleaños** y nadie la va a ir a corregir — el sistema estaría mostrando un
   dato falso sin saberlo. Guardando la fecha, la edad se calcula cada vez y sale siempre correcta.
3. **La sección se llama «Usuario»** y su enlace vive en los dos menús: adentro de la hamburguesa en
   teléfono y en el menú del pie.

**Dos decisiones que tomó la construcción, con su razón, porque el encargo no las cubría:**

- **El correo no se puede cambiar** (RN-21, nueva). Cambiarlo arrastra dos cosas que esta entrega no
  resuelve: comprobar que el correo nuevo no sea de otra cuenta, y **confirmar que la persona de
  verdad tiene acceso a él** antes de que su forma de entrar dependa de eso. Sin lo segundo, un dedazo
  dejaría a alguien afuera de su propia cuenta.
- **El teléfono son exactamente 8 dígitos**, con guión o sin él, y se guarda normalizado como
  `8888-7777`. El negocio es uno solo y está en Costa Rica. Aceptar cualquier texto dejaría entrar un
  «llamame al celu», que no sirve para llamar a nadie.

**El caso borde que se probó aparte: la edad.** Restar los años a secas le daría 36 a alguien nacido
en octubre de 1990 cuando estamos en setiembre de 2026, y todavía tiene 35. Hay cuatro pruebas solo
para eso: el día antes del cumpleaños, el día mismo, el día después, y quien nació un 29 de febrero.
Todas paran el reloj, porque **una prueba que dice «tiene 36 años» empezaría a fallar sola el día del
cumpleaños** si usara la hora de verdad.

**Un problema que se resolvió antes de que apareciera: las columnas nuevas en una base que ya
existe.** `CREATE TABLE IF NOT EXISTS` sirve para una tabla nueva, pero **no toca una que ya está**.
En la base de trabajo de la estudiante la tabla `cliente` ya existía sin `telefono` ni
`fecha_nacimiento`, así que la sección habría fallado sin decir por qué. Ahora `abrirBase` agrega las
columnas que falten al abrir, sin borrar nada de lo guardado.

**Lo que quedó construido:** dos columnas nuevas en `cliente`; `GET` y `PUT /api/mi-informacion`;
`servidor/clientes.js`, nuevo, con las comprobaciones de los tres datos; `primeraCitaDelCliente` en
`servidor/reservas.js`; el cálculo de la edad en `servidor/tiempo.js`, que es donde vive todo lo de
fechas; la vista «Usuario» con su enlace en los dos menús; y 19 pruebas nuevas. **`npm test`: 83
pruebas, 83 pasan.**

**Además, el guardia de sesión se mudó a `servidor/sesion.js`.** Estaba escrito adentro de
`rutas/citas.js` y esta pieza necesitaba el mismo —cliente sí, Personal no—. Se movió a un solo lugar
en vez de copiarlo: es la regla del `CLAUDE.md`, y una regla escrita dos veces es una que se puede
desincronizar.

**Estado al cerrar la sesión:** falta **la revisión visual** de la sección, que es lo único que el
agente no puede hacer.

### 2026-08-19 — construcción de la pieza 11: categorías de servicio

*Tercer pedido del mismo día, y tercera pieza fuera de orden. El encargo: **subtipos de servicio, por
ejemplo tipos de masaje adentro de la categoría general «Masaje»**, y decidir en qué momento del
recorrido el cliente elige el subtipo.*

*Esta pieza **modifica el catálogo, que era de la pieza 2 y ya estaba cerrada**, así que lo primero
que se corrigió fue RF-5 de `ESPECIFICACION.md` —con la nota de qué cambió y cuándo— y solo después el
código.*

**Tres decisiones de la estudiante, todas del 2026-08-19:**

1. **Una tabla `categoria` aparte**, no un campo de texto ni un servicio «padre». Las tres opciones se
   le presentaron con su costo. Razón de la elegida: con un campo de texto el nombre de la categoría
   se repite en cada fila y **un dedazo crea una categoría fantasma** —«Masajes» en vez de «Masaje»—
   con un servicio adentro y sin que nadie se dé cuenta; con un servicio «padre», la tabla de
   servicios tendría filas **que no se pueden reservar** y cada consulta del sistema tendría que
   acordarse de excluirlas. Con una tabla aparte, el nombre está escrito una sola vez y **la cita
   sigue apuntando al servicio concreto**, así que ni la pieza 3 ni el cálculo de disponibilidad
   cambiaron una línea.
2. **Un paso nuevo, y solo si la categoría tiene más de un servicio** (RN-22). Un paso que ofrece una
   sola opción no es una elección: es un toque de más.
3. **Todos los servicios siguen durando una hora.** Se le mostró el costo de lo contrario: el cálculo
   de disponibilidad, los horarios en punto, el candado que impide la doble reserva y las 44 horas por
   semana **todos asumen una hora**, así que duraciones variables serían una pieza grande y riesgosa
   por sí sola, no un agregado a esta. Sigue declarado fuera de alcance.

**Una contradicción aparente que quedó explicada en el documento.** RN-22 dice que el paso del
servicio **no se muestra** cuando hay uno solo, mientras RN-8 dice que el paso del proveedor **sí se
muestra** aunque haya uno solo. Parecen dos reglas peleadas, y no lo son: saber **quién** te va a
atender es información que el cliente quiere tener incluso cuando no hay nada que elegir; saber que la
categoría «Facial» contiene un solo servicio no le aporta nada. La razón quedó escrita adentro de
RN-22 para que nadie lo lea como una inconsistencia.

**Quién decide si el paso se muestra: el servidor.** Cada categoría llega con un campo
`pideElegirTipo`. No es la pantalla contando cuántos servicios recibió: es la convención del proyecto
—el frontend no decide reglas de negocio y recibe el *por qué* junto con el *qué*—, la misma por la
que un día del calendario llega con su campo `estado` en vez de dejar que la pantalla deduzca de una
lista vacía. Si mañana RN-22 cambia, cambia en el servidor.

**Los datos de demostración se eligieron para que la regla sea comprobable.** «Masaje» tiene tres
servicios y «Facial» uno solo, a propósito: con tres se ve la mitad de RN-22 que muestra el paso, y con
uno la mitad que lo salta. Y los tres masajes tienen proveedores distintos —relajante: Ana y Carlos;
descontracturante: solo Carlos; piedras calientes: solo Ana— para que elegir el tipo cambie de verdad
quién atiende, y el paso nuevo no sea decorativo.

**Dos pruebas de la pieza 2 hubo que corregirlas, y las dos por razones legítimas.** Quedaron anotadas
en el propio archivo de pruebas con qué cambió y por qué:

1. *«ve los dos servicios del negocio»* comprobaba que la lista trajera **exactamente dos**, y ahora
   son cuatro. Se le quitó la cuenta: comprueba que estén los que importan, con su duración y su
   categoría. **Es la segunda vez que pasa lo mismo** —la primera fue al sumarse Luisa en la pieza
   2—, así que quedó como convención en `CLAUDE.md`: *una prueba no se ata a cuántos datos de
   demostración hay hoy.*
2. *«un servicio con un solo proveedor igual dice quién lo atiende»* se crea sus propios datos, y
   ahora crea también su propia categoría. Lo que comprueba no cambió.

**Un error que ninguna prueba podía detectar.** `npm run datos` quedó roto: importaba la lista
`SERVICIOS`, que esta pieza renombró a `CATEGORIAS`. Las 95 pruebas pasaban igual, y **no es un
descuido de las pruebas**: ellas importan `datos-de-prueba.js` directo, no el comando. Se descubrió al
correr el comando de verdad. Quedó como convención en `CLAUDE.md`: **los comandos también hay que
correrlos**, `npm test` no los toca.

**Un detalle de pantalla que la construcción destapó: los números de los pasos.** Estaban escritos a
mano en el HTML («1», «2», «3»). Con un paso que se salta, la persona vería «1, 3, 4» y pensaría que se
perdió algo. Ahora los escribe el JavaScript contando **solo los pasos visibles**, así que siempre son
seguidos, y si mañana aparece otro paso sigue funcionando sin tocarlo.

**Qué NO tocó esta pieza, y es el mejor resumen de por qué el modelo elegido era el correcto:** la
tabla `cita`, el cálculo de disponibilidad, el candado de CA-1, el calendario y la sección «Mis
citas». Ninguno cambió una línea, porque la cita nunca supo de categorías: sigue apuntando al
servicio.

**Estado al cerrar la sesión:** `npm test` → **95 pruebas, 95 pasan**.

**Revisión visual — hecha por la estudiante el 2026-08-19, sobre las tres piezas del día.** Recorrió la
lista de comprobaciones visuales de `PROXIMA-SESION.md` y **confirmó que las tres se ven y funcionan
como corresponde: no salió ningún defecto nuevo**. Vale anotarlo porque es la primera revisión visual
del proyecto que **no** encontró nada: las dos anteriores encontraron tres defectos entre las dos, y de
ahí salieron dos convenciones del `CLAUDE.md` (el `minmax(0, 1fr)` y el `[hidden]`).

**El push se hizo el 2026-08-19**, a pedido de la estudiante: las piezas 2, 3, 10 y 11 subieron juntas,
más la configuración de integración continua en la raíz del repositorio. Es **la primera vez que este
proyecto corre fuera de la máquina de la estudiante**. La **comprobación 7 de la pieza 3** se cierra
cuando ella confirme lo que muestra la pestaña Actions de GitHub: el agente no tiene `gh` instalado ni
ninguna otra forma de mirarla, así que no puede darla por buena por su cuenta.

### 2026-08-19 — la primera corrida de integración continua salió en rojo, y valió la pena

*Entrada de gobernanza. Es la primera vez que este proyecto corre **fuera de la máquina de la
estudiante**, y lo primero que hizo fue encontrar dos defectos que las 95 pruebas locales no podían
encontrar. Vale anotarlo completo porque es la mejor justificación de por qué la comprobación 7 de la
pieza 3 existe.*

**Qué pasó.** Se subieron las piezas 2, 3, 10 y 11 más la configuración de integración continua. La
corrida `Pruebas #1` (commit `e4267e0`) salió en **rojo**. La estudiante lo vio en la pestaña Actions y
lo trajo con una captura.

**Defecto 1 — el comando de pruebas no funcionaba en Node 20.** Estaba escrito
`node --test "pruebas/**/*.test.js"`. Ese patrón de comodines **el buscador de pruebas de Node lo
entiende solo desde la versión 22**: en Node 20 el texto se toma como el nombre de un archivo, no lo
encuentra, y falla.

- **Por qué nadie lo había notado:** en esta máquina corre Node 24, donde el patrón sí funciona. La
  promesa del `README.md` es «Node 20 o superior», y **nada la comprobaba** hasta que existió la
  integración continua.
- **Es la segunda promesa de Node 20 que resultó falsa el mismo día.** La primera fue
  `better-sqlite3`, que exigía Node 22 y se bajó a la línea 12. Las dos las destapó lo mismo: correr
  fuera de esta máquina. Y no es casualidad que las dos aparecieran juntas: **una promesa que nada
  comprueba se rompe sola con el tiempo**, sin que nadie haga nada mal.
- **El arreglo:** `node --test`, sin decirle qué archivos. Node los busca solo y funciona igual en Node
  20 y en Node 24. Se comprobó que encuentra las mismas 95 pruebas.

**Defecto 2 — una prueba dependía del día en que se corriera.** La comprobación 5 de la pieza 11
buscaba «algún día del mes en curso con horarios libres» **con el reloj de verdad**, en vez de parar el
reloj como hacen las pruebas del calendario. Un mes que se está acabando, o una corrida un sábado a fin
de mes, se queda sin ningún día que sirva y la prueba falla sin que nada esté mal.

- **Es un defecto del agente, de esta misma sesión**, y contra una convención que el propio proyecto ya
  tenía escrita desde la pieza 2: *«una prueba que dice cosas distintas según el día en que se corre no
  comprueba nada»*. Estaba escrita para las pruebas del calendario, y el agente no la aplicó a una
  prueba del catálogo que resultó tocar una fecha.
- **El arreglo:** parar el reloj en `MOMENTO_DE_PRUEBA` y escribir la fecha fija.
- **La convención se amplió en `CLAUDE.md`:** ninguna prueba se cuelga del día en que se corre — **no
  solo las del calendario, cualquiera que toque una fecha**.

**La moraleja, que es la de toda la sesión.** Las 95 pruebas locales pasaban. La revisión visual estaba
hecha y no había encontrado nada. Y aun así quedaban dos defectos, y los dos eran del mismo tipo: **algo
que solo se puede ver en un lugar distinto de donde se construyó.** Es la misma lección que dieron los
defectos visuales de las piezas 2 y 3 —que solo se ven mirando la pantalla— aplicada a otra dimensión:
la máquina donde corre.

**Cierre.** La segunda corrida (`Pruebas #2`, commit `341187f`) quedó en **verde**: `Status: Success`,
2m 10s, los dos trabajos en verde —`pruebas (20)` y `pruebas (24)`— con las 95 pruebas cada uno.
Confirmado por la estudiante en la pestaña Actions. **Con eso la comprobación 7 quedó cumplida y la
pieza 3 cerrada**, y las tres piezas del día —3, 10 y 11— quedaron cerradas.

**Queda anotado un pendiente chico, sin urgencia:** esa corrida trae dos avisos amarillos que dicen que
`actions/checkout@v4` y `actions/setup-node@v4` apuntan a Node.js 20, que GitHub está jubilando **como
motor de sus propias herramientas**. No tiene relación con la promesa de Node 20 de este proyecto —son
dos Node distintos— y no rompe nada. Conviene subir esas dos herramientas a su versión 5 en algún
momento: un aviso que aparece siempre, incluso cuando todo está en verde, enseña a ignorar los avisos.

### 2026-08-19 — el tiempo dedicado al proyecto sube de 6 a 9 horas por semana

**Decisión de la estudiante**, el mismo día que se cerraron las piezas 3, 10 y 11. Es el segundo
aumento: el 2026-08-17 había subido de 4 a 6.

**Qué cambia en la cuenta.** Desde hoy y hasta la entrega del **8 de setiembre de 2026** (`PROYECTO.md`
§ encabezado) quedan unas **26 horas** de trabajo disponibles.

**El estimado de lo que falta, calibrado con lo que de verdad tardó lo hecho** —las piezas 1, 2 y 3
llevaron unas 5 horas de sesión cada una; la 10 y la 11 alrededor de una hora cada una—:

| | Horas |
|---|---|
| Piezas 4, 5, 7, 8 y 9 | ~19 |
| La skill propia que pide la rúbrica, más preparar la presentación | ~4 |
| **Subtotal** | **~23 de 26** |
| Pieza 6 adaptada | +5 |
| **Con la pieza 6** | **~28 de 26** |

**La conclusión, y no es una opinión: la pieza 6 no entra.** Coincide con lo que
`FICHA-APROBACION.md` anticipó desde el principio —«la de mayor riesgo técnico… la primera en recortar
si el tiempo aprieta»—, y ahora hay además una razón técnica concreta, no solo de tiempo: **su tarea
programada de GitHub Actions no puede llamar a una aplicación que corre en `localhost`**, y alojarla en
un servidor público es una decisión que `DISENO.md` dejó explícitamente abierta. El desglose y los tres
caminos posibles están en `PROXIMA-SESION.md`.

**Una corrección del agente, anotada porque afectó una decisión.** Al estimar por primera vez, el
agente dijo «unas 14-15 horas» para las cinco piezas sin la 6. **Estaba mal: la suma de sus propios
números da 19.** Con 6 horas por semana la diferencia parecía chica; con la entrega a tres semanas y la
pieza 6 en la balanza, esas 4-5 horas son exactamente lo que decide si algo entra o no. El número
corregido es el que quedó escrito en `PROXIMA-SESION.md` y acá.

*Nota de método, igual que con el aumento anterior: `FICHA-APROBACION.md` sigue diciendo «4 horas por
semana» a propósito. Ese documento es registro fechado de lo que el docente aprobó, no un documento
vivo. Si alguien encuentra «4 horas» o «6 horas» en un documento anterior a esta entrada, el número
vigente es **9**.*

---

### 2026-08-19 — construcción de la pieza 4: el correo de confirmación

**Qué se construyó.** Al confirmarse una reserva, al cliente le llega un correo con la fecha, la
hora, el servicio, el proveedor y la ubicación del negocio (RF-11), y cada envío queda registrado
—haya salido bien o mal— en la tabla nueva `correo_enviado` (REG-3). Es la primera pieza que habla
con un **servicio de afuera**: Resend.

**Cuatro preguntas antes de escribir una línea.** Ningún documento del proyecto decía cómo llamar a
Resend, si la pantalla tenía que esperar al correo, ni cómo se veía el correo. Se buscaron en
`ESPECIFICACION.md`, `DISENO.md`, `PLAN.md`, `README.md` y `VISUALS.md`, no estaban, y se le
preguntaron a la estudiante. Las cuatro las decidió ella:

1. **A Resend se le habla con `fetch`, la función que Node 20 ya trae, sin instalar su paquete de
   npm.** Mandar un correo es un solo pedido a una dirección con la clave en una cabecera: son unas
   20 líneas a cambio de una dependencia menos. El `README.md` apuntaba a `resend-node` como
   repositorio oficial del correo y se corrigió con esta decisión.
2. **La pantalla espera a que el correo salga** antes de contestar «tu cita quedó reservada». La
   cita ya está guardada cuando el envío empieza, así que RF-19 se cumple igual; lo que se gana es
   que el resultado del envío se pueda comprobar sin que ninguna prueba tenga que adivinar cuánto
   esperar.
3. **El correo lleva los colores del sistema visual**, con una versión de texto plano de respaldo.
4. **La estudiante todavía no tiene cuenta de Resend**, así que las comprobaciones 1 y 4 del plan
   —«ver que el correo llega»— quedan pendientes, anotadas como tales en `PLAN.md`. El paso a paso
   para crear la cuenta quedó escrito en el `README.md`.

**Dos límites que no estaban en ningún lado y se adoptaron acá.** `ESPECIFICACION.md` dice «el
sistema reintenta» sin decir cuántas veces. Se fijaron **dos intentos con un segundo de pausa**, y
—esto es lo que importa— **se reintenta solo cuando la falla puede ser pasajera**: si Resend contesta
que la clave no sirve, repetir el pedido daría exactamente lo mismo y solo haría esperar más a quien
reservó. También se fijó una **espera máxima de 5 segundos** por intento, porque sin ella un
servicio que no contesta dejaría el botón «Confirmar la reserva» girando indefinidamente.

**Cómo se prueba un correo sin mandar correos.** Es el problema central de la pieza, y se resolvió
con la misma idea que las fechas: **el enviador entra como dato**, igual que el reloj. La aplicación
no sabe cómo se manda un correo — recibe una función y la llama. En `npm start` es la que habla con
Resend; en las pruebas es una de mentira que los guarda en una lista. Así **ninguna prueba
automática le manda un correo a nadie**, la integración continua no necesita ninguna clave secreta,
y todo lo que está de este lado del borde —la plantilla, el registro y el reintento— queda probado de
verdad. Es la única imitación en las 109 pruebas del proyecto, y esa es su razón.

**Un defecto encontrado leyendo, no corriendo.** `npm run datos` iba a quedar roto: `correo_enviado`
apunta a `cita` y a `cliente`, la base tiene las llaves foráneas encendidas, y el borrado de los
datos de prueba no incluía la tabla nueva — SQLite se habría negado a borrar la cita. Se escribió
primero la prueba que lo reproduce (falló con `SQLITE_CONSTRAINT_FOREIGNKEY`), y después el arreglo.
Es el mismo tipo de defecto que la pieza 11 destapó a mano; ahora hay una prueba que lo cubre, y la
lección quedó escrita en el `CLAUDE.md` de la carpeta.

**Un segundo defecto, este del propio agente.** Al escribir los avisos de consola de
`servidor/index.js` quedaron saltos de línea de verdad adentro de los textos, en vez de la marca
`
`. Eso es un error de sintaxis: **`npm start` no habría arrancado**. Ninguna de las 109 pruebas lo
podía detectar, porque `npm test` no ejecuta `index.js`. Se descubrió leyendo el propio cambio, se
arregló, y se comprobó con `node --check` y levantando la aplicación de verdad. Refuerza la regla que
ya estaba escrita desde la pieza 11: **los comandos también hay que correrlos**.

**Qué se comprobó, y qué no.** Las 14 pruebas nuevas se escribieron antes del código y se vieron
fallar (la corrida previa dio «tests 96, pass 95, fail 1»). `npm test` da **109 de 109**. Se comprobó
además, corriendo los comandos, que **`npm start` levanta sin `RESEND_API_KEY`**, avisa qué falta y
contesta los pedidos con normalidad — que es RF-19 en el arranque y no solo en el envío. Y se hizo
una comprobación contra el Resend **de verdad**: se le mandó un envío con una clave inventada y
contestó `401 API key is invalid`, que la aplicación clasificó bien como falla definitiva. Eso
demuestra de paso que la dirección y las cabeceras del pedido son correctas — un error de ruta habría
dado 404, no un 401 hablando de la clave. **Lo que no se comprobó: que un correo llegue a una bandeja
de entrada de verdad.** Eso necesita la cuenta de Resend, y queda anotado como pendiente en `PLAN.md`
en vez de darse por hecho.

**Documentos corregidos por esta pieza**, dentro de `proyectoFinal/`: `PLAN.md` (evidencia y
decisiones de la pieza 4), `DISENO.md` (once decisiones nuevas y el modelo de datos, que ahora dice
que `correo_enviado` guarda también los envíos fallidos), `CLAUDE.md` (una sección «El correo» nueva,
la estructura de carpetas, el conteo de pruebas y dos lecciones más en «Pruebas»), `README.md` (la
tabla del stack, que apuntaba al paquete que no se usa, y una guía nueva para conseguir la clave de
Resend), `.env.ejemplo`, `SEGUIMIENTO.md` y `PROXIMA-SESION.md`.

**Un defecto visual, encontrado por la estudiante mirando la pantalla.** «Tu cita quedó reservada»
salía **con los colores de error**, en rojo: una buena noticia con cara de problema. La causa era que
ese mensaje usaba `mostrarAviso` a secas en vez de `mostrarAvisoDeExito`, la función que ya existía.
Y al arreglarlo apareció un hueco de fondo: **`VISUALS.md` nombra un «success green» entre los
indicadores de estado pero nunca dice cuál es**, así que el proyecto no tenía ningún verde. La
estudiante eligió `#d6e9db` con texto negro, y quedó registrado como decisión en `DISENO.md`. Es el
**cuarto** defecto visual del proyecto encontrado por una persona: **ninguna prueba automática puede
ver un color equivocado**, porque todas hablan con el API.

---

### 2026-08-19 — pieza 12: las reglas de la contraseña y del correo

**Qué se pidió y qué había antes.** La estudiante pidió, mientras esperaba su cuenta de Resend, que
al crear una cuenta se exigiera **6 caracteres, una mayúscula y un número**, que las condiciones se
vieran ponerse verdes mientras uno escribe, y que se comprobara el formato del correo. Hasta ese día
**el sistema aceptaba cualquier contraseña, incluso una sola letra**, y cualquier texto como correo.

**Eso no era un olvido, y por eso importa.** Estaba anotado en `SEGUIMIENTO.md` desde la pieza 1 como
un pendiente **abierto a propósito**: «decidir si la contraseña lleva un largo mínimo. Hoy no lo
lleva, a propósito: ningún documento lo pide y **no se agregó una regla de negocio desde el
código**». O sea: en su momento se decidió no inventar la regla, sino esperar a que alguien la
decidiera. Ese día llegó, y la decidió la estudiante.

**El camino fue el de las piezas 10 y 11, no el atajo.** Primero se escribieron las reglas en
`ESPECIFICACION.md` —RN-23 (la contraseña), RN-24 (el correo) y RF-23 (mostrarlas mientras se
escribe)—, después se anotó la pieza 12 en `PLAN.md` con sus 8 comprobaciones, y **recién entonces**
se escribieron las pruebas y el código. Esto toca el registro, que es de la pieza 1 **ya cerrada**:
por eso lo primero que se corrigió fue el documento anterior.

**Tres decisiones que la estudiante tomó y que no eran obvias:**

1. **Dos renglones en pantalla, no tres**, aunque las condiciones sean tres: el largo va solo (es lo
   único que cambia en cada tecla) y la mayúscula y el número van juntas.
2. **Antes de escribir la primera letra los renglones están en gris**, ni verdes ni rojos. Marcar en
   rojo un campo que nadie tocó es regañar antes de que pase nada.
3. **El correo se comprueba al salir del campo, no en cada tecla.** Escribir un correo pasa por
   muchos estados inválidos (`a`, `an`, `ana@`), y marcarlos sería regañar por algo que la persona
   todavía está haciendo.

**Lo que hubo que resolver de fondo: la misma regla escrita en dos lados.** La pantalla necesita
conocer las condiciones para pintar los renglones, y el navegador **no puede leer los archivos de
`servidor/`**. Eso choca de frente con la convención del proyecto —«una regla de negocio se escribe en
un solo lugar»—, así que la salida fue declarar explícitamente que **los dos no pesan igual**: el
servidor **decide** y la pantalla **avisa**. Si se desincronizaran, lo peor que puede pasar es que la
pantalla diga «verde» y el servidor rechace igual; nunca al revés. Quedó escrito en
`servidor/credenciales.js`, en `CLAUDE.md` y en el propio RF-23.

**La comprobación que hace que esto no sea decorativo** es la 7: una prueba que le manda el pedido al
API con `fetch` pelado, **sin el ayudante que simula el navegador**, con la contraseña `a`. Se rechaza
igual. Si la regla viviera solo en el JavaScript de la página, esa prueba pasaría de largo y
cualquiera podría saltársela abriendo una terminal.

**Qué se comprobó.** Las 17 pruebas nuevas se escribieron antes del código y se vieron fallar: la
corrida previa dio «tests 17, pass 9, fail 8», y las 8 que fallaban eran exactamente las de las reglas
nuevas. `npm test` da **126 de 126**. Se comprobó además contra la aplicación de verdad en
`http://localhost:3000` que `abc` da `faltan: ["largo","mayuscula","numero"]`, que `abcdefg` da
`faltan: ["mayuscula","numero"]` —sin nombrar el largo, que ya se cumplía—, que `ana@ejemplo` da
`correo_invalido`, y que `Abc123` (el borde exacto de 6) da `201`. **Falta la comprobación 8**, que es
la visual y la tiene que mirar una persona.

**La comprobación del correo es a propósito generosa:** `ana.maria-lopez@sub.ejemplo.co.cr` se
acepta. Una comprobación demasiado estricta deja a gente afuera de su propia cuenta, que es peor que
el problema que resuelve.

**La regla de la contraseña se corrigió tres veces esa misma tarde, y las tres las encontró la
estudiante mirando la pantalla.** Queda anotado porque es el mejor ejemplo que tiene el proyecto de
por qué `CLAUDE.md` exige que una pieza no se cierre sin que una persona la abra en el navegador:

1. **El primer intento aceptaba mayúsculas con tilde** (`Á`, `É`, `Ñ`) como la mayúscula
   obligatoria. Ella probó `Ángela2026`, no le gustó, y pidió que no contaran.
2. **Después escribió `óArtolo123` y la vio pasar.** El agente revisó y no era un defecto: pasaba
   por la `A` de «Artolo», no por la `ó`. **La regla hacía exactamente lo que decía, pero no lo que
   ella quería.** Se cambió la regla, no la explicación — y ahí se prohibieron las tildes del todo.
3. **Y ese cambio se pasó de largo: también prohibía la ñ.** Ella lo señaló con una frase que zanja
   el asunto: «la ñ no es una tilde, es una letra compuesta». Tenía razón. La ñ es una letra del
   alfabeto español, con su lugar entre la N y la O; lo que lleva encima es una virgulilla y es parte
   de la letra, no un acento. Quedó afuera de la prohibición: `Contraseña123` se acepta,
   `óArtolo123` no.

**Ninguna prueba automática podía encontrar ninguna de las tres**, y no por falta de cobertura: las
tres eran sobre **qué tenía que decir la regla**, no sobre si el código cumplía lo escrito. Una
prueba comprueba lo segundo. Lo primero solo lo ve una persona.

**Un defecto de oficio del agente, encontrado al revisar su propio cambio:** al escribir la
comprobación de las tildes, los acentos quedaron metidos en el código como **caracteres
invisibles** (los acentos sueltos, sin la letra que los lleva). Funcionaba, pero esa línea era
ilegible para cualquiera. Se reescribió con los códigos (`\u0300-\u036f`) y quedó anotado en el
propio archivo por qué va escrito así.

---

### 2026-08-19 — los ajustes visuales de la tarde, todos pedidos mirando la pantalla

Ninguno estaba planeado. Todos salieron de la estudiante abriendo la aplicación en el navegador, y
por eso se anotan juntos: es la evidencia de que **la revisión visual es parte del trabajo, no un
trámite al final.**

| Qué se pidió | Qué había antes | Por qué importa |
|---|---|---|
| **El aviso de «tu cita quedó reservada», en verde** (`#d6e9db`, letra negra) | Salía **en rojo**, con los colores de error | Era un defecto de verdad: una buena noticia con cara de problema. La causa era que ese mensaje llamaba a `mostrarAviso` a secas en vez de a `mostrarAvisoDeExito`, que ya existía. Y al arreglarlo apareció un hueco de fondo: **`VISUALS.md` nombra un «success green» pero nunca dice cuál es**, así que el proyecto no tenía ningún verde. |
| **El texto de guía y de error, a 12px** | 14px los requisitos y la ayuda, 16px los avisos | Es el `label-sm` de `VISUALS.md`, así que no se inventó un tamaño: se cambió de un token del sistema a otro. Quedó como convención en `CLAUDE.md` para las pantallas que vengan. |
| **Los requisitos de la contraseña, escondidos hasta tocar el campo** | Se veían siempre, colgando debajo de un campo vacío | Tres renglones de reglas antes de que haya nada que revisar son ruido. Se esconden de nuevo al salir del campo **solo si quedó vacío**: si hay algo escrito se quedan, porque ahí sí hay algo que revisar. |
| **Sin los íconos ✓ y ✗: solo el color de la letra** | Cada renglón tenía una marca a la izquierda | Al sacar el ícono, el texto quedó **alineado con el campo de arriba sin necesidad de ningún margen** — la sangría la causaba la marca. Alinear quitando lo que desalinea, no compensándolo. **Pero el color solo no le llega a quien no ve la pantalla**, ni a quien no distingue el rojo del verde: el estado se conservó en un texto invisible que solo leen los lectores de pantalla. Visualmente es idéntico a lo pedido. |
| **El logo del negocio en el encabezado, y los dos textos invertidos** | «Reservas en línea» era el título y «Bienestar y salud» la bajada | Ahora el nombre del negocio es el `h1` —el título principal de la página, lo que un buscador y un lector de pantalla toman como «de qué se trata esto»— y «Reservas en línea» quedó como bajada. El logo va con `alt=""` vacío a propósito: el nombre está escrito al lado, y leerlo dos veces molesta. |
| **El fondo de flores, un 25% más tenue** | A opacidad completa | **No se hizo con `opacity`**, y la razón quedó escrita como convención: `opacity` sobre el `body` volvería translúcido *todo* lo de adentro —textos, tarjetas, botones—, no solo el fondo. Se le puso encima una capa del color del lienzo al 25%: el resultado en pantalla es idéntico y no toca el contenido. |
| **El azul oscuro, de `#002554` a `#2f3367`** | El «Deep Navy» original de `VISUALS.md` | **El cambio se hizo en la variable `$navy` del `.scss`, no lugar por lugar**, y valió de una vez para las 18 apariciones del CSS final: encabezado, pie, botones, foco de los campos, el día de hoy del calendario, las fichas de horario tomadas, **y el encabezado del correo de confirmación**. Es exactamente para lo que existe una variable. |

**Tres cosas derivadas que había que mover con el azul, y que es fácil olvidar:**

1. **El tono oscuro del paso del mouse** (`$navy-oscuro`), de `#00112d` a `#1f2247`. Tiene que ser
   una versión más oscura **del mismo** azul: si no, un botón cambiaría de *color* al pasarle el
   mouse en vez de solo oscurecerse.
2. **Dos sombras escritas como `rgb(0 37 84)`**, que es el mismo color en otra notación porque una
   sombra necesita transparencia. **Por estar escritas así se escapan de cualquier búsqueda del
   texto `#002554`**, y la segunda apareció recién en una comprobación posterior, después de dar el
   trabajo por terminado. Ahora quedó anotado en el comentario de cada una.
3. **`VISUALS.md`**, que es la autoridad sobre la apariencia: su `primary` y su `primary-container`
   se actualizaron. Si se dejaban viejos, el sistema visual diría una cosa y el código otra. Es el
   mismo camino del 2026-08-17 con el fondo.

**El contraste se comprobó, no se supuso:** blanco sobre el azul nuevo da **11,7 : 1** y el celeste
de la bajada y el pie da **6,9 : 1**. El mínimo exigido para texto normal es 4,5 : 1, así que los dos
quedan holgados.

**Las entradas históricas de `BITACORA.md` y `SEGUIMIENTO.md` conservan `#002554` a propósito**: son
el registro fechado de lo que se decidió el 17 de agosto, no documentos vivos. Es la misma regla por
la que `FICHA-APROBACION.md` sigue diciendo «4 horas por semana».

---

### 2026-08-19 — el `CLAUDE.md` de la carpeta madre, corregido por la estudiante

Dos reglas nuevas, escritas por ella:

1. **«Explicame en lenguaje simple y de manera puntual.»** Se suma a la regla que ya estaba de
   explicar sin asumir: hay que explicar todo, pero corto.
2. **«Cuando me preguntes cosas, vamos una a la vez, una por una.»** Corrige algo concreto de esa
   misma sesión: al arrancar la pieza 4 el agente le hizo **cuatro preguntas juntas** en un solo
   bloque. Las cuatro eran necesarias y ninguna se podía adivinar, pero juntas son un formulario, no
   una conversación.

Quedan anotadas acá porque son la primera vez que la estudiante corrige **cómo se trabaja**, no qué
se construye.

---

### 2026-08-19 — las piezas 4 y 12 quedan cerradas, y una corrección de método

**Las dos piezas quedaron CERRADAS.** La 4 con sus 4 comprobaciones y la 12 con sus 8, las dos con la
integración continua en verde en Node 20 y Node 24 —confirmada por la estudiante en la pestaña
Actions— y las dos con su revisión visual hecha.

**La corrección de método, que es lo que vale anotar.** Al cerrar la sesión el agente seguía
diciendo que la revisión visual de la pieza 4 estaba pendiente. La estudiante lo cortó: «la pieza 4
ya la revisé, ¿qué más revisarla?». **Tenía razón, y el agente estaba arrastrando un "pendiente" sin
mirar la evidencia que ya existía en la propia conversación:**

- había reservado una cita y visto la pantalla pasar a «Mis citas» sin demora,
- había reservado **sin clave de Resend** y visto que la cita se creaba igual (RF-19 en vivo),
- había mirado la fila que quedó en `correo_enviado`,
- y había confirmado que el correo llegó: «test de resend: funciona perfecto».

La pieza 4 **no tiene pantalla propia**, así que eso era exactamente todo lo que había que mirar. El
error no fue de código: fue **no leer la evidencia que ya estaba dada** y repetir por inercia un
estado viejo. Es la segunda entrada de gobernanza del proyecto, después de la del 2026-08-17 sobre el
proceso que seguía vivo en el puerto 3000, y las dos tienen la misma forma: **el agente afirmando un
estado sin haberlo comprobado.**

Lo que sí quedaba abierto de verdad era otra cosa, y ahí la pregunta valía: después de la revisión de
la pieza 12 se habían pedido **seis cambios visuales más** —los renglones a 12px, escondidos hasta
tocar el campo, sin los íconos ✓/✗, el texto «No tildes», el logo con los textos invertidos, y el
azul nuevo— y ninguno estaba confirmado **ya puesto**. La estudiante confirmó que los había mirado.
Con eso cerró la 12.

**El balance de la revisión visual de la pieza 12, que conviene tener a mano para la defensa:** de
**una sola** revisión salieron **tres correcciones a la regla de negocio** y **seis cambios
visuales**. Ninguna de las nueve la podía encontrar una prueba automática — las tres de la regla
porque eran sobre *qué tenía que decir* la regla y no sobre si el código cumplía lo escrito, y las
seis visuales porque ninguna prueba de este proyecto mira la página dibujada.

### 2026-08-20 — construcción de la pieza 5: cancelar y reagendar

**La pieza que cierra el núcleo.** Con ella el prototipo hace el recorrido completo que
`FICHA-APROBACION.md` comprometió: entrar → elegir → ver el calendario → reservar → recibir el correo
→ cancelar o reagendar. Y trae **CA-3**, el último de los tres criterios de aceptación que
`PROYECTO.md` §7 punto 4 exige proteger con pruebas que corran en cada push.

**Lo que se encontró ya resuelto, y por qué vale contarlo.** Cinco cosas que esta pieza necesitaba
estaban hechas de antes, sin que nadie las hubiera pensado para ella:

1. Las columnas `cancelada_en` y `cancelada_por` ya existían en la tabla `cita`, vacías desde la
   pieza 3.
2. El índice único de la base es **parcial**: solo vigila las citas `activa`. Eso significa que
   **cancelar libera el horario sin una sola línea de código que libere nada** — dejar de estar
   activa *es* dejar de ocupar. RN-7 salió gratis.
3. `GET /api/citas` ya no filtraba por estado, a propósito, para que las canceladas también salieran.
4. El correo ya estaba resuelto entero, con su plantilla, su registro y su reintento.
5. `servidor/tiempo.js` ya tenía casi todas las cuentas de fechas.

Eso es lo que hace un plan que declara qué **Produce** cada pieza para las siguientes: la pieza 3 dejó
puesto el terreno de la 5 sin saber cómo iba a construirse. **No nació ningún archivo nuevo y no se
instaló ninguna dependencia.**

**Tres preguntas antes de tocar código.** Ninguna estaba contestada en los documentos, y la regla de
la carpeta dice preguntar en vez de elegir en silencio. Las tres las decidió la estudiante:

| Pregunta | Decisión | Lo que cambió |
|---|---|---|
| ¿Dónde aparece el calendario para reagendar? | **Reusar la pantalla «Reservar»** en modo reagendar, con los tres primeros pasos escondidos | Un segundo calendario habría sido un segundo lugar donde el mismo defecto puede aparecer — y el calendario ya dio dos de los siete defectos visuales del proyecto |
| ¿Al reagendar le llega un correo? | **Sí, el de confirmación con la fecha nueva** | **Corrigió RF-11 de `ESPECIFICACION.md`**, que solo hablaba de reservar. Sin esto, el aviso más reciente en la bandeja del cliente anunciaba un día que ya no era el suyo |
| ¿Cancelar pregunta antes? | **Sí, en la misma fila de la cita** | Cancelar no se deshace: la cita no se borra (RN-15), pero el horario puede llevárselo otra persona (RN-7). Un toque por equivocación en un teléfono no puede costar una cita |

**Lo que la construcción reveló que faltaba en el plan.** El bloque *Produce* de la pieza 5 nombraba
dos endpoints y tres rechazos, y al escribir el código aparecieron tres rechazos más que el sistema
igual tenía que contestar con algo: la cita que no existe, la cita que ya no está activa, y el horario
nuevo que cae en el día de hoy. Además hicieron falta cuatro campos nuevos en `GET /api/citas`. Todo
eso **se escribió primero en `PLAN.md`** —con su razón— y después en el código, que es el orden que
manda la carpeta.

**La decisión de diseño que más conviene poder defender:** cómo se mueve una cita a otro horario.
Suena a dos movimientos —liberar el viejo, tomar el nuevo— y en realidad es **uno**: es la misma fila
de la misma cita, y lo que cambia es su columna `inicio`. Escribirlo así hace **imposible** el estado
intermedio que daría miedo (la cita sin horario, o con los dos) sin ningún cuidado especial. La
alternativa —cancelar la vieja y crear una nueva— habría dejado dos filas donde el negocio tiene una
sola cita, y le habría cambiado el número de cita al cliente por debajo.

**El `404` que parece un error y es una decisión.** Cuando alguien intenta cancelar la cita de otra
persona, el sistema contesta «no existe», no «no es tuya». Un `403` le **confirmaría** a quien
pregunta que ese número de cita existe, y con eso se pueden ir contando las citas del negocio de una
en una. La forma de garantizarlo no es un `if` que alguien pueda olvidar: la búsqueda lleva el número
del cliente adentro, así que la cita de otra persona simplemente no se encuentra.

**El borde exacto de la regla, probado a los dos lados.** RF-13 dice «si faltan 4 horas **o más**».
Hay dos pruebas para eso: a 4 horas justas se permite, y con el reloj un minuto más adelante —3 horas
y 59 minutos— se rechaza. Es el tipo de detalle donde una regla escrita con un «mayor que» donde iba
un «mayor o igual» pasa desapercibida para siempre.

**Un caso borde que se resolvió no escribiéndolo.** Una cita que ya pasó tampoco se puede cancelar
desde la aplicación, y no hay ninguna línea de código que lo diga: si faltan −22 horas, faltan menos
de 4, y la misma regla la cubre. Un caso borde menos donde equivocarse.

**Las pruebas.** 33 nuevas, escritas antes del código y **vistas fallar primero** (67 fallas, 0
éxitos en la primera corrida). `npm test` da **168 de 168**. Tres llevan `CA-3` en el título para
poderlas encontrar de un vistazo. La que más vale de todas es la de la comprobación 5: le manda al
API el proveedor de otra persona **salteando la pantalla**, y es la que demuestra que la regla de
RN-18 vive en el servidor y no en un botón que no está.

**Lo que las pruebas no pueden ver, y se comprobó a mano:** que la aplicación levanta con el código
nuevo, que el JavaScript del navegador no tiene errores de sintaxis, y que **los 64 elementos que ese
JavaScript busca por `id` existen todos en el HTML**. Un `id` mal escrito no lo detecta `npm test` y
rompe la pantalla entera.

**Sigue faltando la revisión visual**, que es la única capaz de encontrar los defectos de pantalla.
Los siete defectos visuales de este proyecto salieron todos de ahí, ninguno de una prueba automática.

### 2026-08-20 — la revisión visual de la pieza 5 encuentra una frase falsa

**El octavo defecto visual del proyecto, y el primero de su tipo.** La estudiante abrió «Mis citas» a
mediodía y mandó una captura: dos citas de ese mismo día, una de las 9:00 y otra de las 10:00, decían
debajo *«Faltan menos de 4 horas para esta cita, así que no se puede cambiar desde acá. Si necesitás
moverla, llamá al negocio al 2000-0000.»*

Su observación fue: «solo está saliendo en la reserva nueva» — o sea, los botones de cancelar y
reagendar solo aparecían en una de las tres citas.

**Lo primero que se comprobó fue si el comportamiento estaba mal, y no lo estaba.** Con la hora del
negocio a las 11:16 de ese día:

| Cita | Cuánto faltaba |
|---|---|
| Jueves 20, 09:00 | **−2 h 17 min** → ya había pasado |
| Jueves 20, 10:00 | **−1 h 17 min** → ya había pasado |
| Jueves 27, 09:00 | +165 h → se podía cambiar |

Que esas dos citas no tuvieran botones era **correcto**: una cita que ya ocurrió no se cancela ni se
mueve, y la regla las cubre sola sin ningún caso especial —si faltan −2 horas, faltan menos de 4—.
Esa economía estaba anotada como decisión el mismo día, con la razón de que es «un caso borde menos
donde equivocarse».

**Lo que estaba mal era la frase.** «Faltan menos de 4 horas para esta cita» **es falso** si la cita
ya ocurrió. Y encima mandaba a llamar al negocio «para moverla», cuando ya no había nada que mover.

**Por qué esta entrada importa más que los siete defectos visuales anteriores:** los siete anteriores
eran de apariencia —un color equivocado, una cuadrícula desbordada, un tamaño de letra—. Este es
distinto: **las pruebas estaban todas en verde y tenían razón.** Comprobaban que la regla rechazara el
intento, y la regla lo rechazaba. Lo que estaba mal era **lo que la pantalla decía sobre esa regla**, y
eso ninguna prueba de este proyecto puede leer: una prueba puede comprobar que el texto *aparece*, no
que sea *verdad*. Es el argumento más fuerte que el proyecto tiene a favor de la regla de que **una
pieza no se cierra sin que una persona abra el navegador y mire**.

**Cómo se corrigió, y qué NO se tocó.** La estudiante decidió el texto: la cita pasada dice *«Esta
cita ya pasó. Para modificarla o cancelarla, llamá al negocio al…»*. La que está dentro de las 4 horas
pero todavía no ocurrió conserva su mensaje, que ahí sí es cierto.

Lo delicado era hacerlo **sin romper CA-3**, y para eso se separaron dos cosas que estaban juntas:

- **`revisarSiSePuedeCambiar` decide.** Su respuesta es la que viaja como motivo del rechazo de los
  endpoints, y ahí `ventana_de_cancelacion` **sigue siendo** `ventana_de_cancelacion`: es lo que fija
  el bloque *Produce* del plan y lo que comprueba CA-3. Una cita pasada se rechaza por RN-5, no por
  una regla nueva. **Los dos endpoints no cambiaron en una sola línea.**
- **`porQueNoSePuedeCambiar` explica.** Solo la usa `GET /api/citas`, y agrega un valor más al campo
  informativo `porQueNo`: `"ya_paso"`.

O sea: se agregó precisión al mensaje **sin tocar la regla ni el contrato**. Y la distinción la hace
el servidor, no la pantalla, porque el frontend no decide reglas de negocio — la pantalla solo elige
cuál de dos frases escribir según lo que el servidor le diga.

**2 pruebas nuevas** (una cita pasada dice `ya_paso`; una cita de hoy que todavía no pasó sigue
diciendo `ventana_de_cancelacion`), escritas antes del arreglo y vista fallar la primera. `npm test`
pasó de 168 a **170 de 170**. Y se comprobó el resultado **contra las citas de verdad de la base**, no
solo contra las de prueba.

**Un detalle de método que vale anotar:** al reiniciar la aplicación para que el arreglo se viera, el
envoltorio de `npm` se cerró pero **el proceso de node siguió vivo ocupando el puerto 3000** — que es
exactamente lo que había pasado el 2026-08-17 y quedó anotado como la primera entrada de gobernanza.
Esta vez no se afirmó que estuviera cerrado: **se comprobó el puerto, se vio que seguía ocupado, y se
cerró el proceso de verdad antes de arrancar.** El control que esa entrada estableció funcionó.

### 2026-08-20 — la misma revisión encuentra que el código no cumplía el plan

**Entrada de gobernanza, y de un tipo nuevo.** Las dos anteriores fueron afirmaciones falsas del
agente sobre el estado de algo (el proceso que seguía vivo, la pieza que ya estaba confirmada). Esta
es distinta: **el agente construyó algo que contradecía lo que el plan dice, y lo documentó con
seguridad como si fuera lo correcto.**

**Cómo salió.** Después de corregir la frase de las 4 horas, la estudiante volvió a mirar y observó
que la cita que había cancelado seguía en la lista aunque tocara el menú, fuera y volviera, y recargara
la página. Preguntó por qué.

**Qué se encontró al buscar en los documentos.** Tres lugares, y los tres dicen lo mismo:

| Dónde | Qué dice |
|---|---|
| `PLAN.md`, pieza 5 | «El cliente ve sus **citas activas** y puede cancelarlas si faltan 4 horas o más» |
| `PLAN.md`, pieza 3 | «El cliente ve sus **citas activas** en pantalla» |
| `ESPECIFICACION.md`, recorrido de cancelación | «El cliente entra a la aplicación y **ve su cita activa**» |

La pantalla mostraba **todas** las citas mezcladas: activas, canceladas y pasadas, en una sola lista
ordenada por fecha, que además iba a crecer para siempre.

**Cuál fue el error de razonamiento, que es lo que vale anotar.** La pieza 3 había decidido, con buena
razón, que `GET /api/citas` **no filtrara por estado**, para que las piezas 5 y 8 pudieran ver las
canceladas y las cerradas. Esa decisión es del **API**, y sigue siendo correcta. El agente la leyó y
sacó de ahí que **la pantalla** también tenía que mostrarlas todas — y encima apoyó ese salto en RN-15,
«nada se borra», que habla de **los datos**, no de lo que la pantalla muestra. Dos cosas distintas
tratadas como una: *qué se conserva* y *qué se enseña*.

Lo peor no fue el salto: fue que quedó **escrito como si fuera deliberado**, en un comentario del
código que decía que las canceladas «también salen» y en la propia respuesta al usuario. Un supuesto
mal fundado documentado con seguridad es más difícil de detectar que uno sin documentar, porque quien
lo lee después asume que alguien lo pensó.

**Por qué ninguna prueba podía encontrarlo.** Las 170 pruebas estaban en verde y tenían razón:
comprobaban que el API devolviera las canceladas —que es lo que la pieza 3 pidió— y lo devolvía.
**Ninguna prueba de este proyecto compara el código contra lo que el plan dice en prosa.** Ese trabajo
lo hace una persona leyendo, o mirando la pantalla y preguntando «¿por qué esto sigue acá?».

**Cómo se corrigió.** La estudiante eligió entre tres opciones y decidió **dos secciones**: «Tus
próximas citas» arriba y «Historial» abajo, de lo más reciente a lo más viejo. Se agregó el campo
`grupo` a cada cita, que vale `"proxima"` o `"historial"`, y **lo decide el servidor**: depende de qué
hora es, y con el reloj del navegador una máquina mal configurada mandaría al historial la cita de
mañana. La cita cancelada **sigue guardada en la base**: solo se mudó de sección, así que RN-15 no se
toca.

Y quedó separada de `sePuedeCambiar`, que es una pregunta distinta: **una cita de hoy en dos horas no
se puede cambiar pero sí es una cita próxima** — es la más urgente que esa persona tiene, y mandarla al
historial sería esconderle justamente lo que necesita ver. Hay una prueba dedicada a ese caso.

**4 pruebas nuevas**, escritas antes del arreglo y vistas fallar las cuatro. `npm test` pasó de 170 a
**174 de 174**.

**El control que queda establecido:** cuando una pieza decide algo sobre **el API**, eso no decide nada
sobre **la pantalla**. Son dos preguntas y se contestan por separado, cada una contra lo que el plan
dice de ella. Y al cerrar una pieza, **releer en voz alta el bloque «Qué tiene que ser cierto» del plan
y comprobarlo contra la pantalla, frase por frase** — no solo contra las pruebas, que comprueban lo que
alguien pensó comprobar.

### 2026-08-20 — la etiqueta de una cita pasada, y una salida mejor propuesta por la estudiante

**El tercer hallazgo de la misma revisión visual, y el que mejor muestra cómo debería funcionar esto.**

La estudiante pidió un cambio concreto: que una cita que ya pasó y que nadie canceló **no dijera
ACTIVA**, sino **COMPLETADA**. Su observación de fondo era correcta: «activa» suena a «esto está en
pie», y una cita del mes pasado no lo está.

**El agente no lo construyó: buscó primero, y encontró que choca con tres cosas escritas.**

| Dónde | Qué dice |
|---|---|
| `ESPECIFICACION.md`, RN-17 | «Una cita pasa al estado **completada** solo cuando Personal la marca así, después de que el cliente asistió. **No se marca sola al pasar la hora.**» |
| `ESPECIFICACION.md`, RN-19 | Si el cliente no se presenta, Personal la marca **«no asistió»** |
| `PLAN.md`, pieza 8 | «**Ningún estado se alcanza solo por el paso del tiempo**» |

La razón de fondo, que es la que importa: **la aplicación no sabe si la persona asistió.** Pasó la
hora, eso es todo lo que sabe. Presentarse o no lo sabe únicamente la asistente, que estuvo ahí. Si la
pantalla dijera «COMPLETADA» sola, le estaría afirmando a alguien que fue sin que nadie lo confirme —
y **se daría vuelta** el día que Personal marcara «no asistió»: la misma cita pasaría de COMPLETADA a
NO ASISTIÓ, que para quien mira se ve como un error del sistema.

**Y acá está lo que vale anotar: la salida la propuso ella, y era mejor que las tres del agente.** El
agente ofreció tres opciones —«PASADA» en pantalla, «COMPLETADA» en pantalla, o cambiar el dato— y la
estudiante contestó con una cuarta que ninguna era: **sacarle la etiqueta**.

Es mejor que las tres por cuatro razones:

1. **No hay que inventar ninguna palabra** que no esté ya en RN-17. «PASADA» habría sido un estado
   nuevo en la cabeza de quien lo lee, sin existir en ninguna regla.
2. **No afirma nada** sobre si la persona asistió.
3. **La etiqueta nunca se desdice.** Pasa de *no estar* a decir COMPLETADA o NO ASISTIÓ cuando
   Personal la cierre (pieza 8). Eso es un avance, no una contradicción.
4. **La regla se dice en una frase:** *la etiqueta aparece solo cuando algo le pasó a la cita.* Y su
   ausencia se entiende porque el título de la sección ya lo dice — «Historial: lo que ya pasó y lo
   que cancelaste».

Se sacó también la nota que iba debajo de esas filas, por lo mismo: repetía lo que el título ya decía,
una vez por cada cita vieja.

**Un detalle técnico que conviene no perder de vista.** El valor `"ya_paso"` del campo `porQueNo`
—agregado un rato antes ese mismo día— **ya no muestra nada, y sigue haciendo falta**: es lo único que
impide que una cita del mes pasado caiga en el renglón que dice «faltan menos de 4 horas para esta
cita». Si el servidor dejara de distinguirlo, esa frase falsa volvería sola. Un campo que no se ve pero
que sostiene algo es justo el tipo de cosa que alguien borra en seis meses por «no usarse», así que
quedó escrito en el propio archivo y en `DISENO.md`. Y hay una prueba que lo cubre.

**Este cambio no tiene ninguna prueba automática, y no puede tenerla:** es puramente qué se dibuja y
qué no. El servidor no cambió en una sola línea, y `npm test` siguió dando 174 de 174 sin que se
tocara ni una prueba. Es el ejemplo más limpio del proyecto de un cambio que **solo** la revisión
visual puede validar.

### 2026-08-20 — el vocabulario: al cliente se le dice «terapista»

La estudiante pidió cambiar «Te atiende» por **«Terapista»**. Es un cambio de texto, y se hizo como
tal: **siete lugares** —tres en el HTML, tres en el JavaScript del navegador y la etiqueta del correo
de confirmación—, sin tocar ninguna función.

**Lo que no se cambió, y es lo importante:** la tabla, las columnas y los campos del API **siguen
llamándose `proveedor`**. Los nombres técnicos los fija el bloque *Produce* de `PLAN.md`, y no se
renombran porque cambie un rótulo de pantalla. Quedan **dos vocabularios a propósito**: el técnico
(`proveedor`, `proveedor_id`, `proveedorId`) y el del negocio (*terapista*). Eso quedó escrito en el
glosario de `ESPECIFICACION.md`, en `CLAUDE.md` y en el `README.md` **precisamente para que una sesión
futura no lo vea como una inconsistencia y lo «arregle»**, renombrando media base de datos por un
cambio de palabra.

**Un cuidado de redacción que valió la pena mirar antes de escribir:** los proveedores de prueba son
**Ana, Luisa y Carlos**. Escribir «la terapista» habría dejado a Carlos mal nombrado en cada pantalla.
Por eso la palabra va **sin artículo con género**: «tu terapista», «Terapista Ana». Funciona para los
tres, como «artista». Se comprobó qué nombres hay en la base antes de elegir la forma, en vez de
suponerlo.

Ninguna prueba dependía del texto viejo —se comprobó buscándolo en `pruebas/` antes de tocar nada—,
así que `npm test` siguió en **174 de 174** sin modificar ni una.

### 2026-08-20 — el último ajuste, y el balance de la revisión visual de la pieza 5

**El ajuste.** La estudiante pidió sacarle al «Historial» el texto que tenía debajo del título —«lo
que ya pasó y lo que cancelaste. Se conserva siempre, ordenado de lo más reciente a lo más viejo»— y
**pegar el título a su tarjeta**. Su razón: la palabra «Historial» se explica sola, y esa frase
describía lo que la lista de abajo ya muestra.

Se hizo con un modificador nuevo, `paso--titulo-pegado`, que baja la separación de 16px a 8px, y **no
tocando `.paso` a secas**. La diferencia importa: `.paso` la usan también los cinco pasos de la
pantalla de reservar, donde los 16px son los correctos porque entre el título y la tarjeta hay
contenido. Un cambio en la clase base habría acercado de golpe cinco títulos que nadie pidió acercar.
Los 8px siguen siendo múltiplo de 4, la unidad base de `VISUALS.md`.

Un detalle de método: al sacar esa frase quedaron **tres lugares citándola** como justificación —dos
comentarios del código y una fila de `DISENO.md` decían «el título de la sección ya lo dice, "Historial:
lo que ya pasó y lo que cancelaste"»—. Se corrigieron los tres. Una justificación que cita un texto que
ya no existe es peor que no tener justificación, porque manda a buscar algo que no está.

---

**El balance de la revisión visual de la pieza 5, que conviene tener a mano para la defensa.**

De **una sola** revisión salieron **cinco cambios**, y ninguno lo podía encontrar una prueba
automática:

| # | Qué se encontró | De qué tipo |
|---|---|---|
| 1 | «Faltan menos de 4 horas para esta cita» debajo de una cita que ya había ocurrido | **Una frase falsa.** Las pruebas estaban en verde y tenían razón: comprobaban la regla, y la regla estaba bien |
| 2 | «Mis citas» mostraba todo mezclado, cuando el plan dice en tres lugares «el cliente ve sus **citas activas**» | **El código no cumplía el plan.** Ninguna prueba compara el código contra lo que el plan dice en prosa |
| 3 | La etiqueta decía «ACTIVA» en una cita del mes pasado | **Una etiqueta que afirmaba algo que ya no era cierto.** La salida —sacarla— la propuso la estudiante, y era mejor que las tres opciones del agente |
| 4 | «Te atiende» en vez de «Terapista» | **Vocabulario.** La palabra del modelo de datos se había filtrado a la pantalla |
| 5 | El «Historial» con un texto de más y el título flotando lejos de su tarjeta | **Espaciado y ruido.** Lo único puramente estético de los cinco |

Y hay un patrón que vale nombrar: **tres de los cinco no eran defectos de apariencia, eran defectos de
lo que la aplicación *decía*.** Una prueba automática puede comprobar que un texto aparezca; no puede
comprobar que sea verdad, ni que corresponda a lo que el plan pidió. Ese trabajo lo hace una persona
mirando la pantalla y preguntando «¿por qué esto dice esto?».

Es la mejor evidencia que el proyecto tiene a favor de su propia regla: **una pieza no se cierra sin que
una persona abra el navegador y mire.** Con la pieza 5, los defectos visuales del proyecto llegan a
**doce**, y **ninguno** de los doce salió de una prueba.
