-- ============================================================================
-- 037 APLICAR — una recompensa por usuario y fuente
--
-- EL PROBLEMA, CON DATOS
-- En xp_events hay 588 filas y 569 NO registran ninguna fuente: related_id,
-- lesson_id y course_id están a null. awardXP() recibía el contexto (lessonId,
-- courseId) pero solo lo usaba para redactar la descripción. Sin fuente no hay
-- forma de saber si una recompensa ya se concedió, y por eso repetir un curso
-- la volvía a sumar.
--
-- Y HAY UN SEGUNDO PROBLEMA, MAYOR
-- Cada lección genera DOS eventos con un segundo de diferencia:
--     10:55:46  lesson_completed  50 XP  desc='Lección completada: <uuid>'
--     10:55:45  lesson_completed  10 XP  desc=null
-- El de 50 XP es awardXP() desde /api/progress. El de 10 XP viene de la base
-- de datos y no lo he podido identificar desde fuera: no coincide con
-- award_xp_on_lesson_complete tal como está en supabase/migrations/004, que
-- sí rellena related_id y description. Ese camino se cierra en la 038, cuando
-- tenga el cuerpo de las funciones vivas (ver 037-leer.sql).
--
-- Es decir: cada lección concede 60 XP en lugar de 50, y eso pasa siempre, no
-- solo al repetir.
--
-- LO QUE SÍ CIERRA ESTA MIGRACIÓN
-- El índice único hace idempotente toda concesión que registre su fuente.
-- Combinado con el cambio de awardXP() de esta misma rama, que ya guarda
-- related_id y hace ON CONFLICT DO NOTHING, las lecciones, los quiz y los
-- cursos dejan de sumar dos veces por la vía del código.
--
-- POR QUÉ EL ÍNDICE NO ES PARCIAL
-- En Postgres los nulos no chocan entre sí en un índice único, así que las 569
-- filas sin fuente no lo impiden y las concesiones que legítimamente se repiten
-- (ajustes de admin, rachas diarias) siguen funcionando. Además, un índice
-- parcial no serviría: ON CONFLICT no puede inferirlo sin repetir su
-- predicado, y PostgREST no permite escribirlo.
--
-- Comprobado antes de escribir esto: de las 19 filas que sí tienen related_id,
-- ninguna repite la clave. El índice entra sin conflictos.
--
-- Fecha: 22/09/2026
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Una recompensa por usuario, tipo y fuente
-- ----------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS xp_events_fuente_unica
  ON public.xp_events (user_id, event_type, related_id);

COMMENT ON INDEX public.xp_events_fuente_unica IS
  'Una recompensa por usuario y fuente. related_id es la leccion, el quiz o el curso. Los nulos no chocan: las concesiones sin fuente (ajustes, rachas) pueden repetirse.';

-- ----------------------------------------------------------------------------
-- 2. (retirado)
--    Aqui habia un indice unico sobre certificates (user_id, course_id, type).
--    Sobraba: 037-leer.sql revelo que la tabla ya tiene TRES indices unicos
--    para lo mismo (certificates_user_course_unique,
--    unique_user_course_certificate y certificates_unique_course_user). Un
--    segundo certificado por curso ya era imposible.
-- ----------------------------------------------------------------------------

COMMIT;
