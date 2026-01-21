export default function LessonLoading() {
  return (
    <div className="min-h-screen bg-dark animate-pulse">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-6">
          {/* Main content area */}
          <div className="flex-1 space-y-4">
            {/* Video player skeleton */}
            <div className="aspect-video bg-white/5 border border-white/10 rounded-2xl" />

            {/* Title and description */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
              <div className="h-7 w-3/4 bg-white/10 rounded" />
              <div className="h-4 w-full bg-white/10 rounded" />
              <div className="h-4 w-2/3 bg-white/10 rounded" />
            </div>

            {/* Tabs skeleton */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex gap-4 mb-4">
                <div className="h-8 w-24 bg-white/10 rounded-lg" />
                <div className="h-8 w-24 bg-white/10 rounded-lg" />
                <div className="h-8 w-24 bg-white/10 rounded-lg" />
              </div>
              <div className="space-y-3">
                <div className="h-4 w-full bg-white/10 rounded" />
                <div className="h-4 w-full bg-white/10 rounded" />
                <div className="h-4 w-3/4 bg-white/10 rounded" />
              </div>
            </div>
          </div>

          {/* Sidebar - course navigation */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4 sticky top-4">
              <div className="h-6 w-40 bg-white/10 rounded" />

              {/* Module skeletons */}
              {[1, 2, 3].map((m) => (
                <div key={m} className="space-y-2">
                  <div className="h-5 w-32 bg-white/10 rounded" />
                  <div className="space-y-1 pl-4">
                    {[1, 2, 3].map((l) => (
                      <div key={l} className="h-8 w-full bg-white/10 rounded" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
