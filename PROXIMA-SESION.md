# Próxima sesión — arrancar la pieza 8

*Escrito el 2026-08-24, al cerrar la pieza 7. **La pieza 7 está cerrada y subida a Git.** No queda
nada suelto de ella salvo un punto que se difirió a propósito, y que la pieza 8 es la que tiene que
resolver. Esta es la hoja para retomar sin releer nada.*

---

## Lo que hay que decir al abrir la conversación

> La carpeta del día es `proyectoFinal`. Arrancamos la pieza 8. Leé `PROXIMA-SESION.md`.

Con eso alcanza. El agente tiene que leer por su cuenta `ESPECIFICACION.md`, `DISENO.md`, la pieza 8
de `PLAN.md`, `VISUALS.md` y el `CLAUDE.md` de la carpeta.

---

## En qué estado exacto quedó todo

| | |
|---|---|
| **La pieza 7** | **CERRADA el 2026-08-24.** Sus diez comprobaciones pasan y la revisión visual está terminada: una persona abrió el navegador y miró las tres cosas que faltaban |
| **Pruebas** | `npm test` da **250 de 250** |
| **CA-1, CA-2 y CA-3** | **Los tres completos**, cubiertos por pruebas que corren en cada push, en Node 20 y Node 24 |
| **Git** | **Todo subido**, con los documentos actualizados antes del commit |
| **Piezas hechas** | 1, 2, 3, 4, 5, 7, 10, 11 y 12 |
| **Piezas que faltan** | **8** (la de ahora), **9**, y la **6** (trabada por una decisión, no por tiempo) |
| **Tiempo** | Hasta la entrega del **8 de setiembre** |

---

## LA PIEZA 8: «Personal cierra las citas pasadas»

**~2 horas, y es corta porque la pieza 7 ya construyó su pantalla.** Personal ya entra, ya busca al
cliente y ya ve sus citas: lo que falta es poder **cerrarlas**.

**Lo que tiene que ser cierto** (está completo en `PLAN.md`, pieza 8):

- Personal ve las citas activas cuya hora ya pasó (RF-21).
- Puede marcar cada una como **completada** (asistió) o **no asistió**.
- En los dos casos queda registrado **qué cuenta de Personal la marcó y cuándo** (REG-1).
- **Ningún estado se alcanza solo por el paso del tiempo** (RN-17): una cita cuya hora pasó sigue
  activa hasta que alguien la marque.
- El cliente no puede cerrar sus propias citas.
- Una cita ya cerrada no se puede volver a cerrar con otro estado.

**Lo que produce** (los nombres se copian tal cual de `PLAN.md`, no se eligen de nuevo):

- `GET /api/personal/citas-por-cerrar`
- `PATCH /api/citas/:citaId/cierre`, que recibe `{estado}` con `"completada"` o `"no_asistio"`
- Los campos `cerrada_en` y `cerrada_por` de la tabla `cita`, **que ya existen vacíos**

### ⚠️ El punto abierto que esta pieza hereda, y hay que decidir ANTES de construirla

Para Personal, una cita **que ya pasó y que nadie cerró** llega con `sePuedeCambiar: true`, así que le
aparecen **«Reagendar»** y **«Cancelar»** sobre una cita del mes pasado.

**No es un error del código.** Sale de leer **RN-6** («Personal no tiene ventana de cancelación»)
junto con **RN-17** («ninguna cita cambia de estado por el solo paso del tiempo»), y la especificación
**no prohíbe** que Personal toque una cita pasada. Restringirlo sería **inventar una regla desde el
código**, y este proyecto no hace eso.

Se difirió a esta pieza el 2026-08-24 **a propósito**, porque es la que trae los botones pensados para
ese caso. La pregunta, con las dos pantallas a la vista:

> Sobre una cita pasada sin cerrar, ¿Personal ve **cuatro** botones (Reagendar, Cancelar, Completada,
> No asistió), o los dos primeros desaparecen y quedan solo los de cerrar?

