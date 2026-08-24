// El cálculo de disponibilidad: qué horarios se pueden tomar y cuáles no.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// Es la parte más delicada del proyecto. `PROYECTO.md` §7.6 lo dice con todas las letras: hay que
// vigilar que la lógica de calendario no *parezca* correcta y falle en los casos borde —feriados,
// almuerzo, cambio de mes—. Por eso este archivo está escrito con una sola regla adentro, en un
// solo lugar, y todas las piezas siguientes la consultan acá en vez de volver a escribirla.
//
// LA REGLA (RF-7). Un horario está libre si se cumplen las cinco cosas a la vez:
//
//   1. cae dentro del horario de atención del negocio  (RN-3)
//   2. no cae en el almuerzo                            (RN-3 — sale solo, ver abajo)
//   3. no es feriado                                    (RN-2)
//   4. **está en el tiempo de quien pregunta**          (RN-4 y RN-25 — ver abajo)
//   5. ese proveedor no tiene ya una cita activa ahí    (RN-1)
//
// LA NÚMERO 4 ES LA ÚNICA QUE DEPENDE DE QUIÉN PREGUNTA, y eso lo trajo RN-25 el 2026-08-21:
//
//   - **el cliente** solo ve de mañana en adelante. Para él, hoy no existe (RN-4), y eso es **CA-2**,
//     uno de los tres criterios de aceptación que el curso exige proteger.
//   - **Personal** ve además el día de hoy, en los horarios que **todavía no empezaron** (RN-25).
//     No tiene ninguna ventana de anticipación: a las 16:30 puede tomar las 17:00.
//
// Las otras cuatro alcanzan a los dos por igual (RN-13). Que la diferencia esté **en un solo lugar de
// este archivo** —la función `estaEnSuTiempo`— es lo que impide que el calendario ofrezca un horario
// que la reserva después rechace: las dos preguntas salen de acá.
//
// La número 2 no está escrita en ninguna parte de este archivo, y es a propósito: el horario del
// negocio se guarda como **tramos de atención**, y entre semana son dos —9 a 12 y 13 a 18—. El
// almuerzo es el hueco entre los dos tramos. Si fuera un dato aparte que hay que acordarse de
// restar, sería un lugar más donde equivocarse.
// ─────────────────────────────────────────────────────────────────────────────────────────────

import { QUIEN_CLIENTE, QUIEN_PERSONAL } from "./quien-actua.js"
import {
  diaDeLaSemana,
  diasDelMes,
  escribirInicio,
  esAnteriorOIgual,
  fechaDeCostaRica,
  sumarDias,
  todaviaNoEmpezo,
} from "./tiempo.js"

/** Cuántos días adelante mira RN-14 para avisar que no queda nada libre. */
const DIAS_QUE_MIRA_EL_AVISO = 7

/**
 * El calendario de un mes, para un servicio y un proveedor.
 *
 * `ahora` llega como dato en vez de averiguarse acá adentro. Eso es lo que permite que las pruebas
 * paren el reloj en un miércoles, en un sábado o en un feriado concreto y comprueben siempre lo
 * mismo, sin depender del día en que alguien las corra.
 *
 * `quien` llega desde RN-25: **el mismo mes se ve distinto según quién pregunte**. Para el cliente el
 * día de hoy no ofrece nada; para Personal ofrece los horarios que todavía no empezaron. Lo decide
 * este archivo y no la pantalla, porque el frontend no decide reglas de negocio — y porque si la
 * pantalla lo calculara con el reloj de la computadora de quien mira, una máquina con la hora mal
 * puesta ofrecería horarios que el servidor va a rechazar.
 */
export function calcularDisponibilidad({ base, proveedorId, mes, ahora, quien = QUIEN_CLIENTE }) {
  const hoy = fechaDeCostaRica(ahora)

  // Todo lo que hace falta se lee UNA vez y se usa para los treinta y pico de días. Leerlo día por
  // día haría treinta veces el mismo trabajo.
  const agenda = leerAgenda(base, proveedorId)

  const dias = diasDelMes(mes).map((fecha) => armarDia({ fecha, hoy, agenda, quien, ahora }))

  return {
    mes,
    dias,
    hayHorariosEnProximos7Dias: hayAlgoLibrePronto({ hoy, agenda, ahora }),
  }
}

