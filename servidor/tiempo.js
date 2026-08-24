// Todo lo que tiene que ver con fechas y horas, en un solo lugar.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// POR QUÉ ESTE ARCHIVO EXISTE
//
// Las fechas son de donde salen casi todos los errores de un calendario. El problema de fondo es
// que «las 10 de la mañana» no significa nada por sí solo: son las 10 de la mañana **en algún
// lugar**. Si el servidor se levanta en una computadora configurada en España, «hoy» empieza ocho
// horas antes que en Costa Rica, y la regla «no hay citas para hoy» (RN-4) empezaría a dejar pasar
// o a bloquear días equivocados.
//
// La decisión del proyecto es que **la hora que vale es la del negocio, que está en Costa Rica**,
// y que esa hora está escrita acá adentro en vez de preguntársela a la máquina. Costa Rica está
// siempre seis horas atrás de la hora universal y **no cambia de hora en verano**, así que alcanza
// con restar seis: no hace falta ninguna librería de zonas horarias, que además sería una
// dependencia más de las que el `README.md` promete no tener.
//
// La razón completa está en `DISENO.md`, «Decisiones tomadas al construir la pieza 2».
// ─────────────────────────────────────────────────────────────────────────────────────────────

/** Cuántas horas atrás de la hora universal está Costa Rica. Nunca cambia. */
const HORAS_DE_DIFERENCIA = -6

/** Cómo se escribe esa diferencia al final de una fecha: `2026-09-02T10:00:00-06:00`. */
export const DESFASE_ESCRITO = "-06:00"

const MILISEGUNDOS_POR_HORA = 60 * 60 * 1000

/** La forma exacta de un momento de este proyecto: `2026-09-02T10:00:00-06:00`. */
const FORMA_DE_UN_MOMENTO = /^\d{4}-\d{2}-\d{2}T\d{2}:00:00-06:00$/

/**
 * Qué día es, en Costa Rica, en un momento dado. Devuelve la fecha escrita como `2026-09-01`.
 *
 * El truco es simple: se corre el reloj seis horas para atrás y después se lee la fecha en hora
 * universal. Lo que queda es la fecha del calendario de Costa Rica.
 */
export function fechaDeCostaRica(momento) {
  const corrido = new Date(momento.getTime() + HORAS_DE_DIFERENCIA * MILISEGUNDOS_POR_HORA)
  return corrido.toISOString().slice(0, 10)
}

/**
 * Qué día de la semana cae una fecha: 0 es domingo, 1 lunes, y así hasta 6 que es sábado. Son los
 * mismos números que guarda la columna `dia_semana` de la tabla `horario_negocio`.
 *
 * Se calcula a mediodía en hora universal a propósito: así, corra donde corra la aplicación,
 * ningún desfase de horas puede empujar la fecha al día anterior o al siguiente.
 */
export function diaDeLaSemana(fecha) {
  return new Date(`${fecha}T12:00:00Z`).getUTCDay()
}

/** La fecha que cae tantos días después (o antes, con un número negativo) de la que se pasa. */
export function sumarDias(fecha, cuantos) {
  const dia = new Date(`${fecha}T12:00:00Z`)
  dia.setUTCDate(dia.getUTCDate() + cuantos)
  return dia.toISOString().slice(0, 10)
}

/**
 * Todos los días de un mes, escritos como `2026-09-01`, `2026-09-02`… El mes se pasa como
 * `2026-09`.
 *
 * No hay ninguna tabla de «cuántos días tiene cada mes» ni ninguna cuenta de años bisiestos: se
 * arranca el día 1 y se avanza de a un día mientras la fecha siga perteneciendo al mismo mes. El
 * calendario del propio JavaScript se encarga de saber que febrero de 2028 tiene 29.
 */
export function diasDelMes(mes) {
  const dias = []
  let fecha = `${mes}-01`

  while (fecha.startsWith(mes)) {
    dias.push(fecha)
    fecha = sumarDias(fecha, 1)
  }

  return dias
}

/**
 * Cómo se escribe el inicio de un horario: la fecha, la hora en punto, y el desfase de Costa Rica
 * al final. Por ejemplo, las 9 de la mañana del 2 de setiembre son `2026-09-02T09:00:00-06:00`.
 *
 * Es el mismo texto que viaja al navegador, que el navegador devuelve al reservar, y que queda
 * guardado en la columna `inicio` de la tabla `cita`: un solo formato en todo el proyecto.
 */
export function escribirInicio(fecha, hora) {
  const horaConDosCifras = String(hora).padStart(2, "0")
  return `${fecha}T${horaConDosCifras}:00:00${DESFASE_ESCRITO}`
}

