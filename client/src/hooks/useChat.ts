import { useEffect, useRef, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { getSocket } from "@/lib/socket";
import { type Message } from "@shared/schema";
import { SpeechRecognitionService, TextToSpeechService } from "@/lib/speech";
import { type LanguageCode } from "@/lib/languages";

export function useChat(userId: string, username: string, language: LanguageCode) {
  const socket = useRef(getSocket());
  const speechRecognition = useRef<SpeechRecognitionService | null>(null);
  const textToSpeech = useRef(new TextToSpeechService());
  const typingTimeout = useRef<NodeJS.Timeout>();
  
  const {
    setConnectionStatus,
    addMessage,
    setMessages,
    addTranslation,
    setUserTyping,
    removeUserTyping,
    setUser,
  } = useChatStore();

  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");

  useEffect(() => {
    setUser({ id: userId, username, language });

    // Initialize speech recognition
    try {
      speechRecognition.current = new SpeechRecognitionService(language);
    } catch (error) {
      console.error("Speech recognition not available:", error);
    }

    // WebSocket event listeners
    const s = socket.current;

    s.on("connect", () => {
      setConnectionStatus("connected");
      s.emit("user:join", { userId, username, language });
    });

    s.on("disconnect", () => {
      setConnectionStatus("disconnected");
    });

    s.on("messages:history", (messages: Message[]) => {
      setMessages(messages);
    });

    s.on("message:new", (message: Message) => {
      addMessage(message);
    });

    s.on("message:translated", (data: { messageId: string; translatedContent: string; targetLanguage: string }) => {
      addTranslation(data.messageId, data.translatedContent, data.targetLanguage);
    });

    s.on("user:typing", (data: { userId: string; username: string }) => {
      setUserTyping(data.userId, data.username);
    });

    s.on("user:stop-typing", (data: { userId: string }) => {
      removeUserTyping(data.userId);
    });

    if (!s.connected) {
      setConnectionStatus("connecting");
      s.connect();
    }

    return () => {
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
    };
  }, [userId, username, language]);

  const sendMessage = (content: string) => {
    socket.current.emit("message:send", {
      userId,
      content,
      originalLanguage: language,
    });
    
    // Stop typing indicator
    socket.current.emit("user:stop-typing", { userId });
  };

  const notifyTyping = () => {
    socket.current.emit("user:typing", { userId, username });
    
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    
    typingTimeout.current = setTimeout(() => {
      socket.current.emit("user:stop-typing", { userId });
    }, 2000);
  };

  const startVoiceInput = () => {
    if (!speechRecognition.current) {
      console.error("Speech recognition not available");
      return;
    }

    speechRecognition.current.setLanguage(language);
    speechRecognition.current.start(
      (text, isFinal) => {
        if (isFinal) {
          sendMessage(text);
          setInterimTranscript("");
          setIsRecording(false);
        } else {
          setInterimTranscript(text);
        }
      },
      (error) => {
        console.error("Speech recognition error:", error);
        setIsRecording(false);
      }
    );
    
    setIsRecording(true);
  };

  const stopVoiceInput = () => {
    speechRecognition.current?.stop();
    setIsRecording(false);
    setInterimTranscript("");
  };

  const playAudio = (text: string, languageCode: string) => {
    textToSpeech.current.speak(text, languageCode);
  };

  const stopAudio = () => {
    textToSpeech.current.stop();
  };

  return {
    sendMessage,
    notifyTyping,
    startVoiceInput,
    stopVoiceInput,
    playAudio,
    stopAudio,
    isRecording,
    interimTranscript,
  };
}
