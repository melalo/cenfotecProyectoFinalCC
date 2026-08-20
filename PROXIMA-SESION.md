# Próxima sesión — arrancar la pieza 7

*Escrito el 2026-08-20, al terminar de construir la pieza 5. Esta es la hoja para retomar sin releer
nada.*

---

## Antes que nada: no te queda nada pendiente

**La pieza 5 quedó CERRADA** el 2026-08-20: sus 8 comprobaciones del plan más 2 que se agregaron
cubiertas por pruebas automáticas (`npm test` da **174 de 174**), y **la revisión visual hecha y
terminada**. Todo subido a GitHub.

Con eso **el núcleo comprometido en `FICHA-APROBACION.md` está completo** y **los tres criterios de
aceptación están cubiertos por pruebas que corren en cada push**.

El recorrido visual de más abajo **ya se pasó**. Se conserva porque es el que hay que volver a pasar
cada vez que una pieza nueva toque estas pantallas — y **la pieza 7 las toca**, porque construye la
versión de Personal de casi todo esto.

## Qué se hizo el 2026-08-20

| | |
|---|---|
| **Pieza 5 — cancelar y reagendar** | Construida. **39 pruebas nuevas; `npm test` da 174 de 174.** Trae **CA-3**, así que **los tres criterios de aceptación ya están cubiertos**. |
| **El núcleo, completo** | Con esta pieza el prototipo hace el recorrido entero que `FICHA-APROBACION.md` comprometió: entrar → elegir → calendario → reservar → correo → cancelar o reagendar. |
| **Tres decisiones tuyas** | Reagendar reusa la pantalla de reservar; al reagendar sí llega el correo con la fecha nueva (esto **corrigió RF-11**); cancelar pregunta antes. |
| **Sin archivos nuevos ni dependencias nuevas** | Todo entró en los archivos que ya existían. |
| **Documentos corregidos** | `ESPECIFICACION.md` (RF-11 y RF-14), `PLAN.md` (el bloque *Produce*, dos comprobaciones más, la evidencia, y la tabla de piezas que tenía la 4 mal), `DISENO.md`, `CLAUDE.md`, `README.md`, `BITACORA.md` y `SEGUIMIENTO.md`. |
| **Un defecto visual encontrado y corregido** | Una cita que ya pasó decía «faltan menos de 4 horas». Ahora dice que ya pasó y a qué número llamar. **Los endpoints y CA-3 no cambiaron.** |
| **Y algo más grave: el código no cumplía el plan** | «Mis citas» mostraba todo mezclado, cuando el plan dice en tres lugares «el cliente ve sus **citas activas**». Ahora son **dos secciones**: «Tus próximas citas» y «Historial». Lo encontró la estudiante preguntando por qué la cita cancelada seguía ahí. |
| **Un tercer hallazgo visual** | La etiqueta decía ACTIVA en una cita del mes pasado. Ahora **la etiqueta aparece solo cuando algo le pasó a la cita**; una cita pasada que nadie cerró no lleva ninguna. No dice «COMPLETADA» porque RN-17 dice que eso **solo** lo marca Personal. |
| **Cambio de vocabulario** | Al cliente se le dice **«terapista»**, no «te atiende» ni «proveedor». Siete lugares de texto. **La base y el API siguen diciendo `proveedor`**, a propósito. |
| **Subido a GitHub** | **Todo**, al cierre de la sesión. |

## Lo que hay que decir al abrir la conversación

> La carpeta del día es `proyectoFinal`. Vamos a construir la pieza 7 del plan.

Con eso alcanza. El agente tiene que leer por su cuenta `ESPECIFICACION.md`, `DISENO.md`, la pieza de
`PLAN.md` que corresponda, `VISUALS.md` y el `CLAUDE.md` de la carpeta. **No le expliques el
proyecto**: si no lo entiende leyendo, falta algo escrito, y eso es justamente lo que hay que
descubrir.

## Cómo levantar la aplicación

```bash
cd c:\Users\melal\Desktop\cursoCenfotecClaude\proyectoFinal

npm install     # solo la primera vez en una máquina nueva
npm run datos   # crea la base y carga los datos de prueba (con la aplicación APAGADA)
npm start       # levanta la aplicación
```

