# Curso I-1: Nodos Bitcoin — Tu Soberanía Técnica
## Contenido completo para producción

---

## Ficha del curso

| Campo | Valor |
|-------|-------|
| **Título** | Nodos Bitcoin — Tu Soberanía Técnica |
| **Slug** | nodos-bitcoin-tu-soberania-tecnica |
| **Ruta** | Bitcoin Técnico (NUEVA) |
| **Nivel** | Intermediate |
| **Premium** | No (gratuito) |
| **Prerequisito sugerido** | Fundamentos de Bitcoin (ruta beginner) |
| **Descripción corta** | Entiende qué es un nodo Bitcoin, por qué te hace soberano, y cómo montar el tuyo sin ser programador. |
| **Descripción larga** | Cada vez que usas un exchange o una wallet ligera, estás confiando en el nodo de otro para verificar tus transacciones. En este curso aprenderás por qué eso importa, qué tipos de nodos existen, y cómo montar tu propio nodo para verificar todo por ti mismo. No necesitas ser desarrollador — solo necesitas entender por qué importa y seguir los pasos. |
| **Módulos** | 2 |
| **Lecciones** | 6 |
| **Duración estimada** | 2-3 horas |

---

## MÓDULO 1: ¿Por Qué un Nodo Propio?
**Descripción:** Entiende el rol de los nodos en Bitcoin y por qué ejecutar uno te convierte en un participante soberano de la red.

---

### LECCIÓN 1.1: El Rol de los Nodos en Bitcoin

**Objetivo:** El usuario entiende qué hace un nodo Bitcoin y por qué son la columna vertebral de la red.

**Contenido para lesson player (TipTap):**

Bitcoin no depende de ningún servidor central ni de ninguna empresa. Funciona porque miles de ordenadores en todo el mundo ejecutan el mismo software y verifican las mismas reglas. Esos ordenadores son los nodos.

Un nodo Bitcoin es un ordenador que ejecuta el software de Bitcoin (normalmente Bitcoin Core) y mantiene una copia completa de la blockchain. Cada nodo verifica de forma independiente que cada transacción y cada bloque cumplen las reglas del protocolo. Si un minero intenta crear bitcoin de la nada o gastar monedas que no le pertenecen, tu nodo lo rechaza automáticamente.

Esto es lo que hace a Bitcoin diferente de cualquier otro sistema financiero: no necesitas confiar en nadie. Tu nodo verifica todo por sí mismo.

Los nodos se comunican entre ellos en una red peer-to-peer (P2P). Cuando alguien envía una transacción, esta se propaga de nodo en nodo hasta que toda la red la conoce. Cuando un minero encuentra un bloque, lo envía a la red y cada nodo lo verifica antes de aceptarlo.

Sin nodos, Bitcoin no existe. Los mineros proponen bloques, pero son los nodos los que deciden si esos bloques son válidos. En Bitcoin, las reglas las hacen cumplir los nodos, no los mineros.

---

**Guión de slides (8 slides):**

| # | Título del slide | Contenido visual | Notas |
|---|-----------------|------------------|-------|
| 1 | ¿Quién verifica tus transacciones? | Icono de interrogación + siluetas de ordenadores en red | Pregunta para abrir |
| 2 | Bitcoin no tiene servidor central | Diagrama: sistema centralizado (un servidor) vs descentralizado (muchos nodos conectados) | Comparativa visual clara |
| 3 | ¿Qué es un nodo? | Definición: ordenador + software Bitcoin + copia de la blockchain | Tres elementos simples |
| 4 | ¿Qué hace un nodo? | Lista visual: Verifica transacciones · Verifica bloques · Rechaza trampas · Propaga información | Cada punto con icono |
| 5 | Red peer-to-peer | Diagrama de nodos conectados entre sí, flechas bidireccionales, sin centro | Visualizar la descentralización |
| 6 | Propagación | Flujo: Alguien envía TX → nodo la recibe → la verifica → la pasa a otros nodos | Animación mental paso a paso |
| 7 | Nodos vs Mineros | Nodos = verifican y hacen cumplir reglas · Mineros = proponen nuevos bloques · Los nodos deciden si los aceptan | Distinción clave |
| 8 | Sin nodos, no hay Bitcoin | Texto central impactante + subtítulo: "Los nodos son la columna vertebral de la red" | Cierre contundente |

