# Próxima sesión — cerrar a mano la pieza 6, y la presentación

*Escrito el 2026-08-28, al cerrar la pieza 9. **Actualizado el 2026-08-29**, cuando la estudiante
decidió publicar la aplicación, y **el 2026-09-07**, al construir la pieza 6. Esta es la hoja para
retomar sin releer nada.*

> ## ⚠️ LO PRIMERO, ANTES DE CUALQUIER OTRA COSA
>
> **La pieza 6 está construida y probada en producción, pero NO cerrada.** `npm test` da **354 de
> 354**. Lo que falta:
>
> | | Estado |
> |---|---|
> | `RECORDATORIOS_SECRETO` en Vercel y en los Secrets de GitHub, más `DIRECCION_PUBLICA` en los Secrets | ✅ **hecho** |
> | La tabla `token_cita` en la base de Turso | ✅ **hecha** con `npm run esquema` |
> | El disparador funcionando contra el sitio en vivo | ✅ **comprobado**: `{"revisadas":1,"enviados":1}`, y llegó un correo de verdad |
> | **Publicar los dos arreglos de abajo** (`npx vercel --prod`) | ⏳ **pendiente, y hace falta** |
> | **Comprobación 3**, en el teléfono | ⏳ pendiente — hacerla **después** de publicar |
> | **Comprobación 8**: que la tarea arranque sola | ⏳ pendiente — hay que esperar el horario |
>
> ### 🔎 Publicar reveló dos defectos que las 349 pruebas no veían. Los dos están arreglados.
>
> **1. La base publicada no tenía la tabla `token_cita`, y el síntoma no fue el que correspondía.**
> El despliegue **no crea tablas**, a propósito (`servidor/aplicacion-desplegada.js` explica por qué).
> Eso por sí solo debía causar «el correo llega sin botones»; en cambio **reservar contestaba `500`
> con la cita ya guardada**. La causa de eso era código, no configuración:
> `enviarConfirmacionDeCita` está documentada desde la pieza 4 como que **nunca lanza un error**
> —RF-19—, y la pieza 6 le había metido adentro una escritura a la base sin protegerla. Arreglado con
> `losEnlacesSiSePueden` en `servidor/correo.js`, **una sola función para los dos correos**, y 4
> pruebas que reproducen el estado exacto de la base publicada. *El recordatorio tenía el mismo
> agujero: una cita imposible tumbaba la corrida entera.*
>
> ⚠️ **Y deja una pregunta abierta para el proyecto, que la pieza 6 es la primera en tocar: cuando
> una pieza nueva agrega una tabla, ¿cómo se entera la base publicada?** Hoy la respuesta es «alguien
> se acuerda de correr `npm run esquema`». Las doce piezas anteriores son todas de antes del
> despliegue, así que nunca había pasado.
>
> **2. Los botones del correo se llamaban distinto que los de la aplicación.** Decían «Cambiar la
> hora» y «Cancelar la cita»; «Mis citas» dice **Reagendar** y **Cancelar** desde la pieza 5. Rompía
> la convención de `CLAUDE.md` —*dos caminos al mismo lugar se llaman igual*— y pesa más acá que en
> una pantalla, porque el correo y la aplicación se leen en momentos separados. **Lo encontró la
> estudiante leyendo el correo que le llegó**, no una prueba. Arreglado en el correo y en la pantalla,
> con una prueba que fija el vocabulario. *De paso se alinearon los dos avisos verdes y se pasó a
> reusar `mensajeDelMovimiento`, que ya existía desde la pieza 5.*
>
> ### El orden de lo que queda
>
> 1. **`npx vercel --prod`** — hasta que no se publique, el correo que llega sigue teniendo los
>    botones con el nombre viejo.
> 2. **Comprobación 3, en el teléfono.** Reservar contra el sitio publicado y, del correo de
>    confirmación, tocar **«Reagendar»** primero y **«Cancelar»** después — en ese orden, porque
>    cancelar deja la cita inservible para probar lo otro. Tiene que abrir la aplicación **sin pedir
>    contraseña**.
> 3. **Comprobación 8.** En Actions, ver que «Recordatorios de 24 horas» corrió **sola**, a su
>    horario. El botón «Run workflow» **no la reemplaza**: lo que se comprueba es que arranca sin que
>    nadie la dispare. Corre a las 03:20, 07:20, 11:20, 15:20, 19:20 y 23:20 **UTC** — en Costa Rica,
>    21:20, 01:20, 05:20, 09:20, 13:20 y 17:20.
> 4. **La revisión visual de la pantalla nueva**, que es la que encontró los 19 defectos visuales del
>    proyecto y ninguna prueba puede reemplazar. **Y ya encontró uno acá**: el del punto 2.
>
> ### 🔎 Y se desmintió una creencia que el proyecto arrastraba escrita
>
> Hasta el 2026-09-07 estaba escrito —y repetido en el prompt de arranque de dos sesiones— que **«a
> Claude se le bloquea cargar secretos en Vercel»**. **Es falso, y se vio probándolo:**
> `npx vercel env add` corrió sin problema. **Lo que sí está bloqueado es `npx vercel --prod`**, o sea
> *publicar* — que es otra cosa, y con sentido: publicar cambia lo que ve el mundo, cargar una
> variable no.
>
> La lección es la misma de la caída de Actions del 2026-08-26: **una limitación que nadie comprobó
> se propaga como si fuera un hecho**, y esta costó una conversación entera de pasos manuales que no
> hacían falta. **Antes de anotar «esto no se puede», probarlo una vez.**

