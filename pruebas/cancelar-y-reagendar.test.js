// Pruebas de la pieza 5: cancelar y reagendar.
//
// Acá vive **CA-3 (parte cliente)**, el tercero de los tres criterios de aceptación de
// `ESPECIFICACION.md` y el último que faltaba cubrir: un intento del cliente de cancelar o reagendar
// faltando menos de 4 horas se rechaza. `PROYECTO.md` §7 punto 4 exige que corra en cada push, así
// que está marcada con su nombre en el título para encontrarla de un vistazo en la salida de
// `npm test`. La otra mitad de CA-3 —que Personal **sí** puede— es de la pieza 7.
//
// Todas paran el reloj en el mismo momento que las piezas 2, 3 y 4 (`MOMENTO_DE_PRUEBA`: martes 1
// de setiembre de 2026, **8 de la mañana** en Costa Rica). Eso no es un detalle de comodidad: la
// regla de esta pieza es «faltan más o menos de 4 horas», y sin una hora fija no hay contra qué
// medirlas. Con el reloj de verdad, la misma prueba diría una cosa a las 8 de la mañana y otra a
// las 8 de la noche.
//
// EL TRUCO DE LAS CITAS DENTRO DE LA VENTANA. Una cita que empieza dentro de 2 horas empieza **hoy**,
// y RN-4 prohíbe crear citas para hoy: no hay manera de fabricarla usando el API. Por eso se
// insertan a mano en la base, que es exactamente lo que pide la comprobación 6 del plan.
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
  fallaDefinitiva,
  relojDetenidoEn,
  MOMENTO_DE_PRUEBA,
  ANA,
} from "./ayudas.js"

// Las fechas se escriben tal cual, no calculadas, para que la prueba diga qué día está mirando.
// Todas se leen desde el martes 1 de setiembre de 2026, a las 8 de la mañana.
const HOY = "2026-09-01" // martes
const MANANA = "2026-09-02" // miércoles: día hábil completo, 8 horarios
const PASADO_MANANA = "2026-09-03" // jueves: otro día hábil completo

/** Un momento escrito como lo escribe todo el proyecto: `2026-09-02T10:00:00-06:00`. */
function momento(fecha, hora) {
  return `${fecha}T${String(hora).padStart(2, "0")}:00:00-06:00`
}

/**
 * Levanta la aplicación con el reloj parado, entra como Ana, y devuelve todo lo que estas pruebas
 * necesitan: el navegador, los números del masaje y de sus proveedores, y atajos para reservar,
 * cancelar, reagendar, ver el calendario y ver las citas.
 *
 * `opciones.enviador` deja que una prueba mire los correos. Cuando no se pasa se usa uno de mentira
 * que funciona, para que la salida de `npm test` no se llene de avisos de «falló el envío» que nadie
 * va a leer.
 *
 * `opciones.momento` deja parar el reloj en otra hora. Solo lo usa la prueba del borde exacto de la
 * ventana de 4 horas, que necesita mover el reloj un minuto.
 */
