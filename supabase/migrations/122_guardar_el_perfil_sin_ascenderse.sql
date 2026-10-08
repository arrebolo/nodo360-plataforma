-- ============================================================================
-- MIGRACION 122: que se pueda guardar el perfil, y que nadie se ascienda
--
-- APLICADA A MANO EN PRODUCCION EL 2026-10-06, informada con TODO CORRECTO.
--
-- SE VERSIONA TARDE, el 2026-10-07, y conviene que quede dicho: estuvo aplicada
-- un dia sin estar aqui. Se encontro al censar los numeros de
-- supabase/migrations/ para la 123: estaban la 121 y la 123 y faltaba esta.
-- La regla dice que lo que se aplica se versiona, y esta vez no se cumplio.
--
-- La fila de verificacion de aquel dia no quedo anotada. Lo que SI esta medido
-- contra produccion hoy, desde fuera:
--
--   la columna anunciar_logros existe             (el cliente de servicio la lee)
--   anon NO la lee                                42501
--   anon NO puede filtrar por ella                42501
--
-- Lo que no se puede medir desde fuera —el estado de los triggers, los permisos
-- por columna— lo comprueba su propia autoprueba, que va entera aqui debajo.
--
-- RECUENTOS: esta migracion no fija ninguno de produccion. Todo lo que exige
-- son propiedades del esquema —que una columna exista con su NOT NULL y su
-- DEFAULT, que nueve columnas nombradas tengan GRANT UPDATE, que catorce
-- nombradas no lo tengan, que quede exactamente un trigger de updated_at—, y
-- eso vale en cualquier base. El unico `= 9` y el unico `= 0` cuentan columnas
-- enumeradas una por una, no filas.
--
-- UNA PRECONDICION SOBRE DATOS, y a proposito: la autoprueba necesita «al menos
-- una cuenta con rol student». No es del tipo que tumbo a la 123: ahi la
-- precondicion pedia una forma de datos que el proposito de la migracion no
-- necesitaba; aqui no se puede comprobar que «una sesion no se cambia el rol»
-- sin tener una sesion. Y si falta, para con un mensaje claro en vez de pasar
-- en verde sin medir nada, que es el fallo que importa evitar.
--
-- Los cambios en la base son identicos al fichero que se ejecuto
-- (tmp/122-aplicar.sql): esta cabecera es lo unico que se le ha añadido.
--
-- Es pequeña a propósito. La auditoría de las dieciséis migraciones con
-- marcador «pendiente» dejó claro que casi todo estaba ya aplicado, así que
-- aquí no se repite nada: ni los nueve GRANT de la 085 —que están— ni los
-- REVOKE de la 084 y la 086 —que están—.
--
-- ----------------------------------------------------------------------------
-- 1. EL FALLO, REPRODUCIDO
--
-- Guardar el perfil no funciona hoy, y es UNA COLUMNA. `ProfileForm` manda
-- `anunciar_logros` en cada guardado, y esa columna NO EXISTE: la migración 113
-- la crea y nunca se aplicó. Medido con una cuenta de usar y tirar:
--
--   la carga exacta del formulario        -> 400 PGRST204 por anunciar_logros
--   la misma carga SIN esa columna        -> 204, y la fila cambia
--   solo anunciar_logros                  -> 400
--
-- Un PATCH es atómico: una columna inexistente tumba el resto. Así que los
-- nueve campos que sí tienen permiso no llegan nunca a escribirse.
--
-- Y NO, el formulario no pide la fila de vuelta: no lleva `.select()`, así que
-- supabase-js manda `Prefer: return=minimal`. Eso importa porque es la trampa
-- en la que caí yo, y está contada abajo.
--
-- ----------------------------------------------------------------------------
-- 2. LO QUE CREÍ Y NO ERA: «authenticated no puede escribir nada»
--
-- Antes de esto medí que `authenticated` no podía escribir NINGUNA de las 26
-- columnas de `users`: 42501 en todas. Era falso, y el error era mío. El mismo
-- PATCH, cambiando solo una cabecera:
--
--   Prefer: return=representation  ->  403  permission denied for table users
--   Prefer: return=minimal         ->  204  y la fila cambia
--
-- `return=representation` obliga a PostgREST a hacer RETURNING, y devolver la
-- fila exige SELECT sobre las columnas devueltas. `authenticated` lee cinco de
-- las veintiséis, así que el 42501 venía de LA LECTURA. Un error que no
-- distingue leer de escribir hace creer que una tabla está cerrada cuando está
-- abierta, y eso habría llevado a conceder permisos que ya existen.
--
-- Por eso esta migración NO concede los nueve del perfil: están. Medido columna
-- por columna, escribiendo con `return=minimal` y comprobando el efecto con el
-- cliente de servicio, en scripts/medir-que-puede-escribir-un-usuario.mts.
--
-- ----------------------------------------------------------------------------
-- 3. LA DEFENSA QUE FALTA
--
-- Hoy lo único que impide que una cuenta registrada se ponga `role = 'admin'`
-- desde el navegador es UN PERMISO DE COLUMNA, sin ningún trigger detrás:
--
--   · la 084 no concedió `UPDATE (role)`, y ahí acaba la defensa;
--   · el trigger de la 100 NO lo habría parado. Su propio código lo dice:
--     `IF OLD.role <> 'admin' ... RETURN NEW`, con el comentario «ascender a
--     alguien A admin es otra cosa y no se toca». Solo protege filas que YA son
--     de administración;
--   · la 089 y la 091 no vigilan `users`: son publicación de cursos y referidos.
--
-- No hay agujero hoy. Lo que hay es una sola línea de defensa, y esta migración
-- justo viene a CONCEDER un permiso de escritura más. El trigger es para que el
-- día que alguien conceda `UPDATE (role)` —por prisa, por copiar y pegar, por
-- arreglar otra cosa— no se abra la puerta sin que nadie se entere.
--
-- UNA COLUMNA QUE QUEDA FUERA, Y POR UN MOTIVO MEDIDO: `updated_at`.
--
-- `trigger_users_updated_at` (085) es BEFORE UPDATE y le pone `now()` en cada
-- escritura, así que si este trigger la vigilara podría ver una fecha distinta y
-- rechazar escrituras legítimas. Lo PROBÉ en el banco de pruebas, y el resultado
-- no es el que yo esperaba: depende del ORDEN DE DISPARO, que en PostgreSQL es
-- ALFABÉTICO POR NOMBRE DE TRIGGER.
--
--   trg_privilegio_solo_admin_o_servidor  va ANTES que trigger_users_updated_at
--     -> cuando mira, la fecha aún no ha cambiado      -> inocuo
--   el mismo trigger llamado zzz_privilegio_...        va DESPUÉS
--     -> ve la fecha que acaba de poner el otro        -> ROMPE TODAS LAS ESCRITURAS
--
-- Las dos cosas medidas, ejecutando. Así que vigilarla «funciona» hoy por el
-- nombre que lleva el trigger, y eso no es algo de lo que pueda depender una
-- regla de seguridad: el día que alguien lo renombre, se cae el guardado de
-- perfil de toda la plataforma y nadie sabrá por qué.
--
-- Queda fuera, y no se pierde nada: está medido que `authenticated` no puede
-- escribir `updated_at` (42501), no da privilegio ninguno, y la pone la base.
--
-- ----------------------------------------------------------------------------
-- 4. Y SOBRA UN TRIGGER
--
-- `public.users` tiene DOS triggers que hacen lo mismo:
--
--   trigger_users_updated_at  -> public.tocar_updated_at()        (085)
--   update_users_updated_at   -> public.update_updated_at_column() (esquema inicial)
--
-- Los dos ponen `NEW.updated_at := now()` y se pisan sin consecuencia, porque
-- el segundo escribe lo mismo que el primero. Se retira el de la 005 por tres
-- razones: no lo crea ninguna migración versionada —viene del esquema inicial,
-- que no está en el repositorio—, su función NO tiene `SET search_path` y por
-- tanto incumple la regla de CLAUDE.md, y el COMMENT de la tabla (086) ya
-- documenta el otro como el que pone la fecha. La FUNCIÓN no se toca: la usan
-- muchas otras tablas.
--
-- ----------------------------------------------------------------------------
-- EJECUTADA ANTES DE DARLA. Esta migración se ha corrido entera contra un
-- PostgreSQL de verdad —PGlite, en un andamio con los permisos y los triggers
-- que están medidos en producción— con `scripts/probar-una-migracion.mts`. Allí
-- se cayó DOS VECES antes de llegar aquí:
--
--   22P02  malformed array literal: "role"   (el `||` sobre un array; ahora
--          array_append, y explicado donde ocurrió)
--   42501  permission denied for table users (la autoprueba hacía
--          `anunciar_logros = anunciar_logros`, y el lado derecho LEE una
--          columna que authenticated no puede leer)
--
-- Y su autoprueba se ha visto EN ROJO rompiendo a propósito lo que vigila:
-- quitando la línea de `role` cae la PRUEBA 1, eximiendo a todo el mundo cae la
-- PRUEBA 1, y no retirando el trigger duplicado cae la PRUEBA 6.
--
-- QUE DEBE SALIR: los NOTICE de la autoprueba, todos PASA, y una sola fila que
-- diga TODO CORRECTO. Si algo falla, la transacción entera se deshace.
--
-- LO QUE ESTA MIGRACION TOCA DE DATOS AJENOS: nada, salvo que la autoprueba
-- mueve el `updated_at` de UNA fila existente, porque para comprobar que el
-- trigger no estorba hay que hacer un UPDATE de verdad y la base pone esa fecha
-- sola. Ni un rol, ni un nombre, ni una suspensión.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. La columna que falta (lo que hacía falta de la 113)
-- ============================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS anunciar_logros boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.users.anunciar_logros IS
  'La persona acepta que sus logros —cursos completados— se anuncien con su nombre en los canales de la comunidad. FALSE por defecto: sin marcarla no se publica nada. Se cambia desde /dashboard/perfil. No es legible por anon ni authenticated: el propio dueño la lee por mi_perfil() y quien decide si publicar es el servidor.';

