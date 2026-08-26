# Próxima sesión — arrancar la pieza 9

*Escrito el 2026-08-24, al cerrar la pieza 8. **La pieza 8 está cerrada.** No quedó nada suelto de
ella: el único punto que la pieza 7 había diferido se resolvió, y trajo una regla de negocio nueva.
Esta es la hoja para retomar sin releer nada.*

---

## Lo que hay que decir al abrir la conversación

> La carpeta del día es `proyectoFinal`. Arrancamos la pieza 9. Leé `PROXIMA-SESION.md`.

Con eso alcanza. El agente tiene que leer por su cuenta `ESPECIFICACION.md`, `DISENO.md`, la pieza 9
de `PLAN.md`, `VISUALS.md` y el `CLAUDE.md` de la carpeta.

---

## En qué estado exacto quedó todo

| | |
|---|---|
| **La pieza 8** | **CERRADA el 2026-08-24.** Sus diez comprobaciones se corrieron y la revisión visual está terminada |
| **Pruebas** | `npm test` da **277 de 277** |
| **CA-1, CA-2 y CA-3** | **Los tres completos**, cubiertos por pruebas que corren en cada push, en Node 20 y Node 24 |
| **Git** | ⚠️ **La pieza 8 todavía NO está subida.** Es lo primero que hay que hacer, o pedirlo |
| **Piezas hechas** | 1, 2, 3, 4, 5, 7, 8, 10, 11 y 12 |
| **Piezas que faltan** | **9** (la de ahora) y la **6** (trabada por una decisión, no por tiempo) |
| **Tiempo** | Hasta la entrega del **8 de setiembre** |

---

## LA PIEZA 9: «Restablecer la contraseña olvidada»

**~3 horas, y es corta porque el correo ya está resuelto desde la pieza 4.** Reusa
`servidor/correo.js` para enviar y `servidor/credenciales.js` para las reglas de la contraseña nueva
(RN-23).

**Lo que tiene que ser cierto** (está completo en `PLAN.md`, pieza 9):

- Quien olvidó su contraseña la pide desde la pantalla de entrar, con su correo (RF-3).
- Le llega un correo con un enlace **de un solo uso** y con vencimiento.
- Con ese enlace define una contraseña nueva y entra con ella; la vieja queda rechazada.
- Un enlace ya usado no sirve una segunda vez. Un enlace vencido tampoco.
- Vale igual para las cuentas de **Cliente y de Personal**.
- **Pedir el enlace con un correo que no existe responde exactamente lo mismo** que con uno que sí
  existe, para no revelar qué correos están registrados. Es el mismo criterio del mensaje de login de
  la pieza 1.
- El envío queda registrado con tipo `recuperacion` y **sin cita asociada** (REG-3).

**Lo que produce** (los nombres se copian tal cual de `PLAN.md`, no se eligen de nuevo):

- Tabla `token_recuperacion` (`id`, `cliente_id`, `personal_id`, `codigo`, `vence_en`, `usado_en`).
  **Solo uno de los dos identificadores viene lleno.**
- `POST /api/contrasena/olvide` — recibe `{correo}`; devuelve **siempre `204`**, exista o no la cuenta.
- `POST /api/contrasena/restablecer` — recibe `{codigo, contrasena}`; devuelve `204`; devuelve `422`
  con `{error: "token_invalido"}` si el código no existe, ya se usó o venció.

### Dos cosas que el plan no dice y hay que decidir ANTES de construir

1. **Cuánto dura el enlace.** El plan dice «con vencimiento» y no da el número. No lo inventes:
   preguntá.
2. **Dónde apunta el enlace.** La aplicación es una sola página (`index.html`), así que el enlace tiene
   que llegar a algo que esa página sepa leer. **Ojo con una trampa real:** la aplicación corre en
   `http://localhost:3000`, que quiere decir «esta computadora», así que un enlace mandado por correo
   **solo funciona si quien lo abre está en la misma máquina**. Para la demostración eso alcanza, pero
   **hay que decirlo en voz alta antes de construir**, no descubrirlo al final — es el mismo problema
   que tiene trabada la pieza 6.

### Y una decisión abierta que la estudiante dejó planteada el 2026-08-24

