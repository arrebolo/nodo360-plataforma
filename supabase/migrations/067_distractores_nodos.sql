-- ============================================================================
-- 067: distractores creibles en Nodos Bitcoin - Tu Soberanía Técnica
-- ============================================================================
-- ESTADO: APLICADA EN PRODUCCION EL 25/09/2026.
--   Ejecutada por PostgREST y versionada despues.
--
-- QUE PASABA
--   En 16 de las 18 preguntas de este curso la respuesta correcta era la opcion
--   mas larga, con 29.3 caracteres de ventaja de media. "Elegir la mas larga"
--   acertaba el 94%, y el umbral de aprobado es 70%.
--
-- QUE HACE
--   Reescribe 48 distractores en 16 preguntas. La respuesta correcta NO se
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
--     la correcta es la mas larga       16/18      4/18   (azar: ~25%)
--     margen medio de esas               29.3       4.0
--     preguntas con margen > 6 car       16         0
--     "elegir la mas larga" acierta      94%       28%
--
-- COMPROBADO ADEMAS
--   - Ningun distractor nuevo nombra una marca ni un producto.
--   - Ninguna tira de cinco palabras de un distractor aparece en el texto de las
--     lecciones del curso, que es la senal de que un distractor podria estar
--     afirmando algo que la leccion da por cierto.
--
-- RESPALDO
--   C:/Users/alber/backups-sql/067-volver-atras.sql.bak
-- ============================================================================

BEGIN;

-- ------------------------------------------------------------------------
-- M1 Por Qué un Nodo Propio
-- ------------------------------------------------------------------------

-- 1: longitudes 99 / 69 / 63 / 102; la correcta es la D (102 car, intacta), y sigue siendo la mas larga por 3
UPDATE public.quiz_questions
   SET options = '["Un servidor gestionado por una de las empresas que mantienen la red y coordinan a los participantes","Una wallet con funciones avanzadas para guardar bitcoin a largo plazo","Un minero que compite por crear los bloques nuevos de la cadena","Un equipo que ejecuta el software de Bitcoin y verifica transacciones y bloques de forma independiente"]'::jsonb
 WHERE id = 'ee356702-22c7-465d-8b64-7bdb599cbc3c';

