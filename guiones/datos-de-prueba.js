// Los datos de prueba que carga `npm run datos`. Todos inventados: el curso no permite datos
// reales de personas ni de negocios.
//
// Está separado del comando (`cargar-datos.js`) para que las pruebas automáticas puedan cargar
// exactamente los mismos datos. Así, cuando una prueba entra con la cuenta de Personal, está
// comprobando la cuenta de verdad y no una copia parecida.

import { cifrarContrasena } from "../servidor/contrasenas.js"

/** La cuenta de Personal precargada (RN-10). Documentada en `README.md`, «Datos de prueba». */
export const PERSONAL_PRECARGADO = {
  nombre: "Marta Jiménez",
  correo: "personal@ejemplo.com",
  contrasena: "Personal123",
}

export function cargarDatosDePrueba(base) {
  // En la aplicación nada se borra nunca (RN-15). Este guion es la única excepción, y es a
  // propósito: rehace los datos de prueba desde cero para poder correrlo las veces que haga falta.
  base.exec("DELETE FROM cliente; DELETE FROM personal;")

  base
    .prepare("INSERT INTO personal (nombre, correo, contrasena_cifrada) VALUES (?, ?, ?)")
    .run(
      PERSONAL_PRECARGADO.nombre,
      PERSONAL_PRECARGADO.correo,
      cifrarContrasena(PERSONAL_PRECARGADO.contrasena),
    )
}
