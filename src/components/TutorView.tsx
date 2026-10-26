import React, { useState, useRef, useEffect } from 'react';
import {
  ChatMessage,
  AttachedFilePayload,
  sendTutorMessage,
  extractFileContent,
} from '../lib/tutor';
import {
  speakText,
  stopSpeaking,
  isSpeaking as checkIsSpeaking,
  createSpeechRecognizer,
} from '../lib/speech';
import {
  Paperclip,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  Zap,
  FileText,
  X,
  RotateCcw,
  BookOpen,
} from 'lucide-react';

interface TutorViewProps {
  onSwitchToTest: (prefillConcept?: string) => void;
  selectedVoice: SpeechSynthesisVoice | null;
  onToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
  initialContext?: string | null;
}

export const TutorView: React.FC<TutorViewProps> = ({
  onSwitchToTest,
  selectedVoice,
  onToast,
  initialContext,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'msg-welcome',
        role: 'assistant',
        content:
          "Hey there! I'm your Feynman AI Tutor.\n\nDon't recite textbook definitions here. Ask me anything you're trying to figure out, paste a tricky excerpt, or attach your study notes. Let's strip away the jargon and see how the gears actually turn!",
        timestamp: Date.now(),
      },
    ];
  });

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<AttachedFilePayload | null>(null);
  const [autoSpeakReplies, setAutoSpeakReplies] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([
    '💡 Explain photosynthesis without textbook words',
    '🌊 Why does time slow down near heavy objects?',
    '☕ Explain entropy with everyday objects',
    '⚡ Quiz my intuition on gravity',
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const speechRecognizerRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle initialContext (e.g. passed from a diagnostic gap)
  useEffect(() => {
    if (initialContext) {
      const prompt = `Feynman, can you help me build a visceral intuition for this: "${initialContext}"?`;
      setInputText(prompt);
      onToast('Loaded context from your test results', 'info');
    }
  }, [initialContext]);

  // Handle voice speech state monitoring
  useEffect(() => {
    const timer = setInterval(() => {
      if (!checkIsSpeaking()) {
        setCurrentlySpeakingId(null);
      }
    }, 250);
    return () => clearInterval(timer);
  }, []);

  // Send message to tutor
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!text && !attachedFile) {
      return;
    }

    if (isDictating && speechRecognizerRef.current) {
      try {
        speechRecognizerRef.current.stop();
      } catch (_) {}
      setIsDictating(false);
    }

    const newUserMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text || (attachedFile ? `Please explain this document: ${attachedFile.name}` : ''),
      timestamp: Date.now(),
      attachedFileName: attachedFile?.name,
    };

    const nextMessages = [...messages, newUserMsg];
    setMessages(nextMessages);
    setInputText('');
    const currentAttachment = attachedFile;
    setAttachedFile(null);
    setIsLoading(true);

    try {
      const tutorResp = await sendTutorMessage(
        nextMessages.map((m) => ({ role: m.role, content: m.content })),
        currentAttachment,
        initialContext
      );

      const assistantMsgId = `asst-${Date.now()}`;
      const newAssistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: tutorResp.reply,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, newAssistantMsg]);

      if (tutorResp.suggestions && tutorResp.suggestions.length > 0) {
        setSuggestions(tutorResp.suggestions);
      }

      // Voice Auto-Speak if enabled
      if (autoSpeakReplies) {
        setCurrentlySpeakingId(assistantMsgId);
        speakText(tutorResp.reply, selectedVoice, () => {
          setCurrentlySpeakingId(null);
        });
      }
    } catch (err: any) {
      onToast(`Tutor connection issue: ${err.message || 'Please try again'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle voice dictation (speech-to-text into input)
  const toggleVoiceInput = () => {
    if (isDictating) {
      if (speechRecognizerRef.current) {
        try {
          speechRecognizerRef.current.stop();
        } catch (_) {}
      }
      setIsDictating(false);
      onToast('Mic dictation stopped', 'info');
    } else {
      const recognizer = createSpeechRecognizer(
        (chunk, isFinal) => {
          if (isFinal) {
            setInputText((prev) => (prev ? `${prev} ${chunk}` : chunk));
          }
        },
        () => {
          setIsDictating(false);
        }
      );

      if (recognizer) {
        try {
          recognizer.start();
          speechRecognizerRef.current = recognizer;
          setIsDictating(true);
          onToast('Listening... Speak your question', 'info');
        } catch (_) {
          setIsDictating(false);
          onToast('Microphone access ready. Speak clearly.', 'info');
        }
      } else {
        onToast('Speech recognition not available in this browser', 'error');
      }
    }
  };

  // Speak a specific message aloud
  const handleSpeakMessage = (msgId: string, content: string) => {
    if (currentlySpeakingId === msgId) {
      stopSpeaking();
      setCurrentlySpeakingId(null);
    } else {
      stopSpeaking();
      setCurrentlySpeakingId(msgId);
      speakText(content, selectedVoice, () => {
        setCurrentlySpeakingId(null);
      });
    }
  };

  // File upload handling
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      onToast(`Parsing ${file.name}...`, 'info');
      const payload = await extractFileContent(file);
      setAttachedFile(payload);
      onToast(`Attached: ${file.name} (${Math.round(file.size / 1024)} KB) ✓`, 'success');
    } catch (err: any) {
      onToast(`Could not read file: ${err.message}`, 'error');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Clear chat
  const handleClearChat = () => {
    stopSpeaking();
    setCurrentlySpeakingId(null);
    setMessages([
      {
        id: 'msg-welcome-new',
        role: 'assistant',
        content:
          "Starting fresh! What topic, problem, or document shall we break down next?",
        timestamp: Date.now(),
      },
    ]);
    setAttachedFile(null);
    onToast('Conversation reset', 'info');
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 pb-28 pt-1 flex flex-col h-[calc(100vh-130px)]">
      {/* Hidden File Picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.markdown,.json,.csv,.pdf,.png,.jpg,.jpeg,.py,.js,.ts"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Top Tutor Controls Bar */}
      <div className="flex items-center justify-between py-2 border-b border-zinc-900/80 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-950 to-indigo-700 border border-indigo-400/30 flex items-center justify-center text-xs font-semibold text-indigo-200 shadow-md">
              RF
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-[#050507]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-zinc-200">Feynman AI Tutor</span>
              <span className="text-[9px] uppercase tracking-wider text-emerald-400/90 font-mono">Live</span>
            </div>
            <p className="text-[10px] text-zinc-500 font-light">Socratic Intuition & analogies</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Voice Auto-Read Toggle */}
          <button
            onClick={() => {
              const nextState = !autoSpeakReplies;
              setAutoSpeakReplies(nextState);
              if (!nextState) stopSpeaking();
              onToast(nextState ? 'Voice auto-read ON' : 'Voice auto-read OFF', 'info');
            }}
            className={`p-2 rounded-lg border text-xs transition-colors flex items-center gap-1 ${
              autoSpeakReplies
                ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
            title="Toggle voice auto-read"
          >
            {autoSpeakReplies ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Test Myself Quick Switch */}
          <button
            onClick={() => onSwitchToTest()}
            className="px-2.5 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[11px] font-medium transition-colors flex items-center gap-1"
            title="Switch to Feynman Diagnostic Test"
          >
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>Test Me</span>
          </button>

          {/* Reset Conversation */}
          <button
            onClick={handleClearChat}
            className="p-2 rounded-lg border border-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Clear conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Active File Banner */}
      {attachedFile && (
        <div className="bg-indigo-950/40 border border-indigo-800/50 rounded-xl px-3 py-2 mb-3 flex items-center justify-between text-xs animate-fade-in-up">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
            <div className="truncate">
              <span className="text-zinc-200 font-medium truncate block">{attachedFile.name}</span>
              <span className="text-[10px] text-zinc-500">
                {Math.round(attachedFile.size / 1024)} KB · Active document context
              </span>
            </div>
          </div>
          <button
            onClick={() => setAttachedFile(null)}
            className="text-zinc-400 hover:text-zinc-200 p-1"
            title="Remove file"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Chat Messages Scroll Container */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-2">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isSpeakingThis = currentlySpeakingId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fade-in-up`}
            >
              <div
                className={`max-w-[88%] rounded-2xl p-4 text-xs font-light leading-relaxed select-text ${
                  isUser
                    ? 'bg-zinc-800/70 border border-zinc-700/60 text-zinc-100 rounded-br-none shadow-sm'
                    : 'bg-[#0C0C10] border border-zinc-900/90 text-zinc-200 rounded-bl-none shadow-md'
                }`}
              >
                {/* User Attached File tag if present */}
                {msg.attachedFileName && (
                  <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-zinc-700/50 text-[10px] text-indigo-300">
                    <FileText className="w-3 h-3" />
                    <span className="truncate">{msg.attachedFileName}</span>
                  </div>
                )}

                {/* Message Content formatted */}
                <div className="whitespace-pre-wrap space-y-2">
                  {msg.content.split('\n\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>

                {/* Assistant footer actions */}
                {!isUser && (
                  <div className="mt-3 pt-2.5 border-t border-zinc-900/80 flex items-center justify-between text-[10px] text-zinc-500">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSpeakMessage(msg.id, msg.content)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                          isSpeakingThis
                            ? 'text-indigo-400 bg-indigo-500/10 font-medium'
                            : 'hover:text-zinc-300'
                        }`}
                        title="Read aloud with speech synthesis"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>{isSpeakingThis ? 'Speaking...' : 'Listen'}</span>
                      </button>

                      {isSpeakingThis && (
                        <div className="flex items-center gap-0.5 text-indigo-400">
                          <span className="w-0.5 h-2 bg-indigo-400 animate-pulse" />
                          <span className="w-0.5 h-3 bg-indigo-400 animate-pulse delay-75" />
                          <span className="w-0.5 h-1.5 bg-indigo-400 animate-pulse delay-150" />
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => onSwitchToTest(msg.content.slice(0, 80))}
                      className="text-zinc-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                      title="Test your understanding of this topic"
                    >
                      <Zap className="w-2.5 h-2.5 text-emerald-400" />
                      <span>Test Understanding</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading / Thinking State */}
        {isLoading && (
          <div className="flex items-start gap-2 animate-fade-in-up">
            <div className="bg-[#0C0C10] border border-zinc-900/90 rounded-2xl rounded-bl-none p-4 text-xs font-light text-zinc-400 flex items-center gap-2.5 shadow-md">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              <span>Feynman is crafting an intuition...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      {suggestions.length > 0 && !isLoading && (
        <div className="py-2 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
          {suggestions.map((sug, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(sug)}
              className="px-2.5 py-1 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 text-[10px] whitespace-nowrap transition-colors flex items-center gap-1 font-light shrink-0"
            >
              <span>{sug}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <div className="bg-[#0C0C10] border border-zinc-900/90 rounded-2xl p-2 shrink-0 shadow-lg mt-1">
        <div className="flex items-end gap-1.5">
          {/* File Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors shrink-0"
            title="Upload notes or documents (.txt, .md, .pdf, code, images)"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Voice Input (Speech Recognition) Button */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            className={`p-2.5 rounded-xl transition-colors shrink-0 ${
              isDictating
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
            }`}
            title={isDictating ? 'Stop dictation' : 'Voice input (optional)'}
          >
            {isDictating ? <Mic className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              isDictating
                ? 'Listening... speak now'
                : attachedFile
                ? `Ask about "${attachedFile.name}"...`
                : 'Ask Feynman anything, or paste study notes...'
            }
            className="flex-1 bg-transparent text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none py-2 px-1 max-h-32 min-h-[36px]"
          />

          {/* Send Button */}
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={(!inputText.trim() && !attachedFile) || isLoading}
            className={`p-2.5 rounded-xl font-medium transition-all shrink-0 ${
              (inputText.trim() || attachedFile) && !isLoading
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md cursor-pointer'
                : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
            }`}
            title="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
