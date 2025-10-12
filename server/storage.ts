import { type User, type InsertUser, type Message, type InsertMessage, type ChatRoom, type InsertRoom, type RoomMember, users, messages, chatRooms, roomMembers } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import { hashPassword } from "./auth";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLanguage(id: string, language: string): Promise<User | undefined>;
  
  // Message methods
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByRoom(roomId: string, limit?: number): Promise<Message[]>;
  getMessagesByUser(userId: string): Promise<Message[]>;
  
  // Room methods
  createRoom(room: InsertRoom & { createdBy: string; inviteCode: string }): Promise<ChatRoom>;
  getRoom(id: string): Promise<ChatRoom | undefined>;
  getRoomByInviteCode(inviteCode: string): Promise<ChatRoom | undefined>;
  getRoomsByUser(userId: string): Promise<ChatRoom[]>;
  
  // Room membership methods
  addRoomMember(roomId: string, userId: string): Promise<RoomMember>;
  isRoomMember(roomId: string, userId: string): Promise<boolean>;
  getRoomMembers(roomId: string): Promise<RoomMember[]>;
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
    const hashedPassword = await hashPassword(insertUser.password);
    const [user] = await db.insert(users).values({
      username: insertUser.username,
      password: hashedPassword,
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
      roomId: insertMessage.roomId,
      content: insertMessage.content,
      translatedContent: insertMessage.translatedContent || null,
      originalLanguage: insertMessage.originalLanguage,
      targetLanguage: insertMessage.targetLanguage || null,
    }).returning();
    return message;
  }

  async getMessagesByRoom(roomId: string, limit: number = 50): Promise<Message[]> {
    const result = await db.select()
      .from(messages)
      .where(eq(messages.roomId, roomId))
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

  async createRoom(room: InsertRoom & { createdBy: string; inviteCode: string }): Promise<ChatRoom> {
    const [chatRoom] = await db.insert(chatRooms).values({
      name: room.name,
      inviteCode: room.inviteCode,
      createdBy: room.createdBy,
      isPrivate: room.isPrivate ?? true,
    }).returning();
    
    await this.addRoomMember(chatRoom.id, room.createdBy);
    return chatRoom;
  }

  async getRoom(id: string): Promise<ChatRoom | undefined> {
    const [room] = await db.select().from(chatRooms).where(eq(chatRooms.id, id)).limit(1);
    return room;
  }

  async getRoomByInviteCode(inviteCode: string): Promise<ChatRoom | undefined> {
    const [room] = await db.select().from(chatRooms).where(eq(chatRooms.inviteCode, inviteCode)).limit(1);
    return room;
  }

  async getRoomsByUser(userId: string): Promise<ChatRoom[]> {
    const memberRooms = await db
      .select({ room: chatRooms })
      .from(roomMembers)
      .innerJoin(chatRooms, eq(roomMembers.roomId, chatRooms.id))
      .where(eq(roomMembers.userId, userId));
    
    return memberRooms.map(r => r.room);
  }

  async addRoomMember(roomId: string, userId: string): Promise<RoomMember> {
    const existing = await db
      .select()
      .from(roomMembers)
      .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)))
      .limit(1);
    
    if (existing.length > 0) {
      return existing[0];
    }

    const [member] = await db.insert(roomMembers).values({
      roomId,
      userId,
    }).returning();
    return member;
  }

  async isRoomMember(roomId: string, userId: string): Promise<boolean> {
    const [member] = await db
      .select()
      .from(roomMembers)
      .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)))
      .limit(1);
    
    return !!member;
  }

  async getRoomMembers(roomId: string): Promise<RoomMember[]> {
    return await db.select().from(roomMembers).where(eq(roomMembers.roomId, roomId));
  }
}

export const storage = new DbStorage();
