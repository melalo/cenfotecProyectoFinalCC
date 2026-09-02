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
async function agregarColumnasQueFaltan(base) {
  await agregarColumnaSiFalta(base, "cliente", "telefono", "TEXT")
  await agregarColumnaSiFalta(base, "cliente", "fecha_nacimiento", "TEXT")
  await ponerAlDiaElRegistroDeCorreos(base)
  await exigirQueElCatalogoEsteAlDia(base)
}

/**
 * Rehace `correo_enviado` con su forma de hoy, en una base creada antes de la pieza 9.
 *
 * **Por qué no alcanza con agregar una columna.** Lo que cambió no es solo que ahora exista
 * `personal_id`: es que `cliente_id` **dejó de ser obligatoria**. Nació obligatoria en la pieza 4,
 * cuando el único correo del sistema era la confirmación de una cita y toda cita tiene un cliente.
 * El correo de recuperar la contraseña también le llega a Personal, que no es cliente de nadie
 * (REG-3). Y volver opcional una columna que ya existe es justo lo que `ALTER TABLE` no sabe hacer
 * en SQLite.
 *
 * Así que se hace lo que la documentación de SQLite recomienda para este caso: **se rehace la
 * tabla**. Se crea la nueva con la forma correcta, se copian todas las filas, se borra la vieja y
 * la nueva toma su nombre. Todo adentro de una transacción: si algo falla en el medio no queda
 * nada a medias, vuelve todo como estaba.
 *
 * Las llaves foráneas se apagan mientras dura, y esa es la parte que parece peligrosa y no lo es:
 * apagadas, `DROP TABLE` no sale a reescribir las tablas que apuntan a esta. Se vuelven a encender
 * al terminar.
 *
 * `npm run datos` rehace la base desde cero y no necesita nada de esto. Es para la base de trabajo
 * de alguien que ya venía usando la aplicación.
 *
 * **La transacción pasó de diferida a inmediata el 2026-09-02**, al cambiar la `transaction` de
 * better-sqlite3 por `enTransaccion`, que abre con `BEGIN IMMEDIATE`. Es para mejor, y vale
 * decirlo: esta función **siempre escribe** —rehace una tabla entera—, así que pedir el permiso de
 * escritura al empezar es exactamente lo que corresponde. Diferida, el permiso se pedía a mitad de
 * camino y podía chocar ahí.
 */