**http://localhost:3000**

Para apagarla: `Ctrl + C`.

> **Ojo con `npm run datos`:** borra el archivo de la base, y Windows no deja borrar un archivo que
> otro programa tiene abierto. **Si `npm start` está corriendo, el comando falla y te lo explica.**
> El 2026-08-20 pasó exactamente eso: había quedado una aplicación levantada de la sesión anterior.
> Apagala con `Ctrl + C` primero.

**El `.env` ya está armado en esta máquina**, con la clave de Resend. **No se sube al repositorio**
(Git lo ignora), así que en otra máquina hay que volver a crearlo — el paso a paso está en el
`README.md`.

Al arrancar **no tiene que salir ningún aviso** sobre el correo. Si sale uno que dice que falta
`RESEND_API_KEY`, el `.env` no se está leyendo.

**Si corrés `npm run datos`, la base queda sin ninguna cuenta y sin ninguna cita**, así que lo primero
es crearte una desde «Crear mi cuenta». *(La de Personal sí viene cargada:
`personal@ejemplo.com` / `Personal123`.)*

> **Registrate con `melalo9@gmail.com`.** Con la dirección de pruebas que regala Resend
> (`onboarding@resend.dev`) **solo se le puede mandar correo a la casilla con la que te registraste
> en Resend**. Con otro correo la cita se crea igual, pero el aviso no llega.
>
> **Y ojo con la contraseña:** desde la pieza 12 tiene reglas. Usá algo como `Prueba123`.
> `Contraseña123` también sirve (la ñ se permite), pero `óArtolo123` **no** (las vocales con tilde no
> se aceptan).

---

## El recorrido visual de la pieza 5, en orden

*Para llegar acá hace falta tener al menos una cita reservada. Los pasos 1 a 3 la crean.*

### Preparar el terreno

1. **Reservá una cita** para dentro de varios días: «Masaje» → «Masaje relajante» → «Ana» → un día
   hábil del calendario → un horario → «Confirmar la reserva». La pantalla tiene que pasar sola a
   «Mis citas» con el aviso **verde**.
2. **Reservá una segunda cita**, otro día, para poder practicar sin quedarte sin ninguna.
3. **Mirá cómo quedó la pantalla.** Son **dos secciones**: arriba **«Tus próximas citas»** y abajo
   **«Historial»** (esta última **solo aparece si hay algo que poner adentro**). Cada cita de arriba
   tiene, **debajo de sus datos y ocupando el ancho completo**, dos botones chicos: **«Reagendar»** y
   **«Cancelar»**. Tienen que verse como botones de apoyo —chicos, con borde índigo y letra índigo—,
   no como el botón grande de «Confirmar la reserva».
3 ter. **Mirá las etiquetas y la palabra nueva.** En el historial, la cita **cancelada** lleva su
   etiqueta CANCELADA, pero las que **solo pasaron** no llevan **ninguna** — ya no dicen ACTIVA. Y en
   todas las citas, debajo del servicio, tiene que decir **«Terapista Ana»**, no «Te atiende Ana».
   *La palabra también cambió en el paso de elegir («Elegí tu terapista»), en la tarjeta de confirmar
   y en el correo.*
3 bis. **Comprobá que nada esté en la sección equivocada.** En «Tus próximas citas» solo va lo que
   todavía no pasó y está activa. Todo lo demás —canceladas y citas viejas— va en «Historial», de lo
   **más reciente a lo más viejo**. *Ojo con un caso: una cita de **hoy en dos horas** va arriba, en
   las próximas, aunque no tenga botones. Es la más urgente que tenés; si aparece en el historial, es
   un defecto.*

### Cancelar, que es lo que más importa mirar

4. **Tocá «Cancelar»** en una de ellas. Los dos botones tienen que **desaparecer y ser reemplazados,
   en la misma fila**, por la pregunta *«¿Seguro que querés cancelar esta cita? Ese horario queda
   libre para otra persona.»* y dos botones: **«Sí, cancelarla»** (azul, lleno) y **«No, dejarla»**
   (con borde). **No tiene que abrirse ninguna ventana emergente del navegador.**
