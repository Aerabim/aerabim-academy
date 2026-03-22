export default function CategoryLoading() {
  return (
    <div className="w-full px-6 lg:px-9 py-7 animate-pulse">
      <div className="h-4 w-32 bg-surface-2 rounded mb-4" />
      <div className="mb-6">
        <div className="h-7 w-56 bg-surface-2 rounded mb-2" />
        <div className="h-4 w-80 bg-surface-2 rounded" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-surface-1 border border-border-subtle rounded-lg p-5 h-24" />
        ))}
      </div>
    </div>
  );
}
