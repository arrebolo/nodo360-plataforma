-- ============================================================================
-- 065: distractores creibles en Blockchain: lo que Bitcoin no es
-- ============================================================================
-- ESTADO: APLICADA EN PRODUCCION EL 25/09/2026.
--   Ejecutada por PostgREST y versionada despues.
--
-- QUE PASABA
--   En 20 de las 27 preguntas de este curso la respuesta correcta era la opcion
--   mas larga, con 27.3 caracteres de ventaja de media. "Elegir la mas larga"
--   acertaba el 78%, y el umbral de aprobado es 70%.
--
-- QUE HACE
--   Reescribe 59 distractores en 20 preguntas. La respuesta correcta NO se
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
--     la correcta es la mas larga       20/27      4/27   (azar: ~25%)
--     margen medio de esas               27.3       4.5
--     preguntas con margen > 6 car       19         0
--     "elegir la mas larga" acierta      78%       19%
--
-- COMPROBADO ADEMAS
--   - Ningun distractor nuevo nombra una marca ni un producto.
--   - Ninguna tira de cinco palabras de un distractor aparece en el texto de las
--     lecciones del curso, que es la senal de que un distractor podria estar
--     afirmando algo que la leccion da por cierto.
--
-- RESPALDO
--   C:/Users/alber/backups-sql/065-volver-atras.sql.bak
-- ============================================================================

BEGIN;

-- ------------------------------------------------------------------------
-- M0 Lo que comparten todas
-- ------------------------------------------------------------------------

