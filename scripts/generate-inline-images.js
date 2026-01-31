/**
 * Script para generar imágenes SVG infográficas inline para los artículos del blog
 * Ejecutar: node scripts/generate-inline-images.js
 */

const fs = require('fs');
const path = require('path');

// Colores por categoría
const categoryColors = {
  bitcoin: { primary: '#F7931A', secondary: '#C77A15', light: '#FFB84D' },
  blockchain: { primary: '#2563EB', secondary: '#1D4ED8', light: '#60A5FA' },
  defi: { primary: '#7C3AED', secondary: '#6D28D9', light: '#A78BFA' },
  web3: { primary: '#EC4899', secondary: '#DB2777', light: '#F472B6' },
};

// Definición de todas las imágenes inline
const inlineImages = [
  // 1. que-es-bitcoin-guia-completa
  {
    filename: 'bitcoin-como-funciona.svg',
    category: 'bitcoin',
    title: 'Cómo Funciona una Transacción Bitcoin',
    type: 'transaction-flow',
  },
  {
    filename: 'bitcoin-vs-sistema-tradicional.svg',
    category: 'bitcoin',
    title: 'Bitcoin vs Sistema Bancario Tradicional',
    type: 'comparison',
  },
  {
    filename: 'bitcoin-supply-21m.svg',
    category: 'bitcoin',
    title: 'Emisión de Bitcoin: Camino a 21 Millones',
    type: 'chart',
  },
  // 2. como-comprar-bitcoin-espana
  {
    filename: 'pasos-comprar-bitcoin.svg',
    category: 'bitcoin',
    title: '5 Pasos para Comprar Bitcoin',
    type: 'steps',
  },
  {
    filename: 'exchanges-comparativa.svg',
    category: 'bitcoin',
    title: 'Comparativa de Exchanges en España',
    type: 'table',
  },
  {
    filename: 'bitcoin-custodia-opciones.svg',
    category: 'bitcoin',
    title: 'Opciones de Custodia de Bitcoin',
    type: 'comparison',
  },
  // 3. que-es-blockchain-explicado
  {
    filename: 'blockchain-cadena-bloques.svg',
    category: 'blockchain',
    title: 'Anatomía de una Blockchain',
    type: 'chain',
  },
  {
    filename: 'blockchain-tipos-redes.svg',
    category: 'blockchain',
    title: 'Tipos de Redes: Centralizada vs Descentralizada',
    type: 'network',
  },
  {
    filename: 'blockchain-casos-uso.svg',
    category: 'blockchain',
    title: 'Casos de Uso de Blockchain',
    type: 'icons',
  },
  // 4. soberania-financiera-bitcoin
  {
    filename: 'soberania-piramide.svg',
    category: 'bitcoin',
    title: 'Niveles de Soberanía Financiera',
    type: 'pyramid',
  },
  {
    filename: 'inflacion-vs-bitcoin.svg',
    category: 'bitcoin',
    title: 'Inflación del Euro vs Bitcoin',
    type: 'chart',
  },
  {
    filename: 'ser-tu-propio-banco.svg',
    category: 'bitcoin',
    title: 'Qué Significa Ser Tu Propio Banco',
    type: 'diagram',
  },
  // 5. defi-para-principiantes
  {
    filename: 'defi-ecosistema.svg',
    category: 'defi',
    title: 'El Ecosistema DeFi',
    type: 'ecosystem',
  },
  {
    filename: 'defi-vs-tradfi.svg',
    category: 'defi',
    title: 'DeFi vs Finanzas Tradicionales',
    type: 'comparison',
  },
  {
    filename: 'defi-riesgos.svg',
    category: 'defi',
    title: 'Principales Riesgos en DeFi',
    type: 'risks',
  },
  // 6. que-es-ethereum-guia-completa
  {
    filename: 'ethereum-vs-bitcoin.svg',
    category: 'blockchain',
    title: 'Ethereum vs Bitcoin: Diferencias Clave',
    type: 'comparison',
  },
  {
    filename: 'smart-contract-funcionamiento.svg',
    category: 'blockchain',
    title: 'Cómo Funciona un Smart Contract',
    type: 'flow',
  },
  {
    filename: 'ethereum-ecosistema.svg',
    category: 'blockchain',
    title: 'El Ecosistema de Ethereum',
    type: 'ecosystem',
  },
  // 7. que-es-wallet-crypto-tipos
  {
    filename: 'wallet-tipos-comparativa.svg',
    category: 'bitcoin',
    title: 'Tipos de Wallets: Comparativa',
    type: 'matrix',
  },
  {
    filename: 'wallet-seed-phrase.svg',
    category: 'bitcoin',
    title: 'Cómo Funciona una Seed Phrase',
    type: 'flow',
  },
  {
    filename: 'wallet-seguridad-niveles.svg',
    category: 'bitcoin',
    title: 'Niveles de Seguridad por Tipo de Wallet',
    type: 'scale',
  },
  // 8. que-es-mineria-bitcoin
  {
    filename: 'mineria-proceso.svg',
    category: 'bitcoin',
    title: 'El Proceso de Minería de Bitcoin',
    type: 'process',
  },
  {
    filename: 'mineria-evolucion-hardware.svg',
    category: 'bitcoin',
    title: 'Evolución del Hardware de Minería',
    type: 'timeline',
  },
  {
    filename: 'mineria-rentabilidad.svg',
    category: 'bitcoin',
    title: 'Fórmula de Rentabilidad Minera',
    type: 'formula',
  },
  // 9. nfts-que-son-para-que-sirven
  {
    filename: 'nft-fungible-vs-no-fungible.svg',
    category: 'web3',
    title: 'Fungible vs No Fungible',
    type: 'comparison',
  },
  {
    filename: 'nft-casos-uso.svg',
    category: 'web3',
    title: 'Casos de Uso de NFTs',
    type: 'icons',
  },
  {
    filename: 'nft-como-funciona.svg',
    category: 'web3',
    title: 'Cómo Funciona un NFT',
    type: 'flow',
  },
  // 10. staking-criptomonedas-guia
  {
    filename: 'staking-pow-vs-pos.svg',
    category: 'defi',
    title: 'Proof of Work vs Proof of Stake',
    type: 'comparison',
  },
  {
    filename: 'staking-proceso.svg',
    category: 'defi',
    title: 'Cómo Funciona el Staking',
    type: 'flow',
  },
  {
    filename: 'staking-rendimientos.svg',
    category: 'defi',
    title: 'Rendimientos de Staking por Criptomoneda',
    type: 'chart',
  },
  // 11. seguridad-crypto-proteger-criptomonedas
  {
    filename: 'seguridad-amenazas.svg',
    category: 'bitcoin',
    title: 'Principales Amenazas en Crypto',
    type: 'threats',
  },
  {
    filename: 'seguridad-seed-phrase.svg',
    category: 'bitcoin',
    title: 'Cómo Proteger tu Seed Phrase',
    type: 'checklist',
  },
  {
    filename: 'seguridad-capas.svg',
    category: 'bitcoin',
    title: 'Capas de Seguridad Recomendadas',
    type: 'layers',
  },
  // 12. bitcoin-vs-oro-comparativa
  {
    filename: 'oro-vs-bitcoin-propiedades.svg',
    category: 'bitcoin',
    title: 'Propiedades: Oro vs Bitcoin',
    type: 'comparison',
  },
  {
    filename: 'oro-vs-bitcoin-rendimiento.svg',
    category: 'bitcoin',
    title: 'Rendimiento Histórico',
    type: 'chart',
  },
  {
    filename: 'oro-vs-bitcoin-portabilidad.svg',
    category: 'bitcoin',
    title: 'Portabilidad y Divisibilidad',
    type: 'icons',
  },
  // 13. layer-2-blockchain-escalabilidad
  {
    filename: 'l2-problema-escalabilidad.svg',
    category: 'blockchain',
    title: 'El Problema de Escalabilidad',
    type: 'problem',
  },
  {
    filename: 'l2-tipos-soluciones.svg',
    category: 'blockchain',
    title: 'Tipos de Soluciones Layer 2',
    type: 'types',
  },
  {
    filename: 'l2-comparativa.svg',
    category: 'blockchain',
    title: 'Comparativa de Layer 2s',
    type: 'table',
  },
  // 14. dao-organizaciones-descentralizadas
  {
    filename: 'dao-estructura.svg',
    category: 'web3',
    title: 'Estructura de una DAO',
    type: 'structure',
  },
  {
    filename: 'dao-vs-empresa.svg',
    category: 'web3',
    title: 'DAO vs Empresa Tradicional',
    type: 'comparison',
  },
  {
    filename: 'dao-proceso-votacion.svg',
    category: 'web3',
    title: 'Proceso de Votación en una DAO',
    type: 'flow',
  },
  // 15. halving-bitcoin-que-es-cuando
  {
    filename: 'halving-que-es.svg',
    category: 'bitcoin',
    title: 'Qué es el Halving de Bitcoin',
    type: 'diagram',
  },
  {
    filename: 'halving-historia.svg',
    category: 'bitcoin',
    title: 'Historia de los Halvings',
    type: 'timeline',
  },
  {
    filename: 'halving-ciclos-precio.svg',
    category: 'bitcoin',
    title: 'Halvings y Ciclos de Precio',
    type: 'chart',
  },
];

