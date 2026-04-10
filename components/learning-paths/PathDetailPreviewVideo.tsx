'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const MuxPlayer = dynamic(() => import('@mux/mux-player-react'), { ssr: false });

interface PathDetailPreviewVideoProps {
  playbackId: string;
  thumbnailUrl?: string | null;
}

export function PathDetailPreviewVideo({ playbackId, thumbnailUrl }: PathDetailPreviewVideoProps) {
  const [ready, setReady] = useState(false);

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border border-white/10 bg-black"
      style={{ aspectRatio: '16/9' }}
    >
      {thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt=""
          loading="eager"
          fetchPriority="high"
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-500 pointer-events-none',
            ready ? 'opacity-0' : 'opacity-100',
          )}
        />
      )}

      <MuxPlayer
        playbackId={playbackId}
        streamType="on-demand"
        autoPlay="muted"
        loop
        thumbnailTime={0}
        style={{
          width: '100%',
          height: '100%',
          opacity: ready ? 1 : 0,
          transition: 'opacity 0.5s ease',
          '--media-object-fit': 'cover',
        } as React.CSSProperties}
        onCanPlay={() => setReady(true)}
      />
    </div>
  );
}
