// Fallback Speech Recognition using Browser's Web Speech API
// This will work when Whisper API is not accessible

export class FallbackSpeechRecognition {
  private recognition: any;
  private isListening = false;

  constructor(language: string = 'hi-IN') {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      throw new Error('Speech recognition not supported in this browser');
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false; // Single result
    this.recognition.interimResults = false; // Only final results
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

  async transcribeAudio(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.isListening) {
        reject(new Error('Already listening'));
        return;
      }

      this.recognition.onresult = (event: any) => {
        const result = event.results[0][0].transcript;
        console.log(`✅ FALLBACK STT: "${result}"`);
        resolve(result);
      };

      this.recognition.onerror = (event: any) => {
        console.error('❌ Fallback speech recognition error:', event.error);
        reject(new Error(`Speech recognition failed: ${event.error}`));
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };

      try {
        this.recognition.start();
        this.isListening = true;
        console.log('🎤 FALLBACK STT: Started listening...');
      } catch (error) {
        reject(error);
      }
    });
  }

  stop() {
    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  isActive() {
    return this.isListening;
  }
}

// Check if fallback STT is available
export function isFallbackSTTAvailable(): boolean {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return !!SpeechRecognition;
}
