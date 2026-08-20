# Próxima sesión — arrancar la pieza 5

*Escrito el 2026-08-19, al final de una sesión larga. Esta es la hoja para retomar sin releer nada.*

---

## Antes que nada: no te queda nada pendiente

**Las piezas 4 y 12 quedaron CERRADAS** el 2026-08-19: sus comprobaciones cumplidas, la integración
continua en verde en Node 20 y Node 24 (confirmada por la estudiante en la pestaña Actions), y la
revisión visual hecha. Todo subido a GitHub.

El recorrido visual de más abajo **ya se pasó**. Se conserva porque es el que hay que volver a pasar
cada vez que una pieza nueva toque estas pantallas — y la pieza 5 las toca.

## Qué se hizo el 2026-08-19 (fue un día largo)

| | |
|---|---|
| **Pieza 4 — el correo de confirmación** | Construida. **La cuenta de Resend está creada y el correo llegó de verdad** a la bandeja de entrada, así que las comprobaciones 1 y 4 del plan quedaron cumplidas. |
| **Pieza 12 — reglas de contraseña y correo** | Pedida y construida el mismo día. Resolvió el pendiente de la pieza 1 sobre el largo mínimo. **Se corrigió tres veces**, las tres mirando la pantalla. |
| **Siete ajustes visuales** | Todos pedidos abriendo el navegador: el aviso de éxito en verde, el texto de guía a 12px, los requisitos escondidos hasta tocar el campo, sin íconos ✓/✗, el logo en el encabezado, el fondo de flores más tenue, y el azul oscuro cambiado en todo el proyecto. **Todos revisados y confirmados en pantalla.** |
| **Pruebas** | `npm test` → **135 y todas pasan.** |
| **Subido a GitHub** | **Todo**, al cierre de la sesión. |

## Lo primero: qué decir cuando abrás la conversación

> La carpeta del día es `proyectoFinal`. Vamos a construir la pieza 5 del plan.

Con eso alcanza. El agente tiene que leer por su cuenta `ESPECIFICACION.md`, `DISENO.md`, la pieza de
`PLAN.md` que corresponda, `VISUALS.md` y el `CLAUDE.md` de la carpeta. **No le expliques el
proyecto**: si no lo entiende leyendo, es que falta algo escrito, y eso es justamente lo que hay que
descubrir.

## Cómo levantar la aplicación y qué mirar

```bash
cd c:\Users\melal\Desktop\cursoCenfotecClaude\proyectoFinal

npm install     # solo la primera vez en una máquina nueva
npm run datos   # crea la base y carga los datos de prueba (con la aplicación apagada)
npm start       # levanta la aplicación
```

**http://localhost:3000**

Para apagarla: `Ctrl + C`.

**El `.env` ya está armado en esta máquina**, con la clave de Resend, la dirección de salida y una
firma de sesión al azar. **No se sube al repositorio** (Git lo ignora), así que en otra máquina hay
que volver a crearlo — el paso a paso está en el `README.md`, «Cómo conseguir la clave de Resend».

Al arrancar **no tiene que salir ningún aviso** sobre el correo. Si sale uno que dice que falta
`RESEND_API_KEY`, es que el `.env` no se está leyendo.

**La base está recién creada, sin ninguna cuenta y sin ninguna cita**, así que lo primero es crearte
una cuenta desde la pantalla «Crear mi cuenta». *(La cuenta de Personal sí viene cargada:
`personal@ejemplo.com` / `Personal123`.)*

> **Registrate con `melalo9@gmail.com`.** Con la dirección de pruebas que regala Resend
> (`onboarding@resend.dev`) **solo se le puede mandar correo a la casilla con la que te registraste
> en Resend**, no a cualquiera. Con otro correo la cita se crea igual, pero el aviso no llega.

### El recorrido a mirar, en orden

*Los pasos 1 a 18 son los mismos de siempre y ya pasaron sin defectos. Se repiten porque la pieza 4
toca el camino de reservar y hay que comprobar que no lo rompió. **Los pasos 19 a 22 son nuevos de
esta pieza.***

