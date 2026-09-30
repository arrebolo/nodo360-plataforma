# Proteger las cuentas de administración

Hay **dos cuentas con rol `admin`**: la principal y una de reserva, cada una con su propio
correo y su propia contraseña. Si a una le cambian el rol, la suspenden o la borran, la otra
sigue pudiendo administrar la plataforma.

Ninguna de las dos cosas sustituye a la otra: son **dos capas distintas**, y cada una cubre
lo que la otra no puede.

- La **migración 100** impide el cambio en la base de datos, que es el único sitio donde la
  protección no depende de qué camino se use.
- La **segunda cuenta** cubre lo que un trigger no puede cubrir: perder el acceso al correo,
  al segundo factor o a la contraseña de una de las dos.

Mientras hubo una sola cuenta, el procedimiento de emergencia de más abajo era la **única**
vía de recuperación y dependía de tener a mano la contraseña de la base de datos. Ya no:
hoy hay una segunda cuenta que entra por la puerta normal.

## El trigger protege a las dos, y a las que vengan

La condición del trigger es `OLD.role = 'admin'`. **No lleva ningún identificador ni ningún
correo escrito dentro**, así que protege cualquier fila que sea admin: la principal, la de
reserva y cualquier cuenta que se ascienda mañana. No hay que tocar nada al añadir una.

Comprobado contra la base el 30/09/2026, con `service_role` —que es justo el cliente que la
100 decide no eximir—, cinco intentos por cuenta:

| intento | principal | de reserva |
|---|---|---|
| bajar el rol a `student` | 42501, fila intacta | 42501, fila intacta |
| bajar el rol a `mentor` | 42501, fila intacta | 42501, fila intacta |
| suspender | 42501, fila intacta | 42501, fila intacta |
| escribir `suspended_reason` | 42501, fila intacta | 42501, fila intacta |
| cambiar el correo | 42501, fila intacta | 42501, fila intacta |
| editar la biografía | permitido | permitido |

No basta con que la operación dé error: cada intento vuelve a leer la fila y exige que no
haya cambiado nada. Un error con el cambio aplicado sería un fallo.

## Qué está bloqueado

Sobre una fila cuyo rol **ya es** `admin`:

| columna | por qué |
|---|---|
| `role` | quitarle el rol es quitarle el acceso |
| `is_suspended`, `suspended_at`, `suspended_reason`, `suspended_by` | suspenderla es lo mismo por otra puerta |
| `email` | el acceso se recupera por correo, así que cambiarlo es tomar la cuenta |
| *borrar la fila* | `auth.admin.deleteUser()` cascadea a `public.users`, y el trigger lo detiene |

**Lo que sí se puede**: editar nombre, biografía, avatar y redes. Un administrador tiene
que poder mantener su propio perfil; bloquear la fila entera habría roto eso.

**Y ascender a alguien *a* `admin` sigue siendo posible.** El trigger solo mira las filas
que ya son admin. Así se creó la cuenta de reserva.

## De dónde protege

De **todos los caminos**, y eso incluye `service_role`:

- el panel de administración
- las rutas de API
- la aprobación de una verificación
- PostgREST con la clave de servicio
- cualquier script

Es lo contrario de los triggers de la 089 y la 091, que dejan pasar cuando `auth.uid()` es
nulo. Aquí no, y es deliberado: la clave de servicio es justo por donde entran el panel y
las rutas, que es de lo que hay que proteger la cuenta. Si el servidor pudiera, el agujero
seguiría abierto.

## Procedimiento de emergencia

Para cambiar de verdad el rol de un admin, suspenderlo o borrarlo, hay que decirlo
explícitamente **en la misma transacción**, desde el editor SQL de Supabase:

```sql
BEGIN;
  SET LOCAL app.permitir_cambio_admin = 'on';
  UPDATE public.users SET role = 'student' WHERE email = 'quien@sea';
COMMIT;
```

Para borrarla:

```sql
BEGIN;
  SET LOCAL app.permitir_cambio_admin = 'on';
  DELETE FROM auth.users WHERE email = 'quien@sea';
COMMIT;
```

Con dos cuentas, **antes de degradar una hay que confirmar que la otra sigue en pie**. La
consulta de estado de la sección siguiente lo dice en una línea.

### Por qué `SET LOCAL` y no una variable normal

- **Muere con la transacción.** No se queda encendida por olvido, que es el fallo del
  `ALTER TABLE … DISABLE TRIGGER` que la migración 030 tuvo que corregir: aquello
  desactivaba el trigger para todas las conexiones y lo dejaba desactivado para siempre si
  la operación fallaba a mitad.
