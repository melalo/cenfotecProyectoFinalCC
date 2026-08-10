
# CLAUDE.md — Reservas en línea para negocios de bienestar y salud

## Stack

- **Frontend:** HTML + CSS, con SASS para los estilos.
- **Backend:** JavaScript (Node.js), con Express para el API.
- **Base de datos:** SQLite, accedida con `better-sqlite3`.
- **Autenticación:** contraseña (no enlace mágico).
- **Correo (confirmaciones y recordatorio de 48h):** Resend — más simple de configurar que
  SendGrid para un proyecto de este tamaño.
- **Disparador del recordatorio de 48h:** tarea programada en GitHub Actions, que le avisa al
  backend cada cierto tiempo para que revise si hay recordatorios pendientes de mandar.
  *(Nota para el futuro: si esto se convierte en una aplicación real en producción, migrar este
  disparador al sistema de tareas programadas del hosting elegido — por ejemplo Render o
  Vercel — en vez de depender de GitHub Actions.)*

## Comandos

[Completar cuando exista el proyecto: cómo instalar dependencias, cómo correr el prototipo
localmente, cómo correr las pruebas, cómo aplicar migraciones de base de datos, si aplica.]

## Convenciones

[Completar con las convenciones propias del proyecto: estructura de carpetas, cómo se nombran
los módulos, estilo de código, cómo se organizan las pruebas.]

## Restricciones

[Completar con las restricciones que aplican a este proyecto en particular — además de las
generales del curso (construir todo con Claude Code, sin datos reales confidenciales, etc.),
cualquier restricción propia: por ejemplo, las impuestas por la frontera técnica declarada en
`PROYECTO.md` (sección 6) o por decisiones tomadas en el diseño arquitectónico.]
