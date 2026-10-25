import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const DiagnosticScreen: React.FC = () => {
  const {
    activeConcept,
    setCurrentScreen,
    clarityScore,
    addToReviewQueue,
    setIsMathRefresherOpen,
    lastEvaluation,
    showToast
  } = useApp();

  const [activeDiagramTab, setActiveDiagramTab] = useState<'vector' | 'flowchart'>('vector');
  const [analogySeed, setAnalogySeed] = useState(0);
  const [analogyFeedback, setAnalogyFeedback] = useState<'none' | 'liked' | 'alternate'>('none');

  const alternateAnalogies = [
    {
      title: 'The Coffee Cup in a Stadium Analogy',
      quote:
        '“Think of a synchronized dance troupe in an empty gym (pure state). Now open the doors to 50,000 shouting fans tossing confetti. The dancers are still dancing, but environmental noise makes collective sync invisible.”',
      note: 'Phase angles scatter into environmental degrees of freedom without energy dissipation.'
    },
    {
      title: 'The Whispering Bell in a Windstorm',
      quote:
        '“A crystal bell rings in perfect resonant pitch in a quiet bell jar. Once you open the window to a chaotic windstorm, trillions of air molecules absorb tiny fractions of the sound wave until the pure note dissolves into uniform background hiss.”',
      note: 'Information is never obliterated; it is irreversibly entangled with thermal environmental entropy.'
    }
  ];

  const currentAnalogy = alternateAnalogies[analogySeed % alternateAnalogies.length];

  const handleAlternateAnalogy = () => {
    setAnalogySeed((prev) => prev + 1);
    setAnalogyFeedback('alternate');
    showToast('Generated fresh mental model replacement!');
  };

  const handleLikeAnalogy = () => {
    setAnalogyFeedback('liked');
    showToast('Analogy pinned to your study deck!');
  };

  // Math for Circular SVG ring
  const radius = 40;
  const circumference = 2 * Math.PI * radius; // 251.3
  const strokeDashoffset = circumference - (clarityScore / 100) * circumference;

  return (
    <main className="max-w-2xl mx-auto px-margin-mobile pt-20 pb-36 space-y-space-lg">
      {/* STEP PROGRESSION BADGES */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-2 py-0.5 rounded-full bg-surface-container dark:bg-surface-container-high text-outline text-[11px] font-label-md font-semibold">
            1. Definition
          </span>
          <span className="text-outline-variant text-xs">→</span>
          <button
            onClick={() => setCurrentScreen('probe')}
            className="px-2 py-0.5 rounded-full bg-surface-container dark:bg-surface-container-high text-outline hover:text-on-surface text-[11px] font-label-md font-semibold transition-colors"
          >
            2. Teach
          </button>
          <span className="text-outline-variant text-xs">→</span>
          <span className="px-2.5 py-0.5 rounded-full bg-secondary-container/30 text-secondary dark:text-secondary-fixed text-[11px] font-label-md font-bold ring-1 ring-secondary/20">
            3. Diagnostic & Gaps
          </span>
        </div>
        <span className="font-label-sm text-label-sm text-outline tracking-wider uppercase">
          Session #4
        </span>
      </div>

      {/* MASTERY SCORE HEADER (Bento Ring Anchor) */}
      <section className="bg-surface-container-lowest dark:bg-surface-container-low rounded-xl hairline-border p-5 shadow-[0px_2px_8px_rgba(24,24,27,0.04)]">
        <div className="flex items-center gap-5">
          {/* Circular Mastery Metric Ring */}
          <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background Track */}
              <circle
                cx="50"
                cy="50"
                fill="transparent"
                r={radius}
                stroke="currentColor"
                className="text-[#EFECE5] dark:text-[#2d2d27]"
                strokeWidth="7"
              ></circle>
              {/* Active Score Arc */}
              <circle
                cx="50"
                cy="50"
                fill="transparent"
                r={radius}
                stroke="#1B2F6C"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                strokeWidth="7"
                className="transition-all duration-700"
              ></circle>
              {/* Alert gap marker portion */}
              <circle
                cx="50"
                cy="50"
                fill="transparent"
                r={radius}
                stroke="#C25E34"
                strokeDasharray={circumference}
                strokeDashoffset="232"
                strokeLinecap="round"
                strokeWidth="7"
                className="opacity-90"
              ></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed leading-none">
                {clarityScore}%
              </span>
              <span className="font-label-sm text-[9px] uppercase tracking-wider text-outline font-semibold mt-0.5">
                Clarity
              </span>
            </div>
          </div>

          {/* Metric Details & Contextual Diagnosis */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/10 text-secondary dark:text-secondary-fixed font-label-sm text-label-sm uppercase font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                Attention Required
              </span>
            </div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">
              Conceptual Clarity Gaps
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-snug">
              <strong className="font-semibold text-secondary">2 Jargon Crutches</strong> identified
              • <strong className="font-semibold text-on-surface">1 Missing Prerequisite</strong>.
              Your explanation is fluent, but glosses over foundational micro-mechanisms.
            </p>
          </div>
        </div>

        {/* Quick Audio Waveform Footprint */}
        <div className="mt-4 pt-3.5 border-t border-surface-variant dark:border-surface-container-high flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const text =
                  lastEvaluation?.aiTutorSpokenCritique ||
                  "Listen: you understand the math, but don't hide behind words like measurement apparatus. Picture the detector as a stadium full of screaming fans.";
                if ('speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                  const utterance = new SpeechSynthesisUtterance(text);
                  utterance.pitch = 0.88;
                  utterance.rate = 1.0;
                  window.speechSynthesis.speak(utterance);
                  showToast("Playing Feynman's spoken critique (Male Voice)...");
                }
              }}
              className="flex items-center gap-1.5 text-primary dark:text-primary-fixed hover:opacity-80 active:scale-95 transition-transform"
              title="Hear Feynman's spoken assessment"
            >
              <span className="material-symbols-outlined text-[18px]">
                graphic_eq
              </span>
              <span className="font-label-md text-label-md text-on-surface font-medium">
                Recorded Explanation (02:41)
              </span>
              <span className="text-[10px] bg-secondary/15 text-secondary dark:text-secondary-fixed px-1.5 py-0.2 rounded font-bold uppercase ml-1">
                Hear Tutor
              </span>
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-3.5 bg-primary rounded-full"></span>
            <span className="w-1.5 h-5 bg-primary rounded-full"></span>
            <span className="w-1.5 h-2 bg-primary rounded-full"></span>
            <span
              className="w-1.5 h-6 bg-secondary rounded-full cursor-pointer"
              title="Jargon flagged at 01:14"
            ></span>
            <span className="w-1.5 h-4 bg-primary rounded-full"></span>
            <span
              className="w-1.5 h-3 bg-secondary rounded-full cursor-pointer"
              title="Gap flagged at 01:48"
            ></span>
            <span className="w-1.5 h-5 bg-primary rounded-full"></span>
            <span className="w-1.5 h-2 bg-surface-dim rounded-full"></span>
          </div>
        </div>
      </section>

      {/* SECTION 1: IDENTIFIED KNOWLEDGE GAPS */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              Step 3 • Identified Knowledge Gaps
            </h3>
          </div>
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
            Targeted Surgery
          </span>
        </div>

        {/* Card A: Critical Knowledge Gap (Recessed terracotta style) */}
        <article className="recessed-gap-card rounded-xl p-4 transition-all duration-150 relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-label-sm text-[11px] font-bold">
                A
              </span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary dark:text-secondary-fixed font-bold">
                Critical Intuition Gap
              </span>
            </div>
            <span className="font-label-sm text-[10px] text-outline font-semibold">
              Flagged at 01:14
            </span>
          </div>
          <div className="mt-2.5 space-y-1.5">
            <p className="font-body-md text-body-md text-on-surface font-medium leading-relaxed">
              You relied on the phrase{' '}
              <span className="bg-secondary/15 text-secondary dark:text-secondary-fixed px-1.5 py-0.5 rounded font-mono text-[13px] font-semibold underline decoration-secondary decoration-dashed">
                "measurement apparatus"
              </span>{' '}
              without explaining how macroscopic interaction causes irreversible phase loss.
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant italic">
              Feynman warning: Using a textbook label hides the fact that the detector is simply
              another quantum system with 10²³ chaotic degrees of freedom.
            </p>
          </div>
          {/* Action Pill for Card A */}
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-secondary/20">
            <div className="flex items-center gap-1.5 text-secondary dark:text-secondary-fixed text-xs font-label-md">
              <span className="material-symbols-outlined text-[16px]">timer</span>
              <span>Micro-Drill recommended</span>
            </div>
            <button
              onClick={() => setCurrentScreen('probe')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md font-semibold hover:bg-secondary/90 active:scale-95 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">mic</span>
              <span>Re-explain this slice (30s)</span>
            </button>
          </div>
        </article>

        {/* Card B: Prerequisite Notice (Ivory Hairline style) */}
        <article className="prereq-gap-card rounded-xl p-4 transition-all duration-150 shadow-[0px_2px_8px_rgba(24,24,27,0.03)] border-l-4 border-l-primary">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-sm text-[11px] font-bold">
                B
              </span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary dark:text-primary-fixed font-bold">
                Prerequisite Link Missing
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-surface-container dark:bg-surface-container-high font-label-sm text-[10px] text-on-surface-variant">
              Formal Rigor
            </span>
          </div>
          <div className="mt-2.5 space-y-1">
            <p className="font-body-md text-body-md text-on-surface leading-relaxed">
              Missing link:{' '}
              <strong className="font-semibold text-primary dark:text-primary-fixed">
                Density matrix off-diagonal elements decay
              </strong>{' '}
              (ρ_ij → 0).
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              You described the disappearance of interference fringes, but did not connect it to the
              mathematical leakage of quantum coherence into thermal environmental entanglements.
            </p>
          </div>
          <div className="mt-3.5 pt-3 border-t border-surface-container dark:border-surface-container-high flex items-center justify-between">
            <button
              onClick={() => setIsMathRefresherOpen(true)}
              className="text-primary dark:text-primary-fixed hover:text-primary-container font-label-md text-label-md font-semibold inline-flex items-center gap-1 hover:underline"
            >
              <span className="material-symbols-outlined text-[16px]">menu_book</span>
              <span>View 1-Paragraph Math Refresher</span>
            </button>
            <button
              onClick={() => addToReviewQueue('Density matrix off-diagonal elements decay (ρ_ij → 0)')}
              aria-label="Bookmark"
              className="w-7 h-7 rounded-full flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container"
              title="Bookmark to Anki"
            >
              <span className="material-symbols-outlined text-[18px]">bookmark_add</span>
            </button>
          </div>
        </article>
      </section>

      {/* SECTION 2: AI INTUITIVE ANALOGY GENERATOR */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-tertiary-container"></span>
            <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              Step 4 • AI Intuitive Analogy Generator
            </h3>
          </div>
          <span className="inline-flex items-center gap-1 font-label-sm text-[10px] text-tertiary-container dark:text-tertiary-fixed font-bold bg-tertiary-fixed/40 dark:bg-tertiary-container/30 px-2 py-0.5 rounded-full">
            <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
            Synthesized
          </span>
        </div>

        {/* Feature Analogy Card */}
        <article className="bg-surface-container-lowest dark:bg-surface-container-low rounded-xl hairline-border p-5 shadow-[0px_2px_8px_rgba(24,24,27,0.04)] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary dark:text-secondary-fixed font-bold">
                Mental Model Replacement
              </span>
              <h4 className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed italic">
                {currentAnalogy.title}
              </h4>
            </div>
            <div className="p-2 rounded-lg bg-surface-container dark:bg-surface-container-high text-primary dark:text-primary-fixed">
              <span className="material-symbols-outlined text-[24px]">psychology_alt</span>
            </div>
          </div>

          {/* Narrative Quote */}
          <blockquote className="my-3.5 pl-3.5 border-l-2 border-secondary bg-surface-container-low/60 dark:bg-surface-container/60 py-2.5 pr-3 rounded-r-lg">
            <p className="font-body-lg text-body-lg text-on-surface italic leading-relaxed">
              {currentAnalogy.quote}
            </p>
          </blockquote>

          {/* Schematic / Diagram Interactive Preview Container */}
          <div className="mt-4 bg-surface-container-low dark:bg-surface-container rounded-lg p-3.5 hairline-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-outline text-[18px]">schema</span>
                <span className="font-label-md text-label-md font-semibold text-on-surface">
                  Visual Intuition Schematic
                </span>
              </div>

              {/* Toggle Component: Vector Diagram vs Flowchart */}
              <div
                className="inline-flex p-0.5 rounded-lg bg-surface-container dark:bg-surface-container-high hairline-border text-xs"
                role="tablist"
              >
                <button
                  onClick={() => setActiveDiagramTab('vector')}
                  className={`px-2.5 py-1 rounded font-label-sm text-[11px] transition-all ${
                    activeDiagramTab === 'vector'
                      ? 'font-semibold bg-surface-container-lowest dark:bg-surface-container text-primary dark:text-primary-fixed shadow-sm'
                      : 'font-medium text-outline hover:text-on-surface'
                  }`}
                >
                  Vector Diagram
                </button>
                <button
                  onClick={() => setActiveDiagramTab('flowchart')}
                  className={`px-2.5 py-1 rounded font-label-sm text-[11px] transition-all ${
                    activeDiagramTab === 'flowchart'
                      ? 'font-semibold bg-surface-container-lowest dark:bg-surface-container text-primary dark:text-primary-fixed shadow-sm'
                      : 'font-medium text-outline hover:text-on-surface'
                  }`}
                >
                  Generate Flowchart
                </button>
              </div>
            </div>

            {/* Vector Diagram View */}
            {activeDiagramTab === 'vector' ? (
              <div>
                <div className="w-full h-32 rounded bg-surface-container-lowest dark:bg-surface-container-lowest flex items-center justify-center p-3 relative overflow-hidden hairline-border">
                  <svg className="w-full h-full max-w-sm" fill="none" viewBox="0 0 320 80">
                    <defs>
                      <marker
                        id="arrow"
                        viewBox="0 0 10 10"
                        refX="5"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#C25E34" />
                      </marker>
                    </defs>

                    {/* Coherent Phase (Left) */}
                    <g transform="translate(10, 10)">
                      <circle
                        cx="30"
                        cy="30"
                        r="26"
                        stroke="#1B2F6C"
                        strokeDasharray="2 2"
                        strokeWidth="1.5"
                        fill="#F0EEE8"
                        fillOpacity="0.4"
                      />
                      <line
                        x1="30"
                        y1="30"
                        x2="30"
                        y2="8"
                        stroke="#1B2F6C"
                        strokeLinecap="round"
                        strokeWidth="2.5"
                      />
                      <line
                        x1="30"
                        y1="30"
                        x2="48"
                        y2="18"
                        stroke="#1B2F6C"
                        strokeLinecap="round"
                        strokeWidth="2.5"
                      />
                      <text
                        x="30"
                        y="70"
                        fill="#1B2F6C"
                        fontFamily="Plus Jakarta Sans"
                        fontSize="9"
                        fontWeight="600"
                        textAnchor="middle"
                      >
                        Synchronized (|ψ⟩)
                      </text>
                    </g>

                    {/* Environmental Interaction Arrow */}
                    <g transform="translate(100, 32)">
                      <path
                        d="M 5 8 L 45 8"
                        stroke="#C25E34"
                        strokeLinecap="round"
                        strokeWidth="1.5"
                        markerEnd="url(#arrow)"
                      />
                      <text
                        x="25"
                        y="-2"
                        fill="#C25E34"
                        fontFamily="Plus Jakarta Sans"
                        fontSize="8"
                        fontWeight="700"
                        textAnchor="middle"
                      >
                        10²³ Photons
                      </text>
                      <circle cx="20" cy="8" r="1.5" fill="#C25E34" />
                      <circle cx="32" cy="4" r="1.5" fill="#C25E34" />
                      <circle cx="12" cy="14" r="1.5" fill="#C25E34" />
                    </g>

                    {/* Dephased / Decohered State (Right) */}
                    <g transform="translate(170, 10)">
                      <circle cx="45" cy="30" r="26" stroke="#c5c5d1" strokeWidth="1.5" fill="#FFFFFF" />
                      <line
                        x1="45"
                        y1="30"
                        x2="60"
                        y2="15"
                        stroke="#9d431b"
                        strokeLinecap="round"
                        strokeWidth="1.5"
                      />
                      <line
                        x1="45"
                        y1="30"
                        x2="30"
                        y2="46"
                        stroke="#757681"
                        strokeLinecap="round"
                        strokeWidth="1.5"
                      />
                      <line
                        x1="45"
                        y1="30"
                        x2="25"
                        y2="20"
                        stroke="#c5c5d1"
                        strokeLinecap="round"
                        strokeWidth="1.5"
                      />
                      <line
                        x1="45"
                        y1="30"
                        x2="58"
                        y2="42"
                        stroke="#454650"
                        strokeLinecap="round"
                        strokeWidth="1.5"
                      />
                      <text
                        x="45"
                        y="70"
                        fill="#757681"
                        fontFamily="Plus Jakarta Sans"
                        fontSize="9"
                        fontWeight="600"
                        textAnchor="middle"
                      >
                        Phase Randomization
                      </text>
                    </g>
                  </svg>
                </div>
                <p className="font-body-sm text-[12px] text-outline mt-2 text-center">
                  {currentAnalogy.note}
                </p>
              </div>
            ) : (
              /* Flowchart View */
              <div className="w-full py-3 px-2 rounded bg-surface-container-lowest dark:bg-surface-container-lowest hairline-border">
                <div className="flex flex-col gap-2 font-label-sm text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-primary-container text-on-primary flex items-center justify-center font-bold text-[10px]">
                      1
                    </span>
                    <span className="text-on-surface font-semibold">Isolated System:</span>
                    <span className="text-outline">Coherent superposition maintained</span>
                  </div>

                  <div className="pl-2 border-l border-outline-variant ml-2.5 text-secondary text-[11px] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">south</span>
                    <span>Unavoidable environmental contact (air, thermal radiation)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-secondary text-on-secondary flex items-center justify-center font-bold text-[10px]">
                      2
                    </span>
                    <span className="text-on-surface font-semibold">Quantum Entanglement:</span>
                    <span className="text-outline">System entangles with environment</span>
                  </div>

                  <div className="pl-2 border-l border-outline-variant ml-2.5 text-secondary text-[11px] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">south</span>
                    <span>Tracing out environmental states</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-surface-dim text-on-surface flex items-center justify-center font-bold text-[10px]">
                      3
                    </span>
                    <span className="text-on-surface font-semibold">Classical Appearance:</span>
                    <span className="text-outline">
                      Density matrix appears diagonal (Statistical mixture)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Analogy Adaptation Feedback */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1 text-outline font-label-sm text-[11px]">
                <span>Did this analogy clarify the gap?</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleLikeAnalogy}
                  className={`px-2 py-0.5 rounded font-label-md text-xs inline-flex items-center gap-1 transition-colors ${
                    analogyFeedback === 'liked'
                      ? 'bg-primary text-on-primary font-bold'
                      : 'bg-surface-container dark:bg-surface-container-high hover:bg-surface-container-highest text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">thumb_up</span>
                  <span>Yes</span>
                </button>
                <button
                  onClick={handleAlternateAnalogy}
                  className="px-2 py-0.5 rounded bg-surface-container dark:bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-xs inline-flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                  <span>Alternate</span>
                </button>
              </div>
            </div>
          </div>
        </article>
      </section>

      {/* SECTION 3: ONE-CLICK REFINEMENT LOOP */}
      <section className="space-y-3 pt-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary dark:bg-primary-fixed"></span>
          <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
            Section 3 • Refinement Loop
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Retest Voice Button (Primary Action) */}
          <button
            onClick={() => setCurrentScreen('probe')}
            className="h-12 px-4 rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 hover:bg-primary transition-all active:scale-[0.98] shadow-sm group"
          >
            <span className="material-symbols-outlined text-[20px] text-secondary-fixed transition-transform group-hover:scale-110">
              mic
            </span>
            <span className="font-semibold">Retest Voice Explanation</span>
          </button>

          {/* Spaced Repetition Queue Button */}
          <button
            onClick={() => addToReviewQueue('Feynman Step 3 Diagnosis: Decoherence & phase loss')}
            className="h-12 px-4 rounded-lg bg-surface-container-lowest dark:bg-surface-container-low hairline-border text-on-surface font-label-lg text-label-lg flex items-center justify-center gap-2 hover:bg-surface-container hover:border-outline-variant transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[20px] text-primary dark:text-primary-fixed">
              save
            </span>
            <span className="font-semibold">Add to Review Queue (Anki)</span>
          </button>
        </div>

        {/* Quick Guidance Tooltip */}
        <p className="font-body-sm text-[12px] text-outline text-center pt-1">
          Feynman cycle: Teaching again immediately after seeing the analogy increases long-term
          retention by 3.4×.
        </p>
      </section>
    </main>
  );
};
