---
titulo: Instalar una cartera de escritorio verificada y crearla en signet
resumen: Descarga Sparrow Wallet, verifica su firma y su hash, instálalo y crea tu primera cartera en signet, la red de pruebas de Bitcoin. En Windows.
categoria: carteras
nivel: beginner
duracionMinutos: 20
sistemas: [windows]
red: signet
requisitos:
  - tutorial: verificar-la-firma-de-una-descarga
  - texto: Gpg4win instalado, del tutorial anterior
  - texto: Papel y bolígrafo
programas:
  - nombre: Sparrow Wallet
    version: "2.5.5"
    descargaOficial: https://sparrowwallet.com/download/
    repositorio: https://github.com/sparrowwallet/sparrow
cursos:
  - curso: como-funciona-bitcoin-nivel-basico
terminos: [wallet, seed-phrase, clave-privada, hot-wallet]
estado: borrador
---

## Qué vas a conseguir

Instalar una :termino[cartera]{slug="wallet"} de Bitcoin en tu equipo después de comprobar que el instalador es el auténtico, y crear con ella una cartera en **signet**, la red de pruebas de Bitcoin. Las monedas de signet no tienen valor, así que puedes practicar sin arriesgar dinero.

Terminarás con una cartera vacía, su :termino[seed phrase]{slug="seed-phrase"} apuntada en papel y una dirección para recibir monedas de prueba.

## Por qué este programa

Este tutorial se hace con **Sparrow Wallet**:

- Es de código abierto, con el repositorio público.
- Publica el hash de cada descarga en una lista firmada con la clave PGP de su desarrollador.
- Su última versión, la 2.5.5, es del 17 de septiembre de 2026.
- Las claves se generan y se guardan en tu equipo. No pide crear ninguna cuenta.
- Funciona en signet. En la versión 2.5.5 lo hace desde su propio menú (**«Tools» → «Restart In» → «Signet»**) y trae configurado un servidor público de signet para conectarse.
- No tiene programa de afiliados.

## Con qué otros se hace lo mismo

- **Bitcoin Core**: la cartera del programa de referencia. Funciona en signet si se arranca con la opción `-signet`, pero antes tiene que descargar y comprobar la cadena de bloques entera de signet, y eso no cabe en 20 minutos; por eso tiene su propio tutorial, en el que sincronizar es el objetivo.
- **Electrum**: funciona en signet si se arranca con la opción `--signet`.

## Paso 1: Descarga el instalador y los archivos de verificación

