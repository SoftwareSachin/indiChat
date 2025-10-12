import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketServer } from "socket.io";
import { storage } from "./storage";
import { translateText, detectLanguage } from "./services/gemini";
import { insertMessageSchema, insertUserSchema, loginSchema, insertRoomSchema } from "@shared/schema";
import { generateToken, comparePassword, authMiddleware } from "./auth";
import crypto from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const io = new SocketServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Authentication Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const user = await storage.createUser(userData);
      const token = generateToken({ userId: user.id, username: user.username });
      
      res.json({ 
        user: { id: user.id, username: user.username, preferredLanguage: user.preferredLanguage },
        token 
      });
    } catch (error) {
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(credentials.username);
      
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await comparePassword(credentials.password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = generateToken({ userId: user.id, username: user.username });
      res.json({ 
        user: { id: user.id, username: user.username, preferredLanguage: user.preferredLanguage },
        token 
      });
    } catch (error) {
      res.status(400).json({ error: "Invalid credentials" });
    }
  });

  // Room Routes
  app.post("/api/rooms", authMiddleware, async (req, res) => {
    try {
      const roomData = insertRoomSchema.parse(req.body);
      const inviteCode = crypto.randomBytes(6).toString('hex');
      
      const room = await storage.createRoom({
        ...roomData,
        createdBy: (req as any).user.userId,
        inviteCode,
      });
      
      res.json(room);
    } catch (error) {
      res.status(400).json({ error: "Failed to create room" });
    }
  });

  app.post("/api/rooms/join/:inviteCode", authMiddleware, async (req, res) => {
    try {
      const room = await storage.getRoomByInviteCode(req.params.inviteCode);
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }
      
      const userId = (req as any).user.userId;
      await storage.addRoomMember(room.id, userId);
      
      res.json(room);
    } catch (error) {
      res.status(500).json({ error: "Failed to join room" });
    }
  });

  app.get("/api/rooms/:roomId/messages", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      const isMember = await storage.isRoomMember(req.params.roomId, userId);
      
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this room" });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const messages = await storage.getMessagesByRoom(req.params.roomId, limit);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.get("/api/my-rooms", authMiddleware, async (req, res) => {
    try {
      const rooms = await storage.getRoomsByUser((req as any).user.userId);
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rooms" });
    }
  });

  // Translation Routes
  app.post("/api/translate", async (req, res) => {
    try {
      const { text, sourceLang, targetLang } = req.body;
      const translated = await translateText(text, sourceLang, targetLang);
      res.json({ translated });
    } catch (error) {
      res.status(500).json({ error: "Translation failed" });
    }
  });

  app.post("/api/detect-language", async (req, res) => {
    try {
      const { text } = req.body;
      const language = await detectLanguage(text);
      res.json({ language });
    } catch (error) {
      res.status(500).json({ error: "Language detection failed" });
    }
  });

  // WebSocket handlers
  const connectedUsers = new Map<string, { 
    id: string; 
    username: string; 
    language: string; 
    roomId: string;
  }>();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("room:join", async (data: { 
      userId: string; 
      username: string; 
      language: string; 
      roomId: string;
    }) => {
      connectedUsers.set(socket.id, { 
        id: data.userId, 
        username: data.username, 
        language: data.language,
        roomId: data.roomId 
      });
      
      socket.join(data.roomId);
      
      io.to(data.roomId).emit("user:joined", {
        userId: data.userId,
        username: data.username,
      });

      const messages = await storage.getMessagesByRoom(data.roomId, 50);
      socket.emit("messages:history", messages);
    });

    socket.on("message:send", async (data: {
      userId: string;
      roomId: string;
      content: string;
      originalLanguage: string;
    }) => {
      try {
        const message = await storage.createMessage({
          userId: data.userId,
          roomId: data.roomId,
          content: data.content,
          originalLanguage: data.originalLanguage,
          translatedContent: null,
          targetLanguage: null,
        });

        io.to(data.roomId).emit("message:new", message);

        const roomUsers = Array.from(connectedUsers.entries())
          .filter(([_, user]) => user.roomId === data.roomId);
        
        for (const [clientId, user] of roomUsers) {
          if (user.language !== data.originalLanguage) {
            try {
              const translated = await translateText(
                data.content,
                data.originalLanguage,
                user.language
              );

              io.to(clientId).emit("message:translated", {
                messageId: message.id,
                translatedContent: translated,
                targetLanguage: user.language,
              });
            } catch (error) {
              console.error("Translation error for user:", user.username, error);
            }
          }
        }
      } catch (error) {
        console.error("Message send error:", error);
        socket.emit("message:error", { error: "Failed to send message" });
      }
    });

    socket.on("user:typing", (data: { userId: string; username: string; roomId: string }) => {
      socket.to(data.roomId).emit("user:typing", data);
    });

    socket.on("user:stop-typing", (data: { userId: string; roomId: string }) => {
      socket.to(data.roomId).emit("user:stop-typing", data);
    });

    socket.on("user:language-change", (data: { userId: string; language: string }) => {
      const user = connectedUsers.get(socket.id);
      if (user) {
        user.language = data.language;
        connectedUsers.set(socket.id, user);
      }
    });

    socket.on("disconnect", () => {
      const user = connectedUsers.get(socket.id);
      if (user) {
        connectedUsers.delete(socket.id);
        io.to(user.roomId).emit("user:left", {
          userId: user.id,
          username: user.username,
        });
      }
      console.log("User disconnected:", socket.id);
    });
  });

  return httpServer;
}
