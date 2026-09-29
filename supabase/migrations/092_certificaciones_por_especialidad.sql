-- ============================================================================
-- MIGRACION 092: la certificacion de instructor cambia de eje
--
-- Paso 3 de la fase A. La verificacion deja de colgar de learning_path_id y
-- pasa a colgar de instructor_specialties, el catalogo que creo la 090.
--
-- Y con el eje llegan las columnas que faltaban para que decida una PERSONA:
-- hasta ahora la certificacion la emitia sola submit/route.ts si la puntuacion
-- pasaba del umbral. Esa es la decision 3 del diseño aprobado: el examen mide,
-- el evaluador decide.
--
-- LAS DOS TABLAS QUE TENIAN EL EJE VIEJO
--     instructor_certifications.learning_path_id
--     instructor_exams.learning_path_id
--
-- Ninguna de las dos se retira en esta migracion, a proposito. Siete ficheros
-- de la aplicacion leen exam.learning_path_id, y quitarla hoy los rompe todos a
-- la vez. Se añade specialty_id al lado, se rellena, y la columna vieja queda
-- marcada con un COMMENT hasta que el codigo termine de mudarse en los pasos
-- 4 y 5. Es la misma secuencia que siguieron la 083 y la 086 con
-- users.active_path_id: primero el camino nuevo, despues retirar el viejo.
--
-- EL MAPEO DE LOS CUATRO EXAMENES
-- No se escribe a mano: se resuelve uniendo por learning_path_id contra el
-- puntero que la 090 dejo en cada especialidad. Si mañana ese puntero cambia,
-- esto no miente, simplemente no encuentra pareja y la verificacion lo dice.
--
--     instructor-exam-fundamentos-bitcoin -> bitcoin-fundamentos
--     instructor-exam-seguridad-cripto    -> seguridad-custodia
--     instructor-exam-web3-basica         -> web3
--     instructor-exam-trading-basico      -> mercados-trading
--
-- EL ESTADO
-- status era texto libre con DEFAULT 'active'. Pasa a cuatro valores con
-- restriccion: pendiente, aprobada, rechazada, retirada. La tabla tiene CERO
-- filas, asi que no hay nada que convertir —comprobado antes de escribir esto—
-- y por eso la restriccion puede nacer ya cerrada.
--
-- 'retirada' no necesita columnas nuevas: revoked_at y revoked_reason ya
-- existian desde el principio.
--
-- LONGITUDES
-- Comprobadas antes de escribir la autoprueba, que es lo que fallo en la 091:
-- certification_number, status y todas las columnas nuevas son `text`, sin
-- limite. No hay ningun character varying en esta tabla.
--
-- NO BORRA NI UNA FILA. Es reejecutable. Y se prueba a si misma.
-- ============================================================================

BEGIN;

-- =====================================================
-- 1. El eje nuevo en las certificaciones
-- =====================================================

ALTER TABLE public.instructor_certifications
  ADD COLUMN IF NOT EXISTS specialty_id uuid
    REFERENCES public.instructor_specialties(id) ON DELETE RESTRICT;

COMMENT ON COLUMN public.instructor_certifications.specialty_id IS
  'La especialidad que se certifica. Es el eje desde la 092; antes se usaba learning_path_id, que confundia un producto para el alumno con una competencia profesional.';

COMMENT ON COLUMN public.instructor_certifications.learning_path_id IS
  'EN RETIRADA. El eje es specialty_id desde la 092. Se mantiene mientras el codigo termina de mudarse (pasos 4 y 5); no escribir aqui.';

CREATE INDEX IF NOT EXISTS idx_instructor_certifications_specialty
  ON public.instructor_certifications (specialty_id);

-- =====================================================
-- 2. Quien decide, y con que pruebas
-- =====================================================

ALTER TABLE public.instructor_certifications
  ADD COLUMN IF NOT EXISTS evaluator_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS evaluator_notes text,
  ADD COLUMN IF NOT EXISTS evaluator_is_external boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS oral_result text,
  ADD COLUMN IF NOT EXISTS practical_result text,
  ADD COLUMN IF NOT EXISTS accreditation_type text,
  ADD COLUMN IF NOT EXISTS accreditation_ref text,
  ADD COLUMN IF NOT EXISTS accreditation_verified_at timestamptz;

