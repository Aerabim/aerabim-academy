'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CourseFormFooterProps {
  formId?: string;
  isEditing: boolean;
}

export function CourseFormFooter({ formId = 'course-form', isEditing }: CourseFormFooterProps) {
  const router = useRouter();
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    function handleSaved() {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }

    window.addEventListener('course-saved', handleSaved);
    return () => window.removeEventListener('course-saved', handleSaved);
  }, []);

  return (
    <>
      <div className="h-16" />
      <div className="sticky bottom-0 z-30 -mx-6 lg:-mx-10 border-t border-border-subtle bg-surface-1/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-6 lg:px-10 py-3">
          <button
            type="submit"
            form={formId}
            className="px-5 py-2.5 bg-accent-cyan/15 text-accent-cyan text-[0.82rem] font-semibold rounded-md border border-accent-cyan/20 hover:bg-accent-cyan/25 transition-colors disabled:opacity-50"
          >
            {isEditing ? 'Salva modifiche' : 'Crea corso'}
          </button>
          <button
            type="button"
            onClick={() => { router.push('/admin/corsi'); router.refresh(); }}
            className="px-5 py-2.5 text-[0.82rem] font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Chiudi
          </button>

          {success && (
            <span className="text-[0.78rem] font-medium text-accent-emerald ml-2">
              Modifiche salvate con successo.
            </span>
          )}
        </div>
      </div>
    </>
  );
}
