# 🔄 Guía de Migración de Contenido

## Resumen

Esta guía documenta el proceso de migración de contenido desde **nodo360-cursos** (proyecto antiguo) hacia **nodo360-plataforma** (proyecto nuevo con Supabase).

---

## 📋 Contenido a Migrar

### Cursos Disponibles

1. **Bitcoin Desde Cero** (15 lecciones)
   - Módulo 1: 5 lecciones
   - Módulo 2: 3 lecciones
   - Módulo 3: 2 lecciones (estimado)

2. **Tu Primera Wallet** (13 lecciones)
   - Módulo 1: ? lecciones
   - Módulo 2: ? lecciones
   - Módulo 3: ? lecciones
   - Módulo 4: ? lecciones

3. **Fundamentos de Blockchain** (12 lecciones)
   - Módulo 1: ? lecciones
   - Módulo 2: ? lecciones
   - Módulo 3: ? lecciones

**TOTAL**: ~40 lecciones

---

## 🛠️ Scripts Creados

### 1. `migrate-content-from-cursos.ts`

**Propósito**: Script principal que realiza la migración completa

**Funcionalidades**:
- Lee estructura de carpetas de nodo360-cursos
- Extrae metadata de archivos TSX
- Crea registros en Supabase (courses, modules, lessons)
- Genera estadísticas de migración
- Manejo de errores robusto

**Uso**:
```bash
npx tsx scripts/migrate-content-from-cursos.ts
```

### 2. `verify-migration.ts`

**Propósito**: Verificación antes y después de la migración

**Modos**:
- `pre`: Verifica que todo esté listo para migrar
- `post`: Verifica que la migración fue exitosa

**Uso**:
```bash
# Antes de migrar
npx tsx scripts/verify-migration.ts pre

# Después de migrar
npx tsx scripts/verify-migration.ts post
```

---

## 🚀 Proceso de Migración

### PASO 1: Preparación

1. **Verificar .env.local**:
   ```bash
   # Debe contener:
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=tu-service-key
   ```

2. **Instalar dependencia** (si no está):
   ```bash
   npm install dotenv
   ```

3. **Verificar directorio de origen**:
   - Ruta: `C:\Users\alber\nodo360-projects\nodo360-cursos\nodo360-cursos-main\app\cursos`
   - Debe existir y contener carpetas: `bitcoin-desde-cero`, `primera-wallet`, `fundamentos-blockchain`

### PASO 2: Verificación Pre-Migración

```bash
npx tsx scripts/verify-migration.ts pre
```

**Checklist automático**:
- ✅ Variables de entorno configuradas
- ✅ Conexión a Supabase funcional
- ✅ Tablas existen (courses, modules, lessons)
- ✅ Directorio de origen encontrado
- ✅ Conteo de lecciones disponibles

**Si TODO es ✅**: Continuar al PASO 3
**Si hay ❌**: Corregir errores antes de continuar

### PASO 3: Ejecutar Migración

```bash
npx tsx scripts/migrate-content-from-cursos.ts
```

**Progreso esperado**:
```
🚀 INICIANDO MIGRACIÓN DE CONTENIDO
=====================================

📡 Verificando conexión a Supabase...
✅ Conexión exitosa

📚 Migrando curso: Bitcoin Desde Cero
──────────────────────────────────────────────────
✅ Curso creado: uuid-xxx
📝 Encontradas 15 lecciones
  ✅ Módulo 1 creado
    ✅ Lección 1.1: ¿Qué es Bitcoin?
    ✅ Lección 1.2: Historia del Dinero
    ...
  ✅ Módulo 2 creado
    ...

📚 Migrando curso: Tu Primera Wallet
...

📊 RESUMEN DE MIGRACIÓN
=======================
✅ Cursos creados: 3
✅ Módulos creados: 10
✅ Lecciones creadas: 40

✨ Migración completada!
```

### PASO 4: Verificación Post-Migración

```bash
npx tsx scripts/verify-migration.ts post
```

**Verificaciones**:
- ✅ Cursos en base de datos
- ✅ Módulos vinculados correctamente
- ✅ Lecciones vinculadas correctamente
- ✅ No hay registros huérfanos
- ✅ Conteos coinciden con lo esperado

### PASO 5: Verificación Manual en Supabase

1. **Ir a Supabase Dashboard** → Table Editor

2. **Ejecutar queries de verificación**:

