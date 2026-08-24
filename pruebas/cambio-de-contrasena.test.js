// Pruebas de la pieza 7: el cambio obligatorio de la contraseña temporal (RF-4, RN-11).
//
// Son las comprobaciones 4, 5 y 6 del plan, y el punto de todas es el mismo: **la obligación se
// cumple en el servidor, no en la pantalla**. Una pantalla que esconda el menú no sirve de nada si
// el API contesta igual a quien le manda el pedido por fuera de la página, y el límite del
// componente Interfaz en `DISENO.md` dice que el frontend no decide reglas de negocio.
//
// Están en su propio archivo y no en `personal.test.js` porque es otro tema: acá el que actúa es el
// **cliente** al que le crearon la cuenta, no Personal.
//
// El reloj está parado en `MOMENTO_DE_PRUEBA` como en todo el proyecto, para que reservar «mañana a
// las 10» diga siempre lo mismo.
//
// Se escribieron antes que el código y se vieron fallar primero.

import test from "node:test"
import assert from "node:assert/strict"

import {
  crearEntornoDePrueba,
  crearNavegador,
  entrarComoPersonal,
  buscarPorNombre,
  enviadorDeMentira,
  relojDetenidoEn,
  MOMENTO_DE_PRUEBA,
  PERSONAL,
} from "./ayudas.js"

const MANANA = "2026-09-02" // miércoles, día hábil completo
const CORREO_NUEVO = "nuevo@ejemplo.com"
const CONTRASENA_ELEGIDA = "Prueba789"

/** Un momento escrito como lo escribe todo el proyecto. */
function momento(fecha, hora) {
  return `${fecha}T${String(hora).padStart(2, "0")}:00:00-06:00`
}

/**
 * Levanta la aplicación, entra como Personal, le crea la cuenta a quien llama, y devuelve **un
 * navegador aparte** ya con la sesión de esa persona abierta usando la contraseña temporal.
 *
 * Son dos navegadores distintos a propósito, igual que dos navegadores de verdad: el de Personal
 * sigue con su sesión, y el nuevo con la del cliente recién creado.
 */
async function prepararCuentaNueva(contexto) {
  const entorno = await crearEntornoDePrueba(contexto, {
    reloj: relojDetenidoEn(MOMENTO_DE_PRUEBA),
    enviador: enviadorDeMentira(),
  })

  const personal = crearNavegador(entorno)
  await entrarComoPersonal(personal)

  const creada = await personal("/api/personal/clientes", {
    method: "POST",
    cuerpo: { nombre: "Quien Llama", correo: CORREO_NUEVO },
  })
  const contrasenaTemporal = creada.cuerpo.contrasenaTemporal

  const servicios = await personal("/api/servicios")
  const masaje = buscarPorNombre(servicios.cuerpo, "Masaje relajante")
  const proveedores = await personal(`/api/servicios/${masaje.id}/proveedores`)
  const ana = buscarPorNombre(proveedores.cuerpo, "Ana")

  /** Abre un navegador nuevo y entra con el correo y la contraseña que se le den. */
  async function entrarCon(contrasena) {
    const suyo = crearNavegador(entorno)
    const entrada = await suyo("/api/sesion", {
      method: "POST",
      cuerpo: { correo: CORREO_NUEVO, contrasena },
    })
    return { navegador: suyo, entrada }
  }

  const { navegador: nuevo, entrada } = await entrarCon(contrasenaTemporal)

  async function cambiarContrasena(navegador, actual, nueva) {
    return navegador("/api/contrasena/cambiar", {
      method: "POST",
      cuerpo: { contrasenaActual: actual, contrasenaNueva: nueva },
    })
  }

  async function reservar(navegador) {
    return navegador("/api/citas", {
      method: "POST",
      cuerpo: { servicioId: masaje.id, proveedorId: ana.id, inicio: momento(MANANA, 10) },
    })
  }

  return {
    entorno,
    personal,
    nuevo,
    entrada,
    contrasenaTemporal,
    entrarCon,
    cambiarContrasena,
    reservar,
  }
}

// ══════════════════════════════════════════════════════ el aviso de que hay que cambiarla

test("al entrar con la contraseña temporal, el sistema avisa que hay que cambiarla", async (contexto) => {
  const { entrada } = await prepararCuentaNueva(contexto)

  assert.equal(entrada.estado, 200)
  assert.equal(entrada.cuerpo.debeCambiarContrasena, true)
})

test("preguntar «quién soy» también lo avisa, aunque se recargue la página", async (contexto) => {
  const { nuevo } = await prepararCuentaNueva(contexto)

  const yo = await nuevo("/api/yo")

  assert.equal(yo.estado, 200)
  assert.equal(yo.cuerpo.debeCambiarContrasena, true)
})

