-- ============================================================================
-- 064: distractores creibles en Seguridad básica en Bitcoin y criptomonedas
-- ============================================================================
-- ESTADO: APLICADA EN PRODUCCION EL 25/09/2026.
--   Ejecutada por PostgREST y versionada despues.
--
-- QUE PASABA
--   En 23 de las 27 preguntas de este curso la respuesta correcta era la opcion
--   mas larga, con 19.3 caracteres de ventaja de media. "Elegir la mas larga"
--   acertaba el 89%, y el umbral de aprobado es 70%.
--
-- QUE HACE
--   Reescribe 57 distractores en 19 preguntas. La respuesta correcta NO se
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
--     la correcta es la mas larga       23/27      5/27   (azar: ~25%)
--     margen medio de esas               19.3       2.6
--     preguntas con margen > 6 car       19         0
--     "elegir la mas larga" acierta      89%       22%
--
-- COMPROBADO ADEMAS
--   - Ningun distractor nuevo nombra una marca ni un producto.
--   - Ninguna tira de cinco palabras de un distractor aparece en el texto de las
--     lecciones del curso, que es la senal de que un distractor podria estar
--     afirmando algo que la leccion da por cierto.
--
-- RESPALDO
--   C:/Users/alber/backups-sql/064-volver-atras.sql.bak
-- ============================================================================

BEGIN;

-- ------------------------------------------------------------------------
-- M0 Los riesgos reales
-- ------------------------------------------------------------------------