---

**Quiz (3 preguntas):**

**P1:** ¿Qué es un nodo Bitcoin?
- A) Un servidor de una empresa que gestiona Bitcoin
- B) Un ordenador que ejecuta el software de Bitcoin y verifica transacciones y bloques de forma independiente ✅
- C) Una wallet para guardar bitcoin
- D) Un minero que crea nuevos bloques

**P2:** ¿Cómo se comunican los nodos entre sí?
- A) A través de un servidor central
- B) En una red peer-to-peer (P2P), directamente entre ellos ✅
- C) Por email
- D) Solo a través de los mineros

**P3:** ¿Quién decide si un bloque es válido en Bitcoin?
- A) Solo los mineros
- B) El creador de Bitcoin
- C) Los nodos, que verifican que cumple las reglas del protocolo ✅
- D) Los exchanges

---
---

### LECCIÓN 1.2: Soberanía sin Intermediarios

**Objetivo:** El usuario entiende por qué ejecutar su propio nodo elimina la necesidad de confiar en terceros.

**Contenido para lesson player (TipTap):**

"Don't trust, verify" — No confíes, verifica. Es probablemente la frase más repetida en Bitcoin, y resume perfectamente por qué los nodos importan a nivel personal.

Cuando usas un exchange para ver tu saldo, estás confiando en que el exchange te dice la verdad. Cuando usas una wallet ligera (como la mayoría de apps móviles), estás confiando en el nodo de otra persona para verificar tus transacciones. Si ese nodo miente o está comprometido, podrías recibir información falsa.

En la práctica, estos riesgos son bajos para la mayoría de usuarios en el día a día. Pero el punto fundamental es otro: Bitcoin fue diseñado para que no tengas que confiar en nadie. Y la única forma de cumplir esa promesa es verificar tú mismo.

Con tu propio nodo, cuando alguien te envía bitcoin, tu nodo verifica la transacción directamente contra la blockchain. No le pregunta a nadie si es válida. No depende de ningún servicio. Tú verificas.

Además de la verificación, tu nodo contribuye a la descentralización de la red. Cuantos más nodos independientes existan, más resistente es Bitcoin a la censura y la manipulación. Cada nodo es un voto a favor de las reglas actuales del protocolo.

Ejecutar un nodo no es obligatorio para usar Bitcoin. Pero es la diferencia entre usar Bitcoin confiando en otros, y usar Bitcoin de verdad — con soberanía.

---

**Guión de slides (8 slides):**

| # | Título del slide | Contenido visual | Notas |
|---|-----------------|------------------|-------|
| 1 | Don't trust, verify | Frase central en grande, estilo cita | Abrir con el principio |
| 2 | ¿En quién confías ahora? | Diagrama: Tú → Exchange (confías) → Blockchain · Tú → Wallet ligera → Nodo de otro (confías) → Blockchain | Mostrar la dependencia |
| 3 | El riesgo de confiar | Escenarios: nodo de tercero comprometido, exchange mostrando saldo falso, wallet ligera recibiendo datos incorrectos | Sin alarmismo, pero claro |
| 4 | Con tu propio nodo | Diagrama: Tú → Tu nodo → Blockchain directamente · Sin intermediarios | Contraste visual con slide 2 |
| 5 | ¿Qué verificas exactamente? | Lista: Que la TX es real · Que el saldo es correcto · Que nadie hizo trampa · Que las reglas se cumplen | Beneficios concretos |
| 6 | Contribuyes a la red | Más nodos = más descentralización = más resistencia a censura | Beneficio colectivo |
| 7 | ¿Es obligatorio? | No. Puedes usar Bitcoin sin nodo propio. Pero con nodo = soberanía real | Honestidad — no exagerar |
| 8 | La diferencia | "Usar Bitcoin confiando en otros" vs "Usar Bitcoin con soberanía" | Cierre con la decisión |

