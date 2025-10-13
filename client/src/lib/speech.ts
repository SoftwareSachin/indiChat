// Speech-to-text using Web Speech API
export class SpeechRecognitionService {
  private recognition: any;
  private isListening = false;

  constructor(language: string = 'en-US') {
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
      en: 'en-US',
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
      zh: 'zh-CN',
      ja: 'ja-JP',
      hi: 'hi-IN',
      ar: 'ar-SA',
      ta: 'ta-IN',
      te: 'te-IN',
      bn: 'bn-IN',
      mr: 'mr-IN',
    };
    this.recognition.lang = langMap[languageCode] || 'en-US';
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
      en: 'en-US',
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
      zh: 'zh-CN',
      ja: 'ja-JP',
      hi: 'hi-IN',
      ar: 'ar-SA',
      ta: 'ta-IN',
      te: 'te-IN',
      bn: 'bn-IN',
      mr: 'mr-IN',
    };
    
    utterance.lang = langMap[languageCode] || 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1;

    // Try to find a voice for the selected language
    const voices = this.synth.getVoices();
    const targetLang = langMap[languageCode] || 'en-US';
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