async function prepararCitas(contexto, opciones = {}) {
  const enviador = opciones.enviador ?? enviadorDeMentira()

  const entorno = await crearEntornoDePrueba(contexto, {
    reloj: relojDetenidoEn(opciones.momento ?? MOMENTO_DE_PRUEBA),
    enviador,
  })
  const navegador = crearNavegador(entorno)
  await entrarComoClienta(navegador)

  const servicios = await navegador("/api/servicios")
  const masaje = buscarPorNombre(servicios.cuerpo, "Masaje relajante")

  const proveedores = await navegador(`/api/servicios/${masaje.id}/proveedores`)
  const ana = buscarPorNombre(proveedores.cuerpo, "Ana")
  const carlos = buscarPorNombre(proveedores.cuerpo, "Carlos")

  async function reservar(inicio, extras = {}) {
    const quien = extras.navegador ?? navegador

    return quien("/api/citas", {
      method: "POST",
      cuerpo: {
        servicioId: extras.servicioId ?? masaje.id,
        proveedorId: extras.proveedorId ?? ana.id,
        inicio,
      },
    })
  }

  async function cancelar(citaId, extras = {}) {
    const quien = extras.navegador ?? navegador
    return quien(`/api/citas/${citaId}`, { method: "DELETE" })
  }

  async function reagendar(citaId, cuerpo, extras = {}) {
    const quien = extras.navegador ?? navegador
    return quien(`/api/citas/${citaId}`, { method: "PATCH", cuerpo })
  }

  async function verCitas() {
    return navegador("/api/citas")
  }

  async function verCalendario(mes, proveedor = ana) {
    return navegador(
      `/api/disponibilidad?servicioId=${masaje.id}&proveedorId=${proveedor.id}&mes=${mes}`,
    )
  }

  /** El número de Ana en la tabla `cliente`, para poder insertar citas a mano. */
  function idDeAna() {
    return entorno.base.prepare("SELECT id FROM cliente WHERE correo = ?").get(ANA.correo).id
  }

  /**
   * Mete una cita activa directamente en la base, sin pasar por el API.
   *
   * Es la única manera de tener una cita que empiece **hoy**: el API no la deja crear, porque RN-4
   * prohíbe las citas para el mismo día. Es lo que pide la comprobación 6 del plan, palabra por
   * palabra: «insertar a mano una cita activa que empiece dentro de 2 horas».
   */
  function insertarCitaAMano(inicio, proveedor = ana) {
    const guardada = entorno.base
      .prepare(
        `INSERT INTO cita (cliente_id, servicio_id, proveedor_id, inicio, estado, creada_en, canal)
         VALUES (?, ?, ?, ?, 'activa', '2026-08-30T09:00:00-06:00', 'en_linea')`,
      )
      .run(idDeAna(), masaje.id, proveedor.id, inicio)

    return Number(guardada.lastInsertRowid)
  }

  /** La fila cruda de una cita, para mirar qué quedó guardado de verdad. */
  function filaDeLaCita(citaId) {
    return entorno.base.prepare("SELECT * FROM cita WHERE id = ?").get(citaId)
  }

  return {
    entorno,
    navegador,
    enviador,
    masaje,
    ana,
    carlos,
    reservar,
    cancelar,
    reagendar,
    verCitas,
    verCalendario,
    insertarCitaAMano,
    filaDeLaCita,
  }
}

/** ¿Está libre ese horario en el calendario que devolvió el servidor? */
function estaLibre(calendario, fecha, hora) {
  const dia = diaDelCalendario(calendario, fecha)
  const horario = dia.horarios.find((uno) => uno.inicio === momento(fecha, hora))
  return horario?.disponible ?? false
}

/** Busca una cita por su número en lo que devolvió `GET /api/citas`. */
function buscarCita(citas, citaId) {
  return citas.find((cita) => cita.id === citaId)
}

// ══════════════════════════════════════════════════════ quién puede cancelar y reagendar

test("sin sesión abierta no se puede cancelar una cita", async (t) => {
  const { entorno } = await prepararCitas(t)
  const sinSesion = crearNavegador(entorno)

  const respuesta = await sinSesion("/api/citas/1", { method: "DELETE" })

  assert.equal(respuesta.estado, 401)
  assert.equal(respuesta.cuerpo.error, "sin_sesion")
})

test("sin sesión abierta no se puede reagendar una cita", async (t) => {
  const { entorno } = await prepararCitas(t)
  const sinSesion = crearNavegador(entorno)

  const respuesta = await sinSesion("/api/citas/1", {
    method: "PATCH",
    cuerpo: { inicio: momento(MANANA, 11) },
  })

  assert.equal(respuesta.estado, 401)
  assert.equal(respuesta.cuerpo.error, "sin_sesion")
})

test("desde la pieza 7, la cuenta de Personal SÍ cancela desde estos endpoints", async (t) => {
  const { entorno, reservar, filaDeLaCita } = await prepararCitas(t)
  const reservada = await reservar(momento(MANANA, 10))

  const personal = crearNavegador(entorno)
  await entrarComoPersonal(personal)

  const respuesta = await personal(`/api/citas/${reservada.cuerpo.id}`, { method: "DELETE" })

  // ── Esta prueba cambió al construir la pieza 7, el 2026-08-21 ──────────────────────────────
  //
  // Hasta entonces decía `403 solo_clientes`, y su título terminaba en «eso es la pieza 7». Ya
  // llegó: **es el mismo endpoint**, y lo único que cambia es el `quien` que baja a `reservas.js`
  // (RF-18, RN-6). No se escribió ninguna puerta aparte para Personal, justamente para no tener la
  // regla de las 4 horas escrita dos veces.
  //
  // Acá se comprueba una cita normal, con días de anticipación. La que importa de verdad —una cita
  // que empieza dentro de 2 horas, que al cliente se le rechaza y a Personal se le acepta— es
  // **CA-3**, y vive en `pruebas/personal.test.js` con las otras de esa pieza.
  assert.equal(respuesta.estado, 204)
  assert.equal(filaDeLaCita(reservada.cuerpo.id).cancelada_por, "personal")
})

