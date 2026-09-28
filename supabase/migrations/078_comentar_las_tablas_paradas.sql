-- ============================================================================
-- 078: dejar escrito qué era cada tabla parada y por qué se paró
-- ============================================================================
-- ESTADO: APLICADA el 28/09/2026. Resultado de su verificación:
--     comentadas 13 · paradas 11 · sin_estrenar 1 · por_terminar 1
--     tablas_totales 77 · veredicto TODO CORRECTO
--
--   Ese 77 corrige por segunda vez el censo. Ver más abajo: NO son 34.
--
-- Esta versión CORRIGE la anterior, que FALLÓ:
--
--     ERROR 42P01: relation "public.mentors" does not exist
--
--   Falló en su PRIMERA sentencia, así que no dejó ni un comentario guardado.
--   Comprobado leyendo el documento OpenAPI de PostgREST, que trae el
--   COMMENT de cada tabla en el campo "description": ninguna de las 33 tenía
--   comentario. No se aplicó a medias; no se aplicó en absoluto.
--
--   Copia para pegar: tmp/078-aplicar.sql
--
-- POR QUÉ FALLÓ: EL CENSO DE LA AUDITORÍA ESTABA MAL
--   La auditoría del 27/09/2026 dijo «53 tablas, 30 vacías: el 57 %». Es falso,
--   y la causa es una trampa de PostgREST que conviene dejar por escrito:
--
--       db.from('mentors').select('*', { count: 'exact', head: true })
--         ->  error: NINGUNO,  count: null
--
--       db.from('mentors').select('*').limit(1)
--         ->  Could not find the table 'public.mentors' in the schema cache
--
--   Con `head: true` una tabla INEXISTENTE no da error: devuelve count null,
--   que el censo leyó como «existe y tiene 0 filas». Las 20 tablas que nunca
--   existieron entraron en la cuenta como tablas vacías. El mismo resultado
--   sale con un nombre inventado.
--
--   DE LAS 53 QUE COMPROBÉ, con select de verdad:
--       existen              34
--       de ellas vacías      10
--       no existen           20
--
--   Y AQUÍ EL SEGUNDO ERROR, que salió al aplicar esta migración: ese 34 NO es
--   el número de tablas de la base. Es cuántas existen DE LAS 53 QUE YO
--   NOMBRÉ, y esa lista la escribí a mano, de memoria.
--
--   information_schema dice la verdad:
--       tablas base en public   77
--
--   O sea que hay unas 43 tablas que nunca miré porque no se me ocurrió su
--   nombre. «10 vacías de 34, el 29 %» no es un porcentaje de la base: es un
--   porcentaje de mi muestra, y no se puede extrapolar.
--
--   LA LECCIÓN: un censo se hace enumerando el catálogo, no comprobando una
--   lista de nombres que uno cree recordar. La consulta que había que ejecutar
--   desde el principio, y que da el censo exacto en una sola fila:
--
--     SELECT count(*) AS tablas,
--            count(*) FILTER (WHERE filas = 0) AS vacias,
--            string_agg(relname, ', ' ORDER BY relname)
--              FILTER (WHERE filas = 0)        AS las_vacias
--       FROM (
--         SELECT c.relname,
--                (xpath('/row/c/text()', query_to_xml(
--                   format('SELECT count(*) AS c FROM public.%I', c.relname),
--                   false, true, '')))[1]::text::bigint AS filas
--           FROM pg_class c
--          WHERE c.relkind = 'r'
--            AND c.relnamespace = 'public'::regnamespace
--       ) t;
--
--   Lo que sí sigue en pie: los bloques que este fichero comenta están
--   parados, y eso se comprobó tabla por tabla. Lo que no sigue en pie es
--   cualquier porcentaje sobre el total.
--
-- LAS 20 QUE NO EXISTEN
--   No se pueden comentar, pero conviene que quede escrito que no están, para
--   que nadie las busque ni las dé por vacías otra vez:
--
--     mentorías    mentors, mentorship_requests, mentor_reviews
--     gobernanza   proposals, proposal_votes, votes
--     proyectos    project_applications
--     cobro        payments, orders
--     instructor   instructor_applications
--     referidos    referrals
--     social       comments, saved_lessons, streaks
--     operación    email_log, audit_log, activity_log, feedback
--     examen       quizzes, quiz_answers
--
--   Dos consecuencias que cambian conclusiones del informe:
--
--   1. De las mentorías solo existe `mentor_applications`. El bloque está
--      MENOS construido de lo que parecía: no hay perfil de mentor, ni
--      solicitudes de acompañamiento, ni valoraciones. Las páginas /mentores y
--      /mentoria prometían sobre tablas que no se llegaron a crear.
--
--   2. No existe NINGUNA tabla de registro: ni email_log, ni audit_log, ni
--      activity_log. Los 10 envíos de lib/email/ no es que no escriban en su
--      registro: es que no hay registro. Se notó el 27/09 al enviar cinco
--      avisos de certificado retirado y quedar solo el id de Resend en la
--      consola. Esto es deuda a crear, no una tabla a terminar.
--
-- QUÉ HACE ESTE FICHERO
--   Un COMMENT ON TABLE por cada una de las 13 tablas paradas que EXISTEN: las
--   10 vacías DE ESA LISTA más 3 con filas de prueba. NO BORRA NADA: ni una
--   fila, ni una política.
--
--   Cada comentario se escribe dentro de una guarda `to_regclass(...) IS NOT
--   NULL`, porque COMMENT ON TABLE no admite IF EXISTS. Si una tabla se borra
--   mañana, este fichero se salta su comentario en lugar de abortar y dejar el
--   resto sin escribir, que es exactamente lo que pasó la primera vez.
--
--   Borrarlas sería tirar trabajo por una limpieza estética. Dejarlas mudas es
--   lo que obliga a alguien, dentro de un año, a abrir cinco ficheros para
--   deducir si `mentor_applications` se puede tocar. Un comentario cuesta una
--   línea y contesta la pregunta en el sitio donde se hace.
--
--   Las páginas que las anunciaban salen del menú en la misma PR. El código se
--   queda entero: esto no cierra ninguna puerta, solo deja de prometer.
--
-- CÓMO SE LEEN DESPUÉS
--   SELECT relname, obj_description(oid) FROM pg_class
--    WHERE relkind = 'r' AND relnamespace = 'public'::regnamespace
--      AND obj_description(oid) LIKE 'PARADA%';
--
-- REEJECUTABLE: escribe siempre el mismo texto y tolera que falte una tabla.
-- ============================================================================


