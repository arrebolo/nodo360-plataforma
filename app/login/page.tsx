import { Suspense } from 'react'
import LoginContent from './LoginContent'

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
