-- ============================================================================
-- 060: distractores creibles en Cold Storage
-- ============================================================================
-- ESTADO: APLICADA EN PRODUCCION EL 25/09/2026.
--   Ejecutada por PostgREST y versionada despues.
--
-- QUE PASABA
--   En las 18 preguntas de este curso la respuesta correcta era SIEMPRE la
--   opcion mas larga: 18 de 18, con 23,6 caracteres de ventaja de media.
--   "Elegir la mas larga" acertaba el 100%, y el umbral de aprobado es 70%. El
--   examen se aprobaba entero sin leer los enunciados.
--
--   Era el peor del catalogo. El segundo, Fundamentos de Bitcoin, va al 96%.
--
-- QUE HACE
--   Reescribe 51 de los 54 distractores. La respuesta correcta NO se toca: se
--   comprobo en las 18 que sigue siendo el mismo texto y en la misma posicion.
--   Las preguntas y las explicaciones tampoco se tocan.
--
--   El criterio: cada distractor tiene que seguir siendo FALSO y volverse mas
--   creible. Rellenar con paja seria peor que el sesgo, porque alargaria las
--   preguntas sin hacerlas mas dificiles. Asi que se alargaron diciendo algo
--   mas concreto y mas plausible, no anadiendo palabras.
--
--   Dos pasadas. La primera igualo las longitudes, y aun asi la correcta seguia
--   siendo mecanicamente la mas larga en 13 de 18, por 1 a 6 caracteres. Que la
--   ventaja no se vea a ojo no basta: mientras "la mas larga" acierte mas del
--   25%, la longitud sigue informando. La segunda pasada alargo UN distractor
--   por encima de la correcta en ocho preguntas.
--
-- RESULTADO, MEDIDO
--                                        antes    ahora
--     la correcta es la mas larga       18 / 18   4 / 18   (azar: ~25%)
--     margen medio                       23,6      1,3
--     preguntas con margen > 6 car          17        0
--     "elegir la mas larga" acierta       100%      28%
--     "siempre la B"                       22%      28%
--     mejor estrategia a ciegas           100%      28%
--
--   Con el umbral en 70%, ninguna estrategia a ciegas aprueba ya este examen.
--
-- DOS COSAS QUE SE CORRIGIERON AL ESCRIBIRLOS
--   - Un distractor decia "como las 12 palabras" y otro "que las 24 existen".
--     El curso ensena que la frase puede ser de doce o de veinticuatro, asi que
--     ninguna de las dos cifras puede aparecer como si fuera la unica. Las dos
--     se neutralizaron.
--   - Los distractores no nombran ninguna marca de dispositivo. Comprobado.
--
-- RESPALDO
--   C:/Users/alber/backups-sql/060-volver-atras.sql.bak
--   Devuelve las options exactamente como estaban antes de las dos pasadas.
-- ============================================================================

BEGIN;

-- ------------------------------------------------------------------------
-- M1 Fundamentos de Custodia
-- ------------------------------------------------------------------------

-- 1: 3 distractores reescritos. Longitudes ahora: 66 / 67 / 68 / 63
--    (la correcta es la A, 66 caracteres, intacta)
UPDATE public.quiz_questions
   SET options = '["Tú mismo: copias mal anotadas, extraviadas o descartadas por error","Un atacante con recursos y motivos concretos que te ha elegido a ti","Un fallo en la criptografía de Bitcoin que permita falsificar firmas","Un empleado del fabricante con acceso a la cadena de producción"]'::jsonb
 WHERE id = '0be0094e-10ec-47b4-8d71-65cabdc700be';

-- 2: 3 distractores reescritos. Longitudes ahora: 64 / 69 / 68 / 66
--    (la correcta es la B, 69 caracteres, intacta)
UPDATE public.quiz_questions
   SET options = '["Que cada capa que añades reduce la entropía efectiva de la frase","Que introduce puntos de fallo nuevos y no sobrevive a que tú no estés","Que obliga a reconstruirlo entero cada vez que necesitas firmar algo","Que encarece las comisiones, al añadir una firma más por cada capa"]'::jsonb
 WHERE id = '1c0b7937-9cd4-473b-a59b-d276cf315bea';

