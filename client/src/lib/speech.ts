// Speech-to-text using Web Speech API
export class SpeechRecognitionService {
  private recognition: any;
  private isListening = false;

  constructor(language: string = 'hi-IN') {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      throw new Error('Speech recognition not supported in this browser');
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.setLanguage(language);
  }

  setLanguage(languageCode: string) {
    const langMap: Record<string, string> = {
      hi: 'hi-IN',
      bn: 'bn-IN',
      te: 'te-IN',
      mr: 'mr-IN',
      ta: 'ta-IN',
      gu: 'gu-IN',
      ur: 'ur-IN',
      kn: 'kn-IN',
      or: 'or-IN',
      ml: 'ml-IN',
      pa: 'pa-IN',
      as: 'as-IN',
    };
    this.recognition.lang = langMap[languageCode] || 'hi-IN';
  }

  start(
    onResult: (text: string, isFinal: boolean) => void,
    onError?: (error: any) => void
  ) {
    if (this.isListening) return;

    this.recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const text = event.results[last][0].transcript;
      const isFinal = event.results[last].isFinal;
      onResult(text, isFinal);
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (onError) onError(event.error);
    };

    this.recognition.start();
    this.isListening = true;
  }

  stop() {
    if (!this.isListening) return;
    this.recognition.stop();
    this.isListening = false;
  }

  isActive() {
    return this.isListening;
  }
}

// Text-to-speech using Speech Synthesis API
export class TextToSpeechService {
  private synth: SpeechSynthesis;

  constructor() {
    this.synth = window.speechSynthesis;
  }

  speak(text: string, languageCode: string) {
    // Cancel any ongoing speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    const langMap: Record<string, string> = {
      hi: 'hi-IN',
      bn: 'bn-IN',
      te: 'te-IN',
      mr: 'mr-IN',
      ta: 'ta-IN',
      gu: 'gu-IN',
      ur: 'ur-IN',
      kn: 'kn-IN',
      or: 'or-IN',
      ml: 'ml-IN',
      pa: 'pa-IN',
      as: 'as-IN',
    };
    
    utterance.lang = langMap[languageCode] || 'hi-IN';
    utterance.rate = 0.9;
    utterance.pitch = 1;

    // Try to find a voice for the selected language
    const voices = this.synth.getVoices();
    const targetLang = langMap[languageCode] || 'hi-IN';
    const voice = voices.find(v => v.lang.startsWith(targetLang.split('-')[0]));
    if (voice) {
      utterance.voice = voice;
    }

    this.synth.speak(utterance);
  }

  stop() {
    this.synth.cancel();
  }

  isSpeaking() {
    return this.synth.speaking;
  }
}
