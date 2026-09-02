# Plan de despliegue — Vercel + Turso, y la pieza 6

> **Para quien lo ejecute (persona o agente):** este plan se sigue etapa por etapa, en orden. Cada
> paso tiene su casilla (`- [ ]`). No se salta la Etapa 0.

**Escrito el 2026-09-02**, sobre el código tal como está hoy. Decisión de plataforma tomada el
2026-08-29 y **no se vuelve a discutir**: Vercel con Turso.

**Meta:** que la aplicación viva en una dirección pública, y que con eso desbloqueado se construya
la pieza 6 completa — **12 de 12 piezas** para la entrega del **8 de setiembre**.

**La forma de la solución:** hoy la base de datos es un archivo al lado del código y se le pregunta
de manera *sincrónica* (se pide un dato y la respuesta llega en el acto). Turso es una base que vive
en la red, así que cada pregunta pasa a ser *asincrónica* (se pide un dato y hay que **esperarlo**).
Ese cambio se contagia hacia arriba por toda la aplicación: 107 puntos del código.

**Cómo se hace sin romper nada:** no se cambia el motor y el código al mismo tiempo. Primero se le
pone a la base actual **una segunda cara** que ya se comporta como si fuera de la red; después se
mueve el código a esa cara nueva, módulo por módulo, con el motor viejo todavía debajo; y sólo al
final se cambia el motor, **sin tocar un solo punto de consulta**.

**Con qué se construye:** Node 20+, Express 5.2.1, `@libsql/client` (la biblioteca de Turso, que
también sabe hablarle a un archivo del disco), Vercel, Turso, GitHub Actions.

---

## La idea que hace que se pueda parar en cualquier etapa

Es una sola, y de ella depende todo el plan:

> **En JavaScript, `await` sobre un valor que no es una promesa devuelve ese valor.**

`await 5` es `5`. `await unaFila` es `unaFila`. No falla, no espera, no cuesta nada.

Eso quiere decir que **se puede escribir toda la aplicación en el idioma asincrónico mientras el
motor de abajo sigue siendo el sincrónico de siempre**. Los `await` quedan puestos y no hacen nada.
Las 302 pruebas siguen en verde porque el comportamiento no cambió ni un milímetro.

Y el día que se cambia el motor, esos `await` que no hacían nada **empiezan a hacer lo que dicen**,
todos juntos, sin editar una línea.

Por eso la etapa peligrosa —convertir 107 puntos— se hace con el motor conocido debajo: si algo se
rompe ahí, la causa es el cambio de idioma y nada más. Y la etapa del motor es un archivo.

---

## Lo que hay hoy, contado y verificado

Corrido el 2026-09-02 sobre este código:

| | |
|---|---|
| `npm test` | **302 pasan, 0 fallan** |
| Puntos que consultan la base | **107** |
| — en `servidor/` | 47 |
| — en `pruebas/` | 49 |
| — en `guiones/` | 11 |
| Transacciones de negocio | **5** |
| Transacción de migración (aparte) | 1, en `base-de-datos.js:84` |
| Manejadores de ruta | 21, de los cuales **sólo 3 ya son `async`** |
| Express | **5.2.1** — importa, y se explica abajo |

**Las 5 transacciones de negocio, con nombre y dirección:**