**Ojo con la contraseña al registrarte:** desde la pieza 12 tiene reglas. Usá algo como
`Prueba123`. Si escribís `Contraseña123` también sirve (la ñ se permite), pero `óArtolo123` **no**
(las vocales con tilde no se aceptan).

1. **Antes de entrar:** la barra azul de arriba **no** tiene que mostrar las tres rayitas, y el pie
   **no** tiene que mostrar el menú. Aparecen solo con la sesión abierta.
2. **Al entrar:** arriba a la derecha aparecen las tres rayitas (en pantalla de teléfono) o los
   enlaces «Reservar» y «Mis citas» (desde tableta). En el pie, los mismos enlaces más **«Salir»**.
3. **Solo tiene que verse el paso 1.** Los pasos 2 y 3 no se muestran hasta que elijas.
4. **El paso 1 muestra categorías**, no servicios: «Masaje» (dice «3 tipos») y «Facial» (dice
   «Limpieza facial», porque tiene uno solo).
5. **Tocá «Masaje»**: aparece un paso nuevo, **«Elegí el tipo de masaje»**, con los tres. Elegí
   «Masaje relajante» → **«Ana»**, y tocá el día de mañana en el calendario.
6. **Fijate en los números de los pasos:** tienen que ir 1, 2, 3, 4 seguidos.
7. **Después probá «Facial»**, que tiene un solo servicio: el paso del tipo **no tiene que aparecer**
   y se pasa directo a los proveedores (Ana y Luisa). Los números vuelven a ir 1, 2, 3 seguidos.
8. **Tocá el horario de las 10:00.** Tiene que quedar pintado en índigo sólido, y abajo tiene que
   aparecer la tarjeta **«Confirmá tu reserva»** con el servicio, quién te atiende, el día y la hora.
9. **Tocá «Confirmar la reserva».** La pantalla tiene que cambiar sola a **«Mis citas»**, con el
   aviso «Tu cita quedó reservada» y la cita en la lista.
10. **Volvé a «Reservar» desde el menú** y abrí el mismo día: las 10:00 tienen que aparecer en azul
    marino con la letra blanca y la hora tachada.
11. **Reservá también las 14:00.** En «Mis citas» tienen que quedar las dos, ordenadas por hora.
12. **Tocá el día de hoy en el calendario:** no tiene que ofrecer ningún horario, solo el mensaje de
    que no se puede reservar para hoy y a qué número llamar.
13. **En pantalla angosta** (angostá la ventana del navegador): que nada se salga de su tarjeta, que
    las tres rayitas abran y cierren el menú, y que las fichas de horario queden alineadas.
14. **Abrí «Usuario»** desde el menú: se ven tu nombre y tu correo, y el teléfono, la edad y «cliente
    desde» dicen «Sin completar» (o la fecha de tu primera cita, si ya reservaste).
15. **Tocá «Completar o corregir mis datos»**: se abre un formulario con tu nombre ya cargado.
16. **Escribí el teléfono `88887777` sin guión** y elegí una fecha de nacimiento, y guardá: el
    teléfono tiene que mostrarse **`8888-7777`** y la edad tiene que aparecer en años.
17. **Probá que rechace lo que está mal:** un teléfono de 7 dígitos y una fecha de nacimiento del
    futuro. Los dos tienen que dar un mensaje que diga **qué** dato está mal.
18. **El correo no se puede cambiar:** en el formulario no hay campo de correo.

### Lo nuevo de la pieza 4

19. **Lo más importante primero — que reservar siga siendo rápido.** Al tocar «Confirmar la reserva»
    (paso 9), la pantalla tiene que pasar a «Mis citas» **sin quedarse pensando**. Desde esta pieza,
    antes de contestar, el servidor intenta mandar el correo. Si notás que el botón tarda varios
    segundos, **decilo**: puede que el límite de espera de 5 segundos esté quedando corto o largo.

20. **Que la cita se cree aunque el correo no salga.** Es la regla RF-19, y es la más importante de
    esta pieza. **Si todavía no tenés la clave de Resend, ya la estás probando**: reservaste en el
    paso 9 sin clave, y la cita apareció igual. Mirá la consola donde corre `npm start`: por cada
    reserva tiene que haber un aviso que dice
    `Aviso: falló el envío de un correo a tu@correo.com — No hay ningún servicio de correo configurado`.
    **Ese aviso es la prueba de que la regla funciona**, no un problema.

