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
// Los dos renglones de requisitos de la contraseña (pieza 12, RF-23).
const campoContrasenaRegistro = formaRegistro.querySelector('input[name="contrasena"]')
const campoCorreoRegistro = formaRegistro.querySelector('input[name="correo"]')
const requisitosContrasena = document.getElementById("requisitos-contrasena")
// «Salir» está escrito dos veces en la página —una en el menú de arriba y otra en el del pie—
// porque cada uno se ve en un tamaño de pantalla distinto. Se buscan los dos juntos y los dos hacen
// lo mismo, así que agregar un «Salir» en otro lado no pide código nuevo.
const botonesDeSalir = document.querySelectorAll('[data-accion="salir"]')
// Las dos formas de «volver al inicio» que agregó la revisión visual de la pieza 7, el 2026-08-21.
// La entrada «Inicio» está en los **dos** menús —el de arriba y el del pie—, y por eso se busca con
// `querySelectorAll`: agregar un menú en otro lado no pediría código nuevo.
const botonesDeInicio = document.querySelectorAll('[data-accion="inicio"]')
// La marca del encabezado —la flor y el nombre— es un enlace, no un botón: adentro lleva el `<h1>`
// del negocio, y un `<h1>` dentro de un `<button>` es HTML inválido. La razón completa está en el
// comentario del HTML.
const enlaceInicio = document.getElementById("enlace-inicio")

/**
 * Enciende o apaga la marca como «volver al inicio».
 *
 * **Se apaga quitándole la dirección, no con `disabled`:** `disabled` solo existe para los botones. Un
 * enlace sin `href` no se puede tocar ni alcanzar con el tabulador, que es exactamente lo que hace
 * falta en las dos pantallas donde no hay ningún inicio al que volver.
 *
 * La dirección es `#`, que quiere decir «acá mismo», y el click la anula con `preventDefault()` para
 * que ese `#` no termine pegado en la barra de direcciones. Existe solo para que el navegador lo trate
 * como un enlace de verdad: enfocable con el tabulador y activable con Enter, sin escribir una línea
 * de código para eso.
 */
function marcaLlevaAlInicio(puede) {
  if (puede) enlaceInicio.setAttribute("href", "#")
  else enlaceInicio.removeAttribute("href")
}

// Los pedazos de la pantalla de reservar (piezas 2 y 11).
const pasoCategoria = document.getElementById("paso-categoria")
const listaCategorias = document.getElementById("lista-categorias")
const pasoServicio = document.getElementById("paso-servicio")
const tituloPasoServicio = document.getElementById("titulo-paso-servicio")
const listaServicios = document.getElementById("lista-servicios")
const pasoProveedor = document.getElementById("paso-proveedor")
const listaProveedores = document.getElementById("lista-proveedores")
const pasoCalendario = document.getElementById("paso-calendario")
const avisoSinHorarios = document.getElementById("aviso-sin-horarios")
const cuadricula = document.getElementById("cuadricula")
const mesActual = document.getElementById("mes-actual")
const botonMesAnterior = document.getElementById("mes-anterior")
const botonMesSiguiente = document.getElementById("mes-siguiente")
const detalleDia = document.getElementById("detalle-dia")
const diaTitulo = document.getElementById("dia-titulo")
const diaMotivo = document.getElementById("dia-motivo")
const listaHorarios = document.getElementById("lista-horarios")

// El menú y las dos vistas (pieza 3).
const navegacion = document.getElementById("navegacion")
const botonMenu = document.getElementById("boton-menu")
const menuPie = document.getElementById("menu-pie")
const vistaReservar = document.getElementById("vista-reservar")
const vistaCitas = document.getElementById("vista-citas")
const vistaUsuario = document.getElementById("vista-usuario")

// Los pedazos de reservar y de «Mis citas» (pieza 3).
const diaAyuda = document.getElementById("dia-ayuda")
const confirmacion = document.getElementById("confirmacion")
const resumenServicio = document.getElementById("resumen-servicio")
const resumenProveedor = document.getElementById("resumen-proveedor")
const resumenDia = document.getElementById("resumen-dia")
const resumenHora = document.getElementById("resumen-hora")
const botonConfirmar = document.getElementById("boton-confirmar")
const botonCancelarEleccion = document.getElementById("boton-cancelar-eleccion")
const avisoReserva = document.getElementById("aviso-reserva")
const avisoCitas = document.getElementById("aviso-citas")
const listaCitas = document.getElementById("lista-citas")
const citasVacio = document.getElementById("citas-vacio")
// El historial, que la pieza 5 separó de las citas próximas.
const seccionHistorial = document.getElementById("seccion-historial")
const listaHistorial = document.getElementById("lista-historial")

// Los pedazos que agrega la pieza 5: el cartel de «estás moviendo una cita» y las partes de la
// tarjeta de confirmar que cambian de texto cuando se está reagendando en vez de reservando.
const cartelReagendar = document.getElementById("cartel-reagendar")
const reagendarTitulo = document.getElementById("reagendar-titulo")
const reagendarCual = document.getElementById("reagendar-cual")
const botonDejarComoEsta = document.getElementById("boton-dejar-como-esta")
const confirmacionTitulo = document.getElementById("confirmacion-titulo")
const filaResumenAhora = document.getElementById("fila-resumen-ahora")
const resumenAhora = document.getElementById("resumen-ahora")
const resumenQueDia = document.getElementById("resumen-que-dia")

// Los pedazos de la sección «Usuario» (pieza 10).
const avisoUsuario = document.getElementById("aviso-usuario")
const usuarioNombre = document.getElementById("usuario-nombre")
const usuarioCorreo = document.getElementById("usuario-correo")
const usuarioTelefono = document.getElementById("usuario-telefono")
const usuarioEdad = document.getElementById("usuario-edad")
const usuarioDesde = document.getElementById("usuario-desde")
const botonEditarUsuario = document.getElementById("boton-editar-usuario")
const tarjetaFormaUsuario = document.getElementById("tarjeta-forma-usuario")
const formaUsuario = document.getElementById("forma-usuario")
const botonCancelarUsuario = document.getElementById("boton-cancelar-usuario")

// ─── Los pedazos que agrega la pieza 7: Personal atiende el teléfono ────────────────────────
//
// La pantalla del cambio obligatorio de la contraseña temporal (RF-4).
const pantallaCambiarContrasena = document.getElementById("pantalla-cambiar-contrasena")
const formaCambiarContrasena = document.getElementById("forma-cambiar-contrasena")
const campoContrasenaTemporal = document.getElementById("campo-contrasena-temporal")
const requisitosContrasenaNueva = document.getElementById("requisitos-contrasena-nueva")
const avisoCambiarContrasena = document.getElementById("aviso-cambiar-contrasena")

// El paso «¿Quién llama?», que solo ve Personal.
const pasoQuienLlama = document.getElementById("paso-quien-llama")
const tarjetaBuscarCliente = document.getElementById("tarjeta-buscar-cliente")
const campoBuscarCliente = document.getElementById("buscar-cliente")
const ayudaBuscarCliente = document.getElementById("ayuda-buscar-cliente")
const listaClientes = document.getElementById("lista-clientes")
const botonCuentaNueva = document.getElementById("boton-cuenta-nueva")
const tarjetaCuentaNueva = document.getElementById("tarjeta-cuenta-nueva")
const formaCuentaNueva = document.getElementById("forma-cuenta-nueva")
const botonCancelarCuentaNueva = document.getElementById("boton-cancelar-cuenta-nueva")
const avisoCuentaNueva = document.getElementById("aviso-cuenta-nueva")
const tarjetaContrasenaTemporal = document.getElementById("tarjeta-contrasena-temporal")
const contrasenaTemporalEscrita = document.getElementById("contrasena-temporal")
const atendiendoA = document.getElementById("atendiendo-a")
const atendiendoNombre = document.getElementById("atendiendo-nombre")
const atendiendoCorreo = document.getElementById("atendiendo-correo")
const botonVerCitasDelCliente = document.getElementById("boton-ver-citas-del-cliente")
const botonCambiarCliente = document.getElementById("boton-cambiar-cliente")

// Los pedazos de la vista de citas que cambian de palabra según quién la mire.
const tituloProximas = document.getElementById("titulo-proximas")
const tituloHistorial = document.getElementById("titulo-historial")
const citasSinCliente = document.getElementById("citas-sin-cliente")
const tarjetaCitas = document.getElementById("tarjeta-citas")

// El pie de página, que muestra los datos del negocio.
const pieNegocio = document.getElementById("pie-negocio")
const pieTelefono = document.getElementById("pie-telefono")
const pieUbicacion = document.getElementById("pie-ubicacion")

// El mensaje de login incorrecto es el mismo para el correo que no existe y para la contraseña
// equivocada, palabra por palabra (`DISENO.md`, «Login incorrecto»).
const MENSAJES = {
  credenciales_invalidas: "correo o contraseña incorrectos",
  correo_ya_registrado: "Ese correo ya tiene una cuenta. Probá entrar en vez de crear una nueva.",
  datos_incompletos: "Faltan datos: hay que llenar los tres campos.",
  // Los tres de la pieza 3. El de «mismo_dia» se arma aparte, porque lleva el teléfono adentro.
  horario_no_disponible:
    "Ese horario ya no está disponible: alguien lo tomó antes. Elegí otro del calendario, que ya " +
    "está actualizado.",
  // Desde la pieza 7 este mensaje ya no dice «todavía no está construida»: la pantalla de Personal
  // existe. Lo que este rechazo significa hoy es que esa cuenta no tiene citas ni datos propios.
  solo_clientes:
    "Esta cuenta es del personal del negocio y no tiene citas propias. Las citas de un cliente se " +
    "ven eligiéndolo en «¿Quién llama?», dentro de «Reservar».",
  sin_sesion: "Se cerró tu sesión. Volvé a entrar para seguir.",
  // Los cinco de la pieza 7.
  solo_personal: "Esto es solo para la cuenta del personal del negocio.",
  // RN-25: Personal sí agenda para hoy, pero un horario que ya arrancó no es un cupo que exista.
  // **Este mensaje no manda a llamar al negocio**, y es el punto: quien lo lee trabaja ahí.
  horario_ya_empezo:
    "Ese horario ya empezó, así que no se puede tomar. Elegí uno que todavía no haya empezado.",
  debe_cambiar_contrasena:
    "Antes de seguir tenés que cambiar la contraseña temporal que te dio el negocio.",
  cliente_no_encontrado:
    "No encontramos esa cuenta. Volvé a buscar a la persona en el paso «¿Quién llama?».",
  contrasena_actual_incorrecta:
    "Esa contraseña temporal no es la correcta. Revisala con quien te la dictó, letra por letra.",
  // Los tres de la pieza 10. Cada uno dice **qué** dato está mal, no «revisá el formulario».
  nombre_invalido: "El nombre no puede quedar vacío.",
  telefono_invalido:
    "El teléfono tiene que ser de 8 dígitos, como 8888-7777. Se puede escribir con guión o sin él.",
  fecha_nacimiento_invalida:
    "Esa fecha de nacimiento no sirve: revisá que exista y que no sea del futuro.",
  // Los dos de la pieza 12. El de la contraseña se arma aparte, en `mensajeDeLaContrasena`,
  // porque nombra **solo** lo que falta en vez de repetir siempre las tres condiciones.
  correo_invalido:
    "Ese correo no parece un correo. Revisá que tenga una arroba y una terminación, " +
    "como ana@ejemplo.com.",
  // Los dos de la pieza 5. El de la ventana de las 4 horas se arma aparte, en
  // `mensajeDeLaCita`, porque lleva el teléfono del negocio adentro (RN-5).
  cita_no_activa:
    "Esa cita ya no está activa: puede ser que la hayas cancelado en otra pestaña o desde el " +
    "teléfono. Acá abajo está la lista al día.",
  cita_no_encontrada:
    "No encontramos esa cita. Acá abajo está tu lista al día, por si cambió algo.",
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
  // Si el aviso había quedado en verde o en azulado, vuelve a ser un aviso de error normal. Sin
  // esto, el próximo error se mostraría con la cara de una buena noticia.
  elemento.classList.remove("aviso--informativo")
  elemento.classList.remove("aviso--exito")
}

function mensajeDelError(cuerpo) {
  return MENSAJES[cuerpo?.error] ?? MENSAJES.desconocido
}

/**
 * La cuenta que está en sesión, tal como la devolvió el API. Lo único que la pantalla necesita saber
 * de ella es su **tipo**: con `personal` aparece el paso «¿Quién llama?» y las citas que se ven son
 * las de otra persona.
 */
