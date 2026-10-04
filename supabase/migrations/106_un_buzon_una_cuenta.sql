-- ============================================================================
-- MIGRACION 106: un buzon, una cuenta
--
-- EL PROBLEMA
-- Supabase impide repetir el correo EXACTO, pero en Gmail los puntos no cuentan y
-- el sufijo +algo tampoco: cursos.nodo360@gmail.com, cursosnodo360@gmail.com y
-- cursos.nodo360+x@gmail.com son el MISMO buzon. Con eso, una persona abre tantas
-- cuentas como quiera, y por ejemplo se salta el limite de intentos del examen de
-- instructor, que es por cuenta.
--
-- LA NORMALIZACION, tal como se pidio
--   Gmail y Googlemail: fuera los puntos del nombre, fuera el sufijo +algo, y el
--                       dominio se unifica en gmail.com (son el mismo buzon).
--   Todo lo demas:      fuera el sufijo +algo. Los puntos SI cuentan: en la
--                       mayoria de servidores son parte del nombre.
--
-- POR QUE UN TRIGGER Y NO UN INDICE UNICO, Y ESTO ES IMPORTANTE
-- Un UNIQUE sobre el correo normalizado seria mas bonito, y NO SE PUEDE PONER: ya
-- hay dos cuentas que chocan entre si. Son las dos del dueño de la plataforma
-- —una con rol student y otra con rol instructor, creadas con 192 dias de
-- diferencia—, y las dos se usan. Un indice unico exigiria borrar una.
--
-- Un trigger BEFORE INSERT no tiene ese problema: mira hacia atras, no hacia los
-- lados. Las cuentas que ya existen se quedan como estan y siguen entrando con
-- normalidad —esto NO toca el inicio de sesion, solo la creacion—, y la regla
-- corre solo para las que vengan.
--
-- DONDE MUERDE
-- En public.users, cuya fila la crea un trigger sobre auth.users DENTRO de la
-- misma transaccion (medido en la 105). Asi que rechazar aqui aborta tambien el
-- INSERT en auth.users: el registro no se crea a medias. Y cubre los DOS caminos,
-- incluido Google, que no pasa por nuestro codigo de servidor.
--
-- El formulario de registro comprueba antes lo mismo para poder dar un mensaje
-- claro; esto es la barrera de verdad, no el formulario.
--
-- LA PRUEBA 5, CORREGIDA DESPUES DE FALLAR
-- La primera version insertaba con el id de una cuenta existente. Fallo con
-- «duplicate key value violates unique constraint users_pkey», y el motivo no era
-- el orden de los triggers: la condicion del trigger lleva `u.id <> NEW.id`
-- —imprescindible para no compararse consigo misma en un UPDATE— y al reutilizar
-- el id quedaba excluida justo la fila que habia que detectar. Ahora usa un id
-- nuevo, y la barrera de reserva es la clave ajena a auth.users.
--
-- NO BORRA NI UNA FILA. No modifica ninguna. Es reejecutable. Y se prueba a si
-- misma, incluido el caso que ya existe.
-- ============================================================================

BEGIN;

-- =====================================================
-- 1. La normalizacion, en un solo sitio
-- =====================================================

