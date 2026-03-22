import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { hasActiveCommunityAccess, getDiscussionDetail } from '@/lib/community/queries';
import { AuthorBadge } from '@/components/community/AuthorBadge';
import { Badge } from '@/components/ui/Badge';
import { ReplyCard } from '@/components/community/ReplyCard';
import { ReplyForm } from '@/components/community/ReplyForm';
import { LikeButton } from '@/components/community/LikeButton';
import { AdminToolbar } from '@/components/community/AdminToolbar';
import { CommunityGate } from '@/components/community/CommunityGate';
import { timeAgo } from '@/lib/utils';

interface DiscussionPageProps {
  params: { categorySlug: string; discussionId: string };
}

export default async function DiscussionPage({ params }: DiscussionPageProps) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const isPro = await hasActiveCommunityAccess(supabase, user.id);

  if (!isPro) {
    return (
      <div className="w-full px-6 lg:px-9 py-7">
        <CommunityGate />
      </div>
    );
  }

  const [detail, profileData] = await Promise.all([
    getDiscussionDetail(supabase, user.id, params.discussionId),
    supabase.from('profiles').select('role').eq('id', user.id).single(),
  ]);

  if (!detail) {
    notFound();
  }

  const { discussion, replies, totalReplies } = detail;
  const isAdmin = (profileData.data as unknown as { role: string } | null)?.role === 'admin';

  return (
    <div className="w-full px-6 lg:px-9 py-7">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[0.75rem] text-text-muted mb-4">
        <Link href="/community" className="hover:text-text-secondary transition-colors">
          Community
        </Link>
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M9 18l6-6-6-6" />
        </svg>
        <Link
          href={`/community/${discussion.categorySlug}`}
          className="hover:text-text-secondary transition-colors"
        >
          {discussion.categoryName}
        </Link>
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M9 18l6-6-6-6" />
        </svg>
        <span className="text-text-secondary truncate max-w-[200px]">
          {discussion.title}
        </span>
      </nav>

      {/* Admin toolbar */}
      {isAdmin && (
        <div className="mb-4">
          <AdminToolbar
            discussionId={discussion.id}
            isPinned={discussion.isPinned}
            isLocked={discussion.isLocked}
            categorySlug={discussion.categorySlug}
          />
        </div>
      )}

      {/* Discussion header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          {discussion.isPinned && (
            <span className="inline-flex items-center gap-1 text-[0.62rem] font-bold text-accent-amber uppercase tracking-wider">
              <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
              </svg>
              In evidenza
            </span>
          )}
          {discussion.isLocked && (
            <span className="inline-flex items-center gap-1 text-[0.62rem] font-bold text-text-muted uppercase tracking-wider">
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              Chiusa
            </span>
          )}
          <Badge variant="cyan">{discussion.categoryName}</Badge>
        </div>

        <h1 className="font-heading text-xl font-bold text-text-primary mb-3">
          {discussion.title}
        </h1>

        <div className="flex items-center justify-between mb-4">
          <AuthorBadge author={discussion.author} showCerts size="md" />
          <span className="text-[0.72rem] text-text-muted">
            {timeAgo(discussion.createdAt)}
          </span>
        </div>

        {/* Body */}
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-5">
          <p className="text-[0.85rem] text-text-primary whitespace-pre-wrap leading-relaxed">
            {discussion.body}
          </p>

          <div className="mt-4 flex items-center gap-3 text-[0.72rem] text-text-muted border-t border-border-subtle pt-3">
            <LikeButton
              discussionId={discussion.id}
              initialLiked={discussion.isLikedByUser}
              initialCount={discussion.likeCount}
            />
            <span className="inline-flex items-center gap-1">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              {totalReplies} {totalReplies === 1 ? 'risposta' : 'risposte'}
            </span>
          </div>
        </div>
      </div>

      {/* Replies section */}
      <section>
        <h2 className="font-heading text-[0.92rem] font-bold text-text-primary mb-3">
          Risposte ({totalReplies})
        </h2>

        {replies.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-text-secondary text-[0.82rem]">
              Nessuna risposta ancora. {!discussion.isLocked && 'Sii il primo a rispondere!'}
            </p>
          </div>
        ) : (
          <div className="bg-surface-1 border border-border-subtle rounded-lg px-5">
            {replies.map((reply) => (
              <ReplyCard key={reply.id} reply={reply} />
            ))}
          </div>
        )}

        {/* Reply form */}
        {!discussion.isLocked && (
          <div className="mt-4">
            <ReplyForm discussionId={discussion.id} />
          </div>
        )}
      </section>
    </div>
  );
}
