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

- **El cliente** no puede reservar para el mismo día. Quien la necesita llama al negocio, y
  **Personal sí puede agendarla** desde la aplicación, en un horario que todavía no haya empezado
  (RN-25). *Corregido el 2026-08-21, durante la revisión visual de la pieza 7: hasta entonces esta
  línea decía que no había citas para el mismo día, sin más, y eso dejaba la llamada del cliente sin
  ningún lugar donde terminar.*
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
| 3 | Reservar un horario | 2 | **cerrada el 2026-08-19** |
| 4 | Correo de confirmación | 3 | **cerrada el 2026-08-19** |
| 5 | Cancelar y reagendar | 3 | **cerrada el 2026-08-20** |
| 6 | Recordatorio de 24 horas | 4 y 5 | pendiente |
| 7 | Personal atiende el teléfono | 5 | **cerrada el 2026-08-24** (construida el 2026-08-21) |
| 8 | Personal cierra las citas pasadas | 7 | **cerrada el 2026-08-24** |
| 9 | Restablecer la contraseña olvidada | 4 | pendiente |
| 10 | La información del cliente | 1 y 3 | **cerrada el 2026-08-19**, construida fuera de orden |
| 11 | Categorías de servicio | 2 | **cerrada el 2026-08-19**, construida fuera de orden |
| 12 | Reglas para la contraseña y el correo | 1 | **cerrada el 2026-08-19**, pedida fuera del plan |

*(Las filas de la 4 y la 12 se corrigieron el 2026-08-20: la tabla decía que la 4 estaba pendiente
cuando se había cerrado el día anterior, y la 12 no tenía fila aunque su detalle sí estaba escrito
más abajo.)*

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
| 7 | **CUMPLIDA.** Push hecho el 2026-08-19. La **primera** corrida (`Pruebas #1`, commit `e4267e0`) salió en **rojo** y encontró dos defectos reales (ver abajo). Arreglados y subidos, la **segunda** corrida (`Pruebas #2`, commit `341187f`) quedó en **verde**: `Status: Success`, 2m 10s, y **los dos trabajos en verde — `pruebas (20)` y `pruebas (24)`**, con las 95 pruebas cada uno. Confirmado por la estudiante en la pestaña Actions, con captura de pantalla. |

**Revisión visual — hecha por la estudiante el 2026-08-19.** Abrió `http://localhost:3000`, recorrió
la lista de comprobaciones visuales de `PROXIMA-SESION.md` y **confirmó que la pieza se ve y funciona
como corresponde: no salió ningún defecto nuevo.** Con eso quedan cubiertas las mitades de pantalla de
las comprobaciones 1, 2 y 4, que ninguna prueba automática puede ver. La revisión se hizo sobre la
pantalla **ya con el paso de categorías** que agregó la pieza 11, así que cubre el recorrido tal como
quedó y no el que existía antes.

**Con esto la pieza 3 queda CERRADA**, con sus 7 comprobaciones cumplidas y la revisión visual hecha.

**La primera corrida de la integración continua salió en ROJO** (2026-08-19, `Pruebas #1`, commit
`e4267e0`), y encontró **dos defectos que las 95 pruebas locales no podían encontrar** — que es
exactamente para lo que existe:

1. **El comando de pruebas no funcionaba en Node 20.** Estaba escrito
   `node --test "pruebas/**/*.test.js"`, y **el buscador de pruebas de Node entiende ese patrón de
   comodines solo desde la versión 22**. En Node 20 ese texto se toma como el nombre de un archivo, no
   lo encuentra, y falla. Es **la segunda promesa de «Node 20 o superior» que resultó falsa** —la
   primera fue `better-sqlite3`—, y las dos las destapó la integración continua. Arreglado escribiendo
   `node --test` sin decirle qué archivos: así Node los busca solo, y funciona igual en las dos
   versiones. Se comprobó que encuentra las mismas 95.
2. **Una prueba de la pieza 11 dependía del día en que se corriera.** La comprobación 5 buscaba «algún
   día del mes en curso con horarios libres» **con el reloj de verdad**, y un mes que se está acabando
   —o una corrida un sábado a fin de mes— se queda sin ninguno. Arreglado parando el reloj en
   `MOMENTO_DE_PRUEBA` como el resto de las pruebas, y escribiendo la fecha fija. Quedó como convención
   en `CLAUDE.md`: **ninguna prueba se cuelga del día en que se corre**, no solo las del calendario.

**La segunda corrida quedó en verde** (`Pruebas #2`, commit `341187f`): `Status: Success`, 2m 10s, con
los dos trabajos en verde —`pruebas (20)` y `pruebas (24)`— y las 95 pruebas en cada uno. **Con eso la
comprobación 7 queda cumplida y la pieza 3 cerrada.**

*Nota sobre los dos avisos amarillos de esa corrida.* Dicen que `actions/checkout@v4` y
`actions/setup-node@v4` «apuntan a Node.js 20, que está obsoleto, y se están forzando a correr en Node
24». **No tienen nada que ver con la promesa de Node 20 de este proyecto**, y conviene tenerlo claro
porque es fácil confundirlo: hay dos Node distintos en juego. Uno es el que corre **la aplicación y sus
pruebas** —Node 20 y Node 24, los dos en verde, y es el que promete el `README.md`—; el otro es el que
GitHub usa para ejecutar **sus propias herramientas**, y ese es el que GitHub está jubilando. El aviso
es sobre el segundo. No rompe nada. Se puede silenciar subiendo esas dos herramientas a su versión 5, y
conviene hacerlo en algún momento: un aviso que aparece siempre, incluso en verde, enseña a ignorar los
avisos.

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

**Decisiones tomadas al construir**

*Cuatro preguntas que ningún documento del proyecto tenía respondidas. Se le preguntaron a la
estudiante el 2026-08-19, antes de escribir una línea, y las cuatro las decidió ella.*

1. **A Resend se le habla con lo que Node ya trae, no con su paquete de npm.** Mandar un correo es
   un solo pedido a una dirección, con la clave en una cabecera, y `fetch` viene incluido en Node
   20. Así el `README.md` puede seguir prometiendo que este proyecto no necesita nada raro
   instalado. Son unas 20 líneas en `servidor/enviador-resend.js`.
2. **La pantalla espera a que el correo salga antes de contestar «tu cita quedó reservada».** La
   cita ya está guardada cuando el envío empieza, así que RF-19 se cumple igual. Lo que se gana
   esperando es que el resultado del envío se pueda comprobar: contestando primero, toda prueba
   del correo tendría que adivinar cuánto esperar, y una prueba así falla sola cada tanto.
3. **El correo lleva los colores del sistema visual**, con una versión de texto plano de respaldo.
4. **La estudiante todavía no tiene cuenta de Resend**, así que las comprobaciones que necesitan
   una bandeja de entrada de verdad quedan pendientes — ver abajo cuáles.

*Y dos límites que no estaban escritos en ninguna parte y se adoptaron acá, con su razón:*

5. **Se reintenta una sola vez, y solo cuando la falla puede ser pasajera.** `ESPECIFICACION.md`
   dice «el sistema reintenta» sin decir cuántas veces. Dos intentos, con un segundo de pausa
   entre ellos, porque quien reservó está esperando en la pantalla. Y **no se reintenta cuando el
   problema es el pedido** —la clave no sirve, el remitente no está verificado—: el segundo intento
   daría exactamente lo mismo y solo haría esperar más. Del 500 para arriba el problema es de
   Resend y sí se reintenta.
6. **Se espera a Resend cinco segundos como mucho.** Sin ese límite, un servicio que no contesta
   dejaría el botón «Confirmar la reserva» girando hasta que Node se cansara.

**Evidencia**

*Construida el 2026-08-19.*

