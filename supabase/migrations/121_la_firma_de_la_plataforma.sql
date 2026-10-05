-- 121. La firma de la plataforma, la exencion por rol de base y el borrado de un
--      curso con copia publicada viva.
--
--      APLICADA A MANO EL 2026-10-05 en el editor SQL de produccion, con «TODO
--      CORRECTO» en la fila de verificacion. Los numeros que salieron aquel dia:
--
--        cursos:  15 firmados por la plataforma,  1 por una persona,  0 sin autor
--        espejo:  15 filas firmadas por la plataforma, 0 por una persona,
--                 0 huerfanas, 0 discrepancias con su curso
--                 (15 filas en total: 10 vivas y 5 retiradas)
--        y ademas: las dos columnas bien puestas, los dos triggers activos, dos
--                 funciones ya por rol de base, 0 restos de la autoprueba.
--
--      LAS ASERCIONES SE CAMBIARON DESPUES A INVARIANTES. Al aplicarla, el
--      relleno y la verificacion exigian esos recuentos exactos —15 / 1 / 0—, y
--      eso solo vale en esta base y solo ese dia: en cuanto se publique un curso
--      mas, un fichero asi se levanta diciendo que algo va mal cuando va bien, y
--      no se puede volver a ejecutar en ninguna otra parte. Lo que ahora se exige
--      son propiedades que tienen que cumplirse SIEMPRE: que ningun curso este
--      sin autor, que la firma de cada curso coincida con la regla aplicada a su
--      autor, y que el espejo no discrepe de su curso. Los recuentos siguen
--      saliendo por pantalla, como informacion, no como condicion.
--
--      Los CAMBIOS EN LA BASE son los que se ejecutaron, letra por letra: las dos
--      columnas, sus COMMENT, las cuatro funciones, los triggers y el UPDATE del
--      relleno. Lo unico distinto son las comprobaciones.
--
--      Hay hueco en el 120 a proposito: esta reservado para cerrar las tablas de
--      trabajo a anon y a authenticated (bloque 3), como dice
--      docs/VUELTA-ATRAS-COPIA-PUBLICADA.md. La segunda mitad de este trabajo
--      —REVOCAR users.role a anon y la politica de filas por funcion— es la 122.
--
--      Los slug de la autoprueba siguen diciendo «qa-121a»: es el marcador que de
--      verdad se ejecuto, y cambiarlo seria tocar lo aplicado por estetica.
--
-- ============================================================================
-- MIGRACION 121: la firma de la plataforma, la exencion por rol de base,
--                 y el borrado de un curso con copia publicada
--
-- Es el primero de tres pasos. NO REVOCA NADA: la revocacion de `users.role` a
-- `anon` va en la 121b, despues de que las pantallas dejen de pedir esa columna.
-- Aplicar esta sola no cambia lo que ve nadie.
--
-- ----------------------------------------------------------------------------
-- 1. LA FIRMA DE LA PLATAFORMA
--
-- Hoy la ficha de un curso decide si pone «Creado por Nodo360» o «Por <persona>»
-- preguntando por el ROL DE UNA PERSONA:
--
--     const isNodo360 = !course.instructor_id || course.instructor?.role === 'admin'
--
-- Y por eso `users.role` tiene que ser legible por la clave anonima, que es
-- publica. Mientras eso siga asi, no se puede cerrar la enumeracion de cuentas:
-- medido, filtrar por una columna sin permiso da 42501, de modo que revocar
-- `role` es lo que convierte «dime quienes son los admin» en una pregunta que no
-- se puede hacer. Pero revocarla hoy dejaria las fichas de la plataforma firmadas con el
-- nombre y apellido de una persona en vez de con el de la plataforma: lo
-- contrario de lo que se busca.
--
-- Asi que la decision deja de depender del rol de nadie y pasa a una columna de
-- `courses`, que `anon` ya puede leer y que no dice nada de ninguna persona.
--
-- POR QUE UNA COLUMNA NUEVA Y NO `owner_role`, que ya existe y esta vacia:
--
--   · `owner_role` es una COPIA DEL ROL DE UNA PERSONA, que es exactamente la
--     forma del problema que se esta quitando. Reutilizarla dejaria la firma
--     atada a «que rol tiene esta persona» cuando lo que se quiere decir es «la
--     plataforma firma este curso». Hoy coinciden; no tienen por que.
--   · Es `text` y acepta cualquier cosa. Un booleano con el nombre de lo que
--     significa no se puede malinterpretar.
--   · Y habria que mantenerla en sintonia con el rol de esa persona con otro
--     trigger, que es volver a atar las dos cosas.
--
--   `owner_id` y `owner_role` son la mitad de otra idea —propiedad distinta de
--   autoria— que nunca se termino: estan a NULL en los 16 cursos y no las lee
--   ninguna pantalla. Para no dejar dos columnas que parezcan decir lo mismo,
--   esta migracion las COMENTA como abandonadas y apunta a la nueva. Retirarlas
--   va en su propia migracion, porque `owner_id` tiene clave ajena y siete
--   scripts de prueba la escriben.
--
-- SOLO UN ADMIN LA CAMBIA. Un instructor no puede ponersela a su curso ni al
-- crearlo ni al editarlo ni por PostgREST: lo impide un trigger, no la pantalla.
--
-- UNA COLUMNA DE `courses` SON DOS COLUMNAS. El primer intento de esta migracion
-- se levanto con 42703 al llegar a la autoprueba:
--
--     A la copia publicada courses_publicados le faltan columnas de courses:
--     firmado_por_la_plataforma. Añadelas al espejo antes de publicar.
--
-- No es un estorbo, es el guardian de la 117 funcionando. La cadena es:
--
--     UPDATE courses SET status='published'
--       -> trg_al_publicar_refrescar_la_copia  (119)
--       -> publicar_curso_interno              (117)
--       -> columnas_a_copiar('courses','courses_publicados')   <- se levanta aqui
--
-- `columnas_a_copiar` saca las columnas DEL CATALOGO, no de una lista escrita a
-- mano —la leccion de la 030, que se quedo en nueve—, y si al espejo le falta una
-- del origen prefiere no publicar antes que publicar a medias y en silencio. El
-- COMMENT de la 117 sobre esa misma funcion ya lo avisaba por escrito.
--
-- Asi que la columna se añade a LAS DOS TABLAS, y la autoprueba publica un curso
-- firmado para comprobar que la firma llega de verdad a la copia. Medido con una
-- columna booleana que ya existia en los dos lados (`is_certifiable`): al publicar
-- llega con el valor del origen, el espejo NO se entera de los cambios
-- posteriores —una copia es una copia— y al republicar se refresca y sube de
-- version. Eso es lo que miden las pruebas 5 y 6.
--
-- Comparados los CUATRO pares del catalogo antes de escribir esto:
--
--     courses        -> courses_publicados         37 columnas, 0 faltan
--     modules        -> modules_publicados         10 columnas, 0 faltan
--     lessons        -> lessons_publicadas         19 columnas, 0 faltan
--     quiz_questions -> quiz_questions_publicadas  11 columnas, 0 faltan
--
-- Cada espejo añade `publicado_el`, `version` y `retirada_el`, y nada mas. La 121
-- solo toca `courses`, asi que los otros tres pares se quedan como estan: la
-- comprobacion es en un solo sentido —que al espejo no le falte nada del origen—,
-- de modo que las columnas de mas del espejo nunca estorban.
--
-- ----------------------------------------------------------------------------
-- 2. LA EXENCION POR ROL DE BASE, NO POR FALTA DE IDENTIDAD
--
-- Dos triggers eximen con `IF auth.uid() IS NULL THEN RETURN NEW`, que quiere
-- decir «sin identidad = el servidor». Y no es lo mismo: LA CLAVE ANONIMA
-- TAMBIEN TIENE auth.uid() NULO.
--
-- Medido antes de escribir esto: `anon` NO llega a esa exencion. Sus UPDATE y
-- DELETE sobre `courses` «pasan» pero afectan a 0 filas —la RLS no le da
-- ninguna— y el INSERT se rechaza con 42501. Asi que hoy no hay agujero: esto
-- es endurecimiento, y pasa a importar el dia que alguien le de a `anon` o a
-- `authenticated` una via de escritura en esas tablas.
--
--   trg_controlar_publicacion            -> controlar_publicacion_de_cursos (109)
--   trg_la_fecha_de_publicacion_no_se_borra -> la_fecha_de_publicacion_no_se_borra (116)
--
-- `calculate_gpower` (036) NO SE TOCA: ya distingue bien, con
-- `current_setting('role', true) IS DISTINCT FROM 'service_role'`. Es el modelo.
--
-- Y UN DETALLE QUE IMPORTA: las dos que se cambian son SECURITY INVOKER, asi que
-- `current_user` es el rol de quien llama y sirve. En una SECURITY DEFINER
-- `current_user` es el DUEÑO de la funcion, y ahi hay que usar
-- `current_setting('role')` —que es por lo que la 036 lo hace asi—.
--
-- ----------------------------------------------------------------------------
-- 3. NO SE BORRA UN CURSO CON COPIA PUBLICADA VIVA
--
-- Medido: borrar un curso de trabajo publicado SALE BIEN y deja su copia VIVA Y
-- LEGIBLE POR UN ANONIMO, con sus modulos y sus lecciones, porque no hay ninguna
-- clave ajena de `courses_publicados` hacia `courses`. Reproducido con un curso
-- de usar y tirar: anon seguia devolviendo su titulo y su slug despues del
-- borrado.
--
-- Con copia VIVA: no se borra, y se dice que hay que despublicar o archivar
-- primero —las dos cosas retiran la copia por el trigger de la 119—. Con la
-- copia ya RETIRADA: se borra, y LA FILA DEL ESPEJO SE QUEDA, porque de ella
-- cuelgan el progreso y los certificados con RESTRICT.
--
-- NO se añade la clave ajena que falta. Con CASCADE destruiria el ancla de los
-- certificados y con RESTRICT ningun curso publicado podria borrarse nunca. El
-- espejo tiene que poder sobrevivir a su original: para eso existe.
--
-- Y nada en modulos ni lecciones: que la copia siga sirviendo una leccion
-- borrada del trabajo es el diseño de la copia publicada, no un fallo.
--
-- ----------------------------------------------------------------------------
-- QUE DEJA DE FUNCIONAR, dicho antes de aplicarla
--
-- El trigger de borrado cierra una puerta que hoy esta abierta, y hay codigo que
-- la usaba sin saberlo. Repasado el arbol entero (`DELETE` sobre `courses` en
-- aplicacion, migraciones y scripts):
--
--   · `app/api/admin/courses/[id]/route.ts` (DELETE) empezara a devolver 42501 al
--     borrar un curso publicado. Hoy devuelve 200 y deja la copia viva, que es el
--     fallo. El mensaje claro en la pantalla va en la PR 3, como esta acordado.
--   · `scripts/comprobar-la-copia-publicada.mts`, comprobacion 6 —«borrar un
--     curso con matriculas esta impedido»— SEGUIRA EN VERDE, Y POR OTRO MOTIVO:
--     solo mira `Boolean(error)`, y a partir de ahora el error lo pone este
--     trigger antes de que la clave ajena de las matriculas llegue a opinar. Deja
--     de medir lo que dice su nombre. Se arregla en la PR 1, exigiendo el codigo
--     y retirando la copia antes para que la parte de las matriculas vuelva a
--     medirse.
--   · La autoprueba de la 119 fallaria si se volviera a ejecutar: su caso A borra
--     un curso dejando la copia viva a proposito. No es un problema real —las
--     migraciones no se re-ejecutan— pero quien la copie como plantilla tiene que
--     saberlo: desde la 121, borrar un curso con copia viva exige retirarla
--     antes o pedir la salida de emergencia.
--   · `limpiar-restos-de-pruebas.mts` ya retira el espejo antes del curso (se
--     endurecio en la #314), asi que no se entera.
--
-- ----------------------------------------------------------------------------
-- QUE DEBE SALIR AL EJECUTARLA: los NOTICE de la autoprueba, todos PASA, y al
-- final una sola fila que diga TODO CORRECTO. Si algo falla, la transaccion
-- entera se deshace y no queda nada a medias.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. La columna, en la tabla de trabajo Y EN SU COPIA PUBLICADA
-- ============================================================================

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS firmado_por_la_plataforma boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.courses.firmado_por_la_plataforma IS
  'Si la ficha dice «Creado por Nodo360» en vez de «Por <persona>». Es una decision editorial del curso, NO el rol de su autor: antes se deducia de users.role = admin, y eso obligaba a que la clave anonima pudiera leer el rol de las personas. Solo la administracion la cambia (trg_la_firma_de_la_plataforma).';

-- Y EL ESPEJO, por lo dicho arriba: sin esto no se puede publicar nada.
--
-- NO LLEVA TRIGGER. En el espejo no escribe nadie a mano: `anon` y
-- `authenticated` tienen SELECT y nada mas (119), y las unicas escrituras salen de
-- `publicar_curso_interno`, que es SECURITY DEFINER y corre como dueña de la
-- tabla. Un trigger ahi tendria que eximir justo a esa funcion, con lo que no
-- defenderia nada. Lo que protege la firma en el espejo es que la firma del
-- ORIGEN esta protegida y el espejo solo se escribe copiando.

ALTER TABLE public.courses_publicados
  ADD COLUMN IF NOT EXISTS firmado_por_la_plataforma boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.courses_publicados.firmado_por_la_plataforma IS
  'Copia de courses.firmado_por_la_plataforma en el momento de publicar. La escribe publicar_curso_interno copiando del origen; como toda la copia publicada, no se entera de los cambios del curso de trabajo hasta que se republica. anon la lee, igual que el resto de la fila: la firma es publica por definicion, se imprime en la ficha.';

COMMENT ON COLUMN public.courses.owner_id IS
  'ABANDONADA. Mitad de una idea que no se termino (propiedad distinta de autoria): NULL en todos los cursos y no la lee ninguna pantalla. La autoria es instructor_id y la firma, firmado_por_la_plataforma. Se retira en otra migracion: tiene clave ajena y la escriben scripts de prueba.';

COMMENT ON COLUMN public.courses.owner_role IS
  'ABANDONADA, y no se reutilizo a proposito: es una copia del rol de una persona, que es la forma del problema que la 121 quita. Para la firma esta firmado_por_la_plataforma. Se retira en otra migracion.';

-- ============================================================================
-- 2. El relleno inicial: cada curso segun el rol de su autor de hoy
-- ============================================================================
-- Va ANTES del trigger a proposito, para que se lea en este orden: primero el
-- estado de hoy, despues la regla que lo defiende.
--
-- LOS RECUENTOS SALEN POR PANTALLA, PERO NO SON LA CONDICION. Lo que se exige son
-- tres invariantes que valen en cualquier base y en cualquier momento: ningun
-- curso sin autor, la firma de cada curso igual a la regla aplicada a su autor, y
-- el espejo sin discrepancias con su curso. Lo que salio el dia que se aplico
-- esta en la cabecera del fichero.
--
-- No mueve `updated_at`: el unico trigger que lo escribe es el de la 030, y solo
-- en la rama que devuelve a revision un curso publicado cuando cambia una de sus
-- nueve columnas. `firmado_por_la_plataforma` no es ninguna de ellas, asi que la
-- fecha de «Editado» de las fichas se queda como esta.

DO $relleno$
DECLARE
  v_plataforma  integer;
  v_persona     integer;
  v_sin_autor   integer;
  v_e_plataforma integer;
  v_e_persona    integer;
  v_huerfanas    integer;
  v_desacuerdo   integer;
  v_descuadre    integer;
  v_e_total      integer;
  v_e_vivas      integer;
BEGIN
  -- ── Los cursos de trabajo ──────────────────────────────────────────────────
  UPDATE public.courses c
     SET firmado_por_la_plataforma = true
   WHERE c.instructor_id IN (SELECT u.id FROM public.users u WHERE u.role = 'admin');

  SELECT count(*) FILTER (WHERE firmado_por_la_plataforma),
         count(*) FILTER (WHERE NOT firmado_por_la_plataforma AND instructor_id IS NOT NULL),
         count(*) FILTER (WHERE instructor_id IS NULL)
    INTO v_plataforma, v_persona, v_sin_autor
    FROM public.courses;

  RAISE NOTICE 'RELLENO  cursos: plataforma %   persona %   sin autor %',
    v_plataforma, v_persona, v_sin_autor;

  -- INVARIANTE 1: ningun curso sin autor.
  --
  -- El relleno decide la firma MIRANDO EL ROL DEL AUTOR, asi que un curso sin
  -- autor deja la firma sin decidir: se queda en false y la ficha lo pintaria
  -- como de la plataforma por el otro camino —el de «no hay a quien atribuirlo»—,
  -- con lo que el dato y la pantalla dirian cosas distintas. Eso no se arregla
  -- por defecto: hay que mirarlo.
  IF v_sin_autor <> 0 THEN
    RAISE EXCEPTION
      'Hay % cursos sin autor, y la firma se decide por el rol del autor: no hay nada de donde deducirla. Asignales autor o decide su firma a mano antes de aplicar esto.',
      v_sin_autor;
  END IF;

  -- ── El espejo, copiando del origen (TAMBIEN las filas retiradas) ───────────
  -- Las retiradas tambien: de ellas cuelgan certificados y progreso, y el dia que
  -- una ficha vieja se lea del espejo tiene que firmar igual que firmaba.
  UPDATE public.courses_publicados cp
     SET firmado_por_la_plataforma = c.firmado_por_la_plataforma
    FROM public.courses c
   WHERE c.id = cp.id;

  SELECT count(*) FILTER (WHERE cp.firmado_por_la_plataforma),
         count(*) FILTER (WHERE NOT cp.firmado_por_la_plataforma
                            AND EXISTS (SELECT 1 FROM public.courses c WHERE c.id = cp.id)),
         count(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM public.courses c WHERE c.id = cp.id))
    INTO v_e_plataforma, v_e_persona, v_huerfanas
    FROM public.courses_publicados cp;

  SELECT count(*), count(*) FILTER (WHERE retirada_el IS NULL)
    INTO v_e_total, v_e_vivas
    FROM public.courses_publicados;

  RAISE NOTICE 'RELLENO  espejo: plataforma %   persona %   huerfanas %  (de % filas, % vivas)',
    v_e_plataforma, v_e_persona, v_huerfanas, v_e_total, v_e_vivas;

  -- INVARIANTE 2: la firma de cada curso coincide con la regla aplicada a su
  -- autor. Es la unica forma de comprobar el relleno sin depender de cuantos
  -- cursos haya: se vuelve a calcular la regla y se exige que no sobre ni falte
  -- ninguno. Con EXISTS y no con IN, para que un autor nulo de false y no NULL.
  SELECT count(*) INTO v_descuadre
    FROM public.courses c
   WHERE c.firmado_por_la_plataforma IS DISTINCT FROM EXISTS (
           SELECT 1 FROM public.users u
            WHERE u.id = c.instructor_id AND u.role = 'admin');

  IF v_descuadre <> 0 THEN
    RAISE EXCEPTION
      '% cursos tienen una firma que no coincide con el rol de su autor. El relleno no ha hecho su trabajo: pararse.',
      v_descuadre;
  END IF;

  -- INVARIANTE 3: ninguna fila del espejo con curso vivo discrepa de su curso.
  SELECT count(*) INTO v_desacuerdo
    FROM public.courses_publicados cp
    JOIN public.courses c ON c.id = cp.id
   WHERE cp.firmado_por_la_plataforma IS DISTINCT FROM c.firmado_por_la_plataforma;

  IF v_desacuerdo <> 0 THEN
    RAISE EXCEPTION
      '% filas del espejo quedaron con una firma distinta a la de su curso. El relleno no ha hecho su trabajo: pararse.',
      v_desacuerdo;
  END IF;


  IF v_huerfanas <> 0 THEN
    RAISE WARNING
      'Hay % filas en el espejo cuyo curso de trabajo ya no existe. Se quedan sin firmar (false) porque no hay de donde copiar. Medido hoy: 0. El trigger de borrado que añade esta migracion es justo lo que impide que aparezcan mas.',
      v_huerfanas;
  END IF;

  RAISE NOTICE 'RELLENO  todos con autor, la firma cuadra con su autor, el espejo no discrepa  PASA';
