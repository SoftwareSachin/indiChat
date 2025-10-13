import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { ChatHeader } from "@/components/ChatHeader";
import { MessageBubble } from "@/components/MessageBubble";
import { MessageInput } from "@/components/MessageInput";
import { AudioRecorder } from "@/components/AudioRecorder";
import { TranslationIndicator } from "@/components/TranslationIndicator";
import { TypingIndicator } from "@/components/TypingIndicator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/store/chatStore";
import { useChat } from "@/hooks/useChat";
import { type LanguageCode, getLanguageName } from "@/lib/languages";
import { ArrowLeft } from "lucide-react";
import { AuthManager } from "@/lib/auth-manager";
import { useToast } from "@/hooks/use-toast";

export default function ChatPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const roomId = params.roomId as string;
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  
  useEffect(() => {
    if (!token || !userStr) {
      setLocation("/auth");
      return;
    }

    // Listen for session changes from other tabs
    const authManager = AuthManager.getInstance();
    authManager.startListening(() => {
      toast({
        title: "Session replaced",
        description: "Another user logged in from a different tab. Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        authManager.clearAuth();
        setLocation("/auth");
      }, 2000);
    });

    return () => {
      authManager.stopListening();
    };
  }, [token, userStr, setLocation]);

  const currentUser = userStr ? JSON.parse(userStr) : null;
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(
    currentUser?.preferredLanguage || 'en'
  );

  const { messages, connectionStatus, typingUsers, translatedMessages } = useChatStore();
  
  const {
    sendMessage,
    notifyTyping,
    startVoiceInput,
    pauseVoiceInput,
    resumeVoiceInput,
    stopVoiceInput,
    cancelVoiceInput,
    playAudio,
    isRecording,
    isPaused,
    interimTranscript,
    audioLevel,
  } = useChat(
    currentUser?.id || "",
    currentUser?.username || "",
    selectedLanguage,
    roomId
  );

  const [isTranslating, setIsTranslating] = useState(false);

  const handleSendMessage = (content: string) => {
    sendMessage(content);
  };

  const handleLanguageChange = (newLang: LanguageCode) => {
    setSelectedLanguage(newLang);
  };

  const handlePlayAudio = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    const translation = translatedMessages.get(messageId);
    if (translation) {
      playAudio(translation.content, translation.language);
    } else {
      playAudio(message.content, message.originalLanguage);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const typingUsersList = Array.from(typingUsers.values());

  if (!currentUser) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b bg-card">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/rooms")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <ChatHeader
              connectionStatus={connectionStatus}
              selectedLanguage={selectedLanguage}
              onLanguageChange={handleLanguageChange}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-background">
        <ScrollArea className="h-full">
          <div ref={scrollRef} className="p-4 space-y-4">
            {messages.map((message) => {
              const isSent = message.userId === currentUser.id;
              const translation = translatedMessages.get(message.id);
              const displayContent = translation?.content || message.content;
              const translatedFrom = translation ? getLanguageName(message.originalLanguage) : undefined;

              return (
                <MessageBubble
                  key={message.id}
                  content={displayContent}
                  isSent={isSent}
                  timestamp={new Date(message.timestamp).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                  status="delivered"
                  translatedFrom={translatedFrom}
                  userName={isSent ? undefined : `User ${message.userId.slice(-4)}`}
                  onPlayAudio={() => handlePlayAudio(message.id)}
                />
              );
            })}

            {isTranslating && <TranslationIndicator isTranslating={true} />}
            
            {typingUsersList.map((username) => (
              <TypingIndicator key={username} userName={username} />
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="px-4 pb-4">
        <AudioRecorder
          isRecording={isRecording}
          isPaused={isPaused}
          onStart={startVoiceInput}
          onPause={pauseVoiceInput}
          onResume={resumeVoiceInput}
          onStop={stopVoiceInput}
          onCancel={cancelVoiceInput}
          interimTranscript={interimTranscript}
          language={getLanguageName(selectedLanguage)}
          audioLevel={audioLevel}
        />
      </div>

      <MessageInput
        onSendMessage={handleSendMessage}
        placeholder={`Type a message in ${getLanguageName(selectedLanguage)}...`}
        onTyping={notifyTyping}
      />
    </div>
  );
}