-- 3: 3 distractores reescritos. Longitudes ahora: 106 / 78 / 87 / 82
--    (la correcta es la C, 87 caracteres, intacta)
UPDATE public.quiz_questions
   SET options = '["Porque cualquier cartera acaba conectándose en algún momento, aunque solo sea para difundir la transacción","Porque la distinción la inventó el marketing de los fabricantes, no la técnica","Porque hay un gradiente de configuraciones y cada peldaño cambia unos riesgos por otros","Porque el almacenamiento en frío solo tiene sentido a partir de cantidades grandes"]'::jsonb
 WHERE id = '3c310424-dc22-455d-ab85-8faf413a10e2';

-- 4: 3 distractores reescritos. Longitudes ahora: 89 / 70 / 68 / 82
--    (la correcta es la D, 82 caracteres, intacta)
UPDATE public.quiz_questions
   SET options = '["Dividir una transacción en varias partes y pagar una comisión menor por cada una de ellas","Firmar una transacción sin que quien firma llegue a conocer su destino","Enviar a varios destinatarios con una sola firma y una sola comisión","Separar construir, firmar y difundir, de modo que quien firma no necesita conexión"]'::jsonb
 WHERE id = '5c861b49-3c3a-4ca5-b0eb-7e531f463e47';

-- 5: 3 distractores reescritos. Longitudes ahora: 67 / 67 / 60 / 64
--    (la correcta es la A, 67 caracteres, intacta)
UPDATE public.quiz_questions
   SET options = '["Si tu frase podría restaurarse en un dispositivo de otro fabricante","Cuántas criptomonedas distintas admite el aparato además de bitcoin","Si la pantalla es a color y se lee bien una dirección entera","Si se comunica por cable o de forma inalámbrica con el ordenador"]'::jsonb
 WHERE id = 'd9009a76-82ab-4755-8e51-80868cad472d';

-- 6: sin cambios (la correcta ya no era la mas larga)

-- 7: 3 distractores reescritos. Longitudes ahora: 63 / 62 / 62 / 67
--    (la correcta es la C, 62 caracteres, intacta)
UPDATE public.quiz_questions
   SET options = '["El dispositivo avisa de que no coincide con la que usaste antes","Se bloquea tras varios intentos fallidos, igual que con el PIN","Se abre una cartera distinta, válida y vacía, sin ningún error","La palabra adicional no distingue mayúsculas, como tampoco la frase"]'::jsonb
 WHERE id = '9c9e79b9-74ec-4891-b44c-25fc89f72b5e';

-- 8: 3 distractores reescritos. Longitudes ahora: 67 / 65 / 66 / 69
--    (la correcta es la D, 69 caracteres, intacta)
UPDATE public.quiz_questions
   SET options = '["Gastar los fondos de las direcciones que ya has usado, no los demás","Nada: la xpub es pública por diseño y no revela nada aprovechable","Derivar tu frase a partir de ella con suficiente tiempo de cálculo","Ver todo tu historial y tu saldo, presente y futuro, sin poder gastar"]'::jsonb
 WHERE id = '02f5584b-3bd9-467f-be7e-131198882f33';

-- 9: 3 distractores reescritos. Longitudes ahora: 88 / 83 / 96 / 85
--    (la correcta es la A, 88 caracteres, intacta)
UPDATE public.quiz_questions
   SET options = '["La frase es indistinguible de una buena y puede reconstruirse sin acceder al dispositivo","El checksum no cuadra y el dispositivo rechaza la frase antes de llegar a mostrarla","Solo hay riesgo si el dispositivo llega a conectarse a internet en algún momento de su vida útil","Actualizar el firmware corrige el generador y vuelve a generar la frase que ya tenías"]'::jsonb
 WHERE id = '94a142e8-f538-4ab1-8a1a-f51237f40c44';

