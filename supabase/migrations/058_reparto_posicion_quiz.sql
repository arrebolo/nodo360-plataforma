-- ============================================================================
-- 058: reparte la posicion de la respuesta correcta en los quiz
-- ============================================================================
-- ESTADO: APLICADA EN PRODUCCION EL 25/09/2026.
--   Ejecutada por PostgREST y versionada despues.
--
-- QUE PASABA
--   De las 243 preguntas del catalogo, 127 tenian la correcta en la B: el 52%.
--   Las opciones A y D casi no se usaban (23 y 22). Chi-cuadrado 122,2 con 3
--   grados de libertad, cuando por encima de 7,8 ya no es azar.
--
--   Consecuencia medible: "elegir siempre la B" acertaba el 52% del catalogo,
--   y en "Blockchain: lo que Bitcoin no es" el 93% (25 de 27). El umbral de
--   aprobado es 70% (app/api/quiz/submit/route.ts), asi que ese curso se
--   aprobaba sin leer ni el enunciado.
--
-- QUE HACE
--   Permuta el array options y actualiza correct_answer para que apunte a la
--   MISMA opcion de siempre en su nueva posicion. NO reescribe ni una palabra:
--   ni preguntas, ni opciones, ni explicaciones. El contenido es identico.
--
--   El reparto es equilibrado POR MODULO, no aleatorio: dentro de cada modulo
--   las posiciones se asignan por turno (A, B, C, D, A, B, C, D, A) siguiendo
--   el order_index de la pregunta, y el turno arranca desplazado un puesto en
--   cada modulo, de modo que el sobrante de cada modulo de 9 caiga en una letra
--   distinta.
--
--   El orden relativo de los tres distractores se conserva.
--
-- RESULTADO, MEDIDO
--   reparto  antes: A=23  B=127 C=71  D=22   chi2 = 122,2
--   reparto  ahora: A=61  B=61  C=61  D=60   chi2 = 0,0
--   "siempre la B" pasa de acertar el 52% a acertar el 25%, que es el azar.
--   La posicion cambia en 171 preguntas; en 72 ya estaba donde toca.
--
-- LO QUE ESTO NO ARREGLA
--   El sesgo de longitud, que es el grande: en 192 de 243 preguntas la correcta
--   es la opcion mas larga, con 23 caracteres de ventaja de media, y "elegir la
--   mas larga" acierta el 81%. Eso exige reescribir 498 distractores y va curso
--   a curso, empezando por Cold Storage (100%) y Fundamentos de Bitcoin (96%).
--
-- EFECTO EN LOS INTENTOS YA REGISTRADOS
--   quiz_attempts.answers guarda selected_answer como INDICE, asi que los
--   indices viejos apuntan ahora a otra opcion. No cambia ninguna nota: el
--   acierto por pregunta y el score estan guardados aparte, ya calculados.
--   Y de las 80 respuestas registradas en los 16 intentos, solo 25 (31%)
--   apuntan a preguntas que todavia existen: las reescrituras de cursos se
--   llevaron el resto. El historico ya estaba roto en dos tercios.
--
-- RESPALDO
--   C:/Users/alber/backups-sql/058-volver-atras.sql.bak
--   Devuelve options y correct_answer exactamente como estaban.
-- ============================================================================

BEGIN;


-- ------------------------------------------------------------------------
-- cold-storage-protege-tus-bitcoin / null
-- ------------------------------------------------------------------------

-- orden 1: la correcta pasa de A a A
UPDATE public.quiz_questions
   SET options = '["Tú mismo: copias mal anotadas, extraviadas o descartadas por error","Un atacante con recursos que te ha elegido como objetivo","Un fallo criptográfico en el protocolo de Bitcoin","Un empleado del fabricante del dispositivo"]'::jsonb,
       correct_answer = 0
 WHERE id = '0be0094e-10ec-47b4-8d71-65cabdc700be';

-- orden 2: la correcta pasa de B a B
UPDATE public.quiz_questions
   SET options = '["Que las capas se anulan entre sí criptográficamente","Que introduce puntos de fallo nuevos y no sobrevive a que tú no estés","Que ralentiza la confirmación de las transacciones","Que obliga a pagar comisiones más altas"]'::jsonb,
       correct_answer = 1
 WHERE id = '1c0b7937-9cd4-473b-a59b-d276cf315bea';

-- orden 3: la correcta pasa de C a C
UPDATE public.quiz_questions
   SET options = '["Porque todas las carteras están conectadas en algún momento","Porque la temperatura del dispositivo no influye en la seguridad","Porque hay un gradiente de configuraciones y cada peldaño cambia unos riesgos por otros","Porque el frío solo aplica a cantidades grandes"]'::jsonb,
       correct_answer = 2
 WHERE id = '3c310424-dc22-455d-ab85-8faf413a10e2';

-- orden 4: la correcta pasa de D a D
UPDATE public.quiz_questions
   SET options = '["Reducir la comisión dividiendo la transacción en partes","Firmar una transacción sin conocer su destino","Enviar bitcoin a varios destinatarios a la vez","Separar construir, firmar y difundir, de modo que quien firma no necesita conexión"]'::jsonb,
       correct_answer = 3
 WHERE id = '5c861b49-3c3a-4ca5-b0eb-7e531f463e47';

-- orden 5: la correcta pasa de A a A
UPDATE public.quiz_questions
   SET options = '["Si tu frase podría restaurarse en un dispositivo de otro fabricante","Cuántas criptomonedas distintas admite","Si la pantalla es a color","Si se conecta por cable o de forma inalámbrica"]'::jsonb,
       correct_answer = 0
 WHERE id = 'd9009a76-82ab-4755-8e51-80868cad472d';

-- orden 6: la correcta pasa de B a B
UPDATE public.quiz_questions
   SET options = '["Una copia de las transacciones que te afectan","La capacidad de firmar; los bitcoin están en la cadena","Los bitcoin, cifrados en su memoria interna","El saldo, sincronizado con el servidor del fabricante"]'::jsonb,
       correct_answer = 1
 WHERE id = '81332aea-636b-4838-ab07-0d40c27be6f5';

-- orden 7: la correcta pasa de C a C
UPDATE public.quiz_questions
   SET options = '["El dispositivo avisa de que no coincide","Se bloquea tras varios intentos","Se abre una cartera distinta, válida y vacía, sin ningún error","La palabra adicional no distingue mayúsculas"]'::jsonb,
       correct_answer = 2
 WHERE id = '9c9e79b9-74ec-4891-b44c-25fc89f72b5e';

-- orden 8: la correcta pasa de D a D
UPDATE public.quiz_questions
   SET options = '["Gastar los fondos de las direcciones ya usadas","Nada: la xpub no contiene información útil","Derivar la frase con suficiente tiempo de cálculo","Ver todo tu historial y tu saldo, presente y futuro, sin poder gastar"]'::jsonb,
       correct_answer = 3
 WHERE id = '02f5584b-3bd9-467f-be7e-131198882f33';

-- orden 9: la correcta pasa de A a A
UPDATE public.quiz_questions
   SET options = '["La frase es indistinguible de una buena y puede reconstruirse sin acceder al dispositivo","El checksum falla y el dispositivo rechaza la frase","Solo hay riesgo si el dispositivo llega a conectarse a internet","Actualizar el firmware corrige también la frase que ya se generó"]'::jsonb,
       correct_answer = 0
 WHERE id = '94a142e8-f538-4ab1-8a1a-f51237f40c44';

-- orden 1: la correcta pasa de C a B
UPDATE public.quiz_questions
   SET options = '["El procedimiento normal en modelos preconfigurados","Un fraude: la frase se genera en el aparato, delante de ti, la primera vez","Una función de comodidad que conviene cambiar después","Una frase temporal que caduca al primer uso"]'::jsonb,
       correct_answer = 1
 WHERE id = 'eb8072e3-d69c-439d-8225-7541cbf73997';

-- orden 2: la correcta pasa de D a C
UPDATE public.quiz_questions
   SET options = '["Porque el monitor muestra las direcciones abreviadas","Porque el dispositivo muestra la dirección ya confirmada en la red","Porque es el único punto de la cadena que el malware de tu equipo no controla","Porque la cartera de escritorio no valida el formato"]'::jsonb,
       correct_answer = 2
 WHERE id = '56f9fe08-cc8c-4ee5-9d8e-52d336e39e6c';

-- orden 3: la correcta pasa de A a D
UPDATE public.quiz_questions
   SET options = '["Tu clave privada, en forma cifrada","Nada: el dispositivo protege toda la información","Solo el importe de la última transacción","Tus direcciones y tu saldo, porque la cartera se los consulta a un servidor ajeno"]'::jsonb,
       correct_answer = 3
 WHERE id = '9baf34b8-6490-413b-83d6-de54b948b670';

-- orden 4: la correcta pasa de B a A
UPDATE public.quiz_questions
   SET options = '["Empeoras las dos cosas: quien encuentre media frase avanza mucho, y perder cualquier mitad lo pierde todo","Duplicas la dificultad de adivinar la frase","El mismo resultado que dos copias completas","Proteges frente a la coacción"]'::jsonb,
       correct_answer = 0
 WHERE id = '50708809-87f8-4e89-aef9-b6af4f64fc22';

-- orden 5: la correcta pasa de C a B
UPDATE public.quiz_questions
   SET options = '["Contra el papel donde la anotaste primero","Contra el dispositivo: durante la configuración inicial, o con su función de comprobación de copia","Contra la lista pública de palabras","Contra la primera dirección de recepción"]'::jsonb,
       correct_answer = 1
 WHERE id = '2693c86b-94ff-4b85-99b9-3bc8fced6112';

-- orden 6: la correcta pasa de D a C
UPDATE public.quiz_questions
   SET options = '["Las palabras, si el documento está protegido con contraseña","Las palabras en orden inverso","Dónde están las copias, si hay palabra adicional y qué tipo de direcciones usas","Nada: cualquier anotación es un riesgo"]'::jsonb,
       correct_answer = 2
 WHERE id = '24cc2533-ad9f-4e17-a4ee-88421deeec2b';

-- orden 7: la correcta pasa de A a D
UPDATE public.quiz_questions
   SET options = '["Que la frase esté mal copiada","Que los fondos se hayan movido sin tu permiso","Que la frase solo funcione en el dispositivo donde se generó","Que la cartera use una ruta de derivación distinta, o falte la palabra adicional"]'::jsonb,
       correct_answer = 3
 WHERE id = '4b41f200-4bdd-4688-a281-385ffa312175';

-- orden 8: la correcta pasa de B a A
UPDATE public.quiz_questions
   SET options = '["Introducir la frase de memoria en lugar de leer la copia física","Hacerlo sin conexión a internet","Hacerlo en un dispositivo prestado","No mover fondos reales durante la prueba"]'::jsonb,
       correct_answer = 0
 WHERE id = 'fac6cd6a-0101-47c2-8c48-fe62b12141e9';

-- orden 9: la correcta pasa de C a B
UPDATE public.quiz_questions
   SET options = '["Que el dispositivo se actualiza al último firmware","Que otra persona entendería tus instrucciones y sabría qué no hacer jamás","Que el PIN sigue funcionando tras meses sin uso","Que la cartera admite el tipo de direcciones más reciente"]'::jsonb,
       correct_answer = 1
 WHERE id = 'd43f31e2-6f5a-438f-aed6-7a97135e784f';

-- ------------------------------------------------------------------------
-- como-funciona-bitcoin-nivel-basico / como-funciona-la-red-bitcoin
-- ------------------------------------------------------------------------

-- orden 1: la correcta pasa de B a C
UPDATE public.quiz_questions
   SET options = '["El segundo, porque al borrar deja de comprobar el pasado","El primero, porque conservar tanto dato lo vuelve más lento y se salta comprobaciones","Ninguno: los dos comprueban lo mismo; el segundo solo pierde la capacidad de servir historia antigua a otros","Depende de cuántos bloques haya borrado cada uno"]'::jsonb,
       correct_answer = 2
 WHERE id = '734fe2af-6116-499e-8146-ef0dc77e4ec8';

-- orden 2: la correcta pasa de C a D
UPDATE public.quiz_questions
   SET options = '["La red se divide en dos mitades del mismo tamaño","Los demás nodos abren una votación para decidir si aceptarlos","Las reglas cambian si consigue suficientes nodos a su favor","El resto los ignora: para los demás esos bloques no existen"]'::jsonb,
       correct_answer = 3
 WHERE id = '0e914745-4593-4ff4-871f-0e32f1e99722';

-- orden 3: la correcta pasa de A a A
UPDATE public.quiz_questions
   SET options = '["La aplicación pregunta a un servidor ajeno y se fía de la respuesta; el nodo lo comprueba por su cuenta","La aplicación usa una copia reducida de la cadena de bloques","El nodo tiene acceso a información que la aplicación no puede consultar","No hay diferencia real: las dos leen los mismos datos de la red"]'::jsonb,
       correct_answer = 0
 WHERE id = 'f3c86bdd-8a8e-4987-ba82-74ca68273c62';

-- orden 4: la correcta pasa de D a B
UPDATE public.quiz_questions
   SET options = '["Se compartió la clave pública en vez de la dirección","Se reutilizó la misma dirección, así que quien la conoce ve todo su historial","Se usó una cartera que publica los saldos de sus usuarios","Se firmó la transacción con la clave equivocada"]'::jsonb,
       correct_answer = 1
 WHERE id = '23e8316b-1579-41ce-aa6b-fa0d7bf908b8';

-- orden 5: la correcta pasa de B a C
UPDATE public.quiz_questions
   SET options = '["Es el procedimiento normal cuando el pago viene de otro país","Es correcto si la clave se envía por un canal cifrado","Es un intento de robo: para cobrar solo hace falta la dirección","Hace falta la clave pública, no la privada, pero la petición es legítima"]'::jsonb,
       correct_answer = 2
 WHERE id = '40d02701-ae1e-45ff-851f-cd9016788e52';

-- orden 6: la correcta pasa de C a D
UPDATE public.quiz_questions
   SET options = '["Porque las direcciones caducan al cabo de un tiempo","Porque la red bloquea los intentos de gasto no autorizados","Porque la dirección está cifrada con una contraseña aparte","Porque de la dirección no se puede llegar a la clave pública, ni de esta a la privada"]'::jsonb,
       correct_answer = 3
 WHERE id = '4fb36b27-81c2-455c-87f9-f3b7f6900ac9';

-- orden 7: la correcta pasa de C a A
UPDATE public.quiz_questions
   SET options = '["El cambio, que vuelve a una dirección nueva de tu propia cartera","Una comisión desviada por la cartera a su propio monedero","Un error de la cartera que conviene reportar de inmediato","Un intento de robo interceptando la transacción"]'::jsonb,
       correct_answer = 0
 WHERE id = '338d8f09-72c2-4ffd-a29c-57ba7c30ff74';

