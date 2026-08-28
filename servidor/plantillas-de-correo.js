// Cómo se escriben los correos que el sistema manda.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// Este archivo solo **arma texto**. No manda nada, no toca la base y no sabe que Resend existe:
// recibe los datos ya buscados y devuelve `{ para, asunto, html, texto }`. Por eso se puede leer
// —y probar— sin levantar nada.
//
// CADA CORREO VIAJA EN DOS VERSIONES, y las dos dicen lo mismo:
//
//   - `html`  → la que casi todo el mundo ve, con los colores del sistema visual.
//   - `texto` → la de respaldo, sin diseño. La usan los programas de correo configurados para no
//               mostrar diseño y los lectores de pantalla más viejos. No es un extra: un correo
//               que solo viaja en HTML lo marcan como sospechoso varios servicios.
//
// POR QUÉ EL HTML ESTÁ ESCRITO «A LA ANTIGUA», con tablas y con los estilos pegados en cada
// etiqueta: los programas de correo no son navegadores. Gmail y Outlook borran las hojas de
// estilo y entienden mal las cuadrículas modernas, así que lo que en la aplicación se escribe con
// `flex` y clases, acá se escribe con `<table>` y `style="…"` en cada línea. Es feo de leer y es
// lo único que se ve igual en todos lados.
//
// LA TIPOGRAFÍA NO ES MANROPE, y es la única excepción a `VISUALS.md` en todo el proyecto. Manrope
// vive dentro de `publico/fuentes/`, y un correo no puede pedirle archivos a nuestro servidor: los
// programas de correo no cargan tipografías de afuera. Así que se pide la que la máquina de quien
// lee ya tenga. Los colores, los tamaños, los redondeos y el espaciado sí salen de `VISUALS.md`.
// ─────────────────────────────────────────────────────────────────────────────────────────────

import { escribirFechaEnPalabras, escribirHoraDelMomento, fechaDelMomento } from "./tiempo.js"

/** Los colores del sistema visual «Clinical Excellence» que usa el correo (`VISUALS.md`). */
const NAVY = "#2f3367" // primary — el azul del encabezado (cambiado el 2026-08-19)
const INDIGO = "#402d84" // secondary — el acento de los datos de la cita
const SUPERFICIE = "#F4F6F8" // el fondo gris del correo
const BLANCO = "#ffffff" // el fondo de la tarjeta
const BORDE = "#E2E8F0" // border-subtle — la línea de 1px de la tarjeta
const TEXTO = "#1c1b1b" // on-surface
const TEXTO_SUAVE = "#44474f" // on-surface-variant — las etiquetas de cada dato

/** La tipografía que se le pide a la máquina de quien lee, en orden de preferencia. */
const TIPOGRAFIA =
  "'Manrope', -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

/**
 * El correo de confirmación de una reserva (RF-11).
 *
 * Lleva los cinco datos que el requisito exige —fecha, hora, servicio, proveedor y ubicación— y el
 * teléfono del negocio. El teléfono no está de adorno: hasta la pieza 5 no existe manera de
 * cancelar desde la aplicación, y aunque exista, RN-5 manda llamar cuando faltan menos de 4 horas.
 */
export function armarCorreoDeConfirmacion({
  clienteNombre,
  clienteCorreo,
  servicio,
  proveedor,
  inicio,
  negocioNombre,
  negocioTelefono,
  negocioUbicacion,
}) {
  const fecha = escribirFechaEnPalabras(fechaDelMomento(inicio))
  const hora = escribirHoraDelMomento(inicio)

  const datos = [
    ["Servicio", servicio],
    ["Terapista", proveedor],
    ["Día", fecha],
    ["Hora", hora],
    ["Dónde", negocioUbicacion],
  ]

  return {
    para: clienteCorreo,
    asunto: `Tu reserva quedó confirmada — ${fecha}, ${hora}`,
    html: enHtml({ clienteNombre, negocioNombre, negocioTelefono, datos }),
    texto: enTextoPlano({ clienteNombre, negocioNombre, negocioTelefono, datos }),
  }
}

/**
 * El correo con el enlace para restablecer la contraseña olvidada (RF-3, pieza 9).
 *
 * Le llega igual a un cliente y a la cuenta de Personal: los dos tienen contraseña y los dos se la
 * pueden olvidar. Por eso acá se habla de «tu cuenta» y no de «tus citas».
 *
 * **Dice cuánto dura el enlace, con el número.** «Vence pronto» no le sirve a nadie: quien lo lee
 * tiene que poder decidir si lo abre ahora o después.
 *
 * **Y dice qué hacer si no fue quien pidió el enlace**: nada. Es información importante, porque
 * recibir este correo sin haberlo pedido es lo único que le avisa a una persona de que alguien está
 * intentando entrar a su cuenta — y la respuesta correcta, ignorarlo, no es obvia.
 */
