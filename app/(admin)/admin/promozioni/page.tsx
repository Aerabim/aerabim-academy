import { PromoManager } from '@/components/admin/promotions/PromoManager';

export default function AdminPromozioniPage() {
  return (
    <div className="p-6 lg:p-10 w-full">
      <div className="mb-6">
        <h1 className="text-[1.3rem] font-heading font-bold text-text-primary">Promozioni</h1>
        <p className="text-[0.82rem] text-text-secondary mt-1">
          Gestisci banner e popup promozionali — Black Friday, Cyber Week, Natale, Pasqua e altro.
        </p>
      </div>
      <PromoManager />
    </div>
  );
}
