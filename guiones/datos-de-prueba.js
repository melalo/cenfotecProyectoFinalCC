// Los datos de prueba que carga `npm run datos`. Todos inventados: el curso no permite datos
// reales de personas ni de negocios.
//
// Está separado del comando (`cargar-datos.js`) para que las pruebas automáticas puedan cargar
// exactamente los mismos datos. Así, cuando una prueba mira el calendario de Ana, está mirando el
// mismo horario y los mismos feriados que ve la aplicación de verdad, y no una copia parecida.

import { cifrarContrasena } from "../servidor/contrasenas.js"

/** La cuenta de Personal precargada (RN-10). Documentada en `README.md`, «Datos de prueba». */
export const PERSONAL_PRECARGADO = {
  nombre: "Marta Jiménez",
  correo: "personal@ejemplo.com",
  contrasena: "Personal123",
}

/**
 * El negocio (REG-4). **Todo inventado**, incluido el teléfono: «Belleza y Bienestar» no existe y
 * el 2000-0000 no es el número de nadie.
 *
 * El logo y los colores se guardan porque REG-4 pide registrarlos, pero **la aplicación no los
 * aplica**: su apariencia sale de `VISUALS.md`. Son dos cosas distintas — `VISUALS.md` es cómo se
 * ve la aplicación, y esto es la marca del negocio que la usa (`CLAUDE.md`, «Lo visual»).
 */
export const NEGOCIO = {
  nombre: "Belleza y Bienestar",
  telefono: "2000-0000",
  ubicacion: "Avenida Central, San José — edificio Girasol, local 3",
  logo: null,
  colorPrincipal: "#6B8E7B",
  colorSecundario: "#C9A227",
}

/**
 * El horario de atención (RN-3), un tramo por cada rato que el negocio abre.
 *
 * Entre semana hay **dos** tramos: de 9 a 12 y de 13 a 18. El almuerzo no está escrito en ninguna
 * parte — es el hueco entre los dos, y por eso no hay forma de olvidarse de restarlo. El sábado es
 * un solo tramo de 9 a 13. El domingo no tiene ninguno, y por eso está cerrado.
 *
 * Como cada cita dura una hora y la última tiene que caber entera dentro de su tramo, entre semana
 * los horarios son 9, 10, 11, 13, 14, 15, 16 y 17 (ocho), y el sábado 9, 10, 11 y 12 (cuatro):
 * 44 por semana por proveedor, que es la capacidad declarada en `ESPECIFICACION.md`.
 *
 * `diaSemana`: 0 domingo, 1 lunes … 6 sábado.
 */
export const HORARIO_DEL_NEGOCIO = [
  { diaSemana: 1, horaInicio: 9, horaFin: 12 },
  { diaSemana: 1, horaInicio: 13, horaFin: 18 },
  { diaSemana: 2, horaInicio: 9, horaFin: 12 },
  { diaSemana: 2, horaInicio: 13, horaFin: 18 },
  { diaSemana: 3, horaInicio: 9, horaFin: 12 },
  { diaSemana: 3, horaInicio: 13, horaFin: 18 },
  { diaSemana: 4, horaInicio: 9, horaFin: 12 },
  { diaSemana: 4, horaInicio: 13, horaFin: 18 },
  { diaSemana: 5, horaInicio: 9, horaFin: 12 },
  { diaSemana: 5, horaInicio: 13, horaFin: 18 },
  { diaSemana: 6, horaInicio: 9, horaFin: 13 },
]

/**
 * Los feriados de ley de Costa Rica (RN-2), precargados como dato fijo: no se le pregunta a ningún
 * servicio en línea (`CLAUDE.md`, Restricciones).
 *
 * ── Dos decisiones, tomadas por la estudiante el 2026-08-18 ──────────────────────────────────
 *
 * 1. **Van en su fecha original, sin trasladarse al lunes.** La ley costarricense permite correr
 *    algunos feriados al lunes siguiente. Acá no se hace, y la razón es la comprobación 9 de la
 *    pieza 2, que dice literalmente «mirar el 15 de setiembre»: si el feriado se corriera, ese día
 *    quedaría libre y la comprobación dejaría de comprobar lo que dice.
 *
 * 2. **Se cargan dos años, 2026 y 2027.** Casi todos los feriados caen siempre en la misma fecha,
 *    pero **Jueves y Viernes Santo se mueven cada año** (dependen de la Pascua: 5 de abril en 2026,
 *    28 de marzo en 2027), así que hay que saber sus fechas de antemano. Cuando el prototipo llegue
 *    a 2028, se agregan más filas acá — sin tocar una línea de código.
 *
 * ── Dos feriados que quedaron afuera, a propósito ────────────────────────────────────────────
 *
 * El 12 de octubre (Día de las Culturas) y el 31 de agosto (Día de la Persona Negra y la Cultura
 * Afrocostarricense) **no** están en esta lista: son de pago no obligatorio y su tratamiento
 * cambió con las reformas de traslado, así que no todo negocio cierra esos días. Si «Belleza y
 * Bienestar» quisiera cerrarlos, se agregan como dos filas más de esta misma lista.
 */
