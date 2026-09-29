# Banco de preguntas · `ethereum-contratos` · 30 preguntas

**Segunda versión, con tu revisión aplicada.** Ninguna está en la base todavía.

- Especialidad `ethereum-contratos` · `model_id` a `NULL` · `order_index` a `NULL`
- **19 `hard`, 11 `expert`** · 15 por intento · `pass_threshold` **70**
- Recontado desde el SQL, no a mano: el encabezado de la primera versión decía
  «22 hard, 8 expert» y nadie lo había vuelto a contar tras cambiar la 9 a `expert` y
  la 19 a `hard`
- La correcta va marcada con **→**; en la base, `correct_answer` es el índice (0-3)
- **Las opciones se barajan en cada intento** (`servir_preguntas`, 095), así que la
  posición de esta tabla es solo la del banco

## Recuento por posición

| posición | preguntas | total |
|---|---|---:|
| **a** | 2, 4, 8, 12, 16, 20, 23, 27 | **8** |
| **b** | 6, 11, 15, 19, 24, 28, 30 | **7** |
| **c** | 1, 5, 9, 13, 18, 22, 26, 29 | **8** |
| **d** | 3, 7, 10, 14, 17, 21, 25 | **7** |

Antes: **29 de 30 en la b**, y la correcta era casi siempre la más larga. Ahora las cuatro
opciones de cada pregunta tienen longitud y nivel de detalle comparables, y las incorrectas
son errores que alguien comete de verdad, no rellenos.

---

## Módulo 1 · Qué añadió Ethereum

### 1 · `hard` · estado-y-cuentas
Ethereum lleva un estado con cuentas y saldos; Bitcoin lleva salidas no gastadas. ¿Qué habilita ese cambio?

- a) Que las transacciones se confirmen en menos tiempo que en Bitcoin
- b) Que las comisiones de cada operación sean fijas y previsibles
- **→ c) Que un programa lea y modifique un saldo acumulado sin reconstruirlo de piezas**
- d) Que una transacción pueda enviarse sin firmar con la clave privada

**Por qué.** Con salidas no gastadas, «cuánto tiene esta dirección» es una suma que hay que reconstruir. Con cuentas es un campo que se lee y se escribe, y sobre eso se puede programar lógica que dependa del estado anterior.

**Repregunta.** Si te pido guardar en un contrato cuántas veces ha interactuado cada usuario, ¿por qué es más natural aquí que en Bitcoin?

**Rúbrica.** *Debe contener:* que el estado es un mapa consultable y modificable; que con salidas habría que representar el contador con piezas que se gastan y se recrean; que el coste de leer el estado anterior marca la diferencia. *Señal de memorizado:* repite «Ethereum tiene cuentas y Bitcoin UTXO» sin decir qué se vuelve fácil.

### 2 · `hard` · gas
Una transacción se queda sin gas a mitad de ejecución. ¿Qué ocurre?

- **→ a) Los cambios de estado se revierten y el gas consumido no se devuelve**
- b) Todo se revierte y el gas vuelve íntegro a quien lo envió
- c) Queda en espera hasta que alguien aporte el gas que faltaba
- d) Se conserva la parte de la ejecución que sí cupo en el gas

**Por qué.** El cómputo se hizo: los nodos lo ejecutaron y la comisión base se quema, así que el coste ya está soportado por la red. Devolver el gas volvería gratis intentar cómputos caros. Revertir el estado y reembolsar el pago son dos cosas distintas.

**Repregunta.** ¿Por qué no se devuelve si el resultado se tira?

**Rúbrica.** *Debe contener:* que el trabajo se hizo y tuvo coste real; que devolverlo permitiría agotar la red gratis; la distinción entre revertir el estado y reembolsar. *Suma, no obligatorio:* que la comisión base se quema y solo la propina va a quien propone el bloque. *Señal de memorizado:* dice «se pierde el gas» y no sabe a quién protege eso.

### 3 · `expert` · gas
Un contrato recorre un array cuyo tamaño crece con el número de usuarios. ¿Cuál es el problema de fondo?

- a) Que el array ocupa un espacio de almacenamiento cada vez más caro
- b) Que los arrays de tamaño variable no se pueden recorrer en un contrato
- c) Que leer cada posición del array cuesta gas y eso encarece la llamada
- **→ d) Que llegará un tamaño que no cabe en el límite de gas de un bloque, y la función quedará inutilizable**

**Por qué.** No es que se encarezca: hay un techo por bloque. Si recorrer el array lo supera, no existe precio que haga ejecutable la función, y si de ella depende retirar fondos, los fondos quedan atrapados.

**Repregunta.** ¿Cómo se diseña para que no pueda pasar?

