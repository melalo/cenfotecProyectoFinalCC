// Pruebas de la pieza 9: restablecer la contraseña olvidada (RF-3, RN-27).
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// LAS OCHO COMPROBACIONES DEL PLAN, Y LO QUE NINGUNA DE ELLAS VE
//
// Las ocho comprobaciones de la pieza 9 en `PLAN.md` se corren a mano, con la aplicación levantada
// y con correos de verdad. Estas pruebas cubren las mismas ocho hablándole al API por HTTP, sin
// navegador y sin mandarle un correo a nadie: el enviador es de mentira y guarda lo que le dan.
//
// Y cubren además lo que a mano no se puede comprobar sin esperar: **que el enlace se vence a la
// hora** (RN-27). Para eso el reloj de estas pruebas **se puede mover**, que es distinto del de las
// otras pruebas del proyecto: las del calendario paran el tiempo en un martes y no lo mueven nunca,
// porque lo que comprueban no cambia con el paso de los minutos. Acá el paso del tiempo **es** la
// regla, así que hay que poder adelantarlo.
//
// Lo único que estas pruebas NO ven es la pantalla: que el enlace «¿Olvidaste tu contraseña?»
// aparezca, que el «ojito» esté en el campo nuevo y que el correo llegue de verdad a una casilla lo
// comprueba una persona, y son las comprobaciones del plan corridas en el navegador.
//
// Se escribieron antes que el código y se vieron fallar primero.
// ─────────────────────────────────────────────────────────────────────────────────────────────

import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { createClient } from "@libsql/client"

import { abrirBase, comoArchivo } from "../servidor/base-de-datos.js"
import { crearEsquema } from "../servidor/esquema.js"
import { escribirMomento } from "../servidor/tiempo.js"
import {
  borrarCarpetaDePrueba,
  crearEntornoDePrueba,
  crearNavegador,
  enviadorDeMentira,
  ANA,
  PERSONAL,
} from "./ayudas.js"

/** El momento en que arrancan estas pruebas: el mismo martes 1 de setiembre de 2026, 8 de la mañana
 *  de Costa Rica, que usa el resto del proyecto. */
const ARRANQUE = new Date("2026-09-01T14:00:00Z")

const UN_MINUTO = 60 * 1000

/** La contraseña nueva que se elige en todas estas pruebas. Cumple RN-23. */
const NUEVA = "Nueva456"

/**
 * Un reloj que se puede adelantar. Devuelve la función que la aplicación va a llamar para saber
 * qué hora es, más un `adelantarMinutos` para moverla desde la prueba.
 *
 * Sin esto, comprobar que el enlace se vence a la hora obligaría a esperar una hora de verdad.
 */
function relojQueSePuedeMover(desde = ARRANQUE) {
  let ahora = desde
  const reloj = () => ahora
  reloj.adelantarMinutos = (cuantos) => {
    ahora = new Date(ahora.getTime() + cuantos * UN_MINUTO)
  }
  return reloj
}

/**
 * Levanta la aplicación con el enviador de mentira y el reloj movible, y devuelve los atajos que
 * usan todas las pruebas de este archivo.
 */
