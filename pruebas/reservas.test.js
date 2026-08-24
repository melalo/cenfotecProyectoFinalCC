// Pruebas de la pieza 3: reservar un horario.
//
// Acá viven las dos pruebas que el curso pide proteger con integración continua: **CA-1** (dos
// intentos de tomar el mismo horario, exactamente uno lo consigue) y **CA-2** (un horario de hoy se
// rechaza). Son dos de los tres criterios de aceptación de `ESPECIFICACION.md`, y `PROYECTO.md` §7
// punto 4 exige que corran en cada push. Están marcadas con su nombre en el título para que se
// puedan encontrar de un vistazo en la salida de `npm test`.
//
// Todas paran el reloj en el mismo momento que las de la pieza 2 (`MOMENTO_DE_PRUEBA`: martes 1 de
// setiembre de 2026, 8 de la mañana en Costa Rica). Sin eso, «reservar mañana a las 10» fallaría
// los sábados y CA-2 no tendría un «hoy» fijo contra el cual comprobar.
//
// Se escribieron antes que el código y se vieron fallar primero: una prueba que nunca falló no
// demuestra que esté comprobando algo.

import test from "node:test"
import assert from "node:assert/strict"

import {
  crearEntornoDePrueba,
  crearNavegador,
  entrarComoClienta,
  entrarComoOtroCliente,
  entrarComoPersonal,
  buscarPorNombre,
  diaDelCalendario,
  enviadorDeMentira,
  relojDetenidoEn,
  MOMENTO_DE_PRUEBA,
} from "./ayudas.js"

// Las fechas se escriben tal cual, no calculadas, para que la prueba diga qué día está mirando.
// Todas se leen desde el martes 1 de setiembre de 2026, que es donde está parado el reloj.
const HOY = "2026-09-01" // martes
const MANANA = "2026-09-02" // miércoles: día hábil completo, 8 horarios
const DOMINGO = "2026-09-06" // el negocio no abre (RN-3)
const FERIADO = "2026-09-15" // Día de la Independencia (RN-2)
const AYER = "2026-08-31" // lunes, ya pasado

/** Un momento escrito como lo escribe todo el proyecto: `2026-09-02T10:00:00-06:00`. */
function momento(fecha, hora) {
  return `${fecha}T${String(hora).padStart(2, "0")}:00:00-06:00`
}

/**
 * Levanta la aplicación con el reloj parado, entra como Ana, y devuelve todo lo que las pruebas
 * necesitan: el navegador, los identificadores del masaje y de sus dos proveedores, y dos atajos
 * para reservar y para mirar el calendario.
 */
async function prepararReservas(contexto) {
  // Desde la pieza 4, crear una cita manda un correo. Estas pruebas no son del correo, pero sin un
  // enviador que funcione cada reserva dejaría un aviso de «falló el envío» en la salida de
  // `npm test`. Una salida llena de avisos de siempre enseña a no leerlos.
  const entorno = await crearEntornoDePrueba(contexto, {
    reloj: relojDetenidoEn(MOMENTO_DE_PRUEBA),
    enviador: enviadorDeMentira(),
  })
  const navegador = crearNavegador(entorno)
  await entrarComoClienta(navegador)

  const servicios = await navegador("/api/servicios")
  const masaje = buscarPorNombre(servicios.cuerpo, "Masaje relajante")

  const proveedores = await navegador(`/api/servicios/${masaje.id}/proveedores`)
  const ana = buscarPorNombre(proveedores.cuerpo, "Ana")
  const carlos = buscarPorNombre(proveedores.cuerpo, "Carlos")

  /** Reserva un horario. Por defecto, masaje con Ana. */
  async function reservar(inicio, opciones = {}) {
    const quien = opciones.navegador ?? navegador

    return quien("/api/citas", {
      method: "POST",
      cuerpo: {
        servicioId: opciones.servicioId ?? masaje.id,
        proveedorId: opciones.proveedorId ?? ana.id,
        inicio,
      },
    })
  }

  async function verCalendario(mes, proveedor = ana) {
    return navegador(
      `/api/disponibilidad?servicioId=${masaje.id}&proveedorId=${proveedor.id}&mes=${mes}`,
    )
  }

  return { entorno, navegador, masaje, ana, carlos, reservar, verCalendario }
}

