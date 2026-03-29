'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { FormField } from '@/components/admin/ui/FormField';
import { FormTextarea } from '@/components/admin/ui/FormTextarea';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  order_num: number;
}

interface QuizEditorProps {
  courseId: string;
  lessonId: string;
}

export function QuizEditor({ courseId, lessonId }: QuizEditorProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QuizQuestion | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [qText, setQText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctIdx, setCorrectIdx] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [formError, setFormError] = useState('');

  const apiBase = `/api/admin/courses/${courseId}/lessons/${lessonId}/quiz`;

  useEffect(() => {
    fetchQuestions();
  }, []);

  async function fetchQuestions() {
    try {
      const res = await fetch(apiBase);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions ?? []);
      }
    } catch (err) {
      console.error('Fetch quiz questions error:', err);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setQText('');
    setOptions(['', '', '', '']);
    setCorrectIdx(0);
    setExplanation('');
    setEditingIdx(null);
    setShowAdd(false);
    setFormError('');
  }

  function startEdit(q: QuizQuestion, idx: number) {
    setQText(q.question);
    setOptions([...q.options, '', '', '', ''].slice(0, 4));
    setCorrectIdx(q.correct_index);
    setExplanation(q.explanation ?? '');
    setEditingIdx(idx);
    setShowAdd(false);
  }

  function startAdd() {
    resetForm();
    setShowAdd(true);
  }

  async function handleSave() {
    if (!qText.trim() || options.filter((o) => o.trim()).length < 2) return;
    setSaving(true);
    setFormError('');

    try {
      const cleanOptions = options.map((o) => o.trim()).filter(Boolean);

      const isEdit = editingIdx !== null;
      const payload = isEdit
        ? {
            questionId: questions[editingIdx].id,
            question: qText.trim(),
            options: cleanOptions,
            correctIndex: correctIdx,
            explanation: explanation.trim() || null,
          }
        : {
            question: qText.trim(),
            options: cleanOptions,
            correctIndex: correctIdx,
            explanation: explanation.trim() || null,
          };

      const res = await fetch(apiBase, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error ?? 'Errore durante il salvataggio.');
        return;
      }

      await fetchQuestions();
      resetForm();
    } catch (err) {
      console.error('Save question error:', err);
      setFormError('Errore di rete.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${apiBase}?questionId=${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setQuestions((prev) => prev.filter((q) => q.id !== deleteTarget.id));
      }
    } catch (err) {
      console.error('Delete question error:', err);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  if (loading) {
    return <div className="text-[0.78rem] text-text-muted py-3">Caricamento domande...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[0.82rem] font-medium text-text-secondary">
          Domande Quiz ({questions.length})
        </span>
        {!showAdd && editingIdx === null && (
          <button onClick={startAdd} className="text-[0.78rem] text-accent-cyan hover:underline">
            + Aggiungi domanda
          </button>
        )}
      </div>

      {/* Existing questions */}
      {questions.map((q, idx) => (
        <div
          key={q.id}
          className={cn(
            'bg-surface-2/30 border border-border-subtle rounded-md p-3',
            editingIdx === idx && 'ring-1 ring-accent-cyan/30',
          )}
        >
          {editingIdx === idx ? (
            <QuestionForm
              qText={qText}
              options={options}
              correctIdx={correctIdx}
              explanation={explanation}
              saving={saving}
              onQTextChange={setQText}
              onOptionsChange={setOptions}
              onCorrectIdxChange={setCorrectIdx}
              onExplanationChange={setExplanation}
              onSave={handleSave}
              onCancel={resetForm}
              error={formError}
            />
          ) : (
            <div className="space-y-1">
              <div className="flex items-start gap-2">
                <span className="text-[0.7rem] text-text-muted font-mono">{idx + 1}.</span>
                <p className="text-[0.82rem] text-text-primary flex-1">{q.question}</p>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => startEdit(q, idx)} className="text-[0.72rem] text-accent-cyan hover:underline">Modifica</button>
                  <button onClick={() => setDeleteTarget(q)} className="text-[0.72rem] text-accent-rose hover:underline">Elimina</button>
                </div>
              </div>
              <div className="pl-5 space-y-0.5">
                {q.options.map((opt, oi) => (
                  <div key={oi} className={cn('text-[0.75rem]', oi === q.correct_index ? 'text-accent-emerald font-medium' : 'text-text-muted')}>
                    {oi === q.correct_index ? '\u2713 ' : '\u2022 '}{opt}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add new question form */}
      {showAdd && (
        <div className="bg-surface-2/50 border border-border-subtle rounded-md p-4">
          <QuestionForm
            qText={qText}
            options={options}
            correctIdx={correctIdx}
            explanation={explanation}
            saving={saving}
            onQTextChange={setQText}
            onOptionsChange={setOptions}
            onCorrectIdxChange={setCorrectIdx}
            onExplanationChange={setExplanation}
            onSave={handleSave}
            onCancel={resetForm}
            error={formError}
          />
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Elimina domanda"
        message="Sei sicuro di voler eliminare questa domanda?"
        confirmLabel="Elimina"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

/* ── Inline question form ── */

interface QuestionFormProps {
  qText: string;
  options: string[];
  correctIdx: number;
  explanation: string;
  saving: boolean;
  onQTextChange: (v: string) => void;
  onOptionsChange: (v: string[]) => void;
  onCorrectIdxChange: (v: number) => void;
  onExplanationChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  error: string;
}

function QuestionForm({
  qText, options, correctIdx, explanation, saving,
  onQTextChange, onOptionsChange, onCorrectIdxChange, onExplanationChange,
  onSave, onCancel, error,
}: QuestionFormProps) {
  function setOption(idx: number, val: string) {
    const next = [...options];
    next[idx] = val;
    onOptionsChange(next);
  }

  return (
    <div className="space-y-3">
      <FormTextarea
        label="Domanda"
        id="question"
        value={qText}
        onChange={onQTextChange}
        rows={2}
        required
      />

      <div className="space-y-2">
        <span className="text-[0.78rem] font-medium text-text-secondary">
          Opzioni di risposta
        </span>
        {options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              type="radio"
              name="correctAnswer"
              checked={correctIdx === idx}
              onChange={() => onCorrectIdxChange(idx)}
              className="w-4 h-4 text-accent-cyan focus:ring-accent-cyan/20"
            />
            <input
              value={opt}
              onChange={(e) => setOption(idx, e.target.value)}
              placeholder={`Opzione ${idx + 1}`}
              className="flex-1 px-2.5 py-1.5 bg-surface-2 border border-border-subtle rounded text-[0.78rem] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50"
            />
          </div>
        ))}
        <p className="text-[0.68rem] text-text-muted">Seleziona il radio button per la risposta corretta.</p>
      </div>

      <FormTextarea
        label="Spiegazione (opzionale)"
        id="explanation"
        value={explanation}
        onChange={onExplanationChange}
        rows={2}
        hint="Mostrata dopo la risposta."
      />

      {error && (
        <div className="text-[0.72rem] text-accent-rose">{error}</div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onSave}
          disabled={saving || !qText.trim()}
          className="px-3 py-1.5 bg-accent-cyan/15 text-accent-cyan text-[0.78rem] font-semibold rounded-md border border-accent-cyan/20 hover:bg-accent-cyan/25 transition-colors disabled:opacity-50"
        >
          {saving ? '...' : 'Salva domanda'}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-[0.78rem] text-text-muted hover:text-text-primary transition-colors"
        >
          Annulla
        </button>
      </div>
    </div>
  );
}
