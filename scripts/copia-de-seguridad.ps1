<#
.SYNOPSIS
  Volcado completo de la base de Supabase de producción de Nodo360.

.DESCRIPTION
  Vuelca esquema y datos con pg_dump. Intenta incluir los esquemas auth y
  storage, no solo public: auth.users son LAS CUENTAS, y sin ellas nadie puede
  iniciar sesión aunque se restaure todo lo demás.

  LA CADENA DE CONEXIÓN SE PIDE AL EJECUTARLO Y NO SE GUARDA EN NINGÚN SITIO.
  Se pega con Read-Host -AsSecureString (no se ve, no queda en el historial),
  se descompone en las variables PGHOST, PGUSER, PGPASSWORD... de ESTE proceso
  —no se le pasa a pg_dump como argumento, porque los argumentos de un proceso
  los ve cualquier programa del equipo: el Administrador de tareas tiene una
  columna «Línea de comandos»— y se borra en un finally, termine como termine.

  Antes se leía de una variable de entorno de usuario, NODO360_DB_URL, y el
  propio script decía cómo dejarla guardada. Eso era un error: una variable
  de usuario queda en texto plano en el registro, la lee cualquier proceso de
  la cuenta —cualquier paquete de npm, cualquier herramienta— y da acceso
  total a la base saltándose la RLS y los permisos. Si sigue puesta, el script
  lo avisa, NO la lee y dice cómo borrarla.

  Lo ejecuta una persona, a mano: con la entrada redirigida se niega.

  NO RESTAURA NADA. Al terminar imprime el comando de restauración para
  cuando haga falta, mirándolo antes de ejecutarlo.

.PARAMETER Destino
  Carpeta donde se guarda el volcado. Fuera del repositorio.
  Por omisión: C:\Users\alber\backups-nodo360

.PARAMETER Formato
  plain  -> un .sql de texto, legible y se restaura con psql (por omisión).
  custom -> un .dump comprimido, se restaura con pg_restore y permite elegir
            qué tablas restaurar. Más pequeño, no se puede leer con un editor.

.PARAMETER SoloPublic
  Vuelca únicamente el esquema public, sin intentar auth ni storage.

.EXAMPLE
  powershell -NoProfile -File .\scripts\copia-de-seguridad.ps1

.EXAMPLE
  powershell -NoProfile -File .\scripts\copia-de-seguridad.ps1 -Destino D:\copias -Formato custom

.NOTES
  QUÉ VERSIÓN DE pg_dump HACE FALTA
    pg_dump nunca puede volcar un servidor MÁS NUEVO que él. Al contrario sí:
    un pg_dump nuevo vuelca servidores viejos sin problema. Así que la regla es
    instalar el cliente de PostgreSQL MÁS RECIENTE y no preocuparse más.
    Este script comprueba las dos versiones antes de empezar y se para con un
    mensaje claro si el cliente es más antiguo que el servidor.

  QUÉ NO ENTRA EN EL VOLCADO
    Los esquemas internos que gestiona Supabase (extensions, realtime, vault,
    graphql, pgbouncer...) no se incluyen a propósito: un proyecto nuevo los
    crea por su cuenta y restaurarlos encima da conflictos. Tampoco entran los
    ficheros de Storage: lo que se vuelca son las FILAS de storage.objects, es
    decir el catálogo, no el contenido de los ficheros del bucket.

  Escrito el 28/09/2026. La versión para Linux y macOS es
  scripts/copia-de-seguridad.sh, que solo vuelca public.
#>

[CmdletBinding()]
param(
  [string] $Destino = 'C:\Users\alber\backups-nodo360',

  [ValidateSet('plain', 'custom')]
  [string] $Formato = 'plain',

  [switch] $SoloPublic
)

$ErrorActionPreference = 'Stop'

# Las tablas sin las que un volcado no es una copia de seguridad, sino un
# fichero. Si alguna falta, el script termina con error.
$TABLAS_IMPRESCINDIBLES = @(
  'users', 'courses', 'modules', 'lessons',
  'course_enrollments', 'user_progress', 'certificates'
)

