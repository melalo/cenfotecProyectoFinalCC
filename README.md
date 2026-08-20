# Reservas en línea para negocios de bienestar y salud

Aplicación donde un cliente reserva, cancela y reagenda citas en un negocio de bienestar y salud
—un lugar de masajes, una clínica estética— sin tener que coordinar por WhatsApp ni esperar a que
alguien conteste. La asistente del negocio usa la misma aplicación para las citas que le entran por
teléfono, así hay un solo calendario.

Es el proyecto final del curso **SINT-732 · Laboratorio Ejecutivo en Claude Code** (Universidad
CENFOTEC).

---

> ## ESTADO ACTUAL: piezas 1 y 2 cerradas (2026-08-19)
>
> Los comandos de este README **ya funcionan**: el proyecto arranca, se puede crear una cuenta,
> entrar, elegir un servicio y un proveedor, y ver el calendario del mes con los horarios libres.
>
> De las 9 piezas de `PLAN.md`:
>
> - **Pieza 1 — cerrada el 2026-08-17** (entrar a la aplicación). 14 pruebas y 8 comprobaciones.
> - **Pieza 2 — cerrada el 2026-08-19** (elegir servicio y proveedor, y ver el calendario). 27
>   pruebas nuevas —41 en total— y sus 12 comprobaciones, con el resultado de cada una anotado en su
>   bloque `Evidencia`. La revisión visual encontró dos defectos que las pruebas no podían ver, y
>   los dos quedaron corregidos.
>
> Las otras 7 están pendientes, así que todavía **no** se puede reservar, ni cancelar, ni llega
> ningún correo. **Si venís a construir, te toca la pieza 3.**

---

## Si sos un agente y acabás de llegar a este repositorio

Leé esto antes de tocar nada.

### 1. El orden de lectura, y por qué

| Orden | Archivo | Para qué |
|---|---|---|
| 1.º | `ESPECIFICACION.md` | **Qué tiene que hacer el sistema.** Reglas de negocio (RN), requisitos funcionales (RF), recorridos y preguntas abiertas. Es la autoridad sobre el comportamiento. |
| 2.º | `DISENO.md` | **Qué forma tiene la solución.** Componentes, modelo de datos, manejo de errores y las decisiones de tecnología con su razón. Es la autoridad sobre la arquitectura. |
| 3.º | `PLAN.md` | **Qué se construye y en qué orden.** Nueve vertical slices, cada una con lo que tiene que ser cierto, con qué se comprueba, y qué consume y produce. Es tu hoja de ruta. |
| 4.º | `VISUALS.md` | **Cómo se ve.** El sistema visual «Clinical Excellence»: colores, tipografía, tamaños, redondeos y espaciado. Es la autoridad sobre la apariencia, igual que `ESPECIFICACION.md` lo es sobre el comportamiento. Si un valor no está ahí, **no se inventa en el `.scss`**. |
| 5.º | `CLAUDE.md` | Stack, comandos, convenciones y restricciones del proyecto. Las convenciones no son sugerencias: fijan la estructura de carpetas, cómo se nombra cada cosa y las reglas de lo visual. |
| Si hace falta | `PROYECTO.md`, `NEGOCIO.md`, `BITACORA.md` | El enunciado original, el caso de negocio y el registro fechado de decisiones. |

**No necesitás leer las nueve piezas del plan.** Leé la que te toca construir: cada una declara qué
consume de las anteriores y qué produce para las siguientes, con los nombres exactos de tablas y de
endpoints del API. Ese bloque existe justamente para que no tengas que leer las demás. **Leé también
la `Evidencia` de las piezas ya cerradas:** ahí está qué se comprobó y qué se agregó sobre la marcha.

### 2. Tres trampas de este repositorio

Estas te van a hacer construir lo incorrecto si no las sabés:

1. **`PROYECTO.md` y `FICHA-APROBACION.md` dicen "48 horas" y están desactualizados a propósito.**
   El recordatorio es de **24 horas** (RN-20 de `ESPECIFICACION.md`). Los dos archivos conservan el
   número viejo porque son documentos históricos: el enunciado original, que el curso prohíbe
   modificar, y la ficha que el docente aprobó el 3 de agosto. **Construí siempre contra
   `ESPECIFICACION.md`.** La explicación completa está en la entrada del 2026-08-17 de
   `BITACORA.md`.
2. **`DISENO1.md` y `SEGUIMIENTO.md` no están en el repositorio** — están excluidos por
   `.gitignore`. Si los ves mencionados en algún documento y no los encontrás, no falta nada:
   `DISENO1.md` es la versión larga de `DISENO.md` y vive solo en la máquina de la estudiante.
   **`DISENO.md` es la versión válida y completa para trabajar.**
