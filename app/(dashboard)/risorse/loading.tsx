export default function RisorseLoading() {
  return (
    <div className="w-full px-6 lg:px-9 py-7">
      <div className="h-8 w-32 bg-surface-2 rounded animate-pulse mb-2" />
      <div className="h-4 w-64 bg-surface-2 rounded animate-pulse mb-6" />

      {/* Tab skeleton */}
      <div className="flex gap-2 mb-5">
        <div className="h-9 w-24 bg-surface-2 rounded-md animate-pulse" />
        <div className="h-9 w-20 bg-surface-2 rounded-md animate-pulse" />
      </div>

      {/* Card skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-surface-1 border border-border-subtle rounded-lg overflow-hidden">
            <div className="aspect-[16/9] bg-surface-2 animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-3 w-16 bg-surface-2 rounded animate-pulse" />
              <div className="h-4 w-full bg-surface-2 rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-surface-2 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