**Rúbrica.** *Debe contener:* que el límite es duro, no un precio alto; que la salida es procesar por lotes o que cada usuario opere sobre su entrada; que el riesgo se agrava si el bucle está en el camino de sacar fondos. *Señal de memorizado:* responde «gastaría mucho gas» sin mencionar el techo por bloque.

### 4 · `hard` · limites-de-un-contrato
Un contrato tiene que transferir fondos el primer día de cada mes. ¿Qué hace falta?

- **→ a) Que alguien envíe una transacción que lo llame: un contrato no se despierta solo**
- b) Nada: se programa la fecha en el código y se ejecuta por su cuenta
- c) Un tipo de bloque reservado para las tareas programadas de los contratos
- d) Dejar gas suficiente depositado para que se ejecute en segundo plano

**Por qué.** El código de un contrato solo corre dentro de una transacción. No hay temporizadores: alguien tiene que pagar y llamar. Los «contratos que se ejecutan solos» siempre tienen a alguien empujando detrás.

**Repregunta.** ¿Quién paga esa llamada mensual y qué pasa si nadie la hace?

**Rúbrica.** *Debe contener:* que hace falta un actor externo que pague el gas; que si nadie llama no pasa nada y el contrato no protesta; que es una dependencia operativa que se diseña. *Señal de memorizado:* dice «necesita un oráculo», confundiendo traer datos con provocar la ejecución.

### 5 · `hard` · limites-de-un-contrato
¿Por qué un contrato no puede consultar por su cuenta el precio de un activo en una web?

- a) Porque los servidores web rechazan las peticiones que vienen de un nodo
- b) Porque no existen librerías que permitan hacer esa consulta desde el código
- **→ c) Porque la ejecución debe dar el mismo resultado en todos los nodos, y una consulta externa no lo garantiza**
- d) Porque la consulta consumiría más gas del que cabe en una transacción

**Por qué.** Cada nodo reejecuta la transacción y debe llegar al mismo estado. Si el código pudiera consultar fuera, dos nodos obtendrían respuestas distintas y no habría acuerdo. De ahí que el dato tenga que entrar dentro de una transacción.

**Repregunta.** Cuando un contrato «usa un precio», ¿de dónde sale y en quién confías?

**Rúbrica.** *Debe contener:* que alguien lo ha escrito en cadena con una transacción; que la confianza se traslada a ese informador y su procedimiento; que hay que preguntar cada cuánto se actualiza y qué pasa si se queda parado. *Señal de memorizado:* dice «usa un oráculo» sin nombrar en quién se confía ni qué falla si el dato es viejo.

### 6 · `hard` · estado-y-cuentas
¿Qué distingue la cuenta de una persona de la de un contrato?

- a) La de contrato no puede tener saldo propio, solo mover el de otras
- **→ b) La de persona se controla con una clave y firma; la de contrato actúa solo cuando su código se ejecuta**
- c) La de persona no puede recibir tokens, únicamente la moneda nativa
- d) Las dos se controlan con una clave privada, pero con formatos distintos

**Por qué.** Una cuenta de contrato no decide nada por su cuenta: nadie firma por ella. Su comportamiento está escrito, y eso la vuelve previsible y también rígida.

**Repregunta.** Si mando fondos a un contrato que no espera recibirlos, ¿qué puede pasar?

**Rúbrica.** *Debe contener:* que puede revertir si no tiene forma de aceptarlos; que si los acepta y no tiene forma de sacarlos quedan atrapados; que no hay clave privada con la que rescatarlos. *Suma, no obligatorio:* que desde Pectra (EIP-7702) una cuenta de persona puede **delegar temporalmente en código**, así que la frontera ya no es tan limpia como «una tiene código y la otra no». *Señal de memorizado:* responde «una tiene clave y la otra código» sin sacar ninguna consecuencia.

### 7 · `expert` · gas
Dos transacciones que hacen lo mismo consumen cantidades de gas muy distintas. ¿Cuál es la explicación?

- a) Una se envió en un momento de congestión y la otra con la red tranquila
- b) El precio del gas depende del historial de cada cuenta que lo paga
- c) Una iba firmada con un algoritmo más costoso de verificar que la otra
- **→ d) Una escribió en una posición de almacenamiento vacía y la otra modificó una ya ocupada**

**Por qué.** Estrenar una posición cuesta bastante más que modificar una ocupada, porque el estado crece de forma permanente para todos los nodos. La congestión mueve el **precio**; esto mueve la **cantidad**.

**Repregunta.** ¿Qué diferencia hay entre precio y cantidad de gas, y cuál controlas tú?

**Rúbrica.** *Debe contener:* que la cantidad la determina el trabajo que hace el código; que la comisión base la fija el protocolo según lo lleno que vaya el bloque, y quien envía elige el máximo que acepta pagar y la propina; que optimizar el contrato baja la cantidad, y esperar solo baja lo que pagas por unidad. *Señal de memorizado:* dice «depende de la congestión» para todo, sin separar las dos cosas.

