export class AudioRecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private audioLevel: number = 0;

  async startRecording(): Promise<void> {
    try {
      // Enhanced audio constraints for better quality and low-volume capture
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: true,        // Remove echo
        noiseSuppression: true,         // Reduce background noise
        autoGainControl: true,          // Automatically adjust volume for low/high input
        sampleRate: 48000,              // High quality sample rate
        channelCount: 1,                // Mono for voice (smaller file size)
      };

      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: audioConstraints 
      });

      // Create audio context for gain boost and analysis
      this.audioContext = new AudioContext({ sampleRate: 48000 });
      const source = this.audioContext.createMediaStreamSource(this.stream);
      
      // Create gain node to boost low-volume audio
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 2.0; // Boost by 2x for low-volume speech
      
      // Create analyser for audio level monitoring
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      
      // Connect audio processing chain
      source.connect(this.gainNode);
      this.gainNode.connect(this.analyser);
      
      // Create a destination stream for the recorder
      const destination = this.audioContext.createMediaStreamDestination();
      this.gainNode.connect(destination);
      
      // Use the processed stream for recording
      const processedStream = destination.stream;
      
      // Select best MIME type with highest quality
      let mimeType = 'audio/webm;codecs=opus';
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
        'audio/webm',
        'audio/ogg',
      ];
      
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      const options: MediaRecorderOptions = {
        mimeType: mimeType,
        audioBitsPerSecond: 128000, // High quality bitrate (128 kbps)
      };

      this.mediaRecorder = new MediaRecorder(processedStream, options);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Start recording with timeslice for better data handling
      this.mediaRecorder.start(100); // Collect data every 100ms
      
      // Start monitoring audio levels
      this.startAudioLevelMonitoring();
      
      console.log('🎤 Audio recording started with enhanced settings');
      console.log('📊 Audio settings:', {
        mimeType,
        bitrate: '128kbps',
        sampleRate: '48kHz',
        gain: '2.0x',
        features: 'echo cancellation, noise suppression, auto-gain'
      });
    } catch (error) {
      console.error('Failed to start audio recording:', error);
      throw new Error('Microphone access denied or unavailable');
    }
  }

  private startAudioLevelMonitoring(): void {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    
    const checkLevel = () => {
      if (!this.analyser || !this.isRecording()) return;
      
      this.analyser.getByteFrequencyData(dataArray);
      
      // Calculate average audio level
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      this.audioLevel = average;
      
      // Log if audio is too quiet
      if (average < 5) {
        console.warn('⚠️ Very low audio input detected. Speak louder or check microphone.');
      }
      
      requestAnimationFrame(checkLevel);
    };
    
    checkLevel();
  }

  getAudioLevel(): number {
    return this.audioLevel;
  }

  pauseRecording(): void {
    if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
      console.warn('Cannot pause: no active recording');
      return;
    }
    
    this.mediaRecorder.pause();
    console.log('⏸️ Audio recording paused');
  }

  resumeRecording(): void {
    if (!this.mediaRecorder || this.mediaRecorder.state !== 'paused') {
      console.warn('Cannot resume: recording not paused');
      return;
    }
    
    this.mediaRecorder.resume();
    console.log('▶️ Audio recording resumed');
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
        
        // Clean up resources
        this.cleanup();
        
        console.log('🛑 Audio recording stopped:', audioBlob.size, 'bytes');
        resolve({ audioBlob, mimeType });
      };

      this.mediaRecorder.stop();
    });
  }

  cancelRecording(): void {
    if (!this.mediaRecorder) {
      return;
    }

    this.cleanup();
    this.audioChunks = [];
    
    console.log('❌ Audio recording cancelled');
  }

  private cleanup(): void {
    // Stop all media tracks
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    // Clear nodes
    this.gainNode = null;
    this.analyser = null;
    this.mediaRecorder = null;
    this.audioLevel = 0;
  }

  getState(): 'inactive' | 'recording' | 'paused' {
    return this.mediaRecorder?.state || 'inactive';
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  isPaused(): boolean {
    return this.mediaRecorder?.state === 'paused';
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
