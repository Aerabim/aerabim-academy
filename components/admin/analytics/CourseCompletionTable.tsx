interface CourseCompletion {
  courseId: string;
  courseTitle: string;
  enrolledCount: number;
  completionRate: number;
}

interface Props {
  courses: CourseCompletion[];
}

export function CourseCompletionTable({ courses }: Props) {
  return (
    <div className="overflow-x-auto border border-border-subtle rounded-lg">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border-subtle bg-surface-2/50">
            <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted">Corso</th>
            <th className="px-4 py-3 text-[0.7rem] font-heading font-bold uppercase tracking-wider text-text-muted text-right">Iscritti attivi</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((c) => (
            <tr key={c.courseId} className="border-b border-border-subtle last:border-b-0 hover:bg-surface-2/30 transition-colors">
              <td className="px-4 py-3 text-[0.82rem] font-medium text-text-primary">{c.courseTitle}</td>
              <td className="px-4 py-3 text-[0.82rem] text-text-secondary text-right">{c.enrolledCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
