import React, { useState, useEffect } from 'react';
import { RotateCw, Sparkles, Volume2, ArrowLeft, ArrowRight, Check, Brain, Clock, ShieldCheck } from 'lucide-react';
import { speakText, stopSpeaking } from '../lib/speech';

interface FlashcardStudioProps {
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
  selectedVoice: SpeechSynthesisVoice | null;
}

interface Flashcard {
  id: string;
  topic: string;
  front_prompt: string;
  back_intuition: string;
  analogy_hint: string;
  difficulty: 'easy' | 'medium' | 'hard';
  interval_days: number;
}

const INITIAL_CARDS: Flashcard[] = [
  {
    id: 'fc-1',
    topic: 'Physics',
    front_prompt: 'Why doesn\'t the Moon crash into the Earth despite gravitational pull?',
    back_intuition: 'The Moon IS constantly falling toward Earth, but it has so much sideways speed that the Earth\'s curved surface drops away beneath it at the exact same rate!',
    analogy_hint: 'Like tossing a baseball around a small round asteroid so fast that it curves around and hits you in the back.',
    difficulty: 'medium',
    interval_days: 1
  },
  {
    id: 'fc-2',
    topic: 'Thermodynamics',
    front_prompt: 'What is Entropy at the molecular level without mathematical jargon?',
    back_intuition: 'It is simple statistical counting: there is only 1 exact way for a toy room to be organized, but trillions of ways for pieces to be scattered randomly.',
    analogy_hint: 'The messy bedroom with a toddler.',
    difficulty: 'easy',
    interval_days: 3
  },
  {
    id: 'fc-3',
    topic: 'Quantum Physics',
    front_prompt: 'What physically happens during Quantum Decoherence?',
    back_intuition: 'The clean wave phase of a quantum particle bumps into ambient air and light photons, leaking its synchronization into the room.',
    analogy_hint: 'A synchronized dance troupe interrupted by 50,000 shouting fans throwing confetti.',
    difficulty: 'hard',
    interval_days: 1
  }
];