---

**Quiz (3 preguntas):**

**P1:** ¿Qué significa "Don't trust, verify" en el contexto de Bitcoin?
- A) No confiar en nadie y no usar Bitcoin
- B) Verificar por ti mismo las transacciones y bloques en lugar de depender de terceros ✅
- C) No confiar en las criptomonedas
- D) Verificar la identidad de otros usuarios

**P2:** ¿Qué pasa cuando usas una wallet ligera sin tu propio nodo?
- A) Tus bitcoin desaparecen
- B) Dependes del nodo de otra persona para verificar tus transacciones ✅
- C) Es ilegal
- D) No puedes enviar transacciones

**P3:** ¿Por qué contribuye tu nodo a la seguridad de Bitcoin?
- A) Porque mina más bloques
- B) Porque aumenta la descentralización y la resistencia a la censura ✅
- C) Porque genera más bitcoin
- D) Porque hace las transacciones más rápidas

---
---

### LECCIÓN 1.3: Tipos de Nodos y Sus Funciones

**Objetivo:** El usuario conoce los diferentes tipos de nodos, sus diferencias, y puede identificar cuál le conviene.

**Contenido para lesson player (TipTap):**

No todos los nodos son iguales. Dependiendo de cómo los configures y qué funciones cumplan, existen varios tipos. Entenderlos te ayudará a decidir cuál tiene sentido para ti.

Un full node es un nodo que descarga y verifica toda la blockchain desde el primer bloque hasta el último. Mantiene una copia completa y puede verificar cualquier transacción de forma independiente. Es el tipo estándar y el más importante para la red.

Un pruned node (nodo podado) es un full node que, después de verificar toda la blockchain, elimina los bloques antiguos para ahorrar espacio en disco. Sigue verificando todo, pero no guarda el historial completo. Es ideal si tienes poco espacio de almacenamiento — un disco de 20-30 GB es suficiente en vez de cerca de un terabyte que ocupa hoy la cadena completa.

Un archival node es un full node que además sirve bloques antiguos a otros nodos que se están sincronizando. No todos los nodos necesitan ser archivales, pero son importantes para que nuevos nodos puedan descargar la blockchain.

Un mining node es un nodo conectado a software de minería. Además de verificar, participa activamente en la creación de nuevos bloques. Requiere hardware especializado (ASICs) y no es algo que la mayoría de usuarios necesite.

Para un usuario que quiere soberanía, un full node o un pruned node es más que suficiente. No necesitas minar ni servir bloques a otros — solo necesitas verificar por ti mismo.

---

**Guión de slides (10 slides):**

| # | Título del slide | Contenido visual | Notas |
|---|-----------------|------------------|-------|
| 1 | No todos los nodos son iguales | Iconos de 4 tipos de nodos | Abrir con variedad |
| 2 | Full Node | Definición + diagrama: descarga toda la blockchain, verifica todo, guarda todo | El estándar |
| 3 | Full Node — Números | Espacio: ~600+ GB · RAM: 2+ GB · Sincronización inicial: 1-3 días | Datos concretos |
| 4 | Pruned Node | Definición + diagrama: verifica todo, pero descarta bloques antiguos | Mismo nivel de verificación |
| 5 | Pruned Node — Números | Espacio: ~20-30 GB frente a cerca de 1 TB · Misma seguridad que full node · Ideal para hardware limitado | Alternativa práctica |
| 6 | Archival Node | Definición: full node + sirve bloques a otros nodos nuevos | Contribución a la red |
| 7 | Mining Node | Definición: nodo + software minería + ASIC · No necesario para usuarios normales | Mencionar pero no profundizar |
| 8 | Comparativa | Tabla: Full / Pruned / Archival / Mining → Espacio, Verificación, Contribución, Complejidad | Resumen visual |
| 9 | ¿Cuál necesitas? | Para soberanía personal: Full node o Pruned node · No necesitas minar · No necesitas servir bloques | Recomendación clara |
| 10 | Resumen | Full node = el estándar · Pruned = si tienes poco espacio · Los dos verifican igual | Cierre limpio |

