import React from 'react';
import { ConceptItem, VoiceProbeItem, ReviewQueueItem } from '../lib/storage';

interface HomeScreenProps {
  concepts: ConceptItem[];
  probes: VoiceProbeItem[];
  queueItems: ReviewQueueItem[];
  onNewExplanation: () => void;
  onBrowseLibrary: () => void;
  onOpenTutor: () => void;
  onOpenVoiceStudio?: () => void;
  onOpenSummarizer?: () => void;
  onOpenFlashcards?: () => void;
  onSelectConcept: (concept: ConceptItem) => void;
  onRetestConcept: (concept: ConceptItem) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  concepts,
  probes,
  queueItems,
  onNewExplanation,
  onBrowseLibrary,
  onOpenTutor,
  onOpenVoiceStudio,
  onOpenSummarizer,
  onOpenFlashcards,
  onSelectConcept,
  onRetestConcept,
}) => {
  // Find due items
  const nowMs = Date.now();
  const dueItems = queueItems.filter((q) => {
    if (!q.next_review_due) return false;
    try {
      return new Date(q.next_review_due).getTime() <= nowMs;
    } catch {
      return false;
    }
  });

  const hasDue = dueItems.length > 0;
  const hasConcepts = concepts.length > 0;
  const primaryDue = hasDue ? dueItems[0] : null;

  // Helper for probe stats
  const getConceptStats = (concept: ConceptItem) => {
    const conceptProbes = probes
      .filter((p) => p.concept_id === concept.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const attemptsCount = conceptProbes.length > 0 ? conceptProbes.length : (concept.tests_taken || 0);

    let lastProbeLabel = 'Never tested';
    let latestScore = concept.clarity_score || 0;

    if (conceptProbes.length > 0) {
      latestScore = conceptProbes[0].clarity_score;
      const probeDate = new Date(conceptProbes[0].created_at);
      const diffDays = Math.floor((Date.now() - probeDate.getTime()) / (1000 * 60 * 60 * 24));
      lastProbeLabel = diffDays <= 0 ? `Last: ${latestScore}% · Today` : `Last: ${latestScore}% · ${diffDays}d ago`;
    } else if (concept.tests_taken && concept.tests_taken > 0) {
      lastProbeLabel = `Last: ${latestScore}%`;
    }

    const isDue = dueItems.some((d) => d.concept_id === concept.id);

    return {
      attemptsCount,
      lastProbeLabel,
      latestScore,
      isDue,
    };
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 pb-28 pt-2 flex flex-col gap-6">
      {/* HERO CARD VARIANTS */}

      {/* Variant 1: No due reviews AND no recent concepts */}
      {!hasDue && !hasConcepts && (
        <div className="bg-[#0C0C10] border border-zinc-900/80 rounded-2xl p-6 flex flex-col items-start gap-4">
          <span className="text-[10px] tracking-widest uppercase font-semibold text-indigo-400">
            🚀 GET STARTED
          </span>
          <h2 className="text-xl font-light text-[#E4E4E7] leading-snug">
            What do you want to test yourself on?
          </h2>
          <button
            onClick={onNewExplanation}
            className="w-full py-3 px-4 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center justify-center gap-1.5"
          >
            <span>＋</span>
            <span>New Explanation</span>
          </button>
        </div>
      )}

      {/* Variant 2: No due reviews BUT has recent concepts */}
      {!hasDue && hasConcepts && (
        <div className="bg-[#0C0C10] border border-zinc-900/80 rounded-2xl p-6 flex flex-col items-start gap-3">
          <span className="text-[10px] tracking-widest uppercase font-semibold text-emerald-400">
            ✅ ALL CAUGHT UP
          </span>
          <h2 className="text-xl font-light text-[#E4E4E7] leading-snug">
            Nothing due right now
          </h2>
          <p className="text-xs font-light text-zinc-500">
            Come back later, or test a new concept.
          </p>
          <div className="flex items-center gap-2.5 w-full pt-2">
            <button
              onClick={onNewExplanation}
              className="flex-1 py-2.5 px-3 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              ＋ New Explanation
            </button>
            <button
              onClick={onBrowseLibrary}
              className="flex-1 py-2.5 px-3 rounded-xl text-xs font-light bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
            >
              Browse Library
            </button>
          </div>
        </div>
      )}

      {/* Variant 3: Has a due concept in review queue */}
      {hasDue && primaryDue && (
        <div className="bg-[#0C0C10] border border-zinc-900/80 rounded-2xl p-6 flex flex-col items-start gap-3">
          <span className="text-[10px] tracking-widest uppercase font-semibold text-amber-400">
            ⚡ REVIEW DUE
          </span>
          <h2 className="text-lg font-light text-[#E4E4E7] leading-snug">
            Ready to test: <span className="font-normal text-white">{primaryDue.concept_title}</span>
          </h2>
          <p className="text-xs font-light text-zinc-500">
            Reviewing strengthens long-term neural recall.
          </p>
          <button
            onClick={() => {
              const matched = concepts.find((c) => c.id === primaryDue.concept_id);
              if (matched) {
                onRetestConcept(matched);
              } else {
                onNewExplanation();
              }
            }}
            className="w-full py-3 px-4 rounded-xl text-xs font-medium bg-amber-500 hover:bg-amber-400 text-black transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Test Now</span>
            <span>▸</span>
          </button>
        </div>
      )}

      {/* INTERACTIVE FEYNMAN AI TUTOR BANNER */}
      <div className="bg-[#0C0C10] border border-indigo-500/20 hover:border-indigo-500/40 rounded-2xl p-4 flex items-center justify-between transition-all">
        <div className="flex items-center gap-3 min-w-0 pr-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-base shrink-0">
            💬
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-medium text-zinc-100">Feynman AI Tutor</h3>
              <span className="text-[9px] uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono">
                Interactive
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-light truncate">
              Ask anything, chat with voice, or attach notes
            </p>
          </div>
        </div>
        <button
          onClick={onOpenTutor}
          className="py-2 px-3 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shrink-0"
        >
          Talk Now
        </button>
      </div>

      {/* CORE FEYNMAN STUDIOS GRID */}
      <div className="flex flex-col gap-2.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
          Core Feynman Studios
        </span>
        <div className="grid grid-cols-3 gap-2.5">
          {/* 1. Voice Studio */}
          <button
            onClick={onOpenVoiceStudio}
            className="p-3.5 rounded-2xl bg-[#0C0C10] hover:bg-[#121218] border border-white/[0.06] hover:border-indigo-500/30 flex flex-col items-start gap-2 transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-sm text-emerald-400 group-hover:scale-110 transition-transform">
              🎙️
            </div>
            <div>
              <span className="text-xs font-medium text-zinc-200 block">Voice Studio</span>
              <span className="text-[10px] text-zinc-500 font-light">Waveform probe</span>
            </div>
          </button>

          {/* 2. Summarizer */}
          <button
            onClick={onOpenSummarizer}
            className="p-3.5 rounded-2xl bg-[#0C0C10] hover:bg-[#121218] border border-white/[0.06] hover:border-indigo-500/30 flex flex-col items-start gap-2 transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-sm text-indigo-400 group-hover:scale-110 transition-transform">
              📄
            </div>
            <div>
              <span className="text-xs font-medium text-zinc-200 block">Summarizer</span>
              <span className="text-[10px] text-zinc-500 font-light">Multi-depth ELI5</span>
            </div>
          </button>

          {/* 3. Flashcards */}
          <button
            onClick={onOpenFlashcards}
            className="p-3.5 rounded-2xl bg-[#0C0C10] hover:bg-[#121218] border border-white/[0.06] hover:border-indigo-500/30 flex flex-col items-start gap-2 transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-sm text-purple-400 group-hover:scale-110 transition-transform">
              🃏
            </div>
            <div>
              <span className="text-xs font-medium text-zinc-200 block">Flashcards</span>
              <span className="text-[10px] text-zinc-500 font-light">SM-2 Spaced recall</span>
            </div>
          </button>
        </div>
      </div>

      {/* "DUE TODAY" SECTION (ONLY IF AT LEAST 1 DUE ROW EXISTS) */}
      {hasDue && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-widest font-light text-zinc-400">
              Due Today ({dueItems.length})
            </h3>
          </div>

          <div className="flex flex-col gap-2">
            {dueItems.map((item) => {
              const matchedConcept = concepts.find((c) => c.id === item.concept_id);
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (matchedConcept) onRetestConcept(matchedConcept);
                    else onNewExplanation();
                  }}
                  className="bg-[#0C0C10] border border-amber-500/20 hover:border-amber-500/40 p-4 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-xs font-normal text-zinc-200 truncate group-hover:text-white transition-colors">
                      {item.concept_title}
                    </span>
                    <span className="text-[10px] text-zinc-500 mt-0.5">
                      Repetition {item.repetition_count || 1}
                    </span>
                  </div>

                  <span className="text-xs font-medium text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md shrink-0">
                    Test ▸
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* "YOUR CONCEPTS" SECTION (ONLY IF AT LEAST 1 CONCEPT EXISTS) */}
      {hasConcepts && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-widest font-light text-zinc-400">
              Your Concepts ({concepts.length})
            </h3>
            <button
              onClick={onBrowseLibrary}
              className="text-[11px] font-light text-indigo-400 hover:text-indigo-300"
            >
              View all ▸
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {concepts.slice(0, 5).map((concept) => {
              const stats = getConceptStats(concept);
              return (
                <div
                  key={concept.id}
                  onClick={() => onSelectConcept(concept)}
                  className="bg-[#0C0C10] border border-zinc-900/80 hover:border-zinc-800 p-4 rounded-xl cursor-pointer transition-all flex flex-col gap-2 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-normal text-zinc-200 truncate group-hover:text-white transition-colors">
                        {concept.title}
                      </span>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">
                        {concept.domain || 'Intuition'}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-light shrink-0 ${
                        stats.latestScore >= 80
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {stats.latestScore}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-900">
                    <span>{stats.lastProbeLabel}</span>
                    <span>Attempts: {stats.attemptsCount}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
