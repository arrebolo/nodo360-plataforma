-- ============================================================================
-- 069: distractores creibles en Ethereum y contratos inteligentes
-- ============================================================================
-- ESTADO: APLICADA EN PRODUCCION EL 25/09/2026.
--   Ejecutada por PostgREST y versionada despues.
--
-- QUE PASABA
--   En 13 de las 27 preguntas de este curso la respuesta correcta era la opcion
--   mas larga, con 4.8 caracteres de ventaja de media. "Elegir la mas larga"
--   acertaba el 48%, y el umbral de aprobado es 70%.
--
-- QUE HACE
--   Reescribe 7 distractores en 7 preguntas. La respuesta correcta NO se
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
--     la correcta es la mas larga       13/27      6/27   (azar: ~25%)
--     margen medio de esas                4.8       3.5
--     preguntas con margen > 6 car        4         0
--     "elegir la mas larga" acierta      48%       22%
--
-- COMPROBADO ADEMAS
--   - Ningun distractor nuevo nombra una marca ni un producto.
--   - Ninguna tira de cinco palabras de un distractor aparece en el texto de las
--     lecciones del curso, que es la senal de que un distractor podria estar
--     afirmando algo que la leccion da por cierto.
--
-- RESPALDO
--   C:/Users/alber/backups-sql/069-volver-atras.sql.bak
-- ============================================================================

BEGIN;

-- ------------------------------------------------------------------------
-- M0 Qué añadió Ethereum
-- ------------------------------------------------------------------------

-- 3: longitudes 90 / 79 / 86 / 77; la correcta es la C (86 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Puedes moverlo, pero la operación tarda bastante más en confirmarse de lo que sería normal","El token queda bloqueado automáticamente hasta que ingreses ether en esa cuenta","No puedes moverlo: mover un token es llamar a un programa, y ejecutar se paga en ether","Puedes moverlo y la comisión se descuenta del propio token que estás enviando"]'::jsonb
 WHERE id = '4895657e-b073-4c0b-805f-8afbd893058c';

-- 4: longitudes 77 / 79 / 90 / 84; la correcta es la D (84 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Para financiar el desarrollo del protocolo y pagar a quienes mantienen la red","Porque el espacio de almacenamiento de la cadena está limitado por el protocolo","Para que la moneda nativa tenga demanda constante y no llegue a perder valor con el tiempo","Porque nada impediría mandarle un programa que no terminara nunca y bloquear a todos"]'::jsonb
 WHERE id = '691a966e-1cb5-4ee6-936f-5cdfc877c97e';

-- 6: longitudes 83 / 95 / 83 / 97; la correcta es la B (95 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Porque el protocolo da menos prioridad a las operaciones pequeñas si hay congestión","Porque el coste depende de lo que la red tenga que hacer, no de cuánto mueves: es un peaje fijo","Porque la comisión es un porcentaje de la cantidad enviada y sube con la congestión","Porque las cuentas con poco saldo pierden el acceso temporalmente cuando la red se llena del todo"]'::jsonb
 WHERE id = 'd1476d4c-584f-431c-9d73-a2ebd5b847a2';

-- 7: longitudes 91 / 104 / 100 / 90; la correcta es la C (100 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Porque generar azar de verdad exigiría tanto cómputo que las operaciones serían inasumibles","Porque la máquina virtual no incluye las instrucciones matemáticas que harían falta para poder generarlo","Porque todos los que mantienen una copia deben obtener el mismo resultado, y el azar es lo contrario","Porque el azar solo está disponible en las capas construidas encima de la cadena principal"]'::jsonb
 WHERE id = '94bdd01e-b5b5-4cf2-bbd7-7456d802f1c9';

-- ------------------------------------------------------------------------
-- M2 Lo que te vas a encontrar
-- ------------------------------------------------------------------------

-- 3: longitudes 85 / 89 / 77 / 68; la correcta es la A (85 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Que no caduca, suele pedirse sin tope, y sigue viva aunque el contrato cambie después","Que se puede revocar sin ningún coste desde la misma aplicación que te la ha pedido antes","Que caduca automáticamente en cuanto cierras la sesión en la web que la pidió","Que solo permite mover la cantidad exacta que pactaste al concederla"]'::jsonb
 WHERE id = 'ee04c0de-8962-4452-871a-0afcd6e3ca5f';

-- 6: longitudes 94 / 80 / 78 / 87; la correcta es la D (87 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Porque hace falta identificarse ante el emisor antes de poder recibirlas o enviarlas a alguien","Porque solo pueden moverse durante el horario en el que el emisor está operativo","Porque su valor cambia dependiendo de la red en la que se emitan y se utilicen","Porque su contrato suele poder impedir que una dirección las mueva, e incluso anularlas"]'::jsonb
 WHERE id = '02d67e48-c4ef-4d1a-b859-b00046c73422';

-- 7: longitudes 92 / 84 / 84 / 95; la correcta es la A (92 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Porque el respaldo era la voluntad de otros de seguir participando, que es lo que desaparece","Porque los contratos que lo implementaban compartían un fallo que acabó explotándose","Porque los reguladores intervinieron en el momento crítico y bloquearon el mecanismo","Porque el oráculo del que dependían dejaba de actualizar el precio justo en los peores momentos"]'::jsonb
 WHERE id = '45ad0af0-2b5a-4804-988f-0390f97bae57';

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
--    WHERE c.slug = 'ethereum-y-contratos-inteligentes'
-- ) t WHERE correcta = mayor;
-- QUE DEBE SALIR: 6 o menos.
--
-- 2. Ninguna pregunta puede haber perdido opciones ni tenerlas repetidas
--
-- SELECT count(*) FROM public.quiz_questions q
--   JOIN public.modules m ON m.id = q.module_id
--   JOIN public.courses c ON c.id = m.course_id
--  WHERE c.slug = 'ethereum-y-contratos-inteligentes'
--    AND (jsonb_array_length(q.options) <> 4
--         OR (SELECT count(DISTINCT o) FROM jsonb_array_elements_text(q.options) o) <> 4);
-- QUE DEBE SALIR: 0.
