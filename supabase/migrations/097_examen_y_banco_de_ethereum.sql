-- ============================================================================
-- MIGRACION 097: el examen de ethereum-contratos y sus 30 preguntas
--
-- Revisadas una a una antes de insertarlas (docs/BANCO-ETHEREUM-30.md), y
-- corregidas con la revision:
--
--   · la correcta estaba en la b en 29 de 30, y era casi siempre la opcion mas
--     larga. Ahora el reparto es 8 en a, 7 en b, 8 en c y 7 en d, y las cuatro
--     opciones de cada pregunta tienen longitud y detalle comparables. La
--     verificacion final cuenta el reparto.
--   · la 9 estaba desactualizada: tras The Merge la marca de tiempo la fija el
--     slot de 12 s y quien propone no tiene margen real para elegirla. El
--     problema es que es PREDECIBLE. Reescrita entera.
--   · la 19: desde Dencun (EIP-6780) SELFDESTRUCT solo elimina el contrato si
--     ocurre en la transaccion que lo creo, asi que el riesgo del contrato al
--     que se delega es que lo CAMBIEN, no que lo destruyan.
--   · la 6: la rubrica suma, sin exigirlo, que desde Pectra (EIP-7702) una
--     cuenta de persona puede delegar temporalmente en codigo.
--   · la 2 y la 7, halladas al revisar el resto: tras EIP-1559 la comision base
--     se QUEMA y la fija el protocolo segun lo lleno que vaya el bloque; quien
--     envia elige el maximo que acepta y la propina.
--
-- EL EXAMEN
-- ethereum-contratos no tenia examen: los cuatro que hay son de
-- bitcoin-fundamentos, seguridad-custodia, web3 y mercados-trading. Se crea con
-- pass_threshold 70 y total_questions 15, lo acordado.
--
-- 15 de 30 significa DOS intentos limpios por candidato. El tercero no se sirve,
-- y servir_preguntas lo dice con la cuenta en vez de devolver un examen corto.
--
-- LAS OPCIONES SE BARAJAN AL SERVIRLAS (096), asi que el orden de este fichero
-- es solo el del banco, no el que ve nadie.
--
-- Es reejecutable: cada pregunta se inserta solo si su enunciado no esta ya.
-- Y se prueba a si misma, esta vez de verdad: sirve un examen completo.
-- ============================================================================

BEGIN;

-- =====================================================
-- 1. El examen
-- =====================================================

INSERT INTO public.instructor_exams
  (specialty_id, title, description, slug, total_questions, pass_threshold,
   time_limit_minutes, certification_validity_years, is_active)
SELECT
  e.id,
  'Certificacion de instructor: Ethereum y contratos inteligentes',
  'Quince preguntas del banco de la especialidad, distintas en cada intento. El examen mide lo escrito; las repreguntas y la parte practica las valora un evaluador, y sin las dos aptas no hay aprobacion.',
  'instructor-exam-ethereum-contratos',
  15, 70, 30, 2, true
FROM public.instructor_specialties e
WHERE e.slug = 'ethereum-contratos'
  AND NOT EXISTS (
    SELECT 1 FROM public.instructor_exams x WHERE x.slug = 'instructor-exam-ethereum-contratos'
  );

-- =====================================================
-- 2. Las treinta
-- =====================================================
-- Por slug de especialidad, nunca por un uuid escrito a mano. Y con
-- NOT EXISTS por enunciado, para que reejecutar no duplique.

INSERT INTO public.instructor_exam_questions
  (specialty_id, question, options, correct_answer, difficulty, category,
   explanation, oral_followup, oral_rubric)
SELECT esp.id, t.pregunta, t.opciones::jsonb, t.correcta, t.dificultad, t.categoria,
       t.porque, t.repregunta, t.rubrica::jsonb
