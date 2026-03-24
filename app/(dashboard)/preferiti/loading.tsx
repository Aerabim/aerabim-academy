export default function PreferitiLoading() {
  return (
    <div className="w-full px-6 lg:px-9 py-7 space-y-6">
      <div>
        <div className="h-7 w-48 bg-surface-2 rounded animate-pulse" />
        <div className="h-4 w-72 bg-surface-2 rounded animate-pulse mt-2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-md overflow-hidden">
            <div className="h-[160px] bg-surface-2 animate-pulse" />
            <div className="bg-surface-1 border border-t-0 border-border-subtle p-3.5 pb-4 space-y-3">
              <div className="h-4 w-16 bg-surface-2 rounded animate-pulse" />
              <div className="h-5 w-full bg-surface-2 rounded animate-pulse" />
              <div className="h-3 w-24 bg-surface-2 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