-- Escribirla sí, leerla no: el dueño la recibe por mi_perfil(), que es
-- SECURITY DEFINER y le devuelve su fila entera.
GRANT UPDATE (anunciar_logros) ON public.users TO authenticated;

-- ============================================================================
-- 2. Fuera el trigger de updated_at que sobra
-- ============================================================================
-- Solo el trigger sobre `users`. La función update_updated_at_column() se queda:
-- la usan otras tablas.

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;

-- ============================================================================
-- 3. Las columnas de privilegio no las toca una sesión
-- ============================================================================
-- SOLO OPINA SOBRE LO QUE LLEGA POR UNA SESION O POR LA CLAVE ANONIMA.
--
-- Esa es la clave del diseño, y es a propósito: `current_user NOT IN
-- ('authenticated','anon') THEN RETURN NEW`. Así no puede romper nada del
-- servidor —el cliente de servicio, las migraciones, el editor SQL, ni ningún
-- trigger interno de Supabase que sincronice el correo—, y vigila exactamente
-- la vía que hay que vigilar: el navegador. Enumerar los roles exentos uno por
-- uno habría dejado fuera alguno sin que se notara hasta romperlo.
--
-- La administración CON SESION sí puede: el panel cambia roles y suspende
-- cuentas, y lo hace con la sesión del admin en varias pantallas.

