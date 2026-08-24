// Pruebas de la pieza 8: Personal cierra las citas pasadas.
//
// Son dos cosas que llegaron juntas y conviene no confundir:
//
//   1. **Cerrar una cita** (RF-21, RN-17, RN-19): Personal marca lo que ocurrió —«completada» si el
//      cliente asistió, «no asistió» si no se presentó— y queda registrado **qué cuenta lo marcó y
//      cuándo** (REG-1). Ninguna cita llega sola a esos estados: el paso del tiempo no cierra nada.
//   2. **RN-26**, la regla que esta pieza estrenó: una cita cuya hora **ya pasó** no se puede
//      cancelar ni reagendar, **tampoco Personal**. Lo único que se le puede hacer es cerrarla.
//
// La segunda existe porque la pieza 7 dejó abierta una pregunta a propósito: RN-6 dice que Personal
// no tiene ventana de cancelación y RN-17 dice que una cita pasada sigue activa, así que las dos
// juntas le dejaban «Reagendar» y «Cancelar» debajo de una cita del mes pasado. La estudiante
// decidió el 2026-08-24 sacarlos, y la regla se escribió en `ESPECIFICACION.md` **antes** de tocar
// código.
//
// EL TRUCO DE LAS CITAS PASADAS. El API no deja crear una cita para hoy ni para ayer (RN-4), así que
// **se insertan a mano en la base**. Es la única manera de llegar a ese estado y está escrito en
// `CLAUDE.md` que está permitido: lo que sí sería trampa es insertar a mano algo que el API sí puede
// crear, porque entonces la prueba dejaría de probar el camino de verdad.
//
// El reloj está parado en `MOMENTO_DE_PRUEBA` (martes 1 de setiembre de 2026, 8 de la mañana en
// Costa Rica), igual que en las piezas 2, 3, 5 y 7. Ninguna prueba de este proyecto se cuelga del día
// en que se corre.
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
  enviadorDeMentira,
  relojDetenidoEn,
  ANA,
  BETO,
  MOMENTO_DE_PRUEBA,
  PERSONAL,
} from "./ayudas.js"

// Las fechas se escriben tal cual, no calculadas, para que la prueba diga qué día está mirando.
const HOY = "2026-09-01" // martes: el día en que está parado el reloj, a las 8 de la mañana
const MANANA = "2026-09-02" // miércoles, día hábil completo
const AYER = "2026-08-31" // lunes, ya pasado
const ANTEAYER = "2026-08-30" // domingo, ya pasado

/** Un momento escrito como lo escribe todo el proyecto: `2026-09-02T10:00:00-06:00`. */
function momento(fecha, hora) {
  return `${fecha}T${String(hora).padStart(2, "0")}:00:00-06:00`
}

/**
 * Levanta la aplicación con el reloj parado y **tres navegadores**: el de Personal, el de la clienta
 * Ana y el del cliente Beto. Son tres a propósito, igual que en las pruebas de la pieza 7: cada uno
 * guarda su propia galleta de sesión, así que una prueba puede cerrar una cita como Personal y
 * después mirarla como el cliente sin que una sesión pise la otra.
 */
