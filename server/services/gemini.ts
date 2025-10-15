// DON'T DELETE THIS COMMENT - Using javascript_gemini blueprint
// Note: Using gemini-2.5-flash for translation tasks

import { GoogleGenAI } from "@google/genai";

// API Key Rotation System - Load all 5 Gemini API keys
const API_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_API_KEY_5,
].filter(key => key && key.trim() !== '') as string[];

// Track which keys are exhausted
const exhaustedKeys = new Set<number>();
let currentKeyIndex = 0;

// Validate we have at least one API key
if (API_KEYS.length === 0) {
  throw new Error("No Gemini API keys found. Please set GEMINI_API_KEY_1 through GEMINI_API_KEY_5");
}

console.log(`🔑 Loaded ${API_KEYS.length} Gemini API key(s) for rotation`);

// Get current AI client with active key, returning both client and the key index used
function getAIClient(): { client: GoogleGenAI; keyIndex: number } {
  console.log(`🔑 Using Gemini API key #${currentKeyIndex + 1}/${API_KEYS.length}`);
  return {
    client: new GoogleGenAI({ apiKey: API_KEYS[currentKeyIndex] }),
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
      console.log(`🔄 Rotated to API key #${currentKeyIndex + 1} (from #${fromIndex + 1})`);
      return true;
    }
    
    // If we've checked all keys and they're all exhausted
    if (nextIndex === startIndex) {
      console.error("🚫 All API keys are quota exhausted!");
      return false;
    }
  } while (nextIndex !== startIndex);
  
  return false;
}

// Mark specific key as exhausted and rotate from that key
function handleQuotaExceeded(failedKeyIndex: number): boolean {
  console.warn(`⚠️ API key #${failedKeyIndex + 1} quota exceeded, marking as exhausted`);
  exhaustedKeys.add(failedKeyIndex);
  return rotateToNextKey(failedKeyIndex);
}

// Check if error is quota-related
function isQuotaError(error: any): boolean {
  return (
    error.status === 429 || 
    error.code === 429 ||
    error.message?.includes('quota') || 
    error.message?.includes('RESOURCE_EXHAUSTED') ||
    error.message?.includes('rate limit')
  );
}

// Retry with key rotation on quota errors
async function retryWithRotation<T>(
  operation: (client: GoogleGenAI) => Promise<T>,
  maxAttempts: number = API_KEYS.length
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { client, keyIndex } = getAIClient();
    
    try {
      return await operation(client);
    } catch (error: any) {
      lastError = error;
      
      if (isQuotaError(error)) {
        // Use the keyIndex that was captured when the client was created
        const rotated = handleQuotaExceeded(keyIndex);
        
        if (!rotated) {
          throw new Error(`All ${API_KEYS.length} API keys have exceeded their quotas. Please wait or upgrade your plan.`);
        }
        
        // Continue to next iteration with new key
        continue;
      }
      
      // If not a quota error, throw immediately
      throw error;
    }
  }
  
  throw lastError;
}

export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  try {
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

    const sourceLanguage = languageNames[sourceLang] || sourceLang;
    const targetLanguage = languageNames[targetLang] || targetLang;

    console.log(`🔄 GEMINI TRANSLATION: "${text.substring(0, 50)}..." FROM ${sourceLanguage} → ${targetLanguage}`);

    const prompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}. Provide only the translated text, maintaining the tone and context. Do not add explanations or notes:\n\n${text}`;

    const response = await retryWithRotation(async (ai) => {
      return await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
    });

    const translatedText = response.text?.trim() || text;
    console.log(`✅ GEMINI TRANSLATION SUCCESS (key #${currentKeyIndex + 1}): "${translatedText.substring(0, 50)}..."`);
    
    return translatedText;
  } catch (error) {
    console.error("❌ GEMINI TRANSLATION ERROR:", error);
    throw new Error(`Failed to translate text: ${error}`);
  }
}

export async function detectLanguage(text: string): Promise<string> {
  try {
    const prompt = `Detect the language of this text and respond with only the ISO 639-1 language code. Valid codes are: hi (Hindi), bn (Bengali), te (Telugu), mr (Marathi), ta (Tamil), gu (Gujarati), ur (Urdu), kn (Kannada), or (Odia), ml (Malayalam), pa (Punjabi), as (Assamese). Text: ${text}`;

    const response = await retryWithRotation(async (ai) => {
      return await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
    });

    const detected = response.text?.trim().toLowerCase() || "hi";
    const validCodes = ["hi", "bn", "te", "mr", "ta", "gu", "ur", "kn", "or", "ml", "pa", "as"];
    return validCodes.includes(detected) ? detected : "hi";
  } catch (error) {
    console.error("Language detection error:", error);
    return "hi";
  }
}

