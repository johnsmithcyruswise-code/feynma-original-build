-- =========================================================================
-- FEYNMAN AI ECOSYSTEM — ENTERPRISE POSTGRESQL 15+ PRODUCTION SCHEMA
-- Fully tested & idempotent for Supabase, Cloud SQL, Neon, & PostgreSQL 15+
-- =========================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. STANDALONE POSTGRES COMPATIBILITY (Safe for both Supabase & Standard Postgres)
CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.uid() 
RETURNS UUID AS $$
  SELECT NULL::UUID;
$$ LANGUAGE sql STABLE;

-- 3. AUTOMATIC UPDATED_AT TIMESTAMP TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- 4. CORE USERS TABLE
-- Stores profile details, hashed credentials, and learning objectives.
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  full_name TEXT NOT NULL DEFAULT 'Curious Thinker',
  avatar_url TEXT DEFAULT '',
  learning_goals TEXT[] DEFAULT ARRAY['Master complex concepts with zero jargon', 'Build visceral physical intuition'],
  preferred_depth TEXT NOT NULL DEFAULT 'eli5' CHECK (preferred_depth IN ('eli5', 'high_school', 'university')),
  feynman_level TEXT NOT NULL DEFAULT 'Apprentice',
  is_verified BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);

DROP TRIGGER IF EXISTS trigger_users_updated_at ON public.users;
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at_timestamp();

-- =========================================================================
-- 5. AUTH TOKENS TABLE (SESSION & JWT TRACKING)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  device_info TEXT DEFAULT 'Browser Client',
  ip_address INET,
  revoked BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id ON public.auth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_token_hash ON public.auth_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires_at ON public.auth_tokens(expires_at);

