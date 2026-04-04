import { LearningPathForm } from '@/components/admin/learning-paths/LearningPathForm';

export default function NuovoLearningPathPage() {
  return (
    <div className="p-6 lg:p-10 w-full max-w-3xl">
      <div className="mb-6">
        <h1 className="text-[1.3rem] font-heading font-bold text-text-primary">
          Nuovo percorso
        </h1>
        <p className="text-[0.82rem] text-text-secondary mt-1">
          Compila i metadati. Potrai aggiungere i passi dopo la creazione.
        </p>
      </div>
      <LearningPathForm />
    </div>
  );
}
