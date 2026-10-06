/**
 * Ejecutar una migración DE VERDAD antes de dársela a nadie.
 *
 *   npx tsx scripts/probar-una-migracion.mts tmp/122-aplicar.sql
 *
 * POR QUE EXISTE
 *   Dos migraciones seguidas se han caído al aplicarlas, y las dos por cosas que
 *   solo se ven EJECUTANDO:
 *
 *     121  42703  a la copia publicada le faltaba la columna nueva
 *     122  22P02  malformed array literal: "role"
 *
 *   La segunda es la que obliga a esto. `v_tocadas || 'role'`, con un array a la
 *   izquierda y un literal SIN TIPO a la derecha, PostgreSQL lo resuelve como
 *   array y se levanta. No lo ve `tsc`, no lo ve el `lint`, no lo ve leerlo con
 *   cuidado, y plpgsql NO compila el cuerpo de una función hasta la primera
 *   llamada: solo se ve cuando el trigger dispara de verdad.
 *
 *   No hay acceso SQL a producción —y no debe haberlo: las migraciones las
 *   aplica una persona—, así que esto levanta un PostgreSQL de usar y tirar con
 *   PGlite (Postgres compilado a WASM, sin servicio, sin contraseña, sin red),
 *   monta un andamio parecido al de Supabase y ejecuta el fichero entero.
 *
 * QUE PUEDE Y QUE NO PUEDE DECIR ESTE BANCO
 *   SI  errores de sintaxis y DE TIPOS, en el SQL llano y dentro de plpgsql;
 *       funciones que no existen; columnas que no existen; triggers que se
 *       pisan; que una autoprueba se levante cuando debe y no cuando no debe.
 *   NO  nada sobre LOS DATOS DE PRODUCCION. El andamio tiene cuatro filas
 *       inventadas. Si una autoprueba cuenta cursos reales, aquí dirá otra cosa:
 *       eso lo dice la aplicación de verdad, y por eso sigue habiendo revisión
 *       humana antes de aplicar.
 *   NO  nada de los objetos que el andamio no tiene. ESTA ESCRITO A MANO, y
 *       hoy modela cinco: `users`, `instructor_profiles`, `user_roles`,
 *       `courses` y la vista `perfiles_publicos`, con sus permisos por columna,
 *       sus políticas y sus triggers MEDIDOS en producción. Una migración que
 *       toque cualquier otra cosa fallará aquí por objetos que no existen, y
 *       ese fallo no dice nada de la migración.
 *   NO  nada que dependa del TEXTO de una política de producción: los recuentos
 *       de filas que cada rol ve están medidos, pero `pg_policies` no se puede
 *       leer desde fuera, así que las políticas del andamio son las más
 *       restrictivas compatibles con lo medido, no copias.
 *       Y por estar escrito a mano, SE DESFASA: ya se le habían olvidado
 *       `email_normalizado` y `anunciar_logros`. Lo que lo arregla de verdad es
 *       cargar un volcado de esquema de producción, y eso está pendiente.
 *
 *   O sea: esto no sustituye a aplicarla. Evita darte un fichero que ni arranca.
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

/**
 * PGlite vive FUERA del proyecto, en tmp/pglite-local (que esta en .gitignore).
 *
 * A proposito: es una herramienta de banco de pruebas, no una dependencia de lo
 * que se despliega, y meterla en package.json movería el lockfile —que en este
 * repo se genera con npm 10 y rompe el CI si lo toca npm 11—. Si falta, este
 * script dice como ponerla y no finge haber probado nada.
 */
/**
 * El tipo se declara aqui y no se importa del paquete: `scripts/` esta excluido
 * del tsconfig, pero si algun dia se incluye, un `import` de algo que no esta en
 * node_modules del proyecto romperia el typecheck.
 */
type BaseDePrueba = {
  query<T = Record<string, unknown>>(sql: string): Promise<{ rows: T[] }>
  exec(sql: string): Promise<Array<{ rows: Array<Record<string, unknown>> }>>
  close(): Promise<void>
}
const require_ = createRequire(import.meta.url)
let PGlite: { create(): Promise<BaseDePrueba> }
try {
  PGlite = require_('../tmp/pglite-local/node_modules/@electric-sql/pglite').PGlite
} catch {
  console.error('\nNo esta el banco de pruebas. Una vez:\n')
  console.error('   mkdir -p tmp/pglite-local && cd tmp/pglite-local')
  console.error('   npm init -y && npm install @electric-sql/pglite\n')
  console.error('Son 1 paquete y no toca el package.json del proyecto.\n')
  process.exit(2)
}

