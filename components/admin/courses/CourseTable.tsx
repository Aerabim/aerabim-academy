'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  private: {
    label: 'Privato',
    dotClass: 'bg-accent-violet',
    btnClass: 'bg-accent-violet/10 text-accent-violet hover:bg-accent-violet/20',
    btnActiveClass: 'text-accent-violet bg-accent-violet/5 cursor-default',
  },
};

const STATUS_ORDER: CourseStatus[] = ['draft', 'hidden', 'published', 'private', 'archived'];

type SortCol = 'title' | 'price' | 'modules' | 'enrolled' | 'created';
type SortDir = 'asc' | 'desc';

interface CheckItem { label: string; ok: boolean }

function completenessChecks(course: AdminCourseListItem): CheckItem[] {
  return [
    { label: 'Copertina',         ok: !!course.thumbnailUrl },
    { label: 'Almeno un modulo',  ok: course.moduleCount > 0 },
    { label: 'Prezzo impostato',  ok: course.isFree || course.priceSingle > 0 },
    { label: 'Stripe collegato',  ok: course.isFree || !!course.stripePriceId },
  ];
}

function CompletenessIndicator({ course }: { course: AdminCourseListItem }) {
  const checks = completenessChecks(course);
  const score = checks.filter((c) => c.ok).length;
  const total = checks.length;
  const allOk = score === total;
  const missing = checks.filter((c) => !c.ok).map((c) => c.label);

  return (
    <div className="group relative flex items-center gap-0.5 mt-1">
      {checks.map((c, i) => (
        <span
          key={i}
          className={cn(
            'w-2.5 h-1 rounded-full transition-colors',
            c.ok ? 'bg-accent-emerald/70' : 'bg-surface-4',
          )}
        />
      ))}
      {!allOk && (
        <span className="ml-1 text-[0.62rem] text-text-muted">{score}/{total}</span>
      )}
      {!allOk && (
        <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover:block z-20 bg-surface-3 border border-border-subtle rounded-md px-2.5 py-2 shadow-lg min-w-[160px]">
          <p className="text-[0.68rem] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Mancante</p>
          {missing.map((m) => (
            <div key={m} className="flex items-center gap-1.5 text-[0.72rem] text-text-secondary">
              <span className="w-1 h-1 rounded-full bg-accent-rose shrink-0" />
              {m}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface CourseTableProps {
  courses: AdminCourseListItem[];
}

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        'w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 transition-colors',
        checked
          ? 'bg-accent-cyan border-accent-cyan'
          : 'bg-surface-3 border-border-hover hover:border-accent-cyan/40',
      )}
    >
      {checked && (
        <svg width="9" height="9" viewBox="0 0 10 8" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 4l3 3 5-6" />
        </svg>
      )}
    </button>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
      className={cn('shrink-0 transition-colors', active ? 'text-accent-cyan' : 'text-text-muted/40')}
    >
      {active && dir === 'asc'
        ? <path d="M12 19V5M5 12l7-7 7 7" />
        : active && dir === 'desc'
        ? <path d="M12 5v14M5 12l7 7 7-7" />
        : <><path d="M12 5v14" /><path d="M5 9l7-7 7 7" opacity={0.4} /><path d="M5 15l7 7 7-7" opacity={0.4} /></>
      }
    </svg>
  );
}

export function CourseTable({ courses: initialCourses }: CourseTableProps) {
  const router = useRouter();
  const [courses, setCourses] = useState(initialCourses);
  const [filter, setFilter] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortCol, setSortCol] = useState<SortCol | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [bulkStatus, setBulkStatus] = useState<CourseStatus | ''>('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminCourseListItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [statusOpen, setStatusOpen] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const statusBtnRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  function toggleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  }

  const displayed = useMemo(() => {
    let list = courses.filter((c) => {
      if (filter && !c.title.toLowerCase().includes(filter.toLowerCase()) && !c.slug.toLowerCase().includes(filter.toLowerCase())) return false;
      if (filterArea && c.area !== filterArea) return false;
      if (filterLevel && c.level !== filterLevel) return false;
      if (filterStatus && c.status !== filterStatus) return false;
      return true;
    });

    if (sortCol) {
      list = [...list].sort((a, b) => {
        let cmp = 0;
        if (sortCol === 'title')    cmp = a.title.localeCompare(b.title, 'it');
        if (sortCol === 'price')    cmp = a.priceSingle - b.priceSingle;
        if (sortCol === 'modules')  cmp = a.moduleCount - b.moduleCount;
        if (sortCol === 'enrolled') cmp = a.enrolledCount - b.enrolledCount;
        if (sortCol === 'created')  cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return list;
  }, [courses, filter, filterArea, filterLevel, filterStatus, sortCol, sortDir]);

  const activeFilters = [filterArea, filterLevel, filterStatus].filter(Boolean).length;
  const dragEnabled = !sortCol && !filter && activeFilters === 0;

  function exportCsv() {
    const headers = ['Titolo', 'Slug', 'Area', 'Livello', 'Prezzo (€)', 'Gratuito', 'Stato', 'Moduli', 'Iscritti', 'In evidenza', 'Creato il'];
    const rows = displayed.map((c) => [
      `"${c.title.replace(/"/g, '""')}"`,
      c.slug,
      AREA_CONFIG[c.area as keyof typeof AREA_CONFIG]?.label ?? c.area,
      LEVEL_LABELS[c.level as keyof typeof LEVEL_LABELS] ?? c.level,
      c.isFree ? '0' : (c.priceSingle / 100).toFixed(2),
      c.isFree ? 'Sì' : 'No',
      STATUS_CONFIG[c.status].label,
      c.moduleCount,
      c.enrolledCount,
      c.isFeatured ? 'Sì' : 'No',
      new Date(c.createdAt).toLocaleDateString('it-IT'),
    ]);

    const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `corsi_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleDragStart(id: string) {
    setDraggedId(id);
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    if (id !== draggedId) setDragOverId(id);
  }

  function handleDrop(targetId: string) {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    const oldIndex = courses.findIndex((c) => c.id === draggedId);
    const newIndex = courses.findIndex((c) => c.id === targetId);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...courses];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    setCourses(reordered);
    setDraggedId(null);
    setDragOverId(null);

    fetch('/api/admin/courses/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: reordered.map((c) => c.id) }),
    }).catch(() => undefined);
  }

  const allDisplayedSelected = displayed.length > 0 && displayed.every((c) => selected.has(c.id));
  const someSelected = selected.size > 0;

  function toggleSelectAll() {
    if (allDisplayedSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(displayed.map((c) => c.id)));
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleBulkStatus() {
    if (!bulkStatus || selected.size === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all(
        Array.from(selected).map((id) =>
          fetch(`/api/admin/courses/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: bulkStatus }),
          }),
        ),
      );
      setCourses((prev) =>
        prev.map((c) => selected.has(c.id) ? { ...c, status: bulkStatus as CourseStatus } : c),
      );
      setSelected(new Set());
      setBulkStatus('');
      router.refresh();
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleBulkDelete() {
    setBulkLoading(true);
    try {
      await Promise.all(
        Array.from(selected).map((id) =>
          fetch(`/api/admin/courses/${id}`, { method: 'DELETE' }),
        ),
      );
      setCourses((prev) => prev.filter((c) => !selected.has(c.id)));
      setSelected(new Set());
      router.refresh();
    } finally {
      setBulkLoading(false);
      setBulkDeleteConfirm(false);
    }
  }

  async function handleChangeStatus(course: AdminCourseListItem, newStatus: CourseStatus) {
    if (course.status === newStatus) return;
    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setCourses((prev) => prev.map((c) => c.id === course.id ? { ...c, status: newStatus } : c));
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
      const res = await fetch(`/api/admin/courses/${deleteTarget.id}`, { method: 'DELETE' });
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
      const res = await fetch(`/api/admin/courses/${course.id}/feature`, { method: setting ? 'POST' : 'DELETE' });
      if (res.ok) {
        setCourses((prev) => prev.map((c) => ({ ...c, isFeatured: c.id === course.id ? setting : false })));
        router.refresh();
      }
    } catch (err) {
      console.error('Toggle featured error:', err);
    }
  }

  async function handleDuplicate(course: AdminCourseListItem) {
    setDuplicating(course.id);
    try {
      const res = await fetch(`/api/admin/courses/${course.id}/duplicate`, { method: 'POST' });
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

  const thBase = 'px-4 py-2.5 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted';
  const selectBase = 'mt-1 w-full bg-surface-3 border border-border-subtle rounded text-[0.68rem] text-text-secondary px-1.5 py-1 focus:outline-none focus:border-accent-cyan/40 cursor-pointer';

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
        <span className="text-[0.75rem] text-text-muted">
          {displayed.length === courses.length
            ? `${courses.length} ${courses.length === 1 ? 'corso' : 'corsi'}`
            : `${displayed.length} di ${courses.length}`}
        </span>

        {activeFilters > 0 && (
          <button
            onClick={() => { setFilterArea(''); setFilterLevel(''); setFilterStatus(''); }}
            title="Rimuovi filtri"
            className="flex items-center gap-1 text-[0.72rem] text-text-muted hover:text-text-secondary transition-colors"
          >
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
            Filtri ({activeFilters})
          </button>
        )}
        <button
          onClick={exportCsv}
          title="Esporta CSV"
          className="w-8 h-8 flex items-center justify-center rounded-md text-text-muted hover:text-accent-cyan hover:bg-accent-cyan/10 border border-border-subtle transition-colors shrink-0"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
        <Link
          href="/admin/corsi/nuovo"
          className="px-4 py-2 bg-accent-cyan/15 text-accent-cyan text-[0.8rem] font-semibold rounded-md border border-accent-cyan/20 hover:bg-accent-cyan/25 transition-colors shrink-0"
        >
          + Nuovo corso
        </Link>
      </div>

      {/* Bulk action bar */}
      {someSelected && (
        <div className="flex items-center gap-3 mb-3 px-3 py-2 bg-surface-2 border border-border-subtle rounded-lg">
          <span className="text-[0.78rem] font-medium text-text-primary shrink-0">
            {selected.size} {selected.size === 1 ? 'corso selezionato' : 'corsi selezionati'}
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as CourseStatus | '')}
              className="bg-surface-3 border border-border-subtle rounded text-[0.75rem] text-text-secondary px-2 py-1.5 focus:outline-none focus:border-accent-cyan/40"
            >
              <option value="">Cambia stato…</option>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
            <button
              onClick={handleBulkStatus}
              disabled={!bulkStatus || bulkLoading}
              className="px-3 py-1.5 text-[0.75rem] font-semibold bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/20 rounded-md hover:bg-accent-cyan/25 transition-colors disabled:opacity-40"
            >
              Applica
            </button>
            <div className="w-px h-4 bg-border-subtle" />
            <button
              onClick={() => setBulkDeleteConfirm(true)}
              disabled={bulkLoading}
              className="px-3 py-1.5 text-[0.75rem] font-semibold bg-accent-rose/10 text-accent-rose border border-accent-rose/20 rounded-md hover:bg-accent-rose/20 transition-colors disabled:opacity-40"
            >
              Elimina
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-[0.72rem] text-text-muted hover:text-text-secondary transition-colors"
            >
              Deseleziona
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-220px)] border border-border-subtle rounded-lg [overscroll-behavior:contain]">
        <table className="w-full text-left">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-border-subtle bg-surface-2">

              {/* Drag handle */}
              <th className="pl-3 pr-1 py-2.5 w-6" />

              {/* Checkbox select-all */}
              <th className="pl-2 pr-2 py-2.5 w-8">
                <Checkbox checked={allDisplayedSelected} onChange={toggleSelectAll} />
              </th>

              {/* Titolo — sortable */}
              <th className={thBase}>
                <button onClick={() => toggleSort('title')} className="flex items-center gap-1.5 hover:text-text-secondary transition-colors">
                  Titolo
                  <SortIcon active={sortCol === 'title'} dir={sortDir} />
                </button>
              </th>

              {/* Area — filterable */}
              <th className={thBase}>
                <span>Area</span>
                <select
                  value={filterArea}
                  onChange={(e) => setFilterArea(e.target.value)}
                  className={cn(selectBase, filterArea && 'border-accent-cyan/40 text-accent-cyan')}
                >
                  <option value="">Tutte</option>
                  {Object.entries(AREA_CONFIG).map(([code, conf]) => (
                    <option key={code} value={code}>{conf.label}</option>
                  ))}
                </select>
              </th>

              {/* Livello — filterable */}
              <th className={thBase}>
                <span>Livello</span>
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                  className={cn(selectBase, filterLevel && 'border-accent-cyan/40 text-accent-cyan')}
                >
                  <option value="">Tutti</option>
                  {Object.entries(LEVEL_LABELS).map(([code, label]) => (
                    <option key={code} value={code}>{label}</option>
                  ))}
                </select>
              </th>

              {/* Prezzo — sortable */}
              <th className={thBase}>
                <button onClick={() => toggleSort('price')} className="flex items-center gap-1.5 hover:text-text-secondary transition-colors">
                  Prezzo
                  <SortIcon active={sortCol === 'price'} dir={sortDir} />
                </button>
              </th>

              {/* Moduli — sortable */}
              <th className={thBase}>
                <button onClick={() => toggleSort('modules')} className="flex items-center gap-1.5 hover:text-text-secondary transition-colors">
                  Moduli
                  <SortIcon active={sortCol === 'modules'} dir={sortDir} />
                </button>
              </th>

              {/* Iscritti — sortable */}
              <th className={thBase}>
                <button onClick={() => toggleSort('enrolled')} className="flex items-center gap-1.5 hover:text-text-secondary transition-colors">
                  Iscritti
                  <SortIcon active={sortCol === 'enrolled'} dir={sortDir} />
                </button>
              </th>

              {/* Evidenza — static */}
              <th className={thBase}>Evidenza</th>

              {/* Stato — filterable */}
              <th className={thBase}>
                <span>Stato</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={cn(selectBase, filterStatus && 'border-accent-cyan/40 text-accent-cyan')}
                >
                  <option value="">Tutti</option>
                  {STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                  ))}
                </select>
              </th>

              {/* Creato il — sortable */}
              <th className={thBase}>
                <button onClick={() => toggleSort('created')} className="flex items-center gap-1.5 hover:text-text-secondary transition-colors">
                  Creato il
                  <SortIcon active={sortCol === 'created'} dir={sortDir} />
                </button>
              </th>

              <th className={thBase}>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-4 py-10 text-center text-[0.82rem] text-text-muted">
                  {filter || activeFilters > 0 ? 'Nessun corso corrisponde ai filtri.' : 'Nessun corso presente.'}
                </td>
              </tr>
            ) : (
              displayed.map((course) => {
                const areaConf = AREA_CONFIG[course.area as keyof typeof AREA_CONFIG];
                const statusConf = STATUS_CONFIG[course.status];
                return (
                  <tr
                    key={course.id}
                    draggable={dragEnabled}
                    onDragStart={() => handleDragStart(course.id)}
                    onDragOver={(e) => handleDragOver(e, course.id)}
                    onDrop={() => handleDrop(course.id)}
                    onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}
                    className={cn(
                      'border-b border-border-subtle last:border-b-0 transition-colors',
                      draggedId === course.id && 'opacity-40',
                      dragOverId === course.id && 'border-t-2 border-t-accent-cyan',
                      selected.has(course.id) ? 'bg-accent-cyan/5' : 'hover:bg-surface-2/30',
                    )}
                  >
                    <td className="pl-3 pr-1 py-3 w-6">
                      {dragEnabled && (
                        <span className="text-text-muted/30 hover:text-text-muted cursor-grab active:cursor-grabbing transition-colors select-none">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                            <circle cx="4" cy="2" r="1.2"/><circle cx="8" cy="2" r="1.2"/>
                            <circle cx="4" cy="6" r="1.2"/><circle cx="8" cy="6" r="1.2"/>
                            <circle cx="4" cy="10" r="1.2"/><circle cx="8" cy="10" r="1.2"/>
                          </svg>
                        </span>
                      )}
                    </td>
                    <td className="pl-2 pr-2 py-3 w-8">
                      <Checkbox checked={selected.has(course.id)} onChange={() => toggleSelect(course.id)} />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/corsi/${course.id}`} className="text-[0.82rem] font-medium text-text-primary hover:text-accent-cyan transition-colors">
                        {course.title}
                      </Link>
                      <div className="text-[0.7rem] text-text-muted mt-0.5">/{course.slug}</div>
                      <CompletenessIndicator course={course} />
                    </td>
                    <td className="px-4 py-3">
                      {areaConf && <Badge variant={areaConf.badgeVariant}>{areaConf.label}</Badge>}
                    </td>
                    <td className="px-4 py-3 text-[0.82rem] text-text-secondary">
                      {LEVEL_LABELS[course.level as keyof typeof LEVEL_LABELS] ?? course.level}
                    </td>
                    <td className="px-4 py-3 text-[0.82rem] text-text-secondary">
                      {course.isFree ? <Badge variant="emerald">Gratuito</Badge> : formatPrice(course.priceSingle)}
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
                    </td>
                    <td className="px-4 py-3 text-[0.78rem] text-text-muted whitespace-nowrap">
                      {new Date(course.createdAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/catalogo-corsi/${course.slug}`}
                          target="_blank"
                          title="Anteprima pubblica"
                          className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-accent-emerald hover:bg-accent-emerald/10 transition-colors"
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </Link>
                        <Link
                          href={`/admin/corsi/${course.id}`}
                          title="Modifica"
                          className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-accent-cyan hover:bg-accent-cyan/10 transition-colors"
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDuplicate(course)}
                          disabled={duplicating === course.id}
                          title="Duplica"
                          className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-accent-amber hover:bg-accent-amber/10 transition-colors disabled:opacity-40"
                        >
                          {duplicating === course.id
                            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                            : <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                                <rect x="9" y="9" width="13" height="13" rx="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                          }
                        </button>
                        <button
                          onClick={() => setDeleteTarget(course)}
                          title="Elimina"
                          className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-accent-rose hover:bg-accent-rose/10 transition-colors"
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
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

      {/* Single delete confirmation */}
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

      {/* Bulk delete confirmation */}
      <ConfirmDialog
        open={bulkDeleteConfirm}
        title={`Elimina ${selected.size} ${selected.size === 1 ? 'corso' : 'corsi'}`}
        message={`Sei sicuro di voler eliminare ${selected.size === 1 ? 'il corso selezionato' : `i ${selected.size} corsi selezionati`}? Questa azione è irreversibile.`}
        confirmLabel="Elimina tutti"
        variant="danger"
        loading={bulkLoading}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteConfirm(false)}
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
                  isCurrent ? conf.btnActiveClass : 'text-text-secondary hover:bg-surface-3 hover:text-text-primary',
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
