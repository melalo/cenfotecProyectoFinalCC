# Bitácora del despliegue — Vercel + Turso

*El registro de lo que pasó al publicar la aplicación. **La salida de la máquina va primero y el
diagnóstico después**, que es el mismo criterio de `BITACORA.md`: lo que dijo la computadora es un
hecho, lo que uno concluye de eso es una interpretación, y no conviene mezclarlas.*

El plan que se está ejecutando es `PLAN-DESPLIEGUE.md`.

---

# La primera publicación, y por qué falló a propósito

**2026-09-05 — Etapa 4, «La puerta de Vercel».**

El objetivo de esta etapa **no era** que la aplicación funcionara. Era comprobar que Vercel la
construye, la sirve, y que **falla con un mensaje que dice qué le falta** — todavía sin base de
datos. Que falle así es el resultado esperado.

## Qué se creó

| | |
|---|---|
| Proyecto de Vercel | `melalo/reservas-bienestar` |
| Dirección | **https://reservas-bienestar.vercel.app** |
| Repositorio conectado | `melalo/cenfotecProyectoFinalCC` |
| Root Directory | La raíz. **Este repositorio tiene el proyecto en la raíz**, así que la primera trampa del despliegue anterior —donde había que escribir `semana6/cancha-total` por la API— no aplica acá |
| Archivos nuevos | `api/index.js`, `servidor/aplicacion-desplegada.js`, `vercel.json` |

## El registro crudo

### El despliegue

```
"status": "ok",
"deployment": {
  "id": "dpl_Guo8Pj7aXsyffztr94GKeJ7MtMq8",
  "url": "https://reservas-bienestar-3l28lmpea-melalo.vercel.app",
  "readyState": "READY",
  "target": "production"
}
```

### Lo que contesta el sitio

```
$ curl https://reservas-bienestar.vercel.app/
codigo HTTP: 200
<!doctype html>
<html lang="es">
  <head>
    <title>Reservas en línea</title>
    <link rel="stylesheet" href="/css/estilos.css" />
...

$ curl https://reservas-bienestar.vercel.app/css/estilos.css
codigo HTTP: 200  tamano: 19675 bytes

$ curl https://reservas-bienestar.vercel.app/api/negocio
codigo HTTP: 500
{"error":"aplicacion_no_configurada","detalle":"Falta configurar TURSO_DATABASE_URL. En el
despliegue el disco es de sólo lectura, así que no hay dónde guardar las citas: la base tiene que
ser la base gestionada de Turso."}

$ curl https://reservas-bienestar.vercel.app/api/yo
{"error":"aplicacion_no_configurada","detalle":"Falta configurar TURSO_DATABASE_URL. En el
despliegue el disco es de sólo lectura, así que no hay dónde guardar las citas: la base tiene que
ser la base gestionada de Turso."}
```

### El registro de Vercel

```
$ npx vercel logs https://reservas-bienestar.vercel.app

TIME         HOST                            LEVEL
17:18:22.64  reservas-bienestar.vercel.app   error  λ GET /api/yo
La aplicación no pudo arrancar: Error: Falta configurar TURSO_DATABASE_URL. En el despliegue el
disco es de sólo lectura, así que no hay dónde guardar las citas: la base tiene que ser la base
gestionada de Turso.
    at destinoDeLaBase (file:///var/task/servidor/base-de-datos.js:64:11)
    at conectar (file:///var/task/servidor/base-de-datos.js:97:36)
    at crearAplicacionDesplegada (file:///var/task/servidor/aplicacion-desplegada.js:17:22)
    at atender (file:///var/task/api/index.js:27:26)

17:17:53.33  reservas-bienestar-3l28lmpea-melalo.vercel.app  error  λ GET /favicon.ico
La aplicación no pudo arrancar: Error: Falta configurar TURSO_DATABASE_URL. […]

17:17:53.33  reservas-bienestar-3l28lmpea-melalo.vercel.app  error  λ GET /favicon.png
La aplicación no pudo arrancar: Error: Falta configurar TURSO_DATABASE_URL. […]
```

## El diagnóstico