**Pruebas automáticas — `npm test`: 109 pruebas, 109 pasan, 0 fallan.** De esas, **14 son nuevas de
esta pieza** (las otras 95 son las de las piezas 1, 2, 3, 10 y 11, que siguen pasando). Se
escribieron antes del código y **se vieron fallar primero**: la corrida previa dio «tests 96, pass
95, fail 1», con el error de que `servidor/enviador-resend.js` no existía. Viven en
`pruebas/correo.test.js`.

**Cómo se prueba un correo sin mandar correos.** El enviador entra **como dato**, igual que el
reloj: la aplicación no sabe cómo se manda un correo, recibe una función que lo manda y la llama.
En `npm start` esa función habla con Resend; en las pruebas es una de mentira que guarda los
correos en una lista. Así queda probado de verdad todo lo que está de este lado del borde —la
plantilla, el registro en la tabla y el reintento—, y **ninguna prueba automática le manda un correo
a nadie**. Es la única imitación en todas las pruebas del proyecto, y esta es su razón.

Las 14 cubren: que el correo trae los cinco datos de RF-11 en sus dos versiones (la de diseño y la
de texto plano), que trae el teléfono del negocio, que va a la dirección de quien reservó, que cada
envío deja su fila en `correo_enviado` con los seis campos, que **si el correo falla la cita se
crea igual y se ve en «Mis citas»** (RF-19), que **sin servicio de correo configurado la aplicación
funciona igual**, que una falla pasajera se reintenta una vez y una definitiva no, que dos intentos
del mismo correo son **una** fila y no dos, y —del lado del enviador, sin tocar la red— qué pedido
se le arma a Resend y cómo se clasifica cada respuesta.

**Las 4 comprobaciones de arriba:**

| # | Resultado |
|---|---|
| 1 | **PENDIENTE.** Necesita una cuenta de Resend y una dirección de correo real de prueba, y la estudiante todavía no la tiene (decisión del 2026-08-19). El paso a paso para crearla está en el `README.md`, sección «Cómo conseguir la clave de Resend». Lo que sí está comprobado sin cuenta: que los cinco datos están en el correo, con sus valores correctos, por la prueba automática. |
| 2 | **CUMPLIDA con el enviador de prueba, PENDIENTE contra un envío de verdad.** La prueba automática mira la tabla y comprueba la fila entera: `destinatario_correo` = el correo de quien reservó, `cita_id` = el id de la cita que se acaba de crear, `tipo` = `confirmacion`, `exito` = 1, `cliente_id` lleno y `enviado_en` escrito en la hora del negocio (`2026-09-01T08:00:00-06:00`). Lo único que falta comprobar es que esa misma fila quede con `exito` = 1 después de un envío **real**, que es lo que la comprobación 1 desbloquea. |
| 3 | **CUMPLIDA.** En dos mitades, y las dos comprobadas. **La mitad de la aplicación:** la prueba automática reserva con un enviador que falla, y la cita queda creada (`201`), se ve en `GET /api/citas`, y la fila del correo queda con `exito` = 0. **La mitad de Resend, contra el servicio de verdad:** se le mandó un envío con la clave `re_clave_totalmente_inventada_para_probar` y Resend contestó **`401 {"statusCode":401,"name":"validation_error","message":"API key is invalid"}`**, que la aplicación clasificó como falla **definitiva** (no la reintentó). Eso comprueba de paso que la dirección y las cabeceras del pedido son las correctas: un error de ruta habría dado 404, no un 401 hablando de la clave. |
| 4 | **PENDIENTE.** Depende de la 1. |

**Comprobado además, corriendo los comandos** —que ninguna prueba automática ejecuta—: `npm start`
levanta la aplicación **sin `RESEND_API_KEY` en el `.env`**, avisa por consola qué falta y qué pasa
si no se arregla, y contesta los pedidos con normalidad (`GET /api/negocio` → `200`). Es RF-19 en el
arranque, no solo en el envío.

**Un defecto encontrado y arreglado durante la construcción.** `npm run datos` iba a quedar roto:
`correo_enviado` apunta a `cita` y a `cliente`, la base tiene las llaves foráneas encendidas, y el
borrado de los datos de prueba no incluía la tabla nueva. SQLite se habría negado a borrar la cita
con `SQLITE_CONSTRAINT_FOREIGNKEY`. Se descubrió al revisar el guion, se escribió una prueba que lo
reprodujo, y se arregló agregando `DELETE FROM correo_enviado` **primero de todo**. Es el mismo tipo
de defecto que la pieza 11 destapó a mano, y ahora está cubierto por una prueba.

**Integración continua — EN VERDE.** Push del 2026-08-19, commit `bf17952`. La estudiante lo
confirmó en la pestaña Actions de GitHub: las **135 pruebas corren en verde en Node 20 y en Node
24**, los dos trabajos. Con eso las 14 pruebas de esta pieza quedan protegidas en cada push, que es
lo que pide `PROYECTO.md` §7.

**Revisión visual — HECHA por la estudiante el 2026-08-19.** Esta pieza no tiene pantalla propia, así
que lo que había que mirar era que reservar siguiera funcionando. Lo recorrió entero:

- Reservó una cita y la pantalla pasó a «Mis citas» **sin quedarse pensando**, con el correo saliendo
  en el medio. El límite de espera de 5 segundos no se notó.
- Reservó **sin clave de Resend** y la cita se creó igual, con su aviso en la consola: RF-19 visto en
  la aplicación de verdad, no solo en una prueba.
- Miró la fila que quedó en `correo_enviado`, con `tipo = confirmacion`, el id de su cita y
  `exito = 0`.
- Y después, **con la clave puesta, el correo llegó a su bandeja de entrada** con los cinco datos de
  RF-11. Sus palabras: «test de resend: funciona perfecto».

Preguntó además por qué no aparecían los botones de cancelar y reagendar en «Mis citas». **La
respuesta correcta era que son de la pieza 5**, todavía sin construir — así que la pregunta también
sirvió para comprobar que esa pantalla se ve como tiene que verse hoy.

**Con esto la pieza 4 queda CERRADA**, con sus 4 comprobaciones cumplidas, la corrida de integración
continua en verde y la revisión visual hecha.

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
- Al reagendar, al cliente le llega **el correo de confirmación con la fecha y la hora nuevas**
  (RF-11, RF-14). *(Agregado el 2026-08-20, al construir la pieza. La razón está en la corrección de
  RF-11 en `ESPECIFICACION.md`: sin esto, el aviso más reciente en la bandeja del cliente anunciaría
  un día que ya no es el suyo. Es la misma plantilla de la pieza 4, no una nueva.)*

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
9. Reagendar una cita y **abrir la bandeja de entrada**: llega el correo de confirmación con la
   fecha y la hora **nuevas**, y en `correo_enviado` queda una fila más. *(Agregada el 2026-08-20,
   con la regla de arriba.)*