Hay un argumento a favor de dejarlos: alguien que no llegó llama al día siguiente y la asistente le
mueve la fecha. **Si se decide restringir, la regla se escribe primero en `ESPECIFICACION.md`**, y
recién después se toca el código.

---

## Cómo levantar la aplicación

```bash
cd c:\Users\melal\Desktop\cursoCenfotecClaude\proyectoFinal

npm install     # solo la primera vez en una máquina nueva
npm start       # levanta la aplicación
```

**http://localhost:3000** — para apagarla, `Ctrl + C`.

> ⚠️ **NO corras `npm run datos`** si querés conservar los datos de prueba de abajo. Ese comando
> rehace la base desde cero y se lleva las cuentas y las citas.

### Lo que hay en la base ahora mismo

| Cuenta | Entra con | Sirve para |
|---|---|---|
| **Personal** | `personal@ejemplo.com` / `Personal123` | Toda la pieza 7 y toda la 8 |
| **Marisol Prueba** | `marisol@ejemplo.com` / `Marisol99` | Ver el lado del cliente. Tiene varias citas |
| **melalo** | `melalo9@gmail.com` / *(la que puso la estudiante)* | La única a la que **le llegan los correos de verdad** |
| **Test Recarga** | `test-recarga@ejemplo.com` / `Tortuga381` | **La contraseña temporal SIGUE SIN CAMBIAR**, así que sirve para volver a probar el cambio obligatorio (RF-4) cuando haga falta |
| **maria** | `mp@gmail.com` / *(temporal, perdida)* | Tiene la obligación encendida pero **su contraseña temporal no se puede recuperar** — para probar RF-4 usá la de arriba |
| **ana torres** | `ana@ejemplo.com` / *(temporal, perdida)* | Lo mismo que `maria` |

**Diez citas**, cinco de ellas con canal `asistida`.

**Sobre los correos:** con la dirección de pruebas que regala Resend solo llegan a la casilla con la
que se registró la cuenta de Resend. A los `@ejemplo.com` **fallan a propósito** y quedan registrados
como fallidos; la cita se crea igual (RF-19).

> Para la pieza 8 vas a necesitar **citas activas cuya hora ya pasó**. La aplicación no deja crearlas
> (RN-4), así que **se insertan a mano en la base**, igual que hacen las pruebas. Eso está permitido y
> escrito en `CLAUDE.md`: es la única manera de llegar a ese estado.

---

## Lo que sigue, después de la pieza 8

| | |
|---|---|
| **Pieza 9** | «Restablecer la contraseña». ~3 h, corta porque el correo ya está resuelto. Va a reusar `POST /api/contrasena/cambiar` y las reglas de `credenciales.js` |
| **Pieza 6** | «Recordatorio de 24 h». **Sigue trabada por una decisión, no por tiempo** — ver abajo |
| **Del curso** | La **skill propia de arranque** que pide la rúbrica, y **preparar la presentación** de la sesión 8 |

### La pieza 6 sigue trabada por una decisión abierta

Su plan dice que una tarea programada de GitHub Actions llama al backend. Pero la aplicación corre en
`http://localhost:3000`, que quiere decir «esta computadora»: **GitHub no puede llamar a tu
computadora**. No hay clave ni configuración que lo arregle. Tres caminos, y la elección es de la
estudiante:

1. **Recortarla**, que es lo que `FICHA-APROBACION.md` ya anticipaba.
2. **Alojar la aplicación** en algún servicio gratuito. Suma tiempo aparte del de la pieza.
3. **Adaptarla:** construir el endpoint y su regla completos, con sus pruebas, y disparar la revisión
   **a mano**. Se cumplirían 7 de sus 8 comprobaciones; la 8 quedaría anotada como no cumplida.

### Dos pendientes chicos, de antes

- **La integración continua trae dos avisos amarillos:** `actions/checkout@v4` y
  `actions/setup-node@v4`. No rompe nada; conviene subirlas a la versión 5 cuando haya un rato.
