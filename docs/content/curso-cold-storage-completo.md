# Curso I-3: Cold Storage — Protege tus Bitcoin
## Contenido completo para producción

---

## Ficha del curso

| Campo | Valor |
|-------|-------|
| **Título** | Cold Storage — Protege tus Bitcoin |
| **Slug** | cold-storage-protege-tus-bitcoin |
| **Ruta** | Seguridad Avanzada |
| **Nivel** | Intermediate |
| **Premium** | No (gratuito) |
| **Prerequisito sugerido** | Seguridad básica en Bitcoin (beginner) |
| **Descripción corta** | Aprende a proteger tus bitcoin fuera de internet. Desde entender tu modelo de amenazas hasta configurar un hardware wallet y hacer backups seguros. |
| **Descripción larga** | Tener bitcoin en un exchange o en una wallet conectada a internet es como guardar dinero en efectivo sobre la mesa. En este curso aprenderás a mover tus fondos a cold storage: almacenamiento sin conexión que te da control total. No necesitas ser técnico — solo necesitas criterio y un plan. |
| **Módulos** | 2 |
| **Lecciones** | 6 |
| **Duración estimada** | 2-3 horas |

---

## MÓDULO 1: Fundamentos de Custodia
**Descripción:** Entiende qué proteger, de quién, y qué opciones tienes antes de tocar ninguna herramienta.

---

### LECCIÓN 1.1: Hot vs Cold — Tu Modelo de Amenazas

**Objetivo:** El usuario entiende la diferencia entre hot y cold storage, y puede identificar sus propias amenazas.

**Contenido para lesson player (TipTap):**

Antes de elegir una wallet o un método de almacenamiento, necesitas hacerte una pregunta que muy pocos se hacen: ¿de qué me estoy protegiendo exactamente?

Eso es lo que en seguridad se llama "modelo de amenazas". No es lo mismo proteger 50€ en bitcoin que proteger los ahorros de tu vida. No es lo mismo vivir solo que tener familia. No es lo mismo un usuario que opera frecuentemente que uno que compra y guarda a largo plazo.

Hot storage es cualquier wallet conectada a internet: la app de tu exchange, una wallet en el móvil, una extensión del navegador. Es cómoda, rápida, y perfecta para cantidades pequeñas que usas a menudo. Pero está expuesta: si alguien compromete tu dispositivo, accede a tus fondos.

Cold storage es lo contrario: tus claves privadas nunca tocan internet. Pueden estar en un hardware wallet, en un dispositivo air-gapped, o incluso en un papel. Es menos cómoda, pero mucho más segura para cantidades significativas o ahorro a largo plazo.

La clave no es elegir uno u otro. Es usar cada uno para lo que sirve.

---

**Guión de slides (8 slides):**

| # | Título del slide | Contenido visual | Notas |
|---|-----------------|------------------|-------|
| 1 | ¿Dónde están tus bitcoin ahora mismo? | Icono de exchange + wallet móvil + signo de interrogación | Pregunta provocadora para abrir |
| 2 | La pregunta que nadie se hace | Texto central: "¿De qué te estás protegiendo?" + subtítulo: "Tu modelo de amenazas" | Concepto clave de la lección |
| 3 | Amenazas reales | Lista visual con iconos: Hackeo remoto · Robo físico · Pérdida de acceso · Error humano · Herencia | No meter miedo — informar |
| 4 | Hot Storage | Definición: "Claves conectadas a internet" + Ejemplos: Exchange, wallet móvil, extensión navegador + Icono de wifi/conexión | Usar color cálido (naranja/rojo suave) |
| 5 | Cold Storage | Definición: "Claves que nunca tocan internet" + Ejemplos: Hardware wallet, papel, air-gapped + Icono de candado/desconexión | Usar color frío (azul) |
| 6 | Comparativa rápida | Tabla 2 columnas: Hot (✅ Cómodo, ✅ Acceso rápido, ❌ Expuesto) vs Cold (✅ Seguro, ✅ Control total, ❌ Menos accesible) | Visual limpio, sin saturar |
| 7 | ¿Cuándo usar cada uno? | Hot → Gastos frecuentes, cantidades pequeñas · Cold → Ahorro, cantidades significativas, largo plazo | Analogía: cuenta corriente vs caja fuerte |
| 8 | Tu primer paso | Texto: "Identifica tus amenazas antes de elegir herramientas" + CTA: Siguiente lección → Tipos de cold storage | Cierre con acción clara |

