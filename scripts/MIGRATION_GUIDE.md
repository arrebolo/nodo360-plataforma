# 🔄 Guía de Migración de Cursos

Esta guía explica cómo migrar cursos desde el proyecto `nodo360-cursos` a la base de datos de Supabase.

## 📋 Pre-requisitos

Antes de ejecutar la migración, asegúrate de:

1. **Schema aplicado en Supabase**
   - Ejecuta el schema SQL en Supabase Dashboard (ver `SCHEMA_APPLICATION.md`)
   - Verifica que las 7 tablas están creadas

2. **Variables de entorno configuradas**
   - `.env.local` debe contener:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY` (clave de administrador)

3. **Proyecto nodo360-cursos accesible**
   - Ruta: `C:\Users\alber\proyectos\nodo360-cursos`
   - Estructura esperada:
     ```
     nodo360-cursos/
     └── app/
         └── cursos/
             ├── bitcoin-desde-cero/
             │   ├── page.tsx
             │   └── leccion/
             │       ├── 1-1/page.tsx
             │       ├── 1-2/page.tsx
             │       └── ...
             ├── fundamentos-blockchain/
             └── primera-wallet/
     ```

## 🚀 Ejecutar Migración

### Opción 1: Usando npm script (recomendado)

```bash
cd /c/Users/alber/nodo360-projects/nodo360-plataforma
npm run migrate-courses
```

### Opción 2: Ejecutar directamente con tsx

```bash
cd /c/Users/alber/nodo360-projects/nodo360-plataforma
npx tsx scripts/migrate-courses.ts
```

## 📊 Qué Hace el Script

El script de migración:

1. **Lee la estructura de archivos** de cada curso en `nodo360-cursos`
2. **Extrae metadata** de los archivos `page.tsx`:
   - Título del curso/lección
   - Descripción
   - Contenido completo
3. **Organiza en módulos** basándose en el patrón `{módulo}-{lección}`
4. **Inserta en Supabase** respetando las relaciones:
   - Course → Modules → Lessons

## 📁 Cursos que se Migran

El script está configurado para migrar estos 3 cursos:

1. **bitcoin-desde-cero**
   - Slug: `bitcoin-desde-cero`
   - Nivel: Beginner
   - Gratuito: ✅

2. **fundamentos-blockchain**
   - Slug: `fundamentos-blockchain`
   - Nivel: Beginner
   - Gratuito: ✅

3. **primera-wallet**
   - Slug: `primera-wallet`
   - Nivel: Beginner
   - Gratuito: ✅

## 🔍 Salida del Script

El script muestra progreso en tiempo real:

```
============================================================
🔄 COURSE MIGRATION: Next.js → Supabase
============================================================

📁 Source: C:\Users\alber\proyectos\nodo360-cursos\app\cursos
🎯 Courses to migrate: 3

👤 Getting instructor user...
   ✅ Using instructor: instructor@example.com

📖 Reading course: bitcoin-desde-cero
   ✓ Course title: Bitcoin Desde Cero
   ✓ Found 12 lessons
   ✓ Lesson 1-1: ¿Qué es Bitcoin?
   ✓ Lesson 1-2: Historia de Bitcoin
   ...
   ✅ Course parsed: 3 modules, 12 lessons

🚀 Inserting course: Bitcoin Desde Cero
   ✅ Course inserted: abc123...
      ✅ Module inserted: Módulo 1
         ✅ Lesson inserted: ¿Qué es Bitcoin?
         ✅ Lesson inserted: Historia de Bitcoin
   ...

============================================================
📊 MIGRATION SUMMARY
============================================================
✅ Successful: 3
❌ Errors: 0
📝 Total: 3

🎉 Migration completed successfully!

📋 Next steps:
   1. Verify courses in Supabase Dashboard → Table Editor
   2. Check course pages on your website
   3. Update any video URLs if needed
