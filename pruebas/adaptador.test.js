// Prueba la cara asincrónica de la base: que devuelva lo mismo que la de siempre.
//
// Existe porque en la Etapa 3 el motor de abajo cambia de `better-sqlite3` a `@libsql/client`, y
// estas pruebas son lo único que dice, sin opinar, que las dos implementaciones se comportan igual.
// Se escribieron antes de la implementación y se vieron fallar primero.

import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { abrirBase } from "../servidor/base-de-datos.js"
import { crearEsquema } from "../servidor/esquema.js"
import { borrarCarpetaDePrueba } from "./ayudas.js"

/**
 * Con qué nombre llegó una violación de la base, mirando primero el nombre fino.
 *
 * **Es la misma cuenta que hace `servidor/reservas.js`, escrita acá a propósito y no importada.**
 * Si se importara, esta prueba diría «reservas.js coincide consigo mismo», que es siempre cierto y
 * no comprueba nada. Escrita aparte, comprueba lo que de verdad importa: que **el motor** ponga el
 * nombre donde el proyecto lo va a buscar.
 */
function nombreDelRechazo(falla) {
  return falla?.cause?.code ?? falla?.code
}

/** Una base de prueba desechable, con el esquema puesto. Se borra al terminar. */
async function baseDePrueba(contexto) {
  const carpeta = mkdtempSync(join(tmpdir(), "adaptador-prueba-"))
  const base = await abrirBase(join(carpeta, "prueba.sqlite"))
  await crearEsquema(base)

  contexto.after(async () => {
    await base.cerrar()
    borrarCarpetaDePrueba(carpeta)
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
  // Ésta es la prueba que cuida cómo `reservas.js` reconoce «alguien ganó la carrera por ese
  // horario». Si el motor cambia y el nombre del error cambia con él, se cae acá y no en producción.
  //
  // **Y ya hizo su trabajo una vez, el 2026-09-04:** al pasar a `@libsql/client` el nombre fino se
  // mudó de `falla.code` a `falla.cause.code`, y `falla.code` pasó a decir `SQLITE_CONSTRAINT` a
  // secas — el mismo texto que devuelve una llave foránea rota y un `CHECK` incumplido. Sin esta
  // prueba, CA-1 habría contestado un 500 en el despliegue con las otras 320 en verde.
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
    assert.equal(nombreDelRechazo(falla), "SQLITE_CONSTRAINT_UNIQUE")
    return true
  })
})

