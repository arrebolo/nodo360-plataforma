import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireInstructorLike } from '@/lib/auth/requireInstructor'
import { ArrowLeft, Link2 } from 'lucide-react'
import CreateReferralLinkForm from '@/components/instructor/CreateReferralLinkForm'

export const metadata = {
  title: 'Crear Enlace de Referido | Instructor Nodo360',
  description: 'Crea un nuevo enlace promocional para tus cursos',
}

export default async function NuevoReferidoPage() {
  const { userId, role } = await requireInstructorLike()
  const supabase = await createClient()

  // Obtener cursos del instructor (publicados)
  let query = supabase
    .from('courses')
    .select('id, title, slug')
    .eq('status', 'published')
    .order('title', { ascending: true })

  // Si no es admin, filtrar por instructor
  if (role !== 'admin') {
    query = query.eq('instructor_id', userId)
  }

  const { data: courses } = await query

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/instructor/referidos"
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a enlaces
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Link2 className="w-7 h-7 text-[#f7931a]" />
          Crear Enlace de Referido
        </h1>
        <p className="text-white/60 mt-1">
          Genera un enlace único para compartir y trackear conversiones
        </p>
      </div>

      {/* Formulario */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <CreateReferralLinkForm courses={courses || []} />
      </div>

      {/* Ayuda */}
      <div className="text-sm text-white/50 space-y-2">
        <p>
          <strong className="text-white/70">Nota:</strong> Los enlaces de referido
          rastrean automáticamente clics y conversiones. Recibirás el 30% de comisión
          por cada venta atribuida a tu enlace durante los 7 días siguientes al clic.
        </p>
        <p>
          Puedes crear enlaces específicos para cada curso o enlaces generales que
          lleven a tu página de instructor con todos tus cursos.
        </p>
      </div>
    </div>
  )
}
