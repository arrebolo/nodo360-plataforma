# Sistema de Captura de Leads - Nodo360

Sistema completo para capturar, validar y almacenar leads de mentoría y suscriptores del newsletter.

## 📋 Índice

1. [Visión General](#visión-general)
2. [Arquitectura](#arquitectura)
3. [Base de Datos](#base-de-datos)
4. [API Endpoints](#api-endpoints)
5. [Componentes](#componentes)
6. [Uso](#uso)
7. [Consultar Leads](#consultar-leads)
8. [Integración con Email Marketing](#integración-con-email-marketing)

## Visión General

El sistema de leads captura dos tipos de información:

1. **Solicitudes de Mentoría**: Usuarios interesados en mentoría 1-on-1
2. **Suscriptores de Newsletter**: Usuarios que quieren recibir actualizaciones

### Características

- ✅ Validación robusta (frontend + backend)
- ✅ Feedback visual inmediato
- ✅ Almacenamiento en Supabase
- ✅ Prevención de duplicados en newsletter
- ✅ Estados de seguimiento para solicitudes
- ✅ TypeScript types completos
- ✅ Manejo de errores

## Arquitectura

```
┌─────────────────┐
│   Componentes   │
│  (Frontend UI)  │
└────────┬────────┘
         │
         │ HTTP POST
         ↓
┌─────────────────┐
│  API Routes     │
│  /api/mentorship│
│  /api/newsletter│
└────────┬────────┘
         │
         │ Supabase Client
         ↓
┌─────────────────┐
│    Supabase     │
│   PostgreSQL    │
└─────────────────┘
```

## Base de Datos

### Tabla: `mentorship_requests`

Almacena solicitudes de mentoría 1-on-1.

```sql
CREATE TABLE mentorship_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  goal TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Campos:**

- `id`: UUID único generado automáticamente
- `full_name`: Nombre completo del solicitante
- `email`: Email de contacto
- `goal`: Objetivo principal (seleccionado de lista predefinida)
- `message`: Mensaje adicional opcional
- `status`: Estado de la solicitud
  - `pending`: Nueva solicitud sin contactar
  - `contacted`: Ya se contactó al usuario
  - `scheduled`: Sesión agendada
  - `completed`: Proceso completado
- `created_at`: Timestamp de creación
- `updated_at`: Timestamp de última actualización

**Índices:**
- `idx_mentorship_email`: En campo `email` para búsquedas rápidas
- `idx_mentorship_status`: En campo `status` para filtrar por estado

### Tabla: `newsletter_subscribers`

Almacena suscriptores del newsletter.

```sql
CREATE TABLE newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);
```

**Campos:**

- `id`: UUID único generado automáticamente
- `email`: Email del suscriptor (UNIQUE)
- `name`: Nombre opcional del suscriptor
- `subscribed_at`: Timestamp de suscripción
- `is_active`: Indica si la suscripción está activa

**Índices:**
- `idx_newsletter_email`: En campo `email` para búsquedas rápidas
- `idx_newsletter_active`: En campo `is_active` para filtrar activos

**Nota:** El campo `email` es UNIQUE, lo que previene duplicados automáticamente.

## API Endpoints

### POST `/api/mentorship`

Crea una nueva solicitud de mentoría.

**Request Body:**
```json
{
  "full_name": "Juan Pérez",
  "email": "juan@example.com",
  "goal": "Conseguir trabajo en blockchain",
  "message": "Tengo experiencia en JavaScript..."
}
```

**Validaciones:**
- `full_name`: Requerido
- `email`: Requerido, formato válido
- `goal`: Requerido
- `message`: Opcional

**Response Success (201):**
```json
{
  "success": true,
  "message": "Solicitud enviada correctamente",
  "data": {
    "id": "uuid...",
    "full_name": "Juan Pérez",
    "email": "juan@example.com",
    "goal": "Conseguir trabajo en blockchain",
    "message": "Tengo experiencia en JavaScript...",
    "status": "pending",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z"
  }
}
```

**Response Error (400):**
```json
{
  "error": "Campos requeridos faltantes"
}
```

**Response Error (500):**
```json
{
  "error": "Error al guardar solicitud"
}
```

### POST `/api/newsletter`

Suscribe un email al newsletter.

**Request Body:**
```json
{
  "email": "maria@example.com",
  "name": "María García"  // opcional
}
```

**Validaciones:**
- `email`: Requerido, formato válido
- `name`: Opcional

**Comportamiento:**
- Si el email ya existe, actualiza el registro (UPSERT)
- Marca `is_active = true` automáticamente

**Response Success (201):**
```json
{
  "success": true,
  "message": "¡Suscripción exitosa!",
  "data": {
    "id": "uuid...",
    "email": "maria@example.com",
    "name": "María García",
    "subscribed_at": "2025-01-15T10:30:00Z",
    "is_active": true
  }
}
```

**Response Error (400):**
```json
{
  "error": "Email requerido"
}
```

**Response Error (500):**
```json
{
  "error": "Error al suscribirse"
}
```

## Componentes

### `MentorshipSection` (`components/home/MentorshipSection.tsx`)

Sección completa de mentoría con formulario integrado.

**Características:**
- Formulario con campos: nombre, email, objetivo, mensaje
- Validación en tiempo real
- Estados de carga y feedback visual
- Integrado con API `/api/mentorship`

**Uso:**
```tsx
import { MentorshipSection } from '@/components/home/MentorshipSection'

export default function Page() {
  return <MentorshipSection />
}
```

### `NewsletterForm` (`components/common/NewsletterForm.tsx`)

Componente reutilizable para suscripción al newsletter.

**Props:**
```typescript
interface NewsletterFormProps {
  variant?: 'inline' | 'card'  // Estilo del formulario
  showName?: boolean            // Mostrar campo de nombre
  className?: string            // Clases CSS adicionales
}
```

**Variantes:**

1. **Inline**: Formulario horizontal compacto
```tsx
<NewsletterForm variant="inline" />
```

2. **Card**: Formulario tipo tarjeta con más información
```tsx
<NewsletterForm variant="card" showName />
```

**Características:**
- 2 variantes de diseño
- Campo de nombre opcional
- Validación en tiempo real
- Estados de carga y feedback visual
- Prevención de doble submit
- Integrado con API `/api/newsletter`

**Ejemplo de uso en Footer:**
```tsx
import { NewsletterForm } from '@/components/common'

export default function Footer() {
  return (
    <footer>
      {/* ... otro contenido ... */}
      <div className="newsletter-section">
        <h3>Suscríbete a nuestro Newsletter</h3>
        <NewsletterForm variant="inline" />
      </div>
    </footer>
  )
}
```

## Uso

### 1. Ejecutar las Migraciones SQL

Primero, ejecuta el script SQL para crear las tablas:

```bash
# En el panel SQL de Supabase Dashboard
# Copia y pega el contenido de: sql/create-leads-tables.sql
```

O usa el CLI de Supabase:

```bash
supabase db push
```

### 2. Verificar las Tablas

En Supabase Dashboard:
1. Ve a Table Editor
2. Verifica que existan:
   - `mentorship_requests`
   - `newsletter_subscribers`

### 3. Usar los Componentes

**Para Mentoría:**
```tsx
// En tu página
import { MentorshipSection } from '@/components/home/MentorshipSection'

export default function HomePage() {
  return (
    <main>
      <MentorshipSection />
    </main>
  )
}
```

**Para Newsletter:**
```tsx
// En footer, sidebar, o cualquier componente
import { NewsletterForm } from '@/components/common'

export default function Sidebar() {
  return (
    <aside>
      <NewsletterForm variant="card" showName />
    </aside>
  )
}
```

## Consultar Leads

### En Supabase Dashboard

1. Ve a **Table Editor**
2. Selecciona la tabla deseada
3. Visualiza y filtra los registros

### Filtrar por Estado (Mentorship)

```sql
-- Solicitudes pendientes
SELECT * FROM mentorship_requests
WHERE status = 'pending'
ORDER BY created_at DESC;

-- Solicitudes del último mes
SELECT * FROM mentorship_requests
WHERE created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;
```

### Estadísticas

```sql
-- Total de solicitudes por estado
SELECT status, COUNT(*) as total
FROM mentorship_requests
GROUP BY status;

-- Total de suscriptores activos
SELECT COUNT(*) as total_active
FROM newsletter_subscribers
WHERE is_active = true;

-- Nuevos suscriptores esta semana
SELECT COUNT(*) as this_week
FROM newsletter_subscribers
WHERE subscribed_at >= NOW() - INTERVAL '7 days';
```

## Integración con Email Marketing

### Exportar Emails para Mailchimp/SendGrid/etc.

```sql
-- Exportar emails de newsletter activos
SELECT email, name, subscribed_at
FROM newsletter_subscribers
WHERE is_active = true
ORDER BY subscribed_at DESC;

-- Exportar como CSV (en Supabase Dashboard)
-- Table Editor → Export → CSV
```

### Sincronización Automática (Futuro)

Para automatizar el envío de emails, considera:

1. **Supabase Functions**: Triggers que se ejecutan al insertar nuevos leads
2. **Webhooks**: Notificar a servicios externos (Zapier, Make.com)
3. **Cron Jobs**: Sincronización periódica con plataforma de email

**Ejemplo de Webhook (conceptual):**

```typescript
// supabase/functions/notify-new-subscriber/index.ts
export async function handler(req: Request) {
  const { email, name } = await req.json()

  // Enviar a Mailchimp
  await fetch('https://api.mailchimp.com/3.0/lists/LIST_ID/members', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MAILCHIMP_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email_address: email,
      status: 'subscribed',
      merge_fields: {
        FNAME: name
      }
    })
  })
}
```

## Próximos Pasos

### Mejoras Sugeridas

1. **Email de Confirmación**
   - Enviar email automático al recibir solicitud de mentoría
   - Email de bienvenida al suscribirse al newsletter

2. **Dashboard de Administración**
   - Panel para gestionar solicitudes de mentoría
   - Actualizar estados (pending → contacted → scheduled)
   - Estadísticas y métricas

3. **Automatización**
   - Webhook al recibir nueva solicitud
   - Integración con CRM (HubSpot, Salesforce)
   - Auto-respuestas configurables

4. **Analytics**
   - Tasa de conversión de formularios
   - Origen de leads (UTM tracking)
   - A/B testing de formularios

## Soporte

Para problemas o preguntas:

1. Revisa los logs en Supabase Dashboard
2. Verifica la consola del navegador para errores de frontend
3. Consulta los tipos TypeScript en `types/database.ts`

---

**Última actualización:** 2025-01-15
**Versión:** 1.0.0
