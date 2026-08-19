// Los endpoints de la pieza 2: los servicios del negocio, sus proveedores, los datos del negocio
// y el calendario de disponibilidad.
//
// El contrato (qué recibe cada uno y qué devuelve) está en el bloque «Produce» de la pieza 2 de
// `PLAN.md`, y acá se cumple tal cual.

import { Router } from "express"

import {
  existeElServicio,
  existeLaCategoria,
  eseProveedorAtiendeEseServicio,
  listarCategorias,
  listarServicios,
  listarServiciosDeCategoria,
} from "../catalogo.js"
import { calcularDisponibilidad } from "../disponibilidad.js"
import { fechaDeCostaRica, mesEstaBienEscrito } from "../tiempo.js"

export function crearRutasDeCatalogo({ base, sesiones, reloj }) {
  const rutas = Router()

  /**
   * Deja pasar solo a quien tiene la sesión abierta.
   *
   * El catálogo y el calendario no se pueden ver sin cuenta: no existe la reserva como invitado
   * (RN-9), así que un calendario que se pudiera mirar sin entrar no llevaría a ninguna parte.
   */
  function exigirSesion(pedido, respuesta, seguir) {
    if (!sesiones.leer(pedido)) return respuesta.status(401).json({ error: "sin_sesion" })
    return seguir()
  }

  // RF-5, primer paso: las categorías del negocio, cada una con sus servicios (pieza 11).
  //
  // Es el endpoint que usa la pantalla. Trae el árbol completo de una, y cada categoría dice si hay
  // que mostrar el paso de elegir el servicio (RN-22) — eso lo decide el servidor, no la pantalla.
  rutas.get("/categorias", exigirSesion, (pedido, respuesta) => {
    return respuesta.status(200).json(listarCategorias(base))
  })

  // Los servicios de una categoría, por separado. La pantalla no lo necesita —ya los recibe todos en
  // `/api/categorias`—, pero el contrato de la pieza 11 lo fija y hace comprobable el caso de una
  // categoría que no existe.
  rutas.get("/categorias/:categoriaId/servicios", exigirSesion, (pedido, respuesta) => {
    const categoriaId = Number(pedido.params.categoriaId)

    if (!existeLaCategoria(base, categoriaId)) {
      return respuesta.status(404).json({ error: "categoria_no_encontrada" })
    }

    return respuesta.status(200).json(listarServiciosDeCategoria(base, categoriaId))
  })

  // Todos los servicios del negocio, en una lista plana. Existe desde la pieza 2 y se conserva tal
  // cual porque es parte de un contrato ya cerrado; desde la pieza 11 cada servicio trae además el
  // nombre de su categoría. La pantalla usa `/api/categorias`.
  rutas.get("/servicios", exigirSesion, (pedido, respuesta) => {
    return respuesta.status(200).json(listarServicios(base))
  })

  // RF-5, último paso: quién atiende el servicio elegido. Cuando hay más de uno, el cliente
  // elige; cuando hay uno solo, igual se dice quién es (RN-8).
  rutas.get("/servicios/:servicioId/proveedores", exigirSesion, (pedido, respuesta) => {
    const servicioId = Number(pedido.params.servicioId)

    if (!existeElServicio(base, servicioId)) {
      return respuesta.status(404).json({ error: "servicio_no_encontrado" })
    }

    const proveedores = base
      .prepare(
        `SELECT proveedor.id, proveedor.nombre
           FROM proveedor
           JOIN servicio_proveedor ON servicio_proveedor.proveedor_id = proveedor.id
          WHERE servicio_proveedor.servicio_id = ?
          ORDER BY proveedor.nombre`,
      )
      .all(servicioId)

    return respuesta.status(200).json(proveedores)
  })

  // RF-6 y RF-7: el calendario del mes, con los horarios libres y los que no lo están.
  rutas.get("/disponibilidad", exigirSesion, (pedido, respuesta) => {
    const servicioId = Number(pedido.query.servicioId)
    const proveedorId = Number(pedido.query.proveedorId)
    const mes = pedido.query.mes

    if (!servicioId || !proveedorId || !mesEstaBienEscrito(mes)) {
      return respuesta.status(422).json({ error: "datos_incompletos" })
    }

    // Que el proveedor atienda ese servicio no es un detalle: pedir el calendario de Carlos para
    // la limpieza facial, que él no atiende, mostraría horarios que nadie puede tomar. La pregunta
    // se le hace a `servidor/catalogo.js`, que es donde vive: desde la pieza 3 la reserva necesita
    // la misma respuesta, y no puede estar escrita dos veces.
    if (!eseProveedorAtiendeEseServicio(base, servicioId, proveedorId)) {
      return respuesta.status(404).json({ error: "servicio_o_proveedor_no_encontrado" })
    }

    const calendario = calcularDisponibilidad({ base, proveedorId, mes, ahora: reloj() })
    return respuesta.status(200).json(calendario)
  })

  // Los datos del negocio (REG-4). Es el único endpoint de esta pieza que se lee **sin sesión**,
  // porque el pie de página muestra el nombre también en la pantalla de entrar. Solo devuelve la
  // configuración del negocio: nada de cuentas ni de citas.
  rutas.get("/negocio", (pedido, respuesta) => {
    const negocio = base
      .prepare(
        `SELECT nombre, telefono, ubicacion, logo, color_principal, color_secundario
           FROM configuracion_negocio
          LIMIT 1`,
      )
      .get()

    if (!negocio) return respuesta.status(404).json({ error: "negocio_no_configurado" })

    return respuesta.status(200).json({
      nombre: negocio.nombre,
      telefono: negocio.telefono,
      ubicacion: negocio.ubicacion,
      // Qué día es hoy **para el negocio**, que está en Costa Rica. La pantalla lo necesita para
      // saber en qué mes abrir el calendario y cuál casilla es la de hoy: si se lo preguntara al
      // reloj de la computadora de quien mira, alguien en otro huso horario podría ver un día de
      // diferencia. La hora del negocio es la única que vale (`servidor/tiempo.js`).
      hoy: fechaDeCostaRica(reloj()),
      logo: negocio.logo,
      // El logo y los colores se guardan porque REG-4 pide registrarlos, pero la aplicación no los
      // aplica: su apariencia sale de `VISUALS.md` (ver `CLAUDE.md`, «Lo visual»).
      colorPrincipal: negocio.color_principal,
      colorSecundario: negocio.color_secundario,
    })
  })

  return rutas
}