let cuentaEnSesion = null

/** ¿Quien está usando la aplicación es la cuenta del negocio? */
function esPersonal() {
  return cuentaEnSesion?.tipo === "personal"
}

function mostrarPantallaDentro(cuenta) {
  cuentaEnSesion = cuenta

  // **RF-4, antes que cualquier otra cosa.** Si esta cuenta todavía tiene la contraseña temporal que
  // le puso Personal, no hay aplicación que mostrar: hay una sola pantalla, y es la de cambiarla.
  // El servidor rechaza igual todo lo demás mientras eso siga pendiente, así que esto no es la
  // regla: es lo que se ve de ella.
  if (cuenta.debeCambiarContrasena) {
    mostrarPantallaDeCambio()
    return
  }

  nombreDeQuienEntro.textContent = cuenta.nombre
  tipoDeCuenta.textContent = cuenta.tipo === "personal" ? "personal del negocio" : "cliente"
  pantallaEntrada.hidden = true
  pantallaCambiarContrasena.hidden = true
  pantallaDentro.hidden = false

  // El menú aparece solo acá adentro: las secciones que enlaza no existen para quien no entró.
  navegacion.hidden = false
  botonMenu.hidden = false
  menuPie.hidden = false

  // La marca lleva al inicio solo desde acá adentro: en las otras dos pantallas no hay ningún inicio
  // al que volver.
  marcaLlevaAlInicio(true)

  acomodarElMenu(cuenta)
  mostrarVista("reservar")
  empezarAElegir()
}

/**
 * Deja el menú como corresponde a quien entró (pieza 7). Toca los **dos** menús a la vez —el de la
 * hamburguesa y el del pie— buscando por `data-vista`, que es la misma manera en que ya se marcaba
 * en qué sección se está: agregar un menú en otro lado no pediría código nuevo.
 *
 * Dos diferencias para Personal:
 *
 *   - «Mis citas» pasa a decir **«Citas del cliente»**: las que se ven ahí son de otra persona, y un
 *     «mis» ahí sería falso.
 *   - **«Usuario» no aparece**: esa sección es la información personal de un cliente (RF-22), y el
 *     API se la rechaza a Personal. Ofrecer un botón que lleva a un error no es ofrecer nada.
 */
function acomodarElMenu(cuenta) {
  const personal = cuenta.tipo === "personal"

  for (const enlace of document.querySelectorAll('[data-vista="citas"]')) {
    enlace.textContent = personal ? "Citas del cliente" : "Mis citas"
  }

  for (const enlace of document.querySelectorAll('[data-vista="usuario"]')) {
    enlace.hidden = personal
  }

  // «Inicio» es **solo de Personal**, y no porque al cliente le sobre volver al inicio: para él
  // **«Reservar» ya es la pantalla principal** —es la que ve al entrar—, así que una entrada más que
  // lleve al mismo lado haría el menú más difícil de leer, no más fácil.
  //
  // Al cliente igual le queda la forma que la gente prueba primero: **la marca del encabezado**, que
  // funciona para las dos cuentas.
  for (const boton of botonesDeInicio) {
    boton.hidden = !personal
  }
}

/**
 * Lleva la vista al principio de la página.
 *
 * Hace falta porque «volver al inicio» son dos cosas a la vez: cambiar de sección **y** subir. Sin
 * esto, alguien que estaba abajo mirando el historial de citas tocaría «Inicio», la sección
 * cambiaría, y en pantalla seguiría viendo la mitad de abajo de la pantalla nueva — que se siente
 * como que el botón no hizo nada.
 */
function subirLaPantalla() {
  window.scrollTo({ top: 0, behavior: "smooth" })
}

/**
 * «Inicio»: vuelve al principio de la pantalla de reservar **sin soltar** a la persona que Personal
 * está atendiendo *(decidido por la estudiante el 2026-08-21)*.
 *
 * Es lo que hace el logo del encabezado, para las dos cuentas, y la entrada «Inicio» del menú, que
 * solo ve Personal. Los tres botones llaman a esta misma función: si mañana «volver al inicio»
 * tuviera que hacer algo más, se agrega en un solo lugar.
 */
async function volverAlInicio() {
  esconderAviso(avisoCitas)
  esconderAviso(avisoUsuario)
  esconderAviso(avisoReserva)

  // Empieza el catálogo de cero —categoría, servicio, terapista, calendario— y apaga el modo
  // reagendar, pero **no toca `eleccion.atendiendo`**: la llamada telefónica sigue en curso.
  await empezarAElegir()
  mostrarVista("reservar")
  subirLaPantalla()
}

/*
 * ── Hubo una segunda entrada de menú, «Nueva llamada», y se sacó el mismo día ────────────────
 *
 * Hacía lo mismo que «Inicio» pero **soltando** a la persona atendida. La estudiante la vio en
 * pantalla y decidió que con «Inicio» alcanza, y tenía razón por una razón mejor que el ahorro de
 * espacio: **soltar a la persona es una acción que cambia a quién se le está reservando**, y ese
 * botón vive mejor pegado al nombre de esa persona —«Otra persona», en la tarjeta
 * «Atendiendo a»— que en un menú, donde se toca por error y borra la llamada en curso.
 *
 * Queda anotado y no borrado en silencio: la función que suelta a la persona sigue existiendo
 * (`olvidarAQuienAtiendo`), y sigue teniendo un solo lugar desde donde se llama.
 */

/** La pantalla del cambio obligatorio de la contraseña temporal (pieza 7, RF-4). */
function mostrarPantallaDeCambio() {
  pantallaEntrada.hidden = true
  pantallaDentro.hidden = true
  pantallaCambiarContrasena.hidden = false

  // Sin menú y sin pie de navegación: RF-4 dice «antes de dejarlo hacer nada más», y las dos únicas
  // salidas de acá son cambiar la contraseña o irse.
  navegacion.hidden = true
  botonMenu.hidden = true
  menuPie.hidden = true
  cerrarElMenu()

  // La marca tampoco lleva a ningún lado acá: RF-4 dice «antes de dejarlo hacer nada más», y un logo
  // que llevara a la aplicación sería una puerta de escape a esa regla.
  marcaLlevaAlInicio(false)

  // El campo de la contraseña temporal aparece **solo si la pantalla no la tiene en memoria**, y eso
  // pasa en un caso: que la persona haya recargado la página antes de cambiarla *(decisión de la
  // estudiante del 2026-08-21: normalmente la pantalla se acuerda de la que acaba de escribir para
  // entrar y la manda sola, así no la tiene que escribir dos veces)*.
  campoContrasenaTemporal.hidden = contrasenaRecordada !== null
  formaCambiarContrasena.elements.contrasenaActual.required = contrasenaRecordada === null

  // Los requisitos arrancan en gris. Acá **se ven siempre**, a diferencia del registro, donde
  // aparecen al tocar el campo: en esta pantalla la persona no vino a crear una cuenta sino
  // justamente a elegir una contraseña, así que las condiciones son el contenido, no ruido.
  repintarRequisitos(requisitosContrasenaNueva, "")
}

function mostrarPantallaEntrada() {
  pantallaDentro.hidden = true
  pantallaCambiarContrasena.hidden = true
  pantallaEntrada.hidden = false

  navegacion.hidden = true
  botonMenu.hidden = true
  menuPie.hidden = true
  marcaLlevaAlInicio(false)
  cerrarElMenu()

  // Al salir no queda nada de quien estaba: ni la cuenta, ni la contraseña que la pantalla recordaba,
  // ni la persona a la que Personal estaba atendiendo.
  cuentaEnSesion = null
  contrasenaRecordada = null
  eleccion.atendiendo = null

  olvidarLoElegido()
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

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Elegir servicio y proveedor, y ver el calendario (pieza 2)
//
// Toda la inteligencia está en el servidor. Esta pantalla no decide nada: pregunta qué servicios
// hay, quién los atiende y qué días tienen horarios libres, y dibuja la respuesta. Ni siquiera
// decide *por qué* un día no ofrece nada — eso viene en el campo `estado` de cada día, y acá solo
// se traduce a una frase (`DISENO.md`, límite del componente Interfaz).
// ─────────────────────────────────────────────────────────────────────────────────────────────

const DIAS_DE_LA_SEMANA = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
]

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "setiembre",
  "octubre",
  "noviembre",
  "diciembre",
]

/** Lo que la persona lleva elegido hasta ahora. */
const eleccion = {
  // La categoría es el primer paso desde la pieza 11: «Masaje», «Facial».
  categoria: null,
  servicio: null,
  proveedor: null,
  mes: null,
  calendario: null,
  negocio: null,
  // Los dos que agrega la pieza 3: el día que está abierto y el horario que se va a confirmar.
  dia: null,
  horario: null,
  // El que agrega la pieza 5: la cita que se está moviendo, o `null` si se está reservando de cero.
  // Es lo único que distingue los dos modos de esta pantalla.
  reagendando: null,
  // El que agrega la pieza 7: la persona a la que Personal está atendiendo por teléfono, con su
  // `{id, nombre, correo}`. Para un cliente es siempre `null` — él reserva para sí mismo, y el
  // servidor lo saca de su sesión.
  atendiendo: null,
}

/**
 * La contraseña con la que alguien acaba de entrar, guardada **solo en memoria y solo si esa cuenta
 * tiene una contraseña temporal pendiente de cambiar** (pieza 7).
 *
 * Existe por la decisión de la estudiante del 2026-08-21: el formulario de cambiarla tiene dos
 * campos, no tres, así que la temporal viaja desde acá en vez de pedírsela otra vez a alguien que la
 * acaba de escribir.
 *
 * **No se guarda en ningún lado más.** No va a la memoria del navegador ni a ninguna galleta: vive en
 * esta variable y desaparece al recargar la página, al cambiar la contraseña y al salir. Cuando
 * desaparece por una recarga, la pantalla se da cuenta y pide la temporal a mano.
 */
let contrasenaRecordada = null

/**
 * Devuelve la pantalla de reservar a como está cuando se entra: sin nada elegido, con el paso de las
 * categorías a la vista y **fuera del modo reagendar**.
 *
 * Es el único lugar que apaga el modo reagendar, a propósito: así no hay dos maneras de salir de él
 * que puedan quedar desincronizadas.
 */
function olvidarLoElegido() {
  eleccion.categoria = null
  eleccion.servicio = null
  eleccion.proveedor = null
  eleccion.mes = null
  eleccion.calendario = null
  eleccion.reagendando = null

  listaCategorias.replaceChildren()
  listaServicios.replaceChildren()
  listaProveedores.replaceChildren()

  // El paso «¿Quién llama?» existe solo para Personal (pieza 7). **No se borra a quién está
  // atendiendo**, a propósito: Personal está en una llamada, y navegar por el menú no la termina.
  // Eso solo lo hace el botón «Otra persona», o salir de la aplicación.
  pasoQuienLlama.hidden = !esPersonal()

  // Y mientras Personal no haya elegido a nadie, los pasos de abajo no aparecen: no se puede llegar
  // al calendario sin saber para quién es la cita.
  pasoCategoria.hidden = esPersonal() && eleccion.atendiendo === null

  cartelReagendar.hidden = true
  pasoServicio.hidden = true
  pasoProveedor.hidden = true
  pasoCalendario.hidden = true
  detalleDia.hidden = true
  avisoSinHorarios.hidden = true
  olvidarElHorario()
  renumerarPasos()
}

/**
 * Les pone el número a los pasos que están a la vista: 1, 2, 3…
 *
 * Hace falta porque **el paso del tipo de servicio se salta** cuando la categoría tiene uno solo
 * (RN-22). Con los números escritos a mano en el HTML, esa persona vería «1, 3, 4» y se preguntaría
 * qué paso se perdió. Contando solo los visibles, siempre son seguidos.
 */
function renumerarPasos() {
  let numero = 0

  for (const paso of vistaReservar.querySelectorAll(".paso")) {
    if (paso.hidden) continue

    numero++
    const casillero = paso.querySelector(".paso__numero")
    if (casillero) casillero.textContent = numero
  }
}

/**
 * Suelta el horario que estaba elegido y esconde la tarjeta de confirmar. Se llama cada vez que
 * cambia algo de lo que hay más arriba —el servicio, el proveedor, el mes, el día—, porque un
 * horario elegido dentro de otro calendario ya no significa nada.
 */
function olvidarElHorario() {
  eleccion.horario = null
  eleccion.dia = null
  confirmacion.hidden = true
  marcarHorarioElegido(null)
}

