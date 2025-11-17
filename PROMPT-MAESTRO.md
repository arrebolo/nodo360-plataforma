# 🎯 PROMPT MAESTRO - PROYECTO NODO360

> **Usar al inicio de CADA sesión con Claude**
> Copiar y pegar este archivo completo + adjuntar CLAUDE.md

---

## 📌 CONTEXTO GENERAL

Soy el desarrollador de **Nodo360**, una plataforma educativa de Bitcoin y Blockchain.

**Stack**: Next.js 16 + React 19 + TypeScript 5 + Supabase + Tailwind CSS v4

**Documentación**: Lee CLAUDE.md adjunto (981 líneas) ANTES de responder.

---

## 🎯 OBJETIVO DEL PROYECTO

Crear plataforma educativa completa donde usuarios puedan:
- ✅ Explorar cursos estructurados (Cursos → Módulos → Lecciones)
- ✅ Inscribirse y seguir progreso personalizado
- ✅ Ver videos educativos
- ✅ Tomar notas con timestamps
- ✅ Marcar contenido importante (bookmarks)
- ✅ Obtener certificados al completar
- ✅ Interactuar en comunidad

---

## 📊 ESTADO ACTUAL (Actualización: 2025-11-17)

### ✅ LO QUE FUNCIONA

```
INFRAESTRUCTURA:
✅ Next.js 16 configurado
✅ TypeScript strict mode
✅ Tailwind CSS v4
✅ Supabase clientes (server + client)
✅ CLAUDE.md en español (documentación completa)

FRONTEND:
✅ Página /cursos funcionando
✅ Query getAllCourses() operativa
✅ Diseño responsive moderno
✅ Dashboard con UI completa (pero mock data)

BASE DE DATOS:
✅ Schema SQL completo (504 líneas) en supabase/schema.sql
✅ 7 tablas definidas
✅ Tipos TypeScript completos (550 líneas)
✅ RLS configurado

QUERIES:
✅ lib/db/courses-queries.ts con 6 funciones
✅ Estructura lesson.module.course (singular) implementada
```

### ❌ LO QUE FALTA (CRÍTICO)

```
🔴 CRÍTICO:
❌ Schema NO aplicado a Supabase (tablas no existen en BD)
❌ Base de datos vacía (0 cursos, 0 usuarios)
❌ Dashboard usa mock data (no conectado a BD real)

🟡 ALTA PRIORIDAD:
❌ Sistema de autenticación (login/registro)
❌ Sistema de inscripciones (tabla course_enrollments)
❌ Progreso real de lecciones
❌ Tabla de inscripciones no existe

🟢 MEDIA PRIORIDAD:
❌ Sistema de bookmarks funcional
❌ Sistema de notas funcional
❌ Generación de certificados
❌ Panel de administración
```

---

## 🗺️ PLAN DE IMPLEMENTACIÓN (10 FASES)

### **FASE 0: FUNDACIÓN** ⚠️ MANUAL (1 día)
```
Estado: [ ] PENDIENTE

Tareas (hacer manualmente, sin Claude):
1. Aplicar schema a Supabase
   - Ir a https://supabase.com/dashboard
   - SQL Editor → New Query
   - Copiar supabase/schema.sql COMPLETO
   - Pegar y ejecutar
   - Verificar 7 tablas creadas

2. Verificar .env.local tiene:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY

3. Crear usuario de prueba
   - Authentication → Add User
   - Email: test@nodo360.com

Verificación:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';
```

---

