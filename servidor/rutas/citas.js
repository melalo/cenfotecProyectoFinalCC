// Los endpoints de las citas: reservar un horario, ver mis citas (pieza 3), cancelar una y moverla
// de horario (pieza 5).
//
// El contrato (qué recibe cada uno y qué devuelve) está en los bloques «Produce» de las piezas 3 y 5
// de `PLAN.md`, y acá se cumple tal cual.
//
// Este archivo **no decide nada de negocio**: lee el pedido, comprueba que venga bien escrito, le
// pregunta a `servidor/reservas.js`, y traduce la respuesta a un número de HTTP. Toda la regla vive
// allá, y la de disponibilidad un paso más allá todavía, en `servidor/disponibilidad.js`.

import { Router } from "express"

import { eseProveedorAtiendeEseServicio } from "../catalogo.js"
import { calcularDisponibilidad } from "../disponibilidad.js"
import { buscarCitaDelCodigo } from "../enlaces-de-cita.js"
import { eseClienteExiste } from "../personal.js"
import { mandarRecordatoriosPendientes } from "../recordatorios.js"
import {
  cancelarCita,
  citasDelCliente,
  crearCitaYConfirmar,
  reagendarCitaYConfirmar,
  QUIEN_CLIENTE,
  QUIEN_PERSONAL,
} from "../reservas.js"
import { crearGuardiaDeCliente, crearGuardiaDeClienteOPersonal } from "../sesion.js"
import { inicioEstaBienEscrito, mesEstaBienEscrito } from "../tiempo.js"

/**
 * Qué número de HTTP le toca a cada motivo de rechazo que devuelven las funciones de `reservas.js`.
 *
 * Está en un solo lugar para los cuatro endpoints: si un motivo saliera con `409` desde uno y con
 * `422` desde otro, la pantalla tendría que aprender dos idiomas para el mismo problema.
 */
const NUMERO_DE_CADA_RECHAZO = {
  // 409 es «conflicto»: la cosa existe, pero el estado del sistema no permite lo que se pide.
  horario_no_disponible: 409,
  cita_no_activa: 409,
  // 422 es «entendí el pedido pero no lo puedo procesar»: la fecha misma es la que no sirve.
  mismo_dia: 422,
  // Lo mismo, con el otro motivo: Personal sí puede agendar para hoy (RN-25), pero no un horario que
  // ya arrancó. Es un motivo aparte de `mismo_dia` porque el mensaje tiene que ser otro — a Personal
  // no se le puede decir «llamá al negocio».
  horario_ya_empezo: 422,
  // La ventana de las 4 horas (RN-5, CA-3). Es 422 y no 403 porque no es un problema de permisos:
  // la cita es suya y la cuenta es la correcta — lo que no sirve es **el momento** en que lo pide.
  ventana_de_cancelacion: 422,
  // La cita ya ocurrió, así que no la cambia nadie: tampoco Personal (RN-26, pieza 8). Es 422 por la
  // misma razón que la de arriba —el problema es el momento, no el permiso— y **es un motivo aparte
  // a propósito**: hasta el 2026-08-24 este caso se contestaba `ventana_de_cancelacion`, que era
  // cierto como cuenta («faltan −22 horas, o sea menos de 4») y falso como explicación. Lo único que
  // se puede hacer con una cita pasada es cerrarla, por `PATCH /api/personal/citas/:citaId/cierre`.
  ya_paso: 422,
  // 404 también para la cita de otra persona, a propósito: ver `buscarCitaParaCambiar`.
  cita_no_encontrada: 404,
}

/**
 * En qué cabecera del pedido viaja la clave del disparador del recordatorio.
 *
 * Se escribe una sola vez acá y la tarea de GitHub la copia de este nombre. Empieza con `x-` porque
 * es la convención para las cabeceras que no son parte del estándar de HTTP.
 */
const CABECERA_DEL_SECRETO = "x-recordatorios-secreto"

