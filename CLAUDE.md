
# CLAUDE.md — Reservas en línea para negocios de bienestar y salud

## Stack

- **Frontend:** HTML + CSS, con SASS para los estilos.
- **Backend:** JavaScript (Node.js), con Express para el API.
- **Base de datos:** SQLite, accedida con `better-sqlite3`.
- **Autenticación:** contraseña (no enlace mágico).
- **Correo (confirmaciones y recordatorio de 24h):** Resend — más simple de configurar que
  SendGrid para un proyecto de este tamaño. **No se instala su paquete de npm:** se le manda el
  pedido con `fetch`, que Node 20 ya trae (decidido al construir la pieza 4).
- **Disparador del recordatorio de 24h:** tarea programada en GitHub Actions, que le avisa al
  backend cada cierto tiempo para que revise si hay recordatorios pendientes de mandar.
  *(Nota para el futuro: si esto se convierte en una aplicación real en producción, migrar este
  disparador al sistema de tareas programadas del hosting elegido — por ejemplo Render o
  Vercel — en vez de depender de GitHub Actions.)*

## Comandos

**Existen desde la pieza 1** (construida el 2026-08-17) y funcionan.

| Comando | Qué hace |
|---|---|
| `npm install` | Instala las dependencias. |
| `npm run datos` | Crea la base SQLite desde cero y carga los datos de prueba inventados. Se puede correr las veces que haga falta, **pero con la aplicación apagada**: borra el archivo de la base, y Windows no deja borrar un archivo que otro programa tiene abierto. Si `npm start` está corriendo, el comando falla y lo explica. Carga la cuenta de Personal, el negocio, **las dos categorías con sus cuatro servicios** (desde la pieza 11), los tres proveedores, el horario semanal y los feriados de 2026 y 2027. Ninguna cita, ninguna cuenta de cliente y ningún correo registrado: esos se crean desde la aplicación, a partir de las piezas 3, 4 y 7. |
| `npm start` | Levanta la aplicación en **http://localhost:3000**. Antes de levantar compila los estilos SASS, automáticamente. |
| `npm test` | Corre las pruebas automáticas. **Se escribe `node --test`, sin decirle qué archivos**: así Node los busca solo, y funciona igual en Node 20 que en Node 24. Con un patrón de comodines (`pruebas/**/*.test.js`) **solo funciona desde Node 22**, y eso rompió la integración continua la primera vez que corrió. Hoy son **277**: 14 de la pieza 1, 27 de la pieza 2, 23 de la pieza 3, 19 de la pieza 10, 12 de la pieza 11, 14 de la pieza 4, 26 de la pieza 12, 39 de la pieza 5, 76 de la pieza 7 (58 en `personal.test.js` y 18 en `cambio-de-contrasena.test.js`) y **27 de la pieza 8** (`cierre-de-citas.test.js`). **Los tres criterios de aceptación están cubiertos por completo**: CA-1 y CA-2 desde la pieza 3, y **CA-3 entero desde la pieza 7** — la parte del cliente la trajo la 5, la de Personal la 7. Desde la pieza 3 estas pruebas **también corren solas en cada push** — ver «Integración continua» más abajo. |
| `npm run estilos` | Compila `estilos/estilos.scss` a `publico/css/estilos.css`. **No hace falta correrlo a mano**: `npm start` ya lo hace. Sirve para recompilar los estilos sin reiniciar la aplicación. |

Variables de entorno, en un `.env` que **no se sube**, con un `.env.ejemplo` versionado al lado:
`PORT` y `SESION_SECRETO` (desde la pieza 1), `RESEND_API_KEY` y `CORREO_REMITENTE` (desde la 4), y
`RECORDATORIOS_SECRETO` (previsto para la 6, que todavía no está construida). Sin `RESEND_API_KEY` la aplicación tiene que levantar igual:
los correos fallan y quedan registrados como fallidos, pero las citas se siguen creando (RF-19).

## Convenciones

Quedaron fijadas al construir la pieza 1, que es la que crea el proyecto. Las piezas siguientes
las siguen en vez de inventar otras.

### Estructura de carpetas

```
proyectoFinal/
├── servidor/            el backend: acá viven las reglas de negocio
│   ├── index.js           el único archivo que arranca el servidor y lo pone a escuchar
│   ├── aplicacion.js      arma la aplicación de Express, pero no la pone a escuchar
│   ├── base-de-datos.js   abre el archivo SQLite y crea las tablas si no existen
│   ├── contrasenas.js     cifrar una contraseña y comprobar si una coincide
│   ├── credenciales.js    qué contraseña y qué correo se aceptan (RN-23, RN-24)
│   ├── sesion.js          escribir, leer y borrar la cookie firmada de la sesión
│   ├── tiempo.js          fechas y horas, siempre en la hora del negocio (Costa Rica)
│   ├── catalogo.js        preguntas al catálogo: si un servicio existe, quién lo atiende
│   ├── clientes.js        los datos del cliente: leerlos, comprobarlos y guardarlos
│   ├── personal.js        lo que solo Personal hace: crearle la cuenta a quien llama con
│   │                      una contraseña temporal, y buscar clientes
│   ├── quien-actua.js     los dos actores del sistema, cliente y personal. No depende de nada,
│   │                      y por eso puede ser compartido sin armar un círculo de importaciones
│   ├── disponibilidad.js  qué horarios están libres — la regla, en un solo lugar
│   ├── reservas.js        crear, cancelar, mover y **cerrar** una cita — el único que toca su
│   │                      estado, y donde viven la ventana de 4 horas (RN-5) y RN-26
│   ├── correo.js          los correos: armarlos, entregarlos y dejar constancia
│   ├── plantillas-de-correo.js  qué dice cada correo — solo arma texto, no manda nada
│   ├── enviador-resend.js el único archivo que habla con un servicio de afuera
│   └── rutas/             un archivo por grupo de endpoints del API
├── guiones/             comandos de mantenimiento (hoy: cargar los datos de prueba)
├── estilos/             los archivos .scss que se escriben a mano
├── publico/             lo que el navegador recibe tal cual: HTML, JavaScript del navegador
│   ├── css/               el CSS que SASS genera — no se escribe a mano y no se sube
│   ├── fuentes/           la tipografía Manrope, copiada dentro del proyecto (sí se sube)
│   └── img/               las imágenes (hoy: el fondo de la página)
├── pruebas/             las pruebas automáticas
└── datos/               el archivo SQLite — se genera y no se sube
```