### **FASE 1: DATOS DE PRUEBA** 🤖 CON CLAUDE (1 día)
```
Estado: [ ] PENDIENTE

Objetivo: 1 curso funcional en BD

PROMPT PARA CLAUDE:
────────────────────────────────────────
Hola Claude, lee CLAUDE.md adjunto.

TAREA: Crear script de seed para primer curso.

Archivo: scripts/seed-first-course.ts

CURSO A CREAR:
- Título: "Bitcoin desde Cero"
- Slug: "bitcoin-desde-cero"
- Level: beginner
- Status: published
- Is_free: true
- Category: bitcoin
- Description: "Aprende Bitcoin paso a paso desde los fundamentos"

MÓDULO 1: "Introducción a Bitcoin" (2 lecciones)
  Lección 1.1: "¿Qué es Bitcoin?"
    - slug: "que-es-bitcoin"
    - video_duration_minutes: 15
    - is_free_preview: true
    - video_url: "https://www.youtube.com/watch?v=DEMO1"

  Lección 1.2: "Historia del Dinero Digital"
    - slug: "historia-dinero-digital"
    - video_duration_minutes: 20
    - is_free_preview: true
    - video_url: "https://www.youtube.com/watch?v=DEMO2"

MÓDULO 2: "Fundamentos Blockchain" (2 lecciones)
  Lección 2.1: "¿Qué es Blockchain?"
    - slug: "que-es-blockchain"
    - video_duration_minutes: 25
    - is_free_preview: false
    - video_url: "https://www.youtube.com/watch?v=DEMO3"

  Lección 2.2: "Minería de Bitcoin 101"
    - slug: "mineria-bitcoin-101"
    - video_duration_minutes: 30
    - is_free_preview: false
    - video_url: "https://www.youtube.com/watch?v=DEMO4"

REQUISITOS TÉCNICOS:
- Usar tipos: InsertCourse, InsertModule, InsertLesson
- Importar dotenv para leer .env.local
- Usar SUPABASE_SERVICE_ROLE_KEY
- Logging con emojis (🌱 🔍 ✅ ❌)
- Manejo de errores completo
- Actualizar campos calculados (total_modules, total_lessons)

Genera el código completo y listo para ejecutar.
────────────────────────────────────────

Verificación después:
npx tsx scripts/seed-first-course.ts
# Ir a http://localhost:3000/cursos
# Debe aparecer 1 curso
```

---

### **FASE 2: AUTENTICACIÓN** 🤖 CON CLAUDE (2 días)
```
Estado: [ ] PENDIENTE

Objetivo: Login y registro funcionales

PROMPT PARTE 1 - LOGIN:
────────────────────────────────────────
Lee CLAUDE.md.

TAREA: Implementar página de login.

Archivo: app/login/page.tsx

REQUISITOS:
- Client component ('use client')
- Form con email + password
- Método: supabase.auth.signInWithPassword()
- Si éxito → router.push('/dashboard') + router.refresh()
- Si error → mostrar mensaje de error

DISEÑO (consistente con el tema):
- Fondo: bg-[#1a1f2e]
- Card central: bg-white/10 backdrop-blur-sm border-white/20
- Inputs: bg-white/5 border-white/20 text-white
- Botón: gradient from-[#ff6b35] to-[#f7931a]
- Hover effects y transitions
- Link a /register

Estados a manejar:
- loading (deshabilitar botón)
- error (mostrar con bg-red-500/20)
- success (redirect automático)

Código completo por favor.
────────────────────────────────────────

PROMPT PARTE 2 - REGISTRO:
────────────────────────────────────────
Perfecto. Ahora crea app/register/page.tsx

Similar al login pero:
- Método: supabase.auth.signUp()
- Campos: email, password, confirmPassword
- Validar: password === confirmPassword
- Validar: password mínimo 6 caracteres
- Mensaje éxito: "Revisa tu email para confirmar cuenta"
- Link a /login

Mismo diseño que login.
────────────────────────────────────────

Verificación:
[ ] Puedo acceder a /login
[ ] Puedo acceder a /register
[ ] Registro crea usuario en Supabase Auth
[ ] Login funciona y redirige a /dashboard
[ ] Errores se muestran correctamente
```

---

