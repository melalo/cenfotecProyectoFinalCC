// El JavaScript que corre en el navegador.
//
// Su único trabajo es mostrar pantallas y hablarle al API. No decide ninguna regla de negocio
// (`DISENO.md`, límite del componente Interfaz): cuando hace falta saber si algo se permite, se lo
// pregunta al servidor y muestra lo que el servidor conteste.

const pantallaEntrada = document.getElementById("pantalla-entrada")
const pantallaDentro = document.getElementById("pantalla-dentro")
const nombreDeQuienEntro = document.getElementById("nombre-de-quien-entro")
const tipoDeCuenta = document.getElementById("tipo-de-cuenta")

const formaEntrar = document.getElementById("forma-entrar")
const formaRegistro = document.getElementById("forma-registro")
const avisoEntrar = document.getElementById("aviso-entrar")
const avisoRegistro = document.getElementById("aviso-registro")
const botonCerrarSesion = document.getElementById("boton-cerrar-sesion")

// El mensaje de login incorrecto es el mismo para el correo que no existe y para la contraseña
// equivocada, palabra por palabra (`DISENO.md`, «Login incorrecto»).
const MENSAJES = {
  credenciales_invalidas: "correo o contraseña incorrectos",
  correo_ya_registrado: "Ese correo ya tiene una cuenta. Probá entrar en vez de crear una nueva.",
  datos_incompletos: "Faltan datos: hay que llenar los tres campos.",
  desconocido: "Algo falló y no se pudo completar. Volvé a intentar en un momento.",
}

async function pedirAlApi(ruta, opciones = {}) {
  const respuesta = await fetch(ruta, {
    method: opciones.method ?? "GET",
    headers: { "content-type": "application/json" },
    body: opciones.cuerpo === undefined ? undefined : JSON.stringify(opciones.cuerpo),
  })

  const texto = await respuesta.text()
  return {
    estado: respuesta.status,
    cuerpo: texto === "" ? null : JSON.parse(texto),
  }
}

function mostrarAviso(elemento, mensaje) {
  elemento.textContent = mensaje
  elemento.hidden = false
}

function esconderAviso(elemento) {
  elemento.textContent = ""
  elemento.hidden = true
}

function mensajeDelError(cuerpo) {
  return MENSAJES[cuerpo?.error] ?? MENSAJES.desconocido
}

function mostrarPantallaDentro(cuenta) {
  nombreDeQuienEntro.textContent = cuenta.nombre
  tipoDeCuenta.textContent = cuenta.tipo === "personal" ? "personal del negocio" : "cliente"
  pantallaEntrada.hidden = true
  pantallaDentro.hidden = false
}

function mostrarPantallaEntrada() {
  pantallaDentro.hidden = true
  pantallaEntrada.hidden = false
}

function datosDeLaForma(forma) {
  const datos = new FormData(forma)
  return Object.fromEntries(datos.entries())
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// El «ojito» de las contraseñas
//
// Un campo de contraseña muestra puntitos, así que nadie puede ver si escribió bien. El ojito lo
// destapa mientras se lo mantiene apretado con la vista: al tocarlo, el campo pasa a mostrar el
// texto, y al tocarlo de nuevo vuelve a los puntitos.
//
// Está escrito para que **busque solo** todos los campos de contraseña de la página, en vez de
// agregarse a mano campo por campo. Así, cuando las piezas siguientes traigan más pantallas con
// contraseña —cambiar la temporal (pieza 7), restablecer la olvidada (pieza 9)— el ojito les
// aparece sin que nadie tenga que acordarse de ponerlo.
// ─────────────────────────────────────────────────────────────────────────────────────────────

const OJO_ABIERTO = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
  stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
  <circle cx="12" cy="12" r="3" />
</svg>`

const OJO_TACHADO = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
  stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
  <circle cx="12" cy="12" r="3" />
  <line x1="3" y1="21" x2="21" y2="3" />
</svg>`

function agregarOjito(campo) {
  // Una caja que envuelve el campo, para poder apoyar el botón adentro, sobre el borde derecho.
  const caja = document.createElement("div")
  caja.className = "campo__caja"
  campo.parentNode.insertBefore(caja, campo)
  caja.appendChild(campo)

  const boton = document.createElement("button")
  boton.type = "button"
  boton.className = "ojito"
  caja.appendChild(boton)

  function pintar() {
    const estaVisible = campo.type === "text"
    boton.innerHTML = estaVisible ? OJO_TACHADO : OJO_ABIERTO
    // Estas dos líneas son para quien no ve la pantalla y usa un lector: le dicen qué hace el
    // botón y si está activado.
    boton.setAttribute("aria-label", estaVisible ? "Ocultar la contraseña" : "Mostrar la contraseña")
    boton.setAttribute("aria-pressed", String(estaVisible))
    boton.title = boton.getAttribute("aria-label")
  }

  boton.addEventListener("click", () => {
    campo.type = campo.type === "password" ? "text" : "password"
    pintar()
    // Se devuelve el cursor al campo, en la misma posición, para poder seguir escribiendo.
    const posicion = campo.value.length
    campo.focus()
    campo.setSelectionRange(posicion, posicion)
  })

  pintar()
}

function agregarOjitoATodasLasContrasenas() {
  for (const campo of document.querySelectorAll('input[type="password"]')) {
    agregarOjito(campo)
  }
}

formaEntrar.addEventListener("submit", async (evento) => {
  evento.preventDefault()
  esconderAviso(avisoEntrar)

  const respuesta = await pedirAlApi("/api/sesion", {
    method: "POST",
    cuerpo: datosDeLaForma(formaEntrar),
  })

  if (respuesta.estado !== 200) {
    mostrarAviso(avisoEntrar, mensajeDelError(respuesta.cuerpo))
    return
  }

  formaEntrar.reset()
  mostrarPantallaDentro(respuesta.cuerpo)
})

formaRegistro.addEventListener("submit", async (evento) => {
  evento.preventDefault()
  esconderAviso(avisoRegistro)

  const respuesta = await pedirAlApi("/api/registro", {
    method: "POST",
    cuerpo: datosDeLaForma(formaRegistro),
  })

  if (respuesta.estado !== 201) {
    mostrarAviso(avisoRegistro, mensajeDelError(respuesta.cuerpo))
    return
  }

  // Al registrarse la sesión ya queda abierta, así que se pasa directo a la pantalla de adentro.
  formaRegistro.reset()
  mostrarPantallaDentro(respuesta.cuerpo)
})

botonCerrarSesion.addEventListener("click", async () => {
  await pedirAlApi("/api/sesion", { method: "DELETE" })
  mostrarPantallaEntrada()
})

// Al abrir la página se le pregunta al servidor si la sesión de este navegador sigue abierta.
async function arrancar() {
  agregarOjitoATodasLasContrasenas()

  const respuesta = await pedirAlApi("/api/yo")

  if (respuesta.estado === 200) {
    mostrarPantallaDentro(respuesta.cuerpo)
  } else {
    mostrarPantallaEntrada()
  }
}

arrancar()