CREATE OR REPLACE FUNCTION public.las_columnas_de_privilegio_no_las_toca_una_sesion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_tocadas text[] := ARRAY[]::text[];
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  -- `updated_at` NO está en esta lista, y no es un olvido: que vigilarla rompa o
  -- no depende del ORDEN ALFABÉTICO de los nombres de los triggers (medido: con
  -- este nombre es inocuo, llamándolo zzz_ rompe todas las escrituras), y una
  -- regla de seguridad no puede depender de eso. Ver la cabecera.
  --
  -- Y `array_append`, NO `v_tocadas || 'role'`. La primera version de esto usaba
  -- el `||`, y con un array a la izquierda y un literal SIN TIPO a la derecha
  -- PostgreSQL resuelve el literal como ARRAY, no como texto, y se levanta con
  --     22P02  malformed array literal: "role"
  -- La migracion no se aplico por eso. El `||` sirve si el lado derecho lleva
  -- tipo —`|| 'role'::text`, como hace la 087—, pero `array_append` no se puede
  -- malinterpretar.
  IF NEW.id                   IS DISTINCT FROM OLD.id                   THEN v_tocadas := array_append(v_tocadas, 'id'); END IF;
  IF NEW.role                 IS DISTINCT FROM OLD.role                 THEN v_tocadas := array_append(v_tocadas, 'role'); END IF;
  IF NEW.email                IS DISTINCT FROM OLD.email                THEN v_tocadas := array_append(v_tocadas, 'email'); END IF;
  IF NEW.email_confirmed_at   IS DISTINCT FROM OLD.email_confirmed_at   THEN v_tocadas := array_append(v_tocadas, 'email_confirmed_at'); END IF;
  IF NEW.created_at           IS DISTINCT FROM OLD.created_at           THEN v_tocadas := array_append(v_tocadas, 'created_at'); END IF;
  IF NEW.is_suspended         IS DISTINCT FROM OLD.is_suspended         THEN v_tocadas := array_append(v_tocadas, 'is_suspended'); END IF;
  IF NEW.suspended_at         IS DISTINCT FROM OLD.suspended_at         THEN v_tocadas := array_append(v_tocadas, 'suspended_at'); END IF;
  IF NEW.suspended_reason     IS DISTINCT FROM OLD.suspended_reason     THEN v_tocadas := array_append(v_tocadas, 'suspended_reason'); END IF;
  IF NEW.suspended_by         IS DISTINCT FROM OLD.suspended_by         THEN v_tocadas := array_append(v_tocadas, 'suspended_by'); END IF;
  IF NEW.is_beta              IS DISTINCT FROM OLD.is_beta              THEN v_tocadas := array_append(v_tocadas, 'is_beta'); END IF;
  IF NEW.is_beta_enabled      IS DISTINCT FROM OLD.is_beta_enabled      THEN v_tocadas := array_append(v_tocadas, 'is_beta_enabled'); END IF;
  IF NEW.welcome_email_sent_at IS DISTINCT FROM OLD.welcome_email_sent_at THEN v_tocadas := array_append(v_tocadas, 'welcome_email_sent_at'); END IF;
  IF NEW.last_seen_at         IS DISTINCT FROM OLD.last_seen_at         THEN v_tocadas := array_append(v_tocadas, 'last_seen_at'); END IF;

  -- Si no se ha tocado ninguna, fuera sin preguntar nada mas. Importa el orden:
  -- asi un guardado de perfil normal no llama a es_admin_actual() ni una vez.
  -- Y `cardinality` y no `array_length`, que devuelve NULL con el array vacio.
  IF cardinality(v_tocadas) = 0 THEN
    RETURN NEW;
  END IF;

  -- La administracion con sesion si puede: el panel cambia roles y suspende.
  IF current_user = 'authenticated' AND public.es_admin_actual() THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION
      'Una sesion no cambia las columnas de privilegio de una ficha de usuario. Se intento: %. Esto lo hace la administracion desde el panel, o el servidor.',
      array_to_string(v_tocadas, ', ')
      USING ERRCODE = '42501';
