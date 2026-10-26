import React, { useEffect, useState } from 'react';
import { DiagnosticResult } from '../lib/groq';
import { speakText, stopSpeaking } from '../lib/speech';
import { VoiceProbeItem } from '../lib/storage';

interface DiagnosticProps {
  diagnostic: DiagnosticResult | null;
  isLoading: boolean;
  loadingElapsedSeconds?: number;
  onTryAgain: () => void;
  onSaveToLibrary: () => void;
  isSaved: boolean;
  selectedVoice: SpeechSynthesisVoice | null;
  historyProbes?: VoiceProbeItem[];
  perspectives?: Record<string, any>;
  hasNextDueConcept?: boolean;
  onNextConcept?: () => void;
  onDiscussWithTutor?: (gapText: string) => void;
}

export const Diagnostic: React.FC<DiagnosticProps> = ({
  diagnostic,
  isLoading,
  loadingElapsedSeconds = 0,
  onTryAgain,
  onSaveToLibrary,
  isSaved,
  selectedVoice,
  historyProbes = [],
  perspectives,
  hasNextDueConcept = false,
  onNextConcept,
  onDiscussWithTutor,
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isPlayingAnalogy, setIsPlayingAnalogy] = useState(false);
  const [activePerspectiveTab, setActivePerspectiveTab] = useState<string>('eli12');

  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  // Animate score from 0 to real clarity score
  useEffect(() => {
    if (!diagnostic || isLoading) {
      setAnimatedScore(0);
      return;
    }

    const target = Math.min(Math.max(diagnostic.clarity_score, 0), 100);
    let current = 0;
    const duration = 900;
    const step = 20;
    const increment = target / (duration / step);

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setAnimatedScore(target);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.round(current));
      }
    }, step);

    return () => clearInterval(timer);
  }, [diagnostic, isLoading]);

  const handleHearAnalogy = () => {
    if (!diagnostic?.analogy) return;

    if (isPlayingAnalogy) {
      stopSpeaking();
      setIsPlayingAnalogy(false);
      return;
    }

    setIsPlayingAnalogy(true);
    speakText(diagnostic.analogy, selectedVoice, () => {
      setIsPlayingAnalogy(false);
    });
  };

  // Loading state (ONLY while request is in flight)
  if (isLoading || !diagnostic) {
    const isOver3s = loadingElapsedSeconds >= 3;
    return (
      <div className="w-full max-w-lg mx-auto px-4 py-16 flex flex-col items-center justify-center gap-6">
        <div className="relative w-36 h-36 rounded-full border border-zinc-800 flex items-center justify-center animate-pulse">
          <div className="w-20 h-20 rounded-full border border-dashed border-indigo-500/40" />
          <div className="absolute w-2.5 h-2.5 rounded-full bg-indigo-400" />
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-xs uppercase tracking-widest font-light text-zinc-300">
            {isOver3s ? 'Still thinking...' : 'Feynman is listening...'}
          </p>
          <p className="text-[11px] text-zinc-500 max-w-xs">
            {isOver3s
              ? 'Distilling deeper conceptual intuition...'
              : 'Surgically inspecting for textbook jargon and intuitive gaps.'}
          </p>
        </div>
      </div>
    );
  }

  const strokeOffset = circumference - (animatedScore / 100) * circumference;
  const hasJargon = diagnostic.jargon_flags && diagnostic.jargon_flags.length > 0;
  const hasMultipleAttempts = historyProbes.length > 1;
  const perspectiveKeys = perspectives ? Object.keys(perspectives) : [];
  const hasPerspectives = perspectiveKeys.length > 0;

  return (
    <div className="w-full max-w-lg mx-auto px-4 pb-28 pt-2 flex flex-col gap-5 animate-fade-in-up">
      {/* Circular Clarity Score Arc */}
      <div className="flex flex-col items-center justify-center py-2">
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r={radius}
              className="text-zinc-900"
              strokeWidth="6"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              className="text-indigo-500 transition-all duration-300 ease-out"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-light text-[#E4E4E7] tracking-tight">{animatedScore}%</span>
            <span className="text-[9px] uppercase tracking-widest text-zinc-500 mt-0.5">Clarity Score</span>
          </div>
        </div>
      </div>

      {/* Sparkline Progress History (ONLY IF >1 ATTEMPT) */}
      {hasMultipleAttempts && (
        <div className="bg-[#0C0C10] border border-zinc-900/80 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">Progress History</span>
            <span className="text-[10px] text-zinc-400">{historyProbes.length} attempts</span>
          </div>
          <div className="flex items-end gap-1.5 h-14 pt-2">
            {historyProbes.map((probe, i) => {
              const hPercent = Math.max(10, Math.min(100, probe.clarity_score));
              return (
                <div key={probe.id || i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-indigo-500/30 rounded-t hover:bg-indigo-500/60 transition-all"
                    style={{ height: `${hPercent}%` }}
                    title={`${probe.clarity_score}%`}
                  />
                  <span className="text-[9px] text-zinc-600">{probe.clarity_score}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 1. JARGON FLAGS CARD */}
      <div className="bg-[#0C0C10] border border-zinc-900/80 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-amber-500 text-xs">⚠️</span>
          <h2 className="text-[10px] uppercase tracking-widest font-light text-amber-500">Jargon Flags</h2>
        </div>

        {hasJargon ? (
          <div className="flex flex-col gap-3 divide-y divide-zinc-900/80">
            {diagnostic.jargon_flags.map((flag, idx) => (
              <div key={idx} className={`flex flex-col gap-1 ${idx > 0 ? 'pt-3' : ''}`}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-amber-400">"{flag.term}"</span>
                </div>
                <p className="text-xs text-zinc-400 font-light leading-relaxed">{flag.why}</p>
                {flag.simpler && (
                  <p className="text-xs text-emerald-400 italic font-light mt-0.5">
                    → Replace with: {flag.simpler}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-emerald-400 font-light">✓ Clean — no jargon detected. Nice.</p>
        )}
      </div>

      {/* 2. THE GAP CARD */}
      <div className="bg-[#0C0C10] border border-zinc-900/80 rounded-xl p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-indigo-400 text-xs">🔍</span>
          <h2 className="text-[10px] uppercase tracking-widest font-light text-zinc-400">The Gap</h2>
        </div>
        <p className="text-xs font-light text-zinc-200 leading-relaxed">{diagnostic.gap}</p>
        {onDiscussWithTutor && (
          <button
            onClick={() => onDiscussWithTutor(diagnostic.gap)}
            className="mt-1 self-start py-1.5 px-3 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium flex items-center gap-1.5 transition-colors"
          >
            <span>💬 Ask Feynman Tutor to break down this gap</span>
            <span>→</span>
          </button>
        )}
      </div>

      {/* 3. TRY THIS ANALOGY CARD */}
      <div className="bg-[#0C0C10] border border-zinc-900/80 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 text-xs">💡</span>
            <h2 className="text-[10px] uppercase tracking-widest font-light text-zinc-400">Try This Analogy</h2>
          </div>
          <button
            onClick={handleHearAnalogy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-light bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
          >
            <span>{isPlayingAnalogy ? '⏹️ Stop' : '🔊 Hear it'}</span>
          </button>
        </div>
        <p className="text-xs font-light text-zinc-200 leading-relaxed italic border-l-2 border-emerald-500/40 pl-3 py-0.5">
          "{diagnostic.analogy}"
        </p>
      </div>

      {/* PERSPECTIVE TABS (ONLY IF DATA PRESENT) */}
      {hasPerspectives && perspectives && (
        <div className="bg-[#0C0C10] border border-zinc-900/80 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
            {perspectiveKeys.map((key) => (
              <button
                key={key}
                onClick={() => setActivePerspectiveTab(key)}
                className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md transition-colors ${
                  activePerspectiveTab === key
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {key}
              </button>
            ))}
          </div>
          {perspectives[activePerspectiveTab] && (
            <div className="text-xs font-light text-zinc-300 leading-relaxed">
              <p className="font-medium text-zinc-200 mb-1">
                {perspectives[activePerspectiveTab].title || perspectives[activePerspectiveTab].analogyName}
              </p>
              <p className="text-zinc-400 text-[11px]">
                {perspectives[activePerspectiveTab].quote || perspectives[activePerspectiveTab].analogyText}
              </p>
            </div>
          )}
        </div>
      )}

      {/* BOTTOM ACTIONS */}
      <div className="flex flex-col gap-2 pt-2">
        <div className="flex items-center gap-3">
          <button
            onClick={onTryAgain}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-light bg-[#0C0C10] hover:bg-zinc-900 text-zinc-300 border border-zinc-800/80 transition-colors"
          >
            ↺ Try Again
          </button>

          <button
            onClick={onSaveToLibrary}
            disabled={isSaved}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-light transition-all flex items-center justify-center gap-2 ${
              isSaved
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {isSaved ? '✓ Saved to Library' : 'Save to Library'}
          </button>
        </div>

        {onDiscussWithTutor && (
          <button
            onClick={() => onDiscussWithTutor(diagnostic.gap)}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-light bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 border border-indigo-800/60 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>💬 Discuss with Feynman Tutor</span>
          </button>
        )}

        {/* Next Concept button (ONLY if another due concept exists) */}
        {hasNextDueConcept && onNextConcept && (
          <button
            onClick={onNextConcept}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-light bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Next Concept Due</span>
            <span>▸</span>
          </button>
        )}
      </div>
    </div>
  );
};
