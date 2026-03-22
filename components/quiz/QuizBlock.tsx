'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { QuizResult } from './QuizResult';
import type {
  QuizQuestionDisplay,
  QuizAnswer,
  QuizSubmitRequest,
  QuizSubmitResponse,
} from '@/types';

interface QuizBlockProps {
  lessonId: string;
  courseId: string;
  questions: QuizQuestionDisplay[];
  previousBestScore: number | null;
  previousPassed: boolean;
}

type QuizState = 'answering' | 'submitting' | 'result';

export function QuizBlock({
  lessonId,
  courseId,
  questions,
  previousBestScore,
  previousPassed,
}: QuizBlockProps) {
  const [answers, setAnswers] = useState<Map<string, number>>(new Map());
  const [state, setState] = useState<QuizState>(previousPassed ? 'result' : 'answering');
  const [result, setResult] = useState<QuizSubmitResponse | null>(
    previousPassed && previousBestScore !== null
      ? {
          success: true,
          score: previousBestScore,
          total: questions.length,
          passed: true,
          correctAnswers: {},
        }
      : null,
  );
  const [error, setError] = useState<string | null>(null);

  const handleSelect = useCallback((questionId: string, optionIndex: number) => {
    setAnswers((prev) => {
      const next = new Map(prev);
      next.set(questionId, optionIndex);
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (answers.size < questions.length) {
      setError('Rispondi a tutte le domande prima di inviare.');
      return;
    }

    setError(null);
    setState('submitting');

    const quizAnswers: QuizAnswer[] = Array.from(answers.entries()).map(
      ([questionId, selectedIndex]) => ({ questionId, selectedIndex }),
    );

    const body: QuizSubmitRequest = { lessonId, answers: quizAnswers };

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error ?? 'Errore nell\'invio del quiz.');
        setState('answering');
        return;
      }

      const data = (await res.json()) as QuizSubmitResponse;
      setResult(data);
      setState('result');
    } catch {
      setError('Errore di connessione. Riprova.');
      setState('answering');
    }
  }, [answers, questions.length, lessonId]);

  const handleRetry = useCallback(() => {
    setAnswers(new Map());
    setResult(null);
    setError(null);
    setState('answering');
  }, []);

  if (state === 'result' && result) {
    return (
      <QuizResult
        result={result}
        courseId={courseId}
        onRetry={result.passed ? undefined : handleRetry}
      />
    );
  }

  const allAnswered = answers.size >= questions.length;

  return (
    <div className="w-full bg-surface-1 border border-border-subtle rounded-lg p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-accent-amber/10 flex items-center justify-center">
          <span className="text-lg">📝</span>
        </div>
        <div>
          <h2 className="font-heading text-base font-bold text-text-primary">
            Quiz di verifica
          </h2>
          <p className="text-text-muted text-[0.72rem]">
            {questions.length} domande · Soglia superamento: 70%
          </p>
        </div>
      </div>

      {previousBestScore !== null && !previousPassed && (
        <div className="mb-5 px-4 py-2.5 bg-accent-amber/5 border border-accent-amber/20 rounded-lg">
          <p className="text-text-secondary text-[0.78rem]">
            Miglior punteggio precedente: <span className="font-semibold text-accent-amber">{previousBestScore}%</span>
          </p>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((question, qIndex) => (
          <div key={question.id} className="pb-5 border-b border-border-subtle last:border-0 last:pb-0">
            <p className="font-heading text-[0.85rem] font-semibold text-text-primary mb-3">
              <span className="text-accent-cyan mr-2">{qIndex + 1}.</span>
              {question.question}
            </p>

            <div className="space-y-2">
              {question.options.map((option, oIndex) => {
                const isSelected = answers.get(question.id) === oIndex;

                return (
                  <button
                    key={oIndex}
                    type="button"
                    onClick={() => handleSelect(question.id, oIndex)}
                    disabled={state === 'submitting'}
                    className={cn(
                      'w-full text-left px-4 py-3 rounded-lg border transition-all text-[0.82rem]',
                      isSelected
                        ? 'border-accent-cyan bg-accent-cyan/10 text-text-primary'
                        : 'border-border-subtle bg-surface-2 text-text-secondary hover:border-border-hover hover:bg-surface-3',
                      state === 'submitting' && 'opacity-60 cursor-not-allowed',
                    )}
                  >
                    <span className={cn(
                      'inline-flex items-center justify-center w-5 h-5 rounded-full border text-[0.68rem] font-semibold mr-3',
                      isSelected
                        ? 'border-accent-cyan bg-accent-cyan text-brand-dark'
                        : 'border-border-hover text-text-muted',
                    )}>
                      {String.fromCharCode(65 + oIndex)}
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 px-4 py-2.5 bg-accent-rose/5 border border-accent-rose/20 rounded-lg">
          <p className="text-accent-rose text-[0.78rem]">{error}</p>
        </div>
      )}

      {/* Submit button */}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={state === 'submitting' || !allAnswered}
          className={cn(
            'font-heading text-[0.82rem] font-bold px-6 py-2.5 rounded-lg transition-all',
            allAnswered
              ? 'bg-accent-cyan text-brand-dark hover:brightness-110'
              : 'bg-surface-3 text-text-muted cursor-not-allowed',
            state === 'submitting' && 'opacity-60 cursor-wait',
          )}
        >
          {state === 'submitting' ? 'Invio in corso...' : 'Invia risposte'}
        </button>
      </div>
    </div>
  );
}