// ══════════════════════════════════════════════════════ comprobación 4: no puede hacer nada más
//
// «El sistema exige cambiarla antes de dejar seguir» (RF-4). Se comprueba en **todas** las puertas
// del cliente, no en una: la regla vive en el guardia de la sesión, así que si alguna se escapara
// sería porque no pasa por ese guardia, y eso hay que saberlo.

test("comprobación 4: con la contraseña temporal pendiente no se pueden ver las citas", async (contexto) => {
  const { nuevo } = await prepararCuentaNueva(contexto)

  const respuesta = await nuevo("/api/citas")

  assert.equal(respuesta.estado, 403)
  assert.equal(respuesta.cuerpo.error, "debe_cambiar_contrasena")
})

test("comprobación 4: con la contraseña temporal pendiente tampoco se puede reservar", async (contexto) => {
  const { nuevo, reservar } = await prepararCuentaNueva(contexto)

  const respuesta = await reservar(nuevo)

  assert.equal(respuesta.estado, 403)
  assert.equal(respuesta.cuerpo.error, "debe_cambiar_contrasena")
})

test("comprobación 4: tampoco se puede ver ni guardar la información del usuario", async (contexto) => {
  const { nuevo } = await prepararCuentaNueva(contexto)

  const viendo = await nuevo("/api/mi-informacion")
  assert.equal(viendo.estado, 403)
  assert.equal(viendo.cuerpo.error, "debe_cambiar_contrasena")

  const guardando = await nuevo("/api/mi-informacion", {
    method: "PUT",
    cuerpo: { nombre: "Otro Nombre" },
  })
  assert.equal(guardando.estado, 403)
})

test("las tres puertas que la pantalla necesita siguen abiertas", async (contexto) => {
  const { nuevo } = await prepararCuentaNueva(contexto)

  // Sin estas tres esa pantalla no podría existir: una para saber quién entró, otra para cambiarla
  // (más abajo se comprueba), y la tercera para poder irse. Ninguna deja hacer nada de negocio.
  assert.equal((await nuevo("/api/yo")).estado, 200)
  assert.equal((await nuevo("/api/negocio")).estado, 200)
  assert.equal((await nuevo("/api/sesion", { method: "DELETE" })).estado, 204)
})

// ══════════════════════════════════════════════════════ comprobación 5: cambiarla y seguir normal

test("comprobación 5: al cambiar la contraseña, la cuenta queda libre para usar la aplicación", async (contexto) => {
  const { nuevo, contrasenaTemporal, cambiarContrasena, reservar } =
    await prepararCuentaNueva(contexto)

  const cambio = await cambiarContrasena(nuevo, contrasenaTemporal, CONTRASENA_ELEGIDA)
  assert.equal(cambio.estado, 204)

  // La misma sesión, sin volver a entrar, ya puede reservar.
  assert.equal((await reservar(nuevo)).estado, 201)
  assert.equal((await nuevo("/api/yo")).cuerpo.debeCambiarContrasena, false)
})

test("comprobación 5: cerrar sesión y volver a entrar con la nueva no exige nada más", async (contexto) => {
  const { nuevo, contrasenaTemporal, cambiarContrasena, entrarCon } =
    await prepararCuentaNueva(contexto)

  await cambiarContrasena(nuevo, contrasenaTemporal, CONTRASENA_ELEGIDA)
  await nuevo("/api/sesion", { method: "DELETE" })

  const devuelta = await entrarCon(CONTRASENA_ELEGIDA)

  assert.equal(devuelta.entrada.estado, 200)
  assert.equal(devuelta.entrada.cuerpo.debeCambiarContrasena, false)
  assert.equal((await devuelta.navegador("/api/citas")).estado, 200)
})

test("la contraseña nueva queda guardada cifrada, no como la escribió la persona", async (contexto) => {
  const { nuevo, contrasenaTemporal, cambiarContrasena, entorno } =
    await prepararCuentaNueva(contexto)

  await cambiarContrasena(nuevo, contrasenaTemporal, CONTRASENA_ELEGIDA)

  const fila = entorno.base
    .prepare("SELECT contrasena_cifrada FROM cliente WHERE correo = ?")
    .get(CORREO_NUEVO)

  assert.notEqual(fila.contrasena_cifrada, CONTRASENA_ELEGIDA)
  assert.ok(!fila.contrasena_cifrada.includes(CONTRASENA_ELEGIDA))
})

// ══════════════════════════════════════════════════════ comprobación 6: la temporal vieja se rechaza

test("comprobación 6: después del cambio, la contraseña temporal vieja ya no sirve", async (contexto) => {
  const { nuevo, contrasenaTemporal, cambiarContrasena, entrarCon } =
    await prepararCuentaNueva(contexto)

  await cambiarContrasena(nuevo, contrasenaTemporal, CONTRASENA_ELEGIDA)

  const conLaVieja = await entrarCon(contrasenaTemporal)

  assert.equal(conLaVieja.entrada.estado, 401)
  assert.equal(conLaVieja.entrada.cuerpo.error, "credenciales_invalidas")
})

