# PROMPT MAESTRO - PROYECTO NODO360

**Version:** 6.0
**Fecha:** 25/09/2026 (cifras recontadas al cierre de la tanda)
**Sustituye a:** v5.0 (22/09/2026)

> **Por que existe esta version.** La v5.0 documentaba una plataforma con 13
> cursos publicados cuya leccion mediana tenia **1.748 caracteres**. Hoy hay 9
> cursos publicados y la mediana es **6.073**. Entre una cosa y otra se
> reescribieron cinco cursos enteros, se fusionaron seis en tres, se archivaron
> cinco, se creo el que faltaba y se cerro la RLS de cuatro tablas. Esta version
> describe el resultado.
>
> Ninguna cifra viene de la v5.0. Todas se han vuelto a contar contra el
> repositorio y la base de datos el 25/09/2026. Cuando un dato no se ha podido
> verificar, se dice.
>
> **Las dos lecciones de esta tanda.** La primera: *la base de datos puede quedar
> coherente consigo misma y el sitio estar roto*. Restaurar un respaldo sin
> `slug` dejo cinco URLs sirviendo una leccion que no era la suya, y ninguna
> comprobacion de integridad lo habria detectado.
>
> La segunda: *lo que no se puede datar, no se puede investigar*. Las politicas
> de RLS creadas desde el panel no estan en ninguna migracion, asi que cuando se
> encontro una fuga de correos no hubo forma de saber desde cuando existia.

---

## MISION DEL PROYECTO

**Nodo360** es una plataforma educativa en espanol sobre Bitcoin, Blockchain y
Web3.

**Objetivo a medio plazo**: cubrir **Web3 completo con Bitcoin como eje**. No se
trata de dos catalogos separados, sino de una progresion: quien entiende Bitcoin
tiene la base conceptual (escasez, consenso, custodia, verificacion sin confiar)
para entender todo lo demas, y quien llega por Ethereum o DeFi debe poder
retroceder a esa base.

**Lo que hace la plataforma hoy**:
- Cursos estructurados (curso -> modulos -> lecciones) con progreso por usuario
- Examen final por curso con correccion en servidor
- Certificados verificables por URL publica
- Gamificacion (XP, insignias, niveles)
- Gobernanza con propuestas y votacion
- Mensajeria 1:1 entre usuarios, con moderacion
- Blog y glosario propios

**Propuesta de valor verificable**: cursos gratuitos, en espanol, organizados en
rutas, con certificado verificable al completarlos. Nada mas. Cualquier
afirmacion mas ambiciosa tiene que salir de la base de datos antes de publicarse.

---

## PRINCIPIOS FUNDACIONALES

> **Aviso de trazabilidad.** El listado canonico numerado de los Principios
> Fundacionales **no esta en este documento ni en ningun archivo del
> repositorio**. Se buscaron en `docs/`, en la raiz del workspace y en el resto
> del repo: solo aparecen *citados por numero* en `docs/PLAN-REFORMA.md` y en
> `docs/content/curso-cold-storage-completo.md`. Abajo se reproducen los cuatro
> que se pueden acreditar por esas citas y por instrucciones directas. **Faltan
> los demas: hay que pegar el listado completo aqui.** No se inventan.

| # | Principio | Donde consta |
|---|-----------|--------------|
| 1 | No emitir juicios de inversion ni promesas de rentabilidad | Instruccion directa, 21/09/2026 |
| 2 | No recomendar marcas concretas; comparar y dejar decidir | `curso-cold-storage-completo.md:111` |
| 4 | Lo que no se pueda verificar retroactivamente no se da por bueno | `PLAN-REFORMA.md:25` (certificados) |
| 7 | Honestidad: no anunciar lo que no existe ni inflar lo que si | `PLAN-REFORMA.md:12`, `curso-...:112` |

---

## METRICAS REALES (25/09/2026)

Todas contadas, no estimadas. Entre parentesis, lo que decia la version anterior
cuando el dato ha cambiado.

### Codigo

| Metrica | Valor | Como se cuenta |
|---------|-------|----------------|
| Paginas (`page.tsx`) | **106** | `find app -name page.tsx` (sin cambio desde la v5.0) |
| Layouts | 6 | `find app -name layout.tsx` |
| Endpoints API (`route.ts`) | **98** | de ellos **33** bajo `/api/admin` (v5.0: 94) |
| Componentes `.tsx` | **181** | en 28 carpetas bajo `components/` (v5.0: 175 en 25) |
| Modulos `lib/` | **99** archivos `.ts` | en 26 subcarpetas (v5.0: 95) |
| Archivos de tipos | 9 | `types/*.ts` |
| Scripts | 46 | `scripts/*.{mjs,ts,js}` |
| Commits en `main` | **211** | v5.0: 147 |
| Ramas remotas | 28 | incluye ramas muertas por limpiar |
| Redirecciones 301 | **96** | `next.config.ts`; 48 son de la 052 |

### Base de datos (Supabase, proyecto `gcahtbecfidroepelcuw`)

Contado sobre el esquema `public` expuesto por PostgREST, no sobre lo que el
codigo espera encontrar.

| Metrica | Valor |
|---------|-------|
| Tablas existentes | **80** (v3.0 decia "38+ tablas core") |
| Vistas | 2 (`instructor_referral_stats`, `message_flags_summary`) + `user_incident_summary` |
| Funciones RPC expuestas | **65** (v3.0 decia "27+") |
| Migraciones en `supabase/migrations/` | **48** (v5.0: 34) |
| Migraciones en `docs/migrations/` | **6** (carpeta paralela, ver Deuda) |
| Filas en las 36 tablas con uso real | **915** |
| Tablas comprobadas que estan vacias | **11** de 36 |

### Contenido: el catalogo, al 25/09/2026

**5 rutas activas · 9 cursos publicados · 72 lecciones · 465.667 caracteres ·
216 preguntas de quiz.** Contado sobre `lessons.content` sin etiquetas HTML el
25/09/2026, al cierre de la tanda.

| Ruta | Curso | Lec | Caracteres | Preg |
|---|---|---|---|---|
| **1. Fundamentos de Bitcoin** <br><sub>`fundamentos-bitcoin`</sub> | Fundamentos de Bitcoin | 9 | 52.477 | 27 |
| | Como funciona Bitcoin (nivel basico) | 6 | 38.245 | 18 |
| | Uso practico de Bitcoin | 9 | 53.768 | 27 |
| **2. Seguridad en Criptomonedas** <br><sub>`seguridad-cripto`</sub> | Seguridad basica en Bitcoin y criptomonedas | 9 | 54.851 | 27 |
| | Cold Storage — Protege tus Bitcoin | 6 | 58.867 | 18 |
| **3. Web3 Basica** <br><sub>`web3-basica`</sub> | Blockchain: lo que Bitcoin no es | 9 | 56.200 | 27 |
| | Que es Web3 y que no | 9 | 54.929 | 27 |
| **4. Trading Basico** <br><sub>`trading-basico`</sub> | Trading: que es y por que casi nadie gana | 9 | 50.205 | 27 |
| **5. Bitcoin Tecnico** <br><sub>`bitcoin-tecnico`</sub> | Nodos Bitcoin - Tu Soberania Tecnica | 6 | 46.125 | 18 |

**Longitud de leccion en cursos publicados** (n=63):

| | v5.0 (22/09) | v6.0 (25/09) |
|---|---|---|
| Lecciones publicadas | 66 | **72** |
| Minimo | 857 | **5.151** |
| Mediana | 1.748 | **6.073** |
| Maximo | 12.371 | 12.015 |
| Por debajo de 3.000 caracteres | la mayoria | **0** |
| Entre 5.000 y 7.000 | — | **61 de 72** |

**El orden de Web3 Basica importa y es deliberado**: `fundamentos-blockchain` va
en **posicion 0** y `introduccion-a-web3` en la 1. El primero explica el suelo
—que es un registro compartido, que es un estado, que cuesta mantenerlo— y el
segundo lo que se construye encima. La ficha del primero declara su propio
requisito previo: haber hecho *Como funciona Bitcoin*.

Los seis cursos reescritos o creados en esta tanda tienen la misma forma: 3
modulos, 9 lecciones de 5.000-7.000 caracteres y 27 preguntas. Los tres que
conservan la estructura antigua —**Como funciona Bitcoin**, **Cold Storage** y
**Nodos Bitcoin**— tienen 6 lecciones y 18 preguntas. Es la diferencia que queda
pendiente, y ahora es de tres cursos sobre nueve.

**5 cursos archivados**, todos por fusion y ninguno por retirada de contenido:

| Curso archivado | Absorbido por | Migracion |
|---|---|---|
| `bitcoin-como-sistema-monetario` | Fundamentos de Bitcoin | 045 |
| `custodia-y-proteccion-de-tus-fondos` | Seguridad basica | 048 |
| `custodia-y-proteccion-practica-de-criptomonedas` | Seguridad basica | 048 |
| `ecosistema-web3-explicado` | Que es Web3 y que no | 052 |
| `gestion-del-riesgo-y-mentalidad-en-trading` | Trading: que es y por que casi nadie gana | 052 |

El criterio fue el mismo las tres veces: **cuando dos cursos cubren lo mismo con
distinto nombre, se queda el que tiene mas recorrido —mas matriculas y mas
certificados— y absorbe al otro**. El absorbido pasa a `archived`, no se borra,
y cada una de sus URLs recibe una redireccion 301 a la leccion que trata ese
mismo tema. Sus certificados siguen siendo validos y verificandose.

**Fuera de los cursos:** 16 articulos de blog (`lib/blog-data.ts`) y 73 terminos
de glosario (`lib/glossary-data.ts`).