10. Tocar «Cancelar» y comprobar que **primero pregunta** —«¿Seguro que querés cancelar esta
    cita?»— en vez de cancelar de una. Tocar «No, dejarla» y ver que la cita sigue activa.
    *(Agregada el 2026-08-20: decisión de la estudiante, cancelar no se deshace.)*

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

  *Lo que se agregó al bloque el 2026-08-20, al construir la pieza. Los tres primeros son rechazos
  que el plan no había previsto y que el código igual tiene que contestar con algo; los dos últimos
  son campos que la pantalla necesita para no decidir reglas por su cuenta:*

  - Los dos endpoints devuelven además `404` con `{error: "cita_no_encontrada"}` —**también cuando
    la cita existe pero es de otro cliente**, a propósito: contestar `403` ahí sería confirmarle a
    quien pregunta que ese número de cita existe— y `409` con `{error: "cita_no_activa"}` cuando la
    cita ya está cancelada, completada o marcada como no asistió.

  *Corregido el 2026-08-24, al construir la pieza 8:* **una cita que ya pasó ya no se rechaza con
  `ventana_de_cancelacion`, sino con el motivo nuevo `ya_paso`, también con `422`** (RN-26). Cuando
  se escribió este bloque, una cita pasada caía sola en la ventana de las 4 horas —si faltan −22
  horas, faltan menos de 4— y eso alcanzaba, porque el único actor que llegaba ahí era el cliente.
  Con RN-26 dejó de alcanzar: **Personal no tiene ventana**, así que sin un motivo propio una cita
  del mes pasado le quedaba cambiable. El campo `porQueNo` de `GET /api/citas` ya devolvía `ya_paso`
  desde el 2026-08-20 para que la pantalla no dijera una frase falsa; ahora la **regla** dice lo
  mismo que la pantalla, y las dos salen del mismo lugar.
  - `PATCH` devuelve además `422` con `{error: "mismo_dia"}` cuando el horario nuevo es de hoy o de
    un día que ya pasó (RN-4): reagendar aplica **la misma** regla de disponibilidad que reservar,
    así que tiene los mismos rechazos.
  - `GET /api/citas` agrega a cada cita `sePuedeCambiar` (sí o no) y `porQueNo`
    (`"ventana_de_cancelacion"`, `"ya_paso"`, `"cita_no_activa"` o vacío). **Quien decide si los
    botones de cancelar y reagendar aparecen es el servidor, no la pantalla** — es la regla de
    `CLAUDE.md` de que el frontend no decide reglas de negocio, y el mismo camino que ya se usó con
    el campo `estado` de cada día del calendario en la pieza 2.
    *`"ya_paso"` se agregó el 2026-08-20, después de la revisión visual: la **regla** no distingue una
    cita que ya ocurrió de una que empieza en dos horas —las dos «faltan menos de 4 horas»— y eso está
    bien como regla, pero en pantalla decía «faltan menos de 4 horas» debajo de una cita de la mañana,
    a mediodía. **El rechazo de los endpoints no cambió**: sigue siendo `422` con
    `ventana_de_cancelacion`, y CA-3 quedó intacto. Lo único que se volvió más preciso es la
    explicación.*
  - `GET /api/citas` agrega también `servicioId` y `proveedorId`. Hasta hoy devolvía solo los
    **nombres**, y para reagendar hay que pedir el calendario de ese servicio con ese proveedor, que
    se pide por número.
  - `GET /api/citas` agrega además `grupo`, que vale `"proxima"` o `"historial"`. La pantalla muestra
    **«Tus próximas citas»** arriba y **«Historial»** abajo, y **en cuál va cada cita lo decide el
    servidor**. *Agregado el 2026-08-20, después de la revisión visual: esta misma pieza y la 3 dicen
    «el cliente ve sus **citas activas**», y la pantalla estaba mostrando todo mezclado en una lista
    que además crecía para siempre. RN-15 —«nada se borra»— habla de **los datos**, no de lo que la
    pantalla muestra.* Ojo: **es una pregunta distinta de `sePuedeCambiar`**. Una cita de hoy en dos
    horas no se puede cambiar (RN-5) pero **sí es una cita próxima** — es la más urgente que esa
    persona tiene, y mandarla al historial sería esconderle justo lo que necesita ver.

**Evidencia**

*2026-08-20 — construida.* **39 pruebas nuevas; `npm test` da 174 de 174.** Las 8 comprobaciones del
plan más las 2 agregadas ese día están cubiertas por pruebas automáticas que hablan con el API de
verdad, por HTTP:

| Comprobación | Cómo quedó cubierta |
|---|---|
| 1 — cancelar y desaparecer de las activas | `comprobación 1: el cliente cancela su cita y deja de estar activa` |
| 2 — el horario vuelve a estar libre | `comprobación 2` y `comprobación 2 bis` (esta última comprueba que **otra persona** lo puede tomar, que es lo que RN-7 dice de verdad) |
| 3 — la fila sigue existiendo, con estado, fecha y quién canceló | `comprobación 3`, mirando la tabla `cita` por dentro |
| 4 — reagendar mueve la cita | `comprobación 4`, más una que comprueba que **no** se creó una cita nueva |
| 5 — reagendar no cambia servicio ni proveedor | `comprobación 5`, mandándole al API el proveedor de otra persona **salteando la pantalla**: es la que demuestra que la regla vive en el servidor |
| 6 — cancelar dentro de las 4 horas se rechaza | `CA-3 (cliente)`, con la cita insertada a mano en la base — el API no la deja crear porque empieza hoy (RN-4) |
| 7 — reagendar esa misma cita se rechaza igual | `CA-3 (cliente): reagendar esa misma cita se rechaza igual` |
| 8 — **CA-3** corriendo en cada push | Las tres pruebas marcadas `CA-3` en el título, más las dos del borde exacto de la ventana (a 4 horas justas se permite, a 3 h 59 min no) |
| 9 — el correo del reagendamiento dice la fecha nueva | `comprobación 9` y `comprobación 9 bis` |
| 10 — cancelar pregunta antes | **No la cubre ninguna prueba automática**: es de pantalla, y ninguna prueba de este proyecto mira la página dibujada. Va en la revisión visual. |

*2026-08-20 — primera pasada de la revisión visual, y **encontró dos cosas**.*

**1. Una frase falsa.** Una cita de las 9 de la mañana decía, a mediodía, «Faltan menos de 4 horas para
esta cita». La cita ya había ocurrido. Se corrigió agregando el valor `"ya_paso"` al campo `porQueNo`
—ver el bloque *Produce* de arriba— con **2 pruebas nuevas** (`npm test` pasó de 168 a **170**). Es el
octavo defecto visual del proyecto, y como los siete anteriores lo encontró una persona mirando la
pantalla: ninguna prueba automática lee si una frase tiene sentido.

**2. La pantalla no hacía lo que este plan dice.** La estudiante notó que la cita cancelada se quedaba
en la lista para siempre, y al revisarlo apareció que **el código no cumplía el plan**: acá arriba, y
en la pieza 3, está escrito «el cliente ve sus **citas activas**», y la pantalla mostraba todo mezclado
—canceladas y pasadas incluidas— en una lista que crecía sin fin. El error de lectura fue confundir
RN-15 («nada se borra», que habla de **los datos**) con lo que la pantalla tiene que mostrar. Corregido
con el campo `grupo` y **dos secciones**: «Tus próximas citas» arriba, «Historial» abajo, ordenado de lo
más reciente a lo más viejo. **4 pruebas nuevas** (`npm test` pasó de 170 a **174**). La cita cancelada
sigue guardada en la base: solo se mudó de sección.

**3. La etiqueta decía «ACTIVA» en una cita del mes pasado.** La estudiante pidió que no dijera eso, y
propuso ella la solución que se adoptó: **sacarle la etiqueta**. Ahora la etiqueta aparece **solo
cuando algo le pasó a la cita** —cancelada, y completada o «no asistió» cuando llegue la pieza 8—; una
cita del historial que sigue `activa` no lleva ninguna, porque el título de la sección ya dice lo que
la etiqueta decía. La nota que iba debajo de esas filas también se sacó, por lo mismo.

*No dice «COMPLETADA», que era la primera idea, porque **la aplicación no sabe si la persona
asistió**: RN-17 dice que ese estado **solo** lo marca Personal y **nunca se alcanza por el paso del
tiempo**. Poner «COMPLETADA» sola le afirmaría a alguien que fue sin que nadie lo confirme, y se
daría vuelta el día que Personal marcara «no asistió» (RN-19). Así la etiqueta nunca se desdice: pasa
de **no estar** a decir COMPLETADA o NO ASISTIÓ, que es un avance. **Las tres reglas quedaron
intactas** y la pieza 8 no perdió nada.*

