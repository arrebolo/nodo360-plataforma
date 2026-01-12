'use client'

import { QRCodeSVG } from 'qrcode.react'

interface CertificateQRProps {
  verificationUrl: string
  size?: number
}

export function CertificateQR({ verificationUrl, size = 150 }: CertificateQRProps) {
  return (
    <div className="bg-white p-3 rounded-xl inline-block">
      <QRCodeSVG
        value={verificationUrl}
        size={size}
        level="H"
        includeMargin={false}
        bgColor="#ffffff"
        fgColor="#000000"
      />
    </div>
  )
}

export default CertificateQR