// Generadores de SVG por tipo
function generateComparisonSVG(image, colors) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="675" viewBox="0 0 1200 675" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="675" fill="url(#bgGrad)"/>

  <!-- Title -->
  <text x="600" y="60" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="white" text-anchor="middle">${escapeXml(image.title)}</text>

  <!-- Left Box -->
  <rect x="80" y="100" width="480" height="480" rx="20" fill="${colors.primary}" opacity="0.15" stroke="${colors.primary}" stroke-width="2"/>
  <text x="320" y="160" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="${colors.light}" text-anchor="middle">Opción A</text>

  <!-- Left Content -->
  <g transform="translate(120, 200)">
    ${generateListItems(4, colors.light, 'white')}
  </g>

  <!-- VS Circle -->
  <circle cx="600" cy="340" r="40" fill="${colors.primary}"/>
  <text x="600" y="350" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">VS</text>

  <!-- Right Box -->
  <rect x="640" y="100" width="480" height="480" rx="20" fill="${colors.secondary}" opacity="0.15" stroke="${colors.secondary}" stroke-width="2"/>
  <text x="880" y="160" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="${colors.light}" text-anchor="middle">Opción B</text>

  <!-- Right Content -->
  <g transform="translate(680, 200)">
    ${generateListItems(4, colors.light, 'white')}
  </g>

  <!-- Branding -->
  <text x="1150" y="650" font-family="Arial, sans-serif" font-size="14" fill="white" opacity="0.5" text-anchor="end">Nodo360</text>
