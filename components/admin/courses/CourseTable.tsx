'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { AREA_CONFIG, LEVEL_LABELS } from '@/lib/area-config';
import type { AdminCourseListItem, CourseStatus } from '@/types';

const STATUS_CONFIG: Record<CourseStatus, { label: string; dotClass: string; btnClass: string; btnActiveClass: string }> = {
  draft: {
    label: 'Bozza',
    dotClass: 'bg-text-muted',
    btnClass: 'bg-surface-3 text-text-muted hover:text-text-secondary',
    btnActiveClass: 'text-text-muted bg-surface-3/50 cursor-default',
  },
  hidden: {
    label: 'Nascosto',
    dotClass: 'bg-accent-amber',
    btnClass: 'bg-accent-amber/10 text-accent-amber hover:bg-accent-amber/20',
    btnActiveClass: 'text-accent-amber bg-accent-amber/5 cursor-default',
  },
  published: {
    label: 'Pubblicato',
    dotClass: 'bg-accent-emerald',
    btnClass: 'bg-accent-emerald/10 text-accent-emerald hover:bg-accent-emerald/20',
    btnActiveClass: 'text-accent-emerald bg-accent-emerald/5 cursor-default',
  },
  archived: {
    label: 'Archiviato',
    dotClass: 'bg-accent-rose',
    btnClass: 'bg-accent-rose/10 text-accent-rose hover:bg-accent-rose/20',
    btnActiveClass: 'text-accent-rose bg-accent-rose/5 cursor-default',
  },
};

const STATUS_ORDER: CourseStatus[] = ['draft', 'hidden', 'published', 'archived'];

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
  const [statusOpen, setStatusOpen] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const statusBtnRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const openStatusDropdown = useCallback((courseId: string) => {
    if (statusOpen === courseId) {
      setStatusOpen(null);
      setDropdownPos(null);
      return;
    }
    const btn = statusBtnRefs.current.get(courseId);
    if (btn) {
      const rect = btn.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left });
    }
    setStatusOpen(courseId);
  }, [statusOpen]);

  useEffect(() => {
    if (!statusOpen) return;
    const openId = statusOpen;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const btn = statusBtnRefs.current.get(openId);
      if (btn?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setStatusOpen(null);
      setDropdownPos(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [statusOpen]);

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(filter.toLowerCase()) ||
    c.slug.toLowerCase().includes(filter.toLowerCase()),
  );

  async function handleChangeStatus(course: AdminCourseListItem, newStatus: CourseStatus) {
    if (course.status === newStatus) return;
    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setCourses((prev) =>
          prev.map((c) =>
            c.id === course.id ? { ...c, status: newStatus } : c,
          ),
        );
        router.refresh();
      }
    } catch (err) {
      console.error('Change status error:', err);
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
        router.refresh();
      }
    } catch (err) {
      console.error('Delete course error:', err);
    } finally {
      setLoading(false);
      setDeleteTarget(null);
    }
  }

  async function handleToggleFeatured(course: AdminCourseListItem) {
    const setting = !course.isFeatured;
    try {
      const res = await fetch(`/api/admin/courses/${course.id}/feature`, {
        method: setting ? 'POST' : 'DELETE',
      });
      if (res.ok) {
        setCourses((prev) =>
          prev.map((c) => ({
            ...c,
            isFeatured: c.id === course.id ? setting : false,
          })),
        );
        router.refresh();
      }
    } catch (err) {
      console.error('Toggle featured error:', err);
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
      <div ref={tableRef} className="overflow-x-auto border border-border-subtle rounded-lg">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border-subtle bg-surface-2/50">
              <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Titolo</th>
              <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Area</th>
              <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Livello</th>
              <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Prezzo</th>
              <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Moduli</th>
              <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Iscritti</th>
              <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Evidenza</th>
              <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Stato</th>
              <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-[0.82rem] text-text-muted">
                  {filter ? 'Nessun corso trovato.' : 'Nessun corso presente.'}
                </td>
              </tr>
            ) : (
              filtered.map((course) => {
                const areaConf = AREA_CONFIG[course.area as keyof typeof AREA_CONFIG];
                const statusConf = STATUS_CONFIG[course.status];
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
                        onClick={() => handleToggleFeatured(course)}
                        title={course.isFeatured ? 'Rimuovi da In Evidenza' : 'Imposta come In Evidenza'}
                        className={cn(
                          'w-7 h-7 rounded-md flex items-center justify-center transition-colors',
                          course.isFeatured
                            ? 'bg-accent-cyan/20 text-accent-cyan'
                            : 'bg-surface-3 text-text-muted hover:text-accent-cyan hover:bg-accent-cyan/10',
                        )}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill={course.isFeatured ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <button
                          ref={(el) => { if (el) statusBtnRefs.current.set(course.id, el); }}
                          onClick={() => openStatusDropdown(course.id)}
                          className={cn(
                            'flex items-center gap-1.5 text-[0.72rem] font-semibold px-2.5 py-1 rounded-md transition-colors',
                            statusConf.btnClass,
                          )}
                        >
                          <span className={cn('w-2 h-2 rounded-full shrink-0', statusConf.dotClass)} />
                          {statusConf.label}
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className={cn('transition-transform', statusOpen === course.id && 'rotate-180')}>
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </button>
                      </div>
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

      {/* Status dropdown portal */}
      {statusOpen && dropdownPos && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-50 min-w-[160px] bg-surface-2 border border-border-subtle rounded-lg shadow-lg py-1"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
        >
          {STATUS_ORDER.map((s) => {
            const conf = STATUS_CONFIG[s];
            const course = courses.find((c) => c.id === statusOpen);
            const isCurrent = course?.status === s;
            return (
              <button
                key={s}
                onClick={() => {
                  if (course) handleChangeStatus(course, s);
                  setStatusOpen(null);
                  setDropdownPos(null);
                }}
                className={cn(
                  'w-full text-left px-3 py-1.5 text-[0.78rem] transition-colors flex items-center gap-2',
                  isCurrent
                    ? conf.btnActiveClass
                    : 'text-text-secondary hover:bg-surface-3 hover:text-text-primary',
                )}
              >
                <span className={cn('w-2 h-2 rounded-full shrink-0', conf.dotClass)} />
                {conf.label}
                {isCurrent && <span className="ml-auto text-[0.68rem] text-text-muted">attuale</span>}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </>
  );
}
