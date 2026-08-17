// Ayudas para las pruebas. No es un archivo de prueba (no termina en .test.js), así que
// `npm test` no lo corre solo: lo importan las pruebas de verdad.
//
// Todo lo que hay acá existe para una sola cosa: levantar la aplicación completa con una base de
// datos de prueba desechable, hablarle por HTTP como lo haría el navegador, y borrar todo al
// terminar. Nunca se toca `datos/reservas.sqlite`, la base de trabajo.

import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { once } from "node:events"

import { abrirBase } from "../servidor/base-de-datos.js"
import { crearAplicacion } from "../servidor/aplicacion.js"
import { cargarDatosDePrueba } from "../guiones/datos-de-prueba.js"

const SESION_SECRETO_DE_PRUEBA = "secreto-solo-para-las-pruebas"

/**
 * Crea una aplicación de prueba: carpeta temporal, base de datos nueva con los datos precargados,
 * y el servidor escuchando en un puerto libre que el sistema operativo elige (el 0 significa
 * «dame cualquiera que esté libre», para que dos pruebas no se peleen por el 3000).
 */
export async function crearEntornoDePrueba(contexto) {
  const carpeta = mkdtempSync(join(tmpdir(), "reservas-prueba-"))
  const rutaBase = join(carpeta, "prueba.sqlite")

  let base = null
  let servidor = null

  const entorno = {
    rutaBase,
    direccion: "",

    /** La conexión a la base, para poder mirar por dentro qué quedó guardado. */
    get base() {
      return base
    },

    async levantar() {
      base = abrirBase(rutaBase)
      servidor = crearAplicacion({
        base,
        sesionSecreto: SESION_SECRETO_DE_PRUEBA,
      }).listen(0)
      await once(servidor, "listening")
      entorno.direccion = `http://localhost:${servidor.address().port}`
    },

    /** Apaga la aplicación como si alguien cerrara la terminal, sin borrar el archivo. */
    async apagar() {
      if (servidor) {
        servidor.close()
        await once(servidor, "close")
        servidor = null
      }
      if (base) {
        base.close()
        base = null
      }
    },
  }

  await entorno.levantar()
  cargarDatosDePrueba(base)

  // Cuando la prueba termina —pase o falle— se apaga todo y se borra la carpeta temporal.
  contexto.after(async () => {
    await entorno.apagar()
    rmSync(carpeta, { recursive: true, force: true })
  })

  return entorno
}

/**
 * Devuelve una función para hablarle al API. Guarda la cookie de sesión que el servidor manda y
 * la vuelve a enviar en el pedido siguiente, que es exactamente lo que hace un navegador.
 * Cada llamada a `crearNavegador` es como abrir un navegador distinto, sin sesión.
 */
export function crearNavegador(entorno) {
  let cookie = null

  return async function pedir(ruta, opciones = {}) {
    const { cuerpo, ...resto } = opciones

    const respuesta = await fetch(entorno.direccion + ruta, {
      ...resto,
      headers: {
        "content-type": "application/json",
        ...(cookie ? { cookie } : {}),
        ...(opciones.headers ?? {}),
      },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    })

    for (const enviada of respuesta.headers.getSetCookie()) {
      cookie = enviada.split(";")[0]
    }

    const texto = await respuesta.text()
    return {
      estado: respuesta.status,
      cuerpo: texto === "" ? null : JSON.parse(texto),
    }
  }
}

/** Los datos de la clienta de prueba que usan las comprobaciones del plan (pieza 1). */
export const ANA = {
  nombre: "Ana Rodríguez",
  correo: "ana@ejemplo.com",
  contrasena: "Prueba123",
}

/** La cuenta de Personal precargada (README.md, «Datos de prueba»). */
export const PERSONAL = {
  correo: "personal@ejemplo.com",
  contrasena: "Personal123",
}