</svg>`;
}

function generateFlowSVG(image, colors) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="675" viewBox="0 0 1200 675" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
    </linearGradient>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="${colors.light}"/>
    </marker>
  </defs>

  <!-- Background -->
  <rect width="1200" height="675" fill="url(#bgGrad)"/>

  <!-- Title -->
  <text x="600" y="50" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="white" text-anchor="middle">${escapeXml(image.title)}</text>

  <!-- Flow Steps -->
  ${generateFlowSteps(5, colors)}

  <!-- Branding -->
  <text x="1150" y="650" font-family="Arial, sans-serif" font-size="14" fill="white" opacity="0.5" text-anchor="end">Nodo360</text>
</svg>`;
}

function generateChartSVG(image, colors) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="675" viewBox="0 0 1200 675" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="chartGrad" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:0.1" />
      <stop offset="100%" style="stop-color:${colors.primary};stop-opacity:0.5" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="675" fill="url(#bgGrad)"/>

  <!-- Title -->
  <text x="600" y="50" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="white" text-anchor="middle">${escapeXml(image.title)}</text>

  <!-- Chart Area -->
  <rect x="100" y="100" width="1000" height="450" rx="10" fill="white" opacity="0.03"/>

  <!-- Grid Lines -->
  <g stroke="white" stroke-opacity="0.1" stroke-width="1">
    <line x1="100" y1="200" x2="1100" y2="200"/>
    <line x1="100" y1="300" x2="1100" y2="300"/>
    <line x1="100" y1="400" x2="1100" y2="400"/>
    <line x1="100" y1="500" x2="1100" y2="500"/>
  </g>

  <!-- Chart Line -->
  <path d="M 150,480 Q 300,450 450,400 T 750,250 T 1050,150" fill="none" stroke="${colors.primary}" stroke-width="4"/>
  <path d="M 150,480 Q 300,450 450,400 T 750,250 T 1050,150 L 1050,550 L 150,550 Z" fill="url(#chartGrad)"/>

  <!-- Data Points -->
  <circle cx="150" cy="480" r="8" fill="${colors.light}"/>
  <circle cx="450" cy="400" r="8" fill="${colors.light}"/>
  <circle cx="750" cy="250" r="8" fill="${colors.light}"/>
  <circle cx="1050" cy="150" r="8" fill="${colors.light}"/>

  <!-- Labels -->
  <text x="150" y="580" font-family="Arial, sans-serif" font-size="14" fill="white" opacity="0.7" text-anchor="middle">2012</text>
  <text x="450" y="580" font-family="Arial, sans-serif" font-size="14" fill="white" opacity="0.7" text-anchor="middle">2016</text>
  <text x="750" y="580" font-family="Arial, sans-serif" font-size="14" fill="white" opacity="0.7" text-anchor="middle">2020</text>
  <text x="1050" y="580" font-family="Arial, sans-serif" font-size="14" fill="white" opacity="0.7" text-anchor="middle">2024</text>

  <!-- Branding -->
  <text x="1150" y="650" font-family="Arial, sans-serif" font-size="14" fill="white" opacity="0.5" text-anchor="end">Nodo360</text>