---

**Quiz (3 preguntas):**

**P1:** ¿Qué hace un full node?
- A) Solo mina nuevos bloques
- B) Descarga y verifica toda la blockchain de forma independiente ✅
- C) Solo guarda tus transacciones personales
- D) Se conecta al servidor central de Bitcoin

**P2:** ¿Cuál es la diferencia principal entre un full node y un pruned node?
- A) El pruned node no verifica las transacciones
- B) El pruned node elimina bloques antiguos para ahorrar espacio, pero verifica igual ✅
- C) El full node es más seguro
- D) El pruned node necesita más espacio

**P3:** ¿Qué tipo de nodo es suficiente para un usuario que quiere soberanía personal?
- A) Solo un mining node
- B) Un full node o un pruned node ✅
- C) Solo un archival node
- D) Ninguno, basta con un exchange

---
---

## MÓDULO 2: Montando Tu Nodo
**Descripción:** Elige tu setup, instala tu nodo y aprende a mantenerlo correctamente.

---

### LECCIÓN 2.1: Hardware y Software — Elige Tu Setup

**Objetivo:** El usuario conoce las opciones de hardware y software disponibles y puede elegir la combinación que mejor le conviene.

**Contenido para lesson player (TipTap):**

Montar un nodo Bitcoin no requiere un ordenador potente. De hecho, una de las opciones más populares es una Raspberry Pi — un mini ordenador que cuesta entre 50 y 100 euros.

Para el hardware tienes varias opciones. La más accesible es reutilizar un ordenador viejo que ya tengas. Si tiene al menos 2 GB de RAM y espacio en disco suficiente (al menos 2 TB para un full node, o mucho menos para un pruned node), funciona perfectamente.

Durante años la opción más popular fue una Raspberry Pi con un SSD externo, pero con el tamaño que tiene hoy la cadena es cada vez menos práctica: la sincronización inicial es mucho más lenta y el disco por USB da problemas. Varios proyectos nacidos sobre esa placa, RaspiBlitz entre ellos, se instalan ya también en mini PC. Un mini PC de segunda mano con un SSD de 2 TB es hoy la opción equilibrada.

También puedes comprar un mini PC o un NUC de segunda mano. Más potente que una Raspberry Pi, pero también más caro y con mayor consumo energético.

En cuanto al software, hay dos caminos. El primero es Bitcoin Core directamente: el software original de Bitcoin. Es lo más purista, te da control total, pero requiere usar la línea de comandos para algunas cosas.

El segundo camino son los sistemas "nodo en caja" como Umbrel, Start9 o RaspiBlitz. Estos te dan una interfaz web bonita, instalación guiada, y además te permiten añadir aplicaciones extra (explorador de bloques, wallet, Lightning, etc.). Son la opción recomendada para la mayoría de usuarios que quieren montar un nodo sin complicarse.

No hay una respuesta correcta universal. Lo que importa es elegir un setup que puedas mantener a largo plazo.

---

**Guión de slides (10 slides):**

