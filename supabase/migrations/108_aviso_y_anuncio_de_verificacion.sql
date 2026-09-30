-- ============================================================================
-- MIGRACION 108: avisar al candidato, y anunciarlo solo si el lo consiente
--
-- LO QUE HABIA, MEDIDO
-- Al aprobar o rechazar una verificacion NO se avisaba a nadie:
-- app/api/admin/verificaciones/route.ts no tiene ni una referencia a correo,
-- notificacion o Discord. La persona se enteraba entrando a mirar.
--
-- DOS COSAS DISTINTAS, Y NO SE MEZCLAN
--   1. EL AVISO al candidato: siempre, aprobada o rechazada. No necesita permiso
--      porque es correspondencia sobre su propia solicitud.
--   2. EL ANUNCIO publico en Discord y Telegram: solo si la aprueban Y solo si
--      esa persona lo ha consentido al solicitarla. Un rechazo NO se anuncia
--      jamas, y una retirada tampoco.
--
-- POR QUE EL CONSENTIMIENTO VIVE EN LA CERTIFICACION Y NO EN EL PERFIL
-- Porque se da para UNA solicitud concreta. Quien acepta que se anuncie su
-- verificacion de Fiscalidad no ha aceptado que se anuncien todas las que pida
-- despues. Y asi queda con su fecha, que es lo que hace demostrable que se dio.
--
-- notifications.type ES UN ENUM, no un CHECK. Comprobado: insertar un tipo nuevo
-- devuelve «22P02 invalid input value for enum notification_type». Por eso hay
-- que ampliarlo con ALTER TYPE ... ADD VALUE.
--
-- Y POR ESO ESTA MIGRACION TIENE DOS TRANSACCIONES, a proposito: Postgres no deja
-- USAR un valor de enum en la misma transaccion en la que se añade. Si todo
-- fuera un solo BEGIN/COMMIT, la autoprueba —que inserta una notificacion de
-- verdad con el tipo nuevo— moriria con «unsafe use of new value». La primera
-- transaccion añade los valores y cierra; la segunda ya puede usarlos.
--
-- NO BORRA NI UNA FILA. Es reejecutable. Y se prueba a si misma.
-- ============================================================================

-- =====================================================
-- TRANSACCION 1: los valores del enum, y nada mas
-- =====================================================

BEGIN;

ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'verificacion_aprobada';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'verificacion_rechazada';

COMMIT;

-- =====================================================
-- TRANSACCION 2: lo demas, que ya puede usarlos
-- =====================================================

BEGIN;

-- ---------- 1. El consentimiento y el anuncio ----------

ALTER TABLE public.instructor_certifications
  ADD COLUMN IF NOT EXISTS consentimiento_anuncio    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consentimiento_anuncio_el timestamptz,
  ADD COLUMN IF NOT EXISTS anunciado_el              timestamptz;

COMMENT ON COLUMN public.instructor_certifications.consentimiento_anuncio IS
  'La persona acepta que, SI se aprueba, se anuncie en los canales de Nodo360 con su nombre publico y su especialidad. Se pide al solicitar y vale solo para ESA solicitud: consentir una vez no consiente las siguientes.';
COMMENT ON COLUMN public.instructor_certifications.consentimiento_anuncio_el IS
  'Cuando se dio el consentimiento. Sin fecha, un consentimiento no es demostrable.';
COMMENT ON COLUMN public.instructor_certifications.anunciado_el IS
  'Cuando se publico el anuncio. Es el cerrojo que impide anunciar dos veces: se comprueba antes de enviar. NULL = no se ha anunciado.';

-- El consentimiento y su fecha van juntos o no van
ALTER TABLE public.instructor_certifications
  DROP CONSTRAINT IF EXISTS consentimiento_con_fecha;

ALTER TABLE public.instructor_certifications
  ADD CONSTRAINT consentimiento_con_fecha CHECK (
    (consentimiento_anuncio = false AND consentimiento_anuncio_el IS NULL)
    OR (consentimiento_anuncio = true AND consentimiento_anuncio_el IS NOT NULL)
  );

