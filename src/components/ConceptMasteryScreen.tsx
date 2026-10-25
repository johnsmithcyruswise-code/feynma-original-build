import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

export const ConceptMasteryScreen: React.FC = () => {
  const {
    activeConcept,
    setCurrentScreen,
    addToReviewQueue,
    blindMode,
    showToast
  } = useApp();

  const [perspective, setPerspective] = useState<'eli12' | 'undergrad' | 'formal'>('eli12');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<'1.0x' | '1.25x' | '1.5x'>('1.25x');
  const [isAskingTutor, setIsAskingTutor] = useState(false);
  const [tutorDialogText, setTutorDialogText] = useState<string | null>(null);
  const [isTutorThinking, setIsTutorThinking] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const recognitionRef = useRef<any>(null);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Web SpeechRecognition for conversational voice query
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setUserQuery(transcript);
            submitVoiceQuestion(transcript);
          }
        };

        recognition.onend = () => {
          setIsAskingTutor(false);
        };

        recognitionRef.current = recognition;
      } catch (_) {}
    }
  }, [activeConcept]);

  // Find natural male voice
  const getMaleVoice = (): SpeechSynthesisVoice | null => {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    const male = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.toLowerCase().includes('male') ||
          v.name.toLowerCase().includes('david') ||
          v.name.toLowerCase().includes('daniel') ||
          v.name.toLowerCase().includes('guy') ||
          v.name.toLowerCase().includes('george') ||
          v.name.toLowerCase().includes('google us english'))
    );
    return male || voices.find((v) => v.lang.startsWith('en')) || null;
  };

  const togglePlayAudio = () => {
    if (!isPlaying) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const currentPerspective =
          perspective === 'eli12'
            ? activeConcept.perspectives?.eli12
            : perspective === 'undergrad'
            ? activeConcept.perspectives?.undergrad
            : activeConcept.perspectives?.formal;

        const utteranceText = currentPerspective?.quote || activeConcept.summary;
        const utterance = new SpeechSynthesisUtterance(utteranceText);
        const maleVoice = getMaleVoice();
        if (maleVoice) utterance.voice = maleVoice;
        utterance.pitch = 0.88; // Warm, resonant baritone
        utterance.rate = playbackSpeed === '1.0x' ? 1.0 : playbackSpeed === '1.25x' ? 1.25 : 1.5;

        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
      }
      setIsPlaying(true);
      showToast('Playing Feynman Voice Synthesis Briefing (Male Voice)...');
    } else {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
    }
  };

  const cycleSpeed = () => {
    setPlaybackSpeed((curr) => {
      if (curr === '1.0x') return '1.25x';
      if (curr === '1.25x') return '1.5x';
      return '1.0x';
    });
  };

  const handleStartVoiceQA = () => {
    if (isAskingTutor) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsAskingTutor(false);
    } else {
      setIsAskingTutor(true);
      setUserQuery('');
      setTutorDialogText(null);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (_) {}
      }
      showToast('Speak now: Ask Richard Feynman any question aloud...');
    }
  };

  const submitVoiceQuestion = async (questionText: string) => {
    setIsTutorThinking(true);
    showToast('Feynman AI Tutor is thinking...');

    try {
      const res = await fetch('/api/ai/voice-tutor-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionText,
          conceptTitle: activeConcept.title,
          currentContext: activeConcept.summary
        })
      });

      if (res.ok) {
        const data = await res.json();
        setTutorDialogText(data.spokenText);

        // Speak response in male voice
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(data.spokenText);
          const maleVoice = getMaleVoice();
          if (maleVoice) utterance.voice = maleVoice;
          utterance.pitch = 0.88;
          utterance.rate = 1.0;
          window.speechSynthesis.speak(utterance);
        }
      }
    } catch (_) {
      const fallback = `Look, think of ${activeConcept.title} like ink dropping into a turbulent waterfall: the particles never disappear, but the pattern is hopelessly diffused into the room.`;
      setTutorDialogText(fallback);
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(fallback);
        utterance.pitch = 0.88;
        window.speechSynthesis.speak(utterance);
      }
    } finally {
      setIsTutorThinking(false);
    }
  };

  const currentContent =
    activeConcept.perspectives?.[perspective] ||
    activeConcept.perspectives?.eli12 || {
      title: 'Distilled Intuition',
      quote: activeConcept.summary,
      analogyName: 'Primary Analogy',
      analogyText: activeConcept.analogyQuote || 'Physical interactions dilute phase information.'
    };

  return (
    <main className="max-w-md sm:max-w-xl mx-auto pt-20 pb-36 px-gutter">
      {/* Hero Concept Header Section */}
      <section className="mt-2 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-high dark:bg-surface-container text-on-surface-variant text-label-sm font-label-sm">
            FEYNMAN SYNTHESIS
          </span>
          <span className="text-label-sm font-label-sm text-secondary font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">verified</span>
            Core Paradigm
          </span>
        </div>

        {/* Refined Editorial Headline */}
        <h1 className="text-display font-display text-primary dark:text-primary-fixed tracking-tight font-medium mb-3">
          {activeConcept.title}
        </h1>

        {/* Meta Badges Flow Bento Ribbon */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-low dark:bg-surface-container border border-outline-variant/30 text-on-surface-variant text-label-sm font-label-sm">
            <span className="material-symbols-outlined text-[12px] text-outline">hub</span>
            {activeConcept.domain} / Quantum Mechanics
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-lowest dark:bg-surface-container-low hairline-card text-on-tertiary-fixed-variant dark:text-tertiary-fixed text-label-sm font-label-sm font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4D7C5F]"></span>
            Estimated Mastery: {activeConcept.masteryLevel}%
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-low dark:bg-surface-container border border-outline-variant/30 text-secondary text-label-sm font-label-sm font-semibold">
            Difficulty: {activeConcept.difficulty}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-low dark:bg-surface-container border border-outline-variant/30 text-on-surface-variant text-label-sm font-label-sm">
            <span className="material-symbols-outlined text-[12px]">auto_stories</span>
            3 Synthesized Books
          </span>
        </div>
      </section>

      {/* Quick Action Perspective Switcher (ELI12, Undergrad, Formal Proof) */}
      <section className="mb-5">
        <div className="p-1 rounded-xl bg-surface-container-high dark:bg-surface-container flex items-center gap-1">
          {/* Active: ELI12 */}
          <button
            onClick={() => setPerspective('eli12')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-label-sm font-label-sm font-semibold flex items-center justify-center gap-1 transition-all active:scale-95 ${
              perspective === 'eli12'
                ? 'bg-surface-container-lowest dark:bg-surface-container-low text-primary dark:text-primary-fixed shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface font-medium'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[14px] text-secondary">child_care</span>
            ELI12 (Child Analogy)
          </button>

          {/* Undergrad */}
          <button
            onClick={() => setPerspective('undergrad')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-label-sm font-label-sm flex items-center justify-center gap-1 transition-all active:scale-95 ${
              perspective === 'undergrad'
                ? 'bg-surface-container-lowest dark:bg-surface-container-low text-primary dark:text-primary-fixed shadow-sm font-semibold'
                : 'text-on-surface-variant hover:text-on-surface font-medium'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[14px]">school</span>
            Undergrad
          </button>

          {/* Formal Proof */}
          <button
            onClick={() => setPerspective('formal')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-label-sm font-label-sm flex items-center justify-center gap-1 transition-all active:scale-95 ${
              perspective === 'formal'
                ? 'bg-surface-container-lowest dark:bg-surface-container-low text-primary dark:text-primary-fixed shadow-sm font-semibold'
                : 'text-on-surface-variant hover:text-on-surface font-medium'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[14px]">functions</span>
            Formal Proof
          </button>
        </div>
      </section>

      {/* Core Simplified Concept Card (Analogy Variant) */}
      <section className="mb-6">
        <div className="relative bg-surface-container-lowest dark:bg-surface-container-low hairline-card rounded-2xl p-5 overflow-hidden">
          {/* Atmospheric watermark */}
          <div className="absolute -right-4 -bottom-4 text-surface-container dark:text-surface-container-high opacity-40 select-none pointer-events-none">
            <span className="material-symbols-outlined text-[110px]">format_quote</span>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[18px]">lightbulb</span>
              <span className="text-label-sm font-label-sm text-secondary font-bold tracking-wider uppercase">
                {currentContent.title}
              </span>
            </div>
            <span className="text-label-sm font-label-sm text-outline">Parchment Card #1</span>
          </div>

          {/* Blind mode filter if active */}
          {blindMode ? (
            <div className="py-6 text-center text-outline italic">
              [Blind Mode active: Text hidden for active recall self-test]
            </div>
          ) : (
            <>
              {/* The core quote */}
              <blockquote className="text-headline-sm font-headline-sm text-primary dark:text-primary-fixed leading-relaxed mb-4 italic">
                “{currentContent.quote}”
              </blockquote>

              {/* Simple Mental Model Metaphor Pill */}
              <div className="pt-3 border-t border-outline-variant/30 flex items-start gap-2.5">
                <span className="inline-flex p-1 rounded-md bg-secondary-fixed/50 dark:bg-secondary-container text-secondary dark:text-secondary-fixed mt-0.5">
                  <span className="material-symbols-outlined text-[15px]">psychology_alt</span>
                </span>
                <div className="text-body-sm font-body-sm text-on-surface-variant">
                  <strong className="font-semibold text-on-surface">
                    {currentContent.analogyName}:
                  </strong>{' '}
                  {currentContent.analogyText}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Miniature Audio Summary Floating Capsule Widget (Voice Synthesis Briefing) */}
      <section className="mb-6">
        <div className="bg-surface-container-lowest/95 dark:bg-surface-container-low/95 backdrop-blur-md hairline-card rounded-xl p-3 flex items-center gap-3">
          {/* Play / Pause Action Button (Speaks in Male Feynman Voice) */}
          <button
            onClick={togglePlayAudio}
            aria-label="Play audio summary"
            className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-sm shrink-0 active:scale-95 transition-transform hover:opacity-95"
            type="button"
            title={isPlaying ? 'Pause briefing' : 'Listen to Feynman Male Voice Briefing'}
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>

          {/* Waveform scrubber & metadata */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-label-sm font-label-sm font-bold text-primary dark:text-primary-fixed truncate">
                  Voice Synthesis Briefing
                </span>
                <span className="px-1.5 py-0.2 rounded bg-surface-container-high dark:bg-surface-container text-on-surface-variant text-[9px] font-semibold">
                  AI TUTOR (MALE)
                </span>
              </div>
              <span className="text-label-sm font-label-sm text-outline font-mono tracking-tighter shrink-0">
                {isPlaying ? '-01:42' : '-2:40'}
              </span>
            </div>

            {/* Dynamic Audio Frequency Bar Track */}
            <div className="h-6 w-full bg-surface-container dark:bg-surface-container-high rounded flex items-center justify-between px-1.5 gap-[2px]">
              <span className={`w-[3px] rounded-full bg-primary-container ${isPlaying ? 'h-4 animate-pulse' : 'h-2.5'}`}></span>
              <span className={`w-[3px] rounded-full bg-primary-container ${isPlaying ? 'h-5 animate-pulse delay-75' : 'h-4'}`}></span>
              <span className={`w-[3px] rounded-full bg-primary-container ${isPlaying ? 'h-3 animate-pulse' : 'h-3'}`}></span>
              <span className={`w-[3px] rounded-full bg-primary-container ${isPlaying ? 'h-6 animate-pulse' : 'h-5'}`}></span>
              <span className={`w-[3px] rounded-full bg-primary-container ${isPlaying ? 'h-4 animate-pulse' : 'h-3.5'}`}></span>
              <span className="w-[3px] rounded-full bg-primary-container h-2"></span>
              <span className="w-[3px] rounded-full bg-primary-container h-4.5"></span>
              {/* Scrub head indicator */}
              <span className="w-3 h-3 rounded-full bg-surface-container-lowest border-2 border-primary-container shadow-xs shrink-0 mx-0.5"></span>
              {/* Terracotta gap point */}
              <span className="w-[3px] rounded-full bg-secondary h-5"></span>
              <span className="w-[3px] rounded-full bg-secondary h-4"></span>
              {/* Remaining bars */}
              <span className="w-[3px] rounded-full bg-outline-variant/60 h-2"></span>
              <span className="w-[3px] rounded-full bg-outline-variant/60 h-3.5"></span>
              <span className="w-[3px] rounded-full bg-outline-variant/60 h-2"></span>
              <span className="w-[3px] rounded-full bg-outline-variant/60 h-4"></span>
              <span className="w-[3px] rounded-full bg-outline-variant/60 h-2.5"></span>
              <span className="w-[3px] rounded-full bg-outline-variant/60 h-1.5"></span>
              <span className="w-[3px] rounded-full bg-outline-variant/60 h-3"></span>
              <span className="w-[3px] rounded-full bg-outline-variant/60 h-2"></span>
            </div>
          </div>

          {/* Interactive Voice QA button */}
          <button
            onClick={handleStartVoiceQA}
            className={`p-1.5 rounded-lg transition-colors active:scale-95 ${
              isAskingTutor
                ? 'bg-secondary text-on-secondary animate-pulse'
                : 'text-on-surface-variant hover:text-secondary hover:bg-surface-container'
            }`}
            title="Ask Feynman aloud with voice"
          >
            <span className="material-symbols-outlined text-[19px]">
              {isAskingTutor ? 'graphic_eq' : 'mic'}
            </span>
          </button>

          {/* Speed Toggle Pill */}
          <button
            onClick={cycleSpeed}
            className="px-2 py-1 rounded bg-surface-container dark:bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-label-sm font-label-sm font-semibold shrink-0 transition-colors active:scale-95"
            type="button"
          >
            {playbackSpeed}
          </button>
        </div>

        {/* Lightweight Spoken Conversation Popover (Only visible when user speaks to tutor) */}
        {(isAskingTutor || tutorDialogText || isTutorThinking) && (
          <div className="mt-2.5 p-3.5 bg-surface-container-lowest dark:bg-surface-container-low rounded-xl hairline-border space-y-2 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-secondary dark:text-secondary-fixed flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
                {isTutorThinking
                  ? 'Feynman is thinking...'
                  : isAskingTutor
                  ? 'Listening to your voice...'
                  : 'Feynman Answered:'}
              </span>
              <button
                onClick={() => {
                  setTutorDialogText(null);
                  setIsAskingTutor(false);
                }}
                className="text-outline hover:text-on-surface text-xs"
              >
                ✕
              </button>
            </div>

            {userQuery && (
              <p className="text-xs text-outline italic">
                You asked: "{userQuery}"
              </p>
            )}

            {tutorDialogText && (
              <p className="text-body-sm font-body-sm text-on-surface leading-relaxed">
                “{tutorDialogText}”
              </p>
            )}

            {!isAskingTutor && !tutorDialogText && (
              <div className="flex items-center gap-1.5 text-xs text-outline">
                <button
                  onClick={() => submitVoiceQuestion("Why doesn't the cat stay both dead and alive?")}
                  className="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high"
                >
                  "Why doesn't the cat stay dead & alive?"
                </button>
                <button
                  onClick={() => submitVoiceQuestion("Give me a 10-year-old child analogy.")}
                  className="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high"
                >
                  "Give me a 10-year-old analogy"
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Section Heading: Key Insights Breakdown */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-headline-sm font-headline-sm text-primary dark:text-primary-fixed tracking-tight font-semibold">
          Key Architectural Insights
        </h2>
        <span className="text-label-sm font-label-sm text-outline">3 Core Pillars</span>
      </div>

      {/* Key Insight Cards Stack */}
      <div className="space-y-3 mb-8">
        {/* Card 1: The Measurement Problem Dissected */}
        <article className="bg-surface-container-lowest dark:bg-surface-container-low hairline-card rounded-xl p-4 transition-transform hover:-translate-y-0.5 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface-container-low dark:bg-surface-container text-primary dark:text-primary-fixed text-label-md font-label-md font-bold shrink-0">
                01
              </span>
              <div>
                <h3 className="text-label-lg font-label-lg text-primary dark:text-primary-fixed font-bold mb-1">
                  The Measurement Problem Dissected
                </h3>
                <p className="text-body-sm font-body-sm text-on-surface-variant leading-relaxed">
                  Decoherence does not "collapse" the wave function into one reality; rather, it renders alternate possibilities computationally unreachable by spreading phase data across countless environmental degrees of freedom.
                </p>
              </div>
            </div>
            <button
              onClick={() => setCurrentScreen('diagrams')}
              aria-label="Expand insight"
              className="text-outline hover:text-on-surface transition-colors p-1"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
          <div className="mt-3 pt-2.5 border-t border-surface-container dark:border-surface-container-high flex items-center justify-between text-label-sm font-label-sm">
            <span className="text-outline flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">hourglass_empty</span>
              Timescale: ~10⁻²³ seconds
            </span>
            <span className="text-[#4D7C5F] dark:text-[#a0d2b0] font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">check_circle</span>
              Concept Clear
            </span>
          </div>
        </article>

        {/* Card 2: Entanglement with the Environment (Knowledge Gap Highlighted) */}
        <article className="bg-surface-container-lowest dark:bg-surface-container-low hairline-card rounded-xl p-4 border-l-4 border-l-secondary transition-transform hover:-translate-y-0.5 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-secondary-fixed/50 dark:bg-secondary-container text-secondary dark:text-secondary-fixed text-label-md font-label-md font-bold shrink-0">
                02
              </span>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-label-lg font-label-lg text-primary dark:text-primary-fixed font-bold">
                    Entanglement with the Environment
                  </h3>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary-fixed text-on-secondary-fixed font-bold tracking-wider uppercase">
                    Gaps Detected
                  </span>
                </div>
                <p className="text-body-sm font-body-sm text-on-surface-variant leading-relaxed">
                  Every stray cosmic ray, air molecule, and blackbody photon interacts with the open quantum system, transforming a pure state into an apparent statistical density matrix.
                </p>
              </div>
            </div>
            <button
              onClick={() => setCurrentScreen('diagnostic')}
              aria-label="Expand insight"
              className="text-outline hover:text-on-surface transition-colors p-1"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>

          {/* Recessed Knowledge Gap Callout */}
          <div className="mt-3 p-2.5 rounded-lg bg-[rgba(194,94,52,0.06)] dark:bg-[rgba(254,140,94,0.08)] border border-dashed border-secondary/40 flex items-center justify-between text-label-sm font-label-sm">
            <span className="text-secondary dark:text-secondary-fixed font-medium flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">warning</span>
              You previously confused "collapse" with "entanglement leakage".
            </span>
            <button
              onClick={() => setCurrentScreen('diagnostic')}
              className="text-secondary font-bold underline cursor-pointer hover:opacity-80"
            >
              Fix
            </button>
          </div>
        </article>

        {/* Card 3: Irreversible Entropy Leakage (Sage Mastery Style) */}
        <article className="bg-surface-container-lowest dark:bg-surface-container-low hairline-card rounded-xl p-4 border-l-4 border-l-[#4D7C5F] transition-transform hover:-translate-y-0.5 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface-container dark:bg-surface-container-high text-[#4D7C5F] text-label-md font-label-md font-bold shrink-0">
                03
              </span>
              <div>
                <h3 className="text-label-lg font-label-lg text-primary dark:text-primary-fixed font-bold mb-1">
                  Irreversible Entropy Leakage
                </h3>
                <p className="text-body-sm font-body-sm text-on-surface-variant leading-relaxed">
                  Because macroscopic surroundings have infinite degrees of freedom, the time required for Poincaré recurrence (coherence returning spontaneously) exceeds the lifespan of the universe.
                </p>
              </div>
            </div>
            <button
              onClick={() => addToReviewQueue('Poincaré recurrence and irreversible entropy leakage')}
              aria-label="Add to review"
              className="text-outline hover:text-on-surface transition-colors p-1"
              type="button"
              title="Add to Anki Review"
            >
              <span className="material-symbols-outlined text-[18px]">bookmark_add</span>
            </button>
          </div>
        </article>
      </div>

      {/* Big Primary CTA Pill (Feynman Step 2: Voice Test) */}
      <section className="mt-6 mb-8">
        <div className="p-1 rounded-2xl bg-gradient-to-b from-secondary/10 to-transparent">
          <button
            onClick={() => setCurrentScreen('probe')}
            className="w-full h-14 bg-secondary text-on-secondary rounded-xl font-label-lg text-label-lg flex items-center justify-between px-5 shadow-sm active:scale-[0.98] transition-all group"
            type="button"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-on-secondary/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                <span
                  className="material-symbols-outlined text-[20px] text-on-secondary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  mic
                </span>
              </div>
              <div className="text-left">
                <div className="text-[11px] uppercase tracking-wider text-on-secondary/80 font-bold leading-tight">
                  Feynman Step 2
                </div>
                <div className="font-bold leading-tight">Start 2-min Voice Test</div>
              </div>
            </div>
            <div className="flex items-center gap-1 font-semibold text-label-sm text-on-secondary/90 bg-on-secondary/15 px-2.5 py-1 rounded-full">
              <span>Explain to a Child</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </div>
          </button>
        </div>
        <p className="text-center text-label-sm font-label-sm text-outline mt-2">
          Records your oral explanation, detects logical voids, and assesses jargon usage.
        </p>
      </section>
    </main>
  );
};