export function crearRutasDeCitas({
  base,
  sesiones,
  reloj,
  enviador,
  direccionPublica,
  recordatoriosSecreto,
}) {
  const rutas = Router()

  // Los guardias viven en `servidor/sesion.js`: desde la pieza 10 los usan varios grupos de
  // endpoints, y una regla escrita dos veces es una regla que se puede desincronizar.
  //
  // Son dos distintos y la diferencia importa. **«Mis citas» es solo del cliente**: devuelve las
  // citas de quien está en sesión, y Personal no tiene citas propias — las de un cliente las ve por
  // `/api/personal/clientes/:clienteId/citas`. **Reservar, cancelar y mover las abren los dos**,
  // porque son las mismas tres acciones y la única diferencia es quién las pide (RN-6, RN-13).
  const exigirCliente = crearGuardiaDeCliente(sesiones, base)
  const exigirClienteOPersonal = crearGuardiaDeClienteOPersonal(sesiones, base)

  /** Quién está pidiendo, en el vocabulario de `reservas.js`. */
  function quienPide(pedido) {
    return pedido.esPersonal ? QUIEN_PERSONAL : QUIEN_CLIENTE
  }

  // RF-8 y RF-9: reservar un horario disponible. Desde la pieza 7 también RF-16: Personal reserva en
  // nombre de quien llama, y entonces el pedido trae además `clienteId`.
  rutas.post("/citas", exigirClienteOPersonal, async (pedido, respuesta) => {
    const servicioId = Number(pedido.body?.servicioId)
    const proveedorId = Number(pedido.body?.proveedorId)
    const inicio = pedido.body?.inicio

    // **Para quién es la cita.** Un cliente reserva para sí mismo, y el `clienteId` que venga en el
    // pedido **ni se mira**: si se mirara, cualquiera podría reservarle una cita a cualquiera. Solo
    // Personal dice para quién, y está obligado a decirlo.
    const clienteId = pedido.esPersonal ? Number(pedido.body?.clienteId) : pedido.clienteId

    // El momento tiene que venir escrito exactamente como lo escribe el proyecto
    // (`2026-09-02T10:00:00-06:00`). Nada se interpreta: lo que no calce se rechaza acá, antes de
    // que llegue a tocar la base.
    if (!servicioId || !proveedorId || !inicioEstaBienEscrito(inicio) || !clienteId) {
      return respuesta.status(422).json({ error: "datos_incompletos" })
    }

    if (!(await eseProveedorAtiendeEseServicio(base, servicioId, proveedorId))) {
      return respuesta.status(404).json({ error: "servicio_o_proveedor_no_encontrado" })
    }

    // Solo hace falta preguntarlo cuando reserva Personal: el `clienteId` de un cliente sale de su
    // propia sesión, y esa cuenta existe por definición.
    if (pedido.esPersonal && !(await eseClienteExiste(base, clienteId))) {
      return respuesta.status(404).json({ error: "cliente_no_encontrado" })
    }

    // Se espera a que el correo salga antes de contestar (decisión de la estudiante el
    // 2026-08-19). La cita ya está guardada para cuando el envío empieza, así que RF-19 se cumple
    // igual: si el correo falla, queda registrado como fallido y la cita sigue siendo válida. Lo
    // que se gana esperando es que el resultado del envío se pueda comprobar; contestando primero,
    // toda prueba del correo tendría que adivinar cuánto esperar, y una prueba así falla sola.
    //
    // El correo le llega **al cliente**, no a Personal, y eso no hay que pedirlo: `crearCitaYConfirmar`
    // lo arma leyendo la cita ya guardada, y la cita es del cliente (comprobación 2 del plan).
    const resultado = await crearCitaYConfirmar({
      base,
      enviador,
      clienteId,
      servicioId,
      proveedorId,
      inicio,
      ahora: reloj(),
      // Lo único que hace que la cita quede con canal `asistida` (RN-12). Vacío cuando reserva el
      // cliente por su cuenta.
      personalIdCreador: pedido.esPersonal ? pedido.personalId : null,
      direccionPublica,
    })

    if (!resultado.ok) {
      return respuesta.status(NUMERO_DE_CADA_RECHAZO[resultado.motivo]).json({ error: resultado.motivo })
    }

    return respuesta.status(201).json(resultado.cita)
  })

  // Las citas del cliente en sesión, que es lo que la sección «Mis citas» muestra.
  //
  // Desde la pieza 5 recibe `ahora`, porque cada cita viene con si se puede cancelar o mover, y eso
  // depende de qué hora es.
  rutas.get("/citas", exigirCliente, async (pedido, respuesta) => {
    return respuesta
      .status(200)
      .json(await citasDelCliente({ base, clienteId: pedido.clienteId, ahora: reloj() }))
  })

  // RF-13: cancelar una cita. El horario queda libre en el mismo instante (RN-7), y la cita no se
  // borra: cambia de estado (RN-15).
  //
  // Desde la pieza 7 también RF-18: **con la sesión de Personal la ventana de las 4 horas no
  // aplica** (RN-6). Acá no hay ningún `if` que diga eso: lo único que cambia es el `quien` que baja
  // a `reservas.js`, y la regla vive allá, escrita una sola vez. Eso es CA-3.
  rutas.delete("/citas/:citaId", exigirClienteOPersonal, async (pedido, respuesta) => {
    const citaId = Number(pedido.params.citaId)

    // Un `:citaId` que no es un número no es una cita que exista: se contesta lo mismo que para una
    // que no está, sin llegar a preguntarle a la base.
    if (!Number.isInteger(citaId) || citaId <= 0) {
      return respuesta.status(404).json({ error: "cita_no_encontrada" })
    }

    const resultado = await cancelarCita({
      base,
      citaId,
      // Vacío cuando cancela Personal, y eso es lo que le dice a `buscarCitaParaCambiar` que puede
      // tocar la cita de cualquiera. Para un cliente es su propio número, y la cita de otra persona
      // ni se encuentra.
      clienteId: pedido.clienteId,
      quien: quienPide(pedido),
      ahora: reloj(),
    })

    if (!resultado.ok) {
      return respuesta.status(NUMERO_DE_CADA_RECHAZO[resultado.motivo]).json({ error: resultado.motivo })
    }

    // 204 es «lo hice y no tengo nada que contarte». La pantalla ya sabe qué cita canceló, así que
    // devolverle la cita entera sería mandar algo que nadie va a leer.
    return respuesta.status(204).end()
  })

  // RF-14: mover una cita a otro horario. **Lo único que se lee del cuerpo es `inicio`**: el servicio
  // y el proveedor no se pueden cambiar reagendando (RN-18), y la manera de garantizarlo es no
  // mirarlos siquiera. Aunque el pedido los traiga, acá no existen.
  //
  // Desde la pieza 7 la abren los dos, con la misma diferencia que cancelar: Personal no tiene
  // ventana de 4 horas (RF-18, RN-6), pero **sí tiene todas las demás reglas** — el horario nuevo se
  // comprueba con `revisarHorario`, que no sabe quién pregunta, así que tampoco puede aterrizar en un
  // feriado, un domingo, el almuerzo ni el día de hoy (RN-13).
  rutas.patch("/citas/:citaId", exigirClienteOPersonal, async (pedido, respuesta) => {
    const citaId = Number(pedido.params.citaId)
    const inicio = pedido.body?.inicio

    if (!Number.isInteger(citaId) || citaId <= 0) {
      return respuesta.status(404).json({ error: "cita_no_encontrada" })
    }

    // El mismo rigor que al reservar: el momento tiene que venir escrito exactamente como lo escribe
    // el proyecto (`2026-09-02T10:00:00-06:00`). Nada se interpreta.
    if (!inicioEstaBienEscrito(inicio)) {
      return respuesta.status(422).json({ error: "datos_incompletos" })
    }

    // Se espera el correo antes de contestar, por la misma razón que al reservar: así el resultado
    // del envío se puede comprobar. La cita ya está movida cuando el envío empieza, así que RF-19 se
    // cumple igual.
    const resultado = await reagendarCitaYConfirmar({
      base,
      enviador,
      citaId,
      clienteId: pedido.clienteId,
      quien: quienPide(pedido),
      inicio,
      ahora: reloj(),
      direccionPublica,
    })

    if (!resultado.ok) {
      return respuesta.status(NUMERO_DE_CADA_RECHAZO[resultado.motivo]).json({ error: resultado.motivo })
    }

    return respuesta.status(200).json(resultado.cita)
  })

  // ───────────────────────────────────────────────────────────────────────────────────────────
  // EL ENLACE DEL CORREO (pieza 6: RF-11 desde el 2026-09-05, y RF-12)
  //
  // Estos cuatro **no llevan guardia de sesión**, y es la única parte del proyecto donde algo de
  // una cita se abre sin haber entrado. La estudiante lo decidió el 2026-09-07 y la razón está
  // escrita en `servidor/enlaces-de-cita.js`: quien abre el correo en el teléfono no tiene la
  // sesión puesta, y mandarlo a acordarse de su contraseña es mandarlo a llamar por teléfono con
  // más pasos.
  //
  // **Lo que reemplaza al guardia es el código**, y por eso son cuatro endpoints angostos en vez
  // de una manera de entrar a los de arriba: el código alcanza **una** cita y nada más. No abre
  // sesión, así que con él no hay forma de pedir «mis citas» ni de nombrar otra cita.
  //
  // ⚠️ **Y no repiten ninguna regla de negocio.** Cada uno resuelve el código, saca el `clienteId`
  // **de la cita** y llama a la misma función que usa el endpoint con sesión, con
  // `quien = QUIEN_CLIENTE`. O sea que la ventana de las 4 horas (RN-5), la cita pasada (RN-26) y
  // el horario ocupado (RN-1) valen igual, sin que acá haya un solo `if` que lo diga. Si mañana la
  // ventana pasa de 4 horas a 2, estos cuatro se enteran solos.
  // ───────────────────────────────────────────────────────────────────────────────────────────

  /**
   * Resuelve el código del enlace, o contesta `404` y devuelve `null`.
   *
   * Está escrito una vez y lo usan los cuatro: es el «guardia» de esta puerta, y por la misma razón
   * por la que los guardias de verdad viven en `servidor/sesion.js` no puede estar copiado.
   *
   * **Contesta `404` y no `401`**, y no es un descuido: un `401` diría «faltó la credencial», y acá
   * no hay ninguna credencial que falte — hay una cita que no aparece. Es la misma decisión que toma
   * la pieza 9 al no distinguir «ese código no existe» de «ese código existía».
   */
  async function citaDelEnlace(pedido, respuesta) {
    const encontrada = await buscarCitaDelCodigo({ base, codigo: pedido.params.codigo })

    if (!encontrada) {
      respuesta.status(404).json({ error: "cita_no_encontrada" })
      return null
    }

    return encontrada
  }

  // La cita que el enlace abre, con si se puede cambiar y por qué no — los mismos dos campos que
  // recibe «Mis citas» desde la pieza 5, para que la pantalla no tenga que aprender otro idioma ni
  // contar las 4 horas por su cuenta.
  rutas.get("/citas/por-enlace/:codigo", async (pedido, respuesta) => {
    const encontrada = await citaDelEnlace(pedido, respuesta)
    if (!encontrada) return

    // Se piden las citas del cliente y se saca la que el código nombra, en vez de escribir otra
    // consulta: así esta respuesta y la de «Mis citas» salen de la **misma** función, con los mismos
    // campos calculados de la misma manera.
    const suyas = await citasDelCliente({
      base,
      clienteId: encontrada.clienteId,
      ahora: reloj(),
    })

    return respuesta.status(200).json(suyas.find((cita) => cita.id === encontrada.citaId))
  })

  // Los horarios libres para mover **esa** cita. Existe porque `/api/disponibilidad` exige sesión, y
  // sin esto el enlace de reagendar no tendría nada que ofrecerle a quien abre el correo.
  //
  // **El servicio y el proveedor salen de la cita, no del pedido.** Es lo mismo que hace el reagendar
  // de arriba al no mirarlos (RN-18), y acá tiene además el efecto de que el código no sirve para
  // espiar la agenda de otro proveedor.
  rutas.get("/citas/por-enlace/:codigo/disponibilidad", async (pedido, respuesta) => {
    const encontrada = await citaDelEnlace(pedido, respuesta)
    if (!encontrada) return

    const mes = pedido.query.mes
    if (!mesEstaBienEscrito(mes)) {
      return respuesta.status(422).json({ error: "datos_incompletos" })
    }

    const cita = await base.uno("SELECT proveedor_id FROM cita WHERE id = ?", encontrada.citaId)

    return respuesta.status(200).json(
      await calcularDisponibilidad({
        base,
        proveedorId: cita.proveedor_id,
        mes,
        ahora: reloj(),
        // Quien viene del correo es el cliente, así que ve el calendario del cliente: el día de hoy
        // no le ofrece nada (RN-4, CA-2). Decirle `QUIEN_PERSONAL` le mostraría horarios que el
        // reagendar de acá abajo va a rechazar.
        quien: QUIEN_CLIENTE,
      }),
    )
  })

  // Cancelar desde el enlace (RF-13). Es la comprobación 3 del plan de la pieza 6.
  rutas.delete("/citas/por-enlace/:codigo", async (pedido, respuesta) => {
    const encontrada = await citaDelEnlace(pedido, respuesta)
    if (!encontrada) return

    const resultado = await cancelarCita({
      base,
      citaId: encontrada.citaId,
      // El número sale **de la cita**, nunca del pedido: es lo que hace que el código no pueda
      // alcanzar ninguna otra.
      clienteId: encontrada.clienteId,
      // Queda `cancelada_por = cliente`, que es la verdad: el enlace llegó a su correo. Decir
      // `personal` sería falso, y además saltearía la ventana de las 4 horas (RN-6).
      quien: QUIEN_CLIENTE,
      ahora: reloj(),
    })

    if (!resultado.ok) {
      return respuesta.status(NUMERO_DE_CADA_RECHAZO[resultado.motivo]).json({ error: resultado.motivo })
    }

    return respuesta.status(204).end()
  })

  // Mover la cita desde el enlace (RF-14). Manda la confirmación con la fecha y la hora nuevas, y
  // con **el mismo** enlace: el código es de la cita y no del correo.
  rutas.patch("/citas/por-enlace/:codigo", async (pedido, respuesta) => {
    const encontrada = await citaDelEnlace(pedido, respuesta)
    if (!encontrada) return

    const inicio = pedido.body?.inicio
    if (!inicioEstaBienEscrito(inicio)) {
      return respuesta.status(422).json({ error: "datos_incompletos" })
    }

    const resultado = await reagendarCitaYConfirmar({
      base,
      enviador,
      citaId: encontrada.citaId,
      clienteId: encontrada.clienteId,
      quien: QUIEN_CLIENTE,
      inicio,
      ahora: reloj(),
      direccionPublica,
    })

    if (!resultado.ok) {
      return respuesta.status(NUMERO_DE_CADA_RECHAZO[resultado.motivo]).json({ error: resultado.motivo })
    }

    return respuesta.status(200).json(resultado.cita)
  })

  // ───────────────────────────────────────────────────────────────────────────────────────────
  // EL DISPARADOR DEL RECORDATORIO (pieza 6, RF-12)
  //
  // Es el único endpoint de todo el proyecto que **no lo llama una persona**: lo llama la tarea
  // programada de `.github/workflows/recordatorios.yml`, cada cierto tiempo, sin que nadie esté
  // mirando. De ahí salen sus tres particularidades:
  //
  //   - **No lleva guardia de sesión**, porque quien llama no tiene cuenta. Lo que lo protege es una
  //     clave en una cabecera, y `401` es el número correcto: «no sé quién sos».
  //   - **Contesta con números** (`{revisadas, enviados}`) y no con `204`. Nadie va a ver esta
  //     respuesta en una pantalla: va a quedar en el registro de la corrida de GitHub, y ahí esos
  //     dos números son lo único que cuenta qué pasó.
  //   - **Es `POST` aunque parezca una consulta**, porque cambia cosas: manda correos y escribe
  //     filas. Un `GET` invitaría a que cualquier cosa que recorra direcciones lo dispare.
  //
  // **Va en este archivo y no en uno propio** porque es un endpoint de las citas: la regla que
  // ejecuta vive en `servidor/recordatorios.js`, y acá solo se comprueba la clave y se traduce el
  // resultado a HTTP — lo mismo que hacen los cinco de arriba.
  // ───────────────────────────────────────────────────────────────────────────────────────────
  rutas.post("/tareas/recordatorios", async (pedido, respuesta) => {
    // ⚠️ **Sin clave configurada queda cerrado para todos, no abierto para todos.** Es la primera
    // condición y es la que importa: sin ella, una aplicación desplegada sin cargar
    // `RECORDATORIOS_SECRETO` compararía «lo que vino» contra «nada» y dejaría entrar a cualquiera
    // que tampoco mandara nada. De los dos fallos posibles, éste es el único aceptable: sin la
    // variable no salen recordatorios **y eso se nota**; abierto no se nota hasta que alguien lo usa.
    if (!recordatoriosSecreto) {
      return respuesta.status(401).json({ error: "sin_clave" })
    }

    if (pedido.get(CABECERA_DEL_SECRETO) !== recordatoriosSecreto) {
      return respuesta.status(401).json({ error: "sin_clave" })
    }

    return respuesta.status(200).json(
      await mandarRecordatoriosPendientes({
        base,
        ahora: reloj(),
        enviador,
        direccionPublica,
      }),
    )
  })

  return rutas
}
