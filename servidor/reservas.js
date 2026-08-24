// Las citas: crearlas, cancelarlas, moverlas de horario, y leer las de un cliente.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// Es el componente **Reservas** de `DISENO.md`, y su límite dice que es **el único que modifica el
// estado de una cita**. Hoy sabe crearlas, cancelarlas y reagendarlas; reservar en nombre de quien
// llama (pieza 7) y cerrar las pasadas (pieza 8) se escriben acá adentro cuando toque.
//
// Lo que este archivo NO hace: decidir si un horario está libre. Esa regla vive en
// `disponibilidad.js`, que es el mismo lugar del que sale el calendario que la persona vio antes de
// elegir. Preguntarle a él —en vez de volver a escribir la regla— es lo que garantiza que la
// pantalla y la reserva nunca se contradigan.
//
// LA CARRERA (CA-1). Dos clientes pueden confirmar el mismo horario casi en el mismo instante.
// Comprobar «¿está libre?» y después insertar son **dos movimientos**, y entre uno y otro cabe la
// reserva de la otra persona. Acá eso se resuelve con dos candados, uno adentro del otro:
//
//   1. **El índice único parcial de la base** (`base-de-datos.js`): la base se niega a guardar una
//      segunda cita activa para el mismo proveedor a la misma hora. Es el candado de verdad — no
//      hace la segunda inserción improbable, la hace imposible.
//   2. **La transacción `immediate`**: junta la comprobación y la inserción en un solo movimiento,
//      y toma el permiso de escritura antes de empezar en vez de a mitad de camino.
//
// La comprobación previa igual hace falta, y no es por seguridad: es la única que sabe **por qué**
// se rechaza —feriado, domingo, hoy— y puede contestar el mensaje correcto. El índice solo sabe
// decir «no».
// ─────────────────────────────────────────────────────────────────────────────────────────────

import { enviarConfirmacionDeCita } from "./correo.js"
import { revisarHorario } from "./disponibilidad.js"
import { QUIEN_CLIENTE, QUIEN_PERSONAL } from "./quien-actua.js"
import { escribirMomento, horasHasta, todaviaNoEmpezo } from "./tiempo.js"

/**
 * Los estados de una cita (bloque *Produce* de la pieza 3). Los dos últimos los trajo la pieza 8.
 *
 * **A los dos últimos solo se llega porque alguien los marcó**, nunca por el paso del tiempo
 * (RN-17). Una cita cuya hora pasó y que nadie cerró sigue siendo `activa`, y eso es a propósito:
 * la aplicación no sabe si la persona asistió — eso lo sabe quien estuvo ahí.
 */
export const ESTADO_ACTIVA = "activa"
export const ESTADO_CANCELADA = "cancelada"
export const ESTADO_COMPLETADA = "completada"
export const ESTADO_NO_ASISTIO = "no_asistio"

/** Los dos únicos cierres que existen (RF-21). Cualquier otra palabra se rechaza. */
export const CIERRES_VALIDOS = [ESTADO_COMPLETADA, ESTADO_NO_ASISTIO]

/**
 * Los canales de una cita (RN-12): la reservó el cliente por su cuenta, o la reservó Personal
 * atendiendo el teléfono. El segundo lo trajo la pieza 7.
 *
 * Es el mismo dato que necesita el reporte semestral de `NEGOCIO.md` —en línea contra teléfono—, sin
 * ningún cálculo adicional: alcanza con agrupar por esta columna.
 */
export const CANAL_EN_LINEA = "en_linea"
export const CANAL_ASISTIDA = "asistida"

/**
 * Quién está pidiendo. **Se definen en `servidor/quien-actua.js`** desde el 2026-08-21 —ahí está
 * escrito por qué— y se vuelven a exportar desde acá para que nada de lo que ya las pedía a este
 * archivo tenga que cambiar de lugar.
 */
export { QUIEN_CLIENTE, QUIEN_PERSONAL }

/**
 * La ventana de cancelación: cuántas horas antes de la cita se deja de poder cancelar o mover
 * (RN-5). Es fija en 4 para todo el prototipo — «política de cancelación configurable por negocio»
 * está en la hoja de ruta de `NEGOCIO.md`, fuera de esta entrega.
 */
export const HORAS_DE_LA_VENTANA = 4

