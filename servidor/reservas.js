// Las citas: crearlas, y leer las de un cliente.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// Es el componente **Reservas** de `DISENO.md`, y su límite dice que es **el único que modifica el
// estado de una cita**. Hoy solo sabe crearlas; cancelar y reagendar (pieza 5), reservar en nombre
// de quien llama (pieza 7) y cerrar las pasadas (pieza 8) se escriben acá adentro cuando toque.
//
// Lo que este archivo NO hace: decidir si un horario está libre. Esa regla vive en
// `disponibilidad.js`, que es el mismo lugar del que sale el calendario que la persona vio antes de
// elegir. Preguntarle a él —en vez de volver a escribir la regla— es lo que garantiza que la
// pantalla y la reserva nunca se contradigan.
//
// LA CARRERA (CA-1). Dos clientes pueden confirmar el mismo horario casi en el mismo instante.
// Comprobar «¿está libre?» y después insertar son **dos movimientos**, y entre uno y otro cabe la
// reserva de la otra persona. Acá eso se resuelve con dos candados, uno adentro del otro:
//
//   1. **El índice único parcial de la base** (`base-de-datos.js`): la base se niega a guardar una
//      segunda cita activa para el mismo proveedor a la misma hora. Es el candado de verdad — no
//      hace la segunda inserción improbable, la hace imposible.
//   2. **La transacción `immediate`**: junta la comprobación y la inserción en un solo movimiento,
//      y toma el permiso de escritura antes de empezar en vez de a mitad de camino.
//
// La comprobación previa igual hace falta, y no es por seguridad: es la única que sabe **por qué**
// se rechaza —feriado, domingo, hoy— y puede contestar el mensaje correcto. El índice solo sabe
// decir «no».
// ─────────────────────────────────────────────────────────────────────────────────────────────

import { enviarConfirmacionDeCita } from "./correo.js"
import { revisarHorario } from "./disponibilidad.js"
import { escribirMomento } from "./tiempo.js"

/** Los estados de una cita (bloque *Produce* de la pieza 3). Esta pieza solo crea el primero. */
export const ESTADO_ACTIVA = "activa"

/** Los canales de una cita (RN-12). Esta pieza solo crea el primero; el otro es de la pieza 7. */
export const CANAL_EN_LINEA = "en_linea"

/** El error que SQLite devuelve cuando el índice único rechaza una inserción repetida. */
const RECHAZO_DEL_INDICE_UNICO = "SQLITE_CONSTRAINT_UNIQUE"

/**
 * Crea una cita activa para un cliente (RF-8).
 *
 * Devuelve `{ ok: true, cita }` si se pudo, o `{ ok: false, motivo }` si no. **No lanza errores ni
 * sabe de HTTP**: quien la llama traduce el motivo al número que corresponda. Los motivos posibles
 * son los dos rechazos que fija el plan:
 *
 *   - `"mismo_dia"`             → el horario es de hoy o de un día que ya pasó (RN-4, CA-2)
 *   - `"horario_no_disponible"` → ya lo tomaron, es feriado, es domingo, o no es hora de atención
 *
 * `ahora` llega como dato, igual que en todo el proyecto: es lo que permite que las pruebas paren el
 * reloj y comprueben siempre lo mismo.
 */
