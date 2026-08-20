
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
| `npm run datos` | Crea la base SQLite desde cero y carga los datos de prueba inventados. Se puede correr las veces que haga falta, **pero con la aplicación apagada**: borra el archivo de la base, y Windows no deja borrar un archivo que otro programa tiene abierto. Si `npm start` está corriendo, el comando falla y lo explica. Carga la cuenta de Personal, el negocio, **las dos categorías con sus cuatro servicios** (desde la pieza 11), los tres proveedores, el horario semanal y los feriados de 2026 y 2027. Ninguna cita ni ningún correo registrado: esos se crean desde la aplicación, a partir de las piezas 3 y 4. |
| `npm start` | Levanta la aplicación en **http://localhost:3000**. Antes de levantar compila los estilos SASS, automáticamente. |
| `npm test` | Corre las pruebas automáticas. **Se escribe `node --test`, sin decirle qué archivos**: así Node los busca solo, y funciona igual en Node 20 que en Node 24. Con un patrón de comodines (`pruebas/**/*.test.js`) **solo funciona desde Node 22**, y eso rompió la integración continua la primera vez que corrió. Hoy son **174**: 14 de la pieza 1, 27 de la pieza 2, 23 de la pieza 3, 19 de la pieza 10, 12 de la pieza 11, 14 de la pieza 4, 26 de la pieza 12 y 39 de la pieza 5. **Los tres criterios de aceptación están cubiertos**: CA-1 y CA-2 desde la pieza 3, y **CA-3 (parte cliente) desde la pieza 5** — la parte de Personal es de la pieza 7. Desde la pieza 3 estas pruebas **también corren solas en cada push** — ver «Integración continua» más abajo. |
| `npm run estilos` | Compila `estilos/estilos.scss` a `publico/css/estilos.css`. **No hace falta correrlo a mano**: `npm start` ya lo hace. Sirve para recompilar los estilos sin reiniciar la aplicación. |

Variables de entorno, en un `.env` que **no se sube**, con un `.env.ejemplo` versionado al lado:
`PORT` y `SESION_SECRETO` (desde la pieza 1), `RESEND_API_KEY` y `CORREO_REMITENTE` (desde la 4), y
`RECORDATORIOS_SECRETO` (desde la 6). Sin `RESEND_API_KEY` la aplicación tiene que levantar igual:
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
│   ├── disponibilidad.js  qué horarios están libres — la regla, en un solo lugar
│   ├── reservas.js        crear, cancelar y mover una cita — el único que toca su estado,
│   │                      y donde vive la regla de la ventana de 4 horas (RN-5)
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
  asistió». Una cita que ya pasó y que nadie cerró todavía **no lleva etiqueta**, porque decir
  «ACTIVA» de algo que ya ocurrió es falso, y decir «COMPLETADA» sería peor: la aplicación **no sabe
  si la persona asistió**, y RN-17 dice que ese estado solo lo marca Personal y nunca se alcanza por
  el paso del tiempo. Así la etiqueta **nunca se desdice**: pasa de no estar a decir COMPLETADA o NO
  ASISTIÓ. *Decidido por la estudiante el 2026-08-20, en la revisión visual de la pieza 5.*
- **La apariencia sale de `VISUALS.md`, no del criterio de quien escribe el código.** Ese archivo
  es el sistema visual «Clinical Excellence»: colores, tipografía, tamaños de letra, redondeos y
  espaciado. Si un valor no está ahí, **no se inventa en el `.scss`**: se pregunta.
- **Los estilos se escriben mobile-first.** Primero cómo se ve en un teléfono; las pantallas más
  grandes solo agregan, más abajo, dentro de bloques `@media (min-width: …)`. **Nunca
  `max-width`.** Los dos cortes son 48rem (768px) y 64rem (1024px).
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
  **ocho** defectos visuales encontrados hasta hoy salieron todos de ahí, ninguno de una prueba.

### Integración continua

Existe desde la pieza 3. Las 174 pruebas corren solas en **cada push y cada pull request**, en
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
  push** (`PROYECTO.md` sección 7, punto 4). **Cumplido:** CA-1 y CA-2 en la pieza 3, y CA-3 (parte
  cliente) en la pieza 5. La parte de Personal de CA-3 —que la asistente **sí** puede cancelar dentro
  de las 4 horas (RN-6)— es de la pieza 7, y la función que la hace posible ya está escrita:
  `revisarSiSePuedeCambiar` de `servidor/reservas.js`, llamada con `QUIEN_PERSONAL`.
