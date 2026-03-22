// Tipi TypeScript globali per AerACADEMY
// Questo file verrà popolato con i tipi generati da Supabase CLI (npx supabase gen types)

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
          is_published: boolean;
          thumbnail_url: string | null;
          duration_min: number | null;
          stripe_price_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['courses']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
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
          role: 'student' | 'admin';
          created_at: string;
        };
        Insert: {
          id: string;
          role?: 'student' | 'admin';
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
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

export interface DashboardUser {
  fullName: string;
  email: string;
  initials: string;
  plan: 'free' | 'pro' | 'team' | 'pa';
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
  enrolledCount: number;
  moduleCount: number;
  lessonCount: number;
  updatedAt: string;
  languages: string[];
  instructor: InstructorInfo;
  emoji: string;
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