FROM (VALUES

-- ── Modulo 1 · Que añadio Ethereum ────────────────────────────────────────────
(1, 'Ethereum lleva un estado con cuentas y saldos; Bitcoin lleva salidas no gastadas. ¿Que habilita ese cambio?',
 '["Que las transacciones se confirmen en menos tiempo que en Bitcoin","Que las comisiones de cada operacion sean fijas y previsibles","Que un programa lea y modifique un saldo acumulado sin reconstruirlo de piezas","Que una transaccion pueda enviarse sin firmar con la clave privada"]',
 2, 'hard', 'estado-y-cuentas',
 'Con salidas no gastadas, cuanto tiene una direccion es una suma que hay que reconstruir. Con cuentas es un campo que se lee y se escribe, y sobre eso se puede programar logica que dependa del estado anterior.',
 'Si te pido guardar en un contrato cuantas veces ha interactuado cada usuario, ¿por que es mas natural aqui que en Bitcoin?',
 '{"debe_contener":["que el estado es un mapa consultable y modificable","que con salidas habria que representar el contador con piezas que se gastan y se recrean","que el coste de leer el estado anterior marca la diferencia"],"senal_de_memorizado":"repite que Ethereum tiene cuentas y Bitcoin UTXO sin decir que se vuelve facil"}'),

(2, 'Una transaccion se queda sin gas a mitad de ejecucion. ¿Que ocurre?',
 '["Los cambios de estado se revierten y el gas consumido no se devuelve","Todo se revierte y el gas vuelve integro a quien lo envio","Queda en espera hasta que alguien aporte el gas que faltaba","Se conserva la parte de la ejecucion que si cupo en el gas"]',
 0, 'hard', 'gas',
 'El computo se hizo: los nodos lo ejecutaron y la comision base se quema, asi que el coste ya esta soportado por la red. Devolver el gas volveria gratis intentar computos caros. Revertir el estado y reembolsar el pago son dos cosas distintas.',
 '¿Por que no se devuelve si el resultado se tira?',
 '{"debe_contener":["que el trabajo se hizo y tuvo coste real","que devolverlo permitiria agotar la red gratis","la distincion entre revertir el estado y reembolsar"],"suma_no_obligatorio":"que tras EIP-1559 la comision base se quema y solo la propina va a quien propone el bloque","senal_de_memorizado":"dice que se pierde el gas y no sabe a quien protege eso"}'),

(3, 'Un contrato recorre un array cuyo tamaño crece con el numero de usuarios. ¿Cual es el problema de fondo?',
 '["Que el array ocupa un espacio de almacenamiento cada vez mas caro","Que los arrays de tamaño variable no se pueden recorrer en un contrato","Que leer cada posicion del array cuesta gas y eso encarece la llamada","Que llegara un tamaño que no cabe en el limite de gas de un bloque, y la funcion quedara inutilizable"]',
 3, 'expert', 'gas',
 'No es que se encarezca: hay un techo por bloque. Si recorrer el array lo supera, no existe precio que haga ejecutable la funcion, y si de ella depende retirar fondos, los fondos quedan atrapados.',
 '¿Como se diseña para que no pueda pasar?',
 '{"debe_contener":["que el limite es duro, no un precio alto","que la salida es procesar por lotes o que cada usuario opere sobre su entrada","que el riesgo se agrava si el bucle esta en el camino de sacar fondos"],"senal_de_memorizado":"responde que gastaria mucho gas sin mencionar el techo por bloque"}'),

(4, 'Un contrato tiene que transferir fondos el primer dia de cada mes. ¿Que hace falta?',
 '["Que alguien envie una transaccion que lo llame: un contrato no se despierta solo","Nada: se programa la fecha en el codigo y se ejecuta por su cuenta","Un tipo de bloque reservado para las tareas programadas de los contratos","Dejar gas suficiente depositado para que se ejecute en segundo plano"]',
 0, 'hard', 'limites-de-un-contrato',
 'El codigo de un contrato solo corre dentro de una transaccion. No hay temporizadores: alguien tiene que pagar y llamar. Los contratos que se ejecutan solos siempre tienen a alguien empujando detras.',
 '¿Quien paga esa llamada mensual y que pasa si nadie la hace?',
 '{"debe_contener":["que hace falta un actor externo que pague el gas","que si nadie llama no pasa nada y el contrato no protesta","que es una dependencia operativa que se diseña"],"senal_de_memorizado":"dice que necesita un oraculo, confundiendo traer datos con provocar la ejecucion"}'),

(5, '¿Por que un contrato no puede consultar por su cuenta el precio de un activo en una web?',
 '["Porque los servidores web rechazan las peticiones que vienen de un nodo","Porque no existen librerias que permitan hacer esa consulta desde el codigo","Porque la ejecucion debe dar el mismo resultado en todos los nodos, y una consulta externa no lo garantiza","Porque la consulta consumiria mas gas del que cabe en una transaccion"]',
 2, 'hard', 'limites-de-un-contrato',
 'Cada nodo reejecuta la transaccion y debe llegar al mismo estado. Si el codigo pudiera consultar fuera, dos nodos obtendrian respuestas distintas y no habria acuerdo. De ahi que el dato tenga que entrar dentro de una transaccion.',
 'Cuando un contrato usa un precio, ¿de donde sale y en quien confias?',
 '{"debe_contener":["que alguien lo ha escrito en cadena con una transaccion","que la confianza se traslada a ese informador y su procedimiento","que hay que preguntar cada cuanto se actualiza y que pasa si se queda parado"],"senal_de_memorizado":"dice que usa un oraculo sin nombrar en quien se confia ni que falla si el dato es viejo"}'),

(6, '¿Que distingue la cuenta de una persona de la de un contrato?',
 '["La de contrato no puede tener saldo propio, solo mover el de otras","La de persona se controla con una clave y firma; la de contrato actua solo cuando su codigo se ejecuta","La de persona no puede recibir tokens, unicamente la moneda nativa","Las dos se controlan con una clave privada, pero con formatos distintos"]',
 1, 'hard', 'estado-y-cuentas',
 'Una cuenta de contrato no decide nada por su cuenta: nadie firma por ella. Su comportamiento esta escrito, y eso la vuelve previsible y tambien rigida.',
 'Si mando fondos a un contrato que no espera recibirlos, ¿que puede pasar?',
 '{"debe_contener":["que puede revertir si no tiene forma de aceptarlos","que si los acepta y no tiene forma de sacarlos quedan atrapados","que no hay clave privada con la que rescatarlos"],"suma_no_obligatorio":"que desde Pectra (EIP-7702) una cuenta de persona puede delegar temporalmente en codigo, asi que la frontera ya no es tan limpia como una tiene codigo y la otra no","senal_de_memorizado":"responde que una tiene clave y la otra codigo sin sacar ninguna consecuencia"}'),

(7, 'Dos transacciones que hacen lo mismo consumen cantidades de gas muy distintas. ¿Cual es la explicacion?',
 '["Una se envio en un momento de congestion y la otra con la red tranquila","El precio del gas depende del historial de cada cuenta que lo paga","Una iba firmada con un algoritmo mas costoso de verificar que la otra","Una escribio en una posicion de almacenamiento vacia y la otra modifico una ya ocupada"]',
 3, 'expert', 'gas',
 'Estrenar una posicion cuesta bastante mas que modificar una ocupada, porque el estado crece de forma permanente para todos los nodos. La congestion mueve el precio; esto mueve la cantidad.',
 '¿Que diferencia hay entre precio y cantidad de gas, y cual controlas tu?',
 '{"debe_contener":["que la cantidad la determina el trabajo que hace el codigo","que la comision base la fija el protocolo segun lo lleno que vaya el bloque, y quien envia elige el maximo que acepta pagar y la propina","que optimizar el contrato baja la cantidad, y esperar solo baja lo que pagas por unidad"],"senal_de_memorizado":"dice que depende de la congestion para todo, sin separar las dos cosas"}'),

(8, 'Un contrato desplegado no se puede modificar. ¿Que implica eso para un error en su codigo?',
 '["El error sigue ahi mientras se use esa direccion: corregirlo es desplegar otro y llevar a la gente","Se corrige enviando una version nueva del codigo a esa misma direccion","Los nodos aplican por su cuenta los parches que publica quien lo desplego","Solo puede corregirse mientras el contrato no tenga saldo depositado"]',
 0, 'hard', 'estado-y-cuentas',
 'La inmutabilidad es la garantia y la trampa. No hay despliegue correctivo sobre la misma direccion, asi que un error se arregla migrando, y la migracion tiene que convencer a quien ya esta dentro.',
 '¿Como consiguen algunos proyectos corregir errores sin migrar a nadie?',
 '{"debe_contener":["que anteponen un contrato que redirige a otro con el codigo","que entonces alguien puede cambiar ese destino","que eso reintroduce una autoridad que la inmutabilidad habia quitado"],"senal_de_memorizado":"dice que los contratos son inmutables y no sabe como se esquiva en la practica"}'),

(9, 'Un contrato usa la marca de tiempo del bloque como fuente de azar para un sorteo. ¿Cual es el problema?',
 '["Que quien propone el bloque puede ponerle la hora que le convenga","Que un contrato no tiene forma de leer la marca de tiempo del bloque","Que la marca la fija el slot, cada 12 segundos, y es predecible de antemano","Que cada nodo la calcula por su cuenta y no todos coinciden en su valor"]',
 2, 'expert', 'limites-de-un-contrato',
 'Tras The Merge los bloques van en slots de 12 segundos y la marca de tiempo es la del slot: quien propone no tiene margen real para elegirla. El problema no es que la manipule, es que cualquiera sabe que valor va a tener antes de actuar, y con eso el resultado del sorteo se calcula por adelantado.',
 '¿Donde esta entonces el margen real de quien propone el bloque?',
 '{"debe_contener":["que transacciones incluye y en que orden","que puede no publicar el bloque, renunciando a su recompensa, para descartar un resultado que no le gusta","que prevrandao sustituyo a la dificultad como fuente de azar del protocolo y admite un sesgo pequeño, asi que tampoco es azar limpio cuando el premio es grande"],"senal_de_memorizado":"dice que el proponente elige el timestamp a voluntad, que es exactamente lo que valia antes de The Merge"}'),

(10, 'Un contrato envia fondos a una direccion y no comprueba el resultado. ¿Cual es el riesgo?',
 '["Que el mismo envio se ejecute dos veces y salga el doble de fondos","Que la transaccion no llegue a incluirse en ningun bloque de la cadena","Que el gas consumido se multiplique por el numero de intentos","Que el envio falle, el contrato siga como si hubiera salido bien y la contabilidad mienta"]',
 3, 'expert', 'gas',
 'Hay formas de enviar que no abortan la ejecucion: devuelven un valor que indica el fallo. Si nadie lo mira, el contrato marca la deuda como pagada sin haberla pagado, y el desajuste se descubre cuando ya no cuadra nada.',
 '¿Como se evita, y por que no basta con comprobar el valor devuelto?',
 '{"debe_contener":["comprobar el resultado y revertir si falla","que ademas hay que decidir que pasa con quien no puede recibir","que un patron mas robusto es que el destinatario venga a retirar en vez de que el contrato empuje"],"senal_de_memorizado":"dice que hay que comprobar el return sin pensar en el destinatario que bloquea el flujo"}'),

-- ── Modulo 2 · Que decide si algo falla ───────────────────────────────────────
(11, 'Has leido el codigo verificado de una direccion. ¿Que te falta comprobar antes de confiar en que eso es lo que se ejecutara?',
 '["Si el compilador usado era la version mas reciente disponible","Si esa direccion ejecuta su codigo o reenvia a otro contrato que alguien puede cambiar","Si el contrato tiene saldo suficiente para atender las retiradas","Si quien lo desplego publico tambien las pruebas automatizadas"]',
 1, 'expert', 'de-donde-sale-el-codigo',
 'Un contrato que redirige tiene su logica en otra direccion. Lo que leiste puede ser solo el reenvio. Si existe quien pueda apuntar a otro destino, el codigo de mañana no es el que has leido hoy.',
 '¿Como se ve desde fuera que una direccion redirige, y que preguntarias despues?',
 '{"debe_contener":["señales observables como codigo muy corto, un destino guardado en el estado o eventos de cambio de destino","que hay que averiguar quien puede cambiarlo","si hay demora o aviso antes de que un cambio surta efecto"],"senal_de_memorizado":"dice que puede ser un proxy y no sabe que mirar ni que preguntar despues"}'),

(12, 'Un contrato tiene una funcion que solo puede llamar una direccion concreta. ¿Que averiguas primero?',
 '["Quien controla esa direccion y que permite hacer exactamente esa funcion","Cuanto gas consume cada llamada a esa funcion restringida","Si el codigo de esa funcion esta verificado en el explorador","En que bloque se desplego el contrato que la contiene"]',
 0, 'hard', 'quien-cambia-las-reglas',
 'Solo el propietario no dice nada por si solo: el riesgo depende de que permite la funcion y de quien es esa direccion, una persona con una clave, varias con firma conjunta, o un contrato que impone demora.',
 '¿Que diferencia practica hay entre una sola clave y una firma conjunta?',
 '{"debe_contener":["que una clave es un unico punto de fallo, por robo o perdida","que la firma conjunta reparte el riesgo pero hay que saber cuantos y quienes","que una demora obligatoria da tiempo a reaccionar aunque quien manda cambie de idea"],"senal_de_memorizado":"responde que hay que ver si esta descentralizado sin describir ningun mecanismo"}'),

(13, 'Autorizas a un contrato a gastar tus tokens sin limite de cantidad. ¿Que has concedido?',
 '["Permiso para una unica operacion, la que estas haciendo ahora","Permiso limitado a la sesion abierta en esa aplicacion web","Permiso para retirar esos tokens cuando quiera, mientras no lo revoques","Nada efectivo: la autorizacion caduca al cerrar el navegador"]',
 2, 'hard', 'como-sale-el-dinero',
 'La autorizacion vive en el contrato del token y no caduca sola. Sigue viva aunque cierres la web o cambies de dispositivo, y quien pueda cambiar el codigo autorizado hereda ese permiso.',
 '¿Como compruebas que autorizaciones tienes vivas y como se quitan?',
 '{"debe_contener":["que se consultan en el contrato del token o con herramientas que las listan","que se revocan poniendo el permiso a cero, y eso cuesta una transaccion","que autorizar solo lo necesario reduce el daño si el contrato autorizado cambia o falla"],"senal_de_memorizado":"dice que es peligroso dar permisos infinitos sin saber como se revisan ni se retiran"}'),

(14, 'Un contrato envia fondos al exterior y despues actualiza su registro interno. ¿Que abre esa secuencia?',
 '["Que la transaccion consuma mas gas del que seria necesario","Que el envio se pierda si el destinatario no esta preparado","Que el registro interno acabe con la entrada duplicada","Que el destinatario vuelva a entrar antes de la actualizacion y repita la operacion"]',
 3, 'expert', 'como-sale-el-dinero',
 'Enviar a un contrato le da el control de la ejecucion. Si el registro todavia dice que le deben, puede pedir otra vez. El orden correcto es apuntar primero y enviar despues.',
 'Ademas de reordenar, ¿que otra medida usarias, y por que no basta una sola?',
 '{"debe_contener":["un cerrojo que impida reentrar mientras la funcion esta en curso","que el orden apuntar y luego enviar es la defensa estructural","que juntas cubren caminos distintos, incluidos los que pasan por otras funciones del mismo contrato"],"senal_de_memorizado":"dice reentrancy se arregla con un guard sin mencionar el orden de las operaciones"}'),

(15, 'Un proyecto anuncia que ha renunciado al control de su contrato. ¿Que compruebas?',
 '["Que lo anuncie en su web y en sus canales oficiales","Que en el estado ya no hay privilegios usables, y que no quedan otras vias con privilegio","Que el contrato se haya quedado sin saldo depositado","Que el codigo fuente se haya retirado del explorador"]',
 1, 'hard', 'quien-cambia-las-reglas',
 'Renunciar es una operacion con efecto observable en el estado. Y una sola renuncia no basta: puede quedar otra funcion privilegiada, un contrato intermedio que redirige, o un permiso concedido antes que sigue vivo.',
 '¿Que privilegio puede quedar aunque ya no haya propietario?',
 '{"debe_contener":["al menos uno concreto: cambiar el destino de la redireccion, una funcion de pausa, una lista de direcciones bloqueadas o una autorizacion concedida antes","que hay que revisar todas las funciones restringidas","que la ausencia de propietario puede ademas dejar el contrato sin forma de arreglarse"],"senal_de_memorizado":"dice que hay que comprobar que hicieron renounce y se queda ahi"}'),

(16, '¿Que significa que el codigo de un contrato este verificado en un explorador?',
 '["Que el codigo publicado compila al que esta en cadena; nada dice de si es correcto","Que alguien ha auditado su seguridad y no ha encontrado fallos","Que el proyecto esta registrado ante el explorador que lo muestra","Que el contrato ha pasado las pruebas que exige el estandar del token"]',
 0, 'hard', 'de-donde-sale-el-codigo',
 'Verificar es una comprobacion de correspondencia, no de calidad. Permite leer lo que se ejecuta, que es imprescindible, pero un contrato verificado puede estar mal diseñado o ser abusivo a la vista de todos.',
 '¿Que te dice de verdad una verificacion, y que tendrias que hacer despues?',
 '{"debe_contener":["que garantiza correspondencia entre fuente y bytecode","que habilita la lectura pero no sustituye a revisar privilegios y salidas de fondos","que sin verificacion te quedas leyendo bytecode, que es mucho peor"],"senal_de_memorizado":"confunde verificado con auditado"}'),

(17, 'Un contrato reparte segun un precio que lee de otro contrato. ¿Cual es el fallo estructural?',
 '["Que leer ese precio consume gas en cada reparto que se hace","Que el precio cambia con el tiempo y el reparto queda desfasado","Que hace falta un oraculo y eso añade una dependencia externa","Que si el precio se puede mover en la misma transaccion, quien lo mueva decide el reparto"]',
 3, 'expert', 'como-sale-el-dinero',
 'El problema no es que el precio varie, es que sea influible por quien se beneficia y en el mismo instante en que se usa. Una medida tomada de una fuente que el interesado puede empujar no es una medida.',
 '¿Que haria a esa fuente de precio mas dificil de empujar?',
 '{"debe_contener":["usar un valor promediado en el tiempo en vez del instantaneo","combinar fuentes independientes","que ninguna medida elimina el riesgo, solo encarece el ataque"],"senal_de_memorizado":"responde que hay que usar Chainlink sin explicar que propiedad se compra con eso"}'),

(18, 'Un contrato se puede pausar. ¿Que averiguas antes de depositar en el?',
 '["Cuanto gas cuesta ejecutar la pausa y quien lo paga","Si la pausa se anuncia en los canales del proyecto","Quien puede pausar, que se detiene, y si retirar sigue siendo posible con la pausa activa","Si la pausa se levanta sola al cabo de un plazo fijado"]',
 2, 'hard', 'quien-cambia-las-reglas',
 'Una pausa es una herramienta razonable para frenar un ataque, y tambien una forma de atrapar fondos. La pregunta util no es si existe, sino si retirar queda dentro o fuera de lo que se detiene.',
 '¿En que caso te protege y en que caso te perjudica?',
 '{"debe_contener":["que protege si corta la via por la que se pierden fondos","que perjudica si bloquea la retirada y depende de quien la levante","que importa si hay limite de duracion o alguien obligado a reactivar"],"senal_de_memorizado":"dice que es bueno tener pausa o que es malo, sin distinguir segun que se pausa"}'),

(19, 'Un contrato ejecuta codigo de otra direccion en su propio almacenamiento. ¿Que consecuencia tiene?',
 '["Que el gas de esa ejecucion lo paga el contrato al que se delega","Que ese codigo escribe en el almacenamiento de quien llama, con sus mismos permisos","Que las dos direcciones comparten saldo mientras dure la llamada","Que quien llama pierde la capacidad de revertir la transaccion"]',
 1, 'hard', 'de-donde-sale-el-codigo',
 'Es el mecanismo que hace posibles los contratos actualizables, y tambien el que convierte al contrato al que se delega en parte de la superficie de riesgo del que delega: cualquier error suyo se escribe en el estado ajeno.',
 '¿Que pasa si cambian el contrato al que se delega?',
 '{"debe_contener":["que el llamante pasa a ejecutar otra logica sobre el mismo estado, sin mover ni una fila","que quien pueda cambiar ese destino tiene poder total sobre el almacenamiento del llamante","que por eso importa si hay demora o aviso antes de que el cambio surta efecto"],"senal_de_memorizado":"dice que pueden destruirlo con selfdestruct, cuando desde Dencun (EIP-6780) eso solo elimina el contrato si ocurre en la transaccion que lo creo: el riesgo realista es la sustitucion"}'),

(20, 'Repasas un contrato buscando por donde pueden salir los fondos. ¿Que inventario haces?',
 '["Toda funcion que mueva saldo, quien la llama, los permisos ya concedidos y las vias de cambiar el codigo","Unicamente las funciones cuyo nombre indica una retirada de fondos","Las transacciones de los ultimos dias y las direcciones que participaron","El saldo actual del contrato y cuantos usuarios lo tienen depositado"]',
 0, 'expert', 'como-sale-el-dinero',
 'Los fondos no salen solo por la puerta que se llama retirar. Salen por funciones privilegiadas, por permisos concedidos antes, y por un cambio de codigo que crea una puerta nueva. Quien solo mira las retiradas se deja fuera la mayoria de los casos reales.',
 'De esas vias, ¿cual es la mas facil de pasar por alto y por que?',
 '{"debe_contener":["que la posibilidad de cambiar el codigo hace inutil todo el analisis anterior","o bien que las autorizaciones concedidas antes no se ven leyendo el contrato","que el inventario se rehace despues de cada actualizacion"],"senal_de_memorizado":"enumera funciones sin jerarquizar el riesgo ni mencionar las actualizaciones"}'),

-- ── Modulo 3 · Que te vas a encontrar ─────────────────────────────────────────
(21, 'Tienes una transaccion pendiente con numero de secuencia bajo y envias otra con uno mas alto. ¿Que ocurre?',
 '["La segunda se ejecuta antes si paga una comision mayor","Las dos quedan canceladas y hay que volver a enviarlas","La primera se descarta y se ejecuta directamente la segunda","La segunda espera: las transacciones de una cuenta se ejecutan en orden de secuencia"]',
 3, 'hard', 'nonce-y-orden',
 'El numero de secuencia ordena las transacciones de una cuenta y no admite huecos. Una atascada bloquea todas las posteriores, por mucho que paguen. De ahi que se reemplace la atascada en vez de intentar adelantarla.',
 '¿Como se desatasca?',
 '{"debe_contener":["enviar otra con el mismo numero de secuencia y mas comision, para sustituirla","que puede ser una transaccion vacia si solo se quiere liberar la cola","que hasta que entre, las posteriores no se ejecutan"],"senal_de_memorizado":"dice que hay que subir el gas sin mencionar que debe repetirse el mismo numero de secuencia"}'),

(22, 'Dentro de un mismo bloque, ¿quien decide el orden de las transacciones?',
 '["El protocolo las ordena por la hora en que se enviaron a la red","Se ordenan por la comision que paga cada una, de mayor a menor","Quien construye el bloque: puede ordenarlas, añadir las suyas o excluir las ajenas","Un sorteo entre los nodos que han recibido esas transacciones"]',
 2, 'hard', 'nonce-y-orden',
 'El orden dentro del bloque no es una propiedad neutral del sistema: lo elige quien lo construye, y ese margen tiene valor economico. Es la raiz de que una operacion pueda ejecutarse en peores condiciones que las previstas.',
 '¿Como te afecta en una operacion normal y que proteccion tienes?',
 '{"debe_contener":["que la operacion puede ejecutarse a un precio peor que el visto al enviarla","que se limita fijando un resultado minimo aceptable y un plazo de caducidad","que sin ese limite estas aceptando cualquier resultado"],"senal_de_memorizado":"dice MEV o front-running sin describir que proteccion usa quien opera"}'),

(23, 'Una stablecoin centralizada esta respaldada por reservas de su emisor. ¿De que depende que mantenga su valor?',
 '["De que el emisor tenga esas reservas y las entregue cuando se las pidan","Del consenso de la red en la que circulan esos saldos","De la cantidad de unidades que haya en circulacion en cada momento","De la comision que se cobre por cada transferencia del token"]',
 0, 'hard', 'stablecoins',
 'La red garantiza quien tiene cuantas unidades, no lo que valen. El valor descansa en una promesa de un emisor identificable, con su solvencia y su marco legal. Confundir las dos garantias es el error habitual.',
 '¿Que riesgo asumes con esa stablecoin que no asumes con la moneda nativa?',
 '{"debe_contener":["el riesgo de contraparte del emisor, no solo el tecnico","que el emisor puede tener facultades sobre saldos concretos","que la moneda nativa no promete un valor pero tampoco depende de que alguien cumpla"],"senal_de_memorizado":"dice que esta respaldada 1 a 1 repitiendo el eslogan, sin nombrar a quien hay que creer"}'),

(24, 'Muchas stablecoins centralizadas permiten a su emisor bloquear direcciones. ¿Que implica para un contrato que las use?',
 '["Que el contrato pasa a estar bajo el control de ese emisor","Que una transferencia puede fallar por decision del emisor y dejar el contrato atascado","Que las transferencias de ese token tardan mas en confirmarse","Nada relevante: el contrato es inmutable y no le afecta"]',
 1, 'expert', 'stablecoins',
 'El contrato del token puede negarse a mover saldo de o hacia ciertas direcciones. Un contrato que da por hecho que la transferencia siempre funciona puede quedar atascado, incluso perjudicando a terceros ajenos al bloqueo.',
 '¿Como lo diseñarias para que el bloqueo de uno no paralice a los demas?',
 '{"debe_contener":["no dejar que un envio fallido detenga el proceso general","que cada usuario retire lo suyo en vez de repartir en bloque","registrar la deuda y permitir reclamarla despues"],"senal_de_memorizado":"dice que el emisor puede congelar fondos sin conectarlo con el diseño del contrato"}'),

(25, '¿Que informacion te dan los eventos que emite un contrato?',
 '["El estado completo del contrato en el momento de consultarlo","Las transacciones pendientes que todavia no se han incluido","El codigo fuente de las funciones que los han emitido","Un registro de lo ocurrido, pero solo de lo que el codigo decidio emitir"]',
 3, 'hard', 'leer-un-contrato',
 'Los eventos son el rastro que el contrato deja a proposito. Son la via practica para seguir su actividad, con un limite importante: lo que no se emite no aparece, y un cambio que no genera evento es invisible desde fuera.',
 'Dame un cambio relevante que podria no dejar rastro en los eventos.',
 '{"debe_contener":["un ejemplo plausible como un parametro cambiado sin evento, un privilegio asignado en silencio o un cambio de destino mal instrumentado","que entonces hay que leer el estado directamente","que la ausencia de eventos no prueba la ausencia de cambios"],"senal_de_memorizado":"dice que los eventos son logs sin mas"}'),

(26, 'Llamas a una funcion que solo consulta datos, sin modificar nada. ¿Que la distingue?',
 '["Que se ejecuta mas rapido que las que escriben en el estado","Que solo la puede llamar quien tenga privilegios en el contrato","Que se puede ejecutar sin enviar transaccion ni pagar gas, porque no cambia el estado","Que devuelve siempre el mismo valor, sea cuando sea la consulta"]',
 2, 'hard', 'leer-un-contrato',
 'Al no alterar el estado, cualquier nodo puede evaluarla y devolver el resultado sin acuerdo de la red. Es lo que permite inspeccionar un contrato gratis.',
 '¿En que caso una funcion de solo lectura si acaba costando gas?',
 '{"debe_contener":["cuando la llama otro contrato dentro de una transaccion","que la gratuidad viene de consultar a un nodo, no de una propiedad de la funcion","que el computo existe igual y alguien lo paga si ocurre en cadena"],"senal_de_memorizado":"dice que las view son gratis sin la excepcion"}'),

(27, 'Una operacion que consultaste hace un minuto se ejecuta con un resultado peor. Sin culpar a nadie, ¿que ha pasado?',
 '["El estado cambio entre la consulta y la ejecucion, y se aplico sobre el estado nuevo","La red se equivoco al calcular el resultado de esa operacion","Tu transaccion se ejecuto dos veces y la segunda salio peor","El contrato subio sus comisiones entre una cosa y la otra"]',
 0, 'expert', 'nonce-y-orden',
 'Consultar y ejecutar son dos momentos distintos, y en medio cabe cualquier otra transaccion. No hace falta un ataque: basta con que otros hayan actuado antes. Por eso una operacion bien enviada lleva un resultado minimo aceptable.',
 'Si pones un minimo muy ajustado, ¿que te pasa? ¿Y si lo pones muy holgado?',
 '{"debe_contener":["muy ajustado, la operacion revierte a menudo y pagas gas sin resultado","muy holgado, aceptas un resultado malo sin darte cuenta","que es un equilibrio segun cuanto se mueva el estado"],"senal_de_memorizado":"dice que hay que poner slippage sin saber que se gana y se pierde en cada extremo"}'),

(28, 'Vas a revisar un contrato que no conoces. ¿Cual es un orden razonable?',
 '["Leer el codigo completo de arriba abajo antes de nada","Ver si redirige, localizar las funciones restringidas y quien las llama, y seguir las salidas de fondos","Mirar el saldo depositado y cuantos usuarios lo estan usando","Comprobar la fecha de despliegue y el historial de transacciones"]',
 1, 'hard', 'leer-un-contrato',
 'Leer de arriba abajo gasta el tiempo en lo que no decide nada. Lo que decide es donde vive el codigo que se ejecuta, quien tiene poder sobre el y por donde sale el dinero. Lo demas se entiende mejor despues.',
 'De esos tres pasos, ¿cual descarta mas contratos y por que?',
 '{"debe_contener":["que quien tiene privilegios suele decidir rapido si merece seguir","o bien que si el codigo es cambiable, el resto del analisis caduca","que el orden ahorra trabajo porque cada paso puede cerrar la revision"],"senal_de_memorizado":"recita los pasos sin poder decir que descarta cada uno"}'),

(29, 'Un contrato asume que todas las stablecoins usan la misma cantidad de decimales. ¿Que puede fallar?',
 '["Nada: el estandar del token fija los decimales para todos","Que las transferencias tarden mas de lo previsto en confirmarse","Que los importes se calculen con un factor equivocado, en varios ordenes de magnitud","Que el token deje de poder transferirse desde ese contrato"]',
 2, 'expert', 'stablecoins',
 'El numero de decimales lo decide cada token y no es uniforme. Un contrato que lo da por supuesto puede tratar una cantidad pequeña como enorme. No es un redondeo: es un desplazamiento de varios ceros.',
 '¿Como lo evitas, y por que no basta con mirarlo una vez al integrar?',
 '{"debe_contener":["leer los decimales del propio token en vez de suponerlos","normalizar a una escala interna","que cada token nuevo que se acepte vuelve a plantear el problema, y por eso la comprobacion va en el codigo y no en la documentacion"],"senal_de_memorizado":"dice que no todos tienen 18 decimales sin explicar la magnitud del error ni donde va la comprobacion"}'),

(30, 'Dos direcciones dicen ser el mismo token, con identico nombre y simbolo. ¿Que las distingue?',
 '["El nombre completo, que solo puede registrarlo un proyecto","La direccion del contrato: el nombre y el simbolo los elige quien despliega","La cantidad de unidades que cada una tiene en circulacion","El numero de decimales con el que cada una representa su saldo"]',
 1, 'hard', 'leer-un-contrato',
 'Nombre y simbolo son texto sin ninguna garantia de unicidad. Lo unico que identifica un token es su direccion, y de ahi que las listas de direcciones conocidas, y no el buscador, sean la forma de no equivocarse.',
 '¿Como confirmas que una direccion es la del token que crees?',
 '{"debe_contener":["cruzarla con una fuente independiente de quien te la dio","que un explorador puede etiquetarla pero la etiqueta tambien es texto que alguien puso","que ante la duda, mas de una fuente coincidente"],"senal_de_memorizado":"dice que hay que mirar la direccion sin explicar contra que se contrasta"}')

) AS t(n, pregunta, opciones, correcta, dificultad, categoria, porque, repregunta, rubrica)
CROSS JOIN (SELECT id FROM public.instructor_specialties WHERE slug = 'ethereum-contratos') AS esp
WHERE NOT EXISTS (
  SELECT 1 FROM public.instructor_exam_questions q WHERE q.question = t.pregunta
);

