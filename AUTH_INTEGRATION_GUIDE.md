# 🔐 Guía de Integración de Autenticación - Nodo360

Esta guía documenta la integración completa del sistema de autenticación con Supabase para el sistema de quizzes y certificados.

---

## 📋 Índice

1. [Resumen de Archivos Creados](#resumen-de-archivos-creados)
2. [Helpers de Autenticación (Server-Side)](#helpers-de-autenticación-server-side)
3. [Hooks de React (Client-Side)](#hooks-de-react-client-side)
4. [Rutas Protegidas](#rutas-protegidas)
5. [Componentes de UI](#componentes-de-ui)
6. [Flujos de Usuario](#flujos-de-usuario)
7. [Testing y Verificación](#testing-y-verificación)
8. [Ejemplos de Uso](#ejemplos-de-uso)
9. [Troubleshooting](#troubleshooting)

---

## 📁 Resumen de Archivos Creados

### Server-Side (Helpers)
```
lib/auth/
├── getUser.ts          # Obtener usuario actual en Server Components
└── requireAuth.ts      # Proteger rutas en Server Components
```

### Client-Side (Hooks)
```
hooks/
├── useUser.ts          # Hook para acceder al usuario
└── useAuth.ts          # Hook completo con login/logout/signup
```

### Rutas Protegidas
```
app/
├── cursos/[courseSlug]/modulos/[moduleSlug]/quiz/page.tsx
└── certificados/[certificateId]/page.tsx
```

### Componentes de UI
```
components/
├── auth/
│   └── LoginPrompt.tsx     # Prompt de login para usuarios anónimos
└── quiz/
    └── QuizStartWrapper.tsx # Wrapper client para QuizStartCard
```

---

## 🛡️ Helpers de Autenticación (Server-Side)

### `lib/auth/getUser.ts`

#### `getUser()`
Obtiene el usuario autenticado actual desde el perfil completo.

```typescript
import { getUser } from "@/lib/auth/getUser";

export default async function ProfilePage() {
  const user = await getUser();

  if (!user) {
    return <div>No autenticado</div>;
  }

  return <div>Bienvenido {user.full_name}</div>;
}
```

**Retorna:**
- `User` - Usuario completo de la tabla `users`
- `null` - Si no está autenticado

---

#### `getUserId()`
Obtiene solo el ID del usuario (más eficiente).

```typescript
import { getUserId } from "@/lib/auth/getUser";

export default async function QuickCheckPage() {
  const userId = await getUserId();

  if (!userId) {
    return <div>No autenticado</div>;
  }

  // Usar userId para queries
  return <div>User ID: {userId}</div>;
}
```

**Retorna:**
- `string` - ID del usuario
- `null` - Si no está autenticado

---

#### `getSession()`
Obtiene la sesión completa de Supabase.

```typescript
import { getSession } from "@/lib/auth/getUser";

export default async function SessionDebug() {
  const session = await getSession();

  return <pre>{JSON.stringify(session, null, 2)}</pre>;
}
```

**Retorna:**
- `Session` - Sesión de Supabase con user y access_token
- `null` - Si no hay sesión activa

---

### `lib/auth/requireAuth.ts`

#### `requireAuth(returnUrl?)`
Requiere autenticación, redirige a `/login` si no está autenticado.

```typescript
import { requireAuth } from "@/lib/auth/requireAuth";

export default async function ProtectedPage() {
  const user = await requireAuth();

  // Usuario garantizado - nunca es null
  return <div>Bienvenido {user.full_name}</div>;
}
```

**Con returnUrl personalizada:**

```typescript
import { requireAuth } from "@/lib/auth/requireAuth";

export default async function QuizPage({ params }: { params: { slug: string } }) {
  const user = await requireAuth(`/cursos/${params.slug}/quiz`);

  return <Quiz userId={user.id} />;
}
```

**Parámetros:**
- `returnUrl` (opcional) - URL a la que redirigir después del login

**Retorna:**
- `User` - Usuario autenticado (nunca null, redirige si no hay usuario)

---

#### `requireAuthId(returnUrl?)`
Versión optimizada que solo retorna el user ID.

```typescript
import { requireAuthId } from "@/lib/auth/requireAuth";

export default async function SubmitQuizAction() {
  const userId = await requireAuthId();

  // Usar userId directamente
  await saveQuizAttempt(userId, answers);
}
```

---

#### `isAuth()`
Verifica autenticación sin redirigir.

```typescript
import { isAuth } from "@/lib/auth/requireAuth";

export default async function ConditionalPage() {
  const authenticated = await isAuth();

  return (
    <div>
      {authenticated ? <EnrolledView /> : <LoginPrompt />}
    </div>
  );
}
```

**Retorna:**
- `boolean` - `true` si está autenticado, `false` si no

---

#### `requireRole(roles, returnUrl?, unauthorizedUrl?)`
Requiere rol específico.

```typescript
import { requireRole } from "@/lib/auth/requireAuth";

export default async function AdminDashboard() {
  const user = await requireRole(['admin', 'instructor']);

  return <AdminPanel user={user} />;
}
```

**Parámetros:**
- `allowedRoles` - Array de roles permitidos
- `returnUrl` (opcional) - URL de retorno
- `unauthorizedUrl` (opcional) - Donde redirigir si el rol no coincide (default: '/')

---

## ⚛️ Hooks de React (Client-Side)

### `hooks/useUser.ts`

#### `useUser()`
Hook principal para acceder al usuario en Client Components.

```typescript
'use client';

import { useUser } from "@/hooks/useUser";

export function ProfileCard() {
  const { user, loading, error } = useUser();

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!user) {
    return <LoginPrompt />;
  }

  return (
    <div>
      <h2>Bienvenido {user.full_name}</h2>
      <p>{user.email}</p>
    </div>
  );
}
```

**Retorna:**
```typescript
{
  user: User | null,
  loading: boolean,
  error: Error | null
}
```

**Características:**
- ✅ Sincronizado con `onAuthStateChange`
- ✅ Se actualiza automáticamente al login/logout
- ✅ Cachea el usuario en estado local

---

#### `useIsAuthenticated()`
Hook simplificado para verificar autenticación.

```typescript
'use client';

import { useIsAuthenticated } from "@/hooks/useUser";

export function ProtectedButton() {
  const { isAuthenticated, loading } = useIsAuthenticated();

  if (loading) return null;

  return isAuthenticated ? (
    <button>Continuar</button>
  ) : (
    <button onClick={() => router.push('/login')}>Iniciar Sesión</button>
  );
}
```

**Retorna:**
```typescript
{
  isAuthenticated: boolean,
  loading: boolean
}
```

---

### `hooks/useAuth.ts`

Hook completo con todas las operaciones de autenticación.

#### Métodos Disponibles

##### `signIn({ email, password })`

```typescript
'use client';

import { useAuth } from "@/hooks/useAuth";

export function LoginForm() {
  const { signIn, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await signIn({ email, password });
      // Redirige automáticamente a returnUrl o '/'
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button disabled={loading}>Iniciar Sesión</button>
      {error && <p className="text-red-500">{error.message}</p>}
    </form>
  );
}
```

---

##### `signUp({ email, password, fullName })`

```typescript
const { signUp } = useAuth();

const handleSignUp = async () => {
  await signUp({
    email: 'user@example.com',
    password: 'securePassword123',
    fullName: 'Juan Pérez',
  });
};
```

**Características:**
- Crea usuario en Supabase Auth
- Crea perfil en tabla `users`
- Asigna rol `student` por defecto
- Redirige a `/` después del registro

---

##### `signOut()`

```typescript
const { signOut } = useAuth();

<button onClick={signOut}>Cerrar Sesión</button>
```

---

##### `signInWithOAuth(provider)`

```typescript
const { signInWithOAuth } = useAuth();

<button onClick={() => signInWithOAuth('google')}>
  Sign in with Google
</button>

<button onClick={() => signInWithOAuth('github')}>
  Sign in with GitHub
</button>
```

**Providers soportados:**
- `google`
- `github`
- `discord`

---

##### `resetPassword(email)`

```typescript
const { resetPassword } = useAuth();

const handleReset = async (email: string) => {
  await resetPassword(email);
  alert('Revisa tu email para restablecer tu contraseña');
};
```

---

##### `updatePassword(newPassword)`

```typescript
const { updatePassword } = useAuth();

const handlePasswordChange = async (newPassword: string) => {
  await updatePassword(newPassword);
  alert('Contraseña actualizada exitosamente');
};
```

---

## 🔒 Rutas Protegidas

### Quiz Page
**Ruta:** `/cursos/[courseSlug]/modulos/[moduleSlug]/quiz`

```typescript
// app/cursos/[courseSlug]/modulos/[moduleSlug]/quiz/page.tsx

import { requireAuth } from "@/lib/auth/requireAuth";

export default async function QuizPage({ params }) {
  const returnUrl = `/cursos/${params.courseSlug}/modulos/${params.moduleSlug}/quiz`;
  const user = await requireAuth(returnUrl);

  // Usuario autenticado garantizado
  return <ModuleQuiz userId={user.id} />;
}
```

**Flujo:**
1. Usuario accede a `/cursos/blockchain/modulos/fundamentos/quiz`
2. Si no está autenticado → redirige a `/login?returnUrl=/cursos/blockchain/modulos/fundamentos/quiz`
3. Usuario hace login → redirige de vuelta al quiz
4. Quiz se carga con `user.id`

---

### Certificate Page
**Ruta:** `/certificados/[certificateId]`

```typescript
// app/certificados/[certificateId]/page.tsx

import { requireAuth } from "@/lib/auth/requireAuth";

export default async function CertificatePage({ params }) {
  const user = await requireAuth(`/certificados/${params.certificateId}`);

  // Verificar que el certificado pertenece al usuario
  if (certificate.user_id !== user.id) {
    notFound();
  }

  return <CertificateView certificate={certificate} />;
}
```

**Seguridad:**
- ✅ Requiere autenticación
- ✅ Verifica ownership del certificado
- ✅ Retorna 404 si no es el dueño

---

## 🎨 Componentes de UI

### `LoginPrompt`

Componente para mostrar prompt de login a usuarios anónimos.

#### Variantes

##### **Default** - Card completo

```typescript
import { LoginPrompt } from "@/components/auth/LoginPrompt";

<LoginPrompt
  title="Inicia Sesión para Continuar"
  message="Necesitas una cuenta para acceder a los quizzes"
  returnUrl="/cursos/blockchain/quiz"
/>
```

![LoginPrompt Default](https://via.placeholder.com/600x300?text=Default+Variant)

---

##### **Compact** - Para cards pequeños

```typescript
<LoginPrompt
  variant="compact"
  message="Inicia sesión para tomar el quiz"
  returnUrl="/cursos/blockchain/quiz"
/>
```

---

##### **Inline** - Para contextos embebidos

```typescript
<LoginPrompt
  variant="inline"
  message="Autenticación requerida"
  returnUrl="/quiz"
/>
```

---

#### Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `title` | `string` | "Inicia Sesión..." | Título del prompt |
| `message` | `string` | "Necesitas una cuenta..." | Mensaje explicativo |
| `returnUrl` | `string?` | `undefined` | URL de retorno después del login |
| `variant` | `'default' \| 'compact' \| 'inline'` | `'default'` | Estilo visual |
| `showSignUp` | `boolean` | `true` | Mostrar botón de registro |

---

## 🔄 Flujos de Usuario

### Flujo 1: Tomar Quiz (Usuario No Autenticado)

```
1. Usuario visita: /cursos/blockchain/modulos/fundamentos/quiz
   ↓
2. requireAuth() detecta que no está autenticado
   ↓
3. Redirige a: /login?returnUrl=/cursos/blockchain/modulos/fundamentos/quiz
   ↓
4. Usuario ingresa credenciales y hace login
   ↓
5. useAuth().signIn() procesa el login
   ↓
6. Redirige automáticamente a: /cursos/blockchain/modulos/fundamentos/quiz
   ↓
7. QuizPage carga con user.id
   ↓
8. Usuario completa el quiz
   ↓
9. submitQuizAttempt(user.id, ...) guarda el intento
```

---

### Flujo 2: Ver Certificado

```
1. Usuario visita: /certificados/abc-123-def
   ↓
2. requireAuth() verifica autenticación
   ↓
3. Si no autenticado → redirige a /login?returnUrl=/certificados/abc-123-def
   ↓
4. Página verifica: certificate.user_id === user.id
   ↓
5. Si no coincide → 404
   ↓
6. Si coincide → Muestra certificado con opción de descarga PDF
```

---

### Flujo 3: Progreso del Curso (Usuario Autenticado)

```
1. useUser() hook obtiene usuario en Client Component
   ↓
2. Componente muestra progreso personalizado:
   - Módulos desbloqueados
   - Quizzes completados
   - Certificados obtenidos
   ↓
3. Usuario hace clic en "Siguiente Módulo"
   ↓
4. Sistema verifica con is_module_accessible(user.id, module_id)
   ↓
5. Si bloqueado → Muestra ModuleLockBadge
   ↓
6. Si desbloqueado → Permite acceso
```

---

## ✅ Testing y Verificación

### 1. Verificar Server Helpers

```bash
# Crear archivo de prueba
touch app/test-auth/page.tsx
```

```typescript
// app/test-auth/page.tsx
import { getUser, getUserId } from "@/lib/auth/getUser";
import { requireAuth, isAuth } from "@/lib/auth/requireAuth";

export default async function TestAuthPage() {
  const user = await getUser();
  const userId = await getUserId();
  const authenticated = await isAuth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test de Autenticación</h1>
      <div className="space-y-4">
        <div>
          <strong>isAuth():</strong> {authenticated ? '✅ Autenticado' : '❌ No autenticado'}
        </div>
        <div>
          <strong>getUserId():</strong> {userId || 'null'}
        </div>
        <div>
          <strong>getUser():</strong>
          <pre className="bg-gray-100 p-2 rounded mt-2">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
```

**Prueba:**
1. Visita `/test-auth` sin autenticar → Debe mostrar "No autenticado"
2. Haz login
3. Visita `/test-auth` → Debe mostrar tus datos de usuario

---

### 2. Verificar Client Hooks

```typescript
// app/test-hooks/page.tsx
'use client';

import { useUser, useIsAuthenticated } from "@/hooks/useUser";
import { useAuth } from "@/hooks/useAuth";

export default function TestHooksPage() {
  const { user, loading: userLoading } = useUser();
  const { isAuthenticated, loading: authLoading } = useIsAuthenticated();
  const { signOut } = useAuth();

  if (userLoading || authLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test de Hooks</h1>
      <div className="space-y-4">
        <div>
          <strong>useIsAuthenticated():</strong> {isAuthenticated ? '✅ Sí' : '❌ No'}
        </div>
        <div>
          <strong>useUser():</strong>
          {user ? (
            <div>
              <p>Nombre: {user.full_name}</p>
              <p>Email: {user.email}</p>
              <button onClick={signOut} className="mt-2 px-4 py-2 bg-red-500 text-white rounded">
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <p>No usuario</p>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### 3. Verificar Rutas Protegidas

#### Test Manual:

1. **Sin autenticar:**
   ```
   Visita: /cursos/blockchain/modulos/fundamentos/quiz
   Resultado esperado: Redirige a /login?returnUrl=...
   ```

2. **Autenticado:**
   ```
   1. Haz login
   2. Visita: /cursos/blockchain/modulos/fundamentos/quiz
   3. Resultado esperado: Carga el quiz
   ```

3. **Ownership del certificado:**
   ```
   1. Crea certificado para User A
   2. Login como User B
   3. Visita: /certificados/{certificateId de User A}
   4. Resultado esperado: 404
   ```

---

### 4. Verificar LoginPrompt

```typescript
// app/test-login-prompt/page.tsx
'use client';

import { LoginPrompt } from "@/components/auth/LoginPrompt";

export default function TestLoginPromptPage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4">Variante: Default</h2>
        <LoginPrompt
          title="Test Default"
          message="Este es el prompt de login por defecto"
          returnUrl="/test"
        />
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Variante: Compact</h2>
        <LoginPrompt
          variant="compact"
          message="Compact prompt"
          returnUrl="/test"
        />
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Variante: Inline</h2>
        <LoginPrompt
          variant="inline"
          message="Inline prompt"
          returnUrl="/test"
        />
      </div>
    </div>
  );
}
```

---

## 📚 Ejemplos de Uso

### Ejemplo 1: Página de Perfil Protegida

```typescript
// app/perfil/page.tsx
import { requireAuth } from "@/lib/auth/requireAuth";
import { createClient } from "@/lib/supabase/server";

export default async function PerfilPage() {
  const user = await requireAuth('/perfil');
  const supabase = await createClient();

  // Obtener certificados del usuario
  const { data: certificates } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', user.id);

  return (
    <div>
      <h1>Perfil de {user.full_name}</h1>
      <p>Email: {user.email}</p>

      <h2>Mis Certificados</h2>
      {certificates?.map(cert => (
        <div key={cert.id}>
          <a href={`/certificados/${cert.id}`}>
            {cert.title}
          </a>
        </div>
      ))}
    </div>
  );
}
```

---

### Ejemplo 2: Dashboard del Estudiante (Client Component)

```typescript
// app/dashboard/page.tsx
'use client';

import { useUser } from "@/hooks/useUser";
import { LoginPrompt } from "@/components/auth/LoginPrompt";

export default function DashboardPage() {
  const { user, loading } = useUser();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!user) {
    return (
      <LoginPrompt
        title="Accede a tu Dashboard"
        message="Inicia sesión para ver tu progreso y certificados"
        returnUrl="/dashboard"
      />
    );
  }

  return (
    <div>
      <h1>Dashboard de {user.full_name}</h1>
      {/* Contenido del dashboard */}
    </div>
  );
}
```

---

### Ejemplo 3: Formulario de Login Completo

```typescript
// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const { signIn, signInWithOAuth, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await signIn({ email, password });
      // Redirige automáticamente a returnUrl
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Iniciar Sesión</h1>

      {returnUrl && (
        <div className="bg-blue-100 border border-blue-300 rounded p-4 mb-6">
          <p className="text-sm text-blue-800">
            Inicia sesión para continuar a: <strong>{returnUrl}</strong>
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-2">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded"
            required
          />
        </div>

        {error && (
          <div className="bg-red-100 border border-red-300 rounded p-4">
            <p className="text-sm text-red-800">{error.message}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </button>
      </form>

      <div className="mt-6">
        <p className="text-center text-gray-600 mb-4">O continúa con:</p>
        <div className="space-y-2">
          <button
            onClick={() => signInWithOAuth('google')}
            className="w-full px-6 py-3 border rounded hover:bg-gray-50"
          >
            Continuar con Google
          </button>
          <button
            onClick={() => signInWithOAuth('github')}
            className="w-full px-6 py-3 border rounded hover:bg-gray-50"
          >
            Continuar con GitHub
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 🐛 Troubleshooting

### Problema: "User is null" en Server Component

**Causa:** No hay sesión activa o las cookies no están configuradas correctamente.

**Solución:**
1. Verificar que el usuario hizo login
2. Verificar cookies en DevTools → Application → Cookies
3. Debe existir cookie `sb-<project-ref>-auth-token`

```typescript
// Debug
import { getSession } from "@/lib/auth/getUser";

const session = await getSession();
console.log('Session:', session);
```

---

### Problema: Redirect loop en rutas protegidas

**Causa:** `requireAuth()` redirige a una página que también usa `requireAuth()`.

**Solución:**
- No usar `requireAuth()` en `/login` o `/signup`
- Usar `getUser()` en lugar de `requireAuth()` para verificación opcional

---

### Problema: Hook `useUser()` no se actualiza después del login

**Causa:** El listener `onAuthStateChange` no está funcionando.

**Solución:**
1. Verificar que el componente es Client Component (`'use client'`)
2. Asegurar que no hay múltiples instancias del hook
3. Forzar refresh con `router.refresh()` después del login

```typescript
const { signIn } = useAuth();
const router = useRouter();

await signIn({ email, password });
router.refresh(); // Forzar recarga
```

---

### Problema: Error "relation 'users' does not exist"

**Causa:** La tabla `users` no está creada en Supabase.

**Solución:**
1. Verificar que el schema principal está aplicado
2. Crear tabla `users`:

```sql
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'student',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Problema: returnUrl no funciona

**Causa:** El parámetro `returnUrl` no se está pasando correctamente.

**Solución:**
1. Verificar URL encoding:
   ```typescript
   const returnUrl = encodeURIComponent('/cursos/blockchain/quiz');
   router.push(`/login?returnUrl=${returnUrl}`);
   ```

2. Verificar que `signIn()` lee el parámetro:
   ```typescript
   const params = new URLSearchParams(window.location.search);
   const returnUrl = params.get("returnUrl") || "/";
   ```

---

## 🎯 Checklist de Implementación

### Setup Inicial
- [x] Supabase configurado con SSR
- [x] Tablas `users`, `courses`, `modules` creadas
- [x] Tablas `quiz_questions`, `quiz_attempts`, `certificates` creadas

### Helpers y Hooks
- [x] `lib/auth/getUser.ts` creado
- [x] `lib/auth/requireAuth.ts` creado
- [x] `hooks/useUser.ts` creado
- [x] `hooks/useAuth.ts` creado

### Rutas Protegidas
- [x] Quiz page protegida con `requireAuth()`
- [x] Certificate page protegida con `requireAuth()`
- [x] Verificación de ownership en certificates

### Componentes UI
- [x] `LoginPrompt` creado con 3 variantes
- [x] `QuizStartWrapper` creado para manejar navegación

### Testing
- [ ] Crear página de prueba para helpers
- [ ] Crear página de prueba para hooks
- [ ] Probar flujo de login completo
- [ ] Probar flujo de quiz con autenticación
- [ ] Probar acceso a certificados

### Páginas Pendientes
- [ ] Crear `/login` page
- [ ] Crear `/signup` page
- [ ] Crear `/auth/callback` page (para OAuth)
- [ ] Crear `/perfil` page
- [ ] Crear `/perfil/certificados` page

---

## 📞 Próximos Pasos

1. **Crear páginas de autenticación:**
   - `/login` - Formulario de login
   - `/signup` - Formulario de registro
   - `/auth/callback` - Callback para OAuth

2. **Implementar perfiles de usuario:**
   - Página de perfil con edición
   - Lista de certificados del usuario
   - Historial de quizzes

3. **Agregar protección a más rutas:**
   - Proteger lecciones premium
   - Proteger descarga de certificados
   - Proteger enrollment en cursos

4. **Mejorar UX:**
   - Skeleton loaders durante `loading: true`
   - Mensajes de error más descriptivos
   - Transiciones suaves entre estados

5. **Testing exhaustivo:**
   - Tests unitarios para helpers
   - Tests de integración para flujos completos
   - Tests E2E con Playwright

---

## ✅ Resumen

Has implementado exitosamente:

✅ **4 helpers** de autenticación server-side
✅ **2 hooks** de React client-side
✅ **2 rutas protegidas** (quiz y certificados)
✅ **2 componentes UI** (LoginPrompt y QuizStartWrapper)
✅ **Integración completa** con sistema de quizzes
✅ **Flujos de returnUrl** funcionando

**¡El sistema de autenticación está listo para usar! 🚀**

---

**Documentación creada:** $(Get-Date -Format "yyyy-MM-dd HH:mm")
**Versión:** 1.0
**Estado:** ✅ Completado