`aplicacion.js` está separado de `index.js` a propósito: las pruebas necesitan crear la aplicación
con una base de datos de prueba **sin** que se quede escuchando en el puerto 3000. Si estuviera
todo junto, no se podrían probar los endpoints.

### Cómo se nombra

| Qué | Cómo | Ejemplo |
|---|---|---|
| Archivos y carpetas | español, todo en minúscula, palabras unidas con guión | `base-de-datos.js` |
| Variables y funciones | español, primera palabra en minúscula y las siguientes con mayúscula | `buscarClientePorCorreo` |
| Tablas y columnas de la base | español, minúscula, palabras unidas con guión bajo | `contrasena_cifrada` |
| Campos del API (el JSON que viaja) | español, igual que las variables | `debeCambiarContrasena` |
| Archivos de prueba | terminan en `.test.js` | `autenticacion.test.js` |

**Sin tildes ni ñ en nombres de archivos, variables, tablas ni columnas** — por eso se escribe
`contrasena` y no `contraseña`. Los textos que el usuario lee sí llevan tildes y ñ, siempre.

Los nombres de tablas, columnas y endpoints **no se eligen acá**: los fija el bloque *Produce* de
cada pieza en `PLAN.md`, y se copian de ahí tal cual.

### Estilo de código

- Sin punto y coma opcional de más ni construcciones ingeniosas: el código lo tiene que poder
  leer alguien que está aprendiendo.
- Los comentarios explican **por qué**, no qué. Lo que hace el código ya lo dice el código.
- Una regla de negocio se escribe **en un solo lugar** del servidor, y quien la necesite la llama.
  Nunca copiada en dos archivos: si cambia, cambia en uno.
- **Una regla que la pantalla también necesita mostrar se escribe igual en los dos lados, y el
  servidor manda.** Pasó en la pieza 12: los requisitos de la contraseña se pintan de verde en el
  navegador *y* se comprueban en `servidor/credenciales.js`. No es una excepción a la regla de «un
  solo lugar»: el navegador **no puede** leer los archivos de `servidor/`, y los dos no pesan igual
  — el servidor **decide**, la pantalla **avisa**. Si se desincronizaran, lo peor que pasa es que la
  pantalla diga «verde» y el servidor rechace igual. Nunca al revés, que sería el problema de verdad.
- El frontend **no decide reglas de negocio** (`DISENO.md`, límite del componente Interfaz). Si
  una pantalla necesita saber si algo se permite, se lo pregunta al API. Y no solo *si*: también
  **por qué**. Un día del calendario no llega con una lista vacía para que la pantalla adivine si
  está cerrado, es feriado o ya pasó — llega con un campo `estado` que lo dice. Lo mismo con los
  botones de cancelar y reagendar desde la pieza 5: cada cita llega con `sePuedeCambiar` y
  `porQueNo`, y la pantalla **no cuenta las 4 horas**. Si las contara con el reloj de la computadora
  de quien mira, un navegador con la hora mal puesta le mostraría un botón que el servidor va a
  rechazar — o le esconderá uno que sí podía usar, que es peor.

### Los permisos

Quedaron fijados al construir la pieza 7, que es la primera con **dos tipos de usuario** usando las
mismas pantallas.

- **Un permiso es una regla, y va en un solo lugar: `servidor/sesion.js`.** Ahí viven los tres
  guardias, uno al lado del otro: `crearGuardiaDeCliente`, `crearGuardiaDePersonal` y
  `crearGuardiaDeClienteOPersonal`. Un archivo de rutas nunca comprueba un permiso por su cuenta.
- **Los números tienen un criterio y no se eligen caso por caso.** Sin sesión es `401` («no sé quién
  sos»); con la sesión equivocada es `403` («sé quién sos y esto no te toca»); y cuando el problema
  no es el permiso sino el dato que se mandó, es `422`, aunque suene a permiso — es por eso que la
  ventana de cancelación y la contraseña actual equivocada son `422`.
- **Todo lo que solo abre Personal vive bajo `/api/personal/`.** Así el permiso se lee de un vistazo
  en la dirección. La alternativa —agregarle un `clienteId` a las puertas del cliente— sería la
  manera de que un día alguien pudiera ver las citas de otra persona.
- **La obligación de cambiar la contraseña temporal (RF-4) también es un permiso**, y por eso vive en
  el guardia del cliente y no en la pantalla: escrita ahí la cumplen todos los endpoints del cliente
  a la vez, y también los que se agreguen mañana. Quedan abiertos solo los tres sin los cuales esa
  pantalla no podría existir: `GET /api/yo`, `DELETE /api/sesion` y `POST /api/contrasena/cambiar`.