### Usuarios y actividad

| Metrica | Valor |
|---------|-------|
| Usuarios | **23** |
| — por rol | 20 `student`, 1 `mentor`, 1 `admin`, 1 `instructor` |
| — suspendidos | 0 |
| Inscripciones (`course_enrollments`) | **42**, de ellas 17 completadas, de 15 usuarios distintos |
| Lecciones completadas (`user_progress`) | **112** |
| Certificados emitidos (`certificates`) | **17**, los 17 de tipo `course` (v5.0: 16) |
| Intentos de quiz de modulo | **16**, 15 aprobados |
| Intentos de examen final | **0** |
| Eventos de XP | 219 · XP maximo 5.068 · nivel maximo 4 |
| Insignias definidas / concedidas | 9 / 27 |
| Entitlements (acceso premium) | **0** |
| Suscripciones | 1 |
| Compras de curso | 0 |
| Mensajes / conversaciones | 12 / 1 |
| Comentarios en lecciones | **0** |
| Propuestas de gobernanza / votos | 1 / 1 — **la unica propuesta esta `cancelled` desde 11/2025**, por eso /gobernanza muestra el estado vacio |
| Aplicaciones a mentor | 0 |
| Invitaciones | 0 |
| Feedback de beta | 6 |

> **Lectura honesta de estas cifras**: 23 usuarios y 17 certificados, de los que
> 13 se emitieron **antes** del arreglo de validacion del quiz del 20/09/2026.
> No hay forma de saber cuales se ganaron respondiendo preguntas
> (`course_final_quiz_attempts` sigue a 0). Decision de producto pendiente.
>
> Y **10 matriculas completadas muestran un porcentaje por debajo del 100%**
> (entre 11% y 67%). No es un error: los cursos crecieron de 6 a 9 lecciones y se
> aplico la postura de la regla 25 —el certificado congela, el porcentaje refleja
> el presente—. Cuatro de esas matriculas son un caso distinto, anotado en el
> plan: su progreso nunca llego a registrarse entero.

### Despliegue

