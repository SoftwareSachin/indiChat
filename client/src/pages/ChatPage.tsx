import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { ChatHeader } from "@/components/ChatHeader";
import { MessageBubble } from "@/components/MessageBubble";
import { MessageInput } from "@/components/MessageInput";
import { AudioRecorder } from "@/components/AudioRecorder";
import { TranslationIndicator } from "@/components/TranslationIndicator";
import { TypingIndicator } from "@/components/TypingIndicator";
import { RecordingIndicator } from "@/components/RecordingIndicator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/store/chatStore";
import { useChat } from "@/hooks/useChat";
import { type LanguageCode, getLanguageName } from "@/lib/languages";
import { ArrowLeft, Menu } from "lucide-react";
import { AuthManager } from "@/lib/auth-manager";
import { useToast } from "@/hooks/use-toast";
import { AppSidebar } from "@/components/AppSidebar";

export default function ChatPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const roomId = params.roomId as string;
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [showSidebar, setShowSidebar] = useState(false);
  
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  
  useEffect(() => {
    if (!token || !userStr) {
      setLocation("/auth");
      return;
    }

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

  const { messages, connectionStatus, typingUsers, recordingUsers, translatedMessages } = useChatStore();
  
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
  const recordingUsersList = Array.from(recordingUsers.values());

  if (!currentUser) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      {showSidebar && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSidebar(false)} />
          <div className="absolute inset-y-0 left-0 w-64">
            <AppSidebar />
          </div>
        </div>
      )}

      <div className="hidden lg:block">
        <AppSidebar />
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-surface dark:bg-surface border-b border-outline-variant">
          <div className="flex items-center gap-2 px-4 py-3.5">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/rooms")}
              className="h-9 w-9 lg:hidden"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSidebar(true)}
              className="h-9 w-9 lg:hidden"
              data-testid="button-menu"
            >
              <Menu className="w-5 h-5" />
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

        <ScrollArea className="flex-1 bg-background dark:bg-background">
          <div ref={scrollRef} className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[500px]">
                <div className="text-center space-y-4 max-w-sm">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-surface dark:bg-surface-container flex items-center justify-center border border-outline-variant">
                    <svg 
                      className="w-8 h-8 text-on-surface-variant" 
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
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-on-surface">No messages yet</h3>
                    <p className="text-sm text-on-surface-variant">
                      Start a conversation in {getLanguageName(selectedLanguage)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message) => {
                const translation = translatedMessages.get(message.id);
                const isSent = message.userId === currentUser.id;
                
                return (
                  <MessageBubble
                    key={message.id}
                    content={translation?.content || message.content}
                    isSent={isSent}
                    timestamp={new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    translatedFrom={translation ? message.originalLanguage : undefined}
                    originalContent={translation ? message.content : undefined}
                    onPlayAudio={() => handlePlayAudio(message.id)}
                  />
                );
              })
            )}
            
            {isTranslating && <TranslationIndicator isTranslating={isTranslating} />}
            {typingUsersList.length > 0 && (
              <TypingIndicator userName={typingUsersList[0]} />
            )}
            {recordingUsersList.length > 0 && (
              <RecordingIndicator userName={recordingUsersList[0]} />
            )}
          </div>
        </ScrollArea>

        {isRecording && (
          <div className="bg-surface dark:bg-surface-container border-t border-outline-variant px-4 md:px-6 py-4">
            <div className="max-w-5xl mx-auto">
              <AudioRecorder
                isRecording={isRecording}
                isPaused={isPaused}
                onStart={startVoiceInput}
                onPause={pauseVoiceInput}
                onResume={resumeVoiceInput}
                onStop={stopVoiceInput}
                onCancel={cancelVoiceInput}
                language={getLanguageName(selectedLanguage)}
                audioLevel={audioLevel}
              />
            </div>
          </div>
        )}

        <div className="bg-surface dark:bg-surface border-t border-outline-variant">
          <div className="max-w-5xl mx-auto px-4 md:px-6 py-3.5">
            <MessageInput
              onSendMessage={handleSendMessage}
              onStartVoiceInput={startVoiceInput}
              onStopVoiceInput={stopVoiceInput}
              isRecording={isRecording}
              placeholder={`Type a message in ${getLanguageName(selectedLanguage)}...`}
              onTyping={notifyTyping}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
