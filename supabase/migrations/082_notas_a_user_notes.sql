-- ============================================================================
-- 082: las notas van donde la interfaz las busca, y la 078 deja de mentir
-- ============================================================================
-- ESTADO: CORREGIDA el 28/09/2026. La primera version FALLO al aplicarla:
--
--     ERROR 23503: insert or update on table "user_notes" violates foreign key
--     constraint "user_notes_lesson_id_fkey".
--     Key (lesson_id)=(0ffc48ab-...) is not present in table "lessons".
--
--   Copia para pegar: tmp/082-aplicar.sql
--
-- NO SE APLICO NADA. COMPROBADO
--   El editor SQL de Supabase ejecuta el script en una sola transaccion, asi
--   que el fallo lo deshizo todo. Verificado despues contra la base, sin
--   fiarse de eso:
--
--     user_notes           0 filas, y su comentario sigue siendo el de la 078
--                          («PARADA... Notas sueltas...»), no el de esta
--     user_lesson_notes    2 filas, sin comentario
--
--   Es decir: ni el INSERT ni los COMMENT llegaron a escribirse.
--
-- LO QUE EL FALLO DESTAPO, Y ES PEOR DE LO QUE PARECIA
--   El error solo nombraba UNA leccion, porque PostgreSQL informa de la primera
--   violacion que encuentra. Comprobadas las dos:
--
--     leccion a7c4c467   BORRADA   nota de 5 caracteres
--     leccion 0ffc48ab   BORRADA   nota de 0 caracteres
--
--   Y el curso del que colgaban, 2107e9b5, TAMBIEN esta borrado.
--
--   Asi que las dos notas son huerfanas. No es que su dueno no las viera
--   porque la interfaz mirase otra tabla: es que NO HAY DONDE ENSENARLAS. El
--   panel de notas se abre desde una leccion, y esa leccion no existe.
--
--   Lo que escribi en la primera version de esta migracion -«quien escribio
--   esas notas ya no las ve»- era verdad por un motivo mas simple y mas
--   definitivo del que yo creia.
--
-- POR QUE EXISTEN ESAS HUERFANAS: FALTA UNA CLAVE AJENA
--   Comprobado columna por columna:
--
--     user_notes.lesson_id          TIENE clave ajena a lessons
--     notes.lesson_id               TIENE clave ajena a lessons
--     user_lesson_notes.lesson_id   SIN clave ajena
--
--   Por eso borrar la leccion no se llevo las notas ni fallo al intentarlo:
--   nadie estaba mirando. Y por eso el INSERT en user_notes, que SI tiene la
--   clave, se nego. La clave ajena hizo su trabajo: no dejo entrar basura.
--
--   Compara con user_progress, que desde la 005 tiene ON DELETE CASCADE: ahi
--   borrar una leccion se lleva el progreso. Tres tablas de notas y tres
--   comportamientos distintos ante el mismo borrado.
--
--   Esta migracion NO anade la clave ajena que falta: eso obligaria a decidir
--   antes que hacer con las dos filas huerfanas, y borrar datos de alguien no
--   se cuela en una migracion que iba de otra cosa. Queda anotado.
--
-- QUE HACE ESTA VERSION
--   1. Copia a user_notes SOLO las notas cuya leccion exista. Hoy eso son
--      CERO. Se conserva el INSERT porque la migracion tiene que seguir siendo
--      correcta si manana alguien escribe una nota en la tabla vieja, y porque
--      es la forma de dejar escrito el criterio.
--   2. Deja las huerfanas donde estan. NO se borran.
--   3. Corrige el comentario de la 078 sobre user_notes, que es lo que de
--      verdad estaba mal y sigue estandolo.
--   4. Documenta user_lesson_notes: origen conservado, con huerfanas y sin
--      clave ajena.
--
-- EL LIO COMPLETO DE LAS NOTAS, PARA QUIEN LLEGUE DESPUES
--   user_notes          la VIVA: /api/notes lee y escribe aqui, y es la que
--                       llaman LessonNotes.tsx y LessonNotesPanel.tsx
--   user_lesson_notes   origen historico, 2 huerfanas, sin clave ajena
--   notes               la usa /api/lesson-notes, a la que NO LLAMA NADIE
--
--   No se toca ni `notes` ni /api/lesson-notes: quedan para la limpieza
--   posterior. Esa ruta tiene cuatro metodos y ningun consumidor.
--
-- REEJECUTABLE: el INSERT lleva NOT EXISTS y la guarda de la leccion, y los
-- COMMENT escriben siempre el mismo texto.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Copiar a la tabla viva las notas que se pueden copiar
-- ----------------------------------------------------------------------------
-- La guarda EXISTS sobre lessons es la que faltaba: sin ella, una nota cuya
-- leccion se borro hace que falle el INSERT entero, y con el la migracion
-- completa.
INSERT INTO public.user_notes (user_id, lesson_id, note_text, created_at, updated_at)
SELECT uln.user_id,
       uln.lesson_id,
       uln.content,
       uln.created_at,
       uln.updated_at
  FROM public.user_lesson_notes uln
 WHERE uln.lesson_id IS NOT NULL
   -- La leccion tiene que existir: user_notes.lesson_id tiene clave ajena.
   AND EXISTS (
     SELECT 1 FROM public.lessons l WHERE l.id = uln.lesson_id
   )
   -- Y no copiar dos veces.
   AND NOT EXISTS (
     SELECT 1
       FROM public.user_notes un
      WHERE un.user_id   = uln.user_id
        AND un.lesson_id = uln.lesson_id
   );


