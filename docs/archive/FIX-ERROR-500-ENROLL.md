# 🔧 FIX: Error 500 en API /enroll

## 🔍 Problema Identificado

**Error:** `POST /api/enroll` retorna `500 Internal Server Error`

**Mensaje:** `{"error":"Error interno del servidor"}`

## 🎯 Causa Raíz

Las **políticas RLS (Row Level Security)** de la tabla `course_enrollments` **NO están aplicadas** en la base de datos.

### ¿Por qué ocurre esto?

1. Cuando un usuario autenticado intenta inscribirse en un curso, Supabase verifica las políticas RLS
2. Si no hay política que permita `INSERT`, Supabase **rechaza la operación**
3. La API captura el error y retorna 500

### Evidencia

✅ La inscripción funciona con Service Role Key (bypasea RLS)
❌ La inscripción falla con autenticación de usuario (RLS activo)

## ✅ Solución (2 minutos)

### Paso 1: Abrir Supabase Dashboard

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Click en **"SQL Editor"** en el menú lateral

### Paso 2: Aplicar el script de RLS

1. Abre el archivo: `supabase/FIX-RLS-enrollments.sql`
2. Copia **TODO** el contenido
3. Pégalo en el SQL Editor
4. Click en **"Run"** (▶️)

### Paso 3: Verificar el resultado

Deberías ver este mensaje:

```
✅ Políticas RLS aplicadas correctamente (6 políticas)
```

### Paso 4: Probar la inscripción

1. Ve a tu aplicación
2. Intenta inscribirte en un curso
3. ✅ Debería funcionar sin error 500

## 🔬 Diagnóstico Adicional (opcional)

Si quieres verificar manualmente las políticas RLS:

```bash
# Ejecutar script de diagnóstico
npx tsx scripts/test-enroll-direct.ts
```

## 📋 Políticas RLS Aplicadas

Estas son las 6 políticas que se crean:

### Para Usuarios:
1. ✅ `Users can view own enrollments` - Ver sus propias inscripciones
2. ✅ `Users can create own enrollments` - **Crear inscripciones (clave para /api/enroll)**
3. ✅ `Users can update own enrollments` - Actualizar progreso
4. ✅ `Users can delete own enrollments` - Desinscribirse

### Para Instructores/Admins:
5. ✅ `Instructors can view course enrollments` - Ver inscripciones de sus cursos
6. ✅ `Admins can view all enrollments` - Ver todas las inscripciones

## ⚠️ Prevención

Para evitar este problema en el futuro:

1. **Siempre aplicar migraciones en orden:**
   - `supabase/04-migration-enrollments.sql` debe aplicarse al crear la tabla

2. **Verificar políticas RLS:**
   - Dashboard → Database → Tables → course_enrollments → Policies
   - Debe haber al menos 4 políticas para usuarios

3. **Probar con usuario real:**
   - No solo con service role key
   - Probar flujo completo de inscripción

## 🐛 Debugging

Si el error persiste después de aplicar el script:

1. **Verificar autenticación:**
   ```bash
   # Ver logs del servidor
   npm run dev
   ```
   Buscar en logs: `❌ [API POST /enroll]`

2. **Verificar datos del request:**
   ```javascript
   // En la consola del navegador
   console.log('User authenticated:', auth.user)
   console.log('Course ID:', courseId)
   ```

3. **Verificar en Supabase:**
   - Dashboard → Authentication → Users
   - Verificar que el usuario existe
   - Verificar que `auth.uid()` retorna un UUID válido

## 📚 Archivos Relacionados

- `app/api/enroll/route.ts` - API endpoint (mejorado con logging)
- `lib/db/enrollments.ts` - Función de inscripción (mejorado con logging)
- `supabase/04-migration-enrollments.sql` - Migración completa original
- `supabase/FIX-RLS-enrollments.sql` - Fix rápido solo de RLS ⭐
- `scripts/test-enroll-direct.ts` - Script de diagnóstico

## ✅ Checklist Final

- [ ] Script `FIX-RLS-enrollments.sql` ejecutado en Supabase
- [ ] Mensaje de éxito visible en SQL Editor
- [ ] Probado: Inscripción en un curso desde la app
- [ ] Verificado: No hay error 500
- [ ] Verificado: Inscripción aparece en dashboard del usuario

## 🎉 Resultado Esperado

Después de aplicar el fix:

```json
// ✅ Respuesta exitosa de /api/enroll
{
  "data": {
    "id": "uuid-aqui",
    "user_id": "uuid-usuario",
    "course_id": "uuid-curso",
    "progress_percentage": 0,
    "enrolled_at": "2025-11-22T..."
  },
  "message": "¡Te has inscrito exitosamente en 'Nombre del Curso'!"
}
```

---

**Tiempo estimado de solución:** 2-5 minutos
**Dificultad:** Fácil ⭐
**Requiere:** Acceso a Supabase Dashboard
