import { type User, type InsertUser, type Message, type InsertMessage, users, messages } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

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

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      username: insertUser.username,
      preferredLanguage: insertUser.preferredLanguage || 'en'
    }).returning();
    return user;
  }

  async updateUserLanguage(id: string, language: string): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ preferredLanguage: language })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values({
      userId: insertMessage.userId,
      content: insertMessage.content,
      translatedContent: insertMessage.translatedContent || null,
      originalLanguage: insertMessage.originalLanguage,
      targetLanguage: insertMessage.targetLanguage || null,
    }).returning();
    return message;
  }

  async getMessages(limit: number = 50): Promise<Message[]> {
    const result = await db.select()
      .from(messages)
      .orderBy(desc(messages.timestamp))
      .limit(limit);
    
    return result.reverse();
  }

  async getMessagesByUser(userId: string): Promise<Message[]> {
    return await db.select()
      .from(messages)
      .where(eq(messages.userId, userId))
      .orderBy(messages.timestamp);
  }
}

export const storage = new DbStorage();
