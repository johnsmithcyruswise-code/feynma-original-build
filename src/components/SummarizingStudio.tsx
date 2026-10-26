import React, { useState, useRef } from 'react';
import { Sparkles, Paperclip, BookOpen, Clock, Volume2, VolumeX, CheckCircle2, RotateCcw } from 'lucide-react';
import { speakText, stopSpeaking, isSpeaking as checkIsSpeaking } from '../lib/speech';
import { extractFileContent } from '../lib/tutor';

interface SummarizingStudioProps {
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
  selectedVoice: SpeechSynthesisVoice | null;
}

const SAMPLES = [
  {
    title: 'Quantum Entanglement',
    text: 'Quantum entanglement is a phenomenon in quantum physics where two or more particles become interconnected such that the state of one instantly dictates the state of another regardless of the distance separating them, violating classical local realism.'
  },
  {
    title: 'Photosynthesis',
    text: 'Photosynthesis is the biochemical process by which photoautotrophic organisms convert solar light energy into chemical potential energy, splitting water molecules into protons and oxygen, and reducing carbon dioxide into glucose via ATP and NADPH.'
  },
  {
    title: 'Transformer Attention',
    text: 'In deep learning transformers, multi-head scaled dot-product attention computes query-key matrix dot products to determine dynamic token routing weights, allowing sequences to model long-range context without sequential recurrent passes.'
  },
  {
    title: 'Entropy & Thermodynamics',
    text: 'The Second Law of Thermodynamics states that the total entropy of an isolated system always increases over time, reflecting statistical evolution from macroscopic low-multiplicity microstates toward maximum statistical multiplicity.'
  }
];

export const SummarizingStudio: React.FC<SummarizingStudioProps> = ({
  onToast,
  selectedVoice,
}) => {
  const [depthLevel, setDepthLevel] = useState<'eli5' | 'high_school' | 'university'>('eli5');
  const [inputText, setInputText] = useState('');
  const [subjectTitle, setSubjectTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSelectSample = (sample: typeof SAMPLES[0]) => {
    stopSpeaking();
    setIsSpeaking(false);
    setSubjectTitle(sample.title);
    setInputText(sample.text);
    setResult(null);
    onToast(`Loaded sample: ${sample.title}`, 'info');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      onToast(`Reading ${file.name}...`, 'info');
      const payload = await extractFileContent(file);
      setInputText(payload.content);
      setSubjectTitle(file.name.replace(/\.[^/.]+$/, ''));
      onToast(`Loaded ${file.name} ✓`, 'success');
    } catch (err: any) {
      onToast(`Could not read file: ${err.message}`, 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSummarize = async () => {
    if (!inputText.trim()) {
      onToast('Please enter text or pick a sample first.', 'error');
      return;
    }

    stopSpeaking();
    setIsSpeaking(false);
    setIsLoading(true);

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: inputText.trim(),
          depthLevel,
          title: subjectTitle || 'Study Concept',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to summarize');
      setResult(data);
      onToast(`Feynman summarized at ${depthLevel.toUpperCase()} depth!`, 'success');
    } catch (err: any) {
      onToast(`Summarize notice: ${err.message}`, 'info');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSpeakResult = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      if (!result) return;
      const speechContent = `${result.visceral_analogy || ''}. Key points: ${(result.key_takeaways || []).join('. ')}`;
      setIsSpeaking(true);
      speakText(speechContent, selectedVoice, () => {
        setIsSpeaking(false);
      });
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 pb-28 pt-2 flex flex-col gap-5">
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.markdown,.json,.pdf,.py,.js,.ts"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">Summarizing Studio</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              Multi-Depth
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-light mt-0.5">
            Distill any complex text or paper into visceral physical intuition.
          </p>
        </div>

        <button
          onClick={() => {
            setInputText('');
            setSubjectTitle('');
            setResult(null);
            stopSpeaking();
            setIsSpeaking(false);
          }}
          className="p-2 rounded-xl text-zinc-400 hover:text-white bg-white/[0.03] border border-white/[0.08] transition-colors"
          title="Clear inputs"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Depth Level Switcher Tabs */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
          Target Intellectual Depth
        </label>
        <div className="grid grid-cols-3 p-1 rounded-xl bg-[#070A11] border border-white/[0.06] gap-1">
          <button
            onClick={() => setDepthLevel('eli5')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex flex-col items-center gap-0.5 ${
              depthLevel === 'eli5'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>ELI5 Intuition</span>
            <span className="text-[9px] font-light opacity-80">6th Grade Child</span>
          </button>

          <button
            onClick={() => setDepthLevel('high_school')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex flex-col items-center gap-0.5 ${
              depthLevel === 'high_school'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>High School AP</span>
            <span className="text-[9px] font-light opacity-80">Clear Mechanisms</span>
          </button>

          <button
            onClick={() => setDepthLevel('university')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex flex-col items-center gap-0.5 ${
              depthLevel === 'university'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>University</span>
            <span className="text-[9px] font-light opacity-80">Formal Science</span>
          </button>
        </div>
      </div>

      {/* Quick Sample Loader Chips */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-mono uppercase text-zinc-500">Quick Samples:</span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {SAMPLES.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectSample(sample)}
              className="px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08] transition-colors"
            >
              {sample.title}
            </button>
          ))}
        </div>
      </div>

      {/* Input Container */}
      <div className="p-4 rounded-2xl bg-[#070A11] border border-white/[0.08] flex flex-col gap-3 shadow-lg">
        <input
          type="text"
          placeholder="Concept or Topic Title (e.g. Entropy)"
          value={subjectTitle}
          onChange={(e) => setSubjectTitle(e.target.value)}
          className="w-full bg-transparent border-b border-white/[0.06] pb-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-medium"
        />

        <textarea
          rows={5}
          placeholder="Paste lecture notes, textbook excerpts, or scientific descriptions here..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="w-full bg-transparent text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none resize-none leading-relaxed font-light"
        />

        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white bg-white/[0.03] border border-white/[0.06] transition-colors"
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>Attach Document</span>
          </button>

          <button
            onClick={handleSummarize}
            disabled={isLoading || !inputText.trim()}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/25"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>{isLoading ? 'Distilling...' : 'Summarize with Feynman'}</span>
          </button>
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/20 via-[#070A11] to-[#0B0F19] border border-indigo-500/30 flex flex-col gap-4 shadow-2xl animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-indigo-400">
                Feynman Distillation ({result.depth_level?.toUpperCase()})
              </span>
              <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-zinc-500" />
                {result.reading_time_seconds || 45}s read
              </span>
            </div>

            <button
              onClick={toggleSpeakResult}
              className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1 ${
                isSpeaking
                  ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                  : 'border-white/10 text-zinc-400 hover:text-white'
              }`}
              title="Read aloud"
            >
              {isSpeaking ? <Volume2 className="w-3.5 h-3.5 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Visceral Analogy Card */}
          {result.visceral_analogy && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col gap-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                🌊 Visceral Analogy
              </span>
              <p className="text-xs text-zinc-200 font-medium leading-relaxed italic">
                "{result.visceral_analogy}"
              </p>
            </div>
          )}

          {/* Key Takeaway Bullet Chips */}
          {result.key_takeaways && result.key_takeaways.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-mono uppercase text-zinc-400">Core Takeaways:</span>
              <div className="flex flex-col gap-1.5">
                {result.key_takeaways.map((point: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-zinc-300 font-light">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Markdown Breakdown */}
          {result.summary_markdown && (
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs text-zinc-300 leading-relaxed font-light whitespace-pre-line">
              {result.summary_markdown.replace(/###/g, '').replace(/\*\*/g, '')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
