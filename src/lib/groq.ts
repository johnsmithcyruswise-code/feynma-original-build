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

export const analyzeExplanation = async (explanation: string): Promise<DiagnosticResult> => {
  const trimmed = explanation.trim();
  if (!trimmed) {
    throw new Error('Please type or speak an explanation first.');
  }

  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ explanation: trimmed }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error || `Analysis request failed with status ${response.status}`);
  }

  const data = await response.json();
  const rawScore = Number(data.clarity_score);
  const clarity_score = isNaN(rawScore) ? 50 : Math.min(100, Math.max(0, Math.round(rawScore)));

  return {
    clarity_score,
    jargon_flags: Array.isArray(data.jargon_flags) ? data.jargon_flags : [],
    gap: data.gap || 'No core conceptual gap was identified.',
    analogy: data.analogy || 'No analogy provided.',
    feedback_spoken: data.feedback_spoken || '',
  };
};
