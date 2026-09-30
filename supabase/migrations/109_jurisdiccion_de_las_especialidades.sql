-- ============================================================================
-- MIGRACION 109: la verificacion de fiscalidad y derecho es por pais
--
-- POR QUE
-- Estar verificado en Fiscalidad no significa nada sin decir de donde: la
-- normativa es de un pais. Las dos especialidades con requiere_acreditacion
-- —fiscalidad y derecho-regulacion, comprobado en la tabla— pasan a verificarse
-- por especialidad Y jurisdiccion. Las otras nueve no llevan jurisdiccion, y eso
-- tambien se hace cumplir: un dato que a veces significa una cosa y a veces otra
-- deja de ser un dato.
--
-- LA TRAMPA QUE HAY QUE CONTAR: EL INDICE UNICO
-- Hoy es (user_id, specialty_id) parcial sobre status IN ('pendiente','aprobada').
-- Tal cual, IMPIDE estar verificado en Fiscalidad·España y Fiscalidad·México a la
-- vez, que es justo lo que esta migracion viene a permitir.
--
-- Y añadir la columna sin mas tiene un efecto que no se ve: en Postgres dos NULL
-- NO colisionan, asi que (user_id, specialty_id, jurisdiccion) dejaria legales DOS
-- certificaciones aprobadas de la misma especialidad sin jurisdiccion, perdiendo
-- en silencio la garantia que hay hoy. Por eso el indice va sobre
-- coalesce(jurisdiccion, '--'), que funciona en cualquier version. La autoprueba
-- comprueba LAS DOS COSAS: que ES y MX conviven, y que dos nulos siguen chocando.
--
-- UNA TABLA DE JURISDICCIONES, NO UN CHECK CON LA LISTA DENTRO
-- El filtro del catalogo necesita el nombre para pintarlo, añadir un pais no
-- deberia exigir una migracion, y una clave ajena da integridad que una lista no
-- da. 'EU' encaja en el patron de dos letras y lleva es_bloque = true.
--
-- LO QUE NO HACE FALTA RELLENAR: la unica certificacion que existe es de
-- ethereum-contratos, asi que nace con jurisdiccion nula y es correcto.
--
-- NO BORRA NI UNA FILA. Es reejecutable. Y se prueba a si misma.
-- ============================================================================

BEGIN;

-- =====================================================
-- 1. El catalogo de jurisdicciones
-- =====================================================

