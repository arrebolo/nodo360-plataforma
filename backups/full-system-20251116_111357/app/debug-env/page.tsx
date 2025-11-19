'use client'

export default function DebugEnv() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">🔍 Environment Variables Debug</h1>

      <div className="space-y-6">
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="font-bold mb-2">NEXT_PUBLIC_SUPABASE_URL:</h2>
          <code className="text-green-400">
            {process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ UNDEFINED'}
          </code>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h2 className="font-bold mb-2">NEXT_PUBLIC_SUPABASE_ANON_KEY:</h2>
          <code className="text-green-400">
            {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
              ? `✅ Definida (primeros 30 chars): ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 30)}...`
              : '❌ UNDEFINED'}
          </code>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h2 className="font-bold mb-2">NODE_ENV:</h2>
          <code className="text-green-400">
            {process.env.NODE_ENV || '❌ UNDEFINED'}
          </code>
        </div>

        <div className="bg-blue-900/50 p-4 rounded mt-8">
          <h2 className="font-bold mb-2">ℹ️ Información:</h2>
          <ul className="text-sm space-y-1 text-blue-200">
            <li>• Las variables NEXT_PUBLIC_* son accesibles en el cliente</li>
            <li>• Si ves UNDEFINED, las variables no están configuradas en Vercel</li>
            <li>• En local, deben estar en .env.local</li>
            <li>• En Vercel, deben estar en Settings → Environment Variables</li>
          </ul>
        </div>

        <div className="bg-yellow-900/50 p-4 rounded">
          <h2 className="font-bold mb-2">⚠️ Seguridad:</h2>
          <p className="text-sm text-yellow-200">
            Solo mostramos los primeros 30 caracteres de la ANON_KEY por seguridad.
            Nunca expongas las claves completas en producción.
          </p>
        </div>

        <div className="mt-8">
          <h2 className="font-bold mb-4">📋 Checklist:</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌'}>
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌'}
              </span>
              <span>NEXT_PUBLIC_SUPABASE_URL configurada</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌'}>
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌'}
              </span>
              <span>NEXT_PUBLIC_SUPABASE_ANON_KEY configurada</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