---

## Lo que hay que decir al abrir la conversación

> Abrí el repositorio `cenfotecProyectoFinalCC`. Leé `PROXIMA-SESION.md`.

Con eso alcanza. El agente tiene que leer por su cuenta `ESPECIFICACION.md`, `DISENO.md`, la pieza
que se vaya a construir de `PLAN.md`, `VISUALS.md` y el `CLAUDE.md` del repositorio.

**Y la sesión se abre DENTRO de esta carpeta, no en la de arriba.** Si se abre en
`Desktop/claudeCodeCenfotec`, el `CLAUDE.md` del repositorio no se carga y la skill `/launch`
**no aparece en la lista**, aunque exista. Pasó el 2026-08-29 y costó una conversación entera.

---

## En qué estado exacto quedó todo

*Esta tabla se puso al día el **2026-09-05**, al cerrar el despliegue.*

| | |
|---|---|
| **🌐 LA APLICACIÓN ESTÁ PUBLICADA** | **https://reservas-bienestar.vercel.app** — funciona, con datos. Se puede crear cuenta, reservar, cancelar y entrar como Personal desde cualquier teléfono |
| **Pruebas** | `npm test` da **354 de 354**, en Node 20 y Node 24 *(eran 323 antes de la pieza 6)* |
| **CA-1, CA-2 y CA-3** | **Los tres completos.** Y **CA-1 está comprobado contra la base publicada**, no sólo contra el archivo local: dos sesiones distintas piden el mismo horario y la segunda recibe `409` |
| **Git** | Todo subido en la rama **`despliegue-vercel-turso`**. ⚠️ **Todavía NO está en `main`** |
| **Piezas hechas** | **Las doce.** La 6 se construyó el 2026-09-07 — código completo y 31 pruebas nuevas |
| **Piezas que faltan** | Ninguna. **Pero la 6 no está cerrada:** faltan las 3 cosas a mano del bloque de arriba |
| **Del curso** | Falta **preparar la presentación** de la sesión 8 |
| **Tiempo** | Hasta la entrega del **8 de setiembre** |
| **Base de datos** | **Turso** en producción (`database-cinereous-candle`), y el **archivo local** en la computadora. ⚠️ **Son dos bases distintas y no comparten ni una cuenta** |
| **Motor de la base** | **`@libsql/client`** desde el 2026-09-04. `better-sqlite3` salió del proyecto |

### Las cuentas del sitio publicado

