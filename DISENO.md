# Reservas en línea para negocios de bienestar y salud — Diseño arquitectónico

## Panorama de la arquitectura

La aplicación tiene un **backend en JavaScript (Node.js + Express)** que expone un API: ahí
viven las reglas de negocio (disponibilidad, no doble reserva, bloqueo de cancelación tardía) y
la base de datos SQLite. Un **frontend en HTML + CSS con SASS** consume ese API y es lo único
que el cliente ve y toca.

Dos piezas trabajan por su cuenta, sin que nadie las llame directamente: un **servicio de correo
(Resend)** que manda las confirmaciones y recordatorios, y una **tarea programada en GitHub
Actions** que le avisa al backend, cada cierto tiempo, que revise si hay recordatorios
pendientes de mandar.

```
Cliente (navegador)
      │  HTML/CSS/SASS
      ▼
  Frontend  ──── API ────▶  Backend (Node.js + Express)
                                   │           │
                                   ▼           ▼
                              SQLite      Resend (correos)
                                   ▲
                                   │  dispara cada cierto tiempo
                          GitHub Actions (programado)
```

*Nota de alcance: el diseño agrega una cuenta de tipo Personal (la asistente del negocio), que
usa la misma aplicación para registrar las citas que le llegan por teléfono — así no hay una
segunda fuente de verdad que se pueda desincronizar con la de la app. No contradice
`PROYECTO.md`; lo completa. Detalle completo en `DISENO1.md`.*

## Componentes

**1. Autenticación** — Login y sesión (7 días) para dos tipos de cuenta (Cliente y Personal,
esta última precargada), y recuperación de contraseña por correo (enlace de un solo uso, vence
en 1 hora). *Límite:* los demás componentes le preguntan quién es y de qué tipo antes de dejarla
actuar; no sabe nada de citas ni servicios.

**2. Catálogo** — **Categorías, servicios por categoría**, proveedores por servicio, y la
configuración precargada del negocio
(nombre, teléfono, ubicación, horario, feriados, logo, colores), sin panel de administración.
*Límite:* Reservas y Calendario solo leen de aquí.

**3. Calendario y disponibilidad** — Calcula qué horarios están libres aplicando el horario del
negocio (L-V 9am-6pm con almuerzo bloqueado 12pm-1pm, sábados 9am-1pm), los feriados de Costa
Rica, y los horarios ya reservados. Solo muestra slots a partir del día siguiente. *Límite:*
consulta a Reservas qué está ocupado; no crea ni cancela citas.

**4. Reservas** — Crea, cancela y reagenda citas aplicando las reglas de negocio de
`PROYECTO.md`: no doble reserva, no mismo día, no cancelar/reagendar con menos de 4 horas de
anticipación. Permite que Personal cree una cita en nombre de un cliente que llamó — mismas
reglas, sin excepción. **Personal sí puede cancelar y reagendar dentro de las 4 horas** (RN-6 de
`ESPECIFICACION.md`): es lo que hace útil el mensaje "llame al negocio" que recibe el cliente, y
deja esa cancelación registrada en vez de fuera del sistema. Avisa a Notificaciones cuando algo
cambia. Cierra cada cita pasada cuando Personal la marca **completada** o **no asistió** (RN-17,
RN-19); ningún estado se alcanza solo por el paso del tiempo. *Límite:* es el único componente que
modifica el estado de una cita.

**5. Notificaciones** — Manda los correos (confirmación, recordatorio de 24h, recuperación de
contraseña) hablando con Resend; revisa recordatorios pendientes cuando GitHub Actions le avisa.
*Límite:* solo lee de Reservas, Catálogo y Autenticación; no decide reglas de negocio.

**6. Interfaz (frontend)** — Login, catálogo, calendario, reserva, cancelación/reagendamiento
para el cliente; vista equivalente para que Personal reserve en nombre de quien llama. Envía
cada acción al backend por el API. *Límite:* no decide ninguna regla de negocio por su cuenta.

## Modelo de datos

**Entidades:**
- **Cliente** — correo, contraseña (cifrada), nombre, si tiene una **contraseña temporal
  pendiente de cambiar** (cuenta creada por Personal, RN-11), y **su teléfono y su fecha de
  nacimiento**, los dos opcionales. *(Los dos últimos se agregaron el 2026-08-19 para la sección
  «Usuario», RF-22. **La edad no se guarda**: se calcula a partir de la fecha de nacimiento cada vez
  que se muestra, porque un número guardado queda viejo en el próximo cumpleaños. «Desde cuándo es
  cliente» tampoco se guarda: es la fecha de su primera cita, y las citas ya están.)*
- **Personal** — correo, contraseña (cifrada), nombre. Precargada, sin autorregistro.
- **Categoría** — nombre. Agrupa servicios («Masaje», «Facial»). No se reserva una categoría: se
  reserva un servicio de adentro. *(Agregada el 2026-08-19 con la pieza 11.)*
- **Servicio** — nombre, duración (fija en 1 hora para este prototipo), y **la categoría a la que
  pertenece**.
- **Proveedor** — nombre; puede atender uno o más servicios.
- **Configuración del negocio** — nombre, teléfono, ubicación, horario semanal, feriados de Costa
  Rica, logo, colores. *(El nombre y el teléfono se agregaron al construir la pieza 2; la razón
  está en REG-4 de `ESPECIFICACION.md`.)*
- **Cita** — cliente, servicio, proveedor, fecha y hora de inicio, estado (activa, cancelada,
  completada o **no asistió**), fecha de creación, **canal** (en línea o asistida), qué cuenta de
  Personal la creó si fue asistida, si fue cancelada: **cuándo se canceló y quién la canceló** (el
  cliente o Personal), para poder distinguir las cancelaciones normales de las que Personal hizo
  dentro de las 4 horas; y si fue completada o no asistió: **qué cuenta de Personal la marcó y
  cuándo** (RN-17, RN-19).
- **Correo enviado** — cliente destinatario, cita relacionada (no aplica a recuperación de
  contraseña), tipo, fecha de envío, si tuvo éxito. *(Existe desde la pieza 4, como tabla
  `correo_enviado`. Guarda **también los envíos que fallaron**: un registro que solo anotara los
  exitosos no serviría para lo único que hace falta preguntarle, que es a quién no le llegó su
  aviso.)*
- **Token de recuperación** — cliente o Personal, código, fecha de vencimiento, si ya se usó.

**Relaciones:**
```
Categoría 1 ──> N Servicio
Cliente 1 ──> N Cita          Servicio 1 ──> N Cita         Proveedor 1 ──> N Cita
Servicio N <──> N Proveedor          Personal 1 ──> N Cita (canal "asistida")
Cliente 1 ──> N Correo enviado     Cita 1 ──> N Correo enviado (opcional)
Cliente 1 ──> N Token de recuperación
```

El campo **canal** es el mismo dato que necesita el reporte semestral de `NEGOCIO.md` (en línea
vs. teléfono) — solo hace falta agrupar por este campo, sin cálculo adicional.

Un horario está disponible si cae dentro del horario del negocio, no es feriado, y no hay
ninguna Cita activa para ese proveedor en ese horario.

## Manejo de errores

- **Dos clientes eligen el mismo horario a la vez:** se avisa a quien pierde la carrera y se
  muestra el calendario actualizado.
- **Reservar el mismo día:** rechazado; se pide llamar al negocio.
- **Cancelar/reagendar con menos de 4 horas:** rechazado para el cliente; se pide llamar al
  negocio. Personal, atendiendo esa llamada, sí puede hacerlo desde la aplicación.
- **Sin horarios libres en los próximos 7 días:** aviso para revisar más adelante.
- **Falla el envío de un correo:** se reintenta; si sigue fallando, queda registrado como
  fallido — la cita sigue siendo válida.
- **Falla la tarea de GitHub Actions:** el recordatorio de ese ciclo no se manda. Riesgo
  aceptado y señalado desde la ficha de aprobación.
- **Login incorrecto:** mensaje genérico ("correo o contraseña incorrectos"), sin aclarar cuál
  de los dos falló — para no facilitar que alguien descubra qué correos están registrados.
- **Contraseña olvidada:** recuperación por correo, con enlace de un solo uso que vence en 1
  hora.

## Decisiones mayores

### Mecanismo de autenticación del cliente

| | Opción A: Contraseña | Opción B: Enlace mágico |
|---|---|---|
| **Experiencia de uso** | Rápido una vez que la recuerda; necesita recuperación si la olvida | No hay que recordar nada, pero cada login exige revisar el correo |
| **Recursos** | Ninguno adicional | Reutiliza el envío de correos que ya hace falta |
| **Complejidad** | Manejo seguro de contraseñas y recuperación | Menor — no hay contraseñas que gestionar |
| **Riesgo** | Si no se cifra bien, riesgo de seguridad (mitigado con librerías estándar) | Si alguien accede al correo del cliente, puede entrar en su lugar |

**Elección:** Opción A. Decisión de la estudiante, con recuperación de contraseña por correo
incluida.

---

### Stack tecnológico

| | Opción A: JavaScript en todo el proyecto | Opción B: Python (backend) + HTML/JS simple |
|---|---|---|
| **Experiencia de uso** | Sin cambio para el cliente final | Sin cambio para el cliente final |
| **Recursos** | Ecosistema más usado para apps web | Ninguno adicional |
| **Complejidad** | Un solo lenguaje en todo el proyecto | Dos lenguajes, cada uno en su parte |
| **Riesgo** | Sintaxis algo menos legible para quien no programa | Python es más legible para alguien sin experiencia previa |

**Elección:** Opción A, con un matiz: la estudiante ya conoce HTML/CSS (con SASS) y algo de
JavaScript, así que el criterio real fue "qué puede ella seguir mejor", no legibilidad en
abstracto. Backend en Node.js + Express; frontend en HTML + CSS con SASS.

---

### Motor de base de datos

| | Opción A: SQLite | Opción B: PostgreSQL (servidor aparte) |
|---|---|---|
| **Recursos** | Ninguno — un solo archivo dentro del proyecto | Necesita un servidor de base de datos aparte |
| **Complejidad** | Mínima | Más piezas que instalar y mantener |
| **Riesgo** | Ninguno relevante a este volumen (44 citas/semana, un negocio) | Complejidad de sobra sin beneficio a este tamaño |

**Elección:** Opción A. Se revisaron los escenarios donde dejaría de alcanzar (alta
concurrencia, varias sucursales con servidores independientes, volumen masivo) y ninguno aplica.

---

### Disparador del recordatorio de 24 horas