-- ----------------------------------------------------------------------------
-- 2. El comentario de la 078, corregido
-- ----------------------------------------------------------------------------
COMMENT ON TABLE public.user_notes IS 'Notas que cada persona escribe en una leccion. ES LA TABLA VIVA: /api/notes lee y escribe aqui, y es la que llaman LessonNotes.tsx y LessonNotesPanel.tsx. La 078 decia lo contrario -que las notas usadas eran las de user_lesson_notes- y se equivocaba: lo corrige la 082. No tiene course_id; el curso sale de la leccion a traves de modules. lesson_id tiene clave ajena a lessons, asi que aqui no entran notas de lecciones borradas.';

COMMENT ON TABLE public.user_lesson_notes IS 'ORIGEN HISTORICO de las notas, conservado (082, 28/09/2026). La tabla viva es public.user_notes, que es la que lee la interfaz. Aqui no se ha borrado nada. OJO: su lesson_id NO tiene clave ajena, asi que contiene notas huerfanas -a 28/09/2026, las 2 que hay, de lecciones y de un curso ya borrados- que por eso no se pueden copiar a user_notes. No escribir mas aqui. Si alguna vez se anade la clave ajena que falta, hay que decidir primero que hacer con esas filas.';


-- ----------------------------------------------------------------------------
-- 3. La comprobación. Es lo último, así que es lo que muestra el editor.
-- ----------------------------------------------------------------------------
-- QUÉ TIENE QUE SALIR, en una sola fila:
--     en_user_notes         -> 0    hoy no hay ninguna copiable
--     en_user_lesson_notes  -> 2    el origen NO se ha tocado
--     copiables             -> 0    notas con leccion existente
--     huerfanas             -> 2    leccion borrada; se quedan donde estan
--     pendientes_de_copiar  -> 0    ninguna copiable se queda atras
--     en_notes              -> 0    esa tabla no se toca
--     comentario_corregido  -> true la 078 ya no dice que esta parada
--     veredicto             -> TODO CORRECTO
--
-- Si algun dia `huerfanas` baja a 0 y `copiables` sube, es que alguien escribio
-- en la tabla vieja: esta migracion lo copiaria al reejecutarla.
WITH clasificadas AS (
  SELECT uln.user_id,
         uln.lesson_id,
         EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = uln.lesson_id) AS leccion_existe
    FROM public.user_lesson_notes uln
)
SELECT
  (SELECT count(*) FROM public.user_notes)                          AS en_user_notes,
  (SELECT count(*) FROM public.user_lesson_notes)                   AS en_user_lesson_notes,
  count(*) FILTER (WHERE leccion_existe)                            AS copiables,
  count(*) FILTER (WHERE NOT leccion_existe)                        AS huerfanas,
  count(*) FILTER (
    WHERE leccion_existe
      AND NOT EXISTS (SELECT 1 FROM public.user_notes un
                       WHERE un.user_id = clasificadas.user_id
                         AND un.lesson_id = clasificadas.lesson_id)
  )                                                                 AS pendientes_de_copiar,
  (SELECT count(*) FROM public.notes)                               AS en_notes,
  (coalesce(obj_description('public.user_notes'::regclass), '')
     LIKE 'Notas que cada persona%')                                AS comentario_corregido,
  CASE
    WHEN count(*) FILTER (
      WHERE leccion_existe
        AND NOT EXISTS (SELECT 1 FROM public.user_notes un
                         WHERE un.user_id = clasificadas.user_id
                           AND un.lesson_id = clasificadas.lesson_id)
    ) = 0
     AND coalesce(obj_description('public.user_notes'::regclass), '')
           LIKE 'Notas que cada persona%'
     AND coalesce(obj_description('public.user_lesson_notes'::regclass), '')
           LIKE 'ORIGEN HISTORICO%'
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                               AS veredicto
  FROM clasificadas;
