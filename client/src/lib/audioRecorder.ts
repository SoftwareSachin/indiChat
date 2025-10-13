export class AudioRecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async startRecording(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let mimeType = 'audio/webm;codecs=opus';
      
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
      }

      const options: MediaRecorderOptions = {
        mimeType: mimeType,
      };

      this.mediaRecorder = new MediaRecorder(this.stream, options);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      console.log('🎤 Audio recording started');
    } catch (error) {
      console.error('Failed to start audio recording:', error);
      throw new Error('Microphone access denied or unavailable');
    }
  }

  async stopRecording(): Promise<{ audioBlob: Blob; mimeType: string }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        
        // Stop all tracks to release microphone
        this.stream?.getTracks().forEach(track => track.stop());
        this.stream = null;
        
        console.log('🛑 Audio recording stopped:', audioBlob.size, 'bytes');
        resolve({ audioBlob, mimeType });
      };

      this.mediaRecorder.stop();
    });
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}

export class AudioPlayerService {
  private audioContext: AudioContext | null = null;

  async playAudioFromBase64(base64Audio: string, mimeType: string): Promise<void> {
    try {
      // Decode base64 to binary
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Create audio context if needed
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      // Handle PCM audio (from Gemini TTS)
      if (mimeType.includes('pcm')) {
        const sampleRate = 24000; // Gemini outputs at 24kHz
        const audioBuffer = this.audioContext.createBuffer(1, bytes.length / 2, sampleRate);
        const channelData = audioBuffer.getChannelData(0);
        
        // Convert 16-bit PCM to float
        const dataView = new DataView(bytes.buffer);
        for (let i = 0; i < bytes.length / 2; i++) {
          channelData[i] = dataView.getInt16(i * 2, true) / 32768.0;
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioContext.destination);
        source.start();
        
        console.log('🔊 Playing PCM audio');
      } else {
        // Handle other audio formats (webm, mp3, etc.)
        const audioBuffer = await this.audioContext.decodeAudioData(bytes.buffer);
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioContext.destination);
        source.start();
        
        console.log('🔊 Playing audio');
      }
    } catch (error) {
      console.error('Failed to play audio:', error);
      throw error;
    }
  }

  async playAudioFromBlob(blob: Blob): Promise<void> {
    const audio = new Audio(URL.createObjectURL(blob));
    await audio.play();
  }
}
