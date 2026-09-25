-- ============================================================================
-- 066: distractores creibles en Uso práctico de Bitcoin
-- ============================================================================
-- ESTADO: APLICADA EN PRODUCCION EL 25/09/2026.
--   Ejecutada por PostgREST y versionada despues.
--
-- QUE PASABA
--   En 17 de las 27 preguntas de este curso la respuesta correcta era la opcion
--   mas larga, con 18.6 caracteres de ventaja de media. "Elegir la mas larga"
--   acertaba el 63%, y el umbral de aprobado es 70%.
--
-- QUE HACE
--   Reescribe 47 distractores en 16 preguntas. La respuesta correcta NO se
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
--     la correcta es la mas larga       17/27      6/27   (azar: ~25%)
--     margen medio de esas               18.6       4.8
--     preguntas con margen > 6 car       16         0
--     "elegir la mas larga" acierta      63%       22%
--
-- COMPROBADO ADEMAS
--   - Ningun distractor nuevo nombra una marca ni un producto.
--   - Ninguna tira de cinco palabras de un distractor aparece en el texto de las
--     lecciones del curso, que es la senal de que un distractor podria estar
--     afirmando algo que la leccion da por cierto.
--
-- RESPALDO
--   C:/Users/alber/backups-sql/066-volver-atras.sql.bak
-- ============================================================================

BEGIN;

-- ------------------------------------------------------------------------
-- M0 Antes de tu primera transacción
-- ------------------------------------------------------------------------