| Cuenta | Correo | Contraseña |
|---|---|---|
| **Marta Jiménez** (personal) | `personal@ejemplo.com` | `Personal123` |
| **Melania López** (cliente) | `melalo9@gmail.com` | La eligió la estudiante con el enlace de recuperación |

**No hay ninguna cita en el sitio publicado.** Si la presentación necesita datos para mostrar, hay
que crearlos. Está anotado como decisión pendiente en `DESPLIEGUE.md`.

---

## Lo que queda, y en qué orden

### 1. ~~Publicar la aplicación en Vercel~~ — ✅ **HECHO el 2026-09-05**

**Las seis etapas de `PLAN-DESPLIEGUE.md` están cerradas.** La aplicación corre en Vercel con la base
en Turso, y las **11 comprobaciones** contra el sitio en vivo pasaron. El registro completo, con la
salida cruda de cada paso, está en **`DESPLIEGUE.md`** — incluidas las cosas que el plan no había
previsto y las dos trampas que aparecieron.

Tres datos de ahí que valen para la presentación:

- **CA-1 comprobado contra la base de verdad.** Es el criterio que **casi se rompe en silencio** al
  cambiar el motor: `@libsql/client` mueve el nombre fino del error a otro lugar, y en la
  computadora ese camino casi nunca se recorre. Lo atajó `pruebas/adaptador.test.js`, una prueba de
  contrato escrita **antes** del cambio.
- **El enlace del correo abre desde el teléfono, por los dos caminos.** Eso comprueba las dos
  defensas del hallazgo 21 contra el servicio real — algo que desde `localhost` era imposible, porque
  el enlace ni siquiera abría.
- **El calendario de un mes tarda 139 ms**, así que la trampa lenta del despliegue anterior no aplica.

*Lo que sigue de esta sección es el historial de la decisión, del 2026-08-29. Se deja porque explica
por qué se eligió Vercel y qué costó.*

---

El problema era este: el plan de la pieza 6 dice que una tarea programada de GitHub Actions llama al
backend. Pero la aplicación corre en `http://localhost:3000`, que quiere decir «esta computadora»:
**GitHub no puede llamar a tu computadora**. No hay clave ni configuración que lo arregle.

**La razón de fondo de la decisión no es la pieza 6**, sino que **sin dirección pública la
aplicación no se puede mostrar en la presentación de la sesión 8**. Eso pesó más que cualquier
comprobación del plan.

**Se evaluó y se descartó** alojarla en un servicio de contenedor (tipo Render), donde la aplicación
correría tal como está y SQLite seguiría funcionando con **cero cambios de código**. La estudiante
eligió Vercel sabiendo el costo. **La decisión está tomada: no volver a proponer otra plataforma.**

**Lo que cuesta, ya medido el 2026-08-28 sobre este código:**

| | |
|---|---|
| Puntos que consultan la base | **107** — 47 en `servidor/`, 49 en `pruebas/`, 11 en `guiones/` |
| Transacciones a rearmar | **5**, incluida `comprobarYGuardar` de `servidor/reservas.js`, que es lo que impide reservar dos veces el mismo horario |
| Además | Adaptar el arranque: hoy `servidor/index.js` levanta un Express con `listen()`, y Vercel corre funciones, no servidores |
| Red de seguridad | Las **302 pruebas** tienen que quedar en verde **al final de cada etapa**, para poder parar sin dejar el proyecto roto |

El cambio de fondo es que `better-sqlite3` es **sincrónico** y Turso es **asincrónico**: cada
consulta pasa a ser esperada, y eso se contagia hacia arriba por toda la aplicación.

**Lo que juega a favor, y es más de lo que parecía:** la aplicación ya lee `PORT` del entorno,
**`DIRECCION_PUBLICA` ya existe como variable** —la dejó puesta la pieza 9 para los enlaces del
correo— y lo único que escribe a disco es la carpeta de la base. Las variables de entorno son solo
cinco: `PORT`, `SESION_SECRETO`, `RESEND_API_KEY`, `CORREO_REMITENTE`, `DIRECCION_PUBLICA`.

