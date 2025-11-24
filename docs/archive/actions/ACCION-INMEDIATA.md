# ⚡ ACCIÓN INMEDIATA - 3 Pasos

## 1️⃣ APLICAR SQL (2 minutos)

1. Ir a: https://supabase.com/dashboard
2. SQL Editor
3. Copiar TODO de: `supabase/migrations/003_learning_paths.sql`
4. Pegar
5. Click "Run"
6. Esperar "Success"

---

## 2️⃣ VERIFICAR (30 segundos)

```bash
npx tsx scripts/apply-learning-paths-migration.ts
```

Debe decir:
```
✅ Tabla learning_paths existe
   Rutas encontradas: 3
```

---

## 3️⃣ PROBAR (2 minutos)

1. Ir a: `http://localhost:3001/dashboard`
2. Debe redirigir a `/onboarding`
3. Seleccionar "Ruta Bitcoin"
4. Ver hero section en dashboard

---

## ✅ LISTO

Sistema de onboarding funcionando.

**Docs completas:** `SIGUIENTE-PASO-AHORA.md`
