// El recordatorio de 24 horas: a qué citas les toca y cómo se les manda (RF-12, RN-20).
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// LO QUE ESTA PIEZA AGREGA, Y LO QUE NO
//
// **No agrega un servicio nuevo.** El correo ya funciona desde la pieza 4 y está comprobado contra
// el servicio de verdad. Lo que esta pieza agrega es **un momento**: el instante en que se manda un
// correo que el sistema ya sabía mandar.
//
// Y agrega la única cosa de todo el proyecto que **pasa sin que nadie la pida**. Todo lo demás
// arranca porque una persona tocó un botón; esto arranca porque el reloj llegó a cierta hora. Eso
// tiene una consecuencia de diseño que está escrita abajo, en el criterio de «ya se le mandó».
//
// ── ESTE ARCHIVO NO SABE DE HTTP ─────────────────────────────────────────────────────────────
//
// Recibe la base, el momento actual y el enviador, y contesta. Quién tiene permiso de dispararlo lo
// decide el endpoint (`servidor/rutas/citas.js`), y con qué frecuencia se dispara lo decide la tarea
// programada (`.github/workflows/recordatorios.yml`). Son tres preguntas distintas y viven en tres
// lugares distintos a propósito: se puede cambiar cada cuánto corre sin tocar la regla, y se puede
// probar la regla sin levantar nada.
// ─────────────────────────────────────────────────────────────────────────────────────────────

import { enviarRecordatorioDeCita } from "./correo.js"
import { ESTADO_ACTIVA } from "./reservas.js"
import { horasEntre, horasHasta, todaviaNoEmpezo } from "./tiempo.js"

/**
 * Cuántas horas antes de la cita sale el recordatorio (RF-12).
 *
 * **El mismo número sirve para las dos reglas de esta pieza**, y no es casualidad: RF-12 dice
 * «24 horas antes» y RN-20 dice «reservadas con menos de 24 horas de anticipación no reciben
 * ninguno». Es el mismo umbral mirado desde los dos lados, así que se escribe una vez. Si mañana el
 * negocio quiere avisar con 48 horas, las dos reglas se mueven juntas — que es lo correcto: avisar
 * con 48 horas de antelación a alguien que reservó hace 30 sería avisarle de algo que acaba de
 * decidir.
 */
export const HORAS_DE_ANTICIPACION = 24

/**
 * Las citas a las que **ahora mismo** les toca el recordatorio.
 *
 * Son las que cumplen las cuatro cosas a la vez:
 *
 *   1. Están **activas**. Una cancelada no recibe nada (comprobación 6), y una ya cerrada tampoco
 *      tendría sentido.
 *   2. **Todavía no empezaron.** Es el borde de abajo, y hay que escribirlo: la ventana se mide con
 *      una distancia, y una cita de la semana pasada tiene una distancia **negativa** —que también
 *      es «menos de 24 horas»—. Sin esta línea, la primera corrida en producción les mandaría un
 *      recordatorio a todas las citas viejas de la base.
 *   3. Empiezan **dentro de las próximas 24 horas**. A 24 h y 10 min todavía no (comprobación 1); a
 *      23 h 50 min sí (comprobación 2).
 *   4. Se reservaron con **24 horas o más de anticipación** (RN-20, comprobación 5).
 *
 * ── POR QUÉ EL FILTRO ESTÁ EN JAVASCRIPT Y NO EN EL `WHERE` ──────────────────────────────────
 *
 * Comparar los momentos en SQL funcionaría, porque todos los momentos de este proyecto se escriben
 * igual y con el mismo desfase. Pero sería **la misma regla escrita dos veces** —una en SQL y otra
 * en `horasHasta`—, con dos bordes que un día pueden dejar de coincidir. Es la misma decisión, con
 * la misma razón, que ya tomó `citasPorCerrar` en la pieza 8; y al volumen de este negocio —unas
 * 2.300 citas al año (RN-15)— traerlas y filtrarlas acá no cuesta nada.
 *
 * ── EL CRITERIO DE «YA SE LE MANDÓ», que el plan fija: existe una fila en `correo_enviado` ─────
 *
 * Lo pregunta el `NOT EXISTS`, y el índice `correo_por_cita` existe justo para esta pregunta.
 *
 * ⚠️ **Tiene una consecuencia que conviene saber, y es a propósito: un recordatorio que falló no se
 * reintenta.** `correo_enviado` guarda los intentos fallidos también (REG-3), así que la fila que
 * dejó la falla es la misma que dice «a ésta ya se le mandó». Es lo que el plan pide con esas
 * palabras, y es la opción segura de las dos: el reintento automático de un correo que se manda solo
 * puede terminar mandándole el mismo aviso cinco veces a la misma persona, y eso se nota más que un
 * aviso que no llegó. A quién no le llegó **se puede averiguar**, que es justamente para lo que la
 * tabla existe: `SELECT * FROM correo_enviado WHERE tipo = 'recordatorio' AND exito = 0`.
 */
