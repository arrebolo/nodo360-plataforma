const fs = require('fs')
const path = require('path')

// Categories and their colors
const categoryColors = {
  bitcoin: { primary: '#F7931A', secondary: '#FF9F43', gradient: 'from-orange-500 to-amber-400' },
  blockchain: { primary: '#2563EB', secondary: '#3B82F6', gradient: 'from-blue-600 to-blue-400' },
  defi: { primary: '#7C3AED', secondary: '#8B5CF6', gradient: 'from-purple-600 to-violet-400' },
  web3: { primary: '#EC4899', secondary: '#F472B6', gradient: 'from-pink-500 to-rose-400' },
}

// All inline images to generate with their metadata
const inlineImages = [
  // Bitcoin article 1: que-es-bitcoin-guia-completa
  {
    filename: 'bitcoin-como-funciona.svg',
    category: 'bitcoin',
    type: 'flow',
    title: 'Cómo Funciona una Transacción Bitcoin',
    elements: [
      { label: '1. Envío', desc: 'Usuario crea transacción' },
      { label: '2. Broadcast', desc: 'Se envía a la red' },
      { label: '3. Validación', desc: 'Nodos verifican' },
      { label: '4. Minería', desc: 'Se añade al bloque' },
      { label: '5. Confirmación', desc: 'Transacción confirmada' },
    ]
  },
  {
    filename: 'bitcoin-vs-sistema-tradicional.svg',
    category: 'bitcoin',
    type: 'comparison',
    title: 'Bitcoin vs Sistema Tradicional',
    left: { title: 'Bitcoin', items: ['Descentralizado', 'Sin intermediarios', '24/7 disponible', 'Escasez programada', 'Pseudoanónimo'] },
    right: { title: 'Bancos', items: ['Centralizado', 'Múltiples intermediarios', 'Horarios limitados', 'Emisión ilimitada', 'KYC obligatorio'] }
  },
  {
    filename: 'bitcoin-supply-21m.svg',
    category: 'bitcoin',
    type: 'chart',
    title: 'Emisión de Bitcoin: Camino a 21 Millones',
    data: [
      { year: '2009', btc: '0', pct: 0 },
      { year: '2012', btc: '10.5M', pct: 50 },
      { year: '2016', btc: '15.75M', pct: 75 },
      { year: '2020', btc: '18.4M', pct: 87.6 },
      { year: '2024', btc: '19.6M', pct: 93.3 },
      { year: '2140', btc: '21M', pct: 100 },
    ]
  },

  // Bitcoin article 2: como-comprar-bitcoin-espana
  {
    filename: 'pasos-comprar-bitcoin.svg',
    category: 'bitcoin',
    type: 'steps',
    title: '5 Pasos para Comprar Bitcoin',
    steps: [
      { num: '1', title: 'Elige Exchange', desc: 'Binance, Kraken, Bit2Me' },
      { num: '2', title: 'Verifica KYC', desc: 'DNI/NIE + selfie' },
      { num: '3', title: 'Deposita EUR', desc: 'Transferencia o tarjeta' },
      { num: '4', title: 'Compra BTC', desc: 'Orden de mercado o límite' },
      { num: '5', title: 'Retira a Wallet', desc: 'Tu wallet, tus llaves' },
    ]
  },
  {
    filename: 'exchanges-comparativa.svg',
    category: 'bitcoin',
    type: 'table',
    title: 'Comparativa de Exchanges en España',
    headers: ['Exchange', 'Comisión', 'Métodos pago', 'Nivel'],
    rows: [
      ['Binance', '0.1%', 'SEPA, Tarjeta', 'Intermedio'],
      ['Kraken', '0.16%', 'SEPA', 'Avanzado'],
      ['Bit2Me', '0.5%', 'Bizum, SEPA', 'Principiante'],
      ['Coinbase', '1.49%', 'SEPA, Tarjeta', 'Principiante'],
    ]
  },
  {
    filename: 'bitcoin-custodia-opciones.svg',
    category: 'bitcoin',
    type: 'comparison',
    title: 'Opciones de Custodia de Bitcoin',
    left: { title: 'Exchange', items: ['Fácil acceso', 'Sin seed phrase', 'Riesgo hackeo', 'Pueden congelar', 'Para trading'] },
    right: { title: 'Wallet Propia', items: ['Control total', 'Tu seed phrase', 'Mayor seguridad', 'Nadie bloquea', 'Para HODL'] }
  },

  // Blockchain article: que-es-blockchain-explicado
  {
    filename: 'blockchain-cadena-bloques.svg',
    category: 'blockchain',
    type: 'chain',
    title: 'Estructura de una Cadena de Bloques',
    blocks: [
      { num: '#1', hash: 'a1b2...', prev: '0000...' },
      { num: '#2', hash: 'c3d4...', prev: 'a1b2...' },
      { num: '#3', hash: 'e5f6...', prev: 'c3d4...' },
    ]
  },
  {
    filename: 'blockchain-tipos-redes.svg',
    category: 'blockchain',
    type: 'icons',
    title: 'Tipos de Blockchain',
    items: [
      { icon: '🌐', title: 'Pública', desc: 'Bitcoin, Ethereum - Abierta a todos' },
      { icon: '🔒', title: 'Privada', desc: 'Empresarial - Acceso restringido' },
      { icon: '🤝', title: 'Consorcio', desc: 'Híbrida - Grupo de organizaciones' },
    ]
  },
  {
    filename: 'blockchain-casos-uso.svg',
    category: 'blockchain',
    type: 'icons',
    title: 'Casos de Uso de Blockchain',
    items: [
      { icon: '💰', title: 'Finanzas', desc: 'Pagos, DeFi, Remesas' },
      { icon: '📦', title: 'Supply Chain', desc: 'Trazabilidad, Logística' },
      { icon: '🏥', title: 'Salud', desc: 'Historial médico seguro' },
      { icon: '🗳️', title: 'Votación', desc: 'Elecciones transparentes' },
    ]
  },

  // Soberanía financiera article
  {
    filename: 'bitcoin-soberania-concepto.svg',
    category: 'bitcoin',
    type: 'pyramid',
    title: 'Niveles de Soberanía Financiera',
    levels: [
      { label: 'Nodo Propio', desc: 'Verificas tus transacciones' },
      { label: 'Hardware Wallet', desc: 'Custodia total' },
      { label: 'Software Wallet', desc: 'Tus llaves' },
      { label: 'Exchange', desc: 'Custodia de terceros' },
    ]
  },
  {
    filename: 'bitcoin-vs-bancos-control.svg',
    category: 'bitcoin',
    type: 'comparison',
    title: '¿Quién Controla Tu Dinero?',
    left: { title: 'Con Bitcoin', items: ['Tú controlas', 'Sin congelación', 'Sin límites', 'Privacidad', 'Acceso 24/7'] },
    right: { title: 'Con Bancos', items: ['Banco controla', 'Pueden bloquear', 'Límites de retiro', 'KYC/AML', 'Horarios limitados'] }
  },
  {
    filename: 'bitcoin-autocustodia-pasos.svg',
    category: 'bitcoin',
    type: 'steps',
    title: 'Pasos hacia la Autocustodia',
    steps: [
      { num: '1', title: 'Aprende', desc: 'Entiende seed phrases' },
      { num: '2', title: 'Elige wallet', desc: 'Hardware recomendado' },
      { num: '3', title: 'Genera seed', desc: 'Sin conexión a internet' },
      { num: '4', title: 'Guarda backup', desc: 'Metal, múltiples lugares' },
      { num: '5', title: 'Transfiere', desc: 'Poco a poco, verifica' },
    ]
  },

  // DeFi article
  {
    filename: 'defi-ecosistema-mapa.svg',
    category: 'defi',
    type: 'icons',
    title: 'Ecosistema DeFi',
    items: [
      { icon: '🔄', title: 'DEXs', desc: 'Uniswap, Curve, SushiSwap' },
      { icon: '💵', title: 'Lending', desc: 'Aave, Compound, MakerDAO' },
      { icon: '🌾', title: 'Yield', desc: 'Yearn, Convex, Beefy' },
      { icon: '🪙', title: 'Stables', desc: 'DAI, USDC, FRAX' },
    ]
  },
  {
    filename: 'defi-vs-cefi-comparativa.svg',
    category: 'defi',
    type: 'comparison',
    title: 'DeFi vs Finanzas Tradicionales',
    left: { title: 'DeFi', items: ['Sin permisos', 'Código abierto', '24/7', 'Tú custodias', 'Global'] },
    right: { title: 'CeFi', items: ['Requiere aprobación', 'Opaco', 'Horario banco', 'Ellos custodian', 'Local'] }
  },
  {
    filename: 'defi-riesgos-seguridad.svg',
    category: 'defi',
    type: 'icons',
    title: 'Riesgos en DeFi',
    items: [
      { icon: '🐛', title: 'Smart Contract', desc: 'Bugs en el código' },
      { icon: '💧', title: 'Impermanent Loss', desc: 'Pérdida por volatilidad' },
      { icon: '🎣', title: 'Phishing', desc: 'Sitios falsos' },
      { icon: '🏃', title: 'Rug Pull', desc: 'Proyectos fraudulentos' },
    ]
  },

  // Ethereum article
  {
    filename: 'ethereum-vs-bitcoin-comparativa.svg',
    category: 'blockchain',
    type: 'comparison',
    title: 'Ethereum vs Bitcoin',
    left: { title: 'Bitcoin', items: ['Dinero digital', 'PoW/Simple', '7 TPS', 'Scripting limitado', 'Reserva de valor'] },
    right: { title: 'Ethereum', items: ['Plataforma dApps', 'PoS/Complejo', '15-30 TPS', 'Turing completo', 'Gas para todo'] }
  },
  {
    filename: 'ethereum-smart-contracts-flow.svg',
    category: 'blockchain',
    type: 'flow',
    title: 'Cómo Funciona un Smart Contract',
    elements: [
      { label: '1. Deploy', desc: 'Subir código a ETH' },
      { label: '2. Condiciones', desc: 'Si X entonces Y' },
      { label: '3. Trigger', desc: 'Usuario interactúa' },
      { label: '4. Ejecución', desc: 'Código se ejecuta' },
      { label: '5. Estado', desc: 'Cambio en blockchain' },
    ]
  },
  {
    filename: 'ethereum-ecosistema-dapps.svg',
    category: 'blockchain',
    type: 'icons',
    title: 'Ecosistema Ethereum',
    items: [
      { icon: '🏦', title: 'DeFi', desc: 'Uniswap, Aave, MakerDAO' },
      { icon: '🎨', title: 'NFTs', desc: 'OpenSea, Blur, Foundation' },
      { icon: '🗳️', title: 'DAOs', desc: 'ENS, Gitcoin, Compound' },
      { icon: '🎮', title: 'Gaming', desc: 'Axie, Gods Unchained' },
    ]
  },

  // Wallets article
  {
    filename: 'wallets-hot-vs-cold.svg',
    category: 'bitcoin',
    type: 'comparison',
    title: 'Hot Wallet vs Cold Wallet',
    left: { title: 'Hot Wallet', items: ['Conectada a internet', 'Fácil acceso', 'Para uso diario', 'Menor seguridad', 'Gratis'] },
    right: { title: 'Cold Wallet', items: ['Sin internet', 'Mayor fricción', 'Para HODL', 'Máxima seguridad', '~80-150€'] }
  },
  {
    filename: 'wallets-custodial-vs-non-custodial.svg',
    category: 'bitcoin',
    type: 'comparison',
    title: 'Custodial vs Non-Custodial',
    left: { title: 'Custodial', items: ['Exchange guarda', 'Sin seed phrase', 'Pueden bloquear', 'Recuperación fácil', 'Menor control'] },
    right: { title: 'Non-Custodial', items: ['Tú guardas', 'Tu seed phrase', 'Nadie bloquea', 'Perder = perder todo', 'Control total'] }
  },
  {
    filename: 'wallet-seed-phrase-seguridad.svg',
    category: 'bitcoin',
    type: 'icons',
    title: 'Protege tu Seed Phrase',
    items: [
      { icon: '✅', title: 'HACER', desc: 'Escribir en papel/metal' },
      { icon: '✅', title: 'HACER', desc: 'Múltiples copias seguras' },
      { icon: '❌', title: 'NUNCA', desc: 'Foto o screenshot' },
      { icon: '❌', title: 'NUNCA', desc: 'Guardar en la nube' },
    ]
  },

  // Mining article
  {
    filename: 'mineria-bitcoin-proceso.svg',
    category: 'bitcoin',
    type: 'flow',
    title: 'Proceso de Minería Bitcoin',
    elements: [
      { label: '1. Mempool', desc: 'Tx esperando' },
      { label: '2. Selección', desc: 'Minero elige txs' },
      { label: '3. Hash', desc: 'Buscar nonce válido' },
      { label: '4. Bloque', desc: 'Bloque minado' },
      { label: '5. Reward', desc: '3.125 BTC + fees' },
    ]
  },
  {
    filename: 'mineria-evolucion-hardware.svg',
    category: 'bitcoin',
    type: 'timeline',
    title: 'Evolución del Hardware de Minería',
    events: [
      { year: '2009', label: 'CPU', desc: 'Cualquier PC' },
      { year: '2010', label: 'GPU', desc: 'Tarjetas gráficas' },
      { year: '2013', label: 'ASIC', desc: 'Hardware especializado' },
      { year: '2024', label: 'Industrial', desc: 'Centros de datos' },
    ]
  },
  {
    filename: 'mineria-rentabilidad-factores.svg',
    category: 'bitcoin',
    type: 'icons',
    title: 'Factores de Rentabilidad',
    items: [
      { icon: '💡', title: 'Electricidad', desc: 'Coste por kWh' },
      { icon: '📊', title: 'Dificultad', desc: 'Competencia red' },
      { icon: '💰', title: 'Precio BTC', desc: 'Valor de mercado' },
      { icon: '⚡', title: 'Hashrate', desc: 'Potencia equipo' },
    ]
  },

  // NFTs article
  {
    filename: 'nfts-fungible-vs-no-fungible.svg',
    category: 'web3',
    type: 'comparison',
    title: 'Fungible vs No Fungible',
    left: { title: 'Fungible', items: ['Intercambiable', '1 BTC = 1 BTC', '1€ = 1€', 'Idénticos', 'Divisibles'] },
    right: { title: 'No Fungible', items: ['Único', 'NFT ≠ NFT', 'Arte original', 'Identificable', 'Indivisible'] }
  },
  {
    filename: 'nfts-casos-uso-reales.svg',
    category: 'web3',
    type: 'icons',
    title: 'Casos de Uso de NFTs',
    items: [
      { icon: '🎨', title: 'Arte Digital', desc: 'Propiedad verificable' },
      { icon: '🎵', title: 'Música', desc: 'Regalías automáticas' },
      { icon: '🎮', title: 'Gaming', desc: 'Items transferibles' },
      { icon: '🎫', title: 'Tickets', desc: 'Anti-falsificación' },
    ]
  },
  {
    filename: 'nfts-como-comprar-crear.svg',
    category: 'web3',
    type: 'steps',
    title: 'Cómo Comprar o Crear NFTs',
    steps: [
      { num: '1', title: 'Wallet', desc: 'Instala MetaMask' },
      { num: '2', title: 'ETH', desc: 'Compra y envía ETH' },
      { num: '3', title: 'Marketplace', desc: 'OpenSea, Blur, etc.' },
      { num: '4', title: 'Conecta', desc: 'Wallet al marketplace' },
      { num: '5', title: 'Compra/Mint', desc: 'Adquiere tu NFT' },
    ]
  },

  // Staking article
  {
    filename: 'staking-como-funciona.svg',
    category: 'defi',
    type: 'flow',
    title: 'Cómo Funciona el Staking',
    elements: [
      { label: '1. Bloqueo', desc: 'Depositas tokens' },
      { label: '2. Validación', desc: 'Aseguras la red' },
      { label: '3. Rewards', desc: 'Recibes recompensas' },
      { label: '4. Compound', desc: 'Reinviertes' },
    ]
  },
  {
    filename: 'staking-pow-vs-pos.svg',
    category: 'defi',
    type: 'comparison',
    title: 'Proof of Work vs Proof of Stake',
    left: { title: 'PoW', items: ['Minería con hardware', 'Alto consumo energía', 'Bitcoin, Litecoin', 'Más descentralizado', 'Costoso atacar'] },
    right: { title: 'PoS', items: ['Staking con tokens', 'Bajo consumo', 'ETH, Cardano, Solana', 'Más eficiente', 'Slashing penalty'] }
  },
  {
    filename: 'staking-rendimientos-riesgos.svg',
    category: 'defi',
    type: 'table',
    title: 'Rendimientos de Staking',
    headers: ['Crypto', 'APY', 'Lock-up', 'Riesgo'],
    rows: [
      ['ETH', '3-5%', 'Variable', 'Bajo'],
      ['SOL', '6-8%', '2-3 días', 'Medio'],
      ['ADA', '4-5%', 'Sin lock', 'Bajo'],
      ['ATOM', '15-20%', '21 días', 'Medio'],
    ]
  },

  // Security article
  {
    filename: 'seguridad-amenazas-comunes.svg',
    category: 'bitcoin',
    type: 'icons',
    title: 'Amenazas Comunes en Crypto',
    items: [
      { icon: '🎣', title: 'Phishing', desc: 'Links y sitios falsos' },
      { icon: '🦠', title: 'Malware', desc: 'Clipboard hijacking' },
      { icon: '📱', title: 'SIM Swap', desc: 'Robo de número' },
      { icon: '🏃', title: 'Rug Pull', desc: 'Estafa de proyecto' },
    ]
  },
  {
    filename: 'seguridad-autenticacion-2fa.svg',
    category: 'bitcoin',
    type: 'pyramid',
    title: 'Niveles de Autenticación',
    levels: [
      { label: 'Hardware Key', desc: 'YubiKey - Máximo' },
      { label: 'App 2FA', desc: 'Google Auth - Alto' },
      { label: 'SMS 2FA', desc: 'Vulnerable SIM swap' },
      { label: 'Solo Password', desc: 'Inseguro' },
    ]
  },
  {
    filename: 'seguridad-checklist-proteccion.svg',
    category: 'bitcoin',
    type: 'checklist',
    title: 'Checklist de Seguridad',
    items: [
      '✓ Seed phrase offline en metal',
      '✓ 2FA con app (no SMS)',
      '✓ Hardware wallet para >$1000',
      '✓ Verificar URLs siempre',
      '✓ Revocar aprobaciones DeFi',
      '✓ Nunca compartir seed',
    ]
  },

  // Bitcoin vs Gold article
  {
    filename: 'bitcoin-oro-propiedades.svg',
    category: 'bitcoin',
    type: 'table',
    title: 'Propiedades: Bitcoin vs Oro',
    headers: ['Propiedad', 'Bitcoin', 'Oro'],
    rows: [
      ['Escasez', '21M fijos ✓', 'Crece 1.5%/año'],
      ['Portabilidad', 'Infinita ✓', 'Difícil'],
      ['Divisibilidad', '8 decimales ✓', 'Limitada'],
      ['Verificación', 'Cualquiera ✓', 'Experto'],
      ['Historia', '15 años', '5000 años ✓'],
    ]
  },
  {
    filename: 'bitcoin-oro-rendimiento.svg',
    category: 'bitcoin',
    type: 'chart',
    title: 'Rendimiento Histórico',
    data: [
      { label: 'BTC 10 años', value: '+15,000%', color: 'orange' },
      { label: 'Oro 10 años', value: '+50%', color: 'gold' },
      { label: 'BTC volatilidad', value: 'Alta', color: 'orange' },
      { label: 'Oro volatilidad', value: 'Baja', color: 'gold' },
    ]
  },
  {
    filename: 'bitcoin-oro-portfolio.svg',
    category: 'bitcoin',
    type: 'icons',
    title: 'Diversificación del Portfolio',
    items: [
      { icon: '🛡️', title: 'Conservador', desc: '5% oro, 2% BTC' },
      { icon: '⚖️', title: 'Moderado', desc: '5% oro, 5% BTC' },
      { icon: '🚀', title: 'Agresivo', desc: '2% oro, 15% BTC' },
    ]
  },

  // Layer 2 article
  {
    filename: 'layer2-problema-escalabilidad.svg',
    category: 'blockchain',
    type: 'chart',
    title: 'El Problema de Escalabilidad',
    data: [
      { label: 'Visa', value: '24,000 TPS', pct: 100 },
      { label: 'Solana', value: '65,000 TPS*', pct: 100 },
      { label: 'Ethereum L2', value: '2,000+ TPS', pct: 8 },
      { label: 'Ethereum L1', value: '15 TPS', pct: 0.06 },
      { label: 'Bitcoin', value: '7 TPS', pct: 0.03 },
    ]
  },
  {
    filename: 'layer2-tipos-soluciones.svg',
    category: 'blockchain',
    type: 'icons',
    title: 'Tipos de Soluciones L2',
    items: [
      { icon: '⚡', title: 'State Channels', desc: 'Lightning Network' },
      { icon: '📦', title: 'Optimistic Rollups', desc: 'Arbitrum, Optimism' },
      { icon: '🔐', title: 'ZK Rollups', desc: 'zkSync, StarkNet' },
      { icon: '🔗', title: 'Sidechains', desc: 'Polygon PoS' },
    ]
  },
  {
    filename: 'layer2-lightning-rollups.svg',
    category: 'blockchain',
    type: 'comparison',
    title: 'Lightning vs Rollups',
    left: { title: 'Lightning', items: ['Para Bitcoin', 'Canales de pago', 'Pagos instantáneos', 'Muy bajo coste', 'Requiere liquidez'] },
    right: { title: 'Rollups', items: ['Para Ethereum', 'Batch transactions', 'Smart contracts', 'Bajo coste', 'Hereda seguridad L1'] }
  },

  // DAO article
  {
    filename: 'dao-estructura-funcionamiento.svg',
    category: 'web3',
    type: 'flow',
    title: 'Cómo Funciona una DAO',
    elements: [
      { label: '1. Propuesta', desc: 'Miembro sugiere' },
      { label: '2. Discusión', desc: 'Debate comunidad' },
      { label: '3. Votación', desc: 'Token holders votan' },
      { label: '4. Quórum', desc: 'Mínimo participación' },
      { label: '5. Ejecución', desc: 'Smart contract actúa' },
    ]
  },
  {
    filename: 'dao-ejemplos-gobernanza.svg',
    category: 'web3',
    type: 'icons',
    title: 'DAOs Destacadas',
    items: [
      { icon: '🏛️', title: 'MakerDAO', desc: 'Gobierna DAI stablecoin' },
      { icon: '🦄', title: 'Uniswap', desc: 'DEX más grande' },
      { icon: '🌐', title: 'ENS', desc: 'Dominios .eth' },
      { icon: '💚', title: 'Gitcoin', desc: 'Fondos públicos Web3' },
    ]
  },
  {
    filename: 'dao-como-participar.svg',
    category: 'web3',
    type: 'steps',
    title: 'Cómo Participar en una DAO',
    steps: [
      { num: '1', title: 'Investiga', desc: 'Elige DAO alineada' },
      { num: '2', title: 'Token', desc: 'Compra token gobernanza' },
      { num: '3', title: 'Únete', desc: 'Discord, foros' },
      { num: '4', title: 'Vota', desc: 'Participa en propuestas' },
      { num: '5', title: 'Contribuye', desc: 'Bounties, trabajo' },
    ]
  },

  // Halving article
  {
    filename: 'halving-que-es-como-funciona.svg',
    category: 'bitcoin',
    type: 'flow',
    title: '¿Qué es el Halving?',
    elements: [
      { label: 'Cada 210K bloques', desc: '~4 años' },
      { label: 'Recompensa ÷ 2', desc: 'Se reduce a la mitad' },
      { label: 'Menos emisión', desc: 'BTC más escaso' },
      { label: 'Oferta fija', desc: '21M máximo' },
    ]
  },
  {
    filename: 'halving-historia-precios.svg',
    category: 'bitcoin',
    type: 'timeline',
    title: 'Historia de Halvings y Precio',
    events: [
      { year: '2012', label: '50→25 BTC', desc: '$12 → $1,100' },
      { year: '2016', label: '25→12.5 BTC', desc: '$650 → $20,000' },
      { year: '2020', label: '12.5→6.25 BTC', desc: '$9,000 → $69,000' },
      { year: '2024', label: '6.25→3.125 BTC', desc: '$65,000 → ?' },
    ]
  },
  {
    filename: 'halving-ciclos-mercado.svg',
    category: 'bitcoin',
    type: 'chart',
    title: 'Ciclos de Mercado de Bitcoin',
    data: [
      { phase: 'Acumulación', desc: '6-12 meses pre-halving' },
      { phase: 'Bull Run', desc: '12-18 meses post-halving' },
      { phase: 'Distribución', desc: 'Nuevo ATH, euforia' },
      { phase: 'Bear Market', desc: 'Corrección 70-80%' },
    ]
  },
]

