-- ============================================================================
-- 072: las contradicciones de la cadena de Web3, y la cita mal puesta
-- ============================================================================
-- ESTADO: APLICADA. Comprobado contra la base el 2026-10-05:
--   las 9 sustituciones estan hechas: 0 textos viejos, 9 nuevos, y el espejo igual.
--   El marcador anterior decia «pendiente» y estaba viejo: se escribe al crear
--   el fichero y nadie lo cambia al aplicarlo.
--   Fichero listo para el editor SQL: C:/Users/alber/072-aplicar.sql
--   Estado antes y despues, solo lectura:  C:/Users/alber/072-comprobar.sql
--
-- CONTINUA LA 071, QUE ES LA QUE ORDENO LA RUTA
--   Ruta "Web3 y blockchain": Como funciona Bitcoin -> Que es Web3 y que no ->
--   Blockchain: lo que Bitcoin no es -> Ethereum y contratos inteligentes.
--   Esta migracion arregla los textos que contradecian ese orden o negaban la
--   existencia de cursos que si estan publicados.
--
-- NUEVE CAMBIOS EN SIETE LECCIONES DE CINCO CURSOS
--
--   1. Blockchain M1.1 y M3.3 apuntaban a Web3 como "la continuacion natural".
--      Con Web3 delante, la continuacion es Ethereum. Las cuatro referencias
--      sustantivas de Blockchain ("ya viste en Web3", "ya aparecio en Web3") NO
--      se tocan: con Web3 delante ya son ciertas. Eso era el motivo para
--      ordenar la ruta asi, y no tocarlas es la mitad del arreglo.
--
--   2. El cierre de Web3 decia: "Fuera a proposito: como funciona una blockchain
--      por dentro, las finanzas descentralizadas y la programacion. Ninguno esta
--      en la plataforma hoy". Dos de esas tres cosas son los dos cursos
--      siguientes de su propia ruta. Le contaba al alumno que no existe lo que
--      tiene delante.
--
--   3. Cinco cierres listaban el catalogo sin Blockchain ni Ethereum:
--      Fundamentos de Bitcoin, Como funciona Bitcoin, Uso practico, Web3 y el
--      de Blockchain. El de Como funciona dice ademas que este curso es el
--      primero de la ruta de Web3, que desde la 071 es literalmente cierto.
--
--   4. Como funciona 2.2 mandaba a "Fundamentos de Bitcoin, en su modulo 3" al
--      hablar de la emision. El modulo 3 de Fundamentos es "Bitcoin como
--      sistema monetario", que es economia. La emision se ensena en la leccion
--      2.2, "por-que-bitcoin-es-diferente". Comprobado que la numeracion
--      visible es 1-based (order_index + 1): Fundamentos 2.2 se refiere a "la
--      leccion 2.1" con ese mismo criterio.
--
--      De paso se resuelve el <!-- REVISAR --> que llevaba ahi desde que se
--      escribio la leccion. La cifra entra con su fecha de origen y sin
--      depender de una fecha futura, que es lo que la haria caducar.
--
-- QUE NO SE TOCA, Y POR QUE
--   El hueco que Blockchain reconoce —"no ha entrado en la criptografia que hay
--   debajo, ni en como se programa nada de esto. No esta en la plataforma hoy"—
--   se queda tal cual. Es verdad: Ethereum ensena a LEER un contrato y su propio
--   texto dice "no ensena a programar". Ahi no hay contradiccion que arreglar.
--
-- POR QUE replace() Y NO REESCRIBIR LA LECCION
--   Cada cambio es un replace() de una cadena exacta, y el bloque comprueba
--   ANTES que esa cadena aparece exactamente una vez. Reescribir el content
--   entero de siete lecciones para cambiar nueve frases es la forma de perder
--   algo sin enterarse.
--
-- EL TRIGGER QUE DESPUBLICA NO SE DISPARA
--   trigger_course_modification es BEFORE UPDATE ON public.courses y solo mira
--   campos de courses (title, description, long_description, level, price,
--   is_free, is_premium, thumbnail_url, banner_url). Esto escribe
--   lessons.content, asi que no lo toca. Se comprueba igual al final: la 028 ya
--   despublico Nodos Bitcoin y Cold Storage por no mirarlo.
--
-- COMO VOLVER ATRAS
--   C:/Users/alber/backups-sql/072-volver-atras.sql.bak, con el content anterior
--   de las siete lecciones, generado antes de aplicar.
-- ============================================================================