### **FASE 3: INSCRIPCIONES** 🤖 CON CLAUDE (1 día)
```
Estado: [ ] PENDIENTE

Objetivo: Usuarios pueden inscribirse a cursos

PROMPT PARTE 1 - TABLA:
────────────────────────────────────────
Lee CLAUDE.md.

TAREA: Crear tabla de inscripciones.

Dame el SQL COMPLETO para ejecutar en Supabase SQL Editor:

Tabla: course_enrollments

Campos:
- id UUID primary key
- user_id UUID (FK a users)
- course_id UUID (FK a courses)
- enrolled_at TIMESTAMPTZ default NOW()
- last_accessed_at TIMESTAMPTZ nullable
- completed_at TIMESTAMPTZ nullable
- progress_percentage INTEGER default 0

Constraints:
- UNIQUE(user_id, course_id)
- ON DELETE CASCADE en FKs

Índices:
- idx_enrollments_user en user_id
- idx_enrollments_course en course_id

RLS:
- Enable RLS
- Policy: "Users can view own enrollments"
- Policy: "Users can enroll themselves"

SQL listo para copiar/pegar.
────────────────────────────────────────

PROMPT PARTE 2 - API:
────────────────────────────────────────
Excelente, tabla creada.

Ahora crea: app/api/enroll/route.ts

POST endpoint que:
1. Verifica usuario autenticado (getUser())
2. Si no hay user → return 401
3. Recibe { course_id } del body
4. Insert en course_enrollments
5. Return { data } o { error }

Usa: createClient de @/lib/supabase/server
Logging con emojis
Manejo completo de errores
────────────────────────────────────────

PROMPT PARTE 3 - UI:
────────────────────────────────────────
Perfecto. Ahora modifica: app/cursos/[slug]/page.tsx

CAMBIOS NECESARIOS:

1. Al inicio del componente, verificar si usuario está inscrito:
   - Query a course_enrollments
   - WHERE user_id = current_user AND course_id = course.id

2. Agregar estado de inscripción:
   - Si NO inscrito → Botón "Inscribirse Gratis"
   - Si SÍ inscrito → Badge "✓ Inscrito" + Botón "Ir al Curso"

3. Función handleEnroll:
   async function handleEnroll() {
     const res = await fetch('/api/enroll', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ course_id: course.id })
     })
     if (res.ok) {
       // Actualizar UI
       // Mostrar mensaje de éxito
     }
   }

4. Diseño del botón:
   - Mismo gradient que otros botones principales
   - Loading state
   - Disabled cuando está procesando

Muéstrame SOLO las partes a agregar, no todo el archivo.
────────────────────────────────────────

Verificación:
[ ] Tabla course_enrollments existe en Supabase
[ ] API /api/enroll responde correctamente
[ ] Botón aparece en página de curso
[ ] Click en botón crea registro
[ ] UI se actualiza después de inscribirse
```

---

### **FASE 4: DASHBOARD REAL** 🤖 CON CLAUDE (2 días)
```
Estado: [ ] EN PROGRESO (actualmente mock data)

Objetivo: Dashboard con datos reales del usuario

PROMPT:
────────────────────────────────────────
Lee CLAUDE.md.

TAREA GRANDE: Convertir dashboard a datos reales.

Archivo actual: app/dashboard/page.tsx
Estado actual: Client component con mock data (líneas 7-94)

TRANSFORMACIÓN NECESARIA:

1. ELIMINAR 'use client'
2. Convertir a async function
3. Agregar verificación auth:
   const supabase = await createClient()
   const { data: { user } } = await supabase.auth.getUser()
   if (!user) redirect('/login')

4. QUERIES REALES:

   // Inscripciones con join a courses
   const { data: enrollments } = await supabase
     .from('course_enrollments')
     .select(`
       *,
       course:course_id (
         id, title, slug, thumbnail_url, level
       )
     `)
     .eq('user_id', user.id)

   // Progreso total
   const { data: progressData } = await supabase
     .from('user_progress')
     .select('*')
     .eq('user_id', user.id)

5. CALCULAR STATS REALES:
   const stats = {
     activeCourses: enrollments?.length || 0,
     completedLessons: progressData?.filter(p => p.is_completed).length || 0,
     totalLessons: [calcular del total de lecciones de cursos inscritos],
     hoursStudied: [sumar watch_time_seconds / 3600],
     totalProgress: [calcular promedio de progress_percentage]
   }

6. REEMPLAZAR mock data con datos reales en:
   - Stats cards
   - Lista de cursos (mockEnrollments → enrollments)
   - Actividad reciente (por ahora puede quedar vacío)
   - Certificados (si hay)

7. MANTENER diseño actual, solo cambiar datos

¿Hacemos esto paso a paso o todo de una vez?
Si paso a paso, empecemos por las queries.
────────────────────────────────────────

Verificación:
[ ] Dashboard requiere autenticación
[ ] Muestra cursos reales del usuario
[ ] Stats reflejan datos reales
[ ] Si no hay inscripciones, muestra mensaje apropiado
[ ] Build sin errores (npm run build)
```