/**
 * Un momento cualquiera escrito en la hora del negocio, con segundos:
 * `2026-09-01T08:37:22-06:00`.
 *
 * Es distinto de `escribirInicio`, y la diferencia importa. `escribirInicio` escribe el **comienzo
 * de una cita**, que siempre es una hora en punto. Esto escribe **un instante**, que puede ser
 * cualquiera: se usa para la columna `creada_en` de la tabla `cita`, que guarda a qué hora exacta
 * alguien reservó. Redondear eso a la hora en punto sería tirar el dato que se quería guardar.
 */
export function escribirMomento(momento) {
  const corrido = new Date(momento.getTime() + HORAS_DE_DIFERENCIA * MILISEGUNDOS_POR_HORA)
  return `${corrido.toISOString().slice(0, 19)}${DESFASE_ESCRITO}`
}

/** ¿La fecha `a` viene antes o es la misma que `b`? Como las dos se escriben `2026-09-01`, con el
 *  año primero y todo con dos cifras, compararlas como texto ya las ordena bien. */
export function esAnteriorOIgual(a, b) {
  return a <= b
}

/**
 * Cuántas horas faltan para un momento del proyecto, contando desde `ahora`. Devuelve un número con
 * decimales: 3.98 son tres horas y 59 minutos. **Negativo si el momento ya pasó.**
 *
 * Existe desde la pieza 5, porque la ventana de cancelación (RN-5) es la primera regla del proyecto
 * que mide una **distancia** entre dos momentos en vez de comparar dos fechas.
 *
 * Es el único lugar de todo el proyecto donde un momento se convierte con `new Date()`, y acá es
 * seguro justamente por la regla de formato del proyecto: el texto trae su desfase escrito al final
 * (`-06:00`), así que no hay nada que adivinar — `new Date` no puede interpretarlo como si fuera la
 * hora de otro lugar. Es lo contrario de lo que pasaría con un `2026-09-02T10:00:00` a secas, que
 * cada máquina leería en su propia hora.
 *
 * **No se redondea a horas enteras**, y eso importa: la regla dice «4 horas o más», y redondear
 * dejaría cancelar una cita a la que le faltan 3 horas y 40 minutos.
 */
export function horasHasta(momentoDelProyecto, ahora) {
  const cuando = new Date(momentoDelProyecto).getTime()
  return (cuando - ahora.getTime()) / MILISEGUNDOS_POR_HORA
}

/**
 * ¿Este momento **todavía no llegó**? Es la cuenta que necesita RN-25: Personal puede agendar una
 * cita para hoy, en cualquier horario que no haya empezado.
 *
 * Está escrita acá y no en `disponibilidad.js` por la convención del proyecto: **todo lo que tenga
 * que ver con fechas se escribe en este archivo**. Y no vuelve a convertir nada con `new Date()`: le
 * pregunta a `horasHasta`, que sigue siendo el único lugar donde eso pasa.
 *
 * **El borde es estricto: un momento que empieza en este mismo instante ya empezó**, así que
 * devuelve `false`. Es `> 0` y no `>= 0`, y la razón es la misma por la que la ventana de 4 horas usa
 * `<` en vez de `<=`: el borde se decide una vez, se escribe, y no se deja al azar de quién lea el
 * código después. Un horario que arranca justo ahora no es un cupo que se pueda ofrecer.
 */
export function todaviaNoEmpezo(momentoDelProyecto, ahora) {
  return horasHasta(momentoDelProyecto, ahora) > 0
}

/**
 * Los nombres de los días y de los meses, para escribir una fecha en palabras.
 *
 * Sí, la misma lista existe también en `publico/aplicacion-cliente.js`, y eso es a propósito: ese
 * archivo corre **en el navegador**, que no puede leer nada de la carpeta `servidor/`. No es una
 * regla de negocio duplicada —son dos listas de palabras—, y la alternativa sería mandar los
 * nombres por el API, que es mucho ruido para lo que resuelve. Si un día cambia una, cambian las
 * dos.
 *
 * «Setiembre» va sin «p», que es como se escribe en Costa Rica.
 */
const DIAS_DE_LA_SEMANA = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
]

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "setiembre",
  "octubre",
  "noviembre",
  "diciembre",
]

/**
 * Una fecha escrita en palabras: `2026-09-02` se convierte en «miércoles 2 de setiembre de 2026».
 *
 * Existe desde la pieza 4, para el correo de confirmación. Un correo que dijera «2026-09-02» le
 * haría contar meses a quien lo lee; en palabras se entiende de un vistazo, que es justo lo que un
 * aviso tiene que lograr.
 */
export function escribirFechaEnPalabras(fecha) {
  const diaSemana = DIAS_DE_LA_SEMANA[diaDeLaSemana(fecha)]
  const numero = Number(fecha.slice(8, 10))
  const mes = MESES[Number(fecha.slice(5, 7)) - 1]
  const anio = fecha.slice(0, 4)

  return `${diaSemana} ${numero} de ${mes} de ${anio}`
}