END
$relleno$;

-- ============================================================================
-- 3. La firma la cambia solo un admin
-- ============================================================================
-- SOLO MIRA CUANDO LA FIRMA CAMBIA. Hace falta que sea asi: varias rutas
-- escriben `courses` con el cliente de servicio para llevar contadores de
-- matricula, y esas no tocan esta columna. Si el trigger mirase en cada UPDATE,
-- las bloquearia sin motivo.
--
-- NO EXIME A service_role, igual que el trigger de la cuenta admin de la 100. Lo
-- unico exento es `postgres` y `supabase_admin`, que son las migraciones y el
-- editor SQL. Si algun dia el panel necesita cambiarla, lo hara con el cliente de
-- SESION —que es lo que usa hoy para casi todo— y entonces es_admin_actual() dira
-- que si. Y si alguien lo intenta con el cliente de servicio, el error le dira
-- exactamente por que.

CREATE OR REPLACE FUNCTION public.la_firma_de_la_plataforma()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_antes boolean := CASE WHEN TG_OP = 'INSERT' THEN false
                          ELSE OLD.firmado_por_la_plataforma END;
BEGIN
  IF NEW.firmado_por_la_plataforma IS NOT DISTINCT FROM v_antes THEN
    RETURN NEW;
  END IF;

  IF current_user IN ('postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF public.es_admin_actual() THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION
    'La firma de la plataforma la pone y la quita solo la administracion: dice que el curso lo firma Nodo360 y no una persona. Si hace falta cambiarla desde el panel, hay que hacerlo con la sesion de un admin, no con la clave de servicio.'
    USING ERRCODE = '42501';
END
$fn$;

COMMENT ON FUNCTION public.la_firma_de_la_plataforma() IS
  'courses.firmado_por_la_plataforma solo la cambia un admin con sesion (o una migracion). Solo actua cuando el valor cambia, para no estorbar a los UPDATE de contadores que hace el cliente de servicio.';

REVOKE ALL ON FUNCTION public.la_firma_de_la_plataforma() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_la_firma_de_la_plataforma ON public.courses;
CREATE TRIGGER trg_la_firma_de_la_plataforma
  BEFORE INSERT OR UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.la_firma_de_la_plataforma();

-- ============================================================================
-- 4. La exencion, por rol de base de datos
-- ============================================================================
-- Lo unico que cambia en las dos funciones es la primera condicion. El resto del
-- cuerpo se copia tal cual para no cambiar ninguna regla de paso.

CREATE OR REPLACE FUNCTION public.controlar_publicacion_de_cursos()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  SOLO_ADMIN constant text[] := ARRAY['published', 'rejected'];
  v_especialidad text;
  v_exige        boolean;
BEGIN
  -- EL SERVIDOR, POR SU ROL DE BASE, y no «quien no tenga identidad». Antes era
  -- `IF auth.uid() IS NULL THEN RETURN NEW`, y la clave anonima tambien tiene
  -- auth.uid() nulo: eximia a un visitante igual que al servidor. Hoy no era
  -- alcanzable —la RLS no le da filas a anon— pero la condicion decia otra cosa
  -- de la que queria decir.
  IF current_user IN ('postgres', 'supabase_admin', 'service_role') THEN
    RETURN NEW;
  END IF;

  IF public.es_admin_actual() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status::text IS DISTINCT FROM 'draft' THEN
      RAISE EXCEPTION
        'Un curso nuevo solo puede nacer en borrador; se intento "%". Publicar o rechazar lo decide la administracion.',
        NEW.status
        USING ERRCODE = '42501';
    END IF;

    IF NEW.review_status IS DISTINCT FROM 'none' THEN
      RAISE EXCEPTION
        'Un curso nuevo nace sin revisar; se intento review_status="%".',
        NEW.review_status
        USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
  END IF;

  IF NEW.status::text IS DISTINCT FROM OLD.status::text THEN
    IF NEW.status::text = ANY (SOLO_ADMIN) THEN
      RAISE EXCEPTION
        'Solo la administracion puede dejar un curso en "%". Para pedir la publicacion, enviar a revision.',
        NEW.status
        USING ERRCODE = '42501';
    END IF;

    IF OLD.status::text = 'pending_review' AND NEW.status::text <> 'draft' THEN
      RAISE EXCEPTION
        'El curso esta pendiente de revision: desde ahi solo puede volver a borrador.'
        USING ERRCODE = '42501';
    END IF;

    IF NEW.status::text = 'pending_review' THEN
      IF NEW.specialty_id IS NULL THEN
        RAISE EXCEPTION
          'Este curso no tiene especialidad asignada: clasificalo antes de enviarlo a revision.'
          USING ERRCODE = '42501';
      END IF;

      SELECT e.nombre, e.requiere_acreditacion
        INTO v_especialidad, v_exige
        FROM public.instructor_specialties e
       WHERE e.id = NEW.specialty_id;

      IF v_exige AND NEW.jurisdiccion IS NULL THEN
        RAISE EXCEPTION
          '«%» explica normativa de un pais: indica la jurisdiccion del curso antes de enviarlo a revision.',
          v_especialidad
          USING ERRCODE = '42501';
      END IF;

      IF NOT public.puede_ensenar(NEW.specialty_id, NEW.jurisdiccion) THEN
        RAISE EXCEPTION
          'No estas verificado para enseñar «%»%. Pide la verificacion antes de enviar un curso de esta especialidad a revision.',
          coalesce(v_especialidad, 'esa especialidad'),
          CASE WHEN v_exige AND NEW.jurisdiccion IS NOT NULL
               THEN ' en ' || NEW.jurisdiccion ELSE '' END
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END
$fn$;

COMMENT ON FUNCTION public.controlar_publicacion_de_cursos() IS
  'Un curso nace en borrador y solo la administracion lo deja en published o rejected. Desde la 121 la exencion es por ROL DE BASE (postgres, supabase_admin, service_role) y no por ausencia de identidad, que tambien eximia a la clave anonima.';

CREATE OR REPLACE FUNCTION public.la_fecha_de_publicacion_no_se_borra()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $fn$
BEGIN
  -- Igual que arriba: el servidor por su rol, no por no tener identidad.
  IF current_user IN ('postgres', 'supabase_admin', 'service_role') THEN
    RETURN NEW;
  END IF;

  -- Nada que mirar si no cambia.
  IF NEW.published_at IS NOT DISTINCT FROM OLD.published_at THEN
    RETURN NEW;
  END IF;

  -- La primera vez se puede poner.
  IF OLD.published_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- Ya estaba puesta. A NULL no vuelve, y aqui no se hace excepcion con la
  -- administracion: lo que retira un curso del catalogo es `status`, no borrar la
  -- prueba de que estuvo publicado.
  IF NEW.published_at IS NULL THEN
    RAISE EXCEPTION
      'La fecha de publicacion de un curso no se borra: es la prueba de que estuvo publicado, y de ella dependen las protecciones del curso. Para retirarlo del catalogo cambia su estado.'
      USING ERRCODE = '42501';
  END IF;

  -- Cambiarla por otra solo la administracion, para corregir un error.
  IF NOT public.es_admin_actual() THEN
    RAISE EXCEPTION
      'La fecha de publicacion de un curso no la cambia su autor. Pidelo a la administracion.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END
$fn$;

COMMENT ON FUNCTION public.la_fecha_de_publicacion_no_se_borra() IS
  'published_at significa «se publico alguna vez» y es la condicion de los triggers de la 114 y la 115. Impide volverla a NULL con una sesion abierta, y que quien no es admin la cambie. Desde la 121 la exencion es por ROL DE BASE y no por ausencia de identidad.';

-- ============================================================================
-- 5. No se borra un curso con copia publicada viva
-- ============================================================================

CREATE OR REPLACE FUNCTION public.no_borrar_un_curso_con_copia_viva()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $fn$
BEGIN
  -- LA SALIDA DE EMERGENCIA, con el patron de la 100: hay que decirlo en la misma
  -- transaccion, y muere con ella. NO exime a service_role: el panel y las rutas
  -- de la API entran justo por ahi, que es de lo que hay que proteger el catalogo.
  IF coalesce(current_setting('app.permitir_borrar_publicado', true), '') = 'on' THEN
    RETURN OLD;
  END IF;

  IF EXISTS (SELECT 1 FROM public.courses_publicados cp
              WHERE cp.id = OLD.id AND cp.retirada_el IS NULL) THEN
    RAISE EXCEPTION
      'Este curso esta publicado: su copia sigue viva en el catalogo y la leen los alumnos. Despublicalo o archivalo antes de borrarlo (las dos cosas retiran la copia), y entonces se puede borrar.'
      USING ERRCODE = '42501';
  END IF;

  RETURN OLD;
END
$fn$;

COMMENT ON FUNCTION public.no_borrar_un_curso_con_copia_viva() IS
  'Borrar un curso de trabajo publicado dejaba su copia VIVA y legible por anon, porque no hay clave ajena del espejo hacia courses (y no se añade: con CASCADE destruiria el ancla de los certificados y con RESTRICT nada se podria borrar). Con la copia ya retirada deja borrar, y la fila del espejo se queda: de ella cuelgan el progreso y los certificados.';

REVOKE ALL ON FUNCTION public.no_borrar_un_curso_con_copia_viva() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_no_borrar_un_curso_con_copia_viva ON public.courses;
CREATE TRIGGER trg_no_borrar_un_curso_con_copia_viva
  BEFORE DELETE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.no_borrar_un_curso_con_copia_viva();

-- ============================================================================
-- 6. AUTOPRUEBA
-- ============================================================================
-- Crea sus propias filas y las borra: no deja nada.
--
-- QUE ESTA MEDIDO Y QUE NO, porque la regla de CLAUDE.md pide decirlo:
--   · El caso de la prueba 7 —borrar un curso publicado deja la copia viva y
--     legible por anon— se REPRODUJO antes de escribir esto, con un curso de usar
--     y tirar y la clave anonima leyendolo despues del borrado.
--   · La prueba 5 se vio EN ROJO de la peor manera: el primer intento de aplicar
--     esta migracion se levanto con 42703 porque al espejo le faltaba la columna.
--     Y la mitad del valor se midio aparte, con un curso de usar y tirar y una
--     columna booleana que ya existia en los dos lados: el espejo decia `false`
--     mientras el origen decia `true` hasta que se republico. Ese es exactamente
--     el estado que la prueba 5 rechaza.
--   · Las pruebas 1, 4, 5, 8 y 9 llevan un «NO SE PUDO MONTAR» aparte del fallo. Es
--     la unica forma de que un montaje imposible no se lea como un verde: un
--     UPDATE que la RLS deja en cero filas no da error, y sin distinguirlo esta
--     autoprueba diria PASA sin haber ejercitado nada.
--   · Lo que esta autoprueba NO puede ejercitar es la via de «sesion sin
--     identidad», porque la RLS no le da filas antes de que el trigger opine. Eso
--     lo comprueba la fila de verificacion leyendo el cuerpo de las funciones.

DO $prueba$
DECLARE
  v_instructor uuid;
  v_curso      uuid;
  v_modulo     uuid;
  v_otro       uuid;
  v_rol        text;
  v_paso       boolean;
  v_toco       boolean;
  v_firma      boolean;
  v_firma2     boolean;
  v_version    integer;
  v_version2   integer;
BEGIN
  -- ── 0. El rol de base, que es de lo que dependen dos triggers ──────────────
  -- SI ESTO NO SALE 'service_role', PARARSE. El diseño de los dos triggers se
  -- apoya en que el cliente de servicio llega con ese nombre de rol.
  SET LOCAL ROLE service_role;
  v_rol := current_user;
  RESET ROLE;
  IF v_rol <> 'service_role' THEN
    RAISE EXCEPTION
      'PRUEBA 0 FALLIDA: con SET LOCAL ROLE service_role, current_user dice «%». Los dos triggers de esta migracion se apoyan en ese nombre: parar y revisar el diseño antes de aplicar nada.',
      v_rol;
  END IF;
  RAISE NOTICE 'PRUEBA 0  current_user es «service_role» cuando toca              PASA';

  -- ── Fixture: un curso de usar y tirar, con modulo y leccion ────────────────
  -- Con contenido a proposito: `publicar_curso_interno` copia modulos y lecciones,
  -- y asi las pruebas 5 a 9 trabajan sobre un curso con espejo completo.
  --
  -- Las claims se dejan en '{}' —no en ''—: segun la version de auth.uid(),
  -- ''::jsonb se levanta con «invalid input syntax for type json». La 119 ya lo
  -- hace asi.
  PERFORM set_config('request.jwt.claims', '{}', true);

  SELECT id INTO v_instructor FROM public.users WHERE role = 'instructor' LIMIT 1;
  IF v_instructor IS NULL THEN
    RAISE EXCEPTION 'No hay ningun instructor en la base, y la autoprueba necesita impersonar a uno.';
  END IF;

  INSERT INTO public.courses (title, slug, description, level, status, is_free, instructor_id)
  VALUES ('PRUEBA 121a firma', 'qa-121a-' || substr(md5(random()::text), 1, 8),
          'x', 'beginner', 'draft', true, v_instructor)
  RETURNING id INTO v_curso;

  INSERT INTO public.modules (course_id, title, order_index)
  VALUES (v_curso, 'Modulo de prueba', 0)
  RETURNING id INTO v_modulo;

  INSERT INTO public.lessons (course_id, module_id, title, slug, order_index, content)
  VALUES (v_curso, v_modulo, 'Leccion de prueba',
          'qa-121a-l-' || substr(md5(random()::text), 1, 8), 0, 'x');

  -- ── 1. Un instructor NO puede ponerse la firma ─────────────────────────────
  -- OJO CON LO QUE SE MIDE: un UPDATE que la RLS deja en cero filas NO da error.
  -- Si pasara eso, esta prueba no habria probado nada, y decirlo es obligatorio:
  -- un verde que no ha medido es peor que un rojo.
  v_paso := false;
  v_toco := false;
  BEGIN
    SET LOCAL ROLE authenticated;
    PERFORM set_config('request.jwt.claims',
                       json_build_object('sub', v_instructor)::text, true);
    UPDATE public.courses SET firmado_por_la_plataforma = true WHERE id = v_curso;
    v_toco := FOUND;
    v_paso := true;
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '{}', true);

  IF v_paso AND v_toco THEN
    RAISE EXCEPTION 'PRUEBA 1 FALLIDA: un instructor pudo ponerse la firma de la plataforma.';
  END IF;
  IF v_paso AND NOT v_toco THEN
    RAISE EXCEPTION
      'PRUEBA 1 NO SE PUDO MONTAR: el UPDATE del instructor no dio error pero no toco ninguna fila, asi que la RLS se lo quito antes de que opinara el trigger. Hay que montarla de otra forma, no darla por buena.';
  END IF;
  IF (SELECT firmado_por_la_plataforma FROM public.courses WHERE id = v_curso) THEN
    RAISE EXCEPTION 'PRUEBA 1 FALLIDA: la firma quedo puesta aunque el UPDATE diera error.';
  END IF;
  RAISE NOTICE 'PRUEBA 1  un instructor no se pone la firma (42501, fila intacta)  PASA';

  -- ── 2. Pero sigue pudiendo editar su curso ─────────────────────────────────
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_instructor)::text, true);
  UPDATE public.courses SET title = 'PRUEBA 121a firma (editado)' WHERE id = v_curso;
  v_toco := FOUND;
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '{}', true);
  IF NOT v_toco THEN
    RAISE EXCEPTION
      'PRUEBA 2 NO SE PUDO MONTAR: el instructor no pudo editar su propio curso, asi que la prueba 1 tampoco estaba midiendo el trigger. Parar.';
  END IF;
  IF (SELECT title FROM public.courses WHERE id = v_curso) <> 'PRUEBA 121a firma (editado)' THEN
    RAISE EXCEPTION 'PRUEBA 2 FALLIDA: el trigger de la firma esta estorbando a un UPDATE normal.';
  END IF;
  RAISE NOTICE 'PRUEBA 2  edita su curso como siempre (y la 1 medía de verdad)     PASA';

  -- ── 3. Una migracion si puede ponerla y quitarla ───────────────────────────
  UPDATE public.courses SET firmado_por_la_plataforma = true WHERE id = v_curso;
  IF NOT (SELECT firmado_por_la_plataforma FROM public.courses WHERE id = v_curso) THEN
    RAISE EXCEPTION 'PRUEBA 3 FALLIDA: una migracion no pudo poner la firma.';
  END IF;
  UPDATE public.courses SET firmado_por_la_plataforma = false WHERE id = v_curso;
  RAISE NOTICE 'PRUEBA 3  una migracion si la pone y la quita                     PASA';

  -- ── 4. El dueño que no es admin sigue sin poder publicar ───────────────────
  -- Esta es la regla de siempre, y se comprueba que el cambio de exencion no la
  -- ha aflojado. Lo que NO se puede comprobar aqui es la via de «sesion sin
  -- identidad»: medido antes, la RLS no le da filas a `authenticated` sin uid, asi
  -- que el trigger no llega a opinar y montarlo seria fingir una prueba. Que la
  -- exencion es por ROL DE BASE y no por falta de identidad lo comprueba la fila de
  -- verificacion, leyendo el cuerpo de las dos funciones.
  v_paso := false;
  v_toco := false;
  BEGIN
    SET LOCAL ROLE authenticated;
    PERFORM set_config('request.jwt.claims',
                       json_build_object('sub', v_instructor)::text, true);
    UPDATE public.courses SET status = 'published' WHERE id = v_curso;
    v_toco := FOUND;
    v_paso := true;
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '{}', true);
  IF v_paso AND v_toco THEN
    RAISE EXCEPTION 'PRUEBA 4 FALLIDA: el autor de un curso pudo publicarlo el mismo.';
  END IF;
  IF (SELECT status::text FROM public.courses WHERE id = v_curso) <> 'draft' THEN
    RAISE EXCEPTION 'PRUEBA 4 FALLIDA: el curso cambio de estado aunque el UPDATE no debiera pasar.';
  END IF;
  RAISE NOTICE 'PRUEBA 4  el autor no publica su propio curso                     PASA';

  -- ── 5. LA FIRMA LLEGA A LA COPIA PUBLICADA ─────────────────────────────────
  -- La comprobacion que faltaba, y que es la razon de que el primer intento de
  -- esta migracion no se aplicara. Dos cosas se miden aqui:
  --   · que publicar no se levante, es decir que al espejo no le falte la columna
  --     (si faltara, `columnas_a_copiar` da 42703 y no se publica nada);
  --   · y que el VALOR viaje, no solo que exista el hueco. Sin esto, la columna
  --     podria estar en el espejo y quedarse en false para siempre.
  UPDATE public.courses SET firmado_por_la_plataforma = true WHERE id = v_curso;
  UPDATE public.courses
     SET status = 'published', published_at = now()
   WHERE id = v_curso;

  SELECT cp.firmado_por_la_plataforma, cp.version
    INTO v_firma, v_version
    FROM public.courses_publicados cp
   WHERE cp.id = v_curso AND cp.retirada_el IS NULL;

  IF v_firma IS NULL THEN
    RAISE EXCEPTION
      'PRUEBA 5 NO SE PUDO MONTAR: al publicar no quedo copia viva en el espejo. Parar y mirar el trigger de la 119.';
  END IF;
  IF NOT v_firma THEN
    RAISE EXCEPTION
      'PRUEBA 5 FALLIDA: el curso esta firmado por la plataforma y su copia publicada dice que no. La columna esta en el espejo pero el valor no viaja: sin esto, en cuanto las fichas se lean del espejo (bloque 3) los cursos de la plataforma saldrian firmados por una persona.';
  END IF;
  RAISE NOTICE 'PRUEBA 5  la firma llega a la copia publicada al publicar          PASA';

  -- ── 6. Y se refresca al republicar, no antes ───────────────────────────────
  -- Una copia es una copia: el espejo no se entera de los cambios del curso de
  -- trabajo hasta que se republica. Las dos mitades importan, porque las fichas
  -- del bloque 3 leeran del espejo y hay que saber cuando cambian.
  UPDATE public.courses SET firmado_por_la_plataforma = false WHERE id = v_curso;

  SELECT cp.firmado_por_la_plataforma INTO v_firma
    FROM public.courses_publicados cp
   WHERE cp.id = v_curso AND cp.retirada_el IS NULL;
  IF NOT v_firma THEN
    RAISE EXCEPTION
      'PRUEBA 6 FALLIDA: el espejo se ha enterado solo de un cambio en el curso de trabajo. La copia publicada no debe moverse hasta que se republique; si se mueve, nadie sabe que esta leyendo un alumno.';
  END IF;

  PERFORM public.publicar_curso(v_curso);

  SELECT cp.firmado_por_la_plataforma, cp.version
    INTO v_firma2, v_version2
    FROM public.courses_publicados cp
   WHERE cp.id = v_curso AND cp.retirada_el IS NULL;
  IF v_firma2 THEN
    RAISE EXCEPTION
      'PRUEBA 6 FALLIDA: al republicar, la copia sigue diciendo que la firma la pone la plataforma. Quitar la firma no llegaria nunca al catalogo.';
  END IF;
  IF v_version2 <= v_version THEN
    RAISE EXCEPTION
      'PRUEBA 6 FALLIDA: republicar no subio la version de la copia (% -> %), asi que no se puede distinguir una copia refrescada de una vieja.',
      v_version, v_version2;
  END IF;
  RAISE NOTICE 'PRUEBA 6  y se refresca al republicar, no antes (version % -> %)    PASA',
    v_version, v_version2;

  -- ── 7. Con copia publicada VIVA no se borra ────────────────────────────────
  v_paso := false;
  BEGIN
    DELETE FROM public.courses WHERE id = v_curso;
    v_paso := true;
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
  IF v_paso THEN
    RAISE EXCEPTION 'PRUEBA 7 FALLIDA: se borro un curso con la copia publicada viva.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.courses WHERE id = v_curso) THEN
    RAISE EXCEPTION 'PRUEBA 7 FALLIDA: el curso desaparecio aunque el DELETE diera error.';
  END IF;
  RAISE NOTICE 'PRUEBA 7  con copia viva el borrado se detiene                    PASA';

  -- ── 8. Archivado: se borra, el espejo se queda Y CONSERVA SU FIRMA ─────────
  SELECT cp.firmado_por_la_plataforma INTO v_firma
    FROM public.courses_publicados cp WHERE cp.id = v_curso;

  UPDATE public.courses SET status = 'archived' WHERE id = v_curso;
  IF EXISTS (SELECT 1 FROM public.courses_publicados
              WHERE id = v_curso AND retirada_el IS NULL) THEN
    RAISE EXCEPTION
      'PRUEBA 8 NO SE PUDO MONTAR: archivar no retiro la copia, asi que no se puede probar el caso bueno del borrado.';
  END IF;

  DELETE FROM public.lessons WHERE course_id = v_curso;
  DELETE FROM public.modules WHERE course_id = v_curso;
  DELETE FROM public.courses WHERE id = v_curso;
  IF EXISTS (SELECT 1 FROM public.courses WHERE id = v_curso) THEN
    RAISE EXCEPTION 'PRUEBA 8 FALLIDA: con la copia retirada el borrado no paso.';
  END IF;

  SELECT cp.firmado_por_la_plataforma INTO v_firma2
    FROM public.courses_publicados cp WHERE cp.id = v_curso;
  IF v_firma2 IS NULL THEN
    RAISE EXCEPTION 'PRUEBA 8 FALLIDA: la fila del espejo se fue con el curso, y es el ancla del progreso y los certificados.';
  END IF;
  IF v_firma2 IS DISTINCT FROM v_firma THEN
    RAISE EXCEPTION
      'PRUEBA 8 FALLIDA: retirar o borrar le cambio la firma a la copia (% -> %). Un certificado viejo tiene que seguir diciendo quien firmaba el curso.',
      v_firma, v_firma2;
  END IF;
  RAISE NOTICE 'PRUEBA 8  se borra, el espejo se queda y conserva su firma         PASA';

  -- ── 9. La salida de emergencia ─────────────────────────────────────────────
  -- El curso nace en borrador y se publica con un UPDATE, igual que en la 5: asi
  -- se dispara el trigger de la copia por el camino que de verdad se usa.
  INSERT INTO public.courses (title, slug, description, level, status, is_free, instructor_id)
  VALUES ('PRUEBA 121a emergencia', 'qa-121a-e-' || substr(md5(random()::text), 1, 8),
          'x', 'beginner', 'draft', true, v_instructor)
  RETURNING id INTO v_otro;
  INSERT INTO public.modules (course_id, title, order_index)
  VALUES (v_otro, 'Modulo', 0);
  UPDATE public.courses SET status = 'published', published_at = now() WHERE id = v_otro;

  IF NOT EXISTS (SELECT 1 FROM public.courses_publicados WHERE id = v_otro AND retirada_el IS NULL) THEN
    RAISE EXCEPTION 'PRUEBA 9 NO SE PUDO MONTAR: el segundo curso no llego a tener copia viva.';
  END IF;

  PERFORM set_config('app.permitir_borrar_publicado', 'on', true);
  DELETE FROM public.lessons WHERE course_id = v_otro;
  DELETE FROM public.modules WHERE course_id = v_otro;
  DELETE FROM public.courses WHERE id = v_otro;
  PERFORM set_config('app.permitir_borrar_publicado', '', true);
  IF EXISTS (SELECT 1 FROM public.courses WHERE id = v_otro) THEN
    RAISE EXCEPTION 'PRUEBA 9 FALLIDA: con la salida de emergencia puesta, el borrado no paso.';
  END IF;
  RAISE NOTICE 'PRUEBA 9  la salida de emergencia deja borrar                     PASA';

  -- ── Limpieza del espejo que dejaron las pruebas ────────────────────────────
  DELETE FROM public.quiz_questions_publicadas
   WHERE module_id IN (SELECT id FROM public.modules_publicados
                        WHERE course_id IN (v_curso, v_otro));
  DELETE FROM public.lessons_publicadas  WHERE course_id IN (v_curso, v_otro);
  DELETE FROM public.modules_publicados  WHERE course_id IN (v_curso, v_otro);
  DELETE FROM public.courses_publicados  WHERE id IN (v_curso, v_otro);

  IF EXISTS (SELECT 1 FROM public.courses WHERE slug LIKE 'qa-121a%')
     OR EXISTS (SELECT 1 FROM public.courses_publicados WHERE slug LIKE 'qa-121a%')
     OR EXISTS (SELECT 1 FROM public.lessons WHERE slug LIKE 'qa-121a%') THEN
    RAISE EXCEPTION 'La autoprueba dejo restos: hay filas con slug qa-121a%%.';
  END IF;
  RAISE NOTICE 'LIMPIEZA  la autoprueba no deja restos                            PASA';