// ══════════════════════════════════════════════════════ lo que el cambio no deja hacer

test("la contraseña nueva tiene que cumplir RN-23", async (contexto) => {
  const { nuevo, contrasenaTemporal, cambiarContrasena } = await prepararCuentaNueva(contexto)

  const respuesta = await cambiarContrasena(nuevo, contrasenaTemporal, "abc")

  assert.equal(respuesta.estado, 422)
  assert.equal(respuesta.cuerpo.error, "contrasena_invalida")
  // La misma forma que devuelve el registro de la pieza 12: la lista de lo que falta, para que la
  // pantalla pueda nombrar solo eso en vez de repetir las tres condiciones siempre.
  assert.deepEqual(respuesta.cuerpo.faltan.sort(), ["largo", "mayuscula", "numero"])
})

test("una contraseña nueva con tilde se rechaza, igual que al registrarse (RN-23)", async (contexto) => {
  const { nuevo, contrasenaTemporal, cambiarContrasena } = await prepararCuentaNueva(contexto)

  const respuesta = await cambiarContrasena(nuevo, contrasenaTemporal, "óArtolo123")

  assert.equal(respuesta.estado, 422)
  assert.ok(respuesta.cuerpo.faltan.includes("sin_acentos"))
})

test("no se puede cambiar la contraseña sin acertar la actual", async (contexto) => {
  const { nuevo, cambiarContrasena } = await prepararCuentaNueva(contexto)

  const respuesta = await cambiarContrasena(nuevo, "LaQueNoEs123", CONTRASENA_ELEGIDA)

  assert.equal(respuesta.estado, 422)
  assert.equal(respuesta.cuerpo.error, "contrasena_actual_incorrecta")
})

test("un cambio rechazado no apaga la obligación de cambiarla", async (contexto) => {
  const { nuevo, cambiarContrasena } = await prepararCuentaNueva(contexto)

  await cambiarContrasena(nuevo, "LaQueNoEs123", CONTRASENA_ELEGIDA)

  assert.equal((await nuevo("/api/yo")).cuerpo.debeCambiarContrasena, true)
  assert.equal((await nuevo("/api/citas")).estado, 403)
})

test("sin sesión abierta no se puede cambiar ninguna contraseña", async (contexto) => {
  const { entorno } = await prepararCuentaNueva(contexto)
  const nadie = crearNavegador(entorno)

  const respuesta = await nadie("/api/contrasena/cambiar", {
    method: "POST",
    cuerpo: { contrasenaActual: "Cualquiera1", contrasenaNueva: CONTRASENA_ELEGIDA },
  })

  assert.equal(respuesta.estado, 401)
  assert.equal(respuesta.cuerpo.error, "sin_sesion")
})

test("faltando alguna de las dos contraseñas, el pedido se rechaza", async (contexto) => {
  const { nuevo } = await prepararCuentaNueva(contexto)

  const respuesta = await nuevo("/api/contrasena/cambiar", {
    method: "POST",
    cuerpo: { contrasenaNueva: CONTRASENA_ELEGIDA },
  })

  assert.equal(respuesta.estado, 422)
  assert.equal(respuesta.cuerpo.error, "datos_incompletos")
})

// ══════════════════════════════════════════════════════ las cuentas que no pasan por acá

test("Personal también puede cambiar su propia contraseña", async (contexto) => {
  const { personal, entorno, cambiarContrasena } = await prepararCuentaNueva(contexto)

  const cambio = await cambiarContrasena(personal, PERSONAL.contrasena, "Marta456")
  assert.equal(cambio.estado, 204)

  const otro = crearNavegador(entorno)
  const entrada = await otro("/api/sesion", {
    method: "POST",
    cuerpo: { correo: PERSONAL.correo, contrasena: "Marta456" },
  })

  assert.equal(entrada.estado, 200)
  assert.equal(entrada.cuerpo.tipo, "personal")
  // La columna `debe_cambiar_contrasena` solo existe para clientes: para Personal no hay nada que
  // apagar, y por eso este campo es siempre falso para su cuenta.
  assert.equal(entrada.cuerpo.debeCambiarContrasena, false)
})

test("una cuenta que la persona creó ella misma no tiene que cambiar nada", async (contexto) => {
  const { entorno } = await prepararCuentaNueva(contexto)
  const suyo = crearNavegador(entorno)

  const registro = await suyo("/api/registro", {
    method: "POST",
    cuerpo: { nombre: "Sola Sola", correo: "sola@ejemplo.com", contrasena: "Prueba123" },
  })

  assert.equal(registro.estado, 201)
  assert.equal(registro.cuerpo.debeCambiarContrasena, false)
  // Y no queda trabada en ninguna pantalla: puede ver sus citas de inmediato.
  assert.equal((await suyo("/api/citas")).estado, 200)
})