**Esta migración ya se hizo una vez**, en `semana6/cancha-total` del repo del curso. Su bitácora
está en `Desktop/claudeCodeCenfotec/cursoCenfotecClaude/semana6/cancha-total/DESPLIEGUE.md`, que
**este repositorio no puede ver**: hay que abrirla aparte. Tres trampas ya pagadas allí:

1. El **Root Directory** de Vercel no se lee ni se escribe con la CLI; hay que usar la API.
2. Turso inyecta `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` **con esos nombres exactos**.
3. Una función de Vercel **no aguanta muchas consultas seguidas dentro de una misma visita**.

El token de Vercel está en `Desktop/connectVercel.txt`.

### 2. ✅ LA PIEZA 6 — «Recordatorio de 24 horas». **CONSTRUIDA el 2026-09-07**

**12 de 12.** El código está entero y `npm test` da **354 de 354**. Se construyó con TDD, como las
otras once: las primeras 26 pruebas se escribieron primero y se vieron fallar.

**Lo que falta para cerrarla está arriba, en el bloque del principio de este archivo.** No es código.

#### Qué se construyó, para poder contarlo

Se hizo en **dos ciclos** y no en el orden de los 8 pasos del plan, porque el plan es anterior al
crecimiento de RF-11 del 2026-09-05: primero **el mecanismo del enlace**, que RF-11 y RF-12
comparten, y después **el recordatorio**, que lo usa.

*Archivos nuevos:* `servidor/enlaces-de-cita.js`, `servidor/recordatorios.js`,
`pruebas/enlaces-de-cita.test.js` (15), `pruebas/recordatorios.test.js` (16),
`.github/workflows/recordatorios.yml`.

*Y se tocaron seis que el plan no listaba*, porque su lista es anterior al cambio de RF-11:
`servidor/esquema.js` (la tabla `token_cita`), `servidor/correo.js`, `servidor/reservas.js`,
`servidor/aplicacion.js`, `servidor/tiempo.js` (`horasEntre`) y la pantalla
(`publico/index.html` + `publico/aplicacion-cliente.js`).

#### La decisión que estaba pendiente, y que la estudiante tomó ese día

**Qué pasa si alguien toca el enlace del correo y no tiene la sesión abierta.** Se eligió: **entra
sin contraseña**. Toca el botón del correo, ve su cita, y la puede cancelar o mover sin escribir
nada.

Es el mismo trato de confianza que el proyecto ya aceptó en la pieza 9 —quien tiene acceso al correo
puede usar lo que le llegó ahí— y **a propósito es menos poderoso**: el enlace de recuperación cambia
la contraseña de la cuenta entera, y éste alcanza **una** cita. No abre sesión, así que con el código
no hay forma de pedir «mis citas» ni de nombrar otra cita.

**Y no saltea ninguna regla:** los cuatro endpoints del enlace sacan el `clienteId` **de la cita** y
llaman a las **mismas** funciones que la pantalla con sesión, así que la ventana de las 4 horas
(RN-5), la cita pasada (RN-26) y el horario ocupado (RN-1) siguen valiendo sin un solo `if` que lo
diga. El razonamiento entero está en `DISENO.md`, «Decisiones tomadas al construir la pieza 6».

#### Tres cosas que se defienden solas en la presentación

1. **Un borde que el plan no pedía, y que apareció escribiendo la prueba.** La ventana de las 24
   horas se mide con una **distancia**, y una cita de la semana pasada tiene una distancia
   **negativa** — que también es «menos de 24 horas». Sin ese borde, la primera corrida de la tarea
   en producción le habría mandado un recordatorio a **todas las citas viejas de la base**. Lo
   encontró el TDD, no una revisión.
2. **Un defecto que se encontró en la propia prueba, antes de que existiera el código.** El enlace
   iba a ser `#cita=X&hacer=cancelar`, y dentro del HTML de un correo el `&` se escribe `&amp;` — la
   prueba nunca habría pasado. Se cambió a `#cita=X/cancelar` **antes** de escribir una línea.
