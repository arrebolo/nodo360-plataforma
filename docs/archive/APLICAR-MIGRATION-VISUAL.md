# 📋 APLICAR MIGRATION: Guía Visual Paso a Paso

**Tiempo:** 3 minutos
**Dificultad:** Muy fácil

---

## 🎯 OBJETIVO

Crear 3 tablas nuevas en Supabase para el sistema de rutas de aprendizaje.

---

## 📝 PASO A PASO

### PASO 1: Abrir Supabase Dashboard (30 segundos)

1. **Ir a:** https://supabase.com/dashboard
2. **Seleccionar tu proyecto:** "nodo360-plataforma" (o el nombre que tengas)
3. **Click en:** "SQL Editor" (en el menú lateral izquierdo)

```
┌─────────────────────────────────────┐
│ Supabase                            │
├─────────────────────────────────────┤
│ > Dashboard                          │
│ > Authentication                     │
│ > Database                           │
│   > Tables                           │
│   > Indexes                          │
│   > Publications                     │
│ ► SQL Editor    ← AQUÍ               │
│ > Functions                          │
│ > Triggers                           │
└─────────────────────────────────────┘
```

---

### PASO 2: Copiar el SQL (1 minuto)

1. **Abrir el archivo:**
   ```
   supabase/migrations/003_learning_paths.sql
   ```

2. **Seleccionar TODO el contenido:**
   - Windows: `Ctrl + A`
   - Mac: `Cmd + A`

3. **Copiar:**
   - Windows: `Ctrl + C`
   - Mac: `Cmd + C`

**El archivo contiene:**
- ✅ 3 tablas nuevas
- ✅ Índices para optimización
- ✅ RLS policies
- ✅ 3 rutas pre-configuradas (Bitcoin, Ethereum, Full-Stack)
- ✅ Asignación de cursos a rutas

---

### PASO 3: Pegar en SQL Editor (30 segundos)

1. **En Supabase SQL Editor:**
   - Click en el área de texto grande (dice "Write your SQL query here...")

2. **Pegar el SQL:**
   - Windows: `Ctrl + V`
   - Mac: `Cmd + V`

3. **Verificar:**
   - Debes ver el SQL completo (empieza con "-- SISTEMA DE RUTAS...")
   - Son ~230 líneas de SQL
   - Se ve así:

```sql
-- ================================================
-- SISTEMA DE RUTAS DE APRENDIZAJE - NODO360
-- ================================================

-- 1. TABLA: learning_paths
CREATE TABLE IF NOT EXISTS public.learning_paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ...
```

---

### PASO 4: Ejecutar (1 minuto)

1. **Click en el botón "Run"** (esquina inferior derecha)
   - O presiona: `Ctrl + Enter` (Windows) / `Cmd + Enter` (Mac)

2. **Esperar el resultado:**
   - Debe aparecer mensaje: "Success. No rows returned"
   - O similar indicando éxito ✅

```
┌─────────────────────────────────────┐
│ SQL Query                            │
├─────────────────────────────────────┤
│ [Tu SQL pegado aquí]                │
│                                      │
│                                      │
└─────────────────────────────────────┘
    [Cancel]          [Run] ← CLICK AQUÍ

✅ Success. No rows returned
```

---

### PASO 5: Verificar (30 segundos)

**Verificar que las tablas se crearon:**

1. **En Supabase, ir a:** Database > Tables (menú lateral)

2. **Buscar las 3 tablas nuevas:**
   - ✅ `learning_paths`
   - ✅ `path_courses`
   - ✅ `user_selected_paths`

**O ejecutar query de verificación:**

```sql
-- Pegar esto en SQL Editor y ejecutar:
SELECT * FROM learning_paths;
```

**Debe mostrar 3 filas:**
- bitcoin-fundamentals (Ruta Bitcoin)
- ethereum-developer (Ruta Ethereum)
- crypto-full-stack (Ruta Full-Stack)

---

## ✅ SI TODO FUNCIONÓ

**Debes ver:**
- ✅ Mensaje "Success" en SQL Editor
- ✅ 3 tablas nuevas en Database > Tables
- ✅ Query `SELECT * FROM learning_paths` retorna 3 rutas

**¡Migration aplicada exitosamente!**

---

## ❌ SI ALGO FALLÓ

### Error: "relation already exists"
**Significa:** Las tablas ya existen (está bien)
**Acción:** No hacer nada, continuar

### Error: "permission denied"
**Significa:** No tienes permisos de admin
**Acción:** Verificar que estás en el proyecto correcto

### Error: "syntax error"
**Significa:** SQL mal copiado
**Acción:**
1. Borrar todo del SQL Editor
2. Volver a copiar desde el archivo (Ctrl+A, Ctrl+C)
3. Pegar de nuevo (Ctrl+V)
4. Ejecutar

### No veo el botón "Run"
**Acción:**
- Scroll hacia abajo en la ventana
- O presiona `Ctrl + Enter` para ejecutar

---

## 🚀 PRÓXIMO PASO

Una vez aplicada la migration:

```bash
# Ejecutar este comando para verificar:
npx tsx scripts/apply-learning-paths-migration.ts
```

**Debe mostrar:**
```
✅ [Migration] Tabla learning_paths existe
   Rutas encontradas: 3
   1. Ruta Bitcoin (bitcoin-fundamentals)
   2. Ruta Ethereum (ethereum-developer)
   3. Ruta Full-Stack Crypto (crypto-full-stack)

✅ [Migration] Tabla path_courses existe
   Cursos asignados: X

✅ [Migration] Tabla user_selected_paths existe
   Usuarios con rutas: 0
```

**Entonces continuar con:**
- Testing del flujo de onboarding
- Ver: `FASE-3A-QUICK-START.md`

---

## 📞 AYUDA VISUAL

### Dónde está SQL Editor:

```
Supabase Dashboard
├── Project: nodo360-plataforma
│   ├── Table Editor
│   ├── Authentication
│   ├── Database
│   │   ├── Tables
│   │   └── SQL Editor  ← AQUÍ
│   ├── Storage
│   └── Edge Functions
```

### Cómo se ve el SQL Editor:

```
┌────────────────────────────────────────────────┐
│ New query                    [Templates ▼]     │
├────────────────────────────────────────────────┤
│                                                 │
│  [Aquí pegas el SQL]                           │
│                                                 │
│                                                 │
│                                                 │
│                                                 │
│                                                 │
│                                                 │
│                                                 │
│                                                 │
│                                                 │
├────────────────────────────────────────────────┤
│ Results                                         │
│ ✅ Success. No rows returned                   │
└────────────────────────────────────────────────┘
           [Cancel]  [Run ▶]
```

---

**Estado:** Instrucciones claras y visuales
**Dificultad:** Copiar y pegar (muy fácil)
**Tiempo:** 3 minutos máximo