/** El error que SQLite devuelve cuando el índice único rechaza una inserción repetida. */
const RECHAZO_DEL_INDICE_UNICO = "SQLITE_CONSTRAINT_UNIQUE"

/**
 * Crea una cita activa para un cliente (RF-8).
 *
 * Devuelve `{ ok: true, cita }` si se pudo, o `{ ok: false, motivo }` si no. **No lanza errores ni
 * sabe de HTTP**: quien la llama traduce el motivo al número que corresponda. Los motivos posibles:
 *
 *   - `"mismo_dia"`             → el horario es de hoy o de un día que ya pasó, y quien reserva es un
 *     cliente (RN-4, CA-2)
 *   - `"horario_ya_empezo"`     → ese horario ya arrancó, y quien reserva es Personal (RN-25)
 *   - `"horario_no_disponible"` → ya lo tomaron, es feriado, es domingo, o no es hora de atención
 *
 * `ahora` llega como dato, igual que en todo el proyecto: es lo que permite que las pruebas paren el
 * reloj y comprueben siempre lo mismo.
 *
 * `personalIdCreador` llega desde la pieza 7 y **cambia dos cosas, no una**:
 *
 *   1. La cita queda con canal `asistida` y con esa cuenta anotada (RN-12).
 *   2. **La regla del tiempo pasa a ser la de Personal** (RN-25): puede reservar para hoy, en un
 *      horario que todavía no haya empezado.
 *
 * Quién pregunta **se deduce de ese mismo dato** en vez de pedirse aparte, y es a propósito: si una
 * cita la crea Personal, las reglas de Personal son las que valen. Pedir los dos por separado dejaría
 * que un descuido las desalineara —una cita con canal `asistida` revisada con la vara del cliente— y
 * ese error no se vería hasta que alguien intentara reservar para hoy.
 *
 * **Las demás reglas no cambian** (RN-13): el horario se comprueba con la misma `revisarHorario`, así
 * que Personal tampoco puede tomar un horario ocupado, un feriado, un domingo ni el almuerzo.
 */
