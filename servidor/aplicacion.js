// Arma la aplicación de Express, pero NO la pone a escuchar.
//
// Está separado de `index.js` a propósito: las pruebas necesitan crear la aplicación con una base
// de datos de prueba y en un puerto cualquiera. Si armar la aplicación y ponerla a escuchar en el
// 3000 fueran la misma cosa, no se podrían probar los endpoints.

import express from "express"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { ENVIADOR_SIN_CONFIGURAR } from "./correo.js"
import { crearSesiones } from "./sesion.js"
import { crearRutasDeAutenticacion } from "./rutas/autenticacion.js"
import { crearRutasDeCatalogo } from "./rutas/catalogo.js"
import { crearRutasDeCitas } from "./rutas/citas.js"
import { crearRutasDePersonal } from "./rutas/personal.js"
import { crearRutasDeUsuario } from "./rutas/usuario.js"

const CARPETA_DE_ESTE_ARCHIVO = dirname(fileURLToPath(import.meta.url))
const CARPETA_PUBLICA = join(CARPETA_DE_ESTE_ARCHIVO, "..", "publico")

/** El reloj de verdad: el que se usa cuando la aplicación la levanta `npm start`. */
const RELOJ_DE_VERDAD = () => new Date()

/**
 * Con qué dirección se escriben los enlaces que salen por correo (pieza 9).
 *
 * **`localhost` quiere decir «esta computadora»**, así que un enlace escrito así solo abre en la
 * máquina donde la aplicación está corriendo. Para la demostración alcanza, y está declarado en
 * `DISENO.md`. El día que la aplicación viva en un servidor de verdad se cambia `DIRECCION_PUBLICA`
 * en el `.env`, sin tocar código.
 */
const DIRECCION_PUBLICA_POR_OMISION = "http://localhost:3000"

/**
 * `reloj` es una función que devuelve el momento actual. Existe para que las pruebas puedan parar
 * el tiempo en un miércoles, en un sábado o en un feriado concreto y comprobar siempre lo mismo:
 * sin eso, «mañana hay horarios» fallaría los sábados. Si no se pasa, la aplicación usa la hora de
 * verdad y se comporta exactamente igual que siempre.
 *
 * `enviador` es lo mismo pero para el correo (pieza 4): una función que entrega un correo ya
 * escrito. En `npm start` es la que habla con Resend; en las pruebas es una de mentira que los
 * guarda en una lista. **Si no se pasa, la aplicación levanta igual** y los correos quedan
 * registrados como fallidos — que es exactamente lo que tiene que pasar cuando el `.env` no tiene
 * `RESEND_API_KEY` (RF-19).
 */
export function crearAplicacion({
  base,
  sesionSecreto,
  reloj = RELOJ_DE_VERDAD,
  enviador = ENVIADOR_SIN_CONFIGURAR,
  direccionPublica = DIRECCION_PUBLICA_POR_OMISION,
}) {
  const aplicacion = express()

  // Entiende los pedidos que llegan con un cuerpo en formato JSON.
  aplicacion.use(express.json())

  const sesiones = crearSesiones(sesionSecreto)
  aplicacion.use(
    "/api",
    crearRutasDeAutenticacion({ base, sesiones, reloj, enviador, direccionPublica }),
  )
  aplicacion.use("/api", crearRutasDeCatalogo({ base, sesiones, reloj }))
  aplicacion.use("/api", crearRutasDeCitas({ base, sesiones, reloj, enviador }))
  aplicacion.use("/api", crearRutasDeUsuario({ base, sesiones, reloj }))
  aplicacion.use("/api", crearRutasDePersonal({ base, sesiones, reloj }))

  // Todo lo que hay en `publico/` se sirve tal cual: el HTML, el CSS ya compilado y el JavaScript
  // que corre en el navegador.
  aplicacion.use(express.static(CARPETA_PUBLICA))

  return aplicacion
}