async function prepararCierre(contexto, opciones = {}) {
  // Reservar manda un correo desde la pieza 4. Estas pruebas no son del correo, pero sin un enviador
  // que funcione cada reserva dejaría un aviso de «falló el envío» en la salida de `npm test`, y una
  // salida llena de avisos de siempre enseña a no leerlos.
  const enviador = opciones.enviador ?? enviadorDeMentira()

  const entorno = await crearEntornoDePrueba(contexto, {
    reloj: relojDetenidoEn(opciones.momento ?? MOMENTO_DE_PRUEBA),
    enviador,
  })

  const personal = crearNavegador(entorno)
  await entrarComoPersonal(personal)

  const cliente = crearNavegador(entorno)
  await entrarComoClienta(cliente)

  const otroCliente = crearNavegador(entorno)
  await entrarComoOtroCliente(otroCliente)

  const servicios = await personal("/api/servicios")
  const masaje = buscarPorNombre(servicios.cuerpo, "Masaje relajante")

  const proveedores = await personal(`/api/servicios/${masaje.id}/proveedores`)
  const ana = buscarPorNombre(proveedores.cuerpo, "Ana")
  const carlos = buscarPorNombre(proveedores.cuerpo, "Carlos")

  function idDelCliente(correo) {
    return entorno.base.prepare("SELECT id FROM cliente WHERE correo = ?").get(correo).id
  }

  function idDePersonal() {
    return entorno.base.prepare("SELECT id FROM personal WHERE correo = ?").get(PERSONAL.correo).id
  }

  /**
   * Mete una cita activa directamente en la base, sin pasar por el API. Por defecto es de Ana, con
   * la proveedora Ana. `opciones.correo` la pone a nombre de otro cliente y `opciones.proveedor` la
   * asigna a otro proveedor, que es lo que hace falta para tener dos citas a la misma hora sin que
   * choquen contra el índice único de la base.
   */
  function insertarCitaAMano(inicio, opciones = {}) {
    const guardada = entorno.base
      .prepare(
        `INSERT INTO cita (cliente_id, servicio_id, proveedor_id, inicio, estado, creada_en, canal)
         VALUES (?, ?, ?, ?, 'activa', '2026-08-25T09:00:00-06:00', 'en_linea')`,
      )
      .run(
        idDelCliente(opciones.correo ?? ANA.correo),
        masaje.id,
        (opciones.proveedor ?? ana).id,
        inicio,
      )

    return Number(guardada.lastInsertRowid)
  }

  /** La lista de citas por cerrar, pedida por quien se diga (Personal, si no se dice nadie). */
  async function verPorCerrar(quien = personal) {
    return quien("/api/personal/citas-por-cerrar")
  }

  /** Cierra una cita marcándola como completada o como no asistió. */
  async function cerrar(citaId, estado, quien = personal) {
    return quien(`/api/personal/citas/${citaId}/cierre`, { method: "PATCH", cuerpo: { estado } })
  }

  /** La fila cruda de la cita, para mirar qué quedó guardado de verdad y no lo que el API cuenta. */
  function filaDeLaCita(citaId) {
    return entorno.base.prepare("SELECT * FROM cita WHERE id = ?").get(citaId)
  }

  return {
    entorno,
    personal,
    cliente,
    otroCliente,
    masaje,
    ana,
    carlos,
    idDelCliente,
    idDePersonal,
    insertarCitaAMano,
    verPorCerrar,
    cerrar,
    filaDeLaCita,
  }
}

/** Busca una cita por su número dentro de una lista que devolvió el API. */
function buscarCita(lista, citaId) {
  return lista.find((cita) => cita.id === citaId)
}

// ══════════════════════════════════════════════════════ quién puede ver la lista de citas por cerrar
//
// Comprobación 7 del plan, primera mitad. El permiso **no se comprueba en el archivo de rutas**:
// vive en el guardia de `servidor/sesion.js`, que es donde `CLAUDE.md` dice que viven los tres.

test("sin sesión no se puede ver la lista de citas por cerrar", async (contexto) => {
  const { entorno } = await prepararCierre(contexto)
  const sinSesion = crearNavegador(entorno)

  const respuesta = await sinSesion("/api/personal/citas-por-cerrar")

  assert.equal(respuesta.estado, 401)
  assert.equal(respuesta.cuerpo.error, "sin_sesion")
})

test("un cliente no puede ver la lista de citas por cerrar", async (contexto) => {
  const { verPorCerrar, cliente } = await prepararCierre(contexto)

  const respuesta = await verPorCerrar(cliente)

  assert.equal(respuesta.estado, 403)
  assert.equal(respuesta.cuerpo.error, "solo_personal")
})

// ══════════════════════════════════════════════════════ qué trae la lista (RF-21)

test("comprobaciones 1 y 2: las dos citas pasadas de dos clientes distintos aparecen en la lista", async (contexto) => {
  const { insertarCitaAMano, verPorCerrar, carlos } = await prepararCierre(contexto)

  // Ayer a las 10 y ayer a las 11: las dos ya pasaron, con el reloj parado hoy a las 8 de la mañana.
  // La segunda es de Beto y con otro proveedor, para que sean de verdad dos personas distintas.
  const deAna = insertarCitaAMano(momento(AYER, 10))
  const deBeto = insertarCitaAMano(momento(AYER, 11), { correo: BETO.correo, proveedor: carlos })

  const respuesta = await verPorCerrar()

  assert.equal(respuesta.estado, 200)
  assert.equal(respuesta.cuerpo.length, 2)

  const primera = buscarCita(respuesta.cuerpo, deAna)
  assert.equal(primera.cliente, ANA.nombre, "la lista dice de quién es cada cita")
  assert.equal(primera.servicio, "Masaje relajante")
  assert.equal(primera.proveedor, "Ana")
  assert.equal(primera.inicio, momento(AYER, 10))

  assert.equal(buscarCita(respuesta.cuerpo, deBeto).cliente, BETO.nombre)
})

