# Especificación: Reservas en línea para negocios de bienestar y salud

## Resumen

Sistema para que el cliente de un negocio de bienestar y salud —un lugar de masajes, una clínica
estética— reserve, cancele y reagende sus citas por su cuenta y a cualquier hora, en lugar de
coordinarlas por WhatsApp con una asistente que solo atiende en horario laboral. La asistente del
negocio usa la misma aplicación para las citas que le entran por teléfono, de modo que exista un
solo calendario y no dos agendas que se puedan desincronizar.

## Glosario

| Término | Definición |
|---|---|
| Cliente | La persona que reserva una cita para sí misma. Tiene cuenta propia en el sistema. Se descartan "usuario" y "paciente" como sinónimos. |
| Personal | La asistente del negocio. Su cuenta viene precargada y no se autorregistra. Reserva, cancela y reagenda en nombre de clientes que llaman por teléfono. |
| Servicio | Lo que el negocio ofrece y el cliente contrata: un masaje, una limpieza facial. Dura una hora fija en este prototipo. |
| Proveedor | La persona que atiende el servicio. Un servicio puede tener uno o varios proveedores, y un proveedor puede atender varios servicios. |
| Horario | Un espacio de una hora en la agenda de un proveedor, en una fecha y hora determinadas. Es la unidad que el cliente elige en el calendario. Se descarta "slot" como sinónimo, aunque `PROYECTO.md` lo use: el documento se escribe en español. |
| Cita | El compromiso de que un cliente sea atendido por un proveedor, para un servicio, en un horario. Tiene un estado: **activa**, **cancelada**, **completada** o **no asistió**. |
| No asistió | El estado de una cita que llegó a su hora sin haber sido cancelada y a la que el cliente no se presentó. El cliente pierde esa cita: no se le repone ni se le devuelve nada. |
| Reservar | La acción de convertir un horario disponible en una cita activa. |
| Reagendar | Mover una cita activa a otro horario disponible. |
| Canal | Si una cita la creó el propio cliente desde la aplicación (**en línea**) o la creó Personal en nombre de quien llamó por teléfono (**asistida**). |
| Feriado | Un día feriado de ley de Costa Rica. No tiene ningún horario disponible. |
| Ventana de cancelación | Las 4 horas previas al inicio de una cita. Dentro de esa ventana el cliente ya no puede cancelarla ni reagendarla por su cuenta. |
| Recordatorio de 24 horas | El correo que el sistema envía 24 horas antes de una cita activa. |
| Contraseña temporal | La contraseña provisional con la que Personal crea la cuenta de un cliente que llamó. El cliente está obligado a cambiarla la primera vez que entra. |

## Objetivos

- Que el cliente reserve su cita solo, a cualquier hora del día y cualquier día, sin esperar a
  que alguien le conteste.
- Que reciba confirmación inmediata de su cita y un recordatorio 24 horas antes.
- Que pueda cancelar o reagendar por su cuenta hasta 4 horas antes de la cita.
- Que el sistema calcule por sí solo qué horarios están disponibles, aplicando el horario del
  negocio, el almuerzo, los feriados y las citas ya reservadas.
- Que las citas que entran por teléfono queden registradas en el mismo calendario que las de la
  aplicación, para que el negocio tenga una sola fuente de verdad.
- Registrar lo necesario para poder comparar después cuántas citas entran en línea y cuántas por
  teléfono.

## Fuera de alcance

- **Citas para el mismo día.** El cliente que las necesita llama al negocio.
- **Reservar sin cuenta (modo invitado).** Se consideró en esta sesión de especificación y se
  descartó: toda reserva exige una cuenta de cliente (RN-9). La razón es que sin cuenta el cliente
  no puede volver a entrar a cancelar ni reagendar, que es justo lo que el sistema busca darle.
- **Panel de administración con interfaz.** Servicios, proveedores, horarios, feriados, logo y
  colores se cargan como configuración; no hay pantallas para editarlos.