---

**Quiz (3 preguntas):**

**P1:** ¿Qué es un modelo de amenazas?
- A) Un software que detecta virus
- B) Una evaluación de qué riesgos te afectan y cómo protegerte ✅
- C) Una lista de hackers conocidos
- D) Un tipo de wallet

**P2:** ¿Cuál es la principal diferencia entre hot y cold storage?
- A) El precio
- B) El tamaño del dispositivo
- C) Si las claves privadas están conectadas a internet o no ✅
- D) La cantidad de bitcoin que pueden guardar

**P3:** ¿Para qué tipo de uso es más adecuado el cold storage?
- A) Compras diarias de café
- B) Trading frecuente
- C) Ahorro a largo plazo y cantidades significativas ✅
- D) Recibir pagos en una tienda

---
---

### LECCIÓN 1.2: Tipos de Cold Storage

**Objetivo:** El usuario conoce las opciones de cold storage que existen y puede comparar sus ventajas y limitaciones.

**Contenido para lesson player (TipTap):**

No todo el cold storage es igual. Existen varias formas de mantener tus claves fuera de internet, y cada una tiene ventajas, limitaciones y casos de uso diferentes.

La opción más conocida son los hardware wallets: dispositivos físicos diseñados específicamente para firmar transacciones sin exponer tus claves. Trezor, Ledger, ColdCard, BitBox, Keystone — hay muchas opciones. Lo que tienen en común es que tus claves se generan y viven dentro del dispositivo. Cuando quieres enviar bitcoin, el dispositivo firma la transacción internamente y solo envía la transacción firmada al exterior. Las claves nunca salen.

Otra opción son los dispositivos air-gapped: ordenadores o móviles que nunca se conectan a internet. Puedes usar un móvil viejo con una wallet instalada, sin SIM y sin wifi. Es más barato que un hardware wallet, pero requiere más disciplina.

Las paper wallets fueron populares hace años: imprimes tu clave privada en papel y la guardas. El problema es que son frágiles, fáciles de dañar, y es muy fácil cometer errores al usarlas. Hoy en día no se recomiendan excepto en casos muy específicos.

Finalmente, los steel backups (placas de metal) no son wallets en sí, sino un método para guardar tu seed phrase de forma resistente al fuego, agua y tiempo. Son complementarios a cualquier otra solución de cold storage.

No hay una opción perfecta universal. Lo que importa es que entiendas qué te ofrece cada una y elijas con criterio.

---

**Guión de slides (10 slides):**

| # | Título del slide | Contenido visual | Notas |
|---|-----------------|------------------|-------|
| 1 | No todo el cold storage es igual | Iconos de las 4 opciones: hardware wallet, air-gapped, paper, steel | Introducir que hay variedad |
| 2 | Hardware Wallets | Definición + cómo funcionan (genera claves → firma interna → envía TX firmada) | Diagrama simple de flujo |
| 3 | Hardware Wallets — Opciones | Logos/nombres: Trezor, Ledger, ColdCard, BitBox, Keystone + nota: "No recomendamos marcas — compara y decide" | Alineado con Principio #2 |
| 4 | Hardware Wallets — Pros y contras | ✅ Diseñados para esto, fáciles de usar, ecosistema maduro · ❌ Cuestan dinero, supply chain risk, dependes del fabricante | Honestidad — Principio #7 |
| 5 | Dispositivos Air-Gapped | Definición + ejemplo: móvil viejo sin SIM/wifi con wallet instalada | Opción económica |
| 6 | Air-Gapped — Pros y contras | ✅ Barato, flexible, sin fabricante · ❌ Requiere disciplina, más pasos, fácil cometer errores | Para usuarios con criterio |
| 7 | Paper Wallets | Qué son + por qué ya no se recomiendan (fragilidad, errores, reutilización de direcciones) | Aviso claro sin alarmismo |
| 8 | Steel Backups | Qué son + fotos/ejemplos (placas grabadas) + nota: "Complemento, no sustituto" | Protegen la seed, no son wallet |
| 9 | Comparativa | Tabla: Hardware wallet / Air-gapped / Paper / Steel → Seguridad, Coste, Facilidad, Durabilidad | Resumen visual |
| 10 | ¿Cuál es para ti? | Criterios de decisión: Presupuesto, frecuencia de uso, nivel técnico, cantidad a proteger | No dar respuesta — dar criterio |