-- orden 8: la correcta pasa de C a B
UPDATE public.quiz_questions
   SET options = '["La segunda, porque la comisión es proporcional a la cantidad enviada","La primera, porque juntar treinta cobros produce una transacción mucho más grande","Las dos igual, porque la comisión es fija por transacción","Depende solo de la urgencia que elija cada una"]'::jsonb,
       correct_answer = 1
 WHERE id = '93b4ab9f-4d4c-4e98-8a89-4a9f7ef53b8b';

-- orden 9: la correcta pasa de A a C
UPDATE public.quiz_questions
   SET options = '["Una confirmación garantizada en el siguiente bloque","Mayor seguridad para los fondos una vez recibidos","Prioridad para entrar antes en un bloque, nada más","Que la transacción pueda cancelarse si te arrepientes"]'::jsonb,
       correct_answer = 2
 WHERE id = '11447c5e-3027-4567-9f8d-dff29e112956';

-- ------------------------------------------------------------------------
-- como-funciona-bitcoin-nivel-basico / que-hace-diferente-a-bitcoin
-- ------------------------------------------------------------------------

-- orden 1: la correcta pasa de C a D
UPDATE public.quiz_questions
   SET options = '["Porque los nodos guardan una copia de seguridad cifrada del original","Porque las transacciones antiguas se borran y ya no se pueden tocar","Porque hace falta la autorización de quien recibió el pago","Porque cambiar cualquier dato altera la huella de su bloque, y eso invalida todos los bloques posteriores"]'::jsonb,
       correct_answer = 3
 WHERE id = '7da19d4b-86ef-49a8-a71c-1ee7bd84f62f';

-- orden 2: la correcta pasa de B a A
UPDATE public.quiz_questions
   SET options = '["Su bloque quedó en una rama descartada al imponerse otra con más trabajo acumulado","Alguien la ha cancelado desde el otro extremo","La comisión resultó insuficiente y la red la ha devuelto","El nodo que la incluyó ha sido expulsado de la red"]'::jsonb,
       correct_answer = 0
 WHERE id = 'b0cab245-32b7-409a-a4f2-2133dbac2ed2';

-- orden 3: la correcta pasa de C a B
UPDATE public.quiz_questions
   SET options = '["Sí, la mantiene el nodo que haya encontrado el último bloque","No: cada nodo tiene la suya y no son idénticas","Sí, y cualquiera puede consultarla en el registro público","Sí, aunque solo la ven los mineros"]'::jsonb,
       correct_answer = 1
 WHERE id = '67e32a36-2cee-437d-8f73-f716ffcd94c1';

-- orden 4: la correcta pasa de A a C
UPDATE public.quiz_questions
   SET options = '["Sí, porque el protocolo compensa a quien lleva tiempo sin acertar","Sí, porque ya ha descartado gran parte de las posibilidades","No: cada intento es independiente y no se acumula nada","Depende de si ha mantenido el equipo encendido sin interrupciones"]'::jsonb,
       correct_answer = 2
 WHERE id = 'b8da0343-d4dd-41a6-8f24-491201179d58';

-- orden 5: la correcta pasa de C a D
UPDATE public.quiz_questions
   SET options = '["Se detendría hasta que alguien reajustara el protocolo","No cambiaría: el ritmo no depende de la potencia conectada","Los bloques saldrían lentos de forma permanente","Los bloques saldrían lentos unos días y el siguiente ajuste devolvería el paso"]'::jsonb,
       correct_answer = 3
 WHERE id = '7e8c878c-d3f1-4f93-a405-f00ef3f2f536';

-- orden 6: la correcta pasa de B a A
UPDATE public.quiz_questions
   SET options = '["Coste de deshacerla, no validez: ya era válida desde el principio","Validez: hasta la sexta confirmación no se considera correcta","Una reducción de la comisión pagada","Una copia adicional en más nodos de la red"]'::jsonb,
       correct_answer = 0
 WHERE id = '9ed52370-cab9-4159-a0cc-9ed770d9b7cd';

-- orden 7: la correcta pasa de C a B
UPDATE public.quiz_questions
   SET options = '["Sí, si se denuncia antes de que se confirme","No: la red comprueba que la firma encaja, no si te han mentido","Sí, los nodos pueden marcarla como fraudulenta y descartarla","Sí, presentando la clave privada para demostrar la propiedad"]'::jsonb,
       correct_answer = 1
 WHERE id = 'bba483a8-b079-413b-ac8e-49c2162748e1';

-- orden 8: la correcta pasa de D a C
UPDATE public.quiz_questions
   SET options = '["Los desarrolladores lo publican y se aplica automáticamente a todos","Se decide por votación entre quienes forman bloques","Solo si lo adopta una mayoría muy amplia: quien no actualiza sigue con las reglas de antes","Lo aprueba la fundación que mantiene el proyecto"]'::jsonb,
       correct_answer = 2
 WHERE id = 'eb0f67d1-1330-48fd-9590-2d59982319ed';

-- orden 9: la correcta pasa de A a D
UPDATE public.quiz_questions
   SET options = '["Que el precio subirá tras el próximo ajuste de la emisión","Que dentro de diez años lo usará la mayoría de la población","Que es la mejor forma de conservar valor a largo plazo","Cuántos bitcoins existen en este momento"]'::jsonb,
       correct_answer = 3
 WHERE id = '2ae77189-09b1-4a2e-ad9f-b3375df5e268';

-- ------------------------------------------------------------------------
-- ethereum-y-contratos-inteligentes / que-anadio-ethereum
-- ------------------------------------------------------------------------

-- orden 1: la correcta pasa de B a A
UPDATE public.quiz_questions
   SET options = '["Que no tiene clave y no puede empezar nada: solo se ejecuta cuando alguien la llama","Que cobra una comisión por cada operación que recibe y la acumula en su saldo","Que solo puede recibir fondos y nunca enviarlos, salvo que su autor lo autorice","Que la gestiona la fundación que mantiene la red y responde de lo que haga"]'::jsonb,
       correct_answer = 0
 WHERE id = 'd748d2a7-81ed-4a6e-9007-926d011e0416';

-- orden 2: la correcta pasa de A a B
UPDATE public.quiz_questions
   SET options = '["Que las operaciones se firmen con una clave privada","Que un programa pueda tener fondos propios","Que el registro sea público y permanente","Que exista una moneda nativa de la red"]'::jsonb,
       correct_answer = 1
 WHERE id = 'b4c7514c-6596-4d95-8a99-bfdc87a96292';

-- orden 3: la correcta pasa de C a C
UPDATE public.quiz_questions
   SET options = '["Puedes moverlo, pero la operación tarda bastante más en confirmarse de lo normal","El token queda bloqueado automáticamente hasta que ingreses ether en esa cuenta","No puedes moverlo: mover un token es llamar a un programa, y ejecutar se paga en ether","Puedes moverlo y la comisión se descuenta del propio token que estás enviando"]'::jsonb,
       correct_answer = 2
 WHERE id = '4895657e-b073-4c0b-805f-8afbd893058c';

-- orden 4: la correcta pasa de B a D
UPDATE public.quiz_questions
   SET options = '["Para financiar el desarrollo del protocolo y pagar a quienes mantienen la red","Porque el espacio de almacenamiento de la cadena está limitado por el protocolo","Para que la moneda nativa tenga demanda constante y no pierda valor con el tiempo","Porque nada impediría mandarle un programa que no terminara nunca y bloquear a todos"]'::jsonb,
       correct_answer = 3
 WHERE id = '691a966e-1cb5-4ee6-936f-5cdfc877c97e';

-- orden 5: la correcta pasa de C a A
UPDATE public.quiz_questions
   SET options = '["El estado vuelve a como estaba y se paga todo lo consumido","Se queda pendiente y se reanuda cuando pagues el resto","Se cancela y se te devuelve lo pagado, menos una pequeña penalización","Se ejecuta la parte que llegó a hacerse y el resto se descarta"]'::jsonb,
       correct_answer = 0
 WHERE id = '706ec107-a810-4718-804a-3a3701b066aa';

-- orden 6: la correcta pasa de B a B
UPDATE public.quiz_questions
   SET options = '["Porque el protocolo da menos prioridad a las operaciones pequeñas si hay congestión","Porque el coste depende de lo que la red tenga que hacer, no de cuánto mueves: es un peaje fijo","Porque la comisión es un porcentaje de la cantidad enviada y sube con la congestión","Porque las cuentas con poco saldo pierden el acceso temporalmente cuando la red se llena"]'::jsonb,
       correct_answer = 1
 WHERE id = 'd1476d4c-584f-431c-9d73-a2ebd5b847a2';

-- orden 7: la correcta pasa de D a C
UPDATE public.quiz_questions
   SET options = '["Porque generar azar de verdad exigiría tanto cómputo que las operaciones serían inasumibles","Porque la máquina virtual no incluye las instrucciones matemáticas que harían falta para ello","Porque todos los que mantienen una copia deben obtener el mismo resultado, y el azar es lo contrario","Porque el azar solo está disponible en las capas construidas encima de la cadena principal"]'::jsonb,
       correct_answer = 2
 WHERE id = '94bdd01e-b5b5-4cf2-bbd7-7456d802f1c9';

-- orden 8: la correcta pasa de A a D
UPDATE public.quiz_questions
   SET options = '["Un mecanismo del propio protocolo que consulta en internet los precios y datos que el contrato necesita","Un contrato especial que tiene permiso para leer el estado de otras cadenas y traerlo a la suya","Un tipo de nodo cuya función es comprobar que los datos externos que entran son correctos","Alguien que anota dentro del registro un dato de fuera, que el contrato da por bueno sin comprobarlo"]'::jsonb,
       correct_answer = 3
 WHERE id = '39915f88-c0fd-42c4-904b-8f505aeb7089';

-- orden 9: la correcta pasa de B a A
UPDATE public.quiz_questions
   SET options = '["Que el dato sea cierto, y alguien mueva a propósito el mercado que mide","Que quien escribe el dato sea coaccionado para escribir otro valor","Que el contrato no compruebe la antigüedad del dato que está leyendo","Que el dato venga de una sola fuente en vez de varias independientes"]'::jsonb,
       correct_answer = 0
 WHERE id = '3c1e9cb2-b62e-4f00-bde5-8d33ca5783bc';

-- ------------------------------------------------------------------------
-- ethereum-y-contratos-inteligentes / lo-que-decide-si-algo-falla
-- ------------------------------------------------------------------------

-- orden 1: la correcta pasa de C a B
UPDATE public.quiz_questions
   SET options = '["El texto que escribió quien lo programó, tal cual, con sus comentarios incluidos","Instrucciones para la máquina virtual; el texto legible, si existe, está fuera","Un enlace al repositorio donde está publicado el código fuente y su licencia","Una copia cifrada del código que solo puede descifrar quien tenga la clave del autor"]'::jsonb,
       correct_answer = 1
 WHERE id = '541d3742-01ec-4ebe-8394-f49f2cb2c2a9';

-- orden 2: la correcta pasa de B a C
UPDATE public.quiz_questions
   SET options = '["Que un auditor independiente ha certificado que no tiene fallos conocidos","Que el propio protocolo comprobó el código antes de aceptar su publicación","Que alguien tradujo otra vez el texto publicado y coincide con lo que hay dentro","Que el contrato ha funcionado sin ningún incidente durante el plazo mínimo exigido"]'::jsonb,
       correct_answer = 2
 WHERE id = '2dd61baf-0525-4581-bb52-33f4236cbbc6';

-- orden 3: la correcta pasa de C a D
UPDATE public.quiz_questions
   SET options = '["Que quien audita no responde en modo alguno de tus pérdidas","Que no demuestra que el contrato no tenga ningún fallo","Que no revisa el diseño económico del proyecto que lo usa","Que puede no cubrir el código que se está ejecutando hoy"]'::jsonb,
       correct_answer = 3
 WHERE id = '7ca6f015-1219-40d9-a7de-9ab1075e7156';

-- orden 4: la correcta pasa de A a A
UPDATE public.quiz_questions
   SET options = '["Se publica lógica nueva en otra dirección y se reescribe la nota que dice dónde está","Se vota una excepción entre quienes mantienen la red y se aplica en el bloque siguiente","Se sobrescriben las instrucciones de esa dirección pagando un coste mucho mayor","Se crea una bifurcación de la cadena cada vez que hay que actualizar un contrato"]'::jsonb,
       correct_answer = 0
 WHERE id = 'c28247ec-af3c-4611-a7b1-d9905172c539';

-- orden 5: la correcta pasa de D a B
UPDATE public.quiz_questions
   SET options = '["Para que la comunidad pueda votarlo y rechazarlo durante ese plazo si no le conviene","Para darte tiempo a irte: es la diferencia entre enterarte antes y enterarte después","Para impedir que el cambio llegue a producirse si aparece oposición suficiente","Para que haya tiempo de corregir errores en el código nuevo antes de aplicarlo"]'::jsonb,
       correct_answer = 1
 WHERE id = 'ac97c306-ee81-4a8d-b24a-3854891ec9f4';

-- orden 6: la correcta pasa de C a C
UPDATE public.quiz_questions
   SET options = '["Que siempre hay alguien que cobra una comisión por cada uso y puede subirla","Que el código sigue perteneciendo legalmente a su autor aunque esté publicado","Que un contrato imposible de cambiar puede permitir pausar, mover parámetros o retirar fondos","Que la red puede revertir lo que haya hecho un contrato si se alcanza consenso suficiente"]'::jsonb,
       correct_answer = 2
 WHERE id = '1af1eb17-2431-449b-8502-12944229b1a0';

-- orden 7: la correcta pasa de B a D
UPDATE public.quiz_questions
   SET options = '["Que dos usuarios distintos ejecutan la misma operación dentro del mismo bloque","Que el contrato se queda sin fondos suficientes para atender todas las retiradas","Que un contrato llama a otro contrato que nadie ha llegado a revisar ni verificar","Que el contrato dio por supuesto que nada pasaría entre dos de sus propios pasos"]'::jsonb,
       correct_answer = 3
 WHERE id = 'fdf0986f-4085-41b4-b989-d4771c7b13b8';

-- orden 8: la correcta pasa de C a A
UPDATE public.quiz_questions
   SET options = '["Alguien con permiso y tu propia firma","El orden imprevisto y el dato de fuera","El dato de fuera y tu propia firma","El orden imprevisto y alguien con permiso"]'::jsonb,
       correct_answer = 0
 WHERE id = '6c05c725-9f72-47c7-a1f9-153977e12d81';

