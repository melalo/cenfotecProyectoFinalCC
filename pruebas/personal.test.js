// Pruebas de la pieza 7: Personal atiende el teléfono.
//
// Acá vive la **otra mitad de CA-3**, el tercero de los tres criterios de aceptación que
// `PROYECTO.md` §7 punto 4 exige proteger con integración continua: la pieza 5 comprobó que el
// cliente **no** puede cancelar dentro de las 4 horas, y estas comprueban que Personal **sí** puede
// (RN-6). Las dos pruebas de ese par están marcadas con `CA-3` en el título, para poder encontrarlas
// de un vistazo en la salida de `npm test`.
//
// Lo demás son las diez comprobaciones del plan: reservar en nombre de quien llama con canal
// `asistida` (RF-16, RN-12), crear la cuenta con contraseña temporal (RF-17, RN-11), y que Personal
// cumpla **las mismas reglas** que el cliente al reservar (RN-13). El cambio obligatorio de la
// contraseña temporal (RF-4) está en `cambio-de-contrasena.test.js`, porque es otro tema.
//
// Todas paran el reloj en `MOMENTO_DE_PRUEBA` (martes 1 de setiembre de 2026, 8 de la mañana en
// Costa Rica), como las de las piezas 2, 3 y 5. Ninguna prueba de este proyecto se cuelga del día en
// que se corre.
//
// Se escribieron antes que el código y se vieron fallar primero.

import test from "node:test"
import assert from "node:assert/strict"

import { queLeFaltaALaContrasena } from "../servidor/credenciales.js"
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
const HOY = "2026-09-01" // martes: el día en que está parado el reloj
const MANANA = "2026-09-02" // miércoles, día hábil completo
const PASADO_MANANA = "2026-09-03" // jueves, día hábil completo
const DOMINGO = "2026-09-06" // el negocio no abre (RN-3)
const FERIADO = "2026-09-15" // Día de la Independencia (RN-2)
const AYER = "2026-08-31" // lunes, ya pasado

/**
 * Dos relojes más, los dos parados el **mismo** martes 1 de setiembre de 2026 que
 * `MOMENTO_DE_PRUEBA`, pero más tarde en el día. Existen para RN-25: la regla de la cita de hoy solo
 * se puede comprobar sabiendo **qué hora es**, y con el reloj de las 8 de la mañana ningún horario
 * del día ha empezado todavía.
 *
 * Se escriben en hora universal (`Z`) porque así están las fechas de las pruebas de todo el
 * proyecto. Costa Rica está seis horas atrás, así que se les resta 6 para leerlas:
 *
 *   - `MEDIA_TARDE`   → 20:00 universal = **14:00 en Costa Rica**. Ya pasaron los horarios de las 9,
 *     10, 11 y 13; el de las 14 empieza **en este mismo instante**; quedan las 15, 16 y 17.
 *   - `FINAL_DEL_DIA` → 00:00 universal del día siguiente = **18:00 en Costa Rica**. El último
 *     horario del negocio empieza a las 17, así que ya no queda ninguno sin empezar.
 */
const MEDIA_TARDE = new Date("2026-09-01T20:00:00Z")
const FINAL_DEL_DIA = new Date("2026-09-02T00:00:00Z")

/** Un momento escrito como lo escribe todo el proyecto: `2026-09-02T10:00:00-06:00`. */
function momento(fecha, hora) {
  return `${fecha}T${String(hora).padStart(2, "0")}:00:00-06:00`
}

/** ¿Ese horario aparece libre en el día que devolvió el calendario? */
function estaLibre(dia, inicio) {
  return dia.horarios.find((horario) => horario.inicio === inicio)?.disponible ?? false
}

/**
 * Levanta la aplicación con el reloj parado y **tres navegadores distintos**: el de Personal, el de
 * la clienta Ana y el del cliente Beto. Son tres a propósito: cada uno guarda su propia galleta de
 * sesión, igual que tres navegadores de verdad, así que una prueba puede pedir algo como Personal y
 * después mirarlo como el cliente sin que ninguna sesión pise la otra.
 */