-- 2: longitudes 57 / 61 / 59 / 65; la correcta es la C (59 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Minar los bloques, validarlos, firmar y difundir a la red","Comprar, vender, declarar a Hacienda y custodiar lo que quede","Custodia, recuperación, verificación y detección de engaños","Cifrado del disco, respaldo, auditoría anual y seguro contra robo"]'::jsonb
 WHERE id = '2c156828-9cb9-4f03-bc1f-3614257b29cc';

-- 3: longitudes 99 / 72 / 77 / 90; la correcta es la D (90 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Que conviene mantener una desconfianza constante durante todo el tiempo que tengas fondos guardados","Que la autocustodia solo compensa a partir de cierta cantidad custodiada","Que el riesgo crece de forma proporcional al tiempo que pasa sin revisar nada","Que el riesgo se concentra en pocos momentos concretos y basta con bajar el ritmo en ellos"]'::jsonb
 WHERE id = '05219f0b-cf96-47b5-a6e1-337ddfba9737';

-- 4: longitudes 105 / 108 / 52 / 73; la correcta es la A (105 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Que la rentabilidad garantizada es incompatible con cripto, y los pagos iniciales forman parte del método","Que el proyecto es sólido, porque los pagos a otros participantes se pueden comprobar uno a uno en la cadena","Que conviene entrar con poco dinero para ir probando","Que hay que comprobar si está registrado en el regulador antes de decidir"]'::jsonb
 WHERE id = '3a292d4f-681d-4063-8f75-d245a4fb7753';

-- 6: longitudes 105 / 69 / 75 / 82; la correcta es la C (75 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["La suplantación del soporte técnico, porque imita muy bien a la empresa y llega cuando tienes un problema","El falso reparto de tokens, porque te hace firmar algo sin entenderlo","La relación construida lentamente, porque espera a que la idea parezca tuya","La web falsa, porque captura la contraseña y el código del segundo factor a la vez"]'::jsonb
 WHERE id = '2e60281c-6735-4e3e-8750-2a194f28cb72';

-- 7: longitudes 67 / 55 / 52 / 58; la correcta es la D (58 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Fallos técnicos en las aplicaciones de cartera que se usan a diario","Desconocimiento: a la mayoría le falta formación previa","Ataques sofisticados, difíciles de detectar a tiempo","Que el conocimiento estaba pero no se aplicó en el momento"]'::jsonb
 WHERE id = '5bf70009-0b00-4f3b-9ff4-f0366e31150a';

-- 8: longitudes 93 / 100 / 51 / 60; la correcta es la A (93 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Porque no da ninguna señal mientras se comete y la ventana de arreglarlo se cierra sin avisar","Porque las aplicaciones cambian con el tiempo y la configuración que tenías deja de servir para nada","Porque las comisiones de la red suben con el tiempo","Porque la red acaba dejando de aceptar las carteras antiguas"]'::jsonb
 WHERE id = 'a6bca879-dff5-4c19-898e-de141abdcb5e';

-- 9: longitudes 102 / 84 / 68 / 72; la correcta es la B (84 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Ninguno en absoluto: la seguridad depende solo de las herramientas que uses, no de los años que lleves","Empeora, porque la costumbre baja la guardia justo cuando las cantidades son mayores","Mejora, porque a esas alturas ya reconoces los riesgos por costumbre","Mejora, porque los ataques se concentran sobre todo en los principiantes"]'::jsonb
 WHERE id = 'ac99a87e-22c3-48fa-a43c-8b8038196d92';

-- ------------------------------------------------------------------------
-- M1 Proteger tus accesos
-- ------------------------------------------------------------------------

-- 2: longitudes 69 / 99 / 58 / 95; la correcta es la D (95 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Ninguno, mientras la cartera en sí esté bien protegida y con su copia","Que el proveedor de correo podría llegar a leer tus claves si quisiera, porque están en su servidor","Que conviene cambiar de proveedor de correo una vez al año","Que el correo es la llave que recupera todo lo demás, así que rodea la protección de la cartera"]'::jsonb
 WHERE id = '1e0725f4-9166-4bd3-86a0-3d8b0d2cd422';

-- 5: longitudes 84 / 64 / 74 / 57; la correcta es la C (74 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Sí, porque el código del segundo factor caduca en unos pocos segundos y no da tiempo","Sí, siempre que el segundo factor sea una aplicación y no un SMS","No: quien recibe ambos datos puede usarlos al instante en la web auténtica","No, pero solo cuando la web tiene un certificado inválido"]'::jsonb
 WHERE id = 'a9d01041-6aa4-495f-9917-ba87985617b4';

-- 6: longitudes 67 / 100 / 50 / 82; la correcta es la D (82 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Porque los dispositivos almacenan las monedas en su memoria interna","Porque es el sistema operativo el que firma las transacciones por ti cuando se lo pides a la cartera","Porque determina las comisiones que acabas pagando","Porque si está comprometido no hace falta romper ninguna de las otras protecciones"]'::jsonb
 WHERE id = '92f89408-d3ce-430f-b49f-220dc5e2e642';

-- 7: longitudes 47 / 49 / 61 / 48; la correcta es la A (47 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Tener las actualizaciones automáticas activadas","Instalar un antivirus de pago y mantenerlo al día","Usar una red privada virtual en todas las conexiones, siempre","Cambiar de dispositivo cada dos años como máximo"]'::jsonb
 WHERE id = 'aaa7a5b7-0e18-4dca-836f-a9bd86a6e8fe';

-- 8: longitudes 97 / 88 / 52 / 49; la correcta es la B (88 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Consumen memoria del navegador y ralentizan las operaciones cuando hay varias instaladas a la vez","Pueden modificar lo que ves, incluida una dirección, y se actualizan sin que lo apruebes","Impiden que el segundo factor funcione correctamente","Revelan tu dirección IP a la red que estás usando"]'::jsonb
 WHERE id = '92ac5ff8-69f5-4f18-8d3d-c7798eae3d8f';

-- 9: longitudes 94 / 95 / 83 / 69; la correcta es la C (83 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Un antivirus de pago, una red privada virtual siempre activa y contraseñas largas con símbolos","Cambiar todas las contraseñas cada mes, cifrar el disco entero y usar dos navegadores distintos","Proteger el correo, tener una copia en papel comprobada y comprobar antes de firmar","Un dispositivo dedicado, la custodia repartida y una revisión mensual"]'::jsonb
 WHERE id = '7a7ff169-9b1b-485f-8946-8a8df19689a0';

-- ------------------------------------------------------------------------
-- M2 La custodia, decidida con criterio
-- ------------------------------------------------------------------------

-- 1: longitudes 57 / 54 / 53 / 59; la correcta es la D (59 car, intacta), y sigue siendo la mas larga por 2
UPDATE public.quiz_questions
   SET options = '["Las monedas, guardadas en un archivo cifrado en tu equipo","Una copia del registro completo de la red, actualizada","Un certificado de propiedad emitido por la propia red","La clave que permite firmar movimientos desde una dirección"]'::jsonb
 WHERE id = '9ce062f9-7c97-4935-be85-e502bd4a81ad';

-- 2: longitudes 96 / 109 / 66 / 59; la correcta es la A (96 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Porque las defensas contra el robo y contra la pérdida de acceso tiran en direcciones contrarias","Porque el coste de las medidas crece a la vez que la cantidad custodiada, y llega un punto en que no compensa","Porque la red penaliza a las carteras que tienen demasiadas copias","Porque la ley limita el número de respaldos que se permiten"]'::jsonb
 WHERE id = 'fde33089-e74e-4af8-93f2-24637db5e8f3';

-- 3: longitudes 55 / 80 / 97 / 39; la correcta es la B (80 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Si la aplicación te muestra el saldo convertido a euros","Si puedes enviar a cualquier dirección ahora mismo sin que nadie pueda impedirlo","Si la aplicación te pide verificar tu identidad con un documento antes de dejarte operar con ella","Si te cobra alguna comisión por retirar"]'::jsonb
 WHERE id = 'e302e908-fd7a-41a4-a975-b5a12f4ac253';

-- 4: longitudes 55 / 64 / 60 / 60; la correcta es la C (60 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Que la empresa acabe quebrando y arrastre los depósitos","Que la ataquen y el robo supere lo que la empresa puede absorber","Que bloquee tu cuenta por una revisión, una orden o un error","Que desaparezca de un día para otro llevándose lo depositado"]'::jsonb
 WHERE id = '0baeca63-77fe-42ef-8fb2-d5fa046f4693';

-- 7: longitudes 100 / 85 / 51 / 56; la correcta es la B (85 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["La custodia propia con un dispositivo dedicado, por ser la opción más segura de todas sobre el papel","Un custodio decente, porque una autocustodia abandonada suma riesgos sin las ventajas","La custodia repartida entre varias firmas distintas","Da igual, porque el mantenimiento no afecta al resultado"]'::jsonb
 WHERE id = '0267023e-c4bb-418b-a986-88fc0dd56c62';

-- 9: longitudes 82 / 46 / 76 / 78; la correcta es la D (78 car, intacta), y ya no es la mas larga
UPDATE public.quiz_questions
   SET options = '["Porque las herramientas sencillas están mejor auditadas y llevan más tiempo en uso","Porque cuesta bastante menos dinero mantenerlo","Porque los atacantes se centran en los sistemas complejos, que dan más de sí","Porque se mantiene durante años y la complejidad añade formas nuevas de fallar"]'::jsonb
 WHERE id = '4cdf70db-a7f6-4cdb-bedc-a066675b06bb';

COMMIT;


-- ============================================================================
-- COMPROBACIONES (solo lectura)
-- ============================================================================
-- 1. Cuantas veces la correcta es la mas larga (deberia ser 5 de 27)
--
-- SELECT count(*) FROM (
--   SELECT q.id,
--          length(q.options->>q.correct_answer) AS correcta,
--          (SELECT max(length(o)) FROM jsonb_array_elements_text(q.options) o) AS mayor
--     FROM public.quiz_questions q
--     JOIN public.modules m ON m.id = q.module_id
--     JOIN public.courses c ON c.id = m.course_id
--    WHERE c.slug = 'seguridad-basica-en-bitcoin-y-criptomonedas'
-- ) t WHERE correcta = mayor;
-- QUE DEBE SALIR: 5 o menos.
--
-- 2. Ninguna pregunta puede haber perdido opciones ni tenerlas repetidas
--
-- SELECT count(*) FROM public.quiz_questions q
--   JOIN public.modules m ON m.id = q.module_id
--   JOIN public.courses c ON c.id = m.course_id
--  WHERE c.slug = 'seguridad-basica-en-bitcoin-y-criptomonedas'
--    AND (jsonb_array_length(q.options) <> 4
--         OR (SELECT count(DISTINCT o) FROM jsonb_array_elements_text(q.options) o) <> 4);
-- QUE DEBE SALIR: 0.
