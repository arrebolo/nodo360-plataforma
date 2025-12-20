'use client'

import { Save, Globe, Mail, CreditCard, Shield } from 'lucide-react'

export default function AdminConfiguracionPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Configuración</h1>
        <p className="text-white/60">Configura los ajustes de la plataforma</p>
      </div>

      {/* General */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="w-5 h-5 text-[#ff6b35]" />
          <h2 className="text-lg font-semibold text-white">General</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-2">Nombre del sitio</label>
            <input
              type="text"
              defaultValue="Nodo360"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff6b35]/50"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-2">Descripción</label>
            <textarea
              rows={3}
              defaultValue="La plataforma educativa más completa en español para aprender Bitcoin, Blockchain y Web3"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff6b35]/50 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Email */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="w-5 h-5 text-[#ff6b35]" />
          <h2 className="text-lg font-semibold text-white">Email</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-2">Email de soporte</label>
            <input
              type="email"
              defaultValue="soporte@nodo360.com"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff6b35]/50"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-2">Email de notificaciones</label>
            <input
              type="email"
              defaultValue="notificaciones@nodo360.com"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff6b35]/50"
            />
          </div>
        </div>
      </div>

      {/* Pagos */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="w-5 h-5 text-[#ff6b35]" />
          <h2 className="text-lg font-semibold text-white">Pagos</h2>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-white/70">Habilitar pagos con Stripe</span>
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-[#ff6b35]" />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-white/70">Habilitar pagos con Bitcoin</span>
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-[#ff6b35]" />
          </label>
        </div>
      </div>

      {/* Seguridad */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-5 h-5 text-[#ff6b35]" />
          <h2 className="text-lg font-semibold text-white">Seguridad</h2>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-white/70">Requerir verificación de email</span>
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-[#ff6b35]" />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-white/70">Habilitar 2FA</span>
            <input type="checkbox" className="w-5 h-5 rounded accent-[#ff6b35]" />
          </label>
        </div>
      </div>

      {/* Save Button */}
      <button className="flex items-center gap-2 px-6 py-3 bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white rounded-xl font-medium transition-colors">
        <Save className="w-5 h-5" />
        Guardar Cambios
      </button>
    </div>
  )
}
