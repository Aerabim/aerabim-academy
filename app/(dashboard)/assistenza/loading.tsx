export default function AssistenzaLoading() {
  return (
    <div className="p-6 lg:p-9 w-full">
      <div className="h-7 w-36 bg-surface-2 rounded animate-pulse mb-2" />
      <div className="h-4 w-64 bg-surface-2 rounded animate-pulse mb-8" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 bg-surface-1 rounded-lg border border-border-subtle animate-pulse" />
        ))}
      </div>
    </div>
  );
}
