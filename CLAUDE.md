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
- **Los recuentos concretos de producción no son una aserción en `supabase/migrations/`.** Van en `tmp/NNN-aplicar.sql` —el fichero que se ejecuta una vez, donde un «salieron 15 y 1» es justo lo que hay que confirmar antes de aplicar— y en la consulta de verificación, como información. En el fichero versionado se exigen **invariantes**: propiedades que valen en cualquier base y en cualquier momento (ningún curso sin autor, la firma igual a la regla aplicada a su autor, el espejo sin discrepancias con su curso). Un `IF v_cursos <> 15 THEN RAISE` se levanta diciendo que algo va mal en cuanto se publica un curso más, y deja el fichero sin poder ejecutarse en ninguna otra parte. Lo que salió el día que se aplicó se escribe en la cabecera, no en un `IF`.
- Toda función `SECURITY DEFINER` nace con `SET search_path` y con `REVOKE ALL … FROM PUBLIC`, en la misma migración.
- **Una migración que cambia contenido de un curso termina llamando a `publicar_curso('<id>')`** y dejando su fila de cuentas en la verificación. Lo que leen los alumnos es la copia publicada (`*_publicados`), no las tablas de trabajo: sin esa llamada, el cambio no sale al aire.
- **Una columna nueva en `courses`, `modules`, `lessons` o `quiz_questions` son dos columnas.** La misma columna va a su copia publicada (`*_publicados`, `*_publicadas`) en la misma migración, rellenada desde el origen —también las filas con `retirada_el`—, y la autoprueba **publica un curso** comprobando que el valor llega. `columnas_a_copiar` saca las columnas del catálogo y se levanta con 42703 si al espejo le falta alguna: sin eso no se puede publicar nada, y la 121 se quedó sin aplicar por esto. Que exista el hueco no basta: el espejo se queda con el valor del momento de publicar y no se entera de nada hasta que se republica.
- **Una migración que toque `public.users` no se entrega sin haberla ejecutado.** `npm run probar:migracion tmp/NNN-aplicar.sql` la corre entera contra un PostgreSQL de verdad (PGlite en WASM, sin servicio ni contraseña) sobre un andamio que modela **siete objetos**: `users`, `instructor_profiles`, `user_roles`, `courses`, la vista `perfiles_publicos`, `conversations` y `messages`, con sus columnas, sus permisos por columna, sus políticas, su RLS y sus triggers; y encima ejecuta, en orden, las migraciones versionadas posteriores a la foto y anteriores a la que se prueba, para que lo que se prueba caiga sobre la base de hoy. La foto la fecha `ANDAMIO_HASTA_LA_MIGRACION` para el andamio, y para un volcado **su primera línea** (`-- nodo360: volcado hasta la migracion NNN`): sin ella, o si ya incluye la que se prueba, el banco se niega. Con un volcado van encima todas; **con el andamio, solo las declaradas en `COMPATIBLES_CON_EL_ANDAMIO`**, cada una con el motivo por el que el andamio la sostiene: si entre la foto y la que se prueba hay una sin declarar, el banco se niega y la nombra, en vez de reventar con un «relation does not exist» que no es de la que se prueba o de saltársela en silencio. Lo que está **medido** en producción son las columnas, los permisos y cuántas filas ve cada rol; el **texto** de las políticas no se puede leer desde fuera —PostgREST no sirve el catálogo y no hay volcado todavía—, así que las del andamio son las más restrictivas compatibles con lo medido, y eso también hay que decirlo al entregar. Leerla con cuidado no basta: `CREATE FUNCTION` comprueba la **sintaxis** del cuerpo plpgsql, pero **no los tipos de sus expresiones**, que solo se resuelven al ejecutarla. Por eso `v_tocadas || 'role'` se crea sin protestar y revienta cuando el trigger dispara. Tres fallos ya cazados así: `22P02` por ese `||` sobre un array, `42501` por leer en el lado derecho de un `SET` una columna sin permiso de lectura, y una afirmación mía falsa sobre el orden de disparo de dos triggers.
- **Fuera de esos siete objetos, el banco no sirve de aval**: el andamio está escrito a mano, así que una migración que toque cualquier otra cosa falla ahí por objetos que no existen, y ese fallo no dice nada de la migración. Y por estar escrito a mano **se desfasa**: ya se le habían olvidado `email_normalizado` y `anunciar_logros`. Y un arreglo sin medir es otro desfase: `user_roles.role` se pasó a enum porque «la 034 lo castea a `::TEXT`», y medido es `text` (filtrar por un valor inexistente da 0 filas; en `users.role` da `22P02`); de paso, el enum tiene un quinto valor, `council`, y `user_roles` no tiene `expires_at`. Ampliarlo es barato y vale la pena cuando una migración lo necesita —la 123 añadió cuatro objetos—, pero cada cosa que se añada se añade **medida**, no de memoria. Hasta que haya un volcado de esquema de producción que cargar, para el resto lo exigible es lo que sí se puede comprobar: que el fichero **entre entero en una transacción y se deshaga con `ROLLBACK`** —eso caza la sintaxis, los `$tag$` mal cerrados y los objetos que faltan—, y que cada función y cada bloque `DO` se creen sin error. Es una barrera más baja, y hay que decirlo al entregar: no es «ejecutada», es «compila».
- **Una comprobación nueva no vale hasta haberla visto en rojo a propósito.** Antes de dar por buena una prueba, un guardián o la autoprueba de una migración, hay que romper lo que vigila y verla fallar. Si no se ha visto fallar, no se sabe qué mide: una aserción con `||`, un selector que no encuentra nada, un «no es 403» que acepta un 429 o un recuento `> 0` que cuenta otra cosa pasan igual de verdes que una comprobación de verdad, y entran en el recuento como si hubieran medido algo. Dos ejemplos que costaron un informe falso: `di(abierto || cuantasRutas > 0, …)`, donde el clic nunca ocurría y los nodos contados eran de otro componente; y una prueba de hidratación que no podía ver el fallo porque el servidor y el navegador compartían huso. Vale igual para las dos direcciones: una aserción que no se puede poner en rojo rompiendo el código, y una que se pone en rojo sin que nada esté roto.
- La identidad sale de `auth.uid()`, nunca de un parámetro: PostgREST es alcanzable directamente y la clave anon es pública.
- El lockfile se genera con **npm 10**, el de Node 22. npm 11 tolera entradas que npm 10 rechaza y rompe el CI.
- **Español neutro**, válido para España y Latinoamérica.
- **Nada de promesas de rentabilidad ni juicios de inversión.** Describir lo que ocurre, no recomendar qué hacer con ello.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
