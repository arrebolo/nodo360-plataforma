import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { getPublicProjects, createProject } from '@/lib/projects'
import { checkProjectEligibility } from '@/lib/projects/eligibility'
import type { ProjectCategory, ProjectFilters } from '@/types/projects'

/**
 * GET /api/projects
 * Lista proyectos públicos (approved, in_progress, completed)
 */
export async function GET(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { searchParams } = new URL(request.url)
    const filters: ProjectFilters = {
      category: searchParams.get('category') as ProjectCategory | undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '12'),
    }

    // Only allow specific status for public view
    const statusParam = searchParams.get('status')
    if (statusParam && ['approved', 'in_progress', 'completed'].includes(statusParam)) {
      filters.status = statusParam as any
    }

    const { projects, total } = await getPublicProjects(filters)

    return NextResponse.json({
      success: true,
      data: projects,
      total,
      page: filters.page,
      limit: filters.limit,
    })
  } catch (error) {
    console.error('[GET /api/projects] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects
 * Crear un nuevo proyecto (requiere elegibilidad)
 */
export async function POST(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request, 'api')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Check eligibility
    const eligibility = await checkProjectEligibility(user.id)
    if (!eligibility.eligible) {
      let message = 'No eres elegible para crear proyectos.'
      if (eligibility.reason === 'not_premium') {
        message = 'Necesitas acceso premium para crear proyectos.'
      } else if (eligibility.reason === 'courses_incomplete') {
        message = `Necesitas completar todos los cursos para principiantes. Progreso: ${eligibility.completedCourses}/${eligibility.requiredCourses}`
      } else if (eligibility.reason === 'suspended') {
        message = 'Tu cuenta está suspendida.'
      }
      return NextResponse.json({ error: message }, { status: 403 })
    }

    const body = await request.json()
    const { title, summary, description, category } = body

    // Validate input
    if (!title?.trim() || title.length < 5) {
      return NextResponse.json(
        { error: 'El título debe tener al menos 5 caracteres' },
        { status: 400 }
      )
    }
    if (!summary?.trim() || summary.length < 20 || summary.length > 300) {
      return NextResponse.json(
        { error: 'El resumen debe tener entre 20 y 300 caracteres' },
        { status: 400 }
      )
    }
    if (!description?.trim() || description.length < 100) {
      return NextResponse.json(
        { error: 'La descripción debe tener al menos 100 caracteres' },
        { status: 400 }
      )
    }
    if (!category || !['bitcoin', 'lightning', 'defi', 'education', 'tools', 'general'].includes(category)) {
      return NextResponse.json(
        { error: 'Categoría inválida' },
        { status: 400 }
      )
    }

    const result = await createProject(user.id, {
      title,
      summary,
      description,
      category,
    })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('[POST /api/projects] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