-- orden 9: la correcta pasa de D a B
UPDATE public.quiz_questions
   SET options = '["El orden imprevisto, mirando cuánto lleva funcionando el contrato con dinero dentro","Quién tiene permiso: si la dirección reenvía, quién puede cambiarlo, si hay demora y si hay historial","El dato de fuera, comparando el precio que usa el contrato con los de otros mercados","Ninguno de los cuatro: los cuatro exigen conocimientos que no están al alcance de un usuario corriente"]'::jsonb,
       correct_answer = 1
 WHERE id = 'c29dce80-d897-4d8b-9682-a2717a0831ba';

-- ------------------------------------------------------------------------
-- ethereum-y-contratos-inteligentes / lo-que-te-vas-a-encontrar
-- ------------------------------------------------------------------------

-- orden 1: la correcta pasa de B a C
UPDATE public.quiz_questions
   SET options = '["Porque la red penaliza a las cuentas que reintentan demasiadas veces seguidas","Porque hay que esperar a que la primera operación caduque y se descarte sola","Porque las operaciones de una misma cuenta van numeradas y en orden estricto","Porque el contrato bloquea la cuenta mientras hay una operación pendiente"]'::jsonb,
       correct_answer = 2
 WHERE id = 'd2c471bb-2693-46bb-ae47-f4e08ae63b19';

-- orden 2: la correcta pasa de C a D
UPDATE public.quiz_questions
   SET options = '["La aplicación calculó mal la comisión y te descontó la diferencia de lo que recibías","Parte de lo recibido se queda retenido hasta que la operación acumule otra confirmación","El contrato aplicó una comisión adicional que no estaba anunciada en la pantalla","Mientras esperaba era pública, y quien construye el bloque puso otra operación antes"]'::jsonb,
       correct_answer = 3
 WHERE id = '77ed53c2-016b-4471-8f19-a7dad74732ce';

-- orden 3: la correcta pasa de D a A
UPDATE public.quiz_questions
   SET options = '["Que no caduca, suele pedirse sin tope, y sigue viva aunque el contrato cambie después","Que se puede revocar sin ningún coste desde la propia aplicación que la pidió","Que caduca automáticamente en cuanto cierras la sesión en la web que la pidió","Que solo permite mover la cantidad exacta que pactaste al concederla"]'::jsonb,
       correct_answer = 0
 WHERE id = 'ee04c0de-8962-4452-871a-0afcd6e3ca5f';

-- orden 4: la correcta pasa de B a B
UPDATE public.quiz_questions
   SET options = '["Que es inofensiva, porque no llega a modificar el estado del registro en ningún momento","Que puede autorizar que otro mueva tus fondos después, y el coste lo pagará quien la use","Que solo puede servir para demostrar ante quien la pide que controlas esa cuenta","Que caducará al cabo de unos minutos si nadie llega a utilizarla para nada"]'::jsonb,
       correct_answer = 1
 WHERE id = 'ea5e02d4-182c-4610-b2cc-73ec687deab5';

-- orden 5: la correcta pasa de C a C
UPDATE public.quiz_questions
   SET options = '["Un depósito con una garantía equivalente a la de una cuenta bancaria, respaldada por el emisor y su banco","Un derecho de canje frente al emisor, ejecutable en cualquier momento y por cualquier cantidad que tengas","La promesa de una empresa que el registro no puede comprobar, y el precio de mercado en vez del canje","Una unidad cuyo respaldo garantiza el propio protocolo de la red en la que se emite y se mueve"]'::jsonb,
       correct_answer = 2
 WHERE id = 'ed8d8aaf-45ac-4929-a348-a71f9e6f459d';

-- orden 6: la correcta pasa de C a D
UPDATE public.quiz_questions
   SET options = '["Porque hace falta identificarse ante el emisor antes de poder recibirlas o enviarlas","Porque solo pueden moverse durante el horario en el que el emisor está operativo","Porque su valor cambia dependiendo de la red en la que se emitan y se utilicen","Porque su contrato suele poder impedir que una dirección las mueva, e incluso anularlas"]'::jsonb,
       correct_answer = 3
 WHERE id = '02d67e48-c4ef-4d1a-b859-b00046c73422';

-- orden 7: la correcta pasa de A a A
UPDATE public.quiz_questions
   SET options = '["Porque el respaldo era la voluntad de otros de seguir participando, que es lo que desaparece","Porque los contratos que lo implementaban compartían un fallo que acabó explotándose","Porque los reguladores intervinieron en el momento crítico y bloquearon el mecanismo","Porque el oráculo del que dependían dejaba de actualizar el precio en el peor momento"]'::jsonb,
       correct_answer = 0
 WHERE id = '45ad0af0-2b5a-4804-988f-0390f97bae57';

-- orden 8: la correcta pasa de C a B
UPDATE public.quiz_questions
   SET options = '["Buscar la respuesta preguntando en los canales oficiales de la comunidad del proyecto","Tratarla como respuesta: describe un sistema del que no sabes algo que sí se puede saber","Descartar esa pregunta y decidir con lo que digan las respuestas de las otras cinco","Suponer la opción más probable a partir de lo que digan las respuestas restantes"]'::jsonb,
       correct_answer = 1
 WHERE id = '52f923d1-62b0-4421-8a1e-e5a4a20e9cb9';

-- orden 9: la correcta pasa de D a C
UPDATE public.quiz_questions
   SET options = '["Saber quién puede cambiar un contrato, con cuántas firmas hacen falta y con cuánta demora","Saber si el código que puedes leer es el que se ejecuta y si alguien lo ha revisado","Saber si algo va a funcionar, detectar un fallo en el código y protegerte del riesgo no técnico","Saber de qué dato de fuera depende un contrato y quién es exactamente el que lo escribe"]'::jsonb,
       correct_answer = 2
 WHERE id = 'c5af9519-eb6a-42cd-92f6-f30f3e1d2ff3';

-- ------------------------------------------------------------------------
-- fundamentos-blockchain / lo-que-comparten-todas
-- ------------------------------------------------------------------------

-- orden 1: la correcta pasa de B a D
UPDATE public.quiz_questions
   SET options = '["Crear una moneda que no controle ningún gobierno","Cifrar la información para que nadie pueda leerla","Hacer que las transferencias sean instantáneas y gratuitas","Que participantes que no se conocen ni se fían coincidan en un orden de los hechos sin que nadie mande"]'::jsonb,
       correct_answer = 3
 WHERE id = '935620cf-7173-4efc-9387-30a8d2e00595';

-- orden 2: la correcta pasa de D a A
UPDATE public.quiz_questions
   SET options = '["La regla para elegir entre dos versiones del registro","Un registro replicado entre muchos participantes","Encadenar cada anotación con la huella de la anterior","Las firmas digitales para autorizar movimientos"]'::jsonb,
       correct_answer = 0
 WHERE id = '0d10af2f-663a-4f5d-98db-a343c793825b';

-- orden 3: la correcta pasa de B a B
UPDATE public.quiz_questions
   SET options = '["Que el registro esté replicado en muchas copias","Que escribir en el registro cueste energía","Que cada anotación incluya la huella de la anterior","Que las firmas autoricen los movimientos"]'::jsonb,
       correct_answer = 1
 WHERE id = '1914818f-ded3-45f5-942a-68dd5c2f8a29';

-- orden 4: la correcta pasa de B a C
UPDATE public.quiz_questions
   SET options = '["Entre velocidad y coste","Entre privacidad y transparencia","Entre responder siempre y coincidir siempre","Entre seguridad y facilidad de uso"]'::jsonb,
       correct_answer = 2
 WHERE id = 'f48ac80c-5e7f-4db8-84bd-2a33672075a8';

-- orden 5: la correcta pasa de B a D
UPDATE public.quiz_questions
   SET options = '["Porque los participantes no hablan el mismo idioma técnico","Porque votar sería demasiado lento","Porque la mayoría de los participantes no querría votar","Porque crear identidades nuevas no cuesta nada, así que no se pueden contar"]'::jsonb,
       correct_answer = 3
 WHERE id = 'd27251af-0a85-4e6f-9a4b-424624590745';

-- orden 6: la correcta pasa de B a A
UPDATE public.quiz_questions
   SET options = '["Tan costosa de deshacer que nadie va a pagarlo, pero no imposible","Matemáticamente irreversible","Reversible solo por los mineros","Definitiva porque la han firmado seis validadores"]'::jsonb,
       correct_answer = 0
 WHERE id = '69d615f6-cbc5-4795-89ea-efb74a27223b';

-- orden 7: la correcta pasa de B a B
UPDATE public.quiz_questions
   SET options = '["Que una es más segura que la otra","Que con movimientos el saldo es un cálculo, y con estado es una casilla que se modifica","Que el estado solo lo usan las redes con permisos","Que anotar movimientos es más moderno"]'::jsonb,
       correct_answer = 1
 WHERE id = '920268fb-d9d5-4ae0-af60-c0ae047a2a64';

-- orden 8: la correcta pasa de B a C
UPDATE public.quiz_questions
   SET options = '["Que tenga muchos participantes","Que use prueba de participación en vez de energía","Que guarde un estado y acepte programas que lo modifican","Que permita transacciones más rápidas"]'::jsonb,
       correct_answer = 2
 WHERE id = '185426e8-b36d-4d4f-826a-aae34e558e1d';

-- orden 9: la correcta pasa de B a D
UPDATE public.quiz_questions
   SET options = '["Porque las operaciones caducan si esperan demasiado","Porque el orden determina la comisión que se paga","Porque sin orden no se pueden encadenar los bloques","Porque dos operaciones sobre la misma tabla dan resultados distintos según el orden, y quien lo decide tiene ventaja"]'::jsonb,
       correct_answer = 3
 WHERE id = '9388573a-d790-4ab7-8ff9-9999b2831135';

-- ------------------------------------------------------------------------
-- fundamentos-blockchain / donde-se-separan
-- ------------------------------------------------------------------------

-- orden 1: la correcta pasa de B a A
UPDATE public.quiz_questions
   SET options = '["En capital de la propia red, bloqueado como fianza","En energía, igual que en la minería pero con menos consumo","En una cuota mensual al operador de la red","En reputación verificada por una autoridad"]'::jsonb,
       correct_answer = 0
 WHERE id = 'c38349b8-894b-4da8-8725-6ad7d7a5c687';

-- orden 2: la correcta pasa de B a B
UPDATE public.quiz_questions
   SET options = '["Sigue avanzando y lo resuelve más tarde","Se detiene hasta que se pongan de acuerdo","Elige automáticamente la cadena más larga","Reparte las firmas entre los validadores restantes"]'::jsonb,
       correct_answer = 1
 WHERE id = 'e1f747d7-d527-45c9-bc43-d3b8dec0f7e1';

-- orden 3: la correcta pasa de B a C
UPDATE public.quiz_questions
   SET options = '["Que está muy repartida: son miles de participantes independientes","Que es más segura que una con pocos validadores","Poco: muchos pueden estar operados por unas pocas entidades","Que nadie puede reunir suficiente capital para atacarla"]'::jsonb,
       correct_answer = 2
 WHERE id = 'f144841d-b69e-4ea6-9f87-dcbdb36a147d';

-- orden 4: la correcta pasa de B a D
UPDATE public.quiz_questions
   SET options = '["Que los validadores pagan impuestos dos veces","Que no se puede retirar nunca","Que obliga a usar una moneda estable","Que lo que se arriesga es lo mismo que se protege, así que la seguridad depende de su valor"]'::jsonb,
       correct_answer = 3
 WHERE id = '5c02d178-7e35-4abe-bb09-cc73db267775';

-- orden 5: la correcta pasa de B a A
UPDATE public.quiz_questions
   SET options = '["Porque cada copia cuesta más de mantener, así que menos gente puede tener una","Porque los usuarios pierden interés cuando todo va rápido","Porque las redes rápidas cobran por verificar","Porque la velocidad obliga a usar permisos"]'::jsonb,
       correct_answer = 0
 WHERE id = '4bf51ba5-66a9-429a-98ba-fa78e6a4d316';

-- orden 6: la correcta pasa de B a B
UPDATE public.quiz_questions
   SET options = '["Que es un teorema demostrado y conviene aplicarlo siempre","Que es un resumen demasiado limpio: sus términos no están definidos y no es un teorema","Que solo aplica a las redes con prueba de trabajo","Que lo resolvieron las redes de última generación"]'::jsonb,
       correct_answer = 1
 WHERE id = '9da36dab-32e2-4acb-aa4c-f709ce7cb392';

-- orden 7: la correcta pasa de B a C
UPDATE public.quiz_questions
   SET options = '["Cuántos seguidores tiene en redes sociales","Cuántas operaciones por segundo dice soportar","Si ha estado alguna vez detenida","Qué empresas la respaldan"]'::jsonb,
       correct_answer = 2
 WHERE id = '9cb4e3cb-56f9-4d40-a6a3-d38c5ed1d1b9';

-- orden 8: la correcta pasa de B a D
UPDATE public.quiz_questions
   SET options = '["Más resistencia a la censura","Que el registro sea imposible de revertir","Que cualquiera pueda comprobarlo desde fuera","Que se pueda votar, y con ello rapidez, coste bajo y finalidad inmediata"]'::jsonb,
       correct_answer = 3
 WHERE id = 'e1f8af87-40e3-439a-a65d-83d197be65c3';

-- orden 9: la correcta pasa de B a A
UPDATE public.quiz_questions
   SET options = '["Porque no había desconfianza que resolver: las partes ya se fiaban entre sí","Porque la tecnología no estaba madura","Porque los reguladores lo impidieron","Porque faltaban programadores"]'::jsonb,
       correct_answer = 0
 WHERE id = '0964f8c0-2fb8-4953-b3c3-df866abc974f';

-- ------------------------------------------------------------------------
-- fundamentos-blockchain / por-que-hay-tantas
-- ------------------------------------------------------------------------

-- orden 1: la correcta pasa de C a B
UPDATE public.quiz_questions
   SET options = '["Un intercambio técnico distinto","Nada comprobable más allá de emitir unidades nuevas","Un desacuerdo que acaba en partición","Una exigencia regulatoria"]'::jsonb,
       correct_answer = 1
 WHERE id = '9898f411-59a2-4d7c-a034-ee1f9e7a9690';

-- orden 2: la correcta pasa de B a C
UPDATE public.quiz_questions
   SET options = '["Se quedan solo en la red original","Se reparten a la mitad entre ambas","Quien las tuviera antes las tiene en las dos redes","Hay que reclamarlas en un plazo o se pierden"]'::jsonb,
       correct_answer = 2
 WHERE id = '57e9207b-c2ed-4f1b-80a0-0639fc00c426';

