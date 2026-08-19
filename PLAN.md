# Plan de construcción: Reservas en línea para negocios de bienestar y salud

**Objetivo:** un prototipo funcionando de extremo a extremo, con datos que sobreviven al reinicio,
donde el cliente reserva su cita solo y a cualquier hora, la cancela o la reagenda, recibe sus
correos, y la asistente del negocio atiende por teléfono desde la misma aplicación.

**Arquitectura:** un backend en Node.js + Express expone un API donde viven las reglas de negocio
y la base SQLite; un frontend en HTML + CSS con SASS consume ese API y es lo único que el cliente
ve. Dos piezas trabajan por su cuenta: el servicio de correo, que manda confirmaciones,
recordatorios y enlaces de contraseña, y una tarea programada externa que le avisa al backend que
revise si hay recordatorios pendientes. El detalle está en `DISENO.md`; este plan no lo repite ni
lo cambia.

**Stack** *(elegido en `DISENO.md`, copiado de ahí — el plan no decide tecnología)*:

| Capa | Elección |
|---|---|
| Backend | JavaScript (Node.js) con Express |
| Frontend | HTML + CSS con SASS |
| Base de datos | SQLite, accedida con `better-sqlite3` |
| Autenticación | Contraseña (no enlace mágico) |
| Correo | Resend |
| Disparador del recordatorio | Tarea programada en GitHub Actions |

**Restricciones globales** *(copiadas de «Fuera de alcance» de `ESPECIFICACION.md`; aplican a
todas las piezas)*:

- No hay citas para el mismo día. Quien las necesita llama al negocio.
- No se puede reservar sin cuenta: no existe el modo invitado.
- No hay panel de administración con interfaz. Servicios, proveedores, horarios, feriados,
  ubicación, logo y colores se cargan como configuración.
- El calendario tiene una sola vista, la mensual, con navegación entre meses.
- Todas las citas duran una hora.
- La política de cancelación es fija en 4 horas.
- El sistema no registra dinero: ni pagos, ni cobros, ni paquetes de sesiones.
- Un solo negocio, una sola ubicación.
- Nada se borra nunca.

## Cómo usar este plan

- **Una pieza por conversación.** Al cerrar la pieza, cerrar también la conversación: el contexto
  arranca limpio y barato en la siguiente.
- El encargo de cada pieza **referencia** `ESPECIFICACION.md` y `DISENO.md`; no los repite.
- Una pieza queda cerrada cuando **su comprobación se corrió** y el resultado quedó anotado en su
  bloque de Evidencia, con fecha.
- Lo que la construcción revele que falta en la especificación o el diseño **se corrige primero en
  ese documento**, y después en el código.
- Cada pieza dice qué **Consume** de las anteriores y qué **Produce** para las siguientes, con los
  nombres exactos. Quien construye una pieza no leyó las otras: ese bloque es cómo se entera.

## Piezas

| # | Pieza | Depende de | Estado |
|---|---|---|---|
| 1 | Entrar a la aplicación | — | **cerrada el 2026-08-17** |
| 2 | Elegir servicio y proveedor, y ver el calendario | 1 | **cerrada el 2026-08-19** |
| 3 | Reservar un horario | 2 | **construida el 2026-08-19** — revisión visual hecha; falta solo la comprobación 7 (ver el push en verde en GitHub) |
| 4 | Correo de confirmación | 3 | pendiente |
| 5 | Cancelar y reagendar | 3 | pendiente |
| 6 | Recordatorio de 24 horas | 4 y 5 | pendiente |
| 7 | Personal atiende el teléfono | 5 | pendiente |
| 8 | Personal cierra las citas pasadas | 7 | pendiente |
| 9 | Restablecer la contraseña olvidada | 4 | pendiente |
| 10 | La información del cliente | 1 y 3 | **cerrada el 2026-08-19**, construida fuera de orden |
| 11 | Categorías de servicio | 2 | **cerrada el 2026-08-19**, construida fuera de orden |

Las piezas **1 a 5** son «El núcleo» comprometido en `FICHA-APROBACION.md`: prototipo de extremo a
extremo, persistencia real, y las pruebas de reglas de negocio con integración continua. La pieza
**6** es la que esa misma ficha marca como *«la pieza de mayor riesgo técnico… si el tiempo
aprieta, sería la primera en recortar»*.

---

## Detalle

### Pieza 1: Entrar a la aplicación

Trae adentro el arranque del proyecto: crear el código, la base SQLite y la aplicación que levanta.
No es una pieza aparte porque «el proyecto compila» no comprueba nada del negocio.

**Qué tiene que ser cierto**
- Una persona sin cuenta puede crear la suya con nombre, correo y contraseña (RF-1).
- La contraseña se guarda cifrada, nunca en texto legible (`DISENO.md`, entidad Cliente).
- Con ese correo y esa contraseña puede entrar, y queda con la sesión abierta (RF-2).
- Un intento con contraseña equivocada, o con un correo que no existe, devuelve el **mismo**
  mensaje —«correo o contraseña incorrectos»— sin decir cuál de los dos falló.
- Dos cuentas no pueden tener el mismo correo.
- La base de datos es un archivo SQLite real: los datos siguen ahí después de apagar y volver a
  levantar la aplicación.
- Existe la cuenta de Personal, precargada, sin pantalla de registro para ella (RN-10). Todavía no
  hace nada distinto: solo entra igual que un cliente y se distingue por su tipo.

**Con qué se comprueba**
1. Levantar la aplicación, abrirla en el navegador, registrarse con `ana@ejemplo.com` /
   `Prueba123`, y ver que entra y la pantalla la saluda por su nombre.
2. Cerrar sesión, volver a entrar con esas mismas credenciales: entra.
3. Volver a entrar con `ana@ejemplo.com` / `Prueba124`: aparece «correo o contraseña incorrectos».
4. Entrar con `noexiste@ejemplo.com` / `Prueba123`: aparece **el mismo** mensaje, palabra por
   palabra.
5. Intentar registrar otra vez `ana@ejemplo.com`: lo rechaza.
6. Apagar la aplicación, volver a levantarla, entrar con `ana@ejemplo.com` / `Prueba123`: entra —
   los datos sobrevivieron.
7. Abrir el archivo de la base con un visor de SQLite y ver que la contraseña guardada no es
   `Prueba123` en texto legible.
8. Entrar con la cuenta precargada de Personal —`personal@ejemplo.com` / `Personal123`— y ver que
   la aplicación la reconoce como tipo `personal`. *(Estas credenciales faltaban: la comprobación
   pedía entrar con esa cuenta sin decir con qué correo ni con qué contraseña. Se decidieron al
   construir la pieza 1, siguiendo el mismo estilo inventado de `ana@ejemplo.com` / `Prueba123`, y
   quedaron escritas también en la sección «Datos de prueba» del `README.md`.)*

**Toca:** Autenticación, Interfaz.

