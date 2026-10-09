---
titulo: Verificar la firma PGP de una descarga con GnuPG
resumen: Comprueba con GnuPG que la lista de hashes de una descarga la firmaron sus desarrolladores, y no solo que el archivo coincide con ella. En Windows.
categoria: verificacion
nivel: beginner
duracionMinutos: 20
sistemas: [windows]
red: ninguna
requisitos:
  - tutorial: comprobar-el-hash-de-una-descarga
  - texto: Windows 10 u 11 y permiso para instalar programas en el equipo
  - texto: El instalador de Bitcoin Core y el archivo SHA256SUMS del tutorial anterior, en tu carpeta de descargas
programas:
  - nombre: Gpg4win
    version: "5.1.1"
    descargaOficial: https://www.gpg4win.org/download.html
    repositorio: https://git.gnupg.org/cgi-bin/gitweb.cgi?p=gpg4win.git;a=summary
  - nombre: Bitcoin Core
    version: "31.1"
    descargaOficial: https://bitcoincore.org/en/download/
    repositorio: https://github.com/bitcoin/bitcoin
cursos:
  - curso: seguridad-basica-en-bitcoin-y-criptomonedas
terminos: [clave-publica, clave-privada, criptografia, hash]
estado: borrador
---

## Qué vas a conseguir

Comprobar que la lista de hashes de una descarga la firmaron de verdad sus desarrolladores. Lo harás con GnuPG, verificando la firma del archivo `SHA256SUMS` de Bitcoin Core con las claves públicas de quienes lo publican.

En el :tutorial[tutorial anterior]{slug="comprobar-el-hash-de-una-descarga"} comprobaste que tu instalador es idéntico al que aparece en `SHA256SUMS`. Pero el instalador y la lista venían de la misma web: si alguien la controlara, podría cambiar los dos. La firma cierra ese hueco. Solo puede crearla quien tiene la :termino[clave privada]{slug="clave-privada"} del desarrollador, y cualquiera puede comprobarla con su :termino[clave pública]{slug="clave-publica"}.

## Por qué este programa

Para comprobar firmas PGP se usa **GnuPG**, y en Windows se instala con **Gpg4win**, la distribución de GnuPG para Windows que mantienen los propios desarrolladores de GnuPG:

- Es de código abierto, con el repositorio público.
- Publica el hash SHA-256 de cada instalador, y los instaladores van firmados.
- Su última versión, la 5.1.1, es del 23 de septiembre de 2026.
- No pide crear ninguna cuenta.
- No tiene programa de afiliados.

Es también la herramienta que indica la página de descarga de Bitcoin Core para verificar sus firmas.

## Con qué otros se hace lo mismo

- **GnuPG desde gnupg.org**: el mismo programa, en un instalador que trae solo la línea de comandos, sin las herramientas gráficas de Gpg4win. Los comandos de este tutorial son los mismos.

## Paso 1: Descarga Gpg4win y comprueba su hash

