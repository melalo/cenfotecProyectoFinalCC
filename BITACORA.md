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