COMMENT ON COLUMN public.instructor_certifications.evaluator_id IS
  'Quien toma la decision. Nulo mientras la certificacion esta pendiente. Hasta la 092 no habia nadie: la emitia sola submit/route.ts cuando la puntuacion pasaba del umbral.';

COMMENT ON COLUMN public.instructor_certifications.evaluator_is_external IS
  'La firma alguien de fuera de Nodo360. Solo tiene sentido en las especialidades con permite_evaluador_externo.';

COMMENT ON COLUMN public.instructor_certifications.oral_result IS
  'Resultado de las repreguntas. pendiente / apto / no_apto.';

COMMENT ON COLUMN public.instructor_certifications.practical_result IS
  'Resultado de la parte practica. pendiente / apto / no_apto.';

COMMENT ON COLUMN public.instructor_certifications.accreditation_ref IS
  'Numero de colegiacion o referencia del titulo, para las especialidades con requiere_acreditacion. Dato personal: no sale en ninguna vista publica.';

-- Las dos partes no automaticas, con vocabulario cerrado
DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'instructor_certifications_oral_result_check') THEN
    ALTER TABLE public.instructor_certifications
      ADD CONSTRAINT instructor_certifications_oral_result_check
      CHECK (oral_result IS NULL OR oral_result IN ('pendiente', 'apto', 'no_apto'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'instructor_certifications_practical_result_check') THEN
    ALTER TABLE public.instructor_certifications
      ADD CONSTRAINT instructor_certifications_practical_result_check
      CHECK (practical_result IS NULL OR practical_result IN ('pendiente', 'apto', 'no_apto'));
  END IF;
END
$do$;

-- =====================================================
-- 3. El estado, con vocabulario cerrado
-- =====================================================
-- Cero filas, asi que la restriccion nace ya cerrada sin convertir nada.

ALTER TABLE public.instructor_certifications ALTER COLUMN status SET DEFAULT 'pendiente';

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'instructor_certifications_status_check') THEN
    ALTER TABLE public.instructor_certifications
      ADD CONSTRAINT instructor_certifications_status_check
      CHECK (status IN ('pendiente', 'aprobada', 'rechazada', 'retirada'));
  END IF;
END
$do$;

COMMENT ON COLUMN public.instructor_certifications.status IS
  'pendiente / aprobada / rechazada / retirada. Antes era texto libre con DEFAULT active. «retirada» se apoya en revoked_at y revoked_reason, que ya existian.';

-- =====================================================
-- 4. El eje nuevo en los examenes
-- =====================================================
-- Los cuatro examenes y sus cuarenta modelos se conservan enteros: lo unico
-- que cambia es de que cuelgan.

ALTER TABLE public.instructor_exams
  ADD COLUMN IF NOT EXISTS specialty_id uuid
    REFERENCES public.instructor_specialties(id) ON DELETE RESTRICT;

COMMENT ON COLUMN public.instructor_exams.specialty_id IS
  'La especialidad que examina. Eje desde la 092.';

COMMENT ON COLUMN public.instructor_exams.learning_path_id IS
  'EN RETIRADA. El eje es specialty_id desde la 092. Siete ficheros de la aplicacion todavia la leen; se retira cuando terminen de mudarse.';

CREATE INDEX IF NOT EXISTS idx_instructor_exams_specialty
  ON public.instructor_exams (specialty_id);

-- El mapeo, por el puntero que dejo la 090. Nada escrito a mano.
UPDATE public.instructor_exams e
   SET specialty_id = s.id
  FROM public.instructor_specialties s
 WHERE s.learning_path_id = e.learning_path_id
   AND e.specialty_id IS DISTINCT FROM s.id;

-- =====================================================
-- 5. La prueba, dentro de la propia migracion
-- =====================================================

DO $prueba$
DECLARE
  v_usuario uuid;
  v_esp     uuid;
  v_id      uuid;
  v_sin_eje integer;
