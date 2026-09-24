-- Migracion 041: subtitulo y descripcion larga de dos rutas de aprendizaje.
--
-- Aplicada a mano el 22/09/2026 y versionada el 24/09/2026, al detectar que la
-- secuencia de migraciones saltaba de la 040 a la 042. El contenido es el del
-- archivo que se ejecuto entonces, sin un solo cambio: lo que sigue a partir de
-- la siguiente linea es 041-aplicar.sql tal cual.
--
-- Comprobado en la base de datos el 24/09/2026: las rutas bitcoin-tecnico y
-- seguridad-avanzada tienen subtitle y long_description con estos mismos
-- textos, asi que la migracion esta aplicada y no hay que volver a ejecutarla.
-- Si se ejecutara, el CREATE TABLE del respaldo fallaria diciendo que ya
-- existe, que es el aviso previsto para ese caso.

-- ============================================================================
-- 041 APLICAR — subtítulo y descripción larga de dos rutas
--
-- QUÉ Y POR QUÉ
-- bitcoin-tecnico y seguridad-avanzada tenían subtitle y long_description
-- vacíos, mientras las otras cuatro rutas los tienen rellenos. En /rutas se
-- veían visiblemente más pobres. Los textos siguen el tono de las demás
-- —tuteo, sin promesas, la limitación por delante— y describen los cursos que
-- esas rutas contienen de verdad: Nodos Bitcoin en una y Cold Storage en otra.
--
-- LO QUE NO TOCA
-- Ni un slug, ni el estado de ningún curso, ni ninguna otra columna. Solo
-- subtitle y long_description de esas dos filas. 041-comprobar.sql lo verifica.
--
-- SIN TABLAS TEMPORALES
-- El editor de Supabase no las conserva entre sentencias. El respaldo va a
-- backup_nodo360, donde anon y authenticated no tienen acceso, y sirve además
-- para revertir.
--
-- SI EL CREATE TABLE FALLA DICIENDO QUE YA EXISTE
-- Es que esta migración ya se aplicó. No borrar el respaldo: comprobar el
-- estado con 041-comprobar.sql.
--
-- IDEMPOTENTE
-- Cada UPDATE exige en el WHERE que el campo esté vacío. Aplicada dos veces,
-- la segunda afecta a 0 filas y no pisa nada que se haya editado a mano.
--
-- Fecha: 22/09/2026
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Respaldo
-- ----------------------------------------------------------------------------

CREATE TABLE backup_nodo360.learning_paths_antes_041 AS
SELECT lp.*, NOW() AS guardado_en
  FROM public.learning_paths lp;

COMMENT ON TABLE backup_nodo360.learning_paths_antes_041 IS
  'Copia de public.learning_paths antes de la migracion 041 (22/09/2026).';

-- ----------------------------------------------------------------------------
-- 2. Bitcoin Técnico
--    Contiene: Nodos Bitcoin - Tu Soberanía Técnica
-- ----------------------------------------------------------------------------

UPDATE public.learning_paths
   SET subtitle = 'Verifica por ti mismo, sin intermediarios',
       long_description =
'Usar Bitcoin a través de un exchange o una wallet ligera significa confiar en el nodo de otro para saber qué hay en la cadena. Esta ruta es el paso siguiente: entender qué hace un nodo, por qué importa quién verifica, y montar el tuyo para comprobarlo todo por tu cuenta. Aquí se trabaja con hardware real, configuración y mantenimiento, sin dar por supuesto que ya sabes de sistemas.'
 WHERE slug = 'bitcoin-tecnico'
   AND COALESCE(subtitle, '') = ''
   AND COALESCE(long_description, '') = '';

-- ----------------------------------------------------------------------------
-- 3. Seguridad Avanzada
--    Contiene: Cold Storage - Protege tus Bitcoin
-- ----------------------------------------------------------------------------

UPDATE public.learning_paths
   SET subtitle = 'Custodia que sobrevive a tus errores',
       long_description =
'La mayoría de los bitcoin que se pierden no se los lleva un atacante: se pierden por una copia mal anotada, un esquema que solo entendía su dueño o una recuperación que nunca se ensayó. Esta ruta parte de tu modelo de amenazas real y avanza hacia el almacenamiento en frío: cómo funciona una frase de recuperación, cómo hacer copias que aguanten el tiempo y cómo comprobar que puedes recuperar lo que guardaste.'
 WHERE slug = 'seguridad-avanzada'
   AND COALESCE(subtitle, '') = ''
   AND COALESCE(long_description, '') = '';

-- ----------------------------------------------------------------------------
-- 4. Red de seguridad
--    Aborta si se tocó algo que no debía. Nada se escribe.
-- ----------------------------------------------------------------------------

DO $$
DECLARE v_mal TEXT := '';
BEGIN
  -- Ningun slug puede haber cambiado
  IF EXISTS (
    SELECT 1 FROM backup_nodo360.learning_paths_antes_041 a
      JOIN public.learning_paths n ON n.id = a.id
     WHERE n.slug IS DISTINCT FROM a.slug
  ) THEN
    v_mal := v_mal || 'algun slug de ruta cambio. ';
  END IF;

  -- Ni el nombre, ni la descripcion corta, ni is_active
  IF EXISTS (
    SELECT 1 FROM backup_nodo360.learning_paths_antes_041 a
      JOIN public.learning_paths n ON n.id = a.id
     WHERE n.name IS DISTINCT FROM a.name
        OR n.short_description IS DISTINCT FROM a.short_description
        OR n.is_active IS DISTINCT FROM a.is_active
  ) THEN
    v_mal := v_mal || 'cambio algo mas que subtitle y long_description. ';
  END IF;

  -- Exactamente dos filas modificadas
  IF (SELECT count(*) FROM backup_nodo360.learning_paths_antes_041 a
        JOIN public.learning_paths n ON n.id = a.id
       WHERE n.subtitle IS DISTINCT FROM a.subtitle
          OR n.long_description IS DISTINCT FROM a.long_description) <> 2 THEN
    v_mal := v_mal || 'no se modificaron exactamente dos rutas. ';
  END IF;

  -- Las seis rutas siguen con subtitle y long_description
  IF EXISTS (SELECT 1 FROM public.learning_paths
              WHERE COALESCE(subtitle, '') = ''
                 OR COALESCE(long_description, '') = '') THEN
    v_mal := v_mal || 'alguna ruta sigue sin subtitle o long_description. ';
  END IF;

  IF v_mal <> '' THEN
    RAISE EXCEPTION 'Abortada: %', v_mal;
  END IF;
  RAISE NOTICE 'OK: dos rutas completadas, nada mas tocado';
END $$;

COMMIT;


-- ============================================================================
-- PARA REVERTIR, si hiciera falta
--
--   UPDATE public.learning_paths n
--      SET subtitle = a.subtitle,
--          long_description = a.long_description
--     FROM backup_nodo360.learning_paths_antes_041 a
--    WHERE n.id = a.id;
--
-- Y cuando el respaldo ya no haga falta:
--   DROP TABLE backup_nodo360.learning_paths_antes_041;
-- ============================================================================
