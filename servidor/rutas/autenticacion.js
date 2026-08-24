// Los endpoints de las cuentas: registrarse, entrar, cerrar sesión y preguntar quién soy (pieza 1),
// y cambiar la contraseña (pieza 7).
// El contrato (qué recibe cada uno y qué devuelve) está en los bloques «Produce» de las piezas 1 y 7
// de `PLAN.md`, y acá se cumple tal cual.

import { Router } from "express"

import { cifrarContrasena, contrasenaCoincide } from "../contrasenas.js"
import { correoTieneForma, queLeFaltaALaContrasena } from "../credenciales.js"

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

    // RN-24: el correo tiene que tener forma de correo. Se comprueba **antes** que la contraseña
    // porque también se comprueba antes en la pantalla, y porque un correo mal escrito hace que el
    // correo de confirmación de la pieza 4 no le llegue a nadie.
    if (!correoTieneForma(correo)) {
      return respuesta.status(422).json({ error: "correo_invalido" })
    }

    // RN-23: las tres condiciones de la contraseña. La regla vive en `servidor/credenciales.js`,
    // no acá: las piezas 7 y 9 también crean contraseñas y tienen que cumplir exactamente lo mismo.
    //
    // Se manda **qué falta**, no un texto ya armado: las palabras que la persona lee las escribe la
    // pantalla. Y que esto esté en el servidor —y no solo en el JavaScript del navegador— es lo que
    // hace que la regla no se pueda saltar mandando el pedido al API por fuera de la página.
    const leFaltaALaContrasena = queLeFaltaALaContrasena(contrasena)
    if (leFaltaALaContrasena.length > 0) {
      return respuesta.status(422).json({
        error: "contrasena_invalida",
        faltan: leFaltaALaContrasena,
      })
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

    // `debeCambiarContrasena` va explícito en `false` desde la pieza 7, y no es de más: las tres
    // puertas que le dan una cuenta a la pantalla —registrarse, entrar y «quién soy»— tienen que
    // devolver **la misma forma**, porque la pantalla las trata igual. Quien se registra elige su
    // contraseña ella misma (RN-10), así que nunca tiene nada pendiente de cambiar; sin este campo
    // la pantalla recibiría un `undefined` y funcionaría por casualidad, no porque el API lo diga.
    return respuesta.status(201).json({
      id: Number(creada.lastInsertRowid),
      nombre,
      correo,
      tipo: "cliente",
      debeCambiarContrasena: false,
    })
  })

  // RF-2: entrar con correo y contraseña, y quedar con la sesión abierta.
  //
  // **Acá NO se comprueban RN-23 ni RN-24, a propósito.** Esas reglas valen donde se *elige* una
  // contraseña, no donde se *usa* la que ya existe: una cuenta creada antes del 2026-08-19 tiene que
  // poder seguir entrando con la contraseña que tenía, y obligarla a cambiarla la dejaría afuera de
  // su propia cuenta sin haber hecho nada. Aparte, rechazar acá por «esa contraseña no cumple el
  // formato» le regalaría a quien intenta adivinar una pista que hoy no tiene.
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

  // RF-4 y RN-11 (pieza 7): cambiar la contraseña.
  //
  // Sirve para **cualquier sesión abierta**, de cliente o de Personal: es el endpoint genérico de
  // cambiar la contraseña, y Personal también tiene una. Su primer trabajo, y el que lo trajo a
  // existir, es el cambio obligatorio de la contraseña temporal que le puso Personal a quien llamó.
  //
  // **Queda abierto mientras la contraseña temporal está pendiente**, a diferencia de todos los
  // endpoints del cliente, que en ese estado se cierran (ver `crearGuardiaDeCliente`). Es la puerta
  // de salida de esa pantalla: si también se cerrara, la persona quedaría encerrada.
  rutas.post("/contrasena/cambiar", (pedido, respuesta) => {
    const sesion = sesiones.leer(pedido)
    if (!sesion) return respuesta.status(401).json({ error: "sin_sesion" })

    const contrasenaActual = String(pedido.body?.contrasenaActual ?? "")
    const contrasenaNueva = String(pedido.body?.contrasenaNueva ?? "")

    if (contrasenaActual === "" || contrasenaNueva === "") {
      return respuesta.status(422).json({ error: "datos_incompletos" })
    }

    const encontrada = buscarCuentaPorSesion(base, sesion)
    if (!encontrada) return respuesta.status(401).json({ error: "sin_sesion" })

    // La contraseña actual se comprueba **antes** que la forma de la nueva: si no la acierta, no
    // tiene por qué enterarse de nada más.
    //
    // Es `422` y no `403` porque no es un problema de permisos: la sesión es válida y la cuenta es la
    // correcta — lo que no sirve es **el dato** que escribió. Es el mismo criterio con el que la
    // ventana de cancelación es `422` desde la pieza 5.
    if (!contrasenaCoincide(contrasenaActual, encontrada.cuenta.contrasena_cifrada)) {
      return respuesta.status(422).json({ error: "contrasena_actual_incorrecta" })
    }

    // RN-23, la misma regla del registro, llamada al mismo lugar. Acá **sí** se comprueba, y en
    // `POST /api/sesion` no: la regla vale donde una contraseña se *elige*, no donde se *usa* la que
    // ya existe.
    const leFaltaALaContrasena = queLeFaltaALaContrasena(contrasenaNueva)
    if (leFaltaALaContrasena.length > 0) {
      return respuesta.status(422).json({
        error: "contrasena_invalida",
        faltan: leFaltaALaContrasena,
      })
    }

    const tabla = encontrada.tipo === "personal" ? "personal" : "cliente"

    if (tabla === "cliente") {
      // Guardar la contraseña y apagar la obligación son **un solo movimiento**. Separados, un corte
      // en el medio dejaría la contraseña nueva puesta y la obligación encendida: la persona
      // quedaría trabada en esa pantalla sin manera de salir, porque su contraseña «actual» ya sería
      // la nueva y no la temporal que la pantalla recuerda.
      base
        .prepare(
          "UPDATE cliente SET contrasena_cifrada = ?, debe_cambiar_contrasena = 0 WHERE id = ?",
        )
        .run(cifrarContrasena(contrasenaNueva), encontrada.cuenta.id)
    } else {
      // La cuenta de Personal no tiene esa columna: viene precargada (RN-10) y nunca nació con una
      // contraseña temporal, así que no hay nada que apagar.
      base
        .prepare("UPDATE personal SET contrasena_cifrada = ? WHERE id = ?")
        .run(cifrarContrasena(contrasenaNueva), encontrada.cuenta.id)
    }

    // 204 es «lo hice y no tengo nada que contarte». La pantalla ya sabe qué cambió, y devolver la
    // cuenta entera acá sería mandar algo que nadie va a leer.
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