test("nadie puede cancelar la cita de otra persona, y el sistema no delata que existe", async (t) => {
  const { entorno, reservar, cancelar } = await prepararCitas(t)
  const deAna = await reservar(momento(MANANA, 10))

  const otro = crearNavegador(entorno)
  await entrarComoOtroCliente(otro)

  const respuesta = await cancelar(deAna.cuerpo.id, { navegador: otro })

  // 404 y no 403 a propósito: un 403 le confirmaría a quien pregunta que ese número de cita existe.
  assert.equal(respuesta.estado, 404)
  assert.equal(respuesta.cuerpo.error, "cita_no_encontrada")

  // Y la cita de Ana sigue intacta.
  const citas = await entorno.base.prepare("SELECT estado FROM cita WHERE id = ?").get(deAna.cuerpo.id)
  assert.equal(citas.estado, "activa")
})

test("cancelar una cita que no existe devuelve 404", async (t) => {
  const { cancelar } = await prepararCitas(t)

  const respuesta = await cancelar(99999)

  assert.equal(respuesta.estado, 404)
  assert.equal(respuesta.cuerpo.error, "cita_no_encontrada")
})

// ══════════════════════════════════════════════════════ cancelar (RF-13, RN-7, RN-15, REG-1)

test("comprobación 1: el cliente cancela su cita y deja de estar activa", async (t) => {
  const { reservar, cancelar, verCitas } = await prepararCitas(t)
  const reservada = await reservar(momento(MANANA, 10))

  const respuesta = await cancelar(reservada.cuerpo.id)

  // 204 es «lo hice y no tengo nada que contarte»: no hay cuerpo que devolver.
  assert.equal(respuesta.estado, 204)
  assert.equal(respuesta.cuerpo, null)

  const citas = await verCitas()
  const cancelada = buscarCita(citas.cuerpo, reservada.cuerpo.id)

  // La cita **sigue apareciendo** en la lista, pero ya no como activa. Que siga apareciendo es a
  // propósito: nada se borra (RN-15), y el cliente tiene derecho a ver que quedó cancelada.
  assert.equal(cancelada.estado, "cancelada")
  assert.equal(
    citas.cuerpo.filter((cita) => cita.estado === "activa").length,
    0,
    "no tiene que quedar ninguna cita activa",
  )
})

test("comprobación 2: el horario cancelado vuelve a estar libre de inmediato (RN-7)", async (t) => {
  const { reservar, cancelar, verCalendario } = await prepararCitas(t)
  const reservada = await reservar(momento(MANANA, 10))

  const ocupado = await verCalendario("2026-09")
  assert.equal(estaLibre(ocupado.cuerpo, MANANA, 10), false, "recién reservado no puede estar libre")

  await cancelar(reservada.cuerpo.id)

  const despues = await verCalendario("2026-09")
  assert.equal(estaLibre(despues.cuerpo, MANANA, 10), true, "cancelada, el horario se libera")
})

test("comprobación 2 bis: el horario liberado lo puede tomar otra persona", async (t) => {
  const { entorno, reservar, cancelar } = await prepararCitas(t)
  const deAna = await reservar(momento(MANANA, 10))
  await cancelar(deAna.cuerpo.id)

  const otro = crearNavegador(entorno)
  await entrarComoOtroCliente(otro)

  // RN-7 dice «vuelve a quedar disponible para cualquier otro cliente», no solo para quien canceló.
  const deBeto = await reservar(momento(MANANA, 10), { navegador: otro })

  assert.equal(deBeto.estado, 201)
})

