-- ============================================================================
-- 071: la cadena de Web3, y las posiciones de las rutas por primera vez
-- ============================================================================
-- ESTADO: APLICADA. Comprobado contra la base el 2026-10-05 (auditoria v2):
--   existe la restriccion learning_path_courses_ruta_curso_unico, la ruta
--   ecosistema-ethereum esta desactivada y «Como funciona Bitcoin» sigue en dos
--   rutas, que son sus tres condiciones.
--
-- EL ORDEN DE LAS RUTAS NO ESTABA MAL: NO EXISTIA
--   learning_path_courses.position estaba a 0 en casi todas las filas. La ruta
--   1, que es la puerta de entrada y la que tienen activa 6 de las 24 cuentas,
--   tenia sus cuatro cursos a cero: el orden que veia el alumno era el que
--   devolviera Postgres. Esto pone las posiciones por primera vez.
--
--   Comprobado que sirve de algo antes de escribirlo: app/rutas/page.tsx:38 y
--   app/(private)/dashboard/rutas/page.tsx:39 ordenan por position, y
--   lib/db/learning-paths.ts filtra is_active y descarta los cursos que no
--   estan published.
--
-- POR QUE WEB3 VA ANTES DE BLOCKCHAIN
--   El encargo pedia Como funciona -> Blockchain -> Web3 -> Ethereum. El
--   contenido dice lo contrario, y gana el contenido. fundamentos-blockchain
--   tiene SEIS referencias cruzadas a Web3 y apuntan en dos direcciones:
--
--     cuatro dan Web3 por visto
--       M1.3  "lo que Que es Web3 y que no llama contratos"
--       M2.3  "es el motivo principal, y ya aparecio en Que es Web3 y que no"
--       M2.3  "es la de Que es Web3 y que no, desglosada"
--       M3.1  "una senal transversal, que ya viste en Que es Web3 y que no"
--
--     dos lo dan por siguiente
--       M1.1  "al terminar, Que es Web3 y que no es la continuacion natural"
--       M3.3  "la continuacion natural es Que es Web3 y que no, en esta ruta"
--
--   Con Blockchain primero habria que reescribir las cuatro sustantivas y
--   reintroducir en Blockchain el criterio de evaluacion que hoy toma prestado.
--   Con Web3 primero se reescriben las dos navegacionales. Ademas Web3 es
--   beginner y Blockchain intermediate, y el cierre de Web3 aplaza los internos
--   ("fuera a proposito: como funciona una blockchain por dentro"), que solo
--   tiene sentido si Blockchain viene despues.
--
--   Las seis frases NO se tocan aqui. Van en la 072, que es contenido.
--
-- COMO FUNCIONA BITCOIN ENTRA EN DOS RUTAS
--   Y el progreso se comparte solo, sin nada que sincronizar: user_progress va
--   por lesson_id y course_enrollments por (user_id, course_id). Ninguna de las
--   dos tablas sabe que es una ruta. Quien ya lo hizo en la ruta 1 lo vera al
--   100% en la ruta 3.
--
--   Se incluye en vez de declararse como requisito porque courses.requirements
--   esta vacio en los diez cursos publicados y no hay una sola linea de codigo
--   que lo pinte: declarar un requisito hoy es escribirlo en prosa y confiar.
--
-- ETHEREUM SE FUSIONA
--   La ruta 6 tenia un solo curso y cero matriculas. La fila se MUEVE con un
--   UPDATE, no se borra y se recrea, para conservar su id y su created_at. La
--   ruta 6 queda sin cursos y se desactiva; no se borra, porque borrarla haria
--   CASCADE sobre learning_path_courses y perderiamos el rastro. Nadie la tiene
--   como active_path_id, asi que no deja a nadie huerfano.
--
-- EL UNIQUE QUE FALTABA
--   learning_path_courses solo tenia PRIMARY KEY (id) y las dos FOREIGN KEY.
--   Nada impedia meter el mismo curso dos veces en la misma ruta. Comprobado el
--   27/09/2026: 15 filas, 15 pares distintos, 0 duplicados. El bloque 1 lo
--   vuelve a comprobar y aborta si aparece alguno, porque entre la comprobacion
--   y la aplicacion puede pasar cualquier cosa.
--
-- QUE NO SE TOCA
--   El slug web3-basica se queda, aunque el nombre cambie: /rutas/web3-basica
--   esta indexado y hay 1 cuenta con esa ruta activa. Cambiar el slug seria
--   romper una URL por estetica.
--
-- COMO VOLVER ATRAS
--   C:/Users/alber/backups-sql/071-volver-atras.sql.bak, generado antes de
--   aplicar. Devuelve las posiciones a 0, la fila de Ethereum a su ruta, quita
--   Como funciona de la ruta 3, reactiva la ruta 6 y restaura los textos.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1) Antes de nada: que no haya pares duplicados. Si los hay, el UNIQUE de
--    abajo fallaria a medias y conviene verlo dicho, no deducirlo del error.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_dup INTEGER;
  v_detalle TEXT;
