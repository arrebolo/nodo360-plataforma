'use client'

import { useEffect, useState } from 'react'
import Confetti from 'react-confetti'
import { useRouter } from 'next/navigation'

export default function CelebrationOverlay() {
  const [show, setShow] = useState(true)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
  const router = useRouter()

  useEffect(() => {
    // Obtener tamano de ventana para el confeti
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    })

    // Auto-cerrar despues de 9 segundos
    const timer = setTimeout(() => setShow(false), 9000)
    return () => clearTimeout(timer)
  }, [])

  if (!show) return null

  return (
    <>
      {/* Confeti */}
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        numberOfPieces={260}
        recycle={false}
        colors={['#f7931a', '#fbbf24', '#34d399', '#38bdf8', '#a78bfa', '#f472b6']}
      />

      {/* Popup */}
      <div className="fixed inset-0 z-40 flex items-end justify-center md:items-center">
        <div className="mb-6 max-w-sm rounded-2xl border border-amber-400/50 bg-[#050608]/95 px-5 py-4 text-sm text-neutral-100 shadow-[0_20px_40px_rgba(0,0,0,0.7)] backdrop-blur-sm md:mb-0">
          <h2 className="text-base font-semibold text-amber-300">
            ¡Enhorabuena, has completado el curso!
          </h2>
          <p className="mt-2 text-xs text-neutral-300 leading-relaxed">
            Este certificado se ha guardado en tu perfil. Sigue construyendo tu ruta de
            aprendizaje y desbloquea nuevos niveles en Nodo360.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => router.push('/rutas')}
              className="rounded-full bg-amber-500 px-4 py-1.5 text-xs font-semibold text-black hover:bg-amber-400 transition-colors"
            >
              Ver mas cursos
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="rounded-full border border-white/20 px-4 py-1.5 text-xs text-neutral-100 hover:border-amber-400 transition-colors"
            >
              Ir a mi perfil
            </button>
            <button
              onClick={() => setShow(false)}
              className="ml-auto text-[11px] text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
