/**
 * Script para generar imágenes SVG placeholder para los artículos del blog
 * Ejecutar: node scripts/generate-blog-images.js
 */

const fs = require('fs');
const path = require('path');

// Colores por categoría
const categoryColors = {
  bitcoin: '#F7931A',  // Naranja Bitcoin
  blockchain: '#2563EB', // Azul
  defi: '#7C3AED',     // Púrpura
  web3: '#EC4899',     // Rosa
};

// Artículos del blog con sus datos
const articles = [
  // 5 artículos originales
  {
    slug: 'que-es-bitcoin-guia-completa',
    title: 'Qué es Bitcoin',
    subtitle: 'Guía Completa para Principiantes',
    category: 'bitcoin',
    icon: 'bitcoin',
  },
  {
    slug: 'como-comprar-bitcoin-espana',
    title: 'Cómo Comprar Bitcoin',
    subtitle: 'en España - Guía Paso a Paso',
    category: 'bitcoin',
    icon: 'cart',
  },
  {
    slug: 'que-es-blockchain-explicado',
    title: 'Qué es Blockchain',
    subtitle: 'Tecnología Explicada Simple',
    category: 'blockchain',
    icon: 'blocks',
  },
  {
    slug: 'soberania-financiera-bitcoin',
    title: 'Soberanía Financiera',
    subtitle: 'Control de Tu Dinero con Bitcoin',
    category: 'bitcoin',
    icon: 'key',
  },
  {
    slug: 'defi-para-principiantes',
    title: 'DeFi para Principiantes',
    subtitle: 'Finanzas Descentralizadas 2025',
    category: 'defi',
    icon: 'defi',
  },
  // 10 artículos nuevos
  {
    slug: 'que-es-ethereum-guia-completa',
    title: 'Qué es Ethereum',
    subtitle: 'Guía Completa Smart Contracts',
    category: 'blockchain',
    icon: 'ethereum',
  },
  {
    slug: 'que-es-wallet-crypto-tipos',
    title: 'Qué es una Wallet Crypto',
    subtitle: 'Tipos y Cómo Elegir la Mejor',
    category: 'bitcoin',
    icon: 'wallet',
  },
  {
    slug: 'que-es-mineria-bitcoin',
    title: 'Minería de Bitcoin',
    subtitle: 'Cómo Funciona y Rentabilidad',
    category: 'bitcoin',
    icon: 'mining',
  },
  {
    slug: 'nfts-que-son-para-que-sirven',
    title: 'NFTs: Qué Son',
    subtitle: 'Para Qué Sirven y Su Futuro',
    category: 'web3',
    icon: 'nft',
  },
  {
    slug: 'staking-criptomonedas-guia',
    title: 'Staking de Criptomonedas',
    subtitle: 'Guía de Ingresos Pasivos',
    category: 'defi',
    icon: 'staking',
  },
  {
    slug: 'seguridad-crypto-proteger-criptomonedas',
    title: 'Seguridad Crypto',
    subtitle: '10 Consejos para Proteger tus Cripto',
    category: 'bitcoin',
    icon: 'shield',
  },
  {
    slug: 'bitcoin-vs-oro-comparativa',
    title: 'Bitcoin vs Oro',
    subtitle: '¿Cuál es Mejor Reserva de Valor?',
    category: 'bitcoin',
    icon: 'gold',
  },
  {
    slug: 'layer-2-blockchain-escalabilidad',
    title: 'Layer 2 en Blockchain',
    subtitle: 'El Futuro de la Escalabilidad',
    category: 'blockchain',
    icon: 'layers',
  },
  {
    slug: 'dao-organizaciones-descentralizadas',
    title: 'DAOs',
    subtitle: 'Organizaciones Descentralizadas',
    category: 'web3',
    icon: 'dao',
  },
  {
    slug: 'halving-bitcoin-que-es-cuando',
    title: 'Halving de Bitcoin',
    subtitle: 'Qué Es y Cómo Afecta al Precio',
    category: 'bitcoin',
    icon: 'halving',
  },
];

