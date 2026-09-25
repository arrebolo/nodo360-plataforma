-- ============================================================================
-- 063: distractores creibles en Qué es Web3 y qué no
-- ============================================================================
-- ESTADO: APLICADA EN PRODUCCION EL 25/09/2026.
--   Ejecutada por PostgREST y versionada despues.
--
-- QUE PASABA
--   En 23 de las 27 preguntas de este curso la respuesta correcta era la opcion
--   mas larga, con 28.7 caracteres de ventaja de media. "Elegir la mas larga"
--   acertaba el 85%, y el umbral de aprobado es 70%.
--
-- QUE HACE
--   Reescribe 66 distractores en 23 preguntas. La respuesta correcta NO se
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
--     la correcta es la mas larga       23/27      4/27   (azar: ~25%)
--     margen medio de esas               28.7       3.3
--     preguntas con margen > 6 car       20         0
--     "elegir la mas larga" acierta      85%       15%
--
-- COMPROBADO ADEMAS
--   - Ningun distractor nuevo nombra una marca ni un producto.
--   - Ninguna tira de cinco palabras de un distractor aparece en el texto de las
--     lecciones del curso, que es la senal de que un distractor podria estar
--     afirmando algo que la leccion da por cierto.
--
-- RESPALDO
--   C:/Users/alber/backups-sql/063-volver-atras.sql.bak
-- ============================================================================

BEGIN;

-- ------------------------------------------------------------------------
-- M0 De dónde viene la idea
-- ------------------------------------------------------------------------

