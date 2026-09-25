-- ============================================================================
-- 062: distractores creibles en Trading: qué es y por qué casi nadie gana
-- ============================================================================
-- ESTADO: APLICADA EN PRODUCCION EL 25/09/2026.
--   Ejecutada por PostgREST y versionada despues.
--
-- QUE PASABA
--   En 24 de las 27 preguntas de este curso la respuesta correcta era la opcion
--   mas larga, con 22.6 caracteres de ventaja de media. "Elegir la mas larga"
--   acertaba el 93%, y el umbral de aprobado es 70%.
--
-- QUE HACE
--   Reescribe 65 distractores en 22 preguntas. La respuesta correcta NO se
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
--     la correcta es la mas larga       24/27      4/27   (azar: ~25%)
--     margen medio de esas               22.6       3.5
--     preguntas con margen > 6 car       22         0
--     "elegir la mas larga" acierta      93%       22%
--
-- COMPROBADO ADEMAS
--   - Ningun distractor nuevo nombra una marca ni un producto.
--   - Ninguna tira de cinco palabras de un distractor aparece en el texto de las
--     lecciones del curso, que es la senal de que un distractor podria estar
--     afirmando algo que la leccion da por cierto.
--
-- RESPALDO
--   C:/Users/alber/backups-sql/062-volver-atras.sql.bak
-- ============================================================================

BEGIN;

-- ------------------------------------------------------------------------
-- M0 Qué es exactamente
-- ------------------------------------------------------------------------