**La etapa salió como tenía que salir, y las tres cosas que se querían comprobar quedaron
comprobadas:**

1. **Vercel construye el proyecto.** El CSS pesa 19.675 bytes y llega con un `200`. Eso demuestra que
   la línea `buildCommand: npm run estilos` de `vercel.json` corrió: `publico/css/` está en el
   `.gitignore` —se genera con un comando, no se sube—, así que sin esa línea el sitio se habría
   publicado **sin una sola gota de CSS**. Es la clase de falla que no rompe nada y se ve horrible.
2. **La aplicación falla diciendo qué le falta**, y no en silencio. El cuerpo de la respuesta trae la
   variable que hace falta escrita con todas las letras.
3. **El registro dice dónde.** El rastro nombra las cuatro funciones en orden —`destinoDeLaBase` →
   `conectar` → `crearAplicacionDesplegada` → `atender`—, así que no hay nada que adivinar.

**Comparado con el despliegue anterior**, este mismo momento allá fue un
`SQLITE_CANTOPEN: unable to open database file` que hubo que ir a buscar en un rastro de siete
líneas. El mensaje de acá no se consiguió con suerte: está escrito a mano en `base-de-datos.js` y
en `aplicacion-desplegada.js`, precisamente porque el anterior costó una sesión.

---

## Tres cosas que el plan no había previsto

### 1. La página de inicio **no** da 500 — y está bien

El plan decía: «se abre la dirección → **500**». En realidad la dirección contesta **200 con el HTML
completo**. No es un error: es lo que hace la línea `outputDirectory: publico` de `vercel.json`.
Vercel sirve los archivos de esa carpeta **directamente**, sin despertar la función, así que el HTML,
el CSS, las fuentes y las imágenes llegan sin que ningún código nuestro corra.

**El 500 aparece cuando la pantalla pide datos**, que es cuando la función sí se despierta. Es decir:
el sitio se ve, y lo que no funciona es todo lo que necesite la base. **Eso es una mejor falla que la
que el plan esperaba**, no una peor: se distingue de un vistazo qué parte está lista y cuál no.

Vale anotarlo porque la comprobación escrita en el plan, tal como estaba, habría dado por fallada una
etapa que salió bien.

### 2. `vercel link` escribió en el `.gitignore` por su cuenta, y lo que escribió era peligroso

Al vincular el proyecto, el comando agregó dos líneas sin avisar: un `.vercel` repetido y **`.env*`**.

Ese `.env*` habría dejado afuera del repositorio a **`.env.ejemplo`**, que se sube a propósito: es el
archivo que le dice a quien clona el proyecto qué variables hacen falta. Sin él, la promesa del
`README.md` —«levanta en una máquina que no es la de la estudiante, siguiendo solo el README»— deja
de cumplirse.

**No rompía nada de inmediato**, y ese es el problema: Git no deja de seguir un archivo que ya venía
siguiendo, así que `git status` no habría dicho nada. Es la clase de trampa que se descubre el día
que alguien clona limpio.

Se corrigió a **`.env*.local`**, que es lo que Vercel realmente necesita —el archivo de claves que
`vercel link` baja solo—, con la razón escrita al lado en el propio `.gitignore` para que nadie lo
«arregle» de vuelta.

### 3. El favicon despierta la función

En el registro aparecen `GET /favicon.ico` y `GET /favicon.png` llegando a la función y devolviendo
500. Son pedidos que hace el navegador solo, sin que nadie los escriba: como esos dos archivos no
existen en `publico/`, el `rewrites` los manda a la función.

Hoy no molesta —solo ensucia el registro—, pero **con Turso conectado cada uno costaría una visita a
la base** por cada persona que abra el sitio. Se resuelve poniendo un favicon de verdad en
`publico/`. **Anotado, no arreglado**: el plan dice que las cosas de velocidad se atacan después de
la Etapa 5, con la pantalla real medida, y no adivinando.

---

## La puerta de calidad de la etapa

```
$ npm test
ℹ tests 323
ℹ pass 323
ℹ fail 0
```

