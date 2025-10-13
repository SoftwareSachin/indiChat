export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', locale: 'en-US' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', locale: 'es-ES' },
  { code: 'fr', name: 'French', nativeName: 'Français', locale: 'fr-FR' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', locale: 'de-DE' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', locale: 'zh-CN' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', locale: 'ja-JP' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', locale: 'hi-IN' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', locale: 'ar-SA' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', locale: 'ta-IN' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', locale: 'te-IN' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', locale: 'bn-IN' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', locale: 'mr-IN' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

export function getLanguageName(code: string): string {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
  return lang?.nativeName || code;
}

export function getLanguageByCode(code: string) {
  return SUPPORTED_LANGUAGES.find(l => l.code === code);
}