async function prepararRecuperacion(contexto) {
  const enviador = enviadorDeMentira()
  const reloj = relojQueSePuedeMover()
  const entorno = await crearEntornoDePrueba(contexto, { enviador, reloj })
  const navegador = crearNavegador(entorno)

  return {
    entorno,
    navegador,
    enviador,
    reloj,

    /** Registra a Ana y le cierra la sesión, para dejarla como quien vuelve y no se acuerda. */
    async crearACliente() {
      await navegador("/api/registro", { method: "POST", cuerpo: ANA })
      await navegador("/api/sesion", { method: "DELETE" })
    },

    pedirElEnlace(correo) {
      return navegador("/api/contrasena/olvide", { method: "POST", cuerpo: { correo } })
    },

    restablecer(codigo, contrasena = NUEVA) {
      return navegador("/api/contrasena/restablecer", {
        method: "POST",
        cuerpo: { codigo, contrasena },
      })
    },

    entrar(correo, contrasena) {
      return navegador("/api/sesion", { method: "POST", cuerpo: { correo, contrasena } })
    },

    /** El último correo que se le mandó a alguien, tal como el enviador lo recibió. */
    ultimoCorreo() {
      return enviador.enviados.at(-1)
    },

    /** Las filas de `token_recuperacion`, de la más nueva a la más vieja. */
    async tokens() {
      return await entorno.base.todas("SELECT * FROM token_recuperacion ORDER BY id DESC")
    },

    /** Las filas de `correo_enviado`, de la más nueva a la más vieja. */
    async correosRegistrados() {
      return await entorno.base.todas("SELECT * FROM correo_enviado ORDER BY id DESC")
    },
  }
}

/**
 * Saca el código del enlace que va escrito en el correo.
 *
 * Se lee del correo y no de la base a propósito: así la prueba comprueba **el camino entero** —que
 * el enlace que le llega a la persona es el que de verdad abre la puerta— y no solo que el código
 * quedó guardado.
 */