-- 1: longitudes 98 / 114 / 65 / 80; la correcta es la A (98 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Siguen en el registro de la red; con la copia de seguridad los recuperas en cualquier otra cartera","Se pierden para siempre, porque estaban guardados dentro de la propia aplicación del teléfono que has desinstalado","Se devuelven automáticamente a la dirección de quien te los envió","Quedan bloqueados hasta que reinstales esa misma aplicación en el mismo teléfono"]'::jsonb
 WHERE id = '12a6cd93-2e90-4417-b58e-f30fb0678b3b';

-- 2: longitudes 79 / 71 / 55 / 67; la correcta es la B (71 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Que tiene un sistema de respaldo especialmente bueno, mejor que el de las demás","Que las claves no son tuyas: las tiene quien puede devolverte el acceso","Que usa un estándar distinto para la copia de seguridad","Que conviene activar además la verificación en dos pasos del correo"]'::jsonb
 WHERE id = 'eb45adba-3396-45d3-b14e-eb5694d75634';

-- 3: longitudes 76 / 60 / 72 / 62; la correcta es la C (72 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Todo el ciclo de vida de la semilla, desde el momento mismo en que se genera","Los fondos frente a un envío hecho a la dirección equivocada","Lo que ocurre con tus claves después de generarlas; no cómo se generaron","El valor de los bitcoins frente a las caídas bruscas de precio"]'::jsonb
 WHERE id = 'aa34b9ea-c6ed-41a9-a412-35dffbf55675';

-- 5: longitudes 92 / 106 / 73 / 69; la correcta es la A (92 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Ninguna: cada una intercambia identificación, confianza, coste y comodidad de forma distinta","El intercambio entre particulares, porque evita tener que identificarse ante ninguna empresa ni plataforma","Cobrar por tu trabajo, porque de ese modo no hay que comprar nada a nadie","La plataforma con custodia, porque es sin duda la más cómoda de todas"]'::jsonb
 WHERE id = '86e12dbf-2cf3-43ce-bea4-435c1c84bf54';

-- 6: longitudes 78 / 84 / 66 / 60; la correcta es la B (84 car, intacta), y sigue siendo la mas larga por 6
UPDATE public.quiz_questions
   SET options = '["Que tus transacciones futuras pasan a ser privadas para la plataforma que usas","Que tu identidad queda asociada a esa dirección, y la cadena es pública y permanente","Que la plataforma responde de los fondos incluso una vez retirados","Que quedas exento de cualquier obligación fiscal en ese país"]'::jsonb
 WHERE id = 'f1ce2c21-312a-4948-beb3-b5b6e729e485';

-- 7: longitudes 74 / 62 / 80 / 60; la correcta es la C (80 car, intacta), y sigue siendo la mas larga por 6
UPDATE public.quiz_questions
   SET options = '["Porque las direcciones son muy difíciles de rastrear para quien lo intente","Porque las comisiones bajas abaratan mucho el coste del ataque","Porque una transacción confirmada no se deshace: no hay reclamación ni reversión","Porque la mayoría de los usuarios no usa contraseñas seguras"]'::jsonb
 WHERE id = '78ae1b43-48ef-4240-9170-f6e3cb2148a4';

-- 8: longitudes 88 / 69 / 61 / 78; la correcta es la D (78 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Aceptar la ayuda, siempre que se identifique como parte del soporte oficial del proyecto","Aceptar solo si no te pide la frase de recuperación en ningún momento","Compartir pantalla con él para que vea el problema más rápido","Desconfiar: la ayuda legítima ocurre en público, donde otros pueden corregirla"]'::jsonb
 WHERE id = '47bc820a-bb50-46eb-8445-af9004e93d6f';

-- 9: longitudes 83 / 88 / 64 / 62; la correcta es la A (83 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Que sea una dirección envenenada, sembrada ahí a propósito para parecerse a la tuya","Ninguno en absoluto: si la dirección ya funcionó una vez antes, sigue siendo la correcta","Que la dirección haya caducado con el tiempo y el envío te falle","Que la cartera te cobre una comisión más alta por reutilizarla"]'::jsonb
 WHERE id = '23e41356-24df-484b-aa2b-485fb31d414c';

-- ------------------------------------------------------------------------
-- M1 Tu primera transacción
-- ------------------------------------------------------------------------

-- 3: longitudes 69 / 55 / 59 / 70; la correcta es la D (70 car, intacta), y sigue siendo la mas larga por 1
UPDATE public.quiz_questions
   SET options = '["Aceptarla, porque la captura muestra la transacción firmada y enviada","Pedirle que te reenvíe el pago otra vez para asegurarte","Esperar a que te lo confirme tu propia plataforma o cartera","Comprobarlo tú en un explorador de bloques; una captura no prueba nada"]'::jsonb
 WHERE id = 'b3dd58bd-e41b-462b-9182-4d7d7e594c02';

-- 4: longitudes 58 / 43 / 64 / 55; la correcta es la A (58 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Según qué pasa si tarda: quién está esperando al otro lado","Según la cantidad exacta que estás enviando","Siempre la más alta posible, para asegurar que se confirma antes","Según el saldo total que tengas en esa cartera concreta"]'::jsonb
 WHERE id = 'a7d9d063-07bf-4879-8e76-4cb7d92fb7e9';

-- 6: longitudes 76 / 53 / 82 / 70; la correcta es la C (82 car, intacta), y sigue siendo la mas larga por 6
UPDATE public.quiz_questions
   SET options = '["Una comisión normal, porque depende de la cantidad y no del número de cobros","Que la cartera los agrupe automáticamente y sin coste","Una comisión más alta, porque cada cobro hay que incluirlo y firmarlo por separado","Que la red rechace la transacción por tener demasiadas entradas juntas"]'::jsonb
 WHERE id = '19987f35-26de-49a8-9974-34eeb05b7191';

-- 7: longitudes 66 / 58 / 52 / 62; la correcta es la D (62 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["De que acabes enviando a la dirección de otra persona por un error","De que la cartera acabe usando la red equivocada al enviar","De que alguien intercepte la transacción en tránsito","De las erratas al copiar, no de copiar la dirección equivocada"]'::jsonb
 WHERE id = '1db0db13-970e-4baf-8daa-a099dfc481a2';

-- ------------------------------------------------------------------------
-- M2 Usar Bitcoin con criterio
-- ------------------------------------------------------------------------

-- 1: longitudes 64 / 54 / 60 / 56; la correcta es la C (60 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Un porcentaje fijo del total, revisado y ajustado una vez al mes","Lo mínimo imprescindible para hacer una sola operación","Una cantidad que pudieras perder sin que te cambie la semana","Todo, siempre que la cartera tenga puesta una contraseña"]'::jsonb
 WHERE id = 'eae5a5bb-f2a1-4b2f-b1c6-aa279ec1414d';

-- 4: longitudes 52 / 71 / 78 / 49; la correcta es la B (71 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Que tus transacciones dejen de ser públicas del todo","Que no haya un único sitio visible donde se acumule todo lo que recibes","Que nadie pueda llegar a relacionar entre sí ninguna de tus direcciones usadas","Que las comisiones de tus envíos salgan más bajas"]'::jsonb
 WHERE id = '34f2ca12-d3be-4b74-836b-f1c5fd737b55';

-- 5: longitudes 48 / 64 / 69 / 55; la correcta es la C (69 car, intacta), y sigue siendo la mas larga por 5
UPDATE public.quiz_questions
   SET options = '["Nada en absoluto: con la xpub no se puede gastar","Que podrían gastar tus fondos si además conocen alguna dirección","Que quien la tenga ve todo tu historial y tu saldo, presente y futuro","Que tus direcciones dejarían de generarse correctamente"]'::jsonb
 WHERE id = '455f92e9-f507-45c9-98bf-627a93fe4c0c';

-- 8: longitudes 86 / 83 / 67 / 74; la correcta es la B (83 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Que subirá a largo plazo, porque la emisión está limitada de antemano y eso ya se sabe","Que es imposible saberlo: depende del comportamiento futuro de millones de personas","Que se mantendrá estable en cuanto se extienda algo más la adopción","Que bajará hasta que se resuelvan los problemas de escalabilidad de la red"]'::jsonb
 WHERE id = '60eb2b61-ecd6-4e54-be8c-c6e0941b2f08';

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
--    WHERE c.slug = 'uso-practico-de-bitcoin'
-- ) t WHERE correcta = mayor;
-- QUE DEBE SALIR: 6 o menos.
--
-- 2. Ninguna pregunta puede haber perdido opciones ni tenerlas repetidas
--
-- SELECT count(*) FROM public.quiz_questions q
--   JOIN public.modules m ON m.id = q.module_id
--   JOIN public.courses c ON c.id = m.course_id
--  WHERE c.slug = 'uso-practico-de-bitcoin'
--    AND (jsonb_array_length(q.options) <> 4
--         OR (SELECT count(DISTINCT o) FROM jsonb_array_elements_text(q.options) o) <> 4);
-- QUE DEBE SALIR: 0.
