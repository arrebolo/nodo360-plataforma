export function FooterMinimal() {
  return (
    <footer className="border-t border-white/10 mt-24 bg-[#070a10]">
      <div className="max-w-6xl mx-auto px-6 py-10 text-center space-y-3">
        <p className="text-sm text-neutral-400">
          Formacion real en Bitcoin, Web3 y soberania digital
        </p>
        <p className="text-sm text-neutral-500">
          Rutas de aprendizaje claras, sin humo
        </p>
        <p className="text-sm text-neutral-500">
          Aprende paso a paso. Decide con conocimiento.
        </p>
        <p className="text-xs text-neutral-600 pt-4">
          © {new Date().getFullYear()} Nodo360
        </p>
      </div>
    </footer>
  )
}
