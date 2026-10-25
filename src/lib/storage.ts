import { supabase } from '../utils/supabase/client';
import { DiagnosticResult, JargonFlag } from './groq';

export interface ConceptItem {
  id: string;
  title: string;
  domain: string;
  tests_taken: number;
  status: string;
  clarity_score: number;
  gap_note?: string;
  summary?: string;
  mastery_level?: number;
  difficulty?: string;
  synthesized_sources?: string[];
  perspectives?: Record<string, any>;
  jargon_crutches?: any[];
  validated_analogies?: any[];
  insights?: any[];
  user_id?: string | null;
  is_public?: boolean;
  created_at: string;
  updated_at: string;
}

export interface VoiceProbeItem {
  id: string;
  concept_id: string;
  user_id?: string | null;
  transcript: string;
  duration?: string;
  clarity_score: number;
  flagged_jargon?: JargonFlag[];
  validated_analogies?: any[];
  recommendation?: string;
  created_at: string;
}

export interface ReviewQueueItem {
  id: string;
  concept_id: string;
  concept_title: string;
  user_id?: string | null;
  card_snippet?: string;
  interval_days: number;
  repetition_count: number;
  next_review_due: string; // ISO date string or YYYY-MM-DD
  created_at: string;
}

export const SEED_CONCEPT_IDS = [
  'quantum-decoherence',
  'gradient-descent',
  'hebbian-plasticity',
  'byzantine-fault-tolerance',
];

const ANON_CONCEPTS_KEY = 'feynma_anon_concepts';
const ANON_PROBES_KEY = 'feynma_anon_probes';
const ANON_QUEUE_KEY = 'feynma_anon_queue';

// Local storage read/writes
export const getAnonConcepts = (): ConceptItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ANON_CONCEPTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveAnonConcept = (concept: ConceptItem): void => {
  const existing = getAnonConcepts();
  const index = existing.findIndex((c) => c.id === concept.id);
  const updated = index >= 0 ? existing.map((c) => (c.id === concept.id ? concept : c)) : [concept, ...existing];
  localStorage.setItem(ANON_CONCEPTS_KEY, JSON.stringify(updated));
};

export const deleteAnonConcept = (conceptId: string): void => {
  const existing = getAnonConcepts();
  localStorage.setItem(ANON_CONCEPTS_KEY, JSON.stringify(existing.filter((c) => c.id !== conceptId)));
  const probes = getAnonProbes();
  localStorage.setItem(ANON_PROBES_KEY, JSON.stringify(probes.filter((p) => p.concept_id !== conceptId)));
  const queue = getAnonQueue();
  localStorage.setItem(ANON_QUEUE_KEY, JSON.stringify(queue.filter((q) => q.concept_id !== conceptId)));
};

export const getAnonProbes = (): VoiceProbeItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ANON_PROBES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveAnonProbe = (probe: VoiceProbeItem): void => {
  const existing = getAnonProbes();
  localStorage.setItem(ANON_PROBES_KEY, JSON.stringify([probe, ...existing]));
};

export const getAnonQueue = (): ReviewQueueItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ANON_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveAnonQueueItem = (item: ReviewQueueItem): void => {
  const existing = getAnonQueue();
  const index = existing.findIndex((q) => q.concept_id === item.concept_id);
  const updated = index >= 0 ? existing.map((q) => (q.concept_id === item.concept_id ? item : q)) : [item, ...existing];
  localStorage.setItem(ANON_QUEUE_KEY, JSON.stringify(updated));
};

// Real streak calculation
export const computeStreak = (createdDates: string[]): number => {
  if (!createdDates || createdDates.length === 0) return 0;

  const toLocalDateString = (iso: string) => {
    try {
      const dt = new Date(iso);
      if (isNaN(dt.getTime())) return '';
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    } catch {
      return '';
    }
  };

  const dayStrings = Array.from(
    new Set(createdDates.map(toLocalDateString).filter(Boolean))
  ).sort().reverse();

  if (dayStrings.length === 0) return 0;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  let streak = 0;
  let cursor = new Date(now);

  if (dayStrings[0] === todayStr) {
    streak = 1;
    cursor.setDate(now.getDate() - 1);
  } else if (dayStrings[0] === yesterdayStr) {
    streak = 1;
    cursor.setDate(now.getDate() - 2);
  } else {
    return 0;
  }

  while (true) {
    const targetStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    if (dayStrings.includes(targetStr)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

// Sync anonymous concepts to Supabase
export const syncAnonDataToSupabase = async (userId: string): Promise<number> => {
  const anonConcepts = getAnonConcepts();
  const anonProbes = getAnonProbes();
  const anonQueue = getAnonQueue();

  if (anonConcepts.length === 0 && anonProbes.length === 0) return 0;

  // Insert concepts
  for (const c of anonConcepts) {
    await supabase.from('concepts').upsert({
      id: c.id,
      user_id: userId,
      title: c.title,
      domain: c.domain,
      tests_taken: c.tests_taken,
      status: c.status,
      clarity_score: c.clarity_score,
      gap_note: c.gap_note || null,
      summary: c.summary || null,
      mastery_level: c.mastery_level || 50,
      difficulty: c.difficulty || 'Intermediate',
      is_public: false,
      created_at: c.created_at,
      updated_at: new Date().toISOString(),
    });
  }

  // Insert probes
  for (const p of anonProbes) {
    await supabase.from('voice_probes').upsert({
      id: p.id,
      concept_id: p.concept_id,
      user_id: userId,
      transcript: p.transcript,
      clarity_score: p.clarity_score,
      flagged_jargon: p.flagged_jargon || [],
      recommendation: p.recommendation || null,
      created_at: p.created_at,
    });
  }

  // Insert queue items
  for (const q of anonQueue) {
    await supabase.from('review_queue').upsert({
      id: q.id,
      concept_id: q.concept_id,
      concept_title: q.concept_title,
      user_id: userId,
      interval_days: q.interval_days || 1,
      repetition_count: q.repetition_count || 1,
      next_review_due: q.next_review_due,
      card_snippet: q.card_snippet || null,
      created_at: q.created_at,
    });
  }

  const count = anonConcepts.length;
  // Clear local storage after successful sync
  localStorage.removeItem(ANON_CONCEPTS_KEY);
  localStorage.removeItem(ANON_PROBES_KEY);
  localStorage.removeItem(ANON_QUEUE_KEY);

  return count;
};
