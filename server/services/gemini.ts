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

// Text-to-speech using Gemini (for higher quality audio in supported languages)
export async function generateSpeech(text: string, languageCode: string): Promise<string> {
  try {
    // Note: Gemini 2.5 Flash supports text input only. 
    // For actual TTS, we'll use the browser's native speech synthesis
    // This function can be extended when Gemini adds TTS support
    return text;
  } catch (error) {
    console.error("Speech generation error:", error);
    throw new Error(`Failed to generate speech: ${error}`);
  }
}

// Speech-to-text using Gemini (for improved accuracy with context)
export async function transcribeSpeech(audioData: string, languageCode: string): Promise<string> {
  try {
    // Note: Gemini 2.5 Flash supports text input only
    // For actual STT, we'll use the browser's native speech recognition
    // This function can be extended when Gemini adds audio input support
    return "";
  } catch (error) {
    console.error("Transcription error:", error);
    throw new Error(`Failed to transcribe speech: ${error}`);
  }
}
