# Sacar el esquema de producción, sin datos

Para dos cosas:

1. que el **banco de pruebas** (`npm run probar:migracion`) cargue el esquema de
   verdad en vez de un andamio escrito a mano, que solo modela `public.users` y se
   desfasa —ya se le habían olvidado `email_normalizado` y `anunciar_logros`—;
2. y para **versionar lo que falta**: `supabase/migrations/` no tiene la 001, la
   002, la 017 ni la 018, así que el esquema inicial no está en el repositorio.
   De ahí vienen, por ejemplo, las cuatro políticas de `public.users` y el
   trigger `update_users_updated_at`, que nadie había escrito en ninguna parte.

**No pone la contraseña de la base en ningún fichero de este repositorio.** Se
pasa por una variable de entorno de la sesión y se borra al terminar.

---

## 1. Qué instalar: nada

`pg_dump` ya está en esta máquina, con el PostgreSQL 18 que hay instalado:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" --version
# pg_dump (PostgreSQL) 18.6
```

Volcar un servidor **más viejo** con un `pg_dump` **más nuevo** es la dirección
soportada, así que 18.6 sirve para el Postgres de Supabase. Al revés no.

Si algún día no estuviera: o el instalador de PostgreSQL (basta marcar *Command
Line Tools*), o `winget install PostgreSQL.PostgreSQL.18`.

---

## 2. Qué credencial, y dónde está

Hace falta **la contraseña de la base de datos**, que no es ni la clave `anon` ni
la `service_role`: esas son de la API, y `pg_dump` no habla por la API.

En el panel de Supabase:

> **Project Settings → Database**

Ahí hay dos cosas:

- **Connection string**. Copia la de **Session pooler** (o *Direct connection* si
  tu red tiene IPv6). Tiene esta forma, con `[YOUR-PASSWORD]` como marcador:

  ```
  postgresql://postgres.<ref>:[YOUR-PASSWORD]@aws-0-<region>.pooler.supabase.com:5432/postgres
  ```

  **Copia el host y el usuario del panel, no de aquí**: cambian por proyecto y
  por región. Y que sea el de **puerto 5432** (sesión), no el 6543 (transacción):
  el de transacción no sirve para `pg_dump`.

- **Database password**. Solo se enseña **al crear el proyecto**. Si no la tienes
  apuntada, en esa misma página hay **Reset database password**.

### Resetearla no rompe nada: comprobado

Antes de decirlo, buscado. En todo el árbol —código, scripts y el workflow— **no
hay una sola conexión directa a Postgres**:

| qué se buscó | resultado |
|---|---|
| `DATABASE_URL`, `POSTGRES_URL`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `PGPASSWORD`, `PGHOST` | **ninguna referencia** |
| `pg`, `postgres`, `postgres-js`, `prisma`, `drizzle`, `knex`, `@vercel/postgres`, `kysely` en `package.json` | **ninguna dependencia** |
| esos mismos paquetes en `node_modules` (por si entraran de transitivo) | **ninguno instalado** |
| `import` de alguno de ellos en `app/`, `lib/`, `components/`, `scripts/` | **ninguno** |

Todo habla con Supabase **por la API**, con `NEXT_PUBLIC_SUPABASE_ANON_KEY` y
`SUPABASE_SERVICE_ROLE_KEY`. La contraseña de la base no la usa nada de la
plataforma, así que cambiarla **no corta ningún servicio**. Lo único que dejaría
de funcionar es una conexión que alguien tuviera abierta a mano desde su
ordenador.

**Guárdala en un gestor de contraseñas**, con el nombre del proyecto. No en un
fichero, no en una nota del escritorio y desde luego no en este repositorio: es
la llave que salta por encima de la RLS y de todos los permisos por columna que
hemos ido poniendo.

---

## 3. El comando

En PowerShell, en una sola sesión. La contraseña **no se ve al teclearla** y se
borra al terminar **pase lo que pase**, también si `pg_dump` falla:

```powershell
# 1. Donde se guarda: FUERA del repositorio
$destino = "$env:USERPROFILE\nodo360-esquema"
New-Item -ItemType Directory -Force $destino | Out-Null

# 2. La contraseña: no se ve al teclearla y no queda escrita en ningún sitio
$seguro = Read-Host -Prompt "Contrasena de la base" -AsSecureString
$bstr   = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($seguro)

