// Las puertas que **solo** abre la cuenta del negocio: crearle la cuenta a quien llama, buscarlo
// entre los que ya existen, y ver sus citas para poder cancelarlas o moverlas (pieza 7).
//
// El contrato está en el bloque «Produce» de la pieza 7 de `PLAN.md`, y acá se cumple tal cual.
//
// **Todas empiezan con `/api/personal/` a propósito.** Así el permiso se lee de un vistazo en la
// dirección, y no queda la tentación de agregarle un `clienteId` a las puertas del cliente — que
// sería la manera de que un día alguien pudiera ver las citas de otra persona.
//
// Este archivo no decide nada de negocio: lee el pedido, le pregunta a `servidor/personal.js` o a
// `servidor/reservas.js`, y traduce la respuesta a un número de HTTP.

import { Router } from "express"

import { buscarClientes, crearClienteDesdePersonal, eseClienteExiste } from "../personal.js"
import { citasDelCliente, QUIEN_PERSONAL } from "../reservas.js"
import { crearGuardiaDePersonal } from "../sesion.js"

/** Qué número de HTTP le toca a cada motivo de rechazo de `servidor/personal.js`. */
const NUMERO_DE_CADA_RECHAZO = {
  // 422 es «entendí el pedido pero el dato no sirve».
  datos_incompletos: 422,
  correo_invalido: 422,
  // 409 es «conflicto»: la cuenta existe y no se puede crear otra con el mismo correo.
  correo_ya_registrado: 409,
}

export function crearRutasDePersonal({ base, sesiones, reloj }) {
  const rutas = Router()

  // El guardia vive en `servidor/sesion.js`, al lado de los otros dos: una regla de permiso escrita
  // en dos lados es una regla que se puede desincronizar.
  const exigirPersonal = crearGuardiaDePersonal(sesiones)

  // RF-17: Personal le crea la cuenta a quien llama, con una contraseña temporal (RN-11).
  //
  // La contraseña temporal **viaja en la respuesta y en ningún otro lado**: es la única vez que
  // existe fuera de la cabeza de quien la dicte. En la base solo queda su huella cifrada.
  rutas.post("/personal/clientes", exigirPersonal, (pedido, respuesta) => {
    const resultado = crearClienteDesdePersonal({
      base,
      nombre: pedido.body?.nombre,
      correo: pedido.body?.correo,
    })

    if (!resultado.ok) {
      return respuesta
        .status(NUMERO_DE_CADA_RECHAZO[resultado.motivo])
        .json({ error: resultado.motivo })
    }

    return respuesta.status(201).json(resultado.cliente)
  })

  // Buscar a quien llama entre los clientes que ya tienen cuenta.
  //
  // Con menos de dos letras devuelve la lista vacía, y quién decide eso es `servidor/personal.js`,
  // no esta ruta: es una regla, y las reglas no viven en los archivos de rutas.
  rutas.get("/personal/clientes", exigirPersonal, (pedido, respuesta) => {
    return respuesta.status(200).json(buscarClientes({ base, busqueda: pedido.query.busqueda }))
  })

  // Las citas del cliente que Personal está atendiendo, para poder cancelarlas o moverlas (RF-18).
  //
  // Es la misma función que arma la lista del cliente, preguntada con `QUIEN_PERSONAL`: así una cita
  // que empieza dentro de dos horas le llega a Personal con `sePuedeCambiar: true` (RN-6) mientras al
  // cliente le llega en `false`. **La regla no está escrita dos veces**: es la misma, preguntada por
  // dos actores distintos, y eso es exactamente CA-3.
  rutas.get("/personal/clientes/:clienteId/citas", exigirPersonal, (pedido, respuesta) => {
    const clienteId = Number(pedido.params.clienteId)

    if (!eseClienteExiste(base, clienteId)) {
      return respuesta.status(404).json({ error: "cliente_no_encontrado" })
    }

    return respuesta
      .status(200)
      .json(citasDelCliente({ base, clienteId, ahora: reloj(), quien: QUIEN_PERSONAL }))
  })

  return rutas
}