END
$prueba$;

COMMIT;

-- ============================================================================
-- 7. VERIFICACION: una sola fila
-- ============================================================================
-- NINGUN RECUENTO DE PRODUCCION EN EL VEREDICTO. Los recuentos salen como
-- informacion —hacen falta para leer la fila— pero lo que decide son propiedades
-- que valen en cualquier base: las dos columnas puestas, los dos triggers
-- activos, las dos funciones ya por rol de base, y tres ceros que tienen que ser
-- cero siempre.
--
-- Lo que salio el 2026-10-05, para comparar: 15 y 1 en los cursos, 15 y 0 en el
-- espejo, de 15 filas con 10 vivas.

SELECT
  -- Informacion: el reparto de hoy
  (SELECT count(*) FROM public.courses WHERE firmado_por_la_plataforma)            AS firmados_por_la_plataforma,
  (SELECT count(*) FROM public.courses WHERE NOT firmado_por_la_plataforma)        AS firmados_por_persona,
  (SELECT count(*) FROM public.courses_publicados WHERE firmado_por_la_plataforma) AS espejo_firmado_plataforma,
  (SELECT count(*) FROM public.courses_publicados)                                 AS espejo_filas,

  -- Lo que tiene que ser cero SIEMPRE
  (SELECT count(*) FROM public.courses WHERE instructor_id IS NULL)                AS cursos_sin_autor,
  (SELECT count(*) FROM public.courses c
    WHERE c.firmado_por_la_plataforma IS DISTINCT FROM EXISTS (
            SELECT 1 FROM public.users u WHERE u.id = c.instructor_id AND u.role = 'admin'))
                                                                                   AS firma_que_no_cuadra,
  (SELECT count(*) FROM public.courses_publicados cp JOIN public.courses c ON c.id = cp.id
    WHERE cp.firmado_por_la_plataforma IS DISTINCT FROM c.firmado_por_la_plataforma) AS espejo_en_desacuerdo,
  (SELECT count(*) FROM public.courses WHERE slug LIKE 'qa-121a%')                 AS restos,

  -- Lo que tiene que estar puesto
  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name IN ('courses', 'courses_publicados')
      AND column_name = 'firmado_por_la_plataforma'
      AND is_nullable = 'NO' AND column_default = 'false')                          AS columnas_bien_puestas,
  (SELECT tgenabled FROM pg_trigger
    WHERE tgname = 'trg_la_firma_de_la_plataforma')                                AS firma_activo,
  (SELECT tgenabled FROM pg_trigger
    WHERE tgname = 'trg_no_borrar_un_curso_con_copia_viva')                        AS borrado_activo,
  (SELECT count(*) FROM pg_proc p
    WHERE p.proname IN ('controlar_publicacion_de_cursos', 'la_fecha_de_publicacion_no_se_borra')
      AND pg_get_functiondef(p.oid) LIKE '%current_user IN%')                      AS funciones_por_rol_de_base,

  CASE
    WHEN (SELECT count(*) FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name IN ('courses', 'courses_publicados')
             AND column_name = 'firmado_por_la_plataforma'
             AND is_nullable = 'NO' AND column_default = 'false') = 2
     AND (SELECT tgenabled FROM pg_trigger WHERE tgname = 'trg_la_firma_de_la_plataforma') = 'O'
     AND (SELECT tgenabled FROM pg_trigger WHERE tgname = 'trg_no_borrar_un_curso_con_copia_viva') = 'O'
     AND (SELECT count(*) FROM pg_proc p
           WHERE p.proname IN ('controlar_publicacion_de_cursos', 'la_fecha_de_publicacion_no_se_borra')
             AND pg_get_functiondef(p.oid) LIKE '%current_user IN%') = 2
     AND (SELECT count(*) FROM public.courses WHERE instructor_id IS NULL) = 0
     AND (SELECT count(*) FROM public.courses c
           WHERE c.firmado_por_la_plataforma IS DISTINCT FROM EXISTS (
                   SELECT 1 FROM public.users u WHERE u.id = c.instructor_id AND u.role = 'admin')) = 0
     AND (SELECT count(*) FROM public.courses_publicados cp JOIN public.courses c ON c.id = cp.id
           WHERE cp.firmado_por_la_plataforma IS DISTINCT FROM c.firmado_por_la_plataforma) = 0
     AND (SELECT count(*) FROM public.courses WHERE slug LIKE 'qa-121a%') = 0
    THEN 'TODO CORRECTO'
    ELSE 'REVISAR'
  END AS veredicto;