</svg>`;
}

function generateStepsSVG(image, colors) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="675" viewBox="0 0 1200 675" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="675" fill="url(#bgGrad)"/>

  <!-- Title -->
  <text x="600" y="50" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="white" text-anchor="middle">${escapeXml(image.title)}</text>

  <!-- Steps -->
  ${generateStepsBoxes(5, colors)}

  <!-- Branding -->
  <text x="1150" y="650" font-family="Arial, sans-serif" font-size="14" fill="white" opacity="0.5" text-anchor="end">Nodo360</text>
</svg>`;
}

function generateIconsSVG(image, colors) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="675" viewBox="0 0 1200 675" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="675" fill="url(#bgGrad)"/>

  <!-- Title -->
  <text x="600" y="50" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="white" text-anchor="middle">${escapeXml(image.title)}</text>

  <!-- Icon Grid (2x3) -->
  ${generateIconGrid(6, colors)}

  <!-- Branding -->
  <text x="1150" y="650" font-family="Arial, sans-serif" font-size="14" fill="white" opacity="0.5" text-anchor="end">Nodo360</text>
</svg>`;
}

function generatePyramidSVG(image, colors) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="675" viewBox="0 0 1200 675" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="675" fill="url(#bgGrad)"/>

  <!-- Title -->
  <text x="600" y="50" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="white" text-anchor="middle">${escapeXml(image.title)}</text>

  <!-- Pyramid Layers -->
  <g transform="translate(200, 100)">
    <!-- Level 4 (Top) -->
    <polygon points="400,0 500,100 300,100" fill="${colors.primary}" opacity="0.9"/>
    <text x="400" y="70" font-family="Arial, sans-serif" font-size="14" fill="white" text-anchor="middle">Nodo Propio</text>

    <!-- Level 3 -->
    <polygon points="300,100 500,100 550,180 250,180" fill="${colors.primary}" opacity="0.7"/>
    <text x="400" y="150" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle">Hardware Wallet</text>

    <!-- Level 2 -->
    <polygon points="250,180 550,180 620,280 180,280" fill="${colors.primary}" opacity="0.5"/>
    <text x="400" y="240" font-family="Arial, sans-serif" font-size="18" fill="white" text-anchor="middle">Software Wallet</text>

    <!-- Level 1 (Base) -->
    <polygon points="180,280 620,280 700,400 100,400" fill="${colors.primary}" opacity="0.3"/>
    <text x="400" y="350" font-family="Arial, sans-serif" font-size="20" fill="white" text-anchor="middle">Exchange Custodial</text>
  </g>

  <!-- Arrow and label -->
  <g transform="translate(900, 200)">
    <line x1="0" y1="200" x2="0" y2="0" stroke="${colors.light}" stroke-width="3" marker-end="url(#arrowhead)"/>
    <text x="20" y="100" font-family="Arial, sans-serif" font-size="16" fill="${colors.light}">Mayor</text>
    <text x="20" y="120" font-family="Arial, sans-serif" font-size="16" fill="${colors.light}">Soberanía</text>
  </g>

  <!-- Branding -->
  <text x="1150" y="650" font-family="Arial, sans-serif" font-size="14" fill="white" opacity="0.5" text-anchor="end">Nodo360</text>
</svg>`;
}

