// Pruebas de la pieza 6: el recordatorio de 24 horas (RF-12, RN-20, REG-3).
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// LAS SIETE COMPROBACIONES DEL PLAN QUE SE PUEDEN AUTOMATIZAR
//
// Son las de `PLAN.md`, pieza 6, una por una: 1, 2, 4, 5, 6 y 7, más la de REG-3 —que queda
// registrado con tipo `recordatorio`—. **Las comprobaciones 3 y 8 no están acá y no pueden estar:**
//
//   - La **3** es abrir el enlace del correo en un teléfono. Lo que sí se puede automatizar de ella
//     —que el enlace abra esa cita y la cancele sin sesión— está en `enlaces-de-cita.test.js`, y es
//     lo que hace que el paso a mano sea una confirmación y no un descubrimiento.
//   - La **8** es ver que la tarea de GitHub arrancó **sola** a su hora. Por definición no se puede
//     apurar: dispararla a mano comprobaría otra cosa.
//
// ── POR QUÉ CASI TODAS LAS CITAS SE INSERTAN A MANO ──────────────────────────────────────────
//
// El plan lo pide con esas palabras («insertar a mano una cita activa que empiece dentro de 24 horas
// y 10 minutos»), y hay dos razones para que sea así:
//
//   1. **El API no las puede crear.** RN-4 le prohíbe al cliente reservar para hoy o mañana temprano,
//      y ninguna de estas citas se podría agendar por la pantalla.
//   2. **Deja limpia la lista de correos.** Reservar por el API manda la confirmación, así que
//      `enviador.enviados` traería un correo que no es el que se está probando — y la comprobación
//      «llegó un solo correo» dejaría de significar nada.
//
// Es lo que `CLAUDE.md` autoriza explícitamente: insertar a mano lo que el API no puede crear no es
// hacer trampa, es la única manera de llegar a ese estado.
//
// EL RELOJ ESTÁ PARADO en `MOMENTO_DE_PRUEBA` (martes 1 de setiembre de 2026, 8 de la mañana en
// Costa Rica). Toda esta pieza mide **distancias entre dos momentos**, así que sin un reloj parado
// las siete pruebas dirían algo distinto cada día.
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
  fallaDefinitiva,
  relojDetenidoEn,
  ANA,
  MOMENTO_DE_PRUEBA,
} from "./ayudas.js"

/**
 * La clave que protege el disparador en estas pruebas.
 *
 * En el despliegue vive en `RECORDATORIOS_SECRETO` y en los Secrets de GitHub. Acá se le pasa a la
 * aplicación como dato, igual que el reloj y el enviador: nada lee el entorno por su cuenta.
 */
const SECRETO_DE_PRUEBA = "clave-inventada-de-prueba"

/** La cabecera donde viaja la clave. Se escribe una vez y las pruebas la usan de acá. */
const CABECERA = "x-recordatorios-secreto"

// Los momentos que las siete comprobaciones necesitan, contados desde las 8 de la mañana del martes
// 1. Están escritos como constantes y no calculados, por la regla de siempre: un momento de este
// proyecto se escribe entero, con su desfase al final, y nada se interpreta.
const DENTRO_DE_24H_Y_10MIN = "2026-09-02T08:10:00-06:00"
const DENTRO_DE_23H_Y_50MIN = "2026-09-02T07:50:00-06:00"
const DENTRO_DE_20H = "2026-09-02T04:00:00-06:00"

/** Hace varios días: una cita reservada con muchísima anticipación, que es el caso normal. */
const RESERVADA_HACE_DIAS = "2026-08-25T09:00:00-06:00"

/** Hace 3 horas: la anticipación que RN-20 deja sin recordatorio. */
const RESERVADA_HACE_3H = "2026-09-01T05:00:00-06:00"

/**
 * Levanta la aplicación con el reloj parado, la clave puesta y el enviador que se le pida, entra
 * como Ana, y devuelve los atajos de estas pruebas.
 */