**Un «Recordarme» debajo del correo y la contraseña, en la pantalla de entrar.** Lo propuso al cerrar
la pieza 8 y **eligió no meterlo ahí** —esa pieza es de citas, no de sesión, y ya estaba cerrada— sino
decidirlo en la 9. **Encaja bien acá:** la pieza 9 pone un enlace «¿Olvidaste tu contraseña?» en esa
misma pantalla, así que se toca el HTML de entrar una sola vez y se revisa visualmente una sola vez.

**No está en `ESPECIFICACION.md`: no hay ningún RF que lo pida.** Si se hace, **el requisito se
escribe primero ahí**, como se hizo con RN-25 y RN-26.

Cuatro cosas que hay que resolver antes de construirlo:

1. **Cuál de las dos cosas es**, porque las dos se llaman igual y no son la misma:
   - **Recordar la sesión** — al volver, ya estás adentro. ⚠️ **Esto ya existe y está siempre
     encendido:** la sesión dura **7 días** (`SEGUNDOS_QUE_DURA` en `servidor/sesion.js`, decidido en
     `DISENO.md` → «Duración de la sesión de login»). Así que un check no agregaría el recuerdo:
     **agregaría la opción de NO ser recordado**, y sin marcar la sesión moriría al cerrar el
     navegador. Es lo contrario de lo que la etiqueta sugiere.
   - **Recordar el correo** — al volver, el campo del correo viene lleno y solo se escribe la
     contraseña. **Esto no existe hoy**, y es lo que de verdad ahorra tiempo.
2. **Si vale igual para las dos cuentas.** La cuenta de Personal vive en **la computadora del
   mostrador**, que puede usar más de una persona: un «Recordarme» marcado ahí deja la sesión del
   negocio abierta para quien se siente después. Quizá la respuesta correcta sea distinta para el
   cliente que para Personal — y eso se escribe como decisión, no se resuelve en silencio.
3. **Cuánto dura**, si se elige la primera. Hoy son 7 días para todos.
4. **Si viene marcado o desmarcado** la primera vez.

**Costo estimado si se hace: ~1 hora**, contando el requisito escrito, las pruebas y la revisión
visual. La mitad de ese tiempo es escribir la regla, no el código.

### Y una cosa que sí está resuelta y conviene reusar

`POST /api/contrasena/cambiar` ya existe desde la pieza 7, y la regla de qué contraseña se acepta vive
en `servidor/credenciales.js` (RN-23: 6 caracteres, una mayúscula, un número, sin vocales acentuadas —
la ñ sí). **La pieza 9 no vuelve a escribir esa regla: la llama.**

---

## Cómo levantar la aplicación

**Lo más rápido, desde el 2026-08-24, es la skill propia del proyecto.** Con Claude Code abierto en la
carpeta, escribí `/launch`: revisa que se pueda arrancar, levanta la aplicación, y **cuenta leyéndolo
de la base** qué cuentas hay y qué se puede mostrar — así no hace falta creerle a la tabla de más
abajo, que es una foto y se pone vieja. Con `/launch limpio` rehace los datos de prueba, avisando
primero qué se pierde.

A mano, si se prefiere:

```bash
cd c:\Users\melal\Desktop\cursoCenfotecClaude\proyectoFinal

npm install     # solo la primera vez en una máquina nueva
npm run estado  # cuenta en qué estado está todo, sin levantar nada
npm start       # levanta la aplicación
```

**http://localhost:3000** — para apagarla, `Ctrl + C`.

> ⚠️ **NO corras `npm run datos`** si querés conservar los datos de prueba de abajo. Ese comando
> rehace la base desde cero y se lleva las cuentas y las citas.

### Lo que hay en la base ahora mismo

> ⚠️ **Esta tabla es una foto del 2026-08-24 y se pone vieja sola.** Para el dato al día, corré
> `/launch` o `npm run estado`, que lo cuentan de la base. Se deja acá porque tiene una cosa que la
> skill **no puede** dar: **las contraseñas de los clientes**, que en la base solo están cifradas.

