import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const ReviewScreen: React.FC = () => {
  const { reviewQueue, setCurrentScreen, setSelectedConceptId, showToast } = useApp();
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  const currentItem = reviewQueue[activeCardIndex] || reviewQueue[0];

  const handleRate = (ease: string) => {
    showToast(`Scheduled next review: ${ease === 'Easy' ? 'in 4 days' : ease === 'Good' ? 'in 2 days' : 'Tomorrow'}`);
    setIsRevealed(false);
    if (activeCardIndex < reviewQueue.length - 1) {
      setActiveCardIndex((prev) => prev + 1);
    } else {
      setActiveCardIndex(0);
    }
  };

  return (
    <main className="max-w-2xl mx-auto pt-20 pb-36 px-gutter space-y-space-md">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
            Feynman Spaced Repetition
          </span>
          <h2 className="text-headline-md font-headline-md text-primary dark:text-primary-fixed">
            Anki Review Queue ({reviewQueue.length} Active)
          </h2>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-tertiary-fixed-dim/30 dark:bg-tertiary-container text-tertiary-container dark:text-tertiary-fixed font-label-sm text-xs font-semibold">
          Retention: 3.4× Boost
        </span>
      </div>

      {currentItem ? (
        <section className="bg-surface-container-lowest dark:bg-surface-container-low rounded-xl hairline-border p-6 space-y-5 shadow-[0px_2px_8px_rgba(24,24,27,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-label-sm font-label-sm text-outline uppercase tracking-wider">
              Card {activeCardIndex + 1} of {reviewQueue.length} · Interval: {currentItem.intervalDays}d
            </span>
            <button
              onClick={() => {
                setSelectedConceptId(currentItem.conceptId);
                setCurrentScreen('probe');
              }}
              className="text-xs font-label-md font-semibold text-secondary hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">mic</span>
              Voice Retest
            </button>
          </div>

          <div className="space-y-2">
            <h3 className="font-headline-sm text-headline-sm text-primary dark:text-primary-fixed font-bold">
              {currentItem.conceptTitle}
            </h3>
            <p className="font-body-md text-body-md text-on-surface leading-relaxed">
              Target Recall: {currentItem.cardSnippet}
            </p>
          </div>

          {!isRevealed ? (
            <button
              onClick={() => setIsRevealed(true)}
              className="w-full py-3.5 rounded-xl bg-surface-container dark:bg-surface-container-high hover:bg-surface-container-highest font-label-md text-label-md font-semibold text-primary dark:text-primary-fixed transition-all"
            >
              Reveal Model Explanation & Analogy
            </button>
          ) : (
            <div className="space-y-4 pt-3 border-t border-surface-container dark:border-surface-container-high">
              <blockquote className="p-3.5 bg-surface-container-low dark:bg-surface-container rounded-lg hairline-border italic text-body-md text-on-surface">
                “Decoherence occurs when environmental particles entangle with pure superposition states, dispersing phase relationships into chaotic thermal coordinates without requiring physical wave collapse.”
              </blockquote>

              <div className="space-y-2">
                <span className="text-xs text-outline font-label-sm">
                  Rate your active recall fluency:
                </span>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => handleRate('Again')}
                    className="py-2.5 rounded-lg bg-error-container/20 text-error font-label-sm text-xs font-bold hover:bg-error-container/40 active:scale-95"
                  >
                    Again (&lt;10m)
                  </button>
                  <button
                    onClick={() => handleRate('Hard')}
                    className="py-2.5 rounded-lg bg-surface-container dark:bg-surface-container-high text-on-surface font-label-sm text-xs font-semibold hover:bg-surface-container-highest active:scale-95"
                  >
                    Hard (1d)
                  </button>
                  <button
                    onClick={() => handleRate('Good')}
                    className="py-2.5 rounded-lg bg-primary-fixed/40 text-primary dark:text-primary-fixed font-label-sm text-xs font-bold hover:bg-primary-fixed/60 active:scale-95"
                  >
                    Good (2d)
                  </button>
                  <button
                    onClick={() => handleRate('Easy')}
                    className="py-2.5 rounded-lg bg-tertiary-fixed-dim/40 text-tertiary-container dark:text-tertiary-fixed font-label-sm text-xs font-bold hover:bg-tertiary-fixed/60 active:scale-95"
                  >
                    Easy (4d)
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      ) : (
        <div className="p-8 text-center bg-surface-container-lowest dark:bg-surface-container-low rounded-xl hairline-border text-outline">
          Queue cleared! All Feynman concepts reviewed for today.
        </div>
      )}
    </main>
  );
};