---

### **FASE 5: PROGRESO DE LECCIONES** 🤖 CON CLAUDE (1 día)
```
Estado: [ ] PENDIENTE

Objetivo: Marcar lecciones como completadas

PROMPT PARTE 1 - API:
────────────────────────────────────────
Lee CLAUDE.md.

TAREA: API de progreso de lecciones.

Archivo: app/api/progress/route.ts

POST endpoint que:
1. Verifica auth
2. Recibe { lesson_id, watch_time_seconds? }
3. Upsert en user_progress:
   - is_completed: true
   - completed_at: NOW()
   - watch_time_seconds: (acumulativo)
4. También actualizar progress_percentage en course_enrollments
   - Calcular: (lecciones completadas / total lecciones) * 100

Usar .upsert() para crear o actualizar

GET endpoint que:
1. Recibe ?lesson_id=xxx
2. Return progreso de esa lección para el usuario
────────────────────────────────────────

PROMPT PARTE 2 - UI:
────────────────────────────────────────
Ahora modifica la página de lección.

Archivo: app/cursos/[slug]/[lessonSlug]/page.tsx

AGREGAR:

1. Query para verificar si completada:
   const { data: progress } = await supabase
     .from('user_progress')
     .select('*')
     .eq('user_id', user.id)
     .eq('lesson_id', lesson.id)
     .single()

2. Componente client "CompleteLessonButton":
   - Props: lessonId, isCompleted
   - Si completada: "✓ Completada" (verde, disabled)
   - Si no: "Marcar como Completada" (botón normal)
   - onClick → POST a /api/progress
   - Loading state

3. Posición: Al final del contenido, antes de siguiente lección

Diseño consistente con el tema.
────────────────────────────────────────

Verificación:
[ ] Puedo marcar lección como completada
[ ] Se guarda en user_progress
[ ] Dashboard refleja progreso actualizado
[ ] No puedo marcar dos veces
[ ] % en enrollment se actualiza
```

---

### **FASE 6: BOOKMARKS** 🤖 CON CLAUDE (1 día)
```
Estado: [ ] PENDIENTE

PROMPT:
────────────────────────────────────────
Lee CLAUDE.md.

TAREA: Sistema de bookmarks completo.

PARTE 1 - API:
Archivo: app/api/bookmarks/route.ts

Implementar:
- GET: Listar bookmarks del usuario
  Query: bookmarks con join a lessons → module → course

- POST: Crear bookmark
  Body: { lesson_id, note? }

- DELETE: Eliminar bookmark
  Query param: ?id=xxx

PARTE 2 - COMPONENTE:
Archivo: components/lesson/BookmarkButton.tsx

Client component:
- Icono de marcador (Lucide: Bookmark)
- Toggle: agregar/quitar bookmark
- Si guardado: icono filled, color naranja
- Si no: icono outline, color gris
- onClick → POST o DELETE según estado
- Opcional: popup para agregar nota

PARTE 3 - PÁGINA:
Archivo: app/dashboard/bookmarks/page.tsx

Server component que:
- Lista todos los bookmarks del usuario
- Grid de cards con info de lección
- Link a la lección
- Botón para quitar bookmark
- Si vacío: "No tienes lecciones guardadas"

Dame todo el código necesario.
────────────────────────────────────────

Verificación:
[ ] Puedo guardar lección desde página de lección
[ ] Aparece en /dashboard/bookmarks
[ ] Puedo quitar bookmark
[ ] UI muestra estado correcto
```

