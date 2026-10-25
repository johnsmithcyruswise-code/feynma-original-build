import React, { useEffect, useState } from 'react';
import { DiagnosticResult } from '../lib/storage';
import { speakText, isSpeaking, stopSpeaking } from '../lib/speech';

interface DiagnosticProps {
  diagnostic: DiagnosticResult | null;
  isLoading: boolean;
  onTryAgain: () => void;
  onSaveToLibrary: () => void;
  isSaved: boolean;
  selectedVoice: SpeechSynthesisVoice | null;
}

export const Diagnostic: React.FC<DiagnosticProps> = ({
  diagnostic,
  isLoading,
  onTryAgain,
  onSaveToLibrary,
  isSaved,
  selectedVoice,
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isPlayingAnalogy, setIsPlayingAnalogy] = useState(false);

  const radius = 54;
  const circumference = 2 * Math.PI * radius; // ~339.29

  // Animate score from 0 to target score on mount
  useEffect(() => {
    if (!diagnostic || isLoading) {
      setAnimatedScore(0);
      return;
    }

    const target = Math.min(Math.max(diagnostic.clarity_score, 0), 100);
    let start = 0;
    const duration = 1000;
    const stepTime = 20;
    const totalSteps = duration / stepTime;
    const stepIncrement = target / totalSteps;

    const timer = setInterval(() => {
      start += stepIncrement;
      if (start >= target) {
        setAnimatedScore(target);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.round(start));
      }
    }, stepTime);

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

  // Loading Skeleton State
  if (isLoading || !diagnostic) {
    return (
      <div className="w-full max-w-lg mx-auto px-4 py-12 flex flex-col items-center justify-center gap-6">
        {/* Breathing skeleton circle */}
        <div className="relative w-40 h-40 rounded-full border border-zinc-800/80 flex items-center justify-center animate-skeleton-breathe">
          <div className="w-24 h-24 rounded-full border border-dashed border-indigo-500/30" />
          <div className="absolute w-2 h-2 rounded-full bg-indigo-400 animate-core-pulse" />
        </div>

        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-light tracking-widest text-zinc-300 uppercase animate-pulse">
            Feynman is listening...
          </p>
          <p className="text-xs font-light text-zinc-500 text-center max-w-xs leading-relaxed">
            Surgically inspecting for textbook jargon and physical intuition gaps.
          </p>
        </div>
      </div>
    );
  }

  const strokeOffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="w-full max-w-lg mx-auto px-4 pb-28 pt-2 flex flex-col gap-6">
      {/* Top Clarity Ring Anchor */}
      <div className="flex flex-col items-center justify-center py-2">
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            {/* Background Muted Track */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke="#181820"
              strokeWidth="6"
            />
            {/* Animated Indigo Fill Arc */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke="#6366F1"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
              className="transition-all duration-75 ease-out"
            />
          </svg>

          {/* Central Score Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-light tracking-tight text-[#E4E4E7]">
              {animatedScore}
            </span>
            <span className="text-[10px] tracking-widest uppercase font-light text-zinc-500 mt-0.5">
              CLARITY
            </span>
          </div>
        </div>
      </div>

      {/* 3 Diagnostic Cards with animate-fade-in-up */}
      <div className="flex flex-col gap-3.5">
        {/* CARD 1: JARGON FLAGS */}
        <div
          className="bg-[#0C0C10] border border-zinc-900/80 rounded-2xl p-4.5 animate-fade-in-up"
          style={{ animationDelay: '0.05s' }}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-900/60">
            <span className="text-[10px] uppercase tracking-widest font-light text-amber-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              JARGON FLAGS
            </span>
            <span className="text-[11px] font-light text-zinc-500">
              {diagnostic.jargon_flags.length} detected
            </span>
          </div>

          {diagnostic.jargon_flags.length === 0 ? (
            <p className="text-xs font-light text-zinc-400 italic py-1">
              Zero jargon crutches detected. Clean, plain English phrasing!
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-zinc-900/50">
              {diagnostic.jargon_flags.map((flag, idx) => (
                <div key={idx} className="py-2.5 first:pt-1 last:pb-1 flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-amber-400">
                      "{flag.term}"
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-light leading-snug">
                    {flag.why}
                  </p>
                  <div className="text-xs text-emerald-400 font-light italic mt-0.5 flex items-center gap-1">
                    <span className="text-[10px] uppercase text-zinc-500 not-italic font-normal">
                      Try:
                    </span>
                    <span>"{flag.simpler}"</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CARD 2: THE GAP */}
        <div
          className="bg-[#0C0C10] border border-zinc-900/80 rounded-2xl p-4.5 animate-fade-in-up"
          style={{ animationDelay: '0.12s' }}
        >
          <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-zinc-900/60">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span className="text-[10px] uppercase tracking-widest font-light text-indigo-400">
              THE GAP
            </span>
          </div>
          <p className="text-sm font-light text-zinc-200 leading-relaxed">
            {diagnostic.gap}
          </p>
        </div>

        {/* CARD 3: TRY THIS ANALOGY */}
        <div
          className="bg-[#0C0C10] border border-zinc-900/80 rounded-2xl p-4.5 animate-fade-in-up flex flex-col gap-3"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="flex items-center justify-between pb-2 border-b border-zinc-900/60">
            <span className="text-[10px] uppercase tracking-widest font-light text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              TRY THIS ANALOGY
            </span>
            <button
              type="button"
              onClick={handleHearAnalogy}
              className="tap-target px-3 py-1 rounded-lg border border-emerald-400/30 text-emerald-300 text-xs font-light hover:bg-emerald-500/10 flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <span>{isPlayingAnalogy ? '⏹ Stop' : '🔊 Hear it'}</span>
            </button>
          </div>
          <p className="text-sm font-light text-zinc-200 italic leading-relaxed pl-3 border-l-2 border-emerald-400/50">
            "{diagnostic.analogy}"
          </p>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          onClick={onTryAgain}
          className="tap-target h-12 rounded-xl border border-zinc-800 bg-[#0C0C10] hover:border-zinc-700 hover:bg-[#14141B] text-zinc-300 text-sm font-light tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <span>↺ Try Again</span>
        </button>

        <button
          type="button"
          onClick={onSaveToLibrary}
          disabled={isSaved}
          className={`tap-target h-12 rounded-xl border text-sm font-light tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
            isSaved
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 cursor-default'
              : 'bg-[#0C0C10] border-indigo-500/50 hover:border-indigo-400 hover:bg-indigo-500/10 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
          }`}
        >
          <span>{isSaved ? 'Saved to Library ✓' : 'Save to Library'}</span>
        </button>
      </div>
    </div>
  );
};
