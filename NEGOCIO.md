# Reservas en línea para negocios de bienestar y salud — Documento de negocio

## La oportunidad

Hoy el cliente coordina su cita por WhatsApp: escribe, pasa por un bot de opciones, espera a que
una asistente humana quede libre y revise la agenda a mano, y coordina por chat hasta cerrar la
cita — solo en horario laboral.

| | Hoy | Con el prototipo | Origen del número |
|---|---|---|---|
| Tiempo para confirmar una cita | 30–60 min de espera + 10 min de coordinación | Segundos (self-service) | Estimado del negocio |
| Horario disponible para reservar | Solo en horario laboral (44 horas/semana) | 24/7 | Inferido del proceso actual |
| Citas disponibles por semana | 44 (capacidad máxima) | 44 | Cálculo basado en horario declarado |

La ganancia no es solo velocidad: hoy, si un cliente quiere agendar fuera de esas 44 horas
semanales en que el negocio atiende, simplemente no puede — tiene que esperar a que abran. Con
reserva 24/7, esa espera desaparece por completo, no solo se acorta.

## Escenarios de adopción y riesgos

**La aplicación es un complemento, no un reemplazo de la asistente humana.** Siguen existiendo
casos que necesitan a una persona real: reservar el mismo día, o clientes que le tienen
desconfianza a hacer esto solos por internet (por ejemplo, adultos mayores). Para esos casos, el
canal de siempre —llamar al negocio— sigue disponible.

**Riesgo identificado: que la asistente se enrede entre los dos canales.** Con dos sistemas
funcionando en paralelo (la app y la coordinación telefónica/WhatsApp para los casos especiales),
el riesgo real no es que la tecnología falle, sino que la persona que atiende pierda de vista una
cita coordinada por un canal mientras mira el otro — lo que podría causar una doble reserva o una
cita perdida.

**Resuelto por diseño, no por proceso.** Al identificar este riesgo se decidió que la asistente
coordine también las citas telefónicas usando la misma aplicación, con una cuenta de tipo
Personal (ver `DISENO.md`). Así queda un solo calendario, una sola fuente de verdad — no hace
falta que nadie recuerde revisar dos lugares distintos. El riesgo de que el negocio empiece con
dos sistemas paralelos desincronizados no se mitiga, se elimina de raíz.

## Hoja de ruta y retorno de la inversión (ROI)

### Retorno estimado

Ambos números son estimaciones de la estudiante, no mediciones reales del negocio (no existe
todavía un negocio real usando esto).

- **~7.3 horas por semana** de tiempo de la asistente, liberadas de la coordinación manual por
  WhatsApp. *Cálculo:* 44 citas/semana × 10 minutos de coordinación por cita (dato ya declarado
  en `PROYECTO.md`) = 440 minutos ≈ 7.3 horas.
- **~10 citas adicionales por semana**, recuperadas por poder reservar fuera del horario del
  negocio. *Cálculo:* 44 citas/semana × 22.5% (punto medio del rango 20-25% estimado por la
  estudiante, con base en que buena parte de los clientes también trabaja en horario laboral y
  no puede coordinar fácilmente durante ese tiempo).

### Cómo se va a comprobar el ROI

Los dos números de arriba son estimaciones, no mediciones — hay que confirmarlos cuando el
negocio use esto de verdad:

- Horas reales que la asistente dedica a coordinar citas por teléfono/WhatsApp (comparar contra
  las ~7.3 hs/semana estimadas).
- Qué porcentaje de las reservas reales llega fuera del horario del negocio (comparar contra el
  20-25% estimado).
- Qué porcentaje de las citas totales se siguen coordinando por teléfono en vez de por la app
  (para confirmar que el canal telefónico sigue siendo un complemento, y no una señal de que la
  adopción falló).

La herramienta natural para esto es un **reporte semestral** con la comparación en línea vs.
teléfono — ver hoja de ruta.

### Qué sigue (hoja de ruta)

Ya señalado en `PROYECTO.md` y `DISENO.md` como fuera del alcance de esta entrega, pero como
continuación natural del proyecto:

- **Reporte semestral de reservas en línea vs. teléfono**, generado a pedido del negocio (no
  automático) — es la forma de comprobar el ROI de la sección anterior. Se construye si el
  tiempo del proyecto alcanza; si no, queda documentado para más adelante. No requiere un panel
  de administración completo — alcanza con un disparador simple (un comando, o un botón
  protegido solo para esto).
- Lista de espera automatizada (avisar cuando se libere un horario).
- Duraciones de cita variables por servicio (hoy fijas en 1 hora para todos).
- Política de cancelación configurable por negocio (hoy fija en 4 horas).
- Panel de administración con interfaz, para que el negocio cargue su propia cartelera sin
  depender de que alguien edite la configuración directamente.
- Posible expansión a varias sucursales del mismo negocio.
- Migrar el hosting de producción y el disparador del recordatorio de 48h de GitHub Actions al
  sistema de tareas programadas del hosting elegido (Render o Vercel), si el proyecto pasa a
  producción real.
- **Expediente por cliente, visible y editable para Personal:** un lugar donde el negocio anote
  toda la información relevante de un cliente más allá de sus citas — por ejemplo: consumo de
  paquetes de sesiones (un paquete de 10 masajes, cuántas ha tomado, cuántas le quedan),
  padecimientos del paciente, medicamentos, contraindicaciones, y detalles de tratamientos en
  curso (por ejemplo, radioterapia). En general, cualquier dato clínico o administrativo que el
  negocio considere parte del expediente del cliente. *Cómo se estructura y qué campos tiene
  exactamente queda para definir en una próxima sesión de diseño* — por ahora solo se declara la
  necesidad. Ya se señaló que depende de una decisión previa sin resolver: el sistema no
  registra compras ni pagos, así que el consumo de paquetes en particular necesitaría decidir
  primero cómo se registra que un cliente tiene uno.