**323 de 323, y ninguna prueba se tocó.** Era justamente el punto: nada de esta etapa toca el camino
que corren las pruebas.

> ⚠️ **Un aviso sobre `npm test`, anotado el 2026-09-05.** El archivo
> `pruebas/contrasenas-y-correos.test.js` se puso rojo **una vez de tres corridas**, y corriéndolo
> solo pasa sus 26 pruebas sin problema. No es un defecto del código: es que varios archivos de
> prueba corren a la vez y se pisan. No bloquea nada, pero conviene saberlo antes de asustarse.

## La comprobación que esta etapa **no** puede hacer

Ninguna. Y conviene decirlo en voz alta: **que el sitio esté publicado no quiere decir que la
aplicación sirva**. Hoy no se puede entrar, ni reservar, ni ver un calendario, porque no hay dónde
guardar nada. Eso llega con la **Etapa 5**, que conecta Turso.

---

---

# La aplicación funcionando de verdad

**2026-09-05 — Etapa 5, «Turso en producción».** El mismo día que la Etapa 4.

**https://reservas-bienestar.vercel.app** — y ahora sí es la aplicación, con sus datos.

## Qué se creó

| | |
|---|---|
| Base de datos | **Turso**, `database-cinereous-candle`, plan Starter ($0/mes) |
| Cómo se conectó | `npx vercel integration add tursocloud/database --plan starter -m region=iad1` |
| Qué inyectó sola | `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`, **con esos nombres exactos**, en los tres ambientes. Por eso `base-de-datos.js` no hubo que tocarlo |
| Comandos nuevos | `npm run esquema` (crea las 12 tablas donde se le diga) y `npm run sembrar` (carga el catálogo, el horario, los feriados y la cuenta de Personal) |

## Las variables de entorno

Son **seis**, y **ninguna vive en el repositorio**. Los valores no se escriben acá a propósito:

| Variable | Quién la puso | Para qué |
|---|---|---|
| `TURSO_DATABASE_URL` | La integración, sola | Dónde está la base |
| `TURSO_AUTH_TOKEN` | La integración, sola | Su contraseña |
| `SESION_SECRETO` | A mano, **generada nueva para producción** | Firma las sesiones. Distinta de la de la computadora, a propósito |
| `RESEND_API_KEY` | A mano, la misma del `.env` | Manda los correos |
| `CORREO_REMITENTE` | A mano, la misma del `.env` | Desde qué dirección salen |
| `DIRECCION_PUBLICA` | A mano | Con qué dirección se escriben los enlaces que salen por correo |

> **Un solo despliegue, no dos.** El plan pedía publicar, averiguar la dirección y volver a publicar
> con `DIRECCION_PUBLICA` puesta. **No hizo falta**: la dirección de producción de un proyecto de
> Vercel es estable y ya se conocía de la Etapa 4, así que la variable se puso *antes* del
> despliegue. Se ahorró una publicación entera.

## Las comprobaciones contra el sitio en vivo

Ninguna de éstas se puede hacer con `npm test`: sólo existen publicadas.

| # | Comprobación | Resultado |
|---|---|---|
| 1 | Abrir la dirección | ✅ **200**, con el CSS puesto (19.675 bytes) |
| 2 | Registrar una cuenta nueva | ✅ **201**, y la fila quedó en Turso |
| 3 | El catálogo | ✅ 2 categorías, sus servicios, 2 proveedores |
| 3.1 | El calendario de un mes | ✅ 31 días: **27 con 8 horarios cada uno y 4 cerrados**, que son exactamente los 4 domingos de octubre de 2026 |
| 4 | Reservar | ✅ **201**, cita creada para `2026-10-01T09:00:00-06:00` |
| 5 | **CA-1: otra persona pide el mismo horario** | ✅ **409 `horario_no_disponible`** |
| 6 | Cancelar | ✅ **204**, y el horario **volvió a aparecer libre** |
| 7 | Entrar como Personal | ✅ **200**, Marta Jiménez |
| 8 | El correo de «olvidé mi contraseña» | ⏳ **Pendiente**: hay que mirar una bandeja de entrada de verdad |
| 9 | La sesión sigue valiendo entre pedidos | ✅ **200** (es `SESION_SECRETO` compartido funcionando) |
| 10 | El registro de Vercel | ✅ Ningún error inesperado — ver abajo |
| 11 | Cuánto tarda el calendario de un mes | ✅ **139 ms** |