test("comprobación 3: la fila no se borra — queda con estado, fecha y quién canceló (RN-15, REG-1)", async (t) => {
  const { reservar, cancelar, filaDeLaCita } = await prepararCitas(t)
  const reservada = await reservar(momento(MANANA, 10))

  await cancelar(reservada.cuerpo.id)

  const fila = filaDeLaCita(reservada.cuerpo.id)

  assert.ok(fila, "la fila tiene que seguir existiendo: nada se borra (RN-15)")
  assert.equal(fila.estado, "cancelada")
  assert.equal(fila.cancelada_por, "cliente")
  // El momento de la cancelación se escribe con el reloj del negocio, con segundos y su desfase,
  // igual que `creada_en`. El reloj está parado a las 8 de la mañana del 1 de setiembre.
  assert.equal(fila.cancelada_en, "2026-09-01T08:00:00-06:00")
  // Lo demás no se toca: el horario viejo queda escrito, que es lo que hace útil el registro.
  assert.equal(fila.inicio, momento(MANANA, 10))
})

test("una cita ya cancelada no se puede cancelar otra vez", async (t) => {
  const { reservar, cancelar } = await prepararCitas(t)
  const reservada = await reservar(momento(MANANA, 10))

  await cancelar(reservada.cuerpo.id)
  const segundaVez = await cancelar(reservada.cuerpo.id)

  assert.equal(segundaVez.estado, 409)
  assert.equal(segundaVez.cuerpo.error, "cita_no_activa")
})

test("cancelar no manda ningún correo", async (t) => {
  const { entorno, reservar, cancelar, enviador } = await prepararCitas(t)
  const reservada = await reservar(momento(MANANA, 10))

  // Reservar sí manda uno (RF-11). Se cuenta desde acá para ver que cancelar no suma ninguno.
  const correosDespuesDeReservar = enviador.enviados.length

  await cancelar(reservada.cuerpo.id)

  assert.equal(enviador.enviados.length, correosDespuesDeReservar)

  const filas = entorno.base
    .prepare("SELECT COUNT(*) AS cuantos FROM correo_enviado WHERE cita_id = ?")
    .get(reservada.cuerpo.id)
  assert.equal(filas.cuantos, 1, "solo la confirmación de la reserva")
})

// ══════════════════════════════════════════════════════ reagendar (RF-14, RN-18)

test("comprobación 4: reagendar mueve la cita — el horario nuevo queda ocupado y el viejo libre", async (t) => {
  const { reservar, reagendar, verCalendario } = await prepararCitas(t)
  const reservada = await reservar(momento(MANANA, 10))

  const respuesta = await reagendar(reservada.cuerpo.id, { inicio: momento(PASADO_MANANA, 15) })

  assert.equal(respuesta.estado, 200)
  assert.equal(respuesta.cuerpo.id, reservada.cuerpo.id, "es la misma cita, no una nueva")
  assert.equal(respuesta.cuerpo.inicio, momento(PASADO_MANANA, 15))
  assert.equal(respuesta.cuerpo.estado, "activa")

  const calendario = await verCalendario("2026-09")
  assert.equal(estaLibre(calendario.cuerpo, MANANA, 10), true, "el viejo se liberó")
  assert.equal(estaLibre(calendario.cuerpo, PASADO_MANANA, 15), false, "el nuevo quedó ocupado")
})

test("reagendar no crea una cita nueva: sigue habiendo una sola", async (t) => {
  const { entorno, reservar, reagendar } = await prepararCitas(t)
  const reservada = await reservar(momento(MANANA, 10))

  await reagendar(reservada.cuerpo.id, { inicio: momento(PASADO_MANANA, 15) })

  const cuantas = entorno.base.prepare("SELECT COUNT(*) AS cuantas FROM cita").get()
  assert.equal(cuantas.cuantas, 1)
})

test("comprobación 5: reagendar NO cambia el servicio ni el proveedor, aunque se los manden (RN-18)", async (t) => {
  const { reservar, reagendar, filaDeLaCita, masaje, ana, carlos } = await prepararCitas(t)
  const reservada = await reservar(momento(MANANA, 10), { proveedorId: ana.id })

  // La pantalla no ofrece cambiarlos, pero una prueba que solo mirara la pantalla no demostraría
  // nada: la regla tiene que vivir en el servidor. Así que acá se le mandan a propósito, salteando
  // la pantalla, y el servidor tiene que ignorarlos.
  const respuesta = await reagendar(reservada.cuerpo.id, {
    inicio: momento(PASADO_MANANA, 15),
    proveedorId: carlos.id,
    servicioId: 99999,
  })

  assert.equal(respuesta.estado, 200)

  const fila = filaDeLaCita(reservada.cuerpo.id)
  assert.equal(fila.proveedor_id, ana.id, "el proveedor no cambia: para eso hay que cancelar")
  assert.equal(fila.servicio_id, masaje.id, "el servicio tampoco")
  assert.equal(fila.inicio, momento(PASADO_MANANA, 15), "lo único que cambia es la fecha y la hora")
})

