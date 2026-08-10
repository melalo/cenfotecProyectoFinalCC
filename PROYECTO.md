# Reservas en línea para negocios de bienestar y salud

**Melania Lopez** · SINT-732 Laboratorio Ejecutivo en Claude Code
Entrega y presentación: martes 8 de septiembre de 2026, Sesión 8

> Este es mi enunciado del proyecto del curso. Reemplaza a los casos semilla de la
> consigna oficial; todo lo demás de esa consigna —el núcleo, la rúbrica de nueve
> criterios y las restricciones— aplica igual.

## 1. Qué es y para quién

Una aplicación donde un cliente reserva citas en un negocio de bienestar y salud —por ejemplo, un lugar de masajes o una clínica estética— sin tener que esperar respuesta por WhatsApp.

- **Quién lo usa:** el cliente final que quiere agendar una cita; cualquier persona con acceso a la aplicación.
- **Qué dispara el uso:** cuando alguien quiere reservar un servicio y no quiere llamar ni esperar que un agente conteste por WhatsApp, especialmente fuera del horario laboral.

## 2. El eje de valor

**Eje declarado:** antes/después estimado

Hoy el cliente manda mensaje por WhatsApp, pasa por un bot que le muestra opciones numeradas, espera a que un agente humano quede libre y revise la agenda a mano, y coordina por chat hasta cerrar la cita. El agente solo atiende en horario laboral. Con el prototipo, el cliente reserva solo, en cualquier momento, sin esperar a nadie.

| | Hoy | Con el prototipo | Origen del número |
|---|---|---|---|
| Tiempo para confirmar una cita | 30–60 min de espera + 10 min de coordinación | Segundos (self-service) | Estimado del negocio |
| Horario disponible para reservar | Solo en horario laboral | 24/7 | Inferido del proceso actual |
| Citas disponibles por semana | 44 (capacidad máxima) | 44 | Cálculo basado en horario declarado |

Sobre este eje se van a argumentar el criterio 1 —oportunidad— y el criterio 6 —hoja de ruta y retorno—. Los números finales se construyen durante el proyecto; lo que queda fijo acá es contra qué se comparan.

## 3. El recorrido principal

De punta a punta, el camino que el prototipo tiene que recorrer completo:

1. El cliente entra a la aplicación con su correo y contraseña, o con su correo y un enlace mágico (mecanismo por definir en la fase de diseño).
2. Escoge el tipo de servicio que quiere.
3. Si hay más de un proveedor para ese servicio, elige a quién quiere que lo atienda.
4. Ve el calendario del mes con los slots disponibles (verde) y los no disponibles (bloqueados). Puede navegar mes a mes. Solo se muestran slots a partir del día siguiente.
5. Escoge un slot y confirma la reserva.
6. Recibe un correo inmediato con la fecha, hora, servicio, proveedor y ubicación del negocio.
7. 48 horas antes de la cita, recibe un correo recordatorio con enlace para cancelar o reagendar desde la app.
8. Si necesita cancelar o reagendar, lo hace desde la app. Si ya quedan menos de 4 horas para la cita, el sistema le informa que no puede hacerlo por ahí y que tiene que llamar al negocio.

**Queda afuera a propósito:**
- Citas para el mismo día: el cliente debe llamar directamente al negocio.
- Panel de administración con interfaz de usuario: los servicios, proveedores, horarios, logo y paleta de colores se cargan directamente en la configuración por el desarrollador.
- Múltiples vistas de calendario (día, semana): solo vista mensual con navegación entre meses.
- Lista de espera automatizada: queda en la hoja de ruta.

## 4. Las reglas que valen

1. Un slot solo puede tener una reserva activa a la vez; si dos clientes intentan reservar el mismo, solo uno lo logra.
2. No hay slots disponibles en días feriados de ley de Costa Rica.
3. El horario disponible es lunes a viernes de 9am a 6pm (última cita inicia a las 5pm), con almuerzo bloqueado de 12pm a 1pm. Sábados de 9am a 1pm.
4. El sistema solo permite reservar a partir del día siguiente; citas para el mismo día requieren llamada telefónica al negocio.
5. No se puede cancelar ni reagendar con menos de 4 horas de anticipación; el sistema muestra un mensaje de error y le dice al cliente que llame.
6. Una cancelación libera el slot automáticamente y queda visible para otro cliente.
7. Cuando hay más de un proveedor para el mismo servicio, el cliente elige a quién quiere.
8. Si no hay ningún slot disponible en los próximos 7 días desde la fecha en que el cliente entra, el sistema muestra un aviso sugiriéndole que revise periódicamente por si se libera algún espacio.

**La decisión difícil.** El límite mínimo para reservar: el sistema no permite citas para el mismo día; solo acepta reservas a partir del día siguiente. La alternativa habría sido permitir reservas con al menos X horas de anticipación (por ejemplo, 4 horas), lo que daría más flexibilidad para reservas de último momento. Se eligió "a partir del día siguiente" porque simplifica la lógica del calendario, elimina ambigüedades cerca del cierre del día, y alinea el proceso con cómo el negocio opera hoy: las citas de último momento ya se resuelven por teléfono y ese canal sigue disponible. Esto es lo que se defiende en la Sesión 8.

## 5. Los datos

