# 📚 UI Components Documentation - FASE 4

> Documentación completa de los componentes UI del sistema de quiz y progreso de módulos

## 📖 Tabla de Contenidos

- [QuizInterface](#quizinterface)
- [QuizResults](#quizresults)
- [ModuleStatusBadge](#modulestatusbadge)
- [PremiumUpgradeBanner](#premiumupgradebanner)
- [Module Page](#module-page)
- [Design Patterns](#design-patterns)
- [Best Practices](#best-practices)

---

## QuizInterface

**Archivo**: `components/quiz/QuizInterface.tsx`

### Propósito

Componente interactivo para tomar quizzes con navegación fluida, animaciones y funcionalidades avanzadas.

### Características

- ✅ Navegación entre preguntas con animaciones suaves (framer-motion)
- ✅ Barra de progreso visual
- ✅ Timer opcional con cuenta regresiva
- ✅ Atajos de teclado (1-4 para respuestas, flechas para navegación, Enter para enviar)
- ✅ Modal de confirmación antes de enviar
- ✅ Auto-submit cuando el tiempo se agota
- ✅ Indicadores visuales de preguntas respondidas

### Props

```typescript
interface QuizInterfaceProps {
  questions: QuizQuestion[];
  onSubmit: (answers: Record<string, number>) => void;
  onCancel?: () => void;
  showTimer?: boolean;
  timeLimitMinutes?: number;
}
```

### Uso

```tsx
import { QuizInterface } from "@/components/quiz/QuizInterface";

<QuizInterface
  questions={quizQuestions}
  onSubmit={handleSubmitAnswers}
  onCancel={() => router.back()}
  showTimer={true}
  timeLimitMinutes={30}
/>
```

### Estados Visuales

#### 1. Pregunta Activa
- Animación de entrada/salida al cambiar preguntas
- Opciones seleccionables con hover effects
- Contador de pregunta (ej: "3 / 10")

#### 2. Navegación
```tsx
// Botones de navegación
<button disabled={currentIndex === 0}>← Anterior</button>
<button disabled={currentIndex === questions.length - 1}>Siguiente →</button>
```

#### 3. Timer
```tsx
// Mostrar tiempo restante
{showTimer && (
  <div className="text-white/70">
    ⏱️ {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
  </div>
)}
```

#### 4. Modal de Confirmación
```tsx
// Antes de enviar el quiz
¿Estás seguro de que deseas enviar el quiz?
Has respondido {answeredCount} de {totalQuestions} preguntas.
```

### Animaciones

```typescript
const slideVariants = {
  enter: (direction: "forward" | "backward") => ({
    x: direction === "forward" ? 300 : -300,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: "forward" | "backward") => ({
    x: direction === "forward" ? -300 : 300,
    opacity: 0,
  }),
};
```

### Atajos de Teclado

| Tecla | Acción |
|-------|--------|
| `1-4` | Seleccionar opción A-D |
| `←` | Pregunta anterior |
| `→` | Pregunta siguiente |
| `Enter` | Enviar quiz (si todas las preguntas están respondidas) |
| `Esc` | Cancelar quiz |

---

## QuizResults

**Archivo**: `components/quiz/QuizResults.tsx`

### Propósito

Mostrar los resultados del quiz con animaciones de celebración, revisión detallada y opciones de acción.

### Características

- ✅ Animación de confetti cuando el usuario aprueba (canvas-confetti)
- ✅ Visualización circular del score
- ✅ Trofeo animado en caso de aprobación
- ✅ Revisión pregunta por pregunta con explicaciones
- ✅ Indicadores de respuestas correctas/incorrectas
- ✅ Estadísticas detalladas
- ✅ Nota de certificado generado automáticamente

### Props

```typescript
interface QuizResultsProps {
  moduleTitle: string;
  results: {
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    passed: boolean;
    answers: Array<{
      question_id: string;
      selected_answer: number;
      correct: boolean;
    }>;
  };
  questions: QuizQuestion[];
  userAnswers: Record<string, number>;
  onRetry: () => void;
  onComplete: () => void;
}
```

### Uso

```tsx
import { QuizResults } from "@/components/quiz/QuizResults";

<QuizResults
  moduleTitle="Módulo 1: Introducción a Bitcoin"
  results={{
    score: 85,
    totalQuestions: 10,
    correctAnswers: 8.5,
    passed: true,
    answers: [...]
  }}
  questions={quizQuestions}
  userAnswers={userAnswers}
  onRetry={() => router.push('/quiz')}
  onComplete={() => router.push('/certificate')}
/>
```

### Animación de Confetti

```typescript
useEffect(() => {
  if (passed) {
    // Ráfaga inicial
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Cañones laterales (200ms después)
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }, 200);
  }
}, [passed]);
```

### Mensajes de Rendimiento

| Score | Mensaje |
|-------|---------|
| ≥ 90% | "¡Excelente trabajo! Dominas completamente este módulo." |
| ≥ 80% | "¡Muy bien! Tienes un excelente entendimiento del tema." |
| ≥ 70% | "¡Bien hecho! Has aprobado el quiz." |
| ≥ 60% | "Casi lo logras. Revisa el material y vuelve a intentarlo." |
| < 60% | "Necesitas repasar el contenido del módulo antes de continuar." |

### Colores de Score

```typescript
const getScoreColor = () => {
  if (score >= 90) return 'from-green-400 to-emerald-500';
  if (score >= 70) return 'from-[#FFD700] to-[#FFA500]';
  return 'from-red-400 to-rose-500';
};
```

### Sección de Certificado

```tsx
{passed && (
  <motion.div
    className="mt-8 bg-gradient-to-r from-[#ff6b35]/10 to-[#f7931a]/10"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 1.5 }}
  >
    <h3>🎉 ¡Certificado Disponible!</h3>
    <p>Has aprobado el quiz con {score}%. Tu certificado se ha generado automáticamente</p>
    <button onClick={onComplete}>Ver Certificado</button>
  </motion.div>
)}
```

---

## ModuleStatusBadge

**Archivo**: `components/course/ModuleStatusBadge.tsx`

### Propósito

Badge visual para indicar el estado de acceso y progreso de un módulo.

### Estados

```typescript
export type ModuleStatus =
  | "unlocked"     // Módulo accesible
  | "locked"       // Necesita completar módulo anterior
  | "completed"    // Quiz aprobado
  | "in_progress"  // Lecciones en progreso
  | "premium";     // Requiere actualización
```

### Props

```typescript
interface ModuleStatusBadgeProps {
  status: ModuleStatus;
  completedLessons?: number;
  totalLessons?: number;
  isCompact?: boolean;
}
```

### Uso

#### Variante Completa

```tsx
<ModuleStatusBadge status="completed" />
```

#### Variante Compacta

```tsx
<ModuleStatusBadge
  status="in_progress"
  completedLessons={3}
  totalLessons={5}
  isCompact
/>
```

#### Indicador Simple

```tsx
import { ModuleStatusIndicator } from "@/components/course/ModuleStatusBadge";

<ModuleStatusIndicator status="locked" showLabel />
```

### Configuración de Estados

| Estado | Icono | Color | Label | Subtítulo |
|--------|-------|-------|-------|-----------|
| `completed` | CheckCircle2 | Verde | "Quiz Completado" | - |
| `unlocked` | Unlock | Azul | "Desbloqueado" | - |
| `locked` | Lock | Gris | "Bloqueado" | "Completa el módulo anterior" |
| `in_progress` | BookOpen | Naranja | "X/Y lecciones" | "En progreso" |
| `premium` | Crown | Morado | "Premium" | "Actualiza para desbloquear" |

### Ejemplo en Lista de Módulos

```tsx
{modules.map(module => (
  <div key={module.id} className="module-card">
    <h3>{module.title}</h3>
    <ModuleStatusBadge
      status={getModuleStatus(module)}
      completedLessons={module.completedLessons}
      totalLessons={module.totalLessons}
      isCompact
    />
  </div>
))}
```

---

## PremiumUpgradeBanner

**Archivo**: `components/course/PremiumUpgradeBanner.tsx`

### Propósito

Banner promocional para usuarios gratuitos que intenten acceder a contenido premium.

### Variantes

1. **`default`**: Banner completo con grid de beneficios
2. **`compact`**: Versión inline de una sola fila
3. **`module-lock`**: Específico para módulos bloqueados

### Props

```typescript
interface PremiumUpgradeBannerProps {
  variant?: "default" | "compact" | "module-lock";
  moduleTitle?: string;
  onUpgrade?: () => void;
}
```

### Uso

#### Variante Module Lock

```tsx
<PremiumUpgradeBanner
  variant="module-lock"
  moduleTitle="Módulo 2: Trading Avanzado"
  onUpgrade={() => router.push('/premium')}
/>
```

#### Variante Compact

```tsx
<PremiumUpgradeBanner
  variant="compact"
/>
```

#### Variante Default (Full Banner)

```tsx
<PremiumUpgradeBanner />
```

### Beneficios Destacados

```typescript
const benefits = [
  {
    icon: Crown,
    title: "Acceso completo",
    description: "Todos los módulos y lecciones sin límites",
  },
  {
    icon: Award,
    title: "Certificados verificables",
    description: "Certificados oficiales por cada módulo completado",
  },
  {
    icon: Zap,
    title: "Contenido actualizado",
    description: "Acceso a nuevos cursos y actualizaciones",
  },
  {
    icon: Sparkles,
    title: "Soporte prioritario",
    description: "Asistencia directa del equipo",
  },
];
```

### Animaciones

```tsx
// Corona animada en module-lock variant
<motion.div
  animate={{
    rotate: [0, 5, -5, 0],
    scale: [1, 1.05, 1],
  }}
  transition={{
    duration: 2,
    repeat: Infinity,
    repeatType: "reverse",
  }}
>
  <Crown className="w-10 h-10 text-white" />
</motion.div>
```

### Redirección Personalizada

```tsx
const handleUpgrade = () => {
  if (onUpgrade) {
    onUpgrade(); // Usar callback personalizado
  } else {
    window.location.href = "/premium"; // Fallback
  }
};
```

---

## Module Page

**Archivo**: `app/cursos/[courseSlug]/modulos/[moduleSlug]/page.tsx`

### Propósito

Página de detalle del módulo con lista de lecciones y sección de estado del quiz.

### Estructura

```
┌─────────────────────────────────────┐
│ Header (Navegación)                 │
├─────────────────────────────────────┤
│ Breadcrumb                          │
├─────────────────────────────────────┤
│ Module Header                       │
│ - Título                            │
│ - Descripción                       │
│ - Stats (lecciones, duración, etc)  │
├─────────────────────────────────────┤
│ Lessons List                        │
│ ┌─────────────────────────────────┐ │
│ │ Lección 1  [✓ Completada]       │ │
│ │ Lección 2  [○ En progreso]      │ │
│ │ Lección 3  [● Sin empezar]      │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Quiz Status Section                 │
│ (3 estados posibles - ver abajo)    │
└─────────────────────────────────────┘
```

### Quiz Status - 3 Estados

#### Estado 1: Lecciones Incompletas

```tsx
{!allLessonsCompleted && (
  <div className="bg-gray-500/10 border-gray-500/30 rounded-xl p-8">
    <BookOpen className="w-6 h-6 text-gray-400" />
    <h3>Completa todas las lecciones para acceder al quiz</h3>
    <p>Has completado {completedLessonsCount} de {totalLessons} lecciones.</p>
    {/* Barra de progreso */}
  </div>
)}
```

**Diseño**:
- Color gris para indicar "bloqueado"
- Icono de libro (BookOpen)
- Barra de progreso visual
- Mensaje claro del requisito

#### Estado 2: Listo para Quiz / Reintentar

```tsx
{allLessonsCompleted && quizStatus !== "passed" && (
  <div className="bg-[#ff6b35]/10 border-[#ff6b35]/30 rounded-2xl p-8">
    <Award className="w-10 h-10" />
    <h3>
      {quizStatus === "not_attempted"
        ? "¡Listo para el Quiz Final!"
        : "Intenta el Quiz Nuevamente"}
    </h3>

    {/* Stats si ya intentó */}
    {quizStatus === "attempted" && (
      <div className="grid grid-cols-2 gap-4">
        <div>Mejor puntuación: {bestAttempt.score}%</div>
        <div>Requerida: 70%</div>
      </div>
    )}

    <Link href="/quiz">
      {quizStatus === "not_attempted" ? "Tomar Quiz" : "Reintentar Quiz"}
    </Link>
  </div>
)}
```

**Diseño**:
- Color naranja Bitcoin (#ff6b35)
- Icono de premio (Award)
- CTA destacado con gradiente
- Stats comparativas si ya intentó

#### Estado 3: Quiz Aprobado (Certificado Disponible)

```tsx
{quizStatus === "passed" && (
  <div className="bg-green-500/10 border-green-500/30 rounded-2xl p-8">
    <CheckCircle2 className="w-10 h-10 text-green-400" />
    <div className="badge">✅ Quiz Completado</div>
    <h3>¡Felicitaciones!</h3>
    <p>Has aprobado el quiz con {bestAttempt.score}%</p>

    {/* Grid de stats */}
    <div className="grid grid-cols-3 gap-4">
      <div>{bestAttempt.score}% - Tu puntuación</div>
      <div>{correctAnswers}/{totalQuestions} - Correctas</div>
      <div>{date} - Fecha</div>
    </div>

    {/* Botones de acción */}
    <Link href={`/certificados/${certificate.id}`}>
      <Award /> Ver Certificado
    </Link>
    <a href={certificate.certificate_url} download>
      <Download /> Descargar PDF
    </a>
    <Link href="/quiz">Ver resultados del quiz</Link>
  </div>
)}
```

**Diseño**:
- Color verde para "éxito"
- Badge de completado
- 3 botones de acción:
  1. Ver Certificado (primario, gradiente naranja)
  2. Descargar PDF (secundario, transparente)
  3. Ver resultados (terciario, transparente)
- Stats en grid de 3 columnas
- Nota de verificación del certificado

### Queries de Datos

```typescript
// 1. Obtener curso
const { data: course } = await supabase
  .from("courses")
  .select("id, title, slug, description, is_free")
  .eq("slug", courseSlug)
  .single();

// 2. Obtener módulo con lecciones
const { data: module } = await supabase
  .from("modules")
  .select(`
    *,
    lessons (id, title, slug, description, duration_minutes, order_index)
  `)
  .eq("slug", moduleSlug)
  .eq("course_id", course.id)
  .single();

// 3. Obtener progreso de lecciones
const { data: lessonProgress } = await supabase
  .from("lesson_progress")
  .select("lesson_id, completed")
  .eq("user_id", user.id);

// 4. Obtener mejor intento de quiz
const { data: attempts } = await supabase
  .from("quiz_attempts")
  .select("*")
  .eq("user_id", user.id)
  .eq("module_id", module.id)
  .order("score", { ascending: false })
  .limit(1);

// 5. Obtener certificado (si pasó)
const { data: certificate } = await supabase
  .from("certificates")
  .select("*")
  .eq("user_id", user.id)
  .eq("module_id", module.id)
  .eq("type", "module")
  .single();
```

---

## Design Patterns

### 1. Color Scheme

#### Bitcoin Orange (Brand Primary)
```css
--bitcoin-orange-light: #ff6b35
--bitcoin-orange: #f7931a
```

**Uso**: CTAs principales, elementos destacados, gradientes

#### Status Colors

```css
/* Success / Completed */
--success: from-green-500 to-emerald-500

/* Warning / In Progress */
--warning: from-[#ff6b35] to-[#f7931a]

/* Error / Failed */
--error: from-red-500 to-rose-500

/* Neutral / Locked */
--neutral: from-gray-500 to-slate-500

/* Premium */
--premium: from-purple-500 to-pink-500
```

### 2. Glassmorphism

Todos los componentes usan efecto glassmorphism:

```css
background: rgba(255, 255, 255, 0.05)
backdrop-filter: blur(10px)
border: 1px solid rgba(255, 255, 255, 0.1)
```

### 3. Gradientes

#### Background Gradients
```css
bg-gradient-to-br from-[#1a1f2e] via-[#252b3d] to-[#1a1f2e]
```

#### Button Gradients
```css
/* Primary CTA */
bg-gradient-to-r from-[#ff6b35] to-[#f7931a]

/* Success */
bg-gradient-to-r from-green-500 to-emerald-500

/* Premium */
bg-gradient-to-r from-purple-500 to-pink-500
```

### 4. Animations

#### Framer Motion - Common Variants

```typescript
// Fade in from bottom
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

// Scale in
const scaleIn = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { duration: 0.3 }
};

// Slide transitions
const slideVariants = {
  enter: { x: 300, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -300, opacity: 0 }
};
```

### 5. Typography

```css
/* Headers */
h1: text-4xl md:text-5xl font-bold
h2: text-2xl md:text-3xl font-bold
h3: text-xl md:text-2xl font-semibold

/* Body */
p: text-base text-white/70
small: text-sm text-white/60

/* Labels */
label: text-sm font-semibold text-white/80
```

---

## Best Practices

### 1. Accessibility

#### Keyboard Navigation
- Todos los componentes interactivos soportan navegación por teclado
- Focus visible en todos los elementos
- ARIA labels en iconos y botones

```tsx
<button
  aria-label="Siguiente pregunta"
  className="focus:ring-2 focus:ring-[#ff6b35]"
>
  <ArrowRight />
</button>
```

#### Screen Readers
```tsx
<div role="status" aria-live="polite">
  Pregunta {currentIndex + 1} de {totalQuestions}
</div>
```

### 2. Performance

#### Lazy Loading de Componentes Pesados
```tsx
import dynamic from 'next/dynamic';

const QuizResults = dynamic(() => import('@/components/quiz/QuizResults'), {
  loading: () => <LoadingSpinner />
});
```

#### Memoización
```tsx
const sortedLessons = useMemo(() =>
  lessons.sort((a, b) => a.order_index - b.order_index),
  [lessons]
);
```

### 3. Error Handling

#### Quiz Submission
```tsx
try {
  await submitQuiz(answers);
} catch (error) {
  toast.error("Error al enviar el quiz. Por favor intenta de nuevo.");
  console.error("Quiz submission error:", error);
}
```

#### Data Fetching
```tsx
const { data: module, error } = await supabase
  .from("modules")
  .select("*")
  .single();

if (error || !module) {
  notFound(); // Next.js 404
}
```

### 4. Mobile Responsiveness

Todos los componentes son mobile-first:

```tsx
// Desktop: grid-cols-3, Mobile: grid-cols-1
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">

// Desktop: flex-row, Mobile: flex-col
<div className="flex flex-col sm:flex-row gap-4">

// Padding responsivo
<div className="px-4 sm:px-6 lg:px-8">

// Text size responsivo
<h1 className="text-3xl md:text-4xl lg:text-5xl">
```

### 5. Loading States

#### Button Loading
```tsx
<button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader className="animate-spin w-4 h-4" />
      Enviando...
    </>
  ) : (
    "Enviar Quiz"
  )}
</button>
```

#### Page Loading
```tsx
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse">
        <div className="w-16 h-16 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] rounded-full" />
      </div>
    </div>
  );
}
```

### 6. Testing

#### Unit Tests (Jest + React Testing Library)
```tsx
describe('QuizInterface', () => {
  it('should navigate between questions', () => {
    render(<QuizInterface questions={mockQuestions} />);

    const nextButton = screen.getByText('Siguiente');
    fireEvent.click(nextButton);

    expect(screen.getByText('Pregunta 2 / 5')).toBeInTheDocument();
  });

  it('should show confirmation before submit', () => {
    render(<QuizInterface questions={mockQuestions} />);

    const submitButton = screen.getByText('Enviar Quiz');
    fireEvent.click(submitButton);

    expect(screen.getByText('¿Estás seguro?')).toBeInTheDocument();
  });
});
```

#### E2E Tests (Playwright)
```typescript
test('complete quiz flow', async ({ page }) => {
  await page.goto('/cursos/bitcoin-101/modulos/modulo-1/quiz');

  // Answer all questions
  for (let i = 0; i < 5; i++) {
    await page.click('text=Opción A');
    await page.click('text=Siguiente');
  }

  // Submit quiz
  await page.click('text=Enviar Quiz');
  await page.click('text=Confirmar');

  // Verify results
  await expect(page.locator('text=¡Felicitaciones!')).toBeVisible();
});
```

---

## Integration Examples

### Flujo Completo: Módulo → Quiz → Certificado

```tsx
// 1. Usuario visita página del módulo
/cursos/bitcoin-101/modulos/modulo-1

// 2. Ve estado del quiz (lecciones incompletas)
<ModuleStatusBadge status="locked" />

// 3. Completa todas las lecciones
// Estado cambia automáticamente

// 4. Ve botón "Tomar Quiz"
<Link href="/cursos/bitcoin-101/modulos/modulo-1/quiz">
  Tomar Quiz
</Link>

// 5. Toma el quiz
<QuizInterface
  questions={questions}
  onSubmit={handleSubmit}
  showTimer={true}
/>

// 6. Ve resultados con confetti
<QuizResults
  results={quizResults}
  onComplete={() => router.push('/certificado')}
/>

// 7. Certificado se genera automáticamente
// Botones en página del módulo:
<Link href="/certificados/123">Ver Certificado</Link>
<a href={pdfUrl} download>Descargar PDF</a>
```

### Integración con Sistema de Progreso

```tsx
// lib/progress/updateProgress.ts
export async function updateModuleProgress(userId: string, moduleId: string) {
  // 1. Check all lessons completed
  const allCompleted = await areAllLessonsCompleted(userId, moduleId);

  // 2. Check quiz passed
  const quizPassed = await hasPassedModuleQuiz(userId, moduleId);

  // 3. If both true, unlock next module
  if (allCompleted && quizPassed) {
    const result = await unlockNextModule(userId, moduleId);

    if (result.success && result.nextModule) {
      toast.success(`¡Módulo "${result.nextModule.title}" desbloqueado!`);
    }
  }

  // 4. Check if all course modules completed
  const allModulesComplete = await areAllModulesCompleted(userId, courseId);

  if (allModulesComplete) {
    // Generate course certificate
    await generateCourseCertificate(userId, courseId);
  }
}
```

---

## Troubleshooting

### Problema: Confetti no se muestra

**Solución**: Verificar que `canvas-confetti` está instalado

```bash
npm install canvas-confetti
npm install -D @types/canvas-confetti
```

### Problema: Animaciones lentas en móvil

**Solución**: Reducir partículas de confetti

```typescript
confetti({
  particleCount: isMobile ? 50 : 100, // Menos partículas en móvil
  spread: 70
});
```

### Problema: Timer no funciona correctamente

**Solución**: Verificar cleanup del interval

```typescript
useEffect(() => {
  if (!showTimer) return;

  const interval = setInterval(() => {
    setTimeRemaining(prev => prev - 1);
  }, 1000);

  return () => clearInterval(interval); // ← IMPORTANTE
}, [showTimer]);
```

### Problema: Quiz se envía múltiples veces

**Solución**: Implementar validación de rate limiting

```typescript
// Backend validation
const validation = await validateQuizSubmission(userId, moduleId, answers);
if (!validation.valid) {
  return { error: validation.error };
}

// Frontend debounce
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async () => {
  if (isSubmitting) return;
  setIsSubmitting(true);

  try {
    await submitQuiz(answers);
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## Checklist de Implementación

### Quiz Interface
- [ ] Instalado framer-motion
- [ ] Implementados atajos de teclado
- [ ] Timer con auto-submit
- [ ] Modal de confirmación
- [ ] Navegación fluida entre preguntas
- [ ] Indicadores de progreso

### Quiz Results
- [ ] Instalado canvas-confetti
- [ ] Animación de confetti en aprobación
- [ ] Trofeo animado
- [ ] Revisión detallada de respuestas
- [ ] Nota de certificado generado
- [ ] Botones de acción (retry, continue)

### Module Status Badge
- [ ] 5 estados implementados
- [ ] Variantes compact y full
- [ ] Indicadores simples
- [ ] Colores y iconos correctos

### Premium Banner
- [ ] 3 variantes implementadas
- [ ] Grid de beneficios
- [ ] Animaciones suaves
- [ ] Redirección personalizable

### Module Page
- [ ] 3 estados de quiz implementados
- [ ] Lista de lecciones con progreso
- [ ] Stats del módulo
- [ ] Integración con certificados
- [ ] Queries optimizadas

### Backend
- [ ] Validación de quiz submissions
- [ ] Rate limiting implementado
- [ ] Auto-unlock de módulos
- [ ] Generación automática de certificados
- [ ] RLS policies verificadas

---

## Recursos Adicionales

### Librerías Utilizadas

```json
{
  "framer-motion": "^10.x",
  "canvas-confetti": "^1.x",
  "lucide-react": "^0.x",
  "@supabase/supabase-js": "^2.x"
}
```

### Referencias de Diseño

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Canvas Confetti](https://www.kirilv.com/canvas-confetti/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

### Archivos Relacionados

```
components/
├── quiz/
│   ├── QuizInterface.tsx
│   ├── QuizResults.tsx
│   ├── QuizStartWrapper.tsx
│   └── ModuleQuiz.tsx
├── course/
│   ├── ModuleStatusBadge.tsx
│   └── PremiumUpgradeBanner.tsx
└── certificates/
    └── CertificatePreview.tsx

lib/
├── quiz/
│   └── validateQuizSubmission.ts
└── progress/
    └── unlockNextModule.ts

app/
└── cursos/
    └── [courseSlug]/
        └── modulos/
            └── [moduleSlug]/
                ├── page.tsx
                └── quiz/
                    └── page.tsx
```

---

## Changelog

### v1.0.0 - FASE 4 Completada (2024)

- ✅ QuizInterface con animaciones y timer
- ✅ QuizResults con confetti y revisión detallada
- ✅ ModuleStatusBadge con 5 estados
- ✅ PremiumUpgradeBanner con 3 variantes
- ✅ Module Page con quiz status
- ✅ Backend validations y rate limiting
- ✅ Auto-unlock de módulos
- ✅ Documentación completa

---

## Soporte

Para problemas o preguntas sobre estos componentes:

1. Revisar esta documentación
2. Verificar los ejemplos de código
3. Consultar el troubleshooting
4. Revisar los archivos de componentes directamente

**Contacto**: Equipo de desarrollo Nodo360