/**
 * ¿Se puede tomar **este** horario? La misma regla de arriba, preguntada por un solo momento en vez
 * de por un mes entero. Existe desde la pieza 3: antes de crear una cita hay que preguntar acá.
 *
 * Está escrita en este archivo, y no en `reservas.js`, por la regla de `CLAUDE.md`: **una regla de
 * negocio se escribe en un solo lugar**. Y no repite el cálculo: usa las mismas dos funciones que
 * arma el calendario, así que si mañana cambia el horario del negocio, la pantalla y la reserva
 * cambian juntas. Si estuviera copiada, un día una diría «libre» y la otra «ocupado».
 *
 * Devuelve **por qué**, no solo sí o no, porque quien pregunta tiene que dar mensajes distintos, y
 * desde RN-25 los mensajes son distintos **también según quién pregunte**:
 *
 *   - `"disponible"`      → se puede tomar
 *   - `"hoy_o_pasado"`    → es de hoy o de un día que ya pasó, **y quien pide es un cliente** (RN-4).
 *     Es lo que el endpoint traduce a `mismo_dia`, y lo que comprueba **CA-2**.
 *   - `"ya_empezo"`       → ese horario ya arrancó, **y quien pide es Personal** (RN-25). Es un
 *     rechazo distinto porque el mensaje tiene que ser distinto: a Personal no se le puede decir
 *     «llamá al negocio», y su problema no es que sea hoy sino que esa hora ya pasó.
 *   - `"no_disponible"`   → feriado, domingo, almuerzo, fuera de horario, o ya está tomado. Alcanza
 *     a los dos por igual (RN-13).
 */
export function revisarHorario({ base, proveedorId, inicio, ahora, quien = QUIEN_CLIENTE }) {
  const hoy = fechaDeCostaRica(ahora)
  const fecha = inicio.slice(0, 10)

  // La regla del tiempo se mira primero, y **es la única que distingue a los dos**. Para el cliente
  // se mira por **día**, no por hora: no importa que falten horas para las 5 de la tarde de hoy, hoy
  // no se reserva — es literalmente lo que pide CA-2, «sin importar la hora a la que se intente».
  // Para Personal se mira por **momento**: cualquier horario que todavía no haya empezado (RN-25).
  if (!estaEnSuTiempo({ inicio, fecha, hoy, quien, ahora })) {
    return quien === QUIEN_PERSONAL ? "ya_empezo" : "hoy_o_pasado"
  }

  const dia = armarDia({ fecha, hoy, agenda: leerAgenda(base, proveedorId), quien, ahora })
  const horario = dia.horarios.find((uno) => uno.inicio === inicio)

  // Si el horario no está entre los del día, es porque ese día no lo ofrece: un domingo no ofrece
  // ninguno, el almuerzo no es un horario, y las 3 de la mañana tampoco.
  if (!horario) return "no_disponible"

  return horario.disponible ? "disponible" : "no_disponible"
}

/** Lo que el calendario necesita saber del negocio y de este proveedor, leído de una sola vez. */
function leerAgenda(base, proveedorId) {
  const tramos = base
    .prepare("SELECT dia_semana, hora_inicio, hora_fin FROM horario_negocio ORDER BY hora_inicio")
    .all()

  const feriados = new Map(
    base.prepare("SELECT fecha, nombre FROM feriado").all().map((uno) => [uno.fecha, uno.nombre]),
  )

  // Solo las citas **activas** ocupan. Una cancelada libera su horario de inmediato (RN-7), y una
  // completada o «no asistió» ya pasó. Se guardan en un conjunto de textos, y como el inicio se
  // escribe siempre igual (`2026-09-02T10:00:00-06:00`), preguntar si un horario está tomado es
  // preguntar si ese texto está en el conjunto.
  const ocupados = new Set(
    base
      .prepare("SELECT inicio FROM cita WHERE proveedor_id = ? AND estado = 'activa'")
      .all(proveedorId)
      .map((cita) => cita.inicio),
  )

  return { tramos, feriados, ocupados }
}

/** Cómo queda un día del calendario: sus horarios, si es feriado, y por qué no ofrece nada. */
function armarDia({ fecha, hoy, agenda, quien = QUIEN_CLIENTE, ahora }) {
  const nombreFeriado = agenda.feriados.get(fecha) ?? null
  const esFeriado = nombreFeriado !== null

  const horarios = horasDeAtencion(agenda.tramos, fecha).map((hora) => {
    const inicio = escribirInicio(fecha, hora)
    return {
      inicio,
      disponible:
        !esFeriado &&
        estaEnSuTiempo({ inicio, fecha, hoy, quien, ahora }) &&
        !agenda.ocupados.has(inicio),
    }
  })

  // **«Fuera de tiempo» ya no es una propiedad del día, es del día *para quien pregunta*.** Antes se
  // calculaba como «esta fecha es hoy o anterior», y eso servía porque valía igual para todos los
  // horarios del día. Desde RN-25 el día de hoy puede tener unos horarios dentro de tiempo y otros
  // fuera, así que se pregunta al revés: el día está fuera de tiempo cuando **ninguno** de sus
  // horarios lo está. Para un cliente eso da exactamente lo mismo que antes.
  const fueraDeTiempo = !horarios.some((horario) =>
    estaEnSuTiempo({ inicio: horario.inicio, fecha, hoy, quien, ahora }),
  )

  return {
    fecha,
    esFeriado,
    nombreFeriado,
    estado: estadoDelDia({ horarios, esFeriado, fueraDeTiempo }),
    horarios,
  }
}