| | Opción A: tarea propia dentro de la aplicación | Opción B: GitHub Actions (programado) |
|---|---|---|
| **Recursos** | La aplicación mantiene un proceso corriendo sin parar | Reutiliza la cuenta de GitHub del repositorio |
| **Complejidad** | Construir y vigilar el proceso en segundo plano | Menor — GitHub dispara la tarea |
| **Riesgo** | Si el proceso se cae, nadie se entera al momento | Puntualidad no garantizada al 100%; se apaga si el repo queda inactivo 60 días |

**Elección:** Opción B, para el prototipo del curso (es la pieza de mayor riesgo técnico
señalada en la ficha de aprobación). Ver Decisiones dejadas abiertas para la migración a
producción real.

## Otras decisiones

| Decisión | Opciones consideradas | Elección | Razón |
|---|---|---|---|
| Framework de backend | Express, Fastify, sin framework | Express | Estándar para Node.js, elección obvia a este tamaño. |
| Acceso a SQLite | `better-sqlite3`, un ORM | `better-sqlite3` | Más directo para un modelo de datos chico. |
| Servicio de correo | Resend, SendGrid | Resend | Más simple de configurar a este tamaño. |
| Vencimiento del enlace de recuperación | 15 min, 1 hora, 24 horas | 1 hora | Tiempo suficiente sin dejarlo abierto de más. |
| Duración de la sesión de login | Hasta cerrar el navegador, 7 días, 30 días | 7 días | Evita reiniciar sesión seguido, sin dejarla abierta indefinidamente. |

## Decisiones tomadas al construir la pieza 1

Estas cinco no estaban decididas cuando se escribió el diseño: aparecieron al arrancar el proyecto
y quedan acá, con su razón, porque afectan a todas las piezas siguientes.

| Decisión | Opciones consideradas | Elección | Razón |
|---|---|---|---|
| Cómo se cifra la contraseña | `scrypt` del módulo `crypto` que Node ya trae, `bcrypt` como dependencia aparte | `scrypt` de Node | No agrega ninguna dependencia y, sobre todo, no hay que compilar nada en la máquina de quien clone el repositorio — que es la condición que el `README.md` promete. Cada contraseña se guarda como `sal:huella`, con una sal distinta por cuenta, y se compara en tiempo constante. |
| Cómo se sostiene la sesión de 7 días | Cookie firmada por el servidor, sesión guardada en la memoria del servidor, sesión guardada en la base | Cookie firmada con `SESION_SECRETO` | La memoria del servidor se pierde al reiniciar, y la comprobación 6 de la pieza 1 apaga y vuelve a levantar la aplicación. La cookie firmada sobrevive el reinicio y no obliga a montar un almacén de sesiones. La firma es lo que impide que alguien se fabrique una cookie a mano. |
| Con qué corren las pruebas | `node --test`, que Node ya trae, Jest, Vitest | `node --test` | Misma razón que el cifrado: cero dependencias que instalar o configurar. Obliga a que los archivos de prueba se llamen `algo.test.js`, que es un requisito de la herramienta y no una elección de estilo. |
| Cuándo se compilan los estilos SASS | Un comando aparte que haya que recordar, un paso automático dentro de `npm start` | Paso automático dentro de `npm start` | Mantiene el contrato de arranque del `README.md` en cuatro comandos. Quien clona el repositorio no tiene que saber que SASS existe. |
| Cómo se lee el archivo `.env` | La dependencia `dotenv`, la bandera `--env-file` de Node | `dotenv` | La bandera pide Node 22.9 o superior, y el `README.md` promete que el proyecto corre desde Node 20. Cambiar el README sería cambiar una promesa del curso para acomodar una comodidad del código. |
| Qué pasa si falta `SESION_SECRETO` | Negarse a arrancar, arrancar con una firma inventada al momento | Arrancar con una firma inventada al momento, avisando en la consola | La comprobación de referencia del curso es clonar el repositorio y correr tres comandos. Si la aplicación se negara a arrancar sin `.env`, esa comprobación fallaría por una clave que no protege nada en un prototipo local. El costo es que las sesiones abiertas se cierran en cada reinicio, y el aviso en la consola lo dice. |

## Decisiones tomadas al construir la pieza 2

Ninguna de estas estaba decidida cuando se escribió el diseño. Aparecieron al construir el
calendario y quedan acá, con su razón, porque las piezas 3 a 8 se apoyan en todas ellas.

| Decisión | Opciones consideradas | Elección | Razón |
|---|---|---|---|
| Con qué reloj se decide qué día es «hoy» | La hora de la máquina donde corre el servidor, una zona horaria fija escrita en el código | **Zona horaria fija: Costa Rica, UTC−6** | Si el sistema usara la hora de la máquina, el mismo calendario mostraría días distintos según dónde se levante la aplicación, y la regla «no hay citas para hoy» (RN-4) se rompería para quien lo corra desde otra zona. El negocio es uno solo y está en Costa Rica, así que la hora del negocio es la única correcta. Costa Rica **no cambia de hora en verano**, así que el desfase es siempre −6 y alcanza con escribirlo: no hace falta ninguna librería de zonas horarias, que además sería una dependencia más de las que el `README.md` promete no tener. |
| Cómo se guarda la configuración del negocio | Una sola tabla `configuracion_negocio` con el horario y los feriados adentro, tres tablas separadas | **Tres tablas: `configuracion_negocio`, `horario_negocio` y `feriado`** | El horario semanal son varias filas (una por tramo de cada día) y los feriados son muchas filas más: meterlos adentro de una sola fila obligaría a guardarlos como un texto apelmazado que nadie puede mirar ni corregir con un visor de SQLite. La comprobación 12 de la pieza 2 pide justamente «cargar un horario de negocio vacío o marcar los próximos 7 días como feriados» a mano, y con tres tablas eso es una línea de SQL. `PLAN.md` nombraba una sola tabla; se corrigió su bloque *Produce* con esta razón. |
| Cómo se escribe el horario del negocio | Un campo «hora de apertura», otro de «cierre» y un tercero de «almuerzo», tramos de atención | **Tramos:** cada día tiene uno o más tramos `(hora_inicio, hora_fin)` | Entre semana el negocio atiende 9–12 y 13–18: dos tramos, y **el almuerzo es el hueco entre ellos**, no un concepto aparte que haya que recordar restar. El sábado es un solo tramo, 9–13. El domingo no tiene ninguno, y por eso está cerrado sin ninguna regla especial que lo diga. Un tratamiento distinto para el almuerzo habría sido un lugar más donde equivocarse, que es exactamente el riesgo que `PROYECTO.md` §7.6 pide vigilar. |
| Qué feriados se cargan | Las fechas de ley en su día original, las fechas con el traslado a lunes que permite la ley costarricense | **Las fechas de ley en su día original, para 2026 y 2027**, decidido por la estudiante el 2026-08-18 | La comprobación 9 de la pieza 2 dice literalmente «mirar el 15 de setiembre»: si el feriado se corriera al lunes, ese día quedaría libre y la comprobación dejaría de comprobar lo que dice. Se cargan dos años porque **Jueves y Viernes Santo cambian de fecha cada año** y hay que saberlas de antemano: son las únicas que no se repiten. La lista completa, y los dos feriados que quedaron afuera con su razón, están en `guiones/datos-de-prueba.js`. |
| Cuándo existe la tabla `cita` | Que la cree la pieza 3, que la cree la pieza 2 vacía | **La crea la pieza 2, y no guarda ninguna cita** | La comprobación 11 de la pieza 2 exige insertar a mano una cita activa y ver que su horario deja de aparecer libre: sin la tabla, esa comprobación no se puede correr. Las columnas **no se inventaron**: se copiaron del bloque *Produce* de la pieza 3, que es donde el plan las fija. La pieza 2 solo lee de esa tabla; crear citas sigue siendo trabajo de la pieza 3. |
| Cómo se guarda la fecha y hora de una cita | Un número de milisegundos, la fecha en hora universal, la fecha con el desfase de Costa Rica escrito | **La fecha con el desfase escrito:** `2026-08-19T10:00:00-06:00` | Es el mismo texto exacto que el API devuelve y que el navegador manda de vuelta, así que **hay un solo formato en todo el proyecto** y ninguna conversión donde equivocarse. Además se lee solo: quien abra la base con un visor ve la hora del negocio, no un número. Y como todas las fechas se escriben igual, ordenarlas y compararlas es comparar texto. |
| Si el logo y los colores del negocio se aplican a la pantalla | Aplicarlos, guardarlos sin aplicarlos | **Guardarlos sin aplicarlos** | Ya estaba resuelto en `CLAUDE.md`: `VISUALS.md` es la apariencia de la **aplicación**, y el logo y los colores del negocio son la marca de **quien la usa**. Aplicarlos ahora pisaría el sistema visual que la estudiante aprobó. Se guardan porque REG-4 pide registrarlos, y el día que exista más de un negocio ya van a estar. |
| Si el catálogo y el calendario se pueden ver sin haber entrado | Abiertos a cualquiera, solo con sesión abierta | **Solo con sesión abierta** | No existe la reserva como invitado (RN-9), así que un calendario que se pudiera mirar sin cuenta no llevaría a ninguna parte. Además el bloque *Consume* de la pieza 2 en `PLAN.md` dice que consume la sesión de la pieza 1. La única excepción es la configuración del negocio —nombre, teléfono y ubicación—, que se lee sin sesión porque el pie de página la muestra también en la pantalla de entrar. |
| Cómo se ve el calendario | Cuadrícula del mes y los horarios al tocar un día, lista de todos los días con sus horarios a la vista | **Cuadrícula del mes; al tocar un día se abren sus horarios** | Decidido por la estudiante el 2026-08-18. Un mes entero son unas 200 fichas de horario: mostrarlas todas de una obliga a desplazarse muchísimo para llegar a fin de mes. La cuadrícula deja ver el mes completo de un vistazo —qué días tienen algo libre, cuáles son feriado, cuáles están cerrados— y entra en la pantalla de un teléfono. Las fichas de horario son las «Appointment Chips» que `VISUALS.md` describe. |

## Decisiones tomadas al construir la pieza 3

Ninguna de estas estaba decidida cuando se escribió el diseño. Aparecieron al construir la reserva
y quedan acá, con su razón. Las cuatro primeras las decidió la estudiante el 2026-08-19, al arrancar
la pieza; las demás salieron de huecos que el plan no cubría.

