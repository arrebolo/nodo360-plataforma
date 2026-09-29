-- ============================================================================
-- MIGRACION 092: la certificacion de instructor cambia de eje
--
-- Paso 3 de la fase A. La verificacion deja de colgar de learning_path_id y
-- pasa a colgar de instructor_specialties, el catalogo que creo la 090. Y con
-- el eje llegan las columnas para que decida una PERSONA: hasta ahora la emitia
-- sola submit/route.ts si la puntuacion pasaba del umbral.
--
-- TRES INTENTOS FALLIDOS, Y LO QUE ENSEÑARON
-- Ninguno aplico nada: todo va dentro de BEGIN/COMMIT y las tres veces se
-- deshizo entero, comprobado despues en la base.
--
--   1. 23502 null value in column exam_id
--      Habia mirado las longitudes pero no las NOT NULL. Y no era una columna:
--      eran cinco, porque la tabla se diseño para un unico camino —aprobar un
--      examen de una ruta— y el eje nuevo tiene mas de uno.
--
--   2. 23514 violates check constraint instructor_certifications_status_check
--      La CHECK vieja (active, expired, revoked, renewal_pending) seguia ahi.
--      El bloque decia IF NOT EXISTS (... conname = 'instructor_certifications
--      _status_check'), que es EXACTAMENTE el nombre que Postgres genera solo,
--      asi que la encontro y se salto la creacion. Peor: la verificacion
--      comprobaba ese mismo nombre, de modo que habria dicho TODO CORRECTO con
--      la restriccion antigua puesta.
--
--   3. Al listar de verdad TODAS las restricciones aparecieron tres cosas mas
--      que ningun error habria destapado hasta tener datos:
--        · UNIQUE (user_id, learning_path_id), que con learning_path_id a NULL
--          deja de proteger nada, porque en PostgreSQL dos NULL no colisionan,
--          y no tiene equivalente por especialidad
--        · exam_id, attempt_id y learning_path_id con ON DELETE CASCADE:
--          borrar un examen, un intento o una ruta se llevaba por delante
--          certificaciones aprobadas y los sellos publicos de sus instructores
--        · instructor_exams.learning_path_id NOT NULL, que impedia que una
--          especialidad sin ruta tuviera examen
--
-- DE AHI EL METODO DE ESTA VERSION
-- Las restricciones se localizan por su DEFINICION, recorriendo pg_constraint,
-- nunca por un nombre escrito aqui: los nombres los pone Postgres y no se
-- pueden suponer. Y la verificacion final compara definiciones, no nombres.
--
-- LA UNICIDAD CORRECTA
-- Un indice unico PARCIAL sobre (user_id, specialty_id) limitado a los estados
-- vivos, pendiente y aprobada. Quien fue rechazado o retirado puede volver a
-- solicitar la verificacion, y con una UNIQUE normal no podria. Consecuencia
-- buscada: no se puede tener a la vez una solicitud pendiente y una aprobada de
-- la misma especialidad; la renovacion se hace sobre la fila que ya existe, que
-- es para lo que estan renewed_at y expires_at.
--
-- Para que ese indice proteja de verdad, specialty_id pasa a NOT NULL: si se
-- pudiera dejar a NULL, la unicidad se esquivaria sin querer, que es justo el
-- fallo de la UNIQUE que sustituye. Cero filas, nada que rellenar.
--
-- LO QUE SE DEJA COMO ESTA
-- instructor_exam_models tiene CHECK (model_number BETWEEN 1 AND 10). No se
-- toca: queda anotado para el rediseño de la rotacion del banco, que es su
-- propia tarea. Y user_id sigue con ON DELETE CASCADE, que es lo correcto: si
-- se borra la cuenta, sus certificaciones se van con ella.
--
-- NO BORRA NI UNA FILA. Es reejecutable. Y se prueba a si misma.
-- ============================================================================

BEGIN;

-- =====================================================
-- 1. El eje nuevo, y quien decide
-- =====================================================

ALTER TABLE public.instructor_certifications
  ADD COLUMN IF NOT EXISTS specialty_id uuid
    REFERENCES public.instructor_specialties(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS evaluator_id uuid
    REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS evaluator_notes text,
  ADD COLUMN IF NOT EXISTS evaluator_is_external boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS oral_result text,
  ADD COLUMN IF NOT EXISTS practical_result text,
  ADD COLUMN IF NOT EXISTS accreditation_type text,
  ADD COLUMN IF NOT EXISTS accreditation_ref text,
  ADD COLUMN IF NOT EXISTS accreditation_verified_at timestamptz;

COMMENT ON COLUMN public.instructor_certifications.specialty_id IS
  'La especialidad que se certifica. Es el eje desde la 092; antes se usaba learning_path_id, que confundia un producto para el alumno con una competencia profesional.';
COMMENT ON COLUMN public.instructor_certifications.evaluator_id IS
  'Quien toma la decision. Nulo mientras esta pendiente. Hasta la 092 no habia nadie: la emitia sola submit/route.ts cuando la puntuacion pasaba del umbral.';
COMMENT ON COLUMN public.instructor_certifications.evaluator_is_external IS
  'La firma alguien de fuera de Nodo360. Solo tiene sentido en las especialidades con permite_evaluador_externo.';
COMMENT ON COLUMN public.instructor_certifications.oral_result IS
  'Resultado de las repreguntas. pendiente / apto / no_apto.';
COMMENT ON COLUMN public.instructor_certifications.practical_result IS
  'Resultado de la parte practica. pendiente / apto / no_apto.';
COMMENT ON COLUMN public.instructor_certifications.accreditation_ref IS
  'Numero de colegiacion o referencia del titulo, para las especialidades con requiere_acreditacion. Dato personal: no sale en ninguna vista publica.';
COMMENT ON COLUMN public.instructor_certifications.learning_path_id IS
  'EN RETIRADA. El eje es specialty_id desde la 092. Se mantiene mientras el codigo termina de mudarse (pasos 4 y 5); no escribir aqui.';

CREATE INDEX IF NOT EXISTS idx_instructor_certifications_specialty
  ON public.instructor_certifications (specialty_id);

-- =====================================================
-- 2. Lo que el eje nuevo hace opcional, y lo que hace obligatorio
-- =====================================================
-- Quitar un NOT NULL no toca ni una fila. Lo que se gana es poder representar
-- una verificacion que no venga de aprobar un examen.

ALTER TABLE public.instructor_certifications ALTER COLUMN exam_id          DROP NOT NULL;
ALTER TABLE public.instructor_certifications ALTER COLUMN learning_path_id DROP NOT NULL;
ALTER TABLE public.instructor_certifications ALTER COLUMN attempt_id       DROP NOT NULL;
ALTER TABLE public.instructor_certifications ALTER COLUMN expires_at       DROP NOT NULL;
ALTER TABLE public.instructor_certifications ALTER COLUMN issued_at        DROP NOT NULL;
ALTER TABLE public.instructor_certifications ALTER COLUMN issued_at        DROP DEFAULT;

COMMENT ON COLUMN public.instructor_certifications.exam_id IS
  'Nulo si la especialidad no tiene examen, o si la verificacion se apoya en la acreditacion y la entrevista, como en fiscalidad y derecho. Era NOT NULL: la tabla suponia que toda certificacion venia de aprobar un examen.';
COMMENT ON COLUMN public.instructor_certifications.attempt_id IS
  'El intento que la respalda, si lo hubo. Nulo cuando no hay examen.';
COMMENT ON COLUMN public.instructor_certifications.issued_at IS
  'Cuando se emitio. Nulo mientras esta pendiente; lo pone quien aprueba. Se le quito el DEFAULT now() en la 092: con el, una fila pendiente afirmaba una fecha de emision que no existia.';
COMMENT ON COLUMN public.instructor_certifications.expires_at IS
  'Nulo mientras esta pendiente. La fija quien aprueba, a partir de certification_validity_years del examen o del criterio del evaluador.';

-- specialty_id, al contrario: obligatoria. Sin ella el indice unico parcial no
-- protegeria nada, que es exactamente el fallo de la UNIQUE que sustituye.
ALTER TABLE public.instructor_certifications ALTER COLUMN specialty_id SET NOT NULL;

-- =====================================================
-- 3. Las CHECK: se retiran por DEFINICION, no por nombre
-- =====================================================

DO $do$
DECLARE
  c record;
BEGIN
  -- Toda CHECK de esta tabla que hable de status. La vieja admitia
  -- active / expired / revoked / renewal_pending y se llamaba exactamente igual
  -- que la que esta migracion quiere crear.
  FOR c IN
    SELECT con.conname, pg_get_constraintdef(con.oid) AS def
      FROM pg_constraint con
     WHERE con.conrelid = 'public.instructor_certifications'::regclass
       AND con.contype = 'c'
       AND pg_get_constraintdef(con.oid) ILIKE '%status%'
  LOOP
    RAISE NOTICE 'Retirando CHECK de status: %  ->  %', c.conname, c.def;
    EXECUTE format('ALTER TABLE public.instructor_certifications DROP CONSTRAINT %I', c.conname);
  END LOOP;

  -- Y las de los resultados, por si una ejecucion anterior las dejo a medias
  FOR c IN
    SELECT con.conname
      FROM pg_constraint con
     WHERE con.conrelid = 'public.instructor_certifications'::regclass
       AND con.contype = 'c'
       AND (pg_get_constraintdef(con.oid) ILIKE '%oral_result%'
         OR pg_get_constraintdef(con.oid) ILIKE '%practical_result%')
  LOOP
    EXECUTE format('ALTER TABLE public.instructor_certifications DROP CONSTRAINT %I', c.conname);
  END LOOP;
END
$do$;

ALTER TABLE public.instructor_certifications ALTER COLUMN status SET DEFAULT 'pendiente';

ALTER TABLE public.instructor_certifications
  ADD CONSTRAINT instructor_certifications_status_check
  CHECK (status IN ('pendiente', 'aprobada', 'rechazada', 'retirada'));

ALTER TABLE public.instructor_certifications
  ADD CONSTRAINT instructor_certifications_oral_result_check
  CHECK (oral_result IS NULL OR oral_result IN ('pendiente', 'apto', 'no_apto'));

ALTER TABLE public.instructor_certifications
  ADD CONSTRAINT instructor_certifications_practical_result_check
  CHECK (practical_result IS NULL OR practical_result IN ('pendiente', 'apto', 'no_apto'));

COMMENT ON COLUMN public.instructor_certifications.status IS
  'pendiente / aprobada / rechazada / retirada. Antes admitia active / expired / revoked / renewal_pending. «retirada» se apoya en revoked_at y revoked_reason, que ya existian.';

-- =====================================================
-- 4. La unicidad, por especialidad y solo entre los estados vivos
-- =====================================================

DO $do$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT con.conname, pg_get_constraintdef(con.oid) AS def
      FROM pg_constraint con
     WHERE con.conrelid = 'public.instructor_certifications'::regclass
       AND con.contype = 'u'
       AND pg_get_constraintdef(con.oid) ILIKE '%learning_path_id%'
  LOOP
    RAISE NOTICE 'Retirando UNIQUE del eje viejo: %  ->  %', c.conname, c.def;
    EXECUTE format('ALTER TABLE public.instructor_certifications DROP CONSTRAINT %I', c.conname);
  END LOOP;
END
$do$;

-- Parcial, y por eso un indice y no una restriccion: una UNIQUE no admite WHERE.
DROP INDEX IF EXISTS public.uq_certificacion_viva_por_especialidad;

CREATE UNIQUE INDEX uq_certificacion_viva_por_especialidad
  ON public.instructor_certifications (user_id, specialty_id)
  WHERE status IN ('pendiente', 'aprobada');

COMMENT ON INDEX public.uq_certificacion_viva_por_especialidad IS
  'Una sola certificacion viva por persona y especialidad. Parcial a proposito: quien fue rechazado o retirado puede volver a solicitarla, y con una UNIQUE normal no podria. Sustituye a la UNIQUE (user_id, learning_path_id), que con el eje nuevo no protegia nada porque dos NULL no colisionan.';

-- =====================================================
-- 5. Las claves ajenas dejan de arrastrar certificaciones
-- =====================================================
-- exam_id, attempt_id y learning_path_id estaban en ON DELETE CASCADE: borrar
-- un examen, un intento o una ruta se llevaba por delante certificaciones
-- aprobadas, y con ellas el sello publico de esa persona. Ahora que las tres
-- admiten NULL, lo correcto es SET NULL: se pierde la referencia, no el hecho
-- de que alguien esta verificado.

DO $do$
DECLARE
  c record;
  v record;
BEGIN
  FOR v IN
    SELECT * FROM (VALUES
      ('exam_id',          'public.instructor_exams',          'fk_certificacion_examen'),
      ('attempt_id',       'public.instructor_exam_attempts',  'fk_certificacion_intento'),
      ('learning_path_id', 'public.learning_paths',            'fk_certificacion_ruta')
    ) AS t(columna, destino, nombre_nuevo)
  LOOP
    -- Se localiza por la columna que lleva, no por el nombre
    FOR c IN
      SELECT con.conname, pg_get_constraintdef(con.oid) AS def
        FROM pg_constraint con
       WHERE con.conrelid = 'public.instructor_certifications'::regclass
         AND con.contype = 'f'
         AND pg_get_constraintdef(con.oid) ILIKE '%(' || v.columna || ')%'
    LOOP
      RAISE NOTICE 'Rehaciendo clave ajena de %: %  ->  %', v.columna, c.conname, c.def;
      EXECUTE format('ALTER TABLE public.instructor_certifications DROP CONSTRAINT %I', c.conname);
    END LOOP;

    EXECUTE format(
      'ALTER TABLE public.instructor_certifications ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %s(id) ON DELETE SET NULL',
      v.nombre_nuevo, v.columna, v.destino);
  END LOOP;
END
$do$;

-- =====================================================
-- 6. Los examenes: eje nuevo, y ruta opcional
-- =====================================================

ALTER TABLE public.instructor_exams
  ADD COLUMN IF NOT EXISTS specialty_id uuid
    REFERENCES public.instructor_specialties(id) ON DELETE RESTRICT;

-- Una especialidad sin ruta —lightning, defi, fiscalidad, derecho-regulacion,
-- blockchain-consenso— no podia tener examen con esto en NOT NULL.
ALTER TABLE public.instructor_exams ALTER COLUMN learning_path_id DROP NOT NULL;

COMMENT ON COLUMN public.instructor_exams.specialty_id IS
  'La especialidad que examina. Eje desde la 092.';
COMMENT ON COLUMN public.instructor_exams.learning_path_id IS
  'EN RETIRADA. El eje es specialty_id desde la 092. Siete ficheros de la aplicacion todavia la leen; se retira cuando terminen de mudarse. Dejo de ser NOT NULL porque hay especialidades sin ruta.';

CREATE INDEX IF NOT EXISTS idx_instructor_exams_specialty
  ON public.instructor_exams (specialty_id);

-- El mapeo, por el puntero que dejo la 090. Nada escrito a mano.
UPDATE public.instructor_exams e
   SET specialty_id = s.id
  FROM public.instructor_specialties s
 WHERE s.learning_path_id = e.learning_path_id
   AND e.specialty_id IS DISTINCT FROM s.id;

-- =====================================================
-- 7. La prueba, dentro de la propia migracion
-- =====================================================

DO $prueba$
DECLARE
  v_usuario uuid;
  v_esp     uuid;
  v_a       uuid;
  v_sin_eje integer;
BEGIN
  SELECT id INTO v_usuario FROM public.users ORDER BY created_at LIMIT 1;
  SELECT id INTO v_esp FROM public.instructor_specialties WHERE slug = 'bitcoin-fundamentos';

  IF v_usuario IS NULL OR v_esp IS NULL THEN
    RAISE EXCEPTION 'La prueba necesita un usuario y la especialidad bitcoin-fundamentos. ¿Se aplico la 090?';
  END IF;

  -- 1. Nace pendiente y coherente: sin examen, sin intento, sin emitir
  INSERT INTO public.instructor_certifications (user_id, specialty_id, certification_number)
  VALUES (v_usuario, v_esp, 'PRUEBA-092-A')
  RETURNING id INTO v_a;

  IF (SELECT status FROM public.instructor_certifications WHERE id = v_a) <> 'pendiente' THEN
    RAISE EXCEPTION 'PRUEBA 1 FALLIDA: no nace en pendiente.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.instructor_certifications
              WHERE id = v_a AND (exam_id IS NOT NULL OR attempt_id IS NOT NULL
                               OR issued_at IS NOT NULL OR expires_at IS NOT NULL
                               OR evaluator_id IS NOT NULL)) THEN
    RAISE EXCEPTION 'PRUEBA 1 FALLIDA: una pendiente trae datos que no deberia.';
  END IF;
  RAISE NOTICE 'PRUEBA 1  nace pendiente, sin examen, sin emitir            PASA';

  -- 2. El vocabulario viejo ya no cabe
  BEGIN
    UPDATE public.instructor_certifications SET status = 'active' WHERE id = v_a;
    RAISE EXCEPTION 'PRUEBA 2 FALLIDA: se pudo escribir el estado viejo «active».';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PRUEBA 2  el estado viejo «active» ya no cabe              PASA';
  END;

  -- 3. Ni un resultado inventado
  BEGIN
    UPDATE public.instructor_certifications SET oral_result = 'regular' WHERE id = v_a;
    RAISE EXCEPTION 'PRUEBA 3 FALLIDA: se pudo escribir un oral_result inventado.';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PRUEBA 3  oral_result solo admite su vocabulario           PASA';
  END;

  -- 4. Dos vivas de la misma especialidad, imposible
  BEGIN
    INSERT INTO public.instructor_certifications (user_id, specialty_id, certification_number)
    VALUES (v_usuario, v_esp, 'PRUEBA-092-B');
    RAISE EXCEPTION 'PRUEBA 4 FALLIDA: se pudo crear una segunda certificacion viva.';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'PRUEBA 4  dos vivas de la misma especialidad, imposible    PASA';
  END;

  -- 5. Pero tras un rechazo se puede volver a solicitar
  UPDATE public.instructor_certifications SET status = 'rechazada' WHERE id = v_a;
  INSERT INTO public.instructor_certifications (user_id, specialty_id, certification_number)
  VALUES (v_usuario, v_esp, 'PRUEBA-092-C');
  RAISE NOTICE 'PRUEBA 5  tras un rechazo se puede volver a solicitar       PASA';

  -- 6. Los cuatro examenes encontraron especialidad
  SELECT count(*) INTO v_sin_eje FROM public.instructor_exams WHERE specialty_id IS NULL;
  IF v_sin_eje > 0 THEN
    RAISE EXCEPTION
      'PRUEBA 6 FALLIDA: % examen(es) sin especialidad. Mira el puntero learning_path_id de la 090.', v_sin_eje;
  END IF;
  RAISE NOTICE 'PRUEBA 6  los cuatro examenes tienen especialidad           PASA';

  DELETE FROM public.instructor_certifications WHERE certification_number LIKE 'PRUEBA-092-%';
  RAISE NOTICE 'Filas de prueba borradas. Las seis pruebas pasan.';
END
$prueba$;

COMMIT;

-- ============================================================================
-- VERIFICACION
-- ============================================================================
-- Compara DEFINICIONES, no nombres. La version anterior comprobaba que
-- existiera una restriccion llamada instructor_certifications_status_check, y
-- eso era cierto con la restriccion ANTIGUA puesta: habria dicho TODO CORRECTO
-- sobre una base mal migrada.

SELECT
  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'instructor_certifications'
      AND column_name IN ('specialty_id','evaluator_id','evaluator_notes','evaluator_is_external',
                          'oral_result','practical_result','accreditation_type','accreditation_ref',
                          'accreditation_verified_at'))                        AS columnas_nuevas,

  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'instructor_certifications'
      AND column_name IN ('exam_id','learning_path_id','attempt_id','expires_at','issued_at')
      AND is_nullable = 'YES')                                                 AS opcionales_de_5,

  (SELECT is_nullable FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'instructor_certifications'
      AND column_name = 'specialty_id')                                        AS specialty_id_opcional,

  (SELECT count(*) FROM pg_constraint
    WHERE conrelid = 'public.instructor_certifications'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
      AND pg_get_constraintdef(oid) ILIKE '%pendiente%'
      AND pg_get_constraintdef(oid) ILIKE '%aprobada%'
      AND pg_get_constraintdef(oid) ILIKE '%rechazada%'
      AND pg_get_constraintdef(oid) ILIKE '%retirada%')                        AS check_nueva_de_status,

  (SELECT count(*) FROM pg_constraint
    WHERE conrelid = 'public.instructor_certifications'::regclass AND contype = 'c'
      AND (pg_get_constraintdef(oid) ILIKE '%renewal_pending%'
        OR pg_get_constraintdef(oid) ILIKE '%''active''%'))                     AS checks_del_vocabulario_viejo,

  (SELECT count(*) FROM pg_constraint
    WHERE conrelid = 'public.instructor_certifications'::regclass AND contype = 'u'
      AND pg_get_constraintdef(oid) ILIKE '%learning_path_id%')                 AS unique_del_eje_viejo,

  EXISTS (SELECT 1 FROM pg_indexes
           WHERE schemaname = 'public'
             AND indexname = 'uq_certificacion_viva_por_especialidad')          AS indice_unico_parcial,

  -- Las tres claves ajenas por su regla de borrado: n = SET NULL, c = CASCADE
  (SELECT count(*) FROM pg_constraint
    WHERE conrelid = 'public.instructor_certifications'::regclass AND contype = 'f'
      AND confdeltype = 'n'
      AND (pg_get_constraintdef(oid) ILIKE '%(exam_id)%'
        OR pg_get_constraintdef(oid) ILIKE '%(attempt_id)%'
        OR pg_get_constraintdef(oid) ILIKE '%(learning_path_id)%'))             AS fks_en_set_null,

  (SELECT count(*) FROM pg_constraint
    WHERE conrelid = 'public.instructor_certifications'::regclass AND contype = 'f'
      AND confdeltype = 'c'
      AND (pg_get_constraintdef(oid) ILIKE '%(exam_id)%'
        OR pg_get_constraintdef(oid) ILIKE '%(attempt_id)%'
        OR pg_get_constraintdef(oid) ILIKE '%(learning_path_id)%'))             AS fks_que_siguen_arrastrando,

  (SELECT is_nullable FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'instructor_exams'
      AND column_name = 'learning_path_id')                                    AS ruta_del_examen_opcional,

  (SELECT count(*) FROM public.instructor_exams)                               AS examenes,
  (SELECT count(*) FROM public.instructor_exams WHERE specialty_id IS NOT NULL) AS examenes_con_especialidad,
  (SELECT count(*) FROM public.instructor_exam_models)                         AS modelos,
  (SELECT count(*) FROM public.instructor_certifications)                      AS certificaciones,
  (SELECT count(*) FROM public.instructor_certifications
    WHERE certification_number LIKE 'PRUEBA-092-%')                            AS filas_de_prueba_que_quedan,

  CASE
    WHEN (SELECT count(*) FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'instructor_certifications'
             AND column_name IN ('specialty_id','evaluator_id','evaluator_notes','evaluator_is_external',
                                 'oral_result','practical_result','accreditation_type','accreditation_ref',
                                 'accreditation_verified_at')) = 9
     AND (SELECT count(*) FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'instructor_certifications'
             AND column_name IN ('exam_id','learning_path_id','attempt_id','expires_at','issued_at')
             AND is_nullable = 'YES') = 5
     AND (SELECT is_nullable FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'instructor_certifications'
             AND column_name = 'specialty_id') = 'NO'
     AND (SELECT count(*) FROM pg_constraint
           WHERE conrelid = 'public.instructor_certifications'::regclass AND contype = 'c'
             AND pg_get_constraintdef(oid) ILIKE '%status%'
             AND pg_get_constraintdef(oid) ILIKE '%pendiente%'
             AND pg_get_constraintdef(oid) ILIKE '%retirada%') = 1
     AND (SELECT count(*) FROM pg_constraint
           WHERE conrelid = 'public.instructor_certifications'::regclass AND contype = 'c'
             AND (pg_get_constraintdef(oid) ILIKE '%renewal_pending%'
               OR pg_get_constraintdef(oid) ILIKE '%''active''%')) = 0
     AND (SELECT count(*) FROM pg_constraint
           WHERE conrelid = 'public.instructor_certifications'::regclass AND contype = 'u'
             AND pg_get_constraintdef(oid) ILIKE '%learning_path_id%') = 0
     AND EXISTS (SELECT 1 FROM pg_indexes
                  WHERE schemaname = 'public'
                    AND indexname = 'uq_certificacion_viva_por_especialidad')
     AND (SELECT count(*) FROM pg_constraint
           WHERE conrelid = 'public.instructor_certifications'::regclass AND contype = 'f'
             AND confdeltype = 'n'
             AND (pg_get_constraintdef(oid) ILIKE '%(exam_id)%'
               OR pg_get_constraintdef(oid) ILIKE '%(attempt_id)%'
               OR pg_get_constraintdef(oid) ILIKE '%(learning_path_id)%')) = 3
     AND (SELECT is_nullable FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'instructor_exams'
             AND column_name = 'learning_path_id') = 'YES'
     AND (SELECT count(*) FROM public.instructor_exams WHERE specialty_id IS NULL) = 0
     AND (SELECT count(*) FROM public.instructor_exam_models) = 40
     AND (SELECT count(*) FROM public.instructor_certifications
           WHERE certification_number LIKE 'PRUEBA-092-%') = 0
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                                          AS veredicto;
