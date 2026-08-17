// Arma la aplicación de Express, pero NO la pone a escuchar.
//
// Está separado de `index.js` a propósito: las pruebas necesitan crear la aplicación con una base
// de datos de prueba y en un puerto cualquiera. Si armar la aplicación y ponerla a escuchar en el
// 3000 fueran la misma cosa, no se podrían probar los endpoints.

import express from "express"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { crearSesiones } from "./sesion.js"
import { crearRutasDeAutenticacion } from "./rutas/autenticacion.js"

const CARPETA_DE_ESTE_ARCHIVO = dirname(fileURLToPath(import.meta.url))
const CARPETA_PUBLICA = join(CARPETA_DE_ESTE_ARCHIVO, "..", "publico")

export function crearAplicacion({ base, sesionSecreto }) {
  const aplicacion = express()

  // Entiende los pedidos que llegan con un cuerpo en formato JSON.
  aplicacion.use(express.json())

  const sesiones = crearSesiones(sesionSecreto)
  aplicacion.use("/api", crearRutasDeAutenticacion({ base, sesiones }))

  // Todo lo que hay en `publico/` se sirve tal cual: el HTML, el CSS ya compilado y el JavaScript
  // que corre en el navegador.
  aplicacion.use(express.static(CARPETA_PUBLICA))

  return aplicacion
}
