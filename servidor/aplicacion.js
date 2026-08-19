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
import { crearRutasDeCatalogo } from "./rutas/catalogo.js"
import { crearRutasDeCitas } from "./rutas/citas.js"
import { crearRutasDeUsuario } from "./rutas/usuario.js"

const CARPETA_DE_ESTE_ARCHIVO = dirname(fileURLToPath(import.meta.url))
const CARPETA_PUBLICA = join(CARPETA_DE_ESTE_ARCHIVO, "..", "publico")

/** El reloj de verdad: el que se usa cuando la aplicación la levanta `npm start`. */
const RELOJ_DE_VERDAD = () => new Date()

/**
 * `reloj` es una función que devuelve el momento actual. Existe para que las pruebas puedan parar
 * el tiempo en un miércoles, en un sábado o en un feriado concreto y comprobar siempre lo mismo:
 * sin eso, «mañana hay horarios» fallaría los sábados. Si no se pasa, la aplicación usa la hora de
 * verdad y se comporta exactamente igual que siempre.
 */
export function crearAplicacion({ base, sesionSecreto, reloj = RELOJ_DE_VERDAD }) {
  const aplicacion = express()

  // Entiende los pedidos que llegan con un cuerpo en formato JSON.
  aplicacion.use(express.json())

  const sesiones = crearSesiones(sesionSecreto)
  aplicacion.use("/api", crearRutasDeAutenticacion({ base, sesiones }))
  aplicacion.use("/api", crearRutasDeCatalogo({ base, sesiones, reloj }))
  aplicacion.use("/api", crearRutasDeCitas({ base, sesiones, reloj }))
  aplicacion.use("/api", crearRutasDeUsuario({ base, sesiones, reloj }))

  // Todo lo que hay en `publico/` se sirve tal cual: el HTML, el CSS ya compilado y el JavaScript
  // que corre en el navegador.
  aplicacion.use(express.static(CARPETA_PUBLICA))

  return aplicacion
}
