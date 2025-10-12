import { type User, type InsertUser, type Message, type InsertMessage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLanguage(id: string, language: string): Promise<User | undefined>;
  
  // Message methods
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(limit?: number): Promise<Message[]>;
  getMessagesByUser(userId: string): Promise<Message[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private messages: Map<string, Message>;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      preferredLanguage: insertUser.preferredLanguage || 'en'
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserLanguage(id: string, language: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      user.preferredLanguage = language;
      this.users.set(id, user);
      return user;
    }
    return undefined;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      id,
      userId: insertMessage.userId,
      content: insertMessage.content,
      translatedContent: insertMessage.translatedContent || null,
      originalLanguage: insertMessage.originalLanguage,
      targetLanguage: insertMessage.targetLanguage || null,
      timestamp: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessages(limit: number = 50): Promise<Message[]> {
    const messages = Array.from(this.messages.values());
    messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    return messages.slice(-limit);
  }

  async getMessagesByUser(userId: string): Promise<Message[]> {
    const messages = Array.from(this.messages.values()).filter(
      (msg) => msg.userId === userId
    );
    messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    return messages;
  }
}

export const storage = new MemStorage();