test("reagendar a un horario que ya está ocupado se rechaza con 409", async (t) => {
  const { entorno, reservar, reagendar } = await prepararCitas(t)
  const deAna = await reservar(momento(MANANA, 10))

  const otro = crearNavegador(entorno)
  await entrarComoOtroCliente(otro)
  await reservar(momento(MANANA, 11), { navegador: otro })

  const respuesta = await reagendar(deAna.cuerpo.id, { inicio: momento(MANANA, 11) })

  assert.equal(respuesta.estado, 409)
  assert.equal(respuesta.cuerpo.error, "horario_no_disponible")
})

test("reagendar para hoy se rechaza igual que reservar para hoy (RN-4)", async (t) => {
  const { reservar, reagendar } = await prepararCitas(t)
  const reservada = await reservar(momento(MANANA, 10))

  const respuesta = await reagendar(reservada.cuerpo.id, { inicio: momento(HOY, 16) })

  assert.equal(respuesta.estado, 422)
  assert.equal(respuesta.cuerpo.error, "mismo_dia")
})

test("reagendar a un domingo o a un feriado se rechaza: es la misma regla de disponibilidad", async (t) => {
  const { reservar, reagendar } = await prepararCitas(t)
  const reservada = await reservar(momento(MANANA, 10))

  const domingo = await reagendar(reservada.cuerpo.id, { inicio: momento("2026-09-06", 10) })
  assert.equal(domingo.estado, 409)
  assert.equal(domingo.cuerpo.error, "horario_no_disponible")

  const feriado = await reagendar(reservada.cuerpo.id, { inicio: momento("2026-09-15", 10) })
  assert.equal(feriado.estado, 409)
  assert.equal(feriado.cuerpo.error, "horario_no_disponible")
})

test("reagendar con un momento mal escrito se rechaza antes de tocar la base", async (t) => {
  const { reservar, reagendar } = await prepararCitas(t)
  const reservada = await reservar(momento(MANANA, 10))

  for (const malEscrito of ["2026-09-03T15:30:00-06:00", "2026-09-03T15:00:00Z", "mañana", "", null]) {
    const respuesta = await reagendar(reservada.cuerpo.id, { inicio: malEscrito })
    assert.equal(respuesta.estado, 422, `tendría que rechazar «${malEscrito}»`)
    assert.equal(respuesta.cuerpo.error, "datos_incompletos")
  }
})

test("una cita cancelada no se puede reagendar", async (t) => {
  const { reservar, cancelar, reagendar } = await prepararCitas(t)
  const reservada = await reservar(momento(MANANA, 10))
  await cancelar(reservada.cuerpo.id)

  const respuesta = await reagendar(reservada.cuerpo.id, { inicio: momento(PASADO_MANANA, 15) })

  assert.equal(respuesta.estado, 409)
  assert.equal(respuesta.cuerpo.error, "cita_no_activa")
})

test("nadie puede reagendar la cita de otra persona", async (t) => {
  const { entorno, reservar, reagendar } = await prepararCitas(t)
  const deAna = await reservar(momento(MANANA, 10))

  const otro = crearNavegador(entorno)
  await entrarComoOtroCliente(otro)

  const respuesta = await reagendar(
    deAna.cuerpo.id,
    { inicio: momento(PASADO_MANANA, 15) },
    { navegador: otro },
  )

  assert.equal(respuesta.estado, 404)
  assert.equal(respuesta.cuerpo.error, "cita_no_encontrada")
})

// ══════════════════════════════════════════════════════ CA-3, parte cliente (RF-15, RN-5)
//
// El criterio de aceptación que esta pieza trae, y el último de los tres que faltaba. Corre en cada
// push desde que existe la integración continua.

test("CA-3 (cliente): cancelar una cita que empieza en 2 horas se rechaza con 422", async (t) => {
  const { insertarCitaAMano, cancelar } = await prepararCitas(t)

  // El reloj está parado a las 8 de la mañana de hoy, así que las 10 de hoy son «dentro de 2 horas».
  const citaId = insertarCitaAMano(momento(HOY, 10))

  const respuesta = await cancelar(citaId)

  assert.equal(respuesta.estado, 422)
  assert.equal(respuesta.cuerpo.error, "ventana_de_cancelacion")
})

