// Las puertas que **solo** abre la cuenta del negocio: crearle la cuenta a quien llama, buscarlo
// entre los que ya existen, ver sus citas para poder cancelarlas o moverlas (pieza 7), y **cerrar
// las citas que ya pasaron** (pieza 8).
//
// El contrato está en los bloques «Produce» de las piezas 7 y 8 de `PLAN.md`, y acá se cumple tal
// cual. Una sola corrección, decidida por la estudiante el 2026-08-24 y anotada en el plan: el
// endpoint de cerrar estaba escrito ahí como `PATCH /api/citas/:citaId/cierre`, de antes de que la
// pieza 7 fijara la convención de este archivo, y se movió bajo `/api/personal/` como todo lo demás
// que solo abre esta cuenta.
//
// **Todas empiezan con `/api/personal/` a propósito.** Así el permiso se lee de un vistazo en la
// dirección, y no queda la tentación de agregarle un `clienteId` a las puertas del cliente — que
// sería la manera de que un día alguien pudiera ver las citas de otra persona.
//
// Este archivo no decide nada de negocio: lee el pedido, le pregunta a `servidor/personal.js` o a
// `servidor/reservas.js`, y traduce la respuesta a un número de HTTP.

import { Router } from "express"

import { buscarClientes, crearClienteDesdePersonal, eseClienteExiste } from "../personal.js"
import {
  cerrarCita,
  citasDelCliente,
  citasPorCerrar,
  CIERRES_VALIDOS,
  QUIEN_PERSONAL,
} from "../reservas.js"
import { crearGuardiaDePersonal } from "../sesion.js"

/** Qué número de HTTP le toca a cada motivo de rechazo de `servidor/personal.js` y de `reservas.js`. */
const NUMERO_DE_CADA_RECHAZO = {
  // 422 es «entendí el pedido pero el dato no sirve».
  datos_incompletos: 422,
  correo_invalido: 422,
  // 409 es «conflicto»: la cuenta existe y no se puede crear otra con el mismo correo.
  correo_ya_registrado: 409,
  // Los tres de cerrar una cita (pieza 8). `cita_no_activa` es 409 con el mismo criterio de siempre
  // —la cita existe, pero su estado no permite lo que se pide— y es el mismo número con el que ya se
  // rechaza cancelar una cita cancelada, en `rutas/citas.js`: un motivo no puede tener dos números
  // según por qué puerta entre, o la pantalla tendría que aprender dos idiomas para el mismo problema.
  cita_no_encontrada: 404,
  cita_no_activa: 409,
  // 422 y no 409 porque el problema no es un conflicto de estado sino **el momento**: la cita todavía
  // no ocurrió, así que nadie pudo asistir ni faltar (RN-17). Es el mismo criterio con el que la
  // ventana de cancelación es 422.
  todavia_no_paso: 422,
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

  // ── La pieza 8: cerrar las citas que ya pasaron (RF-21) ──────────────────────────────────────

  // Las citas que están esperando que alguien diga qué ocurrió: activas y con la hora ya pasada.
  //
  // **No recibe ningún cliente**, a diferencia de la de arriba: son las de todo el negocio juntas, de
  // gente distinta, y por eso cada una viene con el nombre de su dueño. Es la lista de trabajo
  // pendiente de la asistente, no el expediente de una persona.
  rutas.get("/personal/citas-por-cerrar", exigirPersonal, (pedido, respuesta) => {
    return respuesta.status(200).json(citasPorCerrar({ base, ahora: reloj() }))
  })

  // RF-21: marcar qué ocurrió con una cita pasada — **completada** o **no asistió** (RN-17, RN-19).
  //
  // Quién la marcó sale de `pedido.personalId`, que lo deja puesto el guardia, **no del cuerpo del
  // pedido**. Es el mismo criterio con el que la pieza 7 decide de quién es una cita al reservar: un
  // dato que dice «quién soy» nunca se lee de lo que manda el navegador.
  rutas.patch("/personal/citas/:citaId/cierre", exigirPersonal, (pedido, respuesta) => {
    const citaId = Number(pedido.params.citaId)
    const estado = pedido.body?.estado

    // Un `:citaId` que no es un número no es una cita que exista: se contesta lo mismo que para una
    // que no está, sin llegar a preguntarle a la base.
    if (!Number.isInteger(citaId) || citaId <= 0) {
      return respuesta.status(404).json({ error: "cita_no_encontrada" })
    }

    // **Cuáles son los cierres válidos no lo decide este archivo**: la lista vive en `reservas.js`,
    // al lado de los estados. Acá solo se comprueba que lo que llegó esté en ella, igual que se
    // comprueba que un `inicio` venga bien escrito antes de reservar.
    if (!CIERRES_VALIDOS.includes(estado)) {
      return respuesta.status(422).json({ error: "datos_incompletos" })
    }

    const resultado = cerrarCita({
      base,
      citaId,
      estado,
      personalId: pedido.personalId,
      ahora: reloj(),
    })

    if (!resultado.ok) {
      return respuesta
        .status(NUMERO_DE_CADA_RECHAZO[resultado.motivo])
        .json({ error: resultado.motivo })
    }

    return respuesta.status(200).json(resultado.cierre)
  })

  return rutas
}