async function prepararPersonal(contexto, opciones = {}) {
  // Reservar manda un correo desde la pieza 4. Estas pruebas no son del correo, pero sin un
  // enviador que funcione cada reserva dejaría un aviso de «falló el envío» en la salida de
  // `npm test`, y una salida llena de avisos de siempre enseña a no leerlos.
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

  // El catálogo se pregunta con la sesión de Personal a propósito: es la que va a usar la pantalla
  // de Personal, y si esos endpoints no aceptaran su sesión, esto fallaría acá y no más adelante.
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

  /** Personal reserva a nombre de un cliente. Por defecto, masaje con Ana para la clienta Ana. */
  async function reservarPara(inicio, opciones = {}) {
    return personal("/api/citas", {
      method: "POST",
      cuerpo: {
        clienteId: opciones.clienteId ?? idDelCliente(ANA.correo),
        servicioId: opciones.servicioId ?? masaje.id,
        proveedorId: opciones.proveedorId ?? ana.id,
        inicio,
      },
    })
  }

  /** El cliente reserva por su cuenta, como en la pieza 3. Sirve para ocupar un horario. */
  async function reservarComoCliente(inicio, opciones = {}) {
    const quien = opciones.navegador ?? cliente
    return quien("/api/citas", {
      method: "POST",
      cuerpo: {
        servicioId: opciones.servicioId ?? masaje.id,
        proveedorId: opciones.proveedorId ?? ana.id,
        inicio,
        // Se manda a propósito en algunas pruebas: un cliente no puede reservarle a otro.
        ...(opciones.clienteId === undefined ? {} : { clienteId: opciones.clienteId }),
      },
    })
  }

  async function crearCuenta(datos) {
    return personal("/api/personal/clientes", { method: "POST", cuerpo: datos })
  }

  async function buscarClientes(busqueda) {
    return personal(`/api/personal/clientes?busqueda=${encodeURIComponent(busqueda)}`)
  }

  async function verCitasDelCliente(clienteId) {
    return personal(`/api/personal/clientes/${clienteId}/citas`)
  }

  /**
   * El calendario del mes, pedido con **la misma dirección** pero con dos sesiones distintas. Son dos
   * atajos y no uno porque justamente lo que hay que comprobar es que la respuesta **no sea la
   * misma**: para Personal el día de hoy ofrece horarios (RN-25) y para el cliente no (RN-4, CA-2).
   */
  function pedirCalendario(quien) {
    return (mes) =>
      quien(`/api/disponibilidad?servicioId=${masaje.id}&proveedorId=${ana.id}&mes=${mes}`)
  }

  async function cancelarComoPersonal(citaId) {
    return personal(`/api/citas/${citaId}`, { method: "DELETE" })
  }

  async function reagendarComoPersonal(citaId, inicio) {
    return personal(`/api/citas/${citaId}`, { method: "PATCH", cuerpo: { inicio } })
  }

  /**
   * Inserta una cita a mano en la base. Es la única forma de tener una cita que empiece **hoy**,
   * porque el API no deja crearla (RN-4) — y es literalmente lo que piden las comprobaciones 9 y 10
   * del plan. No es hacer trampa: es el único camino a ese estado.
   */
  function insertarCitaAMano(inicio, opciones = {}) {
    const guardada = entorno.base
      .prepare(
        `INSERT INTO cita (cliente_id, servicio_id, proveedor_id, inicio, estado, creada_en, canal)
         VALUES (?, ?, ?, ?, 'activa', '2026-08-30T09:00:00-06:00', 'en_linea')`,
      )
      .run(
        idDelCliente(opciones.correo ?? ANA.correo),
        masaje.id,
        (opciones.proveedor ?? ana).id,
        inicio,
      )

    return Number(guardada.lastInsertRowid)
  }

  /** La fila cruda de una cita, para mirar qué quedó guardado de verdad. */
  function filaDeLaCita(citaId) {
    return entorno.base.prepare("SELECT * FROM cita WHERE id = ?").get(citaId)
  }

  return {
    entorno,
    enviador,
    personal,
    cliente,
    otroCliente,
    masaje,
    ana,
    carlos,
    idDelCliente,
    idDePersonal,
    reservarPara,
    reservarComoCliente,
    crearCuenta,
    buscarClientes,
    verCitasDelCliente,
    verCalendarioComoPersonal: pedirCalendario(personal),
    verCalendarioComoCliente: pedirCalendario(cliente),
    cancelarComoPersonal,
    reagendarComoPersonal,
    insertarCitaAMano,
    filaDeLaCita,
  }
}

// ══════════════════════════════════════════════════════ quién puede abrir las puertas de Personal
//
// Las tres puertas de `/api/personal/` son solo para la cuenta del negocio. Sin sesión es `401`
// («no sé quién sos»); con la sesión de un cliente es `403` («sé quién sos y no te toca»).

test("sin sesión no se puede crear la cuenta de un cliente", async (contexto) => {
  const entorno = await crearEntornoDePrueba(contexto, {
    reloj: relojDetenidoEn(MOMENTO_DE_PRUEBA),
  })
  const nadie = crearNavegador(entorno)

  const respuesta = await nadie("/api/personal/clientes", {
    method: "POST",
    cuerpo: { nombre: "Quien Llama", correo: "nuevo@ejemplo.com" },
  })

  assert.equal(respuesta.estado, 401)
  assert.equal(respuesta.cuerpo.error, "sin_sesion")
})

test("un cliente no puede crearle la cuenta a nadie", async (contexto) => {
  const { cliente } = await prepararPersonal(contexto)

  const respuesta = await cliente("/api/personal/clientes", {
    method: "POST",
    cuerpo: { nombre: "Quien Llama", correo: "nuevo@ejemplo.com" },
  })

  assert.equal(respuesta.estado, 403)
  assert.equal(respuesta.cuerpo.error, "solo_personal")
})