CREATE TABLE IF NOT EXISTS public.jurisdicciones (
  codigo     text PRIMARY KEY CHECK (codigo ~ '^[A-Z]{2}$'),
  nombre     text NOT NULL,
  es_bloque  boolean NOT NULL DEFAULT false,
  is_active  boolean NOT NULL DEFAULT true,
  position   integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.jurisdicciones IS
  'Los ambitos normativos que la plataforma reconoce: paises por su codigo ISO 3166-1 alpha-2, mas EU para la normativa europea. Es una tabla y no un CHECK porque el catalogo publico necesita el nombre para pintarlo y porque añadir un pais no deberia exigir una migracion.';
COMMENT ON COLUMN public.jurisdicciones.es_bloque IS
  'true si no es un pais sino un ambito supranacional (hoy solo EU).';

INSERT INTO public.jurisdicciones (codigo, nombre, es_bloque, position) VALUES
  ('EU', 'Unión Europea', true,  0),
  ('ES', 'España',        false, 1),
  ('MX', 'México',        false, 2),
  ('AR', 'Argentina',     false, 3),
  ('CO', 'Colombia',      false, 4),
  ('CL', 'Chile',         false, 5),
  ('PE', 'Perú',          false, 6),
  ('UY', 'Uruguay',       false, 7)
ON CONFLICT (codigo) DO NOTHING;

-- Publica: el filtro del catalogo la lee sin sesion.
ALTER TABLE public.jurisdicciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS jurisdicciones_lectura_publica ON public.jurisdicciones;
CREATE POLICY jurisdicciones_lectura_publica
  ON public.jurisdicciones FOR SELECT
  TO anon, authenticated
  USING (is_active);

GRANT SELECT ON public.jurisdicciones TO anon, authenticated;

-- =====================================================
-- 2. La jurisdiccion de una verificacion
-- =====================================================

ALTER TABLE public.instructor_certifications
  ADD COLUMN IF NOT EXISTS jurisdiccion text REFERENCES public.jurisdicciones(codigo);

COMMENT ON COLUMN public.instructor_certifications.jurisdiccion IS
  'El ambito normativo de esta verificacion. OBLIGATORIA en las especialidades con requiere_acreditacion (fiscalidad, derecho-regulacion) y NULA en el resto: lo hace cumplir el trigger trg_jurisdiccion_donde_toca, porque la regla depende de otra tabla y un CHECK no puede mirarla.';

CREATE OR REPLACE FUNCTION public.jurisdiccion_donde_toca()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_exige boolean;
  v_nombre text;
BEGIN
  SELECT e.requiere_acreditacion, e.nombre
    INTO v_exige, v_nombre
    FROM public.instructor_specialties e
   WHERE e.id = NEW.specialty_id;

  IF v_exige IS NULL THEN
    RETURN NEW;  -- sin especialidad no hay regla que aplicar
  END IF;

  IF v_exige AND NEW.jurisdiccion IS NULL THEN
    RAISE EXCEPTION
      '«%» se verifica por pais: hace falta la jurisdiccion (por ejemplo ES, MX o EU).', v_nombre
      USING ERRCODE = '23502';
  END IF;

  -- Y al contrario, que es la mitad que se olvida: si la especialidad no va por
  -- pais, una jurisdiccion ahi no significaria nada.
  IF NOT v_exige AND NEW.jurisdiccion IS NOT NULL THEN
    RAISE EXCEPTION
      '«%» no se verifica por pais: la jurisdiccion tiene que quedar vacia.', v_nombre
      USING ERRCODE = '22023';
  END IF;

  RETURN NEW;
END
$fn$;

COMMENT ON FUNCTION public.jurisdiccion_donde_toca() IS
  'Exige jurisdiccion en las especialidades con requiere_acreditacion y la prohibe en las demas. Corta en los dos sentidos a proposito: si sobrara en unas filas y faltara en otras, la columna significaria cosas distintas segun la fila.';

REVOKE ALL ON FUNCTION public.jurisdiccion_donde_toca() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_jurisdiccion_donde_toca ON public.instructor_certifications;
CREATE TRIGGER trg_jurisdiccion_donde_toca
  BEFORE INSERT OR UPDATE OF specialty_id, jurisdiccion ON public.instructor_certifications
  FOR EACH ROW
  EXECUTE FUNCTION public.jurisdiccion_donde_toca();

-- =====================================================
-- 3. El indice unico, con la jurisdiccion y sin la trampa de los NULL
-- =====================================================

DROP INDEX IF EXISTS public.uq_certificacion_viva_por_especialidad;
DROP INDEX IF EXISTS public.uq_certificacion_viva_por_especialidad_y_jurisdiccion;

CREATE UNIQUE INDEX uq_certificacion_viva_por_especialidad_y_jurisdiccion
  ON public.instructor_certifications (user_id, specialty_id, coalesce(jurisdiccion, '--'))
  WHERE status IN ('pendiente', 'aprobada');

COMMENT ON INDEX public.uq_certificacion_viva_por_especialidad_y_jurisdiccion IS
  'Una sola certificacion viva por persona, especialidad y jurisdiccion. El coalesce no es un adorno: sin el, dos NULL no colisionarian y se podrian tener DOS certificaciones aprobadas de la misma especialidad sin jurisdiccion, que es lo que el indice anterior si impedia. Parcial para que quien fue rechazado o retirado pueda volver a solicitarla.';

-- =====================================================
-- 4. La jurisdiccion de un curso
-- =====================================================

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS jurisdiccion text REFERENCES public.jurisdicciones(codigo);

COMMENT ON COLUMN public.courses.jurisdiccion IS
  'El pais cuya normativa explica el curso. Obligatoria AL ENVIAR A REVISION en las especialidades con requiere_acreditacion, no al crear el borrador: escribir un borrador incompleto es legitimo, pedir que se publique no. Lo hace cumplir el trigger de publicacion.';

-- =====================================================
-- 5. puede_ensenar, ahora con jurisdiccion
-- =====================================================

-- FUERA LA VERSION DE UN ARGUMENTO, Y NO ES LIMPIEZA: es correccion.
--
-- CREATE OR REPLACE con una firma nueva no reemplaza la vieja, crea una
-- SOBRECARGA. Con puede_ensenar(uuid) y puede_ensenar(uuid, text DEFAULT NULL)
-- vivas a la vez, una llamada de un solo argumento —la que hace hoy
-- submit-review/route.ts— seria AMBIGUA y Postgres la rechazaria con «function
-- puede_ensenar(uuid) is not unique». El trigger de publicacion se quedaria sin
-- su puerta y la ruta devolveria un 500.
DROP FUNCTION IF EXISTS public.puede_ensenar(uuid);

CREATE OR REPLACE FUNCTION public.puede_ensenar(
  p_specialty_id uuid,
  p_jurisdiccion text DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    p_specialty_id IS NOT NULL
    AND (
      public.es_admin_actual()
      OR EXISTS (
        SELECT 1
          FROM public.instructor_certifications c
          JOIN public.instructor_specialties e ON e.id = c.specialty_id
         WHERE c.user_id = auth.uid()
           AND c.specialty_id = p_specialty_id
           AND c.status = 'aprobada'
           AND c.revoked_at IS NULL
           AND (c.expires_at IS NULL OR c.expires_at > now())
           AND (
             -- Si la especialidad no va por pais, la jurisdiccion no pinta nada.
             NOT e.requiere_acreditacion
             -- Y si va, tiene que coincidir. Sin jurisdiccion pedida -> falso:
             -- nadie esta verificado «en todas partes».
             OR (p_jurisdiccion IS NOT NULL AND c.jurisdiccion = p_jurisdiccion)
           )
      )
    );
$$;

COMMENT ON FUNCTION public.puede_ensenar(uuid, text) IS
  'Cierto si la sesion actual puede enseñar esa especialidad, y en esa jurisdiccion cuando la especialidad se verifica por pais. Si la especialidad exige acreditacion y no se pasa jurisdiccion, devuelve FALSO: nadie esta verificado en todas partes. El segundo argumento tiene valor por defecto para no romper las llamadas de un solo argumento.';

REVOKE ALL ON FUNCTION public.puede_ensenar(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.puede_ensenar(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.puede_ensenar(uuid, text) TO authenticated, service_role;

-- =====================================================
-- 6. El trigger de publicacion exige la jurisdiccion del curso
-- =====================================================
-- Se reescribe entero el de la 098, que es donde vive la regla, y se le añade la
-- puerta de la jurisdiccion. Lo demas queda igual, incluidos los ::text que la
-- 089 tuvo que arreglar porque status es un enum.

CREATE OR REPLACE FUNCTION public.controlar_publicacion_de_cursos()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  SOLO_ADMIN constant text[] := ARRAY['published', 'rejected'];
  v_especialidad text;
  v_exige        boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF public.es_admin_actual() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status::text IS DISTINCT FROM 'draft' THEN
      RAISE EXCEPTION
        'Un curso nuevo solo puede nacer en borrador; se intento "%". Publicar o rechazar lo decide la administracion.',
        NEW.status
        USING ERRCODE = '42501';
    END IF;

    IF NEW.review_status IS DISTINCT FROM 'none' THEN
      RAISE EXCEPTION
        'Un curso nuevo nace sin revisar; se intento review_status="%".',
        NEW.review_status
        USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
  END IF;

  IF NEW.status::text IS DISTINCT FROM OLD.status::text THEN
    IF NEW.status::text = ANY (SOLO_ADMIN) THEN
      RAISE EXCEPTION
        'Solo la administracion puede dejar un curso en "%". Para pedir la publicacion, enviar a revision.',
        NEW.status
        USING ERRCODE = '42501';
    END IF;

    IF OLD.status::text = 'pending_review' AND NEW.status::text <> 'draft' THEN
      RAISE EXCEPTION
        'El curso esta pendiente de revision: desde ahi solo puede volver a borrador.'
        USING ERRCODE = '42501';
    END IF;

    IF NEW.status::text = 'pending_review' THEN
      IF NEW.specialty_id IS NULL THEN
        RAISE EXCEPTION
          'Este curso no tiene especialidad asignada: clasificalo antes de enviarlo a revision.'
          USING ERRCODE = '42501';
      END IF;

      SELECT e.nombre, e.requiere_acreditacion
        INTO v_especialidad, v_exige
        FROM public.instructor_specialties e
       WHERE e.id = NEW.specialty_id;

      -- LA PUERTA NUEVA: si la especialidad va por pais, el curso tiene que decir
      -- a que pais aplica. No al crear el borrador: aqui, al pedir que se publique.
      IF v_exige AND NEW.jurisdiccion IS NULL THEN
        RAISE EXCEPTION
          '«%» explica normativa de un pais: indica la jurisdiccion del curso antes de enviarlo a revision.',
          v_especialidad
          USING ERRCODE = '42501';
      END IF;

      IF NOT public.puede_ensenar(NEW.specialty_id, NEW.jurisdiccion) THEN
        RAISE EXCEPTION
          'No estas verificado para enseñar «%»%. Pide la verificacion antes de enviar un curso de esta especialidad a revision.',
          coalesce(v_especialidad, 'esa especialidad'),
          CASE WHEN v_exige AND NEW.jurisdiccion IS NOT NULL
               THEN ' en ' || NEW.jurisdiccion ELSE '' END
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END
$fn$;

-- =====================================================
-- 7. El sello dice tambien la jurisdiccion
-- =====================================================

DROP VIEW IF EXISTS public.sellos_de_instructor;

CREATE VIEW public.sellos_de_instructor AS
  SELECT
    c.user_id,
    c.certification_number,
    e.slug        AS especialidad_slug,
    e.nombre      AS especialidad,
    c.jurisdiccion,
    j.nombre      AS jurisdiccion_nombre,
    c.issued_at,
    c.expires_at,
    (c.expires_at IS NULL OR c.expires_at > now()) AS vigente
  FROM public.instructor_certifications c
  JOIN public.instructor_specialties e ON e.id = c.specialty_id
  LEFT JOIN public.jurisdicciones j ON j.codigo = c.jurisdiccion
 WHERE c.status = 'aprobada'
   AND c.revoked_at IS NULL;

COMMENT ON VIEW public.sellos_de_instructor IS
  'Lo unico publico de una verificacion: quien, en que especialidad, en que jurisdiccion si la tiene, desde cuando y hasta cuando. Sin el numero de colegiacion, sin las notas del evaluador y sin quien evaluo. Solo las aprobadas y no retiradas.';

GRANT SELECT ON public.sellos_de_instructor TO anon, authenticated;

-- =====================================================
-- 8. La prueba
-- =====================================================

DO $prueba$
DECLARE
  v_fiscalidad uuid;
  v_ethereum   uuid;
  v_persona    uuid;
  v_cert       uuid;
  v_n          integer;
  v_sello      text;
BEGIN
  SELECT id INTO v_fiscalidad FROM public.instructor_specialties WHERE slug = 'fiscalidad';
  SELECT id INTO v_ethereum   FROM public.instructor_specialties WHERE slug = 'ethereum-contratos';
  SELECT id INTO v_persona    FROM public.users WHERE role = 'student' ORDER BY created_at LIMIT 1;

  IF v_fiscalidad IS NULL OR v_ethereum IS NULL OR v_persona IS NULL THEN
    RAISE EXCEPTION 'La prueba necesita fiscalidad, ethereum-contratos y un estudiante. fis=% eth=% persona=%',
      v_fiscalidad, v_ethereum, v_persona;
  END IF;

  -- 1. El catalogo
  SELECT count(*) INTO v_n FROM public.jurisdicciones;
  IF v_n < 8 THEN
    RAISE EXCEPTION 'PRUEBA 1 FALLIDA: el catalogo tiene % jurisdicciones, esperaba 8 o mas.', v_n;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.jurisdicciones WHERE codigo = 'EU' AND es_bloque) THEN
    RAISE EXCEPTION 'PRUEBA 1 FALLIDA: EU no esta marcada como bloque.';
  END IF;
  RAISE NOTICE 'PRUEBA 1  el catalogo tiene % jurisdicciones y EU es bloque      PASA', v_n;

  -- 2. Fiscalidad SIN jurisdiccion: rechazada
  BEGIN
    INSERT INTO public.instructor_certifications
      (user_id, specialty_id, certification_number, status, oral_result, practical_result)
    VALUES (v_persona, v_fiscalidad, 'PRUEBA-109-A', 'pendiente', 'pendiente', 'pendiente');
    RAISE EXCEPTION 'PRUEBA 2 FALLIDA: se creo una verificacion de fiscalidad sin jurisdiccion.';
  EXCEPTION WHEN not_null_violation THEN
    RAISE NOTICE 'PRUEBA 2  fiscalidad sin jurisdiccion se rechaza                PASA';
  END;

  -- 3. Ethereum CON jurisdiccion: tambien rechazada
  BEGIN
    INSERT INTO public.instructor_certifications
      (user_id, specialty_id, certification_number, status, oral_result, practical_result, jurisdiccion)
    VALUES (v_persona, v_ethereum, 'PRUEBA-109-B', 'pendiente', 'pendiente', 'pendiente', 'ES');
    RAISE EXCEPTION 'PRUEBA 3 FALLIDA: se creo una verificacion de ethereum CON jurisdiccion.';
  -- 22023 es invalid_parameter_value. wrong_object_type es 42809: si se caza ese,
  -- la excepcion del trigger no la recoge nadie y la prueba miente al fallar.
  EXCEPTION WHEN invalid_parameter_value THEN
    RAISE NOTICE 'PRUEBA 3  ethereum con jurisdiccion se rechaza                  PASA';
  END;

  -- 4. Fiscalidad en ES y en MX a la vez: PERMITIDO (es el objetivo de todo esto)
  INSERT INTO public.instructor_certifications
    (user_id, specialty_id, certification_number, status, oral_result, practical_result, jurisdiccion)
  VALUES (v_persona, v_fiscalidad, 'PRUEBA-109-ES', 'aprobada', 'apto', 'apto', 'ES')
  RETURNING id INTO v_cert;

  INSERT INTO public.instructor_certifications
    (user_id, specialty_id, certification_number, status, oral_result, practical_result, jurisdiccion)
  VALUES (v_persona, v_fiscalidad, 'PRUEBA-109-MX', 'aprobada', 'apto', 'apto', 'MX');

  RAISE NOTICE 'PRUEBA 4  Fiscalidad·ES y Fiscalidad·MX conviven                PASA';

  -- 5. Pero dos de ES: rechazado por el indice
  BEGIN
    INSERT INTO public.instructor_certifications
      (user_id, specialty_id, certification_number, status, oral_result, practical_result, jurisdiccion)
    VALUES (v_persona, v_fiscalidad, 'PRUEBA-109-ES2', 'aprobada', 'apto', 'apto', 'ES');
    RAISE EXCEPTION 'PRUEBA 5 FALLIDA: se colaron dos verificaciones vivas de Fiscalidad·ES.';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'PRUEBA 5  dos vivas de Fiscalidad·ES se rechazan                PASA';
  END;

  -- 6. Y DOS NULOS SIGUEN CHOCANDO, que es lo que el coalesce protege
  INSERT INTO public.instructor_certifications
    (user_id, specialty_id, certification_number, status, oral_result, practical_result)
  VALUES (v_persona, v_ethereum, 'PRUEBA-109-N1', 'aprobada', 'apto', 'apto');

  BEGIN
    INSERT INTO public.instructor_certifications
      (user_id, specialty_id, certification_number, status, oral_result, practical_result)
    VALUES (v_persona, v_ethereum, 'PRUEBA-109-N2', 'aprobada', 'apto', 'apto');
    RAISE EXCEPTION 'PRUEBA 6 FALLIDA: dos certificaciones sin jurisdiccion no chocaron. El coalesce no esta haciendo su trabajo.';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'PRUEBA 6  dos sin jurisdiccion siguen chocando                 PASA';
  END;

  -- 7. El sello dice la jurisdiccion
  SELECT especialidad || CASE WHEN jurisdiccion_nombre IS NOT NULL
                              THEN ' · ' || jurisdiccion_nombre ELSE '' END
    INTO v_sello
    FROM public.sellos_de_instructor
   WHERE certification_number = 'PRUEBA-109-ES';

  IF v_sello IS DISTINCT FROM 'Fiscalidad · España' THEN
    RAISE EXCEPTION 'PRUEBA 7 FALLIDA: el sello dice «%», esperaba «Fiscalidad · España».', coalesce(v_sello, 'NULL');
  END IF;
  RAISE NOTICE 'PRUEBA 7  el sello dice «Fiscalidad · España»                   PASA';

  -- 8. puede_ensenar: si a ES, no a MX cuando solo esta verificado en ES
  PERFORM set_config('request.jwt.claims',
                     json_build_object('sub', v_persona::text, 'role', 'authenticated')::text, true);

  DELETE FROM public.instructor_certifications WHERE certification_number = 'PRUEBA-109-MX';

  IF NOT public.puede_ensenar(v_fiscalidad, 'ES') THEN
    RAISE EXCEPTION 'PRUEBA 8 FALLIDA: verificado en Fiscalidad·ES y puede_ensenar dice que no.';
  END IF;
  IF public.puede_ensenar(v_fiscalidad, 'MX') THEN
    RAISE EXCEPTION 'PRUEBA 8 FALLIDA: puede_ensenar dice si a Fiscalidad·MX sin estar verificado ahi.';
  END IF;
  IF public.puede_ensenar(v_fiscalidad) THEN
    RAISE EXCEPTION 'PRUEBA 8 FALLIDA: puede_ensenar dice si a Fiscalidad sin jurisdiccion. Nadie esta verificado en todas partes.';
  END IF;
  IF NOT public.puede_ensenar(v_ethereum) THEN
    RAISE EXCEPTION 'PRUEBA 8 FALLIDA: en una especialidad sin pais, puede_ensenar deberia bastar con la especialidad.';
  END IF;
  RAISE NOTICE 'PRUEBA 8  puede_ensenar distingue ES de MX y exige jurisdiccion  PASA';

  PERFORM set_config('request.jwt.claims', '', true);

  -- 9. Limpieza: no queda ni una fila de prueba
  DELETE FROM public.instructor_certifications
   WHERE certification_number LIKE 'PRUEBA-109-%';

  SELECT count(*) INTO v_n FROM public.instructor_certifications
   WHERE certification_number LIKE 'PRUEBA-109-%';
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'PRUEBA 9 FALLIDA: quedan % filas de prueba.', v_n;
  END IF;
  RAISE NOTICE 'PRUEBA 9  no queda ninguna fila de prueba                       PASA';

  RAISE NOTICE 'Las nueve pruebas pasan.';
END
$prueba$;

COMMIT;

-- ============================================================================
-- VERIFICACION
-- ============================================================================

SELECT
  (SELECT count(*) FROM public.jurisdicciones)                                    AS jurisdicciones,
  (SELECT count(*) FROM public.jurisdicciones WHERE es_bloque)                     AS bloques,

  EXISTS (SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'instructor_certifications'
             AND column_name = 'jurisdiccion')                                    AS cert_tiene_jurisdiccion,
  EXISTS (SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'courses'
             AND column_name = 'jurisdiccion')                                    AS curso_tiene_jurisdiccion,

  EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_jurisdiccion_donde_toca'
            AND tgrelid = 'public.instructor_certifications'::regclass)            AS trigger_de_jurisdiccion,

  -- El indice, localizado por DEFINICION y no por nombre
  (SELECT count(*) FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'instructor_certifications'
      AND indexdef ILIKE '%coalesce%jurisdiccion%')                               AS indice_con_coalesce,
  (SELECT count(*) FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'uq_certificacion_viva_por_especialidad') AS indice_viejo_sigue,

  -- Tiene que ser 1. Si sale 2, quedo la sobrecarga vieja y la llamada de un
  -- argumento sera ambigua.
  (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'puede_ensenar')                    AS versiones_de_puede_ensenar,
  EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public'
            AND viewname = 'sellos_de_instructor'
            AND definition ILIKE '%jurisdiccion%')                                AS sello_con_jurisdiccion,

  (SELECT count(*) FROM public.instructor_certifications)                          AS certificaciones,
  (SELECT count(*) FROM public.instructor_certifications WHERE jurisdiccion IS NOT NULL) AS con_jurisdiccion,
  (SELECT count(*) FROM public.instructor_certifications
    WHERE certification_number LIKE 'PRUEBA-109-%')                               AS filas_de_prueba_que_quedan,

  CASE
    WHEN (SELECT count(*) FROM public.jurisdicciones) >= 8
     AND EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public' AND table_name = 'instructor_certifications'
                    AND column_name = 'jurisdiccion')
     AND EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public' AND table_name = 'courses'
                    AND column_name = 'jurisdiccion')
     AND EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_jurisdiccion_donde_toca'
                   AND tgrelid = 'public.instructor_certifications'::regclass)
     AND (SELECT count(*) FROM pg_indexes
           WHERE schemaname = 'public' AND tablename = 'instructor_certifications'
             AND indexdef ILIKE '%coalesce%jurisdiccion%') = 1
     AND (SELECT count(*) FROM pg_indexes
           WHERE schemaname = 'public' AND indexname = 'uq_certificacion_viva_por_especialidad') = 0
     AND EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public'
                   AND viewname = 'sellos_de_instructor'
                   AND definition ILIKE '%jurisdiccion%')
     AND (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public' AND p.proname = 'puede_ensenar') = 1
     AND (SELECT count(*) FROM public.instructor_certifications
           WHERE certification_number LIKE 'PRUEBA-109-%') = 0
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                                             AS veredicto;
