// Pruebas de la pieza 12: las reglas de la contraseña (RN-23) y del correo (RN-24) al crear una
// cuenta.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// LO QUE ESTAS PRUEBAS PROTEGEN, Y POR QUÉ NO ALCANZA CON LA PANTALLA
//
// La pieza trae dos cosas: una **regla** (qué contraseña se acepta) y un **espejo** de esa regla en
// la pantalla (los dos renglones que se ponen verdes mientras escribís). Las de acá prueban la
// regla, que es la que manda: le hablan al API por HTTP, sin navegador de por medio, que es
// exactamente lo que haría alguien que quisiera saltarse la pantalla.
//
// El espejo —que los renglones cambien de color— no lo puede ver ninguna prueba de este proyecto,
// porque ninguna mira la página dibujada. Eso lo comprueba una persona en el navegador, y está
// escrito como la comprobación 8 de la pieza 12 en `PLAN.md`.
//
// Se escribieron antes que el código y se vieron fallar primero.
// ─────────────────────────────────────────────────────────────────────────────────────────────

import test from "node:test"
import assert from "node:assert/strict"

import { crearEntornoDePrueba, crearNavegador, ANA, PERSONAL } from "./ayudas.js"

/** Los datos de un registro que sí sirve. Cada prueba cambia solo lo que quiere romper. */
const REGISTRO_VALIDO = {
  nombre: "Sofía Méndez",
  correo: "sofia@ejemplo.com",
  contrasena: "Prueba123",
}

