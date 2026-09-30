-- ============================================================================
-- MIGRACION 112: los dos tipos de notificacion que el codigo usa y el enum no tenia
--
-- EL FALLO, QUE LLEVABA AHI DESDE SIEMPRE
-- types/database.ts declaraba quince valores en NotificationType y el enum de la
-- base tenia trece. Los dos que faltaban se usan en caminos VIVOS:
--
--   course_changes_requested   broadcastCourseChangesRequested(), llamado desde
--                              /dashboard/mentor/cursos/pendientes/[id] cuando un
--                              mentor pide cambios en un curso.
--   lesson_comment_new         app/api/lessons/[lessonId]/comments/route.ts,
--                              cuando alguien comenta una leccion.
--
-- Los dos fallaban con «22P02 invalid input value for enum notification_type», y
-- createInAppNotification() captura el error y devuelve false. Resultado: cuando un
-- mentor pedia cambios, el instructor NO recibia notificacion; y cuando alguien
-- comentaba una leccion, tampoco. En silencio, sin un solo error visible.
--
-- COMO SE ENCONTRO, y merece anotarse: el usuario pego el resultado de la 111 y
-- decia «valores_del_enum 13» donde mi cabecera habia predicho 15. Yo habia
-- escrito ese 15 a ojo en vez de medirlo. Al mirar por que no cuadraba salio esto.
-- La cifra inventada en una cabecera acabo delatando un fallo de verdad, pero por
-- casualidad: si hubiera acertado el numero a ojo, seguiria ahi.
--
-- DOS TRANSACCIONES, como en la 108 y la 111: Postgres no deja USAR un valor de
-- enum en la misma transaccion en la que se añade. La primera los añade y cierra;
-- la segunda los prueba insertando notificaciones de verdad y borrandolas.
--
-- NO BORRA NI UNA FILA. Es reejecutable. Y se prueba a si misma.
-- ============================================================================

-- =====================================================
-- TRANSACCION 1: los valores, y nada mas
-- =====================================================

BEGIN;

ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'course_changes_requested';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'lesson_comment_new';

COMMIT;

-- =====================================================
-- TRANSACCION 2: la prueba, que ya puede usarlos
-- =====================================================

BEGIN;

DO $prueba$
DECLARE
  v_persona uuid;
  v_notif   uuid;
  v_n       integer;
  v_tipo    text;
  TIPOS constant text[] := ARRAY['course_changes_requested', 'lesson_comment_new'];
BEGIN
  SELECT id INTO v_persona FROM public.users ORDER BY created_at LIMIT 1;
  IF v_persona IS NULL THEN
    RAISE EXCEPTION 'La prueba necesita al menos un usuario.';
  END IF;

  -- 1 y 2. Cada tipo nuevo, insertado de verdad y borrado.
  FOREACH v_tipo IN ARRAY TIPOS LOOP
    EXECUTE format(
      'INSERT INTO public.notifications (user_id, type, title, message) VALUES ($1, %L, %L, %L) RETURNING id',
      v_tipo, 'prueba 112', 'prueba de la migracion 112'
    ) INTO v_notif USING v_persona;

    IF v_notif IS NULL THEN
      RAISE EXCEPTION 'PRUEBA FALLIDA: no se pudo insertar una notificacion de tipo «%».', v_tipo;
    END IF;

    DELETE FROM public.notifications WHERE id = v_notif;
    RAISE NOTICE 'PRUEBA    el enum admite «%» y la fila de prueba se borra   PASA', v_tipo;
  END LOOP;

  -- 3. No queda ninguna fila de prueba
  SELECT count(*) INTO v_n FROM public.notifications WHERE title = 'prueba 112';
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'PRUEBA 3 FALLIDA: quedan % notificaciones de prueba.', v_n;
  END IF;
  RAISE NOTICE 'PRUEBA 3  no queda ninguna notificacion de prueba               PASA';

  -- 4. Y AHORA EL ENUM CUBRE LOS QUINCE VALORES QUE DECLARA TYPESCRIPT.
  --    Esto es lo que de verdad cierra el desfase: si mañana alguien añade un
  --    valor al tipo de TS y no a la base, esta cuenta lo delata.
  SELECT count(*) INTO v_n
    FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
   WHERE t.typname = 'notification_type';
  IF v_n <> 15 THEN
    RAISE EXCEPTION 'PRUEBA 4 FALLIDA: el enum tiene % valores, esperaba 15.', v_n;
  END IF;
  RAISE NOTICE 'PRUEBA 4  el enum tiene los 15 valores que declara TypeScript   PASA';

  RAISE NOTICE 'Las pruebas pasan. Ninguna fila queda creada ni modificada.';
END
$prueba$;

COMMIT;

-- ============================================================================
-- VERIFICACION
-- ============================================================================

SELECT
  (SELECT count(*) FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'notification_type')                                       AS valores_del_enum,

  (SELECT count(*) FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'notification_type'
      AND e.enumlabel IN ('course_changes_requested', 'lesson_comment_new'))      AS los_dos_que_faltaban,

  (SELECT count(*) FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'notification_type'
      AND e.enumlabel IN ('verificacion_aprobada', 'verificacion_rechazada', 'verificacion_retirada')) AS los_de_verificacion_de_3,

  (SELECT count(*) FROM public.notifications)                                    AS notificaciones,
  (SELECT count(*) FROM public.notifications WHERE title = 'prueba 112')          AS pruebas_que_quedan,

  CASE
    WHEN (SELECT count(*) FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
           WHERE t.typname = 'notification_type') = 15
     AND (SELECT count(*) FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
           WHERE t.typname = 'notification_type'
             AND e.enumlabel IN ('course_changes_requested', 'lesson_comment_new')) = 2
     AND (SELECT count(*) FROM public.notifications WHERE title = 'prueba 112') = 0
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                                            AS veredicto;