/** ¿Está libre ese horario en el calendario que devolvió el servidor? */
function estaLibre(calendario, fecha, hora) {
  const dia = diaDelCalendario(calendario, fecha)
  const horario = dia.horarios.find((uno) => uno.inicio === momento(fecha, hora))
  return horario?.disponible ?? false
}

// ══════════════════════════════════════════════════════ quién puede reservar

test("sin sesión abierta no se puede reservar", async (t) => {
  const entorno = await crearEntornoDePrueba(t, { reloj: relojDetenidoEn(MOMENTO_DE_PRUEBA) })
  const navegador = crearNavegador(entorno)

  // No existe la reserva como invitado (RN-9).
  const respuesta = await navegador("/api/citas", {
    method: "POST",
    cuerpo: { servicioId: 1, proveedorId: 1, inicio: momento(MANANA, 10) },
  })

  assert.equal(respuesta.estado, 401)
  assert.equal(respuesta.cuerpo.error, "sin_sesion")
})

test("sin sesión abierta no se pueden ver las citas de nadie", async (t) => {
  const entorno = await crearEntornoDePrueba(t, { reloj: relojDetenidoEn(MOMENTO_DE_PRUEBA) })
  const navegador = crearNavegador(entorno)

  const respuesta = await navegador("/api/citas")

  assert.equal(respuesta.estado, 401)
})

test("Personal no puede reservar sin decir para quién es la cita", async (t) => {
  const entorno = await crearEntornoDePrueba(t, { reloj: relojDetenidoEn(MOMENTO_DE_PRUEBA) })
  const navegadorDeAna = crearNavegador(entorno)
  await entrarComoClienta(navegadorDeAna)

  const servicios = await navegadorDeAna("/api/servicios")
  const masaje = buscarPorNombre(servicios.cuerpo, "Masaje relajante")
  const proveedores = await navegadorDeAna(`/api/servicios/${masaje.id}/proveedores`)
  const ana = buscarPorNombre(proveedores.cuerpo, "Ana")

  const navegadorDePersonal = crearNavegador(entorno)
  await entrarComoPersonal(navegadorDePersonal)

  // ── Esta prueba cambió al construir la pieza 7, el 2026-08-21 ──────────────────────────────
  //
  // Hasta entonces decía que este endpoint le contestaba `403 solo_clientes` a la cuenta de
  // Personal, y su comentario aclaraba «reservar en nombre de quien llama es la pieza 7». Ya llegó:
  // desde la pieza 7 **Personal sí reserva por acá** (RF-16), mandando además `clienteId`.
  //
  // Lo que esta prueba protege sigue siendo exactamente lo mismo, y por eso no se borró: que una
  // cita **nunca** quede guardada con el id de Personal en la columna `cliente_id`, que es el id de
  // OTRA persona de la tabla `cliente`. Antes eso se lograba cerrándole la puerta; ahora,
  // obligándolo a decir para quién. Cambió el número —`422` en vez de `403`— y no cambió el peligro.
  const respuesta = await navegadorDePersonal("/api/citas", {
    method: "POST",
    cuerpo: { servicioId: masaje.id, proveedorId: ana.id, inicio: momento(MANANA, 10) },
  })

  assert.equal(respuesta.estado, 422)
  assert.equal(respuesta.cuerpo.error, "datos_incompletos")

  // Y «mis citas» sí le sigue diciendo que no, porque esa lista es «las citas de quien está en
  // sesión» y Personal no tiene citas propias: las de un cliente las ve por
  // `/api/personal/clientes/:clienteId/citas` (pieza 7).
  const citas = await navegadorDePersonal("/api/citas")
  assert.equal(citas.estado, 403)
  assert.equal(citas.cuerpo.error, "solo_clientes")

  // Y nada quedó guardado.
  const cuantas = entorno.base.prepare("SELECT COUNT(*) AS cuantas FROM cita").get()
  assert.equal(cuantas.cuantas, 0)
})