- **Vistas de calendario por día o por semana.** Solo vista mensual con navegación entre meses.
- **Lista de espera automatizada.**
- **Duraciones de cita distintas por servicio.** Todas duran una hora.
- **Política de cancelación configurable por negocio.** Fija en 4 horas.
- **Pagos, cobros y paquetes de sesiones.** El sistema no registra dinero.
- **Expediente clínico del cliente** (padecimientos, medicamentos, tratamientos). Ver PA-1.
- **Varias sucursales.** Un solo negocio, una sola ubicación.
- **El reporte semestral de citas en línea contra teléfono.** El dato que lo alimenta sí queda
  registrado (REG-1, campo canal), pero el reporte en sí queda en la hoja de ruta de `NEGOCIO.md`.

## Reglas del negocio

1. **RN-1:** Un horario solo puede tener una cita activa a la vez para un mismo proveedor. Si dos
   clientes intentan reservarlo al mismo tiempo, solo uno lo logra.
2. **RN-2:** Los feriados de ley de Costa Rica no tienen ningún horario disponible.
3. **RN-3:** El negocio atiende de lunes a viernes de 9:00 a 18:00, con el almuerzo bloqueado de
   12:00 a 13:00, y los sábados de 9:00 a 13:00. Los domingos no atiende. Como cada cita dura una
   hora, la última cita de un día entre semana inicia a las 17:00 y la del sábado a las 12:00.
   Esto da 8 horarios por día entre semana y 4 el sábado: **44 horarios por semana por proveedor**,
   que es de dónde sale la capacidad declarada en `PROYECTO.md`.
4. **RN-4:** Solo se puede reservar a partir del día siguiente. No existen las citas para hoy.
5. **RN-5:** El cliente no puede cancelar ni reagendar una cita dentro de la ventana de
   cancelación (menos de 4 horas antes). El sistema se lo informa y le pide llamar al negocio.
6. **RN-6:** Personal **sí** puede cancelar y reagendar dentro de la ventana de cancelación. La
   restricción de RN-5 es solo para el cliente actuando por su cuenta. *(Decidido en la sesión de
   especificación. Sin esta regla, el mensaje "llame al negocio" de RN-5 no resolvería nada: la
   asistente atendería la llamada y descubriría que ella tampoco puede hacerlo, y esa cancelación
   de último momento quedaría sin registrar — que es exactamente la segunda fuente de verdad que
   `NEGOCIO.md` dice haber eliminado.)*
7. **RN-7:** Cancelar una cita libera su horario de inmediato, y ese horario vuelve a quedar
   disponible para cualquier otro cliente.
8. **RN-8:** Cuando un servicio tiene más de un proveedor, el cliente elige a cuál quiere.
9. **RN-9:** Para reservar hay que tener cuenta. No existe la reserva como invitado.
10. **RN-10:** El cliente se registra solo, con su correo y una contraseña que él elige. La cuenta
    de Personal viene precargada y no se autorregistra.
11. **RN-11:** Cuando un cliente llama y no tiene cuenta, se le ofrecen dos caminos y él elige:
    registrarse él mismo en la aplicación, o que Personal le cree la cuenta en ese momento con una
    contraseña temporal. En el segundo caso el cliente está obligado a cambiar esa contraseña la
    primera vez que entra, de modo que Personal deja de conocerla. *(Decidido en la sesión de
    especificación.)*
12. **RN-12:** Toda cita queda registrada con su canal: en línea o asistida.
13. **RN-13:** Al crear una cita, Personal cumple exactamente las mismas reglas que el cliente
    (RN-1 a RN-4): tampoco puede reservar un horario ocupado, ni un feriado, ni fuera del horario
    del negocio, ni para el mismo día. La única regla que no lo alcanza es RN-5, según RN-6.
14. **RN-14:** Si al entrar el cliente no encuentra ningún horario disponible en los próximos 7
    días, el sistema se lo avisa y le sugiere volver a revisar más adelante, por si se libera
    alguno.
15. **RN-15:** Nada se borra. Las citas viejas, las canceladas y el registro de correos enviados
    se conservan indefinidamente. *(Decidido en la sesión de especificación: al volumen del
    negocio —44 citas por semana, unas 2.300 al año— conservar todo no representa ningún problema,
    y el expediente del cliente que está en la hoja de ruta necesita historial largo.)*
