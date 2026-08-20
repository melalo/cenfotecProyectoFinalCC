// Los dos endpoints de la pieza 3: reservar un horario y ver mis citas.
//
// El contrato (qué recibe cada uno y qué devuelve) está en el bloque «Produce» de la pieza 3 de
// `PLAN.md`, y acá se cumple tal cual.
//
// Este archivo **no decide nada de negocio**: lee el pedido, comprueba que venga bien escrito, le
// pregunta a `servidor/reservas.js`, y traduce la respuesta a un número de HTTP. Toda la regla vive
// allá, y la de disponibilidad un paso más allá todavía, en `servidor/disponibilidad.js`.

import { Router } from "express"

import { eseProveedorAtiendeEseServicio } from "../catalogo.js"
import { citasDelCliente, crearCitaYConfirmar } from "../reservas.js"
import { crearGuardiaDeCliente } from "../sesion.js"
import { inicioEstaBienEscrito } from "../tiempo.js"

/** Qué número de HTTP le toca a cada motivo de rechazo que devuelve `crearCita`. */
const NUMERO_DE_CADA_RECHAZO = {
  // 409 es «conflicto»: el horario existe, pero el estado del sistema no permite tomarlo.
  horario_no_disponible: 409,
  // 422 es «entendí el pedido pero no lo puedo procesar»: la fecha misma es la que no sirve.
  mismo_dia: 422,
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
  rutas.get("/citas", exigirCliente, (pedido, respuesta) => {
    return respuesta.status(200).json(citasDelCliente({ base, clienteId: pedido.clienteId }))
  })

  return rutas
}
