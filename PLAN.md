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
| 1 | Entrar a la aplicación | — | pendiente |
| 2 | Elegir servicio y proveedor, y ver el calendario | 1 | pendiente |
| 3 | Reservar un horario | 2 | pendiente |
| 4 | Correo de confirmación | 3 | pendiente |
| 5 | Cancelar y reagendar | 3 | pendiente |
| 6 | Recordatorio de 24 horas | 4 y 5 | pendiente |
| 7 | Personal atiende el teléfono | 5 | pendiente |
| 8 | Personal cierra las citas pasadas | 7 | pendiente |
| 9 | Restablecer la contraseña olvidada | 4 | pendiente |

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
8. Entrar con la cuenta precargada de Personal y ver que la aplicación la reconoce como tipo
   `personal`.

**Toca:** Autenticación, Interfaz.

**Interfaces**
- *Consume:* nada.
- *Produce:*
  - Base SQLite en archivo, con las tablas `cliente` (id, nombre, correo, contrasena_cifrada,
    debe_cambiar_contrasena) y `personal` (id, nombre, correo, contrasena_cifrada).
  - `POST /api/registro` — recibe `{nombre, correo, contrasena}`; devuelve `201` con
    `{id, nombre, correo, tipo}` donde `tipo` es `"cliente"`; devuelve `409` si el correo ya existe.
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

---

### Pieza 2: Elegir servicio y proveedor, y ver el calendario

Es un solo recorrido: el cliente no puede ver un calendario sin haber elegido antes para qué
servicio y con quién. Acá vive el cálculo de disponibilidad, que es la parte más delicada del
proyecto — `PROYECTO.md` §7.6 pide justamente vigilar que la lógica de calendario no parezca
correcta y falle en los casos borde.

**Qué tiene que ser cierto**
- El cliente que entró ve los servicios del negocio, cargados de la configuración (RF-5).
- Al elegir un servicio, ve sus proveedores. Si tiene uno solo, igual queda claro quién lo atiende
  (RN-8).
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

Datos de prueba: dos servicios («Masaje relajante» y «Limpieza facial»), dos proveedores («Ana» y
«Carlos»), Ana atiende los dos servicios y Carlos solo el masaje. Todo inventado.

1. Entrar como cliente y ver los dos servicios en pantalla.
2. Elegir «Masaje relajante»: aparecen Ana y Carlos. Elegir «Limpieza facial»: aparece solo Ana.
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
  - Tablas `servicio` (id, nombre, duracion_minutos), `proveedor` (id, nombre),
    `servicio_proveedor` (servicio_id, proveedor_id) y `configuracion_negocio` (horario semanal,
    feriados, ubicación, logo, colores).
  - `GET /api/servicios` — devuelve `[{id, nombre, duracionMinutos}]`.
  - `GET /api/servicios/:servicioId/proveedores` — devuelve `[{id, nombre}]`.
  - `GET /api/disponibilidad?servicioId=&proveedorId=&mes=YYYY-MM` — devuelve
    `{mes, dias: [{fecha, esFeriado, horarios: [{inicio, disponible}]}], hayHorariosEnProximos7Dias}`,
    donde `inicio` es la fecha y hora de inicio del horario en formato ISO.
  - La función de disponibilidad, que es la que toda pieza posterior consulta para saber si un
    horario se puede tomar.

**Evidencia**

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
  - `POST /api/citas` — recibe `{servicioId, proveedorId, inicio}`; devuelve `201` con
    `{id, servicioId, proveedorId, inicio, estado, canal}`; devuelve `409` con
    `{error: "horario_no_disponible"}` si otro ya lo tomó, y `422` con `{error: "mismo_dia"}` si el
    horario es de hoy o del pasado.
  - `GET /api/citas` — devuelve las citas del cliente en sesión:
    `[{id, servicio, proveedor, inicio, estado}]`.
  - La configuración de integración continua que corre las pruebas en cada push.

**Evidencia**

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
| Recorrido «Reserva en línea» (el principal, de punta a punta) | 1 + 2 + 3 + 4 |
| RNF-1, RNF-2, RNF-3 | Ninguna pieza los construye: RNF-1 es la decisión de **no** construir alta disponibilidad, y RNF-2 y RNF-3 declaran que a este volumen no se deriva ningún requisito de rendimiento. |

## Fuera del plan

| Qué | Por qué |
|---|---|
| Expediente del cliente (padecimientos, medicamentos, contraindicaciones, tratamientos, paquetes de sesiones) | Es PA-1 de `ESPECIFICACION.md`, sin resolver. Depende de PA-2. |
| Registrar que un cliente tiene un paquete de sesiones | Es PA-2. El sistema no registra dinero, así que no hay de dónde saber que alguien compró un paquete. Hoy el negocio lleva a mano el descuento de una sesión perdida. |
| Reporte semestral de reservas en línea contra teléfono | Hoja de ruta de `NEGOCIO.md`. El dato que lo alimenta —el campo `canal` de la cita— sí queda guardado desde la pieza 3, así que el reporte se construye después agrupando por ese campo, sin cambiar nada de lo ya hecho. |
| Panel de administración con interfaz, lista de espera automatizada, duraciones variables por servicio, política de cancelación configurable, varias sucursales | Declarados fuera de alcance en `ESPECIFICACION.md`. |
| Alojar la aplicación en producción y migrar ahí el disparador del recordatorio | Decisión dejada abierta en `DISENO.md`; no corresponde a esta entrega. |
| La skill propia de arranque que pide la rúbrica del curso | No es un requisito del sistema: no aparece en `ESPECIFICACION.md` y por eso no es una vertical slice. Es un entregable del curso y está anotado como pendiente en `SEGUIMIENTO.md`. |
</content>