5. **Tocá «No, dejarla».** Tiene que volver todo a como estaba, con los dos botones de siempre, y la
   cita **sigue activa**. *(Esta es la comprobación 10 del plan.)*
6. **Ahora sí: «Cancelar» → «Sí, cancelarla».** Tienen que pasar tres cosas:
   - un aviso **verde** que dice «Tu cita quedó cancelada, y ese horario vuelve a estar libre»,
   - la cita **se va de «Tus próximas citas» y aparece arriba del «Historial»**, con la etiqueta
     **CANCELADA** en vez de ACTIVA — no se borra nunca (RN-15), se muda de sección,
   - y **sin botones**: una cita cancelada no se cancela otra vez.
7. **Andá a «Reservar»** y abrí ese mismo día: **el horario que cancelaste tiene que estar libre otra
   vez** (blanco con borde índigo, no azul marino tachado). Es RN-7, y es la comprobación 2.

### Reagendar

8. **Tocá «Reagendar»** en la cita que te queda activa. Tiene que pasar a la pantalla de reservar,
   pero **distinta**:
   - arriba, un **cartel lavanda** que dice **«Estás moviendo una cita»**, con el servicio, quién te
     atiende y cuándo es hoy, más la aclaración de que el servicio y la persona no cambian, y un
     botón **«Dejarla como está»**;
   - **los pasos de «Elegí qué buscás», «Elegí el tipo» y «Elegí quién te atiende» NO tienen que
     aparecer.** Esto es la comprobación 5 del plan: reagendar no puede cambiar el servicio ni el
     proveedor (RN-18);
   - el calendario sí, con el número de paso **1**.
9. **Abrí el día en que está tu cita.** El horario que ya tenés sale en azul marino tachado —está
   ocupado, por tu propia cita— pero **con un contorno índigo alrededor**, y si le pasás el mouse
   dice **«Es el horario que ya tenés»**, no «No disponible».
10. **Tocá otro horario libre, de otro día.** La tarjeta de abajo tiene que decir **«Mové tu cita a
    este horario»** (no «Confirmá tu reserva»), con **cinco** filas: Servicio, Te atiende, **«Ahora
    es»** (el día y la hora de hoy), **«Pasa a»** (el día nuevo) y Hora. Y el botón grande tiene que
    decir **«Mover la cita»**.
11. **Tocá «Mover la cita».** Tiene que pasar sola a «Mis citas», con un aviso **verde** que dice
    «Tu cita quedó movida», y la cita en su **día nuevo**, todavía ACTIVA.
12. **Volvé a «Reservar»** y comprobá las dos cosas de la comprobación 4: **el horario viejo está
    libre** y **el nuevo está ocupado**.
13. **Probá «Dejarla como está»:** tocá «Reagendar» de nuevo y después ese botón. Tiene que volver a
    «Mis citas» **sin haber cambiado nada**.
14. **Probá el menú a mitad de camino:** tocá «Reagendar» y, sin elegir nada, tocá **«Reservar»** en
    el menú de arriba. El cartel lavanda tiene que **desaparecer** y los tres pasos de elegir tienen
    que **volver a aparecer**. Si el cartel se queda, decilo: sería un defecto.

### El correo

15. **Abrí tu bandeja de entrada.** Del paso 11 tiene que haber llegado un correo de confirmación con
    **el día y la hora nuevos**, escritos en palabras. *(Comprobación 9.)*
16. **Que no diga el día viejo.** Es exactamente el problema que este correo existe para evitar.
17. **De la cancelación NO tiene que llegar ningún correo.** Eso es a propósito: la especificación no
    pide ninguno, y quien canceló acaba de verlo en pantalla.

### La regla de las 4 horas (CA-3), que no se puede probar desde la pantalla

18. Para verla hace falta una cita que empiece **hoy dentro de un rato**, y la aplicación **no deja
    crear citas para hoy** (RN-4). **Pedíselo al agente:** que inserte una a mano en la base, como
    hacen las pruebas, y después mirá la lista. Esa cita tiene que aparecer **sin botones**, y en su
    lugar una nota de una línea que dice que faltan menos de 4 horas y **a qué número llamar**.
