export default function RutasLoading() {
  return (
    <div className="min-h-screen bg-dark">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8 animate-pulse">
        {/* Hero skeleton */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:justify-between">
            <div className="space-y-4 max-w-2xl">
              <div className="h-8 w-72 bg-white/10 rounded-lg" />
              <div className="h-4 w-full max-w-md bg-white/10 rounded" />
              <div className="flex gap-2 pt-1">
                <div className="h-7 w-40 bg-white/10 rounded-full" />
                <div className="h-7 w-44 bg-white/10 rounded-full" />
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 lg:w-[300px]">
              <div className="h-5 w-28 bg-white/10 rounded mb-2" />
              <div className="h-4 w-full bg-white/10 rounded mb-3" />
              <div className="h-10 w-full bg-white/10 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Section title */}
        <div className="space-y-2 mb-6">
          <div className="h-6 w-40 bg-white/10 rounded" />
          <div className="h-4 w-56 bg-white/10 rounded" />
        </div>

        {/* Route cards grid skeleton */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 min-h-[260px]"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-lg" />
                  <div className="h-6 w-32 bg-white/10 rounded" />
                </div>
                <div className="h-4 w-full bg-white/10 rounded" />
                <div className="h-4 w-3/4 bg-white/10 rounded" />
                <div className="flex gap-4 pt-2">
                  <div className="h-4 w-20 bg-white/10 rounded" />
                  <div className="h-4 w-24 bg-white/10 rounded" />
                </div>
                <div className="pt-4 border-t border-white/10">
                  <div className="h-10 w-full bg-white/10 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
