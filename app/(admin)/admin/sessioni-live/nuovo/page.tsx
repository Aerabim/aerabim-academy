import { SessionForm } from '@/components/admin/sessions/SessionForm';

export default function NewSessionPage() {
  return (
    <div className="p-6 lg:p-10 w-full">
      <div className="mb-6">
        <h1 className="text-[1.3rem] font-heading font-bold text-text-primary">Nuova Sessione Live</h1>
        <p className="text-[0.82rem] text-text-secondary mt-1">Crea un nuovo webinar o sessione di mentoring.</p>
      </div>
      <SessionForm />
    </div>
  );
}
