# Reservas en línea para negocios de bienestar y salud

Aplicación donde un cliente reserva, cancela y reagenda citas en un negocio de bienestar y salud
—un lugar de masajes, una clínica estética— sin tener que coordinar por WhatsApp ni esperar a que
alguien conteste. La asistente del negocio usa la misma aplicación para las citas que le entran por
teléfono, así hay un solo calendario.

Es el proyecto final del curso **SINT-732 · Laboratorio Ejecutivo en Claude Code** (Universidad
CENFOTEC).

---

> ## ESTADO ACTUAL: la pieza 1 está cerrada (2026-08-17)
>
> Los comandos de este README **ya funcionan**: el proyecto arranca, se puede crear una cuenta,
> entrar, cerrar sesión, y los datos sobreviven al reinicio.
>
> De las 9 piezas de `PLAN.md` está cerrada **la 1** (entrar a la aplicación): sus 14 pruebas
> automáticas pasan, sus 8 comprobaciones se corrieron con el resultado anotado en su bloque
> `Evidencia`, y la revisión visual en el navegador la hizo la estudiante.
>
> Las otras 8 están pendientes, así que todavía **no** se puede elegir un servicio, ni ver el
> calendario, ni reservar, ni llega ningún correo. **Si venís a construir, te toca la pieza 2.**

---

## Si sos un agente y acabás de llegar a este repositorio

Leé esto antes de tocar nada.

### 1. El orden de lectura, y por qué

| Orden | Archivo | Para qué |
|---|---|---|
| 1.º | `ESPECIFICACION.md` | **Qué tiene que hacer el sistema.** Reglas de negocio (RN), requisitos funcionales (RF), recorridos y preguntas abiertas. Es la autoridad sobre el comportamiento. |
| 2.º | `DISENO.md` | **Qué forma tiene la solución.** Componentes, modelo de datos, manejo de errores y las decisiones de tecnología con su razón. Es la autoridad sobre la arquitectura. |
| 3.º | `PLAN.md` | **Qué se construye y en qué orden.** Nueve vertical slices, cada una con lo que tiene que ser cierto, con qué se comprueba, y qué consume y produce. Es tu hoja de ruta. |
| 4.º | `VISUALS.md` | **Cómo se ve.** El sistema visual «Clinical Excellence»: colores, tipografía, tamaños, redondeos y espaciado. Es la autoridad sobre la apariencia, igual que `ESPECIFICACION.md` lo es sobre el comportamiento. Si un valor no está ahí, **no se inventa en el `.scss`**. |
| 5.º | `CLAUDE.md` | Stack, comandos, convenciones y restricciones del proyecto. Las convenciones no son sugerencias: fijan la estructura de carpetas, cómo se nombra cada cosa y las reglas de lo visual. |
| Si hace falta | `PROYECTO.md`, `NEGOCIO.md`, `BITACORA.md` | El enunciado original, el caso de negocio y el registro fechado de decisiones. |

**No necesitás leer las nueve piezas del plan.** Leé la que te toca construir: cada una declara qué
consume de las anteriores y qué produce para las siguientes, con los nombres exactos de tablas y de
endpoints del API. Ese bloque existe justamente para que no tengas que leer las demás. **Leé también
la `Evidencia` de las piezas ya cerradas:** ahí está qué se comprobó y qué se agregó sobre la marcha.

### 2. Tres trampas de este repositorio

Estas te van a hacer construir lo incorrecto si no las sabés:

1. **`PROYECTO.md` y `FICHA-APROBACION.md` dicen "48 horas" y están desactualizados a propósito.**
   El recordatorio es de **24 horas** (RN-20 de `ESPECIFICACION.md`). Los dos archivos conservan el
   número viejo porque son documentos históricos: el enunciado original, que el curso prohíbe
   modificar, y la ficha que el docente aprobó el 3 de agosto. **Construí siempre contra
   `ESPECIFICACION.md`.** La explicación completa está en la entrada del 2026-08-17 de
   `BITACORA.md`.
2. **`DISENO1.md` y `SEGUIMIENTO.md` no están en el repositorio** — están excluidos por
   `.gitignore`. Si los ves mencionados en algún documento y no los encontrás, no falta nada:
   `DISENO1.md` es la versión larga de `DISENO.md` y vive solo en la máquina de la estudiante.
   **`DISENO.md` es la versión válida y completa para trabajar.**
3. **Los documentos mandan sobre el código.** Si al construir descubrís que la especificación o el
   diseño están mal o incompletos, **se corrige primero ese documento, y después se escribe el
   código**. Nunca al revés, y nunca solo en el código.

### 3. Las reglas de trabajo que este proyecto impone

- **Una pieza por conversación.** Al cerrarla, cerrá la conversación.
- **La comprobación se escribe antes de construir.** Ya está escrita en `PLAN.md` para las nueve
  piezas: no la reescribas para que le quede cómoda a lo que construiste.
- **Una pieza no está cerrada hasta que su comprobación se corrió** y el resultado quedó anotado,
  con fecha, en el bloque `Evidencia` de esa pieza en `PLAN.md`.