test("un cliente no puede buscar clientes", async (contexto) => {
  const { cliente } = await prepararPersonal(contexto)

  const respuesta = await cliente("/api/personal/clientes?busqueda=rodr")

  assert.equal(respuesta.estado, 403)
  assert.equal(respuesta.cuerpo.error, "solo_personal")
})

test("un cliente no puede espiar las citas de otro por la puerta de Personal", async (contexto) => {
  const { cliente, idDelCliente } = await prepararPersonal(contexto)

  const respuesta = await cliente(`/api/personal/clientes/${idDelCliente(BETO.correo)}/citas`)

  assert.equal(respuesta.estado, 403)
  assert.equal(respuesta.cuerpo.error, "solo_personal")
})

// ══════════════════════════════════════════════════════ crear la cuenta de quien llama (RF-17, RN-11)
//
// Comprobación 3 del plan: «Como Personal, crear la cuenta de nuevo@ejemplo.com: la pantalla muestra
// una contraseña temporal».

test("comprobación 3: Personal crea la cuenta de quien llama y recibe una contraseña temporal", async (contexto) => {
  const { crearCuenta } = await prepararPersonal(contexto)

  const respuesta = await crearCuenta({ nombre: "Quien Llama", correo: "nuevo@ejemplo.com" })

  assert.equal(respuesta.estado, 201)
  assert.equal(respuesta.cuerpo.nombre, "Quien Llama")
  assert.equal(respuesta.cuerpo.correo, "nuevo@ejemplo.com")
  assert.ok(respuesta.cuerpo.id > 0, "la cuenta tiene que quedar creada, con su número")
  assert.equal(typeof respuesta.cuerpo.contrasenaTemporal, "string")
  assert.ok(respuesta.cuerpo.contrasenaTemporal.length > 0, "falta la contraseña temporal")
})

test("la contraseña temporal cumple las mismas reglas que cualquier otra (RN-23)", async (contexto) => {
  const { crearCuenta } = await prepararPersonal(contexto)

  // Se le pregunta a la función de verdad, la que decide en el servidor, no a una copia de la
  // regla escrita acá: si RN-23 cambia mañana, esta prueba se entera sola.
  for (let vez = 1; vez <= 6; vez++) {
    const respuesta = await crearCuenta({ nombre: "Quien Llama", correo: `n${vez}@ejemplo.com` })
    const falta = queLeFaltaALaContrasena(respuesta.cuerpo.contrasenaTemporal)

    assert.deepEqual(
      falta,
      [],
      `la contraseña temporal «${respuesta.cuerpo.contrasenaTemporal}» no cumple RN-23`,
    )
  }
})

test("dos cuentas creadas seguidas no reciben la misma contraseña temporal", async (contexto) => {
  const { crearCuenta } = await prepararPersonal(contexto)

  const contrasenas = new Set()
  for (let vez = 1; vez <= 6; vez++) {
    const respuesta = await crearCuenta({ nombre: "Quien Llama", correo: `n${vez}@ejemplo.com` })
    contrasenas.add(respuesta.cuerpo.contrasenaTemporal)
  }

  // No se pide que las seis sean distintas —el azar puede repetir— sino que no sean todas la misma,
  // que es lo que pasaría si la contraseña estuviera escrita fija en el código.
  assert.ok(contrasenas.size > 1, "la contraseña temporal tiene que ser distinta cada vez")
})

test("la cuenta nace con la contraseña temporal pendiente de cambiar (RN-11)", async (contexto) => {
  const { crearCuenta, entorno } = await prepararPersonal(contexto)

  await crearCuenta({ nombre: "Quien Llama", correo: "nuevo@ejemplo.com" })

  const fila = entorno.base
    .prepare("SELECT debe_cambiar_contrasena FROM cliente WHERE correo = ?")
    .get("nuevo@ejemplo.com")

  assert.equal(fila.debe_cambiar_contrasena, 1)
})

test("la contraseña temporal sirve para entrar", async (contexto) => {
  const { crearCuenta, entorno } = await prepararPersonal(contexto)

  const creada = await crearCuenta({ nombre: "Quien Llama", correo: "nuevo@ejemplo.com" })

  const suNavegador = crearNavegador(entorno)
  const entrada = await suNavegador("/api/sesion", {
    method: "POST",
    cuerpo: { correo: "nuevo@ejemplo.com", contrasena: creada.cuerpo.contrasenaTemporal },
  })

  assert.equal(entrada.estado, 200)
  assert.equal(entrada.cuerpo.debeCambiarContrasena, true)
})

test("Personal no puede crear una cuenta con un correo que ya tiene cuenta", async (contexto) => {
  const { crearCuenta } = await prepararPersonal(contexto)

  const respuesta = await crearCuenta({ nombre: "Otra Ana", correo: ANA.correo })

  assert.equal(respuesta.estado, 409)
  assert.equal(respuesta.cuerpo.error, "correo_ya_registrado")
})