1. [reservas.js:116](servidor/reservas.js#L116) — `comprobarYGuardar`, la que impide reservar dos
   veces el mismo horario (CA-1). La más delicada de las cinco.
2. [reservas.js:358](servidor/reservas.js#L358) — `cancelar`
3. [reservas.js:402](servidor/reservas.js#L402) — `comprobarYMover` (reagendar)
4. [reservas.js:630](servidor/reservas.js#L630) — `cerrar`
5. [autenticacion.js:274](servidor/rutas/autenticacion.js#L274) — `cambiar`, que gasta el enlace de
   recuperación y guarda la contraseña nueva en un solo movimiento.

La sexta, [base-de-datos.js:84](servidor/base-de-datos.js#L84), rehace la tabla `correo_enviado` en
una base vieja. **No se puede tirar a la basura**: hay dos pruebas que la ejercitan a propósito
(`pruebas/recuperacion.test.js:448` y `:529`, que abren una segunda conexión al archivo para armar
una base con la forma vieja).

**Tres cosas que juegan a favor, y no son poca cosa:**

- **Express 5 sabe esperar.** En Express 4, un manejador `async` que fallaba dejaba la petición
  colgada para siempre. En Express 5 una promesa rechazada va sola al manejador de errores. Sin eso,
  este plan tendría que envolver 21 manejadores a mano.
- **El proyecto ya lee su configuración del entorno**: `PORT`, `SESION_SECRETO`, `RESEND_API_KEY`,
  `CORREO_REMITENTE` y `DIRECCION_PUBLICA` — esta última la dejó puesta la pieza 9.
- **Lo único que la aplicación escribe a disco es la carpeta de la base.** No hay archivos subidos,
  ni caché, ni nada más que mudar.

**Y una trampa de la vez anterior que acá NO aplica:** en `semana6/cancha-total` hubo que pelear con
el *Root Directory* de Vercel (no se puede leer ni escribir con la CLI, hay que usar la API) porque
el proyecto vivía dentro de `semana6/cancha-total/`. **Este repositorio tiene el proyecto en la
raíz**, así que el Root Directory se queda en su valor por omisión y no se toca. Una trampa menos.

---

## Mapa de archivos

**Se crean:**

| Archivo | De qué se hace cargo |
|---|---|
| `servidor/esquema.js` | Todo el SQL que crea tablas e índices, y las migraciones. Sale de `base-de-datos.js`. Existe para poder **no correrlo** en el despliegue |
| `pruebas/adaptador.test.js` | Prueba que la cara nueva de la base se comporta igual que la vieja |
| `api/index.js` | La puerta de entrada de Vercel. Lo único que existe por el despliegue y no por el negocio |
| `servidor/aplicacion-desplegada.js` | Arma la aplicación para el despliegue: conecta, lee la configuración, devuelve el Express ya armado |
| `vercel.json` | Manda todas las direcciones a la función, y dice cómo compilar el CSS |
| `guiones/esquema.js` | Comando para crear el esquema en una base remota (Turso) |
| `guiones/sembrar-remoto.js` | Comando para cargar el catálogo y la cuenta de Personal en Turso |
| `servidor/recordatorios.js` | La pieza 6: a quién le toca recordatorio y cómo se registra |
| `.github/workflows/recordatorios.yml` | La tarea programada de la pieza 6 |
| `pruebas/recordatorios.test.js` | Las pruebas de la pieza 6 |
| `DESPLIEGUE.md` | La bitácora del despliegue, escrita **mientras** pasa, no de memoria |

**Se cambian de fondo:**

| Archivo | Qué le pasa |
|---|---|
| `servidor/base-de-datos.js` | Etapa 1: gana una segunda cara asincrónica. Etapa 3: le cambia el motor por debajo |
| `servidor/index.js` | Sigue siendo el `npm start` de la computadora. No lo usa Vercel |
| Los 8 módulos de `servidor/` que consultan | Sus funciones pasan a ser `async` |
| Los 5 archivos de `servidor/rutas/` | Sus 21 manejadores pasan a ser `async` |
| Los 12 archivos de `pruebas/` que consultan | Sus miradas a la base pasan a ser esperadas |
| `guiones/*.js` | Los 3 |

---

## La puerta de calidad, igual en todas las etapas

Al final de **cada** etapa, sin excepción:

```bash
npm test
```

Y hay que ver, con los ojos, estas dos líneas al final:

```
ℹ pass 302
ℹ fail 0
```

`fail 0` es la que manda. `pass` puede ser **más** de 302 (las etapas 1 y 6 agregan pruebas), nunca
menos. Si `pass` bajó de 302, se borró una prueba sin querer: eso es un fallo de la etapa.

**No se pasa a la etapa siguiente sin haber visto esa salida.** No alcanza con suponerlo.

---

# Etapa 0 — La sonda

**Para qué:** este plan da por ciertas cinco cosas sobre Turso. Si alguna es falsa, el plan cambia
de forma — y es infinitamente más barato descubrirlo hoy, en media hora, que en la Etapa 5 con 107
puntos ya convertidos.

**La que más importa** es la número 2. `servidor/reservas.js:73` dice:

```js
const RECHAZO_DEL_INDICE_UNICO = "SQLITE_CONSTRAINT_UNIQUE"
```

Ese texto es cómo el código reconoce «alguien ganó la carrera por este horario» y contesta
*«horario no disponible»* en vez de reventar. **Si Turso devuelve ese error con otro nombre, CA-1 se
rompe en producción y las 302 pruebas siguen en verde**, porque en la computadora el nombre sí
coincide. Es exactamente la clase de falla que no se ve hasta que le pasa a una persona.

**Nada de código de producción se toca en esta etapa.**

- [ ] **Paso 1: crear la base en Turso**

Con la cuenta de Turso hecha (turso.tech, plan gratis):

```bash
turso db create reservas-bienestar
turso db show reservas-bienestar --url
turso db tokens create reservas-bienestar
```

Guardá las dos salidas: la dirección (empieza con `libsql://`) y el token. **Son credenciales: no
van a ningún archivo del repositorio.**

- [ ] **Paso 2: escribir la sonda**

Es un archivo de usar y tirar. Va en la carpeta temporal, **no en el repositorio**.

Crear `sonda.mjs` fuera del repositorio (por ejemplo en el Escritorio) con esto:

```js
// Sonda de un solo uso. Comprueba cinco supuestos contra la base de Turso de verdad.
import { createClient } from "@libsql/client"

const cliente = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

console.log("── 1. ¿Se puede crear el esquema con el CHECK de dos columnas? ──")
await cliente.execute("DROP TABLE IF EXISTS sonda_cita")
await cliente.execute("DROP TABLE IF EXISTS sonda_correo")
await cliente.execute("DROP TABLE IF EXISTS sonda_cliente")
await cliente.execute(`
  CREATE TABLE sonda_cliente (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL)
`)
await cliente.execute(`
  CREATE TABLE sonda_cita (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id   INTEGER NOT NULL REFERENCES sonda_cliente(id),
    proveedor_id INTEGER NOT NULL,
    inicio       TEXT    NOT NULL,
    estado       TEXT    NOT NULL
  )
`)
await cliente.execute(`
  CREATE UNIQUE INDEX sonda_horario_unico
    ON sonda_cita (proveedor_id, inicio) WHERE estado = 'activa'
`)
await cliente.execute(`
  CREATE TABLE sonda_correo (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id  INTEGER REFERENCES sonda_cliente(id),
    personal_id INTEGER,
    CHECK ((cliente_id IS NULL) <> (personal_id IS NULL))
  )
`)
console.log("   OK: el esquema, el índice parcial y el CHECK se crearon\n")

console.log("── 2. ¿Con qué nombre llega el rechazo del índice único? ──")
await cliente.execute("INSERT INTO sonda_cliente (nombre) VALUES ('uno')")
await cliente.execute(
  "INSERT INTO sonda_cita (cliente_id, proveedor_id, inicio, estado) VALUES (1, 7, '2026-12-31T15:00:00Z', 'activa')",
)
try {
  await cliente.execute(
    "INSERT INTO sonda_cita (cliente_id, proveedor_id, inicio, estado) VALUES (1, 7, '2026-12-31T15:00:00Z', 'activa')",
  )
  console.log("   ⚠️ PROBLEMA GRAVE: aceptó la segunda. El índice parcial no está vigilando.")
} catch (falla) {
  console.log("   nombre de la clase:", falla.constructor.name)
  console.log("   falla.code        :", JSON.stringify(falla.code))
  console.log("   falla.rawCode     :", JSON.stringify(falla.rawCode))
  console.log("   falla.message     :", falla.message)
  console.log(
    falla.code === "SQLITE_CONSTRAINT_UNIQUE"
      ? "   OK: coincide con RECHAZO_DEL_INDICE_UNICO, no hay que cambiar nada"
      : "   ⚠️ NO coincide: hay que ampliar el reconocimiento en servidor/reservas.js",
  )
}
console.log("")

console.log("── 3. ¿Se respetan las llaves foráneas? ──")
try {
  await cliente.execute(
    "INSERT INTO sonda_cita (cliente_id, proveedor_id, inicio, estado) VALUES (99999, 8, '2026-12-31T16:00:00Z', 'activa')",
  )
  console.log("   ⚠️ Las aceptó: las llaves foráneas NO se están respetando.")
  console.log("      No rompe ninguna prueba, pero hay que dejarlo escrito en DESPLIEGUE.md.")
} catch (falla) {
  console.log("   OK: rechazada. falla.code =", JSON.stringify(falla.code))
}
const pragma = await cliente.execute("PRAGMA foreign_keys")
console.log("   PRAGMA foreign_keys devuelve:", JSON.stringify(pragma.rows[0]))
console.log("")

console.log("── 4. ¿Funcionan las transacciones interactivas? ──")
const tx = await cliente.transaction("write")
await tx.execute("INSERT INTO sonda_cliente (nombre) VALUES ('se-deshace')")
const dentro = await tx.execute("SELECT COUNT(*) AS cuantas FROM sonda_cliente")
console.log("   dentro de la transacción hay", dentro.rows[0].cuantas, "clientes")
await tx.rollback()
const fuera = await cliente.execute("SELECT COUNT(*) AS cuantas FROM sonda_cliente")
console.log("   después del rollback hay", fuera.rows[0].cuantas)
console.log(
  Number(fuera.rows[0].cuantas) === 1
    ? "   OK: la transacción se deshizo de verdad"
    : "   ⚠️ el rollback no deshizo nada: hay que rearmar las 5 transacciones con batch",
)
console.log("")

console.log("── 5. ¿Cuánto tarda una visita con muchas consultas seguidas? ──")
// El calendario de la pieza 2 es la pantalla que más pregunta.
for (const cuantas of [1, 10, 40]) {
  const arranque = Date.now()
  for (let i = 0; i < cuantas; i++) {
    await cliente.execute("SELECT COUNT(*) AS cuantas FROM sonda_cita")
  }
  console.log(`   ${String(cuantas).padStart(2)} consultas seguidas: ${Date.now() - arranque} ms`)
}

console.log("\n── Limpieza ──")
await cliente.execute("DROP TABLE sonda_correo")
await cliente.execute("DROP TABLE sonda_cita")
await cliente.execute("DROP TABLE sonda_cliente")
console.log("   listo, la base quedó vacía")
```

- [ ] **Paso 3: correr la sonda**

```bash
cd "$HOME/Desktop"
npm init -y >/dev/null 2>&1
npm install @libsql/client
TURSO_DATABASE_URL="libsql://…" TURSO_AUTH_TOKEN="…" node sonda.mjs
```

- [ ] **Paso 4: leer las cinco respuestas y decidir**

| Lo que dijo la sonda | Qué hacer |
|---|---|
| Punto 2 dice **OK** | Seguir. `reservas.js` no se toca en su parte de reconocer el error |
| Punto 2 dice **NO coincide** | En la Etapa 3, ampliar el reconocimiento: `RECHAZO_DEL_INDICE_UNICO` pasa a ser una **lista** de nombres aceptados, con el que dijo la sonda adentro, y se agrega una prueba que lo fije |
| Punto 2 dice **PROBLEMA GRAVE** | **Parar el plan y avisar.** Sin índice parcial no hay CA-1, y CA-1 es uno de los tres criterios que el curso exige |
| Punto 3 dice que **no** respeta las llaves | No bloquea: ninguna prueba depende de que la base rechace una llave inventada. **Se escribe en `DESPLIEGUE.md`** como diferencia conocida entre la computadora y el despliegue |
| Punto 4 dice **OK** | Seguir con transacciones interactivas, que es lo que este plan usa |
| Punto 4 dice **⚠️** | Las 5 transacciones se rearman con `cliente.batch([...], "write")`, que es atómico en un solo viaje. Cambia la Etapa 3, no la 2 |
| Punto 5: 40 consultas tardan **menos de 2 s** | Seguir |
| Punto 5: 40 consultas tardan **más de 2 s** | Es la trampa 3 ya conocida. Se anota y se ataca **después** de la Etapa 5, con la pantalla real medida — no antes, y no adivinando cuál es la lenta |

- [ ] **Paso 5: escribir lo que dijo, y borrar la sonda**

Crear `DESPLIEGUE.md` en el repositorio con la sección «Lo que la sonda encontró» y **la salida
cruda pegada tal cual**, sin interpretar. Es el mismo criterio de la bitácora anterior: el registro
de la máquina primero, el diagnóstico después.

```bash
rm "$HOME/Desktop/sonda.mjs"
```

- [ ] **Paso 6: la puerta de calidad**

```bash
npm test
```

Tiene que dar `pass 302` / `fail 0`. No se tocó código, así que si acá falla algo, falla por otra
razón y hay que averiguarla antes de seguir.

- [ ] **Paso 7: commit**

```bash
git add DESPLIEGUE.md
git commit -m "docs: la sonda de Turso, y las cinco respuestas que dio"
```

**Si parás en la Etapa 0:** el proyecto está exactamente como estaba, 11 de 12 piezas, 302 en verde,
y con una respuesta escrita a las cinco preguntas que decidían la forma del plan. Nada roto.

---

# Etapa 1 — La segunda cara de la base

**Para qué:** que exista una manera asincrónica de preguntarle a la base, **con el motor de siempre
debajo**, y probada. Ningún punto de consulta se muda todavía.

**Archivos:**
- Modificar: `servidor/base-de-datos.js`
- Crear: `servidor/esquema.js`
- Crear: `pruebas/adaptador.test.js`
- Modificar: `pruebas/ayudas.js`, `guiones/cargar-datos.js`, `servidor/index.js`, `guiones/estado.js`
  (una línea cada uno: llamar al esquema aparte)
- Modificar: `package.json`

- [ ] **Paso 1: instalar la biblioteca de Turso, sin usarla todavía**

```bash
npm install @libsql/client
```

Se instala ahora y se usa en la Etapa 3. Así el `package-lock.json` se mueve una sola vez.

- [ ] **Paso 2: escribir la prueba de la cara nueva, y verla fallar**

Crear `pruebas/adaptador.test.js`:

```js
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
```

> ⚠️ **Si la Etapa 0 dijo que el nombre del error NO coincide**, en la prueba de CA-1 de acá arriba
> se acepta cualquiera de los dos nombres, con un comentario que diga cuál viene de cuál motor. Es
> lo único de este archivo que la Etapa 0 puede cambiar.

- [ ] **Paso 3: verla fallar**

```bash
node --test pruebas/adaptador.test.js
```

Tiene que fallar, y con este motivo: `Cannot find module '../servidor/esquema.js'`. Si fallara por
otra cosa, es que el archivo está mal escrito.

- [ ] **Paso 4: sacar el esquema a su propio archivo**

Crear `servidor/esquema.js`. Se mueve, **tal cual y con todos sus comentarios**, lo que hoy vive en
`servidor/base-de-datos.js` desde la función `crearTablas` hasta el final del archivo:
`crearTablas`, `agregarColumnasQueFaltan`, `ponerAlDiaElRegistroDeCorreos`,
`exigirQueElCatalogoEsteAlDia`, `agregarColumnaSiFalta`, `formaDelRegistroDeCorreos` y
`INDICE_DE_CORREOS_POR_CITA`.

**No se reescribe ni un comentario.** Explican decisiones que costaron sesiones y no las repone
nadie. Lo único que cambia es la mecánica: pasan a la cara asincrónica y se esperan.

La cabeza del archivo nuevo, y la única función que se exporta:

```js
// Todo el SQL que crea tablas e índices, y las migraciones de una base que ya existía.
//
// ── Por qué vive aparte de `base-de-datos.js` (2026-09-02, al preparar el despliegue) ─────────
//
// Hasta hoy, abrir la base y crear las tablas eran la misma cosa: `abrirBase` llamaba a
// `crearTablas`. En una computadora eso no cuesta nada. En el despliegue sí: cada visita a un sitio
// dormido despierta una función nueva, y si abrir la conexión arrastrara **todo el `CREATE TABLE`
// del proyecto**, cada visita fría pagaría decenas de viajes de ida y vuelta a una base que está en
// la red. Es la tercera trampa que dejó escrita el despliegue anterior:
// «una función de Vercel no aguanta muchas consultas seguidas dentro de una misma visita».
//
// Así que se separan las dos cosas. `conectar()` sólo conecta. Esto crea el esquema, y lo llaman
// los que de verdad lo necesitan: `npm run datos`, las pruebas, y una sola vez la base de Turso.
// El despliegue no lo llama nunca.

/**
 * Crea las tablas que falten y pone al día una base que ya existía. Se puede llamar sobre una base
 * con datos: no borra ni cambia nada de lo que haya guardado.
 */
export async function crearEsquema(base) {
  await crearTablas(base)
  await agregarColumnasQueFaltan(base)
}
```

Y adentro, la traducción es siempre la misma y no tiene sorpresas:

| Antes | Ahora |
|---|---|
| `base.exec(sqlLargo)` | `await base.ejecutar(sqlLargo)` |
| `base.prepare(sql).all()` | `await base.todas(sql)` |
| `base.prepare(sql).get()` | `await base.uno(sql)` |
| `base.transaction(() => {…})()` | `await base.enTransaccion(async (tx) => {…})` |
| `base.pragma("foreign_keys = OFF")` | `await base.ejecutar("PRAGMA foreign_keys = OFF")` |

Y cada función que ahora espera algo pasa a ser `async`: `crearTablas`,
`agregarColumnasQueFaltan`, `ponerAlDiaElRegistroDeCorreos`, `exigirQueElCatalogoEsteAlDia`,
`agregarColumnaSiFalta`. `formaDelRegistroDeCorreos` **no**, porque sólo arma un texto.

- [ ] **Paso 5: darle la segunda cara a `base-de-datos.js`**

Reemplazar el cuerpo de `servidor/base-de-datos.js` por esto (la cabecera de comentarios del archivo
original se conserva y se le agrega el bloque nuevo):

```js
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
```

- [ ] **Paso 6: verla pasar**

```bash
node --test pruebas/adaptador.test.js
```

Las 9 pruebas del archivo tienen que pasar.

- [ ] **Paso 7: llamar al esquema desde los cuatro lugares que lo necesitan**

`abrirBase` ya no crea tablas, así que hay que pedirlas donde antes venían solas. Son cuatro sitios y
una línea en cada uno.

En `pruebas/ayudas.js`, dentro de `levantar()`:

```js
    async levantar() {
      base = await abrirBase(rutaBase)
      await crearEsquema(base)
      servidor = crearAplicacion({
```

y arriba, junto a los otros `import`:

```js
import { crearEsquema } from "../servidor/esquema.js"
```

En `guiones/cargar-datos.js`:

```js
const base = await abrirBase(RUTA_DE_LA_BASE)
await crearEsquema(base)
cargarDatosDePrueba(base)
await base.cerrar()
```

con su `import { crearEsquema } from "../servidor/esquema.js"`.

En `servidor/index.js`:

```js
const base = await abrirBase(RUTA_DE_LA_BASE)
await crearEsquema(base)
```

con su import. (`index.js` es un módulo ESM, así que `await` en el nivel de arriba funciona.)

En `guiones/estado.js`, donde hoy hace `new Database(...)`: pasa a `await abrirBase(RUTA_DE_LA_BASE)`
y **no** llama a `crearEsquema` — sólo mira, no crea. Sus 3 consultas se mudan en la Etapa 2H.

> ⚠️ **Un detalle que muerde:** `pruebas/ayudas.js` hace `cargarDatosDePrueba(base)` **después** de
> `levantar()`. Eso sigue igual acá porque `cargarDatosDePrueba` todavía usa la cara vieja. Se muda
> en la Etapa 2H, y ahí pasa a `await cargarDatosDePrueba(base)`.

- [ ] **Paso 8: agregar el comando del esquema a `package.json`**

En `scripts`, después de `"datos"`:

```json
    "esquema": "node guiones/esquema.js",
```

El archivo `guiones/esquema.js` se escribe en la Etapa 5, que es cuando hay una base remota a la que
apuntarle. Poner la línea ahora es sólo para no volver a abrir `package.json`.

- [ ] **Paso 9: la puerta de calidad**

```bash
npm test
```

`fail 0`, y `pass` ahora es **311** (302 + las 9 del adaptador).

- [ ] **Paso 10: comprobar que la aplicación de verdad levanta**

`npm test` no ejecuta `npm start`: es una convención del proyecto y acá importa, porque el Paso 7
tocó justo el arranque.

```bash
npm start
```

Tiene que decir `Reservas en línea levantada en http://localhost:3000`, abrir bien en el navegador,
y dejar entrar con `personal@ejemplo.com` / `Personal123`. `Ctrl + C` para apagarla.

- [ ] **Paso 11: commit**

```bash
git add servidor/base-de-datos.js servidor/esquema.js servidor/index.js \
        pruebas/adaptador.test.js pruebas/ayudas.js guiones/cargar-datos.js \
        guiones/estado.js package.json package-lock.json
git commit -m "refactor: la base gana una cara asincronica, y el esquema sale a su propio archivo"
```

**Si parás en la Etapa 1:** la aplicación funciona exactamente igual que antes, 11 de 12 piezas, 311
pruebas en verde, y existe una manera asincrónica de hablarle a la base **probada y sin usar**. Nada
roto. Ni una consulta se mudó.

---

# Etapa 2 — Los 107 puntos, módulo por módulo

**Para qué:** que todo el código hable el idioma asincrónico, **con el motor de siempre debajo**.
Es la etapa larga y la que más cuidado pide, y también la que menos puede sorprender: si algo se
rompe, la causa es el cambio de idioma, porque no hay otra cosa cambiando.

**Cómo se corta:** en 10 pasos. **Cada paso termina con `npm test` en verde y su propio commit.** Si
la sesión se corta en el medio, se retoma en el paso siguiente y el proyecto está sano.

**El orden no es capricho:** va de las hojas al tronco. Un módulo se muda cuando ya se mudaron
todos los que él usa, así que cada paso deja el proyecto coherente.

## La tabla de traducción

Es la misma en los 107 puntos y no tiene excepciones:

| Antes | Ahora |
|---|---|
| `base.prepare(sql).get(a, b)` | `await base.uno(sql, a, b)` |
| `base.prepare(sql).all(a)` | `await base.todas(sql, a)` |
| `base.prepare(sql).run(a, b)` | `await base.correr(sql, a, b)` |
| `resultado.changes` | `resultado.cambios` |
| `Number(resultado.lastInsertRowid)` | `resultado.idInsertado` (ya viene como número) |
| `base.exec(sqlLargo)` | `await base.ejecutar(sqlLargo)` |
| `base.close()` | `await base.cerrar()` |
| `const f = base.transaction(() => {…}); f()` | `await base.enTransaccion(async (tx) => {…})` |
| `f.immediate()` | igual: `enTransaccion` ya empieza con `BEGIN IMMEDIATE` |

**Y la regla que cierra el cambio:** toda función que ahora tiene un `await` adentro pasa a ser
`async`, y **todos** los que la llaman le ponen `await`. Si un `await` se olvida, la función devuelve
una promesa donde antes venía un dato, y eso casi siempre se ve como `undefined` en una prueba.

**Dentro de una transacción, `tx` reemplaza a `base`.** Las funciones que reciben `{ base }` —como
`revisarHorario({ base, … })` o `buscarCitaParaCambiar({ base, … })`— se llaman con
`{ base: tx, … }`. No hay que cambiarles la firma: `tx` tiene la misma cara.

- [ ] **Paso 2A: los 21 manejadores y los 4 permisos pasan a `async`**

Este paso **no toca una sola consulta**. Sólo pone `async`, y por eso es el más seguro de todos —
pero hay que hacerlo primero, porque a partir de acá agregar un `await` adentro de un manejador es
una palabra y no una reestructuración.

En los 5 archivos de `servidor/rutas/`, los 18 manejadores que hoy son `(pedido, respuesta) => {`
pasan a `async (pedido, respuesta) => {`. Los 3 que ya son `async` se quedan como están.

Y en `servidor/sesion.js`, las 4 funciones de permiso (`exigirSesion`, `exigirCliente`,
`exigirPersonal`, `exigirClienteOPersonal`) pasan a `async`.

Esto es seguro **por la versión de Express**, y conviene dejarlo escrito. Agregar en
`servidor/aplicacion.js`, arriba de `crearAplicacion`:

```js
/**
 * ── Por qué los manejadores pueden ser `async` (2026-09-02) ────────────────────────────────────
 *
 * Desde el despliegue, cada consulta a la base se **espera**, así que todos los manejadores de este
 * proyecto son `async`. Eso es seguro **por la versión de Express que usa el proyecto, y no en
 * general**: en Express 4, un manejador `async` que fallaba dejaba la petición colgada para siempre,
 * porque nadie recogía la promesa rechazada. Express 5 —que es la que declara `package.json`— la
 * lleva sola al manejador de errores, y contesta 500 en vez de quedarse callado.
 *
 * Si alguna vez alguien piensa en bajar Express a la 4, esto es lo que se rompe, y no se ve en
 * ninguna prueba que pase: se ve en una petición que nunca contesta.
 */
```

```bash
npm test    # fail 0, pass 311
git add servidor/rutas/ servidor/sesion.js servidor/aplicacion.js
git commit -m "refactor: los manejadores y los permisos pasan a async, sin tocar consultas"
```

- [ ] **Paso 2B: `sesion.js` y su única consulta**

Muda: `servidor/sesion.js:203` (1 punto).
Toca además: los manejadores del paso anterior que llaman a un permiso, para ponerle `await`.

```bash
npm test    # fail 0, pass 311
git commit -am "refactor: sesion.js consulta esperando"
```

- [ ] **Paso 2C: el catálogo**

Muda: `servidor/catalogo.js` (6), `servidor/rutas/catalogo.js` (2),
`pruebas/catalogo.test.js` (4), `pruebas/categorias.test.js` (1). **13 puntos.**

Las 6 funciones exportadas de `catalogo.js` pasan a `async`, y las 2 de `rutas/catalogo.js` que las
llaman les ponen `await`.

En las pruebas, lo que cambia es cómo miran la base por dentro:

```js
// antes
const fila = entorno.base.prepare("SELECT * FROM servicio WHERE id = ?").get(id)
// ahora
const fila = await entorno.base.uno("SELECT * FROM servicio WHERE id = ?", id)
```

```bash
npm test    # fail 0, pass 311
git commit -am "refactor: el catalogo consulta esperando"
```

- [ ] **Paso 2D: la disponibilidad**

Muda: `servidor/disponibilidad.js` (3), `pruebas/disponibilidad.test.js` (3 consultas + 1 `exec`).
**7 puntos.**

Va después del catálogo porque lo usa. `servidor/tiempo.js` **no se toca**: no consulta la base, sólo
hace cuentas con fechas — y por eso sus 16 funciones se quedan sincrónicas, que es lo correcto.

```bash
npm test    # fail 0, pass 311
git commit -am "refactor: la disponibilidad consulta esperando"
```

- [ ] **Paso 2E: los clientes, Personal, y la pantalla de usuario**

Muda: `servidor/clientes.js` (2), `servidor/personal.js` (5), `servidor/rutas/usuario.js`,
`pruebas/personal.test.js` (6), `pruebas/usuario.test.js`. **~14 puntos.**

`servidor/contrasenas.js`, `servidor/credenciales.js` y `servidor/quien-actua.js` **no consultan la
base**: se quedan sincrónicos.

⚠️ `rutas/personal.js` también llama a `reservas.js`, que todavía es sincrónico. En este paso se muda
sólo lo que usa `personal.js` y `clientes.js`; lo de reservas se termina en el paso 2G. Es normal que
un archivo de rutas se toque en dos pasos.

```bash
npm test    # fail 0, pass 311
git commit -am "refactor: clientes y personal consultan esperando"
```

- [ ] **Paso 2F: el correo**

Muda: `servidor/correo.js` (3), `pruebas/correo.test.js` (2),
`pruebas/contrasenas-y-correos.test.js` (3). **8 puntos.**

`servidor/plantillas-de-correo.js` y `servidor/enviador-resend.js` **no consultan la base**: el
primero arma texto, el segundo habla con Resend. No se tocan.

⚠️ **Acá vive la regla del correo y la transacción.** `correo.js` registra en `correo_enviado` cada
intento, y ese registro **queda afuera de cualquier transacción de negocio** porque mandar un correo
habla con la red. Ya está así hoy —el correo sale en `crearCitaYAvisar`, después de que la cita se
guardó— y hay que dejarlo así.

```bash
npm test    # fail 0, pass 311
git commit -am "refactor: el registro de correos consulta esperando"
```

- [ ] **Paso 2G: las reservas y sus cuatro transacciones**

**Es el paso más delicado del plan entero.** Muda: `servidor/reservas.js` (10 puntos y **4 de las 5
transacciones**), `servidor/rutas/citas.js`, lo que quedó de `servidor/rutas/personal.js`,
`pruebas/reservas.test.js` (6), `pruebas/cancelar-y-reagendar.test.js` (7),
`pruebas/cierre-de-citas.test.js` (6). **~30 puntos.**

Así queda `comprobarYGuardar`, que es la que hay que hacer bien. Reemplaza el cuerpo de `crearCita`
desde `const comprobarYGuardar` hasta el `catch`, **conservando todos los comentarios que ya
están**:

```js
  try {
    // `enTransaccion` empieza con BEGIN IMMEDIATE, que pide el permiso de escritura al empezar y no
    // a mitad de camino. Es lo que corresponde acá: se sabe de antemano que se va a escribir. Es el
    // mismo `.immediate()` que este código pedía antes a mano.
    return await base.enTransaccion(async (tx) => {
      // `tx` va donde antes iba `base`: adentro de la transacción hay que preguntarle a ella, no a
      // la conexión de afuera, o la comprobación miraría una foto vieja.
      const revision = await revisarHorario({ base: tx, proveedorId, inicio, ahora, quien })

      if (revision === "hoy_o_pasado") return { ok: false, motivo: "mismo_dia" }
      if (revision === "ya_empezo") return { ok: false, motivo: "horario_ya_empezo" }
      if (revision !== "disponible") return { ok: false, motivo: "horario_no_disponible" }

      const guardada = await tx.correr(
        `INSERT INTO cita
           (cliente_id, servicio_id, proveedor_id, inicio, estado, creada_en, canal,
            personal_id_creador)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        clienteId,
        servicioId,
        proveedorId,
        inicio,
        ESTADO_ACTIVA,
        escribirMomento(ahora),
        canal,
        personalIdCreador,
      )

      // Las otras cuatro columnas de la tabla quedan vacías a propósito: las dos de cancelación las
      // llena la pieza 5 cuando alguien cancela, y las dos de cierre la pieza 8.
      return {
        ok: true,
        cita: {
          id: guardada.idInsertado,
          servicioId,
          proveedorId,
          inicio,
          estado: ESTADO_ACTIVA,
          canal,
        },
      }
    })
  } catch (falla) {
    // Acá se cae la reserva que perdió la carrera de CA-1: pasó la comprobación porque el horario
    // todavía estaba libre cuando la miró, y el índice único la rechazó al guardar.
    if (falla.code === RECHAZO_DEL_INDICE_UNICO) {
      return { ok: false, motivo: "horario_no_disponible" }
    }
    throw falla
  }
```

> ⚠️ **El `await` delante de `base.enTransaccion` no es decorativo.** Sin él, la promesa se va del
> `try` antes de fallar, el `catch` no la ve, y **el rechazo del índice único deja de convertirse en
> «horario no disponible»**: se vuelve una promesa rechazada que Express contesta como 500. CA-1
> pasaría de un mensaje claro a un error del servidor. Es el error más fácil de cometer en toda esta
> etapa y el más caro.

Las otras tres (`cancelar`, `comprobarYMover`, `cerrar`) son la misma forma, más simples, y las tres
llaman a `buscarCitaParaCambiar({ base: tx, … })` en vez de `{ base, … }`.

**Y hay una prueba que se vuelve más exigente sola, para bien.** CA-1
(`pruebas/reservas.test.js:298`) manda dos reservas con `Promise.all`. Hasta hoy, con el motor
sincrónico, las dos se atendían una después de la otra sin remedio, así que la que perdía la carrera
casi siempre la perdía en la **comprobación**, y el índice único era un cinturón que no se usaba.
Desde la Etapa 3 hay esperas de verdad y las dos peticiones **sí** se pisan, así que el camino del
índice único empieza a recorrerse en serio. La prueba no cambia ni un valor esperado: sigue pidiendo
`[201, 409]`. Lo que cambia es que ahora comprueba algo más difícil.

```bash
npm test    # fail 0, pass 311
git commit -am "refactor: las reservas y sus cuatro transacciones, esperando"
```

- [ ] **Paso 2H: la autenticación, la recuperación, y la quinta transacción**

Muda: `servidor/recuperacion.js` (3), `servidor/rutas/autenticacion.js` (8 y **la quinta
transacción**), `pruebas/autenticacion.test.js` (1), `pruebas/cambio-de-contrasena.test.js` (1),
`pruebas/recuperacion.test.js` (9). **~22 puntos.**

La transacción de `autenticacion.js:274` queda así, con sus comentarios intactos:

```js
    const seCambio = await base.enTransaccion(async (tx) => {
      if (!(await marcarEnlaceComoUsado({ base: tx, token: encontrado.token, ahora }))) return false
      …
      return true
    })

    if (!seCambio) {
      return respuesta.status(422).json({ error: "token_invalido" })
    }
```

Fijate en el cambio de nombre: antes `cambiar` era **la función** y se la llamaba después
(`if (!cambiar())`). Ahora `enTransaccion` ya la corrió, así que la variable guarda **el resultado**
y se llama `seCambio`. Dejarla llamándose `cambiar` haría leer `if (!cambiar())` como si todavía
hubiera algo por ejecutar, y eso es justo lo que ya no hay.

⚠️ `pruebas/recuperacion.test.js:448` y `:529` abren una **segunda** conexión con
`new Database(rutaBase)` para armar una base con la forma vieja y comprobar la migración. En este
paso se dejan con `new Database` —siguen funcionando— y se mudan en la Etapa 3, que es cuando
`better-sqlite3` desaparece.

```bash
npm test    # fail 0, pass 311
git commit -am "refactor: la autenticacion y la recuperacion, esperando"
```

- [ ] **Paso 2I: los tres guiones**

Muda: `guiones/datos-de-prueba.js` (8 consultas + 1 `exec`), `guiones/estado.js` (3),
`guiones/cargar-datos.js`. Y en `pruebas/ayudas.js`, `cargarDatosDePrueba(base)` pasa a
`await cargarDatosDePrueba(base)`. **~13 puntos.**

`guiones/estado.js` deja de importar `Database` y usa `abrirBase`.

Y hay que correr los comandos, que `npm test` no corre:

```bash
npm run datos     # tiene que rehacer la base y listar el catálogo
npm run estado    # tiene que contar el estado sin levantar nada
```

```bash
npm test    # fail 0, pass 311
git commit -am "refactor: los tres guiones consultan esperando"
```

- [ ] **Paso 2J: borrar la cara vieja, que es la comprobación de verdad**

Ahora no debería quedar nadie usándola. Comprobarlo, no suponerlo:

```bash
grep -rn "\.prepare(\|\.transaction(\|\.pragma(\|base\.exec(\|base\.close()" servidor/ pruebas/ guiones/
```

**Tiene que devolver exactamente tres cosas:** las llamadas de `new Database` en
`pruebas/recuperacion.test.js` (2), y lo de adentro de `envolver()` en `base-de-datos.js`, que le
habla al motor crudo y es su trabajo.

Si aparece cualquier otra, es un punto que se olvidó. Se muda y se vuelve a correr el `grep`.

Cuando la lista esté limpia, **borrar las cinco líneas de la cara vieja** de `envolver()` en
`servidor/base-de-datos.js` (`prepare`, `exec`, `pragma`, `transaction`, `close`) y el comentario que
anunciaba que eran temporales.

```bash
npm test    # fail 0, pass 311
npm start   # y abrirla en el navegador: entrar, ver el catálogo, reservar, cancelar
git commit -am "refactor: se borra la cara sincronica de la base, ya no la usa nadie"
```

**Si parás en la Etapa 2:** la aplicación funciona igual que el primer día, 11 de 12 piezas, 311
pruebas en verde, y **todo el código está listo para una base de la red** aunque todavía use el
archivo de siempre. No hay dirección pública. Nada roto. Y lo más pesado del trabajo ya está hecho.

---

# Etapa 3 — Cambiar el motor

**Para qué:** que la base sea `@libsql/client` en vez de `better-sqlite3`, en todas partes —
computadora, pruebas y GitHub incluidos.

**Es un archivo.** Y esa es la prueba de que la Etapa 2 se hizo bien: si hubiera que tocar más de
uno, algo quedó mal cortado.

**Por qué el mismo motor también en las pruebas, y no sólo en producción:** porque `@libsql/client`
sabe hablarle a un archivo del disco (`file:…`). Dejar `better-sqlite3` para la computadora y las
pruebas, y Turso sólo para el despliegue, significaría que **las 311 pruebas nunca probarían el
código que de verdad corre para la gente**. Un motor en los dos lados es lo que hace que verde
signifique algo. De paso desaparece `better-sqlite3`, que hay que compilar al instalar y ya rompió
la integración continua una vez por exigir Node 22.

**Archivos:**
- Modificar: `servidor/base-de-datos.js` (el único de fondo)
- Modificar: `pruebas/recuperacion.test.js:448` y `:529`
- Modificar: `package.json`

- [ ] **Paso 1: reescribir `base-de-datos.js` sobre `@libsql/client`**

```js
// Abre la base de datos. Es el único archivo que sabe con qué biblioteca se le habla.
//
// La base es **SQLite** igual que siempre, pero a través de `@libsql/client` en vez de
// `better-sqlite3`. El cambio de biblioteca no cambia el idioma: es el mismo SQL, las mismas tablas
// y las mismas consultas. Lo que agrega es un **segundo destino posible**: una base alojada en
// Turso, alcanzable por red, para cuando la aplicación no vive en una computadora.

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
function comoArchivo(ruta) {
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
  return conectarA({ url: comoArchivo(rutaArchivo), esArchivo: true })
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

  // Las llaves foráneas. Lo que Turso hace con esta línea está medido y escrito en `DESPLIEGUE.md`,
  // sección «Lo que la sonda encontró» — no se supone.
  await cliente.execute("PRAGMA foreign_keys = ON")

  return envolver(cliente)
}

function envolver(cliente) {
  return {
    async uno(sql, ...parametros) {
      const resultado = await cliente.execute({ sql, args: parametros })
      return aplanar(resultado.rows[0])
    },

    async todas(sql, ...parametros) {
      const resultado = await cliente.execute({ sql, args: parametros })
      return resultado.rows.map(aplanar)
    },

    async correr(sql, ...parametros) {
      const resultado = await cliente.execute({ sql, args: parametros })
      return {
        cambios: resultado.rowsAffected,
        // Viene como número grande (`BigInt`) y el resto del proyecto trabaja con números comunes.
        idInsertado:
          resultado.lastInsertRowid === undefined ? undefined : Number(resultado.lastInsertRowid),
      }
    },

    async ejecutar(sql) {
      await cliente.executeMultiple(sql)
    },

    /**
     * Todo lo de adentro se guarda junto o no se guarda nada.
     *
     * ⚠️ **Nada de red adentro.** Ni un correo, ni un `fetch`. Cada sentencia de acá es un viaje a
     * la base, y una transacción que además espera a otro servicio deja una visita lenta y una
     * transacción abierta de más. El proyecto ya cumple esta regla: el correo de confirmación se
     * manda **afuera**, en `crearCitaYAvisar`, después de que la cita quedó guardada.
     */
    async enTransaccion(hacer) {
      // "write" es lo mismo que pedía `BEGIN IMMEDIATE`: el permiso de escritura al empezar y no a
      // mitad de camino. Se sabe de antemano que se va a escribir.
      const transaccion = await cliente.transaction("write")
      try {
        const resultado = await hacer(envolver(transaccion))
        await transaccion.commit()
        return resultado
      } catch (falla) {
        await transaccion.rollback()
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
```

Fijate que `envolver` se usa **también** para la transacción: el objeto que devuelve
`cliente.transaction()` tiene `execute` con la misma forma, así que la misma envoltura le sirve. Eso
es lo que hace que `tx` tenga la misma cara que la base, que es de lo que depende toda la Etapa 2.

- [ ] **Paso 2: si la Etapa 0 dijo que el nombre del error no coincide**

Sólo en ese caso, en `servidor/reservas.js`, `RECHAZO_DEL_INDICE_UNICO` pasa a ser una lista:

```js
/**
 * Con qué nombre llega el rechazo del índice único de CA-1.
 *
 * Son dos porque **el motor de la base decide el nombre**, y el proyecto corre contra dos destinos:
 * el archivo del disco en esta computadora y en las pruebas, y la base de Turso en el despliegue.
 * El segundo nombre salió de medirlo, no de suponerlo: está en `DESPLIEGUE.md`, «Lo que la sonda
 * encontró». `pruebas/adaptador.test.js` fija el del archivo, para que un cambio de biblioteca no
 * lo mueva sin que nadie se entere.
 */
const RECHAZOS_DEL_INDICE_UNICO = ["SQLITE_CONSTRAINT_UNIQUE", "<el que dijo la sonda>"]
```

y las dos comparaciones (`reservas.js:163` y `:434`) pasan a
`if (RECHAZOS_DEL_INDICE_UNICO.includes(falla.code))`.

- [ ] **Paso 3: las dos conexiones sueltas de `recuperacion.test.js`**

`new Database(rutaBase)` pasa a una segunda conexión de la misma biblioteca:

```js
import { createClient } from "@libsql/client"
…
const vieja = createClient({ url: "file:" + rutaBase.replace(/\\/g, "/") })
```

y sus llamadas pasan a `await vieja.execute(…)` / `vieja.close()`. Son dos bloques y hacen algo
concreto: armar una base con la forma de antes de la pieza 9 para comprobar que la migración la pone
al día. Por eso no se pueden borrar.

- [ ] **Paso 4: sacar `better-sqlite3`**

```bash
npm uninstall better-sqlite3
grep -rn "better-sqlite3" servidor/ pruebas/ guiones/ package.json
```

El `grep` tiene que devolver **nada**, salvo comentarios que cuenten la historia a propósito.

- [ ] **Paso 5: la puerta de calidad, y con más cuidado que nunca**

```bash
npm test
```

`fail 0`, `pass 311`. **Y ésta es la corrida donde por primera vez los `await` esperan de verdad**,
así que acá es donde puede aparecer un `await` olvidado en la Etapa 2. Si algo falla, casi seguro es
eso: un dato que llega como promesa. Correr la suite **tres veces** antes de creerle:

```bash
npm test && npm test && npm test
```

Si una prueba pasa unas veces y otras no, es una carrera de verdad entre dos conexiones al mismo
archivo. La respuesta es `busy_timeout` (ya está puesto) y, si hiciera falta, correr las pruebas de a
una: en `package.json`, `"test": "node --test --test-concurrency=1"`.

- [ ] **Paso 6: la aplicación y los comandos, a mano**

```bash
npm run datos
npm run estado
npm start
```

Y en el navegador, el recorrido completo: entrar como cliente, ver el catálogo, ver el calendario,
reservar, ver la cita, cancelarla. Después entrar como Personal y reservar en nombre de alguien.

- [ ] **Paso 7: commit**

```bash
git add -A
git commit -m "refactor: la base pasa a @libsql/client, con el archivo local como destino por omision"
git push
```

Y **mirar la pestaña Actions de GitHub**: tiene que quedar verde en Node 20 y en Node 24, sin ninguna
credencial configurada. Si sólo pasa en 24, es cosa de la biblioteca nueva y hay que resolverlo acá
mismo, no más adelante.

**Si parás en la Etapa 3:** la aplicación funciona igual, 11 de 12 piezas, 311 pruebas en verde en
las dos versiones de Node, y **corriendo sobre la misma biblioteca que va a usar en el despliegue**.
Sigue sin dirección pública. Nada roto. Y lo difícil ya pasó.

---

# Etapa 4 — La puerta de Vercel

**Para qué:** que la aplicación se pueda publicar. Todavía **sin** Turso: en esta etapa se comprueba
que Vercel la construye, la sirve y falla **con un mensaje claro** por no tener base. Que falle bien
es el resultado esperado de esta etapa, y es exactamente la falla que el despliegue anterior dejó
documentada.

**Archivos:**
- Crear: `api/index.js`, `servidor/aplicacion-desplegada.js`, `vercel.json`
- Modificar: `.gitignore`, `.env.ejemplo`

- [ ] **Paso 1: armar la aplicación para el despliegue**

Crear `servidor/aplicacion-desplegada.js`:

```js
// Arma la aplicación como la necesita el despliegue. Es el equivalente de `index.js`, sin el
// `listen()`: en Vercel no hay un servidor que escuche un puerto, hay una función que se despierta
// cuando alguien visita el sitio.
//
// Lo que este archivo hace de menos que `index.js`, y es a propósito:
//   - **no crea el esquema.** Se crea una vez con `npm run esquema`. Hacerlo en cada visita fría
//     serían decenas de viajes a una base que está en la red (la trampa 3 del despliegue anterior).
//   - **no cuenta si la base está vacía.** Ese aviso es para quien levanta la aplicación en su
//     computadora y puede leer la terminal. En el despliegue nadie lo lee, y cuesta una consulta en
//     cada visita fría.

import { conectar } from "./base-de-datos.js"
import { crearAplicacion } from "./aplicacion.js"
import { crearEnviadorResend } from "./enviador-resend.js"

export async function crearAplicacionDesplegada() {
  const base = await conectar()

  // En el despliegue **sí** se exige. Sin firma, cada copia de la función se inventaría la suya y
  // una sesión abierta en una dejaría de valer en la siguiente: la gente se caería de la sesión sin
  // motivo aparente. En la computadora eso no se nota porque hay un solo proceso, y por eso
  // `index.js` allá se conforma con avisar.
  const sesionSecreto = process.env.SESION_SECRETO
  if (!sesionSecreto) {
    throw new Error(
      "Falta configurar SESION_SECRETO. En el despliegue hay varias copias de la función " +
        "atendiendo, y sin una firma compartida las sesiones se cerrarían solas al cambiar de copia.",
    )
  }

  const enviador = crearEnviadorResend({
    claveApi: process.env.RESEND_API_KEY,
    remitente: process.env.CORREO_REMITENTE,
  })

  // Acá `DIRECCION_PUBLICA` deja de ser un detalle y pasa a ser lo que hace que los enlaces del
  // correo sirvan: es la dirección del sitio publicado. Sin ella, los enlaces de la pieza 9 —y los
  // de la pieza 6— dirían `localhost` y no abrirían en el teléfono de nadie.
  const direccionPublica = process.env.DIRECCION_PUBLICA
  if (!direccionPublica) {
    throw new Error(
      "Falta configurar DIRECCION_PUBLICA con la dirección del sitio publicado. Sin ella los " +
        "enlaces que salen por correo dirían «localhost», que quiere decir «esta computadora».",
    )
  }

  return crearAplicacion({ base, sesionSecreto, enviador, direccionPublica })
}
```

- [ ] **Paso 2: la puerta**

Crear `api/index.js`:

```js
// La puerta de entrada de Vercel.
//
// Vercel busca por convención una carpeta `api/` y convierte cada archivo de adentro en una función
// que se despierta cuando alguien visita el sitio. Este archivo no hace nada propio: consigue la
// aplicación de Express y le entrega la visita. Es el único pedazo de código que existe por el
// despliegue y no por el negocio, y por eso vive aparte.
//
// ── Por qué la aplicación se arma acá adentro y no al cargar el archivo ────────────────────────
//
// Es la lección más caras del despliegue anterior. Allá, el archivo principal consultaba la base
// **al cargarse**, antes de atender a nadie. Resultado: el despliegue se completó sin un solo error
// —Vercel marcó `Ready`— y la primera visita devolvió **500**. La falla no aparece al construir,
// aparece al atender, y por eso el estado del despliegue no la delata.
//
// Acá el trabajo se hace en la primera visita, dentro de un `try`. Si la base no está configurada,
// se ve **un mensaje que dice qué falta** en vez de un 500 pelado. Y `listaParaAtender` se limpia
// cuando falla, para que el próximo intento vuelva a probar en vez de quedarse pegado para siempre
// a un error viejo.

import { crearAplicacionDesplegada } from "../servidor/aplicacion-desplegada.js"

let listaParaAtender = null

export default async function atender(pedido, respuesta) {
  try {
    if (!listaParaAtender) {
      listaParaAtender = crearAplicacionDesplegada().catch((falla) => {
        listaParaAtender = null
        throw falla
      })
    }

    const aplicacion = await listaParaAtender
    return aplicacion(pedido, respuesta)
  } catch (falla) {
    // Queda en el registro de Vercel (`vercel logs`) **y** se le dice a quien visitó. El mensaje es
    // el de la falla porque estas fallas son de configuración, no de la gente: dicen exactamente qué
    // variable falta.
    console.error("La aplicación no pudo arrancar:", falla)
    respuesta.status(500).json({ error: "aplicacion_no_configurada", detalle: falla.message })
  }
}
```

- [ ] **Paso 3: la configuración de Vercel**

Crear `vercel.json`:

```json
{
  "buildCommand": "npm run estilos",
  "outputDirectory": "publico",
  "rewrites": [{ "source": "/(.*)", "destination": "/api" }]
}
```

Las tres líneas hacen falta, y cada una arregla un problema distinto:

- **`buildCommand`** compila el SCSS. `publico/css/` está en `.gitignore` —se genera con un comando,
  no se sube— así que **sin esta línea el sitio se publica sin una gota de CSS**. Es la clase de
  falla que no rompe nada y se ve horrible.
- **`outputDirectory`** hace que Vercel sirva los archivos de `publico/` **directamente**, sin
  despertar la función. El HTML, el CSS, las fuentes y las imágenes dejan de costar una visita a una
  función.
- **`rewrites`** manda todo lo demás a la función. Sin esto la función contestaría sólo en `/api` y
  la página de inicio quedaría en blanco.

> ⚠️ Si Vercel se queja del `outputDirectory`, se saca esa línea y listo: `express.static` de
> `aplicacion.js` sigue sirviendo `publico/` como lo hace hoy. Se pierde velocidad, no
> funcionalidad. **`buildCommand` no se saca nunca.**

- [ ] **Paso 4: que `.vercel` no se suba**

En `.gitignore`, junto a `.env`:

```
# La carpeta que Vercel deja al vincular el proyecto: tiene identificadores de la cuenta
.vercel
```

- [ ] **Paso 5: anotar las dos variables nuevas en `.env.ejemplo`**

Al final del archivo:

```
# --- Desde el despliegue (2026-09-02) ---
# La base de datos alojada en Turso. **Estos dos nombres no se eligieron acá**: son los que Turso
# pone solo cuando se conecta el proyecto en Vercel, así que tienen que decir exactamente esto.
# Vacías en esta computadora: sin ellas la aplicación usa el archivo de `datos/`, que es lo que
# querés para trabajar y para `npm test`. En el despliegue son obligatorias.
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
```

- [ ] **Paso 6: la puerta de calidad**

```bash
npm test
```

`fail 0`, `pass 311`. Nada de esta etapa toca el camino que corren las pruebas — y comprobarlo es
justamente el punto.

- [ ] **Paso 7: publicar, y esperar que falle bien**

```bash
npx vercel login
npx vercel link          # proyecto nuevo, dentro de la cuenta de la estudiante
npx vercel --prod
```

El Root Directory se queda como viene: **este repositorio tiene el proyecto en la raíz**, y por eso
la primera trampa del despliegue anterior no aplica acá.

Lo que tiene que pasar:

| Comprobación | Resultado esperado |
|---|---|
| El despliegue termina | `Ready` |
| Se abre la dirección | **500**, con `{"error":"aplicacion_no_configurada"}` y el detalle diciendo qué variable falta |
| `npx vercel logs <url>` | El mismo mensaje, con nombre y apellido |

**Que falle así es el éxito de esta etapa.** Falla diciendo qué le falta, en la primera visita, y no
en silencio. Comparalo con el despliegue anterior, donde el mismo momento fue un
`SQLITE_CANTOPEN: unable to open database file` que hubo que ir a buscar en un rastro de siete
líneas.

- [ ] **Paso 8: escribirlo en `DESPLIEGUE.md`, con la salida cruda pegada**

Sección «La primera publicación, y por qué falló a propósito». El registro de la máquina primero, el
diagnóstico después. Mismo criterio que la bitácora anterior.

- [ ] **Paso 9: commit**

```bash
git add api/ vercel.json servidor/aplicacion-desplegada.js .gitignore .env.ejemplo DESPLIEGUE.md
git commit -m "feat: la puerta de Vercel, que falla diciendo que le falta la base"
git push
```

**Si parás en la Etapa 4:** la aplicación funciona igual en la computadora, 11 de 12 piezas, 311
pruebas en verde, y hay una dirección pública que **contesta diciendo qué le falta**. No sirve para
la presentación todavía. Nada roto.

---

# Etapa 5 — Turso en producción

**Para qué:** que la dirección pública sea la aplicación de verdad, con sus datos.

**Archivos:**
- Crear: `guiones/esquema.js`, `guiones/sembrar-remoto.js`
- Modificar: `package.json`, `README.md`, `DESPLIEGUE.md`

- [ ] **Paso 1: el comando que crea el esquema donde se le diga**

Crear `guiones/esquema.js`:

```js
// El comando `npm run esquema`: crea las tablas y los índices en la base a la que apunten las
// variables de entorno. **No carga ni un dato** y no borra nada: se puede correr las veces que haga
// falta.
//
// Existe porque el despliegue no crea el esquema en cada visita, a propósito
// (`servidor/esquema.js` explica por qué). Alguien tiene que crearlo una vez, y ese alguien es esto.
//
//   TURSO_DATABASE_URL=libsql://… TURSO_AUTH_TOKEN=… npm run esquema
//
// Sin esas variables trabaja sobre el archivo de `datos/`, que es lo que hace `npm run datos`.

import "dotenv/config"

import { conectar, destinoDeLaBase } from "../servidor/base-de-datos.js"
import { crearEsquema } from "../servidor/esquema.js"

const destino = destinoDeLaBase()
console.log(`Creando el esquema en: ${destino.esArchivo ? destino.url : "la base de Turso"}`)

const base = await conectar()
await crearEsquema(base)

const tablas = await base.todas(
  "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
)
console.log(`Listo. ${tablas.length} tablas: ${tablas.map((una) => una.name).join(", ")}`)

await base.cerrar()
```

- [ ] **Paso 2: correrlo contra Turso**

```bash
TURSO_DATABASE_URL="libsql://…" TURSO_AUTH_TOKEN="…" npm run esquema
```

Tiene que listar las **12** tablas: `categoria`, `cita`, `cliente`, `configuracion_negocio`,
`correo_enviado`, `feriado`, `horario_negocio`, `personal`, `proveedor`, `servicio`,
`servicio_proveedor`, `token_recuperacion`. Contalas contra `servidor/esquema.js`; si falta alguna, se
cortó en el medio y hay que ver por qué.

- [ ] **Paso 3: el comando que siembra el catálogo**

Crear `guiones/sembrar-remoto.js`. Carga lo que es **configuración** y sin lo cual la aplicación no
tiene nada que mostrar: las categorías, los servicios, los proveedores, el horario del negocio, los
feriados, los datos del negocio y la cuenta de Personal.

Reusa `cargarDatosDePrueba` de `guiones/datos-de-prueba.js`, que ya sabe hacerlo todo y ya borra
primero en el orden correcto (una convención del proyecto: una tabla que apunta a otra se agrega al
borrado, y primero de todo).

```js
// El comando `npm run sembrar`: carga el catálogo, el horario, los feriados y la cuenta de Personal
// en la base a la que apunten las variables de entorno.
//
// Es lo mismo que hace `npm run datos` en la computadora, pero **sin borrar el archivo primero**:
// contra una base de la red no hay archivo que borrar, y `cargarDatosDePrueba` ya vacía las tablas
// en el orden correcto.
//
// ⚠️ **Se lleva las citas y las cuentas de cliente que haya.** Es para preparar la base, no para
// mantenerla: se corre una vez, antes de que exista la primera cita de verdad.

import "dotenv/config"
import { createInterface } from "node:readline/promises"

import { conectar, destinoDeLaBase } from "../servidor/base-de-datos.js"
import { cargarDatosDePrueba, PERSONAL_PRECARGADO } from "./datos-de-prueba.js"

const destino = destinoDeLaBase()

if (!destino.esArchivo) {
  const pregunta = createInterface({ input: process.stdin, output: process.stdout })
  const respuesta = await pregunta.question(
    "Esto BORRA todo lo que haya en la base de Turso, citas y cuentas incluidas.\n" +
      'Escribí «si» para seguir: ',
  )
  pregunta.close()
  if (respuesta.trim().toLowerCase() !== "si") {
    console.log("No se tocó nada.")
    process.exit(0)
  }
}

const base = await conectar()
await cargarDatosDePrueba(base)

const cuantos = await base.uno("SELECT COUNT(*) AS cuantas FROM servicio")
console.log(`Listo: ${cuantos.cuantas} servicios cargados.`)
console.log(`Cuenta de Personal: ${PERSONAL_PRECARGADO.correo} / ${PERSONAL_PRECARGADO.contrasena}`)

await base.cerrar()
```

En `package.json`, junto a los otros:

```json
    "sembrar": "node guiones/sembrar-remoto.js",
```

```bash
TURSO_DATABASE_URL="libsql://…" TURSO_AUTH_TOKEN="…" npm run sembrar
```

- [ ] **Paso 4: cargar las variables en Vercel**

Son cinco, y **no van a ningún archivo del repositorio**:

```bash
npx vercel env add TURSO_DATABASE_URL production
npx vercel env add TURSO_AUTH_TOKEN production
npx vercel env add SESION_SECRETO production
npx vercel env add RESEND_API_KEY production
npx vercel env add CORREO_REMITENTE production
```

- `SESION_SECRETO`: un texto largo e inventado. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` lo genera.
- `RESEND_API_KEY` y `CORREO_REMITENTE`: los mismos del `.env` de la computadora. Ya están
  comprobados contra el servicio real desde la pieza 4.

`DIRECCION_PUBLICA` **todavía no**: hace falta saber la dirección, y la dirección la da el
despliegue.

> Si Turso se conecta desde el panel de Vercel (Integrations), las dos primeras las pone él solo, con
> esos mismos nombres. Es la segunda trampa ya pagada: los nombres son exactamente
> `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`, y por eso el código los busca así.

- [ ] **Paso 5: publicar, y averiguar la dirección**

```bash
npx vercel --prod
```

- [ ] **Paso 6: poner `DIRECCION_PUBLICA` y volver a publicar**

```bash
npx vercel env add DIRECCION_PUBLICA production    # la dirección del paso anterior, sin barra al final
npx vercel --prod
```

Dos despliegues y no uno, porque la dirección no se conoce antes de tenerla. Vale la pena decirlo en
`DESPLIEGUE.md` para que a nadie le parezca un error.

- [ ] **Paso 7: comprobar contra el sitio en vivo**

Esto no se puede hacer con `npm test`: son las comprobaciones que sólo existen publicadas.

| # | Comprobación | Resultado esperado |
|---|---|---|
| 1 | Abrir la dirección | **200**, con el CSS puesto y las fuentes bien |
| 2 | Registrar una cuenta nueva | Entra, y la fila aparece en Turso (`turso db shell reservas-bienestar "SELECT * FROM cliente"`) |
| 3 | Ver el catálogo y el calendario | Categorías, servicios, proveedores y horarios, con el domingo cerrado y el almuerzo hueco |
| 4 | Reservar | La cita se crea y queda en Turso con canal `en_linea` |
| 5 | **Volver a reservar ese mismo horario desde otro navegador** | La rechaza: **CA-1 contra la base de verdad** |
| 6 | Cancelar la cita | Se cancela y el horario vuelve a aparecer libre |
| 7 | Entrar como Personal y reservar por otra persona | Cita con canal `asistida` |
| 8 | Pedir «olvidé mi contraseña» con la casilla de Resend | Llega el correo, y **el enlace abre en el teléfono** — que es lo que `localhost` nunca pudo |
| 9 | Cerrar y volver a abrir el navegador | La sesión aguanta (es `SESION_SECRETO` compartido funcionando) |
| 10 | `npx vercel logs <url>` | Ningún error inesperado |
| 11 | Cronometrar el calendario de un mes | Anotar el número. Si se siente lento, es la trampa 3, y **ahora hay una pantalla concreta que medir** |

- [ ] **Paso 8: borrar los datos de la prueba**

La cita y la cuenta del paso 7 se borran, igual que se borró la del despliegue anterior. Y se anota
que se borraron.

- [ ] **Paso 9: la puerta de calidad**

```bash
npm test
```

`fail 0`, `pass 311`, **y sin ninguna variable de Turso configurada en esta computadora**. Que las
pruebas sigan corriendo contra el archivo local, sin internet y sin credenciales, es lo que mantiene
verde la integración continua de GitHub.

- [ ] **Paso 10: escribirlo, y contarlo en el README**

En `DESPLIEGUE.md`: la dirección pública, las cinco variables (**sin valores**), los dos despliegues
y por qué, y la tabla de las 11 comprobaciones con lo que dio cada una.

En `README.md`: la dirección pública arriba, y la aclaración de que `npm test` y `npm start` siguen
funcionando sin configurar nada.

- [ ] **Paso 11: commit**

```bash
git add guiones/esquema.js guiones/sembrar-remoto.js package.json README.md DESPLIEGUE.md
git commit -m "feat: la aplicacion publicada en Vercel con Turso"
git push
```

**Si parás en la Etapa 5:** **hay dirección pública y la presentación se puede dar.** 11 de 12
piezas, 311 pruebas en verde, y la razón de fondo de toda la decisión del 2026-08-29 está cumplida.
Nada roto.

---

# Etapa 6 — La pieza 6, «Recordatorio de 24 horas»

**Para qué:** cerrar **12 de 12**. Publicada la aplicación, GitHub sí la puede llamar, así que se
apunta a **las 8 comprobaciones** del plan y no a 7.

**Lo que ya está resuelto y no hay que volver a dudar:** el correo. Resend funciona y está
comprobado contra el servicio real desde la pieza 4. La pieza 6 no agrega un servicio nuevo: agrega
un **momento** en que se manda un correo que ya se sabe mandar.

**Archivos:**
- Crear: `servidor/recordatorios.js`, `pruebas/recordatorios.test.js`,
  `.github/workflows/recordatorios.yml`
- Modificar: `servidor/plantillas-de-correo.js`, `servidor/rutas/citas.js`, `.env.ejemplo`,
  `PLAN.md` (el bloque «Evidencia» de la pieza 6)

**Se construye con TDD, como las otras once**: la prueba primero, se la ve fallar, después el código.

- [ ] **Paso 1: escribir las 7 pruebas y verlas fallar**

Crear `pruebas/recordatorios.test.js`, con una prueba por cada comprobación del plan (`PLAN.md:922`),
usando `crearEntornoDePrueba`, `relojDetenidoEn` y `enviadorDeMentira`, que ya existen:

| # | Qué fija | Cómo |
|---|---|---|
| 1 | Una cita a **24 h y 10 min** todavía no recibe nada | Insertar la cita, llamar al disparador, `enviador.enviados` vacío |
| 2 | A **23 h 50 min** sí, y con los **dos** enlaces | Llamar, y comprobar que el cuerpo trae el de cancelar y el de reagendar |
| 4 | **Una sola vez** por cita | Llamar dos veces, `enviados.length === 1` |
| 5 | Reservada con **menos** de 24 h de anticipación: nunca (RN-20) | Cita creada hace 3 h para dentro de 20 h |
| 6 | Una cita **cancelada** no recibe | Cancelar y llamar |
| 7 | **Sin la clave**, lo rechaza | `401` |
| — | Queda **registrada** con tipo `recordatorio` (REG-3) | Mirar `correo_enviado` |

Las comprobaciones 3 y 8 no son automatizables y se corren a mano en el Paso 6.

```bash
node --test pruebas/recordatorios.test.js    # tiene que fallar: el endpoint no existe
```

- [ ] **Paso 2: `servidor/recordatorios.js`**

Dos funciones, y ninguna sabe de HTTP:

- `citasQueTocanRecordatorio({ base, ahora })` — las citas `activa` que empiezan dentro de las
  próximas 24 h, **que se crearon con más de 24 h de anticipación** (RN-20), y a las que **no** les
  corresponde ya una fila en `correo_enviado` con tipo `recordatorio`. Ese último criterio es el que
  el plan fija como definición de «ya se le mandó», y el índice `correo_por_cita` existe justo para
  esta pregunta.
- `mandarRecordatoriosPendientes({ base, ahora, enviador, direccionPublica })` — recorre, manda, y
  registra cada intento. Devuelve `{ revisadas, enviados }`.

⚠️ **Los correos se mandan afuera de cualquier transacción**, y una cita que falla no tumba a las
demás: cada una se registra por separado, con su éxito o su fracaso. Es la misma regla de la pieza 4
(RF-19) y la misma que pide el adaptador.

- [ ] **Paso 3: la plantilla del correo**

En `servidor/plantillas-de-correo.js`, una plantilla `recordatorio` con los dos enlaces. **Tres
convenciones del proyecto que se aplican acá y no se descubren solas:**

- El enlace lleva `ses:no-track`, porque un servicio de afuera puede reescribirlo — es el hallazgo 21
  de la pieza 9.
- La dirección va **además como texto suelto**, que es lo único que ningún servicio puede tocar.
- La hora se escribe con `am`/`pm`.

- [ ] **Paso 4: el endpoint**

`POST /api/tareas/recordatorios` en `servidor/rutas/citas.js`. Compara una cabecera contra
`RECORDATORIOS_SECRETO`; devuelve `200` con `{revisadas, enviados}`, y `401` sin la clave.

La variable **ya está declarada** en `.env.ejemplo`, desde antes: «Protege el disparador del
recordatorio, para que nadie de afuera lo pueda ejecutar». Se la carga en Vercel:

```bash
npx vercel env add RECORDATORIOS_SECRETO production
npx vercel --prod
```

- [ ] **Paso 5: la tarea programada**

Crear `.github/workflows/recordatorios.yml`. Un `schedule` con `cron`, más `workflow_dispatch` para
poder dispararla a mano — la misma decisión que ya tomó `pruebas.yml` el 2026-08-26 y por la misma
razón: después de una corrida roja se puede reintentar sin inventar un commit vacío.

La clave va en los **Secrets** del repositorio, nunca en el archivo. Y hay que dejar escrito en el
archivo que **GitHub no garantiza la hora exacta** del `cron`: puede atrasarse bastante cuando hay
cola. Para esta pieza no importa —la ventana es de 24 h y se revisa varias veces al día— pero es
justo la clase de cosa que después parece un error del código.

- [ ] **Paso 6: correr las 8 comprobaciones, y las 3 y 8 a mano**

```bash
npm test
```

`fail 0`, y `pass` ahora es **318** (311 + 7).

Y a mano, contra el sitio publicado:

- **Comprobación 3:** abrir el enlace de cancelar que llegó por correo, en el **teléfono**. Tiene que
  llevar a la aplicación y cancelar esa cita. Ésta es la comprobación que era literalmente imposible
  antes de la Etapa 5.
- **Comprobación 8:** ver en la pestaña Actions que la tarea corrió **sola**, en su horario, sin que
  nadie la disparara. Hay que esperar a que llegue la hora: no se puede apurar, y `workflow_dispatch`
  no la reemplaza porque lo que se comprueba es justamente que arranca sola.

- [ ] **Paso 7: escribir la evidencia**

Llenar el bloque **«Evidencia»** de la pieza 6 en `PLAN.md`, con el mismo formato que las otras once:
qué se construyó, cuántas pruebas nuevas, cuánto da `npm test`, y las 8 comprobaciones con cómo se
corrió cada una.

Y en `SEGUIMIENTO.md` y `PROXIMA-SESION.md`: **12 de 12**.

- [ ] **Paso 8: commit**

```bash
git add servidor/recordatorios.js servidor/plantillas-de-correo.js servidor/rutas/citas.js \
        pruebas/recordatorios.test.js .github/workflows/recordatorios.yml \
        .env.ejemplo PLAN.md PROXIMA-SESION.md
git commit -m "feat: pieza 6, el recordatorio de 24 horas, con su tarea programada"
git push
```

**Si parás en la Etapa 6:** **12 de 12 piezas**, 318 pruebas en verde, dirección pública, y una tarea
programada que corre sola. El proyecto está terminado.

---

## Qué deja cada parada

| Si parás en | Piezas | `npm test` | Dirección pública | ¿Se puede presentar? |
|---|---|---|---|---|
| **Etapa 0** | 11 de 12 | 302 | no | Sí, en la computadora |
| **Etapa 1** | 11 de 12 | 311 | no | Sí, en la computadora |
| **Etapa 2** | 11 de 12 | 311 | no | Sí, en la computadora |
| **Etapa 3** | 11 de 12 | 311 | no | Sí, en la computadora |
| **Etapa 4** | 11 de 12 | 311 | sí, diciendo qué le falta | En la computadora |
| **Etapa 5** | 11 de 12 | 311 | **sí, funcionando** | **Sí, publicada** |
| **Etapa 6** | **12 de 12** | 318 | sí, funcionando | **Sí, completa** |

**En ninguna fila hay un proyecto roto.** Es la condición que pediste y es lo que decidió cómo se
cortaron las etapas.

---

## Lo que puede salir mal, y qué se hace

| Riesgo | Cuándo se ve | Qué se hace |
|---|---|---|
| El nombre del error del índice único no coincide, y **CA-1 se rompe en producción con las pruebas en verde** | **Etapa 0**, que existe para esto | `RECHAZO_DEL_INDICE_UNICO` pasa a ser una lista, con una prueba que la fija |
| Un `await` olvidado entre los 107 puntos | **Etapa 3, Paso 5** — cuando los `await` empiezan a esperar de verdad | Casi siempre se ve como un `undefined` en una prueba. La corrida de tres veces está para eso |
| Turso no respeta las llaves foráneas | Etapa 0 | No bloquea nada. Se escribe en `DESPLIEGUE.md` como diferencia conocida |
| El calendario se siente lento (trampa 3) | Etapa 5, Paso 7, punto 11 | Se mide primero. Se ataca con `batch` **la pantalla medida**, nunca la que uno cree |
| El sitio se publica sin CSS | Etapa 4, Paso 7 | Es `buildCommand` faltando en `vercel.json`. Está en el Paso 3 justamente por eso |
| Las pruebas se ponen intermitentes con dos conexiones al mismo archivo | Etapa 3, Paso 5 | `busy_timeout` (ya puesto) y, si hace falta, `--test-concurrency=1` |
| **Se acaba el tiempo antes del 8 de setiembre** | En cualquier momento | La tabla de arriba. **Parar en la Etapa 5 da la dirección pública**, que es la razón de fondo de la decisión del 2026-08-29. La pieza 6 es la que se recorta, y `FICHA-APROBACION.md` ya la tenía señalada como primera candidata |

---

## Lo que este plan NO hace, dicho a propósito

- **No propone otra plataforma.** Decidido el 2026-08-29, con el costo medido. Cerrado.
- **No toca `VISUALS.md` ni una sola pantalla.** Es una migración de plomería: si algo se ve
  distinto al terminar, es un error, no una mejora.
- **No cambia ningún valor esperado de las 302 pruebas.** Cambia **cómo** miran la base (esperando),
  nunca **qué** exigen. Ese es el único sentido en que 302 en verde significa «no se rompió nada».
- **No optimiza nada por adelantado.** La trampa 3 se ataca con una pantalla medida en la mano, en la
  Etapa 5, y no antes.
- **No arregla los pendientes chicos** que dejó anotados `PROXIMA-SESION.md` (el año del pie de
  página, `SEGUIMIENTO.md` desactualizado). No estorban y no son de esta migración.
