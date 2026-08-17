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