```sql
-- Contar registros
SELECT COUNT(*) as total FROM courses;
SELECT COUNT(*) as total FROM modules;
SELECT COUNT(*) as total FROM lessons;

-- Ver distribución por curso
SELECT
  c.title as curso,
  COUNT(DISTINCT m.id) as modulos,
  COUNT(l.id) as lecciones
FROM courses c
LEFT JOIN modules m ON m.course_id = c.id
LEFT JOIN lessons l ON l.module_id = m.id
GROUP BY c.id, c.title;

-- Ver lecciones del primer curso
SELECT
  c.title as curso,
  m.title as modulo,
  l.title as leccion,
  l.slug,
  l.order_index
FROM courses c
JOIN modules m ON m.course_id = c.id
JOIN lessons l ON l.module_id = m.id
WHERE c.slug = 'bitcoin-desde-cero'
ORDER BY l.order_index;
```

---

## 📊 Estructura de Datos Migrada

### Tabla: `courses`

```typescript
{
  id: UUID,
  slug: string,           // 'bitcoin-desde-cero'
  title: string,          // 'Bitcoin Desde Cero'
  description: string,
  level: 'beginner' | 'intermediate' | 'advanced',
  category: 'bitcoin' | 'blockchain' | ...,
  status: 'published',
  is_free: true,
  is_premium: false,
  price: 0
}
```

### Tabla: `modules`

```typescript
{
  id: UUID,
  course_id: UUID,        // FK to courses
  title: string,          // 'Módulo 1'
  description: string,
  order_index: number,    // 1, 2, 3...
  slug: string            // 'modulo-1'
}
```

### Tabla: `lessons`

```typescript
{
  id: UUID,
  module_id: UUID,           // FK to modules
  title: string,             // '¿Qué es Bitcoin?'
  description: string,
  slug: string,              // 'leccion-1-1'
  order_index: number,       // 11, 12, 21, 22... (módulo*10 + lección)
  content: string,           // TSX completo del archivo original
  video_duration_minutes: 10,
  is_free_preview: boolean   // true para primera lección
}
```

---

## ⚠️ Problemas Conocidos y Soluciones

### Problema: "Carpeta no encontrada"

**Causa**: Ruta incorrecta en el script
**Solución**: Editar `migrate-content-from-cursos.ts` línea ~30:
```typescript
const CURSOS_DIR = 'C:\\Users\\alber\\nodo360-projects\\nodo360-cursos\\nodo360-cursos-main\\app\\cursos'
```

### Problema: "Variables de entorno no encontradas"

**Causa**: `.env.local` no existe o está mal configurado
**Solución**:
1. Copiar `.env.example` a `.env.local`
2. Rellenar con valores reales de Supabase
3. Reiniciar terminal

### Problema: "Error de conexión a Supabase"

**Causa**: URL o key incorrectos
**Solución**:
1. Ir a Supabase → Settings → API
2. Copiar `URL` y `service_role key` (no anon key)
3. Actualizar `.env.local`

### Problema: "Lecciones duplicadas"

**Causa**: Script ejecutado múltiples veces
**Solución**:
- El script usa `upsert` con `onConflict`, debe actualizar en lugar de duplicar
- Si hay duplicados, limpiar en Supabase y re-ejecutar

---

## 🔄 Re-ejecutar Migración

Si necesitas volver a migrar (después de errores o cambios):

```bash
# Opción 1: Limpiar tablas manualmente en Supabase
DELETE FROM lessons;
DELETE FROM modules;
DELETE FROM courses;

# Opción 2: Dejar que el script actualice (gracias a upsert)
npx tsx scripts/migrate-content-from-cursos.ts
```

---

## ✅ Checklist de Éxito

### Pre-Migración
- [ ] .env.local configurado
- [ ] Supabase accesible
- [ ] Directorio de origen confirmado
- [ ] verify-migration.ts pre → TODO ✅

### Durante Migración
- [ ] No errores fatales
- [ ] Todos los cursos procesados
- [ ] Estadísticas coherentes

### Post-Migración
- [ ] verify-migration.ts post → TODO ✅
- [ ] Queries en Supabase muestran datos
- [ ] Navegación en /cursos funciona
- [ ] Lecciones accesibles

---

## 📈 Próximos Pasos

Después de una migración exitosa:

1. **Verificar frontend**:
   ```bash
   npm run dev
   # Visitar http://localhost:3000/cursos
   ```

2. **Probar navegación**:
   - Lista de cursos
   - Detalle de curso
   - Lecciones individuales

3. **Convertir contenido TSX a JSON** (futuro):
   - Parsear el campo `content` actual
   - Convertir a schema JSON moderno
   - Actualizar tabla lessons

4. **Deploy**:
   ```bash
   vercel --prod
   ```

---

## 🆘 Soporte

Si encuentras problemas:

1. Revisar logs del script
2. Verificar errores en Supabase Dashboard → Logs
3. Ejecutar verify-migration.ts post para diagnóstico
4. Consultar esta documentación

---

**Última actualización**: 14 de Noviembre, 2025
**Autor**: Claude (Anthropic)
**Proyecto**: Nodo360 Plataforma
