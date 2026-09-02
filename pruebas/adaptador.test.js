// Prueba la cara asincrónica de la base: que devuelva lo mismo que la de siempre.
//
// Existe porque en la Etapa 3 el motor de abajo cambia de `better-sqlite3` a `@libsql/client`, y
// estas pruebas son lo único que dice, sin opinar, que las dos implementaciones se comportan igual.
// Se escribieron antes de la implementación y se vieron fallar primero.

import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { abrirBase } from "../servidor/base-de-datos.js"
import { crearEsquema } from "../servidor/esquema.js"

/** Una base de prueba desechable, con el esquema puesto. Se borra al terminar. */
async function baseDePrueba(contexto) {
  const carpeta = mkdtempSync(join(tmpdir(), "adaptador-prueba-"))
  const base = await abrirBase(join(carpeta, "prueba.sqlite"))
  await crearEsquema(base)

  contexto.after(async () => {
    await base.cerrar()
    rmSync(carpeta, { recursive: true, force: true })
  })

  return base
}

test("`uno` devuelve una fila suelta, y `undefined` cuando no hay ninguna", async (t) => {
  const base = await baseDePrueba(t)

  assert.equal(await base.uno("SELECT * FROM cliente WHERE correo = ?", "nadie@ejemplo.com"), undefined)

  await base.correr(
    "INSERT INTO cliente (nombre, correo, contrasena_cifrada) VALUES (?, ?, ?)",
    "Ana",
    "ana@ejemplo.com",
    "cifrada",
  )

  const fila = await base.uno("SELECT * FROM cliente WHERE correo = ?", "ana@ejemplo.com")
  assert.equal(fila.nombre, "Ana")
  assert.equal(fila.debe_cambiar_contrasena, 0)
})

test("una fila es un objeto común, no algo parecido a un objeto", async (t) => {
  // Importa de verdad: `@libsql/client` devuelve filas con su propia clase, y `deepEqual` contra un
  // objeto escrito a mano falla aunque los datos sean idénticos. El adaptador las aplana.
  const base = await baseDePrueba(t)

  await base.correr("INSERT INTO categoria (nombre) VALUES (?)", "Masaje")
  const fila = await base.uno("SELECT id, nombre FROM categoria")

  assert.deepEqual(fila, { id: 1, nombre: "Masaje" })
  assert.equal(Object.getPrototypeOf(fila), Object.prototype)
})

test("`todas` devuelve un arreglo de verdad, vacío cuando no hay nada", async (t) => {
  const base = await baseDePrueba(t)

  const vacio = await base.todas("SELECT * FROM categoria")
  assert.ok(Array.isArray(vacio))
  assert.equal(vacio.length, 0)

  await base.correr("INSERT INTO categoria (nombre) VALUES (?)", "Masaje")
  await base.correr("INSERT INTO categoria (nombre) VALUES (?)", "Facial")

  const dos = await base.todas("SELECT nombre FROM categoria ORDER BY nombre")
  assert.deepEqual(dos, [{ nombre: "Facial" }, { nombre: "Masaje" }])
})

test("`correr` cuenta las filas que cambió y devuelve el id de la que insertó", async (t) => {
  const base = await baseDePrueba(t)

  const insercion = await base.correr("INSERT INTO categoria (nombre) VALUES (?)", "Masaje")
  assert.equal(insercion.idInsertado, 1)
  assert.equal(typeof insercion.idInsertado, "number")
  assert.equal(insercion.cambios, 1)

  const cambio = await base.correr("UPDATE categoria SET nombre = ? WHERE id = ?", "Masajes", 1)
  assert.equal(cambio.cambios, 1)

  const ninguno = await base.correr("UPDATE categoria SET nombre = ? WHERE id = ?", "X", 999)
  assert.equal(ninguno.cambios, 0)
})

test("`enTransaccion` guarda todo junto cuando sale bien", async (t) => {
  const base = await baseDePrueba(t)

  const resultado = await base.enTransaccion(async (tx) => {
    await tx.correr("INSERT INTO categoria (nombre) VALUES (?)", "Masaje")
    await tx.correr("INSERT INTO categoria (nombre) VALUES (?)", "Facial")
    return "listo"
  })

  assert.equal(resultado, "listo")
  assert.equal((await base.todas("SELECT id FROM categoria")).length, 2)
})