3. **Los documentos mandan sobre el código.** Si al construir descubrís que la especificación o el
   diseño están mal o incompletos, **se corrige primero ese documento, y después se escribe el
   código**. Nunca al revés, y nunca solo en el código.

### 3. Las reglas de trabajo que este proyecto impone

- **Una pieza por conversación.** Al cerrarla, cerrá la conversación.
- **La comprobación se escribe antes de construir.** Ya está escrita en `PLAN.md` para las nueve
  piezas: no la reescribas para que le quede cómoda a lo que construiste.
- **Una pieza no está cerrada hasta que su comprobación se corrió** y el resultado quedó anotado,
  con fecha, en el bloque `Evidencia` de esa pieza en `PLAN.md`.
- **No se usan datos reales de personas ni de negocios.** Todos los datos de prueba son inventados.
- **No hagas commit ni push por tu cuenta**, salvo que la estudiante lo pida.
- El vocabulario del proyecto está en el glosario de `ESPECIFICACION.md`. Usalo: se dice
  **horario** (no "slot") y **reagendar** (no "reprogramar").
- **Los estilos son mobile-first**, y eso es verificable: todos los `@media` son `min-width` y
  ninguno es `max-width`. Los cortes son 48rem y 64rem.
- **Todo campo de contraseña lleva el «ojito»** para mostrarla y ocultarla, en cualquier pantalla.
  No lo agregues campo por campo: ya hay una función que se lo pone a todos los
  `input[type="password"]` de la página, así que una pantalla nueva lo hereda sola.
- **Nada de dependencias que haya que compilar o configurar.** El cifrado de contraseñas, el
  corredor de pruebas y la tipografía usan lo que Node ya trae o archivos que viven dentro del
  proyecto, justamente para que esto se levante clonado en cualquier máquina.

---

## Stack

Todo esto está decidido en `DISENO.md`, con las alternativas que se consideraron y por qué se
descartaron. **No lo cambies sin actualizar ese documento con la razón.**

| Capa | Elección | Repositorio oficial |
|---|---|---|
| Backend | Node.js con **Express** | https://github.com/expressjs/express |
| Base de datos | **SQLite**, accedida con **better-sqlite3** | https://github.com/WiseLibs/better-sqlite3 |
| Frontend | HTML + CSS con **Sass** | https://github.com/sass/dart-sass |
| Correo | **Resend**, llamado con `fetch` — **sin instalar su paquete de npm** (ver `DISENO.md`, pieza 4) | https://resend.com/docs/api-reference/emails/send-email |
| Disparador del recordatorio | Tarea programada en **GitHub Actions** | https://github.com/features/actions |

La lista definitiva de dependencias, con su versión, va a estar en `package.json` cuando la pieza 1
lo cree.

**React se evaluó y se descartó** durante la planificación: el frontend y el backend están
separados por contrato, así que la interfaz se puede reescribir después sin tocar la lógica de
negocio, y a este tamaño el costo de aprender y configurar React no se justifica.

## Qué necesitás en la máquina

- **Node.js 20 o superior** y **npm** (viene con Node). Comprobalo con `node --version`.
- **Git.**
- Nada más. SQLite no se instala aparte: `better-sqlite3` lo trae adentro, y la base es un archivo
  dentro del proyecto.

**Esa promesa de «Node 20 o superior» está comprobada, no solo escrita:** la integración continua
corre las pruebas en Node 20 y en Node 24 en cada push. Se montó en la pieza 3 y lo primero que
encontró fue que `better-sqlite3` había quedado en una versión que exige Node 22 — la promesa era
falsa desde la pieza 1 y nadie se había dado cuenta, porque en la máquina de la estudiante corre
Node 24. Se bajó la dependencia a la línea 12, que sí soporta Node 20. La razón, con sus
alternativas, está en `DISENO.md`, «Decisiones tomadas al construir la pieza 3».

## Cómo se levanta

```bash
git clone https://github.com/melalo/laboratorioClaudeCenfotec.git
cd laboratorioClaudeCenfotec/proyectoFinal

npm install     # instala las dependencias
npm run datos   # crea la base SQLite y carga los datos de prueba
npm start       # levanta la aplicación
```

Con eso, la aplicación tiene que quedar disponible en:

**http://localhost:3000**

*(El puerto 3000 se fija acá como decisión del proyecto, para que no dependa de la máquina. Si está
ocupado, se puede cambiar con la variable de entorno `PORT`.)*