**Este tercer cambio no tiene ninguna prueba automática, y no puede tenerla:** es puramente de
pantalla —qué se dibuja y qué no—, el servidor no cambió en una sola línea, y ninguna prueba de este
proyecto mira la página dibujada. Queda cubierto solo por la revisión visual. *Lo que sí está
protegido por una prueba es la pieza que lo sostiene: la que comprueba que el servidor manda
`porQueNo = "ya_paso"` en una cita pasada. **Ese campo sigue haciendo falta aunque ya no muestre
nada**, porque es lo único que impide que una cita vieja caiga en el renglón que dice «faltan menos de
4 horas»: si el servidor dejara de distinguirlo, esa frase falsa volvería sola.*

**4. El «Historial» tenía un texto de más y el título flotando lejos de su tarjeta.** Se sacó la frase
de explicación —describía lo que la lista de abajo ya muestra— y el título quedó a 8px de su tarjeta en
vez de 16, con un modificador nuevo (`paso--titulo-pegado`) para no acercar de golpe los cinco títulos
de la pantalla de reservar. Sin prueba automática, por lo mismo que el punto 3.

**Y un cambio de vocabulario, aparte de los cuatro hallazgos:** al cliente se le dice **«terapista»**,
no «te atiende» ni «proveedor». Siete lugares de texto —tres en el HTML, tres en el JavaScript del
navegador y la etiqueta del correo—. **La tabla, las columnas y los campos del API siguen llamándose
`proveedor`** y no se renombraron: los nombres técnicos los fija este plan. Quedó en el glosario de
`ESPECIFICACION.md` para que no se lo confunda con una inconsistencia.

*Total: **39 pruebas** de esta pieza, `npm test` da **174 de 174**.*

**PIEZA CERRADA el 2026-08-20.** La estudiante corrió la revisión visual completa en el navegador y la
dio por terminada. De ella salieron **cinco cambios**, y **ninguno lo podía encontrar una prueba
automática**: tres eran defectos de *lo que la aplicación decía* —una frase falsa, el código no
cumpliendo lo que este plan pide, y una etiqueta que afirmaba algo que ya no era cierto—, uno de
vocabulario y uno de espaciado. El detalle de los cinco, con su razón, está en la entrada del
2026-08-20 de `BITACORA.md`.

*Comprobado además que la aplicación levanta con el código nuevo, que `publico/aplicacion-cliente.js`
no tiene errores de sintaxis, y que los 64 elementos que el JavaScript busca por `id` existen todos
en el HTML — un `id` mal escrito no lo detecta `npm test` y rompe la pantalla entera.*

*Falta para cerrarla: **la revisión visual en el navegador**, que es la única que puede encontrar los
defectos de pantalla. Los siete defectos visuales de este proyecto salieron todos de ahí.*

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
- Al crear una cita, Personal cumple **las mismas reglas de agenda** que el cliente: no puede tomar
  un horario ocupado, ni un feriado, ni fuera del horario del negocio ni en el almuerzo (RN-13).
- Personal **sí** puede reservar para **hoy mismo**, y mover una cita a un horario de hoy, siempre que
  ese horario todavía no haya empezado y esté libre (RN-25). El cliente no (RN-4, CA-2).
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
8. Como Personal, reservar para **hoy** en un horario que todavía no empezó: **lo acepta** (RN-25).
   El mismo intento hecho por el cliente sigue rechazándose (CA-2), y un horario de hoy que **ya
   empezó** también se rechaza. *Corregido el 2026-08-21: hasta entonces esta comprobación pedía lo
   contrario —«lo rechaza igual que al cliente»—, y el hueco se descubrió mirando la pantalla. La
   razón completa está en RN-25 de `ESPECIFICACION.md`.*
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
    existe **en cualquiera de las dos tablas de cuentas** (si coincidiera con la de Personal, al
    entrar no se sabría cuál de las dos es — es la misma razón que ya tenía el registro de la pieza
    1), y `422` si el nombre viene vacío o el correo no tiene forma de correo (RN-24). La cuenta
    nace con `debe_cambiar_contrasena = 1`.
  - `GET /api/personal/clientes?busqueda=` — solo para sesión de tipo `personal`; devuelve
    `[{id, nombre, correo}]`. Busca **pedazos** del nombre o del correo, sin distinguir mayúsculas.
    **Con menos de 2 letras devuelve la lista vacía**, no la lista completa *(decidido por la
    estudiante el 2026-08-21: Personal siempre sabe con quién está hablando, y una lista con todos
    deja los correos de todos los clientes a la vista de quien pase por el mostrador)*.
  - `GET /api/personal/clientes/:clienteId/citas` — solo para sesión de tipo `personal`; devuelve
    las citas de ese cliente con la misma forma que `GET /api/citas` de la pieza 3, pero con
    `sePuedeCambiar` y `porQueNo` **calculados como Personal**, así que una cita que empieza dentro
    de 2 horas llega con `sePuedeCambiar: true` (RN-6). Devuelve `404` si ese cliente no existe.
    *(Agregado el 2026-08-21, al diseñar esta pieza. El plan dejaba a Personal cancelar la cita de
    un cliente pero no decía **cómo la ve para poder tocarla**: `GET /api/citas` devuelve las citas
    de quien está en sesión, y Personal no tiene citas propias. Va bajo `/api/personal/` como las
    otras dos para que todas las puertas que solo abre Personal vivan en el mismo pasillo, en vez
    de dejar que un cliente pueda colar un `clienteId` ajeno en la puerta de siempre.)*
  - `POST /api/citas` acepta además `{clienteId}` cuando la sesión es de tipo `personal`, y en ese
    caso guarda canal `"asistida"` **y `personal_id_creador`** con la cuenta que la creó (RN-12).
    Devuelve `404` si ese `clienteId` no existe. Con sesión de cliente todo sigue igual que antes:
    canal `"en_linea"` y `personal_id_creador` vacío.
  - `POST /api/contrasena/cambiar` — **para cualquier sesión abierta**, de cliente o de Personal;
    recibe `{contrasenaActual, contrasenaNueva}`; comprueba la actual, exige que la nueva cumpla
    RN-23, la guarda cifrada y apaga `debe_cambiar_contrasena`; devuelve `204`. Devuelve
    `422 contrasena_actual_incorrecta` si la actual no coincide, y `422 contrasena_invalida` con la
    lista `faltan` si la nueva no cumple RN-23 — la misma forma que ya devuelve el registro de la
    pieza 12. Es `422` y no `403` porque no es un problema de permisos: la sesión es válida y la
    cuenta es la correcta; lo que no sirve es **el dato**.
  - `DELETE /api/citas/:citaId` y `PATCH /api/citas/:citaId` dejan de aplicar la ventana de 4 horas
    cuando la sesión es de tipo `personal`. **Las reglas de agenda se aplican igual** —horario
    ocupado, feriado, domingo, almuerzo (RN-13)—, y ahora también salen de `revisarHorario`, que
    **desde el 2026-08-21 sí sabe quién pregunta**.
  - **`POST /api/citas` y `PATCH /api/citas/:citaId` aceptan un horario de hoy cuando la sesión es de
    tipo `personal`** (RN-25), y lo rechazan con `422 horario_ya_empezo` si ese horario ya empezó. Con
    sesión de cliente el rechazo sigue siendo `422 mismo_dia` para todo el día de hoy, sin cambio
    alguno: eso es **CA-2**. *(Agregado el 2026-08-21, con RN-25.)*
  - **`GET /api/disponibilidad` devuelve el día de hoy con sus horarios libres cuando la sesión es de
    tipo `personal`**, y con `estado: "con_horarios"` en vez de `"hoy_o_pasado"` mientras quede alguno
    sin empezar. Para un cliente devuelve exactamente lo de siempre. Es el mismo principio de toda la
    pieza: **el servidor decide y la pantalla muestra**, así que quién puede tomar un horario de hoy se
    resuelve en `servidor/disponibilidad.js` y no en el navegador. *(Agregado el 2026-08-21, con
    RN-25.)*
  - **Mientras una cuenta de cliente tenga `debe_cambiar_contrasena` encendido, todos los endpoints
    de cliente la rechazan con `403 debe_cambiar_contrasena`** — las citas y `mi-informacion`. Es
    cómo se cumple RF-4 («antes de dejarlo hacer nada más») **en el servidor** y no solo en la
    pantalla: el frontend no decide reglas de negocio. Siguen abiertos `GET /api/yo`,
    `DELETE /api/sesion` y `POST /api/contrasena/cambiar`, que son justo los tres que esa pantalla
    necesita para poder existir y para poder salir de ahí. *(Agregado el 2026-08-21, al diseñar esta
    pieza: el plan pedía la obligación pero no decía dónde vivía.)*