DO $do$
DECLARE
  t             RECORD;
  v_escritas    INT := 0;
  v_omitidas    TEXT[] := '{}';
BEGIN
  FOR t IN
    SELECT *
      FROM (VALUES

      -- ── Mentorías ──────────────────────────────────────────────────────────
      -- Solo existe esta. Ver la cabecera: las otras tres nunca se crearon.
      ('mentor_applications',
       'PARADA (078, 28/09/2026). Solicitudes para ser mentor, y única tabla que'
       || ' existe del bloque de mentorías: mentors, mentorship_requests y'
       || ' mentor_reviews NO se crearon nunca. Se escribieron las páginas'
       || ' /mentores y /mentoria y el circuito de votación de solicitudes, pero'
       || ' no el acompañamiento en sí. Con 20 alumnos externos no había a quién'
       || ' acompañar. Las páginas salen del menú y llevan noindex; el código se'
       || ' conserva.'),

      -- ── Gobernanza ─────────────────────────────────────────────────────────
      -- Solo existe esta. proposals, proposal_votes y votes no existen.
      ('governance_proposals',
       'PARADA (078, 28/09/2026). Propuestas de gobernanza; 1 fila de prueba, no'
       || ' de uso real. Única tabla del bloque que existe: proposals,'
       || ' proposal_votes y votes NO se crearon nunca. No tiene sentido a esta'
       || ' escala: votar decisiones de la plataforma entre 20 personas, de las que'
       || ' 12 han completado alguna lección, no es gobernanza. Se retoma cuando'
       || ' haya una comunidad que gobernar. /gobernanza sale del menú y lleva'
       || ' noindex.'),

      -- ── Proyectos comunitarios ─────────────────────────────────────────────
      ('projects',
       'PARADA (078, 28/09/2026). Proyectos de la comunidad. Existen las tablas'
       || ' (migración 023), 11 rutas API bajo /api/projects y todo lib/projects/,'
       || ' pero la única página es /proyectos, que dice "en preparación": no hay'
       || ' formulario, ni listado, ni panel de revisión. Se dejó a medias, no se'
       || ' abandonó por decisión. project_applications NO existe.'),

      ('project_collaborators',
       'PARADA (078, 28/09/2026). Colaboradores de un proyecto. Ver'
       || ' public.projects.'),

      -- ── Cobro  ·  entitlements se CONSERVA; el resto, parado ───────────────
      ('entitlements',
       'SIN ESTRENAR (078, 28/09/2026). Permisos de acceso a cursos de pago. La'
       || ' tabla y hasEntitlement() están escritos y el muro premium está puesto'
       || ' en la ficha y en la lección, pero NO se ha ejercitado nunca: 0 filas y'
       || ' is_premium = false en los 15 cursos. Un muro que no ha parado a nadie'
       || ' no es un muro comprobado. NO se considera parada: es la pieza que haría'
       || ' falta el día que haya contenido de pago.'),

      ('pricing_plans',
       'PARADA (078, 28/09/2026). Planes de precio. Tiene 2 filas de un plan'
       || ' Premium de 23 EUR que nunca existió; /pricing dejó de leer esta tabla'
       || ' en la #220. Las filas se conservan como registro de lo que se llegó a'
       || ' anunciar. No hay pasarela de pago: payments y orders NO existen.'),

      ('subscriptions',
       'PARADA (078, 28/09/2026). Suscripciones; 1 fila de prueba. No hay'
       || ' pasarela ni cobros, y /pricing dice que todo es gratuito. Ver'
       || ' public.pricing_plans.'),

      -- ── Instructores y referidos ───────────────────────────────────────────
      ('instructor_certifications',
       'PARADA (078, 28/09/2026). Certificaciones de instructor. No existe el'
       || ' circuito que las emitiría, ni la tabla instructor_applications que'
       || ' recogería las solicitudes. Desde la #231 /instructores explica el'
       || ' circuito y pide un correo a instructores@nodo360.com: con este'
       || ' volumen, un correo funciona y un formulario con estado sería mantener'
       || ' algo por mantenerlo.'),

      ('referral_links',
       'PARADA (078, 28/09/2026). Enlaces de referido. Hay páginas en el panel'
       || ' de instructor, pero ningún enlace se ha creado nunca: sin tráfico que'
       || ' referir, no había nada que medir. La tabla referrals, que guardaría las'
       || ' conversiones, NO existe.'),

      -- ── Social  ·  los comentarios SE TERMINAN; el resto, parado ───────────
      ('lesson_comments',
       'PENDIENTE DE TERMINAR (078, 28/09/2026). Comentarios de cada lección. NO'
       || ' es una tabla parada: el componente LessonComments existe y se pinta a'
       || ' quien tiene sesión, y desde la #219 las lecciones se leen sin cuenta'
       || ' con un aviso que invita a registrarse para comentar. Está a 0 porque'
       || ' nadie ha escrito todavía, no porque el circuito falte.'),

      ('bookmarks',
       'PARADA (078, 28/09/2026). Marcadores de lecciones. Nunca tuvo interfaz.'
       || ' La tabla saved_lessons, que la duplicaba, NO existe.'),

      ('user_notes',
       'PARADA (078, 28/09/2026). Notas sueltas. Las notas que SÍ se usan son'
       || ' user_lesson_notes, que cuelgan de una lección.'),

      -- ── Examen  ·  tablas del diseño anterior ──────────────────────────────
      ('course_quizzes',
       'PARADA (078, 28/09/2026). Enlace curso-examen del diseño anterior, en el'
       || ' que el quiz era una entidad propia; sus tablas quizzes y quiz_answers'
       || ' NO existen. El diseño que funciona cuelga las preguntas del MÓDULO:'
       || ' quiz_questions.module_id y quiz_attempts.module_id, y el examen final'
       || ' de un curso se arma con las preguntas de todos sus módulos'
       || ' (lib/quiz/checkCourseQuiz.ts). Las respuestas reales van en la columna'
       || ' answers (jsonb) de quiz_attempts.')

      ) AS v(tabla, comentario)
  LOOP
    IF to_regclass('public.' || quote_ident(t.tabla)) IS NULL THEN
      v_omitidas := v_omitidas || t.tabla;
    ELSE
      EXECUTE format('COMMENT ON TABLE public.%I IS %L', t.tabla, t.comentario);
      v_escritas := v_escritas + 1;
    END IF;
  END LOOP;

  RAISE NOTICE 'comentarios escritos: %', v_escritas;
  IF array_length(v_omitidas, 1) > 0 THEN
    RAISE NOTICE 'omitidas porque ya no existen: %', array_to_string(v_omitidas, ', ');
  END IF;