test("`enTransaccion` no deja nada a medias cuando algo falla", async (t) => {
  const base = await baseDePrueba(t)

  await assert.rejects(
    base.enTransaccion(async (tx) => {
      await tx.correr("INSERT INTO categoria (nombre) VALUES (?)", "Masaje")
      throw new Error("me arrepentí")
    }),
    /me arrepentí/,
  )

  assert.equal((await base.todas("SELECT id FROM categoria")).length, 0)
})

test("dentro de la transacción se ve lo que la transacción misma escribió", async (t) => {
  // Es lo que `comprobarYGuardar` necesita: mirar si el horario está libre y guardar, sin que se
  // meta nadie en el medio.
  const base = await baseDePrueba(t)

  await base.enTransaccion(async (tx) => {
    await tx.correr("INSERT INTO categoria (nombre) VALUES (?)", "Masaje")
    const fila = await tx.uno("SELECT nombre FROM categoria WHERE id = 1")
    assert.equal(fila.nombre, "Masaje")
  })
})

test("el índice único de CA-1 rechaza la segunda cita, y con el nombre que reservas.js espera", async (t) => {
  // Ésta es la prueba que cuida el descubrimiento de la Etapa 0. Si el motor cambia y el nombre del
  // error cambia con él, se cae acá y no en producción.
  const base = await baseDePrueba(t)

  await base.correr(
    "INSERT INTO cliente (nombre, correo, contrasena_cifrada) VALUES (?, ?, ?)",
    "Ana",
    "ana@ejemplo.com",
    "cifrada",
  )
  await base.correr("INSERT INTO categoria (nombre) VALUES (?)", "Masaje")
  await base.correr(
    "INSERT INTO servicio (nombre, duracion_minutos, categoria_id) VALUES (?, ?, ?)",
    "Relajante",
    60,
    1,
  )
  await base.correr("INSERT INTO proveedor (nombre) VALUES (?)", "Ana P.")

  const insertarCita = () =>
    base.correr(
      `INSERT INTO cita (cliente_id, servicio_id, proveedor_id, inicio, estado, creada_en, canal)
       VALUES (1, 1, 1, '2026-12-31T15:00:00Z', 'activa', '2026-09-01T14:00:00Z', 'en_linea')`,
    )

  await insertarCita()

  await assert.rejects(insertarCita(), (falla) => {
    assert.equal(falla.code, "SQLITE_CONSTRAINT_UNIQUE")
    return true
  })
})

test("`ejecutar` corre varias sentencias de una vez", async (t) => {
  const base = await baseDePrueba(t)

  await base.ejecutar(`
    INSERT INTO categoria (nombre) VALUES ('Masaje');
    INSERT INTO categoria (nombre) VALUES ('Facial');
  `)

  assert.equal((await base.todas("SELECT id FROM categoria")).length, 2)
})

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Lo que la revisión de calidad del 2026-09-02 encontró que faltaba fijar
//
// Las nueve de acá abajo no prueban funciones nuevas: prueban **promesas que el adaptador hace y
// que ninguna prueba obligaba a cumplir**. Cada una nació de un defecto medido, no imaginado, y
// todas fallarían si en la Etapa 3 el motor nuevo se portara distinto. Ése es su trabajo.
// ─────────────────────────────────────────────────────────────────────────────────────────────

test("un error de adentro de `enTransaccion` sale con su `code` intacto", async (t) => {
  // **La más valiosa de todas.** `reservas.js` mira `falla.code` para decidir qué contestarle a la
  // reserva que perdió la carrera de CA-1: con `SQLITE_CONSTRAINT_UNIQUE` contesta «ese horario ya
  // no está libre», y con cualquier otra cosa relanza y el cliente ve un 500. El `ROLLBACK` del
  // `catch` de `enTransaccion` pasa justo entre el error y quien lo lee, y si tapara el error
  // —reemplazándolo por el suyo— la ruta amable de CA-1 se caería sin que nada se pusiera rojo.
  const base = await baseDePrueba(t)

  await base.correr(
    "INSERT INTO cliente (nombre, correo, contrasena_cifrada) VALUES (?, ?, ?)",
    "Ana",
    "ana@ejemplo.com",
    "cifrada",
  )

  await assert.rejects(
    base.enTransaccion(async (tx) => {
      await tx.correr(
        "INSERT INTO cliente (nombre, correo, contrasena_cifrada) VALUES (?, ?, ?)",
        "Otra Ana",
        "ana@ejemplo.com",
        "cifrada",
      )
    }),
    (falla) => {
      assert.equal(falla.code, "SQLITE_CONSTRAINT_UNIQUE")
      return true
    },
  )

  assert.equal((await base.todas("SELECT id FROM cliente")).length, 1)
})

