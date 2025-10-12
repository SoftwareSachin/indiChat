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
      en: "English",
      hi: "Hindi",
      ta: "Tamil",
      te: "Telugu",
      bn: "Bengali",
      mr: "Marathi",
    };

    const sourceLanguage = languageNames[sourceLang] || sourceLang;
    const targetLanguage = languageNames[targetLang] || targetLang;

    const prompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}. Only return the translated text, nothing else:\n\n${text}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text?.trim() || text;
  } catch (error) {
    console.error("Translation error:", error);
    throw new Error(`Failed to translate text: ${error}`);
  }
}

export async function detectLanguage(text: string): Promise<string> {
  try {
    const prompt = `Detect the language of this text and respond with only the ISO 639-1 language code (en, hi, ta, te, bn, or mr). Text: ${text}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const detected = response.text?.trim().toLowerCase() || "en";
    const validCodes = ["en", "hi", "ta", "te", "bn", "mr"];
    return validCodes.includes(detected) ? detected : "en";
  } catch (error) {
    console.error("Language detection error:", error);
    return "en";
  }
}
