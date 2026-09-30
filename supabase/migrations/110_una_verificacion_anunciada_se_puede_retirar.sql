-- ============================================================================
-- MIGRACION 110: una verificacion ya anunciada tambien se puede retirar
--
-- EL FALLO, QUE ES MIO Y DE LA 108
-- El trigger solo_se_anuncia_lo_aprobado_y_consentido() comprueba «si la fila
-- tiene anunciado_el, el estado tiene que ser aprobada». Eso lo escribi pensando
-- en el momento de anunciar, y se dispara en CUALQUIER actualizacion de una fila
-- que ya se anuncio. Consecuencia:
--
--     UPDATE ... SET status = 'retirada' ...   sobre una verificacion anunciada
--     ERROR: Solo se anuncia una verificacion aprobada; esta esta en «retirada»
--
-- Es decir: UNA VERIFICACION ANUNCIADA NO SE PODIA RETIRAR NUNCA. Y el mensaje
-- hablaba de anunciar en una operacion que no anunciaba nada, que es lo que hizo
-- que el fallo pareciera otra cosa.
--
-- Comprobado en la base: la retirada de «Lightning y pagos» de la cuenta de
-- pruebas no se aplico —seguia en aprobada, con revoked_at vacio— aunque el panel
-- dio la operacion por hecha.
--
-- LA CORRECCION
-- El trigger tiene que mirar el ANUNCIO, no el estado de la fila. Solo valida
-- cuando anunciado_el se INTRODUCE o se CAMBIA; si esta actualizacion no lo toca,
-- no es asunto suyo:
--
--     TG_OP = 'UPDATE' y NEW.anunciado_el = OLD.anunciado_el  ->  pasar
--
-- Asi «aprobada y consentida» se sigue exigiendo para anunciar, la fecha de un
-- anuncio hecho sigue sin poder moverse, y retirar o cambiar cualquier otra cosa
-- de una fila anunciada vuelve a ser posible.
--
-- POR QUE LA AUTOPRUEBA DE LA 108 NO LO VIO: probaba anunciar, volver a anunciar y
-- mover la fecha. No probaba tocar OTRA columna de una fila ya anunciada, que es
-- justo el caso roto. Aqui se prueba, y con una retirada de verdad.
--
-- NO BORRA NI UNA FILA. Es reejecutable. Y se prueba a si misma.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.solo_se_anuncia_lo_aprobado_y_consentido()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $fn$
BEGIN
  -- Sin anuncio no hay nada que vigilar.
  IF NEW.anunciado_el IS NULL THEN
    RETURN NEW;
  END IF;

  -- ESTA ACTUALIZACION NO TOCA EL ANUNCIO: no es asunto de este trigger.
  --
  -- Es la linea que faltaba en la 108. Sin ella, cualquier UPDATE sobre una fila
  -- ya anunciada —retirarla, cambiarle las notas, lo que sea— arrastraba
  -- anunciado_el sin querer tocarlo y caia en la comprobacion de «tiene que estar
  -- aprobada». Retirar una verificacion anunciada era imposible.
  IF TG_OP = 'UPDATE' AND NEW.anunciado_el = OLD.anunciado_el THEN
    RETURN NEW;
  END IF;

  -- Mover la fecha de un anuncio ya hecho: no. Reescribir la historia, no.
  IF TG_OP = 'UPDATE' AND OLD.anunciado_el IS NOT NULL THEN
    RAISE EXCEPTION
      'Esta verificacion ya se anuncio el %. Su fecha no se cambia.', OLD.anunciado_el
      USING ERRCODE = '23505';
  END IF;

  -- De aqui abajo: se esta ANUNCIANDO por primera vez.
  IF NEW.status <> 'aprobada' THEN
    RAISE EXCEPTION
      'Solo se anuncia una verificacion aprobada; esta esta en «%». Los rechazos y las retiradas no se anuncian.',
      NEW.status
      USING ERRCODE = '42501';
  END IF;

  IF NOT NEW.consentimiento_anuncio THEN
    RAISE EXCEPTION
      'Esta persona no ha consentido que se anuncie su verificacion.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END
$fn$;

COMMENT ON FUNCTION public.solo_se_anuncia_lo_aprobado_y_consentido() IS
  'Vigila el ANUNCIO, no el estado de la fila. Exige aprobada y consentida para anunciar por primera vez, impide mover la fecha de un anuncio hecho, y deja pasar cualquier actualizacion que no toque anunciado_el: sin esa ultima regla, una verificacion anunciada no se podia retirar (corregido en la 110).';

-- =====================================================
-- La prueba, con una retirada de verdad
-- =====================================================

DO $prueba$
DECLARE
  v_persona uuid;
  v_esp     uuid;
  v_cert    uuid;
  v_status  text;
  v_anun    timestamptz;
