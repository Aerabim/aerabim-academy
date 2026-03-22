export default function DashboardLoading() {
  return (
    <div className="p-6 lg:p-9 space-y-6 animate-pulse">
      {/* Welcome section skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-64 rounded bg-brand-blue/20" />
        <div className="h-4 w-48 rounded bg-brand-blue/10" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border border-brand-blue/10 bg-brand-blue/5" />
        ))}
      </div>

      {/* Content area skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-xl border border-brand-blue/10 bg-brand-blue/5" />
        <div className="h-64 rounded-xl border border-brand-blue/10 bg-brand-blue/5" />
      </div>
    </div>
  );
}
