# ✅ Checklist de Migración - Quiz y Certificados

## 📋 Pre-requisitos

- [ ] **Supabase Project creado**
- [ ] **Schema principal aplicado** (`schema.sql` con tablas: users, courses, modules, lessons)
- [ ] **Acceso a Supabase Dashboard**
- [ ] **Backup de base de datos** (recomendado si hay datos en producción)

---

## 🚀 Paso 1: Aplicar Migración

### Para Desarrollo (⚠️ Borra datos existentes)

```bash
Archivo: supabase/01-migration-quiz-certificates-dev.sql
```

- [ ] Abrir Supabase Dashboard
- [ ] Ir a SQL Editor
- [ ] Copiar contenido de `01-migration-quiz-certificates-dev.sql`
- [ ] Pegar en SQL Editor
- [ ] Ejecutar script
- [ ] Verificar mensaje: `✅ All tables created successfully`

### Para Producción (✅ Seguro)

```bash
Archivo: supabase/migration-quiz-certificates.sql
```

- [ ] Abrir Supabase Dashboard
- [ ] Ir a SQL Editor
- [ ] Copiar contenido de `migration-quiz-certificates.sql`
- [ ] Pegar en SQL Editor
- [ ] Ejecutar script
- [ ] Sin mensaje de error = éxito

---

## 🌱 Paso 2: Insertar Datos de Prueba

```bash
Archivo: supabase/02-seed-quiz-data.sql
```

- [ ] Verificar que módulos existen (ver paso 2.1)
- [ ] Copiar contenido de `02-seed-quiz-data.sql`
- [ ] Pegar en SQL Editor
- [ ] Ejecutar script
- [ ] Verificar mensaje: `✅ 5 preguntas insertadas correctamente`

### 2.1 Verificar Módulos Existentes

```sql
SELECT id, title, order_index
FROM modules
ORDER BY order_index;
```

Si no hay módulos, crear al menos uno antes de continuar.

---

## ✅ Paso 3: Verificación

### 3.1 Verificar Tablas

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('quiz_questions', 'quiz_attempts', 'certificates')
ORDER BY table_name;
```

**Resultado esperado:** 3 filas

- [ ] ✅ `certificates`
- [ ] ✅ `quiz_attempts`
- [ ] ✅ `quiz_questions`

### 3.2 Verificar Funciones

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_name LIKE '%quiz%' OR routine_name LIKE '%certificate%');
```

**Resultado esperado:** 5 funciones

- [ ] ✅ `get_best_quiz_attempt`
- [ ] ✅ `has_passed_module_quiz`
- [ ] ✅ `is_module_accessible`
- [ ] ✅ `generate_certificate_number`
- [ ] ✅ `issue_module_certificate`

### 3.3 Verificar Campo en Modules

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'modules'
  AND column_name = 'requires_quiz';
```

**Resultado esperado:** 1 fila

- [ ] ✅ `requires_quiz | boolean`

### 3.4 Verificar Preguntas Insertadas

```sql
SELECT COUNT(*) as total_questions
FROM quiz_questions;
```

**Resultado esperado:** Al menos 5 preguntas

- [ ] ✅ Total de preguntas: _____

### 3.5 Verificar Índices

```sql
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('quiz_questions', 'quiz_attempts', 'certificates')
ORDER BY tablename, indexname;
```

**Resultado esperado:** ~15 índices

- [ ] ✅ Índices creados correctamente

### 3.6 Verificar RLS Policies

```sql
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('quiz_questions', 'quiz_attempts', 'certificates')
ORDER BY tablename, policyname;
```

**Resultado esperado:** ~8 policies

- [ ] ✅ Policies creadas correctamente

---

## 🧪 Paso 4: Pruebas Funcionales

### 4.1 Probar Generación de Número de Certificado

```sql
SELECT generate_certificate_number();
```

**Resultado esperado:** `NODO360-2025-000001` (o similar)

- [ ] ✅ Función ejecuta correctamente

### 4.2 Probar Acceso a Módulo 1

```sql
-- Reemplaza con un user_id y module_id real
SELECT is_module_accessible(
  (SELECT id FROM users LIMIT 1),
  (SELECT id FROM modules WHERE order_index = 1 LIMIT 1)
);
```

**Resultado esperado:** `true`

- [ ] ✅ Módulo 1 es accesible

### 4.3 Insertar Intento de Quiz de Prueba

```sql
-- Reemplaza con IDs reales
INSERT INTO quiz_attempts (
  user_id,
  module_id,
  score,
  total_questions,
  correct_answers,
  passed,
  answers,
  time_spent_seconds
) VALUES (
  (SELECT id FROM users LIMIT 1),
  (SELECT id FROM modules WHERE order_index = 1 LIMIT 1),
  80,
  5,
  4,
  true,
  '[{"question_id": "test", "selected_answer": 1, "correct": true}]'::jsonb,
  120
);
```

- [ ] ✅ Intento insertado sin errores

### 4.4 Obtener Mejor Intento

```sql
SELECT * FROM get_best_quiz_attempt(
  (SELECT id FROM users LIMIT 1),
  (SELECT id FROM modules WHERE order_index = 1 LIMIT 1)
);
```

**Resultado esperado:** 1 fila con el intento de prueba

- [ ] ✅ Función retorna datos correctos

---

## 📊 Paso 5: Verificación de Datos

### 5.1 Ver Preguntas por Módulo

```sql
SELECT
  m.title as module,
  COUNT(qq.id) as total_questions,
  COUNT(*) FILTER (WHERE qq.difficulty = 'easy') as easy,
  COUNT(*) FILTER (WHERE qq.difficulty = 'medium') as medium,
  COUNT(*) FILTER (WHERE qq.difficulty = 'hard') as hard
