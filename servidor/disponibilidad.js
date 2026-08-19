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
//   4. es de mañana en adelante                         (RN-4)
//   5. ese proveedor no tiene ya una cita activa ahí    (RN-1)
//
// La número 2 no está escrita en ninguna parte de este archivo, y es a propósito: el horario del
// negocio se guarda como **tramos de atención**, y entre semana son dos —9 a 12 y 13 a 18—. El
// almuerzo es el hueco entre los dos tramos. Si fuera un dato aparte que hay que acordarse de
// restar, sería un lugar más donde equivocarse.
// ─────────────────────────────────────────────────────────────────────────────────────────────

import {
  diaDeLaSemana,
  diasDelMes,
  escribirInicio,
  esAnteriorOIgual,
  fechaDeCostaRica,
  sumarDias,
} from "./tiempo.js"

/** Cuántos días adelante mira RN-14 para avisar que no queda nada libre. */
const DIAS_QUE_MIRA_EL_AVISO = 7

/**
 * El calendario de un mes, para un servicio y un proveedor.
 *
 * `ahora` llega como dato en vez de averiguarse acá adentro. Eso es lo que permite que las pruebas
 * paren el reloj en un miércoles, en un sábado o en un feriado concreto y comprueben siempre lo
 * mismo, sin depender del día en que alguien las corra.
 */
export function calcularDisponibilidad({ base, proveedorId, mes, ahora }) {
  const hoy = fechaDeCostaRica(ahora)

  // Todo lo que hace falta se lee UNA vez y se usa para los treinta y pico de días. Leerlo día por
  // día haría treinta veces el mismo trabajo.
  const agenda = leerAgenda(base, proveedorId)

  const dias = diasDelMes(mes).map((fecha) => armarDia({ fecha, hoy, agenda }))

  return {
    mes,
    dias,
    hayHorariosEnProximos7Dias: hayAlgoLibrePronto({ hoy, agenda }),
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
 * Devuelve **por qué**, no solo sí o no, porque quien pregunta tiene que dar mensajes distintos: un
 * horario de hoy se rechaza con el aviso de llamar al negocio (RN-4), y los demás con «ya no está
 * disponible».
 *
 *   - `"disponible"`      → se puede tomar
 *   - `"hoy_o_pasado"`    → es de hoy o de un día que ya pasó (RN-4)
 *   - `"no_disponible"`   → feriado, domingo, almuerzo, fuera de horario, o ya está tomado
 */
export function revisarHorario({ base, proveedorId, inicio, ahora }) {
  const hoy = fechaDeCostaRica(ahora)
  const fecha = inicio.slice(0, 10)

  // RN-4 se mira primero y se mira por **día**, no por hora: no importa que falten horas para las
  // 5 de la tarde de hoy, hoy no se reserva. Es literalmente lo que pide CA-2, «sin importar la
  // hora a la que se intente».
  if (esAnteriorOIgual(fecha, hoy)) return "hoy_o_pasado"

  const dia = armarDia({ fecha, hoy, agenda: leerAgenda(base, proveedorId) })
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
function armarDia({ fecha, hoy, agenda }) {
  const nombreFeriado = agenda.feriados.get(fecha) ?? null
  const esFeriado = nombreFeriado !== null
  const yaPaso = esAnteriorOIgual(fecha, hoy)

  const horarios = horasDeAtencion(agenda.tramos, fecha).map((hora) => {
    const inicio = escribirInicio(fecha, hora)
    return {
      inicio,
      disponible: !esFeriado && !yaPaso && !agenda.ocupados.has(inicio),
    }
  })

  return { fecha, esFeriado, nombreFeriado, estado: estadoDelDia({ horarios, esFeriado, yaPaso }), horarios }
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
function estadoDelDia({ horarios, esFeriado, yaPaso }) {
  if (horarios.length === 0) return "cerrado"
  if (esFeriado) return "feriado"
  if (yaPaso) return "hoy_o_pasado"
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
 */
function hayAlgoLibrePronto({ hoy, agenda }) {
  for (let cuantos = 1; cuantos <= DIAS_QUE_MIRA_EL_AVISO; cuantos++) {
    const dia = armarDia({ fecha: sumarDias(hoy, cuantos), hoy, agenda })
    if (dia.horarios.some((horario) => horario.disponible)) return true
  }
  return false
}
