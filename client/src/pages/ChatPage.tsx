import { useState, useEffect, useRef } from "react";
import { ChatHeader } from "@/components/ChatHeader";
import { MessageBubble } from "@/components/MessageBubble";
import { MessageInput } from "@/components/MessageInput";
import { TranslationIndicator } from "@/components/TranslationIndicator";
import { TypingIndicator } from "@/components/TypingIndicator";
import { VoiceWaveform } from "@/components/VoiceWaveform";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type LanguageCode } from "@/lib/languages";
import { Card } from "@/components/ui/card";

type ConnectionState = 'connected' | 'connecting' | 'disconnected';
type MessageStatus = 'sending' | 'sent' | 'delivered' | 'failed';

interface Message {
  id: string;
  content: string;
  isSent: boolean;
  timestamp: string;
  status?: MessageStatus;
  translatedFrom?: string;
  userName?: string;
}

export default function ChatPage() {
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>('connected');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  //todo: remove mock functionality
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Welcome to BharatChat! Start chatting in your preferred language.',
      isSent: false,
      timestamp: '10:00 AM',
      userName: 'System',
    },
  ]);

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      isSent: true,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: 'delivered',
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    //todo: remove mock functionality - simulate translation
    setIsTranslating(true);
    setTimeout(() => {
      setIsTranslating(false);
    }, 1000);

    //todo: remove mock functionality - simulate typing
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const response: Message = {
          id: (Date.now() + 1).toString(),
          content: 'Message received and translated successfully!',
          isSent: false,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          userName: 'User',
          translatedFrom: selectedLanguage !== 'en' ? 'Hindi' : undefined,
        };
        setMessages(prev => [...prev, response]);
      }, 1500);
    }, 1500);
  };

  const handleStartVoiceInput = () => {
    setIsRecording(true);
    console.log('Voice recording started');
  };

  const handleStopVoiceInput = () => {
    setIsRecording(false);
    console.log('Voice recording stopped');
  };

  const handlePlayAudio = (messageId: string) => {
    console.log('Play audio for message:', messageId);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-screen">
      <ChatHeader
        connectionStatus={connectionStatus}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
      />

      <div className="flex-1 overflow-hidden bg-background">
        <ScrollArea className="h-full">
          <div ref={scrollRef} className="p-4 space-y-4">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                content={message.content}
                isSent={message.isSent}
                timestamp={message.timestamp}
                status={message.status}
                translatedFrom={message.translatedFrom}
                userName={message.userName}
                onPlayAudio={message.translatedFrom ? () => handlePlayAudio(message.id) : undefined}
              />
            ))}

            {isTranslating && <TranslationIndicator isTranslating={true} />}
            {isTyping && <TypingIndicator userName="User" />}
          </div>
        </ScrollArea>
      </div>

      {isRecording && (
        <Card className="mx-4 mb-2 p-4">
          <VoiceWaveform isActive={isRecording} />
          <p className="text-sm text-center text-muted-foreground mt-2">
            Recording in {selectedLanguage === 'en' ? 'English' : 'your language'}...
          </p>
        </Card>
      )}

      <MessageInput
        onSendMessage={handleSendMessage}
        onStartVoiceInput={handleStartVoiceInput}
        onStopVoiceInput={handleStopVoiceInput}
        isRecording={isRecording}
        placeholder={`Type a message in ${selectedLanguage === 'en' ? 'English' : 'your language'}...`}
      />
    </div>
  );
}
