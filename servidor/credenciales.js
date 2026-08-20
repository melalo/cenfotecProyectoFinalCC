// Qué contraseña y qué correo se aceptan al crear una cuenta. Las reglas RN-23 y RN-24.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// POR QUÉ ESTO ES UN ARCHIVO Y NO DOS LÍNEAS ADENTRO DEL ENDPOINT
//
// Porque hay **tres** lugares distintos donde alguien elige una contraseña, y las reglas tienen que
// ser las mismas en los tres: al registrarse (pieza 1), al cambiar la contraseña temporal que le dio
// Personal (pieza 7) y al restablecer la olvidada (pieza 9). Hoy solo existe el primero. Si la regla
// viviera adentro de ese endpoint, las piezas 7 y 9 tendrían que copiarla, y una regla copiada es una
// regla que un día se desincroniza — que es exactamente lo que `CLAUDE.md` prohíbe.
//
// Y HAY UNA SEGUNDA COPIA, INEVITABLE: la pantalla. `publico/aplicacion-cliente.js` vuelve a escribir
// estas mismas condiciones para poder pintar los renglones de verde mientras la persona escribe. Eso
// **no** contradice la regla de «un solo lugar», porque los dos no son iguales de importantes:
//
//   - Lo de acá **decide**. Es lo que se cumple pase lo que pase, incluso si alguien le manda un
//     pedido al API sin abrir el navegador (comprobación 7 de la pieza 12).
//   - Lo de la pantalla **avisa**. Es una ayuda visual, y si un día se desincronizara, lo peor que
//     pasaría es que la pantalla dijera «verde» y el servidor rechazara igual. Nunca al revés.
//
// El navegador no puede leer los archivos de `servidor/`, así que la alternativa sería mandarle las
// reglas por el API — mucha maquinaria para dos condiciones que no cambian nunca.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/** El mínimo de caracteres de una contraseña (RN-23). */
export const LARGO_MINIMO_DE_CONTRASENA = 6

/**
 * Qué le falta a una contraseña para cumplir RN-23. Devuelve una lista vacía si está bien.
 *
 * Devuelve **qué falta**, no un sí o un no, y no un mensaje ya escrito. Las dos cosas son a
 * propósito:
 *
 *   - Con la lista, el mensaje puede nombrar solo lo que falta en vez de repetir las tres
 *     condiciones siempre. Alguien que escribió `abcdefg` no necesita que le digan que le falta
 *     largo: le sobra.
 *   - Y el **texto** lo escribe la pantalla, no el servidor. Es la convención del proyecto: el API
 *     manda el dato, la interfaz manda las palabras.
 *
 * Los nombres de la lista (`largo`, `mayuscula`, `numero`) los fija el bloque *Produce* de la pieza
 * 12 en `PLAN.md`.
 */
export function queLeFaltaALaContrasena(contrasena) {
  const texto = String(contrasena ?? "")
  const faltan = []

  if (texto.length < LARGO_MINIMO_DE_CONTRASENA) faltan.push("largo")

  // Solo `A-Z`: la mayúscula tiene que ser una de las 26 de siempre.
  if (!/[A-Z]/.test(texto)) faltan.push("mayuscula")

  if (!/[0-9]/.test(texto)) faltan.push("numero")

  // **Nada de vocales acentuadas: á, é, í, ó, ú, ni la diéresis de la ü.** `óArtolo123` se rechaza.
  //
  // **La ñ SÍ se puede.** `Contraseña123` se acepta.
  //
  // Esa distinción no es un detalle: la ñ **es una letra del alfabeto español**, con su lugar propio
  // entre la N y la O, no una «n con tilde». Lo que lleva encima se llama virgulilla y es parte de
  // la letra, igual que el palito de la t. Un acento, en cambio, es una marca que se le pone a una
  // vocal que sigue siendo la misma vocal: la `á` de «acción» es una `a`.
  //
  // Es una decisión de la estudiante del 2026-08-19, y llegó en **tres pasos**, los tres probando
  // en pantalla:
  //
  //   1. Primero pidió que una mayúscula con tilde **no contara** como la mayúscula obligatoria.
  //   2. Después escribió `óArtolo123` y la vio pasar. Pasaba por la `A` de «Artolo», no por la
  //      `ó` —la regla hacía lo que decía—, pero eso no era lo que ella quería, así que se cambió
  //      la regla, no la explicación.
  //   3. Y **corrigió el paso 2**: ese primer intento también rechazaba la ñ, y ella lo señaló —«la
  //      ñ no es una tilde, es una letra». Tenía razón, y por eso quedó afuera de la prohibición.
  //
  // La razón completa está en RN-23 de `ESPECIFICACION.md`.
  if (tieneAcento(texto)) faltan.push("sin_acentos")

  return faltan
}

