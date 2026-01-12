'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, Check, Loader2 } from 'lucide-react'

// Definir presets directamente (más confiable que importar JSON)
const presets = {
  presets: [
    { id: "bitcoin-orange", name: "Bitcoin Naranja", url: "/avatars/bitcoin-orange.svg", category: "bitcoin" },
    { id: "bitcoin-gold", name: "Bitcoin Dorado", url: "/avatars/bitcoin-gold.svg", category: "bitcoin" },
    { id: "lightning", name: "Lightning", url: "/avatars/lightning.svg", category: "bitcoin" },
    { id: "satoshi", name: "Satoshi", url: "/avatars/satoshi.svg", category: "bitcoin" },
    { id: "node", name: "Nodo", url: "/avatars/node.svg", category: "bitcoin" },
    { id: "blockchain", name: "Blockchain", url: "/avatars/blockchain.svg", category: "crypto" },
    { id: "wallet", name: "Wallet", url: "/avatars/wallet.svg", category: "crypto" },
    { id: "hodler", name: "Hodler", url: "/avatars/hodler.svg", category: "crypto" },
    { id: "miner", name: "Minero", url: "/avatars/miner.svg", category: "bitcoin" },
    { id: "keys", name: "Llaves", url: "/avatars/keys.svg", category: "crypto" },
    { id: "rocket", name: "Rocket", url: "/avatars/rocket.svg", category: "fun" },
    { id: "diamond", name: "Diamond", url: "/avatars/diamond.svg", category: "fun" }
  ]
}

interface AvatarSelectorProps {
  currentAvatar?: string | null
  userName: string
  userId: string
}

export function AvatarSelector({ currentAvatar, userName, userId }: AvatarSelectorProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const defaultAvatar = userName?.charAt(0).toUpperCase() || 'U'

  const handlePresetSelect = async (presetUrl: string) => {
    setSelectedAvatar(presetUrl)

    try {
      console.log('🎨 Actualizando avatar preset:', presetUrl)

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: presetUrl })
      })

      if (!response.ok) throw new Error('Error al actualizar avatar')

      console.log('✅ Avatar preset actualizado, recargando...')

      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error) {
      console.error('❌ Error:', error)
      alert('Error al actualizar avatar')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Solo se permiten imágenes JPG, PNG o WebP')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen debe ser menor a 2MB')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      console.log('📤 Subiendo archivo...')

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/user/avatar/upload', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) throw new Error('Error al subir imagen')

      const { avatar_url } = await response.json()
      console.log('✅ Imagen subida:', avatar_url)

      setSelectedAvatar(avatar_url)

      setTimeout(() => {
        window.location.reload()
      }, 800)
    } catch (error) {
      console.error('❌ Error al subir:', error)
      alert('Error al subir imagen')
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="space-y-8">
      {/* Avatar Actual */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-brand-light/30 shadow-xl">
          {selectedAvatar ? (
            <Image
              src={selectedAvatar}
              alt="Avatar actual"
              fill
              className="object-cover"
              unoptimized={selectedAvatar.startsWith('/avatars/')}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-brand-light to-brand flex items-center justify-center">
              <span className="text-white font-bold text-5xl">{defaultAvatar}</span>
            </div>
          )}
        </div>
        <div className="text-center">
          <p className="text-white font-semibold text-lg">{userName}</p>
          <p className="text-sm text-white/60">Avatar actual</p>
        </div>
      </div>

      {/* Subir Foto */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-accent-blue" />
          Subir Foto Personalizada
        </h3>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileUpload}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white/5 border-2 border-dashed border-white/20 rounded-lg hover:bg-white/10 hover:border-accent-blue/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-6 h-6 text-accent-blue animate-spin" />
              <div className="flex flex-col items-start">
                <span className="text-white font-medium">Subiendo...</span>
                <div className="w-full bg-white/10 rounded-full h-2 mt-2 overflow-hidden">
                  <div
                    className="bg-accent-blue h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <Upload className="w-6 h-6 text-accent-blue" />
              <div className="flex flex-col items-start">
                <span className="text-white font-medium">Click para subir</span>
                <span className="text-xs text-white/60">JPG, PNG o WebP (máx. 2MB)</span>
              </div>
            </>
          )}
        </button>
      </div>

      {/* Avatares Prediseñados */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">Avatares Prediseñados</h3>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {presets.presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetSelect(preset.url)}
              className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                selectedAvatar === preset.url
                  ? 'border-brand-light ring-2 ring-brand-light/50 scale-105'
                  : 'border-white/10 hover:border-accent-blue/50 hover:scale-105'
              }`}
              title={preset.name}
            >
              <Image
                src={preset.url}
                alt={preset.name}
                fill
                className="object-cover"
                unoptimized
              />
              {selectedAvatar === preset.url && (
                <div className="absolute inset-0 bg-brand-light/30 flex items-center justify-center">
                  <div className="bg-brand-light rounded-full p-1">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}


