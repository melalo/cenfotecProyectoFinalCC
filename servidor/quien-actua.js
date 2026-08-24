// Quién está actuando: el cliente por su cuenta, o Personal atendiendo el teléfono.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// POR QUÉ ESTAS DOS LÍNEAS VIVEN EN SU PROPIO ARCHIVO
//
// Nacieron en `servidor/reservas.js` con la pieza 5, porque ahí eran los dos valores que puede tomar
// la columna `cancelada_por` (REG-1). Se mudaron acá el 2026-08-21, al construir RN-25, y la razón es
// concreta: **ahora `servidor/disponibilidad.js` también necesita saber quién pregunta**, porque el
// día de hoy ofrece horarios a Personal y no al cliente.
//
// Si se quedaran en `reservas.js`, los dos archivos se importarían entre sí —`reservas.js` le pregunta
// a `disponibilidad.js` si un horario está libre, y `disponibilidad.js` necesitaría de `reservas.js`
// estas constantes—. Eso es un **círculo de importaciones**: dos archivos que se piden cosas
// mutuamente. JavaScript a veces lo tolera y a veces deja una de las dos cosas sin valor, según cuál
// se cargue primero; y cuando falla, falla de una forma difícil de entender.
//
// La salida es la de siempre: **lo que dos archivos comparten se saca a un tercero que no depende de
// nadie.** Este archivo no importa nada, así que nunca puede ser parte de un círculo.
//
// La alternativa era escribir el texto `"personal"` a mano dentro de `disponibilidad.js`. Eso también
// funciona, y es exactamente lo que `CLAUDE.md` prohíbe: la misma palabra escrita en dos lados es la
// que un día se escribe distinto en uno de los dos.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Los dos actores del sistema. Son también los dos valores que puede tomar la columna
 * `cancelada_por` de la tabla `cita` (REG-1), y lo que decide **tres** reglas:
 *
 *   - **RN-5 / RN-6:** si la ventana de 4 horas se aplica al cancelar y al mover.
 *   - **RN-4 / RN-25:** si se puede reservar o mover una cita al día de hoy.
 *   - **RN-13:** todo lo demás alcanza a los dos por igual — horario ocupado, feriado, domingo,
 *     almuerzo.
 *
 * No hay un tercer actor y no está previsto que haya: `ESPECIFICACION.md` tiene dos tipos de cuenta,
 * Cliente y Personal.
 */
export const QUIEN_CLIENTE = "cliente"
export const QUIEN_PERSONAL = "personal"