function Escribir-Titulo([string] $texto) {
  Write-Host ''
  Write-Host "== $texto" -ForegroundColor Cyan
}

function Terminar-Con-Error([string] $mensaje) {
  Write-Host ''
  Write-Host "ERROR: $mensaje" -ForegroundColor Red
  Write-Host ''
  exit 1
}

# Busca un ejecutable del cliente de PostgreSQL: primero en el PATH, y si no
# está, en las instalaciones habituales, de la versión más nueva a la más vieja.
function Buscar-Programa([string] $nombre) {
  $enPath = Get-Command $nombre -ErrorAction SilentlyContinue
  if ($enPath) { return $enPath.Source }

  $rutas = @(
    "C:\Program Files\PostgreSQL\*\bin\$nombre",
    "C:\Program Files (x86)\PostgreSQL\*\bin\$nombre"
  )
  $encontrados = @()
  foreach ($ruta in $rutas) {
    $encontrados += Get-ChildItem -Path $ruta -ErrorAction SilentlyContinue
  }
  if ($encontrados.Count -eq 0) { return $null }

  $ordenados = $encontrados | Sort-Object -Property @{
    Expression = {
      $v = $_.Directory.Parent.Name -as [int]
      if ($null -eq $v) { 0 } else { $v }
    }
  } -Descending

  return $ordenados[0].FullName
}

# Ejecuta un programa sin que su salida pase por la tubería de PowerShell.
# En PowerShell 5.1, redirigir stderr de un .exe dentro de la tubería convierte
# cada línea en un error y pone $? a falso aunque el programa haya terminado
# bien: Start-Process con ficheros lo evita.
function Ejecutar([string] $programa, [string[]] $argumentos, [string] $ficheroError) {
  $p = Start-Process -FilePath $programa -ArgumentList $argumentos `
                     -NoNewWindow -Wait -PassThru `
                     -RedirectStandardError $ficheroError
  return $p.ExitCode
}

# Igual, pero además devuelve lo que el programa haya escrito en su salida.
function Ejecutar-Leyendo([string] $programa, [string[]] $argumentos) {
  $fSalida = Join-Path $env:TEMP ('nodo360-salida-' + [guid]::NewGuid().ToString('N') + '.txt')
  $fError  = Join-Path $env:TEMP ('nodo360-error-'  + [guid]::NewGuid().ToString('N') + '.txt')
  try {
    $p = Start-Process -FilePath $programa -ArgumentList $argumentos `
                       -NoNewWindow -Wait -PassThru `
                       -RedirectStandardOutput $fSalida -RedirectStandardError $fError
    $texto = ''
    if (Test-Path -LiteralPath $fSalida) {
      $texto = (Get-Content -LiteralPath $fSalida -Raw)
      if ($null -eq $texto) { $texto = '' }
    }
    return @{ Codigo = $p.ExitCode; Salida = $texto }
  } finally {
    foreach ($f in @($fSalida, $fError)) {
      if (Test-Path -LiteralPath $f) { Remove-Item -LiteralPath $f -Force -ErrorAction SilentlyContinue }
    }
  }
}


# ----------------------------------------------------------------------------
# 1. La cadena de conexión: se pide ahora, y no se guarda
# ----------------------------------------------------------------------------
Escribir-Titulo 'Comprobando la conexión'

