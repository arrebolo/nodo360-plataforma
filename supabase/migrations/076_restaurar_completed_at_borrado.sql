-- ============================================================================
-- 076: devolver el completed_at que se borro solo el 27/09/2026
-- ============================================================================
-- ESTADO: PENDIENTE DE APLICAR.
--   Copia para pegar: tmp/076-aplicar.sql
--
-- LO QUE PASO, CON HORA
--   El 27/09/2026 a las 18:51:44, mientras se auditaban las matriculas, una
--   cuenta con el certificado NODO-20260115-B3M20 de "Fundamentos de Bitcoin"
--   completo una leccion. El curso habia pasado de 6 a 9 lecciones el 24/09,
--   asi que /api/progress calculo 7 de 9 = 78 %, vio que 78 < 100 y escribio
--   completed_at = NULL.
--
--   Resultado: una persona con su certificado emitido en enero y su matricula
--   diciendo que nunca termino el curso. No perdio nada que hubiera hecho; se
--   le borro la constancia de haberlo hecho.
--
--   Se vio en directo porque la fila desaparecio entre dos ejecuciones del
--   mismo diagnostico, con doce minutos de diferencia.
--
-- POR QUE ERA UN FALLO Y NO UNA DECISION
--   La postura la fijo la migracion 047 y la siguen la 052 y
--   recalcularMatriculasDelCurso: el certificado congela lo que se completo
--   entonces y sigue valiendo; el porcentaje refleja el presente. Por eso esos
--   tres caminos NO tocan completed_at. /api/progress si lo tocaba: dos
--   criterios distintos segun por donde pasara el dato.
--
--   El codigo se unifica en la misma PR que trae este fichero. Sin ese cambio,
--   restaurar la fecha aqui solo serviria hasta que esa persona completara otra
--   leccion.
--
-- DE DONDE SALE LA FECHA
--   2026-01-15T10:44:04, reconstruida y contrastada con tres fuentes:
--
--     1. El diagnostico del 27/09, ejecutado ANTES de que se borrara, leyo
--        completed_at = 2026-01-15T10:44:04 (truncado al segundo).
--     2. La ultima de las 6 lecciones que existian entonces se completo a las
--        10:42:55.048. La fecha es posterior, como debe.
--     3. El certificado se creo a las 10:44:03.815 y se emitio a las
--        10:44:05.103. La fecha cae entre las dos, que es justo donde
--        /api/progress escribe la marca.
--
--   LO QUE NO SE PUEDE RECUPERAR: los milisegundos. El diagnostico los
--   trunco y no hay otra copia. Se escribe :04.000. Para un campo que se
--   muestra como "15 de enero de 2026" la diferencia no existe; queda escrito
--   aqui para que nadie lo tome por un dato exacto al milisegundo.
--
-- QUE NO HACE
--   No toca el certificado, que nunca dejo de ser valido, ni el porcentaje,
--   que en 78 % es correcto: hoy lleva 7 de 9. La matricula queda en el estado
--   'ampliado' que la pantalla ya sabe contar desde la #222.
--
-- REEJECUTABLE: escribe siempre el mismo valor.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. La restauracion
-- ----------------------------------------------------------------------------
-- Se localiza por el certificado y no por el usuario: el numero es publico,
-- estable y no hace falta pegar aqui el id de nadie.
UPDATE public.course_enrollments e
   SET completed_at = '2026-01-15T10:44:04+00:00'::timestamptz
  FROM public.certificates c
 WHERE c.certificate_number = 'NODO-20260115-B3M20'
   AND e.user_id = c.user_id
   AND e.course_id = c.course_id;


-- ----------------------------------------------------------------------------
-- 2. La comprobacion. Es lo ultimo, asi que es lo que muestra el editor.
-- ----------------------------------------------------------------------------
-- QUE TIENE QUE SALIR en la unica fila:
--     completed_at   -> 2026-01-15 10:44:04+00
--     porcentaje     -> 78        (no se toca: hoy lleva 7 de 9)
--     lecciones      -> 7 de 9
--     certificado    -> NODO-20260115-B3M20, vigente
--     veredicto      -> TODO CORRECTO
SELECT
  e.completed_at,
  e.progress_percentage                                            AS porcentaje,
  (SELECT count(*) FROM public.user_progress p
     JOIN public.lessons l ON l.id = p.lesson_id
    WHERE p.user_id = e.user_id
      AND l.course_id = e.course_id
      AND p.is_completed)                                          AS lecciones_hechas,
  (SELECT count(*) FROM public.lessons l
    WHERE l.course_id = e.course_id)                               AS lecciones_totales,
  c.certificate_number                                             AS certificado,
  CASE WHEN c.revoked_at IS NULL THEN 'vigente' ELSE 'retirado' END AS estado_certificado,
  CASE
    WHEN e.completed_at = '2026-01-15T10:44:04+00:00'::timestamptz
     AND c.revoked_at IS NULL
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: completed_at = ' || COALESCE(e.completed_at::text, 'NULL')
  END                                                              AS veredicto
  FROM public.certificates c
  JOIN public.course_enrollments e
    ON e.user_id = c.user_id
   AND e.course_id = c.course_id
 WHERE c.certificate_number = 'NODO-20260115-B3M20';
