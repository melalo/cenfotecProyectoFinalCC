// Los enlaces que abren una cita desde el correo: cómo se arman y a qué cita corresponden.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// POR QUÉ ESTO ES UN ARCHIVO Y NO DOS LÍNEAS ADENTRO DEL CORREO
//
// Es la misma razón que tiene `recuperacion.js` desde la pieza 9: **una regla, un lugar**. Y acá
// pesa más que allá, porque este mecanismo lo necesitan **tres** correos distintos —la confirmación
// de una reserva (RF-11), la del reagendamiento (RF-14) y el recordatorio de 24 horas (RF-12)— y los
// endpoints que atienden el enlace. Escrito en cada uno serían cuatro copias de la misma idea.
//
// LO QUE ESTE ARCHIVO NO HACE: no manda correos, no cancela ni mueve citas, y no sabe qué es un
// pedido HTTP. Recibe la base y contesta.
//
// ── LA DECISIÓN QUE HAY DETRÁS, tomada por la estudiante el 2026-09-07 ───────────────────────
//
// **El enlace entra sin contraseña.** Quien lo toca en el teléfono ve su cita y la puede cancelar o
// mover sin escribir nada. La razón: RF-11 cambió el 2026-09-05 justamente porque quien acaba de
// reservar y se equivocó de hora **quiere arreglarlo en ese momento**, y mandarlo a acordarse de su
// contraseña es mandarlo a llamar por teléfono con más pasos.
//
// El trato de confianza es el mismo que el proyecto ya aceptó en la pieza 9 —quien tiene acceso al
// correo puede usar lo que llegó ahí— y **a propósito es menos poderoso**: el enlace de recuperación
// cambia la contraseña de la cuenta entera; éste alcanza **una** cita y nada más. No abre una sesión,
// así que con el código no hay manera de pedir «mis citas» ni de nombrar otra cita.
//
// **Y no saltea ninguna regla de negocio.** Los endpoints del enlace le pasan a `reservas.js` el
// `clienteId` de esa cita y `quien = cliente`, o sea que llaman a **las mismas funciones** que la
// pantalla con sesión: la ventana de las 4 horas (RN-5), la cita pasada (RN-26) y el horario ocupado
// siguen valiendo igual. No hay una segunda copia de las reglas que un día pueda desincronizarse.
// ─────────────────────────────────────────────────────────────────────────────────────────────

import { randomBytes } from "node:crypto"

import { escribirMomento } from "./tiempo.js"

/**
 * Cuántos bytes al azar tiene un código.
 *
 * **32 bytes**, el mismo número que el enlace de recuperación, y por la misma razón: el código es lo
 * único que hay entre el enlace y la cita, así que tiene que ser imposible de adivinar probando.
 * Escritos quedan en 43 caracteres.
 */
const BYTES_DEL_CODIGO = 32

/**
 * El código de esa cita, **creándolo la primera vez que alguien lo pide**.
 *
 * Se crea cuando hace falta y no al reservar, y eso tiene una consecuencia buena que no es
 * casualidad: las citas que existían antes de esta pieza también consiguen su enlace: la primera vez
 * que les toque un recordatorio, se les inventa uno. No hay que rellenar nada en la base vieja.
 *
 * **Devuelve siempre el mismo código para la misma cita.** Es lo que hace que la confirmación, la
 * confirmación del reagendamiento y el recordatorio lleven **el mismo enlace**; lo garantiza el
 * `UNIQUE` de `cita_id`, no este código. El `INSERT ... ON CONFLICT DO NOTHING` seguido de la
 * lectura no está de más aunque parezca un paso extra: si dos correos de la misma cita salieran en
 * el mismo instante, es la base —y no el orden en que se ejecutó esto— la que decide que hay un solo
 * código. Es la misma idea del índice único que protege el horario de una cita desde la pieza 3.
 */
export async function codigoDeLaCita({ base, citaId, ahora }) {
  await base.correr(
    `INSERT INTO token_cita (cita_id, codigo, creado_en)
       VALUES (?, ?, ?)
       ON CONFLICT (cita_id) DO NOTHING`,
    citaId,
    randomBytes(BYTES_DEL_CODIGO).toString("base64url"),
    escribirMomento(ahora),
  )

  const fila = await base.uno("SELECT codigo FROM token_cita WHERE cita_id = ?", citaId)
  return fila.codigo
}

/**
 * De qué cita es ese código, o `null` si no es de ninguna.
 *
 * Devuelve `{ citaId, clienteId }`, que es lo único que los endpoints del enlace necesitan para
 * llamar a las funciones de `reservas.js`: el resto lo buscan ellas.
 *
 * **No dice por qué no encontró nada**, igual que `buscarEnlaceQueTodaviaSirve` en la pieza 9: a
 * quien pregunta le alcanza con saber que ese código no abre nada, y distinguir «no existe» de
 * «existía» sería regalar información sobre enlaces ajenos. Por eso el endpoint contesta `404` y no
 * `401` — el enlace no es una credencial que falló, es una cita que no aparece.
 */
export async function buscarCitaDelCodigo({ base, codigo }) {
  const texto = String(codigo ?? "")
  if (texto === "") return null

  const fila = await base.uno(
    `SELECT token_cita.cita_id AS citaId, cita.cliente_id AS clienteId
       FROM token_cita
       JOIN cita ON cita.id = token_cita.cita_id
      WHERE token_cita.codigo = ?`,
    texto,
  )

  return fila ?? null
}

/**
 * Las dos direcciones que van en el correo: la de cancelar y la de reagendar.
 *
 * La aplicación es **una sola página**, así que el código viaja en el pedacito de dirección que va
 * después del `#` — la parte que el navegador **no le manda al servidor** y que la página lee por su
 * cuenta. Es la misma decisión del enlace de recuperación, y tiene la misma ventaja concreta: el
 * código **no queda escrito en el registro de pedidos del servidor**.
 *
 * ⚠️ **La acción va después de una barra y no con un `&`**, y eso no es estético. Estas direcciones
 * se meten adentro del HTML de un correo, y ahí todo texto pasa por `escapar()`, que convierte `&`
 * en `&amp;`. Un enlace escrito `#cita=X&hacer=cancelar` llegaría al correo como
 * `#cita=X&amp;hacer=cancelar` y la página leería la acción con un `amp;` pegado adelante. Con la
 * barra no hay nada que escapar y las dos versiones del correo dicen exactamente lo mismo.
 *
 * `direccionPublica` sale de una variable de entorno. En esta máquina es `http://localhost:3000`, y
 * eso quiere decir «esta computadora»: **el enlace solo abre donde la aplicación está corriendo**.
 * Publicada la aplicación (Etapa 5 del despliegue), es la dirección del sitio — que es lo que hizo
 * posible que la estudiante descubriera el 2026-09-05 que a la confirmación le faltaban estos dos
 * enlaces.
 */
export function armarLosEnlacesDeLaCita(direccionPublica, codigo) {
  const raiz = `${String(direccionPublica).replace(/\/+$/, "")}/#cita=${codigo}`

  return {
    cancelar: `${raiz}/cancelar`,
    reagendar: `${raiz}/reagendar`,
  }
}