# Una variable guardada de antes NO se usa: se avisa y se dice cómo quitarla.
# Se pregunta por el NOMBRE (en el registro y en la sesión), sin leer el valor.
$guardadaEnUsuario = (Get-Item 'HKCU:\Environment').GetValueNames() -contains 'NODO360_DB_URL'
$guardadaEnSesion  = Test-Path 'Env:NODO360_DB_URL'
if ($guardadaEnUsuario -or $guardadaEnSesion) {
  Write-Host ''
  Write-Host 'AVISO: hay una variable NODO360_DB_URL puesta. Este script NO la usa.' -ForegroundColor Yellow
  Write-Host ''
  Write-Host 'Con la cadena de conexión dentro, cualquier proceso de tu cuenta puede'
  Write-Host 'leerla y entrar en la base saltándose la RLS. Bórrala:'
  Write-Host ''
  if ($guardadaEnUsuario) {
    Write-Host '    [Environment]::SetEnvironmentVariable("NODO360_DB_URL", $null, "User")' -ForegroundColor Yellow
  }
  if ($guardadaEnSesion) {
    Write-Host '    Remove-Item Env:NODO360_DB_URL' -ForegroundColor Yellow
  }
  Write-Host ''
  Write-Host 'y cambia la contraseña de la base en Supabase (Project Settings ->'
  Write-Host 'Database -> Reset database password): ha estado guardada en claro.'
  Write-Host ''
}

# Solo a mano. Con la entrada redirigida no hay nadie al teclado: medido, en
# PowerShell 5.1 Read-Host -AsSecureString se queda colgado esperando. Mejor
# decirlo y parar, y que ningún otro programa pueda pasarle la cadena.
if (-not [Environment]::UserInteractive -or [Console]::IsInputRedirected) {
  Terminar-Con-Error 'Este script se ejecuta a mano, en una consola: pide la cadena de conexión con el teclado y no la acepta por una tubería.'
}

Write-Host ''
Write-Host 'Pega la cadena de conexión de Supabase (Project Settings -> Database ->'
Write-Host 'Connection string, pestaña URI). La DIRECTA o el SESSION POOLER, puerto'
Write-Host '5432; el pooler de TRANSACCIONES (6543) no sirve para pg_dump.'
Write-Host 'No se verá al pegarla, no queda en el historial y no se guarda.'
Write-Host ''

# Desde aquí, todo dentro del try: el finally del final borra la cadena, la
# clave y las variables PG*, también si algo termina con exit.
$cadena = $null
$clave = $null
$uri = $null
$codigoSalida = 0

