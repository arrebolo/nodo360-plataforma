# Guía de estilo de los tutoriales

Lo que hay que cumplir para escribir un tutorial de `/tutoriales`. Los principios
y las reglas de idioma completas están en `docs/reports/PROMPT-MAESTRO.md`; aquí
se aplican a este formato y se dice qué hacer en cada caso.

El entorno para hacer las capturas está en `docs/TUTORIALES-CAPTURAS.md`.

---

## 1. Qué es un tutorial

**Una sola tarea práctica, de principio a fin, en 10-20 minutos.** Por ejemplo,
«Comprobar el hash SHA-256 de una descarga». Quien lo termina ha hecho algo en su
equipo y puede comprobar que le ha salido bien.

| | Tutorial | Lección de un curso | Artículo del blog |
|---|---|---|---|
| Qué enseña | A **hacer** una tarea | A **entender** un tema | Una idea, para quien llega desde un buscador |
| Examen y certificado | No | Sí, el del curso | No |
| Acceso | Abierto, sin cuenta | Con cuenta | Abierto |
| Mide el éxito | «Deberías ver…» al final de cada paso | El quiz | — |

**Si la tarea pasa de 20 minutos, son dos tutoriales**, y el segundo pone el
primero en sus requisitos. Si para hacerla hay que explicar antes un concepto
durante más de un par de párrafos, el concepto va a un curso y el tutorial lo
enlaza (criterio 27: remitir en vez de redefinir).

---

## 2. Principios que no se negocian

1. **Primero signet.** Todo lo que mueve monedas se hace en **signet**, la red de
   pruebas de Bitcoin cuyas monedas no tienen valor. Nunca se pide usar dinero
   real para aprender. Si algún día un tutorial necesita la red principal
   (`red: mainnet`), lleva el aviso de dinero real y lo decide el responsable
   del contenido, no quien lo escribe.
2. **Solo descargas oficiales, y verificadas.** Se enlaza la página de descarga
   del propio proyecto, nunca un espejo, una tienda de aplicaciones de terceros
   ni un enlace acortado. Si el proyecto publica hashes o firmas, el tutorial
   remite a los tutoriales de verificación antes de instalar.
3. **Nada de exchanges, afiliados ni enlaces de referido.** Ni para conseguir
   monedas: en signet se consiguen de un faucet.