### 8 · `hard` · estado-y-cuentas
Un contrato desplegado no se puede modificar. ¿Qué implica eso para un error en su código?

- **→ a) El error sigue ahí mientras se use esa dirección: corregirlo es desplegar otro y llevar a la gente**
- b) Se corrige enviando una versión nueva del código a esa misma dirección
- c) Los nodos aplican por su cuenta los parches que publica quien lo desplegó
- d) Solo puede corregirse mientras el contrato no tenga saldo depositado

**Por qué.** La inmutabilidad es la garantía y la trampa. No hay despliegue correctivo sobre la misma dirección, así que un error se arregla migrando, y la migración tiene que convencer a quien ya está dentro.

**Repregunta.** ¿Cómo consiguen algunos proyectos corregir errores sin migrar a nadie?

**Rúbrica.** *Debe contener:* que anteponen un contrato que redirige a otro con el código; que entonces alguien puede cambiar ese destino; que eso reintroduce una autoridad que la inmutabilidad había quitado. *Señal de memorizado:* dice «los contratos son inmutables» y no sabe cómo se esquiva en la práctica.

### 9 · `expert` · limites-de-un-contrato
Un contrato usa la marca de tiempo del bloque como fuente de azar para un sorteo. ¿Cuál es el problema?

- a) Que quien propone el bloque puede ponerle la hora que le convenga
- b) Que un contrato no tiene forma de leer la marca de tiempo del bloque
- **→ c) Que la marca la fija el slot, cada 12 segundos, y es predecible de antemano**
- d) Que cada nodo la calcula por su cuenta y no todos coinciden en su valor

**Por qué.** Tras The Merge los bloques van en slots de 12 segundos y la marca de tiempo es la del slot: quien propone no tiene margen real para elegirla. El problema no es que la manipule, es que **cualquiera sabe qué valor va a tener antes de actuar**, y con eso el resultado del sorteo se calcula por adelantado.

**Repregunta.** ¿Dónde está entonces el margen real de quien propone el bloque?

**Rúbrica.** *Debe contener:* qué transacciones incluye y en qué orden; que puede **no publicar** el bloque, renunciando a su recompensa, para descartar un resultado que no le gusta; que `prevrandao` sustituyó a la dificultad como fuente de azar del protocolo y admite un sesgo pequeño, así que tampoco es azar limpio cuando el premio es grande. *Señal de memorizado:* dice que el proponente elige el timestamp a voluntad — que es exactamente lo que valía **antes** de The Merge.

### 10 · `expert` · gas
Un contrato envía fondos a una dirección y no comprueba el resultado. ¿Cuál es el riesgo?

- a) Que el mismo envío se ejecute dos veces y salga el doble de fondos
- b) Que la transacción no llegue a incluirse en ningún bloque de la cadena
- c) Que el gas consumido se multiplique por el número de intentos
- **→ d) Que el envío falle, el contrato siga como si hubiera salido bien y la contabilidad mienta**

**Por qué.** Hay formas de enviar que no abortan la ejecución: devuelven un valor que indica el fallo. Si nadie lo mira, el contrato marca la deuda como pagada sin haberla pagado, y el desajuste se descubre cuando ya no cuadra nada.

**Repregunta.** ¿Cómo se evita, y por qué no basta con comprobar el valor devuelto?

**Rúbrica.** *Debe contener:* comprobar el resultado y revertir si falla; que además hay que decidir qué pasa con quien no puede recibir; que un patrón más robusto es que el destinatario venga a retirar en vez de que el contrato empuje. *Señal de memorizado:* dice «hay que comprobar el return» sin pensar en el destinatario que bloquea el flujo.

---

## Módulo 2 · Qué decide si algo falla

### 11 · `expert` · de-donde-sale-el-codigo
Has leído el código verificado de una dirección. ¿Qué te falta comprobar antes de confiar en que eso es lo que se ejecutará?

- a) Si el compilador usado era la versión más reciente disponible
- **→ b) Si esa dirección ejecuta su código o reenvía a otro contrato que alguien puede cambiar**
- c) Si el contrato tiene saldo suficiente para atender las retiradas
- d) Si quien lo desplegó publicó también las pruebas automatizadas

**Por qué.** Un contrato que redirige tiene su lógica en otra dirección. Lo que leíste puede ser solo el reenvío. Si existe quien pueda apuntar a otro destino, el código de mañana no es el que has leído hoy.

**Repregunta.** ¿Cómo se ve desde fuera que una dirección redirige, y qué preguntarías después?

**Rúbrica.** *Debe contener:* señales observables (código muy corto, un destino guardado en el estado, eventos de cambio de destino); que hay que averiguar quién puede cambiarlo; si hay demora o aviso antes de que un cambio surta efecto. *Señal de memorizado:* dice «puede ser un proxy» y no sabe qué mirar ni qué preguntar después.

