# Banco de preguntas · `ethereum-contratos` · 30 preguntas

**Para revisar antes de insertar.** Ninguna está en la base todavía.

- Especialidad: `ethereum-contratos` · `model_id` a `NULL` · `order_index` a `NULL`
- Dificultad: 22 `hard`, 8 `expert`
- Cada pregunta lleva `oral_followup` (la repregunta en voz alta) y `oral_rubric`
  (`debe_contener` + `senal_de_memorizado`)
- La opción correcta va marcada con **→**. En la base, `correct_answer` es el índice (0-3)

**Territorio.** Las 30 se apoyan en los tres módulos del curso *Ethereum y contratos
inteligentes*: qué añadió Ethereum (estado con cuentas, gas, lo que un contrato no puede
hacer), qué decide si algo falla (de dónde sale el código que se ejecuta, quién puede
cambiar las reglas después, cómo sale el dinero de un contrato) y qué te vas a encontrar
(nonce y orden, stablecoins, cómo leer un contrato).

**Nada de juicios de inversión.** Ninguna pregunta valora si algo es buena idea como
inversión; todas preguntan por cómo funciona y qué falla.

---

## Módulo 1 · Qué añadió Ethereum (10)

### 1 · `hard` · categoría: estado-y-cuentas
Bitcoin lleva la cuenta de salidas no gastadas; Ethereum lleva un estado con cuentas y saldos. ¿Qué habilita ese cambio que el modelo de salidas hace incómodo?

- a) Confirmar transacciones más rápido
- **→ b) Que un programa consulte y modifique un saldo acumulado sin reconstruirlo a partir de piezas anteriores**
- c) Que las comisiones sean fijas
- d) Que las transacciones no necesiten firma

**Por qué.** Con salidas no gastadas, «cuánto tiene esta dirección» es una suma que hay que reconstruir. Con cuentas, el saldo es un campo que se lee y se escribe, y sobre eso se puede programar lógica que dependa del estado anterior.

**Repregunta.** Si te pido guardar en un contrato cuántas veces ha interactuado cada usuario, ¿por qué es más natural en Ethereum que en Bitcoin?

**Rúbrica.** *Debe contener:* que el estado es un mapa consultable y modificable directamente; que en el modelo de salidas habría que representar ese contador con piezas que se gastan y se recrean; que el coste de leer el estado anterior es lo que marca la diferencia. *Señal de memorizado:* repite «Ethereum tiene cuentas y Bitcoin UTXO» sin poder decir qué se vuelve fácil.

### 2 · `hard` · categoría: gas
Una transacción se queda sin gas a mitad de ejecución. ¿Qué ocurre?

- a) Se revierte y se devuelve el gas
- **→ b) Los cambios de estado se revierten, pero el gas consumido no se devuelve**
- c) Queda en cola hasta que alguien pague el resto
- d) Se ejecuta la parte que cupo y se conserva

**Por qué.** El gas paga el trabajo ya hecho por quien ejecutó, aunque el resultado se descarte. Revertir el estado y devolver el gas convertiría el cómputo en gratis y abriría la puerta a agotar la red sin coste.

**Repregunta.** ¿Por qué no se devuelve el gas si el resultado se tira?

**Rúbrica.** *Debe contener:* que el trabajo se hizo y alguien lo pagó; que devolverlo haría gratis intentar cómputos caros; la distinción entre revertir el estado y reembolsar el pago. *Señal de memorizado:* dice «se pierde el gas» y no puede explicar a quién protege eso.

### 3 · `expert` · categoría: gas
Un contrato recorre un array cuya longitud crece con los usuarios. ¿Cuál es el problema de fondo?

- a) Que el array ocupa demasiado espacio
- b) Que los arrays no están soportados
- **→ c) Que llegará un tamaño en el que la operación no cabe en el límite de gas de un bloque, y la función queda inutilizable para siempre**
- d) Que hay que pagar gas por leer

**Por qué.** No es que se encarezca: es que hay un techo por bloque. Si recorrer el array supera ese techo, no existe precio que haga ejecutable la función, y si de ella depende retirar fondos, los fondos quedan atrapados.

**Repregunta.** ¿Cómo se diseña eso para que no pueda pasar?

**Rúbrica.** *Debe contener:* que el problema es un límite duro, no un precio alto; que la solución es procesar por lotes o que cada usuario opere sobre su propia entrada; que el riesgo se agrava si el bucle está en el camino de sacar fondos. *Señal de memorizado:* responde «gastaría mucho gas» sin mencionar el techo por bloque.