**Evidencia**

*Construida el 2026-08-21. **76 pruebas nuevas** (58 en `pruebas/personal.test.js` y 18 en
`pruebas/cambio-de-contrasena.test.js`); `npm test` da **250 de 250**. Tres archivos nuevos en el
servidor (`servidor/personal.js`, `servidor/rutas/personal.js` y `servidor/quien-actua.js`), **ninguna
tabla ni columna nueva** y **ninguna dependencia nueva**.*

Las diez comprobaciones, y con qué se corrió cada una. Las marcadas «API de verdad» se corrieron
además contra la aplicación levantada con `npm start` y la base de `npm run datos`, no solo contra las
pruebas automáticas.

| # | Qué pide | Resultado |
|---|---|---|
| 1 | Reservar a nombre de un cliente que existe; canal `asistida` y `personal_id_creador` | ✅ prueba «comprobación 1…» y **API de verdad**: la fila quedó `canal='asistida'`, `personal_id_creador=1`, `cliente_id=1` |
| 2 | Ese cliente recibe el correo de confirmación | ✅ prueba «comprobación 2…»: el correo sale con `para` = el correo del **cliente**, no de Personal |
| 3 | Crear la cuenta de un correo nuevo y ver una contraseña temporal | ✅ prueba «comprobación 3…» y **API de verdad**: devolvió `Puente146` |
| 4 | Entrar con la temporal: el sistema exige cambiarla antes de seguir | ✅ tres pruebas «comprobación 4…» y **API de verdad**: `GET /api/citas` → `403 debe_cambiar_contrasena` |
| 5 | Cambiarla, salir, y volver a entrar con la nueva: entra normal | ✅ dos pruebas «comprobación 5…» y **API de verdad**: `204`, y al volver a entrar `debeCambiarContrasena: false` |
| 6 | La contraseña temporal vieja queda rechazada | ✅ prueba «comprobación 6…» y **API de verdad**: `401 credenciales_invalidas` |
| 7 | Personal no puede tomar un horario ya ocupado | ✅ prueba «comprobación 7…»: `409 horario_no_disponible` |
| 8 | **Personal sí puede reservar para hoy** en un horario que no empezó (RN-25) | ✅ tres pruebas «comprobación 8…» y **API de verdad**: `201` para un horario de hoy sin empezar, `422 horario_ya_empezo` para uno que ya arrancó, y `422 mismo_dia` para el cliente — **CA-2 intacto** |
| 9 | Cita que empieza en 2 horas: Personal la cancela y queda `cancelada_por` = personal | ✅ prueba «CA-3 (Personal): Personal cancela…» y **API de verdad**: `204`, y la fila quedó `cancelada_por='personal'` con su `cancelada_en` |
| 10 | La prueba automática de CA-3 (parte Personal) devuelve `204` y pasa en el push | ✅ tres pruebas marcadas `CA-3` en el título. **Contra la aplicación de verdad, la misma cita: al cliente `422`, a Personal `204`** |

**CA-3 quedó cubierto por completo, y las dos mitades salen de la misma función.** No hay ninguna
regla nueva escrita para Personal: `revisarSiSePuedeCambiar` de `servidor/reservas.js` recibe
`QUIEN_CLIENTE` o `QUIEN_PERSONAL`, y eso es todo. Con esto **los tres criterios de aceptación del
curso están enteros**, comprobados en cada push y en Node 20 y Node 24.

**Cuatro decisiones de la estudiante**, tomadas antes de escribir código y anotadas con su razón en
`DISENO.md`, «Decisiones tomadas al construir la pieza 7»: la pantalla de Personal es la misma con un
paso más arriba; la contraseña temporal es una palabra y tres números (`Girasol472`); el formulario de
cambio tiene dos campos y la pantalla recuerda la temporal; y el buscador no muestra nada hasta que se
escriben 2 letras.

**Dos cosas que este plan no decía y quedaron escritas antes de construirse**, arriba en el bloque
*Produce*: la puerta `GET /api/personal/clientes/:clienteId/citas` —el plan dejaba a Personal cancelar
la cita de un cliente pero no decía cómo la ve para poder tocarla— y **dónde vive la obligación de
RF-4**, que resultó ser el guardia de la sesión y no la pantalla.

**Dos pruebas viejas se reescribieron, no se borraron.** Las de las piezas 3 y 5 que decían que
Personal **no** podía reservar ni cancelar por esos endpoints, y cuyos comentarios ya avisaban «eso es
la pieza 7». Hoy dicen la verdad de ahora y conservan escrita la razón histórica: la de reservar sigue
protegiendo exactamente lo mismo —que una cita nunca quede con el id de Personal en `cliente_id`—, solo
que ahora eso se logra obligándolo a decir para quién en vez de cerrándole la puerta.

**La revisión visual corrigió una regla de negocio, y es el hallazgo más importante de esta pieza.**
La estudiante abrió el día de hoy con la cuenta de Personal y leyó *«No se puede reservar para hoy. Si
necesitás una cita hoy, **llamá al negocio** al 2000-0000»*: un cartel diciéndole a la asistente del
negocio que llame al negocio.

El texto era absurdo **porque la regla detrás tenía un hueco**, y es **el mismo hueco que RN-6 existe
para tapar**: la aplicación manda al cliente a llamar, y la asistente que atendía esa llamada
descubría que ella tampoco podía agendarla — así que la cita terminaba en un papel, que es la segunda
fuente de verdad que `NEGOCIO.md` dice haber eliminado. Se corrigieron **los dos**: nació **RN-25** en
`ESPECIFICACION.md` y se cambió esta comprobación 8, que pedía literalmente lo contrario.

**12 pruebas nuevas** para la regla, y **CA-2 quedó intacto**: el cliente sigue sin poder reservar
para hoy, y hay pruebas del lado del cliente al lado de las de Personal para que las dos mitades se
lean juntas. **Ninguna prueba automática podía encontrar esto**: el texto aparecía, y era falso solo
**para quien lo estaba leyendo**.

**La misma revisión pidió una forma de volver al inicio**, que no estaba en el plan: la entrada
**«Inicio»** en los dos menús, solo para Personal, y **la marca del encabezado —el logo y el nombre—
clickeable para las dos cuentas**. Las dos se apagan donde no hay inicio al que volver: la pantalla de
entrar y la del cambio obligatorio de contraseña, porque ahí RF-4 dice que no se puede hacer nada más.
No cambió ningún endpoint ni ninguna regla: es todo navegación de pantalla. *Hubo además una segunda
entrada, «Nueva llamada», que se construyó y se sacó el mismo día por decisión de la estudiante — la
razón está en `DISENO.md` y en `BITACORA.md`.*