### 12 · `hard` · quien-cambia-las-reglas
Un contrato tiene una función que solo puede llamar una dirección concreta. ¿Qué averiguas primero?

- **→ a) Quién controla esa dirección y qué permite hacer exactamente esa función**
- b) Cuánto gas consume cada llamada a esa función restringida
- c) Si el código de esa función está verificado en el explorador
- d) En qué bloque se desplegó el contrato que la contiene

**Por qué.** «Solo el propietario» no dice nada por sí solo: el riesgo depende de qué permite la función y de quién es esa dirección — una persona con una clave, varias con firma conjunta, o un contrato que impone demora.

**Repregunta.** ¿Qué diferencia práctica hay entre una sola clave y una firma conjunta?

**Rúbrica.** *Debe contener:* que una clave es un único punto de fallo, por robo o pérdida; que la firma conjunta reparte el riesgo pero hay que saber cuántos y quiénes; que una demora obligatoria da tiempo a reaccionar aunque quien manda cambie de idea. *Señal de memorizado:* responde «hay que ver si está descentralizado» sin describir ningún mecanismo.

### 13 · `hard` · como-sale-el-dinero
Autorizas a un contrato a gastar tus tokens sin límite de cantidad. ¿Qué has concedido?

- a) Permiso para una única operación, la que estás haciendo ahora
- b) Permiso limitado a la sesión abierta en esa aplicación web
- **→ c) Permiso para retirar esos tokens cuando quiera, mientras no lo revoques**
- d) Nada efectivo: la autorización caduca al cerrar el navegador

**Por qué.** La autorización vive en el contrato del token y no caduca sola. Sigue viva aunque cierres la web o cambies de dispositivo, y quien pueda cambiar el código autorizado hereda ese permiso.

**Repregunta.** ¿Cómo compruebas qué autorizaciones tienes vivas y cómo se quitan?

**Rúbrica.** *Debe contener:* que se consultan en el contrato del token o con herramientas que las listan; que se revocan poniendo el permiso a cero, y eso cuesta una transacción; que autorizar solo lo necesario reduce el daño si el contrato autorizado cambia o falla. *Señal de memorizado:* dice «es peligroso dar permisos infinitos» sin saber cómo se revisan ni se retiran.

### 14 · `expert` · como-sale-el-dinero
Un contrato envía fondos al exterior y después actualiza su registro interno. ¿Qué abre esa secuencia?

- a) Que la transacción consuma más gas del que sería necesario
- b) Que el envío se pierda si el destinatario no está preparado
- c) Que el registro interno acabe con la entrada duplicada
- **→ d) Que el destinatario vuelva a entrar antes de la actualización y repita la operación**

**Por qué.** Enviar a un contrato le da el control de la ejecución. Si el registro todavía dice que le deben, puede pedir otra vez. El orden correcto es apuntar primero y enviar después.

**Repregunta.** Además de reordenar, ¿qué otra medida usarías, y por qué no basta una sola?

**Rúbrica.** *Debe contener:* un cerrojo que impida reentrar mientras la función está en curso; que el orden «apuntar y luego enviar» es la defensa estructural; que juntas cubren caminos distintos, incluidos los que pasan por otras funciones del mismo contrato. *Señal de memorizado:* dice «reentrancy, se arregla con un guard» sin mencionar el orden de las operaciones.

### 15 · `hard` · quien-cambia-las-reglas
Un proyecto anuncia que ha renunciado al control de su contrato. ¿Qué compruebas?

- a) Que lo anuncie en su web y en sus canales oficiales
- **→ b) Que en el estado ya no hay privilegios usables, y que no quedan otras vías con privilegio**
- c) Que el contrato se haya quedado sin saldo depositado
- d) Que el código fuente se haya retirado del explorador

**Por qué.** Renunciar es una operación con efecto observable en el estado. Y una sola renuncia no basta: puede quedar otra función privilegiada, un contrato intermedio que redirige, o un permiso concedido antes que sigue vivo.

**Repregunta.** ¿Qué privilegio puede quedar aunque ya no haya propietario?

**Rúbrica.** *Debe contener:* al menos uno concreto (cambiar el destino de la redirección, una función de pausa, una lista de direcciones bloqueadas, una autorización concedida antes); que hay que revisar todas las funciones restringidas; que la ausencia de propietario puede además dejar el contrato sin forma de arreglarse. *Señal de memorizado:* dice «hay que comprobar que hicieron renounce» y se queda ahí.

### 16 · `hard` · de-donde-sale-el-codigo
¿Qué significa que el código de un contrato esté verificado en un explorador?

