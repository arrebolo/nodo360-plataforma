# ⚡ QUICK START - Fase 3A: Onboarding y Rutas

**Tiempo:** 5 minutos
**Objetivo:** Ver el sistema de rutas funcionando

---

## 🚀 3 PASOS PARA EMPEZAR

### PASO 1: Aplicar Migration (2 min)

```sql
-- 1. Abrir Supabase Dashboard
-- 2. Ir a SQL Editor
-- 3. Copiar TODO el contenido del archivo:
--    supabase/migrations/003_learning_paths.sql
-- 4. Pegar en SQL Editor
-- 5. Click "Run"
-- 6. Esperar "Success" ✅
```

**Verificar que funcionó:**
```sql
SELECT * FROM learning_paths;
-- Debe mostrar 3 filas (Bitcoin, Ethereum, Full-Stack)
```

---

### PASO 2: Preparar Usuario de Prueba (1 min)

**Limpiar ruta del usuario actual:**
```sql
-- En Supabase SQL Editor:
DELETE FROM user_selected_paths
WHERE user_id = (
  SELECT id FROM users
  WHERE email = 'TU_EMAIL@AQUI.COM'
);
```

**O crear usuario nuevo:**
- Ir a `http://localhost:3001/register`
- Registrarse con email nuevo

---

### PASO 3: Probar Flujo Completo (2 min)

1. **Login**
   ```
   http://localhost:3001/login
   ```

2. **Ir al Dashboard**
   ```
   http://localhost:3001/dashboard
   ```

3. **Verificar redirección:**
   - ✅ Redirige automáticamente a `/onboarding`

4. **En página de onboarding:**
   - ✅ Ver 3 cards de rutas hermosas
   - Click en "Ruta Bitcoin" (₿)
   - Click "Empezar mi viaje"

5. **En dashboard:**
   - ✅ Ver hero section naranja-amarillo
   - ✅ Ver "Ruta Bitcoin" activa
   - ✅ Ver botón "Continuar: [Curso]"

---

## ✅ SI TODO FUNCIONÓ

**Debes ver:**
- ✅ Página de onboarding elegante con animaciones
- ✅ Dashboard con hero section de ruta activa
- ✅ Progreso en 0% (usuario nuevo)
- ✅ Botón para continuar al primer curso

**¡Sistema funcionando al 100%!**

---

## ❌ SI ALGO FALLÓ

### "Tabla learning_paths no existe"
```sql
-- Aplicar migration de nuevo:
-- Copiar contenido de supabase/migrations/003_learning_paths.sql
-- Ejecutar en Supabase SQL Editor
```

### "Dashboard no redirige a onboarding"
```sql
-- Verificar que usuario NO tiene ruta:
SELECT * FROM user_selected_paths WHERE user_id = 'TU_USER_ID';

-- Si tiene registros, eliminarlos:
DELETE FROM user_selected_paths WHERE user_id = 'TU_USER_ID';
```

### "Hero section no aparece"
```sql
-- Verificar que ruta está activa:
SELECT * FROM user_selected_paths
WHERE user_id = 'TU_USER_ID' AND is_active = true;

-- Si no hay registros, ir a /onboarding y seleccionar ruta
```

---

## 📚 DOCUMENTACIÓN COMPLETA

- **Testing detallado:** Ver `FASE-3A-TESTING.md`
- **Resumen técnico:** Ver `FASE-3A-RESUMEN.md`
- **Troubleshooting:** Ver `FASE-3A-TESTING.md` sección debugging

---

**Estado:** ✅ Listo para testing en 5 minutos
**Servidor:** Ya está corriendo en `http://localhost:3001`