- **Un `clienteId` que venga en el cuerpo del pedido se mira solo si quien pide es Personal.** Para
  un cliente el número sale de su propia sesión y el del cuerpo ni se lee: si se leyera, cualquiera
  podría reservarle una cita a cualquiera. Hay una prueba que lo comprueba.
- **Personal tiene exactamente dos excepciones, y las dos son sobre el tiempo:** puede cancelar y
  mover dentro de las 4 horas (RN-6) y puede agendar para hoy (RN-25). **Todo lo demás lo alcanza
  igual que al cliente** (RN-13): horario ocupado, feriado, domingo, almuerzo. **Y desde la pieza 8
  hay una regla que lo alcanza igual y que conviene no confundir con una tercera excepción, porque va
  para el otro lado: RN-26** — una cita cuya hora ya pasó no se cancela ni se reagenda, tampoco
  Personal. Está escrita en `revisarSiSePuedeCambiar` **antes** de la línea que le da el pase a
  Personal, y ese orden **es** la regla: puesta después no haría nada. Las dos excepciones
  están escritas **una sola vez cada una** —`revisarSiSePuedeCambiar` en `servidor/reservas.js` y
  `estaEnSuTiempo` en `servidor/disponibilidad.js`— y lo único que cambia es el `quien` que reciben.
  Si aparece una tercera excepción, va en el mismo lugar que la que le corresponda, no en un `if`
  suelto en un archivo de rutas.
- **Ningún texto de la pantalla de Personal la manda a llamar al negocio.** Suena obvio escrito, y
  fue un defecto de verdad: el día de hoy le decía «llamá al negocio al 2000-0000» a la asistente del
  negocio. Cuando un mensaje mande a hacer algo, hay que preguntarse **quién lo va a leer**.

### Fechas y horas

Quedaron fijadas al construir la pieza 2, que es la que trae el calendario. Son la fuente de casi
todos los errores posibles de este proyecto, así que las reglas son estrictas:

- **La hora que vale es la del negocio, que está en Costa Rica (UTC−6)**, y está escrita en
  `servidor/tiempo.js`. **Nunca se usa la hora de la máquina** donde corre el servidor ni la del
  navegador de quien mira: si se usara, el mismo calendario mostraría días distintos según dónde se
  levante la aplicación, y la regla «no hay citas para hoy» (RN-4) se rompería. Costa Rica no
  cambia de hora en verano, así que alcanza con restar seis: no hace falta ninguna librería.
- **Todo lo que tenga que ver con fechas se escribe en `servidor/tiempo.js`**, no suelto donde haga
  falta. Si una pieza nueva necesita una cuenta de fechas que no está ahí, se agrega ahí.
- **Un momento se escribe siempre igual:** `2026-09-02T10:00:00-06:00`, con el desfase al final. Es
  el mismo texto que viaja al navegador, que el navegador devuelve, y que queda guardado en la
  base. Un solo formato en todo el proyecto, y ninguna conversión donde equivocarse.
- **Nada averigua la hora por su cuenta.** La aplicación recibe un `reloj` —una función que
  devuelve el momento actual— y lo va pasando hacia adentro. En `npm start` es el reloj de verdad;
  en las pruebas es un reloj parado en una fecha fija. Sin eso, una prueba del calendario diría
  cosas distintas según el día en que se corra, y una prueba así no comprueba nada.
- **Dos reglas del proyecto dependen de la hora y no de la fecha, y las dos salen de la misma
  cuenta:** la ventana de 4 horas (RN-5, `horasHasta`) y «este horario todavía no empezó» (RN-25,
  `todaviaNoEmpezo`, que le pregunta a `horasHasta`). Las dos viven en `servidor/tiempo.js` y las dos
  tienen su **borde escrito a propósito**: a 4 horas justas se permite cancelar, y un horario que
  arranca en este mismo instante ya empezó.
- **Un momento se convierte con `new Date()` en un solo lugar de todo el proyecto**: la función
  `horasHasta` de `servidor/tiempo.js`, que es la que mide cuántas horas faltan para una cita (la
  ventana de 4 horas de RN-5, desde la pieza 5). Ahí es seguro **por** la regla del formato: el
  texto trae su desfase escrito al final, así que no hay nada que adivinar. En cualquier otro lado
  sería la puerta de entrada de un error de una hora. Y **no se redondea a horas enteras**: la regla
  dice «4 horas o más», y redondear dejaría cancelar una cita a la que le faltan 3 horas y 40.

### El correo

Quedaron fijadas al construir la pieza 4, que es la primera que habla con un servicio de afuera.

- **El enviador entra como dato, igual que el reloj.** La aplicación no sabe cómo se manda un
  correo: recibe una función `enviador` y la llama. En `npm start` es la que habla con Resend
  (`servidor/enviador-resend.js`); en las pruebas es una de mentira que los guarda en una lista.
  **Ninguna prueba automática le manda un correo a nadie**, y no hace falta ninguna clave secreta
  para que la integración continua pase.
- **Un correo que falla nunca invalida una cita** (RF-19). Ninguna función de `servidor/correo.js`
  lanza errores hacia afuera: si el envío se cae, se anota la falla y se sigue. Por eso el correo se
  manda **después** de que la cita ya está guardada, nunca antes ni dentro de la misma transacción.
- **Se reintenta una sola vez, y solo si la falla puede ser pasajera.** El error lleva un campo
  `pasajera`: `true` para la red caída o un error 5xx de Resend (se reintenta), `false` para la
  clave que no sirve o el remitente sin verificar (no se reintenta, porque daría lo mismo).
- **Todo envío deja su fila en `correo_enviado`, haya salido bien o mal**, y es **una fila por
  correo, no por intento**.
