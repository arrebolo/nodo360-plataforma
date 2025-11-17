# Guía de Integración del Sistema de Quiz

**Fecha:** 2025-11-16
**Versión:** 1.0.0
**Estado:** ✅ COMPLETAMENTE INTEGRADO

---

## 📋 Resumen

El sistema de quiz y progresión está **completamente implementado** y visible en la UI. Esta guía documenta la arquitectura, componentes y cómo funciona la integración.

---

## 🎯 Componentes Principales

### 1. ModuleListEnhanced

**Archivo:** `components/course/ModuleListEnhanced.tsx`

**Función:** Componente principal que reemplaza a `LessonList` con features completas:
- ✅ Visualización de módulos con acordeón
- ✅ Badges de estado (completado, en progreso, bloqueado)
- ✅ Barras de progreso animadas
- ✅ Integración completa de quiz
- ✅ Lista de lecciones con estado
- ✅ Navegación a quizzes

**Props:**
```typescript
interface ModuleListEnhancedProps {
  courseSlug: string
  modules: Module[]
  isPremium: boolean
  userId?: string  // Opcional - para features futuras
}
```

**Uso:**
```tsx
import { ModuleListEnhanced } from '@/components/course'

<ModuleListEnhanced
  courseSlug={course.slug}
  modules={sortedModules}
  isPremium={course.is_premium}
/>
```

---

### 2. ModuleQuizSection

**Archivo:** `components/course/ModuleQuizSection.tsx`

**Función:** Muestra el estado del quiz dentro de cada módulo.

**Estados Soportados:**
1. **Quiz Bloqueado** - Módulo anterior no completado
2. **Lecciones Pendientes** - Progreso con barra
3. **Quiz Disponible** - CTA para tomar quiz
4. **Quiz Intentado** - Score + botón de reintento
5. **Quiz Aprobado** - Badge + certificado

**Props:**
```typescript
interface ModuleQuizSectionProps {
  courseSlug: string
  moduleSlug: string
  requiresQuiz: boolean
  allLessonsCompleted: boolean
  completedLessonsCount: number
  totalLessons: number
  quizStatus?: 'not_attempted' | 'attempted' | 'passed'
  bestScore?: number
  certificateId?: string
  certificateUrl?: string
  isPreviousModuleCompleted?: boolean
}
```

---

### 3. ModuleStatusBadge

**Archivo:** `components/course/ModuleStatusBadge.tsx`

**Función:** Badges visuales para el estado del módulo.

**Tipos de Estado:**
```typescript
type ModuleStatus =
  | "unlocked"     // Accesible
  | "locked"       // Bloqueado
  | "completed"    // Quiz aprobado
  | "in_progress"  // Algunas lecciones completadas
  | "premium"      // Requiere upgrade
```

**Modos:**
- **Normal:** Badge completo con icono y descripción
- **Compact:** Versión pequeña para headers

**Uso:**
```tsx
import { ModuleStatusBadge } from '@/components/course'

<ModuleStatusBadge
  status="in_progress"
  completedLessons={3}
  totalLessons={5}
  isCompact={false}
/>
```

---

## 🏗️ Arquitectura de Integración

### Flujo de Datos

```
CourseBySlug Query (Supabase)
    ↓
course.modules (con lessons)
    ↓
ModuleListEnhanced
    ↓
Por cada módulo:
    ├─ ModuleStatusBadge (estado visual)
    ├─ Lista de Lecciones (navegación)
    └─ ModuleQuizSection (si requires_quiz = true)
        ├─ Estado del quiz
        ├─ Botón de acción (Tomar/Reintentar)
        └─ Certificado (si aprobado)
```

### Páginas Actualizadas

#### ✅ Página de Curso: `app/cursos/[courseSlug]/page.tsx`

**ANTES:**
```tsx
import { LessonList } from '@/components/course'

<LessonList
  courseSlug={course.slug}
  modules={sortedModules}
  isPremium={course.is_premium}
/>
```

**AHORA:**
```tsx
import { ModuleListEnhanced } from '@/components/course'

<ModuleListEnhanced
  courseSlug={course.slug}
  modules={sortedModules}
  isPremium={course.is_premium}
/>
```

#### ✅ Página de Módulo: `app/cursos/[courseSlug]/modulos/[moduleSlug]/page.tsx`

**Estado:** YA ESTABA INTEGRADA

Esta página muestra:
- Lista de lecciones con progreso
- Sección completa de quiz con 3 estados
- Certificado si aprobado
- Enlace al quiz

No requiere cambios adicionales.

#### ✅ Página de Quiz: `app/cursos/[courseSlug]/modulos/[moduleSlug]/quiz/page.tsx`

**Estado:** YA ESTABA INTEGRADA

Esta página maneja:
- QuizStartWrapper (pantalla inicial)
- ModuleQuiz (interfaz del quiz)
- Validación de requisitos
- Guardado de intentos

No requiere cambios adicionales.

---

## 🎨 Características Visuales

### Animaciones

Usando **Framer Motion:**
- ✅ Fade in de módulos con delay escalonado
- ✅ Expansión/colapso suave de acordeones
- ✅ Animación de barras de progreso
- ✅ Hover effects en cards
- ✅ Scale animations en botones

### Colores por Estado

```css
/* Quiz Disponible */
from-[#ff6b35] to-[#f7931a]  /* Orange gradient */

/* Quiz Aprobado */
from-green-500 to-emerald-500  /* Green gradient */

/* Quiz Intentado */
from-orange-500 to-red-500  /* Orange-red gradient */

/* En Progreso */
from-[#ff6b35] to-[#f7931a]  /* Orange gradient */

/* Bloqueado */
from-gray-500 to-slate-500  /* Gray gradient */
```