END
$fn$;

COMMENT ON FUNCTION public.las_columnas_de_privilegio_no_las_toca_una_sesion() IS
  'Impide que una sesion (o la clave anonima) cambie rol, correo, suspension o marcas de beta y de sistema de una ficha de usuario, incluida la propia. No opina sobre lo que llega con otro rol de base —servicio, migraciones, triggers internos— ni sobre la administracion con sesion. Es defensa en profundidad: hoy lo que lo impide es el permiso de columna de la 084, y esto es la segunda cerradura. NO vigila updated_at a proposito: la pone trigger_users_updated_at en cada escritura y vigilarla rechazaria todos los guardados de perfil.';

REVOKE ALL ON FUNCTION public.las_columnas_de_privilegio_no_las_toca_una_sesion() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_privilegio_solo_admin_o_servidor ON public.users;
CREATE TRIGGER trg_privilegio_solo_admin_o_servidor
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.las_columnas_de_privilegio_no_las_toca_una_sesion();

-- ============================================================================
-- 4. AUTOPRUEBA
-- ============================================================================
-- VISTA EN ROJO DE LA UNICA FORMA QUE SIRVE: concediendo a proposito
-- `UPDATE (role)` a authenticated dentro de esta transaccion, que es el estado
-- que el trigger existe para defender. Con ese permiso puesto, lo UNICO que
-- separa a una cuenta registrada de `role = 'admin'` es este trigger. Y no basta
-- con mirar el SQLSTATE: un 42501 lo da tambien el permiso de columna, asi que
-- la prueba exige que el mensaje sea EL DEL TRIGGER. Si no se distinguen, la
-- prueba pasaria igual sin trigger, por el permiso que acabamos de conceder.
--
-- No cambia el rol de nadie: los intentos se levantan. Y el GRANT peligroso no
-- puede quedarse puesto: va dentro de esta transaccion, asi que si algo falla se
-- deshace con todo lo demas, y si no falla lo retira la PRUEBA 5, que ademas
-- comprueba que el REVOKE ha surtido efecto.

