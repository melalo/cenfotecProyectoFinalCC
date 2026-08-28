# Próxima sesión — la pieza 6, o la presentación

*Escrito el 2026-08-28, al cerrar la pieza 9. **La pieza 9 está cerrada.** Esta es la hoja para
retomar sin releer nada.*

---

## Lo que hay que decir al abrir la conversación

> Abrí el repositorio `cenfotecProyectoFinalCC`. Leé `PROXIMA-SESION.md`.

Con eso alcanza. El agente tiene que leer por su cuenta `ESPECIFICACION.md`, `DISENO.md`, la pieza
que se vaya a construir de `PLAN.md`, `VISUALS.md` y el `CLAUDE.md` del repositorio.

---

## En qué estado exacto quedó todo

| | |
|---|---|
| **La pieza 9** | **CERRADA el 2026-08-28.** Sus 8 comprobaciones corridas y la revisión visual terminada |
| **Pruebas** | `npm test` da **302 de 302** |
| **CA-1, CA-2 y CA-3** | **Los tres completos**, cubiertos por pruebas que corren en cada push, en Node 20 y Node 24 |
| **Git** | **Todo subido el 2026-08-28** |
| **Piezas hechas** | 1, 2, 3, 4, 5, **7, 8, 9**, 10, 11 y 12 — **once de doce** |
| **Piezas que faltan** | **Solo la 6**, y está trabada por una decisión, no por tiempo |
| **Del curso** | Falta **preparar la presentación** de la sesión 8 |
| **Tiempo** | Hasta la entrega del **8 de setiembre** |

---

## Las dos cosas que quedan, y hay que elegir por cuál empezar

### 1. La pieza 6 — «Recordatorio de 24 horas»

**Sigue trabada por una decisión, no por tiempo.** Su plan dice que una tarea programada de GitHub
Actions llama al backend. Pero la aplicación corre en `http://localhost:3000`, que quiere decir «esta
computadora»: **GitHub no puede llamar a tu computadora**. No hay clave ni configuración que lo
arregle.

**Es el mismo problema que apareció en la pieza 9 con el enlace del correo**, y esa vez se resolvió
declarándolo en voz alta antes de construir, no descubriéndolo al final. Acá conviene hacer lo mismo.

Tres caminos, y la elección es de la estudiante:

1. **Recortarla**, que es lo que `FICHA-APROBACION.md` ya anticipaba.
2. **Alojar la aplicación** en algún servicio gratuito. Suma tiempo aparte del de la pieza.
3. **Adaptarla:** construir el endpoint y su regla completos, con sus pruebas, y disparar la revisión
   **a mano**. Se cumplirían 7 de sus 8 comprobaciones; la 8 quedaría anotada como no cumplida.

### 2. La presentación de la sesión 8

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
- 🆕 **`SEGUIMIENTO.md` está muy desactualizado.** Todavía tiene tareas como «subir a GitHub la
  pieza 1». No molesta a nadie, pero si alguien lo lee esperando el estado real, se confunde.

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
