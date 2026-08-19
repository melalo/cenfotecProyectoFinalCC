# Próxima sesión — confirmar Actions y arrancar la pieza 4

*Escrito el 2026-08-19, al terminar de construir la pieza 3. Esta es la hoja para retomar sin releer
nada.*

---

## Antes que nada: queda UNA sola cosa pendiente

El 2026-08-19 se construyeron **tres piezas**: la **3** (reservar un horario, la que tocaba según el
plan), la **10** (la sección «Usuario») y la **11** (las categorías de servicio). Las dos últimas no
estaban en el plan original: se pidieron ese día, se escribieron primero en `ESPECIFICACION.md` y
`PLAN.md` —con sus requisitos, sus reglas y sus comprobaciones— y solo después se construyeron. La 11
además **corrigió RF-5**, que era de la pieza 2, ya cerrada.

Ese mismo día la estudiante hizo **la revisión visual de las tres** y no salió ningún defecto, así
que:

- **Las piezas 10 y 11 quedaron CERRADAS.**
- **La pieza 3 quedó con 6 de sus 7 comprobaciones cerradas.**
- **El push se hizo**: las piezas 2, 3, 10 y 11 subieron juntas, más la configuración de integración
  continua en la raíz del repositorio.

**Lo único que falta es la comprobación 7 de la pieza 3**, que dice: «hacer un push al repositorio y
ver, en la pestaña de acciones de GitHub, que las dos pruebas corrieron y quedaron en verde». El push
ya está hecho; falta **mirar el resultado**, y eso el agente no lo puede hacer: no tiene `gh`
instalado ni ninguna otra forma de ver esa pestaña.

## Lo primero: qué decir cuando abrás la conversación

Entrá a **GitHub → pestaña Actions** y mirá el trabajo llamado **Pruebas**. Tiene que haber **dos
corridas en verde**, una en Node 20 y otra en Node 24, con 95 pruebas cada una. Después decí:

> La carpeta del día es `proyectoFinal`. Actions quedó en verde: cerrá la comprobación 7 y la pieza 3,
> y arrancamos la pieza 4.

**Si algo salió rojo**, copiá el error y traelo: es información valiosa, porque sería la primera vez
que el proyecto falla **fuera de esta máquina** — que es exactamente lo que la integración continua
existe para descubrir.

## Cómo levantar la aplicación y qué mirar

```bash
cd c:\Users\melal\Desktop\cursoCenfotecClaude\proyectoFinal

npm install     # solo la primera vez en una máquina nueva
npm run datos   # crea la base y carga los datos de prueba (con la aplicación apagada)
npm start       # levanta la aplicación
```

**http://localhost:3000**

Para apagarla: `Ctrl + C`.

**La base está recién creada, sin ninguna cuenta y sin ninguna cita**, así que lo primero es crearte
una cuenta desde la pantalla «Crear mi cuenta». *(La cuenta de Personal sí viene cargada:
`personal@ejemplo.com` / `Personal123`.)*

### El recorrido a mirar, en orden
*(Esta lista ya se recorrió el 2026-08-19 y quedó sin defectos. Se conserva porque es la que hay que
volver a pasar cada vez que una pieza nueva toque estas pantallas.)*

1. **Antes de entrar:** la barra azul de arriba **no** tiene que mostrar las tres rayitas, y el pie
   **no** tiene que mostrar el menú. Aparecen solo con la sesión abierta.
2. **Al entrar:** arriba a la derecha aparecen las tres rayitas (en pantalla de teléfono) o los
   enlaces «Reservar» y «Mis citas» (desde tableta). En el pie, los mismos enlaces más **«Salir»**.
   *(«Salir» se ve en un solo lugar a la vez: en teléfono adentro de la hamburguesa, y desde tableta
   abajo en el pie. Ya no hay ningún botón «Cerrar sesión» al lado del saludo.)*
3. **Solo tiene que verse el paso 1.** Los pasos 2 y 3 no se muestran hasta que elijas. *(Esto es lo
   que estaba roto y se arregló en esta pieza: antes se veían desde el arranque, vacíos.)*
