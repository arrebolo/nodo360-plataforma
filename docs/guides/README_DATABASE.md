# 🗄️ Base de Datos - Sistema de Quiz y Certificados

## 📊 Diagrama de Tablas

```
┌─────────────────┐
│     users       │
│  (Supabase Auth)│
└────────┬────────┘
         │
         │ user_id (FK)
         │
    ┌────┴───────────────────────┐
    │                            │
    ▼                            ▼
┌───────────────┐          ┌──────────────┐
│ quiz_attempts │          │ certificates │
└───────┬───────┘          └──────┬───────┘
        │                         │
        │ module_id (FK)          │ module_id (FK)
        │                         │ course_id (FK)
        ▼                         │
┌─────────────┐                   │
│   modules   │◄──────────────────┘
│             │
│ requires_quiz│
└──────┬──────┘
       │
       │ course_id (FK)
       │
       ▼
┌──────────┐
│ courses  │
└──────────┘

┌────────────────┐
│ quiz_questions │
└────────┬───────┘
         │
         │ module_id (FK)
         ▼
    ┌─────────┐
    │ modules │
    └─────────┘
```

---

## 📋 Tabla: `quiz_questions`

**Propósito:** Almacena las preguntas de quiz para evaluaciones de módulos.

### Campos

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identificador único de la pregunta |
| `module_id` | UUID | NOT NULL, FK → modules(id) ON DELETE CASCADE | Módulo al que pertenece la pregunta |
| `question` | TEXT | NOT NULL | Texto de la pregunta |
| `options` | JSONB | NOT NULL, 2-4 elementos | Array de opciones de respuesta<br>Ej: `["Opción A", "Opción B", "Opción C", "Opción D"]` |
| `correct_answer` | INTEGER | NOT NULL, CHECK (0-3) | Índice (0-3) de la opción correcta |
| `explanation` | TEXT | NULL | Explicación mostrada después de responder |
| `order_index` | INTEGER | NOT NULL, UNIQUE (module_id, order_index) | Orden de la pregunta dentro del quiz |
| `difficulty` | TEXT | DEFAULT 'medium', CHECK | Dificultad: `'easy'`, `'medium'`, `'hard'` |
| `points` | INTEGER | DEFAULT 1 | Puntos otorgados por respuesta correcta |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL | Fecha de última actualización |

### Índices

```sql
idx_quiz_questions_module      -- (module_id)
idx_quiz_questions_order       -- (module_id, order_index)
idx_quiz_questions_difficulty  -- (difficulty)
```

### Ejemplo de Datos

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "module_id": "123e4567-e89b-12d3-a456-426614174000",
  "question": "¿Qué es una blockchain?",
  "options": [
    "Una base de datos centralizada",
    "Una cadena de bloques enlazados criptográficamente",
    "Un tipo de criptomoneda",
    "Un software antivirus"
  ],
  "correct_answer": 1,
  "explanation": "Una blockchain es una cadena de bloques enlazados mediante criptografía...",
  "order_index": 1,
  "difficulty": "easy",
  "points": 1
}
```

### RLS Policies

- ✅ **SELECT**: Todos pueden ver preguntas (públicas)
- ✅ **INSERT/UPDATE/DELETE**: Solo instructores del curso

---

## 📋 Tabla: `quiz_attempts`

**Propósito:** Registra cada intento de quiz del usuario con sus respuestas y calificación.

### Campos

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identificador único del intento |
| `user_id` | UUID | NOT NULL, FK → users(id) ON DELETE CASCADE | Usuario que realizó el intento |
| `module_id` | UUID | NOT NULL, FK → modules(id) ON DELETE CASCADE | Módulo del quiz |
| `score` | INTEGER | NOT NULL, CHECK (0-100) | Calificación en porcentaje (0-100) |
| `total_questions` | INTEGER | NOT NULL | Total de preguntas en el quiz |
| `correct_answers` | INTEGER | NOT NULL, CHECK (≤ total_questions) | Número de respuestas correctas |
| `passed` | BOOLEAN | NOT NULL | `true` si score >= 70% |
| `answers` | JSONB | NOT NULL | Array de respuestas del usuario<br>Ej: `[{ question_id, selected_answer, correct }, ...]` |
| `time_spent_seconds` | INTEGER | NULL | Tiempo tomado en segundos |
| `completed_at` | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL | Fecha de completación |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL | Fecha de creación |

### Índices

```sql
idx_quiz_attempts_user         -- (user_id)
idx_quiz_attempts_module       -- (module_id)
idx_quiz_attempts_user_module  -- (user_id, module_id)
idx_quiz_attempts_completed    -- (completed_at DESC)
idx_quiz_attempts_passed       -- (passed) WHERE passed = true
```

### Ejemplo de Datos

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "user_id": "user-uuid-here",
  "module_id": "module-uuid-here",
  "score": 80,
  "total_questions": 5,
  "correct_answers": 4,
  "passed": true,
  "answers": [
    {
      "question_id": "q1-uuid",
      "selected_answer": 1,
      "correct": true
    },
    {
      "question_id": "q2-uuid",
      "selected_answer": 2,
      "correct": false
    }
  ],
  "time_spent_seconds": 240,
  "completed_at": "2024-03-15T10:30:00Z"
}
```

