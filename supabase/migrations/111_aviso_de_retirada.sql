-- ============================================================================
-- MIGRACION 111: la notificacion de una verificacion retirada
--
-- QUE FALTA
-- Al retirar una verificacion no se avisaba a nadie: ni notificacion en la
-- plataforma ni correo. La persona se enteraba al intentar enviar un curso a
-- revision y encontrarse la puerta cerrada, que es la peor forma de enterarse.
--
-- notification_type es un ENUM —comprobado: insertar un tipo nuevo devuelve
-- «22P02 invalid input value for enum notification_type»— y le falta el valor
-- verificacion_retirada. Los otros dos, verificacion_aprobada y
-- verificacion_rechazada, ya estan desde la 108.
--
-- DOS TRANSACCIONES, COMO EN LA 108, y por el mismo motivo: Postgres no deja USAR
-- un valor de enum en la misma transaccion en la que se añade. La primera lo
-- añade y cierra; la segunda ya puede probarlo insertando una notificacion de
-- verdad. Con un solo BEGIN/COMMIT la autoprueba moriria con «unsafe use of new
-- value».
--
-- ESTO NO AÑADE NINGUNA REGLA NUEVA. La retirada ya no se anuncia en Discord ni en
-- Telegram porque el anuncio solo corre para 'aprobada' —y el trigger de la 108,
-- corregido en la 110, lo impide ademas en la base—. Aqui solo se abre el hueco
-- para poder avisar a la persona.
--
-- NO BORRA NI UNA FILA. Es reejecutable. Y se prueba a si misma.
-- ============================================================================

-- =====================================================
-- TRANSACCION 1: el valor del enum, y nada mas
-- =====================================================

BEGIN;

ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'verificacion_retirada';

COMMIT;

-- =====================================================
-- TRANSACCION 2: la prueba, que ya puede usarlo
-- =====================================================

BEGIN;

DO $prueba$
DECLARE
  v_persona uuid;
  v_notif   uuid;
  v_n       integer;
BEGIN
  SELECT id INTO v_persona FROM public.users ORDER BY created_at LIMIT 1;
  IF v_persona IS NULL THEN
    RAISE EXCEPTION 'La prueba necesita al menos un usuario.';
  END IF;

  -- 1. El enum admite el tipo nuevo, y se comprueba insertando de verdad.
  --    Si la TRANSACCION 1 no hubiera cerrado, esto moriria con «unsafe use of
  --    new value», que es justo el motivo de separarlas.
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (v_persona, 'verificacion_retirada', 'prueba 111', 'prueba de la migracion 111',
          '/dashboard/instructor/verificacion')
  RETURNING id INTO v_notif;

  RAISE NOTICE 'PRUEBA 1  el enum admite verificacion_retirada                  PASA';

  -- 2. Y se borra: la migracion no deja rastro
  DELETE FROM public.notifications WHERE id = v_notif;
  SELECT count(*) INTO v_n FROM public.notifications WHERE id = v_notif;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'PRUEBA 2 FALLIDA: queda la notificacion de prueba.';
  END IF;
  RAISE NOTICE 'PRUEBA 2  no queda ninguna notificacion de prueba               PASA';

  -- 3. Los tres tipos de verificacion existen ya
  SELECT count(*) INTO v_n
    FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
   WHERE t.typname = 'notification_type'
     AND e.enumlabel IN ('verificacion_aprobada', 'verificacion_rechazada', 'verificacion_retirada');
  IF v_n <> 3 THEN
    RAISE EXCEPTION 'PRUEBA 3 FALLIDA: hay % de los 3 tipos de verificacion, faltan valores.', v_n;
  END IF;
  RAISE NOTICE 'PRUEBA 3  los tres tipos de verificacion existen                PASA';

  RAISE NOTICE 'Las tres pruebas pasan. Ninguna fila queda creada ni modificada.';
END
$prueba$;

COMMIT;

-- ============================================================================
-- VERIFICACION
-- ============================================================================

SELECT
  (SELECT count(*) FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'notification_type'
      AND e.enumlabel IN ('verificacion_aprobada', 'verificacion_rechazada', 'verificacion_retirada')) AS tipos_de_verificacion_de_3,

  (SELECT count(*) FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'notification_type')                                       AS valores_del_enum,

  -- Nada movido
  (SELECT count(*) FROM public.notifications)                                    AS notificaciones,
  (SELECT count(*) FROM public.notifications WHERE title = 'prueba 111')          AS pruebas_que_quedan,
  (SELECT count(*) FROM public.instructor_certifications WHERE status = 'retirada') AS retiradas,

  CASE
    WHEN (SELECT count(*) FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
           WHERE t.typname = 'notification_type'
             AND e.enumlabel IN ('verificacion_aprobada', 'verificacion_rechazada', 'verificacion_retirada')) = 3
     AND (SELECT count(*) FROM public.notifications WHERE title = 'prueba 111') = 0
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                                            AS veredicto;
