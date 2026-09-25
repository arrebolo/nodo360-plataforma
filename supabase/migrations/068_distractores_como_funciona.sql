-- ============================================================================
-- 068: distractores creibles en Cómo funciona Bitcoin (nivel básico)
-- ============================================================================
-- ESTADO: APLICADA EN PRODUCCION EL 25/09/2026.
--   Ejecutada por PostgREST y versionada despues.
--
-- QUE PASABA
--   En 12 de las 18 preguntas de este curso la respuesta correcta era la opcion
--   mas larga, con 19.5 caracteres de ventaja de media. "Elegir la mas larga"
--   acertaba el 67%, y el umbral de aprobado es 70%.
--
-- QUE HACE
--   Reescribe 28 distractores en 10 preguntas. La respuesta correcta NO se
--   toca: se comprobo que sigue siendo el mismo texto y en la misma posicion.
--   Las preguntas y las explicaciones tampoco se tocan.
--
--   Criterio, el que quedo fijado en la 060 y que aqui se aplica desde el
--   principio: cada distractor sigue siendo FALSO y se vuelve mas creible.
--   Nada de paja: alargar sin decir nada mas concreto haria las preguntas mas
--   largas sin hacerlas mas dificiles.
--
--   Y no basta con igualar longitudes. Mientras "la mas larga" siga acertando
--   por encima del azar, la longitud informa. Asi que en la mayoria de las
--   preguntas hay UN distractor mas largo que la correcta.
--
-- RESULTADO, MEDIDO
--                                        antes     ahora
--     la correcta es la mas larga       12/18      5/18   (azar: ~25%)
--     margen medio de esas               19.5       2.2
--     preguntas con margen > 6 car       10         0
--     "elegir la mas larga" acierta      67%       28%
--
-- COMPROBADO ADEMAS
--   - Ningun distractor nuevo nombra una marca ni un producto.
--   - Ninguna tira de cinco palabras de un distractor aparece en el texto de las
--     lecciones del curso, que es la senal de que un distractor podria estar
--     afirmando algo que la leccion da por cierto.
--
-- RESPALDO
--   C:/Users/alber/backups-sql/068-volver-atras.sql.bak
-- ============================================================================

BEGIN;

-- ------------------------------------------------------------------------
-- M0 Cómo funciona la red Bitcoin
-- ------------------------------------------------------------------------

-- 1: longitudes 68 / 107 / 108 / 57; la correcta es la C (108 car, intacta), y sigue siendo la mas larga por 1
UPDATE public.quiz_questions
   SET options = '["El segundo, porque al borrar los bloques deja de comprobar el pasado","El primero, porque conservar tanto dato lo vuelve más lento y acaba saltándose comprobaciones por el camino","Ninguno: los dos comprueban lo mismo; el segundo solo pierde la capacidad de servir historia antigua a otros","Depende de cuántos bloques antiguos haya borrado cada uno"]'::jsonb
 WHERE id = '734fe2af-6116-499e-8146-ef0dc77e4ec8';

