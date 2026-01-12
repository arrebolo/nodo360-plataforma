import { BenefitsGrid } from '@/components/benefits/BenefitsGrid'
import { MENTORIA_BENEFITS } from '@/lib/constants/mentoria-benefits'
import { MentorshipForm } from '@/components/forms/MentorshipForm'
import { Footer } from '@/components/navigation/Footer'

export default function MentoriaPage() {
  return (
    <div className="min-h-screen bg-dark">
      {/* Hero + Benefits Grid */}
      <BenefitsGrid
        title="Mentoría 1-on-1"
        subtitle="Acelera tu carrera en Bitcoin y Blockchain con expertos que te guiarán paso a paso"
        benefits={MENTORIA_BENEFITS}
      />

      {/* Formulario de Solicitud */}
      <MentorshipForm />

      <Footer />
    </div>
  )
}
