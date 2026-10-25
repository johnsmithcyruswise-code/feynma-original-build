import React from 'react';

interface TextInputProps {
  value: string;
  onChange: (val: string) => void;
  onAnalyze: () => void;
  onReadAloudToggle: () => void;
  isSpeaking: boolean;
  isAnalyzing: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  onSelectVoice: (voice: SpeechSynthesisVoice) => void;
  onShakeTrigger: () => void;
  shouldShake: boolean;
  statusText?: string;
  retestInfo?: { title: string; lastScore: number } | null;
  onClearRetest?: () => void;
}

export const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  onAnalyze,
  onReadAloudToggle,
  isSpeaking,
  isAnalyzing,
  voices,
  selectedVoice,
  onSelectVoice,
  onShakeTrigger,
  shouldShake,
  statusText = 'Explain your topic out loud, type it below, or tap the glowing inner point...',
  retestInfo,
  onClearRetest,
}) => {
  const maxChars = 1000;
  const currentLen = value.length;

  const quickChips = [
    {
      label: "Newton's laws",
      text: "Newton's first law states an object remains at rest or uniform motion unless acted upon by an external net force.",
    },
    {
      label: 'Photosynthesis',
      text: 'Photosynthesis is how plants use sunlight to make food.',
    },
    {
      label: 'Gradient descent',
      text: 'Gradient descent minimizes error in neural networks by taking small iterative steps in the direction of steepest loss decrease.',
    },
    {
      label: 'Backpropagation',
      text: 'Backpropagation uses the calculus chain rule backwards from the loss to calculate gradients for every layer weight.',
    },
  ];

  const handleAnalyzeClick = () => {
    if (!value.trim()) {
      onShakeTrigger();
      return;
    }
    onAnalyze();
  };

  const handleReadAloudClick = () => {
    if (!value.trim() && !isSpeaking) {
      onShakeTrigger();
      return;
    }
    onReadAloudToggle();
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-3 px-4">
      {/* Real Retest Banner (ONLY if retesting an actual concept) */}
      {retestInfo && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 px-3.5 py-2 rounded-xl text-xs text-indigo-300 flex items-center justify-between">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-[10px] uppercase tracking-wider font-semibold bg-indigo-500/20 px-1.5 py-0.5 rounded">
              Retesting
            </span>
            <span className="truncate">{retestInfo.title}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-zinc-400 text-[11px]">Previous: {retestInfo.lastScore}%</span>
            {onClearRetest && (
              <button
                onClick={onClearRetest}
                className="text-zinc-500 hover:text-zinc-300 text-xs ml-1"
                title="Cancel retest"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quick-Start Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-light shrink-0 mr-1">
          Quick start:
        </span>
        {quickChips.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => onChange(chip.text)}
            className="text-[11px] font-light px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800/80 transition-colors shrink-0"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* 3-line textarea container with 1000-char counter */}
      <div
        className={`relative bg-[#0C0C10] border rounded-2xl p-3.5 transition-all duration-300 ${
          shouldShake
            ? 'animate-shake border-amber-500/80 ring-1 ring-amber-500/30'
            : 'border-zinc-900/80 focus-within:border-zinc-700'
        }`}
      >
        <textarea
          rows={3}
          maxLength={maxChars}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your explanation here..."
          className="w-full bg-transparent text-[#E4E4E7] placeholder:text-zinc-600 font-light text-base leading-relaxed resize-none outline-none custom-scroll"
        />

        <div className="flex items-center justify-between pt-2 border-t border-zinc-900/60 mt-1">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-light">
            Feynman Draft
          </span>
          <span
            className={`text-xs font-mono font-light ${
              currentLen >= maxChars ? 'text-amber-500' : 'text-zinc-500'
            }`}
          >
            {currentLen}/{maxChars}
          </span>
        </div>
      </div>

      {/* Voice selection dropdown */}
      <div className="flex items-center justify-between gap-2 px-1">
        <label className="text-[11px] uppercase tracking-widest text-zinc-500 font-light flex items-center gap-1.5 shrink-0">
          <span>Voice</span>
        </label>
        <select
          value={selectedVoice?.name || ''}
          onChange={(e) => {
            const found = voices.find((v) => v.name === e.target.value);
            if (found) onSelectVoice(found);
          }}
          className="w-full max-w-[220px] bg-[#0C0C10] border border-zinc-900 text-xs text-zinc-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-zinc-700 truncate font-light cursor-pointer"
        >
          {voices.length === 0 ? (
            <option value="">Default Speech Voice</option>
          ) : (
            voices.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name} ({v.lang})
              </option>
            ))
          )}
        </select>
      </div>

      {/* Action Buttons: Read Aloud & Analyze */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          onClick={handleReadAloudClick}
          disabled={isAnalyzing}
          className={`tap-target h-11 px-4 rounded-xl border flex items-center justify-center gap-2 text-sm font-light tracking-wide transition-all duration-200 active:scale-[0.98] ${
            isSpeaking
              ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
              : 'bg-[#0C0C10] border-indigo-500/40 text-indigo-300 hover:border-indigo-500/80 hover:bg-[#12121A]'
          }`}
        >
          <span>{isSpeaking ? '⏹ Stop' : '🔊 Read Aloud'}</span>
        </button>

        <button
          type="button"
          onClick={handleAnalyzeClick}
          disabled={isAnalyzing}
          className="tap-target h-11 px-4 rounded-xl border border-emerald-400/50 bg-[#0C0C10] hover:border-emerald-400 hover:bg-[#0D1A13] text-emerald-300 flex items-center justify-center gap-2 text-sm font-light tracking-wide transition-all duration-200 active:scale-[0.98] shadow-[0_0_12px_rgba(52,211,153,0.1)]"
        >
          {isAnalyzing ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
              <span>Analyzing...</span>
            </span>
          ) : (
            <span>✨ Analyze</span>
          )}
        </button>
      </div>

      {/* Status line below everything */}
      <p className="text-center text-xs text-zinc-500 font-light tracking-wide pt-2 leading-relaxed px-2">
        {statusText}
      </p>
    </div>
  );
};