| Decisión | Opciones consideradas | Elección | Razón |
|---|---|---|---|
| Cómo se ve el momento de confirmar la reserva | Una ventana emergente encima de la página con el fondo oscurecido, una tarjeta abajo en la misma página | **Una tarjeta abajo, en la misma página**, decidido por la estudiante el 2026-08-19 | `VISUALS.md` menciona las ventanas emergentes con fondo atenuado «para tareas críticas de reserva», así que las dos opciones estaban permitidas por el sistema visual. Se eligió la tarjeta porque el calendario sigue a la vista mientras se confirma —si el resumen no es el que se quería, se toca otro horario sin cerrar nada— y porque una ventana emergente en teléfono obliga a resolver el foco del teclado y el cierre con la tecla de escape, que es trabajo que no compra nada acá. |
| Cómo conviven «Reservar» y «Mis citas» | Las dos secciones apiladas en la misma página, dos vistas que se alternan | **Dos vistas que se alternan**, decidido por la estudiante el 2026-08-19 | Es lo que convierte el menú en un menú de verdad: si las dos secciones estuvieran siempre a la vista, el menú sería un atajo para desplazarse y no una navegación. Y en teléfono, apilarlas dejaría una página larguísima donde habría que pasar el recorrido completo de reservar para llegar a las citas propias. |
| Dónde va el botón «hamburguesa» | En el pie de página junto al menú, en la barra azul del encabezado, no construirlo y dejar los enlaces siempre visibles | **En la barra azul del encabezado**, decidido por la estudiante el 2026-08-19 | Este documento ya tenía escrito que el menú va en el pie, pero no decía dónde va la hamburguesa, y las tres rayitas en el pie de la página son un lugar donde nadie las busca. Los enlaces quedan **en los dos lados**: como fila en el pie, arriba del texto de derechos, tal como estaba decidido; y detrás de la hamburguesa arriba, que es donde se toca. Desde tableta la hamburguesa desaparece y los enlaces de arriba se muestran como fila. *(El menú terminó con tres ítems y no dos: «Salir» se sumó ese mismo día — ver la fila de abajo.)* |
| Dónde vive la configuración de integración continua | Dentro de `proyectoFinal/`, en la raíz del repositorio | **En la raíz del repositorio**, `.github/workflows/pruebas.yml`, autorizado por la estudiante el 2026-08-19 | No es una elección de gusto: **GitHub solo ejecuta los archivos que están en `.github/workflows/` en la raíz del repositorio.** Adentro de una subcarpeta los ignora, así que la comprobación 7 de la pieza 3 no se podría cerrar de ninguna otra forma. Es la única excepción a la regla «todo el trabajo queda adentro de la carpeta del día» del `CLAUDE.md` de la carpeta madre, y se pidió permiso antes de crearlo. El archivo entra a `proyectoFinal` y corre `npm test` ahí. |
| Cómo se garantiza que dos reservas del mismo horario no pasen las dos (CA-1) | Comprobar en el código que el horario esté libre antes de insertar, poner la regla dentro de la base con un índice único, las dos cosas | **Las dos: índice único en la base, más la comprobación previa dentro de una transacción** | Comprobar en el código y después insertar son **dos movimientos**, y entre uno y otro cabe la reserva de otra persona: eso es exactamente la carrera de CA-1. La garantía de verdad la da la base con un **índice único parcial** — `(proveedor_id, inicio)` solo `WHERE estado = 'activa'` —, que hace que la segunda inserción sea imposible, no improbable. Es **parcial** a propósito: si fuera un índice único normal, una cita cancelada seguiría bloqueando su horario para siempre y RN-7 («cancelar libera el horario de inmediato») no se podría cumplir. La comprobación previa se conserva porque es la que sabe **por qué** se rechaza —feriado, domingo, hoy— y puede contestar el mensaje correcto; el índice solo sabe decir «no». |
| Qué se responde cuando el horario no se puede tomar por un motivo distinto de «ya lo tomaron» | Inventar un código de error por cada motivo (feriado, cerrado, almuerzo), usar el mismo `409 horario_no_disponible` para todos | **El mismo `409 horario_no_disponible`** | El bloque *Produce* del plan define dos rechazos y nada más: `409 horario_no_disponible` y `422 mismo_dia`. Un horario de un feriado, de un domingo, de la hora del almuerzo o de las 3 de la mañana **no está disponible**, así que el nombre del error ya es exacto y no hace falta un tercer código. Y ninguna pantalla del sistema ofrece esos horarios: quien los pida está saltándose el calendario. La única distinción que sí importa es la de RN-4, porque el mensaje que recibe el cliente es distinto — le dice a qué número llamar. |
| Si la cuenta de Personal puede reservar por estos endpoints | Sí, tratándola como un cliente más; no, con un rechazo explícito | **No: `403 solo_clientes`** | Un hueco que el plan no cubría: la pieza 1 creó dos tipos de cuenta y las dos tienen sesión, así que `POST /api/citas` con la sesión de Personal tenía que decidir algo. Sin el rechazo, la cita quedaría guardada con `cliente_id` igual al **id de Personal**, que es el id de otra persona en la tabla `cliente` — una cita de alguien que nunca la pidió. La reserva asistida por teléfono es la pieza 7 y tiene su propio recorrido: ahí Personal elige **de qué cliente** es la cita, y queda con canal `"asistida"` y su nombre (RN-12). |
| Qué devuelve `GET /api/citas` | Solo las activas, todas con su estado | **Todas, ordenadas por fecha de inicio, cada una con su `estado`** | El contrato del plan incluye el campo `estado`: si el endpoint devolviera solo las activas, ese campo diría siempre lo mismo y no serviría de nada. Filtrar en el servidor tampoco les serviría a las piezas siguientes — la pieza 5 necesita mostrar que una cita quedó cancelada, y la 8 que quedó completada. En esta pieza la diferencia no se nota: el único estado que existe es `"activa"`, porque nada las cancela ni las cierra todavía. |
| Dónde vive la regla de crear una cita | Adentro del archivo de rutas, en un archivo aparte del servidor | **En un archivo aparte: `servidor/reservas.js`** | Es el componente **Reservas** de este mismo documento, y su límite dice que es el único que modifica el estado de una cita: las piezas 5, 7 y 8 van a escribir cancelar, reagendar y cerrar **ahí**. El archivo de rutas se queda con lo suyo, que es traducir: leer el pedido, llamar a la regla, y convertir su respuesta en un número de HTTP. Y la pregunta «¿este horario se puede tomar?» **no se vuelve a escribir**: se le hace a `servidor/disponibilidad.js`, que la contesta con el mismo cálculo que dibuja el calendario. Si algún día cambia el horario del negocio, cambia en un solo lugar y las dos cosas lo obedecen. |
| Dónde vive el botón de salir, y cómo se llama | Un botón «Cerrar sesión» al lado del saludo, un ítem «Salir» adentro del menú | **Un ítem «Salir» adentro del menú**, decidido por la estudiante el 2026-08-19 en la revisión visual | El botón al lado del saludo era lo que había desde la pieza 1, cuando no existía ningún menú: era el único lugar posible. Ahora que hay menú, salir es una opción de navegación como las otras dos, y el saludo vuelve a ser solo el saludo. Se llama **«Salir»** y no «Cerrar sesión» porque en un menú los ítems son cortos, y «Salir» dice lo mismo con una palabra. Está escrito en los dos menús pero **se ve en uno solo a la vez**: en teléfono adentro de la hamburguesa, y desde tableta abajo en el pie. Así nunca hay dos «Salir» en la misma pantalla. |
| De qué color es un horario que ya está tomado | Gris apagado con la hora tachada, azul marino con letra blanca | **Azul marino con letra blanca**, y la hora sigue tachada. Decidido por la estudiante el 2026-08-19 en la revisión visual | El gris sobre gris no se alcanzaba a leer: **un dato que no se puede leer no informa nada**, y la hora de un horario tomado sí hay que poder leerla. Es el mismo par de colores del botón «Confirmar la reserva» —`primary` con `on-primary` de `VISUALS.md`—, así que no se inventó ningún color. `VISUALS.md` describe las «Appointment Chips» libres y elegidas, pero **nunca dijo cómo se ve una tomada**, así que acá no se contradice nada: se llena un hueco. **El tachado se conserva**, y no es decoración: es lo que dice «este no se puede tomar» sin depender del color, que es lo que necesita RF-6 y quien no distingue bien los tonos. |
| Con qué color se avisa que la reserva salió bien | Un verde de éxito, el aviso informativo índigo que ya existe | **El aviso informativo índigo** | `VISUALS.md` nombra un «verde de éxito» en su sección de indicadores de estado, pero **no dice cuál es**: no hay ningún verde en su lista de colores. Inventarlo estaría prohibido por la regla «si un valor no está ahí, no se inventa». El aviso índigo ya existe desde la pieza 2 para las noticias que no son errores, y esta es una. |

## Decisiones tomadas al construir la pieza 10

*La pieza 10 se construyó **fuera de orden**, el 2026-08-19, a pedido de la estudiante, justo después
de la pieza 3. No depende de ninguna pieza sin construir: la cuenta la creó la pieza 1 y las citas
—que son de donde sale «desde cuándo es cliente»— las creó la pieza 3.*

| Decisión | Opciones consideradas | Elección | Razón |
|---|---|---|---|
| Dónde se cargan el teléfono y la fecha de nacimiento | Pedirlos al crear la cuenta, completarlos y corregirlos en la sección «Usuario», las dos cosas | **Completarlos y corregirlos en «Usuario»**, decidido por la estudiante el 2026-08-19 | Pedirlos en el registro obligaría a cambiar RF-1 y el contrato de la pieza 1, que ya está cerrada con sus 14 pruebas, y alargaría el registro justo cuando la persona quiere reservar. Y de todos modos hay que poder **corregir** un teléfono mal escrito, así que la pantalla de edición tenía que existir igual. Los dos campos quedan **opcionales**: una cuenta vive sin ellos. |
| Si se guarda la edad o la fecha de nacimiento | La edad como número, la fecha de nacimiento | **La fecha de nacimiento; la edad se calcula**, decidido por la estudiante el 2026-08-19 | Una edad guardada como número **queda vieja en el próximo cumpleaños** y nadie la va a ir a corregir: el sistema estaría mostrando un dato falso sin saberlo. Guardando la fecha, la edad sale siempre correcta. Se calcula con la hora del negocio, como todo lo demás (`servidor/tiempo.js`), no con la de la máquina. |
| Si el cliente puede cambiar su correo | Sí, con las comprobaciones que haga falta; no | **No** (RN-21) | El correo es con lo que entra al sistema. Cambiarlo arrastra dos cosas que esta entrega no resuelve: comprobar que el correo nuevo no sea de otra cuenta, y **confirmar que la persona de verdad tiene acceso a ese correo** antes de que su forma de entrar dependa de él. Sin lo segundo, un dedazo dejaría a alguien afuera de su propia cuenta. Quien necesite cambiarlo llama al negocio, que es el mismo camino de RN-4 y RN-5. |
| De dónde sale «desde cuándo es cliente» | Una columna nueva con la fecha en que se creó la cuenta, la fecha de su primera cita | **La fecha de su primera cita** | Es lo que la estudiante pidió: «cuándo empezó los servicios». Y **ya está guardado**, así que no hace falta ninguna columna nueva ni ningún dato que llenar hacia atrás. Además dice algo más útil: la fecha en que se creó la cuenta solo cuenta cuándo se registró, que puede ser meses antes de su primera cita. Si todavía no tuvo ninguna, el API devuelve `null` y la pantalla lo dice con palabras. |
| Qué se acepta como teléfono | Cualquier texto, exactamente 8 dígitos | **Exactamente 8 dígitos**, con o sin guión, y se guarda normalizado como `2000-0000` | El negocio es uno solo y está en Costa Rica (`ESPECIFICACION.md`, «Fuera de alcance»), y los teléfonos de Costa Rica son de 8 dígitos. Aceptar cualquier texto dejaría entrar «llamame al celu», que no sirve para llamar a nadie. Se normaliza al guardar para que la pantalla no tenga que adivinar cómo escribirlo, igual que el teléfono del negocio en los datos de prueba. |
| Dónde vive la validación de estos datos | En la pantalla, en el servidor, en los dos | **En el servidor** | Es la regla de `CLAUDE.md`: el frontend no decide reglas de negocio. La pantalla manda lo que la persona escribió y muestra el error que el servidor conteste. Así la regla es una sola, y no dos que se pueden desincronizar. |

