// DON'T DELETE THIS COMMENT - Using javascript_gemini blueprint
// Note: Using gemini-2.5-flash for translation tasks

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const translatedText = response.text?.trim() || text;
    console.log(`✅ GEMINI RESPONSE: "${translatedText.substring(0, 50)}..."`);
    
    return translatedText;
  } catch (error) {
    console.error("❌ GEMINI TRANSLATION ERROR:", error);
    throw new Error(`Failed to translate text: ${error}`);
  }
}

export async function detectLanguage(text: string): Promise<string> {
  try {
    const prompt = `Detect the language of this text and respond with only the ISO 639-1 language code. Valid codes are: hi (Hindi), bn (Bengali), te (Telugu), mr (Marathi), ta (Tamil), gu (Gujarati), ur (Urdu), kn (Kannada), or (Odia), ml (Malayalam), pa (Punjabi), as (Assamese). Text: ${text}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const detected = response.text?.trim().toLowerCase() || "hi";
    const validCodes = ["hi", "bn", "te", "mr", "ta", "gu", "ur", "kn", "or", "ml", "pa", "as"];
    return validCodes.includes(detected) ? detected : "hi";
  } catch (error) {
    console.error("Language detection error:", error);
    return "hi";
  }
}

// Speech-to-text using Gemini (audio transcription)
export async function transcribeSpeech(audioData: Buffer, languageCode: string, mimeType: string = 'audio/webm'): Promise<string> {
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

    const language = languageNames[languageCode] || "Hindi";
    
    console.log(`🎤 GEMINI AUDIO TRANSCRIPTION: ${language}, mime: ${mimeType}`);

    const prompt = `Transcribe this audio in ${language}. Provide only the transcribed text, no explanations.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: audioData.toString('base64'),
                mimeType: mimeType,
              }
            }
          ]
        }
      ],
    });

    const transcribedText = response.text?.trim() || "";
    console.log(`✅ GEMINI TRANSCRIPTION: "${transcribedText.substring(0, 50)}..."`);
    
    return transcribedText;
  } catch (error) {
    console.error("❌ GEMINI TRANSCRIPTION ERROR:", error);
    throw new Error(`Failed to transcribe speech: ${error}`);
  }
}

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

        const response = await ai.models.generateContent({
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

        const audioPart = response.candidates?.[0]?.content?.parts?.find(
          (part: any) => part.inlineData?.mimeType?.startsWith('audio/')
        );

        if (audioPart?.inlineData?.data) {
          const audioBuffer = Buffer.from(audioPart.inlineData.data, 'base64');
          console.log(`✅ GEMINI TTS SUCCESS: Generated ${audioBuffer.length} bytes with voice ${voiceName}`);
          return audioBuffer;
        }

        // If no audio but no error, try next voice
        console.log(`⚠️ No audio from voice ${voiceName}, trying next...`);
        break; // Try next voice
        
      } catch (error: any) {
        // Check if it's a quota error (429)
        if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
          console.error(`🚫 GEMINI TTS QUOTA EXCEEDED: Free tier limit is 15 requests/day. Transcription and translation continue to work.`);
          console.error(`💡 To enable TTS: Upgrade your Gemini API plan at https://ai.google.dev/pricing`);
          throw new Error('TTS quota exceeded - upgrade API plan for unlimited TTS');
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
