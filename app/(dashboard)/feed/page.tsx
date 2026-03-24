import { FeedView } from '@/components/feed/FeedView';
import { BimAlertBanner } from '@/components/dashboard/BimAlertBanner';

export default function FeedPage() {
  return (
    <div className="p-6 lg:p-10 w-full space-y-8">
      <div>
        <h1 className="text-[1.3rem] font-heading font-bold text-text-primary">Feed</h1>
        <p className="text-[0.82rem] text-text-secondary mt-1">
          Le ultime novita' dalla piattaforma: sessioni, discussioni e risorse.
        </p>
      </div>
      <BimAlertBanner />
      <FeedView />
    </div>
  );
}
