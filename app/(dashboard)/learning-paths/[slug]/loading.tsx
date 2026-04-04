export default function LearningPathDetailLoading() {
  return (
    <div className="w-full px-6 lg:px-9 pt-3 pb-7 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="rounded-xl h-52 bg-surface-2" />
      {/* Steps skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-surface-2" />
        ))}
      </div>
    </div>
  );
}