3. **Un fallo que se eligió a propósito para el lado seguro.** Sin `RECORDATORIOS_SECRETO`
   configurada, el disparador queda **cerrado para todos**, no abierto. De los dos fallos posibles es
   el único aceptable: sin la variable no salen recordatorios y **eso se nota**; abierto no se nota
   hasta que alguien de afuera lo usa. Tiene su prueba.

**El correo no fue parte del problema, como estaba previsto.** Resend está comprobado contra el
servicio real desde la pieza 4, y esta pieza no agregó ningún servicio nuevo: agregó **un momento** en
que se manda un correo que el sistema ya sabía mandar.

### 3. La presentación de la sesión 8

**Y hoy hay bastante más para contar que hace una semana.** Tres cosas de la sesión del 2026-08-28
que se defienden solas, porque las tres muestran el método funcionando y no solo el resultado:

- **Una decisión que se buscó mal tres veces.** El vencimiento del enlace estaba decidido desde el
  11 de agosto y nadie lo encontró; se preguntó de nuevo. No hubo daño —se eligió lo mismo—, pero
  **quedó escrito sin maquillarlo**, y de ahí salió una regla: una regla de negocio con un número va
  en `ESPECIFICACION.md`, no en una tabla de decisiones técnicas.
- **Una regla que la estudiante cambió después de vivirla.** Los 7 días de sesión los había elegido
  ella misma de una lista, sin haberlos visto funcionar. Al vivirlos, los bajó a **4 horas** (RN-29).
  La fila vieja quedó **tachada, no borrada**.
- **El hallazgo 21**, que es de una clase nueva: **un servicio de afuera reescribió nuestro enlace**.
  Ninguna prueba lo podía detectar y las 21 de la pieza estaban en verde. Se arregló con un atributo
  y se confirmó probándolo.

---

## Cómo levantar la aplicación

> **Y desde el 2026-09-05 hay un segundo camino, que para mostrar el proyecto es mejor: no levantar
> nada.** La aplicación está en **https://reservas-bienestar.vercel.app** y funciona desde cualquier
> teléfono. Lo de abajo sigue valiendo para **construir**, que es otra cosa: `npm test` y `npm start`
> funcionan **sin configurar una sola credencial y sin internet**, porque sin la variable
> `TURSO_DATABASE_URL` la aplicación usa el archivo de `datos/` igual que siempre.
>
> ⚠️ **Y no se mezclan.** Las cuentas y las citas de abajo son **las de la computadora**. En el sitio
> publicado hay otras, y son las de la tabla del principio de este documento.

**Lo más rápido es la skill propia del proyecto.** Con Claude Code abierto en la carpeta, escribí
`/launch`: revisa que se pueda arrancar, levanta la aplicación, y **cuenta leyéndolo de la base** qué
cuentas hay y qué se puede mostrar — así no hace falta creerle a la tabla de más abajo, que es una
foto y se pone vieja. Con `/launch limpio` rehace los datos de prueba, avisando primero qué se pierde.

A mano, si se prefiere:

```bash
cd c:\Users\melal\Desktop\claudeCodeCenfotec\cenfotecProyectoFinalCC

npm install     # solo la primera vez en una máquina nueva
npm run estado  # cuenta en qué estado está todo, sin levantar nada
npm start       # levanta la aplicación
```

**http://localhost:3000** — para apagarla, `Ctrl + C`.

> ⚠️ **NO corras `npm run datos`** si querés conservar los datos de prueba de abajo. Ese comando
> rehace la base desde cero y se lleva las cuentas y las citas.

### Lo que hay en la base ahora mismo

> ⚠️ **Esta tabla es una foto del 2026-08-28 y se pone vieja sola.** Para el dato al día, corré
> `/launch` o `npm run estado`. Se deja acá porque tiene una cosa que la skill **no puede** dar: las
> contraseñas de los clientes, que en la base solo están cifradas.

