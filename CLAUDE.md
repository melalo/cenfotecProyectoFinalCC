
# CLAUDE.md — Reservas en línea para negocios de bienestar y salud

## Stack

- **Frontend:** HTML + CSS, con SASS para los estilos.
- **Backend:** JavaScript (Node.js), con Express para el API.
- **Base de datos:** SQLite, accedida con `better-sqlite3`.
- **Autenticación:** contraseña (no enlace mágico).
- **Correo (confirmaciones y recordatorio de 24h):** Resend — más simple de configurar que
  SendGrid para un proyecto de este tamaño.
- **Disparador del recordatorio de 24h:** tarea programada en GitHub Actions, que le avisa al
  backend cada cierto tiempo para que revise si hay recordatorios pendientes de mandar.
  *(Nota para el futuro: si esto se convierte en una aplicación real en producción, migrar este
  disparador al sistema de tareas programadas del hosting elegido — por ejemplo Render o
  Vercel — en vez de depender de GitHub Actions.)*

## Comandos

**Todavía no existen: los crea la pieza 1 de `PLAN.md`.** Están declarados acá y en `README.md`
como el contrato que esa pieza tiene que cumplir, para que quien la construya sepa qué nombres usar.

| Comando | Qué hace |
|---|---|
| `npm install` | Instala las dependencias. |
| `npm run datos` | Crea la base SQLite desde cero y carga los datos de prueba inventados. Se puede correr las veces que haga falta. |
| `npm start` | Levanta la aplicación en **http://localhost:3000**. |
| `npm test` | Corre las pruebas de los criterios de aceptación (CA-1, CA-2 y CA-3). |

Variables de entorno, en un `.env` que **no se sube**, con un `.env.ejemplo` versionado al lado:
`PORT` y `SESION_SECRETO` (desde la pieza 1), `RESEND_API_KEY` y `CORREO_REMITENTE` (desde la 4), y
`RECORDATORIOS_SECRETO` (desde la 6). Sin `RESEND_API_KEY` la aplicación tiene que levantar igual:
los correos fallan y quedan registrados como fallidos, pero las citas se siguen creando (RF-19).

## Convenciones

[Completar con las convenciones propias del proyecto: estructura de carpetas, cómo se nombran
los módulos, estilo de código, cómo se organizan las pruebas.]

## Restricciones

[Completar con las restricciones que aplican a este proyecto en particular — además de las
generales del curso (construir todo con Claude Code, sin datos reales confidenciales, etc.),
cualquier restricción propia: por ejemplo, las impuestas por la frontera técnica declarada en
`PROYECTO.md` (sección 6) o por decisiones tomadas en el diseño arquitectónico.]