test("la lista viene de la más vieja a la más nueva: la que más tiempo lleva sin cerrar va primero", async (contexto) => {
  const { insertarCitaAMano, verPorCerrar, carlos } = await prepararCierre(contexto)

  // Se insertan al revés a propósito: si la lista saliera en el orden en que se guardaron, esta
  // prueba pasaría por casualidad y no comprobaría nada.
  const deAyer = insertarCitaAMano(momento(AYER, 10))
  const deAnteayer = insertarCitaAMano(momento(ANTEAYER, 10), { proveedor: carlos })

  const respuesta = await verPorCerrar()

  assert.deepEqual(
    respuesta.cuerpo.map((cita) => cita.id),
    [deAnteayer, deAyer],
  )
})

test("una cita del futuro no aparece en la lista de citas por cerrar", async (contexto) => {
  const { insertarCitaAMano, verPorCerrar } = await prepararCierre(contexto)

  insertarCitaAMano(momento(MANANA, 10))

  const respuesta = await verPorCerrar()

  assert.deepEqual(respuesta.cuerpo, [], "todavía no ocurrió: no hay nada que cerrar")
})

test("una cita de hoy que todavía no empezó tampoco aparece", async (contexto) => {
  const { insertarCitaAMano, verPorCerrar } = await prepararCierre(contexto)

  // Hoy a las 10, con el reloj parado a las 8: empieza dentro de 2 horas.
  insertarCitaAMano(momento(HOY, 10))

  const respuesta = await verPorCerrar()

  assert.deepEqual(respuesta.cuerpo, [])
})

test("una cita cancelada no aparece en la lista, aunque su hora ya haya pasado", async (contexto) => {
  const { insertarCitaAMano, verPorCerrar, entorno } = await prepararCierre(contexto)

  const citaId = insertarCitaAMano(momento(AYER, 10))
  entorno.base.prepare("UPDATE cita SET estado = 'cancelada' WHERE id = ?").run(citaId)

  const respuesta = await verPorCerrar()

  assert.deepEqual(respuesta.cuerpo, [], "ya no está activa: no hay nada que cerrar")
})

// ══════════════════════════════════════════════════════ cerrar la cita (RF-21, REG-1)

test("comprobaciones 3 y 4: marcar una completada y la otra no asistió deja las dos guardadas, con quién y cuándo", async (contexto) => {
  const { insertarCitaAMano, cerrar, filaDeLaCita, idDePersonal, carlos } =
    await prepararCierre(contexto)

  const asistio = insertarCitaAMano(momento(AYER, 10))
  const noAsistio = insertarCitaAMano(momento(AYER, 11), { correo: BETO.correo, proveedor: carlos })

  assert.equal((await cerrar(asistio, "completada")).estado, 200)
  assert.equal((await cerrar(noAsistio, "no_asistio")).estado, 200)

  const unaFila = filaDeLaCita(asistio)
  assert.equal(unaFila.estado, "completada")
  // El reloj está parado el martes 1 de setiembre a las 8 de la mañana de Costa Rica, y el momento se
  // escribe como lo escribe todo el proyecto, con su desfase al final.
  assert.equal(unaFila.cerrada_en, momento(HOY, 8))
  assert.equal(unaFila.cerrada_por, idDePersonal(), "qué cuenta de Personal la marcó (REG-1)")

  const laOtra = filaDeLaCita(noAsistio)
  assert.equal(laOtra.estado, "no_asistio")
  assert.equal(laOtra.cerrada_en, momento(HOY, 8))
  assert.equal(laOtra.cerrada_por, idDePersonal())
})