/** Primer paso: las categorías del negocio (RF-5, pieza 11). */
async function empezarAElegir() {
  olvidarLoElegido()

  const respuesta = await pedirAlApi("/api/categorias")
  if (respuesta.estado !== 200) return

  for (const categoria of respuesta.cuerpo) {
    // Cuando la categoría tiene un solo servicio, en vez de decir «1 tipo» se dice cuál es: es más
    // útil, y además avisa de antemano que ese paso no va a aparecer.
    const detalle = categoria.pideElegirTipo
      ? `${categoria.servicios.length} tipos`
      : categoria.servicios[0]?.nombre ?? ""

    listaCategorias.appendChild(
      botonDeOpcion(categoria.nombre, detalle, () => elegirCategoria(categoria)),
    )
  }

  renumerarPasos()
}

/**
 * Segundo paso: el servicio de adentro de la categoría… **si hay más de uno** (RN-22).
 *
 * Quién decide eso no es esta pantalla: viene en el campo `pideElegirTipo` que manda el servidor. Si
 * dice que no, se toma el único servicio y se sigue de largo, sin mostrar un paso con una sola
 * opción.
 */
async function elegirCategoria(categoria) {
  eleccion.categoria = categoria
  eleccion.servicio = null
  eleccion.proveedor = null

  marcarElegido(listaCategorias, categoria.nombre)

  listaServicios.replaceChildren()
  listaProveedores.replaceChildren()
  pasoProveedor.hidden = true
  pasoCalendario.hidden = true
  detalleDia.hidden = true
  olvidarElHorario()

  if (!categoria.pideElegirTipo) {
    pasoServicio.hidden = true
    renumerarPasos()
    await elegirServicio(categoria.servicios[0])
    return
  }

  // «Elegí el tipo de masaje», «Elegí el tipo de facial»: el título dice de qué se está eligiendo.
  tituloPasoServicio.textContent = `Elegí el tipo de ${categoria.nombre.toLowerCase()}`

  for (const servicio of categoria.servicios) {
    listaServicios.appendChild(
      botonDeOpcion(servicio.nombre, `${servicio.duracionMinutos} minutos`, () =>
        elegirServicio(servicio),
      ),
    )
  }

  pasoServicio.hidden = false
  renumerarPasos()
}

/** Siguiente paso: quién atiende ese servicio. Aunque haya uno solo, igual se dice quién es (RN-8). */
async function elegirServicio(servicio) {
  eleccion.servicio = servicio
  eleccion.proveedor = null
  pasoCalendario.hidden = true
  detalleDia.hidden = true
  olvidarElHorario()

  marcarElegido(listaServicios, servicio.nombre)

  const respuesta = await pedirAlApi(`/api/servicios/${servicio.id}/proveedores`)
  if (respuesta.estado !== 200) return

  listaProveedores.replaceChildren()
  for (const proveedor of respuesta.cuerpo) {
    listaProveedores.appendChild(
      botonDeOpcion(proveedor.nombre, "Terapista", () => elegirProveedor(proveedor)),
    )
  }

  pasoProveedor.hidden = false
  renumerarPasos()
}

/** Paso 3: el calendario del mes en curso, el del negocio (RF-6). */
async function elegirProveedor(proveedor) {
  eleccion.proveedor = proveedor
  marcarElegido(listaProveedores, proveedor.nombre)

  // El mes de arranque sale de la fecha del **negocio**, no del reloj de esta computadora: quien
  // abra la aplicación desde otro huso horario tiene que ver el mismo calendario.
  eleccion.mes = eleccion.negocio.hoy.slice(0, 7)

  pasoCalendario.hidden = false
  renumerarPasos()
  await cargarCalendario()
}

async function cargarCalendario() {
  const consulta = new URLSearchParams({
    servicioId: eleccion.servicio.id,
    proveedorId: eleccion.proveedor.id,
    mes: eleccion.mes,
  })

  const respuesta = await pedirAlApi(`/api/disponibilidad?${consulta}`)
  if (respuesta.estado !== 200) return

  eleccion.calendario = respuesta.cuerpo
  detalleDia.hidden = true
  olvidarElHorario()
  pintarCalendario(respuesta.cuerpo)

  // RN-14: el aviso de que no queda nada libre en los próximos 7 días. Quién decide si aparece es
  // el servidor; acá solo se muestra lo que contestó.
  if (respuesta.cuerpo.hayHorariosEnProximos7Dias) {
    esconderAviso(avisoSinHorarios)
  } else {
    mostrarAviso(
      avisoSinHorarios,
      "Por ahora no queda ningún horario libre en los próximos 7 días. Volvé a revisar más " +
        "adelante, por si alguien cancela y se libera alguno.",
    )
  }
}

function pintarCalendario(calendario) {
  mesActual.textContent = nombreDelMes(calendario.mes)
  cuadricula.replaceChildren()

  // La cuadrícula empieza en lunes, así que el día 1 no siempre va en la primera casilla: antes se
  // dejan tantas casillas vacías como días hayan pasado de esa semana.
  for (let vacia = 0; vacia < casillasVaciasAntes(calendario.dias[0].fecha); vacia++) {
    const hueco = document.createElement("span")
    hueco.className = "dia-casilla dia-casilla--vacia"
    cuadricula.appendChild(hueco)
  }

  for (const dia of calendario.dias) {
    cuadricula.appendChild(casillaDelDia(dia))
  }
}

function casillasVaciasAntes(primeraFecha) {
  // `getUTCDay()` cuenta desde el domingo (0). Como acá la semana arranca en lunes, se corre uno.
  const diaDeLaSemana = new Date(`${primeraFecha}T12:00:00Z`).getUTCDay()
  return (diaDeLaSemana + 6) % 7
}

function casillaDelDia(dia) {
  const casilla = document.createElement("button")
  casilla.type = "button"
  casilla.className = `dia-casilla dia-casilla--${dia.estado}`

  if (dia.fecha === eleccion.negocio.hoy) casilla.classList.add("dia-casilla--hoy")

  const numero = document.createElement("span")
  numero.className = "dia-casilla__numero"
  numero.textContent = Number(dia.fecha.slice(8, 10))
  casilla.appendChild(numero)

  const libres = dia.horarios.filter((horario) => horario.disponible).length
  const marca = document.createElement("span")
  marca.className = "dia-casilla__marca"
  marca.textContent = libres > 0 ? libres : ""
  casilla.appendChild(marca)

  // Para quien usa un lector de pantalla, el número solo no dice nada: esto lo lee completo.
  casilla.setAttribute("aria-label", `${tituloDelDia(dia.fecha)}. ${resumenDelDia(dia, libres)}`)
  casilla.title = resumenDelDia(dia, libres)

  casilla.addEventListener("click", () => mostrarDia(dia))
  return casilla
}

function resumenDelDia(dia, libres) {
  if (dia.estado === "cerrado") return "Cerrado"
  if (dia.estado === "feriado") return `Feriado: ${dia.nombreFeriado}`
  if (dia.estado === "hoy_o_pasado") return "No se puede reservar"
  if (dia.estado === "lleno") return "Sin cupo"
  return libres === 1 ? "1 horario libre" : `${libres} horarios libres`
}

/** Los horarios del día que se tocó: los libres y los que no lo están, que RF-6 pide distinguir. */
function mostrarDia(dia) {
  diaTitulo.textContent = tituloDelDia(dia.fecha)

  const motivo = motivoDelDia(dia)
  if (motivo) {
    diaMotivo.textContent = motivo
    diaMotivo.hidden = false
  } else {
    diaMotivo.hidden = true
  }

  listaHorarios.replaceChildren()
  olvidarElHorario()

  // Un día entero bloqueado no muestra sus fichas de horario: dibujar ocho fichas tachadas que nadie
  // puede tomar solo estorba, y alcanza con el mensaje de arriba, que dice el motivo. Pedido de la
  // estudiante el 2026-08-19.
  //
  // **Quién decide si el día está bloqueado es el servidor**, en su campo `estado` — no la pantalla
  // comparando fechas. Eso cambió el 2026-08-21 con RN-25: el día de hoy está bloqueado para el
  // cliente y **no** para Personal, y esa es exactamente la clase de decisión que el frontend no
  // puede tomar. Para el cliente el resultado es idéntico al de antes: hoy le llega con estado
  // `hoy_o_pasado`.
  const esHoy = dia.fecha === eleccion.negocio.hoy
  const diaEnteroBloqueado = dia.esFeriado || (esHoy && dia.estado === "hoy_o_pasado")
  let hayAlgunoLibre = false

  if (!diaEnteroBloqueado) {
    for (const horario of dia.horarios) {
      listaHorarios.appendChild(fichaDeHorario(dia, horario))
      if (horario.disponible) hayAlgunoLibre = true
    }
  }

  // La ayuda de «tocá un horario libre» solo tiene sentido si hay alguno que tocar.
  diaAyuda.hidden = !hayAlgunoLibre

  detalleDia.hidden = false
}

/**
 * Una ficha de horario. Desde la pieza 3 las libres son **botones de verdad**, no cartelitos: se
 * tocan para elegirlas. Las que no están disponibles se dibujan igual pero apagadas y `disabled`,
 * que es lo que le dice al navegador —y a un lector de pantalla— que ahí no hay nada que hacer.
 */
function fichaDeHorario(dia, horario) {
  const ficha = document.createElement("button")
  ficha.type = "button"
  ficha.className = horario.disponible ? "horario" : "horario horario--tomado"
  ficha.textContent = horario.inicio.slice(11, 16)
  ficha.dataset.inicio = horario.inicio

  if (!horario.disponible) {
    ficha.disabled = true

    // Estando en modo reagendar, **el horario que la cita ya tiene sale como ocupado** — y lo está,
    // por su propia cita. Decirle «no disponible» ahí sería confuso: parecería que otra persona se
    // lo llevó. Así que se lo nombra por lo que es (pieza 5).
    const esElQueYaTiene = eleccion.reagendando?.inicio === horario.inicio
    ficha.title = esElQueYaTiene ? "Es el horario que ya tenés" : "No disponible"
    if (esElQueYaTiene) ficha.classList.add("horario--el-de-siempre")

    return ficha
  }

  ficha.title = "Libre: tocá para reservarlo"
  ficha.addEventListener("click", () => elegirHorario(dia, horario))
  return ficha
}

/**
 * Qué se le explica a quien abre un día del calendario. **El motivo lo decide el servidor**, en el
 * campo `estado` de cada día; acá solo se traduce a palabras.
 *
 * ── Por qué esta función distingue quién está mirando (RN-25) ─────────────────────────────────
 *
 * *Corregido el 2026-08-21, en la revisión visual de la pieza 7.* Hasta ese día, Personal abría el
 * día de hoy y leía **«No se puede reservar para hoy. Si necesitás una cita hoy, llamá al negocio al
 * 2000-0000»** — un cartel diciéndole a la asistente del negocio que llame al negocio. Lo encontró la
 * estudiante mirando la pantalla, y ninguna prueba automática podía encontrarlo: el texto aparecía,
 * y era **falso para quien lo estaba leyendo**.
 *
 * El texto era absurdo porque la regla detrás tenía un hueco, así que se arreglaron los dos: ahora
 * Personal **sí puede agendar para hoy** (RN-25) y el cartel dice lo que corresponde en cada caso.
 */
function motivoDelDia(dia) {
  if (dia.estado === "cerrado") return "El negocio no abre este día."
  if (dia.estado === "feriado") return `Feriado: ${dia.nombreFeriado}. El negocio no atiende.`
  if (dia.estado === "lleno") return "No queda ningún horario libre este día."

  const esHoy = dia.fecha === eleccion.negocio.hoy

  if (dia.estado === "hoy_o_pasado") {
    if (!esHoy) return "Este día ya pasó."

    // Para Personal, que hoy no ofrezca nada ya no es una regla: es que **se acabó el día**. El
    // último horario del negocio empieza a las 17:00, así que después de esa hora no queda ninguno
    // sin empezar. Decirle «llamá al negocio» acá no tendría ningún sentido.
    if (esPersonal()) {
      return "Ya no queda ningún horario de hoy sin empezar. La primera fecha posible es mañana."
    }

    // Y para el cliente el texto es el mismo de siempre (RN-4), con el teléfono adentro, porque para
    // él **sí** hay algo que hacer: llamar, y que Personal se lo agende (RN-25).
    return `No se puede reservar para hoy. Si necesitás una cita hoy, llamá al negocio al ${eleccion.negocio.telefono}.`
  }

  // Hoy, visto por Personal, sí ofrece horarios. Esta línea explica por qué algunos salen tachados,
  // sin que la pantalla tenga que calcular cuáles: los tacha el servidor.
  if (esPersonal() && esHoy) {
    return "Solo se pueden tomar los horarios de hoy que todavía no empezaron."
  }

  return null
}

