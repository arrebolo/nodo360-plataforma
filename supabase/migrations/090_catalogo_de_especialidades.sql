-- ============================================================================
-- MIGRACION 090: el catalogo de especialidades de instructor
--
-- Paso 2 de la fase A. Crea el eje nuevo y engancha a el los cursos. No toca
-- todavia instructor_certifications: ese cambio de eje es el paso 3.
--
-- POR QUE UNA ESPECIALIDAD NO ES UNA RUTA DE APRENDIZAJE
-- El sistema que ya estaba usaba learning_path_id como eje de la verificacion.
-- Una ruta es un producto para el alumno; una especialidad es una competencia
-- profesional. Fusionarlas obliga a inventar una ruta «Fiscalidad» que ningun
-- alumno va a seguir, solo para poder verificar a alguien. Por eso el catalogo
-- vive aparte, y la ruta queda como un puntero informativo que puede ser NULL.
--
-- EL CATALOGO: ONCE
-- Diez salian de las rutas y los cursos que hay. La once, blockchain-consenso,
-- existe porque si no `fundamentos-blockchain` se queda sin casa: no es Bitcoin,
-- ni Ethereum, ni Web3.
--
-- Lightning y DeFi entran SIN curso y SIN examen. Nadie puede verificarse en
-- ellas todavia, y eso es lo correcto: el catalogo declara el mapa, no promete
-- cobertura.
--
-- fiscalidad y derecho-regulacion nacen con requiere_acreditacion y
-- permite_evaluador_externo: ahi no basta con aprobar un examen nuestro.
--
-- POR QUE courses.specialty_id Y NO courses.topic_category
-- topic_category ya existe, es texto libre y esta a NULL en los quince cursos.
-- Texto sin restriccion es como se acaba con 'defi', 'DeFi' y 'De-Fi'
-- conviviendo en la misma columna. Se marca como muerta con un COMMENT.
--
-- LA RUTA DE CADA ESPECIALIDAD, Y LA UNICA DECISION DISCUTIBLE
-- Cinco especialidades apuntan a una ruta real. Las demas quedan a NULL porque
-- no la tienen. La discutible es blockchain-consenso: su curso vive en la ruta
-- web3-basica, que ya es la casa de la especialidad web3. Apuntar las dos a la
-- misma ruta haria ambiguo el puntero, asi que se deja a NULL. Si se prefiere
-- lo contrario, es un UPDATE de una linea.
--
-- ethereum-contratos SI apunta a ecosistema-ethereum aunque esa ruta este hoy
-- con is_active = false: la ruta existe, y el puntero describe donde vive la
-- materia, no si esta publicada.
--
-- Son SEIS con ruta y CINCO sin ella. La primera version de la verificacion
-- esperaba cinco con ruta: estaba contando las que NO la tienen y puso ese
-- numero donde iba el complementario. Los datos siempre fueron los del diseño;
-- lo que fallaba era el umbral, y por eso el veredicto salio REVISAR con la
-- base perfectamente bien. Queda escrito porque una verificacion que da falsas
-- alarmas se termina ignorando, que es peor que no tenerla.
--
-- NO BORRA NI UNA FILA. No cambia el estado de ningun curso.
-- Es reejecutable: el catalogo va con ON CONFLICT y el mapeo por slug.
-- ============================================================================

BEGIN;

-- =====================================================
-- 1. La tabla
-- =====================================================