// SVG generation functions
function createSvgHeader(width = 1200, height = 675) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`
}

function createGradientDefs(category) {
  const colors = categoryColors[category]
  return `
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.primary}" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="${colors.secondary}" stop-opacity="0.05"/>
    </linearGradient>
    <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${colors.primary}"/>
      <stop offset="100%" stop-color="${colors.secondary}"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>`
}

function createBackground() {
  return `
  <rect width="1200" height="675" fill="#0a0a0a"/>
  <rect width="1200" height="675" fill="url(#bgGradient)"/>
  <rect x="0" y="0" width="1200" height="4" fill="url(#accentGradient)"/>`
}

function createTitle(title, category) {
  const colors = categoryColors[category]
  return `
  <text x="600" y="55" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="700" fill="${colors.primary}">${title}</text>`
}

function createBranding() {
  return `
  <text x="1170" y="655" text-anchor="end" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="rgba(255,255,255,0.3)">Nodo360</text>`
}

// Generate comparison SVG
function generateComparison(data) {
  const { category, title, left, right } = data
  const colors = categoryColors[category]

  let svg = createSvgHeader()
  svg += createGradientDefs(category)
  svg += createBackground()
  svg += createTitle(title, category)

  // Left box
  svg += `
  <rect x="50" y="90" width="530" height="520" rx="16" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
  <rect x="50" y="90" width="530" height="60" rx="16" fill="${colors.primary}" fill-opacity="0.2"/>
  <text x="315" y="130" text-anchor="middle" font-family="system-ui, sans-serif" font-size="22" font-weight="600" fill="${colors.primary}">${left.title}</text>`

  left.items.forEach((item, i) => {
    svg += `
    <circle cx="90" cy="${185 + i * 75}" r="8" fill="${colors.primary}"/>
    <text x="115" y="${192 + i * 75}" font-family="system-ui, sans-serif" font-size="18" fill="rgba(255,255,255,0.85)">${item}</text>`
  })

  // Right box
  svg += `
  <rect x="620" y="90" width="530" height="520" rx="16" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
  <rect x="620" y="90" width="530" height="60" rx="16" fill="rgba(255,255,255,0.1)"/>
  <text x="885" y="130" text-anchor="middle" font-family="system-ui, sans-serif" font-size="22" font-weight="600" fill="rgba(255,255,255,0.9)">${right.title}</text>`

  right.items.forEach((item, i) => {
    svg += `
    <circle cx="660" cy="${185 + i * 75}" r="8" fill="rgba(255,255,255,0.4)"/>
    <text x="685" y="${192 + i * 75}" font-family="system-ui, sans-serif" font-size="18" fill="rgba(255,255,255,0.7)">${item}</text>`
  })

  // VS circle
  svg += `
  <circle cx="600" cy="350" r="35" fill="#0a0a0a" stroke="${colors.primary}" stroke-width="3"/>
  <text x="600" y="358" text-anchor="middle" font-family="system-ui, sans-serif" font-size="20" font-weight="700" fill="${colors.primary}">VS</text>`

  svg += createBranding()
  svg += '</svg>'
  return svg
}

// Generate flow SVG
function generateFlow(data) {
  const { category, title, elements } = data
  const colors = categoryColors[category]
  const stepWidth = 180
  const startX = 600 - ((elements.length - 1) * stepWidth) / 2

  let svg = createSvgHeader()
  svg += createGradientDefs(category)
  svg += createBackground()
  svg += createTitle(title, category)

  elements.forEach((el, i) => {
    const x = startX + i * stepWidth
    const y = 300

    // Box
    svg += `
    <rect x="${x - 70}" y="${y - 60}" width="140" height="120" rx="12" fill="rgba(255,255,255,0.05)" stroke="${colors.primary}" stroke-width="2" filter="url(#shadow)"/>
    <text x="${x}" y="${y - 20}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" font-weight="600" fill="${colors.primary}">${el.label}</text>
    <text x="${x}" y="${y + 15}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" fill="rgba(255,255,255,0.7)">${el.desc}</text>`

    // Arrow
    if (i < elements.length - 1) {
      svg += `
      <path d="M${x + 75} ${y} L${x + stepWidth - 75} ${y}" stroke="${colors.primary}" stroke-width="2" stroke-dasharray="5,5"/>
      <polygon points="${x + stepWidth - 80},${y - 6} ${x + stepWidth - 70},${y} ${x + stepWidth - 80},${y + 6}" fill="${colors.primary}"/>`
    }
  })

  svg += createBranding()
  svg += '</svg>'
  return svg
}

// Generate steps SVG
function generateSteps(data) {
  const { category, title, steps } = data
  const colors = categoryColors[category]

  let svg = createSvgHeader()
  svg += createGradientDefs(category)
  svg += createBackground()
  svg += createTitle(title, category)

  const stepHeight = 100
  const startY = 110

  steps.forEach((step, i) => {
    const y = startY + i * stepHeight

    // Number circle
    svg += `
    <circle cx="100" cy="${y + 40}" r="30" fill="${colors.primary}"/>
    <text x="100" y="${y + 48}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="24" font-weight="700" fill="white">${step.num}</text>`

    // Content box
    svg += `
    <rect x="160" y="${y}" width="980" height="80" rx="12" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
    <text x="190" y="${y + 35}" font-family="system-ui, sans-serif" font-size="20" font-weight="600" fill="white">${step.title}</text>
    <text x="190" y="${y + 60}" font-family="system-ui, sans-serif" font-size="16" fill="rgba(255,255,255,0.6)">${step.desc}</text>`

    // Connector line
    if (i < steps.length - 1) {
      svg += `<line x1="100" y1="${y + 70}" x2="100" y2="${y + stepHeight}" stroke="${colors.primary}" stroke-width="2" stroke-dasharray="4,4"/>`
    }
  })

  svg += createBranding()
  svg += '</svg>'
  return svg
}

