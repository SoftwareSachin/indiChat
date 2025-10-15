// OpenAI Whisper API service with automatic key rotation
import OpenAI from 'openai';

// API Key Rotation System - Load all 4 Whisper API keys
const API_KEYS = [
  process.env.WHISPER_API_KEY_1,
  process.env.WHISPER_API_KEY_2,
  process.env.WHISPER_API_KEY_3,
  process.env.WHISPER_API_KEY_4,
].filter(key => key && key.trim() !== '') as string[];

// Track which keys are exhausted
const exhaustedKeys = new Set<number>();
let currentKeyIndex = 0;

// Validate we have at least one API key
if (API_KEYS.length === 0) {
  throw new Error("No Whisper API keys found. Please set WHISPER_API_KEY_1 through WHISPER_API_KEY_4");
}

console.log(`🔑 Loaded ${API_KEYS.length} Whisper API key(s) for rotation`);

// Get current OpenAI client with active key, returning both client and the key index used
function getOpenAIClient(): { client: OpenAI; keyIndex: number } {
  return {
    client: new OpenAI({ 
      apiKey: API_KEYS[currentKeyIndex],
      timeout: 60000, // Increased to 60 second timeout
      maxRetries: 5, // More retries
      // Add custom fetch with better error handling
      fetch: async (url, init) => {
        try {
          const response = await fetch(url, {
            ...init,
            signal: AbortSignal.timeout(60000), // 60 second timeout
          });
          return response;
        } catch (error: any) {
          console.log(`🌐 Network error for ${url}:`, error.message || error);
          throw error;
        }
      }
    }),
    keyIndex: currentKeyIndex
  };
}

// Rotate to next available API key from a specific starting index
function rotateToNextKey(fromIndex: number): boolean {
  const startIndex = fromIndex;
  let nextIndex = fromIndex;

  do {
    nextIndex = (nextIndex + 1) % API_KEYS.length;

    if (!exhaustedKeys.has(nextIndex)) {
      currentKeyIndex = nextIndex;
      console.log(`🔄 Rotated to Whisper API key #${currentKeyIndex + 1} (from #${fromIndex + 1})`);
      return true;
    }

    // If we've checked all keys and they're all exhausted
    if (nextIndex === startIndex) {
      console.error("🚫 All Whisper API keys are quota exhausted!");
      return false;
    }
  } while (nextIndex !== startIndex);

  return false;
}

// Mark specific key as exhausted and rotate from that key
function handleQuotaExceeded(failedKeyIndex: number): boolean {
  console.warn(`⚠️ Whisper API key #${failedKeyIndex + 1} quota exceeded, marking as exhausted`);
  exhaustedKeys.add(failedKeyIndex);
  return rotateToNextKey(failedKeyIndex);
}

// Check if error is quota-related or connection-related
function isQuotaError(error: any): boolean {
  return (
    error.status === 429 ||
    error.code === 429 ||
    error.message?.includes('quota') ||
    error.message?.includes('rate limit') ||
    error.message?.includes('insufficient_quota')
  );
}

// Check if error is connection-related (should retry with same key)
function isConnectionError(error: any): boolean {
  return (
    error.message?.includes('Connection error') ||
    error.message?.includes('ECONNRESET') ||
    error.message?.includes('ETIMEDOUT') ||
    error.message?.includes('network') ||
    error.cause?.code === 'ECONNRESET'
  );
}

// Retry with key rotation on quota errors and connection retries
async function retryWithRotation<T>(
  operation: (client: OpenAI) => Promise<T>,
  maxAttempts: number = API_KEYS.length * 2 // Allow more attempts for connection retries
): Promise<T> {
  let lastError: any;
  let connectionRetries = 0;
  const maxConnectionRetries = 3;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { client, keyIndex } = getOpenAIClient();

    try {
      return await operation(client);
    } catch (error: any) {
      lastError = error;
      console.log(`🔄 Attempt ${attempt + 1}/${maxAttempts} failed:`, error.message);

      if (isQuotaError(error)) {
        // Use the keyIndex that was captured when the client was created
        const rotated = handleQuotaExceeded(keyIndex);

        if (!rotated) {
          throw new Error(`All ${API_KEYS.length} Whisper API keys have exceeded their quotas. Please wait for quota reset or upgrade your plan.`);
        }

        // Continue to next iteration with new key
        continue;
      }

      if (isConnectionError(error) && connectionRetries < maxConnectionRetries) {
        connectionRetries++;
        console.log(`🔄 Connection error, retrying in 2 seconds... (${connectionRetries}/${maxConnectionRetries})`);
        
        // Wait 2 seconds before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }

      // If not a quota or connection error, throw immediately
      throw error;
    }
  }

  throw lastError;
}