-- ------------------------------------------------------------------------
-- M2 Implementación Práctica
-- ------------------------------------------------------------------------

-- 1: 3 distractores reescritos. Longitudes ahora: 68 / 74 / 84 / 66
--    (la correcta es la B, 74 caracteres, intacta)
UPDATE public.quiz_questions
   SET options = '["El procedimiento normal en los modelos que vienen ya preconfigurados","Un fraude: la frase se genera en el aparato, delante de ti, la primera vez","Una función de comodidad del fabricante que conviene cambiar en cuanto lo configures","Una frase temporal que caduca en cuanto generas la tuya definitiva"]'::jsonb
 WHERE id = 'eb8072e3-d69c-439d-8225-7541cbf73997';

-- 2: 3 distractores reescritos. Longitudes ahora: 76 / 77 / 77 / 71
--    (la correcta es la C, 77 caracteres, intacta)
UPDATE public.quiz_questions
   SET options = '["Porque el navegador muestra las direcciones abreviadas y podrías confundirte","Porque el dispositivo comprueba la dirección contra la red antes de mostrarla","Porque es el único punto de la cadena que el malware de tu equipo no controla","Porque la cartera de escritorio no comprueba el formato de la dirección"]'::jsonb
 WHERE id = '56f9fe08-cc8c-4ee5-9d8e-52d336e39e6c';

-- 3: 3 distractores reescritos. Longitudes ahora: 83 / 82 / 76 / 81
--    (la correcta es la D, 81 caracteres, intacta)
UPDATE public.quiz_questions
   SET options = '["Tu clave privada en forma cifrada, mientras el dispositivo siga conectado al equipo","Nada: el dispositivo protege toda la información que llega a salir de él al firmar","Solo el importe y la fecha de la última transacción que hayas firmado con él","Tus direcciones y tu saldo, porque la cartera se los consulta a un servidor ajeno"]'::jsonb
 WHERE id = '9baf34b8-6490-413b-83d6-de54b948b670';

-- 4: 3 distractores reescritos. Longitudes ahora: 105 / 110 / 94 / 92
--    (la correcta es la A, 105 caracteres, intacta)
UPDATE public.quiz_questions
   SET options = '["Empeoras las dos cosas: quien encuentre media frase avanza mucho, y perder cualquier mitad lo pierde todo","Duplicas la dificultad de adivinarla, porque hacen falta las dos mitades completas para llegar a reconstruirla","El mismo resultado que tener dos copias completas guardadas en dos sitios distintos y alejados","Proteges frente a la coacción, porque sin tener las dos mitades no puedes entregar nada útil"]'::jsonb
 WHERE id = '50708809-87f8-4e89-aef9-b6af4f64fc22';

-- 5: 3 distractores reescritos. Longitudes ahora: 91 / 98 / 100 / 93
--    (la correcta es la B, 98 caracteres, intacta)
UPDATE public.quiz_questions
   SET options = '["Contra el papel donde la anotaste la primera vez, comparando palabra por palabra y el orden","Contra el dispositivo: durante la configuración inicial, o con su función de comprobación de copia","Contra la lista pública de palabras, comprobando una por una que todas existen y están bien escritas","Contra la primera dirección de recepción, comprobando que coincide con la que tenías apuntada"]'::jsonb
 WHERE id = '2693c86b-94ff-4b85-99b9-3bc8fced6112';

-- 6: 3 distractores reescritos. Longitudes ahora: 86 / 70 / 79 / 76
--    (la correcta es la C, 79 caracteres, intacta)
UPDATE public.quiz_questions
   SET options = '["Las palabras, siempre que el documento esté protegido con una contraseña larga y única","Las palabras anotadas en orden inverso, que no sirven tal cual a nadie","Dónde están las copias, si hay palabra adicional y qué tipo de direcciones usas","Nada en absoluto: cualquier anotación sobre tu custodia es un riesgo añadido"]'::jsonb
 WHERE id = '24cc2533-ad9f-4e17-a4ee-88421deeec2b';

