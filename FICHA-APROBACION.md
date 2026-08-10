# Ficha de aprobación · Reservas en línea para negocios de bienestar y salud

**Melania Lopez** · SINT-732 · 3 de agosto de 2026

**Qué es.** Una aplicación donde el cliente reserva citas en un negocio de bienestar y salud (masajes, estética) sin tener que esperar respuesta de un agente humano por WhatsApp.

**Cómo se hace hoy.** El cliente escribe por WhatsApp, pasa por un bot de opciones, espera a que un agente revise la agenda a mano y coordina la cita por chat; solo funciona en horario laboral.

---

## Lo esencial

| | |
|---|---|
| **Eje de valor** | Antes/después estimado |
| **La comparación** | De 30–60 min de espera + 10 min de coordinación por WhatsApp, a reserva self-service en segundos, disponible 24/7 |
| **Recorrido principal** | Desde el login del cliente hasta recibir el correo de confirmación de la cita |
| **Queda afuera** | Citas para el mismo día, panel de administración con UI, vistas de calendario múltiples, lista de espera automatizada |
| **La decisión difícil** | Límite mínimo de reserva: solo a partir del día siguiente (no mismo día), en vez de permitir reservas con X horas de anticipación |
| **Datos para la demo** | Ficticios, inventados por la estudiante |
| **Horas por semana** | 4, por 5 semanas |
| **Punto de partida** | Desde cero |

## El núcleo

| Pieza | | Cómo se cumple acá |
|---|---|---|
| Prototipo de extremo a extremo | ✔ | Login → servicio → proveedor → calendario → reserva → correo → cancelar/reagendar |
| Persistencia en base de datos real | ✔ | Usuarios, citas, servicios, proveedores, horario; datos sobreviven al reinicio |
| Pruebas sobre las reglas del negocio | ✔ | No doble reserva, no same-day booking, bloqueo de cancelación tardía (menos de 4 horas) |
| CLAUDE.md y bitácora con entradas de gobernanza | ✔ | Aplica igual que a todos |
| Integración continua y skill de arranque | ✔ | Aplica igual que a todos |
| Los dos documentos | ✔ | Aplica igual que a todos |

## Banderas

- **Recordatorio de 48 horas con proceso en segundo plano** — requiere un job que corre independiente del usuario; es la pieza de mayor riesgo técnico con 4 horas por semana. Si el tiempo aprieta, sería la primera en recortar.

## Supuestos que quedaron declarados

- Mecanismo de autenticación (contraseña vs. enlace mágico): por definir en diseño.
- Volumen de 44 citas/semana: calculado con el horario declarado, sin verificación contra datos reales.
- Tiempo de coordinación por WhatsApp (30–60 min + 10 min): estimado, no medido.
- Duración de citas: 1 hora fija para el prototipo; duraciones variables quedan en la hoja de ruta.
- Configuración del negocio precargada sin panel de administración con UI.
- Política de cancelación: 4 horas base; parametrizable por negocio queda en la hoja de ruta.

## Preguntas para el docente

Ninguna.

---

*Enunciado completo en `PROYECTO.md`.*
