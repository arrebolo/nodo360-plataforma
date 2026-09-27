-- ============================================================================
-- 078: dejar escrito que era cada tabla parada y por que se paro
-- ============================================================================
-- ESTADO: PENDIENTE DE APLICAR.
--   Copia para pegar: tmp/078-aplicar.sql
--
-- NO BORRA NADA. Ni una tabla, ni una fila, ni una politica. Solo escribe
-- COMMENT ON TABLE.
--
-- POR QUE
--   La auditoria del 27/09/2026 conto 53 tablas y 30 vacias: el 57 %. Detras de
--   cada bloque hay semanas de trabajo -mentorias, gobernanza, proyectos,
--   pagos, referidos- y ninguna forma de saber, mirando la base, si eso estaba
--   a medias, abandonado o esperando algo.
--
--   Borrarlas seria tirar trabajo por una limpieza estetica. Dejarlas mudas es
--   lo que obliga a alguien, dentro de un ano, a abrir cinco ficheros para
--   deducir si `mentor_reviews` se puede tocar. Un comentario cuesta una linea
--   y contesta la pregunta en el sitio donde se hace.
--
--   Las paginas que las anunciaban salen del menu en la misma PR. El codigo se
--   queda entero: esto no cierra ninguna puerta, solo deja de prometer.
--
-- COMO SE LEEN DESPUES
--   SELECT relname, obj_description(oid) FROM pg_class
--    WHERE relkind = 'r' AND relnamespace = 'public'::regnamespace
--      AND obj_description(oid) LIKE 'PARADA%';
--
-- REEJECUTABLE: escribe siempre el mismo texto.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- Mentorias  ·  4 tablas, 0 filas
-- ----------------------------------------------------------------------------
COMMENT ON TABLE public.mentors IS
  'PARADA (078, 28/09/2026). Perfil de mentor. El bloque de mentorias se construyo entero -tablas, RLS y paginas /mentores y /mentoria- y nunca se puso en marcha: harian falta mentores reales y un circuito de solicitud. Con 20 alumnos externos no habia a quien acompanar. Las paginas salen del menu y llevan noindex; el codigo se conserva.';

COMMENT ON TABLE public.mentor_applications IS
  'PARADA (078, 28/09/2026). Solicitudes para ser mentor. Ver public.mentors.';

COMMENT ON TABLE public.mentorship_requests IS
  'PARADA (078, 28/09/2026). Peticiones de mentoria de un alumno. Ver public.mentors.';

COMMENT ON TABLE public.mentor_reviews IS
  'PARADA (078, 28/09/2026). Valoraciones de mentores. Ver public.mentors.';


-- ----------------------------------------------------------------------------
-- Gobernanza  ·  3 tablas vacias + governance_proposals con 1 fila de prueba
-- ----------------------------------------------------------------------------
COMMENT ON TABLE public.proposals IS
  'PARADA (078, 28/09/2026). Propuestas de gobernanza. El bloque funciona pero no tiene sentido a esta escala: votar decisiones de la plataforma entre 20 personas, de las que 12 han completado alguna leccion, no es gobernanza. Se retoma cuando haya una comunidad que gobernar. /gobernanza sale del menu y lleva noindex.';

COMMENT ON TABLE public.proposal_votes IS
  'PARADA (078, 28/09/2026). Votos de las propuestas. Ver public.proposals.';

COMMENT ON TABLE public.votes IS
  'PARADA (078, 28/09/2026). Tabla de votos anterior a proposal_votes. Ver public.proposals.';

COMMENT ON TABLE public.governance_proposals IS
  'PARADA (078, 28/09/2026). Propuestas de gobernanza; tiene 1 fila de prueba, no de uso real. Ver public.proposals.';


-- ----------------------------------------------------------------------------
-- Proyectos comunitarios  ·  3 tablas, 0 filas
-- ----------------------------------------------------------------------------
COMMENT ON TABLE public.projects IS
  'PARADA (078, 28/09/2026). Proyectos de la comunidad. Existen las tablas (migracion 023), 11 rutas API bajo /api/projects y todo lib/projects/, pero la unica pagina es /proyectos, que dice "en preparacion": no hay formulario, ni listado, ni panel de revision. Se dejo a medias, no se abandono por decision.';

