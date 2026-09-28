-- ============================================================================
-- 082: las notas van donde la interfaz las busca, y la 078 deja de mentir
-- ============================================================================
-- ESTADO: PENDIENTE DE APLICAR.
--   Copia para pegar: tmp/082-aplicar.sql
--
-- EL LIO DE LAS NOTAS: TRES TABLAS
--   public.user_notes          0 filas   lesson_id, note_text
--   public.user_lesson_notes   2 filas   course_id, lesson_id, content
--   public.notes               0 filas   lesson_id, content, video_timestamp_seconds
--
--   La interfaz -LessonNotes.tsx y LessonNotesPanel.tsx- llama a /api/notes, y
--   esa ruta escribe y lee en `user_notes`. Pero las dos notas que existen de
--   verdad estan en `user_lesson_notes`, que la interfaz no lee nunca: quien
--   las escribio ya no las ve.
--
--   `notes` la usa /api/lesson-notes, a la que NO LLAMA NADIE. Esta migracion
--   no toca ni esa tabla ni esa ruta: se quedan para la limpieza posterior.
--
-- LA 078 DICE LO CONTRARIO, Y SE EQUIVOCA
--   Su comentario sobre user_notes afirma: «PARADA. Notas sueltas. Las notas
--   que SI se usan son user_lesson_notes, que cuelgan de una leccion». Es falso
--   en las dos mitades:
--     · user_notes TIENE lesson_id, asi que no son notas sueltas;
--     · y es la que usa la interfaz hoy.
--   Se corrige aqui. El error fue mio al escribir la 078: mire las tablas y no
--   mire que ruta llamaba la interfaz.
--
-- QUE SE COPIA, Y QUE NO SE PIERDE
--   Las 2 filas de user_lesson_notes se COPIAN a user_notes. El origen NO se
--   borra: queda como estaba, y su comentario dice que ya se copio.
--
--   `course_id` no se copia porque user_notes no tiene esa columna: la leccion
--   ya determina el curso a traves de modules. Eso obliga a un cambio en
--   /api/admin/users/[id]/reset-course, que borraba las notas de un curso con
--   .eq('course_id', ...): ahora filtra por los lesson_id del curso, que esa
--   ruta ya tiene calculados.
--
-- SOBRE EL CONTENIDO DE ESAS DOS NOTAS, PARA QUE NADIE SE LLEVE UNA SORPRESA
--   Son de una cuenta con rol admin, de diciembre de 2025, y una de las dos
--   tiene CERO caracteres. No hay contenido de ningun alumno en juego. Se
--   copian igual, porque perder datos de usuario por decidir que "no valian"
--   es peor que copiar una fila vacia. Si prefieres dejar fuera la vacia,
--   descomenta la linea del WHERE que lo filtra.
--
-- REEJECUTABLE: el INSERT lleva NOT EXISTS, asi que una segunda pasada no
-- duplica nada.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Copiar las notas a la tabla que lee la interfaz
-- ----------------------------------------------------------------------------
INSERT INTO public.user_notes (user_id, lesson_id, note_text, created_at, updated_at)
SELECT uln.user_id,
       uln.lesson_id,
       uln.content,
       uln.created_at,
       uln.updated_at
  FROM public.user_lesson_notes uln
 WHERE uln.lesson_id IS NOT NULL
   -- Descomenta para dejar fuera las notas vacias:
   -- AND btrim(coalesce(uln.content, '')) <> ''
   AND NOT EXISTS (
     SELECT 1
       FROM public.user_notes un
      WHERE un.user_id   = uln.user_id
        AND un.lesson_id = uln.lesson_id
   );


-- ----------------------------------------------------------------------------
-- 2. El comentario de la 078, corregido
-- ----------------------------------------------------------------------------
COMMENT ON TABLE public.user_notes IS 'Notas que cada persona escribe en una leccion. ES LA TABLA VIVA: /api/notes lee y escribe aqui, y es la que llaman LessonNotes.tsx y LessonNotesPanel.tsx. La 078 decia lo contrario -que las notas usadas eran las de user_lesson_notes- y se equivocaba: lo corrige la 082. No tiene course_id; el curso sale de la leccion a traves de modules.';

COMMENT ON TABLE public.user_lesson_notes IS 'ORIGEN HISTORICO de las notas, conservado (082, 28/09/2026). Sus filas se copiaron a public.user_notes, que es la que lee la interfaz; aqui no se ha borrado nada. Solo la consultan las metricas de administracion y reset-course, y desde la 082 tambien esas leen user_notes. No escribir mas aqui: si hace falta un course_id en las notas, se anade a user_notes.';


-- ----------------------------------------------------------------------------
-- 3. La comprobación. Es lo último, así que es lo que muestra el editor.
-- ----------------------------------------------------------------------------
-- QUÉ TIENE QUE SALIR, en una sola fila:
--     en_user_notes          -> 2    las dos notas, ya copiadas
--     en_user_lesson_notes   -> 2    el origen NO se ha tocado
--     sin_copiar             -> 0    ninguna se queda atras
--     en_notes               -> 0    esa tabla no se toca
--     comentario_corregido   -> true la 078 ya no dice que esta parada
--     veredicto              -> TODO CORRECTO
SELECT
  (SELECT count(*) FROM public.user_notes)                          AS en_user_notes,
  (SELECT count(*) FROM public.user_lesson_notes)                   AS en_user_lesson_notes,
  (SELECT count(*)
     FROM public.user_lesson_notes uln
    WHERE uln.lesson_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.user_notes un
                       WHERE un.user_id = uln.user_id
                         AND un.lesson_id = uln.lesson_id))         AS sin_copiar,
  (SELECT count(*) FROM public.notes)                               AS en_notes,
  (coalesce(obj_description('public.user_notes'::regclass), '')
     LIKE 'Notas que cada persona%')                                AS comentario_corregido,
  CASE
    WHEN (SELECT count(*)
            FROM public.user_lesson_notes uln
           WHERE uln.lesson_id IS NOT NULL
             AND NOT EXISTS (SELECT 1 FROM public.user_notes un
                              WHERE un.user_id = uln.user_id
                                AND un.lesson_id = uln.lesson_id)) = 0
     AND (SELECT count(*) FROM public.user_lesson_notes) = 2
     AND coalesce(obj_description('public.user_notes'::regclass), '')
           LIKE 'Notas que cada persona%'
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                               AS veredicto;
