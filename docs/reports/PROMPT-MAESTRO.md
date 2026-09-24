# PROMPT MAESTRO - PROYECTO NODO360

**Version:** 5.0
**Fecha:** 22/09/2026
**Sustituye a:** v4.0 (21/09/2026)

> **Por que existe esta version.** La v4.0 fue la primera con las cifras
> verificadas una a una, y ese criterio se mantiene. Lo que cambia es el estado:
> en un solo dia se cerro una cadena de agujeros de seguridad en las funciones de
> la base de datos, se unifico la formula de nivel, se corrigio la concesion
> duplicada de puntos y se paso una revision ortografica al contenido y a la
> interfaz. Varias cosas que la v4.0 daba por buenas no lo eran, y eso es lo mas
> importante que documenta esta version.
>
> Todas las cifras estan verificadas contra el repositorio, la base de datos y
> Vercel el 22/09/2026. Cuando un dato no se ha podido verificar, se dice.
>
> **La leccion de esta tanda**: el repositorio NO describe la base de datos. Tres
> veces seguidas el cuerpo vivo de una funcion resulto ser distinto del que
> figuraba en `supabase/migrations/`. Antes de tocar nada en la base de datos hay
> que leer `pg_get_functiondef`, no el repo.

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

## METRICAS REALES (22/09/2026)

Todas contadas, no estimadas. Entre parentesis, lo que decia la version anterior
cuando el dato ha cambiado.

### Codigo

| Metrica | Valor | Como se cuenta |
|---------|-------|----------------|
| Paginas (`page.tsx`) | **106** | `find app -name page.tsx` (v3.0 decia "100+") |
| Layouts | 6 | `find app -name layout.tsx` |
| Endpoints API (`route.ts`) | **94** | de ellos **33** bajo `/api/admin` (v3.0: 79 y 29) |
| Componentes `.tsx` | **175** | en 25 carpetas bajo `components/` (v4.0: 173) |
| Modulos `lib/` | **95** archivos `.ts` | en 26 subcarpetas (v3.0: "15+") |
| Archivos de tipos | 9 | `types/*.ts` |
| Commits en `main` | 147 | |
| Ramas remotas | 28 | incluye ramas muertas por limpiar |

### Base de datos (Supabase, proyecto `gcahtbecfidroepelcuw`)

Contado sobre el esquema `public` expuesto por PostgREST, no sobre lo que el
codigo espera encontrar.

| Metrica | Valor |
|---------|-------|
| Tablas existentes | **80** (v3.0 decia "38+ tablas core") |
| Vistas | 2 (`instructor_referral_stats`, `message_flags_summary`) + `user_incident_summary` |
| Funciones RPC expuestas | **65** (v3.0 decia "27+") |
| Migraciones en `supabase/migrations/` | **34** (v4.0: 23) |
| Migraciones en `docs/migrations/` | **6** (carpeta paralela, ver Deuda) |

### Contenido

| Metrica | Valor |
|---------|-------|
| Cursos totales | **13** |
| — publicados | **13** (v4.0: 11; Cold Storage y Nodos Bitcoin ya estan publicados) |
| — en borrador | **0** |
| — gratuitos / premium | 13 / 0 |
| Modulos | 26 |
| Lecciones | **78** (ninguna vacia) |
| Preguntas de quiz | 91 |
| Rutas de aprendizaje | **6** activas (el objetivo son 8, ver Roadmap) |
| — con subtitulo y descripcion larga | **6 de 6** tras la migracion 041 (antes 4) |
| Articulos de blog | 15 |
| Terminos de glosario | 72 |

**Longitud de las lecciones** (caracteres de `lessons.content`):

| | Valor |
|---|---|
| Minimo | 857 |
| Mediana global | **1.748** |
| Mediana en cursos publicados | 1.748 (n=66) |
| Mediana en cursos borrador | 4.816 (n=12) |
| Maximo | 12.371 |
| Lecciones de 8.000 caracteres o mas | **6 de 78** (7,7%) — las seis son de Nodos Bitcoin, en borrador |