test("`ejecutar` adentro de una transacción se deshace con ella", async (t) => {
  // Es el camino exacto del que depende `ponerAlDiaElRegistroDeCorreos`: rehace una tabla entera con
  // varios `ejecutar` seguidos, y su promesa es que si algo falla en el medio **no queda nada a
  // medias**. Sin esta prueba, esa promesa no estaba comprobada por nadie.
  const base = await baseDePrueba(t)

  await assert.rejects(
    base.enTransaccion(async (tx) => {
      await tx.ejecutar(`
        INSERT INTO categoria (nombre) VALUES ('Masaje');
        INSERT INTO categoria (nombre) VALUES ('Facial');
      `)

      // Adentro sí se ven: la transacción lee lo que ella misma escribió.
      assert.equal((await tx.todas("SELECT id FROM categoria")).length, 2)

      throw new Error("me arrepentí")
    }),
    /me arrepentí/,
  )

  assert.equal((await base.todas("SELECT id FROM categoria")).length, 0)
})

test("un parámetro `undefined` se guarda como vacío, en vez de reventar", async (t) => {
  // En JavaScript un campo de formulario que no vino **es** `undefined`, así que este caso es el
  // normal y no el raro. `better-sqlite3` lo guarda como vacío sin decir nada; `@libsql/client`
  // tira «undefined cannot be passed as argument to the database». El adaptador lo convierte a
  // `null` al recibirlo, y esta prueba es la que fija que lo siga haciendo.
  //
  // ⚠️ **Hoy esta prueba pasa aunque se saque la conversión** —lo comprobé sacándola—, porque
  // `better-sqlite3` ya guarda el `undefined` como vacío por su cuenta. No protege nada todavía:
  // está puesta para el día que el motor de abajo cambie, y ese día es la que se pone roja.
  const base = await baseDePrueba(t)

  await base.correr(
    "INSERT INTO cliente (nombre, correo, contrasena_cifrada, telefono) VALUES (?, ?, ?, ?)",
    "Ana",
    "ana@ejemplo.com",
    "cifrada",
    undefined,
  )

  const fila = await base.uno("SELECT telefono FROM cliente WHERE correo = ?", "ana@ejemplo.com")
  assert.equal(fila.telefono, null)
})

test("una columna vacía vuelve como `null`, y la clave está en el objeto", async (t) => {
  // Dos promesas en una. Que vuelva `null` y no `undefined` importa porque el código compara contra
  // `null`; y que la clave **esté** aunque esté vacía importa porque `"telefono" in fila` es la
  // manera de distinguir «no tiene teléfono» de «esta consulta no pidió el teléfono».
  const base = await baseDePrueba(t)

  await base.correr(
    "INSERT INTO cliente (nombre, correo, contrasena_cifrada) VALUES (?, ?, ?)",
    "Ana",
    "ana@ejemplo.com",
    "cifrada",
  )

  const fila = await base.uno(
    "SELECT telefono, fecha_nacimiento FROM cliente WHERE correo = ?",
    "ana@ejemplo.com",
  )

  assert.deepEqual(fila, { telefono: null, fecha_nacimiento: null })
  assert.ok("telefono" in fila)
})

test("`idInsertado` sólo significa algo después de un INSERT", async (t) => {
  // Medido el 2026-09-02: tras un `UPDATE` que no cambió ninguna fila, `better-sqlite3` devuelve
  // igual el id de la última inserción —un número que no corresponde a nada y que alguien podría
  // usar de buena fe—, y el motor de la Etapa 3 devuelve `undefined`. Dos respuestas distintas en un
  // caso que ninguna prueba fijaba. Acá se elige una: si no insertó, no hay id.
  const base = await baseDePrueba(t)

  const insercion = await base.correr("INSERT INTO categoria (nombre) VALUES (?)", "Masaje")
  assert.equal(insercion.idInsertado, 1)

  const ninguno = await base.correr("UPDATE categoria SET nombre = ? WHERE id = ?", "X", 999)
  assert.equal(ninguno.cambios, 0)
  assert.equal(ninguno.idInsertado, undefined)
})