### RLS Policies

- ✅ **SELECT**: Usuario puede ver sus propios intentos
- ✅ **INSERT**: Usuario puede insertar sus propios intentos
- ✅ **SELECT (Instructor)**: Instructores pueden ver intentos de sus cursos

---

## 📋 Tabla: `certificates`

**Propósito:** Almacena certificados emitidos por completación de módulos o cursos.

### Campos

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identificador único del certificado |
| `user_id` | UUID | NOT NULL, FK → users(id) ON DELETE CASCADE | Usuario que recibe el certificado |
| `course_id` | UUID | NOT NULL, FK → courses(id) ON DELETE CASCADE | Curso del certificado |
| `module_id` | UUID | NULL, FK → modules(id) ON DELETE SET NULL | Módulo (NULL si es certificado de curso completo) |
| `type` | certificate_type | NOT NULL | Enum: `'module'` o `'course'` |
| `certificate_number` | TEXT | UNIQUE, NOT NULL | Número único de verificación<br>Ej: `"NODO360-2024-001234"` |
| `title` | TEXT | NOT NULL | Título del certificado |
| `description` | TEXT | NULL | Descripción del certificado |
| `certificate_url` | TEXT | NULL | URL del PDF en Supabase Storage |
| `certificate_hash` | TEXT | NULL | Hash SHA-256 para verificación |
| `nft_token_id` | TEXT | NULL | ID del NFT (para certificados premium) |
| `nft_contract_address` | TEXT | NULL | Dirección del smart contract |
| `nft_chain` | TEXT | NULL | Blockchain: `"polygon"`, `"ethereum"`, etc. |
| `nft_tx_hash` | TEXT | NULL | Hash de la transacción de mint |
| `verification_url` | TEXT | NULL | URL pública de verificación |
| `qr_code_url` | TEXT | NULL | URL de la imagen del QR |
| `issued_at` | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL | Fecha de emisión |
| `expires_at` | TIMESTAMPTZ | NULL | Fecha de expiración (NULL = nunca expira) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL | Fecha de creación |

### Constraints

```sql
-- El tipo debe coincidir con module_id
certificate_type_check:
  (type = 'module' AND module_id IS NOT NULL) OR
  (type = 'course' AND module_id IS NULL)

-- Un usuario solo puede tener un certificado por módulo
UNIQUE (user_id, module_id)

-- Un usuario solo puede tener un certificado de curso
UNIQUE (user_id, course_id) WHERE module_id IS NULL
```

### Índices

```sql
idx_certificates_user          -- (user_id)
idx_certificates_course        -- (course_id)
idx_certificates_module        -- (module_id)
idx_certificates_number        -- (certificate_number)
idx_certificates_issued        -- (issued_at DESC)
idx_certificates_type          -- (type)
idx_certificates_nft           -- (nft_token_id) WHERE nft_token_id IS NOT NULL
```

