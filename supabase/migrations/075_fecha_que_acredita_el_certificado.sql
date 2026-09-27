-- ============================================================================
-- 075: el certificado acredita la fecha en que se COMPLETO el curso
-- ============================================================================
-- ESTADO: PENDIENTE DE APLICAR. Hay DDL, asi que va por el editor SQL.
--   Copia para pegar: tmp/075-aplicar.sql
--
-- EL PROBLEMA, VISTO EN PRODUCCION
--   La ficha del curso decia "Lo terminaste el 27 de enero de 2026" y el
--   certificado del mismo curso, "emitido el 29 de enero" y "Acredita el
--   temario vigente el 29 de enero". Dos fechas para el mismo hecho, sin nada
--   que explicara cual es cual.
--
--   No es un fallo de datos: son dos cosas distintas. completed_at es cuando
--   la persona termino el curso; issued_at es cuando se emitio el papel, que
--   puede ser dias despues -aprobar el examen, un reproceso-. Lo que el
--   certificado acredita es el temario que habia al TERMINAR, asi que esa es la
--   fecha que tiene que salir.
--
-- QUE HACE
--   verificar_certificado devuelve una columna mas, completado_en, con el
--   completed_at de la matricula. La pagina publica /verificar/[codigo] no lee
--   la tabla -esta cerrada desde la 051-, asi que sin esto no hay forma de que
--   lo sepa. La fecha de emision se sigue devolviendo y se muestra aparte,
--   etiquetada como lo que es.
--
-- RELACION CON LA 074
--   Las dos redefinen esta misma funcion. Este fichero esta escrito para que el
--   orden no importe:
--     - Las columnas de revocacion se anaden con IF NOT EXISTS: si ya paso la
--       074, no hacen nada.
--     - La funcion queda definida con las DOS novedades, revocado y
--       completado_en.
--   Los cinco UPDATE que revocan certificados viven solo en la 074, y este
--   fichero no los repite ni los deshace.
--
--   Si se aplica 074 y luego 075, el resultado es el correcto.
--   Si se aplica solo 075, tambien: revocado saldra false para todos, que es
--   la verdad mientras nadie haya revocado nada.
--
-- REEJECUTABLE. No escribe ni un dato: solo DDL idempotente.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Las columnas de revocacion, por si la 074 no ha pasado todavia
-- ----------------------------------------------------------------------------
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz;

ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS revoked_reason text;


-- ----------------------------------------------------------------------------
-- 2. La puerta publica, con la fecha de finalizacion
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.verificar_certificado(text);

CREATE FUNCTION public.verificar_certificado(p_codigo text)
RETURNS TABLE (
  certificate_number text,
  tipo               text,
  titulo_certificado text,
  titular            text,
  curso_titulo       text,
  curso_descripcion  text,
  modulo_titulo      text,
  issued_at          timestamptz,
  expires_at         timestamptz,
  revocado           boolean,
  completado_en      timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
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
    ce.expires_at,
    -- Solo si esta retirado o no. El motivo guardado no sale a la calle: la
    -- pagina publica dice un texto igual para todos, sin detalles de la
    -- persona que lo tiene.
    (ce.revoked_at IS NOT NULL),
    -- Cuando se completo el curso. Puede venir NULL: hay certificados de
    -- modulo y matriculas que ya no existen. La pagina cae entonces a
    -- issued_at, que es lo mas cercano que queda.
    me.completed_at
  FROM public.certificates ce
  LEFT JOIN public.users   u ON u.id = ce.user_id
  LEFT JOIN public.courses c ON c.id = ce.course_id
  LEFT JOIN public.modules m ON m.id = ce.module_id
  LEFT JOIN public.course_enrollments me
         ON me.user_id = ce.user_id
        AND me.course_id = ce.course_id
  WHERE ce.certificate_number = p_codigo
     OR ce.verification_url ILIKE '%' || p_codigo || '%'
  LIMIT 1;
$fn$;

REVOKE ALL ON FUNCTION public.verificar_certificado(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verificar_certificado(text) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.verificar_certificado IS
  'Puerta publica de /verificar/[codigo]. Devuelve un certificado por su numero sin exponer user_id ni permitir enumerar la tabla. titulo_certificado es el titulo del momento de la emision; completado_en es cuando se termino el curso, que es la fecha que el certificado acredita; revocado dice si se retiro, sin dar el motivo guardado.';


-- ----------------------------------------------------------------------------
-- 3. La comprobacion. Es lo ultimo, asi que es lo que muestra el editor.
-- ----------------------------------------------------------------------------
-- QUE TIENE QUE SALIR en la ultima fila:
--     certificados        -> 18
--     se_verifican        -> 18   (todos responden por su numero)
--     con_fecha_de_fin    -> 17   (los que tienen matricula con completed_at)
--     veredicto           -> TODO CORRECTO
--
-- con_fecha_de_fin puede ser menor que certificados sin que nada este mal: un
-- certificado de modulo, o uno cuya matricula ya no exista, no tiene esa fecha
-- y la pagina cae a la de emision. Lo que NO puede pasar es que se_verifican
-- sea menor que certificados: eso significaria que la funcion se ha roto.
WITH v AS (
  SELECT ce.certificate_number, r.completado_en, r.issued_at
    FROM public.certificates ce
    CROSS JOIN LATERAL public.verificar_certificado(ce.certificate_number) r
)
SELECT
  (SELECT count(*) FROM public.certificates)                       AS certificados,
  (SELECT count(*) FROM v)                                         AS se_verifican,
  (SELECT count(*) FROM v WHERE completado_en IS NOT NULL)         AS con_fecha_de_fin,
  CASE
    WHEN (SELECT count(*) FROM v) = (SELECT count(*) FROM public.certificates)
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: la funcion no devuelve todos los certificados'
  END AS veredicto;
