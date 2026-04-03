import { FeedView } from '@/components/feed/FeedView';
import { BimAlertBanner } from '@/components/dashboard/BimAlertBanner';
import { FeedLiveHeader } from '@/components/feed/FeedLiveHeader';

export const dynamic = 'force-dynamic';

export default function FeedPage() {
  return (
    <div className="px-6 lg:px-10 pt-3 pb-6 lg:pb-10 w-full space-y-8">
      <FeedLiveHeader />
      <BimAlertBanner />
      <FeedView />
    </div>
  );
}