| # | Título del slide | Contenido visual | Notas |
|---|-----------------|------------------|-------|
| 1 | No necesitas un superordenador | Foto/icono de Raspberry Pi + texto: "Desde 50 euros" | Romper la barrera de entrada |
| 2 | Opción 1: Equipo que ya tengas | Requisitos mínimos: 2 GB RAM, 2 TB de disco (o mucho menos si pruned) · Ventaja: gratis si ya lo tienes | Reutilizar |
| 3 | Opción 2: Mini PC + SSD | Mini PC de bajo consumo + SSD de 2 TB · Mejor relación entre coste, rendimiento y mantenimiento | La opción equilibrada |
| 4 | Opción 3: Mini PC / NUC | Más potente · Más caro · Mayor consumo · Para quien quiera más rendimiento | Opción avanzada |
| 5 | Comparativa hardware | Tabla: PC viejo / Raspberry Pi / Mini PC → Coste, Potencia, Consumo, Facilidad | Resumen visual |
| 6 | Software: Bitcoin Core | El software original · Control total · Línea de comandos · Para puristas y técnicos | Camino 1 |
| 7 | Software: Umbrel, Start9, RaspiBlitz | Interfaz web · Instalación guiada · Apps extra (explorador, Lightning) · Para la mayoría | Camino 2 — recomendado |
| 8 | Comparativa software | Bitcoin Core (más control, más técnico) vs Umbrel/Start9 (más fácil, más funciones) | Sin recomendar uno — dar criterio |
| 9 | Combinaciones populares | Raspberry Pi + Umbrel · PC viejo + Bitcoin Core · Mini PC + Start9 | Ejemplos reales |
| 10 | Elige lo que puedas mantener | No importa el setup perfecto — importa uno que mantengas funcionando a largo plazo | Criterio de decisión real |

---

**Quiz (3 preguntas):**

**P1:** ¿Cuál es el requisito mínimo de almacenamiento para un full node Bitcoin?
- A) 100 GB
- B) 500 GB
- C) Al menos 2 TB ✅
- D) 10 TB

**P2:** ¿Qué ventaja tienen sistemas como Umbrel o Start9 frente a Bitcoin Core directo?
- A) Son más seguros
- B) Ofrecen una interfaz web fácil de usar y aplicaciones adicionales ✅
- C) Minan bitcoin automáticamente
- D) No necesitan disco duro

**P3:** ¿Qué criterio es más importante al elegir tu setup de nodo?
- A) Que sea el más caro posible
- B) Que uses exactamente lo mismo que todos los demás
- C) Que sea un setup que puedas mantener funcionando a largo plazo ✅
- D) Que tenga la mayor cantidad de aplicaciones posibles

---
---

### LECCIÓN 2.2: Instalación Paso a Paso

**Objetivo:** El usuario conoce el proceso de instalación de un nodo con Umbrel/Start9 y sabe qué esperar durante la sincronización.

**Contenido para lesson player (TipTap):**

En esta lección vamos a recorrer el proceso de instalación de un nodo Bitcoin usando un sistema como Umbrel o Start9. No vamos a cubrir Bitcoin Core en terminal porque eso es nivel advanced — aquí nos enfocamos en que montes tu nodo y lo pongas a funcionar.

El proceso general es el mismo independientemente del sistema que elijas. Primero, descargas la imagen del sistema operativo desde la web oficial del proyecto (umbrel.com o start9.com). Luego la grabas en una tarjeta microSD usando un programa como Balena Etcher. Insertas la microSD en tu Raspberry Pi (o el hardware que hayas elegido), conectas el disco SSD, el cable de red, y la alimentación.

Al encender, el sistema arranca automáticamente. Accedes a la interfaz web desde cualquier navegador en tu red local escribiendo la dirección que el sistema te indica (normalmente algo como umbrel.local o start9.local). Creas tu usuario y contraseña, y el sistema te guía para instalar la aplicación de Bitcoin.

Aquí viene la parte que requiere paciencia: la sincronización inicial. Tu nodo tiene que descargar y verificar toda la blockchain de Bitcoin desde el primer bloque. Esto puede tardar entre 2 y 7 días dependiendo de tu hardware y conexión a internet. Durante ese tiempo, tu nodo está trabajando — no lo apagues.

