
# CLAUDE.md — Reservas en línea para negocios de bienestar y salud

## Stack

- **Frontend:** HTML + CSS, con SASS para los estilos.
- **Backend:** JavaScript (Node.js), con Express para el API.
- **Base de datos:** SQLite, accedida con `better-sqlite3`.
- **Autenticación:** contraseña (no enlace mágico).
- **Correo (confirmaciones y recordatorio de 24h):** Resend — más simple de configurar que
  SendGrid para un proyecto de este tamaño.
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
| `npm run datos` | Crea la base SQLite desde cero y carga los datos de prueba inventados. Se puede correr las veces que haga falta, **pero con la aplicación apagada**: borra el archivo de la base, y Windows no deja borrar un archivo que otro programa tiene abierto. Si `npm start` está corriendo, el comando falla y lo explica. Carga la cuenta de Personal, el negocio, **las dos categorías con sus cuatro servicios** (desde la pieza 11), los tres proveedores, el horario semanal y los feriados de 2026 y 2027. Ninguna cita: esas se crean desde la aplicación a partir de la pieza 3. |
| `npm start` | Levanta la aplicación en **http://localhost:3000**. Antes de levantar compila los estilos SASS, automáticamente. |
| `npm test` | Corre las pruebas automáticas. **Se escribe `node --test`, sin decirle qué archivos**: así Node los busca solo, y funciona igual en Node 20 que en Node 24. Con un patrón de comodines (`pruebas/**/*.test.js`) **solo funciona desde Node 22**, y eso rompió la integración continua la primera vez que corrió. Hoy son **95**: 14 de la pieza 1, 27 de la pieza 2, 23 de la pieza 3, 19 de la pieza 10 y 12 de la pieza 11. **Los criterios de aceptación CA-1 y CA-2 ya están cubiertos** (pieza 3); CA-3 se agrega en las piezas 5 y 7. Desde la pieza 3 estas pruebas **también corren solas en cada push** — ver «Integración continua» más abajo. |
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
│   ├── sesion.js          escribir, leer y borrar la cookie firmada de la sesión
│   ├── tiempo.js          fechas y horas, siempre en la hora del negocio (Costa Rica)
│   ├── catalogo.js        preguntas al catálogo: si un servicio existe, quién lo atiende
│   ├── clientes.js        los datos del cliente: leerlos, comprobarlos y guardarlos
│   ├── disponibilidad.js  qué horarios están libres — la regla, en un solo lugar
│   ├── reservas.js        crear una cita — el único que toca el estado de una cita
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
- El frontend **no decide reglas de negocio** (`DISENO.md`, límite del componente Interfaz). Si
  una pantalla necesita saber si algo se permite, se lo pregunta al API. Y no solo *si*: también
  **por qué**. Un día del calendario no llega con una lista vacía para que la pantalla adivine si
  está cerrado, es feriado o ya pasó — llega con un campo `estado` que lo dice.

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

### Lo visual

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
  la ruta parezca correcta.
- **Detrás de una imagen de fondo va siempre el color del sistema como respaldo**, con el color
  escrito primero y la imagen encima. Si la imagen tarda o falta, la página se ve igual y nunca en
  blanco.
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
- **Ninguna prueba se cuelga del día en que se corre.** No solo las del calendario: **cualquiera** que
  toque una fecha. Una prueba que busca «algún día del mes en curso con horarios libres» pasa hoy y
  falla el 30 de un mes. Si una prueba necesita una fecha, para el reloj con `relojDetenidoEn` y escribe
  la fecha fija. Rompió la integración continua la primera vez que corrió.
- **Ninguna prueba mira la página dibujada.** Todas hablan con el API, así que un defecto visual
  —una cuadrícula desbordada, un `hidden` que no esconde— no lo detecta ninguna. Por eso **una pieza
  no se cierra sin que una persona abra el navegador y mire.** Los tres defectos visuales
  encontrados hasta hoy (dos en la pieza 2, uno en la pieza 3) salieron todos de ahí.

### Integración continua

Existe desde la pieza 3. Las 95 pruebas corren solas en **cada push y cada pull request**, en
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
  push** (`PROYECTO.md` sección 7, punto 4). Se construyen en las piezas 3, 5 y 7.
