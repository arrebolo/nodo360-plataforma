# Backup Sistema de Mentoria Nodo360

**Fecha de backup:** 2025-12-01

## Contenido

### Base de Datos (12 tablas)
- `educators` - Perfiles de instructores y mentores
- `specialties` - Especialidades (Bitcoin, Trading, DeFi, etc.)
- `educator_specialties` - Especialidades verificadas por examen
- `educator_exams` - Historial de examenes de capacidad
- `educator_achievements` - Logros y reconocimientos
- `educator_availability` - Horarios disponibles
- `educator_promotions` - Historial de promociones/degradaciones
- `mentorship_sessions` - Sesiones de mentoria
- `session_reviews` - Valoraciones de alumnos
- `session_notes` - Notas privadas del alumno
- `user_credits` - Balance de creditos
- `credit_transactions` - Historial de transacciones

### APIs (9 endpoints)
- `/api/mentorship/educators` - GET, POST
- `/api/mentorship/educators/[slug]` - GET, PUT
- `/api/mentorship/specialties` - GET
- `/api/mentorship/sessions` - GET, POST
- `/api/mentorship/sessions/[id]` - GET, PUT
- `/api/mentorship/sessions/[id]/review` - POST
- `/api/mentorship/sessions/[id]/notes` - GET, POST
- `/api/mentorship/availability` - GET, POST, DELETE
- `/api/mentorship/credits` - GET

### Paginas Publicas
- `/formadores` - Busqueda unificada con filtros
- `/formadores/[slug]` - Perfil del formador
- `/instructores` - Listado de instructores
- `/mentores` - Listado de mentores

### Panel del Alumno
- `/dashboard/mis-sesiones` - Lista de sesiones
- `/dashboard/mis-sesiones/[id]` - Detalle de sesion
- `/dashboard/ser-formador` - Aplicar como instructor

### Panel del Formador
- `/dashboard/formador` - Panel principal
- `/dashboard/formador/sesiones` - Gestion de sesiones
- `/dashboard/formador/sesiones/[id]` - Detalle de sesion
- `/dashboard/formador/disponibilidad` - Configurar horarios
- `/dashboard/formador/perfil` - Editar perfil

### Admin
- `/admin/formadores` - Lista de formadores
- `/admin/formadores/[id]` - Gestion individual
- `/admin/formadores/solicitudes` - Solicitudes pendientes
- `/admin/formadores/promociones` - Promover a mentor

## Estilo Web3 Nodo360
- Fondo: bg-[#070a10]
- Primario: #ff6b35 / #f7931a
- Cards: bg-white/5 border-white/10 backdrop-blur rounded-xl
- Hover: -translate-y-1 shadow-lg
- Badge Instructor: bg-blue-500/20 text-blue-400
- Badge Mentor: bg-amber-500/20 text-amber-400

## Restaurar

Para restaurar este backup:
1. Copiar sql/mentorship-schema.sql y ejecutar en Supabase
2. Copiar contenido de api/ a app/api/
3. Copiar contenido de pages/ a las rutas correspondientes en app/
