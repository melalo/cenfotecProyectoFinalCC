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
  contraseña), tipo, fecha de envío, si tuvo éxito.
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