---

**Quiz (3 preguntas):**

**P1:** ¿Cómo protege un hardware wallet tus claves privadas?
- A) Las envía cifradas a la nube
- B) Las genera y mantiene dentro del dispositivo, sin exponerlas a internet ✅
- C) Las divide en varios archivos
- D) Las protege con antivirus

**P2:** ¿Por qué las paper wallets ya no se recomiendan como método principal?
- A) Porque son ilegales
- B) Porque son frágiles, propensas a errores y fáciles de dañar ✅
- C) Porque no funcionan con Bitcoin
- D) Porque son demasiado caras

**P3:** ¿Qué es un steel backup?
- A) Una wallet hecha de acero
- B) Un método para guardar tu seed phrase en metal resistente al fuego y agua ✅
- C) Un exchange especialmente seguro
- D) Un tipo de hardware wallet

---
---

### LECCIÓN 1.3: Seed Phrases — Tu Llave Maestra

**Objetivo:** El usuario entiende qué es una seed phrase, por qué es crítica, y los errores más comunes que debe evitar.

**Contenido para lesson player (TipTap):**

Si tuvieras que recordar una sola cosa de este curso, que sea esto: tu seed phrase ES tu bitcoin. Quien la tenga, tiene tus fondos. Quien la pierda, pierde el acceso para siempre.

Una seed phrase (también llamada frase de recuperación o mnemonic) es una secuencia de 12 o 24 palabras en un orden específico. Esas palabras codifican la clave maestra desde la que se generan todas tus direcciones y claves privadas. El estándar se llama BIP39, pero no necesitas saber los detalles técnicos — lo que necesitas saber es que esas palabras lo son todo.

Cuando configuras un hardware wallet o una wallet de software, el dispositivo genera tu seed phrase. Tu único trabajo es anotarla correctamente y guardarla en un lugar seguro. Parece simple, pero es donde la mayoría de la gente comete errores.

Errores comunes: hacer una foto de la seed (ahora está en tu galería, en la nube, expuesta). Guardarla en un archivo de texto en el ordenador. Enviarla por WhatsApp "a ti mismo". Anotarla en un post-it. Guardar una copia y ningún backup. No verificar que la anotaste correctamente.

Reglas fundamentales: anótala en papel o metal, nunca en digital. Guárdala en un lugar seguro y separado del dispositivo. Haz al menos un backup en otra ubicación física. Nunca la compartas con nadie. Verifica que funciona antes de enviar fondos.

Tu seed phrase es lo más valioso que tienes en el mundo Bitcoin. Trátala como tal.

---

**Guión de slides (10 slides):**

| # | Título del slide | Contenido visual | Notas |
|---|-----------------|------------------|-------|
| 1 | Tu seed phrase ES tu bitcoin | Texto grande, directo, impactante | Mensaje central de la lección |
| 2 | ¿Qué es una seed phrase? | Ejemplo visual de 12/24 palabras en orden (palabras genéricas) + definición simple | Mostrar formato sin usar seed real |
| 3 | ¿Cómo funciona? | Diagrama: Seed → Clave maestra → Claves privadas → Direcciones | Simplificado, sin jerga técnica |
| 4 | ¿Cuándo la obtienes? | Al configurar cualquier wallet por primera vez → el dispositivo la genera → tú la anotas | Flujo simple |
| 5 | ❌ Lo que NUNCA debes hacer | Lista con iconos tachados: Foto · Archivo digital · WhatsApp · Nube · Email · Post-it | Visual fuerte, memorable |
| 6 | ❌ Errores comunes | Caso 1: "La guardé en Google Drive" · Caso 2: "Hice una foto por si acaso" · Caso 3: "Solo tengo una copia en casa" | Ejemplos reales sin juzgar |
| 7 | ✅ Lo que SÍ debes hacer | Papel o metal · Lugar seguro · Separada del dispositivo · Al menos 2 copias · En ubicaciones diferentes | Reglas claras y accionables |
| 8 | Verificar antes de confiar | Paso: Anota la seed → Resetea el dispositivo → Restaura con la seed → Confirma que funciona | Proceso de verificación |
| 9 | ¿Y si la pierdo? | Sin seed + sin acceso al dispositivo = fondos perdidos para siempre. No hay soporte técnico, no hay recuperación. | Honestidad — sin edulcorar |
| 10 | Resumen | 3 reglas: Anota en físico · Guarda seguro · Verifica que funciona | Cierre limpio |

