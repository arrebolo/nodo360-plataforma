# 🔍 INSTRUCCIONES DE DIAGNÓSTICO - Nodo360

## ✅ CAMBIOS IMPLEMENTADOS

### 1. **app/auth/callback/route.ts** - Logging Exhaustivo
- ✅ Logs con emojis triple (🚀🚀🚀, 🔍, 📊, etc.)
- ✅ Intenta leer de tabla `users` primero
- ✅ Si falla, intenta tabla `profiles`
- ✅ Muestra todos los datos de perfil y errores
- ✅ Redirección según rol con logs evidentes

### 2. **middleware.ts** - Redirección Inteligente
- ✅ Detectado y corregido problema crítico
- ✅ El middleware ahora consulta el rol antes de redirigir
- ✅ Admin/Instructor → `/admin/cursos`
- ✅ Usuario normal → `/dashboard`

### 3. **lib/auth/redirect-after-login.ts** - Máximo Logging
- ✅ Logs con emojis triple (🔍🔍🔍)
- ✅ Intenta ambas tablas (users y profiles)
- ✅ Muestra todos los pasos de decisión
- ✅ Error visible si no puede leer perfil

## 🎯 PROBLEMA ENCONTRADO

**El middleware.ts estaba forzando redirect a /dashboard**

**Líneas 84-86 del middleware.ts (ANTES):**
```typescript
// Si está en ruta de auth y YA está autenticado → redirigir a dashboard
if (isAuthRoute && user) {
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
```

**DESPUÉS:** Ahora consulta el rol y redirige según corresponda.

## 📋 VERIFICACIONES EN SUPABASE

### 1. Verificar qué tabla tiene el rol

Ejecutar en Supabase SQL Editor:

```sql
-- Ver todas las tablas que tienen columna 'role'
SELECT table_name
FROM information_schema.columns
WHERE column_name = 'role'
AND table_schema = 'public';

-- Opción 1: Tabla 'users'
SELECT id, email, role, full_name
FROM public.users
WHERE email = 'albertonunezdiaz@gmail.com';

-- Opción 2: Tabla 'profiles'
SELECT user_id, email, role, full_name
FROM public.profiles
WHERE email = 'albertonunezdiaz@gmail.com';
```

### 2. Actualizar rol a 'admin' si es necesario

```sql
-- Si usas tabla 'users'
UPDATE public.users
SET role = 'admin'
WHERE email = 'albertonunezdiaz@gmail.com';

-- Si usas tabla 'profiles'
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'albertonunezdiaz@gmail.com';
```

### 3. Verificar políticas RLS

```sql
-- Ver políticas de la tabla users
SELECT * FROM pg_policies WHERE tablename = 'users';

-- Ver políticas de la tabla profiles
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

### 4. Crear políticas RLS si no existen

```sql
-- Para tabla 'users'
CREATE POLICY IF NOT EXISTS "Users can read own profile"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Para tabla 'profiles' (si la usas)
CREATE POLICY IF NOT EXISTS "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

### 5. Verificar redirect URL en Supabase Dashboard

1. Ve a **Authentication** → **URL Configuration**
2. Verifica que "Redirect URLs" incluya:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/**`

## 🧪 INSTRUCCIONES DE TESTING

### Paso 1: Limpiar cookies
1. Abrir DevTools (F12)
2. Application → Clear site data
3. O borrar cookies manualmente

### Paso 2: Iniciar servidor
```bash
npm run dev
```

### Paso 3: Hacer login
1. Ir a http://localhost:3000/login
2. Hacer login con `albertonunezdiaz@gmail.com`

### Paso 4: Revisar logs en la terminal

Buscar logs con estos emojis:

**En el callback:**
- `🚀🚀🚀 [Auth Callback] ===== CALLBACK EJECUTÁNDOSE =====`
- `📍 [Auth Callback] Code: Presente/Ausente`
- `📊 [Auth Callback] Resultado tabla "users"`
- `✅✅✅ [Auth Callback] PERFIL ENCONTRADO`
- `👑👑👑 [Auth Callback] REDIRIGIENDO A /admin/cursos`

**En el middleware:**
- `🔍🔍🔍 [Middleware] Usuario autenticado en ruta de auth`
- `📊 [Middleware] Rol obtenido: admin`
- `👑👑👑 [Middleware] Admin/Instructor → Redirigiendo a /admin/cursos`

**En redirectAfterLogin (si se llama):**
- `🔍🔍🔍 [redirectAfterLogin] ===== INICIANDO REDIRECT LOGIC =====`
- `📊 [redirectAfterLogin] Resultado de tabla "users"`
- `👑👑👑 [redirectAfterLogin] REDIRIGIENDO A /admin/cursos`

### Paso 5: Verificar redirección

- ✅ **ÉXITO:** Debes ver `/admin/cursos` con el panel de administración
- ❌ **FALLO:** Si ves `/dashboard`, revisar los logs

## 🔍 INTERPRETACIÓN DE LOGS

### Si ves este error:
```
❌❌❌ [Auth Callback] NO SE PUDO LEER EL PERFIL
   - Error: {...}
   - Verifica RLS en Supabase!
```

**Solución:**
1. Verificar que la tabla `users` existe y tiene columna `role`
2. Ejecutar las políticas RLS arriba
3. Verificar que el usuario tiene rol asignado

### Si ves este error:
```
⚠️⚠️⚠️ [Auth Callback] FALLBACK: Redirigiendo a /dashboard
```

**Significa:**
- El perfil NO se pudo leer
- Cayó en el fallback por defecto
- Revisar RLS y estructura de tabla

### Si ves:
```
👑👑👑 [Auth Callback] REDIRIGIENDO A /admin/cursos
```

**Pero igual caes en /dashboard**, entonces:
- El middleware está pisando la redirección
- Verificar que el middleware también muestre logs con 👑👑👑
- Si el middleware muestra 👤 [Usuario normal], entonces el rol no se está leyendo bien

## 📊 TABLA DE DIAGNÓSTICO

| Síntoma | Causa Probable | Solución |
|---------|----------------|----------|
| Siempre va a /dashboard | RLS bloqueando lectura de rol | Ejecutar políticas RLS |
| Error "sin_perfil_rls" | Tabla no existe o RLS mal | Verificar tabla users/profiles |
| Logs no aparecen | Callback no se ejecuta | Verificar Redirect URL en Supabase |
| Middleware redirige mal | Rol no se lee en middleware | Verificar RLS y tabla |

## 🚀 SIGUIENTES PASOS

1. **Ejecutar SQL de verificación** en Supabase
2. **Borrar cookies** del navegador
3. **Hacer login** con albertonunezdiaz@gmail.com
4. **Revisar logs** en terminal (buscar 🚀🚀🚀, 👑👑👑)
5. **Reportar resultados** con logs completos

## 📝 NOTAS IMPORTANTES

- Los logs con **triple emoji** (🚀🚀🚀, 🔍🔍🔍, 👑👑👑) son los críticos
- El middleware se ejecuta en **CADA request**
- El callback se ejecuta **SOLO después de OAuth/Magic Link**
- `redirectAfterLogin` se usa en **login con password**

## ✅ CHECKLIST FINAL

- [ ] Ejecutar SQL para verificar rol del usuario
- [ ] Crear políticas RLS si no existen
- [ ] Verificar Redirect URL en Supabase Dashboard
- [ ] Borrar cookies del navegador
- [ ] Hacer login y revisar logs
- [ ] Confirmar redirección a /admin/cursos

---

**Generado:** $(date)
**Estado:** Diagnóstico implementado ✅
**Próximo paso:** Testing con logs
