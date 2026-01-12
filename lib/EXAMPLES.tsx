/**
 * EJEMPLO DE IMPLEMENTACIÓN
 * Página de Cursos usando Supabase
 * 
 * Ruta sugerida: app/cursos/page.tsx
 */

import { getCourses } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

export default async function CoursesPage() {
  // Obtener todos los cursos desde Supabase
  const courses = await getCourses();

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Cursos Disponibles</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Link 
            key={course.id} 
            href={`/cursos/${course.slug}`}
            className="block group"
          >
            <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              {/* Thumbnail del curso */}
              {course.thumbnail_url && (
                <div className="relative h-48 bg-white/15">
                  <Image
                    src={course.thumbnail_url}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              
              {/* Contenido */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold group-hover:text-orange-500 transition-colors">
                    {course.title}
                  </h2>
                  
                  {/* Badge de gratis/premium */}
                  {course.is_free ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      GRATIS
                    </span>
                  ) : (
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                      PREMIUM
                    </span>
                  )}
                </div>
                
                {/* Descripción */}
                {course.description && (
                  <p className="text-white/40 text-sm line-clamp-3">
                    {course.description}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * EJEMPLO 2: Página individual de curso
 * 
 * Ruta sugerida: app/cursos/[slug]/page.tsx
 */

/*
import { getCourseWithContent } from '@/lib/supabase';
import { notFound } from 'next/navigation';

export default async function CoursePage({ 
  params 
}: { 
  params: { slug: string } 
}) {
  try {
    const course = await getCourseWithContent(params.slug);
    
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
        <p className="text-white/40 mb-8">{course.description}</p>
        
        {/* Módulos *\/}
        <div className="space-y-6">
          {course.modules.map((module) => (
            <div key={module.id} className="border rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">{module.title}</h2>
              
              {/* Lecciones *\/}
              <ul className="space-y-2">
                {module.lessons.map((lesson) => (
                  <li key={lesson.id}>
                    <a 
                      href={`/cursos/${course.slug}/${module.slug}/${lesson.slug}`}
                      className="text-blue-600 hover:underline"
                    >
                      {lesson.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}
*/

/**
 * EJEMPLO 3: Client Component con progreso de usuario
 * 
 * Componente: components/LessonProgress.tsx
 */

/*
'use client';

import { useState, useEffect } from 'react';
import { markLessonCompleted, getUserProgressByCourse } from '@/lib/supabase';

export default function LessonProgress({ 
  userId, 
  courseId, 
  lessonId 
}: { 
  userId: string;
  courseId: string;
  lessonId: string;
}) {
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    try {
      await markLessonCompleted(userId, lessonId);
      setCompleted(true);
    } catch (error) {
      console.error('Error al marcar como completada:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleComplete}
      disabled={completed || loading}
      className={`px-4 py-2 rounded ${
        completed 
          ? 'bg-green-500 text-white' 
          : 'bg-orange-500 text-white hover:bg-orange-600'
      }`}
    >
      {completed ? '✓ Completada' : 'Marcar como completada'}
    </button>
  );
}
*/

/**
 * EJEMPLO 4: API Route para crear un curso
 * 
 * Ruta: app/api/courses/route.ts
 */

/*
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('courses')
      .insert({
        title: body.title,
        slug: body.slug,
        description: body.description,
        is_free: body.is_free,
        order_index: body.order_index,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al crear curso' },
      { status: 500 }
    );
  }
}
*/