## Decisiones tomadas al construir la pieza 11

*La pieza 11 también se construyó **fuera de orden**, el 2026-08-19, a pedido de la estudiante. Toca
el catálogo, que era de la pieza 2 —ya cerrada—, así que lo primero que se corrigió fue RF-5 de
`ESPECIFICACION.md`, y después el código.*

| Decisión | Opciones consideradas | Elección | Razón |
|---|---|---|---|
| Cómo se guarda la categoría de un servicio | Un campo de texto «categoría» en cada servicio, una tabla `categoria` aparte, un servicio marcado como «padre» de otros | **Una tabla `categoria` aparte**, decidido por la estudiante el 2026-08-19 | Con un campo de texto, el nombre de la categoría se repite en cada fila y **un dedazo crea una categoría fantasma** —«Masajes» en vez de «Masaje»— con un servicio adentro y sin que nadie se dé cuenta. Con un servicio «padre», la tabla de servicios pasa a tener filas **que no se pueden reservar**, y cada consulta del sistema tiene que acordarse de excluirlas: un lugar más donde equivocarse. Con una tabla aparte, el nombre está escrito una sola vez y **la cita sigue apuntando al servicio concreto**, así que ni la pieza 3 ni el cálculo de disponibilidad cambian una línea. |
| Si un servicio puede no tener categoría | Sí, opcional; no, obligatoria | **Obligatoria** (`categoria_id NOT NULL`) | Un servicio sin categoría no aparecería en ninguna parte de la pantalla nueva: existiría en la base y sería invisible, que es peor que no existir. Obligarla hace imposible ese estado. El costo fue chico: la única prueba que creaba un servicio a mano ahora crea también su categoría. |
| En qué momento el cliente elige el servicio dentro de la categoría | Un paso nuevo siempre, un paso nuevo solo si hay más de un servicio, todo junto en el paso 1 agrupado por categoría | **Un paso nuevo, y solo si la categoría tiene más de un servicio** (RN-22), decidido por la estudiante el 2026-08-19 | Un paso que ofrece una sola opción no es una elección: es un toque de más. Y agrupar todo en el paso 1 deja una lista larga en teléfono apenas el negocio agregue tres o cuatro tipos de masaje. **Nótese que es lo contrario de lo que hace RN-8 con los proveedores**, donde el paso se muestra aunque haya uno solo: ahí saber **quién** te atiende es información que el cliente quiere igual. La diferencia quedó escrita en RN-22 para que no parezca una inconsistencia. |
| Quién decide si el paso del servicio se muestra | La pantalla, contando cuántos servicios llegaron; el servidor, diciéndolo | **El servidor**, con un campo `pideElegirTipo` en cada categoría | Es la convención del proyecto: el frontend no decide reglas de negocio, y no recibe solo el *qué* sino también el *por qué* — igual que un día del calendario llega con su campo `estado` en vez de dejar que la pantalla deduzca de una lista vacía. Si mañana RN-22 cambia, cambia en el servidor y la pantalla obedece sin tocarse. |
| Si los servicios de una categoría pueden durar distinto | Sí, cada uno con su duración; no, todos una hora | **Todos una hora**, decidido por la estudiante el 2026-08-19 | Es lo que ya decía `ESPECIFICACION.md` —«todas las citas duran una hora»— y «duraciones variables por servicio» está declarado **fuera de alcance**. No es una limitación menor: el cálculo de disponibilidad, los horarios en punto, el candado que impide la doble reserva y las 44 horas por semana **todos asumen una hora**. Cambiarlo sería una pieza grande y riesgosa por sí sola, no un agregado a esta. |
| Si `GET /api/servicios` sigue existiendo | Quitarlo, dejarlo | **Dejarlo**, y agregarle el nombre de la categoría a cada servicio | Es parte del contrato que fijó el bloque *Produce* de la pieza 2, ya cerrada, y hay pruebas que lo usan. Quitarlo sería romper hacia atrás para nada. La pantalla ya no lo usa: usa `GET /api/categorias`, que trae el árbol completo en un solo pedido. Los dos leen del **mismo** lugar en `servidor/catalogo.js`, así que no hay dos consultas que se puedan desincronizar. |

## Decisiones tomadas al construir la pieza 4

*Construida el 2026-08-19. Es la primera pieza que habla con un servicio de **afuera**, y casi todas
estas decisiones salen de ahí: qué se hace cuando algo que no controlamos no contesta.*

| Decisión | Opciones consideradas | Elección | Razón |
|---|---|---|---|
| Cómo se le habla a Resend | Instalar su paquete oficial de npm (`resend`), mandarle el pedido con `fetch` | **Con `fetch`, la función que Node 20 ya trae**, decidido por la estudiante el 2026-08-19 | Mandar un correo por Resend es **un solo pedido** a una dirección, con la clave en una cabecera. El paquete oficial envuelve eso y poco más, así que se ahorra entero: son unas 20 líneas en `servidor/enviador-resend.js` a cambio de **una dependencia menos**, que es justo lo que el `README.md` promete («nada de dependencias que haya que compilar o configurar»). El `README.md` seguía apuntando a `resend-node` como repositorio oficial y se corrigió con esta decisión. |
| Cómo se prueba el correo sin mandar correos | Mandarlos de verdad a una casilla de prueba, imitar la librería, **pasar el enviador como dato** | **Pasarlo como dato**, igual que el reloj | Es el mismo problema que las fechas y se resuelve igual: lo que no se puede probar de verdad entra por la puerta en vez de estar clavado adentro. La aplicación recibe una función `enviador` y la llama; en `npm start` es la que habla con Resend, en las pruebas es una que guarda los correos en una lista. Mandarlos de verdad haría que `npm test` le escribiera a alguien —y que la integración continua necesitara una clave secreta en GitHub—; imitar la librería probaría la imitación. Así queda probado de verdad todo lo que está de **este** lado del borde: la plantilla, el registro y el reintento. |
| Si la pantalla espera a que el correo salga | Contestar «reservada» de una y mandar el correo por detrás; esperar al envío | **Esperar**, decidido por la estudiante el 2026-08-19 | La cita **ya está guardada** cuando el envío empieza, así que RF-19 se cumple con las dos. Lo que cambia es si el resultado del envío se puede comprobar: contestando primero, toda prueba del correo tendría que esperar «un rato» a que la fila apareciera, y una prueba así falla sola cada tanto sin que nada esté mal. El costo es un segundo más de espera en el botón, acotado por el límite de abajo. |
| Cuántas veces se reintenta | Una, dos, tres, con espera creciente | **Dos intentos en total**, con un segundo de pausa | `ESPECIFICACION.md` dice «el sistema reintenta» sin decir cuántas veces, así que el número se adopta acá con su razón: quien reservó está mirando la pantalla, y cada intento extra es tiempo que espera. Reintentar en el mismo instante casi no sirve —si la red se cayó hace un microsegundo, sigue caída—, y un segundo alcanza para un tropiezo momentáneo. |
| Qué fallas se reintentan | Todas; solo las que pueden ser pasajeras | **Solo las pasajeras** | Del 500 para arriba el problema es de Resend y el mismo correo mandado de nuevo puede salir perfecto. Del 400 al 499 el problema es **el pedido** —la clave no sirve, el remitente no está verificado— y repetirlo daría exactamente lo mismo: solo haría esperar más a quien reservó. El error lleva encima un campo `pasajera` para que la decisión esté escrita donde se sabe la respuesta, y no se adivine después. |
| Cuánto se espera a Resend | Sin límite, 5 s, 30 s | **5 segundos por intento** | Sin límite, un servicio que no contesta deja el botón «Confirmar la reserva» girando hasta que Node se canse. Resend normalmente contesta en menos de un segundo; cinco es de sobra para él y poco para quien mira la pantalla. |
| Qué pasa si `RESEND_API_KEY` no está | La aplicación no arranca; arranca y avisa | **Arranca y avisa** (RF-19) | Está en las restricciones del proyecto desde antes de construir. La forma de cumplirlo es que el camino «sin clave» sea **exactamente el mismo** que el del correo que falla: el enviador se arma igual y falla en cada envío, así que queda cubierto por las mismas pruebas en vez de ser un caso aparte que nadie prueba. |
| Si el correo lleva diseño | Solo texto plano; HTML con los colores del sistema | **Las dos cosas, en el mismo envío**, decidido por la estudiante el 2026-08-19 | El HTML es lo que casi todo el mundo ve. La versión de texto plano no es un extra: la usan los programas configurados para no mostrar diseño, y **un correo que viaja solo en HTML lo marcan como sospechoso varios servicios**. Las dos dicen exactamente lo mismo, y las pruebas comprueban los cinco datos de RF-11 en las dos. |
| Qué tipografía usa el correo | Manrope, la del sistema visual; la que tenga la máquina de quien lee | **La que tenga la máquina**, pidiendo Manrope primero | Es **la única excepción a `VISUALS.md` en todo el proyecto**, y no es una elección: Manrope vive en `publico/fuentes/`, y los programas de correo **no cargan tipografías de afuera**. Los colores, los tamaños, los redondeos y el espaciado sí salen de `VISUALS.md`. |
| Desde dónde se dispara el correo | Desde el endpoint que reserva; desde `reservas.js` | **Desde `reservas.js`**, en una función `crearCitaYConfirmar` | Es lo que `DISENO.md` ya decía del componente Reservas: «avisa a Notificaciones cuando algo cambia». Si cada endpoint tuviera que acordarse de mandar el correo, el día que se agregue uno nuevo —la pieza 7, cuando Personal reserve en nombre de alguien— va a haber un camino por el que se reserva sin que nadie se entere. Con la función, «al crear una cita se confirma» está escrito **en un solo lugar**. |
| Cómo se registran los dos intentos de un mismo correo | Una fila por intento; una fila por correo | **Una fila por correo** | Dos intentos de entregar la misma confirmación son **un** correo que se trató de mandar. Contarlos como dos haría creer que a esa persona le llegó el aviso dos veces, que es justo lo contrario de lo que pasó. |