-- 1: longitudes 100 / 100 / 84 / 81; la correcta es la B (100 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Porque las grandes empresas se coordinaron entre ellas para repartirse el mercado desde el principio","Porque resolvía un problema real: que millones de personas pudieran interactuar sin que nada fallara","Porque la tecnología descentralizada todavía no existía cuando se construyó internet","Porque los usuarios aceptaron ceder el control de sus datos a cambio del servicio"]'::jsonb
 WHERE id = '11a582cb-5e1c-41ff-aefc-548a7912c914';

-- 2: longitudes 51 / 51 / 56 / 50; la correcta es la C (56 car, intacta), y sigue siendo la mas larga por 5
UPDATE public.quiz_questions
   SET options = '["Que guarde copias de seguridad de todo lo que haces","Que filtre el contenido abusivo antes de publicarlo","Que confirme al instante, porque decide una sola entidad","Que te devuelva el acceso si pierdes la contraseña"]'::jsonb
 WHERE id = '23b50037-e4f7-461f-b205-df7b807f1cd2';

-- 3: longitudes 84 / 55 / 54 / 76; la correcta es la D (76 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Que es un secreto que las empresas ocultan deliberadamente en sus condiciones de uso","Que es ilegal en la mayoría de los países y se persigue","Que solo afecta a quienes usan redes sociales a diario","Que es un precio que no se ve y no se puede comparar con ninguna alternativa"]'::jsonb
 WHERE id = '3fc7256b-e835-438a-bc05-713d6d96d4d9';

-- 4: longitudes 88 / 90 / 63 / 69; la correcta es la A (88 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Basta con que quien decide sea otro: una decisión automática, un error o una norma nueva","Que la empresa actúe de mala fe deliberadamente y decida echarte de su servicio sin avisar","Que incumplas la ley del país donde vives y alguien lo denuncie","Que dejes de usar el servicio durante mucho tiempo sin avisar a nadie"]'::jsonb
 WHERE id = 'e10e2b5d-7550-4422-be0a-339d68022f72';

-- 5: longitudes 107 / 100 / 72 / 82; la correcta es la B (100 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["El navegador que usas, el servidor donde vive el servicio y el protocolo que los conecta a los dos entre sí","La cuenta pasa a clave, el servidor a registro compartido y el contrato a código que se ejecuta solo","El dinero que circula, el banco que lo custodia y la ley que lo respalda","La identidad de cada uno, la privacidad de lo que hace y la seguridad del conjunto"]'::jsonb
 WHERE id = 'f19b2976-3e02-41fd-ae4e-8ce450c1cde9';

-- 6: longitudes 92 / 72 / 84 / 63; la correcta es la C (84 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Que sus ventajas son difíciles de demostrar, y por eso se acaban enunciando siempre al revés","Que la mayoría de los proyectos fracasa antes de llegar a demostrar nada","Que no añade capacidades al usuario: retira la capacidad de un tercero de intervenir","Que en la práctica solo sirve para evitar impuestos y controles"]'::jsonb
 WHERE id = 'deb5ad8a-7a17-4a33-8571-7217416a1bc3';

-- 7: longitudes 62 / 59 / 82 / 73; la correcta es la D (73 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Sí: se resolverán en cuanto la tecnología madure lo suficiente","Sí, y de hecho ya están resueltos en las redes más modernas","No, porque en realidad esos costes no existen: son una exageración de los críticos","No: son la otra cara de lo que se gana al quitar a la entidad que decidía"]'::jsonb
 WHERE id = 'af4851d9-b2e1-4a7a-8f21-b6bfe3a24c79';

-- ------------------------------------------------------------------------
-- M1 Las piezas
-- ------------------------------------------------------------------------

-- 1: longitudes 85 / 61 / 75 / 54; la correcta es la C (75 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Que la clave es bastante más larga y mucho más difícil de adivinar que una contraseña","Que la clave se puede recuperar desde el correo si la pierdes","Que la clave no la emite nadie: existe por sí misma y nadie puede revocarla","Que la cuenta es gratuita y la clave hay que comprarla"]'::jsonb
 WHERE id = '2686b9e6-6d76-4def-bb21-91b4d32a2170';

-- 3: longitudes 63 / 72 / 69 / 60; la correcta es la A (63 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Queda expuesto el historial entero, hacia atrás y hacia delante","Solo queda expuesto lo que hagas a partir de ese momento, no lo anterior","No pasa nada, porque las direcciones no llevan ningún nombre asociado","Puedes borrar el historial asociado a esa dirección concreta"]'::jsonb
 WHERE id = '5b3a7903-dfe8-4d99-b3d4-85774afd50cb';

-- 4: longitudes 87 / 69 / 59 / 54; la correcta es la B (69 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Porque lo escribe una persona y no una máquina, así que puede equivocarse al redactarlo","Porque no interpreta nada y no hay a quién acudir si hay discrepancia","Porque todavía es una tecnología experimental y sin madurar","Porque necesita que alguien lo ejecute a mano cada vez"]'::jsonb
 WHERE id = '175c0aad-824f-40f7-a4dd-7a4c0bc2c9d8';

-- 5: longitudes 68 / 75 / 60 / 53; la correcta es la C (60 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["¿Es inmutable, o se puede modificar más adelante sin avisar a nadie?","¿Cuánto tiempo lleva funcionando sin que nadie le haya encontrado un fallo?","¿Quién puede cambiarlo, y qué hace falta para que lo cambie?","¿Cuántas personas lo están usando ya con dinero real?"]'::jsonb
 WHERE id = '0cefbb95-673f-4ac7-bd14-15d2d7e1c790';

-- 6: longitudes 101 / 77 / 75 / 99; la correcta es la D (99 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Permiso para una operación concreta, solo esta vez y por la cantidad exacta que has visto en pantalla","Permiso para que la aplicación lea tu historial de operaciones en el registro","Permiso para iniciar sesión, y nada más: no tiene ninguna otra consecuencia","Permiso para que un contrato mueva tus fondos cuando quiera, normalmente sin límite y sin caducidad"]'::jsonb
 WHERE id = '943fa1cc-8f34-478e-b219-3ac32281dd32';

-- 7: longitudes 67 / 79 / 59 / 61; la correcta es la A (67 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["En alterar la web, o copiarla, para que proponga una firma distinta","En adivinar la clave privada del usuario a base de fuerza bruta y mucho cómputo","En modificar el registro compartido para cambiar los saldos","En saturar la red hasta que las operaciones empiecen a fallar"]'::jsonb
 WHERE id = '2b7bcf4b-b4e8-4388-8cc4-272a02237115';

-- 8: longitudes 78 / 65 / 61 / 52; la correcta es la B (65 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Un archivo cifrado que guardas en tu propio dispositivo y solo tú puedes abrir","Una fila en la tabla de un contrato: una dirección y una cantidad","Una moneda digital emitida por un banco central de algún país","Un certificado de propiedad con reconocimiento legal"]'::jsonb
 WHERE id = 'bf1b278b-7cb1-4252-a6c9-d35331d16dc5';

-- 9: longitudes 51 / 55 / 56 / 52; la correcta es la C (56 car, intacta), y sigue siendo la mas larga por 1
UPDATE public.quiz_questions
   SET options = '["La propiedad intelectual de la ilustración original","El archivo original, guardado en el registro compartido","La anotación de que una unidad concreta está a tu nombre","La exclusividad: nadie más puede tener ya esa imagen"]'::jsonb
 WHERE id = '859ec393-972a-4372-95b3-bdfa5126dae0';

-- ------------------------------------------------------------------------
-- M2 Criterio
-- ------------------------------------------------------------------------

-- 1: longitudes 82 / 111 / 74 / 102; la correcta es la D (102 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["¿Cuántos usuarios activos tiene el proyecto y cuánto han crecido en el último año?","¿Está el código publicado y verificado, y lo ha revisado alguien ajeno al equipo que lo escribió y lo mantiene?","¿Cuánto cuesta cada operación en el registro, y quién se queda ese dinero?","¿Hay alguien con motivo y capacidad para cambiar el registro en su favor, a quien no se pueda obligar?"]'::jsonb
 WHERE id = 'bd8d8596-f984-4d05-bda1-32c9417b6819';

-- 2: longitudes 104 / 113 / 63 / 67; la correcta es la A (104 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Porque repartían el registro entre partes que ya se fiaban entre sí: toda la complejidad sin las razones","Porque la tecnología disponible era demasiado lenta para el uso que le querían dar las empresas que lo intentaron","Porque los reguladores acabaron prohibiéndolos en varios países","Porque faltaban programadores especializados para sacarlos adelante"]'::jsonb
 WHERE id = 'da0373e3-f3f5-4128-bca1-c0cc01e96db3';

-- 3: longitudes 93 / 76 / 55 / 51; la correcta es la B (76 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["En la capacidad del registro para almacenar tantos datos como genera una cadena de suministro","En quien introduce el dato: el registro protege lo tecleado, no su veracidad","En la velocidad con la que se confirman las operaciones","En el coste que tiene cada anotación en el registro"]'::jsonb
 WHERE id = '8e4303a0-3c55-402c-a795-f2ff6bad39d4';

-- 5: longitudes 46 / 43 / 39 / 47; la correcta es la D (47 car, intacta), y sigue siendo la mas larga por 1
UPDATE public.quiz_questions
   SET options = '["Cuántos seguidores tiene en las redes sociales","Si el precio ha subido en los últimos meses","Si aparece en los medios especializados","Quién puede cambiar las reglas de los contratos"]'::jsonb
 WHERE id = '18040be8-e0da-49e6-93c0-9788936875d5';

-- 6: longitudes 96 / 100 / 86 / 52; la correcta es la A (96 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Ninguna por sí sola; importa combinado con quién controla las reglas y quién custodia los fondos","Que es una estafa, porque los proyectos serios dan la cara desde el primer día y este no lo ha hecho","Que es más seguro, porque a un equipo anónimo nadie puede presionarlo ni identificarlo","Que el proyecto no se puede evaluar de ninguna forma"]'::jsonb
 WHERE id = 'a96f3ae3-cd48-4a3a-8639-9ef167dddbc0';

-- 7: longitudes 87 / 78 / 62 / 63; la correcta es la B (78 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Que la comunidad está saturada de preguntas repetidas y ya no da para más explicaciones","Que ya tienes la respuesta: un proyecto sólido agradece las preguntas técnicas","Que conviene preguntar en privado a un administrador del canal","Nada en particular: es lo normal en las comunidades muy grandes"]'::jsonb
 WHERE id = '5db5762c-f19a-4e98-a390-cdbcbed76f34';

-- 8: longitudes 71 / 51 / 65 / 46; la correcta es la C (65 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Si el proyecto va a tener éxito en los próximos años o va a desaparecer","Si conviene participar en él o mantenerse al margen","De qué depende: qué y quién tendría que fallar para que salga mal","Cuánto puede llegar a subir o a bajar su valor"]'::jsonb
 WHERE id = '1ca8845d-1e7d-44b5-ab6c-8c66fcc3f882';

-- 9: longitudes 57 / 56 / 53 / 63; la correcta es la D (63 car, intacta), y sigue siendo la mas larga por 6
UPDATE public.quiz_questions
   SET options = '["Los fallos de programación que puedan tener los contratos","La caída de la web a través de la que entras al servicio","La concentración de la gobernanza en unas pocas manos","El ataque contra el juicio: quien se gana tu confianza despacio"]'::jsonb
 WHERE id = '09391778-ca60-4385-9382-d769ac9d85a7';

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
--    WHERE c.slug = 'introduccion-a-web3'
-- ) t WHERE correcta = mayor;
-- QUE DEBE SALIR: 4 o menos.
--
-- 2. Ninguna pregunta puede haber perdido opciones ni tenerlas repetidas
--
-- SELECT count(*) FROM public.quiz_questions q
--   JOIN public.modules m ON m.id = q.module_id
--   JOIN public.courses c ON c.id = m.course_id
--  WHERE c.slug = 'introduccion-a-web3'
--    AND (jsonb_array_length(q.options) <> 4
--         OR (SELECT count(DISTINCT o) FROM jsonb_array_elements_text(q.options) o) <> 4);
-- QUE DEBE SALIR: 0.
