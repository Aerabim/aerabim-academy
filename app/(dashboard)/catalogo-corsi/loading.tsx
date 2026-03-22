export default function CatalogLoading() {
  return (
    <div className="p-6 lg:p-9 space-y-6 animate-pulse">
      {/* Hero skeleton */}
      <div className="space-y-3">
        <div className="h-8 w-72 rounded bg-brand-blue/20" />
        <div className="h-4 w-96 rounded bg-brand-blue/10" />
      </div>

      {/* Filters skeleton */}
      <div className="flex gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-24 rounded-full bg-brand-blue/10" />
        ))}
      </div>

      {/* Course cards grid skeleton */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-72 rounded-xl border border-brand-blue/10 bg-brand-blue/5" />
        ))}
      </div>
    </div>
  );
}
