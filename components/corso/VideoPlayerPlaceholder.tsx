interface VideoPlayerPlaceholderProps {
  courseTitle: string;
}

export function VideoPlayerPlaceholder({ courseTitle }: VideoPlayerPlaceholderProps) {
  return (
    <div
      className="relative w-full bg-surface-0 rounded-lg overflow-hidden"
      style={{ aspectRatio: '16 / 9', maxHeight: '540px' }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        {/* Play button */}
        <div className="w-16 h-16 rounded-full bg-surface-2 border border-border-subtle flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-text-muted ml-1">
            <path d="M8 5.14v13.72a1 1 0 001.5.86l11.04-6.86a1 1 0 000-1.72L9.5 4.28A1 1 0 008 5.14z" fill="currentColor" />
          </svg>
        </div>
        <p className="text-text-muted text-xs font-heading">Preview non disponibile</p>
      </div>
    </div>
  );
}