16. **RN-16:** Un cliente puede tener **varias citas activas al mismo tiempo**, sin límite. Cada
    una tiene que cumplir RN-1 por separado, pero el sistema no le impone un máximo ni le exige
    terminar una antes de reservar la siguiente. *(Decidido en la sesión de planificación; antes
    era la pregunta abierta PA-3.)*
17. **RN-17:** Una cita pasa al estado **completada** solo cuando Personal la marca así, después
    de que el cliente asistió. No se marca sola al pasar la hora, y el cliente no puede marcarla.
    *(Decidido en la sesión de planificación; antes era la pregunta abierta PA-4.)*
19. **RN-19:** Si el cliente no cancela y no se presenta, **pierde la cita**: no se le repone ni se
    le devuelve nada. Personal la marca como **no asistió**, igual que marca las completadas.
    *(Decidido en la sesión de planificación, como consecuencia de RN-17. El estado tiene que
    existir para que quede constancia de por qué se perdió: una cita que se quedara "activa" para
    siempre no dejaría rastro de lo ocurrido. Hoy, si esa cita era parte de un paquete de sesiones,
    el descuento de la sesión perdida lo lleva el negocio a mano, porque el sistema no registra
    paquetes — ver PA-2.)*
20. **RN-20:** El recordatorio se envía **24 horas antes** de la cita. Una cita reservada con menos
    de 24 horas de anticipación **no recibe recordatorio**: el momento de enviarlo ya pasó, y no se
    manda uno tardío en su lugar. *(Decidido en la sesión de planificación; antes era la pregunta
    abierta PA-6. El plazo bajó de 48 a 24 horas en esa misma sesión, y la razón es RN-4: como solo
    se puede reservar a partir del día siguiente, buena parte de las citas se reservan con menos de
    48 horas de anticipación y se habrían quedado todas sin recordatorio. Con 24 horas, la mayoría
    sí lo recibe. Las que igual quedan afuera —reservar hoy en la noche para mañana temprano— se
    apoyan en el correo de confirmación, que a esa distancia cumple la misma función de aviso.)*
18. **RN-18:** Reagendar cambia **únicamente la fecha y la hora**. El servicio y el proveedor se
    mantienen: quien quiera cambiarlos cancela la cita y reserva de nuevo. *(Decidido en la sesión
    de planificación; antes era la pregunta abierta PA-5. La razón es de uso, no técnica:
    "reagendar" significa para el cliente "lo mismo, otro día", y meter el cambio de servicio y de
    proveedor en el mismo botón lo convierte en la pantalla de reservar otra vez, con el riesgo de
    que alguien cambie de proveedor sin darse cuenta. Cuando el proveedor no tenga ningún horario
    libre en los próximos 7 días, el cliente recibe el aviso de RN-14 y decide si cancela y
    reserva con otro.)*

## Qué queda registrado

1. **REG-1:** De cada cita: el cliente, el servicio, el proveedor, la fecha y hora de inicio, su
   estado (activa, cancelada, completada o no asistió), la fecha en que se creó, su **canal** (en línea o
   asistida) y, si fue asistida, qué cuenta de Personal la creó. Y si fue cancelada: **cuándo se
   canceló y quién la canceló** —el propio cliente, o Personal— porque solo Personal puede hacerlo
   dentro de la ventana de cancelación (RN-6) y el negocio necesita poder distinguir esos casos.
   Y si fue completada o no asistió: **qué cuenta de Personal la marcó y cuándo** (RN-17, RN-19).
2. **REG-2:** De cada cliente: nombre, correo, su contraseña cifrada, y si tiene una contraseña
   temporal pendiente de cambiar (RN-11).
3. **REG-3:** De cada correo que el sistema envía: a quién, de qué cita (no aplica a los correos de
   contraseña), de qué tipo, cuándo se envió y si el envío tuvo éxito.
4. **REG-4:** El catálogo del negocio: qué servicios existen, qué proveedores atiende cada uno, y
   la configuración del negocio (horario semanal, feriados, ubicación, logo, colores).
5. **REG-5:** Con lo anterior se puede contestar: cuántas citas entraron en línea y cuántas por
   teléfono, qué tan ocupada está la agenda por día y por horario, cuántas cancelaciones hubo y
   con cuánta anticipación, qué servicios y qué proveedores se piden más, y si los correos
   llegaron o fallaron.