Un consejo práctico: si puedes, conecta tu nodo por cable Ethernet en vez de wifi. La sincronización inicial mueve muchos datos y una conexión estable marca la diferencia.

Una vez sincronizado, tu nodo está listo. Ya estás verificando transacciones por ti mismo.

---

**Guión de slides (10 slides):**

| # | Título del slide | Contenido visual | Notas |
|---|-----------------|------------------|-------|
| 1 | Manos a la obra | Icono de herramientas + "Instala tu nodo" | Inicio del proceso práctico |
| 2 | Lo que necesitas | Lista: Hardware listo · Tarjeta microSD · Cable Ethernet · Disco SSD conectado | Checklist antes de empezar |
| 3 | Paso 1: Descargar la imagen | Web oficial de Umbrel/Start9 → Descargar imagen → Grabar en microSD con Balena Etcher | Capturas o iconos del proceso |
| 4 | Paso 2: Conectar y encender | microSD en Raspberry Pi + SSD + Cable red + Alimentación → Encender | Diagrama de conexiones |
| 5 | Paso 3: Acceder a la interfaz | Navegador → umbrel.local o start9.local → Crear usuario y contraseña | Acceso desde cualquier dispositivo en tu red |
| 6 | Paso 4: Instalar Bitcoin | En la interfaz web → Tienda de apps → Instalar "Bitcoin Node" | Un clic |
| 7 | Sincronización inicial | 2-7 días · Descarga y verifica toda la blockchain · No apagar · Usar cable Ethernet | La parte que requiere paciencia |
| 8 | ¿Qué pasa durante la sincronización? | Tu nodo descarga cada bloque desde 2009 → Verifica cada transacción → Construye su propia copia | Entender qué está haciendo |
| 9 | Sincronización completada | Tu nodo está al día · Ya verificas transacciones · Ya eres soberano | Momento de satisfacción |
| 10 | Importante | Conectar por Ethernet · No apagar durante sincronización · Tener paciencia · El primer setup es el más lento | Consejos clave |

---

**Quiz (3 preguntas):**

**P1:** ¿Cuánto puede tardar la sincronización inicial de un nodo Bitcoin?
- A) 5 minutos
- B) Aproximadamente 2 a 7 días ✅
- C) Un mes
- D) Es instantánea

**P2:** ¿Qué hace tu nodo durante la sincronización inicial?
- A) Mina bitcoin
- B) Descarga y verifica toda la blockchain desde el primer bloque ✅
- C) Crea una wallet automáticamente
- D) Se conecta a un servidor central

**P3:** ¿Por qué se recomienda usar cable Ethernet en vez de wifi para la sincronización?
- A) Porque el wifi no funciona con Bitcoin
- B) Porque la conexión por cable es más estable y la sincronización mueve muchos datos ✅
- C) Porque es obligatorio
- D) Porque el wifi consume más bitcoin

---
---

### LECCIÓN 2.3: Mantenimiento y Buenas Prácticas

**Objetivo:** El usuario sabe cómo mantener su nodo funcionando correctamente a largo plazo, incluyendo actualizaciones, privacidad, y qué hacer si algo falla.

**Contenido para lesson player (TipTap):**

Montar un nodo es el primer paso. Mantenerlo es lo que realmente cuenta. Un nodo que funciona una semana y luego se apaga no te aporta nada. Aquí tienes lo que necesitas saber para que tu nodo funcione de forma fiable a largo plazo.

Actualizaciones: tanto el software del nodo (Bitcoin Core) como el sistema (Umbrel, Start9) publican actualizaciones periódicas. Estas incluyen mejoras de rendimiento, correcciones de seguridad, y nuevas funciones. Actualiza cuando haya versiones estables disponibles, pero no te obsesiones con estar siempre en la última versión al minuto. Lee las notas de la actualización antes de aplicarla.