4. **Nada de juicios de inversión ni promesas de rentabilidad** (Principio #1).
   Un tutorial explica cómo se hace algo, no si conviene hacerlo con dinero.
5. **«Cómo se hace con X», nunca «usa X»** (Principio #2, ver la sección 6).
6. **Por ahora, nada de carteras físicas.** Implican comprar un aparato de una
   marca concreta.
7. **Lo que no se ha probado no se publica** (Principio #4). Cada tutorial dice
   con qué versión y en qué fecha se probó, y quien lo escribe ha hecho todos los
   pasos en esa versión.

---

## 3. Tono e idioma

**Español neutro**, con las reglas de `CONVENCIONES DE IDIOMA` del prompt
maestro. Las que más salen en un tutorial:

| No usar | Usar |
|---|---|
| ordenador, computadora | **equipo** |
| móvil, celular | **teléfono** |
| fichero | **archivo** |
| pinchar, clicar | **hacer clic**, **pulsar** |
| vosotros | **ustedes** (mejor evitar el plural) |
| voseo (abrí, tenés) | **tuteo** (abre, tienes) |

- **Segunda persona del singular e imperativo**: «Abre la carpeta», «Escribe este
  comando». Una acción por frase.
- **Los textos de la interfaz, tal como aparecen**, entre comillas latinas y en
  negrita: haz clic en **«Descargar»**. Si el programa está en inglés, la primera
  vez se traduce entre paréntesis: **«Create New Wallet»** (crear cartera
  nueva).
- **Términos técnicos sin traducir**: hash, firma, nodo, signet, terminal, faucet,
  seed phrase. La primera vez que aparecen, enlazan al glosario.
- **Sin relleno.** Nada de «en este emocionante tutorial» ni de «como todos
  sabemos». La primera frase dice qué vas a conseguir.
- **Sin dramatizar los riesgos y sin quitarles importancia.** Un aviso dice qué
  puede pasar y qué hacer; no asusta ni tranquiliza de más.
- **Sin fechas relativas** («la última versión», «hace poco»). Las versiones y
  las fechas van en la ficha.

---

## 4. Estructura de un tutorial

Siempre en este orden. La ficha y el cierre los genera la página a partir de la
cabecera del archivo; el resto se escribe.

1. **Ficha** (generada): nivel, tiempo, sistemas, red, «Probado con X versión Y
   el …» y requisitos.
2. **Qué vas a conseguir.** Una o dos frases. Es lo primero que lee quien llega
   desde un buscador, y lo que cita un modelo cuando responde.
3. **Por qué este programa** y **con qué otros se hace lo mismo** (sección 6).
   Solo si el tutorial usa un programa que haya que elegir. Un comando que trae
   el sistema operativo no lo necesita.
4. **Pasos.** `## Paso N: verbo + objeto` («Paso 3: Calcula el hash»). Cada paso:
   - lo que hay que hacer, en frases cortas;
   - los comandos, si los hay, con una variante por sistema;
   - la captura, si ayuda a encontrar algo en la pantalla;
   - **«Deberías ver…»**: lo que aparece cuando ha salido bien. Es obligatorio:
     sin él, quien lo sigue no sabe si puede pasar al siguiente.
5. **Comprueba que ha funcionado.** La prueba final de todo el tutorial.
6. **Problemas frecuentes.** Los errores reales que salieron al probarlo, con su
   mensaje exacto y qué hacer. No se inventan problemas para rellenar.
7. **Lo que esta comprobación no demuestra** (o equivalente), cuando hay un
   límite que se pueda malinterpretar. Por ejemplo: un hash que coincide no
   demuestra que la lista de hashes sea auténtica.
8. **Siguiente paso** (generado): el tutorial o el curso que sigue.
9. **¿Te ha funcionado?** (generado): Sí / No, y si es No, en qué paso. Sin texto
   libre.

---

## 5. Avisos

Cuatro tipos, y solo cuatro. Si todo es un aviso, ninguno se lee.

| Tipo | Cuándo | Ejemplo |
|---|---|---|
| **Seguridad** | Un error en este paso expone claves, monedas o datos | «Nunca escribas la seed phrase en un archivo del equipo» |
| **Dinero real** | Solo con `red: mainnet`. El texto es fijo y lo pone la página | — |
| **Nota** | Algo útil que no es imprescindible | «Si ya tienes abierta una terminal, puedes usarla» |
| **Si no coincide / si falla** | Qué hacer cuando la comprobación de un paso sale mal | «No instales el programa. Bórralo y vuelve a descargarlo» |

El **aviso educativo** de la casa (`components/legal/AvisoEducativo.tsx`) va en
todos los tutoriales, al final, como en los cursos y el blog.

---

## 6. Elegir el programa (lectura del Principio #2)

El Principio #2 dice «No recomendar marcas concretas; comparar y dejar decidir».
Un tutorial se hace necesariamente con un programa concreto, así que se lee así
(está escrito también en el prompt maestro):

**El tutorial dice «cómo se hace con X», nunca «usa X».** El título nombra la
tarea, no el programa, salvo que el programa sea la tarea («Instalar Bitcoin
Core en signet»).

**Criterios para que un programa pueda salir en un tutorial.** Tiene que cumplir
todos:

1. **Código abierto**, con el repositorio público.
2. **Descarga oficial verificable**: el proyecto publica hashes y, para
   programas que manejan claves, firmas.
3. **Mantenido**: ha publicado alguna versión en los últimos 12 meses.
4. **No custodia tus monedas ni tus claves**, y no exige crear una cuenta.
5. **Funciona en signet**, si el tutorial mueve monedas.
6. **Sin programa de afiliados** que pague por enlazarlo.

Si además funciona en Windows, macOS y Linux, mejor: el tutorial sirve a más
gente. Ante dos programas que cumplen todo, se prefiere la implementación de
referencia (Bitcoin Core) o la herramienta genérica (GnuPG) a la de un tercero.

**Bloque fijo «Por qué este programa».** Dice qué criterios cumple, con hechos
comprobables, sin adjetivos («es de código abierto y publica sus firmas», no «es
el mejor» ni «el más seguro»).

**Bloque fijo «Con qué otros se hace lo mismo».** Lista de programas que también
cumplen los criterios, **en orden alfabético**, sin valorarlos ni compararlos.
Si se conoce una diferencia relevante para la tarea, se dice como hecho («no
funciona en signet») y no como juicio.

---

## 7. Comandos

- **Una variante por sistema** (Windows, macOS, Linux) cuando el comando cambia.
  En Windows, **PowerShell**, que viene con el sistema; no `cmd`.
- **Los comandos se pueden copiar y pegar tal cual.** Nada de `<pon-aqui-tu-archivo>`
  en mitad de un comando si se puede evitar: mejor que el comando se ejecute en
  la carpeta correcta y use un nombre que el paso anterior ha dejado claro.
- **Debajo de cada comando, la salida esperada**, recortada a lo que importa.
- **Nunca un comando con privilegios de administrador** si se puede evitar. Si es
  imprescindible, el paso dice por qué.
- **Rutas genéricas.** En el texto, «tu carpeta de descargas»; en las capturas,
  la del usuario `usuario` del entorno de capturas.

---

## 8. Capturas

El procedimiento completo está en `docs/TUTORIALES-CAPTURAS.md`. Las reglas:

- **Una captura por paso como máximo**, y solo si ayuda a encontrar algo en la
  pantalla. Un comando y su salida se escriben como texto, que se puede copiar y
  que lee un buscador; la captura solo cuando la salida en pantalla aporta algo
  (por ejemplo, ver la línea que coincide).
- **Solo la ventana**, nunca la pantalla entera.
- **Nombre del archivo**: `NN-que-muestra.png`, con `NN` el orden en el
  tutorial (`03-hash-calculado.png`).
- **Texto alternativo obligatorio**: describe lo que se ve y lo que importa de
  ello («PowerShell con el hash SHA-256 del instalador en una sola línea»). Ni
  «captura», ni «imagen», ni el nombre del archivo.
- **Marcas sobre la captura** (un recuadro, una flecha): solo para señalar dónde
  hacer clic o qué mirar, de un solo color y sin texto encima.

**Regla de datos personales.** En una captura no puede aparecer:

- ningún nombre, correo, foto de perfil ni cuenta de nadie;
- el nombre real del equipo ni de la red wifi;
- IPs, direcciones `.onion`, ni nada que identifique una conexión;
- direcciones, xpub ni transacciones de una cartera que no sea **de prueba y
  creada para el tutorial**;
- una **seed phrase**, aunque sea de prueba: se tapa siempre, para no enseñar
  la costumbre de fotografiarla;
- pestañas, marcadores, notificaciones, el tiempo ni noticias;
- **la ventana de Control de cuentas de usuario** (la que pide permiso de
  administrador): muestra el nombre de la cuenta administradora del equipo.

Antes de subir una captura, se mira entera, a tamaño real, buscando lo anterior.
Lo automático (quitar metadatos, reducir el peso) no sustituye a esa revisión.

---

## 9. Datos que caducan

Las versiones de los programas, las URL de descarga, los textos de los botones y
lo que muestra cada pantalla caducan. Por eso:

- La ficha de cada tutorial dice **con qué versión y en qué fecha se probó**, y
  en qué sistemas.
- Si cambia algo de lo anterior, el tutorial se vuelve a probar entero antes de
  cambiar la fecha. Cambiar la fecha sin probar es justo lo que el Principio #4
  no admite.
- Un tutorial que puede estar desfasado se marca `estado: revisar` y la página lo
  avisa. Lo marca una persona, no un proceso automático.

---

## 10. Antes de publicar

- [ ] Hecho entero, en la versión y en los sistemas que dice la ficha.
- [ ] Cada paso tiene su «Deberías ver…».
- [ ] Los comandos, copiados de la página y pegados en la terminal, funcionan.
- [ ] Ninguna palabra de la lista de verificación rápida del prompt maestro
      (`ordenador|computadora|movil|celular|fichero|…`).
- [ ] Ningún enlace a exchanges, afiliados ni espejos de descarga.
- [ ] Ningún juicio de inversión ni promesa.
- [ ] Bloques «Por qué este programa» y «Con qué otros se hace lo mismo», si
      corresponde, con las alternativas en orden alfabético.
- [ ] Capturas revisadas con la regla de datos personales, a tamaño real.
- [ ] Texto alternativo en todas las capturas.