### Usuarios y actividad

| Metrica | Valor |
|---------|-------|
| Usuarios | **23** |
| — por rol | 20 `student`, 1 `mentor`, 1 `admin`, 1 `instructor` |
| — suspendidos | 0 |
| Inscripciones (`course_enrollments`) | **28**, de ellas 13 completadas |
| Lecciones completadas (`user_progress`) | 91 |
| Certificados emitidos (`certificates`) | **16** (v4.0: 13) |
| Intentos de examen final | **0** |
| Entitlements (acceso premium) | **0** |
| Suscripciones | 1 |
| Compras de curso | 0 |
| Mensajes / conversaciones | 12 / 1 |
| Comentarios en lecciones | **0** |
| Propuestas de gobernanza / votos | 1 / 1 — **la unica propuesta esta `cancelled` desde 11/2025**, por eso /gobernanza muestra el estado vacio |
| Aplicaciones a mentor | 0 |
| Invitaciones | 0 |
| Feedback de beta | 6 |

> **Lectura honesta de estas cifras**: la plataforma tiene 23 usuarios y 13
> certificados. Los 13 certificados se emitieron **antes** del arreglo de
> validacion del quiz del 20/09/2026, y no hay forma de saber cuales se ganaron
> respondiendo preguntas (`course_final_quiz_attempts` esta a 0). Es una decision
> de producto pendiente, anotada en el plan.

### Despliegue

