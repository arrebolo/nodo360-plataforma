-- ============================================================================
-- MIGRACION 123: el rol deja de ser legible, y la ficha publica se gana
--                por funcion, no por rol
--
-- APLICADA A MANO EN PRODUCCION EL 2026-10-07, con TODO CORRECTO. Lo que salio:
--
--   politicas_de_users        4
--   politica_nueva            true
--   sigue_read_own            true
--   sigue_la_vieja            false
--   anon_lee_role             false
--   authenticated_lee_role    true
--   role_en_la_vista          false
--   filas_de_la_vista         1      <- eran 2: se cae la cuenta admin
--   admins_que_son_publicos   0      <- eran 2 por la tabla y 1 por la vista
--   anon_sigue_por_rol        1      <- lo que NO cierra; lo cierra la 125
--   ramas_sin_comprobar       la rama de los mentores (no hay ninguno activo
--                             en user_roles)
--
-- Y comprobado despues contra produccion, con la clave anonima, que es publica:
--
--   users?role=eq.admin              42501 permission denied for table users
--   users?select=id,role             42501
--   users?order=role.desc            42501
--   perfiles_publicos?role=eq.admin  42703 column ... does not exist
--   la consulta del modal            1 fila, es_instructor=true
--
-- MURIO EN EL PRIMER INTENTO, y el motivo esta contado abajo porque es la razon
-- de como esta escrita la autoprueba: tenia una precondicion que esperaba un
-- curso publicado firmado por persona, y en produccion el unico firmado por
-- persona es un borrador. Una precondicion sobre datos de produccion no es una
-- comprobacion: es una suposicion. Ahora los casos que hacen falta SE MONTAN
-- dentro de la autoprueba, en subtransacciones que se deshacen.
--
-- Del fichero ejecutado solo cambio una cosa, y no toca la base: el veredicto
-- exigia `politicas_de_users = 4`, que es un recuento de esta base y no una
-- propiedad. Ahora exige las tres politicas por nombre, que es lo que de verdad
-- importa. Los cambios en la base son identicos a lo ejecutado.
--
-- Cierra la enumeracion de cuentas de administracion. Hoy se puede hacer sin
-- sesion, con la clave anonima, que es publica y esta en el navegador:
--
--   anon  users?role=eq.admin              ->  2 filas      <- las dos admins
--   anon  perfiles_publicos?role=eq.admin  ->  1 fila
--
-- Medido contra produccion el 2026-10-06. No es una suposicion: son dos
-- peticiones a la API con la clave que cualquiera puede leer del bundle.
--
-- Cuatro cambios, y el cuarto no estaba en el plan. Esta explicado abajo.
--
--   1. REVOKE SELECT (role) ON users FROM anon
--   2. perfiles_publicos, sin la columna role
--   3. users_read_all_authenticated  ->  users_read_funcion_publica
--   4. «funcion publica» deja de incluir «autor de un curso de la plataforma»
--
-- ----------------------------------------------------------------------------
-- POR QUE EL REVOKE BASTA PARA anon, Y POR QUE NO BASTA UNA POLITICA
--
-- Filtrar u ordenar por una columna sin permiso de SELECT da 42501, no cero
-- filas. Eso es lo que cierra la enumeracion: sin leer `role` no se puede
-- preguntar «quien es admin». La politica de anon sigue mirando `role` en su
-- USING y eso NO se rompe: una expresion de politica no esta sujeta a los
-- permisos por columna de quien pregunta. Esta comprobado en la autoprueba,
-- porque es exactamente la clase de cosa que no se debe suponer.
--
-- ----------------------------------------------------------------------------
-- POR QUE UNA FUNCION SECURITY DEFINER Y NO UN EXISTS EN LA POLITICA
--
-- La politica nueva pregunta por tres tablas. Medido con la clave de servicio
-- y con la anonima, el mismo dia:
--
--   instructor_profiles   servicio 1 fila    anon 1 fila
--   user_roles            servicio 2 filas   anon 0 filas   <- la RLS las tapa
--   courses               servicio 16 filas  anon 10 filas  <- solo publicados
--
-- Un `EXISTS (SELECT 1 FROM user_roles ...)` dentro de la politica se evalua
-- con los permisos de quien pregunta, asi que la RLS de `user_roles` lo deja a
-- cero: la rama de los mentores naceria MUERTA, y nadie se enteraria hasta que
-- hubiera un mentor activo. Por eso va en `es_funcion_publica()`, que es
-- SECURITY DEFINER, como `es_admin_actual()` de la 034.
--
-- Hoy hay 0 mentores activos en `user_roles`, asi que en produccion esa rama no
-- se puede probar. En el banco de pruebas si: su andamio tiene uno, con la RLS
-- de `user_roles` puesta igual que la medida.
--
-- ----------------------------------------------------------------------------
-- EL CUARTO CAMBIO, QUE NO ESTABA EN EL PLAN Y HACE FALTA
--
-- El encargo dice: «con la clave anonima y con una sesion de estudiante, ni
-- users?role=eq.admin ni perfiles_publicos?role=eq.admin devuelven nada».
--
-- Con la clave anonima, los tres primeros cambios lo consiguen. CON UNA SESION
-- DE ESTUDIANTE, NO, y no por un descuido: `authenticated` SI puede leer
-- `role` —lo necesita, media docena de paginas del panel comprueban su propio
-- rol con `select('role').eq('id', user.id)`—, asi que la pregunta no da 42501
-- sino las filas que la politica deje ver. Y la politica nueva deja ver a
-- quien es «funcion publica», entre lo que esta «autor de un curso
-- publicado»... que es justo lo que es la cuenta de administracion: firma los
-- 15 cursos de la plataforma. Resultado: 1 fila, y el encargo incumplido.
--
-- Las dos salidas:
--
--   (a) Quitarle `role` tambien a `authenticated`. ROMPE LA APLICACION: esas
--       paginas del panel leen su propio rol de `users`. Descartada.
--   (b) Que «autor de un curso publicado» signifique «autor de un curso que
--       de verdad muestra a su autor».
--
-- (b) no es un apaño para pasar la prueba: es lo que la 121 ya decidio. Desde
-- la 121 un curso firmado por la plataforma NO muestra autor en ninguna
-- pantalla —el servidor ni manda el objeto—, asi que esa cuenta no tiene
-- ninguna pagina publica que justifique que su ficha sea legible. La ficha
-- publica se gana por tener algo publico que mostrar.
--
-- LOS CURSOS QUE HAY, medidos el 2026-10-06 con la clave de servicio:
--
--   published  firmado por la plataforma  10
--   archived   firmado por la plataforma   5
--   draft      firmado por PERSONA         1   <- auditoria-ethereum-v2
--
-- O sea: NO HAY NINGUN CURSO PUBLICADO FIRMADO POR PERSONA. El unico que lo
-- esta es un borrador, asi que la rama de autor no tiene hoy a quien dar ficha
-- publica, ni antes ni despues de apretarla. La primera version de esta
-- migracion daba eso por supuesto en una precondicion y murio al aplicarla.
--
-- LO QUE ESTO CAMBIA, dicho entero: `perfiles_publicos` pasa de 2 filas a 1.
--
--   antes:  instructor  es_instructor=true   es_autor=false
--           admin       es_instructor=false  es_autor=true   <- firma los 10
--   despues: solo la instructor
--
-- Se cae la cuenta de administracion, que estaba SOLO por firmar los cursos de
-- la plataforma. La instructor se queda POR SU PERFIL DE INSTRUCTOR ACTIVO, no
-- por autoria: su es_autor ya era false, porque su unico curso es un borrador.
-- La otra admin no estaba ni antes. Ninguna pantalla publica lee la fila que se
-- cae: /instructores/[id] y /mentores/[id] leen la vista para instructores y
-- mentores, y los autores que se muestran son los de cursos firmados por
-- persona, de los que no hay ninguno publicado.
--
-- ----------------------------------------------------------------------------
-- LO QUE NO TOCA
--
--   · `users_read_own` queda tal cual: la fila propia se lee siempre.
--   · `users_update_own` y «Public can read basic user info», tal cual.
--   · `authenticated` conserva SELECT (role). Solo lo pierde `anon`.
--   · `es_instructor`, `es_mentor`, `es_autor` y `bio` siguen en la vista:
--     `InstructorPreviewModal` pide `bio, es_instructor, es_mentor` y sigue
--     funcionando. Comprobado en la autoprueba.
--
-- ----------------------------------------------------------------------------
-- LO QUE ESTO NO CIERRA, Y LO PUSO EN ROJO EL BANCO DE PRUEBAS
--
-- La autoprueba llevaba una comprobacion mas: que anon no pudiera leer la ficha
-- de una cuenta de administracion NI pidiendola por id. FALLO en el banco, y
-- esta bien que fallara, porque es verdad:
--
--   La politica de anon, «Public can read basic user info», SIGUE SIENDO POR
--   ROL: USING (role = ANY (ARRAY['instructor','mentor','admin']) OR id =
--   auth.uid()). Esta migracion no la toca, porque no estaba en el encargo.
--
-- Lo que SI cierra el REVOKE es la IDENTIFICACION: sin leer `role` no se puede
-- preguntar «quien es admin», ni por la tabla ni por la vista. Lo que NO cierra
-- es la LECTURA de una ficha cuyo id ya se conozca, ni que sin sesion se puedan
-- listar las cuatro filas no estudiantes —sin saber cual es cual—.
--
-- Y deja una asimetria que no tiene sentido: TRAS ESTA MIGRACION UN ESTUDIANTE
-- CON SESION VE MENOS QUE UN VISITANTE ANONIMO. La sesion se rige por funcion;
-- anon, todavia por rol.
--
-- NO se ha suavizado la autoprueba para que pase: esa comprobacion sigue ahi,
-- convertida en una medicion que sale en la fila de verificacion
-- (`anon_sigue_por_rol`) y en el NOTICE B6. El arreglo —la politica de anon
-- tambien por funcion— es una decision aparte, no algo que yo meta de tapadillo
-- en una migracion que pedia otras cuatro cosas.
--
-- Y HAY UNA SEGUNDA CONSECUENCIA DE ESA MISMA POLITICA, que salio al montar el
-- caso de autor dentro de la autoprueba (NOTICE E4):
--
--   Como la politica de anon es por ROL, que un visitante vea al autor de un
--   curso depende de que ese autor sea instructor, mentor o admin. UN CURSO
--   PUBLICADO FIRMADO POR UNA PERSONA SIN NINGUNO DE ESOS TRES ROLES SE
--   QUEDARIA SIN AUTOR PARA UN VISITANTE SIN SESION, aunque la politica de
--   sesion si se lo diera.
--
-- Hoy no afecta a nadie —no hay ningun curso publicado firmado por persona, y
-- la unica que firma uno es instructora— pero es un fallo esperando datos. La
-- politica de anon por funcion lo arregla de paso: ahi la ficha se gana por
-- firmar el curso, que es justo lo que hace falta para mostrarlo. O sea que el
-- quinto cambio no solo aprieta: tambien tapa un agujero.
--
-- ----------------------------------------------------------------------------
-- LA COPIA DE LAS CUATRO POLITICAS, QUE SE SACO ANTES DE EJECUTAR
--
-- Las cuatro politicas de `users` NO ESTAN EN NINGUNA MIGRACION: se crearon
-- desde el panel, y el informe del incidente del 2026-09-24 ya dejo dicho que
-- su fecha no es rastreable. Asi que el texto exacto solo lo tiene el catalogo.
-- YA ESTA HECHO: la salida del 2026-10-06 esta copiada LETRA POR LETRA en la
-- seccion 9, asi que la vuelta atras ya no depende de nada que yo recuerde. Si
-- esto se ejecuta en otra base, o mas adelante, hay que repetirlo:
--
--   SELECT policyname,
--          format('CREATE POLICY %I ON public.users FOR %s TO %s %s %s;',
--                 policyname, cmd, array_to_string(roles, ', '),
--                 coalesce('USING (' || qual || ')', ''),
--                 coalesce('WITH CHECK (' || with_check || ')', '')) AS texto_exacto
--     FROM pg_policies
--    WHERE schemaname = 'public' AND tablename = 'users'
--    ORDER BY policyname;
--
-- La migracion vuelve a imprimir las cuatro con RAISE NOTICE antes de tocar
-- nada, asi que tambien quedan en el registro de la ejecucion. Y se niega a
-- seguir si `users_read_all_authenticated` no es exactamente `USING (true)`:
-- si fuera otra cosa, la vuelta atras de este fichero estaria mintiendo.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. LAS CUATRO POLITICAS, AL REGISTRO, Y LA QUE SE VA A TIRAR, COMPROBADA
-- ============================================================================

