// Arma la aplicación como la necesita el despliegue. Es el equivalente de `index.js`, sin el
// `listen()`: en Vercel no hay un servidor que escuche un puerto, hay una función que se despierta
// cuando alguien visita el sitio.
//
// Lo que este archivo hace de menos que `index.js`, y es a propósito:
//   - **no crea el esquema.** Se crea una vez, aparte. Hacerlo en cada visita fría serían decenas
//     de viajes a una base que está en la red (la trampa 3 del despliegue anterior).
//   - **no cuenta si la base está vacía.** Ese aviso es para quien levanta la aplicación en su
//     computadora y puede leer la terminal. En el despliegue nadie lo lee, y cuesta una consulta en
//     cada visita fría.

import { conectar } from "./base-de-datos.js"
import { crearAplicacion } from "./aplicacion.js"
import { crearEnviadorResend } from "./enviador-resend.js"

export async function crearAplicacionDesplegada() {
  const base = await conectar()

  // En el despliegue **sí** se exige. Sin firma, cada copia de la función se inventaría la suya y
  // una sesión abierta en una dejaría de valer en la siguiente: la gente se caería de la sesión sin
  // motivo aparente. En la computadora eso no se nota porque hay un solo proceso, y por eso
  // `index.js` allá se conforma con avisar.
  const sesionSecreto = process.env.SESION_SECRETO
  if (!sesionSecreto) {
    throw new Error(
      "Falta configurar SESION_SECRETO. En el despliegue hay varias copias de la función " +
        "atendiendo, y sin una firma compartida las sesiones se cerrarían solas al cambiar de copia.",
    )
  }

  const enviador = crearEnviadorResend({
    claveApi: process.env.RESEND_API_KEY,
    remitente: process.env.CORREO_REMITENTE,
  })

  // Acá `DIRECCION_PUBLICA` deja de ser un detalle y pasa a ser lo que hace que los enlaces del
  // correo sirvan: es la dirección del sitio publicado. Sin ella, los enlaces de la pieza 9 —y los
  // de la pieza 6— dirían `localhost` y no abrirían en el teléfono de nadie.
  const direccionPublica = process.env.DIRECCION_PUBLICA
  if (!direccionPublica) {
    throw new Error(
      "Falta configurar DIRECCION_PUBLICA con la dirección del sitio publicado. Sin ella los " +
        "enlaces que salen por correo dirían «localhost», que quiere decir «esta computadora».",
    )
  }

  return crearAplicacion({ base, sesionSecreto, enviador, direccionPublica })
}
