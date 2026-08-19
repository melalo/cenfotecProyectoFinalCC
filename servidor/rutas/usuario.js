// Los dos endpoints de la pieza 10: ver mi información y corregirla.
//
// El contrato está en el bloque «Produce» de la pieza 10 de `PLAN.md`, y acá se cumple tal cual.
//
// Este archivo no decide nada: lee el pedido, le pregunta a `servidor/clientes.js` —que es donde
// viven las comprobaciones— y traduce la respuesta a un número de HTTP. El «desde cuándo es cliente»
// se lo pide a `servidor/reservas.js`, porque ese dato no está en la cuenta: es la fecha de la
// primera cita.

import { Router } from "express"

import { guardarDatosDelCliente, informacionDelCliente } from "../clientes.js"
import { primeraCitaDelCliente } from "../reservas.js"
import { crearGuardiaDeCliente } from "../sesion.js"

/** Qué número de HTTP le toca a cada motivo de rechazo. Los tres son «entendí el pedido pero el
 *  dato no sirve», que es 422. */
const NUMERO_DE_CADA_RECHAZO = {
  nombre_invalido: 422,
  telefono_invalido: 422,
  fecha_nacimiento_invalida: 422,
}

export function crearRutasDeUsuario({ base, sesiones, reloj }) {
  const rutas = Router()
  const exigirCliente = crearGuardiaDeCliente(sesiones)

  // RF-22: lo que la sección «Usuario» muestra.
  rutas.get("/mi-informacion", exigirCliente, (pedido, respuesta) => {
    return respuesta.status(200).json(armarLaRespuesta(base, pedido.clienteId, reloj()))
  })

  // RF-22, la otra mitad: completar o corregir el nombre, el teléfono y la fecha de nacimiento.
  rutas.put("/mi-informacion", exigirCliente, (pedido, respuesta) => {
    const resultado = guardarDatosDelCliente({
      base,
      clienteId: pedido.clienteId,
      datos: pedido.body,
      ahora: reloj(),
    })

    if (!resultado.ok) {
      return respuesta
        .status(NUMERO_DE_CADA_RECHAZO[resultado.motivo])
        .json({ error: resultado.motivo })
    }

    // Se devuelve lo mismo que devolvería el GET, ya guardado: así la pantalla se pinta con lo que
    // quedó en la base y no con lo que ella creía que había mandado. El teléfono, por ejemplo,
    // vuelve normalizado con su guión.
    return respuesta.status(200).json(armarLaRespuesta(base, pedido.clienteId, reloj()))
  })

  return rutas
}

/**
 * La información completa del cliente: sus datos de cuenta, y desde cuándo es cliente.
 *
 * Son dos preguntas a dos lugares distintos a propósito. Los datos de la cuenta son del componente
 * **Autenticación**, cuyo límite en `DISENO.md` dice que «no sabe nada de citas»; la fecha de la
 * primera cita es del componente **Reservas**. Juntarlas es trabajo de esta ruta, no de ninguno de
 * los dos: así ninguno de ellos tiene que aprender del otro.
 */
function armarLaRespuesta(base, clienteId, ahora) {
  return {
    ...informacionDelCliente({ base, clienteId, ahora }),
    clienteDesde: primeraCitaDelCliente({ base, clienteId }),
  }
}