-- 7: 3 distractores reescritos. Longitudes ahora: 87 / 73 / 73 / 80
--    (la correcta es la D, 80 caracteres, intacta)
UPDATE public.quiz_questions
   SET options = '["Que la frase esté mal copiada y hayas abierto sin saberlo una cartera que no es la tuya","Que alguien haya encontrado tu frase y haya movido los fondos sin permiso","Que la frase solo sirva en el mismo modelo de dispositivo donde se generó","Que la cartera use una ruta de derivación distinta, o falte la palabra adicional"]'::jsonb
 WHERE id = '4b41f200-4bdd-4688-a281-385ffa312175';

-- 8: 3 distractores reescritos. Longitudes ahora: 63 / 67 / 61 / 62
--    (la correcta es la A, 63 caracteres, intacta)
UPDATE public.quiz_questions
   SET options = '["Introducir la frase de memoria en lugar de leer la copia física","Hacerlo sin conexión a internet, en un equipo completamente aislado","Hacerlo en un dispositivo prestado y no en el tuyo de siempre","No llegar a mover fondos reales en ningún momento de la prueba"]'::jsonb
 WHERE id = 'fac6cd6a-0101-47c2-8c48-fe62b12141e9';

-- 9: 3 distractores reescritos. Longitudes ahora: 72 / 73 / 70 / 68
--    (la correcta es la B, 73 caracteres, intacta)
UPDATE public.quiz_questions
   SET options = '["Que el dispositivo se actualiza al último firmware sin perder la cartera","Que otra persona entendería tus instrucciones y sabría qué no hacer jamás","Que el PIN sigue funcionando después de meses sin tocar el dispositivo","Que la cartera admite el tipo de direcciones más reciente que existe"]'::jsonb
 WHERE id = 'd43f31e2-6f5a-438f-aed6-7a97135e784f';

COMMIT;


-- ============================================================================
-- COMPROBACIONES (solo lectura)
-- ============================================================================
-- 1. Ninguna pregunta puede haber perdido opciones
--
-- SELECT count(*) FROM public.quiz_questions q
--   JOIN public.modules m ON m.id = q.module_id
--   JOIN public.courses c ON c.id = m.course_id
--  WHERE c.slug = 'cold-storage-protege-tus-bitcoin'
--    AND (jsonb_array_length(q.options) <> 4 OR q.correct_answer NOT BETWEEN 0 AND 3);
-- QUE DEBE SALIR: 0.
--
-- 2. Cuantas veces la correcta es la mas larga (deberia ser 4 de 18)
--
-- SELECT count(*) FROM (
--   SELECT q.id,
--          length(q.options->>q.correct_answer) AS correcta,
--          (SELECT max(length(o)) FROM jsonb_array_elements_text(q.options) o) AS mayor
--     FROM public.quiz_questions q
--     JOIN public.modules m ON m.id = q.module_id
--     JOIN public.courses c ON c.id = m.course_id
--    WHERE c.slug = 'cold-storage-protege-tus-bitcoin'
-- ) t WHERE correcta = mayor;
-- QUE DEBE SALIR: 4 o menos.
--
-- 3. Y que no hay opciones repetidas dentro de una pregunta
--
-- SELECT q.id FROM public.quiz_questions q
--   JOIN public.modules m ON m.id = q.module_id
--   JOIN public.courses c ON c.id = m.course_id
--  WHERE c.slug = 'cold-storage-protege-tus-bitcoin'
--    AND (SELECT count(DISTINCT o) FROM jsonb_array_elements_text(q.options) o) <> 4;
-- QUE DEBE SALIR: 0 filas.
