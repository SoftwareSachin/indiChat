# Design Guidelines: Multilingual Chat Platform for Indian Regional Languages

## Design Approach

**Selected Framework:** Material Design with WhatsApp Web & Telegram Web inspiration
**Rationale:** Material Design provides excellent internationalization support, clear visual feedback for real-time interactions, and proven patterns for messaging interfaces. References from WhatsApp Web and Telegram Web ensure familiar, intuitive chat patterns.

## Core Design Principles

1. **Multilingual First:** Interface must gracefully handle multiple Indian scripts (Devanagari, Tamil, Telugu, Bengali, Marathi)
2. **Real-time Clarity:** Instant visual feedback for message states, translation progress, and voice input
3. **Accessible Communication:** Clear controls for speech input/output suitable for diverse user technical literacy
4. **Familiar Patterns:** Leverage established messaging UI conventions for immediate usability

---

## Color Palette

### Light Mode
- **Primary Brand:** 220 85% 55% (Deep Blue) - Trust and communication
- **Primary Variant:** 220 75% 45% (Darker Blue) - Hover states
- **Secondary:** 160 60% 50% (Teal) - Active voice recording, translation indicators
- **Background:** 220 20% 98% (Off-white)
- **Surface:** 0 0% 100% (Pure White) - Chat bubbles, cards
- **Surface Variant:** 220 15% 95% (Light Gray) - Received messages
- **Text Primary:** 220 20% 15%
- **Text Secondary:** 220 10% 45%
- **Success:** 140 60% 50% (Message sent/delivered)
- **Error:** 0 70% 55% (Failed messages)
- **Border:** 220 15% 90%

### Dark Mode
- **Primary Brand:** 220 75% 65%
- **Primary Variant:** 220 80% 55%
- **Secondary:** 160 55% 55%
- **Background:** 220 20% 10%
- **Surface:** 220 15% 14% - Chat bubbles, cards
- **Surface Variant:** 220 15% 18% - Received messages
- **Text Primary:** 220 10% 95%
- **Text Secondary:** 220 8% 70%
- **Success:** 140 50% 55%
- **Error:** 0 65% 60%
- **Border:** 220 10% 25%

---

## Typography

**Font Families:**
- **Primary:** 'Inter' (Latin script) - Clean, highly legible for UI elements
- **Multilingual:** 'Noto Sans' family (Noto Sans Devanagari, Noto Sans Tamil, etc.) - Comprehensive support for Indian scripts with consistent design
- **Monospace:** 'JetBrains Mono' - Timestamps, metadata

**Type Scale:**
- **Heading Large:** 28px / font-bold - App header
- **Heading Medium:** 20px / font-semibold - Section headers
- **Body Large:** 16px / font-normal - Chat messages
- **Body Medium:** 14px / font-normal - Secondary text, metadata
- **Body Small:** 12px / font-normal - Timestamps, status
- **Label:** 13px / font-medium - Buttons, controls

**Line Heights:** 1.5 for body text, 1.3 for headings

---

## Layout System

**Spacing Units:** Consistent use of Tailwind units: 1, 2, 4, 6, 8, 12, 16, 20, 24
- **Micro spacing:** 1, 2 (icon padding, tight gaps)
- **Component spacing:** 4, 6, 8 (between elements)
- **Section spacing:** 12, 16, 20 (between major sections)
- **Layout margins:** 24 (outer boundaries)

**Grid System:**
- Main chat area: Full height flex layout
- Sidebar (user list/language settings): 280px fixed width on desktop, slide-over on mobile
- Message bubbles: max-w-2xl with appropriate padding

---

## Component Library

### A. Navigation & Header
- **Top App Bar:** Fixed header with app logo/name, language selector dropdown, user profile menu
- Height: 64px
- Background: Surface color with subtle border-b
- Include notification indicator for translation status

### B. Chat Interface Components

**Message Bubbles:**
- **Sent Messages:** Right-aligned, Primary color background, white text, rounded-2xl with tail
- **Received Messages:** Left-aligned, Surface Variant background, text primary color, rounded-2xl with tail
- Padding: px-4 py-3
- Max width: max-w-md
- Include sender name (small text), message content, timestamp
- Translation indicator: Small badge showing "Translated from [Language]" in secondary text

