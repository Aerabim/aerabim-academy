export default function NotificheLoading() {
  return (
    <div className="p-6 lg:p-9 w-full">
      <div className="h-7 w-32 bg-surface-2 rounded animate-pulse mb-6" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 bg-surface-1 rounded-lg border border-border-subtle animate-pulse" />
        ))}
      </div>
    </div>
  );
}
