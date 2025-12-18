'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

interface CertificateQRProps {
  certificateNumber: string
  size?: number
}

export function CertificateQR({ certificateNumber, size = 120 }: CertificateQRProps) {
  const [qrUrl, setQrUrl] = useState<string | null>(null)

  useEffect(() => {
    const verificationUrl = `https://nodo360.com/certificados/${certificateNumber}`

    QRCode.toDataURL(verificationUrl, {
      width: size,
      margin: 1,
      color: {
        dark: '#f7931a',
        light: '#1a1d24'
      }
    }).then(setQrUrl).catch(console.error)
  }, [certificateNumber, size])

  if (!qrUrl) {
    return (
      <div
        className="bg-white/5 rounded-xl animate-pulse"
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="p-3 bg-[#1a1d24] rounded-xl border border-[#f7931a]/30">
        <img
          src={qrUrl}
          alt="QR de verificación"
          width={size}
          height={size}
          className="rounded-lg"
        />
      </div>
      <p className="text-xs text-gray-500">Escanea para verificar</p>
    </div>
  )
}
