export default function CommunityLoading() {
  return (
    <div className="w-full px-6 lg:px-9 py-7 animate-pulse">
      {/* Header skeleton */}
      <div className="mb-6">
        <div className="h-7 w-48 bg-surface-2 rounded mb-2" />
        <div className="h-4 w-72 bg-surface-2 rounded" />
      </div>

      {/* Category grid skeleton */}
      <div className="mb-8">
        <div className="h-5 w-24 bg-surface-2 rounded mb-3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-surface-1 border border-border-subtle rounded-lg p-5 h-32" />
          ))}
        </div>
      </div>

      {/* Discussion feed skeleton */}
      <div>
        <div className="h-5 w-40 bg-surface-2 rounded mb-3" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface-1 border border-border-subtle rounded-lg p-5 h-24" />
          ))}
        </div>
      </div>
    </div>
  );
}