-- 1: longitudes 79 / 86 / 68 / 69; la correcta es la A (79 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Responde a qué es el trading y por qué casi nadie gana, pero no enseña a operar","Enseña una estrategia sencilla para principiantes y explica cómo aplicarla paso a paso","Enseña a operar asumiendo poco riesgo en cada una de las operaciones","Compara las plataformas disponibles y dice con cuál conviene quedarse"]'::jsonb
 WHERE id = 'db44ea6c-84b1-4817-ae7c-3de516b5d1c2';

-- 3: longitudes 87 / 63 / 65 / 64; la correcta es la C (65 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Son lo mismo: si aciertas es porque decidiste bien, y si fallas es porque decidiste mal","Decidir bien garantiza acertar si el plazo es lo bastante largo","Son cosas distintas, y con pocas operaciones no se pueden separar","Acertar depende solo de la formación que tengas y de la práctica"]'::jsonb
 WHERE id = '8314ab99-1f33-49b6-9db2-ec0e8edc34f3';

-- 5: longitudes 74 / 81 / 70 / 63; la correcta es la A (74 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Que no se puede afirmar que funcione: solo se puede describir lo que exige","Que históricamente ha funcionado, y por eso es la opción prudente para la mayoría","Que el tiempo juega a favor de quien sabe esperar sin ponerse nervioso","Que es preferible a operar en todos los casos y para cualquiera"]'::jsonb
 WHERE id = '445f0161-d4b1-4441-a616-d3e2aaecaab7';

-- 7: longitudes 70 / 55 / 60 / 58; la correcta es la C (60 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Positiva, porque el mercado crece con el tiempo y hay sitio para todos","Cero exacto: lo que gana uno lo pierde exactamente otro","Menor que cero, porque los costes salen de los participantes","Depende de la dirección que tome el precio en cada momento"]'::jsonb
 WHERE id = 'cc4a2047-2109-45ac-a81d-57d66a838f3b';

-- 8: longitudes 77 / 70 / 64 / 71; la correcta es la D (71 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Otros particulares en tu misma situación y con las mismas herramientas que tú","La propia plataforma, que siempre toma la posición contraria a la tuya","Nadie en concreto: las órdenes las empareja un algoritmo neutral","Participantes profesionales con sistemas automáticos y costes más bajos"]'::jsonb
 WHERE id = '9c0f4db5-b38b-4dfa-8c0c-8f8354275e1b';

-- 9: longitudes 78 / 85 / 70 / 70; la correcta es la A (78 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Por aritmética: el dinero sale de otro participante y hay costes por el camino","Porque la mayoría no se forma lo suficiente antes de empezar a poner dinero de verdad","Porque el mercado está manipulado por unos pocos participantes grandes","Porque las plataformas lo impiden mediante sus comisiones y sus reglas"]'::jsonb
 WHERE id = 'b082dde6-0610-4315-bf86-c650c5c435f9';

-- ------------------------------------------------------------------------
-- M1 Por qué casi nadie gana
-- ------------------------------------------------------------------------

-- 1: longitudes 70 / 56 / 48 / 46; la correcta es la B (56 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Que sube cuando el mercado se mueve mucho y hay más volumen del normal","La frecuencia: se cobra en cada entrada y en cada salida","Que se cobra sobre el beneficio que has obtenido","Que es distinta en cada una de las plataformas"]'::jsonb
 WHERE id = '6d73006a-38bc-41f1-b4e8-0b68d36ccff2';

-- 2: longitudes 83 / 74 / 84 / 67; la correcta es la C (84 car, intacta), y sigue siendo la mas larga por 1
UPDATE public.quiz_questions
   SET options = '["La comisión que cobra la plataforma por dejarte operar dentro de su mercado interno","El impuesto que se aplica a cada una de las operaciones que llegas a hacer","La diferencia entre el precio de compra y el de venta, que te hace empezar perdiendo","La variación que tiene el precio a lo largo de una jornada completa"]'::jsonb
 WHERE id = '9204914f-4eab-4582-b077-6d71b68cb915';

-- 3: longitudes 81 / 63 / 66 / 74; la correcta es la D (74 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Es más seguro, porque al haber menos movimiento el precio no da sorpresas bruscas","Igual que uno líquido, solo que moviendo bastante menos volumen","Es mejor para operaciones grandes, porque no hay tanta competencia","Cómodo para entrar y caro para salir, y no se nota hasta que quieres salir"]'::jsonb
 WHERE id = '1dd3743a-b84f-4878-b15c-cb7e8664e4e2';

-- 4: longitudes 65 / 65 / 57 / 53; la correcta es la A (65 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Más arriba de la mitad, porque cada operación empieza en negativo","En acertar más de la mitad de las operaciones que llegues a hacer","En acertar una de cada tres, si las ganancias son grandes","Depende únicamente de la estrategia que hayas elegido"]'::jsonb
 WHERE id = '74816133-b31c-4e52-8ca4-80bbeb2317b5';

-- 5: longitudes 74 / 67 / 66 / 61; la correcta es la B (67 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["El porcentaje de operaciones acertadas sobre el total de las que has hecho","Dinero que metiste frente a dinero que sacaste, en un periodo largo","La rentabilidad porcentual que has obtenido en el último trimestre","La comparación con el mejor momento por el que pasó tu cuenta"]'::jsonb
 WHERE id = 'cbd50281-90b5-4cb9-ad7b-b5a1751c848f';

-- 6: longitudes 60 / 57 / 65 / 48; la correcta es la C (65 car, intacta), y sigue siendo la mas larga por 5
UPDATE public.quiz_questions
   SET options = '["Aumenta la probabilidad de que el precio se mueva a tu favor","Reduce las comisiones, porque operas bastante más volumen","Multiplica el movimiento del precio en los dos sentidos por igual","Protege contra las caídas más bruscas del precio"]'::jsonb
 WHERE id = 'bb850f4d-27d2-4811-bcc1-f9d767ef9878';

-- 9: longitudes 85 / 80 / 78 / 71; la correcta es la B (80 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Porque los mercados suelen subir despacio y caer de golpe, y eso marca todo el patrón","Porque perder pesa más que ganar: se cierra pronto lo bueno y se aguanta lo malo","Porque las comisiones se cobran solo en las operaciones que acaban en ganancia","Porque los participantes profesionales manipulan los precios a su favor"]'::jsonb
 WHERE id = '068e3645-bed9-4124-8eda-32b7205647a5';

-- ------------------------------------------------------------------------
-- M2 Decidir con criterio
-- ------------------------------------------------------------------------

-- 1: longitudes 77 / 66 / 71 / 52; la correcta es la C (71 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Una rentabilidad media razonable, siempre que te formes bien antes de empezar","Que perderás dinero con toda seguridad, antes o después de empezar","Nada concreto: cualquier cifra sobre tu resultado futuro está inventada","Que ganarás si le dedicas suficientes horas cada día"]'::jsonb
 WHERE id = '1c564961-f0ad-4557-b2b0-6a414dc84fde';

-- 2: longitudes 120 / 73 / 55 / 108; la correcta es la D (108 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Que el 90 % es una cifra verificada y publicada por los reguladores europeos del sector, revisada cada año en un informe","Que no existe ningún dato publicado sobre esto en ninguna parte del mundo","Que la cifra real es bastante menor de la que se repite","Que los intermediarios europeos de contratos por diferencias publican por obligación cifras del 70 % al 85 %"]'::jsonb
 WHERE id = 'fd154077-505f-4703-9c17-f8b36609f6b1';

-- 3: longitudes 66 / 75 / 60 / 66; la correcta es la A (66 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Es necesaria pero no suficiente: no cambia de dónde sale el dinero","Es exactamente la diferencia entre acabar ganando y acabar perdiendo dinero","No sirve absolutamente de nada, porque todo depende del azar","Garantiza resultados positivos a partir del primer año de práctica"]'::jsonb
 WHERE id = 'e316abe8-b868-43c3-8938-b6666b91745f';

-- 4: longitudes 91 / 84 / 68 / 69; la correcta es la B (84 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Porque los ingresos tributan de una forma distinta a las ganancias patrimoniales de capital","Porque no es previsible ni regular, y llamarlo así cambia cómo se planifica una vida","Porque hablar de ingresos exige una dedicación completa y continuada","Porque solo se considera un ingreso si superas cierta cantidad al año"]'::jsonb
 WHERE id = '1abad249-e18b-46a0-8607-e22e3feaee19';

-- 5: longitudes 78 / 69 / 76 / 60; la correcta es la C (76 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Unas pocas semanas, si se practica de forma intensiva y con un método ordenado","Unos meses, siempre que lleves un registro ordenado de cada operación","Muchas operaciones a lo largo de mucho tiempo, pagando costes mientras tanto","Se sabe ya desde las primeras operaciones que llegas a hacer"]'::jsonb
 WHERE id = '46eab569-5906-42fd-a6ca-dc33e215679c';

-- 6: longitudes 69 / 57 / 54 / 59; la correcta es la D (59 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["No: solo cuenta cuando llegas a convertir el dinero a euros de verdad","No, mientras el dinero no llegue a salir de la plataforma","Solo si la cantidad intercambiada supera cierto límite","Sí: en bastantes países el intercambio ya cuenta como venta"]'::jsonb
 WHERE id = '5ed1cfc8-9379-4b30-b333-346401008a9e';

-- 7: longitudes 106 / 107 / 79 / 57; la correcta es la A (106 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Porque las ganancias de un periodo pueden tributar sin que las pérdidas posteriores las compensen del todo","No es posible en ningún caso: si el año termina en pérdidas, no hay absolutamente nada que declarar a nadie","Porque se tributa por el volumen operado en el año, y no por el resultado final","Solo ocurre con los productos apalancados y los derivados"]'::jsonb
 WHERE id = '95b55ec0-0e9c-4b6e-8382-c63048ea0361';

-- 8: longitudes 84 / 81 / 56 / 61; la correcta es la B (81 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Nada: las plataformas lo conservan indefinidamente y siempre se puede volver a pedir","Exportarlo y guardarlo periódicamente, porque reconstruirlo después es mucho peor","Anotar solo las operaciones que acabaron dando beneficio","Esperar a la primera declaración para pedirlo a la plataforma"]'::jsonb
 WHERE id = '2f1a3c2e-851b-4d6e-878e-c5df21f0a2ad';

-- 9: longitudes 74 / 60 / 69 / 57; la correcta es la C (69 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Que el mercado esté atravesando un momento especialmente volátil y confuso","Que no tengas todavía una estrategia escrita y bien definida","Que no puedas explicar con tus palabras de dónde saldría tu beneficio","Que la plataforma que estás usando cobre comisiones altas"]'::jsonb
 WHERE id = '5d2709fc-eadc-46f4-b866-4c134ef13557';

COMMIT;


-- ============================================================================
-- COMPROBACIONES (solo lectura)
-- ============================================================================
-- 1. Cuantas veces la correcta es la mas larga (deberia ser 4 de 27)
--
-- SELECT count(*) FROM (
--   SELECT q.id,
--          length(q.options->>q.correct_answer) AS correcta,
--          (SELECT max(length(o)) FROM jsonb_array_elements_text(q.options) o) AS mayor
--     FROM public.quiz_questions q
--     JOIN public.modules m ON m.id = q.module_id
--     JOIN public.courses c ON c.id = m.course_id
--    WHERE c.slug = 'introduccion-al-trading-de-criptomonedas'
-- ) t WHERE correcta = mayor;
-- QUE DEBE SALIR: 4 o menos.
--
-- 2. Ninguna pregunta puede haber perdido opciones ni tenerlas repetidas
--
-- SELECT count(*) FROM public.quiz_questions q
--   JOIN public.modules m ON m.id = q.module_id
--   JOIN public.courses c ON c.id = m.course_id
--  WHERE c.slug = 'introduccion-al-trading-de-criptomonedas'
--    AND (jsonb_array_length(q.options) <> 4
--         OR (SELECT count(DISTINCT o) FROM jsonb_array_elements_text(q.options) o) <> 4);
-- QUE DEBE SALIR: 0.
