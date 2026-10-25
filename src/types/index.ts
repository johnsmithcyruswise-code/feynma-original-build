export interface Concept {
  id: string;
  title: string;
  domain: string;
  testsTaken: number;
  status: 'Needs Analogy Polish' | 'Mastered (ELI5 Ready)' | 'Diagram Ready' | '2 Critical Gaps';
  clarityScore: number;
  gapNote: string;
  summary: string;
  masteryLevel: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  synthesizedSources?: string[];
  analogyQuote?: string;
  jargonCrutchesIdentified?: string[];
  targetAudience?: string;
  rule?: string;
  promptTarget?: string;
  perspectives?: {
    eli12: {
      title: string;
      quote: string;
      analogyName: string;
      analogyText: string;
    };
    undergrad: {
      title: string;
      quote: string;
      analogyName: string;
      analogyText: string;
    };
    formal: {
      title: string;
      quote: string;
      analogyName: string;
      analogyText: string;
    };
  };
  jargonCrutches?: Array<{
    id: string;
    term: string;
    timestamp: string;
    explanation: string;
    feynmanWarning: string;
    suggestion: string;
  }>;
  validatedAnalogies?: Array<{
    phrase: string;
    scoreBoost: number;
    reason: string;
  }>;
  insights?: Array<{
    num: string;
    title: string;
    desc: string;
    meta: string;
    status: string;
    hasGap?: boolean;
  }>;
}

export interface ReviewItem {
  id: string;
  conceptId: string;
  conceptTitle: string;
  intervalDays: number;
  repetitionCount: number;
  nextReviewDue: string;
  cardSnippet: string;
}

export type ScreenTab = 'library' | 'explain' | 'diagrams' | 'review' | 'probe' | 'diagnostic';
