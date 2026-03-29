'use client';

import { useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { ProgressUpdateRequest } from '@/types';

const MuxPlayer = dynamic(() => import('@mux/mux-player-react'), { ssr: false });

interface VideoPlayerProps {
  playbackId: string;
  lessonId: string;
  courseId: string;
  initialWatchTimeSec: number;
  tokens?: {
    playback: string;
    thumbnail: string;
    storyboard: string;
  };
}

const WATCH_TIME_SAVE_INTERVAL = 30; // seconds between progress saves

async function updateProgress(data: ProgressUpdateRequest): Promise<{ allCompleted?: boolean }> {
  try {
    const res = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Silent fail for watch time updates
  }
  return {};
}

export function VideoPlayer({
  playbackId,
  lessonId,
  courseId,
  initialWatchTimeSec,
  tokens,
}: VideoPlayerProps) {
  const router = useRouter();
  const [completed, setCompleted] = useState(false);
  const lastSavedTimeRef = useRef(initialWatchTimeSec);
  const lastSaveTimestampRef = useRef(0);
  const hasResumedRef = useRef(false);

  const handleLoadedMetadata = useCallback(
    (event: Event) => {
      if (hasResumedRef.current || initialWatchTimeSec <= 0) return;
      hasResumedRef.current = true;

      const target = event.target as HTMLMediaElement | null;
      if (!target) return;

      // Resume 3 seconds before saved position to give context
      const resumeTime = Math.max(0, initialWatchTimeSec - 3);
      target.currentTime = resumeTime;
    },
    [initialWatchTimeSec],
  );

  const handleTimeUpdate = useCallback(
    (event: Event) => {
      const target = event.target as HTMLMediaElement | null;
      if (!target) return;

      const currentTime = Math.round(target.currentTime);
      const now = Date.now();

      // Save every WATCH_TIME_SAVE_INTERVAL seconds of real time
      if (now - lastSaveTimestampRef.current < WATCH_TIME_SAVE_INTERVAL * 1000) return;

      lastSaveTimestampRef.current = now;
      lastSavedTimeRef.current = currentTime;

      updateProgress({ lessonId, watchTimeSec: currentTime });
    },
    [lessonId],
  );

  const [certificateMessage, setCertificateMessage] = useState<string | null>(null);

  const handleEnded = useCallback(async () => {
    const result = await updateProgress({ lessonId, completed: true });
    setCompleted(true);

    // Refresh server components so sidebar progress updates
    router.refresh();

    if (result.allCompleted) {
      try {
        const certRes = await fetch('/api/certificati/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId }),
        });
        if (certRes.ok) {
          const certData = await certRes.json();
          setCertificateMessage(certData.verifyCode);
        }
      } catch {
        // Certificate generation is best-effort; user can generate later
      }
    }
  }, [lessonId, courseId, router]);

  return (
    <div className="relative w-full max-h-[50vh] rounded-lg overflow-hidden bg-brand-dark" style={{ aspectRatio: '16/9' }}>
      <MuxPlayer
        playbackId={playbackId}
        {...(tokens ? { tokens } : {})}
        metadata={{ video_id: lessonId, video_title: courseId }}
        streamType="on-demand"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        style={{ width: '100%', height: '100%' }}
      />

      {/* Completion overlay */}
      {completed && (
        <div className="absolute inset-0 flex items-center justify-center bg-brand-dark/80 animate-fadeIn">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-accent-emerald/20 flex items-center justify-center mx-auto mb-3">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-accent-emerald">
                <circle cx="14" cy="14" r="12" stroke="currentColor" strokeWidth="2" />
                <path d="M9 14l3.5 3.5 6.5-6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="font-heading text-sm font-bold text-text-primary">
              Lezione completata!
            </p>
            {certificateMessage && (
              <div className="mt-3 px-4 py-2 bg-accent-amber/10 border border-accent-amber/20 rounded-lg">
                <p className="text-accent-amber text-[0.78rem] font-semibold">
                  🎓 Corso completato! Certificato generato
                </p>
                <p className="text-text-muted text-[0.68rem] mt-0.5">
                  Codice: {certificateMessage}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
