import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Volume2, VolumeX, Minimize2 } from 'lucide-react';
import { speakText, stopSpeaking } from '../lib/speech';

interface FloatingChatWidgetProps {
  selectedVoice: SpeechSynthesisVoice | null;
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

interface MiniMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const FloatingChatWidget: React.FC<FloatingChatWidgetProps> = ({
  selectedVoice,
  onToast,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<MiniMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content: "Hey! I'm Feynman. Stuck on a tricky concept or looking for a clean analogy? Ask me right here while you work."
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputValue.trim();
    if (!text || isLoading) return;

    const userMsg: MiniMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }))
        })
      });

      const data = await res.json();
      const reply = data.reply || "Let's strip away the textbook phrases. What is the physical gear in motion here?";

      const assistantMsg: MiniMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: reply
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (isVoiceActive) {
        speakText(reply, selectedVoice);
      }
    } catch (_) {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: "Here's the key: imagine taking the whole thing apart like a brass pocket watch. What do you think pushes what?"
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button (When Closed) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-2xl shadow-indigo-600/40 border border-indigo-400/30 transition-all hover:scale-105 active:scale-95"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
          </span>
          <MessageSquare className="w-4 h-4 text-white" />
          <span className="text-xs font-semibold tracking-wide">Ask Feynman</span>
        </button>
      )}

      {/* Floating Drawer / Window (When Open) */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] rounded-3xl bg-[#0B0F19]/95 backdrop-blur-2xl border border-white/[0.1] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-indigo-950/80 via-[#0B0F19] to-[#070A11] border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-md">
                RF
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">Richard Feynman</span>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400">
                    AI Assistant
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 font-light">Intuition & Analogy Drawer</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  const next = !isVoiceActive;
                  setIsVoiceActive(next);
                  if (!next) stopSpeaking();
                  onToast(next ? 'Voice audio enabled' : 'Voice audio muted', 'info');
                }}
                className={`p-1.5 rounded-lg border text-xs transition-colors ${
                  isVoiceActive
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                    : 'border-white/10 text-zinc-400 hover:text-white'
                }`}
                title="Toggle Voice"
              >
                {isVoiceActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => {
                  stopSpeaking();
                  setIsOpen(false);
                }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                title="Minimize drawer"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 font-light text-xs no-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                      : 'bg-[#111827] text-zinc-200 border border-white/[0.06] rounded-bl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#111827] text-zinc-400 rounded-2xl rounded-bl-none p-3 border border-white/[0.06] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
                  <span>Feynman is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-3 py-1.5 bg-[#070A11] border-t border-white/[0.04] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {['💡 Explain in ELI5', '🌊 Give a physical analogy', '🔬 What is the atomic mechanism?'].map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputValue(s);
                }}
                className="text-[10px] whitespace-nowrap px-2 py-0.5 rounded-full bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.06] transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 bg-[#070A11] border-t border-white/[0.08] flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask Feynman anything..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