- **→ a) Que el código publicado compila al que está en cadena; nada dice de si es correcto**
- b) Que alguien ha auditado su seguridad y no ha encontrado fallos
- c) Que el proyecto está registrado ante el explorador que lo muestra
- d) Que el contrato ha pasado las pruebas que exige el estándar del token

**Por qué.** Verificar es una comprobación de correspondencia, no de calidad. Permite leer lo que se ejecuta, que es imprescindible, pero un contrato verificado puede estar mal diseñado o ser abusivo a la vista de todos.

**Repregunta.** ¿Qué te dice de verdad una verificación, y qué tendrías que hacer después?

**Rúbrica.** *Debe contener:* que garantiza correspondencia entre fuente y bytecode; que habilita la lectura pero no sustituye a revisar privilegios y salidas de fondos; que sin verificación te quedas leyendo bytecode, que es mucho peor. *Señal de memorizado:* confunde verificado con auditado.

### 17 · `expert` · como-sale-el-dinero
Un contrato reparte según un precio que lee de otro contrato. ¿Cuál es el fallo estructural?

- a) Que leer ese precio consume gas en cada reparto que se hace
- b) Que el precio cambia con el tiempo y el reparto queda desfasado
- c) Que hace falta un oráculo y eso añade una dependencia externa
- **→ d) Que si el precio se puede mover en la misma transacción, quien lo mueva decide el reparto**

**Por qué.** El problema no es que el precio varíe, es que sea influible por quien se beneficia y en el mismo instante en que se usa. Una medida tomada de una fuente que el interesado puede empujar no es una medida.

**Repregunta.** ¿Qué haría a esa fuente de precio más difícil de empujar?

**Rúbrica.** *Debe contener:* usar un valor promediado en el tiempo en vez del instantáneo; combinar fuentes independientes; que ninguna medida elimina el riesgo, solo encarece el ataque. *Señal de memorizado:* responde «hay que usar Chainlink» sin explicar qué propiedad se compra con eso.

### 18 · `hard` · quien-cambia-las-reglas
Un contrato se puede pausar. ¿Qué averiguas antes de depositar en él?

- a) Cuánto gas cuesta ejecutar la pausa y quién lo paga
- b) Si la pausa se anuncia en los canales del proyecto
- **→ c) Quién puede pausar, qué se detiene, y si retirar sigue siendo posible con la pausa activa**
- d) Si la pausa se levanta sola al cabo de un plazo fijado

**Por qué.** Una pausa es una herramienta razonable para frenar un ataque, y también una forma de atrapar fondos. La pregunta útil no es si existe, sino si retirar queda dentro o fuera de lo que se detiene.

**Repregunta.** ¿En qué caso te protege y en qué caso te perjudica?

**Rúbrica.** *Debe contener:* que protege si corta la vía por la que se pierden fondos; que perjudica si bloquea la retirada y depende de quién la levante; que importa si hay límite de duración o alguien obligado a reactivar. *Señal de memorizado:* dice «es bueno tener pausa» o «es malo» sin distinguir según qué se pausa.

### 19 · `hard` · de-donde-sale-el-codigo
Un contrato ejecuta código de otra dirección **en su propio almacenamiento**. ¿Qué consecuencia tiene?

- a) Que el gas de esa ejecución lo paga el contrato al que se delega
- **→ b) Que ese código escribe en el almacenamiento de quien llama, con sus mismos permisos**
- c) Que las dos direcciones comparten saldo mientras dure la llamada
- d) Que quien llama pierde la capacidad de revertir la transacción

**Por qué.** Es el mecanismo que hace posibles los contratos actualizables, y también el que convierte al contrato al que se delega en parte de la superficie de riesgo del que delega: cualquier error suyo se escribe en el estado ajeno.

**Repregunta.** ¿Qué pasa si **cambian** el contrato al que se delega?

**Rúbrica.** *Debe contener:* que el llamante pasa a ejecutar otra lógica sobre el mismo estado, sin mover ni una fila; que quien pueda cambiar ese destino tiene poder total sobre el almacenamiento del llamante; que por eso importa si hay demora o aviso antes de que el cambio surta efecto. *Señal de memorizado:* dice que pueden **destruirlo con selfdestruct** — desde Dencun (EIP-6780) eso solo elimina el contrato si ocurre en la misma transacción en que se creó, así que el riesgo realista es la sustitución, no la destrucción.

### 20 · `expert` · como-sale-el-dinero
Repasas un contrato buscando por dónde pueden salir los fondos. ¿Qué inventario haces?

- **→ a) Toda función que mueva saldo, quién la llama, los permisos ya concedidos y las vías de cambiar el código**
- b) Únicamente las funciones cuyo nombre indica una retirada de fondos
- c) Las transacciones de los últimos días y las direcciones que participaron
- d) El saldo actual del contrato y cuántos usuarios lo tienen depositado

