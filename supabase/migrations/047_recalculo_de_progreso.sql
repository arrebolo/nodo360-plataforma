-- ============================================================================
-- 047: recalcula el progreso de las matriculas desfasadas por contenido nuevo
-- ============================================================================
-- ESTADO: APLICADA EN PRODUCCION EL 24/09/2026, VERSIONADA EL 25/09/2026.
--   Se aplico por PostgREST y el fichero no llego a escribirse. El hueco lo
--   destapo la revision para la v6 del prompt maestro: entre la 046 y la 048
--   faltaba un numero. Esto lo cierra, reconstruido desde el respaldo
--   (C:/Users/alber/backups-sql/047-volver-atras.sql.bak) y el estado actual
--   de la base, que coinciden.
--
-- EL PROBLEMA
--   progress_percentage se guarda en course_enrollments y solo se recalcula
--   cuando alguien completa una leccion. Al ampliar cursos de 6 a 9 lecciones,
--   quien no habia vuelto desde entonces conservaba un valor calculado sobre
--   el total antiguo: habia matriculas diciendo 100% con 3 de 9 hechas.
--
-- LA POSTURA
--   El certificado congela lo que se completo entonces y sigue siendo valido;
--   el porcentaje refleja el presente. Por eso NO se toca completed_at, ni al
--   aplicar ni al revertir.
--
-- QUE NO SE DISPARA
--   trigger_auto_certificate_on_completion es AFTER UPDATE OF completed_at,
--   asi que tocar solo el porcentaje no emite ningun certificado. Y el aviso
--   de curso completado vive en /api/progress, no en un disparador, asi que un
--   UPDATE directo no manda notificaciones a nadie. Comprobado antes y despues
--   de aplicar: 16 certificados y 0 notificaciones nuevas.
--
-- QUE SE DEJO FUERA, A PROPOSITO
--   Otras 4 matriculas al 100% cuyo progreso nunca se registro entero, y no
--   por contenido nuevo: tres en "Gestion del riesgo" (3 de 6) y una en
--   "Introduccion al trading" (5 de 6), todas con certificado de enero en
--   formato antiguo. Ahi no hay nada nuevo que consumir, asi que bajarles el
--   porcentaje diria "has perdido progreso" sin que sea cierto. Anotadas en
--   docs/PLAN-REFORMA.md.
-- ============================================================================

BEGIN;

UPDATE public.course_enrollments SET progress_percentage = 67
 WHERE id = 'e6eec738-aa69-4b20-8eb8-95b620fa1680';  -- fundamentos-de-bitcoin, ab354bca, completed_at intacto

UPDATE public.course_enrollments SET progress_percentage = 67
 WHERE id = 'ac3ae29b-4031-4dc9-b265-9d9a5bfb381a';  -- uso-practico-de-bitcoin, ab354bca, completed_at intacto

UPDATE public.course_enrollments SET progress_percentage = 67
 WHERE id = '64ab942e-2c4c-4ed0-b335-9d9e39e06e5e';  -- fundamentos-de-bitcoin, 34c7dd0a, completed_at intacto

UPDATE public.course_enrollments SET progress_percentage = 33
 WHERE id = '680ef8ad-265d-4719-a3a8-f0c8e23d70b0';  -- fundamentos-de-bitcoin, 01b68344, completed_at intacto

UPDATE public.course_enrollments SET progress_percentage = 11
 WHERE id = 'c3ace6bf-e900-4645-ab35-f7c23eb8d3b1';  -- uso-practico-de-bitcoin, 094726da, completed_at intacto

UPDATE public.course_enrollments SET progress_percentage = 11
 WHERE id = '7a6f1b9b-c745-44e3-aa0c-66cf72feabbc';  -- fundamentos-de-bitcoin, ad03ae2f, completed_at intacto

UPDATE public.course_enrollments SET progress_percentage = 11
 WHERE id = '0bd12a80-e69f-4929-9403-7d6c53d17053';  -- fundamentos-de-bitcoin, 396de420, completed_at intacto

COMMIT;


-- ============================================================================
-- COMPROBACIONES (solo lectura)
-- ============================================================================
-- 1. Ninguna de las matriculas tocadas dice mas de lo que tiene hecho
--
-- SELECT c.slug, e.progress_percentage,
--        (SELECT count(*) FROM public.user_progress up
--          JOIN public.lessons l ON l.id = up.lesson_id
--         WHERE up.user_id = e.user_id AND l.course_id = c.id AND up.is_completed) AS hechas,
--        (SELECT count(*) FROM public.lessons l WHERE l.course_id = c.id) AS total
--   FROM public.course_enrollments e
--   JOIN public.courses c ON c.id = e.course_id
--  WHERE e.id IN (
--          'e6eec738-aa69-4b20-8eb8-95b620fa1680',
--          'ac3ae29b-4031-4dc9-b265-9d9a5bfb381a',
--          '64ab942e-2c4c-4ed0-b335-9d9e39e06e5e',
--          '680ef8ad-265d-4719-a3a8-f0c8e23d70b0',
--          'c3ace6bf-e900-4645-ab35-f7c23eb8d3b1',
--          '7a6f1b9b-c745-44e3-aa0c-66cf72feabbc',
--          '0bd12a80-e69f-4929-9403-7d6c53d17053'
--        );
--
-- 2. Los certificados no cambian
--
-- SELECT count(*) FROM public.certificates;