export const FERIADOS = [
  // 2026 — Pascua: 5 de abril
  { fecha: "2026-01-01", nombre: "Año Nuevo" },
  { fecha: "2026-04-02", nombre: "Jueves Santo" },
  { fecha: "2026-04-03", nombre: "Viernes Santo" },
  { fecha: "2026-04-11", nombre: "Día de Juan Santamaría" },
  { fecha: "2026-05-01", nombre: "Día Internacional del Trabajo" },
  { fecha: "2026-07-25", nombre: "Anexión del Partido de Nicoya" },
  { fecha: "2026-08-02", nombre: "Día de la Virgen de los Ángeles" },
  { fecha: "2026-08-15", nombre: "Día de la Madre" },
  { fecha: "2026-09-15", nombre: "Día de la Independencia" },
  { fecha: "2026-12-01", nombre: "Día de la Abolición del Ejército" },
  { fecha: "2026-12-25", nombre: "Navidad" },

  // 2027 — Pascua: 28 de marzo
  { fecha: "2027-01-01", nombre: "Año Nuevo" },
  { fecha: "2027-03-25", nombre: "Jueves Santo" },
  { fecha: "2027-03-26", nombre: "Viernes Santo" },
  { fecha: "2027-04-11", nombre: "Día de Juan Santamaría" },
  { fecha: "2027-05-01", nombre: "Día Internacional del Trabajo" },
  { fecha: "2027-07-25", nombre: "Anexión del Partido de Nicoya" },
  { fecha: "2027-08-02", nombre: "Día de la Virgen de los Ángeles" },
  { fecha: "2027-08-15", nombre: "Día de la Madre" },
  { fecha: "2027-09-15", nombre: "Día de la Independencia" },
  { fecha: "2027-12-01", nombre: "Día de la Abolición del Ejército" },
  { fecha: "2027-12-25", nombre: "Navidad" },
]

/**
 * El catálogo: las categorías, los servicios de cada una, y quién atiende cada servicio.
 *
 * ── Cómo llegó a ser así ─────────────────────────────────────────────────────────────────────
 *
 * El plan pedía dos servicios y dos proveedores, con Ana atendiendo los dos y Carlos solo el masaje.
 * Después:
 *
 * 1. **La estudiante agregó a Luisa el 2026-08-19**, en la limpieza facial, con esta razón: con una
 *    sola proveedora el cliente no elegía nada, y elegir con quién es justamente lo que RN-8 le da.
 *    La comprobación 2 de `PLAN.md` se corrigió con esa nota.
 * 2. **Ese mismo día pidió las categorías** (pieza 11), y con ellas entraron dos tipos de masaje más.
 *
 * ── Por qué los datos son estos y no otros ───────────────────────────────────────────────────
 *
 * **«Masaje» tiene tres servicios y «Facial» uno solo, a propósito.** Es lo que hace comprobable
 * RN-22: con tres, el cliente elige el tipo; con uno, ese paso no se muestra. Si las dos categorías
 * tuvieran varios, la mitad de la regla no se podría ver nunca en pantalla.
 *
 * **Los tres masajes tienen proveedores distintos**, también a propósito: elegir el tipo cambia quién
 * atiende, así que el paso nuevo no es decorativo.
 *
 * Todos los servicios duran una hora (glosario de `ESPECIFICACION.md`). Los subtipos **no** traen
 * duraciones distintas: eso está declarado fuera de alcance.
 */
