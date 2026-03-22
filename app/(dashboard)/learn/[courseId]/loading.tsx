export default function LearnPlayerLoading() {
  return (
    <div className="p-6 lg:p-9 space-y-6 animate-pulse">
      {/* Video player area skeleton */}
      <div className="aspect-video w-full max-w-4xl rounded-xl bg-brand-blue/10" />

      {/* Lesson info skeleton */}
      <div className="max-w-4xl space-y-3">
        <div className="h-6 w-64 rounded bg-brand-blue/20" />
        <div className="h-4 w-40 rounded bg-brand-blue/10" />
      </div>

      {/* Sidebar / module list skeleton */}
      <div className="max-w-4xl space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border border-brand-blue/10 bg-brand-blue/5 p-3">
            <div className="h-8 w-8 shrink-0 rounded-full bg-brand-blue/15" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-44 rounded bg-brand-blue/15" />
              <div className="h-2.5 w-20 rounded bg-brand-blue/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