19. **Y una cita que YA PASÓ tiene que decir otra cosa:** «Esta cita ya pasó. Para modificarla o
    cancelarla, llamá al negocio al…». *Acá salió el octavo defecto visual del proyecto, el
    2026-08-20: decía «faltan menos de 4 horas» de una cita de la mañana, a mediodía. Si volvés a ver
    esa frase debajo de una cita pasada, es que la corrección se perdió.*
20. *(Las tres pruebas automáticas marcadas `CA-3` ya comprueban que el servidor rechaza el intento
    con `422` aunque alguien se saltee la pantalla. Eso ya está en verde.)*

### En pantalla angosta

21. **Angostá la ventana del navegador** hasta el ancho de un teléfono y volvé a mirar «Mis citas»:
    que los botones **no se salgan** de la tarjeta, que la pregunta de confirmar se lea completa, y
    que la nota de las 4 horas no desborde.

**Si algo se ve mal, decilo con una captura.** Así salieron los **doce** defectos visuales de este
proyecto, ninguno de una prueba automática. Solo de la revisión de la pieza 5 salieron **cinco**, y
tres de ellos no eran de apariencia: eran defectos de **lo que la aplicación decía**.

---

## Dónde quedó todo

| | |
|---|---|
| **Piezas 1, 2, 3, 4, 10, 11 y 12** | **Cerradas.** Evidencia fechada en `PLAN.md`. |
| **Pieza 5** | **Cerrada el 2026-08-20**, con la revisión visual hecha. |
| **Pieza 7** | La que sigue: «Personal atiende el teléfono». **La más larga: ~5-6 h, y tiene 10 comprobaciones.** |
| **Pieza 8** | Después: «Personal cierra las citas pasadas». ~2 h, **corta solo porque la 7 ya hizo su pantalla**. |
| **Pieza 9** | «Restablecer la contraseña». ~3 h, corta porque el correo ya está resuelto. |
| **Pieza 6** | «Recordatorio de 24 h». **Sigue trabada** — ver más abajo. |
| **Tiempo** | **9 horas por semana.** Hasta la entrega del 8 de setiembre quedan unas **22 horas**. |
| **Pruebas** | `npm test` → **174** y todas pasan. Corren solas en cada push, en Node 20 y Node 24. |

**El total de lo que falta, sin la pieza 6: unas 10 horas**, más **~4** de la skill propia del curso y
la presentación: **~14 de las 22**. Con la pieza 6 serían 19, así que **ahora sí entraría en tiempo** —
lo que la frena no es el reloj, es la decisión de abajo.

## Qué trajo la pieza 5, en tres frases

El cliente puede cancelar su cita o moverla a otro horario si faltan **4 horas o más** (RF-13, RF-14),
y el intento hecho dentro de esas 4 horas se rechaza con el mensaje de llamar al negocio (RF-15,
RN-5) — que es **CA-3**, el último de los tres criterios que el curso exige proteger con pruebas.
Cancelar **no borra nada**: la cita cambia de estado y guarda cuándo y quién la canceló (RN-15,
REG-1), y su horario queda libre en el mismo instante para cualquier otra persona (RN-7). Reagendar
cambia **únicamente la fecha y la hora** (RN-18) y le manda al cliente el correo de confirmación con
los datos nuevos.

**Las dos ideas que hay que entender para defender esta pieza:**

1. **Cancelar libera el horario sin una sola línea de código que libere nada.** El candado de la base
   que impide dos citas a la misma hora es **parcial**: solo vigila las citas *activas*. Así que dejar
   de estar activa **es** dejar de ocupar. Eso lo dejó puesto la pieza 3 sin saber cómo se iba a
   construir la 5.
2. **Mover una cita es un solo movimiento, no dos.** Suena a «liberar el viejo y tomar el nuevo», y en
   realidad es la misma fila de la misma cita cambiando su columna `inicio`. Eso hace **imposible** el
   estado intermedio que daría miedo —la cita sin horario, o con los dos— sin ningún cuidado especial.

## Lo que la pieza 7 se encuentra ya hecho

