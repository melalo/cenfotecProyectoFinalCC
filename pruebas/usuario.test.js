// Pruebas de la pieza 10: la información del cliente (la sección «Usuario»).
//
// Cubren RF-22 y RN-21: ver los datos propios, completarlos, corregirlos, y **no** poder cambiar el
// correo. La parte más delicada es la **edad**, porque no se guarda: se calcula cada vez, y las
// cuentas de edades tienen un caso borde clásico —el día antes del cumpleaños— que se prueba aparte.
//
// Todas paran el reloj en `MOMENTO_DE_PRUEBA` (martes 1 de setiembre de 2026, 8 de la mañana de
// Costa Rica). Sin eso, una prueba que dice «tiene 36 años» empezaría a fallar sola el día del
// cumpleaños de la clienta inventada.
//
// Se escribieron antes del código y se vieron fallar primero.

import test from "node:test"
import assert from "node:assert/strict"

import {
  crearEntornoDePrueba,
  crearNavegador,
  entrarComoClienta,
  entrarComoOtroCliente,
  entrarComoPersonal,
  buscarPorNombre,
  relojDetenidoEn,
  ANA,
  MOMENTO_DE_PRUEBA,
} from "./ayudas.js"

/** Levanta la aplicación con el reloj parado y entra como Ana. */
async function prepararUsuario(contexto) {
  const entorno = await crearEntornoDePrueba(contexto, { reloj: relojDetenidoEn(MOMENTO_DE_PRUEBA) })
  const navegador = crearNavegador(entorno)
  await entrarComoClienta(navegador)

  /** Manda los datos a guardar. */
  async function guardar(datos) {
    return navegador("/api/mi-informacion", { method: "PUT", cuerpo: datos })
  }

  async function mirar() {
    return navegador("/api/mi-informacion")
  }

  return { entorno, navegador, guardar, mirar }
}

/** Reserva una cita, que es lo que le da a un cliente su «desde cuándo». */
async function reservar(navegador, inicio) {
  const servicios = await navegador("/api/servicios")
  const masaje = buscarPorNombre(servicios.cuerpo, "Masaje relajante")

  const proveedores = await navegador(`/api/servicios/${masaje.id}/proveedores`)
  const ana = buscarPorNombre(proveedores.cuerpo, "Ana")

  return navegador("/api/citas", {
    method: "POST",
    cuerpo: { servicioId: masaje.id, proveedorId: ana.id, inicio },
  })
}

// ══════════════════════════════════════════════════════ quién puede ver esta sección

test("sin sesión abierta no se puede ver la información de nadie", async (t) => {
  const entorno = await crearEntornoDePrueba(t, { reloj: relojDetenidoEn(MOMENTO_DE_PRUEBA) })
  const navegador = crearNavegador(entorno)

  const vista = await navegador("/api/mi-informacion")
  const guardada = await navegador("/api/mi-informacion", { method: "PUT", cuerpo: { nombre: "X" } })

  assert.equal(vista.estado, 401)
  assert.equal(guardada.estado, 401)
})

test("la cuenta de Personal no usa esta sección", async (t) => {
  const entorno = await crearEntornoDePrueba(t, { reloj: relojDetenidoEn(MOMENTO_DE_PRUEBA) })
  const navegador = crearNavegador(entorno)
  await entrarComoPersonal(navegador)

  // Es la información **de un cliente**. Personal tiene su propia cuenta, y lo que necesita para
  // atender el teléfono es la pieza 7, con su propio recorrido.
  const vista = await navegador("/api/mi-informacion")

  assert.equal(vista.estado, 403)
  assert.equal(vista.cuerpo.error, "solo_clientes")
})

// ══════════════════════════════════════════════════════ comprobación 1: qué se ve al principio

test("comprobación 1: al abrir la sección se ven el nombre y el correo, y el resto vacío", async (t) => {
  const { mirar } = await prepararUsuario(t)

  const respuesta = await mirar()

  assert.equal(respuesta.estado, 200)
  assert.equal(respuesta.cuerpo.nombre, ANA.nombre)
  assert.equal(respuesta.cuerpo.correo, ANA.correo)

  // El teléfono y la fecha de nacimiento son opcionales: una cuenta se crea sin ellos (REG-2).
  assert.equal(respuesta.cuerpo.telefono, null)
  assert.equal(respuesta.cuerpo.fechaNacimiento, null)
  // Sin fecha de nacimiento no hay edad que calcular.
  assert.equal(respuesta.cuerpo.edad, null)
  // Y sin ninguna cita todavía, no hay «desde cuándo».
  assert.equal(respuesta.cuerpo.clienteDesde, null)
})

// ══════════════════════════════════════════════════════ comprobación 2: completar los datos