-- orden 3: la correcta pasa de B a D
UPDATE public.quiz_questions
   SET options = '["Que ha resuelto el trilema","Que conviene entrar pronto","Que es una red con permisos","Que falta información: las palancas no se mueven todas hacia el mismo lado"]'::jsonb,
       correct_answer = 3
 WHERE id = '24dd3349-c049-4dd2-a136-9630377edc66';

-- orden 4: la correcta pasa de B a A
UPDATE public.quiz_questions
   SET options = '["Que haya gente manteniéndola: desarrollo activo y participantes","La calidad técnica de su diseño","El número de unidades emitidas","El respaldo de una empresa grande"]'::jsonb,
       correct_answer = 0
 WHERE id = '9c898643-b018-4d1b-b58e-f087ad232cd3';

-- orden 5: la correcta pasa de B a B
UPDATE public.quiz_questions
   SET options = '["Aumentar el tamaño de los bloques","Hacer el trabajo fuera y usar la cadena solo para lo imprescindible","Reducir el número de validadores","Cambiar a un consenso con permisos"]'::jsonb,
       correct_answer = 1
 WHERE id = '069f1ece-a38a-4f1e-ac83-aa6d2fc4a85d';

-- orden 6: la correcta pasa de B a C
UPDATE public.quiz_questions
   SET options = '["Que los operadores publiquen su identidad","Que la cadena principal no se detenga nunca","Que haya al menos un participante honesto vigilando y capaz de impugnar","Que el precio de la unidad nativa se mantenga"]'::jsonb,
       correct_answer = 2
 WHERE id = '46ec71e9-9826-44f9-bd4d-7755e452ea4b';

-- orden 7: la correcta pasa de B a D
UPDATE public.quiz_questions
   SET options = '["Las unidades se transfieren de una cadena a la otra","Se destruyen en la primera y se crean de la nada en la segunda","Las dos redes comparten el mismo registro","Se inmovilizan en la primera y se emite un representante en la segunda"]'::jsonb,
       correct_answer = 3
 WHERE id = 'c9eb58d6-18b8-4861-97c0-e697a8377528';

-- orden 8: la correcta pasa de B a A
UPDATE public.quiz_questions
   SET options = '["Porque acumulan valor y no heredan la protección de lo que conectan","Porque su código es siempre de peor calidad","Porque no usan firmas digitales","Porque los reguladores no los supervisan"]'::jsonb,
       correct_answer = 0
 WHERE id = '66a7e798-7a37-499c-b562-6980d31b98ff';

-- orden 9: la correcta pasa de B a B
UPDATE public.quiz_questions
   SET options = '["¿Cuántas entidades distintas escriben los bloques?","¿Para qué hace falta un registro compartido aquí?","¿Cuánto cuesta comprobarlo por tu cuenta?","¿Qué pasa si los participantes no se ponen de acuerdo?"]'::jsonb,
       correct_answer = 1
 WHERE id = '995ab309-b4c9-460a-96b0-3ed0d2e36d3c';

-- ------------------------------------------------------------------------
-- fundamentos-de-bitcoin / el-problema-del-dinero
-- ------------------------------------------------------------------------

-- orden 1: la correcta pasa de B a C
UPDATE public.quiz_questions
   SET options = '["Porque todas ellas son escasas por naturaleza","Porque un gobierno las declaró moneda de curso legal en su momento","Porque el valor lo sostiene la expectativa de que otros lo aceptarán, no el objeto en sí","Porque todas se pueden dividir en partes iguales"]'::jsonb,
       correct_answer = 2
 WHERE id = 'a25abe2f-94ae-4bda-9990-c8b3fda5b870';

-- orden 2: la correcta pasa de C a D
UPDATE public.quiz_questions
   SET options = '["Que el trigo sea perecedero y los zapatos no","Que no exista una forma de medir cuántos zapatos vale un saco de trigo","Que el zapatero pueda negarse a comerciar contigo","Que haga falta encontrar a alguien que tenga zapatos y quiera trigo justo en ese momento"]'::jsonb,
       correct_answer = 3
 WHERE id = '76c8bb02-4505-4e95-8b31-a41b6a92e524';

-- orden 3: la correcta pasa de B a A
UPDATE public.quiz_questions
   SET options = '["Que las tres funciones del dinero no son un todo o nada: algo puede cumplir bien una y mal otra","Que el oro nunca fue realmente dinero","Que la función de reserva de valor es la más importante de las tres","Que solo el dinero digital puede cumplir las tres funciones"]'::jsonb,
       correct_answer = 0
 WHERE id = 'b4bfe873-74f4-4b1d-a667-6bec8475cad4';

-- orden 4: la correcta pasa de D a B
UPDATE public.quiz_questions
   SET options = '["Porque los bancos la ocultan deliberadamente en los extractos","Porque nadie cobra nada explícitamente: el saldo no baja, baja lo que se puede comprar con él","Porque solo afecta a quien tiene deudas, y esos no reciben extractos","Porque es ilegal informar de ella a los clientes"]'::jsonb,
       correct_answer = 1
 WHERE id = '2bb0f5d5-7f6b-49e5-877a-a2023cae72e0';

-- orden 5: la correcta pasa de A a C
UPDATE public.quiz_questions
   SET options = '["Que el dinero de tu cuenta está asegurado sin límite","Que las transferencias tardan más de lo necesario","Que puede igualmente bloquear tu cuenta o un pago que querías hacer","Que el banco asume las pérdidas de cualquier error que cometas"]'::jsonb,
       correct_answer = 2
 WHERE id = '4c5853c4-c789-4fa8-9906-3da6dd6c13ae';

-- orden 6: la correcta pasa de C a D
UPDATE public.quiz_questions
   SET options = '["Que cualquier alternativa sin intermediarios será mejor","Que el sistema está a punto de colapsar","Que los bancos centrales actúan de mala fe","Que esos costes existen y conviene entenderlos; no que exista algo mejor"]'::jsonb,
       correct_answer = 3
 WHERE id = '0689b9ad-1d23-42ad-be31-8759328ae2c9';

-- orden 7: la correcta pasa de B a A
UPDATE public.quiz_questions
   SET options = '["Era una empresa: todo pasaba por sus servidores, y al cerrar la empresa cerró el sistema","Su criptografía resultó estar rota","No conseguía evitar que se falsificaran sus monedas","Llegó demasiado pronto y nadie tenía conexión a internet"]'::jsonb,
       correct_answer = 0
 WHERE id = '72f8c5ce-9030-48ba-b648-fb2520ec13ba';

-- orden 8: la correcta pasa de D a B
UPDATE public.quiz_questions
   SET options = '["El registro compartido entre todos los participantes","La prueba de trabajo: un cálculo costoso de hacer y fácil de comprobar","Las firmas digitales que demuestran la propiedad","La idea de un límite máximo de unidades emitidas"]'::jsonb,
       correct_answer = 1
 WHERE id = 'beb1e4f6-cb87-459b-9071-07d42122ba4c';

-- orden 9: la correcta pasa de A a C
UPDATE public.quiz_questions
   SET options = '["Que las comisiones se cobraban dos veces por transacción","Que había que pagar por emitir y otra vez por transferir","Que un archivo digital se copia sin coste, así que el mismo dinero podía enviarse a dos personas","Que dos sistemas distintos emitían la misma moneda"]'::jsonb,
       correct_answer = 2
 WHERE id = '94d1bdd9-1fdf-4792-bf63-6df2e38320dd';

-- ------------------------------------------------------------------------
-- fundamentos-de-bitcoin / el-nacimiento-de-bitcoin
-- ------------------------------------------------------------------------

-- orden 1: la correcta pasa de B a D
UPDATE public.quiz_questions
   SET options = '["Porque su código aún no está terminado","Porque lo gestiona una fundación sin ánimo de lucro","Porque todavía no ha sido registrado como marca","Porque son reglas públicas que cualquiera puede implementar y ejecutar, sin que nadie autorice nada"]'::jsonb,
       correct_answer = 3
 WHERE id = '6637b058-1cd9-45fe-b91d-6f4af518c8ad';

-- orden 2: la correcta pasa de C a A
UPDATE public.quiz_questions
   SET options = '["Que la confianza no desaparece, se mueve: a la criptografía, al programa que ejecutas y a que la mayoría no quiera romperlo","Nada: es exacta tal como está","Que en realidad sí hay una entidad central, aunque poco conocida","Que solo es cierta para quien ejecuta su propio nodo"]'::jsonb,
       correct_answer = 0
 WHERE id = '9ca91a8a-bae9-4b17-afcb-116de3a06409';

-- orden 3: la correcta pasa de B a B
UPDATE public.quiz_questions
   SET options = '["Que su uso es mayoritariamente ilícito","Que la resistencia a la censura vale en las dos direcciones: no se puede excluir a nadie, ni siquiera a quien te parezca mal","Que se pueden bloquear transacciones concretas si hay consenso","Que los reguladores no pueden hacer nada en ningún punto del recorrido"]'::jsonb,
       correct_answer = 1
 WHERE id = '350cb950-b0f4-4682-a21a-0fa59155e46e';

-- orden 4: la correcta pasa de C a C
UPDATE public.quiz_questions
   SET options = '["Sale de un cálculo sobre la población mundial prevista","Es el máximo que permite la criptografía utilizada","Nada en sí misma: lo relevante es que se conoce de antemano y no depende de nadie","Coincide con la cantidad de oro extraíble que queda"]'::jsonb,
       correct_answer = 2
 WHERE id = '070116f6-48db-4a1c-8d31-adde5a4bf5b6';

-- orden 5: la correcta pasa de B a D
UPDATE public.quiz_questions
   SET options = '["Se revisa el límite total de emisión","Se ajusta la dificultad de la prueba de trabajo","Se renuevan las claves de todos los participantes","La cantidad de bitcoins emitida por bloque se divide entre dos"]'::jsonb,
       correct_answer = 3
 WHERE id = '9958bb36-b35d-4e5e-863d-21804fb58068';

-- orden 6: la correcta pasa de C a A
UPDATE public.quiz_questions
   SET options = '["El resto rechaza sus bloques: se queda solo con un sistema que nadie usa","La red se divide permanentemente en dos mitades iguales","El cambio se aplica si reúne más capacidad de cómputo que el resto","El protocolo impide técnicamente modificar ese número"]'::jsonb,
       correct_answer = 0
 WHERE id = '79646625-e7f9-42b7-89fd-bc4da97db69a';

-- orden 7: la correcta pasa de C a B
UPDATE public.quiz_questions
   SET options = '["La censura financiera en todo el recorrido, de principio a fin","La dependencia de un intermediario para custodiar y mover valor","La pérdida de poder adquisitivo de los ahorros","La desigualdad en el acceso al crédito"]'::jsonb,
       correct_answer = 1
 WHERE id = '55716845-17ab-488d-8bb2-6460931bfc86';

-- orden 8: la correcta pasa de B a C
UPDATE public.quiz_questions
   SET options = '["Porque las direcciones son más largas y difíciles de leer","Porque el protocolo no valida el formato de las direcciones","Porque al no haber intermediario tampoco hay quien corrija un envío equivocado o una clave perdida","Porque las transacciones pueden tardar horas en confirmarse"]'::jsonb,
       correct_answer = 2
 WHERE id = '249b4633-7f25-4c0c-9606-cd992abfcdcd';

-- orden 9: la correcta pasa de B a D
UPDATE public.quiz_questions
   SET options = '["¿Lo dice alguien con experiencia en el sector?","¿Cuánta gente lo está usando ya para eso?","¿Está recogido en el documento original de 2008?","¿Es una propiedad del protocolo o de cómo lo usa la gente?"]'::jsonb,
       correct_answer = 3
 WHERE id = '628ddfbc-fad0-4b43-871f-5032c1832c25';

-- ------------------------------------------------------------------------
-- fundamentos-de-bitcoin / bitcoin-como-sistema-monetario
-- ------------------------------------------------------------------------

-- orden 1: la correcta pasa de B a A
UPDATE public.quiz_questions
   SET options = '["Medio de intercambio, parcialmente: funciona donde las alternativas fallan y pierde donde son cómodas","Unidad de cuenta, porque el sector expresa todo en bitcoin","Las tres por igual, desde su creación","Ninguna: no cumple ninguna de las tres en ningún grado"]'::jsonb,
       correct_answer = 0
 WHERE id = '30509276-0eea-49e0-953b-8ec4bb7769e2';

-- orden 2: la correcta pasa de C a B
UPDATE public.quiz_questions
   SET options = '["En que la emisión no es realmente predecible","En que mezcla dos preguntas independientes: protegerse de la emisión arbitraria no es lo mismo que conservar poder de compra","En nada: la conclusión se sigue de la premisa","En que el poder de compra solo se mide frente al oro"]'::jsonb,
       correct_answer = 1
 WHERE id = 'e6072f9b-6f98-49db-a0ea-6f2a52c4d39a';

-- orden 3: la correcta pasa de C a C
UPDATE public.quiz_questions
   SET options = '["Todas exigen modificar el protocolo","Todas dependen de decisiones de reguladores","Todas apuntan a más uso y más tiempo, y ninguna depende del protocolo","Todas requieren elevar el límite de 21 millones"]'::jsonb,
       correct_answer = 2
 WHERE id = '15cd70f9-f264-4de1-8e85-e22b5d624c1b';

-- orden 4: la correcta pasa de C a D
UPDATE public.quiz_questions
   SET options = '["Como una ventaja clara del sistema actual","Como una ventaja clara de Bitcoin, que evita abusos","Como un defecto que se corregirá en futuras versiones del protocolo","Como dos caras de la misma decisión: la capacidad de intervenir y la de equivocarse interviniendo son inseparables"]'::jsonb,
       correct_answer = 3
 WHERE id = '6c7769cd-1a5c-40f6-b7f6-63ab4429da0d';

-- orden 5: la correcta pasa de B a A
UPDATE public.quiz_questions
   SET options = '["Porque casi nadie usa una sola forma de dinero, y los puntos fuertes de cada uno están en usos distintos","Porque el resultado ya está decidido a favor del sistema actual","Porque los dos sistemas son técnicamente idénticos","Porque la respuesta depende únicamente de la regulación"]'::jsonb,
       correct_answer = 0
 WHERE id = 'd11cc8af-5bb7-4f25-913d-e936b06a3e85';

-- orden 6: la correcta pasa de D a B
UPDATE public.quiz_questions
   SET options = '["Mover valor a distancia","Impedir que te engañen, y corregir quién empieza con más","Llevar la cuenta de quién tiene qué","Permitir que existan ahorros"]'::jsonb,
       correct_answer = 1
 WHERE id = '6041c578-226b-4b8e-937d-aae013f42a06';