test("CA-3 (cliente): reagendar esa misma cita se rechaza igual", async (t) => {
  const { insertarCitaAMano, reagendar } = await prepararCitas(t)
  const citaId = insertarCitaAMano(momento(HOY, 10))

  const respuesta = await reagendar(citaId, { inicio: momento(PASADO_MANANA, 15) })

  assert.equal(respuesta.estado, 422)
  assert.equal(respuesta.cuerpo.error, "ventana_de_cancelacion")
})

test("CA-3: el rechazo no toca la cita — sigue activa y su horario sigue ocupado", async (t) => {
  const { insertarCitaAMano, cancelar, filaDeLaCita } = await prepararCitas(t)
  const citaId = insertarCitaAMano(momento(HOY, 10))

  await cancelar(citaId)

  const fila = filaDeLaCita(citaId)
  assert.equal(fila.estado, "activa")
  assert.equal(fila.cancelada_en, null)
  assert.equal(fila.cancelada_por, null)
})

test("la ventana son 4 horas justas: a las 4 horas exactas todavía se puede cancelar", async (t) => {
  const { insertarCitaAMano, cancelar } = await prepararCitas(t)

  // 8 de la mañana + 4 horas = mediodía. RF-13 dice «si faltan 4 horas **o más**», así que este
  // caso se permite. Es el borde exacto de la regla, que es donde se equivocan las reglas escritas
  // con un «mayor que» donde iba un «mayor o igual».
  const citaId = insertarCitaAMano(momento(HOY, 12))

  const respuesta = await cancelar(citaId)

  assert.equal(respuesta.estado, 204)
})

test("la ventana son 4 horas justas: a 3 horas y 59 minutos ya no se puede", async (t) => {
  // El mismo caso de la prueba anterior con el reloj **un minuto más adelante**: a las 8:01 faltan
  // 3 horas y 59 minutos para el mediodía. Un minuto de diferencia tiene que cambiar la respuesta;
  // si no la cambiara, la regla estaría escrita con un «mayor que» donde iba un «mayor o igual», o
  // redondeando las horas a números enteros.
  const { insertarCitaAMano, cancelar } = await prepararCitas(t, {
    momento: new Date("2026-09-01T14:01:00Z"),
  })
  const citaId = insertarCitaAMano(momento(HOY, 12))

  const respuesta = await cancelar(citaId)

  assert.equal(respuesta.estado, 422)
  assert.equal(respuesta.cuerpo.error, "ventana_de_cancelacion")
})

test("una cita que ya pasó tampoco se puede cancelar desde la aplicación", async (t) => {
  const { insertarCitaAMano, cancelar } = await prepararCitas(t)

  // Ayer a las 10. Faltan −22 horas, que es menos de 4: la misma regla la cubre sin ningún caso
  // aparte. Cerrar las citas pasadas es de la pieza 8, y lo hace Personal.
  const citaId = insertarCitaAMano(momento("2026-08-31", 10))

  const respuesta = await cancelar(citaId)

  assert.equal(respuesta.estado, 422)
  assert.equal(respuesta.cuerpo.error, "ventana_de_cancelacion")
})

// ══════════════════════════════════════════════════════ el correo al reagendar (RF-11, RF-14)

test("comprobación 9: reagendar manda la confirmación con la fecha y la hora NUEVAS", async (t) => {
  const enviador = enviadorDeMentira()
  const { reservar, reagendar } = await prepararCitas(t, { enviador })

  const reservada = await reservar(momento(MANANA, 10))
  assert.equal(enviador.enviados.length, 1, "la confirmación de la reserva")

  await reagendar(reservada.cuerpo.id, { inicio: momento(PASADO_MANANA, 15) })

  assert.equal(enviador.enviados.length, 2, "y la del reagendamiento")

  const segundo = enviador.enviados[1]
  // La fecha nueva escrita en palabras, que es como la escribe la plantilla de la pieza 4.
  assert.match(segundo.html, /jueves 3 de setiembre de 2026/)
  assert.match(segundo.texto, /jueves 3 de setiembre de 2026/)
  assert.match(segundo.texto, /15:00/)
  // Y no puede decir la vieja: sería exactamente el problema que este correo existe para evitar.
  assert.doesNotMatch(segundo.texto, /miércoles 2 de setiembre de 2026/)
})

