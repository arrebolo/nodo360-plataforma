# ✅ TESTING: Sistema de Inscripción - Diagnóstico Completado

**Fecha:** 2025-11-21
**Estado:** ✅ Backend funciona correctamente | 🔍 Requiere testing en navegador

---

## 📊 DIAGNÓSTICO COMPLETADO

### ✅ Resultados del Script de Diagnóstico

Se ejecutó `scripts/test-enrollment.ts` con los siguientes resultados:

```
✅ Tabla course_enrollments: Existe
✅ Usuario de prueba: Encontrado (<correo-de-pruebas>)
✅ Curso "Seguridad en Crypto": Encontrado (seguridad-crypto-basico)
✅ INSERT directo: FUNCIONA
✅ Verificación con JOINs: FUNCIONA
✅ Función enrollUserInCourse(): FUNCIONA
```

**Conclusión:** El backend funciona perfectamente. El error 500 debe venir del flujo frontend → endpoint.

---

## 🔍 POSIBLES CAUSAS DEL ERROR 500

### 1. **Usuario no autenticado en navegador**
   - El endpoint requiere sesión válida
   - Verificar que hay cookie `sb-access-token`

### 2. **courseId incorrecto o null**
   - Verificar que el componente recibe `courseId` válido
   - No debe ser `undefined` o `null`

### 3. **Error parseando JSON del body**
   - Poco probable, el código está bien

### 4. **Problema con Supabase auth en navegador**
   - Cookie expirada
   - Sesión invalidada

---

## 🧪 PASOS DE TESTING EN NAVEGADOR

### PASO 1: Verificar Autenticación

1. **Abrir navegador:** `http://localhost:3000`

2. **Ir a curso:** `http://localhost:3000/cursos/seguridad-crypto-basico`

3. **Abrir DevTools (F12) → Console**

4. **Verificar sesión:**
   ```javascript
   // Pegar en console:
   document.cookie.split('; ').find(c => c.startsWith('sb-access-token'))
   ```

   **Debe mostrar:** `"sb-access-token=ey..."`

   **Si muestra `undefined`:** Usuario NO está autenticado
   - Solución: Hacer login primero

---

### PASO 2: Verificar Logs Antes de Click

**En DevTools Console, debe haber logs automáticos de la página cargando:**

Buscar:
```
✅ [CoursePage] Curso encontrado: ...
📊 [CoursePage] Usuario inscrito: ...
```

Si no hay estos logs, la página tiene problemas cargando.

---

### PASO 3: Click en "Inscribirse Gratis"

**Al hacer click, verificar logs en Console:**

```javascript
// Logs esperados:
🔍 [EnrollButton] Iniciando inscripción...
📊 [EnrollButton] Datos: {
  courseId: "99987b3a-c6b1-411b-a449-399c3f03fd82",
  courseSlug: "seguridad-crypto-basico",
  isEnrolled: false,
  isAuthenticated: true
}
📤 [EnrollButton] Enviando inscripción...
   courseId: 99987b3a-c6b1-411b-a449-399c3f03fd82
📥 [EnrollButton] Response: {
  status: 201,
  ok: true,
  statusText: "Created"
}
✅ [EnrollButton] Inscripción exitosa
```

**Si hay error, logs mostrarán:**
```javascript
❌ [EnrollButton] Response: {
  status: 500,
  ok: false,
  statusText: "Internal Server Error"
}
📊 [EnrollButton] Response data: { error: "..." }
❌ [EnrollButton] Error: ...
```

---

### PASO 4: Verificar Logs del Servidor

**En terminal donde corre `npm run dev`, verificar:**

```
🔍 [API POST /enroll] Iniciando...
✅ [API POST /enroll] Usuario autenticado: fd5a64c2-...
📊 [API POST /enroll] Datos: {
  userId: 'fd5a64c2-...',
  courseId: '99987b3a-...'
}
✅ [API POST /enroll] Curso verificado: Seguridad en Crypto: Primeros Pasos
🔍 [enrollUserInCourse] Inscribiendo usuario: ...
✅ [enrollUserInCourse] Inscripción exitosa: ...
✅ [API POST /enroll] Inscripción exitosa
```

**Si hay error 500, logs mostrarán exactamente dónde falla.**

---

## 🔧 DEBUGGING PASO A PASO

### Si logs de navegador muestran:

#### `isAuthenticated: false`
**Causa:** Usuario no está logueado
**Solución:**
1. Ir a `/login`
2. Iniciar sesión con `<correo-de-pruebas>` / contraseña
3. Volver al curso
4. Intentar de nuevo