test("tampoco con el correo de la cuenta de Personal", async (contexto) => {
  const { crearCuenta } = await prepararPersonal(contexto)

  // Si coincidiera con la cuenta de Personal, al entrar no se sabría cuál de las dos es.
  const respuesta = await crearCuenta({ nombre: "Impostora", correo: PERSONAL.correo })

  assert.equal(respuesta.estado, 409)
  assert.equal(respuesta.cuerpo.error, "correo_ya_registrado")
})

test("el correo de quien llama tiene que tener forma de correo (RN-24)", async (contexto) => {
  const { crearCuenta } = await prepararPersonal(contexto)

  const respuesta = await crearCuenta({ nombre: "Quien Llama", correo: "esto-no-es-un-correo" })

  assert.equal(respuesta.estado, 422)
  assert.equal(respuesta.cuerpo.error, "correo_invalido")
})

test("el nombre de quien llama no puede venir vacío", async (contexto) => {
  const { crearCuenta } = await prepararPersonal(contexto)

  const respuesta = await crearCuenta({ nombre: "   ", correo: "nuevo@ejemplo.com" })

  assert.equal(respuesta.estado, 422)
  assert.equal(respuesta.cuerpo.error, "datos_incompletos")
})

test("el correo de quien llama se guarda en minúscula, como todos", async (contexto) => {
  const { crearCuenta, entorno } = await prepararPersonal(contexto)

  await crearCuenta({ nombre: "Quien Llama", correo: "  Nuevo@Ejemplo.COM " })

  const fila = entorno.base
    .prepare("SELECT correo FROM cliente WHERE correo = ?")
    .get("nuevo@ejemplo.com")

  assert.ok(fila, "el correo tenía que quedar guardado en minúscula y sin espacios de sobra")
})

// ══════════════════════════════════════════════════════ buscar a quien llama

test("Personal busca a quien llama por un pedazo de su nombre", async (contexto) => {
  const { buscarClientes } = await prepararPersonal(contexto)

  const respuesta = await buscarClientes("rodr")

  assert.equal(respuesta.estado, 200)
  assert.ok(
    respuesta.cuerpo.some((uno) => uno.correo === ANA.correo),
    "Ana Rodríguez tenía que aparecer buscando «rodr»",
  )
})

test("Personal busca a quien llama por un pedazo de su correo", async (contexto) => {
  const { buscarClientes } = await prepararPersonal(contexto)

  const respuesta = await buscarClientes("beto@")

  assert.equal(respuesta.estado, 200)
  assert.ok(respuesta.cuerpo.some((uno) => uno.correo === BETO.correo))
})

test("la búsqueda no distingue mayúsculas de minúsculas", async (contexto) => {
  const { buscarClientes } = await prepararPersonal(contexto)

  const respuesta = await buscarClientes("RODR")

  assert.ok(respuesta.cuerpo.some((uno) => uno.correo === ANA.correo))
})

test("con menos de dos letras la búsqueda no devuelve nada", async (contexto) => {
  const { buscarClientes } = await prepararPersonal(contexto)

  // Decisión de la estudiante del 2026-08-21: una lista con todos deja los correos de todos los
  // clientes a la vista de cualquiera que pase por el mostrador.
  assert.deepEqual((await buscarClientes("a")).cuerpo, [])
  assert.deepEqual((await buscarClientes("")).cuerpo, [])
})

test("la búsqueda no encuentra la cuenta de Personal, solo clientes", async (contexto) => {
  const { buscarClientes } = await prepararPersonal(contexto)

  const respuesta = await buscarClientes("personal@")

  assert.deepEqual(respuesta.cuerpo, [])
})

test("la búsqueda devuelve solo el número, el nombre y el correo", async (contexto) => {
  const { buscarClientes } = await prepararPersonal(contexto)

  const respuesta = await buscarClientes("rodr")
  const encontrada = respuesta.cuerpo[0]

  // La contraseña cifrada no sale nunca del servidor, ni siquiera hacia la pantalla de Personal.
  assert.deepEqual(Object.keys(encontrada).sort(), ["correo", "id", "nombre"])
})

// ══════════════════════════════════════════════════════ reservar en nombre de quien llama
//
// Comprobaciones 1 y 2 del plan.

test("comprobación 1: Personal reserva a nombre de un cliente que ya existe, con canal asistida", async (contexto) => {
  const { reservarPara, filaDeLaCita, idDelCliente, idDePersonal } =
    await prepararPersonal(contexto)

  const respuesta = await reservarPara(momento(MANANA, 10))

  assert.equal(respuesta.estado, 201)

  const fila = filaDeLaCita(respuesta.cuerpo.id)
  assert.equal(fila.canal, "asistida", "la cita que crea Personal es asistida (RN-12)")
  assert.equal(fila.personal_id_creador, idDePersonal(), "falta la cuenta de Personal que la creó")
  assert.equal(fila.cliente_id, idDelCliente(ANA.correo), "la cita es del cliente, no de Personal")
  assert.equal(fila.estado, "activa")
})

