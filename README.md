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
> Los comandos de este README **ya funcionan**, y el prototipo hace el recorrido **completo**: se
> crea una cuenta, se entra, se elige categoría, servicio y proveedor, se ve el calendario del mes,
> se reserva un horario, **llega el correo de confirmación**, y la cita se puede **cancelar o mover a
> otro horario**.
>
> Estado de las piezas de `PLAN.md` al 2026-08-24:
>
> | Pieza | Estado |
> |---|---|
> | 1 — Entrar a la aplicación | **cerrada** el 2026-08-17 |
> | 2 — Elegir servicio y proveedor, y ver el calendario | **cerrada** el 2026-08-19 |
> | 3 — Reservar un horario | **cerrada** el 2026-08-19 |
> | 4 — Correo de confirmación | **cerrada** el 2026-08-19 |
> | 5 — Cancelar y reagendar | **cerrada** el 2026-08-20 |
> | 7 — Personal atiende el teléfono | **cerrada** el 2026-08-24 (construida el 2026-08-21) |
> | 10 — La información del cliente | **cerrada** el 2026-08-19, fuera de orden |
> | 11 — Categorías de servicio | **cerrada** el 2026-08-19, fuera de orden |
> | 12 — Reglas de contraseña y correo | **cerrada** el 2026-08-19, pedida fuera del plan |
> | 6, 8, 9 | pendientes |
>
> *(Esta tabla decía «al 2026-08-20» y se había quedado atrás en dos filas: la 5 seguía figurando sin
> revisión visual cuando `PLAN.md` ya la daba por cerrada ese mismo día, y la 7 no tenía fila. Se
> sincronizó contra `PLAN.md`, que es la autoridad sobre el estado de las piezas.)*
>
> Con la pieza 5 **el núcleo comprometido en `FICHA-APROBACION.md` está completo**, y con la pieza 7
> **los tres criterios de aceptación (CA-1, CA-2 y CA-3) están cubiertos por pruebas que corren en
> cada push**. Lo que falta es que Personal cierre las citas pasadas (pieza 8), restablecer la
> contraseña (9) y el recordatorio de 24 horas (6). **Si venís a construir, te toca la pieza 8.**

---

## Si sos un agente y acabás de llegar a este repositorio

Leé esto antes de tocar nada.

### 1. El orden de lectura, y por qué

| Orden | Archivo | Para qué |
|---|---|---|
| 1.º | `ESPECIFICACION.md` | **Qué tiene que hacer el sistema.** Reglas de negocio (RN), requisitos funcionales (RF), recorridos y preguntas abiertas. Es la autoridad sobre el comportamiento. |
| 2.º | `DISENO.md` | **Qué forma tiene la solución.** Componentes, modelo de datos, manejo de errores y las decisiones de tecnología con su razón. Es la autoridad sobre la arquitectura. |
| 3.º | `PLAN.md` | **Qué se construye y en qué orden.** Doce vertical slices —nueve del plan original, más la 10, la 11 y la 12 que se agregaron después—, cada una con lo que tiene que ser cierto, con qué se comprueba, y qué consume y produce. Es tu hoja de ruta. |
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
- **Ojo con «proveedor»:** así se llama en la base, en el API y en el código, y **así se sigue
  llamando**. Pero **lo que el cliente lee en pantalla y en los correos es «terapista»** (decidido el
  2026-08-20). No es una inconsistencia que haya que «arreglar»: son dos vocabularios a propósito, el
  técnico y el del negocio. Y va sin artículo con género —«tu terapista», «Terapista Ana»— porque hay
  proveedores mujeres y hombres.
- **Los estilos son mobile-first**, y eso es verificable: todos los `@media` son `min-width` y
  ninguno es `max-width`. Los cortes son 29.75rem, 48rem y 64rem.
- **Ningún tamaño de letra se escribe en píxeles.** Van todos en `rem` —el píxel de `VISUALS.md`
  dividido entre 16— y los títulos con `clamp()`. Y `html` lleva un `font-size: 80%` que achica toda
  la tipografía de una sola vez: **no lo reemplaces por un tamaño en píxeles**, porque dejaría el
  `rem` clavado y quien agranda la letra de su navegador dejaría de poder hacerlo. La tabla de
  conversión y las tres razones están arriba de `estilos/estilos.scss`.
- **La hora se escribe con `am`/`pm` en todas partes menos en las fichas de horario del calendario**,
  que siguen en hora de 24. No es un olvido: son ocho por día en una fila de cuatro columnas y
  `10:00am` no entra en un teléfono angosto. La razón está escrita en `fichaDeHorario` y en
  `DISENO.md`.
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

### El atajo: la skill `/launch`

Los tres comandos de arriba levantan la aplicación, pero **no dicen con qué cuenta entrar ni qué hay
adentro para mirar**. Para eso el repositorio trae una skill propia de Claude Code, en
`.claude/skills/launch/`. Con Claude Code abierto en esta carpeta:

