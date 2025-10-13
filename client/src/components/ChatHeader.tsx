import { MessageSquare } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSelector } from "./LanguageSelector";
import { ConnectionStatus } from "./ConnectionStatus";
import { type LanguageCode } from "@/lib/languages";

type ConnectionState = 'connected' | 'connecting' | 'disconnected';

interface ChatHeaderProps {
  connectionStatus: ConnectionState;
  selectedLanguage: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
}

export function ChatHeader({ connectionStatus, selectedLanguage, onLanguageChange }: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 border-b bg-card">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">Xchat</h1>
        </div>
        <ConnectionStatus status={connectionStatus} />
      </div>
      
      <div className="flex items-center gap-2">
        <LanguageSelector 
          selectedLanguage={selectedLanguage}
          onLanguageChange={onLanguageChange}
        />
        <ThemeToggle />
      </div>
    </header>
  );
}