export function armarCorreoDeRecuperacion({
  nombre,
  correo,
  enlace,
  minutosQueDura,
  negocioNombre,
  negocioTelefono,
}) {
  const cuantoDura = escribirLaDuracion(minutosQueDura)

  return {
    para: correo,
    asunto: `Restablecé tu contraseña de ${negocioNombre}`,
    html: recuperacionEnHtml({ nombre, enlace, cuantoDura, negocioNombre, negocioTelefono }),
    texto: recuperacionEnTextoPlano({ nombre, enlace, cuantoDura, negocioNombre, negocioTelefono }),
  }
}

/**
 * «1 hora», «30 minutos», «2 horas». Escribe la duración como la diría una persona.
 *
 * Existe para que el correo no diga «60 minutos», que es el mismo dato dicho de la manera en que
 * nadie lo dice. Y para que si mañana RN-27 cambia el número, el texto del correo se acomode solo.
 */
function escribirLaDuracion(minutos) {
  if (minutos % 60 !== 0) return `${minutos} minutos`

  const horas = minutos / 60
  return horas === 1 ? "1 hora" : `${horas} horas`
}

/** La versión con diseño del correo de recuperación. */
function recuperacionEnHtml({ nombre, enlace, cuantoDura, negocioNombre, negocioTelefono }) {
  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Restablecé tu contraseña</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: ${SUPERFICIE}; font-family: ${TIPOGRAFIA}; color: ${TEXTO};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${SUPERFICIE}; padding: 24px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: ${BLANCO}; border: 1px solid ${BORDE}; border-radius: 8px; overflow: hidden;">
            <tr>
              <td style="background-color: ${NAVY}; padding: 24px; color: ${BLANCO}; font-size: 24px; line-height: 32px; font-weight: 600;">
                Restablecé tu contraseña
              </td>
            </tr>
            <tr>
              <td style="padding: 24px;">
                <p style="margin: 0 0 16px 0; font-size: 18px; line-height: 28px;">
                  Hola, ${escapar(nombre)}:
                </p>
                <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: ${TEXTO_SUAVE};">
                  Alguien pidió restablecer la contraseña de tu cuenta en ${escapar(negocioNombre)}.
                  Para elegir una nueva, usá <strong style="color: ${TEXTO};">cualquiera de estas
                  dos</strong>:
                </p>

                <!--
                  \`ses:no-track\` le pide al servicio que entrega el correo que **deje este enlace
                  en paz**. Sin eso lo reescribe por uno suyo de rastreo de clics, y el enlace de
                  verdad queda adentro del de ellos: si su rastreador no abre, el botón no lleva a
                  ningún lado. Pasó de verdad el 2026-08-28 (hallazgo 21, en \`DISENO.md\`).
                -->
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
                  <tr>
                    <td style="background-color: ${INDIGO}; border-radius: 8px;">
                      <a href="${escapar(enlace)}" ses:no-track style="display: inline-block; padding: 12px 24px; font-size: 16px; line-height: 24px; font-weight: 600; color: ${BLANCO}; text-decoration: none;">
                        Elegir mi contraseña nueva
                      </a>
                    </td>
                  </tr>
                </table>

                <!--
                  La dirección, a la vista y en su propia caja. **No es el plan B del botón**, y por
                  eso no dice «si el botón no funciona»: son dos caminos al mismo lugar, y este es el
                  único que ningún servicio de afuera puede tocar, porque es texto suelto y no un
                  enlace. Es lo que salvó la prueba del 2026-08-28.
                -->
                <p style="margin: 0 0 8px 0; font-size: 16px; line-height: 24px; color: ${TEXTO_SUAVE};">
                  O copiá esta dirección y pegala en tu navegador:
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
                  <tr>
                    <td style="background-color: ${SUPERFICIE}; border: 1px solid ${BORDE}; border-radius: 8px; padding: 12px 16px; font-family: Consolas, 'Courier New', monospace; font-size: 14px; line-height: 20px; color: ${TEXTO}; word-break: break-all;">
                      ${escapar(enlace)}
                    </td>
                  </tr>
                </table>

                <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: ${TEXTO_SUAVE};">
                  El enlace vence en <strong style="color: ${TEXTO};">${escapar(cuantoDura)}</strong> y
                  sirve una sola vez. Después de usarlo vas a entrar con tu contraseña nueva.
                </p>

                <p style="margin: 0; font-size: 16px; line-height: 24px; color: ${TEXTO_SUAVE};">
                  <strong style="color: ${TEXTO};">Si no fuiste vos</strong>, no hagas nada: tu
                  contraseña de siempre sigue funcionando y este enlace se va a vencer solo. Si te
                  quedan dudas, llamanos al
                  <strong style="color: ${TEXTO};">${escapar(negocioTelefono)}</strong>.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color: ${SUPERFICIE}; border-top: 1px solid ${BORDE}; padding: 16px 24px; font-size: 12px; line-height: 16px; color: ${TEXTO_SUAVE};">
                ${escapar(negocioNombre)} · Este correo se envió automáticamente, no hace falta contestarlo.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

/** La versión de respaldo del correo de recuperación. Dice exactamente lo mismo. */
function recuperacionEnTextoPlano({ nombre, enlace, cuantoDura, negocioNombre, negocioTelefono }) {
  return [
    "RESTABLECÉ TU CONTRASEÑA",
    "",
    `Hola, ${nombre}:`,
    "",
    `Alguien pidió restablecer la contraseña de tu cuenta en ${negocioNombre}.`,
    "Para elegir una nueva, copiá esta dirección y pegala en tu navegador:",
    "",
    enlace,
    "",
    `El enlace vence en ${cuantoDura} y sirve una sola vez. Después de usarlo vas a entrar con tu`,
    "contraseña nueva.",
    "",
    "Si no fuiste vos, no hagas nada: tu contraseña de siempre sigue funcionando y este enlace se",
    `va a vencer solo. Si te quedan dudas, llamanos al ${negocioTelefono}.`,
    "",
    `${negocioNombre} — este correo se envió automáticamente, no hace falta contestarlo.`,
  ].join("\n")
}

/** La versión con diseño. */
function enHtml({ clienteNombre, negocioNombre, negocioTelefono, datos }) {
  const filas = datos
    .map(
      ([etiqueta, valor]) => `
              <tr>
                <td style="padding: 8px 0; font-size: 14px; font-weight: 600; letter-spacing: 0.01em; color: ${TEXTO_SUAVE}; vertical-align: top; width: 120px;">${escapar(etiqueta)}</td>
                <td style="padding: 8px 0; font-size: 16px; line-height: 24px; color: ${TEXTO};">${escapar(valor)}</td>
              </tr>`,
    )
    .join("")

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Tu reserva quedó confirmada</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: ${SUPERFICIE}; font-family: ${TIPOGRAFIA}; color: ${TEXTO};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${SUPERFICIE}; padding: 24px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: ${BLANCO}; border: 1px solid ${BORDE}; border-radius: 8px; overflow: hidden;">
            <tr>
              <td style="background-color: ${NAVY}; padding: 24px; color: ${BLANCO}; font-size: 24px; line-height: 32px; font-weight: 600;">
                Tu reserva quedó confirmada
              </td>
            </tr>
            <tr>
              <td style="padding: 24px;">
                <p style="margin: 0 0 16px 0; font-size: 18px; line-height: 28px;">
                  Hola, ${escapar(clienteNombre)}:
                </p>
                <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: ${TEXTO_SUAVE};">
                  Ya tenés tu cita apartada en ${escapar(negocioNombre)}. Estos son los datos:
                </p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid ${BORDE}; border-bottom: 1px solid ${BORDE}; border-left: 4px solid ${INDIGO}; padding: 8px 16px;">
                  ${filas}
                </table>

                <p style="margin: 24px 0 0 0; font-size: 16px; line-height: 24px; color: ${TEXTO_SUAVE};">
                  Si necesitás cambiar o cancelar tu cita, llamanos al
                  <strong style="color: ${TEXTO};">${escapar(negocioTelefono)}</strong>.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color: ${SUPERFICIE}; border-top: 1px solid ${BORDE}; padding: 16px 24px; font-size: 12px; line-height: 16px; color: ${TEXTO_SUAVE};">
                ${escapar(negocioNombre)} · Este correo se envió automáticamente, no hace falta contestarlo.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

/** La versión de respaldo, sin diseño. Dice exactamente lo mismo. */
function enTextoPlano({ clienteNombre, negocioNombre, negocioTelefono, datos }) {
  const lineas = datos.map(([etiqueta, valor]) => `${etiqueta}: ${valor}`)

  return [
    "TU RESERVA QUEDÓ CONFIRMADA",
    "",
    `Hola, ${clienteNombre}:`,
    "",
    `Ya tenés tu cita apartada en ${negocioNombre}. Estos son los datos:`,
    "",
    ...lineas,
    "",
    `Si necesitás cambiar o cancelar tu cita, llamanos al ${negocioTelefono}.`,
    "",
    `${negocioNombre} — este correo se envió automáticamente, no hace falta contestarlo.`,
  ].join("\n")
}

/**
 * Deja un texto listo para meterlo adentro de HTML sin romperlo.
 *
 * Hace falta porque estos textos los escribió una persona: un servicio que se llamara «Facial &
 * limpieza», o un nombre con un `<`, cortarían el correo justo ahí y lo que sigue no se vería. No
 * es paranoia de seguridad —el correo se lo mandamos a la misma persona que escribió su nombre—:
 * es que el correo llegue entero.
 */
function escapar(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}
