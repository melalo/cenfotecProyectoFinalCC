# Próxima sesión — arrancar la pieza 2

*Escrito el 2026-08-17, al cerrar la pieza 1. Esta es la hoja para retomar sin releer nada.*

---

## Lo primero: qué decir cuando abrás la conversación

El proyecto pide **una pieza por conversación**, así que la pieza 2 arranca en una sesión **nueva y
limpia**. Cuando la abras, decí esto:

> La carpeta del día es `proyectoFinal`. Vamos a construir la pieza 2 del plan.

Con eso alcanza. El agente tiene que leer por su cuenta `ESPECIFICACION.md`, `DISENO.md`, la pieza 2
de `PLAN.md`, `VISUALS.md` y el `CLAUDE.md` de la carpeta. **No le expliques el proyecto**: si no lo
entiende leyendo, es que falta algo escrito, y eso es justamente lo que hay que descubrir.

## Dónde quedó todo

| | |
|---|---|
| **Pieza 1** | **Cerrada** el 2026-08-17. Evidencia fechada en `PLAN.md`. |
| **Pieza 2** | La que toca: «Elegir servicio y proveedor, y ver el calendario». |
| **Subido a GitHub** | Sí, todo, en la rama `main`. |
| **Tiempo** | 6 horas por semana. Quedan 8 piezas y unas 24 horas: ~3 horas por pieza. |

## Cómo levantar lo que ya existe

```bash
cd c:\Users\melal\Desktop\cursoCenfotecClaude\proyectoFinal

npm install     # solo la primera vez en una máquina nueva
npm run datos   # crea la base y carga los datos de prueba
npm start       # levanta la aplicación
```

**http://localhost:3000**

Vas a ver la barra azul marino arriba, las tarjetas **Entrar** y **Crear mi cuenta**, y el pie de
página abajo. Para entrar sin registrarte: **`personal@ejemplo.com` / `Personal123`**. Para
apagarla: `Ctrl + C`.

Las pruebas: `npm test` → hoy son 14 y todas pasan.

## Qué trae la pieza 2 (resumen — el detalle está en `PLAN.md`)

El cliente ve los servicios, elige uno, ve sus proveedores, elige uno, y ve un **calendario mensual**
navegable que distingue los horarios libres de los ocupados. **Todavía no se reserva nada:** el
calendario solo muestra.

Acá vive el cálculo de disponibilidad, que es **la parte más delicada de todo el proyecto**. Un
horario está libre solo si cae dentro del horario del negocio, no cae en el almuerzo, no es feriado,
es de mañana en adelante, y el proveedor no tiene otra cita ahí. `PROYECTO.md` §7.6 pide
explícitamente vigilar que la lógica de calendario no *parezca* correcta y falle en los casos borde:
feriados, almuerzo, cambio de mes.

Sus 12 comprobaciones ya están escritas en `PLAN.md`. **No se reescriben** para que le queden cómodas
a lo que se construya.

## Lo que la pieza 2 va a tener que resolver, y conviene tener en la cabeza

1. **Los feriados de Costa Rica** se precargan como dato fijo (`PROYECTO.md` §6). Hoy no existen en
   ninguna parte: la pieza 2 crea esa tabla y los carga. Habrá que decidir **qué feriados** son y
   dejarlo escrito.
2. **`npm run datos` va a crecer.** Hoy carga solo la cuenta de Personal. La pieza 2 le agrega los
   dos servicios, los dos proveedores, el horario del negocio y los feriados. El `README.md` ya
   describe cómo va a quedar.
3. **El menú del pie de página y el botón «hamburguesa»** quedaron pendientes de la pieza 1, a la
   espera de que existan secciones que enlazar. La pieza 2 trae las primeras. Están anotados en
   `DISENO.md`, «Pendientes del sistema visual».
4. **El pie dice «© 2026 Belleza y Bienestar», que es texto de relleno inventado.** El nombre real
   llega con la configuración del negocio, que es justamente lo que crea la pieza 2.
5. **Falta decidir si se muestra un teléfono del negocio.** El sistema le dice al cliente «llame al
   negocio» en dos situaciones (RN-4 y RN-5) y hoy no le dice a qué número. `ESPECIFICACION.md`
   nunca menciona un teléfono, solo la «ubicación». Está anotado como pendiente abierto.

## Las convenciones que la pieza 2 tiene que respetar

Están completas en el `CLAUDE.md` de la carpeta. Las cuatro que más se olvidan:

- **`VISUALS.md` manda sobre la apariencia.** Si un color o una medida no está ahí, no se inventa.
- **Mobile-first**, y es verificable: todos los `@media` son `min-width`, ninguno `max-width`.
- **Todo campo de contraseña lleva el «ojito».** Ya hay una función que se lo pone a todos solo.
- **Nada de dependencias que haya que compilar o configurar**, para que el proyecto se levante
  clonado en cualquier máquina.

## Lo que sigue pendiente del curso (no del sistema)

- **La skill propia de arranque** que pide la rúbrica. No es una vertical slice porque no es un
  requisito del sistema: está en «Fuera del plan» de `PLAN.md` y anotada en `SEGUIMIENTO.md`.
- **La integración continua** (que las pruebas corran solas en cada push) se monta en la **pieza 3**,
  no antes.
- **`VISUALS.md` ya no se contradice**: la contradicción de colores se zanjó el 2026-08-17
  (`#F4F6F8` de fondo, `#002554` de principal).
