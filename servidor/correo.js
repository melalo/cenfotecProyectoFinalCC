// Los correos que el sistema manda: armarlos, entregarlos y dejar constancia.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// Es el componente **Notificaciones** de `DISENO.md`. Hoy manda uno solo —la confirmación de una
// reserva (RF-11)—; el recordatorio de 24 horas (pieza 6) y el de recuperar la contraseña
// (pieza 9) se agregan acá adentro cuando toque, y reutilizan todo lo que ya está resuelto: el
// reintento, el registro y la forma de la plantilla.
//
// Lo que este archivo NO hace: hablar con Resend. Eso vive en `enviador-resend.js`, del otro lado
// del borde. Acá llega una función `enviador` que sabe entregar un correo, y se la llama.
//
// LA REGLA QUE MANDA ACÁ: **un correo que falla nunca invalida una cita** (RF-19). Por eso ninguna
// función de este archivo lanza errores hacia afuera. Si el envío se cae, se anota la falla y se
// sigue. Quien reservó tiene su cita igual; lo que no tiene es el aviso, y eso queda escrito en la
// tabla para que se pueda saber a quién no le llegó.
// ─────────────────────────────────────────────────────────────────────────────────────────────

import { armarCorreoDeConfirmacion } from "./plantillas-de-correo.js"
import { escribirMomento } from "./tiempo.js"

/** Los tres tipos de correo del proyecto (bloque *Produce* de la pieza 4). */
export const TIPO_CONFIRMACION = "confirmacion"
export const TIPO_RECORDATORIO = "recordatorio"
export const TIPO_RECUPERACION = "recuperacion"

/**
 * Cuántas veces se intenta entregar un correo antes de darlo por perdido.
 *
 * Dos: el intento y **un** reintento, que es lo que pide `ESPECIFICACION.md` («el sistema
 * reintenta»). No más, porque quien reservó está esperando en la pantalla: cada intento extra es
 * tiempo que mira el botón girando, y a partir del segundo la probabilidad de que el tercero
 * arregle algo es muy baja.
 */
const INTENTOS = 2

/**
 * Cuánto se espera entre un intento y el siguiente, en milisegundos.
 *
 * Reintentar en el mismo instante casi no sirve: si la red se cayó hace un microsegundo, sigue
 * caída. Un segundo alcanza para que un tropiezo momentáneo se acomode, y es poco para quien
 * espera.
 */
const PAUSA_ENTRE_INTENTOS = 1000

/**
 * Arma un error de correo que dice **si vale la pena volver a intentar**.
 *
 * Esa distinción es toda la inteligencia del reintento, y por eso el error la lleva encima en vez
 * de que alguien la adivine después:
 *
 *   - `pasajera: true`  → la red se cayó, el servicio no contestó, el tiempo se agotó. Puede estar
 *                         arreglado en un segundo, así que se reintenta.
 *   - `pasajera: false` → la clave no sirve, el remitente no está verificado, el pedido está mal.
 *                         El segundo intento daría exactamente lo mismo, así que no se reintenta.
 *
 * Vive acá y no en `enviador-resend.js` porque es parte del contrato de un enviador: la pieza 9
 * podría traer otro enviador distinto y tendría que hablar este mismo idioma.
 */
export function fallaDeCorreo(mensaje, { pasajera }) {
  const falla = new Error(mensaje)
  falla.pasajera = pasajera
  return falla
}

/**
 * El enviador que se usa cuando no hay ninguno configurado: falla siempre, sin tocar la red.
 *
 * Existe para que la aplicación **levante igual sin `RESEND_API_KEY`** (RF-19). No es un parche: es
 * la manera de que el camino sin correo sea exactamente el mismo camino que el del correo que
 * falla, y por lo tanto quede probado por las mismas pruebas.
 */
export const ENVIADOR_SIN_CONFIGURAR = async () => {
  throw fallaDeCorreo("No hay ningún servicio de correo configurado", { pasajera: false })
}

/**
 * Le manda al cliente la confirmación de una cita recién creada (RF-11).
 *
 * **Nunca lanza un error**, pase lo que pase con el envío: la cita ya está guardada cuando esto
 * corre, y RF-19 exige que siga siendo válida aunque el correo no salga.
 */
