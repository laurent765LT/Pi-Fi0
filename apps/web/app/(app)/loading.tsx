export default function AppLoading() {
  return (
    <div className="max-w-container mx-auto px-6 py-8 animate-pulse">
      {/* Header skeleton */}
      <div className="h-8 w-48 bg-surface-2 rounded-lg mb-3" />
      <div className="h-1 w-24 bg-surface-2 rounded-full mb-8" />

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-border rounded-lg p-5 flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-md bg-surface-2 shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-2.5 w-20 bg-surface-2 rounded" />
              <div className="h-6 w-12 bg-surface-2 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-border rounded-lg p-6">
          <div className="h-4 w-32 bg-surface-2 rounded mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-3 bg-surface-2 rounded" style={{ width: `${85 - i * 10}%` }} />
            ))}
          </div>
        </div>
        <div className="bg-white border border-border rounded-lg p-6">
          <div className="h-4 w-24 bg-surface-2 rounded mb-4" />
          <div className="h-40 bg-surface-2 rounded" />
        </div>
      </div>
    </div>
  );
}
