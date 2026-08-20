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
  solo_clientes:
    "Esta cuenta es del personal del negocio, así que no reserva desde acá. Reservar en nombre de " +
    "quien llama por teléfono es otra pantalla, que todavía no está construida.",
  sin_sesion: "Se cerró tu sesión. Volvé a entrar para seguir.",
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

function mostrarPantallaDentro(cuenta) {
  nombreDeQuienEntro.textContent = cuenta.nombre
  tipoDeCuenta.textContent = cuenta.tipo === "personal" ? "personal del negocio" : "cliente"
  pantallaEntrada.hidden = true
  pantallaDentro.hidden = false

  // El menú aparece solo acá adentro: las dos secciones que enlaza no existen para quien no entró.
  navegacion.hidden = false
  botonMenu.hidden = false
  menuPie.hidden = false

  mostrarVista("reservar")
  empezarAElegir()
}

function mostrarPantallaEntrada() {
  pantallaDentro.hidden = true
  pantallaEntrada.hidden = false

  navegacion.hidden = true
  botonMenu.hidden = true
  menuPie.hidden = true
  cerrarElMenu()

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
}

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
  pasoCategoria.hidden = false
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

  // Ni el día de hoy ni un feriado muestran sus fichas de horario. En los dos casos el día entero
  // está bloqueado —no se puede reservar para hoy (RN-4), y un feriado no tiene ningún horario
  // disponible (RN-2)—, así que dibujar ocho fichas tachadas que nadie puede tomar solo estorba:
  // alcanza con el mensaje de arriba, que además dice el motivo y, si es hoy, a qué número llamar.
  // Pedido de la estudiante el 2026-08-19.
  const diaEnteroBloqueado = dia.fecha === eleccion.negocio.hoy || dia.esFeriado
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

function motivoDelDia(dia) {
  if (dia.estado === "cerrado") return "El negocio no abre este día."
  if (dia.estado === "feriado") return `Feriado: ${dia.nombreFeriado}. El negocio no atiende.`
  if (dia.estado === "lleno") return "No queda ningún horario libre este día."

  if (dia.estado === "hoy_o_pasado") {
    // RN-4: no hay citas para hoy. Ahora el aviso puede decir a qué número llamar, porque el
    // teléfono es parte de la configuración del negocio (REG-4).
    if (dia.fecha === eleccion.negocio.hoy) {
      return `No se puede reservar para hoy. Si necesitás una cita hoy, llamá al negocio al ${eleccion.negocio.telefono}.`
    }
    return "Este día ya pasó."
  }

  return null
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

function botonDeOpcion(nombre, detalle, alTocar) {
  const boton = document.createElement("button")
  boton.type = "button"
  boton.className = "opcion"
  boton.dataset.nombre = nombre

  const titulo = document.createElement("span")
  titulo.className = "opcion__nombre"
  titulo.textContent = nombre
  boton.appendChild(titulo)

  const nota = document.createElement("span")
  nota.className = "opcion__nota"
  nota.textContent = detalle
  boton.appendChild(nota)

  boton.addEventListener("click", alTocar)
  return boton
}

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

  confirmacionTitulo.textContent = moviendo ? "Mové tu cita a este horario" : "Confirmá tu reserva"
  botonConfirmar.textContent = moviendo ? "Mover la cita" : "Confirmar la reserva"
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

  const respuesta = await pedirAlApi("/api/citas", {
    method: "POST",
    cuerpo: {
      servicioId: eleccion.servicio.id,
      proveedorId: eleccion.proveedor.id,
      inicio: eleccion.horario.inicio,
    },
  })

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
  mostrarAvisoDeExito(avisoCitas, "Tu cita quedó reservada. Acá abajo está, con su día y su hora.")
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
  const respuesta = await pedirAlApi("/api/citas")

  listaCitas.replaceChildren()
  listaHistorial.replaceChildren()

  if (respuesta.estado !== 200) {
    // El caso normal acá es la cuenta de Personal, que no tiene citas propias: reservar en nombre de
    // quien llama es otra pantalla, de la pieza 7. El servidor lo dice y acá solo se muestra.
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
      "¿Seguro que querés cancelar esta cita? Ese horario queda libre para otra persona.",
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
    "Tu cita quedó cancelada, y ese horario vuelve a estar libre. Acá abajo queda anotada.",
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

  // Los tres primeros pasos no se muestran: reagendar no los puede cambiar.
  pasoCategoria.hidden = true
  pasoServicio.hidden = true
  pasoProveedor.hidden = true

  reagendarCual.textContent =
    `${cita.servicio}, terapista ${cita.proveedor}. ` +
    `Hoy es el ${tituloDelDia(cita.inicio.slice(0, 10)).toLowerCase()} a las ${cita.inicio.slice(11, 16)}.`
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
    "Tu cita quedó movida. Te mandamos un correo con el día y la hora nuevos.",
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
 */
function repintarRequisitos(contrasena) {
  const todaviaNoEscribioNada = contrasena === ""

  for (const renglon of requisitosContrasena.querySelectorAll(".requisito")) {
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
  repintarRequisitos(evento.target.value)
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
  repintarRequisitos("")
  requisitosContrasena.hidden = true
  mostrarPantallaDentro(respuesta.cuerpo)
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