### 4 · `hard` · categoría: limites-de-un-contrato
Un contrato tiene que transferir fondos cada primer día de mes. ¿Qué hace falta?

- a) Nada, se programa con una fecha y se ejecuta solo
- **→ b) Que alguien envíe una transacción que lo llame; un contrato no puede despertarse por su cuenta**
- c) Un bloque especial reservado para tareas programadas
- d) Aumentar el gas para que se ejecute en segundo plano

**Por qué.** El código de un contrato solo corre dentro de una transacción. No hay temporizadores: alguien —una persona o un servicio— tiene que pagar y llamar. Los «contratos que se ejecutan solos» siempre tienen a alguien empujando detrás.

**Repregunta.** ¿Quién paga esa llamada mensual, y qué pasa si nadie la hace?

**Rúbrica.** *Debe contener:* que hace falta un actor externo que pague el gas; que si nadie llama, no pasa nada y el contrato no protesta; que eso es una dependencia operativa que hay que diseñar, no un detalle. *Señal de memorizado:* dice «necesita un oráculo» confundiendo traer datos con provocar la ejecución.

### 5 · `hard` · categoría: limites-de-un-contrato
¿Por qué un contrato no puede consultar por sí mismo el precio de un activo en una web?

- a) Porque las webs lo bloquean
- **→ b) Porque la ejecución tiene que dar el mismo resultado en todos los nodos, y una consulta externa no lo garantiza**
- c) Porque no hay librerías para hacerlo
- d) Porque costaría demasiado gas

**Por qué.** Cada nodo reejecuta la transacción y debe llegar al mismo estado. Si el código pudiera consultar fuera, dos nodos obtendrían respuestas distintas y no habría acuerdo. De ahí que el dato tenga que entrar como parte de una transacción.

**Repregunta.** Entonces, cuando un contrato «usa un precio», ¿de dónde sale y en quién estás confiando?

**Rúbrica.** *Debe contener:* que alguien lo ha escrito en cadena mediante una transacción; que la confianza se traslada a ese informador y a su procedimiento; que conviene preguntarse cada cuánto se actualiza y qué pasa si se queda parado. *Señal de memorizado:* dice «usa un oráculo» y no puede nombrar en quién se confía ni qué falla si el dato es viejo.

### 6 · `hard` · categoría: estado-y-cuentas
¿Qué diferencia hay entre una cuenta de una persona y una de contrato?

- a) Ninguna, las dos tienen clave privada
- **→ b) La de persona se controla con una clave privada y firma; la de contrato no tiene clave y solo actúa cuando su código se ejecuta**
- c) La de contrato no puede tener saldo
- d) La de persona no puede recibir tokens

**Por qué.** Una cuenta de contrato no puede iniciar nada por decisión propia: no hay nadie que firme por ella. Su comportamiento está escrito, y eso es lo que la vuelve previsible y también lo que la vuelve rígida.

**Repregunta.** Si mando fondos a la dirección de un contrato que no espera recibirlos, ¿qué puede pasar?

**Rúbrica.** *Debe contener:* que puede revertir si no tiene forma de aceptarlos; que si los acepta y no tiene forma de sacarlos, quedan atrapados; que no hay clave privada con la que rescatarlos. *Señal de memorizado:* responde «una tiene clave y la otra código» sin extraer la consecuencia práctica.

### 7 · `expert` · categoría: gas
Dos transacciones que hacen lo mismo pagan gas muy distinto. ¿Cuál es la explicación más probable?

- a) Una se envió en hora punta
- **→ b) Una escribió en una posición de almacenamiento nueva y la otra modificó una que ya tenía valor**
- c) El precio del gas cambia por usuario
- d) Una iba firmada con otro algoritmo

**Por qué.** Escribir en una posición vacía cuesta bastante más que modificar una ya ocupada, porque el estado crece de forma permanente para todos los nodos. La congestión mueve el **precio** del gas; esto mueve la **cantidad**.

**Repregunta.** ¿Qué distingue el precio del gas de la cantidad de gas, y cuál controlas tú?

**Rúbrica.** *Debe contener:* que la cantidad la determina el trabajo que hace el código; que el precio lo determina la demanda del momento y quien envía lo propone; que optimizar el contrato baja la cantidad y esperar solo baja el precio. *Señal de memorizado:* dice «depende de la congestión» para todo, sin separar las dos cosas.

