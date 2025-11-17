import { AppLayout } from '@/components/layout/AppLayout'
import { BenefitsGrid } from '@/components/benefits/BenefitsGrid'
import { MENTORIA_BENEFITS } from '@/lib/constants/mentoria-benefits'
import { MentorshipForm } from '@/components/forms/MentorshipForm'

export default function MentoriaPage() {
  return (
    <AppLayout>
      {/* Hero + Benefits Grid */}
      <BenefitsGrid
        title="Mentoría 1-on-1"
        subtitle="Acelera tu carrera en Bitcoin y Blockchain con expertos que te guiarán paso a paso"
        benefits={MENTORIA_BENEFITS}
      />

      {/* Formulario de Solicitud */}
      <MentorshipForm />
    </AppLayout>
  )
}
