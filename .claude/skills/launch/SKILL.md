---
name: launch
description: Deja el proyecto de reservas levantado y listo para recorrerse. Revisa que se pueda arrancar (puerto, .env, base), levanta la aplicación, y cuenta —leyéndolo de la base de datos, no de un documento— con qué cuentas entrar y qué hay para mostrar. Con "limpio" rehace antes los datos de prueba, avisando qué se pierde. Úsala cuando el usuario diga /launch, "arrancá el proyecto", "levantá la aplicación", "dejalo listo para la demostración" o "prepará la demo".
---

# launch — dejar el proyecto listo para recorrerse

Esta skill es el entregable **«skill de arranque»** de la consigna del curso: *«al menos un skill o
comando propio de Claude Code, en la carpeta `.claude/`, que automatiza una tarea real del
proyecto. El caso de referencia es el arranque para demostración: preparar los datos de ejemplo,
levantar el sistema y dejarlo listo para recorrerse.»*

**La tarea real que automatiza** es la que se hacía a mano en cada sesión: correr dos comandos y
después abrir `PROXIMA-SESION.md` para acordarse de con qué cuenta entrar, qué citas hay y cuál no
hay que tocar. Ese documento **es una foto** y se pone viejo solo. Esta skill no lo lee: le pregunta
a la base de datos, que es la única fuente que no puede quedar desactualizada.

## Antes de nada

**El nombre de esta skill está en inglés a propósito**, elegido por la estudiante el 2026-08-24. Es
una excepción a la convención de nombres del proyecto —que pide español y minúscula— y está anotada
como tal en `CLAUDE.md`. No la «corrijas».

## Los dos modos

| Cómo la invocan | Qué hace |
|---|---|
| `/launch` | Levanta **con los datos que ya hay**. **No borra nada.** Es el modo normal |
| `/launch limpio` | Rehace la base desde cero y levanta. **Destruye datos**, así que pide confirmación |

**Si no dicen «limpio», es el modo normal.** No ofrezcas rehacer los datos por tu cuenta.

## El procedimiento

### 1. Revisá si se puede arrancar

Corré esto y **leé la sección `REVISIÓN` de la salida**:

```bash
npm run estado
```

Actuá según lo que diga, **antes de intentar levantar nada**:

- **El puerto está ocupado** → **parate acá.** No corras `npm start`: el error que da es un muro de
  texto que no dice qué hacer. Explicá que hay dos posibilidades —la aplicación ya está levantada, y
  entonces alcanza con abrir `http://localhost:3000`, o quedó un proceso viejo que hay que apagar— y
  preguntá cuál es antes de seguir.
- **No hay base de datos** → decilo y **preguntá** si querés que la cree con `npm run datos`. No la
  crees por tu cuenta.
- **Falta el `.env` o la clave del correo** → **no es un impedimento**, la aplicación levanta igual.
  Mencionalo en una línea, porque cambia lo que se puede mostrar: sin `RESEND_API_KEY` ningún correo
  sale de verdad (las citas se crean igual, RF-19).

### 2. Solo si dijeron «limpio»: confirmá antes de destruir

`npm run datos` **borra la base entera**: se lleva las cuentas de cliente, todas las citas y el
registro de correos. Lo único que quedan son los datos precargados —el negocio, los servicios, los
proveedores, el horario, los feriados y la cuenta de Personal—.

**Nunca lo corras sin confirmación explícita.** Mostrá primero, con los números que dio
`npm run estado`, **qué se va a perder** («hay 10 citas y 6 cuentas de cliente; se borran todas»), y
esperá el sí.

Y avisá de esto, que es la trampa de ese comando: **falla si la aplicación está levantada**, porque
Windows no deja borrar un archivo que otro programa tiene abierto. Si el puerto estaba ocupado, hay
que apagarla primero.

### 3. Levantá la aplicación

```bash
npm start
```

Corrélo **en segundo plano**: se queda escuchando y no termina nunca, así que en primer plano
bloquearía el resto del procedimiento. `npm start` compila los estilos solo, antes de levantar.

Esperá a que conteste antes de dar nada por hecho — **no anuncies que está levantada sin
comprobarlo**:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

Un `200` es que está lista.

### 4. Contá qué hay adentro

Volvé a correr `npm run estado` y **mostrale al usuario las secciones `CUENTAS`, `CITAS` y
`PARA MOSTRAR` tal como salen**. Ese guion lee la base en el momento, así que lo que dice es lo que
hay ahora.

Después escribí, siempre y aunque parezca obvio:

- **la dirección completa con su puerto**: `http://localhost:3000`
- **cómo se apaga**: `Ctrl + C` en la terminal donde quedó corriendo
- **con qué cuenta entrar primero**, según lo que se quiera mostrar

## Lo que esta skill NO hace, y es a propósito

- **No muestra las contraseñas de los clientes.** No puede: en la base solo queda su huella cifrada,
  que no se puede volver a leer. La de **Personal** sí la muestra, porque esa cuenta la precarga
  `guiones/datos-de-prueba.js` y ahí está escrita en texto — es un dato de prueba inventado, y
  leerla de ahí es lo que garantiza que nunca quede vieja.
- **No inventa citas ni cuentas.** Si no hay nada para mostrar, lo dice y explica por qué. Para
  mostrar la pieza 8 hacen falta citas pasadas, y la aplicación **no deja crearlas** (RN-4): hay que
  insertarlas a mano en la base, igual que hacen las pruebas. Eso está permitido y explicado en
  `CLAUDE.md`, pero **no lo hagas sin que te lo pidan**.
- **No corre las pruebas.** Para eso está `npm test`. Son dos cosas distintas: esta skill prepara una
  demostración, no verifica el código.

## Si algo falla

**No afirmes que algo funcionó sin haber visto la salida.** Es una regla escrita de este proyecto, y
nació de un caso real que está en `BITACORA.md`: se afirmó que el entorno había matado el proceso del
servidor, y era falso — el proceso seguía vivo ocupando el puerto 3000. Si un paso falla, mostrá el
error y decí qué se intentó.