### 8 · `hard` · categoría: estado-y-cuentas
Un contrato desplegado no se puede modificar. ¿Qué implicación tiene esto para un error en su código?

- a) Se corrige enviando una actualización a la misma dirección
- **→ b) El error sigue ahí mientras se use esa dirección; corregirlo significa desplegar otro contrato y llevar a la gente a él**
- c) Los nodos aplican el parche automáticamente
- d) Solo se puede corregir si el contrato tiene saldo

**Por qué.** La inmutabilidad es la garantía y la trampa. No hay despliegue correctivo sobre la misma dirección, así que un error se arregla migrando —y la migración tiene que convencer a quien ya está dentro.

**Repregunta.** ¿Y cómo consiguen algunos proyectos corregir errores sin migrar a nadie?

**Rúbrica.** *Debe contener:* que anteponen un contrato que redirige a otro con el código; que entonces alguien puede cambiar ese destino; que eso reintroduce una autoridad que la inmutabilidad había quitado. *Señal de memorizado:* dice «los contratos son inmutables» y no sabe cómo se esquiva en la práctica.

### 9 · `hard` · categoría: limites-de-un-contrato
¿Por qué un contrato no debe usar la marca de tiempo del bloque para decidir un sorteo?

- a) Porque no tiene acceso a esa marca
- **→ b) Porque quien construye el bloque tiene margen para elegirla, y con ella el resultado**
- c) Porque las fechas no se pueden comparar
- d) Porque gasta demasiado gas

**Por qué.** Todo lo que está dentro del bloque lo influye quien lo construye. Una fuente de azar que el interesado puede mover no es azar. Lo mismo vale para el hash del bloque o el saldo del contrato.

**Repregunta.** Dame otra fuente de azar que parezca buena y también sea manipulable, y di por quién.

**Rúbrica.** *Debe contener:* al menos un ejemplo concreto (hash del bloque, número de bloque, saldo del contrato, datos de la propia transacción); quién lo controla en cada caso; que la salida obliga a traer azar de fuera con un procedimiento verificable. *Señal de memorizado:* responde «el timestamp se puede manipular» sin generalizar a lo demás del bloque.

### 10 · `expert` · categoría: gas
Un contrato envía fondos a una dirección y deja el resultado sin comprobar. ¿Cuál es el riesgo?

- a) Que se envíen dos veces
- **→ b) Que el envío falle, el contrato siga como si hubiera salido bien y la contabilidad quede mintiendo**
- c) Que la transacción no se incluya en ningún bloque
- d) Que el gas se multiplique

**Por qué.** Hay formas de enviar que no abortan la ejecución: devuelven un valor que indica el fallo. Si nadie lo mira, el contrato marca la deuda como pagada sin haberla pagado, y el desajuste solo se descubre cuando ya no cuadra nada.

**Repregunta.** ¿Cómo se evita, y por qué no basta con «comprobar el valor devuelto»?

**Rúbrica.** *Debe contener:* comprobar el resultado y revertir si falla; que además hay que decidir qué pasa con el destinatario que no puede recibir; que un patrón más robusto es que el destinatario venga a retirar en vez de que el contrato empuje. *Señal de memorizado:* dice «hay que comprobar el return» sin pensar en el destinatario que bloquea el flujo.

---

## Módulo 2 · Qué decide si algo falla (10)

### 11 · `expert` · categoría: de-donde-sale-el-codigo
Interactúas con una dirección cuyo código fuente está verificado y lo has leído. ¿Qué te falta por comprobar antes de confiar en que eso es lo que se va a ejecutar?

- a) Nada, el código verificado es suficiente
- **→ b) Si esa dirección ejecuta su propio código o reenvía la ejecución a otro contrato que alguien puede cambiar**
- c) Si el contrato tiene saldo suficiente
- d) Si el compilador era la última versión

**Por qué.** Un contrato que redirige tiene su lógica en otra dirección. Lo que leíste puede ser solo el reenvío. Si existe quien pueda apuntar a otro destino, el código de mañana no es el que has leído hoy.

**Repregunta.** ¿Cómo se ve desde fuera que una dirección redirige, y qué preguntarías después?

**Rúbrica.** *Debe contener:* señales observables (código muy corto, un destino guardado en el estado, eventos de cambio de destino); que hay que averiguar quién puede cambiarlo; si hay demora o aviso antes de que un cambio surta efecto. *Señal de memorizado:* dice «puede ser un proxy» y no sabe qué mirar ni qué preguntar a continuación.