export async function citasQueTocanRecordatorio({ base, ahora }) {
  const candidatas = await base.todas(
    `SELECT cita.id, cita.inicio, cita.creada_en
       FROM cita
      WHERE cita.estado = ?
        AND NOT EXISTS (
              SELECT 1
                FROM correo_enviado
               WHERE correo_enviado.cita_id = cita.id
                 AND correo_enviado.tipo = 'recordatorio'
            )
      ORDER BY cita.inicio`,
    ESTADO_ACTIVA,
  )

  return candidatas.filter((cita) => {
    if (!todaviaNoEmpezo(cita.inicio, ahora)) return false
    if (horasHasta(cita.inicio, ahora) > HORAS_DE_ANTICIPACION) return false

    // RN-20. El borde se decide una vez y queda escrito: **con 24 horas justas de anticipación sí
    // recibe**, igual que la ventana de cancelación permite cancelar a 4 horas justas.
    return horasEntre(cita.creada_en, cita.inicio) >= HORAS_DE_ANTICIPACION
  })
}

/**
 * Manda los recordatorios que estén pendientes y devuelve `{ revisadas, enviados }`.
 *
 * `revisadas` es a cuántas les tocaba y `enviados` a cuántas les salió el correo de verdad. Los dos
 * números viajan hasta la respuesta del endpoint, y **que sean dos y no uno es lo que hace útil el
 * registro de la tarea programada**: `{revisadas: 3, enviados: 3}` y `{revisadas: 3, enviados: 0}`
 * son dos situaciones muy distintas que un solo número no distinguiría.
 *
 * ⚠️ **Los correos se mandan afuera de cualquier transacción, y de a uno.** Cada cita se registra por
 * separado con su éxito o su fracaso, así que **una que falla no tumba a las demás**: es la misma
 * regla de la pieza 4 (RF-19), y acá abajo está escrita con un `try` por cita.
 *
 * *Ese `try` se agregó el 2026-09-07, al arreglar un defecto de producción. Antes decía acá que no
 * hacía falta «porque `enviarRecordatorioDeCita` nunca lanza errores» — y era cierto del envío y
 * falso de lo que la pieza 6 le había agregado adentro: conseguir el código del enlace, que escribe
 * en la base. Una confianza así, escrita en un comentario, es exactamente lo que este proyecto trata
 * de no tener.*
 *
 * **Se mandan en serie y no todos a la vez**, aunque en paralelo terminaría antes. Son dos razones:
 * la cuenta gratuita de Resend tiene un límite de correos por segundo, y en serie el orden de las
 * filas de `correo_enviado` es el orden de las citas — que es lo que hace que las pruebas puedan
 * comprobar cuál falló.
 */
export async function mandarRecordatoriosPendientes({ base, ahora, enviador, direccionPublica }) {
  const pendientes = await citasQueTocanRecordatorio({ base, ahora })

  let enviados = 0

  for (const cita of pendientes) {
    // El `try` es la regla del plan escrita en código: **una cita que falla no tumba a las demás**.
    // `enviarRecordatorioDeCita` ya no lanza nada por su cuenta, así que esto no debería saltar
    // nunca — y está igual, porque el día que salte, lo que hay que perder es **un** recordatorio y
    // no los otros veinte. Es la misma razón por la que los correos se mandan afuera de cualquier
    // transacción (RF-19).
    try {
      const salio = await enviarRecordatorioDeCita({
        base,
        enviador,
        citaId: cita.id,
        ahora,
        // Se le pasa **la dirección y no los enlaces ya armados**, y eso cambió el 2026-09-07 al
        // arreglar un defecto de producción: conseguir el código escribe en la base y puede fallar,
        // así que la protección tiene que vivir en un solo lugar —`correo.js`— y no repartida entre
        // quien manda el correo y quien lo arma. Ver `losEnlacesSiSePueden` allá.
        direccionPublica,
      })

      if (salio) enviados += 1
    } catch (falla) {
      console.warn(`Aviso: falló el recordatorio de la cita ${cita.id} — ${falla.message}`)
    }
  }

  return { revisadas: pendientes.length, enviados }
}
