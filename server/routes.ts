import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketServer } from "socket.io";
import { storage } from "./storage";
import { translateText, detectLanguage, generateSpeech } from "./services/gemini";
import { transcribeSpeech } from "./services/whisper";
import { insertMessageSchema, insertUserSchema, loginSchema, insertRoomSchema } from "@shared/schema";
import { generateToken, comparePassword, authMiddleware } from "./auth";
import crypto from "crypto";
import multer from "multer";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

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
      console.error("Registration error:", error);
      const errorMessage = error instanceof Error ? error.message : "Invalid user data";
      res.status(400).json({ error: errorMessage });
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

  // Audio Routes
  app.post("/api/transcribe-audio", authMiddleware, upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No audio file provided" });
      }

      const { language } = req.body;
      const mimeType = req.file.mimetype;
      
      console.log(`📤 Received audio for transcription: ${req.file.size} bytes, ${mimeType}, language: ${language}`);

      const transcribedText = await transcribeSpeech(req.file.buffer, language, mimeType);
      
      res.json({ text: transcribedText });
    } catch (error) {
      console.error("Transcription error:", error);
      res.status(500).json({ error: "Audio transcription failed" });
    }
  });

  app.post("/api/generate-audio", authMiddleware, async (req, res) => {
    try {
      const { text, language } = req.body;
      
      if (!text || !language) {
        return res.status(400).json({ error: "Text and language are required" });
      }

      console.log(`🔊 Generating audio for: "${text.substring(0, 50)}..." in ${language}`);

      const audioBuffer = await generateSpeech(text, language);
      
      // Send audio as base64 for easy frontend handling
      res.json({ 
        audio: audioBuffer.toString('base64'),
        mimeType: 'audio/pcm;rate=24000'
      });
    } catch (error) {
      console.error("Audio generation error:", error);
      res.status(500).json({ error: "Audio generation failed" });
    }
  });

  // User Profile Routes
  app.get("/api/user/profile", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.patch("/api/user/update", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      const { username, preferredLanguage, bio } = req.body;
      
      const updateData: any = {};
      if (username) updateData.username = username;
      if (preferredLanguage) updateData.preferredLanguage = preferredLanguage;
      if (bio !== undefined) updateData.bio = bio;

      const user = await storage.updateUser(userId, updateData);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.post("/api/user/upload-profile-image", authMiddleware, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const userId = (req as any).user.userId;
      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      
      const user = await storage.updateUser(userId, { profileImage: base64Image });
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ profileImage: user.profileImage });
    } catch (error) {
      console.error("Profile image upload error:", error);
      res.status(500).json({ error: "Failed to upload profile image" });
    }
  });

  // Notification Routes
  app.get("/api/notifications", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      const notifications = await storage.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread-count", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  });

  app.patch("/api/notifications/:id/read", authMiddleware, async (req, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/mark-all-read", authMiddleware, async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark all notifications as read" });
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
      const isMember = await storage.isRoomMember(data.roomId, data.userId);
      
      if (!isMember) {
        socket.emit("error", { message: "Not authorized to join this room" });
        return;
      }
      
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
        const isMember = await storage.isRoomMember(data.roomId, data.userId);
        
        if (!isMember) {
          socket.emit("message:error", { error: "Not authorized to send messages in this room" });
          return;
        }
        
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

    socket.on("audio:send", async (data: {
      userId: string;
      roomId: string;
      audioData: string; // base64 encoded audio
      originalLanguage: string;
      mimeType: string;
    }) => {
      try {
        const isMember = await storage.isRoomMember(data.roomId, data.userId);
        
        if (!isMember) {
          socket.emit("message:error", { error: "Not authorized to send messages in this room" });
          return;
        }

        console.log(`🎤 Received audio message from ${data.userId} in ${data.originalLanguage}`);

        // Transcribe audio using Whisper
        const audioBuffer = Buffer.from(data.audioData, 'base64');
        let transcribedText;
        
        try {
          transcribedText = await transcribeSpeech(audioBuffer, data.originalLanguage, data.mimeType);
        } catch (error) {
          console.error("Whisper transcription failed, using fallback message:", error);
          // Fallback message when Whisper fails
          transcribedText = `[Audio message in ${data.originalLanguage} - Transcription temporarily unavailable due to network issues. Please check your connection or try again later.]`;
        }

        // Save the transcribed message
        const message = await storage.createMessage({
          userId: data.userId,
          roomId: data.roomId,
          content: transcribedText,
          originalLanguage: data.originalLanguage,
          translatedContent: null,
          targetLanguage: null,
        });

        io.to(data.roomId).emit("message:new", message);

        const roomUsers = Array.from(connectedUsers.entries())
          .filter(([_, user]) => user.roomId === data.roomId);
        
        // Translate and generate audio for each user
        for (const [clientId, user] of roomUsers) {
          try {
            let textToSpeak = transcribedText;
            
            // Translate if different language
            if (user.language !== data.originalLanguage) {
              textToSpeak = await translateText(
                transcribedText,
                data.originalLanguage,
                user.language
              );

              io.to(clientId).emit("message:translated", {
                messageId: message.id,
                translatedContent: textToSpeak,
                targetLanguage: user.language,
              });
            }

            // Try to generate audio for the user's language (optional feature)
            try {
              const audioBuffer = await generateSpeech(textToSpeak, user.language);
              
              io.to(clientId).emit("audio:received", {
                messageId: message.id,
                audioData: audioBuffer.toString('base64'),
                language: user.language,
                mimeType: 'audio/pcm;rate=24000'
              });
              console.log(`✅ SENT TTS AUDIO to ${user.username} in ${user.language}`);
            } catch (ttsError: any) {
              // Check if it's a quota error
              if (ttsError.message?.includes('quota')) {
                console.log(`🚫 TTS QUOTA EXCEEDED - Message transcribed and translated successfully, audio playback unavailable`);
                
                // Send notification to user about quota (optional)
                io.to(clientId).emit("tts:quota-exceeded", {
                  message: "Voice playback unavailable - Gemini API free tier limit (15/day) reached. Text messages continue to work. Upgrade at https://ai.google.dev/pricing"
                });
              } else {
                console.log(`⚠️ TTS failed for ${user.username}, but message was transcribed and translated successfully`);
              }
            }
          } catch (error) {
            console.error("Translation error for user:", user.username, error);
          }
        }
      } catch (error) {
        console.error("Audio send error:", error);
        socket.emit("message:error", { error: "Failed to process audio message" });
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