### La prueba de que esto está bien hecho

El compromiso del curso es que **el prototipo se levante siguiendo únicamente este README, en una
máquina que no es la de la estudiante**. La comprobación de referencia es literal: clonar el
repositorio en una carpeta limpia, correr los tres comandos de arriba y que funcione.

Eso significa que **no puede quedar ninguna ruta de la máquina de la estudiante, ninguna clave, ni
ninguna configuración local metida en el código**. Todo lo que haga falta o está versionado, o está
documentado como variable de entorno acá abajo.

## Variables de entorno

Se leen de un archivo `.env` en la raíz de `proyectoFinal/`. **Ese archivo nunca se sube al
repositorio.** El proyecto debe incluir un `.env.ejemplo` versionado, con las claves vacías, para
que se sepa cuáles hacen falta.

| Variable | Desde qué pieza hace falta | Para qué |
|---|---|---|
| `PORT` | 1 | Puerto donde escucha la aplicación. Si no está, vale 3000. |
| `SESION_SECRETO` | 1 | Firma las sesiones de login. Cualquier texto largo e inventado. |
| `RESEND_API_KEY` | 4 | Clave del servicio de correo. Se saca de una cuenta gratuita de Resend. |
| `CORREO_REMITENTE` | 4 | Dirección desde la que salen los correos, escrita `Nombre <correo@dominio>`. |
| `RECORDATORIOS_SECRETO` | 6 | Clave que protege el disparador del recordatorio, para que nadie de afuera lo pueda ejecutar. |

**Sin `RESEND_API_KEY` la aplicación tiene que levantar igual.** Los correos van a fallar y quedar
registrados como fallidos, pero las citas se siguen creando: así lo exige RF-19 de
`ESPECIFICACION.md`.

### Cómo conseguir la clave de Resend

Hace falta desde la **pieza 4**, para que el correo de confirmación llegue de verdad. La aplicación
funciona sin ella, así que esto se puede dejar para después. Es gratis y no pide tarjeta.

1. Entrá a **https://resend.com** y creá una cuenta con tu correo.
2. En el menú de la izquierda, abrí **API Keys** y tocá **Create API Key**. Ponele cualquier nombre
   (por ejemplo `reservas-local`) y dejale el permiso de enviar.
3. Copiá la clave que aparece — empieza con `re_`. **Se muestra una sola vez**: si cerrás la
   ventana sin copiarla, hay que crear otra.
4. Pegala en tu archivo `.env`:
   ```
   RESEND_API_KEY=re_la_clave_que_copiaste
   CORREO_REMITENTE=Belleza y Bienestar <onboarding@resend.dev>
   ```
5. Apagá la aplicación (`Ctrl + C`) y volvé a levantarla con `npm start`, para que lea el `.env`
   nuevo. Si la clave está, el aviso amarillo del arranque deja de salir.

**Sobre `onboarding@resend.dev`:** es la dirección de pruebas que Resend regala a toda cuenta nueva,
y sirve para no tener que comprar un dominio. Tiene **un límite importante**: con ella solo se puede
mandar correo **a la dirección con la que te registraste en Resend**, no a cualquiera. Para las
comprobaciones de la pieza 4 alcanza — se reserva con esa misma dirección. Para mandarle correos a
clientes de verdad haría falta un dominio propio verificado en Resend, y eso queda fuera de esta
entrega.

**Si algo no llega:** mirá la consola donde corre `npm start`. Cada envío fallido deja ahí un aviso
con el motivo exacto que devolvió Resend, y además queda una fila con `exito = 0` en la tabla
`correo_enviado` de la base.

## Datos de prueba

`npm run datos` crea la base desde cero y carga datos **inventados**. Se puede correr las veces que
haga falta: borra lo anterior y vuelve a empezar.

> **Apagá la aplicación antes de correrlo.** El comando borra el archivo de la base, y Windows no
> deja borrar un archivo que otro programa tiene abierto. Si `npm start` está corriendo, `npm run
> datos` falla — y te lo dice con esas palabras. Apagala con `Ctrl + C`, corré `npm run datos`, y
> volvé a levantarla.
>
> **Y ojo:** borrar la base se lleva también las cuentas que hayas creado desde la pantalla. Después
> de correrlo hay que volver a registrarse; la de Personal sí vuelve sola, porque es precargada.

Lo que carga hoy, con las piezas 1 y 2 construidas. El comando lo lista en pantalla al terminar:

