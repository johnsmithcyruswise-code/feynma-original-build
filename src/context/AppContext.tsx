import React, { createContext, useContext, useState, useEffect } from 'react';
import { Concept, ReviewItem, ScreenTab } from '../types';
import { supabase } from '../utils/supabase/client';

interface AppContextType {
  currentScreen: ScreenTab;
  setCurrentScreen: (screen: ScreenTab) => void;
  selectedConceptId: string;
  setSelectedConceptId: (id: string) => void;
  concepts: Concept[];
  activeConcept: Concept;
  reviewQueue: ReviewItem[];
  addToReviewQueue: (snippet?: string) => Promise<void>;
  focusMode: boolean;
  toggleFocusMode: () => void;
  blindMode: boolean;
  toggleBlindMode: () => void;
  transcript: string;
  setTranscript: React.Dispatch<React.SetStateAction<string>>;
  clarityScore: number;
  setClarityScore: (score: number) => void;
  user: { id: string; email: string; name?: string; avatarUrl?: string } | null;
  setUser: (user: { id: string; email: string; name?: string; avatarUrl?: string } | null) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isNewProbeModalOpen: boolean;
  setIsNewProbeModalOpen: (open: boolean) => void;
  isMathRefresherOpen: boolean;
  setIsMathRefresherOpen: (open: boolean) => void;
  isDbStatusOpen: boolean;
  setIsDbStatusOpen: (open: boolean) => void;
  synthesizeNotes: (title: string, notes: string, domain: string) => Promise<void>;
  evaluateVoiceTranscript: (text: string) => Promise<any>;
  lastEvaluation: any;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const defaultConcepts: Concept[] = [
  {
    id: 'quantum-decoherence',
    title: 'Quantum Decoherence',
    domain: 'Physics',
    testsTaken: 3,
    status: 'Needs Analogy Polish',
    clarityScore: 78,
    gapNote: 'Child-analogy missing for entropy leak',
    summary: 'Phase coherence dissipates into the environment, yielding classical probabilities without physical wave-function collapse.',
    masteryLevel: 64,
    difficulty: 'Advanced',
    synthesizedSources: ["Griffith's QM (Ch. 5)", 'Susskind: Theoretical Min.', 'MIT 8.04 Lecture 14 Notes'],
    targetAudience: 'Sixth Grade Level',
    rule: 'Zero Jargon',
    promptTarget: 'Explain why quantum state fragility breaks down into everyday reality.',
    perspectives: {
      eli12: {
        title: 'Distilled Intuition',
        quote: 'Decoherence explains why we don’t observe Schrödinger’s cat in a superposition of dead and alive in macroscopic reality: environmental interference leaks phase information.',
        analogyName: 'The Drops in Ocean Analogy',
        analogyText: 'A neat wave packet dissipates completely when billions of ambient dust particles & photons collide with it, erasing quantum coherence.'
      },
      undergrad: {
        title: 'Thermal Open System Dissipation',
        quote: 'An open quantum system entangles with an infinite-bath Hamiltonian, tracing out environmental coordinates and zeroing off-diagonal density matrix elements on a timescale of 10⁻²³ seconds.',
        analogyName: 'Thermal Reservoir Damping',
        analogyText: 'Phase synchronization scatters irrecoverably into macroscopic entropy modes like ink dissolving in an active waterfall.'
      },
      formal: {
        title: 'Markovian Master Equation Proof',
        quote: 'Governed by the Lindblad equation dρ/dt = -i[H, ρ] + ∑ (L_k ρ L_k† - 1/2 {L_k† L_k, ρ}). The decoherence factor decays exponentially: exp(-γ t |x - x\'|²).',
        analogyName: 'Off-Diagonal Nullification',
        analogyText: 'Pure state density matrix |ψ⟩⟨ψ| transforms into a mixed state diagonal matrix ∑ p_i |i⟩⟨i|.'
      }
    },
    jargonCrutches: [
      {
        id: 'crutch-1',
        term: 'Wave function collapse',
        timestamp: '01:14',
        explanation: 'You relied on the phrase "measurement apparatus" without explaining how macroscopic interaction causes irreversible phase loss.',
        feynmanWarning: 'Using a textbook label hides the fact that the detector is simply another quantum system with 10²³ chaotic degrees of freedom.',
        suggestion: 'the cloud of possibilities locking into one definite picture'
      },
      {
        id: 'crutch-2',
        term: 'Measurement apparatus',
        timestamp: '01:48',
        explanation: 'Missing link: Density matrix off-diagonal elements decay (ρ_ij -> 0).',
        feynmanWarning: 'Interference fringes vanish because phase data leaks into thermal entanglements.',
        suggestion: 'trillions of chaotic particles bumping the state'
      }
    ],
    validatedAnalogies: [
      {
        phrase: 'Water ripples muddying neat information',
        scoreBoost: 18,
        reason: 'Maps cleanly to environmental entanglement for a lay audience.'
      }
    ],
    insights: [
      {
        num: '01',
        title: 'The Measurement Problem Dissected',
        desc: 'Decoherence does not "collapse" the wave function into one reality; rather, it renders alternate possibilities computationally unreachable by spreading phase data across countless environmental degrees of freedom.',
        meta: 'Timescale: ~10⁻²³ seconds',
        status: 'Concept Clear'
      },
      {
        num: '02',
        title: 'Entanglement with the Environment',
        desc: 'Every stray cosmic ray, air molecule, and blackbody photon interacts with the open quantum system, transforming a pure state into an apparent statistical density matrix.',
        meta: 'Gaps Detected',
        status: 'Warning: Confused "collapse" with "entanglement leakage"',
        hasGap: true
      },
      {
        num: '03',
        title: 'Irreversible Entropy Leakage',
        desc: 'Because macroscopic surroundings have infinite degrees of freedom, the time required for Poincaré recurrence (coherence returning spontaneously) exceeds the lifespan of the universe.',
        meta: 'Timescale: >10¹⁰⁰ years',
        status: 'Concept Clear'
      }
    ]
  },
  {
    id: 'gradient-descent',
    title: 'Gradient Descent & Loss Surfaces',
    domain: 'Machine Learning',
    testsTaken: 4,
    status: 'Mastered (ELI5 Ready)',
    clarityScore: 94,
    gapNote: 'Tested across 4 child personas',
    summary: 'Navigating multidimensional parameter terrain by computing negative partial derivatives to minimize error.',
    analogyQuote: 'Walking down a foggy alpine valley blindfolded, using only the tilt beneath your boots to step downhill.',
    masteryLevel: 94,
    difficulty: 'Intermediate'
  },
  {
    id: 'hebbian-plasticity',
    title: 'Hebbian Plasticity & LTP',
    domain: 'Neuroscience',
    testsTaken: 1,
    status: 'Needs Analogy Polish',
    clarityScore: 62,
    gapNote: 'Target: Simple analogy for non-physicians',
    summary: 'Synaptic strength increases following persistent high-frequency presynaptic stimulation through calcium influx and AMPA receptor insertion.',
    jargonCrutchesIdentified: [
      'Unexplained NMDA receptor magnesium unblocking',
      'Vague conflation of post-tetanic potentiation with true LTP'
    ],
    masteryLevel: 58,
    difficulty: 'Advanced'
  },
  {
    id: 'byzantine-fault-tolerance',
    title: 'Byzantine Fault Tolerance',
    domain: 'Distributed Systems',
    testsTaken: 2,
    status: 'Diagram Ready',
    clarityScore: 88,
    gapNote: 'Oral test passed · Mental visual pending',
    summary: 'Reaching consensus across adversarial networks where nodes can deliberately broadcast contradictory messages.',
    masteryLevel: 88,
    difficulty: 'Intermediate'
  }
];

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenTab>('library');
  const [selectedConceptId, setSelectedConceptId] = useState<string>('quantum-decoherence');
  const [concepts, setConcepts] = useState<Concept[]>(defaultConcepts);
  const [reviewQueue, setReviewQueue] = useState<ReviewItem[]>([
    {
      id: 'rev-1',
      conceptId: 'quantum-decoherence',
      conceptTitle: 'Quantum Decoherence',
      intervalDays: 1,
      repetitionCount: 4,
      nextReviewDue: 'Tomorrow',
      cardSnippet: 'How macroscopic interaction causes irreversible phase loss without collapse.'
    }
  ]);
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [blindMode, setBlindMode] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>(
    'So basically, quantum decoherence happens when a tiny quantum particle bumps into gas molecules or light photons. When that occurs, the wave function collapse gets leaked into the surroundings, like dropping pebbles into a restless pond of rippling water, muddying up the neat phase information...'
  );
  const [clarityScore, setClarityScore] = useState<number>(78);
  const [lastEvaluation, setLastEvaluation] = useState<any>(null);
  const [isNewProbeModalOpen, setIsNewProbeModalOpen] = useState<boolean>(false);
  const [isMathRefresherOpen, setIsMathRefresherOpen] = useState<boolean>(false);
  const [isDbStatusOpen, setIsDbStatusOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [user, setUser] = useState<{ id: string; email: string; name?: string; avatarUrl?: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync with API, LocalStorage and Supabase Auth on mount
  useEffect(() => {
    // Check local storage for persistent session
    try {
      const savedUser = localStorage.getItem('feynma_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (_) {}

    // Check active Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Scholar'
        };
        setUser(u);
        try { localStorage.setItem('feynma_user', JSON.stringify(u)); } catch (_) {}
      }
    }).catch(() => {});

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Scholar'
        };
        setUser(u);
        try { localStorage.setItem('feynma_user', JSON.stringify(u)); } catch (_) {}
      }
    });

    fetch('/api/concepts')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setConcepts(data);
        }
      })
      .catch(() => {});

    fetch('/api/review-queue')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data)) {
          setReviewQueue(data);
        }
      })
      .catch(() => {});

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3200);
  };

  const activeConcept =
    concepts.find((c) => c.id === selectedConceptId) || concepts[0] || defaultConcepts[0];

  const toggleFocusMode = () => setFocusMode((prev) => !prev);
  const toggleBlindMode = () => setBlindMode((prev) => !prev);

  const addToReviewQueue = async (snippet?: string) => {
    try {
      const res = await fetch('/api/review-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conceptId: activeConcept.id,
          conceptTitle: activeConcept.title,
          cardSnippet: snippet || activeConcept.gapNote || activeConcept.summary
        })
      });
      if (res.ok) {
        const item = await res.json();
        setReviewQueue((prev) => [item, ...prev]);
        showToast(`Added "${activeConcept.title}" to Anki Spaced Review Queue!`);
      }
    } catch {
      const fallbackItem: ReviewItem = {
        id: `rev-${Date.now()}`,
        conceptId: activeConcept.id,
        conceptTitle: activeConcept.title,
        intervalDays: 1,
        repetitionCount: 1,
        nextReviewDue: 'Tomorrow',
        cardSnippet: snippet || activeConcept.gapNote
      };
      setReviewQueue((prev) => [fallbackItem, ...prev]);
      showToast(`Added "${activeConcept.title}" to review queue!`);
    }
  };

  const synthesizeNotes = async (title: string, notes: string, domain: string) => {
    try {
      const res = await fetch('/api/notes/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, notes, domain })
      });
      if (res.ok) {
        const created = await res.json();
        setConcepts((prev) => [created, ...prev]);
        setSelectedConceptId(created.id);
        setCurrentScreen('explain');
        showToast(`Synthesized "${created.title}" successfully!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const evaluateVoiceTranscript = async (text: string) => {
    try {
      const res = await fetch('/api/evaluate-probe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text,
          conceptId: activeConcept.id,
          duration: '02:41'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setLastEvaluation(data);
        setClarityScore(data.clarityScore);
        return data;
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  };

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        selectedConceptId,
        setSelectedConceptId,
        concepts,
        activeConcept,
        reviewQueue,
        addToReviewQueue,
        focusMode,
        toggleFocusMode,
        blindMode,
        toggleBlindMode,
        transcript,
        setTranscript,
        clarityScore,
        setClarityScore,
        isNewProbeModalOpen,
        setIsNewProbeModalOpen,
        isMathRefresherOpen,
        setIsMathRefresherOpen,
        isDbStatusOpen,
        setIsDbStatusOpen,
        user,
        setUser,
        isAuthModalOpen,
        setIsAuthModalOpen,
        synthesizeNotes,
        evaluateVoiceTranscript,
        lastEvaluation,
        toastMessage,
        showToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