### Ejemplo de Datos

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "user_id": "user-uuid",
  "course_id": "course-uuid",
  "module_id": "module-uuid",
  "type": "module",
  "certificate_number": "NODO360-2024-001234",
  "title": "Fundamentos de Blockchain",
  "description": "Certificado de completación del módulo",
  "certificate_url": "https://storage.supabase.co/...",
  "certificate_hash": "sha256-hash-here",
  "verification_url": "https://nodo360.com/verify/NODO360-2024-001234",
  "issued_at": "2024-03-15T12:00:00Z"
}
```

### RLS Policies

- ✅ **SELECT**: Usuario puede ver sus propios certificados
- ✅ **SELECT (Público)**: Cualquiera puede verificar certificados (por número)
- ✅ **INSERT**: Usuario puede crear sus propios certificados

---

## 📋 Modificación: Tabla `modules`

### Campo Agregado

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `requires_quiz` | BOOLEAN | DEFAULT false, NOT NULL | Indica si el módulo requiere aprobar un quiz para desbloquear el siguiente |

### Índice

```sql
idx_modules_requires_quiz  -- (requires_quiz) WHERE requires_quiz = true
```

---

## 🔧 Funciones SQL Creadas

### 1. `get_best_quiz_attempt(user_id, module_id)`

**Propósito:** Obtiene el mejor intento de quiz de un usuario para un módulo.

**Retorna:**
```sql
TABLE (
  id UUID,
  score INTEGER,
  passed BOOLEAN,
  completed_at TIMESTAMPTZ
)
```

**Uso:**
```sql
SELECT * FROM get_best_quiz_attempt(
  'user-uuid'::uuid,
  'module-uuid'::uuid
);
```

---

### 2. `has_passed_module_quiz(user_id, module_id)`

**Propósito:** Verifica si un usuario ha aprobado el quiz de un módulo.

**Retorna:** `BOOLEAN`

**Uso:**
```sql
SELECT has_passed_module_quiz(
  'user-uuid'::uuid,
  'module-uuid'::uuid
);
-- Retorna: true o false
```

---

### 3. `is_module_accessible(user_id, module_id)`

**Propósito:** Determina si un módulo es accesible para un usuario.

**Reglas:**
- Módulo 1: Siempre accesible
- Cursos gratis: Solo módulo 1 accesible
- Cursos premium: Debe aprobar quiz del módulo anterior

**Retorna:** `BOOLEAN`

**Uso:**
```sql
SELECT is_module_accessible(
  'user-uuid'::uuid,
  'module-uuid'::uuid
);
-- Retorna: true o false
```

---

### 4. `generate_certificate_number()`

**Propósito:** Genera un número único de certificado.

**Formato:** `NODO360-YYYY-NNNNNN`

**Ejemplo:** `NODO360-2024-000123`

**Retorna:** `TEXT`

**Uso:**
```sql
SELECT generate_certificate_number();
-- Retorna: "NODO360-2024-000123"
```

---

### 5. `issue_module_certificate(user_id, module_id, quiz_attempt_id)`

**Propósito:** Emite un certificado de módulo después de aprobar un quiz.

**Validaciones:**
- Verifica que el quiz fue aprobado
- Previene duplicados (retorna certificado existente si ya existe)

**Retorna:** `UUID` (ID del certificado)

**Uso:**
```sql
SELECT issue_module_certificate(
  'user-uuid'::uuid,
  'module-uuid'::uuid,
  'attempt-uuid'::uuid
);
-- Retorna: UUID del certificado creado o existente
```

---

## 🚀 Instrucciones de Aplicación

### Opción 1: Desarrollo (Con DROP TABLE)

**Usa:** `01-migration-quiz-certificates-dev.sql`

⚠️ **ADVERTENCIA:** Borra todas las tablas existentes. Solo para desarrollo.

```bash
# En Supabase Dashboard → SQL Editor
1. Copia el contenido de 01-migration-quiz-certificates-dev.sql
2. Pega en SQL Editor
3. Ejecuta
4. Verifica mensaje "✅ All tables created successfully"
```

### Opción 2: Producción (Seguro)

**Usa:** `migration-quiz-certificates.sql`

✅ **SEGURO:** No borra datos existentes. Para producción.

```bash
# En Supabase Dashboard → SQL Editor
1. Copia el contenido de migration-quiz-certificates.sql
2. Pega en SQL Editor
3. Ejecuta
4. Verifica que las tablas se crearon en Table Editor
```

### Paso 2: Insertar Datos de Prueba

**Usa:** `02-seed-quiz-data.sql`

```bash
# En Supabase Dashboard → SQL Editor
1. Copia el contenido de 02-seed-quiz-data.sql
2. Pega en SQL Editor
3. Ejecuta
4. Verifica mensaje "✅ 5 preguntas insertadas correctamente"
```

---

## ✅ Verificación Post-Migración

Ejecuta estos queries para verificar que todo está correcto:

### 1. Verificar Tablas Creadas

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('quiz_questions', 'quiz_attempts', 'certificates')
ORDER BY table_name;

-- Debe retornar 3 filas
```