**Por qué.** Los fondos no salen solo por la puerta que se llama «retirar». Salen por funciones privilegiadas, por permisos concedidos antes, y por un cambio de código que crea una puerta nueva. Quien solo mira las retiradas se deja fuera la mayoría de los casos reales.

**Repregunta.** De esas vías, ¿cuál es la más fácil de pasar por alto y por qué?

**Rúbrica.** *Debe contener:* que la posibilidad de cambiar el código hace inútil todo el análisis anterior; o bien que las autorizaciones concedidas antes no se ven leyendo el contrato; que el inventario se rehace después de cada actualización. *Señal de memorizado:* enumera funciones sin jerarquizar el riesgo ni mencionar las actualizaciones.

---

## Módulo 3 · Qué te vas a encontrar

### 21 · `hard` · nonce-y-orden
Tienes una transacción pendiente con número de secuencia bajo y envías otra con uno más alto. ¿Qué ocurre?

- a) La segunda se ejecuta antes si paga una comisión mayor
- b) Las dos quedan canceladas y hay que volver a enviarlas
- c) La primera se descarta y se ejecuta directamente la segunda
- **→ d) La segunda espera: las transacciones de una cuenta se ejecutan en orden de secuencia**

**Por qué.** El número de secuencia ordena las transacciones de una cuenta y no admite huecos. Una atascada bloquea todas las posteriores, por mucho que paguen. De ahí que se reemplace la atascada en vez de intentar adelantarla.

**Repregunta.** ¿Cómo se desatasca?

**Rúbrica.** *Debe contener:* enviar otra con el **mismo** número de secuencia y más comisión, para sustituirla; que puede ser una transacción vacía si solo se quiere liberar la cola; que hasta que entre, las posteriores no se ejecutan. *Señal de memorizado:* dice «hay que subir el gas» sin mencionar que debe repetirse el mismo número de secuencia.

### 22 · `hard` · nonce-y-orden
Dentro de un mismo bloque, ¿quién decide el orden de las transacciones?

- a) El protocolo las ordena por la hora en que se enviaron a la red
- b) Se ordenan por la comisión que paga cada una, de mayor a menor
- **→ c) Quien construye el bloque: puede ordenarlas, añadir las suyas o excluir las ajenas**
- d) Un sorteo entre los nodos que han recibido esas transacciones

**Por qué.** El orden dentro del bloque no es una propiedad neutral del sistema: lo elige quien lo construye, y ese margen tiene valor económico. Es la raíz de que una operación pueda ejecutarse en peores condiciones que las previstas.

**Repregunta.** ¿Cómo te afecta en una operación normal y qué protección tienes?

**Rúbrica.** *Debe contener:* que la operación puede ejecutarse a un precio peor que el visto al enviarla; que se limita fijando un resultado mínimo aceptable y un plazo de caducidad; que sin ese límite estás aceptando cualquier resultado. *Señal de memorizado:* dice «MEV» o «front-running» sin describir qué protección usa quien opera.

### 23 · `hard` · stablecoins
Una stablecoin centralizada está respaldada por reservas de su emisor. ¿De qué depende que mantenga su valor?

- **→ a) De que el emisor tenga esas reservas y las entregue cuando se las pidan**
- b) Del consenso de la red en la que circulan esos saldos
- c) De la cantidad de unidades que haya en circulación en cada momento
- d) De la comisión que se cobre por cada transferencia del token

**Por qué.** La red garantiza quién tiene cuántas unidades, no lo que valen. El valor descansa en una promesa de un emisor identificable, con su solvencia y su marco legal. Confundir las dos garantías es el error habitual.

**Repregunta.** ¿Qué riesgo asumes con esa stablecoin que no asumes con la moneda nativa?

**Rúbrica.** *Debe contener:* el riesgo de contraparte del emisor, no solo el técnico; que el emisor puede tener facultades sobre saldos concretos; que la moneda nativa no promete un valor pero tampoco depende de que alguien cumpla. *Señal de memorizado:* dice «está respaldada 1:1» repitiendo el eslogan, sin nombrar a quién hay que creer.

### 24 · `expert` · stablecoins
Muchas stablecoins centralizadas permiten a su emisor bloquear direcciones. ¿Qué implica para un contrato que las use?

- a) Que el contrato pasa a estar bajo el control de ese emisor
- **→ b) Que una transferencia puede fallar por decisión del emisor y dejar el contrato atascado**
- c) Que las transferencias de ese token tardan más en confirmarse
- d) Nada relevante: el contrato es inmutable y no le afecta

**Por qué.** El contrato del token puede negarse a mover saldo de o hacia ciertas direcciones. Un contrato que da por hecho que la transferencia siempre funciona puede quedar atascado, incluso perjudicando a terceros ajenos al bloqueo.