// Iconos SVG simples
const icons = {
  bitcoin: `
    <circle cx="600" cy="280" r="80" fill="white" opacity="0.15"/>
    <text x="600" y="305" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="white" opacity="0.9" text-anchor="middle">₿</text>
  `,
  cart: `
    <g transform="translate(540, 220)" fill="none" stroke="white" stroke-width="6" opacity="0.9">
      <circle cx="25" cy="100" r="10"/>
      <circle cx="85" cy="100" r="10"/>
      <path d="M0,0 L15,0 L35,70 L95,70 L105,25 L30,25"/>
    </g>
  `,
  blocks: `
    <g transform="translate(520, 210)" fill="white" opacity="0.15">
      <rect x="0" y="40" width="50" height="50" rx="5"/>
      <rect x="55" y="40" width="50" height="50" rx="5"/>
      <rect x="110" y="40" width="50" height="50" rx="5"/>
      <rect x="27" y="95" width="50" height="50" rx="5"/>
      <rect x="82" y="95" width="50" height="50" rx="5"/>
    </g>
    <g transform="translate(520, 210)" fill="none" stroke="white" stroke-width="3" opacity="0.6">
      <line x1="50" y1="65" x2="55" y2="65"/>
      <line x1="105" y1="65" x2="110" y2="65"/>
      <line x1="52" y1="90" x2="52" y2="95"/>
      <line x1="107" y1="90" x2="107" y2="95"/>
    </g>
  `,
  key: `
    <g transform="translate(540, 220)" fill="white" opacity="0.9">
      <circle cx="30" cy="30" r="25" fill="none" stroke="white" stroke-width="8"/>
      <rect x="50" y="22" width="70" height="16" rx="3"/>
      <rect x="100" y="38" width="15" height="25" rx="2"/>
      <rect x="80" y="38" width="15" height="20" rx="2"/>
    </g>
  `,
  defi: `
    <g transform="translate(540, 220)" fill="none" stroke="white" stroke-width="5" opacity="0.9">
      <circle cx="60" cy="60" r="50"/>
      <path d="M60,20 L60,100"/>
      <path d="M20,60 L100,60"/>
      <circle cx="60" cy="60" r="15" fill="white" opacity="0.3"/>
    </g>
  `,
  ethereum: `
    <g transform="translate(560, 200)" fill="white" opacity="0.9">
      <polygon points="40,0 80,70 40,95 0,70" fill="white" opacity="0.6"/>
      <polygon points="40,95 80,70 40,140 0,70" fill="white" opacity="0.3"/>
      <polygon points="40,50 80,70 40,95" fill="white" opacity="0.4"/>
    </g>
  `,
  wallet: `
    <g transform="translate(530, 220)" fill="white" opacity="0.9">
      <rect x="0" y="20" width="120" height="80" rx="10" fill="none" stroke="white" stroke-width="6"/>
      <rect x="90" y="45" width="35" height="30" rx="5"/>
      <circle cx="107" cy="60" r="6" fill="currentColor"/>
    </g>
  `,
  mining: `
    <g transform="translate(530, 210)" fill="white" opacity="0.9">
      <rect x="20" y="0" width="100" height="60" rx="5" fill="none" stroke="white" stroke-width="5"/>
      <line x1="45" y1="15" x2="45" y2="45" stroke="white" stroke-width="4"/>
      <line x1="70" y1="15" x2="70" y2="45" stroke="white" stroke-width="4"/>
      <line x1="95" y1="15" x2="95" y2="45" stroke="white" stroke-width="4"/>
      <rect x="0" y="70" width="140" height="50" rx="5" fill="none" stroke="white" stroke-width="5"/>
      <circle cx="30" cy="95" r="10"/>
      <circle cx="70" cy="95" r="10"/>
      <circle cx="110" cy="95" r="10"/>
    </g>
  `,
  nft: `
    <g transform="translate(530, 210)" fill="white" opacity="0.9">
      <rect x="10" y="10" width="100" height="100" rx="10" fill="none" stroke="white" stroke-width="5"/>
      <rect x="25" y="25" width="70" height="50" rx="5" fill="white" opacity="0.2"/>
      <text x="60" y="100" font-family="Arial" font-size="24" font-weight="bold" text-anchor="middle">NFT</text>
    </g>
  `,
  staking: `
    <g transform="translate(540, 210)" fill="white" opacity="0.9">
      <ellipse cx="60" cy="110" rx="50" ry="15" fill="none" stroke="white" stroke-width="4"/>
      <ellipse cx="60" cy="85" rx="50" ry="15" fill="none" stroke="white" stroke-width="4"/>
      <ellipse cx="60" cy="60" rx="50" ry="15" fill="none" stroke="white" stroke-width="4"/>
      <ellipse cx="60" cy="35" rx="50" ry="15" fill="white" opacity="0.3" stroke="white" stroke-width="4"/>
      <line x1="10" y1="35" x2="10" y2="110" stroke="white" stroke-width="4"/>
      <line x1="110" y1="35" x2="110" y2="110" stroke="white" stroke-width="4"/>
    </g>
  `,
  shield: `
    <g transform="translate(545, 205)" fill="white" opacity="0.9">
      <path d="M55,0 L110,25 L110,75 C110,110 55,140 55,140 C55,140 0,110 0,75 L0,25 Z" fill="none" stroke="white" stroke-width="6"/>
      <path d="M35,70 L50,85 L80,50" fill="none" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  `,
  gold: `
    <g transform="translate(520, 220)" fill="white" opacity="0.9">
      <polygon points="80,0 160,50 80,100 0,50" fill="none" stroke="white" stroke-width="5"/>
      <polygon points="80,0 80,100" fill="none" stroke="white" stroke-width="2" opacity="0.5"/>
      <polygon points="0,50 160,50" fill="none" stroke="white" stroke-width="2" opacity="0.5"/>
      <text x="50" y="60" font-family="Arial" font-size="30" font-weight="bold">Au</text>
      <text x="100" y="60" font-family="Arial" font-size="30" font-weight="bold">₿</text>
    </g>
  `,
  layers: `
    <g transform="translate(520, 200)" fill="white" opacity="0.9">
      <polygon points="80,20 160,60 80,100 0,60" fill="none" stroke="white" stroke-width="4"/>
      <polygon points="80,45 160,85 80,125 0,85" fill="white" opacity="0.2" stroke="white" stroke-width="4"/>
      <polygon points="80,70 160,110 80,150 0,110" fill="white" opacity="0.3" stroke="white" stroke-width="4"/>
    </g>
  `,
  dao: `
    <g transform="translate(530, 210)" fill="white" opacity="0.9">
      <circle cx="60" cy="20" r="15" fill="none" stroke="white" stroke-width="4"/>
      <circle cx="20" cy="80" r="15" fill="none" stroke="white" stroke-width="4"/>
      <circle cx="100" cy="80" r="15" fill="none" stroke="white" stroke-width="4"/>
      <circle cx="60" cy="120" r="15" fill="none" stroke="white" stroke-width="4"/>
      <line x1="60" y1="35" x2="35" y2="65" stroke="white" stroke-width="3"/>
      <line x1="60" y1="35" x2="85" y2="65" stroke="white" stroke-width="3"/>
      <line x1="35" y1="80" x2="60" y2="105" stroke="white" stroke-width="3"/>
      <line x1="85" y1="80" x2="60" y2="105" stroke="white" stroke-width="3"/>
    </g>
  `,
  halving: `
    <g transform="translate(530, 210)" fill="white" opacity="0.9">
      <circle cx="60" cy="60" r="55" fill="none" stroke="white" stroke-width="5"/>
      <line x1="60" y1="5" x2="60" y2="115" stroke="white" stroke-width="4"/>
      <text x="30" y="70" font-family="Arial" font-size="40" font-weight="bold">½</text>
    </g>
  `,
};