const fichero = process.argv[2]
if (!fichero) {
  console.error('Falta el fichero: npx tsx scripts/probar-una-migracion.mts tmp/122-aplicar.sql')
  process.exit(2)
}

/**
 * EL ANDAMIO. Lo mínimo de Supabase para que una migración de `users` se pueda
 * ejecutar: los roles, `auth.uid()` leyendo las claims, la tabla con sus
 * columnas, los permisos TAL COMO ESTAN MEDIDOS en producción, las cuatro
 * políticas y los dos triggers de updated_at.
 *
 * Los permisos son los medidos el 2026-10-05, no los que yo creía: nueve
 * columnas escribibles por `authenticated` y cinco legibles.
 */
const ANDAMIO = `
CREATE ROLE anon NOINHERIT;
CREATE ROLE authenticated NOINHERIT;
-- BYPASSRLS, como en Supabase. Sin esto el andamio da FALLOS FALSOS: la RLS se
-- le aplicaria al cliente de servicio y los UPDATE del servidor afectarian a
-- cero filas. Que en produccion lo tiene esta MEDIDO, no supuesto: con la clave
-- de servicio se leen las 26 filas de users y se escriben filas que la RLS
-- esconde, y no hay ninguna politica para service_role.
CREATE ROLE service_role NOINHERIT BYPASSRLS;
CREATE ROLE supabase_admin NOINHERIT BYPASSRLS;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::json ->> 'sub', '')::uuid
$$;

CREATE TYPE user_role AS ENUM ('student', 'instructor', 'mentor', 'admin');

-- Hace falta antes de la tabla: la columna generada email_normalizado la llama.
-- Copiada de la 106, con su IMMUTABLE, que es lo que permite generar con ella.
CREATE OR REPLACE FUNCTION public.correo_normalizado(p_correo text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = pg_temp AS $cn$
  SELECT CASE
    WHEN p_correo IS NULL OR position('@' in p_correo) = 0 THEN lower(p_correo)
    WHEN lower(split_part(p_correo, '@', 2)) IN ('gmail.com', 'googlemail.com')
      THEN replace(split_part(lower(split_part(p_correo, '@', 1)), '+', 1), '.', '')
           || '@gmail.com'
    ELSE split_part(lower(split_part(p_correo, '@', 1)), '+', 1)
         || '@' || lower(split_part(p_correo, '@', 2))
  END
$cn$;

CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  full_name text,
  avatar_url text,
  role user_role NOT NULL DEFAULT 'student',
  bio text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz,
  twitter text,
  linkedin text,
  github text,
  active_path_id uuid,
  active_path_selected_at timestamptz,
  is_beta boolean NOT NULL DEFAULT false,
  avatar_path text,
  is_suspended boolean NOT NULL DEFAULT false,
  suspended_at timestamptz,
  suspended_reason text,
  suspended_by uuid,
  is_beta_enabled boolean NOT NULL DEFAULT false,
  wants_beta_notification boolean NOT NULL DEFAULT false,
  welcome_email_sent_at timestamptz,
  email_confirmed_at timestamptz,
  website text,
  -- La 113 la crea y la 122 la aplico de verdad. Sin ella, una migracion que la
  -- toque fallaria aqui por una razon que no es la suya.
  anunciar_logros boolean NOT NULL DEFAULT false,
  -- GENERADA, como en la 106. Importa que lo sea: a una columna generada no se
  -- le puede escribir, y una migracion que lo intente tiene que fallar AQUI.
  email_normalizado text GENERATED ALWAYS AS (public.correo_normalizado(email)) STORED
);

-- es_admin_actual(), como la 034: SECURITY DEFINER y mirando la fila propia.
CREATE OR REPLACE FUNCTION public.es_admin_actual() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
$$;
REVOKE ALL ON FUNCTION public.es_admin_actual() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.es_admin_actual() FROM anon;
GRANT EXECUTE ON FUNCTION public.es_admin_actual() TO authenticated, service_role;

-- Los dos triggers de updated_at que hay hoy, con sus dos funciones.
CREATE OR REPLACE FUNCTION public.tocar_updated_at() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END $$;

CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.tocar_updated_at();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- El trigger de la 100: protege SOLO filas que ya son admin.
CREATE OR REPLACE FUNCTION public.proteger_la_cuenta_admin() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  IF OLD.role <> 'admin' THEN RETURN NEW; END IF;
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'No se puede cambiar el rol de una cuenta de administracion.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_proteger_la_cuenta_admin BEFORE UPDATE OR DELETE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.proteger_la_cuenta_admin();

-- LOS PERMISOS, los medidos: cinco columnas legibles, nueve escribibles.
REVOKE ALL ON public.users FROM anon, authenticated;
GRANT SELECT (id, full_name, avatar_url, role, created_at) ON public.users TO anon, authenticated;
-- DIEZ desde la 122: las nueve de la 085 (menos las dos que retiro la 086) mas
-- anunciar_logros.
GRANT UPDATE (full_name, bio, avatar_url, avatar_path, website,
              twitter, linkedin, github, wants_beta_notification,
              anunciar_logros)
  ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;

-- Y las cuatro politicas de hoy.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read basic user info" ON public.users
  FOR SELECT TO anon
  USING ((role = ANY (ARRAY['instructor','mentor','admin']::user_role[])) OR (id = auth.uid()));
CREATE POLICY users_read_all_authenticated ON public.users
  FOR SELECT TO authenticated USING (true);
CREATE POLICY users_read_own ON public.users
  FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY users_update_own ON public.users
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ── Lo que hace falta para la politica POR FUNCION ────────────────────────
-- La 123 decide quien es «funcion publica» con el mismo WHERE que la vista
-- perfiles_publicos: perfil de instructor activo, mentor activo en user_roles, o
-- autor de un curso publicado. Sin estas tres tablas, la 123 no se puede probar.

CREATE TABLE public.instructor_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.users(id),
  is_active boolean NOT NULL DEFAULT true,
  accepts_messages boolean NOT NULL DEFAULT true
);

-- Fiel al original (scripts/add-user-roles-system.sql): «role» es el MISMO enum
-- que users.role —la 034 lo castea a ::TEXT, que es lo que lo delata— y
-- «is_active» ADMITE NULL, asi que un «AND is_active» con NULL no casa. Si aqui
-- fuera «text NOT NULL», el banco dejaria pasar comparaciones que en produccion
-- fallan y escondería el caso del NULL.
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'student',
  granted_by uuid REFERENCES public.users(id),
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TYPE course_status AS ENUM
  ('draft','published','archived','coming_soon','pending_review','rejected','changes_requested');

CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  status course_status NOT NULL DEFAULT 'draft',
  instructor_id uuid REFERENCES public.users(id),
  firmado_por_la_plataforma boolean NOT NULL DEFAULT false
);
GRANT SELECT ON public.courses TO anon, authenticated;
GRANT ALL ON public.courses TO service_role;
GRANT SELECT ON public.instructor_profiles TO anon, authenticated;
GRANT ALL ON public.instructor_profiles TO service_role;
GRANT SELECT ON public.user_roles TO anon, authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- ── LA RLS DE LAS TRES, QUE ES LO QUE DECIDE SI UNA POLITICA PUEDE MIRARLAS ──
--
-- Medido contra produccion el 2026-10-06, con la clave de servicio y con la
-- anonima:
--
--   instructor_profiles   servicio 1 fila    anon 1 fila
--   user_roles            servicio 2 filas   anon 0 filas   <- tapada
--   courses               servicio 16 filas  anon 10 filas  <- solo publicados
--
-- Los RECUENTOS estan medidos; EL TEXTO de las politicas no se puede leer desde
-- fuera (PostgREST no da el catalogo y no hay volcado todavia). Asi que aqui va
-- la mas restrictiva compatible con lo medido, que es ademas la que pone a
-- prueba lo que importa: con «user_roles» tapada, un EXISTS dentro de una
-- politica no ve a los mentores, y solo una funcion SECURITY DEFINER los ve.

ALTER TABLE public.instructor_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active profiles are public" ON public.instructor_profiles
  FOR SELECT USING (is_active = true);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_roles_propio ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY courses_publicados ON public.courses
  FOR SELECT USING (status = 'published');

-- Cuatro filas de mentira: un admin, un instructor, un mentor y un estudiante.
INSERT INTO public.users (email, full_name, role) VALUES
  ('admin@ejemplo.invalid',      'Cuenta de administracion', 'admin'),
  ('instructor@ejemplo.invalid', 'Cuenta de instructor',     'instructor'),
  ('mentor@ejemplo.invalid',     'Cuenta de mentor',         'mentor'),
  ('alumno@ejemplo.invalid',     'Cuenta de alumno',         'student');

-- El instructor, con perfil activo. El mentor, activo en user_roles. Y el admin,
-- autor de un curso publicado: las tres funciones publicas, una por cabeza, para
-- que la politica de la 123 se pueda probar en las tres ramas.
INSERT INTO public.instructor_profiles (user_id, is_active, accepts_messages)
  SELECT id, true, true FROM public.users WHERE role = 'instructor';

INSERT INTO public.user_roles (user_id, role, is_active)
  SELECT id, 'mentor', true FROM public.users WHERE role = 'mentor';

INSERT INTO public.courses (slug, title, status, instructor_id, firmado_por_la_plataforma)
  SELECT 'curso-de-la-plataforma', 'Curso firmado por la plataforma', 'published', id, true
    FROM public.users WHERE role = 'admin';

-- Y uno firmado por una PERSONA, que es el caso que la autoprueba de la 123
-- tiene que poder seguir mostrando con su autor.
INSERT INTO public.courses (slug, title, status, instructor_id, firmado_por_la_plataforma)
  SELECT 'curso-de-una-persona', 'Curso firmado por una persona', 'published', id, false
    FROM public.users WHERE role = 'instructor';

-- La vista, igual que la deja la 104 (con «role»: la 123 es la que lo quita).
CREATE OR REPLACE VIEW public.perfiles_publicos AS
  SELECT u.id, u.full_name, u.avatar_url, u.role, u.bio,
    CASE WHEN ip.user_id IS NOT NULL THEN u.website  END AS website,
    CASE WHEN ip.user_id IS NOT NULL THEN u.twitter  END AS twitter,
    CASE WHEN ip.user_id IS NOT NULL THEN u.linkedin END AS linkedin,
    CASE WHEN ip.user_id IS NOT NULL THEN u.github   END AS github,
    (ip.user_id IS NOT NULL) AS es_instructor,
    (me.user_id IS NOT NULL) AS es_mentor,
    (au.autor    IS NOT NULL) AS es_autor
  FROM public.users u
  LEFT JOIN public.instructor_profiles ip ON ip.user_id = u.id AND ip.is_active
  LEFT JOIN (SELECT DISTINCT user_id FROM public.user_roles
              WHERE role = 'mentor' AND is_active) me ON me.user_id = u.id
  LEFT JOIN (SELECT DISTINCT instructor_id AS autor FROM public.courses
              WHERE status = 'published' AND instructor_id IS NOT NULL) au ON au.autor = u.id
  WHERE ip.user_id IS NOT NULL OR me.user_id IS NOT NULL OR au.autor IS NOT NULL;

REVOKE ALL ON public.perfiles_publicos FROM PUBLIC;
GRANT SELECT ON public.perfiles_publicos TO anon, authenticated;
`

