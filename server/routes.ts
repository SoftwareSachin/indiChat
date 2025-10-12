import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketServer } from "socket.io";
import { storage } from "./storage";
import { translateText, detectLanguage } from "./services/gemini";
import { insertMessageSchema, insertUserSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const io = new SocketServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // REST API Routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  app.get("/api/messages", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const messages = await storage.getMessages(limit);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

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
  const connectedUsers = new Map<string, { id: string; username: string; language: string }>();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("user:join", async (data: { userId: string; username: string; language: string }) => {
      connectedUsers.set(socket.id, { id: data.userId, username: data.username, language: data.language });
      
      // Broadcast user joined
      io.emit("user:joined", {
        userId: data.userId,
        username: data.username,
      });

      // Send recent messages to new user
      const messages = await storage.getMessages(50);
      socket.emit("messages:history", messages);
    });

    socket.on("message:send", async (data: {
      userId: string;
      content: string;
      originalLanguage: string;
    }) => {
      try {
        // Create message
        const message = await storage.createMessage({
          userId: data.userId,
          content: data.content,
          originalLanguage: data.originalLanguage,
          translatedContent: null,
          targetLanguage: null,
        });

        // Broadcast to all users
        io.emit("message:new", message);

        // Translate for other users if needed
        const connectedUsersArray = Array.from(connectedUsers.entries());
        for (const [clientId, user] of connectedUsersArray) {
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

    socket.on("user:typing", (data: { userId: string; username: string }) => {
      socket.broadcast.emit("user:typing", data);
    });

    socket.on("user:stop-typing", (data: { userId: string }) => {
      socket.broadcast.emit("user:stop-typing", data);
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
        io.emit("user:left", {
          userId: user.id,
          username: user.username,
        });
      }
      console.log("User disconnected:", socket.id);
    });
  });

  return httpServer;
}
