import { Volume2, Check, CheckCheck, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type MessageStatus = 'sending' | 'sent' | 'delivered' | 'failed';

interface MessageBubbleProps {
  content: string;
  isSent: boolean;
  timestamp: string;
  status?: MessageStatus;
  translatedFrom?: string;
  originalContent?: string;
  onPlayAudio?: () => void;
  userName?: string;
}

export function MessageBubble({
  content,
  isSent,
  timestamp,
  status = 'delivered',
  translatedFrom,
  originalContent,
  onPlayAudio,
  userName,
}: MessageBubbleProps) {
  return (
    <div className={cn("flex gap-2 max-w-[85%] md:max-w-md", isSent ? "ml-auto" : "mr-auto")}>
      <div className={cn("flex flex-col gap-1", isSent ? "items-end" : "items-start")}>
        {!isSent && userName && (
          <span className="text-xs font-medium text-muted-foreground px-3">{userName}</span>
        )}
        
        <div
          className={cn(
            "rounded-2xl px-4 py-3 space-y-2",
            isSent
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-card border border-card-border rounded-bl-md"
          )}
          data-testid={`message-bubble-${isSent ? 'sent' : 'received'}`}
        >
          {translatedFrom && (
            <Badge variant="secondary" className="text-xs mb-1">
              Translated from {translatedFrom}
            </Badge>
          )}
          
          <p className="text-base leading-relaxed break-words">{content}</p>
          
          <div className="flex items-center gap-2 justify-between">
            <span className="text-xs opacity-70 font-mono">{timestamp}</span>
            
            <div className="flex items-center gap-1">
              {onPlayAudio && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={onPlayAudio}
                  data-testid="button-play-audio"
                >
                  <Volume2 className="h-3 w-3" />
                </Button>
              )}
              
              {isSent && (
                <span className="flex items-center">
                  {status === 'sending' && <Clock className="h-3 w-3 opacity-70" />}
                  {status === 'sent' && <Check className="h-3 w-3 opacity-70" />}
                  {status === 'delivered' && <CheckCheck className="h-3 w-3 opacity-70" />}
                  {status === 'failed' && <AlertCircle className="h-3 w-3 text-destructive" />}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
