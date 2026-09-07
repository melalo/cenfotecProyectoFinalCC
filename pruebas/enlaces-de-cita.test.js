// Pruebas del mecanismo del enlace de una cita (pieza 6, RF-11 y RF-12).
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// QUÉ SE PRUEBA ACÁ Y POR QUÉ ES UN ARCHIVO APARTE DEL RECORDATORIO
//
// El recordatorio de 24 horas y la confirmación de una reserva son **dos momentos distintos** que
// necesitan **la misma cosa**: un enlace que abra la aplicación en una cita concreta y deje
// cancelarla o moverla. Ese enlace es el mecanismo, y vive en `servidor/enlaces-de-cita.js`.
//
// Probarlo por separado del disparador del recordatorio no es una preferencia de orden: si estas
// pruebas vivieran adentro de las del recordatorio, un enlace roto se vería como «falló el
// recordatorio», y el recordatorio no tendría nada que ver.
//
// LA DECISIÓN QUE ESTAS PRUEBAS FIJAN, tomada por la estudiante el 2026-09-07: **el enlace entra
// sin contraseña**. Es el mismo trato del enlace de recuperación de la pieza 9 —quien tiene acceso
// al correo puede usarlo—, y es a propósito menos poderoso que ése: el de recuperación cambia la
// contraseña de la cuenta entera, y éste solo puede ver y mover **una** cita.
//
// LO QUE EL ENLACE **NO** PUEDE, y estas pruebas lo fijan: no saltea ninguna regla de negocio. La
// ventana de las 4 horas (RN-5) sigue valiendo, una cita pasada sigue sin poder moverse (RN-26), y
// un horario ocupado sigue estando ocupado. La razón es de diseño y no de suerte: los endpoints del
// enlace le pasan a `reservas.js` el `clienteId` de esa cita y `quien = cliente`, así que son
// **exactamente las mismas funciones** que usa la pantalla con sesión. No hay una segunda copia de
// las reglas que un día pueda quedar desincronizada.
//
// Se escribieron antes que el código y se vieron fallar primero.
// ─────────────────────────────────────────────────────────────────────────────────────────────

import test from "node:test"
import assert from "node:assert/strict"

import {
  crearEntornoDePrueba,
  crearNavegador,
  entrarComoClienta,
  buscarPorNombre,
  enviadorDeMentira,
  relojDetenidoEn,
  ANA,
  MOMENTO_DE_PRUEBA,
} from "./ayudas.js"
import { codigoDeLaCita } from "../servidor/enlaces-de-cita.js"

/** Mañana, miércoles 2 de setiembre de 2026: un día hábil completo, leído desde el martes 1. */
const MANANA_A_LAS_DIEZ = "2026-09-02T10:00:00-06:00"

/** Otro horario libre del mismo día, para comprobar que el enlace también puede mover la cita. */
const MANANA_A_LAS_ONCE = "2026-09-02T11:00:00-06:00"

/**
 * Levanta la aplicación con el reloj parado y un enviador de mentira, entra como Ana, y devuelve
 * los atajos que usan todas las pruebas de este archivo.
 *
 * `navegadorSinSesion` es un segundo navegador **que nunca entró**: es el que imita a quien abre el
 * correo en el teléfono. Que sea otro objeto y no el mismo importa, porque `crearNavegador` guarda
 * la galleta de sesión — reusar el primero probaría el caso fácil y no el que interesa.
 */
