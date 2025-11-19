'use client'

import { motion } from 'framer-motion'

export default function CertificatesNFT() {
  // Mock data - implementar con datos reales después
  const hasCertificates = false

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
    >
      <h3 className="text-xl font-bold mb-4">💎 Tus Certificados NFT</h3>

      {hasCertificates ? (
        <div className="aspect-video bg-gradient-to-br from-[#ff6b35]/20 to-[#f7931a]/20 rounded-xl flex items-center justify-center border-2 border-[#f7931a]">
          <div className="text-center">
            <div className="text-6xl mb-4">🎓</div>
            <p className="font-bold">Certificado</p>
            <p className="text-sm text-white/60">Bitcoin desde Cero</p>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4 opacity-40">🔒</div>
          <p className="text-white/60 mb-4">Completa un curso para obtener tu primer certificado NFT</p>
        </div>
      )}
    </motion.div>
  )
}