COMMENT ON TABLE public.project_collaborators IS
  'PARADA (078, 28/09/2026). Colaboradores de un proyecto. Ver public.projects.';

COMMENT ON TABLE public.project_applications IS
  'PARADA (078, 28/09/2026). Solicitudes para colaborar. Ver public.projects.';


-- ----------------------------------------------------------------------------
-- Cobro  ·  entitlements se CONSERVA; el resto, parado
-- ----------------------------------------------------------------------------
COMMENT ON TABLE public.entitlements IS
  'SIN ESTRENAR (078, 28/09/2026). Permisos de acceso a cursos de pago. La tabla y hasEntitlement() estan escritos y el muro premium esta puesto en la ficha y en la leccion, pero NO se ha ejercitado nunca: 0 filas y is_premium = false en los 15 cursos. Un muro que no ha parado a nadie no es un muro comprobado. NO se considera parada: es la pieza que haria falta el dia que haya contenido de pago.';

COMMENT ON TABLE public.payments IS
  'PARADA (078, 28/09/2026). Pagos. No hay pasarela ni cobros, y /pricing dice que todo es gratuito. Ver public.entitlements para la parte que si se conserva.';

COMMENT ON TABLE public.orders IS
  'PARADA (078, 28/09/2026). Pedidos. Ver public.payments.';

COMMENT ON TABLE public.pricing_plans IS
  'PARADA (078, 28/09/2026). Planes de precio. Tiene 2 filas de un plan Premium de 23 EUR que nunca existio; /pricing dejo de leer esta tabla en la #220. Las filas se conservan como registro de lo que se llego a anunciar.';

COMMENT ON TABLE public.subscriptions IS
  'PARADA (078, 28/09/2026). Suscripciones. 1 fila de prueba. Ver public.payments.';


-- ----------------------------------------------------------------------------
-- Instructores y referidos  ·  4 tablas, 0 filas
-- ----------------------------------------------------------------------------
COMMENT ON TABLE public.instructor_applications IS
  'PARADA (078, 28/09/2026). Solicitudes para ser instructor. Desde la #228 /instructores explica el circuito y pide un correo a instructores@nodo360.com: con este volumen, un correo funciona y un formulario con estado seria mantener algo por mantenerlo.';

COMMENT ON TABLE public.instructor_certifications IS
  'PARADA (078, 28/09/2026). Certificaciones de instructor. No existe el circuito que las emitiria. Ver public.instructor_applications.';

COMMENT ON TABLE public.referrals IS
  'PARADA (078, 28/09/2026). Referidos. Hay paginas en el panel de instructor, pero ningun enlace se ha creado nunca. Sin trafico que referir, no habia nada que medir.';

COMMENT ON TABLE public.referral_links IS
  'PARADA (078, 28/09/2026). Enlaces de referido. Ver public.referrals.';


-- ----------------------------------------------------------------------------
-- Social  ·  los comentarios SE TERMINAN; el resto, parado
-- ----------------------------------------------------------------------------
COMMENT ON TABLE public.lesson_comments IS
  'PENDIENTE DE TERMINAR (078, 28/09/2026). Comentarios de cada leccion. NO es una tabla parada: el componente LessonComments existe y se pinta a quien tiene sesion, y desde la #219 las lecciones se leen sin cuenta con un aviso que invita a registrarse para comentar. Esta a 0 porque nadie ha escrito todavia, no porque el circuito falte.';

COMMENT ON TABLE public.comments IS
  'PARADA (078, 28/09/2026). Tabla de comentarios anterior a lesson_comments. Duplicada; no la usa nadie.';

COMMENT ON TABLE public.bookmarks IS
  'PARADA (078, 28/09/2026). Marcadores de lecciones. Nunca tuvo interfaz.';