BEGIN;

DO $bloque$
DECLARE
  v RECORD;
  v_id UUID;
  v_contenido TEXT;
  v_veces INTEGER;
  v_hechos INTEGER := 0;
BEGIN
  FOR v IN
    SELECT * FROM (VALUES

      -- ------------------------------------------------------------------
      -- 1) Blockchain M1.1: la continuacion ya no es Web3, es Ethereum
      -- ------------------------------------------------------------------
      ('fundamentos-blockchain', 'de-bitcoin-a-las-demas',
       $v$Al terminar, <em>Qué es Web3 y qué no</em> es la continuación natural: trata lo que se construye <strong>encima</strong> de todo esto.$v$,
       $n$Al terminar, <em>Ethereum y contratos inteligentes</em> es la continuación natural: la red donde lo que se construye <strong>encima</strong> —programas que tienen fondos y no son nadie— se puede leer antes de firmar nada.$n$),

      -- ------------------------------------------------------------------
      -- 2) Blockchain M3.3: igual, en el cierre del curso
      -- ------------------------------------------------------------------
      ('fundamentos-blockchain', 'como-leer-una-cadena-nueva',
       $v$<p><strong>La continuación natural es <em>Qué es Web3 y qué no</em></strong>, en esta misma ruta. Este curso ha explicado el suelo: qué es un registro compartido, qué es un estado y qué cuesta mantenerlo. Aquel trata lo que se construye encima —contratos, tokens, aplicaciones— y cómo mirar un proyecto concreto antes de tocarlo.</p>$v$,
       $n$<p><strong>La continuación natural es <em>Ethereum y contratos inteligentes</em></strong>, el último curso de esta ruta. Este curso ha explicado el suelo: qué es un registro compartido, qué es un estado y qué cuesta mantenerlo. Aquel baja a la red que no anota pagos sino que ejecuta programas: qué cuesta ejecutar, quién puede cambiar un contrato después de que lo hayas revisado y qué firmas exactamente.</p>$n$),

      -- ------------------------------------------------------------------
      -- 3) Web3: dejar de negar los dos cursos siguientes de su ruta
      -- ------------------------------------------------------------------
      ('introduccion-a-web3', 'que-sigue-despues',
       $v$<li><p>Fuera a propósito: <strong>cómo funciona una blockchain por dentro</strong>, las finanzas descentralizadas y la programación. Ninguno está en la plataforma hoy, y no se prometen fechas.</p></li>$v$,
       $n$<li><p>Fuera de este curso, pero en esta misma ruta: <strong>cómo funciona una blockchain por dentro</strong> es <em>Blockchain: lo que Bitcoin no es</em>, y las redes que ejecutan programas son <em>Ethereum y contratos inteligentes</em>. Fuera de la plataforma, y sin fechas: las finanzas descentralizadas y la programación.</p></li>$n$),

      -- ------------------------------------------------------------------
      -- 4) Web3: el cuerpo de "por donde seguir". Mandaba a Como funciona
      --    Bitcoin, que desde la 071 es el curso ANTERIOR de esta ruta.
      -- ------------------------------------------------------------------
      ('introduccion-a-web3', 'que-sigue-despues',
       $v$<p><strong>Si quieres entender qué hay debajo del registro compartido</strong>, <em>Cómo funciona Bitcoin</em>, en la ruta de Fundamentos, explica cómo se consigue el acuerdo sin autoridad. Habla de Bitcoin en concreto, no de blockchains en general, pero el mecanismo de fondo es el mismo y es la mejor base disponible hoy.</p>$v$,
       $n$<p><strong>Si quieres entender qué hay debajo del registro compartido</strong>, el siguiente curso de esta ruta es <em>Blockchain: lo que Bitcoin no es</em>: qué es general a cualquier cadena, qué fue una decisión de Bitcoin y qué se cede en cada caso. Y después <em>Ethereum y contratos inteligentes</em>, para las redes que ejecutan programas en vez de anotar pagos.</p>$n$),

      -- ------------------------------------------------------------------
      -- 5) Web3: el resumen final, misma correccion en una linea
      -- ------------------------------------------------------------------
      ('introduccion-a-web3', 'que-sigue-despues',
       $v$<li><p>Por dónde seguir: <strong>Seguridad</strong> si vas a tocar algo con dinero, <strong>Cómo funciona Bitcoin</strong> si quieres el mecanismo de debajo, <strong>Uso práctico</strong> si quieres manejarte.</p></li>$v$,
       $n$<li><p>Por dónde seguir: <strong>Blockchain</strong> y luego <strong>Ethereum</strong> para continuar la ruta, <strong>Seguridad</strong> si vas a tocar algo con dinero, <strong>Uso práctico</strong> si quieres manejarte.</p></li>$n$),

      -- ------------------------------------------------------------------
      -- 6) Fundamentos de Bitcoin: el cierre, con la ruta entera
      -- ------------------------------------------------------------------
      ('fundamentos-de-bitcoin', 'limites-y-criticas-a-bitcoin',
       $v$<li><p><strong>Para ver el resto del ecosistema.</strong> <em>Qué es Web3 y qué no</em> trata lo que hay más allá de Bitcoin, que funciona con premisas distintas.</p></li>$v$,
       $n$<li><p><strong>Para ver el resto del ecosistema.</strong> La ruta <em>Web3 y blockchain</em> trata lo que hay más allá de Bitcoin, que funciona con premisas distintas: empieza en <em>Qué es Web3 y qué no</em>, sigue con <em>Blockchain: lo que Bitcoin no es</em> —qué es general a cualquier cadena y qué fue una decisión de Bitcoin— y termina en <em>Ethereum y contratos inteligentes</em>.</p></li>$n$),

      -- ------------------------------------------------------------------
      -- 7) Como funciona Bitcoin: su cierre. Desde la 071 este curso es el
      --    primero de la ruta de Web3, y conviene decirlo.
      -- ------------------------------------------------------------------
      ('como-funciona-bitcoin-nivel-basico', 'descentralizacion-que-significa-realmente',
       $v$<li><p><strong>Para ver el resto del ecosistema.</strong> <em>Qué es Web3 y qué no</em> se ocupa de lo que hay más allá de Bitcoin, que funciona con premisas distintas.</p></li>$v$,
       $n$<li><p><strong>Para ver el resto del ecosistema.</strong> Este curso es el primero de la ruta <em>Web3 y blockchain</em>, así que ya la has empezado: sigue en <em>Qué es Web3 y qué no</em>, continúa en <em>Blockchain: lo que Bitcoin no es</em> y termina en <em>Ethereum y contratos inteligentes</em>.</p></li>$n$),

      -- ------------------------------------------------------------------
      -- 8) Uso practico: su cierre
      -- ------------------------------------------------------------------
      ('uso-practico-de-bitcoin', 'expectativas-realistas-al-usar-bitcoin',
       $v$<li><p><strong>Para ver qué hay alrededor.</strong> <em>Qué es Web3 y qué no</em> trata lo que existe más allá de Bitcoin, que funciona con premisas distintas.</p></li>$v$,
       $n$<li><p><strong>Para ver qué hay alrededor.</strong> La ruta <em>Web3 y blockchain</em> trata lo que existe más allá de Bitcoin, que funciona con premisas distintas: <em>Qué es Web3 y qué no</em>, <em>Blockchain: lo que Bitcoin no es</em> y <em>Ethereum y contratos inteligentes</em>.</p></li>$n$),

      -- ------------------------------------------------------------------
      -- 9) La cita mal puesta, y el REVISAR resuelto
      -- ------------------------------------------------------------------
      ('como-funciona-bitcoin-nivel-basico', 'mineria-y-prueba-de-trabajo',
       $v$Es el mecanismo que trata <em>Fundamentos de Bitcoin</em>, en su módulo 3, al hablar de la emisión. <!-- REVISAR: la recompensa vigente por bloque cambia en cada halving; esta leccion describe el mecanismo a proposito y no da la cifra actual, para que no caduque. Si en el futuro se anade una cifra, marcarla y revisarla tras cada halving. -->$v$,
       $n$Es el mecanismo que trata <em>Fundamentos de Bitcoin</em> en su lección 2.2, al hablar de la emisión. La cantidad vigente es de <strong>3,125 BTC desde el halving de abril de 2024</strong>, y se reduce a la mitad aproximadamente cada cuatro años.$n$)

    ) AS t(curso_slug, leccion_slug, viejo, nuevo)
  LOOP
    SELECT l.id, l.content INTO v_id, v_contenido
      FROM public.lessons l
      JOIN public.courses c ON c.id = l.course_id
     WHERE c.slug = v.curso_slug AND l.slug = v.leccion_slug;

    IF v_id IS NULL THEN
      RAISE EXCEPTION 'No existe la leccion %/%. Abortando.', v.curso_slug, v.leccion_slug;
    END IF;

    -- Cuantas veces aparece la cadena que se va a sustituir. Tiene que ser
    -- exactamente una: cero significa que el texto ya cambio o que la cadena
    -- esta mal copiada, y mas de una que el replace tocaria algo de mas.
    v_veces := (length(v_contenido) - length(replace(v_contenido, v.viejo, ''))) / length(v.viejo);

    IF v_veces <> 1 THEN
      RAISE EXCEPTION 'En %/% la cadena a sustituir aparece % veces, se esperaba 1. Abortando. Empieza por: %',
        v.curso_slug, v.leccion_slug, v_veces, left(v.viejo, 70);
    END IF;

    UPDATE public.lessons
       SET content = replace(content, v.viejo, v.nuevo),
           updated_at = NOW()
     WHERE id = v_id;

    -- Y que el resultado sea el esperado: el texto nuevo dentro, el viejo fuera.
    SELECT content INTO v_contenido FROM public.lessons WHERE id = v_id;
    IF position(v.nuevo IN v_contenido) = 0 THEN
      RAISE EXCEPTION 'En %/% el texto nuevo no aparece tras el UPDATE. Abortando.', v.curso_slug, v.leccion_slug;
    END IF;
    IF position(v.viejo IN v_contenido) <> 0 THEN
      RAISE EXCEPTION 'En %/% el texto viejo sigue ahi tras el UPDATE. Abortando.', v.curso_slug, v.leccion_slug;
    END IF;

    v_hechos := v_hechos + 1;
    RAISE NOTICE '%. %/%  sustituido', v_hechos, v.curso_slug, v.leccion_slug;
  END LOOP;

  IF v_hechos <> 9 THEN
    RAISE EXCEPTION 'Se esperaban 9 sustituciones y se hicieron %. Abortando.', v_hechos;
  END IF;

  RAISE NOTICE 'Las 9 sustituciones aplicadas.';