// Función para generar SVG
function generateSVG(article) {
  const bgColor = categoryColors[article.category];
  const icon = icons[article.icon] || icons.bitcoin;

  // Crear gradiente de fondo más oscuro en la parte inferior
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${adjustColor(bgColor, -40)};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="overlayGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:black;stop-opacity:0" />
      <stop offset="70%" style="stop-color:black;stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:black;stop-opacity:0.6" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGradient)"/>

  <!-- Pattern overlay -->
  <g opacity="0.05">
    ${generatePattern()}
  </g>

  <!-- Gradient overlay for text readability -->
  <rect width="1200" height="630" fill="url(#overlayGradient)"/>

  <!-- Icon -->
  ${icon}

  <!-- Title -->
  <text x="600" y="460" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="bold" fill="white" text-anchor="middle" filter="url(#shadow)">
    ${escapeXml(article.title)}
  </text>

  <!-- Subtitle -->
  <text x="600" y="520" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="white" opacity="0.85" text-anchor="middle">
    ${escapeXml(article.subtitle)}
  </text>

  <!-- Nodo360 branding -->
  <g transform="translate(50, 560)">
    <rect x="0" y="0" width="140" height="40" rx="8" fill="white" opacity="0.15"/>
    <text x="70" y="28" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="bold" fill="white" text-anchor="middle">Nodo360</text>
  </g>

  <!-- Category badge -->
  <g transform="translate(1010, 560)">
    <rect x="0" y="0" width="140" height="40" rx="8" fill="white" opacity="0.2"/>
    <text x="70" y="28" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="white" text-anchor="middle">${getCategoryName(article.category)}</text>
  </g>
</svg>`;

  return svg;
}

// Función auxiliar para ajustar brillo del color
function adjustColor(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// Función para generar patrón de fondo
function generatePattern() {
  let pattern = '';
  for (let i = 0; i < 20; i++) {
    for (let j = 0; j < 10; j++) {
      const x = i * 70 + (j % 2 === 0 ? 0 : 35);
      const y = j * 70;
      pattern += `<circle cx="${x}" cy="${y}" r="3" fill="white"/>`;
    }
  }
  return pattern;
}

// Escapar caracteres XML
function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Obtener nombre de categoría
function getCategoryName(category) {
  const names = {
    bitcoin: 'Bitcoin',
    blockchain: 'Blockchain',
    defi: 'DeFi',
    web3: 'Web3',
  };
  return names[category] || category;
}

// Directorio de salida
const outputDir = path.join(__dirname, '..', 'public', 'blog');

// Crear directorio si no existe
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generar SVGs
console.log('Generando imágenes SVG para el blog...\n');

articles.forEach((article) => {
  const svg = generateSVG(article);
  const filePath = path.join(outputDir, `${article.slug}.svg`);
  fs.writeFileSync(filePath, svg);
  console.log(`✓ ${article.slug}.svg`);
});

console.log(`\n¡Listo! Se generaron ${articles.length} imágenes en ${outputDir}`);