1. Escribe a mano la dirección **gpg4win.org** y entra en **«Download»** (descargar), o ve directamente a [gpg4win.org/download.html](https://www.gpg4win.org/download.html).
2. Descarga el instalador: **`gpg4win-5.1.1.exe`**.
3. Abre **Windows PowerShell** (menú Inicio, escribe **PowerShell**) y escribe:

```powershell
cd $HOME\Downloads
(Get-FileHash .\gpg4win-5.1.1.exe).Hash -eq 'ed19c0c89ec42fe32c52a7abd6e3da5f491752700546b9eed7ddf82fd303cddf'
```

Ese valor largo es el hash SHA-256 que publica Gpg4win para esta versión en su página [de integridad de los paquetes](https://www.gpg4win.org/package-integrity.html). Compruébalo allí: es la misma comprobación del tutorial anterior, con el hash de la web en lugar de un archivo `SHA256SUMS`.

```salida
True
```

:::deberias-ver
**`True`**. Si sale `False`, el archivo no es el que publicó Gpg4win: bórralo y vuelve a descargarlo.
:::

:::aviso{tipo="nota"}
El instalador de Gpg4win tiene también su propia firma PGP, pero para comprobarla hace falta GnuPG, que todavía no tienes. Por eso aquí basta con el hash, y en el resto del tutorial ya usarás GnuPG para comprobar firmas.
:::

## Paso 2: Instala Gpg4win

1. Haz doble clic en **`gpg4win-5.1.1.exe`**.
2. Windows pide permiso para que el programa haga cambios en el equipo. Comprueba que el editor que aparece es **g10 Code GmbH**, la empresa que desarrolla GnuPG, y acepta.
3. Sigue el instalador con las opciones que trae marcadas.

:::deberias-ver
El instalador termina sin errores y en el menú Inicio aparece **Kleopatra**, la herramienta gráfica de Gpg4win. En este tutorial no se usa: todo se hace desde PowerShell.
:::

## Paso 3: Comprueba que GnuPG funciona

**Cierra PowerShell y ábrelo de nuevo.** La ventana que estaba abierta antes de instalar no encuentra el programa nuevo. Después escribe:

```powershell
gpg --version
```

```salida
gpg (GnuPG) 2.…
```

:::deberias-ver
Una primera línea que empieza por **`gpg (GnuPG)`** seguida del número de versión, y debajo varias líneas más con la información del programa.
:::

## Paso 4: Descarga la firma de la lista

En la [página de descarga de Bitcoin Core](https://bitcoincore.org/en/download/), haz clic derecho sobre el enlace **`SHA256SUMS.asc`** y elige **«Guardar vínculo como»**. Guárdalo en tu carpeta de descargas, junto al instalador y a `SHA256SUMS`.

`SHA256SUMS.asc` no es otra lista: contiene las firmas de `SHA256SUMS`, una por cada desarrollador que la ha firmado.

![Explorador de archivos de Windows en la carpeta Descargas con el instalador de Bitcoin Core, SHA256SUMS y SHA256SUMS.asc](01-tres-archivos.webp)

:::deberias-ver
Tres archivos de Bitcoin Core en la carpeta de descargas: el instalador, `SHA256SUMS` y `SHA256SUMS.asc`.
:::

## Paso 5: Descarga las claves públicas de los desarrolladores

Para comprobar una firma necesitas la clave pública de quien firmó. Las de los desarrolladores que firman Bitcoin Core se publican en un repositorio aparte, en GitHub, no en la web de descarga.

1. Ve a [github.com/bitcoin-core/guix.sigs](https://github.com/bitcoin-core/guix.sigs).
2. Pulsa el botón verde **«Code»** y después **«Download ZIP»** (descargar ZIP). Se descarga `guix.sigs-main.zip`, de unos 7 MB, en tu carpeta de descargas.

![Página del repositorio guix.sigs en GitHub con el menú del botón Code abierto y la opción Download ZIP recuadrada en rojo](02-descargar-zip.webp)

3. En PowerShell, descomprímelo y añade las claves a GnuPG:

```powershell
cd $HOME\Downloads
Expand-Archive .\guix.sigs-main.zip -DestinationPath .
gpg --import (Get-ChildItem .\guix.sigs-main\builder-keys\*.gpg).FullName
```

No descomprimas el ZIP desde el Explorador: crea una carpeta dentro de otra y el último comando no encontraría las claves.

:::deberias-ver
Una lista de nombres de desarrolladores con sus claves y, al final, un resumen con el número de claves procesadas e importadas, unas 40. Puede salir también un aviso de que no hay ninguna clave de confianza absoluta: es normal, porque todavía no has marcado ninguna como tuya.
:::

## Paso 6: Verifica la firma de la lista

```powershell
gpg --verify --status-fd 1 SHA256SUMS.asc SHA256SUMS 2>$null | Select-String 'GOODSIG|BADSIG'
```

El comando comprueba todas las firmas de `SHA256SUMS.asc` y muestra una línea por firma, con el nombre de quien firmó: `GOODSIG` si la firma es correcta y `BADSIG` si no corresponde a la lista. Esas dos palabras salen siempre en inglés, tengas GnuPG en el idioma que tengas.

```salida
[GNUPG:] GOODSIG 17565732E08E5E41 Ava Chow <me@achow101.com>
[GNUPG:] GOODSIG 2EEB9F5CC09526C1 Michael Ford (bitcoin-otc) <fanquake@gmail.com>
[GNUPG:] GOODSIG 410108112E7EA81F Hennadii Stepanov (GitHub key) <32963518+hebasto@users.noreply.github.com>
…
```

![Windows PowerShell con varias líneas GOODSIG, una por cada desarrollador cuya firma es correcta](03-firmas-correctas.webp)

:::deberias-ver
**Varias líneas que empiezan por `[GNUPG:] GOODSIG`**, cada una con un nombre distinto, y **ninguna con `BADSIG`**. Con Bitcoin Core 31.1 salen 11.
:::

:::aviso{tipo="si-falla" titulo="Si sale BADSIG o no sale nada"}
Si aparece alguna línea con `BADSIG`, esa firma no corresponde a la lista que tienes: **no instales el programa**. Bórralo junto con `SHA256SUMS` y `SHA256SUMS.asc`, y vuelve a descargarlos desde la web oficial.

Si no sale ninguna línea, revisa «Problemas frecuentes».
:::

## Comprueba que ha funcionado

Ahora tienes las dos comprobaciones juntas:

1. **La firma**: varios desarrolladores, cada uno con su propia clave, firmaron `SHA256SUMS` tal como lo tienes (paso 6).
2. **El hash**: tu instalador es el que aparece en esa lista (paso 5 del :tutorial[tutorial anterior]{slug="comprobar-el-hash-de-una-descarga"}).

Si las dos salen bien, el instalador es el que publicaron los desarrolladores de Bitcoin Core.

## Problemas frecuentes

**PowerShell dice «El término 'gpg' no se reconoce como nombre de un cmdlet, función, archivo de script o programa ejecutable».** La ventana de PowerShell estaba abierta antes de instalar Gpg4win. Ciérrala y abre otra. Si sigue pasando, vuelve a ejecutar el instalador del paso 2.

**El comando del paso 6 no muestra nada.** Ejecuta la verificación sin filtrar, y GnuPG muestra la salida completa, que dice qué pasa:

```powershell
gpg --verify SHA256SUMS.asc SHA256SUMS
```


- Si dice que no puede comprobar la firma porque no tiene la clave pública, no se importaron las claves: vuelve al paso 5.
- Si dice que no puede abrir los datos firmados, `SHA256SUMS` no está en la carpeta en la que estás, o se guardó con otro nombre (por ejemplo, `SHA256SUMS.txt`). En ese caso, cambia el nombre en el comando.

## Lo que esta comprobación no demuestra

**Que las claves sean de quien dicen ser.** Con la salida completa, GnuPG avisa de que las claves no están certificadas con una firma de confianza. Quiere decir que tú no has comprobado personalmente que cada clave pertenezca a esa persona. Lo que sí sabes es que las claves vienen de un sitio distinto del instalador (GitHub y no bitcoincore.org), y que varias personas, cada una con su clave, firmaron la misma lista. Para engañarte, alguien tendría que controlar los dos sitios a la vez.

**Que el programa esté libre de errores.** La firma demuestra quién publicó el archivo, no que el programa haga bien lo que promete.
