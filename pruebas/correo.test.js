// Pruebas de la pieza 4: el correo de confirmación.
//
// Es la primera pieza que habla con un servicio de **afuera** (Resend), y eso cambia cómo se
// prueba. Todo lo demás en este proyecto se comprueba de verdad, contra el servidor de verdad; un
// correo no se puede probar así, porque no hay bandeja de entrada a la que mirarle adentro y
// porque **una prueba automática no le puede mandar correos a nadie**.
//
// La salida es la misma que ya usa el reloj: **el enviador entra como dato**. La aplicación no sabe
// cómo se manda un correo — recibe una función que lo manda y la llama. En `npm start` esa función
// habla con Resend; acá es una de mentira que guarda lo que le pasaron. Así queda probado de verdad
// todo lo que está de este lado del borde: la plantilla, el registro en la tabla y el reintento.
//
// Las cuatro comprobaciones del plan que necesitan una bandeja de entrada de verdad (que el correo
// llegue) se hacen a mano, y quedan anotadas en el bloque «Evidencia» de la pieza 4 de `PLAN.md`.
//
// Todas paran el reloj en el mismo momento que las piezas 2 y 3 (`MOMENTO_DE_PRUEBA`: martes 1 de
// setiembre de 2026, 8 de la mañana en Costa Rica). Sin eso, «reservar mañana a las 10» fallaría
// los sábados.
//
// Se escribieron antes que el código y se vieron fallar primero.

import test from "node:test"
import assert from "node:assert/strict"

import {
  crearEntornoDePrueba,
  crearNavegador,
  entrarComoClienta,
  buscarPorNombre,
  enviadorDeMentira,
  fallaPasajera,
  fallaDefinitiva,
  relojDetenidoEn,
  ANA,
  MOMENTO_DE_PRUEBA,
} from "./ayudas.js"
import { cargarDatosDePrueba, NEGOCIO } from "../guiones/datos-de-prueba.js"
import { crearEnviadorResend } from "../servidor/enviador-resend.js"

/** Mañana, miércoles 2 de setiembre de 2026: un día hábil completo, leído desde el martes 1. */
const MANANA = "2026-09-02"

/** El momento de la cita que casi todas estas pruebas reservan. */
const MANANA_A_LAS_DIEZ = `${MANANA}T10:00:00-06:00`

/**
 * Levanta la aplicación con el reloj parado y el enviador de correo que se le pida, entra como Ana,
 * y devuelve un atajo para reservar mañana a las diez con el masaje relajante.
 */
