import { LanguageSelector } from "../LanguageSelector";
import { useState } from "react";
import { type LanguageCode } from "@/lib/languages";

export default function LanguageSelectorExample() {
  const [language, setLanguage] = useState<LanguageCode>('en');
  
  return (
    <LanguageSelector 
      selectedLanguage={language} 
      onLanguageChange={setLanguage}
    />
  );
}