async function prepararEnlaces(contexto) {
  const enviador = enviadorDeMentira()
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
    enviador,
    masaje,
    ana,

    /** Un navegador nuevo, sin sesión: quien abre el correo en el teléfono. */
    sinSesion: crearNavegador(entorno),

    /** El navegador de Ana, con su sesión abierta: la pantalla de siempre. */
    conSesion: navegador,

    /** Reserva mañana a las diez con Ana. Devuelve la respuesta del API. */
    async reservar(inicio = MANANA_A_LAS_DIEZ) {
      return navegador("/api/citas", {
        method: "POST",
        cuerpo: { servicioId: masaje.id, proveedorId: ana.id, inicio },
      })
    },

    /** El último correo que el enviador de mentira recibió. */
    ultimoCorreo() {
      return enviador.enviados.at(-1)
    },

    /** El código del enlace de esa cita **tal como quedó guardado**, o `null` si no tiene. */
    async codigoGuardadoDe(citaId) {
      const fila = await entorno.base.uno("SELECT codigo FROM token_cita WHERE cita_id = ?", citaId)
      return fila?.codigo ?? null
    },

    /**
     * El código de esa cita, creándolo si todavía no tiene.
     *
     * Llama a la función de verdad, la misma que usa el correo. Hace falta para las citas que la
     * prueba inserta a mano: ésas nunca pasaron por un correo, así que nadie les pidió un código.
     */
    async asegurarCodigoDe(citaId) {
      return await codigoDeLaCita({ base: entorno.base, citaId, ahora: MOMENTO_DE_PRUEBA })
    },

    /** La fila cruda de una cita, para mirar qué quedó guardado de verdad. */
    async filaDeLaCita(citaId) {
      return await entorno.base.uno("SELECT * FROM cita WHERE id = ?", citaId)
    },

    /** El número de Ana en la tabla `cliente`, para poder insertar citas a mano. */
    async idDeAna() {
      const fila = await entorno.base.uno("SELECT id FROM cliente WHERE correo = ?", ANA.correo)
      return fila.id
    },

    /**
     * Mete una cita activa directamente en la base, sin pasar por el API.
     *
     * Es la única manera de tener una cita que empiece **hoy**, porque RN-4 le prohíbe al cliente
     * reservar para el mismo día. La ventana de las 4 horas solo se puede comprobar así.
     */
    async insertarCitaAMano(inicio) {
      const guardada = await entorno.base.correr(
        `INSERT INTO cita (cliente_id, servicio_id, proveedor_id, inicio, estado, creada_en, canal)
           VALUES (?, ?, ?, ?, 'activa', '2026-08-30T09:00:00-06:00', 'en_linea')`,
        await this.idDeAna(),
        masaje.id,
        ana.id,
        inicio,
      )

      return guardada.idInsertado
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// RF-11: el correo de confirmación lleva los dos enlaces
//
// Es el cambio del 2026-09-05, y la estudiante lo pidió después de vivirlo: reservó contra la
// aplicación ya publicada, le llegó la confirmación, y no traía los botones.
// ─────────────────────────────────────────────────────────────────────────────────────────────

test("el correo de confirmación trae el enlace de cancelar y el de reagendar (RF-11)", async (contexto) => {
  const c = await prepararEnlaces(contexto)

  const reserva = await c.reservar()
  assert.equal(reserva.estado, 201)

  const codigo = await c.codigoGuardadoDe(reserva.cuerpo.id)
  assert.ok(codigo, "la reserva tiene que haber dejado un código de enlace para esa cita")

  const correo = c.ultimoCorreo()
  const cancelar = `http://localhost:3000/#cita=${codigo}/cancelar`
  const reagendar = `http://localhost:3000/#cita=${codigo}/reagendar`

  assert.ok(correo.html.includes(cancelar), "el HTML tiene que traer el enlace de cancelar")
  assert.ok(correo.html.includes(reagendar), "el HTML tiene que traer el enlace de reagendar")
})

test("los dos enlaces también van como texto suelto, que es lo que ningún servicio puede reescribir", async (contexto) => {
  const c = await prepararEnlaces(contexto)

  const reserva = await c.reservar()
  const codigo = await c.codigoGuardadoDe(reserva.cuerpo.id)
  const correo = c.ultimoCorreo()

  // La versión de respaldo, sin diseño, es la que leen los programas de correo configurados para no
  // mostrar HTML. Si los enlaces solo vivieran en el HTML, esa gente se quedaría sin ellos.
  assert.ok(correo.texto.includes(`#cita=${codigo}/cancelar`))
  assert.ok(correo.texto.includes(`#cita=${codigo}/reagendar`))
})

test("el enlace del correo lleva ses:no-track, para que el servicio de entrega no lo reescriba", async (contexto) => {
  const c = await prepararEnlaces(contexto)
  await c.reservar()

  // Es el hallazgo 21 de la pieza 9, y pasó de verdad el 2026-08-28: sin esto, Resend cambia el
  // enlace por uno suyo de rastreo de clics y el de verdad queda adentro del de ellos.
  assert.ok(c.ultimoCorreo().html.includes("ses:no-track"))
})

test("reagendar manda la confirmación con los mismos dos enlaces, no con otros nuevos", async (contexto) => {
  const c = await prepararEnlaces(contexto)

  const reserva = await c.reservar()
  const codigoAlReservar = await c.codigoGuardadoDe(reserva.cuerpo.id)

  const movida = await c.sinSesion(`/api/citas/por-enlace/${codigoAlReservar}`, {
    method: "PATCH",
    cuerpo: { inicio: MANANA_A_LAS_ONCE },
  })
  assert.equal(movida.estado, 200)

  // **El código es de la cita, no del correo.** Si cada correo inventara uno nuevo, el enlace de la
  // confirmación vieja dejaría de servir, y quien tuviera los dos correos abiertos vería que uno de
  // los botones no hace nada.
  const codigoDespues = await c.codigoGuardadoDe(reserva.cuerpo.id)
  assert.equal(codigoDespues, codigoAlReservar)

  assert.ok(c.ultimoCorreo().html.includes(`#cita=${codigoAlReservar}/cancelar`))
})

// ─────────────────────────────────────────────────────────────────────────────────────────────
// El enlace abierto sin la sesión puesta
// ─────────────────────────────────────────────────────────────────────────────────────────────

test("con el código, y sin la sesión abierta, se ve esa cita", async (contexto) => {
  const c = await prepararEnlaces(contexto)

  const reserva = await c.reservar()
  const codigo = await c.codigoGuardadoDe(reserva.cuerpo.id)

  const vista = await c.sinSesion(`/api/citas/por-enlace/${codigo}`)

  assert.equal(vista.estado, 200)
  assert.equal(vista.cuerpo.id, reserva.cuerpo.id)
  assert.equal(vista.cuerpo.inicio, MANANA_A_LAS_DIEZ)
  assert.equal(vista.cuerpo.servicio, "Masaje relajante")
  assert.equal(vista.cuerpo.proveedor, "Ana")
  assert.equal(vista.cuerpo.sePuedeCambiar, true)
})

test("con el código, y sin la sesión abierta, se cancela esa cita", async (contexto) => {
  const c = await prepararEnlaces(contexto)

  const reserva = await c.reservar()
  const codigo = await c.codigoGuardadoDe(reserva.cuerpo.id)

  const cancelada = await c.sinSesion(`/api/citas/por-enlace/${codigo}`, { method: "DELETE" })
  assert.equal(cancelada.estado, 204)

  // Queda cancelada **como si la hubiera cancelado el cliente**, porque es el cliente: el enlace
  // llegó a su correo. `cancelada_por` diciendo `personal` sería falso (RN-6).
  const fila = await c.filaDeLaCita(reserva.cuerpo.id)
  assert.equal(fila.estado, "cancelada")
  assert.equal(fila.cancelada_por, "cliente")
})

test("con el código, y sin la sesión abierta, se mueve esa cita a otro horario libre", async (contexto) => {
  const c = await prepararEnlaces(contexto)

  const reserva = await c.reservar()
  const codigo = await c.codigoGuardadoDe(reserva.cuerpo.id)

  const movida = await c.sinSesion(`/api/citas/por-enlace/${codigo}`, {
    method: "PATCH",
    cuerpo: { inicio: MANANA_A_LAS_ONCE },
  })

  assert.equal(movida.estado, 200)
  assert.equal((await c.filaDeLaCita(reserva.cuerpo.id)).inicio, MANANA_A_LAS_ONCE)
})

test("con el código se ven los horarios libres para mover la cita, sin la sesión abierta", async (contexto) => {
  const c = await prepararEnlaces(contexto)

  const reserva = await c.reservar()
  const codigo = await c.codigoGuardadoDe(reserva.cuerpo.id)

  // Sin esto, el enlace de reagendar no tendría nada que ofrecer: `/api/disponibilidad` exige
  // sesión, y quien abre el correo no la tiene.
  const calendario = await c.sinSesion(
    `/api/citas/por-enlace/${codigo}/disponibilidad?mes=2026-09`,
  )

  assert.equal(calendario.estado, 200)
  const manana = calendario.cuerpo.dias.find((dia) => dia.fecha === "2026-09-02")
  assert.ok(
    manana.horarios.some(
      (horario) => horario.inicio === MANANA_A_LAS_ONCE && horario.disponible,
    ),
  )
})

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Lo que el enlace NO puede
// ─────────────────────────────────────────────────────────────────────────────────────────────

test("un código que no existe no encuentra ninguna cita", async (contexto) => {
  const c = await prepararEnlaces(contexto)
  await c.reservar()

  const vista = await c.sinSesion("/api/citas/por-enlace/estecodigoNoExiste")

  // 404 y no 401: no se dice «ese código no sirve» ni «existía». Es la misma decisión que toma
  // `buscarEnlaceQueTodaviaSirve` en la pieza 9, y por la misma razón.
  assert.equal(vista.estado, 404)
  assert.equal(vista.cuerpo.error, "cita_no_encontrada")
})

test("el enlace no saltea la ventana de las 4 horas (RN-5)", async (contexto) => {
  const c = await prepararEnlaces(contexto)

  // Dentro de 2 horas: menos de 4, así que el cliente no la puede tocar ni por la pantalla ni por
  // el enlace. Insertada a mano porque el API no deja crear una cita para hoy (RN-4).
  const citaId = await c.insertarCitaAMano("2026-09-01T10:00:00-06:00")
  const codigo = await c.asegurarCodigoDe(citaId)

  const intento = await c.sinSesion(`/api/citas/por-enlace/${codigo}`, { method: "DELETE" })

  assert.equal(intento.estado, 422)
  assert.equal(intento.cuerpo.error, "ventana_de_cancelacion")
  assert.equal((await c.filaDeLaCita(citaId)).estado, "activa")
})

test("el enlace de una cita ya cancelada no la vuelve a cancelar", async (contexto) => {
  const c = await prepararEnlaces(contexto)

  const reserva = await c.reservar()
  const codigo = await c.codigoGuardadoDe(reserva.cuerpo.id)

  await c.sinSesion(`/api/citas/por-enlace/${codigo}`, { method: "DELETE" })
  const otraVez = await c.sinSesion(`/api/citas/por-enlace/${codigo}`, { method: "DELETE" })

  // El enlace **se puede usar más de una vez** a propósito, al contrario del de recuperación: quien
  // lo tocó por error y volvió atrás tiene que poder volver a entrar. Lo que impide el daño no es
  // que el enlace se apague, es que la cita ya no está activa.
  assert.equal(otraVez.estado, 409)
  assert.equal(otraVez.cuerpo.error, "cita_no_activa")
})

test("el código apunta a una sola cita, y no abre las demás de esa misma cuenta", async (contexto) => {
  const c = await prepararEnlaces(contexto)

  const primera = await c.reservar()
  const codigo = await c.codigoGuardadoDe(primera.cuerpo.id)
  const otra = await c.insertarCitaAMano(MANANA_A_LAS_ONCE)

  // **El enlace no abre una sesión**, y ésa es la diferencia que lo hace seguro: con el código no
  // hay ninguna manera de pedir «mis citas», ni de nombrar otra cita. Aunque las dos sean de la
  // misma cuenta, el código solo alcanza a la suya.
  const vista = await c.sinSesion(`/api/citas/por-enlace/${codigo}`)

  assert.equal(vista.cuerpo.id, primera.cuerpo.id)
  assert.notEqual(vista.cuerpo.id, otra)

  // Y el código de la primera no sirve para cancelar la otra por ninguna vía.
  await c.sinSesion(`/api/citas/por-enlace/${codigo}`, { method: "DELETE" })
  assert.equal((await c.filaDeLaCita(otra)).estado, "activa")
})

// ─────────────────────────────────────────────────────────────────────────────────────────────
// RF-19 APLICADO A ESTA PIEZA: si el enlace no se puede armar, la cita igual queda
//
// ⚠️ **Estas dos pruebas nacieron de un defecto real, encontrado en producción el 2026-09-07**, el
// mismo día que se construyó la pieza. La tabla `token_cita` no existía en la base publicada —el
// despliegue no crea tablas, a propósito— y el resultado no fue «el correo llegó sin botones»: fue
// que **reservar contestaba `500` con la cita ya guardada**.
//
// La causa no era la tabla, era el código: `enviarConfirmacionDeCita` está documentada desde la
// pieza 4 como que **nunca lanza un error**, porque RF-19 dice que un correo que falla no puede
// invalidar una cita — y la pieza 6 le metió adentro una escritura a la base sin protegerla.
//
// La lección, que es la de siempre en este proyecto: **el borde del sistema termina antes de lo que
// uno cree.** Las 26 pruebas de la pieza estaban en verde, porque todas corrían contra una base con
// el esquema completo.
// ─────────────────────────────────────────────────────────────────────────────────────────────

test("si el código del enlace no se puede conseguir, la reserva NO se cae y el correo sale sin botones", async (contexto) => {
  const c = await prepararEnlaces(contexto)

  // Se le saca la tabla a la base, que es exactamente el estado en que estaba la base publicada.
  await c.entorno.base.ejecutar("DROP TABLE token_cita")

  const reserva = await c.reservar()

  // **Lo que importa: la cita se creó igual.** RF-19 no admite lo contrario.
  assert.equal(reserva.estado, 201, "la reserva no puede caerse porque el correo no tenga botones")

  const correo = c.ultimoCorreo()
  assert.ok(correo, "el correo tiene que salir igual")
  assert.ok(!correo.html.includes("#cita="), "y sin los botones, que no se pudieron armar")
  assert.ok(correo.html.includes("Tu reserva quedó confirmada"), "pero con todo lo demás")

  // Y queda su constancia, como cualquier correo (REG-3).
  const registrados = await c.entorno.base.todas("SELECT tipo FROM correo_enviado")
  assert.deepEqual(
    registrados.map((fila) => fila.tipo),
    ["confirmacion"],
  )
})

test("y reagendar tampoco se cae si el código del enlace no se puede conseguir", async (contexto) => {
  const c = await prepararEnlaces(contexto)

  const reserva = await c.reservar()
  await c.entorno.base.ejecutar("DROP TABLE token_cita")

  // Se mueve con la sesión abierta, que es el otro camino que manda este mismo correo (RF-14).
  const movida = await c.conSesion(`/api/citas/${reserva.cuerpo.id}`, {
    method: "PATCH",
    cuerpo: { inicio: MANANA_A_LAS_ONCE },
  })

  assert.equal(movida.estado, 200)
  assert.equal((await c.filaDeLaCita(reserva.cuerpo.id)).inicio, MANANA_A_LAS_ONCE)
})

test("los botones del correo se llaman igual que los de la aplicación: «Reagendar» y «Cancelar»", async (contexto) => {
  const c = await prepararEnlaces(contexto)
  await c.reservar()

  const correo = c.ultimoCorreo()

  // ── Por qué esta prueba existe (2026-09-07) ────────────────────────────────────────────────
  //
  // **Lo encontró la estudiante leyendo el correo que le llegó**, y es un defecto del tipo que
  // ninguna prueba de este proyecto estaba mirando: los botones decían «Cambiar la hora» y
  // «Cancelar la cita», inventados al escribir la plantilla, mientras «Mis citas» dice **Reagendar**
  // y **Cancelar** desde la pieza 5.
  //
  // Es la convención de `CLAUDE.md`: **dos caminos al mismo lugar se llaman igual** —si se llamaran
  // distinto parecerían dos cosas distintas—. Y acá pesa más que en la pantalla, porque el correo y
  // la aplicación se leen en momentos separados: quien tocó «Cambiar la hora» en el correo y después
  // busca ese botón en la aplicación, no lo encuentra.
  //
  // Se fija en el correo y no en la pantalla porque **el correo sí se puede probar**: es texto que
  // esta función devuelve. La pantalla sigue dependiendo de que una persona la mire.
  assert.ok(correo.html.includes(">\n                        Reagendar\n"), "el botón dice «Reagendar»")
  assert.ok(correo.html.includes(">\n                        Cancelar\n"), "el botón dice «Cancelar»")

  // Y ninguno de los dos nombres inventados vuelve a aparecer.
  assert.ok(!correo.html.includes("Cambiar la hora"), "no dice «Cambiar la hora»")
  assert.ok(!correo.texto.includes("cambiar la hora"), "ni en la versión de texto")
})
