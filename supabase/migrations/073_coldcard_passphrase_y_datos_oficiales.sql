-- ============================================================================
-- 073: la passphrase no dejaba a nadie fuera del incidente de Coldcard
-- ============================================================================
-- ESTADO: PENDIENTE DE APLICAR.
--   Fichero listo para el editor SQL: C:/Users/alber/073-aplicar.sql
--   Este fichero YA ES la version llana: seis UPDATE sueltos con replace() y
--   una unica consulta de verificacion al final. Sin bloque DO, sin PL/pgSQL y
--   sin dollar-quoting anidado, que es lo que hizo fallar a la 072 en su primera
--   forma.
--
-- EL ERROR QUE MOTIVA ESTO
--   La leccion decia: "Tampoco lo estuvieron las carteras protegidas con una
--   palabra adicional robusta". El fabricante dice lo contrario. Del aviso
--   oficial: una passphrase fuerte "creates an independent barrier", pero "does
--   not repair the affected seed" y quien la use debe migrar "as soon as
--   practical".
--
--   Es el unico error del bloque que puede costar dinero: alguien con un Mk4 y
--   passphrase que leyera esto concluia que no tenia que hacer nada.
--
-- FUENTES OFICIALES, consultadas el 27/09/2026
--   Aviso de seguridad, 30/07, act. 01/08 14:35 EDT
--     https://blog.coinkite.com/coldcard-mk3-seed-generation-warning/
--   Analisis tecnico, 30/07
--     https://blog.coinkite.com/entropy-technical-backgrounder/
--   Firmware 5.6.1 / 1.5.1Q, 20/08 (mod. 03/09)
--     https://blog.coinkite.com/coldcard-security-update-5.6.1-1.5.1q/
--   Firmware 5.6.2 / 1.5.2Q, 04/09
--     https://blog.coinkite.com/coldcard-firmware-update-5.6.2-1.5.2q/
--
-- QUE ENTRA
--   1. La cifra de 594 BTC sale. El aviso oficial NO da ninguna cifra, y las de
--      terceros se contradicen: 594 o 1.082 BTC, 38, 70 o 116 millones de
--      dolares segun la fuente. Afirmar una como hecho no se sostiene.
--   2. Entran los bits: ~40 de espacio de busqueda efectivo en los modelos
--      antiguos y ~72 en los recientes, donde debian ser 128. Es la cifra que
--      hace entender la gravedad, y es oficial.
--   3. Entran los modelos y los rangos de version, que llevan dos meses firmes.
--      Y los pasos de migracion, con el que faltaba y es el que evita perder
--      dinero: la transaccion de prueba antes de mover el resto.
--   4. Entran las 50 tiradas de dados, que antes era "un numero suficiente".
--   5. El bloque "En resumen", que repetia la cifra y la guia incompleta.
--   6. Los enlaces oficiales. Antes se decia "la comunicacion oficial del
--      fabricante" sin dar forma de llegar a ella: un alumno leia que la
--      referencia valida esta en otro sitio y se quedaba sin el sitio.
--
-- QUE NO SE NOMBRA, Y POR QUE
--   La version de firmware vigente. Ha cambiado TRES veces en cinco semanas:
--   31/07 el parche (4.2.0 / 5.6.0 / 1.5.0Q / 6.6.0X / 6.6.0QX), 20/08 la
--   revision amplia (5.6.1 / 1.5.1Q) y 04/09 la mezcla verificable (5.6.2 /
--   1.5.2Q / 6.6.1X / 6.6.1QX). Nombrarla es garantizar que el texto miente en
--   octubre. Por eso tampoco vuelve a ponerse un REVISAR: el texto deja de
--   depender de un dato que caduca, que es la forma de no tener que revisarlo.
--
-- EL COMENTARIO REVISAR SE VA
--   Queda resuelto: era exactamente esto. Se elimina junto con el parrafo que
--   acompanaba, en la misma sustitucion.
--
-- COMO VOLVER ATRAS
--   C:/Users/alber/backups-sql/073-volver-atras.sql.bak, con el content
--   completo de la leccion antes de aplicar.
--
-- EL TRIGGER QUE DESPUBLICA NO SE DISPARA
--   trigger_course_modification es BEFORE UPDATE ON public.courses y solo mira
--   campos de courses. Esto escribe lessons.content. Se comprueba igual al
--   final: la 028 despublico dos cursos por no mirarlo.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Los bits de entropia, que faltaban. Se inserta antes de "Un caso real".
-- ----------------------------------------------------------------------------
UPDATE public.lessons SET content = replace(content,
$viejo$No hay ninguna señal de que algo vaya mal.</p><p><strong>Un caso real</strong></p>$viejo$,
$nuevo$No hay ninguna señal de que algo vaya mal.</p><p>Y la diferencia no es de grado. En el caso que viene ahora, el aparato siguió eligiendo entre un conjunto de posibilidades, pero mucho más pequeño: unos <strong>40 bits</strong> de espacio de búsqueda efectivo en los modelos antiguos y unos <strong>72</strong> en los recientes, donde debían ser 128.</p><p><strong>Un caso real</strong></p>$nuevo$), updated_at = NOW()
 WHERE slug = 'seed-phrases-tu-llave-maestra'
   AND course_id = (SELECT id FROM public.courses WHERE slug = 'cold-storage-protege-tus-bitcoin');