### 2. Verificar Funciones

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%quiz%' OR routine_name LIKE '%certificate%'
ORDER BY routine_name;

-- Debe retornar 5 funciones
```

### 3. Verificar Preguntas Insertadas

```sql
SELECT
  qq.order_index,
  qq.question,
  qq.difficulty,
  m.title as module_title
FROM quiz_questions qq
JOIN modules m ON qq.module_id = m.id
ORDER BY qq.order_index;

-- Debe retornar al menos 5 preguntas
```

### 4. Verificar Módulos con Quiz

```sql
SELECT
  m.title,
  m.order_index,
  m.requires_quiz,
  c.title as course_title
FROM modules m
JOIN courses c ON m.course_id = c.id
WHERE m.requires_quiz = true
ORDER BY c.title, m.order_index;

-- Debe mostrar módulos marcados con requires_quiz = true
```

### 5. Probar Funciones

```sql
-- Probar generación de número de certificado
SELECT generate_certificate_number();

-- Verificar si un módulo es accesible (debe retornar true para módulo 1)
SELECT is_module_accessible(
  (SELECT id FROM users LIMIT 1),
  (SELECT id FROM modules WHERE order_index = 1 LIMIT 1)
);
```

---

## 🔍 Queries Útiles

### Ver todas las preguntas de un módulo

```sql
SELECT
  qq.order_index as "#",
  qq.question,
  qq.difficulty,
  jsonb_array_length(qq.options) as "Opciones"
FROM quiz_questions qq
WHERE qq.module_id = 'tu-module-id'
ORDER BY qq.order_index;
```

### Ver intentos de quiz de un usuario

```sql
SELECT
  qa.score,
  qa.passed,
  qa.total_questions,
  qa.correct_answers,
  qa.completed_at,
  m.title as module_title
FROM quiz_attempts qa
JOIN modules m ON qa.module_id = m.id
WHERE qa.user_id = 'tu-user-id'
ORDER BY qa.completed_at DESC;
```

### Ver certificados de un usuario

```sql
SELECT
  c.certificate_number,
  c.type,
  c.title,
  c.issued_at,
  co.title as course_title
FROM certificates c
JOIN courses co ON c.course_id = co.id
WHERE c.user_id = 'tu-user-id'
ORDER BY c.issued_at DESC;
```

### Estadísticas de quizzes por módulo

```sql
SELECT
  m.title as module,
  COUNT(DISTINCT qa.user_id) as "Usuarios únicos",
  COUNT(*) as "Total intentos",
  AVG(qa.score)::INTEGER as "Score promedio",
  COUNT(*) FILTER (WHERE qa.passed) as "Aprobados",
  COUNT(*) FILTER (WHERE NOT qa.passed) as "Reprobados"
FROM quiz_attempts qa
JOIN modules m ON qa.module_id = m.id
GROUP BY m.id, m.title
ORDER BY m.title;
```

---

## 🛠️ Mantenimiento

### Limpiar Intentos de Prueba

```sql
-- Borrar intentos de quiz de prueba
DELETE FROM quiz_attempts
WHERE user_id = 'test-user-id';
```

### Actualizar Dificultad de Preguntas

```sql
UPDATE quiz_questions
SET difficulty = 'easy'
WHERE order_index IN (1, 2);
```

### Regenerar Números de Certificado

```sql
-- Solo en desarrollo - NO usar en producción
UPDATE certificates
SET certificate_number = generate_certificate_number()
WHERE certificate_number IS NULL;
```

---

## 📞 Soporte

Si encuentras problemas con la migración:

1. **Verifica prerrequisitos:** Asegúrate de que el schema principal (`schema.sql`) está aplicado
2. **Revisa logs de Supabase:** Dashboard → Logs para ver errores
3. **Ejecuta queries de verificación:** Sección "Verificación Post-Migración"
4. **Consulta documentación:** `IMPLEMENTATION_GUIDE.md` para más detalles

---

## 📚 Archivos Relacionados

- `supabase/01-migration-quiz-certificates-dev.sql` - Migración para desarrollo (con DROP)
- `supabase/migration-quiz-certificates.sql` - Migración para producción (segura)
- `supabase/02-seed-quiz-data.sql` - Datos de ejemplo
- `IMPLEMENTATION_GUIDE.md` - Guía completa de implementación
- `QUIZ_SYSTEM_README.md` - Quick start del sistema

---

**¡Base de datos lista para el sistema de quizzes y certificados! 🎉**