- **Al crear una cita se manda la confirmación, y eso está escrito en un solo lugar:**
  `crearCitaYConfirmar` de `servidor/reservas.js`. Una pieza nueva que reserve —la 7— llama a esa,
  no arma el correo por su cuenta.
- **El correo viaja en dos versiones, HTML y texto plano, diciendo lo mismo.** Un correo que solo
  viaja en HTML lo marcan como sospechoso varios servicios.
- **El HTML del correo se escribe con `<table>` y estilos pegados en cada etiqueta.** Los programas
  de correo no son navegadores: borran las hojas de estilo y entienden mal las cuadrículas
  modernas. Es la única parte del proyecto donde no se escribe CSS moderno, y tiene su razón escrita
  en `servidor/plantillas-de-correo.js`.
- **La tipografía del correo no es Manrope, y es la única excepción a `VISUALS.md` del proyecto.**
  Manrope vive en `publico/fuentes/` y los programas de correo no cargan tipografías de afuera. Los
  colores, los tamaños y el espaciado sí salen de `VISUALS.md`.

### Lo visual

- **Al cliente se le dice «terapista», no «proveedor».** En pantalla y en los correos: «Terapista
  Ana», «Elegí tu terapista». En la base, en el API y en el código **sigue llamándose `proveedor`** y
  no se renombra — los nombres técnicos los fija el bloque *Produce* de `PLAN.md`. Son dos
  vocabularios a propósito, el técnico y el del negocio, y **no es una inconsistencia que haya que
  arreglar**. *Decidido por la estudiante el 2026-08-20.* Va **sin artículo con género** —«tu
  terapista», «Terapista Ana»— porque hay proveedores mujeres y hombres: «la terapista» dejaría a
  Carlos mal nombrado.
- **Una etiqueta de estado aparece solo cuando algo le pasó a la cita**: cancelada, completada o «no
  asistió». **Desde la pieza 8 las tres existen de verdad**, y la promesa se cumplió: la etiqueta
  nunca se desdice — pasa de no estar a decir COMPLETADA o NO ASISTIÓ. En la base el estado se escribe
  `no_asistio`, sin tilde y con guión bajo como todo lo técnico, y **en pantalla se lee «NO ASISTIÓ»**:
  esa traducción vive en un solo lugar del JavaScript del navegador (`enPalabras`), no repartida donde
  haga falta. Una cita que ya pasó y que nadie cerró todavía **no lleva etiqueta**, porque decir
  «ACTIVA» de algo que ya ocurrió es falso, y decir «COMPLETADA» sería peor: la aplicación **no sabe
  si la persona asistió**, y RN-17 dice que ese estado solo lo marca Personal y nunca se alcanza por
  el paso del tiempo. Así la etiqueta **nunca se desdice**: pasa de no estar a decir COMPLETADA o NO
  ASISTIÓ. *Decidido por la estudiante el 2026-08-20, en la revisión visual de la pieza 5.*
- **La apariencia sale de `VISUALS.md`, no del criterio de quien escribe el código.** Ese archivo
  es el sistema visual «Clinical Excellence»: colores, tipografía, tamaños de letra, redondeos y
  espaciado. Si un valor no está ahí, **no se inventa en el `.scss`**: se pregunta.
- **Los estilos se escriben mobile-first.** Primero cómo se ve en un teléfono; las pantallas más
  grandes solo agregan, más abajo, dentro de bloques `@media (min-width: …)`. **Nunca
  `max-width`.** Los dos cortes generales son 48rem (768px) y 64rem (1024px), y **desde el 2026-08-21
  hay un tercero, 29.75rem (476px), que es específico y no general**: lo usa una sola cosa, la fila de
  dos botones de la tarjeta «Atendiendo a», que la estudiante pidió que pase a estar lado a lado antes
  que el resto de la aplicación. Un corte nuevo se agrega a la lista de variables de arriba del
  `.scss`, con su medida en píxeles anotada al lado, **nunca escrito a mano adentro de un `@media`**.
- **Adentro de un botón no puede haber otro botón**, igual que no puede haber un `<h1>`. Cuando un
  renglón entero es un botón y hace falta que muestre algo con **cara** de botón —el «Seleccionar» de
  los resultados de buscar a quien llama—, se pone un `<span>` que reusa las clases
  `boton boton--suave boton--chico`, y **lo que responde al toque sigue siendo el renglón completo**.
  Eso además es lo mejor de las dos opciones: si el «Seleccionar» fuera un botón de verdad adentro de
  un `<div>`, tocar el nombre no haría nada — y el nombre es lo primero que una persona toca.
- **Al reusar las clases de `.boton` en algo que no es un botón, hay que mirar el CSS compilado.**
  `.boton` trae `width: 100%` en teléfono y `align-self: flex-start` desde tableta, y las dos cosas
  pisan lo que la fila que lo contiene haya decidido. Pasó de verdad el 2026-08-21: el «Seleccionar»
  se hubiera ido a la esquina de arriba en cuanto la pantalla pasara los 768px. **Se encontró leyendo
  el CSS compilado, no la pantalla**, y por eso vale la pena leerlo: dos reglas que pesan lo mismo se
  resuelven por cuál está más abajo en el archivo, y eso en el `.scss` no se ve.
- **Un cambio visual que vale para una sola pantalla va como modificador, no cambiando la clase
  compartida.** La pieza 5 creó `paso--titulo-pegado` para no mover los otros cinco títulos, y la 7
  creó `confirmacion__botones--fila-centrada` para no mover las otras tres filas de dos botones —que
  ya fueron revisadas y aprobadas como están—. Si algún día el cambio tiene que valer para todas, es
  mover esas líneas adentro de la clase y borrar el modificador.