## Salidas que consume alguien más

| Quién | Qué recibe | Formato | Frecuencia |
|---|---|---|---|
| Cliente | Confirmación con fecha, hora, servicio, proveedor y ubicación del negocio | Correo electrónico | Al momento de reservar |
| Cliente | Recordatorio, con enlace para cancelar o reagendar desde la aplicación | Correo electrónico | 24 horas antes de la cita |
| Cliente o Personal | Enlace para restablecer la contraseña | Correo electrónico | Cuando lo pide |

## Recorridos

### Reserva en línea (termina bien)

1. El cliente entra a la aplicación con su correo y contraseña.
2. Escoge el tipo de servicio que quiere.
3. Si ese servicio tiene más de un proveedor, elige a quién quiere que lo atienda.
4. Ve el calendario del mes con los horarios disponibles marcados y los no disponibles
   bloqueados. Puede navegar mes a mes. Solo aparecen horarios a partir del día siguiente.
5. Escoge un horario y confirma la reserva.
6. Recibe de inmediato un correo con la fecha, hora, servicio, proveedor y ubicación del negocio.
7. 24 horas antes de la cita recibe un correo recordatorio con un enlace para cancelar o
   reagendar desde la aplicación.

### Reserva asistida por teléfono (termina bien)

1. El cliente llama al negocio.
2. Personal entra a la aplicación con su cuenta.
3. Si el cliente ya tiene cuenta, Personal la busca. Si no la tiene, le ofrece los dos caminos de
   RN-11 y el cliente elige: registrarse él mismo, o que Personal le cree la cuenta con una
   contraseña temporal que él cambiará al entrar por primera vez.
4. Personal elige el servicio, el proveedor y el horario junto con el cliente, aplicando las
   mismas reglas que aplicarían en línea (RN-13).
5. La cita queda registrada con canal "asistida" y con la cuenta de Personal que la creó.
6. El cliente recibe el mismo correo de confirmación que recibiría si hubiera reservado él.

### Cancelación o reagendamiento por el cliente (termina bien)

1. El cliente entra a la aplicación y ve su cita activa.
2. Elige cancelarla o moverla a otro horario.
3. Faltan 4 horas o más para la cita, así que el sistema lo permite.
4. Si cancela, el horario queda libre de inmediato para cualquier otro cliente (RN-7). Si
   reagenda, ve el calendario del **mismo servicio y el mismo proveedor** (RN-18), elige otro
   horario, y se libera el viejo mientras se ocupa el nuevo.

### Primer ingreso con contraseña temporal

1. El cliente cuya cuenta creó Personal entra por primera vez con la contraseña temporal.
2. Antes de dejarlo hacer nada más, el sistema le exige definir su propia contraseña.
3. A partir de ahí Personal ya no conoce su contraseña.

### Después de la cita: Personal cierra el caso

1. Pasó la hora de una cita activa.
2. Personal la busca y la marca según lo que ocurrió: **completada** si el cliente asistió, o **no
   asistió** si no se presentó (RN-17, RN-19).
3. En los dos casos queda registrado qué cuenta lo marcó y cuándo.
4. Si el cliente no se presentó, pierde esa cita: no se le repone ni se le devuelve nada. Ninguna
   cita se borra (RN-15).

### Dos clientes eligen el mismo horario a la vez

En condiciones normales el calendario muestra qué está libre, así que el cliente solo puede elegir
un horario disponible. Este recorrido es la excepción: dos clientes confirman el mismo horario casi
en el mismo instante. Al que pierde la carrera se le informa que ese horario ya no está disponible
y se le muestra el calendario actualizado para que elija otro.

### Intento de reservar para hoy

El cliente busca una cita para el mismo día. El calendario simplemente no le ofrece horarios de hoy
(RN-4). Si de algún modo lo intenta, el sistema lo rechaza y le indica llamar al negocio.

### Intento de cancelar o reagendar dentro de la ventana

El cliente intenta cancelar o mover su cita faltando menos de 4 horas. El sistema lo rechaza y le
indica que llame al negocio. Cuando llama, Personal sí puede hacerlo desde la aplicación (RN-6), y
esa cancelación queda registrada como cualquier otra.