CREATE TABLE IF NOT EXISTS public.instructor_specialties (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                      text NOT NULL UNIQUE,
  nombre                    text NOT NULL,
  descripcion               text,
  learning_path_id          uuid REFERENCES public.learning_paths(id) ON DELETE SET NULL,
  requiere_acreditacion     boolean NOT NULL DEFAULT false,
  permite_evaluador_externo boolean NOT NULL DEFAULT false,
  is_active                 boolean NOT NULL DEFAULT true,
  position                  integer NOT NULL DEFAULT 0,
  created_at                timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.instructor_specialties IS
  'Catalogo de especialidades de instructor. Es el eje de la verificacion, y a proposito NO es learning_paths: una ruta es un producto para el alumno y una especialidad es una competencia profesional. learning_path_id es un puntero informativo y puede ser NULL.';

COMMENT ON COLUMN public.instructor_specialties.requiere_acreditacion IS
  'La competencia no se acredita solo con un examen nuestro: hace falta colegiacion o titulo. Hoy, fiscalidad y derecho-regulacion.';

COMMENT ON COLUMN public.instructor_specialties.permite_evaluador_externo IS
  'La evaluacion la puede firmar alguien de fuera de Nodo360.';

CREATE INDEX IF NOT EXISTS idx_instructor_specialties_position
  ON public.instructor_specialties (position);

-- =====================================================
-- 2. Las once
-- =====================================================
-- La ruta se resuelve por slug, nunca por un uuid escrito a mano: un uuid
-- copiado aqui seria correcto hoy y mentira en cualquier otra base.

INSERT INTO public.instructor_specialties
  (slug, nombre, descripcion, learning_path_id, requiere_acreditacion, permite_evaluador_externo, position)
VALUES
  ('bitcoin-fundamentos',  'Fundamentos y uso de Bitcoin',
   'Que es Bitcoin, como funciona y como se usa en el dia a dia.',
   (SELECT id FROM public.learning_paths WHERE slug = 'fundamentos-bitcoin'), false, false, 1),

  ('seguridad-custodia',   'Seguridad y custodia',
   'Claves, copias de seguridad, almacenamiento en frio y errores que cuestan fondos.',
   (SELECT id FROM public.learning_paths WHERE slug = 'seguridad-cripto'), false, false, 2),

  ('bitcoin-tecnico',      'Nodos y Bitcoin tecnico',
   'Nodos propios, sincronizacion, poda y soberania tecnica.',
   (SELECT id FROM public.learning_paths WHERE slug = 'bitcoin-tecnico'), false, false, 3),

  ('lightning',            'Lightning y pagos',
   'Canales, enrutado y pagos instantaneos sobre Bitcoin. Sin curso todavia.',
   NULL, false, false, 4),

  ('blockchain-consenso',  'Blockchain y consenso',
   'Estado compartido, formas de consenso, capas y puentes. Lo que una cadena hace y lo que no.',
   NULL, false, false, 5),

  ('ethereum-contratos',   'Ethereum y contratos inteligentes',
   'La maquina de estado de Ethereum, el gas y lo que decide si un contrato falla.',
   (SELECT id FROM public.learning_paths WHERE slug = 'ecosistema-ethereum'), false, false, 6),

  ('defi',                 'DeFi',
   'Prestamos, intercambios y derivados sin intermediario. Sin curso todavia.',
   NULL, false, false, 7),

  ('web3',                 'Web3',
   'Identidad, tokens, NFT y como mirar un proyecto antes de tocarlo.',
   (SELECT id FROM public.learning_paths WHERE slug = 'web3-basica'), false, false, 8),

  ('mercados-trading',     'Mercados y trading',
   'Como funcionan los mercados, gestion del riesgo y mentalidad. Sin recomendaciones de inversion.',
   (SELECT id FROM public.learning_paths WHERE slug = 'trading-basico'), false, false, 9),

  ('fiscalidad',           'Fiscalidad',
   'Tributacion de las criptomonedas. Requiere acreditacion profesional.',
   NULL, true, true, 10),

  ('derecho-regulacion',   'Derecho y regulacion',
   'Marco legal y regulatorio. Requiere acreditacion profesional.',
   NULL, true, true, 11)

ON CONFLICT (slug) DO UPDATE SET
  nombre                    = EXCLUDED.nombre,
  descripcion               = EXCLUDED.descripcion,
  learning_path_id          = EXCLUDED.learning_path_id,
  requiere_acreditacion     = EXCLUDED.requiere_acreditacion,
  permite_evaluador_externo = EXCLUDED.permite_evaluador_externo,
  position                  = EXCLUDED.position;

-- =====================================================
-- 3. courses.specialty_id
-- =====================================================

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS specialty_id uuid
  REFERENCES public.instructor_specialties(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.courses.specialty_id IS
  'Especialidad de instructor a la que pertenece el curso. Es lo que permitira decidir quien puede publicar que: un instructor verificado en una especialidad no queda habilitado para las demas.';

CREATE INDEX IF NOT EXISTS idx_courses_specialty_id
  ON public.courses (specialty_id);

COMMENT ON COLUMN public.courses.topic_category IS
  'MUERTA. Texto libre, a NULL en los quince cursos desde siempre. La clasificacion real va por specialty_id (090): texto sin restriccion es como se acaba con defi, DeFi y De-Fi conviviendo. No escribir aqui.';

-- =====================================================
-- 4. Los diez cursos publicados, a su especialidad
-- =====================================================
-- Por slug de curso y slug de especialidad. Los cinco archivados se quedan a
-- NULL a proposito: el mapeo aprobado cubria los publicados.

UPDATE public.courses c
   SET specialty_id = e.id
  FROM (VALUES
     ('fundamentos-de-bitcoin',                       'bitcoin-fundamentos'),
     ('como-funciona-bitcoin-nivel-basico',           'bitcoin-fundamentos'),
     ('uso-practico-de-bitcoin',                      'bitcoin-fundamentos'),
     ('seguridad-basica-en-bitcoin-y-criptomonedas',  'seguridad-custodia'),
     ('cold-storage-protege-tus-bitcoin',             'seguridad-custodia'),
     ('nodos-bitcoin-tu-soberania-tecnica',           'bitcoin-tecnico'),
     ('fundamentos-blockchain',                       'blockchain-consenso'),
     ('ethereum-y-contratos-inteligentes',            'ethereum-contratos'),
     ('introduccion-a-web3',                          'web3'),
     ('introduccion-al-trading-de-criptomonedas',     'mercados-trading')
   ) AS m(curso_slug, especialidad_slug)
  JOIN public.instructor_specialties e ON e.slug = m.especialidad_slug
 WHERE c.slug = m.curso_slug
   AND c.specialty_id IS DISTINCT FROM e.id;

-- =====================================================
-- 5. Quien lee y quien escribe el catalogo
-- =====================================================
-- Se lee desde fuera: el sello publico de un instructor y los filtros del
-- catalogo lo necesitan sin sesion. Se escribe desde ningun sitio: once filas
-- se gobiernan por SQL o con el cliente de servicio, no con una pantalla.

ALTER TABLE public.instructor_specialties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "El catalogo de especialidades se lee" ON public.instructor_specialties;

CREATE POLICY "El catalogo de especialidades se lee"
  ON public.instructor_specialties
  FOR SELECT
  TO anon, authenticated
  USING (is_active OR public.es_admin_actual());

GRANT SELECT ON public.instructor_specialties TO anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.instructor_specialties FROM anon, authenticated;

COMMIT;

-- ============================================================================
-- VERIFICACION
-- ============================================================================

SELECT
  (SELECT count(*) FROM public.instructor_specialties)                          AS especialidades,
  (SELECT count(*) FROM public.instructor_specialties WHERE is_active)          AS activas,
  (SELECT count(*) FROM public.instructor_specialties WHERE requiere_acreditacion) AS con_acreditacion,
  (SELECT count(*) FROM public.instructor_specialties WHERE learning_path_id IS NOT NULL) AS con_ruta,

  (SELECT count(*) FROM public.courses WHERE specialty_id IS NOT NULL)          AS cursos_con_especialidad,
  (SELECT count(*) FROM public.courses WHERE status = 'published' AND specialty_id IS NULL) AS publicados_sin_especialidad,
  (SELECT count(*) FROM public.courses WHERE status <> 'published' AND specialty_id IS NULL) AS no_publicados_sin_especialidad,

  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.instructor_specialties'::regclass) AS rls_activa,
  (SELECT count(*) FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'instructor_specialties')       AS politicas,
  has_table_privilege('anon', 'public.instructor_specialties', 'SELECT')        AS anon_lee,
  has_table_privilege('anon', 'public.instructor_specialties', 'UPDATE')        AS anon_escribe,

  (SELECT count(*) FROM public.courses)                                          AS cursos,
  (SELECT count(*) FROM public.courses WHERE status = 'published')               AS publicados,

  CASE
    WHEN (SELECT count(*) FROM public.instructor_specialties) = 11
     AND (SELECT count(*) FROM public.instructor_specialties WHERE requiere_acreditacion) = 2
     AND (SELECT count(*) FROM public.instructor_specialties WHERE learning_path_id IS NOT NULL) = 6
     AND (SELECT count(*) FROM public.courses WHERE specialty_id IS NOT NULL) = 10
     AND (SELECT count(*) FROM public.courses WHERE status = 'published' AND specialty_id IS NULL) = 0
     AND (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.instructor_specialties'::regclass)
     AND NOT has_table_privilege('anon', 'public.instructor_specialties', 'UPDATE')
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                                            AS veredicto;