| Cuenta | Entra con | Sirve para |
|---|---|---|
| **Personal** | `personal@ejemplo.com` / `Personal123` | Toda la pieza 7 y toda la 8 |
| **Marisol Prueba** | `marisol@ejemplo.com` / `Marisol99` | Ver el lado del cliente. Tiene varias citas |
| **melalo** | `melalo9@gmail.com` / *(la que puso la estudiante)* | La única a la que **le llegan los correos de verdad**. **Es con la que hay que probar la pieza 9** |
| **Test Recarga** | `test-recarga@ejemplo.com` / `Tortuga381` | **La contraseña temporal SIGUE SIN CAMBIAR**, así que sirve para volver a probar el cambio obligatorio (RF-4) |
| **maria** | `mp@gmail.com` / *(temporal, perdida)* | Tiene la obligación encendida pero su temporal no se puede recuperar |
| **ana torres** | `ana@ejemplo.com` / *(temporal, perdida)* | Lo mismo que `maria` |
| **test** | `prueba-cierre@ejemplo.com` / *(temporal, perdida)* | **Creada el 2026-08-24 durante la revisión de la pieza 8**, para comprobar que la contraseña temporal ya no sobrevive al logout. No sirve para nada más: se puede ignorar |

**Diez citas.** Su estado después de la pieza 8:

- **Tres cerradas, y son la evidencia de la pieza**, las tres con `cerrada_en` y `cerrada_por`
  llenos: la del **18 de agosto** de Marisol quedó `completada`, y las del **22 a las 9** de ana torres
  y **22 a las 11** de Marisol quedaron `no_asistio`.
- **Dos esperando en «Citas por cerrar»**, las dos de Marisol: **22 de agosto a las 10** y **24 de
  agosto a las 10**. **Se dejaron sin cerrar a propósito**, por si hay que volver a mostrar la pieza.
- **Una futura**: la de **melalo el 27 de agosto**. Es la única, y es la que sirve para comprobar que
  «Reagendar» y «Cancelar» siguen apareciendo donde corresponde. **No la canceles.**
- El resto, canceladas.

**Sobre los correos:** con la dirección de pruebas que regala Resend solo llegan a la casilla con la
que se registró la cuenta de Resend. A los `@ejemplo.com` **fallan a propósito** y quedan registrados
como fallidos; la cita se crea igual (RF-19). **Para la pieza 9 esto importa mucho:** el enlace de
recuperación solo va a llegar de verdad a `melalo9@gmail.com`.

---

## Lo que sigue, después de la pieza 9

| | |
|---|---|
| **Pieza 6** | «Recordatorio de 24 h». **Sigue trabada por una decisión, no por tiempo** — ver abajo |
| **Del curso** | ~~La skill propia de arranque~~ **HECHA el 2026-08-24: `/launch`.** Queda **preparar la presentación** de la sesión 8 |

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

Están completas en el `CLAUDE.md` de la carpeta. Las que más se olvidan, **con las cuatro que la
pieza 8 agregó marcadas**:

- **`VISUALS.md` manda sobre la apariencia.** Si un color o una medida no está ahí, no se inventa.
- 🆕 **Ningún tamaño de letra se escribe en píxeles.** Van todos en `rem` —el píxel de `VISUALS.md`
  dividido entre 16— y los títulos con `clamp()`. La tabla de conversión está arriba del `.scss`.
- 🆕 **`html` lleva un `font-size: 80%` y no se toca.** Achica toda la tipografía de una sola vez.
  **No se reemplaza por un tamaño en píxeles**, porque dejaría el `rem` clavado y quien agranda la
  letra de su navegador dejaría de poder hacerlo. *(El costo está asumido y escrito en tres lados: el
  texto normal queda en 12.8px, por debajo de los 16px que `VISUALS.md` llama mínimo accesible.)*
- 🆕 **La hora se escribe con `am`/`pm`, menos en las fichas de horario del calendario**, que siguen
  en hora de 24 porque `10:00am` no entra en esa caja. La cuenta está escrita dos veces a propósito —
  en el navegador y en el servidor— porque el navegador no puede leer nada de `servidor/`.
- **Mobile-first**, y es verificable: todos los `@media` son `min-width`, ninguno `max-width`. Los
  cortes son 476px *(específico, de una sola fila de botones)*, 768px y 1024px, **siempre como
  variable**, nunca escritos a mano adentro de un `@media`.
- **Un permiso es una regla, y va en un solo lugar: `servidor/sesion.js`**, donde viven los tres
  guardias. Un archivo de rutas nunca comprueba un permiso por su cuenta.
- **Todo lo que solo abre Personal vive bajo `/api/personal/`.** *(La pieza 8 corrigió el plan por
  esto: el endpoint del cierre estaba escrito fuera de ese pasillo.)*