| Qué color lleva un aviso de «salió bien» | El lavanda que ya se usaba para las noticias; un verde | **Un verde grisáceo pálido, `#d6e9db`, con el texto negro de siempre**, elegido por la estudiante el 2026-08-19 en su revisión visual | **`VISUALS.md` nombra un «success green» entre los indicadores de estado pero nunca dice cuál es**, así que hasta acá no se usaba ninguno y los avisos de éxito compartían el lavanda de las noticias — o peor: «Tu cita quedó reservada» salía directamente con **los colores de error**, en rojo. Es el cuarto defecto visual del proyecto encontrado por una persona mirando la pantalla, y ninguna prueba automática podía verlo. El borde (`#8fb59c`) es el mismo verde más oscuro, derivado para que la caja tenga contorno, siguiendo la misma forma que el aviso de error: fondo pálido, borde visible, texto oscuro. |

**Un defecto encontrado y arreglado el mismo día:** `npm run datos` iba a quedar roto. La tabla nueva
`correo_enviado` apunta a `cita` y a `cliente`, la base tiene las llaves foráneas encendidas, y el
borrado de los datos de prueba no la incluía: SQLite se habría negado a borrar la cita. Se arregló
agregando `DELETE FROM correo_enviado` primero de todo, y quedó cubierto por una prueba.

## Decisiones tomadas al construir la pieza 5

*Construida el 2026-08-20. Es la pieza que trae **CA-3** y la que completa el prototipo de extremo a
extremo del núcleo comprometido en `FICHA-APROBACION.md`. **No nació ningún archivo nuevo y no se
instaló ninguna dependencia**: todo entró en los archivos que ya existían.*

| Decisión | Opciones consideradas | Elección | Razón |
|---|---|---|---|
| Dónde vive la regla de las 4 horas | En cada endpoint; en un archivo nuevo; en `reservas.js` | **En `reservas.js`, en una función `revisarSiSePuedeCambiar`** | Es una regla sobre **el estado de una cita**, y `DISENO.md` ya decía que Reservas es el único componente que lo toca. Un archivo nuevo solo para ella habría hecho más difícil ver que cancelar y reagendar comparten exactamente la misma regla — que es el punto. La pieza 7 la va a llamar con `QUIEN_PERSONAL` para saltársela (RN-6): esa es la otra mitad de CA-3, y no necesita escribir nada nuevo. |
| Dónde vive la cuenta de «cuántas horas faltan» | Junto a la regla, en `reservas.js`; en `tiempo.js` | **En `tiempo.js`**, como `horasHasta` | La convención del proyecto es que **todo lo que tenga que ver con fechas se escribe en `tiempo.js`**. Es además el único lugar de todo el proyecto donde un momento se convierte con `new Date()`, y ahí es seguro justamente por la regla de formato: el texto trae su desfase escrito (`-06:00`), así que no hay nada que adivinar. |
| Si la ventana se mide en días o en horas exactas | Comparar fechas, como RN-4; medir la distancia con decimales | **La distancia exacta, sin redondear** | Es la primera regla del proyecto que mide una **distancia** entre dos momentos en vez de comparar dos fechas. Redondear a horas enteras dejaría cancelar una cita a la que le faltan 3 horas y 40 minutos. Hay dos pruebas del borde exacto: a 4 horas justas se permite (RF-13 dice «4 horas **o más**»), a 3 h 59 min no. |
| Qué pasa con una cita que **ya pasó** | Un caso aparte con su propio mensaje; que caiga en la misma regla | **Que caiga en la misma regla** | Si faltan −22 horas, faltan menos de 4. No hace falta ningún caso aparte, y no tenerlo es un caso borde menos donde equivocarse. Cerrar las citas pasadas es de la pieza 8, y lo hace Personal. |
| Cómo se libera el horario al cancelar | Borrar la cita; un campo «liberado»; cambiar el estado | **Cambiar el estado, y nada más** | Ya estaba resuelto por la pieza 3 sin saberlo: el índice único de la base es **parcial**, solo vigila las citas `activa`. Dejar de estar activa **es** dejar de ocupar, así que RN-7 se cumple sin una sola línea que libere nada. Y nada se borra (RN-15). |
| Cómo se mueve una cita a otro horario | Cancelar la vieja y crear una nueva; cambiarle el horario a la misma fila | **Cambiarle el horario a la misma fila** | «Liberar el viejo y tomar el nuevo» suena a dos movimientos, y en realidad es **uno**: es la misma cita, y lo que cambia es su columna `inicio`. Eso hace imposible el estado intermedio que daría miedo —la cita sin horario, o con los dos— sin ningún cuidado especial. Cancelar y recrear, además, habría dejado dos filas donde el negocio tiene una sola cita, y habría cambiado el número de cita bajo los pies del cliente. |
| Qué contesta el sistema cuando la cita es de otra persona | `403` («no es tuya»); `404` («no existe») | **`404`, el mismo que para una cita que no existe** | Un `403` le **confirma** a quien pregunta que ese número de cita existe, y con eso se pueden ir contando las citas del negocio de uno en uno. La búsqueda lleva el número del cliente adentro, así que la cita de otra persona simplemente no se encuentra: no hay un segundo `if` que alguien pueda olvidar. |
| Si al reagendar se manda un correo | Ninguno; el de confirmación con la fecha nueva; una plantilla nueva de «tu cita se movió» | **El de confirmación, con la fecha nueva**, decidido por la estudiante el 2026-08-20 | `ESPECIFICACION.md` solo hablaba del correo «al reservar», y eso dejaba al cliente con un correo en la bandeja **anunciando un día que ya no era el suyo**: el aviso más reciente que tenía decía la fecha vieja. RF-11 se corrigió con esta decisión. Se reusa la plantilla de la pieza 4 sin tocarla —el correo se arma leyendo la cita **después** del cambio, así que dice la fecha nueva sola— y una plantilla nueva habría sido trabajo extra en una pieza que ya es de las largas. Cancelar **no** manda ninguno: la especificación no lo pide, y quien canceló acaba de verlo en pantalla. |
| Quién decide si los botones de cancelar y reagendar se ven | La pantalla, contando las horas; el servidor | **El servidor**, en los campos `sePuedeCambiar` y `porQueNo` de cada cita | Es la regla de `CLAUDE.md`: el frontend no decide reglas de negocio, y cuando necesita saber si algo se permite se lo pregunta al API — **y no solo *si*: también *por qué***. Es el mismo camino que ya se usó en la pieza 2 con el campo `estado` de cada día del calendario. Si la pantalla contara las horas con el reloj de la computadora de quien mira, un navegador con la hora mal puesta mostraría un botón que el servidor va a rechazar, o le esconderá uno que sí podía usar. |
| Dónde aparece el calendario para reagendar | Una tarjeta con su propio calendario dentro de «Mis citas»; la pantalla de reservar en «modo reagendar» | **La pantalla de reservar**, con los tres primeros pasos escondidos, decidido por la estudiante el 2026-08-20 | Un segundo calendario sería **un segundo lugar donde el mismo defecto puede aparecer** — y el calendario ya dio dos de los siete defectos visuales del proyecto. Esconder los pasos de categoría, tipo y proveedor es además la forma más directa de cumplir RN-18: lo que no está en pantalla no se puede cambiar. El cartel de arriba dice qué cita se está moviendo, porque sin él la pantalla se vería idéntica a reservar de cero. |
| Si cancelar pregunta antes | Cancelar de una; preguntar en una ventana del navegador; preguntar en la misma fila | **Preguntar en la misma fila**, decidido por la estudiante el 2026-08-20 | Cancelar no se deshace: la cita no se borra (RN-15), pero para recuperar el horario hay que reservarlo otra vez y puede que ya se lo hayan llevado (RN-7). Un toque por equivocación en un teléfono no puede costar una cita. **En la misma fila** y no en una ventana emergente del navegador, porque esa ventana no se puede vestir con `VISUALS.md` y además tapa la cita justo cuando la persona quiere mirarla para estar segura de que es la correcta. |
| Cómo se ve, en modo reagendar, el horario que la cita ya tiene | Igual que cualquier ocupado; con una marca propia | **Con un contorno índigo, y el texto «Es el horario que ya tenés»** | Ese horario **está** ocupado, por su propia cita, así que el calendario lo pinta como tomado. Decirle «no disponible» ahí sería confuso: parecería que otra persona se lo llevó. Se usa `outline` y no `border` a propósito: el borde ya lo ocupa el estado «tomado», y cambiarlo movería la ficha un pixel respecto de sus vecinas. |

| Qué dice una cita que **ya pasó** | La misma frase de la ventana de 4 horas; una frase propia | **Una frase propia: «Esta cita ya pasó. Para modificarla o cancelarla, llamá al negocio al…»**, decidido por la estudiante el 2026-08-20 **en la revisión visual** | Como **regla** está bien que las dos caigan en el mismo lugar: si faltan −2 horas, faltan menos de 4, y no hace falta ningún caso aparte. Pero en **pantalla** eso salía como «Faltan menos de 4 horas para esta cita» debajo de una cita de las 9 de la mañana, **a mediodía** — una frase falsa. La corrección **no toca la regla ni el contrato**: los endpoints siguen rechazando con `422` y `ventana_de_cancelacion`, y CA-3 quedó intacto. Lo que se agregó es un valor más al campo informativo `porQueNo` (`"ya_paso"`) y una función aparte, `porQueNoSePuedeCambiar`, que **explica** sin decidir. Son dos funciones a propósito: `revisarSiSePuedeCambiar` **decide** y su respuesta es la que viaja como motivo del rechazo; la otra solo le da a la pantalla algo verdadero que escribir. |