function generateTableSVG(image, colors) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="675" viewBox="0 0 1200 675" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="675" fill="url(#bgGrad)"/>

  <!-- Title -->
  <text x="600" y="50" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="white" text-anchor="middle">${escapeXml(image.title)}</text>

  <!-- Table -->
  <g transform="translate(100, 90)">
    <!-- Header Row -->
    <rect x="0" y="0" width="1000" height="60" fill="${colors.primary}" opacity="0.3"/>
    <text x="200" y="40" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">Característica</text>
    <text x="500" y="40" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">Opción A</text>
    <text x="800" y="40" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">Opción B</text>

    <!-- Data Rows -->
    ${generateTableRows(5, colors)}
  </g>

  <!-- Branding -->
  <text x="1150" y="650" font-family="Arial, sans-serif" font-size="14" fill="white" opacity="0.5" text-anchor="end">Nodo360</text>
</svg>`;
}

function generateTimelineSVG(image, colors) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="675" viewBox="0 0 1200 675" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="675" fill="url(#bgGrad)"/>

  <!-- Title -->
  <text x="600" y="50" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="white" text-anchor="middle">${escapeXml(image.title)}</text>

  <!-- Timeline Line -->
  <line x1="100" y1="340" x2="1100" y2="340" stroke="${colors.primary}" stroke-width="4"/>

  <!-- Timeline Points -->
  ${generateTimelinePoints(4, colors)}

  <!-- Branding -->
  <text x="1150" y="650" font-family="Arial, sans-serif" font-size="14" fill="white" opacity="0.5" text-anchor="end">Nodo360</text>
</svg>`;
}

function generateGenericSVG(image, colors) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="675" viewBox="0 0 1200 675" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="675" fill="url(#bgGrad)"/>

  <!-- Decorative circles -->
  <circle cx="200" cy="200" r="150" fill="${colors.primary}" opacity="0.1"/>
  <circle cx="1000" cy="500" r="200" fill="${colors.secondary}" opacity="0.1"/>

  <!-- Title -->
  <text x="600" y="280" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="white" text-anchor="middle">${escapeXml(image.title)}</text>

  <!-- Subtitle -->
  <text x="600" y="340" font-family="Arial, sans-serif" font-size="20" fill="white" opacity="0.7" text-anchor="middle">Infografía educativa</text>

  <!-- Central Icon -->
  <circle cx="600" cy="450" r="60" fill="${colors.primary}" opacity="0.3" stroke="${colors.light}" stroke-width="3"/>
  <text x="600" y="465" font-family="Arial, sans-serif" font-size="40" fill="${colors.light}" text-anchor="middle">📊</text>

  <!-- Branding -->
  <rect x="500" y="560" width="200" height="40" rx="8" fill="white" opacity="0.1"/>
  <text x="600" y="588" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">Nodo360</text>
