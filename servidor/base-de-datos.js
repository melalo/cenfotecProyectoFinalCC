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
 * Lo que se le dice a quien usa `base` adentro de una transacción, donde iba `tx`.
 *
 * El mensaje explica el daño en vez de sólo prohibir, porque el error se va a leer en la Etapa 2 y
 * lo que hay que entender ahí es **por qué** importa, no que está prohibido.
 */
const MENSAJE_USAR_TX =
  "Hay una transacción abierta: adentro de enTransaccion hay que usar «tx», no «base». Con " +
  "«base», en la Etapa 3 esta consulta saldría afuera de la transacción y el «comprobar y " +
  "guardar en un solo movimiento» de CA-1 dejaría de ser uno solo."

/** Lo que se le dice a quien guarda un `tx` y lo usa cuando su transacción ya terminó. */
const MENSAJE_TX_VENCIDO =
  "Este «tx» ya no sirve: la transacción que lo creó ya terminó. Un «tx» vale sólo adentro de su " +
  "propio enTransaccion, y guardarlo para después es justo lo que en la Etapa 3 dejaría la " +
  "consulta afuera de toda transacción."

/** Lo que se le dice a quien abre una transacción adentro de otra. */
const MENSAJE_TRANSACCION_ANIDADA =
  "No se puede abrir una transacción adentro de otra: enTransaccion no se anida. La `transaction` " +
  "de better-sqlite3 sí lo aguantaba, con SAVEPOINT, y esto no lo reemplaza. Si algún día hace " +
  "falta de verdad, hay que construirlo a propósito y probarlo."

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

  /**
   * Cambia `undefined` por `null` en los parámetros de una consulta.
   *
   * Es una línea que evita un 500 en la Etapa 3. `better-sqlite3` guarda un `undefined` como vacío
   * sin decir nada; `@libsql/client` **tira un error**: «undefined cannot be passed as argument to
   * the database». Y en JavaScript un campo de formulario que no vino **es** `undefined`, así que
   * el caso no es raro: es el normal.
   *
   * Hoy cada sitio que lo necesita lo convierte a mano —`normalizarTelefono`,
   * `revisarFechaDeNacimiento`, `buscarClientes`—, y eso es cuidado repetido en cada consulta en
   * vez de una garantía del cimiento. Puesto acá, vale para las 107 de una sola vez.
   */
  const sinIndefinidos = (parametros) =>
    parametros.map((valor) => (valor === undefined ? null : valor))

  /**
   * ── El andamio que impide confundir `base` con `tx` (2026-09-02) ────────────────────────────
   *
   * Hoy `tx` podría ser el mismo objeto que `base` y nada se notaría. **Y ahí está el peligro:** en
   * la Etapa 2 hay que enhebrar el `tx` por `revisarHorario`, `buscarCitaParaCambiar`,
   * `revisarSiSePuedeCambiar` y `marcarEnlaceComoUsado`, y si en un solo lugar se escribe `base`
   * donde iba `tx`, hoy funciona perfecto y pasa todas las pruebas. En la Etapa 3, donde `tx` sí
   * va a ser un objeto atado a la transacción, ese `INSERT INTO cita` saldría **afuera** de la
   * transacción: el «comprobar y guardar en un solo movimiento» de CA-1 dejaría de ser uno solo y
   * un `ROLLBACK` ya no desharía la cita. Sin ninguna señal.
   *
   * Así que se pone la señal hoy, con el motor conocido debajo: mientras haya una transacción
   * abierta, la cara nueva de `base` **se niega a responder**. El error sale en la Etapa 2, donde
   * es de una línea, en vez de en la 3, donde sería una carrera intermitente.
   *
   * ⚠️ **Esta bandera hay que quitarla en la Etapa 3, no antes**, y es segura hoy sólo mientras se
   * cumplan **dos** condiciones. Las dos, no una.
   *
   * **La primera:** nada de red ni esperas de verdad adentro de la transacción. Los `await` de
   * adentro no esperan nada, así que la transacción entera se completa sin que el bucle de eventos
   * atienda otra petición — hay una sola transacción a la vez y punto.
   *
   * **La segunda, que no se ve:** a `enTransaccion` hay que hacerle `await` **en el acto**. Nunca
   * `Promise.all`, nunca guardar la promesa para esperarla más tarde. Esto se rechaza, y no
   * debería:
   *
   *     const [cita, servicios] = await Promise.all([
   *       base.enTransaccion(async (tx) => { await tx.correr("INSERT INTO categoria ...") }),
   *       base.todas("SELECT id FROM servicio"),   // ← se lleva el error sin tener nada que ver
   *     ])
   *
   * `Promise.all` evalúa sus argumentos en orden y de corrido: el primero enciende la bandera y se
   * suspende en su primer `await` —porque `await` sobre una promesa ya resuelta **suspende igual**,
   * agenda una microtarea—, y el segundo corre con la bandera todavía encendida. Y esa lectura
   * suelta es legítima: sin esta red funciona, y en la Etapa 3, con conexiones separadas, también
   * funcionaría.
   *
   * **No es una hipótesis: se midió el 2026-09-02 y pasa.** Hoy no hay ni un lugar del proyecto
   * escrito así —se revisó el código entero—, pero la trampa queda puesta justo donde la Etapa 2
   * mueve las cinco transacciones. Así que si alguien se choca con este error en una consulta que
   * no tiene nada que ver con ninguna transacción: **el error está bien y lo que hay que mirar es
   * el código de afuera**, no esta red. (Antes acá estaba escrito que esto era imposible. No lo es,
   * y un comentario que declara imposible algo que ocurre es peor que no tener comentario: el
   * próximo que se choque con el error va a dudar del error en vez de dudar del comentario.)
   *
   * En la Etapa 3 hay esperas de red de verdad, dos peticiones **sí** se pisan, y una bandera
   * compartida entre todas daría errores falsos todo el tiempo. Es andamio, igual que la cara
   * vieja: se va con ella.
   */
  let transaccionAbierta = false

  /**
   * Arma un juego de la cara nueva. `vigilar` es lo que se pregunta antes de cada consulta: si este
   * objeto tiene permiso de hablarle a la base **en este momento**. Es lo único que distingue a
   * `base` de un `tx`.
   *
   * Recibe el nombre de lo que se pidió —`"uno"`, `"correr"`, `"enTransaccion"`…— porque no todos
   * los casos se explican igual: pedir una transacción adentro de otra no es el mismo error que
   * hacer una consulta suelta con `base` donde iba `tx`, y merece su propia frase.
   */
  function caraNueva(vigilar) {
    return {
      /** Una fila suelta, o `undefined` si la consulta no encontró ninguna. */
      async uno(sql, ...parametros) {
        vigilar("uno")
        return aplanar(cruda.prepare(sql).get(...sinIndefinidos(parametros)))
      },

      /** Todas las filas, como arreglo. Vacío si no hay ninguna. */
      async todas(sql, ...parametros) {
        vigilar("todas")
        return cruda
          .prepare(sql)
          .all(...sinIndefinidos(parametros))
          .map(aplanar)
      },

      /** Escribe. Devuelve cuántas filas cambió y, si insertó, el id que le tocó. */
      async correr(sql, ...parametros) {
        vigilar("correr")
        const resultado = cruda.prepare(sql).run(...sinIndefinidos(parametros))
        return {
          cambios: resultado.changes,
          // Sólo un INSERT deja un id nuevo. Tras un UPDATE o un DELETE, SQLite sigue devolviendo
          // el de la última inserción de esta conexión: un número que no corresponde a nada y que
          // alguien podría usar de buena fe. Mejor decir «no hay». Se mira el SQL porque es la
          // única manera de saberlo sin preguntarle a la base, y en este proyecto toda inserción
          // empieza con INSERT.
          idInsertado: /^\s*(INSERT|REPLACE)/i.test(sql)
            ? Number(resultado.lastInsertRowid)
            : undefined,
        }
      },

      /** Varias sentencias de una sola vez, sin parámetros. Es para el esquema. */
      async ejecutar(sql) {
        vigilar("ejecutar")
        cruda.exec(sql)
      },

      /**
       * Todo lo de adentro se guarda junto o no se guarda nada.
       *
       * `hacer` recibe un **`tx`**, que es un objeto distinto de `base` y tiene sólo la cara nueva.
       * Es a propósito: un `tx.prepare(...)` revienta ahora, en la Etapa 2, en vez de en la 3. Las
       * funciones que ya reciben `{ base }` —como `revisarHorario`— sirven adentro de una
       * transacción sin cambiarles nada: se les pasa el `tx` donde antes iba la base.
       *
       * `BEGIN IMMEDIATE` pide el permiso de escritura al empezar y no a mitad de camino, que es lo
       * que corresponde: se sabe de antemano que se va a escribir. Es el mismo `.immediate()` que
       * usaba `comprobarYGuardar`. Va **afuera** del `try` a propósito: un `BEGIN` que falla no
       * abrió nada, así que no hay que deshacer nada, y meterlo adentro dispararía un `ROLLBACK`
       * sobre una transacción que no existe.
       *
       * ⚠️ **Nada de red adentro de una transacción.** Ni un correo, ni un `fetch`. Acá abajo el
       * `BEGIN`/`COMMIT` es a mano, y una espera de verdad en el medio dejaría la transacción abierta
       * mientras pasan otras cosas. Y en la Etapa 3 la razón se vuelve más fuerte todavía: cada
       * sentencia es un viaje a la red, y una transacción larga es una visita lenta. Hoy el proyecto
       * ya cumple esta regla —el correo de confirmación se manda **afuera**, en `crearCitaYAvisar`—
       * y hay que seguir cumpliéndola.
       */
      async enTransaccion(hacer) {
        vigilar("enTransaccion")

        // Anidar no está soportado y hay que decirlo en voz alta: la `transaction` de
        // better-sqlite3 sí se podía anidar (usaba SAVEPOINT), así que si alguien lo intenta es
        // porque venía funcionando. Sin este aviso, el error que saldría es un `SQLITE_ERROR` de
        // SQLite —«cannot start a transaction within a transaction»—, que no es
        // `SQLITE_CONSTRAINT_UNIQUE`, así que `reservas.js` lo relanzaría y el cliente vería un 500
        // en vez de una explicación.
        if (transaccionAbierta) throw new Error(MENSAJE_TRANSACCION_ANIDADA)

        cruda.exec("BEGIN IMMEDIATE")
        transaccionAbierta = true

        // El `tx` vale mientras dura esta transacción y ni un paso más. Guardarlo en una variable
        // de afuera y usarlo después es el otro error que en la Etapa 3 dejaría la consulta suelta.
        let txVigente = true
        const tx = caraNueva(() => {
          if (!txVigente) throw new Error(MENSAJE_TX_VENCIDO)
        })

        try {
          const resultado = await hacer(tx)
          cruda.exec("COMMIT")
          return resultado
        } catch (falla) {
          try {
            cruda.exec("ROLLBACK")
          } catch {
            // Si el ROLLBACK también falla, la falla que importa es la de arriba: es la que dice
            // qué salió mal de verdad, y `reservas.js` la lee —mira `falla.code`— para contestarle
            // al cliente «ese horario ya no está libre» en vez de un 500. No la tapamos.
            //
            // Y esto no es hipotético: SQLite deshace la transacción **sola** ante un SQLITE_BUSY,
            // así que cuando dos programas se pelean el archivo, el ROLLBACK llega y ya no hay nada
            // que deshacer.
          }
          throw falla
        } finally {
          txVigente = false
          transaccionAbierta = false
        }
      },
    }
  }

  const base = {
    // ── La cara nueva, que desde el final de la Etapa 2 es la única ─────────────────────────
    //
    // La cara vieja —`prepare`, `exec`, `pragma`, `transaction`, `close`— vivió acá mientras los
    // 107 puntos se mudaban de a uno. Se borró el 2026-09-04, al terminar la Etapa 2, cuando el
    // `grep` que la buscaba no encontró a nadie usándola. Borrarla **es** la comprobación: mientras
    // existiera, un punto olvidado seguiría funcionando y nadie se enteraría hasta la Etapa 3.
    //
    // La de `base` se calla mientras haya una transacción abierta. La de un `tx` responde sólo
    // mientras la suya dure.
    ...caraNueva((queSePidio) => {
      if (!transaccionAbierta) return

      // `base.enTransaccion(...)` adentro de otra transacción es **anidar**, y ése es el diagnóstico
      // que sirve. Sin esta distinción saldría «usá tx», quien lo leyera escribiría
      // `tx.enTransaccion(...)` y recién ahí se enteraría de que anidar tampoco se puede: dos pasos
      // para llegar al mismo lugar, y el segundo a las once de la noche.
      throw new Error(queSePidio === "enTransaccion" ? MENSAJE_TRANSACCION_ANIDADA : MENSAJE_USAR_TX)
    }),

    // `cerrar` es de `base` y no de un `tx`: cerrar la conexión no es una consulta, y hacerlo con
    // una transacción abierta no significa nada bueno.
    async cerrar() {
      cruda.close()
    },
  }

  return base
}