// ══════════════════════════════════════════════════════ reservar (comprobaciones 1 a 4)

test("comprobación 1: se reserva el horario de mañana a las 10:00 y la cita queda creada", async (t) => {
  const { entorno, reservar, ana, masaje } = await prepararReservas(t)

  const respuesta = await reservar(momento(MANANA, 10))

  assert.equal(respuesta.estado, 201)
  assert.equal(respuesta.cuerpo.servicioId, masaje.id)
  assert.equal(respuesta.cuerpo.proveedorId, ana.id)
  assert.equal(respuesta.cuerpo.inicio, momento(MANANA, 10))
  assert.equal(respuesta.cuerpo.estado, "activa")
  assert.equal(respuesta.cuerpo.canal, "en_linea")
  assert.ok(respuesta.cuerpo.id > 0, "la cita tiene que traer su número")

  // REG-1 pide que la cita guarde también cuándo se creó, y RN-12 el canal. Se mira la fila por
  // dentro porque son datos que el cliente no ve pero el negocio necesita.
  const guardada = entorno.base.prepare("SELECT * FROM cita WHERE id = ?").get(respuesta.cuerpo.id)

  assert.equal(guardada.estado, "activa")
  assert.equal(guardada.canal, "en_linea")
  assert.equal(guardada.inicio, momento(MANANA, 10))
  // La fecha de creación es la del reloj del negocio, no la de la máquina: el reloj está parado el
  // martes 1 a las 8 de la mañana de Costa Rica.
  assert.equal(guardada.creada_en, momento(HOY, 8))
  // Reservó el cliente, no Personal: esa columna la llena la pieza 7.
  assert.equal(guardada.personal_id_creador, null)
  // Nada de esto se toca en esta pieza: lo llenan las piezas 5, 7 y 8.
  assert.equal(guardada.cancelada_en, null)
  assert.equal(guardada.cancelada_por, null)
  assert.equal(guardada.cerrada_en, null)
  assert.equal(guardada.cerrada_por, null)
})

test("comprobación 1: la cita reservada aparece en «Mis citas»", async (t) => {
  const { navegador, reservar } = await prepararReservas(t)

  await reservar(momento(MANANA, 10))
  const respuesta = await navegador("/api/citas")

  assert.equal(respuesta.estado, 200)
  assert.equal(respuesta.cuerpo.length, 1)

  // El contrato del plan pide los nombres del servicio y del proveedor, no sus números: la pantalla
  // muestra «Masaje relajante con Ana», no «servicio 1 con proveedor 2».
  assert.equal(respuesta.cuerpo[0].servicio, "Masaje relajante")
  assert.equal(respuesta.cuerpo[0].proveedor, "Ana")
  assert.equal(respuesta.cuerpo[0].inicio, momento(MANANA, 10))
  assert.equal(respuesta.cuerpo[0].estado, "activa")
})

test("comprobación 2: el horario reservado deja de aparecer libre de inmediato", async (t) => {
  const { reservar, verCalendario } = await prepararReservas(t)

  const antes = await verCalendario("2026-09")
  assert.equal(estaLibre(antes.cuerpo, MANANA, 10), true, "antes de reservar tiene que estar libre")

  await reservar(momento(MANANA, 10))

  const despues = await verCalendario("2026-09")
  assert.equal(estaLibre(despues.cuerpo, MANANA, 10), false)

  // Los demás horarios de ese día no se tocan: se ocupó uno, no el día.
  assert.equal(estaLibre(despues.cuerpo, MANANA, 11), true)
})

