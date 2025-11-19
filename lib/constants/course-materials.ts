export const EXAMPLE_MATERIALS = [
  {
    title: 'Glosario Bitcoin',
    description: 'Términos y definiciones esenciales del ecosistema Bitcoin',
    type: 'pdf' as const,
    url: '/recursos/glosario-bitcoin.pdf',
    size: '2.5 MB',
    downloadable: true
  },
  {
    title: 'Slides del Curso',
    description: 'Presentaciones utilizadas en las lecciones del curso',
    type: 'pdf' as const,
    url: '/recursos/slides-curso.pdf',
    size: '8.3 MB',
    downloadable: true
  },
  {
    title: 'Código de Ejemplo',
    description: 'Repositorio con ejemplos prácticos y ejercicios',
    type: 'link' as const,
    url: 'https://github.com/nodo360/bitcoin-ejemplos',
    downloadable: false
  },
  {
    title: 'Whitepaper Bitcoin',
    description: 'Paper original de Satoshi Nakamoto (PDF)',
    type: 'pdf' as const,
    url: 'https://bitcoin.org/bitcoin.pdf',
    size: '184 KB',
    downloadable: true
  },
  {
    title: 'Recursos Adicionales',
    description: 'Links útiles, herramientas y lecturas recomendadas',
    type: 'doc' as const,
    url: '/recursos/recursos-adicionales.pdf',
    size: '1.2 MB',
    downloadable: true
  },
  {
    title: 'Bitcoin.org',
    description: 'Sitio oficial de Bitcoin con documentación técnica',
    type: 'link' as const,
    url: 'https://bitcoin.org/es/',
    downloadable: false
  }
]