test("comprobación 5: una vez cerradas, las dos desaparecen de la lista de citas por cerrar", async (contexto) => {
  const { insertarCitaAMano, cerrar, verPorCerrar, carlos } = await prepararCierre(contexto)

  const asistio = insertarCitaAMano(momento(AYER, 10))
  const noAsistio = insertarCitaAMano(momento(AYER, 11), { correo: BETO.correo, proveedor: carlos })

  assert.equal((await verPorCerrar()).cuerpo.length, 2)

  await cerrar(asistio, "completada")
  await cerrar(noAsistio, "no_asistio")

  assert.deepEqual((await verPorCerrar()).cuerpo, [])
})

test("cerrar una cita devuelve su estado nuevo y cuándo quedó cerrada", async (contexto) => {
  const { insertarCitaAMano, cerrar } = await prepararCierre(contexto)

  const citaId = insertarCitaAMano(momento(AYER, 10))

  const respuesta = await cerrar(citaId, "completada")

  assert.equal(respuesta.estado, 200)
  assert.deepEqual(respuesta.cuerpo, {
    id: citaId,
    estado: "completada",
    cerradaEn: momento(HOY, 8),
  })
})

test("comprobación 6: una cita pasada que nadie toca sigue activa (RN-17)", async (contexto) => {
  const { insertarCitaAMano, verPorCerrar, filaDeLaCita } = await prepararCierre(contexto)

  const sinTocar = insertarCitaAMano(momento(ANTEAYER, 10))

  // Se pide la lista tres veces, que es lo más parecido a «esperar y recargar» que puede hacer una
  // prueba: si algo cerrara las citas solo por mirarlas o por el paso del tiempo, se vería acá.
  await verPorCerrar()
  await verPorCerrar()
  const ultima = await verPorCerrar()

  assert.equal(buscarCita(ultima.cuerpo, sinTocar).id, sinTocar, "sigue esperando que la cierren")

  const fila = filaDeLaCita(sinTocar)
  assert.equal(fila.estado, "activa", "ningún estado se alcanza por el solo paso del tiempo")
  assert.equal(fila.cerrada_en, null)
  assert.equal(fila.cerrada_por, null)
})

test("nada se borra al cerrar: la cita sigue en la base y el cliente la sigue viendo (RN-15)", async (contexto) => {
  const { insertarCitaAMano, cerrar, cliente } = await prepararCierre(contexto)

  const citaId = insertarCitaAMano(momento(AYER, 10))
  await cerrar(citaId, "no_asistio")

  const citas = await cliente("/api/citas")
  const cita = buscarCita(citas.cuerpo, citaId)

  assert.equal(cita.estado, "no_asistio", "la cita perdida deja constancia de por qué se perdió")
  assert.equal(cita.grupo, "historial")
})

// ══════════════════════════════════════════════════════ lo que NO se puede cerrar

test("comprobación 7: un cliente no puede cerrar una cita, ni siquiera la suya", async (contexto) => {
  const { insertarCitaAMano, cerrar, cliente, filaDeLaCita } = await prepararCierre(contexto)

  const citaId = insertarCitaAMano(momento(AYER, 10))

  const respuesta = await cerrar(citaId, "completada", cliente)

  assert.equal(respuesta.estado, 403)
  assert.equal(respuesta.cuerpo.error, "solo_personal")
  assert.equal(filaDeLaCita(citaId).estado, "activa", "y no la tocó")
})

test("sin sesión tampoco se puede cerrar una cita", async (contexto) => {
  const { insertarCitaAMano, entorno } = await prepararCierre(contexto)
  const sinSesion = crearNavegador(entorno)

  const citaId = insertarCitaAMano(momento(AYER, 10))

  const respuesta = await sinSesion(`/api/personal/citas/${citaId}/cierre`, {
    method: "PATCH",
    cuerpo: { estado: "completada" },
  })

  assert.equal(respuesta.estado, 401)
  assert.equal(respuesta.cuerpo.error, "sin_sesion")
})

test("comprobación 8: una cita ya cerrada no se puede volver a cerrar con otro estado", async (contexto) => {
  const { insertarCitaAMano, cerrar, filaDeLaCita } = await prepararCierre(contexto)

  const citaId = insertarCitaAMano(momento(AYER, 10))
  await cerrar(citaId, "completada")

  const otraVez = await cerrar(citaId, "no_asistio")

  assert.equal(otraVez.estado, 409)
  assert.equal(otraVez.cuerpo.error, "cita_no_activa")
  assert.equal(filaDeLaCita(citaId).estado, "completada", "el primer cierre es el que vale")
})

