// Tipi TypeScript globali per AerACADEMY
// Questo file verrà popolato con i tipi generati da Supabase CLI (npx supabase gen types)

export type CourseStatus = 'draft' | 'hidden' | 'published' | 'archived';

export type Database = {
  public: {
    Tables: {
      courses: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string | null;
          area: 'OB' | 'SW' | 'NL' | 'PG' | 'AI';
          level: 'L1' | 'L2' | 'L3';
          price_single: number;
          is_free: boolean;
          status: CourseStatus;
          thumbnail_url: string | null;
          duration_min: number | null;
          stripe_price_id: string | null;
          avg_rating: number;
          review_count: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['courses']['Row'], 'id' | 'created_at' | 'avg_rating' | 'review_count'> & {
          id?: string;
          created_at?: string;
          avg_rating?: number;
          review_count?: number;
        };
        Update: Partial<Database['public']['Tables']['courses']['Insert']>;
      };
      modules: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          order_num: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['modules']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['modules']['Insert']>;
      };
      lessons: {
        Row: {
          id: string;
          module_id: string;
          title: string;
          order_num: number;
          type: 'video' | 'quiz' | 'material';
          mux_playback_id: string | null;
          mux_asset_id: string | null;
          mux_status: 'pending' | 'processing' | 'ready' | 'errored';
          duration_sec: number | null;
          is_preview: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['lessons']['Row'], 'id' | 'created_at' | 'mux_status'> & {
          id?: string;
          created_at?: string;
          mux_status?: 'pending' | 'processing' | 'ready' | 'errored';
        };
        Update: Partial<Database['public']['Tables']['lessons']['Insert']>;
      };
      enrollments: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          access_type: 'single' | 'pro_subscription' | 'team' | 'free';
          stripe_payment_intent_id: string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['enrollments']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['enrollments']['Insert']>;
      };
      progress: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          completed: boolean;
          watch_time_sec: number;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id: string;
          completed?: boolean;
          watch_time_sec?: number;
          completed_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['progress']['Insert']>;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_subscription_id: string;
          stripe_customer_id: string;
          status: 'active' | 'canceled' | 'past_due';
          plan: 'pro' | 'team' | 'pa';
          current_period_end: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>;
      };
      quiz_questions: {
        Row: {
          id: string;
          lesson_id: string;
          question: string;
          options: { text: string; is_correct: boolean }[];
          order_num: number | null;
        };
        Insert: Omit<Database['public']['Tables']['quiz_questions']['Row'], 'id'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['quiz_questions']['Insert']>;
      };
      quiz_attempts: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          answers: Record<string, unknown>;
          score: number | null;
          passed: boolean | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['quiz_attempts']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['quiz_attempts']['Insert']>;
      };
      certificates: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          verify_code: string;
          issued_at: string;
        };
        Insert: Omit<Database['public']['Tables']['certificates']['Row'], 'id' | 'issued_at'> & {
          id?: string;
          issued_at?: string;
        };
        Update: Partial<Database['public']['Tables']['certificates']['Insert']>;
      };
      profiles: {
        Row: {
          id: string;
          role: 'student' | 'admin' | 'docente' | 'tutor' | 'moderatore';
          display_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          role?: 'student' | 'admin' | 'docente' | 'tutor' | 'moderatore';
          display_name?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      live_sessions: {
        Row: {
          id: string;
          type: 'webinar' | 'mentoring';
          title: string;
          description: string | null;
          host_name: string;
          scheduled_at: string;
          duration_min: number;
          max_participants: number | null;
          status: 'scheduled' | 'live' | 'ended' | 'canceled';
          mux_live_stream_id: string | null;
          mux_playback_id: string | null;
          mux_stream_key: string | null;
          meeting_url: string | null;
          mux_replay_playback_id: string | null;
          is_published: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['live_sessions']['Row'], 'id' | 'created_at' | 'status' | 'is_published'> & {
          id?: string;
          created_at?: string;
          status?: 'scheduled' | 'live' | 'ended' | 'canceled';
          is_published?: boolean;
        };
        Update: Partial<Database['public']['Tables']['live_sessions']['Insert']>;
      };
      live_session_bookings: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          status: 'confirmed' | 'canceled';
          reminder_sent: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['live_session_bookings']['Row'], 'id' | 'created_at' | 'status' | 'reminder_sent'> & {
          id?: string;
          created_at?: string;
          status?: 'confirmed' | 'canceled';
          reminder_sent?: boolean;
        };
        Update: Partial<Database['public']['Tables']['live_session_bookings']['Insert']>;
      };
      session_requests: {
        Row: {
          id: string;
          user_id: string;
          topic: string;
          description: string | null;
          preferred_week: string;
          preferred_slot: 'mattina' | 'pomeriggio' | 'sera';
          status: 'pending' | 'confirmed' | 'proposed' | 'declined' | 'canceled';
          admin_note: string | null;
          session_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['session_requests']['Row'], 'id' | 'created_at' | 'updated_at' | 'status' | 'admin_note' | 'session_id'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          status?: 'pending' | 'confirmed' | 'proposed' | 'declined' | 'canceled';
          admin_note?: string;
          session_id?: string;
        };
        Update: Partial<Database['public']['Tables']['session_requests']['Insert']>;
      };
      community_categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          order_num: number;
          emoji: string | null;
        };
        Insert: {
          id: string;
          slug: string;
          name: string;
          description?: string | null;
          order_num?: number;
          emoji?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          order_num?: number;
          emoji?: string | null;
        };
      };
      community_discussions: {
        Row: {
          id: string;
          author_id: string;
          category_id: string;
          title: string;
          body: string;
          is_pinned: boolean;
          is_locked: boolean;
          is_deleted: boolean;
          reply_count: number;
          last_reply_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          category_id: string;
          title: string;
          body: string;
          is_pinned?: boolean;
          is_locked?: boolean;
          is_deleted?: boolean;
          reply_count?: number;
          last_reply_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          category_id?: string;
          title?: string;
          body?: string;
          is_pinned?: boolean;
          is_locked?: boolean;
          is_deleted?: boolean;
          reply_count?: number;
          last_reply_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      community_replies: {
        Row: {
          id: string;
          discussion_id: string;
          author_id: string;
          body: string;
          is_deleted: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          discussion_id: string;
          author_id: string;
          body: string;
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          discussion_id?: string;
          author_id?: string;
          body?: string;
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      community_likes: {
        Row: {
          id: string;
          user_id: string;
          discussion_id: string | null;
          reply_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          discussion_id: string | null;
          reply_id: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          discussion_id?: string | null;
          reply_id?: string | null;
          created_at?: string;
        };
      };
      articles: {
        Row: {
          id: string;
          slug: string;
          title: string;
          excerpt: string | null;
          body: string;
          cover_url: string | null;
          area: string | null;
          author_name: string;
          author_role: string;
          is_published: boolean;
          published_at: string | null;
          read_min: number;
          related_course_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          excerpt?: string | null;
          body: string;
          cover_url?: string | null;
          area?: string | null;
          author_name?: string;
          author_role?: string;
          is_published?: boolean;
          published_at?: string | null;
          read_min?: number;
          related_course_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['articles']['Insert']>;
      };
      press_mentions: {
        Row: {
          id: string;
          title: string;
          source_name: string;
          source_url: string;
          source_logo: string | null;
          excerpt: string | null;
          published_at: string;
          is_published: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          source_name: string;
          source_url: string;
          source_logo?: string | null;
          excerpt?: string | null;
          published_at: string;
          is_published?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['press_mentions']['Insert']>;
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['favorites']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['favorites']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string | null;
          href: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at' | 'is_read'> & {
          id?: string;
          created_at?: string;
          is_read?: boolean;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
      course_reviews: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          rating: number;
          title: string | null;
          body: string | null;
          is_deleted: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          rating: number;
          title?: string | null;
          body?: string | null;
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          course_id?: string;
          rating?: number;
          title?: string | null;
          body?: string | null;
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

// Helper types per uso rapido
export type Course = Database['public']['Tables']['courses']['Row'];
export type Module = Database['public']['Tables']['modules']['Row'];
export type Lesson = Database['public']['Tables']['lessons']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type MuxStatus = Lesson['mux_status'];
export type Enrollment = Database['public']['Tables']['enrollments']['Row'];
export type Progress = Database['public']['Tables']['progress']['Row'];
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type QuizQuestion = Database['public']['Tables']['quiz_questions']['Row'];
export type QuizAttempt = Database['public']['Tables']['quiz_attempts']['Row'];
export type Certificate = Database['public']['Tables']['certificates']['Row'];
export type Favorite = Database['public']['Tables']['favorites']['Row'];
export type LiveSession = Database['public']['Tables']['live_sessions']['Row'];
export type LiveSessionBooking = Database['public']['Tables']['live_session_bookings']['Row'];
export type SessionRequest = Database['public']['Tables']['session_requests']['Row'];

// ── Dashboard UI Types ──────────────────────────────

export interface NavItem {
  href: string;
  label: string;
  iconKey: string;
  badge?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

/** All possible user roles in the platform */
export type UserRole = 'student' | 'admin' | 'docente' | 'tutor' | 'moderatore';

/** All possible subscription plans */
export type UserPlan = 'free' | 'pro' | 'team' | 'pa';

export interface DashboardUser {
  fullName: string;
  email: string;
  initials: string;
  role: UserRole;
  plan: UserPlan;
}

export type AccentColor = 'cyan' | 'amber' | 'rose' | 'emerald' | 'violet';

export interface StatCardData {
  label: string;
  value: number;
  color: AccentColor;
  change: string;
}

// ── Fase 2: Catalogo & Contenuti Types ──────────────

export type AreaCode = 'SW' | 'NL' | 'OB' | 'PG' | 'AI';

export type LevelCode = 'L1' | 'L2' | 'L3';

/** Extended lesson type — includes 'esercitazione' for UI display (not in DB schema yet) */
export type LessonType = 'video' | 'quiz' | 'material' | 'esercitazione';

export interface InstructorInfo {
  name: string;
  role: string;
  initials: string;
}

/** Course with computed/display fields for catalog and detail pages */
export interface CourseWithMeta {
  id: string;
  slug: string;
  title: string;
  description: string;
  area: AreaCode;
  level: LevelCode;
  priceSingle: number;
  isFree: boolean;
  durationMin: number;
  rating: number;
  reviewCount: number;
  enrolledCount: number;
  moduleCount: number;
  lessonCount: number;
  updatedAt: string;
  languages: string[];
  instructor: InstructorInfo;
  emoji: string;
  thumbnailUrl: string | null;
}

export interface ModuleWithLessons {
  id: string;
  courseId: string;
  title: string;
  orderNum: number;
  lessons: LessonDisplay[];
}

export interface LessonDisplay {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  orderNum: number;
  type: LessonType;
  durationSec: number | null;
  isPreview: boolean;
  status: 'completed' | 'active' | 'locked';
}

export interface CourseMaterial {
  title: string;
  format: string;
  sizeLabel: string;
}

export interface EnrolledCourse {
  courseId: string;
  slug: string;
  title: string;
  area: AreaCode;
  emoji: string;
  currentModule: string;
  progress: number;
  isCompleted: boolean;
}

export interface CertificateDisplay {
  id: string;
  courseName: string;
  issuedAt: string;
  verifyCode: string;
  emoji: string;
}

// ── Fase 3: Checkout API Types ──────────────────────

export interface CheckoutRequest {
  courseId: string;
  courseSlug: string;
  type: 'single' | 'pro_subscription' | 'free';
}

export interface CheckoutResponse {
  url: string;
}

export interface ApiError {
  error: string;
}

// ── Fase 4: Player & Progress Types ──────────────────

/** Lesson enriched with user's progress from the DB */
export interface LessonWithProgress {
  id: string;
  moduleId: string;
  title: string;
  orderNum: number;
  type: LessonType;
  muxPlaybackId: string | null;
  durationSec: number | null;
  isPreview: boolean;
  completed: boolean;
  watchTimeSec: number;
}

/** Module with lessons that include real progress status */
export interface ModuleWithLessonsAndProgress {
  id: string;
  courseId: string;
  title: string;
  orderNum: number;
  lessons: LessonWithProgress[];
}

/** Data fetched server-side for the learn/[courseId] overview page */
export interface CourseLearnOverview {
  course: Course;
  modules: ModuleWithLessonsAndProgress[];
  totalLessons: number;
  completedLessons: number;
  firstIncompleteLessonId: string | null;
}

/** Navigation context for prev/next lesson */
export interface LessonNavigation {
  prevLesson: { id: string; title: string } | null;
  nextLesson: { id: string; title: string } | null;
  currentIndex: number;
  totalCount: number;
}

/** Full lesson data for the lesson page (server-side) */
export interface LessonPageData {
  lesson: LessonWithProgress;
  moduleName: string;
  courseName: string;
  courseSlug: string;
  navigation: LessonNavigation;
  modules: ModuleWithLessonsAndProgress[];
}

/** Request body for POST /api/progress */
export interface ProgressUpdateRequest {
  lessonId: string;
  completed?: boolean;
  watchTimeSec?: number;
}

/** Response body for POST /api/progress */
export interface ProgressUpdateResponse {
  success: boolean;
  allCompleted?: boolean;
}

// ── Fase 5: Quiz & Certificati Types ──────────────────

/** Answer submitted by the user for a single quiz question */
export interface QuizAnswer {
  questionId: string;
  selectedIndex: number;
}

/** Request body for POST /api/quiz/submit */
export interface QuizSubmitRequest {
  lessonId: string;
  answers: QuizAnswer[];
}

/** Response body for POST /api/quiz/submit */
export interface QuizSubmitResponse {
  success: boolean;
  score: number;
  total: number;
  passed: boolean;
  correctAnswers: Record<string, number>;
}

/** Request body for POST /api/certificati/generate */
export interface CertificateGenerateRequest {
  courseId: string;
}

/** Response body for POST /api/certificati/generate */
export interface CertificateGenerateResponse {
  success: boolean;
  certificateId: string;
  verifyCode: string;
}

/** Question displayed to the user (options without is_correct) */
export interface QuizQuestionDisplay {
  id: string;
  question: string;
  options: string[];
  orderNum: number | null;
}

// ── Sessioni Live Types ──────────────────────────────

export type LiveSessionType = 'webinar' | 'mentoring';
export type LiveSessionStatus = 'scheduled' | 'live' | 'ended' | 'canceled';
export type BookingStatus = 'confirmed' | 'canceled';

/** Public-facing session data (excludes mux_stream_key) */
export interface LiveSessionPublic {
  id: string;
  type: LiveSessionType;
  title: string;
  description: string | null;
  hostName: string;
  scheduledAt: string;
  durationMin: number;
  maxParticipants: number | null;
  status: LiveSessionStatus;
  muxPlaybackId: string | null;
  meetingUrl: string | null;
  muxReplayPlaybackId: string | null;
  isPublished: boolean;
  createdAt: string;
}

/** Session card display data with computed fields */
export interface LiveSessionDisplay {
  id: string;
  type: LiveSessionType;
  title: string;
  description: string | null;
  hostName: string;
  scheduledAt: string;
  durationMin: number;
  status: LiveSessionStatus;
  bookedCount: number;
  maxParticipants: number | null;
  isBooked: boolean;
  hasReplay: boolean;
}

/** Booking API request/response */
export interface BookSessionRequest {
  sessionId: string;
}

export interface BookSessionResponse {
  success: boolean;
  bookingId: string;
}

/** Join session API response */
export interface JoinSessionResponse {
  type: LiveSessionType;
  playbackToken?: string;
  thumbnailToken?: string;
  storyboardToken?: string;
  playbackId?: string;
  meetingUrl?: string;
}

/** Admin: create session request */
export interface CreateLiveSessionRequest {
  type: LiveSessionType;
  title: string;
  description?: string;
  hostName: string;
  scheduledAt: string;
  durationMin?: number;
  maxParticipants?: number;
  meetingUrl?: string;
}

/** Admin: create session response (includes stream key for webinars) */
export interface CreateLiveSessionResponse {
  session: LiveSessionPublic;
  streamKey?: string;
  rtmpUrl?: string;
}

// ── Session Request Types ──────────────────────────────

export type SessionRequestSlot = 'mattina' | 'pomeriggio' | 'sera';
export type SessionRequestStatus = 'pending' | 'confirmed' | 'proposed' | 'declined' | 'canceled';

/** User-facing session request display */
export interface SessionRequestDisplay {
  id: string;
  topic: string;
  description: string | null;
  preferredWeek: string;
  preferredSlot: SessionRequestSlot;
  status: SessionRequestStatus;
  adminNote: string | null;
  sessionId: string | null;
  createdAt: string;
}

/** Create session request payload */
export interface CreateSessionRequestPayload {
  topic: string;
  description?: string;
  preferredWeek: string;
  preferredSlot: SessionRequestSlot;
}

/** Admin: respond to session request */
export interface RespondSessionRequestPayload {
  status: 'confirmed' | 'proposed' | 'declined';
  adminNote?: string;
  /** For 'confirmed': the created session ID */
  sessionId?: string;
  /** For 'proposed': alternative date/time suggestion */
  proposedDate?: string;
  proposedSlot?: SessionRequestSlot;
}

// ── Community Types ──────────────────────────────────

export type CommunityCategory = Database['public']['Tables']['community_categories']['Row'];
export type CommunityDiscussion = Database['public']['Tables']['community_discussions']['Row'];
export type CommunityReply = Database['public']['Tables']['community_replies']['Row'];
export type CommunityLike = Database['public']['Tables']['community_likes']['Row'];

export type CommunityCategoryId = AreaCode | 'generale';

/** Author info displayed in community posts and replies */
export interface CommunityAuthor {
  id: string;
  displayName: string;
  initials: string;
  plan: UserPlan;
  certificateCount: number;
}

/** Category with computed discussion count for the hub grid */
export interface CommunityCategoryDisplay {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  orderNum: number;
  emoji: string | null;
  discussionCount: number;
  latestDiscussionTitle: string | null;
  latestDiscussionAt: string | null;
}

/** Discussion card in feed/list view */
export interface CommunityDiscussionDisplay {
  id: string;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  title: string;
  body: string;
  isPinned: boolean;
  isLocked: boolean;
  replyCount: number;
  likeCount: number;
  isLikedByUser: boolean;
  lastReplyAt: string | null;
  createdAt: string;
  author: CommunityAuthor;
}

/** Single reply in a discussion thread */
export interface CommunityReplyDisplay {
  id: string;
  discussionId: string;
  body: string;
  likeCount: number;
  isLikedByUser: boolean;
  createdAt: string;
  author: CommunityAuthor;
}

/** API payload: create a new discussion */
export interface CreateDiscussionPayload {
  categoryId: string;
  title: string;
  body: string;
}

/** API payload: create a reply */
export interface CreateReplyPayload {
  discussionId: string;
  body: string;
}

/** API payload: toggle like on a discussion or reply */
export interface ToggleLikePayload {
  discussionId?: string;
  replyId?: string;
}

/** API response: toggle like result */
export interface ToggleLikeResponse {
  liked: boolean;
  count: number;
}

// ── Course Reviews Types ──────────────────────────────────

export type CourseReview = Database['public']['Tables']['course_reviews']['Row'];

/** Review author info displayed alongside a review */
export interface ReviewAuthor {
  id: string;
  displayName: string;
  initials: string;
}

/** Review displayed in the course detail page */
export interface CourseReviewDisplay {
  id: string;
  courseId: string;
  rating: number;
  title: string | null;
  body: string | null;
  createdAt: string;
  author: ReviewAuthor;
}

/** API payload: create or update a review */
export interface CreateReviewPayload {
  courseId: string;
  rating: number;
  title?: string;
  body?: string;
}

/** API response: review created/updated */
export interface CreateReviewResponse {
  success: boolean;
  reviewId: string;
}

/** Aggregated review stats for a course */
export interface CourseReviewStats {
  avgRating: number;
  reviewCount: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

// ── Risorse (Blog + Press) Types ──────────────────────────

export type Article = Database['public']['Tables']['articles']['Row'];
export type PressMention = Database['public']['Tables']['press_mentions']['Row'];

/** Article card for the risorse hub listing */
export interface ArticleDisplay {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverUrl: string | null;
  area: AreaCode | null;
  authorName: string;
  authorRole: string;
  publishedAt: string;
  readMin: number;
  relatedCourseSlug: string | null;
}

/** Full article for detail page */
export interface ArticleDetail extends ArticleDisplay {
  body: string;
  relatedCourseTitle: string | null;
}

/** Press mention card for the risorse hub */
export interface PressMentionDisplay {
  id: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  sourceLogo: string | null;
  excerpt: string | null;
  publishedAt: string;
}

// ── Notifications Types ─────────────────────────────────

export type NotificationType =
  | 'welcome'
  | 'purchase_confirmed'
  | 'subscription_activated'
  | 'subscription_canceled'
  | 'certificate_issued'
  | 'session_booked'
  | 'session_reminder'
  | 'session_canceled'
  | 'enrollment_granted'
  | 'refund_processed'
  | 'admin_message';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  href: string | null;
  is_read: boolean;
  created_at: string;
}

// ── Admin Panel Types ───────────────────────────────────

/** Overview stats for the admin dashboard */
export interface AdminOverviewStats {
  totalUsers: number;
  activeEnrollments: number;
  publishedCourses: number;
  totalCourses: number;
  pendingSessionRequests: number;
  recentEnrollments: AdminRecentEnrollment[];
}

/** A recent enrollment entry for the admin dashboard feed */
export interface AdminRecentEnrollment {
  id: string;
  userEmail: string;
  userName: string;
  courseTitle: string;
  accessType: string;
  createdAt: string;
}

/** Admin course list item */
export interface AdminCourseListItem {
  id: string;
  slug: string;
  title: string;
  area: AreaCode;
  level: LevelCode;
  priceSingle: number;
  isFree: boolean;
  status: CourseStatus;
  enrolledCount: number;
  moduleCount: number;
  lessonCount: number;
  createdAt: string;
}

/** Admin course detail with modules and lessons */
export interface AdminCourseDetail {
  course: Course;
  modules: AdminModuleWithLessons[];
}

/** Module with nested lessons for admin */
export interface AdminModuleWithLessons {
  id: string;
  courseId: string;
  title: string;
  orderNum: number;
  lessons: AdminLessonDetail[];
}

/** Lesson detail for admin views */
export interface AdminLessonDetail {
  id: string;
  moduleId: string;
  title: string;
  orderNum: number;
  type: LessonType;
  muxPlaybackId: string | null;
  muxAssetId: string | null;
  muxStatus: string;
  durationSec: number | null;
  isPreview: boolean;
  quizQuestionCount: number;
  materialUrl: string | null;
}

/** Payload for creating a course */
export interface CreateCoursePayload {
  title: string;
  slug: string;
  description?: string;
  area: AreaCode;
  level: LevelCode;
  priceSingle: number;
  isFree: boolean;
  thumbnailUrl?: string;
  stripePriceId?: string;
}

/** Payload for creating a module */
export interface CreateModulePayload {
  courseId: string;
  title: string;
}

/** Payload for creating a lesson */
export interface CreateLessonPayload {
  moduleId: string;
  title: string;
  type: LessonType;
  isPreview?: boolean;
}

/** Payload for reordering items (modules or lessons) */
export interface ReorderPayload {
  items: { id: string; orderNum: number }[];
}

/** Admin user list item */
export interface AdminUserListItem {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  plan: UserPlan;
  enrollmentCount: number;
  createdAt: string;
}

/** Admin user detail */
export interface AdminUserDetail {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  plan: UserPlan;
  enrollments: AdminEnrollmentItem[];
  subscription: Subscription | null;
  certificates: Certificate[];
  courseProgress: AdminCourseProgress[];
}

/** Enrollment item for admin views */
export interface AdminEnrollmentItem {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  courseId: string;
  courseTitle: string;
  accessType: string;
  expiresAt: string | null;
  createdAt: string;
}

/** Course progress summary for admin user detail */
export interface AdminCourseProgress {
  courseId: string;
  courseTitle: string;
  completedLessons: number;
  totalLessons: number;
  percentage: number;
}

/** Payload for manually granting enrollment */
export interface GrantEnrollmentPayload {
  userId: string;
  courseId: string;
  accessType: 'free' | 'single' | 'pro_subscription';
  expiresAt?: string;
}

/** Admin analytics overview */
export interface AdminAnalyticsOverview {
  totalRevenue: number;
  mrr: number;
  activeUsers: number;
  newEnrollments: number;
  completionRate: number;
  enrollmentTrend: { date: string; count: number }[];
  userGrowth: { date: string; count: number }[];
}

/** Course completion rate for analytics */
export interface CourseCompletionRate {
  courseId: string;
  courseTitle: string;
  enrolledCount: number;
  completedCount: number;
  completionRate: number;
}

// ── Coupon Management Types ─────────────────────────────

/** Admin coupon list item (Stripe promotion code + coupon) */
export interface AdminCouponListItem {
  id: string;
  code: string;
  couponId: string;
  percentOff: number | null;
  amountOff: number | null;
  currency: string | null;
  duration: 'once' | 'repeating' | 'forever';
  durationInMonths: number | null;
  maxRedemptions: number | null;
  timesRedeemed: number;
  expiresAt: string | null;
  active: boolean;
}

/** Payload for creating a coupon */
export interface CreateCouponPayload {
  code: string;
  discountType: 'percent' | 'amount';
  percentOff?: number;
  amountOff?: number;
  duration: 'once' | 'repeating' | 'forever';
  durationInMonths?: number;
  maxRedemptions?: number;
  expiresAt?: string;
}

// ── Communication Types ─────────────────────────────────

/** Payload for sending a communication email */
export interface SendCommunicationPayload {
  subject: string;
  body: string;
  recipientType: 'all' | 'course';
  courseId?: string;
}

/** Response from communication send */
export interface SendCommunicationResponse {
  success: boolean;
  sentCount: number;
}

// ── User Management Types ─────────────────────────────────

/** Payload for creating a new user from admin */
export interface CreateUserPayload {
  email: string;
  fullName: string;
  password: string;
  role: UserRole;
  plan?: UserPlan;
}

/** Payload for updating a user's plan from admin */
export interface UpdatePlanPayload {
  plan: UserPlan;
}
