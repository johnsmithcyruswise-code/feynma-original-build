import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

export const VoiceProbeScreen: React.FC = () => {
  const {
    activeConcept,
    setCurrentScreen,
    transcript,
    setTranscript,
    evaluateVoiceTranscript,
    showToast
  } = useApp();

  const [isRecording, setIsRecording] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(74); // 01:14
  const [isJargonSimplified, setIsJargonSimplified] = useState(false);
  const [activePromptHelp, setActivePromptHelp] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Timer countdown
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev >= 120) {
            setIsRecording(false);
            return 120;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Real SpeechRecognition if available in user's browser
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript.trim()) {
            setTranscript(currentTranscript);
          }
        };

        recognition.onerror = () => {};
        recognitionRef.current = recognition;

        if (isRecording) {
          try {
            recognition.start();
          } catch (_) {}
        }
      } catch (_) {}
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      showToast('Recording paused. Tap Finish & Analyze when ready.');
    } else {
      setIsRecording(true);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (_) {}
      }
      showToast('Recording resumed. Speak naturally...');
    }
  };

  const handleReset = () => {
    setTranscript(
      'So basically, quantum decoherence happens when a tiny quantum particle bumps into gas molecules or light photons. When that occurs, the wave function collapse gets leaked into the surroundings, like dropping pebbles into a restless pond of rippling water, muddying up the neat phase information...'
    );
    setTimerSeconds(0);
    setIsJargonSimplified(false);
    showToast('Reset explanation stream.');
  };

  const handleSimplifyJargon = () => {
    setIsJargonSimplified(true);
    setTranscript((prev: string) =>
      prev.replace(
        /wave function collapse/gi,
        'the cloud of possibilities locking into one definite picture'
      )
    );
    showToast('Substituted with zero-jargon intuition!');
  };

  const handleFinishAndAnalyze = async () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setIsRecording(false);
    showToast('Analyzing explanation with Groq AI...');
    const result = await evaluateVoiceTranscript(transcript);
    
    // Speak Feynman critique in male voice
    if (result?.aiTutorSpokenCritique && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(result.aiTutorSpokenCritique);
      utterance.pitch = 0.88;
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
    setCurrentScreen('diagnostic');
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <main className="flex-1 w-full max-w-2xl mx-auto px-margin pt-20 pb-40 flex flex-col gap-space-md">
      {/* Pedagogical Feynman Directive Banner */}
      <section className="bg-surface-container-lowest dark:bg-surface-container-low border border-surface-container-highest dark:border-surface-container rounded-xl p-space-md shadow-[0_2px_8px_rgba(24,24,27,0.03)] flex items-start justify-between gap-space-sm">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface-container dark:bg-surface-container-high flex items-center justify-center text-primary dark:text-primary-fixed shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[20px]">psychology</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-bold">
                Feynman Target
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-surface-container-high dark:bg-surface-container text-primary dark:text-primary-fixed font-label-sm text-label-sm">
                Sixth Grade Level
              </span>
            </div>
            <p className="font-headline-sm text-headline-sm text-primary dark:text-primary-fixed mt-0.5 font-medium">
              Explain why quantum state fragility breaks down into everyday reality.
            </p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-primary font-label-sm text-label-sm shrink-0 font-bold">
          Rule: Zero Jargon
        </span>
      </section>

      {/* LIVE AUDIO WAVEFORM VISUALIZER (Tactile Frequency Scrubber) */}
      <section className="bg-surface-container-lowest dark:bg-surface-container-low border border-surface-container-highest dark:border-surface-container rounded-xl p-space-md shadow-[0_2px_8px_rgba(24,24,27,0.03)]">
        <div className="flex items-center justify-between mb-space-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[18px]">mic</span>
            <span className="font-label-md text-label-md text-on-surface font-semibold">
              Live Acoustic Intake
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${isRecording ? 'bg-secondary animate-ping' : 'bg-outline'}`}></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-label-sm text-outline">Input: 44.1 kHz</span>
            <span className="px-2 py-0.5 rounded-full bg-tertiary-container/10 text-on-tertiary-container dark:text-tertiary-fixed font-label-sm text-label-sm font-semibold">
              Clean Signal
            </span>
          </div>
        </div>

        {/* Scrubber track container with responsive frequency bars */}
        <div className="bg-surface-container dark:bg-surface-container-high rounded-lg p-space-sm h-14 flex items-center justify-between gap-[3px] overflow-hidden relative">
          <span className="w-[3px] h-3 bg-primary-container rounded-full"></span>
          <span className="w-[3px] h-4 bg-primary-container rounded-full"></span>
          <span className="w-[3px] h-6 bg-primary-container rounded-full"></span>
          <span className="w-[3px] h-9 bg-primary-container rounded-full"></span>
          <span className="w-[3px] h-5 bg-primary-container rounded-full"></span>
          <span className="w-[3px] h-7 bg-primary-container rounded-full"></span>
          <span className="w-[3px] h-10 bg-primary-container rounded-full"></span>
          <span className="w-[3px] h-11 bg-primary-container rounded-full"></span>
          <span className="w-[3px] h-8 bg-primary-container rounded-full"></span>
          <span className="w-[3px] h-10 bg-primary-container rounded-full"></span>
          {/* Marked comprehension gap segment in waveform */}
          <span className="w-[3px] h-12 bg-secondary rounded-full"></span>
          <span className="w-[3px] h-11 bg-secondary rounded-full"></span>
          <span className="w-[3px] h-9 bg-secondary rounded-full"></span>
          {/* Resuming clean audio bars */}
          <span className="w-[3px] h-7 bg-primary-container rounded-full"></span>
          <span className="w-[3px] h-10 bg-primary-container rounded-full"></span>
          <span className="w-[3px] h-8 bg-primary-container rounded-full"></span>
          <span className="w-[3px] h-6 bg-primary-container rounded-full"></span>
          <span className="w-[3px] h-9 bg-primary-container rounded-full"></span>
          <span className="w-[3px] h-11 bg-primary-container rounded-full"></span>
          <span className="w-[3px] h-10 bg-primary-container rounded-full"></span>
          <span className="w-[3px] h-7 bg-primary-container rounded-full"></span>
          <span className="w-[3px] h-4 bg-primary-container rounded-full"></span>
          <span className="w-[3px] h-8 bg-primary-container rounded-full"></span>

          {/* Scrub pointer head */}
          <div className="absolute left-[62%] top-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="w-3.5 h-3.5 rounded-full bg-surface-container-lowest border-2 border-primary-container shadow-sm"></div>
          </div>

          {/* Ambient bars */}
          <span className="w-[3px] h-5 bg-outline-variant/60 rounded-full"></span>
          <span className="w-[3px] h-4 bg-outline-variant/60 rounded-full"></span>
          <span className="w-[3px] h-6 bg-outline-variant/60 rounded-full"></span>
          <span className="w-[3px] h-3 bg-outline-variant/60 rounded-full"></span>
          <span className="w-[3px] h-5 bg-outline-variant/60 rounded-full"></span>
          <span className="w-[3px] h-4 bg-outline-variant/60 rounded-full"></span>
          <span className="w-[3px] h-2 bg-outline-variant/60 rounded-full"></span>
          <span className="w-[3px] h-4 bg-outline-variant/60 rounded-full"></span>
          <span className="w-[3px] h-3 bg-outline-variant/60 rounded-full"></span>
          <span className="w-[3px] h-2 bg-outline-variant/60 rounded-full"></span>
        </div>
      </section>

      {/* LIVE REAL-TIME TRANSCRIPTION (Typewriter Card) */}
      <section className="bg-surface-container-lowest dark:bg-surface-container-low border border-surface-container-highest dark:border-surface-container rounded-xl p-space-lg shadow-[0_2px_8px_rgba(24,24,27,0.04)] relative">
        <div className="flex items-center justify-between pb-space-sm border-b border-surface-container dark:border-surface-container-high mb-space-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-outline text-[16px]">edit_note</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-bold tracking-wider uppercase">
              Live Transcription Stream
            </span>
          </div>
          <span className="font-label-sm text-label-sm text-outline">Speed: 142 wpm</span>
        </div>

        {/* Real-time transcribed text with inline highlight flags */}
        <div className="font-body-lg text-body-lg text-on-surface leading-relaxed min-h-[120px]">
          <span>
            So basically, quantum decoherence happens when a tiny quantum particle bumps into gas
            molecules or light photons. When that occurs, the{' '}
          </span>

          {/* Flagged jargon span or substituted text */}
          {!isJargonSimplified ? (
            <span
              onClick={handleSimplifyJargon}
              className="relative inline-block bg-secondary-fixed/50 dark:bg-secondary-container text-secondary dark:text-secondary-fixed border-b border-secondary px-1 py-0.5 rounded font-medium cursor-pointer group"
              title="Click to auto-simplify"
            >
              wave function collapse
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:flex bg-inverse-surface text-inverse-on-surface text-label-sm font-label-sm px-2 py-0.5 rounded whitespace-nowrap shadow-md">
                Academic Jargon Flag (Click to simplify)
              </span>
            </span>
          ) : (
            <span className="bg-tertiary-fixed-dim/30 dark:bg-tertiary-container/40 text-tertiary-container dark:text-tertiary-fixed border-b border-tertiary-container/40 px-1 py-0.5 rounded font-medium">
              the cloud of possibilities locking into one definite picture
            </span>
          )}

          <span> gets leaked into the surroundings, like dropping pebbles into </span>

          {/* Successfully used analogy span */}
          <span className="bg-tertiary-fixed-dim/30 dark:bg-tertiary-container/40 text-tertiary-container dark:text-tertiary-fixed border-b border-tertiary-container/40 px-1 py-0.5 rounded font-medium">
            a restless pond of rippling water
          </span>

          <span>, muddying up the neat phase information...</span>
          <span className="inline-block w-1.5 h-4 bg-primary dark:bg-primary-fixed align-middle ml-1 cursor-blink"></span>
        </div>

        {/* User can also edit directly */}
        <div className="mt-3 pt-2 border-t border-surface-container dark:border-surface-container-high flex justify-between items-center text-xs text-outline">
          <span>Type or speak to expand your real explanation</span>
          <button
            onClick={() => {
              const more = prompt('Add sentence to explanation:');
              if (more) setTranscript((t: string) => t + ' ' + more);
            }}
            className="text-primary dark:text-primary-fixed hover:underline"
          >
            + Append speech text
          </button>
        </div>
      </section>

      {/* LIVE AI JARGON & ANALOGY DETECTOR STREAM */}
      <section className="flex flex-col gap-space-xs">
        <div className="flex items-center justify-between px-1">
          <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-bold">
            Heuristic Feedback Stream
          </span>
          <span className="font-label-sm text-label-sm text-primary dark:text-primary-fixed font-semibold">
            2 Detected Nodes
          </span>
        </div>

        {/* Jargon Warning Pill */}
        <div className="p-space-md rounded-xl bg-[#c25e34]/[0.06] dark:bg-secondary-container/20 border border-dashed border-secondary/40 flex items-start gap-3">
          <div className="p-1 rounded bg-secondary/10 text-secondary shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[18px]">warning</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md font-semibold text-secondary dark:text-secondary-fixed">
                Jargon Flagged: "Wave function collapse"
              </span>
              <button
                onClick={handleSimplifyJargon}
                className="font-label-sm text-label-sm text-secondary bg-secondary-fixed/60 dark:bg-secondary-container px-2 py-0.5 rounded-full font-bold hover:brightness-105 active:scale-95 transition-all"
              >
                {isJargonSimplified ? 'Simplified ✓' : 'Simplify'}
              </button>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Try substituting with:{' '}
              <span className="font-medium text-primary dark:text-primary-fixed">
                "the cloud of possibilities locking into one definite picture"
              </span>
              .
            </p>
          </div>
        </div>

        {/* Success Analogy Pill */}
        <div className="p-space-md rounded-xl bg-surface-container-lowest dark:bg-surface-container-low border-l-4 border-l-tertiary-container border border-surface-container-highest dark:border-surface-container flex items-start gap-3 shadow-sm">
          <div className="p-1 rounded bg-tertiary-fixed text-tertiary-container shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md font-semibold text-on-surface">
                Intuitive Analogy Validated
              </span>
              <span className="font-label-sm text-label-sm text-on-tertiary-container dark:text-tertiary-fixed bg-tertiary-fixed-dim/40 px-2 py-0.5 rounded-full font-bold">
                +18 Intuition
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              "Water ripples muddying neat information" maps cleanly to environmental entanglement
              for a lay audience.
            </p>
          </div>
        </div>
      </section>

      {/* QUICK PROMPTS & SCAFFOLDING BAR */}
      <section className="flex flex-wrap gap-2 pt-1">
        <button
          onClick={() => {
            setActivePromptHelp('analogy');
            showToast('Prompt: Imagine a droplet of colored ink falling into a roaring rapid river.');
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container dark:bg-surface-container-high border border-outline-variant/50 text-on-surface text-label-md font-label-md hover:bg-surface-container-highest transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined text-secondary text-[16px]">lightbulb</span>
          Need an analogy? Tap for prompt
        </button>

        <button
          onClick={() => {
            setActivePromptHelp('simpler');
            showToast('Simpler: "When tiny things bump into lots of noisy stuff, they act normal."');
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container dark:bg-surface-container-high border border-outline-variant/50 text-on-surface text-label-md font-label-md hover:bg-surface-container-highest transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined text-primary dark:text-primary-fixed text-[16px]">
            auto_awesome
          </span>
          Simpler wording suggestions
        </button>

        <button
          onClick={() => {
            setActivePromptHelp('kid');
            showToast('Kid question: "Wait, where did the other cat go if it was alive AND dead?"');
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container dark:bg-surface-container-high border border-outline-variant/50 text-on-surface-variant text-label-md font-label-md hover:bg-surface-container-highest transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined text-[16px]">help_outline</span>
          What would a 10-year-old ask next?
        </button>
      </section>

      {/* Scaffolding Popover if user clicked prompt help */}
      {activePromptHelp && (
        <div className="p-3 bg-surface-container-lowest dark:bg-surface-container-low rounded-xl hairline-border text-sm flex items-start justify-between">
          <p className="text-on-surface leading-relaxed">
            {activePromptHelp === 'analogy' &&
              '💡 Scaffold prompt: "Instead of talking about wave equations, explain why a hot cup of coffee always cools down and never spontaneously gets hotter from room air."'}
            {activePromptHelp === 'simpler' &&
              '✨ Substitution tip: Replace "statistical density matrix" with "a blurred snapshot where you can only guess the probability".'}
            {activePromptHelp === 'kid' &&
              '🧒 Anticipated Child Question: "If the cat is not in two states, why did Schrödinger put it in a box with poison in the first place?"'}
          </p>
          <button
            onClick={() => setActivePromptHelp(null)}
            className="text-outline hover:text-on-surface ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* DOCKED BOTTOM CONTROL CONSOLE (Tactile Voice Capture & Analyze) */}
      <footer className="fixed bottom-0 left-0 w-full z-50 bg-surface/95 dark:bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/30 py-space-md px-margin">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-space-md">
          {/* Reset Action */}
          <button
            onClick={handleReset}
            className="flex flex-col items-center justify-center p-2 rounded-xl text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-all duration-150 active:scale-95"
            title="Restart explanation"
          >
            <span className="material-symbols-outlined text-[24px]">restart_alt</span>
            <span className="font-label-sm text-label-sm mt-0.5">Reset</span>
          </button>

          {/* Central Pulsing Voice Recording Button */}
          <div className="relative flex items-center justify-center">
            {isRecording && (
              <>
                <div className="absolute inset-0 -m-3 rounded-full bg-secondary animate-tactile-ring pointer-events-none"></div>
                <div className="absolute inset-0 -m-1.5 rounded-full bg-secondary/30 pointer-events-none"></div>
              </>
            )}
            <button
              onClick={toggleRecording}
              className="relative z-10 w-16 h-16 rounded-full bg-secondary text-on-secondary shadow-lg flex items-center justify-center transition-transform active:scale-95 hover:brightness-105"
              title={isRecording ? 'Pause Recording' : 'Resume Recording'}
            >
              <span className="material-symbols-outlined text-[30px]">
                {isRecording ? 'pause' : 'mic'}
              </span>
            </button>
          </div>

          {/* Primary Action: Finish & Analyze */}
          <button
            onClick={handleFinishAndAnalyze}
            className="h-12 px-space-lg rounded-xl bg-primary-container text-on-primary font-label-lg text-label-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:brightness-110 transition-all active:scale-95"
          >
            <span>Finish & Analyze</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>

        {/* Micro-Text */}
        <div className="text-center mt-2">
          <p className="font-label-sm text-label-sm text-outline">
            Speak continuously — the Feynman probe automatically segments logic nodes & flags
            comprehension holes.
          </p>
        </div>
      </footer>
    </main>
  );
};