-- ----------------------------------------------------------------------------
-- 2. Fuera la cifra de 594 BTC.
-- ----------------------------------------------------------------------------
UPDATE public.lessons SET content = replace(content,
$viejo$<p>El 30 de julio de 2026 se sustrajeron unos <strong>594 BTC</strong> de carteras Coldcard en un barrido coordinado que vació cientos de carteras de firma única en cuestión de minutos.</p>$viejo$,
$nuevo$<p>El 30 de julio de 2026 se vaciaron cientos de carteras Coldcard de firma única en cuestión de minutos, en un barrido coordinado. Las estimaciones publicadas del total sustraído no coinciden entre sí y el fabricante no ha dado ninguna, así que aquí no se reproduce una cifra.</p>$nuevo$), updated_at = NOW()
 WHERE slug = 'seed-phrases-tu-llave-maestra'
   AND course_id = (SELECT id FROM public.courses WHERE slug = 'cold-storage-protege-tus-bitcoin');

-- ----------------------------------------------------------------------------
-- 3. "Si te afecta", con modelos, versiones y los pasos de migracion. Se lleva
--    por delante el comentario REVISAR, que queda resuelto.
-- ----------------------------------------------------------------------------
UPDATE public.lessons SET content = replace(content,
$viejo$<p><strong>Si te afecta</strong></p><p>Actualizar el firmware corrige las semillas <em>futuras</em>, no la que ya tienes. Quien haya generado su frase en un modelo afectado con una versión anterior a la corrección debe <strong>generar una frase nueva en un dispositivo no afectado o ya actualizado y mover los fondos a ella</strong>.</p><p>Los modelos y versiones concretos, y el procedimiento de migración, están en la comunicación oficial del fabricante. Es la única fuente que conviene seguir para eso.</p><!-- REVISAR: lista exacta de modelos y versiones de firmware afectados por el incidente de julio de 2026, y procedimiento de migracion. La publica el fabricante y se ha ido precisando desde el 31/07/2026. NO reproducir aqui la lista ni los pasos: remitir siempre a la comunicacion oficial vigente. Revisar tambien la cifra de BTC sustraidos: 594 corresponde al barrido del 30 de julio, y hay estimaciones posteriores mas altas al sumar transacciones anteriores con la misma huella. -->$viejo$,
$nuevo$<p><strong>Si te afecta</strong></p><p>Los modelos alcanzados son <strong>Mk2, Mk3, Mk4, Mk5 y Q</strong>. Quedaron fuera TAPSIGNER, OPENDIME y SATSCARD, que usan otra base de código. Las versiones afectadas son la <strong>4.0.1 a la 4.1.9</strong> en Mk2 y Mk3, y en Mk4, Mk5 y Q cualquiera anterior al parche del 31 de julio de 2026.</p><p><strong>Actualizar el firmware corrige las semillas <em>futuras</em>, no la que ya tienes.</strong> Si generaste tu frase en uno de esos modelos con una versión anterior, el camino es: instalar la versión vigente, generar una frase nueva, comprobar su copia, verificar en la pantalla del dispositivo una dirección de recepción, <strong>enviar una cantidad pequeña de prueba y confirmar que llega</strong>, y solo entonces mover el resto. Conserva la copia antigua hasta que la migración esté terminada y comprobada.</p><p>No damos aquí el número de versión a propósito: desde el parche inicial ha habido dos revisiones más, cada una con la suya. La lista vigente por modelo y el procedimiento están en la comunicación oficial del fabricante, y es la única fuente que conviene seguir para eso.</p>$nuevo$), updated_at = NOW()
 WHERE slug = 'seed-phrases-tu-llave-maestra'
   AND course_id = (SELECT id FROM public.courses WHERE slug = 'cold-storage-protege-tus-bitcoin');

