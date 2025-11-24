# 🚨 SOLUCIÓN RÁPIDA - Error 400 Enrollments

## ⚡ PROBLEMA IDENTIFICADO

**La tabla `course_enrollments` NO EXISTE en la base de datos.**

Este es el motivo del error 400 al intentar inscribirse en cursos.

---

## ✅ SOLUCIÓN EN 3 PASOS (5 minutos)

### PASO 1: Aplicar Migración SQL (2 min)

1. **Abrir Supabase Dashboard:**
   - https://supabase.com/dashboard

2. **Ir a SQL Editor:**
   - Panel izquierdo → SQL Editor → New Query

3. **Copiar y ejecutar:**
   - Abrir archivo: `supabase/04-migration-enrollments.sql`
   - Copiar TODO el contenido
   - Pegar en SQL Editor
   - Click en "Run" (▶️)

4. **Verificar éxito:**
   - Debes ver: `✅ Migration successful: course_enrollments table created`

---

### PASO 2: Reiniciar Servidor (1 min)

```bash
# Detener servidor (Ctrl+C)
# Reiniciar
npm run dev
```

---

### PASO 3: Probar Inscripción (2 min)

1. **Abrir navegador con DevTools (F12)**

2. **Ir a curso:**
   ```
   http://localhost:3000/cursos/introduccion-criptomonedas
   ```

3. **Click en "Inscribirse Gratis"**

4. **Verificar:**
   - ✅ Console muestra: `✅ [EnrollButton] Inscripción exitosa`
   - ✅ Botón cambia a "Inscrito"
   - ✅ Redirige a primera lección
   - ✅ Sin errores 400

5. **Verificar Dashboard:**
   ```
   http://localhost:3000/dashboard
   ```
   - ✅ Curso aparece en "Continúa tu aprendizaje"

---

## 📋 VERIFICACIÓN EN SUPABASE

**Table Editor → course_enrollments:**

Debe existir 1 registro nuevo:
```
user_id: [tu_id]
course_id: ce6b8d54-b1a3-40f1-ac7a-2730d8002862
progress_percentage: 0
enrolled_at: [timestamp]
```

---

## 🐛 SI ALGO FALLA

### Error: "table course_enrollments does not exist"
→ Aplicar migración SQL (Paso 1)

### Error: 401 Unauthorized
→ Hacer login en `/login`

### Botón no cambia
→ Refrescar página (F5)

---

## 📊 RESULTADO DEL DEBUG

```
✅ Curso existe: introduccion-criptomonedas
✅ Status correcto: published
✅ Código correcto: No requiere cambios
❌ Tabla faltante: course_enrollments (CREADA con migración)
```

---

## 📝 ARCHIVOS MODIFICADOS

1. **CREADO:** `supabase/04-migration-enrollments.sql`
   - Tabla course_enrollments completa

2. **MODIFICADO:** `components/course/EnrollButton.tsx`
   - Logging mejorado para debug

3. **MODIFICADO:** `app/cursos/[slug]/page.tsx`
   - Logging de datos antes de EnrollButton

4. **CREADO:** `scripts/debug-enroll.ts`
   - Script de diagnóstico

---

## ✅ CHECKLIST RÁPIDO

- [ ] Migración SQL aplicada
- [ ] Servidor reiniciado
- [ ] Inscripción funciona sin error 400
- [ ] Botón cambia a "Inscrito"
- [ ] Dashboard muestra curso
- [ ] Registro en BD verificado

---

**⏱️ Tiempo total:** 5 minutos
**🎯 Estado:** Listo para aplicar
**📄 Reporte completo:** Ver `REPORTE-DEBUG-ENROLLMENTS.md`
