import React, { useState } from 'react';
import { ConceptItem, VoiceProbeItem, ReviewQueueItem, SEED_CONCEPT_IDS } from '../lib/storage';

interface LibraryProps {
  concepts: ConceptItem[];
  sampleConcepts: ConceptItem[];
  probes: VoiceProbeItem[];
  queueItems: ReviewQueueItem[];
  onSelectConcept: (concept: ConceptItem) => void;
  onRetestConcept: (concept: ConceptItem) => void;
  onDeleteConcept: (conceptId: string, e: React.MouseEvent) => void;
  onNewExplanation: () => void;
}

export const Library: React.FC<LibraryProps> = ({
  concepts,
  sampleConcepts,
  probes,
  queueItems,
  onSelectConcept,
  onRetestConcept,
  onDeleteConcept,
  onNewExplanation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'due' | 'learning' | 'mastered'>('all');
  const [showSamples, setShowSamples] = useState(false);

  // Helper to check if a concept has an overdue review
  const isConceptDue = (conceptId: string): boolean => {
    const queue = queueItems.find((q) => q.concept_id === conceptId);
    if (!queue || !queue.next_review_due) return false;
    try {
      const dueDate = new Date(queue.next_review_due);
      return dueDate.getTime() <= Date.now();
    } catch {
      return false;
    }
  };

  // Helper to get probe stats for a concept
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

    return {
      attemptsCount,
      lastProbeLabel,
      latestScore,
      isDue: isConceptDue(concept.id),
    };
  };

  // Apply search query
  const filteredBySearch = concepts.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  // Apply category filter
  const filteredConcepts = filteredBySearch.filter((c) => {
    const stats = getConceptStats(c);
    if (filterType === 'due') return stats.isDue;
    if (filterType === 'learning') return stats.latestScore < 80;
    if (filterType === 'mastered') return stats.latestScore >= 80;
    return true;
  });

  return (
    <div className="w-full max-w-lg mx-auto px-4 pb-28 pt-2 flex flex-col gap-4">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs uppercase tracking-widest font-light text-zinc-400">
          Your Library
        </h2>
        <button
          onClick={onNewExplanation}
          className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-light transition-colors flex items-center gap-1"
        >
          <span>＋</span>
          <span>New</span>
        </button>
      </div>

      {/* Search Input */}
      {concepts.length > 0 && (
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search concepts..."
            className="w-full bg-[#0C0C10] border border-zinc-900/80 rounded-xl px-3.5 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Filter Tabs */}
      {concepts.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-light">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-full transition-colors ${
              filterType === 'all'
                ? 'bg-zinc-800 text-zinc-100 font-normal'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            All ({concepts.length})
          </button>
          <button
            onClick={() => setFilterType('due')}
            className={`px-3 py-1 rounded-full transition-colors ${
              filterType === 'due'
                ? 'bg-amber-500/20 text-amber-400 font-normal border border-amber-500/30'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Due ({concepts.filter((c) => isConceptDue(c.id)).length})
          </button>
          <button
            onClick={() => setFilterType('learning')}
            className={`px-3 py-1 rounded-full transition-colors ${
              filterType === 'learning'
                ? 'bg-zinc-800 text-zinc-100 font-normal'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Learning (&lt;80%)
          </button>
          <button
            onClick={() => setFilterType('mastered')}
            className={`px-3 py-1 rounded-full transition-colors ${
              filterType === 'mastered'
                ? 'bg-emerald-500/20 text-emerald-400 font-normal border border-emerald-500/30'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Mastered (≥80%)
          </button>
        </div>
      )}

      {/* Empty State (Exact Match to Prompt Spec) */}
      {concepts.length === 0 && (
        <div className="p-8 rounded-2xl border border-dashed border-zinc-800 text-center flex flex-col items-center justify-center my-6 bg-[#0C0C10]/40">
          <div className="text-4xl mb-3">📝</div>
          <div className="text-sm text-zinc-300 font-medium mb-1">No concepts yet</div>
          <div className="text-[11px] text-zinc-500 mb-5 max-w-xs">
            Type your first explanation to start building your study library.
          </div>
          <button
            onClick={onNewExplanation}
            className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs px-4 py-2.5 rounded-lg transition-colors"
          >
            ＋ New Explanation
          </button>
        </div>
      )}

      {/* Concept Cards Grid */}
      {concepts.length > 0 && filteredConcepts.length === 0 && (
        <div className="p-6 text-center text-xs text-zinc-500 bg-[#0C0C10] rounded-xl border border-zinc-900/80">
          No concepts match your filter.
        </div>
      )}

      {filteredConcepts.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {filteredConcepts.map((concept) => {
            const stats = getConceptStats(concept);
            return (
              <div
                key={concept.id}
                onClick={() => onSelectConcept(concept)}
                className="bg-[#0C0C10] border border-zinc-900/80 hover:border-zinc-800 p-4 rounded-xl cursor-pointer transition-all flex flex-col gap-2.5 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-normal text-zinc-200 truncate group-hover:text-white transition-colors">
                        {concept.title}
                      </span>
                      {stats.isDue && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Due
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                      {concept.domain || 'Intuition'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-light ${
                        stats.latestScore >= 80
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {stats.latestScore}%
                    </span>
                    <button
                      onClick={(e) => onDeleteConcept(concept.id, e)}
                      className="text-zinc-600 hover:text-red-400 text-xs p-1 rounded transition-colors"
                      title="Delete explanation"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-900">
                  <span>{stats.lastProbeLabel}</span>
                  <div className="flex items-center gap-3">
                    <span>Attempts: {stats.attemptsCount}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRetestConcept(concept);
                      }}
                      className="text-indigo-400 hover:text-indigo-300 font-light text-[11px]"
                    >
                      Test ▸
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Collapsed Sample Concepts Section (Samples — not your data) */}
      <div className="pt-6 border-t border-zinc-900/60 mt-4">
        <button
          onClick={() => setShowSamples(!showSamples)}
          className="w-full text-left flex items-center justify-between text-[10px] text-zinc-600 hover:text-zinc-500 transition-colors py-2"
        >
          <span>📖 Sample Concepts ({sampleConcepts.length})</span>
          <span>{showSamples ? '▴ Hide' : '▾ Tap to expand'}</span>
        </button>

        {showSamples && (
          <div className="flex flex-col gap-2 mt-2">
            <p className="text-[10px] text-zinc-600 italic mb-1">
              Samples — not your data. These are public demonstration models.
            </p>
            {sampleConcepts.map((sample) => (
              <div
                key={sample.id}
                onClick={() => onSelectConcept(sample)}
                className="bg-[#0C0C10]/60 border border-zinc-900/60 p-3 rounded-xl cursor-pointer hover:border-zinc-800 transition-all flex items-center justify-between"
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-zinc-400 truncate">{sample.title}</span>
                  <span className="text-[9px] text-zinc-600 uppercase tracking-widest">{sample.domain}</span>
                </div>
                <span className="text-[10px] text-zinc-600 px-2 py-0.5 rounded bg-zinc-900/80">Preview</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
