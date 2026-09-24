-- ============================================================================
-- 051: los certificados se consultan por numero, no se enumeran
-- ============================================================================
-- ESTADO: ESCRITA, SIN APLICAR (24/09/2026).
--   Es DDL: hay que ejecutarla en el SQL Editor de Supabase. Escrita contra la
--   salida de pg_policies del 24/09/2026, que esta recogida mas abajo.
--   Comprobacion antes y despues: node scripts/auditar-clave-anonima.mjs
--
-- EL PROBLEMA
--   Con la clave anonima se lee la tabla `certificates` entera: 16 de 16 filas
--   con sus 19 columnas, `user_id` incluido. Cruzada con `users`, que hasta la
--   049 servia correos, permitia reconstruir quien tiene que certificado.
--
--   La pagina /verificar/[codigo] es publica por diseno y tiene que seguir
--   siendolo: un certificado que no se puede verificar no sirve de nada. Pero
--   verificar uno es distinto de poder listarlos todos.
--
-- LA FORMA DE SEPARAR LAS DOS COSAS
--   RLS decide por fila, y no sabe con que filtro se pidio: no hay forma de
--   escribir "solo si consultas por numero". Lo que si se puede es cerrar la
--   tabla y abrir una sola puerta estrecha: una funcion SECURITY DEFINER que
--   recibe el codigo y devuelve unicamente lo que la pagina pinta.
--
--   Ese cambio tiene un efecto secundario util: la funcion resuelve dentro el
--   nombre del titular, el titulo del curso y el del modulo, asi que /verificar
--   deja de depender de que `users`, `courses` y `modules` sean legibles por
--   anonimos. Tras la 049 y la 050 ya no lo son del todo, y esta pagina habria
--   empezado a mostrar "Estudiante" y "Curso" para los certificados de cursos
--   archivados.
--
--   Sigue sin poder enumerarse: la funcion exige el numero completo y devuelve
--   como mucho una fila. Adivinar un NODO360-2026-XXXXXXXX de ocho caracteres
--   hexadecimales no es un ataque practico, y si alguna vez lo fuera, el limite
--   de peticiones se pone delante de la funcion, no de la tabla.
--
-- QUE SE ROMPE
--   Cerrar la tabla a anon no afecta a ninguna pagina: /verificar pasa a la
--   funcion (cambio de codigo que acompana a esta migracion) y el resto de
--   lecturas son de usuarios con sesion. Esas si necesitan politica propia,
--   porque hoy leen gracias a la permisiva:
--
--     - /dashboard/certificados y /certificados/[id]  -> los suyos
--     - /cursos/[slug], /cursos/[slug]/[leccion] y
--       lib/progress/checkLessonAccess.ts             -> los suyos
--     - /dashboard/instructor/estadisticas y
--       /api/instructor/students/stats                -> count(*) filtrado por
--       .in('course_id', cursosDelInstructor)         -> los de sus cursos
--     - /api/admin/students/stats                     -> count(*) global
--
--   Las tres politicas de abajo cubren exactamente esos tres casos. Lo que usa
--   createAdminClient() —lib/gamification/checkAndAwardBadges.ts y las rutas de
--   /api/admin/users/[id]/*— no pasa por RLS.
--
-- LO QUE HAY HOY, SEGUN pg_policies (24/09/2026)
--   tres politicas de SELECT, dos de ellas con USING true, y una FOR ALL a
--   `public` con user_id = auth.uid().
--
--   La FOR ALL no se puede quitar sin mas: al cubrir todos los comandos, es la
--   que permite a lib/certificates/createCertificate.ts y a
--   lib/certificates/generator.ts INSERTAR, ACTUALIZAR y BORRAR certificados
--   con el cliente de sesion. Borrarla y dejar solo politicas de SELECT dejaria
--   la plataforma sin poder emitir certificados, y el fallo no saldria hasta
--   que alguien terminara un curso.
--
--   Asi que se retira y se sustituye por tres politicas explicitas con el mismo
--   predicado, una por comando. El permiso efectivo es identico; la diferencia
--   es que queda escrito cual es y deja de conceder SELECT de forma implicita.
--
--
-- COMO APLICARLA, EN TRES PASOS
--   Igual que la 049: el PASO 1 crea verificar_certificado() y no rompe nada;
--   despues se despliega el codigo, que es el que empieza a usarla; y solo
--   entonces el PASO 2 cierra la tabla. Al reves, /verificar queda en blanco
--   entre una cosa y la otra.
--
-- COMPROBACION PREVIA (clave anonima, 24/09/2026)
--   certificates: anon ve 16 de 16, con user_id
-- ============================================================================

BEGIN;

-- ============================================================================
-- PASO 1 (ADITIVO). La puerta publica: verificar uno, por su numero
-- ============================================================================
-- Devuelve solo lo que pinta /verificar/[codigo]. Nunca user_id, ni course_id,
-- ni el hash, ni los campos de NFT.
--
-- Acepta tambien el codigo dentro de verification_url, que es el segundo
-- intento que hacia la pagina.

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
    ce.certificate_number,
    ce.type,
    ce.title,
    u.full_name,
    c.title,
    c.description,
    m.title,
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
  'Puerta publica de /verificar/[codigo]. Devuelve un certificado por su numero sin exponer user_id ni permitir enumerar la tabla. SECURITY DEFINER porque certificates, users, courses y modules ya no son legibles por anon.';

REVOKE ALL ON FUNCTION public.verificar_certificado(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verificar_certificado(text) TO anon, authenticated, service_role;

-- ============================================================================
-- PASO 2. Cerrar la tabla a los anonimos
-- ============================================================================
-- Como en la 025 y la 049: el GRANT de tabla es lo que hay que retirar.

REVOKE ALL ON public.certificates FROM anon;

-- Se retiran TODAS las politicas de la tabla: las tres de SELECT y la FOR ALL.
-- Las de abajo las sustituyen sin cambiar el permiso efectivo de nadie.

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname, cmd FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'certificates'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.certificates', r.policyname);
    RAISE NOTICE 'retirada politica % de certificates: %', r.cmd, r.policyname;
  END LOOP;
END $$;

-- ============================================================================
-- PASO 2b. Quien lee certificados con sesion
-- ============================================================================

CREATE POLICY "Cada uno ve sus certificados"
ON public.certificates FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Las tres que sustituyen a la FOR ALL. Mismo predicado, un comando cada una.
-- Sin ellas, createCertificate.ts y generator.ts dejan de poder emitir.

CREATE POLICY "Cada uno crea sus certificados"
ON public.certificates FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Cada uno actualiza sus certificados"
ON public.certificates FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Cada uno borra sus certificados"
ON public.certificates FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "El admin ve todos los certificados"
ON public.certificates FOR SELECT TO authenticated
USING (is_admin(check_user_id => auth.uid()));

-- Para los contadores de /dashboard/instructor/estadisticas y
-- /api/instructor/students/stats, que cuentan por course_id.
CREATE POLICY "El instructor ve los certificados de sus cursos"
ON public.certificates FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.courses c
     WHERE c.id = certificates.course_id
       AND c.instructor_id = auth.uid()
  )
);

GRANT ALL ON public.certificates TO service_role;

COMMIT;


-- ============================================================================
-- COMPROBACIONES
-- ============================================================================
-- 1. Con la clave ANONIMA, la tabla ya no se lista:
--
--      GET /rest/v1/certificates?select=id
--      QUE DEBE SALIR: 42501.
--
-- 2. Con la clave ANONIMA, un certificado concreto si se verifica:
--
--      POST /rest/v1/rpc/verificar_certificado  {"p_codigo":"NODO360-2026-A512B4D7"}
--      QUE DEBE SALIR: una fila, con titular y curso, SIN user_id.
--
-- 3. Un numero inventado devuelve vacio, no un error:
--
--      POST /rest/v1/rpc/verificar_certificado  {"p_codigo":"NODO360-2026-00000000"}
--      QUE DEBE SALIR: [].
--
-- 4. Los 16 certificados se verifican uno a uno por su numero.
--
-- 5. Con sesion: /dashboard/certificados sigue listando los propios, y
--    /certificados/[id] sigue abriendo el propio y dando 404 en el ajeno.
--
-- 6. /dashboard/instructor/estadisticas y /api/admin/students/stats siguen
--    devolviendo los mismos contadores que antes de aplicar esto.
--
-- 7. LA MAS IMPORTANTE: terminar un curso sigue emitiendo certificado. Es lo
--    que rompe si las tres politicas de escritura de arriba faltan, y no da
--    la cara hasta que alguien completa un curso.
