// Lo que solo la cuenta de Personal puede hacer: crearle la cuenta a quien llama por teléfono, y
// buscar a quien llama entre los clientes que ya existen.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// POR QUÉ ESTO ES UN ARCHIVO APARTE
//
// Porque es un actor distinto con reglas propias. `credenciales.js` dice **qué contraseña se
// acepta**; `clientes.js` guarda **los datos que el cliente corrige de su propia cuenta**. Acá vive
// otra cosa: que una tercera persona —la asistente— cree la cuenta de alguien que está al teléfono,
// con una contraseña que ella va a conocer y que la otra persona está obligada a cambiar (RN-11).
//
// Este archivo **no sabe de HTTP**. Devuelve `{ ok: true, … }` o `{ ok: false, motivo }`, igual que
// `reservas.js` y `clientes.js`, y quien lo llama traduce el motivo al número que corresponda.
// ─────────────────────────────────────────────────────────────────────────────────────────────

import { cifrarContrasena } from "./contrasenas.js"
import { correoTieneForma } from "./credenciales.js"

/**
 * Cuántas letras hay que escribir para que la búsqueda conteste algo.
 *
 * Con menos, devuelve la lista vacía en vez de la lista completa *(decidido por la estudiante el
 * 2026-08-21)*. Dos razones: Personal **siempre sabe con quién está hablando**, así que no necesita
 * elegir de una lista; y una lista con todos deja los correos de todos los clientes del negocio a la
 * vista de cualquiera que pase por atrás del mostrador.
 */
export const LETRAS_MINIMAS_PARA_BUSCAR = 2

/**
 * Las palabras con las que se arma una contraseña temporal.
 *
 * Están escogidas con un criterio, no al azar: **ninguna lleva tilde ni ñ** —porque RN-23 no las
 * permite—, todas son cosas comunes y neutras, ninguna tiene letras que se confundan al dictarlas
 * por teléfono (nada de «b» y «v» juntas en la misma palabra), y ninguna dice nada de nadie: no hay
 * nombres de personas ni palabras que puedan sonar a burla cuando alguien las lea en voz alta.
 */
const PALABRAS = [
  "Girasol",
  "Ventana",
  "Camino",
  "Canela",
  "Naranja",
  "Bosque",
  "Lucero",
  "Estrella",
  "Panuelo",
  "Semilla",
  "Cascada",
  "Colina",
  "Tortuga",
  "Almendra",
  "Cometa",
  "Jardin",
  "Melodia",
  "Puente",
  "Rocio",
  "Sendero",
  "Terraza",
  "Violeta",
  "Zapote",
  "Nectar",
]

/** Cuántos números se le pegan a la palabra. Tres da mil combinaciones por palabra. */
const CUANTOS_NUMEROS = 3

/**
 * Inventa una contraseña temporal para dictar por teléfono: `Girasol472`.
 *
 * ── Por qué esta forma, y no letras al azar ──────────────────────────────────────────────────
 *
 * *Decidido por la estudiante el 2026-08-21.* Lo que manda acá es que **hay que dictarla por
 * teléfono** (RN-11): ocho caracteres al azar son mucho más difíciles de adivinar, pero se dictan
 * mal y con errores, y una contraseña que la persona anota equivocada no sirve para nada. Una
 * palabra fija —siempre la misma— sería lo más cómodo y lo más débil: quien la sepa solo tiene que
 * probar mil números.
 *
 * Con la palabra variable son unas 24.000 combinaciones. No es una contraseña fuerte, y no
 * pretende serlo: es de un solo uso. La cuenta **nace obligada a cambiarla** en cuanto la persona
 * entra (RF-4), y hasta que eso pase esa cuenta no puede hacer nada en la aplicación y no tiene
 * ninguna cita adentro. La contraseña fuerte es la que la persona elige después.
 *
 * `Math.random()` alcanza justamente por eso. Si esta contraseña tuviera que proteger algo de valor
 * habría que usar `randomInt` de `node:crypto`, que es azar de verdad y no una cuenta que se puede
 * predecir conociendo el punto de partida.
 *
 * Cumple RN-23 **por construcción**: la palabra aporta la mayúscula inicial y pasa de 6 caracteres,
 * los números aportan el número, y ninguna palabra de la lista lleva tilde. Hay una prueba que se lo
 * pregunta a `queLeFaltaALaContrasena` —la función que decide de verdad— en vez de darlo por hecho.
 */
export function inventarContrasenaTemporal() {
  const palabra = PALABRAS[Math.floor(Math.random() * PALABRAS.length)]

  let numeros = ""
  for (let cuantos = 0; cuantos < CUANTOS_NUMEROS; cuantos++) {
    numeros += Math.floor(Math.random() * 10)
  }

  return `${palabra}${numeros}`
}

