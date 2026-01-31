/**
 * Blog data - Artículos SEO para Nodo360
 * En el futuro, esto puede migrar a un CMS como Sanity o Contentful
 */

export interface BlogPost {
  slug: string
  title: string
  description: string
  content: string
  category: 'bitcoin' | 'blockchain' | 'defi' | 'web3'
  author: string
  authorRole: string
  publishedAt: string
  updatedAt?: string
  readingTime: number
  image: string
  keywords: string[]
  relatedSlugs?: string[]
}

export const blogCategories = {
  bitcoin: { name: 'Bitcoin', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  blockchain: { name: 'Blockchain', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  defi: { name: 'DeFi', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  web3: { name: 'Web3', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'que-es-bitcoin-guia-completa',
    title: 'Qué es Bitcoin: Guía Completa para Principiantes 2025',
    description: 'Aprende qué es Bitcoin, cómo funciona, por qué es importante y cómo empezar. La guía más completa en español para entender la primera criptomoneda.',
    category: 'bitcoin',
    author: 'Equipo Nodo360',
    authorRole: 'Educadores Bitcoin',
    publishedAt: '2025-01-15',
    readingTime: 12,
    image: '/blog/que-es-bitcoin.webp',
    keywords: ['bitcoin', 'qué es bitcoin', 'bitcoin para principiantes', 'criptomonedas', 'btc'],
    relatedSlugs: ['como-comprar-bitcoin-espana', 'soberania-financiera-bitcoin'],
    content: `
## Introducción a Bitcoin

Bitcoin es la primera criptomoneda descentralizada del mundo, creada en 2009 por una persona o grupo bajo el seudónimo de **Satoshi Nakamoto**. Representa una revolución en la forma en que entendemos y usamos el dinero.

A diferencia del dinero tradicional controlado por bancos centrales, Bitcoin opera en una red descentralizada de computadoras (nodos) que verifican y registran todas las transacciones en un libro público llamado **blockchain**.

## ¿Por qué se creó Bitcoin?

Bitcoin nació como respuesta a la crisis financiera de 2008. Satoshi Nakamoto publicó el whitepaper "Bitcoin: A Peer-to-Peer Electronic Cash System" el 31 de octubre de 2008, proponiendo un sistema de dinero electrónico que no requiriera intermediarios.

Los principales problemas que Bitcoin busca resolver son:

- **Dependencia de terceros**: Los bancos tradicionales pueden censurar transacciones, congelar cuentas o quebrar
- **Inflación**: Los gobiernos pueden imprimir dinero sin límite, devaluando los ahorros de las personas
- **Exclusión financiera**: Miles de millones de personas no tienen acceso a servicios bancarios

## ¿Cómo funciona Bitcoin?

### La Blockchain

La blockchain es un registro público e inmutable de todas las transacciones de Bitcoin. Imagínala como un libro contable gigante que:

1. **Es público**: Cualquiera puede ver todas las transacciones
2. **Es inmutable**: Una vez registrada, una transacción no puede modificarse
3. **Es descentralizado**: No hay un servidor central; miles de computadoras mantienen copias idénticas

### La Minería

Los mineros son computadoras especializadas que:

- Verifican que las transacciones sean válidas
- Agrupan transacciones en bloques
- Resuelven problemas matemáticos complejos (Proof of Work)
- Reciben bitcoins como recompensa por su trabajo

### Oferta Limitada

Una característica fundamental de Bitcoin es su **escasez programada**:

- Solo existirán **21 millones de bitcoins**
- Actualmente hay aproximadamente 19.5 millones en circulación
- El último bitcoin se minará alrededor del año 2140

Esta escasez lo hace similar al oro digital, pero con ventajas adicionales como la divisibilidad (puedes enviar fracciones llamadas satoshis) y la portabilidad.

## Ventajas de Bitcoin

### 1. Descentralización
No hay gobierno, banco o empresa que controle Bitcoin. La red es mantenida por miles de participantes voluntarios en todo el mundo.

### 2. Resistencia a la Censura
Nadie puede impedir que envíes o recibas Bitcoin. Mientras tengas acceso a Internet, puedes transaccionar.

### 3. Transparencia
Todas las transacciones son públicas y verificables. Cualquiera puede auditar el suministro total de Bitcoin.

### 4. Seguridad
La red Bitcoin nunca ha sido hackeada. La criptografía que la protege es extremadamente robusta.

### 5. Portabilidad
Puedes llevar millones de dólares en Bitcoin en tu teléfono móvil o memorizar 12 palabras que representan tu fortuna.

## Cómo empezar con Bitcoin

### Paso 1: Educarte
Antes de invertir un solo euro, dedica tiempo a entender:
- Cómo funciona la tecnología
- Los riesgos involucrados
- Cómo proteger tus bitcoins

### Paso 2: Elegir una wallet
Una wallet (cartera) es donde almacenarás tus bitcoins. Hay varios tipos:
- **Hot wallets**: Conectadas a Internet (móvil, escritorio)
- **Cold wallets**: Desconectadas (hardware wallets como Ledger o Trezor)

### Paso 3: Comprar Bitcoin
Puedes comprar Bitcoin en:
- Exchanges centralizados (Binance, Kraken, Coinbase)
- Exchanges P2P (Bisq, HodlHodl)
- Cajeros Bitcoin

### Paso 4: Autocustodia
La frase "Not your keys, not your coins" resume un principio fundamental: si no controlas las claves privadas, no controlas realmente tus bitcoins.

## Mitos comunes sobre Bitcoin

### "Bitcoin es anónimo"
**Falso**. Bitcoin es pseudónimo. Todas las transacciones son públicas y pueden rastrearse. Existen técnicas de privacidad, pero por defecto Bitcoin no es privado.

### "Bitcoin es solo para criminales"
**Falso**. Estudios muestran que menos del 1% de transacciones Bitcoin se usan para actividades ilícitas. El efectivo sigue siendo el método preferido para el crimen.

### "Bitcoin no tiene valor intrínseco"
**Discutible**. El valor de Bitcoin proviene de su escasez programada, seguridad de la red, descentralización y utilidad como sistema de pago y reserva de valor.

### "Bitcoin consume demasiada energía"
**Contexto necesario**. Sí, Bitcoin consume energía, pero cada vez más proviene de fuentes renovables. Además, el consumo debe compararse con el del sistema financiero tradicional.

## Conclusión

Bitcoin representa un cambio de paradigma en cómo pensamos sobre el dinero. Ya sea que lo veas como una inversión, una tecnología revolucionaria o una herramienta de libertad financiera, entender cómo funciona es esencial en el mundo actual.

En Nodo360, ofrecemos cursos completos para que domines Bitcoin desde cero hasta niveles avanzados. ¿Listo para comenzar tu viaje?
`
  },
  {
    slug: 'como-comprar-bitcoin-espana',
    title: 'Cómo Comprar Bitcoin en España: Guía Paso a Paso 2025',
    description: 'Aprende a comprar Bitcoin en España de forma segura. Exchanges recomendados, métodos de pago, comisiones y consejos de seguridad.',
    category: 'bitcoin',
    author: 'Equipo Nodo360',
    authorRole: 'Educadores Bitcoin',
    publishedAt: '2025-01-20',
    readingTime: 10,
    image: '/blog/como-comprar-bitcoin.webp',
    keywords: ['comprar bitcoin', 'comprar bitcoin españa', 'exchanges bitcoin', 'bitcoin españa', 'donde comprar bitcoin'],
    relatedSlugs: ['que-es-bitcoin-guia-completa', 'soberania-financiera-bitcoin'],
    content: `
## Introducción

Comprar Bitcoin en España es más fácil que nunca, pero es importante hacerlo de forma segura y entender las opciones disponibles. Esta guía te llevará paso a paso por todo el proceso.

## Requisitos previos

Antes de comprar Bitcoin, necesitarás:

1. **Documento de identidad**: DNI, NIE o pasaporte para verificación KYC
2. **Cuenta bancaria española**: Para transferencias SEPA
3. **Correo electrónico**: Para registro en exchanges
4. **Teléfono móvil**: Para autenticación en dos factores (2FA)

## Métodos para comprar Bitcoin en España

### 1. Exchanges Centralizados (CEX)

Los exchanges centralizados son plataformas que actúan como intermediarios entre compradores y vendedores.

#### Exchanges recomendados para España:

**Kraken**
- Ventajas: Regulado, buena reputación, comisiones bajas
- Comisiones: 0.16% - 0.26%
- Métodos de pago: SEPA, tarjeta

**Binance**
- Ventajas: Mayor liquidez, muchas criptomonedas
- Comisiones: 0.1%
- Métodos de pago: SEPA, tarjeta, P2P

**Coinbase**
- Ventajas: Muy fácil de usar, ideal para principiantes
- Comisiones: 1.49% - 3.99%
- Métodos de pago: SEPA, tarjeta, PayPal

**Bit2Me**
- Ventajas: Empresa española, soporte en español
- Comisiones: 1% - 2%
- Métodos de pago: SEPA, Bizum, tarjeta

### 2. Exchanges P2P (Peer-to-Peer)

Compras directamente a otras personas sin intermediario centralizado.

**Bisq**
- Descentralizado, sin KYC
- Mayor privacidad
- Requiere conocimientos técnicos

**HodlHodl**
- Sin custodia de fondos
- Escrow para protección
- Variedad de métodos de pago

### 3. Cajeros Bitcoin (ATMs)

España tiene más de 200 cajeros Bitcoin. Aunque son convenientes, las comisiones suelen ser altas (5-10%).

## Paso a paso: Comprar Bitcoin en Kraken

### Paso 1: Crear cuenta
1. Ve a kraken.com
2. Haz clic en "Crear cuenta"
3. Introduce email y contraseña segura
4. Confirma tu email

### Paso 2: Verificar identidad
1. Ve a Configuración > Verificación
2. Sube foto del DNI/pasaporte
3. Realiza verificación facial
4. Espera aprobación (24-48 horas)

### Paso 3: Depositar euros
1. Ve a Financiación > Depositar
2. Selecciona EUR y método SEPA
3. Copia los datos bancarios de Kraken
4. Realiza la transferencia desde tu banco
5. Espera 1-3 días hábiles

### Paso 4: Comprar Bitcoin
1. Ve a Trading > Nuevo Orden
2. Selecciona par BTC/EUR
3. Elige tipo de orden (mercado o límite)
4. Introduce cantidad
5. Confirma la compra

### Paso 5: Retirar a tu wallet
1. Ve a Financiación > Retirar
2. Selecciona Bitcoin (BTC)
3. Introduce la dirección de tu wallet personal
4. Confirma con 2FA
5. Espera confirmación en la blockchain

## Consejos de seguridad

### Protege tu cuenta
- Usa contraseñas únicas y fuertes
- Activa autenticación en dos factores (2FA)
- Usa una app como Google Authenticator, no SMS
- No compartas tus credenciales con nadie

### Cuidado con estafas
- Nunca envíes Bitcoin a "inversiones garantizadas"
- Desconfía de promesas de rendimientos altos
- Verifica siempre las URLs de los exchanges
- No hagas clic en enlaces de emails sospechosos

### Autocustodia
- No dejes grandes cantidades en exchanges
- Transfiere tus Bitcoin a una wallet personal
- Considera una hardware wallet para cantidades significativas
- Guarda tu seed phrase de forma segura y offline

## Impuestos en España

En España, las ganancias por criptomonedas tributan como ganancias patrimoniales:

- **Hasta 6.000€**: 19%
- **6.000€ - 50.000€**: 21%
- **50.000€ - 200.000€**: 23%
- **Más de 200.000€**: 26%

Debes declarar:
- Ganancias al vender
- Ganancias al intercambiar por otras criptos
- Si tienes más de 50.000€ en el extranjero (Modelo 720)

## Conclusión

Comprar Bitcoin en España es un proceso sencillo si sigues los pasos correctos. Recuerda siempre priorizar la seguridad y educarte antes de invertir cantidades significativas.

¿Quieres aprender más sobre Bitcoin y criptomonedas? Explora nuestros cursos gratuitos en Nodo360.
`
  },
  {
    slug: 'que-es-blockchain-explicado',
    title: 'Qué es Blockchain: Tecnología Explicada de Forma Simple',
    description: 'Entiende qué es blockchain, cómo funciona y por qué está revolucionando industrias más allá de las criptomonedas.',
    category: 'blockchain',
    author: 'Equipo Nodo360',
    authorRole: 'Educadores Blockchain',
    publishedAt: '2025-01-25',
    readingTime: 9,
    image: '/blog/que-es-blockchain.webp',
    keywords: ['blockchain', 'qué es blockchain', 'tecnología blockchain', 'cadena de bloques', 'distributed ledger'],
    relatedSlugs: ['que-es-bitcoin-guia-completa', 'defi-para-principiantes'],
    content: `
## ¿Qué es Blockchain?

Blockchain (cadena de bloques) es una tecnología de registro distribuido que permite almacenar información de forma transparente, segura e inmutable. Piensa en ella como un libro contable digital que:

- Es compartido por miles de computadoras
- Registra información en bloques encadenados
- No puede ser alterado una vez escrito
- No necesita una autoridad central

## Analogía simple: El libro contable del pueblo

Imagina un pueblo donde todos llevan un registro idéntico de quién tiene qué. Cada vez que alguien hace una transacción:

1. Anuncia la transacción a todos
2. Todos verifican que es válida
3. Todos escriben la transacción en su libro
4. Nadie puede cambiar las páginas anteriores

Esto es esencialmente cómo funciona blockchain.

## Componentes principales

### 1. Bloques

Cada bloque contiene:
- **Datos**: Las transacciones o información a registrar
- **Hash**: Una huella digital única del bloque
- **Hash anterior**: Enlace al bloque previo (la "cadena")
- **Timestamp**: Marca de tiempo
- **Nonce**: Número usado en la minería

### 2. La Cadena

Los bloques se conectan mediante sus hashes. Si alguien modifica un bloque antiguo:
- Su hash cambiaría
- Rompería la conexión con el siguiente bloque
- Todos los nodos detectarían la inconsistencia

### 3. Red de Nodos

Miles de computadoras (nodos) mantienen copias idénticas de la blockchain:
- Verifican nuevas transacciones
- Rechazan datos inválidos
- Mantienen la red descentralizada

## Tipos de Blockchain

### Públicas
- Cualquiera puede participar
- Completamente descentralizadas
- Ejemplos: Bitcoin, Ethereum

### Privadas
- Acceso restringido
- Controladas por una organización
- Ejemplos: Hyperledger, R3 Corda

### Consorcio
- Gestionadas por un grupo de organizaciones
- Semi-descentralizadas
- Usadas en banca y supply chain

## Mecanismos de Consenso

### Proof of Work (PoW)
- Usado por Bitcoin
- Los mineros resuelven puzzles matemáticos
- Alto consumo energético, máxima seguridad

### Proof of Stake (PoS)
- Usado por Ethereum 2.0
- Los validadores bloquean monedas como garantía
- Más eficiente energéticamente

### Otros mecanismos
- Delegated Proof of Stake (DPoS)
- Proof of Authority (PoA)
- Proof of History (PoH)

## Aplicaciones más allá de las criptomonedas

### Cadena de suministro
- Seguimiento de productos desde origen hasta consumidor
- Verificación de autenticidad
- Ejemplo: Walmart rastrea alimentos con blockchain

### Salud
- Historiales médicos seguros y portables
- Verificación de medicamentos
- Consentimiento informado inmutable

### Identidad digital
- Control de datos personales
- Credenciales verificables
- Reducción de fraude de identidad

### Votación electrónica
- Votos inmutables y verificables
- Transparencia en resultados
- Reducción de fraude electoral

### Propiedad intelectual
- Registro de derechos de autor
- Regalías automáticas
- Prueba de creación

### Real Estate
- Registro de propiedades
- Contratos inteligentes para compraventa
- Tokenización de inmuebles

## Ventajas de Blockchain

1. **Inmutabilidad**: Los datos no pueden alterarse
2. **Transparencia**: Todos pueden verificar
3. **Descentralización**: Sin punto único de fallo
4. **Seguridad**: Criptografía robusta
5. **Eficiencia**: Elimina intermediarios
6. **Trazabilidad**: Historial completo de transacciones

## Desafíos actuales

### Escalabilidad
- Las blockchains públicas procesan pocas transacciones por segundo
- Soluciones: Layer 2, sharding, sidechains

### Consumo energético
- Proof of Work consume mucha energía
- Migración hacia Proof of Stake

### Regulación
- Marco legal aún en desarrollo
- Incertidumbre para empresas

### Usabilidad
- Interfaces complejas para usuarios no técnicos
- Gestión de claves privadas

## El futuro de Blockchain

La tecnología blockchain está evolucionando rápidamente:

- **Interoperabilidad**: Blockchains que se comunican entre sí
- **Privacidad mejorada**: Zero-knowledge proofs
- **Sostenibilidad**: Consensos más eficientes
- **Adopción empresarial**: Más casos de uso reales

## Conclusión

Blockchain es más que la tecnología detrás de Bitcoin. Es una nueva forma de almacenar y verificar información que está transformando industrias enteras. Entender sus fundamentos es esencial para navegar el futuro digital.

¿Quieres profundizar en blockchain y sus aplicaciones? Explora nuestras rutas de aprendizaje en Nodo360.
`
  },
  {
    slug: 'soberania-financiera-bitcoin',
    title: 'Soberanía Financiera: Por Qué Bitcoin Te Da el Control de Tu Dinero',
    description: 'Descubre qué es la soberanía financiera, por qué importa en el mundo actual y cómo Bitcoin te permite ser tu propio banco.',
    category: 'bitcoin',
    author: 'Equipo Nodo360',
    authorRole: 'Educadores Bitcoin',
    publishedAt: '2025-02-01',
    readingTime: 11,
    image: '/blog/soberania-financiera.webp',
    keywords: ['soberanía financiera', 'bitcoin libertad', 'ser tu propio banco', 'autocustodia', 'libertad financiera bitcoin'],
    relatedSlugs: ['que-es-bitcoin-guia-completa', 'como-comprar-bitcoin-espana'],
    content: `
## ¿Qué es la Soberanía Financiera?

La soberanía financiera es la capacidad de tener control total sobre tu dinero sin depender de terceros como bancos, gobiernos o instituciones financieras. Significa:

- Poder ahorrar sin que nadie devalúe tus ahorros
- Poder transaccionar sin pedir permiso
- Poder acceder a tu dinero en cualquier momento
- Poder proteger tu patrimonio de confiscaciones

## Por qué la soberanía financiera importa

### El problema con el sistema actual

En el sistema financiero tradicional:

**1. No controlas realmente tu dinero**
- El banco puede congelar tu cuenta
- Pueden rechazar transacciones
- En crisis, pueden limitar retiros (corralitos)

**2. Tu dinero pierde valor**
- Los bancos centrales imprimen dinero
- La inflación erosiona tus ahorros
- El poder adquisitivo disminuye cada año

**3. Dependes de intermediarios**
- Bancos pueden quebrar
- Procesadores de pago pueden censurarte
- Gobiernos pueden confiscar activos

### Ejemplos históricos

- **Argentina 2001**: Corralito bancario, la gente no podía sacar su dinero
- **Chipre 2013**: El gobierno confiscó parte de los depósitos bancarios
- **Líbano 2019**: Los bancos limitaron retiros y transferencias
- **Canadá 2022**: Cuentas congeladas a manifestantes
- **Venezuela**: Hiperinflación destruyó los ahorros de millones

## Bitcoin como herramienta de soberanía

### "Be your own bank"

Bitcoin permite que cualquier persona sea su propio banco. Esto significa:

**Control total de tus fondos**
- Tus llaves privadas = tu dinero
- Nadie puede congelar tus bitcoins
- Acceso 24/7, 365 días al año

**Resistencia a la censura**
- Puedes enviar y recibir sin permiso
- No hay intermediarios que puedan bloquearte
- Funciona con solo acceso a Internet

**Protección contra inflación**
- Solo existirán 21 millones de BTC
- Política monetaria predecible
- Imposible "imprimir" más bitcoins

### Autocustodia: El pilar fundamental

La autocustodia significa guardar tus propias llaves privadas. Es la diferencia entre:

- **Custodia en exchange**: "No son tus llaves, no son tus bitcoins"
- **Autocustodia**: Control total, responsabilidad total

## Cómo practicar la soberanía financiera con Bitcoin

### Paso 1: Educarte

Antes de tomar custodia de cantidades significativas:
- Entiende cómo funcionan las transacciones
- Aprende sobre seed phrases y llaves privadas
- Conoce los riesgos y cómo mitigarlos

### Paso 2: Elegir una wallet de autocustodia

**Para empezar (hot wallets)**:
- BlueWallet (móvil)
- Sparrow Wallet (escritorio)
- Green Wallet (móvil/escritorio)

**Para cantidades mayores (cold wallets)**:
- Ledger
- Trezor
- Coldcard
- BitBox

### Paso 3: Proteger tu seed phrase

Tu seed phrase (12-24 palabras) es la llave maestra de tus fondos:

**Qué hacer:**
- Escribirla en papel o metal
- Guardarla en lugar seguro
- Considerar dividirla o usar multisig
- Tener copias en ubicaciones separadas

**Qué NO hacer:**
- Guardarla en el teléfono o computadora
- Tomarle foto
- Enviarla por email o mensaje
- Compartirla con nadie

### Paso 4: Verificar, no confiar

La filosofía de Bitcoin es "Don't trust, verify":
- Ejecuta tu propio nodo si puedes
- Verifica tus propias transacciones
- No dependas de terceros para información

## Estrategias de soberanía progresiva

### Nivel 1: Principiante
- Comprar pequeñas cantidades
- Mantener en exchange regulado
- Aprender los fundamentos

### Nivel 2: Intermedio
- Mover fondos a hot wallet personal
- Hacer backups de seed phrase
- Practicar transacciones

### Nivel 3: Avanzado
- Usar hardware wallet
- Correr nodo propio
- Entender multisig

### Nivel 4: Experto
- Multisig con múltiples dispositivos
- Herencia crypto planificada
- Privacy avanzado (CoinJoin, etc.)

## Riesgos de la autocustodia

Con gran poder viene gran responsabilidad:

**Pérdida de acceso**
- Si pierdes tu seed phrase, pierdes tus fondos
- No hay "recuperar contraseña"
- No hay soporte técnico que te ayude

**Errores de usuario**
- Enviar a dirección equivocada = fondos perdidos
- Caer en estafas de phishing
- Malware que roba llaves

**Mitigación:**
- Educación continua
- Múltiples backups
- Transacciones de prueba pequeñas
- Hardware wallet para cantidades grandes

## Bitcoin vs oro: Soberanía comparada

| Aspecto | Oro | Bitcoin |
|---------|-----|---------|
| Portabilidad | Difícil | Fácil |
| Divisibilidad | Limitada | Alta |
| Verificación | Requiere experto | Cualquiera |
| Confiscación | Posible | Muy difícil |
| Transferencia internacional | Complicada | Trivial |
| Almacenamiento | Costoso | Prácticamente gratis |

## Conclusión

La soberanía financiera no es paranoia, es prudencia. Bitcoin ofrece por primera vez en la historia la posibilidad de que cualquier persona, en cualquier lugar, tenga control total sobre su dinero.

No tienes que ir "all-in" de inmediato. Comienza poco a poco, aprende, y ve incrementando tu soberanía a medida que te sientas cómodo.

¿Quieres aprender a practicar la autocustodia de forma segura? Nuestros cursos en Nodo360 te guían paso a paso.
`
  },
  {
    slug: 'defi-para-principiantes',
    title: 'DeFi para Principiantes: Qué es y Cómo Empezar en 2025',
    description: 'Guía completa de DeFi (Finanzas Descentralizadas). Aprende qué es, cómo funciona, los principales protocolos y cómo empezar de forma segura.',
    category: 'defi',
    author: 'Equipo Nodo360',
    authorRole: 'Educadores DeFi',
    publishedAt: '2025-02-05',
    readingTime: 13,
    image: '/blog/defi-principiantes.webp',
    keywords: ['defi', 'finanzas descentralizadas', 'defi para principiantes', 'yield farming', 'liquidity pools'],
    relatedSlugs: ['que-es-blockchain-explicado', 'que-es-bitcoin-guia-completa'],
    content: `
## ¿Qué es DeFi?

DeFi (Decentralized Finance o Finanzas Descentralizadas) es un ecosistema de aplicaciones financieras construidas sobre blockchain que funcionan sin intermediarios tradicionales como bancos.

En lugar de depender de instituciones centralizadas, DeFi usa:
- **Smart contracts**: Código que ejecuta acuerdos automáticamente
- **Blockchain**: Para transparencia y seguridad
- **Tokens**: Para representar valor y derechos

## DeFi vs Finanzas Tradicionales

| Aspecto | Tradicional | DeFi |
|---------|-------------|------|
| Acceso | Requiere cuenta bancaria | Solo necesitas Internet |
| Horario | Horario bancario | 24/7, 365 días |
| Permisos | Requiere aprobación | Sin permisos (permissionless) |
| Transparencia | Opaca | Código abierto y auditable |
| Custodia | El banco guarda tu dinero | Tú controlas tus fondos |
| Velocidad | Días para transferencias | Minutos o segundos |

## Principales servicios DeFi

### 1. Exchanges Descentralizados (DEXs)

Permiten intercambiar criptomonedas sin intermediarios.

**Cómo funcionan:**
- Usan Automated Market Makers (AMMs)
- Liquidity pools en lugar de libros de órdenes
- Cualquiera puede ser proveedor de liquidez

**Principales DEXs:**
- Uniswap (Ethereum)
- PancakeSwap (BNB Chain)
- Curve (stablecoins)
- Jupiter (Solana)

### 2. Lending y Borrowing

Préstamos y empréstitos sin bancos.

**Cómo funciona:**
- Depositas cripto como colateral
- Pides prestado otros activos
- Pagas interés (o lo ganas al prestar)

**Principales protocolos:**
- Aave
- Compound
- MakerDAO

### 3. Stablecoins

Criptomonedas con valor estable (generalmente 1 USD).

**Tipos:**
- **Fiat-backed**: USDC, USDT (respaldadas por dólares)
- **Crypto-backed**: DAI (respaldada por otras criptos)
- **Algorítmicas**: Mantienen paridad mediante algoritmos

### 4. Yield Farming

Estrategia para maximizar rendimientos moviendo fondos entre protocolos.

**Cómo funciona:**
- Provees liquidez a protocolos
- Recibes tokens como recompensa
- Reinviertes para componer ganancias

**Advertencia:** Mayor rendimiento = mayor riesgo.

### 5. Staking

Bloquear tokens para asegurar la red y ganar recompensas.

**Liquid Staking:**
- Stakeas pero recibes un token líquido
- Ejemplo: Lido (stETH por ETH)
- Puedes usar el token en otros protocolos

## Cómo empezar en DeFi

### Requisitos previos

1. **Wallet de autocustodia**
   - MetaMask (más popular)
   - Rabby Wallet
   - Rainbow

2. **Criptomonedas**
   - ETH para fees en Ethereum
   - O tokens nativos de otras redes

3. **Conocimientos básicos**
   - Cómo funcionan las transacciones
   - Qué son los smart contracts
   - Riesgos involucrados

### Tu primera interacción DeFi

**Ejemplo: Swap en Uniswap**

1. Conecta tu wallet a app.uniswap.org
2. Selecciona los tokens a intercambiar
3. Revisa el precio y slippage
4. Aprueba el gasto del token (primera vez)
5. Confirma el swap
6. Espera confirmación en blockchain

### Primeros pasos seguros

1. **Empieza con poco dinero**
   - Aprende con cantidades que puedas perder
   - Entiende los costos de gas

2. **Usa redes de prueba primero**
   - Testnets permiten practicar gratis
   - Goerli, Sepolia para Ethereum

3. **Investiga antes de usar un protocolo**
   - ¿Está auditado?
   - ¿Cuánto tiempo lleva operando?
   - ¿Cuánto TVL tiene?

## Riesgos en DeFi

### 1. Smart Contract Risk
- El código puede tener bugs
- Los hacks son comunes
- Millones se han perdido por exploits

### 2. Impermanent Loss
- Al proveer liquidez, puedes perder vs simplemente holdear
- Ocurre cuando los precios de los tokens divergen

### 3. Rug Pulls
- Proyectos fraudulentos que roban fondos
- Más comunes en proyectos nuevos sin auditar

### 4. Riesgo de Oracle
- Los protocolos dependen de oráculos para precios
- Manipulación de oráculos ha causado grandes pérdidas

### 5. Riesgo regulatorio
- DeFi opera en un área gris legal
- Regulaciones futuras podrían afectar protocolos

## Métricas importantes

### TVL (Total Value Locked)
- Valor total depositado en un protocolo
- Indica confianza y tamaño
- No garantiza seguridad

### APY (Annual Percentage Yield)
- Rendimiento anualizado incluyendo compounding
- APY muy altos suelen ser insostenibles
- Compara con el riesgo

### Market Cap / TVL
- Ratio para evaluar si un token está sobrevalorado
- Menor ratio = potencialmente más valor

## Herramientas útiles

### Agregadores
- **DefiLlama**: Datos de TVL y protocolos
- **Zapper**: Portfolio y gestión DeFi
- **DeBank**: Seguimiento de posiciones

### Seguridad
- **Revoke.cash**: Revocar aprobaciones de tokens
- **DeFiSafety**: Scores de seguridad
- **Etherscan**: Verificar contratos

## Consejos para mantenerte seguro

1. **Nunca inviertas más de lo que puedes perder**
2. **Diversifica entre protocolos**
3. **Revoca aprobaciones que no uses**
4. **Usa hardware wallet para cantidades grandes**
5. **Verifica URLs antes de conectar wallet**
6. **No confíes en rendimientos "demasiado buenos"**
7. **Mantente informado sobre hacks y exploits**

## El futuro de DeFi

DeFi sigue evolucionando:

- **Abstracción de cuenta**: UX más simple
- **Intents**: Transacciones más inteligentes
- **Real World Assets (RWA)**: Tokenización de activos reales
- **Institucionalización**: Mayor adopción institucional
- **Regulación**: Marco legal más claro

## Conclusión

DeFi representa una revolución en las finanzas, ofreciendo acceso abierto a servicios financieros sin intermediarios. Sin embargo, con grandes oportunidades vienen grandes riesgos.

La clave es educarte antes de actuar, empezar con poco, y nunca dejar de aprender.

¿Listo para explorar DeFi de forma segura? Nuestras rutas de aprendizaje en Nodo360 te preparan paso a paso para navegar este nuevo mundo financiero.
`
  },
]

/**
 * Obtiene todos los posts del blog
 */
export function getAllPosts(): BlogPost[] {
  return blogPosts.sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
}

/**
 * Obtiene un post por su slug
 */
export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find(post => post.slug === slug)
}

/**
 * Obtiene posts por categoría
 */
export function getPostsByCategory(category: BlogPost['category']): BlogPost[] {
  return blogPosts
    .filter(post => post.category === category)
    .sort((a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
}

/**
 * Obtiene posts relacionados
 */
export function getRelatedPosts(currentSlug: string, limit = 3): BlogPost[] {
  const currentPost = getPostBySlug(currentSlug)
  if (!currentPost) return []

  // Primero intenta con los relacionados explícitos
  const relatedSlugs = currentPost.relatedSlugs || []
  const explicitRelated = relatedSlugs
    .map(slug => getPostBySlug(slug))
    .filter((post): post is BlogPost => post !== undefined)

  // Si no hay suficientes, añade de la misma categoría
  if (explicitRelated.length >= limit) {
    return explicitRelated.slice(0, limit)
  }

  const sameCategory = getPostsByCategory(currentPost.category)
    .filter(post => post.slug !== currentSlug && !relatedSlugs.includes(post.slug))

  return [...explicitRelated, ...sameCategory].slice(0, limit)
}