export function crearCita({ base, clienteId, servicioId, proveedorId, inicio, ahora }) {
  const comprobarYGuardar = base.transaction(() => {
    const revision = revisarHorario({ base, proveedorId, inicio, ahora })

    if (revision === "hoy_o_pasado") return { ok: false, motivo: "mismo_dia" }
    if (revision !== "disponible") return { ok: false, motivo: "horario_no_disponible" }

    const guardada = base
      .prepare(
        `INSERT INTO cita (cliente_id, servicio_id, proveedor_id, inicio, estado, creada_en, canal)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        clienteId,
        servicioId,
        proveedorId,
        inicio,
        ESTADO_ACTIVA,
        escribirMomento(ahora),
        CANAL_EN_LINEA,
      )

    // Las otras cinco columnas de la tabla quedan vacías a propósito: `personal_id_creador` la
    // llena la pieza 7, las dos de cancelación la pieza 5, y las dos de cierre la pieza 8.
    return {
      ok: true,
      cita: {
        id: Number(guardada.lastInsertRowid),
        servicioId,
        proveedorId,
        inicio,
        estado: ESTADO_ACTIVA,
        canal: CANAL_EN_LINEA,
      },
    }
  })

  try {
    // `immediate` pide el permiso de escritura al empezar la transacción, no a mitad de camino. Es
    // lo que corresponde acá: se sabe de antemano que se va a escribir.
    return comprobarYGuardar.immediate()
  } catch (falla) {
    // Acá se cae la reserva que perdió la carrera de CA-1: pasó la comprobación porque el horario
    // todavía estaba libre cuando la miró, y el índice único la rechazó al guardar.
    if (falla.code === RECHAZO_DEL_INDICE_UNICO) {
      return { ok: false, motivo: "horario_no_disponible" }
    }
    throw falla
  }
}

/**
 * Crea la cita **y le avisa al cliente por correo** (RF-11). Es lo que llaman los endpoints; la
 * pieza 7, cuando Personal reserve en nombre de alguien, va a llamar exactamente a esta.
 *
 * Existe para que «al crear una cita se manda la confirmación» esté escrito en **un solo lugar**.
 * Si cada endpoint tuviera que acordarse de mandar el correo por su cuenta, el día que se agregue
 * uno nuevo va a haber un camino por el que se reserva sin que nadie se entere. Es el mismo motivo
 * por el que `DISENO.md` dice que Reservas «avisa a Notificaciones cuando algo cambia».
 *
 * El orden importa y no es casual: **primero se guarda la cita, después se manda el correo**. La
 * cita ya está a salvo cuando el envío empieza, así que un correo que falla no puede arrastrarla
 * (RF-19). Y `enviarConfirmacionDeCita` nunca lanza errores, así que tampoco hay nada que atajar
 * acá.
 */
export async function crearCitaYConfirmar({
  base,
  enviador,
  clienteId,
  servicioId,
  proveedorId,
  inicio,
  ahora,
}) {
  const resultado = crearCita({ base, clienteId, servicioId, proveedorId, inicio, ahora })

  if (resultado.ok) {
    await enviarConfirmacionDeCita({ base, enviador, citaId: resultado.cita.id, ahora })
  }

  return resultado
}

/**
 * La fecha de la **primera** cita de un cliente, escrita `2026-09-03`, o `null` si todavía no tuvo
 * ninguna. Es de donde sale el «desde cuándo es cliente» de la sección «Usuario» (pieza 10).
 *
 * Cuenta **todas** las citas, sin mirar su estado: si la primera se canceló, esa persona ya era
 * cliente ese día igual. Y nada se borra (RN-15), así que la primera siempre está.
 */
export function primeraCitaDelCliente({ base, clienteId }) {
  const fila = base
    .prepare("SELECT MIN(inicio) AS primera FROM cita WHERE cliente_id = ?")
    .get(clienteId)

  if (!fila?.primera) return null

  // Del momento completo solo interesa el día: «cliente desde el 3 de setiembre», no «desde las 10».
  return fila.primera.slice(0, 10)
}

/**
 * Las citas de un cliente, ordenadas por su fecha de inicio.
 *
 * Devuelve los **nombres** del servicio y del proveedor, no sus números: la pantalla muestra «Masaje
 * relajante con Ana», y quien la dibuja no tiene por qué volver a preguntar quién es el proveedor 2.
 *
 * No filtra por estado. En esta pieza da igual —todas son activas, porque nada las cancela ni las
 * cierra todavía—, pero las piezas 5 y 8 necesitan que las canceladas y las cerradas también
 * salgan. La razón completa está en `DISENO.md`, «Decisiones tomadas al construir la pieza 3».
 */
export function citasDelCliente({ base, clienteId }) {
  return base
    .prepare(
      `SELECT cita.id, servicio.nombre AS servicio, proveedor.nombre AS proveedor,
              cita.inicio, cita.estado
         FROM cita
         JOIN servicio  ON servicio.id  = cita.servicio_id
         JOIN proveedor ON proveedor.id = cita.proveedor_id
        WHERE cita.cliente_id = ?
        ORDER BY cita.inicio`,
    )
    .all(clienteId)
}