21. **Que el envío haya quedado anotado.** Cada intento de correo deja una fila en la tabla
    `correo_enviado`, salga bien o mal. Es lo que pide REG-3. Si querés mirarla, pedíselo al agente:
    tiene que mostrarte una fila por cada cita que reservaste, con `tipo = confirmacion`, el número
    de la cita, y `exito` en 0 (sin clave) o en 1 (con clave).

22. **Con la clave de Resend puesta — que el correo llegue.** Esto es lo que cierra las
    comprobaciones 1 y 4 del plan:
    - Poné la clave en el `.env` (ver `README.md`), apagá la aplicación con `Ctrl + C` y volvé a
      levantarla con `npm start`. **El aviso amarillo del correo tiene que desaparecer.**
    - Reservá una cita y **abrí tu bandeja de entrada**. Tiene que llegar un correo con el asunto
      «Tu reserva quedó confirmada» y la fecha y la hora.
    - **Revisá que el correo diga los cinco datos**, que es lo que exige RF-11: el **servicio**, **quién
      te atiende**, el **día escrito en palabras** («miércoles 2 de setiembre de 2026»), la **hora**, y
      la **ubicación del negocio**. Más abajo tiene que estar el **teléfono** para llamar.
    - **Mirá cómo se ve:** encabezado azul marino, tarjeta blanca, y una línea índigo a la izquierda
      de los datos. Si algo se ve roto o desalineado, mandá una captura.
    - *(Si no llega, revisá primero la carpeta de correo no deseado, y después la consola de
      `npm start`: ahí queda escrito el motivo exacto que devolvió Resend.)*

### Y lo que hay que mirar de la pieza 12 y de los ajustes visuales

23. **El encabezado.** Tiene que verse el **logo de la flor** a la izquierda, y al lado
    **«Bienestar y salud»** grande con **«RESERVAS EN LÍNEA»** chiquito abajo. Todo sobre el azul
    nuevo `#2f3367`.
24. **El fondo.** Las flores tienen que verse **más tenues** que antes, sin competir con el
    contenido.
25. **En «Crear mi cuenta», los requisitos de la contraseña:**
    - Al abrir la pantalla **no se ven**.
    - Al hacer clic en el campo **aparecen los tres, en gris**.
    - Escribiendo, van a **verde** o **rojo** — **sin ningún ícono**, solo el color.
    - Tienen que estar **alineados con el borde izquierdo del campo**.
    - Si borrás todo y hacés clic afuera, **desaparecen**.
26. **Probá que rechace lo que está mal:** `abc` (corta, sin mayúscula, sin número) y
    `óArtolo123` (tiene tilde). El mensaje tiene que decir **qué** falta, no «revisá el formulario».
27. **Probá que acepte `Contraseña123`:** la ñ **sí** se permite. Y `Prueba123` también.
28. **El correo mal escrito:** escribí `ana@ejemplo` y salí del campo. Tiene que avisarte. *(Se
    revisa al salir del campo, no en cada tecla, a propósito.)*
29. **Reservá una cita y mirá tu Gmail.** El correo tiene que llegar con el **encabezado en el azul
    nuevo**, y con los cinco datos: servicio, quién te atiende, día en palabras, hora y ubicación.
30. **El aviso de «Tu cita quedó reservada» tiene que ser VERDE**, no rojo. Es lo que estaba mal y
    se arregló.

Si algo se ve mal, decilo con una captura de pantalla: así salieron **todos** los defectos visuales
de este proyecto — que a esta altura son siete.

## Dónde quedó todo

