// Pruebas de la pieza 2, primera mitad: el catálogo.
//
// Cubren las comprobaciones 1 y 2 de la pieza 2 en `PLAN.md` —ver los servicios, y ver qué
// proveedores atiende cada uno— más los datos del negocio, que son los que la pantalla necesita
// para mostrar el nombre y el teléfono.
//
// Se escribieron antes que el código y se vieron fallar primero: una prueba que nunca falló no
// demuestra que esté comprobando algo.

import test from "node:test"
import assert from "node:assert/strict"

import { crearEntornoDePrueba, crearNavegador, entrarComoClienta, buscarPorNombre } from "./ayudas.js"

test("sin sesión abierta no se pueden ver los servicios", async (t) => {
  const entorno = await crearEntornoDePrueba(t)
  const navegador = crearNavegador(entorno)

  // No hay modo invitado (RN-9): un calendario que se pudiera mirar sin cuenta no llevaría a
  // ninguna parte, porque para reservar hace falta cuenta igual.
  const respuesta = await navegador("/api/servicios")

  assert.equal(respuesta.estado, 401)
})

test("la clienta que entró ve los servicios del negocio", async (t) => {
  const entorno = await crearEntornoDePrueba(t)
  const navegador = crearNavegador(entorno)
  await entrarComoClienta(navegador)

  // Comprobación 1 de la pieza 2.
  //
  // **Cambió el 2026-08-19 con la pieza 11**, y vale la pena dejar escrito qué cambió: antes
  // comprobaba que la lista trajera **exactamente dos** servicios, y al agregarse las categorías con
  // dos tipos de masaje más, esa cuenta pasó a ser tres... y después cuatro. Una prueba atada a
  // cuántos servicios tienen hoy los datos de demostración se rompe cada vez que el negocio agrega
  // uno, sin que nada esté mal.
  //
  // Así que ahora comprueba lo que la comprobación 1 de verdad dice —que los servicios se ven, con su
  // duración— y no una cuenta que va a seguir cambiando. Es la misma lección de la pieza 2 con Luisa:
  // una prueba no se ata a los datos de demostración.
  const respuesta = await navegador("/api/servicios")

  assert.equal(respuesta.estado, 200)

  const masaje = buscarPorNombre(respuesta.cuerpo, "Masaje relajante")
  const facial = buscarPorNombre(respuesta.cuerpo, "Limpieza facial")

  assert.ok(masaje, "tiene que estar «Masaje relajante»")
  assert.ok(facial, "tiene que estar «Limpieza facial»")

  // Todas las citas duran una hora en este prototipo (glosario de `ESPECIFICACION.md`).
  assert.equal(masaje.duracionMinutos, 60)
  assert.equal(facial.duracionMinutos, 60)

  // Y desde la pieza 11 cada servicio dice de qué categoría es.
  assert.equal(masaje.categoria, "Masaje")
  assert.equal(facial.categoria, "Facial")
})

test("el masaje lo atienden Ana y Carlos", async (t) => {
  const entorno = await crearEntornoDePrueba(t)
  const navegador = crearNavegador(entorno)
  await entrarComoClienta(navegador)

  // Comprobación 2 de la pieza 2, primera mitad.
  const servicios = await navegador("/api/servicios")
  const masaje = buscarPorNombre(servicios.cuerpo, "Masaje relajante")

  const respuesta = await navegador(`/api/servicios/${masaje.id}/proveedores`)

  assert.equal(respuesta.estado, 200)
  assert.equal(respuesta.cuerpo.length, 2)
  assert.ok(buscarPorNombre(respuesta.cuerpo, "Ana"), "tiene que estar Ana")
  assert.ok(buscarPorNombre(respuesta.cuerpo, "Carlos"), "tiene que estar Carlos")
})

test("la limpieza facial la atienden Ana y Luisa", async (t) => {
  const entorno = await crearEntornoDePrueba(t)
  const navegador = crearNavegador(entorno)
  await entrarComoClienta(navegador)

  // Comprobación 2 de la pieza 2, segunda mitad. Decía «solo Ana» hasta que la estudiante agregó a
  // Luisa el 2026-08-19: con una sola proveedora el cliente no elegía nada, y elegir con quién es
  // justamente lo que le da RN-8.
  const servicios = await navegador("/api/servicios")
  const facial = buscarPorNombre(servicios.cuerpo, "Limpieza facial")

  const respuesta = await navegador(`/api/servicios/${facial.id}/proveedores`)

  assert.equal(respuesta.estado, 200)
  assert.equal(respuesta.cuerpo.length, 2)
  assert.ok(buscarPorNombre(respuesta.cuerpo, "Ana"), "tiene que estar Ana")
  assert.ok(buscarPorNombre(respuesta.cuerpo, "Luisa"), "tiene que estar Luisa")

  // Y Carlos, que solo atiende el masaje, no puede aparecer acá.
  assert.ok(!buscarPorNombre(respuesta.cuerpo, "Carlos"), "Carlos no atiende la limpieza facial")
})