### 12 · `hard` · categoría: quien-cambia-las-reglas
Un contrato tiene una función que solo puede llamar una dirección concreta. ¿Qué es lo primero que hay que averiguar?

- a) Cuánto gas consume
- **→ b) Quién controla esa dirección y qué puede hacer exactamente con esa función**
- c) Si está verificada en el explorador
- d) En qué bloque se desplegó

**Por qué.** «Solo el propietario» no dice nada por sí solo: el riesgo depende de qué permite esa función y de quién es esa dirección — una persona con una clave, varias con firma conjunta, o un contrato que impone demora.

**Repregunta.** ¿Qué diferencia práctica hay entre que sea una sola clave o una firma conjunta de varios?

**Rúbrica.** *Debe contener:* que una clave es un único punto de fallo, por robo o por pérdida; que la firma conjunta reparte el riesgo pero hay que saber cuántos y quiénes; que una demora obligatoria da tiempo a reaccionar aunque quien manda cambie de idea. *Señal de memorizado:* responde «hay que ver si está descentralizado» sin describir ningún mecanismo.

### 13 · `hard` · categoría: como-sale-el-dinero
Autorizas a un contrato a gastar tus tokens sin poner límite de cantidad. ¿Qué has concedido?

- a) Permiso para una sola operación
- **→ b) Permiso para retirar esos tokens de tu cuenta cuando quiera, mientras no lo revoques**
- c) Permiso solo mientras usas la aplicación
- d) Nada, la autorización caduca con la sesión

**Por qué.** La autorización vive en el contrato del token y no caduca sola. Sigue viva aunque cierres la web, cambies de dispositivo o dejes de usar la aplicación, y quien pueda cambiar el código autorizado hereda ese permiso.

**Repregunta.** ¿Cómo se comprueba qué autorizaciones tienes vivas y cómo se quitan?

**Rúbrica.** *Debe contener:* que se consultan en el contrato del token o con herramientas que las listan; que se revocan poniendo el permiso a cero, y eso cuesta una transacción; que autorizar solo lo necesario reduce el daño si el contrato autorizado cambia o falla. *Señal de memorizado:* dice «es peligroso dar permisos infinitos» y no sabe cómo se revisan ni se retiran.

### 14 · `expert` · categoría: como-sale-el-dinero
Un contrato envía fondos al exterior y después actualiza su registro interno. ¿Qué abre esa secuencia?

- a) Que la transacción cueste más gas
- **→ b) Que el destinatario, si es un contrato, vuelva a entrar antes de que el registro se actualice y repita la operación**
- c) Que el envío se pierda
- d) Que el registro quede duplicado

**Por qué.** Enviar a un contrato le da el control de la ejecución. Si el registro todavía dice que le deben, puede pedir otra vez. El orden correcto es apuntar primero y enviar después.

**Repregunta.** Además de reordenar, ¿qué otra medida usarías, y por qué no basta con una sola?

**Rúbrica.** *Debe contener:* un cerrojo que impida reentrar mientras la función está en curso; que el orden «apuntar y luego enviar» es la defensa estructural; que las dos juntas cubren caminos distintos, incluidos los que pasan por otras funciones del mismo contrato. *Señal de memorizado:* dice «reentrancy, se arregla con un guard» sin mencionar el orden de las operaciones.

### 15 · `hard` · categoría: quien-cambia-las-reglas
Un proyecto anuncia que ha renunciado al control de su contrato. ¿Qué habría que comprobar?

- a) Que lo diga su web
- **→ b) Que en el estado del contrato la dirección con privilegios ya no apunta a nadie que pueda usarla, y que no queden otras vías con privilegio**
- c) Que el contrato ya no tenga saldo
- d) Que hayan borrado el código

**Por qué.** Renunciar es una operación con efecto observable en el estado. Y una sola renuncia no basta: puede quedar otra función privilegiada, un contrato intermedio que redirige, o un permiso concedido antes que sigue vivo.

**Repregunta.** ¿Qué privilegio puede quedar aunque ya no haya «propietario»?

**Rúbrica.** *Debe contener:* al menos uno concreto (poder cambiar el destino de la redirección, una función de pausa, una lista de direcciones bloqueadas, una autorización concedida antes); que hay que revisar todas las funciones restringidas, no solo la del propietario; que la ausencia de propietario puede además dejar el contrato sin forma de arreglarse. *Señal de memorizado:* dice «hay que comprobar que hicieron renounce» y se queda ahí.

