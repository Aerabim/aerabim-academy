import { redirect } from 'next/navigation';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getAdminCourseDetail } from '@/lib/admin/queries';
import { CourseForm } from '@/components/admin/courses/CourseForm';
import { ModuleManager } from '@/components/admin/courses/ModuleManager';
import { QuizEditor } from '@/components/admin/courses/QuizEditor';
import { Badge } from '@/components/ui/Badge';

interface PageProps {
  params: { courseId: string };
}

export default async function EditCoursePage({ params }: PageProps) {
  const admin = getSupabaseAdmin();
  if (!admin) redirect('/admin/corsi');

  const detail = await getAdminCourseDetail(admin, params.courseId);
  if (!detail) redirect('/admin/corsi');

  const { course, modules } = detail;

  // Find quiz lessons for quiz editors
  const quizLessons = modules.flatMap((m) =>
    m.lessons
      .filter((l) => l.type === 'quiz')
      .map((l) => ({ ...l, moduleTitle: m.title })),
  );

  return (
    <div className="p-6 lg:p-10 w-full space-y-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-[1.3rem] font-heading font-bold text-text-primary">
            {course.title}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[0.78rem] text-text-muted">/{course.slug}</span>
            <Badge variant={course.is_published ? 'emerald' : 'amber'}>
              {course.is_published ? 'Pubblicato' : 'Bozza'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Course details form */}
      <section>
        <h2 className="text-[1rem] font-heading font-semibold text-text-primary mb-4">
          Dettagli corso
        </h2>
        <CourseForm course={course} />
      </section>

      {/* Modules and lessons */}
      <section>
        <ModuleManager courseId={course.id} modules={modules} />
      </section>

      {/* Quiz editors for each quiz lesson */}
      {quizLessons.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-[1rem] font-heading font-semibold text-text-primary">
            Gestione Quiz
          </h2>
          {quizLessons.map((lesson) => (
            <div key={lesson.id} className="bg-surface-1 border border-border-subtle rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="amber">Quiz</Badge>
                <span className="text-[0.82rem] font-medium text-text-primary">{lesson.title}</span>
                <span className="text-[0.7rem] text-text-muted">({lesson.moduleTitle})</span>
              </div>
              <QuizEditor courseId={course.id} lessonId={lesson.id} />
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