const sql = fs.readFileSync(fichero, 'utf8')
console.log(`\n=== ${path.basename(fichero)} contra un PostgreSQL de usar y tirar ===\n`)

const db = await PGlite.create()
const version = (await db.query<{ version: string }>('select version()')).rows[0].version
console.log(`   motor: ${version.split(' on ')[0]}`)

// ── El esquema: el volcado de produccion si existe, y si no el andamio ──────
//
// `tmp/esquema-produccion.sql` lo saca `docs/VOLCADO-DE-ESQUEMA.md` con
// `pg_dump --schema-only`. Vive en `tmp/`, que está en .gitignore: no se sube, y
// este repositorio es público. Si está, el banco deja de depender de una tabla
// escrita a mano; si no está, usa el andamio y LO DICE, para que nadie confunda
// un aval completo con uno parcial.
const VOLCADO = 'tmp/esquema-produccion.sql'
const hayVolcado = fs.existsSync(VOLCADO)

try {
  if (hayVolcado) {
    // Los roles no vienen en un pg_dump, así que se crean antes: es la primera
    // parte del andamio, hasta el CREATE SCHEMA.
    await db.exec(ANDAMIO.slice(0, ANDAMIO.indexOf('CREATE SCHEMA')))
    await db.exec(fs.readFileSync(VOLCADO, 'utf8'))
    console.log(`   esquema: ${VOLCADO} (volcado de producción)`)
  } else {
    await db.exec(ANDAMIO)
    const { rows } = await db.query<{ n: number }>('select count(*)::int n from public.users')
    console.log(`   esquema: ANDAMIO ESCRITO A MANO, ${rows[0].n} filas de mentira`)
    console.log('   modela users, instructor_profiles, user_roles, courses y')
    console.log('   perfiles_publicos, con su RLS. NADA MAS: para el resto del')
    console.log('   esquema hace falta el volcado')
    console.log('   (docs/VOLCADO-DE-ESQUEMA.md)')
  }
  console.log()
} catch (e) {
  console.error(`*** El esquema no monta (${hayVolcado ? VOLCADO : 'andamio'}),`)
  console.error('    así que NO SE HA PROBADO la migración:')
  console.error('   ' + (e as Error).message)
  process.exit(1)
}