export const CATEGORIAS = [
  {
    nombre: "Masaje",
    servicios: [
      { nombre: "Masaje relajante", duracionMinutos: 60, proveedores: ["Ana", "Carlos"] },
      { nombre: "Masaje descontracturante", duracionMinutos: 60, proveedores: ["Carlos"] },
      { nombre: "Masaje con piedras calientes", duracionMinutos: 60, proveedores: ["Ana"] },
    ],
  },
  {
    nombre: "Facial",
    servicios: [{ nombre: "Limpieza facial", duracionMinutos: 60, proveedores: ["Ana", "Luisa"] }],
  },
]

/** Los proveedores. «Ana» la proveedora no tiene nada que ver con «Ana Rodríguez» la clienta de
 *  prueba: son dos personas inventadas distintas que casualmente comparten nombre de pila. */
export const PROVEEDORES = ["Ana", "Carlos", "Luisa"]

export function cargarDatosDePrueba(base) {
  // En la aplicación nada se borra nunca (RN-15). Este guion es la única excepción, y es a
  // propósito: rehace los datos de prueba desde cero para poder correrlo las veces que haga falta.
  // El orden importa: primero lo que apunta a otras tablas, después lo apuntado.
  base.exec(`
    -- \`correo_enviado\` va primero de todo (pieza 4): apunta a \`cita\` y a \`cliente\`, y con las
    -- llaves foráneas encendidas SQLite se niega a borrar una fila que alguien todavía señala.
    DELETE FROM correo_enviado;
    DELETE FROM cita;
    DELETE FROM servicio_proveedor;
    DELETE FROM servicio;
    DELETE FROM categoria;
    DELETE FROM proveedor;
    DELETE FROM cliente;
    DELETE FROM personal;
    DELETE FROM horario_negocio;
    DELETE FROM feriado;
    DELETE FROM configuracion_negocio;
  `)

  cargarPersonal(base)
  cargarNegocio(base)
  cargarHorario(base)
  cargarFeriados(base)
  cargarCatalogo(base)
}

function cargarPersonal(base) {
  base
    .prepare("INSERT INTO personal (nombre, correo, contrasena_cifrada) VALUES (?, ?, ?)")
    .run(
      PERSONAL_PRECARGADO.nombre,
      PERSONAL_PRECARGADO.correo,
      cifrarContrasena(PERSONAL_PRECARGADO.contrasena),
    )
}

function cargarNegocio(base) {
  base
    .prepare(
      `INSERT INTO configuracion_negocio
         (nombre, telefono, ubicacion, logo, color_principal, color_secundario)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      NEGOCIO.nombre,
      NEGOCIO.telefono,
      NEGOCIO.ubicacion,
      NEGOCIO.logo,
      NEGOCIO.colorPrincipal,
      NEGOCIO.colorSecundario,
    )
}

function cargarHorario(base) {
  const guardar = base.prepare(
    "INSERT INTO horario_negocio (dia_semana, hora_inicio, hora_fin) VALUES (?, ?, ?)",
  )

  for (const tramo of HORARIO_DEL_NEGOCIO) {
    guardar.run(tramo.diaSemana, tramo.horaInicio, tramo.horaFin)
  }
}

function cargarFeriados(base) {
  const guardar = base.prepare("INSERT INTO feriado (fecha, nombre) VALUES (?, ?)")

  for (const feriado of FERIADOS) {
    guardar.run(feriado.fecha, feriado.nombre)
  }
}

function cargarCatalogo(base) {
  const guardarProveedor = base.prepare("INSERT INTO proveedor (nombre) VALUES (?)")
  const idPorNombre = new Map()

  for (const nombre of PROVEEDORES) {
    const creado = guardarProveedor.run(nombre)
    idPorNombre.set(nombre, Number(creado.lastInsertRowid))
  }

  const guardarCategoria = base.prepare("INSERT INTO categoria (nombre) VALUES (?)")
  const guardarServicio = base.prepare(
    "INSERT INTO servicio (nombre, duracion_minutos, categoria_id) VALUES (?, ?, ?)",
  )
  const enlazar = base.prepare(
    "INSERT INTO servicio_proveedor (servicio_id, proveedor_id) VALUES (?, ?)",
  )

  for (const categoria of CATEGORIAS) {
    const categoriaCreada = guardarCategoria.run(categoria.nombre)

    for (const servicio of categoria.servicios) {
      const creado = guardarServicio.run(
        servicio.nombre,
        servicio.duracionMinutos,
        Number(categoriaCreada.lastInsertRowid),
      )

      for (const nombreProveedor of servicio.proveedores) {
        enlazar.run(Number(creado.lastInsertRowid), idPorNombre.get(nombreProveedor))
      }
    }
  }
}
