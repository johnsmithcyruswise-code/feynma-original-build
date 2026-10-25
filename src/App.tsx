import React, { useState, useEffect, useRef } from 'react';
import { Orb } from './components/Orb';
import { TextInput } from './components/TextInput';
import { Diagnostic } from './components/Diagnostic';
import { Library } from './components/Library';
import {
  DiagnosticResult,
  SavedConcept,
  getSavedConcepts,
  saveConcept,
  deleteConcept,
  incrementReviewCount,
} from './lib/storage';
import {
  loadAvailableVoices,
  findDefaultVoice,
  speakText,
  stopSpeaking,
  isSpeaking as checkIsSpeaking,
  createSpeechRecognizer,
} from './lib/speech';
import { analyzeExplanation } from './lib/groq';

type Screen = 'live' | 'diagnostic' | 'library';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('live');
  const [explanation, setExplanation] = useState<string>('');
  const [isLive, setIsLive] = useState<boolean>(false);
  const [isSpeakingState, setIsSpeakingState] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [savedConcepts, setSavedConcepts] = useState<SavedConcept[]>([]);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [shouldShake, setShouldShake] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const recognizerRef = useRef<any>(null);

  // Load voices and saved concepts on mount
  useEffect(() => {
    setSavedConcepts(getSavedConcepts());

    loadAvailableVoices().then((loadedVoices) => {
      setVoices(loadedVoices);
      const def = findDefaultVoice(loadedVoices);
      setSelectedVoice(def);
    });

    const interval = setInterval(() => {
      setIsSpeakingState(checkIsSpeaking());
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  const triggerShake = (msg = 'Type something first') => {
    setShouldShake(true);
    showToast(msg);
    setTimeout(() => setShouldShake(false), 500);
  };

  // Toggle Live Teaching Mode (Web Speech Recognition)
  const toggleLive = () => {
    if (isLive) {
      if (recognizerRef.current) {
        try {
          recognizerRef.current.stop();
        } catch (_) {}
      }
      setIsLive(false);
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
          setIsLive(false);
        }
      );

      if (recognizer) {
        try {
          recognizer.start();
          recognizerRef.current = recognizer;
          setIsLive(true);
          showToast('Listening... Speak your explanation aloud');
        } catch (_) {
          setIsLive(false);
          showToast('Mic active. Speak naturally or type below.');
        }
      } else {
        // Fallback if browser doesn't support SpeechRecognition
        setIsLive(true);
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

  // Analyze handler
  const handleAnalyze = async () => {
    if (!explanation.trim()) {
      triggerShake();
      return;
    }

    // Stop speaking and recognition if running
    stopSpeaking();
    setIsSpeakingState(false);
    if (isLive && recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch (_) {}
      setIsLive(false);
    }

    setIsAnalyzing(true);
    setCurrentScreen('diagnostic');
    setIsSaved(false);

    try {
      const result = await analyzeExplanation(explanation);
      setDiagnostic(result);

      // Automatically speak feedback_spoken in Feynman's voice
      if (result.feedback_spoken) {
        speakText(result.feedback_spoken, selectedVoice, () => {
          setIsSpeakingState(false);
        });
      }
    } catch (err: any) {
      showToast(err.message || 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Try Again: returns to Live and clears textarea
  const handleTryAgain = () => {
    stopSpeaking();
    setExplanation('');
    setDiagnostic(null);
    setIsSaved(false);
    setCurrentScreen('live');
  };

  // Save to Library
  const handleSaveToLibrary = () => {
    if (!diagnostic || isSaved) return;

    let domain = 'Intuition';
    const lower = explanation.toLowerCase();
    if (lower.includes('quantum') || lower.includes('physics')) domain = 'Physics';
    else if (lower.includes('photosynthesis') || lower.includes('cell') || lower.includes('biology'))
      domain = 'Biology';
    else if (lower.includes('neural') || lower.includes('gradient') || lower.includes('algorithm'))
      domain = 'Computer Science';

    saveConcept(explanation, diagnostic, domain);
    setSavedConcepts(getSavedConcepts());
    setIsSaved(true);
    showToast('Saved to Library ✓');
  };

  // Selecting a concept in Library
  const handleSelectConcept = (concept: SavedConcept) => {
    incrementReviewCount(concept.id);
    setSavedConcepts(getSavedConcepts());
    setExplanation(concept.explanation);
    setDiagnostic(concept.diagnostic);
    setIsSaved(true);
    setCurrentScreen('diagnostic');

    // Optionally speak feedback
    if (concept.diagnostic?.feedback_spoken) {
      speakText(concept.diagnostic.feedback_spoken, selectedVoice);
    }
  };

  const handleDeleteConcept = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConcept(id);
    setSavedConcepts(getSavedConcepts());
    showToast('Deleted explanation');
  };

  return (
    <div className="min-h-screen bg-[#050507] text-[#E4E4E7] flex flex-col justify-between selection:bg-indigo-500/20">
      {/* Top Header */}
      <header className="w-full max-w-lg mx-auto pt-6 pb-2 px-4 flex items-center justify-between border-b border-zinc-900/60">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-core-pulse" />
          <h1 className="text-xs uppercase tracking-widest font-light text-zinc-400">
            FEYNMA STUDIO
          </h1>
        </div>

        <div className="text-[10px] tracking-widest uppercase font-light text-zinc-600">
          {currentScreen === 'live' && 'LIVE TEACHING'}
          {currentScreen === 'diagnostic' && 'DIAGNOSTIC'}
          {currentScreen === 'library' && 'SAVED CONCEPTS'}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-lg mx-auto flex flex-col justify-center py-4">
        {currentScreen === 'live' && (
          <div className="flex flex-col gap-2">
            <Orb
              isLive={isLive}
              onToggleLive={toggleLive}
              onFileContent={(txt) => setExplanation(txt)}
              onToast={showToast}
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
                isLive
                  ? 'Listening actively... Speak naturally, or tap the orb to stop.'
                  : 'Explain your topic out loud, type it below, or tap the glowing inner point...'
              }
            />
          </div>
        )}

        {currentScreen === 'diagnostic' && (
          <Diagnostic
            diagnostic={diagnostic}
            isLoading={isAnalyzing}
            onTryAgain={handleTryAgain}
            onSaveToLibrary={handleSaveToLibrary}
            isSaved={isSaved}
            selectedVoice={selectedVoice}
          />
        )}

        {currentScreen === 'library' && (
          <Library
            concepts={savedConcepts}
            onSelectConcept={handleSelectConcept}
            onDeleteConcept={handleDeleteConcept}
            onNewExplanation={() => {
              setExplanation('');
              setDiagnostic(null);
              setIsSaved(false);
              setCurrentScreen('live');
            }}
          />
        )}
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#0C0C10] border border-zinc-800 text-xs font-light text-zinc-300 px-4 py-2 rounded-full shadow-2xl animate-fade-in-up flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Bottom Fixed Navigation (2 buttons: "🎙️ Live" and "📚 Library") */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#050507]/90 backdrop-blur-md border-t border-zinc-900/80 py-2 px-4">
        <div className="max-w-xs mx-auto grid grid-cols-2 gap-2">
          {/* Live Tab */}
          <button
            type="button"
            onClick={() => {
              if (currentScreen !== 'live') setCurrentScreen('live');
            }}
            className={`tap-target py-2 px-4 rounded-xl text-xs font-light tracking-wide flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 ${
              currentScreen === 'live' || currentScreen === 'diagnostic'
                ? 'bg-[#0C0C10] border border-indigo-500/30 text-indigo-400 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span className="text-sm">🎙️</span>
            <span>Live</span>
          </button>

          {/* Library Tab */}
          <button
            type="button"
            onClick={() => {
              setSavedConcepts(getSavedConcepts());
              setCurrentScreen('library');
            }}
            className={`tap-target py-2 px-4 rounded-xl text-xs font-light tracking-wide flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 ${
              currentScreen === 'library'
                ? 'bg-[#0C0C10] border border-indigo-500/30 text-indigo-400 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]'
                : 'text-zinc-500 hover:text-zinc-300'
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
