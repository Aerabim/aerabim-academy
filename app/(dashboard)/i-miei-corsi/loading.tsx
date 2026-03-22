export default function MyCoursesLoading() {
  return (
    <div className="p-6 lg:p-9 space-y-6 animate-pulse">
      {/* Title skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 rounded bg-brand-blue/20" />
        <div className="h-4 w-64 rounded bg-brand-blue/10" />
      </div>

      {/* Course rows skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border border-brand-blue/10 bg-brand-blue/5 p-4">
            <div className="h-12 w-12 shrink-0 rounded-lg bg-brand-blue/20" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 rounded bg-brand-blue/15" />
              <div className="h-3 w-32 rounded bg-brand-blue/10" />
            </div>
            <div className="h-2 w-24 rounded-full bg-brand-blue/15" />
          </div>
        ))}
      </div>
    </div>
  );
}
