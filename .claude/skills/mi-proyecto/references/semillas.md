# Los cinco casos semilla

Cada uno trae el caso y su escenario base. Los números del punto de partida ya están
dados: la medición no depende de que el estudiante consiga datos, sino de que su
razonamiento sea coherente con estos. Si tiene datos reales, los sustituye y lo dice.

**Qué trae resuelto una semilla y qué no.** Trae el qué es, el recorrido y las reglas
principales. **No trae** el contexto donde el estudiante lo sitúa, ni la resolución de
la decisión difícil, ni su capacidad, ni su frontera técnica. Eso se pregunta.

**El último renglón de cada escenario es un dato que falta a propósito.** Si el diseño
del estudiante depende de él, tiene que tomar una decisión y declararla como supuesto.

---

## 1 · El radar de la plata que se está por perder

**Hoy.** Los lunes, la persona de cobros descarga un reporte con las facturas
pendientes ordenadas por antigüedad y decide a quién llamar leyéndolo de arriba abajo.
Cuando una factura llega arriba de ese reporte ya lleva dos meses sin pagarse, y la
plata es mucho más difícil de recuperar.

**Qué construye.** Una pantalla que cada mañana muestra a lo sumo veinte clientes,
ordenados por cuánto dinero se pierde si nadie los llama hoy. Cada línea dice el monto
pendiente, los días que lleva, si es un cliente que siempre se atrasa o uno que nunca
lo había hecho, y cuánto se esperaría recuperar llamando ahora.

**Cuidado con el argumento económico.** El prototipo no hace que se llame a más
clientes: la persona de cobros tiene las mismas horas. Cambia a quién le tocan. La
comparación se sostiene en dos cosas: las horas que hoy se van en decidir, y la plata
que se mueve del tramo donde se recupera poco al tramo donde se recupera casi todo. Un
cálculo que suponga más llamadas no cierra.

**La decisión difícil.** Qué significa «riesgo». Un cliente que debe mucho y siempre
paga tarde puede ser menos urgente que uno que debe poco y nunca había fallado, porque
el segundo probablemente tiene un problema nuevo.

| | |
|---|---|
| Organización | Empresa de servicios con unos 600 clientes activos y facturación mensual |
| Volumen | Cartera por cobrar de ₡180 millones. Alrededor del 22 % pasa de los 30 días |
| Quién lo hace hoy | Una persona de crédito y cobro. Saca el reporte los lunes y llama según su criterio |
| Tiempo que consume | Unas 6 horas semanales en decidir a quién llamar, más 10 en llamar |
| Qué hay del pasado | 24 meses de pagos por cliente: se distingue a quien siempre paga tarde de quien se atrasó por primera vez |
| Qué está en juego | Llamando antes de los 30 días se cobra cerca del 85 % en el mes. Pasados los 60, baja a cerca del 40 % |
| Lo que no se sabe | Cuánto del atraso es disputa de facturación y no falta de liquidez |

---

## 2 · El expediente que perdió la licitación

**Hoy.** Para competir por un contrato público hay que entregar un paquete de
documentos: impuestos y cargas sociales al día, pólizas vigentes, representante legal
acreditado, requisitos técnicos. Cada concurso pide una combinación distinta y cada
documento vence en su propia fecha. Una persona arma el paquete a mano con una hoja de
cálculo, y si falta uno solo, la oferta se descarta sin que nadie la lea.

**Qué construye.** Un registro de los documentos de la empresa con su vencimiento, y
la definición de qué pide cada concurso. Al elegir un concurso, la pantalla dice si el
paquete está completo, qué falta, y —lo que hoy nadie ve— cuáles de los documentos que
sí están se van a vencer antes de la fecha de entrega. Más un aviso anticipado de lo
que está por caducar.

**La decisión difícil.** Cuánta libertad se le da a proveeduría para definir los
requisitos de cada concurso. En un extremo, una lista fija de documentos que se marcan
o se desmarcan: simple, y se queda corta el día que un cartel pide algo imprevisto. En
el otro, un lenguaje de reglas donde se puede expresar cualquier condición: potente, y
nadie sin formación técnica lo va a usar.

