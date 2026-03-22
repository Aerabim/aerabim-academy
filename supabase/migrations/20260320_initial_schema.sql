-- AerACADEMY — Full initial schema
-- Applied: 2026-03-20
-- Includes: all tables from ARCHITECTURE.md + profiles + mux_status + RLS policies
-- This migration was applied via Supabase MCP on project jwsmntmsrmaybicpglmc

-- courses
CREATE TABLE courses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  area          TEXT NOT NULL,
  level         TEXT NOT NULL,
  price_single  INTEGER DEFAULT 0,
  is_free       BOOLEAN DEFAULT FALSE,
  is_published  BOOLEAN DEFAULT FALSE,
  thumbnail_url TEXT,
  duration_min  INTEGER,
  stripe_price_id TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- modules
CREATE TABLE modules (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id  UUID REFERENCES courses(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  order_num  INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- lessons (includes mux_status from Phase 4)
CREATE TABLE lessons (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id        UUID REFERENCES modules(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  order_num        INTEGER NOT NULL,
  type             TEXT NOT NULL,
  mux_playback_id  TEXT,
  mux_asset_id     TEXT,
  mux_status       TEXT DEFAULT 'pending' CONSTRAINT lessons_mux_status_check CHECK (mux_status IN ('pending', 'processing', 'ready', 'errored')),
  duration_sec     INTEGER,
  is_preview       BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- enrollments
CREATE TABLE enrollments (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id                UUID REFERENCES courses(id) ON DELETE CASCADE,
  access_type              TEXT NOT NULL,
  stripe_payment_intent_id TEXT,
  expires_at               TIMESTAMPTZ,
  created_at               TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- progress
CREATE TABLE progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id       UUID REFERENCES lessons(id) ON DELETE CASCADE,
  completed       BOOLEAN DEFAULT FALSE,
  watch_time_sec  INTEGER DEFAULT 0,
  completed_at    TIMESTAMPTZ,
  UNIQUE(user_id, lesson_id)
);

-- subscriptions
CREATE TABLE subscriptions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id     TEXT NOT NULL,
  status                 TEXT NOT NULL,
  plan                   TEXT NOT NULL,
  current_period_end     TIMESTAMPTZ,
  created_at             TIMESTAMPTZ DEFAULT now()
);

-- quiz_questions
CREATE TABLE quiz_questions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id  UUID REFERENCES lessons(id) ON DELETE CASCADE,
  question   TEXT NOT NULL,
  options    JSONB NOT NULL,
  order_num  INTEGER
);

-- quiz_attempts
CREATE TABLE quiz_attempts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id  UUID REFERENCES lessons(id) ON DELETE CASCADE,
  answers    JSONB NOT NULL,
  score      INTEGER,
  passed     BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- certificates
CREATE TABLE certificates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id    UUID REFERENCES courses(id) ON DELETE CASCADE,
  verify_code  TEXT UNIQUE NOT NULL,
  issued_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- profiles (admin roles)
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT profiles_role_check CHECK (role IN ('student', 'admin'))
);

-- =============================================
-- Row Level Security
-- =============================================

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- courses: public read for published
CREATE POLICY "Public can read published courses"
  ON courses FOR SELECT
  USING (is_published = true);

-- modules: public read (joined via published course)
CREATE POLICY "Public can read modules"
  ON modules FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM courses WHERE courses.id = modules.course_id AND courses.is_published = true
  ));

-- lessons: public can read preview lessons of published courses
CREATE POLICY "Public can read preview lessons"
  ON lessons FOR SELECT
  USING (
    is_preview = true
    AND EXISTS (
      SELECT 1 FROM modules
      JOIN courses ON courses.id = modules.course_id
      WHERE modules.id = lessons.module_id AND courses.is_published = true
    )
  );

-- lessons: enrolled users can read all lessons
CREATE POLICY "Enrolled users can read lessons"
  ON lessons FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM modules
    JOIN courses ON courses.id = modules.course_id
    JOIN enrollments ON enrollments.course_id = courses.id
    WHERE modules.id = lessons.module_id
      AND enrollments.user_id = auth.uid()
      AND (enrollments.expires_at IS NULL OR enrollments.expires_at > now())
  ));

-- enrollments: user reads own
CREATE POLICY "Users can read own enrollments"
  ON enrollments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- subscriptions: user reads own
CREATE POLICY "Users can read own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- progress: user reads/writes own
CREATE POLICY "Users can read own progress"
  ON progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own progress"
  ON progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- quiz_questions: readable by authenticated users
CREATE POLICY "Users can read quiz questions"
  ON quiz_questions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM lessons WHERE lessons.id = quiz_questions.lesson_id
  ));

-- quiz_attempts: user reads/writes own
CREATE POLICY "Users can read own quiz attempts"
  ON quiz_attempts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz attempts"
  ON quiz_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- certificates: user reads own
CREATE POLICY "Users can read own certificates"
  ON certificates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- profiles: user reads own
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
