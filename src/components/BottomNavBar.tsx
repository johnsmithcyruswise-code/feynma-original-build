import React from 'react';
import { useApp } from '../context/AppContext';

export const BottomNavBar: React.FC = () => {
  const { currentScreen, setCurrentScreen } = useApp();

  // Highlight rules matching the screens:
  // - 'library' is active for library screen
  // - 'explain' is active for 'explain' and 'probe'
  // - 'diagrams' is active for 'diagrams'
  // - 'review' is active for 'review' and 'diagnostic' (Feynman Step 3/4 assessment)
  const isLibraryActive = currentScreen === 'library';
  const isExplainActive = currentScreen === 'explain' || currentScreen === 'probe';
  const isDiagramsActive = currentScreen === 'diagrams';
  const isReviewActive = currentScreen === 'review' || currentScreen === 'diagnostic';

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-gutter-mobile py-space-xs pb-safe bg-surface/95 dark:bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/30 shadow-[0px_-4px_16px_rgba(24,24,27,0.04)]">
      {/* 1. Library */}
      <button
        onClick={() => setCurrentScreen('library')}
        className={`flex flex-col items-center justify-center px-space-sm py-space-xs transition-transform active:scale-95 ${
          isLibraryActive
            ? 'text-primary dark:text-primary-fixed font-semibold'
            : 'text-on-surface-variant hover:text-primary dark:text-outline dark:hover:text-primary-fixed'
        }`}
        type="button"
      >
        <span
          className="material-symbols-outlined text-[22px]"
          style={isLibraryActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          local_library
        </span>
        <span className="text-label-sm font-label-sm mt-0.5">Library</span>
      </button>

      {/* 2. Explain */}
      <button
        onClick={() => setCurrentScreen('explain')}
        className={`flex flex-col items-center justify-center px-space-sm py-space-xs transition-colors active:scale-95 relative ${
          isExplainActive
            ? 'text-primary dark:text-primary-fixed font-semibold'
            : 'text-on-surface-variant hover:text-primary dark:text-outline dark:hover:text-primary-fixed'
        }`}
        type="button"
      >
        <div className="relative">
          <span
            className="material-symbols-outlined text-[22px]"
            style={isExplainActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            mic
          </span>
          {/* Subtle indicator dot when voice probe is accessible */}
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-secondary"></span>
        </div>
        <span className="text-label-sm font-label-sm mt-0.5">Explain</span>
      </button>

      {/* 3. Diagrams */}
      <button
        onClick={() => setCurrentScreen('diagrams')}
        className={`flex flex-col items-center justify-center px-space-sm py-space-xs transition-colors active:scale-95 ${
          isDiagramsActive
            ? 'text-primary dark:text-primary-fixed font-semibold'
            : 'text-on-surface-variant hover:text-primary dark:text-outline dark:hover:text-primary-fixed'
        }`}
        type="button"
      >
        <span
          className="material-symbols-outlined text-[22px]"
          style={isDiagramsActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          account_tree
        </span>
        <span className="text-label-sm font-label-sm mt-0.5">Diagrams</span>
      </button>

      {/* 4. Review */}
      <button
        onClick={() => setCurrentScreen('review')}
        className={`flex flex-col items-center justify-center px-space-sm py-space-xs transition-colors active:scale-95 ${
          isReviewActive
            ? 'text-primary dark:text-primary-fixed font-semibold'
            : 'text-on-surface-variant hover:text-primary dark:text-outline dark:hover:text-primary-fixed'
        }`}
        type="button"
      >
        <span
          className="material-symbols-outlined text-[22px]"
          style={isReviewActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          psychology
        </span>
        <span className="text-label-sm font-label-sm mt-0.5">Review</span>
      </button>
    </nav>
  );
};
