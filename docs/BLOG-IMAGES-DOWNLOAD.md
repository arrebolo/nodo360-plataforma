# Blog Images - Unsplash Sources

Este documento contiene las URLs de Unsplash recomendadas para descargar imágenes de alta calidad para los artículos del blog de Nodo360.

## Instrucciones

1. Visita cada URL de Unsplash
2. Descarga la imagen en alta resolución
3. Redimensiona a 1200x630px
4. Convierte a WebP para mejor rendimiento
5. Guarda en `public/blog/[slug].webp`

> **Nota**: Actualmente usamos imágenes SVG placeholder generadas automáticamente. Estas URLs son para cuando se quieran usar fotografías reales.

## Imágenes por Artículo

| Artículo | Búsqueda en Unsplash | URL Sugerida |
|----------|---------------------|--------------|
| que-es-bitcoin-guia-completa | "bitcoin cryptocurrency gold" | https://unsplash.com/s/photos/bitcoin |
| como-comprar-bitcoin-espana | "buy bitcoin smartphone" | https://unsplash.com/s/photos/cryptocurrency-phone |
| que-es-blockchain-explicado | "blockchain network technology" | https://unsplash.com/s/photos/blockchain |
| soberania-financiera-bitcoin | "financial freedom keys" | https://unsplash.com/s/photos/financial-freedom |
| defi-para-principiantes | "defi finance interface" | https://unsplash.com/s/photos/decentralized-finance |
| que-es-ethereum-guia-completa | "ethereum cryptocurrency" | https://unsplash.com/s/photos/ethereum |
| que-es-wallet-crypto-tipos | "digital wallet security hardware" | https://unsplash.com/s/photos/hardware-wallet |
| que-es-mineria-bitcoin | "bitcoin mining hardware datacenter" | https://unsplash.com/s/photos/bitcoin-mining |
| nfts-que-son-para-que-sirven | "digital art nft" | https://unsplash.com/s/photos/nft-art |
| staking-criptomonedas-guia | "cryptocurrency passive income staking" | https://unsplash.com/s/photos/cryptocurrency-staking |
| seguridad-crypto-proteger-criptomonedas | "cybersecurity protection shield" | https://unsplash.com/s/photos/cybersecurity |
| bitcoin-vs-oro-comparativa | "bitcoin gold comparison" | https://unsplash.com/s/photos/bitcoin-gold |
| layer-2-blockchain-escalabilidad | "network layers technology" | https://unsplash.com/s/photos/network-layers |
| dao-organizaciones-descentralizadas | "decentralized network organization" | https://unsplash.com/s/photos/decentralized-network |
| halving-bitcoin-que-es-cuando | "bitcoin halving split" | https://unsplash.com/s/photos/bitcoin-halving |

## Especificaciones Técnicas

- **Dimensiones**: 1200 x 630 px (ratio 1.9:1 para Open Graph)
- **Formato final**: WebP (con fallback PNG)
- **Calidad WebP**: 80-85%
- **Tamaño máximo**: 100KB idealmente

## Script de Optimización

```bash
# Usando sharp-cli para optimizar imágenes
# Instalar: npm install -g sharp-cli

# Redimensionar y convertir a WebP
sharp -i input.jpg -o output.webp resize 1200 630 --fit cover --withoutEnlargement
```

## Alternativas a Unsplash

Si no encuentras la imagen perfecta en Unsplash:

- [Pexels](https://www.pexels.com/) - Fotos gratuitas
- [Pixabay](https://pixabay.com/) - Imágenes sin royalties
- [Freepik](https://www.freepik.com/) - Vectores y fotos (atribución requerida en plan gratuito)

## Atribución

Las imágenes de Unsplash no requieren atribución, pero es una buena práctica dar crédito al fotógrafo cuando sea posible.

## Estado Actual

- [x] SVG placeholders generados para todos los artículos
- [ ] Imágenes reales de Unsplash descargadas
- [ ] Imágenes optimizadas a WebP
- [ ] Actualizar rutas en blog-data.ts de .svg a .webp