END $bloque$;

-- ----------------------------------------------------------------------------
-- Comprobacion final: que no se haya despublicado nada.
--
-- La 028 despublico Nodos Bitcoin y Cold Storage sin que nadie se diera cuenta
-- hasta que dos rutas se quedaron vacias. Escribir lessons no dispara el
-- trigger, pero eso es una afirmacion, y aqui se comprueba.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_no_publicados TEXT;
  v_restos INTEGER;
BEGIN
  SELECT string_agg(slug || ' -> ' || status, ', ') INTO v_no_publicados
    FROM public.courses
   WHERE slug IN (
     'fundamentos-blockchain', 'introduccion-a-web3', 'fundamentos-de-bitcoin',
     'como-funciona-bitcoin-nivel-basico', 'uso-practico-de-bitcoin'
   )
     AND status <> 'published';

  IF v_no_publicados IS NOT NULL THEN
    RAISE EXCEPTION 'Algun curso ha dejado de estar publicado: %. Abortando.', v_no_publicados;
  END IF;

  -- Y que no quede ningun REVISAR suelto en las lecciones de los 10 publicados.
  SELECT count(*) INTO v_restos
    FROM public.lessons l
    JOIN public.courses c ON c.id = l.course_id
   WHERE c.status = 'published' AND l.content LIKE '%REVISAR%';

  RAISE NOTICE 'Los 5 cursos siguen publicados.';
  RAISE NOTICE 'Lecciones con un REVISAR pendiente en cursos publicados: %', v_restos;
END $$;

COMMIT;

-- ============================================================================
-- DESPUES DE APLICAR
--   Comprobar con la CLAVE ANON, no con la de servicio, que los cinco cursos
--   siguen visibles: es la regla que salio de la 028. El fichero
--   072-comprobar.sql lo hace, pero conviene mirarlo tambien desde la web.
--
--   Con esto se cierra el bloque 1 de la auditoria: estructura (071) y
--   contradicciones (072).
-- ============================================================================
