import React from 'react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

export const TopAppBar: React.FC = () => {
  const {
    currentScreen,
    setCurrentScreen,
    activeConcept,
    focusMode,
    toggleFocusMode,
    blindMode,
    toggleBlindMode,
    setIsDbStatusOpen,
    user,
    setIsAuthModalOpen,
    showToast
  } = useApp();
  const { isDark, toggleTheme } = useTheme();

  // Screen 1: Library Top Bar
  if (currentScreen === 'library') {
    return (
      <header className="fixed top-0 left-0 w-full z-40 flex items-center justify-between px-space-md py-space-sm bg-surface/90 dark:bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/30">
        <div className="flex items-center gap-space-sm">
          <button
            onClick={() => setCurrentScreen('library')}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-primary dark:text-primary-fixed hover:bg-surface-container-high transition-transform active:scale-95"
            title="Feynma Library"
          >
            <span className="material-symbols-outlined text-[22px]">local_library</span>
          </button>
          <div>
            <h1 className="text-headline-sm font-headline-sm font-bold tracking-tight text-primary dark:text-primary-fixed">
              Feynma Library
            </h1>
            <p className="text-label-sm font-label-sm text-outline tracking-wider -mt-0.5">
              SYNTHESIS ENGINE & ARCHIVE
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Dark Mode"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-transform active:scale-95"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          <button
            onClick={() => showToast('Synthesis history: 4 sessions recorded today.')}
            aria-label="Synthesis History"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-transform active:scale-95"
            title="Synthesis History"
          >
            <span className="material-symbols-outlined text-[20px]">history_edu</span>
          </button>

          <button
            onClick={() => setIsDbStatusOpen(true)}
            aria-label="Settings & Database Status"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-transform active:scale-95 relative"
            title="Database Status & Supabase Schema"
          >
            <span className="material-symbols-outlined text-[20px]">tune</span>
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </button>

          {/* User / Google Auth Profile Button */}
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-surface-container-high transition-all active:scale-95"
            title={user ? `Signed in as ${user.name || user.email}` : 'Sign in with Google'}
          >
            {user ? (
              <div className="relative">
                <div className="w-7 h-7 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-surface"></span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary dark:text-primary-fixed hover:bg-primary/15">
                <span className="material-symbols-outlined text-[16px]">account_circle</span>
                <span className="hidden sm:inline">Sign In</span>
              </div>
            )}
          </button>
        </div>
      </header>
    );
  }

  // Screen 2: Explain / Concept Mastery Top Bar
  if (currentScreen === 'explain') {
    return (
      <header className="fixed top-0 left-0 w-full z-40 flex items-center justify-between px-space-md py-space-sm bg-surface/90 dark:bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/30">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentScreen('library')}
            aria-label="Go back"
            className="p-1 rounded-lg text-primary dark:text-primary-fixed hover:bg-surface-container-high transition-transform duration-150 active:scale-95 flex items-center justify-center"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <span className="text-label-sm font-label-sm text-outline tracking-wider uppercase">
              Collection
            </span>
            <span className="text-label-md font-label-md text-on-surface font-semibold tracking-tight">
              Modern Physics · Ch. 7
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Dark Mode"
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors active:scale-95"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <span className="material-symbols-outlined text-[19px]">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* Focus Mode pill */}
          <button
            onClick={toggleFocusMode}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors active:scale-95 ${
              focusMode
                ? 'bg-primary-container text-on-primary'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
            type="button"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container animate-pulse"></span>
            <span className="text-label-sm font-label-sm">
              {focusMode ? 'Focus Active' : 'Focus Mode'}
            </span>
          </button>

          {/* Blind mode / visibility */}
          <button
            onClick={toggleBlindMode}
            aria-label="Visibility"
            className={`p-1.5 rounded-lg hover:text-on-surface hover:bg-surface-container-high transition-colors active:scale-95 flex items-center justify-center ${
              blindMode ? 'text-secondary' : 'text-on-surface-variant'
            }`}
            type="button"
            title={blindMode ? 'Blind Mode On (No Notes)' : 'Blind Mode Off'}
          >
            <span className="material-symbols-outlined text-[20px]">
              {blindMode ? 'visibility' : 'visibility_off'}
            </span>
          </button>

          {/* User Auth Profile */}
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-surface-container-high transition-all active:scale-95"
            title={user ? `Signed in as ${user.name || user.email}` : 'Sign in with Google'}
          >
            {user ? (
              <div className="w-7 h-7 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center">
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
            ) : (
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant hover:text-primary">
                account_circle
              </span>
            )}
          </button>
        </div>
      </header>
    );
  }

  // Screen 3: Live Voice Probe Top Bar
  if (currentScreen === 'probe') {
    return (
      <header className="fixed top-0 left-0 w-full z-40 flex items-center justify-between px-space-md py-space-sm bg-surface/90 dark:bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/30">
        <button
          onClick={() => setCurrentScreen('explain')}
          className="flex items-center gap-space-xs text-on-surface-variant hover:text-primary transition-colors duration-150 active:scale-95 py-space-xs px-space-xs rounded-lg"
          title="Back to concept"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          <span className="font-label-md text-label-md hidden sm:inline text-on-surface-variant">
            Concepts
          </span>
        </button>

        <div className="flex flex-col items-center text-center">
          <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase font-bold">
            Voice Probe
          </span>
          <h1 className="font-headline-sm text-headline-sm font-semibold text-primary dark:text-primary-fixed tracking-tight truncate max-w-[200px] sm:max-w-none">
            {activeConcept.title}
          </h1>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Timer pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container border border-outline-variant/40">
            <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
            <span className="font-label-md text-label-md text-on-surface font-semibold">01:14</span>
            <span className="font-label-sm text-label-sm text-outline">/ 02:00</span>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Dark Mode"
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors active:scale-95"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <span className="material-symbols-outlined text-[19px]">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          <button
            onClick={toggleBlindMode}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors active:scale-95"
            title="Mute / Toggle Focus"
          >
            <span className="material-symbols-outlined text-[20px]">
              {blindMode ? 'visibility' : 'visibility_off'}
            </span>
          </button>
        </div>
      </header>
    );
  }

  // Screen 4: Feynman Diagnostic Top Bar
  if (currentScreen === 'diagnostic') {
    return (
      <header className="bg-surface/90 dark:bg-surface-container-lowest/90 backdrop-blur-md fixed top-0 left-0 w-full z-40 flex items-center justify-between px-space-md py-space-sm border-b border-outline-variant/30">
        <div className="flex items-center gap-space-sm">
          <button
            onClick={() => setCurrentScreen('explain')}
            aria-label="Back"
            className="w-9 h-9 rounded-full flex items-center justify-center text-primary dark:text-primary-fixed hover:bg-surface-container-high transition-transform active:scale-95"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
                Feynman Diagnostic
              </span>
              <span className="text-outline-variant text-[10px]">/</span>
              <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                Steps 3 & 4
              </span>
            </div>
            <h1 className="font-headline-sm text-headline-sm font-semibold text-primary dark:text-primary-fixed leading-tight">
              {activeConcept.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Dark Mode"
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-transform active:scale-95"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <span className="material-symbols-outlined text-[19px]">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          <button
            onClick={() => showToast('Summary copied to clipboard!')}
            aria-label="Share"
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-transform active:scale-95"
            title="Export or Share Summary"
          >
            <span className="material-symbols-outlined">share</span>
          </button>
          <button
            onClick={toggleBlindMode}
            aria-label="Toggle Blind Mode"
            className="w-9 h-9 rounded-full flex items-center justify-center text-primary dark:text-primary-fixed hover:bg-surface-container-high hover:text-on-surface transition-transform active:scale-95"
          >
            <span className="material-symbols-outlined">
              {blindMode ? 'visibility' : 'visibility_off'}
            </span>
          </button>
        </div>
      </header>
    );
  }

  // Diagrams or Review screen fallback top bar
  return (
    <header className="fixed top-0 left-0 w-full z-40 flex items-center justify-between px-space-md py-space-sm bg-surface/90 dark:bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/30">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCurrentScreen('library')}
          className="p-1 rounded-lg text-primary dark:text-primary-fixed hover:bg-surface-container-high transition-transform active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <h1 className="text-headline-sm font-headline-sm font-bold text-primary dark:text-primary-fixed">
          {currentScreen === 'diagrams' ? 'Visual Intuition & Schematics' : 'Spaced Repetition Queue'}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          aria-label="Toggle Dark Mode"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-transform active:scale-95"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          <span className="material-symbols-outlined text-[20px]">
            {isDark ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
      </div>
    </header>
  );
};