**Interfaces**
- *Consume:* nada.
- *Produce:*
  - Base SQLite en archivo, con las tablas `cliente` (id, nombre, correo, contrasena_cifrada,
    debe_cambiar_contrasena) y `personal` (id, nombre, correo, contrasena_cifrada).
  - `POST /api/registro` — recibe `{nombre, correo, contrasena}`; devuelve `201` con
    `{id, nombre, correo, tipo}` donde `tipo` es `"cliente"`, y deja la sesión abierta; devuelve
    `409` con `{error: "correo_ya_registrado"}` si el correo ya existe, y `422` con
    `{error: "datos_incompletos"}` si falta alguno de los tres campos. *(Los tres detalles —que la
    sesión quede abierta, el nombre del error del 409 y el caso 422— se agregaron al construir la
    pieza: la comprobación 1 exige que quien se registra quede saludado por su nombre, y el
    frontend necesita saber qué contestar cuando el correo está repetido o falta un campo.)*
  - `POST /api/sesion` — recibe `{correo, contrasena}`; devuelve `200` con
    `{id, nombre, correo, tipo, debeCambiarContrasena}` y abre la sesión; devuelve `401` con
    `{error: "credenciales_invalidas"}` tanto si el correo no existe como si la contraseña está mal.
  - `DELETE /api/sesion` — cierra la sesión; devuelve `204`.
  - `GET /api/yo` — devuelve `200` con `{id, nombre, correo, tipo, debeCambiarContrasena}` si hay
    sesión, `401` si no.
  - El campo `tipo` vale `"cliente"` o `"personal"`, y toda pieza posterior lo usa para saber quién
    está actuando.
  - **El contrato de arranque que `README.md` declara**, con estos nombres exactos: `npm install`,
    `npm run datos` (crea la base y carga los datos de prueba, y se puede correr las veces que haga
    falta), `npm start` (levanta la aplicación en **http://localhost:3000**) y `npm test`. También
    un `.env.ejemplo` versionado con las claves vacías, y la lectura de las variables `PORT` y
    `SESION_SECRETO`. El puerto 3000 se fija como decisión del proyecto para que no dependa de la
    máquina; `PORT` lo puede cambiar. Ningún dato de la máquina donde se construyó puede quedar en
    el código: la comprobación de referencia del curso es clonar en una carpeta limpia y levantar
    desde ahí siguiendo solo el README.

**Evidencia**

*Construida el 2026-08-17.*

**Pruebas automáticas — `npm test`: 14 pruebas, 14 pasan, 0 fallan.** Se escribieron antes del
código y se vieron fallar primero. Viven en `pruebas/autenticacion.test.js` y cubren: registro,
que la sesión quede abierta al registrarse, contraseña cifrada, correo repetido (también escrito
con mayúsculas), datos incompletos, entrar, el mensaje idéntico para contraseña equivocada y
correo inexistente, `GET /api/yo` sin sesión, cerrar sesión, una cookie de sesión falsificada, la
cuenta de Personal precargada, que el registro no pueda crear una cuenta de Personal, y la
persistencia tras apagar y levantar.

**Las 8 comprobaciones de arriba, corridas contra la aplicación escuchando en
`http://localhost:3000` y sobre la base real `datos/reservas.sqlite`:**

| # | Resultado |
|---|---|
| 1 | Registro de `ana@ejemplo.com` / `Prueba123` → `201`, y el pedido siguiente ya la reconoce con su nombre («Ana Rodríguez»). |
| 2 | Cerrar sesión → `204`, y después `GET /api/yo` → `401`. Volver a entrar con las mismas credenciales → `200`. |
| 3 | `ana@ejemplo.com` / `Prueba124` → `401 {"error":"credenciales_invalidas"}`. |
| 4 | `noexiste@ejemplo.com` / `Prueba123` → `401 {"error":"credenciales_invalidas"}`: estado y cuerpo **idénticos** al del punto 3, comparados carácter por carácter. |
| 5 | Registrar otra vez `ana@ejemplo.com` → `409 {"error":"correo_ya_registrado"}`. |
| 6 | Apagada y vuelta a levantar la aplicación, `ana@ejemplo.com` / `Prueba123` entra igual → `200`. |
| 7 | Lo guardado en `cliente.contrasena_cifrada` es `6a45b043aae1f372871ff9f25ebec55b:421a931ee31f4…` (sal y huella). No es `Prueba123` ni lo contiene. Leído del archivo SQLite real, no de la memoria de la aplicación. |
| 8 | `personal@ejemplo.com` / `Personal123` → `200` con `tipo: "personal"`. |

Además, sobre la interfaz: la página se sirve en `/` con las dos formas (entrar y crear cuenta), el
CSS compilado se sirve en `/css/estilos.css`, la tipografía Manrope se sirve desde el propio
proyecto (`/fuentes/manrope-latin.woff2`, sin pedirle nada a internet), y los estilos son
**mobile-first**: los 8 bloques `@media` del CSS generado son todos `min-width`, ninguno
`max-width`. Los estilos siguen `VISUALS.md`, el sistema visual «Clinical Excellence» que entró al
proyecto ese mismo día (ver `DISENO.md`, «El sistema visual»).

**Revisión visual en el navegador — hecha por la estudiante el 2026-08-17.** Todo lo de arriba se
comprobó por HTTP y leyendo la base, así que faltaba que alguien mirara la página dibujada. La
estudiante abrió `http://localhost:3000`, hizo a mano los pasos 1, 2, 3, 4, 5 y 8, y confirmó que
**todos pasan**: el saludo dice su nombre, y en los pasos 3 y 4 aparece el mismo texto «correo o
contraseña incorrectos» en los dos casos. Confirmó además el «ojito» de las contraseñas y que en
pantalla angosta las tarjetas se acomodan una debajo de otra.

**Con eso la pieza 1 queda CERRADA.**

**Se agregó también un pie de página**, a pedido de la estudiante después de cerrar la pieza, con
**texto de relleno inventado**: «© 2026 Belleza y Bienestar». No cambia ninguna condición de
aceptación de la pieza. El menú de navegación y el botón «hamburguesa» que van ahí quedaron
pendientes hasta que existan secciones que enlazar — anotados en `DISENO.md`, «Pendientes del
sistema visual».

**Lo que se agregó durante la construcción y no estaba en el encargo:** el **«ojito»** que muestra y
oculta la contraseña en todo campo de contraseña, pedido por la estudiante ese mismo día. No se
agrega campo por campo: una función recorre la página y se lo pone a todos los
`input[type="password"]`, así que las pantallas de contraseña de las piezas 7 y 9 lo van a heredar
solas. Quedó como convención en `CLAUDE.md`. *No tiene prueba automática:* comprobarlo exigiría
instalar un navegador simulado, y eso contradice la decisión de cero dependencias extra de
`DISENO.md`. Se comprobó mirando la pantalla.

---

### Pieza 2: Elegir servicio y proveedor, y ver el calendario

Es un solo recorrido: el cliente no puede ver un calendario sin haber elegido antes para qué
servicio y con quién. Acá vive el cálculo de disponibilidad, que es la parte más delicada del
proyecto — `PROYECTO.md` §7.6 pide justamente vigilar que la lógica de calendario no parezca
correcta y falle en los casos borde.

**Qué tiene que ser cierto**
- El cliente que entró ve los servicios del negocio, cargados de la configuración (RF-5).
- Al elegir un servicio, ve sus proveedores y elige con cuál quiere atenderse (RN-8).
- **Todo servicio del negocio ofrece al menos dos proveedores.** *(Decisión de la estudiante el
  2026-08-19: si un servicio tuviera uno solo, «elegir» no significaría nada. El plan se adapta a
  esta decisión, no al revés.)* El sistema **igual sabe manejar** un servicio con un solo proveedor
  —diciendo quién es, como pide RN-8—, porque nada impide que el negocio cargue uno así mañana; eso
  quedó cubierto por una prueba automática que se crea su propio servicio de un proveedor único.
- Elegidos servicio y proveedor, ve un calendario **mensual**, navegable mes a mes, que distingue
  los horarios libres de los que no lo están (RF-6).
- Un horario aparece libre **solo si** cae dentro del horario del negocio, no cae en el almuerzo,
  no es feriado, es de mañana en adelante, y no hay ninguna cita activa de ese proveedor ahí
  (RF-7).
- El horario del negocio es lunes a viernes de 9:00 a 18:00 con almuerzo bloqueado de 12:00 a
  13:00, y sábados de 9:00 a 13:00. Domingo cerrado. Como cada cita dura una hora, entre semana los
  horarios son 9, 10, 11, 13, 14, 15, 16 y 17; el sábado son 9, 10, 11 y 12 (RN-3).
- Los feriados de ley de Costa Rica están precargados y no ofrecen ningún horario (RN-2).
- Hoy y el pasado nunca ofrecen horarios (RN-4).
- Si no hay **ningún** horario libre en los próximos 7 días, el cliente ve el aviso que le sugiere
  revisar más adelante (RF-10, RN-14).
- Todavía no se reserva nada: el calendario solo muestra.

**Con qué se comprueba**

Datos de prueba *(los del 2026-08-18; la pieza 11 agregó dos tipos de masaje más y las categorías
que los agrupan — ver su bloque *Produce*)*: dos servicios («Masaje relajante» y «Limpieza facial»),
tres proveedores («Ana»,
«Carlos» y «Luisa»). Ana atiende los dos servicios, Carlos solo el masaje y Luisa solo la limpieza
facial. Todo inventado. *(Al escribir el plan había solo dos proveedores y la limpieza facial la
atendía solo Ana. **La estudiante agregó a Luisa el 2026-08-19**, con la pieza ya construida, con
esta razón: con una sola proveedora el cliente no elegía nada, y elegir con quién lo atienden es
justamente lo que RN-8 le da. El caso «un servicio con un solo proveedor», que era lo que la
limpieza facial cubría, **no se perdió**: pasó a una prueba automática que se crea su propio
servicio de un solo proveedor, así queda protegido aunque los datos de demostración cambien.)*

1. Entrar como cliente y ver los dos servicios en pantalla. *(Corregido el 2026-08-19 por la pieza
   11: ahora el paso 1 muestra las **categorías** —«Masaje» y «Facial»— y los servicios aparecen al
   elegir una. La comprobación se hizo tal como está escrita el 2026-08-18, cuando el catálogo era
   plano; su evidencia de ese día sigue siendo válida y no se toca. Lo que la pieza 11 comprueba está
   en sus propias comprobaciones 1 a 4.)*
2. Elegir «Masaje relajante»: aparecen Ana y Carlos. Elegir «Limpieza facial»: aparecen Ana y
   Luisa, y **no** aparece Carlos.
3. Elegir masaje con Ana y ver el calendario del mes en curso.
4. Contar los horarios de un miércoles cualquiera sin citas: son 8, y **no** está el de las 12:00.
5. Contar los de un sábado sin citas: son 4, y el último es el de las 12:00.
6. Mirar un domingo: no ofrece ningún horario.
7. Mirar el día de hoy: no ofrece ningún horario, ni siquiera los de la tarde.
8. Mirar mañana: sí ofrece horarios.
9. Mirar el 15 de setiembre (feriado de ley en Costa Rica): no ofrece ninguno.
10. Navegar al mes siguiente y volver al anterior: los días cambian con el mes y el bloqueo del
    almuerzo se sigue respetando en ambos.
11. Insertar a mano en la base una cita activa de Ana para mañana a las 10:00, recargar el
    calendario: el horario de las 10:00 de mañana ya no aparece libre, y el de Carlos a las 10:00
    sí sigue libre.
12. Cargar en la configuración un horario de negocio vacío (o marcar los próximos 7 días como
    feriados) y recargar: aparece el aviso de que no hay horarios disponibles.

**Toca:** Catálogo, Calendario y disponibilidad, Interfaz.

**Interfaces**
- *Consume:* `GET /api/yo` y la sesión abierta de la pieza 1.
- *Produce:*
  - Tablas `servicio` (id, nombre, duracion_minutos), `proveedor` (id, nombre) y
    `servicio_proveedor` (servicio_id, proveedor_id).
  - La configuración del negocio, en **tres** tablas: `configuracion_negocio` (id, nombre,
    telefono, ubicacion, logo, color_principal, color_secundario), `horario_negocio` (id,
    dia_semana, hora_inicio, hora_fin) y `feriado` (id, fecha, nombre). *(El plan decía una sola
    tabla `configuracion_negocio` con «horario semanal, feriados, ubicación, logo, colores»
    adentro. Se separó en tres al construir la pieza: el horario son varias filas y los feriados
    muchas más, y meterlos en una sola fila los volvería un texto que nadie puede mirar ni corregir
    con un visor de SQLite — justo lo que pide la comprobación 12. `nombre` y `telefono` los agregó
    la estudiante el 2026-08-18: la razón está en REG-4 de `ESPECIFICACION.md`. La razón completa
    de las tres tablas está en `DISENO.md`, «Decisiones tomadas al construir la pieza 2».)*
  - `dia_semana` va de 0 (domingo) a 6 (sábado), y `hora_inicio`/`hora_fin` son la hora del día en
    número. Cada día tiene **un tramo por cada rato que el negocio atiende**: entre semana son dos
    (9–12 y 13–18) y el almuerzo es el hueco entre ellos; el sábado uno (9–13); el domingo ninguno.
  - **La tabla `cita` se crea acá, vacía**, con las columnas exactas que fija el bloque *Produce*
    de la pieza 3. *(No estaba previsto: la comprobación 11 de esta pieza exige insertar a mano una
    cita activa y ver que su horario deja de aparecer libre, y sin la tabla esa comprobación no se
    puede correr. La pieza 2 solo lee de ella; crear citas sigue siendo trabajo de la pieza 3.)*
  - `GET /api/servicios` — devuelve `[{id, nombre, duracionMinutos}]`; `401` si no hay sesión.
  - `GET /api/servicios/:servicioId/proveedores` — devuelve `[{id, nombre}]`; `401` si no hay
    sesión y `404` si el servicio no existe.
  - `GET /api/disponibilidad?servicioId=&proveedorId=&mes=YYYY-MM` — devuelve
    `{mes, dias: [{fecha, esFeriado, nombreFeriado, estado, horarios: [{inicio, disponible}]}], hayHorariosEnProximos7Dias}`,
    donde `inicio` es la fecha y hora de inicio del horario en formato ISO **con el desfase de
    Costa Rica escrito**: `2026-09-16T10:00:00-06:00`. Devuelve `401` si no hay sesión, `422` con
    `{error: "datos_incompletos"}` si falta o viene mal alguno de los tres parámetros, y `404` si
    ese proveedor no atiende ese servicio.
  - `estado` de cada día vale `"cerrado"` (el negocio no abre ese día de la semana), `"feriado"`,
    `"hoy_o_pasado"` (RN-4), `"lleno"` (abre, pero no queda ningún horario libre) o
    `"con_horarios"`. *(Se agregó al construir la pieza: el frontend no decide reglas de negocio
    —`DISENO.md`, límite del componente Interfaz—, así que el servidor le tiene que decir **por
    qué** un día no ofrece nada, en vez de dejarlo deducir.)*
  - `hayHorariosEnProximos7Dias` mira **siempre los 7 días que siguen a hoy**, sin importar qué mes
    se esté viendo: es la regla RN-14, que no habla del mes en pantalla sino de lo que viene.
  - `GET /api/negocio` — devuelve `{nombre, telefono, ubicacion, logo, colorPrincipal, colorSecundario}`.
    **Se lee sin sesión**, porque el pie de página muestra el nombre también en la pantalla de
    entrar. *(Endpoint agregado al construir la pieza: la configuración del negocio existía en el
    plan como tabla, pero no había forma de que la pantalla la leyera.)*
  - La función de disponibilidad, que es la que toda pieza posterior consulta para saber si un
    horario se puede tomar. Vive en `servidor/disponibilidad.js` y recibe **el momento actual como
    dato**, no lo averigua sola: así las pruebas pueden pararse en un miércoles, en un sábado o en
    un feriado concreto y comprobar siempre lo mismo, sin depender del día en que se corran.
  - **La hora del negocio es la de Costa Rica (UTC−6), escrita en el código**, no la de la máquina
    donde corra el servidor. Toda pieza posterior que pregunte «¿qué día es hoy?» usa esa.

**Evidencia**

*Construida el 2026-08-18.*

**Pruebas automáticas — `npm test`: 41 pruebas, 41 pasan, 0 fallan.** De esas, **27 son nuevas de
esta pieza** (las otras 14 son las de la pieza 1, que siguen pasando). Se escribieron antes del
código y **se vieron fallar primero**: la corrida previa a escribir una sola línea dio «tests 40,
pass 14, fail 26», o sea que las 26 que existían entonces fallaban todas. Viven en
`pruebas/catalogo.test.js` (8) y `pruebas/disponibilidad.test.js` (19). *(La número 27 se agregó el
2026-08-19, al sumarse Luisa: es la que protege el caso de un servicio con un solo proveedor.)*

Las del calendario **paran el reloj** en el martes 1 de setiembre de 2026 a las 8 de la mañana de
Costa Rica. Sin eso, «mañana hay horarios» fallaría los sábados y «el 15 de setiembre es feriado»
dejaría de tener sentido cuando esa fecha quede en el pasado: una prueba que dice cosas distintas
según el día en que se corre no comprueba nada.

Cubren, además de las 12 comprobaciones de abajo: que sin sesión no se ve ni el catálogo ni el
calendario, que un mes mal escrito se rechaza, que un proveedor que no atiende ese servicio da
`404`, que **una cita cancelada no ocupa el horario** (RN-7, que la pieza 5 va a necesitar), que
**febrero de 2028 trae sus 29 días** (el caso borde clásico del cambio de mes que `PROYECTO.md`
§7.6 manda vigilar), que el desfase de Costa Rica va escrito en cada horario, y que
`GET /api/negocio` —que se lee sin sesión— no filtra ningún correo ni nada de las contraseñas.

**Las 12 comprobaciones de arriba, corridas contra la aplicación escuchando en
`http://localhost:3000` y sobre la base real `datos/reservas.sqlite`**, el 2026-08-18 (que para el
negocio fue un martes):

| # | Resultado |
|---|---|
| 1 | `GET /api/servicios` → `200` con **«Masaje relajante» y «Limpieza facial»**, los dos de 60 minutos. Sin sesión el mismo pedido da `401`. |
| 2 | Masaje relajante → **Ana y Carlos**. Limpieza facial → **Ana y Luisa**, sin Carlos. |
| 3 | Calendario de `2026-08` → `200`, `mes: "2026-08"`, **31 días**. |
| 4 | Miércoles 2026-08-19 sin citas: **8 horarios**, los 8 libres, en las horas `09:00 10:00 11:00 13:00 14:00 15:00 16:00 17:00`. **Las 12:00 no aparecen**: es el almuerzo. |
| 5 | Sábado 2026-08-22: **4 horarios** (`09:00 10:00 11:00 12:00`), y **el último es el de las 12:00**. |
| 6 | Domingo 2026-08-23: **0 horarios**, `estado: "cerrado"`. |
| 7 | Hoy 2026-08-18: **0 horarios libres**, `estado: "hoy_o_pasado"` — a las 8 de la mañana, con los de la tarde todavía por delante. *(El API sí devuelve los 8 horarios del día, todos con `disponible: false`, porque las piezas siguientes los van a necesitar. **En pantalla no se dibuja ninguno:** hoy solo muestra el mensaje de que no se puede reservar para hoy y a qué número llamar — pedido de la estudiante el 2026-08-19. Así la pantalla dice exactamente lo que esta comprobación pide: «no ofrece ningún horario, ni siquiera los de la tarde».)* |
| 8 | Mañana 2026-08-19: **8 horarios libres**, `estado: "con_horarios"`. |
| 9 | 2026-09-15: `esFeriado: true`, `nombreFeriado: "Día de la Independencia"`, **0 libres**, `estado: "feriado"`. Es martes, o sea que sin el feriado habría sido un día hábil normal. *(Igual que hoy, en pantalla **no se dibuja ninguna ficha de horario**: solo el mensaje «Feriado: Día de la Independencia. El negocio no atiende» — pedido de la estudiante el 2026-08-19.)* |
| 10 | Al mes siguiente: `2026-10` → **31 días**, y el miércoles 2026-10-07 sigue con `09:00 10:00 11:00 13:00 14:00 15:00 16:00 17:00` — **el almuerzo se respeta también ahí**. Al volver: `mes: "2026-08"`, 31 días, sin mezcla. |
| 11 | Insertada a mano en la base una cita **activa** de Ana para 2026-08-19 a las 10:00: el horario de las **10:00 de Ana pasa a `disponible: false`** y los otros 7 del día siguen libres. El de **Carlos a las 10:00 sigue libre** (8 de 8): la cita de una proveedora no ocupa la agenda de la otra. |
| 12 | Marcados como feriado los 7 días siguientes a hoy: `hayHorariosEnProximos7Dias` pasa de `true` a **`false`**, que es el dato con el que la pantalla muestra el aviso de RN-14. Después se quitaron esos 7 feriados de prueba y volvió a `true`. La otra mitad —dejar el horario del negocio vacío— está cubierta por una prueba automática. |

Además: la página se sirve en `/` (8.085 bytes), el CSS compilado en `/css/estilos.css` (11.083
bytes) y el JavaScript del navegador en `/aplicacion-cliente.js` (18.190 bytes), los tres con
`200`. Los estilos siguen siendo **mobile-first**: los **12** bloques `@media` del CSS generado son
todos `min-width`, ninguno `max-width` (los dos `max-width` que aparecen en el archivo son anchos
de contenedor, no cortes de pantalla).

**Lo que se decidió durante la construcción y no estaba escrito** *(las nueve decisiones están en
`DISENO.md`, «Decisiones tomadas al construir la pieza 2», con sus alternativas y su razón)*:

- **La hora del negocio es la de Costa Rica (UTC−6), escrita en el código**, no la de la máquina.
- **Tres tablas de configuración** en vez de una, y **`nombre` y `telefono` agregados** al negocio
  — decisión de la estudiante, que obligó a corregir REG-4 de `ESPECIFICACION.md` y `DISENO.md`
  **antes** de escribir el código.
- **Los feriados van en su fecha original, sin trasladarse al lunes**, y se cargan 2026 y 2027 —
  decisión de la estudiante. La lista completa, y los dos feriados que quedaron afuera con su
  razón, están en `guiones/datos-de-prueba.js`.
- **La tabla `cita` se crea en esta pieza**, vacía, porque la comprobación 11 la necesita.
- **La aplicación recibe el reloj como dato**, para que las pruebas puedan pararlo.
- **El calendario es una cuadrícula del mes y los horarios se abren al tocar un día** — decisión de
  la estudiante.
- **El menú del pie y la hamburguesa se posponen a la pieza 3** — decisión de la estudiante: esta
  pieza trae un solo recorrido en pasos, no secciones distintas que enlazar.
- **El pie de página ya no tiene texto de relleno**: el nombre, el teléfono y la ubicación salen de
  `GET /api/negocio`. Siguen siendo datos inventados, pero ahora son un dato del sistema.
- **Un día entero bloqueado no dibuja fichas de horario, solo el mensaje del motivo** — pedido de la
  estudiante el 2026-08-19, ya construida la pieza. Aplica a **hoy** y a los **feriados**: en los
  dos casos el día completo está fuera de juego, y ocho fichas tachadas que nadie puede tomar solo
  estorban. **El API no cambió**: sigue devolviendo los horarios con `disponible: false`, porque las
  piezas siguientes los necesitan; lo que cambió es solo lo que la pantalla dibuja. Los días donde
  se ocuparon algunos horarios sí siguen mostrando cuáles están tomados, que es lo que RF-6 pide
  distinguir.

**Revisión visual en el navegador — hecha por la estudiante el 2026-08-19.** Todo lo de arriba se
comprobó por HTTP y leyendo la base, así que faltaba que alguien mirara la página dibujada. La
estudiante abrió `http://localhost:3000`, recorrió los tres pasos y el calendario, y **encontró dos
defectos que ninguna de las 41 pruebas automáticas podía detectar** —las pruebas hablan con el API y
ninguna mira la pantalla—:

1. **La cuadrícula del mes se salía de su tarjeta** en pantalla angosta: la columna del domingo
   quedaba cortada por el borde derecho. Causa: las 7 columnas estaban escritas como `1fr`, que
   además de repartir el ancho promete que una columna no se encoge más allá de lo que su contenido
   necesita — y como cada casilla era cuadrada con 44px de alto mínimo, las 7 exigían 332px que la
   tarjeta no tenía. Arreglado con `minmax(0, 1fr)`.
2. **Las fichas de horario no quedaban alineadas entre filas.** Causa: estaban acomodadas una al
   lado de la otra, así que cada una medía según su texto, y «11:00» es más angosto que «09:00»
   porque el 1 ocupa menos que el 0. Arreglado pasándolas a cuadrícula de 4 columnas en teléfono y
   8 desde tableta, más números de ancho fijo.

Las dos correcciones dejaron su regla escrita para las piezas siguientes: **toda cuadrícula de ancho
repartido se escribe `minmax(0, 1fr)`**, anotado en `CLAUDE.md`. El detalle completo de los dos
hallazgos está en la entrada del 2026-08-19 de `BITACORA.md`.

Corregido eso, la estudiante confirmó las comprobaciones en pantalla. **Con eso la pieza 2 queda
CERRADA.**

---

### Pieza 3: Reservar un horario

Acá se monta también la **integración continua**: las pruebas automáticas nacen con la primera
regla que hay que proteger, no después.

**Qué tiene que ser cierto**
- El cliente elige un horario libre del calendario, confirma, y queda una cita **activa** guardada
  (RF-8).
- La cita guarda cliente, servicio, proveedor, fecha y hora de inicio, estado, fecha de creación y
  canal `"en_linea"` (REG-1, RN-12).
- Ese horario deja de aparecer libre en el calendario de inmediato.
- Dos intentos de tomar el mismo horario del mismo proveedor: **exactamente uno** crea la cita, y
  el otro recibe el aviso de que ya no está disponible (RF-9, RN-1, CA-1).
- Un intento de reservar un horario de hoy se rechaza, sin importar la hora a la que se intente
  (RN-4, CA-2).
- Un cliente puede tener varias citas activas al mismo tiempo (RN-16).
- El cliente ve sus citas activas en pantalla.
- Existen pruebas automáticas para CA-1 y CA-2, y **corren solas en cada push** al repositorio.

**Con qué se comprueba**
1. Entrar como cliente, elegir masaje con Ana, tomar el horario de mañana a las 10:00, confirmar: la
   pantalla muestra la cita creada.
2. Volver al calendario: el horario de mañana a las 10:00 ya no aparece libre.
3. Apagar y levantar la aplicación: la cita sigue ahí.
4. Reservar además el de mañana a las 14:00 con el mismo cliente: se crea, y quedan dos citas
   activas.
5. Correr la prueba automática de CA-1: dispara dos reservas del mismo horario a la vez; pasa si
   una crea la cita y la otra recibe `409`.
6. Correr la prueba automática de CA-2: pide reservar un horario de hoy; pasa si recibe `422`.
7. Hacer un push al repositorio y ver, en la pestaña de acciones de GitHub, que las dos pruebas
   corrieron y quedaron en verde.

**Toca:** Reservas, Calendario y disponibilidad, Interfaz.

**Interfaces**
- *Consume:* `GET /api/disponibilidad`, `GET /api/servicios`,
  `GET /api/servicios/:servicioId/proveedores` y la sesión, de las piezas 1 y 2.
- *Produce:*
  - Tabla `cita` (id, cliente_id, servicio_id, proveedor_id, inicio, estado, creada_en, canal,
    personal_id_creador, cancelada_en, cancelada_por, cerrada_en, cerrada_por). Los últimos cinco
    campos quedan vacíos en esta pieza; las piezas 5, 7 y 8 los llenan.
  - `estado` vale `"activa"`, `"cancelada"`, `"completada"` o `"no_asistio"`. En esta pieza solo se
    crea `"activa"`.
  - `canal` vale `"en_linea"` o `"asistida"`. En esta pieza solo se crea `"en_linea"`.
  - Un **índice único parcial** sobre `cita (proveedor_id, inicio)`, solo `WHERE estado = 'activa'`.
    Es la garantía de CA-1: hace que la segunda inserción del mismo horario sea imposible, no
    improbable. Es parcial para que una cita cancelada no bloquee su horario para siempre (RN-7).
  - `POST /api/citas` — recibe `{servicioId, proveedorId, inicio}`; devuelve `201` con
    `{id, servicioId, proveedorId, inicio, estado, canal}`; devuelve `409` con
    `{error: "horario_no_disponible"}` si otro ya lo tomó, y `422` con `{error: "mismo_dia"}` si el
    horario es de hoy o del pasado.
  - `GET /api/citas` — devuelve las citas del cliente en sesión, **ordenadas por fecha de inicio**:
    `[{id, servicio, proveedor, inicio, estado}]`. No filtra por estado: en esta pieza todas son
    `"activa"`, y las piezas 5 y 8 necesitan que las canceladas y las cerradas también salgan.
  - La configuración de integración continua que corre las pruebas en cada push. **Vive en la raíz
    del repositorio**, en `.github/workflows/pruebas.yml`, y no dentro de `proyectoFinal/`: GitHub
    solo ejecuta los archivos que están ahí. Autorizado por la estudiante el 2026-08-19, porque es
    la única excepción a la regla de no tocar nada fuera de la carpeta del día.

*Tres correcciones al bloque de arriba, hechas al construir la pieza el 2026-08-19, con su razón —
en vez de reescribirlo en silencio:*

1. **Se agregó el índice único parcial.** El bloque original nombraba la tabla y los endpoints, pero
   no decía **cómo** se cumple CA-1. Sin el índice, «comprobar que está libre» y «insertar» son dos
   movimientos y entre los dos cabe la reserva de otra persona.
2. **Se agregó qué pasa con la sesión de Personal:** los dos endpoints la rechazan con `403` y
   `{error: "solo_clientes"}`. El bloque original no lo decía, y las dos cuentas de la pieza 1
   tienen sesión: sin el rechazo, la cita quedaría guardada con el id de Personal en la columna
   `cliente_id`, que es el id de **otra persona** de la tabla `cliente`. Reservar en nombre de quien
   llama es la pieza 7, con su propio recorrido.
3. **Se fijó que `409 horario_no_disponible` cubre todos los rechazos que no son RN-4:** feriado,
   domingo, hora del almuerzo, hora inventada. El bloque original solo hablaba de «si otro ya lo
   tomó»; no decía qué contestar en los demás casos, y el nombre del error ya los describe. La razón
   completa, con sus alternativas, está en `DISENO.md`, «Decisiones tomadas al construir la pieza 3».

**Evidencia**

*Construida el 2026-08-19.*

**Pruebas automáticas — `npm test`: 64 pruebas, 64 pasan, 0 fallan.** De esas, **23 son nuevas de
esta pieza** (las otras 41 son las de las piezas 1 y 2, que siguen pasando). Se escribieron antes del
código y **se vieron fallar primero**: la corrida previa a escribir una sola línea del servidor dio
«tests 64, pass 41, fail 23», o sea que las 23 nuevas fallaban todas, con el error de que
`POST /api/citas` devolvía la página web en vez de una respuesta del API — porque el endpoint no
existía. Viven en `pruebas/reservas.test.js`.

Paran el reloj en el mismo momento que las de la pieza 2 —martes 1 de setiembre de 2026, 8 de la
mañana de Costa Rica—, así que «reservar mañana a las 10» y «hoy no se puede» comprueban siempre lo
mismo, corran el día que corran.

Cubren, además de las comprobaciones de abajo: que sin sesión no se puede reservar ni ver citas
(`401`), que **la sesión de Personal se rechaza** con `403` y no queda ninguna cita guardada, que las
citas de un cliente son solo las suyas, que **un horario cuya cita se canceló se puede volver a
tomar** (RN-7, y es lo que demuestra que el candado de CA-1 mira solo las citas activas), que se
rechazan los horarios de feriado, de domingo, de la hora del almuerzo y de las 3 de la mañana, que un
momento escrito de otra forma —`Z` en vez de `-06:00`, `10:30`, texto suelto— se rechaza sin
intentar interpretarlo, y que un proveedor que no atiende ese servicio da `404`.

**Las 7 comprobaciones de arriba, corridas contra la aplicación escuchando en
`http://localhost:3000` y sobre la base real `datos/reservas.sqlite`**, el 2026-08-19 (que para el
negocio fue un miércoles, así que «mañana» fue el jueves 2026-08-20):

| # | Resultado |
|---|---|
| 1 | `POST /api/citas` con el masaje, Ana y `2026-08-20T10:00:00-06:00` → **`201`** con `{"id":1, "servicioId":1, "proveedorId":1, "inicio":"2026-08-20T10:00:00-06:00", "estado":"activa", "canal":"en_linea"}`. `GET /api/citas` la devuelve con los **nombres**: «Masaje relajante», «Ana». En la fila guardada, `creada_en` quedó con la hora del negocio y `personal_id_creador`, `cancelada_en`, `cancelada_por`, `cerrada_en` y `cerrada_por` quedaron **vacías**, como manda el bloque *Produce*. **La mitad visual —que la pantalla muestre la cita creada— queda para la revisión de la estudiante.** |
| 2 | Vuelto a pedir el calendario de `2026-08`: el jueves 20 quedó `09:00 libre · 10:00 TOMADO · 11:00 libre · 13:00 libre · 14:00 TOMADO · 15:00 libre · 16:00 libre · 17:00 libre`. **Sin recargar nada ni reiniciar:** el mismo pedido, un segundo después de reservar. |
| 3 | Aplicación apagada (matando el proceso que escuchaba en el 3000) y vuelta a levantar con `npm start`: **las dos citas siguen ahí**, con su día, su hora, su servicio y su proveedor. *(La sesión sí se cerró en el reinicio, y eso es lo esperado: sin un `.env` con `SESION_SECRETO`, la firma de la galleta se reinventa en cada arranque — decisión de la pieza 1. Se volvió a entrar con la contraseña y las citas estaban.)* |
| 4 | Reservado además `2026-08-20T14:00:00-06:00` con el mismo cliente → **`201`**, y `GET /api/citas` devuelve **las dos**, ordenadas por hora. RN-16 cumplida: nadie le impuso un máximo. |
| 5 | **CA-1.** La prueba automática dispara las dos reservas del mismo horario con `Promise.all`, sin que ninguna espere a la otra: **una recibe `201` y la otra `409 horario_no_disponible`**, y en la base queda **exactamente 1** cita activa para ese horario. Se comprobó además, aparte de la prueba, que **el candado es de la base y no del código**: insertando dos veces a mano la misma cita activa, la segunda se estrella contra `SQLITE_CONSTRAINT_UNIQUE`; y después de pasar la primera a `cancelada`, el horario se puede volver a tomar. |
| 6 | **CA-2.** La prueba automática pide reservar un horario de hoy → **`422 mismo_dia`**, y lo prueba con **los ocho horarios del día**, no con uno: «sin importar la hora a la que se intente», como dice el criterio. Comprobado también contra la aplicación de verdad: `2026-08-19T15:00:00-06:00` → `422 mismo_dia`. Un horario de ayer da lo mismo. |
| 7 | **PENDIENTE.** Necesita un push al repositorio, y el push se hace cuando la estudiante lo pide. La configuración ya está escrita en `.github/workflows/pruebas.yml` (en la raíz del repositorio, autorizado el 2026-08-19). Esta comprobación se cierra mirando la pestaña **Actions** de GitHub después del push. |

**Revisión visual — hecha por la estudiante el 2026-08-19.** Abrió `http://localhost:3000`, recorrió
la lista de comprobaciones visuales de `PROXIMA-SESION.md` y **confirmó que la pieza se ve y funciona
como corresponde: no salió ningún defecto nuevo.** Con eso quedan cubiertas las mitades de pantalla de
las comprobaciones 1, 2 y 4, que ninguna prueba automática puede ver. La revisión se hizo sobre la
pantalla **ya con el paso de categorías** que agregó la pieza 11, así que cubre el recorrido tal como
quedó y no el que existía antes.

**Con esto la pieza 3 queda CONSTRUIDA y con 6 de sus 7 comprobaciones cerradas.** Falta solo la
**comprobación 7**, que no se puede cerrar sin haber hecho el push y haber visto el resultado en la
pestaña Actions de GitHub. El push se hizo el 2026-08-19, a pedido de la estudiante; el resultado se
anota acá abajo cuando ella lo confirme, porque **el agente no tiene forma de mirar esa pestaña**.

**Lo que se construyó además, y no era parte del encargo de la pieza:**

- **El menú de navegación y el botón «hamburguesa»**, que estaban anotados como pendientes en
  `DISENO.md` justamente para esta pieza, porque es la que trae la primera sección de verdad («Mis
  citas»). La hamburguesa quedó en la barra azul del encabezado y no en el pie, decidido por la
  estudiante. **El botón «Cerrar sesión» se mudó adentro del menú y pasó a llamarse «Salir»**, en la
  revisión visual del mismo día: ahora que hay menú, salir es una opción de navegación como las
  otras, y el saludo vuelve a ser solo el saludo.
- **`servidor/catalogo.js`, un archivo nuevo.** Las dos preguntas «¿existe este servicio?» y «¿este
  proveedor lo atiende?» estaban escritas adentro del archivo de rutas de la pieza 2, y esta pieza
  necesitaba las mismas respuestas antes de guardar una cita. Se movieron a un solo lugar en vez de
  copiarlas, que es la regla del `CLAUDE.md`.

**Dos defectos que la construcción destapó, los dos arreglados:**

1. **El atributo `hidden` no estaba escondiendo nada** en las tarjetas ni en los pasos. `.paso` y
   `.tarjeta` dicen `display: flex`, y una regla escrita por nosotros le gana a la regla del
   navegador que esconde lo marcado con `hidden`: así, «2 Elegí quién te atiende» y la tarjeta del
   detalle del día se veían desde el arranque, vacías. Arreglado con una sola regla, `[hidden] {
   display: none !important }`, el único `!important` del archivo. **Ninguna de las 64 pruebas podía
   detectarlo:** todas hablan con el API y ninguna mira la página dibujada.
2. **`better-sqlite3` exigía Node 22**, y el `README.md` promete Node 20. La promesa era falsa desde
   la pieza 1 y no se había notado porque en la máquina de la estudiante corre Node 24. Lo destapó
   montar la integración continua. Se bajó la dependencia a `^12.11.1`, que soporta Node 20 a 26, y
   las 64 pruebas siguen pasando. La integración continua ahora corre en **Node 20 y Node 24**, así
   que la promesa del README quedó comprobada en cada push en vez de solamente escrita.

---

### Pieza 4: Correo de confirmación

**Qué tiene que ser cierto**
- Al confirmarse una reserva, al cliente le llega un correo con la fecha, la hora, el servicio, el
  proveedor y la ubicación del negocio (RF-11).
- Cada envío queda registrado con destinatario, cita, tipo, fecha y si tuvo éxito (REG-3).
- Si el envío falla, se reintenta; si sigue fallando queda registrado como fallido, **y la cita
  sigue siendo válida** (RF-19).
- Que el correo falle nunca impide crear la cita.

**Con qué se comprueba**
1. Reservar una cita con una dirección de correo real de prueba y ver que el correo llega, con los
   cinco datos completos y correctos.
2. Mirar la tabla de correos enviados: hay una fila con tipo `confirmacion`, la cita correcta y
   éxito verdadero.
3. Poner a propósito una clave inválida del servicio de correo, reservar otra cita, y comprobar
   dos cosas: **la cita se creó igual**, y la fila del correo quedó con éxito falso.
4. Devolver la clave correcta y reservar de nuevo: vuelve a llegar.

**Toca:** Notificaciones, Reservas.

**Interfaces**
- *Consume:* `POST /api/citas` de la pieza 3; los datos de servicio, proveedor y ubicación del
  negocio de la pieza 2; el nombre y correo del cliente de la pieza 1.
- *Produce:*
  - Tabla `correo_enviado` (id, destinatario_correo, cliente_id, cita_id, tipo, enviado_en, exito).
    `cita_id` queda vacío para los correos que no son de una cita.
  - `tipo` vale `"confirmacion"`, `"recordatorio"` o `"recuperacion"`. En esta pieza solo se crea
    `"confirmacion"`.
  - La función de envío de correo que las piezas 6 y 9 reutilizan, con la plantilla y el registro
    ya resueltos.

**Evidencia**

---

### Pieza 5: Cancelar y reagendar

**Qué tiene que ser cierto**
- El cliente ve sus citas activas y puede cancelarlas si faltan **4 horas o más** (RF-13).
- Al cancelar, el horario queda libre de inmediato para cualquier otro cliente (RN-7).
- La cita cancelada **no se borra**: cambia de estado y guarda cuándo se canceló y quién la canceló
  (RF-20, RN-15, REG-1).
- El cliente puede reagendar a otro horario libre **del mismo servicio y el mismo proveedor**; el
  horario viejo se libera y el nuevo se ocupa (RF-14, RN-18).
- Reagendar no permite cambiar de servicio ni de proveedor: para eso hay que cancelar y reservar de
  nuevo (RN-18).
- Un intento de cancelar o reagendar faltando **menos de 4 horas** se rechaza, con un mensaje que
  le dice al cliente que llame al negocio (RF-15, RN-5, CA-3 parte cliente).
- Si al reagendar el proveedor no tiene ningún horario libre en los próximos 7 días, aparece el
  aviso de RN-14.

**Con qué se comprueba**
1. Reservar una cita para dentro de varios días, cancelarla, y ver que desaparece de las citas
   activas.
2. Volver al calendario: ese horario está libre otra vez.
3. Mirar la tabla de citas: la fila sigue existiendo, con estado `cancelada`, la fecha de
   cancelación y `cancelada_por` = el cliente.
4. Reservar otra para dentro de varios días y reagendarla a otro horario libre del mismo proveedor:
   el nuevo queda ocupado y el viejo libre.
5. Abrir la pantalla de reagendar y comprobar que **no** ofrece cambiar de servicio ni de
   proveedor.
6. Insertar a mano una cita activa que empiece dentro de 2 horas e intentar cancelarla desde la
   aplicación: se rechaza, con el mensaje de llamar al negocio.
7. Intentar reagendar esa misma cita: se rechaza igual.
8. Correr la prueba automática de CA-3 (parte cliente): una cita a menos de 4 horas, cancelada por
   el cliente, devuelve `422`. Pasa en verde en el push.

**Toca:** Reservas, Calendario y disponibilidad, Interfaz.

**Interfaces**
- *Consume:* `GET /api/citas` y `POST /api/citas` de la pieza 3; `GET /api/disponibilidad` de la
  pieza 2.
- *Produce:*
  - `DELETE /api/citas/:citaId` — cancela; devuelve `204`; devuelve `422` con
    `{error: "ventana_de_cancelacion"}` si faltan menos de 4 horas y quien pide es un cliente.
  - `PATCH /api/citas/:citaId` — recibe `{inicio}` y solo eso; devuelve `200` con la cita
    actualizada; devuelve `409` con `{error: "horario_no_disponible"}`, y `422` con
    `{error: "ventana_de_cancelacion"}` en el mismo caso que arriba.
  - Los campos `cancelada_en` y `cancelada_por` de la tabla `cita` quedan llenos. `cancelada_por`
    vale `"cliente"` o `"personal"`.
  - La regla de la ventana de 4 horas, escrita en un solo lugar, que la pieza 7 reutiliza para
    saltársela cuando quien pide es Personal.

**Evidencia**

---

### Pieza 6: Recordatorio de 24 horas

Es la pieza señalada en `FICHA-APROBACION.md` como la de mayor riesgo técnico y la primera
candidata a recortar si el tiempo aprieta.

**Qué tiene que ser cierto**
- 24 horas antes de una cita activa, al cliente le llega un correo recordatorio con enlace para
  cancelar **y** para reagendar (RF-12).
- Una cita reservada con **menos** de 24 horas de anticipación no recibe ningún recordatorio, ni
  tardío ni de otro tipo (RN-20).
- Cada recordatorio se manda **una sola vez** por cita: si el disparador corre dos veces, no llegan
  dos correos.
- Una cita cancelada no recibe recordatorio.
- El envío queda registrado igual que la confirmación, con tipo `recordatorio` (REG-3).
- Existe una tarea programada externa que le pide al backend revisar los recordatorios pendientes,
  y ese pedido está protegido: nadie de afuera puede dispararlo sin la clave.
- Si la tarea programada no corre, los recordatorios de ese ciclo no se mandan y nada más se rompe:
  la cita y su confirmación siguen intactas.

**Con qué se comprueba**
1. Insertar a mano una cita activa que empiece dentro de 24 horas y 10 minutos, y que se haya
   creado hace varios días. Llamar al disparador: **no** llega recordatorio todavía.
2. Cambiarla a que empiece dentro de 23 horas y 50 minutos. Llamar al disparador: llega el
   recordatorio, con los dos enlaces.
3. Abrir el enlace de cancelar del correo: lleva a la aplicación y cancela esa cita.
4. Volver a llamar al disparador con otra cita ya avisada: **no** llega un segundo correo.
5. Insertar una cita creada hace 3 horas para dentro de 20 horas. Llamar al disparador: no llega
   recordatorio (RN-20).
6. Cancelar una cita que estaba por recibir recordatorio y llamar al disparador: no llega.
7. Llamar al disparador sin la clave: lo rechaza.
8. Ver en la pestaña de acciones de GitHub que la tarea programada corrió sola en su horario.

**Toca:** Notificaciones, Reservas.

**Interfaces**
- *Consume:* la función de envío de correo y la tabla `correo_enviado` de la pieza 4; los endpoints
  de cancelar y reagendar de la pieza 5, a los que apuntan los enlaces del correo.
- *Produce:*
  - `POST /api/tareas/recordatorios` — protegido por una clave secreta en la cabecera; devuelve
    `200` con `{revisadas, enviados}`; devuelve `401` sin la clave.
  - El archivo de la tarea programada de GitHub Actions que llama a ese endpoint.
  - El criterio de «ya se le mandó»: existe una fila en `correo_enviado` con esa `cita_id` y tipo
    `"recordatorio"`.

**Evidencia**

---

### Pieza 7: Personal atiende el teléfono

**Qué tiene que ser cierto**
- Personal entra con su cuenta precargada y ve una pantalla equivalente a la del cliente, pero para
  reservar **en nombre de otra persona** (RF-16).
- Si el que llama ya tiene cuenta, Personal la busca por nombre o correo.
- Si no tiene, Personal le crea la cuenta con una **contraseña temporal**, y el sistema la muestra
  para que se la dicte por teléfono (RF-17, RN-11).
- La primera vez que ese cliente entra, el sistema le exige cambiar la contraseña antes de dejarlo
  hacer nada más (RF-4).
- Las citas que crea Personal quedan con canal `"asistida"` y con la cuenta de Personal que las
  creó (RN-12).
- Al crear una cita, Personal cumple **las mismas reglas** que el cliente: no puede tomar un
  horario ocupado, ni un feriado, ni fuera del horario del negocio, ni para el mismo día (RN-13).
- Personal **sí** puede cancelar y reagendar dentro de las 4 horas (RF-18, RN-6, CA-3 parte
  Personal).
- El cliente recibe el mismo correo de confirmación que si hubiera reservado él.

**Con qué se comprueba**
1. Entrar como Personal y reservar a nombre de un cliente que ya existe: se crea la cita y en la
   base queda con canal `asistida` y el `personal_id_creador` correcto.
2. Ese cliente recibe el correo de confirmación.
3. Como Personal, crear la cuenta de `nuevo@ejemplo.com`: la pantalla muestra una contraseña
   temporal.
4. Cerrar sesión, entrar como `nuevo@ejemplo.com` con esa contraseña temporal: el sistema exige
   cambiarla antes de dejar seguir.
5. Cambiarla, cerrar sesión, y volver a entrar con la contraseña nueva: entra normal, ya sin que le
   exija nada.
6. Intentar entrar con la contraseña temporal vieja: la rechaza.
7. Como Personal, intentar reservar un horario ya ocupado: lo rechaza igual que al cliente.
8. Como Personal, intentar reservar para hoy: lo rechaza igual que al cliente.
9. Insertar una cita que empiece dentro de 2 horas. Como Personal, cancelarla: **la acepta**, y en
   la base queda `cancelada_por` = personal.
10. Correr la prueba automática de CA-3 (parte Personal): la misma cancelación a menos de 4 horas,
    hecha por Personal, devuelve `204`. Pasa en verde en el push.

**Toca:** Autenticación, Reservas, Interfaz.

**Interfaces**
- *Consume:* `POST /api/sesion` y el campo `tipo` de la pieza 1; `POST /api/citas` de la pieza 3;
  `DELETE /api/citas/:citaId` y `PATCH /api/citas/:citaId` de la pieza 5; el envío de correo de la
  pieza 4.
- *Produce:*
  - `POST /api/personal/clientes` — solo para sesión de tipo `personal`; recibe `{nombre, correo}`;
    devuelve `201` con `{id, nombre, correo, contrasenaTemporal}`; devuelve `409` si el correo ya
    existe.
  - `GET /api/personal/clientes?busqueda=` — solo para sesión de tipo `personal`; devuelve
    `[{id, nombre, correo}]`.
  - `POST /api/citas` acepta además `{clienteId}` cuando la sesión es de tipo `personal`, y en ese
    caso guarda canal `"asistida"`.
  - `POST /api/contrasena/cambiar` — recibe `{contrasenaActual, contrasenaNueva}`; apaga
    `debe_cambiar_contrasena`; devuelve `204`.
  - `DELETE /api/citas/:citaId` y `PATCH /api/citas/:citaId` dejan de aplicar la ventana de 4 horas
    cuando la sesión es de tipo `personal`.

**Evidencia**

---

### Pieza 8: Personal cierra las citas pasadas

**Qué tiene que ser cierto**
- Personal ve las citas activas cuya hora ya pasó (RF-21).
- Puede marcar cada una como **completada** (el cliente asistió) o **no asistió** (no se presentó).
- En los dos casos queda registrado qué cuenta de Personal la marcó y cuándo (REG-1).
- **Ningún estado se alcanza solo por el paso del tiempo**: una cita cuya hora pasó sigue activa
  hasta que alguien la marque (RN-17).
- El cliente no puede marcar sus propias citas.
- Una cita marcada como «no asistió» queda perdida: no se repone ni se devuelve nada, y tampoco se
  borra (RN-19, RN-15).
- Una cita ya cerrada no se puede volver a cerrar con otro estado.

**Con qué se comprueba**
1. Insertar dos citas activas cuya hora ya pasó, de dos clientes distintos.
2. Entrar como Personal: las dos aparecen en la lista de citas por cerrar.
3. Marcar una como completada y la otra como no asistió.
4. Mirar la base: los dos estados quedaron guardados, cada uno con `cerrada_en` y `cerrada_por` = la
   cuenta de Personal.
5. Recargar la lista de citas por cerrar: ninguna de las dos sigue apareciendo.
6. Insertar una tercera cita activa con hora ya pasada y **no** tocarla. Esperar y recargar: sigue
   activa. Nada la cerró sola.
7. Entrar como cliente e intentar cerrar una cita: no existe la opción, y el pedido directo al API
   se rechaza.
8. Intentar volver a cerrar una cita ya cerrada: lo rechaza.

**Toca:** Reservas, Interfaz.

**Interfaces**
- *Consume:* la tabla `cita` y `GET /api/citas` de la pieza 3; el campo `tipo` de la sesión de la
  pieza 1; la pantalla de Personal de la pieza 7.
- *Produce:*
  - `GET /api/personal/citas-por-cerrar` — solo para sesión de tipo `personal`; devuelve las citas
    con estado `"activa"` cuyo `inicio` ya pasó: `[{id, cliente, servicio, proveedor, inicio}]`.
  - `PATCH /api/citas/:citaId/cierre` — solo para sesión de tipo `personal`; recibe
    `{estado}` con valor `"completada"` o `"no_asistio"`; devuelve `200`; devuelve `403` si la
    sesión es de un cliente y `409` si la cita ya no está activa.
  - Los campos `cerrada_en` y `cerrada_por` de la tabla `cita` quedan llenos.

**Evidencia**

---

### Pieza 9: Restablecer la contraseña olvidada

**Qué tiene que ser cierto**
- Quien olvidó su contraseña pide un enlace desde la pantalla de entrar, indicando su correo
  (RF-3).
- Le llega un correo con un enlace **de un solo uso** y con vencimiento.
- Con ese enlace define una contraseña nueva y entra con ella.
- El enlace ya usado no sirve una segunda vez.
- El enlace vencido no sirve.
- Aplica igual a las cuentas de Cliente y a las de Personal (`DISENO.md`, entidad Token de
  recuperación).
- Pedir el enlace con un correo que no existe responde **lo mismo** que con uno que sí existe, para
  no revelar qué correos están registrados — el mismo criterio del mensaje de login de la pieza 1.
- El envío queda registrado con tipo `recuperacion` y sin cita asociada (REG-3).

**Con qué se comprueba**
1. Pedir el enlace para `ana@ejemplo.com`: llega el correo.
2. Abrirlo, poner `Nueva456`, y entrar con `ana@ejemplo.com` / `Nueva456`: entra.
3. Intentar entrar con la contraseña vieja: la rechaza.
4. Abrir otra vez el mismo enlace: lo rechaza por usado.
5. Insertar a mano un token con fecha de vencimiento pasada y abrir su enlace: lo rechaza por
   vencido.
6. Pedir el enlace para `noexiste@ejemplo.com`: la pantalla responde **exactamente igual** que en
   el paso 1, y no se manda ningún correo.
7. Repetir el paso 1 con la cuenta de Personal: funciona igual.
8. Mirar la tabla de correos enviados: las filas de tipo `recuperacion` tienen la cita vacía.

**Toca:** Autenticación, Notificaciones, Interfaz.

**Interfaces**
- *Consume:* la función de envío de correo y la tabla `correo_enviado` de la pieza 4; las tablas
  `cliente` y `personal` y `POST /api/sesion` de la pieza 1.
- *Produce:*
  - Tabla `token_recuperacion` (id, cliente_id, personal_id, codigo, vence_en, usado_en). Solo uno
    de los dos identificadores viene lleno.
  - `POST /api/contrasena/olvide` — recibe `{correo}`; devuelve siempre `204`, exista o no la
    cuenta.
  - `POST /api/contrasena/restablecer` — recibe `{codigo, contrasena}`; devuelve `204`; devuelve
    `422` con `{error: "token_invalido"}` si el código no existe, ya se usó o venció.

**Evidencia**

---

### Pieza 10: La información del cliente

*Esta pieza **no estaba en el plan original**: se agregó el 2026-08-19, pedida por la estudiante, y se
construyó ese mismo día **fuera de orden**, justo después de la pieza 3. Se puede: no depende de
ninguna pieza sin construir. La cuenta la creó la pieza 1 y las citas la pieza 3, y de esas dos cosas
sale todo lo que muestra.*

*En pantalla la sección se llama **«Usuario»**.*

**Qué tiene que ser cierto**
- El cliente ve su propia información: nombre, correo, teléfono, **edad** y **desde cuándo es
  cliente** (RF-22).
- La **edad se calcula** a partir de la fecha de nacimiento, con la hora del negocio. No se guarda
  como número.
- **«Desde cuándo es cliente» es la fecha de su primera cita.** Si todavía no tuvo ninguna, la
  pantalla lo dice.
- El cliente puede completar o corregir su **nombre**, su **teléfono** y su **fecha de nacimiento**.
- El cliente **no puede cambiar su correo** (RN-21).
- El teléfono y la fecha de nacimiento son **opcionales**: una cuenta creada sin ellos funciona igual.
- Un teléfono que no sean 8 dígitos, una fecha de nacimiento que no exista o que esté en el futuro, y
  un nombre vacío se rechazan **en el servidor**.
- La cuenta de Personal no usa esta sección: es la información de un cliente.
- **El expediente del cliente sigue fuera de alcance** — ni padecimientos, ni medicamentos, ni
  contraindicaciones, ni tratamientos, ni paquetes de sesiones. Es PA-1, bloqueado por PA-2.

**Con qué se comprueba**
1. Entrar como cliente y abrir «Usuario»: se ven el nombre y el correo con los que se registró, y el
   teléfono y la edad aparecen vacíos, con la invitación a completarlos.
2. Completar teléfono `88887777` y fecha de nacimiento `1990-03-15`, y guardar: la pantalla muestra el
   teléfono escrito `8888-7777` y la edad en años.
3. Apagar y levantar la aplicación, y volver a entrar: los dos datos siguen ahí.
4. Escribir un teléfono de 7 dígitos, y guardar: se rechaza y la pantalla lo dice.
5. Escribir una fecha de nacimiento del futuro, y guardar: se rechaza y la pantalla lo dice.
6. Antes de tener ninguna cita, «desde cuándo es cliente» dice que todavía no tuvo su primera cita.
   Después de reservar una, muestra la fecha de esa cita.
7. Entrar con la cuenta de Personal: la sección no le sirve, y el servidor la rechaza.

**Toca:** Autenticación (los datos de la cuenta), Reservas (solo para leer la primera cita), Interfaz.

**Interfaces**
- *Consume:* la sesión de la pieza 1, y la tabla `cita` de la pieza 3 (solo la lee, para saber cuál
  fue la primera).
- *Produce:*
  - Dos columnas nuevas en la tabla `cliente`: `telefono` y `fecha_nacimiento`, **las dos opcionales**
    y escritas como texto. La fecha se escribe `1990-03-15`, con el mismo formato de fecha que usa
    todo el proyecto. **No hay una columna de edad**: la edad se calcula.
  - `GET /api/mi-informacion` — devuelve
    `{nombre, correo, telefono, fechaNacimiento, edad, clienteDesde}`. `telefono`, `fechaNacimiento`,
    `edad` y `clienteDesde` valen `null` cuando no hay dato. `clienteDesde` es la fecha de la primera
    cita, escrita `2026-08-20`.
  - `PUT /api/mi-informacion` — recibe `{nombre, telefono, fechaNacimiento}`; devuelve `200` con lo
    mismo que devuelve el `GET`. Devuelve `422` con `{error: "nombre_invalido"}`,
    `{error: "telefono_invalido"}` o `{error: "fecha_nacimiento_invalida"}` según qué esté mal. Un
    `correo` que venga en el pedido **se ignora** (RN-21).
  - Los dos endpoints devuelven `401` sin sesión y `403` con `{error: "solo_clientes"}` con la sesión
    de Personal, igual que los de la pieza 3.

**Evidencia**

*Construida el 2026-08-19, el mismo día que la pieza 3 y fuera de orden, a pedido de la estudiante.*

**Pruebas automáticas — `npm test`: 83 pruebas, 83 pasan, 0 fallan.** De esas, **19 son nuevas de
esta pieza** (las otras 64 son las de las piezas 1, 2 y 3, que siguen pasando). Se escribieron antes
del código y **se vieron fallar primero**: la corrida previa dio «tests 83, pass 64, fail 19». Viven
en `pruebas/usuario.test.js`.

Paran el reloj en el mismo momento que las demás —martes 1 de setiembre de 2026, 8 de la mañana de
Costa Rica—, y acá eso no es un detalle: **una prueba que dice «tiene 36 años» empezaría a fallar
sola el día del cumpleaños** de la clienta inventada si el reloj fuera el de verdad.

Cubren, además de las comprobaciones de abajo: que sin sesión no se ve ni se guarda nada (`401`), que
la cuenta de Personal se rechaza (`403`), que el teléfono se acepta con guión o sin él y **se guarda
siempre igual** (`8888-7777`), que se pueden **borrar** el teléfono y la fecha porque son opcionales,
que una fecha inexistente (`1990-02-31`), mal escrita (`15/03/1990`) o de hace más de 120 años se
rechaza, que un nombre vacío se rechaza **y no se guarda nada más de ese pedido**, que el correo se
ignora aunque venga en el pedido y se sigue entrando con el de siempre (RN-21), que los datos de un
cliente no son los de otro, y **el caso borde de la edad**: un día antes del cumpleaños, el día
mismo, un día después, y quien nació un 29 de febrero.

**Las 7 comprobaciones de arriba, corridas contra la aplicación escuchando en
`http://localhost:3000` y sobre la base real `datos/reservas.sqlite`**, el 2026-08-19:

| # | Resultado |
|---|---|
| 1 | Recién registrada, `GET /api/mi-informacion` → `200` con `{"nombre":"Mela Lopez", "correo":"mela@ejemplo.com", "telefono":null, "fechaNacimiento":null, "edad":null, "clienteDesde":null}`. Los cuatro `null` son los cuatro «Sin completar» que la pantalla muestra. |
| 2 | `PUT` con `telefono: "88887777"` y `fechaNacimiento: "1990-03-15"` → `200`, y vuelve **`telefono: "8888-7777"`** (normalizado, con guión) y **`edad: 36`**, calculada. |
| 3 | Apagar y levantar: los dos datos siguen ahí. *(Comprobado además por la prueba automática que apaga y levanta la aplicación en el medio.)* |
| 4 | `telefono: "8888777"` (7 dígitos) → **`422 telefono_invalido`**. |
| 5 | `fechaNacimiento: "2030-01-01"` → **`422 fecha_nacimiento_invalida`**. El reloj de verdad estaba en 2026-08-19, así que 2030 es futuro. |
| 6 | Sin citas, `clienteDesde: null`. Después de reservar el 2026-08-21 a las 10:00, `clienteDesde: "2026-08-21"`. La prueba automática comprueba además que **se queda en la primera** aunque después se reserve otra anterior. |
| 7 | Con la sesión de Personal, `GET /api/mi-informacion` → **`403 solo_clientes`**. |

**Revisión visual — hecha por la estudiante el 2026-08-19**, y con eso **la pieza 10 queda CERRADA**.
Recorrió la sección «Usuario» completa —los datos, el formulario que se abre y se cierra, el enlace en
los dos menús— y confirmó que se ve y funciona como corresponde, sin defectos nuevos.

**Lo que se construyó además, y no era parte del encargo de la pieza:**

- **El guardia de sesión se mudó a `servidor/sesion.js`.** Estaba escrito adentro de
  `rutas/citas.js`, y esta pieza necesitaba el mismo —cliente sí, Personal no—. Se movió a un solo
  lugar en vez de copiarlo, que es la regla del `CLAUDE.md`.
- **La base sabe agregar columnas a una tabla que ya existe.** `CREATE TABLE IF NOT EXISTS` no toca
  una tabla que ya está, así que en una base creada antes de esta pieza las dos columnas nuevas no
  habrían aparecido nunca y la sección habría fallado sin decir por qué. Ahora se agregan solas al
  abrir la base, sin borrar nada.

---

### Pieza 11: Categorías de servicio

*Tampoco estaba en el plan original: se pidió el 2026-08-19 y se construyó ese mismo día, fuera de
orden. **Modifica el catálogo, que era de la pieza 2 y ya estaba cerrada**, así que lo primero que se
corrigió fue RF-5 de `ESPECIFICACION.md`, y solo después el código.*

**Por qué existe.** Hasta acá el catálogo era una lista plana: «Masaje relajante» y «Limpieza facial»
como dos cosas sueltas. El negocio ofrece **varios tipos de masaje**, y una lista plana con todos
mezclados obliga al cliente a leer la oferta completa para encontrar lo que busca.

**Qué tiene que ser cierto**
- El cliente ve las **categorías** del negocio, y al elegir una ve los servicios que contiene (RF-5).
- **Si la categoría tiene un solo servicio, ese paso no se muestra**: el sistema lo toma y sigue de
  largo (RN-22).
- **Si tiene más de uno, el cliente elige** cuál quiere.
- Después sigue todo igual que antes: elegir proveedor (RN-8), ver el calendario, reservar.
- **Quién decide si el paso se muestra es el servidor**, no la pantalla.
- **Cada servicio pertenece a una categoría, obligatoriamente.** No existe un servicio sin categoría.
- **La cita sigue guardando el servicio**, no la categoría: nada de la pieza 3 cambia.
- **Todos los servicios siguen durando una hora.** Los subtipos no traen duraciones distintas — eso
  está declarado fuera de alcance y reabrirlo sería otra pieza.

**Con qué se comprueba**
1. Entrar como cliente: el paso 1 muestra las categorías «Masaje» y «Facial», no la lista de servicios.
2. Elegir «Masaje»: aparece un paso nuevo con los tres tipos de masaje.
3. Elegir «Masaje relajante»: aparecen Ana y Carlos, igual que antes.
4. Elegir «Facial», que tiene un solo servicio: **el paso del tipo no aparece** y se salta directo a
   los proveedores, que son Ana y Luisa.
5. Reservar de punta a punta pasando por una categoría con varios tipos: la cita queda creada, y en
   «Mis citas» dice el nombre del **servicio** («Masaje descontracturante»), no el de la categoría.
6. Pedirle al API los servicios de una categoría que no existe: responde `404`.
7. Correr `npm test`: todo pasa, incluidas las pruebas del catálogo de la pieza 2.

**Toca:** Catálogo, Interfaz. *(No toca Reservas ni el cálculo de disponibilidad: la cita sigue
apuntando al servicio.)*

**Interfaces**
- *Consume:* la sesión de la pieza 1, y el catálogo de la pieza 2.
- *Produce:*
  - Tabla `categoria` (id, nombre).
  - Una columna nueva en `servicio`: `categoria_id`, **obligatoria**, que apunta a `categoria(id)`.
  - `GET /api/categorias` — devuelve el árbol completo en un solo pedido:
    `[{id, nombre, pideElegirTipo, servicios: [{id, nombre, duracionMinutos}]}]`. `pideElegirTipo` es
    `false` cuando la categoría tiene un solo servicio, y es **el servidor** el que lo decide (RN-22).
  - `GET /api/categorias/:categoriaId/servicios` — devuelve `[{id, nombre, duracionMinutos}]`; `404`
    con `{error: "categoria_no_encontrada"}` si esa categoría no existe; `401` sin sesión.
  - `GET /api/servicios` **sigue existiendo** tal como lo fijó la pieza 2, y ahora cada servicio trae
    además el nombre de su categoría. La pantalla ya no lo usa.
  - Datos de prueba: dos categorías. **«Masaje»** con tres servicios —«Masaje relajante» (Ana y
    Carlos), «Masaje descontracturante» (Carlos) y «Masaje con piedras calientes» (Ana)— y
    **«Facial»** con uno solo, «Limpieza facial» (Ana y Luisa). La categoría de un solo servicio
    existe a propósito: es la que comprueba RN-22.

**Evidencia**

*Construida el 2026-08-19, el mismo día que las piezas 3 y 10, y también fuera de orden.*

**Pruebas automáticas — `npm test`: 95 pruebas, 95 pasan, 0 fallan.** De esas, **12 son nuevas de esta
pieza**. Se escribieron antes del código y **se vieron fallar primero**: la corrida previa dio «tests
95, pass 83, fail 12». Viven en `pruebas/categorias.test.js`.

**Dos pruebas de la pieza 2 hubo que corregirlas, y las dos por razones legítimas.** Quedan anotadas
acá y en el propio archivo de pruebas, con qué cambió y por qué, en vez de reescribirlas en silencio:

1. *«la clienta que entró ve los dos servicios del negocio»* comprobaba que la lista trajera
   **exactamente dos**. Al agregarse dos tipos de masaje, esa cuenta pasó a cuatro. Se le quitó la
   cuenta y ahora comprueba lo que la comprobación 1 de la pieza 2 de verdad dice —que los servicios
   se ven, con su duración— más el nombre de su categoría. Es la misma lección que dejó la pieza 2 al
   sumarse Luisa: **una prueba no se ata a cuántos datos de demostración hay hoy.**
2. *«un servicio con un solo proveedor igual dice quién lo atiende»* se crea sus propios datos, y
   ahora crea también su propia categoría, porque `categoria_id` es obligatoria. Lo que comprueba
   —la segunda mitad de RN-8— no cambió.

**Las 7 comprobaciones de arriba**, corridas contra la aplicación escuchando en
`http://localhost:3000` y sobre la base real, el 2026-08-19:

| # | Resultado |
|---|---|
| 1 | `GET /api/categorias` → `200` con **«Facial» y «Masaje»** (ordenadas por nombre), y ningún servicio suelto. |
| 2 | «Masaje» trae sus tres tipos: **«Masaje con piedras calientes», «Masaje descontracturante» y «Masaje relajante»**, los tres de 60 minutos. |
| 3 | «Masaje relajante» → **Ana y Carlos**, igual que antes de esta pieza. Y cada tipo tiene los suyos: descontracturante → solo Carlos, piedras calientes → solo Ana. |
| 4 | «Facial» llega con **`pideElegirTipo: false`** y un solo servicio, «Limpieza facial» → Ana y Luisa. Es el servidor el que dice que ese paso no se muestra, no la pantalla. Y «Masaje» llega con `pideElegirTipo: true`. |
| 5 | Reservado un «Masaje descontracturante» con Carlos de punta a punta: `201`, y `GET /api/citas` dice **`servicio: "Masaje descontracturante"`** — el nombre del servicio, no el de la categoría. Ni el calendario ni la reserva cambiaron una línea. |
| 6 | `GET /api/categorias/9999/servicios` → **`404 categoria_no_encontrada`**. |
| 7 | `npm test` → 95 de 95, incluidas las del catálogo de la pieza 2. |

**Un error que solo apareció al correr el comando de verdad:** `npm run datos` se rompió, porque
`guiones/cargar-datos.js` importaba la lista `SERVICIOS`, que esta pieza renombró a `CATEGORIAS`.
**Ninguna de las 95 pruebas lo detectó**, y no es un descuido de las pruebas: ellas importan
`datos-de-prueba.js` directo, no el comando. Vale como recordatorio de que un comando también hay que
correrlo. Ahora el comando imprime el catálogo agrupado:

```
  - Categorías:         Masaje, Facial
      · Masaje → Masaje relajante: Ana y Carlos
      · Masaje → Masaje descontracturante: Carlos
      · Masaje → Masaje con piedras calientes: Ana
      · Facial → Limpieza facial: Ana y Luisa
```

**Una decisión de pantalla que la construcción destapó: los números de los pasos.** Estaban escritos
a mano en el HTML («1», «2», «3»), y con un paso que se salta la persona vería «1, 3, 4» y pensaría
que se perdió algo. Ahora los escribe el JavaScript contando **solo los pasos visibles**, así que
siempre son seguidos.

**Revisión visual — hecha por la estudiante el 2026-08-19**, y con eso **la pieza 11 queda CERRADA**.
Recorrió el paso de categorías, el paso del tipo de masaje, el salto de ese paso en «Facial» y la
numeración de los pasos, y confirmó que se ve y funciona como corresponde, sin defectos nuevos.

---

## Cobertura

| Requisito o recorrido de `ESPECIFICACION.md` | Pieza |
|---|---|
| RF-1, RF-2 · Recorrido «Login incorrecto» | 1 |
| RF-5, RF-6, RF-7, RF-10 · Recorridos «Intento de reservar para hoy» y «No hay horarios en los próximos 7 días» | 2 |
| RF-8, RF-9 · CA-1, CA-2 · Recorrido «Dos clientes eligen el mismo horario a la vez» | 3 |
| RF-11, RF-19 · Recorrido «Falla el envío de un correo» | 4 |
| RF-13, RF-14, RF-15, RF-20 · CA-3 (cliente) · Recorridos «Cancelación o reagendamiento por el cliente» e «Intento de cancelar o reagendar dentro de la ventana» | 5 |
| RF-12 · Recorrido «Falla el disparador del recordatorio» | 6 |
| RF-4, RF-16, RF-17, RF-18 · CA-3 (Personal) · Recorridos «Reserva asistida por teléfono» y «Primer ingreso con contraseña temporal» | 7 |
| RF-21 · Recorrido «Después de la cita: Personal cierra el caso» | 8 |
| RF-3 · Recorrido «Contraseña olvidada» | 9 |
| RF-22 · Recorrido «El cliente revisa y completa su información» | 10 |
| RF-5 (corregido) · RN-22 | 11 |
| Recorrido «Reserva en línea» (el principal, de punta a punta) | 1 + 2 + 3 + 4 |
| RNF-1, RNF-2, RNF-3 | Ninguna pieza los construye: RNF-1 es la decisión de **no** construir alta disponibilidad, y RNF-2 y RNF-3 declaran que a este volumen no se deriva ningún requisito de rendimiento. |

## Fuera del plan

| Qué | Por qué |
|---|---|
| Expediente del cliente (padecimientos, medicamentos, contraindicaciones, tratamientos, paquetes de sesiones) | Es PA-1 de `ESPECIFICACION.md`, sin resolver. Depende de PA-2. **Sigue afuera después de la pieza 10:** esa pieza muestra los datos de contacto del cliente (REG-2), que es otra cosa. Lo que falta decidir no es técnico — es quién dice que alguien compró un paquete y cómo se descuenta una sesión. |
| Registrar que un cliente tiene un paquete de sesiones | Es PA-2. El sistema no registra dinero, así que no hay de dónde saber que alguien compró un paquete. Hoy el negocio lleva a mano el descuento de una sesión perdida. |
| Reporte semestral de reservas en línea contra teléfono | Hoja de ruta de `NEGOCIO.md`. El dato que lo alimenta —el campo `canal` de la cita— sí queda guardado desde la pieza 3, así que el reporte se construye después agrupando por ese campo, sin cambiar nada de lo ya hecho. |
| Panel de administración con interfaz, lista de espera automatizada, duraciones variables por servicio, política de cancelación configurable, varias sucursales | Declarados fuera de alcance en `ESPECIFICACION.md`. |
| Alojar la aplicación en producción y migrar ahí el disparador del recordatorio | Decisión dejada abierta en `DISENO.md`; no corresponde a esta entrega. |
| La skill propia de arranque que pide la rúbrica del curso | No es un requisito del sistema: no aparece en `ESPECIFICACION.md` y por eso no es una vertical slice. Es un entregable del curso y está anotado como pendiente en `SEGUIMIENTO.md`. |
</content>