async function ponerAlDiaElRegistroDeCorreos(base) {
  const columnas = await base.todas("PRAGMA table_info(correo_enviado)")

  // Una base recién creada ya nace con la forma nueva: no hay nada que mudar.
  if (columnas.some((una) => una.name === "personal_id")) return

  await base.ejecutar("PRAGMA foreign_keys = OFF")

  // La falla de la migración es la que importa, y por eso se guarda en vez de dejarla suelta: si
  // se dejara suelta, el `PRAGMA` de más abajo podría fallar también y **reemplazarla**, y quien
  // lea el error no se enteraría de qué salió mal de verdad. Es la misma decisión que el ROLLBACK
  // de `enTransaccion`, y por la misma razón.
  let fallaDeLaMigracion = null

  try {
    await base.enTransaccion(async (tx) => {
      await tx.ejecutar(formaDelRegistroDeCorreos("correo_enviado_nueva"))

      // Las columnas se nombran una por una a propósito: un `INSERT ... SELECT *` dependería del
      // orden en que están escritas, y bastaría con que alguien agregara una en el medio para que
      // los datos entraran corridos de lugar.
      await tx.ejecutar(`
        INSERT INTO correo_enviado_nueva
          (id, destinatario_correo, cliente_id, cita_id, tipo, enviado_en, exito)
        SELECT id, destinatario_correo, cliente_id, cita_id, tipo, enviado_en, exito
          FROM correo_enviado
      `)

      await tx.ejecutar("DROP TABLE correo_enviado")
      await tx.ejecutar("ALTER TABLE correo_enviado_nueva RENAME TO correo_enviado")

      // El índice se fue con la tabla vieja. Esta línea lo vuelve a crear, igualito.
      await tx.ejecutar(INDICE_DE_CORREOS_POR_CITA)
    })
  } catch (falla) {
    fallaDeLaMigracion = falla
  }

  // Volver a encender las llaves foráneas no es opcional: apagadas, esta conexión —que en
  // `npm start` es la de toda la aplicación— dejaría de comprobarlas mientras viva. Así que si esto
  // falla y no había ninguna falla antes, **se relanza**: callarla dejaría la base sin su red y
  // nadie se enteraría. Sólo se calla cuando ya venía una falla peor, que es la que hay que contar.
  try {
    await base.ejecutar("PRAGMA foreign_keys = ON")
  } catch (falla) {
    if (!fallaDeLaMigracion) throw falla
  }

  if (fallaDeLaMigracion) throw fallaDeLaMigracion
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
async function exigirQueElCatalogoEsteAlDia(base) {
  const columnas = await base.todas("PRAGMA table_info(servicio)")
  if (columnas.some((una) => una.name === "categoria_id")) return

  throw new Error(
    "Esta base de datos es de antes de que existieran las categorías de servicio.\n" +
      "Apagá la aplicación y corré `npm run datos` para volver a cargar el catálogo.",
  )
}

async function agregarColumnaSiFalta(base, tabla, columna, tipo) {
  // ⚠️ Las dos sentencias de esta función **pegan texto adentro del SQL** en vez de pasarlo como
  // parámetro, y son la única concatenación de SQL de todo el proyecto. Acá es seguro por dos
  // razones, y las dos tienen que seguir siendo ciertas: `tabla`, `columna` y `tipo` son textos
  // fijos, escritos a mano más arriba en este mismo archivo —nunca vienen de un formulario ni de la
  // base—, y `PRAGMA` y `ALTER TABLE` **no aceptan parámetros**, así que no hay manera de
  // escribirlo de otra forma. Si alguna vez uno de esos tres valores viniera de afuera, esto se
  // vuelve una puerta abierta: no se copia este patrón a ningún lugar donde el valor no esté
  // escrito acá.
  //
  // `PRAGMA table_info` es cómo se le pregunta a SQLite qué columnas tiene una tabla.
  const columnas = await base.todas(`PRAGMA table_info(${tabla})`)
  if (columnas.some((una) => una.name === columna)) return

  await base.ejecutar(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${tipo}`)
}

async function crearTablas(base) {
  // Los nombres de las tablas y de las columnas no se eligen acá: los fija el bloque «Produce» de
  // cada pieza en `PLAN.md`, y se copian de ahí tal cual.

  // ── Pieza 1: las cuentas ────────────────────────────────────────────────────────────────────
  await base.ejecutar(`
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
  await base.ejecutar(`
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
  await base.ejecutar(`
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

  // ── Pieza 4: el registro de los correos enviados (REG-3) ────────────────────────────────────
  //
  // Una fila por cada correo que el sistema intentó mandar, haya salido bien o no. Las columnas no
  // se inventaron acá: se copiaron del bloque «Produce» de la pieza 4 de `PLAN.md`.
  //
  // Que las fallas también queden guardadas es lo que hace útil a esta tabla. Un registro que solo
  // anotara los envíos exitosos no serviría para lo único que hace falta preguntarle: «¿a quién no
  // le llegó su aviso?».
  await base.ejecutar(formaDelRegistroDeCorreos("correo_enviado"))
  await base.ejecutar(INDICE_DE_CORREOS_POR_CITA)

  // ── Pieza 9: los enlaces para restablecer la contraseña olvidada (RF-3, RN-27) ──────────────
  //
  // Un token es un enlace de un solo uso con fecha de vencimiento. Las columnas no se inventaron
  // acá: se copiaron del bloque «Produce» de la pieza 9 de `PLAN.md`.
  //
  // **El código se guarda tal cual, sin cifrar**, y es lo único de esta pieza que se aparta de lo
  // más estricto. La razón está escrita en `DISENO.md` («Decisiones tomadas al construir la pieza
  // 9»): quien pueda leer esta tabla ya puede cambiar cualquier contraseña directamente, así que
  // cifrarlo no compra nada real, y a cambio se puede mirar la tabla y comprobar el vencimiento —
  // que es literalmente la comprobación 5 del plan.
  await base.ejecutar(`
    CREATE TABLE IF NOT EXISTS token_recuperacion (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      -- Una cuenta de cliente **o** la de Personal, nunca las dos y nunca ninguna. El \`CHECK\` es
      -- lo que lo garantiza de verdad: sin él, «solo uno de los dos viene lleno» sería una
      -- intención escrita en un comentario, y la base aceptaría igual una fila con los dos vacíos.
      cliente_id  INTEGER REFERENCES cliente(id),
      personal_id INTEGER REFERENCES personal(id),
      codigo      TEXT    NOT NULL UNIQUE,
      vence_en    TEXT    NOT NULL,
      -- Vacío mientras el enlace no se haya usado. Cuando se usa, guarda el momento exacto: sirve
      -- para rechazarlo la segunda vez y para saber cuándo alguien restableció su contraseña.
      usado_en    TEXT,
      CHECK ((cliente_id IS NULL) <> (personal_id IS NULL))
    );
  `)
}

/**
 * La forma que tiene hoy el registro de correos.
 *
 * Es una función que recibe el nombre de la tabla, y no un texto fijo, porque hacen falta **dos**
 * cosas con esta misma forma: crear `correo_enviado` en una base nueva, y crear la tabla
 * provisional con la que se rehace la de una base vieja (ver `ponerAlDiaElRegistroDeCorreos`).
 * Escrita dos veces, un día una de las dos se quedaría atrás.
 */
function formaDelRegistroDeCorreos(tabla) {
  return `
    CREATE TABLE IF NOT EXISTS ${tabla} (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      destinatario_correo TEXT    NOT NULL,
      -- A quién le llegó: un cliente **o** la cuenta de Personal, solo uno de los dos (REG-3).
      -- \`cliente_id\` era obligatoria hasta la pieza 9, cuando el único correo del sistema era la
      -- confirmación de una cita y toda cita tiene un cliente. El de recuperar la contraseña
      -- también le llega a Personal, que no es cliente de nadie.
      cliente_id          INTEGER REFERENCES cliente(id),
      personal_id         INTEGER REFERENCES personal(id),
      -- Vacío para los correos que no son de una cita: el de recuperar la contraseña (pieza 9).
      cita_id             INTEGER REFERENCES cita(id),
      -- \`confirmacion\`, \`recordatorio\` (pieza 6) o \`recuperacion\` (pieza 9).
      tipo                TEXT    NOT NULL,
      enviado_en          TEXT    NOT NULL,
      -- SQLite no tiene un tipo «sí o no»: se guarda 1 o 0, igual que \`debe_cambiar_contrasena\`.
      exito               INTEGER NOT NULL,
      CHECK ((cliente_id IS NULL) <> (personal_id IS NULL))
    );
  `
}

/**
 * La pieza 6 pregunta muy seguido «¿a esta cita ya le mandé el recordatorio?», y ese es justamente
 * el atajo que evita recorrer la tabla entera en cada revisión.
 *
 * Va aparte de la tabla porque un índice **se va con la tabla que vigila**: al rehacer el registro
 * hay que volver a crearlo, y hacerlo con esta misma línea es lo que garantiza que quede igual.
 */
const INDICE_DE_CORREOS_POR_CITA =
  "CREATE INDEX IF NOT EXISTS correo_por_cita ON correo_enviado (cita_id, tipo)"
