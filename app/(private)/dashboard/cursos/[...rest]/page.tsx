import { redirect } from 'next/navigation'

export default function DashboardCursosCatchAll({
  params,
}: {
  params: { rest?: string[] }
}) {
  const slug = params.rest?.[0]
  if (slug) redirect(`/cursos/${slug}`)
  redirect('/dashboard/cursos')
}
