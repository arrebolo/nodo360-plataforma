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
-- POR QUE FALLO LA PRUEBA 6 EN EL PRIMER INTENTO, que es lo que mas se aprende
-- de este fichero. La prueba decia «se pudo anunciar dos veces», y era verdad,
-- pero no porque el trigger estuviera mal escrito: porque now() DEVUELVE LA HORA
-- DE INICIO DE LA TRANSACCION y no cambia dentro de ella. La prueba marcaba el
-- anuncio con now(), volvia a marcarlo con now(), y el trigger comparaba
-- «NEW.anunciado_el IS DISTINCT FROM OLD.anunciado_el»: mismo valor, no distinto,
-- pasaba.
--
-- Y AL ARREGLARLO SE VE QUE EL TRIGGER NO ERA EL SITIO. Un trigger no puede
-- distinguir «segundo anuncio que escribe la misma fecha» de «otro UPDATE que
-- arrastra la misma fecha sin querer tocarla». La garantia de una sola vez es un
-- CERROJO ATOMICO, no una comparacion:
--
--     UPDATE instructor_certifications
--        SET anunciado_el = now()
--      WHERE id = ? AND anunciado_el IS NULL
--
-- Quien recibe fila publica; el segundo recibe cero filas y no publica. Eso es lo
-- que hace la ruta, y es lo que prueba la PRUEBA 6 ahora: dos reclamaciones
-- seguidas sobre la MISMA certificacion, 1 y luego 0.
--
-- El trigger se queda para lo que si sabe hacer: que no se anuncie algo que no
-- esta aprobado, que no tiene consentimiento, o cambiarle la fecha a un anuncio
-- que ya se hizo.
--
-- OJO CON EL NOMBRE: la columna es `anunciado_el`, no `anunciada_el`. Es la que ya
-- usa el codigo desplegado.
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
  ADD COLUMN IF NOT EXISTS anunciado_el              timestamptz,
  ADD COLUMN IF NOT EXISTS rechazada_el              timestamptz;

COMMENT ON COLUMN public.instructor_certifications.consentimiento_anuncio IS
  'La persona acepta que, SI se aprueba, se anuncie en los canales de Nodo360 con su nombre publico y su especialidad. Se pide al solicitar y vale solo para ESA solicitud: consentir una vez no consiente las siguientes.';
COMMENT ON COLUMN public.instructor_certifications.consentimiento_anuncio_el IS
  'Cuando se dio el consentimiento. Sin fecha, un consentimiento no es demostrable.';
COMMENT ON COLUMN public.instructor_certifications.anunciado_el IS
  'Cuando se publico el anuncio. Es el CERROJO que impide anunciar dos veces, y funciona reclamandolo —UPDATE ... WHERE anunciado_el IS NULL— no comprobandolo: entre una lectura y una escritura cabe otra peticion. NULL = no se ha anunciado.';
COMMENT ON COLUMN public.instructor_certifications.rechazada_el IS
  'Cuando se rechazo la solicitud. De aqui se cuentan los 30 dias de espera antes de poder volver a pedir la misma especialidad. No se usa updated_at porque updated_at cambia por cualquier otra cosa y el plazo dejaria de ser el plazo.';

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

  -- Cambiarle la fecha a un anuncio que ya se hizo: no.
  --
  -- Esto NO es lo que impide anunciar dos veces —eso lo hace el cerrojo atomico de
  -- la ruta, porque un trigger no puede distinguir un segundo anuncio que escribe
  -- la misma fecha de otro UPDATE que la arrastra sin querer tocarla—. Esto impide
  -- reescribir la historia: mover la fecha de un anuncio ya publicado.
  IF TG_OP = 'UPDATE' AND OLD.anunciado_el IS NOT NULL
     AND NEW.anunciado_el IS DISTINCT FROM OLD.anunciado_el THEN
    RAISE EXCEPTION
      'Esta verificacion ya se anuncio el %. Su fecha no se cambia.', OLD.anunciado_el
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

-- ---------- 3. Treinta dias de espera tras un rechazo ----------
-- El correo de rechazo dice una fecha concreta a partir de la cual se puede volver
-- a solicitar. Si el sistema aceptara una solicitud antes de esa fecha, el correo
-- estaria mintiendo, y eso es justo lo que llevamos toda la semana quitando de los
-- textos. Asi que la regla existe donde se puede hacer cumplir.

CREATE OR REPLACE FUNCTION public.espera_tras_un_rechazo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  DIAS constant integer := 30;
  v_ultimo timestamptz;