-- orden 7: la correcta pasa de B a C
UPDATE public.quiz_questions
   SET options = '["Un dato verificable en la cadena de bloques","Una regla del protocolo","Una hipótesis razonable, que solo se puede comprobar si ocurre","Una falsedad demostrada"]'::jsonb,
       correct_answer = 2
 WHERE id = '2378d0f9-9a8a-43bc-a7b4-666bdcbca4b3';

-- orden 8: la correcta pasa de B a D
UPDATE public.quiz_questions
   SET options = '["Porque los programas actuales no están optimizados","Porque el límite lo impone la velocidad de internet","Porque aumentaría demasiado el consumo energético","Porque hacerlo exigiría equipos más potentes para verificar, y eso dejaría la verificación en menos manos"]'::jsonb,
       correct_answer = 3
 WHERE id = 'b57ac92b-b16b-4fd7-b490-04b69da75615';

-- orden 9: la correcta pasa de A a A
UPDATE public.quiz_questions
   SET options = '["Cuánta electricidad consume la red","Si las comisiones bastarán cuando se agote la emisión","Si seguirá existiendo dentro de treinta años","Si la adopción crecerá en los próximos años"]'::jsonb,
       correct_answer = 0
 WHERE id = '2e0481ad-330c-4fad-8ab7-da4394295d29';

-- ------------------------------------------------------------------------
-- introduccion-a-web3 / de-donde-viene-la-idea
-- ------------------------------------------------------------------------

-- orden 1: la correcta pasa de B a B
UPDATE public.quiz_questions
   SET options = '["Porque las empresas se coordinaron para repartirse el mercado","Porque resolvía un problema real: que millones de personas pudieran interactuar sin que nada fallara","Porque la tecnología descentralizada no existía todavía","Porque los usuarios pidieron ceder el control de sus datos"]'::jsonb,
       correct_answer = 1
 WHERE id = '11a582cb-5e1c-41ff-aefc-548a7912c914';

-- orden 2: la correcta pasa de C a C
UPDATE public.quiz_questions
   SET options = '["Que guarde copias de seguridad","Que filtre el contenido abusivo","Que confirme al instante, porque decide una sola entidad","Que te devuelva el acceso si pierdes la contraseña"]'::jsonb,
       correct_answer = 2
 WHERE id = '23b50037-e4f7-461f-b205-df7b807f1cd2';

-- orden 3: la correcta pasa de C a D
UPDATE public.quiz_questions
   SET options = '["Que es un secreto que las empresas ocultan deliberadamente","Que es ilegal en la mayoría de los países","Que solo afecta a quienes usan redes sociales","Que es un precio que no se ve y no se puede comparar con ninguna alternativa"]'::jsonb,
       correct_answer = 3
 WHERE id = '3fc7256b-e835-438a-bc05-713d6d96d4d9';

-- orden 4: la correcta pasa de A a A
UPDATE public.quiz_questions
   SET options = '["Basta con que quien decide sea otro: una decisión automática, un error o una norma nueva","Que la empresa actúe de mala fe deliberadamente","Que incumplas la ley del país donde vives","Que dejes de usar el servicio durante mucho tiempo"]'::jsonb,
       correct_answer = 0
 WHERE id = 'e10e2b5d-7550-4422-be0a-339d68022f72';

-- orden 5: la correcta pasa de B a B
UPDATE public.quiz_questions
   SET options = '["El navegador, el servidor y el protocolo","La cuenta pasa a clave, el servidor a registro compartido y el contrato a código que se ejecuta solo","El dinero, el banco y la ley","La identidad, la privacidad y la seguridad"]'::jsonb,
       correct_answer = 1
 WHERE id = 'f19b2976-3e02-41fd-ae4e-8ce450c1cde9';

-- orden 6: la correcta pasa de C a C
UPDATE public.quiz_questions
   SET options = '["Que sus ventajas son difíciles de demostrar","Que la mayoría de los proyectos fracasan","Que no añade capacidades al usuario: retira la capacidad de un tercero de intervenir","Que solo sirve para evitar impuestos"]'::jsonb,
       correct_answer = 2
 WHERE id = 'deb5ad8a-7a17-4a33-8571-7217416a1bc3';

-- orden 7: la correcta pasa de B a D
UPDATE public.quiz_questions
   SET options = '["Sí, se resolverán cuando la tecnología madure","Sí, ya están resueltos en las redes modernas","No, porque en realidad no existen esos costes","No: son la otra cara de lo que se gana al quitar a la entidad que decidía"]'::jsonb,
       correct_answer = 3
 WHERE id = 'af4851d9-b2e1-4a7a-8f21-b6bfe3a24c79';

-- orden 8: la correcta pasa de D a A
UPDATE public.quiz_questions
   SET options = '["Que puedas llegar al sistema sin pedir permiso a nadie","Que haya bastantes participantes independientes","Que el código no tenga llaves de administración ocultas","Que tú custodies la clave"]'::jsonb,
       correct_answer = 0
 WHERE id = '1e08f2bc-9ec1-4c65-9772-b83bf3f90759';

-- orden 9: la correcta pasa de B a B
UPDATE public.quiz_questions
   SET options = '["La forma más justa de gobernanza descentralizada","Otro mecanismo de concentración, no su ausencia","Una garantía de que las decisiones son técnicas y no políticas","Un sistema equivalente a una persona, un voto"]'::jsonb,
       correct_answer = 1
 WHERE id = 'd49ce88a-09b9-437b-a3ce-5a4ef88e6960';

-- ------------------------------------------------------------------------
-- introduccion-a-web3 / las-piezas-de-web3
-- ------------------------------------------------------------------------

-- orden 1: la correcta pasa de B a C
UPDATE public.quiz_questions
   SET options = '["Que la clave es más larga y difícil de adivinar","Que la clave se puede recuperar desde el correo","Que la clave no la emite nadie: existe por sí misma y nadie puede revocarla","Que la cuenta es gratuita y la clave se compra"]'::jsonb,
       correct_answer = 2
 WHERE id = '2686b9e6-6d76-4def-bb21-91b4d32a2170';

-- orden 2: la correcta pasa de C a D
UPDATE public.quiz_questions
   SET options = '["Para demostrar que eres el mismo que la vez anterior","Para demostrar que tienes algo concreto","Para participar sin dar tus datos personales","Para abrir una cuenta regulada o demostrar tu edad"]'::jsonb,
       correct_answer = 3
 WHERE id = 'cdc1d95e-4178-4b27-935a-b0f4514aaa75';

-- orden 3: la correcta pasa de B a A
UPDATE public.quiz_questions
   SET options = '["Queda expuesto el historial entero, hacia atrás y hacia delante","Solo queda expuesto lo que hagas a partir de ese momento","No pasa nada: las direcciones no llevan nombre","Puedes borrar el historial asociado a esa dirección"]'::jsonb,
       correct_answer = 0
 WHERE id = '5b3a7903-dfe8-4d99-b3d4-85774afd50cb';

-- orden 4: la correcta pasa de B a B
UPDATE public.quiz_questions
   SET options = '["Porque lo escribe una persona y no una máquina","Porque no interpreta nada y no hay a quién acudir si hay discrepancia","Porque todavía es una tecnología experimental","Porque necesita que alguien lo ejecute manualmente"]'::jsonb,
       correct_answer = 1
 WHERE id = '175c0aad-824f-40f7-a4dd-7a4c0bc2c9d8';

-- orden 5: la correcta pasa de C a C
UPDATE public.quiz_questions
   SET options = '["¿Es inmutable?","¿Cuánto lleva funcionando?","¿Quién puede cambiarlo, y qué hace falta para que lo cambie?","¿Cuántas personas lo usan?"]'::jsonb,
       correct_answer = 2
 WHERE id = '0cefbb95-673f-4ac7-bd14-15d2d7e1c790';

-- orden 6: la correcta pasa de B a D
UPDATE public.quiz_questions
   SET options = '["Permiso para una operación concreta, esta vez","Permiso para que la aplicación lea tu historial","Permiso para iniciar sesión, sin más consecuencias","Permiso para que un contrato mueva tus fondos cuando quiera, normalmente sin límite y sin caducidad"]'::jsonb,
       correct_answer = 3
 WHERE id = '943fa1cc-8f34-478e-b219-3ac32281dd32';

-- orden 7: la correcta pasa de B a A
UPDATE public.quiz_questions
   SET options = '["En alterar la web, o copiarla, para que proponga una firma distinta","En adivinar la clave privada del usuario","En modificar el registro compartido","En saturar la red para que las operaciones fallen"]'::jsonb,
       correct_answer = 0
 WHERE id = '2b7bcf4b-b4e8-4388-8cc4-272a02237115';

-- orden 8: la correcta pasa de B a B
UPDATE public.quiz_questions
   SET options = '["Un archivo cifrado que guardas en tu dispositivo","Una fila en la tabla de un contrato: una dirección y una cantidad","Una moneda digital emitida por un banco central","Un certificado de propiedad reconocido legalmente"]'::jsonb,
       correct_answer = 1
 WHERE id = 'bf1b278b-7cb1-4252-a6c9-d35331d16dc5';

-- orden 9: la correcta pasa de C a C
UPDATE public.quiz_questions
   SET options = '["La propiedad intelectual de la ilustración","El archivo original, guardado en el registro compartido","La anotación de que una unidad concreta está a tu nombre","La exclusividad: nadie más puede tener esa imagen"]'::jsonb,
       correct_answer = 2
 WHERE id = '859ec393-972a-4372-95b3-bdfa5126dae0';

-- ------------------------------------------------------------------------
-- introduccion-a-web3 / criterio-para-evaluar-web3
-- ------------------------------------------------------------------------

-- orden 1: la correcta pasa de B a D
UPDATE public.quiz_questions
   SET options = '["¿Cuántos usuarios tiene el proyecto?","¿Está el código publicado?","¿Cuánto cuesta cada operación?","¿Hay alguien con motivo y capacidad para cambiar el registro en su favor, a quien no se pueda obligar?"]'::jsonb,
       correct_answer = 3
 WHERE id = 'bd8d8596-f984-4d05-bda1-32c9417b6819';

-- orden 2: la correcta pasa de B a A
UPDATE public.quiz_questions
   SET options = '["Porque repartían el registro entre partes que ya se fiaban entre sí: toda la complejidad sin las razones","Porque la tecnología era demasiado lenta para ese uso","Porque los reguladores los prohibieron","Porque faltaban programadores especializados"]'::jsonb,
       correct_answer = 0
 WHERE id = 'da0373e3-f3f5-4128-bca1-c0cc01e96db3';

-- orden 3: la correcta pasa de B a B
UPDATE public.quiz_questions
   SET options = '["En la capacidad del registro para almacenar tantos datos","En quien introduce el dato: el registro protege lo tecleado, no su veracidad","En la velocidad de confirmación de las operaciones","En el coste de cada anotación"]'::jsonb,
       correct_answer = 1
 WHERE id = '8e4303a0-3c55-402c-a795-f2ff6bad39d4';

-- orden 4: la correcta pasa de C a C
UPDATE public.quiz_questions
   SET options = '["Que existen los euros que respaldan cada token","Que un auditor ha verificado las reservas","Que tienes el recibo, no que haya euros detrás","Que podrás canjearlo en cualquier momento"]'::jsonb,
       correct_answer = 2
 WHERE id = '256a1c11-4d7d-4046-bae6-fe2cd49476f2';

-- orden 5: la correcta pasa de A a D
UPDATE public.quiz_questions
   SET options = '["Cuántos seguidores tiene en redes sociales","Si el precio ha subido en los últimos meses","Si aparece en medios especializados","Quién puede cambiar las reglas de los contratos"]'::jsonb,
       correct_answer = 3
 WHERE id = '18040be8-e0da-49e6-93c0-9788936875d5';

-- orden 6: la correcta pasa de B a A
UPDATE public.quiz_questions
   SET options = '["Ninguna por sí sola; importa combinado con quién controla las reglas y quién custodia los fondos","Que es una estafa: los proyectos serios dan la cara","Que es más seguro, porque no pueden ser presionados","Que no se puede evaluar el proyecto de ninguna forma"]'::jsonb,
       correct_answer = 0
 WHERE id = 'a96f3ae3-cd48-4a3a-8639-9ef167dddbc0';

-- orden 7: la correcta pasa de B a B
UPDATE public.quiz_questions
   SET options = '["Que la comunidad está saturada de preguntas repetidas","Que ya tienes la respuesta: un proyecto sólido agradece las preguntas técnicas","Que conviene preguntar en privado a un administrador","Nada: es normal en comunidades grandes"]'::jsonb,
       correct_answer = 1
 WHERE id = '5db5762c-f19a-4e98-a390-cdbcbed76f34';

-- orden 8: la correcta pasa de C a C
UPDATE public.quiz_questions
   SET options = '["Si el proyecto va a tener éxito","Si conviene participar o no","De qué depende: qué y quién tendría que fallar para que salga mal","Cuánto puede subir o bajar su valor"]'::jsonb,
       correct_answer = 2
 WHERE id = '1ca8845d-1e7d-44b5-ab6c-8c66fcc3f882';

-- orden 9: la correcta pasa de C a D
UPDATE public.quiz_questions
   SET options = '["Los fallos de programación de los contratos","La caída de la web por la que entras","La concentración de la gobernanza","El ataque contra el juicio: quien se gana tu confianza despacio"]'::jsonb,
       correct_answer = 3
 WHERE id = '09391778-ca60-4385-9382-d769ac9d85a7';

-- ------------------------------------------------------------------------
-- introduccion-al-trading-de-criptomonedas / que-es-exactamente-el-trading
-- ------------------------------------------------------------------------

-- orden 1: la correcta pasa de B a A
UPDATE public.quiz_questions
   SET options = '["Responde a qué es el trading y por qué casi nadie gana, pero no enseña a operar","Enseña una estrategia sencilla para principiantes","Enseña a operar con poco riesgo","Compara plataformas para elegir la mejor"]'::jsonb,
       correct_answer = 0
 WHERE id = 'db44ea6c-84b1-4817-ae7c-3de516b5d1c2';

-- orden 2: la correcta pasa de B a B
UPDATE public.quiz_questions
   SET options = '["Que se hace con criptomonedas y no con acciones","Que busca el movimiento del precio en plazos cortos","Que se hace con dinero prestado","Que requiere análisis de gráficos"]'::jsonb,
       correct_answer = 1
 WHERE id = 'a7bb480d-98ea-48aa-9d67-835120823751';