- **Toda cuadrícula de ancho repartido se escribe `minmax(0, 1fr)`, nunca `1fr` a secas.** Parecen
  lo mismo, pero `1fr` promete además que una columna no se encoge más allá de lo que su contenido
  necesita, y eso desborda el contenedor en pantalla angosta apenas las casillas tengan alto mínimo
  o proporción fija. Pasó de verdad con el calendario de la pieza 2 — el detalle está en la entrada
  del 2026-08-19 de `BITACORA.md`.
- **Un aviso de «salió bien» va en verde, no en rojo ni en lavanda.** Se usa la clase
  `aviso--exito` (verde `#d6e9db`, texto negro), y desde el JavaScript la función
  `mostrarAvisoDeExito`. `VISUALS.md` nombra un «success green» sin decir cuál es; el valor lo
  eligió la estudiante el 2026-08-19, al ver que «Tu cita quedó reservada» salía con los colores de
  error. El lavanda (`aviso--informativo`) queda para las noticias que no son ni buenas ni malas.
- **Todo texto de guía o de mensaje de error va en 12px**, con interlineado de 16 — el `label-sm`
  de `VISUALS.md`. Son los avisos (`.aviso`), los textos de ayuda debajo de un grupo de campos
  (`.forma__ayuda`) y los requisitos de la contraseña (`.requisito`). *Decisión de la estudiante del
  2026-08-19: ese tipo de texto tiene que distinguirse de un vistazo del contenido de verdad, sin
  tener que leerlo.* Si una pantalla nueva agrega otro texto de guía, va con este mismo tamaño.
- **La marca del encabezado —el logo Y el nombre— es el «volver al inicio»**, para las dos cuentas.
  *Pedido de la estudiante el 2026-08-21: es lo primero que una persona prueba cuando quiere volver
  al principio, y el logo «es también el texto que dice Bienestar y salud».* Tres cosas que hay que
  respetar si algún día se toca:
  - **Es un `<a>` y no un `<button>`**, aunque el menú use botones. Adentro va el `<h1>` del negocio,
    y **un `<h1>` dentro de un `<button>` es HTML inválido** — los navegadores lo dibujan igual, pero
    está mal escrito. Sacar el `<h1>` no es la salida: es el único encabezado principal de la página,
    y quien usa un lector de pantalla se orienta saltando de encabezado en encabezado.
  - **Se apaga quitándole el `href`, no con `disabled`**, que solo existe para los botones. Un enlace
    sin dirección no se puede tocar ni alcanzar con el tabulador. Se apaga en la pantalla de entrar y
    en la del cambio obligatorio de la contraseña — ahí RF-4 dice que no se puede hacer nada más, y
    un logo que llevara a la aplicación sería una puerta de escape a esa regla.
  - **No lleva `aria-label`**: su nombre sale del texto que ya tiene adentro. Un `aria-label`
    *reemplaza* lo que se ve, así que quien usa un lector oiría algo distinto de lo que hay en
    pantalla. El `alt` de la imagen sigue vacío, por lo mismo de siempre.
- **Una entrada de menú que es una acción, y no una sección, va con `data-accion` y no con
  `data-vista`.** Las de `data-vista` se subrayan cuando se está en esa sección; las de `data-accion`
  hacen algo y no marcan nada. Es lo que distingue «Inicio» —que lleva a «Reservar»— de «Reservar»
  mismo. Los dos menús, el de arriba y el del pie, se buscan siempre juntos con `querySelectorAll`,
  así que agregar un menú en otro lado no pide código nuevo.
- **Lo que habla de la persona que se está atendiendo va pegado a su nombre, no en el menú.** La
  tarjeta «Atendiendo a» lleva sus dos botones: **«Citas del cliente»** y **«Otra persona»**. Y
  aparecen y desaparecen con la tarjeta sin una línea de código extra — si no hay nadie elegido, no
  hay nada de lo que hablar. De ahí salen tres criterios:
  - **Un menú es para ir a lugares, no para deshacer trabajo en curso.** Por eso «Otra persona» no
    está en el menú, y por eso la entrada «Nueva llamada» que se construyó ese día **se sacó el mismo
    día**: una entrada de menú tocada por error no puede borrar la llamada en curso. *(2026-08-21.)*
  - **Dos caminos al mismo lugar se llaman igual.** «Citas del cliente» es el nombre del botón **y**
    el de la entrada del menú, a propósito: si se llamaran distinto parecerían dos lugares.
    *(2026-08-21.)*
  - **Una etiqueta que no entra en su botón se acorta; el botón no se ensancha.** El segundo botón
    decía «Atender a otra persona» y partía en dos líneas entre 476 y 640px de ancho, que es
    justamente donde el modificador los pone lado a lado al 48%. Se acortó a **«Otra persona»**, que
    entra en una línea desde 476px. **Se eligió acortar y no tocar el ancho ni el corte** porque el
    48% y el 476px los pidió la estudiante mirando la pantalla, y porque el verbo ya está dicho en el
    título de la tarjeta que lo contiene —«Atendiendo a»—, así que la etiqueta no perdió sentido.
    *(Decidido por la estudiante el 2026-08-24, al cerrar la revisión visual de la pieza 7.)*
- **En la pantalla de Personal, lo que se está mirando lleva el nombre de su dueño.** No alcanza con
  cambiar «tus» por «sus»: los títulos de la sección de citas dicen **«Próximas citas de Marisol
  Prueba»** y **«Historial de Marisol Prueba»**, con nombre. La razón es concreta y salió de mirar la
  pantalla el 2026-08-21: el único nombre que había era el de la asistente («Hola, Marta Jiménez»),
  así que **nada decía de quién eran esas citas**. Cuando una pantalla muestra los datos de una
  tercera persona, el nombre de esa persona tiene que estar a la vista. *Y los dos títulos lo llevan,
  no solo el de arriba: un título con nombre seguido de un «Historial» pelado deja la duda de si el de
  abajo es de la misma persona.*
