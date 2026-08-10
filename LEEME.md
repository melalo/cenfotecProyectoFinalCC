# Su propio proyecto · SINT-732

Esta carpeta trae una herramienta que convierte su caso de proyecto en **su
enunciado**: el documento contra el cual va a trabajar hasta la Sesión 8 y contra el
cual se le va a calificar.

**La corren todos**, venga el caso de donde venga: si trae una idea propia, si toma
uno de los cinco casos semilla de la consigna, o si todavía no sabe cuál quiere. Con
una semilla la conversación es más corta, porque el caso ya trae contestada buena
parte de lo que hay que definir. Tomar una semilla no penaliza ni afecta la nota.

## Cómo se usa

**1.** Descomprima esta carpeta donde quiera. No la mueva de sitio después.

**2.** Abra la terminal y escriba `cd`, un espacio, y **arrastre esta carpeta** a la
ventana de la terminal. Se va a escribir sola la ruta. Presione Enter.

```bash
cd
```

**3.** Arranque Claude Code:

```bash
claude
```

**4.** Escriba esto y presione Enter:

```
/mi-proyecto
```

A partir de ahí es una conversación. Si trae una idea propia, cuéntela como se la
contaría a un colega: en una línea o en tres párrafos, da igual. Si va a tomar un
caso semilla, diga cuál. Y si todavía no sabe, dígalo también y le van a mostrar los
cinco para que elija. Después le van a preguntar lo que falte.

## Qué va a recibir

Dos archivos, en esta misma carpeta:

- **`PROYECTO.md`** — su enunciado. Léalo y corrija lo que no lo represente: es su
  documento, no del agente. Cuando cree el repositorio del proyecto, llévelo ahí.
- **`FICHA-APROBACION.md`** — una página. **Esta es la que sube a Moodle.**

## La fecha

Suba la ficha **cuanto antes, y a más tardar el lunes 3 de agosto a medianoche**.
Es la única fecha intermedia firme del proyecto: el docente necesita revisarla antes
de la Sesión 3, del martes 4 de agosto. Si la ficha está completa y sin
banderas, la aprobación es prácticamente automática.

Si le devuelven ajustes, vuelva a correr `/mi-proyecto` en esta carpeta y corrija lo
que haga falta. La conversación no es de un solo tiro.

## Dos cosas que conviene saber antes de empezar

**No se le va a pedir que decida la arquitectura ni con qué tecnología lo va a
construir.** Esas decisiones llegan después y el curso se las va a enseñar. El
enunciado define qué tiene que ser cierto, no cómo lograrlo.

**No invente respuestas para que la conversación avance.** Si no sabe un dato, dígalo
así: queda escrito como supuesto, con esa etiqueta, y se resuelve durante el
proyecto. Un supuesto declarado es honesto y no le resta nada. Un dato inventado se
le cae en la Sesión 4.

## Si algo no funciona

Si al escribir `/mi-proyecto` no aparece nada, casi siempre es que arrancó Claude
Code desde otra carpeta. Salga con `/exit`, repita el paso 2 y vuelva a entrar.
Cualquier otra cosa, escríbale al docente antes del lunes: no pierda el fin de
semana peleando con esto.
