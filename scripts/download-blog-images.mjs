import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import https from 'https'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Hero images configuration (1200x630 for Open Graph)
const heroImages = [
  {
    slug: 'que-es-bitcoin-guia-completa',
    url: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=1200&h=630&fit=crop&q=80',
    alt: 'Bitcoin dorado sobre fondo oscuro'
  },
  {
    slug: 'como-comprar-bitcoin-espana',
    url: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=1200&h=630&fit=crop&q=80',
    alt: 'Persona comprando Bitcoin en smartphone'
  },
  {
    slug: 'que-es-blockchain-explicado',
    url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=630&fit=crop&q=80',
    alt: 'Red de blockchain abstracta'
  },
  {
    slug: 'soberania-financiera-bitcoin',
    url: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=1200&h=630&fit=crop&q=80',
    alt: 'Bitcoin representando libertad financiera'
  },
  {
    slug: 'defi-para-principiantes',
    url: 'https://images.unsplash.com/photo-1642104704074-907c0698b98d?w=1200&h=630&fit=crop&q=80',
    alt: 'Concepto de finanzas descentralizadas'
  },
  {
    slug: 'que-es-ethereum-guia-completa',
    url: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=1200&h=630&fit=crop&q=80',
    alt: 'Logo de Ethereum en fondo tecnológico'
  },
  {
    slug: 'que-es-wallet-crypto-tipos',
    url: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&h=630&fit=crop&q=80',
    alt: 'Wallet hardware de criptomonedas'
  },
  {
    slug: 'que-es-mineria-bitcoin',
    url: 'https://images.unsplash.com/photo-1516245834210-c4c142787335?w=1200&h=630&fit=crop&q=80',
    alt: 'Equipos de minería de Bitcoin'
  },
  {
    slug: 'nfts-que-son-para-que-sirven',
    url: 'https://images.unsplash.com/photo-1646463910513-69996e789e0e?w=1200&h=630&fit=crop&q=80',
    alt: 'Arte digital NFT colorido'
  },
  {
    slug: 'staking-criptomonedas-guia',
    url: 'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=1200&h=630&fit=crop&q=80',
    alt: 'Concepto de staking y rendimientos'
  },
  {
    slug: 'seguridad-crypto-proteger-criptomonedas',
    url: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=1200&h=630&fit=crop&q=80',
    alt: 'Candado digital de seguridad crypto'
  },
  {
    slug: 'bitcoin-vs-oro-comparativa',
    url: 'https://images.unsplash.com/photo-1624996379697-f01d168b1a52?w=1200&h=630&fit=crop&q=80',
    alt: 'Bitcoin y oro comparados'
  },
  {
    slug: 'layer-2-blockchain-escalabilidad',
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=630&fit=crop&q=80',
    alt: 'Red tecnológica de capas'
  },
  {
    slug: 'dao-organizaciones-descentralizadas',
    url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=630&fit=crop&q=80',
    alt: 'Grupo colaborando de forma descentralizada'
  },
  {
    slug: 'halving-bitcoin-que-es-cuando',
    url: 'https://images.unsplash.com/photo-1643101809204-6fb869816dbe?w=1200&h=630&fit=crop&q=80',
    alt: 'Bitcoin halving representación visual'
  },
]

// Function to download image from URL
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        downloadImage(response.headers.location).then(resolve).catch(reject)
        return
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`))
        return
      }

      const chunks = []
      response.on('data', chunk => chunks.push(chunk))
      response.on('end', () => resolve(Buffer.concat(chunks)))
      response.on('error', reject)
    })

    request.on('error', reject)
    request.setTimeout(30000, () => {
      request.destroy()
      reject(new Error('Request timeout'))
    })
  })
}

// Process and save image
async function processImage(imageBuffer, outputPath, width, height) {
  await sharp(imageBuffer)
    .resize(width, height, {
      fit: 'cover',
      position: 'center'
    })
    .webp({ quality: 80 })
    .toFile(outputPath)
}

// Main function
async function main() {
  const outputDir = path.join(__dirname, '../public/blog')

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  console.log('Downloading blog hero images from Unsplash...\n')

  let downloaded = 0
  let errors = 0

  for (const image of heroImages) {
    const outputPath = path.join(outputDir, `${image.slug}.webp`)

    try {
      console.log(`Downloading: ${image.slug}...`)

      // Download image
      const imageBuffer = await downloadImage(image.url)

      // Process and save as WebP
      await processImage(imageBuffer, outputPath, 1200, 630)

      // Get file size
      const stats = fs.statSync(outputPath)
      const sizeKB = Math.round(stats.size / 1024)

      console.log(`  ✓ Saved: ${image.slug}.webp (${sizeKB}KB)`)
      downloaded++
    } catch (error) {
      console.error(`  ✗ Error: ${image.slug} - ${error.message}`)
      errors++
    }

    // Small delay between requests to be nice to Unsplash
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log(`\n✅ Downloaded: ${downloaded} images`)
  if (errors > 0) {
    console.log(`❌ Errors: ${errors}`)
  }
  console.log(`📁 Output: ${outputDir}`)
}

main().catch(console.error)