- **En la pantalla de Personal ningún texto dice «tu» ni «tus».** Personal reserva, cancela y mueve
  citas **de otra persona**, así que «tu cita» sería falso — y en una llamada telefónica esa palabra
  es justo la que confunde. Los textos que cambian están todos en un solo lugar del JavaScript del
  navegador, decididos con `esPersonal()`: el título de la tarjeta de confirmar, el botón grande, el
  los dos títulos de la sección de citas, la pregunta antes de cancelar y los avisos verdes. *Convención
  fijada al construir la pieza 7, el 2026-08-21.*
- **Cuando Personal reserva o mueve una cita, el aviso verde dice a qué dirección salió el correo.**
  Es el dato que le hace falta para poder confirmárselo por teléfono a quien está del otro lado.
- **La letra se escribe en `rem`, y toda la aplicación se dibuja al 80%.** *Decidido por la
  estudiante el 2026-08-24; el detalle completo está arriba del `.scss`, en `VISUALS.md` y en
  `DISENO.md`.* Tres cosas que hay que respetar si se toca:
  - **Ningún tamaño de letra ni interlineado se escribe en píxeles.** La tabla para convertir está
    arriba del `.scss`: el píxel de `VISUALS.md` dividido entre 16 (`12px → 0.75rem`, `16px → 1rem`,
    `24px → 1.5rem`). **Los espaciados sí siguen en píxeles**, porque son la retícula de 4px y eso es
    *layout*, no letra.
  - **`html` lleva `font-size: 80%` y nada más.** Achica toda la tipografía de una sola vez. **No se
    reemplaza por un tamaño en píxeles:** un porcentaje se mide contra la letra base del navegador de
    quien mira, así que quien la agranda desde su configuración sigue viendo todo crecer. Escrito en
    píxeles quedaría clavado y la conversión a `rem` no serviría de nada. Volver atrás es borrar esa
    línea. *(El costo está asumido y escrito: el texto normal queda en 12.8px, por debajo de los 16px
    que `VISUALS.md` llama mínimo accesible.)*
  - **Los títulos usan `clamp()`**, con las tres escalas en variables (`$titulo-principal`,
    `$titulo-seccion`, `$titulo-chico`). Su interlineado va **sin unidad** —un multiplicador—, porque
    uno fijo dejaría flotando al título cuando se achica. Y la parte `vw` de un `clamp` **va siempre
    sumada a un `rem`, nunca sola**: `vw` mide la ventana y no la letra, así que sola ignoraría a
    quien agranda la tipografía de su navegador.
- **La hora se escribe con `am`/`pm`, con una sola excepción.** *Decidido por la estudiante el
  2026-08-24.* La llevan la tarjeta de confirmar, el cartel de reagendar, las dos listas de citas y el
  correo. **No la llevan las fichas de horario del calendario**, que siguen en hora de 24 (`10:00`):
  son ocho por día en una fila de cuatro columnas —la caja más angosta del proyecto— y `10:00am` no
  entra en un teléfono de 320px. La cuenta está escrita **dos veces a propósito**, en `horaConAmPm`
  del navegador y en `escribirHoraDelMomento` del servidor, por la razón de siempre: el navegador no
  puede leer nada de `servidor/`, y esto no es una regla de negocio sino una forma de escribir.
- **`rem` y `clamp` hacen que la letra se adapte a quien mira, no que un texto entre en su caja.** Son
  dos problemas distintos y se arreglan con cosas distintas: el segundo se arregla acortando el texto
  o dándole más lugar. *Quedó anotado el 2026-08-24 porque se confundió en el momento.*
- Todas las medidas son múltiplos de **4px**, la unidad base del sistema.
- **Las etiquetas de los campos siempre visibles**, nunca flotando dentro del campo: lo pide el
  sistema por accesibilidad.
- **Todo campo de contraseña lleva el «ojito» para mostrarla y ocultarla.** Sin excepción, en
  cualquier pantalla: entrar, registrarse, cambiar la contraseña temporal (pieza 7), restablecer la
  olvidada (pieza 9). *Pedido de la estudiante el 2026-08-17, con su razón: sin eso no hay manera de
  saber si se escribió bien.* **No se agrega campo por campo:** la función
  `agregarOjitoATodasLasContrasenas()` de `publico/aplicacion-cliente.js` recorre la página y se lo
  pone a todos los `input[type="password"]` que encuentre, así que una pantalla nueva lo hereda sin
  que nadie tenga que acordarse. Si alguna vez hace falta un campo de contraseña **sin** ojito, eso
  es una excepción y va escrita con su razón.
- La tipografía **Manrope vive dentro del proyecto**, en `publico/fuentes/`. No se le pide a
  ningún servicio de terceros — ver la razón en `DISENO.md`, «El sistema visual».
- **Las imágenes van en `publico/img/`.** Es la única carpeta de imágenes que el navegador puede
  ver: `publico/` es lo que el servidor entrega. Una imagen guardada en otro lado no carga, aunque
  la ruta parezca correcta. Hoy hay dos: `bg-img.jpg` (el fondo) y `logo-app.png` (el logo del
  encabezado, agregado por la estudiante el 2026-08-19).