| Qué ve el cliente en «Mis citas» | Todas sus citas en una lista; solo las activas; **dos secciones** | **Dos secciones: «Tus próximas citas» arriba y «Historial» abajo**, decidido por la estudiante el 2026-08-20 **en la revisión visual** | Hasta ese día la pantalla mostraba **todo mezclado** en una lista sola. Eso **no cumplía el plan**: `PLAN.md` (piezas 3 y 5) y `ESPECIFICACION.md` dicen en tres lugares que «el cliente ve sus **citas activas**». El error de lectura fue confundir **RN-15** —«nada se borra», que habla de los **datos**— con lo que la pantalla tiene que mostrar; la cita cancelada sigue guardada, solo se mudó de sección. Y había un problema práctico creciendo: esa lista juntaba todas las citas de la persona para siempre, con la próxima —lo único urgente— quedando cada vez más enterrada. Se descartó «solo las activas» porque al cancelar la cita desaparecería de golpe y el único rastro sería el aviso verde, que se va al navegar. **La clasificación la hace el servidor**, en el campo `grupo`: depende de qué hora es, y con el reloj del navegador una máquina mal configurada le pondría la cita de mañana en el historial. **Y es una pregunta distinta de `sePuedeCambiar`**: una cita de hoy en dos horas no se puede cambiar (RN-5) pero **sí es una cita próxima**, y es justamente la más urgente. El historial se lee **de lo más reciente a lo más viejo** —al revés que las próximas—, porque en lo que ya pasó lo de la semana pasada importa más que lo del año pasado. |

| Qué etiqueta lleva una cita que **ya pasó y nadie cerró** | «ACTIVA» (como estaba); «COMPLETADA»; «PASADA»; **ninguna** | **Ninguna**, propuesto y decidido por la estudiante el 2026-08-20 **en la revisión visual** | Decía «ACTIVA» debajo de una cita del mes pasado, y «activa» suena a «esto está en pie». **«COMPLETADA» era la primera idea y se descartó por RN-17**: ese estado **solo** lo marca Personal, **nunca se alcanza por el paso del tiempo**, y la aplicación **no sabe si la persona asistió** —eso lo sabe la asistente, que estuvo ahí—. Ponerlo solo le afirmaría a alguien que fue sin que nadie lo confirme, y **se daría vuelta** el día que Personal marcara «no asistió» (RN-19): la misma cita pasaría de COMPLETADA a NO ASISTIÓ, que para quien mira se ve como un error del sistema. Se descartó también inventar la palabra «PASADA», porque **no hacía falta ninguna palabra nueva**: la regla que quedó se dice en una frase —**la etiqueta aparece solo cuando algo le pasó a la cita**— y su ausencia se entiende porque el título de la sección ya lo dice: **«Historial»**. Así la etiqueta **nunca se desdice**: pasa de no estar a decir COMPLETADA o NO ASISTIÓ, que es un avance. Las tres reglas quedaron intactas y la pieza 8 no perdió nada. **Es un cambio de pantalla nada más:** el dato guardado sigue siendo `activa`. |

| Cómo se le dice al proveedor **en pantalla** | «Proveedor»; «Te atiende»; **«Terapista»** | **«Terapista»**, decidido por la estudiante el 2026-08-20 | «Proveedor» es la palabra del **modelo de datos**, no la que un cliente usaría: nadie piensa «voy a que me atienda mi proveedor». El cambio es **solo de texto** —siete lugares: tres en el HTML, tres en el JavaScript del navegador y la etiqueta del correo—: **la tabla, las columnas y los campos del API siguen llamándose `proveedor`**, porque los nombres técnicos los fija el bloque *Produce* de `PLAN.md` y no se renombran por un cambio de rótulo. Son dos vocabularios a propósito, y quedó escrito en el glosario de `ESPECIFICACION.md` para que una sesión futura no lo «arregle». Va **sin artículo con género** —«tu terapista», «Terapista Ana»— porque los proveedores son mujeres y hombres: «la terapista» dejaría a Carlos mal nombrado. Ninguna prueba dependía del texto viejo, así que `npm test` siguió en 174 sin tocar una prueba. |

**Tres cosas encontradas en la revisión visual, el mismo día:** las filas de «frase falsa», «qué ve el
cliente en Mis citas» y «qué etiqueta lleva una cita que ya pasó».
La tercera vale por lo que enseña sobre el método: la estudiante pidió «COMPLETADA», el agente señaló
el choque con RN-17 **sin construirlo**, y **la salida mejor que las tres opciones que el agente había
propuesto la propuso ella** — sacar la etiqueta. Es también la única de las tres que **no puede tener
prueba automática**: es puramente qué se dibuja y qué no, y el servidor no cambió en una sola línea.

*Un detalle que conviene no perder:* el valor `"ya_paso"` del campo `porQueNo` **sigue haciendo falta
aunque ya no se muestre**. Es lo único que impide que una cita vieja caiga en el renglón que dice
«faltan menos de 4 horas para esta cita». Si el servidor dejara de distinguirlo, esa frase falsa
volvería sola — y **eso sí** lo protege una prueba.
La primera es un defecto de redacción; **la segunda es más grave y conviene decirlo así: el código no
cumplía el plan**, y no lo detectó ninguna prueba porque ninguna prueba compara el código contra lo que
el plan dice en prosa. La encontró una persona mirando la pantalla y preguntando «¿por qué esto sigue
acá?».

**Sobre la primera:** Es el
**octavo** defecto visual del proyecto, y como los siete anteriores lo encontró una persona mirando la
pantalla. Este además enseña algo nuevo: **las pruebas estaban todas en verde y tenían razón** —
comprobaban la regla, y la regla estaba bien—. Lo que estaba mal era **lo que la pantalla decía sobre
esa regla**, y eso ninguna prueba de este proyecto lo puede leer.

**Nada que arreglar en `guiones/datos-de-prueba.js` esta vez**, y vale decir por qué: la regla del
proyecto es que **una tabla nueva que apunte a otra hay que agregarla al borrado, primero de todo**.
Esta pieza **no crea ninguna tabla nueva** —las columnas `cancelada_en` y `cancelada_por` ya existían
en `cita` desde la pieza 3, vacías, esperando— así que el borrado sigue estando completo. Se
comprobó, no se supuso.

## Decisiones tomadas al construir la pieza 7

*Construida el 2026-08-21. Es **casi una segunda aplicación**: la misma pantalla, para otro tipo de
usuario. Trae la **otra mitad de CA-3** —la asistente sí puede cancelar dentro de las 4 horas
(RN-6)— y es la pieza más larga del plan, con 10 comprobaciones. Su revisión visual **corrigió una
regla de negocio**, RN-4, con la regla nueva RN-25: hasta ese día Personal tampoco podía agendar para
hoy.*

**Las cuatro decisiones de la estudiante, tomadas el 2026-08-21 antes de escribir una línea:**

| Decisión | Opciones consideradas | Elección | Razón |
|---|---|---|---|
| Cómo se organiza la pantalla de Personal | Un paso más arriba de los de siempre; una sección nueva con todo adentro; dos secciones separadas | **Un paso más, arriba de los de siempre**: el paso «¿Quién llama?» se agrega antes de «Elegí qué buscás», y la sección de citas muestra las del cliente elegido | Reusa el calendario, las fichas de horario y la tarjeta de confirmar **tal como están**. Es el mismo argumento con el que reagendar reusó la pantalla de reservar en la pieza 5: un segundo calendario sería un segundo lugar donde el mismo defecto visual puede aparecer. Y no cuesta backend: los endpoints del catálogo y del calendario ya aceptaban la sesión de Personal desde la pieza 2, porque piden **que haya sesión**, no que sea de cliente. |
| Qué forma tiene la contraseña temporal | Ocho letras y números al azar en mayúscula; siempre la misma palabra y cuatro números; una palabra y tres números | **Una palabra de una lista corta, con mayúscula inicial, y tres números al azar**: `Girasol472` | Hay que **dictarla por teléfono** (RN-11), y eso es lo que decide. Ocho caracteres al azar son mucho más difíciles de adivinar pero se dictan mal y con errores. Una palabra fija sería lo más cómodo y lo más débil: quien sepa la palabra solo prueba diez mil números. La palabra variable deja ~200.000 combinaciones, y sobre todo: la persona **está obligada** a cambiarla en cuanto entra (RF-4), sobre una cuenta recién creada que todavía no tiene ninguna cita adentro. |
| Si el formulario de cambio pide otra vez la temporal | Tres campos, con la temporal escrita de nuevo; dos campos, y la pantalla se acuerda | **Dos campos**: la nueva y su repetición. La temporal viaja sola, desde la memoria de la pantalla | Es un campo menos justo después de haberlo escrito para entrar. **El caso que esto abre está resuelto:** si la persona **recarga la página** antes de cambiarla, la pantalla pierde lo que tenía en memoria — y ahí, **solo ahí**, aparece el tercer campo pidiendo la temporal. La contraseña nunca queda guardada en ningún lado: vive en una variable del navegador que muere al recargar. |
| Qué muestra el buscador de clientes con el campo vacío | La lista completa de clientes; nada hasta escribir 2 letras | **Nada hasta escribir 2 letras** | Personal siempre sabe con quién está hablando: no necesita elegir de una lista. Y una lista con todos deja los correos de todos los clientes a la vista de cualquiera que pase por atrás del mostrador, y crece para siempre. |

| Qué muestra la pantalla de citas cuando la mira Personal | «Sus próximas citas»; el nombre en un cartel aparte; **el nombre en el título** | **El nombre en los dos títulos de la sección**: «Próximas citas de Marisol Prueba» y «Historial de Marisol Prueba» | Mirando la pantalla el 2026-08-21 apareció que **el único nombre visible era el de la asistente** («Hola, Marta Jiménez»), así que nada decía de quién eran las citas que estaba mirando. «Sus» es un pronombre, y un pronombre necesita que alguien ya haya dicho de quién habla. La solución la propuso la estudiante. Van los **dos** títulos y no solo el primero, porque un título con nombre seguido de un «Historial» pelado deja la duda de si lo de abajo es de la misma persona. |

**Las decisiones técnicas que la construcción obligó a tomar:**

