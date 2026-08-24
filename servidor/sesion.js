// La sesión: cómo la aplicación se acuerda de quién entró.
//
// Cuando alguien entra, el servidor le manda al navegador una galleta (cookie) que dice «esta
// persona es el cliente número 4, y esto vale hasta tal fecha». El navegador la devuelve en cada
// pedido siguiente, y así el servidor no le pide la contraseña otra vez.
//
// Esa galleta va **firmada**. La firma se calcula con `SESION_SECRETO`, que solo conoce el
// servidor: si alguien cambia el contenido de la galleta —por ejemplo, para decir que es otra
// persona— la firma deja de corresponder y el servidor la descarta.
//
// La sesión dura 7 días (`DISENO.md`, «Duración de la sesión de login»).

import { createHmac, timingSafeEqual } from "node:crypto"

const NOMBRE_DE_LA_COOKIE = "sesion"
const SEGUNDOS_QUE_DURA = 7 * 24 * 60 * 60

export function crearSesiones(sesionSecreto) {
  function firmar(contenido) {
    return createHmac("sha256", sesionSecreto).update(contenido).digest("base64url")
  }

  /** Abre la sesión: le manda al navegador la galleta firmada. */
  function abrir(respuesta, { id, tipo }) {
    const vence = Date.now() + SEGUNDOS_QUE_DURA * 1000
    const contenido = Buffer.from(JSON.stringify({ id, tipo, vence })).toString("base64url")
    const galleta = `${contenido}.${firmar(contenido)}`

    respuesta.append(
      "Set-Cookie",
      `${NOMBRE_DE_LA_COOKIE}=${galleta}; Max-Age=${SEGUNDOS_QUE_DURA}; Path=/; HttpOnly; SameSite=Lax`,
    )
  }

  /** Lee la sesión del pedido. Devuelve `{id, tipo}` o `null` si no hay, no es válida o venció. */
  function leer(pedido) {
    const galleta = buscarGalleta(pedido.headers.cookie, NOMBRE_DE_LA_COOKIE)
    if (!galleta) return null

    const [contenido, firma] = galleta.split(".")
    if (!contenido || !firma) return null
    if (!firmaCorresponde(contenido, firma, firmar)) return null

    let datos
    try {
      datos = JSON.parse(Buffer.from(contenido, "base64url").toString())
    } catch {
      return null
    }

    if (!datos?.id || !datos?.tipo) return null
    if (!datos.vence || datos.vence < Date.now()) return null

    return { id: datos.id, tipo: datos.tipo }
  }

  /** Cierra la sesión: le manda al navegador una galleta vacía que vence de inmediato. */
  function cerrar(respuesta) {
    respuesta.append(
      "Set-Cookie",
      `${NOMBRE_DE_LA_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`,
    )
  }

  return { abrir, leer, cerrar }
}

/**
 * El guardia que deja pasar solo a un **cliente** con la sesión abierta, y le deja su id en el
 * pedido para que la ruta no tenga que volver a leer la galleta.
 *
 * Vive acá y no adentro de un archivo de rutas porque desde la pieza 10 son **dos** grupos de
 * endpoints los que lo necesitan —las citas y la información del cliente—, y la regla de
 * `CLAUDE.md` es que eso se escribe en un solo lugar.
 *
 * Son tres rechazos distintos a propósito:
 *
 *   - **Sin sesión, `401`**: no existe la reserva como invitado (RN-9).
 *   - **Con la sesión de Personal, `403 solo_clientes`**: la cuenta es válida, pero estos endpoints
 *     guardan y leen cosas *del cliente en sesión*, y Personal no es un cliente. Sin ese rechazo,
 *     una cita quedaría guardada con el id de Personal en la columna `cliente_id`, que es el id de
 *     otra persona de la tabla `cliente`. Lo que Personal necesita son las puertas de `/api/personal/`
 *     y el guardia de acá abajo.
 *   - **Con la contraseña temporal pendiente, `403 debe_cambiar_contrasena`** (desde la pieza 7):
 *     ver la explicación de `esaCuentaTieneQueCambiarLaContrasena`.
 *
 * Desde la pieza 7 recibe también `base`, porque el tercer rechazo hay que ir a mirarlo a la base de
 * datos: la galleta no lo sabe, y confiar en ella sería peor — la persona podría cambiar de estado
 * sin que su sesión se entere.
 */
export function crearGuardiaDeCliente(sesiones, base) {
  return function exigirCliente(pedido, respuesta, seguir) {
    const sesion = sesiones.leer(pedido)

    if (!sesion) return respuesta.status(401).json({ error: "sin_sesion" })
    if (sesion.tipo !== "cliente") return respuesta.status(403).json({ error: "solo_clientes" })

    if (esaCuentaTieneQueCambiarLaContrasena(base, sesion)) {
      return respuesta.status(403).json({ error: "debe_cambiar_contrasena" })
    }

    pedido.clienteId = sesion.id
    return seguir()
  }
}

