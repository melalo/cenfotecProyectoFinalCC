// Abre la base de datos. Es el único archivo que sabe con qué biblioteca se le habla.
//
// La base es **SQLite** igual que siempre, pero a través de `@libsql/client` en vez de
// `better-sqlite3` (2026-09-04, Etapa 3 del despliegue). El cambio de biblioteca no cambia el
// idioma: es el mismo SQL, las mismas tablas y las mismas consultas. Lo que agrega es un **segundo
// destino posible**: una base alojada en Turso, alcanzable por red, para cuando la aplicación no
// vive en una computadora.
//
// Las tablas no se crean acá: viven en `esquema.js`, y quien abre la base decide si las pide.

import { createClient } from "@libsql/client"
import { mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const CARPETA_DE_ESTE_ARCHIVO = dirname(fileURLToPath(import.meta.url))

/** Dónde vive la base de trabajo. Las pruebas usan su propio archivo temporal, no esta. */
export const RUTA_DE_LA_BASE = join(CARPETA_DE_ESTE_ARCHIVO, "..", "datos", "reservas.sqlite")

/**
 * Cómo se escribe la dirección de un archivo del disco para esta biblioteca.
 *
 * ⚠️ **Ojo con Windows:** va `file:` seguido de la ruta con barras **inclinadas normales** (`/`),
 * nunca con las invertidas (`\`) que usa Windows. Por eso se cambian acá; si no, la biblioteca no
 * encuentra el archivo. Esta línea es una de las que costó una sesión en el despliegue anterior.
 */
export function comoArchivo(ruta) {
  return "file:" + ruta.replace(/\\/g, "/")
}

/**
 * A qué base hay que hablarle.
 *
 * Con `TURSO_DATABASE_URL` configurada, a esa: es lo que pasa en el despliegue, donde apunta a una
 * base alojada en Turso. `TURSO_AUTH_TOKEN` es su contraseña. **Los dos nombres son los que Turso
 * pone solo cuando se conecta el proyecto en Vercel**, y por eso se llaman así y no de otra forma.
 *
 * Sin nada configurado —esta computadora, y las pruebas— la base es el archivo de `datos/`, igual
 * que toda la vida: `npm start`, `npm run datos` y `npm test` siguen funcionando **sin internet y
 * sin configurar ninguna clave**. Eso es lo que hace que la integración continua de GitHub siga
 * corriendo sin credenciales de ningún servicio.
 */
export function destinoDeLaBase(rutaArchivo = RUTA_DE_LA_BASE) {
  if (process.env.TURSO_DATABASE_URL) {
    return {
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
      esArchivo: process.env.TURSO_DATABASE_URL.startsWith("file:"),
    }
  }

  // Desplegado y sin base gestionada: no hay dónde guardar, y hay que decirlo fuerte.
  //
  // En el despliegue anterior hubo acá, por un rato, una tercera rama que mandaba la base a `/tmp`,
  // la única carpeta escribible de la función. Servía de vitrina —el sitio se veía y se podía
  // usar— pero mentía: `/tmp` es privado de cada copia de la función y se borra cuando Vercel la
  // duerme, así que **las reservas se perdían sin avisar**. Un sistema de reservas que pierde
  // reservas en silencio es peor que uno que no arranca: el que no arranca se nota.
  //
  // Ahora falla de entrada y con el motivo escrito. En un despliegue la base gestionada no es un
  // respaldo: es el almacenamiento.
  if (process.env.VERCEL) {
    throw new Error(
      "Falta configurar TURSO_DATABASE_URL. En el despliegue el disco es de sólo lectura, así que " +
        "no hay dónde guardar las citas: la base tiene que ser la base gestionada de Turso.",
    )
  }

  return { url: comoArchivo(rutaArchivo), esArchivo: true }
}

/**
 * Abre la base en la ruta indicada. **No crea las tablas**: eso lo hace `crearEsquema` de
 * `esquema.js`, y quien abre la base decide si lo llama.
 */
export async function abrirBase(rutaArchivo) {
  mkdirSync(dirname(rutaArchivo), { recursive: true })
  return await conectarA({ url: comoArchivo(rutaArchivo), esArchivo: true })
}

/**
 * La conexión del despliegue: **una sola para todo el proceso**.
 *
 * En un despliegue esto no es una optimización sino una necesidad. Cada visita a un sitio dormido
 * despierta una función, y si cada visita abriera su propia conexión, el cupo del plan gratis se
 * gastaría en abrir y cerrar. Guardando la **promesa** en esta variable, las visitas que caen en una
 * función que ya está despierta reutilizan la conexión abierta.
 *
 * Y si la conexión falla, la variable se limpia: así el próximo intento vuelve a probar en vez de
 * quedarse pegado para siempre a un error viejo.
 */
let conexionCompartida = null

export function conectar() {
  if (!conexionCompartida) {
    conexionCompartida = conectarA(destinoDeLaBase()).catch((falla) => {
      conexionCompartida = null
      throw falla
    })
  }
  return conexionCompartida
}

async function conectarA(destino) {
  const cliente = createClient({ url: destino.url, authToken: destino.authToken })

  // Estos dos sólo tienen sentido contra un archivo del disco, no contra una base de la red:
  //   - WAL deja que alguien lea mientras otro escribe, en vez de trabarse. Hace falta desde la
  //     pieza 3, donde dos clientes pueden pelearse el mismo horario (CA-1).
  //   - busy_timeout hace que, si la base está ocupada, se espere hasta 5 segundos en vez de fallar
  //     en el acto. Hace falta porque durante las pruebas hay dos programas escribiendo el mismo
  //     archivo: la aplicación y la prueba que la vigila.
  if (destino.esArchivo) {
    await cliente.execute("PRAGMA journal_mode = WAL")
    await cliente.execute("PRAGMA busy_timeout = 5000")
  }

  await cliente.execute("PRAGMA foreign_keys = ON")

  return envolver(cliente)
}

/** Lo que se le dice a quien abre una transacción adentro de otra. */
const MENSAJE_TRANSACCION_ANIDADA =
  "No se puede abrir una transacción adentro de otra: enTransaccion no se anida. La `transaction` " +
  "de better-sqlite3 sí lo aguantaba, con SAVEPOINT, y esto no lo reemplaza. Si algún día hace " +
  "falta de verdad, hay que construirlo a propósito y probarlo."

/**
 * ── La cara de la base, y la única desde el final de la Etapa 2 ────────────────────────────────
 *
 * `uno`, `todas`, `correr`, `ejecutar`, `enTransaccion` y `cerrar`. Todas responden **esperadas**,
 * porque una base que vive en la red no responde en el acto.
 *
 * La cara vieja de `better-sqlite3` —`prepare`, `exec`, `pragma`, `transaction`, `close`— vivió acá
 * mientras los 107 puntos del proyecto se mudaban de a uno, y se borró el 2026-09-04 al terminar la
 * Etapa 2, cuando el `grep` que la buscaba no encontró a nadie usándola. Con ella se fue también el
 * andamio que vigilaba que nadie confundiera `base` con `tx`: acá `tx` **es** un objeto distinto,
 * atado a su transacción, así que la confusión ya no puede pasar desapercibida.
 *
 * `envolver` se usa **también** para la transacción: el objeto que devuelve `cliente.transaction()`
 * tiene `execute` con la misma forma, así que la misma envoltura le sirve. Eso es lo que hace que
 * `tx` tenga la misma cara que la base.
 */
function envolver(cliente) {
  return {
    /** Una fila suelta, o `undefined` si la consulta no encontró ninguna. */
    async uno(sql, ...parametros) {
      const resultado = await cliente.execute({ sql, args: normalizar(parametros) })
      return aplanar(resultado.rows[0])
    },

    /** Todas las filas que devuelva la consulta, como una lista. */
    async todas(sql, ...parametros) {
      const resultado = await cliente.execute({ sql, args: normalizar(parametros) })
      return resultado.rows.map(aplanar)
    },

    /** Una escritura. Devuelve cuántas filas cambió y, si fue un INSERT, el número que le tocó. */
    async correr(sql, ...parametros) {
      const resultado = await cliente.execute({ sql, args: normalizar(parametros) })
      return {
        cambios: resultado.rowsAffected,
        // Sólo un INSERT deja un id nuevo, y el número viene como `BigInt` mientras el resto del
        // proyecto trabaja con números comunes. La misma regla que la Etapa 1, para que las dos
        // implementaciones prometan lo mismo — hay una prueba que lo fija.
        idInsertado: /^\s*(INSERT|REPLACE)/i.test(sql)
          ? Number(resultado.lastInsertRowid)
          : undefined,
      }
    },

    /** Varias sentencias de una vez, sin parámetros. Es lo que usa el esquema. */
    async ejecutar(sql) {
      await cliente.executeMultiple(sql)
    },

    /**
     * Todo lo de adentro se guarda junto o no se guarda nada.
     *
     * ⚠️ **Nada de red adentro.** Ni un correo, ni un `fetch`. Cada sentencia de acá es un viaje a
     * la base, y una transacción que además espera a otro servicio deja una visita lenta y una
     * transacción abierta de más. El proyecto ya cumple esta regla: el correo de confirmación se
     * manda **afuera**, en `crearCitaYConfirmar`, después de que la cita quedó guardada.
     */
    async enTransaccion(hacer) {
      // Un `tx` no sabe abrir transacciones —el objeto de la biblioteca no tiene `transaction`—, y
      // sin esta línea el intento saldría como `TypeError: cliente.transaction is not a function`,
      // que no le dice nada a nadie. Se dice en voz alta, porque **es un soporte que se perdió**:
      // la `transaction` de better-sqlite3 sí se podía anidar, con SAVEPOINT.
      if (typeof cliente.transaction !== "function") {
        throw new Error(MENSAJE_TRANSACCION_ANIDADA)
      }

      // "write" es lo mismo que pedía `BEGIN IMMEDIATE`: el permiso de escritura al empezar y no a
      // mitad de camino. Se sabe de antemano que se va a escribir.
      const transaccion = await cliente.transaction("write")
      try {
        const resultado = await hacer(envolver(transaccion))
        await transaccion.commit()
        return resultado
      } catch (falla) {
        try {
          await transaccion.rollback()
        } catch {
          // Si el ROLLBACK también falla, la falla que importa es la de arriba: es la que dice qué
          // salió mal de verdad, y `servidor/reservas.js` la lee —mira `falla.code`— para decidir si
          // le contesta al cliente «ese horario ya no está libre» o un 500. Taparla convertiría el
          // aviso claro de CA-1 en un error del servidor, y encima el registro diría una causa
          // falsa, que es el defecto más caro de diagnosticar que hay.
          //
          // No es hipotético: la base puede deshacer la transacción **sola** ante un tropiezo, y
          // entonces este ROLLBACK llega y ya no hay nada que deshacer, así que tira.
        }
        throw falla
      }
    },

    async cerrar() {
      cliente.close()
    },
  }
}

/**
 * Aplana una fila a un objeto común.
 *
 * `@libsql/client` devuelve las filas con **su propia clase**, y `assert.deepEqual` contra un objeto
 * escrito a mano falla aunque los datos sean idénticos. Aplanarlas acá es lo que hace que este
 * archivo se pueda cambiar sin tocar ninguna prueba, y hay una prueba en `pruebas/adaptador.test.js`
 * que lo fija.
 */
function aplanar(fila) {
  return fila === undefined ? undefined : { ...fila }
}

/**
 * Convierte `undefined` en `null` antes de mandarle los parámetros a la base.
 *
 * Hace falta porque las dos bibliotecas no se comportan igual: `better-sqlite3` guardaba un
 * `undefined` como vacío, y `@libsql/client` **se niega** («undefined cannot be passed as argument
 * to the database»). Y en JavaScript un campo de formulario que no vino **es** `undefined`: sin esta
 * línea, un `PUT /api/mi-informacion` sin teléfono pasaría de guardar vacío a devolver un 500.
 *
 * El proyecto ya se cuidaba de esto **en cada sitio** —`normalizarTelefono`,
 * `revisarFechaDeNacimiento`, `buscarClientes`—, y por eso no explotó. Pero cuidado repetido en 107
 * lugares no es una garantía: alcanza con que un sitio nuevo se olvide. Acá vive en uno.
 */
function normalizar(parametros) {
  return parametros.map((uno) => (uno === undefined ? null : uno))
}