test("una cita cancelada tampoco se puede cerrar", async (contexto) => {
  const { insertarCitaAMano, cerrar, entorno } = await prepararCierre(contexto)

  const citaId = insertarCitaAMano(momento(AYER, 10))
  entorno.base.prepare("UPDATE cita SET estado = 'cancelada' WHERE id = ?").run(citaId)

  const respuesta = await cerrar(citaId, "completada")

  assert.equal(respuesta.estado, 409)
  assert.equal(respuesta.cuerpo.error, "cita_no_activa")
})

test("una cita que TODAVÍA no ocurrió no se puede cerrar (RN-17)", async (contexto) => {
  const { insertarCitaAMano, cerrar, filaDeLaCita } = await prepararCierre(contexto)

  // Mañana a las 10. RN-17 dice que «completada» se marca **después de que el cliente asistió**, y
  // nadie asistió todavía a una cita que no ocurrió. Sin esta comprobación, una asistente podría
  // marcar como completada una cita de la semana que viene y la etiqueta se desdiría después.
  const citaId = insertarCitaAMano(momento(MANANA, 10))

  const respuesta = await cerrar(citaId, "completada")

  assert.equal(respuesta.estado, 422)
  assert.equal(respuesta.cuerpo.error, "todavia_no_paso")
  assert.equal(filaDeLaCita(citaId).estado, "activa")
})

test("un estado que no es «completada» ni «no_asistio» se rechaza", async (contexto) => {
  const { insertarCitaAMano, cerrar, filaDeLaCita } = await prepararCierre(contexto)

  const citaId = insertarCitaAMano(momento(AYER, 10))

  for (const inventado of ["cancelada", "activa", "COMPLETADA", "", null]) {
    const respuesta = await cerrar(citaId, inventado)

    assert.equal(respuesta.estado, 422, `«${inventado}» no es un cierre válido`)
    assert.equal(respuesta.cuerpo.error, "datos_incompletos")
  }

  assert.equal(filaDeLaCita(citaId).estado, "activa", "ninguno de los intentos la tocó")
})

test("cerrar una cita que no existe devuelve 404", async (contexto) => {
  const { cerrar } = await prepararCierre(contexto)

  const respuesta = await cerrar(99999, "completada")

  assert.equal(respuesta.estado, 404)
  assert.equal(respuesta.cuerpo.error, "cita_no_encontrada")
})

// ══════════════════════════════════════════════════════ RN-26: una cita pasada ya no se cambia
//
// Comprobación 9 del plan. Es la regla que esta pieza estrenó, y la que resuelve la pregunta que la
// pieza 7 dejó abierta a propósito.
//
// El motivo es **`ya_paso` y no `ventana_de_cancelacion`**, y para los dos actores. Hasta el
// 2026-08-24 una cita pasada se le rechazaba al cliente diciendo «faltan menos de 4 horas» —cierto
// como cuenta, falso como explicación— y a Personal no se le rechazaba nada, porque él no tiene
// ventana. Ahora la regla dice lo que de verdad pasa.

test("comprobación 9: Personal no puede cancelar una cita que ya pasó (RN-26)", async (contexto) => {
  const { insertarCitaAMano, personal, filaDeLaCita } = await prepararCierre(contexto)

  const citaId = insertarCitaAMano(momento(AYER, 10))

  const respuesta = await personal(`/api/citas/${citaId}`, { method: "DELETE" })

  assert.equal(respuesta.estado, 422)
  assert.equal(respuesta.cuerpo.error, "ya_paso")
  assert.equal(filaDeLaCita(citaId).estado, "activa", "sigue esperando que la cierren")
})

test("comprobación 9: Personal tampoco puede reagendar una cita que ya pasó (RN-26)", async (contexto) => {
  const { insertarCitaAMano, personal, filaDeLaCita } = await prepararCierre(contexto)

  const citaId = insertarCitaAMano(momento(AYER, 10))

  const respuesta = await personal(`/api/citas/${citaId}`, {
    method: "PATCH",
    cuerpo: { inicio: momento(MANANA, 15) },
  })

  assert.equal(respuesta.estado, 422)
  assert.equal(respuesta.cuerpo.error, "ya_paso")
  // Lo que RN-26 protege, en una línea: mover esta cita borraría del registro que el cliente faltó.
  assert.equal(filaDeLaCita(citaId).inicio, momento(AYER, 10), "y no se movió de su día")
})

