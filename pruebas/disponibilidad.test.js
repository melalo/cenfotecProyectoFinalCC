// Pruebas de la pieza 2, segunda mitad: el calendario y el cálculo de disponibilidad.
//
// Esta es la parte más delicada del proyecto: `PROYECTO.md` §7.6 pide vigilar que la lógica de
// calendario no *parezca* correcta y falle en los casos borde —feriados, almuerzo, cambio de mes—.
// Por eso cada caso borde tiene su propia prueba.
//
// Todas paran el reloj en el mismo momento (`MOMENTO_DE_PRUEBA`: martes 1 de setiembre de 2026,
// 8 de la mañana en Costa Rica). Sin eso, «mañana hay horarios» fallaría los sábados y «hoy no
// ofrece nada» dependería del día en que alguien corriera las pruebas.
//
// Se escribieron antes que el código y se vieron fallar primero.

import test from "node:test"
import assert from "node:assert/strict"

import {
  crearEntornoDePrueba,
  crearNavegador,
  entrarComoClienta,
  buscarPorNombre,
  diaDelCalendario,
  relojDetenidoEn,
  MOMENTO_DE_PRUEBA,
} from "./ayudas.js"

/**
 * Levanta la aplicación con el reloj parado, entra como clienta, y devuelve todo lo que las
 * pruebas de acá abajo necesitan: el navegador y los identificadores del masaje, de Ana y de
 * Carlos.
 */
async function prepararCalendario(contexto) {
  const entorno = await crearEntornoDePrueba(contexto, { reloj: relojDetenidoEn(MOMENTO_DE_PRUEBA) })
  const navegador = crearNavegador(entorno)
  await entrarComoClienta(navegador)

  const servicios = await navegador("/api/servicios")
  const masaje = buscarPorNombre(servicios.cuerpo, "Masaje relajante")

  const proveedores = await navegador(`/api/servicios/${masaje.id}/proveedores`)
  const ana = buscarPorNombre(proveedores.cuerpo, "Ana")
  const carlos = buscarPorNombre(proveedores.cuerpo, "Carlos")

  async function verCalendario(mes, proveedor = ana) {
    return navegador(
      `/api/disponibilidad?servicioId=${masaje.id}&proveedorId=${proveedor.id}&mes=${mes}`,
    )
  }

  return { entorno, navegador, masaje, ana, carlos, verCalendario }
}

/** Cuenta cuántos horarios de un día se pueden tomar. */
function cuantosLibres(dia) {
  return dia.horarios.filter((horario) => horario.disponible).length
}

/** Las horas de los horarios de un día, escritas como números: [9, 10, 11, 13, ...]. */
function horasDelDia(dia) {
  return dia.horarios.map((horario) => Number(horario.inicio.slice(11, 13)))
}

