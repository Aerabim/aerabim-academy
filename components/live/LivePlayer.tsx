'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { JoinSessionResponse } from '@/types';

const MuxPlayer = dynamic(() => import('@mux/mux-player-react'), { ssr: false });

interface LivePlayerProps {
  sessionId: string;
  sessionTitle: string;
  hostName: string;
}

type PlayerState = 'loading' | 'ready' | 'error' | 'redirect';

export function LivePlayer({ sessionId, sessionTitle, hostName }: LivePlayerProps) {
  const [state, setState] = useState<PlayerState>('loading');
  const [joinData, setJoinData] = useState<JoinSessionResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchJoinData = useCallback(async () => {
    try {
      const res = await fetch(`/api/live-sessions/${sessionId}/join`);
      if (!res.ok) {
        const body = await res.json();
        setErrorMessage(body.error || 'Errore durante il collegamento.');
        setState('error');
        return;
      }

      const data = (await res.json()) as JoinSessionResponse;
      setJoinData(data);

      if (data.type === 'mentoring' && data.meetingUrl) {
        setState('redirect');
        window.location.href = data.meetingUrl;
      } else {
        setState('ready');
      }
    } catch {
      setErrorMessage('Errore di connessione.');
      setState('error');
    }
  }, [sessionId]);

  useEffect(() => {
    fetchJoinData();
  }, [fetchJoinData]);

  // Loading state
  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <svg className="animate-spin w-8 h-8 text-accent-cyan mb-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-text-muted text-[0.84rem]">Collegamento in corso...</p>
      </div>
    );
  }

  // Error state
  if (state === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-accent-rose/10 flex items-center justify-center mb-4">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="text-accent-rose">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <p className="text-text-primary font-semibold text-[0.88rem] mb-1">{errorMessage}</p>
        <button
          onClick={() => { setState('loading'); fetchJoinData(); }}
          className="mt-3 px-4 py-2 text-[0.78rem] text-accent-cyan border border-accent-cyan/30 rounded-lg hover:bg-accent-cyan/10 transition-colors"
        >
          Riprova
        </button>
      </div>
    );
  }

  // Redirect state (mentoring)
  if (state === 'redirect') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg className="animate-spin w-8 h-8 text-accent-amber mb-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-text-primary font-semibold text-[0.88rem]">Reindirizzamento al meeting...</p>
        {joinData?.meetingUrl && (
          <a
            href={joinData.meetingUrl}
            className="mt-3 text-accent-cyan text-[0.78rem] hover:underline"
          >
            Clicca qui se non vieni reindirizzato
          </a>
        )}
      </div>
    );
  }

  // Ready state — show Mux live player
  if (!joinData?.playbackId || !joinData.playbackToken) {
    return null;
  }

  return (
    <div>
      {/* Session info overlay */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-heading text-[1rem] font-bold text-text-primary">{sessionTitle}</h2>
          <p className="text-[0.72rem] text-text-muted">con {hostName}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 font-heading text-[0.62rem] font-extrabold text-accent-rose uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-accent-rose animate-pulse" />
          LIVE
        </span>
      </div>

      {/* Mux Player */}
      <div className="rounded-lg overflow-hidden bg-black aspect-video">
        <MuxPlayer
          playbackId={joinData.playbackId}
          tokens={{
            playback: joinData.playbackToken,
            thumbnail: joinData.thumbnailToken,
            storyboard: joinData.storyboardToken,
          }}
          streamType="live"
          autoPlay
          accentColor="#4ECDC4"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}
