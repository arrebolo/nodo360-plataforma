'use client'

import { Settings, Bell, Shield, Palette } from 'lucide-react'

export default function ConfiguracionPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Configuración</h1>
      <p className="text-white/60 mb-8">Personaliza tu experiencia en Nodo360.</p>

      <div className="space-y-4">
        {/* Notificaciones */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5 text-[#ff6b35]" />
            <h3 className="text-lg font-semibold text-white">Notificaciones</h3>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-white/70">Nuevos cursos y contenido</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-[#ff6b35]" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-white/70">Recordatorios de progreso</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-[#ff6b35]" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-white/70">Novedades de la comunidad</span>
              <input type="checkbox" className="w-5 h-5 rounded accent-[#ff6b35]" />
            </label>
          </div>
        </div>

        {/* Privacidad */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-[#ff6b35]" />
            <h3 className="text-lg font-semibold text-white">Privacidad</h3>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-white/70">Perfil público</span>
              <input type="checkbox" className="w-5 h-5 rounded accent-[#ff6b35]" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-white/70">Mostrar progreso en la comunidad</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-[#ff6b35]" />
            </label>
          </div>
        </div>

        {/* Apariencia */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="w-5 h-5 text-[#ff6b35]" />
            <h3 className="text-lg font-semibold text-white">Apariencia</h3>
          </div>

          <p className="text-white/50 text-sm">
            Próximamente podrás personalizar el tema y la apariencia de la plataforma.
          </p>
        </div>
      </div>

      {/* Guardar */}
      <div className="mt-8">
        <button className="w-full py-3 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] rounded-xl text-white font-semibold hover:shadow-lg hover:shadow-orange-500/25 transition-all">
          Guardar cambios
        </button>
      </div>
    </div>
  )
}
