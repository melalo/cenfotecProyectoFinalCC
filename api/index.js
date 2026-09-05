// La puerta de entrada de Vercel.
//
// Vercel busca por convención una carpeta `api/` y convierte cada archivo de adentro en una función
// que se despierta cuando alguien visita el sitio. Este archivo no hace nada propio: consigue la
// aplicación de Express y le entrega la visita. Es el único pedazo de código que existe por el
// despliegue y no por el negocio, y por eso vive aparte.
//
// ── Por qué la aplicación se arma acá adentro y no al cargar el archivo ────────────────────────
//
// Es la lección más cara del despliegue anterior. Allá, el archivo principal consultaba la base
// **al cargarse**, antes de atender a nadie. Resultado: el despliegue se completó sin un solo error
// —Vercel marcó `Ready`— y la primera visita devolvió **500**. La falla no aparece al construir,
// aparece al atender, y por eso el estado del despliegue no la delata.
//
// Acá el trabajo se hace en la primera visita, dentro de un `try`. Si la base no está configurada,
// se ve **un mensaje que dice qué falta** en vez de un 500 pelado. Y `listaParaAtender` se limpia
// cuando falla, para que el próximo intento vuelva a probar en vez de quedarse pegado para siempre
// a un error viejo.

import { crearAplicacionDesplegada } from "../servidor/aplicacion-desplegada.js"

let listaParaAtender = null

export default async function atender(pedido, respuesta) {
  try {
    if (!listaParaAtender) {
      listaParaAtender = crearAplicacionDesplegada().catch((falla) => {
        listaParaAtender = null
        throw falla
      })
    }

    const aplicacion = await listaParaAtender
    return aplicacion(pedido, respuesta)
  } catch (falla) {
    // Queda en el registro de Vercel (`vercel logs`) **y** se le dice a quien visitó. El mensaje es
    // el de la falla porque estas fallas son de configuración, no de la gente: dicen exactamente qué
    // variable falta.
    console.error("La aplicación no pudo arrancar:", falla)
    respuesta.status(500).json({ error: "aplicacion_no_configurada", detalle: falla.message })
  }
}