---

**Quiz (3 preguntas):**

**P1:** ¿Qué representa tu seed phrase?
- A) Tu contraseña del exchange
- B) La clave maestra desde la que se generan todas tus claves y direcciones ✅
- C) Tu nombre de usuario en la blockchain
- D) Un código de verificación temporal

**P2:** ¿Cuál de estas acciones es SEGURA para guardar tu seed phrase?
- A) Hacer una foto con el móvil
- B) Guardarla en un archivo en Google Drive
- C) Anotarla en papel y guardarla en un lugar seguro y separado del dispositivo ✅
- D) Enviarla por email a ti mismo

**P3:** ¿Qué pasa si pierdes tu seed phrase y tu dispositivo deja de funcionar?
- A) Contactas al fabricante y te la recuperan
- B) Pierdes el acceso a tus fondos de forma permanente ✅
- C) Bitcoin te genera una nueva automáticamente
- D) Puedes recuperarla desde la blockchain

---
---

## MÓDULO 2: Implementación Práctica
**Descripción:** Pasa de la teoría a la acción. Configura, respalda y verifica tu setup de cold storage.

---

### LECCIÓN 2.1: Configurar un Hardware Wallet

**Objetivo:** El usuario sabe cómo elegir y configurar un hardware wallet paso a paso, con criterio.

**Contenido para lesson player (TipTap):**

Ahora que entiendes los fundamentos, es momento de pasar a la práctica. En esta lección vamos a recorrer el proceso de configuración de un hardware wallet, paso a paso, independientemente de la marca que elijas.

Antes de comprar: compra siempre directamente del fabricante o de un distribuidor oficial. Nunca de segunda mano, nunca de un vendedor no verificado en Amazon o similares. Un dispositivo manipulado puede parecer nuevo pero tener firmware modificado que roba tus claves. Esto no es paranoia — ha pasado.

Al recibirlo, verifica que el embalaje está intacto y que el dispositivo no muestra signos de manipulación. Algunos fabricantes incluyen sellos holográficos o verificación de autenticidad por software.

El proceso de configuración es similar en todos los hardware wallets: conectas el dispositivo, instalas el software companion (Trezor Suite, Ledger Live, Sparrow, etc.), el dispositivo genera tu seed phrase, la anotas en papel/metal, la verificas, y estableces un PIN de acceso.

Un punto que mucha gente pasa por alto: el software companion no es obligatorio para operar. Puedes usar tu hardware wallet con software independiente como Sparrow Wallet o Electrum. Esto reduce la dependencia de un solo fabricante y te da más control.

Después de configurar, haz una transacción de prueba: envía una cantidad mínima, verifica que llega, verifica que puedes enviar desde el dispositivo. Solo entonces empieza a mover cantidades importantes.

---

**Guión de slides (10 slides):**

