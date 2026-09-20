# Migración 021 — cambios de código necesarios

*Acompaña a `021_rls_quiz_security.sql`. Nada de esto está aplicado ni implementado: es el análisis para revisión.*

## Respuesta a la pregunta previa: **la validación es en cliente**

Investigados `/api/quiz/questions`, `/api/quiz/submit` y los componentes que los consumen. El navegador recibe `correct_answer` y corrige él mismo.

### Cómo llega `correct_answer` al navegador — dos rutas independientes

**Ruta A — la API lo devuelve explícitamente**

`app/api/quiz/questions/route.ts:66`
```js
.select('id, module_id, question, explanation, options, correct_answer, order_index, difficulty, points')
```
Se serializa tal cual en la respuesta JSON. Usa `createAdminClient()` (service_role), **así que RLS no lo detiene**.

**Ruta B — el Server Component lo pasa como prop**

`app/cursos/[slug]/quiz-final/page.tsx:63`
```js
.select('*')   // incluye correct_answer
```
El resultado se pasa a `<CourseFinalQuiz questions={questions} />`, un componente cliente. Va dentro del payload RSC, legible en el navegador.

### Dónde se corrige

`components/quiz/CourseFinalQuiz.tsx:56`
```js
if (answers[q.id] === q.correct_answer) { correct++; ... }
...
passed: percentage >= 70
```

`components/quiz/QuizPlayer.tsx:151-185` hace lo mismo con otro esquema (`options[].is_correct`).

### El problema mayor: `score` y `passed` los decide el cliente

`app/api/quiz/submit/route.ts`
```ts
interface SubmitQuizRequest {
  course_id: string
  user_id: string
  score: number        // <- viene del navegador
  passed: boolean      // <- viene del navegador
  answers: Record<string, number>
}
```

El endpoint **sí recalcula** `correctAnswers` desde la base de datos (líneas 75-90) — pero **no usa ese valor para decidir nada**. Persiste lo que le mandan:

```ts
.insert({
  score: Math.round(score),   // valor del cliente
  passed,                     // valor del cliente
  correct_answers: correctAnswers,   // este sí recalculado
  ...
})
```

Y hay un camino de escape adicional (línea 92):
```ts
} else {
  // Si no hay preguntas en BD, usar el score enviado
  correctAnswers = Math.round((score / 100) * totalQuestions)
}
```

**Consecuencia:** un `POST /api/quiz/submit` con `{ score: 100, passed: true }` y `answers: {}` se acepta. Y aguas abajo, `passed` dispara `createCertificate()`, `awardXP()` y `checkAndAwardBadges()`. **Se puede emitir un certificado sin responder el quiz.** Con 13 certificados ya emitidos, esto afecta a la credibilidad de la certificación.

Esto es independiente de RLS: ninguna política de base de datos lo arregla.

---

## Cambios necesarios, por orden

### 1. `/api/quiz/submit` — corregir en el servidor *(bloqueante para la PARTE 2B)*

- Dejar de aceptar `score` y `passed` del cuerpo de la petición. Que el tipo de entrada sea solo `{ course_id, answers }`.
- Tomar `user_id` de la sesión (`supabase.auth.getUser()`), no del cuerpo. Hoy se compara `user.id !== user_id`, lo cual es correcto, pero es más simple no aceptarlo.
- Calcular `score` y `passed` desde `questions[].correct_answer` leído en el servidor, que ya se está haciendo para `correctAnswers`.
- Eliminar el fallback de la línea 92: si no hay preguntas en la base de datos, devolver error, nunca confiar en el cliente.
- Que el umbral de aprobado (70%) viva en el servidor, no en el componente.

### 2. `/api/quiz/questions` — dejar de enviar la respuesta

- Quitar `correct_answer` del `select`. Valorar quitar también `explanation`: su texto suele revelar la respuesta. Si se quiere mostrar tras responder, servirla en la respuesta de `submit`, no antes.

### 3. `app/cursos/[slug]/quiz-final/page.tsx` — quitar el `select('*')` *(bloqueante para la PARTE 2B)*

- Cambiar a lista explícita: `id, module_id, question, options, order_index, difficulty, points`.
- Alternativa preferible: leer de la vista `quiz_questions_public` que crea la migración.
- **Si se aplica el REVOKE de la PARTE 2B sin hacer este cambio, esta página deja de funcionar** con `permission denied for column correct_answer`.

### 4. `CourseFinalQuiz.tsx` y `QuizPlayer.tsx` — dejar de corregir en el navegador

- Quitar `calculateScore()` y la comparación `answers[q.id] === q.correct_answer`.
- Enviar las respuestas a `/api/quiz/submit` y pintar el resultado que devuelva el servidor.
- El tipo `QuizQuestion` del cliente no debe tener `correct_answer`. Quitarlo del tipo hace que TypeScript señale cualquier uso restante.

### 5. Revisar `/api/instructor/exams/[examId]/submit`

Ya corrige en servidor (`correctAnswersMap`, líneas 96-131), que es el patrón correcto. Merece una lectura para confirmar que no acepta también un `score` del cliente — si está bien, sirve de referencia para reescribir `/api/quiz/submit`.

---

## Notas sobre el alcance

- **`components/quiz/QuizEditor.tsx`** (`use client`) escribe en `quiz_questions` directamente desde el navegador, con columnas (`quiz_id`, `question_text`) que **no existen** en la tabla real (que tiene `module_id`, `question`). Parece código muerto de un esquema anterior. Conviene confirmarlo: si está vivo, la PARTE 2A le afectará, porque las políticas nuevas solo permiten escritura a admins.
- **`lib/quiz/validateQuizSubmission.ts`** ya valida que los `question_id` enviados pertenezcan al módulo. Es una base útil sobre la que construir el punto 1.
- La **PARTE 2A de la migración no rompe nada** y cierra el acceso anónimo. Puede aplicarse antes de tocar una sola línea de código.
