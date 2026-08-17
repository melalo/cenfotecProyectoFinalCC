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
  return base
}

function crearTablas(base) {
  // Los nombres de las tablas y de las columnas no se eligen acá: los fija el bloque «Produce» de
  // la pieza 1 en `PLAN.md`, y se copian de ahí tal cual.
  base.exec(`
    CREATE TABLE IF NOT EXISTS cliente (
      id                      INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre                  TEXT    NOT NULL,
      correo                  TEXT    NOT NULL UNIQUE,
      contrasena_cifrada      TEXT    NOT NULL,
      debe_cambiar_contrasena INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS personal (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre             TEXT    NOT NULL,
      correo             TEXT    NOT NULL UNIQUE,
      contrasena_cifrada TEXT    NOT NULL
    );
  `)
}