| # | Título del slide | Contenido visual | Notas |
|---|-----------------|------------------|-------|
| 1 | De la teoría a la práctica | Icono de herramientas + texto: "Configura tu cold storage" | Transición al módulo práctico |
| 2 | Antes de comprar | ✅ Directo del fabricante · ✅ Distribuidor oficial · ❌ Segunda mano · ❌ Vendedor no verificado | Supply chain risk real |
| 3 | Al recibirlo | Checklist: Embalaje intacto · Sin signos de manipulación · Verificar autenticidad | Primer paso antes de encender |
| 4 | Proceso de configuración | Flujo: Conectar → Software → Generar seed → Anotar → Verificar → PIN | Diagrama paso a paso |
| 5 | Paso 1: Software companion | Ejemplos: Trezor Suite, Ledger Live + nota: "No es obligatorio — puedes usar Sparrow u otros" | Soberanía — no dependas de uno |
| 6 | Paso 2: Generar y anotar seed | El dispositivo muestra las palabras → Tú las anotas en orden → Nunca en digital | Recordar lección 1.3 |
| 7 | Paso 3: Verificar seed | El dispositivo pide confirmar palabras → Asegura que anotaste bien | Paso que mucha gente salta |
| 8 | Paso 4: Establecer PIN | PIN = acceso al dispositivo (no a los fondos) · Si pierdes el dispositivo, la seed es tu backup | Aclarar la diferencia |
| 9 | Transacción de prueba | Envía cantidad mínima → Verifica recepción → Envía de vuelta → Todo funciona → Ahora sí | No confíes sin verificar |
| 10 | Errores a evitar | Saltar verificación · No hacer TX de prueba · Guardar seed con el dispositivo · Comprar usado | Resumen de peligros reales |

---

**Quiz (3 preguntas):**

**P1:** ¿Dónde debes comprar un hardware wallet?
- A) En cualquier tienda online con buen precio
- B) De segunda mano para ahorrar
- C) Directamente del fabricante o distribuidor oficial ✅
- D) En grupos de Telegram

**P2:** ¿Por qué es importante hacer una transacción de prueba después de configurar?
- A) Para ganar puntos en la wallet
- B) Para verificar que todo funciona antes de mover cantidades importantes ✅
- C) Porque el dispositivo lo exige
- D) Para activar el dispositivo

**P3:** ¿Es obligatorio usar el software companion del fabricante (ej: Ledger Live)?
- A) Sí, sin él no funciona
- B) No, puedes usar software independiente como Sparrow Wallet ✅
- C) Solo si tienes un modelo antiguo
- D) Solo para Bitcoin, no para otras criptomonedas

---
---

### LECCIÓN 2.2: Backup Seguro de Seeds

**Objetivo:** El usuario sabe cómo hacer backups seguros de su seed phrase y puede diseñar una estrategia de respaldo.

**Contenido para lesson player (TipTap):**

Ya tienes tu hardware wallet configurado y tu seed anotada. Ahora viene la parte que separa a los usuarios preparados de los que perderán fondos: el backup.

Una sola copia de tu seed en un solo lugar es un punto único de fallo. Un incendio, una inundación, un robo, o simplemente olvidar dónde la guardaste, y pierdes todo. Necesitas redundancia.

La regla básica es 2-3 copias en ubicaciones físicas diferentes. No todas en tu casa. Piensa en casa de un familiar de confianza, una caja de seguridad en un banco, o una ubicación geográficamente separada.

El material importa. Papel funciona, pero es vulnerable al agua, fuego y deterioro con el tiempo. Las placas de metal (steel backups) resisten fuego hasta 1500°C, agua, y corrosión. Para cantidades significativas, el coste de una placa de metal (30-80€) es insignificante comparado con lo que protege.

Métodos de grabado en metal: hay placas donde estampas letras con un punzón, otras donde atornillas letras, y algunas donde grabas directamente. Todas funcionan. Lo importante es que sea legible, resistente, y que verifiques que anotaste correctamente.

Distribución geográfica: no guardes todas las copias cerca. Si tu zona sufre un desastre natural, quieres al menos una copia en otro lugar. Pero tampoco las disperses tanto que pierdas control sobre ellas.

Un punto que se olvida: documenta dónde están tus backups. De nada sirve tener 3 copias si dentro de 5 años no recuerdas dónde las pusiste. Mantén un registro (sin incluir la seed misma) de las ubicaciones.

---

**Guión de slides (10 slides):**

