'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, ChevronDown, ChevronUp, HelpCircle, ArrowRight, Home } from 'lucide-react'
import { Footer } from '@/components/navigation/Footer'

// Tipos
type FAQCategory = 'bitcoin' | 'blockchain' | 'wallets' | 'defi' | 'nodo360'

interface FAQ {
  id: string
  question: string
  answer: string
  category: FAQCategory
  links?: { text: string; url: string }[]
}

// Categorías con colores consistentes con el resto del sitio
const faqCategories: Record<FAQCategory, { name: string; color: string }> = {
  bitcoin: { name: 'Bitcoin', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  blockchain: { name: 'Blockchain', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  wallets: { name: 'Wallets y Seguridad', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  defi: { name: 'DeFi y Web3', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  nodo360: { name: 'Nodo360', color: 'bg-brand-light/20 text-brand-light border-brand-light/30' },
}

// 25 preguntas organizadas por categoría
const faqs: FAQ[] = [
  // ==================== BITCOIN (6) ====================
  {
    id: 'que-es-bitcoin',
    question: '¿Que es Bitcoin y como funciona?',
    answer: 'Bitcoin es la primera criptomoneda descentralizada del mundo, creada en 2009 por Satoshi Nakamoto. Funciona como dinero digital que puede enviarse directamente entre personas sin necesidad de bancos u otros intermediarios. Las transacciones se verifican mediante una red global de computadoras (nodos) y se registran en un libro publico llamado blockchain. Bitcoin utiliza criptografia avanzada para garantizar la seguridad y tiene un suministro limitado de 21 millones de unidades, lo que lo convierte en un activo escaso similar al oro digital.',
    category: 'bitcoin',
    links: [
      { text: 'Guia completa de Bitcoin', url: '/blog/que-es-bitcoin-guia-completa' },
      { text: 'Ver termino en glosario', url: '/glosario/bitcoin' },
    ],
  },
  {
    id: 'es-seguro-invertir-bitcoin',
    question: '¿Es seguro invertir en Bitcoin?',
    answer: 'Bitcoin es una inversion de alto riesgo debido a su volatilidad. El precio puede subir o bajar significativamente en cortos periodos. Sin embargo, la tecnologia subyacente es extremadamente segura: la red Bitcoin nunca ha sido hackeada en sus mas de 15 años de existencia. Los riesgos principales vienen de: 1) Volatilidad del precio, 2) Perdida de claves privadas por descuido, 3) Estafas y phishing. La recomendacion es invertir solo lo que puedas permitirte perder, educarte antes de invertir, y usar almacenamiento seguro (hardware wallets) para cantidades significativas.',
    category: 'bitcoin',
    links: [
      { text: 'Soberania financiera con Bitcoin', url: '/blog/soberania-financiera-bitcoin' },
    ],
  },
  {
    id: 'como-comprar-bitcoin-espana',
    question: '¿Como puedo comprar Bitcoin en España?',
    answer: 'En España puedes comprar Bitcoin de varias formas: 1) Exchanges centralizados como Binance, Kraken, Coinbase o Bit2Me, que permiten comprar con transferencia bancaria o tarjeta. 2) Exchanges P2P como Bisq o HodlHodl para comprar directamente a otras personas. 3) Cajeros Bitcoin distribuidos por ciudades españolas. 4) Apps como Relai o Pocket para compras recurrentes. Lo importante es verificar que la plataforma este registrada en el Banco de España, usar autenticacion de dos factores (2FA), y transferir tus bitcoins a una wallet propia tras la compra.',
    category: 'bitcoin',
    links: [
      { text: 'Guia para comprar Bitcoin en España', url: '/blog/como-comprar-bitcoin-espana' },
    ],
  },
  {
    id: 'que-es-halving-bitcoin',
    question: '¿Que es el halving de Bitcoin?',
    answer: 'El halving es un evento programado que reduce a la mitad la recompensa que reciben los mineros por añadir nuevos bloques a la blockchain de Bitcoin. Ocurre cada 210,000 bloques (aproximadamente cada 4 años). Empezo con 50 BTC por bloque en 2009, bajo a 25 BTC en 2012, a 12.5 BTC en 2016, a 6.25 BTC en 2020, y a 3.125 BTC en 2024. Este mecanismo controla la emision de nuevos bitcoins y crea escasez programada. Historicamente, los halvings han precedido periodos de aumento de precio, aunque no hay garantia de que esto continue.',
    category: 'bitcoin',
    links: [
      { text: 'Halving en el glosario', url: '/glosario/halving' },
    ],
  },
  {
    id: 'cuantos-bitcoin-existen',
    question: '¿Cuantos Bitcoin existen?',
    answer: 'El protocolo de Bitcoin establece un limite maximo de 21 millones de bitcoins que existiran jamas. Actualmente hay aproximadamente 19.5 millones en circulacion (minados). Los restantes se minaran gradualmente hasta aproximadamente el año 2140. Se estima que entre 3 y 4 millones de bitcoins se han perdido permanentemente (claves privadas olvidadas, wallets inaccesibles). Cada bitcoin puede dividirse en 100 millones de unidades mas pequeñas llamadas satoshis, permitiendo transacciones de cualquier tamaño.',
    category: 'bitcoin',
    links: [
      { text: 'Satoshi en el glosario', url: '/glosario/satoshi' },
    ],
  },
  {
    id: 'bitcoin-legal-espana',
    question: '¿Bitcoin es legal en España?',
    answer: 'Si, Bitcoin es completamente legal en España. Puedes comprar, vender, poseer y usar Bitcoin sin restricciones. Sin embargo, existen obligaciones fiscales: las ganancias por venta de criptomonedas tributan como ganancias patrimoniales en el IRPF (19-28% segun tramos). Los exchanges que operan en España deben registrarse en el Banco de España. Desde 2024, existe obligacion de declarar tenencias de criptomonedas superiores a 50,000 euros. Es recomendable mantener registros de todas las operaciones para la declaracion de la renta.',
    category: 'bitcoin',
  },

  // ==================== BLOCKCHAIN (5) ====================
  {
    id: 'que-es-blockchain',
    question: '¿Que es blockchain y para que sirve?',
    answer: 'Blockchain es una tecnologia de registro distribuido que almacena informacion en bloques encadenados criptograficamente. Cada bloque contiene un grupo de transacciones y un hash (huella digital) del bloque anterior, creando una cadena inmutable. Sirve para: 1) Transferir valor sin intermediarios (criptomonedas), 2) Crear contratos inteligentes que se ejecutan automaticamente, 3) Registrar propiedad de activos digitales (NFTs), 4) Trazabilidad en cadenas de suministro, 5) Votacion electronica segura. Su principal ventaja es eliminar la necesidad de confiar en una autoridad central.',
    category: 'blockchain',
    links: [
      { text: 'Que es Blockchain explicado', url: '/blog/que-es-blockchain-explicado' },
      { text: 'Blockchain en el glosario', url: '/glosario/blockchain' },
    ],
  },
  {
    id: 'diferencia-bitcoin-blockchain',
    question: '¿Cual es la diferencia entre Bitcoin y blockchain?',
    answer: 'Bitcoin es una criptomoneda, mientras que blockchain es la tecnologia subyacente que la hace funcionar. Piensa en blockchain como el motor y Bitcoin como el coche. Bitcoin fue la primera aplicacion exitosa de blockchain, pero la tecnologia tiene muchos otros usos. Ethereum usa blockchain para contratos inteligentes, otras empresas la usan para trazabilidad de productos, gobiernos la exploran para registros publicos. Todas las criptomonedas usan alguna forma de blockchain, pero no todas las blockchains tienen criptomonedas.',
    category: 'blockchain',
    links: [
      { text: 'Bitcoin en el glosario', url: '/glosario/bitcoin' },
    ],
  },
  {
    id: 'se-puede-hackear-blockchain',
    question: '¿Se puede hackear una blockchain?',
    answer: 'Las blockchains maduras como Bitcoin son practicamente imposibles de hackear. Para alterar transacciones pasadas, un atacante necesitaria controlar mas del 51% del poder computacional de la red (ataque 51%), lo cual es economicamente inviable en redes grandes. Lo que si se hackea frecuentemente son: exchanges centralizados, wallets mal protegidas, contratos inteligentes con bugs, y usuarios mediante phishing. Los hackeos que ves en noticias suelen ser a plataformas que custodian criptomonedas, no a las blockchains en si.',
    category: 'blockchain',
    links: [
      { text: 'Ataque 51% en el glosario', url: '/glosario/ataque-51' },
    ],
  },
  {
    id: 'empresas-usan-blockchain',
    question: '¿Que empresas usan blockchain?',
    answer: 'Muchas grandes empresas ya usan blockchain: IBM ofrece soluciones empresariales con Hyperledger, Walmart rastrea alimentos en su cadena de suministro, Maersk gestiona logistica de contenedores, JPMorgan tiene su propia blockchain para pagos (JPM Coin), Microsoft ofrece Azure Blockchain, Visa y Mastercard procesan pagos crypto. En España, Telefonica, BBVA y Santander han desarrollado proyectos blockchain. El sector financiero, logistico y de salud son los que mas adoptan esta tecnologia.',
    category: 'blockchain',
  },
  {
    id: 'blockchain-criptomonedas-igual',
    question: '¿Blockchain es lo mismo que criptomonedas?',
    answer: 'No, blockchain es la tecnologia y las criptomonedas son una de sus aplicaciones. Blockchain puede usarse sin criptomonedas: para registros medicos, votaciones, cadenas de suministro, identidad digital. Sin embargo, la mayoria de blockchains publicas usan criptomonedas como incentivo para los participantes que mantienen la red segura (mineros/validadores). Las blockchains privadas empresariales a menudo no tienen criptomoneda asociada.',
    category: 'blockchain',
  },

  // ==================== WALLETS Y SEGURIDAD (5) ====================
  {
    id: 'que-es-wallet-criptomonedas',
    question: '¿Que es una wallet de criptomonedas?',
    answer: 'Una wallet (cartera) es un software o dispositivo que almacena tus claves privadas, las cuales te permiten acceder y controlar tus criptomonedas. Contrariamente a lo que sugiere el nombre, la wallet no "contiene" tus criptos; estas existen en la blockchain. La wallet guarda las llaves que demuestran tu propiedad. Hay varios tipos: hot wallets (conectadas a internet, como apps moviles), cold wallets (offline, como hardware wallets), y custodiales (donde un tercero guarda tus claves).',
    category: 'wallets',
    links: [
      { text: 'Wallet en el glosario', url: '/glosario/wallet' },
    ],
  },
  {
    id: 'wallet-mas-segura',
    question: '¿Cual es la wallet mas segura?',
    answer: 'Las hardware wallets (Ledger, Trezor, Coldcard) son las mas seguras porque mantienen tus claves privadas offline, protegidas de hackeos remotos. Para uso diario con pequeñas cantidades, wallets moviles como BlueWallet, Muun o Phoenix son buenas opciones. La seguridad maxima se logra combinando: hardware wallet para ahorros a largo plazo, hot wallet con pequeñas cantidades para uso diario, seed phrase guardada en metal en lugar seguro, y nunca compartir tu seed phrase con nadie.',
    category: 'wallets',
    links: [
      { text: 'Hardware Wallet en el glosario', url: '/glosario/hardware-wallet' },
      { text: 'Cold Storage explicado', url: '/glosario/cold-storage' },
    ],
  },
  {
    id: 'perder-seed-phrase',
    question: '¿Que pasa si pierdo mi seed phrase?',
    answer: 'Si pierdes tu seed phrase (las 12-24 palabras de recuperacion) y tambien pierdes acceso a tu wallet, tus criptomonedas se pierden PERMANENTEMENTE. No hay servicio de atencion al cliente, no hay "recuperar contraseña", nadie puede ayudarte. Por eso es critico: 1) Escribir la seed phrase en papel o metal (nunca digital), 2) Guardar copias en multiples ubicaciones seguras, 3) Nunca compartirla con nadie, 4) Nunca introducirla en sitios web. Tu seed phrase es el unico respaldo de tus fondos.',
    category: 'wallets',
    links: [
      { text: 'Seed Phrase en el glosario', url: '/glosario/seed-phrase' },
    ],
  },
  {
    id: 'dejar-crypto-exchange',
    question: '¿Es seguro dejar mis crypto en un exchange?',
    answer: 'Dejar criptomonedas en un exchange es comodo pero arriesgado. Los exchanges pueden: ser hackeados (Mt. Gox, FTX), quebrar, congelar tu cuenta, o ser sancionados por reguladores. El dicho "not your keys, not your coins" (no son tus llaves, no son tus monedas) resume el riesgo. Recomendacion: usa exchanges para comprar/vender, pero transfiere cantidades significativas a tu propia wallet. Para trading activo, solo deja lo necesario en el exchange y activa todas las medidas de seguridad (2FA, whitelist de direcciones).',
    category: 'wallets',
    links: [
      { text: 'Custodial vs Non-Custodial', url: '/glosario/custodial' },
    ],
  },
  {
    id: 'proteger-criptomonedas-hackers',
    question: '¿Como protejo mis criptomonedas de hackers?',
    answer: 'Medidas esenciales: 1) Usa hardware wallet para cantidades significativas, 2) Activa 2FA en todos los servicios (preferiblemente app, no SMS), 3) Nunca compartas tu seed phrase, 4) Verifica URLs antes de conectar tu wallet, 5) Desconfia de ofertas demasiado buenas, 6) No hagas clic en links de correos sospechosos, 7) Usa contraseñas unicas para cada servicio, 8) Mantén software actualizado, 9) Considera usar un dispositivo dedicado solo para crypto. El 90% de los hackeos son por phishing o errores del usuario, no por fallos tecnologicos.',
    category: 'wallets',
    links: [
      { text: 'Phishing explicado', url: '/glosario/phishing' },
      { text: '2FA en el glosario', url: '/glosario/2fa' },
    ],
  },

  // ==================== DEFI Y WEB3 (5) ====================
  {
    id: 'que-es-defi',
    question: '¿Que es DeFi (finanzas descentralizadas)?',
    answer: 'DeFi (Decentralized Finance) es un ecosistema de aplicaciones financieras construidas sobre blockchains, principalmente Ethereum. Permite acceder a servicios como prestamos, intercambios, ahorro y derivados sin bancos ni intermediarios. Todo funciona mediante smart contracts: codigo que ejecuta operaciones automaticamente. Ventajas: acceso global sin KYC, transparencia total, control de tus fondos. Riesgos: bugs en contratos, volatilidad extrema, estafas. Es un campo experimental que ofrece innovacion pero requiere precaucion.',
    category: 'defi',
    links: [
      { text: 'DeFi para principiantes', url: '/blog/defi-para-principiantes' },
      { text: 'DeFi en el glosario', url: '/glosario/defi' },
    ],
  },
  {
    id: 'que-es-staking',
    question: '¿Que es el staking y como funciona?',
    answer: 'Staking es el proceso de bloquear criptomonedas en una red Proof of Stake para ayudar a validar transacciones y asegurar la red. A cambio, recibes recompensas en forma de mas criptomonedas. Es similar a recibir intereses por un deposito bancario. Por ejemplo, Ethereum permite stakear ETH para convertirte en validador. Puedes hacer staking directo (requiere cantidad minima, conocimientos tecnicos) o mediante servicios como Lido que lo hacen accesible a cualquier cantidad. Los rendimientos tipicos van del 3% al 15% anual dependiendo de la red.',
    category: 'defi',
    links: [
      { text: 'Staking en el glosario', url: '/glosario/staking' },
    ],
  },
  {
    id: 'que-son-nfts',
    question: '¿Que son los NFTs?',
    answer: 'NFT (Non-Fungible Token) es un activo digital unico registrado en blockchain. A diferencia de Bitcoin donde cada unidad es igual a otra, cada NFT es distinguible y puede representar propiedad de arte digital, coleccionables, musica, acceso a comunidades, items de videojuegos, y mas. Funcionan mediante smart contracts que certifican autenticidad y propiedad. El mercado de NFTs tuvo un boom en 2021 pero ha caido significativamente desde entonces. Su valor real esta en casos de uso practicos mas alla de JPEGs especulativos.',
    category: 'defi',
    links: [
      { text: 'NFT en el glosario', url: '/glosario/nft' },
    ],
  },
  {
    id: 'que-es-web3',
    question: '¿Que es Web3?',
    answer: 'Web3 es la vision de un internet descentralizado donde los usuarios tienen propiedad real de sus datos, activos digitales e identidad. Contrasta con Web2 (plataformas centralizadas como Facebook, Google) donde las empresas controlan y monetizan tus datos. En Web3, mediante blockchain, puedes poseer tu identidad digital, tus creaciones (NFTs), participar en la gobernanza de plataformas (DAOs), y usar servicios financieros sin intermediarios (DeFi). Esta en desarrollo temprano con desafios de usabilidad y escalabilidad.',
    category: 'defi',
    links: [
      { text: 'Web3 en el glosario', url: '/glosario/web3' },
    ],
  },
  {
    id: 'que-es-smart-contract',
    question: '¿Que es un smart contract?',
    answer: 'Un smart contract (contrato inteligente) es un programa almacenado en blockchain que se ejecuta automaticamente cuando se cumplen condiciones predefinidas. Funciona como un contrato tradicional pero sin necesidad de intermediarios: el codigo garantiza el cumplimiento. Ejemplo: un smart contract de crowdfunding puede devolver automaticamente el dinero si no se alcanza la meta, o liberarlo al creador si se cumple. Ethereum fue la primera blockchain diseñada para smart contracts. Son la base de DeFi, NFTs, DAOs y la mayoria de innovaciones en Web3.',
    category: 'defi',
    links: [
      { text: 'Smart Contract en el glosario', url: '/glosario/smart-contract' },
    ],
  },

  // ==================== NODO360 (4) ====================
  {
    id: 'que-es-nodo360',
    question: '¿Que es Nodo360?',
    answer: 'Nodo360 es una plataforma educativa en español especializada en Bitcoin, blockchain, criptomonedas y Web3. Ofrecemos cursos estructurados que te llevan de principiante a experto, con rutas de aprendizaje claras, ejercicios practicos y certificados verificables. Nuestro enfoque es educacion real sin humo: explicamos tanto las oportunidades como los riesgos del ecosistema crypto. La plataforma incluye cursos gratuitos para empezar, comunidad de estudiantes, mentoria, y contenido actualizado constantemente.',
    category: 'nodo360',
    links: [
      { text: 'Explorar cursos', url: '/cursos' },
      { text: 'Ver rutas de aprendizaje', url: '/rutas' },
    ],
  },
  {
    id: 'cursos-nodo360-gratuitos',
    question: '¿Los cursos de Nodo360 son gratuitos?',
    answer: 'Nodo360 ofrece contenido tanto gratuito como premium. Los cursos introductorios y mucho contenido educativo (blog, glosario, recursos) son completamente gratuitos. Los cursos avanzados y especializados, mentoria personalizada, y certificaciones premium tienen costo. Nuestra filosofia es que cualquiera pueda empezar a aprender sobre Bitcoin y crypto sin barreras economicas. Los cursos de pago ofrecen contenido mas profundo, soporte directo, y certificados reconocidos.',
    category: 'nodo360',
    links: [
      { text: 'Ver cursos gratuitos', url: '/cursos' },
      { text: 'Planes y precios', url: '/pricing' },
    ],
  },
  {
    id: 'como-registrarse-nodo360',
    question: '¿Como me registro en Nodo360?',
    answer: 'Registrarte es simple y gratuito: 1) Haz clic en "Crear cuenta" en la esquina superior derecha, 2) Introduce tu email y crea una contraseña, 3) Confirma tu email haciendo clic en el enlace que te enviamos, 4) Completa tu perfil y elige tu primera ruta de aprendizaje. Una vez registrado, tendras acceso inmediato a todos los cursos gratuitos, el glosario, blog, y la comunidad. Puedes empezar a aprender en minutos.',
    category: 'nodo360',
    links: [
      { text: 'Crear cuenta gratis', url: '/login?mode=register' },
    ],
  },
  {
    id: 'certificado-completar-curso',
    question: '¿Obtengo certificado al completar un curso?',
    answer: 'Si, al completar un curso en Nodo360 recibes un certificado digital verificable. Cada certificado incluye: tu nombre, el curso completado, fecha de finalizacion, y un codigo unico de verificacion. Los certificados pueden añadirse a LinkedIn y compartirse para demostrar tus conocimientos. Para cursos premium, los certificados tienen validacion adicional y pueden incluir evaluaciones practicas. Nuestro objetivo es que tus certificados tengan valor real en el mercado laboral.',
    category: 'nodo360',
    links: [
      { text: 'Ver mis certificados', url: '/dashboard/certificados' },
    ],
  },
]

// Componente de pregunta individual
function FAQItem({ faq, isExpanded, onToggle }: {
  faq: FAQ
  isExpanded: boolean
  onToggle: () => void
}) {
  const category = faqCategories[faq.category]

  return (
    <div className="bg-dark-surface border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all">
      <button
        onClick={onToggle}
        className="w-full p-5 text-left flex items-start justify-between gap-4"
        aria-expanded={isExpanded}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full border ${category.color}`}>
              {category.name}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-white pr-4">
            {faq.question}
          </h3>
        </div>
        <div className="flex-shrink-0 mt-1">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-brand-light" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white/40" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 pt-0 border-t border-white/5">
          <p className="text-white/70 text-sm leading-relaxed mt-4">
            {faq.answer}
          </p>

          {faq.links && faq.links.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-xs text-white/50 mb-2">Aprende mas:</p>
              <div className="flex flex-wrap gap-2">
                {faq.links.map((link) => (
                  <Link
                    key={link.url}
                    href={link.url}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-full text-brand-light hover:text-white hover:border-brand-light/30 transition"
                  >
                    {link.text}
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Filtrar FAQs
  const filteredFaqs = useMemo(() => {
    let result = faqs

    // Filtro por categoria
    if (selectedCategory !== 'all') {
      result = result.filter(f => f.category === selectedCategory)
    }

    // Filtro por busqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(f =>
        f.question.toLowerCase().includes(query) ||
        f.answer.toLowerCase().includes(query)
      )
    }

    return result
  }, [selectedCategory, searchQuery])

  // Agrupar por categoria para mostrar
  const groupedFaqs = useMemo(() => {
    const grouped: Record<FAQCategory, FAQ[]> = {
      bitcoin: [],
      blockchain: [],
      wallets: [],
      defi: [],
      nodo360: [],
    }

    for (const faq of filteredFaqs) {
      grouped[faq.category].push(faq)
    }

    return grouped
  }, [filteredFaqs])

  // Generar Schema.org FAQPage
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <div className="min-h-screen bg-dark">
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      {/* Breadcrumbs */}
      <div className="bg-dark border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <nav className="flex items-center gap-2 text-sm text-white/50">
            <Link href="/" className="hover:text-white transition flex items-center gap-1">
              <Home className="w-4 h-4" />
              Inicio
            </Link>
            <span>/</span>
            <span className="text-white">FAQ</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-b from-brand/10 via-brand-light/5 to-transparent py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block px-4 py-1.5 bg-brand-light/10 border border-brand-light/30 text-brand-light text-sm font-medium rounded-full mb-6">
              {faqs.length} Preguntas Frecuentes
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Preguntas{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-light to-brand">
                Frecuentes
              </span>
            </h1>
            <p className="text-lg text-white/70">
              Resolvemos tus dudas sobre Bitcoin, criptomonedas, blockchain y Web3.
              Respuestas claras y sencillas para empezar tu aprendizaje.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="sticky top-16 z-40 bg-dark/95 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Buscar preguntas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:border-brand-light/50 focus:ring-2 focus:ring-brand-light/20 transition"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                selectedCategory === 'all'
                  ? 'bg-brand-light/20 text-brand-light border-brand-light/30'
                  : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:border-white/20'
              }`}
            >
              Todas ({faqs.length})
            </button>
            {Object.entries(faqCategories).map(([key, category]) => {
              const count = faqs.filter(f => f.category === key).length
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key as FAQCategory)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                    selectedCategory === key
                      ? category.color
                      : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:border-white/20'
                  }`}
                >
                  {category.name} ({count})
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* FAQ List */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-16">
            <HelpCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">No se encontraron preguntas.</p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('all')
              }}
              className="mt-4 text-brand-light hover:underline"
            >
              Limpiar filtros
            </button>
          </div>
        ) : selectedCategory === 'all' ? (
          // Mostrar agrupado por categoria
          <div className="space-y-10">
            {Object.entries(groupedFaqs).map(([categoryKey, categoryFaqs]) => {
              if (categoryFaqs.length === 0) return null
              const category = faqCategories[categoryKey as FAQCategory]
              return (
                <div key={categoryKey}>
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full border ${category.color}`}>
                      {category.name}
                    </span>
                    <span className="text-white/40 text-sm font-normal">
                      {categoryFaqs.length} {categoryFaqs.length === 1 ? 'pregunta' : 'preguntas'}
                    </span>
                  </h2>
                  <div className="space-y-3">
                    {categoryFaqs.map((faq) => (
                      <FAQItem
                        key={faq.id}
                        faq={faq}
                        isExpanded={expandedId === faq.id}
                        onToggle={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          // Mostrar lista plana cuando hay filtro de categoria
          <div className="space-y-3">
            {filteredFaqs.map((faq) => (
              <FAQItem
                key={faq.id}
                faq={faq}
                isExpanded={expandedId === faq.id}
                onToggle={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <div className="bg-gradient-to-br from-brand/10 to-brand-light/5 border border-brand/20 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            ¿No encontraste tu respuesta?
          </h2>
          <p className="text-white/70 mb-6 max-w-xl mx-auto">
            Explora nuestro glosario con mas de 50 terminos explicados, o comienza
            un curso para aprender de forma estructurada.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/glosario"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-light to-brand text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-brand-light/25 transition"
            >
              Explorar Glosario
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/cursos"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white font-medium rounded-xl hover:bg-white/10 transition"
            >
              Ver Cursos
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