try {

  $segura = Read-Host 'Cadena de conexión' -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($segura)
  try {
    $cadena = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  } finally {
    # La copia sin cifrar que hace falta para leerla, a ceros en cuanto se lee.
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    $segura.Dispose()
    Remove-Variable segura, bstr -ErrorAction SilentlyContinue
  }

  if ([string]::IsNullOrWhiteSpace($cadena)) {
    Terminar-Con-Error 'No se ha pegado nada.'
  }

  # El mensaje de error NO repite lo pegado: llevaría la contraseña dentro.
  $uri = $null
  if (-not [System.Uri]::TryCreate($cadena.Trim(), [System.UriKind]::Absolute, [ref] $uri)) {
    Terminar-Con-Error 'Eso no parece una cadena de conexión. Tiene que empezar por postgresql://'
  }

  if (@('postgresql', 'postgres') -notcontains $uri.Scheme) {
    Terminar-Con-Error "La cadena empieza por '$($uri.Scheme)://' y debería empezar por 'postgresql://'."
  }

  $puerto = $uri.Port
  if ($puerto -le 0) { $puerto = 5432 }

  if ($puerto -eq 6543) {
    Write-Host ''
    Write-Host 'ERROR: esa cadena es la del pooler de TRANSACCIONES (puerto 6543).' -ForegroundColor Red
    Write-Host ''
    Write-Host 'pg_dump no funciona ahí: necesita mantener una sesión y una transacción'
    Write-Host 'abiertas durante todo el volcado, y ese pooler reparte cada sentencia'
    Write-Host 'entre conexiones distintas.'
    Write-Host ''
    Write-Host 'Usa la conexión DIRECTA o el SESSION POOLER, los dos en el puerto 5432.'
    Write-Host ''
    exit 1
  }

  $usuario = ''
  $clave = ''
  if ($uri.UserInfo) {
    $corte = $uri.UserInfo.IndexOf(':')
    if ($corte -ge 0) {
      $usuario = [Uri]::UnescapeDataString($uri.UserInfo.Substring(0, $corte))
      $clave   = [Uri]::UnescapeDataString($uri.UserInfo.Substring($corte + 1))
    } else {
      $usuario = [Uri]::UnescapeDataString($uri.UserInfo)
    }
  }
  if ([string]::IsNullOrWhiteSpace($usuario)) {
    Terminar-Con-Error 'La cadena no lleva usuario. Debería ser postgresql://USUARIO:CLAVE@servidor:5432/postgres'
  }
  if ([string]::IsNullOrWhiteSpace($clave)) {
    Terminar-Con-Error 'La cadena no lleva contraseña. Cópiala otra vez de Supabase: el panel la incluye.'
  }

  $baseDatos = $uri.AbsolutePath.TrimStart('/')
  if ([string]::IsNullOrWhiteSpace($baseDatos)) { $baseDatos = 'postgres' }

  # La contraseña solo se muestra así, nunca entera.
  $claveTapada = '*' * $clave.Length
  Write-Host "  servidor : $($uri.Host):$puerto"
  Write-Host "  base     : $baseDatos"
  Write-Host "  usuario  : $usuario"
  Write-Host "  clave    : $claveTapada  ($($clave.Length) caracteres)"


  # ----------------------------------------------------------------------------
  # 2. Las herramientas
  # ----------------------------------------------------------------------------
  Escribir-Titulo 'Buscando pg_dump'

  $pgDump = Buscar-Programa 'pg_dump.exe'
  if (-not $pgDump) {
    Write-Host ''
    Write-Host 'ERROR: no encuentro pg_dump.exe.' -ForegroundColor Red
    Write-Host ''
    Write-Host 'Instala el cliente de PostgreSQL, la versión más reciente:'
    Write-Host ''
    Write-Host '    winget install PostgreSQL.PostgreSQL.18' -ForegroundColor Yellow
    Write-Host ''
    Write-Host 'o bájalo de https://www.postgresql.org/download/windows/ y en el'
    Write-Host 'instalador basta con marcar «Command Line Tools».'
    Write-Host ''
    Write-Host 'No hace falta añadirlo al PATH: este script lo busca solo en'
    Write-Host 'C:\Program Files\PostgreSQL\*\bin\.'
    Write-Host ''
    exit 1
  }

  $resultadoVersion = Ejecutar-Leyendo $pgDump @('--version')
  $versionTexto = $resultadoVersion.Salida.Trim()
  Write-Host "  $pgDump"
  Write-Host "  $versionTexto"

  $mayorCliente = 0
  if ($versionTexto -match '(\d+)\.\d+') { $mayorCliente = [int] $Matches[1] }
  elseif ($versionTexto -match '(\d+)')  { $mayorCliente = [int] $Matches[1] }

  $psql = Buscar-Programa 'psql.exe'


  # ----------------------------------------------------------------------------
  # 3. Las variables PG*, para que la contraseña no viaje en la línea de comandos
  # ----------------------------------------------------------------------------
  $modoSsl = 'require'
  if ($uri.Query -match 'sslmode=([a-z-]+)') { $modoSsl = $Matches[1] }

  $env:PGHOST            = $uri.Host
  $env:PGPORT            = "$puerto"
  $env:PGUSER            = $usuario
  $env:PGPASSWORD        = $clave
  $env:PGDATABASE        = $baseDatos
  $env:PGSSLMODE         = $modoSsl
  $env:PGCONNECT_TIMEOUT = '20'

  # Ya está en las variables PG* de este proceso, que es lo único que necesitan
  # pg_dump y psql. Ni la cadena ni la clave hacen falta más.
  $cadena = $null
  $clave = $null

  # --------------------------------------------------------------------------
  # 4. ¿Es el cliente lo bastante nuevo?
  # --------------------------------------------------------------------------
  $versionServidor = $null
  if ($psql) {
    Escribir-Titulo 'Comprobando la versión del servidor'
    $r = Ejecutar-Leyendo $psql @('--no-psqlrc', '--tuples-only', '--no-align', '--command', 'SHOW server_version')
    if ($r.Codigo -eq 0 -and $r.Salida.Trim()) {
      $versionServidor = ($r.Salida -split "`n" | Where-Object { $_.Trim() } | Select-Object -First 1).Trim()
      Write-Host "  servidor: PostgreSQL $versionServidor"
      Write-Host "  cliente : pg_dump $mayorCliente"

      $mayorServidor = 0
      if ($versionServidor -match '^(\d+)') { $mayorServidor = [int] $Matches[1] }

      if ($mayorCliente -lt $mayorServidor) {
        Write-Host ''
        Write-Host "ERROR: pg_dump es la versión $mayorCliente y el servidor la $mayorServidor." -ForegroundColor Red
        Write-Host ''
        Write-Host 'pg_dump no puede volcar un servidor más nuevo que él: el volcado'
        Write-Host 'saldría incompleto o directamente fallaría.'
        Write-Host ''
        Write-Host "Instala el cliente $mayorServidor o posterior:"
        Write-Host ''
        Write-Host "    winget install PostgreSQL.PostgreSQL.$mayorServidor" -ForegroundColor Yellow
        Write-Host ''
        exit 1
      }
      Write-Host '  el cliente es igual o más nuevo que el servidor: correcto' -ForegroundColor Green
    } else {
      Write-Host '  no he podido leer la versión del servidor; sigo adelante.' -ForegroundColor Yellow
      Write-Host '  Si pg_dump fuera más antiguo, fallará él y lo dirá.'
    }
  } else {
    Write-Host ''
    Write-Host '  psql no está instalado, así que no puedo comparar versiones.' -ForegroundColor Yellow
    Write-Host '  Si pg_dump fuera más antiguo que el servidor, fallará él y lo dirá.'
  }


  # --------------------------------------------------------------------------
  # 5. La carpeta de destino
  # --------------------------------------------------------------------------
  Escribir-Titulo 'Preparando el destino'

  $repo = Split-Path -Parent $PSScriptRoot
  $destinoCompleto = [System.IO.Path]::GetFullPath($Destino)

  # Una copia dentro del repositorio se subiría a GitHub con los datos de todo
  # el mundo dentro. Eso no se avisa: se para. Se compara con la barra final
  # para que una carpeta hermana como «...-plataforma-copias» no dé un falso
  # positivo por empezar igual.
  $repoConBarra = $repo.TrimEnd('\') + '\'
  if ($destinoCompleto.TrimEnd('\') -eq $repo.TrimEnd('\') -or
      $destinoCompleto.StartsWith($repoConBarra, [StringComparison]::OrdinalIgnoreCase)) {
    Terminar-Con-Error "El destino está DENTRO del repositorio ($destinoCompleto). Elige una carpeta fuera: -Destino C:\Users\alber\backups-nodo360"
  }

  if (-not (Test-Path -LiteralPath $destinoCompleto)) {
    New-Item -ItemType Directory -Path $destinoCompleto -Force | Out-Null
    Write-Host "  carpeta creada: $destinoCompleto"
  } else {
    Write-Host "  carpeta: $destinoCompleto"
  }

  $sello = Get-Date -Format 'yyyy-MM-dd-HHmm'
  if ($Formato -eq 'custom') { $extension = 'dump' } else { $extension = 'sql' }


  # --------------------------------------------------------------------------
  # 6. El volcado
  # --------------------------------------------------------------------------
  Escribir-Titulo 'Volcando'

  # De más completo a menos. El primero que salga bien, gana. auth es el que
  # importa: son las cuentas.
  if ($SoloPublic) {
    $intentos = @(
      @{ Nombre = 'solo public'; Esquemas = @('public'); Sufijo = '-solo-public' }
    )
  } else {
    $intentos = @(
      @{ Nombre = 'public + auth + storage'; Esquemas = @('public', 'auth', 'storage'); Sufijo = '' },
      @{ Nombre = 'public + auth';           Esquemas = @('public', 'auth');            Sufijo = '-sin-storage' },
      @{ Nombre = 'solo public';             Esquemas = @('public');                    Sufijo = '-solo-public' }
    )
  }

  $ficheroFinal = $null
  $esquemasHechos = $null
  $ficheroError = Join-Path $env:TEMP "nodo360-pgdump-$sello.err"

  foreach ($intento in $intentos) {
    $parcial = Join-Path $destinoCompleto "nodo360-$sello$($intento.Sufijo).$extension.parcial"

    Write-Host ''
    Write-Host "  intento: $($intento.Nombre)"

    # Sin --verbose: su progreso va a stderr y taparía el error de verdad en el
    # fichero de errores, que es lo que se muestra si falla.
    $argumentos = @("--format=$Formato", "--file=$parcial")
    foreach ($e in $intento.Esquemas) { $argumentos += "--schema=$e" }

    if (Test-Path -LiteralPath $parcial) { Remove-Item -LiteralPath $parcial -Force }

    $codigo = Ejecutar $pgDump $argumentos $ficheroError

    if ($codigo -eq 0) {
      $ficheroFinal = Join-Path $destinoCompleto "nodo360-$sello$($intento.Sufijo).$extension"
      if (Test-Path -LiteralPath $ficheroFinal) { Remove-Item -LiteralPath $ficheroFinal -Force }
      Rename-Item -LiteralPath $parcial -NewName (Split-Path -Leaf $ficheroFinal)
      $esquemasHechos = $intento.Esquemas
      Write-Host "  correcto: $($intento.Nombre)" -ForegroundColor Green
      break
    }

    # No se deja un fichero a medias con nombre de copia buena.
    if (Test-Path -LiteralPath $parcial) { Remove-Item -LiteralPath $parcial -Force }

    Write-Host "  ha fallado ($($intento.Nombre)), código $codigo" -ForegroundColor Yellow
    if (Test-Path -LiteralPath $ficheroError) {
      $lineas = Get-Content -LiteralPath $ficheroError -Tail 6
      foreach ($l in $lineas) { Write-Host "      $l" -ForegroundColor DarkGray }
    }
  }

  if (-not $ficheroFinal) {
    Write-Host ''
    Write-Host 'ERROR: pg_dump ha fallado en todos los intentos. NO hay copia.' -ForegroundColor Red
    Write-Host ''
    Write-Host 'No se ha dejado ningún fichero: un volcado a medias es peor que'
    Write-Host 'ninguno, porque parece una copia.'
    Write-Host ''
    if (Test-Path -LiteralPath $ficheroError) {
      Write-Host "El detalle completo está en:"
      Write-Host "  $ficheroError"
      Write-Host ''
      Write-Host 'Lo más habitual:'
      Write-Host '  - password authentication failed    -> si la contraseña lleva @ : / ? # o %,'
      Write-Host '                                         hay que codificarla en la URL (@ es %40)'
      Write-Host '  - no se puede conectar              -> ¿es la directa o el pooler de SESIÓN,'
      Write-Host '                                         puerto 5432? El 6543 no sirve'
      Write-Host '  - permission denied for schema auth -> ejecútalo con -SoloPublic'
      Write-Host '  - server version mismatch           -> instala un cliente más nuevo'
      Write-Host ''
    }
    $codigoSalida = 1
    exit 1
  }

  if ($esquemasHechos.Count -eq 1) {
    Write-Host ''
    Write-Host '  AVISO: solo se ha podido volcar el esquema public.' -ForegroundColor Yellow
    Write-Host '  auth.users, es decir LAS CUENTAS, NO están en esta copia. Restaurarla'
    Write-Host '  devuelve el contenido y el progreso, pero nadie podría iniciar sesión.'
  }


  # --------------------------------------------------------------------------
  # 7. ¿Es una copia de verdad?
  # --------------------------------------------------------------------------
  Escribir-Titulo 'Comprobando el volcado'

  $info = Get-Item -LiteralPath $ficheroFinal
  $megas = [math]::Round($info.Length / 1MB, 2)
  Write-Host "  fichero: $($info.Name)"
  Write-Host "  tamaño : $megas MB ($($info.Length) bytes)"

  if ($info.Length -eq 0) {
    Remove-Item -LiteralPath $ficheroFinal -Force
    Terminar-Con-Error 'El volcado ha salido vacío. Se ha borrado para que no se confunda con una copia.'
  }

  # Con qué se mira dentro: del .dump hay que pedirle el índice a pg_restore;
  # el .sql se recorre con Select-String, que lo lee por líneas y no se lo carga
  # entero en memoria por grande que sea.
  $tocTexto = $null
  $puedoMirar = $true

  if ($Formato -eq 'custom') {
    $pgRestore = Buscar-Programa 'pg_restore.exe'
    if ($pgRestore) {
      $indice = Ejecutar-Leyendo $pgRestore @('--list', $ficheroFinal)
      if ($indice.Codigo -eq 0) {
        $tocTexto = $indice.Salida
      } else {
        $puedoMirar = $false
        Write-Host '  pg_restore no ha podido leer el .dump.' -ForegroundColor Yellow
      }
    } else {
      $puedoMirar = $false
      Write-Host '  pg_restore no está instalado: no puedo mirar dentro del .dump.' -ForegroundColor Yellow
    }
  }

  $Contiene = {
    param([string] $patron)
    if ($null -ne $tocTexto) { return [bool]($tocTexto -match $patron) }
    return [bool](Select-String -LiteralPath $ficheroFinal -Pattern $patron -Quiet)
  }

  if ($puedoMirar) {
    $faltan = @()
    foreach ($t in $TABLAS_IMPRESCINDIBLES) {
      # El .sql dice «CREATE TABLE public.users (»; el índice del .dump, «TABLE public users».
      $patron = "(CREATE TABLE (IF NOT EXISTS )?public\.$t\b|TABLE public $t\b|TABLE DATA public $t\b)"
      if (-not (& $Contiene $patron)) { $faltan += $t }
    }

    foreach ($t in $TABLAS_IMPRESCINDIBLES) {
      if ($faltan -contains $t) {
        Write-Host "    FALTA  public.$t" -ForegroundColor Red
      } else {
        Write-Host "    ok     public.$t" -ForegroundColor DarkGray
      }
    }

    if (& $Contiene '(CREATE TABLE (IF NOT EXISTS )?auth\.users\b|TABLE auth users\b|TABLE DATA auth users\b)') {
      Write-Host '    ok     auth.users (las cuentas)' -ForegroundColor Green
    } else {
      Write-Host '    NO     auth.users: esta copia no devuelve el acceso de nadie' -ForegroundColor Yellow
    }

    if ($faltan.Count -gt 0) {
      $sospechoso = Join-Path $destinoCompleto "SOSPECHOSA-$($info.Name)"
      Rename-Item -LiteralPath $ficheroFinal -NewName (Split-Path -Leaf $sospechoso)
      Write-Host ''
      Write-Host "ERROR: al volcado le faltan tablas imprescindibles: $($faltan -join ', ')" -ForegroundColor Red
      Write-Host ''
      Write-Host 'NO es una copia válida. Se ha renombrado para que no se confunda'
      Write-Host 'con una buena, pero no se ha borrado por si quieres mirarla:'
      Write-Host "  $sospechoso"
      Write-Host ''
      $codigoSalida = 1
      exit 1
    }

    if ($Formato -ne 'custom') {
      $conDatos = @(Select-String -LiteralPath $ficheroFinal -Pattern '^COPY ').Count
      Write-Host "  tablas con datos: $conDatos bloques COPY"
    }
  }

  $huella = (Get-FileHash -LiteralPath $ficheroFinal -Algorithm SHA256).Hash


  # --------------------------------------------------------------------------
  # 8. La ficha, al lado del volcado
  # --------------------------------------------------------------------------
  $ficha = [System.IO.Path]::ChangeExtension($ficheroFinal, 'txt')
  $servidorFicha = $versionServidor
  if (-not $servidorFicha) { $servidorFicha = 'no comprobada (psql no disponible)' }

  $lineasFicha = @(
    'Copia de seguridad de Nodo360',
    '',
    "fecha              : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')",
    "servidor           : $($uri.Host):$puerto  base $baseDatos",
    "version servidor   : $servidorFicha",
    "cliente            : $versionTexto",
    "esquemas           : $($esquemasHechos -join ', ')",
    "formato            : $Formato",
    "fichero            : $(Split-Path -Leaf $ficheroFinal)",
    "tamano             : $($info.Length) bytes ($megas MB)",
    "SHA256             : $huella",
    '',
    'NO incluye los ficheros de Storage: solo las filas de storage.objects.',
    'NO incluye los esquemas internos de Supabase (extensions, realtime,',
    'vault, graphql): un proyecto nuevo los crea por su cuenta.'
  )
  Set-Content -LiteralPath $ficha -Value $lineasFicha -Encoding UTF8


  # --------------------------------------------------------------------------
  # 9. Hecho
  # --------------------------------------------------------------------------
  Escribir-Titulo 'Copia terminada'
  Write-Host "  $ficheroFinal" -ForegroundColor Green
  Write-Host "  $megas MB   ·   SHA256 $($huella.Substring(0, 16))..."
  Write-Host "  ficha: $(Split-Path -Leaf $ficha)"
  Write-Host ''
  Write-Host '  ESTE SCRIPT NO RESTAURA NADA. Para restaurar, en un proyecto NUEVO' -ForegroundColor Cyan
  Write-Host '  de Supabase y con su cadena de conexión en otra variable:'
  Write-Host ''
  if ($Formato -eq 'custom') {
    Write-Host '    $env:PGPASSWORD = "clave-del-proyecto-nuevo"' -ForegroundColor Yellow
    Write-Host "    pg_restore --host=... --username=postgres --dbname=postgres ``" -ForegroundColor Yellow
    Write-Host "               --no-owner --clean --if-exists ``" -ForegroundColor Yellow
    Write-Host "               `"$ficheroFinal`"" -ForegroundColor Yellow
  } else {
    Write-Host '    $env:PGPASSWORD = "clave-del-proyecto-nuevo"' -ForegroundColor Yellow
    Write-Host "    psql --host=... --username=postgres --dbname=postgres ``" -ForegroundColor Yellow
    Write-Host "         --file=`"$ficheroFinal`"" -ForegroundColor Yellow
  }
  Write-Host ''
  Write-Host '  Saldrán errores de «role does not exist» y de propietarios: son'
  Write-Host '  normales, los roles del proyecto viejo no existen en el nuevo.'
  Write-Host '  Lo que NO es normal es un error sobre una tabla de public.'
  Write-Host ''

} finally {
  # La contraseña no se queda en el proceso, termine como termine: también con
  # exit, con un error o con Ctrl+C.
  #
  # Borra las PG* sin mirar si ya estaban antes, y es a propósito: el script se
  # ejecuta con powershell -File, en un proceso aparte, así que lo que borra es
  # suyo y no toca la sesión de quien lo llama. Si alguien lo lanzara con
  # .\scripts\copia-de-seguridad.ps1 desde una sesión con PGHOST o PGPASSWORD
  # puestas, sí se las borraría: por eso los ejemplos de arriba lo lanzan con
  # -File.
  foreach ($v in @('PGPASSWORD', 'PGHOST', 'PGPORT', 'PGUSER', 'PGDATABASE', 'PGSSLMODE', 'PGCONNECT_TIMEOUT')) {
    if (Test-Path "Env:$v") { Remove-Item "Env:$v" -ErrorAction SilentlyContinue }
  }
  $cadena = $null
  $clave = $null
  $claveTapada = $null
  $uri = $null
  Remove-Variable cadena, clave, claveTapada, uri -ErrorAction SilentlyContinue
}

exit $codigoSalida