// Generate icons grid SVG
function generateIcons(data) {
  const { category, title, items } = data
  const colors = categoryColors[category]

  let svg = createSvgHeader()
  svg += createGradientDefs(category)
  svg += createBackground()
  svg += createTitle(title, category)

  const cols = items.length <= 3 ? items.length : Math.ceil(items.length / 2)
  const rows = Math.ceil(items.length / cols)
  const boxWidth = items.length <= 3 ? 340 : 260
  const boxHeight = 200
  const startX = 600 - ((cols - 1) * (boxWidth + 30)) / 2
  const startY = rows === 1 ? 250 : 130

  items.forEach((item, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = startX + col * (boxWidth + 30)
    const y = startY + row * (boxHeight + 40)

    svg += `
    <rect x="${x - boxWidth/2}" y="${y}" width="${boxWidth}" height="${boxHeight}" rx="16" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
    <text x="${x}" y="${y + 55}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="40">${item.icon}</text>
    <text x="${x}" y="${y + 105}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="20" font-weight="600" fill="${colors.primary}">${item.title}</text>
    <text x="${x}" y="${y + 135}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" fill="rgba(255,255,255,0.6)">${item.desc}</text>`
  })

  svg += createBranding()
  svg += '</svg>'
  return svg
}

// Generate table SVG
function generateTable(data) {
  const { category, title, headers, rows } = data
  const colors = categoryColors[category]

  let svg = createSvgHeader()
  svg += createGradientDefs(category)
  svg += createBackground()
  svg += createTitle(title, category)

  const tableWidth = 1000
  const colWidth = tableWidth / headers.length
  const rowHeight = 60
  const startX = 100
  const startY = 100

  // Header row
  svg += `<rect x="${startX}" y="${startY}" width="${tableWidth}" height="${rowHeight}" rx="8" fill="${colors.primary}" fill-opacity="0.2"/>`

  headers.forEach((header, i) => {
    svg += `<text x="${startX + colWidth * i + colWidth/2}" y="${startY + 38}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="18" font-weight="600" fill="${colors.primary}">${header}</text>`
  })

  // Data rows
  rows.forEach((row, rowIndex) => {
    const y = startY + rowHeight * (rowIndex + 1)
    const bgOpacity = rowIndex % 2 === 0 ? '0.02' : '0.05'

    svg += `<rect x="${startX}" y="${y}" width="${tableWidth}" height="${rowHeight}" fill="rgba(255,255,255,${bgOpacity})"/>`

    row.forEach((cell, colIndex) => {
      svg += `<text x="${startX + colWidth * colIndex + colWidth/2}" y="${y + 38}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" fill="rgba(255,255,255,0.8)">${cell}</text>`
    })
  })

  // Border
  svg += `<rect x="${startX}" y="${startY}" width="${tableWidth}" height="${rowHeight * (rows.length + 1)}" rx="8" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>`

  svg += createBranding()
  svg += '</svg>'
  return svg
}

