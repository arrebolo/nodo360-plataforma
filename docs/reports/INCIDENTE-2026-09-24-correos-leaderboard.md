# Incidente: correos de usuarios legibles por cualquier cuenta con sesión

**Detectado:** 24/09/2026, auditando la RLS antes de cerrar `lessons` y `modules`.
**Corregido en código:** 24/09/2026, commit `ca8c194`.
**Corregido en base de datos:** migración `049_users_columnas_publicas.sql` (pendiente de aplicar al escribir esto).

---

## Qué se expuso

Dos caminos hacia lo mismo, con distinta dificultad:

**1. Un endpoint de la propia plataforma.** `GET /api/gamification/leaderboard`
embebía `users!inner (id, full_name, email)` y **devolvía el correo en su JSON**:

```js
name:  entry.users?.full_name || entry.users?.email?.split('@')[0] || 'Usuario',
email: entry.users?.email,
```

Alcance: **15 correos**, los de los usuarios con fila en `user_gamification_stats`
—el embed es `!inner`, así que el resto no salía—. Junto al correo iban el XP
total, el nivel y la racha de cada uno.

**2. La tabla entera, por PostgREST.** La política `users_read_all_authenticated`
tiene `USING true` para el rol `authenticated`, así que con una sesión y la clave
anónima (que va en el HTML de cualquier página) se leía `public.users` completa:
**23 filas × 23 columnas**, con `email`, `is_suspended`, `suspended_reason`,
`active_path_id` y el resto.

El endpoint es el camino sin consola; la tabla, el camino con consola.

## Desde cuándo

| | |
|---|---|
| Alta del endpoint, ya con `email` dentro | `0a3c94a`, **2025-11-24 13:07:29 +0100**, PR #3 *Hotfix/restore missing modules* |
| Corrección | `ca8c194`, **24/09/2026** |
| Ventana | **10 meses** |

El fichero se creó con el correo ya en el `select` y en la respuesta: nunca hubo
una versión sin él. Lo confirma `git log -S`, que solo devuelve esos dos commits.

Había algo que exponer desde el principio de la ventana: el primer usuario es del
17/11/2025 y la primera fila de `user_gamification_stats`, del 23/11/2025.

**Salvedad que no se puede resolver:** la exposición también requería la política
`users_read_all_authenticated`. Su fecha **no es rastreable** — se creó desde el
panel de Supabase y no existe en ninguna migración del repositorio, como el resto
de políticas base y como `is_admin`. Si fuese posterior al 24/11/2025, la ventana
real sería más corta. No hay forma de datarla desde aquí.

## A quién

**Cualquier usuario con la sesión iniciada.** Hoy son 23 cuentas, de las que 3 son
internas (admin, instructor, mentor).

**Sin sesión, nada.** Verificado el 24/09/2026 reproduciendo la consulta exacta del
endpoint con la clave anónima: devuelve **0 entradas**, porque la RLS de
`user_gamification_stats` no sirve ninguna fila a `anon` y el embed es `!inner`.
No hubo exposición pública.

**Y un matiz que baja bastante la gravedad:** el endpoint era **código muerto**. Su
único consumidor es `components/gamification/Leaderboard.tsx`, que **no lo importa
nadie**: `/dashboard/leaderboard` construye su propia tabla en el servidor con el
cliente de servicio y no llama al endpoint. Así que ninguna pantalla lo pedía al
cargar; había que pedir la URL a mano. Los correos no llegaron al navegador de
nadie como efecto de usar la plataforma con normalidad.

## Si alguien lo consultó

**No se puede saber, y conviene que quede escrito por qué:**

- **Vercel.** La consulta de registros de ejecución desde el conector devuelve
  `403 Forbidden`. Y aunque no lo hiciera, daría igual: **en el plan Hobby los
  registros son una ventana en vivo, no un archivo, y los *Log Drains* no están
  disponibles**. No es que estén mal configurados — no se pueden configurar.
- **Supabase.** Los registros de API se conservan 1 día en el plan gratuito y 7 en
  Pro. Tampoco alcanzan.
- **La aplicación.** No hay tabla de auditoría para este endpoint ni para ningún
  otro de lectura.

Lo único acotable es el conjunto de quienes *podrían* haberlo hecho: las 23 cuentas
registradas. Queda a criterio del responsable si eso basta para descartar una
notificación o si procede hacerla de todos modos.

## Qué se hizo

**En el código** (commit `ca8c194`, independiente de la RLS — el endpoint no
volvería a servir correos aunque la política siguiera abierta):

- `app/api/gamification/leaderboard/route.ts` deja de pedir `email` en el embed y
  de devolverlo en el JSON.
- `components/gamification/Leaderboard.tsx` pierde el campo `email` de su tipo.
- `app/(private)/dashboard/leaderboard/page.tsx` y `admin/gamificacion/page.tsx`
  dejan de usar la parte local del correo como nombre de respaldo, que mostraba el
  buzón de una persona a las demás.
- `app/(auth)/auth/callback/route.ts` dejaba de registrar `console.log('Perfil:',
  profile)` con la fila entera, que con el cambio a `mi_perfil()` habría metido el
  correo en los registros del servidor.

**En la base de datos** (migración 049, pendiente):

- `REVOKE ALL ON public.users FROM anon, authenticated` y `GRANT SELECT` solo de
  las seis columnas públicas (`id`, `full_name`, `avatar_url`, `role`, `bio`,
  `created_at`).
- `mi_perfil()`, `SECURITY DEFINER`, para que cada uno siga leyendo su propia fila
  entera.
- `GRANT UPDATE` por columna: de paso, un usuario deja de poder cambiarse el rol o
  levantarse una suspensión, que antes dependía solo de la política de filas.

**Barrido de la misma clase de fallo.** Revisadas todas las rutas de `app/api` que
mencionan `email` y devuelven JSON: **ninguna otra sirve correos ajenos**.
`/api/admin/roles` los devuelve a administradores (legítimo, y está detrás de
`isAdmin`), `/api/feedback` usa el de la propia sesión, y el resto solo escriben en
registros del servidor.

## Lo que este incidente enseña

1. **Un endpoint muerto sigue siendo un endpoint.** Nadie lo llamaba desde 2025 y
   seguía publicado, respondiendo y devolviendo datos personales. El código muerto
   no es inofensivo mientras tenga una ruta.
2. **La política de filas y el privilegio de columna son cosas distintas.** Aquí la
   política hacía lo que se esperaba de ella —dejar ver usuarios— y el problema
   estaba en que las columnas nunca se acotaron.
3. **Las políticas creadas desde el panel no se pueden datar.** No estar en una
   migración no es solo un problema de reproducibilidad: impide responder «desde
   cuándo» cuando hace falta.
4. **Sin registros no hay forense, y aquí no los hay por el plan.** Diez meses
   de ventana y cero capacidad de saber si se explotó. En Hobby no es cuestión
   de configurarlo mejor: no existe la opción. Mientras el proyecto siga ahí, el
   próximo incidente se documentará igual de a ciegas, y conviene saberlo antes
   de que haya datos de pago de por medio.
