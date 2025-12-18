// components/learning/PrintCertificateButton.tsx
'use client'

export function PrintCertificateButton() {
  const handlePrint = () => {
    window.print()
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="print:hidden fixed bottom-6 right-6 z-50 bg-gradient-to-r from-[#4CAF7A] to-[#F7931A] text-[#1F1E1B] px-5 py-2.5 rounded-full text-[14px] font-semibold shadow-[0_10px_26px_rgba(0,0,0,0.55)] hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(0,0,0,0.7)] transition flex items-center gap-2"
    >
      <span>🖨️</span>
      <span>Imprimir / Guardar PDF</span>
    </button>
  )
}
