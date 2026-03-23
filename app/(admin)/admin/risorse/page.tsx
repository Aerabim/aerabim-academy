import { ResourcesAdminHub } from '@/components/admin/resources/ResourcesAdminHub';

export default function AdminResourcesPage() {
  return (
    <div className="p-6 lg:p-10 w-full">
      <div className="mb-6">
        <h1 className="text-[1.3rem] font-heading font-bold text-text-primary">Gestione Risorse</h1>
        <p className="text-[0.82rem] text-text-secondary mt-1">Articoli del blog e rassegna stampa.</p>
      </div>
      <ResourcesAdminHub />
    </div>
  );
}
