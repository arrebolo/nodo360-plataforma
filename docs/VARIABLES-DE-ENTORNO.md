# Las variables de entorno: quién las lee y dónde tienen que estar

Censo hecho sobre el árbol entero el **2026-10-06**, buscando `process.env.X` en
`app/`, `lib/`, `components/`, `types/`, `scripts/` y `.github/`.

Lo que decide si una variable tiene que estar **en Vercel** no es que exista, es
**dónde se lee**:

| se lee en | va en |
|---|---|
| `app/`, `lib/`, `components/` | **Vercel** — eso corre en el servidor o en el navegador |
| `scripts/` | el `.env.local` de quien lo ejecuta. **No** en Vercel |
| `.github/workflows/` | secreto de GitHub. **No** en Vercel |

---

## 1. Las que faltan en Vercel

### Rompen algo hoy

| variable | entornos | qué pasa sin ella |
|---|---|---|
| **`FEEDBACK_EMAIL_TO`** | Production, Preview | El feedback **se guarda pero no avisa por correo**. El endpoint lo registra con el id y sigue devolviendo `success`, así que no se pierde nada: está en `/admin/feedback`. Se añadió en la #313 y quedó sin poner |
| **`TELEGRAM_CHANNEL_ID`** | Production | **El canal oficial de Telegram no recibe nada.** Ver el apartado de los tres destinos, abajo |
| **`TELEGRAM_INTERNAL_CHAT_ID`** | Production | El canal interno no recibe nada: ni los avisos de feedback ni los de error |

### No rompen, pero conviene decidir

| variable | qué hace sin ella |
|---|---|
| `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` | El limitador de peticiones **cae a memoria** (`lib/ratelimit.ts:133`). En serverless cada instancia tiene su propia memoria, así que el límite real es mucho más laxo de lo que dice la configuración. No falla nada: limita peor |
| `INTERNAL_API_SECRET` | `/api/internal/discord-notify` devuelve **401 siempre**. Falla cerrado, que es lo correcto: no hay agujero, el endpoint simplemente no se puede usar. Hoy no lo llama nada del código |
| `ANUNCIOS_MODO_PRUEBA` | Ausente = los anuncios se publican de verdad. **Es lo que se quiere en Production.** Útil ponerla a `1` en Preview, para que una rama no publique en Discord ni en Telegram |
| `NEXT_PUBLIC_GA_DISABLED` | Ausente = Google Analytics activo en producción. El identificador está escrito en el código (`GoogleAnalyticsTag.tsx`), así que **no hace falta ninguna variable de GA**. Esta solo sirve de interruptor de apagado |
| `NEXT_PUBLIC_APP_URL` | Solo se usa como segundo respaldo en un sitio. **No hace falta** |
| `ANALYZE` | Solo `next.config.ts`, para el analizador de bundle en local. **No va en Vercel** |
| `VERCEL_GIT_COMMIT_SHA` | **La pone Vercel sola.** No hay que añadirla |

### `NEXT_PUBLIC_SITE_URL`: tiene que estar ya

No aparece en la lista del panel, pero **si de verdad faltara, media plataforma
devolvería 500**, así que casi seguro está y la lista se quedó corta.

El motivo: `lib/env.ts` la declara `required()` y **lanza** si no está. Ese
módulo lo importa `lib/supabase/admin.ts`, que usan **67 ficheros**. Y hay cinco
sitios que la interpolan **sin respaldo**:

```
app/(auth)/login/actions.ts:110, 263, 387, 434   `${...}/auth/callback`
lib/certificates/generateCertificate.ts:231      `${...}/certificados/...`
```

Sin ella, los correos de recuperar contraseña y de confirmar cuenta llevarían
enlaces a `undefined/auth/callback`. **Cómo salir de dudas en cinco segundos:**
pide recuperar contraseña con una cuenta de prueba y mira el enlace del correo.

---

## 2. Los tres destinos de Telegram, y los dos que están sin configurar

`lib/notifications/telegram.ts` manda a tres sitios distintos y **a propósito no
cae de uno a otro** —antes hacía `TELEGRAM_CHANNEL_ID || TELEGRAM_CHAT_ID` y los
mensajes acababan donde tocara—:

| destino | variable | ¿en Vercel? | qué se publica ahí |
|---|---|---|---|
| `social` | `TELEGRAM_CHAT_ID` | **sí** | usuario nuevo, curso completado |
| `oficial` | `TELEGRAM_CHANNEL_ID` | **no** | **curso publicado**, propuesta de gobernanza, anuncio |
| `interno` | `TELEGRAM_INTERNAL_CHAT_ID` | **no** | feedback, errores |

O sea que **publicar un curso no se anuncia en Telegram**. No falla: registra
`⚠️ TELEGRAM_CHANNEL_ID sin configurar: no se publica nada en el destino
«oficial»` y sigue. Discord sí recibe.

---

## 3. Las que están en Vercel y no las lee nadie

Buscadas en código, scripts y workflows:

| variable | dónde se usa |
|---|---|
| **`GITHUB_TOKEN`** | **en ningún sitio.** Y el único workflow (`pr.yml`) **no usa ningún secreto** |
| **`DISCORD_BOT_TOKEN`** | **en ningún sitio** |
| **`DISCORD_CLIENT_ID`** | **en ningún sitio** |
| **`DISCORD_GUILD_ID`** | **en ningún sitio** |
| `TELEGRAM_CHAT_ID` | sí se usa, pero **solo para el destino `social`** |