// Generate pyramid SVG
function generatePyramid(data) {
  const { category, title, levels } = data
  const colors = categoryColors[category]

  let svg = createSvgHeader()
  svg += createGradientDefs(category)
  svg += createBackground()
  svg += createTitle(title, category)

  const centerX = 600
  const startY = 120
  const levelHeight = 120
  const topWidth = 200
  const widthIncrease = 180

  levels.forEach((level, i) => {
    const y = startY + i * levelHeight
    const width = topWidth + i * widthIncrease
    const opacity = 1 - i * 0.2

    // Trapezoid shape
    const x1 = centerX - width / 2
    const x2 = centerX + width / 2
    const nextWidth = topWidth + (i + 1) * widthIncrease
    const nx1 = centerX - nextWidth / 2
    const nx2 = centerX + nextWidth / 2

    if (i < levels.length - 1) {
      svg += `<polygon points="${x1},${y} ${x2},${y} ${nx2},${y + levelHeight} ${nx1},${y + levelHeight}" fill="${colors.primary}" fill-opacity="${opacity * 0.3}" stroke="${colors.primary}" stroke-width="2"/>`
    } else {
      svg += `<rect x="${x1}" y="${y}" width="${width}" height="${levelHeight}" rx="8" fill="${colors.primary}" fill-opacity="${opacity * 0.3}" stroke="${colors.primary}" stroke-width="2"/>`
    }

    // Text
    svg += `
    <text x="${centerX}" y="${y + 45}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="20" font-weight="600" fill="white">${level.label}</text>
    <text x="${centerX}" y="${y + 75}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" fill="rgba(255,255,255,0.7)">${level.desc}</text>`
  })

  svg += createBranding()
  svg += '</svg>'
  return svg
}