### No hay horarios en los próximos 7 días

El cliente entra y la agenda está llena. El sistema le avisa y le sugiere revisar más adelante
(RN-14).

### Falla el envío de un correo

El sistema reintenta. Si el envío sigue fallando, queda registrado como fallido (REG-3), pero **la
cita sigue siendo válida**: el correo es un aviso, no la cita en sí.

### Falla el disparador del recordatorio

El aviso periódico que le dice al sistema "revisá si hay recordatorios pendientes" no llega. Los
recordatorios de ese ciclo no se envían. Riesgo aceptado y declarado desde `FICHA-APROBACION.md`;
la cita y su confirmación no se ven afectadas.

### Login incorrecto

El sistema responde con un mensaje genérico —"correo o contraseña incorrectos"— sin aclarar cuál de
los dos falló, para no facilitar que alguien averigüe qué correos están registrados.

### Contraseña olvidada

El cliente pide restablecerla y recibe por correo un enlace de un solo uso con vencimiento. Aplica
igual a las cuentas de Personal.

## Requisitos funcionales

1. **RF-1:** El sistema permite que un cliente cree su propia cuenta con su nombre, su correo y una
   contraseña.
2. **RF-2:** El sistema permite entrar con correo y contraseña, y mantiene la sesión abierta un
   tiempo, para que el cliente no tenga que volver a entrar cada vez.
3. **RF-3:** El sistema permite restablecer la contraseña por correo, mediante un enlace de un solo
   uso que vence.
4. **RF-4:** El sistema obliga a cambiar la contraseña en el primer ingreso cuando la cuenta fue
   creada por Personal con una contraseña temporal (RN-11).
5. **RF-5:** El sistema muestra los servicios del negocio y, para el servicio elegido, los
   proveedores que lo atienden (RN-8).
6. **RF-6:** El sistema muestra un calendario mensual, navegable mes a mes, que distingue los
   horarios disponibles de los que no lo están, para el servicio y proveedor elegidos.
7. **RF-7:** El sistema calcula la disponibilidad de un horario aplicando el horario del negocio y
   el almuerzo (RN-3), los feriados (RN-2), la restricción de reservar solo a partir del día
   siguiente (RN-4) y las citas activas ya existentes de ese proveedor (RN-1).
8. **RF-8:** El sistema permite reservar un horario disponible, creando una cita activa.
9. **RF-9:** El sistema impide que dos citas activas ocupen el mismo horario del mismo proveedor, e
   informa a quien pierde la carrera (RN-1).
10. **RF-10:** El sistema avisa al cliente cuando no hay ningún horario disponible en los próximos
    7 días (RN-14).
11. **RF-11:** El sistema envía al cliente un correo de confirmación al reservar, con fecha, hora,
    servicio, proveedor y ubicación del negocio.
12. **RF-12:** El sistema envía al cliente un correo recordatorio 24 horas antes de su cita, con un
    enlace para cancelar o reagendar. Las citas reservadas con menos de 24 horas de anticipación no
    reciben ninguno (RN-20).
13. **RF-13:** El sistema permite al cliente cancelar su cita si faltan 4 horas o más, y libera el
    horario de inmediato (RN-5, RN-7).
14. **RF-14:** El sistema permite al cliente reagendar su cita a otro horario disponible del mismo
    servicio y el mismo proveedor si faltan 4 horas o más, liberando el horario anterior (RN-5,
    RN-7, RN-18).
15. **RF-15:** El sistema rechaza la cancelación y el reagendamiento del cliente dentro de la
    ventana de cancelación, con un mensaje que le indica llamar al negocio (RN-5).
16. **RF-16:** El sistema permite que Personal, con su cuenta, cree una cita en nombre de un
    cliente, cumpliendo las mismas reglas que el cliente (RN-13), y la registra con canal
    "asistida" y con la cuenta que la creó (RN-12).
17. **RF-17:** El sistema permite que Personal cree la cuenta de un cliente con una contraseña
    temporal (RN-11).
18. **RF-18:** El sistema permite que Personal cancele y reagende citas sin la restricción de la
    ventana de cancelación (RN-6).