Los avisos de Discord van por **webhooks** (`DISCORD_WEBHOOK_URL`,
`DISCORD_WEBHOOK_NEWS`, `DISCORD_WEBHOOK_ANNOUNCEMENTS`), que no necesitan bot ni
aplicación. Por eso las tres de bot sobran: debieron de ponerse para un bot que
nunca se escribió.

**Antes de borrar `GITHUB_TOKEN`, una comprobación:** Claude Code abre las PR con
un token `gho_` del Administrador de credenciales de Windows, que **no es** esta
variable. Si fueran el mismo (porque lo pegaras en los dos sitios), revocarlo
cortaría también eso. Míralo en *GitHub → Settings → Developer settings →
Personal access tokens*: si el de Vercel aparece ahí como PAT clásico o de ámbito
fino, es otro distinto y se puede revocar tranquilo.

### Declaradas y muertas

- `.env.example` declara **`NEXT_PUBLIC_AUTH_REDIRECT_URL`** y no la lee nadie.
- Algún `.env.local` tiene **`NEXTAUTH_SECRET`** y **`NEXTAUTH_URL`**: no las lee
  nadie y `next-auth` **no es dependencia** del proyecto. Son restos.
- **`NODO360_ADMIN_EMAIL`** solo la usan tres scripts. Correcto que esté en
  `.env.example` y **no** en Vercel.

---

## 4. Pasar las sensibles a *Sensitive*, sin cortar el servicio

### Lo que hay que saber antes de tocar nada

1. **Cambiar una variable no afecta al despliegue que está sirviendo.** Los
   valores se fijan al desplegar, así que puedes editarlas con calma: el sitio
   sigue con los de antes hasta que **vuelvas a desplegar**.
2. **Una variable *Sensitive* no se puede volver a leer**, ni en el panel ni por
   API ni por CLI. Es de solo escritura. Así que **cada valor tiene que estar en
   el gestor de contraseñas ANTES de empezar**, no después.
3. De las cinco que Vercel marca, **dos no hay que convertir: hay que borrarlas.**

### De dónde sale cada valor otra vez

| variable | ¿se puede volver a ver? | de dónde |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | **sí** | Supabase → *Project Settings → API → Project API keys* → `service_role`, botón de revelar |
| `TELEGRAM_BOT_TOKEN` | **sí** | Telegram, hablando con **@BotFather**: `/mybots` → tu bot → *API Token* |
| `RESEND_API_KEY` | **no** | Resend no vuelve a enseñar una clave creada. Hay que **crear una nueva** en *API Keys* y borrar la vieja después |
| `DISCORD_BOT_TOKEN` | **no** | Discord Developer Portal → tu aplicación → *Bot* → *Reset Token*. **Pero no hace falta: bórrala** |
| `GITHUB_TOKEN` | — | **bórrala y revócala**: no la usa nada |

### El orden

**Paso 0 — guardar.** En el gestor de contraseñas: la `service_role`, el token de
Telegram y la contraseña de la base. Sin esto, parar aquí.

**Paso 1 — quitar lo que sobra.** Tres menos que convertir:

- `GITHUB_TOKEN`: borrar de Vercel, y revocar en GitHub.
- `DISCORD_BOT_TOKEN`: borrar de Vercel, y *Reset Token* en Discord para
  invalidar el que anduviera suelto.
- `DISCORD_CLIENT_ID` y `DISCORD_GUILD_ID`: borrar de Vercel. No son secretos,
  pero tampoco sirven.

**Paso 2 — convertir las dos que se pueden copiar.** Para cada una, en
*Project Settings → Environment Variables*:

1. copia el valor del gestor de contraseñas;
2. borra la variable y créala otra vez con el mismo nombre, los mismos entornos
   y la casilla **Sensitive** marcada. (Si tu panel ofrece convertirla desde el
   aviso de *Needs Attention*, mejor: es lo mismo sin borrar.)

Hazlo con `SUPABASE_SERVICE_ROLE_KEY` y con `TELEGRAM_BOT_TOKEN`.

**Paso 3 — `RESEND_API_KEY`, que es rotación y no conversión.** En este orden,
para no quedarse sin correo en ningún momento:

1. crear una clave nueva en Resend;
2. ponerla en Vercel como **Sensitive**, en los mismos entornos;
3. **desplegar** (Deployments → el último → *Redeploy*);
4. comprobar que sale un correo de verdad — por ejemplo con el formulario de
   feedback, que es el camino más corto;
5. **y solo entonces** borrar la clave vieja en Resend.

**Paso 4 — desplegar una vez y comprobar.** Después de los pasos 1 y 2, un
*Redeploy*. Y mirar tres cosas:

- que `/admin` carga (usa la `service_role`);
- que publicar algo llega a Discord;
- que el formulario de feedback manda correo (si ya pusiste
  `FEEDBACK_EMAIL_TO`).

### Mientras estás ahí

Añade las que faltan del apartado 1, que es el mismo sitio y el mismo
despliegue: `FEEDBACK_EMAIL_TO`, `TELEGRAM_CHANNEL_ID`,
`TELEGRAM_INTERNAL_CHAT_ID` y, si quieres el limitador de verdad, las dos de
Upstash.

---

## 5. Dos proyectos en Vercel

La cuenta tiene **dos**: `nodo360-plataforma` (el vivo) y **`nodo360-cursos`**,
que no se toca desde mayo de 2026. Si es un resto, conviene mirarlo: **un
proyecto parado puede tener su propia copia de la `service_role`**, y rotar
claves sin acordarse de él deja una llave vieja en un sitio que nadie vigila. O
se borra, o se le quitan las variables.
