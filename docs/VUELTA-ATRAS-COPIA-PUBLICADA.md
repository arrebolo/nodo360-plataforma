# Vuelta atrás de la copia publicada (PR 3)

Escrito **antes** de empezar, que es la única hora en que sirve.

La PR 3 tiene tres piezas que se despliegan por separado, y cada una se deshace de una
manera distinta. Lo importante: **ninguna de las tres pierde datos**, así que la vuelta
atrás nunca es una restauración, solo un cambio de dónde se lee y quién puede leer.

## El orden, y por qué

| paso | qué | se deshace con |
|---|---|---|
| 1 | **Migración 119**: abrir el espejo a la lectura y arreglar el trigger | migración 119-atras (abajo) |
| 2 | **Las lecturas**, por zonas y en varias PR | revertir la PR de esa zona |
| 3 | **Migración 120**: cerrar las tablas de trabajo a `anon` y a `authenticated` | migración 120-atras (abajo) |

El paso 1 **no cambia nada de lo que se ve**: solo concede permisos que nadie usa
todavía y cambia cuándo se retira una fila del espejo. Es seguro aplicarlo con el código
actual en producción, y es la condición para el paso 2.

El paso 3 va **al final** porque es el único que puede dejar una pantalla en blanco: si
se cierra `courses` a `authenticated` mientras alguna lectura de alumno sigue apuntando
ahí, esa pantalla se queda vacía. El guardián de CI lleva la cuenta de las 137 lecturas
pendientes; **el paso 3 no se aplica hasta que el guardián esté en cero sin excepciones**.

## Qué puede salir mal, y qué se hace

### a) Una pantalla se queda vacía o en blanco tras una PR de lecturas

Lo más probable, y lo más barato de arreglar: **revertir esa PR**. Las lecturas van por
zonas justamente para que la unidad de vuelta atrás sea pequeña y el resto siga en pie.
El espejo sigue leyéndose desde las zonas ya migradas; no hay estado intermedio
inconsistente, porque el espejo y las tablas de trabajo tienen los mismos ids.

Señal: las 48 comprobaciones de `scripts/probar-las-pantallas-principales.mts`, que
fallan diciendo qué pantalla y qué dato falta.

### b) El catálogo se queda vacío

Es el riesgo que el diseño nombra desde el principio: **si el código lee el espejo y el
espejo está vacío**, no hay catálogo. No puede pasar en este orden —el relleno se aplicó
con la 117 y está verificado: 10 cursos vivos, 27 módulos, 81 lecciones, 243
preguntas—, pero la comprobación antes de cada PR de lecturas es una línea:

```sql
SELECT (SELECT COUNT(*) FROM courses_publicados WHERE retirada_el IS NULL) AS vivos,
       (SELECT COUNT(*) FROM courses WHERE status = 'published')            AS publicados;
```

Si no coinciden, no se mergea nada: primero se arregla el espejo con
`SELECT public.publicar_curso('<id>')` sobre los que falten.

### c) Alguien pierde de vista un curso que había hecho

Medido antes de escribir la migración: hay **17 matrículas y 6 certificados en cursos
archivados**, y **33 filas de progreso en 30 lecciones retiradas**. Una política de
«solo filas vivas» les quitaría su historial de la pantalla.

Por eso las políticas tienen dos mitades: **vivo para todos**, y **retirado solo para
quien tiene matrícula, certificado o progreso en él**. Si aun así aparece un caso que no
cubre, la vuelta atrás no es tocar las políticas a ciegas: es añadir el caso medido.

### d) El trigger deja de publicar o retira cuando no debe

El cambio del trigger es de una condición. Si se comporta mal, la 119-atrás devuelve la
versión de la 117 **sin tocar ninguna fila del espejo**: el espejo es el mismo, solo
cambia cuándo se escribe.

## Las migraciones de vuelta atrás

### 119-atrás · cerrar el espejo y devolver el trigger de la 117

```sql
BEGIN;

-- 1. El espejo, cerrado otra vez
REVOKE ALL ON public.courses_publicados        FROM anon, authenticated;
REVOKE ALL ON public.modules_publicados        FROM anon, authenticated;
REVOKE ALL ON public.lessons_publicadas        FROM anon, authenticated;
REVOKE ALL ON public.quiz_questions_publicadas FROM anon, authenticated;

DROP POLICY IF EXISTS cursos_publicados_vivos        ON public.courses_publicados;
DROP POLICY IF EXISTS cursos_publicados_mios         ON public.courses_publicados;
DROP POLICY IF EXISTS modulos_publicados_vivos       ON public.modules_publicados;
DROP POLICY IF EXISTS modulos_publicados_mios        ON public.modules_publicados;
DROP POLICY IF EXISTS lecciones_publicadas_vivas     ON public.lessons_publicadas;
DROP POLICY IF EXISTS lecciones_publicadas_mias      ON public.lessons_publicadas;
DROP POLICY IF EXISTS preguntas_publicadas_vivas     ON public.quiz_questions_publicadas;

-- 2. El trigger, como lo dejó la 117: retira al salir de «published», sea como sea
CREATE OR REPLACE FUNCTION public.al_publicar_refrescar_la_copia()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $fn$
BEGIN
  IF NEW.status = 'published' AND OLD.status IS DISTINCT FROM 'published' THEN
    PERFORM public.publicar_curso_interno(NEW.id);
  ELSIF OLD.status = 'published' AND NEW.status IS DISTINCT FROM 'published' THEN
    PERFORM public.retirar_curso_de_la_copia_interno(NEW.id);
  END IF;
  RETURN NULL;
END
$fn$;

COMMIT;

SELECT
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public'
     AND tablename IN ('courses_publicados','modules_publicados','lessons_publicadas','quiz_questions_publicadas')) AS politicas,
  has_table_privilege('anon', 'public.courses_publicados', 'SELECT')          AS lo_lee_anon,
  has_table_privilege('authenticated', 'public.courses_publicados', 'SELECT') AS lo_lee_auth,
  CASE WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public'
               AND tablename IN ('courses_publicados','modules_publicados','lessons_publicadas','quiz_questions_publicadas')) = 0
        AND NOT has_table_privilege('anon', 'public.courses_publicados', 'SELECT')
        AND NOT has_table_privilege('authenticated', 'public.courses_publicados', 'SELECT')
       THEN 'TODO CORRECTO' ELSE 'REVISAR' END AS veredicto;
```

**Ojo con el orden al volver atrás**: si el código ya lee el espejo, cerrarlo deja el
catálogo vacío. La 119-atrás se aplica **después** de revertir las PR de lecturas, nunca
antes.

### 120-atrás · reabrir las tablas de trabajo

La 120 (paso 3) guardará los `GRANT` y las políticas que quite, y su vuelta atrás los
repone. Se escribe con ella, cuando se sepa exactamente qué se cerró; aquí queda dicho
que **no se aplica la 120 sin su 120-atrás escrita en el mismo fichero**.

## Lo que no hace falta deshacer

- **El espejo no se vacía nunca**: `publicar_curso()` hace upsert y retira lo que ya no
  está, y las filas retiradas se conservan. Volver atrás en el código no pierde nada.
- **Las claves ajenas del progreso** ya apuntan al espejo desde la 117 y se quedan: no
  son parte de la PR 3.
- **El guardián de CI** no toca producción. Si estorba, se declara la excepción; no se
  revierte.
