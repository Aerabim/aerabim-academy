'use client';

import { useEffect, useRef, useState } from 'react';

interface CourseCardVideoPreviewProps {
  playbackId: string;
  isHovered: boolean;
}

/**
 * Plays a short Mux MP4 clip when the card is hovered.
 * Uses a public playback policy — no JWT needed.
 * Appears after a 1500ms delay to avoid flicker on quick passes.
 */
export function CourseCardVideoPreview({ playbackId, isHovered }: CourseCardVideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isHovered) {
      timerRef.current = setTimeout(() => {
        setVisible(true);
        videoRef.current?.play().catch(() => undefined);
      }, 1500);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      setVisible(false);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isHovered]);

  return (
    <video
      ref={videoRef}
      src={`https://stream.mux.com/${playbackId}/medium.mp4`}
      muted
      loop
      playsInline
      preload="none"
      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0, zIndex: 2 }}
    />
  );
}