-- orden 3: la correcta pasa de B a C
UPDATE public.quiz_questions
   SET options = '["Son lo mismo: si aciertas es que decidiste bien","Decidir bien garantiza acertar a largo plazo","Son cosas distintas, y con pocas operaciones no se pueden separar","Acertar depende solo de la formación"]'::jsonb,
       correct_answer = 2
 WHERE id = '8314ab99-1f33-49b6-9db2-ec0e8edc34f3';

-- orden 4: la correcta pasa de C a D
UPDATE public.quiz_questions
   SET options = '["Que mantener es lo más sensato para la mayoría","Que operar es la más rentable si hay formación","Que usar es la única sin riesgo","Que no dice cuál conviene: depende de cada persona"]'::jsonb,
       correct_answer = 3
 WHERE id = 'f7e63e4b-e99d-4ed6-a9dc-feba9a218a80';

-- orden 5: la correcta pasa de C a A
UPDATE public.quiz_questions
   SET options = '["Que no se puede afirmar que funcione: solo se puede describir lo que exige","Que históricamente ha funcionado, así que es la opción prudente","Que el tiempo juega a favor de quien espera","Que es preferible a operar en todos los casos"]'::jsonb,
       correct_answer = 0
 WHERE id = '445f0161-d4b1-4441-a616-d3e2aaecaab7';

-- orden 6: la correcta pasa de B a B
UPDATE public.quiz_questions
   SET options = '["Del crecimiento del mercado en su conjunto","Del bolsillo de otro participante","De las comisiones que cobran las plataformas","De la emisión de nuevas unidades"]'::jsonb,
       correct_answer = 1
 WHERE id = '1b3fa9ae-f619-4e61-b1f1-b9b9e4a05418';

-- orden 7: la correcta pasa de C a C
UPDATE public.quiz_questions
   SET options = '["Positiva, porque el mercado crece con el tiempo","Cero exacto","Menor que cero, porque los costes salen de los participantes","Depende de la dirección del precio"]'::jsonb,
       correct_answer = 2
 WHERE id = 'cc4a2047-2109-45ac-a81d-57d66a838f3b';

-- orden 8: la correcta pasa de B a D
UPDATE public.quiz_questions
   SET options = '["Otros particulares en tu misma situación","La propia plataforma, que apuesta contra ti","Nadie: las órdenes las casa un algoritmo neutral","Participantes profesionales con sistemas automáticos y costes más bajos"]'::jsonb,
       correct_answer = 3
 WHERE id = '9c0f4db5-b38b-4dfa-8c0c-8f8354275e1b';

-- orden 9: la correcta pasa de C a A
UPDATE public.quiz_questions
   SET options = '["Por aritmética: el dinero sale de otro participante y hay costes por el camino","Porque la mayoría no se forma lo suficiente","Porque el mercado está manipulado","Porque las plataformas lo impiden"]'::jsonb,
       correct_answer = 0
 WHERE id = 'b082dde6-0610-4315-bf86-c650c5c435f9';

-- ------------------------------------------------------------------------
-- introduccion-al-trading-de-criptomonedas / por-que-casi-nadie-gana
-- ------------------------------------------------------------------------

-- orden 1: la correcta pasa de B a B
UPDATE public.quiz_questions
   SET options = '["Que sube cuando el mercado se mueve mucho","La frecuencia: se cobra en cada entrada y en cada salida","Que se cobra sobre el beneficio obtenido","Que es distinta en cada plataforma"]'::jsonb,
       correct_answer = 1
 WHERE id = '6d73006a-38bc-41f1-b4e8-0b68d36ccff2';

-- orden 2: la correcta pasa de B a C
UPDATE public.quiz_questions
   SET options = '["La comisión que cobra la plataforma por operar","El impuesto que se aplica a cada operación","La diferencia entre el precio de compra y el de venta, que te hace empezar perdiendo","La variación del precio durante el día"]'::jsonb,
       correct_answer = 2
 WHERE id = '9204914f-4eab-4582-b077-6d71b68cb915';

-- orden 3: la correcta pasa de B a D
UPDATE public.quiz_questions
   SET options = '["Es más seguro porque hay menos movimiento","Igual que uno líquido, solo que con menos volumen","Es mejor para operaciones grandes","Cómodo para entrar y caro para salir, y no se nota hasta que quieres salir"]'::jsonb,
       correct_answer = 3
 WHERE id = '1dd3743a-b84f-4878-b15c-cb7e8664e4e2';

-- orden 4: la correcta pasa de B a A
UPDATE public.quiz_questions
   SET options = '["Más arriba de la mitad, porque cada operación empieza en negativo","En acertar más de la mitad de las operaciones","En acertar una de cada tres, si las ganancias son grandes","Depende solo de la estrategia elegida"]'::jsonb,
       correct_answer = 0
 WHERE id = '74816133-b31c-4e52-8ca4-80bbeb2317b5';

-- orden 5: la correcta pasa de C a B
UPDATE public.quiz_questions
   SET options = '["El porcentaje de operaciones acertadas","Dinero que metiste frente a dinero que sacaste, en un periodo largo","La rentabilidad porcentual del último trimestre","La comparación con el mejor momento de tu cuenta"]'::jsonb,
       correct_answer = 1
 WHERE id = 'cbd50281-90b5-4cb9-ad7b-b5a1751c848f';

-- orden 6: la correcta pasa de B a C
UPDATE public.quiz_questions
   SET options = '["Aumenta la probabilidad de que el precio vaya a tu favor","Reduce las comisiones al operar más volumen","Multiplica el movimiento del precio en los dos sentidos por igual","Protege contra las caídas bruscas"]'::jsonb,
       correct_answer = 2
 WHERE id = 'bb850f4d-27d2-4811-bcc1-f9d767ef9878';

-- orden 7: la correcta pasa de C a D
UPDATE public.quiz_questions
   SET options = '["Un 10 %","Un 5 %","Depende de la plataforma","Un 1 %"]'::jsonb,
       correct_answer = 3
 WHERE id = '773bba2a-373f-46e1-90f9-328a90c25955';

-- orden 8: la correcta pasa de C a A
UPDATE public.quiz_questions
   SET options = '["Un 100 %","Un 50 %","Un 75 %","Un 150 %"]'::jsonb,
       correct_answer = 0
 WHERE id = '8bb19de4-517c-4fe8-a3b1-e5619d7bce5f';

-- orden 9: la correcta pasa de B a B
UPDATE public.quiz_questions
   SET options = '["Porque los mercados suben despacio y caen deprisa","Porque perder pesa más que ganar: se cierra pronto lo bueno y se aguanta lo malo","Porque las comisiones se cobran solo en las operaciones ganadoras","Porque los profesionales manipulan los precios"]'::jsonb,
       correct_answer = 1
 WHERE id = '068e3645-bed9-4124-8eda-32b7205647a5';

-- ------------------------------------------------------------------------
-- introduccion-al-trading-de-criptomonedas / decidir-con-criterio
-- ------------------------------------------------------------------------

-- orden 1: la correcta pasa de B a C
UPDATE public.quiz_questions
   SET options = '["Una rentabilidad media razonable si te formas bien","Que perderás dinero con seguridad","Nada concreto: cualquier cifra sobre tu resultado futuro está inventada","Que ganarás si dedicas suficientes horas"]'::jsonb,
       correct_answer = 2
 WHERE id = '1c564961-f0ad-4557-b2b0-6a414dc84fde';

-- orden 2: la correcta pasa de B a D
UPDATE public.quiz_questions
   SET options = '["Que el 90 % es una cifra verificada por los reguladores","Que no existe ningún dato sobre esto","Que la cifra real es mucho menor","Que los intermediarios europeos de contratos por diferencias publican por obligación cifras del 70 % al 85 %"]'::jsonb,
       correct_answer = 3
 WHERE id = 'fd154077-505f-4703-9c17-f8b36609f6b1';

-- orden 3: la correcta pasa de B a A
UPDATE public.quiz_questions
   SET options = '["Es necesaria pero no suficiente: no cambia de dónde sale el dinero","Es la diferencia entre ganar y perder","No sirve de nada, porque todo es azar","Garantiza resultados a partir del primer año"]'::jsonb,
       correct_answer = 0
 WHERE id = 'e316abe8-b868-43c3-8938-b6666b91745f';

-- orden 4: la correcta pasa de B a B
UPDATE public.quiz_questions
   SET options = '["Porque los ingresos tributan de forma distinta","Porque no es previsible ni regular, y llamarlo así cambia cómo se planifica una vida","Porque los ingresos requieren dedicación completa","Porque solo es ingreso si superas cierta cantidad"]'::jsonb,
       correct_answer = 1
 WHERE id = '1abad249-e18b-46a0-8607-e22e3feaee19';

-- orden 5: la correcta pasa de C a C
UPDATE public.quiz_questions
   SET options = '["Unas semanas con práctica intensiva","Unos meses, si llevas un registro ordenado","Muchas operaciones a lo largo de mucho tiempo, pagando costes mientras tanto","Se sabe desde las primeras operaciones"]'::jsonb,
       correct_answer = 2
 WHERE id = '46eab569-5906-42fd-a6ca-dc33e215679c';

-- orden 6: la correcta pasa de C a D
UPDATE public.quiz_questions
   SET options = '["No: solo cuenta al convertir a euros","No, mientras el dinero no salga de la plataforma","Solo si la cantidad supera cierto límite","Sí: en bastantes países el intercambio ya cuenta como venta"]'::jsonb,
       correct_answer = 3
 WHERE id = '5ed1cfc8-9379-4b30-b333-346401008a9e';

-- orden 7: la correcta pasa de B a A
UPDATE public.quiz_questions
   SET options = '["Porque las ganancias de un periodo pueden tributar sin que las pérdidas posteriores las compensen del todo","No es posible: si pierdes, no hay nada que declarar","Porque se tributa por el volumen operado, no por el resultado","Solo ocurre con productos apalancados"]'::jsonb,
       correct_answer = 0
 WHERE id = '95b55ec0-0e9c-4b6e-8382-c63048ea0361';

-- orden 8: la correcta pasa de B a B
UPDATE public.quiz_questions
   SET options = '["Nada: las plataformas lo conservan indefinidamente","Exportarlo y guardarlo periódicamente, porque reconstruirlo después es mucho peor","Anotar solo las operaciones con beneficio","Esperar a la primera declaración para pedirlo"]'::jsonb,
       correct_answer = 1
 WHERE id = '2f1a3c2e-851b-4d6e-878e-c5df21f0a2ad';

-- orden 9: la correcta pasa de C a C
UPDATE public.quiz_questions
   SET options = '["Que el mercado esté en un momento volátil","Que no tengas todavía una estrategia definida","Que no puedas explicar con tus palabras de dónde saldría tu beneficio","Que la plataforma cobre comisiones altas"]'::jsonb,
       correct_answer = 2
 WHERE id = '5d2709fc-eadc-46f4-b866-4c134ef13557';

-- ------------------------------------------------------------------------
-- nodos-bitcoin-tu-soberania-tecnica / null
-- ------------------------------------------------------------------------

-- orden 1: la correcta pasa de B a D
UPDATE public.quiz_questions
   SET options = '["Un servidor de una empresa que gestiona Bitcoin","Una wallet para guardar bitcoin","Un minero que crea nuevos bloques","Un equipo que ejecuta el software de Bitcoin y verifica transacciones y bloques de forma independiente"]'::jsonb,
       correct_answer = 3
 WHERE id = 'ee356702-22c7-465d-8b64-7bdb599cbc3c';

-- orden 2: la correcta pasa de B a A
UPDATE public.quiz_questions
   SET options = '["En una red peer-to-peer (P2P), directamente entre ellos","A través de un servidor central","Por email","Solo a través de los mineros"]'::jsonb,
       correct_answer = 0
 WHERE id = '5fb63503-6305-463a-a87c-dbe9c170f986';

-- orden 3: la correcta pasa de C a B
UPDATE public.quiz_questions
   SET options = '["Solo los mineros","Los nodos, que verifican que cumple las reglas del protocolo","El creador de Bitcoin","Los exchanges"]'::jsonb,
       correct_answer = 1
 WHERE id = 'd0068965-c88f-4a1d-b5b0-8d3d3f2baecb';

-- orden 4: la correcta pasa de B a C
UPDATE public.quiz_questions
   SET options = '["No confiar en nadie y no usar Bitcoin","No confiar en las criptomonedas","Verificar por ti mismo las transacciones en lugar de depender de terceros","Verificar la identidad de otros usuarios"]'::jsonb,
       correct_answer = 2
 WHERE id = '69437ef6-85cb-4291-8a38-025dac8cc122';

-- orden 5: la correcta pasa de B a D
UPDATE public.quiz_questions
   SET options = '["Tus bitcoin desaparecen","Es ilegal","No puedes enviar transacciones","Dependes del nodo de otra persona para verificar tus transacciones"]'::jsonb,
       correct_answer = 3
 WHERE id = 'dadde06e-42ee-4e8e-aace-e70d8db24c07';

-- orden 6: la correcta pasa de B a A
UPDATE public.quiz_questions
   SET options = '["Porque aumenta la descentralización y la resistencia a la censura","Porque mina más bloques","Porque genera más bitcoin","Porque hace las transacciones más rápidas"]'::jsonb,
       correct_answer = 0
 WHERE id = 'fc2e8c64-f12e-476d-a562-e00f85b6e53f';

-- orden 7: la correcta pasa de B a B
UPDATE public.quiz_questions
   SET options = '["Solo mina nuevos bloques","Descarga y verifica toda la blockchain de forma independiente","Solo guarda tus transacciones personales","Se conecta al servidor central de Bitcoin"]'::jsonb,
       correct_answer = 1
 WHERE id = '8a62affa-98fe-4ef6-ba5a-fca0a5d5d007';

-- orden 8: la correcta pasa de B a C
UPDATE public.quiz_questions
   SET options = '["El pruned node no verifica las transacciones","El full node es más seguro","El pruned node elimina bloques antiguos para ahorrar espacio, pero verifica igual","El pruned node necesita más espacio"]'::jsonb,
       correct_answer = 2
 WHERE id = '201d5790-ee1d-43f7-b776-16434f4eb5a9';

-- orden 9: la correcta pasa de B a D
UPDATE public.quiz_questions
   SET options = '["Solo un mining node","Solo un archival node","Ninguno, basta con un exchange","Un full node o un pruned node"]'::jsonb,
       correct_answer = 3
 WHERE id = '39f8832f-0f4b-461d-b484-44f85fbbb11f';

-- orden 1: la correcta pasa de C a A
UPDATE public.quiz_questions
   SET options = '["Al menos 2 TB","100 GB","500 GB","10 TB"]'::jsonb,
       correct_answer = 0
 WHERE id = 'bef7849b-6a4d-4539-be87-cb426bc27134';