-- ============================================================================
-- 8. VUELTA ATRAS
-- ============================================================================
-- Pegar y ejecutar TAL CUAL para deshacerlo todo. No toca datos de nadie: quita
-- la columna nueva (con lo que la firma vuelve a decidirse por el rol del autor,
-- que es lo de hoy), devuelve las dos funciones a su cuerpo anterior y quita el
-- trigger de borrado.
--
-- BEGIN;
--
-- DROP TRIGGER IF EXISTS trg_no_borrar_un_curso_con_copia_viva ON public.courses;
-- DROP FUNCTION IF EXISTS public.no_borrar_un_curso_con_copia_viva();
--
-- DROP TRIGGER IF EXISTS trg_la_firma_de_la_plataforma ON public.courses;
-- DROP FUNCTION IF EXISTS public.la_firma_de_la_plataforma();
-- ALTER TABLE public.courses DROP COLUMN IF EXISTS firmado_por_la_plataforma;
-- ALTER TABLE public.courses_publicados DROP COLUMN IF EXISTS firmado_por_la_plataforma;
--
-- -- Las dos, y en este orden da igual: lo que no puede quedar es la columna en
-- -- `courses` sin estar en el espejo, porque entonces no se podria publicar nada
-- -- (42703 en columnas_a_copiar). Si solo se quitara una, quitar la del espejo.
--
-- COMMENT ON COLUMN public.courses.owner_id IS NULL;
-- COMMENT ON COLUMN public.courses.owner_role IS NULL;
--
-- -- Las dos funciones, con la exencion por ausencia de identidad que tenian:
-- CREATE OR REPLACE FUNCTION public.la_fecha_de_publicacion_no_se_borra()
-- RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER
-- SET search_path = public, pg_temp
-- AS $fn$
-- DECLARE
--   v_uid uuid := auth.uid();
-- BEGIN
--   IF v_uid IS NULL THEN RETURN NEW; END IF;
--   IF NEW.published_at IS NOT DISTINCT FROM OLD.published_at THEN RETURN NEW; END IF;
--   IF OLD.published_at IS NULL THEN RETURN NEW; END IF;
--   IF NEW.published_at IS NULL THEN
--     RAISE EXCEPTION 'La fecha de publicacion de un curso no se borra: es la prueba de que estuvo publicado, y de ella dependen las protecciones del curso. Para retirarlo del catalogo cambia su estado.' USING ERRCODE = '42501';
--   END IF;
--   IF NOT public.es_admin_actual() THEN
--     RAISE EXCEPTION 'La fecha de publicacion de un curso no la cambia su autor. Pidelo a la administracion.' USING ERRCODE = '42501';
--   END IF;
--   RETURN NEW;
-- END
-- $fn$;
--
-- -- Y controlar_publicacion_de_cursos igual, cambiando solo su primera condicion
-- -- por `IF auth.uid() IS NULL THEN RETURN NEW; END IF;`. El cuerpo entero esta
-- -- en supabase/migrations/109_jurisdiccion_de_las_especialidades.sql, linea 221.
--
-- COMMIT;
-- ============================================================================
