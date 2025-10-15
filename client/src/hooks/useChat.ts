import { useEffect, useRef, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { getSocket } from "@/lib/socket";
import { type Message } from "@shared/schema";
import { AudioRecorderService, AudioPlayerService } from "@/lib/audioRecorder";
import { FallbackSpeechRecognition, isFallbackSTTAvailable } from "@/lib/fallback-speech";
import { type LanguageCode } from "@/lib/languages";

export function useChat(userId: string, username: string, language: LanguageCode, roomId: string) {
  const socket = useRef(getSocket());
  const audioRecorder = useRef(new AudioRecorderService());
  const audioPlayer = useRef(new AudioPlayerService());
  const fallbackSTT = useRef<FallbackSpeechRecognition | null>(null);
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
  const [isPaused, setIsPaused] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [useFallbackSTT, setUseFallbackSTT] = useState(false);

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

    const handleAudioReceived = async (data: { messageId: string; audioData: string; language: string; mimeType: string }) => {
      console.log(`🔊 RECEIVED AUDIO from Gemini: ${data.audioData.length} chars for message ${data.messageId}`);
      try {
        await audioPlayer.current.playAudioFromBase64(data.audioData, data.mimeType);
      } catch (error) {
        console.error("Failed to play received audio:", error);
      }
    };

    const handleWhisperUnavailable = () => {
      console.log("🔄 Whisper API unavailable, checking for fallback STT...");
      if (isFallbackSTTAvailable()) {
        setUseFallbackSTT(true);
        console.log("✅ Browser STT available as fallback");
      } else {
        console.log("❌ No STT options available");
      }
    };

    s.on("connect", handleConnect);
    s.on("disconnect", handleDisconnect);
    s.on("messages:history", handleMessagesHistory);
    s.on("message:new", handleMessageNew);
    s.on("message:translated", handleMessageTranslated);
    s.on("user:typing", handleUserTyping);
    s.on("user:stop-typing", handleUserStopTyping);
    s.on("audio:received", handleAudioReceived);

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
      s.off("audio:received", handleAudioReceived);
      
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
    };
  }, [setConnectionStatus, setMessages, addMessage, addTranslation, setUserTyping, removeUserTyping]);

  // Update user info and notify server when language changes
  useEffect(() => {
    setUser({ id: userId, username, language });

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

  // Monitor audio level while recording
  useEffect(() => {
    if (!isRecording || isPaused) {
      setAudioLevel(0);
      return;
    }

    const monitorInterval = setInterval(() => {
      const level = audioRecorder.current.getAudioLevel();
      setAudioLevel(level);
    }, 100);

    return () => clearInterval(monitorInterval);
  }, [isRecording, isPaused]);

  const startVoiceInput = async () => {
    // Use Whisper-powered audio recording (server-side transcription)
    try {
      console.log(`🎤 WHISPER AUDIO RECORDING STARTED: Language ${language}`);
      await audioRecorder.current.startRecording();
      setIsRecording(true);
    } catch (error) {
      console.error("❌ Failed to start audio recording:", error);
      setIsRecording(false);
    }
  };

  const pauseVoiceInput = () => {
    audioRecorder.current.pauseRecording();
    setIsPaused(true);
    console.log('⏸️ Voice input paused');
  };

  const resumeVoiceInput = () => {
    audioRecorder.current.resumeRecording();
    setIsPaused(false);
    console.log('▶️ Voice input resumed');
  };

  const stopVoiceInput = async () => {
    // Stop Whisper audio recording and send to server
    try {
      const { audioBlob, mimeType } = await audioRecorder.current.stopRecording();
      console.log(`🛑 WHISPER AUDIO RECORDING STOPPED: ${audioBlob.size} bytes`);
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        if (base64Audio) {
          console.log(`📤 SENDING AUDIO to Whisper for transcription and translation...`);
          socket.current.emit("audio:send", {
            userId,
            roomId,
            audioData: base64Audio,
            originalLanguage: language,
            mimeType,
          });
        }
      };
      reader.readAsDataURL(audioBlob);
      
      setIsRecording(false);
      setIsPaused(false);
    } catch (error) {
      console.error("❌ Failed to stop audio recording:", error);
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const cancelVoiceInput = () => {
    audioRecorder.current.cancelRecording();
    setIsRecording(false);
    setIsPaused(false);
    console.log('❌ Voice input cancelled');
  };

  const playAudio = (text: string, languageCode: string) => {
    console.log(`🔊 PLAYING AUDIO: "${text.substring(0, 50)}..." in ${languageCode}`);
    // Audio playback functionality removed - server handles TTS now
  };

  const stopAudio = () => {
    // Audio stop functionality removed - server handles TTS now
  };

  return {
    sendMessage,
    notifyTyping,
    startVoiceInput,
    pauseVoiceInput,
    resumeVoiceInput,
    stopVoiceInput,
    cancelVoiceInput,
    playAudio,
    stopAudio,
    isRecording,
    isPaused,
    audioLevel,
  };
}