1. **La regla de la ventana de 4 horas ya está escrita**, en `revisarSiSePuedeCambiar` de
   `servidor/reservas.js`. La pieza 7 la llama con `QUIEN_PERSONAL` y la regla se saltea sola (RN-6):
   **eso es la otra mitad de CA-3, y no hay que escribir la regla otra vez.**
2. **`cancelarCita` y `reagendarCita` ya reciben `quien`**, y la búsqueda de la cita ya sabe que
   Personal ve las citas de cualquiera mientras un cliente solo las suyas.
3. **`crearCitaYConfirmar` es la función que Personal va a llamar para reservar** en nombre de quien
   llama: manda el correo sola, así que la 7 no tiene que acordarse.
4. **Las reglas de la contraseña ya están en un solo lugar** (`servidor/credenciales.js`, pieza 12),
   que es lo que la 7 necesita para crear cuentas con contraseña temporal (RN-11).
5. **La columna `personal_id_creador` y el canal `asistida` ya existen** en la tabla `cita`, vacíos.

Lo delicado de la pieza 7, anotado de antemano: es **casi una segunda aplicación**, para otro tipo de
usuario, y tiene **10 comprobaciones**.

## Las convenciones que hay que seguir respetando

Están completas en el `CLAUDE.md` de la carpeta. Las que más se olvidan:

- **`VISUALS.md` manda sobre la apariencia.** Si un color o una medida no está ahí, no se inventa.
- **Mobile-first**, y es verificable: todos los `@media` son `min-width`, ninguno `max-width`.
- **La hora del negocio es la de Costa Rica**, escrita en `servidor/tiempo.js`, nunca la de la
  máquina. Y un momento se escribe siempre `2026-09-02T10:00:00-06:00`.
- **Toda cuadrícula de ancho repartido se escribe `minmax(0, 1fr)`, nunca `1fr` a secas.**
- **Una regla de negocio se escribe en un solo lugar del servidor**, y quien la necesite la llama.
- **El frontend no decide reglas de negocio**, y no solo *si* algo se permite: también *por qué*. Cada
  día del calendario trae su `estado`; cada cita trae `sePuedeCambiar` y `porQueNo`.
- **Todo campo de contraseña lleva el «ojito»**, sin excepción. Lo pone solo
  `agregarOjitoATodasLasContrasenas()`, así que una pantalla nueva lo hereda.
- **Ninguna dependencia puede exigir más que Node 20**, y la integración continua lo comprueba.
- **Los comandos también hay que correrlos.** `npm test` no ejecuta `npm run datos` ni `npm start`.
- **Una tabla nueva que apunte a otra hay que agregarla al borrado de `guiones/datos-de-prueba.js`**,
  y primero de todo: la base tiene las llaves foráneas encendidas.

## La pieza 6 sigue trabada por una decisión abierta

Su plan dice que una tarea programada de GitHub Actions llama al backend. Pero la aplicación corre en
`http://localhost:3000`, que quiere decir «esta computadora»: **GitHub no puede llamar a tu
computadora**. No hay clave ni configuración que lo arregle.

Y la salida —alojar la aplicación en un servidor público— es una decisión que `DISENO.md` dejó
**explícitamente abierta**. Tres caminos, y la elección es tuya:

1. **Recortarla**, que es lo que `FICHA-APROBACION.md` ya anticipaba.
2. **Alojar la aplicación** en algún servicio gratuito. Suma tiempo aparte del de la pieza.
3. **Adaptarla:** construir el endpoint y su regla completos, con sus pruebas, y disparar la revisión
   **a mano**. Se cumplirían 7 de sus 8 comprobaciones; la 8 quedaría anotada como no cumplida.

*Novedad del 2026-08-20: en tiempo **ahora sí entra**. Lo que la frena es solo esta decisión.*

## Lo que quedó sin decidir

- **Los paquetes de sesiones y los tratamientos activos** siguen fuera de alcance: son PA-1,
  bloqueado por PA-2. Lo que falta decidir **no es técnico** — es quién dice que alguien compró un
  paquete y cómo se descuenta una sesión. El camino, cuando lo decidas, es el mismo de las piezas 10,
  11 y 12: escribirlo primero en `ESPECIFICACION.md` y en `PLAN.md`, y después construirlo.

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
