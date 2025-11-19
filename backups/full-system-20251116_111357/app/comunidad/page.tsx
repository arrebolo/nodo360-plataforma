'use client'

import { BenefitsGrid } from '@/components/benefits/BenefitsGrid'
import { COMUNIDAD_BENEFITS } from '@/lib/constants/comunidad-benefits'
import { AppLayout } from '@/components/layout/AppLayout'
import { MessageCircle, Send } from 'lucide-react'

export default function ComunidadPage() {
  return (
    <AppLayout>
      <BenefitsGrid
        title="Únete a la Comunidad"
        subtitle="Aprende y crece junto a miles de estudiantes"
        benefits={COMUNIDAD_BENEFITS}
      />

      {/* CTA Section */}
      <section className="py-24 bg-nodo-bg">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            ¿Listo para unirte?
          </h2>
          <p className="text-xl text-slate-400 mb-12">
            Accede a nuestra comunidad en Discord y Telegram
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a
              href="https://discord.gg/nodo360"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-lg rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#5865F2]/50"
            >
              <MessageCircle className="w-6 h-6" />
              <span>Únete a Discord</span>
            </a>

            <a
              href="https://t.me/nodo360"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#0088cc] hover:bg-[#006699] text-white font-bold text-lg rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#0088cc]/50"
            >
              <Send className="w-6 h-6" />
              <span>Únete a Telegram</span>
            </a>
          </div>
        </div>
      </section>
    </AppLayout>
  )
}