-- orden 2: la correcta pasa de B a B
UPDATE public.quiz_questions
   SET options = '["Son más seguros","Ofrecen una interfaz web fácil de usar y aplicaciones adicionales","Minan bitcoin automáticamente","No necesitan disco duro"]'::jsonb,
       correct_answer = 1
 WHERE id = '75745257-8f46-4407-b6a6-df139999b9d9';

-- orden 3: la correcta pasa de C a C
UPDATE public.quiz_questions
   SET options = '["Que sea el más caro posible","Que uses lo mismo que todos","Que sea un setup que puedas mantener a largo plazo","Que tenga la mayor cantidad de apps"]'::jsonb,
       correct_answer = 2
 WHERE id = '08864b86-dd7c-48f3-a427-525a2789e24d';

-- orden 4: la correcta pasa de B a D
UPDATE public.quiz_questions
   SET options = '["5 minutos","Un mes","Es instantánea","Aproximadamente 2 a 7 días"]'::jsonb,
       correct_answer = 3
 WHERE id = '15f6f5f5-1a57-49d2-97a5-65b6e3e7ba00';

-- orden 5: la correcta pasa de B a A
UPDATE public.quiz_questions
   SET options = '["Descarga y verifica toda la blockchain desde el primer bloque","Mina bitcoin","Crea una wallet automáticamente","Se conecta a un servidor central"]'::jsonb,
       correct_answer = 0
 WHERE id = 'd68bf95b-fb57-438a-9193-056df6ab345b';

-- orden 6: la correcta pasa de B a B
UPDATE public.quiz_questions
   SET options = '["Porque el wifi no funciona con Bitcoin","Porque la conexión por cable es más estable y la sincronización mueve muchos datos","Porque es obligatorio","Porque el wifi consume más bitcoin"]'::jsonb,
       correct_answer = 1
 WHERE id = '670ab95b-3004-4dfd-82fc-fefbd0bb4c36';

-- orden 7: la correcta pasa de C a C
UPDATE public.quiz_questions
   SET options = '["Los pierdes para siempre","Se transfieren a un exchange","Nada, tus bitcoin están protegidos por tu seed phrase, no por tu nodo","Se congelan hasta que repares el nodo"]'::jsonb,
       correct_answer = 2
 WHERE id = 'd0dc8f44-752f-4d5b-ae08-565c8c0f3cf3';

-- orden 8: la correcta pasa de B a D
UPDATE public.quiz_questions
   SET options = '["Para que funcione más rápido","Porque es obligatorio","Para minar más bitcoin","Para que tu IP no revele que ejecutas un nodo Bitcoin"]'::jsonb,
       correct_answer = 3
 WHERE id = 'cd23ba5d-9d66-45cf-9a70-d3e714e4f3a6';

-- orden 9: la correcta pasa de B a A
UPDATE public.quiz_questions
   SET options = '["70-90 GB","1-2 GB","500 GB","No crece"]'::jsonb,
       correct_answer = 0
 WHERE id = '92eea729-b8a5-44f0-b2ae-2352ad9d4360';

-- ------------------------------------------------------------------------
-- seguridad-basica-en-bitcoin-y-criptomonedas / riesgos-reales-en-el-mundo-cripto
-- ------------------------------------------------------------------------

-- orden 1: la correcta pasa de B a B
UPDATE public.quiz_questions
   SET options = '["Confirmar que la red ha recibido tu transacción","Devolverte el acceso si pierdes tus credenciales","Mostrarte el saldo actualizado","Cobrarte comisiones por operar"]'::jsonb,
       correct_answer = 1
 WHERE id = '4bd63487-baaf-492e-a872-eb4ca964e275';

-- orden 2: la correcta pasa de C a C
UPDATE public.quiz_questions
   SET options = '["Minar, validar, firmar y difundir","Comprar, vender, declarar y custodiar","Custodia, recuperación, verificación y detección de engaños","Cifrado, respaldo, auditoría y seguros"]'::jsonb,
       correct_answer = 2
 WHERE id = '2c156828-9cb9-4f03-bc1f-3614257b29cc';

-- orden 3: la correcta pasa de B a D
UPDATE public.quiz_questions
   SET options = '["Que conviene mantener desconfianza constante mientras tengas fondos","Que la autocustodia solo compensa a partir de cierta cantidad","Que el riesgo crece de forma proporcional al tiempo que pasa","Que el riesgo se concentra en pocos momentos concretos y basta con bajar el ritmo en ellos"]'::jsonb,
       correct_answer = 3
 WHERE id = '05219f0b-cf96-47b5-a6e1-337ddfba9737';

-- orden 4: la correcta pasa de C a A
UPDATE public.quiz_questions
   SET options = '["Que la rentabilidad garantizada es incompatible con cripto, y los pagos iniciales forman parte del método","Que el proyecto es sólido, porque los pagos se pueden comprobar","Que conviene entrar con poco para probar","Que hay que comprobar si está registrado antes de decidir"]'::jsonb,
       correct_answer = 0
 WHERE id = '3a292d4f-681d-4063-8f75-d245a4fb7753';

-- orden 5: la correcta pasa de B a B
UPDATE public.quiz_questions
   SET options = '["Publicidad, registro, depósito y bloqueo","Atención, confianza, prisa y acción irreversible","Contacto, contrato, comisión y desaparición","Promesa, prueba, testimonio y garantía"]'::jsonb,
       correct_answer = 1
 WHERE id = '8005886d-ac5f-45f2-b111-f2ffef300fbb';

-- orden 6: la correcta pasa de C a C
UPDATE public.quiz_questions
   SET options = '["La suplantación del soporte técnico, porque imita bien a la empresa","El falso airdrop, porque te hace firmar sin entender","La relación construida lentamente, porque espera a que la idea parezca tuya","La web falsa, porque captura la contraseña y el código a la vez"]'::jsonb,
       correct_answer = 2
 WHERE id = '2e60281c-6735-4e3e-8750-2a194f28cb72';

-- orden 7: la correcta pasa de C a D
UPDATE public.quiz_questions
   SET options = '["Fallos técnicos de las aplicaciones de cartera","Desconocimiento: falta formación previa","Ataques sofisticados difíciles de detectar","Que el conocimiento estaba pero no se aplicó en el momento"]'::jsonb,
       correct_answer = 3
 WHERE id = '5bf70009-0b00-4f3b-9ff4-f0366e31150a';

-- orden 8: la correcta pasa de B a A
UPDATE public.quiz_questions
   SET options = '["Porque no da ninguna señal mientras se comete y la ventana de arreglarlo se cierra sin avisar","Porque las aplicaciones cambian y la configuración deja de servir","Porque las comisiones suben con el tiempo","Porque la red deja de aceptar carteras antiguas"]'::jsonb,
       correct_answer = 0
 WHERE id = 'a6bca879-dff5-4c19-898e-de141abdcb5e';

-- orden 9: la correcta pasa de C a B
UPDATE public.quiz_questions
   SET options = '["Ninguno: la seguridad depende solo de las herramientas","Empeora, porque la costumbre baja la guardia justo cuando las cantidades son mayores","Mejora, porque ya reconoces los riesgos por costumbre","Mejora, porque los ataques se concentran en principiantes"]'::jsonb,
       correct_answer = 1
 WHERE id = 'ac99a87e-22c3-48fa-a43c-8b8038196d92';

-- ------------------------------------------------------------------------
-- seguridad-basica-en-bitcoin-y-criptomonedas / proteger-tus-accesos
-- ------------------------------------------------------------------------

-- orden 1: la correcta pasa de B a C
UPDATE public.quiz_questions
   SET options = '["La frase es más larga, pero ambas se pueden restablecer","La contraseña la genera el sistema y la frase la eliges tú","Una contraseña protege un acceso; la frase es el acceso en sí","Ninguna: son dos nombres para lo mismo"]'::jsonb,
       correct_answer = 2
 WHERE id = '513f2cf2-486a-489e-af07-b77a14f58478';

-- orden 2: la correcta pasa de B a D
UPDATE public.quiz_questions
   SET options = '["Ninguno, mientras la cartera esté bien protegida","Que el proveedor de correo podría leer tus claves","Que conviene cambiar de proveedor de correo cada año","Que el correo es la llave que recupera todo lo demás, así que rodea la protección de la cartera"]'::jsonb,
       correct_answer = 3
 WHERE id = '1e0725f4-9166-4bd3-86a0-3d8b0d2cd422';

-- orden 3: la correcta pasa de B a A
UPDATE public.quiz_questions
   SET options = '["Cinco palabras sin relación entre sí, usada solo ahí","Ocho caracteres con símbolos, usada solo ahí","Ocho caracteres con símbolos, usada en varios sitios","Da igual: lo único que importa son los símbolos"]'::jsonb,
       correct_answer = 0
 WHERE id = '9623847f-d87f-4a31-b8df-3e6a6606c50b';

-- orden 4: la correcta pasa de C a B
UPDATE public.quiz_questions
   SET options = '["Una aplicación de códigos que cambian cada pocos segundos","Los códigos recibidos por SMS","Una llave física que hay que tener delante","Los tres son equivalentes en seguridad"]'::jsonb,
       correct_answer = 1
 WHERE id = 'aa618777-d409-40f9-a25c-3f94b0d9110f';

-- orden 5: la correcta pasa de C a C
UPDATE public.quiz_questions
   SET options = '["Sí, porque el código caduca en segundos","Sí, siempre que sea una aplicación y no un SMS","No: quien recibe ambos datos puede usarlos al instante en la web auténtica","No, pero solo si la web tiene un certificado inválido"]'::jsonb,
       correct_answer = 2
 WHERE id = 'a9d01041-6aa4-495f-9917-ba87985617b4';

-- orden 6: la correcta pasa de B a D
UPDATE public.quiz_questions
   SET options = '["Porque los dispositivos almacenan las monedas","Porque el sistema operativo firma las transacciones por ti","Porque determina las comisiones que pagas","Porque si está comprometido no hace falta romper ninguna de las otras protecciones"]'::jsonb,
       correct_answer = 3
 WHERE id = '92f89408-d3ce-430f-b49f-220dc5e2e642';

-- orden 7: la correcta pasa de B a A
UPDATE public.quiz_questions
   SET options = '["Tener las actualizaciones automáticas activadas","Instalar un antivirus de pago","Usar una red privada virtual siempre","Cambiar de dispositivo cada dos años"]'::jsonb,
       correct_answer = 0
 WHERE id = 'aaa7a5b7-0e18-4dca-836f-a9bd86a6e8fe';

-- orden 8: la correcta pasa de B a B
UPDATE public.quiz_questions
   SET options = '["Consumen memoria y ralentizan las operaciones","Pueden modificar lo que ves, incluida una dirección, y se actualizan sin que lo apruebes","Impiden que el segundo factor funcione","Revelan tu dirección IP a la red"]'::jsonb,
       correct_answer = 1
 WHERE id = '92ac5ff8-69f5-4f18-8d3d-c7798eae3d8f';

-- orden 9: la correcta pasa de B a C
UPDATE public.quiz_questions
   SET options = '["Antivirus, red privada virtual y contraseñas con símbolos","Cambiar contraseñas cada mes, cifrar el disco y usar dos navegadores","Proteger el correo, tener una copia en papel comprobada y comprobar antes de firmar","Dispositivo dedicado, custodia repartida y revisión mensual"]'::jsonb,
       correct_answer = 2
 WHERE id = '7a7ff169-9b1b-485f-8946-8a8df19689a0';

-- ------------------------------------------------------------------------
-- seguridad-basica-en-bitcoin-y-criptomonedas / la-custodia-decidida-con-criterio
-- ------------------------------------------------------------------------

-- orden 1: la correcta pasa de B a D
UPDATE public.quiz_questions
   SET options = '["Las monedas, en un archivo cifrado","Una copia del registro completo de la red","Un certificado de propiedad emitido por la red","La clave que permite firmar movimientos desde una dirección"]'::jsonb,
       correct_answer = 3
 WHERE id = '9ce062f9-7c97-4935-be85-e502bd4a81ad';

-- orden 2: la correcta pasa de B a A
UPDATE public.quiz_questions
   SET options = '["Porque las defensas contra el robo y contra la pérdida de acceso tiran en direcciones contrarias","Porque el coste de las medidas crece con la cantidad custodiada","Porque la red penaliza las carteras con demasiadas copias","Porque la ley limita el número de respaldos permitidos"]'::jsonb,
       correct_answer = 0
 WHERE id = 'fde33089-e74e-4af8-93f2-24637db5e8f3';

-- orden 3: la correcta pasa de B a B
UPDATE public.quiz_questions
   SET options = '["Si la aplicación muestra el saldo en euros","Si puedes enviar a cualquier dirección ahora mismo sin que nadie pueda impedirlo","Si la aplicación te pide verificar tu identidad","Si cobra comisiones por retirar"]'::jsonb,
       correct_answer = 1
 WHERE id = 'e302e908-fd7a-41a4-a975-b5a12f4ac253';

-- orden 4: la correcta pasa de C a C
UPDATE public.quiz_questions
   SET options = '["Que la empresa quiebre","Que la ataquen y el robo supere lo que puede absorber","Que bloquee tu cuenta por una revisión, una orden o un error","Que desaparezca llevándose lo depositado"]'::jsonb,
       correct_answer = 2
 WHERE id = '0baeca63-77fe-42ef-8fb2-d5fa046f4693';

-- orden 5: la correcta pasa de B a D
UPDATE public.quiz_questions
   SET options = '["El custodio protege de los errores de otros; la custodia propia, de los tuyos","Ambas protegen de lo mismo, con distinto coste","El custodio protege del robo; la custodia propia, de la inflación","El custodio protege de tus errores; la custodia propia, de los errores de otros"]'::jsonb,
       correct_answer = 3
 WHERE id = 'fa659f85-e211-4077-86ea-0d5caea8f69e';

-- orden 6: la correcta pasa de D a A
UPDATE public.quiz_questions
   SET options = '["Que te pase algo y nadie más pueda acceder","Perder la frase de recuperación","Que alguien consiga la frase mediante un engaño","Enviar a una dirección equivocada"]'::jsonb,
       correct_answer = 0
 WHERE id = '815e944e-35ed-45b3-a315-e12a9095e850';

-- orden 7: la correcta pasa de B a B
UPDATE public.quiz_questions
   SET options = '["Custodia propia con dispositivo dedicado, por ser la más segura sobre el papel","Un custodio decente, porque una autocustodia abandonada suma riesgos sin las ventajas","Custodia repartida entre varias firmas","Da igual: el mantenimiento no afecta al resultado"]'::jsonb,
       correct_answer = 1
 WHERE id = '0267023e-c4bb-418b-a986-88fc0dd56c62';