BEGIN
  -- Una persona y una especialidad donde no tenga nada, para no tocar datos reales.
  SELECT u.id INTO v_persona
    FROM public.users u
   WHERE u.role IN ('student', 'instructor')
   ORDER BY u.created_at
   LIMIT 1;

  SELECT e.id INTO v_esp
    FROM public.instructor_specialties e
   WHERE NOT e.requiere_acreditacion
     AND NOT EXISTS (
       SELECT 1 FROM public.instructor_certifications c
        WHERE c.user_id = v_persona AND c.specialty_id = e.id
     )
   LIMIT 1;

  IF v_persona IS NULL OR v_esp IS NULL THEN
    RAISE EXCEPTION 'La prueba necesita una persona y una especialidad libre. persona=% esp=%', v_persona, v_esp;
  END IF;

  -- 1. Una verificacion aprobada, consentida y ANUNCIADA
  INSERT INTO public.instructor_certifications
    (user_id, specialty_id, certification_number, status, oral_result, practical_result,
     consentimiento_anuncio, consentimiento_anuncio_el)
  VALUES (v_persona, v_esp, 'PRUEBA-110', 'aprobada', 'apto', 'apto', true, now())
  RETURNING id INTO v_cert;

  UPDATE public.instructor_certifications SET anunciado_el = now() WHERE id = v_cert;

  SELECT anunciado_el INTO v_anun FROM public.instructor_certifications WHERE id = v_cert;
  IF v_anun IS NULL THEN
    RAISE EXCEPTION 'PRUEBA 1 FALLIDA: no se pudo marcar el anuncio.';
  END IF;
  RAISE NOTICE 'PRUEBA 1  se anuncia una aprobada y consentida                  PASA';

  -- 2. Y AHORA SE RETIRA. Esto es lo que fallaba.
  UPDATE public.instructor_certifications
     SET status = 'retirada', revoked_at = now(),
         revoked_reason = 'Prueba de la migracion 110: retirada de una anunciada'
   WHERE id = v_cert;

  SELECT status INTO v_status FROM public.instructor_certifications WHERE id = v_cert;
  IF v_status <> 'retirada' THEN
    RAISE EXCEPTION 'PRUEBA 2 FALLIDA: la retirada no se aplico, quedo en «%».', v_status;
  END IF;
  RAISE NOTICE 'PRUEBA 2  una verificacion ANUNCIADA se puede retirar           PASA';

  -- 3. Y la fecha del anuncio sigue ahi: retirar no borra que se anuncio
  SELECT anunciado_el INTO v_anun FROM public.instructor_certifications WHERE id = v_cert;
  IF v_anun IS NULL THEN
    RAISE EXCEPTION 'PRUEBA 3 FALLIDA: retirar borro la fecha del anuncio.';
  END IF;
  RAISE NOTICE 'PRUEBA 3  retirar no borra que se habia anunciado               PASA';

  -- 4. Pero mover la fecha del anuncio sigue prohibido
  BEGIN
    UPDATE public.instructor_certifications
       SET anunciado_el = now() + interval '1 hour'
     WHERE id = v_cert;
    RAISE EXCEPTION 'PRUEBA 4 FALLIDA: se pudo mover la fecha de un anuncio hecho.';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'PRUEBA 4  mover la fecha del anuncio sigue prohibido           PASA';
  END;

  -- 5. Y anunciar algo que NO esta aprobado sigue prohibido
  UPDATE public.instructor_certifications SET anunciado_el = NULL WHERE id = v_cert;
  BEGIN
    UPDATE public.instructor_certifications SET anunciado_el = now() WHERE id = v_cert;
    RAISE EXCEPTION 'PRUEBA 5 FALLIDA: se anuncio una verificacion retirada.';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PRUEBA 5  no se anuncia una retirada                           PASA';
  END;

  -- 6. Limpieza
  DELETE FROM public.instructor_certifications WHERE certification_number = 'PRUEBA-110';
  IF EXISTS (SELECT 1 FROM public.instructor_certifications WHERE certification_number = 'PRUEBA-110') THEN
    RAISE EXCEPTION 'PRUEBA 6 FALLIDA: queda la fila de prueba.';
  END IF;
  RAISE NOTICE 'PRUEBA 6  no queda ninguna fila de prueba                       PASA';

  RAISE NOTICE 'Las seis pruebas pasan.';
END
$prueba$;

COMMIT;

-- ============================================================================
-- VERIFICACION
-- ============================================================================

SELECT
  EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_solo_se_anuncia_lo_aprobado'
            AND tgrelid = 'public.instructor_certifications'::regclass)          AS trigger_activo,

  -- La linea que faltaba, buscada en el cuerpo de la funcion
  (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'solo_se_anuncia_lo_aprobado_y_consentido'
      AND p.prosrc ILIKE '%NEW.anunciado_el = OLD.anunciado_el%')                AS deja_pasar_lo_que_no_toca_el_anuncio,

  (SELECT count(*) FROM public.instructor_certifications)                        AS certificaciones,
  (SELECT count(*) FROM public.instructor_certifications WHERE anunciado_el IS NOT NULL) AS anunciadas,
  (SELECT count(*) FROM public.instructor_certifications WHERE status = 'retirada')       AS retiradas,
  (SELECT count(*) FROM public.instructor_certifications
    WHERE certification_number = 'PRUEBA-110')                                   AS filas_de_prueba_que_quedan,

  CASE
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_solo_se_anuncia_lo_aprobado'
                   AND tgrelid = 'public.instructor_certifications'::regclass)
     AND (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public' AND p.proname = 'solo_se_anuncia_lo_aprobado_y_consentido'
             AND p.prosrc ILIKE '%NEW.anunciado_el = OLD.anunciado_el%') = 1
     AND (SELECT count(*) FROM public.instructor_certifications
           WHERE certification_number = 'PRUEBA-110') = 0
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                                            AS veredicto;