**Y una regla que se decidió NO agregar, escrita como decisión y no dejada al olvido:** un mínimo de
anticipación en horas para el cliente. «No hoy» ya garantiza poco más de 9 horas, así que 4 horas
sumadas nunca rechazarían nada, y reemplazando a «no hoy» **eliminarían CA-2**. La razón completa está
en `DISENO.md` y en `BITACORA.md`.

**Y un cuarto hallazgo, de la misma familia que el primero:** como Personal, mirando las citas de un
cliente, **nada en pantalla decía de quién eran**. El único nombre era el de la asistente («Hola,
Marta Jiménez») y el título decía «Sus próximas citas», un pronombre sin dueño. Ahora los dos títulos
de la sección llevan el nombre: «Próximas citas de Marisol Prueba» y «Historial de Marisol Prueba».
No cambió ningún endpoint: es texto de pantalla.

**Y un quinto ajuste, de navegación:** la tarjeta «Atendiendo a» tenía un solo botón, así que para
ver las citas de la persona elegida había que ir a buscar el menú. Ahora tiene dos, **«Citas del
cliente»** y «Otra persona», los dos pegados a su nombre. Sin HTML ni CSS nuevo: la fila reusa la
clase que ya usaban las otras filas de dos botones. *(El segundo botón se llamó «Atender a otra
persona» hasta el 2026-08-24 — ver abajo.)*

**La revisión visual quedó TERMINADA el 2026-08-24, y la pieza CERRADA.** Las tres cosas que faltaban
se miraron en el navegador, con la aplicación levantada:

| Qué faltaba mirar | Resultado |
|---|---|
| La contraseña temporal en grande, para poder dictarla por teléfono | ✅ Se lee de un vistazo; las letras separadas cumplen su función |
| Recargar la página (`F5`) en el cambio obligatorio de contraseña | ✅ **Aparecen los tres campos**, cada uno con su ojito. La pantalla pide la temporal en vez de trabarse |
| La pantalla angosta: el paso «¿Quién llama?», los resultados de la búsqueda y la fila de dos botones | ✅ Nada se sale ni se pisa |

**No apareció ningún defecto nuevo.** Sí se resolvieron las tres decisiones que habían quedado
abiertas de la revisión:

1. **La etiqueta que partía en dos líneas se acortó a «Otra persona»** (entra en una línea desde
   476px). Se eligió acortar la etiqueta y **no** ensanchar el botón ni mover el corte, porque el 48%
   y el 476px los pidió la estudiante mirando la pantalla; y el verbo no se perdió, porque ya está
   dicho en el título de la tarjeta que lo contiene, «Atendiendo a». **Es un cambio de texto en la
   vista: ninguna función, ningún endpoint y ninguna prueba cambiaron.**
2. **El corte de 476px se queda como modificador de una sola fila** (`confirmacion__botones--fila-centrada`),
   no se unifica para las cuatro. Las otras tres filas de dos botones ya estaban revisadas y
   aprobadas como están, y unificar las movería sin que nadie las hubiera vuelto a mirar. El costo,
   asumido a propósito: entre 476 y 767px la aplicación tiene dos comportamientos.
3. **Los botones «Reagendar» y «Cancelar» sobre una cita ya pasada se quedan como están, y la
   decisión se difiere a la pieza 8**, que es la que trae las herramientas pensadas para ese caso
   (marcar «completada» o «no asistió»). No se inventa ninguna regla desde el código: la
   especificación no prohíbe que Personal toque una cita pasada, y restringirlo se escribiría primero
   en `ESPECIFICACION.md`. **Queda anotado como punto abierto, no como olvido.**

**Y un hallazgo de la revisión que NO terminó en un cambio de código, y por eso vale contarlo.** Se
reportó que el campo de la contraseña temporal no aparecía al recargar. Se investigó antes de tocar
nada: se reprodujo el pedido del navegador con `curl` (el servidor devolvía bien
`debeCambiarContrasena: true`), se comparó el JavaScript servido contra el del disco (idénticos, sin
caché vieja), se leyó el CSS compilado (la regla `[hidden]` estaba puesta) y se revisó el código
(correcto). **No había defecto: había fallado el recorrido escrito**, que hacía tocar «Salir» a
destiempo — y esa pantalla tiene su propio botón «Salir» justo abajo. Al repetirlo bien, los tres
campos aparecieron. *La lección quedó en `CLAUDE.md`: un recorrido de revisión tiene que decir qué
botones **no** tocar.*

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
- **Sobre una cita que ya pasó, cerrarla es lo único que se puede hacer: «Reagendar» y «Cancelar» no
  se ofrecen ni funcionan, tampoco para Personal (RN-26).** *(Punto agregado el 2026-08-24, al
  arrancar la pieza: es la decisión que la pieza 7 dejó abierta a propósito, y la regla que la
  resuelve —RN-26— se escribió en `ESPECIFICACION.md` antes de tocar código.)*

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
9. **Sobre una cita pasada, Personal no ve «Reagendar» ni «Cancelar»; y el pedido directo al API
   para cancelarla o moverla se rechaza, tanto con la sesión de Personal como con la del cliente
   (RN-26).**
10. **Una cita del futuro sigue teniendo sus dos botones, para los dos actores: la regla nueva no se
    llevó por delante RN-6 ni CA-3.**

**Toca:** Reservas, Interfaz.

**Interfaces**
- *Consume:* la tabla `cita` y `GET /api/citas` de la pieza 3; el campo `tipo` de la sesión de la
  pieza 1; la pantalla de Personal de la pieza 7.
- *Produce:*
  - `GET /api/personal/citas-por-cerrar` — solo para sesión de tipo `personal`; devuelve las citas
    con estado `"activa"` cuyo `inicio` ya pasó: `[{id, cliente, servicio, proveedor, inicio}]`.
  - `PATCH /api/personal/citas/:citaId/cierre` — solo para sesión de tipo `personal`; recibe
    `{estado}` con valor `"completada"` o `"no_asistio"`; devuelve `200`; devuelve `403` si la
    sesión es de un cliente y `409` si la cita ya no está activa.

    *La dirección se corrigió el 2026-08-24, al arrancar la pieza. Estaba escrita
    `PATCH /api/citas/:citaId/cierre`, de antes de que la pieza 7 fijara la convención **«todo lo
    que solo abre Personal vive bajo `/api/personal/`»** —para que el permiso se lea de un vistazo
    en la dirección, sin abrir el código—. El propio bloque se contradecía: el `GET` de arriba sí la
    seguía. **Decidido por la estudiante el 2026-08-24**, eligiendo la convención más nueva y con su
    razón escrita, por encima de la dirección más vieja.*
  - Los campos `cerrada_en` y `cerrada_por` de la tabla `cita` quedan llenos.
  - **Un motivo de rechazo nuevo, `ya_paso`, con `422`**, que `DELETE /api/citas/:citaId` y
    `PATCH /api/citas/:citaId` devuelven cuando la cita ya ocurrió (RN-26) — **para los dos
    actores**. Antes ese caso se le contestaba al cliente `ventana_de_cancelacion` y a Personal no se
    le contestaba nada, porque lo dejaba pasar. *(Agregado el 2026-08-24; ver la corrección en el
    bloque «Produce» de la pieza 5.)*

**Evidencia**

**Construida y CERRADA el 2026-08-24.** `npm test` da **277 de 277** — 27 pruebas nuevas en
`pruebas/cierre-de-citas.test.js`, escritas antes del código y **vistas fallar primero**. Las diez
comprobaciones se corrieron: siete contra la aplicación levantada por una persona, y tres como pedido
directo al API, porque son rechazos que no tienen pantalla.

