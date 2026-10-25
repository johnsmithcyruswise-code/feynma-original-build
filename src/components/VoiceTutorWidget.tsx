import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

export const VoiceTutorWidget: React.FC = () => {
  const { activeConcept, showToast } = useApp();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [tutorSpeechText, setTutorSpeechText] = useState(
    '“Look, quantum decoherence simply means that macroscopic things bump into so many air molecules and light photons that the fragile quantum possibilities leak away into the room. The cat never stays in two states!”'
  );
  const [userSpokenInput, setUserSpokenInput] = useState('');
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [availableMaleVoices, setAvailableMaleVoices] = useState<SpeechSynthesisVoice[]>([]);
  const recognitionRef = useRef<any>(null);

  // Load browser voices & filter for natural male voices
  useEffect(() => {
    const updateVoices = () => {
      if ('speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        // Look for male voice signatures
        const male = voices.filter(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.toLowerCase().includes('male') ||
              v.name.toLowerCase().includes('david') ||
              v.name.toLowerCase().includes('daniel') ||
              v.name.toLowerCase().includes('guy') ||
              v.name.toLowerCase().includes('george') ||
              v.name.toLowerCase().includes('james') ||
              v.name.toLowerCase().includes('google us english') ||
              v.name.toLowerCase().includes('natural'))
        );

        const list = male.length > 0 ? male : voices.filter((v) => v.lang.startsWith('en'));
        setAvailableMaleVoices(list);
        if (list.length > 0 && !selectedVoiceName) {
          setSelectedVoiceName(list[0].name);
        }
      }
    };

    updateVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Web SpeechRecognition for speaking to the tutor
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let str = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            str += event.results[i][0].transcript;
          }
          if (str.trim()) {
            setUserSpokenInput(str);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } catch (_) {}
    }
  }, []);

  // Speak text aloud in configured Male Voice
  const speakWithMaleVoice = (text: string) => {
    if (!('speechSynthesis' in window)) {
      showToast('Speech synthesis not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    // Pick selected male voice
    const voices = window.speechSynthesis.getVoices();
    const chosen = voices.find((v) => v.name === selectedVoiceName) || availableMaleVoices[0];
    if (chosen) {
      utterance.voice = chosen;
    }

    // Set pitch & rate tailored for a warm, engaging male baritone
    utterance.pitch = 0.88;
    utterance.rate = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    showToast('Feynman AI Tutor speaking...');
  };

  const handleStopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const handleListenToUser = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      if (userSpokenInput.trim()) {
        askTutorWithQuestion(userSpokenInput);
      }
    } else {
      setUserSpokenInput('');
      setIsListening(true);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (_) {}
      }
      showToast('Listening... Speak your question or explanation.');
    }
  };

  const askTutorWithQuestion = async (questionText: string) => {
    showToast('Feynman Tutor is thinking...');
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
        setTutorSpeechText(data.spokenText);
        speakWithMaleVoice(data.spokenText);
      } else {
        throw new Error('Tutor turn failed');
      }
    } catch (e) {
      const fallback = `Look, here's how to think about ${activeConcept.title}: imagine dropping ink in turbulent water. The particles don't disappear, but the pattern is completely scrambled. That's the essence of it!`;
      setTutorSpeechText(fallback);
      speakWithMaleVoice(fallback);
    }
  };

  return (
    <section className="bg-surface-container-lowest dark:bg-surface-container-low rounded-xl hairline-border p-4.5 space-y-4 shadow-[0px_2px_8px_rgba(24,24,27,0.04)] relative overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-secondary-fixed/50 dark:bg-secondary-container text-secondary dark:text-secondary-fixed flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[20px]">record_voice_over</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-headline-sm text-headline-sm text-primary dark:text-primary-fixed font-bold leading-tight">
                Interactive Male Voice Tutor
              </h3>
              <span className="px-2 py-0.2 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold uppercase">
                R. Feynman Persona
              </span>
            </div>
            <p className="text-xs text-outline">
              Two-way audio dialogue powered by Groq AI & natural voice synthesis
            </p>
          </div>
        </div>

        {/* Male Voice Selector */}
        {availableMaleVoices.length > 0 && (
          <select
            value={selectedVoiceName}
            onChange={(e) => setSelectedVoiceName(e.target.value)}
            className="text-[11px] bg-surface-container dark:bg-surface-container-high rounded px-2 py-1 text-on-surface border-none outline-none max-w-[120px] truncate"
            title="Choose Male Speech Engine"
          >
            {availableMaleVoices.map((v) => (
              <option key={v.name} value={v.name}>
                ♂ {v.name.replace(/Google|Microsoft/g, '').trim()}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Spoken Quote Box with Equalizer Indicator */}
      <div className="p-3.5 bg-surface-container-low dark:bg-surface-container rounded-xl hairline-border relative">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-outline-variant/20 text-xs">
          <span className="font-semibold text-secondary dark:text-secondary-fixed flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isSpeaking ? 'bg-secondary animate-ping' : 'bg-outline'
              }`}
            ></span>
            {isSpeaking ? 'Feynman is speaking aloud...' : 'Spoken Explanation:'}
          </span>
          {isSpeaking && (
            <div className="flex items-center gap-1">
              <span className="w-1 h-3 bg-secondary rounded-full animate-bounce"></span>
              <span className="w-1 h-4 bg-secondary rounded-full animate-bounce delay-75"></span>
              <span className="w-1 h-2 bg-secondary rounded-full animate-bounce delay-150"></span>
              <span className="w-1 h-5 bg-secondary rounded-full animate-bounce delay-100"></span>
            </div>
          )}
        </div>

        <p className="text-body-md font-body-md text-on-surface italic leading-relaxed">
          {tutorSpeechText}
        </p>

        {userSpokenInput && (
          <div className="mt-2.5 pt-2 border-t border-outline-variant/20 text-xs text-on-surface-variant">
            <strong>You asked:</strong> "{userSpokenInput}"
          </div>
        )}
      </div>

      {/* Voice Controls: Play, Talk, and Stop */}
      <div className="flex items-center gap-2 pt-1">
        {!isSpeaking ? (
          <button
            onClick={() => speakWithMaleVoice(tutorSpeechText)}
            className="flex-1 py-2.5 px-3 rounded-lg bg-primary-container text-on-primary font-label-md text-xs font-semibold flex items-center justify-center gap-2 hover:bg-primary transition-all active:scale-95 shadow-xs"
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              play_arrow
            </span>
            <span>Hear Male Voice Explain</span>
          </button>
        ) : (
          <button
            onClick={handleStopSpeaking}
            className="flex-1 py-2.5 px-3 rounded-lg bg-surface-container dark:bg-surface-container-high text-on-surface font-label-md text-xs font-semibold flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">stop</span>
            <span>Pause Voice</span>
          </button>
        )}

        {/* Talk / Voice QA button */}
        <button
          onClick={handleListenToUser}
          className={`py-2.5 px-4 rounded-lg font-label-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
            isListening
              ? 'bg-secondary text-on-secondary animate-pulse'
              : 'bg-secondary/15 text-secondary dark:text-secondary-fixed hover:bg-secondary/25'
          }`}
          title="Speak your question aloud"
        >
          <span className="material-symbols-outlined text-[18px]">
            {isListening ? 'graphic_eq' : 'mic'}
          </span>
          <span>{isListening ? 'Stop & Ask' : 'Talk to Feynman'}</span>
        </button>
      </div>

      {/* Suggested Quick Questions for Spoken Dialogue */}
      <div className="pt-1 flex flex-wrap gap-1.5">
        <span className="text-[11px] text-outline font-label-sm self-center mr-1">
          Ask aloud:
        </span>
        <button
          onClick={() =>
            askTutorWithQuestion(
              "Why doesn't Schrödinger's cat stay both alive and dead in real life?"
            )
          }
          className="text-[11px] px-2.5 py-1 rounded-full bg-surface-container dark:bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant transition-colors"
        >
          "Why doesn't the cat stay both alive and dead?"
        </button>
        <button
          onClick={() =>
            askTutorWithQuestion(
              'Can you give me a simple physical analogy that a 10-year-old would love?'
            )
          }
          className="text-[11px] px-2.5 py-1 rounded-full bg-surface-container dark:bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant transition-colors"
        >
          "Give me an easy 10-year-old analogy"
        </button>
        <button
          onClick={() =>
            askTutorWithQuestion('What is the biggest misconception students have about this topic?')
          }
          className="text-[11px] px-2.5 py-1 rounded-full bg-surface-container dark:bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant transition-colors"
        >
          "What is the biggest misconception?"
        </button>
      </div>
    </section>
  );
};
