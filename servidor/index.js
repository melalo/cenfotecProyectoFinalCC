// El único archivo que arranca el servidor. Es lo que corre `npm start`.

import "dotenv/config"
import { randomBytes } from "node:crypto"

import { abrirBase, RUTA_DE_LA_BASE } from "./base-de-datos.js"
import { crearAplicacion } from "./aplicacion.js"
import { crearEnviadorResend } from "./enviador-resend.js"

// El puerto 3000 está fijado como decisión del proyecto para que no dependa de la máquina
// (`README.md`). `PORT` lo puede cambiar.
const puerto = Number(process.env.PORT) || 3000

let sesionSecreto = process.env.SESION_SECRETO
if (!sesionSecreto) {
  sesionSecreto = randomBytes(32).toString("hex")
  console.warn(
    "Aviso: no hay SESION_SECRETO en el archivo .env, así que se inventó una firma nueva para\n" +
      "       esta vez. La aplicación funciona igual, pero las sesiones abiertas se van a cerrar\n" +
      "       cada vez que la reinicies. Para evitarlo: copiá .env.ejemplo como .env y ponele\n" +
      "       cualquier texto largo e inventado en SESION_SECRETO.",
  )
}

const base = abrirBase(RUTA_DE_LA_BASE)

const { cuantas } = base.prepare("SELECT COUNT(*) AS cuantas FROM personal").get()
if (cuantas === 0) {
  console.warn(
    "Aviso: la base de datos está vacía. Si querés los datos de prueba (la cuenta de Personal\n" +
      "       precargada), apagá la aplicación y corré:  npm run datos",
  )
}

// El servicio de correo (pieza 4). Sin clave la aplicación **tiene que levantar igual** (RF-19):
// el enviador se arma de todos modos y falla en cada envío, así que los correos quedan registrados
// como fallidos y las citas se siguen creando. Por eso esto es un aviso y no un error.
if (!process.env.RESEND_API_KEY || !process.env.CORREO_REMITENTE) {
  console.warn(
    "Aviso: falta RESEND_API_KEY o CORREO_REMITENTE en el archivo .env, así que no se van a poder\n" +
      "       mandar los correos de confirmación. La aplicación funciona igual y las citas se\n" +
      "       siguen creando: cada correo va a quedar registrado como fallido. Para arreglarlo,\n" +
      "       mirá el README.md, sección «Variables de entorno».",
  )
}

const enviador = crearEnviadorResend({
  claveApi: process.env.RESEND_API_KEY,
  remitente: process.env.CORREO_REMITENTE,
})

// Con qué dirección se escriben los enlaces que salen por correo (pieza 9). Si no se pone, se arma
// con el puerto de esta máquina — y eso quiere decir que **el enlace solo abre acá**. Está
// declarado en `DISENO.md`, «La limitación del enlace, dicha en voz alta».
const direccionPublica = process.env.DIRECCION_PUBLICA || `http://localhost:${puerto}`

crearAplicacion({ base, sesionSecreto, enviador, direccionPublica }).listen(puerto, () => {
  console.log(`Reservas en línea levantada en http://localhost:${puerto}`)
})