/**
 * Crea la cuenta de quien llama, con una contraseña temporal (RF-17, RN-11).
 *
 * Devuelve `{ ok: true, cliente: { id, nombre, correo, contrasenaTemporal } }`, y **es la única vez
 * que esa contraseña existe en algún lado**: en la base solo queda su huella cifrada, de la que no
 * se puede volver atrás. Si Personal la pierde antes de dictarla, el camino es restablecerla
 * (pieza 9).
 *
 * Motivos posibles: `"datos_incompletos"`, `"correo_invalido"` y `"correo_ya_registrado"`.
 *
 * **No se le pide el teléfono ni la fecha de nacimiento.** Los dos son opcionales (REG-2) y quien
 * está al teléfono queriendo una cita no tiene por qué contestar un cuestionario: los completa
 * después, desde su sección «Usuario».
 */
export function crearClienteDesdePersonal({ base, nombre, correo }) {
  const nombreLimpio = String(nombre ?? "").trim()
  const correoLimpio = normalizarCorreo(correo)

  if (nombreLimpio === "" || correoLimpio === "") {
    return { ok: false, motivo: "datos_incompletos" }
  }

  // Las mismas dos reglas que el registro de la pieza 1, llamadas al mismo lugar. El orden también
  // es el mismo —primero el correo— porque un correo mal escrito hace que el correo de confirmación
  // no le llegue a nadie (RN-24).
  if (!correoTieneForma(correoLimpio)) {
    return { ok: false, motivo: "correo_invalido" }
  }

  // El correo tiene que estar libre en **las dos** tablas de cuentas: si coincidiera con la de
  // Personal, al entrar no se sabría cuál de las dos es. Es la misma razón que ya tenía el registro.
  if (eseCorreoYaTieneCuenta(base, correoLimpio)) {
    return { ok: false, motivo: "correo_ya_registrado" }
  }

  const contrasenaTemporal = inventarContrasenaTemporal()

  // `debe_cambiar_contrasena` nace en 1, y eso es lo que obliga al cambio en el primer ingreso
  // (RF-4). La columna existe desde la pieza 1, vacía, esperando esta pieza.
  const creada = base
    .prepare(
      `INSERT INTO cliente (nombre, correo, contrasena_cifrada, debe_cambiar_contrasena)
       VALUES (?, ?, ?, 1)`,
    )
    .run(nombreLimpio, correoLimpio, cifrarContrasena(contrasenaTemporal))

  return {
    ok: true,
    cliente: {
      id: Number(creada.lastInsertRowid),
      nombre: nombreLimpio,
      correo: correoLimpio,
      contrasenaTemporal,
    },
  }
}

/**
 * Busca clientes por un pedazo de su nombre o de su correo, sin distinguir mayúsculas.
 *
 * Devuelve **solo** el número, el nombre y el correo. La contraseña cifrada no sale nunca del
 * servidor, ni siquiera hacia la pantalla de Personal, y el teléfono y la fecha de nacimiento
 * tampoco: son datos del cliente y esta lista existe para una sola cosa, elegir a quién se está
 * atendiendo.
 *
 * **Busca solo en la tabla `cliente`**: la cuenta de Personal no es alguien a quien se le reserve
 * una cita.
 *
 * `LIKE` con `%` de los dos lados es «que contenga esto en algún lado», y en SQLite `LIKE` ya viene
 * sin distinguir mayúsculas para el alfabeto de siempre. Los tres caracteres que `LIKE` trata como
 * comodines —`%`, `_` y la barra invertida— se escapan antes: sin eso, buscar `%` devolvería la
 * lista completa, que es justo lo que la decisión de la estudiante quiso evitar.
 */
export function buscarClientes({ base, busqueda }) {
  const texto = String(busqueda ?? "").trim()
  if (texto.length < LETRAS_MINIMAS_PARA_BUSCAR) return []

  const pedazo = `%${escaparComodines(texto)}%`

  return base
    .prepare(
      `SELECT id, nombre, correo
         FROM cliente
        WHERE nombre LIKE ? ESCAPE '\\' OR correo LIKE ? ESCAPE '\\'
        ORDER BY nombre`,
    )
    .all(pedazo, pedazo)
}

/** ¿Existe ese cliente? Lo pregunta la ruta antes de reservarle una cita o de listar las suyas. */
export function eseClienteExiste(base, clienteId) {
  if (!Number.isInteger(clienteId) || clienteId <= 0) return false

  return base.prepare("SELECT 1 FROM cliente WHERE id = ?").get(clienteId) !== undefined
}

/** Los correos se guardan y se buscan siempre en minúscula y sin espacios de sobra. */
function normalizarCorreo(correo) {
  return String(correo ?? "")
    .trim()
    .toLowerCase()
}

function eseCorreoYaTieneCuenta(base, correo) {
  const cliente = base.prepare("SELECT 1 FROM cliente WHERE correo = ?").get(correo)
  if (cliente) return true

  return base.prepare("SELECT 1 FROM personal WHERE correo = ?").get(correo) !== undefined
}

/** Deja los comodines de `LIKE` como letras normales, para que se busquen tal cual. */
function escaparComodines(texto) {
  return texto.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_")
}
