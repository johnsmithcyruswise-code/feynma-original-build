-- =========================================================================
-- Feynma Studio — Bulletproof Schema Migration (Handles Existing Tables)
-- Run this in your Supabase Project: Dashboard -> SQL Editor -> New Query -> Run
-- =========================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Profiles Table (Linked to Supabase Auth & Google OAuth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  feynman_level TEXT DEFAULT 'Apprentice',
  study_streak_days INTEGER DEFAULT 1,
  total_voice_tests INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger to automatically create profile on Google Sign-In or Sign-Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Concepts Table
CREATE TABLE IF NOT EXISTS public.concepts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  domain TEXT NOT NULL DEFAULT 'Physics',
  tests_taken INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Needs Analogy Polish',
  clarity_score INTEGER NOT NULL DEFAULT 78,
  gap_note TEXT,
  summary TEXT,
  mastery_level INTEGER NOT NULL DEFAULT 60,
  difficulty TEXT NOT NULL DEFAULT 'Intermediate',
  synthesized_sources JSONB DEFAULT '[]'::jsonb,
  perspectives JSONB DEFAULT '{}'::jsonb,
  jargon_crutches JSONB DEFAULT '[]'::jsonb,
  validated_analogies JSONB DEFAULT '[]'::jsonb,
  insights JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Explicitly ensure `is_public` and `user_id` exist even if table was created in an earlier run:
ALTER TABLE public.concepts ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
ALTER TABLE public.concepts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Voice Probes Table
CREATE TABLE IF NOT EXISTS public.voice_probes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id TEXT REFERENCES public.concepts(id) ON DELETE CASCADE,
  transcript TEXT NOT NULL,
  duration TEXT NOT NULL DEFAULT '02:41',
  clarity_score INTEGER NOT NULL DEFAULT 75,
  flagged_jargon JSONB DEFAULT '[]'::jsonb,
  validated_analogies JSONB DEFAULT '[]'::jsonb,
  recommendation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.voice_probes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.voice_probes ADD COLUMN IF NOT EXISTS ai_tutor_response TEXT;

-- 5. Review Queue Table
CREATE TABLE IF NOT EXISTS public.review_queue (
  id TEXT PRIMARY KEY,
  concept_id TEXT NOT NULL,
  concept_title TEXT NOT NULL,
  card_snippet TEXT,
  interval_days INTEGER NOT NULL DEFAULT 1,
  repetition_count INTEGER NOT NULL DEFAULT 1,
  next_review_due TEXT DEFAULT 'Tomorrow',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.review_queue ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.review_queue ADD COLUMN IF NOT EXISTS ease_factor NUMERIC DEFAULT 2.5;

-- 6. Todos Table
CREATE TABLE IF NOT EXISTS public.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- =========================================================================
-- Enable Row Level Security (RLS) & Cleanly Re-create Policies
-- =========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_probes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first so rerun never errors
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;

DROP POLICY IF EXISTS "Public read concepts" ON public.concepts;
DROP POLICY IF EXISTS "Public insert concepts" ON public.concepts;
DROP POLICY IF EXISTS "Public update concepts" ON public.concepts;
DROP POLICY IF EXISTS "Public delete concepts" ON public.concepts;
DROP POLICY IF EXISTS "Read concepts" ON public.concepts;
DROP POLICY IF EXISTS "Insert concepts" ON public.concepts;
DROP POLICY IF EXISTS "Update own concepts" ON public.concepts;
DROP POLICY IF EXISTS "Delete own concepts" ON public.concepts;

DROP POLICY IF EXISTS "Public read voice_probes" ON public.voice_probes;
DROP POLICY IF EXISTS "Public insert voice_probes" ON public.voice_probes;
DROP POLICY IF EXISTS "Read voice_probes" ON public.voice_probes;
DROP POLICY IF EXISTS "Insert voice_probes" ON public.voice_probes;

DROP POLICY IF EXISTS "Public read review_queue" ON public.review_queue;
DROP POLICY IF EXISTS "Public insert review_queue" ON public.review_queue;
DROP POLICY IF EXISTS "Public update review_queue" ON public.review_queue;
DROP POLICY IF EXISTS "Public delete review_queue" ON public.review_queue;
DROP POLICY IF EXISTS "Read review_queue" ON public.review_queue;
DROP POLICY IF EXISTS "Insert review_queue" ON public.review_queue;
DROP POLICY IF EXISTS "Update review_queue" ON public.review_queue;
DROP POLICY IF EXISTS "Delete review_queue" ON public.review_queue;

DROP POLICY IF EXISTS "Public read todos" ON public.todos;
DROP POLICY IF EXISTS "Public insert todos" ON public.todos;
DROP POLICY IF EXISTS "Public update todos" ON public.todos;
DROP POLICY IF EXISTS "Public delete todos" ON public.todos;
DROP POLICY IF EXISTS "Read todos" ON public.todos;
DROP POLICY IF EXISTS "Insert todos" ON public.todos;
DROP POLICY IF EXISTS "Update todos" ON public.todos;
DROP POLICY IF EXISTS "Delete todos" ON public.todos;

-- Re-create clean RLS policies
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Read concepts" ON public.concepts FOR SELECT 
  USING (COALESCE(is_public, true) = true OR auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Insert concepts" ON public.concepts FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR auth.role() = 'anon');
CREATE POLICY "Update own concepts" ON public.concepts FOR UPDATE 
  USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Delete own concepts" ON public.concepts FOR DELETE 
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Read voice_probes" ON public.voice_probes FOR SELECT 
  USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Insert voice_probes" ON public.voice_probes FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR auth.role() = 'anon');

CREATE POLICY "Read review_queue" ON public.review_queue FOR SELECT 
  USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Insert review_queue" ON public.review_queue FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR auth.role() = 'anon');
CREATE POLICY "Update review_queue" ON public.review_queue FOR UPDATE 
  USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Delete review_queue" ON public.review_queue FOR DELETE 
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Read todos" ON public.todos FOR SELECT 
  USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Insert todos" ON public.todos FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR auth.role() = 'anon');
CREATE POLICY "Update todos" ON public.todos FOR UPDATE 
  USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Delete todos" ON public.todos FOR DELETE 
  USING (auth.uid() = user_id OR user_id IS NULL);

-- =========================================================================
-- Seed Core Concept Decks (With ON CONFLICT UPDATE)
-- =========================================================================

INSERT INTO public.concepts (
  id, title, domain, tests_taken, status, clarity_score, gap_note, summary, mastery_level, difficulty, is_public,
  synthesized_sources, perspectives, jargon_crutches, validated_analogies, insights
) VALUES (
  'quantum-decoherence',
  'Quantum Decoherence',
  'Physics',
  3,
  'Needs Analogy Polish',
  78,
  'Child-analogy missing for entropy leak',
  'Phase coherence dissipates into the environment, yielding classical probabilities without physical wave-function collapse.',
  64,
  'Advanced',
  true,
  '["Griffith''s QM (Ch. 5)", "Susskind: Theoretical Min.", "MIT 8.04 Lecture 14 Notes"]'::jsonb,
  '{
    "eli12": {
      "title": "Distilled Intuition",
      "quote": "Decoherence explains why we don’t observe Schrödinger’s cat in a superposition of dead and alive in macroscopic reality: environmental interference leaks phase information.",
      "analogyName": "The Drops in Ocean Analogy",
      "analogyText": "A neat wave packet dissipates completely when billions of ambient dust particles & photons collide with it, erasing quantum coherence."
    },
    "undergrad": {
      "title": "Thermal Open System Dissipation",
      "quote": "An open quantum system entangles with an infinite-bath Hamiltonian, tracing out environmental coordinates and zeroing off-diagonal density matrix elements on a timescale of 10⁻²³ seconds.",
      "analogyName": "Thermal Reservoir Damping",
      "analogyText": "Phase synchronization scatters irrecoverably into macroscopic entropy modes like ink dissolving in an active waterfall."
    },
    "formal": {
      "title": "Markovian Master Equation Proof",
      "quote": "Governed by the Lindblad equation dρ/dt = -i[H, ρ] + ∑ (L_k ρ L_k† - 1/2 {L_k† L_k, ρ}). The decoherence factor decays exponentially: exp(-γ t |x - x''|²).",
      "analogyName": "Off-Diagonal Nullification",
      "analogyText": "Pure state density matrix |ψ⟩⟨ψ| transforms into a mixed state diagonal matrix ∑ p_i |i⟩⟨i|."
    }
  }'::jsonb,
  '[
    {
      "id": "crutch-1",
      "term": "Wave function collapse",
      "timestamp": "01:14",
      "explanation": "You relied on textbook jargon without explaining macroscopic interaction causes irreversible phase loss.",
      "feynmanWarning": "Textbook labels hide that the detector is another quantum system with 10²³ chaotic degrees of freedom.",
      "suggestion": "the cloud of possibilities locking into one definite picture"
    },
    {
      "id": "crutch-2",
      "term": "Measurement apparatus",
      "timestamp": "01:48",
      "explanation": "Missing link: Density matrix off-diagonal elements decay (ρ_ij -> 0).",
      "feynmanWarning": "Interference fringes vanish because phase data leaks into thermal entanglements.",
      "suggestion": "trillions of chaotic light particles bumping the state"
    }
  ]'::jsonb,
  '[
    {
      "phrase": "Water ripples muddying neat information",
      "scoreBoost": 18,
      "reason": "Maps cleanly to environmental entanglement for a lay audience."
    }
  ]'::jsonb,
  '[
    {
      "num": "01",
      "title": "The Measurement Problem Dissected",
      "desc": "Decoherence does not \"collapse\" the wave function into one reality; rather, it renders alternate possibilities computationally unreachable by spreading phase data across countless environmental degrees of freedom.",
      "meta": "Timescale: ~10⁻²³ seconds",
      "status": "Concept Clear"
    },
    {
      "num": "02",
      "title": "Entanglement with the Environment",
      "desc": "Every stray cosmic ray, air molecule, and blackbody photon interacts with the open quantum system, transforming a pure state into an apparent statistical density matrix.",
      "meta": "Gaps Detected",
      "status": "Warning: Confused \"collapse\" with \"entanglement leakage\"",
      "hasGap": true
    },
    {
      "num": "03",
      "title": "Irreversible Entropy Leakage",
      "desc": "Because macroscopic surroundings have infinite degrees of freedom, the time required for Poincaré recurrence (coherence returning spontaneously) exceeds the lifespan of the universe.",
      "meta": "Poincaré Recurrence: >10¹⁰⁰ years",
      "status": "Concept Clear"
    }
  ]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  is_public = EXCLUDED.is_public,
  title = EXCLUDED.title,
  domain = EXCLUDED.domain,
  summary = EXCLUDED.summary,
  perspectives = EXCLUDED.perspectives;