**Repregunta.** ¿Cómo lo diseñarías para que el bloqueo de uno no paralice a los demás?

**Rúbrica.** *Debe contener:* no dejar que un envío fallido detenga el proceso general; que cada usuario retire lo suyo en vez de repartir en bloque; registrar la deuda y permitir reclamarla después. *Señal de memorizado:* dice «el emisor puede congelar fondos» sin conectarlo con el diseño del contrato.

### 25 · `hard` · leer-un-contrato
¿Qué información te dan los eventos que emite un contrato?

- a) El estado completo del contrato en el momento de consultarlo
- b) Las transacciones pendientes que todavía no se han incluido
- c) El código fuente de las funciones que los han emitido
- **→ d) Un registro de lo ocurrido, pero solo de lo que el código decidió emitir**

**Por qué.** Los eventos son el rastro que el contrato deja a propósito. Son la vía práctica para seguir su actividad, con un límite importante: lo que no se emite no aparece, y un cambio que no genera evento es invisible desde fuera.

**Repregunta.** Dame un cambio relevante que podría no dejar rastro en los eventos.

**Rúbrica.** *Debe contener:* un ejemplo plausible (un parámetro cambiado sin evento, un privilegio asignado en silencio, un cambio de destino mal instrumentado); que entonces hay que leer el estado directamente; que la ausencia de eventos no prueba la ausencia de cambios. *Señal de memorizado:* dice «los eventos son logs» sin más.

### 26 · `hard` · leer-un-contrato
Llamas a una función que solo consulta datos, sin modificar nada. ¿Qué la distingue?

- a) Que se ejecuta más rápido que las que escriben en el estado
- b) Que solo la puede llamar quien tenga privilegios en el contrato
- **→ c) Que se puede ejecutar sin enviar transacción ni pagar gas, porque no cambia el estado**
- d) Que devuelve siempre el mismo valor, sea cuando sea la consulta

**Por qué.** Al no alterar el estado, cualquier nodo puede evaluarla y devolver el resultado sin acuerdo de la red. Es lo que permite inspeccionar un contrato gratis.

**Repregunta.** ¿En qué caso una función de solo lectura sí acaba costando gas?

**Rúbrica.** *Debe contener:* cuando la llama otro contrato dentro de una transacción; que la gratuidad viene de consultar a un nodo, no de una propiedad de la función; que el cómputo existe igual y alguien lo paga si ocurre en cadena. *Señal de memorizado:* dice «las view son gratis» sin la excepción.

### 27 · `expert` · nonce-y-orden
Una operación que consultaste hace un minuto se ejecuta con un resultado peor. Sin culpar a nadie, ¿qué ha pasado?

- **→ a) El estado cambió entre la consulta y la ejecución, y se aplicó sobre el estado nuevo**
- b) La red se equivocó al calcular el resultado de esa operación
- c) Tu transacción se ejecutó dos veces y la segunda salió peor
- d) El contrato subió sus comisiones entre una cosa y la otra

**Por qué.** Consultar y ejecutar son dos momentos distintos, y en medio cabe cualquier otra transacción. No hace falta un ataque: basta con que otros hayan actuado antes. Por eso una operación bien enviada lleva un resultado mínimo aceptable.

**Repregunta.** Si pones un mínimo muy ajustado, ¿qué te pasa? ¿Y si lo pones muy holgado?

**Rúbrica.** *Debe contener:* muy ajustado, la operación revierte a menudo y pagas gas sin resultado; muy holgado, aceptas un resultado malo sin darte cuenta; que es un equilibrio según cuánto se mueva el estado. *Señal de memorizado:* dice «hay que poner slippage» sin saber qué se gana y se pierde en cada extremo.

### 28 · `hard` · leer-un-contrato
Vas a revisar un contrato que no conoces. ¿Cuál es un orden razonable?

- a) Leer el código completo de arriba abajo antes de nada
- **→ b) Ver si redirige, localizar las funciones restringidas y quién las llama, y seguir las salidas de fondos**
- c) Mirar el saldo depositado y cuántos usuarios lo están usando
- d) Comprobar la fecha de despliegue y el historial de transacciones

**Por qué.** Leer de arriba abajo gasta el tiempo en lo que no decide nada. Lo que decide es dónde vive el código que se ejecuta, quién tiene poder sobre él y por dónde sale el dinero. Lo demás se entiende mejor después.

**Repregunta.** De esos tres pasos, ¿cuál descarta más contratos y por qué?

**Rúbrica.** *Debe contener:* que quién tiene privilegios suele decidir rápido si merece seguir; o bien que si el código es cambiable, el resto del análisis caduca; que el orden ahorra trabajo porque cada paso puede cerrar la revisión. *Señal de memorizado:* recita los pasos sin poder decir qué descarta cada uno.