### 16 · `hard` · categoría: de-donde-sale-el-codigo
¿Qué significa que el código de un contrato esté «verificado» en un explorador?

- a) Que alguien ha auditado su seguridad
- **→ b) Que el código fuente publicado compila exactamente al que está en cadena; nada dice de si es correcto**
- c) Que el proyecto está registrado
- d) Que el contrato no tiene errores

**Por qué.** Verificar es una comprobación de correspondencia, no de calidad. Permite leer lo que se ejecuta, que es imprescindible, pero un contrato verificado puede estar mal diseñado o ser abusivo a la vista de todos.

**Repregunta.** Entonces, ¿qué te dice de verdad una verificación y qué tendrías que hacer tú después?

**Rúbrica.** *Debe contener:* que garantiza correspondencia entre fuente y bytecode; que habilita la lectura pero no sustituye a revisar los privilegios y las salidas de fondos; que sin verificación te quedas leyendo bytecode, que es mucho peor. *Señal de memorizado:* confunde verificado con auditado.

### 17 · `expert` · categoría: como-sale-el-dinero
Un contrato de depósitos reparte según un precio que lee de otro contrato. ¿Cuál es el fallo estructural?

- a) Que leer el precio cuesta gas
- **→ b) Que si ese precio se puede mover dentro de la misma transacción, quien lo mueva decide el reparto**
- c) Que los precios cambian con el tiempo
- d) Que hace falta un oráculo

**Por qué.** El problema no es que el precio varíe, es que sea influible por quien se beneficia y en el mismo instante en que se usa. Una medida tomada de una fuente que el interesado puede empujar no es una medida.

**Repregunta.** ¿Qué haría a esa fuente de precio más difícil de empujar?

**Rúbrica.** *Debe contener:* usar un valor promediado en el tiempo en vez del instantáneo; combinar varias fuentes independientes; que ninguna medida elimina el riesgo, solo encarece el ataque. *Señal de memorizado:* dice «hay que usar Chainlink» como respuesta única, sin explicar qué propiedad se está comprando.

### 18 · `hard` · categoría: quien-cambia-las-reglas
Un contrato puede pausarse. ¿Qué habría que saber antes de depositar en él?

- a) Cuánto gas cuesta pausarlo
- **→ b) Quién puede pausar, qué deja de funcionar al pausarse, y si retirar sigue siendo posible con la pausa activa**
- c) Si la pausa se anuncia por redes
- d) Si la pausa caduca sola

**Por qué.** Una pausa es una herramienta razonable para frenar un ataque, y también una forma de atrapar fondos. La pregunta útil no es si existe, sino si retirar queda dentro o fuera de lo que se detiene.

**Repregunta.** ¿En qué caso una pausa te protege y en qué caso te perjudica?

**Rúbrica.** *Debe contener:* que protege si corta la vía por la que se están perdiendo fondos; que perjudica si bloquea la retirada y depende de quién la levante; que importa si hay límite de duración o alguien obligado a reactivar. *Señal de memorizado:* dice «es bueno tener pausa» o «es malo», sin distinguir según qué se pausa.

### 19 · `hard` · categoría: de-donde-sale-el-codigo
Un contrato ejecuta código de otra dirección **en su propio contexto de almacenamiento**. ¿Qué consecuencia tiene?

- a) Que el otro contrato paga el gas
- **→ b) Que ese código puede escribir en el almacenamiento del contrato que lo llama, con sus mismos permisos**
- c) Que las dos direcciones se fusionan
- d) Que el llamante no puede revertir

**Por qué.** Es el mecanismo que hace posibles los contratos actualizables, y también el que convierte al contrato al que se delega en parte de la superficie de riesgo del que delega: cualquier error suyo se escribe en el estado ajeno.

**Repregunta.** ¿Qué pasa si el contrato al que se delega puede ser destruido o cambiado?

**Rúbrica.** *Debe contener:* que el llamante se queda sin lógica o con otra distinta; que el estado sigue ahí pero puede volverse ininterpretable o manipulable; que por eso importa quién controla esa dirección y si hay demora para cambiarla. *Señal de memorizado:* dice «delegatecall usa el storage del llamante» sin ninguna consecuencia.

