/**
 * Glosario Crypto - Términos educativos para SEO
 * 50+ términos organizados por categoría
 */

export type GlossaryCategory =
  | 'bitcoin'
  | 'blockchain'
  | 'defi'
  | 'trading'
  | 'wallets'
  | 'web3'
  | 'seguridad'
  | 'mineria'

export interface GlossaryTerm {
  term: string
  slug: string
  definition: string
  explanation: string
  category: GlossaryCategory
  relatedTerms: string[]
  relatedArticle?: string
}

export const glossaryCategories: Record<GlossaryCategory, { name: string; color: string }> = {
  bitcoin: { name: 'Bitcoin', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  blockchain: { name: 'Blockchain', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  defi: { name: 'DeFi', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  trading: { name: 'Trading', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  wallets: { name: 'Wallets', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  web3: { name: 'Web3', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  seguridad: { name: 'Seguridad', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  mineria: { name: 'Minería', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
}

export const glossaryTerms: GlossaryTerm[] = [
  // ==================== BITCOIN ====================
  {
    term: 'Bitcoin',
    slug: 'bitcoin',
    definition: 'La primera criptomoneda descentralizada del mundo, creada en 2009 por Satoshi Nakamoto.',
    explanation: `Bitcoin (BTC) es un sistema de dinero electrónico peer-to-peer que permite realizar pagos directamente entre personas sin necesidad de intermediarios como bancos. Funciona sobre una red descentralizada de computadoras que verifican y registran todas las transacciones en un libro público llamado blockchain.

A diferencia del dinero tradicional, Bitcoin tiene un suministro limitado de 21 millones de unidades, lo que lo convierte en un activo deflacionario. Esta escasez programada, junto con su naturaleza descentralizada, ha llevado a muchos a considerarlo como "oro digital" y una reserva de valor alternativa.

Bitcoin se puede dividir hasta en 100 millones de unidades más pequeñas llamadas satoshis, permitiendo microtransacciones. Su protocolo es de código abierto, lo que significa que cualquiera puede verificar su funcionamiento y contribuir a su desarrollo.`,
    category: 'bitcoin',
    relatedTerms: ['satoshi', 'blockchain', 'halving', 'nodo', 'whitepaper'],
    relatedArticle: 'que-es-bitcoin-guia-completa',
  },
  {
    term: 'Satoshi',
    slug: 'satoshi',
    definition: 'La unidad más pequeña de Bitcoin, equivalente a 0.00000001 BTC.',
    explanation: `Un satoshi (sat) es la fracción mínima en la que se puede dividir un Bitcoin. Recibe su nombre en honor a Satoshi Nakamoto, el creador pseudónimo de Bitcoin. La relación es simple: 1 Bitcoin = 100,000,000 satoshis.

Esta divisibilidad extrema es fundamental para la usabilidad de Bitcoin. Mientras que comprar un Bitcoin completo puede ser costoso, cualquier persona puede adquirir satoshis por fracciones de euro. Esto hace que Bitcoin sea accesible para cualquier presupuesto y permite realizar micropagos.

En la práctica, muchos usuarios de Bitcoin prefieren pensar en satoshis cuando el precio de BTC es alto. Por ejemplo, si una taza de café cuesta 0.00005 BTC, es más intuitivo decir que cuesta 5,000 sats.`,
    category: 'bitcoin',
    relatedTerms: ['bitcoin', 'satoshi-nakamoto', 'lightning-network'],
  },
  {
    term: 'Satoshi Nakamoto',
    slug: 'satoshi-nakamoto',
    definition: 'El creador pseudónimo de Bitcoin, cuya verdadera identidad sigue siendo un misterio.',
    explanation: `Satoshi Nakamoto es el nombre utilizado por la persona o grupo de personas que diseñó Bitcoin y creó su implementación original. Publicó el whitepaper de Bitcoin el 31 de octubre de 2008 y lanzó el software el 3 de enero de 2009, minando el primer bloque (bloque génesis).

Satoshi permaneció activo en los foros de desarrollo hasta diciembre de 2010, cuando dejó de comunicarse públicamente. Se estima que minó alrededor de 1 millón de bitcoins en los primeros días de la red, los cuales nunca han sido movidos.

La identidad real de Satoshi sigue siendo uno de los mayores misterios del mundo tecnológico. Varias personas han sido señaladas o han afirmado ser Satoshi, pero ninguna ha proporcionado pruebas criptográficas convincentes. Muchos consideran que el anonimato de Satoshi es positivo, ya que refuerza la naturaleza descentralizada de Bitcoin.`,
    category: 'bitcoin',
    relatedTerms: ['bitcoin', 'whitepaper', 'bloque-genesis'],
  },
  {
    term: 'Halving',
    slug: 'halving',
    definition: 'Evento que reduce a la mitad la recompensa por minar un bloque de Bitcoin, ocurre cada 210,000 bloques.',
    explanation: `El halving es un mecanismo programado en el protocolo de Bitcoin que reduce la emisión de nuevos bitcoins a la mitad aproximadamente cada cuatro años. Esta reducción afecta directamente la recompensa que reciben los mineros por añadir nuevos bloques a la blockchain.

Cuando Bitcoin comenzó en 2009, los mineros recibían 50 BTC por bloque. Tras el primer halving en 2012, la recompensa bajó a 25 BTC. En 2016 se redujo a 12.5 BTC, en 2020 a 6.25 BTC, y en 2024 a 3.125 BTC. Este proceso continuará hasta aproximadamente el año 2140, cuando se habrán minado los 21 millones de bitcoins.

El halving es significativo porque reduce la tasa de inflación de Bitcoin, haciéndolo más escaso con el tiempo. Históricamente, los halvings han precedido períodos de aumento de precio, aunque esto no está garantizado en el futuro.`,
    category: 'bitcoin',
    relatedTerms: ['mineria', 'recompensa-de-bloque', 'bitcoin', 'escasez'],
  },
  {
    term: 'Lightning Network',
    slug: 'lightning-network',
    definition: 'Solución de segunda capa que permite transacciones de Bitcoin instantáneas y con comisiones mínimas.',
    explanation: `Lightning Network es un protocolo construido sobre Bitcoin que permite realizar millones de transacciones por segundo con costos prácticamente nulos. Funciona creando canales de pago entre usuarios, donde las transacciones ocurren fuera de la blockchain principal (off-chain) y solo se registran en ella al abrir o cerrar el canal.

Imagina que abres una cuenta conjunta con tu cafetería favorita, depositas algo de Bitcoin, y puedes comprar cafés instantáneamente sin esperar confirmaciones en la blockchain. Solo cuando decides cerrar la cuenta, el saldo final se registra en la cadena principal.

Esta tecnología resuelve el problema de escalabilidad de Bitcoin, haciéndolo viable para pagos cotidianos como comprar un café o pagar transporte público. Aplicaciones como Wallet of Satoshi, Phoenix o Muun facilitan el uso de Lightning para usuarios comunes.`,
    category: 'bitcoin',
    relatedTerms: ['bitcoin', 'layer-2', 'escalabilidad', 'transaccion'],
  },
  {
    term: 'UTXO',
    slug: 'utxo',
    definition: 'Unspent Transaction Output, representa la cantidad de Bitcoin disponible para gastar en una dirección.',
    explanation: `UTXO (Salida de Transacción No Gastada) es el modelo contable que utiliza Bitcoin para rastrear la propiedad de fondos. A diferencia de un saldo bancario tradicional, Bitcoin no registra cuánto "tienes", sino qué "monedas" (UTXOs) puedes gastar.

Piensa en los UTXOs como billetes en tu cartera física. Si tienes un billete de 20€ y quieres pagar 5€, entregas el billete y recibes 15€ de cambio. En Bitcoin, si tienes un UTXO de 0.5 BTC y quieres enviar 0.3 BTC, ese UTXO se "destruye" y se crean dos nuevos: uno de 0.3 BTC para el destinatario y otro de (aproximadamente) 0.2 BTC como cambio para ti.

Este modelo proporciona mayor privacidad y permite verificación más eficiente de transacciones, aunque requiere gestión cuidadosa para optimizar comisiones cuando tienes muchos UTXOs pequeños.`,
    category: 'bitcoin',
    relatedTerms: ['transaccion', 'bitcoin', 'comisiones'],
  },
  {
    term: 'Mempool',
    slug: 'mempool',
    definition: 'Sala de espera donde las transacciones de Bitcoin aguardan para ser incluidas en un bloque.',
    explanation: `El mempool (memory pool) es un espacio de almacenamiento temporal donde residen las transacciones de Bitcoin que han sido transmitidas a la red pero aún no han sido confirmadas en un bloque. Cada nodo de Bitcoin mantiene su propio mempool.

Cuando envías una transacción, esta se propaga por la red y entra en los mempools de los nodos. Los mineros seleccionan transacciones del mempool para incluir en el siguiente bloque, generalmente priorizando aquellas con mayores comisiones (sat/vB).

En períodos de alta demanda, el mempool puede congestionarse con miles de transacciones pendientes, lo que eleva las comisiones necesarias para una confirmación rápida. Herramientas como mempool.space permiten visualizar el estado actual del mempool y estimar comisiones apropiadas.`,
    category: 'bitcoin',
    relatedTerms: ['transaccion', 'comisiones', 'bloque', 'nodo'],
  },
  {
    term: 'Nodo',
    slug: 'nodo',
    definition: 'Computadora que ejecuta el software de Bitcoin y mantiene una copia completa de la blockchain.',
    explanation: `Un nodo de Bitcoin es una computadora que ejecuta el software Bitcoin Core (o compatible) y participa en la red validando transacciones y bloques. Los nodos completos descargan y verifican toda la blockchain desde el bloque génesis hasta el presente.

Ejecutar tu propio nodo te da soberanía total sobre tus transacciones. No necesitas confiar en terceros para verificar que tus pagos son válidos o que tus bitcoins existen. Además, contribuyes a la descentralización y seguridad de la red.

Existen diferentes tipos de nodos: los nodos completos validan todo, los nodos podados descartan bloques antiguos para ahorrar espacio, y los nodos ligeros (SPV) solo descargan cabeceras de bloques. Para máxima seguridad, se recomienda un nodo completo.`,
    category: 'bitcoin',
    relatedTerms: ['bitcoin', 'blockchain', 'descentralizacion', 'mineria'],
    relatedArticle: 'que-es-bitcoin-guia-completa',
  },
  {
    term: 'Mining Pool',
    slug: 'mining-pool',
    definition: 'Grupo de mineros que combinan su poder de cómputo para aumentar sus probabilidades de encontrar bloques.',
    explanation: `Un mining pool (grupo de minería) permite a múltiples mineros unir fuerzas y compartir recompensas proporcionalmente a su contribución. En lugar de esperar meses o años para encontrar un bloque individualmente, los participantes reciben pagos regulares basados en su hashrate aportado.

El funcionamiento es simple: el pool coordina el trabajo entre sus miembros, y cuando cualquiera encuentra un bloque válido, la recompensa se distribuye entre todos según su contribución. Esto proporciona ingresos más predecibles a los mineros pequeños.

Los pools más grandes como Foundry, AntPool y F2Pool controlan porciones significativas del hashrate total. Aunque la minería en pool es conveniente, la concentración excesiva en pocos pools podría representar riesgos de centralización para la red.`,
    category: 'bitcoin',
    relatedTerms: ['mineria', 'hashrate', 'recompensa-de-bloque'],
  },
  {
    term: 'Whitepaper',
    slug: 'whitepaper',
    definition: 'Documento técnico que describe el funcionamiento de un proyecto crypto, como el paper original de Bitcoin.',
    explanation: `Un whitepaper es un documento que explica en detalle la tecnología, propósito y funcionamiento de un proyecto de criptomonedas. El término se popularizó con el whitepaper de Bitcoin, publicado por Satoshi Nakamoto el 31 de octubre de 2008.

El whitepaper de Bitcoin, titulado "Bitcoin: A Peer-to-Peer Electronic Cash System", tiene solo 9 páginas pero establece los fundamentos de toda la industria crypto. Describe cómo resolver el problema del doble gasto sin necesidad de un intermediario de confianza.

Hoy, prácticamente todo proyecto crypto serio publica su whitepaper antes del lanzamiento. Sin embargo, la calidad varía enormemente. Un buen whitepaper debe explicar claramente el problema que resuelve, la solución técnica propuesta, y el modelo económico del token si lo tiene.`,
    category: 'bitcoin',
    relatedTerms: ['satoshi-nakamoto', 'bitcoin', 'blockchain'],
  },
  {
    term: 'HODL',
    slug: 'hodl',
    definition: 'Término que significa mantener Bitcoin a largo plazo sin vender, originado de un error tipográfico de "hold".',
    explanation: `HODL es un término icónico de la cultura Bitcoin que surgió en diciembre de 2013, cuando un usuario del foro BitcoinTalk escribió "I AM HODLING" en lugar de "holding" mientras explicaba por qué no vendería sus bitcoins a pesar de la caída del precio.

El error tipográfico se convirtió en un acrónimo retroactivo: "Hold On for Dear Life" (Aguanta por tu vida). Representa la filosofía de inversión a largo plazo: comprar Bitcoin y mantenerlo durante años, ignorando la volatilidad a corto plazo.

Los "hodlers" creen en el potencial a largo plazo de Bitcoin y prefieren acumular (stack sats) en lugar de especular con el precio. Esta estrategia ha demostrado ser efectiva históricamente para quienes mantuvieron sus posiciones durante ciclos completos del mercado.`,
    category: 'bitcoin',
    relatedTerms: ['bitcoin', 'satoshi', 'cold-storage'],
    relatedArticle: 'soberania-financiera-bitcoin',
  },
  {
    term: 'Cold Storage',
    slug: 'cold-storage',
    definition: 'Método de almacenar criptomonedas fuera de línea para máxima seguridad contra hackeos.',
    explanation: `Cold storage (almacenamiento en frío) se refiere a mantener las claves privadas de tus criptomonedas completamente desconectadas de Internet. Esto elimina el riesgo de hackeos remotos, ya que un atacante no puede acceder a algo que no está en línea.

Las formas más comunes de cold storage incluyen hardware wallets (Ledger, Trezor, Coldcard), paper wallets (claves impresas en papel), y soluciones más avanzadas como steel plates (semillas grabadas en metal). Cada método tiene sus pros y contras en términos de seguridad y usabilidad.

Para cantidades significativas de Bitcoin, el cold storage es considerado esencial. Muchos expertos recomiendan mantener solo pequeñas cantidades para uso diario en hot wallets, mientras el grueso del patrimonio permanece en cold storage con copias de seguridad en múltiples ubicaciones.`,
    category: 'bitcoin',
    relatedTerms: ['hardware-wallet', 'seed-phrase', 'clave-privada', 'hot-wallet'],
    relatedArticle: 'soberania-financiera-bitcoin',
  },
  {
    term: 'Bloque Génesis',
    slug: 'bloque-genesis',
    definition: 'El primer bloque de la blockchain de Bitcoin, minado por Satoshi Nakamoto el 3 de enero de 2009.',
    explanation: `El bloque génesis (Genesis Block o Bloque 0) es el primer bloque de la blockchain de Bitcoin, creado por Satoshi Nakamoto el 3 de enero de 2009. Este bloque es especial porque no tiene ningún bloque previo al que referenciar.

Satoshi incluyó un mensaje en el bloque génesis: "The Times 03/Jan/2009 Chancellor on brink of second bailout for banks" (El canciller al borde del segundo rescate bancario). Este titular del periódico The Times sirve como timestamp y como declaración de intenciones: Bitcoin nació como respuesta a las políticas de rescate bancario.

La recompensa de 50 BTC del bloque génesis no puede gastarse debido a una peculiaridad en el código. El bloque génesis es ahora un artefacto histórico que marca el nacimiento de una nueva era en la historia del dinero.`,
    category: 'bitcoin',
    relatedTerms: ['satoshi-nakamoto', 'bitcoin', 'bloque', 'blockchain'],
  },

  // ==================== BLOCKCHAIN ====================
  {
    term: 'Blockchain',
    slug: 'blockchain',
    definition: 'Base de datos distribuida que registra transacciones en bloques encadenados de forma inmutable.',
    explanation: `Una blockchain (cadena de bloques) es un tipo especial de base de datos donde la información se agrupa en bloques que se enlazan cronológicamente mediante hashes criptográficos. Esta estructura hace que modificar datos pasados sea prácticamente imposible sin alterar toda la cadena subsiguiente.

La innovación clave de blockchain es permitir que múltiples partes que no confían entre sí puedan compartir una base de datos sin necesidad de una autoridad central. Cada participante (nodo) mantiene una copia idéntica, y todos verifican que las nuevas entradas sean válidas según las reglas del protocolo.

Aunque Bitcoin fue la primera aplicación exitosa de blockchain, la tecnología se ha expandido a múltiples usos: contratos inteligentes (Ethereum), cadenas de suministro, votación electrónica, identidad digital y más.`,
    category: 'blockchain',
    relatedTerms: ['bloque', 'hash', 'descentralizacion', 'nodo'],
    relatedArticle: 'que-es-blockchain-explicado',
  },
  {
    term: 'Bloque',
    slug: 'bloque',
    definition: 'Conjunto de transacciones agrupadas y añadidas a la blockchain tras ser validadas.',
    explanation: `Un bloque es la unidad fundamental de una blockchain. Contiene un grupo de transacciones verificadas, una referencia criptográfica (hash) al bloque anterior, un timestamp, y otros datos dependiendo del protocolo específico.

En Bitcoin, un nuevo bloque se añade aproximadamente cada 10 minutos. Cada bloque puede contener miles de transacciones (limitado por el tamaño máximo de 1-4MB dependiendo del tipo de transacciones). Una vez que un bloque es añadido a la cadena y confirmado por bloques subsiguientes, las transacciones que contiene se consideran irreversibles.

La estructura de bloques enlazados es lo que da seguridad a blockchain: para modificar una transacción antigua, un atacante tendría que rehacer no solo ese bloque, sino todos los bloques posteriores, lo cual requeriría una cantidad imposible de poder computacional.`,
    category: 'blockchain',
    relatedTerms: ['blockchain', 'transaccion', 'hash', 'mineria'],
  },
  {
    term: 'Consenso',
    slug: 'consenso',
    definition: 'Mecanismo por el cual los nodos de una red blockchain acuerdan el estado válido del libro mayor.',
    explanation: `El consenso es el proceso mediante el cual todos los participantes de una red descentralizada llegan a un acuerdo sobre cuáles transacciones son válidas y en qué orden ocurrieron. Sin un mecanismo de consenso, sería imposible mantener una verdad compartida entre partes que no confían entre sí.

Bitcoin utiliza Proof of Work (PoW), donde los mineros compiten resolviendo puzzles matemáticos. Ethereum migró a Proof of Stake (PoS), donde los validadores bloquean fondos como garantía. Existen otros mecanismos como Delegated Proof of Stake (DPoS), Proof of Authority (PoA), y Proof of History (PoH).

Cada mecanismo de consenso tiene diferentes trade-offs entre seguridad, velocidad, consumo energético y grado de descentralización. La elección del mecanismo define muchas características fundamentales de una blockchain.`,
    category: 'blockchain',
    relatedTerms: ['proof-of-work', 'proof-of-stake', 'descentralizacion', 'nodo'],
  },
  {
    term: 'Descentralización',
    slug: 'descentralizacion',
    definition: 'Distribución del control y toma de decisiones entre múltiples participantes en lugar de una autoridad central.',
    explanation: `La descentralización es el principio fundamental que distingue a las criptomonedas del dinero tradicional. En un sistema descentralizado, no existe un punto único de control o fallo. El poder está distribuido entre todos los participantes de la red.

En Bitcoin, la descentralización se manifiesta en varios niveles: miles de nodos verifican transacciones independientemente, la minería está distribuida globalmente, y cualquiera puede participar sin permiso. Nadie puede censurar transacciones, congelar fondos o cambiar las reglas unilateralmente.

Sin embargo, la descentralización es un espectro, no un estado binario. Algunas criptomonedas están más descentralizadas que otras. Factores como la distribución de nodos, la diversidad de mineros/validadores, y la gobernanza del protocolo afectan el grado real de descentralización.`,
    category: 'blockchain',
    relatedTerms: ['nodo', 'consenso', 'bitcoin', 'censura'],
  },
  {
    term: 'Ledger Distribuido',
    slug: 'ledger-distribuido',
    definition: 'Base de datos compartida y sincronizada entre múltiples nodos sin autoridad central.',
    explanation: `Un ledger distribuido (DLT - Distributed Ledger Technology) es un sistema de registro donde los datos se almacenan y sincronizan entre múltiples ubicaciones, instituciones o geografías. Blockchain es un tipo de ledger distribuido, pero no todos los ledgers distribuidos son blockchains.

La diferencia clave con bases de datos tradicionales es que no hay un administrador central. Todos los participantes mantienen copias del ledger, y las actualizaciones requieren consenso entre los nodos. Esto proporciona transparencia, resistencia a fallos y resistencia a la manipulación.

Las aplicaciones van más allá de las criptomonedas: cadenas de suministro, registros médicos, votación electrónica, y cualquier situación donde múltiples partes necesiten compartir datos de forma confiable sin un intermediario de confianza.`,
    category: 'blockchain',
    relatedTerms: ['blockchain', 'nodo', 'consenso', 'descentralizacion'],
  },
  {
    term: 'Merkle Tree',
    slug: 'merkle-tree',
    definition: 'Estructura de datos que permite verificar eficientemente grandes conjuntos de transacciones.',
    explanation: `Un Merkle Tree (árbol de Merkle) es una estructura de datos en forma de árbol donde cada nodo hoja contiene el hash de un bloque de datos (transacciones), y cada nodo no-hoja contiene el hash de sus nodos hijos. La raíz del árbol (Merkle Root) representa un resumen de todos los datos.

Esta estructura permite verificar que una transacción específica está incluida en un bloque sin descargar todas las transacciones. Solo necesitas los hashes a lo largo del camino desde tu transacción hasta la raíz, lo que hace la verificación extremadamente eficiente.

Los Merkle Trees son fundamentales para los clientes ligeros (SPV) que no pueden almacenar toda la blockchain. También se usan en pruebas de reservas, airdrops, y cualquier situación donde se necesite probar la inclusión de datos en un conjunto grande.`,
    category: 'blockchain',
    relatedTerms: ['hash', 'bloque', 'transaccion', 'nodo'],
  },
  {
    term: 'Fork',
    slug: 'fork',
    definition: 'Bifurcación en la blockchain que puede ser temporal o crear una nueva criptomoneda.',
    explanation: `Un fork ocurre cuando una blockchain se divide en dos caminos. Esto puede suceder temporalmente (cuando dos mineros encuentran bloques casi simultáneamente) o permanentemente (cuando hay desacuerdo sobre las reglas del protocolo).

Los forks temporales se resuelven naturalmente: la cadena más larga (con más trabajo acumulado) "gana" y la otra se abandona. Los forks permanentes crean nuevas criptomonedas, como cuando Bitcoin Cash se separó de Bitcoin en 2017.

Existen dos tipos de forks permanentes: hard forks (cambios incompatibles hacia atrás) y soft forks (cambios compatibles). Un hard fork requiere que todos los nodos actualicen su software, mientras que un soft fork funciona aunque algunos nodos no actualicen.`,
    category: 'blockchain',
    relatedTerms: ['hard-fork', 'soft-fork', 'blockchain', 'consenso'],
  },
  {
    term: 'Hard Fork',
    slug: 'hard-fork',
    definition: 'Cambio en el protocolo que no es compatible con versiones anteriores, creando una nueva cadena.',
    explanation: `Un hard fork es un cambio en las reglas de una blockchain que hace que los bloques creados bajo las nuevas reglas sean inválidos según las reglas antiguas (y viceversa). Todos los nodos deben actualizar para seguir la nueva cadena; los que no actualicen seguirán una cadena separada.

Ejemplos famosos incluyen Bitcoin Cash (2017), que aumentó el tamaño de bloque, y Ethereum Classic (2016), que resultó del desacuerdo sobre cómo manejar el hackeo de The DAO. En estos casos, ambas cadenas continuaron existiendo con diferentes comunidades.

Los hard forks pueden ser contenciosos (dividiendo la comunidad) o no contenciosos (cuando todos están de acuerdo en la actualización). La planificación cuidadosa y el consenso de la comunidad son cruciales para un hard fork exitoso.`,
    category: 'blockchain',
    relatedTerms: ['fork', 'soft-fork', 'blockchain', 'consenso'],
  },
  {
    term: 'Soft Fork',
    slug: 'soft-fork',
    definition: 'Actualización del protocolo compatible hacia atrás que no divide la blockchain.',
    explanation: `Un soft fork es un cambio en las reglas de una blockchain que es compatible hacia atrás. Los bloques creados bajo las nuevas reglas son válidos también bajo las reglas antiguas. Esto significa que los nodos que no actualicen seguirán aceptando los nuevos bloques.

Ejemplos en Bitcoin incluyen SegWit (2017), que cambió cómo se estructuran las transacciones para aumentar capacidad, y Taproot (2021), que mejoró privacidad y funcionalidad de contratos inteligentes. Ambos fueron soft forks que no dividieron la cadena.

Los soft forks son generalmente preferidos porque causan menos disrupción. Sin embargo, tienen limitaciones sobre qué tipo de cambios pueden implementarse. Cambios fundamentales en el diseño del protocolo típicamente requieren hard forks.`,
    category: 'blockchain',
    relatedTerms: ['fork', 'hard-fork', 'blockchain', 'segwit'],
  },
  {
    term: 'Inmutabilidad',
    slug: 'inmutabilidad',
    definition: 'Propiedad de blockchain que hace prácticamente imposible alterar datos una vez registrados.',
    explanation: `La inmutabilidad es una característica fundamental de las blockchains que garantiza que una vez que los datos se registran en un bloque confirmado, no pueden ser modificados o eliminados. Esta propiedad proviene de la combinación de hashes criptográficos y el mecanismo de consenso distribuido.

Modificar un bloque antiguo requeriría cambiar su hash, lo que a su vez cambiaría el hash del siguiente bloque, y así sucesivamente. Un atacante necesitaría rehacer todo el trabajo (en PoW) o controlar la mayoría del stake (en PoS) desde ese punto en adelante, algo económicamente inviable en redes maduras.

La inmutabilidad proporciona confianza: puedes verificar que las transacciones pasadas realmente ocurrieron y no han sido alteradas. Sin embargo, también significa que errores o transacciones fraudulentas no pueden deshacerse fácilmente, subrayando la importancia de la precaución.`,
    category: 'blockchain',
    relatedTerms: ['blockchain', 'hash', 'consenso', 'seguridad'],
  },

  // ==================== DEFI ====================
  {
    term: 'DeFi',
    slug: 'defi',
    definition: 'Finanzas Descentralizadas: servicios financieros construidos sobre blockchain sin intermediarios.',
    explanation: `DeFi (Decentralized Finance) es un ecosistema de aplicaciones financieras que operan sobre blockchains públicas, principalmente Ethereum. Estas aplicaciones replican y mejoran servicios financieros tradicionales (préstamos, intercambios, derivados) sin necesidad de bancos u otros intermediarios.

Los protocolos DeFi funcionan mediante smart contracts: código que ejecuta operaciones financieras automáticamente cuando se cumplen ciertas condiciones. Cualquiera con conexión a Internet puede acceder a estos servicios, sin verificación de identidad ni aprobación de un tercero.

El ecosistema DeFi incluye exchanges descentralizados (Uniswap), plataformas de préstamos (Aave, Compound), stablecoins (DAI), derivados, y más. Aunque ofrece mayor acceso y transparencia, también conlleva riesgos como bugs en smart contracts y volatilidad extrema.`,
    category: 'defi',
    relatedTerms: ['smart-contract', 'dex', 'liquidity-pool', 'yield-farming'],
    relatedArticle: 'defi-para-principiantes',
  },
  {
    term: 'Liquidity Pool',
    slug: 'liquidity-pool',
    definition: 'Fondo de tokens depositados en un smart contract para facilitar trading descentralizado.',
    explanation: `Un liquidity pool es un conjunto de fondos bloqueados en un smart contract que permite el intercambio de criptomonedas en exchanges descentralizados (DEXs). En lugar de un libro de órdenes tradicional, los traders intercambian contra el pool usando fórmulas matemáticas (normalmente x*y=k).

Los usuarios que depositan fondos en pools se llaman liquidity providers (LPs) y reciben tokens LP que representan su participación. A cambio de proporcionar liquidez, ganan una porción de las comisiones de trading generadas por el pool.

Por ejemplo, un pool ETH/USDC permite intercambiar entre estos dos tokens. Los precios se ajustan automáticamente según la oferta y demanda dentro del pool. Este mecanismo, llamado Automated Market Maker (AMM), fue popularizado por Uniswap y revolucionó el trading descentralizado.`,
    category: 'defi',
    relatedTerms: ['amm', 'dex', 'impermanent-loss', 'yield-farming'],
    relatedArticle: 'defi-para-principiantes',
  },
  {
    term: 'Yield Farming',
    slug: 'yield-farming',
    definition: 'Estrategia de maximizar rendimientos moviendo fondos entre protocolos DeFi.',
    explanation: `Yield farming es la práctica de buscar los mejores rendimientos en DeFi depositando criptomonedas en diferentes protocolos. Los "farmers" mueven sus fondos estratégicamente para aprovechar incentivos, recompensas de tokens, y oportunidades de arbitraje.

Los rendimientos pueden provenir de varias fuentes: comisiones de trading en liquidity pools, intereses por préstamos, recompensas de tokens de gobernanza, o combinaciones de todo lo anterior. Algunos protocolos ofrecen APYs de cientos o miles de por ciento durante períodos promocionales.

Sin embargo, yield farming conlleva riesgos significativos: impermanent loss, bugs en smart contracts, rug pulls, y la posibilidad de que los tokens de recompensa pierdan valor. La complejidad y los costos de gas también pueden erosionar ganancias para cantidades pequeñas.`,
    category: 'defi',
    relatedTerms: ['liquidity-pool', 'staking', 'apy', 'impermanent-loss'],
    relatedArticle: 'defi-para-principiantes',
  },
  {
    term: 'Staking',
    slug: 'staking',
    definition: 'Bloquear criptomonedas para participar en la validación de una red Proof of Stake.',
    explanation: `Staking es el proceso de bloquear criptomonedas en una red Proof of Stake para participar en la validación de transacciones y la seguridad de la red. A cambio, los stakers reciben recompensas en forma de nuevos tokens o comisiones de transacción.

En Ethereum 2.0, por ejemplo, necesitas 32 ETH para ejecutar un validador propio. Alternativamente, puedes usar servicios de staking líquido como Lido, que te permiten stakear cualquier cantidad y recibir un token (stETH) que representa tu posición y puede usarse en otros protocolos DeFi.

El staking es generalmente considerado menos riesgoso que el yield farming, pero no está libre de riesgos: los validadores pueden ser penalizados (slashed) por mal comportamiento, y los tokens stakeados suelen tener períodos de desbloqueo durante los cuales no puedes venderlos.`,
    category: 'defi',
    relatedTerms: ['proof-of-stake', 'validador', 'yield-farming', 'defi'],
    relatedArticle: 'defi-para-principiantes',
  },
  {
    term: 'AMM',
    slug: 'amm',
    definition: 'Automated Market Maker: algoritmo que determina precios automáticamente en DEXs sin libro de órdenes.',
    explanation: `Un AMM (Creador de Mercado Automatizado) es un tipo de protocolo de exchange descentralizado que utiliza fórmulas matemáticas para fijar precios de activos en lugar de un libro de órdenes tradicional. El modelo más común es la fórmula de producto constante: x * y = k.

En este modelo, si un pool contiene ETH y USDC, el producto de ambas cantidades debe permanecer constante. Cuando alguien compra ETH, deposita USDC y retira ETH, cambiando las proporciones y por ende el precio. Cuanto más desbalanceado queda el pool, más caro se vuelve seguir moviendo en esa dirección.

Uniswap popularizó este modelo, y desde entonces han surgido variaciones como Curve (optimizado para stablecoins con la misma paridad) y Balancer (pools con más de dos tokens y pesos personalizados). Los AMMs democratizaron la provisión de liquidez y el trading.`,
    category: 'defi',
    relatedTerms: ['dex', 'liquidity-pool', 'uniswap', 'slippage'],
    relatedArticle: 'defi-para-principiantes',
  },
  {
    term: 'DEX',
    slug: 'dex',
    definition: 'Exchange Descentralizado que permite intercambiar criptomonedas sin intermediarios.',
    explanation: `Un DEX (Decentralized Exchange) es una plataforma de intercambio de criptomonedas que opera sin una autoridad central. A diferencia de exchanges centralizados como Binance o Coinbase, en un DEX tú mantienes control de tus fondos en todo momento; el exchange nunca tiene custodia de tus activos.

Los DEXs modernos funcionan principalmente con AMMs y liquidity pools. Conectas tu wallet (como MetaMask), apruebas la transacción, y el smart contract ejecuta el intercambio directamente desde tu wallet. Ejemplos populares incluyen Uniswap, SushiSwap, PancakeSwap, y Curve.

Las ventajas de los DEXs incluyen: sin KYC, acceso global, resistencia a censura, y no hay riesgo de que el exchange sea hackeado y pierdas tus fondos. Las desventajas son: mayores costos de gas, menor liquidez para algunos pares, y la responsabilidad total de la seguridad recae en el usuario.`,
    category: 'defi',
    relatedTerms: ['amm', 'cex', 'liquidity-pool', 'smart-contract'],
    relatedArticle: 'defi-para-principiantes',
  },
  {
    term: 'Smart Contract',
    slug: 'smart-contract',
    definition: 'Programa autoejecutante almacenado en blockchain que ejecuta acciones cuando se cumplen condiciones.',
    explanation: `Un smart contract (contrato inteligente) es código almacenado en una blockchain que se ejecuta automáticamente cuando se cumplen condiciones predefinidas. Una vez desplegado, el contrato es inmutable y su ejecución es determinista: siempre produce el mismo resultado dado el mismo input.

Ethereum fue la primera blockchain diseñada específicamente para smart contracts, introduciendo un lenguaje Turing-completo (Solidity) que permite programar lógica compleja. Otras blockchains como Solana, Avalanche, y Cardano también soportan smart contracts.

Los smart contracts son la base de DeFi, NFTs, DAOs, y prácticamente toda la innovación en Web3. Permiten crear productos financieros, mercados, sistemas de votación, y cualquier lógica que pueda expresarse en código, todo de forma transparente y sin intermediarios.`,
    category: 'defi',
    relatedTerms: ['ethereum', 'defi', 'dapp', 'gas'],
    relatedArticle: 'que-es-blockchain-explicado',
  },
  {
    term: 'Token',
    slug: 'token',
    definition: 'Activo digital creado sobre una blockchain existente, representando valor o utilidad.',
    explanation: `Un token es un activo digital que existe sobre una blockchain ya establecida, a diferencia de una coin (moneda) que tiene su propia blockchain nativa. Por ejemplo, ETH es la coin nativa de Ethereum, pero USDC, UNI, y miles de otros tokens existen sobre Ethereum usando el estándar ERC-20.

Los tokens pueden representar muchas cosas: utilidad dentro de una plataforma (governance tokens), activos del mundo real (tokenized assets), derechos de propiedad (NFTs), stablecoins vinculadas a monedas fiat, y más. La flexibilidad del modelo de tokens ha permitido una explosión de innovación.

Crear un token es relativamente simple: cualquiera puede desplegar un smart contract ERC-20 en minutos. Sin embargo, esto también ha llevado a miles de tokens sin valor real o directamente fraudulentos. Siempre investiga antes de interactuar con cualquier token.`,
    category: 'defi',
    relatedTerms: ['smart-contract', 'erc-20', 'ethereum', 'governance'],
  },
  {
    term: 'Governance Token',
    slug: 'governance-token',
    definition: 'Token que otorga derechos de voto sobre decisiones de un protocolo descentralizado.',
    explanation: `Un governance token permite a sus holders participar en la toma de decisiones de un protocolo. Los holders pueden proponer cambios (mejoras del protocolo, ajuste de parámetros, uso del tesoro) y votar sobre propuestas de otros.

Ejemplos incluyen UNI (Uniswap), AAVE, COMP (Compound), y MKR (MakerDAO). Típicamente, el poder de voto es proporcional a la cantidad de tokens que posees, aunque algunos sistemas implementan votación cuadrática u otros mecanismos para equilibrar la influencia.

La gobernanza descentralizada es un experimento en tiempo real sobre cómo coordinar grandes grupos de personas con intereses diversos. Los desafíos incluyen baja participación en votaciones, concentración de poder en grandes holders (whales), y la dificultad de tomar decisiones técnicas complejas de forma democrática.`,
    category: 'defi',
    relatedTerms: ['dao', 'token', 'defi', 'descentralizacion'],
  },
  {
    term: 'TVL',
    slug: 'tvl',
    definition: 'Total Value Locked: valor total de activos depositados en un protocolo DeFi.',
    explanation: `TVL (Valor Total Bloqueado) es una métrica que mide la cantidad total de fondos depositados en un protocolo DeFi. Se calcula sumando el valor en dólares de todos los activos bloqueados en los smart contracts del protocolo.

El TVL es útil para comparar el tamaño relativo de protocolos y evaluar la confianza que la comunidad deposita en ellos. Un TVL alto sugiere que muchos usuarios confían sus fondos al protocolo. Sin embargo, el TVL puede ser manipulado y no refleja necesariamente seguridad o calidad.

Sitios como DefiLlama rastrean el TVL de cientos de protocolos en múltiples blockchains. En su pico en 2021, el TVL total de DeFi superó los $180 mil millones. Las fluctuaciones del TVL reflejan tanto cambios en precios de activos como entradas/salidas reales de fondos.`,
    category: 'defi',
    relatedTerms: ['defi', 'liquidity-pool', 'smart-contract'],
    relatedArticle: 'defi-para-principiantes',
  },
  {
    term: 'Impermanent Loss',
    slug: 'impermanent-loss',
    definition: 'Pérdida temporal que sufren los proveedores de liquidez cuando los precios de tokens divergen.',
    explanation: `Impermanent Loss (IL) es el costo de oportunidad que experimentan los liquidity providers cuando el precio de los tokens en un pool cambia respecto al momento del depósito. Se llama "impermanente" porque la pérdida solo se realiza al retirar la liquidez; si los precios vuelven al punto original, la pérdida desaparece.

Por ejemplo, si depositas valor igual de ETH y USDC en un pool, y el precio de ETH sube significativamente, el pool se rebalancea automáticamente vendiendo ETH caro y comprando USDC. Cuando retiras, tendrás menos ETH del que habrías tenido si simplemente hubieras mantenido ambos tokens.

El IL puede compensarse con las comisiones ganadas por proporcionar liquidez, pero no siempre. Pools de tokens correlacionados (como stablecoins) tienen menos IL. Entender este concepto es crucial antes de proveer liquidez en cualquier DEX.`,
    category: 'defi',
    relatedTerms: ['liquidity-pool', 'amm', 'dex', 'yield-farming'],
    relatedArticle: 'defi-para-principiantes',
  },

  // ==================== TRADING ====================
  {
    term: 'Exchange',
    slug: 'exchange',
    definition: 'Plataforma donde se compran, venden e intercambian criptomonedas.',
    explanation: `Un exchange de criptomonedas es una plataforma que facilita el intercambio de activos digitales. Existen dos tipos principales: centralizados (CEX) y descentralizados (DEX). Los CEX como Binance, Coinbase o Kraken funcionan como intermediarios, mientras los DEX operan mediante smart contracts.

Los exchanges centralizados ofrecen mayor liquidez, interfaces más amigables, y funciones avanzadas como trading con margen. Sin embargo, requieren confiar tus fondos a la plataforma ("not your keys, not your coins") y típicamente exigen verificación de identidad (KYC).

Al elegir un exchange, considera: seguridad (historial de hackeos, 2FA, cold storage), liquidez, comisiones, métodos de pago disponibles, y cumplimiento regulatorio en tu jurisdicción. Para principiantes, los exchanges con buena reputación y soporte en español suelen ser la mejor opción inicial.`,
    category: 'trading',
    relatedTerms: ['cex', 'dex', 'order-book', 'kyc'],
    relatedArticle: 'como-comprar-bitcoin-espana',
  },
  {
    term: 'CEX',
    slug: 'cex',
    definition: 'Centralized Exchange: plataforma de trading administrada por una empresa central.',
    explanation: `Un CEX (Centralized Exchange) es una plataforma de intercambio de criptomonedas operada por una empresa que actúa como intermediario entre compradores y vendedores. Ejemplos incluyen Binance, Coinbase, Kraken, y Bit2Me.

En un CEX, depositas tus fondos en wallets controladas por la empresa. Esto permite operaciones rápidas y eficientes, pero significa que no tienes control total de tus activos. La empresa puede congelar cuentas, sufrir hackeos, o incluso quebrar (como ocurrió con FTX en 2022).

Los CEX son populares por su facilidad de uso, soporte al cliente, alta liquidez, y funciones avanzadas. Sin embargo, para almacenamiento a largo plazo, es recomendable transferir tus criptomonedas a una wallet de autocustodia donde solo tú controles las llaves privadas.`,
    category: 'trading',
    relatedTerms: ['exchange', 'dex', 'custodial', 'kyc'],
    relatedArticle: 'como-comprar-bitcoin-espana',
  },
  {
    term: 'Order Book',
    slug: 'order-book',
    definition: 'Lista de órdenes de compra y venta pendientes en un exchange.',
    explanation: `El order book (libro de órdenes) es una lista en tiempo real de todas las órdenes de compra (bids) y venta (asks) pendientes en un exchange para un par de trading específico. Es el mecanismo tradicional que utilizan los mercados financieros para emparejar compradores y vendedores.

Las órdenes de compra se listan en orden descendente de precio (la mejor oferta arriba), mientras las órdenes de venta se listan en orden ascendente. La diferencia entre la mejor oferta de compra y la mejor oferta de venta se llama spread.

Analizar el order book ayuda a entender la liquidez del mercado, identificar niveles de soporte/resistencia, y anticipar movimientos de precio. Un order book con muchas órdenes a múltiples niveles indica buena liquidez; uno disperso puede significar alta volatilidad en trades grandes.`,
    category: 'trading',
    relatedTerms: ['exchange', 'cex', 'liquidez', 'spread'],
  },
  {
    term: 'Volatilidad',
    slug: 'volatilidad',
    definition: 'Medida de cuánto fluctúa el precio de un activo en un período determinado.',
    explanation: `La volatilidad describe la magnitud y frecuencia de los cambios de precio de un activo. Las criptomonedas son conocidas por su alta volatilidad: es común ver movimientos del 10-20% en un día, algo raro en mercados tradicionales como acciones o divisas.

La volatilidad puede medirse de varias formas, siendo la más común la desviación estándar de los retornos. Un activo con alta volatilidad puede subir o bajar significativamente en corto plazo, lo que representa tanto oportunidades como riesgos.

Para traders, la volatilidad crea oportunidades de ganancia a corto plazo. Para inversores a largo plazo, significa que deben estar preparados para ver su portafolio fluctuar dramáticamente sin entrar en pánico. La volatilidad tiende a disminuir a medida que un activo madura y su mercado se hace más líquido.`,
    category: 'trading',
    relatedTerms: ['trading', 'bull-market', 'bear-market', 'riesgo'],
  },
  {
    term: 'Bull Market',
    slug: 'bull-market',
    definition: 'Mercado alcista caracterizado por precios en aumento y optimismo generalizado.',
    explanation: `Un bull market (mercado alcista o toro) es un período prolongado donde los precios de los activos suben consistentemente y el sentimiento del mercado es optimista. El término viene de la forma en que un toro ataca: moviendo los cuernos hacia arriba.

En crypto, los bull markets son particularmente dramáticos, con activos subiendo 10x, 100x o más. Estos ciclos suelen estar impulsados por adopción creciente, desarrollos tecnológicos positivos, y el famoso FOMO (Fear Of Missing Out) que atrae nuevos inversores.

Históricamente, los bull markets de Bitcoin han seguido los halvings (aproximadamente cada 4 años), aunque esta correlación no garantiza resultados futuros. Durante un bull market, es fácil volverse demasiado confiado; los inversores prudentes toman ganancias graduales y mantienen perspectiva a largo plazo.`,
    category: 'trading',
    relatedTerms: ['bear-market', 'ath', 'fomo', 'halving'],
  },
  {
    term: 'Bear Market',
    slug: 'bear-market',
    definition: 'Mercado bajista con precios en declive sostenido y pesimismo dominante.',
    explanation: `Un bear market (mercado bajista u oso) es un período prolongado de caída de precios, típicamente definido como una bajada del 20% o más desde máximos recientes. El término viene de cómo un oso ataca: con zarpazos hacia abajo.

Los bear markets en crypto pueden ser brutales, con caídas del 80-90% desde máximos históricos. El "crypto winter" de 2018-2019 y 2022-2023 vio muchos proyectos desaparecer y a inversores retail abandonar el mercado.

Sin embargo, los bear markets también son períodos de construcción. Los proyectos serios continúan desarrollando, y los inversores con perspectiva a largo plazo pueden acumular a precios bajos. El viejo dicho de "comprar cuando hay sangre en las calles" aplica, aunque cronometrar el fondo exacto es imposible.`,
    category: 'trading',
    relatedTerms: ['bull-market', 'hodl', 'volatilidad', 'dca'],
  },
  {
    term: 'ATH',
    slug: 'ath',
    definition: 'All-Time High: el precio máximo histórico alcanzado por un activo.',
    explanation: `ATH (All-Time High o Máximo Histórico) es el precio más alto que un activo ha alcanzado en toda su historia. Es una métrica psicológicamente importante porque superar el ATH anterior suele generar titulares, FOMO, y atraer nuevos inversores.

Por ejemplo, Bitcoin alcanzó un ATH de casi $69,000 en noviembre de 2021, antes de caer significativamente. Cada vez que se acerca a ese nivel, hay expectativa sobre si lo superará y establecerá un nuevo ATH.

Cuando un activo está en ATH, todos los holders están en ganancia, lo que reduce la presión de venta por personas queriendo "recuperar su inversión". Sin embargo, también puede ser un momento de mayor riesgo, ya que no hay resistencias históricas por encima y la euforia puede llevar a valoraciones insostenibles.`,
    category: 'trading',
    relatedTerms: ['bull-market', 'volatilidad', 'market-cap'],
  },
  {
    term: 'Market Cap',
    slug: 'market-cap',
    definition: 'Capitalización de mercado: precio actual multiplicado por el suministro circulante.',
    explanation: `Market cap (capitalización de mercado) es una métrica que representa el valor total de mercado de una criptomoneda. Se calcula multiplicando el precio actual por el número de tokens/coins en circulación. Es útil para comparar el tamaño relativo de diferentes proyectos.

Por ejemplo, si Bitcoin cotiza a $40,000 y hay 19.5 millones de BTC en circulación, su market cap es aproximadamente $780 mil millones. Esto lo convierte en la criptomoneda más grande por mucho, seguida típicamente por Ethereum.

Sin embargo, market cap tiene limitaciones. El "suministro circulante" puede ser debatible, y el precio puede estar inflado por baja liquidez. Una métrica complementaria es el "fully diluted market cap", que considera todos los tokens que eventualmente existirán, no solo los circulantes actualmente.`,
    category: 'trading',
    relatedTerms: ['bitcoin', 'ath', 'liquidez', 'token'],
  },
  {
    term: 'Ballena',
    slug: 'ballena',
    definition: 'Individuo o entidad que posee grandes cantidades de criptomonedas.',
    explanation: `Una ballena (whale) es alguien que posee una cantidad significativa de criptomonedas, suficiente para potencialmente influir en el precio del mercado con sus trades. No hay una definición exacta, pero generalmente se considera ballena a quien tiene más de 1,000 BTC o el equivalente en otras criptos.

Las ballenas incluyen: early adopters de Bitcoin, fondos de inversión institucionales, empresas como MicroStrategy, y exchanges que mantienen reservas. Sus movimientos son seguidos de cerca porque una venta grande puede mover significativamente el precio.

Servicios como Whale Alert rastrean transacciones grandes en blockchains públicas. Cuando una ballena mueve grandes cantidades a un exchange, puede anticipar una venta. Movimientos hacia cold storage sugieren acumulación a largo plazo. Sin embargo, interpretar estos movimientos no es ciencia exacta.`,
    category: 'trading',
    relatedTerms: ['bitcoin', 'market-cap', 'volatilidad', 'exchange'],
  },

  // ==================== WALLETS ====================
  {
    term: 'Wallet',
    slug: 'wallet',
    definition: 'Software o dispositivo que almacena las claves privadas para acceder a criptomonedas.',
    explanation: `Una wallet (cartera) de criptomonedas es una herramienta que almacena tus claves privadas y te permite enviar y recibir crypto. Contrariamente a la intuición, la wallet no "contiene" tus criptomonedas; estas existen en la blockchain. La wallet simplemente guarda las llaves que demuestran tu propiedad.

Existen varios tipos: hot wallets (conectadas a Internet, como apps móviles o extensiones de navegador), cold wallets (offline, como hardware wallets), paper wallets (claves impresas), y wallets multisig que requieren múltiples firmas para transacciones.

La elección de wallet depende del uso y la cantidad. Para transacciones frecuentes con pequeñas cantidades, una hot wallet es conveniente. Para ahorros a largo plazo, una hardware wallet proporciona mayor seguridad. Lo crucial es entender que quien controla las claves, controla los fondos.`,
    category: 'wallets',
    relatedTerms: ['clave-privada', 'seed-phrase', 'hot-wallet', 'hardware-wallet'],
    relatedArticle: 'soberania-financiera-bitcoin',
  },
  {
    term: 'Seed Phrase',
    slug: 'seed-phrase',
    definition: 'Lista de 12-24 palabras que permite recuperar una wallet y todos sus fondos.',
    explanation: `La seed phrase (frase semilla), también llamada frase de recuperación o mnemónica, es una lista de palabras (típicamente 12 o 24) que codifica la clave maestra de tu wallet. Con esta frase, puedes recuperar acceso a todos tus fondos en cualquier wallet compatible, incluso si pierdes tu dispositivo.

Estas palabras se generan aleatoriamente de una lista estandarizada (BIP-39) y representan un número muy grande (tu clave privada) de forma legible por humanos. El orden importa: las mismas palabras en diferente orden generan una wallet completamente distinta.

La seguridad de tu seed phrase es crítica. Nunca la compartas con nadie, nunca la fotografíes ni guardes digitalmente, nunca la introduzcas en sitios web. Escríbela en papel (o mejor, en metal para resistir fuego/agua) y guárdala en lugar seguro, idealmente con copias en ubicaciones separadas.`,
    category: 'wallets',
    relatedTerms: ['wallet', 'clave-privada', 'cold-storage', 'seguridad'],
    relatedArticle: 'soberania-financiera-bitcoin',
  },
  {
    term: 'Clave Privada',
    slug: 'clave-privada',
    definition: 'Código secreto que permite controlar y gastar criptomonedas en una dirección.',
    explanation: `Una clave privada es un número secreto (típicamente 256 bits de longitud) que permite firmar transacciones y demostrar propiedad de los fondos asociados a una dirección de criptomonedas. Es el equivalente digital a la llave de una caja fuerte.

La clave privada genera matemáticamente una clave pública, que a su vez genera tu dirección. Este proceso es unidireccional: es imposible derivar la clave privada a partir de la dirección. Las transacciones se firman con la clave privada pero se verifican con la clave pública.

Quien posee la clave privada, posee los fondos. Si alguien obtiene tu clave privada, puede robar todo tu crypto. Si pierdes tu clave privada (y no tienes seed phrase), pierdes acceso permanente a tus fondos. Por eso las hardware wallets nunca revelan la clave privada, ni siquiera a ti.`,
    category: 'wallets',
    relatedTerms: ['clave-publica', 'seed-phrase', 'wallet', 'firma-digital'],
  },
  {
    term: 'Clave Pública',
    slug: 'clave-publica',
    definition: 'Código derivado de la clave privada que puede compartirse para recibir fondos.',
    explanation: `La clave pública es un identificador criptográfico derivado de tu clave privada que puede compartirse libremente. A partir de ella se genera tu dirección de criptomonedas (aunque no son exactamente lo mismo; la dirección es un hash de la clave pública).

La relación entre clave privada y pública es fundamental para la criptografía de blockchain: puedes firmar mensajes con tu clave privada, y cualquiera con tu clave pública puede verificar que la firma es auténtica sin conocer la clave privada.

Mientras que la clave privada debe mantenerse secreta, la clave pública está diseñada para ser compartida. Cuando alguien quiere enviarte Bitcoin, le das tu dirección (derivada de tu clave pública). Es matemáticamente imposible calcular la clave privada a partir de la pública.`,
    category: 'wallets',
    relatedTerms: ['clave-privada', 'direccion', 'criptografia', 'wallet'],
  },
  {
    term: 'Hot Wallet',
    slug: 'hot-wallet',
    definition: 'Wallet conectada a Internet, conveniente para uso frecuente pero menos segura.',
    explanation: `Una hot wallet es cualquier wallet de criptomonedas que está conectada a Internet. Incluye aplicaciones móviles (Trust Wallet, BlueWallet), extensiones de navegador (MetaMask, Rabby), y wallets de escritorio. Son "calientes" porque están en línea y listas para transaccionar.

Las ventajas de las hot wallets son su conveniencia: puedes enviar y recibir crypto en segundos, interactuar con aplicaciones DeFi, y acceder a tus fondos desde cualquier lugar. Son ideales para cantidades pequeñas de uso diario.

El riesgo principal es que al estar conectadas a Internet, son vulnerables a hackeos, malware, y phishing. Si tu computadora o teléfono se compromete, un atacante podría robar tus fondos. Por eso se recomienda mantener solo pequeñas cantidades en hot wallets y el grueso del patrimonio en cold storage.`,
    category: 'wallets',
    relatedTerms: ['cold-wallet', 'wallet', 'seguridad', 'metamask'],
  },
  {
    term: 'Cold Wallet',
    slug: 'cold-wallet',
    definition: 'Wallet mantenida offline para máxima seguridad contra ataques remotos.',
    explanation: `Una cold wallet (wallet fría) almacena tus claves privadas en un dispositivo que nunca se conecta a Internet, eliminando el riesgo de hackeos remotos. Los tipos más comunes son hardware wallets (Ledger, Trezor, Coldcard) y paper wallets (claves impresas).

Las hardware wallets son dispositivos especializados que generan y almacenan claves privadas en un chip seguro. Cuando quieres hacer una transacción, conectas el dispositivo, verificas los detalles en su pantalla, y firmas. La clave privada nunca sale del dispositivo.

Las cold wallets son esenciales para cantidades significativas de criptomonedas. La inversión en una hardware wallet (€50-200) es trivial comparada con el valor que puede proteger. La desventaja es menor conveniencia: necesitas tener el dispositivo físicamente para transaccionar.`,
    category: 'wallets',
    relatedTerms: ['hot-wallet', 'hardware-wallet', 'seed-phrase', 'cold-storage'],
    relatedArticle: 'soberania-financiera-bitcoin',
  },
  {
    term: 'Hardware Wallet',
    slug: 'hardware-wallet',
    definition: 'Dispositivo físico especializado para almacenar claves privadas de forma segura.',
    explanation: `Una hardware wallet es un dispositivo electrónico diseñado específicamente para almacenar claves privadas de criptomonedas. Marcas populares incluyen Ledger (Nano S, Nano X), Trezor (One, Model T), Coldcard, y BitBox.

Estos dispositivos mantienen las claves privadas en un chip seguro que es resistente a extracción. Incluso si conectas la wallet a una computadora infectada, el malware no puede robar tus claves. Las transacciones se verifican y firman directamente en el dispositivo usando su pantalla y botones físicos.

La seguridad de una hardware wallet depende de: comprar solo de vendedores oficiales (evitar dispositivos usados o de terceros), verificar que el empaque esté sellado, generar tu propia seed phrase (no usar una preconfigurada), y mantener la seed phrase segura y separada del dispositivo.`,
    category: 'wallets',
    relatedTerms: ['cold-wallet', 'seed-phrase', 'clave-privada', 'ledger'],
    relatedArticle: 'soberania-financiera-bitcoin',
  },
  {
    term: 'Custodial',
    slug: 'custodial',
    definition: 'Servicio donde un tercero guarda las claves privadas de tus criptomonedas.',
    explanation: `Una wallet o servicio custodial es aquel donde una empresa (típicamente un exchange) mantiene control de las claves privadas en tu nombre. Tú tienes una cuenta con usuario y contraseña, pero la empresa controla realmente los fondos.

Las soluciones custodiales son convenientes: fáciles de usar, recuperación de contraseña posible, y sin preocuparte por la seguridad técnica de tus claves. Son una buena opción para principiantes que están aprendiendo.

Sin embargo, "not your keys, not your coins" (no son tus llaves, no son tus monedas). Cuando un custodio es hackeado o quiebra (como Mt. Gox o FTX), los usuarios pueden perder todo. Para almacenamiento a largo plazo, la autocustodia (non-custodial) es preferible.`,
    category: 'wallets',
    relatedTerms: ['non-custodial', 'exchange', 'cex', 'clave-privada'],
  },
  {
    term: 'Non-Custodial',
    slug: 'non-custodial',
    definition: 'Wallet donde solo tú controlas las claves privadas de tus criptomonedas.',
    explanation: `Una wallet non-custodial (de autocustodia) es aquella donde tú y solo tú tienes acceso a las claves privadas. Ninguna empresa, gobierno o tercero puede acceder a tus fondos o censurarte. Ejemplos incluyen MetaMask, Ledger, y cualquier wallet donde tú generas y guardas la seed phrase.

La autocustodia es el principio fundamental de Bitcoin: ser tu propio banco. Elimina el riesgo de contraparte (que el custodio falle) pero traslada toda la responsabilidad de seguridad a ti. Si pierdes tu seed phrase, pierdes acceso permanente a tus fondos.

Para practicar autocustodia de forma segura: usa una hardware wallet para cantidades significativas, guarda múltiples copias de tu seed phrase en ubicaciones seguras, nunca la compartas con nadie, y practica con pequeñas cantidades antes de mover sumas importantes.`,
    category: 'wallets',
    relatedTerms: ['custodial', 'seed-phrase', 'descentralizacion', 'wallet'],
    relatedArticle: 'soberania-financiera-bitcoin',
  },

  // ==================== WEB3 ====================
  {
    term: 'Web3',
    slug: 'web3',
    definition: 'Visión de Internet descentralizado construido sobre blockchains y propiedad digital.',
    explanation: `Web3 es el término que describe una nueva generación de Internet basada en blockchains, donde los usuarios tienen propiedad real de sus datos, activos digitales e identidad. Contrasta con Web2 (plataformas centralizadas como Facebook, Google) y Web1 (páginas estáticas de los 90s).

La promesa de Web3 es que, en lugar de crear contenido que enriquece a plataformas, los usuarios son dueños de lo que crean. Los NFTs permiten poseer arte digital, los tokens representan participación en comunidades, y las DAOs permiten gobernanza colectiva sin corporaciones.

Web3 todavía está en desarrollo temprano, con desafíos significativos de usabilidad, escalabilidad y seguridad. Los críticos argumentan que gran parte del ecosistema reproduce los mismos problemas de centralización que pretende resolver. Sin embargo, la tecnología subyacente continúa madurando.`,
    category: 'web3',
    relatedTerms: ['blockchain', 'nft', 'dao', 'descentralizacion'],
  },
  {
    term: 'DAO',
    slug: 'dao',
    definition: 'Organización Autónoma Descentralizada gobernada por reglas codificadas en smart contracts.',
    explanation: `Una DAO (Decentralized Autonomous Organization) es una organización donde las reglas de gobernanza y la ejecución de decisiones están codificadas en smart contracts. Los miembros, típicamente holders de un governance token, votan propuestas que se ejecutan automáticamente si son aprobadas.

Las DAOs permiten coordinación global sin jerarquías tradicionales. Ejemplos incluyen MakerDAO (que gobierna el stablecoin DAI), Uniswap (gobernanza del DEX), y Constitution DAO (que intentó comprar una copia de la Constitución de EE.UU.).

Los desafíos incluyen: baja participación en votaciones, concentración de poder en grandes holders, dificultad para tomar decisiones rápidas, y vulnerabilidades de smart contracts. El "The DAO" original fue hackeado en 2016, resultando en la división de Ethereum y Ethereum Classic.`,
    category: 'web3',
    relatedTerms: ['smart-contract', 'governance-token', 'descentralizacion', 'defi'],
  },
  {
    term: 'NFT',
    slug: 'nft',
    definition: 'Non-Fungible Token: activo digital único e irrepetible registrado en blockchain.',
    explanation: `Un NFT (Token No Fungible) es un activo digital único registrado en blockchain. A diferencia de Bitcoin o Ether (donde cada unidad es idéntica), cada NFT es distinguible y puede representar propiedad de arte digital, coleccionables, acceso a comunidades, y más.

Los NFTs explotaron en popularidad en 2021 con ventas multimillonarias de arte digital. Plataformas como OpenSea, Foundation y Blur facilitan la creación y comercio de NFTs. La tecnología se ha expandido a música, moda, deportes y gaming.

Sin embargo, el mercado de NFTs ha sido criticado por especulación excesiva, wash trading (ventas falsas para inflar precios), y proyectos fraudulentos. La mayoría de NFTs han perdido gran parte de su valor desde los máximos de 2021. El valor real está en los casos de uso que van más allá de JPEGs especulativos.`,
    category: 'web3',
    relatedTerms: ['token', 'ethereum', 'smart-contract', 'arte-digital'],
  },
  {
    term: 'Metaverso',
    slug: 'metaverso',
    definition: 'Mundo virtual inmersivo donde usuarios interactúan mediante avatares digitales.',
    explanation: `El metaverso es un concepto de mundos virtuales persistentes donde las personas pueden interactuar, trabajar, jugar y socializar mediante avatares digitales. Aunque el término precede a crypto, la tecnología blockchain añade la dimensión de propiedad real de activos digitales dentro de estos mundos.

Proyectos como Decentraland y The Sandbox permiten comprar terrenos virtuales (como NFTs), construir experiencias, y crear economías dentro del metaverso. Grandes marcas han experimentado con presencias virtuales, conciertos y eventos.

El hype alrededor del metaverso alcanzó su pico cuando Facebook se renombró a Meta en 2021. Desde entonces, el interés ha disminuido, pero el desarrollo continúa. Los desafíos incluyen adopción de usuarios, experiencias de usuario limitadas, y la pregunta de por qué alguien pasaría tiempo significativo en estos mundos.`,
    category: 'web3',
    relatedTerms: ['nft', 'web3', 'realidad-virtual', 'decentraland'],
  },
  {
    term: 'dApp',
    slug: 'dapp',
    definition: 'Aplicación descentralizada que funciona sobre una blockchain en lugar de servidores centrales.',
    explanation: `Una dApp (decentralized application) es una aplicación cuyo backend funciona sobre una blockchain. A diferencia de apps tradicionales que dependen de servidores de una empresa, las dApps ejecutan su lógica en smart contracts distribuidos entre miles de nodos.

Las dApps más populares están en DeFi (Uniswap, Aave), NFTs (OpenSea), y gaming (Axie Infinity). Se acceden típicamente conectando una wallet como MetaMask al sitio web de la dApp, que entonces puede interactuar con la blockchain en tu nombre.

Los beneficios incluyen: resistencia a censura, transparencia del código, y control del usuario sobre sus fondos. Las desventajas son: experiencia de usuario más compleja, costos de gas, y menor velocidad que apps tradicionales. La mejora de la usabilidad es crucial para la adopción masiva.`,
    category: 'web3',
    relatedTerms: ['smart-contract', 'defi', 'ethereum', 'web3'],
    relatedArticle: 'defi-para-principiantes',
  },
  {
    term: 'Gas',
    slug: 'gas',
    definition: 'Unidad que mide el costo computacional de ejecutar operaciones en Ethereum.',
    explanation: `Gas es la unidad que mide el trabajo computacional requerido para ejecutar operaciones en Ethereum. Cada operación (transferir tokens, interactuar con un smart contract) tiene un costo en gas. El precio del gas fluctúa según la demanda de la red.

El costo total de una transacción = gas usado × precio del gas. Durante períodos de alta demanda (lanzamiento de NFTs populares, actividad DeFi intensa), el precio del gas puede dispararse, haciendo transacciones simples costosas.

Para optimizar costos de gas: usa la red en horas de baja actividad, establece límites de gas apropiados, considera soluciones de Layer 2 como Arbitrum o Optimism que tienen fees mucho menores. Herramientas como GasNow o ETH Gas Station ayudan a estimar precios de gas apropiados.`,
    category: 'web3',
    relatedTerms: ['ethereum', 'transaccion', 'smart-contract', 'layer-2'],
    relatedArticle: 'defi-para-principiantes',
  },
  {
    term: 'Layer 2',
    slug: 'layer-2',
    definition: 'Solución construida sobre una blockchain principal para mejorar escalabilidad y reducir costos.',
    explanation: `Layer 2 (capa 2) se refiere a soluciones construidas "encima" de una blockchain principal (Layer 1) para procesar transacciones más rápido y barato, mientras heredan la seguridad de la capa base. Es como una autopista express sobre una carretera congestionada.

Ejemplos en Ethereum incluyen Arbitrum, Optimism (optimistic rollups), y zkSync, StarkNet (zero-knowledge rollups). En Bitcoin, Lightning Network es la solución Layer 2 más desarrollada. Cada tecnología tiene diferentes trade-offs entre seguridad, velocidad y compatibilidad.

El objetivo es que los usuarios interactúen principalmente en Layer 2 para actividades cotidianas, y solo usen Layer 1 para settlement final de grandes cantidades. Esto permitiría que las blockchains escalen a millones de usuarios sin sacrificar descentralización.`,
    category: 'web3',
    relatedTerms: ['lightning-network', 'ethereum', 'escalabilidad', 'rollup'],
    relatedArticle: 'defi-para-principiantes',
  },

  // ==================== SEGURIDAD ====================
  {
    term: 'Criptografía',
    slug: 'criptografia',
    definition: 'Ciencia de proteger información mediante técnicas matemáticas de codificación.',
    explanation: `La criptografía es la base matemática sobre la que se construye toda la tecnología blockchain. Utiliza funciones matemáticas para garantizar que las transacciones sean seguras, que las claves privadas no puedan derivarse de claves públicas, y que los datos sean inmutables.

Los elementos criptográficos clave en blockchain incluyen: funciones hash (SHA-256 en Bitcoin), criptografía de curva elíptica (para generar claves públicas/privadas), y firmas digitales (para autorizar transacciones sin revelar la clave privada).

Para usuarios no técnicos, lo importante es entender que la criptografía de Bitcoin y blockchains maduras ha sido probada extensivamente y es extremadamente segura. Las pérdidas de fondos ocurren por errores humanos (phishing, pérdida de seed phrase), no por fallas en la criptografía.`,
    category: 'seguridad',
    relatedTerms: ['hash', 'clave-privada', 'firma-digital', 'blockchain'],
  },
  {
    term: 'Hash',
    slug: 'hash',
    definition: 'Huella digital única generada a partir de cualquier dato mediante una función matemática.',
    explanation: `Un hash es el resultado de pasar datos a través de una función hash criptográfica. Sin importar el tamaño del input (una palabra o una biblioteca entera), el output tiene siempre el mismo tamaño. En Bitcoin, SHA-256 produce hashes de 64 caracteres hexadecimales.

Las propiedades clave de un hash son: es determinista (el mismo input siempre da el mismo output), es unidireccional (imposible derivar el input del output), y pequeños cambios en el input cambian completamente el output. Esto lo hace ideal para verificar integridad de datos.

En blockchain, los hashes se usan para: identificar bloques, crear el enlace entre bloques (cada bloque contiene el hash del anterior), verificar transacciones, y en la minería de Proof of Work donde se busca un hash que cumpla ciertas condiciones.`,
    category: 'seguridad',
    relatedTerms: ['criptografia', 'bloque', 'proof-of-work', 'merkle-tree'],
  },
  {
    term: '2FA',
    slug: '2fa',
    definition: 'Autenticación de Dos Factores: capa adicional de seguridad que requiere dos verificaciones.',
    explanation: `2FA (Two-Factor Authentication) añade una segunda capa de seguridad más allá de la contraseña. Para acceder a tu cuenta, necesitas "algo que sabes" (contraseña) y "algo que tienes" (tu teléfono con una app de autenticación).

Las formas comunes de 2FA incluyen: códigos SMS (menos seguro, vulnerable a SIM swapping), apps de autenticación como Google Authenticator o Authy (más seguro), y llaves de seguridad físicas como YubiKey (más seguro aún).

Para cuentas de crypto exchanges, 2FA es absolutamente esencial. Preferiblemente usa una app de autenticación en lugar de SMS. Algunos usuarios avanzados usan diferentes dispositivos para 2FA de cuentas críticas, o llaves de seguridad físicas para máxima protección.`,
    category: 'seguridad',
    relatedTerms: ['seguridad', 'phishing', 'exchange', 'clave-privada'],
    relatedArticle: 'como-comprar-bitcoin-espana',
  },
  {
    term: 'Phishing',
    slug: 'phishing',
    definition: 'Ataque que engaña a víctimas para que revelen información sensible como claves privadas.',
    explanation: `El phishing es uno de los ataques más comunes en crypto. Los atacantes crean sitios web, correos o mensajes falsos que imitan servicios legítimos para robar credenciales, seed phrases o aprobaciones de contratos maliciosos.

Tácticas comunes incluyen: sitios falsos de exchanges o wallets con URLs similares (binance.com vs binancе.com), correos de "soporte" pidiendo verificar tu cuenta, mensajes de Discord/Telegram ofreciendo airdrops, y popups falsos en navegadores pidiendo conectar tu wallet.

Para protegerte: nunca introduzcas tu seed phrase en ningún sitio web (los servicios legítimos NUNCA la piden), verifica URLs cuidadosamente, usa bookmarks en lugar de buscar en Google, desconfía de ofertas demasiado buenas, y nunca firmes transacciones que no entiendas completamente.`,
    category: 'seguridad',
    relatedTerms: ['seed-phrase', 'seguridad', '2fa', 'scam'],
  },
  {
    term: 'Rug Pull',
    slug: 'rug-pull',
    definition: 'Estafa donde los creadores de un proyecto abandonan llevándose los fondos de inversores.',
    explanation: `Un rug pull ("tirar de la alfombra") ocurre cuando los desarrolladores de un proyecto crypto retiran toda la liquidez o venden todos sus tokens repentinamente, dejando a los inversores con tokens sin valor. Es una de las estafas más comunes en DeFi.

Las señales de alerta incluyen: equipos anónimos sin historial verificable, promesas de rendimientos extraordinarios, liquidez que puede ser retirada por los creadores, contratos no verificados o no auditados, y presión para invertir rápidamente antes de que sea "tarde".

Para protegerte: investiga el equipo y su historial, verifica si el contrato está auditado por firmas reconocidas, comprueba si la liquidez está bloqueada, no inviertas más de lo que puedes perder en proyectos nuevos, y desconfía de tokens con marketing agresivo pero sin utilidad real.`,
    category: 'seguridad',
    relatedTerms: ['defi', 'scam', 'liquidity-pool', 'smart-contract'],
    relatedArticle: 'defi-para-principiantes',
  },
  {
    term: 'Ataque 51%',
    slug: 'ataque-51',
    definition: 'Ataque donde una entidad controla la mayoría del poder de minería para manipular la blockchain.',
    explanation: `Un ataque del 51% ocurre cuando un minero o grupo de mineros controla más de la mitad del poder de hash de una red Proof of Work. Esto les permitiría potencialmente reescribir el historial de transacciones recientes, realizar doble gasto, y censurar transacciones.

En la práctica, ejecutar un ataque del 51% contra Bitcoin es económicamente inviable: costaría miles de millones de dólares en hardware y electricidad, y el atacante probablemente destruiría el valor de los bitcoins que obtiene. Sin embargo, blockchains más pequeñas han sufrido estos ataques.

Redes Proof of Stake tienen el equivalente: atacar requeriría controlar más del 50% del stake bloqueado, lo cual es igualmente costoso y autodestructivo. La seguridad de una blockchain depende del costo económico de atacarla.`,
    category: 'seguridad',
    relatedTerms: ['proof-of-work', 'mineria', 'hashrate', 'consenso'],
  },

  // ==================== MINERÍA ====================
  {
    term: 'Minería',
    slug: 'mineria',
    definition: 'Proceso de validar transacciones y añadir nuevos bloques a una blockchain Proof of Work.',
    explanation: `La minería de criptomonedas es el proceso mediante el cual computadoras especializadas compiten para resolver puzzles matemáticos complejos. El primero en encontrar la solución puede añadir el siguiente bloque de transacciones a la blockchain y recibe una recompensa en nuevas monedas.

En Bitcoin, los mineros buscan un hash que cumpla con la dificultad actual de la red (que empiece con cierto número de ceros). Esto requiere trillones de intentos por segundo globalmente. Este proceso, llamado Proof of Work, asegura la red contra ataques.

La minería de Bitcoin ha evolucionado de CPUs caseras a ASICs especializados en granjas industriales. La rentabilidad depende de: costo de electricidad, eficiencia del hardware, precio de Bitcoin, y dificultad de la red. Para la mayoría, es más práctico comprar Bitcoin directamente que minar.`,
    category: 'mineria',
    relatedTerms: ['proof-of-work', 'hashrate', 'asic', 'recompensa-de-bloque'],
  },
  {
    term: 'ASIC',
    slug: 'asic',
    definition: 'Chip diseñado específicamente para minar criptomonedas con máxima eficiencia.',
    explanation: `ASIC (Application-Specific Integrated Circuit) es un chip diseñado específicamente para una tarea, en este caso minar criptomonedas. A diferencia de CPUs o GPUs de propósito general, un ASIC de Bitcoin solo puede calcular hashes SHA-256, pero lo hace millones de veces más eficientemente.

Los fabricantes principales de ASICs para Bitcoin incluyen Bitmain (Antminer), MicroBT (Whatsminer), y Canaan (Avalon). Un ASIC moderno puede producir más de 100 terahashes por segundo (TH/s), consumiendo varios kilovatios de electricidad.

La existencia de ASICs ha centralizado la minería en operaciones industriales con acceso a electricidad barata. Algunas criptomonedas (como Monero) usan algoritmos "ASIC-resistentes" para mantener la minería accesible a usuarios con hardware consumer.`,
    category: 'mineria',
    relatedTerms: ['mineria', 'hashrate', 'proof-of-work', 'bitcoin'],
  },
  {
    term: 'Hashrate',
    slug: 'hashrate',
    definition: 'Poder computacional total dedicado a minar una criptomoneda, medido en hashes por segundo.',
    explanation: `El hashrate es la medida del poder de procesamiento que los mineros dedican a asegurar una red blockchain. Se mide en hashes por segundo: kH/s (miles), MH/s (millones), GH/s (billones), TH/s (trillones), EH/s (cuatrillones).

El hashrate total de Bitcoin ha crecido exponencialmente, superando 500 EH/s en 2024. Un mayor hashrate significa más seguridad: un atacante necesitaría más poder computacional para superar a los mineros honestos. También refleja el valor percibido de la red.

El hashrate individual de un minero determina su probabilidad de encontrar bloques. Si aportas 1% del hashrate total, encontrarás aproximadamente 1% de los bloques (y recibirás 1% de las recompensas). Por eso los mineros pequeños se unen a mining pools.`,
    category: 'mineria',
    relatedTerms: ['mineria', 'asic', 'dificultad', 'mining-pool'],
  },
  {
    term: 'Dificultad',
    slug: 'dificultad',
    definition: 'Parámetro que ajusta qué tan difícil es minar un bloque, manteniendo intervalos constantes.',
    explanation: `La dificultad de minería es un valor que determina qué tan difícil es encontrar un hash válido para un nuevo bloque. En Bitcoin, la dificultad se ajusta cada 2,016 bloques (aproximadamente cada dos semanas) para mantener un tiempo promedio de 10 minutos entre bloques.

Si los bloques se están encontrando más rápido (porque se añadió más hashrate), la dificultad aumenta. Si se están encontrando más lento (mineros abandonando la red), la dificultad disminuye. Este mecanismo garantiza una emisión predecible de nuevos bitcoins.

La dificultad de Bitcoin ha aumentado exponencialmente a lo largo del tiempo, reflejando el crecimiento masivo del hashrate. Lo que podía minarse con una laptop en 2009 ahora requiere hardware industrial especializado por valor de miles de dólares.`,
    category: 'mineria',
    relatedTerms: ['mineria', 'hashrate', 'bloque', 'proof-of-work'],
  },
  {
    term: 'Recompensa de Bloque',
    slug: 'recompensa-de-bloque',
    definition: 'Cantidad de criptomoneda otorgada al minero que encuentra un nuevo bloque válido.',
    explanation: `La recompensa de bloque es el incentivo que reciben los mineros por encontrar un nuevo bloque válido. En Bitcoin, consiste en dos partes: el subsidio (nuevos bitcoins creados) y las comisiones de las transacciones incluidas en el bloque.

El subsidio de Bitcoin comenzó en 50 BTC por bloque en 2009 y se reduce a la mitad cada 210,000 bloques (aproximadamente cada 4 años) en el evento conocido como halving. En 2024, después del cuarto halving, el subsidio es de 3.125 BTC por bloque.

A medida que el subsidio disminuye, las comisiones de transacción se vuelven una parte mayor de la recompensa total. Cuando todos los 21 millones de BTC hayan sido minados (~año 2140), los mineros dependerán exclusivamente de las comisiones para operar.`,
    category: 'mineria',
    relatedTerms: ['mineria', 'halving', 'bloque', 'bitcoin'],
  },
  {
    term: 'Proof of Work',
    slug: 'proof-of-work',
    definition: 'Mecanismo de consenso donde mineros compiten resolviendo puzzles computacionales.',
    explanation: `Proof of Work (PoW) es el mecanismo de consenso original de Bitcoin y muchas otras blockchains. Los mineros compiten para encontrar un hash que cumpla ciertos requisitos, demostrando que han realizado trabajo computacional significativo.

El proceso es intensivo en energía por diseño: la dificultad de falsificar la blockchain es proporcional al trabajo (y costo) invertido en crearla. Esto protege contra ataques, ya que reescribir la historia requeriría rehacer todo ese trabajo.

PoW ha sido criticado por su consumo energético, aunque defensores argumentan que la energía está cada vez más proveniente de fuentes renovables y que el consumo es proporcional a la seguridad provista. Ethereum migró de PoW a Proof of Stake en 2022, pero Bitcoin mantiene PoW como su mecanismo de consenso.`,
    category: 'mineria',
    relatedTerms: ['mineria', 'consenso', 'proof-of-stake', 'hashrate'],
    relatedArticle: 'que-es-bitcoin-guia-completa',
  },
  {
    term: 'Proof of Stake',
    slug: 'proof-of-stake',
    definition: 'Mecanismo de consenso donde validadores bloquean monedas como garantía para validar transacciones.',
    explanation: `Proof of Stake (PoS) es un mecanismo de consenso alternativo a Proof of Work. En lugar de competir con poder computacional, los validadores bloquean (stakean) criptomonedas como garantía. Son seleccionados para proponer bloques proporcionalmente a su stake.

Si un validador actúa maliciosamente (intenta validar transacciones falsas), puede ser "slashed": pierde parte o todo su stake. Este incentivo económico reemplaza la seguridad basada en trabajo computacional de PoW.

PoS consume mucho menos energía que PoW (99.9% menos según estimaciones de Ethereum). Sin embargo, los críticos argumentan que puede ser menos seguro (nada en stake problem), tiende a la centralización (los ricos se hacen más ricos), y no tiene el mismo historial probado que PoW de Bitcoin.`,
    category: 'mineria',
    relatedTerms: ['staking', 'validador', 'consenso', 'proof-of-work'],
  },
]

// ==================== FUNCIONES AUXILIARES ====================

/**
 * Obtiene todos los términos ordenados alfabéticamente
 */
export function getAllTerms(): GlossaryTerm[] {
  return [...glossaryTerms].sort((a, b) => a.term.localeCompare(b.term, 'es'))
}

/**
 * Obtiene un término por su slug
 */
export function getTermBySlug(slug: string): GlossaryTerm | undefined {
  return glossaryTerms.find(term => term.slug === slug)
}

/**
 * Obtiene términos por categoría
 */
export function getTermsByCategory(category: GlossaryCategory): GlossaryTerm[] {
  return glossaryTerms
    .filter(term => term.category === category)
    .sort((a, b) => a.term.localeCompare(b.term, 'es'))
}

/**
 * Obtiene términos agrupados por letra inicial
 */
export function getTermsGroupedByLetter(): Record<string, GlossaryTerm[]> {
  const sorted = getAllTerms()
  const grouped: Record<string, GlossaryTerm[]> = {}

  for (const term of sorted) {
    const letter = term.term[0].toUpperCase()
    if (!grouped[letter]) {
      grouped[letter] = []
    }
    grouped[letter].push(term)
  }

  return grouped
}

/**
 * Obtiene las letras disponibles en el glosario
 */
export function getAvailableLetters(): string[] {
  const letters = new Set(glossaryTerms.map(t => t.term[0].toUpperCase()))
  return Array.from(letters).sort((a, b) => a.localeCompare(b, 'es'))
}

/**
 * Busca términos que coincidan con un query
 */
export function searchTerms(query: string): GlossaryTerm[] {
  const normalizedQuery = query.toLowerCase().trim()
  if (!normalizedQuery) return getAllTerms()

  return glossaryTerms
    .filter(term =>
      term.term.toLowerCase().includes(normalizedQuery) ||
      term.definition.toLowerCase().includes(normalizedQuery)
    )
    .sort((a, b) => a.term.localeCompare(b.term, 'es'))
}

/**
 * Obtiene términos relacionados a partir de sus slugs
 */
export function getRelatedTerms(slugs: string[]): GlossaryTerm[] {
  return slugs
    .map(slug => getTermBySlug(slug))
    .filter((term): term is GlossaryTerm => term !== undefined)
}

/**
 * Obtiene el término anterior y siguiente para navegación
 */
export function getAdjacentTerms(currentSlug: string): { prev: GlossaryTerm | null; next: GlossaryTerm | null } {
  const sorted = getAllTerms()
  const currentIndex = sorted.findIndex(t => t.slug === currentSlug)

  return {
    prev: currentIndex > 0 ? sorted[currentIndex - 1] : null,
    next: currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null,
  }
}