/** Levanta la aplicación y devuelve un atajo para intentar registrarse cambiando un solo dato. */
async function prepararRegistro(contexto) {
  const entorno = await crearEntornoDePrueba(contexto)
  const navegador = crearNavegador(entorno)

  return {
    entorno,
    navegador,

    async registrarse(cambios = {}) {
      return navegador("/api/registro", {
        method: "POST",
        cuerpo: { ...REGISTRO_VALIDO, ...cambios },
      })
    },

    /** Cuántas cuentas de cliente hay en la base. Sirve para comprobar que un rechazo no guardó nada. */
    cuantosClientes() {
      return entorno.base.prepare("SELECT COUNT(*) AS cuantos FROM cliente").get().cuantos
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// RN-23: las tres condiciones de la contraseña
// ─────────────────────────────────────────────────────────────────────────────────────────────

test("comprobación 1: una contraseña de 3 letras se rechaza, y el mensaje nombra las tres condiciones", async (contexto) => {
  const { registrarse, cuantosClientes } = await prepararRegistro(contexto)

  const respuesta = await registrarse({ contrasena: "abc" })

  assert.equal(respuesta.estado, 422)
  assert.equal(respuesta.cuerpo.error, "contrasena_invalida")

  // Se manda la lista de lo que falta, no un texto ya armado: quien escribe el mensaje que la
  // persona lee es la pantalla, igual que en el resto del proyecto.
  assert.deepEqual(respuesta.cuerpo.faltan.sort(), ["largo", "mayuscula", "numero"])

  assert.equal(cuantosClientes(), 0, "un registro rechazado no tiene que guardar ninguna cuenta")
})

test("comprobación 2: el mensaje nombra SOLO lo que falta, no lo que ya se cumple", async (contexto) => {
  const { registrarse } = await prepararRegistro(contexto)

  // `abcdefg` tiene 7 caracteres: el largo ya está. Le faltan la mayúscula y el número.
  const respuesta = await registrarse({ contrasena: "abcdefg" })

  assert.equal(respuesta.estado, 422)
  assert.deepEqual(respuesta.cuerpo.faltan.sort(), ["mayuscula", "numero"])
})

test("comprobación 3: 5 caracteres se rechazan aunque tengan mayúscula y número", async (contexto) => {
  const { registrarse } = await prepararRegistro(contexto)

  const respuesta = await registrarse({ contrasena: "Abc12" })

  assert.equal(respuesta.estado, 422)
  assert.deepEqual(respuesta.cuerpo.faltan, ["largo"], "solo tenía que faltar el largo")
})

test("comprobación 4: 6 caracteres justos, con mayúscula y número, se acepta", async (contexto) => {
  const { registrarse, cuantosClientes } = await prepararRegistro(contexto)

  // El caso del borde exacto. RN-23 dice «al menos 6», así que 6 tiene que entrar.
  const respuesta = await registrarse({ contrasena: "Abc123" })

  assert.equal(respuesta.estado, 201)
  assert.equal(cuantosClientes(), 1)
})

test("una contraseña sin número se rechaza, y solo por eso", async (contexto) => {
  const { registrarse } = await prepararRegistro(contexto)

  const respuesta = await registrarse({ contrasena: "Abcdefg" })

  assert.equal(respuesta.estado, 422)
  assert.deepEqual(respuesta.cuerpo.faltan, ["numero"])
})

test("una contraseña sin mayúscula se rechaza, y solo por eso", async (contexto) => {
  const { registrarse } = await prepararRegistro(contexto)

  const respuesta = await registrarse({ contrasena: "abcdef1" })

  assert.equal(respuesta.estado, 422)
  assert.deepEqual(respuesta.cuerpo.faltan, ["mayuscula"])
})

test("una mayúscula CON TILDE falla por dos cosas: no cuenta como mayúscula, y además la tilde no se permite", async (contexto) => {
  const { registrarse } = await prepararRegistro(contexto)

  // `Ángela2026` tiene 10 caracteres y un número, y su única letra grande es la `Á`. Se rechaza por
  // **dos** motivos a la vez, y los dos se reportan:
  //
  //   - `mayuscula`   → la `Á` no cuenta como mayúscula (solo valen las 26 de la A a la Z)
  //   - `sin_acentos` → y aparte, ninguna vocal de la contraseña puede llevar acento
  //
  // Las dos son decisiones de la estudiante del 2026-08-19, tomadas **una después de la otra**
  // probando en pantalla: primero la de la mayúscula, y al ver que `óArtolo123` seguía pasando,
  // la prohibición completa. La razón está escrita en RN-23 de `ESPECIFICACION.md`.
  const respuesta = await registrarse({ contrasena: "Ángela2026" })

  assert.equal(respuesta.estado, 422)
  assert.deepEqual(respuesta.cuerpo.faltan.sort(), ["mayuscula", "sin_acentos"])
})

test("la misma contraseña con una mayúscula sin tilde sí se acepta", async (contexto) => {
  const { registrarse } = await prepararRegistro(contexto)

  // Las tildes **no están prohibidas** en la contraseña: lo que pasa es que no cuentan como la
  // mayúscula obligatoria. `Angela2026` tiene su `A` sin tilde y entra.
  const respuesta = await registrarse({ contrasena: "Angela2026" })

  assert.equal(respuesta.estado, 201)
})

test("LA Ñ SÍ SE PUEDE: es una letra del alfabeto, no una vocal acentuada", async (contexto) => {
  const { registrarse } = await prepararRegistro(contexto)

  // `Contraseña123` **se acepta**. La regla prohíbe los acentos —á, é, í, ó, ú— y la ñ no es una
  // vocal acentuada: es una letra propia del alfabeto español, con su lugar entre la N y la O.
  //
  // Esto es una corrección de la estudiante del 2026-08-19. El primer intento de la regla también
  // rechazaba la ñ, y ella lo señaló: «la ñ no es una tilde, es una letra». Tenía razón.
  const respuesta = await registrarse({ contrasena: "Contraseña123" })

  assert.equal(respuesta.estado, 201, "la ñ no puede invalidar una contraseña")
})

test("la ñ mayúscula también se puede", async (contexto) => {
  const { registrarse } = await prepararRegistro(contexto)

  const respuesta = await registrarse({ contrasena: "PequeÑo123" })

  assert.equal(respuesta.estado, 201)
})

test("comprobación 5c: `óArtolo123` se rechaza por la ó, aunque tenga una mayúscula", async (contexto) => {
  const { registrarse } = await prepararRegistro(contexto)

  // Este es **el caso exacto que destapó la regla**. La estudiante lo escribió el 2026-08-19 y le
  // llamó la atención que pasara: pasaba por la `A` de «Artolo», no por la `ó`. La regla hacía lo
  // que decía, pero no lo que ella quería, así que se cambió la regla — no la explicación.
  const respuesta = await registrarse({ contrasena: "óArtolo123" })

  assert.equal(respuesta.estado, 422)
  assert.deepEqual(respuesta.cuerpo.faltan, ["sin_acentos"])
})

test("se rechazan los acentos en minúscula, en mayúscula y la diéresis", async (contexto) => {
  const { registrarse } = await prepararRegistro(contexto)

  // La diéresis de «Pingüino» entra en la misma bolsa que los acentos: es una marca puesta sobre
  // una vocal, no una letra distinta del alfabeto. La ñ sí es una letra distinta, y por eso está
  // afuera de esta lista.
  for (const contrasena of ["Ángela2026", "Angéla2026", "Manana123ú", "Pingüino123"]) {
    const respuesta = await registrarse({ contrasena })
    assert.equal(respuesta.estado, 422, `«${contrasena}» tendría que rechazarse`)
    assert.ok(
      respuesta.cuerpo.faltan.includes("sin_acentos"),
      `«${contrasena}» tendría que fallar por el acento`,
    )
  }
})

test("la misma contraseña sin acentos sí se acepta", async (contexto) => {
  const { registrarse } = await prepararRegistro(contexto)

  const respuesta = await registrarse({ contrasena: "Contrasena123" })

  assert.equal(respuesta.estado, 201)
})

test("una contraseña larga y con símbolos sirve, mientras no lleve acentos", async (contexto) => {
  const { registrarse } = await prepararRegistro(contexto)

  // RN-23 pide un mínimo y prohíbe los acentos; no prohíbe espacios, símbolos ni la ñ.
  const respuesta = await registrarse({ contrasena: "Mi Contraseña Larga 2026 !!" })

  assert.equal(respuesta.estado, 201)
})

test("una contraseña puede fallar por las cuatro condiciones a la vez", async (contexto) => {
  const { registrarse } = await prepararRegistro(contexto)

  // `añí` : 3 caracteres, sin mayúscula, sin número, y con la `í` acentuada. La `ñ` del medio no
  // suma ningún problema: está permitida.
  const respuesta = await registrarse({ contrasena: "añí" })

  assert.equal(respuesta.estado, 422)
  assert.deepEqual(respuesta.cuerpo.faltan.sort(), ["largo", "mayuscula", "numero", "sin_acentos"])
})

test("una contraseña de puras eñes falla por lo que le falta, no por las eñes", async (contexto) => {
  const { registrarse } = await prepararRegistro(contexto)

  // `ñañaña` : 6 caracteres, sin mayúscula y sin número. Falla por esas dos cosas y **solo** por
  // esas: las eñes no aparecen en la lista.
  const respuesta = await registrarse({ contrasena: "ñañaña" })

  assert.equal(respuesta.estado, 422)
  assert.deepEqual(respuesta.cuerpo.faltan.sort(), ["mayuscula", "numero"])
})

// ─────────────────────────────────────────────────────────────────────────────────────────────
// RN-24: el correo tiene que tener forma de correo
// ─────────────────────────────────────────────────────────────────────────────────────────────

test("comprobación 5: un correo sin arroba y uno sin terminación se rechazan", async (contexto) => {
  const { registrarse, cuantosClientes } = await prepararRegistro(contexto)

  const sinArroba = await registrarse({ correo: "ana" })
  assert.equal(sinArroba.estado, 422)
  assert.equal(sinArroba.cuerpo.error, "correo_invalido")

  const sinTerminacion = await registrarse({ correo: "ana@ejemplo" })
  assert.equal(sinTerminacion.estado, 422)
  assert.equal(sinTerminacion.cuerpo.error, "correo_invalido")

  assert.equal(cuantosClientes(), 0, "ninguno de los dos tenía que guardar una cuenta")
})

test("comprobación 5: un correo bien escrito se acepta", async (contexto) => {
  const { registrarse } = await prepararRegistro(contexto)

  const respuesta = await registrarse({ correo: "ana@ejemplo.com" })

  assert.equal(respuesta.estado, 201)
})

test("un correo con espacios adentro o con dos arrobas se rechaza", async (contexto) => {
  const { registrarse } = await prepararRegistro(contexto)

  for (const malo of ["ana ro@ejemplo.com", "ana@@ejemplo.com", "@ejemplo.com", "ana@.com"]) {
    const respuesta = await registrarse({ correo: malo })
    assert.equal(respuesta.estado, 422, `«${malo}» tendría que rechazarse`)
    assert.equal(respuesta.cuerpo.error, "correo_invalido")
  }
})

test("un correo con punto o guión en el nombre sí se acepta: son correos de verdad", async (contexto) => {
  const { registrarse } = await prepararRegistro(contexto)

  // La regla tiene que rechazar el dedazo sin rechazar direcciones legítimas. Una comprobación
  // demasiado estricta deja a gente afuera de su propia cuenta, que es peor que el problema.
  const respuesta = await registrarse({ correo: "ana.maria-lopez@sub.ejemplo.co.cr" })

  assert.equal(respuesta.estado, 201)
})

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Lo que las reglas NO tienen que romper
// ─────────────────────────────────────────────────────────────────────────────────────────────

test("comprobación 6: una cuenta que ya existía entra igual, aunque su contraseña no cumpla las reglas", async (contexto) => {
  const { entorno, navegador } = await prepararRegistro(contexto)

  // Se mete a mano una cuenta con la contraseña `hola`, que no cumple ninguna de las tres
  // condiciones. Es la situación de cualquiera que se hubiera registrado antes del 2026-08-19.
  const { cifrarContrasena } = await import("../servidor/contrasenas.js")
  entorno.base
    .prepare(
      `INSERT INTO cliente (nombre, correo, contrasena_cifrada, debe_cambiar_contrasena)
       VALUES (?, ?, ?, 0)`,
    )
    .run("Cuenta Vieja", "vieja@ejemplo.com", cifrarContrasena("hola"))

  const respuesta = await navegador("/api/sesion", {
    method: "POST",
    cuerpo: { correo: "vieja@ejemplo.com", contrasena: "hola" },
  })

  assert.equal(respuesta.estado, 200, "RN-23 se aplica al elegir una contraseña, no al usarla")
  assert.equal(respuesta.cuerpo.correo, "vieja@ejemplo.com")
})

test("la cuenta de Personal precargada sigue entrando", async (contexto) => {
  const { navegador } = await prepararRegistro(contexto)

  const respuesta = await navegador("/api/sesion", { method: "POST", cuerpo: PERSONAL })

  assert.equal(respuesta.estado, 200)
  assert.equal(respuesta.cuerpo.tipo, "personal")
})

test("la clienta de prueba de siempre se sigue registrando sin problemas", async (contexto) => {
  const { navegador } = await prepararRegistro(contexto)

  const respuesta = await navegador("/api/registro", { method: "POST", cuerpo: ANA })

  assert.equal(respuesta.estado, 201, "«Prueba123» cumple las tres condiciones")
})

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Comprobación 7: la regla vive en el servidor, no en la pantalla
// ─────────────────────────────────────────────────────────────────────────────────────────────

test("comprobación 7: un pedido mandado al API sin pasar por la pantalla se rechaza igual", async (contexto) => {
  const { entorno } = await prepararRegistro(contexto)

  // A propósito **sin** el ayudante `crearNavegador`: esto es `fetch` pelado contra el API, que es
  // lo que haría alguien que abriera una terminal y se salteara la página entera. Si la regla
  // viviera solo en el JavaScript del navegador, esto pasaría sin problema.
  const respuesta = await fetch(`${entorno.direccion}/api/registro`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ nombre: "Colada", correo: "colada@ejemplo.com", contrasena: "a" }),
  })

  assert.equal(respuesta.status, 422)

  const cuerpo = await respuesta.json()
  assert.equal(cuerpo.error, "contrasena_invalida")

  const cuantos = entorno.base.prepare("SELECT COUNT(*) AS cuantos FROM cliente").get().cuantos
  assert.equal(cuantos, 0, "no se tenía que guardar ninguna cuenta")
})

// ─────────────────────────────────────────────────────────────────────────────────────────────
// El orden en que se comprueban las cosas
// ─────────────────────────────────────────────────────────────────────────────────────────────

test("un correo que ya está registrado sigue dando 409, no 422", async (contexto) => {
  const { registrarse } = await prepararRegistro(contexto)

  await registrarse()
  const repetido = await registrarse()

  assert.equal(repetido.estado, 409, "las reglas nuevas no pisan el rechazo que ya existía")
  assert.equal(repetido.cuerpo.error, "correo_ya_registrado")
})

test("un registro sin nombre sigue dando datos_incompletos", async (contexto) => {
  const { registrarse } = await prepararRegistro(contexto)

  const respuesta = await registrarse({ nombre: "   " })

  assert.equal(respuesta.estado, 422)
  assert.equal(respuesta.cuerpo.error, "datos_incompletos")
})