test("comprobación 9: el cliente tampoco, y ahora se lo dice con el motivo correcto", async (contexto) => {
  const { insertarCitaAMano, cliente } = await prepararCierre(contexto)

  const citaId = insertarCitaAMano(momento(AYER, 10))

  const respuesta = await cliente(`/api/citas/${citaId}`, { method: "DELETE" })

  assert.equal(respuesta.estado, 422)
  assert.equal(respuesta.cuerpo.error, "ya_paso")
})

test("una cita pasada le llega a Personal sin botones de cambiar, con el motivo «ya_paso»", async (contexto) => {
  const { insertarCitaAMano, personal, idDelCliente } = await prepararCierre(contexto)

  const citaId = insertarCitaAMano(momento(AYER, 10))

  const respuesta = await personal(`/api/personal/clientes/${idDelCliente(ANA.correo)}/citas`)
  const cita = buscarCita(respuesta.cuerpo, citaId)

  assert.equal(cita.sePuedeCambiar, false, "ni Reagendar ni Cancelar (RN-26)")
  assert.equal(cita.porQueNo, "ya_paso")
})

test("y al cliente le llega igual: la regla alcanza a los dos", async (contexto) => {
  const { insertarCitaAMano, cliente } = await prepararCierre(contexto)

  const citaId = insertarCitaAMano(momento(AYER, 10))

  const respuesta = await cliente("/api/citas")
  const cita = buscarCita(respuesta.cuerpo, citaId)

  assert.equal(cita.sePuedeCambiar, false)
  assert.equal(cita.porQueNo, "ya_paso")
})

// ══════════════════════════════════════════════════════ y lo que RN-26 NO se llevó por delante
//
// Comprobación 10 del plan. **CA-3 es uno de los tres criterios de aceptación que el curso exige
// proteger con pruebas que corran en cada push**, así que una regla nueva sobre las mismas dos
// puertas tiene que demostrar que no lo tocó. La diferencia entre las dos reglas es limpia: RN-26
// mira si la cita **ya ocurrió**, RN-6 mira **cuántas horas faltan** para una que no ocurrió.

test("comprobación 10: una cita de hoy que empieza en 2 horas Personal SÍ la puede cancelar (RN-6, CA-3)", async (contexto) => {
  const { insertarCitaAMano, personal, filaDeLaCita } = await prepararCierre(contexto)

  const citaId = insertarCitaAMano(momento(HOY, 10))

  const respuesta = await personal(`/api/citas/${citaId}`, { method: "DELETE" })

  assert.equal(respuesta.estado, 204, "RN-26 no le sacó a Personal la excepción de RN-6")
  assert.equal(filaDeLaCita(citaId).estado, "cancelada")
})

test("comprobación 10: y al cliente esa misma cita le sigue diciendo lo de las 4 horas (RN-5, CA-3)", async (contexto) => {
  const { insertarCitaAMano, cliente } = await prepararCierre(contexto)

  const citaId = insertarCitaAMano(momento(HOY, 10))

  const respuesta = await cliente(`/api/citas/${citaId}`, { method: "DELETE" })

  assert.equal(respuesta.estado, 422)
  assert.equal(respuesta.cuerpo.error, "ventana_de_cancelacion")
})

test("comprobación 10: una cita del futuro conserva sus dos botones para los dos actores", async (contexto) => {
  const { personal, cliente, masaje, ana, idDelCliente } = await prepararCierre(contexto)

  const creada = await cliente("/api/citas", {
    method: "POST",
    cuerpo: { servicioId: masaje.id, proveedorId: ana.id, inicio: momento(MANANA, 10) },
  })
  const citaId = creada.cuerpo.id

  const vistaPorElCliente = buscarCita((await cliente("/api/citas")).cuerpo, citaId)
  assert.equal(vistaPorElCliente.sePuedeCambiar, true)
  assert.equal(vistaPorElCliente.porQueNo, null)

  const deLaLista = await personal(`/api/personal/clientes/${idDelCliente(ANA.correo)}/citas`)
  const vistaPorPersonal = buscarCita(deLaLista.cuerpo, citaId)
  assert.equal(vistaPorPersonal.sePuedeCambiar, true)
  assert.equal(vistaPorPersonal.porQueNo, null)
})