| | Valor |
|---|---|
| Produccion | `dpl_3C3T77nYXb5zyuRFaBN2ALQVYiFL`, estado READY |
| Commit servido | `8268aca` (PR #124), rama `main`, `source: git` |
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

**Estado verificado**: la base de datos tiene **6 rutas activas**.

| # | Ruta en BD | Slug | Posicion |
|---|------------|------|----------|
| 1 | Fundamentos de Bitcoin | `fundamentos-bitcoin` | 1 |
| 2 | Seguridad en Criptomonedas | `seguridad-cripto` | 2 |
| 3 | Web3 Basica | `web3-basica` | 3 |
| 4 | Seguridad Avanzada | `seguridad-avanzada` | 4 |
| 5 | Trading Basico | `trading-basico` | 4 (colision de `position`) |
| 6 | Bitcoin Tecnico | `bitcoin-tecnico` | 5 |

**Areas ausentes** que el Tier 3 del plan identifica para completar Web3:
Fundamentos de Blockchain · Ethereum y Smart Contracts · DAOs · NFTs · DeFi ·
Otras L1/L2 e Interoperabilidad.

> **El mapa canonico de 8 rutas no esta registrado en el repositorio.** Se ha
> buscado y no aparece en ningun archivo. Seis rutas existentes mas seis areas
> ausentes no suman ocho, asi que hay una consolidacion decidida que no esta
> escrita en ninguna parte (probablemente Seguridad basica + avanzada como una
> sola, y el destino de Trading, que es una decision abierta del Tier 2).
> **Hay que pegar aqui el mapa de 8 rutas tal y como esta decidido.** No se
> reconstruye por deduccion.

---

## ESTANDAR DE CONTENIDO

**Una leccion de nivel intermedio son 8.000-12.000 caracteres.** La referencia es
*Nodos Bitcoin 1.1 — El Rol de los Nodos en Bitcoin*: 12.371 caracteres.

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

## DEUDA CONOCIDA

El inventario vive en **`docs/PLAN-REFORMA.md`**, organizado en Tier 0-3. No se
duplica aqui. Resumen de por donde va, al 22/09/2026:

- **Tier 0 (parar la sangria)**: CI en las PRs (sigue sin haber ninguna
  verificacion automatica antes de mergear), y decidir que se hace con los
  certificados emitidos antes del arreglo del quiz.
- **Tier 1 (contenido)**: fusionar los cursos duplicados. Los dos borradores ya
  estan publicados.
- **Tier 2 (estructural)**: unificar las dos carpetas de migraciones (hay numeros
  duplicados con contenidos distintos: 015, 016, 019, 020 y 021), decidir sobre
  `user_lesson_progress` (0 filas) frente a `user_progress`, resolver el acceso
  por URL a lecciones de cursos en borrador, y decidir sobre el esquema
  `backup_nodo360` (contiene una copia de `users` con datos personales, y desde
  el 22/09 tambien los respaldos de las limpiezas 038 y 041).
- **Tier 3 (construccion)**: los seis cursos que faltan para cubrir Web3.

### Lo que esta tanda dejo abierto

| Deuda | Estado |
|---|---|
| **7 vulnerabilidades de produccion** (2 altas, 5 moderadas) | Sin resolver desde la v4.0. `npm audit fix` las arregla pero nadie lo ha ejecutado |
| **569 de 588 eventos de XP sin fuente** | La limpieza de la 038 dejo 210 eventos; los que siguen sin `related_id` no se pueden auditar ni proteger con el indice unico |
| **`lib/supabase/types.ts` desfasado** | Declara 15 de las 65 RPC. El 77% de las llamadas a RPC del proyecto no estan tipadas |
| **Los umbrales de nivel viven en dos sitios** | La tabla `level_thresholds` manda y el array de `lib/gamification/levels.ts` es el espejo. La comprobacion 10 de `039-comprobar.sql` vigila que no se separen |
| **`UserLevel.tsx` es codigo muerto** | No lo monta nadie. Se arreglo igualmente porque estaba en el repo |
| **Cinco usuarios bajaron de nivel** | Efecto de unificar la formula. Ninguno perdio insignias: no hay ninguna que dependa del nivel |
| **Fugas de lectura sin rastro** | Las funciones `SECURITY DEFINER` estuvieron abiertas a `anon` hasta el 22/09. Las escrituras no dejaron rastro (17 de 19 comprobaciones forenses a cero), pero las **lecturas** no dejan ninguno: nunca se sabra si alguien las consulto |
| **El entorno local va con Node 24 y produccion con Node 22** | `.nvmrc` y `engines.node` ya fijan la 22, pero el aviso `EBADENGINE` seguira saliendo hasta que el entorno de desarrollo cambie. Mientras tanto, todo lockfile generado en local hay que regenerarlo con `npx npm@10` |
| **`main` llego a no compilar** | Dos ramas tocaron regiones distintas de `awardXP.ts`, git las fusiono sin conflicto y el resultado no pasaba `tsc`. Lo caza el CI nuevo, pero solo en PRs: un push directo a `main` sigue sin verificarse |
| **1 vulnerabilidad alta en `sharp`** | Es `devDependency` y pide un cambio mayor (0.34 -> 0.35). Por eso el CI audita con `--omit=dev` |

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

- `supabase/migrations/` — 23 archivos, 003 a 027. **Es la secuencia buena.**
- `docs/migrations/` — 6 archivos, 015 a 021. Paralela, con numeros que chocan.

En al menos un caso (`course_reviews`) las dos versiones del 019 crean la misma
tabla con esquemas incompatibles, y solo consultando la base de datos se puede
saber cual gano (la de `docs/`). Unificarlas esta en el Tier 2.

Aplicadas a mano y versionadas a posteriori el 21/09/2026: 024 (RLS del quiz),
025 (privilegios de columna de `quiz_questions`), 026 (retirada de las tablas de
SPV Trabajos).

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

    **Si el entorno local va con otra version**, el install avisa con
    `EBADENGINE` y no falla. Ese aviso no es ruido: significa que cualquier
    lockfile que se genere ahi puede romper el CI.

### Codigo

- Usar `lesson.module.course` (singular), nunca las relaciones plurales
- Leer los archivos antes de editarlos
- Verificar que compila antes de hacer commit
- Alias `@/` en los imports
- No ignorar el `error` de una consulta a Supabase y usar solo `data`: asi es
  como una seccion entera desaparece sin que nadie se entere

---

## HISTORIAL DE SESIONES

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