============================================================
```

## ✅ Verificación Post-Migración

Después de ejecutar la migración:

### 1. Verificar en Supabase Dashboard

Ve a: **Table Editor** y verifica:

- ✅ Tabla `courses`: 3 registros
- ✅ Tabla `modules`: ~9-12 módulos (depende del curso)
- ✅ Tabla `lessons`: ~30-40 lecciones

### 2. Verificar Datos

**En tabla courses:**
```sql
SELECT slug, title, status, total_modules, total_lessons
FROM courses
ORDER BY created_at DESC;
```

Deberías ver:
- `bitcoin-desde-cero`
- `fundamentos-blockchain`
- `primera-wallet`

**En tabla modules:**
```sql
SELECT m.title, m.order_index, c.slug as course_slug
FROM modules m
JOIN courses c ON c.id = m.course_id
ORDER BY c.slug, m.order_index;
```

**En tabla lessons:**
```sql
SELECT l.title, l.slug, l.order_index, m.title as module_title
FROM lessons l
JOIN modules m ON m.id = l.module_id
JOIN courses c ON c.id = m.course_id
WHERE c.slug = 'bitcoin-desde-cero'
ORDER BY m.order_index, l.order_index;
```

### 3. Verificar en la Web

Abre en tu navegador:
- http://localhost:3000/cursos/bitcoin-desde-cero
- http://localhost:3000/cursos/fundamentos-blockchain
- http://localhost:3000/cursos/primera-wallet

## 🔧 Personalizar la Migración

### Agregar Más Cursos

Edita `scripts/migrate-courses.ts` línea ~30:

```typescript
const COURSES_TO_MIGRATE = [
  {
    slug: 'bitcoin-desde-cero',
    dirName: 'bitcoin-desde-cero',
  },
  {
    slug: 'fundamentos-blockchain',
    dirName: 'fundamentos-blockchain',
  },
  {
    slug: 'primera-wallet',
    dirName: 'primera-wallet',
  },
  // Agrega más cursos aquí
  {
    slug: 'nuevo-curso',
    dirName: 'nuevo-curso',
  },
]
```

### Cambiar Ruta de Origen

Edita línea ~25:

```typescript
const COURSES_SOURCE_PATH = 'NUEVA/RUTA/A/CURSOS'
```

### Asignar Instructor Específico

El script automáticamente busca un usuario con rol `instructor` en la base de datos. Si quieres especificar uno:

```typescript
// En la función main(), reemplaza:
const instructorId: string | null = 'tu-instructor-uuid-aquí'
```

## 🚨 Manejo de Errores

### Error: "Source directory not found"

**Causa:** La ruta a `nodo360-cursos` no existe o es incorrecta.

**Solución:**
1. Verifica que `C:\Users\alber\proyectos\nodo360-cursos` existe
2. Ajusta `COURSES_SOURCE_PATH` en el script si la ruta es diferente

### Error: "Course directory not found"

**Causa:** Uno de los cursos no existe en la ruta especificada.

**Solución:**
- Verifica que `app/cursos/{nombre-curso}/` existe
- Ajusta `dirName` en `COURSES_TO_MIGRATE`

### Error: "Could not extract title from course page"

**Causa:** El archivo `page.tsx` del curso no tiene metadata legible.

**Solución:**
- Asegúrate que `page.tsx` contiene:
  - Metadata con `title` o
  - Un elemento `<h1>` con el título

### Error: "Error inserting course" (duplicate key)

**Causa:** El curso ya existe en la base de datos.

**Solución:**
- El script automáticamente salta cursos existentes
- Si quieres re-migrar, elimina el curso primero:
  ```sql
  DELETE FROM courses WHERE slug = 'nombre-curso';
  ```

### Warning: "No instructor found in database"

**Causa:** No hay usuarios con rol `instructor` en la base de datos.

**Solución:**
- Los cursos se crearán sin instructor (instructor_id = NULL)
- Para asignar instructor después:
  ```sql
  UPDATE courses
  SET instructor_id = 'usuario-id'
  WHERE instructor_id IS NULL;
  ```

## 📝 Estructura de Datos Migrada

### Course
```typescript
{
  slug: 'bitcoin-desde-cero',
  title: 'Bitcoin Desde Cero',
  description: 'Aprende Bitcoin...',
  level: 'beginner',
  status: 'published',
  is_free: true,
  total_modules: 3,
  total_lessons: 12,
}
```

### Module
```typescript
{
  title: 'Módulo 1',
  slug: 'modulo-1',
  order_index: 1,
  total_lessons: 4,
}
```

### Lesson
```typescript
{
  title: '¿Qué es Bitcoin?',
  slug: '1-1',
  order_index: 1,
  content: '...',  // HTML/Markdown completo
  is_free_preview: true,  // Solo primera lección
}
```

## 🔄 Re-ejecutar la Migración

Si necesitas re-ejecutar la migración:

1. **Elimina datos existentes:**
   ```sql
   -- En Supabase SQL Editor
   DELETE FROM lessons;
   DELETE FROM modules;
   DELETE FROM courses;
   ```

2. **Re-ejecuta el script:**
   ```bash
   npm run migrate-courses
   ```

## 📞 Soporte

Si encuentras problemas:

1. Verifica los logs del script
2. Revisa las queries SQL en Supabase Dashboard
3. Verifica que el schema está correctamente aplicado
4. Comprueba que `.env.local` tiene las credenciales correctas

---

**Última actualización:** Noviembre 2024
**Versión:** 1.0.0