test("comprobación 2: reservar con Ana no ocupa el mismo horario de Carlos", async (t) => {
  const { reservar, verCalendario, carlos } = await prepararReservas(t)

  await reservar(momento(MANANA, 10))

  const calendarioDeCarlos = await verCalendario("2026-09", carlos)
  assert.equal(estaLibre(calendarioDeCarlos.cuerpo, MANANA, 10), true)
})

test("comprobación 3: la cita sigue ahí después de apagar y volver a levantar la aplicación", async (t) => {
  const { entorno, navegador, reservar } = await prepararReservas(t)

  await reservar(momento(MANANA, 10))

  await entorno.apagar()
  await entorno.levantar()

  // El mismo navegador: su cookie de sesión sobrevive el reinicio, porque va firmada y no guardada
  // en la memoria del servidor (decisión de la pieza 1).
  const respuesta = await navegador("/api/citas")

  assert.equal(respuesta.estado, 200)
  assert.equal(respuesta.cuerpo.length, 1)
  assert.equal(respuesta.cuerpo[0].inicio, momento(MANANA, 10))
})

test("comprobación 4: un cliente puede tener varias citas activas al mismo tiempo (RN-16)", async (t) => {
  const { navegador, reservar } = await prepararReservas(t)

  const primera = await reservar(momento(MANANA, 10))
  const segunda = await reservar(momento(MANANA, 14))

  assert.equal(primera.estado, 201)
  assert.equal(segunda.estado, 201)

  const respuesta = await navegador("/api/citas")

  assert.equal(respuesta.cuerpo.length, 2)
  // Ordenadas por fecha de inicio, que es lo que el bloque «Produce» del plan pide.
  assert.deepEqual(
    respuesta.cuerpo.map((cita) => cita.inicio),
    [momento(MANANA, 10), momento(MANANA, 14)],
  )
})

test("las citas de un cliente son solo las suyas", async (t) => {
  const { entorno, reservar, masaje, ana } = await prepararReservas(t)

  await reservar(momento(MANANA, 10))

  const otroNavegador = crearNavegador(entorno)
  await entrarComoOtroCliente(otroNavegador)

  await otroNavegador("/api/citas", {
    method: "POST",
    cuerpo: { servicioId: masaje.id, proveedorId: ana.id, inicio: momento(MANANA, 11) },
  })

  const suyas = await otroNavegador("/api/citas")

  assert.equal(suyas.cuerpo.length, 1)
  assert.equal(suyas.cuerpo[0].inicio, momento(MANANA, 11))
})

// ══════════════════════════════════════════════════════ CA-1: la carrera por el mismo horario

test("CA-1 (comprobación 5): dos clientes reservan el mismo horario a la vez y exactamente uno lo consigue", async (t) => {
  const { entorno, navegador, masaje, ana } = await prepararReservas(t)

  const otroNavegador = crearNavegador(entorno)
  await entrarComoOtroCliente(otroNavegador)

  const pedido = {
    method: "POST",
    cuerpo: { servicioId: masaje.id, proveedorId: ana.id, inicio: momento(MANANA, 10) },
  }

  // Los dos pedidos salen sin esperar el resultado del otro: es lo más parecido a «al mismo
  // instante» que se puede montar desde una prueba.
  const [una, otra] = await Promise.all([
    navegador("/api/citas", pedido),
    otroNavegador("/api/citas", pedido),
  ])

  const estados = [una.estado, otra.estado].sort()

  // Exactamente uno crea la cita, y el otro recibe el aviso de que ya no está disponible (RF-9).
  assert.deepEqual(estados, [201, 409])

  const perdedora = una.estado === 409 ? una : otra
  assert.equal(perdedora.cuerpo.error, "horario_no_disponible")

  // Y en la base quedó UNA sola cita activa para ese horario. Esto es lo que de verdad comprueba
  // CA-1: si las dos inserciones hubieran pasado, acá habría dos.
  const cuantas = entorno.base
    .prepare("SELECT COUNT(*) AS cuantas FROM cita WHERE proveedor_id = ? AND inicio = ? AND estado = 'activa'")
    .get(ana.id, momento(MANANA, 10))

  assert.equal(cuantas.cuantas, 1)
})