### 29 · `expert` · stablecoins
Un contrato asume que todas las stablecoins usan la misma cantidad de decimales. ¿Qué puede fallar?

- a) Nada: el estándar del token fija los decimales para todos
- b) Que las transferencias tarden más de lo previsto en confirmarse
- **→ c) Que los importes se calculen con un factor equivocado, en varios órdenes de magnitud**
- d) Que el token deje de poder transferirse desde ese contrato

**Por qué.** El número de decimales lo decide cada token y no es uniforme. Un contrato que lo da por supuesto puede tratar una cantidad pequeña como enorme. No es un redondeo: es un desplazamiento de varios ceros.

**Repregunta.** ¿Cómo lo evitas, y por qué no basta con mirarlo una vez al integrar?

**Rúbrica.** *Debe contener:* leer los decimales del propio token en vez de suponerlos; normalizar a una escala interna; que cada token nuevo que se acepte vuelve a plantear el problema, y por eso la comprobación va en el código y no en la documentación. *Señal de memorizado:* dice «no todos tienen 18 decimales» sin explicar la magnitud del error ni dónde va la comprobación.

### 30 · `hard` · leer-un-contrato
Dos direcciones dicen ser el mismo token, con idéntico nombre y símbolo. ¿Qué las distingue?

- a) El nombre completo, que solo puede registrarlo un proyecto
- **→ b) La dirección del contrato: el nombre y el símbolo los elige quien despliega**
- c) La cantidad de unidades que cada una tiene en circulación
- d) El número de decimales con el que cada una representa su saldo

**Por qué.** Nombre y símbolo son texto sin ninguna garantía de unicidad. Lo único que identifica un token es su dirección, y de ahí que las listas de direcciones conocidas, y no el buscador, sean la forma de no equivocarse.

**Repregunta.** ¿Cómo confirmas que una dirección es la del token que crees?

**Rúbrica.** *Debe contener:* cruzarla con una fuente independiente de quien te la dio; que un explorador puede etiquetarla pero la etiqueta también es texto que alguien puso; que ante la duda, más de una fuente coincidente. *Señal de memorizado:* dice «hay que mirar la dirección» sin explicar contra qué se contrasta.

---

## Qué cambió en esta versión

| pregunta | cambio |
|---|---|
| **todas** | posición de la correcta repartida (8/7/8/7), y las cuatro opciones de cada una con longitud y detalle comparables |
| **9** | **reescrita.** Tras The Merge la marca de tiempo la fija el slot de 12 s y quien propone no tiene margen real: el problema es que es **predecible**. La rúbrica recoge dónde está el margen real —qué incluye, en qué orden, no publicar— y el sesgo de `prevrandao`. La señal de memorizado es ahora **la creencia caducada** |
| **19** | repregunta y rúbrica. Desde Dencun (EIP-6780) `SELFDESTRUCT` solo elimina si ocurre en la transacción que creó el contrato: el riesgo real es **que lo cambien**, no que lo destruyan |
| **6** | rúbrica, punto que suma y no obligatorio: desde Pectra (EIP-7702) una cuenta de persona puede **delegar temporalmente en código** |
| **2** | *(hallado en la revisión)* la explicación decía que el gas lo cobra quien ejecuta. Tras EIP-1559 la **comisión base se quema** y solo la propina va a quien propone. Añadido como punto que suma |
| **7** | *(hallado en la revisión)* la rúbrica decía que el precio «lo determina la demanda y quien envía lo propone». Tras EIP-1559 la **comisión base la fija el protocolo** según lo lleno que vaya el bloque; quien envía elige el máximo y la propina |

**Revisadas y sin cambios** por The Merge, Dencun o Pectra: 1, 3, 4, 5, 8, 10–18, 20–30. Los
puntos que miré y siguen válidos: el techo de gas por bloque (3), que un contrato no se
despierta solo —tampoco con 7702, que delega pero no programa— (4), que escribir en una
posición nueva cuesta más que en una ocupada (7, sigue siendo cierto tras EIP-2929/3529),
la autorización sin límite de ERC-20 (13), quién ordena dentro del bloque (22), y el coste
de una función de solo lectura llamada desde otro contrato (26).

## Lo acordado

- **15 preguntas por intento**, sin repetir las ya servidas (095)
- **`pass_threshold` 70** para el examen de `ethereum-contratos`, a revisar tras los
  primeros candidatos
- Las opciones **se barajan en cada intento**, y la correspondencia se guarda en el
  servidor (`orden_opciones`)

## Lo que falta para insertarlas

`ethereum-contratos` **no tiene examen**: los cuatro que hay son de `bitcoin-fundamentos`,
`seguridad-custodia`, `web3` y `mercados-trading`. La migración que inserte estas 30 tiene
que crear también `instructor-exam-ethereum-contratos` con `pass_threshold` 70 y
`total_questions` 15.