| | Valor |
|---|---|
| Commit servido | `d8d16cb` (PR #187), rama `main`, `source: git` |
| Plan de Vercel | **Hobby** — sin Log Drains, sin historico de registros (ver Pendiente) |
| Node / npm locales | v24.11.0 / 11.6.1 |
| `next` / `react` | ^16.3.5 / 19.2.0 |
| Dependencias | 30 de produccion, 13 de desarrollo |
| `npm audit --omit=dev` | **0 criticas**, **2 altas**, **5 moderadas** (sin cambios desde la v4.0: siguen sin resolverse) |

---

## ESTADO REAL DE CADA SISTEMA

La v3.0 marcaba diez sistemas como "COMPLETADO". Revisados uno a uno, la realidad
tiene tres categorias.

### A. Funciona y esta en produccion

| Sistema | Evidencia |
|---------|-----------|
| Autenticacion | Magic link, password y OAuth (Google, GitHub) operativos |
| Cursos, modulos y lecciones | 11 cursos publicados, 78 lecciones servidas |
| Progreso e inscripciones | 28 inscripciones, 91 lecciones completadas |
| Gamificacion | XP e insignias con datos reales |
| Certificados | 13 emitidos, verificables en `/certificados/[id]` |
| Examen final del curso | Correccion **server-side** desde el 20/09/2026 |
| Gobernanza | 1 propuesta y 1 voto reales; paginas publicas y formularios funcionando |
| Mensajeria 1:1 | 12 mensajes, moderacion con flags y reportes activa |
| Blog y glosario | 15 articulos, 72 terminos, estaticos en `lib/` |
| Panel de admin | 33 endpoints bajo `/api/admin` |
| Rutas de aprendizaje | 6 activas, paginas `/rutas` y `/rutas/[slug]` |

### B. Backend completo, sin interfaz

| Sistema | Situacion |
|---------|-----------|
| **Proyectos comunitarios (Phase 27)** | Las 4 tablas existen desde el 21/09/2026 (migracion 023 aplicada, con RLS y privilegios revisados). Hay 11 rutas API bajo `/api/projects/*` y todo `lib/projects/`. **La unica pagina es `/proyectos`, que explica que el espacio esta "en preparacion"**: no hay formulario de propuesta, ni listado, ni panel de revision para mentores. Tablas a 0 filas. |
| **Entitlements / premium** | Tabla, API de admin y gating server-side listos. **0 entitlements y 0 compras**: nunca se ha ejercitado en real. `check_project_eligibility()` exige `full_platform`, asi que hoy nadie es elegible para crear proyectos. |
| **Certificacion de instructores** | 1 perfil de instructor, **0 certificaciones emitidas**. Examenes y modelos existen; el flujo no se ha completado nunca de principio a fin. |

### C. A medias, desactivado o eliminado

| Sistema | Situacion |
|---------|-----------|
| **Invitaciones** | Endpoints `/api/invites/validate` y `/consume` existen y estan endurecidos (el rol se aplica al usuario de la sesion). Hay panel en `/admin/invitaciones`. **Pero el registro no las usa** ("beta abierta") y la funcion `validateAndConsumeInvite` de `login/actions.ts` **esta marcada en el codigo como no funcional**: hace un fetch de servidor a servidor que no reenvia cookies, asi que recibiria 401. 0 invitaciones en BD. |
| **Mentoria 1:1** | El formulario de solicitud se retiro de `/mentoria` en enero de 2026 (PR #54) y el componente se borro el 21/09/2026: escribia en `mentorship_requests`, una tabla que nunca existio. `/mentoria` es hoy una pagina informativa con enlaces. **No hay forma de solicitar mentoria.** |
| **Newsletter** | **Eliminado el 21/09/2026.** El formulario no estaba renderizado en ninguna pagina desde su creacion y escribia en `newsletter_subscribers`, tabla inexistente. Se borraron componente, endpoint, SQL y documentacion. |
| **Comentarios en lecciones** | Tabla, API y componente existen y estan integrados en el reproductor. **0 comentarios**: funcional pero sin uso. |
| **Aplicaciones a mentor** | Flujo completo con votacion del consejo. **0 aplicaciones.** 1 mentor, asignado a mano. |
| **Paginas de depuracion en produccion** | `/debug-env`, `/test-quiz` y `/test-supabase` se sirven publicamente. Pendiente decidir si se protegen o se borran. |

---

## ROADMAP

### Fase actual: saneamiento (en curso, desde el 20/09/2026)

Cerrar los agujeros de seguridad y eliminar lo que la web afirma y no puede
sostener. La mayor parte esta hecha; lo que queda vive en `docs/PLAN-REFORMA.md`.

### Siguiente: contenido

El catalogo real son **11 cursos publicados, todos de nivel principiante y todos
sobre Bitcoin o Web3 introductorio**. No hay ningun curso intermedio publicado.
Los dos que existen estan en borrador.

Orden de trabajo, tomado del Tier 1-3 del plan:
1. Publicar Cold Storage y Nodos Bitcoin (borradores con contenido ya escrito)
2. Fusionar los cursos duplicados (2 de custodia, 2 de "Web3 basico")
3. Construir los cursos ausentes del mapa Web3

### Mapa de rutas

**5 rutas activas**, verificado el 25/09/2026. La coleccion de cursos de cada una
esta arriba, en Contenido.

| # | Ruta | Slug | Subtitulo | Cursos |
|---|------|------|-----------|--------|
| 1 | Fundamentos de Bitcoin | `fundamentos-bitcoin` | Empieza desde cero y construye una base solida | 3 |
| 2 | Seguridad en Criptomonedas | `seguridad-cripto` | De no perderlo por un descuido a no perderlo nunca | 2 |
| 3 | Web3 Basica | `web3-basica` | Entender antes de usar | 1 |
| 4 | Trading Basico | `trading-basico` | Decidir antes de operar | 1 |
| 5 | Bitcoin Tecnico | `bitcoin-tecnico` | Verifica por ti mismo, sin intermediarios | 1 |

Eran 6 en la v5.0. **Seguridad Avanzada desaparecio en la 048**: su unico curso,
Cold Storage, paso a Seguridad en Criptomonedas, que ahora cubre el recorrido
entero desde los habitos basicos hasta el almacenamiento sin conexion. Queda una
301 desde `/rutas/seguridad-avanzada`. Con ella se fue tambien la colision de
`position` que la v5.0 anotaba entre esa ruta y Trading Basico.

**Areas ausentes** que el Tier 3 del plan identifica: Fundamentos de Blockchain ·
Ethereum y Smart Contracts · DAOs · NFTs · DeFi · Otras L1/L2 e Interoperabilidad.

> **El mapa canonico de 8 rutas sigue sin estar registrado en el repositorio.**
> Se ha vuelto a buscar y no aparece. Cinco rutas mas seis areas ausentes no
> suman ocho. **Hay que pegar aqui el mapa tal y como esta decidido**; no se
> reconstruye por deduccion.

---

## ESTANDAR DE CONTENIDO

**Una leccion son 5.000-7.000 caracteres visibles.** Es el rango con el que se
han escrito las 45 lecciones de los cinco cursos reescritos, y en el caben 52 de
las 63 lecciones publicadas. Se mide sobre `lessons.content` sin etiquetas HTML.

El rango anterior de la v5.0 —8.000-12.000, tomado de *Nodos Bitcoin 1.1*— era
la medida de una leccion tecnica excepcionalmente larga, no la de una leccion
tipica. Escribir nueve seguidas a esa longitud produce cursos que nadie termina.

**El rango es orientativo, no un limite.** Marca el orden de magnitud de una
leccion intermedia, no una horquilla que haya que cumplir. Las lecciones que
concentran el material mas denso de un curso pueden superarlo si el contenido lo
sostiene: es normal que una o dos por curso carguen con lo que las demas
presuponen.

Lo que no se admite son las dos formas de forzar la cifra:

- **Rellenar para llegar al minimo.** Alargar con repeticiones, parrafos de
  transicion vacios o recapitulaciones que no aportan. Si un tema se agota en
  6.000 caracteres bien escritos, la leccion son 6.000 caracteres.
- **Trocear para no pasarse.** Partir una explicacion en dos lecciones solo para
  que ninguna exceda el rango, dejando media idea en cada una. Si el material
  pide 14.000 caracteres seguidos, se escriben.

La prueba no es la cifra, es si cada bloque responde a algo que el alumno
necesita saber ahi. Cuando una leccion se pasa de largo, la pregunta correcta no
es «como la recorto» sino «sobra algo». Si no sobra nada, se queda como esta y
se anota por que.

Distancia respecto al catalogo actual (21/09/2026): la mediana de una leccion
publicada es de **1.785 caracteres**, es decir, alrededor de una sexta parte de
la referencia. De 78 lecciones, **12 llegan a 8.000** y solo **3 pasan de
12.000**; la mas larga son 14.243. El problema del catalogo no es que algunas
lecciones se pasen: es que la mayoria se queda muy corta.

**El cuello de botella no es generar el texto, es verificarlo.** Escribir una
leccion de 10.000 caracteres es rapido; comprobar cada dato que contiene no lo
es. Por eso:

- Todo dato que caduca (tamanos de la blockchain, versiones de software,
  requisitos de hardware, tiempos de sincronizacion, comisiones) se marca y se
  registra con fecha de ultima revision. Esto afecta a `lessons` **y a
  `quiz_questions`**, donde tambien hay cifras que envejecen.
- Los comentarios HTML del tipo `<!-- REVISAR -->` **no sirven** como registro:
  no sobreviven a una edicion desde TipTap, y en `quiz_questions` no hay donde
  ponerlos.
- Una leccion no se publica con datos sin verificar, aunque este escrita.

---

## PENDIENTE

El inventario completo vive en **`docs/PLAN-REFORMA.md`**, por Tier 0-3. Aqui
solo lo que manda al 25/09/2026.

### El hueco principal: los cinco cursos que faltan de Tier 3

**Fundamentos Blockchain ya existe** (migracion 055, 25/09/2026), asi que la ruta
Web3 Basica tiene suelo por primera vez: *Blockchain: lo que Bitcoin no es*
explica que es un registro compartido y que es un estado, y *Que es Web3 y que
no* lo que se construye encima.

Lo que queda por delante, en el orden del Tier 3:

| Curso | Semilla ya escrita |
|---|---|
| Ethereum y Smart Contracts | Leccion 2.2 de Web3 mas un articulo de blog |
| DAOs | El subsistema de gobernanza propio; resuelve la contradiccion de `/proyectos` |
| NFTs | Leccion 2.3 de Web3 mas un articulo de blog |
| DeFi | Dos articulos de blog y 11 terminos de glosario |
| Otras L1/L2 e Interoperabilidad | Leccion 3.2 de Blockchain (capas y puentes) mas un articulo |

Los cinco tienen ya la base conceptual que les faltaba. Y dos huecos que el
propio curso nuevo reconoce por escrito en su ultima leccion, sin prometer
fechas: **la criptografia que hay debajo** —como funciona una firma, como se
construye una funcion de huella— y **como se programa nada de esto**.

### Tres cursos con la estructura antigua

Cinco cursos tienen 3 modulos, 9 lecciones de 5.000-7.000 caracteres y 27
preguntas. Estos tres no:

| Curso | Estado |
|---|---|
| Como funciona Bitcoin (nivel basico) | 6 lecciones, 18 preguntas, 38.299 car. Reescrito en la 043, pero con la forma anterior |
| Cold Storage — Protege tus Bitcoin | 6 lecciones, 18 preguntas, 58.867 car. El mas largo del catalogo |
| Nodos Bitcoin - Tu Soberania Tecnica | 6 lecciones, 18 preguntas, 46.125 car. |

No es urgente: los tres tienen contenido suficiente y ninguno miente. Es
coherencia: el alumno que recorre una ruta se encuentra dos formas distintas de
curso sin motivo aparente.

### La decision sobre los registros

**Vercel esta en plan Hobby, y ahi los registros de ejecucion son una ventana en
vivo, no un archivo: los Log Drains no estan disponibles.** No es que esten mal
configurados; no se pueden configurar.

Consecuencia concreta, ya pagada una vez: cuando se encontro la fuga de correos
del leaderboard no hubo forma de saber si alguien la habia aprovechado en diez
meses. Los registros de API de Supabase duran 1 dia en gratuito y 7 en Pro, y la
aplicacion no audita lecturas.

Las dos salidas, para decidir a proposito y no por omision:

- **Subir a Vercel Pro** y configurar un Log Drain al almacenamiento mas barato.
- **Auditar en la propia base** los accesos a las rutas que sirven datos
  personales. Mas trabajo, pero no depende del plan.

Ninguna urge con 23 usuarios. Las dos urgiran el dia que haya datos de pago.

### Lo demas, en el plan

- **Tier 0**: CI en las PRs (existe el workflow `verificar`; falta que cubra
  tambien los push directos a `main`), la decision sobre los 13 certificados
  anteriores al arreglo del quiz, y que la RLS de `lessons` permita leer el
  contenido de cualquier curso via API aunque la web no lo sirva.
- **Tier 2**: unificar las dos carpetas de migraciones, decidir sobre
  `user_lesson_progress` (0 filas) frente a `user_progress`, la ronda de
  aplicacion de la regla 24 sobre los embeds existentes, y el esquema
  `backup_nodo360` con su copia de `users`.
- **Tier 3**: los seis cursos que faltan para cubrir Web3.

### Lo que esta tanda dejo abierto

| Deuda | Estado |
|---|---|
| **La 053 sin aplicar ni mergear** | Su commit quedo huerfano al hacer squash de la rama. Migracion y cambio de codigo listos, fuera de `main` |
| **Los certificados guardan el titulo antiguo del curso** | Tras la 052, cuatro acreditan «Introduccion al trading…» y su curso se llama ya otra cosa. La 053 fija el criterio: manda el guardado. Hoy son 4; decidir antes de que sean cuarenta |
| **4 matriculas al 100% con progreso incompleto** | Tres en *Gestion del riesgo* (3 de 6) y una en *Introduccion al trading* (5 de 6), con certificado de enero en formato antiguo. La 047 las dejo sin tocar a proposito: no hay contenido nuevo que consumir |
| **7 matriculas huerfanas en cursos archivados** | Sus tarjetas desaparecen del panel sin explicacion. Falta decidir el trato por defecto: matricular en el curso que absorbe, avisar de la fusion, o aceptar la perdida silenciosa |
| **8 remisiones muertas tras las fusiones** | Cerradas en la 054, y `scripts/comprobar-remisiones.mjs` deja la comprobacion repetible. De aqui sale la regla 30 |
| **Codigo muerto con ruta viva** | `components/gamification/Leaderboard.tsx` no lo importa nadie desde 2025 y su endpoint seguia publicado devolviendo datos personales. Los dos son candidatos a borrarse enteros |
| **Los contadores de curso se escriben a mano** | `courses.total_modules` y `total_lessons` los fija cada migracion. Hoy cuadran; nada lo garantiza. `modules.total_lessons` vale 0 en casi todas las filas y se pinta igual |
| **Los tipos generados estan desfasados** | `courses.status` no incluye `pending_review` aunque la base lo use desde la 030. Con el cliente de servicio, que si va tipado, hay que comparar como texto |
| **7 vulnerabilidades de produccion** | 2 altas y 5 moderadas, sin resolver desde la v4.0. `npm audit --omit=dev --audit-level=high` pasa en el CI porque la alta que queda esta en `sharp`, que es `devDependency` |
| **569 de 588 eventos de XP sin fuente** | Los que siguen sin `related_id` no se pueden auditar ni proteger con el indice unico. Y en Postgres los nulos no colisionan, asi que permiten pagar XP dos veces por la misma leccion |
| **Fugas de lectura sin rastro** | Vale para las funciones `SECURITY DEFINER` abiertas hasta el 22/09 y para los correos del leaderboard hasta el 25/09. Las lecturas no dejan ninguno |

---

## LO QUE CAMBIO EN ESTA TANDA (24-25/09/2026)

Seis cosas, cada una con lo minimo para entenderla. El detalle esta en las
migraciones, en `docs/PLAN-REFORMA.md` y en la ficha del incidente.

### 1. Reescritura de cuatro rutas y un curso nuevo

Cinco cursos reescritos enteros, seis fusionados en tres y uno creado desde cero.
El catalogo pasa de 13 cursos publicados con leccion mediana de 1.748 caracteres
a **9 cursos con mediana de 6.073**.

- **Fundamentos**: *Fundamentos de Bitcoin* absorbe *Bitcoin como sistema
  monetario* (045). *Como funciona Bitcoin* se reescribe (043). *Uso practico*
  se reescribe (046).
- **Seguridad**: *Seguridad basica* absorbe los **dos** cursos de custodia, que
  cubrian lo mismo con distinto nombre (048). Cold Storage se mueve a esta ruta
  y *Seguridad Avanzada* desaparece.
- **Web3** y **Trading**: cada ruta pasa de dos cursos a uno (052). Y despues
  Web3 gana un curso nuevo delante, *Blockchain: lo que Bitcoin no es* (055),
  que era el hueco principal del Tier 3.

  Su enfoque no fue el obvio, y lo decidio el diagnostico: en los 247.672
  caracteres de los cursos relevantes habia **cero** menciones de prueba de
  participacion, validador, estado compartido, capa 2, interoperabilidad o
  cadenas con permisos. El territorio libre no era el mecanismo —que *Como
  funciona Bitcoin* cubre con un caso real— sino **todo lo que no es Bitcoin**.

**El criterio de fusion**: se queda el curso con mas recorrido —mas matriculas y
mas certificados— y absorbe al otro. El absorbido pasa a `archived`, nunca se
borra, y **cada una de sus URLs recibe una 301 a la leccion que trata ese mismo
tema**, no a la ficha del curso. Las lecciones que ya existian conservan su `id`,
y con el su `user_progress`.

En Trading la reescritura tuvo ademas un motivo editorial: el curso anterior
contenia tres juicios de inversion que chocan con el Principio #1 —«el tiempo es
aliado del inversor», «la consistencia precede a la rentabilidad», «ganar dinero
es una consecuencia»— y un armazon operativo de stops, tamano de posicion y
checklist. El curso nuevo responde a *si* operar y nunca a *como*, y anade lo
que faltaba para decidir: apalancamiento y obligaciones fiscales.

### 2. Cierre de la RLS

Cuatro tablas estaban abiertas de par en par. Tres migraciones lo cerraron:

- **`users` (049)**: privilegios **por columna**. `anon` y `authenticated` solo
  leen `id`, `full_name`, `avatar_url`, `role`, `bio` y `created_at`. La fila
  propia entera se sirve por `mi_perfil()`, porque un GRANT de columna no
  distingue la fila propia de las ajenas.
- **`lessons`, `modules` y `quiz_questions` (050)**: una sola regla,
  `curso_visible()`, que es el equivalente en SQL de `resolveCourseAccess`. De
  paso arregla que un mentor no pudiera ver el quiz del curso que debia revisar.
- **`certificates` (051)**: tabla cerrada a `anon`. La verificacion publica pasa
  por `verificar_certificado(codigo)`, que exige el numero completo, devuelve
  como mucho una fila y nunca `user_id`.

`scripts/auditar-clave-anonima.mjs` comprueba todo esto de una vez. Antes de las
tres migraciones marcaba 14 fallos; ahora, `TODO CORRECTO`.

### 3. El incidente de los correos del leaderboard

`GET /api/gamification/leaderboard` devolvia el correo de 15 usuarios en su JSON
a **cualquier cuenta con sesion**, y la politica `users_read_all_authenticated`
(`USING true`) servia `public.users` entera: 23 filas por 23 columnas.

Ventana de **10 meses**, desde que el endpoint nacio con el correo dentro
(`0a3c94a`, 24/11/2025). Sin sesion no hubo exposicion, y el endpoint era codigo
muerto que ninguna pantalla pedia. **No se puede saber si alguien lo consulto**:
no hay registros que cubran ese plazo.

Ficha completa con las cuatro preguntas en
`docs/reports/INCIDENTE-2026-09-24-correos-leaderboard.md`.

### 4. Escalonado por modulos

Un alumno ya no puede entrar al modulo siguiente sin completar el anterior. La
regla vive en `lib/progress/checkLessonAccess.ts`, del lado del servidor, con
**cuatro excepciones** que se evaluan en este orden:

1. La leccion es de **vista previa** (`is_free_preview`).
2. La leccion **ya esta completada** por esa persona.
3. Es la **primera leccion** del curso (`order_index === 0`).
4. Quien mira es **admin o el instructor** del curso, o ya tiene el curso
   completado o certificado.

Antes de aplicarlo se comprobo cuantos usuarios y lecciones quedarian
bloqueados con esas excepciones puestas: **cero**. De paso se borro
`components/lesson/AccessGuard.tsx` y `lib/progress/checkModuleAccess.ts`, que
eran codigo muerto con aspecto de proteccion.

### 5. Aviso educativo en cursos, lecciones y examen final

Hasta esta tanda **solo el blog lo llevaba**. Los cursos de trading, que son el
contenido mas sensible de la plataforma, no advertian nada: el aviso estaba solo
en `/terminos`, que nadie lee.

El texto vive ahora en `components/legal/AvisoEducativo.tsx` y lo usan los tres
sitios, con `BlogDisclaimer` delegando en el para que no puedan separarse.

### 6. El certificado congela, el porcentaje refleja el presente

Al ampliar cursos de 6 a 9 lecciones, quien no habia vuelto conservaba un
porcentaje calculado sobre el total antiguo: habia matriculas diciendo 100% con
3 de 9 hechas. La postura adoptada, y aplicada en la 047, la 048 y la 052:

- **`completed_at` no se toca nunca.** Si alguien tiene el certificado, sigue
  siendo valido y no se menciona como perdido.
- **`progress_percentage` se recalcula** sobre el contenido actual.

Es la **regla 25**. Hoy hay 10 matriculas completadas con porcentaje por debajo
del 100%, y es el estado correcto.

---

## CONTEXTO TECNICO

### Stack

- **Frontend**: Next.js 16.3.5 (App Router), React 19.2.0, TypeScript 5
- **Estilos**: Tailwind CSS v4 (tema oscuro, glassmorphism)
- **Base de datos**: Supabase (PostgreSQL + PostgREST + RLS)
- **Autenticacion**: Supabase Auth
- **Deploy**: Vercel, desde `main` por PR
- **Editor de contenido**: TipTap 3.31
- **PDF**: jsPDF 4.2.1 (certificados)
- **Notificaciones**: Discord Webhooks

### Arquitectura

```
Server Components (por defecto)
├── Leen de Supabase directamente
├── Renderizan en servidor (SEO, rendimiento)
└── Pasan props a Client Components

Client Components ('use client')
├── Interactividad (formularios, modales)
├── Estado de cliente
└── Manejadores de eventos
```

### Dos clientes de Supabase, y cuando usar cada uno

| Cliente | Que hace | Cuando |
|---------|----------|--------|
| `createClient()` (`lib/supabase/server`) | Actua como el usuario de la sesion. **Sujeto a RLS.** | Por defecto, siempre |
| `createAdminClient()` (`lib/supabase/admin`) | Actua como `service_role`. **Ignora RLS por completo.** | Solo cuando hay una razon explicita, y siempre detras de una comprobacion de permisos en el codigo |

Usar el cliente admin no es un atajo para "que funcione": desactiva la unica
barrera que queda si una politica esta mal escrita.

### Regla de oro de los datos

`lesson.module.course` — **SIEMPRE EN SINGULAR**

```typescript
// CORRECTO
const courseTitle = lesson.module.course.title

// INCORRECTO (rompe todo)
const courseTitle = lesson.modules.courses.title
```

### Nombres de columna que se equivocan una y otra vez

| Se escribe | Es en realidad | Donde |
|------------|----------------|-------|
| `learning_paths.title` | **`name`** | ha aparecido 4 veces (migraciones 008 y 020, rama de instructores, y `/mentores/[id]` el 21/09) |
| `learning_paths.icon` | **`emoji`** | `/mentores/[id]` |
| `mentor_points.total_points` | **`points`** (hay que sumar las filas) | panel de mentor |
| `mentor_monthly_stats.month` | **`period_month`** | panel de mentor |
| `governance_votes.vote_type` | **`vote`** (`for`/`against`/`abstain`) | `/mentores/[id]` |
| `governance_votes.user_id` | **`voter_id`** | `/mentores/[id]` |
| `users` via `profiles` | `profiles` **no existe** | `redirect-after-login` |

PostgREST devuelve **400** ante una columna inexistente, tambien dentro de un
recurso embebido. Si el codigo ignora el `error` y usa solo `data`, la seccion
desaparece en silencio y nadie se entera. Ha pasado varias veces.

---

### Anunciar un articulo del blog en Discord: es un paso MANUAL

El blog no vive en la base de datos: son articulos estaticos en
`lib/blog-data.ts`, asi que no existe ningun evento de "publicar" al que
engancharse. Desplegar el articulo **no lo anuncia**. Hay que llamar al
endpoint a mano despues del despliegue:

```bash
curl -X POST https://nodo360.com/api/internal/discord-notify \
  -H "Authorization: Bearer $INTERNAL_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"type":"new_blog_post","slug":"el-slug-del-articulo"}'
```

**AVISO: desde fuera esto devuelve 429 mientras el firewall lo bloquee.** El
Bot Protection de Vercel responde a toda peticion no-navegador con un reto de
JavaScript: `HTTP 429` + `X-Vercel-Mitigated: challenge`, y la funcion ni
siquiera llega a ejecutarse. No es `checkRateLimit` —esta ruta no lo usa— ni un
problema del secreto. Hace falta una regla de firewall con accion **Bypass**
para `/api/internal/*`. Hasta que este activa, la unica forma de probarlo es
en local, levantando el servidor con las variables reales.

Se distingue mirando la respuesta: la nuestra es JSON y trae `Retry-After` y
`X-RateLimit-*`; la del firewall es HTML y trae `X-Vercel-Mitigated`.

El endpoint lee el articulo de `lib/blog-data.ts` y exige que el slug exista,
de modo que una errata devuelve **404** en vez de anunciar un enlace roto.
Esperar **200** y, sobre todo, **comprobar que el mensaje aparece en el canal**:
las funciones de notificacion se tragan sus propios errores a proposito —un
fallo de Discord no debe romper el flujo principal— asi que un `success: true`
no garantiza que el webhook siga vivo.

Los cursos si se anuncian solos, al aprobarlos desde el panel.

**Canales.** Un webhook de Discord apunta siempre a UN canal, asi que elegir
canal es elegir webhook:

| Contenido | Variable | Canal |
|-----------|----------|-------|
| Cursos nuevos | `DISCORD_WEBHOOK_ANNOUNCEMENTS` | #anuncios |
| Articulos del blog | `DISCORD_WEBHOOK_NEWS` | #noticias |

Si `DISCORD_WEBHOOK_NEWS` no esta definida, los articulos caen en el canal de
anuncios y queda constancia en el log. Es deliberado: perder el anuncio es
peor que publicarlo en el canal de al lado.

Para comprobar un webhook recien rotado sin publicar contenido real:
`{"type":"test"}`, o `{"type":"test","channel":"news"}` para el de noticias.

---

## BASE DE DATOS

### Migraciones

Hay **dos carpetas** y es un problema, no una convencion:

- `supabase/migrations/` — 48 archivos, 003 a 053. **Es la secuencia buena.**
- `docs/migrations/` — 6 archivos, 015 a 021. Paralela, con numeros que chocan.

En al menos un caso (`course_reviews`) las dos versiones del 019 crean la misma
tabla con esquemas incompatibles, y solo consultando la base de datos se puede
saber cual gano (la de `docs/`). Unificarlas esta en el Tier 2.

#### De la 041 a la 053

Verificado fichero a fichero el 25/09/2026. Todas aplicadas salvo la 053.

| # | Que hizo | Estado |
|---|----------|--------|
| 041 | Subtitulo y descripcion larga de las 6 rutas de entonces | aplicada |
| 042 | Corrige una respuesta marcada mal en el quiz de Fundamentos | aplicada |
| 043 | Reescribe *Como funciona Bitcoin*: 14.137 → 38.632 caracteres, quiz de 5 → 18 | aplicada |
| 044 | Repara los 2 intentos de quiz penalizados por el fallo que arreglo la 042 | aplicada |
| 045 | *Fundamentos de Bitcoin* absorbe *Bitcoin como sistema monetario*: 3 modulos, 9 lecciones, 27 preguntas | aplicada |
| 046 | Reescribe *Uso practico de Bitcoin* con la misma forma | aplicada |
| 047 | Recalcula el progreso de 7 matriculas desfasadas por contenido nuevo | aplicada **y versionada el 25/09** (ver aviso abajo) |
| 048 | *Seguridad basica* absorbe los dos cursos de custodia; Cold Storage cambia de ruta y Seguridad Avanzada desaparece | aplicada |
| 049 | `users`: privilegios por columna y `mi_perfil()` para la fila propia | aplicada |
| 050 | `curso_visible()` y RLS de `lessons`, `modules` y `quiz_questions` | aplicada |
| 051 | `certificates` cerrada; `verificar_certificado()` como unica puerta publica | aplicada |
| 052 | Fusion de las rutas Web3 Basica y Trading Basico | aplicada |
| 053 | `/verificar` muestra el titulo del certificado, no el vigente del curso | en `main` (PR #189); **SIN aplicar a la base** |
| 054 | Arregla 8 remisiones muertas en 4 lecciones que las fusiones dejaron atras | aplicada |
| 055 | Crea el curso *Blockchain: lo que Bitcoin no es* y lo pone primero en Web3 Basica | aplicada |

> **La 047 estuvo cuatro meses sin existir en el repositorio.** Se aplico el
> 24/09/2026 por PostgREST y el fichero no llego a escribirse; el hueco lo
> destapo la revision para esta version, al ver que entre la 046 y la 048 faltaba
> un numero. Se reconstruyo el 25/09 desde su respaldo y el estado de la base,
> que coinciden. Es exactamente lo que la regla 4 existe para evitar.

> **La 053 estuvo a punto de perderse.** Su commit quedo fuera de `main` porque
> la rama se mergeo por squash *antes* de escribirlo, y el squash rompe la
> ascendencia. Se recupero al volver a mergear la misma rama (PR #189). La
> migracion es DDL y **sigue sin aplicarse a la base**: el fichero listo esta en
> `C:/Users/alber/053-aplicar.sql`. No corre prisa, porque el arreglo real de los
> cuatro certificados afectados era la precedencia de la pagina, que ya esta
> desplegada; la migracion solo mueve el respaldo dentro de la funcion.

Aplicadas a mano y versionadas a posteriori: 024, 025 y 026 el 21/09/2026; 030 y
033 el 22/09; 041 el 24/09; 047 el 25/09. Las 049, 050 y 051 son DDL y se
ejecutaron en el SQL Editor, tambien versionadas despues.

### Tablas que el codigo referencia y NO existen

Revisado el 21/09/2026: de 70 nombres de tabla que aparecian en el codigo, **15
no existian**. Tras los arreglos de ese dia quedan referenciadas pero ausentes:

`mentors` · `lesson_resources` · `level_configs` · `gamification_settings`

Las cuatro se consultaban desde codigo que ya se ha borrado o reapuntado, salvo
`mentors`, que ya no se usa en ninguna parte. Ninguna de las cuatro se ha
definido nunca en una migracion: son funciones que no llegaron a existir, no
renombrados.

---

## CONVENCIONES DE CODIGO

### Imports: siempre alias `@/`

```typescript
// CORRECTO
import { Course } from '@/types/database'
import { createClient } from '@/lib/supabase/server'

// INCORRECTO
import { Course } from '../../../types/database'
```

### Logging

```typescript
console.log('[functionName] Iniciando operacion:', params)
console.log('[functionName] Exito:', result)
console.error('[functionName] Error:', error)
```

### Estilos (glassmorphism oscuro)

```typescript
// Card basica
className="rounded-2xl bg-white/5 border border-white/10 p-6"

// Card con hover
className="hover:border-brand/30 hover:bg-white/[0.07] transition-all"

// Gradiente de marca
className="bg-gradient-to-r from-brand-light to-brand"
```

---

## CONVENCIONES DE IDIOMA

Todo el contenido de cara al usuario (lecciones, quizzes, paginas, correos,
mensajes de interfaz) se escribe en **espanol neutro**, valido tanto para Espana
como para Latinoamerica.

### Reglas

| Regla | Detalle |
|-------|---------|
| Espanol neutro | Ni peninsular ni de una region concreta de America |
| Persona | **Impersonal** o **segunda persona del singular**. Asi no hay que elegir entre "vosotros" y "ustedes" |
| Si hace falta plural | **"ustedes"**, nunca "vosotros" |
| Sin voseo | Nada de "tenes", "podes", "queres", "sos", "sumate" |
| Sin localismos | Ni de Espana ni de America |

### Pares marcados a evitar

| No usar | Usar |
|---------|------|
| ordenador / computadora | **equipo**, **dispositivo**, **maquina** |
| movil / celular | **telefono** |
| fichero | **archivo** |
| coger | **tomar**, **usar**, **elegir** |
| aca / alla | **aqui** / **alli** |
| merece la pena | **vale la pena** |
| pegas | **inconvenientes**, **limitaciones** |
| disgustos | **problemas** |
| vale (asentimiento) | **de acuerdo** |
| plata (dinero) | **dinero** |
| financiamiento / financiacion | **fondos** |

### Anglicismos

- `feedback` -> **retroalimentacion** (o "comentarios", segun contexto)
- `performance` -> **rendimiento**
- `bug` -> **error**
- `testing` -> **pruebas**

Los terminos tecnicos establecidos NO se traducen: hash, blockchain, nodo,
timestamp, UTXO, soft fork, full node, SSD, RPC, Tor, seed phrase.

**Nunca tocar** rutas, variables, nombres de tabla ni claves JSON, aunque
contengan un anglicismo (`/api/feedback`, `beta_feedback.user_email`).

### Verificacion rapida

```
ordenador|computadora|movil|celular|coger|fichero|merece la pena|pegas|
vosotros|vuestro|acá|allá|tenés|podés|querés|sos |plata|vale,
```

---

## REGLAS CRITICAS

### Seguridad y datos

1. **Nunca aceptar del cliente datos que determinen permisos, identidad o
   resultados.** `user_id`, `score`, `passed`, `role` y equivalentes salen de la
   sesion o se calculan en servidor. Nunca del cuerpo de la peticion. Este
   patron aparecio tres veces en el mismo dia (quiz, invitaciones, feedback).
2. **Toda tabla nueva**: RLS activo + `REVOKE` de los privilegios que Supabase
   concede por defecto a `anon` y `authenticated` + `GRANT` minimos explicitos.
   RLS protege **filas**, no columnas; un `GRANT` de tabla y uno de columna son
   independientes y acumulativos.
3. **Ninguna migracion se aplica sin revision previa**: buscar politicas
   permisivas, `UPDATE` sin `WITH CHECK` (Postgres reutiliza el `USING` y eso
   abre escaladas), recursion entre politicas de tablas que se consultan
   mutuamente, `search_path` en funciones `SECURITY DEFINER`, y privilegios de
   `anon`.
4. **Todo lo aplicado en la base de datos tiene que estar versionado** en
   `supabase/migrations/`. Si se ejecuto a mano, se versiona a posteriori
   documentando la fecha y el SQL exacto.
5. **Probar RLS simulando el rol**: `SET LOCAL ROLE authenticated` +
   `request.jwt.claims` con el `sub` del usuario. En el SQL Editor se corre como
   `postgres`, que se salta RLS: una prueba hecha asi no demuestra nada.

### Proceso

6. **Verificar los builds con instalacion limpia** (`npm ci` o `npm install`
   sobre un arbol sin `node_modules`), no solo con `npm run build`. El build
   local compila contra lo que ya esta en disco y no vuelve a resolver el arbol
   de dependencias: un conflicto de peers pasa desapercibido y revienta en
   Vercel.
7. **Produccion solo se despliega desde `main` via PR.** Nunca `vercel --prod`
   desde local. Ya paso: produccion estuvo sirviendo una rama de contenido.

### Contenido

8. **Ninguna cifra publica que no salga de la base de datos.** Si no se puede
   consultar, no se publica. Incluye las que parezcan plausibles.
9. **Espanol neutro**, valido para Espana y Latinoamerica (ver seccion propia).
10. **Nada de juicios de inversion ni promesas de rentabilidad** (Principio #1).
    Describir lo que ha ocurrido, no recomendar que hacer con ello.
11. **El texto que se sube a la base de datos se escribe en un archivo, no
    dentro de un script.** Toda la carga de contenido se redacta en un `.html`,
    `.md`, `.json` o `.sql` en UTF-8, y el script se limita a leerlo y subirlo.
    Nunca se teclea el texto como literal dentro del `.py`, y menos dentro de un
    heredoc de bash.

    **Por que.** El 21/09/2026 se subieron 36 preguntas de quiz sin una sola
    tilde ni ene. No hubo ninguna transformacion tecnica que las quitara: el
    script era **ASCII puro** y se escribieron ya mal. Las 12 lecciones de esos
    mismos cursos, que venian de archivos `.html`, conservaron sus 1.594
    caracteres acentuados intactos.

    **Comprobacion obligatoria**: `file <archivo>` no debe decir "ASCII text"
    cuando el contenido es castellano, y despues de subir hay que contar en la
    base de datos los caracteres acentuados y los signos de apertura.

### Base de datos

12. **El repositorio NO describe la base de datos. Leer siempre el objeto
    vivo.** Antes de tocar una funcion, un trigger o una vista, sacar su cuerpo
    real con `pg_get_functiondef` y su definicion con `pg_get_viewdef`.

    **Por que.** El 22/09/2026 paso tres veces seguidas:
    `award_xp_on_lesson_complete` escribia en `metadata` y no en `related_id`,
    al reves de lo que decia la migracion 004; `calculate_xp_to_next_level` se
    invocaba con un argumento y el repo la declara con dos; y
    `save_lesson_progress` sumaba XP por su cuenta sin que nada lo documentara.

13. **Toda funcion `SECURITY DEFINER` nace con `SET search_path` y con
    `REVOKE ALL ... FROM PUBLIC`.** En la misma migracion, no despues.

    **Por que.** Postgres concede `EXECUTE` a `PUBLIC` en toda funcion nueva, y
    `anon` y `authenticated` heredan de `PUBLIC`: revocar solo a esos dos roles
    no sirve de nada. El 22/09/2026, **72 de las 73 funciones SECURITY DEFINER**
    de `public` las podia ejecutar `anon`, y 44 no tenian `search_path`. Con la
    clave anon —que viaja en el paquete del navegador— se leian los ingresos de
    cualquier instructor.

14. **La identidad sale de `auth.uid()`, nunca de un parametro.** Una funcion
    que recibe `p_user_id` y se fia de el permite actuar en nombre de otro, por
    mucho que la ruta de la aplicacion compruebe quien llama: PostgREST es
    alcanzable directamente y la clave anon es publica.

    **Por que.** `vote_mentor_application` comprobaba que el votante fuese
    mentor activo... sobre el `p_voter_id` que le pasaban.
    `track_referral_conversion` recibia el importe Y el porcentaje de comision.
    `get_or_create_conversation` creaba conversaciones entre dos usuarios
    arbitrarios.

15. **Una recompensa, una fuente, una vez.** Toda concesion de puntos,
    insignias o certificados registra de donde viene y se protege con una
    restriccion unica en la base de datos, no solo con una comprobacion en el
    codigo.

    **Por que.** `awardXP()` recibia el contexto y solo lo usaba para redactar
    la descripcion: 569 de 588 filas de `xp_events` no registraban ninguna
    fuente. Y habia **tres** vias concediendo XP por leccion a la vez.

16. **Una sola formula para cada calculo, y que se pueda comprobar.**

    **Por que.** El nivel se calculaba de **tres** maneras: lineal en la base de
    datos, progresiva en una funcion huerfana y por umbrales en TypeScript.
    Ningun usuario veia un nivel coherente: con 4.693 XP se veia "Nivel 47" y el
    nombre "Novato", porque el numero salia de una formula y el nombre de otra.

17. **El editor SQL de Supabase no conserva las tablas temporales entre
    sentencias.** Un script que crea una `TEMP TABLE` y la usa mas abajo falla
    con "relation does not exist". Para guardar estado entre pasos, usar una
    tabla real en `backup_nodo360`, que ademas deja un respaldo con el que
    revertir.

### Interfaz

18. **En JSX, `{numero && <algo/>}` pinta un `0`.** Usar siempre
    `{numero > 0 && ...}`. Con cadenas no se nota, porque una cadena vacia no se
    ve; con numeros si.

    **Por que.** Producia un "0" suelto en el temario publico y el chip
    "Pendientes0" del panel. El segundo parecia protegido —
    `{n && n > 0 && ...}`— pero la primera condicion ya devuelve `0`.

### Dependencias

19. **El lockfile se genera con la misma version de Node que usan el CI y
    Vercel: la 22.** Nunca con otra. Antes de tocar `package.json` o el
    lockfile, comprobar `node -v` contra `.nvmrc`.

    **Por que.** El lockfile depende de la version de **npm**, que viene con
    Node: la 22 trae npm 10 y la 24 trae npm 11. **npm 11 tolera que falten
    entradas transitivas en el lock y npm 10 las rechaza.** Un lock generado
    con npm 11 instala sin problemas en local y revienta en CI con

        npm error Missing: @floating-ui/dom@1.8.0 from lock file

    Paso el 22/09/2026 y bloqueo la primera PR con verificacion automatica.
    Reproducirlo no exige cambiar de Node: `npx npm@10 ci --dry-run` usa npm 10
    sobre el Node que haya.

    La version esta fijada en tres sitios que deben coincidir, y `.nvmrc` es la
    fuente: `.nvmrc`, `engines.node` de `package.json` y el
    `node-version-file` del workflow. Vercel lee `engines.node`.

    **Si el entorno local va con otra version**, el install avisa con
    `EBADENGINE` y no falla. Ese aviso no es ruido: significa que cualquier
    lockfile que se genere ahi puede romper el CI.

### Respaldos y reversion

20. **El archivo que revierte una migracion no se guarda junto al que la
    aplica.** Va a una carpeta aparte, `C:\Users\alber\backups-sql\`, con
    extension **`.bak`** para que no se ejecute de un doble clic ni se confunda
    con un script de aplicar. Su cabecera dice, en la primera linea, **que
    deshace y de que fecha es el estado que restaura**.

    **Por que.** El 23/09/2026 los `volver-atras.sql` de las migraciones 042 y
    043 estaban en la misma carpeta que los `aplicar.sql`, con nombres
    parecidos. Se ejecutaron por error **al revisarlos**, y el curso publicado
    "Como funciona Bitcoin" perdio su reescritura entera: volvio de 38.632 a
    14.137 caracteres, el quiz de 18 preguntas volvio a 5, y el fallo de la
    respuesta marcada mal reaparecio en produccion. Se repuso leyendo los
    valores de la migracion ya versionada en git, que es exactamente para lo
    que sirve versionarlas.

21. **Un respaldo de lecciones incluye SIEMPRE el `slug`, ademas del `title` y
    el `content`.** En general: un respaldo guarda todas las columnas que la
    migracion pueda tocar, no solo las que se piensa tocar.

    **Por que.** En el mismo incidente, los `volver-atras` restauraban `title` y
    `content` pero no `slug`, porque la migracion "solo cambiaba contenido". La
    043 si habia reasignado slugs, asi que al revertir quedaron los slugs nuevos
    sobre el contenido viejo: **cinco de las seis URLs servian una leccion que
    no era la suya** (`/mineria-y-prueba-de-trabajo` mostraba "Seguridad y
    confianza en Bitcoin"). La base de datos era coherente consigo misma y aun
    asi el sitio estaba roto, que es el peor tipo de fallo: no lo detecta
    ninguna comprobacion de integridad.


22. **Escribir `description` o `long_description` de un curso publicado por
    PostgREST lo saca de produccion.** Antes de tocar esos campos, o se hace
    por SQL con `SET LOCAL app.skip_republish_check = 'on'`, o se cuenta con
    devolver el curso a `published` en el mismo lote y se comprueba despues.

    **Por que.** El disparador `check_course_modification` (migracion 030)
    devuelve a `pending_review` cualquier curso publicado cuyo `title`,
    `description`, `long_description`, `level`, `price`, `is_free`,
    `is_premium`, `thumbnail_url` o `banner_url` cambie. Exime a dos: a quien
    sea admin segun `auth.uid()`, y a quien fije `app.skip_republish_check` en
    su transaccion.

    **La clave de servicio no cumple ninguna de las dos.** `auth.uid()` es nulo,
    asi que `is_admin` no la reconoce, y cada peticion de PostgREST es su propia
    transaccion, asi que un `SET LOCAL` enviado aparte no la alcanza. El
    disparador actua y el curso desaparece del catalogo, de su ruta y del
    buscador **sin devolver ningun error**: la escritura se confirma.

    Paso el 24/09/2026 con la migracion 048. El curso "Seguridad basica en
    Bitcoin y criptomonedas" estuvo invisible para cualquier visitante hasta que
    lo delato una comprobacion con la clave anonima. Lo mismo le habia pasado
    antes a dos cursos, y por eso existe la exencion que anadio la 030.

    **Como se detecta.** Consultar el curso con la clave **anonima**, no con la
    de servicio, que lo ve igual en los dos estados:

        SELECT slug, status FROM public.courses WHERE status = 'pending_review';

    Debe salir vacio. Toda migracion de contenido termina con esa consulta.

### Visibilidad y RLS

23. **Una tabla que cuelga de `courses` no hereda su visibilidad.** Si guarda
    contenido de un curso —`modules`, `lessons`, `quiz_questions` y lo que
    venga—, su politica de RLS tiene que preguntar `curso_visible(<course_id>)`.
    No basta con que `courses` filtre.

    **Por que.** El 24/09/2026 `courses` ocultaba bien los cursos archivados
    (anon veia 10 de 13) y `lessons` servia las 87 lecciones de la base con su
    `content`, y `modules` los 29 modulos, sin mirar el estado del curso. La
    pagina no lo dejaba ver porque resuelve antes el curso con
    `resolveCourseAccess`, pero PostgREST va por otro camino y no pasa por ahi.
    Con todo el catalogo gratuito el dano era acotado; con contenido de pago
    habria sido el techo de lo que se podia proteger.

    `curso_visible(uuid)` (migracion 050) es el equivalente en SQL de
    `lib/courses/access.ts`: publicado para cualquiera, no publicado para su
    instructor y el admin, en `pending_review` tambien para un mentor activo.
    Es la unica forma de que la regla no se escriba dos veces y se separe.

    **Y tiene que ser `SECURITY DEFINER`**: las subconsultas de una politica
    aplican la RLS de las tablas que consultan. Una politica sobre `lessons`
    que mirase `courses` directamente heredaria lo que `courses` oculte a ese
    rol, y un mentor seguiria sin ver el curso que se le pide revisar aunque su
    excepcion estuviera escrita. Eso fue exactamente lo que dejo la 024 en
    `quiz_questions`, que solo miraba `published`.

24. **En un embed de PostgREST: `!inner` cuando la fila es imprescindible,
    `?.` con respaldo cuando no.** No hay tercera opcion, y elegir mal no da
    error hasta que alguien deja de ver una fila.

    Un embed sin `!inner` es un LEFT JOIN: cuando RLS oculta la fila —y la
    oculta en cuanto el curso no esta `published`— llega `null`, no un error.
    `x.course.title` revienta con 500; `{...x.course}` produce un objeto vacio
    que se pinta como una tarjeta rota.

    - **Imprescindible** (sin ella la fila no significa nada): `!inner`, y que
      desaparezca entera. Ej.: una leccion sin su curso.
    - **Prescindible** (la fila se entiende sin ella): sin `!inner`, `?.` al
      leerla y un respaldo explicito. Ej.: `certificate.course?.title ??
      certificate.title`.

    **Por que.** Archivar **un solo** curso el 24/09/2026 obligo a tres
    arreglos seguidos, cada uno descubierto despues del anterior: el titulo en
    `/dashboard/certificados`, una tarjeta con `href="/cursos/undefined"` en
    `/dashboard/cursos` y un **500** en `/certificados/[id]`, que es justo la
    pagina del boton "Ver tu certificado". Ninguno dio la cara al archivar: los
    encontro una revision manual.



### Contenido y progreso

25. **El certificado congela; el porcentaje refleja el presente.** Al ampliar un
    curso, `progress_percentage` se recalcula sobre el contenido actual y
    `completed_at` **no se toca nunca**, ni al aplicar ni al revertir.

    **Por que.** Al pasar cursos de 6 a 9 lecciones aparecieron matriculas
    diciendo 100% con 3 de 9 hechas. Las dos salidas obvias fallan: dejar el
    100% miente sobre lo que queda, y bajar `completed_at` le dice a alguien que
    ha perdido un certificado que sigue teniendo. Un certificado acredita lo que
    se completo entonces; el porcentaje describe lo que falta hoy.

    Hay dos cosas que lo hacen seguro, y conviene saberlas antes de tocar nada:
    `trigger_auto_certificate_on_completion` es `AFTER UPDATE OF completed_at`,
    asi que tocar solo el porcentaje no emite ningun certificado; y el aviso de
    curso completado vive en `/api/progress`, no en un disparador, asi que un
    UPDATE directo no manda notificaciones a nadie.

    Corolario para `/verificar`: **manda el titulo guardado en el certificado**,
    no el vigente del curso (migracion 053). Un curso se puede renombrar; lo que
    alguien completo, no.

### Criterio editorial

26. **Describir sin defender ni condenar.** El contenido explica que es algo,
    que cuesta y de que depende. No dice si conviene.

    Se aplica igual a una tecnologia que a una actividad. Web3 no es «el futuro»
    ni «humo»: es una propuesta con un precio concreto. El trading no es una
    estafa ni una oportunidad: es una actividad con unas probabilidades
    concretas. En los dos casos el alumno decide.

    **Como se reconoce que se ha roto.** Frases que adjudican un resultado
    («el tiempo es aliado del inversor»), que valoran un bando («Web2 no
    empodera al usuario») o que prometen por implicacion («la consistencia
    precede a la rentabilidad»). Las tres estaban publicadas hasta el 25/09/2026.

    **Y su contrario tambien cuenta**: decir que algo es inutil cuando lleva
    anos funcionando es el mismo fallo en la otra direccion.

27. **Remitir en vez de redefinir.** Si otro curso ya explica algo, se enlaza y
    se cuenta solo lo que es propio de aqui.

    **Por que.** Los cursos duplicados no nacieron de una decision: nacieron de
    explicar tres veces lo mismo en sitios distintos. Cuando el curso de Web3
    explicaba que es una wallet, el de Seguridad tambien, y el de Uso practico
    tambien, ninguno de los tres podia profundizar sin repetir a los otros dos.

    En la practica: la leccion 2.1 de Web3 dice que la clave privada ya esta
    explicada en *Seguridad basica* y se dedica a lo suyo, que es la clave como
    credencial reutilizable entre aplicaciones.

28. **No orientar hacia lo que no existe.** El cierre de un curso solo remite a
    cursos publicados. Los huecos se reconocen por escrito, sin fechas.

    **Por que.** Es el Principio #7 aplicado al contenido. Los cuatro cursos
    retirados en esta tanda prometian «graficos, analisis tecnico o estrategias»
    y «DeFi y desarrollo Web3»: ninguno de esos cursos existe ni estaba
    planificado. Quien terminaba el curso se quedaba esperando.

    La forma correcta esta en la ultima leccion de *Que es Web3 y que no*, que
    enumera lo que se ha quedado fuera —como funciona una blockchain por dentro,
    DeFi, programacion— y dice que no esta en la plataforma. **Se prefiere el
    hueco reconocido al anuncio que quiza no se cumpla.**

29. **Ninguna cifra sin fuente comprobable.** Si un dato no se puede rastrear, o
    se acota a lo que si esta publicado o no se escribe.

    **Por que.** «El 90% de los traders pierde dinero» circula en todas las
    versiones, del 70% al 95%, y casi siempre sin origen. La leccion 3.1 de
    Trading dice en su lugar lo que si se puede comprobar: que los
    intermediarios que ofrecen contratos por diferencias en Europa **estan
    obligados a publicar** que porcentaje de sus clientes pierde, y que suele
    situarse entre el 70% y el 85%, acotado a ese producto y a esos clientes.

    Vale igual para las cifras de la propia plataforma: en la auditoria del
    20-21/09 se retiraron de la web «entre 500 y 5.000 estudiantes» segun la
    pagina, con 23 usuarios reales.


30. **Al fusionar, archivar o renombrar un curso, hay que revisar las
    remisiones en el texto de todas las lecciones publicadas.** Las
    redirecciones 301 arreglan los enlaces; no arreglan las menciones.

    **Por que.** Las migraciones 045, 048 y 052 archivaron cinco cursos y
    renombraron dos. Las URLs quedaron cubiertas con 96 redirecciones, y aun
    asi el cierre de *Como funciona Bitcoin* siguio recomendando cuatro cursos
    de los que **tres ya no existian con ese nombre**. Ocho remisiones muertas
    en cuatro lecciones, todas en prosa: `<em>Ecosistema Web3 explicado</em>`,
    `<em>Bitcoin como sistema monetario</em>`, `<em>Introduccion a Web3</em>`.
    Ninguna daba error. Simplemente mandaban al alumno a buscar algo que no
    encontraria.

    **Como se comprueba**, y no de memoria:

        node scripts/comprobar-remisiones.mjs

    Recorre las lecciones publicadas y busca titulos de cursos archivados,
    titulos antiguos de cursos vivos, slugs de curso y de leccion que ya no
    existen, rutas eliminadas y enlaces `/cursos/...` y `/rutas/...` rotos.
    Sale con codigo 1 si encuentra algo.

    **Y direcciona por `id`, nunca por slug**, porque `lessons.slug` es unico
    por curso y no globalmente: al arreglar esto, `limites-y-criticas-a-bitcoin`
    existia dos veces, una en el curso publicado y otra en el archivado.

### Codigo

- Usar `lesson.module.course` (singular), nunca las relaciones plurales
- Leer los archivos antes de editarlos
- Verificar que compila antes de hacer commit
- Alias `@/` en los imports
- No ignorar el `error` de una consulta a Supabase y usar solo `data`: asi es
  como una seccion entera desaparece sin que nadie se entere

---

## HISTORIAL DE SESIONES

### 24-25/09/2026 — Reescritura del catalogo, cierre de la RLS y un incidente

Dos dias. Tres frentes a la vez, y el resultado esta medido en la seccion
METRICAS: el catalogo pasa de 13 cursos con leccion mediana de 1.748 caracteres
a **9 cursos con mediana de 6.073**.

**Contenido.** Cinco cursos reescritos enteros, seis fusionados en tres y uno
creado desde cero.
*Fundamentos de Bitcoin* absorbe el curso monetario (045); *Seguridad basica*
absorbe los dos de custodia (048); Web3 y Trading pasan de dos cursos a uno cada
una (052). Y despues Web3 gana delante *Blockchain: lo que Bitcoin no es* (055),
el hueco principal del Tier 3, cuyo enfoque lo decidio el diagnostico: no
explicar blockchain desde cero, sino **lo que no es Bitcoin**.

Cinco cursos archivados, ninguno por retirada de contenido: todos por fusion, con
301 desde cada URL a la leccion que trata ese mismo tema. La ruta *Seguridad
Avanzada* desaparece y Cold Storage se integra en Seguridad. Y la 054 cierra las
8 remisiones muertas que las fusiones dejaron en el texto de cuatro lecciones, de
donde sale la regla 30.

De aqui salen las cuatro reglas editoriales, 26 a 29, y en particular la
reescritura de Trading: el curso anterior tenia tres juicios de inversion
publicados y un armazon operativo. El nuevo responde a *si* operar, nunca a
*como*, y anade apalancamiento y obligaciones fiscales.

**Seguridad.** Migraciones 049, 050 y 051: `users` por columnas mas
`mi_perfil()`, `curso_visible()` como regla unica para `lessons`, `modules` y
`quiz_questions`, y `certificates` cerrada con `verificar_certificado()` como
unica puerta publica. De ahi las reglas 23 y 24, y
`scripts/auditar-clave-anonima.mjs`, que paso de 14 fallos a `TODO CORRECTO`.

**Incidente de datos personales.** Registrado con las mismas cuatro preguntas
que el de SPV Trabajos del 20-21/09. Ficha completa en
`docs/reports/INCIDENTE-2026-09-24-correos-leaderboard.md`.

- **Que se expuso.** `GET /api/gamification/leaderboard` embebia
  `users!inner (id, full_name, email)` y **devolvia el correo en su JSON**: 15
  correos, con XP, nivel y racha. Y la politica `users_read_all_authenticated`
  (`USING true` para `authenticated`) servia `public.users` entera por PostgREST:
  23 filas por 23 columnas, con `email`, `is_suspended` y `suspended_reason`.
- **Desde cuando.** El endpoint nacio con el correo dentro en `0a3c94a`,
  **24/11/2025 13:07:29 +0100** (PR #3). `git log -S` confirma que nunca hubo una
  version sin el. **Ventana de 10 meses.** La salvedad es que la exposicion
  requeria tambien esa politica, y su fecha **no es rastreable**: se creo desde
  el panel y no esta en ninguna migracion.
- **A quien.** Cualquier cuenta con sesion; 23, de ellas 3 internas. **Sin
  sesion, cero**, verificado reproduciendo la consulta con la clave anonima. Y el
  endpoint era **codigo muerto**: su unico consumidor no lo importa nadie, y
  `/dashboard/leaderboard` construye su propia tabla con el cliente de servicio.
  Ninguna pantalla lo pedia al cargar.
- **Si alguien lo consulto.** **No se puede saber.** Vercel esta en Hobby y ahi
  no hay historico; los registros de API de Supabase duran 1 dia en gratuito y 7
  en Pro; la aplicacion no audita lecturas.
- **Que se hizo.** El endpoint deja de pedir y devolver el correo, y tres sitios
  mas dejan de usar su parte local como nombre de respaldo. En base de datos, las
  049-051. Barrido de la misma clase de fallo: ninguna otra ruta de `app/api`
  sirve correos ajenos.

**Producto.** Escalonado real entre modulos con cuatro excepciones y cero
usuarios bloqueados al aplicarlo (`lib/progress/checkLessonAccess.ts`). Aviso
educativo en ficha de curso, leccion y examen final, con el texto compartido en
`components/legal/AvisoEducativo.tsx`; hasta entonces solo lo llevaba el blog.
Y la postura de la regla 25: el certificado congela, el porcentaje refleja el
presente.

**Dos huecos de proceso que destapo la revision para esta version.** La
migracion **047 nunca se versiono**: se aplico el 24/09 y el fichero no se
escribio; se reconstruyo el 25/09 desde su respaldo. Y la **053 quedo huerfana**
al hacer squash de su rama, asi que no esta en `main`. Las dos son la regla 4
incumplida por vias distintas.

### 22/09/2026 — Cierre de funciones, XP y niveles

El dia mas denso hasta ahora. Diez migraciones, de la 032 a la 041.

**Seguridad (032-034).** `create_notification` era `SECURITY DEFINER` y
ejecutable por `anon`: comprobado con la clave publica, llegaba hasta el
`INSERT` y solo fallaba por la clave ajena. Como `NotificationBell` hace
`router.push(notification.link)`, era una primitiva de phishing completa dentro
de la sesion del usuario. De ahi se tiro del hilo: 72 de 73 funciones
`SECURITY DEFINER` abiertas a `anon`, 44 sin `search_path`. La 033 cerro por
defecto saltando las funciones de extension —revocarles `EXECUTE` a `PUBLIC`
habria roto los `DEFAULT uuid_generate_v4()`— y la 034 hizo que 12 funciones
exijan `auth.uid()`.

Una consulta forense de 19 comprobaciones no encontro rastro de explotacion: 17
a cero, y las dos con hallazgos eran benignas. Pero eso solo cubre lo que
escribe: las fugas de lectura no dejan ninguna huella y nunca se sabra si
alguien las consulto.

**XP y niveles (037-040).** Repetir un curso volvia a sumar puntos. La causa
resulto ser mayor: `awardXP()` nunca guardaba la fuente, y habia tres vias
concediendo XP por leccion a la vez, asi que cada leccion daba 60 puntos en
lugar de 50. La limpieza retiro 378 eventos duplicados y 4.540 XP; cinco
personas bajaron de nivel. De paso aparecio que el nivel se calculaba de tres
formas distintas; la 039 dejo los umbrales con nombre como unica formula.

**Contenido e interfaz (035, 041 y la rama de pulido).** Una palabra truncada en
un quiz —`interne` por `internet`— que ningun corrector detecta, porque
"interne" es forma valida de *internar*: se encontro comparando frecuencias en
el propio corpus, donde aparecia 1 vez frente a 45. 261 tildes corregidas en la
interfaz, en dos pasadas. Y el "0" suelto del temario, que resulto ser el mismo
bug que el chip "Pendientes0".

**Errores propios de esta sesion, anotados para no repetirlos.** Anuncie un
archivo que no llegue a escribir. Dije que `calculateLevel()` usaba la formula
lineal basandome en el diff de un PR sin releer el archivo de hoy, cuando el PR
siguiente ya la habia revertido. Descarte `interne` como falso positivo teniendo
la prueba delante en mi propia salida. Y en la 038 alinee
`recalculate_user_stats` con la formula lineal "para que coincidiera con el
trigger", sin mirar que usaba la interfaz: propague el problema que luego hubo
que deshacer en la 039.

### 20-21/09/2026 — Auditoria y saneamiento

Dos dias de auditoria completa. Lo principal:

- **Seguridad**: validacion del quiz movida al servidor (antes el cliente
  enviaba su propia nota y se emitia certificado); RLS en
  `course_final_quiz_attempts` y `quiz_questions`; `correct_answer` cerrada por
  privilegios de columna; `/api/invites/consume` y `/api/feedback` dejan de
  aceptar identidad del cuerpo; 3 vulnerabilidades criticas de dependencias a 0.
- **Incidente de datos de terceros**: se encontraron dos tablas de otro proyecto
  (SPV Trabajos) legibles con la clave anonima de Nodo360. Cerradas, comparadas
  contra su proyecto original, respaldadas fuera y eliminadas.
- **Migraciones**: la 019 de proyectos se reescribio (tenia recursion de RLS,
  autoaprobacion del autor y `anon` con escritura) y se aplico como 023. La 022
  se corrigio antes de aplicarse: filtraba el historial de moderacion a cualquier
  usuario con sesion. Se elimino la vista `quiz_questions_public` (027).
- **Honestidad del contenido**: se eliminaron las cifras inventadas de toda la
  web (entre 500 y 5.000 estudiantes segun la pagina, con 23 usuarios reales),
  los tres bloques de estadisticas, la cronologia de `/sobre-nosotros` y el
  `aggregateRating` falso. La pagina `/proyectos` se reescribio. En el blog se
  sustituyeron los juicios de inversion y se anadio un aviso al pie de todos los
  articulos.
- **Codigo muerto**: newsletter y mentoria (escribian en tablas inexistentes),
  `CourseAnalytics`, `ResourceUploader`, `structured-data.ts` y dos funciones de
  cache. Reapuntadas las referencias a tablas renombradas.
- **Idioma**: contenido y textos de interfaz neutralizados; convenciones de
  idioma anadidas a este documento.
- **Contenido**: 6 lecciones de Nodos Bitcoin escritas al estandar de 8.000-12.000
  caracteres y subidas.

### Anteriores

El historial detallado de las sesiones de enero y febrero de 2026 esta en la
v3.0 de este documento, en el historial de git. No se reproduce aqui porque
describe estados que ya no son ciertos.

---

**Ultima actualizacion:** 22/09/2026
**Proyecto:** Nodo360 Plataforma Educativa
**Version:** 5.0