- **El año del pie de página** sigue escrito a mano («2026»). Anotado en `DISENO.md`.

---

## Las convenciones que hay que seguir respetando

Están completas en el `CLAUDE.md` de la carpeta. Las que más se olvidan:

- **`VISUALS.md` manda sobre la apariencia.** Si un color o una medida no está ahí, no se inventa.
- **Mobile-first**, y es verificable: todos los `@media` son `min-width`, ninguno `max-width`. Los
  cortes son 476px *(específico, de una sola fila de botones)*, 768px y 1024px, **siempre como
  variable**, nunca escritos a mano adentro de un `@media`.
- **Un permiso es una regla, y va en un solo lugar: `servidor/sesion.js`**, donde viven los tres
  guardias. Un archivo de rutas nunca comprueba un permiso por su cuenta.
- **Todo lo que solo abre Personal vive bajo `/api/personal/`.**
- **Personal tiene exactamente dos excepciones, y las dos son sobre el tiempo:** la ventana de 4 horas
  (RN-6) y la cita de hoy (RN-25). Todo lo demás lo alcanza igual que al cliente (RN-13).
- **En la pantalla de Personal ningún texto dice «tu», y lo que se está mirando lleva el nombre de su
  dueño.** Cuando un mensaje mande a hacer algo, hay que preguntarse **quién lo va a leer**.
- **Un cambio visual que vale para una sola pantalla va como modificador**, no cambiando la clase
  compartida.
- **La hora del negocio es la de Costa Rica**, escrita en `servidor/tiempo.js`, nunca la de la
  máquina. Y un momento se escribe siempre `2026-09-02T10:00:00-06:00`.
- **Toda cuadrícula de ancho repartido se escribe `minmax(0, 1fr)`, nunca `1fr` a secas.**
- **Los comandos también hay que correrlos.** `npm test` no ejecuta `npm run datos` ni `npm start`.
- **Una etiqueta de estado aparece solo cuando algo le pasó a la cita.** Esto le importa mucho a la
  pieza 8: hoy una cita pasada sin cerrar **no lleva ninguna etiqueta**, y va a empezar a llevar
  COMPLETADA o NO ASISTIÓ. Así la etiqueta **nunca se desdice**.

---

## Lo que la pieza 7 dejó, para poder defenderla

**Las tres ideas:**

1. **CA-3 no tiene ninguna regla nueva escrita.** `revisarSiSePuedeCambiar` de `servidor/reservas.js`
   recibe un parámetro `quien`, y con `QUIEN_PERSONAL` la ventana de 4 horas se saltea sola. La pieza
   5 dejó ese parámetro puesto sin saber cómo se iba a construir la 7.
2. **La obligación de cambiar la contraseña no vive en la pantalla, vive en el guardia de la sesión.**
   Esconder el menú es lo que se ve; lo que manda está del otro lado — una pantalla que esconde
   botones no sirve de nada contra quien le manda el pedido al API sin abrir el navegador.
3. **RN-25 nació de un texto absurdo.** El cartel del día de hoy le decía a la asistente del negocio
   «llamá al negocio». El texto era absurdo **porque la regla detrás tenía un hueco**, y era el mismo
   hueco que RN-6 existe para tapar. Se arreglaron los dos.

**El saldo de su revisión visual: siete hallazgos, ninguno de una prueba automática.** Tres no eran de
apariencia sino **de lo que la aplicación decía**, y uno terminó en una regla de negocio nueva. Con
estos, los hallazgos visuales del proyecto llegan a **diecinueve**, y ninguno salió de una prueba.

**Y un hallazgo que no fue defecto**, del 2026-08-24: se reportó que un campo no aparecía al recargar,
se investigaron el servidor, la caché, el CSS compilado y el código, y **todo estaba bien** — lo que
había fallado era el recorrido escrito, que hacía tocar «Salir» a destiempo. Quedó la convención: **un
recorrido de revisión tiene que decir qué botones no tocar.** Está contado entero en `BITACORA.md`.