-- ---------- 2. Anunciar solo lo que se puede anunciar ----------
-- Esto NO es un CHECK porque depende de dos columnas que cambian a la vez y de
-- un estado; un trigger da ademas un mensaje que explica que ha pasado.

CREATE OR REPLACE FUNCTION public.solo_se_anuncia_lo_aprobado_y_consentido()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $fn$
BEGIN
  IF NEW.anunciado_el IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.anunciado_el IS NOT NULL
     AND NEW.anunciado_el IS DISTINCT FROM OLD.anunciado_el THEN
    RAISE EXCEPTION
      'Esta verificacion ya se anuncio el %. Un anuncio no se repite.', OLD.anunciado_el
      USING ERRCODE = '23505';
  END IF;

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
  'Impide marcar como anunciada una verificacion que no esta aprobada, que no tiene consentimiento, o que ya se anuncio. La barrera esta en la base y no solo en la ruta: el anuncio publica el nombre de una persona, y eso no puede depender de que nadie se deje una comprobacion.';

REVOKE ALL ON FUNCTION public.solo_se_anuncia_lo_aprobado_y_consentido() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_solo_se_anuncia_lo_aprobado ON public.instructor_certifications;
CREATE TRIGGER trg_solo_se_anuncia_lo_aprobado
  BEFORE INSERT OR UPDATE ON public.instructor_certifications
  FOR EACH ROW
  EXECUTE FUNCTION public.solo_se_anuncia_lo_aprobado_y_consentido();

-- ---------- 3. La prueba ----------

DO $prueba$
DECLARE
  v_cert    uuid;
  v_persona uuid;
  v_status  text;
  v_cons    boolean;
  v_cons_el timestamptz;
  v_anun    timestamptz;
  v_notif   uuid;
  v_n       integer;
BEGIN
  SELECT id, user_id, status, consentimiento_anuncio, consentimiento_anuncio_el, anunciado_el
    INTO v_cert, v_persona, v_status, v_cons, v_cons_el, v_anun
    FROM public.instructor_certifications
   ORDER BY created_at
   LIMIT 1;

  IF v_cert IS NULL THEN
    RAISE EXCEPTION 'La prueba necesita al menos una certificacion.';
  END IF;

  -- 1. El enum ya admite los dos tipos nuevos, y de verdad: se inserta una
  --    notificacion real y se borra. Si la TRANSACCION 1 no hubiera cerrado,
  --    esto moriria con «unsafe use of new value».
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (v_persona, 'verificacion_aprobada', 'prueba 108', 'prueba de la migracion 108')
  RETURNING id INTO v_notif;
  DELETE FROM public.notifications WHERE id = v_notif;
  RAISE NOTICE 'PRUEBA 1  el enum admite verificacion_aprobada                 PASA';

  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (v_persona, 'verificacion_rechazada', 'prueba 108', 'prueba de la migracion 108')
  RETURNING id INTO v_notif;
  DELETE FROM public.notifications WHERE id = v_notif;
  RAISE NOTICE 'PRUEBA 2  el enum admite verificacion_rechazada                PASA';

  -- 3. Consentimiento sin fecha: rechazado
  BEGIN
    UPDATE public.instructor_certifications
       SET consentimiento_anuncio = true, consentimiento_anuncio_el = NULL
     WHERE id = v_cert;
    RAISE EXCEPTION 'PRUEBA 3 FALLIDA: se acepto un consentimiento sin fecha.';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PRUEBA 3  un consentimiento sin fecha se rechaza              PASA';
  END;

  -- 4. Anunciar sin consentimiento: rechazado
  BEGIN
    UPDATE public.instructor_certifications
       SET consentimiento_anuncio = false, consentimiento_anuncio_el = NULL,
           anunciado_el = now()
     WHERE id = v_cert;
    RAISE EXCEPTION 'PRUEBA 4 FALLIDA: se anuncio sin consentimiento.';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PRUEBA 4  anunciar sin consentimiento se rechaza              PASA';
  END;

  -- 5. Con consentimiento y aprobada: se puede anunciar UNA vez
  UPDATE public.instructor_certifications
     SET consentimiento_anuncio = true, consentimiento_anuncio_el = now()
   WHERE id = v_cert;

  IF v_status = 'aprobada' THEN
    UPDATE public.instructor_certifications SET anunciado_el = now() WHERE id = v_cert;
    RAISE NOTICE 'PRUEBA 5  con consentimiento y aprobada, se puede anunciar    PASA';

    -- 6. Y no se puede anunciar dos veces
    BEGIN
      UPDATE public.instructor_certifications SET anunciado_el = now() WHERE id = v_cert;
      RAISE EXCEPTION 'PRUEBA 6 FALLIDA: se pudo anunciar dos veces.';
    EXCEPTION WHEN unique_violation THEN
      RAISE NOTICE 'PRUEBA 6  un anuncio no se repite                            PASA';
    END;
  ELSE
    RAISE NOTICE 'PRUEBA 5  omitida: la certificacion de prueba esta en «%»', v_status;
  END IF;

  -- 7. Todo como estaba
  UPDATE public.instructor_certifications
     SET consentimiento_anuncio    = v_cons,
         consentimiento_anuncio_el = v_cons_el,
         anunciado_el              = v_anun
   WHERE id = v_cert;

  SELECT count(*) INTO v_n
    FROM public.instructor_certifications
   WHERE id = v_cert
     AND consentimiento_anuncio IS NOT DISTINCT FROM v_cons
     AND consentimiento_anuncio_el IS NOT DISTINCT FROM v_cons_el
     AND anunciado_el IS NOT DISTINCT FROM v_anun;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'PRUEBA 7 FALLIDA: la fila no quedo como estaba.';
  END IF;
  RAISE NOTICE 'PRUEBA 7  la certificacion queda exactamente como estaba      PASA';

  RAISE NOTICE 'Las pruebas pasan. Ninguna fila creada ni modificada.';