Espacio en disco: la blockchain crece aproximadamente 50-80 GB al año. Si tienes un disco de 1 TB, tienes espacio para varios años. Si tu disco se llena, puedes activar el modo pruned para ahorrar espacio, o migrar a un disco más grande.

Privacidad con Tor: por defecto, tu nodo se conecta a otros nodos usando tu dirección IP, lo que revela que estás ejecutando un nodo Bitcoin. Tanto Umbrel como Start9 permiten configurar Tor para que tu nodo se conecte de forma anónima. Es recomendable activar esta opción si valoras tu privacidad.

Qué hacer si algo falla: si tu nodo se apaga inesperadamente (corte de luz, error de software), simplemente enciéndelo de nuevo. En la mayoría de casos, el nodo se sincroniza automáticamente desde donde lo dejó. Si la base de datos se corrompe (raro pero posible), puedes reiniciar la sincronización desde cero — no pierdes bitcoin, solo tiempo.

Tu nodo no guarda bitcoin. Tus fondos están en tu wallet (protegidos por tu seed phrase). El nodo solo verifica. Si tu nodo se rompe, tus bitcoin siguen a salvo.

---

**Guión de slides (10 slides):**

| # | Título del slide | Contenido visual | Notas |
|---|-----------------|------------------|-------|
| 1 | Montarlo es el primer paso | Texto: "Mantenerlo es lo que cuenta" | Transición al largo plazo |
| 2 | Actualizaciones | Periódicas · Lee las notas · Actualiza versiones estables · No obsesionarse | Rutina, no urgencia |
| 3 | Espacio en disco | Blockchain crece ~50-80 GB/año · 1 TB = varios años · Opción pruned si se llena | Dato concreto y solución |
| 4 | Privacidad: Tor | Sin Tor: tu IP es visible como nodo Bitcoin · Con Tor: conexión anónima · Umbrel/Start9 lo soportan | Recomendación clara |
| 5 | Si algo falla | Corte de luz → reinicia → se sincroniza solo · Corrupción → resincronizar desde cero (raro) | Sin drama |
| 6 | Tu nodo NO guarda bitcoin | Tu nodo verifica · Tu wallet guarda · Si el nodo se rompe, tus bitcoin están a salvo con tu seed | Disipar el miedo principal |
| 7 | Checklist mensual | ¿Nodo funcionando? ¿Espacio en disco? ¿Actualizaciones pendientes? ¿Tor activo? | Mantenimiento mínimo |
| 8 | Qué NO hacer | No exponer a internet sin protección · No ignorar actualizaciones de seguridad · No apagar constantemente | Errores comunes |
| 9 | El coste real de un nodo | Electricidad: 5-15 euros/año (Raspberry Pi) · Tiempo: 10 min/mes de mantenimiento · Internet: el que ya tienes | Desmitificar el coste |
| 10 | Resumen del curso | Qué es un nodo → Por qué importa → Tipos → Hardware/Software → Instalación → Mantenimiento · Ya eres soberano | Cierre con sentido de logro |

---

**Quiz (3 preguntas):**

**P1:** ¿Qué pasa con tus bitcoin si tu nodo se rompe o deja de funcionar?
- A) Los pierdes para siempre
- B) Se transfieren automáticamente a un exchange
- C) Nada — tus bitcoin están protegidos por tu seed phrase, no por tu nodo ✅
- D) Se congelan hasta que repares el nodo

**P2:** ¿Por qué es recomendable usar Tor en tu nodo?
- A) Para que funcione más rápido
- B) Para que tu dirección IP no revele que ejecutas un nodo Bitcoin ✅
- C) Porque es obligatorio
- D) Para minar más bitcoin

**P3:** ¿Cuánto crece aproximadamente la blockchain de Bitcoin al año?
- A) 1-2 GB
- B) 50-80 GB ✅
- C) 500 GB
- D) No crece

---
---

## RESUMEN DE PRODUCCIÓN