BEGIN
  SELECT max(coalesce(c.rechazada_el, c.updated_at))
    INTO v_ultimo
    FROM public.instructor_certifications c
   WHERE c.user_id = NEW.user_id
     AND c.specialty_id = NEW.specialty_id
     AND c.status = 'rechazada';

  IF v_ultimo IS NOT NULL AND v_ultimo > now() - make_interval(days => DIAS) THEN
    RAISE EXCEPTION
      'Esta especialidad se rechazo el %. Se puede volver a solicitar a partir del %.',
      to_char(v_ultimo, 'DD/MM/YYYY'),
      to_char(v_ultimo + make_interval(days => DIAS), 'DD/MM/YYYY')
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END
$fn$;

COMMENT ON FUNCTION public.espera_tras_un_rechazo() IS
  'Impide volver a solicitar una especialidad antes de 30 dias desde su rechazo. Cuenta desde rechazada_el, y cae en updated_at solo para los rechazos anteriores a la 108, que no tienen esa fecha. Existe porque el correo de rechazo anuncia una fecha concreta: sin esta regla, ese correo mentiria.';

REVOKE ALL ON FUNCTION public.espera_tras_un_rechazo() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_espera_tras_un_rechazo ON public.instructor_certifications;
CREATE TRIGGER trg_espera_tras_un_rechazo
  BEFORE INSERT ON public.instructor_certifications
  FOR EACH ROW
  EXECUTE FUNCTION public.espera_tras_un_rechazo();

-- ---------- 4. La prueba ----------