DO $prueba$
DECLARE
  v_persona uuid;
  v_nombre  text;
  v_rol     text;
  v_consent boolean;
  v_mensaje text;
  v_paso    boolean;
  v_toco    boolean;
BEGIN
  PERFORM set_config('request.jwt.claims', '{}', true);

  SELECT id, full_name, role::text, anunciar_logros
    INTO v_persona, v_nombre, v_rol, v_consent
    FROM public.users WHERE role = 'student' LIMIT 1;
  IF v_persona IS NULL THEN
    RAISE EXCEPTION 'La autoprueba necesita al menos una cuenta con rol student.';
  END IF;

  -- ── 0. La columna está y se puede escribir ───────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public' AND table_name = 'users'
                    AND column_name = 'anunciar_logros') THEN
    RAISE EXCEPTION 'PRUEBA 0 FALLIDA: anunciar_logros no se ha creado.';
  END IF;
  IF NOT has_column_privilege('authenticated', 'public.users', 'anunciar_logros', 'UPDATE') THEN
    RAISE EXCEPTION 'PRUEBA 0 FALLIDA: authenticated no puede escribir anunciar_logros.';
  END IF;
  RAISE NOTICE 'PRUEBA 0  anunciar_logros existe y authenticated la escribe       PASA';

  -- ── EL PERMISO PELIGROSO, A PROPOSITO ────────────────────────────────────
  GRANT UPDATE (role) ON public.users TO authenticated;

  -- ── 1. Con el permiso puesto, el trigger lo para IGUAL ───────────────────
  v_paso := false;
  v_mensaje := '';
  BEGIN
    SET LOCAL ROLE authenticated;
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_persona)::text, true);
    UPDATE public.users SET role = 'admin' WHERE id = v_persona;
    v_toco := FOUND;
    v_paso := true;
  EXCEPTION WHEN insufficient_privilege THEN
    v_mensaje := SQLERRM;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '{}', true);

  IF v_paso THEN
    RAISE EXCEPTION
      'PRUEBA 1 FALLIDA: con UPDATE (role) concedido, una sesion se ha podido poner admin (toco % fila(s)). El trigger no esta defendiendo nada.',
      v_toco;
  END IF;
  -- Y QUE LO HAYA PARADO EL TRIGGER, no el permiso que acabamos de conceder.
  IF v_mensaje NOT LIKE '%Una sesion no cambia las columnas de privilegio%' THEN
    RAISE EXCEPTION
      'PRUEBA 1 NO MIDE: el intento se levanto, pero no con el mensaje del trigger, sino con «%». Sin eso, esta prueba pasaria igual por el permiso de columna y no probaria el trigger.',
      left(v_mensaje, 120);
  END IF;
  IF (SELECT role::text FROM public.users WHERE id = v_persona) <> v_rol THEN
    RAISE EXCEPTION 'PRUEBA 1 FALLIDA: el rol cambio aunque el UPDATE diera error.';
  END IF;
  RAISE NOTICE 'PRUEBA 1  con UPDATE(role) concedido, el trigger lo para          PASA';

  -- ── 2. Y el mensaje nombra la columna, para que se entienda ──────────────
  IF v_mensaje NOT LIKE '%role%' THEN
    RAISE EXCEPTION 'PRUEBA 2 FALLIDA: el error no dice que columna se intento tocar: «%».', left(v_mensaje, 120);
  END IF;
  RAISE NOTICE 'PRUEBA 2  el error dice que columna se intento tocar              PASA';

  -- ── 3. Pero una sesión sigue guardando su perfil ─────────────────────────
  -- Esto es lo que impide el falso verde: si el trigger estorbara a un UPDATE
  -- normal, la prueba 1 estaria «pasando» por bloquearlo todo.
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_persona)::text, true);
  -- OJO: `anunciar_logros = anunciar_logros` NO vale, y asi fallo la primera
  -- version de esta migracion en el banco de pruebas con 42501. El lado derecho
  -- LEE la columna, y leerla exige SELECT sobre ella: `anunciar_logros` es de
  -- escritura pero NO de lectura para authenticated, a proposito (la lee su
  -- dueño por mi_perfil()). Es el mismo error que mezclar un RETURNING en un
  -- UPDATE. Y poner un literal tampoco vale: `= true` le daria consentimiento a
  -- una persona real para publicar sus logros. Se escribe EL VALOR QUE YA TENIA,
  -- leido antes con el rol de la migracion, desde una variable.
  UPDATE public.users SET full_name = v_nombre, anunciar_logros = v_consent
   WHERE id = v_persona;
  v_toco := FOUND;
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '{}', true);
  IF NOT v_toco THEN
    RAISE EXCEPTION
      'PRUEBA 3 NO SE PUDO MONTAR: la sesion no pudo escribir su propio perfil, asi que la prueba 1 tampoco medía el trigger. Parar.';
  END IF;
  RAISE NOTICE 'PRUEBA 3  la sesion sigue guardando su perfil (y la 1 medía)      PASA';

  -- ── 4. El servidor por su rol de base no se entera del trigger ───────────
  SET LOCAL ROLE service_role;
  UPDATE public.users SET last_seen_at = now() WHERE id = v_persona;
  v_toco := FOUND;
  RESET ROLE;
  IF NOT v_toco THEN
    RAISE EXCEPTION 'PRUEBA 4 FALLIDA: el cliente de servicio no pudo escribir una columna que si escribe hoy.';
  END IF;
  RAISE NOTICE 'PRUEBA 4  el servidor escribe columnas de sistema como siempre    PASA';

  -- ── DEVOLVER EL PERMISO PELIGROSO ────────────────────────────────────────
  REVOKE UPDATE (role) ON public.users FROM authenticated;

  -- ── 5. Y sin el permiso, ni siquiera llega al trigger ────────────────────
  v_paso := false;
  v_mensaje := '';
  BEGIN
    SET LOCAL ROLE authenticated;
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_persona)::text, true);
    UPDATE public.users SET role = 'admin' WHERE id = v_persona;
    v_paso := true;
  EXCEPTION WHEN insufficient_privilege THEN
    v_mensaje := SQLERRM;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '{}', true);
  IF v_paso THEN
    RAISE EXCEPTION 'PRUEBA 5 FALLIDA: el REVOKE de UPDATE (role) no ha surtido efecto.';
  END IF;
  IF v_mensaje LIKE '%Una sesion no cambia las columnas de privilegio%' THEN
    RAISE EXCEPTION
      'PRUEBA 5 NO MIDE: deberia haberlo parado el permiso de columna y lo paro el trigger, asi que el REVOKE no se aplico.';
  END IF;
  RAISE NOTICE 'PRUEBA 5  revocado el permiso, lo para el permiso (las dos vallas) PASA';

  -- ── 6. Solo queda un trigger de updated_at ───────────────────────────────
  IF (SELECT count(*) FROM pg_trigger t
       WHERE t.tgrelid = 'public.users'::regclass
         AND NOT t.tgisinternal
         AND t.tgname IN ('trigger_users_updated_at', 'update_users_updated_at')) <> 1 THEN
    RAISE EXCEPTION 'PRUEBA 6 FALLIDA: sobre users no queda exactamente un trigger de updated_at.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger t
                  WHERE t.tgrelid = 'public.users'::regclass
                    AND t.tgname = 'trigger_users_updated_at' AND NOT t.tgisinternal) THEN
    RAISE EXCEPTION 'PRUEBA 6 FALLIDA: se ha quedado el trigger equivocado.';
  END IF;
  RAISE NOTICE 'PRUEBA 6  queda un solo trigger de updated_at, el de la 085       PASA';
