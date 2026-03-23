import { CouponManager } from '@/components/admin/coupons/CouponManager';

export default function AdminCouponPage() {
  return (
    <div className="p-6 lg:p-10 w-full">
      <div className="mb-6">
        <h1 className="text-[1.3rem] font-heading font-bold text-text-primary">Gestione Coupon</h1>
        <p className="text-[0.82rem] text-text-secondary mt-1">Crea e gestisci codici sconto Stripe.</p>
      </div>
      <CouponManager />
    </div>
  );
}