-- =====================================================
-- 3. La prueba, y esta vez corre de verdad
-- =====================================================
-- La de la 095 se omitia porque ethereum-contratos no tenia examen. Ya lo tiene.

DO $prueba$
DECLARE
  v_usuario uuid;
  v_examen  uuid;
  v_n       integer;
  v_total   integer;
  v_repes   integer;
BEGIN
  SELECT id INTO v_usuario FROM public.users ORDER BY created_at LIMIT 1;
  SELECT id INTO v_examen FROM public.instructor_exams WHERE slug = 'instructor-exam-ethereum-contratos';

  IF v_usuario IS NULL OR v_examen IS NULL THEN
    RAISE EXCEPTION 'La prueba necesita un usuario y el examen de ethereum-contratos.';
  END IF;

  -- 1. Las treinta estan
  SELECT count(*) INTO v_total
    FROM public.instructor_exam_questions q
    JOIN public.instructor_specialties e ON e.id = q.specialty_id
   WHERE e.slug = 'ethereum-contratos';
  IF v_total <> 30 THEN
    RAISE EXCEPTION 'PRUEBA 1 FALLIDA: el banco tiene % preguntas y deberia tener 30.', v_total;
  END IF;
  RAISE NOTICE 'PRUEBA 1  el banco tiene las 30 preguntas                    PASA';

  -- 2. Un examen completo de 15
  SELECT count(*) INTO v_n FROM public.servir_preguntas(v_usuario, v_examen, 15);
  IF v_n <> 15 THEN
    RAISE EXCEPTION 'PRUEBA 2 FALLIDA: se pidieron 15 y llegaron %.', v_n;
  END IF;
  RAISE NOTICE 'PRUEBA 2  sirve un examen completo de 15                     PASA';

  -- 3. Y el segundo intento no repite ni una
  SELECT count(*) INTO v_n FROM public.servir_preguntas(v_usuario, v_examen, 15);
  IF v_n <> 15 THEN
    RAISE EXCEPTION 'PRUEBA 3 FALLIDA: el segundo intento sirvio % preguntas.', v_n;
  END IF;

  SELECT count(*) INTO v_repes FROM (
    SELECT aq.question_id
      FROM public.instructor_exam_attempt_questions aq
      JOIN public.instructor_exam_attempts a ON a.id = aq.attempt_id
     WHERE a.user_id = v_usuario AND a.exam_id = v_examen
     GROUP BY aq.question_id
    HAVING count(*) > 1
  ) AS repetidas;
  IF v_repes > 0 THEN
    RAISE EXCEPTION 'PRUEBA 3 FALLIDA: % pregunta(s) se repitieron entre los dos intentos.', v_repes;
  END IF;
  RAISE NOTICE 'PRUEBA 3  dos intentos de 15 sin repetir ni una              PASA';

  -- 4. El tercero no cabe: 30 = 15 + 15
  BEGIN
    PERFORM * FROM public.servir_preguntas(v_usuario, v_examen, 15);
    RAISE EXCEPTION 'PRUEBA 4 FALLIDA: sirvio un tercer intento con el banco agotado.';
  EXCEPTION WHEN raise_exception THEN
    IF sqlerrm LIKE 'PRUEBA 4 FALLIDA%' THEN RAISE; END IF;
    RAISE NOTICE 'PRUEBA 4  el tercer intento se niega, banco agotado         PASA';
  END;

  -- 5. Todas las servidas llevan su barajado (096)
  IF EXISTS (
    SELECT 1
      FROM public.instructor_exam_attempt_questions aq
      JOIN public.instructor_exam_attempts a ON a.id = aq.attempt_id
      JOIN public.instructor_exam_questions q ON q.id = aq.question_id
     WHERE a.user_id = v_usuario AND a.exam_id = v_examen
       AND (SELECT array_agg(x ORDER BY x) FROM unnest(aq.orden_opciones) AS x)
           IS DISTINCT FROM ARRAY[0, 1, 2, 3]
  ) THEN
    RAISE EXCEPTION 'PRUEBA 5 FALLIDA: alguna fila no guarda una permutacion completa.';
  END IF;
  RAISE NOTICE 'PRUEBA 5  las 30 servidas llevan su permutacion              PASA';

  -- Los intentos de prueba se borran: si no, este usuario se queda con el banco
  -- agotado y dos intentos fantasma.
  DELETE FROM public.instructor_exam_attempts WHERE user_id = v_usuario AND exam_id = v_examen;
  RAISE NOTICE 'Intentos de prueba borrados. Las cinco pruebas pasan.';