- **Personal tiene exactamente dos excepciones, y las dos son sobre el tiempo:** la ventana de 4 horas
  (RN-6) y la cita de hoy (RN-25). Todo lo demás lo alcanza igual que al cliente (RN-13) — **y RN-26,
  que es de la pieza 8, va para el otro lado: lo alcanza igual, no lo exime.**
- 🆕 **Si borrar algo pide tocar el dato y la pantalla, las dos cosas van en la misma función.** Es la
  regla de siempre —una regla, un lugar— aplicada al frontend, y salió del hallazgo número 20.
- **En la pantalla de Personal ningún texto dice «tu», y lo que se está mirando lleva el nombre de su
  dueño.** Cuando un mensaje mande a hacer algo, hay que preguntarse **quién lo va a leer**.
- **Todo campo de contraseña lleva el «ojito».** Sin excepción — y la pieza 9 trae una pantalla nueva
  con contraseña, así que esto le aplica directo. **No hay que agregarlo campo por campo:** una
  función recorre la página y se lo pone a todos los `input[type="password"]`.
- **Un cambio visual que vale para una sola pantalla va como modificador**, no cambiando la clase
  compartida.
- **La hora del negocio es la de Costa Rica**, escrita en `servidor/tiempo.js`, nunca la de la
  máquina. Y un momento se escribe siempre `2026-09-02T10:00:00-06:00`.
- **Toda cuadrícula de ancho repartido se escribe `minmax(0, 1fr)`, nunca `1fr` a secas.**
- **Los comandos también hay que correrlos.** `npm test` no ejecuta `npm run datos` ni `npm start`.
- **Una tabla nueva que apunte a otra hay que agregarla al borrado de `guiones/datos-de-prueba.js`, y
  primero de todo.** **Esto le aplica directo a la pieza 9**, que crea `token_recuperacion` apuntando
  a `cliente` y a `personal`: si no se agrega, `npm run datos` se rompe y **ninguna prueba lo
  detecta**. Ya pasó en la pieza 4 con `correo_enviado`.

---

## Lo que la pieza 8 dejó, para poder defenderla

**Las tres ideas:**

1. **La regla nueva se escribió antes que el código, y su lugar en la función *es* la regla.** RN-26
   —una cita que ya pasó no se cancela ni se reagenda, tampoco Personal— vive en
   `revisarSiSePuedeCambiar` **antes** de la línea que le da el pase a Personal. Puesta una línea más
   abajo no haría absolutamente nada, porque Personal no tiene ventana de cancelación.
2. **Meterle una regla nueva a la función de CA-3 obliga a demostrar que no se rompió nada.** Por eso
   hay **dos pruebas que existen solo para eso**: la misma cita que empieza dentro de 2 horas se le
   sigue aceptando a Personal (`204`) y rechazando al cliente (`422 ventana_de_cancelacion`).
3. **Un parche viejo desapareció solo.** Desde el 2026-08-20 había una función que traducía
   `ventana_de_cancelacion` a `ya_paso` **solo para la pantalla**, porque la frase «faltan menos de 4
   horas» debajo de una cita del mes pasado era falsa. Con RN-26, `ya_paso` **es la regla**. Lección,
   y es la segunda vez en este proyecto: **cuando un mensaje suena falso, casi siempre la regla detrás
   tiene un hueco.** La primera fue RN-25.

**El saldo de su revisión: ocho hallazgos, ninguno de una prueba automática.** Uno era un defecto de
comportamiento con dos consecuencias escondidas —**Personal quedaba sin buscador**, y **la contraseña
temporal de un cliente sobrevivía al logout en pantalla**—, dos eran textos, y cinco cambiaron cómo se
escribe la apariencia en todo el proyecto. Con estos, los hallazgos visuales del proyecto llegan a
**veinte**, y **ninguno salió de `npm test`**.

**Y un error de razonamiento que quedó anotado a propósito**, porque es fácil repetirlo: se esperaba
que pasar la tipografía a `rem` y `clamp` arreglara una ficha que se desbordaba, **y no tenía por
qué**. `rem` y `clamp` hacen que la letra **se adapte a quien mira**; no hacen que un texto **entre en
su caja**. Son dos problemas distintos y se arreglan con cosas distintas — el segundo se arregla
acortando el texto o dándole más lugar, que fue lo que terminó resolviéndolo.