---

### **FASE 7: NOTAS** 🤖 CON CLAUDE (1-2 días)
```
Estado: [ ] PENDIENTE

PROMPT:
────────────────────────────────────────
Lee CLAUDE.md.

TAREA: Sistema completo de notas.

PARTE 1 - API:
Archivo: app/api/notes/route.ts

CRUD completo:
- GET: Listar notas de una lección (?lesson_id=xxx)
- POST: Crear nota
  Body: { lesson_id, content, video_timestamp_seconds? }
- PUT: Editar nota
  Body: { id, content }
- DELETE: Eliminar nota
  Query: ?id=xxx

PARTE 2 - COMPONENTE:
Archivo: components/lesson/NotesPanel.tsx

Client component con:
- Lista de notas de la lección actual
- Form para agregar nueva nota
- Input de texto (textarea)
- Botón "Guardar Nota"
- Cada nota muestra:
  - Contenido
  - Timestamp de video (si hay)
  - Fecha de creación
  - Botones editar/eliminar
- Edición inline
- Confirmación antes de eliminar

PARTE 3 - INTEGRACIÓN:
Agregar NotesPanel a página de lección:
- Posición: Panel lateral o inferior
- Responsive: lateral en desktop, inferior en mobile
- Toggle para mostrar/ocultar

Diseño moderno y consistente.
────────────────────────────────────────

Verificación:
[ ] Puedo crear nota en lección
[ ] Puedo editar nota
[ ] Puedo eliminar nota
[ ] Timestamp se guarda si es video
[ ] Panel responsive funciona
```

---

### **FASE 8: CERTIFICADOS** 🤖 CON CLAUDE (2 días)
```
Estado: [ ] PENDIENTE

PROMPT PARTE 1 - TABLA:
────────────────────────────────────────
Lee CLAUDE.md.

TAREA: Sistema de certificados.

SQL para tabla certificates:
- id, user_id, course_id
- issued_at, certificate_number (único)
- certificate_url (para PDF futuro)
- UNIQUE(user_id, course_id)
- Índices y RLS

Dame el SQL completo.
────────────────────────────────────────

PROMPT PARTE 2 - LÓGICA:
────────────────────────────────────────
Ahora la lógica de emisión.

Cuando usuario completa última lección:
1. Verificar TODAS las lecciones del curso completadas
2. Si sí: Generar certificado
   - certificate_number: NODO360-[COURSE_CODE]-[USER_ID]-[YEAR]
   - Insertar en certificates
3. Actualizar completed_at en enrollment

Archivo: app/api/certificates/check/route.ts

POST endpoint que:
- Recibe { course_id }
- Verifica completitud
- Emite certificado si aplica
────────────────────────────────────────

PROMPT PARTE 3 - PÁGINA:
────────────────────────────────────────
Página de certificado.

Archivo: app/dashboard/certificados/[id]/page.tsx

Mostrar:
- Diseño elegante de certificado
- Nombre del usuario
- Nombre del curso
- Fecha de emisión
- Número de certificado
- Botón "Descargar PDF" (por ahora solo mensaje)
- Botón "Compartir en LinkedIn"

Diseño profesional tipo diploma.
────────────────────────────────────────

Verificación:
[ ] Al completar todas las lecciones se genera certificado
[ ] Aparece en dashboard
[ ] Puedo ver el certificado
[ ] Diseño profesional
```

---

### **FASE 9: ADMIN PANEL** 🤖 CON CLAUDE (3-4 días)
```
Estado: [ ] PENDIENTE (Futuro)

TAREAS:
1. Middleware de autenticación por rol
2. CRUD de cursos (admin/instructor)
3. CRUD de módulos
4. CRUD de lecciones
5. Upload de imágenes
6. Preview del curso
7. Publicar/despublicar
8. Analytics básicos

(Detalles específicos cuando lleguemos aquí)
```