DO $copia$
DECLARE
  r record;
  v_qual text;
BEGIN
  RAISE NOTICE '--- las politicas de public.users ANTES de esta migracion ---';
  FOR r IN
    SELECT policyname, cmd, roles, qual, with_check
      FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'users'
     ORDER BY policyname
  LOOP
    RAISE NOTICE '%', format('CREATE POLICY %I ON public.users FOR %s TO %s %s %s;',
      r.policyname, r.cmd, array_to_string(r.roles, ', '),
      coalesce('USING (' || r.qual || ')', ''),
      coalesce('WITH CHECK (' || r.with_check || ')', ''));
  END LOOP;

  -- La unica que se tira. Si no es `USING (true)`, la vuelta atras de este
  -- fichero la repondria mal, y eso es peor que no aplicar nada.
  SELECT qual INTO v_qual
    FROM pg_policies
   WHERE schemaname = 'public' AND tablename = 'users'
     AND policyname = 'users_read_all_authenticated';

  IF v_qual IS NULL THEN
    RAISE EXCEPTION 'No existe la politica users_read_all_authenticated. Esta base no es la que esta migracion espera: para y mira el catalogo antes de seguir.';
  END IF;

  IF btrim(v_qual) <> 'true' THEN
    RAISE EXCEPTION 'users_read_all_authenticated no es USING (true), es USING (%). La vuelta atras de este fichero repondria algo distinto de lo que habia: para.', v_qual;
  END IF;
END
$copia$;

-- ============================================================================
-- 2. INVARIANTES DE PARTIDA
-- ============================================================================
-- Propiedades, no recuentos. Valen en cualquier base y en cualquier momento.

DO $invariantes$
DECLARE
  v_mal integer;
BEGIN
  -- Ningun curso publicado firmado por persona sin autor: si lo hubiera, su
  -- ficha mostraria un autor que no existe y la vista no podria darselo.
  SELECT count(*) INTO v_mal
    FROM public.courses c
   WHERE c.status = 'published'
     AND c.firmado_por_la_plataforma = false
     AND c.instructor_id IS NULL;
  IF v_mal <> 0 THEN
    RAISE EXCEPTION 'Hay % curso(s) publicado(s) firmado(s) por persona SIN autor. Eso hay que arreglarlo antes: la ficha publica no se puede ganar por algo que no tiene quien la gane.', v_mal;
  END IF;

  -- La vista de hoy y sus tres ramas no discrepan: nadie esta en la vista sin
  -- al menos una de las tres razones. Si esto falla, la vista ya estaba mal y
  -- reescribirla taparia el problema.
  SELECT count(*) INTO v_mal
    FROM public.perfiles_publicos p
   WHERE p.es_instructor = false
     AND p.es_mentor = false
     AND p.es_autor = false;
  IF v_mal <> 0 THEN
    RAISE EXCEPTION 'Hay % fila(s) en perfiles_publicos sin ninguna de las tres razones. La vista no cuadra con su propio WHERE: para.', v_mal;
  END IF;

  -- Y anon tiene hoy el permiso que esta migracion le quita. Si ya no lo
  -- tuviera, el REVOKE no haria nada y la autoprueba daria un verde vacio.
  -- has_column_privilege y NO information_schema.column_privileges: esa vista
  -- solo ensena los permisos concedidos POR o A un rol activo, asi que si el
  -- GRANT lo hizo supabase_admin podria no aparecer al ejecutar como postgres.
  -- Preguntar por el permiso efectivo no depende de quien lo concedio.
  IF NOT has_column_privilege('anon', 'public.users', 'role', 'SELECT') THEN
    RAISE EXCEPTION 'anon NO tiene hoy SELECT (role) sobre users. Esta migracion no tendria nada que quitar, y su autoprueba pasaria sin medir nada: para y averigua quien lo quito.';
  END IF;