/**
 * La hora de un momento del proyecto escrita con `am` y `pm`: de `2026-08-27T10:00:00-06:00` saca
 * «10:00am», y de `…T14:00:00-06:00` saca «2:00pm».
 *
 * Existe desde el 2026-08-21, para el cartel de reagendar, porque la estudiante pidió ese formato ahí.
 *
 * **No se le pega «am» a la hora y listo, y la diferencia no es un detalle:** a las 14:00 eso daría
 * «14:00am», que no existe. Así que se convierte de verdad — se le restan 12 a las horas de la tarde
 * y se elige `am` o `pm` según corresponda.
 *
 * Los dos casos borde del reloj de 12 horas, aunque hoy ninguno pueda pasar en este negocio (atiende
 * de 9 a 18): **el mediodía es 12:00pm, no 12:00am**, y **la medianoche es 12:00am, no 0:00am**. Están
 * resueltos igual, porque el día que el negocio cambie su horario nadie se va a acordar de venir a
 * arreglarlos.
 *
 * Sí, esto es una cuenta de horas escrita **en el navegador**, y la convención del proyecto dice que
 * las fechas viven en `servidor/tiempo.js`. Es la misma excepción, con la misma razón, que los nombres
 * de los días y de los meses de más abajo: este archivo corre en el navegador, que **no puede leer**
 * nada de `servidor/`. Y no es una regla de negocio: **el momento no se toca, solo se escribe de otra
 * forma** — el texto que viaja al servidor sigue siendo `2026-08-27T14:00:00-06:00`, con su hora de 24
 * y su desfase.
 *
 * **Es el único lugar de la aplicación que usa am/pm.** El calendario, la lista de citas, la tarjeta
 * de confirmar y el correo siguen mostrando la hora de 24 (`14:00`). Queda anotado como pendiente en
 * `DISENO.md`: o se extiende a todo, o se vuelve atrás acá.
 */
function horaConAmPm(inicio) {
  const hora = Number(inicio.slice(11, 13))
  const minutos = inicio.slice(14, 16)

  const esDeLaTarde = hora >= 12
  // El 0 (medianoche) y el 12 (mediodía) se escriben los dos «12»: el resto de la tarde se pasa a
  // su número de la mañana restándole 12.
  const enDoceHoras = hora % 12 === 0 ? 12 : hora % 12

  return `${enDoceHoras}:${minutos}${esDeLaTarde ? "pm" : "am"}`
}

/** «Miércoles 9 de setiembre de 2026», a partir de «2026-09-09». */
function tituloDelDia(fecha) {
  const diaDeLaSemana = DIAS_DE_LA_SEMANA[new Date(`${fecha}T12:00:00Z`).getUTCDay()]
  const numero = Number(fecha.slice(8, 10))
  const mes = MESES[Number(fecha.slice(5, 7)) - 1]
  const anio = fecha.slice(0, 4)

  return `${diaDeLaSemana[0].toUpperCase()}${diaDeLaSemana.slice(1)} ${numero} de ${mes} de ${anio}`
}

/** «Setiembre 2026», a partir de «2026-09». */
function nombreDelMes(mes) {
  const nombre = MESES[Number(mes.slice(5, 7)) - 1]
  return `${nombre[0].toUpperCase()}${nombre.slice(1)} ${mes.slice(0, 4)}`
}

/** El mes que viene antes o después de otro, escrito igual: «2026-12» + 1 = «2027-01». */
function moverMes(mes, cuantos) {
  const primerDia = new Date(`${mes}-01T12:00:00Z`)
  primerDia.setUTCMonth(primerDia.getUTCMonth() + cuantos)
  return primerDia.toISOString().slice(0, 7)
}

/** Deja marcado cuál de las opciones está elegida, para que se vea sin tener que recordarlo. */
function marcarElegido(lista, nombre) {
  for (const boton of lista.children) {
    boton.classList.toggle("opcion--elegida", boton.dataset.nombre === nombre)
  }
}

/**
 * Uno de los rectángulos que se tocan para elegir algo: una categoría, un tipo de servicio, una
 * terapista, o una persona en la búsqueda de «¿Quién llama?».
 *
 * `opciones.accion` es el texto de un rectangulito a la derecha —hoy «Seleccionar»— y **solo lo usan
 * los resultados de la búsqueda de clientes** *(pedido de la estudiante el 2026-08-21)*. Sin él, el
 * botón se arma exactamente como antes: las otras tres listas no cambiaron en nada.
 *
 * **Ese «Seleccionar» no es un botón de verdad, y no puede serlo:** este rectángulo entero **ya es un
 * `<button>`**, y adentro de un botón no puede haber otro — es HTML inválido, el mismo problema que
 * el `<h1>` adentro del botón del encabezado. Así que es un `<span>` que **se ve** como el botón chico
 * de apoyo del proyecto, reusando sus clases sin inventar ningún valor nuevo.
 *
 * Y esa solución es además la mejor de las dos: **el que responde al toque sigue siendo el renglón
 * completo**, así que se puede tocar el nombre, el correo o el rectangulito. Si «Seleccionar» fuera
 * un botón de verdad adentro de un `<div>`, tocar el nombre no haría nada — y el nombre es lo primero
 * que una persona toca.
 */
