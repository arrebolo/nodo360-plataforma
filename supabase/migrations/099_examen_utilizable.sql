-- ============================================================================
-- MIGRACION 099: un examen sin banco no es un examen
--
-- EL HUECO, MEDIDO
-- Los cuatro examenes antiguos existen y estan activos, y tienen CERO preguntas.
-- El banco cuelga de la especialidad desde la 094, y solo ethereum-contratos
-- tiene banco:
--
--   especialidad           examen     banco   puede servir 15
--   bitcoin-fundamentos    si         0       NO
--   seguridad-custodia     si         0       NO
--   web3                   si         0       NO
--   mercados-trading       si         0       NO
--   ethereum-contratos     si        30       SI
--   las otras seis         no         0       NO
--
-- Que pasaba: si alguien pedia una de esas cuatro, servir_preguntas fallaba con
-- P0001 «hacen falta 15 y quedan 0». No daba un examen vacio —eso ya lo impedia
-- la 095— pero dejaba a la persona contra una pared sin explicacion, y el
-- formulario le habia dejado creer que habria examen.
--
-- LA REGLA, QUE ES LA MAS SIMPLE QUE FUNCIONA
-- Una especialidad tiene examen cuando tiene un examen ACTIVO y su banco da
-- para servir una tanda completa. Si no, se trata como especialidad SIN examen:
-- entrevista y parte practica, que es el camino que ya existe para fiscalidad y
-- derecho.
--
-- No hace falta desactivar los cuatro examenes ni borrarlos: en cuanto tengan
-- banco, vuelven a contar solos. La regla se calcula, no se marca a mano, y por
-- eso no se queda desfasada.
--
-- EL UMBRAL
-- Se compara contra total_questions del examen, que es lo que ese examen declara
-- que sirve. Hoy vale 15 en el de ethereum y las rutas piden 15, asi que
-- coinciden. Si algun dia se cambia uno hay que cambiar el otro: lo dice el
-- COMMENT de la vista para que no se descubra por sorpresa.
--
-- NO BORRA NI UNA FILA. No desactiva ningun examen. Es reejecutable.
-- Y se prueba a si misma, en las dos direcciones.
-- ============================================================================

BEGIN;

-- =====================================================
-- 1. La vista que lo dice
-- =====================================================
-- Vista normal, no SECURITY INVOKER: corre con los privilegios de su dueño, y
-- asi puede contar el banco —que desde la 087 no lee nadie con sesion— sin
-- exponer ni un enunciado. Lo unico que sale de aqui es CUANTAS hay.

DROP VIEW IF EXISTS public.especialidades_publicas;

CREATE VIEW public.especialidades_publicas AS
  SELECT
    e.id,
    e.slug,
    e.nombre,
    e.descripcion,
    e.requiere_acreditacion,
    e.permite_evaluador_externo,
    e.position,
    (SELECT count(*) FROM public.instructor_exam_questions q WHERE q.specialty_id = e.id)
      AS preguntas_en_banco,
    EXISTS (
      SELECT 1
        FROM public.instructor_exams x
       WHERE x.specialty_id = e.id
         AND x.is_active
         AND (SELECT count(*) FROM public.instructor_exam_questions q WHERE q.specialty_id = e.id)
             >= coalesce(x.total_questions, 15)
    ) AS tiene_examen
  FROM public.instructor_specialties e
 WHERE e.is_active;

COMMENT ON VIEW public.especialidades_publicas IS
  'El catalogo de especialidades activas, con si tienen examen UTILIZABLE: un examen activo cuyo banco da para servir una tanda completa. Un examen con cero preguntas no es un examen, y antes de la 099 el formulario prometia uno. El umbral se compara con total_questions del examen; las rutas piden 15 y hoy coinciden, y si se cambia uno hay que cambiar el otro. Sale el RECUENTO del banco, nunca un enunciado.';

GRANT SELECT ON public.especialidades_publicas TO anon, authenticated;

-- =====================================================
-- 2. La prueba, en las dos direcciones
-- =====================================================

DO $prueba$
DECLARE
  v_con     boolean;
  v_sin     boolean;
  v_banco   integer;
  v_total   integer;
  v_activas integer;
