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
