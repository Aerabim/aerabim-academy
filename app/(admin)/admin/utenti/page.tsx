import { UserTable } from '@/components/admin/users/UserTable';

export default function AdminUsersPage() {
  return (
    <div className="p-6 lg:p-10 w-full">
      <div className="mb-6">
        <h1 className="text-[1.3rem] font-heading font-bold text-text-primary">
          Gestione Utenti
        </h1>
        <p className="text-[0.82rem] text-text-secondary mt-1">
          Visualizza e gestisci gli utenti della piattaforma.
        </p>
      </div>
      <UserTable />
    </div>
  );
}