### 20 · `expert` · categoría: como-sale-el-dinero
Repasas un contrato buscando por dónde pueden salir los fondos. ¿Qué inventario haces?

- a) Solo las funciones marcadas como de retirada
- **→ b) Toda función que pueda mover saldo, quién puede llamarla, las autorizaciones ya concedidas a terceros, y cualquier vía que permita cambiar el código que decide todo eso**
- c) Las transacciones de los últimos días
- d) El saldo actual

**Por qué.** Los fondos no salen solo por la puerta que se llama «retirar». Salen por funciones privilegiadas, por permisos concedidos antes, y por un cambio de código que crea una puerta nueva. Quien solo mira las retiradas se deja fuera la mayoría de los casos reales.

**Repregunta.** De esas vías, ¿cuál es la más fácil de pasar por alto y por qué?

**Rúbrica.** *Debe contener:* que la posibilidad de cambiar el código es la que hace inútil todo el análisis anterior; o bien que las autorizaciones concedidas antes no se ven leyendo el contrato; que el inventario hay que rehacerlo después de cada actualización. *Señal de memorizado:* enumera funciones sin jerarquizar el riesgo ni mencionar las actualizaciones.

---

## Módulo 3 · Qué te vas a encontrar (10)

### 21 · `hard` · categoría: nonce-y-orden
Tienes una transacción pendiente con un número de secuencia bajo y envías otra con uno más alto. ¿Qué ocurre?

- a) La segunda se ejecuta antes si paga más
- **→ b) La segunda espera: las transacciones de una cuenta se ejecutan en orden de secuencia**
- c) Las dos se cancelan
- d) La primera se descarta sola

**Por qué.** El número de secuencia ordena las transacciones de una misma cuenta y no admite huecos. Una atascada bloquea todas las posteriores, por mucho que paguen. De ahí que se reemplace la atascada en vez de intentar adelantarla.

**Repregunta.** ¿Cómo se desatasca?

**Rúbrica.** *Debe contener:* enviar otra con el **mismo** número de secuencia y más comisión, para sustituirla; que puede ser una transacción vacía si solo se quiere liberar la cola; que hasta que entre, las posteriores no se ejecutan. *Señal de memorizado:* dice «hay que subir el gas» sin mencionar que debe repetirse el mismo número de secuencia.

### 22 · `hard` · categoría: nonce-y-orden
Dentro de un mismo bloque, ¿quién decide el orden de las transacciones?

- a) La hora en que se enviaron
- **→ b) Quien construye el bloque, que puede ordenarlas, incluir las suyas o dejar fuera las ajenas**
- c) El protocolo, alfabéticamente
- d) Un sorteo entre nodos

**Por qué.** El orden dentro del bloque no es una propiedad neutral del sistema: lo elige quien lo construye, y ese margen tiene valor económico. Es la raíz de que una operación pueda ejecutarse en peores condiciones que las previstas.

**Repregunta.** ¿Cómo te afecta eso en una operación normal, y qué protección tienes?

**Rúbrica.** *Debe contener:* que la operación puede ejecutarse a un precio peor que el visto al enviarla; que se limita fijando un resultado mínimo aceptable y un plazo de caducidad; que sin ese límite estás aceptando cualquier resultado. *Señal de memorizado:* dice «MEV» o «front-running» sin poder describir qué protección usa quien opera.

### 23 · `hard` · categoría: stablecoins
Una stablecoin centralizada está respaldada por reservas de su emisor. ¿De qué depende que mantenga su valor?

- a) Del consenso de la red donde circula
- **→ b) De que el emisor tenga esas reservas y las entregue cuando se lo pidan; la cadena solo lleva la cuenta de los saldos**
- c) De la cantidad en circulación
- d) De la comisión de las transferencias

**Por qué.** La red garantiza quién tiene cuántas unidades, no lo que valen. El valor descansa en una promesa de un emisor identificable, con su solvencia y su marco legal. Confundir las dos garantías es el error habitual.

**Repregunta.** ¿Qué riesgo asumes con esa stablecoin que no asumes con la moneda nativa de la red?

**Rúbrica.** *Debe contener:* el riesgo de contraparte del emisor, no solo el técnico; que el emisor puede tener facultades sobre saldos concretos; que la moneda nativa no promete un valor pero tampoco depende de nadie que cumpla. *Señal de memorizado:* dice «está respaldada 1:1» repitiendo el eslogan, sin nombrar a quién hay que creer.

