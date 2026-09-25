-- ============================================================================
-- 053: /verificar muestra el titulo del certificado, no el vigente del curso
-- ============================================================================
-- ESTADO: ESCRITA, SIN APLICAR (25/09/2026).
--   Es DDL: hay que ejecutarla en el SQL Editor de Supabase. Fichero listo en
--   C:/Users/alber/053-aplicar.sql
--
-- EL PROBLEMA, Y DONDE ESTABA DE VERDAD
--   Al renombrar cursos en la 052, cuatro certificados quedaron acreditando
--   una cosa y verificandose como otra:
--
--     NODO-20260120-N97P5    title = 'Introduccion al trading de criptomonedas'
--                            /verificar mostraba 'Trading: que es y por que
--                            casi nadie gana'
--
--   Comprobado antes de escribir esto: **la funcion de la 051 ya devolvia el
--   titulo guardado** en `titulo_certificado`, correcto en los 17. El fallo
--   estaba solo en la pagina, que hacia `curso_titulo || titulo_certificado` y
--   daba prioridad al vigente. Esa inversion es lo que arregla los 4 casos.
--
--   ENTONCES, ¿QUE APORTA ESTA MIGRACION? Mueve el respaldo dentro de la
--   funcion: `titulo_certificado` pasa a venir ya resuelto con COALESCE. Con
--   eso la regla —manda el titulo de la emision, el del curso solo si aquel
--   esta vacio— vive en un solo sitio y vale para cualquier cliente que llame
--   a la funcion, no solo para esta pagina.
--
--   Hoy no cambia el resultado de ningun certificado: los 17 tienen `title`
--   relleno. Cambia el de los que pudieran no tenerlo.
--
-- POR QUE NO CAMBIA LA FIRMA
--   Se mantienen las nueve columnas y sus nombres. `titulo_certificado` pasa a
--   venir ya resuelto con COALESCE, y `curso_titulo` sigue siendo el titulo
--   vigente del curso.
--
--   Asi no hace falta DROP FUNCTION —que obligaria a rehacer los GRANT— y no
--   hay ventana de rotura en ningun orden de despliegue: con el codigo viejo y
--   esta funcion ya aplicada, la pagina sigue mostrando el titulo del curso
--   (comportamiento anterior, inofensivo); con el codigo nuevo, el del
--   certificado.
--
-- CAMBIO DE CODIGO QUE ACOMPANA
--   app/verificar/[verificationCode]/page.tsx invierte la precedencia:
--     antes:  cert.curso_titulo || cert.titulo_certificado || 'Curso'
--     ahora:  cert.titulo_certificado || cert.curso_titulo || 'Curso'
--
-- COMPROBACION PREVIA (25/09/2026)
--   17 certificados en la base, todos con `title` relleno. 4 de ellos con un
--   titulo distinto al vigente de su curso, por la 052.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.verificar_certificado(p_codigo text)
RETURNS TABLE (
  certificate_number text,
  tipo               text,
  titulo_certificado text,
  titular            text,
  curso_titulo       text,
  curso_descripcion  text,
  modulo_titulo      text,
  issued_at          timestamptz,
  expires_at         timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    ce.certificate_number::text,
    ce.type::text,
    -- Lo que acredita el certificado: el titulo del momento de la emision.
    -- Solo cae al del curso si ese campo esta vacio o es nulo.
    COALESCE(NULLIF(TRIM(ce.title), ''), c.title)::text,
    u.full_name::text,
    c.title::text,
    c.description::text,
    m.title::text,
    ce.issued_at,
    ce.expires_at
  FROM public.certificates ce
  LEFT JOIN public.users   u ON u.id = ce.user_id
  LEFT JOIN public.courses c ON c.id = ce.course_id
  LEFT JOIN public.modules m ON m.id = ce.module_id
  WHERE ce.certificate_number = p_codigo
     OR ce.verification_url ILIKE '%' || p_codigo || '%'
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.verificar_certificado IS
  'Puerta publica de /verificar/[codigo]. Devuelve un certificado por su numero sin exponer user_id ni permitir enumerar la tabla. titulo_certificado es el titulo del momento de la emision, que es lo que el certificado acredita; cae al del curso solo si esta vacio.';

COMMIT;


-- ============================================================================
-- COMPROBACIONES
-- ============================================================================
-- 1. Los 17 certificados se verifican, y el titulo es el guardado.
--    QUE DEBE SALIR: 17 filas, y coincide = true en todas.
--
-- SELECT ce.certificate_number, ce.title AS guardado, v.titulo_certificado AS devuelto,
--        (v.titulo_certificado = ce.title) AS coincide, v.curso_titulo AS titulo_hoy
--   FROM public.certificates ce
--   CROSS JOIN LATERAL public.verificar_certificado(ce.certificate_number) v
--  ORDER BY ce.issued_at;
--
-- 2. Los cuatro afectados por la 052 deben devolver el titulo antiguo.
--    QUE DEBE SALIR: guardado y devuelto iguales, distintos de titulo_hoy.
--
-- SELECT ce.certificate_number, v.titulo_certificado, v.curso_titulo
--   FROM public.certificates ce
--   CROSS JOIN LATERAL public.verificar_certificado(ce.certificate_number) v
--   JOIN public.courses c ON c.id = ce.course_id
--  WHERE ce.title IS DISTINCT FROM c.title;
--
-- 3. El respaldo funciona: un certificado sin title cae al del curso.
--    (Hoy no hay ninguno; se comprueba en una transaccion que se deshace.)
--
-- BEGIN;
--   UPDATE public.certificates SET title = NULL
--    WHERE certificate_number = (SELECT certificate_number FROM public.certificates LIMIT 1);
--   SELECT v.titulo_certificado FROM public.certificates ce
--     CROSS JOIN LATERAL public.verificar_certificado(ce.certificate_number) v
--    WHERE ce.title IS NULL;
-- ROLLBACK;
--
-- 4. Desde fuera, con la clave ANONIMA, sigue sin exponer user_id:
--      POST /rest/v1/rpc/verificar_certificado {"p_codigo":"<uno real>"}
--
--
-- ============================================================================
-- SI ALGO SALE MAL: vuelta atras
-- ============================================================================
-- Devuelve la funcion a la version de la 051, que daba `ce.title` sin resolver.
-- El codigo desplegado seguiria funcionando: mostraria el titulo del curso.
--
-- (El SQL completo esta en C:/Users/alber/backups-sql/053-volver-atras.sql.bak)