-- 3: longitudes 103 / 69 / 107 / 71; la correcta es la A (103 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["La aplicación pregunta a un servidor ajeno y se fía de la respuesta; el nodo lo comprueba por su cuenta","La aplicación usa una copia reducida de la cadena de bloques completa","El nodo tiene acceso a información de la red que la aplicación no puede llegar a consultar de ninguna forma","No hay ninguna diferencia real: las dos leen los mismos datos de la red"]'::jsonb
 WHERE id = 'f3c86bdd-8a8e-4987-ba82-74ca68273c62';

-- 4: longitudes 83 / 77 / 63 / 48; la correcta es la B (77 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Se compartió la clave pública extendida en lugar de una dirección concreta de cobro","Se reutilizó la misma dirección, así que quien la conoce ve todo su historial","Se usó una cartera que publica los saldos de todos sus usuarios","Se firmó la transacción con una clave equivocada"]'::jsonb
 WHERE id = '23e8316b-1579-41ce-aa6b-fa0d7bf908b8';

-- 6: longitudes 55 / 95 / 56 / 85; la correcta es la D (85 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Porque las direcciones caducan al cabo de cierto tiempo","Porque la red detecta y bloquea cualquier intento de gasto que no venga autorizado por su dueño","Porque la dirección va cifrada con una contraseña aparte","Porque de la dirección no se puede llegar a la clave pública, ni de esta a la privada"]'::jsonb
 WHERE id = '4fb36b27-81c2-455c-87f9-f3b7f6900ac9';

-- 7: longitudes 64 / 61 / 57 / 56; la correcta es la A (64 car, intacta), y sigue siendo la mas larga por 3
UPDATE public.quiz_questions
   SET options = '["El cambio, que vuelve a una dirección nueva de tu propia cartera","Una comisión desviada por la cartera hacia su propio monedero","Un error de la cartera que conviene reportar de inmediato","Un intento de robo interceptando la transacción en curso"]'::jsonb
 WHERE id = '338d8f09-72c2-4ffd-a29c-57ba7c30ff74';

-- 8: longitudes 80 / 81 / 62 / 57; la correcta es la B (81 car, intacta), y sigue siendo la mas larga por 1
UPDATE public.quiz_questions
   SET options = '["La segunda, porque la comisión es proporcional a la cantidad de satoshis enviada","La primera, porque juntar treinta cobros produce una transacción mucho más grande","Las dos igual, porque la comisión es fija por cada transacción","Depende solo de la urgencia que elija cada una de las dos"]'::jsonb
 WHERE id = '93b4ab9f-4d4c-4e98-8a89-4a9f7ef53b8b';

-- ------------------------------------------------------------------------
-- M1 Qué hace diferente a Bitcoin
-- ------------------------------------------------------------------------

-- 1: longitudes 111 / 67 / 66 / 105; la correcta es la D (105 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Porque los nodos guardan una copia de seguridad cifrada del original y la comparan con lo que haya en la cadena","Porque las transacciones antiguas se borran y ya no se pueden tocar","Porque hace falta la autorización expresa de quien recibió el pago","Porque cambiar cualquier dato altera la huella de su bloque, y eso invalida todos los bloques posteriores"]'::jsonb
 WHERE id = '7da19d4b-86ef-49a8-a71c-1ee7bd84f62f';

-- 2: longitudes 82 / 55 / 85 / 48; la correcta es la A (82 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Su bloque quedó en una rama descartada al imponerse otra con más trabajo acumulado","Alguien la ha cancelado desde el otro extremo de la red","La comisión resultó insuficiente y la red acabó devolviéndola a la cola de pendientes","El nodo que la incluyó acabó expulsado de la red"]'::jsonb
 WHERE id = 'b0cab245-32b7-409a-a4f2-2133dbac2ed2';

-- 5: longitudes 61 / 85 / 50 / 78; la correcta es la D (78 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Se detendría hasta que alguien reajustara el protocolo a mano","No cambiaría nada, porque el ritmo de los bloques no depende de la potencia conectada","Los bloques saldrían lentos ya de forma permanente","Los bloques saldrían lentos unos días y el siguiente ajuste devolvería el paso"]'::jsonb
 WHERE id = '7e8c878c-d3f1-4f93-a405-f00ef3f2f536';

-- 8: longitudes 102 / 55 / 90 / 52; la correcta es la C (90 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Los desarrolladores lo publican y se aplica automáticamente en todos los nodos de la red al actualizar","Se decide por votación entre quienes forman los bloques","Solo si lo adopta una mayoría muy amplia: quien no actualiza sigue con las reglas de antes","Lo aprueba la fundación que mantiene hoy el proyecto"]'::jsonb
 WHERE id = 'eb0f67d1-1330-48fd-9590-2d59982319ed';

COMMIT;


-- ============================================================================
-- COMPROBACIONES (solo lectura)
-- ============================================================================
-- 1. Cuantas veces la correcta es la mas larga (deberia ser 5 de 18)
--
-- SELECT count(*) FROM (
--   SELECT q.id,
--          length(q.options->>q.correct_answer) AS correcta,
--          (SELECT max(length(o)) FROM jsonb_array_elements_text(q.options) o) AS mayor
--     FROM public.quiz_questions q
--     JOIN public.modules m ON m.id = q.module_id
--     JOIN public.courses c ON c.id = m.course_id
--    WHERE c.slug = 'como-funciona-bitcoin-nivel-basico'
-- ) t WHERE correcta = mayor;
-- QUE DEBE SALIR: 5 o menos.
--
-- 2. Ninguna pregunta puede haber perdido opciones ni tenerlas repetidas
--
-- SELECT count(*) FROM public.quiz_questions q
--   JOIN public.modules m ON m.id = q.module_id
--   JOIN public.courses c ON c.id = m.course_id
--  WHERE c.slug = 'como-funciona-bitcoin-nivel-basico'
--    AND (jsonb_array_length(q.options) <> 4
--         OR (SELECT count(DISTINCT o) FROM jsonb_array_elements_text(q.options) o) <> 4);
-- QUE DEBE SALIR: 0.
