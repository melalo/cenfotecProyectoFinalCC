// El comando `npm run estado`: cuenta en qué estado está el proyecto **mirando la base de datos**,
// no un documento escrito a mano.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// POR QUÉ EXISTE
//
// Hasta el 2026-08-24, para poder mostrar la aplicación había que abrir `PROXIMA-SESION.md` y leer
// una tabla escrita a mano: con qué cuenta entrar, qué citas hay, cuál no hay que tocar. Esa tabla
// **es una foto del momento en que alguien la escribió**, y se pone vieja sola: el mismo día en que
// se escribió ya decía «tres citas esperando» cuando quedaban dos, porque entre que se escribió y se
// leyó alguien cerró una.
//
// Este guion no repite lo que alguien anotó: **va y lo cuenta**. Por eso no puede quedar viejo.
//
// Lo usa la skill `/launch` (`.claude/skills/launch/`), que es el entregable «skill de arranque» de
// la consigna del curso. Pero también sirve solo: `npm run estado` contesta lo mismo sin levantar
// nada, y sin tocar la base — este archivo **solo lee**.
// ─────────────────────────────────────────────────────────────────────────────────────────────

import "dotenv/config"
import { createServer } from "node:net"
import { existsSync } from "node:fs"

import Database from "better-sqlite3"

import { RUTA_DE_LA_BASE } from "../servidor/base-de-datos.js"
import { escribirFechaEnPalabras, escribirHoraDelMomento, todaviaNoEmpezo } from "../servidor/tiempo.js"
import { PERSONAL_PRECARGADO } from "./datos-de-prueba.js"

const PUERTO = Number(process.env.PORT) || 3000

/**
 * ¿Está libre el puerto?
 *
 * Se comprueba **intentando ocuparlo un instante y soltándolo**, en vez de preguntarle al sistema
 * operativo con un comando: así funciona igual en Windows, en Mac y en Linux, que es una restricción
 * dura de este proyecto —tiene que levantar en una máquina que no es la de la estudiante—.
 *
 * Esto no es un detalle de comodidad. En la bitácora del 2026-08-17 hay una sesión perdida por
 * exactamente esto: había un proceso viejo ocupando el 3000, el agente **afirmó en falso** que el
 * entorno lo había matado, y el error real —`EADDRINUSE`— solo apareció un paso después. Preguntarlo
 * antes de arrancar convierte ese muro de texto en una frase.
 */
function puertoLibre(puerto) {
  return new Promise((responder) => {
    const prueba = createServer()
    prueba.once("error", () => responder(false))
    prueba.once("listening", () => prueba.close(() => responder(true)))
    prueba.listen(puerto)
  })
}

/** Una línea de revisión: verde si está bien, amarilla si conviene saberlo. */
function revision(bien, texto) {
  console.log(`  ${bien ? "✓" : "⚠"}  ${texto}`)
}

/** «viernes 27 de agosto, 9:00am» — la misma forma en que lo escribe la aplicación. */
function cuando(inicio) {
  return `${escribirFechaEnPalabras(inicio.slice(0, 10))}, ${escribirHoraDelMomento(inicio)}`
}

// ══════════════════════════════════════════════════════ 1. ¿Se puede arrancar?

console.log("")
console.log("REVISIÓN")

const libre = await puertoLibre(PUERTO)
revision(
  libre,
  libre
    ? `El puerto ${PUERTO} está libre`
    : `El puerto ${PUERTO} YA ESTÁ OCUPADO. O la aplicación ya está levantada —probá ` +
      `http://localhost:${PUERTO}— o quedó un proceso viejo: apagalo antes de arrancar`,
)

const hayEnv = existsSync(new URL("../.env", import.meta.url))
revision(
  hayEnv,
  hayEnv
    ? "El archivo .env está"
    : "No hay archivo .env. La aplicación levanta igual, pero las sesiones se cierran en cada " +
      "reinicio. Copiá .env.ejemplo como .env",
)

const hayClaveDeCorreo = Boolean(process.env.RESEND_API_KEY)
revision(
  hayClaveDeCorreo,
  hayClaveDeCorreo
    ? "La clave del correo está puesta: los correos se van a enviar de verdad"
    : "No hay RESEND_API_KEY. Las citas se crean igual (RF-19), pero NINGÚN correo va a salir — " +
      "todos quedan registrados como fallidos",
)

const hayBase = existsSync(RUTA_DE_LA_BASE)
revision(hayBase, hayBase ? "La base de datos existe" : "NO hay base de datos todavía: corré `npm run datos`")

if (!hayBase) {
  console.log("")
  console.log("Sin base no hay nada más que contar. Corré `npm run datos` y volvé a intentar.")
  process.exit(0)
}

// ══════════════════════════════════════════════════════ 2. Quién puede entrar

// `readonly` no es decoración: este guion **no puede** tocar nada, y así queda garantizado por la
// base misma en vez de por la buena intención de quien lo escribió. Además deja abrirla mientras la
// aplicación está levantada, sin pelearse con ella.
const base = new Database(RUTA_DE_LA_BASE, { readonly: true })

const ahora = new Date()

console.log("")
console.log("CUENTAS")

