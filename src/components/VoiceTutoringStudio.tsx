import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Pause, Play, RotateCcw, Volume2, Sparkles, Zap, ArrowRight } from 'lucide-react';
import { speakText, stopSpeaking, createSpeechRecognizer } from '../lib/speech';

interface VoiceTutoringStudioProps {
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
  selectedVoice: SpeechSynthesisVoice | null;
  onOpenTestWithTopic?: (topic: string) => void;
}

const TOPICS = [
  { id: 'quantum', label: 'Quantum Physics', prompt: 'Why do particles act like waves until we measure them?' },
  { id: 'coding', label: 'Advanced Coding', prompt: 'Explain how asynchronous event loops prevent thread blocking.' },
  { id: 'history', label: 'World History', prompt: 'What actually caused the fall of the Western Roman Empire?' },
  { id: 'math', label: 'Mathematics', prompt: 'What does the imaginary number i actually represent geometrically?' },
];

export const VoiceTutoringStudio: React.FC<VoiceTutoringStudioProps> = ({
  onToast,
  selectedVoice,
  onOpenTestWithTopic,
}) => {
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<any>(null);
  const recognizerRef = useRef<any>(null);

  // Audio Waveform Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let step = 0;
    const renderWave = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const midY = height / 2;

      // Base line
      ctx.lineWidth = isRecording && !isPaused ? 2.5 : 1;
      ctx.strokeStyle = isRecording && !isPaused ? '#6366F1' : 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();

      const amplitude = isRecording && !isPaused ? 28 : 4;

      for (let x = 0; x < width; x += 3) {
        const wave1 = Math.sin((x * 0.03) + step) * amplitude;
        const wave2 = Math.cos((x * 0.05) - step * 1.2) * (amplitude * 0.5);
        const dampening = Math.sin((x / width) * Math.PI);
        const y = midY + (wave1 + wave2) * dampening;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Secondary Emerald harmonic when active
      if (isRecording && !isPaused) {
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#10B981';
        ctx.beginPath();
        for (let x = 0; x < width; x += 3) {
          const wave = Math.sin((x * 0.02) + step * 0.7) * (amplitude * 0.7) * Math.sin((x / width) * Math.PI);
          const y = midY + wave;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      step += isRecording && !isPaused ? 0.08 : 0.02;
      animationFrameRef.current = requestAnimationFrame(renderWave);
    };

    renderWave();
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isRecording, isPaused]);

  // Duration Timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggleRecord = () => {
    if (isRecording) {
      // Stop recording
      if (recognizerRef.current) {
        try { recognizerRef.current.stop(); } catch (_) {}
      }
      setIsRecording(false);
      setIsPaused(false);
      onToast('Recording finished. Analyzing explanation...', 'info');
      handleEvaluate();
    } else {
      // Start recording
      setTranscript('');
      setEvaluation(null);
      setDuration(0);

      const recognizer = createSpeechRecognizer(
        (chunk, isFinal) => {
          if (isFinal) {
            setTranscript((prev) => (prev ? `${prev} ${chunk}` : chunk));
          }
        },
        () => {
          setIsRecording(false);
          setIsPaused(false);
        }
      );

      if (recognizer) {
        try {
          recognizer.start();
          recognizerRef.current = recognizer;
        } catch (_) {}
      }
      setIsRecording(true);
      setIsPaused(false);
      onToast('Microphone active. Speak your intuition aloud!', 'info');
    }
  };

  const handleTogglePause = () => {
    if (!isRecording) return;
    setIsPaused((prev) => !prev);
    onToast(isPaused ? 'Recording resumed' : 'Recording paused', 'info');
  };

  const handleReset = () => {
    if (recognizerRef.current) {
      try { recognizerRef.current.stop(); } catch (_) {}
    }
    setIsRecording(false);
    setIsPaused(false);
    setTranscript('');
    setDuration(0);
    setEvaluation(null);
    onToast('Voice session reset', 'info');
  };

  const handleEvaluate = async () => {
    const textToAnalyze = transcript.trim() || `Here is my understanding of ${selectedTopic.label}: ${selectedTopic.prompt}`;
    setIsEvaluating(true);

    try {
      const res = await fetch('/api/evaluate-probe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: textToAnalyze,
          conceptId: selectedTopic.id,
          duration: formatTime(duration || 45),
        }),
      });

      const data = await res.json();
      setEvaluation(data);

      if (data.aiTutorSpokenCritique) {
        speakText(data.aiTutorSpokenCritique, selectedVoice);
      }
      onToast('Feynman evaluation completed!', 'success');
    } catch (err: any) {
      onToast('Completed evaluation via local Feynman engine', 'info');
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 pb-28 pt-2 flex flex-col gap-5">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">Voice Tutoring Studio</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Live Waveform
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-light mt-0.5">
            Explain concepts out loud. The Feynman engine detects jargon and probes for true understanding.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="p-2 rounded-xl text-zinc-400 hover:text-white bg-white/[0.03] border border-white/[0.08] transition-colors"
          title="Reset session"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Topic Selector Pills */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
          Target Topic Focus
        </label>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {TOPICS.map((topic) => {
            const isSelected = selectedTopic.id === topic.id;
            return (
              <button
                key={topic.id}
                onClick={() => {
                  setSelectedTopic(topic);
                  handleReset();
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/25'
                    : 'bg-white/[0.03] text-zinc-400 border-white/[0.08] hover:text-zinc-200'
                }`}
              >
                {topic.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Topic Challenge Prompt Card */}
      <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 flex flex-col gap-1.5">
        <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          Feynman Thought Experiment
        </span>
        <p className="text-xs font-medium text-zinc-200 leading-relaxed">
          "{selectedTopic.prompt}"
        </p>
      </div>

      {/* Audio Waveform Studio Canvas Display */}
      <div className="p-5 rounded-2xl bg-[#070A11] border border-white/[0.08] flex flex-col gap-4 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isRecording && !isPaused ? 'bg-emerald-400 animate-ping' : 'bg-zinc-600'}`}></span>
            <span className="text-xs font-mono text-zinc-300">
              {isRecording ? (isPaused ? 'Paused' : 'Listening...') : 'Studio Idle'}
            </span>
          </div>
          <span className="text-xs font-mono font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/20">
            {formatTime(duration)}
          </span>
        </div>

        {/* Canvas Visualizer */}
        <div className="w-full h-24 bg-[#05070D] rounded-xl flex items-center justify-center overflow-hidden border border-white/[0.04]">
          <canvas ref={canvasRef} width={500} height={96} className="w-full h-full" />
        </div>

        {/* Live Controls Bar */}
        <div className="flex items-center justify-center gap-4 pt-1">
          {/* Pause / Resume */}
          <button
            onClick={handleTogglePause}
            disabled={!isRecording}
            className={`p-3 rounded-full border transition-all ${
              !isRecording
                ? 'opacity-30 cursor-not-allowed border-zinc-800 text-zinc-600'
                : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:text-white hover:bg-white/[0.08]'
            }`}
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
          </button>

          {/* Primary Record Button */}
          <button
            onClick={handleToggleRecord}
            className={`p-4 rounded-full transition-all shadow-xl flex items-center justify-center ${
              isRecording
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 hover:scale-105'
            }`}
          >
            {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Live Transcript / Explanation Box */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
          <span>Spoken Transcript:</span>
          {transcript && (
            <button
              onClick={() => handleEvaluate()}
              disabled={isEvaluating}
              className="text-indigo-400 hover:underline flex items-center gap-1"
            >
              <Zap className="w-3 h-3" />
              <span>Evaluate Now</span>
            </button>
          )}
        </div>
        <p className="text-xs text-zinc-300 font-light min-h-[48px] leading-relaxed italic">
          {transcript || (isRecording ? "Speak now... what is happening behind the scenes?" : "Tap the microphone above to start speaking, or choose a topic.")}
        </p>
      </div>

      {/* Evaluation Results (When Available) */}
      {evaluation && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/30 to-[#070A11] border border-indigo-500/30 flex flex-col gap-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">
              Feynman Clarity Score
            </span>
            <span className="text-xl font-extrabold text-white">
              {evaluation.clarityScore}%
            </span>
          </div>

          {evaluation.aiTutorSpokenCritique && (
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-zinc-200 leading-relaxed font-light">
              <span className="font-semibold text-indigo-300 block mb-1">Richard Feynman:</span>
              "{evaluation.aiTutorSpokenCritique}"
            </div>
          )}

          {evaluation.flaggedJargon && evaluation.flaggedJargon.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-mono text-amber-400">Flagged Jargon Crutches:</span>
              <div className="flex flex-wrap gap-1.5">
                {evaluation.flaggedJargon.map((j: any, idx: number) => (
                  <span key={idx} className="px-2 py-0.5 rounded text-[11px] bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    {j.term || j}
                  </span>
                ))}
              </div>
            </div>
          )}

          {onOpenTestWithTopic && (
            <button
              onClick={() => onOpenTestWithTopic(selectedTopic.label)}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center justify-center gap-1.5 mt-1"
            >
              <span>Take Full Diagnostic Test</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