END
$do$;


-- ----------------------------------------------------------------------------
-- La comprobación. Es lo último, así que es lo que muestra el editor.
-- ----------------------------------------------------------------------------
-- QUÉ TIENE QUE SALIR, en una sola fila:
--     comentadas      -> 13   (las 10 vacías que existen + 3 con filas de prueba)
--     paradas         -> 11
--     sin_estrenar    -> 1    (entitlements)
--     por_terminar    -> 1    (lesson_comments)
--     tablas_totales  -> 77   tablas base en public, el total de verdad
--     veredicto       -> TODO CORRECTO
SELECT
  count(*)                                                          AS comentadas,
  count(*) FILTER (WHERE d LIKE 'PARADA%')                          AS paradas,
  count(*) FILTER (WHERE d LIKE 'SIN ESTRENAR%')                     AS sin_estrenar,
  count(*) FILTER (WHERE d LIKE 'PENDIENTE DE TERMINAR%')            AS por_terminar,
  (SELECT count(*) FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE')    AS tablas_totales,
  CASE
    WHEN count(*) = 13 THEN 'TODO CORRECTO'
    ELSE 'REVISAR: se han comentado ' || count(*) || ', esperaba 13'
  END                                                               AS veredicto
  FROM (
    SELECT obj_description(c.oid) AS d
      FROM pg_class c
     WHERE c.relkind = 'r'
       AND c.relnamespace = 'public'::regnamespace
       AND obj_description(c.oid) ~ '^(PARADA|SIN ESTRENAR|PENDIENTE DE TERMINAR)'
  ) t;
