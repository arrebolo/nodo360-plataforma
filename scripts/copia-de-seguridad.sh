#!/usr/bin/env bash
#
# Volcado completo de la base de datos: esquema y datos.
#
# ────────────────────────────────────────────────────────────────────────────
# POR QUE EXISTE
#
#   Todo Nodo360 vive en un solo Supabase: las cuentas, el progreso, los
#   certificados y el contenido de las 111 lecciones. El repositorio tiene las
#   migraciones, pero NINGUN dato. Y todas las migraciones se aplican a mano en
#   el editor SQL, que es justo donde un borrado accidental es un martes
#   cualquiera.
#
#   Si Vercel desapareciera mañana, esto se vuelve a desplegar en una tarde. Si
#   desapareciera Supabase, no habria nada que desplegar.
#
# COMO SE USA
#
#   1. Saca la cadena de conexion de Supabase:
#        Project Settings → Database → Connection string → URI
#      Usa la de "Session pooler" o la directa; las dos valen para pg_dump.
#
#   2. Pasala por variable de entorno. NUNCA como argumento: los argumentos se
#      quedan en el historial del shell y se ven en la lista de procesos.
#
#        export DATABASE_URL='postgresql://postgres:LA_CLAVE@db.xxxx.supabase.co:5432/postgres'
#        ./scripts/copia-de-seguridad.sh
#
#   3. El volcado NO se guarda en el repositorio. Por defecto va a
#      ../nodo360-copias/, al lado del proyecto. Cambia DESTINO si quieres otro
#      sitio; lo sensato es que acabe en un disco que no sea este.
#
# QUE NO HACE
#
#   No restaura. Restaurar es una decision, no un script: se hace mirando, con
#   la base delante y sabiendo que se sobrescribe. Al final se imprime el
#   comando exacto para cuando haga falta.
#
#   No sube nada a ninguna parte. Si quieres copia fuera de casa, sincroniza
#   la carpeta con lo que uses; esto solo genera el fichero.
# ────────────────────────────────────────────────────────────────────────────

set -euo pipefail

DESTINO="${DESTINO:-../nodo360-copias}"
FECHA="$(date +%Y-%m-%d_%H%M)"

# ── Comprobaciones antes de empezar ─────────────────────────────────────────

if [ -z "${DATABASE_URL:-}" ]; then
  cat >&2 <<'AYUDA'
❌ Falta DATABASE_URL.

   export DATABASE_URL='postgresql://postgres:CLAVE@db.xxxx.supabase.co:5432/postgres'
   ./scripts/copia-de-seguridad.sh

   La cadena está en Supabase → Project Settings → Database → Connection string.
   No la pases como argumento: se queda en el historial del shell.
AYUDA
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  cat >&2 <<'AYUDA'
❌ No encuentro pg_dump.

   Windows: viene con PostgreSQL (https://www.postgresql.org/download/windows/).
            Marca "Command Line Tools" al instalar y añade la carpeta bin al PATH.
   macOS:   brew install libpq && brew link --force libpq
   Linux:   sudo apt install postgresql-client

   Comprueba que la versión de pg_dump es IGUAL O MAYOR que la del servidor.
   Una menor se niega a volcar, y hace bien.
AYUDA
  exit 1
fi

mkdir -p "$DESTINO"

FICHERO="$DESTINO/nodo360_${FECHA}.sql"

echo "▶ Volcando a $FICHERO"
echo "  pg_dump: $(pg_dump --version | head -1)"
echo

# ── El volcado ──────────────────────────────────────────────────────────────
#
# --no-owner y --no-privileges: el volcado se restaura en un proyecto nuevo,
#   donde los roles de Supabase no son los mismos. Sin esto, la restauracion
#   falla en cada GRANT.
# --schema=public: los esquemas auth y storage los gestiona Supabase y no se
#   pueden recrear desde un volcado. LO QUE SIGNIFICA: las CUENTAS de auth.users
#   NO entran aqui. Ver el aviso del final.
# --clean --if-exists: el fichero se puede aplicar sobre una base con cosas.

pg_dump "$DATABASE_URL" \
  --schema=public \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  --quote-all-identifiers \
  --file="$FICHERO"

TAMANO="$(du -h "$FICHERO" | cut -f1)"
TABLAS="$(grep -c '^CREATE TABLE' "$FICHERO" || true)"
FILAS="$(grep -c '^INSERT INTO\|^COPY ' "$FICHERO" || true)"

echo "✅ Listo: $FICHERO  ($TAMANO)"
echo "   $TABLAS tablas, $FILAS bloques de datos"
echo

# ── Comprobacion minima: un volcado que no contiene lo esencial no es copia ──
FALTAN=""
for t in users courses lessons course_enrollments user_progress certificates; do
  grep -q "CREATE TABLE \"public\".\"$t\"" "$FICHERO" || FALTAN="$FALTAN $t"
done

if [ -n "$FALTAN" ]; then
  echo "⚠️  En el volcado NO aparecen estas tablas:$FALTAN"
  echo "    Revisa la conexión antes de fiarte de este fichero."
  exit 1
fi

echo "✔ Comprobado: están users, courses, lessons, course_enrollments,"
echo "  user_progress y certificates."
echo

cat <<AVISO
────────────────────────────────────────────────────────────────────────────
LO QUE ESTE FICHERO NO LLEVA

  Las CUENTAS. Viven en el esquema auth, que gestiona Supabase y no se puede
  recrear desde un pg_dump normal. public.users guarda el perfil, pero sin
  auth.users nadie puede iniciar sesión.

  Para las cuentas hace falta, además:
    - Supabase → Database → Backups (plan de pago), o
    - un volcado de auth con permisos de superusuario, que el pooler no da.

  Dicho de otro modo: esto salva EL CONTENIDO Y EL PROGRESO. Para salvar el
  acceso de las personas hace falta el plan con copias de Supabase. Compruébalo.

PARA RESTAURAR, cuando toque y mirando:

  psql "\$DATABASE_URL_DESTINO" --file="$FICHERO"

  Sobrescribe lo que haya (--clean). No lo ejecutes contra producción salvo
  que sepas exactamente qué estás reemplazando.
────────────────────────────────────────────────────────────────────────────
AVISO
