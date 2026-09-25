-- ============================================================================
-- 061: distractores creibles en Fundamentos de Bitcoin
-- ============================================================================
-- ESTADO: APLICADA EN PRODUCCION EL 25/09/2026.
--   Ejecutada por PostgREST y versionada despues.
--
-- QUE PASABA
--   En 26 de las 27 preguntas de este curso la respuesta correcta era la opcion
--   mas larga, con 30.0 caracteres de ventaja de media. "Elegir la mas larga"
--   acertaba el 96%, y el umbral de aprobado es 70%.
--
-- QUE HACE
--   Reescribe 69 distractores en 23 preguntas. La respuesta correcta NO se
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
--     la correcta es la mas larga       26/27      6/27   (azar: ~25%)
--     margen medio de esas               30.0       3.2
--     preguntas con margen > 6 car       23         0
--     "elegir la mas larga" acierta      96%       22%
--
-- COMPROBADO ADEMAS
--   - Ningun distractor nuevo nombra una marca ni un producto.
--   - Ninguna tira de cinco palabras de un distractor aparece en el texto de las
--     lecciones del curso, que es la senal de que un distractor podria estar
--     afirmando algo que la leccion da por cierto.
--
-- RESPALDO
--   C:/Users/alber/backups-sql/061-volver-atras.sql.bak
-- ============================================================================

BEGIN;

-- ------------------------------------------------------------------------
-- M0 El problema del dinero
-- ------------------------------------------------------------------------