// Generate timeline SVG
function generateTimeline(data) {
  const { category, title, events } = data
  const colors = categoryColors[category]

  let svg = createSvgHeader()
  svg += createGradientDefs(category)
  svg += createBackground()
  svg += createTitle(title, category)

  const startX = 150
  const endX = 1050
  const lineY = 350
  const spacing = (endX - startX) / (events.length - 1)

  // Main line
  svg += `<line x1="${startX}" y1="${lineY}" x2="${endX}" y2="${lineY}" stroke="${colors.primary}" stroke-width="4" stroke-linecap="round"/>`

  events.forEach((event, i) => {
    const x = startX + i * spacing

    // Point
    svg += `<circle cx="${x}" cy="${lineY}" r="15" fill="${colors.primary}" stroke="white" stroke-width="3"/>`

    // Year above
    svg += `<text x="${x}" y="${lineY - 40}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="22" font-weight="700" fill="${colors.primary}">${event.year}</text>`

    // Content box below
    svg += `
    <rect x="${x - 100}" y="${lineY + 40}" width="200" height="100" rx="12" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
    <text x="${x}" y="${lineY + 80}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" font-weight="600" fill="white">${event.label}</text>
    <text x="${x}" y="${lineY + 110}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" fill="rgba(255,255,255,0.6)">${event.desc}</text>`
  })

  svg += createBranding()
  svg += '</svg>'
  return svg
}