| # | Qué pedía | Cómo se comprobó | Resultado |
|---|---|---|---|
| 1 y 2 | Dos citas pasadas de dos clientes distintos aparecen en la lista | En el navegador, con la cuenta de Personal: aparecieron las de **Marisol Prueba** y **ana torres**, cada una con el nombre de su dueño | ✅ |
| 3 | Marcar una completada y la otra no asistió | Una con cada botón, con su pregunta de confirmación de por medio | ✅ |
| 4 | En la base quedan los dos estados, con `cerrada_en` y `cerrada_por` | Consultado directo en SQLite: `completada` y `no_asistio`, las dos con la hora del cierre y el id de la cuenta de Personal | ✅ |
| 5 | Recargar la lista: ninguna de las dos sigue apareciendo | Se recargó: desaparecieron las dos | ✅ |
| 6 | Una tercera cita sin tocar sigue activa. **Nada la cierra sola** | Tres citas quedaron sin tocar; se salió y se volvió a entrar a la sección varias veces: **las tres siguen activas**, con `cerrada_en` y `cerrada_por` vacíos | ✅ |
| 7 | El cliente no tiene la opción, y el pedido directo al API se rechaza | En pantalla: entrando como Marisol **no aparece «Citas por cerrar»** en el menú y sus citas pasadas no tienen ningún botón. Por API: `PATCH /api/personal/citas/6/cierre` con su sesión → **`403 solo_personal`**, y la cita quedó intacta | ✅ |
| 8 | Volver a cerrar una cita ya cerrada se rechaza | `PATCH` sobre la cita 3, ya `completada`, pidiendo `no_asistio` → **`409 cita_no_activa`**. Sigue `completada`: el primer cierre es el que vale | ✅ |
| 9 | **RN-26:** sobre una cita pasada no hay «Reagendar» ni «Cancelar», y el API los rechaza | En pantalla: las tres citas pasadas de Marisol muestran **«Completada» y «No asistió»**, y ninguna muestra los otros dos. Por API: `DELETE /api/citas/6` con la sesión de **Personal** → **`422 ya_paso`**, y la cita no se movió ni cambió de estado | ✅ |
| 10 | Una cita futura conserva sus dos botones, para los dos actores | En pantalla: la cita del **27 de agosto** de melalo sigue con «Reagendar» y «Cancelar». Y dos pruebas automáticas lo fijan: la misma cita que empieza en 2 horas se le **sigue** aceptando a Personal (`204`) y rechazando al cliente (`422 ventana_de_cancelacion`) | ✅ |

**Una regla de negocio nueva, escrita antes que el código.** La pieza 7 había dejado abierta a
propósito la pregunta de qué botones ve Personal sobre una cita que ya pasó. La estudiante decidió el
2026-08-24 **sacarle «Reagendar» y «Cancelar»**, y la regla se escribió como **RN-26** en
`ESPECIFICACION.md` —con la corrección propagada a RN-6, RN-13, RN-17, RF-18 y un recorrido— **antes
de tocar una línea de código**. La razón de fondo es RN-19: reagendar mueve la misma cita, así que
mover la de alguien que no se presentó **borraría del registro que faltó**.

**Una corrección al propio bloque *Produce* de esta pieza**, decidida por la estudiante el mismo día:
el endpoint del cierre estaba escrito `PATCH /api/citas/:citaId/cierre`, de antes de que la pieza 7
fijara la convención «todo lo que solo abre Personal vive bajo `/api/personal/`». Quedó
**`PATCH /api/personal/citas/:citaId/cierre`**.

**Un rechazo que el plan no había previsto**, adoptado al construir y anotado como decisión: cerrar
una cita **que todavía no ocurrió** devuelve `422 todavia_no_paso`. Sale directo de RN-17, que dice
que «completada» se marca *después de que el cliente asistió*.

**La revisión visual encontró un defecto que ninguna prueba podía ver, y es el hallazgo número 20 del
proyecto.** Al salir de la aplicación y volver a entrar con la cuenta de Personal, la tarjeta
«Atendiendo a» **seguía mostrando a la persona de la sesión anterior**. La causa: «olvidar la
llamada» estaba escrito **en dos mitades** —el dato lo borraba el logout, la pantalla la limpiaba el
botón «Otra persona»— y las dos no decían lo mismo. Arrastraba dos consecuencias peores que el cartel
viejo: **Personal se quedaba sin buscador** para elegir a otra persona, y **la contraseña temporal de
un cliente sobrevivía al logout en pantalla**. Se corrigió sacando la regla a un solo lugar
(`limpiarLaLlamada`), que ahora usan los dos caminos.

**Lo que esta pieza NO tocó:** ninguna tabla ni columna nueva —`cerrada_en` y `cerrada_por` existían
vacías desde la pieza 3—, ninguna dependencia nueva, y **CA-1, CA-2 y CA-3 intactos**.

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

### Pieza 12: Reglas para la contraseña y el correo al crear la cuenta

*Pedida por la estudiante el 2026-08-19, fuera del plan original, mientras esperaba su cuenta de
Resend. **Resuelve un pendiente que estaba abierto desde la pieza 1** y anotado en `SEGUIMIENTO.md`:
«decidir si la contraseña lleva un largo mínimo. Hoy no lo lleva, a propósito: ningún documento lo
pide y no se agregó una regla de negocio desde el código». Ahora sí hay documento que lo pide: RN-23
y RN-24 de `ESPECIFICACION.md`, escritas antes de construir esta pieza.*

*Toca el registro, que es de la **pieza 1, ya cerrada**. Por eso lo primero que se corrigió fue
`ESPECIFICACION.md`, y solo después el código — el mismo camino de las piezas 10 y 11.*

**Qué tiene que ser cierto**
- Una contraseña nueva cumple las tres condiciones de RN-23: **6 caracteres o más**, **al menos una
  mayúscula** y **al menos un número**. Si le falta alguna, el registro se rechaza y el mensaje dice
  **cuál** falta.
- Un correo sin forma de correo se rechaza al registrarse (RN-24).
- **La regla la hace cumplir el servidor**, no la pantalla: un pedido mandado al API por fuera del
  navegador se rechaza igual.
- **Al entrar (RF-2) no se comprueba nada de esto.** Las cuentas que ya existían siguen entrando con
  la contraseña que tenían, aunque no cumpla las reglas nuevas.
- Mientras la persona escribe la contraseña, la pantalla muestra **dos renglones** con las
  condiciones, que se ponen verdes con un ✓ a medida que se cumplen y rojos cuando no (RF-23). Antes
  de escribir la primera letra están en gris.
- El correo se comprueba **al salir del campo**, no en cada tecla: marcar en rojo un correo a medio
  escribir es regañar por algo que la persona todavía está haciendo.

**Con qué se comprueba**
1. Registrarse con `abc` → se rechaza, y el mensaje nombra las tres condiciones que faltan.
2. Registrarse con `abcdefg` (largo, sin mayúscula, sin número) → se rechaza, y el mensaje nombra
   **solo** lo que falta: la mayúscula y el número. No las que ya se cumplen.
3. Registrarse con `Abc12` (mayúscula y número, pero 5 caracteres) → se rechaza por el largo.
4. Registrarse con `Abc123` → **se acepta**. Es el caso justo en el límite: 6 caracteres exactos.
5. Registrarse con el correo `ana` y con `ana@ejemplo` → los dos se rechazan; `ana@ejemplo.com` se
   acepta.
5b. Registrarse con `Ángela2026` → **se rechaza** por dos motivos a la vez: la `Á` no cuenta como
   mayúscula, y además ninguna letra puede llevar tilde. Con `Angela2026` se acepta.
5c. Registrarse con `óArtolo123` → **se rechaza**. Es el caso que destapó la regla: pasaba por la
   `A` de «Artolo», no por la `ó`.
