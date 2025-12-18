# Configuracion del Sistema de Quiz

## Problema: El quiz no aparece

El quiz solo se muestra si se cumplen **3 condiciones**:

1. `isLastLessonOfModule = true` - Estas en la ultima leccion del modulo
2. `requires_quiz = true` - El modulo tiene quiz activado
3. `quizQuestions.length > 0` - Hay preguntas para ese modulo

## Arquitectura del Sistema

```
modules
  └── requires_quiz: boolean (columna nueva)

quiz_questions
  ├── id: UUID
  ├── module_id: UUID (FK -> modules)
  ├── question: TEXT
  ├── options: JSONB (array de strings)
  ├── correct_answer: INTEGER (indice 0-based)
  ├── order_index: INTEGER
  └── explanation: TEXT (opcional)

quiz_attempts
  ├── id: UUID
  ├── user_id: UUID (FK -> users)
  ├── module_id: UUID (FK -> modules)
  ├── answers: JSONB (array de integers)
  ├── correct_answers: INTEGER
  ├── total_questions: INTEGER
  ├── score: INTEGER (0-100)
  ├── passed: BOOLEAN
  └── time_spent_seconds: INTEGER (opcional)
```

## Diagnostico

### Paso 1: Ejecutar diagnostico en Supabase

1. Ir a Supabase -> SQL Editor
2. Copiar y ejecutar el contenido de `scripts/diagnose-quiz.sql`
3. Revisar:
   - Existe la columna `requires_quiz` en modules?
   - Existen las tablas `quiz_questions` y `quiz_attempts`?
   - El modulo tiene `requires_quiz = true`?
   - Hay preguntas para ese modulo (`num_preguntas > 0`)?
   - Estas en la leccion marcada como `ULTIMA`?

### Paso 2: Configurar tablas y activar quiz

1. Ir a Supabase -> SQL Editor
2. Copiar y ejecutar el contenido de `scripts/enable-quiz-module1.sql`
3. Esto:
   - Creara la columna `requires_quiz` si no existe
   - Creara las tablas `quiz_questions` y `quiz_attempts` si no existen
   - Activara el quiz en el Modulo 1
   - Insertara 5 preguntas de prueba

### Paso 3: Probar

1. Ir a la **ultima leccion del Modulo 1**
2. Scroll hasta el final de la pagina
3. Deberia aparecer el quiz con 5 preguntas

### Debug visual

Hay un bloque de debug temporal que muestra:

```json
{
  "isLastLessonOfModule": true,
  "requires_quiz": true,
  "numQuestions": 5,
  "moduleId": "xxx-xxx-xxx",
  "moduleTitle": "Introduccion a Bitcoin"
}
```

Si algun valor es `false`, `0`, o `NO DEFINIDO`, ahi esta el problema.

## Solucion rapida

| Problema | Solucion |
|----------|----------|
| `requires_quiz: NO DEFINIDO` | Ejecutar `scripts/enable-quiz-module1.sql` |
| `requires_quiz: false` | `UPDATE modules SET requires_quiz = true WHERE id = 'xxx'` |
| `numQuestions: 0` | Ejecutar `scripts/enable-quiz-module1.sql` |
| `isLastLessonOfModule: false` | Navegar a la ultima leccion del modulo |

## Anadir quiz a otros modulos

Para activar el quiz en el Modulo 2:

```sql
-- 1) Activar requires_quiz
UPDATE modules
SET requires_quiz = true
WHERE id = 'ID_DEL_MODULO_2';

-- 2) Insertar preguntas
INSERT INTO quiz_questions (module_id, question, options, correct_answer, order_index, explanation)
VALUES
  ('ID_DEL_MODULO_2', 'Pregunta 1?', '["Op1", "Op2", "Op3", "Op4"]', 0, 1, 'Explicacion...'),
  ('ID_DEL_MODULO_2', 'Pregunta 2?', '["Op1", "Op2", "Op3", "Op4"]', 1, 2, 'Explicacion...'),
  -- ... mas preguntas
;
```

## Archivos del sistema

- `lib/db/quiz.ts` - Funciones helper para quiz
- `app/api/quiz/attempt/route.ts` - API para enviar intentos
- `components/course/LessonQuiz.tsx` - Componente UI del quiz
- `app/cursos/[slug]/[lessonSlug]/page.tsx` - Pagina de leccion (muestra el quiz)

## Eliminar debug

Cuando el quiz funcione, eliminar el bloque de debug en:
`app/cursos/[slug]/[lessonSlug]/page.tsx`

Buscar y eliminar:
```tsx
{/* DEBUG - Eliminar despues de verificar */}
{user && (
  <div className="mt-6 p-4 rounded-xl bg-red-950/50 ...">
    ...
  </div>
)}
```
