import React, { useState, useEffect, useRef, useTransition } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { Orb } from './components/Orb';
import { TextInput } from './components/TextInput';
import { Diagnostic } from './components/Diagnostic';
import { Library } from './components/Library';
import {
  ConceptItem,
  VoiceProbeItem,
  ReviewQueueItem,
  SEED_CONCEPT_IDS,
  getAnonConcepts,
  saveAnonConcept,
  deleteAnonConcept,
  getAnonProbes,
  saveAnonProbe,
  getAnonQueue,
  saveAnonQueueItem,
  computeStreak,
  syncAnonDataToSupabase,
} from './lib/storage';
import {
  loadAvailableVoices,
  findDefaultVoice,
  speakText,
  stopSpeaking,
  isSpeaking as checkIsSpeaking,
  createSpeechRecognizer,
} from './lib/speech';
import { analyzeExplanation, DiagnosticResult } from './lib/groq';
import { supabase } from './utils/supabase/client';

type Screen = 'home' | 'live' | 'diagnostic' | 'library';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [user, setUser] = useState<any>(null);

  // Real data state
  const [concepts, setConcepts] = useState<ConceptItem[]>([]);
  const [sampleConcepts, setSampleConcepts] = useState<ConceptItem[]>([]);
  const [probes, setProbes] = useState<VoiceProbeItem[]>([]);
  const [queueItems, setQueueItems] = useState<ReviewQueueItem[]>([]);
  const [studyStreak, setStudyStreak] = useState<number>(0);
  const [anonSyncCount, setAnonSyncCount] = useState<number>(0);

  // Live / Diagnostic state
  const [explanation, setExplanation] = useState<string>('');
  const [isLiveMic, setIsLiveMic] = useState<boolean>(false);
  const [isSpeakingState, setIsSpeakingState] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [loadingElapsedSeconds, setLoadingElapsedSeconds] = useState<number>(0);
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [activeConcept, setActiveConcept] = useState<ConceptItem | null>(null);
  const [retestConcept, setRetestConcept] = useState<ConceptItem | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Voices & UI feedback
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [shouldShake, setShouldShake] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'info' | 'success' | 'error'>('info');

  const recognizerRef = useRef<any>(null);
  const analyzeTimerRef = useRef<any>(null);

  const showToast = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const triggerShake = (msg = 'Type something first') => {
    setShouldShake(true);
    showToast(msg, 'error');
    setTimeout(() => setShouldShake(false), 500);
  };

  // Auth listener & voice loader on mount
  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      fetchUserData(currentUser);
      checkAnonSync(currentUser);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      fetchUserData(currentUser);
      checkAnonSync(currentUser);
    });

    // 2. Load SpeechSynthesis voices
    loadAvailableVoices().then((loadedVoices) => {
      setVoices(loadedVoices);
      const def = findDefaultVoice(loadedVoices);
      setSelectedVoice(def);
    });

    // 3. Monitor speech playback
    const interval = setInterval(() => {
      setIsSpeakingState(checkIsSpeaking());
    }, 250);

    return () => {
      authListener?.subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Fetch real data (Supabase if logged in, localStorage if anon)
  const fetchUserData = async (currentUser: any) => {
    if (currentUser) {
      // 1. Fetch user concepts strictly excluding the 4 seed IDs
      const { data: userConcepts } = await supabase
        .from('concepts')
        .select('*')
        .eq('user_id', currentUser.id)
        .not('id', 'in', '("quantum-decoherence","gradient-descent","hebbian-plasticity","byzantine-fault-tolerance")')
        .order('updated_at', { ascending: false });

      setConcepts((userConcepts as ConceptItem[]) || []);

      // 2. Fetch user probes
      const { data: userProbes } = await supabase
        .from('voice_probes')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      const probeList = (userProbes as VoiceProbeItem[]) || [];
      setProbes(probeList);

      // 3. Fetch user review queue
      const { data: userQueue } = await supabase
        .from('review_queue')
        .select('*')
        .eq('user_id', currentUser.id);

      setQueueItems((userQueue as ReviewQueueItem[]) || []);

      // 4. Compute streak from real probe dates
      const streak = computeStreak(probeList.map((p) => p.created_at));
      setStudyStreak(streak);

      // Update profiles table if streak changed
      if (streak > 0) {
        supabase
          .from('profiles')
          .update({ study_streak_days: streak })
          .eq('id', currentUser.id)
          .then();
      }
    } else {
      // Anonymous mode: read from localStorage
      const anonC = getAnonConcepts();
      setConcepts(anonC);
      const anonP = getAnonProbes();
      setProbes(anonP);
      const anonQ = getAnonQueue();
      setQueueItems(anonQ);
      // Streak is NOT shown for anonymous users (per prompt rules)
      setStudyStreak(0);
    }

    // Always fetch the 4 sample concepts strictly for the collapsed samples section
    const { data: samples } = await supabase
      .from('concepts')
      .select('*')
      .in('id', SEED_CONCEPT_IDS);

    if (samples && samples.length > 0) {
      setSampleConcepts(samples as ConceptItem[]);
    }
  };

  const checkAnonSync = (currentUser: any) => {
    if (currentUser) {
      const anonC = getAnonConcepts();
      setAnonSyncCount(anonC.length);
    } else {
      setAnonSyncCount(0);
    }
  };

  const handleSyncAnon = async () => {
    if (!user) return;
    try {
      const count = await syncAnonDataToSupabase(user.id);
      setAnonSyncCount(0);
      showToast(`Synced ${count} concepts to your account ✓`, 'success');
      await fetchUserData(user);
    } catch (err: any) {
      showToast(`Sync failed: ${err.message}`, 'error');
    }
  };

  const handleSkipAnonSync = () => {
    setAnonSyncCount(0);
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) showToast(error.message, 'error');
    } catch (e: any) {
      showToast(e.message || 'Authentication failed', 'error');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setStudyStreak(0);
    fetchUserData(null);
    showToast('Signed out', 'info');
  };

  // Toggle Live Teaching Mode (Web Speech Recognition)
  const toggleLiveMic = () => {
    if (isLiveMic) {
      if (recognizerRef.current) {
        try {
          recognizerRef.current.stop();
        } catch (_) {}
      }
      setIsLiveMic(false);
      showToast('Live teaching paused');
    } else {
      const recognizer = createSpeechRecognizer(
        (chunk, isFinal) => {
          if (isFinal) {
            setExplanation((prev) => {
              const trimmed = prev.trim();
              return trimmed ? `${trimmed} ${chunk}` : chunk;
            });
          }
        },
        () => {
          setIsLiveMic(false);
        }
      );

      if (recognizer) {
        try {
          recognizer.start();
          recognizerRef.current = recognizer;
          setIsLiveMic(true);
          showToast('Listening... Speak your explanation aloud');
        } catch (_) {
          setIsLiveMic(false);
          showToast('Mic active. Speak naturally or type below.');
        }
      } else {
        setIsLiveMic(true);
        showToast('Teaching mode active. Type your thoughts below.');
      }
    }
  };

  // Read Aloud handler
  const handleReadAloudToggle = () => {
    if (isSpeakingState) {
      stopSpeaking();
      setIsSpeakingState(false);
    } else {
      if (!explanation.trim()) {
        triggerShake();
        return;
      }
      setIsSpeakingState(true);
      speakText(explanation, selectedVoice, () => {
        setIsSpeakingState(false);
      });
    }
  };

  // Analyze Handler
  const handleAnalyze = async () => {
    if (!explanation.trim()) {
      triggerShake();
      return;
    }

    stopSpeaking();
    setIsSpeakingState(false);
    if (isLiveMic && recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch (_) {}
      setIsLiveMic(false);
    }

    setIsAnalyzing(true);
    setLoadingElapsedSeconds(0);
    setCurrentScreen('diagnostic');
    setIsSaved(false);

    // Track elapsed time for "Still thinking..." state
    const startTime = Date.now();
    analyzeTimerRef.current = setInterval(() => {
      setLoadingElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    try {
      const result = await analyzeExplanation(explanation);
      setDiagnostic(result);

      // Auto-speak feedback if provided
      if (result.feedback_spoken) {
        speakText(result.feedback_spoken, selectedVoice, () => {
          setIsSpeakingState(false);
        });
      }
    } catch (err: any) {
      setCurrentScreen('live');
      showToast(`Analysis failed: ${err.message || 'Please try again'}`, 'error');
    } finally {
      setIsAnalyzing(false);
      if (analyzeTimerRef.current) {
        clearInterval(analyzeTimerRef.current);
        analyzeTimerRef.current = null;
      }
    }
  };

  // Try Again: returns to Live and clears explanation
  const handleTryAgain = () => {
    stopSpeaking();
    setExplanation('');
    setDiagnostic(null);
    setActiveConcept(null);
    setRetestConcept(null);
    setIsSaved(false);
    setCurrentScreen('live');
  };

  // Save to Library (Real Save)
  const handleSaveToLibrary = async () => {
    if (!diagnostic || isSaved) return;

    const trimmed = explanation.trim();
    const title = trimmed.length > 40 ? trimmed.slice(0, 40) + '…' : trimmed || 'Untitled Explanation';
    const conceptId = activeConcept?.id || 'concept-' + Date.now();
    const nowIso = new Date().toISOString();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowIso = tomorrow.toISOString();

    // Determine domain tag cleanly
    let domain = 'Intuition';
    const lower = trimmed.toLowerCase();
    if (lower.includes('quantum') || lower.includes('physics') || lower.includes('gravity') || lower.includes('newton')) {
      domain = 'Physics';
    } else if (lower.includes('photosynthesis') || lower.includes('biology') || lower.includes('cell')) {
      domain = 'Biology';
    } else if (lower.includes('gradient') || lower.includes('neural') || lower.includes('learning')) {
      domain = 'Computer Science';
    }

    const conceptRecord: ConceptItem = {
      id: conceptId,
      title,
      domain,
      tests_taken: (activeConcept?.tests_taken || 0) + 1,
      status: diagnostic.clarity_score >= 80 ? 'Mastered' : 'Needs Polish',
      clarity_score: diagnostic.clarity_score,
      gap_note: diagnostic.gap,
      summary: trimmed,
      mastery_level: diagnostic.clarity_score,
      difficulty: 'Intermediate',
      user_id: user ? user.id : null,
      is_public: false,
      created_at: activeConcept?.created_at || nowIso,
      updated_at: nowIso,
    };

    const probeRecord: VoiceProbeItem = {
      id: 'probe-' + Date.now(),
      concept_id: conceptId,
      user_id: user ? user.id : null,
      transcript: trimmed,
      clarity_score: diagnostic.clarity_score,
      flagged_jargon: diagnostic.jargon_flags,
      recommendation: diagnostic.analogy,
      created_at: nowIso,
    };

    const queueRecord: ReviewQueueItem = {
      id: 'queue-' + Date.now(),
      concept_id: conceptId,
      concept_title: title,
      user_id: user ? user.id : null,
      interval_days: 1,
      repetition_count: 1,
      next_review_due: tomorrowIso,
      created_at: nowIso,
    };

    if (user) {
      // Save directly to Supabase
      try {
        await supabase.from('concepts').upsert({
          id: conceptRecord.id,
          user_id: user.id,
          title: conceptRecord.title,
          domain: conceptRecord.domain,
          tests_taken: conceptRecord.tests_taken,
          status: conceptRecord.status,
          clarity_score: conceptRecord.clarity_score,
          gap_note: conceptRecord.gap_note,
          summary: conceptRecord.summary,
          mastery_level: conceptRecord.mastery_level,
          is_public: false,
          updated_at: nowIso,
        });

        await supabase.from('voice_probes').insert({
          id: probeRecord.id,
          concept_id: probeRecord.concept_id,
          user_id: user.id,
          transcript: probeRecord.transcript,
          clarity_score: probeRecord.clarity_score,
          flagged_jargon: probeRecord.flagged_jargon,
          recommendation: probeRecord.recommendation,
          created_at: nowIso,
        });

        await supabase.from('review_queue').upsert({
          id: queueRecord.id,
          concept_id: queueRecord.concept_id,
          concept_title: queueRecord.concept_title,
          user_id: user.id,
          interval_days: 1,
          repetition_count: 1,
          next_review_due: tomorrowIso,
        });

        setIsSaved(true);
        showToast('✓ Saved to Library', 'success');
        await fetchUserData(user);
      } catch (e: any) {
        showToast(`Save failed: ${e.message}`, 'error');
      }
    } else {
      // Save to localStorage (Anonymous fallback)
      saveAnonConcept(conceptRecord);
      saveAnonProbe(probeRecord);
      saveAnonQueueItem(queueRecord);

      setIsSaved(true);
      showToast('Saved locally — sign in to sync', 'info');
      fetchUserData(null);
    }
  };

  // Retest an existing concept
  const handleRetestConcept = (concept: ConceptItem) => {
    stopSpeaking();
    setActiveConcept(concept);
    setRetestConcept(concept);
    setExplanation(concept.summary || '');
    setDiagnostic(null);
    setIsSaved(false);
    setCurrentScreen('live');
  };

  // Inspect an existing concept's diagnostic
  const handleSelectConcept = (concept: ConceptItem) => {
    stopSpeaking();
    setActiveConcept(concept);
    setRetestConcept(null);
    setExplanation(concept.summary || '');

    // Get the most recent probe or construct real diagnostic from concept row
    const conceptProbes = probes.filter((p) => p.concept_id === concept.id);
    const latestProbe = conceptProbes[0];

    const diag: DiagnosticResult = {
      clarity_score: latestProbe?.clarity_score || concept.clarity_score || 50,
      jargon_flags: latestProbe?.flagged_jargon || (concept.jargon_crutches as any) || [],
      gap: concept.gap_note || 'Re-test your understanding without textbook jargon.',
      analogy: latestProbe?.recommendation || concept.analogyQuote || 'Test again to generate an intuitive physical analogy.',
      feedback_spoken: '',
    };

    setDiagnostic(diag);
    setIsSaved(true);
    setCurrentScreen('diagnostic');
  };

  // Delete concept
  const handleDeleteConcept = async (conceptId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (user) {
      await supabase.from('concepts').delete().eq('id', conceptId).eq('user_id', user.id);
      await supabase.from('voice_probes').delete().eq('concept_id', conceptId).eq('user_id', user.id);
      await supabase.from('review_queue').delete().eq('concept_id', conceptId).eq('user_id', user.id);
      showToast('Deleted concept', 'info');
      await fetchUserData(user);
    } else {
      deleteAnonConcept(conceptId);
      showToast('Deleted concept', 'info');
      fetchUserData(null);
    }
  };

  // Find next due concept
  const dueConcepts = queueItems.filter((q) => {
    if (!q.next_review_due) return false;
    return new Date(q.next_review_due).getTime() <= Date.now();
  });
  const hasNextDueConcept = dueConcepts.length > 0;

  const handleNextConcept = () => {
    if (dueConcepts.length === 0) return;
    const nextItem = dueConcepts[0];
    const matched = concepts.find((c) => c.id === nextItem.concept_id);
    if (matched) {
      handleRetestConcept(matched);
    } else {
      setCurrentScreen('live');
    }
  };

  // History probes for the active concept
  const activeProbes = activeConcept ? probes.filter((p) => p.concept_id === activeConcept.id) : [];

  return (
    <div className="min-h-screen bg-[#050507] text-[#E4E4E7] flex flex-col justify-between selection:bg-indigo-500/20">
      {/* Sync Banner on Sign-in */}
      {user && anonSyncCount > 0 && (
        <div className="w-full bg-indigo-950/60 border-b border-indigo-800/60 px-4 py-2.5 flex items-center justify-between text-xs text-indigo-200">
          <span>You have {anonSyncCount} local concept{anonSyncCount > 1 ? 's' : ''}. Sync to account?</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncAnon}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded text-xs transition-colors"
            >
              Sync
            </button>
            <button
              onClick={handleSkipAnonSync}
              className="text-zinc-400 hover:text-zinc-200 px-1 py-1 text-xs"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="w-full max-w-lg mx-auto pt-6 pb-2 px-4 flex items-center justify-between border-b border-zinc-900/60">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentScreen('home')}>
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
          <h1 className="text-sm uppercase tracking-widest font-normal text-zinc-300">
            Feynma
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Real Streak Chip (ONLY IF >= 2 DAYS) */}
          {user && studyStreak >= 2 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
              <span>🔥</span>
              <span>{studyStreak}</span>
            </div>
          )}

          {/* User Profile / Google Sign-In Button */}
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-400 font-light truncate max-w-[120px]">
                {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </span>
              <button
                onClick={handleSignOut}
                className="text-[10px] uppercase tracking-wider text-zinc-600 hover:text-zinc-400 border border-zinc-800 px-2 py-1 rounded-md transition-colors"
                title="Sign out"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              className="text-xs px-2.5 py-1 rounded-md border border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white transition-colors flex items-center gap-1.5 font-light"
            >
              <span>Sign in</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-lg mx-auto flex flex-col justify-center py-4">
        {/* VIEW 1: HOME */}
        {currentScreen === 'home' && (
          <HomeScreen
            concepts={concepts}
            probes={probes}
            queueItems={queueItems}
            onNewExplanation={() => {
              setExplanation('');
              setActiveConcept(null);
              setRetestConcept(null);
              setDiagnostic(null);
              setIsSaved(false);
              setCurrentScreen('live');
            }}
            onBrowseLibrary={() => setCurrentScreen('library')}
            onSelectConcept={handleSelectConcept}
            onRetestConcept={handleRetestConcept}
          />
        )}

        {/* VIEW 2: LIVE */}
        {currentScreen === 'live' && (
          <div className="flex flex-col gap-2">
            <Orb
              isLive={isLiveMic}
              onToggleLive={toggleLiveMic}
              onFileContent={(txt) => setExplanation(txt)}
              onToast={(msg) => showToast(msg, 'info')}
            />

            <TextInput
              value={explanation}
              onChange={setExplanation}
              onAnalyze={handleAnalyze}
              onReadAloudToggle={handleReadAloudToggle}
              isSpeaking={isSpeakingState}
              isAnalyzing={isAnalyzing}
              voices={voices}
              selectedVoice={selectedVoice}
              onSelectVoice={setSelectedVoice}
              onShakeTrigger={triggerShake}
              shouldShake={shouldShake}
              statusText={
                isLiveMic
                  ? 'Listening actively... Speak naturally, or tap the orb to stop.'
                  : 'Explain your topic out loud, type it below, or tap the glowing inner point...'
              }
              retestInfo={
                retestConcept
                  ? {
                      title: retestConcept.title,
                      lastScore: retestConcept.clarity_score || 0,
                    }
                  : null
              }
              onClearRetest={() => setRetestConcept(null)}
            />
          </div>
        )}

        {/* VIEW 3: DIAGNOSTIC */}
        {currentScreen === 'diagnostic' && (
          <Diagnostic
            diagnostic={diagnostic}
            isLoading={isAnalyzing}
            loadingElapsedSeconds={loadingElapsedSeconds}
            onTryAgain={handleTryAgain}
            onSaveToLibrary={handleSaveToLibrary}
            isSaved={isSaved}
            selectedVoice={selectedVoice}
            historyProbes={activeProbes}
            perspectives={activeConcept?.perspectives}
            hasNextDueConcept={hasNextDueConcept}
            onNextConcept={handleNextConcept}
          />
        )}

        {/* VIEW 4: LIBRARY */}
        {currentScreen === 'library' && (
          <Library
            concepts={concepts}
            sampleConcepts={sampleConcepts}
            probes={probes}
            queueItems={queueItems}
            onSelectConcept={handleSelectConcept}
            onRetestConcept={handleRetestConcept}
            onDeleteConcept={handleDeleteConcept}
            onNewExplanation={() => {
              setExplanation('');
              setActiveConcept(null);
              setRetestConcept(null);
              setDiagnostic(null);
              setIsSaved(false);
              setCurrentScreen('live');
            }}
          />
        )}
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#0C0C10] border text-xs font-light px-4 py-2 rounded-full shadow-2xl animate-fade-in-up flex items-center gap-2 ${
            toastType === 'error'
              ? 'border-red-500/50 text-red-300'
              : toastType === 'success'
              ? 'border-emerald-500/50 text-emerald-300'
              : 'border-zinc-800 text-zinc-300'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              toastType === 'error'
                ? 'bg-red-400'
                : toastType === 'success'
                ? 'bg-emerald-400'
                : 'bg-indigo-400'
            }`}
          />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Fixed Bottom Navigation (3 Buttons: Home, ＋ New, Library) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#050507]/95 backdrop-blur-md border-t border-zinc-900/80 py-2.5">
        <div className="w-full max-w-lg mx-auto px-6 flex items-center justify-around">
          <button
            onClick={() => setCurrentScreen('home')}
            className={`flex flex-col items-center gap-1 text-[11px] font-light transition-colors ${
              currentScreen === 'home' ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span className="text-sm">🏠</span>
            <span>Home</span>
          </button>

          <button
            onClick={() => {
              setExplanation('');
              setActiveConcept(null);
              setRetestConcept(null);
              setDiagnostic(null);
              setIsSaved(false);
              setCurrentScreen('live');
            }}
            className={`flex flex-col items-center gap-1 text-[11px] font-light transition-colors ${
              currentScreen === 'live' ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span className="text-sm">🎙️</span>
            <span>＋ New</span>
          </button>

          <button
            onClick={() => setCurrentScreen('library')}
            className={`flex flex-col items-center gap-1 text-[11px] font-light transition-colors ${
              currentScreen === 'library' ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span className="text-sm">📚</span>
            <span>Library</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
