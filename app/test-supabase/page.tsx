'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function TestSupabase() {
  const [status, setStatus] = useState('Probando conexión...')
  const [courses, setCourses] = useState<any[]>([])
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    async function testConnection() {
      try {
        // Crear cliente directamente con las env vars
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        setStatus('Conectando a Supabase...')

        // Query simple
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('status', 'published')
          .limit(10)

        if (error) {
          setError(error)
          setStatus('❌ Error en query')
          return
        }

        setCourses(data || [])
        setStatus(`✅ Conexión exitosa - ${data?.length || 0} cursos encontrados`)
      } catch (err: any) {
        setError(err)
        setStatus('❌ Error de conexión')
      }
    }

    testConnection()
  }, [])

  return (
    <div className="min-h-screen bg-dark text-white p-8">
      <h1 className="text-3xl font-bold mb-4">Test Supabase Connection</h1>

      <div className="mb-8">
        <h2 className="text-xl mb-2">Estado:</h2>
        <p className="text-2xl font-bold">{status}</p>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-900/50 rounded">
          <h2 className="text-xl mb-2">Error:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl mb-2">Environment Variables:</h2>
        <p>SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ NO DEFINIDA'}</p>
        <p>SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Definida' : '❌ NO DEFINIDA'}</p>
      </div>

      {courses.length > 0 && (
        <div>
          <h2 className="text-xl mb-2">Cursos encontrados:</h2>
          <div className="space-y-4">
            {courses.map((course) => (
              <div key={course.id} className="p-4 bg-dark-secondary rounded">
                <h3 className="font-bold">{course.title}</h3>
                <p className="text-sm text-white/60">Slug: {course.slug}</p>
                <p className="text-sm text-white/60">Level: {course.level}</p>
                <p className="text-sm text-white/60">Free: {course.is_free ? 'Yes' : 'No'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