END
$invariantes$;

-- ============================================================================
-- 3. QUIEN ES «FUNCION PUBLICA»
-- ============================================================================
-- Una sola definicion, en un solo sitio: la usan la politica Y la vista, asi
-- que no pueden desfasarse una de otra.
--
-- SECURITY DEFINER por la medicion de arriba: `user_roles` esta tapada por su
-- RLS y un EXISTS con los permisos de quien pregunta dejaria la rama de los
-- mentores a cero.

CREATE OR REPLACE FUNCTION public.es_funcion_publica(p_persona uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fp$
  SELECT p_persona IS NOT NULL AND (
    -- Instructor con perfil activo: tiene pagina publica en /instructores/[id]
    EXISTS (SELECT 1 FROM public.instructor_profiles ip
             WHERE ip.user_id = p_persona AND ip.is_active)
    -- Mentor activo: tiene pagina publica en /mentores/[id]
    OR EXISTS (SELECT 1 FROM public.user_roles ur
                WHERE ur.user_id = p_persona
                  AND ur.role = 'mentor'
                  AND ur.is_active)
    -- Autor de un curso publicado QUE MUESTRA A SU AUTOR. Los firmados por la
    -- plataforma no lo muestran desde la 121: el servidor ni manda el objeto.
    OR EXISTS (SELECT 1 FROM public.courses c
                WHERE c.instructor_id = p_persona
                  AND c.status = 'published'
                  AND c.firmado_por_la_plataforma = false)
  )
$fp$;

COMMENT ON FUNCTION public.es_funcion_publica(uuid) IS
  'Si esta persona tiene una pagina publica que la muestre: perfil de instructor activo, mentor activo en user_roles, o autor de un curso publicado firmado por persona. Los cursos firmados por la plataforma NO cuentan: desde la 121 no muestran autor, asi que no justifican que la ficha sea legible. SECURITY DEFINER a proposito: user_roles esta tapada por su RLS y un EXISTS con los permisos de quien pregunta dejaria la rama de los mentores a cero. La usan la politica users_read_funcion_publica y la vista perfiles_publicos, para que no se desfasen.';

REVOKE ALL ON FUNCTION public.es_funcion_publica(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.es_funcion_publica(uuid) TO anon, authenticated, service_role;

-- ============================================================================
-- 4. LA POLITICA: POR FUNCION, NO «TODAS LAS FILAS»
-- ============================================================================
-- `users_read_all_authenticated` era USING (true): cualquier cuenta con sesion
-- leia las 25 filas enteras. Eso es lo que permitio el incidente del
-- 2026-09-24. Se sustituye; `users_read_own` se queda y es la que sigue dando
-- la fila propia (las politicas se suman con OR).

DROP POLICY users_read_all_authenticated ON public.users;

CREATE POLICY users_read_funcion_publica ON public.users
  FOR SELECT TO authenticated
  USING (public.es_funcion_publica(id));

COMMENT ON POLICY users_read_funcion_publica ON public.users IS
  'Una sesion lee las fichas de quien tiene pagina publica, y su propia fila por users_read_own. Sustituye a users_read_all_authenticated, que era USING (true) y servia la tabla entera a cualquier cuenta con sesion.';

-- ============================================================================
-- 5. LA VISTA, SIN role
-- ============================================================================
-- DROP y CREATE, no CREATE OR REPLACE: reemplazar una vista puede AÑADIR
-- columnas al final, nunca quitar una. Y al tirarla se van los GRANT, asi que
-- se reponen aqui los mismos de la 104.
--
-- Sin CASCADE a proposito: si algo dependiera de esta vista, que se levante y
-- se vea, en vez de que desaparezca con ella.

DROP VIEW public.perfiles_publicos;

CREATE VIEW public.perfiles_publicos AS
  SELECT
    u.id,
    u.full_name,
    u.avatar_url,
    -- u.role: FUERA desde la 123. Era legible por anon aqui aunque la tabla lo
    -- tuviera revocado, porque esta vista corre con los privilegios de su dueño.
    u.bio,

    -- Los enlaces, solo si hay perfil de instructor activo.
    CASE WHEN ip.user_id IS NOT NULL THEN u.website  END AS website,
    CASE WHEN ip.user_id IS NOT NULL THEN u.twitter  END AS twitter,
    CASE WHEN ip.user_id IS NOT NULL THEN u.linkedin END AS linkedin,
    CASE WHEN ip.user_id IS NOT NULL THEN u.github   END AS github,

    -- Por que esta fila es publica. Util para depurar sin adivinar.
    (ip.user_id IS NOT NULL) AS es_instructor,
    (me.user_id IS NOT NULL) AS es_mentor,
    (au.autor    IS NOT NULL) AS es_autor

  FROM public.users u

  LEFT JOIN public.instructor_profiles ip
         ON ip.user_id = u.id
        AND ip.is_active

  LEFT JOIN (
    SELECT DISTINCT user_id
      FROM public.user_roles
     WHERE role = 'mentor'
       AND is_active
  ) me ON me.user_id = u.id

  LEFT JOIN (
    SELECT DISTINCT instructor_id AS autor
      FROM public.courses
     WHERE status = 'published'
       AND instructor_id IS NOT NULL
       -- Los de la plataforma no cuentan: no muestran autor desde la 121.
       AND firmado_por_la_plataforma = false
  ) au ON au.autor = u.id

  -- El WHERE es la funcion, no una copia de sus tres ramas: asi la vista y la
  -- politica no pueden decir cosas distintas.
  WHERE public.es_funcion_publica(u.id);

COMMENT ON VIEW public.perfiles_publicos IS
  'Lo que se puede leer en publico de una persona: nombre, avatar y biografia, y ademas los enlaces SOLO si tiene perfil de instructor activo. SIN `role` desde la 123: con la columna aqui se podia preguntar perfiles_publicos?role=eq.admin con la clave anonima. Solo aparece quien tiene pagina publica, y eso lo decide es_funcion_publica(): perfil de instructor activo, mentor activo en user_roles, o autor de un curso publicado FIRMADO POR PERSONA. Vista normal a proposito (no SECURITY INVOKER): corre con los privilegios de su dueño, que es lo que le permite leer columnas que anon y authenticated ya no pueden leer.';

REVOKE ALL ON public.perfiles_publicos FROM PUBLIC;
GRANT SELECT ON public.perfiles_publicos TO anon, authenticated;

-- ============================================================================
-- 6. Y SE CIERRA role EN LA TABLA, PARA anon
-- ============================================================================
-- Solo anon. `authenticated` lo conserva: media docena de paginas del panel
-- comprueban su propio rol con select('role').eq('id', user.id).

REVOKE SELECT (role) ON public.users FROM anon;

COMMENT ON COLUMN public.users.role IS
  'Rol de la cuenta. NO es legible por anon desde la 123: con el permiso puesto se podia preguntar users?role=eq.admin con la clave anonima —que es publica— y salian las cuentas de administracion. authenticated SI lo lee, porque el panel comprueba el rol propio; lo que limita a una sesion es la politica users_read_funcion_publica, que solo le da las fichas de quien tiene pagina publica.';

-- ============================================================================
-- 7. LA AUTOPRUEBA
-- ============================================================================
-- Cada comprobacion termina en RAISE EXCEPTION, asi que si el bloque pasa sin
-- levantarse es que todas pasaron. Y distingue 42501 (no hay permiso) de cero
-- filas (hay permiso y la politica no da nada): son dos cosas distintas y el
-- encargo pide las dos por separado.
--
-- NINGUNA COMPROBACION EXIGE QUE PRODUCCION TENGA UN DATO CONCRETO.
--
-- La primera version si lo hacia, y por eso esta migracion murio al aplicarla:
-- exigia como precondicion un curso publicado firmado por persona, y en
-- produccion el unico firmado por persona es un BORRADOR. Una precondicion
-- sobre datos de produccion no es una precondicion: es una suposicion.
--
-- Ahora hay tres clases de comprobacion, y ninguna supone nada:
--
--   MONTADAS     el caso se construye aqui dentro, en una subtransaccion que
--                se deshace SIEMPRE. Asi se prueba la rama de autor, que en
--                produccion no tiene con que probarse.
--   UNIVERSALES  valen sobre las filas que haya, sean las que sean: «de toda
--                fila de la vista, anon puede leer lo que el modal pide».
--   SIN DATOS    si en esta base no hay con que ejercitar una rama, se dice con
--                un NOTICE y ADEMAS sale en la fila de verificacion, en
--                `ramas_sin_comprobar`. Un salto silencioso seria un verde
--                vacio, que es justo lo que hay que evitar.

DO $prueba$
DECLARE
  v_sesion         uuid;
  v_ajena          uuid;
  v_admin          uuid;
  v_mentor         uuid;
  v_curso          uuid;
  v_autor          uuid;
  v_n              integer;
  v_n_servicio     integer;
  v_estado         text;
  v_sin            text[] := '{}';
  -- Lo que se mide dentro del montaje. Las variables NO se deshacen cuando la
  -- subtransaccion se levanta: lo que se deshace son los cambios en la base.
  v_autor_sesion   text;
  v_autor_anon     text;
  v_autor_en_vista boolean;
  v_autor_publico  boolean;
  v_publica        uuid;
  v_plat_en_vista  boolean;
BEGIN
  PERFORM set_config('request.jwt.claims', '{}', true);

  -- ══════════════════════════════════════════════════════════════════════════
  -- A. LOS PERMISOS POR COLUMNA. No dependen de ningun dato.
  -- ══════════════════════════════════════════════════════════════════════════

  -- A1. anon: users?role=eq.admin  ->  42501, NO cero filas.
  -- Filtrar por una columna sin permiso de SELECT da 42501 aunque no hubiera
  -- ninguna fila que casara: por eso esta comprobacion no necesita que exista
  -- ninguna cuenta de administracion.
  v_estado := 'no se ejecuto';
  SET LOCAL ROLE anon;
  BEGIN
    SELECT count(*) INTO v_n FROM public.users u WHERE u.role = 'admin';
    v_estado := format('devolvio %s fila(s) SIN error', v_n);
  EXCEPTION
    WHEN insufficient_privilege THEN v_estado := '42501';
    WHEN others THEN v_estado := format('%s %s', SQLSTATE, SQLERRM);
  END;
  RESET ROLE;
  IF v_estado <> '42501' THEN
    RAISE EXCEPTION 'A1. anon filtrando users por role tenia que dar 42501 y dio: %. Cero filas no vale: querria decir que anon sigue pudiendo leer la columna y que solo la esconde la politica.', v_estado;
  END IF;

  -- A2. anon: leer la columna sin filtrar  ->  42501
  v_estado := 'no se ejecuto';
  SET LOCAL ROLE anon;
  BEGIN
    PERFORM u.role FROM public.users u LIMIT 1;
    v_estado := 'la leyo';
  EXCEPTION
    WHEN insufficient_privilege THEN v_estado := '42501';
    WHEN others THEN v_estado := format('%s %s', SQLSTATE, SQLERRM);
  END;
  RESET ROLE;
  IF v_estado <> '42501' THEN
    RAISE EXCEPTION 'A2. anon leyendo users.role tenia que dar 42501 y dio: %', v_estado;
  END IF;

  -- A3. anon: perfiles_publicos?role=eq.admin  ->  42703
  -- Aqui NO es 42501: la columna ya no existe en la vista, asi que el codigo es
  -- undefined_column. Es otra forma de «no devuelve nada», y se exige la que de
  -- verdad ocurre, no la que suene mejor.
  v_estado := 'no se ejecuto';
  SET LOCAL ROLE anon;
  BEGIN
    EXECUTE 'SELECT count(*) FROM public.perfiles_publicos WHERE role = ''admin''' INTO v_n;
    v_estado := format('devolvio %s fila(s) SIN error', v_n);
  EXCEPTION
    WHEN undefined_column THEN v_estado := '42703';
    WHEN others THEN v_estado := format('%s %s', SQLSTATE, SQLERRM);
  END;
  RESET ROLE;
  IF v_estado <> '42703' THEN
    RAISE EXCEPTION 'A3. anon filtrando perfiles_publicos por role tenia que dar 42703 (la columna ya no existe) y dio: %', v_estado;
  END IF;

  -- A4. Y la columna, fuera de la vista, por catalogo
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'perfiles_publicos'
       AND column_name = 'role'
  ) THEN
    RAISE EXCEPTION 'A4. perfiles_publicos TODAVIA tiene la columna role.';
  END IF;

  -- A5. `authenticated` LO CONSERVA. Si esto falla, el panel se rompe: media
  -- docena de paginas comprueban su propio rol con select(role).eq(id, user.id).
  IF NOT has_column_privilege('authenticated', 'public.users', 'role', 'SELECT') THEN
    RAISE EXCEPTION 'A5. authenticated ha perdido SELECT (role). Esta migracion solo se lo quita a anon: el panel dejaria de funcionar.';
  END IF;

  -- A5b. Y anon lo ha PERDIDO, por permiso efectivo. La A1 ya lo prueba
  -- midiendo, pero esto lo dice del catalogo: dos vias distintas para el mismo
  -- hecho, y si una dijera lo contrario habria que mirarlo.
  IF has_column_privilege('anon', 'public.users', 'role', 'SELECT') THEN
    RAISE EXCEPTION 'A5b. anon todavia tiene SELECT (role) sobre users. El REVOKE no hizo efecto.';
  END IF;

  -- A6. Y la vista sigue teniendo las tres columnas que pide el modal.
  SELECT count(*) INTO v_n
    FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'perfiles_publicos'
     AND column_name IN ('bio', 'es_instructor', 'es_mentor');
  IF v_n <> 3 THEN
    RAISE EXCEPTION 'A6. perfiles_publicos tenia que seguir teniendo bio, es_instructor y es_mentor, y tiene % de las tres. InstructorPreviewModal pide esas tres.', v_n;
  END IF;

  -- ══════════════════════════════════════════════════════════════════════════
  -- B. CON QUIEN SE PRUEBA UNA SESION. Se busca, no se supone.
  -- ══════════════════════════════════════════════════════════════════════════

  -- Cualquier persona que NO sea funcion publica: es la que mejor prueba la
  -- politica, porque de ella solo tiene que ver su propia fila.
  SELECT u.id INTO v_sesion
    FROM public.users u
   WHERE NOT public.es_funcion_publica(u.id)
   ORDER BY (u.role = 'student') DESC
   LIMIT 1;

  -- Otra, distinta, tampoco publica: la que la sesion NO tiene que poder leer.
  SELECT u.id INTO v_ajena
    FROM public.users u
   WHERE NOT public.es_funcion_publica(u.id)
     AND u.id IS DISTINCT FROM v_sesion
   LIMIT 1;

  -- Una cuenta de administracion que no sea funcion publica: para el caso de
  -- «filtrar por rol no devuelve nada».
  SELECT u.id INTO v_admin
    FROM public.users u
   WHERE u.role = 'admin'
     AND NOT public.es_funcion_publica(u.id)
   LIMIT 1;

  -- Alguien que YA este en la vista por otra razon que no sea la autoria: hace
  -- falta para el E6, donde se comprueba que firmar un curso de la plataforma
  -- no añade es_autor a quien ya sale.
  SELECT p.id INTO v_publica
    FROM public.perfiles_publicos p
   WHERE p.es_instructor OR p.es_mentor
   LIMIT 1;

  -- Un mentor activo. En produccion hay 0.
  SELECT ur.user_id INTO v_mentor
    FROM public.user_roles ur
   WHERE ur.role = 'mentor' AND ur.is_active
   LIMIT 1;

  IF v_sesion IS NULL THEN
    v_sin := array_append(v_sin, 'la sesion (toda persona de esta base es funcion publica)');
  ELSE
    -- B1. La fila propia se sigue leyendo: users_read_own, intacta.
    SET LOCAL ROLE authenticated;
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_sesion)::text, true);
    SELECT count(*) INTO v_n FROM public.users u WHERE u.id = v_sesion;
    RESET ROLE;
    PERFORM set_config('request.jwt.claims', '{}', true);
    IF v_n <> 1 THEN
      RAISE EXCEPTION 'B1. una sesion ya no lee su propia ficha (% filas). users_read_own tenia que quedarse tal cual.', v_n;
    END IF;

    -- B2. Y su propio rol, que es lo que comprueba el panel.
    SET LOCAL ROLE authenticated;
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_sesion)::text, true);
    BEGIN
      SELECT u.role::text INTO v_estado FROM public.users u WHERE u.id = v_sesion;
    EXCEPTION
      WHEN others THEN v_estado := format('ERROR %s %s', SQLSTATE, SQLERRM);
    END;
    RESET ROLE;
    PERFORM set_config('request.jwt.claims', '{}', true);
    IF v_estado IS NULL OR v_estado LIKE 'ERROR %' THEN
      RAISE EXCEPTION 'B2. una sesion ya no puede leer su propio rol (dio %). Media docena de paginas del panel hacen select(role).eq(id, user.id) y se romperian.', coalesce(v_estado, 'nada');
    END IF;

    -- B3. La ficha de otra persona que no es funcion publica, NO.
    IF v_ajena IS NULL THEN
      v_sin := array_append(v_sin, 'la ficha ajena (no hay dos personas que no sean funcion publica)');
    ELSE
      SET LOCAL ROLE authenticated;
      PERFORM set_config('request.jwt.claims', json_build_object('sub', v_sesion)::text, true);
      SELECT count(*) INTO v_n FROM public.users u WHERE u.id = v_ajena;
      RESET ROLE;
      PERFORM set_config('request.jwt.claims', '{}', true);
      IF v_n <> 0 THEN
        RAISE EXCEPTION 'B3. una sesion todavia lee la ficha de otra persona que no es funcion publica (% filas). La politica nueva no esta acotando nada.', v_n;
      END IF;
    END IF;

    -- B4. Filtrar por rol con sesion: CERO FILAS, y sin error.
    -- Aqui si es cero filas y es lo correcto: `authenticated` SI lee `role`,
    -- asi que no hay 42501. Lo que no devuelve nada es la politica.
    IF v_admin IS NULL THEN
      v_sin := array_append(v_sin, 'el filtro por rol con sesion (no hay ninguna cuenta admin que no sea funcion publica)');
    ELSE
      v_estado := 'no se ejecuto';
      SET LOCAL ROLE authenticated;
      PERFORM set_config('request.jwt.claims', json_build_object('sub', v_sesion)::text, true);
      BEGIN
        SELECT count(*) INTO v_n FROM public.users u WHERE u.role = 'admin';
        v_estado := format('%s filas', v_n);
      EXCEPTION
        WHEN others THEN v_estado := format('%s %s', SQLSTATE, SQLERRM);
      END;
      RESET ROLE;
      PERFORM set_config('request.jwt.claims', '{}', true);
      IF v_estado <> '0 filas' THEN
        RAISE EXCEPTION 'B4. una sesion filtrando users por role tenia que dar 0 filas y dio: %. Si da 42501, alguien le quito el permiso a authenticated y el panel se rompe; si da filas, la enumeracion sigue abierta.', v_estado;
      END IF;

      -- B5. Ni por id.
      SET LOCAL ROLE authenticated;
      PERFORM set_config('request.jwt.claims', json_build_object('sub', v_sesion)::text, true);
      SELECT count(*) INTO v_n FROM public.users u WHERE u.id = v_admin;
      RESET ROLE;
      PERFORM set_config('request.jwt.claims', '{}', true);
      IF v_n <> 0 THEN
        RAISE EXCEPTION 'B5. una sesion todavia lee la ficha de una cuenta de administracion pidiendola por id (% filas).', v_n;
      END IF;

      -- B6. Y LO QUE ESTO NO CIERRA, medido en vez de supuesto.
      --
      -- Empezo siendo una asercion y el banco de pruebas la puso en rojo. No se
      -- ha suavizado el diseño para que pase: se ha convertido en una medicion
      -- que sale en la fila de verificacion, porque lo que mide es verdad y hay
      -- que decidirlo, no taparlo.
      --
      -- La politica de anon sigue siendo POR ROL:
      --   USING (role = ANY (ARRAY['instructor','mentor','admin']) OR id = auth.uid())
      -- El REVOKE cierra la IDENTIFICACION —sin leer `role` no se puede
      -- preguntar quien es admin— pero no la LECTURA de una ficha cuyo id ya se
      -- conozca. Y deja una asimetria absurda: TRAS ESTA MIGRACION UNA SESION
      -- DE ESTUDIANTE VE MENOS QUE UN VISITANTE ANONIMO.
      SET LOCAL ROLE anon;
      SELECT count(*) INTO v_n FROM public.users u WHERE u.id = v_admin;
      RESET ROLE;
      IF v_n <> 0 THEN
        RAISE NOTICE 'B6. PENDIENTE, NO ES UN FALLO DE ESTA MIGRACION: anon sigue leyendo la ficha de una cuenta de administracion pidiendola por id (% fila(s)), porque su politica sigue siendo por rol. Lo que esta migracion cierra es poder preguntar QUIEN es admin.', v_n;
      ELSE
        RAISE NOTICE 'B6. anon tampoco lee esa ficha por id: en esta base su politica ya no es por rol.';
      END IF;
    END IF;
  END IF;

  -- ══════════════════════════════════════════════════════════════════════════
  -- C. LA VISTA, SOBRE LAS FILAS QUE HAYA. Universales: sin suponer cuantas.
  -- ══════════════════════════════════════════════════════════════════════════

  -- C1. Nadie en la vista sin ninguna de las tres razones.
  SELECT count(*) INTO v_n
    FROM public.perfiles_publicos p
   WHERE p.es_instructor = false AND p.es_mentor = false AND p.es_autor = false;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'C1. hay % fila(s) en la vista sin ninguna de las tres razones.', v_n;
  END IF;

  -- C2. La vista y la funcion dicen lo mismo, en los dos sentidos.
  SELECT count(*) INTO v_n
    FROM public.users u
   WHERE public.es_funcion_publica(u.id)
     AND NOT EXISTS (SELECT 1 FROM public.perfiles_publicos p WHERE p.id = u.id);
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'C2. hay % persona(s) que es funcion publica y no sale(n) en la vista.', v_n;
  END IF;

  SELECT count(*) INTO v_n
    FROM public.perfiles_publicos p
   WHERE NOT public.es_funcion_publica(p.id);
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'C2b. hay % fila(s) en la vista que no es funcion publica.', v_n;
  END IF;

  -- C3. De TODA fila de la vista, anon puede leer lo que pide el modal, y las
  -- ve todas. No se elige una fila concreta: se recorren las que haya.
  SELECT count(*) INTO v_n_servicio FROM public.perfiles_publicos;
  IF v_n_servicio = 0 THEN
    v_sin := array_append(v_sin, 'la vista con la clave anonima (esta vacia)');
  ELSE
    v_estado := 'no se ejecuto';
    SET LOCAL ROLE anon;
    BEGIN
      SELECT count(*) INTO v_n
        FROM (SELECT p.bio, p.es_instructor, p.es_mentor
                FROM public.perfiles_publicos p) t;
      v_estado := 'leyo';
    EXCEPTION
      WHEN others THEN v_estado := format('%s %s', SQLSTATE, SQLERRM);
    END;
    RESET ROLE;
    IF v_estado <> 'leyo' THEN
      RAISE EXCEPTION 'C3. anon ya no puede leer bio, es_instructor y es_mentor de la vista: %. Es la consulta exacta de InstructorPreviewModal.', v_estado;
    END IF;
    IF v_n <> v_n_servicio THEN
      RAISE EXCEPTION 'C3b. anon ve % de las % filas de la vista. Al rehacerla se perdio el GRANT o algo la filtra.', v_n, v_n_servicio;
    END IF;
  END IF;

  -- C5. NADIE ES FUNCION PUBLICA POR UNA RAZON QUE NO SEA UNA DE LAS TRES.
  -- Esta es la que vigila el cuarto cambio, y es universal: no necesita que
  -- exista ningun admin ni ningun curso. Si la rama de autor dejara de estar
  -- apretada, la cuenta que firma los cursos de la plataforma seria funcion
  -- publica sin ninguna de las tres razones, y esto se levanta.
  SELECT count(*) INTO v_n
    FROM public.users u
   WHERE public.es_funcion_publica(u.id)
     AND NOT EXISTS (SELECT 1 FROM public.instructor_profiles ip
                      WHERE ip.user_id = u.id AND ip.is_active)
     AND NOT EXISTS (SELECT 1 FROM public.user_roles ur
                      WHERE ur.user_id = u.id AND ur.role = 'mentor' AND ur.is_active)
     AND NOT EXISTS (SELECT 1 FROM public.courses c
                      WHERE c.instructor_id = u.id
                        AND c.status = 'published'
                        AND c.firmado_por_la_plataforma = false);
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'C5. hay % persona(s) que es_funcion_publica reconoce sin perfil de instructor activo, sin ser mentor activo y sin firmar ningun curso publicado. Lo mas probable: la rama de autor no esta apretada y cuenta los cursos de la plataforma, que no muestran autor desde la 121.', v_n;
  END IF;

  -- C6. Y lo mismo para la COLUMNA es_autor de la vista, que es otra copia de
  -- esa regla y podria quedarse sin apretar ella sola.
  SELECT count(*) INTO v_n
    FROM public.perfiles_publicos p
   WHERE p.es_autor
     AND NOT EXISTS (SELECT 1 FROM public.courses c
                      WHERE c.instructor_id = p.id
                        AND c.status = 'published'
                        AND c.firmado_por_la_plataforma = false);
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'C6. la vista da es_autor = true a % persona(s) que no firma ningun curso publicado firmado por persona. El join de la vista no esta apretado.', v_n;
  END IF;

  -- C4. Y si hay algun instructor con perfil activo, su es_instructor es true.
  IF EXISTS (SELECT 1 FROM public.instructor_profiles ip WHERE ip.is_active) THEN
    SELECT count(*) INTO v_n
      FROM public.instructor_profiles ip
      JOIN public.perfiles_publicos p ON p.id = ip.user_id
     WHERE ip.is_active AND p.es_instructor IS NOT TRUE;
    IF v_n <> 0 THEN
      RAISE EXCEPTION 'C4. hay % instructor(es) con perfil activo cuyo es_instructor no es true en la vista.', v_n;
    END IF;
  ELSE
    v_sin := array_append(v_sin, 'es_instructor (no hay ningun perfil de instructor activo)');
  END IF;

  -- ══════════════════════════════════════════════════════════════════════════
  -- D. LA RAMA DE LOS MENTORES. Es la que prueba que la funcion TENIA que ser
  --    SECURITY DEFINER: la RLS de user_roles tapa esas filas para una sesion.
  -- ══════════════════════════════════════════════════════════════════════════

  IF v_mentor IS NULL THEN
    v_sin := array_append(v_sin, 'la rama de los mentores (no hay ninguno activo en user_roles)');
  ELSIF v_sesion IS NULL THEN
    v_sin := array_append(v_sin, 'la rama de los mentores (no hay con quien montar una sesion)');
  ELSE
    SET LOCAL ROLE authenticated;
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_sesion)::text, true);
    SELECT count(*) INTO v_n FROM public.users u WHERE u.id = v_mentor;
    RESET ROLE;
    PERFORM set_config('request.jwt.claims', '{}', true);
    IF v_n <> 1 THEN
      RAISE EXCEPTION 'D1. una sesion no ve la ficha de un mentor activo (% filas). Si es 0, es_funcion_publica no esta viendo user_roles: la RLS de esa tabla la tapa, y por eso tiene que ser SECURITY DEFINER.', v_n;
    END IF;
  END IF;

  -- ══════════════════════════════════════════════════════════════════════════
  -- E. LA RAMA DE AUTOR, MONTADA AQUI DENTRO
  -- ══════════════════════════════════════════════════════════════════════════
  -- Produccion no tiene ningun curso publicado firmado por persona: el unico
  -- firmado por persona es un borrador. Asi que esta rama no se puede probar
  -- con los datos que hay, y ESPERAR QUE LOS HAYA fue lo que tumbo la primera
  -- version de esta migracion.
  --
  -- Se monta: un curso publicado de la plataforma pasa a estar firmado por
  -- persona, con lo que su autor gana la rama de autor. Se mide, y se deshace.
  --
  -- POR QUE NO DEJA RESTOS, por dos vias independientes:
  --
  --   1. El bloque BEGIN ... EXCEPTION de plpgsql es una SUBTRANSACCION. Al
  --      levantarla a proposito, todo lo que se hizo dentro se deshace. Las
  --      variables conservan lo medido: lo que se deshace son los cambios en la
  --      base, no la memoria.
  --   2. Y aunque no se deshiciera, el UPDATE es de UNA sola columna que no
  --      dispara nada. Comprobado trigger por trigger:
  --        trg_al_publicar_refrescar_la_copia  AFTER UPDATE **OF status**, y el
  --                                           status no se toca -> EL ESPEJO NO
  --                                           SE ROZA
  --        trigger_course_modification        solo mira nueve columnas de
  --                                           contenido; la firma no esta
  --        trg_controlar_publicacion          exime a postgres (121)
  --        trg_la_firma_de_la_plataforma      exime a postgres (121)
  --        trg_clasificacion_de_un_publicado  UPDATE OF specialty_id, jurisdiccion
  --        trg_la_fecha_de_publicacion_no_se_borra  UPDATE OF published_at

  SELECT c.id, c.instructor_id INTO v_curso, v_autor
    FROM public.courses c
   WHERE c.status = 'published'
     AND c.instructor_id IS NOT NULL
     AND NOT public.es_funcion_publica(c.instructor_id)
   LIMIT 1;

  IF v_curso IS NULL THEN
    v_sin := array_append(v_sin, 'la rama de autor (no hay ningun curso publicado cuyo autor no sea ya funcion publica, asi que no se puede montar el caso aislado)');
  ELSIF v_sesion IS NULL THEN
    v_sin := array_append(v_sin, 'la rama de autor (no hay con quien montar una sesion)');
  ELSE
    BEGIN
      UPDATE public.courses
         SET firmado_por_la_plataforma = false
       WHERE id = v_curso;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'E0. NO SE PUDO MONTAR el caso de autor: el UPDATE no toco ninguna fila.';
      END IF;

      v_autor_publico := public.es_funcion_publica(v_autor);

      -- Con sesion: es LA comprobacion de la rama, porque la politica de una
      -- sesion si es por funcion.
      SET LOCAL ROLE authenticated;
      PERFORM set_config('request.jwt.claims', json_build_object('sub', v_sesion)::text, true);
      SELECT u.full_name INTO v_autor_sesion FROM public.users u WHERE u.id = v_autor;
      RESET ROLE;
      PERFORM set_config('request.jwt.claims', '{}', true);

      -- Sin sesion: se MIDE, no se exige. La politica de anon sigue siendo por
      -- rol, asi que que anon vea al autor depende de su ROL, no de que firme
      -- el curso. Lo que eso significa esta en el NOTICE E4.
      SET LOCAL ROLE anon;
      SELECT u.full_name INTO v_autor_anon FROM public.users u WHERE u.id = v_autor;
      RESET ROLE;

      -- Y la vista, que tiene que darlo con es_autor
      SELECT p.es_autor INTO v_autor_en_vista
        FROM public.perfiles_publicos p WHERE p.id = v_autor;

      -- Y se deshace. Este RAISE es el que vuelve atras la subtransaccion.
      RAISE EXCEPTION 'DESHACER_EL_MONTAJE';
    EXCEPTION
      WHEN others THEN
        IF SQLERRM <> 'DESHACER_EL_MONTAJE' THEN
          RAISE;   -- cualquier otro error es de verdad y tiene que salir
        END IF;
    END;

    -- Ahora, con el montaje deshecho, se juzga lo medido.
    IF v_autor_publico IS NOT TRUE THEN
      RAISE EXCEPTION 'E1. al firmar un curso publicado con una persona, es_funcion_publica no la reconocio. La rama de autor no funciona.';
    END IF;
    IF v_autor_sesion IS NULL THEN
      RAISE EXCEPTION 'E2. una sesion no puede leer el nombre del autor de un curso publicado firmado por persona. La ficha de ese curso se quedaria sin autor para cualquier alumno.';
    END IF;
    IF v_autor_en_vista IS NOT TRUE THEN
      RAISE EXCEPTION 'E3. la vista no da es_autor = true al autor de un curso publicado firmado por persona (dio %).', coalesce(v_autor_en_vista::text, 'ninguna fila');
    END IF;
    IF v_autor_anon IS NULL THEN
      RAISE NOTICE 'E4. PENDIENTE, NO ES UN FALLO DE ESTA MIGRACION: SIN SESION no se lee el nombre de ese autor. La politica de anon es por ROL, no por funcion, asi que la ficha de un curso firmado por una persona que no sea instructor, mentor o admin se queda SIN AUTOR para un visitante. Es la misma politica del B6, y una razon mas para cambiarla.';
    ELSE
      RAISE NOTICE 'E4. sin sesion tambien se lee ese autor, pero por su ROL, no por firmar el curso: la politica de anon sigue siendo por rol.';
    END IF;

    -- E5. LO PRIMERO TRAS UN MONTAJE: QUE SE DESHIZO. Va antes del siguiente
    -- montaje a proposito: un resto del primero lo cazaria el segundo, pero
    -- hablaria la comprobacion que no sabe lo que paso.
    SELECT count(*) INTO v_n
      FROM public.courses c
     WHERE c.id = v_curso AND c.firmado_por_la_plataforma = true;
    IF v_n <> 1 THEN
      RAISE EXCEPTION 'E5. EL MONTAJE NO SE DESHIZO: el curso % sigue sin estar firmado por la plataforma. PARA Y MIRALO.', v_curso;
    END IF;
    IF public.es_funcion_publica(v_autor) THEN
      RAISE EXCEPTION 'E5b. EL MONTAJE NO SE DESHIZO: su autor sigue siendo funcion publica. PARA Y MIRALO.';
    END IF;

    -- E6. Y AL REVES: FIRMAR UN CURSO DE LA PLATAFORMA NO DA FICHA PUBLICA.
    --
    -- Es el cuarto cambio visto por el otro lado, y hay que montarlo igual: la
    -- comprobacion universal (C6) no puede fallar nunca con los datos que hay,
    -- porque el es_autor equivocado le tocaria a la cuenta de administracion,
    -- que ya no esta en la vista. Una asercion que no puede fallar no mide
    -- nada, asi que aqui se construye el caso que si la pone en rojo: una
    -- persona QUE SI ESTA EN LA VISTA pasa a ser autora de un curso de la
    -- plataforma, y se exige que eso NO le de es_autor.
    IF v_publica IS NULL THEN
      v_sin := array_append(v_sin, 'que firmar un curso de la plataforma no da es_autor (no hay nadie en la vista con quien montarlo)');
    ELSE
      BEGIN
        UPDATE public.courses
           SET instructor_id = v_publica
         WHERE id = v_curso;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'E6.0. NO SE PUDO MONTAR: el UPDATE no toco ninguna fila.';
        END IF;

        SELECT p.es_autor INTO v_plat_en_vista
          FROM public.perfiles_publicos p WHERE p.id = v_publica;

        RAISE EXCEPTION 'DESHACER_EL_MONTAJE';
      EXCEPTION
        WHEN others THEN
          IF SQLERRM <> 'DESHACER_EL_MONTAJE' THEN
            RAISE;
          END IF;
      END;

      IF v_plat_en_vista IS NOT FALSE THEN
        RAISE EXCEPTION 'E6. firmar un curso PUBLICADO DE LA PLATAFORMA le dio es_autor = % a quien lo firma. Desde la 121 esos cursos no muestran autor, asi que no pueden dar ficha publica: el join de la vista no esta apretado.', coalesce(v_plat_en_vista::text, 'ninguna fila');
      END IF;

      -- Y que este montaje tambien se deshizo.
      SELECT count(*) INTO v_n
        FROM public.courses c WHERE c.id = v_curso AND c.instructor_id = v_autor;
      IF v_n <> 1 THEN
        RAISE EXCEPTION 'E6b. EL MONTAJE NO SE DESHIZO: el curso % ya no tiene su autor original. PARA Y MIRALO.', v_curso;
      END IF;
    END IF;

  END IF;

  -- ══════════════════════════════════════════════════════════════════════════
  -- F. EL CLIENTE DE SERVICIO SIGUE LEYENDOLO TODO
  -- ══════════════════════════════════════════════════════════════════════════

  SET LOCAL ROLE service_role;
  IF current_user <> 'service_role' THEN
    RESET ROLE;
    RAISE EXCEPTION 'F1. current_user no es service_role tras SET LOCAL ROLE service_role, es %. Para y mira esto antes de seguir.', current_user;
  END IF;
  SELECT count(*) INTO v_n FROM public.users u;
  RESET ROLE;
  SELECT count(*) INTO v_n_servicio FROM public.users u;
  IF v_n <> v_n_servicio THEN
    RAISE EXCEPTION 'F2. el cliente de servicio ve % de las % filas de users. Eso romperia el panel entero.', v_n, v_n_servicio;
  END IF;

  -- ══════════════════════════════════════════════════════════════════════════
  -- Y lo que no se pudo ejercitar, DICHO. No un verde vacio.
  -- ══════════════════════════════════════════════════════════════════════════

  PERFORM set_config('app.ramas_sin_comprobar', array_to_string(v_sin, ' | '), true);

  IF cardinality(v_sin) = 0 THEN
    RAISE NOTICE 'AUTOPRUEBA: todas las comprobaciones pasaron, y todas tenian datos con que ejercitarse.';
  ELSE
    RAISE NOTICE 'AUTOPRUEBA: las comprobaciones pasaron, pero % rama(s) no tenian datos con que ejercitarse: %. Sale tambien en la fila de verificacion.',
      cardinality(v_sin), array_to_string(v_sin, ' | ');
  END IF;
  RAISE NOTICE 'Mira los NOTICE B6 y E4: dicen lo que esta migracion NO cierra.';