// ── La migración ────────────────────────────────────────────────────────────
// PGlite no expone los NOTICE, así que no se finge recogerlos. Lo que sí
// devuelve `exec` son los resultados de cada sentencia, y de ahí sale la mejor
// evidencia posible: LA FILA DE VERIFICACION de la propia migración.
let resultados: Array<{ rows: Array<Record<string, unknown>> }> = []
try {
  resultados = (await db.exec(sql)) as typeof resultados
} catch (e) {
  const err = e as Error & {
    code?: string; detail?: string; hint?: string; position?: string; where?: string
  }
  console.log('*** LA MIGRACION FALLA. No se la des a nadie.')
  console.log()
  console.log(`   código:  ${err.code ?? '(sin codigo)'}`)
  console.log(`   mensaje: ${err.message}`)
  if (err.detail) console.log(`   detalle: ${err.detail}`)
  if (err.hint) console.log(`   pista:   ${err.hint}`)
  // `where` es el contexto de plpgsql: dice la sentencia y la línea del bloque,
  // que es lo que de verdad localiza el fallo dentro de una autoprueba.
  if (err.where) {
    console.log('   dónde:')
    for (const l of err.where.split(/\r?\n/)) console.log('     ' + l)
  }
  if (err.position) {
    console.log(`   línea del fichero: ${sql.slice(0, Number(err.position)).split(/\r?\n/).length}`)
  }
  console.log()
  await db.close()
  process.exit(1)
}

// La última sentencia con filas es la verificación.
const conFilas = resultados.filter((r) => r.rows && r.rows.length > 0)
const verificacion = conFilas.at(-1)

console.log('   la autoprueba corrió SIN LEVANTARSE, y como cada comprobación suya')
console.log('   termina en RAISE EXCEPTION, eso es exactamente que todas pasaron.')

if (verificacion) {
  console.log()
  console.log('   --- la fila de verificación de la migración ---')
  for (const [k, v] of Object.entries(verificacion.rows[0])) {
    console.log(`     ${k.padEnd(28)} ${v === null ? '(null)' : String(v)}`)
  }
}

console.log()
console.log('   TODO CORRECTO: el fichero se ejecuta entero contra un PostgreSQL de verdad.')
console.log('   OJO: esto NO dice nada de LOS DATOS de producción. El andamio tiene cuatro')
console.log('   filas inventadas, así que una verificación que cuente filas reales dirá aquí')
console.log('   otra cosa. Lo que esto prueba es que el fichero arranca y que su lógica se')
console.log('   sostiene; lo demás lo dice aplicarla.')
console.log()
await db.close()