-- 1: longitudes 65 / 62 / 116 / 102; la correcta es la D (102 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Crear una moneda que no controle ningún gobierno ni banco central","Cifrar la información para que nadie más pueda llegar a leerla","Conseguir que las transferencias sean instantáneas y gratuitas para cualquiera que quiera usarlas en cualquier parte","Que participantes que no se conocen ni se fían coincidan en un orden de los hechos sin que nadie mande"]'::jsonb
 WHERE id = '935620cf-7173-4efc-9387-30a8d2e00595';

-- 4: longitudes 39 / 38 / 43 / 40; la correcta es la C (43 car, intacta), y sigue siendo la mas larga por 3
UPDATE public.quiz_questions
   SET options = '["Entre la velocidad y el coste de operar","Entre la privacidad y la transparencia","Entre responder siempre y coincidir siempre","Entre la seguridad y la facilidad de uso"]'::jsonb
 WHERE id = 'f48ac80c-5e7f-4db8-84bd-2a33672075a8';

-- 5: longitudes 88 / 70 / 69 / 75; la correcta es la D (75 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Porque los participantes no hablan el mismo idioma técnico y no se entienden entre ellos","Porque votar sería demasiado lento en una red con tantos participantes","Porque la mayoría de los participantes no querría molestarse en votar","Porque crear identidades nuevas no cuesta nada, así que no se pueden contar"]'::jsonb
 WHERE id = 'd27251af-0a85-4e6f-9a4b-424624590745';

-- 6: longitudes 65 / 69 / 49 / 60; la correcta es la A (65 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Tan costosa de deshacer que nadie va a pagarlo, pero no imposible","Matemáticamente irreversible, sin que quepa ninguna excepción posible","Reversible solo por los mineros que la incluyeron","Definitiva, porque la han firmado seis validadores distintos"]'::jsonb
 WHERE id = '69d615f6-cbc5-4795-89ea-efb74a27223b';

-- 7: longitudes 53 / 87 / 93 / 58; la correcta es la B (87 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Que una de las dos es bastante más segura que la otra","Que con movimientos el saldo es un cálculo, y con estado es una casilla que se modifica","Que el estado compartido solo lo usan las redes que tienen una lista de participantes cerrada","Que anotar movimientos es una técnica bastante más moderna"]'::jsonb
 WHERE id = '920268fb-d9d5-4ae0-af60-c0ae047a2a64';

-- 8: longitudes 43 / 51 / 56 / 43; la correcta es la C (56 car, intacta), y sigue siendo la mas larga por 5
UPDATE public.quiz_questions
   SET options = '["Que tenga muchísimos participantes a la vez","Que use prueba de participación en lugar de energía","Que guarde un estado y acepte programas que lo modifican","Que permita hacer transacciones más rápidas"]'::jsonb
 WHERE id = '185426e8-b36d-4d4f-826a-aae34e558e1d';

-- 9: longitudes 69 / 118 / 69 / 116; la correcta es la D (116 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Porque las operaciones caducan si esperan demasiado tiempo en la cola","Porque el orden en que entran determina la comisión que acaba pagando cada una de las operaciones que están implicadas","Porque sin un orden claro no se pueden encadenar los bloques entre sí","Porque dos operaciones sobre la misma tabla dan resultados distintos según el orden, y quien lo decide tiene ventaja"]'::jsonb
 WHERE id = '9388573a-d790-4ab7-8ff9-9999b2831135';

-- ------------------------------------------------------------------------
-- M1 Dónde se separan
-- ------------------------------------------------------------------------

-- 4: longitudes 104 / 48 / 48 / 91; la correcta es la D (91 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Que los validadores acaban pagando impuestos dos veces por la misma fianza, al bloquearla y al retirarla","Que la fianza no se puede llegar a retirar nunca","Que obliga a usar una moneda estable como fianza","Que lo que se arriesga es lo mismo que se protege, así que la seguridad depende de su valor"]'::jsonb
 WHERE id = '5c02d178-7e35-4abe-bb09-cc73db267775';

-- 5: longitudes 77 / 85 / 54 / 52; la correcta es la A (77 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Porque cada copia cuesta más de mantener, así que menos gente puede tener una","Porque los usuarios pierden interés cuando todo va demasiado rápido y no lo entienden","Porque las redes rápidas acaban cobrando por verificar","Porque la velocidad obliga a usar listas de permisos"]'::jsonb
 WHERE id = '4bf51ba5-66a9-429a-98ba-fa78e6a4d316';

-- 6: longitudes 92 / 86 / 52 / 52; la correcta es la B (86 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Que es un teorema demostrado formalmente y conviene aplicarlo siempre que se compare una red","Que es un resumen demasiado limpio: sus términos no están definidos y no es un teorema","Que solo se aplica a las redes con prueba de trabajo","Que ya lo resolvieron las redes de última generación"]'::jsonb
 WHERE id = '9da36dab-32e2-4acb-aa4c-f709ce7cb392';

-- 8: longitudes 42 / 78 / 56 / 72; la correcta es la D (72 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Más resistencia a la censura de cualquiera","Que el registro sea imposible de revertir, ni siquiera por acuerdo de la lista","Que cualquiera pueda comprobarlo desde fuera de la lista","Que se pueda votar, y con ello rapidez, coste bajo y finalidad inmediata"]'::jsonb
 WHERE id = 'e1f8af87-40e3-439a-a65d-83d197be65c3';

-- 9: longitudes 75 / 81 / 57 / 45; la correcta es la A (75 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Porque no había desconfianza que resolver: las partes ya se fiaban entre sí","Porque la tecnología no estaba madura cuando esos proyectos se pusieron en marcha","Porque los reguladores de cada país acabaron impidiéndolo","Porque faltaban programadores con experiencia"]'::jsonb
 WHERE id = '0964f8c0-2fb8-4953-b3c3-df866abc974f';

-- ------------------------------------------------------------------------
-- M2 Por qué hay tantas
-- ------------------------------------------------------------------------

-- 1: longitudes 41 / 51 / 64 / 42; la correcta es la B (51 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Un intercambio técnico realmente distinto","Nada comprobable más allá de emitir unidades nuevas","Un desacuerdo entre los participantes que acaba en una partición","Una exigencia impuesta por algún regulador"]'::jsonb
 WHERE id = '9898f411-59a2-4d7c-a034-ee1f9e7a9690';

-- 2: longitudes 44 / 42 / 50 / 44; la correcta es la C (50 car, intacta), y sigue siendo la mas larga por 6
UPDATE public.quiz_questions
   SET options = '["Se quedan solo en la red original de siempre","Se reparten a la mitad entre las dos redes","Quien las tuviera antes las tiene en las dos redes","Hay que reclamarlas en un plazo o se pierden"]'::jsonb
 WHERE id = '57e9207b-c2ed-4f1b-80a0-0639fc00c426';

-- 3: longitudes 78 / 62 / 56 / 74; la correcta es la D (74 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Que ha conseguido resolver el trilema que nadie más había resuelto hasta ahora","Que conviene entrar pronto, antes de que lo haga todo el mundo","Que en realidad es una red con lista cerrada de permisos","Que falta información: las palancas no se mueven todas hacia el mismo lado"]'::jsonb
 WHERE id = '24dd3349-c049-4dd2-a136-9630377edc66';

-- 4: longitudes 63 / 71 / 46 / 47; la correcta es la A (63 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Que haya gente manteniéndola: desarrollo activo y participantes","La calidad técnica de su diseño y de la implementación inicial que tuvo","El número total de unidades que llegó a emitir","El respaldo de alguna empresa grande del sector"]'::jsonb
 WHERE id = '9c898643-b018-4d1b-b58e-f087ad232cd3';

-- 5: longitudes 72 / 67 / 47 / 43; la correcta es la B (67 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Aumentar el tamaño de los bloques para que quepan muchas más operaciones","Hacer el trabajo fuera y usar la cadena solo para lo imprescindible","Reducir el número de validadores que participan","Cambiar a un consenso con lista de permisos"]'::jsonb
 WHERE id = '069f1ece-a38a-4f1e-ac83-aa6d2fc4a85d';

-- 6: longitudes 46 / 75 / 71 / 53; la correcta es la C (71 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Que los operadores publiquen su identidad real","Que la cadena principal no llegue a detenerse nunca mientras corre el plazo","Que haya al menos un participante honesto vigilando y capaz de impugnar","Que el precio de la unidad nativa se mantenga estable"]'::jsonb
 WHERE id = '46ec71e9-9826-44f9-bd4d-7755e452ea4b';

-- 7: longitudes 64 / 66 / 53 / 70; la correcta es la D (70 car, intacta), y sigue siendo la mas larga por 4
UPDATE public.quiz_questions
   SET options = '["Las unidades se transfieren de una cadena a la otra directamente","Se destruyen en la primera y se crean de la nada en la segunda red","Las dos redes comparten exactamente el mismo registro","Se inmovilizan en la primera y se emite un representante en la segunda"]'::jsonb
 WHERE id = 'c9eb58d6-18b8-4861-97c0-e697a8377528';

-- 8: longitudes 67 / 78 / 46 / 57; la correcta es la A (67 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Porque acumulan valor y no heredan la protección de lo que conectan","Porque su código es siempre de peor calidad que el de las cadenas que conectan","Porque no usan firmas digitales para autorizar","Porque los reguladores no los supervisan de ninguna forma"]'::jsonb
 WHERE id = '66a7e798-7a37-499c-b562-6980d31b98ff';

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
--    WHERE c.slug = 'fundamentos-blockchain'
-- ) t WHERE correcta = mayor;
-- QUE DEBE SALIR: 4 o menos.
--
-- 2. Ninguna pregunta puede haber perdido opciones ni tenerlas repetidas
--
-- SELECT count(*) FROM public.quiz_questions q
--   JOIN public.modules m ON m.id = q.module_id
--   JOIN public.courses c ON c.id = m.course_id
--  WHERE c.slug = 'fundamentos-blockchain'
--    AND (jsonb_array_length(q.options) <> 4
--         OR (SELECT count(DISTINCT o) FROM jsonb_array_elements_text(q.options) o) <> 4);
-- QUE DEBE SALIR: 0.
