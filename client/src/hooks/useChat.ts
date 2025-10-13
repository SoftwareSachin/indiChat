import { useEffect, useRef, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { getSocket } from "@/lib/socket";
import { type Message } from "@shared/schema";
import { SpeechRecognitionService, TextToSpeechService } from "@/lib/speech";
import { type LanguageCode } from "@/lib/languages";

export function useChat(userId: string, username: string, language: LanguageCode, roomId: string) {
  const socket = useRef(getSocket());
  const speechRecognition = useRef<SpeechRecognitionService | null>(null);
  const textToSpeech = useRef(new TextToSpeechService());
  const typingTimeout = useRef<NodeJS.Timeout>();
  const currentLanguageRef = useRef(language);
  const userIdRef = useRef(userId);
  const usernameRef = useRef(username);
  const roomIdRef = useRef(roomId);
  
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

  // Keep refs updated with latest values
  useEffect(() => {
    currentLanguageRef.current = language;
    userIdRef.current = userId;
    usernameRef.current = username;
    roomIdRef.current = roomId;
  }, [language, userId, username, roomId]);

  // Initialize socket listeners once
  useEffect(() => {
    const s = socket.current;

    const handleConnect = () => {
      setConnectionStatus("connected");
      s.emit("room:join", { 
        userId: userIdRef.current, 
        username: usernameRef.current, 
        language: currentLanguageRef.current,
        roomId: roomIdRef.current
      });
    };

    const handleDisconnect = () => {
      setConnectionStatus("disconnected");
    };

    const handleMessagesHistory = (messages: Message[]) => {
      setMessages(messages);
    };

    const handleMessageNew = (message: Message) => {
      addMessage(message);
    };

    const handleMessageTranslated = (data: { messageId: string; translatedContent: string; targetLanguage: string }) => {
      console.log(`📥 RECEIVED TRANSLATION from Gemini: "${data.translatedContent.substring(0, 50)}..." in ${data.targetLanguage}`);
      addTranslation(data.messageId, data.translatedContent, data.targetLanguage);
    };

    const handleUserTyping = (data: { userId: string; username: string }) => {
      setUserTyping(data.userId, data.username);
    };

    const handleUserStopTyping = (data: { userId: string }) => {
      removeUserTyping(data.userId);
    };

    s.on("connect", handleConnect);
    s.on("disconnect", handleDisconnect);
    s.on("messages:history", handleMessagesHistory);
    s.on("message:new", handleMessageNew);
    s.on("message:translated", handleMessageTranslated);
    s.on("user:typing", handleUserTyping);
    s.on("user:stop-typing", handleUserStopTyping);

    if (!s.connected) {
      setConnectionStatus("connecting");
      s.connect();
    }

    return () => {
      s.off("connect", handleConnect);
      s.off("disconnect", handleDisconnect);
      s.off("messages:history", handleMessagesHistory);
      s.off("message:new", handleMessageNew);
      s.off("message:translated", handleMessageTranslated);
      s.off("user:typing", handleUserTyping);
      s.off("user:stop-typing", handleUserStopTyping);
      
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
    };
  }, [setConnectionStatus, setMessages, addMessage, addTranslation, setUserTyping, removeUserTyping]);

  // Update user info and notify server when language changes
  useEffect(() => {
    setUser({ id: userId, username, language });
    
    // Initialize speech recognition with current language
    try {
      speechRecognition.current = new SpeechRecognitionService(language);
    } catch (error) {
      console.error("Speech recognition not available:", error);
    }

    // Notify server of language change if connected
    if (socket.current.connected) {
      socket.current.emit("user:language-change", { userId, language });
    }
  }, [userId, username, language, setUser]);

  const sendMessage = (content: string) => {
    socket.current.emit("message:send", {
      userId,
      roomId,
      content,
      originalLanguage: language,
    });
    
    // Stop typing indicator
    socket.current.emit("user:stop-typing", { userId, roomId });
  };

  const notifyTyping = () => {
    socket.current.emit("user:typing", { userId, username, roomId });
    
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    
    typingTimeout.current = setTimeout(() => {
      socket.current.emit("user:stop-typing", { userId, roomId });
    }, 2000);
  };

  const startVoiceInput = () => {
    if (!speechRecognition.current) {
      console.error("Speech recognition not available");
      return;
    }

    console.log(`🎤 VOICE INPUT STARTED: Language ${language}`);
    speechRecognition.current.setLanguage(language);
    speechRecognition.current.start(
      (text, isFinal) => {
        if (isFinal) {
          console.log(`✅ VOICE TRANSCRIBED: "${text}" in ${language}`);
          console.log(`📤 SENDING to server for Gemini translation...`);
          sendMessage(text);
          setInterimTranscript("");
          setIsRecording(false);
        } else {
          setInterimTranscript(text);
        }
      },
      (error) => {
        console.error("❌ Speech recognition error:", error);
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
    console.log(`🔊 PLAYING AUDIO: "${text.substring(0, 50)}..." in ${languageCode}`);
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
