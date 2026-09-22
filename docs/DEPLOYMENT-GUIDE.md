# Guía de Deployment a Producción - Nodo360

Guía completa para llevar Nodo360 a producción de forma segura y optimizada.

## 📋 Checklist Pre-Deployment

### 1. Variables de Entorno ✅

- [ ] Copiar `.env.example` a `.env.local`
- [ ] Rellenar todas las credenciales de producción
- [ ] Verificar que `NEXT_PUBLIC_SITE_URL` apunta al dominio real
- [ ] Configurar Supabase con claves de producción
- [ ] Agregar Google Analytics ID real
- [ ] Configurar servicio de email
- [ ] (Opcional) Configurar Stripe para pagos
- [ ] (Opcional) Configurar Sentry para error tracking

### 2. Base de Datos 🗄️

- [ ] Ejecutar `sql/schema.sql` en Supabase Production
- [ ] Ejecutar `sql/add-course-filters.sql`
- [ ] Ejecutar `sql/create-user-progress-tables.sql`
- [ ] Verificar que todos los triggers están activos
- [ ] Configurar Row Level Security (RLS) policies
- [ ] Crear índices para optimizar queries

**Scripts SQL importantes:**
```bash
# Orden de ejecución:
1. schema.sql (estructura base)
2. add-course-filters.sql (filtros)
3. create-user-progress-tables.sql (dashboard)
```

### 3. SEO & Analytics 🔍

- [ ] Verificar que `sitemap.xml` se genera correctamente
- [ ] Verificar que `robots.txt` está configurado
- [ ] Agregar structured data a páginas principales
- [ ] Configurar Google Search Console
- [ ] Verificar Google Analytics está tracking
- [ ] Configurar Open Graph images
- [ ] Optimizar meta tags en todas las páginas

### 4. Performance 🚀

- [ ] Optimizar todas las imágenes
- [ ] Verificar lazy loading en componentes pesados
- [ ] Ejecutar `npm run build` y revisar warnings
- [ ] Analizar bundle size con `ANALYZE=true npm run build`
- [ ] Configurar CDN para assets estáticos
- [ ] Habilitar compresión gzip/brotli
- [ ] Configurar caching headers

### 5. Seguridad 🔒

- [ ] Configurar HTTPS (SSL certificate)
- [ ] Activar Security Headers en `next.config.ts`
- [ ] Configurar CORS correctamente
- [ ] Implementar rate limiting en APIs
- [ ] Sanitizar inputs en formularios
- [ ] Proteger rutas privadas (`/dashboard`, `/admin`)
- [ ] Configurar CSP (Content Security Policy)

### 6. Testing ✅

- [ ] Probar todos los formularios
- [ ] Verificar que las APIs responden correctamente
- [ ] Probar flujo de inscripción a cursos
- [ ] Verificar sistema de progreso funciona
- [ ] Probar newsletter signup
- [ ] Probar mentoría request
- [ ] Testing en diferentes navegadores
- [ ] Testing en mobile

---

## 🚢 Deployment en Vercel (Recomendado)

### Paso 1: Preparar Repositorio

```bash
git init
git add .
git commit -m "Initial commit - Nodo360 production ready"
git branch -M main
git remote add origin https://github.com/tu-usuario/nodo360-plataforma.git
git push -u origin main
```

### Paso 2: Conectar con Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Click en "New Project"
3. Importa tu repositorio de GitHub
4. Framework: **Next.js** (auto-detectado)
5. Build Command: `npm run build`
6. Output Directory: `.next` (default)

### Paso 3: Configurar Variables de Entorno

En Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_SITE_URL=https://nodo360.com
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... (solo backend)
NEXT_PUBLIC_GA_ID=...
```

### Paso 4: Deploy

```bash
# Deploy automático con cada push a main
git push origin main

# O usar Vercel CLI
npx vercel --prod
```

### Paso 5: Configurar Dominio

1. En Vercel Dashboard → Settings → Domains
2. Agregar tu dominio personalizado: `nodo360.com`
3. Configurar DNS según las instrucciones
4. Esperar propagación (15 min - 48 hrs)

---

## 🚀 Deployment en Railway (Alternativa)

### Paso 1: Instalar Railway CLI

```bash
npm install -g @railway/cli
railway login
```

### Paso 2: Iniciar Proyecto

```bash
railway init
railway up
```

### Paso 3: Variables de Entorno

```bash
railway variables set NEXT_PUBLIC_SITE_URL=https://nodo360.com
railway variables set NEXT_PUBLIC_SUPABASE_URL=...
# ... resto de variables
```

### Paso 4: Deploy

```bash
railway up --detach
```

---

## 🐳 Deployment con Docker (Avanzado)

### Paso 1: Crear Dockerfile

Crear `Dockerfile` en la raíz:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### Paso 2: Crear docker-compose.yml

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env.local
    restart: unless-stopped
```