-- ----------------------------------------------------------------------------
-- 4. Las dos excepciones, con su cifra y con el matiz de la passphrase. Este es
--    el arreglo que motiva la migracion.
-- ----------------------------------------------------------------------------
UPDATE public.lessons SET content = replace(content,
$viejo$<p>En el caso de julio de 2026 eso tuvo un efecto medible: las semillas generadas a partir de un número suficiente de tiradas de dados físicos no quedaron comprometidas, porque su aleatoriedad no provenía del generador defectuoso. Tampoco lo estuvieron las carteras protegidas con una palabra adicional robusta, por la razón que veremos más abajo: derivan una semilla distinta.</p>$viejo$,
$nuevo$<p>En el caso de julio de 2026 eso tuvo un efecto medible: las semillas generadas aportando <strong>al menos 50 tiradas de dados físicos</strong>, independientes y no registradas, no quedaron comprometidas, porque su aleatoriedad no provenía del generador defectuoso.</p><p>Con la palabra adicional el matiz importa: <strong>una passphrase robusta añade una barrera independiente, pero no repara la semilla</strong>. El fabricante recomienda migrar igualmente a quien la use. No es lo mismo estar fuera del problema que tener una puerta más.</p>$nuevo$), updated_at = NOW()
 WHERE slug = 'seed-phrases-tu-llave-maestra'
   AND course_id = (SELECT id FROM public.courses WHERE slug = 'cold-storage-protege-tus-bitcoin');

-- ----------------------------------------------------------------------------
-- 5. El bloque "En resumen", que repetia la cifra y la guia incompleta.
--
--    Es el trozo que la gente relee, asi que el matiz de la passphrase tiene
--    que estar aqui tambien. Si solo se corrige el cuerpo y no el resumen,
--    quien vuelva a la leccion a repasar se lleva la version equivocada.
-- ----------------------------------------------------------------------------
UPDATE public.lessons SET content = replace(content,
$viejo$<li><p>La entropía es el cimiento: una semilla mal generada es indistinguible de una buena y puede reconstruirse sin tocar el dispositivo. Un fallo así en 2026 costó unos 594 BTC.</p></li><li><p>Actualizar el firmware arregla las semillas futuras, no la que ya existe: si te afecta, hay que generar una nueva y mover los fondos.</p></li>$viejo$,
$nuevo$<li><p>La entropía es el cimiento: una semilla mal generada es indistinguible de una buena y puede reconstruirse sin tocar el dispositivo. El caso de 2026 dejó el espacio de búsqueda en unos 40 bits en los modelos antiguos y 72 en los recientes, donde debían ser 128.</p></li><li><p>Actualizar el firmware arregla las semillas futuras, no la que ya existe: si te afecta, hay que generar una nueva, probarla con una cantidad pequeña y mover los fondos. Una passphrase robusta añade una barrera, pero no repara la semilla.</p></li>$nuevo$), updated_at = NOW()
 WHERE slug = 'seed-phrases-tu-llave-maestra'
   AND course_id = (SELECT id FROM public.courses WHERE slug = 'cold-storage-protege-tus-bitcoin');

-- ----------------------------------------------------------------------------
-- 6. Los enlaces oficiales.
--
--    OJO CON EL ORDEN: la cadena que busca este UPDATE la escribe el UPDATE 3.
--    Dentro de este fichero se ejecutan en orden, asi que encaja. Y es
--    idempotente en los dos sentidos: al reejecutar el fichero, el 3 ya no
--    encuentra su cadena y este si; y si alguien ejecutara solo este sobre la
--    leccion sin parchear, no encontraria nada y no haria nada.
--
--    Se enlazan los dos sitios que hacen falta para actuar: el aviso, que lleva
--    el procedimiento, y la pagina de actualizacion, que lleva la version
--    vigente por modelo. Son URL de seccion, no de una version concreta, asi
--    que no caducan con el proximo firmware.
-- ----------------------------------------------------------------------------
UPDATE public.lessons SET content = replace(content,
$viejo$<p>No damos aquí el número de versión a propósito: desde el parche inicial ha habido dos revisiones más, cada una con la suya. La lista vigente por modelo y el procedimiento están en la comunicación oficial del fabricante, y es la única fuente que conviene seguir para eso.</p>$viejo$,
$nuevo$<p>No damos aquí el número de versión a propósito: desde el parche inicial ha habido dos revisiones más, cada una con la suya. La lista vigente por modelo está en la <a href="https://coldcard.com/docs/upgrade/" target="_blank" rel="noopener noreferrer">página de actualización del fabricante</a> y el procedimiento completo, en su <a href="https://blog.coinkite.com/coldcard-mk3-seed-generation-warning/" target="_blank" rel="noopener noreferrer">aviso de seguridad</a>. Es la única fuente que conviene seguir para esto.</p>$nuevo$), updated_at = NOW()
 WHERE slug = 'seed-phrases-tu-llave-maestra'
   AND course_id = (SELECT id FROM public.courses WHERE slug = 'cold-storage-protege-tus-bitcoin');