BEGIN
  SELECT count(*) INTO v_dup FROM (
    SELECT learning_path_id, course_id
      FROM public.learning_path_courses
     GROUP BY 1, 2
    HAVING count(*) > 1
  ) d;

  IF v_dup > 0 THEN
    SELECT string_agg(lp.slug || ' + ' || c.slug, ', ') INTO v_detalle
      FROM (
        SELECT learning_path_id, course_id
          FROM public.learning_path_courses
         GROUP BY 1, 2
        HAVING count(*) > 1
      ) d
      JOIN public.learning_paths lp ON lp.id = d.learning_path_id
      JOIN public.courses c ON c.id = d.course_id;

    RAISE EXCEPTION 'Hay % par(es) duplicado(s) en learning_path_courses: %. Limpialos antes de anadir el UNIQUE. Abortando.', v_dup, v_detalle;
  END IF;

  RAISE NOTICE 'Sin pares duplicados: se puede anadir el UNIQUE.';
END $$;

-- ----------------------------------------------------------------------------
-- 2) El UNIQUE. Idempotente: si ya existe, no se toca.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'public.learning_path_courses'::regclass
       AND conname = 'learning_path_courses_ruta_curso_unico'
  ) THEN
    ALTER TABLE public.learning_path_courses
      ADD CONSTRAINT learning_path_courses_ruta_curso_unico
      UNIQUE (learning_path_id, course_id);
    RAISE NOTICE 'UNIQUE (learning_path_id, course_id) anadido.';
  ELSE
    RAISE NOTICE 'El UNIQUE ya estaba.';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3) Ethereum se muda de la ruta 6 a la ruta 3. UPDATE, no DELETE + INSERT:
--    la fila conserva su id y su created_at.
-- ----------------------------------------------------------------------------
UPDATE public.learning_path_courses
   SET learning_path_id = (SELECT id FROM public.learning_paths WHERE slug = 'web3-basica')
 WHERE learning_path_id = (SELECT id FROM public.learning_paths WHERE slug = 'ecosistema-ethereum')
   AND course_id = (SELECT id FROM public.courses WHERE slug = 'ethereum-y-contratos-inteligentes');

-- ----------------------------------------------------------------------------
-- 4) Como funciona Bitcoin entra tambien en la ruta 3. Segunda ruta para el
--    mismo curso; el progreso ya se comparte por construccion.
-- ----------------------------------------------------------------------------
INSERT INTO public.learning_path_courses (learning_path_id, course_id, position, is_required)
SELECT lp.id, c.id, 1, true
  FROM public.learning_paths lp
 CROSS JOIN public.courses c
 WHERE lp.slug = 'web3-basica'
   AND c.slug = 'como-funciona-bitcoin-nivel-basico'
