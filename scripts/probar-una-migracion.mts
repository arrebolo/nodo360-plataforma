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
  website text
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
GRANT UPDATE (full_name, bio, avatar_url, avatar_path, website,
              twitter, linkedin, github, wants_beta_notification)
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

-- Cuatro filas de mentira: un admin, un instructor, un mentor y un estudiante.
INSERT INTO public.users (email, full_name, role) VALUES
  ('admin@ejemplo.invalid',      'Cuenta de administracion', 'admin'),
  ('instructor@ejemplo.invalid', 'Cuenta de instructor',     'instructor'),
  ('mentor@ejemplo.invalid',     'Cuenta de mentor',         'mentor'),
  ('alumno@ejemplo.invalid',     'Cuenta de alumno',         'student');
`

const sql = fs.readFileSync(fichero, 'utf8')
console.log(`\n=== ${path.basename(fichero)} contra un PostgreSQL de usar y tirar ===\n`)

const db = await PGlite.create()
const version = (await db.query<{ version: string }>('select version()')).rows[0].version
console.log(`   motor: ${version.split(' on ')[0]}`)

// ── El andamio ──────────────────────────────────────────────────────────────
try {
  await db.exec(ANDAMIO)
  const { rows } = await db.query<{ n: number }>('select count(*)::int n from public.users')
  console.log(`   andamio montado: ${rows[0].n} filas de mentira en public.users\n`)
} catch (e) {
  console.error('*** El ANDAMIO no monta, así que no se ha probado la migración:')
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
