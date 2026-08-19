// Abre el archivo SQLite y se asegura de que las tablas existan.
//
// La base de datos de este proyecto es un solo archivo dentro de la carpeta `datos/`. No hay
// ningún servidor de base de datos que instalar: `better-sqlite3` lo trae adentro (decidido en
// `DISENO.md`, «Motor de base de datos»).

import Database from "better-sqlite3"
import { mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const CARPETA_DE_ESTE_ARCHIVO = dirname(fileURLToPath(import.meta.url))

/** Dónde vive la base de trabajo. Las pruebas usan su propio archivo temporal, no este. */
export const RUTA_DE_LA_BASE = join(CARPETA_DE_ESTE_ARCHIVO, "..", "datos", "reservas.sqlite")

/**
 * Abre la base en la ruta indicada y crea las tablas que falten. Se puede llamar sobre una base
 * que ya existe: no borra ni cambia nada de lo que haya guardado.
 */
export function abrirBase(rutaArchivo) {
  mkdirSync(dirname(rutaArchivo), { recursive: true })

  const base = new Database(rutaArchivo)

  // WAL deja que alguien lea mientras otro escribe. Hace falta desde la pieza 3, donde dos
  // clientes pueden intentar reservar el mismo horario en el mismo instante (CA-1).
  base.pragma("journal_mode = WAL")
  base.pragma("foreign_keys = ON")

  crearTablas(base)
  agregarColumnasQueFaltan(base)
  return base
}

/**
 * Las columnas que se agregaron después de que la tabla ya existía.
 *
 * `CREATE TABLE IF NOT EXISTS` sirve para una tabla nueva, pero **no toca una que ya está**: en una
 * base creada antes de la pieza 10, la tabla `cliente` existe sin `telefono` ni `fecha_nacimiento`,
 * y el `CREATE` de arriba no las agrega. Esto sí, y sin borrar nada de lo que haya guardado.
 *
 * `npm run datos` rehace la base desde cero y no lo necesita. Esto es para la base de trabajo de
 * alguien que ya venía usando la aplicación.
 */
function agregarColumnasQueFaltan(base) {
  agregarColumnaSiFalta(base, "cliente", "telefono", "TEXT")
  agregarColumnaSiFalta(base, "cliente", "fecha_nacimiento", "TEXT")
  exigirQueElCatalogoEsteAlDia(base)
}

/**
 * La pieza 11 le agregó a `servicio` una columna **obligatoria**, `categoria_id`, y esa no se puede
 * agregar a una tabla que ya tiene filas: habría que inventar a qué categoría pertenece cada
 * servicio que ya existía, y este proyecto no inventa datos.
 *
 * Así que en vez de arreglarlo a medias —dejando servicios sin categoría, que no aparecerían en
 * ninguna pantalla— la aplicación **se niega a arrancar y dice qué hacer**. No se pierde nada de
 * valor: el catálogo es configuración que se carga con un comando, no algo que alguien escribió a
 * mano desde la aplicación (`ESPECIFICACION.md`, «Fuera de alcance»).
 */
function exigirQueElCatalogoEsteAlDia(base) {
  const columnas = base.prepare("PRAGMA table_info(servicio)").all()
  if (columnas.some((una) => una.name === "categoria_id")) return

  throw new Error(
    "Esta base de datos es de antes de que existieran las categorías de servicio.\n" +
      "Apagá la aplicación y corré `npm run datos` para volver a cargar el catálogo.",
  )
}

function agregarColumnaSiFalta(base, tabla, columna, tipo) {
  // `PRAGMA table_info` es cómo se le pregunta a SQLite qué columnas tiene una tabla.
  const columnas = base.prepare(`PRAGMA table_info(${tabla})`).all()
  if (columnas.some((una) => una.name === columna)) return

  base.exec(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${tipo}`)
}

function crearTablas(base) {
  // Los nombres de las tablas y de las columnas no se eligen acá: los fija el bloque «Produce» de
  // cada pieza en `PLAN.md`, y se copian de ahí tal cual.

  // ── Pieza 1: las cuentas ────────────────────────────────────────────────────────────────────
  base.exec(`
    CREATE TABLE IF NOT EXISTS cliente (
      id                      INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre                  TEXT    NOT NULL,
      correo                  TEXT    NOT NULL UNIQUE,
      contrasena_cifrada      TEXT    NOT NULL,
      debe_cambiar_contrasena INTEGER NOT NULL DEFAULT 0,
      -- Las dos que agregó la pieza 10, para la sección «Usuario» (REG-2). Son opcionales: una
      -- cuenta se crea sin ellas y se completan después. La fecha se escribe 1990-03-15.
      -- No hay ninguna columna de edad: la edad se calcula, porque un número guardado queda viejo
      -- en el próximo cumpleaños.
      telefono                TEXT,
      fecha_nacimiento        TEXT
    );

    CREATE TABLE IF NOT EXISTS personal (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre             TEXT    NOT NULL,
      correo             TEXT    NOT NULL UNIQUE,
      contrasena_cifrada TEXT    NOT NULL
    );
  `)

  // ── Pieza 2: el catálogo y la configuración del negocio ─────────────────────────────────────
  //
  // No hay pantalla para editar nada de esto: se carga como configuración con `npm run datos`
  // (`ESPECIFICACION.md`, «Fuera de alcance»).
  base.exec(`
    -- Las categorías agrupan servicios: «Masaje», «Facial». Las agregó la pieza 11. No se reserva
    -- una categoría: se reserva un servicio de adentro, y es el servicio lo que queda en la cita.
    CREATE TABLE IF NOT EXISTS categoria (
      id     INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT    NOT NULL
    );

    -- \`categoria_id\` es OBLIGATORIA (pieza 11). Un servicio sin categoría no aparecería en ninguna
    -- parte de la pantalla: existiría en la base y sería invisible, que es peor que no existir.
    CREATE TABLE IF NOT EXISTS servicio (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre           TEXT    NOT NULL,
      duracion_minutos INTEGER NOT NULL,
      categoria_id     INTEGER NOT NULL REFERENCES categoria(id)
    );

    CREATE TABLE IF NOT EXISTS proveedor (
      id     INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT    NOT NULL
    );

    -- Qué proveedor atiende qué servicio. Un servicio puede tener varios proveedores y un
    -- proveedor puede atender varios servicios (glosario de \`ESPECIFICACION.md\`), y eso no entra
    -- en una columna: hace falta una tabla que junte los dos.
    CREATE TABLE IF NOT EXISTS servicio_proveedor (
      servicio_id  INTEGER NOT NULL REFERENCES servicio(id),
      proveedor_id INTEGER NOT NULL REFERENCES proveedor(id),
      PRIMARY KEY (servicio_id, proveedor_id)
    );

    -- Los datos del negocio. Es una sola fila: hay un solo negocio y una sola ubicación.
    CREATE TABLE IF NOT EXISTS configuracion_negocio (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre            TEXT NOT NULL,
      telefono          TEXT NOT NULL,
      ubicacion         TEXT NOT NULL,
      logo              TEXT,
      color_principal   TEXT,
      color_secundario  TEXT
    );

    -- El horario semanal, un tramo por cada rato que el negocio atiende. Entre semana son dos
    -- (9–12 y 13–18) y el almuerzo es el hueco entre ellos, no un dato aparte. El sábado es uno
    -- solo (9–13). El domingo no tiene ninguno, y por eso está cerrado (RN-3).
    -- \`dia_semana\`: 0 domingo, 1 lunes … 6 sábado. \`hora_inicio\` y \`hora_fin\`: la hora del día.
    CREATE TABLE IF NOT EXISTS horario_negocio (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      dia_semana  INTEGER NOT NULL,
      hora_inicio INTEGER NOT NULL,
      hora_fin    INTEGER NOT NULL
    );

    -- Los feriados, uno por fila, con la fecha escrita como 2026-09-15 (RN-2). Se precargan como
    -- dato fijo: no se le pregunta a ningún servicio en línea (\`CLAUDE.md\`, Restricciones).
    CREATE TABLE IF NOT EXISTS feriado (
      id     INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha  TEXT NOT NULL UNIQUE,
      nombre TEXT NOT NULL
    );
  `)

  // ── La tabla de citas ───────────────────────────────────────────────────────────────────────
  //
  // Las citas se crean en la pieza 3, pero la tabla nace acá, vacía. La razón: la comprobación 11
  // de la pieza 2 pide insertar a mano una cita activa y ver que su horario deja de aparecer
  // libre; sin la tabla, esa comprobación no se puede correr. Las columnas no se inventaron acá:
  // se copiaron del bloque «Produce» de la pieza 3, que es donde el plan las fija.
  //
  // Las cinco últimas columnas quedan vacías hasta que las llenen las piezas 5, 7 y 8.
  base.exec(`
    CREATE TABLE IF NOT EXISTS cita (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id          INTEGER NOT NULL REFERENCES cliente(id),
      servicio_id         INTEGER NOT NULL REFERENCES servicio(id),
      proveedor_id        INTEGER NOT NULL REFERENCES proveedor(id),
      inicio              TEXT    NOT NULL,
      estado              TEXT    NOT NULL,
      creada_en           TEXT    NOT NULL,
      canal               TEXT    NOT NULL,
      personal_id_creador INTEGER REFERENCES personal(id),
      cancelada_en        TEXT,
      cancelada_por       TEXT,
      cerrada_en          TEXT,
      cerrada_por         INTEGER REFERENCES personal(id)
    );

    -- El calendario pregunta muy seguido «¿qué tiene reservado este proveedor?». Este índice es
    -- el atajo para que no tenga que recorrer la tabla entera cada vez.
    CREATE INDEX IF NOT EXISTS cita_por_proveedor ON cita (proveedor_id, estado, inicio);

    -- ── El candado de CA-1, agregado por la pieza 3 ───────────────────────────────────────────
    --
    -- Un horario solo puede tener UNA cita activa por proveedor (RN-1). Esta línea es la que lo
    -- garantiza de verdad: la base se niega a guardar la segunda. El código igual comprueba antes
    -- si el horario está libre, pero comprobar y después insertar son dos movimientos, y entre uno
    -- y otro cabe la reserva de otra persona — que es exactamente la carrera de CA-1. Acá no cabe
    -- nada: la segunda inserción no es improbable, es imposible.
    --
    -- Es un índice **parcial** (el \`WHERE\` del final): solo vigila las citas activas. Si vigilara
    -- todas, una cita cancelada seguiría bloqueando su horario para siempre y RN-7 —«cancelar
    -- libera el horario de inmediato»— no se podría cumplir nunca.
    CREATE UNIQUE INDEX IF NOT EXISTS cita_horario_unico
      ON cita (proveedor_id, inicio) WHERE estado = 'activa';
  `)
}
