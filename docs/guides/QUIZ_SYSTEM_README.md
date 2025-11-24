# 🎓 Sistema de Quizzes y Certificados - Nodo360

## 📦 Lo que se ha implementado

### ✅ Schemas SQL
- `quiz_questions` - Preguntas de quiz por módulo
- `quiz_attempts` - Intentos y calificaciones de usuarios
- `certificates` - Certificados de módulos y cursos
- `modules.requires_quiz` - Flag para requerir quiz

### ✅ Lógica de Negocio
- **checkModuleAccess** - Control de acceso a módulos (gratis vs premium)
- **checkLessonAccess** - Control de acceso a lecciones (secuencial)
- **validateQuizAttempt** - Validación y guardado de quizzes
- **generateCertificate** - Generación de PDFs con QR

### ✅ Componentes UI
**Quiz:**
- `ModuleQuiz` - Quiz interactivo con navegación
- `QuizResults` - Resultados con feedback detallado
- `QuizStartCard` - Tarjeta de información pre-quiz

**Certificados:**
- `CertificateDownload` - Descarga de PDF
- `CertificateCard` - Tarjeta de certificado

**Lock/Upgrade:**
- `ModuleLockBadge` - Badge de estado de módulo
- `ModuleLockCard` - Tarjeta para módulos bloqueados
- `UpgradeBanner` - CTA para upgrade a premium
- `LessonLockIndicator` - Indicador de lección bloqueada

---

## 🚀 Quick Start

### 1. Aplicar Migraciones SQL

```bash
# En Supabase Dashboard → SQL Editor
# Ejecutar: supabase/migration-quiz-certificates.sql
```

### 2. Insertar Preguntas de Ejemplo

```sql
-- 1. Obtener module_id
SELECT id FROM modules WHERE title LIKE '%Fundamentos%';

-- 2. Editar supabase/sample-quiz-questions.sql con el ID real
-- 3. Ejecutar el script
```

### 3. Usar en tu Código

```tsx
// Página de Quiz
import { ModuleQuiz } from '@/components/quiz/ModuleQuiz'
import { getQuizQuestions } from '@/lib/quiz/validateQuizAttempt'

const questions = await getQuizQuestions(moduleId)

<ModuleQuiz
  moduleId={moduleId}
  moduleTitle="Módulo 1"
  questions={questions}
  userId={userId}
  onComplete={(passed, score) => {
    if (passed) router.push('/next-module')
  }}
/>
```

```tsx
// Control de Acceso
import { checkModuleAccess } from '@/lib/progress/checkModuleAccess'
import { ModuleLockCard } from '@/components/course/ModuleLockBadge'

const access = await checkModuleAccess(userId, moduleId, course.is_free)

if (!access.canAccess) {
  return <ModuleLockCard
    moduleTitle={module.title}
    reason={access.reason}
  />
}
```

```tsx
// Certificado
import { CertificateDownload } from '@/components/certificates/CertificateDownload'

<CertificateDownload
  certificateData={{
    certificateNumber: 'NODO360-2024-001234',
    userName: user.name,
    courseTitle: course.title,
    type: 'module',
    issuedDate: new Date(),
  }}
/>
```

---

## 📊 Reglas de Negocio

### Cursos Gratis
- ✅ Módulo 1 accesible
- ✅ Quiz disponible
- ✅ Certificado si aprueba (≥70%)
- ❌ Módulos 2+ bloqueados → Upgrade banner

### Cursos Premium
- ✅ Módulo 1 accesible
- ✅ Aprobar quiz → Módulo 2 desbloqueado
- ✅ Aprobar quiz → Módulo 3 desbloqueado
- ✅ Lecciones secuenciales dentro de cada módulo
- ✅ Certificado final del curso

---

## 📁 Archivos Creados

### SQL
```
supabase/
├── migration-quiz-certificates.sql    # Tablas principales
└── sample-quiz-questions.sql          # 10 preguntas ejemplo
```

### Types
```
types/
└── database.ts                        # Actualizado con QuizQuestion, QuizAttempt, Certificate
```

### Logic
```
lib/
├── progress/
│   ├── checkModuleAccess.ts
│   └── checkLessonAccess.ts
├── quiz/
│   └── validateQuizAttempt.ts
└── certificates/
    └── generateCertificate.ts
```

### Components
```
components/
├── quiz/
│   ├── ModuleQuiz.tsx
│   ├── QuizResults.tsx
│   └── QuizStartCard.tsx
├── certificates/
│   └── CertificateDownload.tsx
├── course/
│   ├── ModuleLockBadge.tsx
│   └── UpgradeBanner.tsx
└── lesson/
    └── LessonLockIndicator.tsx
```

---

## 🎯 To-Do Next

1. ⬜ Aplicar migraciones SQL en Supabase
2. ⬜ Crear páginas:
   - `/cursos/[slug]/modulos/[moduleSlug]/quiz`
   - `/certificados/[id]`
3. ⬜ Integrar con autenticación (NextAuth o Supabase Auth)
4. ⬜ Configurar Supabase Storage para PDFs
5. ⬜ Testing end-to-end

---

## 📖 Documentación Completa

Ver **IMPLEMENTATION_GUIDE.md** para:
- Guía detallada de uso
- Ejemplos de código
- Troubleshooting
- API completa de funciones

---

**Sistema listo para integrar! 🚀**