| | |
|---|---|
| Organización | Empresa que participa en tres o cuatro licitaciones públicas por mes |
| Volumen | Cada cartel exige entre 12 y 20 documentos: personerías, planillas al día, pólizas, certificaciones técnicas, estados financieros, declaraciones juradas |
| Quién lo hace hoy | Una persona de proveeduría, con una lista en hoja de cálculo que actualiza a mano para cada cartel |
| Tiempo que consume | Entre 6 y 10 horas por oferta, y se rehace desde cero cada vez |
| Qué hay del pasado | Vigencias dispares: algunos documentos duran 30 días, otros un año. Nadie lleva control |
| Qué está en juego | En 18 meses se cayeron dos ofertas por documentos vencidos o faltantes. Una era de ₡400 millones |
| Lo que no se sabe | Si un mismo concurso puede pedir un documento en dos versiones distintas —una póliza por monto y otra por plazo— o si cada requisito se satisface con un único documento |

---

## 3 · El torneo que se organiza solo

**Hoy.** Alguien organiza la liga de fútbol 5 del barrio, el campeonato de ajedrez o el
torneo de la oficina, y todo vive en un grupo de chat más una tabla que esa persona
lleva a mano. Los resultados llegan por mensaje, la tabla se actualiza cuando alguien
se acuerda, y cada empate arriba abre una discusión sobre quién va primero.

**Qué construye.** El sistema recibe los equipos y arma el calendario. Se cargan los
resultados y la tabla se recalcula sola. Cuando dos equipos quedan igualados aplica el
orden de desempate y —esto es lo que hoy nadie puede hacer— dice cuál criterio decidió.
Guarda las temporadas anteriores, y cada corrección de un resultado ya cargado queda
registrada con quién la hizo y qué posición movió.

**La decisión difícil.** El orden de desempate. Puntos, luego diferencia de goles,
luego el resultado entre esos dos equipos, luego juego limpio, hasta que se acaban los
criterios y siguen igualados: ahí hay que decidir si hay sorteo, si comparten el puesto
o si se juega un partido extra. Y hay un caso peor: tres equipos igualados donde el
primero le ganó al segundo, el segundo al tercero y el tercero al primero. Ese nudo no
se deshace con la regla simple.

| | |
|---|---|
| Organización | Liga recreativa de fútbol 5. Diez equipos, temporada de tres meses, una fecha por semana |
| Volumen | 45 partidos por temporada, dos temporadas al año |
| Quién lo hace hoy | Una persona, con un grupo de chat y una hoja de cálculo en el teléfono |
| Tiempo que consume | Unas 3 horas por semana entre recoger resultados, actualizar la tabla y atender reclamos |
| Qué está en juego | La liga se autofinancia: ₡60.000 de inscripción por equipo por temporada y la cancha a ₡18.000 la hora, así que un error de calendario se paga con cancha perdida. Pasa dos veces por temporada. Y algo que no se paga en plata: la temporada pasada dos equipos se retiraron por una discusión de tabla que nadie pudo zanjar mostrando el cálculo |
| Los reclamos | Cerca de un tercio de las semanas alguien reclama la tabla, y no hay forma de mostrarle el cálculo |
| Lo que no se sabe | Si los resultados los carga el organizador o cada equipo el suyo. Eso cambia todo el diseño de quién puede escribir qué |

---

## 4 · El costeo de la cocina

**Hoy.** Una soda, una repostería o el emprendimiento de alguien vende treinta cosas y
no sabe cuáles le dejan plata. Los precios se pusieron mirando los del local de al
lado. Cuando sube el queso nadie recalcula nada: se sigue vendiendo la lasaña al mismo
precio hasta que a fin de mes la cuenta no cierra y no se sabe por qué.

