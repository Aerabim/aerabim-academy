export default function DiscussionLoading() {
  return (
    <div className="w-full px-6 lg:px-9 py-7 animate-pulse">
      <div className="h-4 w-48 bg-surface-2 rounded mb-4" />
      <div className="mb-6">
        <div className="h-5 w-20 bg-surface-2 rounded mb-2" />
        <div className="h-7 w-80 bg-surface-2 rounded mb-3" />
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-surface-2 rounded-full" />
          <div className="h-4 w-32 bg-surface-2 rounded" />
        </div>
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-5 h-48" />
      </div>
      <div className="h-5 w-28 bg-surface-2 rounded mb-3" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-surface-1 border border-border-subtle rounded-lg p-5 h-20" />
        ))}
      </div>
    </div>
  );
}
