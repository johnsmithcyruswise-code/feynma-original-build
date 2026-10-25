import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

export const LibraryScreen: React.FC = () => {
  const {
    concepts,
    setSelectedConceptId,
    setCurrentScreen,
    setIsNewProbeModalOpen,
    showToast
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'in_progress' | 'mastered' | 'needs_simplification'>('all');
  const [sortMode, setSortMode] = useState<'urgency' | 'clarity' | 'alphabetical'>('urgency');

  const filteredConcepts = useMemo(() => {
    return concepts
      .filter((c) => {
        const matchesQuery =
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.summary.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesQuery) return false;

        if (activeFilter === 'in_progress') return c.clarityScore < 85 && c.clarityScore >= 70;
        if (activeFilter === 'mastered') return c.clarityScore >= 85;
        if (activeFilter === 'needs_simplification') return c.clarityScore < 70;
        return true;
      })
      .sort((a, b) => {
        if (sortMode === 'urgency') return a.clarityScore - b.clarityScore;
        if (sortMode === 'clarity') return b.clarityScore - a.clarityScore;
        return a.title.localeCompare(b.title);
      });
  }, [concepts, searchQuery, activeFilter, sortMode]);

  const handleOpenConcept = (id: string, screen: 'explain' | 'probe' | 'diagnostic' | 'diagrams' = 'explain') => {
    setSelectedConceptId(id);
    setCurrentScreen(screen);
  };

  return (
    <main className="pt-20 px-margin-mobile md:px-margin max-w-2xl mx-auto space-y-space-lg pb-32">
      {/* SEARCH & DISCOVERY BAR */}
      <section className="space-y-space-sm">
        <div className="flex items-center gap-space-sm">
          <div className="relative flex-1 flex items-center bg-surface-container-lowest dark:bg-surface-container-low rounded-xl hairline-border px-space-md py-2.5 shadow-[0px_2px_8px_rgba(24,24,27,0.03)] focus-within:border-primary-container transition-all">
            <span className="material-symbols-outlined text-outline text-[20px] mr-2.5">
              search
            </span>
            <input
              className="w-full bg-transparent border-none p-0 text-body-md font-body-md text-on-surface placeholder:text-outline/70 placeholder:font-body-lg placeholder:italic focus:ring-0 outline-none"
              placeholder="Search concepts, books, or papers..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-label-sm font-label-sm text-outline bg-surface-container rounded border border-outline-variant/40">
              ⌘K
            </kbd>
          </div>

          <button
            onClick={() => {
              setSortMode((prev) =>
                prev === 'urgency' ? 'clarity' : prev === 'clarity' ? 'alphabetical' : 'urgency'
              );
              showToast(`Sorted by: ${sortMode === 'urgency' ? 'Highest Clarity' : sortMode === 'clarity' ? 'A-Z' : 'Gap Urgency'}`);
            }}
            aria-label="Filter documents"
            className="h-11 px-3.5 flex items-center justify-center bg-surface-container-lowest dark:bg-surface-container-low hairline-border rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all active:scale-95 shadow-[0px_2px_8px_rgba(24,24,27,0.03)]"
            title="Cycle sort mode"
          >
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
          </button>
        </div>

        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-space-xs overflow-x-auto custom-scroll py-1 -mx-margin-mobile px-margin-mobile sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveFilter('all')}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-label-sm font-label-sm transition-transform active:scale-95 ${
              activeFilter === 'all'
                ? 'bg-primary text-on-primary shadow-sm font-bold'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            All (24)
          </button>
          <button
            onClick={() => setActiveFilter('in_progress')}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-label-sm font-label-sm transition-transform active:scale-95 ${
              activeFilter === 'in_progress'
                ? 'bg-primary text-on-primary shadow-sm font-bold'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            In Progress (5)
          </button>
          <button
            onClick={() => setActiveFilter('mastered')}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-label-sm font-label-sm transition-transform active:scale-95 ${
              activeFilter === 'mastered'
                ? 'bg-primary text-on-primary shadow-sm font-bold'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            Mastered (16)
          </button>
          <button
            onClick={() => setActiveFilter('needs_simplification')}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-label-sm font-label-sm border transition-transform active:scale-95 ${
              activeFilter === 'needs_simplification'
                ? 'bg-secondary text-on-secondary border-secondary font-bold'
                : 'bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/15'
            }`}
          >
            Needs Simplification (3)
          </button>
        </div>
      </section>

      {/* MULTI-DOCUMENT SYNTHESIS HERO CARD */}
      <section className="bg-surface-container-lowest dark:bg-surface-container-low rounded-xl hairline-border p-5 space-y-5 shadow-[0px_2px_12px_rgba(24,24,27,0.04)] relative overflow-hidden">
        {/* Subtle top tint banner strip */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-container via-secondary to-tertiary-container"></div>

        <div className="flex items-start justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-sm font-label-sm tracking-wider uppercase bg-surface-container text-on-surface-variant mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              Active Multi-Doc Synthesis
            </span>
            <h2 className="text-headline-md font-headline-md text-primary dark:text-primary-fixed tracking-tight">
              Statistical Thermodynamics & Quantum States
            </h2>
          </div>
          <span className="material-symbols-outlined text-outline-variant text-[24px]">
            auto_stories
          </span>
        </div>

        {/* Sources cluster */}
        <div className="bg-surface-container-low dark:bg-surface-container rounded-lg p-3 space-y-2 hairline-border">
          <div className="flex items-center justify-between text-label-md font-label-md text-outline">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary dark:text-primary-fixed">
                layers
              </span>
              3 Indexed Sources
            </span>
            <span className="text-label-sm font-label-sm text-primary dark:text-primary-fixed font-semibold">
              Ready to Teach
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 text-body-sm font-body-sm text-on-surface">
            <span className="inline-flex items-center gap-1 bg-surface-container-lowest dark:bg-surface-container-low px-2 py-0.5 rounded hairline-border text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px] text-outline">
                picture_as_pdf
              </span>
              Griffith's QM (Ch. 5)
            </span>
            <span className="inline-flex items-center gap-1 bg-surface-container-lowest dark:bg-surface-container-low px-2 py-0.5 rounded hairline-border text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px] text-outline">
                menu_book
              </span>
              Susskind: Theoretical Min.
            </span>
            <span className="inline-flex items-center gap-1 bg-surface-container-lowest dark:bg-surface-container-low px-2 py-0.5 rounded hairline-border text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px] text-outline">
                notes
              </span>
              MIT 8.04 Lecture 14 Notes
            </span>
          </div>
        </div>

        {/* Ingestion / Action Drop Zone */}
        <div
          onClick={() => setIsNewProbeModalOpen(true)}
          className="hairline-dashed rounded-lg p-4 bg-secondary/5 text-center flex flex-col items-center justify-center gap-2 group cursor-pointer hover:bg-secondary/10 transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-surface-container-lowest dark:bg-surface-container flex items-center justify-center text-secondary shadow-sm hairline-border">
            <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
          </div>
          <div>
            <p className="text-body-md font-body-md font-medium text-on-surface">
              Drop PDF, EPUB, or ArXiv links to enrich
            </p>
            <p className="text-label-md font-label-md text-outline">
              or tap below to incorporate written notes
            </p>
          </div>
          <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsNewProbeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest dark:bg-surface-container hairline-border text-label-md font-label-md text-on-surface hover:text-primary active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
              Paste Lecture Notes
            </button>
            <button
              onClick={() => handleOpenConcept('quantum-decoherence', 'probe')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-label-md font-label-md hover:opacity-95 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[16px]">mic</span>
              Explain Now
            </button>
          </div>
        </div>
      </section>

      {/* SECTION TITLE & STUDY DECK COUNTER */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-baseline gap-2">
          <h3 className="text-headline-sm font-headline-sm text-on-surface font-semibold">
            Concept Decks
          </h3>
          <span className="text-label-md font-label-md text-outline">
            {filteredConcepts.length} Active Probes
          </span>
        </div>
        <button
          onClick={() => {
            setSortMode((prev) =>
              prev === 'urgency' ? 'clarity' : prev === 'clarity' ? 'alphabetical' : 'urgency'
            );
          }}
          className="text-label-md font-label-md text-primary dark:text-primary-fixed font-semibold flex items-center gap-0.5 hover:underline"
        >
          <span>
            {sortMode === 'urgency'
              ? 'Sort by Gap Urgency'
              : sortMode === 'clarity'
              ? 'Sort by Clarity Score'
              : 'Sort Alphabetically'}
          </span>
          <span className="material-symbols-outlined text-[16px]">arrow_drop_down</span>
        </button>
      </div>

      {/* INDEXED SUBJECT DECK */}
      <div className="space-y-space-md">
        {filteredConcepts.map((concept) => {
          // Card 1: Quantum Decoherence (Needs Analogy Polish)
          if (concept.id === 'quantum-decoherence') {
            return (
              <article
                key={concept.id}
                onClick={() => handleOpenConcept(concept.id, 'explain')}
                className="bg-surface-container-lowest dark:bg-surface-container-low rounded-xl hairline-border p-4.5 space-y-3 shadow-[0px_2px_8px_rgba(24,24,27,0.03)] hover:border-outline transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-label-sm font-label-sm text-outline uppercase tracking-wider">
                        {concept.domain}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                      <span className="text-label-sm font-label-sm text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px] text-secondary">
                          graphic_eq
                        </span>
                        {concept.testsTaken} voice tests taken
                      </span>
                    </div>
                    <h4 className="text-headline-sm font-headline-sm text-primary dark:text-primary-fixed font-semibold">
                      {concept.title}
                    </h4>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-label-sm font-label-sm bg-secondary/10 text-secondary border border-secondary/20">
                    <span className="material-symbols-outlined text-[12px]">psychology_alt</span>
                    {concept.status}
                  </span>
                </div>

                <p className="text-body-md font-body-md text-on-surface-variant">
                  {concept.summary}
                </p>

                {/* Metrics & Feynman Progress Bar */}
                <div className="pt-1 space-y-1.5">
                  <div className="flex justify-between items-center text-label-sm font-label-sm">
                    <span className="text-outline">Feynman Clarity Score</span>
                    <span className="text-primary dark:text-primary-fixed font-bold">
                      {concept.clarityScore}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container dark:bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-container rounded-full"
                      style={{ width: `${concept.clarityScore}%` }}
                    ></div>
                  </div>
                </div>

                {/* Quick Deck Actions */}
                <div className="pt-2 flex items-center justify-between border-t border-outline-variant/30 text-label-md font-label-md">
                  <span className="text-outline flex items-center gap-1 font-body-sm text-[13px]">
                    <span className="material-symbols-outlined text-[16px] text-secondary">
                      flag
                    </span>
                    {concept.gapNote}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenConcept(concept.id, 'probe');
                    }}
                    className="text-primary dark:text-primary-fixed font-semibold flex items-center gap-0.5 hover:text-primary-container active:scale-95 transition-transform"
                  >
                    <span>Test Voice</span>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>
              </article>
            );
          }

          // Card 2: Gradient Descent & Loss Surfaces (Sage Mastery Accent)
          if (concept.id === 'gradient-descent') {
            return (
              <article
                key={concept.id}
                onClick={() => handleOpenConcept(concept.id, 'explain')}
                className="bg-surface-container-lowest dark:bg-surface-container-low rounded-xl hairline-border p-4.5 space-y-3 shadow-[0px_2px_8px_rgba(24,24,27,0.03)] border-l-4 border-l-tertiary-container hover:border-outline transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-label-sm font-label-sm text-outline uppercase tracking-wider">
                        {concept.domain}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                      <span className="text-label-sm font-label-sm text-tertiary-container dark:text-tertiary-fixed font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">verified</span>
                        Verified Synthesis
                      </span>
                    </div>
                    <h4 className="text-headline-sm font-headline-sm text-on-surface font-semibold">
                      {concept.title}
                    </h4>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-label-sm font-label-sm bg-tertiary-fixed/30 text-tertiary-container dark:text-tertiary-fixed border border-tertiary-fixed">
                    <span className="material-symbols-outlined text-[12px]">school</span>
                    {concept.status}
                  </span>
                </div>

                <blockquote className="bg-surface-container-low dark:bg-surface-container rounded-lg p-3 text-body-lg font-body-lg italic text-on-surface-variant hairline-border">
                  “Walking down a foggy alpine valley blindfolded, using only the tilt beneath your boots to step downhill.”
                </blockquote>

                <div className="pt-1 space-y-1.5">
                  <div className="flex justify-between items-center text-label-sm font-label-sm">
                    <span className="text-outline">Feynman Clarity Score</span>
                    <span className="text-tertiary-container dark:text-tertiary-fixed font-bold">
                      {concept.clarityScore}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container dark:bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className="h-full bg-tertiary-container rounded-full"
                      style={{ width: `${concept.clarityScore}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-outline-variant/30 text-label-md font-label-md">
                  <span className="text-outline font-body-sm text-[13px]">
                    Tested across 4 child personas
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenConcept(concept.id, 'diagnostic');
                    }}
                    className="text-on-surface-variant hover:text-primary dark:hover:text-primary-fixed font-medium flex items-center gap-0.5"
                  >
                    <span>View Transcript</span>
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  </button>
                </div>
              </article>
            );
          }

          // Card 3: Hebbian Plasticity & LTP (Recessed Terracotta Knowledge Gap)
          if (concept.id === 'hebbian-plasticity') {
            return (
              <article
                key={concept.id}
                onClick={() => handleOpenConcept(concept.id, 'explain')}
                className="bg-surface-container-lowest dark:bg-surface-container-low rounded-xl hairline-border p-4.5 space-y-3 shadow-[0px_2px_8px_rgba(24,24,27,0.03)] hover:border-outline transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-label-sm font-label-sm text-outline uppercase tracking-wider">
                        {concept.domain}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                      <span className="text-label-sm font-label-sm text-secondary font-medium">
                        1 voice attempt
                      </span>
                    </div>
                    <h4 className="text-headline-sm font-headline-sm text-primary dark:text-primary-fixed font-semibold">
                      {concept.title}
                    </h4>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-label-sm font-label-sm bg-secondary/10 text-secondary border border-secondary/20">
                    <span className="material-symbols-outlined text-[12px]">warning</span>
                    2 Critical Gaps
                  </span>
                </div>

                {/* Recessed Knowledge Gap Callout */}
                <div className="p-3 bg-secondary/5 rounded-lg hairline-dashed text-body-sm font-body-sm text-on-secondary-container dark:text-secondary-fixed space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-secondary">
                    <span className="material-symbols-outlined text-[16px]">search_insights</span>
                    Identified Jargon Crutches:
                  </div>
                  <p className="text-on-surface-variant pl-5 text-xs sm:text-sm">
                    1. Unexplained NMDA receptor magnesium unblocking.
                    <br />
                    2. Vague conflation of post-tetanic potentiation with true LTP.
                  </p>
                </div>

                <div className="pt-1 space-y-1.5">
                  <div className="flex justify-between items-center text-label-sm font-label-sm">
                    <span className="text-outline">Feynman Clarity Score</span>
                    <span className="text-secondary font-bold">{concept.clarityScore}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container dark:bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded-full"
                      style={{ width: `${concept.clarityScore}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-outline-variant/30 text-label-md font-label-md">
                  <span className="text-outline font-body-sm text-[13px]">
                    Target: Simple analogy for non-physicians
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenConcept(concept.id, 'diagnostic');
                    }}
                    className="text-secondary font-semibold flex items-center gap-0.5 hover:underline active:scale-95 transition-transform"
                  >
                    <span>Fix Gaps</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              </article>
            );
          }

          // Card 4: Byzantine Fault Tolerance & Generic concepts
          return (
            <article
              key={concept.id}
              onClick={() => handleOpenConcept(concept.id, 'explain')}
              className="bg-surface-container-lowest dark:bg-surface-container-low rounded-xl hairline-border p-4.5 space-y-3 shadow-[0px_2px_8px_rgba(24,24,27,0.03)] hover:border-outline transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-label-sm font-label-sm text-outline uppercase tracking-wider">
                      {concept.domain}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                    <span className="text-label-sm font-label-sm text-on-surface-variant">
                      L. Lamport (1982)
                    </span>
                  </div>
                  <h4 className="text-headline-sm font-headline-sm text-primary dark:text-primary-fixed font-semibold">
                    {concept.title}
                  </h4>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-label-sm font-label-sm bg-surface-container text-on-surface-variant border border-outline-variant/40">
                  <span className="material-symbols-outlined text-[12px]">account_tree</span>
                  {concept.status}
                </span>
              </div>

              <p className="text-body-md font-body-md text-on-surface-variant">
                {concept.summary}
              </p>

              <div className="pt-1 space-y-1.5">
                <div className="flex justify-between items-center text-label-sm font-label-sm">
                  <span className="text-outline">Feynman Clarity Score</span>
                  <span className="text-primary dark:text-primary-fixed font-bold">
                    {concept.clarityScore}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-surface-container dark:bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${concept.clarityScore}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-outline-variant/30 text-label-md font-label-md">
                <span className="text-outline font-body-sm text-[13px]">
                  Oral test passed · Mental visual pending
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenConcept(concept.id, 'diagrams');
                  }}
                  className="text-primary dark:text-primary-fixed font-semibold flex items-center gap-0.5 hover:text-primary-container active:scale-95 transition-transform"
                >
                  <span>Open Diagrammer</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* FLOATING QUICK ACTION BUTTON (+ New Concept Probe) */}
      <div className="fixed bottom-20 right-4 sm:right-8 z-40">
        <button
          onClick={() => setIsNewProbeModalOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-secondary text-on-secondary rounded-full shadow-[0px_4px_16px_rgba(157,67,27,0.35)] hover:bg-secondary/95 active:scale-95 transition-all duration-150"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span className="text-label-lg font-label-lg pr-1">New Concept Probe</span>
        </button>
      </div>
    </main>
  );
};