**Qué construye.** Cada plato tiene su receta, cada receta lista sus ingredientes con
cantidades, y algunas recetas usan otras recetas: la salsa entra en tres platos
distintos. El sistema calcula lo que cuesta de verdad cada plato, convirtiendo unidades
y sumando la merma, y saca el margen contra el precio de venta. La pantalla ordena el
menú del que más deja al que menos y marca los que están por debajo del margen
objetivo.

**La decisión difícil.** La merma. Un kilo de tomate no rinde un kilo de salsa: hay
cáscara, hay lo que se pasa y hay lo que se cae. Ese porcentaje se puede definir por
ingrediente, por receta o uno global, y cada opción da números distintos. Y hay una
pregunta más incómoda: cuando sube el costo del queso, ¿el sistema recalcula también
los platos que se vendieron el mes pasado, o solo los de hoy? De eso depende que los
históricos sirvan para algo.

| | |
|---|---|
| Organización | Soda con 32 platos en el menú y unas 120 comidas al día |
| Volumen | 85 ingredientes. Los precios de los proveedores cambian cada dos o tres semanas |
| Quién lo hace hoy | La dueña, de memoria y con una calculadora. Los precios de venta se fijaron hace año y medio |
| La estructura | Nueve recetas base entre salsas, adobos y masas, que entran en varios platos. Cambiar una afecta a todo lo que la usa |
| Tiempo que consume | Unas 4 horas cada vez que se decide revisar el menú, y por eso casi nunca se revisa |
| Qué está en juego | Venta promedio de ₡3.200 por comida, unos ₡11,5 millones al mes. El margen objetivo es del 35 %. Sospecha que tres o cuatro platos se venden con pérdida, y que son de los que más salen. El ahorro de este caso no está en las horas: está en el margen que hoy se pierde sin que nadie lo vea, y por ahí hay que argumentar la comparación |
| Lo que no se sabe | Si la mano de obra entra en el costo de cada plato o se trata aparte como gasto fijo |

---

## 5 · El refugio de animales

**Hoy.** Un refugio recibe animales, los atiende y los da en adopción. La información
vive en un cuaderno, en fotos en el teléfono de tres voluntarias distintas y en la
memoria de quien lleva más tiempo. Las vacunas se ponen cuando alguien se acuerda, y a
veces se descubre que un animal llevaba dos meses listo para adopción y nadie lo
publicó.

**Qué construye.** Una ficha por animal con su historia médica y las fechas que
importan. El tablero de la semana contesta tres cosas: a quién le toca vacuna o
desparasitación, quién ya cumple los requisitos para ser adoptado, y cuánto espacio
queda. Al entregar un animal, programa el seguimiento posterior y avisa cuando toca.

**La decisión difícil.** Qué significa «listo para adopción». Depende del esquema de
vacunas completo, de la edad mínima, de la esterilización y de la recuperación si venía
herido, y esas condiciones se cumplen en momentos distintos. Hay un caso que fuerza la
decisión: un cachorro sano al que le faltan dos refuerzos, ¿se puede entregar con el
compromiso de que el adoptante los complete, o no sale del refugio hasta tenerlos
puestos?

| | |
|---|---|
| Organización | Refugio con capacidad para 40 animales entre perros y gatos |
| Volumen | Entran unos 12 al mes y se adoptan otros tantos. Casi siempre está lleno, así que aceptar un ingreso depende de que alguien haya salido |
| Quién lo hace hoy | Seis voluntarias rotando sin turno fijo. La información no está en un solo lugar |
| Las fechas que importan | Vacunación en tres dosis con 21 días de intervalo, desparasitación cada tres meses, esterilización a partir de los seis meses de edad |
| Tiempo que consume | Unas 5 horas semanales reconstruyendo quién necesita qué, más las consultas entre voluntarias |
| Qué está en juego | Cada animal cuesta cerca de ₡4.500 al día entre comida y atención, y quien se queda una semana de más ocupa el espacio que otro necesitaba. El año pasado se perdieron dos adopciones porque no se encontró la ficha médica |
| Lo que no se sabe | Si el seguimiento posterior a la adopción es obligatorio o voluntario. Si es obligatorio, hay que modelar qué pasa cuando el adoptante no responde |