test("comprobación 2: se completan el teléfono y la fecha de nacimiento, y la edad se calcula", async (t) => {
  const { guardar, mirar } = await prepararUsuario(t)

  const guardada = await guardar({
    nombre: ANA.nombre,
    telefono: "88887777",
    fechaNacimiento: "1990-03-15",
  })

  assert.equal(guardada.estado, 200)
  // El teléfono se guarda normalizado, con el guión, como el del negocio: `2000-0000`.
  assert.equal(guardada.cuerpo.telefono, "8888-7777")
  assert.equal(guardada.cuerpo.fechaNacimiento, "1990-03-15")
  // El reloj está parado el 1 de setiembre de 2026, y el cumpleaños de marzo ya pasó: 36 años.
  assert.equal(guardada.cuerpo.edad, 36)

  // Y al volver a mirar, es lo mismo: se guardó de verdad.
  const respuesta = await mirar()
  assert.equal(respuesta.cuerpo.telefono, "8888-7777")
  assert.equal(respuesta.cuerpo.edad, 36)
})

test("el teléfono se acepta escrito con guión y queda igual", async (t) => {
  const { guardar } = await prepararUsuario(t)

  const guardada = await guardar({ nombre: ANA.nombre, telefono: "8888-7777" })

  assert.equal(guardada.estado, 200)
  assert.equal(guardada.cuerpo.telefono, "8888-7777")
})

test("se puede corregir el nombre", async (t) => {
  const { guardar, mirar } = await prepararUsuario(t)

  await guardar({ nombre: "Ana María Rodríguez" })

  const respuesta = await mirar()
  assert.equal(respuesta.cuerpo.nombre, "Ana María Rodríguez")
})

test("se pueden borrar el teléfono y la fecha de nacimiento, porque son opcionales", async (t) => {
  const { guardar, mirar } = await prepararUsuario(t)

  await guardar({ nombre: ANA.nombre, telefono: "88887777", fechaNacimiento: "1990-03-15" })
  await guardar({ nombre: ANA.nombre, telefono: "", fechaNacimiento: "" })

  const respuesta = await mirar()
  assert.equal(respuesta.cuerpo.telefono, null)
  assert.equal(respuesta.cuerpo.fechaNacimiento, null)
  assert.equal(respuesta.cuerpo.edad, null)
})

// ══════════════════════════════════════════════════════ la edad, que es la cuenta delicada

test("la edad no suma el año hasta el día del cumpleaños", async (t) => {
  const { guardar } = await prepararUsuario(t)

  // El reloj está parado el **1 de setiembre** de 2026.
  //
  // Este es el caso borde clásico de las cuentas de edad: restar los años a secas daría 36 para
  // alguien que cumple en octubre, y todavía tiene 35.
  const elDiaAntes = await guardar({ nombre: ANA.nombre, fechaNacimiento: "1990-09-02" })
  assert.equal(elDiaAntes.cuerpo.edad, 35, "un día antes del cumpleaños todavía no cumplió")

  const elMismoDia = await guardar({ nombre: ANA.nombre, fechaNacimiento: "1990-09-01" })
  assert.equal(elMismoDia.cuerpo.edad, 36, "el día del cumpleaños ya cumplió")

  const elDiaDespues = await guardar({ nombre: ANA.nombre, fechaNacimiento: "1990-08-31" })
  assert.equal(elDiaDespues.cuerpo.edad, 36)

  // Y el mes: alguien que cumple en diciembre todavía tiene 35 en setiembre.
  const mesesDespues = await guardar({ nombre: ANA.nombre, fechaNacimiento: "1990-12-25" })
  assert.equal(mesesDespues.cuerpo.edad, 35)
})

test("quien nació el 29 de febrero también tiene su edad", async (t) => {
  const { guardar } = await prepararUsuario(t)

  // 2000 fue bisiesto. En setiembre de 2026 ya cumplió, así que tiene 26.
  const guardada = await guardar({ nombre: ANA.nombre, fechaNacimiento: "2000-02-29" })

  assert.equal(guardada.estado, 200)
  assert.equal(guardada.cuerpo.edad, 26)
})

// ══════════════════════════════════════════════════════ comprobaciones 4 y 5: lo que se rechaza

test("comprobación 4: un teléfono que no sean 8 dígitos se rechaza", async (t) => {
  const { guardar } = await prepararUsuario(t)

  for (const malo of ["8888777", "888877771", "llamame al celu", "8888-777a"]) {
    const respuesta = await guardar({ nombre: ANA.nombre, telefono: malo })
    assert.equal(respuesta.estado, 422, `«${malo}» tendría que rechazarse`)
    assert.equal(respuesta.cuerpo.error, "telefono_invalido")
  }
})

test("comprobación 5: una fecha de nacimiento del futuro se rechaza", async (t) => {
  const { guardar } = await prepararUsuario(t)

  // El reloj está parado el 1 de setiembre de 2026, así que el 2 ya es futuro.
  const respuesta = await guardar({ nombre: ANA.nombre, fechaNacimiento: "2026-09-02" })

  assert.equal(respuesta.estado, 422)
  assert.equal(respuesta.cuerpo.error, "fecha_nacimiento_invalida")
})