**La 5 es la importante.** CA-1 —«dos personas no pueden reservar el mismo horario»— es el criterio
de aceptación que **casi se rompe en silencio** al cambiar el motor: `@libsql/client` mueve el nombre
fino del error de `falla.code` a `falla.cause.code`, y en la computadora ese camino casi nunca se
recorre. Acá está comprobado **contra la base de verdad, con dos sesiones distintas**, que es la
única forma de comprobarlo de verdad.

**Y la 11 cierra la trampa 3 del despliegue anterior.** Allá una función de Vercel se cortaba con
~28 consultas dentro de una misma visita, y la portada daba 500. Acá el calendario de un mes entero
—27 días con 8 horarios cada uno— tarda **139 ms**. No hay nada que optimizar.

### Lo que dijo el registro

Dos líneas, y **ninguna es un error de la aplicación**:

```
warn  λ POST /api/citas
Aviso: falló el envío de un correo a prueba-despliegue-…@ejemplo.com — El servicio de correo
contestó 403: "You can only send testing emails to your own email address (melalo9@gmail.com)…"

error λ GET /api/disponibilidad
(node:4) [DEP0169] DeprecationWarning: `url.parse()` behavior is not standardized…
```

- **El 403 de Resend es RF-19 funcionando**, y además es una buena noticia disfrazada de aviso: el
  servicio **contestó**, o sea que la clave es válida y el correo está conectado en producción. Con
  la dirección prestada de Resend sólo llegan los correos a la casilla con la que se registró la
  cuenta; a los `@ejemplo.com` fallan a propósito y quedan registrados como fallidos. **La cita se
  creó igual**, que es exactamente lo que RF-19 exige.
- **El `DeprecationWarning` viene de una dependencia**, no de este código. Vercel lo marca como
  `error` sólo porque salió por el canal de errores.

## La limpieza (paso 8)

Las comprobaciones dejaron rastro en la base de producción y se borró, en el orden que exigen las
llaves foráneas (`correo_enviado` → `cita` → `cliente`):

```
Cuentas de prueba encontradas: 2
   #1 Prueba Del Despliegue — prueba-despliegue-…@ejemplo.com
   #2 Segunda Persona — prueba-ca1-…@ejemplo.com
Citas de esas cuentas: 1 (#1)

Después de borrar:
   cuentas de prueba que quedan: 0
   clientes en total:            0
   citas en total:               0
   servicios (el catálogo):      4
```

**La base quedó como tiene que estar para estrenar:** el catálogo, el horario, los feriados y la
cuenta de Personal cargados; ninguna cuenta de cliente y ninguna cita.

> ⚠️ Ese guion de limpieza es la **única** excepción a RN-15 («nada se borra nunca»), igual que
> `npm run datos`, y es de un solo uso: se corrió antes de que existiera la primera cita de verdad.

## La puerta de calidad

```
$ npm test
ℹ tests 323
ℹ pass 323
ℹ fail 0
```

**Y sin ninguna variable de Turso configurada en esta computadora**, que era el punto: que las
pruebas sigan corriendo contra el archivo local, sin internet y sin credenciales, es lo que mantiene
verde la integración continua de GitHub.

---

## Lo que sigue

- [ ] **Comprobación 8**, la única que quedó pendiente: pedir «olvidé mi contraseña» desde el sitio
      publicado con la casilla real, y comprobar que **el enlace abre en el teléfono** — que es lo
      que `localhost` nunca pudo, y la razón por la que la pieza 9 dejó `DIRECCION_PUBLICA` puesta.
- [ ] **La pieza 6**, el recordatorio de 24 horas, que es lo que este despliegue vino a destrabar.
      Ahora la tarea programada de GitHub Actions sí alcanza la aplicación.
- [ ] Un favicon en `publico/`, para que el navegador deje de despertar la función por gusto.