4. **El paso 1 ahora muestra categorías**, no servicios: «Masaje» (dice «3 tipos») y «Facial» (dice
   «Limpieza facial», porque tiene uno solo).
5. **Tocá «Masaje»**: aparece un paso nuevo, **«Elegí el tipo de masaje»**, con los tres. Elegí
   «Masaje relajante» → **«Ana»**, y tocá el día de mañana en el calendario.
6. **Fijate en los números de los pasos:** tienen que ir 1, 2, 3, 4 seguidos.
7. **Después probá «Facial»**, que tiene un solo servicio: el paso del tipo **no tiene que aparecer**
   y se pasa directo a los proveedores (Ana y Luisa). Los números vuelven a ir 1, 2, 3 seguidos, sin
   saltos.
8. **Tocá el horario de las 10:00.** Tiene que quedar pintado en índigo sólido, y abajo tiene que
   aparecer la tarjeta **«Confirmá tu reserva»** con el servicio, quién te atiende, el día y la hora.
9. **Tocá «Confirmar la reserva».** La pantalla tiene que cambiar sola a **«Mis citas»**, con el
   aviso «Tu cita quedó reservada» y la cita en la lista.
10. **Volvé a «Reservar» desde el menú** y abrí el mismo día: **las 10:00 tienen que aparecer en azul
   marino con la letra blanca y la hora tachada** — así se ve un horario ya tomado.
11. **Reservá también las 14:00.** En «Mis citas» tienen que quedar las dos, ordenadas por hora.
12. **Tocá el día de hoy en el calendario:** no tiene que ofrecer ningún horario, solo el mensaje de
   que no se puede reservar para hoy y a qué número llamar.
13. **En pantalla angosta** (angostá la ventana del navegador): que nada se salga de su tarjeta, que
    las tres rayitas abran y cierren el menú, y que las fichas de horario queden alineadas.

### Y el recorrido de la sección «Usuario» (pieza 10)

14. **Abrí «Usuario»** desde el menú: se ven tu nombre y tu correo, y el teléfono, la edad y «cliente
    desde» dicen **«Sin completar»** (o, el último, que todavía no tuviste tu primera cita — si ya
    reservaste en el paso 6, tiene que mostrar la fecha de esa cita).
15. **Tocá «Completar o corregir mis datos»**: se abre un formulario con tu nombre ya cargado.
16. **Escribí el teléfono `88887777` sin guión** y elegí una fecha de nacimiento, y guardá: el
    teléfono tiene que mostrarse **`8888-7777`**, con el guión puesto por el sistema, y la edad tiene
    que aparecer en años, calculada.
17. **Probá que rechace lo que está mal:** un teléfono de 7 dígitos y una fecha de nacimiento del
    futuro. Los dos tienen que dar un mensaje que diga **qué** dato está mal.
18. **El correo no se puede cambiar:** en el formulario no hay campo de correo, y abajo dice que si
    lo necesitás cambiar hay que llamar al negocio.

Si algo se ve mal, decilo con una captura de pantalla: así salieron los tres defectos anteriores.

## Dónde quedó todo

| | |
|---|---|
| **Pieza 1** | **Cerrada** el 2026-08-17. Evidencia fechada en `PLAN.md`. |
| **Pieza 2** | **Cerrada** el 2026-08-19. Evidencia fechada en `PLAN.md`. |
| **Pieza 3** | **Construida** el 2026-08-19, revisión visual hecha. Falta solo confirmar Actions (comprobación 7). |
| **Pieza 10** | **Cerrada** el 2026-08-19, construida fuera de orden. No estaba en el plan original. |
| **Pieza 11** | **Cerrada** el 2026-08-19, construida fuera de orden. No estaba en el plan original, y corrigió RF-5 de la pieza 2. |
| **Pieza 4** | La que sigue: «Correo de confirmación». |
| **Subido a GitHub** | **Todo**: las piezas 1, 2, 3, 10 y 11, más la integración continua. Subido el 2026-08-19. |
| **Tiempo** | 6 horas por semana. Quedan 6 piezas y unas 18 horas: ~3 horas por pieza. |
| **Pruebas** | `npm test` → hoy son **95** y todas pasan. Y desde la pieza 3 **corren solas en cada push**. |

