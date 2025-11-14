# 🎯 Guía de Integración Backend - Nodo360

## ✅ Lo que ya está hecho:

1. ✅ Base de datos creada en Supabase (7 tablas)
2. ✅ Variables de entorno configuradas (`.env.local`)
3. ✅ Cliente de Supabase instalado (`@supabase/supabase-js`)
4. ✅ Cliente configurado (`lib/supabase/client.ts`)
5. ✅ Tipos TypeScript (`lib/supabase/types.ts`)
6. ✅ Funciones helper (`lib/supabase/helpers.ts`)
7. ✅ Documentación completa (`lib/supabase/README.md`)

---

## 📋 Próximos Pasos para Integración

### 1️⃣ Copiar los archivos a tu proyecto

Los archivos están en la carpeta `lib/` que he creado. Copia toda la carpeta `lib` a la raíz de tu proyecto `nodo360-plataforma`:

```
nodo360-plataforma/
├── .env.local          ✅ Ya existe
├── lib/                ← Copiar esta carpeta completa
│   └── supabase/
│       ├── client.ts
│       ├── types.ts
│       ├── helpers.ts
│       ├── index.ts
│       └── README.md
├── app/
├── components/
└── ...
```

### 2️⃣ Reiniciar el servidor de desarrollo

Después de copiar los archivos, reinicia Next.js para que cargue las nuevas variables de entorno:

```bash
# Si el servidor está corriendo, deténlo con Ctrl+C
# Luego inicia de nuevo:
npm run dev
```

### 3️⃣ Probar la conexión

Crea un archivo de prueba: `app/test-db/page.tsx`

```typescript
import { testConnection } from '@/lib/supabase';

export default async function TestPage() {
  const result = await testConnection();
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test de Conexión Supabase</h1>
      <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}
```

Visita: `http://localhost:3000/test-db`

Si ves `"success": true`, ¡todo funciona! 🎉

---

## 🚀 Cómo Empezar a Usar

### Opción A: Poblar la base de datos manualmente

Ve a Supabase Dashboard → Table Editor y agrega datos de prueba:

**1. Crear un curso:**
- Tabla: `courses`
- Datos mínimos:
  - `title`: "Bitcoin desde Cero"
  - `slug`: "bitcoin-desde-cero"
  - `description`: "Aprende Bitcoin paso a paso"
  - `is_free`: true
  - `order_index`: 1

**2. Crear un módulo:**
- Tabla: `modules`
- Datos mínimos:
  - `course_id`: (ID del curso creado)
  - `title`: "Introducción a Bitcoin"
  - `slug`: "introduccion"
  - `order_index`: 1

**3. Crear una lección:**
- Tabla: `lessons`
- Datos mínimos:
  - `module_id`: (ID del módulo creado)
  - `title`: "¿Qué es Bitcoin?"
  - `slug`: "que-es-bitcoin"
  - `content`: "Contenido de la lección..."
  - `order_index`: 1
  - `is_free_preview`: true

### Opción B: Usar un script de migración

Crea: `scripts/seed-database.ts`

```typescript
import { supabase } from '../lib/supabase';

async function seedDatabase() {
  // 1. Crear curso
  const { data: course } = await supabase
    .from('courses')
    .insert({
      title: 'Bitcoin desde Cero',
      slug: 'bitcoin-desde-cero',
      description: 'Aprende Bitcoin desde los fundamentos',
      is_free: true,
      order_index: 1,
    })
    .select()
    .single();

  console.log('Curso creado:', course);

  // 2. Crear módulo
  const { data: module } = await supabase
    .from('modules')
    .insert({
      course_id: course.id,
      title: 'Módulo 1: Introducción',
      slug: 'introduccion',
      order_index: 1,
    })
    .select()
    .single();

  console.log('Módulo creado:', module);

  // 3. Crear lección
  const { data: lesson } = await supabase
    .from('lessons')
    .insert({
      module_id: module.id,
      title: '¿Qué es Bitcoin?',
      slug: 'que-es-bitcoin',
      content: 'Bitcoin es una moneda digital descentralizada...',
      order_index: 1,
      is_free_preview: true,
    })
    .select()
    .single();

  console.log('Lección creada:', lesson);
}

seedDatabase();
```

