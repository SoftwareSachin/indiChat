export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', locale: 'en-US' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', locale: 'hi-IN' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', locale: 'bn-IN' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', locale: 'te-IN' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', locale: 'mr-IN' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', locale: 'ta-IN' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', locale: 'gu-IN' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', locale: 'ur-IN' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', locale: 'kn-IN' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', locale: 'or-IN' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', locale: 'ml-IN' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', locale: 'pa-IN' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', locale: 'as-IN' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

export function getLanguageName(code: string): string {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
  return lang?.nativeName || code;
}

export function getLanguageByCode(code: string) {
  return SUPPORTED_LANGUAGES.find(l => l.code === code);
}