| Cuenta | Entra con | Sirve para |
|---|---|---|
| **Personal** | `personal@ejemplo.com` / `Personal123` | Toda la pieza 7 y toda la 8 |
| **Marisol Prueba** | `marisol@ejemplo.com` / `Marisol99` | Ver el lado del cliente. Tiene varias citas |
| **melalo** | `melalo9@gmail.com` / *(cambiada el 2026-08-28 al probar la pieza 9 — la sabe la estudiante)* | La única a la que **le llegan los correos de verdad** |
| **ana torres** | `ana@ejemplo.com` / **`Nueva456`** | **Su contraseña se conoce desde el 2026-08-28**: se la restableció al correr la comprobación 2 de la pieza 9. Antes era una temporal perdida |
| **Test Recarga** | `test-recarga@ejemplo.com` / `Tortuga381` | La contraseña temporal **sigue sin cambiar**, así que sirve para volver a probar el cambio obligatorio (RF-4) |
| **maria** | `mp@gmail.com` / *(temporal, perdida)* | Tiene la obligación encendida pero su temporal no se puede recuperar. **Se puede recuperar con la pieza 9** si hiciera falta |
| **test** | `prueba-cierre@ejemplo.com` / *(temporal, perdida)* | Creada el 2026-08-24 para una comprobación de la pieza 8. Se puede ignorar |

**Sobre los correos:** con la dirección de pruebas que regala Resend solo llegan a la casilla con la
que se registró la cuenta de Resend. A los `@ejemplo.com` **fallan a propósito** y quedan registrados
como fallidos; la cita se crea igual (RF-19).

> ⚠️ **Y lo que la pieza 9 agregó a esto:** un enlace de recuperación **solo abre en la computadora
> donde la aplicación está corriendo**, porque dice `localhost`. Está declarado en `DISENO.md`.

---

## Dos pendientes chicos, de antes

- ~~La integración continua trae dos avisos amarillos~~ **HECHO el 2026-08-28:** `actions/checkout`
  y `actions/setup-node` pasaron a la **versión 5**. Los avisos desaparecieron y la corrida sigue
  verde en Node 20 y Node 24.
- **El año del pie de página** sigue escrito a mano («2026»). Anotado en `DISENO.md`.
- ~~`SEGUIMIENTO.md` está muy desactualizado~~ **PUESTO AL DÍA el 2026-09-05.**

### Y los que dejó el despliegue (2026-09-05)

- ⚠️ **Juntar `despliegue-vercel-turso` con `main`.** Todo el trabajo del despliegue —y del cambio de
  motor— vive en esa rama. **Conviene hacerlo antes de la entrega**, para que quien mire el
  repositorio vea el trabajo en la rama principal.
- **Un favicon en `publico/`.** El navegador pide `/favicon.ico` solo, no lo encuentra, y eso
  **despierta la función de Vercel por gusto** en cada visita. Hoy no molesta; con la base en la red
  cuesta un viaje de más.
- **Decidir si el sitio publicado necesita datos de demostración.** Hoy tiene el catálogo y dos
  cuentas, pero **ninguna cita**. Para la presentación quizás convenga que haya algo que mostrar.
- **Las casillas de las Etapas 1, 2 y 3 de `PLAN-DESPLIEGUE.md` quedaron sin marcar** — son 27. Las
  etapas se hicieron (están en el historial y el motor está cambiado), pero nadie marcó los pasos. No
  se marcaron a ciegas a propósito: el proyecto no da nada por hecho sin verificarlo.
- **Rotar la clave de Resend, si se quiere.** El 2026-09-05 quedó escrita en una conversación. No es
  grave —sólo puede mandar correos a la casilla de la estudiante— pero se puede generar una nueva en
  Resend y actualizarla en Vercel.

---

## Dos decisiones abiertas que dejó la pieza 9

Las dos están escritas en `DISENO.md` → «Decisiones dejadas abiertas», y **ninguna bloquea nada**:

