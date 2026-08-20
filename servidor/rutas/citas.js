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
import {
  cancelarCita,
  citasDelCliente,
  crearCitaYConfirmar,
  reagendarCitaYConfirmar,
  QUIEN_CLIENTE,
} from "../reservas.js"
import { crearGuardiaDeCliente } from "../sesion.js"
import { inicioEstaBienEscrito } from "../tiempo.js"

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
  // La ventana de las 4 horas (RN-5, CA-3). Es 422 y no 403 porque no es un problema de permisos:
  // la cita es suya y la cuenta es la correcta — lo que no sirve es **el momento** en que lo pide.
  ventana_de_cancelacion: 422,
  // 404 también para la cita de otra persona, a propósito: ver `buscarCitaParaCambiar`.
  cita_no_encontrada: 404,
}

export function crearRutasDeCitas({ base, sesiones, reloj, enviador }) {
  const rutas = Router()

  // El guardia vive en `servidor/sesion.js`: desde la pieza 10 lo usan dos grupos de endpoints, y
  // una regla escrita dos veces es una regla que se puede desincronizar.
  const exigirCliente = crearGuardiaDeCliente(sesiones)

  // RF-8 y RF-9: reservar un horario disponible.
  rutas.post("/citas", exigirCliente, async (pedido, respuesta) => {
    const servicioId = Number(pedido.body?.servicioId)
    const proveedorId = Number(pedido.body?.proveedorId)
    const inicio = pedido.body?.inicio

    // El momento tiene que venir escrito exactamente como lo escribe el proyecto
    // (`2026-09-02T10:00:00-06:00`). Nada se interpreta: lo que no calce se rechaza acá, antes de
    // que llegue a tocar la base.
    if (!servicioId || !proveedorId || !inicioEstaBienEscrito(inicio)) {
      return respuesta.status(422).json({ error: "datos_incompletos" })
    }

    if (!eseProveedorAtiendeEseServicio(base, servicioId, proveedorId)) {
      return respuesta.status(404).json({ error: "servicio_o_proveedor_no_encontrado" })
    }

    // Se espera a que el correo salga antes de contestar (decisión de la estudiante el
    // 2026-08-19). La cita ya está guardada para cuando el envío empieza, así que RF-19 se cumple
    // igual: si el correo falla, queda registrado como fallido y la cita sigue siendo válida. Lo
    // que se gana esperando es que el resultado del envío se pueda comprobar; contestando primero,
    // toda prueba del correo tendría que adivinar cuánto esperar, y una prueba así falla sola.
    const resultado = await crearCitaYConfirmar({
      base,
      enviador,
      clienteId: pedido.clienteId,
      servicioId,
      proveedorId,
      inicio,
      ahora: reloj(),
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
  rutas.get("/citas", exigirCliente, (pedido, respuesta) => {
    return respuesta
      .status(200)
      .json(citasDelCliente({ base, clienteId: pedido.clienteId, ahora: reloj() }))
  })

  // RF-13: cancelar mi cita. El horario queda libre en el mismo instante (RN-7), y la cita no se
  // borra: cambia de estado (RN-15).
  rutas.delete("/citas/:citaId", exigirCliente, (pedido, respuesta) => {
    const citaId = Number(pedido.params.citaId)

    // Un `:citaId` que no es un número no es una cita que exista: se contesta lo mismo que para una
    // que no está, sin llegar a preguntarle a la base.
    if (!Number.isInteger(citaId) || citaId <= 0) {
      return respuesta.status(404).json({ error: "cita_no_encontrada" })
    }

    const resultado = cancelarCita({
      base,
      citaId,
      clienteId: pedido.clienteId,
      // Quien llega por acá es siempre un cliente: el guardia no deja pasar a nadie más. Personal
      // cancela por su propia pantalla, que es la pieza 7, y ahí este valor va a ser el otro.
      quien: QUIEN_CLIENTE,
      ahora: reloj(),
    })

    if (!resultado.ok) {
      return respuesta.status(NUMERO_DE_CADA_RECHAZO[resultado.motivo]).json({ error: resultado.motivo })
    }

    // 204 es «lo hice y no tengo nada que contarte». La pantalla ya sabe qué cita canceló, así que
    // devolverle la cita entera sería mandar algo que nadie va a leer.
    return respuesta.status(204).end()
  })

  // RF-14: mover mi cita a otro horario. **Lo único que se lee del cuerpo es `inicio`**: el servicio
  // y el proveedor no se pueden cambiar reagendando (RN-18), y la manera de garantizarlo es no
  // mirarlos siquiera. Aunque el pedido los traiga, acá no existen.
  rutas.patch("/citas/:citaId", exigirCliente, async (pedido, respuesta) => {
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
      quien: QUIEN_CLIENTE,
      inicio,
      ahora: reloj(),
    })

    if (!resultado.ok) {
      return respuesta.status(NUMERO_DE_CADA_RECHAZO[resultado.motivo]).json({ error: resultado.motivo })
    }

    return respuesta.status(200).json(resultado.cita)
  })

  return rutas
}