END
$prueba$;

COMMIT;

-- ============================================================================
-- 5. VERIFICACION: una sola fila
-- ============================================================================
-- Sin un solo recuento de produccion: todo son propiedades que valen en
-- cualquier base y en cualquier momento.

SELECT
  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users'
      AND column_name = 'anunciar_logros'
      AND is_nullable = 'NO' AND column_default = 'false')                      AS columna_bien_puesta,

  has_column_privilege('authenticated', 'public.users', 'anunciar_logros', 'UPDATE') AS la_escribe_una_sesion,
  has_column_privilege('anon',          'public.users', 'anunciar_logros', 'SELECT') AS la_lee_anon,

  -- Las catorce de privilegio: ninguna escribible por una sesion ni por anon
  (SELECT count(*) FROM (VALUES ('id'),('role'),('email'),('email_confirmed_at'),
                                ('created_at'),('is_suspended'),('suspended_at'),
                                ('suspended_reason'),('suspended_by'),('is_beta'),
                                ('is_beta_enabled'),('welcome_email_sent_at'),
                                ('last_seen_at'),('updated_at')) v(col)
    WHERE has_column_privilege('authenticated', 'public.users', v.col, 'UPDATE')
       OR has_column_privilege('anon',          'public.users', v.col, 'UPDATE')) AS sensibles_escribibles,

  -- Las nueve del perfil: las nueve, ni una menos
  (SELECT count(*) FROM (VALUES ('full_name'),('bio'),('avatar_url'),('avatar_path'),
                                ('website'),('twitter'),('linkedin'),('github'),
                                ('wants_beta_notification')) v(col)
    WHERE has_column_privilege('authenticated', 'public.users', v.col, 'UPDATE')) AS del_perfil_escribibles,

  (SELECT tgenabled FROM pg_trigger
    WHERE tgname = 'trg_privilegio_solo_admin_o_servidor'
      AND tgrelid = 'public.users'::regclass)                                   AS defensa_activa,

  (SELECT count(*) FROM pg_proc p
    WHERE p.proname = 'las_columnas_de_privilegio_no_las_toca_una_sesion'
      AND pg_get_functiondef(p.oid) LIKE '%current_user NOT IN%')               AS exime_por_rol_de_base,

  (SELECT count(*) FROM pg_trigger t
    WHERE t.tgrelid = 'public.users'::regclass AND NOT t.tgisinternal
      AND t.tgname IN ('trigger_users_updated_at', 'update_users_updated_at'))  AS triggers_de_updated_at,

  CASE
    WHEN (SELECT count(*) FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'users'
             AND column_name = 'anunciar_logros'
             AND is_nullable = 'NO' AND column_default = 'false') = 1
     AND has_column_privilege('authenticated', 'public.users', 'anunciar_logros', 'UPDATE')
     AND NOT has_column_privilege('anon', 'public.users', 'anunciar_logros', 'SELECT')
     AND (SELECT count(*) FROM (VALUES ('id'),('role'),('email'),('email_confirmed_at'),
                                       ('created_at'),('is_suspended'),('suspended_at'),
                                       ('suspended_reason'),('suspended_by'),('is_beta'),
                                       ('is_beta_enabled'),('welcome_email_sent_at'),
                                       ('last_seen_at'),('updated_at')) v(col)
           WHERE has_column_privilege('authenticated', 'public.users', v.col, 'UPDATE')
              OR has_column_privilege('anon',          'public.users', v.col, 'UPDATE')) = 0
     AND (SELECT count(*) FROM (VALUES ('full_name'),('bio'),('avatar_url'),('avatar_path'),
                                       ('website'),('twitter'),('linkedin'),('github'),
                                       ('wants_beta_notification')) v(col)
           WHERE has_column_privilege('authenticated', 'public.users', v.col, 'UPDATE')) = 9
     AND (SELECT tgenabled FROM pg_trigger
           WHERE tgname = 'trg_privilegio_solo_admin_o_servidor'
             AND tgrelid = 'public.users'::regclass) = 'O'
     AND (SELECT count(*) FROM pg_proc p
           WHERE p.proname = 'las_columnas_de_privilegio_no_las_toca_una_sesion'
             AND pg_get_functiondef(p.oid) LIKE '%current_user NOT IN%') = 1
     AND (SELECT count(*) FROM pg_trigger t
           WHERE t.tgrelid = 'public.users'::regclass AND NOT t.tgisinternal
             AND t.tgname IN ('trigger_users_updated_at', 'update_users_updated_at')) = 1
    THEN 'TODO CORRECTO'
    ELSE 'REVISAR'
  END AS veredicto;

-- ============================================================================
-- 6. VUELTA ATRAS
-- ============================================================================
-- Pegar y ejecutar TAL CUAL. Deja la base como estaba, con el perfil roto otra
-- vez: eso es lo que había.
--
-- BEGIN;
--
-- DROP TRIGGER IF EXISTS trg_privilegio_solo_admin_o_servidor ON public.users;
-- DROP FUNCTION IF EXISTS public.las_columnas_de_privilegio_no_las_toca_una_sesion();
--
-- REVOKE UPDATE (anunciar_logros) ON public.users FROM authenticated;
-- ALTER TABLE public.users DROP COLUMN IF EXISTS anunciar_logros;
--
-- -- Y el trigger duplicado de updated_at, con la funcion del esquema inicial:
-- CREATE TRIGGER update_users_updated_at
--   BEFORE UPDATE ON public.users
--   FOR EACH ROW
--   EXECUTE FUNCTION public.update_updated_at_column();
--
-- COMMIT;
-- ============================================================================