// Speech-to-text functionality removed - now using OpenAI Whisper API
// This file now only handles text translation and text-to-speech

// Helper function to clean and validate text for TTS
function cleanTextForTTS(text: string): string {
  // Remove special markers and clean up text
  let cleaned = text
    .replace(/\[.*?\]/g, '') // Remove bracketed content like [साइलेंट]
    .replace(/\.{3,}/g, '.') // Replace multiple dots with single
    .trim();

  // If text is too short or just repeated characters, add context
  if (cleaned.length < 3) {
    return "";
  }

  // Check if text is just repeated characters (like "म्म्म्म्...")
  const uniqueChars = new Set(cleaned.split('')).size;
  if (uniqueChars < 3 && cleaned.length > 10) {
    return ""; // Skip TTS for meaningless repetitions
  }

  // Truncate to reasonable length (Gemini TTS has limits)
  if (cleaned.length > 900) {
    cleaned = cleaned.substring(0, 900);
  }

  return cleaned;
}

// Helper function to sleep for retry logic
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Text-to-speech using Gemini with retry logic and fallbacks
export async function generateSpeech(text: string, languageCode: string): Promise<Buffer> {
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

  const language = languageNames[languageCode] || "Hindi";
  
  // Clean and validate text
  const cleanedText = cleanTextForTTS(text);
  
  if (!cleanedText) {
    console.log(`⚠️ Text too short or invalid for TTS, skipping: "${text.substring(0, 30)}..."`);
    throw new Error("Text not suitable for TTS");
  }

  console.log(`🔊 GEMINI TTS GENERATION: "${cleanedText.substring(0, 50)}..." in ${language}`);

  // Try multiple voices in order of preference
  const voices = ['Kore', 'Puck', 'Charon', 'Orus'];
  const maxRetries = 3;

  for (const voiceName of voices) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Improved prompt format
        const prompt = cleanedText;

        const response = await retryWithRotation(async (ai) => {
          return await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [
              {
                parts: [{ text: prompt }]
              }
            ],
            config: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: voiceName
                  }
                }
              }
            }
          });
        });

        const audioPart = response.candidates?.[0]?.content?.parts?.find(
          (part: any) => part.inlineData?.mimeType?.startsWith('audio/')
        );

        if (audioPart?.inlineData?.data) {
          const audioBuffer = Buffer.from(audioPart.inlineData.data, 'base64');
          console.log(`✅ GEMINI TTS SUCCESS (key #${currentKeyIndex + 1}): Generated ${audioBuffer.length} bytes with voice ${voiceName}`);
          return audioBuffer;
        }

        // If no audio but no error, try next voice
        console.log(`⚠️ No audio from voice ${voiceName}, trying next...`);
        break; // Try next voice
        
      } catch (error: any) {
        // Check if it's a quota error (429) - this is already handled by retryWithRotation
        if (error.message?.includes('All') && error.message?.includes('API keys')) {
          // All keys exhausted
          console.error(`🚫 ALL GEMINI API KEYS EXHAUSTED`);
          console.error(`💡 Please wait for quota reset or upgrade your Gemini API plan at https://ai.google.dev/pricing`);
          throw error;
        }

        const isLastAttempt = attempt === maxRetries;
        const isLastVoice = voiceName === voices[voices.length - 1];
        
        if (isLastAttempt && isLastVoice) {
          console.error(`❌ GEMINI TTS FAILED after all retries with all voices:`, error.message);
          throw new Error(`TTS failed: ${error.message}`);
        }
        
        // Exponential backoff only for non-quota errors
        if (!isLastAttempt) {
          const delay = Math.pow(2, attempt) * 100; // 200ms, 400ms, 800ms
          console.log(`⏳ Retry ${attempt}/${maxRetries} for voice ${voiceName} after ${delay}ms...`);
          await sleep(delay);
        }
      }
    }
  }

  throw new Error("TTS failed after trying all voices and retries");
}
