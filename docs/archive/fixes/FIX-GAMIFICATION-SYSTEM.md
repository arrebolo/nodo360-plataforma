# 🎮 FIX: Sistema de Gamificación NO Aplicado - Nodo360

## 🔍 Problema Identificado

**Síntoma:** Usuario completó 19 lecciones pero NO ganó XP ni badges.

**Causa Raíz:** La migración `004_gamification_system.sql` **NO se aplicó** en Supabase.

**Evidencia:**
```
❌ Error: Could not find the 'current_streak' column of 'user_gamification_stats'
           in the schema cache
```

## 🎯 Causa Raíz Técnica

El sistema de gamificación tiene un **trigger automático** que otorga XP al completar lecciones:

```sql
CREATE TRIGGER trigger_award_xp_lesson
  AFTER INSERT OR UPDATE ON public.user_progress
  FOR EACH ROW
  EXECUTE FUNCTION award_xp_on_lesson_complete();
```

**PERO:** Este trigger solo existe si se aplica la migración `004_gamification_system.sql`.

## ✅ Solución (5 minutos)

### Paso 1: Aplicar Migración de Gamificación

1. **Abrir Supabase Dashboard**
   - Ve a: https://supabase.com/dashboard
   - Selecciona tu proyecto
   - Click en **"SQL Editor"** en el menú lateral

2. **Ejecutar la migración completa**
   - Abre el archivo: `supabase/migrations/004_gamification_system.sql`
   - Copia **TODO** el contenido (426 líneas)
   - Pégalo en el SQL Editor
   - Click en **"Run"** (▶️)

3. **Verificar ejecución exitosa**
   - Deberías ver mensajes de éxito en verde
   - Si hay errores de "already exists", está bien (significa que parte ya existe)

### Paso 2: Inicializar Stats para Usuarios Existentes

Después de aplicar la migración:

```bash
npx tsx scripts/initialize-gamification-for-existing-users.ts
```

**Resultado esperado:**
```
✅ PROCESO COMPLETADO
   Usuarios procesados: 3

👤 albertonunezdiaz@gmail.com
   📚 Lecciones completadas: 19
   ✅ XP total otorgado: 190
   📊 Stats actualizadas:
      Total XP: 195
      Nivel: 2
      Badges: 2
   🏅 Badges desbloqueados:
      🎯 Primer Paso
      📚 Aprendiz
```

### Paso 3: Verificar en Dashboard

1. Ir a `/dashboard` en la aplicación
2. La sección "🎮 Tu Progreso y Logros" debe mostrar:
   - Total XP (ej: 195 XP)
   - Nivel actual (ej: Nivel 2)
   - Badges desbloqueados

## 🔬 Verificación del Sistema

Para verificar que todo funciona:

```bash
npx tsx scripts/verify-gamification-system.ts
```

**Resultado esperado:**
```
✅ Tabla user_gamification_stats: Existe y es accesible
✅ Tabla xp_events: Existe y es accesible
✅ Tabla badges: Existe y es accesible
✅ Tabla user_badges: Existe y es accesible

✅ Badges encontrados: 14

✅ Stats del usuario:
   Total XP: 195
   Nivel: 2
   XP para siguiente nivel: 55
   Total badges: 2
   Racha actual: 0 días
   Racha más larga: 0 días

✅ SISTEMA DE GAMIFICACIÓN FUNCIONANDO CORRECTAMENTE
   - 195 XP ganado
   - 19 eventos registrados
   - 2 badges desbloqueados
```

## 📋 Cómo Funciona el Sistema (Automático)

Una vez aplicada la migración, el sistema funciona **completamente automático**:

### 1. Usuario completa lección
```typescript
// En el frontend
POST /api/progress
Body: { lessonId: "xxx" }
```

### 2. API guarda progreso
```typescript
// app/api/progress/route.ts
supabase.from('user_progress').upsert({
  user_id: user.id,
  lesson_id: lessonId,
  is_completed: true
})
```

### 3. Trigger otorga XP automáticamente
```sql
-- Trigger en Supabase (se ejecuta automáticamente)
INSERT INTO xp_events (user_id, event_type, xp_earned, related_id)
VALUES (user.id, 'lesson_completed', 10, lessonId)
```

### 4. Trigger actualiza stats
```sql
-- Otro trigger actualiza user_gamification_stats
UPDATE user_gamification_stats
SET total_xp = total_xp + 10,
    current_level = calculate_level_from_xp(total_xp + 10),
    xp_to_next_level = calculate_xp_to_next_level(...)
```

