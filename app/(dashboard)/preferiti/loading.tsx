function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border-subtle bg-surface-1">
      <div className="w-14 h-14 rounded-lg bg-surface-2 animate-pulse shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-20 bg-surface-2 rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-surface-2 rounded animate-pulse" />
        <div className="h-3 w-16 bg-surface-2 rounded animate-pulse" />
      </div>
      <div className="h-8 w-24 bg-surface-2 rounded-lg animate-pulse shrink-0" />
    </div>
  );
}

function SectionSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="h-3 w-20 bg-surface-2 rounded animate-pulse" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => <RowSkeleton key={i} />)}
      </div>
    </div>
  );
}

export default function PreferitiLoading() {
  return (
    <div className="w-full px-6 lg:px-9 py-7">
      <div className="mb-7">
        <div className="h-7 w-48 bg-surface-2 rounded animate-pulse" />
        <div className="h-4 w-72 bg-surface-2 rounded animate-pulse mt-2" />
      </div>
      <div className="space-y-8">
        <SectionSkeleton rows={3} />
        <SectionSkeleton rows={2} />
        <SectionSkeleton rows={1} />
      </div>
    </div>
  );
}