test("una fecha de nacimiento que no existe se rechaza", async (t) => {
  const { guardar } = await prepararUsuario(t)

  for (const mala of ["1990-02-31", "1990-13-05", "15/03/1990", "1990-3-5", "ayer"]) {
    const respuesta = await guardar({ nombre: ANA.nombre, fechaNacimiento: mala })
    assert.equal(respuesta.estado, 422, `«${mala}» tendría que rechazarse`)
    assert.equal(respuesta.cuerpo.error, "fecha_nacimiento_invalida")
  }
})

test("una fecha de nacimiento de hace más de 120 años se rechaza", async (t) => {
  const { guardar } = await prepararUsuario(t)

  // No es una regla del negocio: es que un dedazo en el año —escribir 1090 en vez de 1990— tiene que
  // avisar en vez de guardarse y mostrar «936 años».
  const respuesta = await guardar({ nombre: ANA.nombre, fechaNacimiento: "1090-03-15" })

  assert.equal(respuesta.estado, 422)
  assert.equal(respuesta.cuerpo.error, "fecha_nacimiento_invalida")
})

test("un nombre vacío se rechaza", async (t) => {
  const { guardar, mirar } = await prepararUsuario(t)

  for (const malo of ["", "   ", undefined]) {
    const respuesta = await guardar({ nombre: malo, telefono: "88887777" })
    assert.equal(respuesta.estado, 422)
    assert.equal(respuesta.cuerpo.error, "nombre_invalido")
  }

  // Y no se guardó nada de lo demás que venía en el mismo pedido: o se guarda todo, o nada.
  const respuesta = await mirar()
  assert.equal(respuesta.cuerpo.nombre, ANA.nombre)
  assert.equal(respuesta.cuerpo.telefono, null)
})

// ══════════════════════════════════════════════════════ RN-21: el correo no se cambia

test("el correo no se puede cambiar desde acá (RN-21)", async (t) => {
  const { navegador, guardar, mirar } = await prepararUsuario(t)

  // Aunque venga en el pedido, se ignora: el correo es con lo que se entra al sistema.
  const guardada = await guardar({
    nombre: ANA.nombre,
    correo: "otro@ejemplo.com",
    telefono: "88887777",
  })

  assert.equal(guardada.estado, 200)
  assert.equal(guardada.cuerpo.correo, ANA.correo)

  const respuesta = await mirar()
  assert.equal(respuesta.cuerpo.correo, ANA.correo)

  // Y se sigue entrando con el correo de siempre.
  await navegador("/api/sesion", { method: "DELETE" })
  const entrada = await navegador("/api/sesion", {
    method: "POST",
    cuerpo: { correo: ANA.correo, contrasena: ANA.contrasena },
  })
  assert.equal(entrada.estado, 200)
})

// ══════════════════════════════════════════════════════ comprobación 6: desde cuándo es cliente

test("comprobación 6: «desde cuándo es cliente» es la fecha de su primera cita", async (t) => {
  const { navegador, mirar } = await prepararUsuario(t)

  const antes = await mirar()
  assert.equal(antes.cuerpo.clienteDesde, null, "sin citas todavía no hay desde cuándo")

  // El reloj está parado el martes 1 de setiembre, así que se reserva del 2 en adelante.
  await reservar(navegador, "2026-09-03T10:00:00-06:00")

  const despues = await mirar()
  assert.equal(despues.cuerpo.clienteDesde, "2026-09-03")
})

test("«desde cuándo es cliente» se queda en la primera, aunque después reserve otras", async (t) => {
  const { navegador, mirar } = await prepararUsuario(t)

  // Se reserva primero la más lejana, para que no alcance con «la última que entró».
  await reservar(navegador, "2026-09-10T10:00:00-06:00")
  await reservar(navegador, "2026-09-03T11:00:00-06:00")

  const respuesta = await mirar()
  assert.equal(respuesta.cuerpo.clienteDesde, "2026-09-03")
})

// ══════════════════════════════════════════════════════ cada cliente ve lo suyo

test("la información de un cliente es solo la suya", async (t) => {
  const { entorno, guardar } = await prepararUsuario(t)

  await guardar({ nombre: ANA.nombre, telefono: "88887777", fechaNacimiento: "1990-03-15" })

  const otroNavegador = crearNavegador(entorno)
  await entrarComoOtroCliente(otroNavegador)

  const suya = await otroNavegador("/api/mi-informacion")

  assert.equal(suya.estado, 200)
  assert.equal(suya.cuerpo.nombre, "Beto Vargas")
  assert.equal(suya.cuerpo.telefono, null, "los datos de Ana no son los de Beto")
})

// ══════════════════════════════════════════════════════ comprobación 3: sobrevive el reinicio

test("comprobación 3: los datos siguen ahí después de apagar y volver a levantar", async (t) => {
  const { entorno, navegador, guardar } = await prepararUsuario(t)

  await guardar({ nombre: ANA.nombre, telefono: "88887777", fechaNacimiento: "1990-03-15" })

  await entorno.apagar()
  await entorno.levantar()

  const respuesta = await navegador("/api/mi-informacion")

  assert.equal(respuesta.cuerpo.telefono, "8888-7777")
  assert.equal(respuesta.cuerpo.fechaNacimiento, "1990-03-15")
  assert.equal(respuesta.cuerpo.edad, 36)
})