test("comprobación 2: el cliente recibe el correo de confirmación de la cita que Personal le reservó", async (contexto) => {
  const enviador = enviadorDeMentira()
  const { reservarPara } = await prepararPersonal(contexto, { enviador })

  await reservarPara(momento(MANANA, 10))

  assert.equal(enviador.enviados.length, 1, "tenía que salir exactamente un correo")
  const correo = enviador.enviados[0]
  assert.equal(correo.para, ANA.correo, "el correo va al cliente, no a Personal")
  assert.match(correo.html, /miércoles 2 de setiembre de 2026/)
  assert.match(correo.html, /Masaje relajante/)
})

test("la cita que reservó Personal aparece en las citas del cliente", async (contexto) => {
  const { reservarPara, cliente } = await prepararPersonal(contexto)

  const creada = await reservarPara(momento(MANANA, 10))
  const susCitas = await cliente("/api/citas")

  assert.equal(susCitas.estado, 200)
  assert.ok(
    susCitas.cuerpo.some((cita) => cita.id === creada.cuerpo.id),
    "el cliente tiene que ver la cita que le reservaron por teléfono",
  )
})

test("Personal no puede reservar sin decir para quién", async (contexto) => {
  const { personal, masaje, ana } = await prepararPersonal(contexto)

  const respuesta = await personal("/api/citas", {
    method: "POST",
    cuerpo: { servicioId: masaje.id, proveedorId: ana.id, inicio: momento(MANANA, 10) },
  })

  assert.equal(respuesta.estado, 422)
  assert.equal(respuesta.cuerpo.error, "datos_incompletos")
})

test("Personal no puede reservar para un cliente que no existe", async (contexto) => {
  const { reservarPara } = await prepararPersonal(contexto)

  const respuesta = await reservarPara(momento(MANANA, 10), { clienteId: 99999 })

  assert.equal(respuesta.estado, 404)
  assert.equal(respuesta.cuerpo.error, "cliente_no_encontrado")
})

test("un cliente que manda un clienteId ajeno reserva igual para sí mismo", async (contexto) => {
  const { reservarComoCliente, filaDeLaCita, idDelCliente } = await prepararPersonal(contexto)

  // Ana manda el número de Beto adentro del pedido. La puerta del cliente **no lo mira**: la cita
  // tiene que quedar a nombre de Ana igual.
  const respuesta = await reservarComoCliente(momento(MANANA, 10), {
    clienteId: idDelCliente(BETO.correo),
  })

  assert.equal(respuesta.estado, 201)
  assert.equal(filaDeLaCita(respuesta.cuerpo.id).cliente_id, idDelCliente(ANA.correo))
})

test("una cita que reservó el cliente por su cuenta sigue quedando en línea", async (contexto) => {
  const { reservarComoCliente, filaDeLaCita } = await prepararPersonal(contexto)

  const respuesta = await reservarComoCliente(momento(MANANA, 11))

  const fila = filaDeLaCita(respuesta.cuerpo.id)
  assert.equal(fila.canal, "en_linea")
  assert.equal(fila.personal_id_creador, null)
})

// ══════════════════════════════════════════════════════ las mismas reglas para Personal (RN-13)
//
// Comprobaciones 7 y 8 del plan. La única regla que no alcanza a Personal es la ventana de las 4
// horas (RN-6); todas las demás se aplican igual, y no porque estén escritas otra vez, sino porque
// salen de `revisarHorario`, que no sabe quién pregunta.

test("comprobación 7: Personal no puede tomar un horario ya ocupado", async (contexto) => {
  const { reservarComoCliente, reservarPara } = await prepararPersonal(contexto)

  await reservarComoCliente(momento(MANANA, 10))
  const respuesta = await reservarPara(momento(MANANA, 10))

  assert.equal(respuesta.estado, 409)
  assert.equal(respuesta.cuerpo.error, "horario_no_disponible")
})

// ── La cita de hoy (RN-25) ─────────────────────────────────────────────────────────────────
//
// Comprobación 8 del plan, **corregida el 2026-08-21**: hasta ese día pedía lo contrario —«Personal
// no puede reservar para hoy, lo rechaza igual que al cliente»—. El hueco se descubrió mirando la
// pantalla: al abrir el día de hoy, Personal leía «llamá al negocio», que es un cartel diciéndole a
// la asistente del negocio que llame al negocio. La razón completa está en RN-25 de
// `ESPECIFICACION.md`, y es la misma de RN-6.
//
// **CA-2 no se toca**: el cliente sigue sin poder reservar para hoy, y eso se comprueba acá al lado
// para que las dos mitades se lean juntas.

test("comprobación 8: Personal SÍ puede reservar para hoy, si el horario no empezó (RN-25)", async (contexto) => {
  // El reloj está parado a las 8 de la mañana, así que las 10 de hoy todavía no empezaron.
  const { reservarPara, filaDeLaCita } = await prepararPersonal(contexto)

  const respuesta = await reservarPara(momento(HOY, 10))

  assert.equal(respuesta.estado, 201)
  assert.equal(filaDeLaCita(respuesta.cuerpo.id).inicio, momento(HOY, 10))
  assert.equal(filaDeLaCita(respuesta.cuerpo.id).canal, "asistida")
})