async function prepararRecordatorios(contexto, enviador = enviadorDeMentira()) {
  const entorno = await crearEntornoDePrueba(contexto, {
    reloj: relojDetenidoEn(MOMENTO_DE_PRUEBA),
    enviador,
    recordatoriosSecreto: SECRETO_DE_PRUEBA,
  })

  const navegador = crearNavegador(entorno)
  await entrarComoClienta(navegador)

  const servicios = await navegador("/api/servicios")
  const masaje = buscarPorNombre(servicios.cuerpo, "Masaje relajante")

  const proveedores = await navegador(`/api/servicios/${masaje.id}/proveedores`)
  const ana = buscarPorNombre(proveedores.cuerpo, "Ana")

  const idDeAna = (await entorno.base.uno("SELECT id FROM cliente WHERE correo = ?", ANA.correo)).id

  return {
    entorno,
    enviador,

    /** El disparador, con la clave puesta. Es lo que la tarea de GitHub va a llamar. */
    async disparar() {
      return navegador("/api/tareas/recordatorios", {
        method: "POST",
        headers: { [CABECERA]: SECRETO_DE_PRUEBA },
      })
    },

    /** El disparador sin clave, o con una equivocada. */
    async dispararCon(clave) {
      return navegador("/api/tareas/recordatorios", {
        method: "POST",
        headers: clave === undefined ? {} : { [CABECERA]: clave },
      })
    },

    /**
     * Mete una cita directamente en la base, con la hora en que empieza y la hora en que se
     * reservó. Las dos hacen falta: la primera decide si le toca recordatorio, la segunda si RN-20
     * la deja afuera.
     */
    async insertarCita(inicio, creadaEn = RESERVADA_HACE_DIAS, estado = "activa") {
      const guardada = await entorno.base.correr(
        `INSERT INTO cita (cliente_id, servicio_id, proveedor_id, inicio, estado, creada_en, canal)
           VALUES (?, ?, ?, ?, ?, ?, 'en_linea')`,
        idDeAna,
        masaje.id,
        ana.id,
        inicio,
        estado,
        creadaEn,
      )

      return guardada.idInsertado
    },

    /** Las filas de `correo_enviado`, en el orden en que se registraron. */
    async correosRegistrados() {
      return await entorno.base.todas("SELECT * FROM correo_enviado ORDER BY id")
    },

    /** El código del enlace de esa cita, para comprobar qué enlace llevó el correo. */
    async codigoDe(citaId) {
      const fila = await entorno.base.uno("SELECT codigo FROM token_cita WHERE cita_id = ?", citaId)
      return fila?.codigo ?? null
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// La ventana de las 24 horas
// ─────────────────────────────────────────────────────────────────────────────────────────────

test("comprobación 1: a 24 horas y 10 minutos todavía no le toca recordatorio", async (contexto) => {
  const r = await prepararRecordatorios(contexto)
  await r.insertarCita(DENTRO_DE_24H_Y_10MIN)

  const disparo = await r.disparar()

  assert.equal(disparo.estado, 200)
  assert.equal(disparo.cuerpo.enviados, 0)
  assert.equal(r.enviador.enviados.length, 0, "no tenía que salir ningún correo")
})

test("comprobación 2: a 23 horas y 50 minutos sí le toca, y el correo trae los dos enlaces", async (contexto) => {
  const r = await prepararRecordatorios(contexto)
  const citaId = await r.insertarCita(DENTRO_DE_23H_Y_50MIN)

  const disparo = await r.disparar()

  assert.equal(disparo.estado, 200)
  assert.equal(disparo.cuerpo.enviados, 1)
  assert.equal(r.enviador.enviados.length, 1)

  const correo = r.enviador.enviados[0]
  assert.equal(correo.para, ANA.correo)

  const codigo = await r.codigoDe(citaId)
  assert.ok(correo.html.includes(`#cita=${codigo}/cancelar`), "falta el enlace de cancelar")
  assert.ok(correo.html.includes(`#cita=${codigo}/reagendar`), "falta el enlace de reagendar")
})

test("el correo del recordatorio también lleva los dos enlaces como texto suelto y con ses:no-track", async (contexto) => {
  const r = await prepararRecordatorios(contexto)
  const citaId = await r.insertarCita(DENTRO_DE_23H_Y_50MIN)
  await r.disparar()

  const correo = r.enviador.enviados[0]
  const codigo = await r.codigoDe(citaId)

  // Las mismas dos defensas del hallazgo 21 que ya tiene la confirmación: la marca que le pide al
  // servicio de entrega que no reescriba el enlace, y la dirección como texto, que nadie puede
  // reescribir porque no es un enlace.
  assert.ok(correo.html.includes("ses:no-track"))
  assert.ok(correo.texto.includes(`#cita=${codigo}/cancelar`))
  assert.ok(correo.texto.includes(`#cita=${codigo}/reagendar`))
})

test("el recordatorio usa el mismo enlace que ya llevó la confirmación, no uno nuevo", async (contexto) => {
  const r = await prepararRecordatorios(contexto)
  const citaId = await r.insertarCita(DENTRO_DE_23H_Y_50MIN)

  // Se le deja puesto un código conocido, como si la confirmación ya hubiera salido con él.
  await r.entorno.base.correr(
    "INSERT INTO token_cita (cita_id, codigo, creado_en) VALUES (?, 'codigo-de-la-confirmacion', ?)",
    citaId,
    RESERVADA_HACE_DIAS,
  )

  await r.disparar()

  // Si el recordatorio inventara uno nuevo, el botón del correo de confirmación —que la persona
  // todavía tiene en su bandeja— dejaría de funcionar.
  assert.ok(r.enviador.enviados[0].html.includes("#cita=codigo-de-la-confirmacion/cancelar"))
})

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Cuándo NO le toca
// ─────────────────────────────────────────────────────────────────────────────────────────────

test("comprobación 4: el recordatorio sale una sola vez por cita, aunque el disparador corra dos veces", async (contexto) => {
  const r = await prepararRecordatorios(contexto)
  await r.insertarCita(DENTRO_DE_23H_Y_50MIN)

  const primero = await r.disparar()
  const segundo = await r.disparar()

  assert.equal(primero.cuerpo.enviados, 1)
  assert.equal(segundo.cuerpo.enviados, 0, "la segunda corrida no tenía que mandar nada")
  assert.equal(r.enviador.enviados.length, 1, "a la persona le tenía que llegar un solo correo")
})

test("comprobación 5: una cita reservada con menos de 24 horas de anticipación nunca recibe recordatorio (RN-20)", async (contexto) => {
  const r = await prepararRecordatorios(contexto)

  // Reservada hace 3 horas para dentro de 20: la cita empieza **dentro** de la ventana de las 24
  // horas, así que sin RN-20 le tocaría. Lo que la deja afuera es que entre reservar y la cita hay
  // menos de 24 horas — mandar un «recordatorio de 24 horas» a quien reservó hace un rato sería
  // avisarle de algo que acaba de decidir.
  await r.insertarCita(DENTRO_DE_20H, RESERVADA_HACE_3H)

  const disparo = await r.disparar()

  assert.equal(disparo.cuerpo.enviados, 0)
  assert.equal(r.enviador.enviados.length, 0)
})

test("comprobación 6: una cita cancelada no recibe recordatorio", async (contexto) => {
  const r = await prepararRecordatorios(contexto)
  await r.insertarCita(DENTRO_DE_23H_Y_50MIN, RESERVADA_HACE_DIAS, "cancelada")

  const disparo = await r.disparar()

  assert.equal(disparo.cuerpo.enviados, 0)
  assert.equal(r.enviador.enviados.length, 0)
})

test("una cita que ya pasó no recibe recordatorio", async (contexto) => {
  const r = await prepararRecordatorios(contexto)

  // Ayer. No la pide el plan, y hace falta igual: la ventana se mide con una distancia, y una cita
  // pasada tiene una distancia **negativa** — que también es «menos de 24 horas». Sin el borde de
  // abajo escrito a propósito, el disparador le mandaría un recordatorio a una cita del año pasado
  // la primera vez que corriera en producción.
  await r.insertarCita("2026-08-31T10:00:00-06:00")

  const disparo = await r.disparar()

  assert.equal(disparo.cuerpo.enviados, 0)
  assert.equal(r.enviador.enviados.length, 0)
})

// ─────────────────────────────────────────────────────────────────────────────────────────────
// REG-3: queda registrado
// ─────────────────────────────────────────────────────────────────────────────────────────────

test("el recordatorio queda registrado en correo_enviado con tipo recordatorio (REG-3)", async (contexto) => {
  const r = await prepararRecordatorios(contexto)
  const citaId = await r.insertarCita(DENTRO_DE_23H_Y_50MIN)

  await r.disparar()

  const registrados = await r.correosRegistrados()
  assert.equal(registrados.length, 1)

  const fila = registrados[0]
  assert.equal(fila.tipo, "recordatorio")
  assert.equal(fila.cita_id, citaId)
  assert.equal(fila.destinatario_correo, ANA.correo)
  assert.equal(fila.exito, 1)
  assert.equal(fila.personal_id, null, "un recordatorio le llega al cliente, nunca a Personal")
})

test("un recordatorio que no se pudo entregar queda registrado como fallido, y no tumba a los demás", async (contexto) => {
  // Falla **el primero** y salen bien los que siguen. Es RF-19 aplicado a esta pieza: los correos se
  // mandan afuera de cualquier transacción y cada uno se registra por separado, así que una cita que
  // falla no puede dejar a las otras sin aviso.
  const enviador = enviadorDeMentira((intento) => (intento === 1 ? fallaDefinitiva() : null))
  const r = await prepararRecordatorios(contexto, enviador)

  await r.insertarCita(DENTRO_DE_23H_Y_50MIN)
  await r.insertarCita("2026-09-02T07:00:00-06:00")

  const disparo = await r.disparar()

  assert.equal(disparo.cuerpo.revisadas, 2, "las dos tenían que revisarse")
  assert.equal(disparo.cuerpo.enviados, 1, "una salió, la otra no")

  const registrados = await r.correosRegistrados()
  assert.equal(registrados.length, 2, "las dos tienen que dejar constancia, la que falló también")
  assert.deepEqual(
    registrados.map((fila) => fila.exito),
    [0, 1],
  )
})

// ─────────────────────────────────────────────────────────────────────────────────────────────
// La clave que protege el disparador
// ─────────────────────────────────────────────────────────────────────────────────────────────

test("comprobación 7: el disparador sin la clave lo rechaza", async (contexto) => {
  const r = await prepararRecordatorios(contexto)
  await r.insertarCita(DENTRO_DE_23H_Y_50MIN)

  const disparo = await r.dispararCon(undefined)

  // 401 y no 403: «no sé quién sos». Es el criterio de números que `CLAUDE.md` fija desde la pieza 7.
  assert.equal(disparo.estado, 401)
  assert.equal(r.enviador.enviados.length, 0, "no tenía que salir ningún correo")
})

test("el disparador con la clave equivocada también lo rechaza", async (contexto) => {
  const r = await prepararRecordatorios(contexto)
  await r.insertarCita(DENTRO_DE_23H_Y_50MIN)

  const disparo = await r.dispararCon("la-clave-de-otro")

  assert.equal(disparo.estado, 401)
  assert.equal(r.enviador.enviados.length, 0)
})

test("sin clave configurada el disparador queda cerrado para todos, no abierto para todos", async (contexto) => {
  // Es el caso peligroso, y por eso tiene su prueba: si la aplicación se despliega sin cargar
  // `RECORDATORIOS_SECRETO`, un disparador que comparara «lo que vino» contra «nada» dejaría entrar
  // a cualquiera que tampoco mandara nada. **Cerrado es el único fallo aceptable**: sin la variable
  // no se mandan recordatorios, y eso se nota; abierto no se nota hasta que alguien lo usa.
  const entorno = await crearEntornoDePrueba(contexto, {
    reloj: relojDetenidoEn(MOMENTO_DE_PRUEBA),
    enviador: enviadorDeMentira(),
  })
  const navegador = crearNavegador(entorno)

  const sinNada = await navegador("/api/tareas/recordatorios", { method: "POST" })
  const conAlgo = await navegador("/api/tareas/recordatorios", {
    method: "POST",
    headers: { [CABECERA]: "cualquier-cosa" },
  })

  assert.equal(sinNada.estado, 401)
  assert.equal(conAlgo.estado, 401)
})

test("el disparador no necesita ninguna sesión: lo llama una máquina, no una persona", async (contexto) => {
  const r = await prepararRecordatorios(contexto)
  await r.insertarCita(DENTRO_DE_23H_Y_50MIN)

  // Un navegador nuevo, que nunca entró. La tarea de GitHub Actions es exactamente esto: no tiene
  // cuenta ni galleta, solo la clave.
  const maquina = crearNavegador(r.entorno)
  const disparo = await maquina("/api/tareas/recordatorios", {
    method: "POST",
    headers: { [CABECERA]: SECRETO_DE_PRUEBA },
  })

  assert.equal(disparo.estado, 200)
  assert.equal(disparo.cuerpo.enviados, 1)
})

// ─────────────────────────────────────────────────────────────────────────────────────────────
// El mismo agujero que tenía la confirmación, del otro lado (2026-09-07)
//
// Conseguir el código del enlace **escribe en la base**, y eso puede fallar. En la confirmación ese
// agujero hacía que reservar contestara `500`; acá habría hecho que **un** recordatorio imposible
// tumbara la corrida entera y dejara sin aviso a todas las citas que venían detrás.
//
// El detalle completo está en `losEnlacesSiSePueden`, en `servidor/correo.js`.
// ─────────────────────────────────────────────────────────────────────────────────────────────

test("si el código del enlace no se puede conseguir, el recordatorio sale igual, sin botones", async (contexto) => {
  const r = await prepararRecordatorios(contexto)
  await r.insertarCita(DENTRO_DE_23H_Y_50MIN)

  // El estado exacto en que estaba la base publicada el 2026-09-07.
  await r.entorno.base.ejecutar("DROP TABLE token_cita")

  const disparo = await r.disparar()

  // **Un recordatorio sin botones sirve igual**: dice el día y la hora, que es lo que RF-12 pide.
  // No mandarlo sería peor.
  assert.equal(disparo.estado, 200)
  assert.equal(disparo.cuerpo.enviados, 1)

  const correo = r.enviador.enviados[0]
  assert.ok(correo.html.includes("Te recordamos tu cita"))
  assert.ok(!correo.html.includes("#cita="), "sin los botones, que no se pudieron armar")
})

test("y una cita imposible no deja sin recordatorio a las que vienen detrás", async (contexto) => {
  const r = await prepararRecordatorios(contexto)
  await r.insertarCita("2026-09-02T07:00:00-06:00")
  await r.insertarCita(DENTRO_DE_23H_Y_50MIN)

  await r.entorno.base.ejecutar("DROP TABLE token_cita")

  const disparo = await r.disparar()

  assert.equal(disparo.cuerpo.revisadas, 2)
  assert.equal(disparo.cuerpo.enviados, 2, "las dos tenían que salir, sin botones pero salir")
})