```
/launch          → levanta con los datos que ya hay. No borra nada
/launch limpio   → rehace los datos de prueba y levanta. Avisa qué se pierde y pide confirmación
```

Hace cuatro cosas: revisa que se pueda arrancar (puerto libre, `.env`, base creada), levanta la
aplicación, y después **cuenta qué hay adentro leyéndolo de la base de datos** — qué cuentas existen,
cuántas citas hay y de qué tipo, y qué se puede mostrar.

**Lo que automatiza no es correr dos comandos: es el paso de después.** Hasta el 2026-08-24, para
poder recorrer la aplicación había que abrir un documento y leer una tabla escrita a mano. Esa tabla
**es una foto del momento en que se escribió** y se pone vieja sola — ese mismo día decía «tres citas
esperando» cuando quedaban dos. La skill no la lee: le pregunta a la base, que es lo único que no
puede quedar desactualizado.

Lo que cuenta se puede pedir también **sin Claude Code**, porque la cuenta vive en un guion y no en la
skill:

```bash
npm run estado
```

Ese comando **solo lee** —abre la base en modo `readonly`—, así que se puede correr con la aplicación
levantada y no puede romper nada.

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

Lo que carga hoy. El comando lo lista en pantalla al terminar:

- **El negocio:** «Belleza y Bienestar», tel. `2000-0000`, en «Avenida Central, San José — edificio
  Girasol, local 3». **Todo inventado, el teléfono también:** no es el número de nadie. El logo y
  los colores de la marca del negocio se guardan porque REG-4 pide registrarlos, pero **la
  aplicación no los aplica**: su apariencia sale de `VISUALS.md`, que es otra cosa.
- **Dos categorías con cuatro servicios adentro**, todos de una hora *(desde la pieza 11: hasta
  entonces eran dos servicios sueltos, sin categorías)*: **Masaje** contiene «Masaje relajante»,
  «Masaje descontracturante» y «Masaje con piedras calientes»; **Facial** contiene «Limpieza
  facial», que es el único de su categoría y por eso ese paso no se muestra (RN-22).
- **Proveedores:** «Ana», «Carlos» y «Luisa». Ana atiende el masaje relajante, el de piedras
  calientes y la limpieza facial; Carlos el relajante y el descontracturante; Luisa solo la limpieza
  facial. Así los servicios que importan tienen más de un proveedor y el cliente puede elegir con
  quién (RN-8).
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
- **Ninguna cita y ninguna cuenta de cliente.** Las citas se crean desde la aplicación a partir de
  la pieza 3, y las cuentas de cliente se crean desde «Crear mi cuenta» — o desde la pantalla de
  Personal, que le crea la cuenta a quien llama por teléfono con una contraseña temporal (pieza 7).

## Pruebas

```bash
npm test
```

**Hoy corre 277 pruebas**, todas en `pruebas/`:

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
- **14 de la pieza 4** (`correo.test.js`): que el correo de confirmación lleve los cinco datos de
  RF-11 en sus dos versiones (HTML y texto plano), que cada envío deje su fila en `correo_enviado`
  salga bien o mal, que se reintente **una** vez y solo si la falla puede ser pasajera, y que **una
  cita se cree igual aunque el correo no salga** (RF-19).
- **26 de la pieza 12** (`contrasenas-y-correos.test.js`): las cuatro condiciones de la contraseña
  (RN-23) y la forma del correo (RN-24), comprobadas **mandándole el pedido al API sin pasar por la
  pantalla**, que es lo que demuestra que la regla vive en el servidor.
- **39 de la pieza 5** (`cancelar-y-reagendar.test.js`): cancelar y que la cita deje de estar activa
  sin borrarse (RN-15), que el horario se libere **para cualquier otra persona** (RN-7), que quede
  anotado cuándo y quién canceló (REG-1), mover una cita a otro horario en un solo movimiento, que
  reagendar **no** cambie el servicio ni el proveedor aunque se los manden salteando la pantalla
  (RN-18), que el correo del reagendamiento diga la fecha **nueva**, **CA-3 (parte cliente)** —una
  cita a menos de 4 horas se rechaza al cancelar y al mover—, el borde exacto de la ventana a los dos
  lados (a 4 horas justas sí, a 3 h 59 min no), y que nadie pueda tocar la cita de otra persona.
- **58 de la pieza 7** (`personal.test.js`): que Personal reserve en nombre de quien llama y la cita
  quede con canal `asistida` y con la cuenta que la creó (RN-12), que **el correo le llegue al
  cliente y no a Personal**, que le cree la cuenta con una contraseña temporal que cumple RN-23 y es
  distinta cada vez, que la búsqueda encuentre por pedazos del nombre y del correo pero **no devuelva
  nada con menos de 2 letras**, que Personal cumpla **las mismas reglas** que el cliente al reservar
  —horario ocupado, hoy, feriado, domingo, almuerzo (RN-13)—, y **CA-3 (parte Personal)**: la misma
  cita que empieza dentro de 2 horas se le rechaza al cliente con `422` y se le acepta a Personal con
  `204`, quedando `cancelada_por = personal`. Y **RN-25**: que Personal pueda agendar para **hoy** en
  un horario que todavía no empezó, con su borde exacto —el horario que arranca en este mismo instante
  ya empezó— y con **CA-2 comprobado al lado**, porque el cliente sigue sin poder.
