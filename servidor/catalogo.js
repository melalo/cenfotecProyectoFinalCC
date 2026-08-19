// Las preguntas que se le hacen al catálogo del negocio: si un servicio existe, y si un proveedor
// atiende ese servicio.
//
// Son dos líneas de SQL, pero viven acá y no adentro de un archivo de rutas por una razón: desde la
// pieza 3 hay **dos** grupos de endpoints que necesitan la misma respuesta —el calendario, para no
// mostrar los horarios de alguien que no atiende ese servicio, y la reserva, para no guardar una
// cita que nadie puede dar—. La regla de `CLAUDE.md` es que eso se escribe en un solo lugar y quien
// lo necesite lo llama.
//
// El componente **Catálogo** de `DISENO.md` dice que Reservas y Calendario solo leen de acá. Esto
// es ese «solo leen».

/**
 * Todas las categorías, cada una con los servicios que contiene (pieza 11).
 *
 * Trae el árbol completo en un solo pedido —son dos categorías y cuatro servicios— para que la
 * pantalla no tenga que pedir los servicios de cada categoría a medida que la persona toca.
 *
 * Cada categoría viene con **`pideElegirTipo`**, que es el servidor diciéndole a la pantalla si tiene
 * que mostrar el paso de elegir el servicio (RN-22). No es la pantalla contando cuántos llegaron: es
 * la convención del proyecto, que el frontend no decida reglas de negocio y reciba el *por qué* junto
 * con el *qué*.
 */
export function listarCategorias(base) {
  const categorias = base.prepare("SELECT id, nombre FROM categoria ORDER BY nombre").all()

  return categorias.map((categoria) => {
    const servicios = listarServiciosDeCategoria(base, categoria.id)

    return {
      id: categoria.id,
      nombre: categoria.nombre,
      // Con un solo servicio no hay nada que elegir, así que ese paso no se muestra (RN-22).
      pideElegirTipo: servicios.length > 1,
      servicios,
    }
  })
}

/** Los servicios de una categoría, ordenados por nombre. */
export function listarServiciosDeCategoria(base, categoriaId) {
  return base
    .prepare(
      `SELECT id, nombre, duracion_minutos AS duracionMinutos
         FROM servicio
        WHERE categoria_id = ?
        ORDER BY nombre`,
    )
    .all(categoriaId)
}

/**
 * Todos los servicios del negocio, cada uno con el nombre de su categoría.
 *
 * Es lo que devuelve `GET /api/servicios`, que existe desde la pieza 2 y se conserva tal cual: es
 * parte de un contrato ya cerrado. La pantalla ya no lo usa —usa las categorías—, pero los dos leen
 * de acá, así que no hay dos consultas que se puedan desincronizar.
 */
export function listarServicios(base) {
  return base
    .prepare(
      `SELECT servicio.id, servicio.nombre, servicio.duracion_minutos AS duracionMinutos,
              categoria.nombre AS categoria
         FROM servicio
         JOIN categoria ON categoria.id = servicio.categoria_id
        ORDER BY categoria.nombre, servicio.nombre`,
    )
    .all()
}

/** ¿Existe esa categoría? */
export function existeLaCategoria(base, categoriaId) {
  if (!categoriaId) return false
  return Boolean(base.prepare("SELECT id FROM categoria WHERE id = ?").get(categoriaId))
}

/** ¿Existe ese servicio? */
export function existeElServicio(base, servicioId) {
  if (!servicioId) return false
  return Boolean(base.prepare("SELECT id FROM servicio WHERE id = ?").get(servicioId))
}

/**
 * ¿Ese proveedor atiende ese servicio?
 *
 * No es un detalle: pedir el calendario de Carlos para la limpieza facial, que él no atiende,
 * mostraría horarios que nadie puede tomar, y reservar esa combinación crearía una cita imposible
 * de atender.
 */
export function eseProveedorAtiendeEseServicio(base, servicioId, proveedorId) {
  if (!servicioId || !proveedorId) return false

  const fila = base
    .prepare("SELECT 1 FROM servicio_proveedor WHERE servicio_id = ? AND proveedor_id = ?")
    .get(servicioId, proveedorId)

  return Boolean(fila)
}