test("una llave foránea rota NO se confunde con el índice único de CA-1", async (t) => {
  // Nació el 2026-09-04, del mismo hallazgo que la de arriba. `falla.code` dice `SQLITE_CONSTRAINT`
  // para las tres violaciones —única, foránea y `CHECK`—, así que un `reservas.js` que mirara sólo
  // ese campo le contestaría «ese horario ya no está libre» a un defecto de programación. Sería un
  // mensaje falso, y de los peores: suena normal, así que nadie lo iría a investigar.
  const base = await baseDePrueba(t)

  await assert.rejects(
    base.correr(
      `INSERT INTO cita (cliente_id, servicio_id, proveedor_id, inicio, estado, creada_en, canal)
       VALUES (999, 999, 999, '2026-12-31T15:00:00Z', 'activa', '2026-09-01T14:00:00Z', 'en_linea')`,
    ),
    (falla) => {
      assert.notEqual(nombreDelRechazo(falla), "SQLITE_CONSTRAINT_UNIQUE")
      assert.equal(nombreDelRechazo(falla), "SQLITE_CONSTRAINT_FOREIGNKEY")
      return true
    },
  )
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
      assert.equal(nombreDelRechazo(falla), "SQLITE_CONSTRAINT_UNIQUE")
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

test("`tx.enTransaccion` dice, con palabras, que no se puede anidar", async (t) => {
  // `base.transaction` de better-sqlite3 sí se podía anidar, con SAVEPOINT, y `enTransaccion` no.
  // Ese soporte se perdió sin que nadie lo haya decidido, así que se dice en voz alta: el que lo
  // intente recibe una explicación y no un `TypeError: cliente.transaction is not a function`, que
  // es lo que sale crudo del motor y no le dice nada a nadie.
  //
  // Y después de la negativa la base tiene que seguir sirviendo: si quedara una transacción abierta
  // a medias, la consulta siguiente se colgaría.
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

test("`base.enTransaccion` adentro de otra se traba, pero no deja la base rota", async (t) => {
  // El mismo intento que la de arriba, escrito por el otro camino: `base.enTransaccion(...)` en vez
  // de `tx.enTransaccion(...)`. Adentro de una transacción uno tiene el `base` a mano, así que es
  // el error natural.
  //
  // **Acá el mensaje NO es el amable, y eso está medido y aceptado** (2026-09-04). `base` es un
  // objeto legítimo que sí sabe abrir transacciones, así que no hay manera de distinguir «me la
  // pediste adentro de otra» de «me la pediste en otra petición» sin una bandera compartida entre
  // todas las peticiones — y una bandera así, con esperas de red de verdad, daría errores falsos
  // cada vez que dos personas usaran la aplicación a la vez. Eso es exactamente lo que hacía el
  // andamio de la Etapa 2 y por qué se quitó acá.
  //
  // Lo que sale es `SQLITE_BUSY`, que es la base diciendo la verdad: ya hay una escritura abierta.
  // Lo que esta prueba fija es lo que sí importa: **que la base quede sana después**. Un error feo
  // se diagnostica; una base trabada, no.
  const base = await baseDePrueba(t)

  await assert.rejects(
    base.enTransaccion(async () => {
      await base.enTransaccion(async () => {})
    }),
    /SQLITE_BUSY/,
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

test("leer con `base` adentro de una transacción NO ve lo que la transacción escribió", async (t) => {
  // ── La prueba más incómoda del archivo, y por eso está ────────────────────────────────────────
  //
  // Escribir `base` donde iba `tx` **no da ningún error** si es una lectura: devuelve un dato viejo,
  // en silencio. Está medido el 2026-09-04 y es exactamente lo que se ve abajo — adentro de una
  // transacción que acaba de insertar una categoría, `base` cuenta **cero**.
  //
  // Ése es el defecto que el andamio de la Etapa 2 existía para cazar, y la razón por la que la
  // Etapa 2 enhebró `tx` por `revisarHorario` y `buscarCitaParaCambiar` en vez de dejar `base`. En
  // `crearCita` esa lectura vieja sería CA-1 comprobando un horario contra una foto anterior.
  //
  // El andamio ya no está —con esperas de red de verdad daría errores falsos—, así que **lo único
  // que queda vigilando esto es que el enhebrado esté bien hecho**. Esta prueba no lo arregla: lo
  // deja escrito, medido y a la vista, para que nadie vuelva a escribir `base` adentro de un
  // `enTransaccion` creyendo que da igual.
  const base = await baseDePrueba(t)

  const cuantasVeLaDeAfuera = await base.enTransaccion(async (tx) => {
    await tx.correr("INSERT INTO categoria (nombre) VALUES (?)", "Masaje")

    // Adentro de la transacción, `tx` sí ve lo suyo.
    const vistaPorTx = await tx.uno("SELECT COUNT(*) AS cuantas FROM categoria")
    assert.equal(vistaPorTx.cuantas, 1)

    // Y `base`, que es otra conexión, no.
    const vistaPorBase = await base.uno("SELECT COUNT(*) AS cuantas FROM categoria")
    return vistaPorBase.cuantas
  })

  assert.equal(cuantasVeLaDeAfuera, 0, "`base` lee de afuera: no ve lo que la transacción escribió")

  // Y una vez confirmada, lo escrito está para todos.
  const alFinal = await base.uno("SELECT COUNT(*) AS cuantas FROM categoria")
  assert.equal(alFinal.cuantas, 1)
})

test("escribir con `base` adentro de una transacción sí se traba", async (t) => {
  // La otra mitad de lo de arriba, y la mitad amable: una **escritura** con `base` mientras hay una
  // transacción abierta no pasa desapercibida — la base dice `SQLITE_BUSY`, porque el permiso de
  // escritura ya lo tiene la transacción. El caso peligroso es el de arriba, el de la lectura.
  const base = await baseDePrueba(t)

  await assert.rejects(
    base.enTransaccion(async (tx) => {
      await tx.correr("INSERT INTO categoria (nombre) VALUES (?)", "Masaje")
      await base.correr("INSERT INTO categoria (nombre) VALUES (?)", "Facial")
    }),
    /SQLITE_BUSY/,
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

  // El motor lo dice con sus palabras —«TRANSACTION_CLOSED: The transaction is closed»— y alcanza:
  // lo que importa es que **se niegue**, no cómo lo diga. Hasta el 2026-09-04 el mensaje lo ponía el
  // andamio de la Etapa 2, que ya no está.
  await assert.rejects(
    guardado.correr("INSERT INTO categoria (nombre) VALUES (?)", "Facial"),
    /TRANSACTION_CLOSED/,
  )

  // Y lo que la transacción sí guardó quedó guardado: la negativa no deshace nada.
  assert.equal((await base.todas("SELECT id FROM categoria")).length, 1)
})