/**
 * **La única regla que distingue al cliente de Personal en este archivo** (RN-4 y RN-25).
 *
 *   - Un **cliente** solo alcanza de mañana en adelante. Hoy no existe para él, a ninguna hora: eso
 *     es RN-4, y comprobarlo «sin importar la hora a la que se intente» es literalmente **CA-2**.
 *   - **Personal** alcanza cualquier horario que **todavía no haya empezado**, incluidos los de hoy
 *     (RN-25). Sin ventana de anticipación de ningún tipo: a las 16:30 puede tomar las 17:00.
 *
 * Está escrita **una sola vez** y la usan las dos preguntas de este archivo —el calendario del mes y
 * la revisión de un horario suelto—. Eso es lo que garantiza que el calendario nunca ofrezca un
 * horario que la reserva después rechace, que es el defecto más caro que este archivo puede tener.
 *
 * La cuenta de «todavía no empezó» vive en `servidor/tiempo.js`, como todas las de fechas.
 */
function estaEnSuTiempo({ inicio, fecha, hoy, quien, ahora }) {
  if (quien === QUIEN_PERSONAL) return todaviaNoEmpezo(inicio, ahora)
  return !esAnteriorOIgual(fecha, hoy)
}

/**
 * A qué horas empieza cada cita posible de un día, según los tramos de atención del negocio.
 *
 * Todas las citas duran una hora, así que dentro de un tramo de 9 a 12 caben las de las 9, 10 y
 * 11: la de las 12 se saldría del tramo. Por eso se llega **hasta** la hora de cierre, sin
 * incluirla.
 */
function horasDeAtencion(tramos, fecha) {
  const diaSemana = diaDeLaSemana(fecha)
  const horas = []

  for (const tramo of tramos) {
    if (tramo.dia_semana !== diaSemana) continue

    for (let hora = tramo.hora_inicio; hora < tramo.hora_fin; hora++) {
      horas.push(hora)
    }
  }

  return horas.sort((una, otra) => una - otra)
}

/**
 * Por qué un día no ofrece nada. El frontend no decide reglas de negocio (`DISENO.md`, límite del
 * componente Interfaz), así que el servidor le tiene que decir el motivo en vez de dejarlo
 * deducir de una lista vacía.
 */
function estadoDelDia({ horarios, esFeriado, fueraDeTiempo }) {
  if (horarios.length === 0) return "cerrado"
  if (esFeriado) return "feriado"
  if (fueraDeTiempo) return "hoy_o_pasado"
  if (horarios.some((horario) => horario.disponible)) return "con_horarios"
  return "lleno"
}

/**
 * RN-14: si en los próximos 7 días no queda nada libre, el cliente recibe el aviso de volver a
 * revisar más adelante.
 *
 * Mira siempre los 7 días que siguen a hoy, **sin importar qué mes se esté viendo**: la regla
 * habla de lo que viene, no del mes que el cliente tenga en pantalla. Se arranca en `hoy + 1`
 * porque hoy nunca ofrece nada (RN-4).
 *
 * **Esto NO recibe `quien`, y es una decisión, no un olvido** *(tomada el 2026-08-21 al construir
 * RN-25)*. RN-14 es una regla del **cliente**: dice «si al entrar **el cliente** no encuentra ningún
 * horario disponible en los próximos 7 días». Se calcula siempre con la vara del cliente, así que
 * Personal ve el mismo aviso que vería su cliente — que es la información útil cuando está al
 * teléfono con él. El único caso en que la frase quedaría corta es que hoy tenga horarios libres y
 * los 7 días siguientes ninguno; queda anotado y no se cambió, porque cambiarlo sin una prueba que
 * lo cubra sería mover una regla a ciegas.
 */
function hayAlgoLibrePronto({ hoy, agenda, ahora }) {
  for (let cuantos = 1; cuantos <= DIAS_QUE_MIRA_EL_AVISO; cuantos++) {
    const dia = armarDia({ fecha: sumarDias(hoy, cuantos), hoy, agenda, ahora })
    if (dia.horarios.some((horario) => horario.disponible)) return true
  }
  return false
}