- **Toda imagen lleva su `width` y su `height` en la etiqueta**, con los números del archivo, aunque
  el tamaño que se vea lo decida el CSS. No es para dimensionarla: es para que el navegador sepa
  cuánto espacio reservar antes de que cargue. Sin eso, la página da un salto cuando la imagen
  aparece.
- **Una imagen que solo repite algo que ya está escrito al lado lleva `alt=""`** (vacío). Es el caso
  del logo: el nombre del negocio está escrito a su derecha, y un lector de pantalla que además
  leyera el logo diría dos veces lo mismo. Un `alt` vacío es la forma correcta de decir «esto es
  decoración, ya está dicho con palabras» — no es lo mismo que no poner `alt`, que sí es un error.
- **Detrás de una imagen de fondo va siempre el color del sistema como respaldo**, con el color
  escrito primero y la imagen encima. Si la imagen tarda o falta, la página se ve igual y nunca en
  blanco.
- **Para atenuar una imagen de fondo no se usa `opacity`:** se le pone encima una capa del color del
  lienzo con la transparencia que haga falta (`linear-gradient(rgba($canvas, 0.25), …)`). `opacity`
  sobre un contenedor vuelve translúcido **todo lo que tiene adentro** —textos, tarjetas, botones—,
  no solo su fondo. El resultado en pantalla es idéntico y no toca el contenido. *Aplicado el
  2026-08-19, cuando la estudiante pidió bajarle un 25% a las flores del fondo.*
- Los colores y el logo del **negocio** (los que se cargan como configuración, REG-4) **existen
  desde la pieza 2, y la aplicación no los aplica**: se guardan en `configuracion_negocio` y se
  devuelven en `GET /api/negocio`, pero ninguna pantalla los usa para pintarse. Son otra cosa:
  `VISUALS.md` es la apariencia de **la aplicación**; la configuración es la marca de **quien la
  usa**. Aplicarlos pisaría el sistema visual aprobado.

### Pruebas

- Van en `pruebas/`, un archivo por tema (`autenticacion.test.js`), y corren con `npm test`.
- **Se escriben antes del código** y se ven fallar primero: una prueba que nunca falló no
  demuestra que comprueba algo.
- Usan una base de datos de prueba aparte, en un archivo temporal que se borra al terminar. Nunca
  tocan `datos/reservas.sqlite`, la base de trabajo.
- Hablan con el API de verdad, por HTTP, como lo haría el navegador. No se prueba una imitación
  del servidor: se prueba el servidor.
- **Una prueba no se ata a cuántos datos de demostración hay hoy.** Si comprueba «hay dos servicios»,
  se rompe el día que el negocio agregue un tercero, sin que nada esté mal. Comprobá que estén los que
  importan, no cuántos son. Pasó dos veces: al sumarse Luisa (pieza 2) y al sumarse los tipos de
  masaje (pieza 11).
- **Los comandos también hay que correrlos.** `npm test` no ejecuta `npm run datos` ni `npm start`, así
  que un error en esos guiones no lo detecta ninguna prueba. Pasó en la pieza 11: `npm run datos` quedó
  roto por un nombre que había cambiado, y solo se vio al correrlo.
- **Una tabla nueva que apunte a otra hay que agregarla al borrado de `guiones/datos-de-prueba.js`,
  y primero de todo.** La base tiene las llaves foráneas encendidas: SQLite se niega a borrar una
  fila que alguien todavía señala. Pasó en la pieza 4 con `correo_enviado`, que apunta a `cita` y a
  `cliente`. Se descubrió leyendo el guion, no corriéndolo, y desde entonces hay una prueba que lo
  cubre.
- **Un aviso por consola que sale en cada corrida es un aviso que nadie va a leer.** Las pruebas que
  crean citas pero no son del correo le pasan un enviador de mentira que funciona, para que la
  salida de `npm test` solo muestre los avisos de los envíos que **a propósito** se hacen fallar.
- **Ninguna prueba se cuelga del día en que se corre.** No solo las del calendario: **cualquiera** que
  toque una fecha. Una prueba que busca «algún día del mes en curso con horarios libres» pasa hoy y
  falla el 30 de un mes. Si una prueba necesita una fecha, para el reloj con `relojDetenidoEn` y escribe
  la fecha fija. Rompió la integración continua la primera vez que corrió.
- **Lo que el API no deja crear se inserta a mano en la base, y eso está bien.** La ventana de 4
  horas (pieza 5) hay que probarla con una cita que empiece hoy, y el API prohíbe crearla porque no
  hay citas para hoy (RN-4). No es hacer trampa: es la única manera de llegar a ese estado, y es
  literalmente lo que la comprobación 6 del plan pide. Lo que **sí** sería trampa es insertar a mano
  algo que el API sí puede crear, porque entonces la prueba dejaría de probar el camino de verdad.
- **Ninguna prueba mira la página dibujada.** Todas hablan con el API, así que un defecto visual
  —una cuadrícula desbordada, un `hidden` que no esconde— no lo detecta ninguna. **Ni tampoco si una
  frase dice algo falso**: en la pieza 5 el texto «faltan menos de 4 horas» salía debajo de una cita
  que ya había ocurrido, y las pruebas estaban todas en verde, porque comprobaban la regla y la regla
  estaba bien. Por eso **una pieza no se cierra sin que una persona abra el navegador y mire.** Los
  **diecinueve** defectos visuales encontrados hasta hoy salieron todos de ahí, ninguno de una prueba,
  **más un vigésimo hallazgo que no era de apariencia** —ver abajo—. La cuenta: **doce** hasta la
  pieza 5, **seis** de la revisión de la pieza 7, **uno** que no estaba roto pero se veía (la etiqueta
  que partía en dos líneas) y **uno** de la revisión de la pieza 8. *(Este número decía «ocho» hasta el
  2026-08-21 y «doce» hasta el 2026-08-24: se quedó viejo tres veces, las tres porque la revisión
  visual siguió encontrando cosas después de que alguien anotó el número. Si volvés a tocarlo, mirá
  primero el final de `BITACORA.md`.)*