END
$prueba$;

COMMIT;

-- ============================================================================
-- VERIFICACION
-- ============================================================================

SELECT
  (SELECT count(*) FROM public.instructor_exams
    WHERE slug = 'instructor-exam-ethereum-contratos')                            AS examen_creado,
  (SELECT pass_threshold FROM public.instructor_exams
    WHERE slug = 'instructor-exam-ethereum-contratos')                            AS umbral,
  (SELECT total_questions FROM public.instructor_exams
    WHERE slug = 'instructor-exam-ethereum-contratos')                            AS por_intento,

  (SELECT count(*) FROM public.instructor_exam_questions q
    JOIN public.instructor_specialties e ON e.id = q.specialty_id
   WHERE e.slug = 'ethereum-contratos')                                           AS preguntas,

  -- El reparto de la posicion correcta, que era el problema de la primera version
  (SELECT count(*) FROM public.instructor_exam_questions q
    JOIN public.instructor_specialties e ON e.id = q.specialty_id
   WHERE e.slug = 'ethereum-contratos' AND q.correct_answer = 0)                  AS en_la_a,
  (SELECT count(*) FROM public.instructor_exam_questions q
    JOIN public.instructor_specialties e ON e.id = q.specialty_id
   WHERE e.slug = 'ethereum-contratos' AND q.correct_answer = 1)                  AS en_la_b,
  (SELECT count(*) FROM public.instructor_exam_questions q
    JOIN public.instructor_specialties e ON e.id = q.specialty_id
   WHERE e.slug = 'ethereum-contratos' AND q.correct_answer = 2)                  AS en_la_c,
  (SELECT count(*) FROM public.instructor_exam_questions q
    JOIN public.instructor_specialties e ON e.id = q.specialty_id
   WHERE e.slug = 'ethereum-contratos' AND q.correct_answer = 3)                  AS en_la_d,

  (SELECT count(*) FROM public.instructor_exam_questions q
    JOIN public.instructor_specialties e ON e.id = q.specialty_id
   WHERE e.slug = 'ethereum-contratos' AND q.difficulty = 'expert')               AS expertas,
  (SELECT count(*) FROM public.instructor_exam_questions q
    JOIN public.instructor_specialties e ON e.id = q.specialty_id
   WHERE e.slug = 'ethereum-contratos' AND q.oral_followup IS NOT NULL
     AND q.oral_rubric IS NOT NULL)                                               AS con_repregunta_y_rubrica,
  (SELECT count(DISTINCT q.category) FROM public.instructor_exam_questions q
    JOIN public.instructor_specialties e ON e.id = q.specialty_id
   WHERE e.slug = 'ethereum-contratos')                                           AS categorias,

  (SELECT count(*) FROM public.instructor_exam_attempts)                          AS intentos,

  CASE
    WHEN (SELECT count(*) FROM public.instructor_exam_questions q
           JOIN public.instructor_specialties e ON e.id = q.specialty_id
          WHERE e.slug = 'ethereum-contratos') = 30
     AND (SELECT pass_threshold FROM public.instructor_exams
           WHERE slug = 'instructor-exam-ethereum-contratos') = 70
     AND (SELECT total_questions FROM public.instructor_exams
           WHERE slug = 'instructor-exam-ethereum-contratos') = 15
     AND (SELECT count(*) FROM public.instructor_exam_questions q
           JOIN public.instructor_specialties e ON e.id = q.specialty_id
          WHERE e.slug = 'ethereum-contratos' AND q.correct_answer = 0) = 8
     AND (SELECT count(*) FROM public.instructor_exam_questions q
           JOIN public.instructor_specialties e ON e.id = q.specialty_id
          WHERE e.slug = 'ethereum-contratos' AND q.correct_answer = 1) = 7
     AND (SELECT count(*) FROM public.instructor_exam_questions q
           JOIN public.instructor_specialties e ON e.id = q.specialty_id
          WHERE e.slug = 'ethereum-contratos' AND q.correct_answer = 2) = 8
     AND (SELECT count(*) FROM public.instructor_exam_questions q
           JOIN public.instructor_specialties e ON e.id = q.specialty_id
          WHERE e.slug = 'ethereum-contratos' AND q.correct_answer = 3) = 7
     AND (SELECT count(*) FROM public.instructor_exam_questions q
           JOIN public.instructor_specialties e ON e.id = q.specialty_id
          WHERE e.slug = 'ethereum-contratos' AND q.oral_followup IS NOT NULL
            AND q.oral_rubric IS NOT NULL) = 30
      THEN 'TODO CORRECTO'
    ELSE 'REVISAR: mira las columnas de esta misma fila'
  END                                                                             AS veredicto;