// **La contraseña de Personal se lee del guion de datos, no de la base.** En la base solo está su
// huella cifrada, que no se puede volver a leer — es a propósito, y es lo correcto. La fuente de
// verdad de esa cuenta es `datos-de-prueba.js`, así que si algún día cambia ahí, esto lo dice solo.
// Es un dato de prueba inventado, y ya está en texto plano en ese archivo y en el README.
const personal = base.prepare("SELECT nombre, correo FROM personal").all()
for (const cuenta of personal) {
  const clave =
    cuenta.correo === PERSONAL_PRECARGADO.correo ? ` / ${PERSONAL_PRECARGADO.contrasena}` : ""
  console.log(`  Personal · ${cuenta.nombre.padEnd(16)} ${cuenta.correo}${clave}`)
}

const clientes = base
  .prepare("SELECT nombre, correo, debe_cambiar_contrasena FROM cliente ORDER BY id")
  .all()

if (clientes.length === 0) {
  console.log("  (todavía no hay ninguna cuenta de cliente: se crean desde la aplicación)")
}

for (const cliente of clientes) {
  // **Las contraseñas de los clientes no se pueden mostrar y no es un olvido:** esas cuentas se
  // crearon desde la pantalla y en la base solo quedó su huella cifrada. Lo que sí se puede decir es
  // cuáles tienen la temporal pendiente, que es lo que hace falta saber para probar RF-4.
  const pendiente = cliente.debe_cambiar_contrasena ? "  ⚠ contraseña temporal sin cambiar" : ""
  console.log(`  Cliente  · ${cliente.nombre.padEnd(16)} ${cliente.correo}${pendiente}`)
}

console.log("")
console.log("  Las contraseñas de los clientes no se pueden mostrar: en la base solo queda su huella")
console.log("  cifrada. Están anotadas en el README y en PROXIMA-SESION.md.")

// ══════════════════════════════════════════════════════ 3. Qué hay para mostrar

const citas = base
  .prepare(
    `SELECT cita.id, cita.inicio, cita.estado, cliente.nombre AS cliente,
            servicio.nombre AS servicio
       FROM cita
       JOIN cliente   ON cliente.id   = cita.cliente_id
       JOIN servicio  ON servicio.id  = cita.servicio_id
      ORDER BY cita.inicio`,
  )
  .all()

// **La misma cuenta que usa la regla de negocio**, importada de `tiempo.js`, no rehecha acá: si este
// guion decidiera por su cuenta qué cita «ya pasó», podría contradecir a la aplicación que está
// describiendo — que es exactamente el problema que vino a resolver.
const yaPaso = (cita) => !todaviaNoEmpezo(cita.inicio, ahora)

const porCerrar = citas.filter((cita) => cita.estado === "activa" && yaPaso(cita))
const futuras = citas.filter((cita) => cita.estado === "activa" && !yaPaso(cita))
const cerradas = citas.filter((cita) => cita.estado === "completada" || cita.estado === "no_asistio")
const canceladas = citas.filter((cita) => cita.estado === "cancelada")

console.log("")
console.log(`CITAS (${citas.length})`)
console.log(`  ${String(porCerrar.length).padStart(2)}  esperando en «Citas por cerrar»`)
console.log(`  ${String(futuras.length).padStart(2)}  próximas`)
console.log(`  ${String(cerradas.length).padStart(2)}  cerradas (completada o no asistió)`)
console.log(`  ${String(canceladas.length).padStart(2)}  canceladas`)

console.log("")
console.log("PARA MOSTRAR")

if (porCerrar.length === 0) {
  console.log("  · No hay ninguna cita esperando en «Citas por cerrar»: esa pantalla se ve vacía.")
  console.log("    La aplicación no deja crear una cita pasada (RN-4), así que para mostrar la pieza 8")
  console.log("    hay que insertarla a mano en la base, como hacen las pruebas.")
} else {
  console.log(`  · «Citas por cerrar» tiene ${porCerrar.length} para marcar:`)
  for (const cita of porCerrar) {
    console.log(`      ${cuando(cita.inicio)} · ${cita.cliente} - ${cita.servicio}`)
  }
}

// **El aviso se razona, no se copia.** Si hay una sola cita futura es la única forma de mostrar que
// «Reagendar» y «Cancelar» siguen apareciendo donde corresponde, así que cancelarla deja el proyecto
// sin ese caso. Si hay varias, no hace falta decir nada: ese es justamente el tipo de advertencia que
// un documento escrito a mano repite para siempre aunque haya dejado de ser cierta.
if (futuras.length === 1) {
  const unica = futuras[0]
  console.log(`  · ⚠ HAY UNA SOLA CITA PRÓXIMA, y es la única que muestra «Reagendar» y «Cancelar»:`)
  console.log(`      ${cuando(unica.inicio)} · ${unica.cliente} - ${unica.servicio}`)
  console.log(`      No la canceles si querés poder mostrar ese caso.`)
} else if (futuras.length === 0) {
  console.log("  · No hay ninguna cita próxima, así que ninguna muestra «Reagendar» ni «Cancelar».")
  console.log("    Reservá una desde la aplicación para poder mostrar ese caso.")
} else {
  console.log(`  · Hay ${futuras.length} citas próximas, con «Reagendar» y «Cancelar». La más cercana:`)
  console.log(`      ${cuando(futuras[0].inicio)} · ${futuras[0].cliente} - ${futuras[0].servicio}`)
}

const conTemporal = clientes.filter((cliente) => cliente.debe_cambiar_contrasena)
if (conTemporal.length > 0) {
  console.log(
    `  · ${conTemporal.length} cuenta(s) con la contraseña temporal sin cambiar: sirven para mostrar RF-4,`,
  )
  console.log("    el cambio obligatorio en el primer ingreso — si todavía tenés la temporal anotada.")
}

base.close()

console.log("")