-- 2: longitudes 55 / 70 / 53 / 49; la correcta es la A (55 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["En una red peer-to-peer (P2P), directamente entre ellos","A través de un servidor central que reparte la información entre todos","Mediante mensajes firmados que se reenvían por turnos","Solo a través de los mineros, que hacen de enlace"]'::jsonb
 WHERE id = '5fb63503-6305-463a-a87c-dbe9c170f986';

-- 3: longitudes 65 / 60 / 52 / 42; la correcta es la B (60 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Solo los mineros, porque son los que construyen cada bloque nuevo","Los nodos, que verifican que cumple las reglas del protocolo","El creador original de Bitcoin y los desarrolladores","Las plataformas de intercambio más grandes"]'::jsonb
 WHERE id = 'd0068965-c88f-4a1d-b5b0-8d3d3f2baecb';

-- 4: longitudes 62 / 69 / 73 / 60; la correcta es la C (73 car, intacta), y sigue siendo la mas larga por 4
UPDATE public.quiz_questions
   SET options = '["No confiar en nadie y por tanto no llegar a usar Bitcoin nunca","No confiar en las criptomonedas y limitarse a observarlas desde fuera","Verificar por ti mismo las transacciones en lugar de depender de terceros","Verificar la identidad de los otros usuarios antes de operar"]'::jsonb
 WHERE id = '69437ef6-85cb-4291-8a38-025dac8cc122';

-- 5: longitudes 63 / 69 / 47 / 66; la correcta es la D (66 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Tus bitcoin dejan de estar disponibles hasta que montes un nodo","Es algo que el protocolo no permite, porque hace falta un nodo propio","No puedes enviar transacciones, solo recibirlas","Dependes del nodo de otra persona para verificar tus transacciones"]'::jsonb
 WHERE id = 'dadde06e-42ee-4e8e-aace-e70d8db24c07';

-- 6: longitudes 65 / 55 / 70 / 57; la correcta es la A (65 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Porque aumenta la descentralización y la resistencia a la censura","Porque ayuda a minar más bloques de los que se minarían","Porque genera más bitcoin nuevos para repartir entre los participantes","Porque hace que tus transacciones se confirmen más rápido"]'::jsonb
 WHERE id = 'fc2e8c64-f12e-476d-a562-e00f85b6e53f';

-- 7: longitudes 46 / 61 / 71 / 60; la correcta es la B (61 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Solo mina bloques nuevos y cobra la recompensa","Descarga y verifica toda la blockchain de forma independiente","Solo guarda tus propias transacciones y las de tus contactos habituales","Se conecta al servidor central de Bitcoin para sincronizarse"]'::jsonb
 WHERE id = '8a62affa-98fe-4ef6-ba5a-fca0a5d5d007';

-- 8: longitudes 76 / 54 / 81 / 53; la correcta es la C (81 car, intacta), y sigue siendo la mas larga por 5
UPDATE public.quiz_questions
   SET options = '["El pruned node no verifica las transacciones, solo guarda una copia reducida","El full node es bastante más seguro frente a un ataque","El pruned node elimina bloques antiguos para ahorrar espacio, pero verifica igual","El pruned node necesita bastante más espacio en disco"]'::jsonb
 WHERE id = '201d5790-ee1d-43f7-b776-16434f4eb5a9';

-- ------------------------------------------------------------------------
-- M2 Montando Tu Nodo
-- ------------------------------------------------------------------------

-- 1: longitudes 13 / 15 / 15 / 14; la correcta es la A (13 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Al menos 2 TB","Al menos 100 GB","Al menos 500 GB","Al menos 10 TB"]'::jsonb
 WHERE id = 'bef7849b-6a4d-4539-be87-cb426bc27134';

-- 2: longitudes 69 / 65 / 61 / 58; la correcta es la B (65 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Son bastante más seguros, porque vienen ya configurados desde fábrica","Ofrecen una interfaz web fácil de usar y aplicaciones adicionales","Minan bitcoin automáticamente mientras el nodo está encendido","No necesitan disco duro, porque usan almacenamiento remoto"]'::jsonb
 WHERE id = '75745257-8f46-4407-b6a6-df139999b9d9';

-- 3: longitudes 48 / 56 / 50 / 44; la correcta es la C (50 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Que sea el equipo más caro que puedas permitirte","Que uses lo mismo que usa la mayor parte de la comunidad","Que sea un setup que puedas mantener a largo plazo","Que traiga la mayor cantidad de aplicaciones"]'::jsonb
 WHERE id = '08864b86-dd7c-48f3-a427-525a2789e24d';

-- 4: longitudes 25 / 22 / 28 / 26; la correcta es la D (26 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Aproximadamente 5 minutos","Aproximadamente un mes","Es prácticamente instantánea","Aproximadamente 2 a 7 días"]'::jsonb
 WHERE id = '15f6f5f5-1a57-49d2-97a5-65b6e3e7ba00';

-- 5: longitudes 61 / 40 / 63 / 57; la correcta es la A (61 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Descarga y verifica toda la blockchain desde el primer bloque","Mina bitcoin mientras descarga la cadena","Crea automáticamente una wallet nueva con su propia seed phrase","Se conecta a un servidor central para descargar la cadena"]'::jsonb
 WHERE id = 'd68bf95b-fb57-438a-9193-056df6ab345b';

-- 6: longitudes 59 / 82 / 53 / 78; la correcta es la B (82 car, intacta), y sigue siendo la mas larga por 4
UPDATE public.quiz_questions
   SET options = '["Porque el wifi no da el ancho de banda que necesita un nodo","Porque la conexión por cable es más estable y la sincronización mueve muchos datos","Porque el protocolo lo exige para los nodos completos","Porque una conexión inalámbrica pierde paquetes y obliga a repetir la descarga"]'::jsonb
 WHERE id = '670ab95b-3004-4dfd-82fc-fefbd0bb4c36';

-- 7: longitudes 51 / 66 / 69 / 72; la correcta es la C (69 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Los pierdes para siempre, porque estaban en el nodo","Se transfieren automáticamente a la plataforma donde los compraste","Nada, tus bitcoin están protegidos por tu seed phrase, no por tu nodo","Se quedan congelados hasta que repares el nodo o montes otro en su lugar"]'::jsonb
 WHERE id = 'd0dc8f44-752f-4d5b-ae08-565c8c0f3cf3';

-- 8: longitudes 45 / 55 / 36 / 53; la correcta es la D (53 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Para que el nodo funcione bastante más rápido","Porque el software lo exige desde sus últimas versiones","Para poder minar algo más de bitcoin","Para que tu IP no revele que ejecutas un nodo Bitcoin"]'::jsonb
 WHERE id = 'cd23ba5d-9d66-45cf-9a70-d3e714e4f3a6';

COMMIT;


-- ============================================================================
-- COMPROBACIONES (solo lectura)
-- ============================================================================
-- 1. Cuantas veces la correcta es la mas larga (deberia ser 4 de 18)
--
-- SELECT count(*) FROM (
--   SELECT q.id,
--          length(q.options->>q.correct_answer) AS correcta,
--          (SELECT max(length(o)) FROM jsonb_array_elements_text(q.options) o) AS mayor
--     FROM public.quiz_questions q
--     JOIN public.modules m ON m.id = q.module_id
--     JOIN public.courses c ON c.id = m.course_id
--    WHERE c.slug = 'nodos-bitcoin-tu-soberania-tecnica'
-- ) t WHERE correcta = mayor;
-- QUE DEBE SALIR: 4 o menos.
--
-- 2. Ninguna pregunta puede haber perdido opciones ni tenerlas repetidas
--
-- SELECT count(*) FROM public.quiz_questions q
--   JOIN public.modules m ON m.id = q.module_id
--   JOIN public.courses c ON c.id = m.course_id
--  WHERE c.slug = 'nodos-bitcoin-tu-soberania-tecnica'
--    AND (jsonb_array_length(q.options) <> 4
--         OR (SELECT count(DISTINCT o) FROM jsonb_array_elements_text(q.options) o) <> 4);
-- QUE DEBE SALIR: 0.