/** Inserta una cita a mano en la base, que es lo que piden las comprobaciones de esta pieza. */
function insertarCitaAMano(entorno, { servicioId, proveedorId, inicio, estado }) {
  const clienta = entorno.base.prepare("SELECT id FROM cliente LIMIT 1").get()

  entorno.base
    .prepare(
      `INSERT INTO cita (cliente_id, servicio_id, proveedor_id, inicio, estado, creada_en, canal)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      clienta.id,
      servicioId,
      proveedorId,
      inicio,
      estado,
      "2026-09-01T08:00:00-06:00",
      "en_linea",
    )
}

test("sin sesión abierta no se puede ver el calendario", async (t) => {
  const entorno = await crearEntornoDePrueba(t, { reloj: relojDetenidoEn(MOMENTO_DE_PRUEBA) })
  const navegador = crearNavegador(entorno)

  const respuesta = await navegador("/api/disponibilidad?servicioId=1&proveedorId=1&mes=2026-09")

  assert.equal(respuesta.estado, 401)
})

test("pedir el calendario sin decir servicio, proveedor o mes se rechaza", async (t) => {
  const { navegador, masaje, ana } = await prepararCalendario(t)

  const sinMes = await navegador(`/api/disponibilidad?servicioId=${masaje.id}&proveedorId=${ana.id}`)
  assert.equal(sinMes.estado, 422)
  assert.equal(sinMes.cuerpo.error, "datos_incompletos")

  const mesMalEscrito = await navegador(
    `/api/disponibilidad?servicioId=${masaje.id}&proveedorId=${ana.id}&mes=setiembre`,
  )
  assert.equal(mesMalEscrito.estado, 422)
})

test("pedir el calendario de un proveedor que no atiende ese servicio da 404", async (t) => {
  const { navegador, ana, carlos } = await prepararCalendario(t)

  // Carlos solo atiende el masaje, así que su calendario de limpieza facial no existe.
  const servicios = await navegador("/api/servicios")
  const facial = buscarPorNombre(servicios.cuerpo, "Limpieza facial")

  const respuesta = await navegador(
    `/api/disponibilidad?servicioId=${facial.id}&proveedorId=${carlos.id}&mes=2026-09`,
  )
  assert.equal(respuesta.estado, 404)

  // Y el de Ana, que sí lo atiende, se ve bien.
  const deAna = await navegador(
    `/api/disponibilidad?servicioId=${facial.id}&proveedorId=${ana.id}&mes=2026-09`,
  )
  assert.equal(deAna.estado, 200)
})

test("el calendario del mes trae un día por cada día del mes", async (t) => {
  const { verCalendario } = await prepararCalendario(t)

  // Comprobación 3 de la pieza 2: ver el calendario del mes en curso.
  const respuesta = await verCalendario("2026-09")

  assert.equal(respuesta.estado, 200)
  assert.equal(respuesta.cuerpo.mes, "2026-09")
  assert.equal(respuesta.cuerpo.dias.length, 30, "setiembre tiene 30 días")
  assert.equal(respuesta.cuerpo.dias[0].fecha, "2026-09-01")
  assert.equal(respuesta.cuerpo.dias[29].fecha, "2026-09-30")
})

test("un miércoles sin citas tiene 8 horarios y ninguno a las 12, que es el almuerzo", async (t) => {
  const { verCalendario } = await prepararCalendario(t)

  // Comprobación 4 de la pieza 2. El miércoles 9 de setiembre de 2026 no es feriado y está en el
  // futuro respecto del momento en que se paró el reloj.
  const calendario = await verCalendario("2026-09")
  const miercoles = diaDelCalendario(calendario.cuerpo, "2026-09-09")

  assert.equal(miercoles.horarios.length, 8)
  assert.equal(cuantosLibres(miercoles), 8)
  assert.deepEqual(horasDelDia(miercoles), [9, 10, 11, 13, 14, 15, 16, 17])
  assert.ok(!horasDelDia(miercoles).includes(12), "las 12 son el almuerzo (RN-3)")
  assert.equal(miercoles.estado, "con_horarios")
})

test("un sábado sin citas tiene 4 horarios y el último es el de las 12", async (t) => {
  const { verCalendario } = await prepararCalendario(t)

  // Comprobación 5 de la pieza 2. El sábado el negocio atiende de 9 a 13, así que la última cita
  // empieza a las 12 (RN-3) — y ese día no hay almuerzo bloqueado.
  const calendario = await verCalendario("2026-09")
  const sabado = diaDelCalendario(calendario.cuerpo, "2026-09-05")

  assert.equal(sabado.horarios.length, 4)
  assert.equal(cuantosLibres(sabado), 4)
  assert.deepEqual(horasDelDia(sabado), [9, 10, 11, 12])
})

test("un domingo no ofrece ningún horario porque el negocio no abre", async (t) => {
  const { verCalendario } = await prepararCalendario(t)

  // Comprobación 6 de la pieza 2.
  const calendario = await verCalendario("2026-09")
  const domingo = diaDelCalendario(calendario.cuerpo, "2026-09-06")

  assert.equal(domingo.horarios.length, 0)
  assert.equal(domingo.estado, "cerrado")
})

test("el día de hoy no ofrece ningún horario, ni siquiera los de la tarde", async (t) => {
  const { verCalendario } = await prepararCalendario(t)

  // Comprobación 7 de la pieza 2. Hoy es martes 1 de setiembre y son las 8 de la mañana: los
  // horarios de la tarde todavía no pasaron, y aun así no se ofrecen. Es RN-4: no hay citas para
  // hoy, sin importar la hora a la que se mire.
  const calendario = await verCalendario("2026-09")
  const hoy = diaDelCalendario(calendario.cuerpo, "2026-09-01")

  assert.equal(cuantosLibres(hoy), 0)
  assert.equal(hoy.estado, "hoy_o_pasado")
})

test("un día ya pasado tampoco ofrece horarios", async (t) => {
  const { verCalendario } = await prepararCalendario(t)

  const calendario = await verCalendario("2026-08")
  const ayer = diaDelCalendario(calendario.cuerpo, "2026-08-31")

  assert.equal(cuantosLibres(ayer), 0)
  assert.equal(ayer.estado, "hoy_o_pasado")
})

test("mañana sí ofrece horarios", async (t) => {
  const { verCalendario } = await prepararCalendario(t)

  // Comprobación 8 de la pieza 2. Mañana es miércoles 2 de setiembre.
  const calendario = await verCalendario("2026-09")
  const manana = diaDelCalendario(calendario.cuerpo, "2026-09-02")

  assert.equal(cuantosLibres(manana), 8)
  assert.equal(manana.estado, "con_horarios")
})

test("el 15 de setiembre es feriado y no ofrece ningún horario", async (t) => {
  const { verCalendario } = await prepararCalendario(t)

  // Comprobación 9 de la pieza 2 (RN-2). Es martes, o sea que sería un día hábil normal si no
  // fuera feriado: por eso sirve para comprobar que el feriado es lo que lo bloquea.
  const calendario = await verCalendario("2026-09")
  const independencia = diaDelCalendario(calendario.cuerpo, "2026-09-15")

  assert.equal(independencia.esFeriado, true)
  assert.equal(independencia.estado, "feriado")
  assert.equal(cuantosLibres(independencia), 0)
  assert.ok(independencia.nombreFeriado, "el feriado tiene que decir cuál es")
})

test("al cambiar de mes los días cambian y el almuerzo se sigue respetando", async (t) => {
  const { verCalendario } = await prepararCalendario(t)

  // Comprobación 10 de la pieza 2: navegar al mes siguiente y volver.
  const octubre = await verCalendario("2026-10")
  assert.equal(octubre.cuerpo.mes, "2026-10")
  assert.equal(octubre.cuerpo.dias.length, 31, "octubre tiene 31 días")

  // Jueves 1 de octubre de 2026: día hábil, con el almuerzo bloqueado igual que en setiembre.
  const jueves = diaDelCalendario(octubre.cuerpo, "2026-10-01")
  assert.deepEqual(horasDelDia(jueves), [9, 10, 11, 13, 14, 15, 16, 17])

  // Y volver a setiembre devuelve setiembre, no una mezcla.
  const setiembre = await verCalendario("2026-09")
  assert.equal(setiembre.cuerpo.mes, "2026-09")
  assert.equal(setiembre.cuerpo.dias.length, 30)
})

test("febrero de un año bisiesto trae sus 29 días", async (t) => {
  const { verCalendario } = await prepararCalendario(t)

  // No está en las comprobaciones del plan, pero es el caso borde clásico del cambio de mes que
  // `PROYECTO.md` §7.6 manda vigilar: 2028 es bisiesto.
  const respuesta = await verCalendario("2028-02")

  assert.equal(respuesta.cuerpo.dias.length, 29)
  assert.equal(respuesta.cuerpo.dias[28].fecha, "2028-02-29")
})

test("una cita activa ocupa el horario de ese proveedor, y solo el de ese proveedor", async (t) => {
  const { entorno, verCalendario, masaje, ana, carlos } = await prepararCalendario(t)

  // Comprobación 11 de la pieza 2. La cita se inserta a mano en la base, porque reservar desde la
  // aplicación es trabajo de la pieza 3: acá solo se comprueba que el calendario la respeta.
  insertarCitaAMano(entorno, {
    servicioId: masaje.id,
    proveedorId: ana.id,
    inicio: "2026-09-02T10:00:00-06:00",
    estado: "activa",
  })

  const deAna = await verCalendario("2026-09", ana)
  const mananaDeAna = diaDelCalendario(deAna.cuerpo, "2026-09-02")
  const diezDeAna = mananaDeAna.horarios.find((horario) => horario.inicio.includes("T10:"))

  assert.equal(diezDeAna.disponible, false, "el horario tomado deja de estar libre")
  assert.equal(cuantosLibres(mananaDeAna), 7, "los otros 7 del día siguen libres")

  // Carlos no tiene nada reservado: su calendario no se ve afectado.
  const deCarlos = await verCalendario("2026-09", carlos)
  const mananaDeCarlos = diaDelCalendario(deCarlos.cuerpo, "2026-09-02")
  const diezDeCarlos = mananaDeCarlos.horarios.find((horario) => horario.inicio.includes("T10:"))

  assert.equal(diezDeCarlos.disponible, true, "la cita de Ana no ocupa el horario de Carlos")
})

test("una cita cancelada no ocupa el horario", async (t) => {
  const { entorno, verCalendario, masaje, ana } = await prepararCalendario(t)

  // RN-7: cancelar libera el horario de inmediato. La cancelación se construye en la pieza 5, pero
  // el calendario tiene que estar mirando el estado desde ya, o esa pieza no funcionaría.
  insertarCitaAMano(entorno, {
    servicioId: masaje.id,
    proveedorId: ana.id,
    inicio: "2026-09-02T10:00:00-06:00",
    estado: "cancelada",
  })

  const calendario = await verCalendario("2026-09")
  const manana = diaDelCalendario(calendario.cuerpo, "2026-09-02")

  assert.equal(cuantosLibres(manana), 8, "los 8 horarios del día siguen libres")
})

test("cuando hay agenda, el sistema dice que sí hay horarios en los próximos 7 días", async (t) => {
  const { verCalendario } = await prepararCalendario(t)

  const calendario = await verCalendario("2026-09")

  assert.equal(calendario.cuerpo.hayHorariosEnProximos7Dias, true)
})

test("cuando los próximos 7 días son feriado, el sistema avisa que no hay horarios", async (t) => {
  const { entorno, verCalendario } = await prepararCalendario(t)

  // Comprobación 12 de la pieza 2 (RN-14, RF-10). Se marcan como feriado los 7 días que siguen a
  // hoy: del miércoles 2 al martes 8 de setiembre.
  const marcar = entorno.base.prepare("INSERT INTO feriado (fecha, nombre) VALUES (?, ?)")
  for (const dia of ["02", "03", "04", "05", "06", "07", "08"]) {
    marcar.run(`2026-09-${dia}`, "Feriado inventado para la prueba")
  }

  const calendario = await verCalendario("2026-09")

  assert.equal(calendario.cuerpo.hayHorariosEnProximos7Dias, false)
})

test("con el horario del negocio vacío no hay horarios en ningún día", async (t) => {
  const { entorno, verCalendario } = await prepararCalendario(t)

  // La otra mitad de la comprobación 12: en vez de marcar feriados, se deja al negocio sin horario
  // de atención. Vaciar esta tabla no contradice RN-15 («nada se borra»): esa regla es sobre los
  // datos del negocio —citas, correos—, no sobre la configuración, que justamente se recarga.
  entorno.base.exec("DELETE FROM horario_negocio")

  const calendario = await verCalendario("2026-09")

  assert.equal(calendario.cuerpo.hayHorariosEnProximos7Dias, false)
  for (const dia of calendario.cuerpo.dias) {
    assert.equal(dia.horarios.length, 0, `el ${dia.fecha} no debería ofrecer nada`)
  }
})

test("la hora de los horarios lleva escrito el desfase de Costa Rica", async (t) => {
  const { verCalendario } = await prepararCalendario(t)

  // Sin el desfase escrito, la misma hora significaría cosas distintas según dónde se abra la
  // aplicación. Con él, «las 9 de la mañana» son las 9 del negocio y de nadie más.
  const calendario = await verCalendario("2026-09")
  const manana = diaDelCalendario(calendario.cuerpo, "2026-09-02")

  assert.equal(manana.horarios[0].inicio, "2026-09-02T09:00:00-06:00")
})