function codigoDelCorreo(correo) {
  const encontrado = /#restablecer=([A-Za-z0-9_-]+)/.exec(correo.texto)
  assert.ok(encontrado, "el correo tiene que traer un enlace con el código adentro")
  return encontrado[1]
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Las ocho comprobaciones del plan
// ─────────────────────────────────────────────────────────────────────────────────────────────

test("comprobación 1: quien olvidó su contraseña pide el enlace y le llega el correo", async (contexto) => {
  const { crearACliente, pedirElEnlace, ultimoCorreo, enviador } =
    await prepararRecuperacion(contexto)
  await crearACliente()

  const respuesta = await pedirElEnlace(ANA.correo)

  assert.equal(respuesta.estado, 204)
  assert.equal(enviador.enviados.length, 1, "tiene que salir exactamente un correo")

  const correo = ultimoCorreo()
  assert.equal(correo.para, ANA.correo)
  assert.match(correo.asunto, /contraseña/i)
  assert.ok(codigoDelCorreo(correo), "el correo trae el enlace con el código")
})

test("comprobación 2: con el código del correo se pone una contraseña nueva y se entra con ella", async (contexto) => {
  const { crearACliente, pedirElEnlace, ultimoCorreo, restablecer, entrar } =
    await prepararRecuperacion(contexto)
  await crearACliente()
  await pedirElEnlace(ANA.correo)

  const respuesta = await restablecer(codigoDelCorreo(ultimoCorreo()))
  assert.equal(respuesta.estado, 204)

  const entrada = await entrar(ANA.correo, NUEVA)
  assert.equal(entrada.estado, 200)
  assert.equal(entrada.cuerpo.correo, ANA.correo)
})

test("comprobación 3: después de restablecerla, la contraseña vieja se rechaza", async (contexto) => {
  const { crearACliente, pedirElEnlace, ultimoCorreo, restablecer, entrar } =
    await prepararRecuperacion(contexto)
  await crearACliente()
  await pedirElEnlace(ANA.correo)
  await restablecer(codigoDelCorreo(ultimoCorreo()))

  const entrada = await entrar(ANA.correo, ANA.contrasena)

  assert.equal(entrada.estado, 401)
  assert.equal(entrada.cuerpo.error, "credenciales_invalidas")
})

test("comprobación 4: el mismo enlace no sirve una segunda vez", async (contexto) => {
  const { crearACliente, pedirElEnlace, ultimoCorreo, restablecer } =
    await prepararRecuperacion(contexto)
  await crearACliente()
  await pedirElEnlace(ANA.correo)

  const codigo = codigoDelCorreo(ultimoCorreo())
  await restablecer(codigo)

  const segunda = await restablecer(codigo, "Otra789")

  assert.equal(segunda.estado, 422)
  assert.equal(segunda.cuerpo.error, "token_invalido")
})

test("comprobación 5: pasada la hora, el enlace ya no sirve (RN-27)", async (contexto) => {
  const { crearACliente, pedirElEnlace, ultimoCorreo, restablecer, reloj, entrar } =
    await prepararRecuperacion(contexto)
  await crearACliente()
  await pedirElEnlace(ANA.correo)
  const codigo = codigoDelCorreo(ultimoCorreo())

  reloj.adelantarMinutos(61)

  const tarde = await restablecer(codigo)
  assert.equal(tarde.estado, 422)
  assert.equal(tarde.cuerpo.error, "token_invalido")

  // Y la contraseña vieja sigue siendo la que vale: un enlace vencido no cambió nada.
  const entrada = await entrar(ANA.correo, ANA.contrasena)
  assert.equal(entrada.estado, 200)
})

test("comprobación 5 bis: a los 59 minutos el enlace todavía sirve", async (contexto) => {
  const { crearACliente, pedirElEnlace, ultimoCorreo, restablecer, reloj } =
    await prepararRecuperacion(contexto)
  await crearACliente()
  await pedirElEnlace(ANA.correo)
  const codigo = codigoDelCorreo(ultimoCorreo())

  reloj.adelantarMinutos(59)

  const respuesta = await restablecer(codigo)
  assert.equal(respuesta.estado, 204, "todavía no se cumplió la hora, así que tiene que servir")
})

test("comprobación 6: pedir el enlace para un correo que no existe contesta lo mismo y no manda nada", async (contexto) => {
  const { crearACliente, pedirElEnlace, enviador, tokens } = await prepararRecuperacion(contexto)
  await crearACliente()

  const conCuenta = await pedirElEnlace(ANA.correo)
  const correosDespuesDeLaBuena = enviador.enviados.length

  const sinCuenta = await pedirElEnlace("noexiste@ejemplo.com")

  // Exactamente la misma respuesta: mismo estado y ningún cuerpo que los distinga. Si contestaran
  // distinto, este endpoint sería una manera de averiguar qué correos están registrados.
  assert.equal(sinCuenta.estado, conCuenta.estado)
  assert.deepEqual(sinCuenta.cuerpo, conCuenta.cuerpo)

  assert.equal(enviador.enviados.length, correosDespuesDeLaBuena, "no se manda ningún correo")
  assert.equal((await tokens()).length, 1, "tampoco se guarda ningún token")
})

test("comprobación 7: la cuenta de Personal restablece su contraseña igual que un cliente", async (contexto) => {
  const { pedirElEnlace, ultimoCorreo, restablecer, entrar, tokens } =
    await prepararRecuperacion(contexto)

  const respuesta = await pedirElEnlace(PERSONAL.correo)
  assert.equal(respuesta.estado, 204)
  assert.equal(ultimoCorreo().para, PERSONAL.correo)

  const [token] = await tokens()
  assert.equal(token.cliente_id, null, "un token de Personal no tiene cliente")
  assert.ok(token.personal_id, "y sí tiene la cuenta de Personal")

  await restablecer(codigoDelCorreo(ultimoCorreo()))

  const entrada = await entrar(PERSONAL.correo, NUEVA)
  assert.equal(entrada.estado, 200)
  assert.equal(entrada.cuerpo.tipo, "personal")

  const vieja = await entrar(PERSONAL.correo, PERSONAL.contrasena)
  assert.equal(vieja.estado, 401)
})

test("comprobación 8: el correo de recuperación queda registrado con su tipo y sin cita (REG-3)", async (contexto) => {
  const { crearACliente, pedirElEnlace, correosRegistrados } = await prepararRecuperacion(contexto)
  await crearACliente()

  await pedirElEnlace(ANA.correo)

  const [fila] = await correosRegistrados()
  assert.equal(fila.tipo, "recuperacion")
  assert.equal(fila.cita_id, null, "el correo de contraseña no es de ninguna cita")
  assert.equal(fila.destinatario_correo, ANA.correo)
  assert.ok(fila.cliente_id, "es para un cliente, así que lleva su id")
  assert.equal(fila.personal_id, null)
  assert.equal(fila.exito, 1)
})

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Lo que las ocho comprobaciones no alcanzan a mirar
// ─────────────────────────────────────────────────────────────────────────────────────────────

test("el correo de recuperación de Personal se registra a nombre de Personal, no de un cliente", async (contexto) => {
  const { pedirElEnlace, correosRegistrados } = await prepararRecuperacion(contexto)

  await pedirElEnlace(PERSONAL.correo)

  const [fila] = await correosRegistrados()
  assert.equal(fila.tipo, "recuperacion")
  assert.equal(fila.cliente_id, null, "Personal no es cliente de nadie")
  assert.ok(fila.personal_id, "pero el registro tiene que decir a quién le llegó")
  assert.equal(fila.destinatario_correo, PERSONAL.correo)
})

test("un código que nunca existió se rechaza igual que uno usado", async (contexto) => {
  const { crearACliente, restablecer } = await prepararRecuperacion(contexto)
  await crearACliente()

  const respuesta = await restablecer("este-codigo-nunca-existio")

  assert.equal(respuesta.estado, 422)
  assert.equal(respuesta.cuerpo.error, "token_invalido")
})

test("la contraseña nueva tiene que cumplir RN-23, y el enlace no se gasta si no cumple", async (contexto) => {
  const { crearACliente, pedirElEnlace, ultimoCorreo, restablecer, entrar } =
    await prepararRecuperacion(contexto)
  await crearACliente()
  await pedirElEnlace(ANA.correo)
  const codigo = codigoDelCorreo(ultimoCorreo())

  const rechazada = await restablecer(codigo, "abc")

  assert.equal(rechazada.estado, 422)
  assert.equal(rechazada.cuerpo.error, "contrasena_invalida")
  assert.deepEqual(rechazada.cuerpo.faltan.sort(), ["largo", "mayuscula", "numero"])

  // El enlace tiene que seguir vivo: quien escribió una contraseña que no sirve no puede quedarse
  // sin manera de entrar por haberse equivocado escribiendo.
  const segunda = await restablecer(codigo)
  assert.equal(segunda.estado, 204)

  const entrada = await entrar(ANA.correo, NUEVA)
  assert.equal(entrada.estado, 200)
})

test("una contraseña con tilde se rechaza también acá, porque la regla es la misma (RN-23)", async (contexto) => {
  const { crearACliente, pedirElEnlace, ultimoCorreo, restablecer } =
    await prepararRecuperacion(contexto)
  await crearACliente()
  await pedirElEnlace(ANA.correo)

  const respuesta = await restablecer(codigoDelCorreo(ultimoCorreo()), "Cóndor123")

  assert.equal(respuesta.estado, 422)
  assert.deepEqual(respuesta.cuerpo.faltan, ["sin_acentos"])
})

test("pedir el enlace no toca la contraseña vieja: sigue sirviendo hasta que el enlace se use (RN-27)", async (contexto) => {
  const { crearACliente, pedirElEnlace, entrar } = await prepararRecuperacion(contexto)
  await crearACliente()

  await pedirElEnlace(ANA.correo)

  const entrada = await entrar(ANA.correo, ANA.contrasena)
  assert.equal(entrada.estado, 200, "quien pidió el enlace por error no puede quedar afuera")
})

test("el token queda marcado como usado, con la hora en que se usó", async (contexto) => {
  const { crearACliente, pedirElEnlace, ultimoCorreo, restablecer, tokens, reloj } =
    await prepararRecuperacion(contexto)
  await crearACliente()
  await pedirElEnlace(ANA.correo)

  reloj.adelantarMinutos(10)
  await restablecer(codigoDelCorreo(ultimoCorreo()))

  const [token] = await tokens()
  assert.equal(token.usado_en, escribirMomento(reloj()))
})

test("el enlace de una persona no le sirve a otra: cada token es de su cuenta", async (contexto) => {
  const { navegador, crearACliente, pedirElEnlace, ultimoCorreo, restablecer, entrar } =
    await prepararRecuperacion(contexto)
  await crearACliente()
  await navegador("/api/registro", {
    method: "POST",
    cuerpo: { nombre: "Beto Vargas", correo: "beto@ejemplo.com", contrasena: "Prueba456" },
  })
  await navegador("/api/sesion", { method: "DELETE" })

  // El enlace es de Ana. Al usarlo, la que cambia de contraseña tiene que ser Ana y nadie más.
  await pedirElEnlace(ANA.correo)
  await restablecer(codigoDelCorreo(ultimoCorreo()))

  assert.equal((await entrar(ANA.correo, NUEVA)).estado, 200)
  assert.equal((await entrar("beto@ejemplo.com", NUEVA)).estado, 401, "Beto no cambió nada")
  assert.equal((await entrar("beto@ejemplo.com", "Prueba456")).estado, 200)
})

test("restablecer la contraseña apaga la obligación de cambiar la temporal (RN-11)", async (contexto) => {
  const { entorno, navegador, pedirElEnlace, ultimoCorreo, restablecer, entrar } =
    await prepararRecuperacion(contexto)

  // Personal le crea la cuenta a quien llamó por teléfono, con una contraseña temporal.
  await navegador("/api/sesion", { method: "POST", cuerpo: PERSONAL })
  await navegador("/api/personal/clientes", {
    method: "POST",
    cuerpo: { nombre: "Marta Solís", correo: "marta@ejemplo.com" },
  })
  await navegador("/api/sesion", { method: "DELETE" })

  await pedirElEnlace("marta@ejemplo.com")
  await restablecer(codigoDelCorreo(ultimoCorreo()))

  const entrada = await entrar("marta@ejemplo.com", NUEVA)
  assert.equal(entrada.estado, 200)
  assert.equal(
    entrada.cuerpo.debeCambiarContrasena,
    false,
    "la eligió ella misma, así que ya no hay nada temporal que cambiar",
  )

  const guardado = await entorno.base.uno(
    "SELECT debe_cambiar_contrasena FROM cliente WHERE correo = ?",
    "marta@ejemplo.com",
  )
  assert.equal(guardado.debe_cambiar_contrasena, 0)
})

test("un correo mal escrito no rompe nada: contesta lo mismo y no manda nada", async (contexto) => {
  const { pedirElEnlace, enviador, tokens } = await prepararRecuperacion(contexto)

  const respuesta = await pedirElEnlace("esto no es un correo")

  assert.equal(respuesta.estado, 204)
  assert.equal(enviador.enviados.length, 0)
  assert.equal((await tokens()).length, 0)
})

test("el correo llega escrito en sus dos versiones, con diseño y sin él", async (contexto) => {
  const { crearACliente, pedirElEnlace, ultimoCorreo } = await prepararRecuperacion(contexto)
  await crearACliente()

  await pedirElEnlace(ANA.correo)

  const correo = ultimoCorreo()
  assert.match(correo.html, /#restablecer=/, "la versión con diseño trae el enlace")
  assert.match(correo.texto, /#restablecer=/, "y la de respaldo también")
  assert.match(correo.texto, /1 hora|una hora/i, "y dice cuánto dura (RN-27)")
})

// ─────────────────────────────────────────────────────────────────────────────────────────────
// La mudanza de `correo_enviado`
//
// Esta pieza cambió una tabla que ya tenía datos guardados, y eso no lo prueba ninguna de las de
// arriba: todas arrancan de una base recién creada, que ya nace con la forma nueva. Lo que hay que
// comprobar es lo otro — la base de trabajo de alguien que venía usando la aplicación desde antes.
// ─────────────────────────────────────────────────────────────────────────────────────────────

test("una base de antes de la pieza 9 se pone al día sin perder los correos ya registrados", async (contexto) => {
  const carpeta = mkdtempSync(join(tmpdir(), "reservas-base-vieja-"))
  const rutaBase = join(carpeta, "vieja.sqlite")

  // La forma **exacta** que tenía la tabla desde la pieza 4: con `cliente_id` obligatoria y sin
  // ninguna columna para Personal. Se escribe a mano acá a propósito: es la única manera de tener
  // una base vieja de verdad para probar contra ella.
  const vieja = createClient({ url: comoArchivo(rutaBase) })
  await vieja.executeMultiple(`
    -- La tabla de citas, con lo mínimo que necesitan sus dos índices para poder crearse. No hace
    -- falta más: acá no se prueba la tabla de citas, se prueba que el registro de correos que
    -- **apunta** a ella se pueda mudar sin perder nada.
    CREATE TABLE cita (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      proveedor_id INTEGER,
      estado       TEXT,
      inicio       TEXT
    );
    CREATE TABLE cliente (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      correo TEXT NOT NULL UNIQUE,
      contrasena_cifrada TEXT NOT NULL,
      debe_cambiar_contrasena INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE correo_enviado (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      destinatario_correo TEXT NOT NULL,
      cliente_id INTEGER NOT NULL REFERENCES cliente(id),
      cita_id INTEGER REFERENCES cita(id),
      tipo TEXT NOT NULL,
      enviado_en TEXT NOT NULL,
      exito INTEGER NOT NULL
    );
    INSERT INTO cliente (id, nombre, correo, contrasena_cifrada)
      VALUES (7, 'Ana Rodríguez', 'ana@ejemplo.com', 'sal:huella');
    INSERT INTO correo_enviado
      (id, destinatario_correo, cliente_id, cita_id, tipo, enviado_en, exito)
      VALUES (1, 'ana@ejemplo.com', 7, NULL, 'confirmacion', '2026-08-20T10:00:00-06:00', 1);
  `)
  vieja.close()

  const base = await abrirBase(rutaBase)
  await crearEsquema(base)

  // Cerrar y borrar van en el mismo lugar, y en ese orden: Windows no deja borrar un archivo que
  // otro programa todavía tiene abierto. Es el mismo motivo por el que `npm run datos` exige que la
  // aplicación esté apagada.
  contexto.after(async () => {
    await base.cerrar()
    borrarCarpetaDePrueba(carpeta)
  })

  const columnas = (await base.todas("PRAGMA table_info(correo_enviado)")).map((una) => una.name)
  assert.ok(columnas.includes("personal_id"), "la tabla tiene que quedar con la columna nueva")

  // Lo que de verdad importa: la fila que ya estaba sigue ahí, entera.
  const guardada = await base.uno("SELECT * FROM correo_enviado WHERE id = 1")
  assert.equal(guardada.destinatario_correo, "ana@ejemplo.com")
  assert.equal(guardada.cliente_id, 7)
  assert.equal(guardada.personal_id, null)
  assert.equal(guardada.tipo, "confirmacion")
  assert.equal(guardada.enviado_en, "2026-08-20T10:00:00-06:00")
  assert.equal(guardada.exito, 1)

  // Y la tabla ya acepta lo que antes no podía: un correo que le llegó a Personal.
  await base.correr(
    "INSERT INTO personal (nombre, correo, contrasena_cifrada) VALUES (?, ?, ?)",
    "Marta Jiménez",
    "personal@ejemplo.com",
    "sal:huella",
  )
  await base.correr(
    `INSERT INTO correo_enviado
         (destinatario_correo, cliente_id, personal_id, cita_id, tipo, enviado_en, exito)
       VALUES (?, NULL, 1, NULL, 'recuperacion', '2026-08-28T10:00:00-06:00', 1)`,
    "personal@ejemplo.com",
  )

  const cuantos = await base.uno("SELECT COUNT(*) AS cuantos FROM correo_enviado")
  assert.equal(cuantos.cuantos, 2)
})

test("el índice de correos por cita sobrevive a la mudanza", async (contexto) => {
  const carpeta = mkdtempSync(join(tmpdir(), "reservas-base-vieja-"))
  const rutaBase = join(carpeta, "vieja.sqlite")

  const vieja = createClient({ url: comoArchivo(rutaBase) })
  await vieja.executeMultiple(`
    CREATE TABLE correo_enviado (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      destinatario_correo TEXT NOT NULL,
      cliente_id INTEGER NOT NULL,
      cita_id INTEGER,
      tipo TEXT NOT NULL,
      enviado_en TEXT NOT NULL,
      exito INTEGER NOT NULL
    );
    CREATE INDEX correo_por_cita ON correo_enviado (cita_id, tipo);
  `)
  vieja.close()

  const base = await abrirBase(rutaBase)
  await crearEsquema(base)
  contexto.after(async () => {
    await base.cerrar()
    borrarCarpetaDePrueba(carpeta)
  })

  // Un índice se va con la tabla que vigila. Si nadie lo vuelve a crear, la pieza 6 se quedaría sin
  // su atajo y nadie se enteraría: la aplicación funcionaría igual, solo que más lento cada día.
  const indices = (await base.todas("PRAGMA index_list(correo_enviado)")).map((uno) => uno.name)
  assert.ok(indices.includes("correo_por_cita"))
})

// ─────────────────────────────────────────────────────────────────────────────────────────────
// El hallazgo 21: un servicio de afuera puede reescribir lo que mandamos
//
// El 2026-08-28, probando la pieza 9, el botón del correo llevó a una página de error. La causa no
// estaba en el código: **Resend reescribió el enlace** y lo cambió por uno suyo de rastreo de clics
// (`awstrack.me`), que en esa máquina no se pudo abrir. El enlace de verdad viajaba adentro, entero.
//
// Estas dos pruebas cuidan las dos defensas que quedaron. Ninguna de las dos puede comprobar lo que
// hace Resend —eso pasa después de que el correo sale de acá—, pero sí que **de este lado se manda
// lo que hay que mandar**.
// ─────────────────────────────────────────────────────────────────────────────────────────────

test("el botón del correo pide que no lo rastreen, para que no lo reescriban", async (contexto) => {
  const { crearACliente, pedirElEnlace, ultimoCorreo } = await prepararRecuperacion(contexto)
  await crearACliente()

  await pedirElEnlace(ANA.correo)

  // `ses:no-track` es la marca con la que Amazon —que es quien entrega los correos por debajo de
  // Resend— deja un enlace afuera del rastreo de clics. Va en la etiqueta del botón.
  const { html } = ultimoCorreo()
  assert.match(
    html,
    /<a[^>]*ses:no-track[^>]*>/,
    "el botón tiene que llevar la marca que pide no ser rastreado",
  )
})

test("la dirección viaja también como texto suelto, no solo adentro del botón", async (contexto) => {
  const { crearACliente, pedirElEnlace, ultimoCorreo } = await prepararRecuperacion(contexto)
  await crearACliente()

  await pedirElEnlace(ANA.correo)

  const correo = ultimoCorreo()
  const codigo = codigoDelCorreo(correo)
  const enlace = `http://localhost:3000/#restablecer=${codigo}`

  // Dos veces: una adentro del botón y otra a la vista, para copiar y pegar. **Esta segunda es la
  // que salvó la prueba del 2026-08-28**, porque un texto suelto no es un enlace y el servicio de
  // correo no lo toca. Si alguien la saca para «limpiar» el correo, esta prueba se pone roja.
  const cuantasVeces = html_veces(correo.html, enlace)
  assert.ok(
    cuantasVeces >= 2,
    `la dirección tiene que aparecer en el botón Y a la vista; apareció ${cuantasVeces} vez/veces`,
  )
})

/** Cuántas veces aparece un texto adentro de otro. */
function html_veces(donde, que) {
  return donde.split(que).length - 1
}