| | |
|---|---|
| **Pieza 1** | **Cerrada** el 2026-08-17. Evidencia fechada en `PLAN.md`. |
| **Pieza 2** | **Cerrada** el 2026-08-19. |
| **Pieza 3** | **Cerrada** el 2026-08-19, con sus 7 comprobaciones y la revisión visual. |
| **Pieza 10** | **Cerrada** el 2026-08-19, construida fuera de orden. |
| **Pieza 11** | **Cerrada** el 2026-08-19, construida fuera de orden. Corrigió RF-5 de la pieza 2. |
| **Pieza 4** | **Cerrada** el 2026-08-19. Sus 4 comprobaciones cumplidas —el correo llegó de verdad a la bandeja de entrada— y la revisión visual hecha. |
| **Pieza 12** | **Cerrada** el 2026-08-19, fuera del plan original. Resolvió el pendiente de la pieza 1 sobre el largo mínimo de la contraseña. Sus 8 comprobaciones cumplidas. |
| **Pieza 5** | La que sigue: «Cancelar y reagendar». Trae **CA-3**. |
| **Subido a GitHub** | **Todo**, incluidas las piezas 4 y 12 y los ajustes visuales. |
| **Tiempo** | **9 horas por semana.** Hasta la entrega del 8 de setiembre quedan unas **22 horas**. |
| **Pruebas** | `npm test` → hoy son **135** y todas pasan. Corren solas en cada push. |

## Qué trajo la pieza 4, en tres frases

Al confirmarse una reserva, al cliente le llega un correo con la fecha, la hora, el servicio, el
proveedor y la ubicación del negocio (RF-11), y cada envío queda anotado en la tabla nueva
`correo_enviado`, haya salido bien o mal (REG-3). Es la primera pieza que habla con un servicio de
afuera, y por eso la regla que la manda es que **un correo que falla nunca invalida una cita**
(RF-19): la cita se guarda primero, el correo se manda después, y si no sale, se anota y se sigue.
Nacieron tres archivos —`servidor/correo.js`, `servidor/plantillas-de-correo.js` y
`servidor/enviador-resend.js`— y no se instaló ninguna dependencia nueva.

**La idea que hay que entender para defender esta pieza:** el enviador de correo **entra como dato**,
exactamente igual que el reloj. La aplicación no sabe mandar correos — recibe una función que los
manda y la llama. En `npm start` esa función habla con Resend; en las pruebas es una de mentira que
los guarda en una lista. Por eso **`npm test` no le manda un correo a nadie** y la integración
continua no necesita ninguna clave secreta.

## Lo que la pieza 5 se encuentra ya hecho

1. **El correo ya está resuelto**, con su plantilla, su registro y su reintento. Las piezas 6 y 9 lo
   reutilizan sin escribir nada de eso otra vez.
2. **`GET /api/citas` ya devuelve las citas del cliente** con los nombres del servicio y del
   proveedor, y **no filtra por estado** a propósito: las canceladas también van a salir.
3. **La tabla `cita` ya tiene las columnas `cancelada_en` y `cancelada_por`**, vacías, esperando a
   esta pieza.
4. **El candado de CA-1 mira solo las citas activas**, así que cancelar libera el horario de
   inmediato (RN-7) sin tocar nada del índice.
5. **`servidor/tiempo.js` ya tiene casi todas las cuentas de fechas** que la regla de las 4 horas va
   a necesitar.

Lo delicado de la pieza 5, anotado de antemano: **reagendar libera un horario y toma otro en un solo
movimiento**, y tiene que convivir con el candado de la pieza 3.

## Las convenciones que hay que seguir respetando

Están completas en el `CLAUDE.md` de la carpeta. Las que más se olvidan:

- **`VISUALS.md` manda sobre la apariencia.** Si un color o una medida no está ahí, no se inventa.
- **Mobile-first**, y es verificable: todos los `@media` son `min-width`, ninguno `max-width`.
- **La hora del negocio es la de Costa Rica**, escrita en `servidor/tiempo.js`, nunca la de la
  máquina. Y un momento se escribe siempre `2026-09-02T10:00:00-06:00`.
- **Toda cuadrícula de ancho repartido se escribe `minmax(0, 1fr)`, nunca `1fr` a secas.**
- **Una regla de negocio se escribe en un solo lugar del servidor**, y quien la necesite la llama.
- **Ninguna dependencia puede exigir más que Node 20**, y la integración continua lo comprueba.
- **Los comandos también hay que correrlos.** `npm test` no ejecuta `npm run datos` ni `npm start`, y
  en la pieza 4 los dos tuvieron un defecto que ninguna prueba podía ver.