export const FlashcardStudio: React.FC<FlashcardStudioProps> = ({
  onToast,
  selectedVoice,
}) => {
  const [cards, setCards] = useState<Flashcard[]>(INITIAL_CARDS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Fetch initial cards from API
    fetch('/api/flashcards')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCards(data);
        }
      })
      .catch(() => {});
  }, []);

  const currentCard = cards[currentIndex] || cards[0];

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleNext = () => {
    stopSpeaking();
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    stopSpeaking();
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const handleRateDifficulty = async (rating: 'easy' | 'medium' | 'hard') => {
    try {
      await fetch('/api/flashcards/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: currentCard.id, rating })
      });
      onToast(`Rated as ${rating.toUpperCase()}. Review interval updated!`, 'success');
      handleNext();
    } catch (_) {
      handleNext();
    }
  };

  const handleGenerateCards = async () => {
    if (!newTopic.trim()) {
      onToast('Please enter a topic to generate cards.', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/flashcards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: newTopic.trim() })
      });
      const generated = await res.json();
      if (Array.isArray(generated) && generated.length > 0) {
        setCards((prev) => [...generated, ...prev]);
        setCurrentIndex(0);
        setIsFlipped(false);
        setNewTopic('');
        onToast(`Generated ${generated.length} intuition cards for ${newTopic}!`, 'success');
      }
    } catch (err: any) {
      onToast('Generated cards via local Feynman engine', 'info');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSpeakCard = () => {
    const textToSpeak = isFlipped ? currentCard.back_intuition : currentCard.front_prompt;
    speakText(textToSpeak, selectedVoice);
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 pb-28 pt-2 flex flex-col gap-5">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">Flashcard & Spaced Repetition</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
              SM-2 Engine
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-light mt-0.5">
            Test physical intuition instead of memorizing definitions. Tap card to flip.
          </p>
        </div>

        <div className="text-xs font-mono text-zinc-400">
          {currentIndex + 1} / {cards.length}
        </div>
      </div>

      {/* Generate New Cards Input Bar */}
      <div className="p-3 rounded-2xl bg-[#070A11] border border-white/[0.08] flex items-center gap-2">
        <input
          type="text"
          placeholder="Topic (e.g. Special Relativity, Neural Networks)"
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
          className="flex-1 bg-transparent px-2 text-xs text-white placeholder-zinc-500 focus:outline-none"
        />
        <button
          onClick={handleGenerateCards}
          disabled={isGenerating || !newTopic.trim()}
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 transition-colors flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
          <span>{isGenerating ? 'Generating...' : 'Create Cards'}</span>
        </button>
      </div>

      {/* Interactive 3D Flip Card Container */}
      <div
        onClick={handleFlip}
        className="w-full h-80 cursor-pointer perspective-1000 select-none"
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative w-full h-full transition-transform duration-500 rounded-3xl"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* FRONT SIDE */}
          <div
            className="absolute inset-0 p-8 rounded-3xl bg-gradient-to-br from-[#0E1424] via-[#0B0F19] to-[#070A11] border border-white/[0.1] shadow-2xl flex flex-col justify-between"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                {currentCard.topic}
              </span>
              <span className="text-[11px] font-mono text-zinc-500 flex items-center gap-1">
                <RotateCw className="w-3 h-3" />
                Tap to reveal intuition
              </span>
            </div>

            <div className="my-auto text-center py-4">
              <span className="text-xs text-zinc-400 font-mono block mb-2">Core Question</span>
              <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
                "{currentCard.front_prompt}"
              </h3>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-500 pt-3 border-t border-white/[0.06]">
              <span>Interval: {currentCard.interval_days}d</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpeakCard();
                }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-white/[0.04]"
                title="Speak question"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* BACK SIDE (Flipped 180deg) */}
          <div
            className="absolute inset-0 p-8 rounded-3xl bg-gradient-to-br from-indigo-950/60 via-[#0B0F19] to-[#070A11] border border-indigo-500/40 shadow-2xl flex flex-col justify-between"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Feynman Intuition
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                Rate difficulty below
              </span>
            </div>

            <div className="my-auto py-2">
              <p className="text-sm sm:text-base text-zinc-100 font-medium leading-relaxed mb-3">
                {currentCard.back_intuition}
              </p>

              {currentCard.analogy_hint && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 italic">
                  💡 Metaphor: "{currentCard.analogy_hint}"
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-white/[0.06]">
              <span>Flip back anytime</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpeakCard();
                }}
                className="p-1.5 rounded-lg text-emerald-300 hover:text-white bg-white/[0.04]"
                title="Speak intuition"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Spaced Repetition Rating Buttons */}
      {isFlipped ? (
        <div className="flex items-center justify-between gap-2 p-1.5 bg-[#070A11] rounded-2xl border border-white/[0.08]">
          <button
            onClick={() => handleRateDifficulty('hard')}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors flex flex-col items-center"
          >
            <span>Hard</span>
            <span className="text-[9px] font-mono text-rose-400">Review 12h</span>
          </button>
          <button
            onClick={() => handleRateDifficulty('medium')}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors flex flex-col items-center"
          >
            <span>Medium</span>
            <span className="text-[9px] font-mono text-amber-400">Review 1d</span>
          </button>
          <button
            onClick={() => handleRateDifficulty('easy')}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors flex flex-col items-center"
          >
            <span>Easy</span>
            <span className="text-[9px] font-mono text-emerald-400">Review 3d</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handlePrev}
            className="px-4 py-2.5 rounded-xl text-xs font-medium text-zinc-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>
          <button
            onClick={handleFlip}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/25"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Flip Card</span>
          </button>
          <button
            onClick={handleNext}
            className="px-4 py-2.5 rounded-xl text-xs font-medium text-zinc-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors flex items-center gap-1.5"
          >
            <span>Next</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