5d. Registrarse con `Contraseña123` → **se acepta**. La ñ es una letra del alfabeto, no una vocal
   acentuada, y la regla no la prohíbe. Con `PequeÑo123` también.
6. Entrar con una cuenta que ya existía y cuya contraseña no cumple las reglas nuevas → **entra
   igual**.
7. Mandarle el pedido de registro al API **sin pasar por la pantalla**, con una contraseña de una
   letra → se rechaza igual. Es lo que demuestra que la regla vive en el servidor.
8. En el navegador: comprobar que **los renglones de requisitos no se ven** al abrir la pantalla,
   que **aparecen al tocar el campo de la contraseña**, que se esconden si se sale del campo sin
   escribir nada, y que escribiendo letra por letra cambian de gris a rojo y de rojo a verde.

**Toca:** Autenticación, Interfaz.

**Interfaces**
- *Consume:* `POST /api/registro` de la pieza 1.
- *Produce:*
  - `POST /api/registro` devuelve `422` con `{error: "contrasena_invalida", faltan: [...]}` cuando la
    contraseña no cumple RN-23. `faltan` es una lista con los nombres de las condiciones que no se
    cumplieron: `"largo"`, `"mayuscula"`, `"numero"`. Se manda la lista y no un texto armado porque
    **quién escribe el mensaje es la pantalla**, igual que en el resto del proyecto.
  - `POST /api/registro` devuelve `422` con `{error: "correo_invalido"}` cuando el correo no tiene
    forma de correo (RN-24).
  - La regla de RN-23, escrita **en un solo lugar** del servidor, que las piezas 7 y 9 reutilizan
    cuando les toque crear o cambiar una contraseña.

**Evidencia**

*Construida el 2026-08-19, el mismo día que se pidió.*

**Pruebas automáticas — `npm test`: 135 pruebas, 135 pasan, 0 fallan.** De esas, **26 son nuevas de
esta pieza**. Se escribieron antes del código y **se vieron fallar primero**: la corrida previa dio
«tests 17, pass 9, fail 8», y las 8 que fallaban eran exactamente las de las reglas nuevas — las 9
que pasaban comprobaban que nada de lo anterior se rompiera. Viven en
`pruebas/contrasenas-y-correos.test.js`.

**Las 8 comprobaciones de arriba:**

| # | Resultado |
|---|---|
| 1 | `abc` → **`422`** con `{"error":"contrasena_invalida","faltan":["largo","mayuscula","numero"]}`, y **ninguna cuenta guardada**. Comprobado también contra la aplicación de verdad en `http://localhost:3000`. |
| 2 | `abcdefg` → **`422`** con `faltan: ["mayuscula","numero"]`. **No nombra el largo**, que ya se cumplía. Comprobado también contra la aplicación de verdad. |
| 3 | `Abc12` → **`422`** con `faltan: ["largo"]`, y solo eso. |
| 4 | `Abc123` → **`201`**. El borde exacto: RN-23 dice «al menos 6», así que 6 entra. Comprobado también contra la aplicación de verdad. |
| 5 | `ana` y `ana@ejemplo` → los dos **`422 correo_invalido`**, sin guardar nada; `ana@ejemplo.com` → **`201`**. Se comprobaron además `ana ro@ejemplo.com`, `ana@@ejemplo.com`, `@ejemplo.com` y `ana@.com` (rechazados), y `ana.maria-lopez@sub.ejemplo.co.cr` (aceptado): la regla tiene que atrapar el dedazo **sin** rechazar direcciones legítimas. |
| 6 | Se insertó a mano una cuenta con la contraseña `hola` —que no cumple ninguna de las tres condiciones— y **entró igual**: `200`. También sigue entrando la cuenta de Personal precargada. RN-23 se aplica al **elegir** una contraseña, no al usarla. |
| 7 | **CUMPLIDA.** La prueba usa `fetch` pelado contra el API, **sin el ayudante que simula el navegador**, con la contraseña `a` → **`422 contrasena_invalida`** y cero cuentas guardadas. Es lo que demuestra que la regla vive en el servidor y no en el JavaScript de la página. |
| 5b | **CUMPLIDA.** `Ángela2026` → `422` con `faltan: ["mayuscula","sin_acentos"]`; `Angela2026` → `201`. |
| 5c | **CUMPLIDA.** `óArtolo123` → `422` con `faltan: ["sin_acentos"]`; `Contrasena123` → `201`. Se comprobaron además la diéresis (`Pingüino123`), un acento en minúscula en medio de la palabra (`Angéla2026`) y una contraseña que falla por las cuatro condiciones a la vez (`añí`). |
| 5d | **CUMPLIDA.** `Contraseña123` → `201`, y `PequeÑo123` → `201`. Se comprobó además que `ñañaña` falla **solo** por lo que le falta —mayúscula y número— y que las eñes no aparecen en la lista de motivos. |

**Las comprobaciones 5b, 5c y 5d nacieron de la revisión visual, en tres rondas**, y las tres son
correcciones que hizo la estudiante mirando la pantalla, no cosas que estuvieran planeadas:

1. Probó `Ángela2026` → decidió que una mayúscula con tilde no cuente como mayúscula.
2. Probó `óArtolo123` y la vio pasar → **la regla hacía lo que decía pero no lo que ella quería**
   (pasaba por la `A` de «Artolo», no por la `ó`), así que se cambió la regla, no la explicación.
3. **Corrigió la ronda anterior**: ese cambio también prohibía la ñ, y ella lo señaló — «la ñ no es
   una tilde, es una letra». Tenía razón, y la regla se volvió a ajustar.

Es el mejor ejemplo del proyecto de por qué `CLAUDE.md` exige que **una pieza no se cierre sin que
una persona abra el navegador y mire**: ninguna de las tres rondas la podía encontrar una prueba
automática, porque las tres eran sobre qué *tenía que* decir la regla, no sobre si el código cumplía
lo escrito.
| 8 | **CUMPLIDA.** La estudiante la recorrió en el navegador el 2026-08-19 y confirmó que se ve y funciona como corresponde. Y no fue una mirada de trámite: **de esa misma revisión salieron las tres correcciones a la regla** (5b, 5c y 5d) más seis cambios visuales que ella pidió sobre la marcha —los renglones a 12px, escondidos hasta tocar el campo, sin los íconos ✓/✗, el texto «No tildes», el logo en el encabezado con los textos invertidos, y el azul nuevo—. Volvió a mirar la pantalla con todos ellos puestos y la confirmó. |

**Comprobado además que las reglas nuevas no pisaron las que ya existían:** un correo repetido sigue
dando `409 correo_ya_registrado` (no `422`), y un registro sin nombre sigue dando
`422 datos_incompletos`.

**Integración continua — EN VERDE.** Push del 2026-08-19, commit `bf17952`, confirmado por la
estudiante en la pestaña Actions: las 135 pruebas pasan en Node 20 y en Node 24.

**Revisión visual — HECHA por la estudiante el 2026-08-19**, y es la comprobación 8 de esta pieza.

**Con esto la pieza 12 queda CERRADA**, con sus 8 comprobaciones cumplidas y la corrida de
integración continua en verde.

**Lo que esta pieza deja aprendido, y que vale más que la pieza en sí:** de una sola revisión visual
salieron **tres correcciones a la regla de negocio** y **seis cambios visuales**. Ninguna de las nueve
la podía encontrar una prueba automática. Las tres de la regla, porque eran sobre *qué tenía que
decir* la regla y no sobre si el código cumplía lo escrito; las seis visuales, porque ninguna prueba
de este proyecto mira la página dibujada. Es la evidencia más clara que tiene el plan de por qué
`CLAUDE.md` exige que **una pieza no se cierre sin que una persona abra el navegador y mire**.

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