### Paso 3: Build y Deploy

```bash
docker-compose up -d
```

---

## 📊 Post-Deployment

### 1. Monitoring

**Configurar Sentry:**
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

**Agregar a `next.config.ts`:**
```typescript
const { withSentryConfig } = require('@sentry/nextjs')

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: "nodo360",
  project: "plataforma",
})
```

### 2. Analytics

**Verificar Google Analytics:**
- Ir a Google Analytics Dashboard
- Verificar que aparecen usuarios en tiempo real
- Configurar objetivos (conversiones)
- Configurar eventos personalizados

**Configurar Google Search Console:**
1. Ir a [search.google.com/search-console](https://search.google.com/search-console)
2. Agregar propiedad: `https://nodo360.com`
3. Verificar dominio (DNS o HTML file)
4. Enviar sitemap: `https://nodo360.com/sitemap.xml`

### 3. Performance Checks

**Lighthouse Audit:**
```bash
npx lighthouse https://nodo360.com --view
```

**Objetivos mínimos:**
- Performance: 90+
- Accessibility: 90+
- Best Practices: 95+
- SEO: 95+

**PageSpeed Insights:**
- Ir a [pagespeed.web.dev](https://pagespeed.web.dev)
- Analizar `https://nodo360.com`
- Corregir issues encontrados

### 4. Backups

**Supabase:**
- Configurar backups automáticos daily
- Export manual pre-deployment críticos

**Código:**
- Tags de Git para cada release
- Branches: `main`, `staging`, `develop`

---

## 🔧 Troubleshooting

### Error: "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Error: "Build failed"
```bash
npm run build
# Revisar errores en consola
```

### Error: API routes no responden
- Verificar variables de entorno en el hosting
- Verificar que Supabase URL y keys son correctas
- Revisar logs del servidor

### Error: Imágenes no cargan
- Verificar `next.config.ts` → `images.remotePatterns`
- Agregar dominio de Supabase Storage

---

## 📈 Optimizaciones Post-Launch

### 1. CDN & Caching

**Vercel (incluido):**
- Edge caching automático
- Global CDN
- Image optimization

**Cloudflare (opcional extra):**
- DNS proxy
- DDoS protection
- Additional caching

### 2. Database

**Supabase optimizations:**
```sql
-- Crear índices para queries frecuentes
CREATE INDEX idx_courses_status_premium ON courses(status, is_premium);
CREATE INDEX idx_lessons_module_order ON lessons(module_id, order_index);
```

### 3. Monitoring Continuo

- Configurar alertas en Sentry
- Monitorear métricas en Vercel Analytics
- Revisar Google Analytics semanalmente
- Analizar performance con Lighthouse mensualmente

---

## 🎯 Next Steps

1. **Week 1:** Monitoreo intensivo, fix bugs críticos
2. **Week 2:** Optimizaciones basadas en analytics reales
3. **Month 1:** Análisis de conversiones, A/B testing
4. **Ongoing:** Nuevas features basadas en feedback

---

## 📞 Soporte

Si encuentras problemas durante el deployment:

1. Revisar logs en Vercel/Railway
2. Consultar documentación de Next.js
3. Revisar issues en GitHub
4. Contactar soporte de Supabase si es necesario

---

## ✅ Deployment Checklist Final

- [ ] DNS configurado correctamente
- [ ] SSL certificado activo (HTTPS)
- [ ] Todas las variables de entorno configuradas
- [ ] Base de datos migrada y poblada
- [ ] Google Analytics tracking
- [ ] Sitemap enviado a Google
- [ ] Performance > 90 en Lighthouse
- [ ] Testing completo en producción
- [ ] Backups configurados
- [ ] Monitoring activo (Sentry)
- [ ] 404 page personalizada
- [ ] 500 page personalizada
- [ ] Políticas de privacidad y términos
- [ ] GDPR compliance (si aplica)

---

**¡Listo para producción!** 🚀🎉