test("un servicio con un solo proveedor igual dice quién lo atiende", async (t) => {
  const entorno = await crearEntornoDePrueba(t)
  const navegador = crearNavegador(entorno)
  await entrarComoClienta(navegador)

  // RN-8 pide que, cuando un servicio tiene un solo proveedor, igual quede claro quién atiende.
  // Ese caso lo cubrían los datos de prueba mientras la limpieza facial tenía solo a Ana; desde
  // que Luisa se sumó (2026-08-19) ya no hay ningún servicio así, así que **la prueba se crea el
  // suyo**. La regla queda protegida aunque los datos de demostración cambien.
  // **Cambió el 2026-08-19 con la pieza 11**: ahora todo servicio pertenece obligatoriamente a una
  // categoría, así que esta prueba crea también la suya. Lo que comprueba sigue siendo exactamente lo
  // mismo —la segunda mitad de RN-8, que con un solo proveedor igual se diga quién es— y sigue
  // creándose sus propios datos en vez de depender de los de demostración.
  const categoria = entorno.base
    .prepare("INSERT INTO categoria (nombre) VALUES ('Terapias')")
    .run()
  const servicio = entorno.base
    .prepare(
      "INSERT INTO servicio (nombre, duracion_minutos, categoria_id) VALUES ('Reflexología', 60, ?)",
    )
    .run(Number(categoria.lastInsertRowid))
  const proveedor = entorno.base.prepare("INSERT INTO proveedor (nombre) VALUES ('Sofía')").run()
  entorno.base
    .prepare("INSERT INTO servicio_proveedor (servicio_id, proveedor_id) VALUES (?, ?)")
    .run(servicio.lastInsertRowid, proveedor.lastInsertRowid)

  const respuesta = await navegador(`/api/servicios/${servicio.lastInsertRowid}/proveedores`)

  assert.equal(respuesta.estado, 200)
  assert.equal(respuesta.cuerpo.length, 1)
  assert.equal(respuesta.cuerpo[0].nombre, "Sofía")
})

test("pedir los proveedores de un servicio que no existe da 404", async (t) => {
  const entorno = await crearEntornoDePrueba(t)
  const navegador = crearNavegador(entorno)
  await entrarComoClienta(navegador)

  const respuesta = await navegador("/api/servicios/9999/proveedores")

  assert.equal(respuesta.estado, 404)
})

test("los datos del negocio se leen sin haber entrado, porque el pie de página los muestra siempre", async (t) => {
  const entorno = await crearEntornoDePrueba(t)
  const navegador = crearNavegador(entorno)

  const respuesta = await navegador("/api/negocio")

  assert.equal(respuesta.estado, 200)
  assert.ok(respuesta.cuerpo.nombre, "el negocio tiene que tener nombre (REG-4)")
  // El teléfono se agregó en la pieza 2: el sistema le dice al cliente «llame al negocio» en dos
  // situaciones (RN-4 y RN-5) y necesita poder decirle a qué número.
  assert.ok(respuesta.cuerpo.telefono, "el negocio tiene que tener teléfono (REG-4)")
  assert.ok(respuesta.cuerpo.ubicacion, "el negocio tiene que tener ubicación (REG-4)")
})

test("los datos del negocio no traen ninguna contraseña ni nada de las cuentas", async (t) => {
  const entorno = await crearEntornoDePrueba(t)
  const navegador = crearNavegador(entorno)

  // Como este endpoint se lee sin sesión, hay que asegurarse de que no filtre nada más que la
  // configuración del negocio.
  const respuesta = await navegador("/api/negocio")

  const texto = JSON.stringify(respuesta.cuerpo)
  assert.ok(!texto.includes("contrasena"), "no puede aparecer nada de contraseñas")
  assert.ok(!texto.includes("@ejemplo.com"), "no puede aparecer ningún correo de las cuentas")
})
