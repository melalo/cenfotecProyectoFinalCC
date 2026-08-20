// El único lugar del proyecto que habla con un servicio de afuera.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// QUÉ ES UN «ENVIADOR» Y POR QUÉ ESTÁ SEPARADO
//
// Un enviador es una función que recibe un correo ya escrito —`{ para, asunto, html, texto }`— y
// lo entrega. Nada más. No sabe qué dice el correo, ni de qué cita es, ni que existe una tabla
// donde se anota lo que pasó: eso vive en `correo.js`, del otro lado de este borde.
//
// La separación es exactamente la misma idea que el reloj de `tiempo.js`, y por la misma razón: lo
// que no se puede probar de verdad **entra como dato**. En `npm start` el enviador es este, el que
// habla con Resend; en las pruebas es uno de mentira que guarda los correos en una lista. Sin eso,
// probar el correo de confirmación significaría mandarle correos de verdad a alguien en cada
// `npm test`.
//
// POR QUÉ NO SE INSTALÓ EL PAQUETE `resend`
//
// Resend publica un paquete oficial de npm, pero mandarle un correo es un solo pedido por internet
// a una dirección, con la clave en una cabecera. Node 20 ya trae `fetch` —la función que hace ese
// pedido—, así que el paquete se ahorra entero y el `README.md` puede seguir prometiendo que este
// proyecto no necesita nada raro instalado. Decisión de la estudiante el 2026-08-19, anotada en
// `DISENO.md`, «Decisiones tomadas al construir la pieza 4».
// ─────────────────────────────────────────────────────────────────────────────────────────────

import { fallaDeCorreo } from "./correo.js"

/** A dónde se le manda el pedido a Resend. */
const DIRECCION_DE_RESEND = "https://api.resend.com/emails"

/**
 * Cuánto se espera como mucho a que Resend conteste, en milisegundos.
 *
 * Hay un número acá porque **la persona que reservó está esperando**: la pantalla no le contesta
 * «tu cita quedó reservada» hasta que este pedido termina. Sin límite, un servicio que no contesta
 * dejaría el botón girando un minuto entero. Cinco segundos es de sobra para un servicio que
 * normalmente contesta en menos de uno, y es poco para quien mira la pantalla.
 */
const SEGUNDOS_DE_ESPERA = 5

/**
 * Arma el enviador que habla con Resend.
 *
 * `traer` es la función que hace el pedido por internet. Por omisión es `fetch`, la que Node ya
 * trae; las pruebas le pasan una de mentira para comprobar qué pedido se arma y cómo se clasifica
 * cada respuesta, **sin salir a internet**.
 */
export function crearEnviadorResend({ claveApi, remitente, traer = fetch }) {
  return async function enviarConResend({ para, asunto, html, texto }) {
    // Sin clave o sin remitente no hay nada que intentar, y se dice antes de tocar la red. Es el
    // caso que RF-19 exige que la aplicación aguante: sin `RESEND_API_KEY` en el `.env`, los
    // correos fallan y quedan registrados como fallidos, pero las citas se siguen creando.
    if (!claveApi || !remitente) {
      throw fallaDeCorreo(
        "No hay servicio de correo configurado: faltan RESEND_API_KEY o CORREO_REMITENTE en el .env",
        { pasajera: false },
      )
    }

    let respuesta
    try {
      respuesta = await traer(DIRECCION_DE_RESEND, {
        method: "POST",
        headers: {
          authorization: `Bearer ${claveApi}`,
          "content-type": "application/json",
        },
        // Los nombres de acá adentro son los que pide Resend, en inglés: es su contrato, no el
        // nuestro. Traducirlos rompería el envío.
        body: JSON.stringify({
          from: remitente,
          to: [para],
          subject: asunto,
          html,
          text: texto,
        }),
        signal: AbortSignal.timeout(SEGUNDOS_DE_ESPERA * 1000),
      })
    } catch (falla) {
      // Acá se cae cuando el pedido ni siquiera llegó: la red cortada, el nombre que no resuelve,
      // el tiempo agotado. Todas son cosas que pueden estar arregladas en un segundo, así que la
      // falla se marca como pasajera y `correo.js` la va a reintentar.
      throw fallaDeCorreo(`No se pudo llegar al servicio de correo: ${falla.message}`, {
        pasajera: true,
      })
    }

    if (respuesta.ok) return

    const detalle = await leerElDetalleDelRechazo(respuesta)

    // Del 500 para arriba el problema es de Resend, no del pedido: el mismo correo mandado de nuevo
    // puede salir perfecto. Del 400 al 499 el problema es el pedido —la clave no sirve, el
    // remitente no está verificado—, y repetirlo daría exactamente lo mismo, así que no se
    // reintenta: solo haría esperar más a quien reservó.
    throw fallaDeCorreo(`El servicio de correo contestó ${respuesta.status}: ${detalle}`, {
      pasajera: respuesta.status >= 500,
    })
  }
}

/**
 * El texto con el que Resend explica por qué rechazó el pedido. Si no se puede leer, se sigue
 * igual con las manos vacías: esto es para dejar una pista en la consola, no algo de lo que
 * dependa nada.
 */
async function leerElDetalleDelRechazo(respuesta) {
  try {
    return (await respuesta.text()) || "sin detalle"
  } catch {
    return "sin detalle"
  }
}
