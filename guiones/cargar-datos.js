// El comando `npm run datos`: crea la base SQLite desde cero y carga los datos de prueba.
// Se puede correr las veces que haga falta: borra lo anterior y vuelve a empezar.

import { rmSync } from "node:fs"

import { abrirBase, RUTA_DE_LA_BASE } from "../servidor/base-de-datos.js"
import {
  cargarDatosDePrueba,
  CATEGORIAS,
  FERIADOS,
  NEGOCIO,
  PERSONAL_PRECARGADO,
} from "./datos-de-prueba.js"

// «Desde cero» de verdad: se borra el archivo, no solo su contenido. Los dos archivos con `-wal` y
// `-shm` son de la propia SQLite (su cuaderno de borrador) y se van con él.
//
// Si la aplicación está levantada, Windows no deja borrar el archivo porque otro programa lo tiene
// abierto, y el error que Node muestra es un muro de texto que no dice qué hacer. Se atrapa acá
// para explicarlo en una frase.
try {
  for (const archivo of [RUTA_DE_LA_BASE, `${RUTA_DE_LA_BASE}-wal`, `${RUTA_DE_LA_BASE}-shm`]) {
    rmSync(archivo, { force: true })
  }
} catch (error) {
  if (error.code === "EPERM" || error.code === "EBUSY") {
    console.error("No se pudo rehacer la base de datos porque la aplicación está levantada.")
    console.error("")
    console.error("  Apagala primero con Ctrl + C en la terminal donde corre `npm start`,")
    console.error("  y volvé a correr:  npm run datos")
    process.exit(1)
  }
  throw error
}

const base = abrirBase(RUTA_DE_LA_BASE)
cargarDatosDePrueba(base)
base.close()

console.log("Base de datos creada desde cero, con los datos de prueba cargados:")
console.log("")
console.log(`  - Negocio:            ${NEGOCIO.nombre} · tel. ${NEGOCIO.telefono}`)
console.log(`  - Cuenta de Personal: ${PERSONAL_PRECARGADO.correo} / ${PERSONAL_PRECARGADO.contrasena}`)
console.log(`  - Categorías:         ${CATEGORIAS.map((una) => una.nombre).join(", ")}`)
for (const categoria of CATEGORIAS) {
  for (const servicio of categoria.servicios) {
    console.log(`      · ${categoria.nombre} → ${servicio.nombre}: ${servicio.proveedores.join(" y ")}`)
  }
}
console.log("  - Horario:            lunes a viernes 9–12 y 13–18, sábados 9–13, domingo cerrado")
console.log(`  - Feriados:           ${FERIADOS.length} de ley de Costa Rica (2026 y 2027)`)
console.log("")
console.log("Todo inventado: el curso no permite datos reales de personas ni de negocios.")
console.log("Las citas se crean desde la aplicación, así que la base arranca sin ninguna.")
