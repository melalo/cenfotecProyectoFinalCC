// Pruebas de la pieza 1: entrar a la aplicación.
//
// Cada prueba comprueba UNA de las cosas que `PLAN.md` dice que tienen que ser ciertas en esta
// pieza. Se escribieron antes que el código y se vieron fallar primero: una prueba que nunca
// falló no demuestra que esté comprobando algo.

import test from "node:test"
import assert from "node:assert/strict"

import { crearEntornoDePrueba, crearNavegador, ANA, PERSONAL } from "./ayudas.js"

test("una persona sin cuenta se registra con nombre, correo y contraseña, y queda como cliente", async (t) => {
  const entorno = await crearEntornoDePrueba(t)
  const navegador = crearNavegador(entorno)

  const respuesta = await navegador("/api/registro", { method: "POST", cuerpo: ANA })

  assert.equal(respuesta.estado, 201)
  assert.equal(respuesta.cuerpo.nombre, ANA.nombre)
  assert.equal(respuesta.cuerpo.correo, ANA.correo)
  assert.equal(respuesta.cuerpo.tipo, "cliente")
  assert.ok(respuesta.cuerpo.id > 0, "la cuenta nueva tiene que tener un id")
})

test("al registrarse queda con la sesión abierta, sin tener que entrar otra vez", async (t) => {
  const entorno = await crearEntornoDePrueba(t)
  const navegador = crearNavegador(entorno)

  await navegador("/api/registro", { method: "POST", cuerpo: ANA })

  // La comprobación 1 de la pieza 1 dice: se registra «y ve que entra y la pantalla la saluda por
  // su nombre». Para saludarla, la aplicación tiene que reconocerla ya.
  const yo = await navegador("/api/yo")
  assert.equal(yo.estado, 200)
  assert.equal(yo.cuerpo.nombre, ANA.nombre)
  assert.equal(yo.cuerpo.tipo, "cliente")
})

test("la contraseña se guarda cifrada, nunca en texto legible", async (t) => {
  const entorno = await crearEntornoDePrueba(t)
  const navegador = crearNavegador(entorno)

  await navegador("/api/registro", { method: "POST", cuerpo: ANA })

  const fila = entorno.base
    .prepare("SELECT contrasena_cifrada FROM cliente WHERE correo = ?")
    .get(ANA.correo)

  assert.ok(fila, "la clienta tiene que haber quedado guardada")
  assert.notEqual(fila.contrasena_cifrada, ANA.contrasena)
  assert.ok(
    !fila.contrasena_cifrada.includes(ANA.contrasena),
    "la contraseña no puede aparecer ni siquiera adentro del texto guardado",
  )
})

test("dos cuentas no pueden tener el mismo correo", async (t) => {
  const entorno = await crearEntornoDePrueba(t)
  const navegador = crearNavegador(entorno)

  await navegador("/api/registro", { method: "POST", cuerpo: ANA })
  const segunda = await navegador("/api/registro", {
    method: "POST",
    cuerpo: { ...ANA, nombre: "Otra Ana" },
  })

  assert.equal(segunda.estado, 409)
})

test("el mismo correo escrito con mayúsculas tampoco puede registrarse dos veces", async (t) => {
  const entorno = await crearEntornoDePrueba(t)
  const navegador = crearNavegador(entorno)

  await navegador("/api/registro", { method: "POST", cuerpo: ANA })
  const segunda = await navegador("/api/registro", {
    method: "POST",
    cuerpo: { ...ANA, correo: "ANA@Ejemplo.com" },
  })

  assert.equal(segunda.estado, 409)
})

test("registrarse sin alguno de los tres datos se rechaza", async (t) => {
  const entorno = await crearEntornoDePrueba(t)
  const navegador = crearNavegador(entorno)

  const sinNombre = await navegador("/api/registro", {
    method: "POST",
    cuerpo: { correo: ANA.correo, contrasena: ANA.contrasena },
  })

  assert.equal(sinNombre.estado, 422)
  assert.equal(sinNombre.cuerpo.error, "datos_incompletos")
})

test("con su correo y su contraseña entra, y queda con la sesión abierta", async (t) => {
  const entorno = await crearEntornoDePrueba(t)
  const navegador = crearNavegador(entorno)
  await navegador("/api/registro", { method: "POST", cuerpo: ANA })

  const entrada = await navegador("/api/sesion", {
    method: "POST",
    cuerpo: { correo: ANA.correo, contrasena: ANA.contrasena },
  })

  assert.equal(entrada.estado, 200)
  assert.equal(entrada.cuerpo.nombre, ANA.nombre)
  assert.equal(entrada.cuerpo.tipo, "cliente")
  assert.equal(entrada.cuerpo.debeCambiarContrasena, false)

  // La sesión quedó abierta: el pedido siguiente ya sabe quién es sin volver a dar la contraseña.
  const yo = await navegador("/api/yo")
  assert.equal(yo.estado, 200)
  assert.equal(yo.cuerpo.nombre, ANA.nombre)
})