/**
 * ¿Este texto tiene alguna vocal acentuada (á, é, í, ó, ú) o con diéresis (ü)? **La ñ no cuenta.**
 *
 * El truco es una función que ya trae JavaScript: `normalize("NFD")` **separa una letra de su
 * acento**. La «á» se convierte en dos cosas: una «a» normal y un acento suelto. Después alcanza con
 * preguntar si quedó algún acento suelto dando vueltas.
 *
 * Se hace así en vez de escribir la lista `áéíóúüÁÉÍÓÚÜ` a mano por una razón: la lista a mano se
 * olvida de casos. La «ç» de «François», la «à», la «ô». Con esto quedan cubiertos todos, sin tener
 * que acordarse de ninguno.
 *
 * **Y por eso hay que sacar la ñ antes**, no después: ese mismo truco también la separaría en una
 * «n» y una virgulilla suelta, y la daría por acentuada. Pero la ñ **es una letra del alfabeto**, no
 * una n con algo encima, así que se cambia por una `n` común antes de mirar — así la letra deja de
 * estar, y su virgulilla tampoco aparece.
 *
 * El `normalize("NFC")` del principio es por si la ñ viene ya separada en dos pedazos desde el
 * teclado: junta lo que se pueda juntar, para que el cambio de abajo la encuentre.
 *
 * *(`\u0300-\u036f` es el pedazo del alfabeto universal donde viven los acentos sueltos.
 * Va escrito con su número y no con el símbolo porque, solos, los acentos no se ven: en el código
 * quedarían como caracteres invisibles que nadie puede leer.)*
 */
function tieneAcento(texto) {
  const sinLaEne = texto.normalize("NFC").replaceAll("ñ", "n").replaceAll("Ñ", "N")
  return /[\u0300-\u036f]/.test(sinLaEne.normalize("NFD"))
}

/**
 * ¿Este texto tiene forma de correo (RN-24)?
 *
 * **No comprueba que el correo exista ni que la persona lo reciba** — eso solo se sabe mandándole
 * algo, y está fuera de alcance. Lo que atrapa es el dedazo: `ana` sin arroba, `ana@ejemplo` sin
 * terminación, un espacio en el medio.
 *
 * La comprobación es a propósito **generosa**, no estricta. Existen reglas oficiales para escribir
 * un correo y son enormes; una comprobación que intente seguirlas al pie de la letra termina
 * rechazando direcciones de verdad, y dejar a alguien afuera de su propia cuenta es peor que dejar
 * pasar un correo raro que igual va a rebotar. Así que se pide lo mínimo que distingue un correo de
 * algo que no lo es:
 *
 *     algo   @   algo   .   terminación de 2 letras o más
 *
 * sin espacios en ninguna parte y con una sola arroba.
 */
export function correoTieneForma(correo) {
  const texto = String(correo ?? "").trim()

  // El límite de largo no es capricho: sin él, un texto larguísimo puede hacer que la comprobación
  // de abajo tarde muchísimo, y eso es una forma conocida de tumbar un servidor.
  if (texto.length === 0 || texto.length > 254) return false

  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(texto)
}