- **Una tabla nueva que apunte a otra hay que agregarla al borrado de `guiones/datos-de-prueba.js`**,
  y primero de todo: la base tiene las llaves foráneas encendidas.

## Cuánto falta

*Estimado el 2026-08-19, después de construir la pieza 4. Se calibró con lo que de verdad tardaron
las piezas 1, 2 y 3 (~5 h cada una), la 10 y la 11 (~1 h cada una) y la 4.*

| Pieza | Estimado | Por qué |
|---|---|---|
| **8** — Personal cierra las citas pasadas | **~2 h** | La más corta. Dos endpoints, ninguna tabla nueva, y reusa la pantalla de Personal que construye la 7. |
| **9** — Restablecer la contraseña | **~3 h** | Una tabla nueva y dos pantallas chicas. Es corta **porque el correo ya lo resolvió la pieza 4**: solo hay que agregar una plantilla más. |
| **5** — Cancelar y reagendar | **~4-5 h** | Larga, y es **núcleo comprometido** en `FICHA-APROBACION.md`. Trae la regla de las 4 horas y **CA-3**. |
| **7** — Personal atiende el teléfono | **~5-6 h. La más larga.** | Es casi una segunda aplicación, para otro tipo de usuario. Tiene **10 comprobaciones**. |
| **6** — Recordatorio de 24 h | **~5 h, y está trabada** | Ver la sección siguiente. |

**El total, sin la pieza 6: unas 15 horas.** Más **~4 horas** de la skill propia del curso y la
presentación: **~19 de las 22 que quedan**. Con la pieza 6 serían 24 y **no entra** — que es
exactamente lo que `FICHA-APROBACION.md` anticipó al marcarla como la primera en recortar.

**El orden recomendado: 5 → 7 → 8 → 9, y la 6 al final, si sobra tiempo.** La 8 es corta **solo si**
la pantalla de Personal de la 7 ya existe.

## La pieza 6 sigue trabada por una decisión abierta

Su plan dice que una tarea programada de GitHub Actions llama al backend. Pero la aplicación corre en
`http://localhost:3000`, que quiere decir «esta computadora»: **GitHub no puede llamar a tu
computadora**. No hay clave ni configuración que lo arregle.

Y la salida —alojar la aplicación en un servidor público— es una decisión que `DISENO.md` dejó
**explícitamente abierta**. Tres caminos, y la elección es tuya:

1. **Recortarla**, que es lo que la ficha ya anticipaba.
2. **Alojar la aplicación** en algún servicio gratuito. Suma tiempo aparte del de la pieza.
3. **Adaptarla:** construir el endpoint y su regla completos, con sus pruebas, y disparar la revisión
   **a mano**. Se cumplirían 7 de sus 8 comprobaciones; la 8 quedaría anotada como no cumplida.

## Lo que quedó sin decidir

- **Los paquetes de sesiones y los tratamientos activos** siguen fuera de alcance: son PA-1,
  bloqueado por PA-2. Lo que falta decidir **no es técnico** — es quién dice que alguien compró un
  paquete y cómo se descuenta una sesión. El camino, cuando lo decidas, es el mismo de las piezas 10
  y 11: escribirlo primero en `ESPECIFICACION.md` y en `PLAN.md`, y después construirlo.

## Dos pendientes chicos

- **La integración continua trae dos avisos amarillos:** `actions/checkout@v4` y
  `actions/setup-node@v4` apuntan a un Node que GitHub está jubilando **como motor de sus propias
  herramientas**. No tiene nada que ver con la promesa de Node 20 de este proyecto y no rompe nada.
  Conviene subirlas a la versión 5 cuando haya un rato: un aviso que aparece siempre enseña a
  ignorar los avisos.
- **El año del pie de página** sigue escrito a mano («2026»). Anotado en `DISENO.md`.

## Lo que sigue pendiente del curso (no del sistema)

- **La skill propia de arranque** que pide la rúbrica. No es una vertical slice porque no es un
  requisito del sistema: está en «Fuera del plan» de `PLAN.md` y anotada en `SEGUIMIENTO.md`.
- **Preparar la presentación** de la sesión 8.
