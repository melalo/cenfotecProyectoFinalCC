// Los cuatro endpoints de la pieza 1: registrarse, entrar, cerrar sesión y preguntar quién soy.
// El contrato (qué recibe cada uno y qué devuelve) está en el bloque «Produce» de la pieza 1 de
// `PLAN.md`, y acá se cumple tal cual.

import { Router } from "express"

import { cifrarContrasena, contrasenaCoincide } from "../contrasenas.js"

// Una huella de relleno, de una contraseña que nadie tiene. Sirve para que entrar con un correo
// que no existe tarde lo mismo que entrar con la contraseña equivocada: si el caso «no existe»
// respondiera más rápido, esa diferencia de tiempo revelaría qué correos están registrados, que es
// justo lo que el mensaje genérico de `DISENO.md` («Login incorrecto») quiere evitar.
const HUELLA_DE_RELLENO = cifrarContrasena("ninguna-cuenta-usa-esta-contrasena")

export function crearRutasDeAutenticacion({ base, sesiones }) {
  const rutas = Router()

  // RF-1: una persona sin cuenta crea la suya con nombre, correo y contraseña.
  rutas.post("/registro", (pedido, respuesta) => {
    const nombre = String(pedido.body?.nombre ?? "").trim()
    const correo = normalizarCorreo(pedido.body?.correo)
    const contrasena = String(pedido.body?.contrasena ?? "")

    if (nombre === "" || correo === "" || contrasena === "") {
      return respuesta.status(422).json({ error: "datos_incompletos" })
    }

    // El correo tiene que estar libre en las dos tablas: si coincidiera con la cuenta de Personal,
    // al entrar no se sabría cuál de las dos es.
    if (buscarCuentaPorCorreo(base, correo)) {
      return respuesta.status(409).json({ error: "correo_ya_registrado" })
    }

    // Solo se crean clientes. La cuenta de Personal viene precargada y no se autorregistra
    // (RN-10), así que un `tipo` que venga en el pedido se ignora a propósito.
    const creada = base
      .prepare(
        `INSERT INTO cliente (nombre, correo, contrasena_cifrada, debe_cambiar_contrasena)
         VALUES (?, ?, ?, 0)`,
      )
      .run(nombre, correo, cifrarContrasena(contrasena))

    sesiones.abrir(respuesta, { id: creada.lastInsertRowid, tipo: "cliente" })

    return respuesta.status(201).json({
      id: Number(creada.lastInsertRowid),
      nombre,
      correo,
      tipo: "cliente",
    })
  })

  // RF-2: entrar con correo y contraseña, y quedar con la sesión abierta.
  rutas.post("/sesion", (pedido, respuesta) => {
    const correo = normalizarCorreo(pedido.body?.correo)
    const contrasena = String(pedido.body?.contrasena ?? "")

    const encontrada = buscarCuentaPorCorreo(base, correo)
    const huellaGuardada = encontrada?.cuenta.contrasena_cifrada ?? HUELLA_DE_RELLENO
    const coincide = contrasenaCoincide(contrasena, huellaGuardada)

    // El mismo error para las dos cosas —correo que no existe y contraseña equivocada— y sin
    // decir cuál falló (`DISENO.md`, «Login incorrecto»).
    if (!encontrada || !coincide) {
      return respuesta.status(401).json({ error: "credenciales_invalidas" })
    }

    sesiones.abrir(respuesta, { id: encontrada.cuenta.id, tipo: encontrada.tipo })
    return respuesta.status(200).json(comoSeVeLaCuenta(encontrada))
  })

  rutas.delete("/sesion", (pedido, respuesta) => {
    sesiones.cerrar(respuesta)
    return respuesta.status(204).end()
  })

  // Quién está actuando. Toda pieza posterior usa el campo `tipo` de acá.
  rutas.get("/yo", (pedido, respuesta) => {
    const sesion = sesiones.leer(pedido)
    if (!sesion) return respuesta.status(401).json({ error: "sin_sesion" })

    // Se vuelve a leer la cuenta de la base en vez de confiar en la galleta: así, si el nombre o
    // el estado de la contraseña cambiaron, la aplicación muestra lo que hay hoy.
    const encontrada = buscarCuentaPorSesion(base, sesion)
    if (!encontrada) return respuesta.status(401).json({ error: "sin_sesion" })

    return respuesta.status(200).json(comoSeVeLaCuenta(encontrada))
  })

  return rutas
}

/** Los correos se guardan y se buscan siempre en minúscula y sin espacios de sobra, para que
 *  `Ana@Ejemplo.com` y `ana@ejemplo.com ` sean la misma cuenta y no dos. */
function normalizarCorreo(correo) {
  return String(correo ?? "")
    .trim()
    .toLowerCase()
}

function buscarCuentaPorCorreo(base, correo) {
  if (correo === "") return null

  const cliente = base.prepare("SELECT * FROM cliente WHERE correo = ?").get(correo)
  if (cliente) return { cuenta: cliente, tipo: "cliente" }

  const personal = base.prepare("SELECT * FROM personal WHERE correo = ?").get(correo)
  if (personal) return { cuenta: personal, tipo: "personal" }

  return null
}

function buscarCuentaPorSesion(base, sesion) {
  const tabla = sesion.tipo === "personal" ? "personal" : "cliente"
  const cuenta = base.prepare(`SELECT * FROM ${tabla} WHERE id = ?`).get(sesion.id)
  return cuenta ? { cuenta, tipo: sesion.tipo } : null
}

/** La forma en que una cuenta viaja al frontend. Nunca incluye la contraseña cifrada. */
function comoSeVeLaCuenta({ cuenta, tipo }) {
  return {
    id: cuenta.id,
    nombre: cuenta.nombre,
    correo: cuenta.correo,
    tipo,
    // Solo los clientes pueden tener una contraseña temporal pendiente de cambiar (RN-11); la
    // cuenta de Personal no pasa por ese camino, así que para ella siempre es falso.
    debeCambiarContrasena: tipo === "cliente" && cuenta.debe_cambiar_contrasena === 1,
  }
}
