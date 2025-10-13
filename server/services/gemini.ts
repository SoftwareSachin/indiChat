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

// Text-to-speech using Gemini (native audio synthesis)
export async function generateSpeech(text: string, languageCode: string): Promise<Buffer> {
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
    
    console.log(`🔊 GEMINI TTS GENERATION: "${text.substring(0, 50)}..." in ${language}`);

    const prompt = `Say this in ${language}: ${text}`;

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
              voiceName: 'Kore'
            }
          }
        }
      }
    });

    const audioPart = response.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.inlineData?.mimeType?.startsWith('audio/')
    );

    if (!audioPart?.inlineData?.data) {
      console.log("⚠️ No audio in response, falling back to text-only. Gemini may not support TTS with this model.");
      throw new Error("No audio data in response");
    }

    const audioBuffer = Buffer.from(audioPart.inlineData.data, 'base64');
    console.log(`✅ GEMINI TTS: Generated ${audioBuffer.length} bytes of audio`);
    
    return audioBuffer;
  } catch (error) {
    console.error("❌ GEMINI TTS ERROR:", error);
    throw new Error(`Failed to generate speech: ${error}`);
  }
}