---

### **FASE 10: OPTIMIZACIONES** 🤖 CON CLAUDE (2 días)
```
Estado: [ ] PENDIENTE (Futuro)

TAREAS:
1. React Cache para queries
2. Optimizar queries (select solo necesario)
3. Lazy loading de componentes
4. Image optimization
5. Lighthouse audit
6. Accesibilidad
7. SEO avanzado

(Detalles específicos cuando lleguemos aquí)
```

---

## 🎯 INSTRUCCIONES PARA CLAUDE (IA)

### Al recibir este prompt:

1. ✅ **Confirma** que leíste CLAUDE.md
2. ✅ **Pregunta** en qué FASE estamos
3. ✅ **Verifica** estado actual del proyecto
4. ✅ **Propón** siguiente paso específico
5. ✅ **Pide confirmación** antes de generar código

### Al generar código:

1. ✅ Seguir convenciones de CLAUDE.md
2. ✅ Usar tipos de types/database.ts
3. ✅ Logging con emojis (🔍 ✅ ❌)
4. ✅ Comentarios en español
5. ✅ Código limpio y mantenible
6. ✅ Manejo de errores completo

### Al terminar tarea:

1. ✅ Resumir lo hecho
2. ✅ Indicar cómo verificar
3. ✅ Proponer siguiente paso
4. ✅ Actualizar checklist

### REGLAS CRÍTICAS:

⚠️ **NUNCA**:
- Usar `lesson.modules.courses` (plural)
- Saltarse lectura de archivos
- Ignorar tipos de database.ts
- Commit sin probar
- Importaciones relativas

✅ **SIEMPRE**:
- Usar `lesson.module.course` (singular)
- Leer archivo antes de editar
- Usar tipos correctos
- Alias `@/` para imports
- Logging con emojis

---

## 🚀 INICIO DE SESIÓN

**Cuando empieces una nueva sesión, responde:**

1. ¿Leíste CLAUDE.md completo?
2. ¿En qué FASE estamos? (mira el estado de cada una arriba)
3. ¿Cuál es la siguiente tarea específica?
4. ¿Necesitas que te muestre algún archivo antes de empezar?

**Luego confirma:**
- ✅ Tengo acceso al proyecto
- ✅ .env.local configurado
- ✅ Supabase operativo
- ✅ Entiendo la tarea

**Y comienza paso a paso.**

---

## 📝 CHECKLIST DE PROGRESO

```
FASE 0: Fundación           [ ] Pendiente
FASE 1: Datos de Prueba     [ ] Pendiente
FASE 2: Autenticación       [ ] Pendiente
FASE 3: Inscripciones       [ ] Pendiente
FASE 4: Dashboard Real      [ ] En Progreso (mock data)
FASE 5: Progreso            [ ] Pendiente
FASE 6: Bookmarks           [ ] Pendiente
FASE 7: Notas               [ ] Pendiente
FASE 8: Certificados        [ ] Pendiente
FASE 9: Admin Panel         [ ] Pendiente
FASE 10: Optimizaciones     [ ] Pendiente
```

**Última actualización**: 2025-11-17
**Próxima acción**: [DEFINIR AL INICIAR SESIÓN]

---

## 💡 TIPS PARA SESIONES EFICIENTES

### Flujo ideal:
```
1. Copiar este prompt completo
2. Adjuntar CLAUDE.md
3. Especificar: "Estoy en FASE X, continuemos"
4. Claude propone siguiente paso
5. Confirmas
6. Claude genera código
7. Implementas
8. Reportas resultado
9. Siguiente paso
```

### Si hay error:
```
"❌ Error al ejecutar:
[pegar error completo del terminal]"

Claude analiza y da solución
```

### Si funciona:
```
"✅ Funciona correctamente.
[screenshot o descripción]
Siguiente paso?"

Claude propone continuar
```

---

**FIN DEL PROMPT MAESTRO**

*Este archivo se actualiza con el progreso del proyecto.*
