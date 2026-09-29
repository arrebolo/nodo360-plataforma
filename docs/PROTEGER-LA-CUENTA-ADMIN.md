# Proteger la cuenta de administración

Hay **una sola cuenta con rol `admin`**. Si alguien le cambia el rol, la suspende o la
borra, no queda nadie que pueda deshacerlo desde la aplicación: la plataforma se queda sin
administración con un clic mal dado.

La **migración 100** lo impide en la base de datos, que es el único sitio donde la
protección no depende de qué camino se use.

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
que ya son admin.

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

### Por qué `SET LOCAL` y no una variable normal

- **Muere con la transacción.** No se queda encendida por olvido, que es el fallo del
  `ALTER TABLE … DISABLE TRIGGER` que la migración 030 tuvo que corregir: aquello
  desactivaba el trigger para todas las conexiones y lo dejaba desactivado para siempre si
  la operación fallaba a mitad.
- **No sirve desde la aplicación.** `set_config` con alcance de transacción no sobrevive al
  pool de conexiones de PostgREST. Es útil en el editor SQL y en migraciones, que es
  exactamente donde hace falta y en ningún otro sitio.

## Si se pierde el acceso a la cuenta admin

Este procedimiento es **la única vía de recuperación**, y necesita la contraseña de la base
de datos. Conviene tenerla guardada donde no dependa de poder entrar en la plataforma.

Mientras haya una sola cuenta admin, esto es un punto único de fallo. Crear una segunda
cuenta de administración —con su propio correo y su propia clave— reduce el riesgo sin
tocar nada de esto: ascender a alguien *a* admin sigue permitido.
