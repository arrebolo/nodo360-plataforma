-- ============================================================================
-- MIGRACION 029: courses.total_duration_minutes pasa a calcularse solo
--
-- POR QUE
-- El campo se escribia a mano y nadie lo mantenia. Estado antes de esta
-- migracion: 11 de los 13 cursos publicados lo tenian a 0, por lo que la ficha
-- no mostraba duracion; los otros dos declaraban 150 minutos frente a unos 46 y
-- 59 minutos de contenido real. Es el mismo patron de courses.enrolled_count,
-- que ya hubo que retirar de la interfaz por mostrar siempre cero.
--
-- COMO SE CALCULA
--   texto visible de lessons.content (sin etiquetas HTML) / 1000 caracteres por
--   minuto de lectura, mas video_duration_minutes si lo hubiera.
--
-- Los 1.000 caracteres por minuto son una convencion para lectura tecnica en
-- espanol. Si se cambia el ritmo, basta con tocar la constante de la funcion y
-- reejecutar el relleno del PASO 3.
--
-- Es idempotente: reejecutarla recalcula lo mismo.
-- ============================================================================

BEGIN;

-- =====================================================
-- 1. Texto visible de un contenido HTML
-- =====================================================
-- IMMUTABLE y sin acceso a tablas: no necesita SECURITY DEFINER ni search_path,
-- porque no resuelve ningun nombre de objeto. Se declara STRICT para que un
-- content NULL devuelva NULL sin entrar en el cuerpo.

CREATE OR REPLACE FUNCTION public.texto_visible(p_html TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
STRICT
PARALLEL SAFE
AS $$
  SELECT btrim(
    regexp_replace(
      -- 2) colapsar espacios
      regexp_replace(
        -- 1) quitar comentarios HTML y luego las etiquetas
        regexp_replace(
          regexp_replace(p_html, '<!--.*?-->', ' ', 'gs'),
          '<[^>]*>', ' ', 'g'
        ),
        '\s+', ' ', 'g'
      ),
      '^\s+|\s+$', '', 'g'
    )
  );
$$;

COMMENT ON FUNCTION public.texto_visible IS
  'Devuelve el texto de un HTML sin etiquetas ni comentarios, con los espacios colapsados. Se usa para estimar el tiempo de lectura.';

-- =====================================================
-- 2. Recalculo de la duracion de un curso
-- =====================================================
-- SECURITY DEFINER porque el trigger se dispara con la sesion de quien edita la
-- leccion, que puede no tener privilegio de UPDATE sobre courses. Con
-- search_path fijado, como exige el lint de Supabase.

CREATE OR REPLACE FUNCTION public.recalcular_duracion_curso(p_course_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_minutos INT;
BEGIN
  IF p_course_id IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(
           SUM(
             CEIL(length(COALESCE(texto_visible(l.content), '')) / 1000.0)
             + COALESCE(l.video_duration_minutes, 0)
           ),
           0
         )::INT
    INTO v_minutos
    FROM public.lessons l
   WHERE l.course_id = p_course_id;

  UPDATE public.courses
     SET total_duration_minutes = v_minutos
   WHERE id = p_course_id
     AND total_duration_minutes IS DISTINCT FROM v_minutos;
END;
$$;

COMMENT ON FUNCTION public.recalcular_duracion_curso IS
  'Recalcula courses.total_duration_minutes sumando el tiempo de lectura de sus lecciones (1.000 caracteres por minuto) mas la duracion de video. La invoca el trigger de lessons.';

-- =====================================================
-- 3. Trigger sobre lessons
-- =====================================================

CREATE OR REPLACE FUNCTION public.trg_recalcular_duracion_curso()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- En un UPDATE que mueve la leccion de curso hay que recalcular los dos
  IF TG_OP = 'UPDATE' AND OLD.course_id IS DISTINCT FROM NEW.course_id THEN
    PERFORM recalcular_duracion_curso(OLD.course_id);
  END IF;

  IF TG_OP = 'DELETE' THEN
    PERFORM recalcular_duracion_curso(OLD.course_id);
    RETURN OLD;
  END IF;

  PERFORM recalcular_duracion_curso(NEW.course_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_duracion_curso ON public.lessons;
CREATE TRIGGER trigger_duracion_curso
  AFTER INSERT OR DELETE OR UPDATE OF content, video_duration_minutes, course_id
  ON public.lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_recalcular_duracion_curso();

-- El UPDATE OF limita el disparo a las tres columnas que afectan al calculo.
-- Editar el titulo o el orden de una leccion no recalcula nada.

-- =====================================================
-- 4. Privilegios
-- =====================================================
-- Nadie llama a estas funciones desde el cliente: la primera la usa la segunda,
-- y la segunda la usa el trigger. anon y authenticated no las necesitan.

REVOKE ALL ON FUNCTION public.texto_visible(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.recalcular_duracion_curso(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_recalcular_duracion_curso() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.texto_visible(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.recalcular_duracion_curso(UUID) TO service_role;

-- =====================================================
-- 5. Relleno inicial
-- =====================================================

DO $$
DECLARE
  c RECORD;
BEGIN
  FOR c IN SELECT id FROM public.courses LOOP
    PERFORM recalcular_duracion_curso(c.id);
  END LOOP;
END $$;

COMMIT;


-- ============================================================================
-- COMPROBACION (solo lectura, ejecutar aparte)
-- ============================================================================
-- 1. Duracion de cada curso publicado frente a su contenido
--
-- SELECT c.title,
--        c.total_duration_minutes AS minutos,
--        count(l.id)              AS lecciones,
--        sum(length(texto_visible(coalesce(l.content,'')))) AS caracteres
--   FROM public.courses c
--   LEFT JOIN public.lessons l ON l.course_id = c.id
--  WHERE c.status = 'published'
--  GROUP BY c.id, c.title, c.total_duration_minutes
--  ORDER BY c.title;
--
-- QUE DEBE SALIR: ningun curso con minutos a 0 salvo que no tenga lecciones con
-- contenido. Para los que tienen contenido, minutos debe rondar
-- caracteres/1000. Antes de esta migracion, 11 de 13 estaban a 0 y dos
-- declaraban 150.
--
-- 2. Que el trigger reacciona. Dentro de una transaccion que se deshace:
--
-- BEGIN;
--   SELECT total_duration_minutes FROM public.courses
--    WHERE slug = 'nodos-bitcoin-tu-soberania-tecnica';
--   UPDATE public.lessons SET content = content || repeat('x', 5000)
--    WHERE slug = 'instalacion-paso-a-paso';
--   SELECT total_duration_minutes FROM public.courses
--    WHERE slug = 'nodos-bitcoin-tu-soberania-tecnica';
-- ROLLBACK;
--
-- QUE DEBE SALIR: la segunda lectura, cinco minutos mas que la primera.
--
-- 3. Que las etiquetas no cuentan como texto
--
-- SELECT texto_visible('<p>Hola <strong>mundo</strong></p><!-- REVISAR: nota -->');
-- QUE DEBE SALIR: exactamente 'Hola mundo'.