// Language mapping for Whisper (it supports more languages than Gemini)
const whisperLanguageMap: Record<string, string> = {
  hi: "hindi",
  bn: "bengali",
  te: "telugu",
  mr: "marathi",
  ta: "tamil",
  gu: "gujarati",
  ur: "urdu",
  kn: "kannada",
  or: "odia",
  ml: "malayalam",
  pa: "punjabi",
  as: "assamese",
  en: "english"
};

export async function transcribeSpeech(audioData: Buffer, languageCode: string, mimeType: string = 'audio/webm'): Promise<string> {
  try {
    const whisperLanguage = whisperLanguageMap[languageCode] || "english";

    console.log(`🎤 WHISPER TRANSCRIPTION: ${whisperLanguage}, mime: ${mimeType}`);

    // Guard against missing or invalid mimeType
    if (!mimeType || typeof mimeType !== 'string') {
      console.warn('⚠️ No mimeType provided, defaulting to audio/webm');
      mimeType = 'audio/webm';
    }

    // Normalize mimeType by stripping codec information
    // Whisper expects base media type only (e.g., "audio/webm" not "audio/webm;codecs=opus")
    const baseMimeType = mimeType.split(';')[0]?.trim() || 'audio/webm';
    
    // Determine correct file extension based on mimeType
    let fileExtension = 'webm';
    
    if (mimeType.includes('webm')) {
      fileExtension = 'webm';
    } else if (mimeType.includes('ogg')) {
      fileExtension = 'ogg';
    } else if (mimeType.includes('wav')) {
      fileExtension = 'wav';
    } else if (mimeType.includes('mp3')) {
      fileExtension = 'mp3';
    } else if (mimeType.includes('m4a') || mimeType.includes('mp4')) {
      fileExtension = 'm4a';
    } else if (mimeType.includes('mpeg') || mimeType.includes('aac')) {
      fileExtension = 'mp3';
    } else {
      console.warn(`⚠️ Unknown mimeType: ${mimeType}, defaulting to webm`);
      fileExtension = 'webm';
    }

    // Create audio file with normalized base mimetype (no codec info)
    const audioFile = new File([audioData], `audio.${fileExtension}`, { type: baseMimeType });
    
    console.log(`📁 Created audio file: audio.${fileExtension} (${baseMimeType}), size: ${audioData.length} bytes`);

    // Quick connection test first
    const response = await retryWithRotation(async (openai) => {
      return await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: whisperLanguage,
        response_format: "text"
      }, {
        timeout: 15000, // Reduced timeout for faster failure
        maxRetries: 1, // Single attempt per key
      });
    });

    const transcribedText = response || "";
    console.log(`✅ WHISPER TRANSCRIPTION SUCCESS: "${transcribedText.substring(0, 100)}..."`);

    return transcribedText;
  } catch (error: any) {
    console.error("❌ WHISPER TRANSCRIPTION ERROR:", error);
    console.error("❌ Error details:", {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type,
    });
    
    // Since OpenAI is not accessible, return a helpful message
    const languageNames: Record<string, string> = {
      hi: "Hindi",
      bn: "Bengali", 
      te: "Telugu",
      mr: "Marathi",
      ta: "Tamil",
      gu: "Gujarati",
      ur: "Urdu",
      kn: "Kannada",
      or: "Odia",
      ml: "Malayalam",
      pa: "Punjabi",
      as: "Assamese",
    };
    
    const languageName = languageNames[languageCode] || languageCode;
    
    // Provide specific error messages based on error type
    if (error.message?.includes('quota') || error.message?.includes('insufficient_quota')) {
      return `🎤 [Voice message in ${languageName}] - API quota exceeded. Please wait for quota reset or upgrade your OpenAI plan.`;
    } else if (error.message?.includes('network') || error.message?.includes('Connection')) {
      return `🎤 [Voice message in ${languageName}] - Network error. Please check your internet connection and try again.`;
    } else if (error.message?.includes('Invalid file format')) {
      return `🎤 [Voice message in ${languageName}] - Audio format error. Please try recording again.`;
    }
    
    // Return a user-friendly message instead of crashing
    return `🎤 [Voice message in ${languageName}] - Transcription temporarily unavailable. The audio was received but could not be processed.`;
  }
}
