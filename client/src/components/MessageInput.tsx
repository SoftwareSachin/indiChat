import { useState } from "react";
import { Send, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onStartVoiceInput?: () => void;
  onStopVoiceInput?: () => void;
  isRecording?: boolean;
  placeholder?: string;
  onTyping?: () => void;
}

export function MessageInput({
  onSendMessage,
  onStartVoiceInput,
  onStopVoiceInput,
  isRecording = false,
  placeholder = "Type a message...",
  onTyping,
}: MessageInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1 relative">
        <Textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            onTyping?.();
          }}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          className="resize-none min-h-[48px] max-h-32 rounded-xl text-base bg-surface-container dark:bg-surface-container-high border-outline-variant"
          rows={1}
          data-testid="input-message"
        />
      </div>

      {onStartVoiceInput && onStopVoiceInput && (
        <Button
          variant={isRecording ? "default" : "outline"}
          size="icon"
          onClick={isRecording ? onStopVoiceInput : onStartVoiceInput}
          data-testid="button-voice-input"
          className={cn(
            "h-12 w-12 rounded-xl shrink-0",
            isRecording && "animate-pulse"
          )}
        >
          {isRecording ? (
            <MicOff className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </Button>
      )}

      <Button
        onClick={handleSend}
        disabled={!message.trim()}
        size="icon"
        className="h-12 w-12 rounded-xl shrink-0"
        data-testid="button-send-message"
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  );
}
