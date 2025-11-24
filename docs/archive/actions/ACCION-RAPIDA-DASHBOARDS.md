# ⚡ ACCIÓN RÁPIDA: Dashboards Vacíos Corregidos

## 🚨 PROBLEMA SOLUCIONADO

**Error:** Query del panel de admin intentaba join directo `courses → lessons` que NO EXISTE.

**Causa:** No hay FK directa entre courses y lessons (solo a través de modules).

---

## ✅ CORRECCIÓN APLICADA

Archivo modificado: `app/admin/cursos/page.tsx`

**Cambio:** Ahora hace `courses → modules → lessons` (ruta correcta)

---

## 🚀 ACCIÓN REQUERIDA (1 PASO)

### Refrescar Navegador

```
Ctrl + Shift + R (forzar recarga)
```

---

## ✅ VERIFICACIÓN (30 segundos)

### 1. Panel Admin: `/admin/cursos`

**Debe mostrar:**
```
Total Cursos: 6
Total Módulos: 17
Total Lecciones: 52
Total Inscritos: 2
```

Grid con 6 tarjetas de cursos ✅

---

### 2. Dashboard Usuario: `/dashboard`

**Debe mostrar:**
```
🎯 Continúa tu aprendizaje
- Introducción a las Criptomonedas
- Bitcoin para Principiantes

Cursos activos: 2
```

---

## 🐛 SI NO FUNCIONA

### Opción 1: Ejecutar script de diagnóstico
```bash
npx tsx scripts/verify-database-state.ts
```

**Debe mostrar:**
- ✅ 6 cursos
- ✅ 17 módulos
- ✅ 52 lecciones
- ✅ 2 inscripciones

---

### Opción 2: Verificar logs en console

**Buscar:**
- ✅ "[Admin Courses] Cursos cargados: 6"
- ✅ "[Dashboard] Inscripciones encontradas: 2"

**NO debe aparecer:**
- ❌ "Could not find a relationship"
- ❌ "PGRST200"

---

## 📊 RESULTADO ESPERADO

| Pantalla | Antes | Después |
|----------|-------|---------|
| Panel Admin | 0 cursos | 6 cursos |
| Dashboard | 0 inscritos | 2 inscritos |
| Stats Admin | Todos 0 | Datos reales |

---

## 📄 DOCUMENTACIÓN COMPLETA

Ver: `SOLUCION-DASHBOARDS-VACIOS.md` para detalles técnicos.

---

**Tiempo:** 30 segundos (solo refresh)
**Estado:** ✅ LISTO
**Acción:** Refrescar navegador