// Generate chart SVG
function generateChart(data) {
  const { category, title } = data
  const colors = categoryColors[category]

  let svg = createSvgHeader()
  svg += createGradientDefs(category)
  svg += createBackground()
  svg += createTitle(title, category)

  if (data.data && data.data[0]?.pct !== undefined) {
    // Bar chart with percentages
    const barHeight = 50
    const maxWidth = 800
    const startX = 200
    const startY = 120

    data.data.forEach((item, i) => {
      const y = startY + i * (barHeight + 30)
      const width = (item.pct / 100) * maxWidth || 10

      svg += `
      <text x="${startX - 20}" y="${y + 32}" text-anchor="end" font-family="system-ui, sans-serif" font-size="16" font-weight="600" fill="white">${item.year || item.label}</text>
      <rect x="${startX}" y="${y}" width="${maxWidth}" height="${barHeight}" rx="8" fill="rgba(255,255,255,0.05)"/>
      <rect x="${startX}" y="${y}" width="${width}" height="${barHeight}" rx="8" fill="url(#accentGradient)"/>
      <text x="${startX + width + 15}" y="${y + 32}" font-family="system-ui, sans-serif" font-size="14" fill="rgba(255,255,255,0.8)">${item.btc || item.value}</text>`
    })
  } else if (data.data && data.data[0]?.phase) {
    // Cycle phases
    const phaseWidth = 250
    const startX = 100
    const y = 250

    data.data.forEach((item, i) => {
      const x = startX + i * phaseWidth
      const hue = i * 60

      svg += `
      <rect x="${x}" y="${y}" width="${phaseWidth - 20}" height="200" rx="12" fill="${colors.primary}" fill-opacity="${0.3 - i * 0.05}" stroke="${colors.primary}" stroke-width="2"/>
      <text x="${x + (phaseWidth - 20) / 2}" y="${y + 50}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="20" font-weight="600" fill="${colors.primary}">${item.phase}</text>
      <text x="${x + (phaseWidth - 20) / 2}" y="${y + 120}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" fill="rgba(255,255,255,0.7)">${item.desc}</text>`

      if (i < data.data.length - 1) {
        svg += `<path d="M${x + phaseWidth - 20} ${y + 100} L${x + phaseWidth + 5} ${y + 100}" stroke="${colors.primary}" stroke-width="2" marker-end="url(#arrow)"/>`
      }
    })
  }

  svg += createBranding()
  svg += '</svg>'
  return svg
}