END
$prueba$;

-- ============================================================================
-- 8. VERIFICACION, UNA FILA
-- ============================================================================
-- Los numeros de aqui son INFORMACION, no aserciones: lo que tiene que valer
-- en cualquier base esta en los invariantes y en la autoprueba.

SELECT
  (SELECT count(*) FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users')               AS politicas_de_users,
  EXISTS (SELECT 1 FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'users'
             AND policyname = 'users_read_funcion_publica')            AS politica_nueva,
  EXISTS (SELECT 1 FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'users'
             AND policyname = 'users_read_own')                        AS sigue_read_own,
  EXISTS (SELECT 1 FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'users'
             AND policyname = 'users_read_all_authenticated')          AS sigue_la_vieja,
  has_column_privilege('anon', 'public.users', 'role', 'SELECT')         AS anon_lee_role,
  has_column_privilege('authenticated', 'public.users', 'role', 'SELECT') AS authenticated_lee_role,
  EXISTS (SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'perfiles_publicos'
             AND column_name = 'role')                                AS role_en_la_vista,
  (SELECT count(*) FROM public.perfiles_publicos)                      AS filas_de_la_vista,
  (SELECT count(*) FROM public.users u
    WHERE u.role = 'admin' AND public.es_funcion_publica(u.id))        AS admins_que_son_publicos,
  -- INFORMACION, no parte del veredicto: lo que esta migracion NO cierra.
  -- La politica de anon sigue siendo por rol, asi que quien sepa un id sigue
  -- leyendo esa ficha. Ver la seccion «LO QUE ESTO NO CIERRA».
  (SELECT count(*) FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users'
      AND policyname = 'Public can read basic user info'
      AND qual LIKE '%role%')                                          AS anon_sigue_por_rol,
  -- Lo que la autoprueba no pudo ejercitar por falta de datos. Vacio = todas
  -- tenian con que. La autoprueba lo deja aqui con set_config, de alcance
  -- transaccional: un salto silencioso seria un verde vacio.
  coalesce(nullif(current_setting('app.ramas_sin_comprobar', true), ''),
           'ninguna: todas tenian datos')                                AS ramas_sin_comprobar,
  CASE
    -- Las politicas, POR NOMBRE y no por recuento: un `= 4` se pondria en
    -- REVISAR el dia que alguien añada una quinta, que es justo lo que la 125
    -- va a hacer, y no diria nada de si esta migracion esta bien.
    WHEN EXISTS (SELECT 1 FROM pg_policies
                  WHERE schemaname = 'public' AND tablename = 'users'
                    AND policyname = 'users_read_funcion_publica')
     AND EXISTS (SELECT 1 FROM pg_policies
                  WHERE schemaname = 'public' AND tablename = 'users'
                    AND policyname = 'users_read_own')
     AND NOT EXISTS (SELECT 1 FROM pg_policies
                      WHERE schemaname = 'public' AND tablename = 'users'
                        AND policyname = 'users_read_all_authenticated')
     AND NOT has_column_privilege('anon', 'public.users', 'role', 'SELECT')
     AND has_column_privilege('authenticated', 'public.users', 'role', 'SELECT')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_schema = 'public' AND table_name = 'perfiles_publicos'
                        AND column_name = 'role')
    THEN 'TODO CORRECTO'
    ELSE 'REVISAR'
  END AS veredicto;