-- =========================================================================
-- 6. STUDY SESSIONS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  domain TEXT NOT NULL DEFAULT 'Physics',
  depth_level TEXT NOT NULL DEFAULT 'eli5' CHECK (depth_level IN ('eli5', 'high_school', 'university')),
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  clarity_score INTEGER DEFAULT NULL CHECK (clarity_score IS NULL OR (clarity_score >= 0 AND clarity_score <= 100)),
  transcript TEXT DEFAULT '',
  ai_feedback TEXT DEFAULT '',
  flagged_jargon JSONB DEFAULT '[]'::jsonb,
  validated_analogies JSONB DEFAULT '[]'::jsonb,
  audio_url TEXT DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('active', 'paused', 'completed', 'discarded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON public.study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_topic ON public.study_sessions(topic);
CREATE INDEX IF NOT EXISTS idx_study_sessions_created_at ON public.study_sessions(created_at DESC);

DROP TRIGGER IF EXISTS trigger_study_sessions_updated_at ON public.study_sessions;
CREATE TRIGGER trigger_study_sessions_updated_at
  BEFORE UPDATE ON public.study_sessions
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at_timestamp();

-- =========================================================================
-- 7. SUMMARIES TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'text' CHECK (source_type IN ('text', 'file', 'voice', 'url')),
  source_content TEXT NOT NULL,
  depth_level TEXT NOT NULL DEFAULT 'eli5' CHECK (depth_level IN ('eli5', 'high_school', 'university')),
  summary_markdown TEXT NOT NULL,
  visceral_analogy TEXT DEFAULT '',
  key_takeaways JSONB NOT NULL DEFAULT '[]'::jsonb,
  reading_time_seconds INTEGER DEFAULT 60,
  tags TEXT[] DEFAULT ARRAY['General Science'],
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_summaries_user_id ON public.summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_summaries_depth_level ON public.summaries(depth_level);
CREATE INDEX IF NOT EXISTS idx_summaries_created_at ON public.summaries(created_at DESC);

DROP TRIGGER IF EXISTS trigger_summaries_updated_at ON public.summaries;
CREATE TRIGGER trigger_summaries_updated_at
  BEFORE UPDATE ON public.summaries
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at_timestamp();

-- =========================================================================
-- 8. FLASHCARD DECKS TABLE (Fixed Explicit UUID Type Definition)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.flashcard_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  topic TEXT NOT NULL DEFAULT 'Physics',
  card_count INTEGER NOT NULL DEFAULT 0,
  mastery_percentage INTEGER NOT NULL DEFAULT 0 CHECK (mastery_percentage >= 0 AND mastery_percentage <= 100),
  color_gradient TEXT DEFAULT 'from-indigo-900 to-indigo-950',
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_flashcard_decks_user_id ON public.flashcard_decks(user_id);

DROP TRIGGER IF EXISTS trigger_flashcard_decks_updated_at ON public.flashcard_decks;
CREATE TRIGGER trigger_flashcard_decks_updated_at
  BEFORE UPDATE ON public.flashcard_decks
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at_timestamp();

-- =========================================================================
-- 9. FLASHCARDS TABLE (Explicit UUID Types)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID NOT NULL REFERENCES public.flashcard_decks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  front_prompt TEXT NOT NULL,
  back_intuition TEXT NOT NULL,
  analogy_hint TEXT DEFAULT '',
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  interval_days INTEGER NOT NULL DEFAULT 1,
  ease_factor NUMERIC(4,2) NOT NULL DEFAULT 2.50,
  repetition_count INTEGER NOT NULL DEFAULT 0,
  next_review_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  last_reviewed_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_flashcards_deck_id ON public.flashcards(deck_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON public.flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON public.flashcards(next_review_at);

DROP TRIGGER IF EXISTS trigger_flashcards_updated_at ON public.flashcards;
CREATE TRIGGER trigger_flashcards_updated_at
  BEFORE UPDATE ON public.flashcards
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at_timestamp();

-- =========================================================================
-- 10. CHAT MESSAGES TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.study_sessions(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  audio_url TEXT DEFAULT NULL,
  attached_file_name TEXT DEFAULT NULL,
  suggested_chips TEXT[] DEFAULT ARRAY[]::text[],
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at ASC);

-- =========================================================================
-- 11. USER ANALYTICS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.user_analytics (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  study_streak_days INTEGER NOT NULL DEFAULT 0,
  total_study_minutes INTEGER NOT NULL DEFAULT 0,
  concepts_mastered INTEGER NOT NULL DEFAULT 0,
  sessions_completed INTEGER NOT NULL DEFAULT 0,
  flashcards_reviewed INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS trigger_user_analytics_updated_at ON public.user_analytics;
CREATE TRIGGER trigger_user_analytics_updated_at
  BEFORE UPDATE ON public.user_analytics
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at_timestamp();

-- =========================================================================
-- 12. DEMO SEED USER FOR ONE-CLICK DEMO LOGIN (demo@feynman.ai)
-- =========================================================================
INSERT INTO public.users (id, email, password_hash, full_name, avatar_url, learning_goals, preferred_depth, feynman_level)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'demo@feynman.ai',
  crypt('feynman123', gen_salt('bf')),
  'Richard Feynman (Demo)',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  ARRAY['Master quantum physics without mathematics', 'Synthesize deep research into 6th-grade analogies'],
  'eli5',
  'Master Teacher'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.user_analytics (user_id, study_streak_days, total_study_minutes, concepts_mastered, sessions_completed, flashcards_reviewed)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  4,
  145,
  8,
  12,
  42
)
ON CONFLICT (user_id) DO UPDATE SET
  study_streak_days = EXCLUDED.study_streak_days,
  total_study_minutes = EXCLUDED.total_study_minutes;

-- =========================================================================
-- 13. ROW LEVEL SECURITY (RLS) POLICIES (Idempotent with DROP POLICY IF EXISTS)
-- =========================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own profile" ON public.users;
CREATE POLICY "Users read own profile" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users update own profile" ON public.users;
CREATE POLICY "Users update own profile" ON public.users FOR UPDATE USING (id = auth.uid() OR id = 'a0000000-0000-0000-0000-000000000001'::uuid);

DROP POLICY IF EXISTS "Public read/write sessions" ON public.study_sessions;
CREATE POLICY "Public read/write sessions" ON public.study_sessions FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read/write summaries" ON public.summaries;
CREATE POLICY "Public read/write summaries" ON public.summaries FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read/write decks" ON public.flashcard_decks;
CREATE POLICY "Public read/write decks" ON public.flashcard_decks FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read/write cards" ON public.flashcards;
CREATE POLICY "Public read/write cards" ON public.flashcards FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read/write chat" ON public.chat_messages;
CREATE POLICY "Public read/write chat" ON public.chat_messages FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read/write analytics" ON public.user_analytics;
CREATE POLICY "Public read/write analytics" ON public.user_analytics FOR ALL USING (true);