1. **Si restablecer la contraseña tiene que cerrar las sesiones que ya estaban abiertas.** Hoy no las
   cierra: la galleta firmada no guarda la contraseña, así que no se entera de que cambió. **El
   cambio a 4 horas achicó mucho el problema** —de una semana a media jornada— pero no lo cierra.
2. **Si el velo del fondo quedó como se quiere.** El 2026-08-28 pasó de parejo (25%) a degradado
   (25% arriba, 90% abajo), a pedido de la estudiante. Es un número: se mueve cuando ella quiera.

---

## Las convenciones que hay que seguir respetando

Están completas en el `CLAUDE.md` del repositorio. Las que más se olvidan, **con las cuatro que la
pieza 9 agregó marcadas**:

- **`VISUALS.md` manda sobre la apariencia.** Si un color o una medida no está ahí, no se inventa.
- 🆕 **Una regla de negocio con un número va en `ESPECIFICACION.md`, como RN.** No en una tabla de
  decisiones técnicas, donde nadie la encuentra — y de hecho no se encontró, tres veces.
- 🆕 **Un enlace que sale por correo puede llegar reescrito.** Lleva `ses:no-track`, y la dirección
  va **además como texto suelto**, que es lo único que ningún servicio de afuera puede tocar.
- 🆕 **Qué pantalla se ve lo decide una sola función**, `mostrarSoloEstaPantalla`. Una pantalla nueva
  se agrega a `TODAS_LAS_PANTALLAS` y queda cubierta.
- 🆕 **Volver opcional una columna que ya existe no se puede con `ALTER TABLE`: hay que rehacer la
  tabla**, y comprobarlo antes contra una copia de la base real.
- **Ningún tamaño de letra se escribe en píxeles.** Van todos en `rem`, y los títulos con `clamp()`.
- **`html` lleva un `font-size: 80%` y no se toca.**
- **La hora se escribe con `am`/`pm`**, menos en las fichas de horario del calendario.
- **Mobile-first**, y es verificable: todos los `@media` son `min-width`, ninguno `max-width`.
- **Un permiso es una regla, y va en un solo lugar: `servidor/sesion.js`.**
- **Todo lo que solo abre Personal vive bajo `/api/personal/`.**
- **Si borrar algo pide tocar el dato y la pantalla, las dos cosas van en la misma función.**
- **En la pantalla de Personal ningún texto dice «tu».**
- **Todo campo de contraseña lleva el «ojito»**, y no hay que agregarlo campo por campo: una función
  recorre la página y se lo pone a todos.
- **La hora del negocio es la de Costa Rica**, escrita en `servidor/tiempo.js`.
- **Toda cuadrícula de ancho repartido se escribe `minmax(0, 1fr)`, nunca `1fr` a secas.**
- **Los comandos también hay que correrlos.** `npm test` no ejecuta `npm run datos` ni `npm start`.
- **Una tabla nueva que apunte a otra hay que agregarla al borrado de `guiones/datos-de-prueba.js`, y
  primero de todo.** *(La pieza 9 lo hizo con `token_recuperacion`.)*

---

## Lo que la pieza 9 dejó, para poder defenderla

**Las tres ideas:**

1. **Preguntar de dónde salía un número descubrió un error escrito.** La estudiante preguntó cuándo
   había decidido los 7 días de sesión; la respuesta estaba con fecha y autor, y al buscarla apareció
   que **otro número —el vencimiento del enlace— se había preguntado de nuevo estando ya decidido**.
   Eso es exactamente para lo que sirve documentar las decisiones.
2. **Una regla se puede cambiar después de vivirla, y esa es la mejor razón posible.** Los 7 días se
   eligieron de una lista sin verlos funcionar; las 4 horas se eligieron después de que la aplicación
   la dejara entrar sola dos días seguidos.
3. **El borde del sistema termina antes de lo que uno cree.** El correo que sale del código es
   correcto; el que llega a la bandeja de entrada, no necesariamente.

**El saldo:** un hallazgo, el 21, **de una clase que no había aparecido nunca** —ni visual ni del
código, sino de la frontera con un servicio de afuera— y **arreglado y confirmado el mismo día**.