- **El negocio:** «Belleza y Bienestar», tel. `2000-0000`, en «Avenida Central, San José — edificio
  Girasol, local 3». **Todo inventado, el teléfono también:** no es el número de nadie. El logo y
  los colores de la marca del negocio se guardan porque REG-4 pide registrarlos, pero **la
  aplicación no los aplica**: su apariencia sale de `VISUALS.md`, que es otra cosa.
- **Servicios:** «Masaje relajante» y «Limpieza facial», los dos de una hora.
- **Proveedores:** «Ana», «Carlos» y «Luisa». Ana atiende los dos servicios; Carlos solo el masaje;
  Luisa solo la limpieza facial. Así los dos servicios tienen más de un proveedor y el cliente
  siempre puede elegir con quién (RN-8).
- **Horario del negocio:** lunes a viernes de 9:00 a 18:00 con el almuerzo bloqueado de 12:00 a
  13:00, y sábados de 9:00 a 13:00. Domingo cerrado. Cada cita dura una hora, así que entre semana
  los horarios son 9, 10, 11, 13, 14, 15, 16 y 17, y el sábado 9, 10, 11 y 12.
- **Feriados de ley de Costa Rica:** 22 filas, los de **2026 y 2027**, precargados como dato fijo —
  no se le pregunta a ningún servicio en línea. Van **en su fecha original, sin trasladarse al
  lunes**; la razón, y los dos feriados que quedaron afuera a propósito, están explicados en
  `guiones/datos-de-prueba.js`.
- **Una cuenta de Personal** (la asistente, «Marta Jiménez»), precargada — no hay pantalla para
  registrarla. Entra con **`personal@ejemplo.com`** y la contraseña **`Personal123`**. Es una cuenta de prueba
  inventada, y como está escrita acá a la vista de todos, **no sirve para nada real**: si el
  proyecto algún día se usara de verdad, lo primero es cambiarla.
- **Ninguna cita.** Las citas se crean desde la aplicación a partir de la pieza 3.

## Pruebas

```bash
npm test
```

**Hoy corre 95 pruebas**, todas en `pruebas/`:

- **14 de la pieza 1** (`autenticacion.test.js`): registrarse, entrar, el mensaje idéntico cuando el
  correo no existe y cuando la contraseña está mal, la contraseña cifrada, el correo repetido, la
  cuenta de Personal precargada y la persistencia tras reiniciar.
- **27 de la pieza 2** (`catalogo.test.js` y `disponibilidad.test.js`): los servicios y sus
  proveedores, y el cálculo de disponibilidad con todos sus casos borde — el almuerzo, el sábado
  corto, el domingo cerrado, los feriados, «hoy no», el cambio de mes, febrero bisiesto, una cita
  activa que ocupa, una cancelada que no ocupa, y el aviso de que no quedan horarios en 7 días.
- **23 de la pieza 3** (`reservas.test.js`): reservar y que la cita quede guardada con su canal y su
  fecha de creación, que el horario deje de aparecer libre, que sobreviva un reinicio, que un cliente
  pueda tener varias citas a la vez, **CA-1** (dos clientes reservan el mismo horario a la vez y
  exactamente uno lo consigue), **CA-2** (ningún horario de hoy se puede reservar, a ninguna hora),
  que un horario cancelado se pueda volver a tomar, y los rechazos de feriado, domingo, almuerzo,
  fuera de horario, momento mal escrito, proveedor que no atiende ese servicio, y sesión de
  Personal.
- **19 de la pieza 10** (`usuario.test.js`): ver los datos propios, completar el teléfono y la fecha
  de nacimiento, **la edad calculada** con su caso borde (el día antes del cumpleaños, el día mismo, y
  quien nació un 29 de febrero), «desde cuándo es cliente» sacado de la primera cita, que el correo no
  se pueda cambiar (RN-21), y los rechazos de teléfono, fecha y nombre mal escritos.
- **12 de la pieza 11** (`categorias.test.js`): las categorías con sus servicios adentro, que el
  servidor —y no la pantalla— diga si hay que elegir el tipo (RN-22), que la categoría de un solo
  servicio lleve directo a los proveedores, que reservar un subtipo guarde el nombre del servicio, y
  que ningún servicio pueda quedar sin categoría.

Las del calendario **paran el reloj** en una fecha fija (martes 1 de setiembre de 2026, 8 de la
mañana en Costa Rica). Sin eso dirían cosas distintas según el día en que se corran: «mañana hay
horarios» fallaría los sábados.

A medida que avance el plan, este mismo comando irá cubriendo además los tres criterios de
aceptación de `ESPECIFICACION.md`, que son las tres reglas que el curso exige proteger:

