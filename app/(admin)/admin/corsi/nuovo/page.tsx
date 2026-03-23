import { CourseForm } from '@/components/admin/courses/CourseForm';

export default function NewCoursePage() {
  return (
    <div className="p-6 lg:p-10 w-full">
      <div className="mb-6">
        <h1 className="text-[1.3rem] font-heading font-bold text-text-primary">
          Nuovo Corso
        </h1>
        <p className="text-[0.82rem] text-text-secondary mt-1">
          Compila i dati del corso. Potrai aggiungere moduli e lezioni dopo la creazione.
        </p>
      </div>
      <CourseForm />
    </div>
  );
}