test("una transacción adentro de otra se rechaza, y la base sigue usable", async (t) => {
  // `base.transaction` de better-sqlite3 sí se podía anidar, con SAVEPOINT, y `enTransaccion` no.
  // Ese soporte se pierde en la Etapa 2 sin que nadie lo haya decidido, así que se dice en voz alta:
  // el que lo intente recibe una explicación y no un `SQLITE_ERROR` de SQLite, que `reservas.js`
  // relanzaría como un 500. Y después de la negativa la base tiene que seguir sirviendo: si quedara
  // una transacción abierta a medias, la consulta siguiente se colgaría.
  const base = await baseDePrueba(t)

  await assert.rejects(
    base.enTransaccion(async (tx) => {
      await tx.enTransaccion(async () => {})
    }),
    /adentro de otra/,
  )

  const despues = await base.correr("INSERT INTO categoria (nombre) VALUES (?)", "Masaje")
  assert.equal(despues.cambios, 1)
})

test("`base.enTransaccion` adentro de otra también dice que no se puede anidar", async (t) => {
  // El mismo error que la prueba de arriba, pero escrito como lo escribiría cualquiera: llamando a
  // `base.enTransaccion(...)` en vez de a `tx.enTransaccion(...)`. Es **el camino natural**, porque
  // adentro de una transacción uno tiene el `base` a mano.
  //
  // Y es la prueba de que el mensaje que sale es el útil. Este camino toca antes la red de «usá tx»
  // que la de anidamiento, así que sin cuidado contestaría «usá tx»: quien lo leyera escribiría
  // `tx.enTransaccion(...)`, y recién ahí se enteraría de que anidar tampoco se puede. Dos vueltas
  // para el mismo diagnóstico.
  const base = await baseDePrueba(t)

  await assert.rejects(
    base.enTransaccion(async () => {
      await base.enTransaccion(async () => {})
    }),
    /adentro de otra/,
  )

  const despues = await base.correr("INSERT INTO categoria (nombre) VALUES (?)", "Masaje")
  assert.equal(despues.cambios, 1)
})

test("`todas` también devuelve objetos comunes", async (t) => {
  // Lo mismo que ya se le exige a `uno`, pero por el otro camino: son dos implementaciones distintas
  // adentro del adaptador, y aplanar una y olvidarse de la otra es el error fácil.
  const base = await baseDePrueba(t)

  await base.correr("INSERT INTO categoria (nombre) VALUES (?)", "Masaje")
  const [fila] = await base.todas("SELECT id, nombre FROM categoria")

  assert.deepEqual(fila, { id: 1, nombre: "Masaje" })
  assert.equal(Object.getPrototypeOf(fila), Object.prototype)
})

test("usar `base` adentro de `enTransaccion` se rechaza y enseña qué hacer", async (t) => {
  // Ésta es la red que impide el error más caro de la Etapa 2, y conviene entender por qué es una
  // prueba y no un comentario: escribir `base` donde iba `tx` **hoy funciona perfecto**, porque hoy
  // los dos hablan con la misma conexión. En la Etapa 3 esa consulta saldría afuera de la
  // transacción y CA-1 dejaría de estar protegido, sin ninguna señal. Así que la señal se pone acá.
  //
  // El mensaje tiene que nombrar a `tx`: quien lo lea a las once de la noche necesita saber qué
  // escribir, no que se portó mal.
  const base = await baseDePrueba(t)

  await assert.rejects(
    base.enTransaccion(async (tx) => {
      await tx.correr("INSERT INTO categoria (nombre) VALUES (?)", "Masaje")
      await base.uno("SELECT id FROM categoria")
    }),
    (falla) => {
      assert.match(falla.message, /tx/)
      return true
    },
  )

  // La transacción se deshizo entera, y la base quedó sana.
  assert.equal((await base.todas("SELECT id FROM categoria")).length, 0)
  const despues = await base.correr("INSERT INTO categoria (nombre) VALUES (?)", "Facial")
  assert.equal(despues.cambios, 1)
})

test("un `tx` no sirve después de que su `enTransaccion` terminó", async (t) => {
  // La otra mitad de la misma red. Guardarse el `tx` en una variable de afuera y usarlo más tarde es
  // el otro camino por el que una consulta terminaría afuera de toda transacción en la Etapa 3, y
  // hoy también funcionaría sin quejarse.
  const base = await baseDePrueba(t)

  let guardado = null
  await base.enTransaccion(async (tx) => {
    guardado = tx
    await tx.correr("INSERT INTO categoria (nombre) VALUES (?)", "Masaje")
  })

  await assert.rejects(
    guardado.correr("INSERT INTO categoria (nombre) VALUES (?)", "Facial"),
    /ya no sirve/,
  )

  // Y lo que la transacción sí guardó quedó guardado: la negativa no deshace nada.
  assert.equal((await base.todas("SELECT id FROM categoria")).length, 1)
})