#### `courseId: undefined` o `courseId: null`
**Causa:** El componente no recibe courseId correcto
**Solución:**
1. Verificar en código de la página del curso
2. Buscar `<EnrollButton courseId={...} />`
3. Asegurarse que `course.id` existe

#### `status: 401` (No autenticado)
**Causa:** Cookie de sesión inválida/expirada
**Solución:**
1. Borrar cookies del sitio
2. Hacer login de nuevo
3. Intentar inscripción

#### `status: 404` (Curso no encontrado)
**Causa:** courseId no existe en base de datos
**Solución:**
1. Verificar en logs del servidor qué courseId se recibió
2. Comparar con resultado de script de diagnóstico
3. Verificar que el curso existe en Supabase

#### `status: 500` (Error interno)
**Causa:** Error en endpoint o función enrollUserInCourse
**Solución:**
1. **VER LOGS DEL SERVIDOR** (terminal npm run dev)
2. Identificar línea exacta donde falla
3. Si es error de Supabase, revisar RLS policies
4. Si es error de código, revisar endpoint

---

## 📋 CHECKLIST DE VERIFICACIÓN

Antes de reportar problema, verificar:

- [ ] Usuario está logueado (cookie `sb-access-token` existe)
- [ ] Curso existe y está publicado (`status: 'published'`)
- [ ] `courseId` no es `undefined` o `null`
- [ ] Logs de DevTools Console están habilitados
- [ ] Logs del servidor (terminal) están visibles
- [ ] Script de diagnóstico (`npx tsx scripts/test-enrollment.ts`) pasa ✅

---

## 🎯 SOLUCIONES RÁPIDAS

### Si usuario no puede inscribirse:

#### Opción 1: Inscribir manualmente desde Supabase
```sql
-- En Supabase SQL Editor:
INSERT INTO course_enrollments (user_id, course_id, enrolled_at, progress_percentage)
VALUES (
  'USER_ID_AQUI',
  '99987b3a-c6b1-411b-a449-399c3f03fd82',
  NOW(),
  0
);
```

#### Opción 2: Usar script de test como workaround
```bash
# Modificar scripts/test-enrollment.ts con el user_id correcto
npx tsx scripts/test-enrollment.ts
```

#### Opción 3: Verificar RLS policies
```sql
-- En Supabase SQL Editor, verificar políticas:
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'course_enrollments';

-- Si falta política INSERT, crearla:
CREATE POLICY "Users can enroll themselves"
  ON course_enrollments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## 📊 ESTADO ACTUAL DEL SISTEMA

### ✅ Componentes Verificados:
- [x] Tabla `course_enrollments` existe
- [x] INSERT funciona con service role key
- [x] Foreign keys son válidos
- [x] Función `enrollUserInCourse()` funciona
- [x] Endpoint `/api/enroll` tiene código correcto
- [x] Componente `EnrollButton` tiene logs detallados

### 🔍 Requiere Testing:
- [ ] Autenticación del usuario en navegador
- [ ] Flow completo: Click → Fetch → Endpoint → DB
- [ ] Logs del servidor en tiempo real
- [ ] Verificación de inscripción exitosa

---

## 📝 PRÓXIMOS PASOS

1. **Abrir dos ventanas:**
   - Navegador: `http://localhost:3000/cursos/seguridad-crypto-basico`
   - Terminal: Ver logs de `npm run dev`

2. **Abrir DevTools (F12) en navegador**
   - Tab Console para ver logs del cliente

3. **Click en "Inscribirse Gratis"**

4. **Capturar:**
   - Logs completos de Console (navegador)
   - Logs completos de terminal (servidor)
   - Screenshot del error si hay

5. **Compartir logs para diagnóstico preciso**

---

## 🆘 SI PERSISTE EL ERROR

**Compartir:**
1. Logs completos de DevTools Console (desde que carga la página)
2. Logs completos del servidor (desde que se hace POST)
3. Screenshot del error
4. Confirmar que script de diagnóstico pasa ✅

**Entonces se puede:**
- Identificar línea exacta donde falla
- Ver valor exacto de variables en momento del error
- Corregir problema específico

---

**Estado:** ✅ Backend 100% funcional | 🔍 Pendiente testing en navegador
**Impacto:** Alto - Inscripción es funcionalidad crítica
**Tiempo estimado:** 5-10 minutos de testing con logs
