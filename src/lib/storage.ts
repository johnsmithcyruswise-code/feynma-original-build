export interface JargonFlag {
  term: string;
  why: string;
  simpler: string;
}

export interface DiagnosticResult {
  clarity_score: number;
  jargon_flags: JargonFlag[];
  gap: string;
  analogy: string;
  feedback_spoken: string;
}

export interface SavedConcept {
  id: string;
  explanation: string;
  title: string;
  domain: string;
  diagnostic: DiagnosticResult;
  review_count: number;
  created_at: string;
}

const STORAGE_KEY = 'feynma_saved_concepts_v2';

export const getSavedConcepts = (): SavedConcept[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read from localStorage:', err);
    return [];
  }
};

export const saveConcept = (
  explanation: string,
  diagnostic: DiagnosticResult,
  domain: string = 'Intuition'
): SavedConcept => {
  const existing = getSavedConcepts();
  const trimmed = explanation.trim();
  const title = trimmed.length > 40 ? trimmed.slice(0, 40) + '…' : trimmed || 'Untitled Explanation';

  const newConcept: SavedConcept = {
    id: 'concept-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    explanation: trimmed,
    title,
    domain,
    diagnostic,
    review_count: 1,
    created_at: new Date().toISOString(),
  };

  const updated = [newConcept, ...existing];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }

  return newConcept;
};

export const incrementReviewCount = (id: string): void => {
  const existing = getSavedConcepts();
  const updated = existing.map((c) =>
    c.id === id ? { ...c, review_count: (c.review_count || 1) + 1 } : c
  );
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to update review count:', err);
  }
};

export const deleteConcept = (id: string): void => {
  const existing = getSavedConcepts();
  const updated = existing.filter((c) => c.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete concept:', err);
  }
};

export const getConceptById = (id: string): SavedConcept | undefined => {
  const existing = getSavedConcepts();
  return existing.find((c) => c.id === id);
};
