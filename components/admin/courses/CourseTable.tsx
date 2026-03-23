'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { AREA_CONFIG, LEVEL_LABELS } from '@/lib/area-config';
import type { AdminCourseListItem } from '@/types';

interface CourseTableProps {
  courses: AdminCourseListItem[];
}

export function CourseTable({ courses: initialCourses }: CourseTableProps) {
  const router = useRouter();
  const [courses, setCourses] = useState(initialCourses);
  const [filter, setFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminCourseListItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [duplicating, setDuplicating] = useState<string | null>(null);

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(filter.toLowerCase()) ||
    c.slug.toLowerCase().includes(filter.toLowerCase()),
  );

  async function handleTogglePublish(course: AdminCourseListItem) {
    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !course.isPublished }),
      });
      if (res.ok) {
        setCourses((prev) =>
          prev.map((c) =>
            c.id === course.id ? { ...c, isPublished: !c.isPublished } : c,
          ),
        );
      }
    } catch (err) {
      console.error('Toggle publish error:', err);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/courses/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCourses((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      }
    } catch (err) {
      console.error('Delete course error:', err);
    } finally {
      setLoading(false);
      setDeleteTarget(null);
    }
  }

  async function handleDuplicate(course: AdminCourseListItem) {
    setDuplicating(course.id);
    try {
      const res = await fetch(`/api/admin/courses/${course.id}/duplicate`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/admin/corsi/${data.course.id}`);
      }
    } catch (err) {
      console.error('Duplicate course error:', err);
    } finally {
      setDuplicating(null);
    }
  }

  const formatPrice = (cents: number) =>
    cents === 0 ? 'Gratuito' : `${(cents / 100).toFixed(2).replace('.', ',')} \u20AC`;

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Cerca corsi..."
            className="w-full pl-9 pr-3 py-2 bg-surface-2 border border-border-subtle rounded-md text-[0.78rem] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/20 transition-all"
          />
        </div>
        <Link
          href="/admin/corsi/nuovo"
          className="px-4 py-2 bg-accent-cyan/15 text-accent-cyan text-[0.8rem] font-semibold rounded-md border border-accent-cyan/20 hover:bg-accent-cyan/25 transition-colors shrink-0"
        >
          + Nuovo corso
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-border-subtle rounded-lg">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border-subtle bg-surface-2/50">
              <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Titolo</th>
              <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Area</th>
              <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Livello</th>
              <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Prezzo</th>
              <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Moduli</th>
              <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Iscritti</th>
              <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Stato</th>
              <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-[0.82rem] text-text-muted">
                  {filter ? 'Nessun corso trovato.' : 'Nessun corso presente.'}
                </td>
              </tr>
            ) : (
              filtered.map((course) => {
                const areaConf = AREA_CONFIG[course.area as keyof typeof AREA_CONFIG];
                return (
                  <tr key={course.id} className="border-b border-border-subtle last:border-b-0 hover:bg-surface-2/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/corsi/${course.id}`} className="text-[0.82rem] font-medium text-text-primary hover:text-accent-cyan transition-colors">
                        {course.title}
                      </Link>
                      <div className="text-[0.7rem] text-text-muted mt-0.5">/{course.slug}</div>
                    </td>
                    <td className="px-4 py-3">
                      {areaConf && <Badge variant={areaConf.badgeVariant}>{areaConf.label}</Badge>}
                    </td>
                    <td className="px-4 py-3 text-[0.82rem] text-text-secondary">
                      {LEVEL_LABELS[course.level as keyof typeof LEVEL_LABELS] ?? course.level}
                    </td>
                    <td className="px-4 py-3 text-[0.82rem] text-text-secondary">
                      {course.isFree ? (
                        <Badge variant="emerald">Gratuito</Badge>
                      ) : (
                        formatPrice(course.priceSingle)
                      )}
                    </td>
                    <td className="px-4 py-3 text-[0.82rem] text-text-secondary">{course.moduleCount}</td>
                    <td className="px-4 py-3 text-[0.82rem] text-text-secondary">{course.enrolledCount}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleTogglePublish(course)}
                        className={cn(
                          'text-[0.72rem] font-semibold px-2.5 py-1 rounded-md transition-colors',
                          course.isPublished
                            ? 'bg-accent-emerald/10 text-accent-emerald hover:bg-accent-emerald/20'
                            : 'bg-surface-3 text-text-muted hover:text-text-secondary',
                        )}
                      >
                        {course.isPublished ? 'Pubblicato' : 'Bozza'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/corsi/${course.id}`}
                          className="text-[0.78rem] text-accent-cyan hover:underline"
                        >
                          Modifica
                        </Link>
                        <button
                          onClick={() => handleDuplicate(course)}
                          disabled={duplicating === course.id}
                          className="text-[0.78rem] text-accent-amber hover:underline disabled:opacity-50"
                        >
                          {duplicating === course.id ? '...' : 'Duplica'}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(course)}
                          className="text-[0.78rem] text-accent-rose hover:underline"
                        >
                          Elimina
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Elimina corso"
        message={`Sei sicuro di voler eliminare "${deleteTarget?.title}"? Questa azione è irreversibile.`}
        confirmLabel="Elimina"
        variant="danger"
        loading={loading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