END
$prueba$;

COMMIT;

-- ============================================================================
-- VERIFICACION
-- ============================================================================

SELECT
  (SELECT count(*) FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'notification_type'
      AND e.enumlabel IN ('verificacion_aprobada', 'verificacion_rechazada'))     AS tipos_nuevos_de_2,

  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'instructor_certifications'
      AND column_name IN ('consentimiento_anuncio', 'consentimiento_anuncio_el', 'anunciado_el')) AS columnas_de_3,

  EXISTS (SELECT 1 FROM pg_constraint
           WHERE conrelid = 'public.instructor_certifications'::regclass
             AND conname = 'consentimiento_con_fecha')                            AS check_de_consentimiento,
  EXISTS (SELECT 1 FROM pg_trigger
           WHERE tgname = 'trg_solo_se_anuncia_lo_aprobado'
             AND tgrelid = 'public.instructor_certifications'::regclass)          AS trigger_de_anuncio,

  (SELECT count(*) FROM public.instructor_certifications)                         AS certificaciones,
  (SELECT count(*) FROM public.instructor_certifications WHERE consentimiento_anuncio) AS con_consentimiento,
  (SELECT count(*) FROM public.instructor_certifications WHERE anunciado_el IS NOT NULL) AS ya_anunciadas,
  (SELECT count(*) FROM public.notifications)                                     AS notificaciones,

  CASE
    WHEN (SELECT count(*) FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
           WHERE t.typname = 'notification_type'
             AND e.enumlabel IN ('verificacion_aprobada', 'verificacion_rechazada')) = 2
     AND (SELECT count(*) FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'instructor_certifications'
             AND column_name IN ('consentimiento_anuncio', 'consentimiento_anuncio_el', 'anunciado_el')) = 3
     AND EXISTS (SELECT 1 FROM pg_constraint
                  WHERE conrelid = 'public.instructor_certifications'::regclass
                    AND conname = 'consentimiento_con_fecha')
     AND EXISTS (SELECT 1 FROM pg_trigger
                  WHERE tgname = 'trg_solo_se_anuncia_lo_aprobado'
                    AND tgrelid = 'public.instructor_certifications'::regclass)
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                                             AS veredicto;