BEGIN
  SELECT id INTO v_usuario FROM public.users ORDER BY created_at LIMIT 1;
  SELECT id INTO v_esp FROM public.instructor_specialties WHERE slug = 'bitcoin-fundamentos';

  IF v_usuario IS NULL OR v_esp IS NULL THEN
    RAISE EXCEPTION 'La prueba necesita un usuario y la especialidad bitcoin-fundamentos. ¿Se aplico la 090?';
  END IF;

  -- 1. Una certificacion nace PENDIENTE, sin evaluador
  INSERT INTO public.instructor_certifications (user_id, specialty_id, certification_number)
  VALUES (v_usuario, v_esp, 'PRUEBA-092')
  RETURNING id INTO v_id;

  IF (SELECT status FROM public.instructor_certifications WHERE id = v_id) <> 'pendiente' THEN
    RAISE EXCEPTION 'PRUEBA 1 FALLIDA: una certificacion nueva no nace pendiente.';
  END IF;
  RAISE NOTICE 'PRUEBA 1  nace en «pendiente», sin evaluador                PASA';

  -- 2. El estado viejo ya no cabe
  BEGIN
    UPDATE public.instructor_certifications SET status = 'active' WHERE id = v_id;
    RAISE EXCEPTION 'PRUEBA 2 FALLIDA: se pudo escribir el estado viejo «active».';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE 'PRUEBA 2  el estado viejo «active» ya no cabe              PASA';
  END;

  -- 3. Y un resultado inventado tampoco
  BEGIN
    UPDATE public.instructor_certifications SET oral_result = 'regular' WHERE id = v_id;
    RAISE EXCEPTION 'PRUEBA 3 FALLIDA: se pudo escribir un oral_result inventado.';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE 'PRUEBA 3  oral_result solo admite su vocabulario          PASA';
  END;

  DELETE FROM public.instructor_certifications WHERE id = v_id;

  -- 4. Los cuatro examenes encontraron especialidad
  SELECT count(*) INTO v_sin_eje FROM public.instructor_exams WHERE specialty_id IS NULL;
  IF v_sin_eje > 0 THEN
    RAISE EXCEPTION
      'PRUEBA 4 FALLIDA: % examen(es) se quedaron sin especialidad. Mira el puntero learning_path_id de las especialidades de la 090.',
      v_sin_eje;
  END IF;
  RAISE NOTICE 'PRUEBA 4  los cuatro examenes tienen especialidad          PASA';

  RAISE NOTICE 'Fila de prueba borrada. Las cuatro pruebas pasan.';
END
$prueba$;

COMMIT;

-- ============================================================================
-- VERIFICACION
-- ============================================================================

SELECT
  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'instructor_certifications'
      AND column_name IN ('specialty_id','evaluator_id','evaluator_notes','evaluator_is_external',
                          'oral_result','practical_result','accreditation_type','accreditation_ref',
                          'accreditation_verified_at'))                       AS columnas_nuevas,

  (SELECT column_default FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'instructor_certifications'
      AND column_name = 'status')                                             AS estado_por_defecto,

  EXISTS (SELECT 1 FROM pg_constraint
           WHERE conname = 'instructor_certifications_status_check')           AS estado_con_restriccion,

  (SELECT count(*) FROM public.instructor_exams)                              AS examenes,
  (SELECT count(*) FROM public.instructor_exams WHERE specialty_id IS NOT NULL) AS examenes_con_especialidad,
  (SELECT count(*) FROM public.instructor_exam_models)                        AS modelos,
  (SELECT count(*) FROM public.instructor_certifications)                     AS certificaciones,
  (SELECT count(*) FROM public.instructor_certifications
    WHERE certification_number = 'PRUEBA-092')                                AS filas_de_prueba_que_quedan,

  CASE
    WHEN (SELECT count(*) FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'instructor_certifications'
             AND column_name IN ('specialty_id','evaluator_id','evaluator_notes','evaluator_is_external',
                                 'oral_result','practical_result','accreditation_type','accreditation_ref',
                                 'accreditation_verified_at')) = 9
     AND EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'instructor_certifications_status_check')
     AND (SELECT count(*) FROM public.instructor_exams WHERE specialty_id IS NULL) = 0
     AND (SELECT count(*) FROM public.instructor_exam_models) = 40
     AND (SELECT count(*) FROM public.instructor_certifications WHERE certification_number = 'PRUEBA-092') = 0
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                                          AS veredicto;
