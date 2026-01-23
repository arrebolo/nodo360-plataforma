export default function RutaDetalleLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-16 bg-white/10 rounded" />
        <div className="h-4 w-4 bg-white/10 rounded" />
        <div className="h-4 w-32 bg-white/10 rounded" />
      </div>

      {/* Hero skeleton */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg" />
              <div className="h-8 w-48 bg-white/10 rounded-lg" />
            </div>
            <div className="h-4 w-full max-w-md bg-white/10 rounded" />
            <div className="flex gap-4 pt-2">
              <div className="h-4 w-24 bg-white/10 rounded" />
              <div className="h-4 w-28 bg-white/10 rounded" />
            </div>
          </div>
          <div className="h-10 w-32 bg-white/10 rounded-lg" />
        </div>
      </div>

      {/* Section title */}
      <div className="space-y-2">
        <div className="h-6 w-48 bg-white/10 rounded" />
        <div className="h-4 w-32 bg-white/10 rounded" />
      </div>

      {/* Course cards skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white/5 border border-white/10 rounded-xl border-l-4 border-l-white/20 p-5"
          >
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl" />
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-48 bg-white/10 rounded" />
                  <div className="h-5 w-20 bg-white/10 rounded-full" />
                </div>
                <div className="h-4 w-full max-w-sm bg-white/10 rounded" />
                <div className="h-1.5 w-full bg-white/10 rounded-full" />
                <div className="flex gap-4">
                  <div className="h-3 w-20 bg-white/10 rounded" />
                  <div className="h-3 w-24 bg-white/10 rounded" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