- **No sirve desde la aplicación.** `set_config` con alcance de transacción no sobrevive al
  pool de conexiones de PostgREST. Es útil en el editor SQL y en migraciones, que es
  exactamente donde hace falta y en ningún otro sitio.

## Comprobar el estado, sin riesgo

Solo lectura. Dice cuántas cuentas de administración hay, si alguna está suspendida y si el
trigger sigue activo:

```sql
SELECT
  (SELECT count(*) FROM public.users WHERE role = 'admin')                   AS admins,
  (SELECT count(*) FROM public.users WHERE role = 'admin' AND is_suspended)  AS suspendidas,
  (SELECT tgenabled FROM pg_trigger
    WHERE tgname = 'trg_proteger_la_cuenta_admin'
      AND tgrelid = 'public.users'::regclass)                                AS trigger_activo;
```

`admins` tiene que ser **2 o más**, `suspendidas` **0** y `trigger_activo` **`O`** (la letra
o de «origin», que es como Postgres dice que un trigger está encendido). Si `trigger_activo`
viene vacío, el trigger no existe y no hay protección ninguna.

## Probar la protección de verdad, sin tocar nada

Este bloque intenta las cuatro cosas prohibidas contra **cada** cuenta admin y termina en
`ROLLBACK`, así que no deja ningún cambio. Es la única forma honesta de probar la rama del
**borrado**: contra una cuenta viva no se prueba disparando un `DELETE` de verdad, porque si
el trigger fallara el borrado sería real y con cascada.

```sql
BEGIN;
DO $$
DECLARE
  a record;
  n integer := 0;
BEGIN
  FOR a IN SELECT id, email FROM public.users WHERE role = 'admin' LOOP
    BEGIN
      UPDATE public.users SET role = 'student' WHERE id = a.id;
      RAISE EXCEPTION 'FALLA: se pudo cambiar el rol de %', a.email;
    EXCEPTION WHEN insufficient_privilege THEN n := n + 1;
    END;

    BEGIN
      UPDATE public.users SET is_suspended = true WHERE id = a.id;
      RAISE EXCEPTION 'FALLA: se pudo suspender %', a.email;
    EXCEPTION WHEN insufficient_privilege THEN n := n + 1;
    END;

    BEGIN
      UPDATE public.users SET email = 'tomada@ejemplo.invalid' WHERE id = a.id;
      RAISE EXCEPTION 'FALLA: se pudo cambiar el correo de %', a.email;
    EXCEPTION WHEN insufficient_privilege THEN n := n + 1;
    END;

    BEGIN
      DELETE FROM public.users WHERE id = a.id;
      RAISE EXCEPTION 'FALLA: se pudo BORRAR %', a.email;
    EXCEPTION WHEN insufficient_privilege THEN n := n + 1;
    END;

    RAISE NOTICE 'protegida: %', a.email;
  END LOOP;

  RAISE NOTICE 'TODO CORRECTO: % rechazos en % cuenta(s).', n, n / 4;
END
$$;
ROLLBACK;
```

Tiene que decir `TODO CORRECTO` y cuatro rechazos por cuenta. **No cambiar el `ROLLBACK`
por `COMMIT`.**

## Dos avisos sobre los recuentos

- **La verificación final de la migración 100 exige `admins = 1`.** Se escribió cuando solo
  había una cuenta. Si se vuelve a ejecutar hoy dirá `REVISAR` por tener dos, que es lo
  contrario de un problema. No se reescribe: una migración que ya se aplicó no se toca. Para
  mirar el estado está la consulta de la sección anterior.
- La **migración 101** tenía la misma condición copiada y se corrigió antes de aplicarse:
  ahora pide `>= 1`. Un recuento no es una identidad, y lo que importa es que quede al menos
  una cuenta de administración, no que haya exactamente una.

## El nombre público de una cuenta admin no es un sitio para el correo

`full_name` y `role` los puede leer la **clave anónima**, que es pública y va en el
navegador. Con eso, cualquiera puede pedir «el nombre de las filas cuyo rol es admin».

Si en `full_name` hay una dirección de correo, ese correo queda expuesto, y es justo el
canal por el que se recupera la cuenta: el mismo que la 100 protege con un trigger.
Comprobado el 30/09/2026 con la clave anónima: la cuenta de reserva tenía su dirección
completa como nombre.

El trigger **permite** cambiar el nombre de una cuenta admin, así que se arregla sin
procedimiento de emergencia:

```sql
UPDATE public.users SET full_name = 'Nombre visible' WHERE email = 'quien@sea';
```