/**
 * La hora de un momento del proyecto, sin la fecha: de `2026-09-02T10:00:00-06:00` saca `10:00`.
 *
 * No hace ninguna cuenta a propósito: **recorta**. El momento ya viene escrito en la hora del
 * negocio —ese `-06:00` del final lo dice—, así que convertirlo a algo para volver a leer la hora
 * sería inventar una oportunidad de equivocarse en una hora, que es de donde salen los errores que
 * este archivo existe para evitar.
 */
export function escribirHoraDelMomento(inicio) {
  return inicio.slice(11, 16)
}

/** La fecha de un momento del proyecto: de `2026-09-02T10:00:00-06:00` saca `2026-09-02`. */
export function fechaDelMomento(inicio) {
  return inicio.slice(0, 10)
}

/** Comprueba que un mes esté escrito como `2026-09`, con un mes de verdad entre 01 y 12. */
export function mesEstaBienEscrito(mes) {
  return typeof mes === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(mes)
}

/**
 * Comprueba que un momento esté escrito **exactamente** como los escribe este proyecto:
 * `2026-09-02T10:00:00-06:00`. Existe desde la pieza 3, porque reservar es lo primero que recibe un
 * momento **de afuera** en vez de fabricarlo adentro.
 *
 * Es a propósito estricto en tres cosas, y cada una evita un error concreto:
 *
 *   - **La hora tiene que ser en punto** (`:00:00`). Todas las citas duran una hora y empiezan en
 *     punto, así que un `10:30` no es un horario del negocio escrito raro: es un horario que no
 *     existe.
 *   - **El desfase tiene que ser el de Costa Rica** (`-06:00`). Aceptar `Z` o `-05:00` obligaría a
 *     convertir, y cada conversión es una oportunidad de equivocarse en una hora.
 *   - **Nada se interpreta.** Lo que no calce se rechaza, en vez de dejar que `new Date()` adivine.
 *     Ahí es donde nacen los errores de fechas que `PROYECTO.md` §7.6 pide vigilar.
 */
export function inicioEstaBienEscrito(inicio) {
  if (typeof inicio !== "string") return false
  if (!FORMA_DE_UN_MOMENTO.test(inicio)) return false

  // La forma es la correcta, pero «2026-02-31» o «2026-13-05» también la tienen. Volver a escribir
  // el momento a partir de su fecha y su hora es la manera de comprobar que la fecha existe: si
  // vuelve distinto, el día o el mes no eran de verdad.
  const fecha = inicio.slice(0, 10)
  const hora = Number(inicio.slice(11, 13))
  if (hora > 23) return false

  const comoLoEscribeElProyecto = escribirInicio(fechaDeCalendario(fecha), hora)
  return comoLoEscribeElProyecto === inicio
}

/** Comprueba que una fecha esté escrita como `1990-03-15` y que ese día exista de verdad. */
export function fechaEstaBienEscrita(fecha) {
  if (typeof fecha !== "string") return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false

  // `2026-02-31` tiene la forma correcta y no existe. Escribirla de vuelta desde el calendario de
  // JavaScript la delata: vuelve como `2026-03-03`, o sea distinta de la que entró.
  return fechaDeCalendario(fecha) === fecha
}

/**
 * Cuántos años tiene hoy quien nació en esa fecha, **en la hora del negocio**.
 *
 * La edad no se guarda en ninguna parte: se calcula cada vez que se pregunta (decisión de la pieza
 * 10). Un número guardado quedaría viejo en el próximo cumpleaños y nadie lo iría a corregir.
 *
 * El caso borde es el cumpleaños: restar los años a secas le daría 36 a alguien que nació en octubre
 * de 1990 cuando estamos en setiembre de 2026, y todavía tiene 35. Por eso, si el día y el mes de
 * este año todavía no llegaron, se resta uno. La comparación es de texto —`"09-01" < "10-15"`— y
 * funciona porque el mes va primero y todo lleva dos cifras.
 */
export function edadEnAnios(fechaNacimiento, ahora) {
  const hoy = fechaDeCostaRica(ahora)

  const anios = Number(hoy.slice(0, 4)) - Number(fechaNacimiento.slice(0, 4))
  const cumpleTodaviaNoLlego = hoy.slice(5) < fechaNacimiento.slice(5)

  return cumpleTodaviaNoLlego ? anios - 1 : anios
}

/**
 * La fecha que de verdad representa un texto como `2026-02-31`: el calendario de JavaScript la
 * corre al 3 de marzo. Sirve para descubrir que la fecha original no existía.
 */
function fechaDeCalendario(fecha) {
  const dia = new Date(`${fecha}T12:00:00Z`)
  if (Number.isNaN(dia.getTime())) return ""
  return dia.toISOString().slice(0, 10)
}
