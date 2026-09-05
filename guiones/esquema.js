// El comando `npm run esquema`: crea las tablas y los índices en la base a la que apunten las
// variables de entorno. **No carga ni un dato** y no borra nada: se puede correr las veces que haga
// falta.
//
// Existe porque el despliegue no crea el esquema en cada visita, a propósito
// (`servidor/aplicacion-desplegada.js` explica por qué: serían decenas de viajes a una base que está
// en la red, en cada visita fría). Alguien tiene que crearlo una vez, y ese alguien es esto.
//
//   TURSO_DATABASE_URL=libsql://… TURSO_AUTH_TOKEN=… npm run esquema
//
// Sin esas variables trabaja sobre el archivo de `datos/`, que es lo que ya hace `npm run datos`.

import "dotenv/config"

import { conectar, destinoDeLaBase } from "../servidor/base-de-datos.js"
import { crearEsquema } from "../servidor/esquema.js"

const destino = destinoDeLaBase()
console.log(`Creando el esquema en: ${destino.esArchivo ? destino.url : "la base de Turso"}`)

const base = await conectar()
await crearEsquema(base)

const tablas = await base.todas(
  "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
)
console.log(`Listo. ${tablas.length} tablas: ${tablas.map((una) => una.name).join(", ")}`)

await base.cerrar()