## Qué trae la pieza 4 (resumen — el detalle está en `PLAN.md`)

Al confirmarse una reserva, al cliente le llega un correo con la fecha, la hora, el servicio, el
proveedor y la ubicación del negocio. Es la primera pieza que habla con un **servicio de afuera**
(Resend), y por eso trae dos cosas nuevas:

- **Las variables de entorno `RESEND_API_KEY` y `CORREO_REMITENTE`**, que van en el `.env` y no se
  suben. Vas a tener que crear una cuenta en Resend y sacar una clave.
- **La regla de que sin clave la aplicación tiene que levantar igual** (RF-19): el correo falla y
  queda registrado como fallido, pero **la cita se sigue creando**. Eso significa que el envío de
  correo no puede estar en el camino de guardar la cita.

## Lo que la pieza 4 se encuentra ya hecho

1. **La cita se crea y se guarda**, con su cliente, servicio, proveedor, día y hora. El correo se
   dispara desde ahí: `servidor/reservas.js`, en la función `crearCita`.
2. **Los datos que el correo tiene que decir ya están todos**: la ubicación y el teléfono del negocio
   están en `configuracion_negocio` y salen por `GET /api/negocio`; el nombre del servicio y del
   proveedor los devuelve ya `GET /api/citas`.
3. **La integración continua ya existe**, así que las pruebas de la pieza 4 van a correr solas desde
   el primer push. No hay que montar nada.
4. **La tabla de correos enviados NO existe todavía.** `DISENO.md` la describe en su modelo de datos
   («Correo enviado»: cliente, cita, tipo, fecha de envío, si tuvo éxito) y la pieza 4 es la que la
   crea, con los nombres exactos que fije su bloque *Produce* en `PLAN.md`.

## Las convenciones que hay que seguir respetando

Están completas en el `CLAUDE.md` de la carpeta. Las que más se olvidan:

- **`VISUALS.md` manda sobre la apariencia.** Si un color o una medida no está ahí, no se inventa.
- **Mobile-first**, y es verificable: todos los `@media` son `min-width`, ninguno `max-width`.
- **La hora del negocio es la de Costa Rica**, escrita en `servidor/tiempo.js`, nunca la de la
  máquina. Y un momento se escribe siempre `2026-09-02T10:00:00-06:00`.
- **Toda cuadrícula de ancho repartido se escribe `minmax(0, 1fr)`, nunca `1fr` a secas.**
- **Una regla de negocio se escribe en un solo lugar del servidor**, y quien la necesite la llama.
- **Ninguna dependencia puede exigir más que Node 20**, y ahora la integración continua lo comprueba
  en cada push. Si se pone roja en Node 20, se cambia la dependencia, no la promesa del README.
- **Nada de dependencias que haya que compilar o configurar.**

## Lo que quedó sin decidir

- ~~**Los subtipos de servicio.**~~ **Resuelto y construido el 2026-08-19**, en la pieza 11: hay
  categorías, el cliente elige primero la categoría y después el tipo, y ese paso se salta cuando la
  categoría tiene un solo servicio (RN-22).
- **Los paquetes de sesiones y los tratamientos activos** siguen fuera de alcance: son PA-1, bloqueado
  por PA-2. Lo que falta decidir **no es técnico** — es quién dice que alguien compró un paquete y cómo
  se descuenta una sesión. La estudiante decidió el 2026-08-19 dejarlo afuera por ahora. Cuando lo
  decida, el camino es el mismo de las piezas 10 y 11: escribirlo primero en `ESPECIFICACION.md`
  (resolviendo PA-2) y en `PLAN.md`, y después construirlo.

## Lo que sigue pendiente del curso (no del sistema)

- **La skill propia de arranque** que pide la rúbrica. No es una vertical slice porque no es un
  requisito del sistema: está en «Fuera del plan» de `PLAN.md` y anotada en `SEGUIMIENTO.md`.
- **El año del pie de página** sigue escrito a mano («2026»). Anotado en `DISENO.md`.