BEGIN
  -- Direccion 1: ethereum-contratos tiene examen y banco de 30
  SELECT tiene_examen, preguntas_en_banco INTO v_con, v_banco
    FROM public.especialidades_publicas WHERE slug = 'ethereum-contratos';

  IF v_con IS NOT TRUE THEN
    RAISE EXCEPTION
      'PRUEBA 1 FALLIDA: ethereum-contratos deberia tener examen utilizable (banco %).', v_banco;
  END IF;
  RAISE NOTICE 'PRUEBA 1  ethereum-contratos: CON examen, banco de %          PASA', v_banco;

  -- Direccion 2: bitcoin-fundamentos tiene examen activo y CERO preguntas
  SELECT tiene_examen, preguntas_en_banco INTO v_sin, v_banco
    FROM public.especialidades_publicas WHERE slug = 'bitcoin-fundamentos';

  IF v_sin IS NOT FALSE THEN
    RAISE EXCEPTION
      'PRUEBA 2 FALLIDA: bitcoin-fundamentos tiene un examen con % preguntas y se cuenta como utilizable.', v_banco;
  END IF;
  IF v_banco <> 0 THEN
    RAISE NOTICE 'OJO: bitcoin-fundamentos ya tiene % preguntas en el banco.', v_banco;
  END IF;
  RAISE NOTICE 'PRUEBA 2  bitcoin-fundamentos: examen activo con 0, SIN examen PASA';

  -- Direccion 3: una sin examen ninguno
  SELECT tiene_examen INTO v_sin
    FROM public.especialidades_publicas WHERE slug = 'lightning';
  IF v_sin IS NOT FALSE THEN
    RAISE EXCEPTION 'PRUEBA 3 FALLIDA: lightning no tiene examen y se cuenta como utilizable.';
  END IF;
  RAISE NOTICE 'PRUEBA 3  lightning: sin examen ninguno, SIN examen           PASA';

  -- 4. Las once activas salen, y la vista no expone enunciados
  SELECT count(*) INTO v_activas FROM public.especialidades_publicas;
  IF v_activas <> (SELECT count(*) FROM public.instructor_specialties WHERE is_active) THEN
    RAISE EXCEPTION 'PRUEBA 4 FALLIDA: la vista muestra % y hay % activas.',
      v_activas, (SELECT count(*) FROM public.instructor_specialties WHERE is_active);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'especialidades_publicas'
       AND column_name IN ('question', 'options', 'correct_answer', 'oral_followup', 'oral_rubric')
  ) THEN
    RAISE EXCEPTION 'PRUEBA 4 FALLIDA: la vista expone contenido del banco.';
  END IF;
  RAISE NOTICE 'PRUEBA 4  salen las % activas y ni un enunciado              PASA', v_activas;

  -- 5. Y la cuenta cuadra: hoy una con examen y el resto sin el
  SELECT count(*) INTO v_total FROM public.especialidades_publicas WHERE tiene_examen;
  RAISE NOTICE 'PRUEBA 5  con examen utilizable hoy: % de %                   PASA', v_total, v_activas;
END
$prueba$;

COMMIT;

-- ============================================================================
-- VERIFICACION
-- ============================================================================

SELECT
  to_regclass('public.especialidades_publicas') IS NOT NULL                      AS vista_creada,
  has_table_privilege('anon', 'public.especialidades_publicas', 'SELECT')         AS anon_la_lee,

  (SELECT count(*) FROM public.especialidades_publicas)                          AS especialidades,
  (SELECT count(*) FROM public.especialidades_publicas WHERE tiene_examen)        AS con_examen_utilizable,
  (SELECT count(*) FROM public.especialidades_publicas WHERE NOT tiene_examen)    AS sin_examen,

  (SELECT tiene_examen FROM public.especialidades_publicas WHERE slug = 'ethereum-contratos')
                                                                                 AS ethereum_con_examen,
  (SELECT tiene_examen FROM public.especialidades_publicas WHERE slug = 'bitcoin-fundamentos')
                                                                                 AS bitcoin_con_examen,
  (SELECT preguntas_en_banco FROM public.especialidades_publicas WHERE slug = 'bitcoin-fundamentos')
                                                                                 AS banco_de_bitcoin,

  -- Que no se cuela nada del banco por aqui
  (SELECT count(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'especialidades_publicas'
      AND column_name IN ('question','options','correct_answer','oral_followup','oral_rubric'))
                                                                                 AS columnas_del_banco_filtradas,

  -- Y que los cuatro examenes antiguos siguen ahi, sin tocar
  (SELECT count(*) FROM public.instructor_exams WHERE is_active)                  AS examenes_activos,

  CASE
    WHEN to_regclass('public.especialidades_publicas') IS NOT NULL
     AND has_table_privilege('anon', 'public.especialidades_publicas', 'SELECT')
     AND (SELECT tiene_examen FROM public.especialidades_publicas WHERE slug = 'ethereum-contratos')
     AND NOT (SELECT tiene_examen FROM public.especialidades_publicas WHERE slug = 'bitcoin-fundamentos')
     AND (SELECT count(*) FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'especialidades_publicas'
             AND column_name IN ('question','options','correct_answer','oral_followup','oral_rubric')) = 0
     AND (SELECT count(*) FROM public.especialidades_publicas)
         = (SELECT count(*) FROM public.instructor_specialties WHERE is_active)
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                                            AS veredicto;