-- orden 8: la correcta pasa de C a C
UPDATE public.quiz_questions
   SET options = '["Las faltas de ortografía en el mensaje","Un logotipo mal reproducido","La prisa que no has puesto tú","Que el remitente sea desconocido"]'::jsonb,
       correct_answer = 2
 WHERE id = 'e2edeeb7-da3f-4a51-8b96-ee83c60f5029';

-- orden 9: la correcta pasa de B a D
UPDATE public.quiz_questions
   SET options = '["Porque las herramientas sencillas están mejor auditadas","Porque cuesta menos dinero","Porque los atacantes se centran en los sistemas complejos","Porque se mantiene durante años y la complejidad añade formas nuevas de fallar"]'::jsonb,
       correct_answer = 3
 WHERE id = '4cdf70db-a7f6-4cdb-bedc-a066675b06bb';

-- ------------------------------------------------------------------------
-- uso-practico-de-bitcoin / antes-de-tu-primera-transaccion
-- ------------------------------------------------------------------------

-- orden 1: la correcta pasa de B a A
UPDATE public.quiz_questions
   SET options = '["Siguen en el registro de la red; con la copia de seguridad los recuperas en cualquier otra cartera","Se pierden: estaban guardados dentro de la aplicación","Se devuelven automáticamente a quien te los envió","Quedan bloqueados hasta que reinstales esa misma aplicación"]'::jsonb,
       correct_answer = 0
 WHERE id = '12a6cd93-2e90-4417-b58e-f30fb0678b3b';

-- orden 2: la correcta pasa de C a B
UPDATE public.quiz_questions
   SET options = '["Que tiene un sistema de respaldo especialmente bueno","Que las claves no son tuyas: las tiene quien puede devolverte el acceso","Que usa un estándar distinto de copia de seguridad","Que conviene activar además la verificación en dos pasos"]'::jsonb,
       correct_answer = 1
 WHERE id = 'eb45adba-3396-45d3-b14e-eb5694d75634';

-- orden 3: la correcta pasa de A a C
UPDATE public.quiz_questions
   SET options = '["Todo el ciclo de vida de la semilla, desde que nace","Los fondos frente a un envío a la dirección equivocada","Lo que ocurre con tus claves después de generarlas; no cómo se generaron","El valor de los bitcoins frente a caídas de precio"]'::jsonb,
       correct_answer = 2
 WHERE id = 'aa34b9ea-c6ed-41a9-a412-35dffbf55675';

-- orden 4: la correcta pasa de B a D
UPDATE public.quiz_questions
   SET options = '["Bitcoins en tu poder, igual que si los tuvieras en tu propia cartera","Bitcoins bloqueados que se liberan tras un periodo de seguridad","Una participación en el fondo común de la plataforma","Un derecho de cobro contra esa empresa: las claves las tiene ella"]'::jsonb,
       correct_answer = 3
 WHERE id = 'bd74e66b-9be4-44a2-8c0b-9cc06d51aa05';

-- orden 5: la correcta pasa de D a A
UPDATE public.quiz_questions
   SET options = '["Ninguna: cada una intercambia identificación, confianza, coste y comodidad de forma distinta","El intercambio entre particulares, porque evita la identificación","Cobrar por tu trabajo, porque no hay que comprar nada","La plataforma con custodia, porque es la más cómoda"]'::jsonb,
       correct_answer = 0
 WHERE id = '86e12dbf-2cf3-43ce-bea4-435c1c84bf54';

-- orden 6: la correcta pasa de A a B
UPDATE public.quiz_questions
   SET options = '["Que tus transacciones futuras pasan a ser privadas","Que tu identidad queda asociada a esa dirección, y la cadena es pública y permanente","Que la plataforma responde de los fondos una vez retirados","Que quedas exento de obligaciones fiscales en ese país"]'::jsonb,
       correct_answer = 1
 WHERE id = 'f1ce2c21-312a-4948-beb3-b5b6e729e485';

-- orden 7: la correcta pasa de B a C
UPDATE public.quiz_questions
   SET options = '["Porque las direcciones son difíciles de rastrear","Porque las comisiones bajas abaratan el ataque","Porque una transacción confirmada no se deshace: no hay reclamación ni reversión","Porque la mayoría de usuarios no usa contraseñas"]'::jsonb,
       correct_answer = 2
 WHERE id = '78ae1b43-48ef-4240-9170-f6e3cb2148a4';

-- orden 8: la correcta pasa de C a D
UPDATE public.quiz_questions
   SET options = '["Aceptar si se identifica como soporte del proyecto","Aceptar solo si no te pide la frase de recuperación","Compartir pantalla para que vea el problema más rápido","Desconfiar: la ayuda legítima ocurre en público, donde otros pueden corregirla"]'::jsonb,
       correct_answer = 3
 WHERE id = '47bc820a-bb50-46eb-8445-af9004e93d6f';

-- orden 9: la correcta pasa de D a A
UPDATE public.quiz_questions
   SET options = '["Que sea una dirección envenenada, sembrada ahí a propósito para parecerse a la tuya","Ninguno: si ya funcionó una vez, la dirección es correcta","Que la dirección haya caducado y el envío falle","Que la cartera cobre una comisión más alta por reutilizarla"]'::jsonb,
       correct_answer = 0
 WHERE id = '23e41356-24df-484b-aa2b-485fb31d414c';

-- ------------------------------------------------------------------------
-- uso-practico-de-bitcoin / tu-primera-transaccion
-- ------------------------------------------------------------------------

-- orden 1: la correcta pasa de B a B
UPDATE public.quiz_questions
   SET options = '["Que la comisión esté dentro de lo razonable","La dirección entera, después de pegarla","Que haya saldo suficiente para cubrir la comisión","Que la cartera esté actualizada a la última versión"]'::jsonb,
       correct_answer = 1
 WHERE id = 'f8a531eb-8797-44c3-80fc-613597ccd0e6';

-- orden 2: la correcta pasa de C a C
UPDATE public.quiz_questions
   SET options = '["Para que la red registre tu dirección como fiable","Para reducir la comisión total de las dos operaciones","Para descubrir un error cuando todavía no importa","Para acelerar la confirmación de la transacción grande"]'::jsonb,
       correct_answer = 2
 WHERE id = '7e32c6fd-f866-4a06-81d7-9147e0f79dc9';

-- orden 3: la correcta pasa de B a D
UPDATE public.quiz_questions
   SET options = '["Aceptarla: la captura muestra la transacción firmada","Pedirle que te reenvíe el pago para asegurarte","Esperar a que te lo confirme tu propia plataforma","Comprobarlo tú en un explorador de bloques; una captura no prueba nada"]'::jsonb,
       correct_answer = 3
 WHERE id = 'b3dd58bd-e41b-462b-9182-4d7d7e594c02';

-- orden 4: la correcta pasa de B a A
UPDATE public.quiz_questions
   SET options = '["Según qué pasa si tarda: quién está esperando al otro lado","Según la cantidad que estás enviando","Siempre la más alta, para asegurar la confirmación","Según el saldo total que tengas en la cartera"]'::jsonb,
       correct_answer = 0
 WHERE id = 'a7d9d063-07bf-4879-8e76-4cb7d92fb7e9';

-- orden 5: la correcta pasa de A a B
UPDATE public.quiz_questions
   SET options = '["Consultarla en un explorador","Volver a enviar el pago","Esperar sin hacer nada","Avisar a quien tiene que cobrar"]'::jsonb,
       correct_answer = 1
 WHERE id = 'ec13316e-e2ff-4367-8eee-ae8bca0202da';

-- orden 6: la correcta pasa de B a C
UPDATE public.quiz_questions
   SET options = '["Una comisión normal: depende de la cantidad, no del número de cobros","Que la cartera los agrupe automáticamente sin coste","Una comisión más alta, porque cada cobro hay que incluirlo y firmarlo por separado","Que la red rechace la transacción por tener demasiadas entradas"]'::jsonb,
       correct_answer = 2
 WHERE id = '19987f35-26de-49a8-9974-34eeb05b7191';

-- orden 7: la correcta pasa de C a D
UPDATE public.quiz_questions
   SET options = '["De que envíes a la dirección de otra persona","De que la cartera use la red equivocada","De que alguien intercepte la transacción","De las erratas al copiar, no de copiar la dirección equivocada"]'::jsonb,
       correct_answer = 3
 WHERE id = '1db0db13-970e-4baf-8daa-a099dfc481a2';

-- orden 8: la correcta pasa de D a A
UPDATE public.quiz_questions
   SET options = '["Porque son hacer con prisa algo que se sabe hacer despacio","Porque las carteras actuales son demasiado complicadas","Porque casi nadie entiende cómo funcionan las transacciones","Porque el protocolo tiene fallos que aún no se han corregido"]'::jsonb,
       correct_answer = 0
 WHERE id = 'b9bc320c-afe1-4bed-b0ef-75e02cf0c18e';

-- orden 9: la correcta pasa de A a B
UPDATE public.quiz_questions
   SET options = '["Como algo normal en operaciones entre particulares","Como una señal de alarma, no como un contexto","Como un motivo para elegir una comisión más alta","Como una razón para saltarse el envío de prueba"]'::jsonb,
       correct_answer = 1
 WHERE id = '42d95edc-8d37-41d0-bace-7d5fc6264239';

-- ------------------------------------------------------------------------
-- uso-practico-de-bitcoin / usar-bitcoin-con-criterio
-- ------------------------------------------------------------------------

-- orden 1: la correcta pasa de C a C
UPDATE public.quiz_questions
   SET options = '["Un porcentaje fijo del total, revisado cada mes","Lo mínimo imprescindible para una sola operación","Una cantidad que pudieras perder sin que te cambie la semana","Todo, siempre que la cartera tenga contraseña"]'::jsonb,
       correct_answer = 2
 WHERE id = 'eae5a5bb-f2a1-4b2f-b1c6-aa279ec1414d';

-- orden 2: la correcta pasa de B a D
UPDATE public.quiz_questions
   SET options = '["De los ataques dirigidos, que son el riesgo más frecuente","De las caídas de precio a corto plazo","De que la cartera deje de recibir actualizaciones","De que un error tuyo tenga consecuencias limitadas"]'::jsonb,
       correct_answer = 3
 WHERE id = 'c8e170f4-5fa3-4fce-a85c-174f196e60e3';

-- orden 3: la correcta pasa de D a A
UPDATE public.quiz_questions
   SET options = '["¿Está aquí por una razón, o porque no lo he movido?","¿Está la plataforma regulada en mi país?","¿Ha subido o bajado desde que lo dejé ahí?","¿Tiene la plataforma verificación en dos pasos activada?"]'::jsonb,
       correct_answer = 0
 WHERE id = '1a1d0fea-d7c9-49c4-910b-fc881e363717';

-- orden 4: la correcta pasa de B a B
UPDATE public.quiz_questions
   SET options = '["Que tus transacciones dejen de ser públicas","Que no haya un único sitio visible donde se acumule todo lo que recibes","Que nadie pueda relacionar entre sí ninguna de tus direcciones","Que las comisiones de tus envíos sean más bajas"]'::jsonb,
       correct_answer = 1
 WHERE id = '34f2ca12-d3be-4b74-836b-f1c5fd737b55';

-- orden 5: la correcta pasa de C a C
UPDATE public.quiz_questions
   SET options = '["Nada: con la xpub no se puede gastar","Que podrían gastar tus fondos si además conocen una dirección","Que quien la tenga ve todo tu historial y tu saldo, presente y futuro","Que tus direcciones dejarían de generarse correctamente"]'::jsonb,
       correct_answer = 2
 WHERE id = '455f92e9-f507-45c9-98bf-627a93fe4c0c';

-- orden 6: la correcta pasa de D a D
UPDATE public.quiz_questions
   SET options = '["En ocultar las transacciones para que no se puedan consultar","En borrar del registro las operaciones antiguas","En usar siempre la misma dirección para no dispersar la información","En no facilitar las conexiones entre transacciones; es cuestión de grado"]'::jsonb,
       correct_answer = 3
 WHERE id = '13b7bbba-89e6-4354-b0fb-8a7e6be4d138';

-- orden 7: la correcta pasa de B a A
UPDATE public.quiz_questions
   SET options = '["Que tampoco haya quien deshaga un error tuyo","Que las comisiones sean más altas que en el sistema bancario","Que las transacciones tarden más en confirmarse","Que necesites identificarte para operar"]'::jsonb,
       correct_answer = 0
 WHERE id = '2fc47eb0-bc78-4774-b786-b50bd80d374c';

-- orden 8: la correcta pasa de B a B
UPDATE public.quiz_questions
   SET options = '["Que subirá a largo plazo por la emisión limitada","Que es imposible saberlo: depende del comportamiento futuro de millones de personas","Que se mantendrá estable una vez se extienda la adopción","Que bajará hasta que se resuelvan los problemas de escalabilidad"]'::jsonb,
       correct_answer = 1
 WHERE id = '60eb2b61-ecd6-4e54-be8c-c6e0941b2f08';

-- orden 9: la correcta pasa de A a C
UPDATE public.quiz_questions
   SET options = '["Que alguien prometa o garantice una rentabilidad","Que te escriban primero por privado ofreciendo ayuda","Que una transacción tarde varias horas en confirmarse","Que te ofrezcan recuperar fondos enviados o semillas perdidas"]'::jsonb,
       correct_answer = 2
 WHERE id = 'cd54109b-c65f-47c7-a607-e1b152e5e85e';

COMMIT;


-- ============================================================================
-- COMPROBACIONES (solo lectura)
-- ============================================================================
-- 1. El reparto debe quedar plano
--
-- SELECT correct_answer, count(*) FROM public.quiz_questions q
--   JOIN public.modules m ON m.id = q.module_id
--   JOIN public.courses c ON c.id = m.course_id
--  WHERE c.status = 'published'
--  GROUP BY correct_answer ORDER BY correct_answer;
-- QUE DEBE SALIR: 61, 61, 61, 60.
--
-- 2. Ninguna pregunta puede haber perdido opciones ni salirse de rango
--
-- SELECT count(*) FROM public.quiz_questions
--  WHERE jsonb_array_length(options) <> 4
--     OR correct_answer < 0 OR correct_answer > 3;
-- QUE DEBE SALIR: 0.
--
-- 3. Y por modulo, ninguna letra puede acumular mas de 3
--
-- SELECT m.slug, q.correct_answer, count(*) FROM public.quiz_questions q
--   JOIN public.modules m ON m.id = q.module_id
--  GROUP BY m.slug, q.correct_answer HAVING count(*) > 3;
-- QUE DEBE SALIR: 0 filas.