test("una contraseña equivocada y un correo que no existe devuelven exactamente la misma respuesta", async (t) => {
  const entorno = await crearEntornoDePrueba(t)
  const navegador = crearNavegador(entorno)
  await navegador("/api/registro", { method: "POST", cuerpo: ANA })

  const contrasenaMala = await navegador("/api/sesion", {
    method: "POST",
    cuerpo: { correo: ANA.correo, contrasena: "Prueba124" },
  })
  const correoQueNoExiste = await navegador("/api/sesion", {
    method: "POST",
    cuerpo: { correo: "noexiste@ejemplo.com", contrasena: ANA.contrasena },
  })

  assert.equal(contrasenaMala.estado, 401)
  assert.equal(contrasenaMala.cuerpo.error, "credenciales_invalidas")

  // Palabra por palabra lo mismo: si las dos respuestas se diferenciaran en algo, alguien podría
  // averiguar qué correos están registrados probando uno por uno.
  assert.equal(correoQueNoExiste.estado, contrasenaMala.estado)
  assert.deepEqual(correoQueNoExiste.cuerpo, contrasenaMala.cuerpo)
})

test("sin sesión, la aplicación no dice quién sos", async (t) => {
  const entorno = await crearEntornoDePrueba(t)
  const navegador = crearNavegador(entorno)

  const yo = await navegador("/api/yo")

  assert.equal(yo.estado, 401)
})

test("cerrar sesión deja de reconocer a quien había entrado", async (t) => {
  const entorno = await crearEntornoDePrueba(t)
  const navegador = crearNavegador(entorno)
  await navegador("/api/registro", { method: "POST", cuerpo: ANA })
  await navegador("/api/sesion", {
    method: "POST",
    cuerpo: { correo: ANA.correo, contrasena: ANA.contrasena },
  })

  const salida = await navegador("/api/sesion", { method: "DELETE" })
  assert.equal(salida.estado, 204)

  const yo = await navegador("/api/yo")
  assert.equal(yo.estado, 401)
})

test("una cookie de sesión inventada a mano no sirve", async (t) => {
  const entorno = await crearEntornoDePrueba(t)
  const navegador = crearNavegador(entorno)
  await navegador("/api/registro", { method: "POST", cuerpo: ANA })

  // Alguien que sabe que existe la clienta con id 1 se fabrica la cookie sin saber la firma.
  const yo = await navegador("/api/yo", {
    headers: { cookie: `sesion=${Buffer.from('{"id":1,"tipo":"cliente"}').toString("base64url")}.firmafalsa` },
  })

  assert.equal(yo.estado, 401)
})

test("la cuenta de Personal viene precargada y la aplicación la reconoce como tipo personal", async (t) => {
  const entorno = await crearEntornoDePrueba(t)
  const navegador = crearNavegador(entorno)

  const entrada = await navegador("/api/sesion", {
    method: "POST",
    cuerpo: { correo: PERSONAL.correo, contrasena: PERSONAL.contrasena },
  })

  assert.equal(entrada.estado, 200)
  assert.equal(entrada.cuerpo.tipo, "personal")
})

test("no hay pantalla ni endpoint para registrar una cuenta de Personal", async (t) => {
  const entorno = await crearEntornoDePrueba(t)
  const navegador = crearNavegador(entorno)

  // Quien intente colarse como Personal por el registro normal queda como cliente, no como
  // Personal: RN-10 dice que la cuenta de Personal no se autorregistra.
  const respuesta = await navegador("/api/registro", {
    method: "POST",
    cuerpo: { ...ANA, tipo: "personal" },
  })

  assert.equal(respuesta.estado, 201)
  assert.equal(respuesta.cuerpo.tipo, "cliente")
})

test("los datos siguen ahí después de apagar y volver a levantar la aplicación", async (t) => {
  const entorno = await crearEntornoDePrueba(t)
  await crearNavegador(entorno)("/api/registro", { method: "POST", cuerpo: ANA })

  await entorno.apagar()
  await entorno.levantar()

  // Navegador nuevo: sin la cookie de antes, tiene que poder entrar con su contraseña.
  const otroNavegador = crearNavegador(entorno)
  const entrada = await otroNavegador("/api/sesion", {
    method: "POST",
    cuerpo: { correo: ANA.correo, contrasena: ANA.contrasena },
  })

  assert.equal(entrada.estado, 200)
  assert.equal(entrada.cuerpo.nombre, ANA.nombre)
})
