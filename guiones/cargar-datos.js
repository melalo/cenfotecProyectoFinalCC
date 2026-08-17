// El comando `npm run datos`: crea la base SQLite desde cero y carga los datos de prueba.
// Se puede correr las veces que haga falta: borra lo anterior y vuelve a empezar.

import { rmSync } from "node:fs"

import { abrirBase, RUTA_DE_LA_BASE } from "../servidor/base-de-datos.js"
import { cargarDatosDePrueba, PERSONAL_PRECARGADO } from "./datos-de-prueba.js"

// «Desde cero» de verdad: se borra el archivo, no solo su contenido. Los dos archivos con `-wal` y
// `-shm` son de la propia SQLite (su cuaderno de borrador) y se van con él.
for (const archivo of [RUTA_DE_LA_BASE, `${RUTA_DE_LA_BASE}-wal`, `${RUTA_DE_LA_BASE}-shm`]) {
  rmSync(archivo, { force: true })
}

const base = abrirBase(RUTA_DE_LA_BASE)
cargarDatosDePrueba(base)
base.close()

console.log("Base de datos creada desde cero, con los datos de prueba cargados:")
console.log(`  - Cuenta de Personal: ${PERSONAL_PRECARGADO.correo} / ${PERSONAL_PRECARGADO.contrasena}`)
console.log("")
console.log("Los servicios, los proveedores, el horario del negocio y los feriados llegan con la")
console.log("pieza 2 del plan, que es la que crea esas tablas.")