| Decisión | Opciones consideradas | Elección | Razón |
|---|---|---|---|
| Dónde vive la regla de RF-4 («no puede hacer nada más hasta cambiarla») | En cada endpoint de cliente; en la pantalla; en el guardia de la sesión | **En el guardia de cliente de `servidor/sesion.js`** | Es una regla, y una regla se escribe **en un solo lugar**. Escrita ahí la cumplen todos los endpoints del cliente de una sola vez —las citas y `mi-informacion`— y también los que se agreguen mañana, sin que nadie tenga que acordarse. En la pantalla no puede vivir: el frontend no decide reglas de negocio, y quien mande el pedido al API por fuera de la página se la saltearía. El guardia pasó a necesitar la base de datos para poder mirar la columna, y por eso ahora recibe `base`. |
| Qué endpoints quedan abiertos con la contraseña temporal pendiente | Solo `contrasena/cambiar`; los tres que la pantalla necesita | **`GET /api/yo`, `DELETE /api/sesion` y `POST /api/contrasena/cambiar`** | Son exactamente los tres sin los cuales esa pantalla no podría existir: uno para saber quién entró y que le falta cambiarla, otro para poder cambiarla, y el tercero para poder irse. Ninguno de los tres deja hacer nada de negocio. |
| Cómo ve Personal las citas del cliente | `GET /api/citas?clienteId=`; una puerta nueva bajo `/api/personal/` | **`GET /api/personal/clientes/:clienteId/citas`** | El plan dejaba a Personal cancelar la cita de un cliente pero **no decía cómo la ve para poder tocarla**. Todas las puertas que solo abre Personal viven en el mismo pasillo `/api/personal/`, con el mismo guardia: así el permiso se lee de un vistazo en la dirección, y no queda la tentación de que un cliente cuele un `clienteId` ajeno en la puerta de siempre. Quedó escrita en el bloque *Produce* de la pieza 7 de `PLAN.md` **antes** de construirse. |
| Cómo distingue el servidor quién está actuando en reservar, cancelar y reagendar | Endpoints separados para Personal; un guardia que deja pasar a los dos | **Un guardia que deja pasar a los dos** (`crearGuardiaDeClienteOPersonal`) y le deja anotado a la ruta cuál entró | Endpoints separados serían **la misma regla escrita dos veces**: el día que la ventana cambie de 4 a 2 horas habría dos lugares donde acordarse. Con un guardia, `POST`, `DELETE` y `PATCH /api/citas` son los mismos de siempre y lo único que cambia es el valor de `quien` que le pasan a `reservas.js` — que es justo el parámetro que la pieza 5 dejó puesto para esto. |
| Si `POST /api/contrasena/cambiar` es solo para clientes | Solo clientes; cualquier sesión | **Cualquier sesión** | Es el endpoint genérico de cambiar la contraseña, y Personal también tiene una. La columna `debe_cambiar_contrasena` solo existe para clientes, así que para Personal simplemente no hay nada que apagar. La pieza 9 —restablecer la olvidada— va a reusar la misma comprobación de RN-23 desde `credenciales.js`. |

**La quinta decisión, tomada durante la revisión visual del mismo día:**

| Decisión | Opciones consideradas | Elección | Razón |
|---|---|---|---|
| Si Personal puede reservar para **hoy** | Arreglar solo el texto absurdo y dejar la regla como estaba; cambiar también la regla | **Cambiar también la regla** (RN-25): Personal puede reservar, y mover una cita, a cualquier horario de hoy que **todavía no haya empezado** | La estudiante abrió el día de hoy con la cuenta de Personal y leyó *«No se puede reservar para hoy. Si necesitás una cita hoy, **llamá al negocio** al 2000-0000»* — un cartel diciéndole a la asistente del negocio que llame al negocio. El texto era absurdo **porque la regla detrás tenía un hueco**, y es **el mismo hueco que RN-6 existe para tapar**: la aplicación le dice al cliente «para una cita hoy, llamá al negocio», el cliente llama, y la asistente descubría que ella tampoco podía — así que esa cita se anotaba en un papel, que es exactamente la segunda fuente de verdad que `NEGOCIO.md` dice haber eliminado. **CA-2 no se tocó:** el cliente sigue sin poder, y eso es lo que el curso exige proteger. |

**Las dos decisiones que siguieron, en la misma revisión visual:**

| Decisión | Opciones consideradas | Elección | Razón |
|---|---|---|---|
| Cómo se vuelve a la pantalla principal | Una entrada «Inicio» que mantiene a la persona atendida; una que la suelta; las dos separadas | **Una sola entrada, «Inicio»**, que vuelve al principio **manteniendo** a la persona atendida. Y **la marca del encabezado —el logo y el nombre— lleva al inicio, para las dos cuentas** | Estando en «Citas del cliente» no había ninguna entrada de menú que se leyera como «volver al principio»: había «Reservar» y «Citas del cliente», y ninguna de las dos dice eso. **Se construyeron las dos entradas y la estudiante decidió, viéndolas en pantalla, que con «Inicio» alcanzaba** — y tenía razón por un motivo mejor que el ahorro de espacio: soltar a la persona es una acción que **cambia a quién se le está reservando**, y ese botón vive mejor pegado al nombre de esa persona («Atender a otra persona», en la tarjeta «Atendiendo a») que en un menú, donde se toca por error y borra la llamada en curso. Con «Inicio» se llega justo ahí. **La marca la pidió la estudiante aparte**, y después corrigió el alcance: el logo «es también el texto que dice Bienestar y salud», así que el enlace envuelve los dos. Eso obligó a que sea un `<a>` y no un `<button>`, porque adentro va el `<h1>` del negocio y un `<h1>` dentro de un `<button>` es HTML inválido. |
| Si el cliente necesita un mínimo de anticipación en horas | No agregar nada; exigirle 4 horas sumadas a «no hoy»; **reemplazar** «no hoy» por 4 horas | **No agregar nada** | La estudiante pidió un mínimo de 4 horas «igual que para cancelar», y al mirarlo apareció que **al reservar las 4 horas serían una apertura, no una restricción**: como la regla es «no hoy», el mínimo real que el sistema ya garantiza es de **poco más de 9 horas** —quien reserva a las 23:59 para las 9:00 del día siguiente—. Sumadas a «no hoy», las 4 horas **nunca podrían rechazar nada**: una protección visible en el código que no existe. Reemplazando a «no hoy», dejarían al cliente reservar el mismo día y **eliminarían CA-2**, uno de los tres criterios de aceptación que el curso exige proteger con pruebas. Con el dato de las 9 horas a la vista, la estudiante decidió no cambiar nada: su criterio ya estaba cumplido con margen. *Decidido el 2026-08-21.* |

**Cómo se construyó esa regla sin escribirla dos veces.** La diferencia entre los dos actores quedó
en **una sola función** de `servidor/disponibilidad.js`, `estaEnSuTiempo`, que es la que usan las dos
preguntas del archivo: el calendario del mes y la revisión de un horario suelto. Eso es lo que impide
el defecto más caro que ese archivo puede tener —que el calendario ofrezca un horario que la reserva
después rechace—, porque las dos respuestas salen del mismo lugar.

**Y una mudanza que la regla obligó.** `QUIEN_CLIENTE` y `QUIEN_PERSONAL` vivían en
`servidor/reservas.js` desde la pieza 5. Ahora `servidor/disponibilidad.js` también las necesita, y
`reservas.js` ya le pedía cosas a `disponibilidad.js`: los dos archivos habrían quedado
importándose mutuamente, que es un **círculo de importaciones** —JavaScript a veces lo tolera y a
veces deja una de las dos cosas sin valor, según cuál se cargue primero—. Se sacaron a un tercer
archivo que no depende de nadie, `servidor/quien-actua.js`, y `reservas.js` las vuelve a exportar para
que nada de lo que ya las pedía ahí tenga que cambiar. La alternativa era escribir el texto
`"personal"` a mano dentro de `disponibilidad.js`, que es exactamente lo que `CLAUDE.md` prohíbe.

**Una cosa que se decidió NO cambiar, y queda anotada:** el aviso de RN-14 —«no queda ningún horario
libre en los próximos 7 días»— se sigue calculando siempre con la vara del **cliente**, empezando
mañana, incluso cuando lo mira Personal. RN-14 es una regla del cliente («si al entrar **el cliente**
no encuentra…»), y así Personal ve el mismo aviso que vería la persona con la que está hablando, que
es la información útil en una llamada. El único caso en que la frase quedaría corta es que hoy tenga
horarios libres y los 7 días siguientes ninguno.

**Ningún archivo nuevo en la base de datos, y vale decir por qué se comprobó:** la regla del proyecto
es que **una tabla nueva que apunte a otra hay que agregarla al borrado de
`guiones/datos-de-prueba.js`, primero de todo**. Esta pieza **no crea ninguna tabla ni ninguna
columna**: `canal`, `personal_id_creador` y `debe_cambiar_contrasena` ya existían vacías desde las
piezas 1 y 3, esperando esta pieza. Así que el borrado sigue completo. Se comprobó leyendo el guion,
no se supuso.

### Las tres decisiones del cierre de la pieza 7 (2026-08-24)

*Tomadas por la estudiante al terminar la revisión visual, con la aplicación levantada y mirando la
pantalla. Las tres estaban anotadas como abiertas desde el 2026-08-21 y ninguna se resolvió en
silencio.*

| Decisión | Opciones consideradas | Elección | Razón |
|---|---|---|---|
| La etiqueta del segundo botón de «Atendiendo a», que partía en dos líneas entre 476 y 640px | Dejarla como estaba; ensanchar el botón o mover el corte de 476px; **acortar la etiqueta** | **Acortarla a «Otra persona»** | Entra en una línea desde 476px. Ensanchar el botón o mover el corte tocaría dos medidas que **la estudiante misma eligió mirando la pantalla** (el 48% y el 476px), así que se cambia lo que nadie había decidido a propósito. Y el verbo no se pierde: ya está dicho en el título de la tarjeta que contiene al botón, «Atendiendo a». **Es un cambio de texto en la vista: ninguna función, ningún endpoint, ninguna prueba.** |
| Si el corte de 476px vale para las cuatro filas de dos botones o solo para esta | Unificarlo moviendo cinco líneas a la clase compartida y borrando el modificador; **dejarlo como modificador** | **Dejarlo como modificador** (`confirmacion__botones--fila-centrada`) | Las otras tres filas —confirmar la reserva, guardar los datos del usuario, crear la cuenta de quien llama— **ya fueron revisadas y aprobadas como están**, y unificar las movería a las cuatro sin que nadie las hubiera vuelto a mirar. Es el mismo criterio con el que la pieza 5 creó `paso--titulo-pegado`. **El costo se asume a propósito y queda escrito:** entre 476 y 767px la aplicación tiene dos comportamientos distintos. |
| Los botones «Reagendar» y «Cancelar» que le aparecen a Personal sobre una cita que ya pasó | Sacarlos escribiendo una regla nueva; dejarlos y declararlo correcto; **diferir la decisión a la pieza 8** | **Diferirla a la pieza 8**, dejando los botones como están | No es un error del código: sale de leer **RN-6** («Personal no tiene ventana de cancelación») junto con **RN-17** («ninguna cita cambia de estado por el solo paso del tiempo»), y **la especificación no prohíbe** que Personal toque una cita pasada — restringirlo sería **inventar una regla desde el código**, que es justo lo que este proyecto no hace. La pieza 8 es la que trae las herramientas pensadas para las citas pasadas (marcar «completada» o «no asistió»), así que conviene decidirlo con las dos pantallas a la vista. **Si se restringe, la regla se escribe primero en `ESPECIFICACION.md`.** |