test("CA-1: un horario que otro cliente ya tomó se rechaza con 409", async (t) => {
  const { entorno, reservar, masaje, ana } = await prepararReservas(t)

  const otroNavegador = crearNavegador(entorno)
  await entrarComoOtroCliente(otroNavegador)
  await otroNavegador("/api/citas", {
    method: "POST",
    cuerpo: { servicioId: masaje.id, proveedorId: ana.id, inicio: momento(MANANA, 10) },
  })

  // Misma regla que la carrera, pero sin carrera: el horario ya estaba ocupado desde antes (RN-1).
  const respuesta = await reservar(momento(MANANA, 10))

  assert.equal(respuesta.estado, 409)
  assert.equal(respuesta.cuerpo.error, "horario_no_disponible")
})

test("un horario cuya cita se canceló vuelve a poder reservarse (RN-7)", async (t) => {
  const { entorno, reservar, ana } = await prepararReservas(t)

  const primera = await reservar(momento(MANANA, 10))
  assert.equal(primera.estado, 201)

  // Cancelar es de la pieza 5, así que acá se cambia el estado a mano: lo que se comprueba es que
  // el candado que protege CA-1 mira SOLO las citas activas. Si fuera un candado sobre el horario
  // sin más, una cita cancelada bloquearía su horario para siempre y RN-7 sería imposible.
  entorno.base.prepare("UPDATE cita SET estado = 'cancelada' WHERE id = ?").run(primera.cuerpo.id)

  const segunda = await reservar(momento(MANANA, 10))

  assert.equal(segunda.estado, 201)

  const activas = entorno.base
    .prepare("SELECT COUNT(*) AS cuantas FROM cita WHERE proveedor_id = ? AND inicio = ? AND estado = 'activa'")
    .get(ana.id, momento(MANANA, 10))

  assert.equal(activas.cuantas, 1)
  // Y la cancelada sigue guardada: nada se borra (RN-15).
  const total = entorno.base.prepare("SELECT COUNT(*) AS cuantas FROM cita").get()
  assert.equal(total.cuantas, 2)
})

// ══════════════════════════════════════════════════════ CA-2: no hay citas para hoy

test("CA-2 (comprobación 6): reservar un horario de hoy se rechaza con 422", async (t) => {
  const { reservar } = await prepararReservas(t)

  // El reloj está parado a las 8 de la mañana, así que las 10 de hoy todavía no pasaron: da igual,
  // RN-4 mira el día, no la hora.
  const respuesta = await reservar(momento(HOY, 10))

  assert.equal(respuesta.estado, 422)
  assert.equal(respuesta.cuerpo.error, "mismo_dia")
})

test("CA-2: ningún horario de hoy se puede reservar, sea la hora que sea", async (t) => {
  const { reservar } = await prepararReservas(t)

  // «Sin importar la hora a la que se intente», dice CA-2. Se prueban los ocho horarios del día.
  for (const hora of [9, 10, 11, 13, 14, 15, 16, 17]) {
    const respuesta = await reservar(momento(HOY, hora))
    assert.equal(respuesta.estado, 422, `las ${hora}:00 de hoy tendrían que rechazarse`)
    assert.equal(respuesta.cuerpo.error, "mismo_dia")
  }
})

test("CA-2: un horario que ya pasó tampoco se puede reservar", async (t) => {
  const { reservar } = await prepararReservas(t)

  const respuesta = await reservar(momento(AYER, 10))

  assert.equal(respuesta.estado, 422)
  assert.equal(respuesta.cuerpo.error, "mismo_dia")
})