| # | Título del slide | Contenido visual | Notas |
|---|-----------------|------------------|-------|
| 1 | Una copia no es backup | Icono de documento único + señal de peligro | Mensaje directo |
| 2 | Punto único de fallo | Escenarios: Incendio · Inundación · Robo · Olvido → Todo perdido | Motivar la redundancia |
| 3 | Regla: 2-3 copias, ubicaciones diferentes | Diagrama: Casa + Familiar + Caja bancaria (o similar) | Visual de distribución |
| 4 | Papel vs Metal | Tabla: Papel (✅ Gratis, ❌ Fuego/Agua) vs Metal (✅ Resistente, ❌ 30-80€) | Para cantidades significativas → metal |
| 5 | Tipos de steel backup | Fotos/iconos de: Estampado · Atornillado · Grabado + "Todos funcionan" | No recomendar marca — dar opciones |
| 6 | Cómo grabar correctamente | Pasos: Anotar en papel primero · Transferir a metal · Verificar cada palabra · Guardar | Proceso sin prisas |
| 7 | Distribución geográfica | Mapa simple: Ubicación A (casa) + Ubicación B (familiar) + Ubicación C (banco) | No todas juntas, no todas lejos |
| 8 | Documenta tus ubicaciones | Registro de dónde están los backups (SIN incluir la seed) · Actualiza si cambias algo | Lo que se olvida con el tiempo |
| 9 | ¿Y la herencia? | Si te pasa algo: ¿alguien sabe que tienes bitcoin? ¿Alguien puede acceder? | Plantar la semilla, tema de curso futuro |
| 10 | Tu plan de backup | Checklist: ¿2+ copias? ¿Ubicaciones separadas? ¿Material resistente? ¿Documentado? ¿Verificado? | Acción concreta |

---

**Quiz (3 preguntas):**

**P1:** ¿Cuántas copias de tu seed phrase deberías tener como mínimo?
- A) 1, bien guardada
- B) 2-3, en ubicaciones físicas diferentes ✅
- C) 10, para estar seguro
- D) Ninguna, la memorizo

**P2:** ¿Cuál es la ventaja principal de un steel backup frente al papel?
- A) Es más barato
- B) Es más fácil de leer
- C) Resiste fuego, agua y corrosión ✅
- D) Ocupa menos espacio

**P3:** ¿Qué debes documentar sobre tus backups?
- A) La seed phrase completa en un archivo digital
- B) Las ubicaciones donde están guardados, sin incluir la seed ✅
- C) Las contraseñas de tus exchanges
- D) No debes documentar nada

---
---

### LECCIÓN 2.3: Verificación y Simulacro de Recuperación

**Objetivo:** El usuario sabe cómo verificar que su setup funciona y puede hacer un simulacro de recuperación completo.

**Contenido para lesson player (TipTap):**

Esta es probablemente la lección más importante del curso, y la que menos gente hace. De nada sirve tener un hardware wallet configurado y 3 copias de tu seed si nunca has verificado que puedes recuperar tus fondos en caso de emergencia.

Un simulacro de recuperación es exactamente lo que suena: simulas que has perdido tu dispositivo y verificas que puedes recuperar el acceso usando solo tu seed phrase.

El proceso es simple: resetea tu hardware wallet (o usa uno nuevo), selecciona "restaurar wallet existente", introduce tu seed phrase palabra por palabra, y verifica que las mismas direcciones y el mismo saldo aparecen. Si aparecen, tu backup funciona. Si no, tienes un problema que es mejor descubrir ahora y no cuando realmente lo necesites.

Cuándo hacer un simulacro: después de la configuración inicial (obligatorio), cada 6-12 meses como rutina, y cada vez que cambies la ubicación de un backup.

Además del simulacro, mantén una checklist de seguridad personal. Una lista de preguntas que revisas periódicamente: ¿Sé dónde están mis backups? ¿Mis backups son legibles? ¿Alguien de confianza sabe que tengo bitcoin y cómo acceder si me pasa algo? ¿Mi PIN es seguro? ¿Mi firmware está actualizado?

No te fíes de la memoria. No te fíes de la suerte. Verifica.

---

**Guión de slides (10 slides):**

