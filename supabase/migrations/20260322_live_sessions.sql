-- AerACADEMY — Live Sessions schema
-- Applied: 2026-03-22
-- Adds: live_sessions, live_session_bookings tables + RLS policies

-- live_sessions: stores both webinar (group) and mentoring (1-to-1) sessions
CREATE TABLE live_sessions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type                    TEXT NOT NULL CONSTRAINT live_sessions_type_check CHECK (type IN ('webinar', 'mentoring')),
  title                   TEXT NOT NULL,
  description             TEXT,
  host_name               TEXT NOT NULL,
  scheduled_at            TIMESTAMPTZ NOT NULL,
  duration_min            INTEGER NOT NULL DEFAULT 60,
  max_participants        INTEGER,
  status                  TEXT NOT NULL DEFAULT 'scheduled' CONSTRAINT live_sessions_status_check CHECK (status IN ('scheduled', 'live', 'ended', 'canceled')),
  -- Mux Live Stream fields (webinar only)
  mux_live_stream_id      TEXT,
  mux_playback_id         TEXT,
  mux_stream_key          TEXT,
  -- External meeting link (mentoring only)
  meeting_url             TEXT,
  -- Replay (webinar only, populated after stream ends)
  mux_replay_playback_id  TEXT,
  is_published            BOOLEAN DEFAULT FALSE,
  created_at              TIMESTAMPTZ DEFAULT now()
);

-- live_session_bookings: tracks user registrations for sessions
CREATE TABLE live_session_bookings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID REFERENCES live_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status        TEXT NOT NULL DEFAULT 'confirmed' CONSTRAINT bookings_status_check CHECK (status IN ('confirmed', 'canceled')),
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Index for querying upcoming sessions
CREATE INDEX idx_live_sessions_scheduled ON live_sessions (scheduled_at) WHERE is_published = true;

-- Index for querying user bookings
CREATE INDEX idx_live_session_bookings_user ON live_session_bookings (user_id, status);

-- =============================================
-- Row Level Security
-- =============================================

ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_session_bookings ENABLE ROW LEVEL SECURITY;

-- live_sessions: authenticated users can read published sessions
-- IMPORTANT: this policy selects specific columns — mux_stream_key is excluded in application queries
CREATE POLICY "Authenticated users can read published sessions"
  ON live_sessions FOR SELECT
  TO authenticated
  USING (is_published = true);

-- live_sessions: admins can read all sessions (including unpublished)
CREATE POLICY "Admins can read all sessions"
  ON live_sessions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- live_session_bookings: users can read own bookings
CREATE POLICY "Users can read own bookings"
  ON live_session_bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- live_session_bookings: users can insert own bookings
CREATE POLICY "Users can insert own bookings"
  ON live_session_bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- live_session_bookings: users can update own bookings (for cancellation)
CREATE POLICY "Users can update own bookings"
  ON live_session_bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