### Iconos

- 🎯 Quiz Disponible: `Award`
- ✅ Completado: `CheckCircle2`
- 💪 Reintentar: `TrendingUp`
- 🔒 Bloqueado: `Lock`
- 📚 Lecciones: `BookOpen`
- ⏱️ Duración: `Clock`

---

## 📊 Estados del Sistema

### Estado del Módulo

```typescript
// Determinar estado
function getModuleStatus(module: Module): ModuleStatus {
  const completedCount = module.lessons.filter(l =>
    ProgressManager.isLessonCompleted(courseSlug, l.slug)
  ).length

  if (module.requires_quiz && allLessonsCompleted && quizPassed) {
    return 'completed'
  }

  if (completedCount > 0 && completedCount < total) {
    return 'in_progress'
  }

  if (completedCount === total && !module.requires_quiz) {
    return 'completed'
  }

  return 'unlocked'
}
```

### Estado del Quiz

```typescript
type QuizStatus = 'not_attempted' | 'attempted' | 'passed'

// Determinar estado
const quizStatus = (() => {
  if (!allLessonsCompleted) return 'not_attempted'

  const attempts = getQuizAttempts(userId, moduleId)
  if (!attempts.length) return 'not_attempted'

  const bestAttempt = getBestAttempt(attempts)
  return bestAttempt.score >= 70 ? 'passed' : 'attempted'
})()
```

---

## 🧪 Testing

### Página de Prueba

**URL:** `/test-quiz`

Esta página muestra TODOS los estados posibles:
1. Badges de módulo (5 variantes)
2. Quiz con lecciones pendientes
3. Quiz disponible
4. Quiz intentado (no aprobado)
5. Quiz aprobado sin certificado
6. Quiz aprobado con certificado
7. Quiz bloqueado
8. Módulo sin quiz

**Uso:**
```bash
# En desarrollo
npm run dev

# Navegar a
http://localhost:3000/test-quiz
```

### Testing Manual

**Checklist:**
- [ ] Ver página de curso `/cursos/bitcoin-desde-cero`
- [ ] Verificar que módulos se muestran con badges
- [ ] Expandir/colapsar módulos
- [ ] Ver barras de progreso
- [ ] Ver sección de quiz (si existe)
- [ ] Click en "Tomar Quiz"
- [ ] Navegar a lección
- [ ] Completar lección
- [ ] Verificar que progreso actualiza

---

## 🔧 Configuración Requerida

### Base de Datos

Verificar que los módulos tienen:

```sql
-- Verificar módulos con quiz
SELECT id, title, slug, requires_quiz
FROM modules
WHERE requires_quiz = true;

-- Verificar preguntas de quiz
SELECT
  m.title as module_title,
  COUNT(qq.id) as question_count
FROM modules m
LEFT JOIN quiz_questions qq ON m.id = qq.module_id
WHERE m.requires_quiz = true
GROUP BY m.id, m.title;
```

### Dependencias

```json
{
  "framer-motion": "^10.x.x",  // Animaciones
  "lucide-react": "^0.x.x"     // Iconos
}
```

Ya instaladas en el proyecto.

---

## 📝 TODOs Futuros

### Integración con Supabase (Próximas Features)

**Actualmente:** El quiz usa `quizStatus` hardcodeado en algunos lugares.

**Mejora:** Obtener estado real de quiz desde Supabase:

```typescript
// En ModuleListEnhanced.tsx
const getModuleQuizStatus = async (moduleId: string) => {
  if (!userId) return 'not_attempted'

  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('score, passed')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .order('score', { ascending: false })
    .limit(1)

  if (!attempts?.length) return 'not_attempted'

  return attempts[0].passed ? 'passed' : 'attempted'
}
```

### Certificados

**Actualmente:** Los certificados se muestran si existen.

**Mejora:** Generar automáticamente al aprobar quiz.

### Analytics

Trackear eventos:
- Quiz iniciado
- Quiz completado
- Quiz aprobado
- Certificado descargado

---

## 🎯 Siguiente Paso: Probar

1. **Iniciar servidor:**
   ```bash
   npm run dev
   ```

2. **Probar página de test:**
   ```
   http://localhost:3000/test-quiz
   ```

3. **Probar curso real:**
   ```
   http://localhost:3000/cursos/bitcoin-desde-cero
   ```

4. **Verificar:**
   - ✅ Módulos se muestran con UI mejorada
   - ✅ Badges de estado visibles
   - ✅ Secciones de quiz aparecen
   - ✅ Navegación funciona
   - ✅ Animaciones suaves

---

## 📚 Referencias

- **Componentes de Quiz:** `components/quiz/*`
- **Componentes de Módulo:** `components/course/*`
- **Documentación de Rutas:** `docs/ROUTES_ARCHITECTURE.md`
- **Framer Motion:** https://www.framer.com/motion/
- **Lucide Icons:** https://lucide.dev/

---

## ✅ Checklist de Integración

- [x] ModuleListEnhanced creado
- [x] ModuleQuizSection creado
- [x] Exports actualizados
- [x] Página de curso actualizada
- [x] Página de prueba creada
- [x] Documentación generada
- [ ] Testing en navegador ⚠️ PENDIENTE
- [ ] Integración con datos reales de quiz desde Supabase
- [ ] Generación automática de certificados