1. Escribe a mano la dirección **sparrowwallet.com** y entra en **«Download»** (descargar), o ve directamente a [sparrowwallet.com/download](https://sparrowwallet.com/download/).
2. En la parte de Windows, descarga el instalador **`Sparrow-2.5.5.msi`**, de casi 100 MB.
3. Descarga también, con clic derecho y **«Guardar vínculo como»**:
   - **`sparrow-2.5.5-manifest.txt`**: la lista con el hash de cada descarga;
   - **`sparrow-2.5.5-manifest.txt.asc`**: la firma de esa lista;
   - **`pgp_keys.asc`**: la clave pública del desarrollador, Craig Raw. La página la enlaza en sus instrucciones de verificación, y está en [keybase.io/craigraw](https://keybase.io/craigraw/pgp_keys.asc).

![Página de descarga de Sparrow Wallet con el instalador de Windows y los enlaces del manifiesto y su firma recuadrados en rojo](01-pagina-de-descarga.webp)

:::deberias-ver
Cuatro archivos nuevos en tu carpeta de descargas: `Sparrow-2.5.5.msi`, `sparrow-2.5.5-manifest.txt`, `sparrow-2.5.5-manifest.txt.asc` y `pgp_keys.asc`.
:::

## Paso 2: Importa la clave del desarrollador

Abre **Windows PowerShell** y escribe:

```powershell
cd $HOME\Downloads
gpg --import .\pgp_keys.asc
```

:::deberias-ver
Una línea que dice que se ha importado la clave pública de **`Craig Raw <craig@sparrowwallet.com>`**, y un resumen con una clave procesada.
:::

## Paso 3: Verifica la firma de la lista

```powershell
gpg --verify --status-fd 1 sparrow-2.5.5-manifest.txt.asc sparrow-2.5.5-manifest.txt 2>$null | Select-String 'GOODSIG|BADSIG|VALIDSIG D4D0D3202FC06849A257B38DE94618334C674B40'
```

El número largo del final es la **huella** de la clave de Craig Raw: la que publica Sparrow en su página de descarga. Compruébalo allí. El comando solo muestra la línea `VALIDSIG` si la lista la firmó la clave con esa huella.

```salida
[GNUPG:] GOODSIG E94618334C674B40 Craig Raw <craig@sparrowwallet.com>
[GNUPG:] VALIDSIG D4D0D3202FC06849A257B38DE94618334C674B40 2026-09-17 …
```

![Windows PowerShell con las líneas GOODSIG y VALIDSIG de la firma de la lista de Sparrow](02-firma-correcta.webp)

:::deberias-ver
**Dos líneas**: una con `GOODSIG` y el nombre de Craig Raw, y otra con `VALIDSIG` y la huella completa.
:::

:::aviso{tipo="si-falla" titulo="Si sale BADSIG o falta una de las dos líneas"}
Con `BADSIG`, la lista no es la que firmó Craig Raw. Sin la línea `VALIDSIG`, la firma es de otra clave. En los dos casos, **no instales el programa**: borra los archivos y vuelve a descargarlos desde la web oficial.
:::

## Paso 4: Comprueba el hash del instalador

```powershell
Select-String -Path .\sparrow-2.5.5-manifest.txt -Pattern (Get-FileHash .\Sparrow-2.5.5.msi).Hash
```

```salida
sparrow-2.5.5-manifest.txt:3:0256eb5c8808157f811d57fbdb9f9153101b02947c2f6788f1e7b9da5ff6111f *Sparrow-2.5.5.msi
```

:::deberias-ver
Una línea que termina con **`*Sparrow-2.5.5.msi`**. El asterisco forma parte del formato de la lista. Si no sale nada, el hash no coincide: no instales el programa.
:::

## Paso 5: Instala Sparrow

1. Haz doble clic en **`Sparrow-2.5.5.msi`**.
2. Sigue el instalador con las opciones que trae marcadas.
3. Al terminar, abre **Sparrow** desde el menú Inicio.

:::deberias-ver
Se abre Sparrow con la pantalla **«Welcome to Sparrow»** (bienvenido a Sparrow).
:::

## Paso 6: Cambia Sparrow a signet

Sparrow arranca en la red principal de Bitcoin, la del dinero real. Antes de crear nada, cámbialo a signet:

1. En la pantalla de bienvenida, pulsa **«Later or Offline Mode»** (más tarde o sin conexión). Así no se conecta a ningún servidor de la red principal.
2. En el menú, elige **«Tools»** (herramientas) → **«Restart In»** (reiniciar en) → **«Signet»**.

![Sparrow con el menú Tools abierto, el submenú Restart In desplegado y la opción Signet recuadrada en rojo](03-reiniciar-en-signet.webp)

:::deberias-ver
Sparrow se cierra y se vuelve a abrir solo, otra vez con la pantalla **«Welcome to Sparrow»**: cada red tiene su propia configuración.
:::

## Paso 7: Conéctate a un servidor de signet

1. En la pantalla de bienvenida, pulsa **«Next»** (siguiente) hasta llegar al final y después **«Configure Server»** (configurar servidor).
2. Elige **«Public Server»** (servidor público). Sparrow propone el servidor de signet que trae configurado.
3. Pulsa **«Test Connection»** (probar la conexión).

:::aviso{tipo="nota"}
Sparrow avisa de que un servidor público puede ver tus transacciones. En signet no importa, porque las monedas no tienen valor. Con dinero real es algo que hay que decidir, y el curso relacionado lo explica.
:::

![Ajustes del servidor de Sparrow con Public Server elegido y el resultado de Test Connection](04-servidor-signet.webp)

:::deberias-ver
Un mensaje de que la conexión ha funcionado. Al cerrar los ajustes, el interruptor de la esquina inferior derecha de la ventana sale **amarillo**: el color que usa Sparrow para un servidor público.
:::

## Paso 8: Crea la cartera y apunta la seed phrase

1. Menú **«File»** (archivo) → **«New Wallet»** (cartera nueva).
2. Escribe un nombre, por ejemplo `prueba-signet`, y pulsa **«Create»** (crear).
3. Pulsa **«New or Imported Software Wallet»** (cartera de software nueva o importada).
4. Pulsa **«Generate New»** (generar nueva). Aparecen las palabras de tu seed phrase.
5. **Apúntalas en papel**, en orden y con su número.
6. Pulsa **«Confirm Backup...»** (confirmar la copia) y escribe las palabras desde tu papel.
7. Pulsa **«Create Keystore»** (crear el almacén de claves) y después **«Import Keystore»** (importar el almacén de claves).
8. Pulsa **«Apply»** (aplicar).
9. Sparrow pide una contraseña para la cartera. Escribe una, repítela y pulsa **«Set Password»** (poner contraseña).

:::aviso{tipo="seguridad"}
La seed phrase es la cartera: quien tiene las palabras tiene las monedas. Apúntala en papel, **nunca en un archivo del equipo ni en una foto**, ni siquiera la de una cartera de pruebas. Practicar aquí es practicar la costumbre que tendrás con dinero real.
:::

:::deberias-ver
La cartera abierta en una pestaña con su nombre y, a la izquierda, sus secciones: **«Transactions»**, **«Send»**, **«Receive»**, **«Addresses»**, **«UTXOs»** y **«Settings»**.
:::

## Comprueba que ha funcionado

Pulsa **«Receive»** (recibir).

![Pestaña Receive de Sparrow con una dirección de signet que empieza por tb1](05-direccion-signet.webp)

:::deberias-ver
Una dirección que empieza por **`tb1`**. Es una dirección de red de pruebas. Las de la red principal empiezan por `bc1`, `1` o `3`: si ves una así, Sparrow no está en signet, y tienes que volver al paso 6.
:::

La próxima vez que abras Sparrow desde el menú Inicio, arrancará otra vez en la red principal. Para volver a tu cartera de pruebas, usa **«Tools» → «Restart In» → «Signet»** y ábrela con **«File» → «Open Wallet...»** (abrir cartera).

## Problemas frecuentes

**En el paso 3 no sale ninguna línea.** Falta la clave de Craig Raw (vuelve al paso 2) o no estás en la carpeta de descargas (vuelve a escribir el `cd` del paso 2).

**En el paso 3 sale `GOODSIG` pero no `VALIDSIG`.** La lista está firmada por una clave que no tiene la huella que publica Sparrow. No instales el programa.

## Lo que esta cartera no es

**Una cartera para dinero real.** Una cartera creada en signet solo funciona en signet: sus direcciones no existen en la red principal. Para guardar bitcoin de verdad se crea otra cartera en la red principal, con su propia seed phrase.

**Una cartera fría.** Sparrow guarda las claves en un equipo conectado a internet: es una :termino[hot wallet]{slug="hot-wallet"}. La contraseña protege el archivo de la cartera en este equipo, pero no sustituye a la seed phrase: si pierdes el equipo, lo que recupera la cartera son las palabras.
