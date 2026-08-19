// Los datos del cliente: leerlos, comprobarlos y guardarlos.
//
// Es la parte de la cuenta que el propio cliente puede ver y corregir (RF-22): su nombre, su
// teléfono y su fecha de nacimiento. El correo **no** está acá a propósito: no se cambia desde la
// aplicación (RN-21), porque es con lo que la persona entra.
//
// Toda la comprobación de estos datos vive en este archivo, y no en la pantalla, por la regla de
// `CLAUDE.md`: el frontend no decide reglas de negocio. La pantalla manda lo que la persona escribió
// y muestra el error que el servidor conteste. Así la regla es una sola.

import { edadEnAnios, fechaDeCostaRica, fechaEstaBienEscrita } from "./tiempo.js"

/**
 * Cuántos años para atrás se acepta una fecha de nacimiento.
 *
 * No es una regla del negocio: es un colador de dedazos. Sin esto, escribir 1090 en vez de 1990 se
 * guardaría sin chistar y la pantalla mostraría «936 años».
 */
const ANIOS_MAXIMOS = 120

/** Cuántos dígitos tiene un teléfono de Costa Rica, que es donde está el único negocio del sistema. */
const DIGITOS_DEL_TELEFONO = 8

/**
 * La información del cliente, lista para mandársela a la pantalla.
 *
 * La **edad no se lee de la base**: no está guardada. Se calcula acá a partir de la fecha de
 * nacimiento y del momento actual, que llega como dato igual que en todo el proyecto.
 */
export function informacionDelCliente({ base, clienteId, ahora }) {
  const cliente = base
    .prepare("SELECT nombre, correo, telefono, fecha_nacimiento FROM cliente WHERE id = ?")
    .get(clienteId)

  if (!cliente) return null

  return {
    nombre: cliente.nombre,
    correo: cliente.correo,
    telefono: cliente.telefono ?? null,
    fechaNacimiento: cliente.fecha_nacimiento ?? null,
    edad: cliente.fecha_nacimiento ? edadEnAnios(cliente.fecha_nacimiento, ahora) : null,
  }
}

/**
 * Guarda los tres datos que el cliente puede corregir.
 *
 * Devuelve `{ ok: true }` o `{ ok: false, motivo }`. **No sabe de HTTP**: quien la llama traduce el
 * motivo al número que corresponda. Los motivos son `"nombre_invalido"`, `"telefono_invalido"` y
 * `"fecha_nacimiento_invalida"`.
 *
 * **Reemplaza los tres, no los mezcla.** Un campo que no venga en el pedido se guarda vacío, porque
 * lo que manda la pantalla es el formulario completo: si «vacío» significara «dejalo como estaba»,
 * no habría forma de borrar un teléfono que se cargó por error.
 *
 * Y si uno de los tres está mal, **no se guarda ninguno**: se contesta el error y la base queda como
 * estaba. Guardar la mitad de un formulario deja al cliente sin saber qué quedó.
 */
export function guardarDatosDelCliente({ base, clienteId, datos, ahora }) {
  const nombre = typeof datos?.nombre === "string" ? datos.nombre.trim() : ""
  if (nombre === "") return { ok: false, motivo: "nombre_invalido" }

  const telefono = normalizarTelefono(datos?.telefono)
  if (telefono === MAL_ESCRITO) return { ok: false, motivo: "telefono_invalido" }

  const fechaNacimiento = revisarFechaDeNacimiento(datos?.fechaNacimiento, ahora)
  if (fechaNacimiento === MAL_ESCRITO) return { ok: false, motivo: "fecha_nacimiento_invalida" }

  // El correo no se toca, aunque venga en el pedido (RN-21).
  base
    .prepare("UPDATE cliente SET nombre = ?, telefono = ?, fecha_nacimiento = ? WHERE id = ?")
    .run(nombre, telefono, fechaNacimiento, clienteId)

  return { ok: true }
}

/** Lo que devuelven las comprobaciones cuando el dato no sirve. No es `null`: `null` es «vacío». */
const MAL_ESCRITO = Symbol("mal escrito")

/**
 * Deja el teléfono escrito siempre igual: `8888-7777`, como el del negocio en los datos de prueba.
 *
 * Se aceptan los 8 dígitos con guión o sin él, y con espacios, porque cada persona escribe su
 * teléfono como está acostumbrada. Lo que **no** se acepta es cualquier otra cosa: un «llamame al
 * celu» guardado no sirve para llamar a nadie. Vacío sí se acepta — el teléfono es opcional (REG-2).
 */
function normalizarTelefono(telefono) {
  if (telefono === undefined || telefono === null) return null

  const limpio = String(telefono).replace(/[\s-]/g, "")
  if (limpio === "") return null

  if (!new RegExp(`^\\d{${DIGITOS_DEL_TELEFONO}}$`).test(limpio)) return MAL_ESCRITO

  return `${limpio.slice(0, 4)}-${limpio.slice(4)}`
}

/**
 * Comprueba la fecha de nacimiento: que esté escrita `1990-03-15`, que ese día exista, que no sea
 * del futuro, y que no sea de hace más de 120 años. Vacía se acepta: es opcional (REG-2).
 *
 * «Del futuro» se mide contra la fecha del **negocio**, no contra la de la máquina, como todo lo que
 * tiene que ver con fechas en este proyecto.
 */
function revisarFechaDeNacimiento(fecha, ahora) {
  if (fecha === undefined || fecha === null || fecha === "") return null
  if (!fechaEstaBienEscrita(fecha)) return MAL_ESCRITO

  const hoy = fechaDeCostaRica(ahora)
  if (fecha > hoy) return MAL_ESCRITO
  if (edadEnAnios(fecha, ahora) > ANIOS_MAXIMOS) return MAL_ESCRITO

  return fecha
}
