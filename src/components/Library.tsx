import React from 'react';
import { SavedConcept } from '../lib/storage';

interface LibraryProps {
  concepts: SavedConcept[];
  onSelectConcept: (concept: SavedConcept) => void;
  onDeleteConcept: (id: string, e: React.MouseEvent) => void;
  onNewExplanation: () => void;
}

export const Library: React.FC<LibraryProps> = ({
  concepts,
  onSelectConcept,
  onDeleteConcept,
  onNewExplanation,
}) => {
  return (
    <div className="w-full max-w-lg mx-auto px-4 pb-28 pt-2 flex flex-col gap-5">
      {/* Top Header with + New button */}
      <div className="flex items-center justify-between py-2 border-b border-zinc-900/80">
        <div>
          <h2 className="text-base font-light text-[#E4E4E7] tracking-wide">
            Your Feynman Library
          </h2>
          <p className="text-xs text-zinc-500 font-light">
            {concepts.length} {concepts.length === 1 ? 'concept' : 'concepts'} mastered in localStorage
          </p>
        </div>

        <button
          type="button"
          onClick={onNewExplanation}
          className="tap-target px-4 py-2 rounded-xl border border-indigo-500/40 bg-[#0C0C10] hover:border-indigo-500 hover:bg-indigo-500/10 text-indigo-300 text-xs font-light tracking-wide transition-all active:scale-95 shadow-[0_0_10px_rgba(99,102,241,0.15)] flex items-center gap-1.5"
        >
          <span>+ New</span>
        </button>
      </div>

      {/* Empty State */}
      {concepts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4 bg-[#0C0C10] border border-zinc-900/60 rounded-2xl">
          <div className="w-12 h-12 rounded-full border border-dashed border-zinc-800 flex items-center justify-center text-zinc-600 text-lg">
            📚
          </div>
          <div className="flex flex-col gap-1 max-w-xs">
            <p className="text-sm font-light text-zinc-300">
              No concepts yet.
            </p>
            <p className="text-xs font-light text-zinc-500 leading-relaxed">
              Analyze an explanation to save your first one and track your mastery.
            </p>
          </div>
          <button
            type="button"
            onClick={onNewExplanation}
            className="tap-target mt-2 px-5 py-2.5 rounded-xl border border-emerald-400/40 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-300 text-xs font-light tracking-wide active:scale-95 transition-all"
          >
            Start First Explanation
          </button>
        </div>
      ) : (
        /* Grid of saved concepts */
        <div className="flex flex-col gap-3">
          {concepts.map((concept) => {
            const score = concept.diagnostic?.clarity_score ?? 70;
            const scoreColor =
              score >= 80
                ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'
                : score >= 50
                ? 'text-indigo-400 border-indigo-400/30 bg-indigo-400/10'
                : 'text-amber-400 border-amber-400/30 bg-amber-400/10';

            return (
              <div
                key={concept.id}
                onClick={() => onSelectConcept(concept)}
                className="group relative bg-[#0C0C10] border border-zinc-900/80 hover:border-zinc-800 rounded-2xl p-4 cursor-pointer transition-all duration-200 active:scale-[0.99] flex flex-col gap-2.5"
              >
                {/* Header row: title and clarity score badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase tracking-widest font-light text-zinc-500 block mb-0.5">
                      {concept.domain || 'Intuition'}
                    </span>
                    <h3 className="text-sm font-light text-[#E4E4E7] group-hover:text-white transition-colors truncate">
                      {concept.title}
                    </h3>
                  </div>

                  {/* Clarity Score Badge */}
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full border font-mono font-light shrink-0 ${scoreColor}`}
                  >
                    {score}%
                  </span>
                </div>

                {/* Gap snippet */}
                <p className="text-xs text-zinc-400 font-light line-clamp-2 leading-relaxed">
                  {concept.diagnostic?.gap || concept.explanation}
                </p>

                {/* Footer row: review count and delete */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-900/60 text-[11px] font-light text-zinc-500">
                  <span>Reviewed {concept.review_count || 1} {concept.review_count === 1 ? 'time' : 'times'}</span>

                  <button
                    type="button"
                    onClick={(e) => onDeleteConcept(concept.id, e)}
                    className="tap-target px-2 py-1 text-zinc-600 hover:text-red-400 transition-colors"
                    title="Delete explanation"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