test("comprobación 8: el cliente sigue sin poder reservar para hoy (CA-2 intacto)", async (contexto) => {
  const { reservarComoCliente } = await prepararPersonal(contexto)

  const respuesta = await reservarComoCliente(momento(HOY, 10))

  assert.equal(respuesta.estado, 422)
  assert.equal(respuesta.cuerpo.error, "mismo_dia")
})

test("Personal no puede tomar un horario de hoy que ya empezó", async (contexto) => {
  // Reloj a las 2 de la tarde: las 10 de la mañana de hoy ya pasaron.
  const { reservarPara } = await prepararPersonal(contexto, { momento: MEDIA_TARDE })

  const respuesta = await reservarPara(momento(HOY, 10))

  assert.equal(respuesta.estado, 422)
  assert.equal(respuesta.cuerpo.error, "horario_ya_empezo")
})

test("el borde exacto: un horario que empieza en este mismo instante ya empezó", async (contexto) => {
  // El reloj marca las 14:00 en punto, y se intenta tomar el horario de las 14:00.
  const { reservarPara } = await prepararPersonal(contexto, { momento: MEDIA_TARDE })

  const respuesta = await reservarPara(momento(HOY, 14))

  assert.equal(respuesta.estado, 422)
  assert.equal(respuesta.cuerpo.error, "horario_ya_empezo")
})

test("y el horario siguiente sí se puede tomar: Personal no tiene ninguna ventana", async (contexto) => {
  // Son las 14:00 y se toman las 15:00. Nada le exige avisar con horas de anticipación (RN-25).
  const { reservarPara } = await prepararPersonal(contexto, { momento: MEDIA_TARDE })

  const respuesta = await reservarPara(momento(HOY, 15))

  assert.equal(respuesta.estado, 201)
})

test("Personal tampoco puede reservar en un día que ya pasó", async (contexto) => {
  const { reservarPara } = await prepararPersonal(contexto)

  const respuesta = await reservarPara(momento(AYER, 10))

  assert.equal(respuesta.estado, 422)
  assert.equal(respuesta.cuerpo.error, "horario_ya_empezo")
})

test("las reglas de agenda siguen alcanzando a Personal en el día de hoy (RN-13)", async (contexto) => {
  const { reservarPara, insertarCitaAMano } = await prepararPersonal(contexto)

  // Un horario de hoy que ya está tomado sigue estando tomado, aunque quien pida sea Personal.
  insertarCitaAMano(momento(HOY, 15))
  const ocupado = await reservarPara(momento(HOY, 15))
  assert.equal(ocupado.estado, 409)
  assert.equal(ocupado.cuerpo.error, "horario_no_disponible")

  // Y el almuerzo de hoy sigue sin ser un horario (RN-3).
  const almuerzo = await reservarPara(momento(HOY, 12))
  assert.equal(almuerzo.estado, 409)
  assert.equal(almuerzo.cuerpo.error, "horario_no_disponible")
})

test("el calendario de Personal ofrece los horarios de hoy que todavía no empezaron", async (contexto) => {
  const { verCalendarioComoPersonal } = await prepararPersonal(contexto, { momento: MEDIA_TARDE })

  const calendario = await verCalendarioComoPersonal("2026-09")
  const hoy = calendario.cuerpo.dias.find((dia) => dia.fecha === HOY)

  assert.equal(hoy.estado, "con_horarios", "hoy ya no está bloqueado para Personal")
  assert.equal(estaLibre(hoy, momento(HOY, 15)), true, "las 15:00 no empezaron, tienen que estar libres")
  assert.equal(estaLibre(hoy, momento(HOY, 10)), false, "las 10:00 ya pasaron")
  assert.equal(estaLibre(hoy, momento(HOY, 14)), false, "las 14:00 empiezan en este instante")
})

test("el calendario del cliente sigue sin ofrecer ningún horario de hoy (CA-2)", async (contexto) => {
  const { verCalendarioComoCliente } = await prepararPersonal(contexto, { momento: MEDIA_TARDE })

  const calendario = await verCalendarioComoCliente("2026-09")
  const hoy = calendario.cuerpo.dias.find((dia) => dia.fecha === HOY)

  assert.equal(hoy.estado, "hoy_o_pasado")
  assert.equal(
    hoy.horarios.every((horario) => horario.disponible === false),
    true,
    "ninguno de los horarios de hoy puede estar libre para el cliente",
  )
})

test("cuando ya no queda ningún horario de hoy sin empezar, el día vuelve a estar cerrado", async (contexto) => {
  // Las 6 de la tarde: el último horario del día empieza a las 17:00, así que ya no queda ninguno.
  const { verCalendarioComoPersonal } = await prepararPersonal(contexto, { momento: FINAL_DEL_DIA })

  const calendario = await verCalendarioComoPersonal("2026-09")
  const hoy = calendario.cuerpo.dias.find((dia) => dia.fecha === HOY)

  assert.equal(hoy.estado, "hoy_o_pasado")
})