-- 1: longitudes 80 / 100 / 88 / 84; la correcta es la C (88 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Porque todas ellas son escasas por naturaleza y resultan difíciles de falsificar","Porque en cada caso un gobierno las declaró moneda de curso legal y obligó a aceptarlas en los pagos","Porque el valor lo sostiene la expectativa de que otros lo aceptarán, no el objeto en sí","Porque todas se pueden dividir en partes iguales y volver a sumarse sin perder valor"]'::jsonb
 WHERE id = 'a25abe2f-94ae-4bda-9990-c8b3fda5b870';

-- 2: longitudes 78 / 95 / 75 / 88; la correcta es la D (88 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Que el trigo se eche a perder con el tiempo mientras los zapatos aguantan años","Que no exista ninguna forma de medir cuántos pares de zapatos vale exactamente un saco de trigo","Que el zapatero pueda negarse a comerciar contigo y no te quede alternativa","Que haga falta encontrar a alguien que tenga zapatos y quiera trigo justo en ese momento"]'::jsonb
 WHERE id = '76c8bb02-4505-4e95-8b31-a41b6a92e524';

-- 3: longitudes 95 / 104 / 100 / 83; la correcta es la A (95 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Que las tres funciones del dinero no son un todo o nada: algo puede cumplir bien una y mal otra","Que el oro en realidad no llegó a ser dinero de verdad, sino solamente un metal valioso, escaso y pesado","Que la función de reserva de valor es la más importante de las tres, y las otras dos derivan de ella","Que solo el dinero digital puede cumplir las tres funciones a la vez y sin estorbar"]'::jsonb
 WHERE id = 'b4bfe873-74f4-4b1d-a667-6bec8475cad4';

-- 4: longitudes 92 / 93 / 87 / 87; la correcta es la B (93 car, intacta), y sigue siendo la mas larga por 1
UPDATE public.quiz_questions
   SET options = '["Porque los bancos la ocultan a propósito en los extractos mensuales que te envían por correo","Porque nadie cobra nada explícitamente: el saldo no baja, baja lo que se puede comprar con él","Porque solo afecta a quien tiene deudas, y a esos el banco no les manda ningún extracto","Porque la ley prohíbe informar de ella a los clientes dentro de los extractos bancarios"]'::jsonb
 WHERE id = '2bb0f5d5-7f6b-49e5-877a-a2023cae72e0';

-- 6: longitudes 82 / 68 / 67 / 72; la correcta es la D (72 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Que cualquier alternativa que quite intermediarios será mejor que lo que hay ahora","Que el sistema está a punto de colapsar y conviene buscar un refugio","Que los bancos centrales actúan de mala fe al tomar esas decisiones","Que esos costes existen y conviene entenderlos; no que exista algo mejor"]'::jsonb
 WHERE id = '0689b9ad-1d23-42ad-be31-8759328ae2c9';

-- 7: longitudes 88 / 93 / 84 / 83; la correcta es la A (88 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Era una empresa: todo pasaba por sus servidores, y al cerrar la empresa cerró el sistema","Su criptografía resultó estar rota y alguien acabó falsificando sus monedas sin ser detectado","No consiguió evitar que se falsificaran sus monedas digitales sin permiso del emisor","Llegó demasiado pronto, cuando casi nadie tenía todavía conexión a internet en casa"]'::jsonb
 WHERE id = '72f8c5ce-9030-48ba-b648-fb2520ec13ba';

-- 8: longitudes 78 / 70 / 68 / 69; la correcta es la B (70 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["El registro compartido que los participantes guardan y comparan unos con otros","La prueba de trabajo: un cálculo costoso de hacer y fácil de comprobar","Las firmas digitales que demuestran quién es el dueño de cada unidad","La idea de fijar por adelantado el límite máximo de unidades emitidas"]'::jsonb
 WHERE id = 'beb1e4f6-cb87-459b-9071-07d42122ba4c';

-- 9: longitudes 89 / 106 / 96 / 96; la correcta es la C (96 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Que las comisiones acababan cobrándose dos veces en cada transacción que hacías con ellas","Que había que pagar una vez por emitir la moneda y otra vez más por transferirla a otra persona cualquiera","Que un archivo digital se copia sin coste, así que el mismo dinero podía enviarse a dos personas","Que dos sistemas distintos emitían la misma moneda al mismo tiempo y sin saberlo el uno del otro"]'::jsonb
 WHERE id = '94d1bdd9-1fdf-4792-bf63-6df2e38320dd';

-- ------------------------------------------------------------------------
-- M1 El nacimiento de Bitcoin
-- ------------------------------------------------------------------------

-- 1: longitudes 87 / 111 / 80 / 99; la correcta es la D (99 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Porque su código no está terminado y sigue en desarrollo permanente desde el primer día","Porque lo gestiona una fundación sin ánimo de lucro que coordina el trabajo de los desarrolladores del proyecto","Porque todavía no se ha registrado como marca comercial en ningún país del mundo","Porque son reglas públicas que cualquiera puede implementar y ejecutar, sin que nadie autorice nada"]'::jsonb
 WHERE id = '6637b058-1cd9-45fe-b91d-6f4af518c8ad';

-- 2: longitudes 123 / 80 / 122 / 86; la correcta es la A (123 car, intacta), y sigue siendo la mas larga por 1
UPDATE public.quiz_questions
   SET options = '["Que la confianza no desaparece, se mueve: a la criptografía, al programa que ejecutas y a que la mayoría no quiera romperlo","Nada en absoluto: la afirmación es exacta tal y como está formulada, sin matices","Que en realidad sí existe una entidad central que decide, aunque sea poco conocida fuera del sector y casi nadie la nombre","Que solo es cierta para quien ejecuta su propio nodo completo y verifica por su cuenta"]'::jsonb
 WHERE id = '9ca91a8a-bae9-4b17-afcb-116de3a06409';

-- 3: longitudes 85 / 124 / 128 / 81; la correcta es la B (124 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Que la mayor parte de su uso es ilícito, precisamente porque nadie filtra quién entra","Que la resistencia a la censura vale en las dos direcciones: no se puede excluir a nadie, ni siquiera a quien te parezca mal","Que se pueden bloquear transacciones concretas siempre que haya consenso suficiente entre los participantes que sostienen la red","Que los reguladores no pueden hacer nada en ningún punto del recorrido del dinero"]'::jsonb
 WHERE id = '350cb950-b0f4-4682-a21a-0fa59155e46e';

-- 4: longitudes 84 / 87 / 81 / 84; la correcta es la C (81 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Sale de un cálculo hecho sobre la población mundial prevista para el siglo que viene","Es el máximo que permite la criptografía utilizada, y subirlo exigiría cambiarla entera","Nada en sí misma: lo relevante es que se conoce de antemano y no depende de nadie","Coincide con la cantidad de oro que queda por extraer, medida en las mismas unidades"]'::jsonb
 WHERE id = '070116f6-48db-4a1c-8d31-adde5a4bf5b6';

-- 5: longitudes 62 / 69 / 59 / 62; la correcta es la D (62 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Se revisa el límite total de emisión y se ajusta si hace falta","Se ajusta la dificultad de la prueba de trabajo al cómputo disponible","Se renuevan las claves de todos los participantes de la red","La cantidad de bitcoins emitida por bloque se divide entre dos"]'::jsonb
 WHERE id = '9958bb36-b35d-4e5e-863d-21804fb58068';

-- 8: longitudes 84 / 109 / 98 / 85; la correcta es la C (98 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Porque las direcciones son largas, difíciles de leer y fáciles de confundir entre sí","Porque el protocolo no comprueba el formato de las direcciones antes de aceptar el envío, y acepta cualquiera","Porque al no haber intermediario tampoco hay quien corrija un envío equivocado o una clave perdida","Porque una transacción puede tardar horas en confirmarse y entretanto no se sabe nada"]'::jsonb
 WHERE id = '249b4633-7f25-4c0c-9606-cd992abfcdcd';

-- 9: longitudes 58 / 53 / 53 / 58; la correcta es la D (58 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["¿Lo dice alguien con experiencia contrastada en el sector?","¿Cuánta gente lo está usando ya exactamente para eso?","¿Está recogido en el documento original de 2008 o no?","¿Es una propiedad del protocolo o de cómo lo usa la gente?"]'::jsonb
 WHERE id = '628ddfbc-fad0-4b43-871f-5032c1832c25';

-- ------------------------------------------------------------------------
-- M2 Bitcoin como sistema monetario
-- ------------------------------------------------------------------------

-- 1: longitudes 101 / 102 / 73 / 73; la correcta es la A (101 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Medio de intercambio, parcialmente: funciona donde las alternativas fallan y pierde donde son cómodas","Unidad de cuenta, porque dentro del sector se expresan los precios en bitcoin y no en moneda corriente","Las tres funciones por igual, y desde su creación en 2009 sin excepciones","Ninguna de las tres: no cumple ninguna en ningún grado ni en ningún sitio"]'::jsonb
 WHERE id = '30509276-0eea-49e0-953b-8ec4bb7769e2';

-- 2: longitudes 82 / 124 / 128 / 86; la correcta es la B (124 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["En que la emisión no es realmente predecible, porque depende de cuántos participen","En que mezcla dos preguntas independientes: protegerse de la emisión arbitraria no es lo mismo que conservar poder de compra","En nada en absoluto: la conclusión se sigue directamente de la premisa, y la premisa es además cierta y comprobable en la cadena","En que el poder de compra solo se puede medir frente al oro, y no frente a otras cosas"]'::jsonb
 WHERE id = 'e6072f9b-6f98-49db-a0ea-6f2a52c4d39a';

-- 3: longitudes 65 / 88 / 69 / 59; la correcta es la C (69 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Todas exigen modificar el protocolo antes de que puedan cumplirse","Todas dependen de decisiones que tomen los reguladores de cada país en los próximos años","Todas apuntan a más uso y más tiempo, y ninguna depende del protocolo","Todas requieren elevar el límite de 21 millones de unidades"]'::jsonb
 WHERE id = '15cd70f9-f264-4de1-8e85-e22b5d624c1b';

-- 4: longitudes 81 / 117 / 88 / 114; la correcta es la D (114 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Como una ventaja clara del sistema actual, que puede reaccionar cuando hace falta","Como una ventaja clara de Bitcoin, que al no poder intervenir evita de raíz cualquier abuso de quien maneja el dinero","Como un defecto que se corregirá en futuras versiones del protocolo, cuando haya acuerdo","Como dos caras de la misma decisión: la capacidad de intervenir y la de equivocarse interviniendo son inseparables"]'::jsonb
 WHERE id = '6c7769cd-1a5c-40f6-b7f6-63ab4429da0d';

-- 5: longitudes 104 / 97 / 114 / 72; la correcta es la A (104 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Porque casi nadie usa una sola forma de dinero, y los puntos fuertes de cada uno están en usos distintos","Porque el resultado ya está decidido a favor del sistema actual, que lleva siglos funcionando así","Porque los dos sistemas son técnicamente idénticos por debajo, y solo cambia quién los administra y con qué reglas","Porque la respuesta depende de la regulación que se apruebe en cada país"]'::jsonb
 WHERE id = 'd11cc8af-5bb7-4f25-913d-e936b06a3e85';

-- 6: longitudes 42 / 56 / 44 / 51; la correcta es la B (56 car, intacta), y sigue siendo la mas larga por 5
UPDATE public.quiz_questions
   SET options = '["Mover valor de un sitio a otro a distancia","Impedir que te engañen, y corregir quién empieza con más","Llevar la cuenta ordenada de quién tiene qué","Permitir que exista el ahorro a lo largo del tiempo"]'::jsonb
 WHERE id = '6041c578-226b-4b8e-937d-aae013f42a06';

-- 7: longitudes 74 / 40 / 62 / 36; la correcta es la C (62 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Un dato verificable en la cadena de bloques por cualquiera que la consulte","Una regla escrita en el propio protocolo","Una hipótesis razonable, que solo se puede comprobar si ocurre","Una falsedad que ya se ha demostrado"]'::jsonb
 WHERE id = '2378d0f9-9a8a-43bc-a7b4-666bdcbca4b3';

-- 8: longitudes 86 / 109 / 76 / 105; la correcta es la D (105 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Porque los programas actuales no están optimizados y desperdician capacidad de cálculo","Porque el límite lo impone la velocidad de las conexiones a internet de los participantes, que no da para más","Porque aumentaría demasiado el consumo energético de toda la red en conjunto","Porque hacerlo exigiría equipos más potentes para verificar, y eso dejaría la verificación en menos manos"]'::jsonb
 WHERE id = 'b57ac92b-b16b-4fd7-b490-04b69da75615';

COMMIT;


-- ============================================================================
-- COMPROBACIONES (solo lectura)
-- ============================================================================
-- 1. Cuantas veces la correcta es la mas larga (deberia ser 6 de 27)
--
-- SELECT count(*) FROM (
--   SELECT q.id,
--          length(q.options->>q.correct_answer) AS correcta,
--          (SELECT max(length(o)) FROM jsonb_array_elements_text(q.options) o) AS mayor
--     FROM public.quiz_questions q
--     JOIN public.modules m ON m.id = q.module_id
--     JOIN public.courses c ON c.id = m.course_id
--    WHERE c.slug = 'fundamentos-de-bitcoin'
-- ) t WHERE correcta = mayor;
-- QUE DEBE SALIR: 6 o menos.
--
-- 2. Ninguna pregunta puede haber perdido opciones ni tenerlas repetidas
--
-- SELECT count(*) FROM public.quiz_questions q
--   JOIN public.modules m ON m.id = q.module_id
--   JOIN public.courses c ON c.id = m.course_id
--  WHERE c.slug = 'fundamentos-de-bitcoin'
--    AND (jsonb_array_length(q.options) <> 4
--         OR (SELECT count(DISTINCT o) FROM jsonb_array_elements_text(q.options) o) <> 4);
-- QUE DEBE SALIR: 0.