COMMIT;

-- ============================================================================
-- 9. VUELTA ATRAS
-- ============================================================================
-- Pegar y ejecutar TAL CUAL. Deja la base como estaba: `role` legible por anon,
-- la vista con su columna, y la tabla entera servida a cualquier sesion.
--
-- LOS TEXTOS DE LAS POLITICAS SON LOS DEL CATALOGO, no una transcripcion mia.
-- Salieron de la consulta del encabezado el 2026-10-06, y estan copiados tal
-- cual, con sus parentesis dobles y sus ::user_role incluidos. Las cuatro, aunque
-- esta migracion solo toque una: asi la vuelta atras no depende de que ninguna
-- de las otras siga en su sitio.
--
-- BEGIN;
--
-- -- 1. La politica de antes, tal cual era
-- DROP POLICY IF EXISTS users_read_funcion_publica ON public.users;
-- CREATE POLICY users_read_all_authenticated ON public.users FOR SELECT TO authenticated USING (true) ;
--
-- -- 2. El permiso de anon
-- GRANT SELECT (role) ON public.users TO anon;
--
-- -- 3. La vista de la 104, con role y con el autor de cualquier curso publicado
-- DROP VIEW IF EXISTS public.perfiles_publicos;
-- CREATE VIEW public.perfiles_publicos AS
--   SELECT u.id, u.full_name, u.avatar_url, u.role, u.bio,
--     CASE WHEN ip.user_id IS NOT NULL THEN u.website  END AS website,
--     CASE WHEN ip.user_id IS NOT NULL THEN u.twitter  END AS twitter,
--     CASE WHEN ip.user_id IS NOT NULL THEN u.linkedin END AS linkedin,
--     CASE WHEN ip.user_id IS NOT NULL THEN u.github   END AS github,
--     (ip.user_id IS NOT NULL) AS es_instructor,
--     (me.user_id IS NOT NULL) AS es_mentor,
--     (au.autor    IS NOT NULL) AS es_autor
--   FROM public.users u
--   LEFT JOIN public.instructor_profiles ip
--          ON ip.user_id = u.id AND ip.is_active
--   LEFT JOIN (SELECT DISTINCT user_id FROM public.user_roles
--               WHERE role = 'mentor' AND is_active) me ON me.user_id = u.id
--   LEFT JOIN (SELECT DISTINCT instructor_id AS autor FROM public.courses
--               WHERE status = 'published' AND instructor_id IS NOT NULL) au
--          ON au.autor = u.id
--   WHERE ip.user_id IS NOT NULL OR me.user_id IS NOT NULL OR au.autor IS NOT NULL;
-- REVOKE ALL ON public.perfiles_publicos FROM PUBLIC;
-- GRANT SELECT ON public.perfiles_publicos TO anon, authenticated;
--
-- -- 4. Y la funcion, que ya no la usa nadie
-- DROP FUNCTION IF EXISTS public.es_funcion_publica(uuid);
--
-- COMMIT;
--
-- ----------------------------------------------------------------------------
-- LAS OTRAS TRES, SI ALGUNA VEZ HUBIERA QUE REPONERLAS. Esta migracion NO las
-- toca; estan aqui porque no se pueden leer desde ningun fichero del repo.
--
-- CREATE POLICY "Public can read basic user info" ON public.users FOR SELECT TO anon USING (((role = ANY (ARRAY['instructor'::user_role, 'mentor'::user_role, 'admin'::user_role])) OR (id = auth.uid()))) ;
-- CREATE POLICY users_read_own ON public.users FOR SELECT TO authenticated USING ((id = auth.uid())) ;
-- CREATE POLICY users_update_own ON public.users FOR UPDATE TO authenticated USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));
-- ============================================================================
