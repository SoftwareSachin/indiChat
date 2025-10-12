# BharatChat - Multilingual Chat Platform

## Overview

BharatChat is a real-time multilingual chat platform designed specifically for Indian regional languages. The application enables users to communicate across language barriers by providing instant translation, speech-to-text input, and text-to-speech output. It supports six major Indian languages: English, Hindi, Tamil, Telugu, Bengali, and Marathi.

The platform leverages modern web technologies to deliver a WhatsApp-like chat experience with AI-powered translation capabilities, making cross-lingual communication seamless and accessible.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast hot module replacement
- Wouter for lightweight client-side routing
- Tailwind CSS for utility-first styling with custom design tokens

**UI Component Library**
- Radix UI primitives for accessible, unstyled component foundations
- shadcn/ui component system following "New York" style variant
- Custom theme system supporting light/dark modes with HSL color tokens
- Material Design principles with WhatsApp/Telegram-inspired chat interfaces

**State Management**
- Zustand for global chat state management (messages, users, connection status, translations)
- TanStack Query (React Query) for server state management and API caching
- Local component state with React hooks for UI interactions

**Real-time Communication**
- Socket.IO client for WebSocket-based bi-directional communication
- Event-driven architecture for message delivery, typing indicators, and presence

**Speech & Language Features**
- Web Speech API for speech-to-text input (browser-native)
- Web Speech Synthesis API for text-to-speech output
- Language detection and translation via backend API
- Support for Indian language scripts (Devanagari, Tamil, Telugu, Bengali, Marathi)

### Backend Architecture

**Server Framework**
- Express.js as the HTTP server and API framework
- Native HTTP server wrapped with Socket.IO for WebSocket support
- ESM module system for modern JavaScript syntax

**Real-time Layer**
- Socket.IO server for managing WebSocket connections
- Event-based message broadcasting and user presence tracking
- Room-based architecture for potential future group chat features

**API Design**
- RESTful endpoints for user creation, message retrieval, and translation requests
- POST /api/users - User registration
- GET /api/messages - Message history retrieval
- POST /api/translate - Text translation
- POST /api/detect-language - Language detection

**Storage Strategy**
- Interface-based storage abstraction (IStorage) for flexibility
- In-memory storage implementation (MemStorage) for current deployment
- Designed to support database integration (Drizzle ORM configured for PostgreSQL)
- Session management prepared with connect-pg-simple for PostgreSQL sessions

### Data Storage Solutions

**Database Configuration**
- Drizzle ORM configured for PostgreSQL with Neon serverless driver
- Schema defined with two primary tables:
  - `users`: id, username, preferredLanguage
  - `messages`: id, userId, content, translatedContent, originalLanguage, targetLanguage, timestamp
- Migration system set up with drizzle-kit
- Current implementation uses in-memory storage with database-ready schema

**Data Models**
- Zod schemas for runtime validation of user and message inputs
- TypeScript types inferred from Drizzle table definitions
- Separation of insert schemas (InsertUser, InsertMessage) from select types

### External Dependencies

**AI & Translation**
- Google Gemini AI (gemini-2.5-flash model) for text translation and language detection
- API key-based authentication via GEMINI_API_KEY environment variable
- Prompt-based translation with language name mapping for better accuracy

**Database Services**
- Neon serverless PostgreSQL configured but not actively used
- WebSocket support for serverless database connections
- DATABASE_URL environment variable for connection string

**Development Tools**
- Replit-specific plugins for runtime error handling and development banner
- Vite plugin ecosystem for enhanced DX (cartographer, error overlay)

**Font Services**
- Google Fonts for multilingual typography:
  - Inter for Latin script UI elements
  - JetBrains Mono for monospace content
  - Noto Sans Devanagari for Hindi/Marathi
  - Noto Sans Tamil for Tamil
  - Additional Noto Sans variants for other Indian languages

**Build & Development**
- TypeScript for type checking (no emit, bundler handles compilation)
- esbuild for server-side bundling in production
- PostCSS with Autoprefixer for CSS processing

### Authentication & Authorization

**Current Implementation**
- Demo/development mode with client-generated user IDs and random usernames
- No authentication system currently active
- User identification via socket connection and session data

**Prepared Infrastructure**
- Session store configuration with connect-pg-simple
- User schema supports future authentication expansion
- Socket authentication hooks available for implementation

### Architectural Patterns

**Separation of Concerns**
- Shared schema definitions in `/shared` for type consistency
- Clear client/server boundary with API contracts
- Component-based architecture with single responsibility principle

**Scalability Considerations**
- Interface-based storage allows easy swap to persistent database
- WebSocket architecture supports horizontal scaling with Redis adapter (not yet implemented)
- Serverless-ready database configuration for cloud deployment

**Error Handling**
- Centralized Express error middleware
- Try-catch blocks with appropriate HTTP status codes
- Client-side error boundaries and toast notifications

**Performance Optimizations**
- Vite's module federation for code splitting
- React Query caching to reduce API calls
- Infinite stale time for static data
- Message limit controls to prevent memory bloat