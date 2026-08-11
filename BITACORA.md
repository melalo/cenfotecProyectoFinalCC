# Bitácora del proyecto — Reservas en línea para negocios de bienestar y salud

Registro fechado de las decisiones tomadas y su justificación, los encargos que resultaron
determinantes, y los momentos en que se corrigió el rumbo del agente. Incluye, marcadas como
**entradas de gobernanza**, las afirmaciones falsas del agente que se detectaron durante el
proyecto: qué afirmó, cómo se detectó, y qué control quedó establecido.

## Declaración de supervisión

- **Se revisa siempre:** cada decisión de arquitectura y de stack, antes de que quede tomada
  (autenticación, lenguaje, base de datos, mecanismo del recordatorio). Ninguna se toma sin
  aprobación explícita, una por mensaje.
- **Se delega sin revisión previa** (pero se lee después): la redacción de los documentos
  (`PROYECTO.md`, `DISENO.md`, etc.) y, más adelante, el código que implemente lo ya decidido —
  se revisa una vez escrito, no se dicta línea por línea.
- **Cómo se detecta una afirmación falsa del agente:** contrastando lo que el agente dice haber
  hecho contra el resultado real (por ejemplo, releer un archivo que dice haber escrito, o
  correr una prueba que dice haber pasado) antes de darlo por bueno.

## Entradas

### 2026-08-10

**Decisiones tomadas y su justificación:**
- **Enfoque de arquitectura — aprobado el Enfoque A:** backend (API) y frontend separados por
  contrato, en vez de todo junto o microservicios. Razón: separa responsabilidades (lo que pide
  el criterio 2 de la rúbrica) sin la complejidad operativa de microservicios, viable con 4
  horas por semana.
- **Autenticación — contraseña.** *Corrección de rumbo:* el agente recomendó enlace mágico
  (menos infraestructura que mantener); la estudiante decidió contraseña.
- **Stack — HTML/CSS con SASS (frontend), JavaScript/Node.js con Express (backend).**
  *Corrección de rumbo:* el agente había recomendado Python para el backend, priorizando qué
  tan fácil es de leer para alguien sin experiencia previa programando; la estudiante decidió
  JavaScript porque ya conoce el lenguaje y prioriza poder seguir el código que se construya.
- **Base de datos — SQLite**, tras revisar explícitamente en qué escenarios dejaría de alcanzar
  (alta concurrencia, varias sucursales con servidores independientes, volumen masivo) y
  confirmar que ninguno aplica a este proyecto.
- **Recordatorio de 48 horas — disparado por una tarea programada en GitHub Actions** para el
  prototipo del curso, con la decisión explícita de migrarlo al sistema de tareas programadas
  del hosting (Render o Vercel) si el proyecto pasara a producción real.
- **Correo — Resend**, elegido sobre SendGrid por ser más simple de configurar para un proyecto
  de este tamaño.

**Encargos determinantes:** el enunciado del proyecto (`PROYECTO.md`), producido con la skill
oficial `mi-proyecto`, fijó el alcance, las reglas de negocio y los supuestos antes de esta
sesión de diseño — la entrevista de diseño no repreguntó nada de lo que ese documento ya
contestaba.

**Entradas de gobernanza:** ninguna todavía. No se detectó ninguna afirmación falsa del agente
en este proyecto hasta la fecha. Se agrega la primera entrada real de este tipo apenas ocurra un
caso concreto — no se inventa una para completar esta sección.

### 2026-08-11

**Decisiones tomadas y su justificación:**
- **Componentes — aprobados los seis:** Autenticación, Catálogo, Calendario y disponibilidad,
  Reservas, Notificaciones, Interfaz del cliente. Cada uno con su propósito y su límite con el
  resto definidos antes de tocar el modelo de datos.
- **Manejo de errores en el login — mensaje genérico.** *Corrección de rumbo, en sentido
  inverso al de ayer:* la estudiante pidió primero que el sistema aclarara cuál de los dos
  campos (correo o contraseña) estaba mal; el agente señaló el riesgo de seguridad (permite
  descubrir qué correos están registrados, probando al azar) antes de implementarlo; la
  estudiante reconsideró y mantuvo el mensaje genérico.
- **Se agrega recuperación de contraseña por correo** (enlace de un solo uso, vence en 1 hora) —
  no tenía conflicto con la decisión anterior, así que se sumó sin objeción. Esto amplió las
  responsabilidades de Autenticación y Notificaciones, y agregó la entidad *Token de
  recuperación* al modelo de datos.
- **Modelo de datos y manejo de errores — aprobados** con las siete entidades y los ocho casos
  de error, incluyendo la corrección de una inconsistencia real que el agente encontró en su
  propia revisión de cuatro pasadas: el "Correo enviado" solo estaba ligado a una Cita, pero el
  correo de recuperación de contraseña no tiene ninguna cita de por medio.
- **DISENO.md se divide en dos archivos.** *Corrección de rumbo:* el agente señaló, en la misma
  revisión de cuatro pasadas, que el documento completo excedía el límite de dos páginas que
  pide `curso.md` para el diseño arquitectónico. La estudiante decidió conservar ambas
  versiones: `DISENO1.md` (completo, de referencia, ignorado por Git) y `DISENO.md` (compacto,
  el que se sube). Se ajustó el nivel de recorte una vez, a pedido de la estudiante, para que la
  versión compacta perdiera el mínimo de detalle posible dentro de las dos páginas.
- **NEGOCIO.md — escrito y aprobado**, con la oportunidad (reutilizada de `PROYECTO.md`), un
  escenario de riesgo, y la hoja de ruta con dos estimaciones de ROI (~7.3 hs/semana de personal
  liberadas, ~10 citas/semana recuperadas fuera de horario), ambas declaradas como estimación,
  no medición.
- **Se agrega una cuenta de tipo Personal.** Al redactar el escenario de riesgo del documento de
  negocio, la estudiante identificó que la asistente debía coordinar también las citas
  telefónicas desde la misma aplicación (no con un método aparte), para no crear una segunda
  fuente de verdad. Esto amplía el alcance de `PROYECTO.md` (que solo describe el recorrido del
  cliente) sin contradecirlo, y **elimina en el diseño** el riesgo que se había identificado
  minutos antes en `NEGOCIO.md` — se actualizaron `DISENO.md`, `DISENO1.md` (dos tipos de
  cuenta, campo "canal" en la Cita) y la sección de riesgo de `NEGOCIO.md` en consecuencia.
- **Se agrega a la hoja de ruta (sin construir): expediente por cliente**, editable por
  Personal, más amplio de lo que pareció al principio — no es solo consumo de paquetes de
  sesiones, sino cualquier información relevante del cliente para el negocio: padecimientos,
  medicamentos, contraindicaciones, tratamientos en curso (por ejemplo, radioterapia), además de
  los paquetes. Es un adendum declarado a propósito, sin definir su estructura todavía — eso
  queda para una próxima sesión de diseño. Ya se señaló que el consumo de paquetes en particular
  depende de una decisión previa sin resolver: el sistema no registra compras ni pagos.

**Encargos determinantes:** ninguno nuevo — se siguió trabajando sobre el enunciado
(`PROYECTO.md`) y las decisiones ya tomadas el 2026-08-10.

**Entradas de gobernanza:** ninguna todavía. La inconsistencia del modelo de datos (mencionada
arriba) fue un hallazgo de la propia revisión del agente, no una afirmación falsa que se le
haya escapado y alguien más haya tenido que detectar — no cuenta como caso de gobernanza. Sigue
sin haber un caso real de ese tipo en este proyecto.