ON CONFLICT (learning_path_id, course_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5) Las posiciones, todas de golpe y por slug para que se lean solas.
--
--    Los cursos archivados van a 90+. Hoy learning-paths.ts ya los descarta por
--    status, asi que no se ven; pero getNextLessonUrl() en app/rutas/page.tsx NO
--    los filtra al calcular la siguiente leccion, y con position 0 podian caer
--    ANTES que los publicados. A 90 dejan de estorbar.
--
--    El orden de las rutas 1, 2 y 4 no es una invencion: sale de lo que ya
--    dicen los cursos. uso-practico cierra con "si has llegado hasta aqui desde
--    Fundamentos de Bitcoin y Como funciona Bitcoin, has completado la ruta
--    entera", y uso-practico remite a Cold Storage como el paso de despues de
--    Seguridad basica.
-- ----------------------------------------------------------------------------
UPDATE public.learning_path_courses lpc
   SET position = v.pos
  FROM (VALUES
    -- ruta 1: la puerta de entrada
    ('fundamentos-bitcoin',  'fundamentos-de-bitcoin',                           1),
    ('fundamentos-bitcoin',  'como-funciona-bitcoin-nivel-basico',               2),
    ('fundamentos-bitcoin',  'uso-practico-de-bitcoin',                          3),
    ('fundamentos-bitcoin',  'bitcoin-como-sistema-monetario',                  90),  -- archivado
    -- ruta 2: seguridad
    ('seguridad-cripto',     'seguridad-basica-en-bitcoin-y-criptomonedas',      1),
    ('seguridad-cripto',     'cold-storage-protege-tus-bitcoin',                 2),
    ('seguridad-cripto',     'custodia-y-proteccion-de-tus-fondos',             90),  -- archivado
    ('seguridad-cripto',     'custodia-y-proteccion-practica-de-criptomonedas', 91),  -- archivado
    -- ruta 3: la cadena entera, que es lo que motiva esta migracion
    ('web3-basica',          'como-funciona-bitcoin-nivel-basico',               1),
    ('web3-basica',          'introduccion-a-web3',                              2),
    ('web3-basica',          'fundamentos-blockchain',                           3),
    ('web3-basica',          'ethereum-y-contratos-inteligentes',                4),
    ('web3-basica',          'ecosistema-web3-explicado',                       90),  -- archivado
    -- ruta 4: trading
    ('trading-basico',       'introduccion-al-trading-de-criptomonedas',         1),
    ('trading-basico',       'gestion-del-riesgo-y-mentalidad-en-trading',      90),  -- archivado
    -- ruta 5: tecnico
    ('bitcoin-tecnico',      'nodos-bitcoin-tu-soberania-tecnica',               1)
  ) AS v(ruta, curso, pos)
 WHERE lpc.learning_path_id = (SELECT id FROM public.learning_paths WHERE slug = v.ruta)
   AND lpc.course_id        = (SELECT id FROM public.courses        WHERE slug = v.curso);

-- ----------------------------------------------------------------------------
-- 6) La ruta 6 queda vacia: se desactiva. is_active se respeta en cuatro sitios
--    de lib/db/learning-paths.ts, asi que desaparece de los listados.
-- ----------------------------------------------------------------------------
UPDATE public.learning_paths
   SET is_active = false,
       updated_at = NOW()
 WHERE slug = 'ecosistema-ethereum';

-- ----------------------------------------------------------------------------
-- 7) Los textos de la ruta 3, que describian tres cursos de Web3 y ahora
--    describen la cadena de cuatro. El slug NO cambia.
--
--    La pregunta que hilaba la ruta de Ethereum se conserva: era lo mejor que
--    tenia y al desactivarla se perderia de la interfaz.
-- ----------------------------------------------------------------------------
UPDATE public.learning_paths
   SET name = 'Web3 y blockchain',
       subtitle = 'Entender antes de usar',
       short_description = $txt$Qué propone Web3, en qué se diferencian las demás cadenas y qué cambia cuando una red ejecuta programas en vez de anotar pagos. Con criterio para evaluar un proyecto antes de tocarlo.$txt$,
       long_description = $txt$Web3 se cuenta casi siempre desde un bando. Esta ruta describe: qué sustituye por qué, qué se paga a cambio y qué condiciones tienen que cumplirse para que el resultado sea el prometido.

Empieza por el mecanismo de Bitcoin, porque es la referencia con la que se compara todo lo demás. Sigue con lo que Web3 propone y qué parte está realmente descentralizada, entra en qué fue una decisión de Bitcoin y qué es general a cualquier cadena, y termina en las redes que no anotan pagos sino que ejecutan programas.

Ahí el hilo es una pregunta que la mayoría de las explicaciones deja sin responder: ¿quién puede cambiar esto después de que lo hayas revisado, y qué hace falta para que lo cambie?

No enseña a programar y no sirve para saber si algo va a funcionar. Sirve para saber de qué depende.$txt$,
       updated_at = NOW()
 WHERE slug = 'web3-basica';