test("comprobación 9 bis: el reagendamiento deja su propia fila en correo_enviado (REG-3)", async (t) => {
  const { entorno, reservar, reagendar } = await prepararCitas(t)
  const reservada = await reservar(momento(MANANA, 10))

  await reagendar(reservada.cuerpo.id, { inicio: momento(PASADO_MANANA, 15) })

  const filas = entorno.base
    .prepare("SELECT tipo, exito FROM correo_enviado WHERE cita_id = ? ORDER BY id")
    .all(reservada.cuerpo.id)

  assert.equal(filas.length, 2, "una por la reserva y una por el reagendamiento")
  assert.deepEqual(
    filas.map((fila) => fila.tipo),
    ["confirmacion", "confirmacion"],
  )
})

test("un correo que falla no invalida el reagendamiento (RF-19)", async (t) => {
  const enviador = enviadorDeMentira(() => fallaDefinitiva())
  const { reservar, reagendar, filaDeLaCita } = await prepararCitas(t, { enviador })

  const reservada = await reservar(momento(MANANA, 10))
  const respuesta = await reagendar(reservada.cuerpo.id, { inicio: momento(PASADO_MANANA, 15) })

  // El correo se cayó, pero la cita se movió igual: es la regla que manda desde la pieza 4.
  assert.equal(respuesta.estado, 200)
  assert.equal(filaDeLaCita(reservada.cuerpo.id).inicio, momento(PASADO_MANANA, 15))
})

// ══════════════════════════════════════════════════════ lo que la pantalla necesita saber
//
// El frontend no decide reglas de negocio (`DISENO.md`, límite del componente Interfaz): si los
// botones de cancelar y reagendar aparecen o no, lo dice el servidor. Y no solo **si**: también
// **por qué**, igual que el campo `estado` de cada día del calendario.

test("cada cita dice si se puede cambiar, y cuando no, por qué", async (t) => {
  const { reservar, verCitas } = await prepararCitas(t)
  const reservada = await reservar(momento(MANANA, 10))

  const citas = await verCitas()
  const cita = buscarCita(citas.cuerpo, reservada.cuerpo.id)

  assert.equal(cita.sePuedeCambiar, true)
  assert.equal(cita.porQueNo, null)
})

test("una cita dentro de la ventana dice que no se puede cambiar, y que el motivo es la ventana", async (t) => {
  const { insertarCitaAMano, verCitas } = await prepararCitas(t)
  const citaId = insertarCitaAMano(momento(HOY, 10))

  const citas = await verCitas()
  const cita = buscarCita(citas.cuerpo, citaId)

  assert.equal(cita.sePuedeCambiar, false)
  assert.equal(cita.porQueNo, "ventana_de_cancelacion")
})

test("una cita que YA PASÓ lo dice, y no dice que faltan menos de 4 horas", async (t) => {
  const { insertarCitaAMano, verCitas } = await prepararCitas(t)

  // Ayer a las 10. El reloj está parado hoy a las 8 de la mañana, así que faltan −22 horas.
  const citaId = insertarCitaAMano(momento("2026-08-31", 10))

  const citas = await verCitas()
  const cita = buscarCita(citas.cuerpo, citaId)

  assert.equal(cita.sePuedeCambiar, false)
  // **La regla es la misma** —faltan menos de 4 horas— y el rechazo del endpoint sigue siendo
  // `ventana_de_cancelacion` (lo comprueba otra prueba más arriba). Lo que cambia es lo que la
  // pantalla tiene que **decir**: «faltan menos de 4 horas» de una cita que ya ocurrió es una frase
  // falsa. Lo encontró la estudiante mirando la pantalla el 2026-08-20, y ninguna prueba automática
  // podía verlo: ninguna lee si una frase tiene sentido.
  assert.equal(cita.porQueNo, "ya_paso")
})