FROM modules m
LEFT JOIN quiz_questions qq ON m.id = qq.module_id
GROUP BY m.id, m.title
ORDER BY m.order_index;
```

- [ ] ✅ Al menos 1 módulo tiene preguntas

### 5.2 Ver Módulos que Requieren Quiz

```sql
SELECT
  c.title as course,
  m.title as module,
  m.order_index,
  m.requires_quiz
FROM modules m
JOIN courses c ON m.course_id = c.id
WHERE m.requires_quiz = true
ORDER BY c.title, m.order_index;
```

- [ ] ✅ Al menos el Módulo 1 tiene `requires_quiz = true`

---

## 🎯 Paso 6: Integración con Frontend

### 6.1 Verificar Types de TypeScript

```bash
Archivo: types/database.ts
```

- [ ] ✅ `QuizQuestion` interface existe
- [ ] ✅ `QuizAttempt` interface existe
- [ ] ✅ `Certificate` interface actualizada
- [ ] ✅ `Module` interface tiene `requires_quiz`

### 6.2 Verificar Funciones de Lógica

```bash
Archivos:
- lib/progress/checkModuleAccess.ts
- lib/progress/checkLessonAccess.ts
- lib/quiz/validateQuizAttempt.ts
- lib/certificates/generateCertificate.ts
```

- [ ] ✅ Archivos existen
- [ ] ✅ No hay errores de TypeScript
- [ ] ✅ Imports correctos

### 6.3 Verificar Componentes

```bash
Archivos:
- components/quiz/ModuleQuiz.tsx
- components/quiz/QuizResults.tsx
- components/quiz/QuizStartCard.tsx
- components/certificates/CertificateDownload.tsx
- components/course/ModuleLockBadge.tsx
- components/course/UpgradeBanner.tsx
- components/lesson/LessonLockIndicator.tsx
```

- [ ] ✅ Todos los componentes existen
- [ ] ✅ No hay errores de build

---

## 🔒 Paso 7: Seguridad

### 7.1 Verificar RLS Habilitado

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('quiz_questions', 'quiz_attempts', 'certificates');
```

**Todas deben tener:** `rowsecurity = true`

- [ ] ✅ `quiz_questions` - RLS habilitado
- [ ] ✅ `quiz_attempts` - RLS habilitado
- [ ] ✅ `certificates` - RLS habilitado

### 7.2 Probar Políticas de Seguridad

**Como usuario anónimo:**

```sql
-- Debe funcionar (SELECT permitido)
SELECT * FROM quiz_questions LIMIT 1;

-- Debe fallar (INSERT no permitido)
INSERT INTO quiz_questions (module_id, question, options, correct_answer, order_index)
VALUES ('test', 'test', '[]'::jsonb, 0, 1);
```

- [ ] ✅ SELECT permitido para anónimos
- [ ] ✅ INSERT bloqueado para anónimos

---

## 📝 Paso 8: Documentación

- [ ] ✅ Leer `README_DATABASE.md`
- [ ] ✅ Leer `IMPLEMENTATION_GUIDE.md`
- [ ] ✅ Leer `QUIZ_SYSTEM_README.md`
- [ ] ✅ Equipo informado sobre nuevas tablas

---

## 🚨 Troubleshooting

### Error: "relation does not exist"

**Causa:** Tabla no creada correctamente

**Solución:**
1. Verificar que el script de migración se ejecutó sin errores
2. Revisar Table Editor en Supabase Dashboard
3. Re-ejecutar migración si es necesario (dev: con DROP, prod: verificar constraints)

### Error: "function does not exist"

**Causa:** Funciones no creadas

**Solución:**
1. Ejecutar solo la sección de funciones del script de migración
2. Verificar con query de verificación 3.2

### Error: "permission denied"

**Causa:** RLS policies no configuradas correctamente

**Solución:**
1. Verificar que RLS está habilitado (paso 7.1)
2. Revisar policies creadas (paso 3.6)
3. Verificar que el usuario tiene el rol correcto

### Error: "duplicate key value violates unique constraint"

**Causa:** Intentando insertar datos duplicados

**Solución:**
1. Limpiar datos de prueba antes de re-ejecutar seed
2. Usar `ON CONFLICT` en inserts de producción

---

## ✅ Checklist Final

- [ ] ✅ Todas las tablas creadas
- [ ] ✅ Todas las funciones creadas
- [ ] ✅ Todas las verificaciones pasadas
- [ ] ✅ Datos de prueba insertados
- [ ] ✅ RLS configurado correctamente
- [ ] ✅ Frontend integrado
- [ ] ✅ Documentación revisada
- [ ] ✅ **Migración completada con éxito** 🎉

---

## 📞 Próximos Pasos

1. **Crear páginas de Quiz**
   - `/cursos/[slug]/modulos/[moduleSlug]/quiz`
   - `/certificados/[id]`

2. **Integrar autenticación**
   - NextAuth o Supabase Auth
   - Proteger rutas

3. **Configurar Supabase Storage**
   - Bucket para certificados PDF
   - Políticas de acceso

4. **Testing**
   - Crear usuario de prueba
   - Tomar quiz completo
   - Descargar certificado
   - Verificar progresión de módulos

5. **Deploy a producción**
   - Ejecutar migración en Supabase de producción
   - Verificar todas las funciones
   - Monitorear logs

---

**¡Migración lista para aplicar! 🚀**
