import { ChatHeader } from "../ChatHeader";
import { ThemeProvider } from "@/lib/theme-provider";
import { useState } from "react";
import { type LanguageCode } from "@/lib/languages";

export default function ChatHeaderExample() {
  const [language, setLanguage] = useState<LanguageCode>('en');
  
  return (
    <ThemeProvider>
      <ChatHeader
        connectionStatus="connected"
        selectedLanguage={language}
        onLanguageChange={setLanguage}
      />
    </ThemeProvider>
  );
}