**Message States:**
- Sending: Opacity 70%, small spinner icon
- Sent: Single checkmark (text-secondary)
- Delivered: Double checkmark (text-secondary)
- Translation in progress: Animated dots indicator
- Failed: Error icon with red accent, retry button

**Voice Input Button:**
- Floating action button (FAB) in bottom-right of message input area
- Microphone icon from Heroicons
- Active state: Pulsing animation with secondary color
- Shows waveform visualization during recording
- Size: w-12 h-12

**Language Selector:**
- Dropdown menu in top bar with flag icons
- Shows currently selected language prominently
- List displays: Language name in native script + English
- Quick toggle between last two used languages

**Message Input Field:**
- Multi-line text input with auto-resize (max 5 lines)
- Placeholder: "Type a message in [Selected Language]..."
- Border: border-2 focus state with primary color
- Rounded: rounded-xl
- Includes: Voice input button, send button, translation toggle
- Dark mode: Proper background with sufficient contrast

### C. Sidebar Components

**Language Settings Panel:**
- Card-style container with rounded-xl
- Radio buttons or segmented control for language selection
- Translation preferences toggle
- Voice output settings (enable/disable TTS)

**Chat List (if multi-user):**
- List items with avatar, name, last message preview
- Unread indicator: Badge with count
- Active chat: Highlighted with primary color tint

### D. Data Display

**Translation Banner:**
- Appears above translated messages
- Subtle background (surface variant)
- Text: "Original: [Text in source language]" - collapsible
- Padding: p-2, rounded corners

**Typing Indicators:**
- Animated three-dot loader in Surface Variant bubble
- Positioned at bottom of chat stream

**Timestamp Groups:**
- Date separators: Centered, small text, subtle background pill
- Format: "Today", "Yesterday", or date

### E. Status & Feedback

**Toast Notifications:**
- Top-right corner, slide-in animation
- Success: Green accent border-l-4
- Error: Red accent border-l-4
- Info: Blue accent border-l-4
- Auto-dismiss after 4s

**Loading States:**
- Skeleton loaders for chat history
- Spinner for translation in progress
- Progressive loading for older messages

---

## Responsive Behavior

**Desktop (lg: 1024px+):**
- Three-column: Sidebar (280px) | Chat (flex-1) | Info panel (320px, optional)
- Message bubbles: max-w-md

**Tablet (md: 768px-1023px):**
- Two-column: Collapsible sidebar | Chat (flex-1)
- Hide info panel, show on demand

**Mobile (< 768px):**
- Full-width chat interface
- Hamburger menu for sidebar
- Voice button more prominent (larger)
- Message bubbles: max-w-xs

---

## Interaction Patterns

**Voice Recording:**
1. Press and hold microphone button to record
2. Visual feedback: Pulsing circle, waveform animation
3. Release to send, slide to cancel pattern
4. Haptic feedback on mobile (if supported)

**Message Translation:**
- Automatic translation on send if recipient language differs
- Show translation status inline
- Tap translated message to view original
- Smooth expand/collapse animation

**Real-time Updates:**
- New messages: Subtle slide-in from bottom
- Scroll-to-bottom button appears when not at latest message
- Smooth scroll behavior

---

## Accessibility

- **Keyboard Navigation:** Full tab support, clear focus indicators (ring-2 ring-primary)
- **Screen Readers:** Proper ARIA labels for language selections, message status, voice controls
- **High Contrast:** Ensure 4.5:1 contrast ratio minimum for all text
- **Focus Management:** Auto-focus message input after sending, after language change
- **RTL Support:** Prepared for potential Urdu/Arabic additions

---

## Performance Considerations

- Lazy load chat history (virtualized scrolling for long conversations)
- Optimize font loading: Load only required script subsets
- Debounce translation API calls during typing
- Cache translated messages locally
- Use WebSocket for real-time messaging (minimize HTTP overhead)

---

## Unique Features

**Live Translation Toggle:** Switch in message input to enable/disable automatic translation per message
**Voice Playback Button:** Small speaker icon on received messages to trigger TTS playback
**Script Detection:** Auto-detect input language and show confirmation badge
**Connection Status:** Small indicator in app bar (green: connected, yellow: reconnecting, red: offline)