Ejecutar: `npx tsx scripts/seed-database.ts`

---

## 📄 Crear tu primera página con datos reales

### Página de cursos: `app/cursos/page.tsx`

```typescript
import { getCourses } from '@/lib/supabase';
import Link from 'next/link';

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Cursos</h1>
      
      <div className="grid md:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Link 
            key={course.id}
            href={`/cursos/${course.slug}`}
            className="border p-6 rounded-lg hover:shadow-lg"
          >
            <h2 className="text-xl font-bold mb-2">{course.title}</h2>
            <p className="text-gray-600">{course.description}</p>
            {course.is_free && (
              <span className="text-green-600 text-sm">Gratis</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
```

---

## 🔐 Configurar Autenticación (Opcional para después)

### 1. Habilitar proveedores en Supabase
- Dashboard → Authentication → Providers
- Habilitar: Email, Google, etc.

### 2. Crear componente de login

```typescript
'use client';

import { supabase } from '@/lib/supabase';
import { useState } from 'react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      alert('Error al iniciar sesión');
    } else {
      alert('¡Inicio de sesión exitoso!');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full mb-4 p-2 border rounded"
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full mb-4 p-2 border rounded"
      />
      <button
        onClick={handleLogin}
        className="w-full bg-orange-500 text-white p-2 rounded"
      >
        Iniciar Sesión
      </button>
    </div>
  );
}
```

---

## 🛡️ Configurar Row Level Security (RLS)

En Supabase Dashboard → Authentication → Policies:

### Política para leer cursos públicos:
```sql
CREATE POLICY "Cualquiera puede ver cursos públicos"
ON courses FOR SELECT
TO public
USING (true);
```

### Política para progreso de usuario:
```sql
CREATE POLICY "Usuarios solo ven su progreso"
ON user_progress FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

---

## 📊 Resumen de Arquitectura

```
Frontend (Next.js)
    ↓
lib/supabase/
    ├── client.ts      → Conexión configurada
    ├── helpers.ts     → Funciones de negocio
    └── types.ts       → TypeScript types
    ↓
Supabase Backend
    ├── PostgreSQL     → Base de datos
    ├── Auth           → Autenticación
    └── Storage        → Archivos (futuro)
```

---

## 🎯 Roadmap de Implementación

### Fase 1: Básico (Ahora) ✅
- [x] Configurar Supabase
- [x] Crear cliente y helpers
- [x] Configurar variables de entorno

### Fase 2: Integración (Siguiente)
- [ ] Copiar archivos al proyecto
- [ ] Poblar base de datos con cursos existentes
- [ ] Crear páginas que usen los datos

### Fase 3: Features Avanzadas
- [ ] Sistema de autenticación
- [ ] Progreso del usuario
- [ ] Bookmarks y notas
- [ ] Dashboard de estudiante

### Fase 4: Optimización
- [ ] Caché de queries
- [ ] Optimización de imágenes
- [ ] Analytics

---

## ❓ FAQ

**P: ¿Cómo migro mis cursos actuales?**  
R: Crea un script que lea tus archivos actuales y los inserte en Supabase usando las funciones helper.

**P: ¿Necesito autenticación ahora?**  
R: No, puedes empezar mostrando cursos sin login. Implementa auth después.

**P: ¿Qué pasa con el contenido en WordPress?**  
R: Puedes mantener ambos durante la migración. Supabase para nuevos features, WordPress para contenido legacy.

**P: ¿Cómo hago deploy?**  
R: Vercel detecta automáticamente las variables de entorno. Solo agrega las mismas en Vercel Dashboard → Settings → Environment Variables.

---

## 📞 Soporte

Si tienes dudas:
1. Consulta `lib/supabase/README.md`
2. Revisa los ejemplos en `EXAMPLES.tsx`
3. Documentación oficial: https://supabase.com/docs

---

**¡Todo listo para empezar a construir! 🚀**

Última actualización: Noviembre 2025
