// Cifrar contraseñas y comprobar si una coincide.
//
// La contraseña nunca se guarda tal cual. Se guarda una «huella»: un texto que se calcula a partir
// de la contraseña y del que no se puede volver atrás. Cuando alguien intenta entrar, se calcula la
// huella de lo que escribió y se compara con la guardada.
//
// Cada cuenta tiene además su propia «sal»: unas letras al azar que entran en el cálculo. Sirve
// para que dos personas con la misma contraseña no tengan la misma huella, y para que una lista de
// huellas ya calculadas no le sirva a nadie.
//
// Se usa `scrypt`, que viene incluido en Node (decidido en `DISENO.md`, «Decisiones tomadas al
// construir la pieza 1»).

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

const LARGO_DE_LA_SAL = 16
const LARGO_DE_LA_HUELLA = 64

/** Devuelve el texto que se guarda en la base, con la forma `sal:huella`. */
export function cifrarContrasena(contrasena) {
  const sal = randomBytes(LARGO_DE_LA_SAL).toString("hex")
  const huella = scryptSync(contrasena, sal, LARGO_DE_LA_HUELLA).toString("hex")
  return `${sal}:${huella}`
}

/** Dice si la contraseña escrita corresponde al texto `sal:huella` que estaba guardado. */
export function contrasenaCoincide(contrasena, guardada) {
  const [sal, huella] = String(guardada).split(":")
  if (!sal || !huella) return false

  const calculada = scryptSync(contrasena, sal, LARGO_DE_LA_HUELLA)
  const original = Buffer.from(huella, "hex")
  if (calculada.length !== original.length) return false

  // `timingSafeEqual` compara siempre en el mismo tiempo, aunque las huellas se diferencien en la
  // primera letra. Una comparación normal tardaría un poquito más cuanto más se parecieran, y ese
  // «poquito» es información que alguien podría medir para ir adivinando la contraseña.
  return timingSafeEqual(calculada, original)
}