- **18 de la pieza 7** (`cambio-de-contrasena.test.js`): que una cuenta con la contraseña temporal
  pendiente **no pueda hacer nada** —ni ver citas, ni reservar, ni ver ni guardar sus datos—, que las
  tres puertas que esa pantalla necesita sigan abiertas, que al cambiarla quede libre sin volver a
  entrar, que la temporal vieja quede rechazada, y que la nueva tenga que cumplir RN-23.
- **27 de la pieza 8** (`cierre-de-citas.test.js`): que la lista de citas por cerrar traiga solo las
  **activas cuya hora ya pasó** —de la más vieja a la más nueva, y con el nombre de su dueño, porque
  son de gente distinta—, que marcarlas como **completada** o **no asistió** deje anotado **qué cuenta
  de Personal lo hizo y cuándo** (REG-1), que después desaparezcan de la lista pero **no de la base**
  (RN-15), que una cita que nadie toca **siga activa** —ningún estado se alcanza por el paso del
  tiempo (RN-17)—, que un cliente no pueda cerrar ni la suya, que una cita ya cerrada no admita otro
  estado, que una cita **que todavía no ocurrió** no se pueda marcar, y **RN-26**: una cita cuya hora
  ya pasó no se cancela ni se reagenda **tampoco con la sesión de Personal**. Dos de las 27 existen
  solo para demostrar que RN-26 **no se llevó por delante CA-3**: la misma cita que empieza dentro de
  2 horas se le sigue aceptando a Personal y rechazando al cliente.

Las del calendario **paran el reloj** en una fecha fija (martes 1 de setiembre de 2026, 8 de la
mañana en Costa Rica). Sin eso dirían cosas distintas según el día en que se corran: «mañana hay
horarios» fallaría los sábados.

Este mismo comando cubre además los tres criterios de aceptación de `ESPECIFICACION.md`, que son las
tres reglas que el curso exige proteger:

| | Qué comprueba | Desde qué pieza |
|---|---|---|
| **CA-1** | Dos intentos de reservar el mismo horario del mismo proveedor: exactamente uno lo consigue. | 3 — **ya cubierto** |
| **CA-2** | Un intento de reservar un horario de hoy se rechaza, a cualquier hora que se intente. | 3 — **ya cubierto** |
| **CA-3** | Cancelar o reagendar faltando menos de 4 horas: el cliente es rechazado, Personal es aceptado. | 5 la parte del cliente y 7 la de Personal — **las dos cubiertas**, y la 8 agregó dos pruebas que vigilan que una regla nueva sobre esa misma función no lo debilite |

### Corren solas en cada push

Desde la pieza 3, **estas 277 pruebas se corren automáticamente en cada `push` y en cada pull
request**, sin que nadie escriba `npm test`. Lo hace GitHub Actions, configurado en
`.github/workflows/pruebas.yml`.

Ese archivo está en la **raíz del repositorio**, no dentro de `proyectoFinal/`, y no es una
distracción: GitHub solo ejecuta los archivos que están en `.github/workflows/` en la raíz. Es la
única cosa de este proyecto que vive afuera de su carpeta, y está autorizada y explicada en
`DISENO.md`.

Para ver el resultado: en GitHub, pestaña **Actions**. Verde es que las 277 pasaron, en las dos
versiones de Node. *(Este número decía «95» hasta el 2026-08-21 y «250» hasta el 2026-08-24: se había
quedado viejo mientras las pruebas crecían pieza a pieza.)*

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
├── PLAN.md                ← las 12 piezas, sus comprobaciones y su evidencia
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
├── .claude/               la skill propia del proyecto
│   └── skills/launch/       /launch: deja el proyecto levantado y listo para recorrerse
├── guiones/               comandos de mantenimiento: cargar los datos de prueba (cargar-datos.js)
│                          y contar en qué estado está el proyecto (estado.js)
├── estilos/               los .scss que se escriben a mano, siguiendo VISUALS.md
├── publico/               lo que el navegador recibe: HTML, su JavaScript, el CSS generado
│   ├── fuentes/             la tipografía Manrope, dentro del proyecto (no se pide a internet)
│   └── img/                 las imágenes (hoy: el fondo de la página)
├── pruebas/               las pruebas automáticas de npm test
├── datos/                 el archivo SQLite — se genera, no se sube
├── package.json           las dependencias y los cinco comandos
└── .env.ejemplo           qué variables de entorno hacen falta
```
