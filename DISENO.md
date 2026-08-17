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

## Decisiones dejadas abiertas

| Qué no se decidió | Quién lo decide y cuándo |
|---|---|
| Dónde alojar la aplicación en producción real (Render, Vercel, u otro) | La estudiante, si el proyecto sigue después del curso. |
| Migrar el disparador del recordatorio de GitHub Actions al sistema de tareas programadas del hosting elegido | Junto con la decisión anterior. |
| Parametrizar la política de cancelación (hoy fija en 4 horas) por negocio | Ya señalado en la hoja de ruta de `PROYECTO.md`; fuera de esta entrega. |