- **Qué persiste:** usuarios (clientes), servicios, proveedores, configuración de horario del negocio, citas (con su estado: activa, cancelada, completada), registro de correos enviados.
- **De dónde salen para la demostración:** datos ficticios inventados por la estudiante; clientes, servicios y citas simuladas.
- **Confidencialidad:** ninguna; todo es ficticio y puede mostrarse en clase.

## 6. Frontera técnica

- **Depende de:** un servicio externo de correo electrónico (Resend o SendGrid, capa gratuita) para el envío de confirmaciones y recordatorios.
- **Acceso real:** sí; la estudiante creará una cuenta gratuita y usará la API.
- **Restricciones impuestas:** ninguna declarada. La lista de feriados de ley de Costa Rica se precarga como dato fijo.

## 7. Qué debe ser cierto cuando entregue

1. **La oportunidad está comparada.** Tiempo de coordinación por WhatsApp (estimado) versus reserva self-service en segundos, con el origen de cada número declarado.
2. **La arquitectura se decidió antes que el código.** Módulos con responsabilidades separadas, contratos entre ellos y diagramas versionados en el repositorio; pendiente de decisión en la fase de diseño.
3. **El prototipo funciona de extremo a extremo y persiste datos de verdad.** El recorrido completo desde login hasta confirmación por correo, con citas guardadas en base de datos real.
4. **Las reglas del negocio están cubiertas por pruebas que corren en cada push.** Al menos las reglas 1, 4 y 5 de la sección 4: no doble reserva, no same-day booking, y bloqueo de cancelación tardía.
5. **El proceso de construcción quedó registrado.** CLAUDE.md, bitácora e historial de commits.
6. **La gobernanza quedó registrada en la bitácora.** En este proyecto, donde el sistema calcula disponibilidad y bloquea slots automáticamente, la revisión de gobernanza se enfoca en verificar que el agente no haya generado lógica de calendario que parezca correcta pero falle en casos borde (feriados, almuerzo, cambio de mes).
7. **La decisión de adoptar está fundamentada.** Escenario de un negocio de bienestar y salud que pasa de WhatsApp a reservas en línea: horas liberadas del staff, citas recuperadas fuera del horario laboral, y estimación de retorno.
8. **La presentación defiende decisiones.** De 10 a 12 minutos, Sesión 8.

## 8. El núcleo en este proyecto

| Pieza | Cómo se cumple acá |
|---|---|
| Prototipo de extremo a extremo | Login → selección de servicio y proveedor → calendario → reserva → correo de confirmación → cancelación o reagendamiento |
| Persistencia en base de datos real | Usuarios, citas, servicios, proveedores y configuración de horario guardados en base de datos; las citas sobreviven al reinicio de la aplicación |
| Pruebas sobre las reglas del negocio | No doble reserva, no citas para el mismo día, bloqueo de cancelación tardía (reglas 1, 4 y 5 de la sección 4) |
| CLAUDE.md propio y bitácora con entradas de gobernanza | Aplica igual que a todos |
| Integración continua y skill de arranque | Aplica igual que a todos |
| Los dos documentos | Aplica igual que a todos |

**Excepciones abiertas.** Ninguna.

## 9. Calendario

Horas disponibles por semana: **4**. Semanas hasta la entrega: **5**.

| Para la sesión | Qué tengo que tener listo |
|---|---|
| 4 · 11 de agosto | Repositorio con CLAUDE.md propio, arquitectura con módulos y contratos, diagramas versionados, bitácora abierta |
| 5 · 18 de agosto | El recorrido principal funcionando de extremo a extremo: login → selección → calendario → reserva → correo inmediato, con persistencia real |
| 6 · 25 de agosto | Pruebas de las reglas del negocio corriendo en cada push; cancelación y reagendamiento funcionando |
| 7 · 1.º de septiembre | Recordatorio de 48 horas activo, skill de arranque en el repositorio, escenarios de adopción en el documento de negocio |
| 8 · 8 de septiembre | Repositorio completo y presentación |

## 10. Supuestos declarados

- **Mecanismo de autenticación:** contraseña o enlace mágico; por definir en la fase de diseño.
- **Volumen de 44 citas por semana:** calculado con el horario declarado (L-V 9–18 con almuerzo bloqueado, Sab 9–13); no se verificó contra datos reales del negocio.
- **Tiempo de coordinación por WhatsApp:** 30–60 minutos de espera más 10 minutos de coordinación; estimado por la estudiante, no medido.
- **Duración de citas:** 1 hora fija para este prototipo. La flexibilidad para manejar duraciones distintas por servicio queda en la hoja de ruta.
- **Configuración del negocio:** servicios, proveedores, horarios, logo y paleta de colores se cargan directamente como configuración inicial, sin panel de administración con interfaz de usuario.
- **Política de cancelación:** 4 horas como base para este prototipo; el parámetro está pensado para ser configurable por negocio, pero esa parametrización queda en la hoja de ruta.

## 11. Lo que este documento no decide

A propósito. Estas decisiones son mías y llegan después:

- La arquitectura: módulos, responsabilidades y contratos entre ellos.
- El modelo de datos.
- El stack: lenguaje, framework y motor de base de datos.
- El mecanismo de autenticación: contraseña versus enlace mágico.
- La estructura de archivos de configuración (colores, imágenes).

El criterio 2 de la rúbrica evalúa exactamente estas decisiones, así que tomarlas temprano y sin fundamento no adelanta nada.