-- ----------------------------------------------------------------------------
-- 8) Comprobacion. Si algo no ha quedado como toca, aborta la transaccion.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_cadena TEXT;
  v_ceros INTEGER;
  v_ruta6 INTEGER;
  v_dos_rutas INTEGER;
BEGIN
  -- la cadena de la ruta 3, en orden
  SELECT string_agg(c.slug, ' -> ' ORDER BY lpc.position) INTO v_cadena
    FROM public.learning_path_courses lpc
    JOIN public.courses c ON c.id = lpc.course_id
   WHERE lpc.learning_path_id = (SELECT id FROM public.learning_paths WHERE slug = 'web3-basica')
     AND c.status = 'published';

  IF v_cadena IS DISTINCT FROM
     'como-funciona-bitcoin-nivel-basico -> introduccion-a-web3 -> fundamentos-blockchain -> ethereum-y-contratos-inteligentes'
  THEN
    RAISE EXCEPTION 'La cadena de la ruta 3 no es la esperada: %. Abortando.', v_cadena;
  END IF;

  -- no debe quedar ninguna fila a 0
  SELECT count(*) INTO v_ceros FROM public.learning_path_courses WHERE position = 0 OR position IS NULL;
  IF v_ceros > 0 THEN
    RAISE EXCEPTION 'Quedan % filas con position 0 o NULL. Abortando.', v_ceros;
  END IF;

  -- la ruta 6 sin cursos y desactivada
  SELECT count(*) INTO v_ruta6
    FROM public.learning_path_courses
   WHERE learning_path_id = (SELECT id FROM public.learning_paths WHERE slug = 'ecosistema-ethereum');
  IF v_ruta6 > 0 THEN
    RAISE EXCEPTION 'La ruta ecosistema-ethereum sigue con % curso(s). Abortando.', v_ruta6;
  END IF;

  IF (SELECT is_active FROM public.learning_paths WHERE slug = 'ecosistema-ethereum') THEN
    RAISE EXCEPTION 'La ruta ecosistema-ethereum sigue activa. Abortando.';
  END IF;

  -- Como funciona Bitcoin, en dos rutas
  SELECT count(*) INTO v_dos_rutas
    FROM public.learning_path_courses
   WHERE course_id = (SELECT id FROM public.courses WHERE slug = 'como-funciona-bitcoin-nivel-basico');
  IF v_dos_rutas <> 2 THEN
    RAISE EXCEPTION 'Como funciona Bitcoin esta en % ruta(s), se esperaban 2. Abortando.', v_dos_rutas;
  END IF;

  RAISE NOTICE 'OK. Cadena de la ruta 3: %', v_cadena;
  RAISE NOTICE 'OK. Ninguna fila con position 0, ruta 6 vacia y desactivada, Como funciona en 2 rutas.';
END $$;

COMMIT;

-- ============================================================================
-- DESPUES DE APLICAR
--   Lo que queda es la 072, que es contenido y va aparte porque toca nueve
--   lecciones:
--
--     1. Las seis referencias cruzadas de fundamentos-blockchain: las dos
--        navegacionales pasan a apuntar a Ethereum, que es lo que viene ahora.
--     2. El cierre de introduccion-a-web3, que dice que "como funciona una
--        blockchain por dentro" no esta en la plataforma cuando es el curso
--        siguiente de su propia ruta.
--     3. Los cinco cierres sin Blockchain ni Ethereum: fundamentos-de-bitcoin,
--        como-funciona-bitcoin, uso-practico, introduccion-a-web3 y el de
--        blockchain.
--     4. La cita de como-funciona-bitcoin 2.2, que manda a "Fundamentos de
--        Bitcoin, modulo 3" cuando la emision se ensena en Fundamentos 2.2.
--        El modulo 3 de Fundamentos es "Bitcoin como sistema monetario".
--
--   Y dos cosas sueltas que aparecieron en el barrido, para decidir aparte:
--     - getNextLessonUrl() en app/rutas/page.tsx no filtra por status, asi que
--       puede mandar a un curso archivado. Con position 90 deja de ser probable,
--       pero el filtro sigue faltando.
--     - Hay un fichero middleware.ts.ts en la raiz, con doble extension. No lo
--       carga Next: el middleware real es middleware.ts.
-- ============================================================================