DO $prueba$
DECLARE
  v_cert    uuid;
  v_persona uuid;
  v_status  text;
  v_cons    boolean;
  v_cons_el timestamptz;
  v_anun    timestamptz;
  v_notif   uuid;
  v_esp     uuid;
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

  -- 5 y 6. EL CERROJO ATOMICO, QUE ES LO QUE DE VERDAD IMPIDE ANUNCIAR DOS VECES
  --
  -- La version anterior de la prueba 6 hacia dos UPDATE seguidos poniendo now() y
  -- esperaba que el trigger cortara el segundo. FALLO, y el motivo es que now()
  -- devuelve la hora de INICIO DE LA TRANSACCION y no cambia dentro de ella: el
  -- segundo UPDATE escribia el MISMO valor, y el trigger comparaba
  -- «IS DISTINCT FROM». Mismo valor, no distinto, pasaba.
  --
  -- Arreglarlo subiendo la comparacion no vale: un trigger no puede distinguir «un
  -- segundo anuncio que escribe la misma fecha» de «otro UPDATE que arrastra esa
  -- fecha sin querer tocarla». La garantia de una sola vez es un CERROJO, y un
  -- cerrojo no se comprueba, se RECLAMA:
  --
  --     UPDATE ... SET anunciado_el = now() WHERE id = ? AND anunciado_el IS NULL
  --
  -- Quien recibe fila publica. El segundo recibe cero filas y no publica. Esto es
  -- lo que hace la ruta, y esto es lo que se prueba: dos reclamaciones seguidas
  -- sobre la MISMA certificacion.
  UPDATE public.instructor_certifications
     SET consentimiento_anuncio = true, consentimiento_anuncio_el = now()
   WHERE id = v_cert;

  IF v_status = 'aprobada' THEN
    -- Primera llamada: se lleva la fila
    WITH reclamada AS (
      UPDATE public.instructor_certifications
         SET anunciado_el = now()
       WHERE id = v_cert
         AND anunciado_el IS NULL
      RETURNING 1
    )
    SELECT count(*) INTO v_n FROM reclamada;

    IF v_n <> 1 THEN
      RAISE EXCEPTION 'PRUEBA 5 FALLIDA: la primera reclamacion devolvio % filas, esperaba 1.', v_n;
    END IF;
    RAISE NOTICE 'PRUEBA 5  la primera llamada se lleva el anuncio (1 fila)     PASA';

    -- Segunda llamada, inmediatamente despues y sobre la misma certificacion:
    -- cero filas. Y date cuenta de que aqui now() vale LO MISMO que arriba, que es
    -- justo el caso que se le colaba a la version anterior.
    WITH reclamada AS (
      UPDATE public.instructor_certifications
         SET anunciado_el = now()
       WHERE id = v_cert
         AND anunciado_el IS NULL
      RETURNING 1
    )
    SELECT count(*) INTO v_n FROM reclamada;

    IF v_n <> 0 THEN
      RAISE EXCEPTION 'PRUEBA 6 FALLIDA: la segunda reclamacion devolvio % filas, esperaba 0. Se podria anunciar dos veces.', v_n;
    END IF;
    RAISE NOTICE 'PRUEBA 6  la segunda llamada no se lleva nada (0 filas)       PASA';

    -- 6b. Y el trigger sigue impidiendo MOVER la fecha de un anuncio ya hecho,
    -- que es lo unico que un trigger si puede garantizar aqui.
    BEGIN
      UPDATE public.instructor_certifications
         SET anunciado_el = now() + interval '1 hour'
       WHERE id = v_cert;
      RAISE EXCEPTION 'PRUEBA 6b FALLIDA: se pudo cambiar la fecha de un anuncio ya hecho.';
    EXCEPTION WHEN unique_violation THEN
      RAISE NOTICE 'PRUEBA 6b la fecha de un anuncio hecho no se puede mover     PASA';
    END;
  ELSE
    RAISE NOTICE 'PRUEBA 5  omitida: la certificacion de prueba esta en «%»', v_status;
  END IF;

  -- 7. Todo como estaba
  --
  -- Primero se SUELTA el cerrojo (a NULL, que el trigger deja pasar) y despues se
  -- pone el valor original. De un tiron no se puede: el trigger impide cambiar una
  -- fecha ya puesta por otra distinta, que es precisamente lo que se acaba de
  -- comprobar en la prueba 6b.
  UPDATE public.instructor_certifications SET anunciado_el = NULL WHERE id = v_cert;

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

  -- 8. LOS 30 DIAS DE ESPERA TRAS UN RECHAZO
  --
  -- El correo de rechazo anuncia una fecha concreta. Si el sistema aceptara una
  -- solicitud antes de esa fecha, el correo estaria mintiendo. Se comprueba con un
  -- expediente rechazado de usar y tirar.
  SELECT id INTO v_persona FROM public.users WHERE role = 'student' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_esp FROM public.instructor_specialties WHERE slug = 'web3';

  IF v_persona IS NOT NULL AND v_esp IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM public.instructor_certifications
        WHERE user_id = v_persona AND specialty_id = v_esp
     ) THEN

    INSERT INTO public.instructor_certifications
      (user_id, specialty_id, certification_number, status, oral_result, practical_result, rechazada_el)
    VALUES (v_persona, v_esp, 'PRUEBA-108-R', 'rechazada', 'no_apto', 'no_apto', now() - interval '3 days');

    BEGIN
      INSERT INTO public.instructor_certifications
        (user_id, specialty_id, certification_number, status, oral_result, practical_result)
      VALUES (v_persona, v_esp, 'PRUEBA-108-R2', 'pendiente', 'pendiente', 'pendiente');
      RAISE EXCEPTION 'PRUEBA 8 FALLIDA: se pudo volver a solicitar 3 dias despues de un rechazo.';
    EXCEPTION WHEN check_violation THEN
      RAISE NOTICE 'PRUEBA 8  a los 3 dias de un rechazo NO se puede repetir     PASA';
    END;

    -- Y pasados los 30, si
    UPDATE public.instructor_certifications
       SET rechazada_el = now() - interval '31 days'
     WHERE certification_number = 'PRUEBA-108-R';

    INSERT INTO public.instructor_certifications
      (user_id, specialty_id, certification_number, status, oral_result, practical_result)
    VALUES (v_persona, v_esp, 'PRUEBA-108-R3', 'pendiente', 'pendiente', 'pendiente');
    RAISE NOTICE 'PRUEBA 8b pasados 31 dias, si se puede volver a solicitar      PASA';

    DELETE FROM public.instructor_certifications
     WHERE certification_number LIKE 'PRUEBA-108-%';

    SELECT count(*) INTO v_n FROM public.instructor_certifications
     WHERE certification_number LIKE 'PRUEBA-108-%';
    IF v_n <> 0 THEN
      RAISE EXCEPTION 'PRUEBA 8 FALLIDA: quedan % expedientes de prueba.', v_n;
    END IF;
    RAISE NOTICE 'PRUEBA 8c no queda ningun expediente de prueba                PASA';
  ELSE
    RAISE NOTICE 'PRUEBA 8  omitida: no hay un estudiante sin expediente de web3';
  END IF;

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
      AND column_name IN ('consentimiento_anuncio', 'consentimiento_anuncio_el', 'anunciado_el', 'rechazada_el')) AS columnas_de_4,
  EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_espera_tras_un_rechazo'
            AND tgrelid = 'public.instructor_certifications'::regclass)          AS trigger_de_espera,
  (SELECT count(*) FROM public.instructor_certifications
    WHERE certification_number LIKE 'PRUEBA-108-%')                             AS filas_de_prueba_que_quedan,

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
             AND column_name IN ('consentimiento_anuncio', 'consentimiento_anuncio_el', 'anunciado_el', 'rechazada_el')) = 4
     AND EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_espera_tras_un_rechazo'
                   AND tgrelid = 'public.instructor_certifications'::regclass)
     AND (SELECT count(*) FROM public.instructor_certifications
           WHERE certification_number LIKE 'PRUEBA-108-%') = 0
     AND EXISTS (SELECT 1 FROM pg_constraint
                  WHERE conrelid = 'public.instructor_certifications'::regclass
                    AND conname = 'consentimiento_con_fecha')
     AND EXISTS (SELECT 1 FROM pg_trigger
                  WHERE tgname = 'trg_solo_se_anuncia_lo_aprobado'
                    AND tgrelid = 'public.instructor_certifications'::regclass)
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                                             AS veredicto;
