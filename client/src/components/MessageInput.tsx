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
}

export function MessageInput({
  onSendMessage,
  onStartVoiceInput,
  onStopVoiceInput,
  isRecording = false,
  placeholder = "Type a message...",
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
    <div className="flex items-end gap-2 p-4 border-t bg-card">
      <div className="flex-1 relative">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          className="resize-none min-h-[52px] max-h-32 pr-12"
          rows={1}
          data-testid="input-message"
        />
      </div>

      {onStartVoiceInput && onStopVoiceInput && (
        <Button
          variant={isRecording ? "default" : "ghost"}
          size="icon"
          onClick={isRecording ? onStopVoiceInput : onStartVoiceInput}
          data-testid="button-voice-input"
          className={cn(
            "transition-all",
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
        data-testid="button-send-message"
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  );
}