// ══════════════════════════════════════════════════════ los horarios que el calendario nunca ofrece
//
// Nadie puede llegar a estos casos desde la pantalla, porque el calendario no dibuja esos horarios.
// Se prueban igual: el servidor es el que manda, y una pantalla no es una defensa.

test("un horario de un feriado se rechaza (RN-2)", async (t) => {
  const { reservar } = await prepararReservas(t)

  const respuesta = await reservar(momento(FERIADO, 10))

  assert.equal(respuesta.estado, 409)
  assert.equal(respuesta.cuerpo.error, "horario_no_disponible")
})

test("un horario de un domingo se rechaza (RN-3)", async (t) => {
  const { reservar } = await prepararReservas(t)

  const respuesta = await reservar(momento(DOMINGO, 10))

  assert.equal(respuesta.estado, 409)
  assert.equal(respuesta.cuerpo.error, "horario_no_disponible")
})

test("la hora del almuerzo se rechaza (RN-3)", async (t) => {
  const { reservar } = await prepararReservas(t)

  // Las 12 de un día entre semana caen en el hueco entre los dos tramos de atención.
  const respuesta = await reservar(momento(MANANA, 12))

  assert.equal(respuesta.estado, 409)
  assert.equal(respuesta.cuerpo.error, "horario_no_disponible")
})

test("una hora fuera del horario del negocio se rechaza (RN-3)", async (t) => {
  const { reservar } = await prepararReservas(t)

  const respuesta = await reservar(momento(MANANA, 3))

  assert.equal(respuesta.estado, 409)
  assert.equal(respuesta.cuerpo.error, "horario_no_disponible")
})

// ══════════════════════════════════════════════════════ pedidos mal armados

test("un pedido sin datos se rechaza con 422", async (t) => {
  const { navegador } = await prepararReservas(t)

  const respuesta = await navegador("/api/citas", { method: "POST", cuerpo: {} })

  assert.equal(respuesta.estado, 422)
  assert.equal(respuesta.cuerpo.error, "datos_incompletos")
})

test("un momento escrito de otra forma se rechaza con 422", async (t) => {
  const { reservar } = await prepararReservas(t)

  // El proyecto tiene un solo formato para los momentos: `2026-09-02T10:00:00-06:00`. Cualquier
  // otro se rechaza en vez de intentar interpretarlo, que es de donde salen los errores de fechas.
  for (const malEscrito of [
    "2026-09-02T10:00:00Z",
    "2026-09-02 10:00",
    "2026-09-02T10:30:00-06:00",
    "mañana a las diez",
  ]) {
    const respuesta = await reservar(malEscrito)
    assert.equal(respuesta.estado, 422, `«${malEscrito}» tendría que rechazarse`)
    assert.equal(respuesta.cuerpo.error, "datos_incompletos")
  }
})

test("un proveedor que no atiende ese servicio se rechaza con 404", async (t) => {
  const { navegador, reservar } = await prepararReservas(t)

  const servicios = await navegador("/api/servicios")
  const facial = buscarPorNombre(servicios.cuerpo, "Limpieza facial")
  const proveedoresDelFacial = await navegador(`/api/servicios/${facial.id}/proveedores`)

  // Carlos atiende el masaje, no la limpieza facial. Pedir esa combinación es pedir una cita que
  // nadie puede dar.
  assert.equal(buscarPorNombre(proveedoresDelFacial.cuerpo, "Carlos"), undefined)

  const proveedoresDelMasaje = await navegador(
    `/api/servicios/${buscarPorNombre(servicios.cuerpo, "Masaje relajante").id}/proveedores`,
  )
  const carlos = buscarPorNombre(proveedoresDelMasaje.cuerpo, "Carlos")

  const respuesta = await reservar(momento(MANANA, 10), {
    servicioId: facial.id,
    proveedorId: carlos.id,
  })

  assert.equal(respuesta.estado, 404)
  assert.equal(respuesta.cuerpo.error, "servicio_o_proveedor_no_encontrado")
})