</svg>`;
}

// Helper functions
function generateListItems(count, bulletColor, textColor) {
  let items = '';
  for (let i = 0; i < count; i++) {
    items += `
    <g transform="translate(0, ${i * 80})">
      <circle cx="15" cy="15" r="8" fill="${bulletColor}"/>
      <rect x="40" y="5" width="300" height="20" rx="3" fill="${textColor}" opacity="0.3"/>
      <rect x="40" y="35" width="250" height="15" rx="3" fill="${textColor}" opacity="0.15"/>
    </g>`;
  }
  return items;
}

function generateFlowSteps(count, colors) {
  let steps = '';
  const startX = 100;
  const stepWidth = 180;
  const gap = 40;

  for (let i = 0; i < count; i++) {
    const x = startX + i * (stepWidth + gap);
    const y = 200 + (i % 2) * 150; // Alternate heights

    steps += `
    <g transform="translate(${x}, ${y})">
      <rect x="0" y="0" width="${stepWidth}" height="120" rx="15" fill="${colors.primary}" opacity="${0.3 + i * 0.15}"/>
      <circle cx="90" cy="-20" r="25" fill="${colors.primary}"/>
      <text x="90" y="-12" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white" text-anchor="middle">${i + 1}</text>
      <text x="90" y="50" font-family="Arial, sans-serif" font-size="14" fill="white" text-anchor="middle">Paso ${i + 1}</text>
      <rect x="20" y="70" width="140" height="10" rx="3" fill="white" opacity="0.3"/>
      <rect x="30" y="90" width="120" height="8" rx="3" fill="white" opacity="0.2"/>
    </g>`;

    // Arrow between steps
    if (i < count - 1) {
      steps += `
      <line x1="${x + stepWidth + 5}" y1="${y + 60}" x2="${x + stepWidth + gap - 5}" y2="${200 + ((i + 1) % 2) * 150 + 60}"
            stroke="${colors.light}" stroke-width="2" marker-end="url(#arrowhead)"/>`;
    }
  }
  return steps;
}

function generateStepsBoxes(count, colors) {
  let boxes = '';
  const boxWidth = 200;
  const gap = 20;
  const startX = (1200 - (count * boxWidth + (count - 1) * gap)) / 2;

  for (let i = 0; i < count; i++) {
    const x = startX + i * (boxWidth + gap);
    boxes += `
    <g transform="translate(${x}, 100)">
      <rect x="0" y="0" width="${boxWidth}" height="450" rx="15" fill="${colors.primary}" opacity="${0.15 + i * 0.05}" stroke="${colors.primary}" stroke-width="2"/>
      <circle cx="100" cy="50" r="30" fill="${colors.primary}"/>
      <text x="100" y="58" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">${i + 1}</text>
      <text x="100" y="120" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="${colors.light}" text-anchor="middle">Paso ${i + 1}</text>
      <rect x="20" y="160" width="160" height="12" rx="3" fill="white" opacity="0.4"/>
      <rect x="30" y="190" width="140" height="10" rx="3" fill="white" opacity="0.2"/>
      <rect x="30" y="210" width="130" height="10" rx="3" fill="white" opacity="0.2"/>
    </g>`;
  }
  return boxes;
}

function generateIconGrid(count, colors) {
  let grid = '';
  const cols = 3;
  const iconSize = 300;
  const gapX = 50;
  const gapY = 30;
  const startX = (1200 - (cols * iconSize + (cols - 1) * gapX)) / 2;
  const startY = 100;

  const icons = ['💰', '🔗', '🎮', '🎨', '🏦', '🔐'];
  const labels = ['Finanzas', 'Supply Chain', 'Gaming', 'Arte', 'Banca', 'Identidad'];

  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (iconSize + gapX);
    const y = startY + row * (iconSize - 30 + gapY);

    grid += `
    <g transform="translate(${x}, ${y})">
      <rect x="0" y="0" width="${iconSize}" height="${iconSize - 50}" rx="15" fill="${colors.primary}" opacity="0.15" stroke="${colors.primary}" stroke-width="2"/>
      <text x="${iconSize/2}" y="${(iconSize-50)/2 - 10}" font-size="60" text-anchor="middle">${icons[i] || '📊'}</text>
      <text x="${iconSize/2}" y="${iconSize - 80}" font-family="Arial, sans-serif" font-size="18" fill="white" text-anchor="middle">${labels[i] || 'Categoría'}</text>
    </g>`;
  }
  return grid;
}

function generateTableRows(count, colors) {
  let rows = '';
  for (let i = 0; i < count; i++) {
    const y = 60 + i * 80;
    const bgOpacity = i % 2 === 0 ? '0.05' : '0.02';
    rows += `
    <rect x="0" y="${y}" width="1000" height="80" fill="white" opacity="${bgOpacity}"/>
    <line x1="0" y1="${y + 80}" x2="1000" y2="${y + 80}" stroke="white" stroke-opacity="0.1"/>
    <rect x="50" y="${y + 30}" width="300" height="20" rx="3" fill="white" opacity="0.3"/>
    <circle cx="500" cy="${y + 40}" r="12" fill="${colors.primary}" opacity="0.8"/>
    <circle cx="800" cy="${y + 40}" r="12" fill="${colors.secondary}" opacity="0.6"/>`;
  }
  return rows;
}

function generateTimelinePoints(count, colors) {
  let points = '';
  const startX = 150;
  const gap = 300;
  const years = ['2012', '2016', '2020', '2024'];

  for (let i = 0; i < count; i++) {
    const x = startX + i * gap;
    const isTop = i % 2 === 0;
    const contentY = isTop ? 150 : 430;

    points += `
    <g>
      <!-- Point -->
      <circle cx="${x}" cy="340" r="20" fill="${colors.primary}"/>
      <circle cx="${x}" cy="340" r="12" fill="${colors.light}"/>

      <!-- Connector -->
      <line x1="${x}" y1="${isTop ? 320 : 360}" x2="${x}" y2="${isTop ? 250 : 410}" stroke="${colors.primary}" stroke-width="2"/>

      <!-- Content Box -->
      <rect x="${x - 100}" y="${contentY}" width="200" height="80" rx="10" fill="${colors.primary}" opacity="0.2"/>
      <text x="${x}" y="${contentY + 35}" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="${colors.light}" text-anchor="middle">${years[i]}</text>
      <text x="${x}" y="${contentY + 60}" font-family="Arial, sans-serif" font-size="14" fill="white" opacity="0.8" text-anchor="middle">Halving #${i + 1}</text>
    </g>`;
  }
  return points;
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Generate SVG based on type
function generateSVG(image) {
  const colors = categoryColors[image.category];

  switch (image.type) {
    case 'comparison':
      return generateComparisonSVG(image, colors);
    case 'flow':
    case 'transaction-flow':
    case 'process':
      return generateFlowSVG(image, colors);
    case 'chart':
      return generateChartSVG(image, colors);
    case 'steps':
      return generateStepsSVG(image, colors);
    case 'icons':
    case 'ecosystem':
    case 'risks':
    case 'threats':
      return generateIconsSVG(image, colors);
    case 'pyramid':
    case 'layers':
    case 'scale':
      return generatePyramidSVG(image, colors);
    case 'table':
    case 'matrix':
      return generateTableSVG(image, colors);
    case 'timeline':
      return generateTimelineSVG(image, colors);
    case 'chain':
    case 'network':
    case 'structure':
    case 'diagram':
    case 'formula':
    case 'checklist':
    case 'problem':
    case 'types':
    default:
      return generateGenericSVG(image, colors);
  }
}

// Main execution
const outputDir = path.join(__dirname, '..', 'public', 'blog', 'inline');

// Create directory if not exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Generando imágenes SVG inline para el blog...\n');

inlineImages.forEach((image) => {
  const svg = generateSVG(image);
  const filePath = path.join(outputDir, image.filename);
  fs.writeFileSync(filePath, svg);
  console.log(`✓ ${image.filename}`);
});

console.log(`\n¡Listo! Se generaron ${inlineImages.length} imágenes en ${outputDir}`);
