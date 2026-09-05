// El comando `npm run sembrar`: carga el catálogo, el horario, los feriados y la cuenta de Personal
// en la base a la que apunten las variables de entorno.
//
// Es lo mismo que hace `npm run datos` en la computadora, pero **sin borrar el archivo primero**:
// contra una base de la red no hay archivo que borrar, y `cargarDatosDePrueba` ya vacía las tablas
// en el orden correcto (una convención del proyecto: una tabla que apunta a otra se agrega al
// borrado, y primero de todo).
//
// ⚠️ **Se lleva las citas y las cuentas de cliente que haya.** Es para preparar la base, no para
// mantenerla: se corre una vez, antes de que exista la primera cita de verdad. Por eso, cuando la
// base es la de la red, pregunta antes.

import "dotenv/config"
import { createInterface } from "node:readline/promises"

import { conectar, destinoDeLaBase } from "../servidor/base-de-datos.js"
import { cargarDatosDePrueba, PERSONAL_PRECARGADO } from "./datos-de-prueba.js"

const destino = destinoDeLaBase()

if (!destino.esArchivo) {
  const pregunta = createInterface({ input: process.stdin, output: process.stdout })
  const respuesta = await pregunta.question(
    "Esto BORRA todo lo que haya en la base de Turso, citas y cuentas incluidas.\n" +
      'Escribí «si» para seguir: ',
  )
  pregunta.close()
  if (respuesta.trim().toLowerCase() !== "si") {
    console.log("No se tocó nada.")
    process.exit(0)
  }
}

const base = await conectar()
await cargarDatosDePrueba(base)

const cuantos = await base.uno("SELECT COUNT(*) AS cuantas FROM servicio")
console.log(`Listo: ${cuantos.cuantas} servicios cargados.`)
console.log(`Cuenta de Personal: ${PERSONAL_PRECARGADO.correo} / ${PERSONAL_PRECARGADO.contrasena}`)

await base.cerrar()