try {
    $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)

    # 3. El volcado: SOLO ESQUEMA, con permisos y políticas, sin una sola fila
    & "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" `
        --host=aws-0-<region>.pooler.supabase.com `
        --port=5432 `
        --username=postgres.<ref> `
        --dbname=postgres `
        --schema-only `
        --schema=public `
        --no-password `
        --file="$destino\esquema-publico.sql"

    if ($LASTEXITCODE -ne 0) { Write-Warning "pg_dump fallo con codigo $LASTEXITCODE" }
}
finally {
    # 4. Y fuera de la sesion, aunque pg_dump se haya caido
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
```

Tres detalles que importan:

- **`-AsSecureString`**: no se ve lo que tecleas, y no queda en el historial de
  PowerShell. Con `Read-Host` a secas, la contraseña aparece en pantalla.
- **`try`/`finally`**: si `pg_dump` falla —host mal escrito, red, permisos—, la
  variable se borra igual. Sin el `finally`, una contraseña se queda en la
  sesión hasta que cierras la ventana.
- **`ZeroFreeBSTR`**: además de borrar la variable, sobrescribe la copia en
  memoria que hizo falta para convertirla.

Probado en PowerShell 5.1, que es el de esta máquina.

Sustituye `<region>` y `<ref>` por lo que diga el panel.

**Qué trae y qué no:**

| | |
|---|---|
| tablas, columnas, tipos, índices, restricciones | **sí** |
| funciones y triggers, con su cuerpo | **sí** |
| políticas de RLS | **sí** |
| `GRANT` y `REVOKE`, incluidos los **por columna** | **sí** |
| filas | **no** — `--schema-only` |
| **roles** (`anon`, `authenticated`, `service_role`…) | **no** |
| el esquema `auth` de Supabase | **no** con este comando |

### Los roles, aparte

`pg_dump` no vuelca roles, y `pg_dumpall --roles-only` necesita un superusuario
que en Supabase no tenemos. Pero para el banco de pruebas basta saber cómo son,
y eso se lee con una consulta de solo lectura en el editor SQL:

```sql
SELECT 'CREATE ROLE ' || quote_ident(rolname)
       || CASE WHEN rolbypassrls THEN ' BYPASSRLS' ELSE '' END
       || CASE WHEN rolinherit   THEN ''           ELSE ' NOINHERIT' END
       || ';' AS crear_rol
  FROM pg_roles
 WHERE rolname IN ('anon', 'authenticated', 'service_role',
                   'supabase_admin', 'supabase_auth_admin')
 ORDER BY rolname;
```

Eso confirma de paso lo que hoy está **medido pero no documentado**: que
`service_role` tiene `BYPASSRLS`. El andamio lo da por hecho y conviene tenerlo
por escrito desde el catálogo.

### El esquema `auth`

Se queda fuera a propósito: lo gestiona Supabase, su dueño es
`supabase_auth_admin` y un volcado como `postgres` saldría a medias. Lo único
que el banco necesita de ahí es `auth.uid()`, que son tres líneas y seguirán
escritas a mano en el andamio. Si algún día hace falta más, se añade al volcado
con `--schema=auth` y se mira qué sale antes de usarlo.

---

## 4. Qué hacer con el fichero

**Se queda fuera del repositorio hasta haberlo leído.** Dos motivos:

- **Este repositorio es público.** El volcado lleva el modelo de seguridad
  entero: políticas, permisos por columna y el cuerpo de todas las funciones.
  Casi todo eso ya está en `supabase/migrations/`, así que no añade mucho — pero
  «casi» no es «nada», y conviene mirarlo antes, no después.
- Puede traer cosas que no esperamos del esquema inicial.

El camino:

1. **Para el banco de pruebas**: copiarlo a `tmp/esquema-produccion.sql`
   **con una primera línea que diga hasta qué migración llega**: la última
   aplicada en producción cuando se sacó. `tmp/` está en `.gitignore`, así que
   no se sube.

   ```powershell
   $hasta = '124'   # la ULTIMA migracion aplicada cuando se saco el volcado
   "-- nodo360: volcado hasta la migracion $hasta`n" +
     (Get-Content -Raw "$destino\esquema-publico.sql") |
     Set-Content -Encoding utf8 tmp\esquema-produccion.sql
   ```

   El banco la necesita. Un volcado es una foto, y para probar una migración
   sobre la base de **hoy** pone encima, en orden, las migraciones versionadas
   posteriores a esa foto. **Sin la línea, se niega a usarlo**, y también si la
   foto ya incluye la migración que se prueba. Antes no lo hacía: con un
   volcado no aplicaba nada encima, y una migración correcta salía en rojo
   sobre un volcado viejo.

   Si el fichero no existe, el banco usa el andamio escrito a mano, que declara
   su propia foto en `ANDAMIO_HASTA_LA_MIGRACION`, y encima solo pone las
   declaradas en `COMPATIBLES_CON_EL_ANDAMIO`: si hay una posterior sin
   declarar, se niega y la nombra.
2. **Para versionar lo que falta**: de ese volcado se extrae **solo lo que no
   está en ninguna migración** y se escribe como `001`, `002`, `017` y `018` con
   su cabecera explicando que son el esquema inicial reconstruido, no una
   migración que se aplicó. **No se vuelca el fichero entero al repositorio**:
   sería mezclar el estado de hoy con la historia, y ya hay 117 migraciones que
   cuentan esa historia.

---

## 5. Comprobar que el volcado sirve, antes de fiarse

```powershell
# Que no se ha colado ni una fila
Select-String -Path "$destino\esquema-publico.sql" -Pattern '^COPY |^INSERT INTO' | Measure-Object

# Que sí están las políticas, los permisos por columna y los triggers
Select-String -Path "$destino\esquema-publico.sql" -Pattern '^CREATE POLICY' | Measure-Object
Select-String -Path "$destino\esquema-publico.sql" -Pattern '^GRANT .*\(' | Measure-Object
Select-String -Path "$destino\esquema-publico.sql" -Pattern '^CREATE TRIGGER' | Measure-Object
```

El primero tiene que dar **0**. Los otros tres, bastantes más que cero — y en
particular `GRANT … (` son los permisos por columna de `users`, que son el motivo
por el que todo este trabajo empezó.
