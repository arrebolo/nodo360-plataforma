# CLAUDE.md

Nodo360 es una plataforma educativa en español sobre Bitcoin, blockchain y Web3:
cursos por rutas de aprendizaje, con quiz, certificados y gobernanza de la comunidad.

**Antes de planificar nada, leer `docs/reports/PROMPT-MAESTRO.md`**: estado real,
métricas verificadas, reglas críticas con el caso que las motivó e historial. La
deuda pendiente está en `docs/PLAN-REFORMA.md`, por niveles Tier 0-3.

Aquí no hay cifras ni estado a propósito: envejecen y acaban mintiendo. Para eso,
el prompt maestro. **Si los dos divergen, manda el prompt maestro.**

## Stack y comandos

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · Supabase · Vercel.

```bash
npm ci            # Node 22 (ver .nvmrc). Nunca npm install
npm run dev
npm run lint
npm run build
```

## Reglas que no se pueden olvidar

- Relaciones de Supabase **en singular**: `lesson.module.course`, nunca las plurales.
- Imports con el alias `@/`.
- **Nunca push directo a `main`**: está protegida. Todo entra por PR con el check `verificar` en verde.
- Lo que se aplica a la base de datos se versiona en `supabase/migrations/`. Si se ejecutó a mano, se versiona después con la fecha y el SQL exacto.
- Toda función `SECURITY DEFINER` nace con `SET search_path` y con `REVOKE ALL … FROM PUBLIC`, en la misma migración.
- La identidad sale de `auth.uid()`, nunca de un parámetro: PostgREST es alcanzable directamente y la clave anon es pública.
- El lockfile se genera con **npm 10**, el de Node 22. npm 11 tolera entradas que npm 10 rechaza y rompe el CI.
- **Español neutro**, válido para España y Latinoamérica.
- **Nada de promesas de rentabilidad ni juicios de inversión.** Describir lo que ocurre, no recomendar qué hacer con ello.