### 24 · `expert` · categoría: stablecoins
Muchas stablecoins centralizadas permiten a su emisor bloquear direcciones concretas. ¿Qué implica para un contrato que las use?

- a) Nada, el contrato es inmutable
- **→ b) Que una transferencia puede fallar por decisión del emisor, y si el contrato no lo contempla puede quedarse bloqueado**
- c) Que el contrato pasa a estar controlado por el emisor
- d) Que las transferencias pasan a ser más lentas

**Por qué.** El contrato del token puede negarse a mover saldo de o hacia ciertas direcciones. Un contrato que da por hecho que la transferencia siempre funciona puede quedar atascado en un punto del que no sale, incluso perjudicando a terceros ajenos al bloqueo.

**Repregunta.** ¿Cómo diseñarías un contrato para que el bloqueo de un usuario no paralice a los demás?

**Rúbrica.** *Debe contener:* no dejar que un envío fallido detenga el proceso general; que cada usuario retire lo suyo en vez de repartir en bloque; registrar la deuda y permitir reclamarla después. *Señal de memorizado:* dice «el emisor puede congelar fondos» sin conectarlo con el diseño del contrato.

### 25 · `hard` · categoría: leer-un-contrato
¿Qué información te dan los eventos que emite un contrato?

- a) El estado actual completo
- **→ b) Un registro de lo que ha ido pasando, útil para reconstruir el histórico, pero solo de lo que el código decidió emitir**
- c) Las transacciones pendientes
- d) El código fuente

**Por qué.** Los eventos son el rastro que el contrato deja a propósito. Son la vía práctica para seguir su actividad, con un límite importante: lo que no se emite no aparece, y un cambio que no genera evento es invisible desde fuera.

**Repregunta.** Dame un cambio relevante que podría no dejar rastro en los eventos.

**Rúbrica.** *Debe contener:* un ejemplo plausible (un cambio de parámetro sin evento, una asignación de privilegio silenciosa, un cambio de destino de redirección mal instrumentado); que entonces hay que leer el estado directamente; que la ausencia de eventos no prueba la ausencia de cambios. *Señal de memorizado:* dice «los eventos son logs» sin más.

### 26 · `hard` · categoría: leer-un-contrato
Llamas a una función que solo consulta datos, sin modificar nada. ¿Qué la distingue?

- a) Que es más rápida
- **→ b) Que se puede ejecutar sin enviar una transacción ni pagar gas, porque no cambia el estado**
- c) Que solo la puede llamar el propietario
- d) Que devuelve siempre el mismo valor

**Por qué.** Al no alterar el estado, cualquier nodo puede evaluarla y devolver el resultado sin acuerdo de la red. Es lo que permite inspeccionar un contrato gratis. Ojo: si se llama **desde** otro contrato dentro de una transacción, sí consume gas.

**Repregunta.** ¿En qué caso una función de solo lectura sí acaba costando gas?

**Rúbrica.** *Debe contener:* cuando la llama otro contrato dentro de una transacción; que la gratuidad viene de consultar a un nodo, no de una propiedad de la función; que el cómputo existe igual y alguien lo paga si ocurre en cadena. *Señal de memorizado:* dice «las view son gratis» sin la excepción.

### 27 · `expert` · categoría: nonce-y-orden
Una operación que consultaste hace un minuto se ejecuta con un resultado peor. Sin culpar a nadie, ¿qué ha pasado?

- a) La red se ha equivocado
- **→ b) El estado cambió entre la consulta y la ejecución, y tu operación se aplicó sobre el estado nuevo**
- c) Tu transacción se ejecutó dos veces
- d) El contrato subió sus comisiones

**Por qué.** Consultar y ejecutar son dos momentos distintos, y en medio cabe cualquier otra transacción. No hace falta un ataque: basta con que otros hayan actuado antes. Por eso una operación bien enviada lleva un resultado mínimo aceptable.

**Repregunta.** Si pones un mínimo muy ajustado, ¿qué te pasa? ¿Y si lo pones muy holgado?

**Rúbrica.** *Debe contener:* muy ajustado, la operación revierte a menudo y pagas gas sin resultado; muy holgado, aceptas un resultado malo sin darte cuenta; que es un equilibrio que se decide según cuánto se mueva el estado. *Señal de memorizado:* dice «hay que poner slippage» sin saber qué se gana y qué se pierde en cada extremo.