### 5. Trigger verifica y otorga badges
```sql
-- Otro trigger verifica requisitos y otorga badges
PERFORM check_and_award_badges(user_id)
```

### 6. Frontend consulta stats actualizadas
```typescript
// Componentes de gamificación
GET /api/gamification/stats
```

## 🎁 Badges Disponibles

### Por Lecciones Completadas
- 🎯 **Primer Paso** - 1 lección → +5 XP
- 📚 **Aprendiz** - 10 lecciones → +25 XP
- 📖 **Estudioso** - 50 lecciones → +50 XP
- 🧙 **Sabio** - 100 lecciones → +100 XP

### Por Cursos Completados
- 🎓 **Graduado** - 1 curso → +50 XP
- 💎 **Dedicado** - 3 cursos → +150 XP
- ⭐ **Experto** - 5 cursos → +300 XP

### Por Racha de Estudio
- 🔥 **Racha Semanal** - 7 días → +75 XP
- 🌟 **Racha Mensual** - 30 días → +200 XP
- 💫 **Racha Centenaria** - 100 días → +500 XP

### Por Nivel
- 🥉 **Nivel 5** - 400 XP total
- 🥈 **Nivel 10** - 1400 XP total
- 🥇 **Nivel 20** - 4400 XP total

## 📊 Sistema de Niveles

| Nivel | XP Requerido | XP Total Acumulado |
|-------|--------------|-------------------|
| 1     | 0            | 0                 |
| 2     | 100          | 100               |
| 3     | 150          | 250               |
| 4     | 200          | 450               |
| 5     | 250          | 700               |
| 10    | ...          | 1,400             |
| 20    | ...          | 4,400             |

Fórmula: `XP por nivel = 100 + ((nivel - 1) * 50)`

## 🐛 Debugging

Si después de aplicar la migración no funciona:

### 1. Verificar triggers existen
```sql
-- En Supabase SQL Editor
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('user_progress', 'xp_events', 'users')
ORDER BY event_object_table, trigger_name;
```

**Deberías ver:**
- `trigger_award_xp_lesson` en `user_progress`
- `trigger_update_stats_on_xp` en `xp_events`
- `trigger_check_badges` en `xp_events`
- `trigger_create_user_stats` en `users`

### 2. Probar manualmente
```sql
-- Insertar evento de XP manualmente
INSERT INTO xp_events (user_id, event_type, xp_earned, related_id, description)
VALUES (
  'tu-user-id-aqui',
  'test',
  10,
  NULL,
  'Prueba manual'
);

-- Verificar que stats se actualizaron
SELECT * FROM user_gamification_stats WHERE user_id = 'tu-user-id-aqui';
```

### 3. Ver logs en tiempo real
```bash
# Terminal 1: Servidor en desarrollo
npm run dev

# Terminal 2: Completar una lección
# Logs deberían mostrar:
# ✅ [API POST /progress] Progreso guardado correctamente
```

## ⚠️ Notas Importantes

1. **El sistema es retroactivo:** Usuarios con lecciones completadas anteriormente recibirán XP al ejecutar el script de inicialización.

2. **No duplica XP:** El trigger verifica que sea la primera vez que completa la lección antes de otorgar XP.

3. **Badges se verifican automáticamente:** Cada vez que se gana XP, el sistema verifica si se desbloquearon nuevos badges.

4. **Stats se crean automáticamente:** Para nuevos usuarios, el trigger las crea al registrarse.

## ✅ Checklist Final

- [ ] Migración `004_gamification_system.sql` ejecutada en Supabase
- [ ] Badges aparecen en tabla (verificar con script)
- [ ] Stats inicializadas para usuarios existentes
- [ ] XP retroactivo otorgado (script de inicialización)
- [ ] Dashboard muestra XP y badges
- [ ] Completar nueva lección otorga +10 XP
- [ ] Badges se desbloquean automáticamente

## 🎉 Resultado Final

Después de aplicar la solución:

```
👤 Usuario: albertonunezdiaz@gmail.com
📚 Lecciones completadas: 19
✨ XP Total: 195 XP (19 lecciones × 10 XP + badges)
🎯 Nivel: 2
🏅 Badges: 2 desbloqueados
   🎯 Primer Paso
   📚 Aprendiz
```

**Cada nueva lección completada automáticamente otorgará +10 XP y verificará badges nuevos.**

---

**Tiempo estimado de solución:** 5-10 minutos
**Dificultad:** Media ⭐⭐
**Requiere:** Acceso a Supabase Dashboard + Ejecutar scripts localmente
