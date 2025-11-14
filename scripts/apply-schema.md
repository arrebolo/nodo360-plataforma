# Guía: Aplicar Schema SQL a Supabase

## ⚠️ IMPORTANTE
El schema debe aplicarse desde el Supabase Dashboard ya que contiene operaciones DDL que requieren privilegios de administrador.

---

## 📋 Pasos para Aplicar el Schema

### 1. Accede a Supabase Dashboard
- URL: https://supabase.com/dashboard
- Selecciona tu proyecto: `gcahtbecfidroepelcuw`

### 2. Abre el SQL Editor
- En el menú lateral izquierdo, haz clic en **"SQL Editor"**
- Haz clic en **"New query"**

### 3. Copia el Schema
- Abre el archivo: `supabase/schema.sql`
- Selecciona TODO el contenido (Ctrl+A)
- Copia (Ctrl+C)

### 4. Pega y Ejecuta
- Pega el contenido en el editor SQL de Supabase (Ctrl+V)
- Haz clic en **"Run"** (o presiona Ctrl+Enter)
- Espera a que se complete (puede tomar 10-20 segundos)

### 5. Verificación
Después de ejecutar, deberías ver:
- ✅ Mensaje de éxito
- ✅ "Query executed successfully"

---

## 🔍 Verificar Tablas Creadas

### Ve a "Table Editor"
Deberías ver estas 7 tablas:

1. ✅ **users** - Perfiles de usuario
2. ✅ **courses** - Cursos
3. ✅ **modules** - Módulos
4. ✅ **lessons** - Lecciones
5. ✅ **user_progress** - Progreso
6. ✅ **bookmarks** - Marcadores
7. ✅ **notes** - Notas

---

## 🔐 Lo que se creó automáticamente

### Extensiones
- `uuid-ossp` - Generación de UUIDs
- `pg_trgm` - Búsqueda full-text

### Custom Types
- `user_role` - student, instructor, admin
- `course_level` - beginner, intermediate, advanced
- `course_status` - draft, published, archived

### Seguridad
- Row Level Security (RLS) habilitado en todas las tablas
- 21 políticas de seguridad configuradas

### Triggers
- `update_updated_at` - Actualiza timestamps automáticamente
- `handle_new_user` - Crea perfil al registrar usuario

### Índices
- Índices optimizados para queries frecuentes
- Índices full-text para búsqueda en español

---

## ✅ Siguiente Paso: Crear Primer Usuario

Una vez aplicado el schema, crea tu primer usuario:

### Opción 1: Desde Dashboard
```
1. Ve a Authentication → Users
2. Click "Add user"
3. Email: tu@email.com
4. Password: (genera una segura)
5. El trigger creará automáticamente el perfil
```

### Opción 2: Programáticamente
```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

const { data, error } = await supabase.auth.signUp({
  email: 'tu@email.com',
  password: 'tu-password-seguro',
  options: {
    data: {
      full_name: 'Tu Nombre Completo',
    }
  }
})
```

---

## 🚨 Si hay Errores

### Error: "relation already exists"
**Solución:** Las tablas ya existen. Puedes:
- Ignorar el error (las tablas ya están creadas)
- O eliminar las tablas existentes primero (DROP TABLE)

### Error: "permission denied"
**Solución:** Asegúrate de estar autenticado en Supabase Dashboard como owner del proyecto.

### Error: "syntax error"
**Solución:** Verifica que copiaste TODO el contenido del archivo schema.sql

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs en Supabase Dashboard
2. Verifica que el schema.sql esté completo
3. Intenta ejecutar el script en secciones más pequeñas

---

**Última actualización:** Noviembre 2024
