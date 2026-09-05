// Los enlaces para restablecer la contraseña olvidada: cuánto viven, cuándo sirven y cuándo no.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// POR QUÉ ESTO ES UN ARCHIVO Y NO DOS LÍNEAS ADENTRO DEL ENDPOINT
//
// Es la misma razón por la que `credenciales.js` existe desde la pieza 1: **una regla, un lugar**.
// Acá está escrito qué es un enlace válido —que exista, que no se haya usado y que no se haya
// vencido (RN-27)—, y el endpoint no lo sabe: pregunta y obedece. Si mañana la regla cambia —dos
// horas en vez de una, o que pedir un enlace nuevo mate al anterior— cambia acá y en ningún otro
// lado.
//
// LO QUE ESTE ARCHIVO NO HACE: no manda correos, no cambia contraseñas y no sabe qué es un pedido
// HTTP. Recibe la base y el momento actual, y contesta.
// ─────────────────────────────────────────────────────────────────────────────────────────────

import { randomBytes } from "node:crypto"

import { escribirMomento, horasHasta } from "./tiempo.js"

/**
 * Cuánto vive un enlace desde que se pide, en minutos (RN-27).
 *
 * **Una hora.** Lo decidió la estudiante el **2026-08-11**, en la sesión de diseño, y quedó escrito
 * en `DISENO.md` → «Otras decisiones». El razonamiento completo está en **RN-27** de
 * `ESPECIFICACION.md`, que es donde vive desde el 2026-08-28: una regla de negocio con un número no
 * se queda en una tabla de decisiones técnicas, porque ahí nadie la encuentra — y de hecho no se
 * encontró.
 */
export const MINUTOS_QUE_DURA_EL_ENLACE = 60

const MILISEGUNDOS_POR_MINUTO = 60 * 1000

/**
 * Cuántos bytes al azar tiene un código.
 *
 * **32 bytes**, que escritos quedan en 43 caracteres. El número no es decorativo: el código es lo
 * único que hay entre el enlace y la cuenta, así que tiene que ser imposible de adivinar probando.
 * Con 32 bytes al azar hay más combinaciones que átomos hay en la Tierra; probarlas todas no es
 * lento, es imposible.
 */
const BYTES_DEL_CODIGO = 32

/**
 * Inventa un código nuevo, imposible de adivinar.
 *
 * `randomBytes` es el generador de azar **criptográfico** que trae Node, distinto de `Math.random()`:
 * este último es predecible si alguien ve unos cuantos resultados seguidos, y para un enlace que
 * abre una cuenta eso no sirve.
 *
 * Se escribe en `base64url`, que es la manera de escribir bytes usando solo letras, números, `-` y
 * `_` — los caracteres que **no cambian de significado** al ir adentro de una dirección web. En
 * `base64` normal aparecerían `+`, `/` y `=`, que un navegador reescribe y romperían el enlace.
 */
function inventarCodigo() {
  return randomBytes(BYTES_DEL_CODIGO).toString("base64url")
}

/**
 * Guarda un enlace nuevo para esa cuenta y devuelve su código.
 *
 * `cuenta` es `{ id, tipo }`, con el `tipo` que usa todo el proyecto desde la pieza 1: `"cliente"` o
 * `"personal"`. De ahí sale en cuál de las dos columnas se escribe el número — **solo una de las dos
 * viene llena**, y la base lo exige con un `CHECK`, no con un comentario.
 *
 * **Pedir un enlace no toca la contraseña vieja** ni mata los enlaces anteriores: quien lo pidió por
 * error, o se acordó de su contraseña, no queda afuera de su cuenta por nada (RN-27).
 */
export async function crearEnlaceDeRecuperacion({ base, cuenta, ahora }) {
  const codigo = inventarCodigo()
  const vence = new Date(ahora.getTime() + MINUTOS_QUE_DURA_EL_ENLACE * MILISEGUNDOS_POR_MINUTO)

  await base.correr(
    `INSERT INTO token_recuperacion (cliente_id, personal_id, codigo, vence_en)
       VALUES (?, ?, ?, ?)`,
    cuenta.tipo === "cliente" ? cuenta.id : null,
    cuenta.tipo === "personal" ? cuenta.id : null,
    codigo,
    escribirMomento(vence),
  )

  return codigo
}

/**
 * Busca el enlace de ese código **si todavía sirve**, y devuelve de qué cuenta es.
 *
 * Devuelve `null` en los tres casos en que no sirve —el código no existe, ya se usó, o se venció—,
 * y **no dice cuál de los tres**. A quien pregunta le alcanza con saber que no sirve, y distinguir
 * «este código no existe» de «este código existía» sería regalar información sobre enlaces ajenos.
 * Por eso el endpoint contesta un solo error, `token_invalido`, para los tres.
 *
 * Devuelve `{ token, cuenta: { id, tipo } }`.
 */
export async function buscarEnlaceQueTodaviaSirve({ base, codigo, ahora }) {
  const texto = String(codigo ?? "")
  if (texto === "") return null

  const token = await base.uno("SELECT * FROM token_recuperacion WHERE codigo = ?", texto)
  if (!token) return null

  // Un solo uso (RN-27): en cuanto tiene fecha de uso, no vuelve a servir nunca.
  if (token.usado_en !== null) return null

  // Y el vencimiento, con la misma cuenta de horas que usa la ventana de cancelación desde la pieza
  // 5. Cero o menos quiere decir que el momento de vencer ya llegó.
  if (horasHasta(token.vence_en, ahora) <= 0) return null

  const cuenta =
    token.cliente_id !== null
      ? { id: token.cliente_id, tipo: "cliente" }
      : { id: token.personal_id, tipo: "personal" }

  return { token, cuenta }
}

/**
 * Marca el enlace como usado, con el momento exacto en que se usó.
 *
 * Es lo que lo apaga para siempre. La condición `usado_en IS NULL` del final no está de más aunque
 * quien llama ya haya preguntado: si dos pedidos llegaran con el mismo código en el mismo instante,
 * es la base —y no el orden en que se ejecutó el código— la que garantiza que solo uno lo use. Es la
 * misma idea del índice único que protege el horario de una cita desde la pieza 3.
 */
export async function marcarEnlaceComoUsado({ base, token, ahora }) {
  const resultado = await base.correr(
    "UPDATE token_recuperacion SET usado_en = ? WHERE id = ? AND usado_en IS NULL",
    escribirMomento(ahora),
    token.id,
  )

  return resultado.cambios === 1
}

/**
 * La dirección a la que lleva el enlace del correo.
 *
 * La aplicación es **una sola página**, así que el código viaja en el pedacito de dirección que va
 * después del `#` — la parte que el navegador **no le manda al servidor** y que la página lee por su
 * cuenta. Eso tiene una ventaja concreta que no es casualidad: el código de recuperación **no queda
 * escrito en el registro de pedidos del servidor**.
 *
 * `direccionPublica` sale de una variable de entorno. En esta máquina es `http://localhost:3000`, y
 * eso quiere decir «esta computadora»: **el enlace solo abre donde la aplicación está corriendo**.
 * Está declarado en `DISENO.md`, «La limitación del enlace, dicha en voz alta».
 */
export function armarLaDireccionDelEnlace(direccionPublica, codigo) {
  return `${String(direccionPublica).replace(/\/+$/, "")}/#restablecer=${codigo}`
}