function botonDeOpcion(nombre, detalle, alTocar, opciones = {}) {
  const boton = document.createElement("button")
  boton.type = "button"
  boton.className = opciones.accion ? "opcion opcion--con-accion" : "opcion"
  boton.dataset.nombre = nombre

  const titulo = textoEn("span", "opcion__nombre", nombre)
  const nota = textoEn("span", "opcion__nota", detalle)

  if (opciones.accion) {
    // Con acción, el nombre y el correo van juntos adentro de un bloque: son la parte izquierda de
    // una fila, y sin el bloque quedarían uno al lado del otro en vez de uno debajo del otro.
    const datos = document.createElement("span")
    datos.className = "opcion__datos"
    datos.appendChild(titulo)
    datos.appendChild(nota)
    boton.appendChild(datos)

    boton.appendChild(
      textoEn("span", "opcion__accion boton boton--suave boton--chico", opciones.accion),
    )
  } else {
    boton.appendChild(titulo)
    boton.appendChild(nota)
  }

  boton.addEventListener("click", alTocar)
  return boton
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// El paso «¿Quién llama?» (pieza 7, RF-16 y RF-17)
//
// Es lo único que se le agrega a la pantalla de reservar para que Personal pueda atender el
// teléfono. Todo lo de abajo —categoría, servicio, terapista, calendario, tarjeta de confirmar— es
// exactamente lo mismo que ve el cliente, sin una línea nueva.
//
// Esta parte tampoco decide nada: pregunta al API quién tiene cuenta y muestra lo que conteste. La
// regla de cuántas letras hacen falta para buscar vive en `servidor/personal.js`; acá el número está
// escrito otra vez **solo para poder decirlo en pantalla**, que es la misma excepción —con la misma
// razón— que los requisitos de la contraseña: el navegador no puede leer los archivos de `servidor/`,
// y el servidor es el que decide.
// ─────────────────────────────────────────────────────────────────────────────────────────────

const LETRAS_MINIMAS_PARA_BUSCAR = 2

const AYUDA_DE_LA_BUSQUEDA = `Escribí al menos ${LETRAS_MINIMAS_PARA_BUSCAR} letras para buscar.`

/**
 * Cuántas búsquedas se pidieron hasta ahora.
 *
 * Sirve para descartar la respuesta de una búsqueda vieja. Escribiendo rápido salen varios pedidos
 * al API, y **no vuelven necesariamente en orden**: si la respuesta de «an» llegara después de la de
 * «ana», la pantalla terminaría mostrando los resultados de lo que la persona escribió antes.
 */
let ultimaBusqueda = 0

async function buscarAQuienLlama(texto) {
  const limpio = texto.trim()
  listaClientes.replaceChildren()

  if (limpio.length < LETRAS_MINIMAS_PARA_BUSCAR) {
    ayudaBuscarCliente.textContent = AYUDA_DE_LA_BUSQUEDA
    return
  }

  const estaBusqueda = ++ultimaBusqueda
  const respuesta = await pedirAlApi(`/api/personal/clientes?busqueda=${encodeURIComponent(limpio)}`)

  // Llegó tarde: mientras esta viajaba, la persona siguió escribiendo. Se tira.
  if (estaBusqueda !== ultimaBusqueda) return

  if (respuesta.estado !== 200) {
    ayudaBuscarCliente.textContent = mensajeDelError(respuesta.cuerpo)
    return
  }

  if (respuesta.cuerpo.length === 0) {
    ayudaBuscarCliente.textContent =
      "Nadie con ese nombre ni ese correo tiene cuenta. Podés crearla acá abajo."
    return
  }

  ayudaBuscarCliente.textContent =
    respuesta.cuerpo.length === 1 ? "1 cuenta encontrada." : `${respuesta.cuerpo.length} cuentas encontradas.`

  for (const cliente of respuesta.cuerpo) {
    listaClientes.appendChild(
      botonDeOpcion(cliente.nombre, cliente.correo, () => elegirAQuienAtiendo(cliente), {
        accion: "Seleccionar",
      }),
    )
  }
}

/**
 * Deja fija a la persona que se está atendiendo y **recién ahí** abre los pasos de abajo.
 *
 * Empieza el catálogo de cero a propósito: si Personal venía de otra llamada y ya tenía elegido un
 * masaje con Ana, esa elección era para la persona anterior.
 */
async function elegirAQuienAtiendo(cliente) {
  eleccion.atendiendo = cliente
  esconderAviso(avisoCuentaNueva)

  atendiendoNombre.textContent = cliente.nombre
  atendiendoCorreo.textContent = cliente.correo
  atendiendoA.hidden = false
  tarjetaBuscarCliente.hidden = true
  tarjetaCuentaNueva.hidden = true

  await empezarAElegir()
}

/** Cierra la llamada: vuelve el buscador y se olvida de todo lo de esa persona. */
async function olvidarAQuienAtiendo() {
  eleccion.atendiendo = null

  atendiendoA.hidden = true
  // La contraseña temporal se va con la persona: era para dictársela a ella.
  tarjetaContrasenaTemporal.hidden = true
  contrasenaTemporalEscrita.textContent = ""
  tarjetaCuentaNueva.hidden = true
  tarjetaBuscarCliente.hidden = false

  campoBuscarCliente.value = ""
  listaClientes.replaceChildren()
  ayudaBuscarCliente.textContent = AYUDA_DE_LA_BUSQUEDA

  await empezarAElegir()
}

campoBuscarCliente.addEventListener("input", (evento) => {
  buscarAQuienLlama(evento.target.value)
})

// «Citas del cliente», al lado del nombre de quien se está atendiendo *(pedido de la estudiante el
// 2026-08-21)*. Lleva a la misma sección que la entrada del menú con ese nombre, y a propósito se
// llama igual: dos caminos al mismo lugar tienen que decir lo mismo, o parecen dos lugares.
//
// El atajo hace falta porque **el nombre de la persona y sus citas estaban en dos pantallas
// distintas**: se elegía a alguien acá y había que ir a buscar el menú para ver qué tenía reservado.
botonVerCitasDelCliente.addEventListener("click", () => {
  esconderAviso(avisoReserva)
  mostrarVista("citas")
})

botonCambiarCliente.addEventListener("click", olvidarAQuienAtiendo)

botonCuentaNueva.addEventListener("click", () => {
  esconderAviso(avisoCuentaNueva)
  tarjetaCuentaNueva.hidden = false
  // Si la persona escribió algo en el buscador que parece un correo, se le adelanta al formulario:
  // es lo más probable que iba a escribir de nuevo.
  const escrito = campoBuscarCliente.value.trim()
  if (escrito.includes("@")) formaCuentaNueva.elements.correo.value = escrito
  formaCuentaNueva.elements.nombre.focus()
})

botonCancelarCuentaNueva.addEventListener("click", () => {
  esconderAviso(avisoCuentaNueva)
  formaCuentaNueva.reset()
  tarjetaCuentaNueva.hidden = true
})

formaCuentaNueva.addEventListener("submit", async (evento) => {
  evento.preventDefault()
  esconderAviso(avisoCuentaNueva)

  const respuesta = await pedirAlApi("/api/personal/clientes", {
    method: "POST",
    cuerpo: datosDeLaForma(formaCuentaNueva),
  })

  if (respuesta.estado !== 201) {
    mostrarAviso(avisoCuentaNueva, mensajeDelError(respuesta.cuerpo))
    return
  }

  formaCuentaNueva.reset()

  // **La contraseña temporal se muestra una sola vez.** En la base queda solo su huella cifrada, así
  // que ni el sistema puede volver a leerla: si Personal no la anota ahora, el camino es
  // restablecerla (pieza 9).
  contrasenaTemporalEscrita.textContent = respuesta.cuerpo.contrasenaTemporal
  tarjetaContrasenaTemporal.hidden = false

  // Y se sigue de largo con la reserva, que es para lo que esa persona llamó.
  await elegirAQuienAtiendo({
    id: respuesta.cuerpo.id,
    nombre: respuesta.cuerpo.nombre,
    correo: respuesta.cuerpo.correo,
  })
})

botonMesAnterior.addEventListener("click", async () => {
  eleccion.mes = moverMes(eleccion.mes, -1)
  await cargarCalendario()
})

botonMesSiguiente.addEventListener("click", async () => {
  eleccion.mes = moverMes(eleccion.mes, 1)
  await cargarCalendario()
})


// ─────────────────────────────────────────────────────────────────────────────────────────────
// El menú y las dos vistas (pieza 3)
//
// «Reservar» y «Mis citas» son vistas que se alternan: se ve una o la otra, nunca las dos a la vez.
// El menú está en dos lados —detrás de la hamburguesa en la barra azul de arriba, y como fila en el
// pie— y los dos usan los mismos botones con `data-vista`, así que agregar una sección mañana es
// agregar un botón, no escribir código nuevo.
// ─────────────────────────────────────────────────────────────────────────────────────────────

function mostrarVista(nombre) {
  vistaReservar.hidden = nombre !== "reservar"
  vistaCitas.hidden = nombre !== "citas"
  vistaUsuario.hidden = nombre !== "usuario"

  // Deja marcado en qué sección se está, en los dos menús a la vez.
  for (const enlace of document.querySelectorAll("[data-vista]")) {
    enlace.classList.toggle("esta-aca", enlace.dataset.vista === nombre)
  }

  cerrarElMenu()

  // Las citas se vuelven a pedir cada vez que se entra a la sección, no una sola vez: si se reservó
  // desde otro navegador o desde el teléfono, hay que ver lo que hay ahora. Lo mismo con los datos
  // del usuario.
  if (nombre === "citas") cargarMisCitas()
  if (nombre === "usuario") cargarMiInformacion()
}

function abrirElMenu() {
  navegacion.classList.add("navegacion--abierta")
  botonMenu.setAttribute("aria-expanded", "true")
  botonMenu.setAttribute("aria-label", "Cerrar el menú")
}

function cerrarElMenu() {
  navegacion.classList.remove("navegacion--abierta")
  botonMenu.setAttribute("aria-expanded", "false")
  botonMenu.setAttribute("aria-label", "Abrir el menú")
}

botonMenu.addEventListener("click", () => {
  if (navegacion.classList.contains("navegacion--abierta")) cerrarElMenu()
  else abrirElMenu()
})

for (const enlace of document.querySelectorAll("[data-vista]")) {
  enlace.addEventListener("click", () => {
    // Un aviso viejo —«tu cita quedó reservada»— no se queda pegado al volver a entrar a la
    // sección: se limpia al navegar.
    esconderAviso(avisoCitas)
    esconderAviso(avisoUsuario)

    // Usar el menú es empezar de nuevo: si se había quedado a medias moviendo una cita, ese modo se
    // apaga (pieza 5). Sin esto, tocar «Reservar» en el menú mostraría la pantalla de reagendar sin
    // los pasos del servicio y del proveedor, y no habría manera de reservar algo nuevo.
    if (eleccion.reagendando) empezarAElegir()

    mostrarVista(enlace.dataset.vista)
  })
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Reservar el horario elegido (pieza 3, RF-8 y RF-9)
//
// Esta pantalla **no decide** si el horario se puede tomar. Lo manda y muestra lo que el servidor
// conteste: `201` es que quedó, `409` es que alguien lo tomó antes, `422` es que era de hoy. En los
// dos casos de rechazo vuelve a pedir el calendario, porque el que estaba en pantalla ya quedó
// viejo — es lo que pide el recorrido «Dos clientes eligen el mismo horario a la vez».
// ─────────────────────────────────────────────────────────────────────────────────────────────

function elegirHorario(dia, horario) {
  eleccion.dia = dia
  eleccion.horario = horario

  esconderAviso(avisoReserva)
  marcarHorarioElegido(horario.inicio)

  resumenServicio.textContent = eleccion.servicio.nombre
  resumenProveedor.textContent = eleccion.proveedor.nombre
  resumenDia.textContent = tituloDelDia(dia.fecha)
  resumenHora.textContent = horario.inicio.slice(11, 16)

  // La misma tarjeta dice dos cosas distintas según el modo (pieza 5). Reservando muestra cuatro
  // datos y dice «Confirmar la reserva»; reagendando muestra un quinto —cuándo es la cita **hoy**—
  // y dice «Mover la cita». Sin ese quinto dato, quien está moviendo una cita no tiene contra qué
  // comparar el horario nuevo que acaba de tocar.
  const moviendo = eleccion.reagendando !== null

  // Desde la pieza 7 los textos también dependen de **quién** está reservando. Personal reserva para
  // otra persona, así que nada de lo que lee puede decir «tu»: sería falso, y en una llamada
  // telefónica esa palabra es justo la que confunde.
  confirmacionTitulo.textContent = tituloDeLaConfirmacion(moviendo)
  botonConfirmar.textContent = moviendo ? "Mover la cita" : textoDelBotonDeReservar()
  resumenQueDia.textContent = moviendo ? "Pasa a" : "Día"
  filaResumenAhora.hidden = !moviendo

  if (moviendo) {
    const viejo = eleccion.reagendando.inicio
    resumenAhora.textContent = `${tituloDelDia(viejo.slice(0, 10))}, ${viejo.slice(11, 16)}`
  }

  confirmacion.hidden = false

  // En un teléfono la tarjeta de confirmar puede quedar más abajo de lo que se ve, y si no se la
  // muestra parece que tocar el horario no hizo nada.
  confirmacion.scrollIntoView({ behavior: "smooth", block: "nearest" })
}

/** El título de la tarjeta de confirmar, que dice cuatro cosas distintas según el modo y quién sea. */
function tituloDeLaConfirmacion(moviendo) {
  if (moviendo) return esPersonal() ? "Mové la cita a este horario" : "Mové tu cita a este horario"
  if (esPersonal()) return `Confirmá la reserva de ${eleccion.atendiendo.nombre}`
  return "Confirmá tu reserva"
}

/** «Confirmar la reserva» para el cliente; «Reservar para Ana» cuando reserva Personal. */
function textoDelBotonDeReservar() {
  if (!esPersonal()) return "Confirmar la reserva"
  return `Reservar para ${primerNombre(eleccion.atendiendo.nombre)}`
}

/**
 * La primera palabra de un nombre completo: de «Ana Rodríguez» saca «Ana».
 *
 * Es para que el botón no diga «Reservar para Ana Rodríguez», que en un teléfono se sale del botón.
 * El nombre completo sigue estando arriba, en «Atendiendo a» y en el título de la tarjeta, así que no
 * se pierde nada.
 */
function primerNombre(nombre) {
  return String(nombre).trim().split(/\s+/)[0]
}

/** Deja marcada la ficha del horario elegido. Con `null` las desmarca todas. */
function marcarHorarioElegido(inicio) {
  for (const ficha of listaHorarios.children) {
    ficha.classList.toggle("horario--elegido", ficha.dataset.inicio === inicio)
  }
}

/**
 * Lo que hace el botón grande de la tarjeta de confirmar. Son dos cosas distintas según el modo, y
 * el `if` está acá y no repartido por la pantalla: un solo botón, un solo lugar donde se decide.
 */
async function confirmarLoElegido() {
  if (eleccion.reagendando) return confirmarElMovimiento()
  return confirmarReserva()
}

async function confirmarReserva() {
  if (!eleccion.horario) return

  esconderAviso(avisoReserva)
  // Se apaga el botón mientras el pedido viaja: dos toques seguidos mandarían dos reservas.
  botonConfirmar.disabled = true

  const cuerpo = {
    servicioId: eleccion.servicio.id,
    proveedorId: eleccion.proveedor.id,
    inicio: eleccion.horario.inicio,
  }

  // Personal tiene que decir **para quién** es la cita (RF-16). El cliente no manda nada: el
  // servidor lo saca de su propia sesión, y un `clienteId` que él mandara ni se mira — si se mirara,
  // cualquiera podría reservarle una cita a cualquiera.
  if (esPersonal()) cuerpo.clienteId = eleccion.atendiendo.id

  const respuesta = await pedirAlApi("/api/citas", { method: "POST", cuerpo })

  botonConfirmar.disabled = false

  if (respuesta.estado !== 201) {
    const mensaje = mensajeDeLaReserva(respuesta.cuerpo)
    // Primero se refresca el calendario —eso suelta el horario y cierra la tarjeta de confirmar— y
    // después se escribe el aviso. Al revés, el refresco borraría el mensaje recién puesto.
    await cargarCalendario()
    mostrarAviso(avisoReserva, mensaje)
    return
  }

  // El horario que se acaba de tomar ya no está libre: el calendario se vuelve a pedir para que al
  // volver a «Reservar» se vea así, sin tener que recargar la página.
  await cargarCalendario()

  mostrarVista("citas")
  // Va en verde, no en rojo: es una buena noticia. Hasta la pieza 4 usaba `mostrarAviso` a secas y
  // salía con los colores de error — lo vio la estudiante en su revisión del 2026-08-19.
  //
  // Cuando reserva Personal el aviso dice **a qué dirección salió el correo** (pieza 7): es el dato
  // que le hace falta para poder confirmárselo por teléfono a quien está del otro lado.
  mostrarAvisoDeExito(
    avisoCitas,
    esPersonal()
      ? `La cita de ${eleccion.atendiendo.nombre} quedó reservada. Le mandamos el correo de ` +
          `confirmación a ${eleccion.atendiendo.correo}.`
      : "Tu cita quedó reservada. Acá abajo está, con su día y su hora.",
  )
}

/** El mensaje de un rechazo al reservar. El de RN-4 lleva el teléfono del negocio adentro. */
function mensajeDeLaReserva(cuerpo) {
  if (cuerpo?.error === "mismo_dia") {
    return (
      "No se puede reservar para hoy ni para un día que ya pasó. Si necesitás una cita hoy, " +
      `llamá al negocio al ${eleccion.negocio.telefono}.`
    )
  }
  return mensajeDelError(cuerpo)
}

botonConfirmar.addEventListener("click", confirmarLoElegido)
botonCancelarEleccion.addEventListener("click", olvidarElHorario)
botonDejarComoEsta.addEventListener("click", salirDelModoReagendar)

// ─────────────────────────────────────────────────────────────────────────────────────────────
// «Mis citas» (pieza 3)
// ─────────────────────────────────────────────────────────────────────────────────────────────

async function cargarMisCitas() {
  listaCitas.replaceChildren()
  listaHistorial.replaceChildren()

  pintarLosTitulosDeLasCitas()

  // Personal sin nadie elegido no tiene nada que mostrar: esta sección son las citas de una persona.
  if (esPersonal() && eleccion.atendiendo === null) {
    citasSinCliente.hidden = false
    tarjetaCitas.hidden = true
    citasVacio.hidden = true
    seccionHistorial.hidden = true
    return
  }

  citasSinCliente.hidden = true
  tarjetaCitas.hidden = false

  citasVacio.textContent = esPersonal()
    ? `${eleccion.atendiendo.nombre} no tiene ninguna cita próxima. Andá a «Reservar» y elegile un horario.`
    : "No tenés ninguna cita próxima. Andá a «Reservar» y elegí un horario."

  // **Dos puertas distintas, y la diferencia es real.** «Mis citas» son las de quien está en sesión,
  // y Personal no tiene citas propias: las de un cliente se piden por su propia puerta, que además
  // devuelve `sePuedeCambiar` calculado como Personal — por eso una cita de dentro de dos horas sí
  // le sale con botones (RN-6). Eso es CA-3 visto en pantalla, y lo decide el servidor.
  const respuesta = await pedirAlApi(
    esPersonal() ? `/api/personal/clientes/${eleccion.atendiendo.id}/citas` : "/api/citas",
  )

  if (respuesta.estado !== 200) {
    citasVacio.hidden = true
    seccionHistorial.hidden = true
    mostrarAviso(avisoCitas, mensajeDelError(respuesta.cuerpo))
    return
  }

  // En qué grupo va cada cita **lo decidió el servidor**, en su campo `grupo`. Acá no se mira ni la
  // fecha ni el estado para clasificarlas: solo se lee la respuesta y se pone cada una en su lugar.
  const proximas = respuesta.cuerpo.filter((cita) => cita.grupo === "proxima")
  const historial = respuesta.cuerpo.filter((cita) => cita.grupo === "historial")

  for (const cita of proximas) {
    listaCitas.appendChild(filaDeCita(cita))
  }

  // El historial se lee al revés: **lo más reciente primero**. El servidor las manda de la más vieja
  // a la más nueva, que es el orden correcto para las próximas —«la que tengo antes, arriba»— y el
  // equivocado para lo que ya pasó, donde lo de la semana pasada importa más que lo del año pasado.
  // Dar vuelta una lista no es una regla de negocio, es cómo se lee: por eso se hace acá.
  for (const cita of [...historial].reverse()) {
    listaHistorial.appendChild(filaDeCita(cita))
  }

  citasVacio.hidden = proximas.length > 0
  seccionHistorial.hidden = historial.length === 0
}

/**
 * Los dos títulos de la sección de citas: el de arriba y el del historial.
 *
 * ── Por qué nombran a la persona (corregido el 2026-08-21) ────────────────────────────────────
 *
 * Hasta ese día, Personal mirando las citas de alguien leía **«Sus próximas citas»**, y el único
 * nombre en toda la pantalla era el de la propia asistente, arriba: «Hola, Marta Jiménez». O sea que
 * **nada en pantalla decía de quién eran esas citas**. Lo encontró la estudiante mirando, y su
 * propuesta fue la que quedó: que el título diga el nombre.
 *
 * Es el mismo defecto de siempre en este proyecto —un texto que no dice lo que hace falta— y tampoco
 * lo podía encontrar ninguna prueba automática: el título aparecía, y estaba escrito en español
 * correcto. Lo que fallaba es que **no alcanzaba**.
 *
 * Tres formas, una por caso:
 *
 *   - **el cliente:** «Tus próximas citas» y «Historial». Son las suyas, no hace falta nombrarlo.
 *   - **Personal con alguien elegido:** «Próximas citas de Marisol Prueba» y «Historial de Marisol
 *     Prueba». Nombra a la persona en los dos, no solo en uno: un título con nombre seguido de un
 *     «Historial» pelado deja la duda de si el de abajo es de la misma persona.
 *   - **Personal sin nadie elegido:** «Próximas citas» y «Historial», sin dueño — porque todavía no
 *     hay ninguno. Debajo aparece el aviso que dice que hay que elegir a alguien primero.
 */
function pintarLosTitulosDeLasCitas() {
  if (!esPersonal()) {
    tituloProximas.textContent = "Tus próximas citas"
    tituloHistorial.textContent = "Historial"
    return
  }

  const deQuien = eleccion.atendiendo ? ` de ${eleccion.atendiendo.nombre}` : ""
  tituloProximas.textContent = `Próximas citas${deQuien}`
  tituloHistorial.textContent = `Historial${deQuien}`
}

function filaDeCita(cita) {
  const fila = document.createElement("li")
  fila.className = "cita"

  const cuando = document.createElement("div")
  cuando.className = "cita__cuando"
  cuando.appendChild(textoEn("span", "cita__fecha", tituloDelDia(cita.inicio.slice(0, 10))))
  cuando.appendChild(textoEn("span", "cita__hora", cita.inicio.slice(11, 16)))

  const que = document.createElement("div")
  que.className = "cita__que"
  que.appendChild(textoEn("span", "cita__servicio", cita.servicio))
  que.appendChild(textoEn("span", "cita__proveedor", `Terapista ${cita.proveedor}`))

  fila.appendChild(cuando)
  fila.appendChild(que)

  // ── La etiqueta de estado, y cuándo NO se pone ────────────────────────────────────────────
  //
  // **La etiqueta aparece solo cuando algo le pasó a la cita** (decidido por la estudiante el
  // 2026-08-20): cancelada, y completada o «no asistió» cuando llegue la pieza 8. Una cita del
  // historial que sigue `activa` —o sea, que simplemente ocurrió y a la que nadie le hizo nada
  // todavía— **no lleva ninguna**.
  //
  // El problema que esto resuelve: decía «ACTIVA» debajo de una cita del mes pasado, y «activa»
  // suena a «esto está en pie», cuando ya no lo está.
  //
  // Y por qué no dice «COMPLETADA», que sería lo natural: **la aplicación no sabe si la persona
  // fue**. Pasó la hora, sí, pero presentarse o no lo sabe solo la asistente, que estuvo ahí. Por
  // eso RN-17 dice que «completada» **solo** lo marca Personal y **nunca se alcanza por el paso del
  // tiempo**. Poner «COMPLETADA» sola le estaría afirmando a alguien que asistió sin que nadie lo
  // confirme, y se daría vuelta el día que Personal marque «no asistió» (RN-19).
  //
  // Así, la etiqueta nunca se desdice: pasa de **no estar** a decir COMPLETADA o NO ASISTIÓ. Eso es
  // un avance, no una contradicción. Y no hubo que inventar ninguna palabra que no esté en RN-17.
  //
  // La ausencia se entiende porque **el título de la sección ya dice lo que la etiqueta decía**:
  // el título de su sección: **«Historial»**.
  const yaPasoYNadieLaToco = cita.grupo === "historial" && cita.estado === "activa"
  if (!yaPasoYNadieLaToco) {
    fila.appendChild(textoEn("span", "etiqueta-estado", cita.estado))
  }

  // Los botones de la pieza 5. **Quién decide si aparecen es el servidor**, en el campo
  // `sePuedeCambiar` de cada cita: esta pantalla no cuenta las 4 horas por su cuenta. Si las contara
  // con el reloj de esta computadora, un navegador con la hora mal puesta mostraría un botón que el
  // servidor va a rechazar — o le esconderá uno que sí podía usar, que es peor.
  const acciones = accionesDeLaCita(cita, fila)
  if (acciones) fila.appendChild(acciones)

  return fila
}

/**
 * La parte de abajo de una cita: los botones de cancelar y reagendar, o la explicación de por qué no
 * están. Devuelve `null` cuando no hay nada que mostrar.
 *
 * El **porqué** también viene del servidor, en el campo `porQueNo`. Esta pantalla solo lo traduce a
 * una frase, igual que hace con el campo `estado` de cada día del calendario.
 */
function accionesDeLaCita(cita, fila) {
  const acciones = document.createElement("div")
  acciones.className = "cita__acciones"

  if (cita.sePuedeCambiar) {
    const reagendar = document.createElement("button")
    reagendar.type = "button"
    reagendar.className = "boton boton--suave boton--chico"
    reagendar.textContent = "Reagendar"
    reagendar.addEventListener("click", () => empezarAReagendar(cita))

    const cancelar = document.createElement("button")
    cancelar.type = "button"
    cancelar.className = "boton boton--suave boton--chico"
    cancelar.textContent = "Cancelar"
    cancelar.addEventListener("click", () => preguntarSiCancela(cita, fila))

    acciones.appendChild(reagendar)
    acciones.appendChild(cancelar)
    return acciones
  }

  // Una cita que ya no está activa no necesita explicación: la etiqueta de al lado ya dice
  // «cancelada», y agregarle una frase sería repetir lo mismo con más palabras.
  const nota = NOTA_DE_LA_CITA[cita.porQueNo]
  if (!nota) return null

  // Los dos mensajes llevan el teléfono adentro: un aviso que manda a llamar sin dar el número no
  // resuelve nada (REG-4).
  acciones.appendChild(textoEn("p", "cita__nota", nota()))

  return acciones
}

/**
 * Qué se le explica al cliente cuando una cita no se puede cambiar. **Los motivos que no están acá
 * no llevan ninguna nota**, y eso es a propósito en los dos casos que faltan.
 *
 * Hay **una sola** nota, y la única que la lleva es la cita que está por venir dentro de las 4 horas
 * — la que sí necesita que alguien le explique por qué no tiene botones, y a qué número llamar
 * (RN-5, REG-4).
 *
 * Las otras dos no llevan nada, cada una por su razón:
 *
 *   - **`cita_no_activa`** (cancelada, o cerrada por Personal): su etiqueta ya lo dice. Agregar una
 *     frase sería repetir lo mismo con más palabras.
 *   - **`ya_paso`**: el título de su sección —**«Historial»**— ya lo dice, para todas las filas de
 *     golpe. *Hasta el 2026-08-20 tenía su propia nota, y se sacó ese mismo día, cuando la lista se
 *     partió en dos secciones y esa frase pasó a repetir lo que el título decía — en cada cita vieja,
 *     una vez.*
 *
 * **`ya_paso` sigue haciendo falta aunque no muestre nada, y es lo delicado de este archivo:** es lo
 * único que impide que una cita del mes pasado caiga en el renglón de abajo y diga «faltan menos de 4
 * horas para esta cita». Si el servidor dejara de distinguirlo, esa frase falsa volvería sola.
 *
 * Quién decide qué nota va **no es esta pantalla**: viene en el campo `porQueNo` que manda el
 * servidor. Acá solo se traduce a palabras, igual que con el campo `estado` de cada día del
 * calendario. Es una función y no un texto suelto porque el teléfono se lee cuando la nota se
 * dibuja, no cuando este archivo se carga.
 */
const NOTA_DE_LA_CITA = {
  ventana_de_cancelacion: () =>
    "Faltan menos de 4 horas para esta cita, así que no se puede cambiar desde acá. Si necesitás " +
    `cancelarla o moverla, llamá al negocio al ${eleccion.negocio.telefono}.`,
}

/**
 * Antes de cancelar, pregunta (decisión de la estudiante del 2026-08-20).
 *
 * Los botones se reemplazan por la pregunta **en la misma fila**, en vez de abrir una ventana
 * emergente del navegador: una ventana del navegador no se puede vestir con el sistema visual del
 * proyecto, y además tapa la cita justo cuando la persona quiere mirarla para estar segura de que es
 * la correcta.
 *
 * Cancelar no se deshace. La cita no se borra (RN-15), pero para recuperar ese horario habría que
 * reservarlo otra vez, y a esa altura puede que otra persona ya se lo haya llevado (RN-7).
 */
function preguntarSiCancela(cita, fila) {
  const acciones = fila.querySelector(".cita__acciones")

  acciones.replaceChildren()
  acciones.appendChild(
    textoEn(
      "p",
      "cita__nota",
      esPersonal()
        ? "¿Seguro que cancelás esta cita? Ese horario queda libre para otra persona."
        : "¿Seguro que querés cancelar esta cita? Ese horario queda libre para otra persona.",
    ),
  )

  const siCancelo = document.createElement("button")
  siCancelo.type = "button"
  siCancelo.className = "boton boton--chico"
  siCancelo.textContent = "Sí, cancelarla"
  siCancelo.addEventListener("click", () => cancelarLaCita(cita, siCancelo))

  const noCancelo = document.createElement("button")
  noCancelo.type = "button"
  noCancelo.className = "boton boton--suave boton--chico"
  noCancelo.textContent = "No, dejarla"
  // Volver a dibujar la lista es más simple y más seguro que deshacer a mano lo que se acaba de
  // cambiar: lo que se ve vuelve a salir de lo que el servidor dice ahora.
  noCancelo.addEventListener("click", cargarMisCitas)

  acciones.appendChild(siCancelo)
  acciones.appendChild(noCancelo)
}

/** Cancela la cita de verdad (RF-13). El horario queda libre en el mismo instante (RN-7). */
async function cancelarLaCita(cita, boton) {
  esconderAviso(avisoCitas)
  // Se apaga el botón mientras el pedido viaja: dos toques seguidos mandarían dos cancelaciones.
  boton.disabled = true

  const respuesta = await pedirAlApi(`/api/citas/${cita.id}`, { method: "DELETE" })

  if (respuesta.estado !== 204) {
    // Se vuelve a cargar la lista **antes** de escribir el aviso: si el rechazo fue porque la cita ya
    // estaba cancelada, lo primero que la persona tiene que ver es la lista al día.
    await cargarMisCitas()
    mostrarAviso(avisoCitas, mensajeDeLaCita(respuesta.cuerpo))
    return
  }

  await cargarMisCitas()
  mostrarAvisoDeExito(
    avisoCitas,
    esPersonal()
      ? "La cita quedó cancelada, y ese horario vuelve a estar libre. Acá abajo queda anotada."
      : "Tu cita quedó cancelada, y ese horario vuelve a estar libre. Acá abajo queda anotada.",
  )
}

/**
 * Arranca el modo reagendar: lleva a la pantalla de reservar, pero **con el servicio y el proveedor
 * ya puestos y sin manera de cambiarlos** (RN-18).
 *
 * Reusa la pantalla de reservar entera —el calendario, las fichas de horario, la tarjeta de
 * confirmar— en vez de tener su propio calendario (decidido por la estudiante el 2026-08-20). Los
 * dos números que hacen esto posible, `servicioId` y `proveedorId`, los agregó la pieza 5 a la
 * respuesta de `GET /api/citas` justamente para esto.
 */
async function empezarAReagendar(cita) {
  esconderAviso(avisoCitas)
  olvidarLoElegido()

  eleccion.reagendando = cita
  eleccion.servicio = { id: cita.servicioId, nombre: cita.servicio }
  eleccion.proveedor = { id: cita.proveedorId, nombre: cita.proveedor }

  // Los tres primeros pasos no se muestran: reagendar no los puede cambiar. Y el de «¿Quién llama?»
  // tampoco (pieza 7): la cita que se está moviendo ya dice de quién es, así que volver a preguntar
  // a quién se atiende ahí solo daría lugar a mover la cita de una persona estando en la de otra.
  pasoQuienLlama.hidden = true
  pasoCategoria.hidden = true
  pasoServicio.hidden = true
  pasoProveedor.hidden = true

  // El cartel dice dos cosas en dos renglones: **qué** cita se está moviendo y **cuándo** es ahora.
  // Texto pedido por la estudiante el 2026-08-21. Cuando la mueve Personal nombra **de quién es**,
  // en vez de decir «tu cita»: es la cita de la persona que llamó.
  reagendarTitulo.textContent = esPersonal()
    ? `Estás reagendando la cita de ${eleccion.atendiendo.nombre}: ${cita.servicio} - Terapista: ${cita.proveedor}`
    : `Estás reagendando tu cita de ${cita.servicio} - Terapista: ${cita.proveedor}`
  reagendarCual.textContent =
    `${tituloDelDia(cita.inicio.slice(0, 10))} a las ${horaConAmPm(cita.inicio)}.`

  cartelReagendar.hidden = false

  mostrarVista("reservar")

  eleccion.mes = eleccion.negocio.hoy.slice(0, 7)
  pasoCalendario.hidden = false
  renumerarPasos()
  await cargarCalendario()
}

/** El botón «Dejarla como está»: sale del modo reagendar sin tocar nada y vuelve a «Mis citas». */
function salirDelModoReagendar() {
  empezarAElegir()
  mostrarVista("citas")
}

/** Mueve la cita al horario elegido (RF-14). */
async function confirmarElMovimiento() {
  if (!eleccion.horario) return

  esconderAviso(avisoReserva)
  botonConfirmar.disabled = true

  const respuesta = await pedirAlApi(`/api/citas/${eleccion.reagendando.id}`, {
    method: "PATCH",
    // Se manda **solo** el inicio, que es lo único que reagendar cambia (RN-18). El servidor
    // tampoco leería nada más, pero mandarlo sugeriría que sí.
    cuerpo: { inicio: eleccion.horario.inicio },
  })

  botonConfirmar.disabled = false

  if (respuesta.estado !== 200) {
    // El calendario que está en pantalla ya quedó viejo: si el horario lo tomó otra persona, hay que
    // volver a pedirlo antes de escribir el mensaje. Al revés, el refresco borraría el aviso.
    await cargarCalendario()
    mostrarAviso(avisoReserva, mensajeDelMovimiento(respuesta.cuerpo))
    return
  }

  // Se sale del modo reagendar y se vuelve a «Mis citas», donde la cita ya aparece en su día nuevo.
  empezarAElegir()
  mostrarVista("citas")
  mostrarAvisoDeExito(
    avisoCitas,
    esPersonal()
      ? `La cita quedó movida. Le mandamos el correo con el día y la hora nuevos a ${eleccion.atendiendo.correo}.`
      : "Tu cita quedó movida. Te mandamos un correo con el día y la hora nuevos.",
  )
}

/** El mensaje de un rechazo al mover una cita. Los dos que llevan el teléfono se arman acá. */
function mensajeDelMovimiento(cuerpo) {
  if (cuerpo?.error === "mismo_dia") {
    return (
      "No se puede mover la cita a hoy ni a un día que ya pasó. Si necesitás una cita hoy, " +
      `llamá al negocio al ${eleccion.negocio.telefono}.`
    )
  }
  if (cuerpo?.error === "horario_no_disponible") {
    return (
      "Ese horario ya no está disponible: alguien lo tomó antes. Elegí otro del calendario, que ya " +
      "está actualizado. Tu cita sigue en su horario de siempre."
    )
  }
  return mensajeDeLaCita(cuerpo)
}

/** El mensaje de un rechazo al cancelar o mover. El de RN-5 lleva el teléfono del negocio adentro. */
function mensajeDeLaCita(cuerpo) {
  if (cuerpo?.error === "ventana_de_cancelacion") {
    return (
      "Faltan menos de 4 horas para esa cita, así que no se puede cambiar desde acá. " +
      `Llamá al negocio al ${eleccion.negocio.telefono} y ellos sí pueden hacerlo.`
    )
  }
  return mensajeDelError(cuerpo)
}

/** Un elemento con su clase y su texto, que es lo que se repite en toda esta parte. */
function textoEn(etiqueta, clase, texto) {
  const elemento = document.createElement(etiqueta)
  elemento.className = clase
  elemento.textContent = texto
  return elemento
}


// ─────────────────────────────────────────────────────────────────────────────────────────────
// La sección «Usuario» (pieza 10, RF-22)
//
// Muestra los datos del cliente y deja corregir tres: nombre, teléfono y fecha de nacimiento. El
// correo no (RN-21), y la **edad no se escribe**: la calcula el servidor a partir de la fecha de
// nacimiento. Esta pantalla no comprueba ningún dato por su cuenta —manda lo que la persona escribió
// y muestra el error que el servidor conteste—, que es el límite del componente Interfaz.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/** Lo que se muestra donde todavía no hay dato. */
const SIN_DATO = "Sin completar"

async function cargarMiInformacion() {
  const respuesta = await pedirAlApi("/api/mi-informacion")

  if (respuesta.estado !== 200) {
    // El caso normal acá es la cuenta de Personal: esta sección es la información de un cliente.
    mostrarAviso(avisoUsuario, mensajeDelError(respuesta.cuerpo))
    return
  }

  pintarMiInformacion(respuesta.cuerpo)
}

function pintarMiInformacion(informacion) {
  usuarioNombre.textContent = informacion.nombre
  usuarioCorreo.textContent = informacion.correo
  usuarioTelefono.textContent = informacion.telefono ?? SIN_DATO

  usuarioEdad.textContent =
    informacion.edad === null ? SIN_DATO : `${informacion.edad} ${informacion.edad === 1 ? "año" : "años"}`

  // «Desde cuándo es cliente» es la fecha de su primera cita, y el servidor manda `null` cuando
  // todavía no tuvo ninguna. La pantalla lo dice con palabras en vez de dejar el espacio en blanco.
  usuarioDesde.textContent = informacion.clienteDesde
    ? tituloDelDia(informacion.clienteDesde)
    : "Todavía no tuviste tu primera cita"

  // El formulario arranca con lo que ya está guardado, así corregir un dato no obliga a volver a
  // escribir los otros dos.
  formaUsuario.elements.nombre.value = informacion.nombre
  formaUsuario.elements.telefono.value = informacion.telefono ?? ""
  formaUsuario.elements.fechaNacimiento.value = informacion.fechaNacimiento ?? ""
}

function mostrarFormaDeUsuario(mostrar) {
  tarjetaFormaUsuario.hidden = !mostrar
  botonEditarUsuario.hidden = mostrar
}

botonEditarUsuario.addEventListener("click", () => {
  esconderAviso(avisoUsuario)
  mostrarFormaDeUsuario(true)
})

botonCancelarUsuario.addEventListener("click", () => {
  esconderAviso(avisoUsuario)
  mostrarFormaDeUsuario(false)
  // Se vuelven a pedir los datos para que el formulario quede como estaba antes de escribir encima.
  cargarMiInformacion()
})

formaUsuario.addEventListener("submit", async (evento) => {
  evento.preventDefault()
  esconderAviso(avisoUsuario)

  const respuesta = await pedirAlApi("/api/mi-informacion", {
    method: "PUT",
    cuerpo: datosDeLaForma(formaUsuario),
  })

  if (respuesta.estado !== 200) {
    mostrarAviso(avisoUsuario, mensajeDelError(respuesta.cuerpo))
    return
  }

  // Se pinta con lo que el servidor devolvió, no con lo que se escribió: el teléfono vuelve con su
  // guión puesto, y la edad recién calculada.
  pintarMiInformacion(respuesta.cuerpo)
  mostrarFormaDeUsuario(false)
  mostrarAvisoDeExito(avisoUsuario, "Tus datos quedaron guardados.")
})

/** Un aviso que no es un error: usa el azulado del sistema en vez del rojo. */
function mostrarAvisoDeExito(elemento, mensaje) {
  elemento.classList.add("aviso--exito")
  mostrarAviso(elemento, mensaje)
}

/** Los datos del negocio en el pie de página (REG-4). Se leen sin haber entrado. */
async function cargarNegocio() {
  const respuesta = await pedirAlApi("/api/negocio")
  if (respuesta.estado !== 200) return

  eleccion.negocio = respuesta.cuerpo
  pieNegocio.textContent = respuesta.cuerpo.nombre
  pieTelefono.textContent = `Tel. ${respuesta.cuerpo.telefono}`
  pieUbicacion.textContent = respuesta.cuerpo.ubicacion
}

formaEntrar.addEventListener("submit", async (evento) => {
  evento.preventDefault()
  esconderAviso(avisoEntrar)

  const escrito = datosDeLaForma(formaEntrar)

  const respuesta = await pedirAlApi("/api/sesion", { method: "POST", cuerpo: escrito })

  if (respuesta.estado !== 200) {
    mostrarAviso(avisoEntrar, mensajeDelError(respuesta.cuerpo))
    return
  }

  // Si esta cuenta todavía tiene la contraseña temporal pendiente, la pantalla se acuerda de la que
  // acaba de escribir para no volver a pedírsela *(decisión de la estudiante del 2026-08-21)*. Se
  // guarda **solo en memoria**, y solo en este caso: para cualquier otra cuenta no hay nada que
  // recordar y se deja vacío a propósito.
  contrasenaRecordada = respuesta.cuerpo.debeCambiarContrasena ? escrito.contrasena : null

  formaEntrar.reset()
  mostrarPantallaDentro(respuesta.cuerpo)
})

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Cambiar la contraseña temporal (pieza 7, RF-4 y RN-11)
//
// Esta pantalla **no impone la obligación**: la impone el servidor, que rechaza todo lo demás
// mientras la contraseña temporal siga pendiente. Acá solo se le da a la persona la manera de salir
// de ese estado.
// ─────────────────────────────────────────────────────────────────────────────────────────────

// Los requisitos se repintan con cada tecla, igual que en el registro. Acá están visibles desde el
// principio y no aparecen al tocar el campo: en esta pantalla elegir una contraseña **es** la tarea,
// así que las condiciones son el contenido y no ruido.
formaCambiarContrasena.elements.contrasenaNueva.addEventListener("input", (evento) => {
  repintarRequisitos(requisitosContrasenaNueva, evento.target.value)
})

formaCambiarContrasena.addEventListener("submit", async (evento) => {
  evento.preventDefault()
  esconderAviso(avisoCambiarContrasena)

  const campos = formaCambiarContrasena.elements
  const nueva = campos.contrasenaNueva.value
  const repetida = campos.contrasenaRepetida.value

  // Que las dos coincidan **no es una regla de negocio**, y por eso se comprueba acá y no en el
  // servidor: el servidor recibe una sola contraseña y no tiene con qué compararla. Es un colador de
  // dedazos, y su lugar natural es el único sitio donde las dos existen.
  if (nueva !== repetida) {
    mostrarAviso(
      avisoCambiarContrasena,
      "Las dos contraseñas nuevas no son iguales. Revisalas —podés usar el ojito para verlas.",
    )
    return
  }

  const actual = contrasenaRecordada ?? campos.contrasenaActual.value

  const respuesta = await pedirAlApi("/api/contrasena/cambiar", {
    method: "POST",
    cuerpo: { contrasenaActual: actual, contrasenaNueva: nueva },
  })

  if (respuesta.estado !== 204) {
    // La contraseña tiene su propio mensaje porque nombra qué condición falta; el resto sale de la
    // lista de siempre. Es la misma función que usa el registro (pieza 12).
    mostrarAviso(
      avisoCambiarContrasena,
      respuesta.cuerpo?.error === "contrasena_invalida"
        ? mensajeDeLaContrasena(respuesta.cuerpo)
        : mensajeDelError(respuesta.cuerpo),
    )

    // Si la temporal que la pantalla recordaba no era la correcta, se deja de insistir con ella y se
    // pide a mano: sin esto, la persona apretaría un botón que nunca va a funcionar.
    if (respuesta.cuerpo?.error === "contrasena_actual_incorrecta") {
      contrasenaRecordada = null
      campoContrasenaTemporal.hidden = false
      campos.contrasenaActual.required = true
    }
    return
  }

  formaCambiarContrasena.reset()
  repintarRequisitos(requisitosContrasenaNueva, "")
  // La temporal ya no sirve para nada: se olvida.
  contrasenaRecordada = null

  // Se le vuelve a preguntar al servidor quién soy en vez de suponerlo: así la pantalla se pinta con
  // lo que hay ahora, que es una cuenta sin nada pendiente.
  const yo = await pedirAlApi("/api/yo")
  if (yo.estado !== 200) {
    mostrarPantallaEntrada()
    return
  }

  mostrarPantallaDentro(yo.cuerpo)
})

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Los requisitos de la contraseña (pieza 12, RF-23)
//
// Esto es un **espejo** de RN-23, no la regla. La regla vive en `servidor/credenciales.js` y se
// cumple pase lo que pase, incluso si alguien le manda el pedido al API sin abrir esta página. Acá
// solo se avisa mientras la persona escribe, para que no tenga que mandar el formulario a ciegas y
// descubrir después qué le faltaba.
//
// Si un día los dos se desincronizaran, lo peor que puede pasar es que esta pantalla diga «verde» y
// el servidor rechace igual. Nunca al revés.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/** El mínimo de caracteres. Es el mismo número que `LARGO_MINIMO_DE_CONTRASENA` del servidor. */
const LARGO_MINIMO_DE_CONTRASENA = 6

/**
 * Qué comprueba cada renglón. Son **dos**, aunque las condiciones de RN-23 sean tres: la mayúscula y
 * el número van juntas en el segundo *(decidido por la estudiante el 2026-08-19)*. El largo va solo
 * porque es lo único que la persona ve cambiar en cada tecla.
 *
 * Son **tres** renglones desde el 2026-08-19, cuando la estudiante prohibió los acentos (RN-23).
 * Los dos primeros piden algo; el tercero prohíbe algo, y por eso se lee al revés: está verde
 * cuando **no** hay acentos.
 *
 * `normalize("NFD")` separa una letra de su acento —la «á» se vuelve una «a» y un acento suelto—, y
 * el rango `\u0300-\u036f` es donde viven esos acentos sueltos. **La ñ se cambia por
 * una `n` antes de mirar**, porque es una letra del alfabeto y no una n acentuada: sin eso, ese
 * mismo truco la daría por acentuada. Es la misma comprobación que hace
 * `servidor/credenciales.js`, escrita igual, porque el servidor es el que decide.
 */
const REQUISITOS = {
  largo: (contrasena) => contrasena.length >= LARGO_MINIMO_DE_CONTRASENA,
  "letra-y-numero": (contrasena) => /[A-Z]/.test(contrasena) && /[0-9]/.test(contrasena),
  "sin-acentos": (contrasena) => {
    const sinLaEne = contrasena.normalize("NFC").replaceAll("ñ", "n").replaceAll("Ñ", "N")
    return !/[\u0300-\u036f]/.test(sinLaEne.normalize("NFD"))
  },
}

/**
 * Repinta los renglones según lo que haya escrito hasta ahora.
 *
 * Tres estados, no dos:
 *
 *   - campo vacío  → gris. Nadie escribió nada todavía; no hay nada que reprochar.
 *   - cumplido     → verde
 *   - sin cumplir  → rojo
 *
 * **El color es toda la señal visible** (decisión de la estudiante del 2026-08-19, que sacó los
 * íconos ✓ y ✗ que había antes). Pero el color solo no le llega a quien no ve la pantalla, ni a
 * quien no distingue el rojo del verde, así que el mismo dato va además en un texto **invisible**
 * que solo leen los lectores de pantalla. Cuesta una línea y no cambia nada de lo que se ve.
 *
 * Recibe **cuál** lista de requisitos repintar desde la pieza 7, porque ahora hay dos pantallas donde
 * alguien elige una contraseña: crear la cuenta y cambiar la temporal. La comprobación es una sola,
 * escrita acá; lo único que cambia es a qué renglones se los pinta.
 */
function repintarRequisitos(contenedor, contrasena) {
  const todaviaNoEscribioNada = contrasena === ""

  for (const renglon of contenedor.querySelectorAll(".requisito")) {
    const cumple = REQUISITOS[renglon.dataset.requisito](contrasena)

    renglon.classList.toggle("requisito--cumplido", !todaviaNoEscribioNada && cumple)
    renglon.classList.toggle("requisito--falta", !todaviaNoEscribioNada && !cumple)

    // El texto invisible. Cambia solo cuando el requisito cambia de estado, así que el lector de
    // pantalla lo anuncia en ese momento y no en cada tecla.
    const paraLectores = renglon.querySelector(".solo-lectores")
    if (todaviaNoEscribioNada) paraLectores.textContent = ""
    else paraLectores.textContent = cumple ? ": cumplido" : ": falta"
  }
}

/**
 * El mensaje de una contraseña rechazada por el servidor. Nombra **solo** lo que falta: a quien
 * escribió siete letras minúsculas no le sirve que le digan que le falta largo, porque le sobra.
 *
 * El servidor manda la lista (`["mayuscula", "numero"]`) y las palabras las pone acá, que es la
 * convención del proyecto: el API manda el dato, la interfaz manda el texto.
 */
function mensajeDeLaContrasena(cuerpo) {
  const COMO_SE_DICE = {
    largo: `al menos ${LARGO_MINIMO_DE_CONTRASENA} caracteres`,
    mayuscula: "una letra mayúscula",
    numero: "un número",
  }

  const todas = cuerpo?.faltan ?? []

  // El acento no es algo que «falta»: es algo que sobra, así que se dice aparte y en otra frase. Un
  // mensaje que dijera «a tu contraseña le falta sin acentos» no se entendería.
  const tieneAcentos = todas.includes("sin_acentos")
  const avisoDeAcentos = tieneAcentos
    ? " Y sacale los acentos: ninguna vocal puede llevar tilde. (La ñ sí se puede.)"
    : ""

  const faltan = todas
    .filter((cual) => cual !== "sin_acentos")
    .map((cual) => COMO_SE_DICE[cual])
    .filter(Boolean)

  if (faltan.length === 0) {
    return tieneAcentos
      ? "Tu contraseña no puede llevar vocales con tilde. Cambiá esas letras por su versión sin acento — la ñ sí se puede usar."
      : "Esa contraseña no sirve. Revisá los requisitos de acá abajo."
  }

  // «a y b» y «a, b y c»: la lista se lee como la escribiría una persona, no separada por comas
  // hasta el final.
  const ultimo = faltan.pop()
  const lista = faltan.length === 0 ? ultimo : `${faltan.join(", ")} y ${ultimo}`

  return `A tu contraseña le falta ${lista}.${avisoDeAcentos}`
}

// Los requisitos **no se ven hasta que la persona toca el campo de la contraseña** (decisión de la
// estudiante del 2026-08-19, al ver el formulario). La razón: quien viene a crear su cuenta ve
// primero tres campos y un botón; tres renglones de reglas colgando debajo de un campo vacío son
// ruido antes de que haya nada que revisar.
campoContrasenaRegistro.addEventListener("focus", () => {
  requisitosContrasena.hidden = false
})

// Y se vuelven a esconder al salir del campo **solo si quedó vacío**. Si hay algo escrito se
// quedan a la vista aunque la persona se vaya a otro campo: ahí sí hay algo que revisar, y
// esconderle los requisitos justo cuando le falta cumplir alguno sería lo contrario de ayudar.
campoContrasenaRegistro.addEventListener("blur", () => {
  if (campoContrasenaRegistro.value === "") requisitosContrasena.hidden = true
})

// Se repinta con cada tecla, que es lo que pide RF-23: «mientras la persona la escribe».
campoContrasenaRegistro.addEventListener("input", (evento) => {
  repintarRequisitos(requisitosContrasena, evento.target.value)
})

// El correo se comprueba **al salir del campo**, no en cada tecla. Escribir un correo pasa por
// muchos estados inválidos —`a`, `an`, `ana@`— y marcarlos en rojo sería regañar a alguien por algo
// que todavía está haciendo. El servidor lo vuelve a comprobar igual (RN-24): esto es solo el aviso
// temprano.
campoCorreoRegistro.addEventListener("blur", () => {
  const correo = campoCorreoRegistro.value.trim()
  if (correo === "") return

  if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(correo)) {
    mostrarAviso(avisoRegistro, MENSAJES.correo_invalido)
  } else {
    esconderAviso(avisoRegistro)
  }
})

formaRegistro.addEventListener("submit", async (evento) => {
  evento.preventDefault()
  esconderAviso(avisoRegistro)

  const respuesta = await pedirAlApi("/api/registro", {
    method: "POST",
    cuerpo: datosDeLaForma(formaRegistro),
  })

  if (respuesta.estado !== 201) {
    // La contraseña tiene su propio mensaje porque nombra qué condición falta; el resto sale de la
    // lista de siempre.
    const mensaje =
      respuesta.cuerpo?.error === "contrasena_invalida"
        ? mensajeDeLaContrasena(respuesta.cuerpo)
        : mensajeDelError(respuesta.cuerpo)

    mostrarAviso(avisoRegistro, mensaje)
    return
  }

  // Al registrarse la sesión ya queda abierta, así que se pasa directo a la pantalla de adentro.
  formaRegistro.reset()
  // `reset()` vacía los campos pero no avisa nada, así que los renglones quedarían verdes sobre un
  // campo vacío. Se vuelven a pintar a mano para que arranquen en gris la próxima vez, y se
  // esconden de nuevo: el formulario tiene que quedar como estaba antes de que nadie lo tocara.
  repintarRequisitos(requisitosContrasena, "")
  requisitosContrasena.hidden = true
  mostrarPantallaDentro(respuesta.cuerpo)
})

for (const boton of botonesDeInicio) {
  boton.addEventListener("click", volverAlInicio)
}

// La marca del encabezado hace lo mismo que «Inicio», y sirve para las dos cuentas. El
// `preventDefault()` es lo que impide que el `#` de su dirección quede pegado en la barra del
// navegador y que la página salte de golpe hacia arriba: acá el subir lo hace `subirLaPantalla()`,
// suave.
enlaceInicio.addEventListener("click", (evento) => {
  evento.preventDefault()
  volverAlInicio()
})

for (const boton of botonesDeSalir) {
  boton.addEventListener("click", async () => {
    await pedirAlApi("/api/sesion", { method: "DELETE" })
    mostrarPantallaEntrada()
  })
}

// Al abrir la página se le pregunta al servidor si la sesión de este navegador sigue abierta.
async function arrancar() {
  agregarOjitoATodasLasContrasenas()

  // El pie de página muestra el negocio también en la pantalla de entrar, así que esto se pide
  // antes de saber si hay sesión. Y se espera a que llegue, porque el calendario necesita saber
  // qué día es hoy para el negocio.
  await cargarNegocio()

  const respuesta = await pedirAlApi("/api/yo")

  if (respuesta.estado === 200) {
    mostrarPantallaDentro(respuesta.cuerpo)
  } else {
    mostrarPantallaEntrada()
  }
}

arrancar()
