-- ============================================================================
-- 074: revocar los cinco certificados emitidos sin completar el curso
-- ============================================================================
-- ESTADO: APLICADA. Comprobado contra la base el 2026-10-05:
--   certificates.revoked_at y revoked_reason existen, 5 certificados revocados, y verificar_certificado devuelve «revocado».
--   El marcador anterior decia «pendiente» y estaba viejo: se escribe al crear
--   el fichero y nadie lo cambia al aplicarlo.
--   Copia para pegar: tmp/074-aplicar.sql (identica a este fichero).
--   Respaldo previo:  tmp/074-volver-atras.sql
--
-- EL CASO
--   Cinco matriculas quedaron marcadas como completadas con el curso a medias,
--   y cada una recibio su certificado:
--
--     NODO-20260120-AEDX8    Gestion del riesgo          3 de 6 lecciones
--     NODO-20260120-M49IL    Gestion del riesgo          3 de 6
--     NODO-20260121-D581J    Gestion del riesgo          3 de 6
--     NODO360-2026-CA8AB43A  Fundamentos de Bitcoin      3 de 9
--     NODO360-2026-17E580DE  Introduccion al trading     5 de 9
--
--   No es el desfase por crecimiento del curso, que es legitimo y se sostiene
--   (ver 047 y 052): en estos cinco el curso NO crecio despues lo suficiente
--   para explicarlo, y las cinco cuentas se dieron de alta, marcaron entre 3 y
--   5 lecciones en menos de cuatro minutos de reloj y se certificaron el mismo
--   dia, sin volver nunca. Cuatro de los cinco ya estaban anotados en
--   docs/PLAN-REFORMA.md; el de mayo de 2026 no.
--
--   La nota del plan suponia que aquel camino marcaba la matricula sin escribir
--   user_progress. No es asi: las filas estan, con sus marcas de tiempo. El
--   mecanismo exacto sigue sin identificarse, y por eso esto no intenta
--   arreglar el pasado, solo retirar lo que no deberia haberse emitido.
--
-- QUE HACE Y QUE NO
--   NO BORRA NADA. El certificado se queda donde esta, con su numero y su
--   fecha, y pasa a estar revocado. Un borrado dejaria la URL de verificacion
--   en "no encontrado", que se lee como un error del sitio; un certificado
--   retirado con su motivo se lee como lo que es.
--
--   Tampoco toca course_enrollments ni user_progress: el progreso real de esas
--   personas es el que es, y retirar el certificado no se lo cambia.
--
-- POR QUE UNA COLUMNA NUEVA Y NO expires_at
--   expires_at ya significa otra cosa en la pagina de verificacion: "caducado",
--   que es el final normal de un certificado valido. Un certificado retirado
--   por un fallo nuestro no es lo mismo, y mezclarlos obligaria a adivinar cual
--   es cual por la fecha.
--
-- POR QUE SE REESCRIBE LA FUNCION
--   /verificar/[codigo] no lee la tabla: llama a verificar_certificado, la
--   puerta publica de la 051. Si la funcion no devuelve el estado, la pagina no
--   puede ensenarlo por mucho que la columna exista. Hay que DROP y CREATE, no
--   CREATE OR REPLACE, porque cambia el tipo de retorno.
--
--   Durante ese par de sentencias /verificar devuelve "no encontrado". Son
--   milisegundos y la pagina ya trata ese caso sin romperse.
--
-- REEJECUTABLE
--   Las columnas llevan IF NOT EXISTS y los UPDATE escriben siempre el mismo
--   valor. Pegarlo dos veces no hace dano.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. El estado de revocacion
-- ----------------------------------------------------------------------------
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz;

ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS revoked_reason text;

COMMENT ON COLUMN public.certificates.revoked_at IS
  'Cuando se retiro el certificado. NULL = vigente. Distinto de expires_at, que es la caducidad normal de uno valido.';

COMMENT ON COLUMN public.certificates.revoked_reason IS
  'Por que se retiro, en una frase. Se guarda para poder explicarlo despues; la pagina publica no lo muestra literalmente.';


