import { EnrollmentTable } from '@/components/admin/users/EnrollmentTable';

export default function AdminEnrollmentsPage() {
  return (
    <div className="p-6 lg:p-10 w-full">
      <div className="mb-6">
        <h1 className="text-[1.3rem] font-heading font-bold text-text-primary">
          Iscrizioni
        </h1>
        <p className="text-[0.82rem] text-text-secondary mt-1">
          Visualizza e gestisci tutte le iscrizioni ai corsi.
        </p>
      </div>
      <EnrollmentTable />
    </div>
  );
}