INSERT INTO public.concepts (
  id, title, domain, tests_taken, status, clarity_score, gap_note, summary, mastery_level, difficulty, is_public
) VALUES (
  'gradient-descent',
  'Gradient Descent & Loss Surfaces',
  'Machine Learning',
  4,
  'Mastered (ELI5 Ready)',
  94,
  'Tested across 4 child personas',
  'Navigating multidimensional parameter terrain by computing negative partial derivatives to minimize error.',
  94,
  'Intermediate',
  true
) ON CONFLICT (id) DO UPDATE SET is_public = EXCLUDED.is_public;

INSERT INTO public.concepts (
  id, title, domain, tests_taken, status, clarity_score, gap_note, summary, mastery_level, difficulty, is_public
) VALUES (
  'hebbian-plasticity',
  'Hebbian Plasticity & LTP',
  'Neuroscience',
  1,
  'Needs Analogy Polish',
  62,
  'Target: Simple analogy for non-physicians',
  'Synaptic strength increases following persistent high-frequency presynaptic stimulation through calcium influx and AMPA receptor insertion.',
  58,
  'Advanced',
  true
) ON CONFLICT (id) DO UPDATE SET is_public = EXCLUDED.is_public;

INSERT INTO public.concepts (
  id, title, domain, tests_taken, status, clarity_score, gap_note, summary, mastery_level, difficulty, is_public
) VALUES (
  'byzantine-fault-tolerance',
  'Byzantine Fault Tolerance',
  'Distributed Systems',
  2,
  'Diagram Ready',
  88,
  'Oral test passed · Mental visual pending',
  'Reaching consensus across adversarial networks where nodes can deliberately broadcast contradictory messages.',
  88,
  'Intermediate',
  true
) ON CONFLICT (id) DO UPDATE SET is_public = EXCLUDED.is_public;

INSERT INTO public.review_queue (id, concept_id, concept_title, card_snippet, interval_days, repetition_count, next_review_due)
VALUES ('rev-1', 'quantum-decoherence', 'Quantum Decoherence', 'How macroscopic interaction causes irreversible phase loss without collapse.', 1, 4, 'Tomorrow')
ON CONFLICT (id) DO NOTHING;