| | Qué comprueba | Desde qué pieza |
|---|---|---|
| **CA-1** | Dos intentos de reservar el mismo horario del mismo proveedor: exactamente uno lo consigue. | 3 — **ya cubierto** |
| **CA-2** | Un intento de reservar un horario de hoy se rechaza, a cualquier hora que se intente. | 3 — **ya cubierto** |
| **CA-3** | Cancelar o reagendar faltando menos de 4 horas: el cliente es rechazado, Personal es aceptado. | 5 y 7 |

### Corren solas en cada push

Desde la pieza 3, **estas 95 pruebas se corren automáticamente en cada `push` y en cada pull
request**, sin que nadie escriba `npm test`. Lo hace GitHub Actions, configurado en
`.github/workflows/pruebas.yml`.

Ese archivo está en la **raíz del repositorio**, no dentro de `proyectoFinal/`, y no es una
distracción: GitHub solo ejecuta los archivos que están en `.github/workflows/` en la raíz. Es la
única cosa de este proyecto que vive afuera de su carpeta, y está autorizada y explicada en
`DISENO.md`.

Para ver el resultado: en GitHub, pestaña **Actions**. Verde es que las 95 pasaron, en las dos
versiones de Node.

## Qué no está en el repositorio

- **`.env`** — las claves. Cada quien crea el suyo a partir de `.env.ejemplo`.
- **La base de datos** — se genera con `npm run datos`.
- **`node_modules/`** — se genera con `npm install`.
- **`DISENO1.md` y `SEGUIMIENTO.md`** — documentos locales de la estudiante, excluidos por
  `.gitignore`. No los necesitás.
- **`.claude/`** — la skill con la que se generó el enunciado del proyecto.

## Estructura del proyecto

Los documentos:

```
proyectoFinal/
├── README.md              ← estás acá
├── ESPECIFICACION.md      ← qué tiene que hacer el sistema  (la autoridad)
├── DISENO.md              ← qué forma tiene la solución     (la autoridad)
├── PLAN.md                ← las 9 piezas, sus comprobaciones y su evidencia
├── CLAUDE.md              ← stack, comandos, convenciones y restricciones
├── VISUALS.md             ← el sistema visual: colores, tipografía, medidas (la autoridad)
├── PROXIMA-SESION.md      ← cómo retomar: qué pieza toca y qué hay que saber antes de empezar
├── PROYECTO.md            ← el enunciado original (no se modifica; dice "48 horas", ver arriba)
├── FICHA-APROBACION.md    ← lo aprobado por el docente (histórico; dice "48 horas", ver arriba)
├── NEGOCIO.md             ← oportunidad, riesgos, ROI y hoja de ruta
└── BITACORA.md            ← registro fechado de decisiones y correcciones de rumbo
```

Y el código, que nació con la pieza 1. Las convenciones de esta estructura están explicadas en
`CLAUDE.md`:

```
proyectoFinal/
├── servidor/              el backend: acá viven las reglas de negocio
│   ├── index.js             arranca el servidor (es lo que corre npm start)
│   ├── aplicacion.js        arma la aplicación de Express, sin ponerla a escuchar
│   ├── base-de-datos.js     abre el archivo SQLite y crea las tablas
│   ├── contrasenas.js       cifrar una contraseña y comprobar si coincide
│   ├── sesion.js            la cookie firmada que sostiene la sesión
│   ├── tiempo.js            fechas y horas, siempre en la hora del negocio (Costa Rica)
│   ├── catalogo.js          preguntas al catálogo: si un servicio existe, quién lo atiende
│   ├── clientes.js          los datos del cliente: leerlos, comprobarlos y guardarlos
│   ├── disponibilidad.js    qué horarios están libres — la regla, escrita una sola vez
│   ├── reservas.js          crear una cita — el único lugar que toca el estado de una cita
│   └── rutas/               un archivo por grupo de endpoints del API
├── guiones/               comandos de mantenimiento (hoy: cargar los datos de prueba)
├── estilos/               los .scss que se escriben a mano, siguiendo VISUALS.md
├── publico/               lo que el navegador recibe: HTML, su JavaScript, el CSS generado
│   ├── fuentes/             la tipografía Manrope, dentro del proyecto (no se pide a internet)
│   └── img/                 las imágenes (hoy: el fondo de la página)
├── pruebas/               las pruebas automáticas de npm test
├── datos/                 el archivo SQLite — se genera, no se sube
├── package.json           las dependencias y los cuatro comandos
└── .env.ejemplo           qué variables de entorno hacen falta
```