- **No se usan datos reales de personas ni de negocios.** Todos los datos de prueba son inventados.
- **No hagas commit ni push por tu cuenta**, salvo que la estudiante lo pida.
- El vocabulario del proyecto está en el glosario de `ESPECIFICACION.md`. Usalo: se dice
  **horario** (no "slot") y **reagendar** (no "reprogramar").
- **Los estilos son mobile-first**, y eso es verificable: todos los `@media` son `min-width` y
  ninguno es `max-width`. Los cortes son 48rem y 64rem.
- **Todo campo de contraseña lleva el «ojito»** para mostrarla y ocultarla, en cualquier pantalla.
  No lo agregues campo por campo: ya hay una función que se lo pone a todos los
  `input[type="password"]` de la página, así que una pantalla nueva lo hereda sola.
- **Nada de dependencias que haya que compilar o configurar.** El cifrado de contraseñas, el
  corredor de pruebas y la tipografía usan lo que Node ya trae o archivos que viven dentro del
  proyecto, justamente para que esto se levante clonado en cualquier máquina.

---

## Stack

Todo esto está decidido en `DISENO.md`, con las alternativas que se consideraron y por qué se
descartaron. **No lo cambies sin actualizar ese documento con la razón.**

| Capa | Elección | Repositorio oficial |
|---|---|---|
| Backend | Node.js con **Express** | https://github.com/expressjs/express |
| Base de datos | **SQLite**, accedida con **better-sqlite3** | https://github.com/WiseLibs/better-sqlite3 |
| Frontend | HTML + CSS con **Sass** | https://github.com/sass/dart-sass |
| Correo | **Resend** | https://github.com/resend/resend-node |
| Disparador del recordatorio | Tarea programada en **GitHub Actions** | https://github.com/features/actions |

La lista definitiva de dependencias, con su versión, va a estar en `package.json` cuando la pieza 1
lo cree.

**React se evaluó y se descartó** durante la planificación: el frontend y el backend están
separados por contrato, así que la interfaz se puede reescribir después sin tocar la lógica de
negocio, y a este tamaño el costo de aprender y configurar React no se justifica.

## Qué necesitás en la máquina

- **Node.js 20 o superior** y **npm** (viene con Node). Comprobalo con `node --version`.
- **Git.**
- Nada más. SQLite no se instala aparte: `better-sqlite3` lo trae adentro, y la base es un archivo
  dentro del proyecto.

## Cómo se levanta

```bash
git clone https://github.com/melalo/laboratorioClaudeCenfotec.git
cd laboratorioClaudeCenfotec/proyectoFinal

npm install     # instala las dependencias
npm run datos   # crea la base SQLite y carga los datos de prueba
npm start       # levanta la aplicación
```

Con eso, la aplicación tiene que quedar disponible en:

**http://localhost:3000**

*(El puerto 3000 se fija acá como decisión del proyecto, para que no dependa de la máquina. Si está
ocupado, se puede cambiar con la variable de entorno `PORT`.)*

### La prueba de que esto está bien hecho

El compromiso del curso es que **el prototipo se levante siguiendo únicamente este README, en una
máquina que no es la de la estudiante**. La comprobación de referencia es literal: clonar el
repositorio en una carpeta limpia, correr los tres comandos de arriba y que funcione.

Eso significa que **no puede quedar ninguna ruta de la máquina de la estudiante, ninguna clave, ni
ninguna configuración local metida en el código**. Todo lo que haga falta o está versionado, o está
documentado como variable de entorno acá abajo.

## Variables de entorno

Se leen de un archivo `.env` en la raíz de `proyectoFinal/`. **Ese archivo nunca se sube al
repositorio.** El proyecto debe incluir un `.env.ejemplo` versionado, con las claves vacías, para
que se sepa cuáles hacen falta.

| Variable | Desde qué pieza hace falta | Para qué |
|---|---|---|
| `PORT` | 1 | Puerto donde escucha la aplicación. Si no está, vale 3000. |
| `SESION_SECRETO` | 1 | Firma las sesiones de login. Cualquier texto largo e inventado. |
| `RESEND_API_KEY` | 4 | Clave del servicio de correo. Se saca de una cuenta gratuita de Resend. |
| `CORREO_REMITENTE` | 4 | Dirección desde la que salen los correos. |
| `RECORDATORIOS_SECRETO` | 6 | Clave que protege el disparador del recordatorio, para que nadie de afuera lo pueda ejecutar. |

**Sin `RESEND_API_KEY` la aplicación tiene que levantar igual.** Los correos van a fallar y quedar
registrados como fallidos, pero las citas se siguen creando: así lo exige RF-19 de
`ESPECIFICACION.md`.

## Datos de prueba

`npm run datos` crea la base desde cero y carga datos **inventados**. Se puede correr las veces que
haga falta: borra lo anterior y vuelve a empezar.

**Hoy, con la pieza 1 construida, carga solo la cuenta de Personal**, porque las demás tablas
todavía no existen: las crea la pieza 2. El comando lo dice en pantalla cuando termina.