// Generate chain blocks SVG
function generateChain(data) {
  const { category, title, blocks } = data
  const colors = categoryColors[category]

  let svg = createSvgHeader()
  svg += createGradientDefs(category)
  svg += createBackground()
  svg += createTitle(title, category)

  const blockWidth = 280
  const blockHeight = 300
  const startX = 600 - ((blocks.length - 1) * (blockWidth + 60)) / 2
  const y = 180

  blocks.forEach((block, i) => {
    const x = startX + i * (blockWidth + 60)

    // Block
    svg += `
    <rect x="${x - blockWidth/2}" y="${y}" width="${blockWidth}" height="${blockHeight}" rx="16" fill="rgba(255,255,255,0.03)" stroke="${colors.primary}" stroke-width="2" filter="url(#shadow)"/>

    <text x="${x}" y="${y + 50}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="28" font-weight="700" fill="${colors.primary}">Bloque ${block.num}</text>

    <line x1="${x - blockWidth/2 + 20}" y1="${y + 80}" x2="${x + blockWidth/2 - 20}" y2="${y + 80}" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>

    <text x="${x - blockWidth/2 + 30}" y="${y + 120}" font-family="system-ui, sans-serif" font-size="14" fill="rgba(255,255,255,0.5)">Hash:</text>
    <text x="${x - blockWidth/2 + 30}" y="${y + 145}" font-family="monospace" font-size="16" fill="${colors.primary}">${block.hash}</text>

    <text x="${x - blockWidth/2 + 30}" y="${y + 190}" font-family="system-ui, sans-serif" font-size="14" fill="rgba(255,255,255,0.5)">Hash anterior:</text>
    <text x="${x - blockWidth/2 + 30}" y="${y + 215}" font-family="monospace" font-size="16" fill="rgba(255,255,255,0.7)">${block.prev}</text>

    <rect x="${x - blockWidth/2 + 20}" y="${y + 240}" width="${blockWidth - 40}" height="40" rx="8" fill="${colors.primary}" fill-opacity="0.2"/>
    <text x="${x}" y="${y + 267}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" fill="rgba(255,255,255,0.8)">Datos de transacciones</text>`

    // Chain link
    if (i < blocks.length - 1) {
      svg += `
      <line x1="${x + blockWidth/2}" y1="${y + blockHeight/2}" x2="${x + blockWidth/2 + 60}" y2="${y + blockHeight/2}" stroke="${colors.primary}" stroke-width="4" stroke-dasharray="8,4"/>
      <polygon points="${x + blockWidth/2 + 50},${y + blockHeight/2 - 8} ${x + blockWidth/2 + 65},${y + blockHeight/2} ${x + blockWidth/2 + 50},${y + blockHeight/2 + 8}" fill="${colors.primary}"/>`
    }
  })

  svg += createBranding()
  svg += '</svg>'
  return svg
}

