import { create } from "zustand";
import { type Message } from "@shared/schema";
import { type LanguageCode } from "@/lib/languages";

type ConnectionState = 'connected' | 'connecting' | 'disconnected';

interface ChatUser {
  id: string;
  username: string;
  language: LanguageCode;
}

interface UserStatus {
  userId: string;
  username: string;
  isOnline: boolean;
  lastSeen?: Date | string;
}

interface ChatState {
  user: ChatUser | null;
  messages: Message[];
  connectionStatus: ConnectionState;
  isTyping: boolean;
  typingUsers: Map<string, string>;
  recordingUsers: Map<string, string>;
  userStatuses: Map<string, UserStatus>;
  translatedMessages: Map<string, { content: string; language: string }>;
  
  // Actions
  setUser: (user: ChatUser) => void;
  setConnectionStatus: (status: ConnectionState) => void;
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  addTranslation: (messageId: string, content: string, language: string) => void;
  setUserTyping: (userId: string, username: string) => void;
  removeUserTyping: (userId: string) => void;
  setUserRecording: (userId: string, username: string) => void;
  removeUserRecording: (userId: string) => void;
  setUserStatus: (userId: string, username: string, isOnline: boolean, lastSeen?: Date | string) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  user: null,
  messages: [],
  connectionStatus: 'connecting',
  isTyping: false,
  typingUsers: new Map(),
  recordingUsers: new Map(),
  userStatuses: new Map(),
  translatedMessages: new Map(),

  setUser: (user) => set({ user }),
  
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),
  
  setMessages: (messages) => set({ messages }),
  
  addTranslation: (messageId, content, language) => set((state) => {
    const newTranslations = new Map(state.translatedMessages);
    newTranslations.set(messageId, { content, language });
    return { translatedMessages: newTranslations };
  }),
  
  setUserTyping: (userId, username) => set((state) => {
    const newTypingUsers = new Map(state.typingUsers);
    newTypingUsers.set(userId, username);
    return { typingUsers: newTypingUsers };
  }),
  
  removeUserTyping: (userId) => set((state) => {
    const newTypingUsers = new Map(state.typingUsers);
    newTypingUsers.delete(userId);
    return { typingUsers: newTypingUsers };
  }),

  setUserRecording: (userId, username) => set((state) => {
    const newRecordingUsers = new Map(state.recordingUsers);
    newRecordingUsers.set(userId, username);
    return { recordingUsers: newRecordingUsers };
  }),
  
  removeUserRecording: (userId) => set((state) => {
    const newRecordingUsers = new Map(state.recordingUsers);
    newRecordingUsers.delete(userId);
    return { recordingUsers: newRecordingUsers };
  }),

  setUserStatus: (userId, username, isOnline, lastSeen) => set((state) => {
    const newUserStatuses = new Map(state.userStatuses);
    newUserStatuses.set(userId, { userId, username, isOnline, lastSeen });
    return { userStatuses: newUserStatuses };
  }),
  
  clearMessages: () => set({ messages: [] }),
}));