export async function enviarConfirmacionDeCita({ base, enviador, citaId, ahora }) {
  const datos = leerLoQueElCorreoTieneQueDecir(base, citaId)

  // Si la cita no existe no hay nada que confirmar, y tampoco a quién avisarle. No debería pasar
  // nunca —esto se llama justo después de crearla—, pero fabricar un correo con datos vacíos sería
  // peor que no mandar ninguno.
  if (!datos) return

  const correo = armarCorreoDeConfirmacion(datos)

  await entregarYRegistrar({
    base,
    enviador,
    ahora,
    tipo: TIPO_CONFIRMACION,
    clienteId: datos.clienteId,
    citaId,
    correo,
  })
}

/**
 * Intenta entregar un correo y **siempre** deja una fila en `correo_enviado` diciendo qué pasó
 * (REG-3), haya salido bien o mal.
 *
 * Una fila por correo, no una por intento: los dos intentos de mandar la misma confirmación son un
 * solo correo que se trató de entregar, y contarlos como dos haría creer que a alguien le llegó el
 * aviso dos veces.
 */
async function entregarYRegistrar({ base, enviador, ahora, tipo, clienteId, citaId, correo }) {
  const exito = await intentarEntregar(enviador, correo)

  base
    .prepare(
      `INSERT INTO correo_enviado
         (destinatario_correo, cliente_id, cita_id, tipo, enviado_en, exito)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(correo.para, clienteId, citaId, tipo, escribirMomento(ahora), exito ? 1 : 0)
}

/**
 * Intenta entregar el correo, reintentando **solo** cuando la falla puede ser pasajera. Devuelve
 * `true` si en algún intento salió, `false` si se agotaron.
 */
async function intentarEntregar(enviador, correo) {
  for (let intento = 1; intento <= INTENTOS; intento++) {
    try {
      await enviador(correo)
      return true
    } catch (falla) {
      const quedanIntentos = intento < INTENTOS

      // La consola es el único lugar donde se ve el porqué: la tabla guarda «no salió», que es lo
      // que hace falta para saber a quién avisarle, pero no el motivo.
      console.warn(`Aviso: falló el envío de un correo a ${correo.para} — ${falla.message}`)

      if (!falla.pasajera || !quedanIntentos) return false

      await esperar(PAUSA_ENTRE_INTENTOS)
    }
  }

  return false
}

/** Espera esa cantidad de milisegundos antes de seguir. */
function esperar(milisegundos) {
  return new Promise((seguir) => setTimeout(seguir, milisegundos))
}

/**
 * Junta de una sola vez todo lo que el correo de confirmación tiene que decir: los cinco datos que
 * pide RF-11 (fecha, hora, servicio, proveedor y ubicación), más a quién va y el teléfono del
 * negocio por si hay que llamar.
 *
 * Es una sola consulta con todos los `JOIN` a propósito, en vez de cinco preguntas sueltas: así no
 * hay ninguna manera de terminar armando un correo con el proveedor de otra cita.
 */
function leerLoQueElCorreoTieneQueDecir(base, citaId) {
  const fila = base
    .prepare(
      `SELECT cliente.id     AS clienteId,
              cliente.nombre AS clienteNombre,
              cliente.correo AS clienteCorreo,
              servicio.nombre  AS servicio,
              proveedor.nombre AS proveedor,
              cita.inicio      AS inicio,
              negocio.nombre    AS negocioNombre,
              negocio.telefono  AS negocioTelefono,
              negocio.ubicacion AS negocioUbicacion
         FROM cita
         JOIN cliente   ON cliente.id   = cita.cliente_id
         JOIN servicio  ON servicio.id  = cita.servicio_id
         JOIN proveedor ON proveedor.id = cita.proveedor_id
         -- El negocio es una sola fila y no tiene ninguna columna que la ate a la cita, así que se
         -- pega sin condición: es la configuración, no un dato de esta reserva.
         JOIN configuracion_negocio AS negocio
        WHERE cita.id = ?`,
    )
    .get(citaId)

  return fila ?? null
}
