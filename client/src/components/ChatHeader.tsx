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
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <svg 
            className="w-5 h-5 text-primary" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
            />
          </svg>
          <h1 className="text-lg font-semibold text-on-surface">XChat</h1>
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