19. **RF-19:** El sistema registra cada correo que envía, con su resultado, y no invalida la cita
    cuando un envío falla (REG-3).
20. **RF-20:** El sistema conserva las citas canceladas, completadas y no asistidas, y no borra
    nada (RN-15).
21. **RF-21:** El sistema permite que Personal, con su cuenta, marque una cita como **completada**
    o como **no asistió**, y registra en ambos casos qué cuenta lo hizo y cuándo (RN-17, RN-19).

## Requisitos no funcionales

1. **RNF-1: Disponibilidad — no se garantiza.** Si el sistema deja de funcionar un rato, el negocio
   lo absorbe: quien quería reservar vuelve más tarde o llama por teléfono, que es el canal que
   sigue existiendo. No se construye ningún mecanismo de alta disponibilidad, ni respaldo en
   caliente, ni alertas automáticas de caída. *(Decidido en la sesión de especificación.)*
2. **RNF-2: Volumen.** Un solo negocio, con 44 horarios por semana por proveedor (RN-3) — del orden
   de 2.300 citas al año. Los clientes simultáneos son pocos: es un negocio local, no un sistema
   masivo. Ningún requisito de rendimiento se deriva de estos números.
3. **RNF-3: Crecimiento de los datos.** Como nada se borra (RN-15), la información crece de forma
   sostenida pero lenta, en el orden de miles de registros por año. No hace falta ninguna política
   de archivado ni de purga.

## Criterios de aceptación

Solo para las tres reglas que `PROYECTO.md` (sección 7, punto 4) exige cubrir con pruebas
automáticas que corran en cada cambio.

| ID | Criterio | Requisito asociado |
|---|---|---|
| CA-1 | Dados dos intentos de reservar el mismo horario del mismo proveedor, exactamente uno crea una cita activa y el otro es rechazado. | RF-9 / RN-1 |
| CA-2 | Un intento de reservar un horario del día de hoy es rechazado, sin importar la hora a la que se intente. | RF-7 / RN-4 |
| CA-3 | Un intento del cliente de cancelar o reagendar faltando menos de 4 horas es rechazado; el mismo intento hecho por Personal es aceptado. | RF-15, RF-18 / RN-5, RN-6 |

## Dependencias

- **Un servicio externo de envío de correo.** Sin él no salen ni las confirmaciones, ni los
  recordatorios, ni los enlaces de contraseña. Declarado como frontera técnica en `PROYECTO.md`
  sección 6; qué servicio concreto se usa se decide en `DISENO.md`.
- **Un disparador externo periódico** que le avise al sistema que revise si hay recordatorios de 24
  horas pendientes de enviar. Cuál se usa se decide en `DISENO.md`.
- **La lista de feriados de ley de Costa Rica**, precargada como dato fijo (`PROYECTO.md` sección
  6).

## Preguntas abiertas

| # | Pregunta | Qué se hace mientras no se resuelva |
|---|---|---|
| PA-1 | El expediente del cliente: qué campos tiene exactamente (padecimientos, medicamentos, contraindicaciones, tratamientos en curso, consumo de paquetes de sesiones). Ya declarado en `NEGOCIO.md` y `SEGUIMIENTO.md`. | Queda fuera de alcance. El sistema solo guarda de cada cliente lo de REG-2 y su historial de citas. |
| PA-2 | Cómo se registra que un cliente "tiene" un paquete de sesiones, dado que el sistema no maneja dinero. Bloquea a PA-1. | No se registra nada de paquetes ni de pagos. |

## Referencias

- `PROYECTO.md` — el enunciado del proyecto: recorrido principal (sección 3), reglas del negocio
  (sección 4), datos (sección 5), frontera técnica (sección 6) y supuestos declarados (sección 10).
- `DISENO.md` y `DISENO1.md` — arquitectura, modelo de datos y manejo de errores de los que se
  derivaron varios recorridos que terminan mal.
- `NEGOCIO.md` — la oportunidad, el riesgo de las dos fuentes de verdad y la hoja de ruta.
- `SEGUIMIENTO.md` — el estado del proyecto y los pendientes de diseño.
- `FICHA-APROBACION.md` — el riesgo técnico aceptado del disparador del recordatorio.
</content>
</invoke>
