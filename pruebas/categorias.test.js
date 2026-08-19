// Pruebas de la pieza 11: las categorías de servicio.
//
// Cubren RF-5 corregido y RN-22: el cliente elige primero una categoría —«Masaje», «Facial»— y
// después el servicio de adentro, **salvo que la categoría tenga uno solo**, en cuyo caso ese paso no
// se muestra.
//
// La regla que más importa acá es que **quién decide si el paso se muestra es el servidor**, no la
// pantalla: por eso cada categoría llega con un campo `pideElegirTipo` y hay una prueba solo para él.
//
// Se escribieron antes del código y se vieron fallar primero.

import test from "node:test"
import assert from "node:assert/strict"

import {
  crearEntornoDePrueba,
  crearNavegador,
  entrarComoClienta,
  buscarPorNombre,
} from "./ayudas.js"

async function prepararCatalogo(contexto) {
  const entorno = await crearEntornoDePrueba(contexto)
  const navegador = crearNavegador(entorno)
  await entrarComoClienta(navegador)

  return { entorno, navegador }
}

test("sin sesión abierta no se pueden ver las categorías", async (t) => {
  const entorno = await crearEntornoDePrueba(t)
  const navegador = crearNavegador(entorno)

  // Misma regla que el resto del catálogo: no hay modo invitado (RN-9).
  const respuesta = await navegador("/api/categorias")

  assert.equal(respuesta.estado, 401)
})

// ══════════════════════════════════════════════════════ comprobación 1: se ven las categorías

test("comprobación 1: la clienta ve las categorías del negocio, no la lista de servicios", async (t) => {
  const { navegador } = await prepararCatalogo(t)

  const respuesta = await navegador("/api/categorias")

  assert.equal(respuesta.estado, 200)
  assert.equal(respuesta.cuerpo.length, 2)

  const masaje = buscarPorNombre(respuesta.cuerpo, "Masaje")
  const facial = buscarPorNombre(respuesta.cuerpo, "Facial")

  assert.ok(masaje, "tiene que estar la categoría «Masaje»")
  assert.ok(facial, "tiene que estar la categoría «Facial»")
})

// ══════════════════════════════════════════════════════ comprobación 2: los tipos de una categoría

test("comprobación 2: la categoría «Masaje» trae los tres tipos de masaje", async (t) => {
  const { navegador } = await prepararCatalogo(t)

  const respuesta = await navegador("/api/categorias")
  const masaje = buscarPorNombre(respuesta.cuerpo, "Masaje")

  assert.equal(masaje.servicios.length, 3)

  for (const nombre of [
    "Masaje relajante",
    "Masaje descontracturante",
    "Masaje con piedras calientes",
  ]) {
    assert.ok(buscarPorNombre(masaje.servicios, nombre), `tiene que estar «${nombre}»`)
  }

  // Todos duran una hora: los subtipos no traen duraciones distintas, que está declarado fuera de
  // alcance en `ESPECIFICACION.md`.
  for (const servicio of masaje.servicios) {
    assert.equal(servicio.duracionMinutos, 60, `«${servicio.nombre}» tiene que durar una hora`)
  }
})

test("los mismos tres tipos salen por el endpoint de una sola categoría", async (t) => {
  const { navegador } = await prepararCatalogo(t)

  const categorias = await navegador("/api/categorias")
  const masaje = buscarPorNombre(categorias.cuerpo, "Masaje")

  const respuesta = await navegador(`/api/categorias/${masaje.id}/servicios`)

  assert.equal(respuesta.estado, 200)
  assert.equal(respuesta.cuerpo.length, 3)
  assert.ok(buscarPorNombre(respuesta.cuerpo, "Masaje descontracturante"))
})

// ══════════════════════════════════════════════════════ RN-22: quién decide si el paso se muestra

test("RN-22: el servidor dice si hay que elegir el tipo, y la pantalla no lo deduce", async (t) => {
  const { navegador } = await prepararCatalogo(t)

  const respuesta = await navegador("/api/categorias")
  const masaje = buscarPorNombre(respuesta.cuerpo, "Masaje")
  const facial = buscarPorNombre(respuesta.cuerpo, "Facial")

  // Con tres tipos, el cliente elige.
  assert.equal(masaje.pideElegirTipo, true)

  // Con uno solo, no: el sistema lo toma y se salta el paso.
  assert.equal(facial.servicios.length, 1)
  assert.equal(facial.pideElegirTipo, false)
})

// ══════════════════════════════════════════════════════ comprobación 3 y 4: seguir el recorrido

test("comprobación 3: «Masaje relajante» lo siguen atendiendo Ana y Carlos", async (t) => {
  const { navegador } = await prepararCatalogo(t)

  const categorias = await navegador("/api/categorias")
  const masaje = buscarPorNombre(categorias.cuerpo, "Masaje")
  const relajante = buscarPorNombre(masaje.servicios, "Masaje relajante")

  const respuesta = await navegador(`/api/servicios/${relajante.id}/proveedores`)

  assert.equal(respuesta.estado, 200)
  assert.equal(respuesta.cuerpo.length, 2)
  assert.ok(buscarPorNombre(respuesta.cuerpo, "Ana"))
  assert.ok(buscarPorNombre(respuesta.cuerpo, "Carlos"))
})

test("comprobación 4: la categoría de un solo servicio lleva directo a sus proveedores", async (t) => {
  const { navegador } = await prepararCatalogo(t)

  const categorias = await navegador("/api/categorias")
  const facial = buscarPorNombre(categorias.cuerpo, "Facial")

  // Este es el camino que hace la pantalla cuando `pideElegirTipo` es `false`: toma el único
  // servicio y pide sus proveedores, sin mostrar ningún paso en el medio.
  const unico = facial.servicios[0]
  assert.equal(unico.nombre, "Limpieza facial")

  const respuesta = await navegador(`/api/servicios/${unico.id}/proveedores`)

  assert.equal(respuesta.cuerpo.length, 2)
  assert.ok(buscarPorNombre(respuesta.cuerpo, "Ana"))
  assert.ok(buscarPorNombre(respuesta.cuerpo, "Luisa"))
})

