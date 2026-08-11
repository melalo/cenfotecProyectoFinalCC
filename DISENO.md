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

## Componentes

**1. Autenticación** — Login, sesión (7 días) y recuperación de contraseña por correo (enlace
de un solo uso, vence en 1 hora). *Límite:* los demás componentes le preguntan quién es antes de
dejarla actuar; no sabe nada de citas ni servicios.

**2. Catálogo** — Servicios, proveedores por servicio, y la configuración precargada del negocio
(horario, feriados, logo, colores), sin panel de administración. *Límite:* Reservas y Calendario
solo leen de aquí.

**3. Calendario y disponibilidad** — Calcula qué horarios están libres aplicando el horario del
negocio (L-V 9am-6pm con almuerzo bloqueado 12pm-1pm, sábados 9am-1pm), los feriados de Costa
Rica, y los horarios ya reservados. Solo muestra slots a partir del día siguiente. *Límite:*
consulta a Reservas qué está ocupado; no crea ni cancela citas.

**4. Reservas** — Crea, cancela y reagenda citas aplicando las reglas de negocio de
`PROYECTO.md`: no doble reserva, no mismo día, no cancelar/reagendar con menos de 4 horas de
anticipación. Avisa a Notificaciones cuando algo cambia. *Límite:* es el único componente que
modifica el estado de una cita.

**5. Notificaciones** — Manda los correos (confirmación, recordatorio de 48h, recuperación de
contraseña) hablando con Resend; revisa recordatorios pendientes cuando GitHub Actions le avisa.
*Límite:* solo lee de Reservas, Catálogo y Autenticación; no decide reglas de negocio.

**6. Interfaz del cliente (frontend)** — Login, catálogo, calendario, reserva,
cancelación/reagendamiento; envía cada acción al backend por el API. *Límite:* no decide
ninguna regla de negocio por su cuenta.

## Modelo de datos

**Entidades:**
- **Cliente** — correo, contraseña (cifrada), nombre.
- **Servicio** — nombre, duración (fija en 1 hora para este prototipo).
- **Proveedor** — nombre; puede atender uno o más servicios.
- **Configuración del negocio** — horario semanal, feriados de Costa Rica, logo, colores.
- **Cita** — cliente, servicio, proveedor, fecha y hora de inicio, estado (activa, cancelada,
  completada), fecha de creación.
- **Correo enviado** — cliente destinatario, cita relacionada (no aplica a recuperación de
  contraseña), tipo, fecha de envío, si tuvo éxito.
- **Token de recuperación** — cliente, código, fecha de vencimiento, si ya se usó.

**Relaciones:**
```
Cliente 1 ──> N Cita          Servicio 1 ──> N Cita         Proveedor 1 ──> N Cita
Servicio N <──> N Proveedor
Cliente 1 ──> N Correo enviado     Cita 1 ──> N Correo enviado (opcional)
Cliente 1 ──> N Token de recuperación
```

Un horario está disponible si cae dentro del horario del negocio, no es feriado, y no hay
ninguna Cita activa para ese proveedor en ese horario.

## Manejo de errores

- **Dos clientes eligen el mismo horario a la vez:** se avisa a quien pierde la carrera y se
  muestra el calendario actualizado.
- **Reservar el mismo día:** rechazado; se pide llamar al negocio.
- **Cancelar/reagendar con menos de 4 horas:** rechazado; se pide llamar al negocio.
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

### Disparador del recordatorio de 48 horas

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
