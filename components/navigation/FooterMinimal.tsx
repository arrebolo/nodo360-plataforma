export function FooterMinimal() {
  return (
    <footer className="mt-24 bg-dark border-t border-dark-border">
      <div className="max-w-6xl mx-auto px-6 py-10 text-center space-y-3">
        <p className="text-sm text-white/60">
          Formación real en Bitcoin, Web3 y soberanía digital
        </p>
        <p className="text-sm text-white/50">
          Rutas de aprendizaje claras, sin humo
        </p>
        <p className="text-sm text-white/50">
          Aprende paso a paso. Decide con conocimiento.
        </p>
        <p className="text-xs text-white/40 pt-4">
          © {new Date().getFullYear()} Nodo360
        </p>
      </div>
    </footer>
  )
}


