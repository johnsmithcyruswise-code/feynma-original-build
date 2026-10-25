// Speech helpers for Web Speech Synthesis and Web Speech Recognition

export interface SpeechVoiceOption {
  voice: SpeechSynthesisVoice;
  name: string;
  lang: string;
  isDefault: boolean;
}

export const loadAvailableVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return resolve([]);
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      return resolve(voices);
    }

    const onVoicesChanged = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
      resolve(window.speechSynthesis.getVoices());
    };

    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);

    // Fallback timer if event doesn't fire
    setTimeout(() => {
      resolve(window.speechSynthesis.getVoices());
    }, 400);
  });
};

export const findDefaultVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
  if (!voices || voices.length === 0) return null;

  // Prefer English (US) male or natural sounding voice
  const enUs = voices.filter((v) => v.lang.startsWith('en-US') || v.lang.startsWith('en_US'));
  if (enUs.length > 0) {
    // Prefer Google or Natural or Aaron/Daniel/Fred/Alex if available
    const preferred = enUs.find((v) =>
      /(natural|male|guy|david|alex|daniel|george|feynman)/i.test(v.name)
    );
    return preferred || enUs[0];
  }

  const enAny = voices.find((v) => v.lang.startsWith('en'));
  return enAny || voices[0];
};

export const speakText = (
  text: string,
  voice: SpeechSynthesisVoice | null = null,
  onEnd?: () => void
): void => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  stopSpeaking();

  if (!text || !text.trim()) {
    if (onEnd) onEnd();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text.trim());
  if (voice) {
    utterance.voice = voice;
  }
  utterance.pitch = 0.9;
  utterance.rate = 0.95;

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = () => {
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = (): void => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

export const isSpeaking = (): boolean => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    return window.speechSynthesis.speaking;
  }
  return false;
};

// Web Speech Recognition helper (for mic input / live teaching mode)
export const createSpeechRecognizer = (
  onTranscript: (chunk: string, isFinal: boolean) => void,
  onError?: (err: any) => void
): any => {
  if (typeof window === 'undefined') return null;

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) return null;

  try {
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (final) {
        onTranscript(final, true);
      } else if (interim) {
        onTranscript(interim, false);
      }
    };

    if (onError) {
      recognition.onerror = onError;
    }

    return recognition;
  } catch (err) {
    console.warn('SpeechRecognition init error:', err);
    return null;
  }
};
