import { PromoManager } from '@/components/admin/promotions/PromoManager';
import { PromotionTable } from '@/components/admin/promotions/PromotionTable';

export default function AdminPromozioniPage() {
  return (
    <div className="p-6 lg:p-10 w-full space-y-10">

      {/* Section: Sconti percorsi */}
      <div>
        <div className="mb-5">
          <h1 className="text-[1.3rem] font-heading font-bold text-text-primary">
            Sconti Percorsi
          </h1>
          <p className="text-[0.82rem] text-text-secondary mt-1">
            Configura promozioni temporanee (es. Black Friday) o sconti dedicati agli abbonati PRO sui percorsi formativi.
          </p>
        </div>
        <PromotionTable />
      </div>

      {/* Divider */}
      <div className="h-px bg-border-subtle" />

      {/* Section: Banner e popup promozionali */}
      <div>
        <div className="mb-5">
          <h2 className="text-[1.1rem] font-heading font-bold text-text-primary">
            Banner e Popup
          </h2>
          <p className="text-[0.82rem] text-text-secondary mt-1">
            Gestisci banner e popup promozionali — Black Friday, Cyber Week, Natale, Pasqua e altro.
          </p>
        </div>
        <PromoManager />
      </div>

    </div>
  );
}