**Y una decisión sobre cómo se revisa, no sobre qué se construye.** Ese mismo día se reportó un
defecto que no existía: el campo de la contraseña temporal «no aparecía» al recargar. Se investigó
antes de tocar nada —el servidor reproducido con `curl`, el JavaScript servido comparado contra el
del disco, el CSS compilado y el código—, y **todo estaba correcto**. Lo que había fallado era el
**recorrido escrito**, que hacía tocar «Salir» a destiempo, en una pantalla que tiene su propio botón
«Salir». Quedó como convención en `CLAUDE.md`: **un recorrido de revisión tiene que decir qué botones
no tocar.** Se anota porque una investigación que termina sin defecto **también es trabajo hecho**, y
porque el reflejo contrario —«arreglar» algo que no estaba roto— habría metido un defecto de verdad.

## El sistema visual

La apariencia de la aplicación no se inventa en el código: sale de **`VISUALS.md`**, el sistema
visual «Clinical Excellence», que la estudiante trajo al proyecto el 2026-08-17. Ese archivo es la
autoridad sobre colores, tipografía, tamaños, redondeos y espaciado, igual que `ESPECIFICACION.md`
lo es sobre el comportamiento. **Si un valor no está ahí, no se inventa en el `.scss`.**

Lo que el sistema decide, resumido: fondo gris azulado frío (`#F4F6F8`) como lienzo, tarjetas
blancas con un borde de 1px (`#E2E8F0`) en vez de sombras marcadas, azul marino profundo
(`#002554`) para lo principal, índigo (`#402D84`) para lo secundario, tipografía Manrope, esquinas
de 4px en botones y campos y de 12px en tarjetas, y todas las medidas múltiplos de 4px.

| Decisión | Opciones consideradas | Elección | Razón |
|---|---|---|---|
| Orden en que se escriben los estilos | De escritorio hacia abajo, **mobile-first** (del teléfono hacia arriba) | Mobile-first | Pedido de la estudiante el 2026-08-17. Además es lo que le conviene al proyecto: el teléfono es la pantalla más angosta y la más difícil, así que se resuelve primero y las grandes solo agregan. En el `.scss` esto se ve en que todos los `@media` son `min-width`, nunca `max-width`. Los dos cortes son 48rem (768px) y 64rem (1024px). |
| De dónde sale la tipografía Manrope | Pedirla a Google Fonts en cada visita, copiar los archivos dentro del proyecto | Copiarlos dentro del proyecto, en `publico/fuentes/` | Son 40 KB en dos archivos y cubren todos los pesos de 400 a 700. Pedírsela a Google agregaría un servicio de terceros —justo lo que las restricciones de `CLAUDE.md` limitan al correo— y la página se vería distinta en una máquina sin internet. Con los archivos adentro, la aplicación se ve igual clonada en cualquier parte, que es la promesa del `README.md`. |
| Un fondo con imagen detrás del contenido | Dejar el fondo plano `#F4F6F8` como dice el sistema, poner la imagen que trajo la estudiante | Poner la imagen, **con el color como respaldo** | Pedido de la estudiante el 2026-08-17. Se revisó la imagen antes de aplicarla: es un patrón botánico en gris azulado clarísimo, del mismo tono frío que `#F4F6F8`, de contraste muy bajo. Por eso **no compite con el texto ni rompe la estética clínica**: si fuera una foto con zonas oscuras habría hecho falta un velo encima, y no lo necesita. En el CSS el color va primero y la imagen encima, así que si la imagen no cargara la página se ve igual de bien y nunca en blanco. Va con `cover` (que cubra la pantalla aunque recorte los bordes) porque el patrón es parejo y no importa qué parte se recorte; y queda **quieta al desplazarse solo de tableta para arriba**, porque varios navegadores de celular hacen eso a los saltos. La imagen vive en `publico/img/`, que es la carpeta que el navegador puede ver. |
| Las dos contradicciones internas de `VISUALS.md` | Seguir la lista de valores de arriba (el bloque YAML), seguir la explicación en prosa | Seguir la prosa — y **corregir el archivo**, decidido por la estudiante el 2026-08-17 | El archivo se contradecía en dos puntos: su lista decía que el fondo era `#fcf9f8` (un blanco cálido) y el color principal `#00112d`, mientras su prosa decía que el lienzo es el «Cool Slate Tint» `#F4F6F8` y el principal el «Deep Navy» `#002554`. Se siguió la prosa porque explica **para qué** sirve cada capa: lienzo gris frío para que las tarjetas blancas se despeguen; y `#002554` tiene contraste suficiente para texto blanco encima, mientras `#00112d` es tan oscuro que se lee como negro. **La estudiante zanjó la contradicción en el propio `VISUALS.md`:** ahí `surface`, `surface-bright` y `background` pasaron a `#F4F6F8`, y `primary` pasó a `#002554`. `#00112d` no desapareció: pasó a ser `primary-container`, el tono más oscuro del mismo azul, que se usa cuando se pasa el mouse por un botón y en los títulos de las tarjetas. Tiene que existir un tono más oscuro que el principal: si un botón no cambiara nada al pasarle el mouse, parecería que no responde. |

### Colores decididos por la estudiante después de `VISUALS.md`

`VISUALS.md` manda sobre la apariencia, y cuando un valor no está ahí **se pregunta en vez de
inventarlo** (`CLAUDE.md`, «Lo visual»). Estos son los que la estudiante decidió ella misma mirando
la pantalla, con su fecha y su motivo, para que se sepa que no se colaron desde el código:

| Color | Dónde | Cuándo y por qué |
|---|---|---|
| `#d6e9db` fondo, `#1c1b1b` texto, `#8fb59c` borde | El aviso de «salió bien» (`.aviso--exito`) | 2026-08-19. `VISUALS.md` **nombra** un «success green» entre los indicadores de estado pero nunca dice cuál es, así que hasta ese día no existía ninguno — y «Tu cita quedó reservada» salía con los colores de error, en rojo. |
| `#2f6b45` | La letra de un requisito de contraseña cumplido | 2026-08-19. El verde pálido de arriba no se lee como letra sobre blanco, y un requisito que no se puede leer no avisa nada. |
| **`#2f3367`**, en reemplazo de `#002554` | **El `primary` del sistema entero**: encabezado, pie, botones, el borde de un campo con el foco, el día de hoy del calendario, las fichas de horario tomadas, y el encabezado del correo de confirmación | 2026-08-19. Un azul con algo más de violeta, que se lleva mejor con el índigo secundario. **El cambio se hizo en la variable `$navy` del `.scss`, no lugar por lugar**, así que valió de una vez para las nueve cosas que lo usan — es exactamente para lo que existe una variable. Su tono oscuro de acompañamiento (`$navy-oscuro`, el del paso del mouse) bajó de `#00112d` a `#1f2247`, porque tiene que ser una versión más oscura **del mismo** azul: si no, el botón cambiaría de color al pasarle el mouse en vez de solo oscurecerse. |

**Los tres se escribieron también en `VISUALS.md`**, que es la autoridad sobre la apariencia. Es el
mismo camino que se siguió el 2026-08-17 con el fondo: cuando la estudiante decide un color, se
corrige ese archivo y no queda una versión distinta escondida en el `.scss`. Las entradas
**históricas** de `BITACORA.md` y `SEGUIMIENTO.md` conservan los valores viejos a propósito: son el
registro fechado de lo que se decidió ese día, no documentos vivos.

### Pendientes del sistema visual

Decididos el 2026-08-17 pero **no construidos todavía**, porque hoy no habría qué poner adentro.
Quedan escritos acá para que no se pierdan y para que quien construya las piezas siguientes sepa que
existen.

| Qué falta | Cuándo se construye | Por qué no ahora |
|---|---|---|
| ~~**Un menú de navegación en el pie de página**, arriba del texto de derechos~~ | **Resuelto en la pieza 3** (2026-08-19) | Ya existe la segunda sección que lo justificaba: «Mis citas». El menú enlaza las dos —«Reservar» y «Mis citas»—, que son **vistas que se alternan**, no pasos de un mismo recorrido. Aparece solo con la sesión abierta, porque las dos secciones que enlaza viven adentro de la aplicación. |
| ~~**Un botón «hamburguesa»** (las tres rayitas que abren el menú en pantalla de teléfono)~~ | **Resuelto en la pieza 3** (2026-08-19) | Va **en la barra azul del encabezado**, no en el pie, decidido por la estudiante ese día: es donde una persona busca las tres rayitas. Los enlaces están en los dos lados, y son tres: «Reservar», «Mis citas» y «Salir». Desde tableta (48rem) la hamburguesa desaparece y los enlaces de arriba se muestran como una fila. |
| ~~**El nombre real del negocio en el pie**~~ | **Resuelto en la pieza 2** (2026-08-18) | El pie ya no tiene texto de relleno: el nombre sale de la configuración del negocio (REG-4), junto con el teléfono, la ubicación, el logo y los colores. |
| **El año del pie** | Cuando se decida | Hoy el «2026» está escrito a mano, como se pidió. Si la aplicación siguiera viva en 2027 seguiría diciendo 2026: cuando deje de ser un prototipo, conviene que lo calcule solo. |
| **El formato de la hora: 24 horas o am/pm** | Cuando se decida | **Hoy hay dos formatos a la vez, y eso es un pendiente, no una decisión.** Todo el proyecto muestra la hora de 24 (`14:00`): el calendario, las fichas de horario, la lista de citas, la tarjeta de confirmar y el correo. El **cartel de reagendar** usa `am`/`pm` (`2:00pm`) desde el 2026-08-21, porque la estudiante pidió ese formato en ese texto. Las dos salidas son válidas —extenderlo a todo, o volver atrás en el cartel—, y ninguna es urgente porque son pantallas distintas. Si se extiende, la cuenta ya está escrita en `horaConAmPm` de `publico/aplicacion-cliente.js`, y habría que escribirla también en `servidor/tiempo.js` para el correo. *Ojo con las fichas del calendario: ahí hay ocho horarios en una fila de cuatro columnas, y `10:00am` es más ancho que `10:00` — hay que mirarlo en pantalla de teléfono antes de darlo por bueno.* |

*Nota:* los archivos originales `VISUALDESKTOP.md` y `VISUALSMOBILE.md` tenían **contenido
idéntico** (los mismos 7.600 bytes), así que no había una guía aparte para teléfono: la parte móvil
vive dentro del mismo sistema (márgenes de 16px, titular de 28px, grilla de 4 columnas). Por eso se
consolidaron en un solo `VISUALS.md`.

## Decisiones dejadas abiertas

| Qué no se decidió | Quién lo decide y cuándo |
|---|---|
| Dónde alojar la aplicación en producción real (Render, Vercel, u otro) | La estudiante, si el proyecto sigue después del curso. |
| Migrar el disparador del recordatorio de GitHub Actions al sistema de tareas programadas del hosting elegido | Junto con la decisión anterior. |
| Parametrizar la política de cancelación (hoy fija en 4 horas) por negocio | Ya señalado en la hoja de ruta de `PROYECTO.md`; fuera de esta entrega. |