CREATE OR REPLACE FUNCTION public.correo_normalizado(p_correo text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = pg_temp
AS $fn$
  SELECT CASE
    WHEN p_correo IS NULL OR position('@' in p_correo) = 0 THEN lower(p_correo)
    WHEN lower(split_part(p_correo, '@', 2)) IN ('gmail.com', 'googlemail.com')
      THEN replace(split_part(lower(split_part(p_correo, '@', 1)), '+', 1), '.', '')
           || '@gmail.com'
    ELSE split_part(lower(split_part(p_correo, '@', 1)), '+', 1)
         || '@' || lower(split_part(p_correo, '@', 2))
  END
$fn$;

COMMENT ON FUNCTION public.correo_normalizado(text) IS
  'El buzon al que llega un correo, en forma canonica. Gmail y Googlemail: sin puntos, sin sufijo +algo y con el dominio unificado en gmail.com, porque los tres son el mismo buzon. Resto de dominios: solo sin el sufijo +algo, porque ahi los puntos son parte del nombre. IMMUTABLE para poder usarse en una columna generada y en un indice.';

REVOKE ALL ON FUNCTION public.correo_normalizado(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.correo_normalizado(text) TO authenticated, service_role;

-- =====================================================
-- 2. La columna, para que la comprobacion no recorra la tabla
-- =====================================================

ALTER TABLE public.users
  DROP COLUMN IF EXISTS email_normalizado;

ALTER TABLE public.users
  ADD COLUMN email_normalizado text
  GENERATED ALWAYS AS (public.correo_normalizado(email)) STORED;

COMMENT ON COLUMN public.users.email_normalizado IS
  'El buzon de email, en forma canonica: se calcula sola. NO lleva UNIQUE a proposito, porque ya hay dos cuentas legitimas que comparten buzon y un unico exigiria borrar una. La regla la aplica el trigger trg_un_buzon_una_cuenta, que solo mira las cuentas nuevas.';

CREATE INDEX IF NOT EXISTS idx_users_email_normalizado
  ON public.users (email_normalizado);

-- Nadie de fuera necesita leerla: es un derivado del correo, y el correo esta
-- cerrado desde la 049.

-- =====================================================
-- 3. La regla, para las cuentas que vengan
-- =====================================================

CREATE OR REPLACE FUNCTION public.un_buzon_una_cuenta()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_buzon text := public.correo_normalizado(NEW.email);
BEGIN
  IF v_buzon IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.users u
     WHERE u.email_normalizado = v_buzon
       AND u.id <> NEW.id
  ) THEN
    RAISE EXCEPTION
      'Ya existe una cuenta con ese buzon de correo. En Gmail los puntos y el sufijo «+algo» llevan al mismo sitio, asi que esa direccion es la misma que una ya registrada.'
      USING ERRCODE = '23505';
  END IF;

  RETURN NEW;
END
$fn$;

COMMENT ON FUNCTION public.un_buzon_una_cuenta() IS
  'Rechaza crear una cuenta cuyo buzon normalizado ya existe. Mira hacia atras, no hacia los lados: las cuentas que ya comparten buzon se quedan y siguen entrando: esto solo corre al INSERTAR. Devuelve 23505 (unique_violation) para que quien llame lo reconozca como duplicado.';

REVOKE ALL ON FUNCTION public.un_buzon_una_cuenta() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_un_buzon_una_cuenta ON public.users;
CREATE TRIGGER trg_un_buzon_una_cuenta
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.un_buzon_una_cuenta();

-- =====================================================
-- 4. La prueba
-- =====================================================

DO $prueba$
DECLARE
  v_casos text[][] := ARRAY[
    ARRAY['cursos.nodo360@gmail.com',    'cursosnodo360@gmail.com'],
    ARRAY['cursos.nodo360+x@gmail.com',  'cursosnodo360@gmail.com'],
    ARRAY['CURSOS.Nodo360@Gmail.COM',    'cursosnodo360@gmail.com'],
    ARRAY['cursos.nodo360@googlemail.com', 'cursosnodo360@gmail.com'],
    ARRAY['una.persona+facturas@ejemplo.invalid', 'una.persona@ejemplo.invalid'],
    ARRAY['una.persona@ejemplo.invalid',  'una.persona@ejemplo.invalid'],
    ARRAY['sin-arroba',                  'sin-arroba']
  ];
  v_caso     text[];
  v_obtenido text;
  v_correo   text;
  v_buzon    text;
  v_n        integer;
BEGIN
  -- 1. La normalizacion, caso a caso
  FOREACH v_caso SLICE 1 IN ARRAY v_casos LOOP
    v_obtenido := public.correo_normalizado(v_caso[1]);
    IF v_obtenido IS DISTINCT FROM v_caso[2] THEN
      RAISE EXCEPTION 'PRUEBA 1 FALLIDA: «%» se normalizo a «%», esperaba «%».',
        v_caso[1], coalesce(v_obtenido, 'NULL'), v_caso[2];
    END IF;
  END LOOP;
  RAISE NOTICE 'PRUEBA 1  los % casos de normalizacion salen bien              PASA', array_length(v_casos, 1);

  -- 2. Los puntos NO se quitan fuera de Gmail: son parte del nombre
  IF public.correo_normalizado('a.b@ejemplo.invalid') <> 'a.b@ejemplo.invalid' THEN
    RAISE EXCEPTION 'PRUEBA 2 FALLIDA: se quitaron los puntos en un dominio que no es Gmail.';
  END IF;
  RAISE NOTICE 'PRUEBA 2  fuera de Gmail los puntos se respetan                PASA';

  -- 3. La columna generada esta rellena en TODAS las filas
  SELECT count(*) INTO v_n FROM public.users WHERE email IS NOT NULL AND email_normalizado IS NULL;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'PRUEBA 3 FALLIDA: % fila(s) con correo pero sin normalizar.', v_n;
  END IF;
  RAISE NOTICE 'PRUEBA 3  la columna generada esta rellena en todas las filas  PASA';

  -- 4. LAS CUENTAS QUE YA CHOCAN SIGUEN AHI.
  --
  -- Es la razon de que esto sea un trigger y no un UNIQUE: si fuera un indice,
  -- esta migracion no se habria podido aplicar.
  SELECT count(*) INTO v_n FROM (
    SELECT email_normalizado FROM public.users
     WHERE email_normalizado IS NOT NULL
     GROUP BY email_normalizado HAVING count(*) > 1
  ) AS grupos;
  RAISE NOTICE 'PRUEBA 4  % buzon(es) con mas de una cuenta siguen intactos    PASA', v_n;

  -- 5 y 6. EL PAR QUE IMPORTA, CON UN ID NUEVO.
  --
  -- La primera version de estas dos pruebas insertaba con el id de una cuenta que
  -- YA existe, creyendo que la clave primaria serviria para distinguir los casos.
  -- Fallo, y el motivo no era el orden de los triggers: era que la condicion del
  -- propio trigger lleva `u.id <> NEW.id` —imprescindible para no compararse
  -- consigo misma en un UPDATE— y al reutilizar el id quedaba excluida justo la
  -- fila que tenia que detectar. El trigger miraba, no encontraba nada, dejaba
  -- pasar, y moria la clave primaria.
  --
  -- Con un id NUEVO no hay nada excluido, y la barrera de reserva es la clave
  -- ajena a auth.users (users_id_fkey, comprobada: 23503). Los triggers BEFORE
  -- corren antes de que se comprueben las claves ajenas, asi que:
  --
  --     buzon ocupado  ->  23505 con MI mensaje      (lo rechazo la regla)
  --     buzon libre    ->  23503 clave ajena          (la regla dejo pasar)
  --
  -- Dos errores distintos y reconocibles, y no hace falta crear nada en
  -- auth.users, cuyas columnas obligatorias no estan en este repositorio.
  SELECT email INTO v_correo FROM public.users WHERE email IS NOT NULL ORDER BY created_at LIMIT 1;
  v_buzon := public.correo_normalizado(v_correo);

  BEGIN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (gen_random_uuid(),
            split_part(v_buzon, '@', 1) || '+prueba106@' || split_part(v_buzon, '@', 2),
            'prueba 106', 'student');
    RAISE EXCEPTION 'PRUEBA 5 FALLIDA: se pudo crear una cuenta con un buzon ya usado.';
  EXCEPTION
    WHEN unique_violation THEN
      IF position('mismo buzon' in SQLERRM) = 0 AND position('mismo sitio' in SQLERRM) = 0 THEN
        RAISE EXCEPTION 'PRUEBA 5 FALLIDA: el rechazo fue un 23505 pero no del trigger: %', SQLERRM;
      END IF;
      RAISE NOTICE 'PRUEBA 5  un buzon ya usado se rechaza al crear la cuenta    PASA';
    WHEN foreign_key_violation THEN
      RAISE EXCEPTION 'PRUEBA 5 FALLIDA: llego a la clave ajena, o sea que el trigger dejo pasar un buzon ocupado.';
  END;

  -- 6. Y un buzon LIBRE no lo rechaza el trigger: llega hasta la clave ajena
  BEGIN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (gen_random_uuid(),
            'buzon-libre-106-' || floor(random() * 1000000)::text || '@ejemplo.invalid',
            'prueba 106', 'student');
    RAISE EXCEPTION 'PRUEBA 6 FALLIDA: el INSERT paso entero, y deberia morir en la clave ajena.';
  EXCEPTION
    WHEN foreign_key_violation THEN
      RAISE NOTICE 'PRUEBA 6  un buzon libre NO lo rechaza el trigger            PASA';
    WHEN unique_violation THEN
      RAISE EXCEPTION 'PRUEBA 6 FALLIDA: el trigger rechazo un buzon que esta libre: %', SQLERRM;
  END;

  RAISE NOTICE 'Las seis pruebas pasan. Ninguna fila creada ni modificada.';
END
$prueba$;

COMMIT;

-- ============================================================================
-- VERIFICACION
-- ============================================================================

SELECT
  EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public' AND p.proname = 'correo_normalizado')       AS funcion_normaliza,
  EXISTS (SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'users'
             AND column_name = 'email_normalizado')                              AS columna_creada,
  EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_un_buzon_una_cuenta'
            AND tgrelid = 'public.users'::regclass)                              AS trigger_activo,
  EXISTS (SELECT 1 FROM pg_indexes
           WHERE schemaname = 'public' AND indexname = 'idx_users_email_normalizado') AS indice_creado,

  -- La normalizacion, en la propia fila del resultado
  public.correo_normalizado('cursos.nodo360+x@gmail.com')                         AS ejemplo_gmail,
  public.correo_normalizado('una.persona+f@ejemplo.invalid')                       AS ejemplo_otro,

  -- Cuantas cuentas comparten buzon HOY (se quedan como estan)
  (SELECT count(*) FROM (
     SELECT email_normalizado FROM public.users
      WHERE email_normalizado IS NOT NULL
      GROUP BY email_normalizado HAVING count(*) > 1) AS g)                       AS buzones_compartidos,
  (SELECT count(*) FROM public.users)                                             AS usuarios,
  (SELECT count(DISTINCT email_normalizado) FROM public.users)                    AS buzones_distintos,
  (SELECT count(*) FROM public.users WHERE role = 'admin')                         AS admins,
  has_column_privilege('anon', 'public.users', 'email_normalizado', 'SELECT')      AS anon_lee_columna,

  CASE
    WHEN EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                  WHERE n.nspname = 'public' AND p.proname = 'correo_normalizado')
     AND EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public' AND table_name = 'users'
                    AND column_name = 'email_normalizado')
     AND EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_un_buzon_una_cuenta'
                   AND tgrelid = 'public.users'::regclass)
     AND public.correo_normalizado('cursos.nodo360+x@gmail.com') = 'cursosnodo360@gmail.com'
     AND public.correo_normalizado('una.persona+f@ejemplo.invalid') = 'una.persona@ejemplo.invalid'
     AND NOT has_column_privilege('anon', 'public.users', 'email_normalizado', 'SELECT')
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                                             AS veredicto;
