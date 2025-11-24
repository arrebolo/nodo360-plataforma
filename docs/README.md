# Documentación de Nodo360

Documentación organizada del proyecto Nodo360 - Plataforma educativa Bitcoin.

---

## 📁 Estructura

```
docs/
├── README.md (este archivo)
├── guides/          # Guías activas y documentación de referencia
├── reports/         # Reportes de auditorías y análisis
└── archive/         # Archivos históricos (fixes y fases completadas)
```

---

## 📚 Guías Activas (`/guides`)

Documentación de referencia para desarrollo y mantenimiento:

### Sistema y Configuración
- **ADMIN_PANEL_GUIDE.md** - Guía del panel de administración
- **AUTH_INTEGRATION_GUIDE.md** - Integración de autenticación con Supabase
- **IMPLEMENTATION_GUIDE.md** - Guía de implementación general
- **SCHEMA_APPLICATION.md** - Esquema de base de datos
- **STORAGE_SETUP.md** - Configuración de storage de Supabase

### Desarrollo
- **QUIZ_SYSTEM_README.md** - Sistema de quizzes y evaluaciones
- **DATA_CLEANUP_GUIDE.md** - Guía para limpieza de datos
- **DIAGNOSTIC_INSTRUCTIONS.md** - Instrucciones de diagnóstico

### Fixes y Soluciones
- **CLIENT_COMPONENTS_FIX.md** - Fix de componentes cliente
- **LESSON_RENDER_ERROR_FIX.md** - Fix de errores de renderizado
- **LESSON_SYNTAX_ERROR_FIX.md** - Fix de errores de sintaxis
- **MODULE_LOCK_FIX.md** - Fix del sistema de bloqueo de módulos
- **ROUTE_PARAMS_FIX_SUMMARY.md** - Resumen de fix de parámetros de ruta

### Base de Datos
- **README_DATABASE.md** - Documentación de base de datos

---

## 📊 Reportes (`/reports`)

Análisis, auditorías y reportes del proyecto:

### Auditorías
- **AUDIT_REPORT_COMPLETE.md** - Auditoría completa del código (Nov 2025)
- **AUDIT_REPORT_FINAL.md** - Reporte final de auditoría
- **CLEANUP_REPORT.md** - Reporte de limpieza de código (164MB liberados)
- **SYSTEM_CHECK_REPORT.md** - Verificación del sistema

### Fixes y Mejoras
- **BADGE_FIX_REPORT.md** - Reporte de fix del sistema de badges
- **LIMPIEZA_MASIVA_REPORT.md** - Reporte de limpieza masiva
- **LOGO-IMPLEMENTATION-REPORT.md** - Implementación del logo

### Recursos
- **PROMPT-MAESTRO.md** - Prompt maestro para desarrollo

---

## 📦 Archivo (`/archive`)

Documentación histórica de fases y fixes completados:

### Fases Completadas
- FASE_2_AUTENTICACION.md
- FASE-3A-*.md (3 archivos)
- FASE-3B-GAMIFICACION.md

### Fixes Aplicados
- FIX-*.md (6 archivos)
- SOLUCION-*.md (4 archivos)

### Acciones y Sistemas
- ACCION-*.md (3 archivos)
- SISTEMA-*.md (3 archivos)

### Testing y Diagnósticos
- TESTING-*.md
- DIAGNOSTICO-*.md
- CHECKLIST-*.md

### Guías y Reportes Históricos
- GUIA-*.md
- REPORTE-*.md
- RESUMEN-*.md
- PASOS-*.md

**Nota**: Estos archivos se conservan para referencia histórica pero las soluciones ya están aplicadas en el código activo.

---

## 🔍 Cómo Usar Esta Documentación

### Para Desarrolladores
1. Consulta `/guides` para documentación activa
2. Revisa `/reports` para análisis del sistema
3. Usa `/archive` solo para referencia histórica

### Para Nuevos Colaboradores
1. Empieza con **IMPLEMENTATION_GUIDE.md**
2. Lee **ADMIN_PANEL_GUIDE.md** para el panel admin
3. Consulta **README_DATABASE.md** para la estructura de datos

### Para Mantenimiento
1. **DIAGNOSTIC_INSTRUCTIONS.md** para troubleshooting
2. **DATA_CLEANUP_GUIDE.md** para limpieza periódica
3. **SYSTEM_CHECK_REPORT.md** para validaciones

---

## 📝 Convenciones

### Nombres de Archivos
- `*_GUIDE.md` - Guías de referencia
- `*_README.md` - Documentación de sistemas
- `*_FIX*.md` - Soluciones a problemas específicos
- `*_REPORT.md` - Reportes y análisis

### Actualización
- Guías activas: Mantener actualizadas
- Reportes: Añadir nuevos, conservar históricos
- Archive: No modificar (referencia histórica)

---

## 🚀 Contribuir

Al añadir nueva documentación:

1. **Guías**: Colocar en `/guides`
2. **Reportes**: Colocar en `/reports`
3. **Archivos temporales**: Mover a `/archive` una vez completados

---

**Última actualización**: 24 de Noviembre de 2025
**Mantenedor**: Equipo Nodo360
