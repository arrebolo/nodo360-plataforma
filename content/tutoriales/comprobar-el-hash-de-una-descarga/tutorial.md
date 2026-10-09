---
titulo: Comprobar el hash SHA-256 de una descarga
resumen: Comprueba que el archivo que has descargado es idéntico al que publicó su autor, comparando su hash SHA-256 con la lista oficial. Sin instalar nada.
categoria: verificacion
nivel: beginner
duracionMinutos: 10
sistemas: [windows, macos, linux]
red: ninguna
requisitos:
  - texto: Un equipo con Windows, macOS o Linux y conexión a internet
  - texto: Espacio en disco para un archivo de menos de 100 MB
programas:
  - nombre: Bitcoin Core
    version: "31.1"
    descargaOficial: https://bitcoincore.org/en/download/
    repositorio: https://github.com/bitcoin/bitcoin
cursos:
  - curso: seguridad-basica-en-bitcoin-y-criptomonedas
terminos: [hash, criptografia]
estado: borrador
---

## Qué vas a conseguir

Comprobar que un archivo que has descargado es exactamente el que publicó su autor, byte a byte. Lo harás calculando su :termino[hash]{slug="hash"} SHA-256 y buscándolo en la lista de hashes que publica el propio proyecto.

Un hash es una huella de 64 caracteres que se calcula a partir del contenido del archivo. Si cambia un solo byte, la huella sale completamente distinta. Por eso, si tu hash coincide con el de la lista, el archivo no se ha dañado durante la descarga ni se ha cambiado por otro por el camino.

Este tutorial no instala nada: solo descarga dos archivos y los compara.

## Por qué este archivo de ejemplo

Como ejemplo se usa el instalador de **Bitcoin Core**, el programa de referencia de Bitcoin, porque su web oficial publica junto a cada versión un archivo, `SHA256SUMS`, con el hash de cada descarga. El método es el mismo para cualquier programa que publique sus hashes: solo cambian el nombre del archivo y el de la lista.

## Paso 1: Descarga el programa desde su web oficial

