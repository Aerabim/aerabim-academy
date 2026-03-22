'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { QuizSubmitResponse } from '@/types';

interface QuizResultProps {
  result: QuizSubmitResponse;
  courseId: string;
  onRetry?: () => void;
}

export function QuizResult({ result, courseId, onRetry }: QuizResultProps) {
  const [generatingCert, setGeneratingCert] = useState(false);
  const [certMessage, setCertMessage] = useState<string | null>(null);

  const handleGenerateCertificate = useCallback(async () => {
    setGeneratingCert(true);
    setCertMessage(null);

    try {
      const res = await fetch('/api/certificati/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });

      if (res.ok) {
        const data = await res.json();
        setCertMessage(`Certificato generato! Codice: ${data.verifyCode}`);
      } else {
        const errData = await res.json();
        setCertMessage(errData.error ?? 'Non ancora idoneo per il certificato.');
      }
    } catch {
      setCertMessage('Errore di connessione.');
    } finally {
      setGeneratingCert(false);
    }
  }, [courseId]);

  const isPassed = result.passed;
  const scoreColor = isPassed ? 'text-accent-emerald' : 'text-accent-rose';
  const bgColor = isPassed ? 'bg-accent-emerald/10' : 'bg-accent-rose/10';
  const borderColor = isPassed ? 'border-accent-emerald/20' : 'border-accent-rose/20';

  return (
    <div className="w-full bg-surface-1 border border-border-subtle rounded-lg p-6 lg:p-8">
      {/* Score display */}
      <div className={cn('text-center py-8 rounded-lg border mb-6', bgColor, borderColor)}>
        <div className="text-4xl mb-3">
          {isPassed ? '🎉' : '📊'}
        </div>
        <p className={cn('font-heading text-3xl font-extrabold', scoreColor)}>
          {result.score}%
        </p>
        <p className="text-text-secondary text-sm mt-1">
          {isPassed
            ? 'Quiz superato!'
            : 'Quiz non superato'}
        </p>
        <p className="text-text-muted text-[0.72rem] mt-1">
          Soglia: 70% · Il tuo punteggio: {result.score}%
        </p>
      </div>

      {/* Result message */}
      {isPassed ? (
        <div className="text-center space-y-4">
          <p className="text-text-secondary text-[0.82rem]">
            Complimenti! Hai superato il quiz con successo. Il progresso della lezione è stato aggiornato.
          </p>

          {/* Certificate generation button */}
          <button
            type="button"
            onClick={handleGenerateCertificate}
            disabled={generatingCert}
            className={cn(
              'font-heading text-[0.82rem] font-bold px-6 py-2.5 rounded-lg transition-all',
              'bg-accent-amber text-brand-dark hover:brightness-110',
              generatingCert && 'opacity-60 cursor-wait',
            )}
          >
            {generatingCert ? 'Generazione in corso...' : 'Verifica idoneità certificato'}
          </button>

          {certMessage && (
            <p className={cn(
              'text-[0.78rem]',
              certMessage.includes('Certificato generato') ? 'text-accent-emerald' : 'text-text-muted',
            )}>
              {certMessage}
            </p>
          )}
        </div>
      ) : (
        <div className="text-center space-y-4">
          <p className="text-text-secondary text-[0.82rem]">
            Non hai raggiunto la soglia del 70%. Puoi riprovare il quiz quante volte vuoi.
          </p>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="font-heading text-[0.82rem] font-bold px-6 py-2.5 rounded-lg bg-accent-cyan text-brand-dark hover:brightness-110 transition-all"
            >
              Riprova il quiz
            </button>
          )}
        </div>
      )}
    </div>
  );
}
