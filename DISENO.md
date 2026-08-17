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

**2. Catálogo** — Servicios, proveedores por servicio, y la configuración precargada del negocio
(horario, feriados, logo, colores), sin panel de administración. *Límite:* Reservas y Calendario
solo leen de aquí.

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
- **Cliente** — correo, contraseña (cifrada), nombre, y si tiene una **contraseña temporal
  pendiente de cambiar** (cuenta creada por Personal, RN-11).
- **Personal** — correo, contraseña (cifrada), nombre. Precargada, sin autorregistro.
- **Servicio** — nombre, duración (fija en 1 hora para este prototipo).
- **Proveedor** — nombre; puede atender uno o más servicios.
- **Configuración del negocio** — horario semanal, feriados de Costa Rica, logo, colores.
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
| Qué hacer con las dos contradicciones internas de `VISUALS.md` | Seguir la lista de valores de arriba (el bloque YAML), seguir la explicación en prosa | Seguir la prosa | El archivo se contradice en dos puntos: la lista dice que el fondo es `#fcf9f8` (un blanco cálido) y que el color principal es `#00112d`, mientras la prosa dice que el lienzo es el «Cool Slate Tint» `#F4F6F8` y que el principal es el «Deep Navy» `#002554`. Se eligió la prosa porque explica **para qué** sirve cada capa —lienzo gris frío para que las tarjetas blancas se despeguen— y esa intención es lo que hay que respetar. `#00112d` se usó igual, como el tono más oscuro para el texto de los títulos y el paso del mouse. **Queda señalado para que la estudiante lo corrija en `VISUALS.md` si quiere.** |

### Pendientes del sistema visual

Decididos el 2026-08-17 pero **no construidos todavía**, porque hoy no habría qué poner adentro.
Quedan escritos acá para que no se pierdan y para que quien construya las piezas siguientes sepa que
existen.

| Qué falta | Cuándo se construye | Por qué no ahora |
|---|---|---|
| **Un menú de navegación en el pie de página**, arriba del texto de derechos | Cuando existan secciones que enlazar — desde la pieza 2, que trae el catálogo y el calendario | Hoy la aplicación tiene una sola pantalla: un menú con un solo destino no es un menú. |
| **Un botón «hamburguesa»** (las tres rayitas que abren el menú en pantalla de teléfono) | Junto con el menú | Depende de que el menú exista. |
| **El nombre real del negocio en el pie** | Cuando llegue la configuración del negocio (REG-4, pieza 2) | Hoy el pie dice «© 2026 Belleza y Bienestar», que es **texto de relleno inventado**: no es un negocio real. El nombre verdadero va a salir de la configuración, junto con el logo y los colores, no escrito a mano en el HTML. |
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
