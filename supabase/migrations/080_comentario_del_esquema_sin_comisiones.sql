-- ============================================================================
-- 080: el esquema public deja de anunciar un sistema de comisiones
-- ============================================================================
-- ESTADO: APLICADA. Comprobado contra la base el 2026-10-05:
--   el titulo del OpenAPI ya dice «Esquema de la plataforma educativa» y no menciona comisiones.
--   El marcador anterior decia «pendiente» y estaba viejo: se escribe al crear
--   el fichero y nadie lo cambia al aplicarlo.
--   Copia para pegar: tmp/080-aplicar.sql
--
-- LO QUE HAY HOY
--   public tiene un COMMENT ON SCHEMA que dice, literalmente:
--
--       Sistema de comisiones v1.0 - Instructor 35/40%, Mentor 45/50%
--
--   Describe un reparto de ingresos que NO EXISTE: no hay pasarela de pago,
--   payments y orders no existen como tablas, referral_links está a 0 y
--   /pricing dice desde la #220 que hoy todo es gratuito. Es el mismo problema
--   que las páginas de mentoría: una promesa vieja que sigue escrita.
--
-- DÓNDE SE VE, Y DÓNDE NO
--   PostgREST usa el comentario del esquema como TÍTULO de su documento
--   OpenAPI. Es decir, esa frase es el nombre de la API de Nodo360.
--
--   Comprobado que NO se sirve al público: GET /rest/v1/ con la clave anónima
--   devuelve 401, y solo responde con la clave de servicio. Así que no era una
--   fuga; era una contradicción escrita en la base.
--
-- QUÉ HACE ESTE FICHERO
--   Sustituye ese comentario. Deja en la primera línea un título sobrio -que es
--   lo que PostgREST usará- y detrás, el registro de lo que se retira y por
--   qué, porque un comentario que se borra sin decir qué decía obliga a alguien
--   a preguntárselo dentro de un año.
--
--   NO BORRA NADA MÁS: ni tablas, ni filas, ni políticas, ni permisos.
--
-- PUEDE FALLAR POR PERMISOS
--   COMMENT ON SCHEMA exige ser dueño del esquema. En el editor SQL de Supabase
--   se ejecuta como `postgres`, que lo es. Si saliera «must be owner of schema
--   public», no se ha aplicado nada y hay que hacerlo desde el panel.
--
-- LA VERIFICACIÓN TRAE ADEMÁS UN DATO QUE FALTA
--   Al aplicar la 079 apareció una tercera política sobre user_badges que no
--   está en el repositorio: "Users can update own badge features" (UPDATE, rol
--   public). No se sabe qué comprueba, y eso decide si un usuario puede
--   cambiarse el badge_id de una insignia propia por otro -concederse una
--   insignia que no ganó- o solo tocar is_featured.
--
--   La consulta final de este fichero devuelve su USING y su WITH CHECK, para
--   poder decidirlo mirando y no suponiendo. Ver la 079 para el inventario
--   completo de lo que se creó a mano en esa tabla.
--
-- REEJECUTABLE: escribe siempre el mismo comentario.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. El comentario del esquema
-- ----------------------------------------------------------------------------
-- La primera línea es la que PostgREST convierte en título; lo de abajo va a
-- la descripción. De ahí el salto de línea.
-- Un solo literal, en una sola linea: COMMENT ON SCHEMA no admite expresiones,
-- asi que no se puede usar ||, y yuxtaponer literales dependeria de una regla
-- del lexer que aqui no hay forma de comprobar. Linea larga a cambio de cero
-- ambiguedad.
COMMENT ON SCHEMA public IS E'Nodo360. Esquema de la plataforma educativa.\n\nRetirado el 28/09/2026 por la migracion 080 el comentario anterior, que decia "Sistema de comisiones v1.0 - Instructor 35/40%, Mentor 45/50%". Describia un reparto de ingresos que nunca existio: no hay pasarela de pago, las tablas payments y orders no existen, referral_links esta a 0 y /pricing dice que hoy todo el contenido es gratuito. PostgREST usa este texto como titulo de su documento OpenAPI, asi que esa frase era el nombre de la API.';


-- ----------------------------------------------------------------------------
-- 2. La comprobación. Es lo último, así que es lo que muestra el editor.
-- ----------------------------------------------------------------------------
-- QUÉ TIENE QUE SALIR, en una sola fila:
--     titulo_del_esquema   -> Nodo360. Esquema de la plataforma educativa.
--     update_using         -> la expresión USING de la política de UPDATE
--     update_with_check    -> su WITH CHECK, o NULL si no tiene
--     politicas_user_badges-> 3
--     veredicto            -> TODO CORRECTO
--
-- PÉGAME update_using Y update_with_check. Con eso se puede decir, sin
-- suponer nada, si esa política permite a alguien concederse una insignia
-- ajena o solo cambiar is_featured de una propia.
SELECT
  split_part(
    coalesce(obj_description('public'::regnamespace, 'pg_namespace'), ''),
    E'\n', 1)                                                   AS titulo_del_esquema,

  (SELECT string_agg(coalesce(qual, '(sin USING)'), ' ;; ')
     FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_badges'
      AND cmd = 'UPDATE')                                       AS update_using,

  (SELECT string_agg(coalesce(with_check, '(sin WITH CHECK: se usa el USING)'), ' ;; ')
     FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_badges'
      AND cmd = 'UPDATE')                                       AS update_with_check,

  (SELECT count(*)
     FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_badges')   AS politicas_user_badges,

  CASE
    WHEN coalesce(obj_description('public'::regnamespace, 'pg_namespace'), '')
         LIKE 'Nodo360.%'
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: el comentario del esquema no se ha cambiado'
  END                                                           AS veredicto;