-- ############################################################################
-- LA VERIFICACION. Un solo SELECT: seis comprobaciones y un resumen.
-- ############################################################################
WITH comprobaciones (n, que, viejo, nuevo) AS (
  VALUES
    (1, 'Los bits de entropía (40 y 72)',
        'No hay ninguna señal de que algo vaya mal.</p><p><strong>Un caso real</strong></p>',
        'unos <strong>40 bits</strong> de espacio de búsqueda efectivo'),
    (2, 'Fuera la cifra de 594 BTC',
        'se sustrajeron unos <strong>594 BTC</strong>',
        'no coinciden entre sí y el fabricante no ha dado ninguna'),
    (3, 'Modelos, versiones y pasos de migración',
        'Los modelos y versiones concretos, y el procedimiento de migración, están en la comunicación oficial',
        'Los modelos alcanzados son <strong>Mk2, Mk3, Mk4, Mk5 y Q</strong>'),
    (4, 'LA PASSPHRASE: ya no dice que deja fuera',
        'Tampoco lo estuvieron las carteras protegidas con una palabra adicional robusta',
        'añade una barrera independiente, pero no repara la semilla'),
    (5, 'El resumen, sin la cifra y con el matiz',
        'Un fallo así en 2026 costó unos 594 BTC',
        'Una passphrase robusta añade una barrera, pero no repara la semilla'),
    (6, 'Los enlaces oficiales (aviso y actualización)',
        'están en la comunicación oficial del fabricante, y es la única fuente',
        'href="https://blog.coinkite.com/coldcard-mk3-seed-generation-warning/"')
),
estado AS (
  SELECT c.n, c.que,
         (l.id IS NOT NULL)                               AS leccion_existe,
         cu.status::text                                  AS estado_curso,
         position(c.nuevo IN coalesce(l.content, '')) > 0 AS nuevo_presente,
         position(c.viejo IN coalesce(l.content, '')) = 0 AS viejo_ausente,
         (position('REVISAR' IN coalesce(l.content, '')) = 0) AS sin_revisar,
         (position('https://coldcard.com/docs/upgrade/' IN coalesce(l.content, '')) > 0) AS con_descargas
    FROM comprobaciones c
    LEFT JOIN public.courses cu ON cu.slug = 'cold-storage-protege-tus-bitcoin'
    LEFT JOIN public.lessons l  ON l.course_id = cu.id AND l.slug = 'seed-phrases-tu-llave-maestra'
)
SELECT n::text AS "#",
       que AS "comprobacion",
       coalesce(estado_curso, 'CURSO NO ENCONTRADO') AS "estado",
       CASE
         WHEN leccion_existe AND nuevo_presente AND viejo_ausente
              AND estado_curso = 'published' THEN 'OK'
         ELSE 'FALLA: ' || concat_ws(' · ',
                CASE WHEN NOT leccion_existe THEN 'la leccion no existe' END,
                CASE WHEN NOT nuevo_presente THEN 'falta el texto nuevo' END,
                CASE WHEN NOT viejo_ausente  THEN 'el texto viejo sigue ahi' END,
                CASE WHEN estado_curso IS DISTINCT FROM 'published'
                     THEN 'el curso no esta publicado' END)
       END AS "veredicto"
  FROM estado
UNION ALL
SELECT '=',
       'RESUMEN',
       (SELECT CASE WHEN bool_and(sin_revisar) AND bool_and(con_descargas)
                    THEN 'sin REVISAR y con los dos enlaces'
                    WHEN NOT bool_and(sin_revisar) THEN 'QUEDA UN REVISAR'
                    ELSE 'FALTA EL ENLACE DE DESCARGAS' END FROM estado),
       (SELECT CASE WHEN count(*) FILTER (
                      WHERE NOT (nuevo_presente AND viejo_ausente AND leccion_existe)) = 0
                    THEN 'TODO CORRECTO'
                    ELSE 'FALTAN SUSTITUCIONES' END FROM estado)
 ORDER BY 1;
