-- ============================================================================
-- MIGRACION 030: la edicion de un admin deja de despublicar cursos
--
-- QUE PASO EL 21/09/2026
-- La correccion de tildes de la migracion 028 escribio courses.title,
-- description y long_description de los dos cursos publicados que toco. El
-- trigger trigger_course_modification, creado en la 015, devuelve a
-- 'pending_review' cualquier curso publicado al que se le cambien esos campos,
-- y no exime a nadie: no hay una sola comprobacion de rol en la funcion.
--
-- Nodos Bitcoin y Cold Storage salieron del catalogo a las 20:55, con 1,4
-- segundos de diferencia, que es lo que tardo el script en escribir uno y otro.
-- De paso, /rutas/bitcoin-tecnico y /rutas/seguridad-avanzada se quedaron sin
-- cursos publicados y desaparecieron del listado.
--
-- POR QUE NO FUNCIONO LA VALVULA QUE YA EXISTIA
-- La 015 dejaba admin_update_course() para que los admins editaran sin
-- re-revision. Falla por dos motivos:
--   1. No existe en esta base de datos. PostgREST no la expone, asi que la 015
--      se aplico solo en parte. El trigger si esta activo.
--   2. Su metodo no es correcto: ALTER TABLE ... DISABLE TRIGGER no es local a
--      la sesion. Desactiva el trigger para todas las conexiones mientras dura
--      la operacion, y lo deja desactivado para siempre si la funcion falla
--      entre el DISABLE y el ENABLE.
--
-- COMO SE EXIME AHORA, Y POR QUE ASI
-- La exencion se decide dentro del trigger, y se basa en una variable de sesion
-- explicita, no en la ausencia de JWT:
--
--   app.skip_republish_check = 'on'  ->  no despublica
--   is_admin(auth.uid())             ->  no despublica
--   resto                            ->  comportamiento actual
--
-- Se descarto la alternativa "sin JWT no despublica". Hoy seria equivalente:
-- se auditaron las 29 rutas y acciones que escriben en courses y NINGUNA de las
-- de instructor usa service_role. Todas pasan por createClient(), de modo que
-- el trigger ve su JWT:
--
--   lib/courses/course-actions.ts  updateCourse()        createClient
--   app/api/instructor/courses/[id]/status               createClient
--   app/api/instructor/courses/[id]/submit-review        createClient
--   app/api/instructor/courses/[id]/duplicate            createClient
--   dashboard/instructor/cursos/**                       createClient
--
-- Los unicos escritores con service_role son de admin o de mantenimiento, y
-- ninguno toca campos vigilados:
--   admin/cursos/[id]/page.tsx         solo updated_at
--   api/admin/courses/**refresh-counts solo contadores
--   lib/courses/reviews.ts             solo lee courses, no la actualiza
--
-- El problema de "sin JWT" no es lo que pasa hoy, es lo que pasaria manana: el
-- dia que alguien convierta una ruta de instructor a createAdminClient para
-- esquivar una politica RLS, el flujo de revision dejaria de aplicarse en
-- silencio, sin error y sin que nadie se entere. La variable de sesion invierte
-- el valor por defecto: la comprobacion se aplica siempre salvo que alguien
-- renuncie a ella a proposito y por escrito.
--
-- Ademas es dificil de activar por accidente desde la aplicacion: set_config
-- con alcance de transaccion no sobrevive al pool de conexiones de PostgREST.
-- Es util en el SQL Editor y en migraciones, que es justo donde hace falta.
--
-- COMO SE USA EN UNA MIGRACION FUTURA QUE TOQUE CONTENIDO
--   BEGIN;
--     SELECT set_config('app.skip_republish_check', 'on', true);  -- true = solo esta transaccion
--     UPDATE public.courses SET title = ... WHERE ...;
--   COMMIT;
--
-- CAMPOS VIGILADOS
-- Los mismos nueve de la 015. Se documenta cuales NO lo estan, porque se mueven
-- solos: total_duration_minutes (trigger de la 029), total_lessons y
-- total_modules (triggers de la 006), enrolled_count, updated_at, published_at
-- y review_status. Ninguno dispara la re-revision, ni debe hacerlo.
--
-- NOTA SOBRE EL ALCANCE REAL DEL FLUJO
-- El trigger vive en courses, asi que solo reacciona a los metadatos del curso.
-- Editar modulos o lecciones de un curso publicado NO lo devuelve a revision:
-- los triggers de contadores solo tocan total_lessons y total_modules, que no
-- estan vigilados. Es decir, hoy un instructor puede reescribir entera una
-- leccion publicada sin que nadie la revise. Eso no lo cambia esta migracion:
-- es una decision de producto pendiente.
--
-- Es idempotente.
-- ============================================================================

BEGIN;

-- =====================================================
-- 1. Trigger corregido
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_course_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid  UUID := auth.uid();
  v_skip TEXT := current_setting('app.skip_republish_check', true);
BEGIN
  -- Solo afecta a cursos que estaban publicados
  IF OLD.status IS DISTINCT FROM 'published' THEN
    RETURN NEW;
  END IF;

  -- Si el propio UPDATE fija otro status, se respeta: quien lo escribe sabe lo
  -- que hace (archivar un curso publicado, por ejemplo).
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  -- Renuncia explicita, de alcance transaccional. La usan las migraciones que
  -- tocan contenido a proposito. Nunca el codigo de la aplicacion.
  IF v_skip = 'on' THEN
    RETURN NEW;
  END IF;

  -- Un admin edita sin mandar el curso a revision.
  IF v_uid IS NOT NULL AND is_admin(check_user_id => v_uid) THEN
    RETURN NEW;
  END IF;

  -- Resto, incluido un instructor sobre su propio curso: flujo previsto.
  IF (OLD.title            IS DISTINCT FROM NEW.title) OR
     (OLD.description      IS DISTINCT FROM NEW.description) OR
     (OLD.long_description IS DISTINCT FROM NEW.long_description) OR
     (OLD.level            IS DISTINCT FROM NEW.level) OR
     (OLD.price            IS DISTINCT FROM NEW.price) OR
     (OLD.is_free          IS DISTINCT FROM NEW.is_free) OR
     (OLD.is_premium       IS DISTINCT FROM NEW.is_premium) OR
     (OLD.thumbnail_url    IS DISTINCT FROM NEW.thumbnail_url) OR
     (OLD.banner_url       IS DISTINCT FROM NEW.banner_url)
  THEN
    NEW.status := 'pending_review';
    NEW.updated_at := now();
    RAISE NOTICE 'Curso % vuelve a pending_review por edicion de contenido (uid %)', NEW.id, v_uid;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.check_course_modification IS
  'Devuelve un curso publicado a pending_review cuando se edita su contenido. Exime a los admin y a quien fije app.skip_republish_check = on en su transaccion (migraciones). No vigila contadores ni marcas de tiempo.';

-- El trigger no cambia; se recrea por si acaso.
DROP TRIGGER IF EXISTS trigger_course_modification ON public.courses;
CREATE TRIGGER trigger_course_modification
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.check_course_modification();

-- =====================================================
-- 2. Retirar admin_update_course
-- =====================================================
-- No existe aqui, pero si reapareciese seria un riesgo por el DISABLE TRIGGER
-- global. Con la exencion dentro del trigger ya no hace falta.

DROP FUNCTION IF EXISTS public.admin_update_course(UUID, JSONB);

-- =====================================================
-- 3. Devolver a published los dos cursos afectados
-- =====================================================
-- Solo cambia status, asi que no necesita la renuncia: el trigger sale por la
-- primera condicion, porque para entonces OLD.status ya es 'pending_review'.
-- Se filtra por el estado actual para no revivir un curso mandado a revision a
-- proposito.

UPDATE public.courses
   SET status = 'published',
       updated_at = now()
 WHERE slug IN (
         'nodos-bitcoin-tu-soberania-tecnica',
         'cold-storage-protege-tus-bitcoin'
       )
   AND status = 'pending_review';

COMMIT;


-- ============================================================================
-- COMPROBACIONES (solo lectura salvo la 4 y la 5, que terminan en ROLLBACK)
-- ============================================================================
-- 1. Los dos cursos han vuelto
--
-- SELECT slug, status FROM public.courses
--  WHERE slug IN ('nodos-bitcoin-tu-soberania-tecnica','cold-storage-protege-tus-bitcoin');
-- QUE DEBE SALIR: las dos filas con status = 'published'.
--
-- 2. No queda ningun curso en revision
--
-- SELECT count(*) FROM public.courses WHERE status = 'pending_review';
-- QUE DEBE SALIR: 0. El contador "Pendientes" del panel bajara a 0.
--
-- 3. Las seis rutas vuelven a ser visibles
--
-- SELECT lp.slug, count(c.id) FILTER (WHERE c.status = 'published') AS publicados
--   FROM public.learning_paths lp
--   LEFT JOIN public.learning_path_courses lpc ON lpc.learning_path_id = lp.id
--   LEFT JOIN public.courses c ON c.id = lpc.course_id
--  WHERE lp.is_active
--  GROUP BY lp.slug ORDER BY lp.slug;
-- QUE DEBE SALIR: ninguna con 0, incluidas bitcoin-tecnico y seguridad-avanzada.
--
-- 4. Un admin ya NO despublica al editar
--
-- BEGIN;
--   SELECT set_config('request.jwt.claims',
--          json_build_object('sub', (SELECT id::text FROM public.users WHERE role='admin' LIMIT 1),
--                            'role','authenticated')::text, true);
--   SET LOCAL ROLE authenticated;
--   UPDATE public.courses SET title = title || ' (prueba)' WHERE slug = 'fundamentos-de-bitcoin';
--   SELECT slug, status FROM public.courses WHERE slug = 'fundamentos-de-bitcoin';
--   RESET ROLE;
-- ROLLBACK;
-- QUE DEBE SALIR: status sigue en 'published'.
--
-- 5. Un instructor SI sigue disparando la revision
--
-- Mismo bloque con el id de un usuario con role = 'instructor'.
-- QUE DEBE SALIR: status = 'pending_review'. Si sale 'published', la exencion
-- se ha abierto de mas y hay que revisarla.
--
-- 6. La renuncia explicita funciona
--
-- BEGIN;
--   SELECT set_config('app.skip_republish_check', 'on', true);
--   UPDATE public.courses SET title = title || ' (prueba)' WHERE slug = 'fundamentos-de-bitcoin';
--   SELECT slug, status FROM public.courses WHERE slug = 'fundamentos-de-bitcoin';
-- ROLLBACK;
-- QUE DEBE SALIR: 'published'. Sin el set_config, y ejecutado como postgres sin
-- JWT, saldria 'pending_review'.