-- ----------------------------------------------------------------------------
-- 2. La puerta publica devuelve tambien el estado
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
  revocado           boolean
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
    -- pagina publica dice el texto acordado, igual para todos, sin detalles
    -- sobre la persona.
    (ce.revoked_at IS NOT NULL)
  FROM public.certificates ce
  LEFT JOIN public.users   u ON u.id = ce.user_id
  LEFT JOIN public.courses c ON c.id = ce.course_id
  LEFT JOIN public.modules m ON m.id = ce.module_id
  WHERE ce.certificate_number = p_codigo
     OR ce.verification_url ILIKE '%' || p_codigo || '%'
  LIMIT 1;
$fn$;

REVOKE ALL ON FUNCTION public.verificar_certificado(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verificar_certificado(text) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.verificar_certificado IS
  'Puerta publica de /verificar/[codigo]. Devuelve un certificado por su numero sin exponer user_id ni permitir enumerar la tabla. titulo_certificado es el titulo del momento de la emision. revocado dice si se retiro, sin dar el motivo guardado.';


-- ----------------------------------------------------------------------------
-- 3. Los cinco, uno a uno
-- ----------------------------------------------------------------------------
UPDATE public.certificates
   SET revoked_at = '2026-09-27T20:00:00Z'::timestamptz,
       revoked_reason = 'Emitido por un error de la plataforma: el curso no estaba completado ni su examen aprobado.'
 WHERE certificate_number = 'NODO-20260120-AEDX8';

UPDATE public.certificates
   SET revoked_at = '2026-09-27T20:00:00Z'::timestamptz,
       revoked_reason = 'Emitido por un error de la plataforma: el curso no estaba completado ni su examen aprobado.'
 WHERE certificate_number = 'NODO-20260120-M49IL';

UPDATE public.certificates
   SET revoked_at = '2026-09-27T20:00:00Z'::timestamptz,
       revoked_reason = 'Emitido por un error de la plataforma: el curso no estaba completado ni su examen aprobado.'
 WHERE certificate_number = 'NODO-20260121-D581J';

UPDATE public.certificates
   SET revoked_at = '2026-09-27T20:00:00Z'::timestamptz,
       revoked_reason = 'Emitido por un error de la plataforma: el curso no estaba completado ni su examen aprobado.'
 WHERE certificate_number = 'NODO360-2026-CA8AB43A';

UPDATE public.certificates
   SET revoked_at = '2026-09-27T20:00:00Z'::timestamptz,
       revoked_reason = 'Emitido por un error de la plataforma: el curso no estaba completado ni su examen aprobado.'
 WHERE certificate_number = 'NODO360-2026-17E580DE';


-- ----------------------------------------------------------------------------
-- 4. La comprobacion. Es lo ultimo, asi que es lo que muestra el editor.
-- ----------------------------------------------------------------------------
-- QUE TIENE QUE SALIR en la ultima fila:
--     revocados          -> 5
--     vigentes_intactos  -> 13
--     sin_borrar         -> 18
--     funcion_ok         -> 5   (los cinco se verifican y dicen revocado)
--     veredicto          -> TODO CORRECTO
WITH esperados AS (
  SELECT unnest(ARRAY[
    'NODO-20260120-AEDX8',
    'NODO-20260120-M49IL',
    'NODO-20260121-D581J',
    'NODO360-2026-CA8AB43A',
    'NODO360-2026-17E580DE'
  ]) AS numero
),
recuentos AS (
  SELECT
    (SELECT count(*) FROM public.certificates ce
       JOIN esperados e ON e.numero = ce.certificate_number
      WHERE ce.revoked_at IS NOT NULL
        AND ce.revoked_reason IS NOT NULL)                              AS revocados,
    (SELECT count(*) FROM public.certificates
      WHERE revoked_at IS NULL)                                         AS vigentes_intactos,
    (SELECT count(*) FROM public.certificates)                          AS sin_borrar,
    (SELECT count(*) FROM esperados e
       CROSS JOIN LATERAL public.verificar_certificado(e.numero) v
      WHERE v.revocado)                                                 AS funcion_ok
)
SELECT
  revocados,
  vigentes_intactos,
  sin_borrar,
  funcion_ok,
  CASE
    WHEN revocados = 5 AND funcion_ok = 5 AND sin_borrar = vigentes_intactos + 5
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: revocados=' || revocados || ' funcion_ok=' || funcion_ok ||
         ' total=' || sin_borrar || ' vigentes=' || vigentes_intactos
  END AS veredicto
FROM recuentos;