1. Abre el navegador y escribe a mano la dirección **bitcoincore.org**. No llegues desde un anuncio ni desde un enlace de un buscador: las webs falsas de descarga suelen aparecer así.
2. Entra en **«Download»** (descargar), o ve directamente a [bitcoincore.org/en/download](https://bitcoincore.org/en/download/).
3. Descarga el archivo de tu sistema:

:::sistema{so="windows"}
El instalador para Windows: **`bitcoin-31.1-win64-setup.exe`**.
:::

:::sistema{so="macos"}
El archivo `.zip` para macOS que corresponda a tu procesador: **`arm64`** si tu Mac tiene un chip Apple (M1 o posterior) o **`x86_64`** si tiene un procesador Intel.
:::

:::sistema{so="linux"}
El archivo `.tar.gz` para tu procesador. En la mayoría de los equipos de escritorio es **`bitcoin-31.1-x86_64-linux-gnu.tar.gz`**.
:::

![Página de descarga de bitcoincore.org con el enlace del instalador de Windows recuadrado en rojo](01-pagina-de-descarga.webp)

:::deberias-ver
El archivo empieza a descargarse y, al terminar, el navegador lo muestra en su lista de descargas.
:::

## Paso 2: Descarga la lista de hashes

En la misma página, busca el enlace al archivo **`SHA256SUMS`**. Es un archivo de texto con una línea por cada descarga de esa versión: el hash y, a continuación, el nombre del archivo.

1. Haz clic derecho sobre el enlace **`SHA256SUMS`**.
2. Elige **«Guardar vínculo como»** (o **«Guardar enlace como»**, según el navegador) y guárdalo en la misma carpeta que el instalador.

:::aviso{tipo="nota"}
Si haces clic normal, el navegador abre la lista como una página de texto en lugar de guardarla. Vuelve atrás y usa el clic derecho. No hace falta el archivo `SHA256SUMS.asc`: es la firma de la lista, y se usa para otra comprobación.
:::

![Menú contextual del navegador sobre el enlace SHA256SUMS, con la opción «Guardar vínculo como» recuadrada en rojo](02-guardar-sha256sums.webp)

:::deberias-ver
Un segundo archivo en tu lista de descargas, llamado `SHA256SUMS`. Algunos navegadores lo guardan como `SHA256SUMS.txt`; también sirve.
:::

## Paso 3: Comprueba que los dos archivos están juntos

Abre tu carpeta de descargas.

![Explorador de archivos de Windows en la carpeta Descargas, con el instalador de Bitcoin Core y el archivo SHA256SUMS como únicos archivos](03-carpeta-descargas.webp)

:::deberias-ver
Los dos archivos en la misma carpeta: el instalador y `SHA256SUMS`.
:::

## Paso 4: Calcula el hash del archivo descargado

Abre una terminal y entra en la carpeta de descargas.

:::sistema{so="windows"}
Abre el menú Inicio, escribe **PowerShell** y abre **Windows PowerShell**. Después escribe:

```powershell
cd $HOME\Downloads
(Get-FileHash .\bitcoin-31.1-win64-setup.exe).Hash
```

Aunque el Explorador la llame «Descargas», la carpeta se llama `Downloads` por dentro, y es la que usa el comando.
:::

:::sistema{so="macos"}
Abre **Terminal** (en Aplicaciones → Utilidades) y escribe, cambiando el nombre por el del archivo que has descargado:

```bash
cd ~/Downloads
shasum -a 256 bitcoin-31.1-arm64-apple-darwin.zip
```
:::

:::sistema{so="linux"}
Abre una terminal y escribe:

```bash
cd ~/Descargas
sha256sum bitcoin-31.1-x86_64-linux-gnu.tar.gz
```

Si tu sistema está en inglés, la carpeta es `~/Downloads`.
:::

![Windows PowerShell con el hash SHA-256 del instalador calculado en una sola línea de 64 caracteres](04-hash-calculado.webp)

:::deberias-ver
Una línea de 64 caracteres, solo con números y letras de la A a la F. Es el hash de tu archivo. Todavía no sabes si es el bueno: eso es el paso siguiente.
:::

## Paso 5: Busca ese hash en la lista oficial

Ahora hay que comprobar que el hash de tu archivo es uno de los que publica el proyecto. No lo compares a ojo: deja que lo compare el equipo.

:::sistema{so="windows"}
```powershell
Select-String -Path .\SHA256SUMS* -Pattern (Get-FileHash .\bitcoin-31.1-win64-setup.exe).Hash
```

Si coincide, PowerShell muestra la línea de la lista donde está ese hash:

```salida
SHA256SUMS:NN:<el hash, en minúsculas>  bitcoin-31.1-win64-setup.exe
```

`NN` es el número de línea dentro de la lista. Si no coincide, **no sale nada**.
:::

:::sistema{so="macos"}
```bash
shasum -a 256 --ignore-missing --check SHA256SUMS
```

```salida
bitcoin-31.1-arm64-apple-darwin.zip: OK
```
:::

:::sistema{so="linux"}
```bash
sha256sum --ignore-missing --check SHA256SUMS
```

```salida
bitcoin-31.1-x86_64-linux-gnu.tar.gz: OK
```
:::

![Windows PowerShell mostrando la línea de SHA256SUMS que contiene el hash del instalador, con el nombre del archivo recuadrado en rojo](05-coincide.webp)

:::deberias-ver
En Windows, una línea que termina con el **nombre exacto del archivo que descargaste**. En macOS y Linux, el nombre del archivo seguido de **`OK`**.

Si sale el nombre de otro archivo, no coincide: estás comparando con una línea que no es la tuya.
:::

:::aviso{tipo="si-falla" titulo="Si no coincide"}
**No abras ni instales el archivo.** Bórralo y vuelve a descargarlo desde la web oficial, escribiendo tú la dirección. Si después de descargarlo otra vez sigue sin coincidir, no lo uses.

En Windows, que no salga nada también puede querer decir que `SHA256SUMS` no está en la carpeta: vuelve al paso 3.
:::

## Problemas frecuentes

**PowerShell dice «No se encuentra la ruta de acceso '…' porque no existe».** El nombre del archivo del comando no es exactamente el del archivo descargado, o no estás en la carpeta de descargas. Comprueba el nombre en el Explorador (incluida la versión) y vuelve a escribir el `cd` del paso 4.

**Linux dice «no file was verified»** (o lo mismo traducido, si el sistema está en español). En la carpeta no hay ningún archivo de la lista: o estás en otra carpeta, o el archivo descargado tiene otro nombre (por ejemplo, con un `(1)` añadido por el navegador al descargarlo dos veces).

**Linux dice «FAILED» y «computed checksum did NOT match»** (o lo mismo traducido). El hash no coincide. Sigue las instrucciones de «Si no coincide».

## Lo que esta comprobación no demuestra

Que el hash coincida demuestra que tu archivo es idéntico al que aparece en la lista. **No demuestra que la lista sea auténtica.** El instalador y `SHA256SUMS` vienen de la misma web: si alguien tomara el control de esa web, podría cambiar los dos a la vez y seguirían coincidiendo.

Para eso existe la firma de la lista, el archivo `SHA256SUMS.asc`: permite comprobar que la lista la publicaron los desarrolladores que dicen haberla publicado. Antes de instalar un programa que vaya a guardar claves o monedas, comprueba también la firma.