- **Y el hallazgo número 20 no fue de apariencia: fue una regla escrita en dos mitades** (pieza 8,
  2026-08-24). Al salir y volver a entrar con la cuenta de Personal, la tarjeta «Atendiendo a» seguía
  mostrando a la persona de la sesión anterior. **Del lado del API no había nada roto** —la sesión se
  cerraba bien y el dato se borraba bien—: lo que quedaba viejo era **lo dibujado**. La causa era que
  «olvidar la llamada» estaba partida en dos lugares —el dato lo borraba el logout, la pantalla la
  limpiaba el botón «Otra persona»— y las dos no decían lo mismo. Arrastraba dos cosas peores que el
  cartel viejo: **Personal se quedaba sin buscador**, y **la contraseña temporal de un cliente
  sobrevivía al logout en pantalla**. La lección, que es la regla de siempre aplicada al frontend:
  **si borrar algo pide tocar el dato y la pantalla, las dos cosas van en la misma función.**
- **Y una revisión visual también puede terminar sin defecto, y eso también se anota.** El 2026-08-24
  se reportó que el campo de la contraseña temporal no aparecía al recargar. Se investigó el servidor
  (reproducido con `curl`), la caché del navegador, el CSS compilado y el código: **todo estaba
  bien**. Lo que había fallado era **el recorrido escrito**, que hacía tocar «Salir» a destiempo. La
  lección quedó en el guion, no en el código: **un recorrido de revisión tiene que decir qué botones
  NO tocar**, sobre todo cuando la pantalla que se está probando tiene un botón con el mismo nombre
  que el del paso anterior.

### Integración continua

Existe desde la pieza 3. Las 250 pruebas corren solas en **cada push y cada pull request**, en
**Node 20 y Node 24**, configuradas en `.github/workflows/pruebas.yml`.

- **Ese archivo vive en la raíz del repositorio, no en esta carpeta.** Es la única excepción a la
  regla «todo el trabajo queda adentro de la carpeta del día», autorizada por la estudiante el
  2026-08-19: GitHub solo ejecuta los archivos que están en `.github/workflows/` en la raíz.
- **Correr en Node 20 no es un detalle:** es lo que comprueba la promesa del `README.md`. Si una
  dependencia nueva exige una versión mayor, la integración continua se pone roja y hay que elegir
  la dependencia, no cambiar la promesa. Ya pasó con `better-sqlite3` — ver `DISENO.md`,
  «Decisiones tomadas al construir la pieza 3».

## Restricciones

Además de las generales del curso (todo se construye con Claude Code, sin datos reales
confidenciales), este proyecto tiene estas:

- **El proyecto tiene que levantar en una máquina que no es la de la estudiante**, clonando el
  repositorio y siguiendo solo el `README.md`. De ahí se derivan dos límites duros: ninguna ruta
  de esta máquina puede quedar escrita en el código, y ninguna dependencia puede necesitar
  compilarse o instalarse aparte. Por eso el cifrado de contraseñas y el corredor de pruebas usan
  lo que Node ya trae (ver `DISENO.md`, «Decisiones tomadas al construir la pieza 1»).
- **Node.js 20 o superior**, tal como lo promete el `README.md`. Nada del código **ni ninguna
  dependencia** puede pedir una versión más nueva. Desde la pieza 3 esto está **comprobado en cada
  push**, no solo escrito: la integración continua corre las pruebas en Node 20 y en Node 24.
  `better-sqlite3` queda fijado en la línea `^12.11.1` por esta razón — la 13 exige Node 22.
- **Un solo servicio externo:** el correo (Resend), declarado como frontera técnica en
  `PROYECTO.md` sección 6. No se agregan más servicios de terceros.
- **La lista de feriados de Costa Rica se precarga como dato fijo** (`PROYECTO.md` sección 6): no
  se consulta ningún servicio en línea para saber si un día es feriado.
- **La aplicación tiene que levantar sin `RESEND_API_KEY`.** Los correos fallan y quedan
  registrados como fallidos, pero las citas se siguen creando (RF-19).
- **Nada se borra de la base de datos** (RN-15). No hay `DELETE` de filas de negocio en ninguna
  parte del código: cancelar, completar o marcar «no asistió» son cambios de estado. La única
  excepción es `npm run datos`, que rehace la base de prueba desde cero.
- **Sin panel de administración.** Servicios, proveedores, horarios, feriados, ubicación, logo y
  colores se cargan como configuración, no por pantalla.
- **Las tres reglas de CA-1, CA-2 y CA-3 tienen que estar cubiertas por pruebas que corran en cada
  push** (`PROYECTO.md` sección 7, punto 4). **Cumplido y completo desde el 2026-08-21:** CA-1 y CA-2
  en la pieza 3, CA-3 parte cliente en la pieza 5, y **CA-3 parte Personal en la pieza 7** — la misma
  cita que empieza dentro de 2 horas se le rechaza al cliente con `422` y se le acepta a Personal con
  `204`. Las dos mitades salen de la **misma** función, `revisarSiSePuedeCambiar` de
  `servidor/reservas.js`, llamada con `QUIEN_CLIENTE` o con `QUIEN_PERSONAL`: la regla no está escrita
  dos veces, y por eso las dos mitades no se pueden desincronizar.