| # | Título del slide | Contenido visual | Notas |
|---|-----------------|------------------|-------|
| 1 | La prueba de fuego | Texto: "¿Puedes recuperar tus fondos ahora mismo?" | Pregunta directa |
| 2 | ¿Por qué un simulacro? | Analogía: simulacro de incendio — no esperas al fuego para saber si la salida funciona | Concepto claro |
| 3 | Proceso paso a paso | Flujo: Resetear dispositivo → Restaurar con seed → Verificar direcciones → Verificar saldo | Diagrama limpio |
| 4 | Paso 1: Resetear | El dispositivo se borra completamente → Es como empezar de cero | Dar confianza, no miedo |
| 5 | Paso 2: Restaurar | Seleccionar "Recover" → Introducir seed palabra por palabra → El dispositivo regenera todo | El momento de la verdad |
| 6 | Paso 3: Verificar | Comparar: ¿Mismas direcciones? ¿Mismo saldo? → Si sí = backup funciona → Si no = investigar | Qué buscar exactamente |
| 7 | ¿Con qué frecuencia? | Después de configurar (obligatorio) · Cada 6-12 meses · Al cambiar ubicación de backup | Rutina, no paranoia |
| 8 | Tu checklist de seguridad | Lista: ¿Backups localizados? ¿Legibles? ¿Alguien informado? ¿PIN seguro? ¿Firmware actualizado? | Revisión periódica |
| 9 | El error más común | "Configuré todo hace 2 años y nunca verifiqué" → Descubrir el problema cuando lo necesitas es demasiado tarde | Motivar la acción |
| 10 | Has completado el curso | Resumen: Modelo de amenazas → Tipos de cold storage → Seed → Hardware wallet → Backup → Verificación | Cierre con sentido de logro |

---

**Quiz (3 preguntas):**

**P1:** ¿Qué es un simulacro de recuperación?
- A) Instalar un antivirus en el hardware wallet
- B) Verificar que puedes restaurar tus fondos usando solo tu seed phrase ✅
- C) Hacer una copia de seguridad del PIN
- D) Contactar al fabricante para verificar tu identidad

**P2:** ¿Con qué frecuencia deberías hacer un simulacro de recuperación?
- A) Solo una vez al configurar
- B) Cada semana
- C) Después de configurar y luego cada 6-12 meses ✅
- D) Solo si pierdes el dispositivo

**P3:** ¿Qué debes verificar durante un simulacro?
- A) Que el dispositivo enciende
- B) Que las mismas direcciones y saldo aparecen tras restaurar con la seed ✅
- C) Que la batería está cargada
- D) Que la app del fabricante se actualiza

---
---

## RESUMEN DE PRODUCCIÓN

| Lección | Slides | Quiz | Tiempo producción |
|---------|--------|------|-------------------|
| 1.1 Hot vs Cold | 8 | 3 | ~50 min |
| 1.2 Tipos de Cold Storage | 10 | 3 | ~60 min |
| 1.3 Seed Phrases | 10 | 3 | ~60 min |
| 2.1 Configurar Hardware Wallet | 10 | 3 | ~60 min |
| 2.2 Backup Seguro | 10 | 3 | ~60 min |
| 2.3 Verificación y Simulacro | 10 | 3 | ~60 min |
| **TOTAL** | **58 slides** | **18 preguntas** | **~5-6 horas** |

---

## DATOS PARA ADMIN PANEL

### Curso
```
Título: Cold Storage — Protege tus Bitcoin
Slug: cold-storage-protege-tus-bitcoin
Nivel: intermediate
Descripción: Aprende a proteger tus bitcoin fuera de internet. Desde entender tu modelo de amenazas hasta configurar un hardware wallet y hacer backups seguros.
Premium: false
```

### Módulo 1
```
Título: Fundamentos de Custodia
Descripción: Entiende qué proteger, de quién, y qué opciones tienes antes de tocar ninguna herramienta.
Orden: 1
```

### Módulo 2
```
Título: Implementación Práctica
Descripción: Pasa de la teoría a la acción. Configura, respalda y verifica tu setup de cold storage.
Orden: 2
```

### Lecciones (orden dentro de cada módulo)
```
M1-L1: Hot vs Cold — Tu Modelo de Amenazas (orden: 1)
M1-L2: Tipos de Cold Storage (orden: 2)
M1-L3: Seed Phrases — Tu Llave Maestra (orden: 3)
M2-L1: Configurar un Hardware Wallet (orden: 1)
M2-L2: Backup Seguro de Seeds (orden: 2)
M2-L3: Verificación y Simulacro de Recuperación (orden: 3)
```