async function prepararCorreo(contexto, enviador) {
  const entorno = await crearEntornoDePrueba(contexto, {
    reloj: relojDetenidoEn(MOMENTO_DE_PRUEBA),
    enviador,
  })
  const navegador = crearNavegador(entorno)
  await entrarComoClienta(navegador)

  const servicios = await navegador("/api/servicios")
  const masaje = buscarPorNombre(servicios.cuerpo, "Masaje relajante")

  const proveedores = await navegador(`/api/servicios/${masaje.id}/proveedores`)
  const ana = buscarPorNombre(proveedores.cuerpo, "Ana")

  return {
    entorno,
    navegador,

    /** Reserva mañana a las diez con Ana. Devuelve la respuesta del API. */
    async reservar(inicio = MANANA_A_LAS_DIEZ) {
      return navegador("/api/citas", {
        method: "POST",
        cuerpo: { servicioId: masaje.id, proveedorId: ana.id, inicio },
      })
    },

    /** Las filas de la tabla de correos enviados, en el orden en que se registraron. */
    correosRegistrados() {
      return entorno.base.prepare("SELECT * FROM correo_enviado ORDER BY id").all()
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// RF-11: qué dice el correo
// ─────────────────────────────────────────────────────────────────────────────────────────────

test("al reservar, el correo trae los cinco datos que pide RF-11", async (contexto) => {
  const enviador = enviadorDeMentira()
  const { reservar } = await prepararCorreo(contexto, enviador)

  await reservar()

  assert.equal(enviador.enviados.length, 1, "tenía que salir exactamente un correo")
  const correo = enviador.enviados[0]

  // Los cinco datos se buscan en las dos versiones del correo —la de diseño y la de texto plano—,
  // porque las dos viajan en el mismo envío y las dos las puede terminar leyendo una persona.
  for (const version of [correo.html, correo.texto]) {
    assert.match(version, /miércoles 2 de setiembre de 2026/, "falta la fecha en palabras")
    assert.match(version, /10:00/, "falta la hora")
    assert.match(version, /Masaje relajante/, "falta el servicio")
    assert.match(version, /Ana/, "falta el proveedor")
    assert.ok(version.includes(NEGOCIO.ubicacion), "falta la ubicación del negocio")
  }
})

test("el correo trae también el teléfono del negocio, para poder llamar", async (contexto) => {
  const enviador = enviadorDeMentira()
  const { reservar } = await prepararCorreo(contexto, enviador)

  await reservar()

  const correo = enviador.enviados[0]
  assert.ok(correo.html.includes(NEGOCIO.telefono), "el teléfono tiene que estar en el correo")
  assert.ok(correo.texto.includes(NEGOCIO.telefono))
})

test("el correo va a la dirección de quien reservó, y su asunto dice de qué se trata", async (contexto) => {
  const enviador = enviadorDeMentira()
  const { reservar } = await prepararCorreo(contexto, enviador)

  await reservar()

  const correo = enviador.enviados[0]
  assert.equal(correo.para, ANA.correo)
  assert.match(correo.asunto, /reserva/i, "el asunto tiene que hablar de la reserva")
})

// ─────────────────────────────────────────────────────────────────────────────────────────────
// REG-3: cada envío queda registrado
// ─────────────────────────────────────────────────────────────────────────────────────────────

test("cada envío queda registrado con destinatario, cliente, cita, tipo, fecha y éxito", async (contexto) => {
  const enviador = enviadorDeMentira()
  const { reservar, correosRegistrados } = await prepararCorreo(contexto, enviador)

  const reserva = await reservar()
  assert.equal(reserva.estado, 201)

  const registrados = correosRegistrados()
  assert.equal(registrados.length, 1, "tenía que quedar una sola fila")

  const fila = registrados[0]
  assert.equal(fila.destinatario_correo, ANA.correo)
  assert.equal(fila.cita_id, reserva.cuerpo.id, "la fila tiene que apuntar a la cita que se creó")
  assert.equal(fila.tipo, "confirmacion")
  assert.equal(fila.exito, 1)
  assert.ok(fila.cliente_id, "tiene que decir de qué cliente es")

  // `enviado_en` se escribe con el mismo formato que todo el proyecto: `2026-09-01T08:00:00-06:00`.
  // El reloj está parado en el martes 1 a las 8, así que la fecha es esa y no la de hoy.
  assert.equal(fila.enviado_en, "2026-09-01T08:00:00-06:00")
})

// ─────────────────────────────────────────────────────────────────────────────────────────────
// RF-19: que el correo falle nunca invalida la cita
// ─────────────────────────────────────────────────────────────────────────────────────────────

test("RF-19: si el correo falla, la cita se crea igual y el envío queda registrado como fallido", async (contexto) => {
  const enviador = enviadorDeMentira(() => fallaDefinitiva("la clave no sirve"))
  const { reservar, correosRegistrados, navegador } = await prepararCorreo(contexto, enviador)

  const reserva = await reservar()
  assert.equal(reserva.estado, 201, "la cita se tiene que crear aunque el correo falle")

  // Y no solo contesta 201: la cita está de verdad guardada y se ve en «Mis citas».
  const citas = await navegador("/api/citas")
  assert.equal(citas.cuerpo.length, 1)
  assert.equal(citas.cuerpo[0].inicio, MANANA_A_LAS_DIEZ)

  const fila = correosRegistrados()[0]
  assert.equal(fila.exito, 0, "el envío tiene que quedar marcado como fallido")
  assert.equal(fila.cita_id, reserva.cuerpo.id)
})

test("RF-19: sin servicio de correo configurado la aplicación funciona igual", async (contexto) => {
  // Sin `enviador`, la aplicación usa el mismo que cuando el `.env` no tiene `RESEND_API_KEY`.
  const { reservar, correosRegistrados } = await prepararCorreo(contexto, undefined)

  const reserva = await reservar()
  assert.equal(reserva.estado, 201, "sin clave de correo las citas se siguen creando")

  const registrados = correosRegistrados()
  assert.equal(registrados.length, 1, "el intento igual queda registrado, para que no se pierda")
  assert.equal(registrados[0].exito, 0)
})

// ─────────────────────────────────────────────────────────────────────────────────────────────
// El reintento
// ─────────────────────────────────────────────────────────────────────────────────────────────

test("una falla pasajera se reintenta, y si el segundo intento sale bien queda como exitoso", async (contexto) => {
  // Falla el primer intento por algo que puede ser pasajero —la red— y anda bien el segundo.
  const enviador = enviadorDeMentira((intento) => (intento === 1 ? fallaPasajera() : null))
  const { reservar, correosRegistrados } = await prepararCorreo(contexto, enviador)

  await reservar()

  assert.equal(enviador.enviados.length, 2, "tenía que intentarlo dos veces")

  const registrados = correosRegistrados()
  assert.equal(registrados.length, 1, "dos intentos del mismo correo son UNA fila, no dos")
  assert.equal(registrados[0].exito, 1)
})

test("si la falla pasajera se repite, queda registrada como fallida una sola vez", async (contexto) => {
  const enviador = enviadorDeMentira(() => fallaPasajera())
  const { reservar, correosRegistrados } = await prepararCorreo(contexto, enviador)

  const reserva = await reservar()
  assert.equal(reserva.estado, 201)

  assert.equal(enviador.enviados.length, 2, "se reintenta una vez, no para siempre")

  const registrados = correosRegistrados()
  assert.equal(registrados.length, 1)
  assert.equal(registrados[0].exito, 0)
})

test("una falla definitiva no se reintenta: repetirla daría lo mismo y solo haría esperar", async (contexto) => {
  const enviador = enviadorDeMentira(() => fallaDefinitiva())
  const { reservar } = await prepararCorreo(contexto, enviador)

  await reservar()

  assert.equal(enviador.enviados.length, 1, "una clave inválida no mejora por intentarlo de nuevo")
})

// ─────────────────────────────────────────────────────────────────────────────────────────────
// El enviador de Resend, probado **sin tocar la red**
//
// Es la pieza que habla con el servicio de afuera. Recibe la función que hace el pedido por
// internet (`traer`, que en la aplicación de verdad es `fetch`, la que Node ya trae), así que estas
// pruebas le pasan una de mentira y comprueban qué pedido arma y cómo clasifica cada respuesta.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/** Una función de mentira que hace de `fetch`: guarda el pedido y contesta lo que se le diga. */
function traerDeMentira(contestar) {
  const pedidos = []

  async function traer(direccion, opciones) {
    pedidos.push({ direccion, opciones })
    return contestar()
  }

  traer.pedidos = pedidos
  return traer
}

/** Una respuesta de mentira, con el número de HTTP que se le pida. */
function respuestaConNumero(numero) {
  return { ok: numero >= 200 && numero < 300, status: numero, text: async () => "" }
}

const CORREO_DE_EJEMPLO = {
  para: "ana@ejemplo.com",
  asunto: "Tu reserva quedó confirmada",
  html: "<p>hola</p>",
  texto: "hola",
}

test("el enviador le pide a Resend el envío, con la clave, el remitente y el destinatario", async () => {
  const traer = traerDeMentira(() => respuestaConNumero(200))
  const enviar = crearEnviadorResend({
    claveApi: "clave-inventada",
    remitente: "Negocio <hola@ejemplo.com>",
    traer,
  })

  await enviar(CORREO_DE_EJEMPLO)

  assert.equal(traer.pedidos.length, 1)
  const { direccion, opciones } = traer.pedidos[0]

  assert.equal(direccion, "https://api.resend.com/emails")
  assert.equal(opciones.method, "POST")
  assert.equal(opciones.headers.authorization, "Bearer clave-inventada")

  const enviado = JSON.parse(opciones.body)
  assert.equal(enviado.from, "Negocio <hola@ejemplo.com>")
  assert.deepEqual(enviado.to, ["ana@ejemplo.com"])
  assert.equal(enviado.subject, CORREO_DE_EJEMPLO.asunto)
  assert.equal(enviado.html, CORREO_DE_EJEMPLO.html)
  assert.equal(enviado.text, CORREO_DE_EJEMPLO.texto)
})

test("sin clave, el enviador falla de una y ni siquiera sale a internet", async () => {
  const traer = traerDeMentira(() => respuestaConNumero(200))
  const enviar = crearEnviadorResend({ claveApi: "", remitente: "hola@ejemplo.com", traer })

  const falla = await enviar(CORREO_DE_EJEMPLO).then(
    () => null,
    (error) => error,
  )

  assert.ok(falla, "tenía que fallar")
  assert.equal(falla.pasajera, false, "sin clave no hay nada que reintentar")
  assert.equal(traer.pedidos.length, 0, "no tenía que salir ningún pedido a internet")
})

test("si Resend contesta que el pedido está mal, la falla es definitiva", async (contexto) => {
  // 401 es «tu clave no sirve». Volver a mandar el mismo pedido daría exactamente lo mismo.
  const traer = traerDeMentira(() => respuestaConNumero(401))
  const enviar = crearEnviadorResend({ claveApi: "clave-mala", remitente: "hola@ejemplo.com", traer })

  const falla = await enviar(CORREO_DE_EJEMPLO).then(
    () => null,
    (error) => error,
  )

  assert.ok(falla)
  assert.equal(falla.pasajera, false)
})

test("si Resend se cae o no contesta, la falla es pasajera y se puede reintentar", async () => {
  // 500 es «me caí yo». Es exactamente el caso en que volver a intentar tiene sentido.
  const seCayo = traerDeMentira(() => respuestaConNumero(500))
  const conServicioCaido = crearEnviadorResend({ claveApi: "c", remitente: "h@e.com", traer: seCayo })

  const fallaDelServicio = await conServicioCaido(CORREO_DE_EJEMPLO).then(
    () => null,
    (error) => error,
  )
  assert.equal(fallaDelServicio.pasajera, true)

  // Y lo mismo si el pedido ni siquiera llega: la red cortada, el nombre que no resuelve, el
  // tiempo que se agota. `fetch` no devuelve una respuesta: lanza un error.
  const sinRed = traerDeMentira(() => {
    throw new Error("no se pudo conectar")
  })
  const conRedCaida = crearEnviadorResend({ claveApi: "c", remitente: "h@e.com", traer: sinRed })

  const fallaDeRed = await conRedCaida(CORREO_DE_EJEMPLO).then(
    () => null,
    (error) => error,
  )
  assert.equal(fallaDeRed.pasajera, true)
})

// ─────────────────────────────────────────────────────────────────────────────────────────────
// El comando `npm run datos`
//
// `npm test` no ejecuta ese comando, así que un error ahí adentro no lo detecta ninguna prueba de
// las de arriba. Ya pasó en la pieza 11 y se vio solo al correrlo a mano. Esta prueba cubre el
// pedazo del comando que sí se puede probar: rehacer los datos sobre una base que ya se usó.
// ─────────────────────────────────────────────────────────────────────────────────────────────

test("los datos de prueba se pueden volver a cargar aunque ya haya correos registrados", async (contexto) => {
  const enviador = enviadorDeMentira()
  const { entorno, reservar } = await prepararCorreo(contexto, enviador)

  // Queda una cita, un cliente y una fila en `correo_enviado` que apunta a los dos.
  await reservar()

  // `correo_enviado` apunta a `cita` y a `cliente`, y la base tiene las llaves foráneas
  // encendidas: si el borrado no la incluye —y en el orden correcto— SQLite se niega a borrar la
  // cita, y `npm run datos` se cae con un error que no dice qué pasó.
  cargarDatosDePrueba(entorno.base)

  const cuantos = entorno.base.prepare("SELECT COUNT(*) AS cuantos FROM correo_enviado").get()
  assert.equal(cuantos.cuantos, 0, "rehacer los datos tiene que dejar el registro de correos vacío")
})
