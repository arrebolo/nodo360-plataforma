# 🚀 Cómo Aplicar la Migración en Supabase

## 📝 Archivos Disponibles

### Para DESARROLLO
```
01-migration-quiz-certificates-dev.sql
```
- ⚠️ **Incluye DROP TABLE** - Borra datos existentes
- Ideal para desarrollo local y testing
- Permite recrear tablas fácilmente

### Para PRODUCCIÓN
```
migration-quiz-certificates.sql
```
- ✅ **Seguro** - No borra datos
- Usa `IF NOT EXISTS`
- Recomendado para producción

### Datos de Ejemplo
```
02-seed-quiz-data.sql
```
- 5 preguntas de quiz para Módulo 1
- Marca módulos con `requires_quiz = true`
- Auto-detecta primer módulo disponible

---

## 🎯 Método Recomendado: Supabase Dashboard

### Paso 1: Acceder a Supabase

1. Ve a [supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Click en **SQL Editor** en el menú lateral

### Paso 2: Ejecutar Migración

#### Para Desarrollo:

1. **Abrir archivo:** `01-migration-quiz-certificates-dev.sql`
2. **Copiar todo el contenido** (Ctrl+A, Ctrl+C)
3. **Pegar en SQL Editor** de Supabase
4. **Click en "Run"** (o Ctrl+Enter)
5. **Esperar confirmación:** `✅ All tables created successfully`

#### Para Producción:

1. **Abrir archivo:** `migration-quiz-certificates.sql`
2. **Copiar todo el contenido**
3. **Pegar en SQL Editor**
4. **Click en "Run"**
5. **Verificar sin errores** (no hay mensaje de confirmación en esta versión)

### Paso 3: Verificar Tablas Creadas

1. Ve a **Table Editor** en el menú lateral
2. Busca las nuevas tablas:
   - ✅ `quiz_questions`
   - ✅ `quiz_attempts`
   - ✅ `certificates`

### Paso 4: Insertar Datos de Prueba

1. **Volver a SQL Editor**
2. **Abrir archivo:** `02-seed-quiz-data.sql`
3. **Copiar todo el contenido**
4. **Pegar en SQL Editor**
5. **Click en "Run"**
6. **Verificar mensaje:** `✅ 5 preguntas insertadas correctamente`

---

## 🔍 Verificación Rápida

Ejecuta este query en SQL Editor para verificar que todo está correcto:

```sql
-- Verificar tablas
SELECT 'quiz_questions' as tabla, COUNT(*) as registros FROM quiz_questions
UNION ALL
SELECT 'quiz_attempts', COUNT(*) FROM quiz_attempts
UNION ALL
SELECT 'certificates', COUNT(*) FROM certificates;

-- Debería mostrar:
-- quiz_questions | 5 (o más)
-- quiz_attempts  | 0 (inicialmente)
-- certificates   | 0 (inicialmente)
```

---

## ⚡ Método Alternativo: CLI de Supabase

### Pre-requisitos

```bash
npm install -g supabase
supabase login
supabase link --project-ref tu-project-ref
```

### Ejecutar Migración

```bash
# Desarrollo
supabase db push --file supabase/01-migration-quiz-certificates-dev.sql

# Producción
supabase db push --file supabase/migration-quiz-certificates.sql

# Seed data
supabase db push --file supabase/02-seed-quiz-data.sql
```

---

## 📊 Verificación Completa

Después de aplicar la migración, ejecuta estos queries:

### 1. Verificar Estructura

```sql
-- Ver todas las columnas de quiz_questions
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'quiz_questions'
ORDER BY ordinal_position;
```

### 2. Verificar Funciones

```sql
-- Listar funciones creadas
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_best_quiz_attempt',
    'has_passed_module_quiz',
    'is_module_accessible',
    'generate_certificate_number',
    'issue_module_certificate'
  );
```

### 3. Verificar RLS

```sql
-- Ver políticas de seguridad
SELECT tablename, policyname, permissive, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('quiz_questions', 'quiz_attempts', 'certificates')
ORDER BY tablename, policyname;
```

### 4. Ver Preguntas Insertadas

```sql
-- Listar preguntas con sus módulos
SELECT
  qq.order_index as "#",
  LEFT(qq.question, 50) || '...' as pregunta,
  qq.difficulty,
  m.title as modulo,
  c.title as curso
FROM quiz_questions qq
JOIN modules m ON qq.module_id = m.id
JOIN courses c ON m.course_id = c.id
ORDER BY qq.order_index;
```

---

## 🐛 Solución de Problemas

### Error: "permission denied for schema public"

**Causa:** Sin permisos para crear tablas

**Solución:**
```sql
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
```

### Error: "extension uuid-ossp does not exist"

**Causa:** Extensión no habilitada

**Solución:**
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Error: "table already exists"

**Solución para desarrollo:**
- Usar `01-migration-quiz-certificates-dev.sql` (incluye DROP TABLE)

**Solución para producción:**
- La migración usa `IF NOT EXISTS`, debería ser seguro
- Si persiste, verificar que no haya constraints duplicados

### Error: "column already exists" en modules.requires_quiz

**Solución:**
```sql
-- Verificar si existe
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'modules' AND column_name = 'requires_quiz';

-- Si existe, saltar este paso (comentar línea en migración)
-- Si no existe, ejecutar:
ALTER TABLE modules ADD COLUMN requires_quiz BOOLEAN DEFAULT false;
```

---

## 📋 Checklist de Aplicación

**Antes de ejecutar:**
- [ ] Backup de base de datos (si hay datos importantes)
- [ ] Schema principal aplicado (users, courses, modules, lessons)
- [ ] Acceso a Supabase Dashboard
- [ ] Archivos SQL descargados localmente

**Durante ejecución:**
- [ ] Migración ejecutada sin errores
- [ ] Seed data ejecutado correctamente
- [ ] Mensajes de confirmación visibles

**Después de ejecutar:**
- [ ] Tablas visibles en Table Editor
- [ ] Funciones listadas en Database → Functions
- [ ] Preguntas insertadas verificadas
- [ ] RLS habilitado en las 3 tablas

---

## 🎉 ¡Listo!

Si todo salió bien, deberías tener:

✅ 3 nuevas tablas creadas
✅ 5 funciones SQL operativas
✅ Campo `requires_quiz` en modules
✅ 5 preguntas de ejemplo insertadas
✅ RLS configurado correctamente

**Próximo paso:** Integrar con el frontend usando los componentes ya creados.

Ver: `IMPLEMENTATION_GUIDE.md` para código de ejemplo.

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa `MIGRATION_CHECKLIST.md` para verificación detallada
2. Consulta `README_DATABASE.md` para estructura de tablas
3. Revisa logs en Supabase Dashboard → Logs
4. Ejecuta queries de verificación arriba

**¡Todo listo para aplicar! 🚀**
