// Abre el archivo SQLite. Las tablas ya no se crean acá: viven en `esquema.js`.
//
// La base de datos de este proyecto es un solo archivo dentro de la carpeta `datos/`. No hay
// ningún servidor de base de datos que instalar: `better-sqlite3` lo trae adentro (decidido en
// `DISENO.md`, «Motor de base de datos»).

import Database from "better-sqlite3"
import { mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const CARPETA_DE_ESTE_ARCHIVO = dirname(fileURLToPath(import.meta.url))

/** Dónde vive la base de trabajo. Las pruebas usan su propio archivo temporal, no este. */
export const RUTA_DE_LA_BASE = join(CARPETA_DE_ESTE_ARCHIVO, "..", "datos", "reservas.sqlite")

/**
 * Abre la base en la ruta indicada. **Ya no crea las tablas**: eso lo hace `crearEsquema` de
 * `esquema.js`, y quien abre la base decide si lo llama. La razón está escrita ahí.
 *
 * Es `async` aunque hoy no espere nada, a propósito: en la Etapa 3 el motor de abajo pasa a ser una
 * base de la red y conectarse sí va a llevar tiempo. Poniendo el `async` desde ahora, ese día no
 * hay que volver a tocar a ninguno de los que la llaman.
 */
export async function abrirBase(rutaArchivo) {
  mkdirSync(dirname(rutaArchivo), { recursive: true })

  const cruda = new Database(rutaArchivo)

  // WAL deja que alguien lea mientras otro escribe. Hace falta desde la pieza 3, donde dos
  // clientes pueden intentar reservar el mismo horario en el mismo instante (CA-1).
  cruda.pragma("journal_mode = WAL")

  // `busy_timeout` es nuevo acá (2026-09-02) y no estaba antes: si la base está ocupada, se espera
  // hasta 5 segundos en vez de fallar en el acto. Hoy no cambia nada porque hay una sola conexión.
  // Se pone desde ahora porque en la Etapa 3 sí va a haber dos programas escribiendo el mismo
  // archivo durante las pruebas —la aplicación y la prueba que la vigila—, y sin esto la suite se
  // pondría intermitente. Ponerlo con el motor conocido debajo es la manera de comprobar que no
  // rompe nada.
  cruda.pragma("busy_timeout = 5000")

  cruda.pragma("foreign_keys = ON")

  return envolver(cruda)
}

/**
 * ── La segunda cara de la base (2026-09-02, al preparar el despliegue) ─────────────────────────
 *
 * Este objeto tiene **dos caras al mismo tiempo**, y es a propósito y es temporal.
 *
 * La cara **vieja** —`prepare`, `exec`, `transaction`, `pragma`, `close`— es la de `better-sqlite3`
 * y responde en el acto. Es la que hoy usan los 107 puntos del código.
 *
 * La cara **nueva** —`uno`, `todas`, `correr`, `ejecutar`, `enTransaccion`, `cerrar`— responde
 * **esperada**, como responde una base que vive en la red. Hoy, por debajo, es la misma de siempre:
 * los `await` que la esperan no esperan nada. Y ahí está el truco de toda la migración: se puede
 * mudar el código a este idioma con el motor conocido debajo, y comprobar que nada cambió, antes de
 * cambiar el motor.
 *
 * **La cara vieja se borra al final de la Etapa 2**, cuando no quede nadie usándola. Mientras las
 * dos existan, el proyecto se puede dejar a medias sin quedar roto.
 */
function envolver(cruda) {
  /**
   * Aplana una fila a un objeto común.
   *
   * Con `better-sqlite3` esto no hace nada: ya devuelve objetos comunes. Existe por la Etapa 3:
   * `@libsql/client` devuelve filas con **su propia clase**, y `assert.deepEqual` contra un objeto
   * escrito a mano falla aunque los datos sean idénticos. Aplanarlas acá es lo que hace que las dos
   * implementaciones sean de verdad intercambiables, y hay una prueba que lo fija.
   */
  const aplanar = (fila) => (fila === undefined ? undefined : { ...fila })

  const base = {
    // ── La cara vieja. Se borra al final de la Etapa 2 ──────────────────────────────────────
    prepare: (sql) => cruda.prepare(sql),
    exec: (sql) => cruda.exec(sql),
    pragma: (texto) => cruda.pragma(texto),
    transaction: (hacer) => cruda.transaction(hacer),
    close: () => cruda.close(),

    // ── La cara nueva ───────────────────────────────────────────────────────────────────────

    /** Una fila suelta, o `undefined` si la consulta no encontró ninguna. */
    async uno(sql, ...parametros) {
      return aplanar(cruda.prepare(sql).get(...parametros))
    },

    /** Todas las filas, como arreglo. Vacío si no hay ninguna. */
    async todas(sql, ...parametros) {
      return cruda.prepare(sql).all(...parametros).map(aplanar)
    },

    /** Escribe. Devuelve cuántas filas cambió y, si insertó, el id que le tocó. */
    async correr(sql, ...parametros) {
      const resultado = cruda.prepare(sql).run(...parametros)
      return {
        cambios: resultado.changes,
        idInsertado: Number(resultado.lastInsertRowid),
      }
    },

    /** Varias sentencias de una sola vez, sin parámetros. Es para el esquema. */
    async ejecutar(sql) {
      cruda.exec(sql)
    },

    /**
     * Todo lo de adentro se guarda junto o no se guarda nada.
     *
     * `hacer` recibe un objeto con **la misma cara nueva** que este, y por eso las funciones que ya
     * reciben `{ base }` —como `revisarHorario`— sirven adentro de una transacción sin cambiarles
     * nada: se les pasa el `tx` donde antes iba la base.
     *
     * `BEGIN IMMEDIATE` pide el permiso de escritura al empezar y no a mitad de camino, que es lo
     * que corresponde: se sabe de antemano que se va a escribir. Es el mismo `.immediate()` que
     * usaba `comprobarYGuardar`.
     *
     * ⚠️ **Nada de red adentro de una transacción.** Ni un correo, ni un `fetch`. Acá abajo el
     * `BEGIN`/`COMMIT` es a mano, y una espera de verdad en el medio dejaría la transacción abierta
     * mientras pasan otras cosas. Y en la Etapa 3 la razón se vuelve más fuerte todavía: cada
     * sentencia es un viaje a la red, y una transacción larga es una visita lenta. Hoy el proyecto
     * ya cumple esta regla —el correo de confirmación se manda **afuera**, en `crearCitaYAvisar`—
     * y hay que seguir cumpliéndola.
     */
    async enTransaccion(hacer) {
      cruda.exec("BEGIN IMMEDIATE")
      try {
        const resultado = await hacer(base)
        cruda.exec("COMMIT")
        return resultado
      } catch (falla) {
        cruda.exec("ROLLBACK")
        throw falla
      }
    },

    async cerrar() {
      cruda.close()
    },
  }

  return base
}