/**
 * El guardia de las puertas que **solo** abre la cuenta del negocio, las de `/api/personal/`
 * (pieza 7). Le deja a la ruta el id de esa cuenta, que es el que se guarda en
 * `cita.personal_id_creador` (RN-12).
 *
 * Los mismos dos números de siempre, con el mismo criterio: sin sesión `401` («no sé quién sos»),
 * con la sesión de un cliente `403` («sé quién sos y esto no te toca»).
 */
export function crearGuardiaDePersonal(sesiones) {
  return function exigirPersonal(pedido, respuesta, seguir) {
    const sesion = sesiones.leer(pedido)

    if (!sesion) return respuesta.status(401).json({ error: "sin_sesion" })
    if (sesion.tipo !== "personal") return respuesta.status(403).json({ error: "solo_personal" })

    pedido.personalId = sesion.id
    return seguir()
  }
}

/**
 * El guardia de las tres puertas que **los dos** pueden abrir: reservar, cancelar y reagendar una
 * cita (pieza 7).
 *
 * Deja anotado en el pedido cuál de los dos entró: `pedido.clienteId` si fue un cliente,
 * `pedido.personalId` si fue Personal, y `pedido.esPersonal` para que la ruta no tenga que
 * adivinarlo mirando cuál de los dos vino vacío.
 *
 * **Por qué un guardia y no endpoints separados para Personal.** Serían la misma regla escrita dos
 * veces: el día que la ventana de cancelación cambie de 4 horas a 2 habría dos lugares donde
 * acordarse, y el que se olvide es el que deja pasar lo que no debía. Así, `POST`, `DELETE` y
 * `PATCH /api/citas` siguen siendo los mismos de siempre y lo único que cambia es el valor de
 * `quien` que le pasan a `reservas.js` — que es justamente el parámetro que la pieza 5 dejó puesto
 * para esto.
 *
 * La regla de la contraseña temporal (RF-4) también se aplica acá, y solo al cliente: Personal no
 * tiene contraseña temporal que cambiar.
 */
export function crearGuardiaDeClienteOPersonal(sesiones, base) {
  return function exigirClienteOPersonal(pedido, respuesta, seguir) {
    const sesion = sesiones.leer(pedido)

    if (!sesion) return respuesta.status(401).json({ error: "sin_sesion" })

    if (sesion.tipo === "personal") {
      pedido.personalId = sesion.id
      pedido.esPersonal = true
      return seguir()
    }

    if (esaCuentaTieneQueCambiarLaContrasena(base, sesion)) {
      return respuesta.status(403).json({ error: "debe_cambiar_contrasena" })
    }

    pedido.clienteId = sesion.id
    pedido.esPersonal = false
    return seguir()
  }
}

/**
 * ¿Esta cuenta de cliente todavía tiene la contraseña temporal que le puso Personal?
 *
 * ── La regla de RF-4, escrita una sola vez ───────────────────────────────────────────────────
 *
 * RF-4 dice que el sistema obliga a cambiar la contraseña en el primer ingreso **antes de dejarlo
 * hacer nada más**. «Nada más» tiene que valer para todos los endpoints del cliente, y escrito acá
 * lo cumplen todos de una sola vez —las citas y `mi-informacion`— y también los que se agreguen
 * mañana, sin que nadie tenga que acordarse de agregarlo.
 *
 * **No puede vivir en la pantalla.** Una pantalla que esconda el menú no sirve de nada si el API
 * contesta igual a quien le mande el pedido por fuera de la página, y el límite del componente
 * Interfaz en `DISENO.md` dice que el frontend no decide reglas de negocio.
 *
 * **Y no puede vivir en la galleta**, aunque sería más rápido: la galleta se firma cuando la persona
 * entra y no se vuelve a tocar, así que seguiría diciendo «tiene que cambiarla» después del cambio.
 * Se pregunta a la base, que es donde está la verdad de ahora.
 *
 * Solo los clientes pasan por acá. La cuenta de Personal no tiene esa columna: viene precargada
 * (RN-10) y nunca nació con una contraseña temporal.
 */
function esaCuentaTieneQueCambiarLaContrasena(base, sesion) {
  const fila = base
    .prepare("SELECT debe_cambiar_contrasena FROM cliente WHERE id = ?")
    .get(sesion.id)

  return fila?.debe_cambiar_contrasena === 1
}

function buscarGalleta(cabecera, nombre) {
  if (!cabecera) return null

  for (const trozo of cabecera.split(";")) {
    const separador = trozo.indexOf("=")
    if (separador === -1) continue
    if (trozo.slice(0, separador).trim() !== nombre) continue

    const valor = trozo.slice(separador + 1).trim()
    return valor === "" ? null : valor
  }
  return null
}

function firmaCorresponde(contenido, firmaRecibida, firmar) {
  const esperada = Buffer.from(firmar(contenido))
  const recibida = Buffer.from(firmaRecibida)
  if (esperada.length !== recibida.length) return false
  return timingSafeEqual(esperada, recibida)
}