### 28 · `hard` · categoría: leer-un-contrato
Vas a revisar un contrato que no conoces. ¿Cuál es un orden razonable?

- a) Leer el código de arriba abajo
- **→ b) Ver si redirige a otro, localizar las funciones restringidas y quién las puede llamar, y después seguir las vías por las que sale saldo**
- c) Mirar el saldo y el número de usuarios
- d) Comprobar la fecha de despliegue

**Por qué.** Leer de arriba abajo gasta el tiempo en lo que no decide nada. Lo que decide es dónde vive el código que se ejecuta, quién tiene poder sobre él y por dónde sale el dinero. Lo demás se entiende mejor después.

**Repregunta.** De esos tres pasos, ¿cuál descarta más contratos y por qué?

**Rúbrica.** *Debe contener:* que quién tiene privilegios suele decidir rápido si merece seguir; o bien que si el código es cambiable, el resto del análisis caduca; que el orden ahorra trabajo porque cada paso puede cerrar la revisión. *Señal de memorizado:* recita los pasos en orden sin poder decir qué descarta cada uno.

### 29 · `expert` · categoría: stablecoins
Un contrato asume que todas las stablecoins usan la misma cantidad de decimales. ¿Qué puede fallar?

- a) Nada, el estándar los fija
- **→ b) Que los importes se calculen con un factor equivocado, por exceso o por defecto, en varios órdenes de magnitud**
- c) Que las transferencias tarden más
- d) Que el token deje de ser transferible

**Por qué.** El número de decimales lo decide cada token y no es uniforme. Un contrato que lo da por supuesto puede tratar una cantidad pequeña como enorme. No es un error de redondeo: es un desplazamiento de varios ceros.

**Repregunta.** ¿Cómo lo evitas, y por qué no basta con mirarlo una vez al integrar?

**Rúbrica.** *Debe contener:* leer los decimales del propio token en vez de suponerlos; normalizar a una escala interna; que cada token nuevo que se acepte vuelve a plantear el problema, y por eso la comprobación va en el código y no en la documentación. *Señal de memorizado:* dice «no todos tienen 18 decimales» sin explicar la magnitud del error ni dónde va la comprobación.

### 30 · `hard` · categoría: leer-un-contrato
Dos direcciones dicen ser el mismo token, con idéntico nombre y símbolo. ¿Qué las distingue de verdad?

- a) El nombre completo
- **→ b) La dirección del contrato; el nombre y el símbolo los elige quien despliega y se pueden repetir**
- c) La cantidad en circulación
- d) El número de decimales

**Por qué.** Nombre y símbolo son texto sin ninguna garantía de unicidad. Lo único que identifica un token es su dirección, y de ahí que las listas de direcciones conocidas y no el buscador sean la forma de no equivocarse.

**Repregunta.** ¿Cómo confirmas que una dirección es la del token que crees?

**Rúbrica.** *Debe contener:* cruzarla con una fuente independiente del sitio que te la dio; que un explorador puede etiquetarla pero la etiqueta también es texto que alguien ha puesto; que ante la duda, más de una fuente coincidente. *Señal de memorizado:* dice «hay que mirar la dirección» sin explicar contra qué se contrasta.

---

## Reparto

| módulo | preguntas | `hard` | `expert` |
|---|---:|---:|---:|
| 1 · Qué añadió Ethereum | 10 | 7 | 3 |
| 2 · Qué decide si algo falla | 10 | 6 | 4 |
| 3 · Qué te vas a encontrar | 10 | 9 | 1 |
| **total** | **30** | **22** | **8** |

Categorías: `estado-y-cuentas` (3), `gas` (4), `limites-de-un-contrato` (3),
`de-donde-sale-el-codigo` (3), `quien-cambia-las-reglas` (3), `como-sale-el-dinero` (4),
`nonce-y-orden` (3), `stablecoins` (3), `leer-un-contrato` (4).

## Lo que queda por decidir antes de insertarlas

1. **Cuántas se sirven por intento.** `instructor_exams.total_questions` está a **20** y el
   banco tendrá 30. Con 20 de 30, dos intentos comparten dos tercios de las preguntas.
2. **El umbral.** `pass_threshold` está a **80**: 16 de 20. Con preguntas de este nivel
   conviene decidirlo a la vista de los primeros intentos, no antes.
3. **Que el examen no es la decisión.** Estas 30 miden lo escrito; la repregunta y la parte
   práctica las valora el evaluador, y sin las dos aptas no hay aprobación.