export function crearCita({
  base,
  clienteId,
  servicioId,
  proveedorId,
  inicio,
  ahora,
  personalIdCreador = null,
}) {
  const laCreaPersonal = personalIdCreador !== null
  const canal = laCreaPersonal ? CANAL_ASISTIDA : CANAL_EN_LINEA
  const quien = laCreaPersonal ? QUIEN_PERSONAL : QUIEN_CLIENTE

  const comprobarYGuardar = base.transaction(() => {
    const revision = revisarHorario({ base, proveedorId, inicio, ahora, quien })

    if (revision === "hoy_o_pasado") return { ok: false, motivo: "mismo_dia" }
    if (revision === "ya_empezo") return { ok: false, motivo: "horario_ya_empezo" }
    if (revision !== "disponible") return { ok: false, motivo: "horario_no_disponible" }

    const guardada = base
      .prepare(
        `INSERT INTO cita
           (cliente_id, servicio_id, proveedor_id, inicio, estado, creada_en, canal,
            personal_id_creador)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        clienteId,
        servicioId,
        proveedorId,
        inicio,
        ESTADO_ACTIVA,
        escribirMomento(ahora),
        canal,
        personalIdCreador,
      )

    // Las otras cuatro columnas de la tabla quedan vacías a propósito: las dos de cancelación las
    // llena la pieza 5 cuando alguien cancela, y las dos de cierre la pieza 8.
    return {
      ok: true,
      cita: {
        id: Number(guardada.lastInsertRowid),
        servicioId,
        proveedorId,
        inicio,
        estado: ESTADO_ACTIVA,
        canal,
      },
    }
  })

  try {
    // `immediate` pide el permiso de escritura al empezar la transacción, no a mitad de camino. Es
    // lo que corresponde acá: se sabe de antemano que se va a escribir.
    return comprobarYGuardar.immediate()
  } catch (falla) {
    // Acá se cae la reserva que perdió la carrera de CA-1: pasó la comprobación porque el horario
    // todavía estaba libre cuando la miró, y el índice único la rechazó al guardar.
    if (falla.code === RECHAZO_DEL_INDICE_UNICO) {
      return { ok: false, motivo: "horario_no_disponible" }
    }
    throw falla
  }
}

/**
 * Crea la cita **y le avisa al cliente por correo** (RF-11). Es lo que llaman los endpoints, tanto
 * cuando reserva el cliente como cuando reserva Personal en nombre de quien llama (pieza 7): el
 * correo le llega al cliente igual, sin que la pieza 7 tenga que acordarse de mandarlo.
 *
 * Existe para que «al crear una cita se manda la confirmación» esté escrito en **un solo lugar**.
 * Si cada endpoint tuviera que acordarse de mandar el correo por su cuenta, el día que se agregue
 * uno nuevo va a haber un camino por el que se reserva sin que nadie se entere. Es el mismo motivo
 * por el que `DISENO.md` dice que Reservas «avisa a Notificaciones cuando algo cambia».
 *
 * El orden importa y no es casual: **primero se guarda la cita, después se manda el correo**. La
 * cita ya está a salvo cuando el envío empieza, así que un correo que falla no puede arrastrarla
 * (RF-19). Y `enviarConfirmacionDeCita` nunca lanza errores, así que tampoco hay nada que atajar
 * acá.
 */
export async function crearCitaYConfirmar({
  base,
  enviador,
  clienteId,
  servicioId,
  proveedorId,
  inicio,
  ahora,
  personalIdCreador = null,
}) {
  const resultado = crearCita({
    base,
    clienteId,
    servicioId,
    proveedorId,
    inicio,
    ahora,
    personalIdCreador,
  })

  if (resultado.ok) {
    await enviarConfirmacionDeCita({ base, enviador, citaId: resultado.cita.id, ahora })
  }

  return resultado
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// LA VENTANA DE CANCELACIÓN (pieza 5)
//
// La regla de RN-5, escrita **una sola vez** en todo el proyecto: el cliente no puede cancelar ni
// mover una cita si faltan menos de 4 horas. Cancelar y reagendar la comparten porque es literalmente
// la misma regla, y la pieza 7 va a llamar a esta misma función pasando `QUIEN_PERSONAL` para
// saltársela (RN-6). Si estuviera copiada en los dos endpoints, el día que la ventana cambie de 4 a 2
// horas habría que acordarse de los dos lugares — y el que se olvide sería el que deja pasar lo que
// no debía.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/**
 * ¿Se puede cancelar o mover esta cita? Devuelve **por qué no**, no solo sí o no, porque quien
 * pregunta tiene que dar mensajes distintos: «llamá al negocio» no sirve para una cita que ya está
 * cancelada.
 *
 *   - `"se_puede"`               → adelante
 *   - `"cita_no_activa"`         → ya está cancelada, completada o marcada como no asistió
 *   - `"ya_paso"`                → la cita ya ocurrió, y entonces no la cambia nadie (RN-26)
 *   - `"ventana_de_cancelacion"` → faltan menos de 4 horas y quien pide es un cliente (RN-5)
 *
 * ── El orden de los tres casos no es casual ──────────────────────────────────────────────────
 *
 * **`ya_paso` se pregunta ANTES de la excepción de Personal, y ahí está toda la regla RN-26.** Si
 * estuviera después, Personal —que no tiene ventana de cancelación (RN-6)— seguiría pudiendo mover y
 * cancelar citas del mes pasado, que es exactamente el hueco que la pieza 7 encontró mirando la
 * pantalla y que la 8 vino a cerrar.
 *
 * **Hasta el 2026-08-24 este caso no existía**, y no era un descuido: una cita pasada caía sola en la
 * ventana de las 4 horas —si faltan −22 horas, faltan menos de 4—, así que para el cliente la regla
 * ya la cubría. Lo que cambió es que ahora hay **dos actores**, y para el segundo esa cuenta no corre.
 * De paso, el motivo dejó de ser una frase falsa: «faltan menos de 4 horas» era cierto como cuenta y
 * mentira como explicación debajo de una cita de la semana pasada.
 *
 * **Las dos reglas miran cosas distintas y por eso no se pisan:** RN-26 mira si la cita **ya
 * ocurrió**; RN-5 mira **cuántas horas faltan** para una que todavía no ocurrió. Personal se saltea
 * la segunda (RN-6) y no la primera (RN-26).
 *
 * El borde se decide una vez y queda escrito: **una cita que empieza en este mismo instante ya
 * empezó**, así que ya no se cambia. Es la misma `todaviaNoEmpezo` que usa RN-25 para los horarios
 * del calendario, y por eso las dos reglas del proyecto que hablan de «ya empezó» no se pueden
 * desincronizar.
 */
export function revisarSiSePuedeCambiar({ cita, quien, ahora }) {
  if (cita.estado !== ESTADO_ACTIVA) return "cita_no_activa"

  // RN-26. Alcanza a los dos actores, y por eso va antes que la excepción de Personal.
  if (laCitaYaPaso({ cita, ahora })) return "ya_paso"

  if (quien === QUIEN_PERSONAL) return "se_puede"

  // «4 horas **o más**» (RF-13): el borde exacto se permite. Por eso es `<` y no `<=`.
  if (horasHasta(cita.inicio, ahora) < HORAS_DE_LA_VENTANA) return "ventana_de_cancelacion"

  return "se_puede"
}

/**
 * ¿La hora de esta cita **ya pasó**? Es la pregunta de la que dependen tres cosas de este archivo:
 * RN-26 (no se cambia), la lista de citas por cerrar (RF-21), y en qué grupo de la pantalla cae.
 *
 * Está escrita una sola vez para que las tres contesten siempre lo mismo. Si cada una hiciera su
 * propia cuenta, un día una cita podría estar en el historial y a la vez ofrecer «Reagendar».
 *
 * La cuenta en sí no vive acá sino en `tiempo.js`, como manda la convención del proyecto: **todo lo
 * que tenga que ver con fechas se escribe ahí**.
 */
function laCitaYaPaso({ cita, ahora }) {
  return !todaviaNoEmpezo(cita.inicio, ahora)
}

/**
 * Lo mismo que `revisarSiSePuedeCambiar`, pero **con el detalle que la pantalla necesita para
 * escribir una frase que sea verdad**. Devuelve `null` cuando sí se puede.
 *
 * ── Cómo nació, y por qué el 2026-08-24 adelgazó ─────────────────────────────────────────────
 *
 * **Nació el 2026-08-20 como un parche**, y vale la pena que quede escrito. Mirando la pantalla se
 * vio que debajo de una cita de la semana pasada salía «Faltan menos de 4 horas para esta cita»: una
 * frase falsa. La regla no estaba mal —una cita pasada cae sola en la ventana, porque si faltan −22
 * horas faltan menos de 4— pero la **explicación** sí. Como no se quería tocar el motivo que devuelven
 * los endpoints (lo fija el plan y lo comprueba CA-3), se agregó esta segunda función que traducía
 * `ventana_de_cancelacion` a `ya_paso` **solo para la pantalla**.
 *
 * **El 2026-08-24 el parche dejó de hacer falta**, y no porque se borrara: porque la regla de verdad
 * cambió. RN-26 dice que una cita pasada no la cambia nadie, así que `revisarSiSePuedeCambiar` ya
 * devuelve `ya_paso` por su cuenta y para los dos actores. Lo que la pantalla decía y lo que la regla
 * decide pasaron a ser **lo mismo**, que es como tenía que haber sido siempre.
 *
 * **Y entonces por qué sigue existiendo esta función.** Por una diferencia chica pero real: la regla
 * contesta `"se_puede"` y la pantalla necesita `null` —«no hay ningún motivo que mostrar»—. Convertir
 * eso es su único trabajo hoy. Vale como recordatorio de algo que este proyecto ya vivió dos veces:
 * **cuando un mensaje suena falso, casi siempre la regla detrás tiene un hueco** — pasó acá y pasó
 * con RN-25.
 *
 * Valores posibles: `"cita_no_activa"`, `"ya_paso"`, `"ventana_de_cancelacion"` y `null`.
 */
export function porQueNoSePuedeCambiar({ cita, quien, ahora }) {
  const revision = revisarSiSePuedeCambiar({ cita, quien, ahora })

  return revision === "se_puede" ? null : revision
}

/**
 * En qué grupo de la pantalla va una cita: `"proxima"` o `"historial"`.
 *
 * La pantalla muestra **«Tus próximas citas»** arriba y **«Historial»** abajo (decidido por la
 * estudiante el 2026-08-20). El motivo del cambio: `PLAN.md` y `ESPECIFICACION.md` dicen en tres
 * lugares que «el cliente ve sus **citas activas**», y la pantalla estaba mostrando **todo** mezclado
 * en una lista que además crecía para siempre. RN-15 —«nada se borra»— habla de **los datos**, no de
 * lo que la pantalla muestra: la cita cancelada sigue guardada, solo se mudó de lugar.
 *
 * Es el servidor el que decide, y no la pantalla, porque la respuesta depende de **qué hora es** y
 * del estado de la cita. Si la pantalla lo calculara con el reloj de la computadora de quien mira,
 * una máquina con la hora mal puesta le pondría su cita de mañana en el historial.
 *
 * **Es una pregunta distinta de `sePuedeCambiar`, y por eso son dos campos.** Una cita de hoy en dos
 * horas **no se puede cambiar** (RN-5) pero **sí es una cita próxima**: es justamente la más urgente
 * que tiene esa persona, y enterrarla en el historial sería esconderle lo que más necesita ver.
 *
 * Al historial van dos cosas:
 *   - las que **ya no están activas**: canceladas, y las completadas o «no asistió» de la pieza 8;
 *   - las que **ya pasaron**, aunque sigan activas — cerrarlas es de la pieza 8 y lo hace Personal,
 *     porque ninguna cita cambia de estado por el solo paso del tiempo (RN-17).
 */
export function grupoDeLaCita({ cita, ahora }) {
  if (cita.estado !== ESTADO_ACTIVA) return "historial"
  // La **misma** cuenta que usa RN-26, a propósito (2026-08-24): si cada una hiciera la suya, una
  // cita podría estar en el historial y a la vez ofrecer «Reagendar», o al revés.
  if (laCitaYaPaso({ cita, ahora })) return "historial"
  return "proxima"
}

/**
 * Cancela una cita (RF-13). **No la borra**: le cambia el estado y anota cuándo y quién la canceló
 * (RN-15, REG-1). El horario queda libre en el mismo instante, sin que nadie tenga que hacer nada
 * más: el índice único de la base solo vigila las citas **activas**, así que dejar de estar activa
 * es dejar de ocupar (RN-7).
 *
 * Devuelve `{ ok: true }` o `{ ok: false, motivo }`, y no sabe nada de HTTP. Los motivos posibles:
 * `"cita_no_encontrada"`, `"cita_no_activa"` y `"ventana_de_cancelacion"`.
 *
 * No manda ningún correo, a propósito: `ESPECIFICACION.md` no pide ninguno al cancelar, y quien
 * canceló acaba de verlo en pantalla.
 */
export function cancelarCita({ base, citaId, clienteId, quien, ahora }) {
  const cancelar = base.transaction(() => {
    const cita = buscarCitaParaCambiar({ base, citaId, clienteId, quien })
    if (!cita) return { ok: false, motivo: "cita_no_encontrada" }

    const revision = revisarSiSePuedeCambiar({ cita, quien, ahora })
    if (revision !== "se_puede") return { ok: false, motivo: revision }

    // El `AND estado = 'activa'` del final no es de más: es lo que hace que dos cancelaciones que
    // lleguen al mismo tiempo no puedan escribir las dos: la segunda no encuentra fila que cambiar.
    base
      .prepare(
        `UPDATE cita
            SET estado = ?, cancelada_en = ?, cancelada_por = ?
          WHERE id = ? AND estado = ?`,
      )
      .run(ESTADO_CANCELADA, escribirMomento(ahora), quien, citaId, ESTADO_ACTIVA)

    return { ok: true }
  })

  return cancelar.immediate()
}

/**
 * Mueve una cita a otro horario (RF-14). **Lo único que cambia es la fecha y la hora**: el servicio
 * y el proveedor se quedan como estaban (RN-18), y por eso esta función no los recibe siquiera —
 * mandarlos no sería posible ni por error.
 *
 * Liberar el horario viejo y tomar el nuevo es **un solo movimiento**, no dos: es la misma fila de la
 * misma cita, y lo que cambia es su columna `inicio`. Eso hace imposible el estado intermedio que
 * daría miedo —la cita sin horario, o con los dos— sin ningún cuidado especial.
 *
 * Y comprueba el horario nuevo con **la misma** función que usa reservar (`revisarHorario`), así que
 * reagendar no puede aterrizar en un feriado, un domingo, el almuerzo ni el día de hoy. Volver a
 * escribir esa regla acá sería la manera de que un día una diga «libre» y la otra «ocupado».
 *
 * Motivos posibles: `"cita_no_encontrada"`, `"cita_no_activa"`, `"ventana_de_cancelacion"`,
 * `"mismo_dia"`, `"horario_ya_empezo"` y `"horario_no_disponible"`.
 *
 * Y le pasa `quien` a `revisarHorario` desde el 2026-08-21: mover una cita **a un horario de hoy** es
 * lo mismo que reservarla ahí, así que la excepción de RN-25 vale igual para las dos. Tratarlas
 * distinto sería escribir la regla dos veces con una diferencia que nadie pidió.
 */
export function reagendarCita({ base, citaId, clienteId, quien, inicio, ahora }) {
  const comprobarYMover = base.transaction(() => {
    const cita = buscarCitaParaCambiar({ base, citaId, clienteId, quien })
    if (!cita) return { ok: false, motivo: "cita_no_encontrada" }

    const revision = revisarSiSePuedeCambiar({ cita, quien, ahora })
    if (revision !== "se_puede") return { ok: false, motivo: revision }

    const horario = revisarHorario({ base, proveedorId: cita.proveedor_id, inicio, ahora, quien })
    if (horario === "hoy_o_pasado") return { ok: false, motivo: "mismo_dia" }
    if (horario === "ya_empezo") return { ok: false, motivo: "horario_ya_empezo" }
    if (horario !== "disponible") return { ok: false, motivo: "horario_no_disponible" }

    base.prepare("UPDATE cita SET inicio = ? WHERE id = ?").run(inicio, citaId)

    return {
      ok: true,
      cita: {
        id: cita.id,
        servicioId: cita.servicio_id,
        proveedorId: cita.proveedor_id,
        inicio,
        estado: cita.estado,
        canal: cita.canal,
      },
    }
  })

  try {
    return comprobarYMover.immediate()
  } catch (falla) {
    // La misma carrera de CA-1, del otro lado: alguien tomó el horario nuevo entre la comprobación y
    // el cambio. El índice único la para, igual que para una reserva.
    if (falla.code === RECHAZO_DEL_INDICE_UNICO) {
      return { ok: false, motivo: "horario_no_disponible" }
    }
    throw falla
  }
}

/**
 * Mueve la cita **y le manda al cliente la confirmación con la fecha nueva** (RF-11, RF-14).
 *
 * Es el hermano de `crearCitaYConfirmar`, y existe por la misma razón: que «cuando una cita queda
 * agendada se manda la confirmación» esté escrito en un solo lugar. El correo se arma leyendo la cita
 * de la base **después** del cambio, así que dice la fecha nueva sin que nadie tenga que pasársela.
 *
 * El orden es el mismo de siempre: primero se mueve la cita, después se manda el correo. Si el envío
 * falla, la cita ya está movida y queda válida (RF-19).
 */
export async function reagendarCitaYConfirmar({
  base,
  enviador,
  citaId,
  clienteId,
  quien,
  inicio,
  ahora,
}) {
  const resultado = reagendarCita({ base, citaId, clienteId, quien, inicio, ahora })

  if (resultado.ok) {
    await enviarConfirmacionDeCita({ base, enviador, citaId, ahora })
  }

  return resultado
}

/**
 * Busca la cita que se quiere cambiar, **y se asegura de que sea de quien la pide**.
 *
 * Cuando quien pide es un cliente, la búsqueda lleva su número adentro: la cita de otra persona
 * simplemente **no se encuentra**. Eso es a propósito y es lo que hace que el endpoint conteste `404`
 * y no `403` — un `403` le confirmaría a quien pregunta que ese número de cita existe, y con eso se
 * puede ir contando las citas del negocio de uno en uno.
 *
 * Cuando quien pide es Personal (pieza 7) no hay filtro, porque atiende las citas de cualquiera.
 * `clienteId` es obligatorio para un cliente, y si falta esto se corta en seco en vez de buscar sin
 * filtro: un descuido así dejaría que cualquiera cancele la cita de cualquiera.
 */
function buscarCitaParaCambiar({ base, citaId, clienteId, quien }) {
  if (quien === QUIEN_CLIENTE && !clienteId) {
    throw new Error("Falta el clienteId: un cliente solo puede cambiar sus propias citas")
  }

  if (quien === QUIEN_CLIENTE) {
    return base.prepare("SELECT * FROM cita WHERE id = ? AND cliente_id = ?").get(citaId, clienteId)
  }

  return base.prepare("SELECT * FROM cita WHERE id = ?").get(citaId)
}

/**
 * La fecha de la **primera** cita de un cliente, escrita `2026-09-03`, o `null` si todavía no tuvo
 * ninguna. Es de donde sale el «desde cuándo es cliente» de la sección «Usuario» (pieza 10).
 *
 * Cuenta **todas** las citas, sin mirar su estado: si la primera se canceló, esa persona ya era
 * cliente ese día igual. Y nada se borra (RN-15), así que la primera siempre está.
 */
export function primeraCitaDelCliente({ base, clienteId }) {
  const fila = base
    .prepare("SELECT MIN(inicio) AS primera FROM cita WHERE cliente_id = ?")
    .get(clienteId)

  if (!fila?.primera) return null

  // Del momento completo solo interesa el día: «cliente desde el 3 de setiembre», no «desde las 10».
  return fila.primera.slice(0, 10)
}

/**
 * Las citas de un cliente, ordenadas por su fecha de inicio.
 *
 * Devuelve los **nombres** del servicio y del proveedor, para que la pantalla pueda mostrar «Masaje
 * relajante con Ana» sin volver a preguntar quién es el proveedor 2, **y también sus números**, que
 * la pieza 5 necesita: para reagendar hay que pedir el calendario de ese servicio con ese proveedor,
 * y el calendario se pide por número.
 *
 * No filtra por estado, a propósito: nada se borra (RN-15), así que una cita cancelada sigue siendo
 * parte de lo que el cliente tiene derecho a ver. La razón completa está en `DISENO.md`, «Decisiones
 * tomadas al construir la pieza 3».
 *
 * Y cada cita viene con **`sePuedeCambiar` y `porQueNo`**, que son la respuesta del servidor a «¿le
 * muestro los botones de cancelar y reagendar?». La pantalla no lo calcula: `CLAUDE.md` dice que el
 * frontend no decide reglas de negocio, y esta es la misma decisión que ya se tomó en la pieza 2 con
 * el campo `estado` de cada día del calendario. Si la pantalla contara las horas por su cuenta, un
 * navegador con la hora mal puesta le mostraría un botón que el servidor va a rechazar — o peor, le
 * esconderá uno que sí podía usar.
 *
 * **`quien` es lo que hace que la misma cita conteste dos cosas distintas** (pieza 7). Preguntada
 * como cliente, una cita que empieza dentro de dos horas llega con `sePuedeCambiar: false` y
 * `porQueNo: "ventana_de_cancelacion"`; preguntada como Personal, la misma cita llega con
 * `sePuedeCambiar: true` (RN-6). **Eso es CA-3 visto desde la pantalla**, y no hay ninguna regla
 * nueva escrita para lograrlo: es el mismo `revisarSiSePuedeCambiar` recibiendo otro `quien`.
 */
export function citasDelCliente({ base, clienteId, ahora, quien = QUIEN_CLIENTE }) {
  const filas = base
    .prepare(
      `SELECT cita.id, cita.servicio_id AS servicioId, cita.proveedor_id AS proveedorId,
              servicio.nombre AS servicio, proveedor.nombre AS proveedor,
              cita.inicio, cita.estado
         FROM cita
         JOIN servicio  ON servicio.id  = cita.servicio_id
         JOIN proveedor ON proveedor.id = cita.proveedor_id
        WHERE cita.cliente_id = ?
        ORDER BY cita.inicio`,
    )
    .all(clienteId)

  return filas.map((cita) => {
    // Preguntado con `QUIEN_PERSONAL`, esto contesta distinto para la cita que está dentro de las 4
    // horas: es la mitad de CA-3 que le toca a la pieza 7, y sale de la misma función.
    const porQueNo = porQueNoSePuedeCambiar({ cita, quien, ahora })

    return {
      ...cita,
      sePuedeCambiar: porQueNo === null,
      porQueNo,
      grupo: grupoDeLaCita({ cita, ahora }),
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// CERRAR LAS CITAS PASADAS (pieza 8, RF-21)
//
// El componente **Reservas** es el único que modifica el estado de una cita, y esto es lo último que
// le faltaba saber hacer: marcar lo que ocurrió. Crear, cancelar, mover y cerrar quedan los cuatro
// en este archivo, que es lo que `DISENO.md` dice desde el principio.
//
// **Ningún estado se alcanza por el paso del tiempo (RN-17).** No hay ninguna tarea que recorra la
// base cerrando citas viejas, y no es un olvido: la aplicación **no sabe** si la persona asistió.
// Eso lo sabe quien estuvo ahí, y por eso el cierre siempre lo escribe una cuenta de Personal.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Las citas que están esperando que Personal las cierre: **activas y con la hora ya pasada**
 * (RF-21). Ordenadas de la más vieja a la más nueva, para que la que más tiempo lleva sin cerrar
 * quede arriba.
 *
 * Devuelve el **nombre** del cliente además del del servicio y el proveedor: es una lista de citas de
 * gente distinta, así que sin el nombre no se sabría de quién es cada una.
 *
 * **Por qué el «ya pasó» se filtra acá y no en el `WHERE` de la consulta.** En SQL se podría comparar
 * el texto del `inicio` contra el momento de ahora, y funcionaría, porque todos los momentos de este
 * proyecto se escriben igual y con el mismo desfase. Pero sería **la misma regla escrita dos veces**:
 * una en SQL y otra en `laCitaYaPaso`, con dos bordes que un día pueden dejar de coincidir. Al
 * volumen del negocio —unas 2.300 citas al año (RN-15)— traerlas y filtrarlas acá no cuesta nada, y a
 * cambio la respuesta a «¿ya pasó?» sigue estando en un solo lugar.
 */
export function citasPorCerrar({ base, ahora }) {
  const filas = base
    .prepare(
      `SELECT cita.id, cliente.nombre AS cliente,
              servicio.nombre AS servicio, proveedor.nombre AS proveedor,
              cita.inicio, cita.estado
         FROM cita
         JOIN cliente   ON cliente.id   = cita.cliente_id
         JOIN servicio  ON servicio.id  = cita.servicio_id
         JOIN proveedor ON proveedor.id = cita.proveedor_id
        WHERE cita.estado = ?
        ORDER BY cita.inicio`,
    )
    .all(ESTADO_ACTIVA)

  return filas
    .filter((cita) => laCitaYaPaso({ cita, ahora }))
    .map(({ estado, ...cita }) => cita)
}

/**
 * Cierra una cita: la marca como **completada** (el cliente asistió) o como **no asistió** (no se
 * presentó), y anota **qué cuenta de Personal lo hizo y cuándo** (RF-21, RN-17, RN-19, REG-1).
 *
 * **No borra nada** (RN-15): una cita marcada «no asistió» queda perdida —no se repone ni se devuelve
 * nada— pero su fila sigue ahí. Ese es justamente el punto de que el estado exista: una cita que se
 * quedara «activa» para siempre no dejaría rastro de por qué se perdió.
 *
 * Devuelve `{ ok: true, cierre }` o `{ ok: false, motivo }`, y no sabe nada de HTTP. Los motivos:
 * `"cita_no_encontrada"`, `"cita_no_activa"` y `"todavia_no_paso"`.
 *
 * **`todavia_no_paso` sale directo de RN-17**, que dice que «completada» se marca *después de que el
 * cliente asistió*: nadie asistió todavía a una cita de la semana que viene. Sin esta comprobación se
 * podría marcar como completada una cita futura, y esa etiqueta se desdiría el día de la cita — que
 * es exactamente lo que la regla de la etiqueta existe para evitar.
 *
 * No manda ningún correo, igual que cancelar: `ESPECIFICACION.md` no pide ninguno al cerrar.
 */
export function cerrarCita({ base, citaId, estado, personalId, ahora }) {
  const cerrar = base.transaction(() => {
    const cita = base.prepare("SELECT * FROM cita WHERE id = ?").get(citaId)
    if (!cita) return { ok: false, motivo: "cita_no_encontrada" }

    if (cita.estado !== ESTADO_ACTIVA) return { ok: false, motivo: "cita_no_activa" }
    if (!laCitaYaPaso({ cita, ahora })) return { ok: false, motivo: "todavia_no_paso" }

    const cerradaEn = escribirMomento(ahora)

    // El `AND estado = 'activa'` del final es el mismo cuidado que tiene cancelar: si dos cierres
    // llegaran al mismo tiempo, el segundo no encuentra fila que cambiar en vez de pisar al primero.
    base
      .prepare(
        `UPDATE cita
            SET estado = ?, cerrada_en = ?, cerrada_por = ?
          WHERE id = ? AND estado = ?`,
      )
      .run(estado, cerradaEn, personalId, citaId, ESTADO_ACTIVA)

    return { ok: true, cierre: { id: cita.id, estado, cerradaEn } }
  })

  return cerrar.immediate()
}