Lo que va a cargar cuando el plan esté completo:

- **Servicios:** «Masaje relajante» y «Limpieza facial».
- **Proveedores:** «Ana» y «Carlos». Ana atiende los dos servicios; Carlos solo el masaje.
- **Horario del negocio:** lunes a viernes de 9:00 a 18:00 con el almuerzo bloqueado de 12:00 a
  13:00, y sábados de 9:00 a 13:00. Domingo cerrado. Cada cita dura una hora.
- **Feriados de ley de Costa Rica**, precargados como dato fijo.
- **Una cuenta de Personal** (la asistente, «Marta Jiménez»), precargada — no hay pantalla para
  registrarla. Entra con **`personal@ejemplo.com`** y la contraseña **`Personal123`**. Es una cuenta de prueba
  inventada, y como está escrita acá a la vista de todos, **no sirve para nada real**: si el
  proyecto algún día se usara de verdad, lo primero es cambiarla.

## Pruebas

```bash
npm test
```

**Hoy corre 14 pruebas, las de la pieza 1:** registrarse, entrar, el mensaje idéntico cuando el
correo no existe y cuando la contraseña está mal, la contraseña cifrada, el correo repetido, la
cuenta de Personal precargada y la persistencia tras reiniciar. Están en `pruebas/`.

A medida que avance el plan, este mismo comando irá cubriendo además los tres criterios de
aceptación de `ESPECIFICACION.md`, que son las tres reglas que el curso exige proteger:

| | Qué comprueba | Desde qué pieza |
|---|---|---|
| **CA-1** | Dos intentos de reservar el mismo horario del mismo proveedor: exactamente uno lo consigue. | 3 |
| **CA-2** | Un intento de reservar un horario de hoy se rechaza, a cualquier hora que se intente. | 3 |
| **CA-3** | Cancelar o reagendar faltando menos de 4 horas: el cliente es rechazado, Personal es aceptado. | 5 y 7 |

Que estas pruebas corran solas en cada `push` mediante GitHub Actions se monta en la **pieza 3**
(así lo dice su bloque *Produce* en `PLAN.md`). Hoy todavía no corren solas: hay que escribir
`npm test` a mano.

## Qué no está en el repositorio

- **`.env`** — las claves. Cada quien crea el suyo a partir de `.env.ejemplo`.
- **La base de datos** — se genera con `npm run datos`.
- **`node_modules/`** — se genera con `npm install`.
- **`DISENO1.md` y `SEGUIMIENTO.md`** — documentos locales de la estudiante, excluidos por
  `.gitignore`. No los necesitás.
- **`.claude/`** — la skill con la que se generó el enunciado del proyecto.

## Estructura del proyecto

Los documentos:

```
proyectoFinal/
├── README.md              ← estás acá
├── ESPECIFICACION.md      ← qué tiene que hacer el sistema  (la autoridad)
├── DISENO.md              ← qué forma tiene la solución     (la autoridad)
├── PLAN.md                ← las 9 piezas, sus comprobaciones y su evidencia
├── CLAUDE.md              ← stack, comandos, convenciones y restricciones
├── VISUALS.md             ← el sistema visual: colores, tipografía, medidas (la autoridad)
├── PROXIMA-SESION.md      ← cómo retomar: qué pieza toca y qué hay que saber antes de empezar
├── PROYECTO.md            ← el enunciado original (no se modifica; dice "48 horas", ver arriba)
├── FICHA-APROBACION.md    ← lo aprobado por el docente (histórico; dice "48 horas", ver arriba)
├── NEGOCIO.md             ← oportunidad, riesgos, ROI y hoja de ruta
└── BITACORA.md            ← registro fechado de decisiones y correcciones de rumbo
```

Y el código, que nació con la pieza 1. Las convenciones de esta estructura están explicadas en
`CLAUDE.md`:

```
proyectoFinal/
├── servidor/              el backend: acá viven las reglas de negocio
│   ├── index.js             arranca el servidor (es lo que corre npm start)
│   ├── aplicacion.js        arma la aplicación de Express, sin ponerla a escuchar
│   ├── base-de-datos.js     abre el archivo SQLite y crea las tablas
│   ├── contrasenas.js       cifrar una contraseña y comprobar si coincide
│   ├── sesion.js            la cookie firmada que sostiene la sesión
│   └── rutas/               un archivo por grupo de endpoints del API
├── guiones/               comandos de mantenimiento (hoy: cargar los datos de prueba)
├── estilos/               los .scss que se escriben a mano, siguiendo VISUALS.md
├── publico/               lo que el navegador recibe: HTML, su JavaScript, el CSS generado
│   └── fuentes/             la tipografía Manrope, dentro del proyecto (no se pide a internet)
├── pruebas/               las pruebas automáticas de npm test
├── datos/                 el archivo SQLite — se genera, no se sube
├── package.json           las dependencias y los cuatro comandos
└── .env.ejemplo           qué variables de entorno hacen falta
```
