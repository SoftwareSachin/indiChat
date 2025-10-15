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
import { ArrowLeft, Menu, MessageSquare } from "lucide-react";
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
    <div className="flex h-screen bg-background">
      {/* Sidebar for mobile */}
      {showSidebar && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSidebar(false)} />
          <div className="absolute inset-y-0 left-0 w-64">
            <AppSidebar />
          </div>
        </div>
      )}

      {/* Sidebar for desktop */}
      <div className="hidden lg:block">
        <AppSidebar />
      </div>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-surface border-b border-outline-variant">
          <div className="flex items-center gap-2 px-3 py-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/rooms")}
              className="icon-button lg:hidden"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSidebar(true)}
              className="icon-button lg:hidden"
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

        {/* Messages Area */}
        <ScrollArea className="flex-1 bg-surface-container-low">
          <div ref={scrollRef} className="p-6 space-y-6 max-w-5xl mx-auto">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[500px]">
                <div className="text-center space-y-4 max-w-sm">
                  <div className="w-20 h-20 mx-auto rounded-full bg-surface-container-high flex items-center justify-center">
                    <MessageSquare className="w-10 h-10 text-on-surface-variant" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="headline-small text-on-surface">No messages yet</h3>
                    <p className="body-large text-on-surface-variant">
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
          </div>
        </ScrollArea>

        {/* Audio Recorder (when active) */}
        {isRecording && (
          <div className="bg-surface-container border-t border-outline-variant px-6 py-4">
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

        {/* Message Input */}
        <div className="bg-surface border-t border-outline-variant">
          <div className="max-w-5xl mx-auto px-6 py-4">
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