test("Personal puede mover una cita a un horario de hoy que no empezó (RN-25)", async (contexto) => {
  const { reservarPara, reagendarComoPersonal, filaDeLaCita } = await prepararPersonal(contexto)

  const creada = await reservarPara(momento(MANANA, 10))
  const respuesta = await reagendarComoPersonal(creada.cuerpo.id, momento(HOY, 15))

  assert.equal(respuesta.estado, 200)
  assert.equal(filaDeLaCita(creada.cuerpo.id).inicio, momento(HOY, 15))
})

test("Personal no puede mover una cita a un horario de hoy que ya empezó", async (contexto) => {
  const { reservarPara, reagendarComoPersonal } = await prepararPersonal(contexto, {
    momento: MEDIA_TARDE,
  })

  const creada = await reservarPara(momento(MANANA, 10))
  const respuesta = await reagendarComoPersonal(creada.cuerpo.id, momento(HOY, 10))

  assert.equal(respuesta.estado, 422)
  assert.equal(respuesta.cuerpo.error, "horario_ya_empezo")
})

test("el cliente sigue sin poder mover su cita a hoy (CA-2)", async (contexto) => {
  const { reservarComoCliente, cliente } = await prepararPersonal(contexto)

  const creada = await reservarComoCliente(momento(MANANA, 10))
  const respuesta = await cliente(`/api/citas/${creada.cuerpo.id}`, {
    method: "PATCH",
    cuerpo: { inicio: momento(HOY, 15) },
  })

  assert.equal(respuesta.estado, 422)
  assert.equal(respuesta.cuerpo.error, "mismo_dia")
})

test("Personal no puede reservar un feriado (RN-2)", async (contexto) => {
  const { reservarPara } = await prepararPersonal(contexto)

  const respuesta = await reservarPara(momento(FERIADO, 10))

  assert.equal(respuesta.estado, 409)
  assert.equal(respuesta.cuerpo.error, "horario_no_disponible")
})

test("Personal no puede reservar un domingo (RN-3)", async (contexto) => {
  const { reservarPara } = await prepararPersonal(contexto)

  const respuesta = await reservarPara(momento(DOMINGO, 10))

  assert.equal(respuesta.estado, 409)
})

test("Personal no puede reservar en la hora del almuerzo (RN-3)", async (contexto) => {
  const { reservarPara } = await prepararPersonal(contexto)

  const respuesta = await reservarPara(momento(MANANA, 12))

  assert.equal(respuesta.estado, 409)
})

// ══════════════════════════════════════════════════════ las citas del cliente, vistas por Personal

test("Personal ve las citas del cliente que está atendiendo", async (contexto) => {
  const { reservarPara, verCitasDelCliente, idDelCliente } = await prepararPersonal(contexto)

  const creada = await reservarPara(momento(MANANA, 10))
  const respuesta = await verCitasDelCliente(idDelCliente(ANA.correo))

  assert.equal(respuesta.estado, 200)
  assert.equal(respuesta.cuerpo.length, 1)
  assert.equal(respuesta.cuerpo[0].id, creada.cuerpo.id)
  assert.equal(respuesta.cuerpo[0].servicio, "Masaje relajante")
  assert.equal(respuesta.cuerpo[0].proveedor, "Ana")
})

test("Personal no ve las citas de un cliente en la lista de otro", async (contexto) => {
  const { reservarPara, verCitasDelCliente, idDelCliente } = await prepararPersonal(contexto)

  await reservarPara(momento(MANANA, 10))
  const deBeto = await verCitasDelCliente(idDelCliente(BETO.correo))

  assert.deepEqual(deBeto.cuerpo, [])
})

test("Personal recibe 404 si pide las citas de un cliente que no existe", async (contexto) => {
  const { verCitasDelCliente } = await prepararPersonal(contexto)

  const respuesta = await verCitasDelCliente(99999)

  assert.equal(respuesta.estado, 404)
  assert.equal(respuesta.cuerpo.error, "cliente_no_encontrado")
})

test("CA-3 (Personal): una cita que empieza en 2 horas le llega a Personal como cambiable", async (contexto) => {
  const { insertarCitaAMano, verCitasDelCliente, idDelCliente } = await prepararPersonal(contexto)

  // El reloj está parado a las 8 de la mañana, así que una cita a las 10 empieza dentro de 2 horas.
  const citaId = insertarCitaAMano(momento(HOY, 10))

  const respuesta = await verCitasDelCliente(idDelCliente(ANA.correo))
  const cita = respuesta.cuerpo.find((una) => una.id === citaId)

  assert.equal(cita.sePuedeCambiar, true, "Personal sí puede cambiarla (RN-6)")
  assert.equal(cita.porQueNo, null)
})