test("una cita de hoy que TODAVÍA no pasó sigue diciendo que es la ventana de 4 horas", async (t) => {
  const { insertarCitaAMano, verCitas } = await prepararCitas(t)

  // Hoy a las 10, con el reloj parado a las 8: faltan 2 horas. Todavía no ocurrió, así que acá el
  // mensaje de las 4 horas **sí** es cierto y se conserva.
  const citaId = insertarCitaAMano(momento(HOY, 10))

  const citas = await verCitas()
  const cita = buscarCita(citas.cuerpo, citaId)

  assert.equal(cita.sePuedeCambiar, false)
  assert.equal(cita.porQueNo, "ventana_de_cancelacion")
})

test("una cita cancelada dice que no se puede cambiar, y que el motivo es que no está activa", async (t) => {
  const { reservar, cancelar, verCitas } = await prepararCitas(t)
  const reservada = await reservar(momento(MANANA, 10))
  await cancelar(reservada.cuerpo.id)

  const citas = await verCitas()
  const cita = buscarCita(citas.cuerpo, reservada.cuerpo.id)

  assert.equal(cita.sePuedeCambiar, false)
  assert.equal(cita.porQueNo, "cita_no_activa")
})

// ══════════════════════════════════════════════════════ en qué grupo va cada cita
//
// La pantalla muestra «Tus próximas citas» arriba y «Historial» abajo (decisión de la estudiante del
// 2026-08-20). **Quién decide en cuál va cada cita es el servidor**, en el campo `grupo`: la pantalla
// no puede calcularlo, porque depende de qué hora es y de qué estado tiene la cita, y el frontend no
// decide reglas de negocio.

test("una cita futura y activa va en las próximas", async (t) => {
  const { reservar, verCitas } = await prepararCitas(t)
  const reservada = await reservar(momento(MANANA, 10))

  const citas = await verCitas()

  assert.equal(buscarCita(citas.cuerpo, reservada.cuerpo.id).grupo, "proxima")
})

test("una cita cancelada va al historial", async (t) => {
  const { reservar, cancelar, verCitas } = await prepararCitas(t)
  const reservada = await reservar(momento(MANANA, 10))
  await cancelar(reservada.cuerpo.id)

  const citas = await verCitas()

  assert.equal(buscarCita(citas.cuerpo, reservada.cuerpo.id).grupo, "historial")
})

test("una cita que ya pasó va al historial, aunque siga activa", async (t) => {
  const { insertarCitaAMano, verCitas } = await prepararCitas(t)

  // Sigue `activa` porque cerrarla es de la pieza 8, y la cierra Personal: ninguna cita cambia de
  // estado por el solo paso del tiempo (RN-17). Pero para el cliente ya es historial.
  const citaId = insertarCitaAMano(momento("2026-08-31", 10))

  const citas = await verCitas()
  const cita = buscarCita(citas.cuerpo, citaId)

  assert.equal(cita.estado, "activa")
  assert.equal(cita.grupo, "historial")
})

test("una cita de hoy que todavía no pasó sigue siendo una cita PRÓXIMA, aunque no se pueda cambiar", async (t) => {
  const { insertarCitaAMano, verCitas } = await prepararCitas(t)

  // Hoy a las 10, con el reloj parado a las 8: faltan 2 horas. **No se puede cambiar** (RN-5), pero
  // es la cita que la persona tiene en un rato: enterrarla en el historial sería esconderle
  // justamente la más urgente. Son dos preguntas distintas —«¿se puede cambiar?» y «¿ya pasó?»— y
  // por eso son dos campos distintos.
  const citaId = insertarCitaAMano(momento(HOY, 10))

  const citas = await verCitas()
  const cita = buscarCita(citas.cuerpo, citaId)

  assert.equal(cita.grupo, "proxima")
  assert.equal(cita.sePuedeCambiar, false)
  assert.equal(cita.porQueNo, "ventana_de_cancelacion")
})

test("cada cita trae los números de su servicio y su proveedor, para poder reagendarla", async (t) => {
  const { reservar, verCitas, masaje, ana } = await prepararCitas(t)
  const reservada = await reservar(momento(MANANA, 10))

  const citas = await verCitas()
  const cita = buscarCita(citas.cuerpo, reservada.cuerpo.id)

  // Sin estos dos números la pantalla no puede pedir el calendario del mismo servicio con el mismo
  // proveedor, que es lo único que reagendar ofrece (RN-18). Los nombres siguen viniendo también.
  assert.equal(cita.servicioId, masaje.id)
  assert.equal(cita.proveedorId, ana.id)
  assert.equal(cita.servicio, "Masaje relajante")
  assert.equal(cita.proveedor, "Ana")
})
