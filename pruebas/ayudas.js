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
 * El momento en que se paran las pruebas del calendario: **martes 1 de setiembre de 2026, a las
 * 8 de la mañana en Costa Rica** (que en hora universal son las 14:00, porque Costa Rica está seis
 * horas atrás).
 *
 * Sin una fecha fija, las pruebas del calendario dirían cosas distintas según el día en que se
 * corran: «mañana hay horarios» falla si mañana cae domingo. Parándolas acá, siempre comprueban lo
 * mismo. Esta fecha se eligió a propósito porque desde ella se ven todos los casos que la pieza 2
 * tiene que resolver:
 *
 *   - hoy es martes 1                    → un día hábil, para comprobar que hoy igual no ofrece nada
 *   - mañana es miércoles 2              → un día hábil completo, con sus 8 horarios
 *   - el sábado 5                        → 4 horarios, el último a las 12
 *   - el domingo 6                       → cerrado
 *   - el martes 15                       → feriado de la Independencia, todavía en el futuro
 *   - octubre                            → el mes siguiente, para el cambio de mes
 */
export const MOMENTO_DE_PRUEBA = new Date("2026-09-01T14:00:00Z")

/** Un reloj que siempre marca la misma hora. Es lo que se le pasa a la aplicación en las pruebas. */
export function relojDetenidoEn(momento) {
  return () => momento
}

/**
 * Crea una aplicación de prueba: carpeta temporal, base de datos nueva con los datos precargados,
 * y el servidor escuchando en un puerto libre que el sistema operativo elige (el 0 significa
 * «dame cualquiera que esté libre», para que dos pruebas no se peleen por el 3000).
 *
 * `opciones.reloj` deja parar el tiempo en un momento concreto. Si no se pasa, la aplicación usa
 * la hora de verdad, igual que cuando la levanta `npm start`.
 */
export async function crearEntornoDePrueba(contexto, opciones = {}) {
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
        reloj: opciones.reloj,
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

/**
 * Un segundo cliente, inventado igual que Ana. Existe desde la pieza 3: la prueba de CA-1 necesita
 * **dos personas distintas** peleándose por el mismo horario, y con una sola cuenta no habría
 * carrera que comprobar.
 */
export const BETO = {
  nombre: "Beto Vargas",
  correo: "beto@ejemplo.com",
  contrasena: "Prueba456",
}

/**
 * Registra a Ana y deja su sesión abierta en ese navegador. Casi todas las pruebas del catálogo y
 * del calendario empiezan así, porque esas pantallas solo se ven con la sesión abierta.
 */
export async function entrarComoClienta(navegador) {
  await navegador("/api/registro", { method: "POST", cuerpo: ANA })
}

/** Lo mismo con el segundo cliente, en otro navegador: es la otra mitad de la carrera de CA-1. */
export async function entrarComoOtroCliente(navegador) {
  await navegador("/api/registro", { method: "POST", cuerpo: BETO })
}

/**
 * Entra con la cuenta de Personal, que **no se registra**: viene precargada (RN-10), así que se
 * entra con su contraseña en vez de crearla.
 */
export async function entrarComoPersonal(navegador) {
  await navegador("/api/sesion", { method: "POST", cuerpo: PERSONAL })
}

/** Busca un servicio o un proveedor por su nombre, para no depender de qué número de id le tocó. */
export function buscarPorNombre(lista, nombre) {
  return lista.find((uno) => uno.nombre === nombre)
}

/** Saca del calendario el día que se pide, escrito como «2026-09-02». */
export function diaDelCalendario(calendario, fecha) {
  return calendario.dias.find((dia) => dia.fecha === fecha)
}