test("CA-3 (cliente): la misma cita le llega al cliente como no cambiable", async (contexto) => {
  const { insertarCitaAMano, cliente } = await prepararPersonal(contexto)

  const citaId = insertarCitaAMano(momento(HOY, 10))

  const respuesta = await cliente("/api/citas")
  const cita = respuesta.cuerpo.find((una) => una.id === citaId)

  assert.equal(cita.sePuedeCambiar, false, "al cliente le faltan menos de 4 horas (RN-5)")
  assert.equal(cita.porQueNo, "ventana_de_cancelacion")
})

// ══════════════════════════════════════════════════════ CA-3, parte Personal (RF-18, RN-6)
//
// Comprobaciones 9 y 10 del plan, que son las que el curso exige que corran en cada push.

test("CA-3 (Personal): Personal cancela una cita que empieza dentro de 2 horas y la acepta", async (contexto) => {
  const { insertarCitaAMano, cancelarComoPersonal, filaDeLaCita } =
    await prepararPersonal(contexto)

  const citaId = insertarCitaAMano(momento(HOY, 10))

  const respuesta = await cancelarComoPersonal(citaId)

  assert.equal(respuesta.estado, 204, "Personal no tiene ventana de cancelación (RN-6)")

  const fila = filaDeLaCita(citaId)
  assert.equal(fila.estado, "cancelada")
  assert.equal(fila.cancelada_por, "personal", "tiene que quedar anotado que la canceló Personal")
  assert.ok(fila.cancelada_en, "falta cuándo se canceló (REG-1)")
})

test("CA-3 (cliente): el mismo intento hecho por el cliente se rechaza", async (contexto) => {
  const { insertarCitaAMano, cliente } = await prepararPersonal(contexto)

  const citaId = insertarCitaAMano(momento(HOY, 10))

  const respuesta = await cliente(`/api/citas/${citaId}`, { method: "DELETE" })

  assert.equal(respuesta.estado, 422)
  assert.equal(respuesta.cuerpo.error, "ventana_de_cancelacion")
})

test("Personal reagenda una cita que empieza dentro de 2 horas (RF-18)", async (contexto) => {
  const { insertarCitaAMano, reagendarComoPersonal, filaDeLaCita } =
    await prepararPersonal(contexto)

  const citaId = insertarCitaAMano(momento(HOY, 10))

  const respuesta = await reagendarComoPersonal(citaId, momento(PASADO_MANANA, 14))

  assert.equal(respuesta.estado, 200)
  assert.equal(filaDeLaCita(citaId).inicio, momento(PASADO_MANANA, 14))
})

test("Personal cancela la cita de cualquier cliente, no solo la de uno", async (contexto) => {
  const { insertarCitaAMano, cancelarComoPersonal, filaDeLaCita } =
    await prepararPersonal(contexto)

  const citaDeBeto = insertarCitaAMano(momento(HOY, 11), { correo: BETO.correo })

  const respuesta = await cancelarComoPersonal(citaDeBeto)

  assert.equal(respuesta.estado, 204)
  assert.equal(filaDeLaCita(citaDeBeto).estado, "cancelada")
})

test("Personal tampoco puede cancelar dos veces la misma cita", async (contexto) => {
  const { insertarCitaAMano, cancelarComoPersonal } = await prepararPersonal(contexto)

  const citaId = insertarCitaAMano(momento(HOY, 10))
  await cancelarComoPersonal(citaId)

  const otraVez = await cancelarComoPersonal(citaId)

  assert.equal(otraVez.estado, 409)
  assert.equal(otraVez.cuerpo.error, "cita_no_activa")
})

test("al reagendar, Personal tampoco puede aterrizar en un feriado (RN-13)", async (contexto) => {
  const { insertarCitaAMano, reagendarComoPersonal } = await prepararPersonal(contexto)

  const citaId = insertarCitaAMano(momento(HOY, 10))

  const respuesta = await reagendarComoPersonal(citaId, momento(FERIADO, 10))

  assert.equal(respuesta.estado, 409)
  assert.equal(respuesta.cuerpo.error, "horario_no_disponible")
})

test("Personal recibe 404 al cancelar una cita que no existe", async (contexto) => {
  const { cancelarComoPersonal } = await prepararPersonal(contexto)

  const respuesta = await cancelarComoPersonal(99999)

  assert.equal(respuesta.estado, 404)
  assert.equal(respuesta.cuerpo.error, "cita_no_encontrada")
})

// ══════════════════════════════════════════════════════ lo que Personal sigue sin poder hacer

test("Personal no tiene citas propias: la puerta del cliente le sigue diciendo que no", async (contexto) => {
  const { personal } = await prepararPersonal(contexto)

  const respuesta = await personal("/api/citas")

  assert.equal(respuesta.estado, 403)
  assert.equal(respuesta.cuerpo.error, "solo_clientes")
})

test("Personal no tiene la sección «Usuario»: es la información de un cliente", async (contexto) => {
  const { personal } = await prepararPersonal(contexto)

  const respuesta = await personal("/api/mi-informacion")

  assert.equal(respuesta.estado, 403)
  assert.equal(respuesta.cuerpo.error, "solo_clientes")
})
