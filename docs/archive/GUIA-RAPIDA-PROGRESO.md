# ⚡ GUÍA RÁPIDA - Sistema de Progreso

**Estado:** ✅ TODO IMPLEMENTADO

---

## 🚀 ACCIÓN REQUERIDA (1 minuto)

### PASO 1: Reiniciar Servidor
```bash
# Ctrl+C para detener
npm run dev
```

**Tiempo:** 30 segundos

---

### PASO 2: Test Manual

#### 1. Ir a una lección:
```
http://localhost:3000/cursos/bitcoin-para-principiantes/introduccion-bitcoin
```

#### 2. Verificar que aparece:
- ✅ Botón "Marcar como Completada" (naranja)
- ✅ Video de YouTube
- ✅ Contenido de la lección

#### 3. Click en "Marcar como Completada"
- ✅ Botón muestra spinner "Guardando..."
- ✅ Aparece mensaje de éxito verde
- ✅ Botón cambia a "Lección Completada" (verde)

#### 4. Volver a página del curso:
```
http://localhost:3000/cursos/bitcoin-para-principiantes
```

- ✅ Módulo 1 muestra progreso (Ej: "14% completado")
- ✅ Lección completada tiene check verde

---

## 🔍 VERIFICAR EN CONSOLE (F12)

### Logs esperados:

**Al cargar lección:**
```
✅ [LessonPage] Lección encontrada: ...
🔍 [LessonPage] Progreso del usuario: { isCompleted: false }
```

**Al completar:**
```
🔍 [CompleteLessonButton] Marcando como completada...
✅ [API POST /progress] Progreso guardado
✅ [CompleteLessonButton] Lección completada
```

**Al volver al curso:**
```
✅ [ModuleListEnhanced] Progreso cargado desde Supabase: 1
```

---

## 🐛 SI ALGO FALLA

### Opción 1: Ejecutar Diagnóstico
```bash
npx tsx scripts/diagnose-progress-system.ts
```

**Debe mostrar:**
```
✅ Tabla user_progress existe
✅ API de progreso existe
✅ Componente CompleteLessonButton existe
🎯 RESULTADO: B o C
```

### Opción 2: Verificar Base de Datos

**En Supabase SQL Editor:**
```sql
SELECT * FROM user_progress ORDER BY completed_at DESC LIMIT 5;
```

**Debe retornar:**
- Filas con `is_completed = true`
- `user_id` y `lesson_id` correctos

---

## 📊 RESULTADO ESPERADO

| Acción | Antes | Después |
|--------|-------|---------|
| Página lección | Sin botón | Botón visible ✅ |
| Click completar | N/A | Guarda en BD ✅ |
| Volver al curso | 0% progreso | X% progreso ✅ |
| Módulos | Todos bloqueados | Progresivo desbloqueo ✅ |

---

## 📁 DOCUMENTACIÓN COMPLETA

Ver: **SISTEMA-PROGRESO-LECCIONES.md**

---

**Tiempo total:** 2 minutos
**Estado:** ✅ LISTO PARA TESTING

**Próximo paso:** Reiniciar servidor y probar en navegador