// Generate checklist SVG
function generateChecklist(data) {
  const { category, title, items } = data
  const colors = categoryColors[category]

  let svg = createSvgHeader()
  svg += createGradientDefs(category)
  svg += createBackground()
  svg += createTitle(title, category)

  const startY = 120
  const itemHeight = 80
  const startX = 150

  items.forEach((item, i) => {
    const y = startY + i * itemHeight

    // Checkbox
    svg += `
    <rect x="${startX}" y="${y}" width="40" height="40" rx="8" fill="${colors.primary}" fill-opacity="0.2" stroke="${colors.primary}" stroke-width="2"/>
    <path d="M${startX + 10} ${y + 20} L${startX + 18} ${y + 28} L${startX + 30} ${y + 12}" stroke="${colors.primary}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>

    <text x="${startX + 60}" y="${y + 28}" font-family="system-ui, sans-serif" font-size="20" fill="rgba(255,255,255,0.9)">${item}</text>`
  })

  svg += createBranding()
  svg += '</svg>'
  return svg
}

// Main generator function
function generateSvg(data) {
  switch (data.type) {
    case 'comparison': return generateComparison(data)
    case 'flow': return generateFlow(data)
    case 'steps': return generateSteps(data)
    case 'icons': return generateIcons(data)
    case 'table': return generateTable(data)
    case 'pyramid': return generatePyramid(data)
    case 'timeline': return generateTimeline(data)
    case 'chart': return generateChart(data)
    case 'chain': return generateChain(data)
    case 'checklist': return generateChecklist(data)
    default:
      console.warn(`Unknown type: ${data.type}`)
      return generateIcons(data) // Fallback
  }
}

// Main execution
async function main() {
  const outputDir = path.join(__dirname, '../public/blog/inline')

  // Create directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  console.log('Generating inline blog SVGs...\n')

  let generated = 0
  let errors = 0

  for (const imageData of inlineImages) {
    try {
      const svg = generateSvg(imageData)
      const outputPath = path.join(outputDir, imageData.filename)
      fs.writeFileSync(outputPath, svg)
      console.log(`✓ ${imageData.filename}`)
      generated++
    } catch (error) {
      console.error(`✗ ${imageData.filename}: ${error.message}`)
      errors++
    }
  }

  console.log(`\n✅ Generated: ${generated} SVGs`)
  if (errors > 0) {
    console.log(`❌ Errors: ${errors}`)
  }
  console.log(`📁 Output: ${outputDir}`)
}

main()