| Lección | Slides | Quiz | Tiempo producción |
|---------|--------|------|-------------------|
| 1.1 El Rol de los Nodos | 8 | 3 | ~50 min |
| 1.2 Soberanía sin Intermediarios | 8 | 3 | ~50 min |
| 1.3 Tipos de Nodos | 10 | 3 | ~60 min |
| 2.1 Hardware y Software | 10 | 3 | ~60 min |
| 2.2 Instalación Paso a Paso | 10 | 3 | ~60 min |
| 2.3 Mantenimiento y Buenas Prácticas | 10 | 3 | ~60 min |
| **TOTAL** | **56 slides** | **18 preguntas** | **~5-6 horas** |

---

## DATOS PARA ADMIN PANEL

### Ruta (nueva)
```
Nombre: Bitcoin Técnico
Slug: bitcoin-tecnico
Emoji: ⚙️
Descripción: Entiende cómo funciona Bitcoin por dentro y aprende a participar activamente en la red.
Posición: 5
```

### Curso
```
Título: Nodos Bitcoin — Tu Soberanía Técnica
Slug: nodos-bitcoin-tu-soberania-tecnica
Nivel: intermediate
Descripción: Entiende qué es un nodo Bitcoin, por qué te hace soberano, y cómo montar el tuyo sin ser programador.
Premium: false
Status: draft
```

### Módulo 1
```
Título: ¿Por Qué un Nodo Propio?
Descripción: Entiende el rol de los nodos en Bitcoin y por qué ejecutar uno te convierte en un participante soberano de la red.
Orden: 1
```

### Módulo 2
```
Título: Montando Tu Nodo
Descripción: Elige tu setup, instala tu nodo y aprende a mantenerlo correctamente.
Orden: 2
```

### Lecciones
```
M1-L1: El Rol de los Nodos en Bitcoin (orden: 1)
M1-L2: Soberanía sin Intermediarios (orden: 2)
M1-L3: Tipos de Nodos y Sus Funciones (orden: 3)
M2-L1: Hardware y Software — Elige Tu Setup (orden: 1)
M2-L2: Instalación Paso a Paso (orden: 2)
M2-L3: Mantenimiento y Buenas Prácticas (orden: 3)
```

---

## SQL DIRECTO PARA SUPABASE

**NOTA:** Los INSERTs están separados para evitar problemas con el SQL Editor de Supabase. Ejecutar uno por uno en orden.

### Paso 1 — Learning Path "Bitcoin Técnico":
```sql
INSERT INTO learning_paths (slug, name, emoji, short_description, position, is_active)
VALUES ('bitcoin-tecnico', 'Bitcoin Tecnico', '⚙️', 'Entiende como funciona Bitcoin por dentro y aprende a participar activamente en la red.', 5, true)
ON CONFLICT (slug) DO NOTHING;
```

### Paso 2 — Curso:
```sql
INSERT INTO courses (slug, title, description, long_description, level, status, price, is_free, is_premium, total_modules, total_lessons, total_duration_minutes)
VALUES ('nodos-bitcoin-tu-soberania-tecnica', 'Nodos Bitcoin - Tu Soberania Tecnica', 'Entiende que es un nodo Bitcoin, por que te hace soberano, y como montar el tuyo sin ser programador.', 'Cada vez que usas un exchange o una wallet ligera, estas confiando en el nodo de otro para verificar tus transacciones. En este curso aprenderas por que eso importa, que tipos de nodos existen, y como montar tu propio nodo para verificar todo por ti mismo.', 'intermediate', 'draft', 0, true, false, 2, 6, 150)
ON CONFLICT (slug) DO NOTHING;
```

### Paso 3 — Obtener IDs:
```sql
SELECT 'learning_path' as tabla, id FROM learning_paths WHERE slug = 'bitcoin-tecnico'
UNION ALL
SELECT 'course', id FROM courses WHERE slug = 'nodos-bitcoin-tu-soberania-tecnica';
```

*Con esos IDs, reemplazar en los INSERTs siguientes.*