COMMENT ON TABLE public.saved_lessons IS
  'PARADA (078, 28/09/2026). Lecciones guardadas. Duplica a bookmarks; ninguna de las dos tuvo interfaz.';

COMMENT ON TABLE public.user_notes IS
  'PARADA (078, 28/09/2026). Notas sueltas. Las notas que SI se usan son user_lesson_notes, que cuelgan de una leccion.';

COMMENT ON TABLE public.streaks IS
  'PARADA (078, 28/09/2026). Rachas de dias seguidos. La racha que se usa vive en user_gamification_stats.current_streak; esta tabla nunca llego a escribirse.';


-- ----------------------------------------------------------------------------
-- Operacion  ·  registros que convendria terminar
-- ----------------------------------------------------------------------------
COMMENT ON TABLE public.email_log IS
  'SIN ESTRENAR (078, 28/09/2026). Registro de correos enviados. Hay 10 plantillas en lib/email/ y ninguna escribe aqui. Se noto el 27/09 al enviar cinco avisos de certificado retirado: quedo el id de Resend en la consola y nada mas. Conviene terminarla antes de que haya volumen.';

COMMENT ON TABLE public.audit_log IS
  'PARADA (078, 28/09/2026). Registro de acciones. Sin escritores.';

COMMENT ON TABLE public.activity_log IS
  'PARADA (078, 28/09/2026). Registro de actividad. Sin escritores. Duplica a audit_log.';

COMMENT ON TABLE public.feedback IS
  'PARADA (078, 28/09/2026). Comentarios de usuarios. El que si se usa es beta_feedback, con 6 filas.';


-- ----------------------------------------------------------------------------
-- Examen  ·  tablas del diseño anterior
-- ----------------------------------------------------------------------------
COMMENT ON TABLE public.quizzes IS
  'PARADA (078, 28/09/2026). Diseno anterior del examen, con el quiz como entidad propia. El que funciona cuelga las preguntas del MODULO: quiz_questions.module_id y quiz_attempts.module_id, y el examen final de un curso se arma con las preguntas de todos sus modulos (lib/quiz/checkCourseQuiz.ts).';

COMMENT ON TABLE public.course_quizzes IS
  'PARADA (078, 28/09/2026). Enlace curso-examen del diseno anterior. Ver public.quizzes.';

COMMENT ON TABLE public.quiz_answers IS
  'PARADA (078, 28/09/2026). Respuestas del diseno anterior. Las respuestas reales van en la columna answers (jsonb) de quiz_attempts. Ver public.quizzes.';


-- ----------------------------------------------------------------------------
-- La comprobacion. Es lo ultimo, asi que es lo que muestra el editor.
-- ----------------------------------------------------------------------------
-- QUE TIENE QUE SALIR:
--     comentadas      -> 33   (30 vacias + 3 con filas de prueba)
--     paradas         -> 27
--     sin_estrenar    -> 2     (entitlements, email_log)
--     por_terminar    -> 1     (lesson_comments)
--     tablas_borradas -> 0     este fichero no borra nada
--     veredicto       -> TODO CORRECTO
SELECT
  count(*)                                                          AS comentadas,
  count(*) FILTER (WHERE d LIKE 'PARADA%')                          AS paradas,
  count(*) FILTER (WHERE d LIKE 'SIN ESTRENAR%')                    AS sin_estrenar,
  count(*) FILTER (WHERE d LIKE 'PENDIENTE DE TERMINAR%')           AS por_terminar,
  (SELECT count(*) FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE')    AS tablas_totales,
  CASE
    WHEN count(*) = 33 THEN 'TODO CORRECTO'
    ELSE 'REVISAR: se han comentado ' || count(*) || ', esperaba 33'
  END                                                               AS veredicto
  FROM (
    SELECT obj_description(c.oid) AS d
      FROM pg_class c
     WHERE c.relkind = 'r'
       AND c.relnamespace = 'public'::regnamespace
       AND obj_description(c.oid) ~ '^(PARADA|SIN ESTRENAR|PENDIENTE DE TERMINAR)'
  ) t;