test("cada tipo de masaje tiene los proveedores que le corresponden", async (t) => {
  const { navegador } = await prepararCatalogo(t)

  const categorias = await navegador("/api/categorias")
  const masaje = buscarPorNombre(categorias.cuerpo, "Masaje")

  const descontracturante = buscarPorNombre(masaje.servicios, "Masaje descontracturante")
  const piedras = buscarPorNombre(masaje.servicios, "Masaje con piedras calientes")

  // Dos servicios de la misma categoría con proveedores distintos: elegir el tipo cambia quién
  // atiende, así que el paso nuevo no es decorativo.
  const deDescontracturante = await navegador(`/api/servicios/${descontracturante.id}/proveedores`)
  assert.equal(deDescontracturante.cuerpo.length, 1)
  assert.equal(deDescontracturante.cuerpo[0].nombre, "Carlos")

  const dePiedras = await navegador(`/api/servicios/${piedras.id}/proveedores`)
  assert.equal(dePiedras.cuerpo.length, 1)
  assert.equal(dePiedras.cuerpo[0].nombre, "Ana")
})

// ══════════════════════════════════════════════════════ comprobación 5: reservar sigue funcionando

test("comprobación 5: se reserva un subtipo y la cita dice el nombre del servicio, no el de la categoría", async (t) => {
  const { navegador } = await prepararCatalogo(t)

  const categorias = await navegador("/api/categorias")
  const masaje = buscarPorNombre(categorias.cuerpo, "Masaje")
  const descontracturante = buscarPorNombre(masaje.servicios, "Masaje descontracturante")

  const proveedores = await navegador(`/api/servicios/${descontracturante.id}/proveedores`)
  const carlos = buscarPorNombre(proveedores.cuerpo, "Carlos")

  // El calendario y la reserva no cambiaron nada con esta pieza: la cita sigue apuntando al
  // servicio. Se busca un día con horarios en el calendario de verdad, sin parar el reloj, y se
  // toma el primero libre.
  const mes = (await navegador("/api/negocio")).cuerpo.hoy.slice(0, 7)
  const calendario = await navegador(
    `/api/disponibilidad?servicioId=${descontracturante.id}&proveedorId=${carlos.id}&mes=${mes}`,
  )

  const diaConHorarios = calendario.cuerpo.dias.find((dia) => dia.estado === "con_horarios")
  assert.ok(diaConHorarios, "tiene que haber algún día con horarios libres en el mes en curso")

  const libre = diaConHorarios.horarios.find((horario) => horario.disponible)

  const creada = await navegador("/api/citas", {
    method: "POST",
    cuerpo: {
      servicioId: descontracturante.id,
      proveedorId: carlos.id,
      inicio: libre.inicio,
    },
  })

  assert.equal(creada.estado, 201)

  const citas = await navegador("/api/citas")
  assert.equal(citas.cuerpo[0].servicio, "Masaje descontracturante")
  assert.equal(citas.cuerpo[0].proveedor, "Carlos")
})

// ══════════════════════════════════════════════════════ comprobación 6: lo que no existe

test("comprobación 6: pedir los servicios de una categoría que no existe da 404", async (t) => {
  const { navegador } = await prepararCatalogo(t)

  const respuesta = await navegador("/api/categorias/9999/servicios")

  assert.equal(respuesta.estado, 404)
  assert.equal(respuesta.cuerpo.error, "categoria_no_encontrada")
})

// ══════════════════════════════════════════════════════ el endpoint viejo sigue sirviendo

test("`GET /api/servicios` sigue existiendo y ahora dice de qué categoría es cada servicio", async (t) => {
  const { navegador } = await prepararCatalogo(t)

  // Es parte del contrato que fijó la pieza 2, ya cerrada: no se rompe hacia atrás. La pantalla ya
  // no lo usa, pero sigue devolviendo lo mismo y con un dato más.
  const respuesta = await navegador("/api/servicios")

  assert.equal(respuesta.estado, 200)
  assert.equal(respuesta.cuerpo.length, 4)

  const relajante = buscarPorNombre(respuesta.cuerpo, "Masaje relajante")
  assert.equal(relajante.duracionMinutos, 60)
  assert.equal(relajante.categoria, "Masaje")

  const facial = buscarPorNombre(respuesta.cuerpo, "Limpieza facial")
  assert.equal(facial.categoria, "Facial")
})

// ══════════════════════════════════════════════════════ ningún servicio queda huérfano

test("todo servicio pertenece a una categoría", async (t) => {
  const { entorno, navegador } = await prepararCatalogo(t)

  // Un servicio sin categoría no aparecería en ninguna parte de la pantalla: existiría en la base y
  // sería invisible. La base lo hace imposible, y esto lo comprueba.
  assert.throws(
    () =>
      entorno.base
        .prepare("INSERT INTO servicio (nombre, duracion_minutos) VALUES ('Suelto', 60)")
        .run(),
    /NOT NULL/,
    "la base tiene que negarse a guardar un servicio sin categoría",
  )

  // Y por el API, la suma de los servicios de todas las categorías es el total de servicios.
  const categorias = await navegador("/api/categorias")
  const servicios = await navegador("/api/servicios")

  const cuantosEnCategorias = categorias.cuerpo.reduce(
    (suma, categoria) => suma + categoria.servicios.length,
    0,
  )

  assert.equal(cuantosEnCategorias, servicios.cuerpo.length)
})
